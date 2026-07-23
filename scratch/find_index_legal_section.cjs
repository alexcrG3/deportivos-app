const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/jugadores.index.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for Aspecto Legal y Conformidad in jugadores.index.tsx:");
lines.forEach((line, index) => {
  if (line.includes('Aspecto Legal y Conformidad') || (index > 390 && index < 420)) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
