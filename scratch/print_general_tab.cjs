const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/jugadores.$id.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 430; i < 488; i++) {
  console.log(`[${i+1}] ${lines[i]}`);
}
