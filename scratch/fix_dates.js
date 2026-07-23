import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Migrando registros de wellness...");
  const { data: updatedW, error: errW } = await supabase
    .from("registros_wellness")
    .update({ fecha: "2026-07-17" })
    .eq("fecha", "2026-07-18");

  if (errW) console.error("Error actualizando wellness:", errW);
  else console.log("Wellness migrado con éxito.");

  console.log("Migrando resultados de pruebas físicas...");
  const { data: updatedT, error: errT } = await supabase
    .from("resultados_pruebas_fisicas")
    .update({ fecha: "2026-07-17" })
    .eq("fecha", "2026-07-18");

  if (errT) console.error("Error actualizando pruebas físicas:", errT);
  else console.log("Pruebas físicas migradas con éxito.");
}

run().catch(console.error);
