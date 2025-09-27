# quran-ayah-coords

This repository contains a comprehensive set of JSON files mapping each Qur’anic ayah to its precise position on high-resolution scanned pages of the Mushaf in old Madani fonts from the King Fahd Quran Complex. These coordinates enable developers and researchers to overlay, align, and analyze ayahs accurately in digital applications.

- **Data origin:** Scanned pages typeset in the classic Madani font at the King Fahd Quran Complex.
- **Contents:** One JSON file per page (e.g., `001.json`, `002.json`, ...), each listing lines and ayah bounding boxes.

---

## JSON Schema

Each record in the JSON files follows this schema:

| Field          | Type    | Description                                            |
| -------------- | ------- | ------------------------------------------------------ |
| `page_number`  | Integer | The scanned page index (1–604).                        |
| `line_number`  | Integer | The line of text on the page where the ayah appears.   |
| `surah_number` | Integer | The chapter (surah) number (1–114).                    |
| `ayah_number`  | Integer | The verse (ayah) number within its surah.              |
| `position`     | Integer | The order of the ayah in this line (1-based).          |
| `min_x`        | Integer | The left X-coordinate (in pixels) of the bounding box. |
| `max_x`        | Integer | The right X-coordinate (in pixels).                    |
| `min_y`        | Integer | The top Y-coordinate (in pixels).                      |
| `max_y`        | Integer | The bottom Y-coordinate (in pixels).                   |

### Example Record

```json
{
  "page_number": 2,
  "line_number": 5,
  "surah_number": 1,
  "ayah_number": 2,
  "position": 1,
  "min_x": 150,
  "max_x": 412,
  "min_y": 320,
  "max_y": 378
}
```

---

## Usage

**Typical use cases:**

- Rendering interactive overlays on scanned Mushaf images
- Aligning text for NLP or machine-learning research
- Digital Qur’an study tools and annotations

---

## Accuracy & Proofreading

All coordinates have been manually created and proofread to the best of our ability. However, minor misalignments may still occur. If you find any errors, please:

1. Open an issue in this repository
2. Provide the page number, line, and ayah details along with corrected coordinates (if possible).

---

## Citation

If you use this dataset in your project, please include link of this repository

---

## License

This dataset is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0).  
You are free to use, modify, and distribute this work.



---

## Note

- **King Fahd Quran Complex:** [http://qurancomplex.gov.sa/](http://qurancomplex.gov.sa/)

---
