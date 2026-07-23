const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/mock-data.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for 'getPlayerOS':");
lines.forEach((line, index) => {
  if (line.includes('getPlayerOS')) {
    console.log(`${index + 1}: ${line.trim()}`);
    // print 30 lines after
    for (let i = index; i < Math.min(lines.length, index + 35); i++) {
      console.log(`  [${i+1}] ${lines[i]}`);
    }
  }
});
