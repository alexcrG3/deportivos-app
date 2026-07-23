process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const { Client } = require("pg");

const connectionString =
  "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require";

// Próximo sábado
const d = new Date();
const daysUntilSat = ((6 - d.getDay() + 7) % 7) || 7;
d.setDate(d.getDate() + daysUntilSat);
const fechaSabado = d.toISOString().split("T")[0];

// org_id de la academia Asoderive (primer registro en tabla organizaciones)
const ORG_ID = "00000000-0000-0000-0000-000000000000"; // se actualiza dinámicamente

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("✅ Conectado a Supabase PostgreSQL");

  // Obtener org_id real
  let orgId = ORG_ID;
  try {
    const orgRes = await client.query(
      "SELECT organizacion_id FROM organizaciones LIMIT 1"
    );
    if (orgRes.rows.length > 0) {
      orgId = orgRes.rows[0].organizacion_id;
      console.log("🏢 Organización encontrada:", orgId);
    }
  } catch (e) {
    console.warn("⚠️ No se pudo obtener org_id:", e.message);
  }

  // ── Crear tabla partidos ──────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS partidos (
      id TEXT PRIMARY KEY,
      equipo_id TEXT,
      equipo TEXT,
      rival TEXT,
      tipo TEXT DEFAULT 'Liga',
      fecha DATE,
      hora TEXT,
      sede TEXT,
      local BOOLEAN DEFAULT true,
      formacion TEXT DEFAULT '4-3-3',
      capitan TEXT,
      estado TEXT DEFAULT 'programado',
      resultado JSONB,
      mvp TEXT,
      eventos JSONB DEFAULT '[]',
      organizacion_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("✅ Tabla partidos OK");

  await client.query(`ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;`).catch(() => {});
  await client.query(`DROP POLICY IF EXISTS allow_all_partidos ON partidos;`).catch(() => {});
  await client.query(`CREATE POLICY allow_all_partidos ON partidos FOR ALL TO public USING (true) WITH CHECK (true);`).catch(() => {});
  console.log("✅ RLS partidos OK");

  // ── Crear tabla convocatorias ─────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS convocatorias (
      id TEXT PRIMARY KEY,
      tipo TEXT DEFAULT 'partido',
      titulo TEXT NOT NULL,
      fecha DATE,
      hora TEXT,
      equipo TEXT,
      entrenador TEXT,
      partido_id TEXT,
      rival TEXT,
      sede TEXT,
      uniforme_local TEXT,
      hora_concentracion TEXT,
      notas TEXT,
      jugadores JSONB DEFAULT '[]',
      organizacion_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("✅ Tabla convocatorias OK");

  await client.query(`ALTER TABLE convocatorias ENABLE ROW LEVEL SECURITY;`).catch(() => {});
  await client.query(`DROP POLICY IF EXISTS allow_all_convocatorias ON convocatorias;`).catch(() => {});
  await client.query(`CREATE POLICY allow_all_convocatorias ON convocatorias FOR ALL TO public USING (true) WITH CHECK (true);`).catch(() => {});
  console.log("✅ RLS convocatorias OK");

  // ── Obtener jugadores U13 para la convocatoria ────────────────────────────
  let jugadoresU13 = [];
  try {
    const jRes = await client.query(
      `SELECT id, nombre, posicion, avatar FROM jugadores WHERE LOWER(categoria) LIKE '%13%' AND organizacion_id = $1 ORDER BY nombre LIMIT 18`,
      [orgId]
    );
    jugadoresU13 = jRes.rows;
    console.log(`✅ ${jugadoresU13.length} jugadores U13 encontrados`);
  } catch (e) {
    console.warn("⚠️ Error obteniendo jugadores:", e.message);
  }

  const posiciones433 = ["POR","DFD","DFC","DFC","DFI","MCD","MC","MCO","EXT","DEL","EXT"];

  const convocados = jugadoresU13.slice(0, 15).map((j, idx) => ({
    id: j.id,
    nombre: j.nombre,
    avatar: j.avatar || `https://i.pravatar.cc/80?u=${j.id}`,
    posicion: j.posicion || posiciones433[idx] || "MED",
    dorsal: idx + 1,
    estado: "pendiente",
  }));

  const reservas = jugadoresU13.slice(15, 18).map((j, idx) => ({
    id: j.id,
    nombre: j.nombre,
    avatar: j.avatar || `https://i.pravatar.cc/80?u=${j.id}`,
    posicion: j.posicion || "MED",
    dorsal: 16 + idx,
    estado: "reserva",
  }));

  const todosConvocados = [...convocados, ...reservas];

  // ── Insertar partido de ejemplo ───────────────────────────────────────────
  const partidoId = "partido_heredia_u13_demo";
  try {
    await client.query(
      `INSERT INTO partidos (id, equipo, rival, tipo, fecha, hora, sede, local, formacion, estado, organizacion_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::uuid)
       ON CONFLICT (id) DO UPDATE SET fecha=$5, estado=$10`,
      [
        partidoId,
        "U13 — Academia Asoderive",
        "Club Heredia FC U13",
        "Liga",
        fechaSabado,
        "10:00",
        "Cancha Academia Asoderive",
        true,
        "4-3-3",
        "programado",
        orgId,
      ]
    );
    console.log(`✅ Partido insertado: vs Heredia U13 el ${fechaSabado}`);
  } catch (e) {
    console.error("❌ Error insertando partido:", e.message);
  }

  // ── Insertar convocatoria ─────────────────────────────────────────────────
  const convId = "conv_heredia_u13_demo";
  try {
    await client.query(
      `INSERT INTO convocatorias (id, tipo, titulo, fecha, hora, equipo, entrenador, partido_id, rival, sede, uniforme_local, hora_concentracion, notas, jugadores, organizacion_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::uuid)
       ON CONFLICT (id) DO UPDATE SET jugadores=$14, fecha=$4`,
      [
        convId,
        "partido",
        "Partido del Sábado vs. Heredia U13 — Jornada 8",
        fechaSabado,
        "10:00",
        "U13 — Academia Asoderive",
        "Edgar Calderón",
        partidoId,
        "Club Heredia FC U13",
        "Cancha Academia Asoderive",
        "Camiseta Blanca / Short Azul",
        "09:00",
        "Puntualidad obligatoria. Presentarse con uniforme completo, botella de agua y refrigerio ligero.",
        JSON.stringify(todosConvocados),
        orgId,
      ]
    );
    console.log(`✅ Convocatoria insertada con ${todosConvocados.length} jugadores`);
  } catch (e) {
    console.error("❌ Error insertando convocatoria:", e.message);
  }

  await client.end();
  console.log("🎉 Seed completo.");
}

run().catch((e) => {
  console.error("❌ Error fatal:", e.message);
  process.exit(1);
});
