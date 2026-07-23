process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Client } = require("pg");
const c = new Client({
  connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require",
});

async function main() {
  await c.connect();

  // Check equipos table to get U13 team id and name
  const equipos = await c.query(
    "SELECT id, nombre, categoria, entrenador FROM equipos WHERE LOWER(nombre) LIKE '%13%' OR LOWER(categoria) LIKE '%13%' LIMIT 5"
  );
  console.log("EQUIPOS U13:", JSON.stringify(equipos.rows, null, 2));

  if (equipos.rows.length > 0) {
    const u13Team = equipos.rows[0];
    console.log("Updating partido with equipo_id:", u13Team.id, "equipo:", u13Team.nombre);
    await c.query(
      "UPDATE partidos SET equipo_id = $1, equipo = $2 WHERE id = 'partido_heredia_u13_demo'",
      [u13Team.id, u13Team.nombre]
    );
    console.log("✅ Partido updated with real equipo_id and name");
  } else {
    // Just check what teams exist
    const allTeams = await c.query("SELECT id, nombre, categoria FROM equipos LIMIT 10");
    console.log("ALL TEAMS:", JSON.stringify(allTeams.rows, null, 2));
  }

  // Also verify partido
  const p = await c.query("SELECT id, equipo, equipo_id, rival FROM partidos");
  console.log("PARTIDOS FINAL:", JSON.stringify(p.rows, null, 2));

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
