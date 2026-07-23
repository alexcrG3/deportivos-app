-- Tablas de migración para quitar LocalStorage

-- 1. Horarios
CREATE TABLE IF NOT EXISTS horarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dia VARCHAR(50) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    equipo_id VARCHAR(100),
    equipo VARCHAR(100),
    instalacion VARCHAR(100),
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Instalaciones
CREATE TABLE IF NOT EXISTS instalaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    ubicacion TEXT,
    capacidad INT,
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Disciplinas
CREATE TABLE IF NOT EXISTS disciplinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Eventos (Calendario)
CREATE TABLE IF NOT EXISTS eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    tipo VARCHAR(100) DEFAULT 'entrenamiento', -- 'partido', 'reunion', etc.
    equipo_id VARCHAR(100),
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CRM Leads
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    estado VARCHAR(100) DEFAULT 'nuevo', -- 'contactado', 'inscrito', etc.
    categoria_interes VARCHAR(100),
    notas TEXT,
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Pagos
CREATE TABLE IF NOT EXISTS pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jugador_id VARCHAR(100) NOT NULL,
    jugador VARCHAR(255) NOT NULL,
    monto NUMERIC(10,2) NOT NULL,
    fecha DATE NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente', -- 'pagado', 'vencido'
    metodo_pago VARCHAR(100),
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Plantillas Entrenamiento
CREATE TABLE IF NOT EXISTS plantillas_entrenamiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    ejercicios JSONB DEFAULT '[]'::jsonb,
    duracion_total INT DEFAULT 90,
    autor VARCHAR(255),
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Objetivos Jugadores
CREATE TABLE IF NOT EXISTS objetivos_jugadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jugador_id VARCHAR(100) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_limite DATE,
    cumplido BOOLEAN DEFAULT false,
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Minutas Diario (Lecciones)
CREATE TABLE IF NOT EXISTS minutas_diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    equipo VARCHAR(100),
    asistencia JSONB DEFAULT '[]'::jsonb,
    observaciones TEXT,
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Fases Anuales (Planificación)
CREATE TABLE IF NOT EXISTS fases_anuales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    color VARCHAR(50),
    descripcion TEXT,
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Muro Posts
CREATE TABLE IF NOT EXISTS muro_posts (
    id VARCHAR(100) PRIMARY KEY,
    autor VARCHAR(255) NOT NULL,
    usuario VARCHAR(255),
    avatar TEXT,
    tiempo VARCHAR(100),
    ubicacion VARCHAR(100),
    tipo VARCHAR(50) DEFAULT 'publicacion',
    contenido TEXT NOT NULL,
    imagen TEXT,
    likes INT DEFAULT 0,
    liked BOOLEAN DEFAULT false,
    saved BOOLEAN DEFAULT false,
    encuesta JSONB,
    organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
