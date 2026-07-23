const fs = require('fs');
const path = require('path');

function listAllFiles(dir) {
  const list = [];
  function run(d) {
    const files = fs.readdirSync(d);
    for (const f of files) {
      const p = path.join(d, f);
      const s = fs.statSync(p);
      if (s.isDirectory()) {
        run(p);
      } else {
        list.push(p);
      }
    }
  }
  run(dir);
  return list;
}

try {
  console.log("All files in dist/client:");
  console.log(listAllFiles('d:/AntigravitDev/Athletix OS/dist/client').map(p => p.replace(/\\/g, '/')));
} catch (e) {
  console.error(e);
}
