const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    const orgId = "00000000-0000-0000-0000-000000000000";
    
    // Vincular entrenadores a las sesiones basadas en el equipo/categoría correspondientes
    // Edgar Calderón -> U13 (t1)
    // Tiffany Eduarte -> Sub-12 / Femenino (t2)
    // Eduardo Villa -> Sub-14 (t4)
    // Carlos Araya -> Sub-15 / Mayor (t3)
    
    await client.query("UPDATE sesiones_entrenamiento SET entrenador_id = 't1', entrenador = 'Edgar Calderón' WHERE equipo = 'U13' AND organizacion_id = $1", [orgId]);
    await client.query("UPDATE sesiones_entrenamiento SET entrenador_id = 't2', entrenador = 'Tiffany Eduarte' WHERE (equipo = 'Sub-12' OR equipo = 'Femenino') AND organizacion_id = $1", [orgId]);
    await client.query("UPDATE sesiones_entrenamiento SET entrenador_id = 't4', entrenador = 'Eduardo Villa' WHERE equipo = 'Sub-14' AND organizacion_id = $1", [orgId]);
    await client.query("UPDATE sesiones_entrenamiento SET entrenador_id = 't3', entrenador = 'Carlos Araya' WHERE (equipo = 'Sub-15' OR equipo = 'Mayor') AND organizacion_id = $1", [orgId]);
    
    console.log("Successfully linked training sessions to respective simulated coaches (t1, t2, t3, t4) in Supabase.");
  } finally {
    await client.end();
  }
}

run().catch(console.error);
