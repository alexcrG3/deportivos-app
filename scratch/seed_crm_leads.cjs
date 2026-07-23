const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    const orgId = "00000000-0000-0000-0000-000000000000";
    
    // Clear any previous raw entries to prevent duplicates on repeat runs
    await client.query("DELETE FROM crm_leads WHERE organizacion_id = $1", [orgId]);
    
    const leads = [
      { nombre: "Adrián Segura", email: "adrian.segura@mail.com", telefono: "8899-1111", estado: "nuevo", categoria_interes: "Fútbol Sub-13" },
      { nombre: "Bastián Mora", email: "bastian.mora@mail.com", telefono: "8899-2222", estado: "interesado", categoria_interes: "Fútbol Sub-13" },
      { nombre: "Daniela Rojas", email: "daniela.rojas@mail.com", telefono: "8899-3333", estado: "prueba", categoria_interes: "Fútbol Sub-15" },
      { nombre: "Esteban Castro", email: "esteban.castro@mail.com", telefono: "8899-4444", estado: "evaluacion", categoria_interes: "Fútbol Sub-13" },
      { nombre: "Fiorella Ortiz", email: "fiorella.ortiz@mail.com", telefono: "8899-5555", estado: "decision", categoria_interes: "Fútbol Sub-15" },
      { nombre: "Gabriel Solano", email: "gabriel.solano@mail.com", telefono: "8899-6666", estado: "aprobado", categoria_interes: "Fútbol Sub-11" },
      { nombre: "Ian Hernández", email: "ian.h@mail.com", telefono: "8899-7777", estado: "nuevo", categoria_interes: "Fútbol Sub-13" },
      { nombre: "Julian Araya", email: "julian.a@mail.com", telefono: "8899-8888", estado: "interesado", categoria_interes: "Fútbol Sub-11" },
      { nombre: "Kendra Quesada", email: "kendra.q@mail.com", telefono: "8899-9999", estado: "prueba", categoria_interes: "Fútbol Sub-15" },
      { nombre: "Luis Fernando", email: "luis.f@mail.com", telefono: "8899-0000", estado: "aprobado", categoria_interes: "Fútbol Sub-13" }
    ];
    
    for (const l of leads) {
      await client.query(
        "INSERT INTO crm_leads (nombre, email, telefono, estado, categoria_interes, organizacion_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [l.nombre, l.email, l.telefono, l.estado, l.categoria_interes, orgId]
      );
    }
    console.log("Successfully seeded 10 CRM leads into the database.");
  } finally {
    await client.end();
  }
}

run().catch(console.error);
