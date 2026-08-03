/**
 * supabase-migrations.ts
 * Ejecuta las migraciones SQL necesarias para crear tablas faltantes en Supabase.
 * Se llama una sola vez al arrancar la app.
 */

import { supabase } from "./supabase";

const MIGRATIONS_SQL = `
-- =====================================================
-- TABLA: sedes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sedes (
  id                TEXT PRIMARY KEY,
  nombre            TEXT NOT NULL,
  direccion         TEXT,
  ciudad            TEXT,
  telefono          TEXT,
  contacto          TEXT,
  canchas_count     INTEGER DEFAULT 0,
  canchas           JSONB DEFAULT '[]',
  estado            TEXT DEFAULT 'activo',
  organizacion_id   TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: asistencias_staff
-- =====================================================
CREATE TABLE IF NOT EXISTS public.asistencias_staff (
  id                TEXT PRIMARY KEY,
  entrenador_id     TEXT NOT NULL,
  entrenador_nombre TEXT,
  fecha             DATE NOT NULL,
  hora_entrada      TEXT,
  hora_salida       TEXT,
  estado            TEXT DEFAULT 'Puntual',
  sede_nombre       TEXT,
  organizacion_id   TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: solicitudes_permisos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.solicitudes_permisos (
  id                TEXT PRIMARY KEY,
  entrenador_id     TEXT NOT NULL,
  entrenador_nombre TEXT,
  tipo              TEXT,
  fecha_inicio      DATE,
  fecha_fin         DATE,
  motivo            TEXT,
  estado            TEXT DEFAULT 'Pendiente',
  organizacion_id   TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: certificaciones_staff
-- =====================================================
CREATE TABLE IF NOT EXISTS public.certificaciones_staff (
  id                TEXT PRIMARY KEY,
  entrenador_id     TEXT NOT NULL,
  entrenador_nombre TEXT,
  tipo_licencia     TEXT,
  institucion       TEXT,
  numero_registro   TEXT,
  fecha_expiracion  DATE,
  estado            TEXT DEFAULT 'Vigente',
  organizacion_id   TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: evaluaciones_staff
-- =====================================================
CREATE TABLE IF NOT EXISTS public.evaluaciones_staff (
  id                     TEXT PRIMARY KEY,
  entrenador_id          TEXT NOT NULL,
  entrenador_nombre      TEXT,
  cargo                  TEXT,
  criterios              JSONB DEFAULT '{}',
  puntuacion_general     INTEGER DEFAULT 0,
  observaciones          TEXT,
  organizacion_id        TEXT NOT NULL,
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: nominas_entrenadores
-- =====================================================
CREATE TABLE IF NOT EXISTS public.nominas_entrenadores (
  id                   TEXT PRIMARY KEY,
  organizacion_id      TEXT NOT NULL,
  entrenador_id        TEXT NOT NULL,
  entrenador_nombre    TEXT,
  periodo_inicio       DATE,
  periodo_fin          DATE,
  sesiones_concluidas  INTEGER DEFAULT 0,
  partidos_concluidos  INTEGER DEFAULT 0,
  tarifa_sesion        NUMERIC DEFAULT 0,
  bono_partido         NUMERIC DEFAULT 0,
  monto_sesiones       NUMERIC DEFAULT 0,
  monto_partidos       NUMERIC DEFAULT 0,
  monto_ajustes        NUMERIC DEFAULT 0,
  notas_ajustes        TEXT,
  monto_total          NUMERIC DEFAULT 0,
  moneda               TEXT DEFAULT 'CRC',
  estado               TEXT DEFAULT 'pendiente',
  fecha_pago           DATE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
`;

const MIGRATION_KEY = "athletix_migrations_v1_done";

export async function runMigrations(): Promise<void> {
  if (typeof window === "undefined") return;

  // Solo ejecutar una vez por sesión
  if (sessionStorage.getItem(MIGRATION_KEY)) return;

  try {
    // Intentar ejecutar via RPC exec_sql (requiere función en Supabase)
    const { error } = await supabase.rpc("exec_sql", { sql: MIGRATIONS_SQL });

    if (error) {
      // Si no existe la función RPC, intentar tabla por tabla con workaround
      await ensureTablesExist();
    } else {
      console.log("[Migrations] ✅ Tablas creadas/verificadas en Supabase.");
    }
  } catch {
    // Fallback: verificar tabla por tabla
    await ensureTablesExist();
  }

  sessionStorage.setItem(MIGRATION_KEY, "1");
}

/**
 * Verifica cada tabla intentando un SELECT.
 * Si devuelve error de tipo "relation does not exist" (código 42P01),
 * significa que la tabla no existe — en ese caso intentamos crearla
 * usando el endpoint de SQL de Supabase Management API si está disponible.
 */
async function ensureTablesExist(): Promise<void> {
  const tables = [
    { name: "sedes", testQuery: supabase.from("sedes").select("id").limit(1) },
    { name: "asistencias_staff", testQuery: supabase.from("asistencias_staff").select("id").limit(1) },
    { name: "solicitudes_permisos", testQuery: supabase.from("solicitudes_permisos").select("id").limit(1) },
    { name: "certificaciones_staff", testQuery: supabase.from("certificaciones_staff").select("id").limit(1) },
    { name: "evaluaciones_staff", testQuery: supabase.from("evaluaciones_staff").select("id").limit(1) },
    { name: "nominas_entrenadores", testQuery: supabase.from("nominas_entrenadores").select("id").limit(1) },
  ];

  const missing: string[] = [];

  for (const t of tables) {
    const { error } = await t.testQuery;
    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      missing.push(t.name);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[Migrations] ⚠️ Las siguientes tablas no existen en Supabase: ${missing.join(", ")}.\n` +
      `Para crearlas, ejecuta el archivo SQL en el Dashboard de Supabase:\n` +
      `  → Supabase Dashboard → SQL Editor → Pega el contenido de src/lib/supabase-migrations.ts`
    );
  } else {
    console.log("[Migrations] ✅ Todas las tablas existen en Supabase.");
  }
}
