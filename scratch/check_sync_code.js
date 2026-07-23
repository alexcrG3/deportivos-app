import fs from "fs";

const content = fs.readFileSync("src/lib/rendimiento-store.ts", "utf8");
const lines = content.split("\n");
let inSync = false;
let brackets = 0;
lines.forEach((line, idx) => {
  if (line.includes("syncFromSupabase()")) {
    inSync = true;
  }
  if (inSync) {
    console.log(`${idx + 1}: ${line}`);
    if (line.includes("{")) brackets++;
    if (line.includes("}")) brackets--;
    if (brackets === 0 && idx > 760) {
      inSync = false;
    }
  }
});
