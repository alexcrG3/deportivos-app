import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: wellness, error: errW } = await supabase.from("registros_wellness").select("*").limit(20);
  if (errW) console.error("Wellness error:", errW);
  else console.log("Wellness:", wellness.map(w => ({ id: w.id, jugador: w.jugador, fecha: w.fecha })));

  const { data: tests, error: errT } = await supabase.from("resultados_pruebas_fisicas").select("*").limit(20);
  if (errT) console.error("Tests error:", errT);
  else console.log("Tests:", tests.map(t => ({ id: t.id, jugador: t.jugador, test: t.test, fecha: t.fecha, resultado: t.resultado })));
}

run().catch(console.error);
