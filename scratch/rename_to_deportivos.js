import fs from 'fs';
import path from 'path';

const rootDir = 'd:/AntigravitDev/DeportivOS';

const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'dist-static', '.tanstack', '.wrangler']);
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html', '.css', '.jsonc', '.sql', '.toml']);

let fileCount = 0;
let replacementCount = 0;

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        processDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (allowedExtensions.has(ext)) {
        processFile(fullPath);
      }
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Protect DB password in connection strings before replacing
  content = content.replace(/AthletixOS2026!/g, 'AthletixOS2026!');

  let original = content;

  // Replacements
  content = content.replace(/DeportivOS\s+OS/g, 'DeportivOS');
  content = content.replace(/DEPORTIVOS\s+OS/g, 'DEPORTIVOS');
  content = content.replace(/DeportivOS/g, 'DeportivOS');
  content = content.replace(/deportivos/g, 'deportivos');
  content = content.replace(/deportivos/g, 'deportivos');
  content = content.replace(/DeportivOS\s+AI/g, 'DeportivOS AI');
  content = content.replace(/DEPORTIVOS\s+AI/g, 'DEPORTIVOS AI');
  content = content.replace(/DeportivOS/g, 'DeportivOS');
  content = content.replace(/DEPORTIVOS/g, 'DEPORTIVOS');
  content = content.replace(/deportivos/g, 'deportivos');

  // Restore DB password
  content = content.replace(/AthletixOS2026!/g, 'AthletixOS2026!');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    fileCount++;
    console.log(`Updated: ${path.relative(rootDir, filePath)}`);
  }
}

console.log('Starting rename process to DeportivOS...');
processDirectory(rootDir);
console.log(`Finished! Updated ${fileCount} files.`);
