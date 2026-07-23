const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/mock-data.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for store imports/references in mock-data.ts:");
lines.forEach((line, index) => {
  if (line.includes('rendimiento-store') || line.includes('RendimientoStore')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
