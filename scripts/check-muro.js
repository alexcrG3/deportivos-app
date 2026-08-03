import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'muro_posts';");
  console.log('Columns in muro_posts:', res.rows);
  const posts = await client.query("SELECT id, autor, titulo, tiempo, created_at FROM muro_posts ORDER BY created_at DESC LIMIT 10;");
  console.log('Recent posts:', posts.rows);
  await client.end();
}
run();
