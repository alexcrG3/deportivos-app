const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/mock-data.ts', 'utf8');
const lines = content.split('\n');

for (let i = 480; i < 620; i++) {
  console.log(`[${i+1}] ${lines[i]}`);
}
