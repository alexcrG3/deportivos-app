const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/rendimiento-store.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for function hash in store:");
lines.forEach((line, index) => {
  if (line.includes('function hash') || line.includes('const hash =') || line.includes('export function hash')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
