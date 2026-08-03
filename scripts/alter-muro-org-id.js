import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Cambiar la columna organizacion_id de muro_posts a TEXT para admitir string IDs como 'org_asoderive_master'
ALTER TABLE public.muro_posts ALTER COLUMN organizacion_id TYPE TEXT USING organizacion_id::text;
`;

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado a Supabase PostgreSQL');
    await client.query(sql);
    console.log('✅ Columna organizacion_id cambiada a TEXT en muro_posts');
    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

run();
