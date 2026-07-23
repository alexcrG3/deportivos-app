import fs from "fs";

const content = fs.readFileSync("src/routes/_app/tactica.pizarra.tsx", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("basePlayers")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
