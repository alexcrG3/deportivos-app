const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/jugadores.$id.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for setOpenEdit(true) or initialization of edit states:");
lines.forEach((line, index) => {
  if (line.includes('setOpenEdit(true)') || line.includes('handleEdit') || (index > 790 && index < 845)) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
