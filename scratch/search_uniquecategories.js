import fs from "fs";

const content = fs.readFileSync("src/routes/_app/finanzas.tsx", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("uniqueCategories")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
