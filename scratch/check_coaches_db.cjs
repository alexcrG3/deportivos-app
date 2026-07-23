const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    console.log("Fetching coaches from database...");
    const res = await client.query("SELECT nombre, horario FROM public.entrenadores;");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error("Error querying db:", e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
