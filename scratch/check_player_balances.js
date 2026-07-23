import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: players } = await supabase.from("jugadores").select("id, nombre, estado_pago, saldo");
  const summary = {};
  players.forEach(p => {
    summary[p.estado_pago] = (summary[p.estado_pago] || 0) + 1;
  });
  console.log("Player states count in Supabase:", summary);
  console.log("Players with balance:", players.filter(p => p.saldo > 0).slice(0, 15));
}

run().catch(console.error);
