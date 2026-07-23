const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/jugadores.index.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for 'id' or 'numero' in index table:");
lines.forEach((line, index) => {
  if (line.includes('j.id') || line.includes('numero') || line.includes('dorsal')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
