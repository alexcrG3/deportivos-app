const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/jugadores.$id.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for openEdit dialog in jugadores.$id.tsx:");
lines.forEach((line, index) => {
  if (line.includes('open={openEdit}')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
