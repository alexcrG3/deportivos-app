const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/routes/_app/configuracion.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for tabs/panels in configuracion.tsx:");
lines.forEach((line, index) => {
  if (line.includes('<TabsTrigger') || line.includes('<TabsContent') || line.includes('const [') || line.includes('useState')) {
    if (index < 250) { // Limit output to first part
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});
