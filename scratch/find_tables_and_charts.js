import fs from "fs";
import path from "path";

const routesDir = "src/routes/_app";
const files = fs.readdirSync(routesDir);

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) return;

  const content = fs.readFileSync(filePath, "utf8");
  
  // Look for TabsList that doesn't have overflow-x-auto
  const hasTabsList = content.includes("<TabsList");
  if (hasTabsList) {
    const tabsListMatches = content.match(/<TabsList[^>]*>/g) || [];
    tabsListMatches.forEach(m => {
      if (!m.includes("overflow-") && !content.includes("overflow-x-auto w-full md:w-auto")) {
        console.log(`[TabsList Potential Overflow] ${file}: ${m}`);
      }
    });
  }

  // Look for Recharts without parent min-w-0 or overflow-hidden
  const hasChart = content.includes("<ResponsiveContainer") || content.includes("Chart");
  if (hasChart) {
    // Just flag files with charts so we can verify them
    console.log(`[Chart Page] ${file}`);
  }
});
