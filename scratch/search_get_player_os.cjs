const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/mock-data.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for getPlayerOS in mock-data.ts:");
lines.forEach((line, index) => {
  if (line.includes('export function getPlayerOS') || (index > 460 && index < 500)) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
