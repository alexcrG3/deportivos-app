const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/rendimiento-store.ts', 'utf8');
const lines = content.split('\n');

console.log("Searching for get/set/localStorage in store:");
lines.forEach((line, index) => {
  if (line.includes('localStorage') || line.includes('public static get(') || line.includes('public static get<')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
