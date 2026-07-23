import fs from "fs";

const content = fs.readFileSync("src/lib/rendimiento-store.ts", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("interface Lesion") || line.includes("type Lesion")) {
    console.log(`${idx + 1}: ${line.trim()}`);
    for (let i = 1; i <= 20; i++) {
      console.log(`${idx + 1 + i}: ${lines[idx + i]}`);
    }
  }
});
