// BACKUP DE CANCHA BCOACH BOARD DE RESPALDO SOLICITADO POR EL USUARIO
// ─── CANCHA BCOACH TACTICAL BOARD ────────────────────────────────────────────
// Pizarra táctica profesional estilo bCoach para entrenadores en cancha.

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Pencil, RotateCcw, Trash2, Maximize2, Minimize2, User,
  Users, ChevronDown, Type as TextIcon, ZoomIn, ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SportFieldInner } from "@/components/sport-field";
import { toast } from "sonner";

type ToolMode = "draw-solid" | "draw-dashed" | "draw-arrow" | "eraser" | "add-player" | "add-item" | "add-text";
type StrokeStyle = "solid" | "dashed" | "arrow";

interface FreePath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  style: StrokeStyle;
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

export function CanchaBCoachBoardBackup({
  teamName = "Equipo",
  category = "Sub-9",
  onClose,
}: {
  teamName?: string;
  category?: string;
  onClose?: () => void;
}) {
  const [isPortrait, setIsPortrait] = useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth < window.innerHeight
  );

  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerWidth < window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [activeTool, setActiveTool] = useState<ToolMode>("draw-solid");
  const [strokeType, setStrokeType] = useState<StrokeStyle>("solid");
  const [color, setColor] = useState<string>("#ffffff");
  const [strokeW, setStrokeW] = useState<number>(2.5);

  const [paths, setPaths] = useState<FreePath[]>([]);
  const [players, setPlayers] = useState<BoardPlayer[]>([]);
  const [balls, setBalls] = useState<BoardBall[]>([]);
  const [texts, setTexts] = useState<BoardText[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [livePts, setLivePts] = useState<{ x: number; y: number }[]>([]);
  const [dragging, setDragging] = useState<{ type: "player" | "ball" | "text"; id: string } | null>(null);

  const [nextNum, setNextNum] = useState(1);
  const [teamColor, setTeamColor] = useState<"orange" | "blue">("orange");

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const lastPanPos = useRef<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getSVGCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!svgRef.current) return { x: 50, y: 32.5 };
      const rect = svgRef.current.getBoundingClientRect();
      const rx = (clientX - rect.left) / rect.width;
      const ry = (clientY - rect.top) / rect.height;
      return {
        x: Math.max(0, Math.min(VW, rx * VW)),
        y: Math.max(0, Math.min(VH, ry * VH)),
      };
    },
    []
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.hypot(dx, dy);
      } else if (e.touches.length === 1) {
        lastPanPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && lastPinchDist.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = dist / lastPinchDist.current;
        lastPinchDist.current = dist;
        setZoom((prev) => Math.min(4, Math.max(0.5, prev * delta)));
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
    lastPanPos.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
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

      if (activeTool.startsWith("draw-")) {
        setIsDrawing(true);
        setLivePts([{ x, y }]);
        (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
      }
    },
    [activeTool, color, nextNum, teamColor, getSVGCoords]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (isDrawing) {
        const pt = getSVGCoords(e.clientX, e.clientY);
        setLivePts((prev) => [...prev, pt]);
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
    },
    [isDrawing, dragging, getSVGCoords]
  );

  const handlePointerUp = useCallback(() => {
    if (isDrawing && livePts.length > 1) {
      setPaths((prev) => [
        ...prev,
        { id: `path-${Date.now()}`, points: livePts, color, width: strokeW, style: strokeType },
      ]);
    }
    setIsDrawing(false);
    setLivePts([]);
    setDragging(null);
  }, [isDrawing, livePts, color, strokeW, strokeType]);

  const loadFormation = useCallback((key: string) => {
    const f = FORMATIONS[key];
    if (!f) return;
    setPlayers(
      f.pts.map((c, i) => ({ id: `fp-${i}-${Date.now()}`, number: c.n, color: "orange" as const, x: c.x, y: c.y }))
    );
    toast.success(`👥 ${f.label} desplegada`);
  }, []);

  const handleClear = () => {
    setPaths([]); setPlayers([]); setBalls([]); setTexts([]);
    toast.info("🧹 Pizarra limpiada");
  };

  const handleUndo = () => {
    if (paths.length > 0) { setPaths((p) => p.slice(0, -1)); toast.info("↩️ Deshecho"); }
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const svgElement = (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ touchAction: "none", display: "block", width: "100%", height: "100%" }}
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

      <SportFieldInner sport="football" />

      {paths.map((p) => (
        <path key={p.id} d={pointsToD(p.points)} fill="none" stroke={p.color} strokeWidth={p.width}
          strokeDasharray={p.style === "dashed" ? "3,2" : undefined}
          strokeLinecap="round" strokeLinejoin="round"
          markerEnd={p.style === "arrow" ? "url(#bcoach-arrow)" : undefined}
          onPointerDown={(e) => { if (activeTool === "eraser") { e.stopPropagation(); setPaths((prev) => prev.filter((q) => q.id !== p.id)); } }}
        />
      ))}

      {isDrawing && livePts.length > 1 && (
        <path d={pointsToD(livePts)} fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={strokeType === "dashed" ? "3,2" : undefined}
          strokeLinecap="round" strokeLinejoin="round" opacity={0.9}
          markerEnd={strokeType === "arrow" ? "url(#bcoach-arrow)" : undefined}
        />
      )}

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
          <circle r={3.2} fill={p.color === "orange" ? "#f97316" : "#2563eb"} stroke="#ffffff" strokeWidth={0.5} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={2.4}
            fill="#ffffff" fontWeight="900" fontFamily="Inter,sans-serif" style={{ pointerEvents: "none" }}>
            {p.number}
          </text>
        </g>
      ))}

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
          <circle r={2} fill="#ffffff" stroke="#222" strokeWidth={0.4} />
          <circle r={0.8} fill="#222" />
        </g>
      ))}

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
    <div className="flex flex-col w-full h-full bg-[#0b0f19] text-white overflow-hidden select-none">
      <div className="shrink-0 bg-[#111827]/95 border-b border-slate-800 px-2 py-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <div className="flex items-center gap-0.5 bg-[#0f1422] rounded-xl p-0.5 border border-slate-800">
          {([
            { tool: "draw-solid" as const, style: "solid" as const, icon: <Pencil className="h-3.5 w-3.5" />, label: "Lápiz", activeClass: "bg-[#2563EB] text-white" },
            { tool: "draw-dashed" as const, style: "dashed" as const, icon: <span className="font-mono font-bold text-emerald-400">┊</span>, label: "Pase", activeClass: "bg-emerald-700 text-white" },
            { tool: "draw-arrow" as const, style: "arrow" as const, icon: <span className="font-bold text-amber-300">➔</span>, label: "Tiro", activeClass: "bg-amber-600 text-white" },
          ]).map(({ tool, style, icon, label, activeClass }) => (
            <button key={tool} type="button"
              onClick={() => { setActiveTool(tool); setStrokeType(style); }}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition ${activeTool === tool ? activeClass : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              {icon}<span className="hidden sm:inline">{label}</span>
            </button>
          ))}
          <button type="button"
            onClick={() => setActiveTool("eraser")}
            className={`p-1.5 rounded-lg transition ${activeTool === "eraser" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            title="Borrador"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-[#0f1422] rounded-xl px-2 py-1 border border-slate-800">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`h-4.5 w-4.5 rounded-full transition-transform border ${color === c ? "scale-125 border-white shadow" : "border-transparent opacity-70 hover:opacity-100"}`}
              style={{ backgroundColor: c, width: 18, height: 18 }} title={c}
            />
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative overflow-hidden flex items-center justify-center bg-[#07120a]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isPortrait ? (
          <div
            style={{
              position: "absolute",
              width: "100vh",
              height: "100vw",
              transform: `rotate(-90deg) scale(${zoom})`,
              transformOrigin: "50% 50%",
              top: "50%",
              left: "50%",
              marginTop: "-50vw",
              marginLeft: "-50vh",
            }}
          >
            {svgElement}
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              overflow: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: `${zoom * 100}%`,
                aspectRatio: "100/65",
                flexShrink: 0,
                transition: "width 0.1s ease-out",
              }}
            >
              {svgElement}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CanchaBCoachBoardBackup;
