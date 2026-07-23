const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    console.log("Creating public.usuarios table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.usuarios (
        id VARCHAR(255) PRIMARY KEY,
        nombre VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        role VARCHAR(255),
        sede_id VARCHAR(255),
        estado VARCHAR(255),
        fecha_creacion VARCHAR(255),
        organizacion_id UUID
      );
    `);
    
    console.log("Disabling RLS on public.usuarios table to allow anonymous client operations...");
    await client.query(`
      ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
    `);

    console.log("Inserting initial default users...");
    await client.query(`
      INSERT INTO public.usuarios (id, nombre, email, role, sede_id, estado, fecha_creacion, organizacion_id)
      VALUES 
        ('u-1', 'Alex', 'alex@mail.com', 'superadmin', 's1', 'activo', '2026-01-01', '00000000-0000-0000-0000-000000000000'),
        ('u-2', 'Usuario1', 'usuario1@academia.com', 'admin', 's1', 'activo', '2026-07-19', '00000000-0000-0000-0000-000000000000')
      ON CONFLICT (email) DO UPDATE 
      SET role = EXCLUDED.role, estado = EXCLUDED.estado;
    `);

    console.log("Table public.usuarios created and seeded successfully.");
  } catch (e) {
    console.error("Error creating table:", e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
