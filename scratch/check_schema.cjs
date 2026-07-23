const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    const tables = ["sesiones", "partidos", "convocatorias", "objetivos", "diario_entrenador", "evaluaciones", "ejercicios", "plantillas"];
    for (const t of tables) {
      try {
        const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${t}' AND table_schema = 'public' ORDER BY ordinal_position;`);
        if (res.rows.length > 0) {
          console.log(`\n=== ${t} ===`);
          res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
        } else {
          console.log(`\n=== ${t} === DOES NOT EXIST`);
        }
      } catch(e) {
        console.log(`\n=== ${t} === ERROR: ${e.message}`);
      }
    }
  } finally {
    await client.end();
  }
}

run().catch(console.error);
