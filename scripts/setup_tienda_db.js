import pg from "pg";
import fs from "fs";
import path from "path";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const connectionString = "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres";

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL database successfully.");

    const sqlPath = path.resolve("scripts/schema_tienda_supabase.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    await client.query(sql);
    console.log("SUCCESS: Created tienda_productos and tienda_pedidos tables in Supabase DB!");
  } catch (err) {
    console.error("ERROR running migration:", err);
  } finally {
    await client.end();
  }
}

main();
