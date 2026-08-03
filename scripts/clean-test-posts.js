import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  await client.query("DELETE FROM muro_posts WHERE id LIKE 'post_test_%';");
  console.log('✅ Test posts borrados de Supabase');
  await client.end();
}
run();
