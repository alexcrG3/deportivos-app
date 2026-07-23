process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require";

async function testPostgres() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    
    const tables = ['categorias', 'pagos', 'sedes', 'organizacion'];
    for (const table of tables) {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}';
      `);
      console.log(`\nColumns in '${table}' table:`);
      res.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
    }

    await client.end();
  } catch (err) {
    console.error("PostgreSQL Connection error:", err.message);
  }
}

testPostgres();
