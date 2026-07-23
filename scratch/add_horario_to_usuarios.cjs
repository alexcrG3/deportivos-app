const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    console.log("Adding column 'horario' to public.usuarios table...");
    await client.query(`
      ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS horario VARCHAR(255);
    `);
    
    console.log("Updating existing administrative user schedules for testing...");
    await client.query(`
      UPDATE public.usuarios 
      SET horario = 'L-V 8:00 - 12:00' 
      WHERE email = 'usuario1@academia.com';
    `);

    console.log("Column added and seeded.");
  } catch (e) {
    console.error("Error adding column:", e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
