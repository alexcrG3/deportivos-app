import fs from "fs";

const content = fs.readFileSync("src/lib/rendimiento-store.ts", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("addLesion") || line.includes("getLesiones") || line.includes("lesiones") && line.includes("sync")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
