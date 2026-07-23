const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/configuracion.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for all TabsTrigger occurrences:");
lines.forEach((line, index) => {
  if (line.includes('<TabsTrigger')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
