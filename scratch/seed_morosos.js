import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Update 3 players to be morosos
  const morosos = [
    { id: "j-1784264180800-dlhi", nombre: "Brayan Zamora Calderón" },
    { id: "j-1784264180800-60b7", nombre: "Yerik Hernández Céspedes" },
    { id: "j-1784264180800-1w88", nombre: "Thierry Leitón Alpízar" }
  ];

  console.log("Actualizando estado de pago a moroso en Supabase...");
  for (const m of morosos) {
    const { error } = await supabase
      .from("jugadores")
      .update({ estado_pago: "moroso", saldo: 50000 })
      .eq("id", m.id);

    if (error) {
      console.error(`Error al actualizar a ${m.nombre}:`, error.message);
    } else {
      console.log(`${m.nombre} actualizado a moroso con saldo 50000.`);
    }
  }
}

run().catch(console.error);
