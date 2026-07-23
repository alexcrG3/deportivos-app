process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const c = new Client({
  connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require",
});

async function main() {
  await c.connect();
  console.log("Connected to Supabase.");

  const sqlPath = path.join(__dirname, "migration-localstorage.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  console.log("Applying SQL Migrations...");
  await c.query(sql);
  console.log("✅ All 10 tables created successfully in Supabase!");

  await c.end();
}

main().catch(e => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
