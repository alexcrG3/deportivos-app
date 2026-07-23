const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/jugadores.$id.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for openEdit or Sheet / Dialog for edit:");
lines.forEach((line, index) => {
  if (line.includes('openEdit') || line.includes('SheetContent') || line.includes('Editar Perfil')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
