process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require";

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");

    console.log("Creating 'Allow all' public RLS policies on 'entrenadores' and 'equipos' tables...");
    
    // Drop existing if they somehow exist (defensive)
    await client.query("DROP POLICY IF EXISTS \"Allow all\" ON entrenadores;");
    await client.query("DROP POLICY IF EXISTS \"Allow all\" ON equipos;");
    await client.query("DROP POLICY IF EXISTS \"Allow all for public\" ON entrenadores;");
    await client.query("DROP POLICY IF EXISTS \"Allow all for public\" ON equipos;");

    // Create new policies
    await client.query("CREATE POLICY \"Allow all\" ON entrenadores FOR ALL TO public USING (true) WITH CHECK (true);");
    await client.query("CREATE POLICY \"Allow all\" ON equipos FOR ALL TO public USING (true) WITH CHECK (true);");

    console.log("RLS policies successfully created.");

    await client.end();
  } catch (err) {
    console.error("Error creating policies:", err.message);
  }
}

run();
