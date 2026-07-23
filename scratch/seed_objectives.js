import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const orgId = "00000000-0000-0000-0000-000000000000";

  const objetivos = [
    {
      id: "obj_mateo_1",
      jugador_id: "j-1784264180800-5hvh",
      jugador: "Mateo Rojas Calvo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      tipo: "tecnico",
      titulo: "Mejorar la definición con pierna no hábil",
      progreso: 65,
      fecha_inicio: "2026-07-01",
      fecha_objetivo: "2026-08-15",
      observaciones: "Realizar 50 repeticiones adicionales de remates de zurda después de cada sesión de entrenamiento.",
      estado: "en_progreso",
      organizacion_id: orgId
    },
    {
      id: "obj_mateo_2",
      jugador_id: "j-1784264180800-5hvh",
      jugador: "Mateo Rojas Calvo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      tipo: "fisico",
      titulo: "Incrementar resistencia cardiovascular",
      progreso: 40,
      fecha_inicio: "2026-07-10",
      fecha_objetivo: "2026-08-30",
      observaciones: "Lograr completar el test de Cooper con una marca de 2800 metros.",
      estado: "en_progreso",
      organizacion_id: orgId
    },
    {
      id: "obj_valeria_1",
      jugador_id: "j-1784264180800-xmz",
      jugador: "Valeria Soto Carmona",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      tipo: "tactico",
      titulo: "Posicionamiento defensivo en transición",
      progreso: 80,
      fecha_inicio: "2026-07-05",
      fecha_objetivo: "2026-08-10",
      observaciones: "Mejorar el repliegue rápido al perder el balón en media cancha. Excelente actitud en los partidos de práctica.",
      estado: "en_progreso",
      organizacion_id: orgId
    },
    {
      id: "obj_valeria_2",
      jugador_id: "j-1784264180800-xmz",
      jugador: "Valeria Soto Carmona",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      tipo: "psicologico",
      titulo: "Liderazgo y comunicación en cancha",
      progreso: 50,
      fecha_inicio: "2026-07-12",
      fecha_objetivo: "2026-09-01",
      observaciones: "Asumir la capitanía en el próximo partido amistoso y organizar las marcas en jugadas a balón parado.",
      estado: "en_progreso",
      organizacion_id: orgId
    }
  ];

  console.log("Insertando objetivos en la base de datos...");
  for (const obj of objetivos) {
    const { error } = await supabase.from("objetivos_jugadores").upsert(obj);
    if (error) {
      console.error(`Error al insertar objetivo ${obj.id}:`, error);
    } else {
      console.log(`Objetivo ${obj.id} insertado/actualizado con éxito.`);
    }
  }
}

run().catch(console.error);
