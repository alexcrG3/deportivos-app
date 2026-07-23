import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: players, error } = await supabase.from("jugadores").select("id, nombre, categoria, avatar");
  if (error) {
    console.error(error);
    return;
  }
  
  const u13 = players.filter(p => {
    const cat = (p.categoria || "").toLowerCase();
    return cat.includes("u13") || cat.includes("sub-13") || cat.includes("sub13") || cat.includes("13");
  });

  console.log("U13 Players:", u13.slice(0, 5));
}

run().catch(console.error);
