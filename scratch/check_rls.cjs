const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    const res = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename IN ('jugadores', 'entrenadores', 'sedes')
    `);
    console.log("RLS Status:");
    console.log(res.rows);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
