const pg = require("pg");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

async function run() {
  // Limpiar sslmode=require del string de conexión para evitar que pg lo interprete de forma estricta
  const connectionString = env.DATABASE_URL.replace("?sslmode=require", "");
  
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  try {
    await client.connect();
    console.log("Conectado con éxito a PostgreSQL.");
    
    // Obtener las columnas de las tablas clave
    const tables = ['jugadores', 'pagos', 'categorias', 'equipos', 'entrenadores', 'sedes'];
    for (const table of tables) {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
      `, [table]);
      console.log(`\n--- TABLA: ${table} ---`);
      res.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`);
      });
    }
    
  } catch (err) {
    console.error("Error conectando a la DB:", err);
  } finally {
    await client.end();
  }
}
run();
