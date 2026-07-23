const pg = require("pg");

async function run() {
  const client = new pg.Client({ 
    connectionString: "postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  try {
    const orgId = "00000000-0000-0000-0000-000000000000";
    
    // 1. Limpiar datos viejos
    await client.query("DELETE FROM crm_leads WHERE organizacion_id = $1", [orgId]);
    
    // 2. Insertar los 10 Atletas/Leads del Club usando UUIDs reales
    const leads = [
      { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a101", nombre: "Camila Mora", email: "camila.mora@mail.com", telefono: "8899-1111", estado: "nuevo", categoria_interes: "Fútbol Sub-13" },
      { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a102", nombre: "Isabella Castro", email: "isabella.castro@mail.com", telefono: "8899-2222", estado: "prueba", categoria_interes: "Baloncesto Sub-14" },
      { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a103", nombre: "Emma Rojas", email: "emma.rojas@mail.com", telefono: "8899-3333", estado: "nuevo", categoria_interes: "Natación Sub-12" },
      { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a104", nombre: "Renata Hernández", email: "renata.hernandez@mail.com", telefono: "8899-4444", estado: "prueba", categoria_interes: "Voleibol Sub-12" },
      { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a105", nombre: "Martina Núñez", email: "martina.nunez@mail.com", telefono: "8899-5555", estado: "evaluacion", categoria_interes: "Fútbol Sub-13" },
      { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a106", nombre: "Antonella Quesada", email: "antonella.quesada@mail.com", telefono: "8899-6666", estado: "nuevo", categoria_interes: "Baloncesto Sub-14" },
      { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a107", nombre: "Mariana Salazar", email: "mariana.salazar@mail.com", telefono: "8899-7777", estado: "interesado", categoria_interes: "Natación Sub-12" },
      { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a108", nombre: "Lucía Araya", email: "lucia.araya@mail.com", telefono: "8899-8888", estado: "nuevo", categoria_interes: "Voleibol Sub-12" },
      { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a109", nombre: "Gabriela Rodríguez", email: "gabriela.rodriguez@mail.com", telefono: "8899-9999", estado: "prueba", categoria_interes: "Fútbol Sub-13" },
      { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a110", nombre: "Daniela Vargas", email: "daniela.vargas@mail.com", telefono: "8899-0000", estado: "evaluacion", categoria_interes: "Baloncesto Sub-14" }
    ];
    
    for (const l of leads) {
      await client.query(
        "INSERT INTO crm_leads (id, nombre, email, telefono, estado, categoria_interes, organizacion_id) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [l.id, l.nombre, l.email, l.telefono, l.estado, l.categoria_interes, orgId]
      );
    }
    console.log("Database crm_leads successfully seeded with correct UUID formats matching athlete profiles.");
  } finally {
    await client.end();
  }
}

run().catch(console.error);
