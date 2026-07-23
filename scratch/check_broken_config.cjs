const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/configuracion.tsx', 'utf8');
const lines = content.split('\n');

console.log("Lines 930 to 985 in configuracion.tsx:");
for (let i = 930; i < 985; i++) {
  if (lines[i] !== undefined) {
    console.log(`[${i+1}] ${lines[i]}`);
  }
}
