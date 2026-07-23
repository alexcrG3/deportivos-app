const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://doadnhxmkmklhlszgcwe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const testJugador = {
    id: "j-test-123",
    nombre: "Test Jugador",
    identificacion: "123456",
    correo: "test@example.com",
    telefono: "12345678",
    genero: "Masculino",
    fecha_nacimiento: "2015-05-05",
    disciplina: "Fútbol",
    categoria: "Sub-10",
    sede: "Sede Norte",
    estado: "activo",
    estado_pago: "al_dia",
    saldo: 0,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    qr: "ATH-QR-test",
    organizacion_id: "00000000-0000-0000-0000-000000000000"
  };

  try {
    console.log("Attempting to upsert jugador...");
    const { data, error } = await supabase.from("jugadores").upsert(testJugador);
    if (error) {
      console.error("Upsert failed:", error.message, error.details, error.hint);
    } else {
      console.log("Upsert succeeded!", data);
    }
  } catch (e) {
    console.error("Thrown exception:", e.message);
  }
}

run();
