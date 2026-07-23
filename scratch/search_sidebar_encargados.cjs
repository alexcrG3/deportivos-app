const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/components/app-sidebar.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for Encargados in app-sidebar.tsx:");
lines.forEach((line, index) => {
  if (line.includes('Encargados') || line.includes('encargados')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
