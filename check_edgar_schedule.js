process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from "pg";

const connectionString = "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres";

async function check() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log("Connected to PostgreSQL!");

  const { rows } = await client.query("SELECT * FROM entrenadores WHERE nombre = 'Edgar Calderón'");
  console.log("Edgar Calderón in DB:", rows);

  await client.end();
}

check().catch(console.error);
