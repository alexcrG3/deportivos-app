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

    // 1. Create table entrenadores
    console.log("Creating 'entrenadores' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS entrenadores (
        id VARCHAR PRIMARY KEY,
        nombre VARCHAR,
        correo VARCHAR,
        telefono VARCHAR,
        especialidad VARCHAR,
        disciplina VARCHAR,
        estado VARCHAR,
        avatar TEXT,
        organizacion_id UUID
      );
    `);
    console.log("'entrenadores' table ready.");

    // 2. Create table equipos
    console.log("Creating 'equipos' table if not exists...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS equipos (
        id VARCHAR PRIMARY KEY,
        nombre VARCHAR,
        disciplina VARCHAR,
        categoria VARCHAR,
        entrenador VARCHAR,
        sede VARCHAR,
        estado VARCHAR,
        logo TEXT,
        organizacion_id UUID
      );
    `);
    console.log("'equipos' table ready.");

    // 3. Add missing columns to jugadores table (saldo and sede_id)
    console.log("Adding missing columns to 'jugadores' table...");
    try {
      await client.query(`ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS saldo NUMERIC DEFAULT 0;`);
      console.log("Column 'saldo' added or already exists.");
    } catch (e) {
      console.error("Error adding column 'saldo':", e.message);
    }
    
    try {
      await client.query(`ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS sede_id VARCHAR;`);
      console.log("Column 'sede_id' added or already exists.");
    } catch (e) {
      console.error("Error adding column 'sede_id':", e.message);
    }

    console.log("Database schema configuration complete!");
    await client.end();
  } catch (err) {
    console.error("Error configuring database:", err.message);
  }
}

run();
