const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/jugadores.$id.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for openFicha dialog:");
lines.forEach((line, index) => {
  if (line.includes('open={openFicha}') || (index > 1750 && index < 1810)) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
