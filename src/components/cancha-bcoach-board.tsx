// ─── CANCHA BCOACH TACTICAL BOARD SUITE (VIDEO ANALYSIS & 2D PITCH) ───────────
// Pizarra táctica interactiva estilo bCoach idéntica a la app profesional.
// • Modo Cancha Verde 2D y Modo Análisis de Video / Imagen Táctica en Vivo.
// • Reproductor de video con pausa para dibujo sobre congelado de jugadas reales.
// • Herramienta de Zonas Sombreadas de Espacio (resaltado transparente en naranja/amarillo).
// • Menú emergente de acción "+" (Alineaciones, Video/Imagen, Cambiar Campo, Guardar).
// • Orientación responsiva (Landscape en PC/Tablet, Portrait 90° en móvil).
// • Pinch-to-zoom y pan con dos dedos.

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Pencil, RotateCcw, Trash2, Maximize2, User, Users, Plus, Play, Pause,
  Video, Image as ImageIcon, ChevronDown, Type as TextIcon, ZoomIn, ZoomOut,
  FolderOpen, Shield, HelpCircle, Layers, ArrowRight, Square, Eye, Hand, Save, X,
  SkipForward, SkipBack, Grid, Target, Download, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SportFieldInner } from "@/components/sport-field";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ToolMode = "select" | "draw-solid" | "draw-dashed" | "draw-arrow" | "draw-zone" | "eraser" | "add-player" | "add-item" | "add-cone" | "add-minigoal" | "add-text";
type StrokeStyle = "solid" | "dashed" | "arrow" | "zone";

interface FreePath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  style: StrokeStyle;
}

interface ShadedZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export type PlayerTeamColor = "orange" | "blue" | "red" | "white" | "yellow" | "black" | "green";

interface BoardPlayer {
  id: string;
  number: string;
  color: PlayerTeamColor;
  x: number;
  y: number;
  label?: string;
  isJoker?: boolean;
  isGK?: boolean;
}

export const TEAM_COLORS_MAP: Record<PlayerTeamColor, { bg: string; text: string; label: string }> = {
  orange: { bg: "#f97316", text: "#ffffff", label: "🟠 Naranja" },
  blue:   { bg: "#2563eb", text: "#ffffff", label: "🔵 Azul" },
  red:    { bg: "#ef4444", text: "#ffffff", label: "🔴 Rojo" },
  white:  { bg: "#ffffff", text: "#0f172a", label: "⚪ Blanco" },
  yellow: { bg: "#eab308", text: "#0f172a", label: "🟡 Amarillo" },
  black:  { bg: "#0f172a", text: "#ffffff", label: "🖤 Negro" },
  green:  { bg: "#22c55e", text: "#ffffff", label: "🟢 Verde" },
};

interface BoardBall {
  id: string;
  x: number;
  y: number;
}

interface BoardCone {
  id: string;
  x: number;
  y: number;
  color?: string;
}

interface BoardMiniGoal {
  id: string;
  x: number;
  y: number;
  rotation?: number;
}

interface BoardText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

export interface BoardKeyframe {
  id: string;
  nombre: string;
  players: BoardPlayer[];
  balls: BoardBall[];
  cones: BoardCone[];
  miniGoals: BoardMiniGoal[];
  texts: BoardText[];
  zones: ShadedZone[];
  paths: FreePath[];
}

export interface SavedBoardPreset {
  id: string;
  nombre: string;
  categoria?: string;
  fecha: string;
  paths?: FreePath[];
  zones?: ShadedZone[];
  players?: BoardPlayer[];
  balls?: BoardBall[];
  cones?: BoardCone[];
  miniGoals?: BoardMiniGoal[];
  texts?: BoardText[];
  keyframes?: BoardKeyframe[];
  teamColor?: PlayerTeamColor;
}

const PRESET_DRILLS: SavedBoardPreset[] = [
  {
    id: "preset-3",
    nombre: "Formación 4-3-3 Ofensiva (11v11)",
    categoria: "Alineaciones Clásicas",
    fecha: "Plantilla Oficial",
    paths: [],
    zones: [],
    players: [
      { id: "p1", number: "1", color: "orange", x: 8, y: 32.5 },
      { id: "p2", number: "2", color: "orange", x: 26, y: 12 },
      { id: "p3", number: "4", color: "orange", x: 24, y: 25 },
      { id: "p4", number: "5", color: "orange", x: 24, y: 40 },
      { id: "p5", number: "3", color: "orange", x: 26, y: 53 },
      { id: "p6", number: "6", color: "orange", x: 44, y: 32.5 },
      { id: "p7", number: "8", color: "orange", x: 50, y: 20 },
      { id: "p8", number: "10", color: "orange", x: 50, y: 45 },
      { id: "p9", number: "7", color: "orange", x: 72, y: 12 },
      { id: "p10", number: "9", color: "orange", x: 76, y: 32.5 },
      { id: "p11", number: "11", color: "orange", x: 72, y: 53 },
    ],
    balls: [{ id: "b1", x: 44, y: 32.5 }],
    texts: [],
    teamColor: "orange",
  },
  {
    id: "preset-4",
    nombre: "Formación 4-4-2 Bloque Medio (11v11)",
    categoria: "Alineaciones Clásicas",
    fecha: "Plantilla Oficial",
    paths: [],
    zones: [],
    players: [
      { id: "p1", number: "1", color: "blue", x: 8, y: 32.5 },
      { id: "p2", number: "2", color: "blue", x: 26, y: 12 },
      { id: "p3", number: "4", color: "blue", x: 24, y: 25 },
      { id: "p4", number: "5", color: "blue", x: 24, y: 40 },
      { id: "p5", number: "3", color: "blue", x: 26, y: 53 },
      { id: "p6", number: "7", color: "blue", x: 48, y: 12 },
      { id: "p7", number: "6", color: "blue", x: 46, y: 25 },
      { id: "p8", number: "8", color: "blue", x: 46, y: 40 },
      { id: "p9", number: "11", color: "blue", x: 48, y: 53 },
      { id: "p10", number: "9", color: "blue", x: 72, y: 24 },
      { id: "p11", number: "10", color: "blue", x: 72, y: 41 },
    ],
    balls: [{ id: "b1", x: 46, y: 32.5 }],
    texts: [],
    teamColor: "blue",
  },
  {
    id: "preset-5",
    nombre: "Formación 4-2-3-1 Presión Alta",
    categoria: "Alineaciones Clásicas",
    fecha: "Plantilla Oficial",
    paths: [],
    zones: [],
    players: [
      { id: "p1", number: "1", color: "red", x: 8, y: 32.5 },
      { id: "p2", number: "2", color: "red", x: 26, y: 12 },
      { id: "p3", number: "4", color: "red", x: 24, y: 25 },
      { id: "p4", number: "5", color: "red", x: 24, y: 40 },
      { id: "p5", number: "3", color: "red", x: 26, y: 53 },
      { id: "p6", number: "6", color: "red", x: 42, y: 23 },
      { id: "p7", number: "8", color: "red", x: 42, y: 42 },
      { id: "p8", number: "7", color: "red", x: 58, y: 14 },
      { id: "p9", number: "10", color: "red", x: 58, y: 32.5 },
      { id: "p10", number: "11", color: "red", x: 58, y: 51 },
      { id: "p11", number: "9", color: "red", x: 75, y: 32.5 },
    ],
    balls: [{ id: "b1", x: 58, y: 32.5 }],
    texts: [],
    teamColor: "red",
  },
  {
    id: "preset-6",
    nombre: "Futsal 5v5 (Rombo 1-2-1)",
    categoria: "Fútbol Sala & Futsal",
    fecha: "Plantilla Oficial",
    paths: [],
    zones: [],
    players: [
      { id: "p1", number: "1", color: "green", x: 12, y: 32.5 },
      { id: "p2", number: "2", color: "green", x: 30, y: 32.5 },
      { id: "p3", number: "3", color: "green", x: 50, y: 15 },
      { id: "p4", number: "4", color: "green", x: 50, y: 50 },
      { id: "p5", number: "5", color: "green", x: 75, y: 32.5 },
    ],
    balls: [{ id: "b1", x: 30, y: 32.5 }],
    texts: [],
    teamColor: "green",
  },
  {
    id: "preset-1",
    nombre: "Juego de Posición 5v4 (3 Zonas)",
    categoria: "Posición & Presión",
    fecha: "Plantilla Oficial",
    paths: [],
    zones: [
      { id: "z1", x: 50, y: 5, width: 45, height: 40, color: "#eab308" },
      { id: "z2", x: 15, y: 40, width: 40, height: 20, color: "#ffffff" },
    ],
    players: [
      { id: "p1", number: "1", color: "yellow", x: 18, y: 15 },
      { id: "p2", number: "2", color: "yellow", x: 28, y: 18 },
      { id: "p3", number: "3", color: "yellow", x: 20, y: 28 },
      { id: "p4", number: "4", color: "yellow", x: 28, y: 28 },
      { id: "p5", number: "1", color: "blue", x: 55, y: 12 },
      { id: "p6", number: "2", color: "blue", x: 66, y: 15 },
      { id: "p7", number: "3", color: "blue", x: 70, y: 24 },
      { id: "p8", number: "4", color: "blue", x: 60, y: 28 },
      { id: "p9", number: "5", color: "blue", x: 68, y: 35 },
      { id: "p10", number: "1", color: "orange", x: 25, y: 46 },
      { id: "p11", number: "2", color: "orange", x: 27, y: 53 },
      { id: "p12", number: "3", color: "orange", x: 45, y: 47 },
      { id: "p13", number: "4", color: "orange", x: 45, y: 53 },
      { id: "p14", number: "5", color: "orange", x: 35, y: 50 },
    ],
    balls: [{ id: "b1", x: 49, y: 25 }],
    texts: [],
    teamColor: "orange",
  },
  {
    id: "preset-2",
    nombre: "Salida de Balón Lavolpiana 4-3-3",
    categoria: "Salida & Construcción",
    fecha: "Plantilla Oficial",
    paths: [
      { id: "pt1", points: [{ x: 8, y: 32.5 }, { x: 24, y: 25 }], color: "#22c55e", width: 0.8, style: "dashed" },
      { id: "pt2", points: [{ x: 24, y: 25 }, { x: 44, y: 32.5 }], color: "#f59e0b", width: 0.8, style: "arrow" },
    ],
    zones: [],
    players: [
      { id: "p1", number: "1", color: "orange", x: 8, y: 32.5 },
      { id: "p2", number: "4", color: "orange", x: 22, y: 20 },
      { id: "p3", number: "5", color: "orange", x: 22, y: 45 },
      { id: "p4", number: "6", color: "orange", x: 24, y: 32.5 },
      { id: "p5", number: "2", color: "orange", x: 32, y: 10 },
      { id: "p6", number: "3", color: "orange", x: 32, y: 55 },
      { id: "p7", number: "8", color: "orange", x: 44, y: 25 },
      { id: "p8", number: "10", color: "orange", x: 44, y: 40 },
    ],
    balls: [{ id: "b1", x: 12, y: 32.5 }],
    texts: [],
    teamColor: "orange",
  },
];

// SAMPLE VIDEO DEMOS FOR COACHING ANALYSIS
const TACTICAL_VIDEO_SAMPLES = [
  { id: "v1", title: "Salida de Balón tras Robo", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", duration: "00:15" },
  { id: "v2", title: "Presión en Bloque Alto", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", duration: "00:12" },
];

const COLORS = [
  "#ffffff", "#ef4444", "#f59e0b", "#eab308",
  "#3b82f6", "#a855f7", "#22c55e", "#000000",
];

const VW = 100;
const VH = 65;

const FORMATIONS: Record<string, { label: string; pts: { n: string; x: number; y: number }[] }> = {
  "4-4-2": {
    label: "4-4-2 Clásica",
    pts: [
      { n: "1", x: 8, y: 32.5 }, { n: "2", x: 26, y: 12 }, { n: "4", x: 24, y: 25 },
      { n: "5", x: 24, y: 40 }, { n: "3", x: 26, y: 53 }, { n: "7", x: 48, y: 12 },
      { n: "6", x: 46, y: 25 }, { n: "8", x: 46, y: 40 }, { n: "11", x: 48, y: 53 },
      { n: "9", x: 72, y: 24 }, { n: "10", x: 72, y: 41 },
    ],
  },
  "4-3-3": {
    label: "4-3-3 Ofensiva",
    pts: [
      { n: "1", x: 8, y: 32.5 }, { n: "2", x: 26, y: 12 }, { n: "4", x: 24, y: 25 },
      { n: "5", x: 24, y: 40 }, { n: "3", x: 26, y: 53 }, { n: "6", x: 44, y: 32.5 },
      { n: "8", x: 50, y: 20 }, { n: "10", x: 50, y: 45 }, { n: "7", x: 72, y: 12 },
      { n: "9", x: 76, y: 32.5 }, { n: "11", x: 72, y: 53 },
    ],
  },
  "4-2-3-1": {
    label: "4-2-3-1 Moderna",
    pts: [
      { n: "1", x: 8, y: 32.5 }, { n: "2", x: 26, y: 12 }, { n: "4", x: 24, y: 25 },
      { n: "5", x: 24, y: 40 }, { n: "3", x: 26, y: 53 }, { n: "6", x: 42, y: 23 },
      { n: "8", x: 42, y: 42 }, { n: "7", x: 58, y: 14 }, { n: "10", x: 58, y: 32.5 },
      { n: "11", x: 58, y: 51 }, { n: "9", x: 76, y: 32.5 },
    ],
  },
  "3-5-2": {
    label: "3-5-2 Ancho",
    pts: [
      { n: "1", x: 8, y: 32.5 }, { n: "4", x: 24, y: 16 }, { n: "5", x: 22, y: 32.5 },
      { n: "2", x: 24, y: 49 }, { n: "7", x: 46, y: 10 }, { n: "6", x: 44, y: 24 },
      { n: "8", x: 42, y: 32.5 }, { n: "10", x: 44, y: 41 }, { n: "11", x: 46, y: 55 },
      { n: "9", x: 72, y: 25 }, { n: "19", x: 72, y: 40 },
    ],
  },
};

function pointsToD(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  return d;
}

export function CanchaBCoachBoard({
  teamName = "U9 Asoderive",
  category = "Sub-9",
  rivalName = "U9 San Jose FC",
  matchTitle = "Partido Oficial",
  initialMode = "matchday",
  onClose,
}: {
  teamName?: string;
  category?: string;
  rivalName?: string;
  matchTitle?: string;
  initialMode?: "training" | "matchday";
  onClose?: () => void;
}) {
  // Mode Selector: "training" vs "matchday" (Plan de Juego)
  const [boardMode, setBoardMode] = useState<"training" | "matchday">(initialMode);
  const [activePhase, setActivePhase] = useState<"ataque" | "defensa" | "transicion" | "abp">("ataque");
  const [showCamerinoModal, setShowCamerinoModal] = useState<boolean>(false);
  const [substitutionsList, setSubstitutionsList] = useState<Array<{ id: string; outName: string; inName: string; min: string }>>([]);

  // Orientation
  const [isPortrait, setIsPortrait] = useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth < window.innerHeight
  );

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerWidth < window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Board tools state
  const [activeTool, setActiveTool] = useState<ToolMode>("draw-solid");
  const [strokeType, setStrokeType] = useState<StrokeStyle>("solid");
  const [color, setColor] = useState<string>("#ffffff");
  const [strokeW, setStrokeW] = useState<number>(0.7);

  // Video Mode State
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);

  // Stored board elements
  const [paths, setPaths] = useState<FreePath[]>([]);
  const [zones, setZones] = useState<ShadedZone[]>([]);
  const [players, setPlayers] = useState<BoardPlayer[]>([]);
  const [balls, setBalls] = useState<BoardBall[]>([]);
  const [cones, setCones] = useState<BoardCone[]>([]);
  const [miniGoals, setMiniGoals] = useState<BoardMiniGoal[]>([]);
  const [texts, setTexts] = useState<BoardText[]>([]);

  // Táctica & Grid State
  const [showGuardiolaGrid, setShowGuardiolaGrid] = useState<boolean>(false);

  // Carga Automática de la Convocatoria Real con Nombres y Dorsales para el Modo Partido
  const loadRealMatchConvocatoria = useCallback(() => {
    const dbJugadores = RendimientoStore.getJugadores();
    // Jugadores reales convocados para U9 Asoderive
    const u9Jugadores = dbJugadores.length > 0 ? dbJugadores : [
      { id: "j1", nombre: "Nicolás Segura Vargas", numero: "1", posicion: "Portero" },
      { id: "j2", nombre: "Andrés Soto Vega", numero: "2", posicion: "Defensa" },
      { id: "j3", nombre: "Benjamín Méndez Aguilar", numero: "3", posicion: "Defensa" },
      { id: "j4", nombre: "Carlos Jiménez León", numero: "4", posicion: "Defensa" },
      { id: "j5", nombre: "Daniel Alvarado Ruiz", numero: "5", posicion: "Defensa" },
      { id: "j6", nombre: "Emiliano Cordero León", numero: "6", posicion: "Mediocampista" },
      { id: "j7", nombre: "Ian Calvo Jiménez", numero: "7", posicion: "Delantero" },
      { id: "j8", nombre: "José Castro Mora", numero: "8", posicion: "Mediocampista" },
      { id: "j9", nombre: "Luis Vargas Solís", numero: "9", posicion: "Delantero" },
      { id: "j10", nombre: "Sebastián Araya Mora", numero: "10", posicion: "Mediocampista" },
      { id: "j11", nombre: "Ángel Rojas Céspedes", numero: "11", posicion: "Delantero" },
    ];

    const titularCoords = FORMATIONS["4-3-3"].pts;
    const starterPlayers: BoardPlayer[] = titularCoords.map((coord, idx) => {
      const realJ = u9Jugadores[idx] || { nombre: `Jugador ${idx + 1}`, numero: `${idx + 1}` };
      const isGK = idx === 0 || realJ.posicion?.toLowerCase().includes("portero");
      return {
        id: `starter-${realJ.id || idx}`,
        number: realJ.numero || `${idx + 1}`,
        color: isGK ? "yellow" : "orange",
        x: coord.x,
        y: coord.y,
        label: realJ.nombre.split(" ").slice(0, 2).join(" "),
        isGK,
      };
    });

    // Añadir Rival 4-3-3
    const rivalCoords = FORMATIONS["4-3-3"].pts;
    const rivalPlayers: BoardPlayer[] = rivalCoords.map((coord, idx) => ({
      id: `rival-${idx}`,
      number: coord.n,
      color: idx === 0 ? "white" : "blue",
      x: 100 - coord.x,
      y: coord.y,
      label: idx === 0 ? "Rival PO" : `Rival #${coord.n}`,
      isGK: idx === 0,
    }));

    setPlayers([...starterPlayers, ...rivalPlayers]);
    setBalls([{ id: "b-match", x: 50, y: 32.5 }]);
    toast.success(`🏆 Pizarra de Partido cargada con la convocatoria real de ${teamName}`);
  }, [teamName]);

  useEffect(() => {
    if (boardMode === "matchday") {
      loadRealMatchConvocatoria();
    }
  }, [boardMode, loadRealMatchConvocatoria]);

  // Keyframe Animation Engine (Pasos Tácticos Animados)
  const [keyframes, setKeyframes] = useState<BoardKeyframe[]>([]);
  const [activeFrameIdx, setActiveFrameIdx] = useState<number>(0);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(false);
  const animRef = useRef<number | null>(null);

  // Capturar Fotograma / Paso Táctico Actual
  const handleAddKeyframe = useCallback(() => {
    const frameNum = keyframes.length + 1;
    const newFrame: BoardKeyframe = {
      id: `frame-${Date.now()}`,
      nombre: `Paso ${frameNum}`,
      players: JSON.parse(JSON.stringify(players)),
      balls: JSON.parse(JSON.stringify(balls)),
      cones: JSON.parse(JSON.stringify(cones)),
      miniGoals: JSON.parse(JSON.stringify(miniGoals)),
      texts: JSON.parse(JSON.stringify(texts)),
      zones: JSON.parse(JSON.stringify(zones)),
      paths: JSON.parse(JSON.stringify(paths)),
    };

    setKeyframes((prev) => {
      const updated = [...prev, newFrame];
      setActiveFrameIdx(updated.length - 1);
      return updated;
    });
    toast.success(`🎬 Paso ${frameNum} registrado en la secuencia táctica.`);
  }, [players, balls, cones, miniGoals, texts, zones, paths, keyframes.length]);

  // Cargar Fotograma
  const handleSelectKeyframe = useCallback((idx: number) => {
    if (idx < 0 || idx >= keyframes.length) return;
    const f = keyframes[idx];
    setActiveFrameIdx(idx);
    setPlayers(JSON.parse(JSON.stringify(f.players || [])));
    setBalls(JSON.parse(JSON.stringify(f.balls || [])));
    setCones(JSON.parse(JSON.stringify(f.cones || [])));
    setMiniGoals(JSON.parse(JSON.stringify(f.miniGoals || [])));
    setTexts(JSON.parse(JSON.stringify(f.texts || [])));
    setZones(JSON.parse(JSON.stringify(f.zones || [])));
    setPaths(JSON.parse(JSON.stringify(f.paths || [])));
  }, [keyframes]);

  // Eliminar el paso o fotograma activo seleccionado
  const handleRemoveActiveKeyframe = useCallback(() => {
    if (keyframes.length === 0) return;
    setKeyframes((prev) => {
      const updated = prev.filter((_, idx) => idx !== activeFrameIdx);
      if (updated.length === 0) {
        setActiveFrameIdx(0);
        setIsPlayingAnimation(false);
      } else {
        const nextIdx = Math.max(0, Math.min(activeFrameIdx, updated.length - 1));
        setActiveFrameIdx(nextIdx);
      }
      return updated;
    });
    toast.info(`🗑️ Paso ${activeFrameIdx + 1} eliminado de la animación.`);
  }, [activeFrameIdx, keyframes.length]);

  // Smooth Interpolation Animation Loop (Transición fluida a 60 FPS con Easing)
  useEffect(() => {
    if (!isPlayingAnimation || keyframes.length < 2) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let startFrameIdx = activeFrameIdx;
    if (startFrameIdx >= keyframes.length - 1) {
      startFrameIdx = 0;
      setActiveFrameIdx(0);
    }

    let startTime = performance.now();
    const duration = 1200; // 1.2s por transición de fotograma

    const fromFrame = keyframes[startFrameIdx];
    const toFrame = keyframes[startFrameIdx + 1];

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease-in-out formula
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Interpolate players
      if (fromFrame.players && toFrame.players) {
        setPlayers(
          fromFrame.players.map((fp) => {
            const tp = toFrame.players.find((p) => p.id === fp.id || (p.number === fp.number && p.color === fp.color));
            if (!tp) return fp;
            return {
              ...fp,
              x: fp.x + (tp.x - fp.x) * ease,
              y: fp.y + (tp.y - fp.y) * ease,
            };
          })
        );
      }

      // Interpolate balls along drawn pass/shot path trajectory or linearly
      if (fromFrame.balls && toFrame.balls && fromFrame.balls.length > 0 && toFrame.balls.length > 0) {
        const fb = fromFrame.balls[0];
        const tb = toFrame.balls[0];

        // Check if there is a drawn pass or shot path in fromFrame
        const matchingPath = fromFrame.paths?.find((path) => path.points.length >= 2);
        if (matchingPath && matchingPath.points.length >= 2) {
          const pts = matchingPath.points;
          const totalSegments = pts.length - 1;
          const targetIndex = ease * totalSegments;
          const baseIndex = Math.floor(targetIndex);
          const segmentProgress = targetIndex - baseIndex;

          const p1 = pts[Math.min(baseIndex, totalSegments)];
          const p2 = pts[Math.min(baseIndex + 1, totalSegments)];

          const ballX = p1.x + (p2.x - p1.x) * segmentProgress;
          const ballY = p1.y + (p2.y - p1.y) * segmentProgress;

          setBalls([{ ...fb, x: ballX, y: ballY }]);
        } else {
          setBalls([{
            ...fb,
            x: fb.x + (tb.x - fb.x) * ease,
            y: fb.y + (tb.y - fb.y) * ease,
          }]);
        }
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        if (startFrameIdx + 1 < keyframes.length - 1) {
          setActiveFrameIdx(startFrameIdx + 1);
        } else {
          setActiveFrameIdx(keyframes.length - 1);
          setIsPlayingAnimation(false);
          toast.success("🎬 Animación táctica completada.");
        }
      }
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlayingAnimation, activeFrameIdx, keyframes]);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [livePts, setLivePts] = useState<{ x: number; y: number }[]>([]);
  const [zoneStart, setZoneStart] = useState<{ x: number; y: number } | null>(null);
  const [zoneCurrent, setZoneCurrent] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState<{ type: "player" | "ball" | "cone" | "minigoal" | "text" | "zone"; id: string } | null>(null);
  const [teamColor, setTeamColor] = useState<PlayerTeamColor>("orange");

  // Numeración independiente por color de equipo:
  // - Si no hay jugadores del color seleccionado (o se limpia la cancha), empieza en 1.
  // - Si se cambia de color, arranca en 1 para el nuevo equipo.
  // - Si se regresa a un color con jugadores colocados, continúa la numeración existente.
  const getNextNumberForColor = useCallback((targetColor: PlayerTeamColor): number => {
    const colorPlayers = players.filter((p) => p.color === targetColor);
    if (colorPlayers.length === 0) return 1;
    const existingNums = colorPlayers
      .map((p) => parseInt(p.number, 10))
      .filter((n) => !isNaN(n));
    if (existingNums.length === 0) return 1;
    const max = Math.max(...existingNums);
    return max >= 99 ? 1 : max + 1;
  }, [players]);

  const currentNextNum = useMemo(() => getNextNumberForColor(teamColor), [getNextNumberForColor, teamColor]);

  // Zoom + pan
  const [zoom, setZoom] = useState(1);
  const [isDockMinimized, setIsDockMinimized] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [modalConfirmClear, setModalConfirmClear] = useState<boolean>(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Banco de Pizarras Guardadas State
  const [bancoPizarras, setBancoPizarras] = useState<SavedBoardPreset[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_banco_pizarras");
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...PRESET_DRILLS, ...parsed];
      }
    } catch (e) {}
    return PRESET_DRILLS;
  });

  const [modalGuardarPizarra, setModalGuardarPizarra] = useState<boolean>(false);
  const [modalBancoPizarras, setModalBancoPizarras] = useState<boolean>(false);
  const [nombrePizarraInput, setNombrePizarraInput] = useState<string>("");
  const [categoriaPizarraInput, setCategoriaPizarraInput] = useState<string>("Posición & Presión");

  const handleGuardarPizarraEnBanco = () => {
    if (!nombrePizarraInput.trim()) {
      toast.error("Por favor ingresa un nombre para la pizarra / ejercicio.");
      return;
    }

    const nuevaPizarra: SavedBoardPreset = {
      id: `piz-${Date.now()}`,
      nombre: nombrePizarraInput.trim(),
      categoria: categoriaPizarraInput,
      fecha: new Date().toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" }),
      paths: [...paths],
      zones: [...zones],
      players: [...players],
      balls: [...balls],
      cones: [...cones],
      texts: [...texts],
      teamColor,
    };

    const userBoards = bancoPizarras.filter((p) => !p.id.startsWith("preset-"));
    const updatedUserBoards = [nuevaPizarra, ...userBoards];

    try {
      localStorage.setItem("nexus_banco_pizarras", JSON.stringify(updatedUserBoards));
    } catch (e) {}

    setBancoPizarras([...PRESET_DRILLS, ...updatedUserBoards]);

    // Async sync to Supabase
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase.from("pizarras").upsert({
      id: nuevaPizarra.id,
      nombre: nuevaPizarra.nombre,
      players: nuevaPizarra.players,
      zones: nuevaPizarra.zones,
      arrows: nuevaPizarra.paths,
      ball: nuevaPizarra.balls,
      cones: nuevaPizarra.cones,
      organizacion_id: orgId,
      created_at: new Date().toISOString(),
    }).then();

    toast.success(`🎉 Pizarra "${nuevaPizarra.nombre}" guardada en el Banco de Pizarras.`);
    setNombrePizarraInput("");
    setModalGuardarPizarra(false);
  };

  const handleCargarPizarraDesdeBanco = (p: SavedBoardPreset) => {
    setPaths(p.paths || []);
    setZones(p.zones || []);
    setPlayers(p.players || []);
    setBalls(p.balls || []);
    setCones(p.cones || []);
    setTexts(p.texts || []);
    if (p.teamColor) setTeamColor(p.teamColor);
    setModalBancoPizarras(false);
    toast.success(`⚽ Pizarra "${p.nombre}" cargada en la cancha.`);
  };

  const handleEliminarPizarraDeBanco = (id: string, nombre: string) => {
    if (id.startsWith("preset-")) {
      toast.error("Las plantillas oficiales del sistema no se pueden eliminar.");
      return;
    }

    const updatedUserBoards = bancoPizarras.filter((p) => !p.id.startsWith("preset-") && p.id !== id);

    try {
      localStorage.setItem("nexus_banco_pizarras", JSON.stringify(updatedUserBoards));
    } catch (e) {}

    setBancoPizarras([...PRESET_DRILLS, ...updatedUserBoards]);
    toast.info(`🗑️ Pizarra "${nombre}" eliminada del banco.`);
  };

  const handleEditarPizarraEnBanco = (p: SavedBoardPreset) => {
    if (p.id.startsWith("preset-")) {
      toast.error("Las plantillas oficiales del sistema no se pueden modificar.");
      return;
    }
    const nuevoNombre = window.prompt("Nuevo nombre para el ejercicio:", p.nombre);
    if (!nuevoNombre || !nuevoNombre.trim()) return;

    const userBoards = bancoPizarras.filter((item) => !item.id.startsWith("preset-"));
    const updatedUserBoards = userBoards.map((item) => {
      if (item.id === p.id) {
        return {
          ...item,
          nombre: nuevoNombre.trim(),
        };
      }
      return item;
    });

    try {
      localStorage.setItem("nexus_banco_pizarras", JSON.stringify(updatedUserBoards));
    } catch (e) {}

    setBancoPizarras([...PRESET_DRILLS, ...updatedUserBoards]);
    toast.success(`✏️ Ejercicio renombrado a "${nuevoNombre.trim()}".`);
  };
  const lastPinchDist = useRef<number | null>(null);
  const sheetTouchStartY = useRef<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // SVG coordinate transformation (handles portrait SVG rotation 90° CW)
  const getSVGCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!svgRef.current) return { x: 50, y: 32.5 };
    const rect = svgRef.current.getBoundingClientRect();
    if (isPortrait) {
      // Portrait viewBox is "0 0 65 100" and SVG content is wrapped in <g transform="translate(65,0) rotate(90)">
      // clientX/clientY relative to rect:
      // px is 0..65 from left to right on screen
      // py is 0..100 from top to bottom on screen
      const px = ((clientX - rect.left) / rect.width) * 65;
      const py = ((clientY - rect.top) / rect.height) * 100;
      return {
        x: Math.max(0, Math.min(VW, py)),
        y: Math.max(0, Math.min(VH, 65 - px)),
      };
    }
    const rx = (clientX - rect.left) / rect.width;
    const ry = (clientY - rect.top) / rect.height;
    return {
      x: Math.max(0, Math.min(VW, rx * VW)),
      y: Math.max(0, Math.min(VH, ry * VH)),
    };
  }, [isPortrait]);

  // Video play/pause toggle
  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (isPlayingVideo) {
      videoRef.current.pause();
      setIsPlayingVideo(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlayingVideo(true);
    }
  };

  // Video Time Update
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
      setVideoDuration(videoRef.current.duration || 0);
    }
  };

  // Upload local video OR image file
  const handleCustomVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith("image/")) {
        // Image → use as background (not video mode)
        setBackgroundImageUrl(url);
        setActiveVideoUrl(null);
        toast.success("🖼️ Imagen de campo cargada como fondo de la pizarra.");
      } else {
        setActiveVideoUrl(url);
        setBackgroundImageUrl(null);
        setIsPlayingVideo(true);
        toast.success("📹 Video de análisis cargado correctamente.");
      }
    }
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  // Camera photo capture → use as field background
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBackgroundImageUrl(url);
      setActiveVideoUrl(null);
      toast.success("📸 Foto del campo cargada. ¡Dibuja sobre ella!");
    }
    e.target.value = "";
  };

  // Format seconds to MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Pointer Handlers
  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const { x, y } = getSVGCoords(e.clientX, e.clientY);

    if (activeTool === "select") {
      // En modo Mover, tocar espacio vacío no crea objetos ni dibuja líneas
      return;
    }

    if (activeTool === "add-player") {
      const numForColor = getNextNumberForColor(teamColor);
      const p: BoardPlayer = { id: `pl-${Date.now()}`, number: String(numForColor), color: teamColor, x, y };
      setPlayers((prev) => [...prev, p]);
      return;
    }

    if (activeTool === "add-item") {
      setBalls((prev) => [...prev, { id: `ball-${Date.now()}`, x, y }]);
      toast.success("⚽ Balón colocado");
      return;
    }

    if (activeTool === "add-cone") {
      setCones((prev) => [...prev, { id: `cone-${Date.now()}`, x, y }]);
      toast.success("🟧 Cono de entrenamiento colocado");
      return;
    }

    if (activeTool === "add-minigoal") {
      setMiniGoals((prev) => [...prev, { id: `mg-${Date.now()}`, x, y, rotation: 0 }]);
      toast.success("🥅 Mini Arco colocado");
      return;
    }

    if (activeTool === "add-text") {
      const label = window.prompt("Instrucción táctica:", "PRESIÓN ALTA");
      if (label) setTexts((prev) => [...prev, { id: `txt-${Date.now()}`, text: label.toUpperCase(), x, y, color }]);
      return;
    }

    if (activeTool === "draw-zone") {
      setIsDrawing(true);
      setZoneStart({ x, y });
      setZoneCurrent({ x, y });
      (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
      return;
    }

    if (activeTool.startsWith("draw-")) {
      setIsDrawing(true);
      setLivePts([{ x, y }]);
      (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    }
  }, [activeTool, color, getNextNumberForColor, teamColor, getSVGCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (isDrawing) {
      const pt = getSVGCoords(e.clientX, e.clientY);
      if (activeTool === "draw-zone") {
        setZoneCurrent(pt);
      } else {
        setLivePts((prev) => [...prev, pt]);
      }
      return;
    }
    if (dragging) {
      const { x, y } = getSVGCoords(e.clientX, e.clientY);
      if (dragging.type === "player")
        setPlayers((prev) => prev.map((p) => (p.id === dragging.id ? { ...p, x, y } : p)));
      else if (dragging.type === "ball")
        setBalls((prev) => prev.map((b) => (b.id === dragging.id ? { ...b, x, y } : b)));
      else if (dragging.type === "cone")
        setCones((prev) => prev.map((c) => (c.id === dragging.id ? { ...c, x, y } : c)));
      else if (dragging.type === "minigoal")
        setMiniGoals((prev) => prev.map((mg) => (mg.id === dragging.id ? { ...mg, x, y } : mg)));
      else if (dragging.type === "text")
        setTexts((prev) => prev.map((t) => (t.id === dragging.id ? { ...t, x, y } : t)));
    }
  }, [isDrawing, activeTool, dragging, getSVGCoords]);

  const handlePointerUp = useCallback(() => {
    if (isDrawing) {
      if (activeTool === "draw-zone" && zoneStart && zoneCurrent) {
        const x = Math.min(zoneStart.x, zoneCurrent.x);
        const y = Math.min(zoneStart.y, zoneCurrent.y);
        const width = Math.abs(zoneCurrent.x - zoneStart.x);
        const height = Math.abs(zoneCurrent.y - zoneStart.y);
        if (width > 2 && height > 2) {
          setZones((prev) => [
            ...prev,
            { id: `zone-${Date.now()}`, x, y, width, height, color },
          ]);
          toast.success("🟧 Zona sombreada creada.");
        }
      } else if (livePts.length > 1) {
        setPaths((prev) => [
          ...prev,
          { id: `path-${Date.now()}`, points: livePts, color, width: strokeW, style: strokeType },
        ]);
      }
    }
    setIsDrawing(false);
    setLivePts([]);
    setZoneStart(null);
    setZoneCurrent(null);
    setDragging(null);
  }, [isDrawing, activeTool, zoneStart, zoneCurrent, livePts, color, strokeW, strokeType]);

  const loadFormation = useCallback((key: string, colorOverride?: PlayerTeamColor) => {
    const f = FORMATIONS[key];
    if (!f) return;
    const targetColor = colorOverride || teamColor;
    setPlayers((prev) => [
      ...prev,
      ...f.pts.map((c, i) => ({
        id: `fp-${i}-${Date.now()}`,
        number: c.n,
        color: targetColor,
        x: c.x,
        y: c.y,
      })),
    ]);
    toast.success(`👥 ${f.label} (${TEAM_COLORS_MAP[targetColor].label}) desplegada`);
  }, [teamColor]);

  const loadRivalTeam = useCallback((key: string = "4-3-3", rivalColor: PlayerTeamColor = "blue") => {
    const f = FORMATIONS[key];
    if (!f) return;
    const rivalPts = f.pts.map((c, i) => ({
      id: `fp-rival-${i}-${Date.now()}`,
      number: c.n,
      color: rivalColor,
      x: 100 - c.x,
      y: c.y,
    }));
    setPlayers((prev) => [...prev, ...rivalPts]);
    toast.success(`🔴 Equipo Rival 11vs11 (${TEAM_COLORS_MAP[rivalColor].label}) desplegado`);
  }, []);

  const handleClear = () => {
    setPaths([]); setZones([]); setPlayers([]); setBalls([]); setCones([]); setMiniGoals([]); setTexts([]);
    setSelectedPlayerId(null); setKeyframes([]); setActiveFrameIdx(0); setIsPlayingAnimation(false);
    setBackgroundImageUrl(null); setActiveVideoUrl(null);
    toast.info("🧹 Pizarra limpiada por completo");
  };

  const handleUndo = () => {
    if (paths.length > 0) {
      setPaths((p) => p.slice(0, -1));
    } else if (zones.length > 0) {
      setZones((z) => z.slice(0, -1));
    } else if (cones.length > 0) {
      setCones((c) => c.slice(0, -1));
    } else if (balls.length > 0) {
      setBalls((b) => b.slice(0, -1));
    } else if (players.length > 0) {
      setPlayers((p) => p.slice(0, -1));
    }
    toast.info("↩️ Último elemento borrado");
  };

  const resetView = () => { setZoom(1); };

  // ── PINCH-TO-ZOOM TOUCH HANDLERS ──────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = dist / lastPinchDist.current;
      setZoom((z) => Math.min(3, Math.max(0.5, z * delta)));
      lastPinchDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastPinchDist.current = null;
  };

  // SVG Render Layer
  const svgElement = (
    <svg
      ref={svgRef}
      viewBox={isPortrait ? "0 0 65 100" : `0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        touchAction: "none",
        display: "block",
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        // Dark green bg fills letterbox areas so no black bars
        background: "#183b18",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <defs>
        <marker id="bcoach-arrow" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill={color} />
        </marker>
      </defs>

      <g transform={isPortrait ? "translate(65,0) rotate(90)" : undefined}>
        {/* Field Background: Photo/Image > Video (handled externally) > Green 2D Pitch */}
        {backgroundImageUrl ? (
          // Photo or uploaded image as background for drawing on top
          <image
            href={backgroundImageUrl}
            x="0" y="0"
            width={VW} height={VH}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : !activeVideoUrl ? (
          // Default green 2D tactical field
          <SportFieldInner sport="football" />
        ) : null}

        {/* Guardiola 5-Corridor Grid Overlay */}
        {showGuardiolaGrid && (
          <g opacity={0.45} pointerEvents="none">
            {/* 5 Vertical Corridors: y=0..13 (Banda izq), 13..26 (Pasillo int izq), 26..39 (Centro), 39..52 (Pasillo int der), 52..65 (Banda der) */}
            <line x1={0} y1={13} x2={100} y2={13} stroke="#eab308" strokeWidth={0.25} strokeDasharray="1.5,1.5" />
            <line x1={0} y1={26} x2={100} y2={26} stroke="#38bdf8" strokeWidth={0.3} strokeDasharray="2,2" />
            <line x1={0} y1={39} x2={100} y2={39} stroke="#38bdf8" strokeWidth={0.3} strokeDasharray="2,2" />
            <line x1={0} y1={52} x2={100} y2={52} stroke="#eab308" strokeWidth={0.25} strokeDasharray="1.5,1.5" />
            {/* 3 Pitch Thirds: x=33.3 and x=66.6 */}
            <line x1={33.3} y1={0} x2={33.3} y2={65} stroke="#ffffff" strokeWidth={0.25} strokeDasharray="2,2" />
            <line x1={66.6} y1={0} x2={66.6} y2={65} stroke="#ffffff" strokeWidth={0.25} strokeDasharray="2,2" />
          </g>
        )}

        {/* Shaded Space Zones (Zonas sombreadas transparentes estilo bCoach 00:27) */}
        {zones.map((z) => (
          <rect
            key={z.id}
            x={z.x}
            y={z.y}
            width={z.width}
            height={z.height}
            rx={1.5}
            fill={z.color}
            fillOpacity={0.35}
            stroke={z.color}
            strokeWidth={0.6}
            strokeDasharray="2,2"
            onPointerDown={(e) => {
              if (activeTool === "eraser") {
                e.stopPropagation();
                setZones((prev) => prev.filter((item) => item.id !== z.id));
              }
            }}
          />
        ))}

        {/* Live Zone Preview */}
        {isDrawing && activeTool === "draw-zone" && zoneStart && zoneCurrent && (
          <rect
            x={Math.min(zoneStart.x, zoneCurrent.x)}
            y={Math.min(zoneStart.y, zoneCurrent.y)}
            width={Math.abs(zoneCurrent.x - zoneStart.x)}
            height={Math.abs(zoneCurrent.y - zoneStart.y)}
            rx={1.5}
            fill={color}
            fillOpacity={0.35}
            stroke={color}
            strokeWidth={0.6}
            strokeDasharray="2,2"
          />
        )}

        {/* CSS Keyframe animations for flowing passes & pulsing shots */}
        <style>{`
          @keyframes bcoachPassFlow {
            from { stroke-dashoffset: 20; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes bcoachShotGlow {
            0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(255,255,255,0.8)); }
            50% { opacity: 0.6; filter: drop-shadow(0 0 6px rgba(245,158,11,0.9)); }
          }
        `}</style>

        {/* Saved paths */}
        {paths.map((p) => (
          <path key={p.id} d={pointsToD(p.points)} fill="none" stroke={p.color} strokeWidth={p.width}
            strokeDasharray={p.style === "dashed" ? "3,2" : undefined}
            strokeLinecap="round" strokeLinejoin="round"
            markerEnd={p.style === "arrow" ? "url(#bcoach-arrow)" : undefined}
            style={{
              animation: isPlayingAnimation
                ? (p.style === "dashed" ? "bcoachPassFlow 0.6s linear infinite" : "bcoachShotGlow 0.8s ease-in-out infinite")
                : undefined,
            }}
            onPointerDown={(e) => { if (activeTool === "eraser") { e.stopPropagation(); setPaths((prev) => prev.filter((q) => q.id !== p.id)); } }}
          />
        ))}

        {/* Live path */}
        {isDrawing && activeTool !== "draw-zone" && livePts.length > 1 && (
          <path d={pointsToD(livePts)} fill="none" stroke={color} strokeWidth={strokeW}
            strokeDasharray={strokeType === "dashed" ? "3,2" : undefined}
            strokeLinecap="round" strokeLinejoin="round" opacity={0.9}
            markerEnd={strokeType === "arrow" ? "url(#bcoach-arrow)" : undefined}
          />
        )}

        {/* Players */}
        {players.map((p) => {
          const teamMeta = TEAM_COLORS_MAP[p.color] || TEAM_COLORS_MAP.orange;
          const isSelected = selectedPlayerId === p.id;

          return (
            <g
              key={p.id}
              transform={`translate(${p.x},${p.y})`}
              style={{ cursor: "grab" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedPlayerId(p.id);
                if (activeTool === "eraser") {
                  setPlayers((prev) => prev.filter((q) => q.id !== p.id));
                  toast.info(`Jugador #${p.number} eliminado`);
                  return;
                }
                setDragging({ type: "player", id: p.id });
                (e.currentTarget.ownerSVGElement as SVGSVGElement)?.setPointerCapture(e.pointerId);
              }}
            >
              {/* Outer Dashed Selection Ring (Anillo discontinuo de selección idéntico a bCoach) */}
              {isSelected && (
                <circle
                  r={2.4}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={0.35}
                  strokeDasharray="0.6, 0.4"
                  className="animate-pulse"
                />
              )}

              {/* Main Player Token Circle */}
              <circle
                r={1.6}
                fill={teamMeta.bg}
                stroke={isSelected ? "#38bdf8" : "#ffffff"}
                strokeWidth={isSelected ? 0.5 : 0.35}
              />

              {/* Jersey Number */}
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={1.4}
                fill={teamMeta.text}
                fontWeight="900"
                fontFamily="Inter,sans-serif"
                transform={isPortrait ? "rotate(-90)" : undefined}
                style={{ pointerEvents: "none" }}
              >
                {p.number}
              </text>

              {/* Player Name Pill (Nombres Reales de Convocatoria en Modo Partido) */}
              {p.label && (
                <g transform={isPortrait ? "rotate(-90)" : undefined} style={{ pointerEvents: "none" }}>
                  <rect
                    x={-(Math.max(4, p.label.length * 0.45))}
                    y={2.2}
                    width={Math.max(8, p.label.length * 0.9)}
                    height={2.2}
                    rx={0.6}
                    fill="rgba(15, 23, 42, 0.9)"
                    stroke={isSelected ? "#38bdf8" : "rgba(255,255,255,0.4)"}
                    strokeWidth={0.25}
                  />
                  <text
                    x={0}
                    y={3.3}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={1.1}
                    fill="#ffffff"
                    fontWeight="800"
                    fontFamily="Inter,sans-serif"
                  >
                    {p.label.length > 13 ? p.label.slice(0, 12) + "…" : p.label}
                  </text>
                </g>
              )}

              {/* Small accent indicator dot when selected */}
              {isSelected && (
                <circle
                  cx={1.2}
                  cy={1.2}
                  r={0.45}
                  fill="#22c55e"
                  stroke="#ffffff"
                  strokeWidth={0.15}
                />
              )}

              {/* Optional position/role label under player */}
              {p.label && (
                <text
                  y={2.8}
                  textAnchor="middle"
                  fontSize={1.0}
                  fontWeight="bold"
                  fill="#38bdf8"
                  stroke="#0f172a"
                  strokeWidth={0.15}
                  transform={isPortrait ? "rotate(-90)" : undefined}
                  style={{ pointerEvents: "none" }}
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Realistic Vector Soccer Ball (Escalado proporcionalmente a los jugadores) */}
        {balls.map((b) => (
          <g key={b.id} transform={`translate(${b.x},${b.y})`}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (activeTool === "eraser") { setBalls((prev) => prev.filter((q) => q.id !== b.id)); return; }
              setDragging({ type: "ball", id: b.id });
              (e.currentTarget.ownerSVGElement as SVGSVGElement)?.setPointerCapture(e.pointerId);
            }}
          >
            {/* Base white sphere */}
            <circle r={1.15} fill="#ffffff" stroke="#0f172a" strokeWidth={0.22} />
            {/* Central Pentagonal Panel */}
            <polygon points="0,-0.4 0.38,-0.12 0.23,0.32 -0.23,0.32 -0.38,-0.12" fill="#0f172a" />
            {/* Seams connecting to outer edge */}
            <line x1="0" y1="-0.4" x2="0" y2="-1.0" stroke="#0f172a" strokeWidth={0.16} />
            <line x1="0.38" y1="-0.12" x2="0.95" y2="-0.3" stroke="#0f172a" strokeWidth={0.16} />
            <line x1="0.23" y1="0.32" x2="0.6" y2="0.8" stroke="#0f172a" strokeWidth={0.16} />
            <line x1="-0.23" y1="0.32" x2="-0.6" y2="0.8" stroke="#0f172a" strokeWidth={0.16} />
            <line x1="-0.38" y1="-0.12" x2="-0.95" y2="-0.3" stroke="#0f172a" strokeWidth={0.16} />
          </g>
        ))}

        {/* Realistic Vector Training Cones (Conos Naranja de Entrenamiento) */}
        {cones.map((c) => (
          <g key={c.id} transform={`translate(${c.x},${c.y})`}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (activeTool === "eraser") { setCones((prev) => prev.filter((q) => q.id !== c.id)); toast.info("Cono eliminado"); return; }
              setDragging({ type: "cone", id: c.id });
              (e.currentTarget.ownerSVGElement as SVGSVGElement)?.setPointerCapture(e.pointerId);
            }}
          >
            <ellipse cx={0} cy={1.1} rx={1.5} ry={0.6} fill="#ea580c" stroke="#0f172a" strokeWidth={0.2} transform={isPortrait ? "rotate(-90)" : undefined} />
            <polygon points="-1.2,1.0 0,-1.8 1.2,1.0" fill="#f97316" stroke="#0f172a" strokeWidth={0.25} transform={isPortrait ? "rotate(-90)" : undefined} />
            <polygon points="-0.55,0.0 0,-0.8 0.55,0.0" fill="#ffffff" opacity={0.9} transform={isPortrait ? "rotate(-90)" : undefined} />
          </g>
        ))}

        {/* Realistic Vector Mini Goals (Arcos Pequeños de Entrenamiento 🥅) */}
        {miniGoals.map((mg) => (
          <g key={mg.id} transform={`translate(${mg.x},${mg.y}) rotate(${mg.rotation || 0})`}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (activeTool === "eraser") { setMiniGoals((prev) => prev.filter((q) => q.id !== mg.id)); toast.info("Mini arco eliminado"); return; }
              setDragging({ type: "minigoal", id: mg.id });
              (e.currentTarget.ownerSVGElement as SVGSVGElement)?.setPointerCapture(e.pointerId);
            }}
          >
            <rect x={-2.4} y={-1.2} width={4.8} height={2.4} fill="rgba(255,255,255,0.25)" stroke="#ffffff" strokeWidth={0.25} rx={0.4} strokeDasharray="0.6,0.6" transform={isPortrait ? "rotate(-90)" : undefined} />
            <circle cx={-2.4} cy={-1.2} r={0.4} fill="#ef4444" stroke="#ffffff" strokeWidth={0.15} transform={isPortrait ? "rotate(-90)" : undefined} />
            <circle cx={2.4} cy={-1.2} r={0.4} fill="#ef4444" stroke="#ffffff" strokeWidth={0.15} transform={isPortrait ? "rotate(-90)" : undefined} />
            <line x1={-2.4} y1={-1.2} x2={2.4} y2={-1.2} stroke="#ffffff" strokeWidth={0.4} transform={isPortrait ? "rotate(-90)" : undefined} />
          </g>
        ))}

        {/* Texts (Etiquetas Tácticas estilizadas y centradas sin salir del borde) */}
        {texts.map((t) => {
          const textWidth = Math.max(10, t.text.length * 0.85 + 2.5);
          return (
            <g key={t.id} transform={`translate(${t.x},${t.y})`}
              style={{ cursor: "grab" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (activeTool === "eraser") { setTexts((prev) => prev.filter((q) => q.id !== t.id)); toast.info("Texto eliminado"); return; }
                setDragging({ type: "text", id: t.id });
                (e.currentTarget.ownerSVGElement as SVGSVGElement)?.setPointerCapture(e.pointerId);
              }}
            >
              <rect
                x={-textWidth / 2}
                y={-1.2}
                width={textWidth}
                height={2.4}
                rx={1.2}
                fill="rgba(15, 23, 42, 0.85)"
                stroke={t.color}
                strokeWidth={0.25}
                transform={isPortrait ? "rotate(-90)" : undefined}
              />
              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={1.0}
                fontWeight="900"
                fill={t.color}
                fontFamily="Inter, sans-serif"
                transform={isPortrait ? "rotate(-90)" : undefined}
                style={{ pointerEvents: "none" }}
              >
                {t.text}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );

  return (
    <div className="flex flex-col w-full h-full bg-[#183b18] text-white overflow-hidden select-none relative">
      {/* ── TOP FLOATING GLASS HUD (HUD Superior Flotante Estilo bCoach & Matchday Board) ───────────────────────── */}
      <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        {/* Left Floating Pill with Mode Selector */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-2xl">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-bold"
              title="Volver"
            >
              ←
            </button>
          )}

          {/* Mode Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white hidden sm:inline">⚽</span>
            <select
              value={boardMode}
              onChange={(e) => {
                const nextMode = e.target.value as "training" | "matchday";
                setBoardMode(nextMode);
                if (nextMode === "matchday") {
                  loadRealMatchConvocatoria();
                } else {
                  toast.info("🏋️ Modo Entrenamiento (Pizarra libre)");
                }
              }}
              className="bg-slate-900 text-emerald-400 font-extrabold text-xs border border-emerald-500/40 rounded-lg px-2 py-0.5 outline-none cursor-pointer"
            >
              <option value="matchday">🏆 Modo Partido (Plan de Juego)</option>
              <option value="training">🏋️ Modo Entrenamiento</option>
            </select>
          </div>

          <span className="text-[10px] font-bold text-slate-300 hidden md:inline truncate max-w-[180px]">
            {boardMode === "matchday" ? `${teamName} vs ${rivalName}` : category}
          </span>
        </div>

        {/* Center: Phase Selector Bar (Solo visible en Modo Partido) */}
        {boardMode === "matchday" && (
          <div className="pointer-events-auto hidden lg:flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-white/20 px-2 py-1 rounded-full shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setActivePhase("ataque");
                loadFormation("4-3-3", "orange");
                toast.success("🟢 Fase: Ataque Organizado (Salida y Llegada)");
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition ${
                activePhase === "ataque" ? "bg-emerald-600 text-white shadow" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              🟢 Ataque
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePhase("defensa");
                loadFormation("4-4-2", "orange");
                toast.success("🔴 Fase: Bloque Defensivo (Repliegue y Coberturas)");
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition ${
                activePhase === "defensa" ? "bg-rose-600 text-white shadow" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              🔴 Defensa
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePhase("transicion");
                toast.success("🔄 Fase: Transición (Presión tras Pérdida / Contraataque)");
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition ${
                activePhase === "transicion" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              🔄 Transición
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePhase("abp");
                toast.success("🎯 Fase: Balón Parado / ABP (Córners y Tiros Libres)");
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition ${
                activePhase === "abp" ? "bg-purple-600 text-white shadow" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              🎯 ABP
            </button>
          </div>
        )}

        {/* Right Floating Quick Tools */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-white/15 px-2 py-1 rounded-full shadow-2xl">
          {/* Modo Camerino / Entretiempo */}
          {boardMode === "matchday" && (
            <button
              type="button"
              onClick={() => setShowCamerinoModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black transition shadow-md"
              title="Ajustes de Entretiempo / Camerino (15 Minutos)"
            >
              <span>⏱️</span>
              <span className="hidden sm:inline">Camerino (15 Min)</span>
            </button>
          )}

          {/* Banco de Pizarras Guardadas */}
          <button
            type="button"
            onClick={() => setModalBancoPizarras(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-[10px] font-bold text-white transition shadow-md shadow-indigo-900/50"
            title="Abrir Banco de Pizarras Guardadas"
          >
            <FolderOpen className="h-3 w-3 text-indigo-200" />
            <span>Banco ({bancoPizarras.length})</span>
          </button>

          {/* Guardar Pizarra Actual */}
          <button
            type="button"
            onClick={() => setModalGuardarPizarra(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-[10px] font-bold text-white transition shadow-md shadow-emerald-900/50"
            title="Guardar Pizarra Actual en el Banco"
          >
            <Save className="h-3 w-3 text-emerald-200" />
            <span className="hidden sm:inline">Guardar</span>
          </button>

          {/* Photo */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-violet-700 text-[10px] font-bold text-slate-200 hover:text-white transition"
            title="Tomar foto del campo"
          >
            <span>📷</span>
            <span className="hidden sm:inline">Foto</span>
          </button>

          {/* Video */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-emerald-700 text-[10px] font-bold text-slate-200 hover:text-white transition"
            title="Cargar video"
          >
            <Video className="h-3 w-3 text-emerald-400" />
            <span className="hidden sm:inline">Video</span>
          </button>

          {/* Formations */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-blue-700 text-[10px] font-bold text-slate-200 hover:text-white transition"
                title="Alineaciones 1-clic"
              >
                <Users className="h-3 w-3 text-blue-400" />
                <span className="hidden sm:inline">Alineaciones</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 bg-slate-950/95 border-slate-800 text-white p-2 rounded-2xl shadow-2xl z-50 space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase px-2 py-0.5 block">Alineaciones Mi Equipo</span>
              {Object.entries(FORMATIONS).map(([key, f]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => loadFormation(key)}
                  className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:bg-blue-600 hover:text-white transition flex justify-between items-center"
                >
                  <span className="font-black text-xs">{key}</span>
                  <span className="text-[9px] opacity-70">{f.label}</span>
                </button>
              ))}

              <div className="h-px bg-white/10 my-1" />
              <span className="text-[9px] font-bold text-red-400 uppercase px-2 py-0.5 block">Equipo Rival (Campo Contrario)</span>
              <button
                type="button"
                onClick={() => loadRivalTeam("4-3-3", "blue")}
                className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition flex justify-between items-center bg-blue-950/40 border border-blue-800/40"
              >
                <span>🔵 Rival 4-3-3 (Azul)</span>
              </button>
              <button
                type="button"
                onClick={() => loadRivalTeam("4-4-2", "red")}
                className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-red-300 hover:bg-red-600 hover:text-white transition flex justify-between items-center bg-red-950/40 border border-red-800/40"
              >
                <span>🔴 Rival 4-4-2 (Rojo)</span>
              </button>
            </PopoverContent>
          </Popover>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
              } else {
                document.exitFullscreen?.();
              }
            }}
            className="p-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-emerald-400 transition"
            title="Pantalla Completa"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

      {/* ── BARRA CONTROLADORA DE ANIMACIÓN Y PASOS TÁCTICOS (FOTOGRAMAS 60FPS) ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-1 bg-slate-950/90 border border-white/20 px-3 py-1 rounded-full shadow-2xl backdrop-blur-lg">
        {/* Guardar Fotograma Paso */}
        <button
          type="button"
          onClick={handleAddKeyframe}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] active:scale-95 transition shadow"
          title="Capturar posición actual como nuevo paso táctico"
        >
          <Sparkles className="h-3 w-3 text-emerald-200" />
          <span>+ Paso ({keyframes.length})</span>
        </button>

        {keyframes.length > 0 && (
          <>
            <div className="w-px h-4 bg-white/20 my-auto mx-1" />

            {/* Prev step */}
            <button
              type="button"
              onClick={() => handleSelectKeyframe(Math.max(0, activeFrameIdx - 1))}
              disabled={activeFrameIdx === 0}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
              title="Paso anterior"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>

            {/* Play/Pause Animation */}
            <button
              type="button"
              onClick={() => setIsPlayingAnimation((prev) => !prev)}
              disabled={keyframes.length < 2}
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-[10px] transition active:scale-95 ${
                isPlayingAnimation ? "bg-rose-600 text-white shadow-lg shadow-rose-900/50 animate-pulse" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50"
              }`}
              title="Reproducir/Pausar animación fluida"
            >
              {isPlayingAnimation ? <Pause className="h-3.5 w-3.5 fill-white" /> : <Play className="h-3.5 w-3.5 fill-white" />}
              <span>{isPlayingAnimation ? "Pausar" : "▶ Animación"}</span>
            </button>

            {/* Next step */}
            <button
              type="button"
              onClick={() => handleSelectKeyframe(Math.min(keyframes.length - 1, activeFrameIdx + 1))}
              disabled={activeFrameIdx === keyframes.length - 1}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
              title="Paso siguiente"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>

            {/* Badges para saltar a pasos */}
            <div className="flex items-center gap-1 ml-1 overflow-x-auto max-w-[240px]">
              {keyframes.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSelectKeyframe(idx)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black transition active:scale-95 ${
                    activeFrameIdx === idx ? "bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  title={`Saltar al Paso ${idx + 1}`}
                >
                  P{idx + 1}
                </button>
              ))}

              {/* Botón para eliminar el paso actual seleccionado */}
              <button
                type="button"
                onClick={handleRemoveActiveKeyframe}
                className="p-1 rounded-full text-red-400 hover:text-red-200 hover:bg-red-950/60 transition active:scale-90 ml-0.5 shrink-0"
                title={`Eliminar Paso ${activeFrameIdx + 1} actual`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}

        {/* Toggle Guardiola Grid */}
        <div className="w-px h-4 bg-white/20 my-auto mx-1" />
        <button
          type="button"
          onClick={() => {
            setShowGuardiolaGrid((prev) => !prev);
            toast.info(showGuardiolaGrid ? "Pasillos tácticos ocultos" : "📐 5 Pasillos tácticos (Guardiola Grid) activados");
          }}
          className={`p-1 rounded-full text-[10px] font-bold transition ${
            showGuardiolaGrid ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
          }`}
          title="Mostrar/Ocultar 5 pasillos tácticos (Guardiola Grid)"
        >
          <Grid className="h-3.5 w-3.5" />
        </button>
      </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          onChange={handleCustomVideoUpload}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          {...({ capture: "environment" } as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={handleCameraCapture}
          className="hidden"
        />
      </div>

      {/* ── 100% CANVAS FIELD AREA (Cancha Verde Edge-to-Edge) ────────────────── */}
      <div
        ref={containerRef}
        className="w-full h-full flex-1 relative bg-[#183b18] overflow-auto flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* HTML5 Video Layer */}
        {activeVideoUrl && (
          <video
            ref={videoRef}
            src={activeVideoUrl}
            onTimeUpdate={handleVideoTimeUpdate}
            onLoadedMetadata={handleVideoTimeUpdate}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
            loop
            playsInline
          />
        )}

        <div
          style={{
            width: `${zoom * 100}%`,
            height: `${zoom * 100}%`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 10,
            transition: isDrawing || dragging ? "none" : "width 0.1s ease-out, height 0.1s ease-out",
          }}
        >
          {svgElement}
        </div>

        {/* Zoom indicator */}
        {zoom !== 1 && (
          <div className="absolute bottom-20 right-3 bg-black/80 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700 pointer-events-none z-20">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>

      {/* ── BOTTOM DOCK: Compact 1-row on mobile, expanded on tablet/desktop ─── */}
      {!isDockMinimized && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-full px-3 flex justify-center">

          {/* ── TABLET / DESKTOP: Full 2-row expanded dock (sm and up) ── */}
          <div className="hidden sm:flex bg-slate-950/85 backdrop-blur-lg border border-white/15 p-2 rounded-2xl shadow-2xl text-white flex-col items-center gap-1.5 max-w-[95vw]">
            {/* ROW 1: TOOLS + COLORS + THICKNESS */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* Tools */}
              <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <button type="button" onClick={() => { setActiveTool("select"); toast.info("👆 Modo Mover activo."); }} className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${activeTool === "select" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"}`}>
                  <Hand className="h-3.5 w-3.5" /> <span>Mover</span>
                </button>
                <button type="button" onClick={() => { setActiveTool("draw-solid"); setStrokeType("solid"); }} className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${activeTool === "draw-solid" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  <Pencil className="h-3.5 w-3.5" /> <span>Lápiz</span>
                </button>
                <button type="button" onClick={() => { setActiveTool("draw-dashed"); setStrokeType("dashed"); }} className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${activeTool === "draw-dashed" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  <span className="font-mono text-emerald-400">┊</span> <span>Pase</span>
                </button>
                <button type="button" onClick={() => { setActiveTool("draw-arrow"); setStrokeType("arrow"); }} className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${activeTool === "draw-arrow" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  <ArrowRight className="h-3.5 w-3.5 text-amber-400" /> <span>Tiro</span>
                </button>
                <button type="button" onClick={() => { setActiveTool("draw-zone"); setStrokeType("zone"); }} className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${activeTool === "draw-zone" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  <Square className="h-3.5 w-3.5 text-orange-400" /> <span>Zona</span>
                </button>
                <button type="button" onClick={() => setActiveTool("eraser")} className={`p-1.5 rounded-lg transition ${activeTool === "eraser" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Colors */}
              <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1.5 rounded-xl border border-slate-800">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)} className={`rounded-full border transition-transform ${color === c ? "scale-125 border-white ring-2 ring-emerald-400" : "border-transparent opacity-75 hover:opacity-100"}`} style={{ backgroundColor: c, width: 16, height: 16 }} />
                ))}
              </div>
              {/* Thickness */}
              <div className="flex items-center gap-0.5 bg-slate-900/90 px-1 py-1 rounded-xl border border-slate-800">
                {([["Fina", 0.4, "≤0.5"], ["Media", 0.8, "0.5-1"], ["Gruesa", 1.6, ">1"]] as [string, number, string][]).map(([label, val]) => (
                  <button key={label} type="button" onClick={() => setStrokeW(val)}
                    className={`h-6 px-1.5 rounded text-[9px] font-bold border transition ${
                      (label === "Fina" && strokeW <= 0.5) || (label === "Media" && strokeW > 0.5 && strokeW <= 1.0) || (label === "Gruesa" && strokeW > 1.0)
                        ? "bg-emerald-600 text-white border-emerald-400" : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}>{label}</button>
                ))}
              </div>
            </div>
            {/* ROW 2: PLAYERS + ZOOM + ACTIONS */}
            <div className="flex items-center gap-1.5 justify-between w-full pt-0.5 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setActiveTool("add-player")} className={`h-7 px-2 rounded-lg text-xs font-bold flex items-center gap-1 ${activeTool === "add-player" ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-300 border border-slate-800"}`}>
                  <User className="h-3 w-3 text-amber-400" /><span>+#{currentNextNum}</span>
                </button>
                {/* Selector directo de color de equipo (directo en la barra sin popover propenso a errores en touch) */}
                <div className="flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded-lg border border-slate-800">
                  {Object.entries(TEAM_COLORS_MAP).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setTeamColor(key as PlayerTeamColor);
                        setActiveTool("add-player");
                        toast.success(`Equipo activo: ${item.label}`);
                      }}
                      className={`w-5 h-5 rounded-full border border-white/60 transition-transform active:scale-90 flex items-center justify-center ${
                        teamColor === key ? "scale-125 border-white ring-2 ring-emerald-400 shadow-md" : "opacity-75 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: item.bg }}
                      title={`Equipo ${item.label}`}
                    >
                      {teamColor === key && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => { setBalls((prev) => [...prev, { id: `ball-${Date.now()}`, x: 50, y: 32.5 }]); toast.success("⚽ Balón colocado."); }} className="h-7 px-2 rounded-lg text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800">⚽</button>
                <button type="button" onClick={() => { setCones((prev) => [...prev, { id: `cone-${Date.now()}`, x: 50, y: 32.5 }]); toast.success("🟧 Cono colocado."); }} className="h-7 px-2 rounded-lg text-xs font-bold bg-slate-900 text-orange-400 border border-slate-800 flex items-center gap-1 active:scale-95 transition" title="Colocar cono de entrenamiento">🔺<span className="hidden md:inline text-[10px]">Cono</span></button>
                <button type="button" onClick={() => setActiveTool("add-text")} className={`h-7 px-2 rounded-lg text-xs font-bold flex items-center ${activeTool === "add-text" ? "bg-violet-600 text-white" : "bg-slate-900 text-slate-300 border border-slate-800"}`}><TextIcon className="h-3 w-3 text-violet-400" /></button>
              </div>
              <div className="flex items-center gap-0.5 bg-slate-900/90 px-1 py-0.5 rounded-lg border border-slate-800">
                <button type="button" onClick={() => setZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))))} className="p-1 text-slate-300 hover:text-white"><ZoomIn className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))} className="p-1 text-slate-300 hover:text-white"><ZoomOut className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={resetView} className="p-1 text-slate-400 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={handleUndo} disabled={paths.length === 0 && zones.length === 0} className="p-1 text-amber-400 hover:text-amber-200 disabled:opacity-30 text-xs font-bold">↩</button>
                <button type="button" onClick={handleClear} className="p-1 text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setIsDockMinimized(true)} className="p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg ml-1"><Eye className="h-3.5 w-3.5 text-slate-300" /></button>
              </div>
            </div>
          </div>

          {/* ── MOBILE (< sm): Compact 1-row pill bar ── */}
          <div className="flex sm:hidden items-center gap-1.5 bg-slate-950/95 backdrop-blur-lg border border-white/15 px-2 py-1.5 rounded-2xl shadow-2xl overflow-x-auto max-w-[98vw]">

            {/* Active tool indicator + tool quick-switch pills */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 shrink-0">
              {/* Mover (Hand / Pointer) */}
              <button
                type="button"
                onClick={() => { setActiveTool("select"); toast.info("👆 Modo Mover: toca y arrastra los jugadores libremente."); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${activeTool === "select" ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-900/50" : "text-slate-400"}`}
                title="Modo Mover (arrastrar objetos sin crear nuevos)"
              >
                <Hand className="h-5 w-5" />
              </button>
              {/* Lápiz */}
              <button
                type="button"
                onClick={() => { setActiveTool("draw-solid"); setStrokeType("solid"); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${activeTool === "draw-solid" ? "bg-blue-600 text-white shadow-md shadow-blue-900/50" : "text-slate-400"}`}
                title="Lápiz"
              >
                <Pencil className="h-5 w-5" />
              </button>
              {/* Pase */}
              <button
                type="button"
                onClick={() => { setActiveTool("draw-dashed"); setStrokeType("dashed"); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${activeTool === "draw-dashed" ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50" : "text-slate-400"}`}
                title="Pase"
              >
                <span className="font-mono text-lg font-black leading-none">┊</span>
              </button>
              {/* Tiro */}
              <button
                type="button"
                onClick={() => { setActiveTool("draw-arrow"); setStrokeType("arrow"); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${activeTool === "draw-arrow" ? "bg-amber-600 text-white shadow-md shadow-amber-900/50" : "text-slate-400"}`}
                title="Tiro con flecha"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              {/* Zona */}
              <button
                type="button"
                onClick={() => { setActiveTool("draw-zone"); setStrokeType("zone"); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${activeTool === "draw-zone" ? "bg-orange-600 text-white shadow-md shadow-orange-900/50" : "text-slate-400"}`}
                title="Zona Sombreada"
              >
                <Square className="h-5 w-5" />
              </button>
              {/* Jugador */}
              <button
                type="button"
                onClick={() => setActiveTool("add-player")}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${activeTool === "add-player" ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/50" : "text-slate-400"}`}
                title={`Añadir jugador #${currentNextNum}`}
              >
                <User className="h-5 w-5" />
              </button>
              {/* Borrador + Opciones de Limpieza */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${activeTool === "eraser" ? "bg-red-600 text-white shadow-md shadow-red-900/50" : "text-slate-400"}`}
                    title="Borrador u Opciones de Limpieza"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-56 p-2 bg-slate-950 border border-slate-800 text-white rounded-2xl shadow-2xl space-y-1 z-[99999]">
                  <button
                    type="button"
                    onClick={() => { handleClear(); toast.success("🧹 Cancha limpiada por completo."); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white transition active:scale-95"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    <span>🧹 Borrar Todo (Limpiar)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTool("eraser"); toast.info("🧽 Toca un objeto para borrarlo."); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 font-semibold text-xs text-slate-300 transition active:scale-95"
                  >
                    <Pencil className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>🧽 Borrador Individual</span>
                  </button>
                </PopoverContent>
              </Popover>

              {/* Botón directo de Limpiar Cancha en 1 tap */}
              <button
                type="button"
                onClick={() => setModalConfirmClear(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-950/80 border border-red-800/80 text-red-400 font-bold active:scale-90 transition-all shrink-0"
                title="Limpiar toda la cancha en 1 tap"
              >
                🧹
              </button>
            </div>

            {/* Team color cycle button — cicla entre colores de equipo en 1 toque */}
            <button
              type="button"
              onClick={() => {
                const keys = Object.keys(TEAM_COLORS_MAP) as PlayerTeamColor[];
                const nextIdx = (keys.indexOf(teamColor) + 1) % keys.length;
                const nextColor = keys[nextIdx];
                setTeamColor(nextColor);
                setActiveTool("add-player");
                toast.success(`Equipo: ${TEAM_COLORS_MAP[nextColor].label}`);
              }}
              className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl bg-slate-900/80 border-2 active:scale-90 transition-all shrink-0"
              style={{ borderColor: TEAM_COLORS_MAP[teamColor].bg + "99" }}
              title="Cambiar color de equipo (toca para ciclar)"
            >
              <span
                className="w-5 h-5 rounded-full border-2 border-white/70 shadow-md"
                style={{ backgroundColor: TEAM_COLORS_MAP[teamColor].bg }}
              />
              <span className="text-[8px] font-bold text-slate-400 leading-none">
                {TEAM_COLORS_MAP[teamColor].label.split(" ")[0]}
              </span>
            </button>

            {/* More → opens bottom sheet */}
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              className="w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 bg-slate-900/80 border border-slate-800 shrink-0 active:scale-90 transition-all"
              title="Más herramientas"
            >
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="w-1 h-1 rounded-full bg-slate-300" />
            </button>

            {/* Minimize */}
            <button
              type="button"
              onClick={() => setIsDockMinimized(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900/80 border border-slate-800 shrink-0 active:scale-90 transition-all text-slate-400"
              title="Ocultar barra"
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating restore pill when minimized */}
      {isDockMinimized && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsDockMinimized(false)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-950/90 border border-white/20 text-white font-bold text-sm shadow-2xl backdrop-blur-md active:scale-95 transition-all"
          >
            <Pencil className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Herramientas</span>
          </button>
        </div>
      )}

      {/* ── MOBILE BOTTOM SHEET (drawer) — portado encima de todo ── */}
      {isSheetOpen && (
        <>
          {/* Backdrop: cierra el sheet al tocar fuera */}
          <div
            className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
            onPointerDown={() => setIsSheetOpen(false)}
          />
          {/* Sheet panel */}
          <div
            className="absolute bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-white/15 rounded-t-3xl shadow-2xl pt-2 pb-6 px-4 animate-slide-up"
            onTouchStart={(e) => { sheetTouchStartY.current = e.touches[0].clientY; }}
            onTouchEnd={(e) => {
              if (sheetTouchStartY.current !== null) {
                const delta = e.changedTouches[0].clientY - sheetTouchStartY.current;
                if (delta > 60) setIsSheetOpen(false);
                sheetTouchStartY.current = null;
              }
            }}
          >
            {/* Handle bar visual */}
            <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto mb-4" />

            {/* SECTION: Colores de trazo */}
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Color del trazo</p>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setColor(c); }}
                  className={`w-9 h-9 rounded-full border-2 transition-all active:scale-90 ${color === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-70"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* SECTION: Grosor */}
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Grosor de línea</p>
            <div className="flex gap-2 mb-4">
              {([["Fina", 0.4], ["Media", 0.8], ["Gruesa", 1.6]] as [string, number][]).map(([label, val]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStrokeW(val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition active:scale-95 ${
                    (label === "Fina" && strokeW <= 0.5) || (label === "Media" && strokeW > 0.5 && strokeW <= 1.0) || (label === "Gruesa" && strokeW > 1.0)
                      ? "bg-emerald-600 text-white border-emerald-400" : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >{label}</button>
              ))}
            </div>

            {/* SECTION: Color de equipo para jugadores */}
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Color del equipo</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {Object.entries(TEAM_COLORS_MAP).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTeamColor(key as PlayerTeamColor);
                    setActiveTool("add-player");
                    setIsSheetOpen(false);
                    toast.success(`✅ Equipo ${item.label} — toca la cancha para añadir jugadores`);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition active:scale-95 ${teamColor === key ? "text-white shadow-lg scale-105" : "border-slate-800 text-slate-400"}`}
                  style={{
                    borderColor: teamColor === key ? item.bg : undefined,
                    backgroundColor: teamColor === key ? item.bg + "44" : undefined,
                  }}
                >
                  <span className="w-5 h-5 rounded-full border-2 border-white/60 shadow shrink-0" style={{ backgroundColor: item.bg }} />
                  <span>{item.label}</span>
                  {teamColor === key && <span className="ml-auto text-white text-base leading-none">✓</span>}
                </button>
              ))}
            </div>

            {/* SECTION: Acciones */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setBalls((prev) => [...prev, { id: `ball-${Date.now()}`, x: 50, y: 32.5 }]); toast.success("⚽ Balón colocado."); setIsSheetOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-slate-300 active:scale-95"
              >
                ⚽ <span>Balón</span>
              </button>
              <button
                type="button"
                onClick={() => { setCones((prev) => [...prev, { id: `cone-${Date.now()}`, x: 50, y: 32.5 }]); toast.success("🟧 Cono colocado."); setIsSheetOpen(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-orange-400 active:scale-95"
              >
                🔺 <span>Cono</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTool("add-text"); setIsSheetOpen(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-xl text-sm font-bold active:scale-95 ${activeTool === "add-text" ? "bg-violet-700 border-violet-500 text-white" : "bg-slate-900 border-slate-800 text-slate-300"}`}
              >
                <TextIcon className="h-4 w-4" /><span>Texto</span>
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={paths.length === 0 && zones.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-amber-400 disabled:opacity-30 active:scale-95"
              >
                ↩ <span>Deshacer</span>
              </button>
              <button
                type="button"
                onClick={() => { setModalConfirmClear(true); setIsSheetOpen(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 border border-red-900/60 rounded-xl text-sm font-bold text-red-400 active:scale-95"
              >
                <Trash2 className="h-4 w-4" /><span>Limpiar</span>
              </button>
            </div>

            {/* Zoom row */}
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => setZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))))} className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-slate-300 active:scale-95">
                <ZoomIn className="h-4 w-4" /><span>Zoom +</span>
              </button>
              <button type="button" onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))} className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-slate-300 active:scale-95">
                <ZoomOut className="h-4 w-4" /><span>Zoom -</span>
              </button>
              <button type="button" onClick={resetView} className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-slate-400 active:scale-95">
                <RotateCcw className="h-4 w-4" /><span>Reset</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL CONFIRMAR LIMPIAR CANCHA (Diseño Premium Dark Glassmorphism) */}
      {modalConfirmClear && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-xs sm:max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 shadow-inner">
              <Trash2 className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black text-lg text-white">¿Limpiar la Cancha?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Se eliminarán todos los jugadores, líneas trazadas, zonas y objetos colocados en la pizarra actual.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalConfirmClear(false)}
                className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-bold h-10 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleClear();
                  setModalConfirmClear(false);
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs h-10 rounded-xl shadow-lg shadow-red-900/40"
              >
                🧹 Sí, Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL GUARDAR PIZARRA EN EL BANCO */}
      {modalGuardarPizarra && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base flex items-center gap-2 text-white">
                <Save className="h-5 w-5 text-emerald-400" /> Guardar Pizarra en Banco
              </h3>
              <button type="button" onClick={() => setModalGuardarPizarra(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">Nombre del Ejercicio / Pizarra</label>
                <Input
                  value={nombrePizarraInput}
                  onChange={(e) => setNombrePizarraInput(e.target.value)}
                  placeholder="Ej: Juego de Posición 5v4 (3 Zonas)"
                  className="bg-slate-950 border-slate-800 text-white text-xs h-10 rounded-xl"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1">Categoría / Tipo</label>
                <select
                  value={categoriaPizarraInput}
                  onChange={(e) => setCategoriaPizarraInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs h-10 rounded-xl px-3 outline-none"
                >
                  <option value="Posición & Presión">Posición & Presión</option>
                  <option value="Salida & Construcción">Salida & Construcción</option>
                  <option value="Ataque Organizado">Ataque Organizado</option>
                  <option value="Transición Defensiva">Transición Defensiva</option>
                  <option value="Balón Parado">Balón Parado</option>
                  <option value="Entrenamiento General">Entrenamiento General</option>
                </select>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Elementos a guardar:</p>
                <p>• {players.length} Jugadores colocados</p>
                <p>• {zones.length} Zonas sombreadas</p>
                <p>• {paths.length} Trazos y flechas</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalGuardarPizarra(false)}
                className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-bold h-10 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleGuardarPizarraEnBanco}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-10 rounded-xl shadow-lg shadow-emerald-900/40"
              >
                💾 Guardar Pizarra
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BANCO / BIBLIOTECA DE PIZARRAS */}
      {modalBancoPizarras && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="font-black text-base flex items-center gap-2 text-white">
                  <FolderOpen className="h-5 w-5 text-indigo-400" /> Banco de Pizarras Guardadas
                </h3>
                <p className="text-xs text-slate-400">Guarda ejercicios tácticos para volver a cargarlos en la cancha con 1 toque.</p>
              </div>
              <button type="button" onClick={() => setModalBancoPizarras(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
              {bancoPizarras.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-950 rounded-2xl border border-dashed border-slate-800">
                  🗄️ No tienes pizarras guardadas en el banco aún. Diseña un ejercicio en la cancha y presiona <strong>Guardar</strong>.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bancoPizarras.map((p) => {
                    const isOfficial = p.id.startsWith("preset-");
                    return (
                      <div key={p.id} className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-indigo-500/50 transition flex flex-col justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isOfficial ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"}`}>
                              {isOfficial ? "OFICIAL DE LA ACADEMIA" : p.categoria || "Guardada"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{p.fecha}</span>
                          </div>
                          <h4 className="font-bold text-sm text-white line-clamp-1">{p.nombre}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                            <span>👤 {p.players?.length || 0} Jugadores</span>
                            <span>• 🟧 {p.zones?.length || 0} Zonas</span>
                            <span>• ✏️ {p.paths?.length || 0} Trazos</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                          <Button
                            type="button"
                            onClick={() => handleCargarPizarraDesdeBanco(p)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-8 rounded-xl gap-1"
                          >
                            <Play className="h-3.5 w-3.5" /> Cargar en Cancha
                          </Button>
                          {!isOfficial && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditarPizarraEnBanco(p)}
                                className="bg-slate-900 border-slate-800 text-amber-400 hover:bg-amber-950 hover:border-amber-800 h-8 w-8 p-0 rounded-xl shrink-0"
                                title="Editar nombre del ejercicio"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEliminarPizarraDeBanco(p.id, p.nombre)}
                                className="bg-slate-900 border-slate-800 text-red-400 hover:bg-red-950 hover:border-red-800 h-8 w-8 p-0 rounded-xl shrink-0"
                                title="Eliminar del banco"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── MODAL CAMERINO / ENTRETIEMPO (15 MINUTOS) ────────────────── */}
      {showCamerinoModal && (
        <div className="fixed inset-0 z-[10005] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-2xl w-full text-white shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  ⏱️
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Modo Entretiempo / Camerino (15 Min)</h3>
                  <p className="text-xs text-amber-400 font-semibold">{teamName} vs {rivalName} · Ajustes Tácticos al Descanso</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCamerinoModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Panel 1: Sustituciones en Vivo */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>🔄 Sustituciones de Jugadores</span>
                  <span className="text-[10px] text-emerald-400 font-mono">5 Disponibles</span>
                </h4>

                <p className="text-[11px] text-slate-400">Selecciona un titular en cancha para sustituirlo con un suplente convocado:</p>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {[
                    { id: "sup1", nombre: "Sebastián Araya Mora", numero: "10", posicion: "MED" },
                    { id: "sup2", nombre: "Ángel Rojas Céspedes", numero: "11", posicion: "DEL" },
                    { id: "sup3", nombre: "Brayan Sánchez Vega", numero: "14", posicion: "DEL" },
                    { id: "sup4", nombre: "Cristian Porras Mora", numero: "15", posicion: "DEF" },
                    { id: "sup5", nombre: "Diego Ramírez Campos", numero: "16", posicion: "DEL" },
                  ].map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-xl hover:border-amber-500/50 transition cursor-pointer"
                      onClick={() => {
                        const newSub = {
                          id: `sub-${Date.now()}`,
                          outName: "Andrés Soto (#2)",
                          inName: `${s.nombre} (#${s.numero})`,
                          min: "45'",
                        };
                        setSubstitutionsList((prev) => [newSub, ...prev]);
                        toast.success(`🔄 Sustitución registrada: Entra ${s.nombre} por Andrés Soto (Min 45')`);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                          {s.numero}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">{s.nombre}</p>
                          <p className="text-[10px] text-slate-400">{s.posicion} · Suplente Convocado</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        + Entrar
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 2: Registro de Ajustes & Compartir */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    📋 Cambios Realizados en el Descanso
                  </h4>
                  {substitutionsList.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      Sin cambios realizados en el entretiempo. Tocá un suplente a la izquierda para sustituir.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {substitutionsList.map((sub) => (
                        <div key={sub.id} className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs flex items-center justify-between">
                          <span className="font-bold text-emerald-300">🟢 {sub.inName}</span>
                          <span className="text-[10px] text-slate-400">por {sub.outName} ({sub.min})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <Button
                    type="button"
                    onClick={() => {
                      const text = `🏆 PLAN DE JUEGO & CAMERINO — ${teamName} vs ${rivalName}\n\n- Esquema 2º Tiempo: 4-3-3 Ajustado\n- Sustituciones: ${substitutionsList.map(s => `${s.inName} por ${s.outName}`).join(", ") || "Sin cambios"}\n- Instrucción Clave: Presión alta en pasillo central.`;
                      navigator.clipboard.writeText(text);
                      toast.success("📲 Ajuste del entretiempo copiado. ¡Listo para enviar por WhatsApp al cuerpo técnico!");
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 rounded-xl"
                  >
                    <span>📲 Compartir Ajustes por WhatsApp / Email</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCamerinoModal(false)}
                    className="w-full border-slate-800 text-slate-300 hover:bg-slate-800 text-xs font-semibold rounded-xl"
                  >
                    Volver a la Cancha
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CanchaBCoachBoard;
