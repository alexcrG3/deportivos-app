const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/rendimiento-store.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for 'numero':");
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('numero') || line.toLowerCase().includes('dorsal')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
