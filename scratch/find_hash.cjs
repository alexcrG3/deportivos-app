const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/mock-data.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for 'function hash':");
lines.forEach((line, index) => {
  if (line.includes('function hash') || line.includes('const hash =')) {
    console.log(`${index + 1}: ${line.trim()}`);
    for (let i = index; i < Math.min(lines.length, index + 15); i++) {
      console.log(`  [${i+1}] ${lines[i]}`);
    }
  }
});
