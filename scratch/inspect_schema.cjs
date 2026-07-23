const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    const tables = ["organizaciones", "entrenadores", "sedes"];
    for (const t of tables) {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [t]);
      console.log(`=== Columns of ${t} ===`);
      console.log(res.rows.map(r => `${r.column_name}: ${r.data_type}`));
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
