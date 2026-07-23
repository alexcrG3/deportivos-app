const fs = require('fs');
const path = require('path');

const assetsDir = 'd:/AntigravitDev/Athletix OS/dist/client/assets';
const files = fs.readdirSync(assetsDir);

const jsFiles = files.filter(f => f.startsWith('index-') && f.endsWith('.js'));
const cssFiles = files.filter(f => f.startsWith('styles-') || (f.endsWith('.css')));

console.log('JS Entrypoints:', jsFiles);
console.log('CSS Entrypoints:', cssFiles);
