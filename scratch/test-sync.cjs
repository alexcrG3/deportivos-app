const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://doadnhxmkmklhlszgcwe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  try {
    const { data, error } = await supabase.from("organizaciones").select("*");
    if (error) {
      console.error("Error:", error.message);
    } else {
      console.log("Organizaciones data fetched with anon client:");
      console.log(data.map(o => ({ id: o.id, nombre: o.nombre, logo_len: o.logo ? o.logo.length : 0 })));
    }
  } catch (e) {
    console.error("Exception:", e.message);
  }
}

run();
