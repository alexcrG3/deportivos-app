// ─── CANCHA BCOACH TACTICAL BOARD SUITE (VIDEO ANALYSIS & 2D PITCH) ───────────
// Pizarra táctica interactiva estilo bCoach idéntica a la app profesional.
// • Modo Cancha Verde 2D y Modo Análisis de Video / Imagen Táctica en Vivo.
// • Reproductor de video con pausa para dibujo sobre congelado de jugadas reales.
// • Herramienta de Zonas Sombreadas de Espacio (resaltado transparente en naranja/amarillo).
// • Menú emergente de acción "+" (Alineaciones, Video/Imagen, Cambiar Campo, Guardar).
// • Orientación responsiva (Landscape en PC/Tablet, Portrait 90° en móvil).
// • Pinch-to-zoom y pan con dos dedos.

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Pencil, RotateCcw, Trash2, Maximize2, User, Users, Plus, Play, Pause,
  Video, Image as ImageIcon, ChevronDown, Type as TextIcon, ZoomIn, ZoomOut,
  FolderOpen, Shield, HelpCircle, Layers, ArrowRight, Square, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SportFieldInner } from "@/components/sport-field";
import { toast } from "sonner";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ToolMode = "draw-solid" | "draw-dashed" | "draw-arrow" | "draw-zone" | "eraser" | "add-player" | "add-item" | "add-text";
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

interface BoardText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

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
  teamName = "Equipo",
  category = "Sub-9",
  onClose,
}: {
  teamName?: string;
  category?: string;
  onClose?: () => void;
}) {
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
  const [texts, setTexts] = useState<BoardText[]>([]);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [livePts, setLivePts] = useState<{ x: number; y: number }[]>([]);
  const [zoneStart, setZoneStart] = useState<{ x: number; y: number } | null>(null);
  const [zoneCurrent, setZoneCurrent] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState<{ type: "player" | "ball" | "text" | "zone"; id: string } | null>(null);

  const [nextNum, setNextNum] = useState(1);
  const [teamColor, setTeamColor] = useState<PlayerTeamColor>("orange");

  // Zoom + pan
  const [zoom, setZoom] = useState(1);
  const [isDockMinimized, setIsDockMinimized] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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

    if (activeTool === "add-player") {
      const p: BoardPlayer = { id: `pl-${Date.now()}`, number: String(nextNum), color: teamColor, x, y };
      setPlayers((prev) => [...prev, p]);
      setNextNum((n) => (n >= 11 ? 1 : n + 1));
      return;
    }

    if (activeTool === "add-item") {
      setBalls((prev) => [...prev, { id: `ball-${Date.now()}`, x, y }]);
      toast.success("⚽ Balón colocado");
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
  }, [activeTool, color, nextNum, teamColor, getSVGCoords]);

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
    setPaths([]); setZones([]); setPlayers([]); setBalls([]); setTexts([]);
    setBackgroundImageUrl(null);
    setActiveVideoUrl(null);
    toast.info("🧹 Pizarra limpiada");
  };

  const handleUndo = () => {
    if (paths.length > 0) {
      setPaths((p) => p.slice(0, -1));
    } else if (zones.length > 0) {
      setZones((z) => z.slice(0, -1));
    }
    toast.info("↩️ ÚLtimo elemento borrado");
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

        {/* Saved paths */}
        {paths.map((p) => (
          <path key={p.id} d={pointsToD(p.points)} fill="none" stroke={p.color} strokeWidth={p.width}
            strokeDasharray={p.style === "dashed" ? "3,2" : undefined}
            strokeLinecap="round" strokeLinejoin="round"
            markerEnd={p.style === "arrow" ? "url(#bcoach-arrow)" : undefined}
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
          return (
            <g key={p.id} transform={`translate(${p.x},${p.y})`}
              style={{ cursor: "grab" }}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (activeTool === "eraser") { setPlayers((prev) => prev.filter((q) => q.id !== p.id)); return; }
                if (activeTool === "add-player") {
                  setPlayers((prev) => prev.map((q) => q.id === p.id ? { ...q, color: teamColor } : q));
                  toast.success(`Jugador #${p.number} cambiado a equipo ${TEAM_COLORS_MAP[teamColor].label}`);
                  return;
                }
                setDragging({ type: "player", id: p.id });
                (e.currentTarget.ownerSVGElement as SVGSVGElement)?.setPointerCapture(e.pointerId);
              }}
            >
              <circle r={1.6} fill={teamMeta.bg} stroke="#ffffff" strokeWidth={0.35} />
              <text textAnchor="middle" dominantBaseline="central" fontSize={1.4}
                fill={teamMeta.text} fontWeight="900" fontFamily="Inter,sans-serif"
                transform={isPortrait ? "rotate(-90)" : undefined}
                style={{ pointerEvents: "none" }}>
                {p.number}
              </text>
            </g>
          );
        })}

        {/* Realistic Vector Soccer Ball */}
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
            <circle r={2.2} fill="#ffffff" stroke="#0f172a" strokeWidth={0.35} />
            {/* Central Pentagonal Panel */}
            <polygon points="0,-0.8 0.76,-0.25 0.47,0.65 -0.47,0.65 -0.76,-0.25" fill="#0f172a" />
            {/* Seams connecting to outer edge */}
            <line x1="0" y1="-0.8" x2="0" y2="-2.1" stroke="#0f172a" strokeWidth={0.3} />
            <line x1="0.76" y1="-0.25" x2="2.0" y2="-0.6" stroke="#0f172a" strokeWidth={0.3} />
            <line x1="0.47" y1="0.65" x2="1.3" y2="1.7" stroke="#0f172a" strokeWidth={0.3} />
            <line x1="-0.47" y1="0.65" x2="-1.3" y2="1.7" stroke="#0f172a" strokeWidth={0.3} />
            <line x1="-0.76" y1="-0.25" x2="-2.0" y2="-0.6" stroke="#0f172a" strokeWidth={0.3} />
            {/* Outer edge black patches */}
            <polygon points="-0.6,-1.9 0,-2.1 0.6,-1.9 0.3,-1.4 -0.3,-1.4" fill="#0f172a" />
            <polygon points="1.8,-0.2 2.0,-0.6 1.6,-1.2 1.2,-0.9 1.4,-0.3" fill="#0f172a" />
            <polygon points="1.1,1.5 1.3,1.7 0.7,2.0 0.4,1.4 0.9,1.1" fill="#0f172a" />
            <polygon points="-1.1,1.5 -1.3,1.7 -0.7,2.0 -0.4,1.4 -0.9,1.1" fill="#0f172a" />
            <polygon points="-1.8,-0.2 -2.0,-0.6 -1.6,-1.2 -1.2,-0.9 -1.4,-0.3" fill="#0f172a" />
          </g>
        ))}

        {/* Texts */}
        {texts.map((t) => (
          <g key={t.id} transform={`translate(${t.x},${t.y})`}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (activeTool === "eraser") { setTexts((prev) => prev.filter((q) => q.id !== t.id)); return; }
              setDragging({ type: "text", id: t.id });
              (e.currentTarget.ownerSVGElement as SVGSVGElement)?.setPointerCapture(e.pointerId);
            }}
          >
            <rect x={-0.5} y={-2} width={t.text.length * 1.15 + 1} height={3.2}
              fill="rgba(15,23,42,0.85)" rx={0.6} stroke={t.color} strokeWidth={0.2}
              transform={isPortrait ? "rotate(-90)" : undefined} />
            <text fontSize={1.8} fontWeight="900" fill={t.color}
              fontFamily="Inter,sans-serif" dominantBaseline="central"
              transform={isPortrait ? "rotate(-90)" : undefined}
              style={{ pointerEvents: "none" }}>
              {t.text}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );

  return (
    <div className="flex flex-col w-full h-full bg-[#183b18] text-white overflow-hidden select-none relative">
      {/* ── TOP FLOATING GLASS HUD (HUD Superior Flotante Estilo bCoach) ───────────────────────── */}
      <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none gap-2">
        {/* Left Floating Pill */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full shadow-2xl">
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
          <h3 className="text-xs font-black text-white flex items-center gap-1.5">
            <span>🎨 Pizarra Táctica</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {activeVideoUrl ? "📹 Video" : "⚽ 2D"}
            </span>
          </h3>
        </div>

        {/* Right Floating Quick Tools */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-white/15 px-2 py-1 rounded-full shadow-2xl">
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
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setActiveTool("add-player")} className={`h-7 px-2 rounded-lg text-xs font-bold flex items-center gap-1 ${activeTool === "add-player" ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-slate-300 border border-slate-800"}`}>
                  <User className="h-3 w-3 text-amber-400" /><span>+#{nextNum}</span>
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="h-7 px-2 rounded-lg text-xs font-bold flex items-center gap-1 bg-slate-900 text-white border border-slate-700">
                      <span className="h-3 w-3 rounded-full border border-white/60" style={{ backgroundColor: TEAM_COLORS_MAP[teamColor].bg }} />
                      <span className="text-[10px]">{TEAM_COLORS_MAP[teamColor].label.split(" ")[0]}</span>
                      <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 bg-slate-950/95 border-slate-800 text-white p-1.5 rounded-xl shadow-2xl z-50 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase px-2 py-0.5 block">Color del Equipo</span>
                    {Object.entries(TEAM_COLORS_MAP).map(([key, item]) => (
                      <button key={key} type="button" onClick={() => { setTeamColor(key as PlayerTeamColor); setActiveTool("add-player"); }} className={`w-full text-left px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-2 ${teamColor === key ? "bg-slate-800 text-white ring-1 ring-emerald-400" : "text-slate-300 hover:bg-slate-800"}`}>
                        <span className="h-3.5 w-3.5 rounded-full border border-white/50" style={{ backgroundColor: item.bg }} /><span>{item.label}</span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
                <button type="button" onClick={() => { setBalls((prev) => [...prev, { id: `ball-${Date.now()}`, x: 50, y: 32.5 }]); toast.success("⚽ Balón colocado."); }} className="h-7 px-2 rounded-lg text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800">⚽</button>
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
          <div className="flex sm:hidden items-center gap-1.5 bg-slate-950/90 backdrop-blur-lg border border-white/15 px-2 py-1.5 rounded-2xl shadow-2xl">

            {/* Active tool indicator + tool quick-switch pills */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
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
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${activeTool === "add-player" ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-900/50" : "text-slate-400"}`}
                title={`Añadir jugador #${nextNum}`}
              >
                <User className="h-5 w-5" />
              </button>
              {/* Borrador */}
              <button
                type="button"
                onClick={() => setActiveTool("eraser")}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${activeTool === "eraser" ? "bg-red-600 text-white shadow-md shadow-red-900/50" : "text-slate-400"}`}
                title="Borrador"
              >
                <Trash2 className="h-5 w-5" />
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
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Acciones</p>
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
                onClick={() => { handleClear(); setIsSheetOpen(false); }}
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
    </div>
  );
}

export default CanchaBCoachBoard;
