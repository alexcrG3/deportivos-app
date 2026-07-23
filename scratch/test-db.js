const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const DATABASE_URL = "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require";
const SUPABASE_URL = "https://doadnhxmkmklhlszgcwe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

async function testPostgres() {
  console.log("Connecting to PostgreSQL...");
  const client = new Client({
    connectionString: DATABASE_URL,
  });
  try {
    await client.connect();
    console.log("PostgreSQL Connected successfully!");
    const res = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\';');
    console.log("Tables in public schema:");
    console.log(res.rows.map(r => r.tablename));
    await client.end();
  } catch (err) {
    console.error("PostgreSQL Connection error:", err.message);
  }
}

async function testSupabase() {
  console.log("\nConnecting to Supabase Client...");
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  try {
    const { data, error } = await supabase.from('jugadores').select('*').limit(1);
    if (error) {
      console.error("Supabase API query error:", error.message, error.details, error.hint);
    } else {
      console.log("Supabase query successful! Sample record count:", data.length);
    }
  } catch (err) {
    console.error("Supabase client connection error:", err.message);
  }
}

async function run() {
  await testPostgres();
  await testSupabase();
}

run();
