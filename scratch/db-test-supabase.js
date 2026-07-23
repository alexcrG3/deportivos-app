import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parseador manual
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
  console.log("Intentando listar registros de Supabase...");
  
  // Probemos consultando entrenadores o jugadores
  const { data: jugadores, error: errJ } = await supabase.from("jugadores").select("*").limit(5);
  if (errJ) {
    console.error("Error al consultar jugadores:", errJ.message);
  } else {
    console.log("Jugadores en la DB:", jugadores);
  }

  const { data: pagos, error: errP } = await supabase.from("pagos").select("*").limit(5);
  if (errP) {
    console.error("Error al consultar pagos:", errP.message);
  } else {
    console.log("Pagos en la DB:", pagos);
  }
}
run();
