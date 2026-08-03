import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  await client.query("DELETE FROM muro_posts WHERE id = 'post_1785731239140';");
  console.log('✅ Publicación duplicada eliminada exitosamente');
  await client.end();
}
run();
