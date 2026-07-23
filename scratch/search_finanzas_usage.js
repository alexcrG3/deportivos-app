import fs from "fs";

const content = fs.readFileSync("src/routes/_app/finanzas.tsx", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("ingresosMensuales") || line.includes("flujoCajaMensual") || line.includes("ingresosPorSede") || line.includes("ingresosPorMetodo")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
