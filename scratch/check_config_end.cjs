const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/configuracion.tsx', 'utf8');
const lines = content.split('\n');

console.log("Lines 1120 to the end in configuracion.tsx:");
for (let i = 1120; i < lines.length; i++) {
  console.log(`[${i+1}] ${lines[i]}`);
}
