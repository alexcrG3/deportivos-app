import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: players } = await supabase.from("jugadores").select("id, nombre, categoria");
  const emilianos = players.filter(p => p.nombre.includes("Emiliano"));
  console.log("Emilianos found in DB:", emilianos);

  const { data: lesiones } = await supabase.from("lesiones").select("*");
  const emilianoLesions = lesiones.filter(l => l.jugador.includes("Emiliano"));
  console.log("Emiliano Lesions in DB:", emilianoLesions);
}

run().catch(console.error);
