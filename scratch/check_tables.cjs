const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    console.log("=== TABLES IN DB ===");
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    res.rows.forEach(r => console.log(r.table_name));
  } finally {
    await client.end();
  }
}

run().catch(console.error);
