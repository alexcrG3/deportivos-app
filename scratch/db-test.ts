import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    console.log("Conectado con éxito a PostgreSQL.");
    
    // Obtener las tablas
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tablas públicas encontradas:", res.rows.map(r => r.table_name));
    
  } catch (err) {
    console.error("Error conectando a la DB:", err);
  } finally {
    await client.end();
  }
}
run();
