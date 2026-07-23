import fs from "fs";

const content = fs.readFileSync("src/routes/_app/tactica.pizarra.tsx", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes("lesion") || line.toLowerCase().includes("lesión") || line.includes("Rtp") || line.includes("rtp") || line.toLowerCase().includes("disponib")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
