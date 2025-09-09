from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fontTools.ttLib import TTFont
import uharfbuzz as hb
import base64
import os
from io import BytesIO

app = FastAPI(title="Arabic Text Shaping Service", version="1.0.0")

# Load font bytes once at startup
FONT_PATH = "../src/assets/fonts/UthmanicHafs1Ver18.ttf"

if not os.path.exists(FONT_PATH):
    raise FileNotFoundError(f"Font file not found: {FONT_PATH}")

with open(FONT_PATH, "rb") as f:
    FONT_BYTES = f.read()

# Load font metadata for debugging
TT = TTFont(BytesIO(FONT_BYTES))

class ShapeRequest(BaseModel):
    text: str
    script: str = "arab"  # Arabic
    lang: str = "ar"
    size: float = 48.0  # font em size for convenience scaling

class ShapeResponse(BaseModel):
    upem: int
    glyphs: list
    direction: str
    script: str
    lang: str
    success: bool
    message: str

@app.get("/")
def root():
    return {
        "service": "Arabic Text Shaping Service",
        "version": "1.0.0",
        "font": "KFGQPC HAFS Uthmanic Script",
        "status": "ready"
    }

@app.get("/font-info")
def font_info():
    """Get font metadata for debugging"""
    try:
        cmap = TT['cmap']
        glyph_count = len(TT.getGlyphSet())
        
        # Check for specific characters
        has_wasla = False
        has_ba = False
        has_alef = False
        
        for table in cmap.tables:
            if 0x0671 in table.cmap:  # wasla
                has_wasla = True
            if 0x0628 in table.cmap:  # ba
                has_ba = True
            if 0x0627 in table.cmap:  # alef
                has_alef = True
        
        return {
            "glyph_count": glyph_count,
            "has_wasla": has_wasla,
            "has_ba": has_ba,
            "has_alef": has_alef,
            "upem": TT['head'].unitsPerEm,
            "font_family": TT['name'].getDebugName(1) if 'name' in TT else "Unknown"
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/shape", response_model=ShapeResponse)
def shape_text(request: ShapeRequest):
    """Shape Arabic text using HarfBuzz"""
    try:
        # HarfBuzz setup
        face = hb.Face(FONT_BYTES)
        font = hb.Font(face)
        
        # Set scale so HarfBuzz advances are in font units
        upem = face.upem
        font.scale = (upem, upem)
        
        # Create buffer and add text
        buf = hb.Buffer()
        buf.add_str(request.text)
        buf.script = request.script
        buf.language = hb.language_from_string(request.lang)
        buf.direction = hb.Direction.RTL  # important for Arabic!
        
        # Shape the text
        hb.shape(font, buf, {})
        
        # Get shaped results
        infos = buf.glyph_infos
        pos = buf.glyph_positions
        
        # Build compact payload: glyph id, x_advance, y_advance, x_offset, y_offset
        glyphs = []
        for i in range(len(infos)):
            gid = infos[i].codepoint
            p = pos[i]
            glyphs.append({
                "gid": int(gid),
                "xAdvance": int(p.x_advance),
                "yAdvance": int(p.y_advance),
                "xOffset": int(p.x_offset),
                "yOffset": int(p.y_offset)
            })
        
        return ShapeResponse(
            upem=upem,
            glyphs=glyphs,
            direction="rtl",
            script=request.script,
            lang=request.lang,
            success=True,
            message=f"Successfully shaped {len(glyphs)} glyphs"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Shaping failed: {str(e)}")

@app.post("/shape-batch")
def shape_batch(requests: list[ShapeRequest]):
    """Shape multiple texts in one request"""
    results = []
    for req in requests:
        try:
            result = shape_text(req)
            results.append(result.dict())
        except Exception as e:
            results.append({
                "text": req.text,
                "success": False,
                "error": str(e)
            })
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
