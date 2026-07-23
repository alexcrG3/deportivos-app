process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Client } = require("pg");
const c = new Client({
  connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require",
});

async function main() {
  await c.connect();
  
  // Check what org IDs exist
  const orgs = await c.query("SELECT id, nombre FROM organizaciones LIMIT 5");
  console.log("ORGANIZACIONES:", JSON.stringify(orgs.rows));
  
  const orgOrg = await c.query("SELECT organizacion_id, nombre FROM organizacion LIMIT 5");
  console.log("ORGANIZACION (singular):", JSON.stringify(orgOrg.rows));

  const partidos = await c.query("SELECT id, rival, organizacion_id FROM partidos");
  console.log("PARTIDOS:", JSON.stringify(partidos.rows));

  const convs = await c.query("SELECT id, titulo, organizacion_id FROM convocatorias");
  console.log("CONVOCATORIAS:", JSON.stringify(convs.rows));

  // Check jugadores U13 org_id
  const jug = await c.query("SELECT id, nombre, organizacion_id FROM jugadores WHERE LOWER(categoria) LIKE '%13%' LIMIT 3");
  console.log("JUGADORES U13 sample:", JSON.stringify(jug.rows));

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
