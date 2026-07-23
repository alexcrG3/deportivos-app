const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/DeportivOS/src/routes/_app/jugadores.$id.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for '76':");
lines.forEach((line, index) => {
  if (line.includes('76')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});

console.log("\nSearching for 'dorsal':");
lines.forEach((line, index) => {
  if (line.includes('dorsal') || line.includes('numero') || line.includes('número')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
