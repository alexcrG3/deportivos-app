const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/jugadores.$id.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 1570; i < 1610; i++) {
  if (lines[i] !== undefined) {
    console.log(`[${i+1}] ${lines[i]}`);
  }
}
