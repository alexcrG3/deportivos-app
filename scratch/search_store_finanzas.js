import fs from "fs";

const content = fs.readFileSync("src/lib/rendimiento-store.ts", "utf8");
const lines = content.split("\n");
lines.forEach((line, idx) => {
  if (line.includes("ingresosMensuales") || line.includes("flujoCajaMensual") || line.includes("ingresosPorSede") || line.includes("ingresosPorMetodo") || line.includes("pagos_dynamics")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
