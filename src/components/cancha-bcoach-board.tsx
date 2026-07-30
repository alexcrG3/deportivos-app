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

interface BoardPlayer {
  id: string;
  number: string;
  color: "orange" | "blue";
  x: number;
  y: number;
}

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
  const [teamColor, setTeamColor] = useState<"orange" | "blue">("orange");

  // Zoom + pan
  const [zoom, setZoom] = useState(1);
  const lastPinchDist = useRef<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // SVG coordinate transformation
  const getSVGCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!svgRef.current) return { x: 50, y: 32.5 };
    const rect = svgRef.current.getBoundingClientRect();
    const rx = (clientX - rect.left) / rect.width;
    const ry = (clientY - rect.top) / rect.height;
    return {
      x: Math.max(0, Math.min(VW, rx * VW)),
      y: Math.max(0, Math.min(VH, ry * VH)),
    };
  }, []);

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

  const loadFormation = useCallback((key: string) => {
    const f = FORMATIONS[key];
    if (!f) return;
    setPlayers(
      f.pts.map((c, i) => ({ id: `fp-${i}-${Date.now()}`, number: c.n, color: "orange" as const, x: c.x, y: c.y }))
    );
    toast.success(`👥 ${f.label} desplegada`);
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
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        touchAction: "none",
        display: "block",
        width: "100%",
        height: "100%",
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
      {players.map((p) => (
        <g key={p.id} transform={`translate(${p.x},${p.y})`}
          style={{ cursor: "grab" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (activeTool === "eraser") { setPlayers((prev) => prev.filter((q) => q.id !== p.id)); return; }
            setDragging({ type: "player", id: p.id });
            (e.currentTarget.ownerSVGElement as SVGSVGElement)?.setPointerCapture(e.pointerId);
          }}
        >
          <circle r={1.6} fill={p.color === "orange" ? "#f97316" : "#2563eb"} stroke="#ffffff" strokeWidth={0.3} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={1.4}
            fill="#ffffff" fontWeight="900" fontFamily="Inter,sans-serif" style={{ pointerEvents: "none" }}>
            {p.number}
          </text>
        </g>
      ))}

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
            fill="rgba(15,23,42,0.85)" rx={0.6} stroke={t.color} strokeWidth={0.2} />
          <text fontSize={1.8} fontWeight="900" fill={t.color}
            fontFamily="Inter,sans-serif" dominantBaseline="central" style={{ pointerEvents: "none" }}>
            {t.text}
          </text>
        </g>
      ))}
    </svg>
  );

  return (
    <div className="flex flex-col w-full h-full bg-[#070b14] text-white overflow-hidden select-none relative">
      {/* ── BCOACH TOP HEADER TOOLBAR ───────────────────────────────────────── */}
      <div className="shrink-0 bg-[#0f172a]/95 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shadow-lg z-30">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Volver"
            >
              ←
            </button>
          )}
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>🎨 Pizarra Táctica Profesional</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {activeVideoUrl ? "📹 Modo Video Partido" : "⚽ Cancha 2D"}
              </span>
            </h3>
          </div>
        </div>

        {/* TOP RIGHT: QUICK ACTIONS VISIBLES + SECONDARY "+" MENU */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">

          {/* VIDEO CONTROLS when video is active */}
          {activeVideoUrl && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-emerald-500/40 px-2 py-1 rounded-xl">
              <button
                type="button"
                onClick={toggleVideoPlay}
                className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
              >
                {isPlayingVideo ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <span className="text-[10px] font-mono text-emerald-300 font-bold">
                {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
              </span>
              <button
                type="button"
                onClick={() => setActiveVideoUrl(null)}
                className="text-[10px] text-red-400 hover:text-red-300 px-1 font-bold"
              >
                ✕ Cancha
              </button>
            </div>
          )}

          {/* ── BOTONES RÁPIDOS VISIBLES (como en el video táctico) ── */}

          {/* 📷 Foto del Campo — abre cámara trasera del dispositivo */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-violet-700 border border-slate-700 hover:border-violet-500 text-[11px] font-bold text-slate-200 hover:text-white transition"
            title="Tomar foto del campo real con la cámara y usarla de fondo"
          >
            <span className="text-sm leading-none">📷</span>
            <span className="hidden sm:inline">Foto del Campo</span>
          </button>

          {/* Indicador activo: foto de campo cargada */}
          {backgroundImageUrl && (
            <div className="flex items-center gap-1.5 bg-violet-900/60 border border-violet-500/50 px-2 py-1 rounded-xl">
              <span className="text-[10px] font-bold text-violet-300">📸 Foto activa</span>
              <button
                type="button"
                onClick={() => setBackgroundImageUrl(null)}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                title="Quitar foto y volver a Cancha 2D"
              >
                ✕
              </button>
            </div>
          )}

          {/* 📹 Cargar Video */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-700 border border-slate-700 hover:border-emerald-500 text-[11px] font-bold text-slate-200 hover:text-white transition"
            title="Cargar video o imagen de partido para análisis"
          >
            <Video className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Video</span>
          </button>

          {/* Formaciones 1-clic */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-700 border border-slate-700 hover:border-blue-500 text-[11px] font-bold text-slate-200 hover:text-white transition"
                title="Alineaciones tácticas 1-clic"
              >
                <Users className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">Alineaciones</span>
                <ChevronDown className="h-3 w-3 text-slate-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-52 bg-slate-900 border-slate-800 text-white p-2 rounded-2xl shadow-2xl z-50 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 block">Plantillas 1-Clic</span>
              {Object.entries(FORMATIONS).map(([key, f]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => loadFormation(key)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-blue-600 hover:text-white transition flex justify-between items-center"
                >
                  <span className="font-black text-sm">{key}</span>
                  <span className="text-[10px] opacity-70">{f.label}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Limpiar pizarra rápido */}
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-900 border border-slate-700 hover:border-red-600 text-[11px] font-bold text-slate-400 hover:text-red-300 transition"
            title="Limpiar pizarra"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>

          {/* Pantalla completa */}
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
              } else {
                document.exitFullscreen?.();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-emerald-400 hover:text-emerald-200 transition"
            title="Pantalla completa"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pantalla Completa</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          onChange={handleCustomVideoUpload}
          className="hidden"
        />
        {/* Camera input: opens device rear camera directly on mobile */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          {...({ capture: "environment" } as React.InputHTMLAttributes<HTMLInputElement>)}
          onChange={handleCameraCapture}
          className="hidden"
        />
      </div>

      {/* ── MAIN CANVAS AREA (VIDEO OR 2D PITCH) ────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative bg-[#183b18]"
        style={{ overflow: zoom > 1 ? "auto" : "hidden" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* HTML5 VIDEO LAYER */}
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

        {isPortrait ? (
          /*
           * PORTRAIT MODE: rotate -90° so the landscape field appears vertically.
           * Rendered dimensions:
           *   width  = available container height (≈ 100dvh minus toolbars ~9rem)
           *   height = container width (100dvw)
           * After -90° rotation:
           *   visual_width  = rendered height = 100dvw → fills screen width ✓
           *   visual_height = rendered width  = dvh - 9rem → fits in screen ✓
           */
          <div
            style={{
              position: "absolute",
              width: "calc(100dvh - 9rem)",
              height: "100dvw",
              transform: `rotate(-90deg) scale(${zoom})`,
              transformOrigin: "50% 50%",
              top: "50%",
              left: "50%",
              marginLeft: "calc(-50dvw)",
              marginTop: "calc(-(100dvh - 9rem) / 2)",
              zIndex: 10,
            }}
          >
            {svgElement}
          </div>
        ) : (
          /*
           * LANDSCAPE MODE: SVG fills 100%×100% of container.
           * preserveAspectRatio="xMidYMid meet" keeps field proportional.
           * SVG background (#183b18) makes letterbox margins dark green.
           * zoom > 1: inner div expands beyond 100%, outer div scrolls.
           */
          <div
            style={{
              width: zoom > 1 ? `${zoom * 100}%` : "100%",
              height: zoom > 1 ? `${zoom * 100}%` : "100%",
              minWidth: "100%",
              minHeight: "100%",
              position: "relative",
              zIndex: 10,
              transition: "width 0.1s ease-out, height 0.1s ease-out",
            }}
          >
            {svgElement}
          </div>
        )}

        {/* Zoom indicator */}
        {zoom !== 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-700 pointer-events-none z-20">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>

      {/* ── BCOACH DOCK FLOTANTE INFERIOR DE HERRAMIENTAS ───────────────────── */}
      <div className="shrink-0 bg-[#0f172a]/95 border-t border-slate-800 p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xl z-30">
        {/* GRUPO DIBUJO Y HERRAMIENTAS */}
        <div className="flex items-center gap-1 bg-[#1e293b] p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => { setActiveTool("draw-solid"); setStrokeType("solid"); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
              activeTool === "draw-solid" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Lápiz</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTool("draw-dashed"); setStrokeType("dashed"); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
              activeTool === "draw-dashed" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="font-mono text-emerald-400 font-bold">┊</span> <span className="hidden sm:inline">Pase</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTool("draw-arrow"); setStrokeType("arrow"); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
              activeTool === "draw-arrow" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <ArrowRight className="h-3.5 w-3.5 text-amber-400" /> <span className="hidden sm:inline">Tiro</span>
          </button>

          {/* HERRAMIENTA ZONA SOMBREADA ESTILO BCOACH (00:27) */}
          <button
            type="button"
            onClick={() => { setActiveTool("draw-zone"); setStrokeType("zone"); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
              activeTool === "draw-zone" ? "bg-orange-600 text-white shadow-md ring-1 ring-orange-400" : "text-slate-400 hover:text-white"
            }`}
            title="Marcar Zona Sombreada de Espacio"
          >
            <Square className="h-3.5 w-3.5 text-orange-400 fill-orange-400/40" />
            <span className="hidden sm:inline">Zona</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("eraser")}
            className={`p-1.5 rounded-lg transition ${activeTool === "eraser" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"}`}
            title="Borrador"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* PALETA DE COLORES Y SELECCIÓN DE GROSOR DE LÍNEA */}
        <div className="flex items-center gap-2 bg-[#1e293b] px-2 py-1 rounded-xl border border-slate-700">
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-4.5 w-4.5 rounded-full border transition-transform ${
                  color === c ? "scale-125 border-white ring-2 ring-emerald-400" : "border-transparent opacity-75 hover:opacity-100"
                }`}
                style={{ backgroundColor: c, width: 18, height: 18 }}
              />
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700 mx-0.5" />

          {/* GROSOR DE LÍNEA: FINA / MEDIA / GRUESA */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStrokeW(0.4)}
              className={`h-6 px-1.5 rounded text-[10px] font-bold border transition ${
                strokeW <= 0.5 ? "bg-emerald-600 text-white border-emerald-400" : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
              title="Línea Fina (0.4)"
            >
              Fina
            </button>
            <button
              type="button"
              onClick={() => setStrokeW(0.8)}
              className={`h-6 px-1.5 rounded text-[10px] font-bold border transition ${
                strokeW > 0.5 && strokeW <= 1.0 ? "bg-emerald-600 text-white border-emerald-400" : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
              title="Línea Media (0.8)"
            >
              Media
            </button>
            <button
              type="button"
              onClick={() => setStrokeW(1.6)}
              className={`h-6 px-1.5 rounded text-[10px] font-bold border transition ${
                strokeW > 1.0 ? "bg-emerald-600 text-white border-emerald-400" : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
              title="Línea Gruesa (1.6)"
            >
              Gruesa
            </button>
          </div>
        </div>

        {/* JUGADOR, BALÓN Y TEXTO */}
        <div className="flex items-center gap-1 bg-[#1e293b] p-1 rounded-xl border border-slate-700">
          <Button
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => setActiveTool("add-player")}
            className={`h-7 px-2 text-xs font-bold gap-1 ${activeTool === "add-player" ? "bg-amber-500 text-slate-950" : "text-slate-300"}`}
          >
            <User className="h-3.5 w-3.5 text-amber-400" />
            <span>+#{nextNum}</span>
          </Button>

          <Button
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => { setBalls((prev) => [...prev, { id: `ball-${Date.now()}`, x: 50, y: 32.5 }]); toast.success("⚽ Balón colocado."); }}
            className="h-7 px-2 text-xs font-bold text-slate-300"
          >
            <span>⚽</span>
          </Button>

          <Button
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => setActiveTool("add-text")}
            className={`h-7 px-2 text-xs font-bold gap-1 ${activeTool === "add-text" ? "bg-violet-600 text-white" : "text-slate-300"}`}
          >
            <TextIcon className="h-3.5 w-3.5 text-violet-400" />
          </Button>
        </div>

        {/* ZOOM, UNDO, CLEAR & FULLSCREEN */}
        <div className="flex items-center gap-1 bg-[#1e293b] p-1 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, parseFloat((z + 0.25).toFixed(2))))}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
            title="Reset Zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleUndo}
            disabled={paths.length === 0 && zones.length === 0}
            className="p-1 text-amber-400 hover:text-amber-200 disabled:opacity-30"
            title="Deshacer"
          >
            ↩
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
            title="Limpiar Pizarra"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
              } else {
                document.exitFullscreen?.();
              }
            }}
            className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950 rounded-lg"
            title="Pantalla Completa"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CanchaBCoachBoard;
