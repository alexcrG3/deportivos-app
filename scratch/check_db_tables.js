import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Query to get table names
  const { data, error } = await supabase.from("pagos").select("*").limit(0);
  if (error) console.error(error);
  
  // Check if we can select from "becas" or "arreglos_pago"
  const tables = ["becados", "becas", "arreglos_pago", "planes_pago", "arreglos_pagos", "acuerdos_pago"];
  for (const t of tables) {
    const { error: err } = await supabase.from(t).select("*").limit(0);
    if (!err) {
      console.log(`Table exists: ${t}`);
    } else {
      console.log(`Table does NOT exist: ${t} (${err.message})`);
    }
  }
}

run().catch(console.error);
