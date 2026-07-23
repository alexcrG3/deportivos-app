const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://doadnhxmkmklhlszgcwe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  try {
    // Let's query all tables to see if they have any rows
    const tables = ['jugadores', 'pagos', 'categorias', 'sedes', 'entrenadores', 'equipos', 'organizacion'];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(5);
      if (error) {
        console.error(`Error querying table ${table}:`, error.message);
      } else {
        console.log(`Table ${table} has ${data.length} records (sample limit 5).`);
        if (data.length > 0) {
          console.log("Sample:", data[0]);
        }
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
