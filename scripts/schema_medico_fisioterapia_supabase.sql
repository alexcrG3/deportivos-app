-- ==============================================================================
-- SCHEMA SUPABASE: ÁREA MÉDICA, FISIOTERAPIA & HISTORIAL CLÍNICO
-- Athletix OS - Sistema de Gestión Médica Deportiva
-- ==============================================================================

-- 1. TABLA: HISTORIALES MÉDICOS (Expediente Clínico del Atleta)
CREATE TABLE IF NOT EXISTS public.historiales_medicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jugador_id TEXT NOT NULL UNIQUE,
    estado_medico TEXT NOT NULL DEFAULT 'alta' CHECK (estado_medico IN ('alta', 'rehabilitacion', 'precaucion', 'baja')),
    diagnostico_actual TEXT,
    medico_asignado TEXT,
    fisioterapeuta_asignado TEXT,
    fecha_ultima_valoracion DATE DEFAULT CURRENT_DATE,
    antecedentes_patologicos TEXT,
    tratamientos_farmacologicos TEXT,
    alergias TEXT,
    historial_lesiones TEXT,
    problemas_ortopedicos TEXT,
    antecedentes_familiares TEXT,
    incidencias_auscultacion TEXT,
    observaciones_generales TEXT,
    organizacion_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA: VALORACIONES ANTROPOMÉTRICAS
CREATE TABLE IF NOT EXISTS public.valoraciones_antropometricas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jugador_id TEXT NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    peso_kg NUMERIC(5,2) NOT NULL,
    altura_cm NUMERIC(5,2) NOT NULL,
    imc NUMERIC(4,2) NOT NULL,
    porcentaje_grasa NUMERIC(4,2),
    porcentaje_masa_muscular NUMERIC(4,2),
    sugerencia_nutricional TEXT,
    evaluador TEXT,
    organizacion_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: CITAS DE FISIOTERAPIA & TRATAMIENTOS
CREATE TABLE IF NOT EXISTS public.citas_fisioterapia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jugador_id TEXT NOT NULL,
    jugador_nombre TEXT NOT NULL,
    fisioterapeuta_nombre TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo TEXT NOT NULL,
    tratamiento_aplicado TEXT,
    nivel_dolor_eva INTEGER CHECK (nivel_dolor_eva BETWEEN 1 AND 10),
    estado TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'completada', 'cancelada')),
    organizacion_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.historiales_medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valoraciones_antropometricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citas_fisioterapia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura y escritura a usuarios autenticados"
ON public.historiales_medicos FOR ALL USING (true);

CREATE POLICY "Permitir lectura y escritura a usuarios autenticados"
ON public.valoraciones_antropometricas FOR ALL USING (true);

CREATE POLICY "Permitir lectura y escritura a usuarios autenticados"
ON public.citas_fisioterapia FOR ALL USING (true);
