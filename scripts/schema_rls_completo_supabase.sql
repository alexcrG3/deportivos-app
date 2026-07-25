-- ==============================================================================
-- ATHLETIX OS - ESQUEMA COMPLETO Y POLÍTICAS RLS (ROW LEVEL SECURITY) SUPABASE BD
-- ==============================================================================

-- 1. TABLA: DIRECTORIO MÉDICO (Marketplace & Especialistas)
CREATE TABLE IF NOT EXISTS public.directorio_medicos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    especialidad TEXT NOT NULL,
    foto TEXT,
    estrellas NUMERIC(3,2) DEFAULT 5.0,
    resenas_count INTEGER DEFAULT 1,
    ubicacion TEXT NOT NULL,
    provincia TEXT NOT NULL DEFAULT 'San José',
    lat NUMERIC(9,6) DEFAULT 9.9281,
    lng NUMERIC(9,6) DEFAULT -84.0907,
    precio_consulta NUMERIC(10,2) NOT NULL DEFAULT 25000,
    modelo_cobro TEXT NOT NULL DEFAULT 'comision',
    comision_porcentaje NUMERIC(5,2) DEFAULT 10,
    monto_renta_fija NUMERIC(10,2) DEFAULT 15000,
    phone TEXT DEFAULT '50688991122',
    horarios_disponibles JSONB DEFAULT '[]'::jsonb,
    organizacion_id TEXT DEFAULT 'org_asoderive_master',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA: INVENTARIO CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.inventario_categorias (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    icono TEXT,
    items_count INTEGER DEFAULT 0,
    organizacion_id TEXT DEFAULT 'org_asoderive_master',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: INVENTARIO ARTÍCULOS
CREATE TABLE IF NOT EXISTS public.inventario_articulos (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    stock_disponible INTEGER DEFAULT 0,
    stock_prestado INTEGER DEFAULT 0,
    costo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
    punto_reorden INTEGER DEFAULT 5,
    foto TEXT,
    organizacion_id TEXT DEFAULT 'org_asoderive_master',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA: PAGOS & LIBRO DE CAJA GENERAL
CREATE TABLE IF NOT EXISTS public.pagos (
    id TEXT PRIMARY KEY,
    jugador_id TEXT,
    jugador_nombre TEXT,
    monto NUMERIC(10,2) NOT NULL,
    concepto TEXT NOT NULL,
    categoria TEXT DEFAULT 'Mensualidades',
    sede TEXT DEFAULT 'Sede Central',
    metodo TEXT DEFAULT 'Sinpe Móvil',
    fecha DATE DEFAULT CURRENT_DATE,
    estado TEXT DEFAULT 'completado',
    organizacion_id TEXT DEFAULT 'org_asoderive_master',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
ALTER TABLE public.directorio_medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- 6. CREAR POLÍTICAS PERMISIVAS DE LECTURA, INSERCIÓN, EDICIÓN Y ELIMINACIÓN PARA LA APP
DROP POLICY IF EXISTS "Permitir todo en directorio_medicos" ON public.directorio_medicos;
CREATE POLICY "Permitir todo en directorio_medicos"
ON public.directorio_medicos FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en inventario_categorias" ON public.inventario_categorias;
CREATE POLICY "Permitir todo en inventario_categorias"
ON public.inventario_categorias FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en inventario_articulos" ON public.inventario_articulos;
CREATE POLICY "Permitir todo en inventario_articulos"
ON public.inventario_articulos FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en pagos" ON public.pagos;
CREATE POLICY "Permitir todo en pagos"
ON public.pagos FOR ALL
USING (true)
WITH CHECK (true);
