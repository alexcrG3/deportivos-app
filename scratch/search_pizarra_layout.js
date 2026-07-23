import fs from "fs";

const content = fs.readFileSync("src/routes/_app/tactica.pizarra.tsx", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("grid-cols") || line.includes("col-span") || line.includes("flex-col") || line.includes("Panel") || line.includes("CardTitle")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
