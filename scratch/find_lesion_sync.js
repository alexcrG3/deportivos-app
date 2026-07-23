import fs from "fs";

const content = fs.readFileSync("src/lib/rendimiento-store.ts", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("syncFromSupabase") || (line.includes("from") && line.includes("lesiones"))) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
