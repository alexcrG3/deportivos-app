-- =====================================================
-- Athletix OS — Migración de Tablas Faltantes
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =====================================================

-- TABLA: sedes
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

-- TABLA: asistencias_staff
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

-- TABLA: solicitudes_permisos
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

-- TABLA: certificaciones_staff
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

-- TABLA: evaluaciones_staff
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

-- TABLA: nominas_entrenadores
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

-- Habilitar RLS (Row Level Security) en todas las tablas nuevas
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificaciones_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominas_entrenadores ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso: permitir todo a usuarios autenticados
CREATE POLICY IF NOT EXISTS "allow_all_authenticated" ON public.sedes FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "allow_all_authenticated" ON public.asistencias_staff FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "allow_all_authenticated" ON public.solicitudes_permisos FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "allow_all_authenticated" ON public.certificaciones_staff FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "allow_all_authenticated" ON public.evaluaciones_staff FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "allow_all_authenticated" ON public.nominas_entrenadores FOR ALL USING (true);
