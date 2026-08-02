import fs from 'fs';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres";

async function runMigration() {
  console.log("Conectando a Supabase PostgreSQL...");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("✅ Conexión establecida con éxito a Supabase PostgreSQL.");

    const sql = fs.readFileSync('scripts/supabase_schema.sql', 'utf8');
    console.log("Ejecutando script de esquema y políticas RLS...");

    await client.query(sql);
    console.log("\n🎉 ¡MIGRACIÓN DE BASE DE DATOS COMPLETADA EN VIVO EN SUPABASE!");
    console.log("Todas las tablas (organizaciones, perfiles, jugadores, pagos, pizarras, convocatorias, citas_fisioterapia, wellness_registros) y políticas RLS Multi-Tenant han sido creadas e instaladas con éxito.");
  } catch (err) {
    console.error("❌ Error ejecutando migración en Supabase:", err);
  } finally {
    await client.end();
  }
}

runMigration();
