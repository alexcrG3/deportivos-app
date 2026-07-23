import { jugadores, sedes, hash, getCategoriaPorEdad, entrenadores, categorias, equipos, ensureParentData } from "./mock-data";
import seededDb from "./seeded-database.json";
import { supabase } from "./supabase";
import { toast } from "sonner";

export function generateUniqueId(prefix: string): string {
  const rand = Math.floor(Math.random() * 1000000).toString(36);
  return `${prefix}-${Date.now()}-${rand}`;
}

export function calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const cumple = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
    edad--;
  }
  return Math.max(0, edad);
}

export interface SistemaUsuario {
  id: string;
  nombre: string;
  email: string;
  role: string;
  sedeId: string;
  sede?: string;
  estado: "activo" | "invitado";
  codigoAcceso?: string;
  fechaCreacion: string;
  organizacion_id?: string;
  avatar?: string;
}

export interface StoreJugador {
  id: string;
  nombre: string;
  identificacion: string;
  edad: number;
  genero: string;
  disciplina: string;
  categoria: string;
  sede: string;
  sedeId: string;
  estadoPago: "al_dia" | "pendiente" | "moroso";
  saldo: number;
  avatar: string;
  qr?: string;
  fechaNacimiento: string;
  correo: string;
  telefono: string;
  encargado: string;
  parentesco: string;
  telefonoEncargado: string;
  correoEncargado: string;
  posicion?: string;
  numero?: number;
  
  // Nuevos campos unificados
  barrio?: string;
  direccion?: string;
  telefonoResidencia?: string;
  tipoSangre?: string;
  seguroEps?: string;
  enfermedades?: string;
  cirugias?: string;
  alergiasInput?: string;
  lesionesInput?: string;
  institucionEducativa?: string;
  gradoActual?: string;
  peso?: number;
  altura?: number;

  // Padres
  padreNombre?: string;
  padreOcupacion?: string;
  padreEmpresa?: string;
  padreTelefono?: string;
  padreCorreo?: string;
  madreNombre?: string;
  madreOcupacion?: string;
  madreEmpresa?: string;
  madreTelefono?: string;
  madreCorreo?: string;
  encargadoIdentificacion?: string;
  madreIdentificacion?: string;
  padreIdentificacion?: string;
  parentescoFirmante?: "Madre" | "Padre" | "Tutor";
  nombreFirmante?: string;
  identificacionFirmante?: string;

  // Aspecto Legal y Firma
  consentLiberacion?: boolean;
  consentDatos?: boolean;
  consentFotos?: boolean;
  firmaBase64?: string;
  organizacion_id?: string;

  // Estado de Suspensión Persistente
  esSuspendido?: boolean;
  fechaSuspension?: string;
  razonSuspension?: string;
  detalleSuspension?: string;
}

export interface StoreEntrenador {
  id: string;
  nombre: string;
  identificacion: string;
  telefono: string;
  whatsapp: string;
  correo: string;
  especialidad: string;
  disciplinas: string[];
  categorias: number;
  sedeId: string;
  horario: string;
  estado: "activo" | "inactivo";
  avatar: string;
  organizacion_id?: string;
  tarifaSesion?: number;
  bonoPartido?: number;
  moneda?: "USD" | "CRC";
  cuentaBancaria?: string;
}

export interface RegistroNominaEntrenador {
  id: string;
  organizacion_id?: string;
  entrenadorId: string;
  entrenadorNombre: string;
  entrenadorIdentificacion?: string;
  entrenadorCorreo?: string;
  entrenadorTelefono?: string;
  cuentaBancaria?: string;
  categoriaAsignada?: string;
  periodoInicio: string;
  periodoFin: string;
  sesionesConcluidas: number;
  partidosConcluidos: number;
  tarifaSesion: number;
  bonoPartido: number;
  montoSesiones: number;
  montoPartidos: number;
  montoAjustes: number;
  notasAjustes?: string;
  montoTotal: number;
  moneda: "USD" | "CRC";
  estado: "borrador" | "aprobado" | "pagado";
  fechaPago?: string;
  created_at?: string;
}

export interface Sesion {
  id: string;
  nombre: string;
  tipo: "Técnica" | "Táctica" | "Física" | "Recuperación" | "Competencia";
  fecha: string;
  hora: string;
  duracion: number;
  equipo: string;
  rpe?: number;
  carga?: number;
  gpsSincronizado?: boolean;
  gpsData?: {
    distancia: number;
    sprints: number;
    aceleraciones: number;
    velocidadMax: number;
    frecuenciaCardiaca: number;
  };
}

export interface Ciclo {
  id: string;
  nombre: string;
  tipo: "macrociclo" | "mesociclo" | "microciclo" | "temporada";
  subtipo?: string;
  inicio: string;
  fin: string;
  equipo: string;
  objetivo: string;
  intensidad: "Baja" | "Media" | "Alta" | "Muy alta";
  volumen: number;
  color: string;
  capacidades: string[];
  activo: boolean;
}

// ─── WELLNESS ────────────────────────────────────────────────────────────────
export type WellnessSuenoLabel = "Muy malo" | "Malo" | "Regular" | "Bueno" | "Excelente";
export type WellnessDolorLabel = "Ninguno" | "Leve" | "Moderado" | "Alto" | "Muy alto";
export type WellnessEstresLabel = "Muy bajo" | "Bajo" | "Normal" | "Alto" | "Muy alto";
export type WellnessAnimoEmoji = "😊" | "🙂" | "😐" | "🙁" | "😫";
export type WellnessSensacionLabel = "Excelente" | "Buena" | "Regular" | "Mala" | "Muy mala";

export interface WellnessRegistro {
  id: string;
  jugadorId: string;
  jugador: string;
  fecha: string;
  hora?: string;
  // Legacy numeric fields (kept for backward compatibility)
  sueñoHoras: number;
  sueñoCalidad: number;
  fatiga: number;
  estres: number;
  dolorMuscular: number;
  animo: number;
  energia: number;
  motivacion: number;
  // New label fields (Sports Science Engine)
  suenoLabel?: WellnessSuenoLabel;
  dolorLabel?: WellnessDolorLabel;
  estresLabel?: WellnessEstresLabel;
  animoEmoji?: WellnessAnimoEmoji;
  sensacionLabel?: WellnessSensacionLabel;
  // Calculated scores
  score?: number;          // 0-100 readiness/wellness score
  wellnessScore?: number;  // alias for clarity
  sportsScore?: number;    // composite sports science score 0-100
  acwr?: number;           // Acute:Chronic Workload Ratio
  fatigaScore?: number;    // 0-100 fatigue score
  recuperacionScore?: number; // 0-100 recovery score
  promedio?: number;
}

export interface WellnessAlerta {
  id: string;
  jugadorId: string;
  jugador: string;
  tipo: "sueño_bajo" | "dolor_alto" | "estres_alto" | "energia_baja" | "acwr_alto" | "sin_registro";
  mensaje: string;
  fecha: string;
  severidad: "info" | "advertencia" | "critica";
  activa: boolean;
}

// ─── Sports Science Engine ────────────────────────────────────────────────────
export interface SportsScoreData {
  jugadorId: string;
  jugador: string;
  avatar: string;
  fecha: string;
  sportsScore: number;
  wellnessScore: number;
  acwr: number;
  fatigaScore: number;
  recuperacionScore: number;
  lesionScore: number;
  cargaHoy: number;
  cargaSemanal: number;
  cargaMensual: number;
  tendencia: "subiendo" | "estable" | "bajando";
  estado: "excelente" | "bueno" | "precaución" | "riesgo" | "sin_registro";
  historial: Array<{ fecha: string; score: number; wellnessScore: number; carga: number }>;
}

// ─── FORMULAS Sports Science ─────────────────────────────────────────────────

// ─── CARGA ENGINE FORMULAS ────────────────────────────────────────────────────

/** Carga Interna = Duración × RPE */
export function calcCargaInterna(duracion: number, rpe: number): number {
  return duracion * rpe;
}

/** Carga Aguda = promedio cargas últimos 7 días */
export function calcCargaAguda(sesiones: Sesion[], equipo: string): number {
  const hoy = new Date();
  const start = new Date(hoy); start.setDate(hoy.getDate() - 7);
  const cargas = sesiones
    .filter(s => s.equipo === equipo && new Date(s.fecha) >= start && (s.carga || 0) > 0)
    .map(s => s.carga || 0);
  if (cargas.length === 0) return 0;
  return Math.round(cargas.reduce((a, b) => a + b, 0) / cargas.length);
}

/** Carga Crónica = promedio cargas últimos 28 días */
export function calcCargaCronica(sesiones: Sesion[], equipo: string): number {
  const hoy = new Date();
  const start = new Date(hoy); start.setDate(hoy.getDate() - 28);
  const cargas = sesiones
    .filter(s => s.equipo === equipo && new Date(s.fecha) >= start && (s.carga || 0) > 0)
    .map(s => s.carga || 0);
  if (cargas.length === 0) return 0;
  return Math.round(cargas.reduce((a, b) => a + b, 0) / cargas.length);
}

/**
 * Fatigue Score 0-100 (mayor = más fatigado)
 * Inputs: cargaAguda, wellnessScore, dolorMuscular(1-5), estres(1-5), diasConsecutivos
 */
export function calcFatigaScore(
  cargaAguda: number,
  wellnessScore: number,
  dolorMuscular: number,
  estres: number,
  diasConsecutivos: number
): number {
  // Normalizar cargaAguda (asumimos que 800 AU = carga máxima)
  const cargaNorm  = Math.min(100, (cargaAguda / 800) * 100);
  // Wellness inverso (mayor wellness = menos fatiga)
  const wellnessInv = 100 - wellnessScore;
  // Dolor 1-5 → 0-100
  const dolorNorm = ((dolorMuscular - 1) / 4) * 100;
  // Estrés 1-5 → 0-100
  const estresNorm = ((estres - 1) / 4) * 100;
  // Días consecutivos penaliza (5+ = fatiga alta)
  const diasNorm   = Math.min(100, diasConsecutivos * 15);

  const score = Math.round(
    cargaNorm  * 0.40 +
    wellnessInv * 0.30 +
    dolorNorm  * 0.15 +
    estresNorm * 0.10 +
    diasNorm   * 0.05
  );
  return Math.min(100, Math.max(0, score));
}

/**
 * Recovery Score 0-100 (mayor = mejor recuperación)
 * Inputs: suenoCalidad(1-5), suenoHoras, dolorMuscular(1-5), wellnessScore, cargaAguda
 */
export function calcRecoveryScore(
  suenoCalidad: number,
  suenoHoras: number,
  dolorMuscular: number,
  wellnessScore: number,
  cargaAguda: number
): number {
  // Sueño calidad 1-5 → 0-100
  const suenoQual  = ((suenoCalidad - 1) / 4) * 100;
  // Sueño horas: óptimo 8h → 100, <6 → penaliza
  const suenoHrs   = Math.min(100, (Math.min(suenoHoras, 9) / 9) * 100);
  // Dolor inverso
  const dolorInv   = 100 - ((dolorMuscular - 1) / 4) * 100;
  // Carga aguda inversa (mucha carga = menos recuperación)
  const cargaInv   = Math.max(0, 100 - (cargaAguda / 800) * 100);

  const score = Math.round(
    suenoQual * 0.30 +
    suenoHrs  * 0.15 +
    dolorInv  * 0.25 +
    wellnessScore * 0.20 +
    cargaInv  * 0.10
  );
  return Math.min(100, Math.max(0, score));
}

/** Semáforo de riesgo con motivos y recomendación */
export function calcSemaforo(
  acwr: number,
  fatigaScore: number,
  wellnessScore: number,
  lesionActiva: boolean,
  diasConsecutivos: number,
  cargaSemanal: number,
  cargaSemanaPrev: number
): { color: SemaforoColor; motivos: string[]; recomendacion: string } {
  const motivos: string[] = [];

  // Evaluar incremento de carga semanal
  const incrementoCarga = cargaSemanaPrev > 0
    ? Math.round(((cargaSemanal - cargaSemanaPrev) / cargaSemanaPrev) * 100)
    : 0;

  if (acwr > 1.5) motivos.push(`ACWR crítico: ${acwr.toFixed(2)} (zona de alto riesgo)`);
  else if (acwr > 1.3) motivos.push(`ACWR elevado: ${acwr.toFixed(2)} (zona de precaución)`);
  else if (acwr < 0.6) motivos.push(`ACWR muy bajo: ${acwr.toFixed(2)} (subentrenamiento)`);

  if (fatigaScore >= 75) motivos.push(`Fatiga muy alta: ${fatigaScore}%`);
  else if (fatigaScore >= 60) motivos.push(`Fatiga moderada-alta: ${fatigaScore}%`);

  if (wellnessScore < 40) motivos.push(`Wellness crítico: ${wellnessScore}/100`);
  else if (wellnessScore < 60) motivos.push(`Wellness bajo: ${wellnessScore}/100`);

  if (lesionActiva) motivos.push("Lesión activa en tratamiento");

  if (diasConsecutivos >= 5) motivos.push(`${diasConsecutivos} días de entrenamiento consecutivos sin descanso`);
  else if (diasConsecutivos >= 4) motivos.push(`${diasConsecutivos} días de entrenamiento consecutivos`);

  if (incrementoCarga > 30) motivos.push(`Incremento de carga semanal del ${incrementoCarga}% respecto a semana anterior`);
  else if (incrementoCarga > 15) motivos.push(`Incremento de carga semanal del ${incrementoCarga}%`);

  // Determinar color
  let color: SemaforoColor;
  const criticalCount = [acwr > 1.5, fatigaScore >= 75, wellnessScore < 40, lesionActiva].filter(Boolean).length;
  const warningCount  = [acwr > 1.3, fatigaScore >= 60, wellnessScore < 60, diasConsecutivos >= 4, incrementoCarga > 15].filter(Boolean).length;

  if (criticalCount >= 1 || (warningCount >= 2 && motivos.length >= 3)) {
    color = "rojo";
  } else if (warningCount >= 1 || motivos.length >= 2) {
    color = "amarillo";
  } else {
    color = "verde";
  }

  const recomendacion =
    color === "rojo"
      ? "⚠️ Se recomienda descanso completo o sesión de recuperación activa. No agregar carga adicional."
    : color === "amarillo"
      ? "🔶 Reducir intensidad en un 20–30% durante las próximas 48 horas. Monitorear wellness."
      : "✅ El atleta está en óptimas condiciones para entrenamiento normal."

  return { color, motivos, recomendacion };
}

/** Calcular días de entrenamiento consecutivos hasta hoy */
function calcDiasConsecutivos(sesiones: Sesion[], equipo: string): number {
  const hoy = new Date();
  let dias = 0;
  for (let i = 0; i < 14; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    const fechaStr = fecha.toISOString().split("T")[0];
    const tiene = sesiones.some(s => s.equipo === equipo && s.fecha === fechaStr && (s.carga || 0) > 0);
    if (tiene) {
      dias++;
    } else if (i > 0) {
      break; // Solo contamos si son consecutivos
    }
  }
  return dias;
}

/** Calcular carga semanal de la semana anterior */
function calcCargaSemanaPrev(sesiones: Sesion[], equipo: string): number {
  const hoy = new Date();
  const start = new Date(hoy); start.setDate(hoy.getDate() - 14);
  const end   = new Date(hoy); end.setDate(hoy.getDate() - 7);
  return sesiones
    .filter(s => s.equipo === equipo && new Date(s.fecha) >= start && new Date(s.fecha) < end)
    .reduce((acc, s) => acc + (s.carga || 0), 0);
}

/** Generar alertas del motor de cargas */
export function generarSportsAlertas(sesiones: Sesion[], wellness: WellnessRegistro[]): SportsAlerta[] {
  const alertas: SportsAlerta[] = [];
  const hoy = new Date().toISOString().split("T")[0];

  const jugadoresMap = [
    { id: "j1", nombre: "Sofía Rodríguez",  equipo: "Fútbol Sub-10" },
    { id: "j2", nombre: "Mateo Vargas",      equipo: "Baloncesto Sub-12" },
    { id: "j3", nombre: "Valentina Soto",    equipo: "Natación Sub-14" },
    { id: "j4", nombre: "Santiago Jiménez",  equipo: "Voleibol Sub-16" },
  ];

  jugadoresMap.forEach(j => {
    const diasConsec = calcDiasConsecutivos(sesiones, j.equipo);
    const cargaSem   = sesiones.filter(s => {
      const start = new Date(); start.setDate(start.getDate() - 7);
      return s.equipo === j.equipo && new Date(s.fecha) >= start;
    }).reduce((acc, s) => acc + (s.carga || 0), 0);
    const cargaPrev  = calcCargaSemanaPrev(sesiones, j.equipo);
    const incremento = cargaPrev > 0 ? Math.round(((cargaSem - cargaPrev) / cargaPrev) * 100) : 0;
    const jugWellness = wellness.filter(w => w.jugadorId === j.id)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 3);
    const avgWellness3dias = jugWellness.length > 0
      ? jugWellness.reduce((acc, w) => acc + (w.wellnessScore || w.score || 0), 0) / jugWellness.length
      : 75;

    // Alerta: días consecutivos
    if (diasConsec >= 5) {
      alertas.push({
        id: `sa-${j.id}-dias`,
        jugadorId: j.id, jugador: j.nombre,
        tipo: "dias_consecutivos",
        mensaje: `${diasConsec} días de entrenamiento consecutivos`,
        detalle: `El atleta lleva ${diasConsec} días de entrenamiento sin descanso. El riesgo de lesión aumenta significativamente.`,
        fecha: hoy, severidad: diasConsec >= 6 ? "critica" : "advertencia", activa: true,
      });
    }

    // Alerta: incremento de carga alto
    if (incremento > 30) {
      alertas.push({
        id: `sa-${j.id}-carga`,
        jugadorId: j.id, jugador: j.nombre,
        tipo: "incremento_carga",
        mensaje: `Incremento de carga semanal del ${incremento}%`,
        detalle: `La carga semanal actual (${cargaSem} AU) superó en un ${incremento}% a la semana anterior (${cargaPrev} AU). Precaución ACWR.`,
        fecha: hoy, severidad: incremento > 45 ? "critica" : "advertencia", activa: true,
      });
    }

    // Alerta: wellness muy bajo 3 días
    if (avgWellness3dias < 50 && jugWellness.length >= 3) {
      alertas.push({
        id: `sa-${j.id}-wellness`,
        jugadorId: j.id, jugador: j.nombre,
        tipo: "wellness_bajo",
        mensaje: `Wellness bajo durante 3 días (promedio: ${Math.round(avgWellness3dias)}/100)`,
        detalle: `El atleta reporta bienestar persistentemente bajo. Se sugiere revisión médica y reducción de carga.`,
        fecha: hoy, severidad: avgWellness3dias < 35 ? "critica" : "advertencia", activa: true,
      });
    }
  });

  return alertas;
}

/** Convierte valor 1-5 (bajo=bueno) a score 0-100 inverso */
function invertScore(val: number, max = 5): number {
  return Math.round(((max - val) / (max - 1)) * 100);
}

/** Convierte valor 1-5 (alto=bueno) a score 0-100 */
function normalScore(val: number, max = 5): number {
  return Math.round(((val - 1) / (max - 1)) * 100);
}

/** Calcula Wellness Score 0-100 */
export function calcWellnessScore(w: Omit<WellnessRegistro, "id">): number {
  const sueño    = normalScore(w.sueñoCalidad);    // 20%
  const dolor    = invertScore(w.dolorMuscular);   // 20%
  const estres   = invertScore(w.estres);          // 20%
  const animo    = normalScore(w.animo);           // 20%
  const energia  = normalScore(w.energia);         // 10%
  const motiv    = normalScore(w.motivacion);      // 10%
  return Math.round(sueño * 0.20 + dolor * 0.20 + estres * 0.20 + animo * 0.20 + energia * 0.10 + motiv * 0.10);
}

/** Calcula ACWR dado array de cargas (últimas 4 semanas + semana actual) */
export function calcACWR(sesiones: Sesion[], equipo?: string): number {
  const hoy = new Date();
  const filtered = equipo ? sesiones.filter(s => s.equipo === equipo) : sesiones;

  const getWeekCarga = (weeksAgo: number): number => {
    const start = new Date(hoy);
    start.setDate(hoy.getDate() - (weeksAgo + 1) * 7);
    const end = new Date(hoy);
    end.setDate(hoy.getDate() - weeksAgo * 7);
    return filtered
      .filter(s => { const d = new Date(s.fecha); return d >= start && d < end; })
      .reduce((acc, s) => acc + (s.carga || 0), 0);
  };

  const semanaActual  = getWeekCarga(0);
  const sem1          = getWeekCarga(1);
  const sem2          = getWeekCarga(2);
  const sem3          = getWeekCarga(3);
  const sem4          = getWeekCarga(4);
  const cronLinea     = (sem1 + sem2 + sem3 + sem4) / 4;

  if (cronLinea === 0) return 1.0;
  return Math.round((semanaActual / cronLinea) * 100) / 100;
}

/** Convierte ACWR a score 0-100 (zona verde 0.8-1.3 = 100) */
export function acwrToScore(acwr: number): number {
  if (acwr >= 0.8 && acwr <= 1.3) return 100;
  if (acwr > 1.3 && acwr <= 1.5) return Math.round(100 - ((acwr - 1.3) / 0.2) * 50);
  if (acwr > 1.5) return Math.max(0, Math.round(50 - ((acwr - 1.5) * 100)));
  if (acwr < 0.8 && acwr >= 0.6) return Math.round(((acwr - 0.6) / 0.2) * 50);
  return Math.max(0, Math.round((acwr / 0.6) * 30));
}

/** Calcula Sports Score 0-100 */
export function calcSportsScore(wellnessScore: number, acwr: number, fatigaScore: number, lesionScore: number): number {
  const acwrS = acwrToScore(acwr);
  return Math.round(wellnessScore * 0.35 + acwrS * 0.25 + fatigaScore * 0.20 + lesionScore * 0.20);
}

/** Label del Sports Score */
export function sportsScoreLabel(score: number): { label: string; color: string; bg: string; emoji: string } {
  if (score >= 90) return { label: "Excelente", color: "text-emerald-600", bg: "bg-emerald-500", emoji: "🟢" };
  if (score >= 75) return { label: "Bueno",     color: "text-sky-600",     bg: "bg-sky-500",     emoji: "🔵" };
  if (score >= 55) return { label: "Precaución",color: "text-amber-600",   bg: "bg-amber-500",   emoji: "🟡" };
  return               { label: "Riesgo",       color: "text-red-600",     bg: "bg-red-500",     emoji: "🔴" };
}

/** Genera alertas automáticas de wellness */
export function generarAlertas(logs: WellnessRegistro[], jugadorId: string): WellnessAlerta[] {
  const alertas: WellnessAlerta[] = [];
  const jugLogs = [...logs]
    .filter(l => l.jugadorId === jugadorId)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 7);

  if (jugLogs.length === 0) return alertas;

  const jugador = jugLogs[0].jugador;
  const hoy = new Date().toISOString().split("T")[0];

  // 3 días consecutivos con sueño bajo (calidad <= 2)
  const ultimos3 = jugLogs.slice(0, 3);
  if (ultimos3.length === 3 && ultimos3.every(l => l.sueñoCalidad <= 2)) {
    alertas.push({
      id: `a-${jugadorId}-sueno`,
      jugadorId, jugador,
      tipo: "sueño_bajo",
      mensaje: "3 días consecutivos con calidad de sueño baja",
      fecha: hoy, severidad: "advertencia", activa: true,
    });
  }

  // Dolor muscular alto (>= 4) últimos 2 días
  const ultimos2 = jugLogs.slice(0, 2);
  if (ultimos2.length === 2 && ultimos2.every(l => l.dolorMuscular >= 4)) {
    alertas.push({
      id: `a-${jugadorId}-dolor`,
      jugadorId, jugador,
      tipo: "dolor_alto",
      mensaje: "Dolor muscular alto durante 2 días consecutivos",
      fecha: hoy, severidad: "advertencia", activa: true,
    });
  }

  // Estrés elevado (>= 4) hoy
  if (jugLogs[0] && jugLogs[0].estres >= 4) {
    alertas.push({
      id: `a-${jugadorId}-estres`,
      jugadorId, jugador,
      tipo: "estres_alto",
      mensaje: "Nivel de estrés elevado reportado hoy",
      fecha: hoy, severidad: "advertencia", activa: true,
    });
  }

  // Energía muy baja (<= 1) hoy
  if (jugLogs[0] && jugLogs[0].energia <= 1) {
    alertas.push({
      id: `a-${jugadorId}-energia`,
      jugadorId, jugador,
      tipo: "energia_baja",
      mensaje: "Energía muy baja reportada hoy",
      fecha: hoy, severidad: "critica", activa: true,
    });
  }

  return alertas;
}

// ─── CARGA ENGINE TYPES ───────────────────────────────────────────────────────
export type TipoEntrenamiento = "Técnico" | "Táctico" | "Físico" | "Recuperación" | "Partido" | "Gimnasio" | "Mixto";
export type NivelIntensidad   = "Muy Baja" | "Baja" | "Media" | "Alta" | "Muy Alta";
export type SemaforoColor     = "verde" | "amarillo" | "rojo" | "gris";

export interface SesionCompleta {
  id: string;
  nombre: string;
  fecha: string;
  hora: string;
  equipo: string;
  categoria: string;
  entrenador: string;
  lugar: string;
  tipo: TipoEntrenamiento;
  duracion: number;          // minutes
  intensidad: NivelIntensidad;
  rpe: number;               // 1-10
  cargaInterna: number;      // duracion × rpe
  notas?: string;
  jugadoresIds?: string[];
}

export interface PlayerLoadData {
  jugadorId: string;
  jugador: string;
  avatar: string;
  equipo: string;
  // Cargas calculadas
  cargaHoy:      number;
  cargaSemanal:  number;
  cargaMensual:  number;
  cargaCronica:  number;   // avg últimos 28 días
  cargaAguda:    number;   // avg últimos 7 días
  cargaMaxima:   number;
  cargaTemporada:number;
  // Ratios
  acwr:          number;
  // Scores 0-100
  fatigaScore:   number;
  recoveryScore: number;
  wellnessScore: number;
  // Semáforo
  semaforo:       SemaforoColor;
  semaforoMotivos: string[];
  semaforoRecomendacion: string;
  // Historial para gráficos (últimos 28 días)
  historialCargas: Array<{ fecha: string; carga: number; acwr: number; fatiga: number; recovery: number; }>;
}

export interface SportsAlerta {
  id: string;
  jugadorId: string;
  jugador: string;
  tipo: "sobrecarga" | "sin_descanso" | "incremento_carga" | "wellness_bajo" | "partidos_seguidos" | "dias_consecutivos";
  mensaje: string;
  detalle: string;
  fecha: string;
  severidad: "info" | "advertencia" | "critica";
  activa: boolean;
}

export interface TestFisico {
  id: string;
  jugadorId: string;
  jugador: string;
  fecha: string;
  tipo: "Velocidad" | "Agilidad" | "Salto" | "Resistencia" | "Fuerza" | "VO2";
  nombreTest: string;
  resultado: string;
  progreso: number;
  estancado: boolean;
}

export interface Lesion {
  id: string;
  jugadorId: string;
  jugador: string;
  fecha: string;
  tipo: string;
  zonaCorporal: string;
  gravedad: "Leve" | "Moderada" | "Grave";
  diagnostico: string;
  tratamiento: string[];
  dolor: number;
  movilidad: number;
  progresoRtp: number;
  retornoChecklist: {
    altaMedica: boolean;
    altaDeportiva: boolean;
    sinDolor: boolean;
    movilidadCompleta: boolean;
  };
  restricciones: string;
  cargaPermitida: number;
  completada: boolean;
}

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INITIAL_SESIONES: Sesion[] = [];
const INITIAL_CICLOS: Ciclo[] = [];
const INITIAL_WELLNESS: WellnessRegistro[] = [];
const INITIAL_TESTS: TestFisico[] = [];
const INITIAL_LESIONES: Lesion[] = [];

// ─── STORE CLASS ──────────────────────────────────────────────────────────────
class RendimientoStore {
  public static calcularEdad(fechaNacimiento: string): number {
    if (!fechaNacimiento) return 0;
    const hoy = new Date();
    const cumple = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
      edad--;
    }
    return Math.max(0, edad);
  }

  public static getLegalConfig() {
    const defaultTexts = {
      liberacion: "Yo, {nombre} cédula de identidad número {identificacion} declaro que conozco todos los riesgos que involucran las actividades deportivas y que haré uso de dichas instalaciones bajo mi única responsabilidad. Así mismo declaro que exonero de toda responsabilidad Penal, Civil o Administrativa a la Escuela de Futbol Santa Marta por hechos ó accidentes ocurridos antes, durante y después de la practica deportiva ó recreativa que realice.\n\nPor ultimo, doy autorización para mi traslado a la clínica u hospital mas cercano, en caso de presentarse algún accidente y autorizo a los médicos a atenderme debidamente.",
      tratamiento: "Yo, {nombre} cédula de identidad número {identificacion} autorizo a la Escuela de Futbol Santa Marta, a que conserven en ficheros informáticos y/o en cualquier otro soporte físico los datos personales que le han sido proporcionados de forma voluntaria y a tratar esa información con el objeto que le han sido facilitados, es decir, para la administración y gestión. Asimismo, el firmante declara conocer y aceptar las normas generales de funcionamiento de la Escuela de Futbol Santa Marta, de las actividades y aquellas genéricas de funcionamiento. Por su parte la Escuela de Futbol Santa Marta informa al firmante que su información personal figura en sus oficinas, en las que podrá solicitar el contenido exacto de ella y en donde podrá ejercer los derechos de rectificación, anulación o modificación que pudiera corresponderle, así como a modificar esta autorización en cualquier sentido.",
      fotos: "Yo, {nombre} cédula de identidad número {identificacion} declaro que autorizo a que la Escuela de Futbol Santa Marta, pueda realizar fotografías, durante las actividades, para su posible utilización en medios de comunicación, redes sociales, soportes informáticos o exhibición en otros medios del centro.",
      firmaCoordinadorBase64: "",
    };
    return this.get("legal_texts_config", defaultTexts);
  }

  public static saveLegalConfig(config: { liberacion: string, tratamiento: string, fotos: string, firmaCoordinadorBase64: string }) {
    this.set("legal_texts_config", config);
  }

  private static isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  // Caché local en memoria para acceso síncrono ultra-rápido en UI
  private static memoryCache: Record<string, any> = {};
  private static isSynced = false;
  private static syncPromise: Promise<void> | null = null;

  public static isStoreSynced(): boolean {
    return this.isSynced;
  }

  // Sincronización inicial asíncrona desde Supabase hacia la memoria del cliente
  public static async syncFromSupabase(): Promise<void> {
    if (!this.isBrowser() || this.isSynced) return;
    if (this.syncPromise) return this.syncPromise;

    this.syncPromise = (async () => {
      try {
      const org = this.getActiveOrganizacionId();

      const fetchTablePromise = async (table: string) => {
        try {
          const { data, error } = await supabase.from(table).select("*").eq("organizacion_id", org);
          if (error) console.warn(`[Supabase] Error cargando ${table}:`, error.message);
          return data ?? [];
        } catch (err) {
          console.error(`[Supabase Exception] ${table}:`, err);
          return [];
        }
      };

      const fetchOrganizacion = async () => {
        try {
          return await supabase.from("organizacion").select("*").eq("organizacion_id", org).limit(1);
        } catch (err) {
          console.error("[Supabase Exception] organizacion:", err);
          return { data: [], error: err as any };
        }
      };

      const fetchOrganizaciones = async () => {
        try {
          return await supabase.from("organizaciones").select("*");
        } catch (err) {
          console.error("[Supabase Exception] organizaciones:", err);
          return { data: [], error: err as any };
        }
      };

      // Lanzar todas las peticiones en paralelo
      const [
        dbJugadores,
        dbPagos,
        dbCategorias,
        dbSedes,
        dbLesiones,
        dbSesiones,
        dbEvals,
        dbPartidos,
        dbCargasJugadores,
        dbCargasEnt,
        dbDisponibilidad,
        dbPlanes,
        dbObjetivos,
        dbWellness,
        dbPruebas,
        dbBancoPruebas,
        dbClasificaciones,
        dbCaja,
        dbNotifs,
        dbTemporadas,
        dbDisciplinas,
        dbRecuperacion,
        dbOrgRes,
        dbOrgsRes,
        dbEquipos,
        dbEntrenadores,
        dbAsistencias,
        dbPlanificaciones
      ] = await Promise.all([
        fetchTablePromise("jugadores"),
        fetchTablePromise("pagos"),
        fetchTablePromise("categorias"),
        fetchTablePromise("sedes"),
        fetchTablePromise("lesiones"),
        fetchTablePromise("sesiones_entrenamiento"),
        fetchTablePromise("evaluaciones_rapidas"),
        fetchTablePromise("partidos"),
        fetchTablePromise("cargas_jugadores"),
        fetchTablePromise("cargas_entrenamiento"),
        fetchTablePromise("disponibilidad_jugadores"),
        fetchTablePromise("planes_rendimiento"),
        fetchTablePromise("objetivos_jugadores"),
        fetchTablePromise("registros_wellness"),
        fetchTablePromise("resultados_pruebas_fisicas"),
        fetchTablePromise("banco_pruebas_fisicas"),
        fetchTablePromise("clasificaciones"),
        fetchTablePromise("movimientos_caja_hoy"),
        fetchTablePromise("notificaciones"),
        fetchTablePromise("temporadas"),
        fetchTablePromise("disciplinas"),
        fetchTablePromise("sesiones_recuperacion"),
        fetchOrganizacion(),
        fetchOrganizaciones(),
        fetchTablePromise("equipos"),
        fetchTablePromise("entrenadores"),
        fetchTablePromise("asistencias"),
        fetchTablePromise("planificaciones")
      ]);

      // 1. JUGADORES
      this.memoryCache["jugadores_dynamics"] = dbJugadores.map((j: any) => ensureParentData({
        id: j.id, nombre: j.nombre, identificacion: j.identificacion,
        correo: j.correo, telefono: j.telefono, genero: j.genero,
        fechaNacimiento: j.fecha_nacimiento, 
        edad: calcularEdad(j.fecha_nacimiento),
        disciplina: j.disciplina,
        categoria: j.categoria, sede: j.sede, estado: j.estado,
        estadoPago: j.estado_pago, saldo: Number(j.saldo || 0),
        encargado: j.encargado, parentesco: j.parentesco,
        telefonoEncargado: j.telefono_encargado, correoEncargado: j.correo_encargado,
        posicion: j.posicion, avatar: j.avatar, qr: j.qr,
        organizacion_id: j.organizacion_id,
        esSuspendido: j.estado === "suspendido" || !!j.es_suspendido,
        fechaSuspension: j.fecha_suspension || "2026-07-21",
        razonSuspension: j.razon_suspension || "Sanción / Lesión",
        detalleSuspension: j.detalle_suspension || "",
        padreNombre: j.padre_nombre,
        padreOcupacion: j.padre_ocupacion,
        padreEmpresa: j.padre_empresa,
        padreTelefono: j.padre_telefono,
        padreCorreo: j.padre_correo,
        padreIdentificacion: j.padre_identificacion,
        madreNombre: j.madre_nombre,
        madreOcupacion: j.madre_ocupacion,
        madreEmpresa: j.madre_empresa,
        madreTelefono: j.madre_telefono,
        madreCorreo: j.madre_correo,
        madreIdentificacion: j.madre_identificacion,
        encargadoIdentificacion: j.encargado_identificacion,
        parentescoFirmante: j.parentesco_firmante,
        nombreFirmante: j.nombre_firmante,
        identificacionFirmante: j.identificacion_firmante,
        barrio: j.barrio,
        direccion: j.direccion,
        telefonoResidencia: j.telefono_residencia,
        tipoSangre: j.tipo_sangre,
        seguroEps: j.seguro_eps,
        enfermedades: j.enfermedades,
        cirugias: j.cirugias,
        alergiasInput: j.alergias_input,
        lesionesInput: j.lesiones_input,
        institucionEducativa: j.institucion_educativa,
        gradoActual: j.grado_actual,
        peso: j.peso,
        altura: j.altura,
        consentLiberacion: j.consent_liberacion,
        consentDatos: j.consent_datos,
        consentFotos: j.consent_fotos,
        firmaBase64: j.firma_base64,
      }));
      try {
        localStorage.setItem("athletix_hp_jugadores_dynamics", JSON.stringify(this.memoryCache["jugadores_dynamics"]));
      } catch (e) {}

      // 2. PAGOS
      this.memoryCache["pagos_dynamics"] = dbPagos.map((p: any) => ({
        id: p.id, jugador: p.jugador, monto: Number(p.monto || 0),
        metodo: p.metodo, referencia: p.referencia, fecha: p.fecha,
        estado: p.estado, organizacion_id: p.organizacion_id,
      }));

      // 3. CATEGORÍAS
      this.memoryCache["categorias_dynamics"] = dbCategorias.map((c: any) => ({
        id: c.id, nombre: c.nombre, disciplina: c.disciplina,
        edadMin: c.edad_min, edadMax: c.edad_max, genero: c.genero,
        sedeId: c.sede_id, entrenador: c.entrenador, capacidad: c.capacidad,
        jugadores: c.jugadores, estado: c.estado, organizacion_id: c.organizacion_id,
        costoMensual: c.costo_mensual ? Number(c.costo_mensual) : 30000,
      }));

      // 4. SEDES
      this.memoryCache["sedes_dynamics"] = dbSedes.map((s: any) => ({
        id: s.id, nombre: s.nombre, direccion: s.direccion,
        disciplina: s.disciplina, encargado: s.encargado,
        estado: s.estado, jugadores: s.jugadores, organizacion_id: s.organizacion_id,
      }));

      // 5. LESIONES
      this.memoryCache["lesiones"] = dbLesiones.map((l: any) => ({
        id: l.id, jugadorId: l.jugador_id, jugador: l.jugador, fecha: l.fecha,
        tipo: l.tipo, zonaCorporal: l.zona_corporal, gravedad: l.gravedad,
        diagnostico: l.diagnostico, tratamiento: l.tratamiento,
        dolor: l.dolor, movilidad: l.movilidad, progresoRtp: l.progreso_rtp,
        retornoChecklist: l.retorno_checklist, restricciones: l.restricciones,
        cargaPermitida: l.carga_permitida, completada: l.completada,
        estado: l.estado, organizacion_id: l.organizacion_id,
      }));

      // 6. SESIONES DE ENTRENAMIENTO
      this.memoryCache["sesiones"] = dbSesiones.map((s: any) => ({
        id: s.id, nombre: s.nombre, equipoId: s.equipo_id, equipo: s.equipo,
        categoria: s.categoria, entrenadorId: s.entrenador_id, entrenador: s.entrenador,
        fecha: s.fecha, hora: s.hora, sede: s.sede, instalacion: s.instalacion,
        duracion: s.duracion, intensidad: s.intensidad, objetivo: s.objetivo,
        estado: s.estado, bloques: s.bloques ?? [], organizacion_id: s.organizacion_id,
      }));

      // 7. EVALUACIONES RÁPIDAS
      this.memoryCache["evaluaciones_rapidas"] = dbEvals.map((e: any) => ({
        jugadorId: e.jugador_id, jugador: e.jugador, avatar: e.avatar,
        actitud: e.actitud, esfuerzo: e.esfuerzo, tecnica: e.tecnica,
        tactica: e.tactica, disciplina: e.discipline || e.disciplina,
        liderazgo: e.liderazgo, organizacion_id: e.organizacion_id,
      }));

      // 8. PARTIDOS — merge Supabase + locally seeded (so demo data survives reloads)
      const dbMappedPartidos = dbPartidos.map((p: any) => ({
        id: p.id, competicionId: p.competicion_id, competicion: p.competicion,
        jornada: p.jornada, fecha: p.fecha, hora: p.hora, sede: p.sede,
        cancha: p.cancha, local: p.local, visitante: p.visitante,
        equipoId: p.equipo_id, equipo: p.equipo, rival: p.rival, tipo: p.tipo,
        eventos: p.eventos || [],
        categoria: p.categoria, disciplina: p.disciplina, arbitros: p.arbitros,
        estado: p.estado, resultado: p.resultado, organizacion_id: p.organizacion_id,
      }));
      // Preserve locally-added partidos (e.g. demo seeds) not yet in Supabase
      let localCachedPartidos: any[] = [];
      try {
        const lc = localStorage.getItem("athletix_cache_partidos");
        if (lc) localCachedPartidos = JSON.parse(lc);
      } catch { /* ignore */ }
      const dbIds = new Set(dbMappedPartidos.map((p: any) => p.id));
      const localOnly = localCachedPartidos.filter((p: any) => !dbIds.has(p.id));
      this.memoryCache["partidos"] = [...dbMappedPartidos, ...localOnly];

      // 9. CARGAS DE JUGADORES (carga individual)
      this.memoryCache["player_load_data"] = dbCargasJugadores.map((c: any) => ({
        id: c.id, jugadorId: c.jugador_id, jugador: c.jugador, avatar: c.avatar,
        fecha: c.fecha, intensidad: c.intensidad, esfuerzo: c.esfuerzo,
        fatiga: c.fatiga, recuperacion: c.recuperacion, molestias: c.molestias,
        cargaSemanal: Number(c.carga_semanal || 0), organizacion_id: c.organizacion_id,
      }));

      // 10. CARGAS DE ENTRENAMIENTO (ACWR)
      this.memoryCache["cargas_entrenamiento"] = dbCargasEnt.map((c: any) => ({
        id: c.id, jugadorId: c.jugador_id, jugador: c.jugador, avatar: c.avatar,
        fecha: c.fecha, duracion: c.duracion, rpe: c.rpe,
        cargaInterna: Number(c.carga_interna || 0), cargaExterna: Number(c.carga_externa || 0),
        volumenSemanal: Number(c.volumen_semanal || 0), volumenMensual: Number(c.volumen_mensual || 0),
        intensidad: c.intensidad, tiempoEfectivo: c.tiempo_efectivo,
        monotonia: Number(c.monotonia || 0), strain: Number(c.strain || 0),
        organizacion_id: c.organizacion_id,
      }));

      // 11. DISPONIBILIDAD
      this.memoryCache["disponibilidad_jugadores"] = dbDisponibilidad;

      // 12. PLANES DE RENDIMIENTO
      this.memoryCache["planes_rendimiento"] = dbPlanes;

      // 13. OBJETIVOS DE JUGADORES
      this.memoryCache["objetivos_jugadores"] = dbObjetivos;

      // 14. WELLNESS
      const fetchedMappedWellness = dbWellness.map((w: any) => {
        const score = Number(w.score || w.promedio || 0);
        return {
          id: w.id,
          jugadorId: w.jugador_id || w.jugadorId,
          jugador: w.jugador,
          avatar: w.avatar,
          fecha: w.fecha,
          // DB fields
          sueno: w.sueno,
          fatiga: w.fatiga,
          dolor: w.dolor,
          energia: w.energia,
          estres: w.estres,
          animo: w.animo,
          // Normalize to app UI schema
          sueñoCalidad: w.sueno || 3,
          sueñoHoras: w.sueñoHoras || w.horas_sueno || 8,
          dolorMuscular: w.dolor || 1,
          wellnessScore: score,
          score: score,
          promedio: score,
          nivel: w.nivel,
          tendencia: w.tendencia,
          organizacion_id: w.organizacion_id,
        };
      });

      const cachedLocalWellness = this.get<any[]>("wellness", []);
      const mergedWellnessMap = new Map<string, any>();
      cachedLocalWellness.forEach(w => {
        const key = `${w.jugadorId}_${w.fecha}`;
        mergedWellnessMap.set(key, w);
      });
      fetchedMappedWellness.forEach(w => {
        const key = `${w.jugadorId}_${w.fecha}`;
        mergedWellnessMap.set(key, w);
      });
      this.memoryCache["wellness"] = Array.from(mergedWellnessMap.values());

      // 15. RESULTADOS PRUEBAS FÍSICAS
      const fetchedMappedPruebas = dbPruebas.map((rp: any) => ({
        id: rp.id,
        jugadorId: rp.jugador_id || rp.jugadorId,
        jugador: rp.jugador,
        fecha: rp.fecha,
        tipoTest: rp.test || rp.tipoTest || "Yo-Yo Test",
        resultado: Number(rp.resultado || 0),
        unidad: rp.unidad,
        organizacion_id: rp.organizacion_id
      }));

      // Preservar pruebas locales que fueron guardadas previamente en localStorage
      const cachedLocalPruebas = this.get<any[]>("resultados_pruebas", []);
      const mergedPruebasMap = new Map<string, any>();
      
      cachedLocalPruebas.forEach(item => {
        const key = `${item.jugadorId}_${item.fecha}_${item.tipoTest}`;
        mergedPruebasMap.set(key, item);
      });

      fetchedMappedPruebas.forEach(item => {
        const key = `${item.jugadorId}_${item.fecha}_${item.tipoTest}`;
        mergedPruebasMap.set(key, item);
      });

      this.memoryCache["resultados_pruebas"] = Array.from(mergedPruebasMap.values());

      // 16. BANCO DE PRUEBAS FÍSICAS
      this.memoryCache["banco_pruebas"] = dbBancoPruebas.map((bp: any) => ({
        id: bp.id,
        nombre: bp.nombre,
        unidad: bp.unidad,
        emoji: bp.emoji || (bp.nombre.toLowerCase().includes("velocidad") ? "🏃" : "🔊"),
        organizacion_id: bp.organizacion_id
      }));

      // 17. CLASIFICACIONES
      this.memoryCache["clasificaciones"] = dbClasificaciones;

      // 18. MOVIMIENTOS CAJA
      this.memoryCache["movimientos_caja"] = dbCaja.map((m: any) => ({
        id: m.id, hora: m.hora, tipo: m.tipo, concepto: m.concepto,
        metodo: m.metodo, monto: Number(m.monto || 0), organizacion_id: m.organizacion_id,
      }));

      // 19. NOTIFICACIONES
      this.memoryCache["notificaciones"] = dbNotifs;

      // 20. TEMPORADAS
      this.memoryCache["temporadas"] = dbTemporadas;

      // 21. DISCIPLINAS
      this.memoryCache["disciplinas_dynamics"] = dbDisciplinas;

      // 22. SESIONES RECUPERACIÓN
      this.memoryCache["sesiones_recuperacion"] = dbRecuperacion;

      // 23. ORGANIZACIÓN ACTIVA (tabla singular)
      const dbOrg = dbOrgRes.data;
      if (dbOrg && dbOrg[0]) {
        this.memoryCache["org_config"] = dbOrg[0];
      }

      // 24. ORGANIZACIONES LIST
      const dbOrgs = dbOrgsRes.data;
      const dbOrgsErr = dbOrgsRes.error;
      if (dbOrgsErr) {
        console.warn("[Supabase] Error cargando organizaciones:", dbOrgsErr.message);
      } else if (dbOrgs && dbOrgs.length > 0) {
        this.memoryCache["organizaciones_dynamics"] = dbOrgs.map((o: any) => ({
          id: o.id,
          nombre: o.nombre,
          slug: o.slug,
          correo: o.correo_admin || o.correo,
          pais: o.pais,
          moneda: o.moneda,
          logo: o.logo,
          estado: o.estado
        }));
      }

      this.memoryCache["equipos_dynamics"] = dbEquipos.map((eq: any) => ({
        id: eq.id,
        nombre: eq.nombre,
        disciplina: eq.disciplina,
        categoria: eq.categoria,
        entrenador: eq.entrenador,
        sede: eq.sede,
        estado: eq.estado,
        logo: eq.logo,
        organizacion_id: eq.organizacion_id,
      }));

      // 26. ENTRENADORES DYNAMICS
      this.memoryCache["entrenadores_dynamics"] = dbEntrenadores.map((e: any) => ({
        id: e.id,
        nombre: e.nombre,
        identificacion: e.identificacion,
        cargo: e.cargo,
        correo: e.correo,
        telefono: e.telefono,
        especialidad: e.especialidad,
        sede: e.sede,
        sedeId: e.sede_id,
        horario: e.horario,
        disciplina: e.disciplina,
        disciplinas: e.disciplina ? [e.disciplina] : [],
        estado: e.estado,
        avatar: e.avatar,
        organizacion_id: e.organizacion_id,
      }));

      // 27. ASISTENCIAS DYNAMICS
      const cachedAsistencias = this.memoryCache["asistencias_dynamics"] || [];
      this.memoryCache["asistencias_dynamics"] = (dbAsistencias && dbAsistencias.length > 0)
        ? dbAsistencias
        : (cachedAsistencias.length > 0 ? cachedAsistencias : dbAsistencias || []);

      // 28. PLANIFICACIONES DYNAMICS
      const cachedPlans = this.memoryCache["planificaciones_dynamics"] || [];
      this.memoryCache["planificaciones_dynamics"] = (dbPlanificaciones && dbPlanificaciones.length > 0)
        ? dbPlanificaciones
        : (cachedPlans.length > 0 ? cachedPlans : dbPlanificaciones || []);

      // Guardar en localStorage cache para cargas instantáneas al recargar la app
      const cacheKeys = [
        "jugadores_dynamics",
        "pagos_dynamics",
        "categorias_dynamics",
        "sedes_dynamics",
        "entrenadores_dynamics",
        "equipos_dynamics",
        "organizaciones_dynamics",
        "asistencias_dynamics",
        "planificaciones_dynamics",
        "wellness",
        "resultados_pruebas"
      ];
      for (const k of cacheKeys) {
        if (this.memoryCache[k] !== undefined) {
          try {
            localStorage.setItem(`athletix_cache_${k}`, JSON.stringify(this.memoryCache[k]));
          } catch (err) {}
        }
      }

      this.isSynced = true;
      window.dispatchEvent(new Event("organizacionChanged"));
      console.log("[Supabase] Sincronización completa ✓");
    } catch (e) {
      console.error("Error sincronizando de Supabase:", e);
    } finally {
      this.syncPromise = null;
    }
    })();
    return this.syncPromise;
  }

  // Forzar re-sincronización desde Supabase
  public static async forceSync(): Promise<void> {
    this.isSynced = false;
    this.memoryCache = {};
    await this.syncFromSupabase();
  }



  public static get<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    
    // Si no se ha sincronizado, iniciar el proceso asíncronamente
    if (!this.isSynced) {
      this.syncFromSupabase();
    }

    if (this.memoryCache[key] !== undefined) {
      return this.memoryCache[key] as T;
    }

    if (key === "competiciones_dynamics" || key === "temporadas" || key === "resultados_pruebas" || key === "wellness" || key === "asistencias_dynamics") {
      try {
        const cached = localStorage.getItem(`athletix_cache_${key}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          this.memoryCache[key] = parsed;
          return parsed as T;
        }
      } catch (e) {}
    }

    // Si está vacío usar seeded fallback
    if (seededDb && (seededDb as any)[key] !== undefined) {
      const fallbackVal = (seededDb as any)[key];
      this.memoryCache[key] = fallbackVal;
      return fallbackVal as T;
    }

    return defaultValue;
  }

  public static async set<T>(key: string, value: T): Promise<void> {
    if (!this.isBrowser()) return;
    this.memoryCache[key] = value;

    if (key === "usuarios") {
      try {
        localStorage.setItem("athletix_hp_usuarios", JSON.stringify(value));
      } catch (e) {}
      return;
    }

    if (key === "competiciones_dynamics" || key === "temporadas" || key === "resultados_pruebas" || key === "wellness" || key === "asistencias_dynamics") {
      try {
        localStorage.setItem(`athletix_cache_${key}`, JSON.stringify(value));
      } catch (e) {}
    }

    if (key === "jugadores_dynamics") {
      try {
        localStorage.setItem("athletix_hp_jugadores_dynamics", JSON.stringify(value));
      } catch (e) {}
    }

    // Disparar sincronización asíncrona hacia Supabase en segundo plano
    const activeOrg = this.getActiveOrganizacionId();
    
    try {
      if (key === "jugadores_dynamics") {
        const jugadoresList = value as any[];
        const batch = jugadoresList.map((j) => ({
          id: j.id,
          nombre: j.nombre,
          identificacion: j.identificacion,
          correo: j.correo,
          telefono: j.telefono,
          genero: j.genero,
          fecha_nacimiento: j.fechaNacimiento,
          disciplina: j.disciplina,
          categoria: j.categoria,
          sede: j.sede,
          sede_id: j.sedeId,
          estado: j.esSuspendido ? "suspendido" : (j.estado || "activo"),
          estado_pago: j.estadoPago,
          saldo: j.saldo,
          avatar: j.avatar,
          qr: j.qr,
          encargado: j.encargado,
          parentesco: j.parentesco,
          telefono_encargado: j.telefonoEncargado,
          correo_encargado: j.correoEncargado,
          posicion: j.posicion,
          organizacion_id: activeOrg,
          padre_nombre: j.padreNombre,
          padre_ocupacion: j.padreOcupacion,
          padre_empresa: j.padreEmpresa,
          padre_telefono: j.padreTelefono,
          padre_correo: j.padreCorreo,
          padre_identificacion: j.padreIdentificacion,
          madre_nombre: j.madreNombre,
          madre_ocupacion: j.madreOcupacion,
          madre_empresa: j.madreEmpresa,
          madre_telefono: j.madreTelefono,
          madre_correo: j.madreCorreo,
          madre_identificacion: j.madreIdentificacion,
          encargado_identificacion: j.encargadoIdentificacion,
          parentesco_firmante: j.parentescoFirmante,
          nombre_firmante: j.nombreFirmante,
          identificacion_firmante: j.identificacionFirmante,
          barrio: j.barrio,
          direccion: j.direccion,
          telefono_residencia: j.telefonoResidencia,
          tipo_sangre: j.tipoSangre,
          seguro_eps: j.seguroEps,
          enfermedades: j.enfermedades,
          cirugias: j.cirugias,
          alergias_input: j.alergiasInput,
          lesiones_input: j.lesionesInput,
          institucion_educativa: j.institucionEducativa,
          grado_actual: j.gradoActual,
          peso: j.peso,
          altura: j.altura,
          consent_liberacion: j.consentLiberacion,
          consent_datos: j.consentDatos,
          consent_fotos: j.consentFotos,
          firma_base64: j.firmaBase64,
        }));
        const { error } = await supabase.from("jugadores").upsert(batch);
        if (error) {
          console.error("[Supabase Error] jugadores batch upsert failed:", error.message);
          toast.error("Error al guardar jugadores en la base de datos: " + error.message);
        }
      } 
      else if (key === "pagos_dynamics") {
        const pagosList = value as any[];
        const batch = pagosList.map((p) => ({
          id: p.id,
          jugador: p.jugador,
          monto: p.monto,
          metodo: p.metodo,
          referencia: p.referencia,
          fecha: p.fecha,
          estado: p.estado,
          organizacion_id: activeOrg,
        }));
        const { error } = await supabase.from("pagos").upsert(batch);
        if (error) console.error("[Supabase Error] pagos batch upsert failed:", error.message);
      }
      else if (key === "categorias_dynamics") {
        const catList = value as any[];
        const batch = catList.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          disciplina: c.disciplina,
          edad_min: c.edadMin !== undefined ? c.edadMin : null,
          edad_max: c.edadMax !== undefined ? c.edadMax : null,
          genero: c.genero !== undefined ? c.genero : null,
          sede_id: c.sedeId !== undefined ? c.sedeId : null,
          entrenador: c.entrenador,
          capacidad: c.capacidad !== undefined ? Number(c.capacidad) : 20,
          jugadores: c.jugadores !== undefined ? Number(c.jugadores) : 0,
          costo_mensual: c.costoMensual !== undefined ? Number(c.costoMensual) : 30000,
          estado: c.estado,
          organizacion_id: activeOrg,
        }));
        const { error } = await supabase.from("categorias").upsert(batch);
        if (error) console.error("[Supabase Error] categorias batch upsert failed:", error.message);
      }
      else if (key === "sedes_dynamics") {
        const sedesList = value as any[];
        const batch = sedesList.map((s) => ({
          id: s.id,
          nombre: s.nombre,
          direccion: s.direccion,
          disciplina: s.disciplina,
          encargado: s.encargado,
          estado: s.estado,
          organizacion_id: activeOrg,
        }));
        const { error } = await supabase.from("sedes").upsert(batch);
        if (error) console.error("[Supabase Error] sedes batch upsert failed:", error.message);
      }
      else if (key === "entrenadores_dynamics") {
        const list = value as any[];
        const batch = list.map((e) => ({
          id: e.id,
          nombre: e.nombre,
          identificacion: e.identificacion,
          correo: e.correo,
          telefono: e.telefono,
          especialidad: e.especialidad,
          disciplina: e.disciplinas && e.disciplinas.length > 0 ? e.disciplinas[0] : (e.disciplina || null),
          horario: e.horario,
          sede_id: e.sedeId,
          estado: e.estado,
          avatar: e.avatar,
          organizacion_id: activeOrg,
        }));
        const { error } = await supabase.from("entrenadores").upsert(batch);
        if (error) console.error("[Supabase Error] entrenadores batch upsert failed:", error.message);
      }
      else if (key === "equipos_dynamics") {
        const list = value as any[];
        const batch = list.map((eq) => ({
          id: eq.id,
          nombre: eq.nombre,
          disciplina: eq.disciplina,
          categoria: eq.categoria,
          entrenador: eq.entrenador,
          sede: eq.sede,
          estado: eq.estado,
          logo: eq.logo,
          organizacion_id: activeOrg,
        }));
        const { error } = await supabase.from("equipos").upsert(batch);
        if (error) console.error("[Supabase Error] equipos batch upsert failed:", error.message);
      }
      else if (key === "temporadas") {
        const list = value as any[];
        const batch = list.map((t) => ({
          id: t.id,
          nombre: t.nombre,
          inicio: t.inicio,
          fin: t.fin,
          sedes: t.sedes,
          equipos: t.equipos,
          disciplinas: t.disciplinas,
          estado: t.estado,
          organizacion_id: activeOrg,
        }));
        const { error } = await supabase.from("temporadas").upsert(batch);
        if (error) console.error("[Supabase Error] temporadas batch upsert failed:", error.message);
      }
      else if (key === "organizaciones_dynamics") {
        const list = value as any[];
        const batch = list.map((o) => ({
          id: o.id,
          nombre: o.nombre,
          slug: o.slug || o.nombre.toLowerCase().trim().replace(/\s+/g, "-"),
          correo_admin: o.correo,
          pais: o.pais,
          moneda: o.moneda,
          logo: o.logo,
          estado: o.estado || "activo",
        }));
        const { error } = await supabase.from("organizaciones").upsert(batch);
        if (error) console.error("[Supabase Error] organizaciones batch upsert failed:", error.message);
      }
      else if (key === "asistencias_dynamics") {
        const list = value as any[];
        const batch = list.map((a) => ({
          id: a.id,
          fecha: a.fecha,
          equipo: a.equipo,
          registro: a.registro,
          organizacion_id: activeOrg,
        }));
        const { error } = await supabase.from("asistencias").upsert(batch);
        if (error) console.error("[Supabase Error] asistencias batch upsert failed:", error.message);
      }
      else if (key === "planificaciones_dynamics") {
        const list = value as any[];
        const batch = list.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          fecha_inicio: p.fecha_inicio,
          fecha_fin: p.fecha_fin,
          objetivos: p.objetivos,
          ejercicios: p.ejercicios,
          equipo: p.equipo,
          organizacion_id: activeOrg,
        }));
        const { error } = await supabase.from("planificaciones").upsert(batch);
        if (error) console.error("[Supabase Error] planificaciones batch upsert failed:", error.message);
      }
      else if (key === "wellness") {
        const list = value as any[];
        const batch = list.map((w) => ({
          id: w.id,
          jugador_id: w.jugadorId,
          jugador: w.jugador,
          fecha: w.fecha,
          sueno: w.sueñoHoras !== undefined ? w.sueñoHoras : (w.sueno || 8),
          fatiga: w.fatiga || 5,
          dolor: w.dolorMuscular !== undefined ? w.dolorMuscular : (w.dolor || 1),
          energia: w.energia || 8,
          estres: w.estres || 5,
          animo: w.animo || 8,
          promedio: w.score || w.promedio || 70,
          score: w.score || 70,
          organizacion_id: activeOrg
        }));
        const { error } = await supabase.from("registros_wellness").upsert(batch);
        if (error) console.error("[Supabase Error] registros_wellness batch upsert failed:", error.message);
      }
      else if (key === "resultados_pruebas") {
        const list = value as any[];
        const batch = list.map((rp) => ({
          id: rp.id,
          jugador_id: rp.jugadorId,
          jugador: rp.jugador,
          fecha: rp.fecha,
          test_id: (rp.tipoTest || rp.test || "prueba").toLowerCase().replace(/\s+/g, "-"),
          test: rp.tipoTest || rp.test || "Prueba Física",
          resultado: rp.resultado,
          unidad: rp.unidad,
          organizacion_id: activeOrg
        }));
        const { error } = await supabase.from("resultados_pruebas_fisicas").upsert(batch);
        if (error) console.error("[Supabase Error] resultados_pruebas_fisicas batch upsert failed:", error.message);
      }
      else if (key === "lesiones") {
        const list = value as any[];
        const batch = list.map((l) => ({
          id: l.id,
          jugador_id: l.jugadorId,
          jugador: l.jugador,
          fecha: l.fecha,
          tipo: l.tipo,
          zona_corporal: l.zonaCorporal,
          gravedad: l.gravedad,
          diagnostico: l.diagnostico,
          tratamiento: l.tratamiento,
          dolor: l.dolor,
          movilidad: l.movilidad,
          progreso_rtp: l.progresoRtp,
          retorno_checklist: l.retornoChecklist,
          restricciones: l.restricciones,
          carga_permitida: l.cargaPermitida,
          completada: l.completada,
          organizacion_id: activeOrg,
        }));
        const { error } = await supabase.from("lesiones").upsert(batch);
        if (error) console.error("[Supabase Error] lesiones batch upsert failed:", error.message);
      }
    } catch (err) {
      console.error("[Supabase Sync Error]", err);
      throw err;
    }
  }

  // --- ASISTENCIAS DYNAMICS ---
  public static getAsistencias(): any[] {
    return this.get<any[]>("asistencias_dynamics", []);
  }

  public static getAsistencia(equipo: string, fecha: string): any | null {
    const list = this.getAsistencias();
    return list.find(a => a.equipo === equipo && a.fecha === fecha) || null;
  }

  public static async saveAsistencia(equipo: string, fecha: string, registro: Record<string, "P" | "T" | "A" | "J">): Promise<void> {
    const list = this.getAsistencias();
    const existing = list.find(a => a.equipo === equipo && a.fecha === fecha);
    const activeOrg = this.getActiveOrganizacionId();

    if (existing) {
      existing.registro = registro;
    } else {
      list.push({
        id: `asist_${equipo}_${fecha}`,
        fecha,
        equipo,
        registro,
        organizacion_id: activeOrg
      });
    }

    await this.set("asistencias_dynamics", list);
    window.dispatchEvent(new Event("organizacionChanged"));
  }

  // --- PLANIFICACIONES DYNAMICS ---
  public static getPlanificaciones(): any[] {
    const list = this.get<any[]>("planificaciones_dynamics", []);
    const hasU13Plan = list.some(p => p.id === "plan_u13_seed" || p.nombre.toLowerCase().includes("transición"));
    if (!hasU13Plan) {
      list.unshift({
        id: "plan_u13_seed",
        nombre: "Microciclo 1: Transición Defensiva",
        fecha_inicio: "2026-07-20",
        fecha_fin: "2026-07-24",
        objetivos: "Planificar los objetivos y ciclos de entrenamiento (Planificación). Evitar improvisaciones metodológicas.",
        ejercicios: [
          { id: "ex_u13_1", nombre: "Ejercicio 1: Rondo de recuperación rápida", duracion: 20 },
          { id: "ex_u13_2", nombre: "Ejercicio 2: Repliegue en bloque medio", duracion: 30 }
        ],
        equipo: "U13",
        organizacion_id: this.getActiveOrganizacionId()
      });
      this.set("planificaciones_dynamics", list);
    }
    return list;
  }

  public static async addPlanificacion(p: any): Promise<void> {
    const list = this.getPlanificaciones();
    const idx = list.findIndex(item => item.id === p.id);
    if (idx > -1) {
      list[idx] = p;
    } else {
      list.push(p);
    }
    await this.set("planificaciones_dynamics", list);
    window.dispatchEvent(new Event("organizacionChanged"));
  }

  public static async deletePlanificacion(id: string): Promise<void> {
    const list = this.getPlanificaciones().filter((item) => item.id !== id);
    await this.set("planificaciones_dynamics", list);
    window.dispatchEvent(new Event("organizacionChanged"));
  }

  // --- SESIONES ---
  public static getSesiones(): Sesion[] {
    const list = this.get<Sesion[]>("sesiones", []);
    const activeTeams = this.getEquipos().map(e => e.nombre);
    return list.filter(s => activeTeams.includes(s.equipo));
  }

  public static addSesion(s: Omit<Sesion, "id">): Sesion {
    const list = this.getSesiones();
    const newItem: Sesion = { ...s, id: generateUniqueId("s") };
    list.push(newItem);
    this.set("sesiones", list);
    return newItem;
  }

  public static updateSesion(id: string, s: Partial<Sesion>): void {
    const list = this.getSesiones();
    const idx = list.findIndex((item) => item.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...s };
      this.set("sesiones", list);
    }
  }

  public static deleteSesion(id: string): void {
    const list = this.getSesiones().filter((item) => item.id !== id);
    this.set("sesiones", list);
  }

  // --- CICLOS ---
  public static getCiclos(): Ciclo[] {
    const list = this.get<Ciclo[]>("ciclos", INITIAL_CICLOS);
    if (list.length > 0 && !list.some(c => c.equipo === "Fútbol Sub-10")) {
      const merged = [...list, ...INITIAL_CICLOS.filter(c => c.equipo !== "Sub-16")];
      this.set("ciclos", merged);
      return merged;
    }
    return list;
  }

  public static addCiclo(c: Omit<Ciclo, "id">): Ciclo {
    const list = this.getCiclos();
    const newItem: Ciclo = { ...c, id: generateUniqueId("c") };
    list.push(newItem);
    this.set("ciclos", list);
    return newItem;
  }

  public static updateCiclo(id: string, c: Partial<Ciclo>): void {
    const list = this.getCiclos();
    const idx = list.findIndex((item) => item.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...c };
      this.set("ciclos", list);
    }
  }

  // --- WELLNESS ---
  public static getWellness(): WellnessRegistro[] {
    const list = this.get<WellnessRegistro[]>("wellness", []);
    const activePlayerIds = this.getJugadores().map(p => p.id);
    return list.filter(w => activePlayerIds.includes(w.jugadorId));
  }

  public static addWellness(w: Omit<WellnessRegistro, "id">): WellnessRegistro {
    const list = this.getWellness();
    const wellnessScore = calcWellnessScore(w);
    const hora = new Date().toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
    const newItem: WellnessRegistro = {
      ...w,
      id: generateUniqueId("w"),
      hora,
      score: wellnessScore,
      wellnessScore,
    };
    list.push(newItem);
    this.set("wellness", list);
    return newItem;
  }

  // --- SPORTS SCIENCE ENGINE ---
  public static getSportsScoreData(): SportsScoreData[] {
    const wellness  = this.getWellness();
    const sesiones  = this.getSesiones();
    const lesiones  = this.getLesiones();

    const activeOrgId = this.getActiveOrganizacionId();
    const storedPlayers = this.getJugadores().filter(p =>
      !activeOrgId || !p.organizacion_id || p.organizacion_id === activeOrgId
    );

    const jugadoresMap = storedPlayers.map(p => ({
      id: p.id,
      nombre: p.nombre,
      avatar: p.avatar || `https://i.pravatar.cc/100?u=${p.id}`,
      equipo: p.categoria || "Sin equipo",
    }));

    return jugadoresMap.map(j => {
      const jugLogs = [...wellness]
        .filter(l => l.jugadorId === j.id)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      const ultimoLog = jugLogs[0];
      const wScore    = ultimoLog?.wellnessScore ?? ultimoLog?.score ?? 50;
      const fatiga    = ultimoLog ? invertScore(ultimoLog.fatiga) : 50;
      const recup     = ultimoLog ? invertScore(ultimoLog.dolorMuscular) : 50;

      const acwr          = calcACWR(sesiones, j.equipo);
      const lesionActiva  = lesiones.find(l => l.jugadorId === j.id && !l.completada);
      const lesionScore   = lesionActiva
        ? (lesionActiva.gravedad === "Grave" ? 0 : lesionActiva.gravedad === "Moderada" ? 50 : 75)
        : 100;

      const sportsScore = calcSportsScore(wScore, acwr, fatiga, lesionScore);

      // Carga sesiones
      const hoy   = new Date();
      const hoyStr = hoy.toISOString().split("T")[0];

      const getSemanal = () => {
        const start = new Date(hoy); start.setDate(hoy.getDate() - 7);
        return sesiones
          .filter(s => s.equipo === j.equipo && new Date(s.fecha) >= start)
          .reduce((acc, s) => acc + (s.carga || 0), 0);
      };
      const getMensual = () => {
        const start = new Date(hoy); start.setDate(hoy.getDate() - 30);
        return sesiones
          .filter(s => s.equipo === j.equipo && new Date(s.fecha) >= start)
          .reduce((acc, s) => acc + (s.carga || 0), 0);
      };
      const cargaHoy = sesiones
        .filter(s => s.equipo === j.equipo && s.fecha === hoyStr)
        .reduce((acc, s) => acc + (s.carga || 0), 0);

      // Tendencia (comparar últimos 3 días vs 3 anteriores)
      const recent = jugLogs.slice(0, 3).reduce((acc, l) => acc + (l.wellnessScore || l.score || 0), 0) / 3;
      const prev   = jugLogs.slice(3, 6).reduce((acc, l) => acc + (l.wellnessScore || l.score || 0), 0) / Math.max(jugLogs.slice(3, 6).length, 1);
      const tendencia: "subiendo" | "estable" | "bajando" = recent > prev + 5 ? "subiendo" : recent < prev - 5 ? "bajando" : "estable";

      const estado: "excelente" | "bueno" | "precaución" | "riesgo" | "sin_registro" = !ultimoLog ? "sin_registro" :
        (sportsScore >= 90 ? "excelente" : sportsScore >= 75 ? "bueno" : sportsScore >= 55 ? "precaución" : "riesgo");

      // Historial 7 días
      const historial = jugLogs.slice(0, 7).reverse().map(l => ({
        fecha: l.fecha,
        score: l.wellnessScore ?? l.score ?? 0,
        wellnessScore: l.wellnessScore ?? l.score ?? 0,
        carga: sesiones
          .filter(s => s.equipo === j.equipo && s.fecha === l.fecha)
          .reduce((acc, s) => acc + (s.carga || 0), 0),
      }));

      return {
        jugadorId:        j.id,
        jugador:          j.nombre,
        avatar:           j.avatar,
        equipo:           j.equipo,
        fecha:            hoyStr,
        sportsScore,
        wellnessScore:    wScore,
        acwr,
        fatigaScore:      fatiga,
        recuperacionScore: recup,
        lesionScore,
        cargaHoy,
        cargaSemanal:     getSemanal(),
        cargaMensual:     getMensual(),
        tendencia,
        estado,
        historial,
      };
    });
  }

  public static getWellnessAlertas(): WellnessAlerta[] {
    const wellness = this.getWellness();
    const jugadorIds = [...new Set(wellness.map(l => l.jugadorId))];
    return jugadorIds.flatMap(id => generarAlertas(wellness, id));
  }

  // --- PLAYER LOAD ENGINE ---
  public static getPlayerLoadData(): PlayerLoadData[] {
    const playerCargas = this.get<any[]>("cargas_entrenamiento", []);
    const wellness  = this.getWellness();
    const lesiones  = this.getLesiones();

    const activeOrgId = this.getActiveOrganizacionId();
    const storedPlayers = this.getJugadores().filter(p =>
      !activeOrgId || !p.organizacion_id || p.organizacion_id === activeOrgId
    );

    const jugadoresMap = storedPlayers.map(p => ({
      id: p.id,
      nombre: p.nombre,
      avatar: p.avatar || `https://i.pravatar.cc/100?u=${p.id}`,
      equipo: p.categoria || "Sin equipo",
    }));

    return jugadoresMap.map(j => {
      const hoy    = new Date();
      const hoyStr = hoy.toISOString().split("T")[0];
      const jugCargas = playerCargas.filter(c => c.jugadorId === j.id);

      // Carga acumulada total
      const cargaTemporada = jugCargas.reduce((acc, c) => acc + (c.cargaInterna || 0), 0);
      const cargaMaxima    = jugCargas.reduce((acc, c) => Math.max(acc, c.cargaInterna || 0), 0);

      // Hoy
      const cargaHoy = jugCargas
        .filter(c => c.fecha === hoyStr)
        .reduce((acc, c) => acc + (c.cargaInterna || 0), 0);

      // Semanal
      const startSem = new Date(hoy); startSem.setDate(hoy.getDate() - 7);
      const cargaSemanal = jugCargas
        .filter(c => new Date(c.fecha) >= startSem)
        .reduce((acc, c) => acc + (c.cargaInterna || 0), 0);

      // Mensual
      const startMes = new Date(hoy); startMes.setDate(hoy.getDate() - 30);
      const cargaMensual = jugCargas
        .filter(c => new Date(c.fecha) >= startMes)
        .reduce((acc, c) => acc + (c.cargaInterna || 0), 0);

      // Pseudo sesiones for ACWR and acute/chronic math
      const pseudoSesiones: Sesion[] = jugCargas.map(c => ({
        id: c.id,
        nombre: "Entrenamiento",
        tipo: "Técnica",
        fecha: c.fecha,
        hora: "00:00",
        duracion: c.duracion || 60,
        equipo: j.equipo,
        rpe: c.rpe || 5,
        carga: c.cargaInterna || 300,
      }));

      // Carga Aguda (avg 7 días)
      const cargaAguda   = calcCargaAguda(pseudoSesiones, j.equipo);
      // Carga Crónica (avg 28 días)
      const cargaCronica = calcCargaCronica(pseudoSesiones, j.equipo);
      // ACWR
      const acwr = cargaCronica > 0 ? Math.round((cargaAguda / cargaCronica) * 100) / 100 : 1.0;

      // Último wellness
      const jugLogs = wellness
        .filter(w => w.jugadorId === j.id)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      const ultimo = jugLogs[0];

      // Días consecutivos
      const diasConsecutivos = calcDiasConsecutivos(pseudoSesiones, j.equipo);

      // Fatiga
      const fatigaScore = calcFatigaScore(
        cargaAguda,
        ultimo?.score ?? ultimo?.wellnessScore ?? ultimo?.promedio ?? 70,
        ultimo?.dolorMuscular ?? 2,
        ultimo?.estres ?? 2,
        diasConsecutivos
      );

      // Recovery
      const recoveryScore = calcRecoveryScore(
        ultimo?.sueñoCalidad ?? 4,
        ultimo?.sueñoHoras ?? 8,
        ultimo?.dolorMuscular ?? 2,
        ultimo?.score ?? ultimo?.wellnessScore ?? ultimo?.promedio ?? 70,
        cargaAguda
      );

      // Semáforo
      const lesionActiva    = lesiones.some(l => l.jugadorId === j.id && !l.completada);
      const cargaSemanaPrev = calcCargaSemanaPrev(pseudoSesiones, j.equipo);
      const hasSessions     = jugCargas.length > 0;
      const currentScore = ultimo?.score ?? ultimo?.wellnessScore ?? ultimo?.promedio ?? 70;
      const semaforo = (!hasSessions && !ultimo) ? {
        color: "gris" as SemaforoColor,
        motivos: ["Sin entrenamientos ni wellness registrados hoy."],
        recomendacion: "Registra entrenamientos o encuestas de bienestar para habilitar el motor de riesgo."
      } : calcSemaforo(acwr, fatigaScore, currentScore, lesionActiva, diasConsecutivos, cargaSemanal, cargaSemanaPrev);

      // Historial 28 días para gráficos
      const historialCargas = Array.from({ length: 28 }, (_, i) => {
        const d = new Date(hoy); d.setDate(hoy.getDate() - (27 - i));
        const fechaStr = d.toISOString().split("T")[0];
        const dayLoad = jugCargas
          .filter(c => c.fecha === fechaStr)
          .reduce((acc, c) => acc + (c.cargaInterna || 0), 0);
        const dayWellness = jugLogs.find(w => w.fecha === fechaStr);
        return {
          fecha:    fechaStr.slice(5),
          carga:    dayLoad,
          acwr:     0, // computed lazily
          fatiga:   dayWellness ? calcFatigaScore(dayLoad, dayWellness.wellnessScore ?? 70, dayWellness.dolorMuscular, dayWellness.estres, 0) : 50,
          recovery: dayWellness ? calcRecoveryScore(dayWellness.sueñoCalidad, dayWellness.sueñoHoras, dayWellness.dolorMuscular, dayWellness.wellnessScore ?? 70, dayLoad) : 60,
        };
      });

      return {
        jugadorId:    j.id,
        jugador:      j.nombre,
        avatar:       j.avatar,
        equipo:       j.equipo,
        cargaHoy,
        cargaSemanal,
        cargaMensual,
        cargaCronica,
        cargaAguda,
        cargaMaxima,
        cargaTemporada,
        acwr,
        fatigaScore,
        recoveryScore,
        wellnessScore:         ultimo?.wellnessScore ?? ultimo?.score ?? 70,
        semaforo:              semaforo.color,
        semaforoMotivos:       semaforo.motivos,
        semaforoRecomendacion: semaforo.recomendacion,
        historialCargas,
      };
    });
  }

  // --- SPORTS ALERTAS ---
  public static getSportsAlertas(): SportsAlerta[] {
    return generarSportsAlertas(this.getSesiones(), this.getWellness());
  }

  // --- SESIONES COMPLETAS (nuevo formato con tipo extendido) ---
  public static addSesionCompleta(s: Omit<SesionCompleta, "id" | "cargaInterna">): SesionCompleta {
    // Mapear al formato Sesion para almacenar
    const cargaInterna = s.duracion * s.rpe;
    const sesion: Omit<Sesion, "id"> = {
      nombre:   s.nombre,
      tipo:     s.tipo as any,
      fecha:    s.fecha,
      hora:     s.hora,
      duracion: s.duracion,
      equipo:   s.equipo,
      rpe:      s.rpe,
      carga:    cargaInterna,
    };
    const saved = this.addSesion(sesion);
    return { ...s, id: saved.id, cargaInterna };
  }

  // --- TESTS ---
  public static getTests(): TestFisico[] {
    const rawPruebas = this.get<any[]>("resultados_pruebas", []);
    if (rawPruebas && rawPruebas.length > 0) {
      return rawPruebas.map(rp => {
        const name = rp.test || rp.tipoTest || "Yo-Yo Test";
        let tipo = "Resistencia";
        if (name.toLowerCase().includes("sprint") || name.toLowerCase().includes("velocidad")) tipo = "Velocidad";
        else if (name.toLowerCase().includes("salto") || name.toLowerCase().includes("cmj")) tipo = "Salto";
        else if (name.toLowerCase().includes("fuerza") || name.toLowerCase().includes("banc")) tipo = "Fuerza";
        else if (name.toLowerCase().includes("yo-yo") || name.toLowerCase().includes("cooper") || name.toLowerCase().includes("navette")) tipo = "Resistencia";
        else if (name.toLowerCase().includes("agilidad") || name.toLowerCase().includes("illinois")) tipo = "Agilidad";

        return {
          id: rp.id,
          jugadorId: rp.jugadorId || rp.jugador_id,
          jugador: rp.jugador,
          fecha: rp.fecha,
          tipo: tipo as any,
          nombreTest: name,
          resultado: `${rp.resultado} ${rp.unidad || ""}`.trim(),
          progreso: rp.delta ? Number(rp.delta) : 5.0,
          estancado: rp.estancado || false,
        };
      });
    }
    return this.get<TestFisico[]>("tests", INITIAL_TESTS);
  }

  public static addTest(t: Omit<TestFisico, "id">): TestFisico {
    const list = this.get<any[]>("resultados_pruebas", []);
    const newDbItem = {
      id: generateUniqueId("rp"),
      jugador_id: t.jugadorId,
      jugador: t.jugador,
      fecha: t.fecha,
      test: t.nombreTest,
      resultado: parseFloat(t.resultado) || 0,
      unidad: t.resultado.includes("seg") || t.nombreTest.toLowerCase().includes("velocidad") ? "segundos" : "nivel",
      delta: t.progreso,
      organizacion_id: this.getActiveOrganizacionId() || "00000000-0000-0000-0000-000000000000"
    };
    list.push(newDbItem);
    this.set("resultados_pruebas", list);

    const testsList = this.get<TestFisico[]>("tests", []);
    const newItem: TestFisico = { ...t, id: newDbItem.id };
    testsList.push(newItem);
    this.set("tests", testsList);
    return newItem;
  }

  // --- NÓMINA & HONORARIOS DE ENTRENADORES ---
  public static getNominas(): RegistroNominaEntrenador[] {
    return this.get<RegistroNominaEntrenador[]>("nominas_entrenadores", []);
  }

  public static saveNomina(nomina: RegistroNominaEntrenador) {
    const list = this.getNominas();
    const idx = list.findIndex(n => n.id === nomina.id);
    let updated: RegistroNominaEntrenador[] = [];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = nomina;
    } else {
      updated = [nomina, ...list];
    }
    this.set("nominas_entrenadores", updated);

    const activeOrg = this.getActiveOrganizacionId();
    supabase.from("nominas_entrenadores").upsert({
      id: nomina.id,
      organizacion_id: activeOrg,
      entrenador_id: nomina.entrenadorId,
      entrenador_nombre: nomina.entrenadorNombre,
      periodo_inicio: nomina.periodoInicio,
      periodo_fin: nomina.periodoFin,
      sesiones_concluidas: nomina.sesionesConcluidas,
      partidos_concluidos: nomina.partidosConcluidos,
      tarifa_sesion: nomina.tarifaSesion,
      bono_partido: nomina.bonoPartido,
      monto_sesiones: nomina.montoSesiones,
      monto_partidos: nomina.montoPartidos,
      monto_ajustes: nomina.montoAjustes,
      notas_ajustes: nomina.notasAjustes,
      monto_total: nomina.montoTotal,
      moneda: nomina.moneda,
      estado: nomina.estado,
      fecha_pago: nomina.fechaPago,
    }).then(({ error }) => {
      if (error) console.error("[Supabase Error] nominas_entrenadores upsert:", error.message);
    });
  }

  public static aprobarNomina(nominaId: string) {
    const list = this.getNominas();
    const item = list.find(n => n.id === nominaId);
    if (!item) return;

    const fechaHoy = new Date().toISOString().slice(0, 10);
    const updated: RegistroNominaEntrenador = {
      ...item,
      estado: "pagado",
      fechaPago: fechaHoy,
    };

    this.saveNomina(updated);

    const egresoId = `egr_nom_${updated.id}`;
    const egresoItem = {
      id: egresoId,
      nombre: `Nómina Entrenador: ${updated.entrenadorNombre}`,
      categoria: "Salarios y Honorarios",
      sede: "Cobertura General",
      monedaCode: updated.moneda,
      monto: updated.montoTotal,
      fecha: fechaHoy,
      descripcion: `Pago de honorarios período ${updated.periodoInicio} al ${updated.periodoFin}. (${updated.sesionesConcluidas} sesiones, ${updated.partidosConcluidos} partidos)`,
      proveedor: updated.entrenadorNombre,
      metodoPago: "Transferencia SINPE",
      estado: "pagado",
      referencia_id: updated.id,
      organizacion_id: this.getActiveOrganizacionId(),
    };

    const egresosList = this.get<any[]>("egresos_dynamics", []);
    const filteredEgresos = egresosList.filter(e => e.id !== egresoId);
    this.set("egresos_dynamics", [egresoItem, ...filteredEgresos]);

    supabase.from("egresos").upsert(egresoItem).then(({ error }) => {
      if (error) console.error("[Supabase Error] egresos upsert from nomina:", error.message);
    });
  }

  public static updateTest(id: string, t: Partial<TestFisico>): void {
    const list = this.get<any[]>("resultados_pruebas", []);
    const idx = list.findIndex((item) => item.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...t, delta: t.progreso !== undefined ? t.progreso : list[idx].delta };
      this.set("resultados_pruebas", list);
    }
    const testsList = this.get<TestFisico[]>("tests", []);
    const idx2 = testsList.findIndex((item) => item.id === id);
    if (idx2 !== -1) {
      testsList[idx2] = { ...testsList[idx2], ...t };
      this.set("tests", testsList);
    }
  }

  // --- LESIONES ---
  public static getLesiones(): Lesion[] {
    const list = this.get<Lesion[]>("lesiones", []);
    const activePlayerIds = this.getJugadores().map(p => p.id);
    return list.filter(l => activePlayerIds.includes(l.jugadorId));
  }

  public static addLesion(l: Omit<Lesion, "id">): Lesion {
    const list = this.getLesiones();
    const newItem: Lesion = { ...l, id: generateUniqueId("l") };
    list.push(newItem);
    this.set("lesiones", list);
    return newItem;
  }

  public static updateLesion(id: string, l: Partial<Lesion>): void {
    const list = this.getLesiones();
    const idx = list.findIndex((item) => item.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...l };
      this.set("lesiones", list);
    }
  }

  // --- ÁREA MÉDICA & HISTORIAL CLÍNICO ---
  public static getHistorialMedico(jugadorId: string): any {
    const all = this.get<Record<string, any>>("historiales_medicos", {});
    if (all[jugadorId]) return all[jugadorId];

    return {
      jugadorId,
      estadoMedico: "alta",
      diagnosticoActual: "Apto para alta competencia deportiva (Categoría U13). Control de crecimiento en fase puberal.",
      medicoAsignado: "Dr. Roberto Solano (Deportólogo Infantil/Juvenil)",
      fisioterapeutaAsignado: "Licda. Mariela Castro",
      fechaUltimaValoracion: new Date().toISOString().split("T")[0],
      antecedentesPatologicos: "Sin intervenciones quirúrgicas. Resecado por esguince leve de tobillo en 2025.",
      tratamientosFarmacologicos: "Suplementación multivitamínica U13 y bebidas de rehidratación isotónica post-partido.",
      alergias: "Alergia estacional a polen y picadura de insectos.",
      historialLesiones: "Distensión Grado 1 en abductor derecho (recuperación completa en 10 días).",
      problemasOrtopedicos: "Leve hiperpronación en retropié izquierdo. Uso de plantillas ortopédicas deportivas.",
      antecedentesFamiliares: "Sin antecedentes de cardiopatía temprana ni enfermedades crónico-degenerativas.",
      incidenciasAuscultacion: "Ritmo cardíaco sinusal normal. Frecuencia en reposo 62 bpm. Presión 110/70 mmHg.",
      observacionesGenerales: "Deportista U13 en excelente condición aeróbica y desarrollo físico acorde a edad biológica."
    };
  }

  public static saveHistorialMedico(data: any): void {
    const all = this.get<Record<string, any>>("historiales_medicos", {});
    all[data.jugadorId] = data;
    this.set("historiales_medicos", all);
  }

  public static getValoracionesAntropometricas(jugadorId?: string): any[] {
    const list = this.get<any[]>("antropometrias", [
      {
        id: "ant-1",
        jugadorId: jugadorId || "j1",
        fecha: "2026-07-10",
        pesoKg: 48.5,
        alturaCm: 156,
        imc: 19.9,
        porcentajeGrasa: 12.8,
        porcentajeMasaMuscular: 44.2,
        sugerenciaNutricional: "Plan de alimentación equilibrado hiperproteico para deportista U13 en desarrollo.",
        evaluador: "Dra. Sofía Mora (Nutricionista Deportiva)"
      },
      {
        id: "ant-2",
        jugadorId: jugadorId || "j1",
        fecha: "2026-05-15",
        pesoKg: 47.8,
        alturaCm: 154,
        imc: 20.1,
        porcentajeGrasa: 13.2,
        porcentajeMasaMuscular: 43.5,
        sugerenciaNutricional: "Reforzar consumo de calcio y carbohidratos complejos previo a torneos U13.",
        evaluador: "Dra. Sofía Mora"
      }
    ]);
    if (jugadorId) {
      const filtered = list.filter(a => a.jugadorId === jugadorId);
      if (filtered.length > 0) return filtered;
    }
    return list;
  }

  public static addValoracionAntropometrica(v: any): any {
    const list = this.getValoracionesAntropometricas();
    const imc = parseFloat((v.pesoKg / Math.pow(v.alturaCm / 100, 2)).toFixed(2));
    const newItem = { ...v, id: generateUniqueId("ant"), imc };
    list.unshift(newItem);
    this.set("antropometrias", list);
    return newItem;
  }

  public static updateValoracionAntropometrica(id: string, update: Partial<any>): void {
    const list = this.getValoracionesAntropometricas();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...update };
      if (update.pesoKg && update.alturaCm) {
        list[idx].imc = parseFloat((update.pesoKg / Math.pow(update.alturaCm / 100, 2)).toFixed(2));
      }
      this.set("antropometrias", list);
    }
  }

  public static deleteValoracionAntropometrica(id: string): void {
    const list = this.getValoracionesAntropometricas();
    const filtered = list.filter(a => a.id !== id);
    this.set("antropometrias", filtered);
  }

  public static getCitasFisioterapia(jugadorId?: string): any[] {
    const list = this.get<any[]>("citas_fisioterapia", [
      {
        id: "cit-1",
        jugadorId: jugadorId || "j1",
        jugadorNombre: "Santiago Jiménez Valverde",
        fisioterapeutaNombre: "Licda. Mariela Castro",
        fecha: "2026-07-23",
        hora: "15:00",
        motivo: "Descarga muscular miofascial y estiramientos dirigidos (U13)",
        tratamientoAplicado: "Masaje miofascial + Crioterapia en gemelos",
        nivelDolorEva: 2,
        estado: "programada"
      },
      {
        id: "cit-2",
        jugadorId: jugadorId || "j2",
        jugadorNombre: "Ian Gutiérrez Solano",
        fisioterapeutaNombre: "Lic. Carlos Fonseca",
        fecha: "2026-07-18",
        hora: "14:00",
        motivo: "Rehabilitación de sobrecarga articular pre-partido",
        tratamientoAplicado: "Ultrasonido pulsado + Kinesiotaping",
        nivelDolorEva: 3,
        estado: "completada"
      },
      {
        id: "cit-3",
        jugadorId: jugadorId || "j3",
        jugadorNombre: "Mateo Rojas Calvo",
        fisioterapeutaNombre: "Licda. Mariela Castro",
        fecha: "2026-07-25",
        hora: "10:30",
        motivo: "Evaluación biomecánica y readaptación de rodilla",
        tratamientoAplicado: "Electroterapia TENS + Ejercicios en bosu",
        nivelDolorEva: 4,
        estado: "programada"
      }
    ]);
    if (jugadorId) {
      const filtered = list.filter(c => c.jugadorId === jugadorId);
      if (filtered.length > 0) return filtered;
    }
    return list;
  }

  public static addCitaFisioterapia(c: any): any {
    const list = this.getCitasFisioterapia();
    const newItem = { ...c, id: generateUniqueId("cit") };
    list.unshift(newItem);
    this.set("citas_fisioterapia", list);

    supabase.from("citas_fisioterapia").upsert({
      id: newItem.id,
      jugador_id: newItem.jugadorId,
      jugador_nombre: newItem.jugadorNombre,
      fisioterapeuta_nombre: newItem.fisioterapeutaNombre,
      fecha: newItem.fecha,
      hora: newItem.hora,
      motivo: newItem.motivo,
      tratamiento_aplicado: newItem.tratamientoAplicado,
      nivel_dolor_eva: newItem.nivelDolorEva,
      estado: newItem.estado,
      organizacion_id: this.getActiveOrganizacionId(),
    }).then(({ error }) => {
      if (error) console.error("[Supabase Error] citas_fisioterapia upsert:", error.message);
    });

    return newItem;
  }

  public static updateCitaFisioterapia(id: string, update: any): void {
    const list = this.getCitasFisioterapia();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...update };
      this.set("citas_fisioterapia", list);

      supabase.from("citas_fisioterapia").upsert({
        id: list[idx].id,
        jugador_id: list[idx].jugadorId,
        jugador_nombre: list[idx].jugadorNombre,
        fisioterapeuta_nombre: list[idx].fisioterapeutaNombre,
        fecha: list[idx].fecha,
        hora: list[idx].hora,
        motivo: list[idx].motivo,
        tratamiento_aplicado: list[idx].tratamientoAplicado,
        nivel_dolor_eva: list[idx].nivelDolorEva,
        estado: list[idx].estado,
        organizacion_id: this.getActiveOrganizacionId(),
      }).then(({ error }) => {
        if (error) console.error("[Supabase Error] citas_fisioterapia update:", error.message);
      });
    }
  }

  public static deleteCitaFisioterapia(id: string): void {
    const list = this.getCitasFisioterapia();
    const filtered = list.filter(c => c.id !== id);
    this.set("citas_fisioterapia", filtered);
  }

  // --- PARTES DE LESIONES ---
  public static getPartesLesiones(jugadorId?: string): any[] {
    const list = this.get<any[]>("partes_lesiones_lista", [
      {
        id: "pl-1",
        jugadorId: jugadorId || "j1",
        fechaBaja: "2026-07-12",
        fechaAltaEstimada: "2026-07-26",
        tipoLesion: "Esguince de Tobillo Izquierdo Grado 1 (Torneo U13)",
        equipoCategoria: "U13",
        medicoTratante: "Dr. Roberto Solano",
        estado: "en_recuperacion"
      },
      {
        id: "pl-2",
        jugadorId: jugadorId || "j1",
        fechaBaja: "2026-06-01",
        fechaAltaEstimada: "2026-06-08",
        tipoLesion: "Sobrecarga Isquiotibial Derecha",
        equipoCategoria: "U13",
        medicoTratante: "Dr. Roberto Solano",
        estado: "alta_emitida"
      }
    ]);
    if (jugadorId) {
      const filtered = list.filter(p => p.jugadorId === jugadorId);
      if (filtered.length > 0) return filtered;
    }
    return list;
  }

  public static addParteLesion(p: any): any {
    const list = this.getPartesLesiones();
    const newItem = { ...p, id: generateUniqueId("pl") };
    list.unshift(newItem);
    this.set("partes_lesiones_lista", list);
    return newItem;
  }

  public static updateParteLesion(id: string, update: Partial<any>): void {
    const list = this.getPartesLesiones();
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...update };
      this.set("partes_lesiones_lista", list);
    }
  }

  public static deleteParteLesion(id: string): void {
    const list = this.getPartesLesiones();
    const filtered = list.filter(p => p.id !== id);
    this.set("partes_lesiones_lista", filtered);
  }

  // --- CONTROL DE INFECCIONES ---
  public static getControlInfecciones(jugadorId?: string): any[] {
    const list = this.get<any[]>("control_infecciones_lista", [
      {
        id: "inf-1",
        jugadorId: jugadorId || "j1",
        fecha: "2026-07-04",
        diagnostico: "Cuadro Gripal / Faringitis Aguda U13",
        diasAislamiento: 3,
        requiereReposo: true,
        altaEmitida: true,
        tipoInfeccion: "Faringitis Aguda",
        fechaInicio: "2026-07-04",
        fechaRecuperacion: "2026-07-07",
        tratamiento: "Aislamiento preventivo + Abundante hidratación",
        medicamentos: "Paracetamol 500mg cada 8 horas",
        observaciones: "Alta médica otorgada sin secuelas respiratorias.",
        fechaRegistro: "2026-07-04",
        medico: "Dra. Sofía Mora"
      }
    ]);
    if (jugadorId) {
      const filtered = list.filter(i => i.jugadorId === jugadorId);
      if (filtered.length > 0) return filtered;
    }
    return list;
  }

  public static addControlInfeccion(inf: any): any {
    const list = this.getControlInfecciones();
    const newItem = { ...inf, id: generateUniqueId("inf") };
    list.unshift(newItem);
    this.set("control_infecciones_lista", list);
    return newItem;
  }

  public static updateControlInfeccion(id: string, update: Partial<any>): void {
    const list = this.getControlInfecciones();
    const idx = list.findIndex(i => i.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...update };
      this.set("control_infecciones_lista", list);
    }
  }

  public static deleteControlInfeccion(id: string): void {
    const list = this.getControlInfecciones();
    const filtered = list.filter(i => i.id !== id);
    this.set("control_infecciones_lista", filtered);
  }

  // --- CONTROL DE TEMPERATURA & VITALES ---
  public static getControlTemperatura(jugadorId?: string): any[] {
    const list = this.get<any[]>("control_temperatura_lista", [
      {
        id: "temp-1",
        jugadorId: jugadorId || "j1",
        fecha: "2026-07-22",
        hora: "08:30 AM",
        temperaturaCelsius: 36.6,
        presionArterial: "112/72",
        ritmoCardiaco: 68,
        alertaFiebre: false,
        observaciones: "Control térmico preventivo pre-entrenamiento U13.",
        evaluador: "Licda. Mariela Castro"
      },
      {
        id: "temp-2",
        jugadorId: jugadorId || "j1",
        fecha: "2026-07-15",
        hora: "08:30 AM",
        temperaturaCelsius: 36.8,
        presionArterial: "110/70",
        ritmoCardiaco: 65,
        alertaFiebre: false,
        observaciones: "Evaluación fisiológica normal.",
        evaluador: "Licda. Mariela Castro"
      }
    ]);
    if (jugadorId) {
      const filtered = list.filter(t => t.jugadorId === jugadorId);
      if (filtered.length > 0) return filtered;
    }
    return list;
  }

  public static addControlTemperatura(t: any): any {
    const list = this.getControlTemperatura();
    const newItem = { ...t, id: generateUniqueId("temp") };
    list.unshift(newItem);
    this.set("control_temperatura_lista", list);
    return newItem;
  }

  public static updateControlTemperatura(id: string, update: Partial<any>): void {
    const list = this.getControlTemperatura();
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...update };
      this.set("control_temperatura_lista", list);
    }
  }

  public static deleteControlTemperatura(id: string): void {
    const list = this.getControlTemperatura();
    const filtered = list.filter(t => t.id !== id);
    this.set("control_temperatura_lista", filtered);
  }

  // --- PARTE MÉDICO DIARIO ---
  public static getParteMedicoDiario(jugadorId?: string): any[] {
    const list = this.get<any[]>("parte_medico_diario_lista", [
      {
        id: "pmd-1",
        jugadorId: jugadorId || "j1",
        fecha: "2026-07-22",
        diagnostico: "Sobrecarga leve en cuadríceps derecho post-partido U13",
        exploracion: "Palpación con ligera molestia muscular. Rango articular sin limitación.",
        tratamiento: "Crioterapia local 15 min + Trabajo aeróbico en bicicleta estática",
        observaciones: "Apto con restricción: Realizar fase táctica sin duelos de contacto alto.",
        esBajaMedica: false,
        medico: "Dr. Roberto Solano"
      },
      {
        id: "pmd-2",
        jugadorId: jugadorId || "j1",
        fecha: "2026-07-12",
        diagnostico: "Esguince leve de tobillo izquierdo Grado 1",
        exploracion: "Edema localizado en ligamento peroneoastragalino anterior.",
        tratamiento: "Reposo deportivo, vendaje funcional e inflamatorios tópicos",
        observaciones: "Baja Médica Preventiva de 72 horas para reposo articular.",
        esBajaMedica: true,
        medico: "Dr. Roberto Solano"
      }
    ]);
    if (jugadorId) {
      const filtered = list.filter(p => p.jugadorId === jugadorId);
      if (filtered.length > 0) return filtered;
    }
    return list;
  }

  public static addParteMedicoDiario(p: any): any {
    const list = this.getParteMedicoDiario();
    const newItem = { ...p, id: generateUniqueId("pmd") };
    list.unshift(newItem);
    this.set("parte_medico_diario_lista", list);
    return newItem;
  }

  public static updateParteMedicoDiario(id: string, update: Partial<any>): void {
    const list = this.getParteMedicoDiario();
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...update };
      this.set("parte_medico_diario_lista", list);
    }
  }

  public static deleteParteMedicoDiario(id: string): void {
    const list = this.getParteMedicoDiario();
    const filtered = list.filter(p => p.id !== id);
    this.set("parte_medico_diario_lista", filtered);
  }

  // --- SYSTEM USERS ---
  public static getUsuarios(): SistemaUsuario[] {
    const USERS_MIGRATION_VERSION = "v2-alex-only";
    const superAdmin: SistemaUsuario = { id: "u-1", nombre: "Alex", email: "alex@mail.com", role: "superadmin", sedeId: "s1", sede: "Sede Central", estado: "activo", fechaCreacion: "2026-01-01", organizacion_id: "00000000-0000-0000-0000-000000000000" };

    if (!this.isBrowser()) return [superAdmin];

    const migrationDone = localStorage.getItem("athletix_usuarios_migration");
    if (migrationDone !== USERS_MIGRATION_VERSION) {
      localStorage.removeItem("athletix_hp_usuarios");
      localStorage.setItem("athletix_usuarios_migration", USERS_MIGRATION_VERSION);
      localStorage.setItem("athletix_hp_usuarios", JSON.stringify([superAdmin]));
    }

    let list: SistemaUsuario[] = [];
    try {
      const stored = localStorage.getItem("athletix_hp_usuarios");
      list = stored ? JSON.parse(stored) : [superAdmin];
    } catch (e) {
      list = [superAdmin];
    }

    // Always ensure alex is in the list
    if (!list.some(u => u.email === "alex@mail.com")) {
      list.unshift(superAdmin);
      localStorage.setItem("athletix_hp_usuarios", JSON.stringify(list));
    }

    const activeOrgId = this.getActiveOrganizacionId();
    return list.filter(u => u.organizacion_id === activeOrgId || (!u.organizacion_id && activeOrgId === "00000000-0000-0000-0000-000000000000"));
  }

  public static addUsuario(u: Omit<SistemaUsuario, "id" | "estado" | "codigoAcceso" | "fechaCreacion">): SistemaUsuario {
    let list: SistemaUsuario[] = [];
    try {
      const stored = localStorage.getItem("athletix_hp_usuarios");
      list = stored ? JSON.parse(stored) : [];
    } catch (e) {}

    const sedeName = sedes.find(s => s.id === u.sedeId)?.nombre ?? "Sede Central";
    const randomCode = `ATH-${Math.floor(1000 + Math.random() * 9000)}`;
    const activeOrgId = this.getActiveOrganizacionId();
    const newUser: SistemaUsuario = {
      ...u, id: generateUniqueId("u"), sede: sedeName, estado: "invitado",
      codigoAcceso: randomCode, fechaCreacion: new Date().toISOString().split("T")[0],
      organizacion_id: activeOrgId
    };
    list.push(newUser);
    localStorage.setItem("athletix_hp_usuarios", JSON.stringify(list));
    return newUser;
  }  // --- JUGADORES DYNAMICS ---
  public static getJugadores(): StoreJugador[] {
    if (!this.isBrowser()) return [];
    
    let stored = this.get<StoreJugador[]>("jugadores_dynamics", null as any);
    
    if (stored === null || stored.length === 0) {
      // Inyectar datos iniciales
      const defaultPlayers = jugadores && jugadores.length > 0 ? jugadores : [];
      this.set("jugadores_dynamics", defaultPlayers);
      stored = defaultPlayers;
    }

    let hasUpdates = false;
    const processed = stored.map(j => {
      if (!j.madreNombre || !j.padreNombre) {
        hasUpdates = true;
      }
      return ensureParentData(j);
    });

    if (hasUpdates) {
      this.set("jugadores_dynamics", processed);
      stored = processed;
    } else {
      stored = processed;
    }

    const activeOrg = this.getActiveOrganizacionId();
    const filtered = stored.filter(j => j.organizacion_id === activeOrg || (!j.organizacion_id && activeOrg === "00000000-0000-0000-0000-000000000000"));
    return filtered.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }

  public static addJugador(j: Omit<StoreJugador, "id" | "avatar" | "saldo" | "estadoPago" | "edad" | "qr">): StoreJugador {
    const list = this.get<StoreJugador[]>("jugadores_dynamics", []);
    const edad = calcularEdad(j.fechaNacimiento);
    const avatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    ];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];
    
    // Buscar costo de la categoría
    const cats = this.getCategorias();
    const assignedCat = cats.find(c => c.nombre === j.categoria);
    const initialSaldo = assignedCat?.costoMensual ?? 30000;

    const newJugador: StoreJugador = ensureParentData({
      ...j, 
      id: generateUniqueId("j"), 
      edad, 
      avatar, 
      saldo: initialSaldo, 
      estadoPago: initialSaldo > 0 ? "pendiente" : "al_dia", 
      qr: generateUniqueId("ATH-QR"),
      organizacion_id: this.getActiveOrganizacionId()
    } as any);
    list.push(newJugador);
    this.set("jugadores_dynamics", list);
    return newJugador;
  }

  public static addJugadoresBatch(players: Omit<StoreJugador, "id" | "avatar" | "saldo" | "estadoPago" | "edad" | "qr">[]): StoreJugador[] {
    const list = this.get<StoreJugador[]>("jugadores_dynamics", []);
    const cats = this.getCategorias();
    const avatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    ];

    const addedPlayers: StoreJugador[] = [];

    for (const j of players) {
      const edad = calcularEdad(j.fechaNacimiento);
      const avatar = avatars[Math.floor(Math.random() * avatars.length)];
      const assignedCat = cats.find(c => c.nombre === j.categoria);
      const initialSaldo = assignedCat?.costoMensual ?? 30000;

      const newJugador: StoreJugador = ensureParentData({
        ...j,
        id: generateUniqueId("j"),
        edad,
        avatar,
        saldo: initialSaldo,
        estadoPago: initialSaldo > 0 ? "pendiente" : "al_dia",
        qr: generateUniqueId("ATH-QR"),
        organizacion_id: this.getActiveOrganizacionId()
      } as any);
      
      list.push(newJugador);
      addedPlayers.push(newJugador);
    }

    this.set("jugadores_dynamics", list);
    return addedPlayers;
  }

  public static updateJugador(id: string, j: Partial<StoreJugador>): void {
    const list = this.get<StoreJugador[]>("jugadores_dynamics", []);
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...j };
      if (j.fechaNacimiento) {
        const birthYear = new Date(j.fechaNacimiento).getFullYear();
        list[idx].edad = new Date().getFullYear() - birthYear;
      }
      this.set("jugadores_dynamics", list);
    }
  }

  public static clearJugadores(): void {
    this.set("jugadores_dynamics", []);
    if (this.isBrowser()) {
      const activeOrg = this.getActiveOrganizacionId();
      supabase.from("jugadores").delete().eq("organizacion_id", activeOrg).then(({ error }) => {
        if (error) {
          console.error("[Supabase Error] clear jugadores failed:", error.message);
          toast.error("Error al vaciar jugadores: " + error.message);
        } else {
          toast.success("Academia vaciada de jugadores.");
        }
      });
    }
  }

  public static deleteJugador(id: string): void {
    const list = this.get<StoreJugador[]>("jugadores_dynamics", []);
    const filtered = list.filter(x => x.id !== id);
    this.set("jugadores_dynamics", filtered);
    if (this.isBrowser()) {
      supabase.from("jugadores").delete().eq("id", id).then(({ error }) => {
        if (error) {
          console.error("[Supabase Error] delete player failed:", error.message);
          toast.error("Error al eliminar jugador de la nube: " + error.message);
        } else {
          toast.success("Jugador eliminado correctamente.");
        }
      });
    }
  }

  // --- ENTRENADORES DYNAMICS ---
  public static getEntrenadores(): StoreEntrenador[] {
    if (!this.isBrowser()) return [];
    const stored = this.get<StoreEntrenador[]>("entrenadores_dynamics", entrenadores);
    const activeOrg = this.getActiveOrganizacionId();
    return stored.filter(e => e.organizacion_id === activeOrg || (!e.organizacion_id && activeOrg === "00000000-0000-0000-0000-000000000000"));
  }

  public static addEntrenador(e: Omit<StoreEntrenador, "id" | "categorias" | "avatar"> & { avatar?: string }): StoreEntrenador {
    const list = this.get<StoreEntrenador[]>("entrenadores_dynamics", entrenadores);
    const newEntrenador: StoreEntrenador = {
      ...e,
      id: `t${list.length + 1}`,
      categorias: 0,
      avatar: e.avatar || `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 30) + 1}`,
      organizacion_id: this.getActiveOrganizacionId()
    } as any;
    list.push(newEntrenador);
    this.set("entrenadores_dynamics", list);

    if (this.isBrowser()) {
      supabase.from("entrenadores").insert([{
        id: newEntrenador.id,
        nombre: newEntrenador.nombre,
        identificacion: newEntrenador.identificacion,
        correo: newEntrenador.correo,
        telefono: newEntrenador.telefono,
        whatsapp: newEntrenador.whatsapp,
        especialidad: newEntrenador.especialidad,
        disciplinas: newEntrenador.disciplinas,
        sede_id: newEntrenador.sedeId,
        horario: newEntrenador.horario,
        estado: newEntrenador.estado,
        avatar: newEntrenador.avatar,
        organizacion_id: newEntrenador.organizacion_id
      }]).then(({ error }) => {
        if (error) {
          console.error("[Supabase Error] add coach failed:", error.message);
          toast.error("Error al guardar entrenador en la nube: " + error.message);
        } else {
          toast.success("Entrenador guardado en la nube correctamente.");
        }
      });
    }

    return newEntrenador;
  }

  public static updateEntrenador(id: string, e: Partial<StoreEntrenador>): void {
    const list = this.get<StoreEntrenador[]>("entrenadores_dynamics", []);
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...e };
      this.set("entrenadores_dynamics", list);

      if (this.isBrowser()) {
        const updateData: any = {};
        if (e.nombre !== undefined) updateData.nombre = e.nombre;
        if (e.identificacion !== undefined) updateData.identificacion = e.identificacion;
        if (e.correo !== undefined) updateData.correo = e.correo;
        if (e.telefono !== undefined) updateData.telefono = e.telefono;
        if (e.whatsapp !== undefined) updateData.whatsapp = e.whatsapp;
        if (e.especialidad !== undefined) updateData.especialidad = e.especialidad;
        if (e.disciplinas !== undefined) updateData.disciplinas = e.disciplinas;
        if (e.sedeId !== undefined) updateData.sede_id = e.sedeId;
        if (e.horario !== undefined) updateData.horario = e.horario;
        if (e.estado !== undefined) updateData.estado = e.estado;
        if (e.avatar !== undefined) updateData.avatar = e.avatar;

        supabase.from("entrenadores").update(updateData).eq("id", id).then(({ error }) => {
          if (error) {
            console.error("[Supabase Error] update coach failed:", error.message);
            toast.error("Error al actualizar entrenador en la nube: " + error.message);
          } else {
            toast.success("Entrenador actualizado en la nube correctamente.");
          }
        });
      }
    }
  }

  public static deleteEntrenador(id: string): void {
    const list = this.get<StoreEntrenador[]>("entrenadores_dynamics", []);
    const filtered = list.filter(x => x.id !== id);
    this.set("entrenadores_dynamics", filtered);
    if (this.isBrowser()) {
      supabase.from("entrenadores").delete().eq("id", id).then(({ error }) => {
        if (error) {
          console.error("[Supabase Error] delete coach failed:", error.message);
          toast.error("Error al eliminar entrenador de la nube: " + error.message);
        } else {
          toast.success("Entrenador eliminado de la nube correctamente.");
        }
      });
    }
  }

  // --- CATEGORIAS DYNAMICS ---
  public static getCategorias(): any[] {
    if (!this.isBrowser()) return [];
    const stored = this.get<any[]>("categorias_dynamics", categorias);
    const activeOrg = this.getActiveOrganizacionId();
    return stored.map(cat => {
      const val = cat.costo_mensual !== undefined && cat.costo_mensual !== null ? cat.costo_mensual : cat.costoMensual;
      return {
        ...cat,
        costoMensual: val !== undefined && val !== null ? Number(val) : 30000
      };
    }).filter(c => c.organizacion_id === activeOrg || (!c.organizacion_id && activeOrg === "00000000-0000-0000-0000-000000000000"));
  }

  public static addCategoria(c: any): any {
    const list = this.get<any[]>("categorias_dynamics", categorias);
    const newCat = {
      ...c,
      id: `c${list.length + 1}`,
      costoMensual: c.costoMensual ?? 30000,
      jugadores: c.jugadores ?? 0,
      estado: c.estado ?? "activo",
      organizacion_id: this.getActiveOrganizacionId()
    };
    list.push(newCat);
    this.set("categorias_dynamics", list);
    return newCat;
  }

  public static updateCategoria(id: string, c: Partial<any>): void {
    const list = this.get<any[]>("categorias_dynamics", categorias);
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...c };
      this.set("categorias_dynamics", list);
    }
  }

  public static deleteCategoria(id: string): void {
    const list = this.get<any[]>("categorias_dynamics", categorias);
    const filtered = list.filter(x => x.id !== id);
    this.set("categorias_dynamics", filtered);
    if (this.isBrowser()) {
      supabase.from("categorias").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("[Supabase Error] delete category failed:", error.message);
      });
    }
  }

  // --- PAGOS Y TRANSACCIONES REALES ---
  public static getPagos(): any[] {
    if (!this.isBrowser()) return [];
    const activeOrg = this.getActiveOrganizacionId();
    const stored = this.get<any[]>("pagos_dynamics", []);
    const allJugadores = this.get<StoreJugador[]>("jugadores_dynamics", []);

    // Normaliza texto para comparación robusta (sin tildes, minúsculas)
    const norm = (s: string) =>
      (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    return stored
      .filter(p => p.organizacion_id === activeOrg)
      .map(p => {
        // Si ya tiene categoría válida no hay que buscar de nuevo
        if (p.categoria && p.categoria !== "Sin categoría") return p;
        // Buscar jugador por id exacto primero, luego por nombre normalizado
        const player =
          allJugadores.find(j => j.id === p.jugadorId) ||
          allJugadores.find(j => norm(j.nombre) === norm(p.jugador));
        return { ...p, categoria: player?.categoria || "Sin categoría" };
      });
  }

  public static addPago(pago: { jugadorId: string; jugadorNombre: string; monto: number; metodo: string; referencia: string }): any {
    const list = this.get<any[]>("pagos_dynamics", []);
    const activeOrg = this.getActiveOrganizacionId();
    const randomRef = pago.referencia || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const jugadoresList = this.get<StoreJugador[]>("jugadores_dynamics", []);
    const player = jugadoresList.find(x => x.id === pago.jugadorId);
    const newPago = {
      id: generateUniqueId("pag"),
      referencia: randomRef,
      jugador: pago.jugadorNombre,
      jugadorId: pago.jugadorId,
      categoria: player?.categoria || "Sin categoría",
      monto: pago.monto,
      metodo: pago.metodo,
      fecha: new Date().toISOString().split("T")[0],
      estado: "completado",
      organizacion_id: activeOrg
    };
    list.unshift(newPago);
    this.set("pagos_dynamics", list);

    // Descontar del saldo del jugador y cambiar su estado de pago
    const jIdx = jugadoresList.findIndex(x => x.id === pago.jugadorId);
    if (jIdx !== -1) {
      const currentSaldo = jugadoresList[jIdx].saldo || 0;
      const newSaldo = Math.max(0, currentSaldo - pago.monto);
      jugadoresList[jIdx].saldo = newSaldo;
      jugadoresList[jIdx].estadoPago = newSaldo === 0 ? "al_dia" : newSaldo > 30000 ? "moroso" : "pendiente";
      this.set("jugadores_dynamics", jugadoresList);
    }

    return newPago;
  }
  public static revertPago(pagoId: string): void {
    const list = this.get<any[]>("pagos_dynamics", []);
    const pago = list.find(x => x.id === pagoId);
    if (!pago) return;

    // Remover de la lista
    const filtered = list.filter(x => x.id !== pagoId);
    this.set("pagos_dynamics", filtered);

    // Devolver el monto al saldo del jugador
    const jugadoresList = this.get<StoreJugador[]>("jugadores_dynamics", []);
    const jIdx = jugadoresList.findIndex(x => x.id === pago.jugadorId);
    if (jIdx !== -1) {
      const currentSaldo = jugadoresList[jIdx].saldo || 0;
      const newSaldo = currentSaldo + (pago.monto || 0);
      jugadoresList[jIdx].saldo = newSaldo;
      
      // Ajustar estado de pago correspondiente
      const cats = this.getCategorias();
      const cat = cats.find(c => c.nombre === jugadoresList[jIdx].categoria);
      const costo = cat?.costoMensual ?? 30000;
      
      jugadoresList[jIdx].estadoPago = newSaldo === 0 ? "al_dia" : newSaldo > costo ? "moroso" : "pendiente";
      this.set("jugadores_dynamics", jugadoresList);
    }
  }
  // --- EQUIPOS DYNAMICS ---
  public static getEquipos(): any[] {
    if (!this.isBrowser()) return [];
    const activeOrg = this.getActiveOrganizacionId();
    const stored = this.get<any[] | null>("equipos_dynamics", equipos);
    if (stored === null || stored.length === 0) {
      this.set("equipos_dynamics", equipos);
      return (equipos as any[]).filter(e => e.organizacion_id === activeOrg || (!e.organizacion_id && activeOrg === "00000000-0000-0000-0000-000000000000"));
    }
    return stored.filter(e => e.organizacion_id === activeOrg || (!e.organizacion_id && activeOrg === "00000000-0000-0000-0000-000000000000"));
  }

  public static getPartidos(): any[] {
    if (!this.isBrowser()) return [];
    const activeOrg = this.getActiveOrganizacionId();
    const stored = this.get<any[]>("partidos", []);
    return stored.filter(p => p.organizacion_id === activeOrg || (!p.organizacion_id && activeOrg === "00000000-0000-0000-0000-000000000000"));
  }

  /** Inserta un partido nuevo directamente en memoryCache + localStorage cache */
  public static addPartido(partido: any): any {
    if (!this.isBrowser()) return partido;
    const activeOrg = this.getActiveOrganizacionId();
    const newPartido = { ...partido, organizacion_id: activeOrg };
    // Initialize memoryCache["partidos"] if not present
    if (!this.memoryCache["partidos"]) this.memoryCache["partidos"] = [];
    this.memoryCache["partidos"] = [newPartido, ...this.memoryCache["partidos"]];
    try {
      localStorage.setItem("athletix_cache_partidos", JSON.stringify(this.memoryCache["partidos"]));
    } catch (e) { /* ignore */ }
    return newPartido;
  }

  public static addEquipo(eq: any): any {
    const list = this.get<any[]>("equipos_dynamics", equipos);
    const newEq = {
      ...eq,
      id: `eq${list.length + 1}`,
      jugadores: eq.jugadores ?? 0,
      estado: eq.estado ?? "activo",
      organizacion_id: this.getActiveOrganizacionId()
    };
    list.push(newEq);
    this.set("equipos_dynamics", list);
    return newEq;
  }

  public static updateEquipo(id: string, eq: Partial<any>): void {
    const list = this.get<any[]>("equipos_dynamics", equipos);
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...eq };
      this.set("equipos_dynamics", list);
    }
  }

  public static deleteEquipo(id: string): void {
    const list = this.get<any[]>("equipos_dynamics", equipos);
    const filtered = list.filter(x => x.id !== id);
    this.set("equipos_dynamics", filtered);
    if (this.isBrowser()) {
      supabase.from("equipos").delete().eq("id", id).then(({ error }) => {
        if (error) {
          console.error("[Supabase Error] delete team failed:", error.message);
          toast.error("Error al eliminar equipo de la nube: " + error.message);
        } else {
          toast.success("Equipo eliminado de la nube correctamente.");
        }
      });
    }
  }

  public static assignCategoriasToEntrenador(coachName: string, selectedCats: string[]): void {
    const catsList = this.get<any[]>("categorias_dynamics", []);
    catsList.forEach(c => {
      if (selectedCats.includes(c.nombre)) {
        c.entrenador = coachName;
      } else if (c.entrenador === coachName) {
        c.entrenador = "Sin asignar";
      }
    });
    this.set("categorias_dynamics", catsList);

    const eqList = this.get<any[]>("equipos_dynamics", []);
    eqList.forEach(eq => {
      if (selectedCats.includes(eq.categoria)) {
        eq.entrenador = coachName;
      } else if (eq.entrenador === coachName) {
        eq.entrenador = "Sin asignar";
      }
    });
    this.set("equipos_dynamics", eqList);
  }

  // --- ORGANIZACIONES (TENANTS) ---
  public static getOrganizaciones(): any[] {
    const defaultOrgs = [
      { id: "00000000-0000-0000-0000-000000000000", nombre: "Academia Asoderive", slug: "asoderive", correo: "admin@asoderive.com", pais: "Costa Rica" }
    ];
    return this.get<any[]>("organizaciones_dynamics", defaultOrgs);
  }

  public static addOrganizacion(org: any): any {
    const list = this.getOrganizaciones();
    const newOrg = {
      ...org,
      id: typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : generateUniqueId("org"),
      slug: org.nombre.toLowerCase().trim().replace(/\s+/g, "-"),
      estado: "activo",
    };
    list.push(newOrg);
    this.set("organizaciones_dynamics", list);
    return newOrg;
  }

  // --- SEDES DYNAMICS ---
  public static getSedes(): any[] {
    if (!this.isBrowser()) return [];
    const activeOrg = this.getActiveOrganizacionId();
    const stored = this.get<any[] | null>("sedes_dynamics", null);
    if (stored === null) {
      this.set("sedes_dynamics", []);
      return [];
    }
    return stored.filter(s => s.organizacion_id === activeOrg);
  }

  public static addSede(sede: any): any {
    const list = this.get<any[]>("sedes_dynamics", []);
    const newSede = {
      ...sede,
      id: generateUniqueId("sede"),
      organizacion_id: this.getActiveOrganizacionId()
    };
    list.push(newSede);
    this.set("sedes_dynamics", list);
    return newSede;
  }

  public static getActiveOrganizacionId(): string {
    if (!this.isBrowser()) return "00000000-0000-0000-0000-000000000000";
    return localStorage.getItem("active_organizacion_id") || "00000000-0000-0000-0000-000000000000";
  }

  public static setActiveOrganizacionId(id: string): void {
    if (this.isBrowser()) {
      localStorage.setItem("active_organizacion_id", id);
      window.dispatchEvent(new Event("organizacionChanged"));
    }
  }

  // --- RESULTADOS PRUEBAS FISICAS ---
  public static getResultadosPruebas(): any[] {
    if (!this.isBrowser()) return [];
    const activeOrg = this.getActiveOrganizacionId();
    const stored = this.get<any[]>("resultados_pruebas", []);
    return stored.filter(rp => !rp.organizacion_id || rp.organizacion_id === activeOrg || activeOrg === "00000000-0000-0000-0000-000000000000");
  }

  public static async addResultadoPrueba(rp: { jugadorId: string; jugador: string; fecha: string; tipoTest: string; resultado: number; unidad: string; notas?: string }): Promise<any> {
    const list = this.get<any[]>("resultados_pruebas", []);
    const activeOrg = this.getActiveOrganizacionId();
    
    // Si ya existe un test del mismo tipo hoy para ese jugador, lo sobrescribimos.
    const existingIdx = list.findIndex(
      x => x.jugadorId === rp.jugadorId && x.fecha === rp.fecha && x.tipoTest === rp.tipoTest
    );
    
    const newRecord = {
      id: existingIdx !== -1 ? list[existingIdx].id : generateUniqueId("rp"),
      ...rp,
      organizacion_id: activeOrg
    };

    if (existingIdx !== -1) {
      list[existingIdx] = newRecord;
    } else {
      list.push(newRecord);
    }

    await this.set("resultados_pruebas", list);
    return newRecord;
  }

  // --- BANCO DE WELLNESS (PREGUNTAS) ---
  public static getBancoWellness(): any[] {
    const defaultWellness = [
      { id: "w_sueno", nombre: "¿Cómo durmió anoche?", tipo: "normal", emoji: "😴", activo: true },
      { id: "w_fatiga", nombre: "¿Qué tanto cansancio/fatiga siente?", tipo: "inverso", emoji: "⚡", activo: true },
      { id: "w_dolor", nombre: "¿Tiene molestias o dolores musculares?", tipo: "inverso", emoji: "🩹", activo: true },
      { id: "w_estres", nombre: "¿Qué tan estresado se siente?", tipo: "inverso", emoji: "🧠", activo: true }
    ];
    const stored = this.get<any[]>("banco_wellness", defaultWellness);
    return stored;
  }

  public static async saveBancoWellness(list: any[]): Promise<void> {
    await this.set("banco_wellness", list);
  }

  // --- BANCO DE PRUEBAS FISICAS ---
  public static getBancoPruebas(): any[] {
    const defaultPruebas = [
      { id: "bp_velocidad", nombre: "Velocidad (30m)", unidad: "segundos", emoji: "🏃" },
      { id: "bp_yoyo", nombre: "Yo-Yo Test", unidad: "nivel", emoji: "🔊" }
    ];
    const stored = this.get<any[]>("banco_pruebas", defaultPruebas);
    return stored;
  }

  public static async addBancoPrueba(p: { nombre: string; unidad: string; emoji: string }): Promise<any> {
    const list = this.getBancoPruebas();
    const newP = {
      id: generateUniqueId("bp"),
      ...p,
      organizacion_id: this.getActiveOrganizacionId()
    };
    list.push(newP);
    await this.set("banco_pruebas", list);
    return newP;
  }

  public static async deleteBancoPrueba(id: string): Promise<void> {
    const list = this.getBancoPruebas().filter(p => p.id !== id);
    await this.set("banco_pruebas", list);
  }

  // --- CLASIFICACIONES (STANDINGS) ---
  public static getClasificaciones(): any[] {
    if (!this.isBrowser()) return [];
    const activeOrg = this.getActiveOrganizacionId();
    const stored = this.get<any[]>("clasificaciones", []);
    return stored.filter(c => c.organizacion_id === activeOrg || (!c.organizacion_id && activeOrg === "00000000-0000-0000-0000-000000000000"));
  }

  // --- TEMPORADAS ---
  public static getTemporadas(): any[] {
    if (!this.isBrowser()) return [];
    const activeOrg = this.getActiveOrganizacionId();
    const stored = this.get<any[]>("temporadas", []);
    return stored.filter(t => t.organizacion_id === activeOrg || (!t.organizacion_id && activeOrg === "00000000-0000-0000-0000-000000000000"));
  }

  // --- COMPETICIONES DYNAMICS ---
  public static getCompeticiones(): any[] {
    if (!this.isBrowser()) return [];
    
    // Obtener competiciones creadas por el usuario
    const userComps = this.get<any[]>("competiciones_dynamics", []);
    
    // Extraer competiciones de los partidos y clasificaciones reales que vienen de Supabase
    const dbPartidos = this.getPartidos();
    const dbClasificaciones = this.getClasificaciones();
    
    const compsMap = new Map<string, any>();
    
    // Primero agregar las creadas por el usuario
    for (const c of userComps) {
      compsMap.set(c.nombre.toLowerCase().trim(), c);
    }
    
    // Extraer de partidos de Supabase
    for (const p of dbPartidos) {
      if (p.competicion) {
        const key = p.competicion.toLowerCase().trim();
        if (!compsMap.has(key)) {
          compsMap.set(key, {
            id: p.competicionId || `comp_${Math.random().toString(36).substr(2, 9)}`,
            nombre: p.competicion,
            tipo: "Liga",
            disciplina: p.disciplina || "Fútbol",
            categoria: p.categoria || "General",
            equipos: 8,
            jornadaActual: p.jornada || 1,
            jornadas: 18,
            estado: "en_curso",
            temporadaId: "temp2026",
            sedes: [p.sede || "Sede Central"]
          });
        }
      }
    }
    
    // Extraer de clasificaciones de Supabase
    for (const cl of dbClasificaciones) {
      if (cl.competicion) {
        const key = cl.competicion.toLowerCase().trim();
        if (!compsMap.has(key)) {
          compsMap.set(key, {
            id: cl.competicionId || `comp_${Math.random().toString(36).substr(2, 9)}`,
            nombre: cl.competicion,
            tipo: "Liga",
            disciplina: "Fútbol",
            categoria: "General",
            equipos: 8,
            jornadaActual: 1,
            jornadas: 18,
            estado: "en_curso",
            temporadaId: "temp2026",
            sedes: ["Sede Central"]
          });
        }
      }
    }
    
    if (compsMap.size === 0) {
      // Intentar crear a partir de los partidos existentes
      for (const p of dbPartidos) {
        const cat = p.equipo || "U13";
        const compName = `Liga ${cat}`;
        const key = compName.toLowerCase().trim();
        compsMap.set(key, {
          id: `comp_${cat.toLowerCase().trim()}`,
          nombre: compName,
          tipo: "Liga",
          disciplina: p.disciplina || "Fútbol",
          categoria: cat,
          equipos: 10,
          jornadaActual: p.jornada || 1,
          jornadas: 18,
          estado: "en_curso",
          temporadaId: "temp2026",
          sedes: [p.sede || "Sede Central"]
        });
      }

      // Si aún está vacío, sembrar uno básico por defecto
      if (compsMap.size === 0) {
        compsMap.set("liga u13", {
          id: "comp_u13",
          nombre: "Liga U13",
          tipo: "Liga",
          disciplina: "Fútbol",
          categoria: "U13",
          equipos: 10,
          jornadaActual: 8,
          jornadas: 18,
          estado: "en_curso",
          temporadaId: "temp2026",
          sedes: ["Sede Central"]
        });
      }
    }
    
    return Array.from(compsMap.values());
  }

  public static addCompeticion(comp: any): any {
    const list = this.getCompeticiones();
    const newComp = {
      ...comp,
      id: `comp_${Date.now()}`,
      organizacion_id: this.getActiveOrganizacionId()
    };
    list.push(newComp);
    this.set("competiciones_dynamics", list);
    return newComp;
  }

  public static addTemporada(temp: any): any {
    const list = this.getTemporadas();
    const newTemp = {
      ...temp,
      id: `temp_${Date.now()}`,
      organizacion_id: this.getActiveOrganizacionId()
    };
    list.push(newTemp);
    this.set("temporadas", list);
    return newTemp;
  }

  public static updateTemporada(id: string, temp: Partial<any>): void {
    const list = this.getTemporadas();
    const idx = list.findIndex(x => x.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...temp };
      this.set("temporadas", list);
    }
  }

  public static deleteTemporada(id: string): void {
    const list = this.getTemporadas();
    const filtered = list.filter(x => x.id !== id);
    this.set("temporadas", filtered);
    if (this.isBrowser()) {
      supabase.from("temporadas").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("[Supabase Error] delete temporada failed:", error.message);
      });
    }
  }

  // --- DISCIPLINAS ---
  public static getDisciplinas(): any[] {
    if (!this.isBrowser()) return [];
    return this.get<any[]>("disciplinas_dynamics", []);
  }

  // --- EGRESOS Y COMPRAS ---
  public static getEgresos(): StoreEgreso[] {
    if (!this.isBrowser()) return INITIAL_EGRESOS;
    const stored = this.get<StoreEgreso[]>("egresos", []);
    if (!stored || stored.length === 0) {
      this.set("egresos", INITIAL_EGRESOS);
      return INITIAL_EGRESOS;
    }
    return stored;
  }

  public static addEgreso(egreso: Omit<StoreEgreso, "id" | "creadoEn">): StoreEgreso {
    const list = this.getEgresos();
    const newEgreso: StoreEgreso = {
      ...egreso,
      id: generateUniqueId("egr"),
      creadoEn: new Date().toISOString(),
    };
    const updated = [newEgreso, ...list];
    this.set("egresos", updated);
    return newEgreso;
  }

  public static deleteEgreso(id: string): void {
    const list = this.getEgresos();
    const filtered = list.filter((x) => x.id !== id);
    this.set("egresos", filtered);
  }

  // --- SOPORTE & TICKETS ---
  public static getSupportTickets(): StoreSupportTicket[] {
    if (!this.isBrowser()) return INITIAL_SUPPORT_TICKETS;
    const stored = this.get<StoreSupportTicket[]>("support_tickets_dynamics_v3", []);
    if (!stored || stored.length === 0 || stored.some(t => t.id === "tick-101" || t.respuestas.length < 2)) {
      this.set("support_tickets_dynamics_v3", INITIAL_SUPPORT_TICKETS);
      if (this.isBrowser()) {
        supabase.from("support_tickets").select("*").then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mapped = data.map((t: any) => ({
              id: t.id,
              organizacion_id: t.organizacion_id,
              organizacion_nombre: t.organizacion_nombre || "Academia",
              titulo: t.titulo,
              descripcion: t.descripcion,
              tipo: t.tipo || "sugerencia",
              prioridad: t.prioridad || "media",
              estado: t.estado || "abierto",
              creadorNombre: t.creador_nombre || "Usuario",
              creadorEmail: t.creador_email || "usuario@mail.com",
              creadoEn: t.created_at || t.creado_en || new Date().toISOString(),
              actualizadoEn: t.updated_at,
              respuestas: t.respuestas || []
            }));
            this.set("support_tickets_dynamics_v3", mapped);
          } else if (data?.length === 0) {
            const seedToSave = INITIAL_SUPPORT_TICKETS.map(t => ({
              id: t.id,
              organizacion_id: t.organizacion_id,
              organizacion_nombre: t.organizacion_nombre,
              titulo: t.titulo,
              descripcion: t.descripcion,
              tipo: t.tipo,
              prioridad: t.prioridad,
              estado: t.estado,
              creador_nombre: t.creadorNombre,
              creador_email: t.creadorEmail,
              created_at: t.creadoEn,
              respuestas: t.respuestas
            }));
            supabase.from("support_tickets").upsert(seedToSave).then(() => {});
          }
        });
      }
      return INITIAL_SUPPORT_TICKETS;
    }
    return stored;
  }

  public static getSupportTicketsForCurrentOrg(): StoreSupportTicket[] {
    const all = this.getSupportTickets();
    const activeOrg = this.getActiveOrganizacionId();
    return all.filter(t => t.organizacion_id === activeOrg || (!t.organizacion_id && activeOrg === "00000000-0000-0000-0000-000000000000"));
  }

  public static addSupportTicket(ticket: Omit<StoreSupportTicket, "id" | "creadoEn" | "respuestas" | "organizacion_id">): StoreSupportTicket {
    const list = this.getSupportTickets();
    const activeOrgId = this.getActiveOrganizacionId();
    const orgs = this.getOrganizaciones();
    const currentOrg = orgs.find(o => o.id === activeOrgId);
    
    const newTicket: StoreSupportTicket = {
      ...ticket,
      id: generateUniqueId("tick"),
      organizacion_id: activeOrgId,
      organizacion_nombre: currentOrg ? currentOrg.nombre : "Academia Athletix",
      creadoEn: new Date().toISOString(),
      respuestas: []
    };

    const updated = [newTicket, ...list];
    this.set("support_tickets_dynamics_v3", updated);

    if (this.isBrowser()) {
      supabase.from("support_tickets").upsert({
        id: newTicket.id,
        organizacion_id: newTicket.organizacion_id,
        organizacion_nombre: newTicket.organizacion_nombre,
        titulo: newTicket.titulo,
        descripcion: newTicket.descripcion,
        tipo: newTicket.tipo,
        prioridad: newTicket.prioridad,
        estado: newTicket.estado,
        creador_nombre: newTicket.creadorNombre,
        creador_email: newTicket.creadorEmail,
        created_at: newTicket.creadoEn,
        respuestas: newTicket.respuestas
      }).then(({ error }) => {
        if (error) console.error("[Supabase Error] add ticket failed:", error.message);
      });
    }

    return newTicket;
  }

  public static updateSupportTicketStatus(id: string, estado: StoreSupportTicket["estado"]): void {
    const list = this.getSupportTickets();
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], estado, actualizadoEn: new Date().toISOString() };
      this.set("support_tickets_dynamics_v3", list);

      if (this.isBrowser()) {
        supabase.from("support_tickets").update({ 
          estado, 
          updated_at: new Date().toISOString() 
        }).eq("id", id).then(({ error }) => {
          if (error) console.error("[Supabase Error] update ticket status failed:", error.message);
        });
      }
    }
  }

  public static addTicketResponse(id: string, respuesta: Omit<StoreTicketResponse, "id" | "fecha">): StoreTicketResponse | null {
    const list = this.getSupportTickets();
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      const newResp: StoreTicketResponse = {
        ...respuesta,
        id: generateUniqueId("resp"),
        fecha: new Date().toISOString()
      };
      const ticket = list[idx];
      const updatedRespuestas = [...(ticket.respuestas || []), newResp];
      list[idx] = { 
        ...ticket, 
        respuestas: updatedRespuestas,
        actualizadoEn: new Date().toISOString() 
      };
      this.set("support_tickets_dynamics_v3", list);

      if (this.isBrowser()) {
        supabase.from("support_tickets").update({ 
          respuestas: updatedRespuestas, 
          updated_at: new Date().toISOString() 
        }).eq("id", id).then(({ error }) => {
          if (error) console.error("[Supabase Error] add ticket response failed:", error.message);
        });
      }
      return newResp;
    }
    return null;
  }

  // --- RETENCIÓN & COHORTES DE ATLETAS ---
  public static getRetentionCohorts(): any[] {
    if (!this.isBrowser()) return INITIAL_RETENTION_COHORTS;
    const stored = this.get<any[]>("retencion_cohortes_dynamics", []);
    if (!stored || stored.length === 0) {
      this.set("retencion_cohortes_dynamics", INITIAL_RETENTION_COHORTS);
      if (this.isBrowser()) {
        const activeOrg = this.getActiveOrganizacionId();
        supabase.from("retencion_cohortes").select("*").eq("organizacion_id", activeOrg).then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mapped = data.map((c: any) => ({
              cohorte: c.cohorte,
              tam: c.tamano || c.tam || 0,
              m: c.meses_datos || c.m || []
            }));
            this.set("retencion_cohortes_dynamics", mapped);
          } else if (data?.length === 0) {
            const seedToSave = INITIAL_RETENTION_COHORTS.map(c => ({
              id: `coh_${c.cohorte}`,
              organizacion_id: activeOrg,
              cohorte: c.cohorte,
              tamano: c.tam,
              meses_datos: c.m
            }));
            supabase.from("retencion_cohortes").upsert(seedToSave).then(() => {});
          }
        });
      }
      return INITIAL_RETENTION_COHORTS;
    }
    return stored;
  }
}

export const INITIAL_RETENTION_COHORTS = [
  { cohorte: "2025-08", tam: 0, m: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { cohorte: "2025-09", tam: 0, m: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null] },
  { cohorte: "2025-10", tam: 0, m: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null, null] },
  { cohorte: "2025-11", tam: 0, m: [0, 0, 0, 0, 0, 0, 0, 0, 0, null, null, null] },
  { cohorte: "2025-12", tam: 0, m: [0, 0, 0, 0, 0, 0, 0, 0, null, null, null, null] },
  { cohorte: "2026-01", tam: 0, m: [0, 0, 0, 0, 0, 0, 0, null, null, null, null, null] },
  { cohorte: "2026-02", tam: 49, m: [0, 100, 100, 100, 98, 98, null, null, null, null, null, null] },
  { cohorte: "2026-03", tam: 2, m: [50, 100, 100, 100, 50, null, null, null, null, null, null, null] },
  { cohorte: "2026-04", tam: 0, m: [0, 0, 0, 0, null, null, null, null, null, null, null, null] },
  { cohorte: "2026-05", tam: 2, m: [50, 100, 50, null, null, null, null, null, null, null, null, null] },
  { cohorte: "2026-06", tam: 5, m: [0, 60, null, null, null, null, null, null, null, null, null, null] },
  { cohorte: "2026-07", tam: 4, m: [50, null, null, null, null, null, null, null, null, null, null, null] },
];

export interface StoreTicketResponse {
  id: string;
  autorNombre: string;
  autorEmail?: string;
  esAdminSaaS?: boolean;
  mensaje: string;
  fecha: string;
}

export interface StoreSupportTicket {
  id: string;
  organizacion_id: string;
  organizacion_nombre: string;
  titulo: string;
  descripcion: string;
  tipo: "sugerencia" | "necesidad" | "soporte" | "facturacion";
  prioridad: "baja" | "media" | "alta" | "urgente";
  estado: "abierto" | "en_progreso" | "resuelto" | "cerrado";
  creadorNombre: string;
  creadorEmail: string;
  creadoEn: string;
  actualizadoEn?: string;
  respuestas: StoreTicketResponse[];
}

export const INITIAL_SUPPORT_TICKETS: StoreSupportTicket[] = [
  {
    id: "tick-athletix-01",
    organizacion_id: "00000000-0000-0000-0000-000000000000",
    organizacion_nombre: "Academia Asoderive",
    titulo: "Confirmación automática de comprobantes SINPE Móvil y descarga masiva de carnets QR",
    descripcion: "Hola equipo de Athletix OS, quisiéramos solicitar si es posible habilitar la verificación automática de comprobantes SINPE Móvil en el módulo de Cobros y si podemos exportar los carnets QR de los jugadores de la categoría U13 en un solo archivo PDF impreso.",
    tipo: "necesidad",
    prioridad: "alta",
    estado: "resuelto",
    creadorNombre: "Bill Cardozo",
    creadorEmail: "admin@asoderive.com",
    creadoEn: "2026-07-22T14:30:00Z",
    respuestas: [
      {
        id: "resp-ath-01",
        autorNombre: "Soporte Central Athletix OS",
        autorEmail: "soporte@athletixos.com",
        esAdminSaaS: true,
        mensaje: "¡Hola Bill! Para la descarga masiva de QRs de la U13, puedes ir al módulo de Jugadores > Opciones > Exportar Carnets PDF. Respecto a la conciliación automática SINPE Móvil, nuestro equipo de ingeniería está desplegando la actualización esta semana en el área de Finanzas.",
        fecha: "2026-07-22T16:15:00Z"
      },
      {
        id: "resp-ath-02-asoderive",
        autorNombre: "Soporte Central Athletix OS",
        autorEmail: "soporte@athletixos.com",
        esAdminSaaS: true,
        mensaje: "✅ Solicitud Resuelta: Se ha habilitado la validación automática de comprobantes SINPE Móvil en Finanzas > Pagos. ¡Quedamos atentos a cualquier otra duda!",
        fecha: "2026-07-22T18:40:00Z"
      }
    ]
  },
  {
    id: "tick-athletix-02",
    organizacion_id: "panthers-elite-id",
    organizacion_nombre: "Panthers Elite academy",
    titulo: "Ajuste de umbrales RPE en el Monitor de Cargas y Sports Science",
    descripcion: "Nos gustaría ajustar la escala de esfuerzo percibido (RPE Foster 1-10) para que alerte automáticamente al cuerpo técnico si la Carga Aguda excede el 1.5 ACWR durante los microciclos de entrenamiento.",
    tipo: "sugerencia",
    prioridad: "media",
    estado: "resuelto",
    creadorNombre: "Carlos Panthers",
    creadorEmail: "carlos@panthers.com",
    creadoEn: "2026-07-20T11:00:00Z",
    respuestas: [
      {
        id: "resp-ath-02",
        autorNombre: "Ingeniería Deportiva Athletix OS",
        autorEmail: "soporte@athletixos.com",
        esAdminSaaS: true,
        mensaje: "Quedó habilitada la alerta de Semáforo de Riesgo en el Centro Táctico y Sports Science con cálculo dinámico de ACWR.",
        fecha: "2026-07-21T09:00:00Z"
      }
    ]
  }
];

export interface StoreEgreso {
  id: string;
  nombre: string;
  categoria: string;
  sede: string;
  sedeId?: string;
  moneda: string;
  simboloMoneda: string;
  precioUnitario: number;
  cantidad: number;
  montoTotal: number;
  fecha: string;
  descripcion: string;
  comprobante?: string;
  metodoPago: string;
  proveedor?: string;
  creadoEn: string;
}

export const MONEDAS_LATAM = [
  { code: "CRC", symbol: "₡", name: "Colón Costarricense", flag: "🇨🇷", label: "🇨🇷 CRC (₡) · Colón Costarricense" },
  { code: "USD", symbol: "$", name: "Dólar Estadounidense", flag: "🇺🇸", label: "🇺🇸 USD ($) · Dólar Estadounidense" },
  { code: "EUR", symbol: "€", name: "Euro (Eurozona)", flag: "🇪🇺", label: "🇪🇺 EUR (€) · Euro (Eurozona)" },
  { code: "MXN", symbol: "$", name: "Peso Mexicano", flag: "🇲🇽", label: "🇲🇽 MXN ($) · Peso Mexicano" },
  { code: "COP", symbol: "$", name: "Peso Colombiano", flag: "🇨🇴", label: "🇨🇴 COP ($) · Peso Colombiano" },
  { code: "ARS", symbol: "$", name: "Peso Argentino", flag: "🇦🇷", label: "🇦🇷 ARS ($) · Peso Argentino" },
  { code: "CLP", symbol: "$", name: "Peso Chileno", flag: "🇨🇱", label: "🇨🇱 CLP ($) · Peso Chileno" },
  { code: "PEN", symbol: "S/", name: "Sol Peruano", flag: "🇵🇪", label: "🇵🇪 PEN (S/) · Sol Peruano" },
  { code: "GTQ", symbol: "Q", name: "Quetzal Guatemalteco", flag: "🇬🇹", label: "🇬🇹 GTQ (Q) · Quetzal Guatemalteco" },
  { code: "HNL", symbol: "L", name: "Lempira Hondureño", flag: "🇭🇳", label: "🇭🇳 HNL (L) · Lempira Hondureño" },
  { code: "NIO", symbol: "C$", name: "Córdoba Nicaragüense", flag: "🇳🇮", label: "🇳🇮 NIO (C$) · Córdoba Nicaragüense" },
  { code: "DOP", symbol: "RD$", name: "Peso Dominicano", flag: "🇩🇴", label: "🇩🇴 DOP (RD$) · Peso Dominicano" },
  { code: "PYG", symbol: "₲", name: "Guaraní Paraguayo", flag: "🇵🇾", label: "🇵🇾 PYG (₲) · Guaraní Paraguayo" },
  { code: "UYU", symbol: "$U", name: "Peso Uruguayo", flag: "🇺🇾", label: "🇺🇾 UYU ($U) · Peso Uruguayo" },
  { code: "VES", symbol: "Bs.", name: "Bolívar Venezolano", flag: "🇻🇪", label: "🇻🇪 VES (Bs.) · Bolívar Venezolano" },
  { code: "PAB", symbol: "B/.", name: "Balboa Panameño", flag: "🇵🇦", label: "🇵🇦 PAB (B/.) · Balboa Panameño" },
  { code: "BOB", symbol: "Bs.", name: "Boliviano", flag: "🇧🇴", label: "🇧🇴 BOB (Bs.) · Boliviano" },
  { code: "BZD", symbol: "BZ$", name: "Dólar Beliceño", flag: "🇧🇿", label: "🇧🇿 BZD (BZ$) · Dólar Beliceño" },
];

export const INITIAL_EGRESOS: StoreEgreso[] = [
  {
    id: "egr-101",
    nombre: "Balones de fútbol Nike Flight U13",
    categoria: "Equipamiento Deportivo",
    sede: "Sede Central",
    sedeId: "sede-central",
    moneda: "CRC",
    simboloMoneda: "₡",
    precioUnitario: 18000,
    cantidad: 10,
    montoTotal: 180000,
    fecha: "2026-07-20",
    descripcion: "Lote de 10 balones oficiales entrenamiento para categoría U13",
    comprobante: "factura_deportes_101.pdf",
    metodoPago: "Transferencia SINPE",
    proveedor: "Deportes Extremos S.A.",
    creadoEn: "2026-07-20T10:00:00Z"
  },
  {
    id: "egr-102",
    nombre: "Mantenimiento césped sintético Cancha 1",
    categoria: "Mantenimiento y Servicios",
    sede: "Sede Este",
    sedeId: "sede-este",
    moneda: "USD",
    simboloMoneda: "$",
    precioUnitario: 450,
    cantidad: 1,
    montoTotal: 450,
    fecha: "2026-07-18",
    descripcion: "Revisión de caucho, peinado de fibra y reparación de líneas",
    comprobante: "recibo_mantenimiento_450.pdf",
    metodoPago: "Transferencia Banco",
    proveedor: "Sintéticos CR Ltda.",
    creadoEn: "2026-07-18T14:30:00Z"
  },
  {
    id: "egr-103",
    nombre: "Pago de Arbitraje Jornada 8 Torneo Apertura",
    categoria: "Arbitraje y Torneaje",
    sede: "Sede Norte",
    sedeId: "sede-norte",
    moneda: "CRC",
    simboloMoneda: "₡",
    precioUnitario: 35000,
    cantidad: 4,
    montoTotal: 140000,
    fecha: "2026-07-15",
    descripcion: "Honorarios de terna arbitral para 4 partidos de liga",
    comprobante: "comprobante_arbitral_j8.jpg",
    metodoPago: "Efectivo",
    proveedor: "Asociación de Árbitros de CR",
    creadoEn: "2026-07-15T18:00:00Z"
  },
  {
    id: "egr-104",
    nombre: "Petos de entrenamiento fluorescentes (Set de 30)",
    categoria: "Equipamiento Deportivo",
    sede: "Sede Central",
    sedeId: "sede-central",
    moneda: "EUR",
    simboloMoneda: "€",
    precioUnitario: 12,
    cantidad: 30,
    montoTotal: 360,
    fecha: "2026-07-12",
    descripcion: "Importación de petos transpirables bicolor verde/naranja",
    comprobante: "invoice_petos_eu.pdf",
    metodoPago: "Tarjeta de Crédito",
    proveedor: "SportEquip Europe",
    creadoEn: "2026-07-12T09:15:00Z"
  },
  {
    id: "egr-105",
    nombre: "Transporte en bus para partido vs Liga Alajuelense",
    categoria: "Transporte y Viajes",
    sede: "Sede Sur",
    sedeId: "sede-sur",
    moneda: "CRC",
    simboloMoneda: "₡",
    precioUnitario: 125000,
    cantidad: 1,
    montoTotal: 125000,
    fecha: "2026-07-10",
    descripcion: "Traslado ida y vuelta de delegación U15 a Alajuela",
    comprobante: "factura_bus_transporte.pdf",
    metodoPago: "Transferencia SINPE",
    proveedor: "Transportes del Este",
    creadoEn: "2026-07-10T11:40:00Z"
  }
];

export default RendimientoStore;
