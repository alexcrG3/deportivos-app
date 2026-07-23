const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/jugadores.$id.tsx', 'utf8');
const lines = content.split('\n');

console.log("Lines 1980 to 2030 in jugadores.$id.tsx:");
for (let i = 1980; i < 2030; i++) {
  if (lines[i] !== undefined) {
    console.log(`[${i+1}] ${lines[i]}`);
  }
}
