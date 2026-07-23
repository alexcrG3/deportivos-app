// ─── TACTICAL BOARD — INTERACTIVE SVG CANVAS ─────────────────────────────────
// Pizarra táctica profesional con drag-and-drop de jugadores, balón, conos y zonas.
// Herramientas: Seleccionar, Flechas (pase/movimiento/disparo), Zonas, Conos, Borrador.
// Autosave al TacticalStore con debounce de 800ms.

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  MousePointer2, ArrowRight, Circle, Square, Trash2,
  Save, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Eye, EyeOff, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SportFieldInner } from "@/components/sport-field";
import {
  TacticalStore, BoardSession, Arrow, Zone, Cone, BoardPlayer,
  DrawingTool, SportType, PlayerSlot, getPlayerAvailability, availabilityConfig
} from "@/lib/tactical-store";
import { jugadores, getPlayerOS } from "@/lib/mock-data";
import { toast } from "sonner";

// ─── ARROW COLORS ─────────────────────────────────────────────────────────────
const ARROW_COLORS: Record<string, string> = {
  "arrow-pass":  "#22c55e",
  "arrow-move":  "#f59e0b",
  "arrow-shoot": "#ef4444",
};

function arrowTipo(tool: DrawingTool): Arrow["tipo"] {
  if (tool === "arrow-pass") return "pase";
  if (tool === "arrow-shoot") return "disparo";
  return "movimiento";
}

// ─── MARKER AVATAR ────────────────────────────────────────────────────────────
// isPortrait: when true the field is rotated 90° CW — texts counter-rotate -90°
// so player names are always horizontal and readable regardless of orientation.
function PlayerMarker({
  player, x, y, selected, onPointerDown, availability, isPortrait
}: {
  player: BoardPlayer;
  x: number; y: number;
  selected: boolean;
  isPortrait: boolean;
  availability: "disponible" | "precaucion" | "no-recomendado";
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  const isRival = player.jugadorId.startsWith("rival-");
  const semColor = isRival ? "#ef4444" : (availability === "disponible" ? "#22c55e" : availability === "precaucion" ? "#f59e0b" : "#ef4444");
  const fillBg = isRival ? "#ef4444" : (selected ? "#7c3aed" : "#1e1b4b");
  const borderStroke = isRival ? "#ffffff" : semColor;
  const initials = player.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  // When the field is rotated 90° CW, text elements inherit that rotation and
  // appear sideways. We counter-rotate them by -90° so they always display
  // horizontally. The x/y positioning is also adjusted so the name stays
  // visually BELOW the player dot regardless of field orientation.
  const textCounterRotate = isPortrait ? "rotate(-90)" : undefined;

  return (
    <g transform={`translate(${x}, ${y})`} onPointerDown={onPointerDown} style={{ cursor: "grab" }}>
      {/* Selection ring */}
      {selected && (
        <circle r={2.4} fill="none" stroke="white" strokeWidth={0.35} strokeDasharray="0.8,0.4" opacity={0.9} />
      )}
      {/* Shadow */}
      <circle r={1.9} fill="rgba(0,0,0,0.35)" cy={0.2} cx={0.15} />
      {/* Body circle */}
      <circle r={1.75}
        fill={fillBg}
        stroke={borderStroke} strokeWidth={isRival ? 0.4 : 0.3}
      />
      {/* Jersey number / initials — counter-rotated in portrait so it stays upright */}
      <text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={1.1}
        fill="white"
        fontWeight="bold"
        fontFamily="Inter, sans-serif"
        x={0}
        y={0}
        transform={textCounterRotate}
      >
        {player.numero ?? initials}
      </text>
      {/* Name tag — always horizontal. */}
      <text
        textAnchor="middle"
        dominantBaseline="hanging"
        fontSize={0.85}
        fill="rgba(255,255,255,0.9)"
        fontFamily="Inter, sans-serif"
        x={0}
        y={2.2}
        transform={textCounterRotate}
        style={{ textShadow: "0 1px 1.5px rgba(0,0,0,0.8)" }}
      >
        {player.nombre.split(" ")[0]}
      </text>
      {/* Semaphore dot (own players only) */}
      {!isRival && (
        <circle cx={1.25} cy={-1.25} r={0.42} fill={semColor} stroke="white" strokeWidth={0.12} />
      )}
    </g>
  );
}

// ─── BALL MARKER ──────────────────────────────────────────────────────────────
function BallMarker({ x, y, onPointerDown }: { x: number; y: number; onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <g transform={`translate(${x}, ${y})`} onPointerDown={onPointerDown} style={{ cursor: "grab" }}>
      <circle r={2.2} fill="white" stroke="#374151" strokeWidth={0.3} />
      <path d="M 0,-2.2 C 0.8,-1.5 1.2,-0.5 1.2,0.5" fill="none" stroke="#374151" strokeWidth={0.25} />
      <path d="M 0,-2.2 C -0.8,-1.5 -1.2,-0.5 -1.2,0.5" fill="none" stroke="#374151" strokeWidth={0.25} />
      <path d="M -1.2,0.5 C -0.6,1.5 0.6,1.5 1.2,0.5" fill="none" stroke="#374151" strokeWidth={0.25} />
    </g>
  );
}

// ─── CONE MARKER ─────────────────────────────────────────────────────────────
const CONE_COLORS_MAP: Record<Cone["color"], string> = {
  orange: "#f97316", yellow: "#eab308", blue: "#3b82f6", red: "#ef4444",
};
function ConeMarker({ cone, onPointerDown }: { cone: Cone; onPointerDown: (e: React.PointerEvent) => void }) {
  const fill = CONE_COLORS_MAP[cone.color];
  return (
    <g transform={`translate(${cone.x}, ${cone.y})`} onPointerDown={onPointerDown} style={{ cursor: "grab" }}>
      <polygon points="0,-2.5 2,2 -2,2" fill={fill} stroke="rgba(0,0,0,0.3)" strokeWidth={0.2} />
      <rect x={-2.2} y={2} width={4.4} height={0.6} fill={fill} opacity={0.4} rx={0.2} />
    </g>
  );
}

// ─── ARROW SVG PATH ──────────────────────────────────────────────────────────
function ArrowPath({ arrow, selected, onPointerDown }: { arrow: Arrow; selected?: boolean; onPointerDown?: (e: React.PointerEvent) => void }) {
  const dx = arrow.toX - arrow.fromX;
  const dy = arrow.toY - arrow.fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.5) return null;

  const arrowColor = arrow.color;
  const curved = arrow.curved !== undefined ? arrow.curved : arrow.tipo === "movimiento";
  const offset = arrow.curvedOffset !== undefined ? arrow.curvedOffset : 0.25;
  const cx = (arrow.fromX + arrow.toX) / 2 - dy * offset;
  const cy = (arrow.fromY + arrow.toY) / 2 + dx * offset;
  const d = curved
    ? `M ${arrow.fromX},${arrow.fromY} Q ${cx},${cy} ${arrow.toX},${arrow.toY}`
    : `M ${arrow.fromX},${arrow.fromY} L ${arrow.toX},${arrow.toY}`;

  return (
    <g onPointerDown={onPointerDown}>
      <defs>
        <marker id={`ah-${arrow.id}`} markerWidth={3} markerHeight={3} refX={1.5} refY={1.5} orient="auto">
          <path d="M 0,0 L 3,1.5 L 0,3 Z" fill={arrowColor} />
        </marker>
      </defs>
      {/* Invisible thick hit area */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={3} style={{ cursor: "pointer" }} />
      {/* Selection highlight glow */}
      {selected && (
        <path d={d} fill="none" stroke="#7c3aed" strokeWidth={1.5} opacity={0.65} strokeDasharray="1,0.5" />
      )}
      {/* Visible arrow */}
      <path d={d} fill="none" stroke={arrowColor} strokeWidth={0.5}
        strokeDasharray={arrow.tipo === "movimiento" ? "1.5,0.8" : "none"}
        markerEnd={`url(#ah-${arrow.id})`} opacity={0.85}
      />
    </g>
  );
}

// ─── ZONE RECT ───────────────────────────────────────────────────────────────
function ZoneRect({ zone, onPointerDown }: { zone: Zone; onPointerDown?: (e: React.PointerEvent) => void }) {
  return (
    <g onPointerDown={onPointerDown} style={{ cursor: "move" }}>
      <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height}
        fill={zone.color} opacity={zone.opacity} rx={0.5}
        stroke={zone.color} strokeWidth={0.3} strokeDasharray="1.5,0.5"
      />
      {zone.label && (
        <text x={zone.x + zone.width / 2} y={zone.y + zone.height / 2}
          textAnchor="middle" dominantBaseline="middle" fontSize={2}
          fill="white" fontFamily="Inter, sans-serif" fontWeight="bold"
          style={{ pointerEvents: "none" }}>
          {zone.label}
        </text>
      )}
    </g>
  );
}

interface TacticalBoardProps {
  initialSession?: BoardSession;
  slots?: PlayerSlot[];
  readonly?: boolean;
  onSessionChange?: (session: BoardSession) => void;
  sport?: SportType;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function TacticalBoard({
  initialSession,
  slots = [],
  readonly = false,
  onSessionChange,
  sport = "football",
}: TacticalBoardProps) {
  // Initialize from initialSession
  const [session, setSession] = useState<BoardSession>(() => {
    if (initialSession) return initialSession;
    return TacticalStore.getBoardSession();
  });

  // Sync when parent pushes a completely new session (e.g. adding a player from sidebar)
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
    }
  }, [initialSession]);

  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBall, setShowBall] = useState(true);

  // Portrait mode: active when the viewport is taller than wide (phones/tablets
  // held upright). The field rotates 90° so it fills the screen vertically.
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== "undefined" && window.innerHeight > window.innerWidth
  );
  useEffect(() => {
    const onResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // Exit fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [lineShape, setLineShape] = useState<"auto" | "recta" | "curva">("auto");
  const [previewArrow, setPreviewArrow] = useState<Arrow | null>(null);

  // Drag state
  const [dragging, setDragging] = useState<{ type: "player" | "ball" | "cone" | "arrow"; id?: string } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSession = useCallback((updater: (prev: BoardSession) => BoardSession) => {
    setSession(prev => updater(prev));
  }, []);

  // Notify parent AFTER session state settles. 
  // We SKIP this while actively dragging or drawing to prevent massive re-renders
  // in the parent component which causes terrible lag (1 FPS).
  useEffect(() => {
    if (!dragging && !isDrawing) {
      onSessionChange?.(session);
    }
  }, [session, dragging, isDrawing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if session has playId
  const loadedPlay = useMemo(() => {
    const playId = (session as any).playId;
    if (!playId) return null;
    return TacticalStore.getPlays().find(p => p.id === playId);
  }, [session]);

  const activeFrame = (session as any).activeFrame ?? 0;
  const isPlaying = (session as any).isPlaying ?? false;

  // Frame control helper
  const goToFrame = useCallback((frameIdx: number) => {
    if (!loadedPlay) return;
    const playFrame = loadedPlay.frames[frameIdx];
    if (!playFrame) return;

    updateSession(prev => ({
      ...prev,
      activeFrame: frameIdx,
      players: playFrame.players.map(p => {
        const pOs = getPlayerOS(p.jugadorId);
        return {
          slotId: p.slotId,
          jugadorId: p.jugadorId,
          x: p.x,
          y: p.y,
          nombre: pOs?.nombre ?? p.slotId,
          numero: pOs?.numero,
          avatar: pOs?.avatar,
        };
      }),
      ball: playFrame.ball,
      arrows: playFrame.arrows,
    } as any));
  }, [loadedPlay, updateSession]);

  // Handle play interval
  useEffect(() => {
    if (!loadedPlay || !isPlaying) return;
    const timer = setInterval(() => {
      const nextFrame = (activeFrame + 1) % loadedPlay.frames.length;
      goToFrame(nextFrame);
    }, 1500);
    return () => clearInterval(timer);
  }, [loadedPlay, isPlaying, activeFrame, goToFrame]);

  const togglePlay = () => {
    updateSession(prev => ({ ...prev, isPlaying: !isPlaying } as any));
  };

  // Convert SVG pointer event to landscape field coordinates (0–100, 0–65).
  // Portrait mode uses viewBox 65×100 with content rotated 90° CW:
  //   Landscape → Portrait mapping:  (lx, ly)  → (65–ly, lx)
  //   Portrait  → Landscape inverse: (px, py)  → (py,    65–px)
  const toSVGCoords = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    if (isPortrait) {
      // Portrait viewBox is 65 wide × 100 tall
      const px = (e.clientX - rect.left) / rect.width  * 65;
      const py = (e.clientY - rect.top)  / rect.height * 100;
      return {
        x: Math.max(0, Math.min(100, py)),
        y: Math.max(0, Math.min(65,  65 - px)),
      };
    }
    const scaleX = 100 / rect.width;
    const scaleY = 65  / rect.height;
    return {
      x: Math.max(0, Math.min(100, (e.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(65,  (e.clientY - rect.top)  * scaleY)),
    };
  }, [isPortrait]);

  // Populate players from slots when the board mounts — and ONLY if:
  //   a) there are slots defined (a formation is active), AND
  //   b) the user has NOT explicitly cleared the board (clearedByUser flag).
  // This updates player coordinates when formations/slots coordinates are changed.
  useEffect(() => {
    if (session.clearedByUser) return;
    if (slots.length === 0) return;

    updateSession(prev => {
      // If there are no players on the board, populate all slots
      if (prev.players.length === 0) {
        const players: BoardPlayer[] = slots
          .filter(s => s.jugadorId)
          .map(s => {
            const jug = jugadores.find(j => j.id === s.jugadorId);
            const pOs = getPlayerOS(s.jugadorId!);
            return {
              slotId: s.slotId,
              jugadorId: s.jugadorId!,
              x: s.x, y: s.y,
              nombre: jug?.nombre ?? s.label,
              numero: pOs?.numero,
              avatar: jug?.avatar,
            };
          });

        const ghostPlayers: BoardPlayer[] = slots
          .filter(s => !s.jugadorId)
          .map(s => ({
            slotId: s.slotId,
            jugadorId: `ghost-${s.slotId}`,
            x: s.x, y: s.y,
            nombre: s.label,
          }));

        return { ...prev, players: [...players, ...ghostPlayers] };
      }

      // If players already exist, sync any ghost/slot positions to their new coordinates
      const updatedPlayers = prev.players.map(p => {
        const matchingSlot = slots.find(s => s.slotId === p.slotId);
        if (matchingSlot && (p.jugadorId.startsWith("ghost-") || p.slotId)) {
          if (p.x !== matchingSlot.x || p.y !== matchingSlot.y) {
            return { ...p, x: matchingSlot.x, y: matchingSlot.y };
          }
        }
        return p;
      });

      // Add any slots that are completely missing
      slots.forEach(s => {
        if (!updatedPlayers.some(p => p.slotId === s.slotId)) {
          if (s.jugadorId) {
            const jug = jugadores.find(j => j.id === s.jugadorId);
            const pOs = getPlayerOS(s.jugadorId);
            updatedPlayers.push({
              slotId: s.slotId,
              jugadorId: s.jugadorId,
              x: s.x, y: s.y,
              nombre: jug?.nombre ?? s.label,
              numero: pOs?.numero,
              avatar: jug?.avatar,
            });
          } else {
            updatedPlayers.push({
              slotId: s.slotId,
              jugadorId: `ghost-${s.slotId}`,
              x: s.x, y: s.y,
              nombre: s.label,
            });
          }
        }
      });

      // Force a new array reference to ensure React sees the change if needed
      return { ...prev, players: [...updatedPlayers] };
    });
  }, [slots, session.clearedByUser]); // Removed exhaustive-deps to only run when slots change


  // ── POINTER DOWN ─────────────────────────────────────────────────────────────
  const handleSVGPointerDown = useCallback((e: React.PointerEvent) => {
    if (readonly) return;
    e.preventDefault();
    const { x, y } = toSVGCoords(e);
    svgRef.current?.setPointerCapture(e.pointerId);

    if (activeTool === "select") {
      setSelectedId(null);
      return;
    }

    if (activeTool.startsWith("arrow")) {
      setIsDrawing(true);
      setDrawStart({ x, y });
      
      const isCurved = lineShape === "curva"
        ? true
        : lineShape === "recta"
        ? false
        : activeTool === "arrow-move"; // auto: movement is curved

      setPreviewArrow({
        id: "preview",
        fromX: x, fromY: y, toX: x, toY: y,
        tipo: arrowTipo(activeTool),
        color: ARROW_COLORS[activeTool] ?? "#fff",
        curved: isCurved,
      });
      return;
    }

    if (activeTool === "zone") {
      setIsDrawing(true);
      setDrawStart({ x, y });
      return;
    }

    if (activeTool === "cone") {
      const newCone: Cone = {
        id: `cone-${Date.now()}`,
        x, y,
        color: "orange",
      };
      updateSession(prev => ({ ...prev, cones: [...prev.cones, newCone] }));
      return;
    }
  }, [activeTool, readonly, toSVGCoords, updateSession]);

  // ── POINTER MOVE ─────────────────────────────────────────────────────────────
  const handleSVGPointerMove = useCallback((e: React.PointerEvent) => {
    if (readonly) return;
    const { x, y } = toSVGCoords(e);

    if (dragging) {
      if (dragging.type === "ball") {
        updateSession(prev => ({ ...prev, ball: { x, y } }));
      } else if (dragging.type === "player" && dragging.id) {
        updateSession(prev => ({
          ...prev,
          players: prev.players.map(p =>
            p.jugadorId === dragging.id ? { ...p, x, y } : p
          ),
        }));
      } else if (dragging.type === "cone" && dragging.id) {
        updateSession(prev => ({
          ...prev,
          cones: prev.cones.map(c =>
            c.id === dragging.id ? { ...c, x, y } : c
          ),
        }));
      } else if (dragging.type === "arrow" && dragging.id) {
        updateSession(prev => {
          const arrow = prev.arrows.find(a => a.id === dragging.id);
          if (!arrow) return prev;
          const dx = arrow.toX - arrow.fromX;
          const dy = arrow.toY - arrow.fromY;
          const lenSq = dx * dx + dy * dy;
          if (lenSq > 1) {
            const mx = (arrow.fromX + arrow.toX) / 2;
            const my = (arrow.fromY + arrow.toY) / 2;
            // Calculate perpendicular projection offset fraction
            const offset = ((x - mx) * (-dy) + (y - my) * dx) / lenSq;
            const clampedOffset = Math.max(-1.5, Math.min(1.5, offset));
            return {
              ...prev,
              arrows: prev.arrows.map(a =>
                a.id === dragging.id ? { ...a, curvedOffset: clampedOffset, curved: true } : a
              ),
            };
          }
          return prev;
        });
      }
      return;
    }

    if (isDrawing && drawStart) {
      if (activeTool.startsWith("arrow")) {
        setPreviewArrow(prev => prev ? { ...prev, toX: x, toY: y } : null);
      }
    }
  }, [dragging, isDrawing, drawStart, activeTool, readonly, toSVGCoords, updateSession]);

  // ── POINTER UP ────────────────────────────────────────────────────────────────
  const handleSVGPointerUp = useCallback((e: React.PointerEvent) => {
    if (readonly) return;
    const { x, y } = toSVGCoords(e);

    if (dragging) {
      setDragging(null);
      return;
    }

    if (isDrawing && drawStart) {
      if (activeTool.startsWith("arrow")) {
        const dx = x - drawStart.x;
        const dy = y - drawStart.y;
        if (Math.sqrt(dx * dx + dy * dy) > 2) {
          const isCurved = lineShape === "curva"
            ? true
            : lineShape === "recta"
            ? false
            : activeTool === "arrow-move";

          const newArrow: Arrow = {
            id: `arr-${Date.now()}`,
            fromX: drawStart.x, fromY: drawStart.y,
            toX: x, toY: y,
            tipo: arrowTipo(activeTool),
            color: ARROW_COLORS[activeTool] ?? "#fff",
            curved: isCurved,
          };
          updateSession(prev => ({ ...prev, arrows: [...prev.arrows, newArrow] }));
        }
      }

      if (activeTool === "zone") {
        const w = Math.abs(x - drawStart.x);
        const h = Math.abs(y - drawStart.y);
        if (w > 3 && h > 3) {
          const newZone: Zone = {
            id: `zone-${Date.now()}`,
            x: Math.min(x, drawStart.x),
            y: Math.min(y, drawStart.y),
            width: w, height: h,
            color: "#8b5cf6",
            opacity: 0.25,
            label: "",
          };
          updateSession(prev => ({ ...prev, zones: [...prev.zones, newZone] }));
        }
      }

      setIsDrawing(false);
      setDrawStart(null);
      setPreviewArrow(null);
    }
  }, [dragging, isDrawing, drawStart, activeTool, readonly, toSVGCoords, updateSession]);

  // ── PLAYER DRAG ───────────────────────────────────────────────────────────────
  const startPlayerDrag = useCallback((e: React.PointerEvent, jugadorId: string) => {
    if (readonly || activeTool !== "select") return;
    e.stopPropagation();
    setSelectedId(jugadorId);
    setDragging({ type: "player", id: jugadorId });
    svgRef.current?.setPointerCapture(e.pointerId);
  }, [activeTool, readonly]);

  const startBallDrag = useCallback((e: React.PointerEvent) => {
    if (readonly || activeTool !== "select") return;
    e.stopPropagation();
    setDragging({ type: "ball" });
    svgRef.current?.setPointerCapture(e.pointerId);
  }, [activeTool, readonly]);

  const startConeDrag = useCallback((e: React.PointerEvent, id: string) => {
    if (readonly || activeTool !== "select") return;
    e.stopPropagation();
    setDragging({ type: "cone", id });
    svgRef.current?.setPointerCapture(e.pointerId);
  }, [activeTool, readonly]);

  const startArrowDrag = useCallback((e: React.PointerEvent, id: string) => {
    if (readonly || activeTool !== "select") return;
    e.stopPropagation();
    setSelectedId(id);
    setDragging({ type: "arrow", id });
    svgRef.current?.setPointerCapture(e.pointerId);
  }, [activeTool, readonly]);

  // ── ACTIONS ───────────────────────────────────────────────────────────────────
  const clearArrows = () => {
    updateSession(prev => ({ ...prev, arrows: [] }));
    toast.success("Flechas borradas");
  };

  const clearAll = () => {
    updateSession(prev => ({ ...prev, arrows: [], zones: [], cones: [] }));
    toast.success("Pizarra limpiada");
  };

  const handleSave = () => {
    TacticalStore.saveBoardSession(session);
    toast.success("Pizarra guardada correctamente");
  };

  // ── TOOL BAR ──────────────────────────────────────────────────────────────────
  const tools: { id: DrawingTool; icon: React.ReactNode; label: string; color?: string }[] = [
    { id: "select",      icon: <MousePointer2 className="h-4 w-4" />, label: "Seleccionar" },
    { id: "arrow-pass",  icon: <ArrowRight className="h-4 w-4" />,   label: "Pase",      color: "text-emerald-400" },
    { id: "arrow-move",  icon: <ArrowRight className="h-4 w-4" />,   label: "Movimiento", color: "text-amber-400" },
    { id: "arrow-shoot", icon: <ArrowRight className="h-4 w-4" />,   label: "Disparo",   color: "text-red-400" },
    { id: "zone",        icon: <Square className="h-4 w-4" />,       label: "Zona" },
    { id: "cone",        icon: <Circle className="h-4 w-4" />,       label: "Cono" },
    { id: "eraser",      icon: <Trash2 className="h-4 w-4" />,       label: "Borrar" },
  ];

  return (
    <div className={`flex flex-col gap-3 ${isFullscreen ? "fixed inset-0 z-[100] bg-[#07090d] p-6 overflow-y-auto" : "relative"}`}>
      {/* Floating Exit Fullscreen Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-[110] flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition duration-150"
        >
          <X className="h-4 w-4" />
          <span>Salir de pantalla completa</span>
        </button>
      )}

      {/* Toolbar — Row 1: Drawing tools (horizontal scroll on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {/* Tool buttons */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-inner shrink-0">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={t.label}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-bold transition duration-150 ${
                activeTool === t.id
                  ? "bg-violet-600 text-white shadow-elegant"
                  : `text-slate-400 hover:text-white hover:bg-slate-800 ${t.color ?? ""}`
              }`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic line style toggle */}
        {activeTool.startsWith("arrow") && (
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-inner shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase px-1.5">Estilo:</span>
            {[
              { id: "auto", label: "Auto" },
              { id: "recta", label: "Recta" },
              { id: "curva", label: "Curva" },
            ].map(style => (
              <button
                key={style.id}
                onClick={() => setLineShape(style.id as any)}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  lineShape === style.id
                    ? "bg-slate-700 text-violet-300"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar — Row 2: Zoom / view actions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-inner shrink-0">
          <button
            onClick={() => setShowBall(p => !p)}
            title="Mostrar/ocultar balón"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition duration-150"
          >
            {showBall ? <Eye className="h-4 w-4 text-emerald-400" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
          </button>
          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.25))}
            title="Acercar (+)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition duration-150"
          >
            <ZoomIn className="h-4 w-4 text-slate-200" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            title="Alejar (-)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition duration-150"
          >
            <ZoomOut className="h-4 w-4 text-slate-200" />
          </button>
          <button
            onClick={clearArrows}
            title="Limpiar flechas"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition duration-150"
          >
            <RotateCcw className="h-4 w-4 text-slate-200" />
          </button>
          <button
            onClick={() => setIsFullscreen(f => !f)}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition duration-150"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4 text-amber-400" /> : <Maximize2 className="h-4 w-4 text-slate-200" />}
          </button>
        </div>
        {/* Contextual actions for selected Arrow */}
        {(() => {
          let selectedArrow = selectedId && selectedId.startsWith("arr-")
            ? session.arrows.find(a => a.id === selectedId)
            : null;

          // If no specific arrow is selected, but drawing mode is active with Curve style, target the last arrow
          if (!selectedArrow && activeTool.startsWith("arrow") && lineShape === "curva") {
            if (session.arrows.length > 0) {
              selectedArrow = session.arrows[session.arrows.length - 1];
            }
          }

          if (!selectedArrow) return null;

          return (
            <div className="flex items-center gap-1 bg-slate-900 border border-violet-800/60 rounded-xl p-1 shadow-elegant shrink-0 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-[10px] text-violet-300 font-bold uppercase px-2">Flecha:</span>
              {selectedArrow.curved && (
                <button
                  onClick={() => {
                    updateSession(prev => ({
                      ...prev,
                      arrows: prev.arrows.map(a =>
                        a.id === selectedArrow.id
                          ? { ...a, curvedOffset: -(a.curvedOffset !== undefined ? a.curvedOffset : 0.25), curved: true }
                          : a
                      )
                    }));
                  }}
                  title="Invertir curva (Izquierda / Derecha)"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded transition"
                >
                  🔄 Invertir Curva
                </button>
              )}
              <button
                onClick={() => {
                  updateSession(prev => ({
                    ...prev,
                    arrows: prev.arrows.map(a =>
                      a.id === selectedArrow.id
                        ? { ...a, curved: !a.curved }
                        : a
                    )
                  }));
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded transition"
              >
                📐 {selectedArrow.curved ? "Línea Recta" : "Línea Curva"}
              </button>
            </div>
          );
        })()}

        {/* Play animator controllers */}
        {loadedPlay && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-amber-500/30 rounded-xl shadow-elegant shrink-0 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-[10px] text-amber-400 font-bold uppercase px-2 truncate max-w-[120px]" title={loadedPlay.nombre}>
              🎬 {loadedPlay.nombre}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => goToFrame(Math.max(0, activeFrame - 1))}
                disabled={activeFrame === 0}
                title="Anterior Frame"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:pointer-events-none transition text-[10px] h-7 w-7 flex items-center justify-center"
              >
                ⏮️
              </button>
              <button
                onClick={togglePlay}
                title={isPlaying ? "Pausar" : "Reproducir"}
                className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold transition text-[10px] h-7 flex items-center gap-1"
              >
                {isPlaying ? "⏸️ Pausar" : "▶️ Reproducir"}
              </button>
              <button
                onClick={() => goToFrame((activeFrame + 1) % loadedPlay.frames.length)}
                title="Siguiente Frame"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition text-[10px] h-7 w-7 flex items-center justify-center"
              >
                ⏭️
              </button>
            </div>
            <span className="text-[10px] text-slate-400 font-mono px-1">
              {activeFrame + 1}/{loadedPlay.frames.length}
            </span>
            <button
              onClick={() => {
                updateSession(prev => {
                  const copy = { ...prev };
                  delete (copy as any).playId;
                  delete (copy as any).activeFrame;
                  delete (copy as any).isPlaying;
                  return copy;
                });
              }}
              title="Cerrar simulación"
              className="text-slate-400 hover:text-white px-1.5 text-xs transition"
            >
              ✕
            </button>
          </div>
        )}

        {!readonly && (
          <Button size="sm" className="bg-primary hover:bg-primary/95 text-white font-bold gap-1.5 text-xs shrink-0 ml-auto shadow-elegant" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" /> Guardar
          </Button>
        )}
      </div>

      {/* SVG Board */}
      <div className={`relative rounded-2xl border border-white/10 w-full bg-slate-950/20 shadow-2xl ${
        zoom > 1 || isFullscreen 
          ? "overflow-auto max-h-[82vh]" 
          : "overflow-hidden"
      }`}>
        <div style={{ width: `${zoom * 100}%`, transition: "width 0.15s ease-out", margin: "0 auto" }}>
          <svg
            ref={svgRef}
            viewBox={isPortrait ? "0 0 65 100" : "0 0 100 65"}
            className="w-full h-auto block"
            style={{ touchAction: "none" }}
            onPointerDown={handleSVGPointerDown}
            onPointerMove={handleSVGPointerMove}
            onPointerUp={handleSVGPointerUp}
          >
            {/* Wrap content in a rotation group for portrait mode */}
            <g transform={isPortrait ? "translate(65,0) rotate(90)" : undefined}>
              {/* Field */}
              <SportFieldInner sport={sport} />

              {/* Zones */}
              {session.zones.map(zone => (
                <ZoneRect key={zone.id} zone={zone}
                  onPointerDown={(e) => {
                    if (activeTool === "eraser") {
                      e.stopPropagation();
                      updateSession(prev => ({ ...prev, zones: prev.zones.filter(z => z.id !== zone.id) }));
                    }
                  }}
                />
              ))}

              {/* Preview zone while drawing */}
              {isDrawing && drawStart && activeTool === "zone" && previewArrow === null && (
                <rect x={drawStart.x} y={drawStart.y} width={5} height={5}
                  fill="#8b5cf6" opacity={0.2} stroke="#8b5cf6" strokeWidth={0.3} strokeDasharray="1,0.5" />
              )}

              {/* Arrows */}
              {session.arrows.map(arrow => (
                <ArrowPath key={arrow.id} arrow={arrow}
                  selected={selectedId === arrow.id}
                  onPointerDown={(e) => {
                    if (activeTool === "eraser") {
                      e.stopPropagation();
                      updateSession(prev => ({ ...prev, arrows: prev.arrows.filter(a => a.id !== arrow.id) }));
                    } else {
                      startArrowDrag(e, arrow.id);
                    }
                  }}
                />
              ))}

              {/* Preview arrow while drawing */}
              {isDrawing && previewArrow && (
                <ArrowPath arrow={{ ...previewArrow, id: "preview-vis" }} />
              )}

              {/* Cones */}
              {session.cones.map(cone => (
                <ConeMarker key={cone.id} cone={cone}
                  onPointerDown={(e) => {
                    if (activeTool === "eraser") {
                      e.stopPropagation();
                      updateSession(prev => ({ ...prev, cones: prev.cones.filter(c => c.id !== cone.id) }));
                    } else {
                      startConeDrag(e, cone.id);
                    }
                  }}
                />
              ))}

              {/* Ball */}
              {showBall && (
                <BallMarker
                  x={session.ball.x}
                  y={session.ball.y}
                  onPointerDown={startBallDrag}
                />
              )}

              {/* Players */}
              {session.players.map(player => {
                const avail = getPlayerAvailability(player.jugadorId);
                return (
                  <PlayerMarker
                    key={player.jugadorId}
                    player={player}
                    x={player.x}
                    y={player.y}
                    selected={selectedId === player.jugadorId}
                    availability={avail}
                    isPortrait={isPortrait}
                    onPointerDown={(e) => {
                      if (activeTool === "eraser") {
                        e.stopPropagation();
                        updateSession(prev => ({ ...prev, players: prev.players.filter(p => p.jugadorId !== player.jugadorId) }));
                      } else {
                        startPlayerDrag(e, player.jugadorId);
                      }
                    }}
                  />
                );
              })}
            </g>
          </svg>

          {/* Autosave badge */}
          <div className="absolute bottom-3 right-3">
            <Badge variant="outline" className="text-[9px] bg-black/50 border-white/10 text-white/60 backdrop-blur">
              Autosave activo
            </Badge>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Disponible</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Con precaución</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> No recomendado</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-emerald-400" /> Pase</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-amber-400 border-dashed border-t border-amber-400" /> Movimiento</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-red-500" /> Disparo</span>
      </div>
    </div>
  );
}

export default TacticalBoard;
