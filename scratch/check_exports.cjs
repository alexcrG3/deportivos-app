const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/rendimiento-store.ts', 'utf8');
const lines = content.split('\n');

console.log("Checking export default at the end of rendimiento-store.ts:");
for (let i = lines.length - 20; i < lines.length; i++) {
  if (lines[i] !== undefined) {
    console.log(`[${i+1}] ${lines[i]}`);
  }
}
