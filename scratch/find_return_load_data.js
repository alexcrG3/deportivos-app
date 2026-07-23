import fs from "fs";

const content = fs.readFileSync("src/lib/rendimiento-store.ts", "utf8");
const lines = content.split("\n");
let print = false;
lines.forEach((line, idx) => {
  if (idx >= 1815 && idx <= 1850) {
    console.log(`${idx + 1}: ${line}`);
  }
});
