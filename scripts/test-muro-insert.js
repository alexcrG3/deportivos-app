import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const testPost = {
    id: 'post_test_' + Date.now(),
    autor: 'Test Coach',
    usuario: '@testcoach',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    tiempo: '2 ago · 22:19',
    tipo: 'publicacion',
    contenido: 'Prueba de insercion',
    imagen: null,
    categoria: 'Sub-9',
    likes: 1,
    liked: true,
    saved: false,
    comentarios: JSON.stringify([]),
    organizacion_id: 'org_asoderive_master'
  };
  const keys = Object.keys(testPost).join(', ');
  const vals = Object.values(testPost);
  const placeholders = vals.map((_, i) => '$' + (i + 1)).join(', ');
  const res = await client.query('INSERT INTO muro_posts (' + keys + ') VALUES (' + placeholders + ') RETURNING id;', vals);
  console.log('✅ Inserción de prueba exitosa:', res.rows[0]);
  await client.query("DELETE FROM muro_posts WHERE id LIKE 'post_test_%';");
  await client.end();
}
run();
