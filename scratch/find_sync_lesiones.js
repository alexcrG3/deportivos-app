import fs from "fs";

const content = fs.readFileSync("src/lib/rendimiento-store.ts", "utf8");
const lines = content.split("\n");
let startLine = -1;
lines.forEach((line, idx) => {
  if (line.includes("public static async syncFromSupabase()")) {
    startLine = idx + 1;
  }
});

if (startLine !== -1) {
  console.log(`syncFromSupabase starts at: ${startLine}`);
  for (let i = 0; i < 200; i++) {
    const l = lines[startLine + i];
    if (l.includes("lesiones")) {
      console.log(`${startLine + i + 1}: ${l.trim()}`);
    }
  }
}
