const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/rendimiento-store.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for top-level calls of getJugadores or similar in rendimiento-store.ts:");
lines.forEach((line, index) => {
  if (line.includes('getJugadores(') && !line.includes('public static') && !line.includes('const list = this.getJugadores()')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
