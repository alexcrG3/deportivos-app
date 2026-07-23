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

    console.log("Inserting default organization...");
    await client.query(`
      INSERT INTO organizaciones (
        id, 
        nombre, 
        slug, 
        correo_admin, 
        pais, 
        moneda, 
        plan_suscripcion, 
        estado, 
        fecha_creacion
      ) 
      VALUES (
        '00000000-0000-0000-0000-000000000000', 
        'Academia Demo', 
        'academia-demo', 
        'admin@demo.com', 
        'CR', 
        'CRC', 
        'premium', 
        'activo', 
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Default organization inserted successfully.");

    await client.end();
  } catch (err) {
    console.error("Error seeding organization:", err.message);
  }
}

run();
