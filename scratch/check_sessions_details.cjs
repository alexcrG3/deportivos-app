const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    console.log("=== EXAMINING SESIONES_ENTRENAMIENTO ORGANIZACION ID ===");
    const res = await client.query("SELECT id, nombre, organizacion_id, entrenador_id, entrenador, equipo, categoria FROM sesiones_entrenamiento");
    res.rows.forEach(r => console.log(`${r.id} | ${r.nombre} | OrgID: ${r.organizacion_id} | CoachID: ${r.entrenador_id} | CoachName: ${r.entrenador} | Equipo: ${r.equipo} | Categoria: ${r.categoria}`));
  } finally {
    await client.end();
  }
}

run().catch(console.error);
