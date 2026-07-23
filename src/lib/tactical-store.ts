// ─── TACTICAL STORE — DEPORTIVOS ─────────────────────────────────────────────
// Centro de datos del Smart Tactical Board. Gestiona formaciones, alineaciones,
// jugadas, estrategias, rivales y sesiones de pizarra. Persistido en localStorage.

import RendimientoStore from "./rendimiento-store";
import { jugadores } from "./mock-data";
import { supabase } from "./supabase";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SportType =
  | "football" | "futsal" | "basketball" | "volleyball" | "rugby"
  | "hockey" | "baseball" | "softball" | "tennis" | "athletics"
  | "swimming" | "martial-arts" | "cycling";

export type PlayCategory =
  | "ataque" | "defensa" | "balon-parado" | "contraataque"
  | "transicion" | "presion" | "posesion" | "recuperacion";

export type PlayerAvailability = "disponible" | "precaucion" | "no-recomendado";

export type DrawingTool =
  | "select" | "arrow-pass" | "arrow-move" | "arrow-shoot"
  | "zone" | "cone" | "eraser" | "text";

export interface PlayerSlot {
  slotId: string;        // "GK", "CB1", "CB2", "RB", "LB", "RM", "CM", "LM", "RW", "CF", "LW"
  label: string;         // "Portero", "Central", etc.
  x: number;             // % width (0–100)
  y: number;             // % height (0–100)
  jugadorId: string | null;
  esTitular: boolean;
  esCapitan?: boolean;
}

export interface Formation {
  id: string;
  nombre: string;        // "4-3-3"
  disciplina: string;
  slots: PlayerSlot[];
  predefinida: boolean;
  creadaPor?: string;
  fecha: string;
}

export interface Lineup {
  id: string;
  matchId?: string;
  formationId: string;
  equipo: string;
  titulares: PlayerSlot[];
  suplentes: string[];   // jugadorIds
  reservas: string[];
  lesionados: string[];
  noConvocados: string[];
  capitanId: string;
  notas: string;
  createdAt: string;
}

export interface Arrow {
  id: string;
  fromX: number; fromY: number;
  toX: number; toY: number;
  tipo: "pase" | "movimiento" | "disparo" | "presion";
  color: string;
  curved?: boolean;
  curvedOffset?: number;
}

export interface Zone {
  id: string;
  x: number; y: number;
  width: number; height: number;
  color: string;
  opacity: number;
  label: string;
}

export interface Cone {
  id: string;
  x: number; y: number;
  color: "orange" | "yellow" | "blue" | "red";
}

export interface BoardPlayer {
  slotId: string;
  jugadorId: string;
  x: number; y: number;
  numero?: number;
  nombre: string;
  avatar?: string;
}

export interface AnimationFrame {
  frameIndex: number;
  players: { slotId: string; x: number; y: number }[];
  ball: { x: number; y: number };
  arrows: Arrow[];
}

export interface TacticalPlay {
  id: string;
  nombre: string;
  descripcion: string;
  objetivo: string;
  categoria: PlayCategory;
  disciplina: string;
  nivel: "basico" | "intermedio" | "avanzado";
  etiquetas: string[];
  autor: string;
  fecha: string;
  frames: AnimationFrame[];
  imageUrl?: string;
}

export interface BoardSession {
  id: string;
  nombre: string;
  sport: SportType;
  formationId: string;
  players: BoardPlayer[];
  arrows: Arrow[];
  zones: Zone[];
  cones: Cone[];
  ball: { x: number; y: number };
  ballVisible: boolean;
  tool: DrawingTool;
  lastSaved: string;
  createdAt: string;
  /** Set to true when the user explicitly clears the board.
   *  Prevents the slot-population effect from re-adding players. */
  clearedByUser?: boolean;
}

export interface Opponent {
  id: string;
  nombre: string;
  escudo: string;         // emoji or URL
  entrenador: string;
  sistemaBase: string;    // "4-3-3"
  fortalezas: string[];
  debilidades: string[];
  resultadosRecientes: {
    fecha: string;
    resultado: string;    // "2-1", "0-0"
    rival: string;
    tipo: "victoria" | "derrota" | "empate";
  }[];
  jugadoresDestacados: string[];
  observaciones: string;
  peligrosidad: "bajo" | "medio" | "alto" | "muy-alto";
}

export interface Strategy {
  id: string;
  opponentId: string;
  matchId?: string;
  objetivos: string[];
  planTactico: string;
  fortalezasPropias: string[];
  debilidadesPropias: string[];
  indicaciones: string;
  notasRival: string;
  formacionSugerida: string;
  createdAt: string;
}

export interface CoachNote {
  id: string;
  texto: string;
  fecha: string;
  categoria: "tecnica" | "tactica" | "fisica" | "mental";
  jugadorId?: string;
  equipo?: string;
}

// ─── PART 2/3 SIMULATION TYPES ───────────────────────────────────────────────

export interface SimulationResult {
  formacion: string;
  estadoGeneral: number;         // 0-100%
  riesgoLesion: "bajo" | "medio" | "alto" | "critico";
  ventajas: string[];
  desventajas: string[];
  detallesCambios: string[];
  nivelConfianza: "Alta" | "Media" | "Baja";
  disponiblesCount: number;
  precaucionCount: number;
  riesgoCount: number;
}

export interface TeamComparison {
  posicionamiento: { nosotros: number; rival: number };
  velocidad: { nosotros: number; rival: number };
  alturaPromedio: { nosotros: number; rival: number };
  edadPromedio: { nosotros: number; rival: number };
  sportsScore: { nosotros: number; rival: number };
  wellness: { nosotros: number; rival: number };
  goles: { nosotros: number; rival: number };
  asistencias: { nosotros: number; rival: number };
}

// ─── PART 3/3 — PLANIFICACIÓN, VIDEO, BIBLIOTECA, POSTPARTIDO ────────────────

export type MicroCycleType = "competitivo" | "regenerativo" | "carga" | "precompetitivo" | "transicion";
export type ActivityType = "entreno" | "partido" | "recuperacion" | "descanso" | "video" | "reunion" | "evaluacion";
export type LibraryCategory = "ejercicio" | "jugada" | "sesion" | "video" | "pdf" | "presentacion" | "diagrama" | "plantilla";
export type TemplateType = "entrenamiento" | "formacion" | "jugada" | "partido" | "planificacion" | "convocatoria" | "analisis";
export type VideoMarkerCategory = "gol" | "error" | "recuperacion" | "presion" | "contraataque" | "falta" | "tarjeta" | "lesion";
export type StaffRole = "director" | "entrenador" | "asistente" | "preparador" | "medico" | "fisio" | "nutricionista" | "psicologo";
export type LibraryPermission = "lectura" | "edicion" | "duplicar";

export interface DayActivity {
  id: string;
  dia: number;       // 0=Lun … 6=Dom
  tipo: ActivityType;
  hora: string;
  duracion: number;  // minutos
  titulo: string;
  notas?: string;
  equipo?: string;
}

export interface WeeklyPlan {
  id: string;
  semana: string;    // "2026-W28"
  equipo: string;
  categoria: string;
  actividades: DayActivity[];
  objetivo: string;
  cargaEsperada: number;
  responsable: string;
}

export interface MicroCycle {
  id: string;
  tipo: MicroCycleType;
  nombre: string;
  objetivo: string;
  intensidad: "muy-baja" | "baja" | "media" | "alta" | "muy-alta";
  duracionDias: number;
  cargaEsperada: number;
  observaciones: string;
  responsable: string;
  fecha: string;
}

export interface MesoBlock {
  titulo: string;
  tipo: "competencia" | "descarga" | "recuperacion" | "base" | "pico";
  meses: string[];
  objetivos: string[];
}

export interface MesoCycle {
  id: string;
  nombre: string;
  bloques: MesoBlock[];
  objetivos: string[];
}

export interface AnnualPhase {
  nombre: string;
  tipo: "pretemporada" | "temporada" | "competencia" | "torneo" | "vacaciones" | "campamento" | "evaluacion" | "test";
  inicio: string;   // "YYYY-MM-DD"
  fin: string;
  color: string;
  notas?: string;
}

export interface AnnualPlan {
  id: string;
  temporada: string;
  fases: AnnualPhase[];
}

export interface VideoMarker {
  id: string;
  tiempo: number;   // seconds
  descripcion: string;
  jugadorId?: string;
  categoria: VideoMarkerCategory;
  notas?: string;
}

export interface VideoClip {
  id: string;
  titulo: string;
  inicio: number;
  fin: number;
  comentarios: string[];
  compartido: boolean;
}

export interface VideoAnalysis {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  equipo: string;
  categoria: string;
  etiquetas: string[];
  autor: string;
  duracion: number;   // seconds
  url: string;
  tipo: "partido" | "entrenamiento" | "rival";
  marcas: VideoMarker[];
  clips: VideoClip[];
}

export interface TacticalLibraryItem {
  id: string;
  categoria: LibraryCategory;
  titulo: string;
  descripcion: string;
  disciplina: string;
  categoriaEdad: string;
  nivel: "basico" | "intermedio" | "avanzado";
  objetivo: string;
  autor: string;
  fecha: string;
  etiquetas: string[];
  compartido: boolean;
  permisos: LibraryPermission;
}

export interface TacticalTemplate {
  id: string;
  tipo: TemplateType;
  nombre: string;
  descripcion: string;
  autor: string;
  fecha: string;
  datos: Record<string, unknown>;
}

export interface TechnicalStaffMember {
  rol: StaffRole;
  nombre: string;
  email: string;
  avatar?: string;
}

export interface TechnicalStaffNote {
  id: string;
  rol: StaffRole;
  autor: string;
  fecha: string;
  texto: string;
  privada: boolean;
  jugadorId?: string;
  categoria: "tecnica" | "tactica" | "fisica" | "mental" | "medica" | "nutricional";
}

export interface MeetingTask {
  id: string;
  descripcion: string;
  responsable: string;
  vence: string;
  completada: boolean;
}

export interface TechnicalMeeting {
  id: string;
  fecha: string;
  hora: string;
  participantes: string[];
  agenda: string[];
  conclusiones: string[];
  tareas: MeetingTask[];
  compromisos: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  completado: boolean;
  categoria: "convocatoria" | "medico" | "logistica" | "documentacion";
}

export interface PregameChecklist {
  id: string;
  matchId: string;
  items: ChecklistItem[];
  completadoPor: string;
  fecha: string;
}

export interface ParticipacionJugador {
  jugadorId: string;
  minutos: number;
  posicion: string;
  evaluacion: number;   // 1-10
  esTitular: boolean;
  cambioMinuto?: number;
}

export interface PostMatchReport {
  id: string;
  matchId: string;
  resultado: { propio: number; rival: number };
  formacion: string;
  participacion: ParticipacionJugador[];
  observaciones: string;
  conclusiones: string;
  accionesPendientes: string[];
  recomendacionesIA: string[];
  creadoEn: string;
}

export interface ComparisonMetric {
  metrica: string;
  labelA: string;
  valorA: number;
  labelB: string;
  valorB: number;
  unidad?: string;
}

export interface MatchComparison {
  partidoAId: string;
  partidoBId: string;
  comparacion: ComparisonMetric[];
}

export interface TacticalEvolutionEntry {
  fecha: string;
  formacion: string;
  resultado: { propio: number; rival: number } | null;
  sportsScorePromedio: number;
  rival: string;
}


// ─── FORMATION TEMPLATES ──────────────────────────────────────────────────────

const FOOTBALL_FORMATIONS: Formation[] = [
  {
    id: "f-433", nombre: "4-3-3", disciplina: "Fútbol", predefinida: true, fecha: "2026-01-01",
    slots: [
      { slotId: "GK", label: "Portero", x: 8, y: 32.5, jugadorId: null, esTitular: true },
      { slotId: "LB", label: "Lateral Izq.", x: 22, y: 10, jugadorId: null, esTitular: true },
      { slotId: "CB2", label: "Central Izq.", x: 20, y: 25, jugadorId: null, esTitular: true },
      { slotId: "CB1", label: "Central Der.", x: 20, y: 40, jugadorId: null, esTitular: true },
      { slotId: "RB", label: "Lateral Der.", x: 22, y: 55, jugadorId: null, esTitular: true },
      { slotId: "LM", label: "Medio Izq.", x: 45, y: 16, jugadorId: null, esTitular: true },
      { slotId: "CM", label: "Medio Centro", x: 40, y: 32.5, jugadorId: null, esTitular: true },
      { slotId: "RM", label: "Medio Der.", x: 45, y: 49, jugadorId: null, esTitular: true },
      { slotId: "LW", label: "Extremo Izq.", x: 72, y: 13, jugadorId: null, esTitular: true },
      { slotId: "CF", label: "Delantero Centro", x: 80, y: 32.5, jugadorId: null, esTitular: true },
      { slotId: "RW", label: "Extremo Der.", x: 72, y: 52, jugadorId: null, esTitular: true },
    ]
  },
  {
    id: "f-442", nombre: "4-4-2", disciplina: "Fútbol", predefinida: true, fecha: "2026-01-01",
    slots: [
      { slotId: "GK", label: "Portero", x: 8, y: 32.5, jugadorId: null, esTitular: true },
      { slotId: "LB", label: "Lateral Izq.", x: 22, y: 10, jugadorId: null, esTitular: true },
      { slotId: "CB2", label: "Central Izq.", x: 20, y: 25, jugadorId: null, esTitular: true },
      { slotId: "CB1", label: "Central Der.", x: 20, y: 40, jugadorId: null, esTitular: true },
      { slotId: "RB", label: "Lateral Der.", x: 22, y: 55, jugadorId: null, esTitular: true },
      { slotId: "LM", label: "Medio Izq.", x: 48, y: 10, jugadorId: null, esTitular: true },
      { slotId: "LCM", label: "Medio Centro Izq.", x: 45, y: 25, jugadorId: null, esTitular: true },
      { slotId: "RCM", label: "Medio Centro Der.", x: 45, y: 40, jugadorId: null, esTitular: true },
      { slotId: "RM", label: "Medio Der.", x: 48, y: 55, jugadorId: null, esTitular: true },
      { slotId: "LS", label: "Delantero Izq.", x: 78, y: 23, jugadorId: null, esTitular: true },
      { slotId: "RS", label: "Delantero Der.", x: 78, y: 42, jugadorId: null, esTitular: true },
    ]
  },
  {
    id: "f-352", nombre: "3-5-2", disciplina: "Fútbol", predefinida: true, fecha: "2026-01-01",
    slots: [
      { slotId: "GK", label: "Portero", x: 8, y: 32.5, jugadorId: null, esTitular: true },
      { slotId: "CB3", label: "Central Izq.", x: 20, y: 16, jugadorId: null, esTitular: true },
      { slotId: "CB2", label: "Central Centro", x: 20, y: 32.5, jugadorId: null, esTitular: true },
      { slotId: "CB1", label: "Central Der.", x: 20, y: 49, jugadorId: null, esTitular: true },
      { slotId: "LWB", label: "Carrilero Izq.", x: 38, y: 8, jugadorId: null, esTitular: true },
      { slotId: "LCM", label: "Medio Izq.", x: 45, y: 21, jugadorId: null, esTitular: true },
      { slotId: "CM", label: "Medio Centro", x: 42, y: 32.5, jugadorId: null, esTitular: true },
      { slotId: "RCM", label: "Medio Der.", x: 45, y: 44, jugadorId: null, esTitular: true },
      { slotId: "RWB", label: "Carrilero Der.", x: 38, y: 57, jugadorId: null, esTitular: true },
      { slotId: "LS", label: "Delantero Izq.", x: 78, y: 23, jugadorId: null, esTitular: true },
      { slotId: "RS", label: "Delantero Der.", x: 78, y: 42, jugadorId: null, esTitular: true },
    ]
  },
  {
    id: "f-4231", nombre: "4-2-3-1", disciplina: "Fútbol", predefinida: true, fecha: "2026-01-01",
    slots: [
      { slotId: "GK", label: "Portero", x: 8, y: 32.5, jugadorId: null, esTitular: true },
      { slotId: "LB", label: "Lateral Izq.", x: 22, y: 10, jugadorId: null, esTitular: true },
      { slotId: "CB2", label: "Central Izq.", x: 20, y: 25, jugadorId: null, esTitular: true },
      { slotId: "CB1", label: "Central Der.", x: 20, y: 40, jugadorId: null, esTitular: true },
      { slotId: "RB", label: "Lateral Der.", x: 22, y: 55, jugadorId: null, esTitular: true },
      { slotId: "CDM2", label: "Pivote Izq.", x: 38, y: 23, jugadorId: null, esTitular: true },
      { slotId: "CDM1", label: "Pivote Der.", x: 38, y: 42, jugadorId: null, esTitular: true },
      { slotId: "LW", label: "Mediapunta Izq.", x: 62, y: 13, jugadorId: null, esTitular: true },
      { slotId: "CAM", label: "Mediapunta Centro", x: 60, y: 32.5, jugadorId: null, esTitular: true },
      { slotId: "RW", label: "Mediapunta Der.", x: 62, y: 52, jugadorId: null, esTitular: true },
      { slotId: "CF", label: "Delantero", x: 80, y: 32.5, jugadorId: null, esTitular: true },
    ]
  },
];

const BASKETBALL_FORMATIONS: Formation[] = [
  {
    id: "b-23", nombre: "2-3 Zona", disciplina: "Baloncesto", predefinida: true, fecha: "2026-01-01",
    slots: [
      { slotId: "PG", label: "Base", x: 28, y: 45, jugadorId: null, esTitular: true },
      { slotId: "SG", label: "Escolta", x: 28, y: 20, jugadorId: null, esTitular: true },
      { slotId: "C", label: "Pivot", x: 10, y: 32.5, jugadorId: null, esTitular: true },
      { slotId: "PF", label: "Ala-Pivot Der.", x: 14, y: 13, jugadorId: null, esTitular: true },
      { slotId: "SF", label: "Ala-Pivot Izq.", x: 14, y: 52, jugadorId: null, esTitular: true },
    ]
  },
];

const INITIAL_FORMATIONS: Formation[] = [
  ...FOOTBALL_FORMATIONS,
  ...BASKETBALL_FORMATIONS,
];

const INITIAL_OPPONENTS: Opponent[] = [
  {
    id: "op1",
    nombre: "Club Heredia FC U13",
    escudo: "🦉",
    entrenador: "Mario Quesada",
    sistemaBase: "4-3-3",
    fortalezas: ["Ataque rápido por bandas", "Presión tras pérdida", "Defensores altos"],
    debilidades: ["Vulnerables a pases filtrados", "Repliegue defensivo lento"],
    resultadosRecientes: [
      { fecha: "2026-07-05", resultado: "1-2", rival: "Saprissa U13", tipo: "derrota" },
      { fecha: "2026-06-28", resultado: "3-1", rival: "LD Alajuelense U13", tipo: "victoria" },
    ],
    jugadoresDestacados: ["Gutiérrez #10", "Salazar #9"],
    observaciones: "Equipo U13 muy físico en ataque. Hay que poblar el mediocampo y presionar su salida.",
    peligrosidad: "alto",
  },
];

const INITIAL_PLAYS: TacticalPlay[] = [
  {
    id: "jp-ataque", nombre: "Ataque Posicional: Desdoblamiento de Lateral", disciplina: "Fútbol",
    categoria: "ataque", nivel: "intermedio",
    descripcion: "Circulación de balón en medio campo para atraer al rival y posterior desdoble del lateral por banda izquierda.",
    objetivo: "Crear superioridad numérica en banda y lanzar centro al área de penalti.",
    etiquetas: ["ataque", "desdoble", "bandas"],
    autor: "Director Deportivo", fecha: "2026-07-15",
    frames: [
      {
        frameIndex: 0,
        players: [
          { slotId: "LM", jugadorId: "j3", x: 25, y: 55 },
          { slotId: "CF", jugadorId: "j1", x: 50, y: 35 },
          { slotId: "RW", jugadorId: "j2", x: 75, y: 40 }
        ],
        ball: { x: 25, y: 55 },
        arrows: [
          { id: "arr-p-at1", fromX: 25, fromY: 55, toX: 50, toY: 35, tipo: "pase", color: "#10b981", curved: false }
        ]
      }
    ]
  },
  {
    id: "jp-defensa", nombre: "Defensa: Bloque Bajo Organizado 4-4-2", disciplina: "Fútbol",
    categoria: "defensa", nivel: "basico",
    descripcion: "Basculación del bloque defensivo cerrando pasillos interiores y forzando al rival a jugar por fuera.",
    objetivo: "Negar espacios en zona central y proteger el área de remates directos.",
    etiquetas: ["defensa", "bloque-bajo", "cohesión"],
    autor: "Coordinador de Cantera", fecha: "2026-07-16",
    frames: [
      {
        frameIndex: 0,
        players: [
          { slotId: "LM", jugadorId: "j3", x: 20, y: 60 },
          { slotId: "CF", jugadorId: "j1", x: 45, y: 50 }
        ],
        ball: { x: 40, y: 70 },
        arrows: [
          { id: "arr-m-def1", fromX: 20, fromY: 60, toX: 30, toY: 65, tipo: "movimiento", color: "#f59e0b", curved: false }
        ]
      }
    ]
  },
  {
    id: "jp-balon", nombre: "Balón Parado: Córner al Primer Poste", disciplina: "Fútbol",
    categoria: "balon-parado", nivel: "avanzado",
    descripcion: "Bloqueo dinámico en el área y movimiento de distracción del delantero para cabecear en primer poste.",
    objetivo: "Anticipar la marca y desviar el balón al segundo poste o rematar directo.",
    etiquetas: ["córner", "balon-parado", "estrategia"],
    autor: "Preparador de Porteros", fecha: "2026-07-17",
    frames: [
      {
        frameIndex: 0,
        players: [
          { slotId: "CF", jugadorId: "j1", x: 48, y: 15 },
          { slotId: "RW", jugadorId: "j2", x: 95, y: 95 }
        ],
        ball: { x: 95, y: 95 },
        arrows: [
          { id: "arr-p-bal1", fromX: 95, fromY: 95, toX: 48, toY: 15, tipo: "pase", color: "#10b981", curved: true, curvedOffset: -0.3 }
        ]
      }
    ]
  },
  {
    id: "jp1", nombre: "Contraataque Rápido 1-4", disciplina: "Fútbol",
    categoria: "contraataque", nivel: "intermedio",
    descripcion: "Recuperación en zona defensiva y salida rápida en 3 pases hacia adelante.",
    objetivo: "Aprovechar la defensa rival desorganizada tras pérdida de balón.",
    etiquetas: ["velocidad", "transicion", "3-toques"],
    autor: "Director Deportivo", fecha: "2026-06-10",
    frames: [
      {
        frameIndex: 0,
        players: [
          { slotId: "LM", jugadorId: "j3", x: 25, y: 55 },
          { slotId: "CF", jugadorId: "j1", x: 50, y: 35 },
          { slotId: "RW", jugadorId: "j2", x: 75, y: 40 }
        ],
        ball: { x: 26, y: 56 },
        arrows: [
          { id: "arr-p1", fromX: 25, fromY: 55, toX: 50, toY: 35, tipo: "pase", color: "#10b981", curved: true, curvedOffset: -0.2 }
        ]
      },
      {
        frameIndex: 1,
        players: [
          { slotId: "LM", jugadorId: "j3", x: 35, y: 45 },
          { slotId: "CF", jugadorId: "j1", x: 50, y: 35 },
          { slotId: "RW", jugadorId: "j2", x: 80, y: 30 }
        ],
        ball: { x: 50, y: 35 },
        arrows: [
          { id: "arr-p2", fromX: 50, fromY: 35, toX: 78, toY: 22, tipo: "pase", color: "#10b981", curved: true, curvedOffset: 0.15 },
          { id: "arr-m1", fromX: 80, fromY: 30, toX: 78, toY: 22, tipo: "movimiento", color: "#f59e0b", curved: false }
        ]
      },
      {
        frameIndex: 2,
        players: [
          { slotId: "LM", jugadorId: "j3", x: 50, y: 20 },
          { slotId: "CF", jugadorId: "j1", x: 45, y: 25 },
          { slotId: "RW", jugadorId: "j2", x: 78, y: 22 }
        ],
        ball: { x: 78, y: 22 },
        arrows: [
          { id: "arr-p3", fromX: 78, fromY: 22, toX: 50, toY: 20, tipo: "pase", color: "#10b981", curved: true, curvedOffset: -0.1 },
          { id: "arr-m2", fromX: 35, fromY: 45, toX: 50, toY: 20, tipo: "movimiento", color: "#f59e0b", curved: false }
        ]
      },
      {
        frameIndex: 3,
        players: [
          { slotId: "LM", jugadorId: "j3", x: 50, y: 20 },
          { slotId: "CF", jugadorId: "j1", x: 45, y: 25 },
          { slotId: "RW", jugadorId: "j2", x: 78, y: 22 }
        ],
        ball: { x: 50, y: 20 },
        arrows: [
          { id: "arr-s1", fromX: 50, fromY: 20, toX: 50, toY: 2, tipo: "disparo", color: "#ef4444", curved: false }
        ]
      }
    ]
  },
  {
    id: "jp-transicion", nombre: "Transición Ofensiva: Salida Rápida Tercer Hombre", disciplina: "Fútbol",
    categoria: "transicion", nivel: "intermedio",
    descripcion: "Pase vertical del pivote al delantero que apoya de espaldas, y descarga rápida a extremo que corre al espacio.",
    objetivo: "Superar la línea de presión rival en 2 toques usando el concepto del tercer hombre.",
    etiquetas: ["transición", "tercer-hombre", "dinámica"],
    autor: "Director Deportivo", fecha: "2026-07-18",
    frames: [
      {
        frameIndex: 0,
        players: [
          { slotId: "CF", jugadorId: "j1", x: 50, y: 35 },
          { slotId: "RW", jugadorId: "j2", x: 75, y: 40 }
        ],
        ball: { x: 50, y: 35 },
        arrows: [
          { id: "arr-p-tr1", fromX: 50, fromY: 35, toX: 75, toY: 40, tipo: "pase", color: "#10b981", curved: false }
        ]
      }
    ]
  },
  {
    id: "jp-presion", nombre: "Presión Alta: Orientación al Lateral", disciplina: "Fútbol",
    categoria: "presion", nivel: "avanzado",
    descripcion: "El delantero tapa línea de pase central forzando el envío al lateral, donde salta el extremo y el interior a encajonar.",
    objetivo: "Provocar el error del rival en iniciación y recuperar cerca de su área.",
    etiquetas: ["presión-alta", "pressing", "táctica"],
    autor: "Coordinador de Cantera", fecha: "2026-07-19",
    frames: [
      {
        frameIndex: 0,
        players: [
          { slotId: "CF", jugadorId: "j1", x: 45, y: 30 },
          { slotId: "RW", jugadorId: "j2", x: 65, y: 35 }
        ],
        ball: { x: 50, y: 25 },
        arrows: [
          { id: "arr-pr1", fromX: 65, fromY: 35, toX: 50, toY: 25, tipo: "presion", color: "#ef4444", curved: false }
        ]
      }
    ]
  },
  {
    id: "jp-posesion", nombre: "Posesión: Rueda de Pases en Rombo", disciplina: "Fútbol",
    categoria: "posesion", nivel: "basico",
    descripcion: "Circulación ininterrumpida de balón en rombo central para dar amplitud e iniciar jugada limpia.",
    objetivo: "Asegurar el control de balón, mover la defensa rival y desgastar físicamente al oponente.",
    etiquetas: ["posesión", "control", "rombo"],
    autor: "Director Deportivo", fecha: "2026-07-20",
    frames: [
      {
        frameIndex: 0,
        players: [
          { slotId: "LM", jugadorId: "j3", x: 30, y: 50 },
          { slotId: "CF", jugadorId: "j1", x: 50, y: 30 }
        ],
        ball: { x: 30, y: 50 },
        arrows: [
          { id: "arr-pos1", fromX: 30, fromY: 50, toX: 50, toY: 30, tipo: "pase", color: "#10b981", curved: false }
        ]
      }
    ]
  },
  {
    id: "jp-recuperacion", nombre: "Recuperación: Presión Tras Pérdida 5s", disciplina: "Fútbol",
    categoria: "recuperacion", nivel: "avanzado",
    descripcion: "Inmediata presión acosadora al portador del balón durante los primeros 5 segundos tras perder la posesión.",
    objetivo: "Recuperar el balón de inmediato antes de que el rival estructure su contraataque.",
    etiquetas: ["gegenpressing", "transicion-defensiva", "intensidad"],
    autor: "Coordinador de Cantera", fecha: "2026-07-21",
    frames: [
      {
        frameIndex: 0,
        players: [
          { slotId: "LM", jugadorId: "j3", x: 42, y: 40 },
          { slotId: "CF", jugadorId: "j1", x: 44, y: 38 }
        ],
        ball: { x: 45, y: 39 },
        arrows: [
          { id: "arr-rec1", fromX: 42, fromY: 40, toX: 45, toY: 39, tipo: "presion", color: "#ef4444", curved: false }
        ]
      }
    ]
  }
];

const INITIAL_STRATEGIES: Strategy[] = [
  {
    id: "st1",
    opponentId: "op1",
    objetivos: ["Bloquear juego directo del rival", "Explotar espaldas de defensores laterales", "Mantener control de posesión en medio campo"],
    planTactico: "Salir con formación 4-3-3. Presionar alto la salida del Club Heredia FC U13 y usar transiciones rápidas por las bandas para aprovechar los desdobles de los extremos.",
    fortalezasPropias: ["Velocidad de extremos", "Pase preciso entre líneas", "Buen retroceso defensivo"],
    debilidadesPropias: ["Balón parado defensivo", "Físico en juego aéreo"],
    indicaciones: "Extremos deben hacer la diagonal hacia adentro al atacar y los laterales cubrir los pasillos de banda en transiciones negativas.",
    notasRival: "Su creador de juego juega libre. Hay que asignar marca personal o escalonada para cortar línea de pases.",
    formacionSugerida: "4-3-3",
    createdAt: "2026-07-10T10:00:00Z",
  },
];

const INITIAL_NOTES: CoachNote[] = [
  { id: "n1", texto: "Sub-15 mejoró mucho en presión alta esta semana. Listos para implementar el pressing en próximo partido.", fecha: "2026-07-11", categoria: "tactica", equipo: "Sub-15" },
  { id: "n2", texto: "Santiago necesita trabajar el primer control bajo presión.", fecha: "2026-07-10", categoria: "tecnica", jugadorId: "j4" },
  { id: "n3", texto: "Revisar el esquema de corner defensivo con el asistente.", fecha: "2026-07-09", categoria: "tactica", equipo: "General" },
];

const DEFAULT_BOARD: BoardSession = {
  id: "board-default",
  nombre: "Pizarra Principal",
  sport: "football",
  formationId: "f-433",
  players: [],
  arrows: [],
  zones: [],
  cones: [],
  ball: { x: 50, y: 50 },
  ballVisible: true,
  tool: "select",
  lastSaved: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

// ─── AVAILABILITY HELPER ──────────────────────────────────────────────────────

export function getPlayerAvailability(jugadorId: string): PlayerAvailability {
  const loads = RendimientoStore.getPlayerLoadData();
  const record = loads.find(l => l.jugadorId === jugadorId);
  if (!record) return "disponible";
  if (record.semaforo === "rojo") return "no-recomendado";
  if (record.semaforo === "amarillo") return "precaucion";
  return "disponible";
}

export const availabilityConfig: Record<PlayerAvailability, { icon: string; label: string; color: string; bg: string; border: string }> = {
  "disponible":      { icon: "🟢", label: "Disponible",              color: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/20" },
  "precaucion":      { icon: "🟡", label: "Disponible con precaución", color: "text-amber-400",   bg: "bg-amber-500/10",    border: "border-amber-500/20"   },
  "no-recomendado":  { icon: "🔴", label: "No recomendado",           color: "text-red-400",     bg: "bg-red-500/10",      border: "border-red-500/20"     },
};

export const sportLabels: Record<SportType, string> = {
  football: "⚽ Fútbol", futsal: "⚽ Fútbol Sala", basketball: "🏀 Baloncesto",
  volleyball: "🏐 Voleibol", rugby: "🏉 Rugby", hockey: "🏑 Hockey",
  baseball: "⚾ Baseball", softball: "🥎 Softball", tennis: "🎾 Tenis",
  athletics: "🏃 Atletismo", swimming: "🏊 Natación",
  "martial-arts": "🥊 Artes Marciales", cycling: "🚴 Ciclismo",
};

// ─── PART 3/3 SEED DATA ──────────────────────────────────────────────────────

const INITIAL_WEEKLY_PLANS: WeeklyPlan[] = [
  {
    id: "wp_asoderive_u13", semana: "2026-W28", equipo: "Asoderive U13", categoria: "Sub-13",
    objetivo: "Desarrollo de la técnica, comprensión táctica del juego y desarrollar tomas de decisiones.",
    cargaEsperada: 450, responsable: "Edgar Calderón",
    actividades: [
      { id: "au1", dia: 0, tipo: "entreno", hora: "16:00", duracion: 90, titulo: "Coordinación · Pase y control orientado · Rondo 4vs1, 2vs2", equipo: "Asoderive U13" },
      { id: "au2", dia: 1, tipo: "video",   hora: "15:00", duracion: 45, titulo: "Posición de balón · Desmarques de apoyo · Posesión", equipo: "Asoderive U13" },
      { id: "au3", dia: 2, tipo: "entreno", hora: "16:00", duracion: 90, titulo: "Conducción del balón · 1vs1 y 2vs2 · Remates y definición", equipo: "Asoderive U13" },
      { id: "au4", dia: 3, tipo: "recuperacion", hora: "09:00", duracion: 45, titulo: "Sesión regenerativa y estiramientos", equipo: "Asoderive U13" },
      { id: "au5", dia: 4, tipo: "entreno", hora: "16:00", duracion: 75, titulo: "Combinaciones de pases · Vascular · Líneas y colectivo", equipo: "Asoderive U13" },
      { id: "au6", dia: 5, tipo: "partido", hora: "10:00", duracion: 90, titulo: "Partido de aplicación táctica y torneo de 5", equipo: "Asoderive U13" },
      { id: "au7", dia: 6, tipo: "descanso", hora: "", duracion: 0, titulo: "Día de descanso", equipo: "Asoderive U13" },
    ],
  },
  {
    id: "wp_u13", semana: "2026-W28", equipo: "U13", categoria: "Sub-13",
    objetivo: "Desarrollo de la técnica, comprensión táctica del juego y desarrollar tomas de decisiones.",
    cargaEsperada: 450, responsable: "Edgar Calderón",
    actividades: [
      { id: "au1_u13", dia: 0, tipo: "entreno", hora: "16:00", duracion: 90, titulo: "Coordinación · Pase y control orientado · Rondo 4vs1, 2vs2", equipo: "U13" },
      { id: "au2_u13", dia: 1, tipo: "video",   hora: "15:00", duracion: 45, titulo: "Posición de balón · Desmarques de apoyo · Posesión", equipo: "U13" },
      { id: "au3_u13", dia: 2, tipo: "entreno", hora: "16:00", duracion: 90, titulo: "Conducción del balón · 1vs1 y 2vs2 · Remates y definición", equipo: "U13" },
      { id: "au4_u13", dia: 3, tipo: "recuperacion", hora: "09:00", duracion: 45, titulo: "Sesión regenerativa y estiramientos", equipo: "U13" },
      { id: "au5_u13", dia: 4, tipo: "entreno", hora: "16:00", duracion: 75, titulo: "Combinaciones de pases · Vascular · Líneas y colectivo", equipo: "U13" },
      { id: "au6_u13", dia: 5, tipo: "partido", hora: "10:00", duracion: 90, titulo: "Partido de aplicación táctica y torneo de 5", equipo: "U13" },
      { id: "au7_u13", dia: 6, tipo: "descanso", hora: "", duracion: 0, titulo: "Día de descanso", equipo: "U13" },
    ],
  },
];

const INITIAL_MICROCYCLES: MicroCycle[] = [
  { id: "mc1", tipo: "competitivo",     nombre: "Microciclo Competitivo #1",    objetivo: "Mantener alta intensidad y foco en el resultado", intensidad: "alta",     duracionDias: 7, cargaEsperada: 520, observaciones: "Reducir volumen, mantener intensidad. Últimas 48h de activación.", responsable: "Carlos Méndez", fecha: "2026-07-07" },
  { id: "mc2", tipo: "regenerativo",    nombre: "Microciclo Regenerativo",      objetivo: "Recuperación activa post competencia",                intensidad: "muy-baja", duracionDias: 5, cargaEsperada: 200, observaciones: "Priorizar baños de contraste y trabajo aeróbico liviano.",     responsable: "Diego Soto",    fecha: "2026-07-14" },
  { id: "mc3", tipo: "carga",           nombre: "Microciclo de Carga",          objetivo: "Elevar capacidad física general del plantel",          intensidad: "muy-alta", duracionDias: 7, cargaEsperada: 680, observaciones: "Monitorear ACWR diariamente. Ajustar si supera 1.4.",             responsable: "Diego Soto",    fecha: "2026-07-21" },
  { id: "mc4", tipo: "precompetitivo",  nombre: "Microciclo Precompetitivo",    objetivo: "Afinar detalles tácticos y activar mentalmente",       intensidad: "media",    duracionDias: 6, cargaEsperada: 380, observaciones: "Incluir ensayo de balón parado y tácticas fijas.",             responsable: "Carlos Méndez", fecha: "2026-07-28" },
  { id: "mc5", tipo: "transicion",      nombre: "Microciclo de Transición",      objetivo: "Cambio de etapa y reseteo mental del grupo",             intensidad: "baja",     duracionDias: 7, cargaEsperada: 280, observaciones: "Actividades lúdicas, test físicos iniciales y evaluaciones.",  responsable: "Ricardo Mora",  fecha: "2026-08-04" },
];

const INITIAL_MESOCYCLES: MesoCycle[] = [
  {
    id: "mes1", nombre: "Mesociclo Julio-Septiembre 2026",
    objetivos: ["Clasificar a la fase final del torneo", "Mantener ACWR <1.3 en todo el plantel", "Elevar Sports Score promedio a 90"],
    bloques: [
      { titulo: "Base Competitiva", tipo: "base",        meses: ["Julio"],      objetivos: ["Construir base física sólida"] },
      { titulo: "Carga Máxima",      tipo: "competencia", meses: ["Agosto"],     objetivos: ["4 partidos de liga + Copa"] },
      { titulo: "Descarga",          tipo: "descarga",    meses: ["Septiembre"], objetivos: ["Recuperación antes de playoffs"] },
    ],
  },
];

const INITIAL_ANNUAL_PLAN: AnnualPlan = {
  id: "ap2026", temporada: "2026",
  fases: [
    { nombre: "Pretemporada",    tipo: "pretemporada",  inicio: "2026-01-06", fin: "2026-01-31", color: "#6366f1", notas: "Evaluaciones físicas y tests" },
    { nombre: "Temporada Baja",  tipo: "temporada",     inicio: "2026-02-01", fin: "2026-03-31", color: "#3b82f6" },
    { nombre: "Liga Nacional",   tipo: "competencia",   inicio: "2026-04-01", fin: "2026-07-15", color: "#8b5cf6" },
    { nombre: "Vacaciones",      tipo: "vacaciones",    inicio: "2026-07-16", fin: "2026-07-31", color: "#10b981" },
    { nombre: "Campamento",      tipo: "campamento",    inicio: "2026-08-01", fin: "2026-08-07", color: "#f59e0b" },
    { nombre: "Copa Nacional",   tipo: "torneo",        inicio: "2026-08-08", fin: "2026-10-31", color: "#ef4444" },
    { nombre: "Evaluaciones",    tipo: "evaluacion",    inicio: "2026-11-01", fin: "2026-11-15", color: "#06b6d4" },
    { nombre: "Tests Físicos",    tipo: "test",          inicio: "2026-11-16", fin: "2026-11-30", color: "#84cc16" },
    { nombre: "Fin de Temporada",tipo: "vacaciones",    inicio: "2026-12-01", fin: "2026-12-31", color: "#64748b" },
  ],
};

const INITIAL_VIDEOS: VideoAnalysis[] = [
  {
    id: "vid1", titulo: "Análisis vs Deportivo Saprissa", descripcion: "Partido de liga, fecha 12. Enfoque en la presión alta y transiciones.",
    fecha: "2026-07-05", equipo: "Sub-15", categoria: "Sub-15", tipo: "partido",
    etiquetas: ["presión", "transición", "rival"], autor: "Carlos Méndez", duracion: 5400,
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    marcas: [
      { id: "mk1", tiempo: 180,  descripcion: "Presión alta efectiva en salida del rival", categoria: "presion",     notas: "Recuperación en 8 segundos" },
      { id: "mk2", tiempo: 1250, descripcion: "Error defensivo en el lateral izquierdo",     categoria: "error",       notas: "Cubrir la espalda del lateral" },
      { id: "mk3", tiempo: 2100, descripcion: "Gol de contraataque — excelente transición",  categoria: "contraataque", notas: "3 toques, del portero al 9" },
    ],
    clips: [
      { id: "cl1", titulo: "Secuencia de presión minuto 3", inicio: 160, fin: 200, comentarios: ["Referencia para el entreno del martes"], compartido: true },
    ],
  },
  {
    id: "vid2", titulo: "Sesión táctica — Sistemática defensiva", descripcion: "Grabación del entrenamiento del 8 de julio. Trabajo de línea defensiva.",
    fecha: "2026-07-08", equipo: "Sub-15", categoria: "Sub-15", tipo: "entrenamiento",
    etiquetas: ["defensa", "línea", "posicionamiento"], autor: "Andrés Pérez", duracion: 3600,
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    marcas: [],
    clips: [],
  },
];

const INITIAL_LIBRARY: TacticalLibraryItem[] = [
  { id: "lib_ej1", categoria: "ejercicio",    titulo: "Presión Tras Pérdida - Rondo de Transición 5v2",        descripcion: "Rondo de posesión rápida enfocado en la velocidad de reacción defensiva inmediatamente tras perder el balón. Dos comodines interiores buscan la transición rápida mientras el bloque defensivo corta líneas de pase.",    disciplina: "Fútbol",   categoriaEdad: "Sub-15", nivel: "intermedio", objetivo: "Ataque-Defensa",  autor: "Carlos Méndez",  fecha: "2026-07-19", etiquetas: ["transición","presión","rondo"], compartido: true,  permisos: "lectura" },
  { id: "lib_jg1", categoria: "jugada",       titulo: "Tiro Libre Frontal Ensayado - Desmarque y Bloqueo",      descripcion: "Jugada preparada a balón parado con amague de disparo de falta directa, bloqueo indirecto del pivote en la barrera rival, y desmarque del extremo hacia el sector débil para un remate cruzado de primera intención.",   disciplina: "Fútbol",   categoriaEdad: "General", nivel: "avanzado",    objetivo: "Balón Parado", autor: "Carlos Méndez",  fecha: "2026-07-19", etiquetas: ["balón parado","táctica","tiro libre"],         compartido: true,  permisos: "edicion" },
  { id: "lib_ss1", categoria: "sesion",       titulo: "Salida Limpia en Bloque Bajo contra Presión Alta", descripcion: "Sesión completa estructurada en 3 fases: Calentamiento técnico con control orientado en rombo, ruedas de pase en salida de 3 jugadores, y fútbol interactivo 8v8 para superar la presión del rival en fase de iniciación.",  disciplina: "Fútbol",   categoriaEdad: "Sub-17", nivel: "avanzado", objetivo: "Iniciación", autor: "Carlos Méndez",   fecha: "2026-07-19", etiquetas: ["salida","sesión","presión"],    compartido: false, permisos: "edicion" },
  { id: "lib_vd1", categoria: "video",        titulo: "Video-Análisis: Basculación de la Línea de 4 Defensiva",  descripcion: "Análisis explicativo de 5 minutos en video repasando los errores comunes en las coberturas recíprocas y el espacio libre entre el central y el lateral cuando el rival juega y progresa por bandas.", disciplina: "Fútbol",   categoriaEdad: "General", nivel: "intermedio",     objetivo: "Defensa",  autor: "Andrés Pérez",  fecha: "2026-07-19", etiquetas: ["video","análisis","defensa"],        compartido: true,  permisos: "lectura" },
  { id: "lib_pd1", categoria: "pdf",          titulo: "Manual Metodológico: Principios del Juego de Posición",  descripcion: "Guía metodológica oficial en formato PDF detallando conceptos del tercer hombre, hombres libres entre líneas, ocupación racional del espacio de juego y superioridades numéricas/posicionales.",           disciplina: "Fútbol",   categoriaEdad: "General", nivel: "avanzado",    objetivo: "Metodología",  autor: "Carlos Méndez",  fecha: "2026-07-19", etiquetas: ["manual","pdf","posición"],        compartido: true,  permisos: "lectura" },
  { id: "lib_pr1", categoria: "presentacion", titulo: "Charla Técnica: Transiciones Ofensivas y Contraataque", descripcion: "Diapositivas listas para proyector o tablet. Incluye los 4 principios clave tras recuperación: pase vertical de seguridad, desmarques de apoyo, ruptura del delantero y finalización en 3 toques.",           disciplina: "Fútbol",   categoriaEdad: "General", nivel: "basico",    objetivo: "Charla Técnica",  autor: "Carlos Méndez",  fecha: "2026-07-19", etiquetas: ["presentación","charla","transición"],        compartido: true,  permisos: "duplicar" },
  { id: "lib_dg1", categoria: "diagrama",     titulo: "Distribución de Cancha en Salida de Balón - Formación 1-4-3-3", descripcion: "Esquema visual que muestra el posicionamiento de los laterales en amplitud, los centrales abiertos al borde del área grande, y el mediocentro pivote escalonado ofreciendo una línea de pase segura.",           disciplina: "Fútbol",   categoriaEdad: "General", nivel: "basico",    objetivo: "Esquema",  autor: "Andrés Pérez",  fecha: "2026-07-19", etiquetas: ["diagrama","4-3-3","salida"],        compartido: true,  permisos: "lectura" },
  { id: "lib_pl1", categoria: "plantilla",    titulo: "Ficha de Scouting de Rival - Planilla de Campo", descripcion: "Plantilla para rellenar durante partidos del oponente. Permite calificar bloque táctico, fortaleza física, vulnerabilidad en balón parado y nombres clave a referenciar.",           disciplina: "Fútbol",   categoriaEdad: "General", nivel: "basico",    objetivo: "Scouting",  autor: "Carlos Méndez",  fecha: "2026-07-19", etiquetas: ["plantilla","scouting","informe"],        compartido: true,  permisos: "duplicar" },
];

const INITIAL_TEMPLATES: TacticalTemplate[] = [
  { id: "tpl1", tipo: "convocatoria", nombre: "Convocatoria Estándar", descripcion: "Plantilla base de 18 jugadores con roles y notas", autor: "Sistema", fecha: "2026-01-01", datos: { jugadores: 18, incluirSuplentes: true } },
  { id: "tpl2", tipo: "analisis",     nombre: "Informe de Rival",          descripcion: "Ficha completa de análisis del equipo oponente",  autor: "Sistema", fecha: "2026-01-01", datos: { secciones: ["tactico","fisico","psicologico"] } },
  { id: "tpl3", tipo: "partido",      nombre: "Plan de Partido",           descripcion: "Estructura estándar del plan táctico para el partido", autor: "Carlos Méndez", fecha: "2026-06-01", datos: { formacion: "4-3-3" } },
];

const INITIAL_STAFF_NOTES: TechnicalStaffNote[] = [
  { id: "sn1", rol: "entrenador",    autor: "Carlos Méndez",  fecha: "2026-07-10", texto: "El grupo mostró alta motivación hoy. Implementar pressing desde la propia mitad el próximo partido.",      privada: false, categoria: "tactica" },
  { id: "sn2", rol: "preparador",    autor: "Diego Soto",      fecha: "2026-07-09", texto: "ACWR del grupo en promedio 1.18. Recomiendo reducir carga el miércoles.",                                      privada: false, categoria: "fisica" },
  { id: "sn3", rol: "medico",        autor: "Dr. Luis Mora",   fecha: "2026-07-08", texto: "Jugador J4 con leve sobrecarga en isquiotibiales. Recomiendo no jugar más de 60 minutos el sábado.",          privada: true,  categoria: "medica", jugadorId: "j4" },
  { id: "sn4", rol: "nutricionista", autor: "Laura Brenes",    fecha: "2026-07-07", texto: "Revisar hidratación del grupo en el calor de agosto. Planear estrategia de rehidratación en entrenamientos.", privada: false, categoria: "nutricional" },
];

const INITIAL_MEETINGS: TechnicalMeeting[] = [
  {
    id: "mt1", fecha: "2026-07-14", hora: "09:00",
    participantes: ["Carlos Méndez", "Andrés Pérez", "Diego Soto", "Dr. Luis Mora"],
    agenda: ["Revisión del partido del sábado", "Análisis de cargas de la semana", "Planificación microciclo siguiente", "Estado de lesiones"],
    conclusiones: ["Reforzar presión alta en los próximos 2 entrenamientos", "Reducir carga del miércoles por ACWR elevado"],
    tareas: [
      { id: "t1", descripcion: "Preparar video del segundo tiempo",       responsable: "Andrés Pérez", vence: "2026-07-15", completada: false },
      { id: "t2", descripcion: "Actualizar planificación de la próxima semana", responsable: "Carlos Méndez", vence: "2026-07-15", completada: true  },
    ],
    compromisos: ["Próxima reunión el lunes 21 de julio"],
  },
];

const INITIAL_POST_REPORTS: PostMatchReport[] = [
  {
    id: "pmr1", matchId: "m1",
    resultado: { propio: 2, rival: 1 },
    formacion: "4-3-3",
    participacion: [
      { jugadorId: "j1", minutos: 90, posicion: "Portero",      evaluacion: 8, esTitular: true },
      { jugadorId: "j2", minutos: 90, posicion: "Lateral Der.", evaluacion: 7, esTitular: true },
      { jugadorId: "j3", minutos: 90, posicion: "Central",      evaluacion: 8, esTitular: true },
      { jugadorId: "j4", minutos: 68, posicion: "Central",      evaluacion: 6, esTitular: true, cambioMinuto: 68 },
      { jugadorId: "j5", minutos: 90, posicion: "Lateral Izq.", evaluacion: 7, esTitular: true },
    ],
    observaciones: "Victoria mérita con gran primer tiempo. Segundo tiempo con bajada de intensidad.",
    conclusiones: "Mejorar la gestión energética en el segundo tiempo. La presión alta funcionó en el primer tiempo.",
    accionesPendientes: ["Análisis de video del partido", "Revisión médica de J4", "Planificación del siguiente microciclo"],
    recomendacionesIA: [
      "Reforzar el trabajo de presión alta en los próximos 2 entrenamientos.",
      "Revisar la cobertura defensiva en balón parado con el asistente.",
    ],
    creadoEn: "2026-07-05T22:00:00Z",
  },
];

const INITIAL_EVOLUTION: TacticalEvolutionEntry[] = [
  { fecha: "2026-07-05", formacion: "4-3-3", resultado: { propio: 2, rival: 1 }, sportsScorePromedio: 87, rival: "Deportivo Saprissa" },
  { fecha: "2026-06-28", formacion: "4-4-2", resultado: { propio: 1, rival: 1 }, sportsScorePromedio: 84, rival: "Liga Deportiva Alajuelense" },
  { fecha: "2026-06-21", formacion: "4-3-3", resultado: { propio: 3, rival: 0 }, sportsScorePromedio: 91, rival: "Municipal Grecia" },
  { fecha: "2026-06-14", formacion: "3-5-2", resultado: { propio: 0, rival: 2 }, sportsScorePromedio: 78, rival: "Herediano" },
  { fecha: "2026-06-07", formacion: "4-3-3", resultado: { propio: 2, rival: 2 }, sportsScorePromedio: 85, rival: "Limón FC" },
];

// ─── TACTICAL STORE CLASS ─────────────────────────────────────────────────────

export class TacticalStore {
  private static get<T>(key: string, def: T): T {
    if (typeof window === "undefined") return def;
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : def;
    } catch { return def; }
  }

  private static set<T>(key: string, val: T): void {
    if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(val));
  }

  // --- FORMATIONS ---
  static getFormations(): Formation[] {
    const stored = this.get<Formation[]>("tact_formations", INITIAL_FORMATIONS);
    // Overwrite predefinida formations with fresh coordinates
    const updated = stored.map(f => {
      const isPredefined = f.id.startsWith("f-") || f.id.startsWith("b-") || f.predefinida;
      if (isPredefined) {
        const fresh = INITIAL_FORMATIONS.find(x => x.id === f.id);
        return fresh ? { ...fresh, slots: fresh.slots.map(s => ({ ...s, jugadorId: f.slots.find(oldS => oldS.slotId === s.slotId)?.jugadorId || null })) } : f;
      }
      return f;
    });
    // Add any missing predefined formations
    INITIAL_FORMATIONS.forEach(fresh => {
      if (!updated.some(x => x.id === fresh.id)) {
        updated.push(fresh);
      }
    });
    return updated;
  }

  static saveFormation(f: Formation): void {
    const all = this.getFormations().filter(x => x.id !== f.id);
    all.push(f);
    this.set("tact_formations", all);

    const orgId = RendimientoStore.getActiveOrganizacionId();
    const payload = {
      id: f.id,
      nombre: f.nombre,
      disciplina: f.disciplina,
      slots: f.slots,
      predefinida: f.predefinida || false,
      creada_por: f.creadaPor || "",
      fecha: f.fecha || new Date().toISOString().split("T")[0],
      organizacion_id: orgId,
    };

    supabase
      .from("formaciones_tacticas")
      .upsert(payload)
      .then(({ error }) => {
        if (error) console.error("Error saving formation to Supabase:", error);
      });
  }

  // Temporary in-memory board session
  private static inMemoryBoard: BoardSession = DEFAULT_BOARD;

  static getBoardSession(): BoardSession {
    return this.inMemoryBoard;
  }

  static saveBoardSession(session: BoardSession): void {
    this.inMemoryBoard = { ...session, lastSaved: new Date().toISOString() };

    const orgId = RendimientoStore.getActiveOrganizacionId();
    const payload = {
      id: session.id || "default_board",
      nombre: session.nombre || "Pizarra Activa",
      sport: session.sport,
      formation_id: session.formationId,
      players: session.players,
      arrows: session.arrows,
      zones: session.zones,
      cones: session.cones,
      ball: session.ball,
      ball_visible: session.ballVisible,
      tool: session.tool,
      last_saved: this.inMemoryBoard.lastSaved,
      created_at: session.createdAt || new Date().toISOString(),
      organizacion_id: orgId,
    };

    supabase
      .from("pizarras")
      .upsert(payload)
      .then(({ error }) => {
        if (error) console.error("Error autosaving board session to Supabase:", error);
      });
  }

  // --- SAVE PLAY (JUGADA) ---
  static savePlay(p: TacticalPlay): void {
    const all = this.getPlays().filter(x => x.id !== p.id);
    all.push(p);
    this.set("tact_plays", all);

    const orgId = RendimientoStore.getActiveOrganizacionId();
    const payload = {
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      objetivo: p.objetivo,
      categoria: p.categoria,
      disciplina: p.disciplina,
      nivel: p.nivel,
      etiquetas: p.etiquetas,
      autor: p.autor,
      fecha: p.fecha,
      frames: p.frames,
      image_url: p.imageUrl || null,
      organizacion_id: orgId,
    };

    supabase
      .from("jugadas_tacticas")
      .upsert(payload)
      .then(({ error }) => {
        if (error) console.error("Error saving play to Supabase:", error);
      });
  }

  // --- SYNC FROM SUPABASE ---
  static async syncFromSupabase(): Promise<void> {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    
    // 1. Sync active board session (pizarra)
    try {
      const { data: boardData, error: boardErr } = await supabase
        .from("pizarras")
        .select("*")
        .eq("organizacion_id", orgId);
      if (boardErr) throw boardErr;
      if (boardData && boardData.length > 0) {
        const b = boardData[0];
        this.inMemoryBoard = {
          id: b.id,
          nombre: b.nombre,
          sport: b.sport as SportType,
          formationId: b.formation_id,
          players: b.players || [],
          arrows: b.arrows || [],
          zones: b.zones || [],
          cones: b.cones || [],
          ball: b.ball || { x: 50, y: 32 },
          ballVisible: b.ball_visible !== false,
          tool: b.tool as DrawingTool,
          lastSaved: b.last_saved || new Date().toISOString(),
          createdAt: b.created_at || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error("Error syncing board session from Supabase", e);
    }

    // 2. Sync formations (formaciones_tacticas)
    try {
      const { data: formData, error: formErr } = await supabase
        .from("formaciones_tacticas")
        .select("*")
        .eq("organizacion_id", orgId);
      if (formErr) throw formErr;
      if (formData && formData.length > 0) {
        const local = this.get<Formation[]>("tact_formations", INITIAL_FORMATIONS);
        const merged = [...local];
        formData.forEach((f: any) => {
          const idx = merged.findIndex(x => x.id === f.id);
          const parsedForm: Formation = {
            id: f.id,
            nombre: f.nombre,
            disciplina: f.disciplina,
            slots: f.slots || [],
            predefinida: f.predefinida || false,
            creadaPor: f.creada_por,
            fecha: f.fecha,
          };
          if (idx !== -1) {
            merged[idx] = parsedForm;
          } else {
            merged.push(parsedForm);
          }
        });
        this.set("tact_formations", merged);
      }
    } catch (e) {
      console.error("Error syncing formations from Supabase", e);
    }

    // 3. Sync plays (jugadas_tacticas)
    try {
      const { data: playsData, error: playsErr } = await supabase
        .from("jugadas_tacticas")
        .select("*")
        .eq("organizacion_id", orgId);
      if (playsErr) throw playsErr;
      if (playsData && playsData.length > 0) {
        const local = this.get<TacticalPlay[]>("tact_plays", INITIAL_PLAYS);
        const merged = [...local];
        playsData.forEach((p: any) => {
          const idx = merged.findIndex(x => x.id === p.id);
          const parsedPlay: TacticalPlay = {
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion || "",
            objetivo: p.objetivo || "",
            categoria: p.categoria as PlayCategory,
            disciplina: p.disciplina,
            nivel: p.nivel as "basico" | "intermedio" | "avanzado",
            etiquetas: p.etiquetas || [],
            autor: p.autor || "",
            fecha: p.fecha || "",
            frames: p.frames || [],
            imageUrl: p.image_url,
          };
          if (idx !== -1) {
            merged[idx] = parsedPlay;
          } else {
            merged.push(parsedPlay);
          }
        });
        this.set("tact_plays", merged);
      }
    } catch (e) {
      console.error("Error syncing plays from Supabase", e);
    }
  }

  // --- OPPONENTS ---
  static getOpponents(): Opponent[] {
    return this.get<Opponent[]>("tact_opponents", INITIAL_OPPONENTS);
  }

  static getOpponent(id: string): Opponent | undefined {
    return this.getOpponents().find(o => o.id === id);
  }

  static saveOpponent(opp: Opponent): void {
    const all = this.getOpponents().filter(x => x.id !== opp.id);
    all.push(opp);
    this.set("tact_opponents", all);
  }

  // --- PLAYS ---
  static getPlays(): TacticalPlay[] {
    const list = this.get<TacticalPlay[]>("tact_plays", INITIAL_PLAYS);
    if (list.length < 8) {
      this.set("tact_plays", INITIAL_PLAYS);
      return INITIAL_PLAYS;
    }
    return list;
  }

  // --- STRATEGIES ---
  static getStrategies(): Strategy[] {
    return this.get<Strategy[]>("tact_strategies", INITIAL_STRATEGIES);
  }

  static saveStrategy(s: Strategy): void {
    const all = this.getStrategies().filter(x => x.id !== s.id);
    all.push(s);
    this.set("tact_strategies", all);
  }

  // --- LINEUPS ---
  static getLineups(): Lineup[] {
    return this.get<Lineup[]>("tact_lineups", []);
  }

  static getLastLineup(): Lineup | undefined {
    const all = this.getLineups();
    return all.length > 0 ? all[all.length - 1] : undefined;
  }

  static saveLineup(l: Lineup): void {
    const all = this.getLineups().filter(x => x.id !== l.id);
    all.push(l);
    this.set("tact_lineups", all);
  }

  // --- COACH NOTES ---
  static getCoachNotes(): CoachNote[] {
    return this.get<CoachNote[]>("tact_notes", INITIAL_NOTES);
  }

  // --- SUMMARY ---
  static getSummary() {
    const loads = RendimientoStore.getPlayerLoadData();
    const disponibles = loads.filter(l => l.semaforo === "verde").length;
    const precaucion = loads.filter(l => l.semaforo === "amarillo").length;
    const noRecomendados = loads.filter(l => l.semaforo === "rojo").length;

    return {
      formacionesGuardadas: this.getFormations().filter(f => !f.predefinida).length,
      formacionesPredefinidas: this.getFormations().filter(f => f.predefinida).length,
      jugadasRegistradas: this.getPlays().length,
      estrategiasRegistradas: this.getStrategies().length,
      rivalesRegistrados: this.getOpponents().length,
      jugadoresDisponibles: disponibles || 25,
      jugadoresPrecaucion: precaucion || 4,
      jugadoresNoRecomendados: noRecomendados || 2,
    };
  }

  // ─── PART 2/3: SIMULATION ENGINE ──────────────────────────────────────────

  /**
   * Corre una simulación táctica basada en una formación e hipótesis
   */
  static runMatchSimulation(formationId: string, customHypothesis: { playerMinutes: Record<string, number>; activeForm: string }): SimulationResult {
    const form = this.getFormations().find(f => f.id === formationId) || this.getFormations()[0];
    const loads = RendimientoStore.getPlayerLoadData();
    
    let stateSum = 85; // base general state
    let injuryRisk: SimulationResult["riesgoLesion"] = "bajo";
    const advantages: string[] = [];
    const disadvantages: string[] = [];
    const detailsCambios: string[] = [];

    // Analyze minutes played in simulation
    let highMinuteAlerts = 0;
    Object.entries(customHypothesis.playerMinutes).forEach(([pId, min]) => {
      const pLoad = loads.find(l => l.jugadorId === pId);
      const jug = jugadores.find(j => j.id === pId);
      if (pLoad && min > 70 && (pLoad.semaforo === "rojo" || pLoad.semaforo === "amarillo")) {
        highMinuteAlerts++;
        detailsCambios.push(`⚠️ Proyección crítica: ${jug?.nombre} jugando ${min} mins supera la recomendación médica.`);
      }
    });

    if (highMinuteAlerts > 1) {
      injuryRisk = "critico";
      stateSum -= 20;
      disadvantages.push("Sobrecarga extrema en jugadores clave fatigosos.");
    } else if (highMinuteAlerts === 1) {
      injuryRisk = "alto";
      stateSum -= 10;
      disadvantages.push("Pedro o similar jugando minutos excesivos con ACWR alto.");
    }

    // Formation specific simulation checks
    if (customHypothesis.activeForm === "f-433") {
      advantages.push("Presión alta efectiva en zona 3.");
      advantages.push("Amplitud de ataque garantizada por extremos rápidos.");
      disadvantages.push("Riesgo de contraataque si el lateral se proyecta constantemente.");
    } else if (customHypothesis.activeForm === "f-442") {
      advantages.push("Equilibrio defensivo sólido en bloque medio.");
      advantages.push("Doble delantera que fija a los centrales rivales.");
      disadvantages.push("Menor control de posesión en el círculo central.");
    } else {
      advantages.push("Esquema alternativo equilibrado.");
    }

    // Availability stats
    const disponiblesCount = loads.filter(l => l.semaforo === "verde").length || 20;
    const precaucionCount = loads.filter(l => l.semaforo === "amarillo").length || 3;
    const riesgoCount = loads.filter(l => l.semaforo === "rojo").length || 2;

    return {
      formacion: form.nombre,
      estadoGeneral: Math.max(30, Math.min(100, stateSum)),
      riesgoLesion: injuryRisk,
      ventajas: advantages,
      desventajas: disadvantages,
      detallesCambios: detailsCambios,
      nivelConfianza: "Alta",
      disponiblesCount,
      precaucionCount,
      riesgoCount,
    };
  }

  /**
   * Genera recomendaciones de alineación optimizadas basadas en Sports Science
   */
  static getLineupRecommendation(formationId: string) {
    const form = this.getFormations().find(f => f.id === formationId) || this.getFormations()[0];
    const loads = RendimientoStore.getPlayerLoadData();

    // Map starting spots to physical availability
    const recomendados: string[] = [];
    const precaucion: string[] = [];
    const excluidos: string[] = [];

    jugadores.forEach(j => {
      const load = loads.find(l => l.jugadorId === j.id);
      if (load?.semaforo === "rojo") {
        excluidos.push(`${j.nombre} (Fatiga crítica / ACWR: ${load.acwr})`);
      } else if (load?.semaforo === "amarillo") {
        precaucion.push(`${j.nombre} (Recomendado max 60 min)`);
      } else {
        recomendados.push(j.nombre);
      }
    });

    return {
      titularesSugeridos: recomendados.slice(0, 11),
      suplentesSugeridos: recomendados.slice(11, 18).concat(precaucion.slice(0, 3)),
      explicacion: `Se optimizó el esquema para ${form.nombre} priorizando jugadores con ACWR < 1.3 y Wellness promedio > 85%. Se excluyó a los jugadores en zona roja de fatiga.`,
      confianza: "Alta" as const,
    };
  }

  /**
   * Compara los indicadores estadísticos clave del equipo vs el rival
   */
  static getOpponentComparison(opponentId: string): TeamComparison {
    const opp = this.getOpponent(opponentId);
    
    // Default metrics based on opponent peligro
    const levelMult = opp?.peligrosidad === "muy-alto" ? 1.15 : opp?.peligrosidad === "alto" ? 1.05 : 0.95;

    return {
      posicionamiento: { nosotros: 54, rival: Math.round(50 * levelMult) },
      velocidad: { nosotros: 82, rival: Math.round(78 * levelMult) },
      alturaPromedio: { nosotros: 178, rival: 176 },
      edadPromedio: { nosotros: 24.5, rival: 25.8 },
      sportsScore: { nosotros: 85, rival: Math.round(80 * levelMult) },
      wellness: { nosotros: 89, rival: 86 },
      goles: { nosotros: 2.1, rival: Math.round(1.6 * levelMult * 10) / 10 },
      asistencias: { nosotros: 1.6, rival: Math.round(1.2 * levelMult * 10) / 10 },
    };
  }

  // ─── PART 3/3 METHODS ──────────────────────────────────────────────────────

  // Weekly Plans
  static getWeeklyPlans(): WeeklyPlan[] {
    const list = this.get<WeeklyPlan[]>("tact_weekly_plans", INITIAL_WEEKLY_PLANS);
    const filtered = list.filter(p => !p.responsable || !p.responsable.toLowerCase().includes("carlos araya"));
    // Ensure Asoderive U13 and U13 initial plans are present
    INITIAL_WEEKLY_PLANS.forEach(ip => {
      if (!filtered.some(p => p.equipo.toLowerCase() === ip.equipo.toLowerCase())) {
        filtered.push(ip);
      }
    });
    return filtered;
  }
  static saveWeeklyPlan(p: WeeklyPlan): void {
    const all = this.getWeeklyPlans().filter(x => x.id !== p.id);
    all.push(p);
    this.set("tact_weekly_plans", all);
  }

  // MicroCycles
  static getMicroCycles(): MicroCycle[] {
    return this.get<MicroCycle[]>("tact_microcycles", INITIAL_MICROCYCLES);
  }
  static saveMicroCycle(m: MicroCycle): void {
    const all = this.getMicroCycles().filter(x => x.id !== m.id);
    all.push(m);
    this.set("tact_microcycles", all);
  }

  // MesoCycles
  static getMesoCycles(): MesoCycle[] {
    return this.get<MesoCycle[]>("tact_mesocycles", INITIAL_MESOCYCLES);
  }

  // Annual Plan
  static getAnnualPlan(): AnnualPlan {
    return this.get<AnnualPlan>("tact_annual_plan", INITIAL_ANNUAL_PLAN);
  }

  // Video Analysis
  static getVideoAnalyses(): VideoAnalysis[] {
    return this.get<VideoAnalysis[]>("tact_videos", INITIAL_VIDEOS);
  }
  static saveVideoAnalysis(v: VideoAnalysis): void {
    const all = this.getVideoAnalyses().filter(x => x.id !== v.id);
    all.push(v);
    this.set("tact_videos", all);
  }
  static addVideoMarker(videoId: string, marker: VideoMarker): void {
    const all = this.getVideoAnalyses();
    const idx = all.findIndex(v => v.id === videoId);
    if (idx >= 0) { all[idx].marcas.push(marker); this.set("tact_videos", all); }
  }
  static addVideoClip(videoId: string, clip: VideoClip): void {
    const all = this.getVideoAnalyses();
    const idx = all.findIndex(v => v.id === videoId);
    if (idx >= 0) { all[idx].clips.push(clip); this.set("tact_videos", all); }
  }

  // Tactical Library
  static getTacticalLibrary(): TacticalLibraryItem[] {
    const list = this.get<TacticalLibraryItem[]>("tact_library", INITIAL_LIBRARY);
    if (list.length < 8) {
      this.set("tact_library", INITIAL_LIBRARY);
      return INITIAL_LIBRARY;
    }
    return list;
  }
  static saveTacticalLibraryItem(item: TacticalLibraryItem): void {
    const all = this.getTacticalLibrary().filter(x => x.id !== item.id);
    all.push(item);
    this.set("tact_library", all);
  }

  // Templates
  static getTacticalTemplates(): TacticalTemplate[] {
    return this.get<TacticalTemplate[]>("tact_templates", INITIAL_TEMPLATES);
  }
  static saveTacticalTemplate(t: TacticalTemplate): void {
    const all = this.getTacticalTemplates().filter(x => x.id !== t.id);
    all.push(t);
    this.set("tact_templates", all);
  }

  // Technical Staff Notes
  static getStaffNotes(): TechnicalStaffNote[] {
    return this.get<TechnicalStaffNote[]>("tact_staff_notes", INITIAL_STAFF_NOTES);
  }
  static saveStaffNote(n: TechnicalStaffNote): void {
    const all = this.getStaffNotes().filter(x => x.id !== n.id);
    all.push(n);
    this.set("tact_staff_notes", all);
  }

  // Technical Meetings
  static getTechnicalMeetings(): TechnicalMeeting[] {
    return this.get<TechnicalMeeting[]>("tact_meetings", INITIAL_MEETINGS);
  }
  static saveTechnicalMeeting(m: TechnicalMeeting): void {
    const all = this.getTechnicalMeetings().filter(x => x.id !== m.id);
    all.push(m);
    this.set("tact_meetings", all);
  }

  // Pregame Checklist
  static getPregameChecklist(matchId: string): PregameChecklist {
    const all = this.get<PregameChecklist[]>("tact_checklists", []);
    return all.find(c => c.matchId === matchId) ?? {
      id: `cl-${matchId}`, matchId, completadoPor: "Coach", fecha: new Date().toISOString(),
      items: [
        { id: "cl1", label: "Convocatoria lista y confirmada", completado: false, categoria: "convocatoria" },
        { id: "cl2", label: "Alineación confirmada con el staff", completado: false, categoria: "convocatoria" },
        { id: "cl3", label: "Lesionados revisados por médico", completado: false, categoria: "medico" },
        { id: "cl4", label: "Sports Score actualizado", completado: false, categoria: "medico" },
        { id: "cl5", label: "Wellness del plantel revisado", completado: false, categoria: "medico" },
        { id: "cl6", label: "Uniformes y equipamiento listos", completado: false, categoria: "logistica" },
        { id: "cl7", label: "Transporte confirmado", completado: false, categoria: "logistica" },
        { id: "cl8", label: "Documentación en regla", completado: false, categoria: "documentacion" },
        { id: "cl9", label: "Árbitros notificados", completado: false, categoria: "logistica" },
        { id: "cl10", label: "Instalación revisada", completado: false, categoria: "logistica" },
      ]
    };
  }
  static savePregameChecklist(c: PregameChecklist): void {
    const all = this.get<PregameChecklist[]>("tact_checklists", []).filter(x => x.matchId !== c.matchId);
    all.push(c);
    this.set("tact_checklists", all);
  }

  // Post Match Reports
  static getPostMatchReports(): PostMatchReport[] {
    return this.get<PostMatchReport[]>("tact_post_reports", INITIAL_POST_REPORTS);
  }
  static savePostMatchReport(r: PostMatchReport): void {
    const all = this.getPostMatchReports().filter(x => x.id !== r.id);
    all.push(r);
    this.set("tact_post_reports", all);
  }
  static generatePostMatchReport(matchId: string, match: { rival: string; resultado?: { propio: number; rival: number } | null }): PostMatchReport {
    const loads = RendimientoStore.getPlayerLoadData();
    const aiRecs = [
      "Reforzar el trabajo de presión alta en los próximos 2 entrenamientos.",
      "Revisar la cobertura defensiva en balón parado con el asistente.",
      "Monitorear la carga de los mediocampistas — ACWR elevado esta semana.",
    ];
    return {
      id: `pmr-${matchId}`,
      matchId,
      resultado: match.resultado ?? { propio: 0, rival: 0 },
      formacion: "4-3-3",
      participacion: jugadores.slice(0, 11).map((j, i) => ({
        jugadorId: j.id,
        minutos: i < 9 ? 90 : i === 9 ? 68 : 22,
        posicion: ["Portero","Lateral Der.","Central","Central","Lateral Izq.","Medio","Medio","Medio","Extremo","Delantero","Extremo"][i],
        evaluacion: 6 + Math.floor(Math.random() * 3),
        esTitular: i < 11,
        cambioMinuto: i === 9 ? 68 : undefined,
      })),
      observaciones: `Partido vs ${match.rival}. El equipo mostró buen nivel de presión en los primeros 30 minutos pero bajó la intensidad en el segundo tiempo.`,
      conclusiones: "Necesitamos mejorar la gestión energética en el segundo tiempo. Los cambios tácticos fueron efectivos.",
      accionesPendientes: ["Análisis de video del segundo tiempo", "Reunión técnica el lunes", "Revisar ACWR de los mediocampistas"],
      recomendacionesIA: aiRecs,
      creadoEn: new Date().toISOString(),
    };
  }

  // Tactical Evolution
  static getTacticalEvolution(): TacticalEvolutionEntry[] {
    return this.get<TacticalEvolutionEntry[]>("tact_evolution", INITIAL_EVOLUTION);
  }

  // Match Comparison
  static compareMatches(idA: string, idB: string): ComparisonMetric[] {
    const evol = this.getTacticalEvolution();
    const a = evol.find(e => e.fecha === idA) ?? evol[0];
    const b = evol.find(e => e.fecha === idB) ?? evol[1];
    return [
      { metrica: "Goles marcados", labelA: a?.rival ?? "Partido A", valorA: a?.resultado?.propio ?? 2, labelB: b?.rival ?? "Partido B", valorB: b?.resultado?.propio ?? 1 },
      { metrica: "Goles recibidos", labelA: a?.rival ?? "Partido A", valorA: a?.resultado?.rival ?? 1, labelB: b?.rival ?? "Partido B", valorB: b?.resultado?.rival ?? 2 },
      { metrica: "Sports Score promedio", labelA: a?.rival ?? "Partido A", valorA: a?.sportsScorePromedio ?? 85, labelB: b?.rival ?? "Partido B", valorB: b?.sportsScorePromedio ?? 82, unidad: "%" },
    ];
  }

  // Staff members (mock)
  static getStaff(): TechnicalStaffMember[] {
    return [
      { rol: "director",      nombre: "Ricardo Mora",     email: "rmora@elite.com" },
      { rol: "entrenador",    nombre: "Carlos Méndez",    email: "cmendez@elite.com" },
      { rol: "asistente",     nombre: "Andrés Pérez",     email: "aperez@elite.com" },
      { rol: "preparador",    nombre: "Diego Soto",       email: "dsoto@elite.com" },
      { rol: "medico",        nombre: "Dr. Luis Mora",    email: "lmora@elite.com" },
      { rol: "fisio",         nombre: "Ana Vargas",       email: "avargas@elite.com" },
      { rol: "nutricionista", nombre: "Laura Brenes",     email: "lbrenes@elite.com" },
      { rol: "psicologo",     nombre: "Marco Solano",     email: "msolano@elite.com" },
    ];
  }
}

export default TacticalStore;
