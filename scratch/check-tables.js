import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => {
    return client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
  })
  .then(res => {
    console.log('Tables in public schema:');
    res.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    return client.end();
  })
  .catch(err => {
    console.error('Error:', err.message);
  });
