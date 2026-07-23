const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/mock-data.ts', 'utf8');
const lines = content.split('\n');

for (let i = 80; i < 200; i++) {
  console.log(`[${i+1}] ${lines[i]}`);
}
