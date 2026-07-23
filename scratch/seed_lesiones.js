import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://doadnhxmkmklhlszgcwe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYWRuaHhta21rbGhsc3pnY3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MTE0NzksImV4cCI6MjA5OTM4NzQ3OX0.fnfiH-RrWUp1_WXyynvKAxTUZhQuv8r8n6Dww3JvO-M";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const orgId = "00000000-0000-0000-0000-000000000000";

  const injuries = [
    {
      id: "777c777c-777c-777c-777c-777c777c7773",
      jugador_id: "j-1784264204615-2pr8",
      jugador: "Samuel Herrera González",
      fecha: "2026-07-20",
      tipo: "Distensión",
      zona_corporal: "Aductor derecho",
      gravedad: "Leve",
      diagnostico: "Distensión leve del aductor derecho sin rotura fibrilar.",
      tratamiento: ["Ultrasonido terapéutico", "Trabajo isométrico suave", "Estiramiento"],
      dolor: 2,
      movilidad: 85,
      progreso_rtp: 75,
      retorno_checklist: { altaMedica: false, altaDeportiva: false, sinDolor: true, movilidadCompleta: true },
      restricciones: "Evitar golpeo de balón a larga distancia y sprints al 100%.",
      carga_permitida: 50,
      completada: false,
      organizacion_id: orgId
    },
    {
      id: "777c777c-777c-777c-777c-777c777c7774",
      jugador_id: "j-1784264204615-i1jz",
      jugador: "Emiliano Sánchez Delgado",
      fecha: "2026-07-20",
      tipo: "Contusión",
      zona_corporal: "Espinilla izquierda",
      gravedad: "Leve",
      diagnostico: "Fuerte golpe (traumatismo directo) con leve inflamación local.",
      tratamiento: ["Hielo local 15 min", "Compresión", "Reposo relativo"],
      dolor: 3,
      movilidad: 95,
      progreso_rtp: 90,
      retorno_checklist: { altaMedica: true, altaDeportiva: false, sinDolor: true, movilidadCompleta: true },
      restricciones: "Evitar contacto físico directo e impactos directos en la zona.",
      carga_permitida: 80,
      completada: false,
      organizacion_id: orgId
    }
  ];

  console.log("Insertando expedientes de lesiones U13 en Supabase...");
  for (const injury of injuries) {
    const { error } = await supabase.from("lesiones").upsert(injury);
    if (error) {
      console.error(`Error al insertar lesión U13 ${injury.id}:`, error.message);
    } else {
      console.log(`Lesión ${injury.id} para ${injury.jugador} (U13) insertada con éxito.`);
    }
  }
}

run().catch(console.error);
