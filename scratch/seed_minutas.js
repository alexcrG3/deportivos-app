import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const orgId = "00000000-0000-0000-0000-000000000000";

  // Generar un UUID válido
  const randomUuid = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";

  const minuta = {
    id: randomUuid,
    titulo: "Conducción de balón y transición rápida",
    fecha: "2026-07-20",
    equipo: "Asoderive U13",
    observaciones: "Los jugadores mostraron excelente actitud e intensidad durante los ejercicios de transiciones 3 vs 2. Se reforzó la importancia del repliegue defensivo rápido al perder la posesión del balón. Mateo y Valeria destacaron en el liderazgo del grupo durante la práctica táctica.",
    asistencia: {},
    organizacion_id: orgId
  };

  console.log("Insertando minuta en la base de datos...");
  const { error } = await supabase.from("minutas_diario").upsert(minuta);
  if (error) {
    console.error("Error al insertar minuta:", error);
  } else {
    console.log("Minuta de lección insertada con éxito.");
  }
}

run().catch(console.error);
