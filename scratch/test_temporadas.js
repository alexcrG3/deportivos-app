import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("--- TEST INSERT IN TEMPORADAS ---");
  const testSeason = {
    id: `temp_test_${Date.now()}`,
    nombre: "Test Season",
    inicio: "2026-01-01",
    fin: "2026-12-31",
    sedes: 1,
    equipos: 0,
    disciplinas: ["Fútbol"],
    estado: "activa",
    organizacion_id: "00000000-0000-0000-0000-000000000000"
  };

  const insertRes = await supabase.from("temporadas").insert([testSeason]);
  console.log("Insert result:", insertRes);

  const selectRes = await supabase.from("temporadas").select("*");
  console.log("Select result:", selectRes);
}

run().catch(console.error);
