const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    const res = await client.query(`
      SELECT tablename, policyname, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename IN ('jugadores', 'entrenadores')
    `);
    console.log("Policies:");
    console.log(res.rows);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
