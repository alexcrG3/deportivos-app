process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require";

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");

    const tables = [
      'organizaciones',
      'sedes',
      'disciplinas',
      'temporadas',
      'categorias',
      'pagos',
      'jugadores',
      'sesiones_entrenamiento',
      'banco_pruebas_fisicas',
      'resultados_pruebas_fisicas',
      'lesiones',
      'organizacion',
      'movimientos_caja_hoy',
      'notificaciones',
      'partidos_competicion',
      'objetivos_rendimiento',
      'planes_rendimiento',
      'disponibilidad_jugadores',
      'estadisticas_competicion_jugadores',
      'cargas_jugadores',
      'objetivos_jugadores',
      'evaluaciones_rapidas',
      'registros_wellness',
      'sesiones_recuperacion',
      'clasificaciones',
      'cargas_entrenamiento',
      'plantillas_entrenamiento',
      'trofeos',
      'plantillas_whatsapp',
      'mensajes_whatsapp',
      'flujos_trabajo',
      'registros_flujos_trabajo'
    ];

    console.log("Disabling Row Level Security on all tables...");
    for (const table of tables) {
      await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
    }
    console.log("RLS disabled on all tables successfully.");

    await client.end();
  } catch (err) {
    console.error("Error disabling RLS:", err.message);
  }
}

run();
