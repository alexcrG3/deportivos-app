import pg from "pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const connectionString = "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres";

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- 1. Tabla de Sesiones de Entrenamiento Activas
CREATE TABLE IF NOT EXISTS sesiones_entrenamiento (
    id TEXT PRIMARY KEY,
    organizacion_id TEXT DEFAULT '00000000-0000-0000-0000-000000000000',
    equipo_id TEXT NOT NULL,
    entrenador_id TEXT NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    hora_inicio TIME DEFAULT '16:00',
    hora_fin TIME DEFAULT '17:30',
    duracion_minutos INT DEFAULT 90,
    estado TEXT DEFAULT 'programada', -- 'programada', 'en_curso', 'completada'
    notas_entrenador TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Registro de Asistencia por Sesión
CREATE TABLE IF NOT EXISTS asistencia_registros (
    id TEXT PRIMARY KEY,
    sesion_id TEXT REFERENCES sesiones_entrenamiento(id) ON DELETE CASCADE,
    jugador_id TEXT NOT NULL,
    jugador_nombre TEXT,
    estado_asistencia TEXT NOT NULL DEFAULT 'presente', -- 'presente', 'tarde', 'ausente', 'justificado'
    wellness_color TEXT DEFAULT 'verde', -- 'verde', 'amarillo', 'rojo'
    wellness_alerta_detalle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Reporte de Lesiones e Incidencias en Cancha
CREATE TABLE IF NOT EXISTS incidencias_lesiones (
    id TEXT PRIMARY KEY,
    sesion_id TEXT REFERENCES sesiones_entrenamiento(id),
    jugador_id TEXT NOT NULL,
    jugador_nombre TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    gravedad TEXT NOT NULL, -- 'leve', 'moderada', 'grave'
    zona_corporal TEXT,
    descripcion TEXT,
    notificado_admin BOOLEAN DEFAULT true,
    estado_atencion TEXT DEFAULT 'pendiente_seguro',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE sesiones_entrenamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidencias_lesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura sesiones" ON sesiones_entrenamiento FOR SELECT USING (true);
CREATE POLICY "Permitir escritura sesiones" ON sesiones_entrenamiento FOR ALL USING (true);

CREATE POLICY "Permitir lectura asistencias" ON asistencia_registros FOR SELECT USING (true);
CREATE POLICY "Permitir escritura asistencias" ON asistencia_registros FOR ALL USING (true);

CREATE POLICY "Permitir lectura lesiones" ON incidencias_lesiones FOR SELECT USING (true);
CREATE POLICY "Permitir escritura lesiones" ON incidencias_lesiones FOR ALL USING (true);
`;

async function main() {
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL.");
    await client.query(sql);
    console.log("SUCCESS: Created sesiones_entrenamiento, asistencia_registros, and incidencias_lesiones tables in Supabase DB!");
  } catch (err) {
    console.error("ERROR running migration:", err);
  } finally {
    await client.end();
  }
}

main();
