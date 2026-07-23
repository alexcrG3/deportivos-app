const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    console.log("=== COLUMNS OF resultados_pruebas_fisicas ===");
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'resultados_pruebas_fisicas'");
    res.rows.forEach(r => console.log(r.column_name, ":", r.data_type));
  } finally {
    await client.end();
  }
}

run().catch(console.error);
