const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    const orgId = "00000000-0000-0000-0000-000000000000";
    
    // Asignar el entrenador_id y entrenador name a las sesiones de entrenamiento del equipo U13 (que maneja Edgar Calderón)
    const res = await client.query(
      "UPDATE sesiones_entrenamiento SET entrenador_id = $1, entrenador = $2 WHERE equipo = $3 AND organizacion_id = $4",
      ["t1", "Edgar Calderón", "U13", orgId]
    );
    console.log(`Successfully updated ${res.rowCount} training sessions to belong to Edgar Calderón (t1)`);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
