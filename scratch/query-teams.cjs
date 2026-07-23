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

    const resTeams = await client.query("SELECT id, nombre, entrenador, categoria, organizacion_id FROM equipos;");
    console.log("Teams in Database:");
    console.log(resTeams.rows);

    const resCats = await client.query("SELECT id, nombre, entrenador, organizacion_id FROM categorias;");
    console.log("\nCategories in Database:");
    console.log(resCats.rows);

    await client.end();
  } catch (err) {
    console.error("Error running query:", err.message);
  }
}

run();
