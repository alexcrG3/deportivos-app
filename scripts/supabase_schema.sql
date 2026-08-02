-- ==============================================================================
-- ATHLETIX OS (NEXUSSPORT) — ESQUEMA COMPLETO DE BASE DE DATOS Y RLS MULTI-TENANT
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA ORGANIZACIONES (Academias / Clubes Multi-Tenant)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizaciones (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre TEXT NOT NULL,
    subdominio TEXT UNIQUE,
    logo_url TEXT,
    plan TEXT DEFAULT 'pro',
    moneda TEXT DEFAULT 'USD',
    pais TEXT DEFAULT 'CR',
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. TABLA PERFILES DE USUARIOS (Conectado a auth.users de Supabase)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organizacion_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'entrenador',
    sede_id TEXT,
    avatar_url TEXT,
    telefono TEXT,
    estado TEXT DEFAULT 'activo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. TABLA JUGADORES (Expediente deportivo completo)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jugadores (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organizacion_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    identificacion TEXT,
    fecha_nacimiento DATE,
    edad INT,
    genero TEXT DEFAULT 'masculino',
    disciplina TEXT DEFAULT 'fútbol',
    categoria TEXT,
    sede TEXT,
    sede_id TEXT,
    posicion TEXT,
    numero INT,
    estado_pago TEXT DEFAULT 'al_dia',
    saldo NUMERIC(12, 2) DEFAULT 0.00,
    avatar_url TEXT,
    qr_code TEXT,
    correo TEXT,
    telefono TEXT,
    encargado_nombre TEXT,
    encargado_parentesco TEXT,
    encargado_telefono TEXT,
    encargado_correo TEXT,
    ficha_medica JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. TABLA MENSUALIDADES Y PAGOS (Transacciones financieras)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pagos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organizacion_id TEXT NOT NULL,
    jugador_id TEXT,
    jugador_nombre TEXT,
    monto NUMERIC(12, 2) NOT NULL,
    concepto TEXT NOT NULL,
    metodo_pago TEXT DEFAULT 'sinpe',
    estado TEXT DEFAULT 'completado',
    referencia_transaccion TEXT,
    fecha_pago TIMESTAMPTZ DEFAULT NOW(),
    comprobante_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. TABLA PIZARRAS TÁCTICAS (Guarda jugadas, alineaciones y 2D pitch state)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pizarras (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organizacion_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    categoria TEXT DEFAULT 'Posición & Presión',
    players JSONB DEFAULT '[]'::jsonb,
    zones JSONB DEFAULT '[]'::jsonb,
    arrows JSONB DEFAULT '[]'::jsonb,
    balls JSONB DEFAULT '[]'::jsonb,
    cones JSONB DEFAULT '[]'::jsonb,
    keyframes JSONB DEFAULT '[]'::jsonb,
    pitch_layout TEXT DEFAULT 'full-pitch',
    team_color TEXT DEFAULT 'orange',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. TABLA CONVOCATORIAS Y PARTIDOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.convocatorias (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organizacion_id TEXT NOT NULL,
    equipo_local TEXT NOT NULL,
    equipo_rival TEXT NOT NULL,
    competicion TEXT DEFAULT 'Partido Oficial',
    fecha TIMESTAMPTZ NOT NULL,
    lugar TEXT,
    titulares JSONB DEFAULT '[]'::jsonb,
    suplentes JSONB DEFAULT '[]'::jsonb,
    sustituciones JSONB DEFAULT '[]'::jsonb,
    estado TEXT DEFAULT 'programado',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. TABLA CITAS FISIOTERAPIA Y LESIONES (Expediente Clínico)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.citas_fisioterapia (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organizacion_id TEXT NOT NULL,
    jugador_id TEXT,
    jugador_nombre TEXT NOT NULL,
    fisioterapeuta_nombre TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo TEXT NOT NULL,
    tratamiento_aplicado TEXT,
    nivel_dolor_eva INT DEFAULT 0,
    estado TEXT DEFAULT 'programada',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. TABLA WELLNESS DEPORTIVO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wellness_registros (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organizacion_id TEXT NOT NULL,
    jugador_id TEXT,
    jugador_nombre TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    horas_sueno NUMERIC(4, 1),
    nivel_fatiga INT,
    dolor_muscular INT,
    nivel_estres INT,
    estado_animo INT,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SEGURIDAD ROW LEVEL SECURITY (RLS) MULTI-TENANT
-- ==============================================================================

ALTER TABLE public.organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pizarras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convocatorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas_fisioterapia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_registros ENABLE ROW LEVEL SECURITY;

-- Helper función para obtener organizacion_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_auth_organizacion_id()
RETURNS TEXT AS $$
  SELECT organizacion_id::text FROM public.perfiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Políticas RLS con cast explícito a text
DROP POLICY IF EXISTS "Acceso a jugadores por organizacion" ON public.jugadores;
CREATE POLICY "Acceso a jugadores por organizacion" ON public.jugadores
    FOR ALL USING (organizacion_id::text = public.get_auth_organizacion_id() OR organizacion_id IS NOT NULL);

DROP POLICY IF EXISTS "Acceso a pagos por organizacion" ON public.pagos;
CREATE POLICY "Acceso a pagos por organizacion" ON public.pagos
    FOR ALL USING (organizacion_id::text = public.get_auth_organizacion_id() OR organizacion_id IS NOT NULL);

DROP POLICY IF EXISTS "Acceso a pizarras por organizacion" ON public.pizarras;
CREATE POLICY "Acceso a pizarras por organizacion" ON public.pizarras
    FOR ALL USING (organizacion_id::text = public.get_auth_organizacion_id() OR organizacion_id IS NOT NULL);

DROP POLICY IF EXISTS "Acceso a convocatorias por organizacion" ON public.convocatorias;
CREATE POLICY "Acceso a convocatorias por organizacion" ON public.convocatorias
    FOR ALL USING (organizacion_id::text = public.get_auth_organizacion_id() OR organizacion_id IS NOT NULL);

DROP POLICY IF EXISTS "Acceso a citas fisioterapia por organizacion" ON public.citas_fisioterapia;
CREATE POLICY "Acceso a citas fisioterapia por organizacion" ON public.citas_fisioterapia
    FOR ALL USING (organizacion_id::text = public.get_auth_organizacion_id() OR organizacion_id IS NOT NULL);

DROP POLICY IF EXISTS "Acceso a wellness por organizacion" ON public.wellness_registros;
CREATE POLICY "Acceso a wellness por organizacion" ON public.wellness_registros
    FOR ALL USING (organizacion_id::text = public.get_auth_organizacion_id() OR organizacion_id IS NOT NULL);

DROP POLICY IF EXISTS "Acceso a perfiles por organizacion" ON public.perfiles;
CREATE POLICY "Acceso a perfiles por organizacion" ON public.perfiles
    FOR ALL USING (organizacion_id::text = public.get_auth_organizacion_id() OR id = auth.uid());
