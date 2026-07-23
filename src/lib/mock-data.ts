export type Estado = "activo" | "inactivo";
export type EstadoPago = "al_dia" | "pendiente" | "moroso";
export type EstadoAsistencia = "presente" | "tarde" | "ausente" | "justificado";

export const organizacion = {
  nombre: "Academia Deportiva Élite",
  pais: "Costa Rica",
  moneda: "CRC",
  correo: "admin@elite.com",
  telefono: "+50622223333",
};

export const sedes = [
  { id: "s1", nombre: "Sede Central", direccion: "San José, Av. 10", disciplina: "Fútbol", encargado: "Carlos Méndez", estado: "activo" as Estado, jugadores: 84 },
  { id: "s2", nombre: "Sede Central Norte", direccion: "Heredia, Calle 5", disciplina: "Baloncesto", encargado: "Marco Núñez", estado: "activo" as Estado, jugadores: 46 },
  { id: "s3", nombre: "Sede Central Sur", direccion: "Cartago, Av. Central", disciplina: "Natación", encargado: "Diego Soto", estado: "activo" as Estado, jugadores: 48 },
  { id: "s4", nombre: "Sede Pacífico", direccion: "Puntarenas", disciplina: "Voleibol", encargado: "Laura Vargas", estado: "activo" as Estado, jugadores: 24 },
];

export const disciplinas = [
  { id: "d1", nombre: "Fútbol", icono: "⚽", color: "oklch(0.65 0.16 155)", categorias: 4, sedes: 1, entrenadores: 3, activos: 74 },
  { id: "d2", nombre: "Baloncesto", icono: "🏀", color: "oklch(0.7 0.18 50)", categorias: 2, sedes: 1, entrenadores: 2, activos: 32 },
  { id: "d3", nombre: "Voleibol", icono: "🏐", color: "oklch(0.7 0.15 85)", categorias: 1, sedes: 1, entrenadores: 1, activos: 12 },
  { id: "d4", nombre: "Tenis", icono: "🎾", color: "oklch(0.75 0.18 130)", categorias: 1, sedes: 1, entrenadores: 1, activos: 10 },
  { id: "d5", nombre: "Natación", icono: "🏊", color: "oklch(0.65 0.15 220)", categorias: 2, sedes: 1, entrenadores: 2, activos: 33 },
  { id: "d6", nombre: "Atletismo", icono: "🏃", color: "oklch(0.6 0.2 25)", categorias: 1, sedes: 1, entrenadores: 1, activos: 14 },
  { id: "d9", nombre: "Artes Marciales", icono: "🥋", color: "oklch(0.4 0.05 280)", categorias: 1, sedes: 1, entrenadores: 1, activos: 12 },
  { id: "d10", nombre: "Béisbol", icono: "⚾", color: "oklch(0.6 0.12 70)", categorias: 1, sedes: 1, entrenadores: 1, activos: 15 },
];

const nombresMasculinos = ["Mateo", "Santiago", "Diego", "Lucas", "Tomás", "Joaquín", "Benjamín", "Andrés", "Sebastián", "Alejandro", "Daniel", "Nicolás", "Gabriel", "Felipe", "Samuel"];
const nombresFemeninos = ["Sofía", "Valentina", "Camila", "Isabella", "Emma", "Renata", "Martina", "Antonella", "Mariana", "Lucía", "Gabriela", "Daniela", "Paula", "Valeria", "Sara"];
const nombres = [...nombresFemeninos, ...nombresMasculinos];
const apellidos = ["Rodríguez", "Vargas", "Soto", "Jiménez", "Mora", "Castro", "Rojas", "Hernández", "Núñez", "Quesada", "Salazar", "Araya"];
const disciplinasNombres = ["Fútbol", "Baloncesto", "Natación", "Voleibol", "Tenis", "Artes Marciales", "Atletismo", "Béisbol"];
const categoriasNombres = ["Sub-12", "Sub-14", "Sub-15", "Mayor"];
const estadosPago: EstadoPago[] = ["al_dia", "al_dia", "al_dia", "pendiente", "moroso"];

export function getCategoriaPorEdad(edad: number, disciplina: string, genero: string): string {
  if (disciplina === "Fútbol") {
    if (edad <= 12) return "Sub-12 Fútbol";
    if (edad <= 14) return "Sub-14 Fútbol";
    if (edad <= 15) return "Sub-15 Fútbol";
    return genero === "Femenino" ? "Mayor Femenino" : "Mayor";
  }
  if (disciplina === "Baloncesto") {
    if (edad <= 14) return "Sub-14 Baloncesto";
    return "Juvenil Baloncesto";
  }
  if (disciplina === "Natación") {
    if (edad <= 9) return "Iniciación Natación";
    return "Competitivo Natación";
  }
  if (disciplina === "Voleibol") return "Sub-12 Voleibol";
  if (disciplina === "Tenis") return "Sub-15 Tenis";
  if (disciplina === "Artes Marciales") return "Iniciación Artes Marciales";
  if (disciplina === "Atletismo") return "Juvenil Atletismo";
  if (disciplina === "Béisbol") return "Sub-14 Béisbol";
  
  if (edad <= 12) return "Sub-12";
  if (edad <= 14) return "Sub-14";
  return "Mayor";
}

export function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
export function pick<T>(id: string, salt: string, arr: T[]) { return arr[hash(id + salt) % arr.length]; }
export function rng(id: string, salt: string, min: number, max: number) { return min + (hash(id + salt) % (max - min + 1)); }

export const posicionesPorDisciplina: Record<string, string[]> = {
  "Fútbol": ["Portero", "Defensa central", "Lateral", "Mediocampista", "Volante ofensivo", "Extremo", "Delantero"],
  "Baloncesto": ["Base", "Escolta", "Alero", "Ala-pívot", "Pívot"],
  "Voleibol": ["Armador", "Opuesto", "Central", "Receptor", "Líbero"],
  "Natación": ["Libre", "Espalda", "Pecho", "Mariposa", "Combinado"],
  "Tenis": ["Singles", "Dobles"],
  "Artes Marciales": ["Kata", "Kumite"],
  "Atletismo": ["Velocidad", "Resistencia", "Saltos", "Lanzamientos"],
  "Béisbol": ["Lanzador", "Receptor", "Primera base", "Segunda base", "Tercera base", "Campocorto", "Jardinero izquierdo", "Jardinero central", "Jardinero derecho"],
};

const categoryDistribution = [
  { name: "Sub-12 Fútbol", disciplina: "Fútbol", age: 11, count: 19, gender: "Masculino" },
  { name: "Sub-14 Fútbol", disciplina: "Fútbol", age: 13, count: 18, gender: "Masculino" },
  { name: "Sub-15 Fútbol", disciplina: "Fútbol", age: 14, count: 21, gender: "Masculino" },
  { name: "Mayor Femenino", disciplina: "Fútbol", age: 20, count: 16, gender: "Femenino" },
  { name: "Sub-14 Baloncesto", disciplina: "Baloncesto", age: 13, count: 20, gender: "Masculino" },
  { name: "Juvenil Baloncesto", disciplina: "Baloncesto", age: 17, count: 12, gender: "Femenino" },
  { name: "Iniciación Natación", disciplina: "Natación", age: 8, count: 15, gender: "Mixto" },
  { name: "Competitivo Natación", disciplina: "Natación", age: 14, count: 18, gender: "Mixto" },
  { name: "Sub-12 Voleibol", disciplina: "Voleibol", age: 12, count: 12, gender: "Mixto" },
  { name: "Sub-15 Tenis", disciplina: "Tenis", age: 14, count: 10, gender: "Mixto" },
  { name: "Iniciación Artes Marciales", disciplina: "Artes Marciales", age: 10, count: 12, gender: "Mixto" },
  { name: "Juvenil Atletismo", disciplina: "Atletismo", age: 16, count: 14, gender: "Mixto" },
  { name: "Sub-14 Béisbol", disciplina: "Béisbol", age: 13, count: 15, gender: "Masculino" },
];
const youngerFemaleAvatars = [1, 2, 9, 10, 16, 20, 22, 24, 27, 28, 30, 32, 34, 35, 38];
const youngerMaleAvatars = [3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 17, 25, 33, 36];
const olderFemaleAvatars = [21, 23, 26, 29, 31, 40, 42, 44, 45, 47, 48, 49, 56, 70];
const olderMaleAvatars = [37, 46, 50, 51, 52, 53, 54, 55, 57, 58, 59, 60, 61, 62, 63, 64, 65, 67, 68, 69];

export const jugadores: any[] = [];

export const pagos: any[] = [];
export const ingresosMensuales: any[] = [];
export const crecimientoJugadores: any[] = [];
export const categorias: any[] = [];

export const entrenadores = [
  { id: "t1", nombre: "Carlos Araya", identificacion: "112345678", telefono: "+50688881111", whatsapp: "+50688881111", correo: "carlos@elite.com", especialidad: "Fútbol técnico", disciplinas: ["Fútbol"], categorias: 0, sedeId: "s1", horario: "L–V 14:00–20:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=11" },
  { id: "t3", nombre: "Laura Vargas", identificacion: "133445566", telefono: "+50688883333", whatsapp: "+50688883333", correo: "laura@elite.com", especialidad: "Baloncesto base / Voleibol", disciplinas: ["Baloncesto", "Voleibol"], categorias: 0, sedeId: "s4", horario: "M–S 13:00–19:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=20" },
  { id: "t4", nombre: "Marco Núñez", identificacion: "144556677", telefono: "+50688884444", whatsapp: "+50688884444", correo: "marco@elite.com", especialidad: "Baloncesto avanzado", disciplinas: ["Baloncesto"], categorias: 0, sedeId: "s2", horario: "L–V 16:00–20:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=13" },
  { id: "t5", nombre: "Diego Soto", identificacion: "155667788", telefono: "+50688885555", whatsapp: "+50688885555", correo: "diego@elite.com", especialidad: "Natación", disciplinas: ["Natación"], categorias: 0, sedeId: "s3", horario: "L–S 06:00–12:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=14" },
  { id: "t6", nombre: "Sofía Hidalgo", identificacion: "166778899", telefono: "+50688886666", whatsapp: "+50688886666", correo: "sofia@elite.com", especialidad: "Natación competitiva", disciplinas: ["Natación"], categorias: 0, sedeId: "s3", horario: "M–V 14:00–20:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=21" },
  { id: "t7", nombre: "Ana Rojas", identificacion: "177889900", telefono: "+50688887777", whatsapp: "+50688887777", correo: "ana@elite.com", especialidad: "Baloncesto femenino", disciplinas: ["Baloncesto"], categorias: 0, sedeId: "s2", horario: "L–V 14:00–18:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=22" },
  { id: "t8", nombre: "Roberto Ruiz", identificacion: "188990011", telefono: "+50688888888", whatsapp: "+50688888888", correo: "roberto@elite.com", especialidad: "Fútbol juvenil", disciplinas: ["Fútbol"], categorias: 0, sedeId: "s1", horario: "L–V 16:00–20:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=15" },
  { id: "t9", nombre: "Laura Castro", identificacion: "199001122", telefono: "+50688889999", whatsapp: "+50688889999", correo: "lcastro@elite.com", especialidad: "Fútbol femenino", disciplinas: ["Fútbol"], categorias: 0, sedeId: "s1", horario: "M–V 17:00–21:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=23" },
  { id: "t10", nombre: "Juan Pérez", identificacion: "200112233", telefono: "+50688880001", whatsapp: "+50688880001", correo: "juan@elite.com", especialidad: "Tenis individual", disciplinas: ["Tenis"], categorias: 0, sedeId: "s1", horario: "L–V 14:00–18:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=34" },
  { id: "t11", nombre: "Pedro Ortiz", identificacion: "211223344", telefono: "+50688880002", whatsapp: "+50688880002", correo: "pedro@elite.com", especialidad: "Karate Do", disciplinas: ["Artes Marciales"], categorias: 0, sedeId: "s4", horario: "L–V 15:00–19:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=35" },
  { id: "t12", nombre: "Sofía Rojas", identificacion: "222334455", telefono: "+50688880003", whatsapp: "+50688880003", correo: "srojas@elite.com", especialidad: "Velocidad y resistencia", disciplinas: ["Atletismo"], categorias: 0, sedeId: "s2", horario: "L–V 16:00–20:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=36" },
  { id: "t13", nombre: "José Delgado", identificacion: "233445566", telefono: "+50688880004", whatsapp: "+50688880004", correo: "jdelgado@elite.com", especialidad: "Lanzamiento y bateo", disciplinas: ["Béisbol"], categorias: 0, sedeId: "s3", horario: "M–S 14:00–19:00", estado: "activo" as Estado, avatar: "https://i.pravatar.cc/100?img=37" },
];

export const equipos = [
  { id: "eq1", nombre: "Élite Sub-12 A", categoria: "Sub-12 Fútbol", disciplina: "Fútbol", entrenador: "Carlos Méndez", jugadores: 0, uniforme: "Azul / Blanco", estado: "activo" as Estado },
  { id: "eq7", nombre: "Élite Sub-14", categoria: "Sub-14 Fútbol", disciplina: "Fútbol", entrenador: "Roberto Ruiz", jugadores: 0, uniforme: "Azul / Blanco", estado: "activo" as Estado },
  { id: "eq2", nombre: "Élite Sub-15", categoria: "Sub-15 Fútbol", disciplina: "Fútbol", entrenador: "Roberto Ruiz", jugadores: 0, uniforme: "Azul / Negro", estado: "activo" as Estado },
  { id: "eq3", nombre: "Élite Femenino", categoria: "Mayor Femenino", disciplina: "Fútbol", entrenador: "Laura Castro", jugadores: 0, uniforme: "Rojo / Blanco", estado: "activo" as Estado },
  { id: "eq4", nombre: "Halcones Sub-14", categoria: "Sub-14 Baloncesto", disciplina: "Baloncesto", entrenador: "Marco Núñez", jugadores: 0, uniforme: "Naranja / Negro", estado: "activo" as Estado },
  { id: "eq5", nombre: "Halcones Femenino", categoria: "Juvenil Baloncesto", disciplina: "Baloncesto", entrenador: "Ana Rojas", jugadores: 0, uniforme: "Negro / Rosa", estado: "activo" as Estado },
  { id: "eq6", nombre: "Delfines Élite", categoria: "Competitivo Natación", disciplina: "Natación", entrenador: "Sofía Hidalgo", jugadores: 0, uniforme: "Azul marino", estado: "activo" as Estado },
  { id: "eq8", nombre: "Élite Voleibol", categoria: "Sub-12 Voleibol", disciplina: "Voleibol", entrenador: "Laura Vargas", jugadores: 0, uniforme: "Azul / Amarillo", estado: "activo" as Estado },
  { id: "eq9", nombre: "Academia Tenis", categoria: "Sub-15 Tenis", disciplina: "Tenis", entrenador: "Juan Pérez", jugadores: 0, uniforme: "Blanco / Verde", estado: "activo" as Estado },
  { id: "eq10", nombre: "Garra Marcial", categoria: "Iniciación Artes Marciales", disciplina: "Artes Marciales", entrenador: "Pedro Ortiz", jugadores: 0, uniforme: "Karategui Blanco", estado: "activo" as Estado },
  { id: "eq11", nombre: "Gacelas del Viento", categoria: "Juvenil Atletismo", disciplina: "Atletismo", entrenador: "Sofía Rojas", jugadores: 0, uniforme: "Negro / Amarillo", estado: "activo" as Estado },
  { id: "eq12", nombre: "Cachorros Béisbol", categoria: "Sub-14 Béisbol", disciplina: "Béisbol", entrenador: "José Delgado", jugadores: 0, uniforme: "Gris / Rojo", estado: "activo" as Estado },
];

export const instalaciones: any[] = [];
export const horarios: any[] = [];
export const asistenciaHoy: any[] = [];
export const asistenciaMensual: any[] = [];
export const eventos: any[] = [];
export const facturas: any[] = [];
export const cajasHistorico: any[] = [];
export const movimientosCajaHoy: any[] = [];
export const cajaActual = { ingresos: 0, egresos: 0, saldo: 0 };
export const workflows: any[] = [];
export const workflowLogs: any[] = [];
export const whatsappMessages: any[] = [];
export const whatsappTemplates: any[] = [];
export const emailLogs: any[] = [];
export const notificaciones: any[] = [];
export const auditoria: any[] = [];
export const flujoCajaMensual: any[] = [];
export const ingresosPorSede: any[] = [];
export const ingresosPorMetodo: any[] = [];

export type EstadoOperativo = "habilitado" | "tolerancia" | "aviso" | "restriccion";

export const estadoOperativoMeta: Record<EstadoOperativo, { label: string; desc: string; dot: string; bg: string; text: string; ring: string }> = {
  habilitado:  { label: "Habilitado",  desc: "Al día · permitido entrenar",            dot: "bg-success",            bg: "bg-success/10",          text: "text-success",        ring: "ring-success/30" },
  tolerancia:  { label: "Tolerancia",  desc: "Atraso leve · permitido entrenar",       dot: "bg-emerald-500",        bg: "bg-emerald-500/10",      text: "text-emerald-600",    ring: "ring-emerald-500/30" },
  aviso:       { label: "Aviso",       desc: "≈2 semanas de mora · notificar",         dot: "bg-warning",            bg: "bg-warning/15",          text: "text-warning",        ring: "ring-warning/40" },
  restriccion: { label: "Restricción", desc: "+2 cuotas · requiere aprobación",        dot: "bg-destructive",        bg: "bg-destructive/10",      text: "text-destructive",    ring: "ring-destructive/40" },
};

export function ensureParentData(j: any): any {
  if (!j) return j;
  const parts = (j.nombre || "").trim().split(/\s+/);
  const firstName = parts[0] || "Jugador";
  const fatherLastName = parts[1] || "Rodríguez";
  const motherLastName = parts[2] || parts[1] || "Mora";

  let seed = 0;
  const str = (j.id || "") + (j.nombre || "seed");
  for (let i = 0; i < str.length; i++) seed = (seed * 31 + str.charCodeAt(i)) | 0;
  seed = Math.abs(seed);

  const nombresPadre = ["Carlos", "Juan", "Luis", "Jorge", "José", "Marco", "Roberto", "Andrés", "Diego", "Mauricio"];
  const nombresMadre = ["María", "Ana", "Laura", "Sofía", "Patricia", "Carolina", "Carmen", "Katia", "Lucía", "Elena"];
  const apellidosExtra = ["Vargas", "Soto", "Jiménez", "Castro", "Rojas", "Hernández", "Núñez", "Quesada", "Salazar", "Araya"];

  const ocupacionesPadre = ["Ingeniero Civil", "Administrador de Empresas", "Comerciante", "Abogado", "Arquitecto", "Médico Cirujano", "Contador Público", "Docente Universitario", "Empresario"];
  const ocupacionesMadre = ["Docente", "Contadora Pública", "Enfermera Especialista", "Administradora", "Arquitecta", "Odontóloga", "Psicóloga", "Directora de Ventas", "Abogada"];

  const empresasPadre = ["ICE (Instituto Costarricense de Electricidad)", "Dos Pinos", "BAC Credomatic", "Corporación Multi Inversiones", "Empresa Privada S.A.", "Constructora Nacional", "Consultoría Profesional"];
  const empresasMadre = ["Ministerio de Educación Pública (MEP)", "Caja Costarricense de Seguro Social (CCSS)", "Grupo Monge", "Scotiabank", "Hospital CIMA", "Universidad de Costa Rica", "Independiente"];

  const padreNombreGen = `${nombresPadre[seed % nombresPadre.length]} ${fatherLastName} ${apellidosExtra[(seed + 1) % apellidosExtra.length]}`;
  const madreNombreGen = `${nombresMadre[seed % nombresMadre.length]} ${motherLastName} ${apellidosExtra[(seed + 2) % apellidosExtra.length]}`;

  const num1 = 80000000 + (seed % 999999);
  const num2 = 80000000 + ((seed + 12345) % 999999);
  const padreTelGen = `+506 ${num1.toString().slice(0, 4)} ${num1.toString().slice(4)}`;
  const madreTelGen = `+506 ${num2.toString().slice(0, 4)} ${num2.toString().slice(4)}`;

  const slugP = fatherLastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const slugM = motherLastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const padreCorreoGen = `${nombresPadre[seed % nombresPadre.length].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${slugP}@gmail.com`;
  const madreCorreoGen = `${nombresMadre[seed % nombresMadre.length].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${slugM}@gmail.com`;

  const padreCedGen = `1-${(1000 + (seed % 8000))}-${(1000 + ((seed * 7) % 8000))}`;
  const madreCedGen = `1-${(1000 + ((seed + 3) % 8000))}-${(1000 + ((seed * 11) % 8000))}`;

  const parentesco = j.parentescoFirmante || j.parentesco || "Madre";
  
  let madreNom = j.madreNombre;
  let madreCed = j.madreIdentificacion;
  let madreTel = j.madreTelefono;
  let madreCor = j.madreCorreo;

  let padreNom = j.padreNombre;
  let padreCed = j.padreIdentificacion;
  let padreTel = j.padreTelefono;
  let padreCor = j.padreCorreo;

  let encNom = j.nombreFirmante || j.encargado;
  let encCed = j.identificacionFirmante || j.encargadoIdentificacion;
  let encTel = j.telefonoEncargado;
  let encCor = j.correoEncargado;

  if (parentesco === "Madre") {
    madreNom = madreNom || encNom || madreNombreGen;
    madreCed = madreCed || encCed || madreCedGen;
    madreTel = madreTel || encTel || madreTelGen;
    madreCor = madreCor || encCor || madreCorreoGen;

    encNom = madreNom;
    encCed = madreCed;
    encTel = madreTel;
    encCor = madreCor;

    padreNom = padreNom || padreNombreGen;
    padreCed = padreCed || padreCedGen;
    padreTel = padreTel || padreTelGen;
    padreCor = padreCor || padreCorreoGen;
  } else if (parentesco === "Padre") {
    padreNom = padreNom || encNom || padreNombreGen;
    padreCed = padreCed || encCed || padreCedGen;
    padreTel = padreTel || encTel || padreTelGen;
    padreCor = padreCor || encCor || padreCorreoGen;

    encNom = padreNom;
    encCed = padreCed;
    encTel = padreTel;
    encCor = padreCor;

    madreNom = madreNom || madreNombreGen;
    madreCed = madreCed || madreCedGen;
    madreTel = madreTel || madreTelGen;
    madreCor = madreCor || madreCorreoGen;
  } else {
    encNom = encNom || `Tutor Legal (${fatherLastName})`;
    encCed = encCed || `1-${(1000 + ((seed + 5) % 8000))}-${(1000 + ((seed * 13) % 8000))}`;
    encTel = encTel || madreTelGen;
    encCor = encCor || madreCorreoGen;

    madreNom = madreNom || madreNombreGen;
    madreCed = madreCed || madreCedGen;
    madreTel = madreTel || madreTelGen;
    madreCor = madreCor || madreCorreoGen;

    padreNom = padreNom || padreNombreGen;
    padreCed = padreCed || padreCedGen;
    padreTel = padreTel || padreTelGen;
    padreCor = padreCor || padreCorreoGen;
  }

  return {
    ...j,
    madreNombre: madreNom,
    madreOcupacion: j.madreOcupacion || ocupacionesMadre[seed % ocupacionesMadre.length],
    madreEmpresa: j.madreEmpresa || empresasMadre[seed % empresasMadre.length],
    madreTelefono: madreTel,
    madreCorreo: madreCor,
    madreIdentificacion: madreCed,

    padreNombre: padreNom,
    padreOcupacion: j.padreOcupacion || ocupacionesPadre[seed % ocupacionesPadre.length],
    padreEmpresa: j.padreEmpresa || empresasPadre[seed % empresasPadre.length],
    padreTelefono: padreTel,
    padreCorreo: padreCor,
    padreIdentificacion: padreCed,

    encargado: encNom,
    nombreFirmante: encNom,
    encargadoIdentificacion: encCed,
    identificacionFirmante: encCed,
    parentesco: parentesco,
    parentescoFirmante: parentesco,
    telefonoEncargado: encTel,
    correoEncargado: encCor,
  };
}

export function getPlayerOS(id: string) {
  let j: any = null;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("deportivos_hp_jugadores_dynamics");
      if (stored) {
        const dynamicPlayers = JSON.parse(stored);
        j = dynamicPlayers.find((x: any) => x.id === id);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!j) {
    j = jugadores.find((x) => x.id === id);
  }
  if (!j) {
    j = {
      id: id,
      nombre: "Atleta Registrado",
      identificacion: "1-1029-3849",
      edad: 12,
      genero: "Masculino",
      disciplina: "Fútbol",
      categoria: "U13",
      sede: "Sede Central",
      sedeId: "sede-central",
      estadoPago: "al_dia",
      saldo: 0,
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
      fechaNacimiento: "2014-02-15",
      correo: "atleta@mail.com",
      telefono: "+506 8888-9999",
      encargado: "Patricia Fonseca Núñez",
      parentesco: "Madre",
      telefonoEncargado: "+506 8445 6712",
      correoEncargado: "patricia.fonseca@mail.com"
    };
  }

  j = ensureParentData(j);

  let estadoOp: EstadoOperativo = "habilitado";
  if (j.esSuspendido || j.estado === "suspendido") estadoOp = "restriccion";
  else if (j.saldo === 0) estadoOp = "habilitado";
  else if (j.saldo < 30000) estadoOp = "tolerancia";
  else if (j.saldo < 70000) estadoOp = "aviso";
  else estadoOp = "restriccion";

  const posiciones = posicionesPorDisciplina[j.disciplina] ?? ["—"];
  const posicionPrincipal = j.posicion ?? pick(id, "pos", posiciones);
  const secundarias = posiciones.filter((p) => p !== posicionPrincipal).slice(0, 2);

  const numero = j.numero ?? (hash(id + "num") % 98) + 1;
  const altura = 140 + rng(id, "h", 0, 50);
  const peso = 35 + rng(id, "w", 0, 45);

  const radar = [
    { skill: "Técnico", valor: rng(id, "tec", 55, 95) },
    { skill: "Físico", valor: rng(id, "fis", 55, 95) },
    { skill: "Táctico", valor: rng(id, "tac", 50, 92) },
    { skill: "Actitud", valor: rng(id, "act", 60, 98) },
    { skill: "Velocidad", valor: rng(id, "vel", 50, 95) },
    { skill: "Resistencia", valor: rng(id, "res", 55, 95) },
  ];

  const meses = ["Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Ene"];
  const rendimientoMensual = meses.map((m, i) => ({
    mes: m,
    rendimiento: 60 + rng(id, "rd" + i, 0, 35),
    asistencia: 70 + rng(id, "as" + i, 0, 28),
  }));

  const partidos = rng(id, "pj", 8, 24);
  const goles = j.disciplina === "Fútbol" || j.disciplina === "Baloncesto" ? rng(id, "g", 0, partidos) : 0;
  const asistencias = rng(id, "a", 0, Math.max(1, Math.floor(partidos / 2)));
  const minutos = partidos * rng(id, "m", 40, 90);
  const promRend = Math.round((radar[0].valor + radar[1].valor + radar[2].valor) / 3);

  const asistenciaPct = rng(id, "ap", 70, 98);

  const evaluaciones: any[] = [];
  const notasEntrenador: any[] = [];
  const objetivos: any[] = [];
  
  let lesiones: any[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("deportivos_hp_lesiones");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          lesiones = parsed.filter((l: any) => l.jugadorId === j.id);
        }
      }
    } catch (e) {}
  }

  if (j.esSuspendido && lesiones.length === 0) {
    lesiones.push({
      id: `lesion-active-${j.id}`,
      jugadorId: j.id,
      jugador: j.nombre,
      fecha: j.fechaSuspension || "2026-07-21",
      desde: j.fechaSuspension || "2026-07-21",
      hasta: "En tratamiento",
      tipo: j.detalleSuspension || j.razonSuspension || "Lesión física",
      zonaCorporal: "General / Reposo Deportivo",
      gravedad: "moderada",
      severidad: "moderada",
      diagnostico: j.detalleSuspension || j.razonSuspension || "Jugador en reposo médico por lesión",
      tratamiento: ["Reposo deportivo", "Evaluación de fisioterapia"],
      dolor: 6,
      movilidad: 60,
      progresoRtp: 15,
      retornoChecklist: { altaMedica: false, altaDeportiva: false, sinDolor: false, movilidadCompleta: false },
      completada: false,
      cargaPermitida: 0,
      estado: "en tratamiento"
    });
  }

  const alergias = pick(id, "alg", [["Polen (estacional)"], ["Maní", "Polen"], ["Penicilina"], []]) as string[];
  const medicamentos = pick(id, "med", [[], ["Salbutamol (asma leve)"], [], ["Loratadina (rinitis)"]]) as string[];
  const restriccionesMed = j.esSuspendido || j.estado === "suspendido"
    ? [`Restricción médica activa: ${j.razonSuspension || 'Lesión física'} (Desde: ${j.fechaSuspension || '2026-07-21'})`]
    : [];
  const condicionesMedicas = pick(id, "cond", [[], ["Asma leve controlada"], ["Miopía leve"], []]) as string[];

  const contactosEmergencia = [
    { id: "ce1", nombre: j.madreNombre, parentesco: "Madre", telefono: j.madreTelefono },
    { id: "ce2", nombre: j.padreNombre, parentesco: "Padre",  telefono: j.padreTelefono },
  ];
  if (j.parentesco !== "Madre" && j.parentesco !== "Padre" && j.encargado) {
    contactosEmergencia.push({
      id: "ce3", nombre: j.encargado, parentesco: j.parentesco || "Tutor Legal", telefono: j.telefonoEncargado || j.madreTelefono
    });
  }

  const seguro = {
    aseguradora: "INS — Instituto Nacional de Seguros",
    poliza: `INS-${rng(id, "pol", 100000, 999999)}`,
    cobertura: "Estudiantil deportivo",
    vence: "28 Feb 2026",
    estado: "vigente",
  };

  const documentos = [
    { id: "dc1", nombre: "Contrato de inscripción 2026", tipo: "Contrato", estado: "vigente",    emision: "10 Ene 2026", vence: "31 Dic 2026", tam: "182 KB", diasRestantes: 320 },
    { id: "dc2", nombre: "Cédula / Identificación",       tipo: "ID",       estado: "vigente",    emision: "12 May 2020", vence: "—",            tam: "98 KB",  diasRestantes: 9999 },
    { id: "dc3", nombre: "Póliza INS",                    tipo: "Póliza",   estado: "por vencer", emision: "28 Feb 2025", vence: "28 Feb 2026",  tam: "240 KB", diasRestantes: 25 },
    { id: "dc4", nombre: "Autorización médica",           tipo: "Médico",   estado: "vigente",    emision: "10 Jun 2025", vence: "10 Jun 2026",  tam: "120 KB", diasRestantes: 127 },
    { id: "dc5", nombre: "Permiso de imagen",             tipo: "Permiso",  estado: "vencido",    emision: "01 Ene 2025", vence: "01 Ene 2026",  tam: "76 KB",  diasRestantes: -32 },
    { id: "dc6", nombre: "Certificado médico anual",      tipo: "Médico",   estado: "por vencer", emision: "15 Mar 2025", vence: "15 Mar 2026",  tam: "156 KB", diasRestantes: 40 },
  ];

  const comEncargado = j.nombreFirmante || j.encargado || j.madreNombre || j.padreNombre || "Encargado Legal";
  const comEncTelefono = j.telefonoEncargado || j.madreTelefono || j.padreTelefono || "—";
  const comMadre = j.madreNombre || "Madre";
  const comMadreCorreo = j.madreCorreo || "—";
  const comPadre = j.padreNombre || "Padre";
  const comPadreTelefono = j.padreTelefono || "—";

  const comunicaciones: any[] = [
    {
      id: "com-1",
      canal: "WhatsApp",
      asunto: "Estado de Cuenta & Recordatorio de Mensualidad",
      destino: `${comEncargado} (${comEncTelefono})`,
      fecha: "18 Jul 2026",
      estado: "Entregado",
      detalle: "Envío automático de resumen financiero e instrucciones de pago SINPE."
    },
    {
      id: "com-2",
      canal: "Email",
      asunto: "Ficha de Inscripción & Reglamento Interno 2026",
      destino: `${comMadre} (${comMadreCorreo})`,
      fecha: "10 Ene 2026",
      estado: "Enviado",
      detalle: "Documentación oficial de admisión y normatividad del club."
    },
    {
      id: "com-3",
      canal: "Llamada",
      asunto: "Confirmación de Asistencia a Torneo Oficial",
      destino: `${comPadre} (${comPadreTelefono})`,
      fecha: "05 Jun 2026",
      estado: "Completada",
      detalle: "Llamada informativa de itinerario, transporte y horario."
    }
  ];
  const historial: any[] = [];
  const pagosJugador: any[] = [];

  const token = `${j.id}-${(hash(id + "tk") % 0xffffff).toString(16).padStart(6, "0")}`;

  const alertas: any[] = [];

  const posicionCoords: Record<string, { x: number; y: number }> = {
    "Portero": { x: 50, y: 92 }, "Defensa central": { x: 35, y: 75 }, "Lateral": { x: 15, y: 70 },
    "Mediocampista": { x: 50, y: 50 }, "Volante ofensivo": { x: 50, y: 35 },
    "Extremo": { x: 85, y: 30 }, "Delantero": { x: 50, y: 15 },
    "Base": { x: 50, y: 85 }, "Escolta": { x: 25, y: 65 }, "Alero": { x: 75, y: 65 },
    "Ala-pívot": { x: 30, y: 30 }, "Pívot": { x: 50, y: 18 },
    "Armador": { x: 50, y: 70 }, "Opuesto": { x: 75, y: 50 }, "Central": { x: 50, y: 30 },
    "Receptor": { x: 25, y: 50 }, "Líbero": { x: 50, y: 85 },
  };

  return {
    jugador: j,
    estadoOp,
    numero,
    posicionPrincipal,
    secundarias,
    posicionCoords,
    perfil: pick(id, "perf", ["Diestro", "Zurdo", "Ambidiestro"]),
    altura, peso,
    imc: +(peso / Math.pow(altura / 100, 2)).toFixed(1),
    entrenador: pick(id, "ent", ["Carlos Araya", "Roberto Ruiz", "Laura Castro", "Marco Núñez", "Laura Vargas", "Diego Soto", "Sofía Hidalgo", "Juan Pérez", "Pedro Ortiz", "Sofía Rojas", "José Delgado"]),
    equipo: `${j.indigo ?? j.disciplina} ${j.categoria}`,
    radar, rendimientoMensual,
    stats: { partidos, goles, asistencias, minutos, promRend, asistenciaPct },
    evaluaciones, notasEntrenador, objetivos,
    lesiones, alergias, medicamentos, restriccionesMed, condicionesMedicas,
    contactosEmergencia, seguro,
    documentos, comunicaciones, historial, pagosJugador,
    token, alertas,
  };
}

export function getPlayerOSByToken(token: string) {
  const id = token.split("-")[0];
  return getPlayerOS(id);
}

export * from "./mock-crm";

export type RiskLevel = "bajo" | "medio" | "alto" | "critico";

export const aiRiskScores: any[] = [];
export const aiPredicciones: any[] = [];
export const aiRecomendaciones: any[] = [];
export const aiInsights: any[] = [];
export const aiCRMScores: any[] = [];
export const aiEventos: any[] = [];

export function getRiskScore(jugadorId: string) {
  return null;
}

export const exerciseCategorias: any[] = [];
export const exerciseLibrary: any[] = [];
export const trainingSessions: any[] = [];
export const trainingTemplates: any[] = [];
export const matches: any[] = [];
export const convocatorias: any[] = [];
export const playerLoads: any[] = [];
export const playerAvailability: any[] = [];
export const playerObjectives: any[] = [
  {
    id: "obj_mateo_1",
    jugadorId: "j-1784264180800-5hvh",
    jugador: "Mateo Rojas Calvo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    tipo: "tecnico",
    titulo: "Mejorar la definición con pierna no hábil",
    progreso: 65,
    fechaInicio: "2026-07-01",
    fechaObjetivo: "2026-08-15",
    observaciones: "Realizar 50 repeticiones adicionales de remates de zurda después de cada sesión de entrenamiento.",
    estado: "en_progreso"
  },
  {
    id: "obj_mateo_2",
    jugadorId: "j-1784264180800-5hvh",
    jugador: "Mateo Rojas Calvo",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    tipo: "fisico",
    titulo: "Incrementar resistencia cardiovascular",
    progreso: 40,
    fechaInicio: "2026-07-10",
    fechaObjetivo: "2026-08-30",
    observaciones: "Lograr completar el test de Cooper con una marca de 2800 metros.",
    estado: "en_progreso"
  },
  {
    id: "obj_valeria_1",
    jugadorId: "j-1784264180800-xmz",
    jugador: "Valeria Soto Carmona",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    tipo: "tactico",
    titulo: "Posicionamiento defensivo en transición",
    progreso: 80,
    fechaInicio: "2026-07-05",
    fechaObjetivo: "2026-08-10",
    observaciones: "Mejorar el repliegue rápido al perder el balón en media cancha. Excelente actitud en los partidos de práctica.",
    estado: "en_progreso"
  },
  {
    id: "obj_valeria_2",
    jugadorId: "j-1784264180800-xmz",
    jugador: "Valeria Soto Carmona",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    tipo: "psicologico",
    titulo: "Liderazgo y comunicación en cancha",
    progreso: 50,
    fechaInicio: "2026-07-12",
    fechaObjetivo: "2026-09-01",
    observaciones: "Asumir la capitanía en el próximo partido amistoso y organizar las marcas en jugadas a balón parado.",
    estado: "en_progreso"
  }
];
export const coachDiary: any[] = [];
export const quickEvaluations: any[] = [];
export const coachOperativeAlerts: any[] = [];
export const temporadas = [
  { id: "temp2024", nombre: "Temporada 2024", inicio: "2024-01-08", fin: "2024-12-15", sedes: 3, equipos: 8, disciplinas: ["Fútbol", "Baloncesto"], estado: "cerrada" as const },
  { id: "temp2025", nombre: "Temporada 2025", inicio: "2025-01-06", fin: "2025-12-20", sedes: 4, equipos: 10, disciplinas: ["Fútbol", "Baloncesto", "Natación"], estado: "cerrada" as const },
  { id: "temp2026", nombre: "Temporada 2026", inicio: "2026-01-05", fin: "2026-12-20", sedes: 4, equipos: 12, disciplinas: ["Fútbol", "Baloncesto", "Natación", "Voleibol", "Tenis"], estado: "activa" as const },
];
export const competiciones = [
  { id: "comp1", temporadaId: "temp2026", nombre: "Torneo Apertura U-15", tipo: "Liga", categoria: "Sub-15 Fútbol", jornadas: 18, estado: "en_curso" },
  { id: "comp2", temporadaId: "temp2026", nombre: "Copa Metropolitana U-13", tipo: "Copa", categoria: "Sub-12 Fútbol", jornadas: 10, estado: "en_curso" },
  { id: "comp3", temporadaId: "temp2026", nombre: "Liga Nacional de Baloncesto Juvenil", tipo: "Liga", categoria: "Juvenil Baloncesto", jornadas: 14, estado: "en_curso" },
  { id: "comp4", temporadaId: "temp2025", nombre: "Campeonato Clausura U-15 2025", tipo: "Liga", categoria: "Sub-15 Fútbol", jornadas: 18, estado: "finalizado" },
];
export const standings: any[] = [];
export const goleadores: any[] = [];
export const partidosCompeticion: any[] = [];
export const playerCompetitionStats: any[] = [];
export const trofeos = [
  { id: "tro1", equipo: "Élite Sub-15", competicion: "Campeonato Clausura U-15 2025", temporada: "2025" },
  { id: "tro2", equipo: "Halcones Femenino", competicion: "Copa Federada Baloncesto 2025", temporada: "2025" },
  { id: "tro3", equipo: "Élite Sub-12 A", competicion: "Torneo Nacional U-11 2024", temporada: "2024" },
];
export const performancePlans: any[] = [];
export const trainingLoads: any[] = [];
export const wellnessLogs: any[] = [];
export const gpsRecords: any[] = [];
export const physicalTestsBank: any[] = [];
export const physicalTestResults: any[] = [];
export const injuryRecords: any[] = [];
export const recoverySessions: any[] = [];
export const performanceGoals: any[] = [];
export const aiPerformancePredictions: any[] = [];
export const encargados: any[] = [];
export const formatCRC = (n: number) => new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(n);
