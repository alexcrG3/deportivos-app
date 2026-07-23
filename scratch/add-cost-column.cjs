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

    console.log("Adding column 'costo_mensual' to 'categorias' table...");
    await client.query("ALTER TABLE categorias ADD COLUMN IF NOT EXISTS costo_mensual numeric DEFAULT 30000;");
    console.log("Column 'costo_mensual' successfully added.");

    await client.end();
  } catch (err) {
    console.error("Error altering table:", err.message);
  }
}

run();
