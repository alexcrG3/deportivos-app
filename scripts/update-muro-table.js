import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Añadir columnas faltantes a muro_posts
ALTER TABLE public.muro_posts ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.muro_posts ADD COLUMN IF NOT EXISTS comentarios JSONB DEFAULT '[]'::jsonb;
`;

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado a Supabase PostgreSQL');
    await client.query(sql);
    console.log('✅ Columnas categoria y comentarios agregadas a muro_posts');
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

run();
