import fs from "fs";

const content = fs.readFileSync("src/lib/rendimiento-store.ts", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("static get") && !line.includes("getJugadores") && !line.includes("getEquipos")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
