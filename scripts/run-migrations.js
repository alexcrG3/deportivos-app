import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS public.sedes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion TEXT,
  ciudad TEXT,
  telefono TEXT,
  contacto TEXT,
  canchas_count INTEGER DEFAULT 0,
  canchas JSONB DEFAULT '[]',
  estado TEXT DEFAULT 'activo',
  organizacion_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.asistencias_staff (
  id TEXT PRIMARY KEY,
  entrenador_id TEXT NOT NULL,
  entrenador_nombre TEXT,
  fecha DATE NOT NULL,
  hora_entrada TEXT,
  hora_salida TEXT,
  estado TEXT DEFAULT 'Puntual',
  sede_nombre TEXT,
  organizacion_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.solicitudes_permisos (
  id TEXT PRIMARY KEY,
  entrenador_id TEXT NOT NULL,
  entrenador_nombre TEXT,
  tipo TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  motivo TEXT,
  estado TEXT DEFAULT 'Pendiente',
  organizacion_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.certificaciones_staff (
  id TEXT PRIMARY KEY,
  entrenador_id TEXT NOT NULL,
  entrenador_nombre TEXT,
  tipo_licencia TEXT,
  institucion TEXT,
  numero_registro TEXT,
  fecha_expiracion DATE,
  estado TEXT DEFAULT 'Vigente',
  organizacion_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.evaluaciones_staff (
  id TEXT PRIMARY KEY,
  entrenador_id TEXT NOT NULL,
  entrenador_nombre TEXT,
  cargo TEXT,
  criterios JSONB DEFAULT '{}',
  puntuacion_general INTEGER DEFAULT 0,
  observaciones TEXT,
  organizacion_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.nominas_entrenadores (
  id TEXT PRIMARY KEY,
  organizacion_id TEXT NOT NULL,
  entrenador_id TEXT NOT NULL,
  entrenador_nombre TEXT,
  periodo_inicio DATE,
  periodo_fin DATE,
  sesiones_concluidas INTEGER DEFAULT 0,
  partidos_concluidos INTEGER DEFAULT 0,
  tarifa_sesion NUMERIC DEFAULT 0,
  bono_partido NUMERIC DEFAULT 0,
  monto_sesiones NUMERIC DEFAULT 0,
  monto_partidos NUMERIC DEFAULT 0,
  monto_ajustes NUMERIC DEFAULT 0,
  notas_ajustes TEXT,
  monto_total NUMERIC DEFAULT 0,
  moneda TEXT DEFAULT 'CRC',
  estado TEXT DEFAULT 'pendiente',
  fecha_pago DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado a Supabase PostgreSQL');
    await client.query(sql);
    console.log('✅ Todas las tablas creadas exitosamente en Supabase');
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

run();
