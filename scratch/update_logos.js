import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const sourceDir = 'd:/AntigravitDev/Athletix OS/logos nexus sport';
const publicDir = 'd:/AntigravitDev/Athletix OS/public';

console.log('Copying files...');

// 1. Copy Favicon
fs.copyFileSync(
  path.join(sourceDir, 'nexus sport favicon.ico'),
  path.join(publicDir, 'favicon.ico')
);

// 2. Copy Logos
fs.copyFileSync(
  path.join(sourceDir, 'nexus logo.png'),
  path.join(publicDir, 'logo-black.png')
);

fs.copyFileSync(
  path.join(sourceDir, 'nexus logo.png'),
  path.join(publicDir, 'logo.png')
);

fs.copyFileSync(
  path.join(sourceDir, 'nexus sport logo blanco letras.png'),
  path.join(publicDir, 'logo-white.png')
);

console.log('Logos copied successfully!');
