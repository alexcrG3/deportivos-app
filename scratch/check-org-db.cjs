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
    console.log("Connected.");
    const res = await client.query("SELECT id, nombre, slug, correo_admin, logo IS NULL as logo_is_null, length(logo) as logo_len FROM organizaciones;");
    console.log(res.rows);
    await client.end();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
