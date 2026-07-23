const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/rendimiento-store.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for addJugador or updateJugador in store:");
lines.forEach((line, index) => {
  if (line.includes('addJugador') || line.includes('updateJugador')) {
    console.log(`${index + 1}: ${line.trim()}`);
    for (let i = index - 1; i < Math.min(lines.length, index + 35); i++) {
      console.log(`  [${i+1}] ${lines[i]}`);
    }
  }
});
