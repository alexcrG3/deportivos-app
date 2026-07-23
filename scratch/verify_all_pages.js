import fs from "fs";
import path from "path";

const routesDir = "src/routes";

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf8");
      
      // Look for hardcoded min-w larger than 350
      const minWMatches = content.match(/min-w-\[(\d+)px\]/g) || [];
      minWMatches.forEach(m => {
        const px = parseInt(m.match(/\d+/)[0]);
        if (px > 350) {
          console.log(`[Hardcoded min-w > 350px] ${file}: ${m}`);
        }
      });

      // Look for hardcoded style="minWidth: ... or style={{minWidth: ...
      const inlineStyleMatches = content.match(/minWidth:\s*["']?(\d+)px["']?/g) || [];
      inlineStyleMatches.forEach(m => {
        const px = parseInt(m.match(/\d+/)[0]);
        if (px > 350) {
          console.log(`[Hardcoded inline minWidth > 350px] ${file}: ${m}`);
        }
      });
    }
  });
}

scanDir(routesDir);
console.log("Scan complete.");
