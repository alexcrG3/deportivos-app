-- 🛒 ESTRUCTURA DE TABLAS SUPABASE PARA LA TIENDA DE UNIFORMES (ATHLETIX STORE)

-- 1. Tabla de Productos y Uniformes (con Stock por Talla JSONB)
CREATE TABLE IF NOT EXISTS tienda_productos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL,
    imagen TEXT DEFAULT '👕',
    popular BOOLEAN DEFAULT false,
    destacado BOOLEAN DEFAULT false,
    tallas JSONB DEFAULT '[]'::jsonb,
    stock_por_talla JSONB DEFAULT '{}'::jsonb,
    colores JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Pedidos de Indumentaria Realizados por Padres / Clientes
CREATE TABLE IF NOT EXISTS tienda_pedidos (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    atleta_nombre TEXT NOT NULL,
    categoria_atleta TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC NOT NULL,
    metodo_pago TEXT NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS (Row Level Security) si aplica
ALTER TABLE tienda_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tienda_pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura abiertas para usuarios autenticados y anon
CREATE POLICY "Permitir lectura productos" ON tienda_productos FOR SELECT USING (true);
CREATE POLICY "Permitir escritura productos" ON tienda_productos FOR ALL USING (true);

CREATE POLICY "Permitir lectura pedidos" ON tienda_pedidos FOR SELECT USING (true);
CREATE POLICY "Permitir escritura pedidos" ON tienda_pedidos FOR ALL USING (true);
