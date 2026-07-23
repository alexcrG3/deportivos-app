const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    console.log("=== COACHES IN DB ===");
    const resCoaches = await client.query("SELECT id, nombre FROM entrenadores");
    resCoaches.rows.forEach(r => console.log(r.id, ":", r.nombre));
    
    console.log("\n=== TRAINING SESSIONS IN DB ===");
    const resSessions = await client.query("SELECT id, nombre, entrenador, entrenador_id FROM sesiones_entrenamiento LIMIT 10");
    resSessions.rows.forEach(r => console.log(r.id, " - ", r.nombre, " - Coach:", r.entrenador, " - CoachID:", r.entrenador_id));
  } finally {
    await client.end();
  }
}

run().catch(console.error);
