const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/jugadores.$id.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for the closing Dialog tag after edit form:");
lines.forEach((line, index) => {
  if (line.includes('</Dialog>') || line.includes('</DialogContent>')) {
    if (index > 1350) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});
