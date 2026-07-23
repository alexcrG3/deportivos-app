process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Client } = require("pg");
const c = new Client({
  connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require",
});

async function main() {
  await c.connect();
  // Fix convocatoria equipo name to match team
  await c.query(
    "UPDATE convocatorias SET equipo = $1, partido_id = $2 WHERE id = 'conv_heredia_u13_demo'",
    ["U13", "partido_heredia_u13_demo"]
  );
  console.log("✅ Convocatoria equipo updated to 'U13'");

  const r = await c.query("SELECT id, titulo, equipo, partido_id FROM convocatorias");
  console.log("CONVOCATORIAS:", JSON.stringify(r.rows, null, 2));
  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
