const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/configuracion.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for LegalConfigTab component in configuracion.tsx:");
lines.forEach((line, index) => {
  if (line.includes('function LegalConfigTab') || (index > 250)) {
    console.log(`${index + 1}: ${line}`);
  }
});
