const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/mock-data.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for 'Sofía Rodríguez':");
lines.forEach((line, index) => {
  if (line.includes('Sofía Rodríguez') || line.includes('Sofia Rodriguez')) {
    console.log(`${index + 1}: ${line.trim()}`);
    // print 5 lines before and 15 lines after
    for (let i = Math.max(0, index - 5); i < Math.min(lines.length, index + 25); i++) {
      console.log(`  [${i+1}] ${lines[i]}`);
    }
  }
});
