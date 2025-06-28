const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, 'src/assets/translations');

// Find all en.*.txt files
const files = fs.readdirSync(translationsDir).filter(f => f.startsWith('en.') && f.endsWith('.txt'));

files.forEach(file => {
  const txtPath = path.join(translationsDir, file);
  const jsonPath = txtPath.replace('.txt', '.json');
  const data = fs.readFileSync(txtPath, 'utf8');
  const lines = data.split(/\r?\n/);
  const result = {};
  lines.forEach(line => {
    if (!line.trim()) return;
    const [surah, ayah, ...rest] = line.split('|');
    if (!surah || !ayah || !rest.length) return;
    const translation = rest.join('|').trim();
    if (!result[surah]) result[surah] = {};
    result[surah][ayah] = translation;
  });
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Converted ${file} -> ${path.basename(jsonPath)}`);
});