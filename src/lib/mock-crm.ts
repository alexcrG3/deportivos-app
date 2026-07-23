export type CRMStageId = "nuevo" | "interesado" | "prueba" | "evaluacion" | "decision" | "aprobado" | "inscrito";

export interface CRMLead {
  id: string;
  nombre: string;
  disciplina: string;
  categoria: string;
  correo: string;
  telefono: string;
  stage: CRMStageId;
  fuente: string;
  score: number;
  avatar: string;
  edad?: number;
  sede?: string;
  actividades: any[];
  pruebas: any[];
  scouting?: any;
}

export const crmPipelineStages = [
  { id: "nuevo", nombre: "Nuevo Lead", color: "oklch(0.6 0.25 290)" },
  { id: "interesado", nombre: "Interesado / Contactado", color: "oklch(0.65 0.2 200)" },
  { id: "prueba", nombre: "Clase de Prueba", color: "oklch(0.7 0.15 150)" },
  { id: "evaluacion", nombre: "Evaluación Técnica", color: "oklch(0.75 0.18 80)" },
  { id: "decision", nombre: "Decisión Familiar", color: "oklch(0.6 0.12 40)" },
  { id: "aprobado", nombre: "Aprobado", color: "oklch(0.62 0.18 140)" },
];

export const crmLeads = [
  { id: "l1", nombre: "Camila Mora", disciplina: "Fútbol", categoria: "Sub-13", correo: "camila.mora@mail.com", telefono: "8899-1111", stage: "nuevo" as const, fuente: "Sitio web", score: 85, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Camila", edad: 11, sede: "Sede Central" },
  { id: "l2", nombre: "Isabella Castro", disciplina: "Baloncesto", categoria: "Sub-14", correo: "isabella.castro@mail.com", telefono: "8899-2222", stage: "prueba" as const, fuente: "WhatsApp", score: 92, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Isabella", edad: 13, sede: "Sede Central Norte" },
  { id: "l3", nombre: "Emma Rojas", disciplina: "Natación", categoria: "Sub-12", correo: "emma.rojas@mail.com", telefono: "8899-3333", stage: "nuevo" as const, fuente: "Facebook", score: 78, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Emma", edad: 10, sede: "Sede Central Sur" },
  { id: "l4", nombre: "Renata Hernández", disciplina: "Voleibol", categoria: "Sub-12", correo: "renata.hernandez@mail.com", telefono: "8899-4444", stage: "prueba" as const, fuente: "Instagram", score: 88, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Renata", edad: 11, sede: "Sede Central" },
  { id: "l5", nombre: "Martina Núñez", disciplina: "Fútbol", categoria: "Sub-13", correo: "martina.nunez@mail.com", telefono: "8899-5555", stage: "evaluacion" as const, fuente: "Referidos", score: 95, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Martina", edad: 12, sede: "Sede Central Norte" },
  { id: "l6", nombre: "Antonella Quesada", disciplina: "Baloncesto", categoria: "Sub-14", correo: "antonella.quesada@mail.com", telefono: "8899-6666", stage: "nuevo" as const, fuente: "Sitio web", score: 80, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Antonella", edad: 13, sede: "Sede Central Sur" },
  { id: "l7", nombre: "Mariana Salazar", disciplina: "Natación", categoria: "Sub-12", correo: "mariana.salazar@mail.com", telefono: "8899-7777", stage: "interesado" as const, fuente: "Sitio web", score: 84, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Mariana", edad: 11, sede: "Sede Central" },
  { id: "l8", nombre: "Lucía Araya", disciplina: "Voleibol", categoria: "Sub-12", correo: "lucia.araya@mail.com", telefono: "8899-8888", stage: "nuevo" as const, fuente: "WhatsApp", score: 76, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lucia", edad: 11, sede: "Sede Central Norte" },
  { id: "l9", nombre: "Gabriela Rodríguez", disciplina: "Fútbol", categoria: "Sub-13", correo: "gabriela.rodriguez@mail.com", telefono: "8899-9999", stage: "prueba" as const, fuente: "Instagram", score: 90, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Gabriela", edad: 12, sede: "Sede Central Sur" },
  { id: "l10", nombre: "Daniela Vargas", disciplina: "Baloncesto", categoria: "Sub-14", correo: "daniela.vargas@mail.com", telefono: "8899-0000", stage: "evaluacion" as const, fuente: "Referidos", score: 89, avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Daniela", edad: 13, sede: "Sede Central" }
];

export const crmActividades = [
  { id: "act1", leadId: "l1", titulo: "Primer contacto", descripcion: "Se envió información sobre horarios de Fútbol U-13.", fecha: "2026-07-10", responsable: "Coach Ramírez" },
  { id: "act2", leadId: "l2", titulo: "Clase agendada", descripcion: "Confirmó asistencia a clase de prueba grupal el miércoles.", fecha: "2026-07-12", responsable: "Coach Pérez" },
  { id: "act3", leadId: "l5", titulo: "Evaluación completada", descripcion: "Excelente desempeño técnico y físico.", fecha: "2026-07-15", responsable: "Coach Ramírez" }
];

export const crmPruebas = [
  { id: "pr1", leadId: "l1", jugador: "Camila Mora", tipo: "Individual", disciplina: "Fútbol", fecha: "2026-07-13", hora: "14:00", sede: "Sede Central", entrenador: "Coach Ramírez", estado: "programada", resultado: null },
  { id: "pr2", leadId: "l2", jugador: "Isabella Castro", tipo: "Grupal", disciplina: "Baloncesto", fecha: "2026-07-14", hora: "15:30", sede: "Sede Central Norte", entrenador: "Coach Pérez", estado: "completada", resultado: "Apto con observación" },
  { id: "pr3", leadId: "l3", jugador: "Emma Rojas", tipo: "Visoría", disciplina: "Natación", fecha: "2026-07-15", hora: "16:00", sede: "Sede Central Sur", entrenador: "Coach Solano", estado: "programada", resultado: null },
  { id: "pr4", leadId: "l4", jugador: "Renata Hernández", tipo: "Campamento", disciplina: "Voleibol", fecha: "2026-07-11", hora: "17:00", sede: "Sede Central", entrenador: "Coach Ramírez", estado: "completada", resultado: "Apto" },
  { id: "pr5", leadId: "l5", jugador: "Martina Núñez", tipo: "Captación", disciplina: "Fútbol", fecha: "2026-07-12", hora: "18:00", sede: "Sede Central Norte", entrenador: "Coach Pérez", estado: "cancelada", resultado: null },
  { id: "pr6", leadId: "l6", jugador: "Antonella Quesada", tipo: "Individual", disciplina: "Baloncesto", fecha: "2026-07-13", hora: "14:30", sede: "Sede Central Sur", entrenador: "Coach Solano", estado: "programada", resultado: null },
  { id: "pr7", leadId: "l7", jugador: "Mariana Salazar", tipo: "Grupal", disciplina: "Natación", fecha: "2026-07-14", hora: "15:00", sede: "Sede Central", entrenador: "Coach Ramírez", estado: "completada", resultado: "Apto" },
  { id: "pr8", leadId: "l8", jugador: "Lucía Araya", tipo: "Visoría", disciplina: "Voleibol", fecha: "2026-07-10", hora: "16:00", sede: "Sede Central Norte", entrenador: "Coach Pérez", estado: "programada", resultado: null },
  { id: "pr9", leadId: "l9", jugador: "Gabriela Rodríguez", tipo: "Campamento", disciplina: "Fútbol", fecha: "2026-07-16", hora: "17:00", sede: "Sede Central Sur", entrenador: "Coach Solano", estado: "completada", resultado: "No apto" },
  { id: "pr10", leadId: "l10", jugador: "Daniela Vargas", tipo: "Captación", disciplina: "Baloncesto", fecha: "2026-07-17", hora: "18:00", sede: "Sede Central", entrenador: "Coach Ramírez", estado: "cancelada", resultado: null },
  { id: "pr11", leadId: "l2", jugador: "Paula Soto", tipo: "Individual", disciplina: "Natación", fecha: "2026-07-18", hora: "14:00", sede: "Sede Central Norte", entrenador: "Coach Pérez", estado: "programada", resultado: null },
  { id: "pr12", leadId: "l3", jugador: "Valeria Jiménez", tipo: "Grupal", disciplina: "Voleibol", fecha: "2026-07-19", hora: "15:00", sede: "Sede Central Sur", entrenador: "Coach Solano", estado: "completada", resultado: "No apto" },
  { id: "pr13", leadId: "l4", jugador: "Sara Mora", tipo: "Visoría", disciplina: "Fútbol", fecha: "2026-07-20", hora: "16:00", sede: "Sede Central", entrenador: "Coach Ramírez", estado: "programada", resultado: null },
  { id: "pr14", leadId: "l5", jugador: "Mateo Castro", tipo: "Campamento", disciplina: "Baloncesto", fecha: "2026-07-21", hora: "17:00", sede: "Sede Central Norte", entrenador: "Coach Pérez", estado: "completada", resultado: "Apto con observación" }
];

export const crmScouting = [
  { leadId: "l1", tecnica: 82, tactica: 70, fisico: 80, inteligencia: 75, disciplinaScore: 90, actitud: 85, fortalezas: "Gran velocidad y desborde", debilidades: "Falta mejorar control de balón", potencial: 80, recomendacion: "Fichaje recomendado" },
  { leadId: "l2", tecnica: 88, tactica: 85, fisico: 90, inteligencia: 88, disciplinaScore: 95, actitud: 92, fortalezas: "Excelente tiro de media distancia", debilidades: "Agilidad lateral defensiva", potencial: 92, recomendacion: "Fichaje prioritario" },
  { leadId: "l5", tecnica: 92, tactica: 90, fisico: 94, inteligencia: 91, disciplinaScore: 98, actitud: 95, fortalezas: "Visión de juego sobresaliente", debilidades: "Fuerza en contacto físico", potencial: 96, recomendacion: "Fichaje estrella" }
];

export const crmCampanas = [
  { id: "c1", nombre: "Captación Verano 2026", segmento: "Sub-12 / Sede Central", canal: "WhatsApp", enviados: 320, abiertos: 245, conversiones: 28, estado: "activa", inicio: "2026-03-01", fin: "2026-06-30" },
  { id: "c2", nombre: "Open Day Fútbol", segmento: "Fútbol / Todas sedes", canal: "Email", enviados: 180, abiertos: 132, conversiones: 14, estado: "activa", inicio: "2026-03-15", fin: "2026-06-15" },
  { id: "c3", nombre: "Recordatorio inscripciones", segmento: "Leads sin respuesta", canal: "WhatsApp", enviados: 95, abiertos: 78, conversiones: 9, estado: "pausada", inicio: "2026-04-10", fin: "2026-05-10" },
  { id: "c4", nombre: "Visoría Baloncesto Nacional", segmento: "Baloncesto Sub-14/16", canal: "Email", enviados: 240, abiertos: 190, conversiones: 22, estado: "finalizada", inicio: "2026-03-01", fin: "2026-04-15" }
];

export function getCRMLead(id: string) {
  const lead = crmLeads.find((l) => l.id === id);
  if (!lead) return null;
  const actividades = crmActividades.filter((a) => a.leadId === id);
  const pruebas = crmPruebas.filter((p) => p.leadId === id);
  const scouting = crmScouting.find((s) => s.leadId === id);
  return { ...lead, actividades, pruebas, scouting };
}
