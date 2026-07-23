const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/equipos.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for 'numero' or 'dorsal' in equipos.tsx:");
lines.forEach((line, index) => {
  if (line.includes('numero') || line.includes('dorsal') || line.includes('dorsales')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
