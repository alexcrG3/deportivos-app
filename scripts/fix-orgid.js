process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Client } = require("pg");
const c = new Client({
  connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require",
});

async function main() {
  await c.connect();
  const orgId = "00000000-0000-0000-0000-000000000000";
  await c.query("UPDATE partidos SET organizacion_id = $1::uuid", [orgId]);
  await c.query("UPDATE convocatorias SET organizacion_id = $1::uuid", [orgId]);
  const r = await c.query("SELECT id, rival, organizacion_id, fecha FROM partidos");
  const r2 = await c.query("SELECT id, titulo, organizacion_id FROM convocatorias");
  console.log("PARTIDOS:", JSON.stringify(r.rows, null, 2));
  console.log("CONVOCATORIAS:", JSON.stringify(r2.rows, null, 2));
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
