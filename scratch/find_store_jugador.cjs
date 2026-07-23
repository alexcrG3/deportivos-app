const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/rendimiento-store.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for StoreJugador in rendimiento-store.ts:");
lines.forEach((line, index) => {
  if (line.includes('interface StoreJugador') || line.includes('type StoreJugador')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
