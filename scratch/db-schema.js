import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Obteniendo columnas de las tablas para mapeo...");
  
  // Como Supabase expone la estructura mediante API, podemos insertar un registro ficticio vacío o ver errores
  // Pero lo más limpio es consultar una fila vacía y ver qué llaves retorna la API
  const { data: jData } = await supabase.from("jugadores").select("*").limit(1);
  console.log("Columnas jugadores:", jData ? Object.keys(jData[0] || {}) : "Vacío");

  const { data: pData } = await supabase.from("pagos").select("*").limit(1);
  console.log("Columnas pagos:", pData ? Object.keys(pData[0] || {}) : "Vacío");
  
  const { data: cData } = await supabase.from("categorias").select("*").limit(1);
  console.log("Columnas categorias:", cData ? Object.keys(cData[0] || {}) : "Vacío");
}
run();
