# Arabic Text Shaping Service

This service uses HarfBuzz to properly shape Arabic text, including complex characters like wasla (ٱ) that don't work with standard font rendering.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python shape.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### GET /
Basic service info

### GET /font-info
Get font metadata and character coverage info

### POST /shape
Shape Arabic text

**Request:**
```json
{
  "text": "فَٱنصَبۡ",
  "script": "arab",
  "lang": "ar",
  "size": 48.0
}
```

**Response:**
```json
{
  "upem": 1000,
  "glyphs": [
    {
      "gid": 123,
      "xAdvance": 500,
      "yAdvance": 0,
      "xOffset": 0,
      "yOffset": 0
    }
  ],
  "direction": "rtl",
  "script": "arab",
  "lang": "ar",
  "success": true,
  "message": "Successfully shaped 6 glyphs"
}
```

### POST /shape-batch
Shape multiple texts in one request

## Testing

Test with curl:
```bash
curl -X POST "http://localhost:8000/shape" \
  -H "Content-Type: application/json" \
  -d '{"text": "فَٱنصَبۡ", "script": "arab", "lang": "ar", "size": 48}'
```

## How It Works

1. **HarfBuzz** analyzes the Arabic text and determines proper glyph shapes and positions
2. **Font file** provides the actual glyph outlines
3. **Service** returns glyph IDs and positioning data
4. **Client** uses this data to render with Skia for perfect Arabic text

This solves the wasla connection issue by using proper Arabic text shaping instead of relying on font fallbacks.
