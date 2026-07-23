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

    // Add logo column to organizaciones
    console.log("Adding 'logo' column to 'organizaciones' table...");
    try {
      await client.query(`ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS logo TEXT;`);
      console.log("Column 'logo' added to 'organizaciones'.");
    } catch (e) {
      console.error("Error adding logo to organizaciones:", e.message);
    }

    // Add logo column to organizacion
    console.log("Adding 'logo' column to 'organizacion' table...");
    try {
      await client.query(`ALTER TABLE organizacion ADD COLUMN IF NOT EXISTS logo TEXT;`);
      console.log("Column 'logo' added to 'organizacion'.");
    } catch (e) {
      console.error("Error adding logo to organizacion:", e.message);
    }

    console.log("Database schema updated for logo columns successfully!");
    await client.end();
  } catch (err) {
    console.error("Error updating database schema:", err.message);
  }
}

run();
