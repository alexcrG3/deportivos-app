import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import RendimientoStore, {
  type PlayerLoadData,
  type SportsAlerta,
  type SesionCompleta,
  type TipoEntrenamiento,
  type NivelIntensidad,
  sportsScoreLabel,
  calcCargaInterna,
} from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import {
  Flame, Zap, TrendingUp, TrendingDown, Minus, AlertTriangle, Shield,
  ChevronRight, Plus, RefreshCw, BarChart3, Activity, Brain, Heart,
  CheckCircle2, Moon, Info, Bell, Gauge,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, ComposedChart, AreaChart, Area, BarChart, Bar,
  Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine,
} from "recharts";

export const Route = createFileRoute("/_app/rendimiento/cargas")({
  component: CargasPage,
});

// ─── RPE Visual Scale ─────────────────────────────────────────────────────────
const RPE_LABELS: Record<number, { label: string; color: string }> = {
  1:  { label: "Muy fácil",       color: "#10b981" },
  2:  { label: "Fácil",           color: "#34d399" },
  3:  { label: "Moderado bajo",   color: "#84cc16" },
  4:  { label: "Moderado",        color: "#a3e635" },
  5:  { label: "Moderado",        color: "#eab308" },
  6:  { label: "Difícil",         color: "#f59e0b" },
  7:  { label: "Intenso",         color: "#f97316" },
  8:  { label: "Muy intenso",     color: "#ef4444" },
  9:  { label: "Extremo",         color: "#dc2626" },
  10: { label: "Máximo esfuerzo", color: "#991b1b" },
};

// ─── Semáforo Badge ───────────────────────────────────────────────────────────
function SemaforoBadge({ color, size = "sm" }: { color: "verde" | "amarillo" | "rojo" | "gris"; size?: "sm" | "lg" }) {
  const map = {
    verde:    { emoji: "🟢", label: "Óptimo",     cls: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-700" },
    amarillo: { emoji: "🟡", label: "Precaución", cls: "border-amber-300   bg-amber-50   text-amber-700   dark:bg-amber-950/20   dark:text-amber-400   dark:border-amber-700"   },
    rojo:     { emoji: "🔴", label: "Alto Riesgo",cls: "border-red-300     bg-red-50     text-red-700     dark:bg-red-950/20     dark:text-red-400     dark:border-red-700"     },
    gris:     { emoji: "⚪", label: "Sin Datos",   cls: "border-muted-foreground/20 bg-muted/20 text-muted-foreground dark:bg-muted/10 dark:text-muted-foreground dark:border-muted/30" },
  };
  const m = map[color];
  return (
    <Badge variant="outline" className={`font-semibold ${m.cls} ${size === "lg" ? "text-sm px-3 py-1" : "text-xs"}`}>
      {m.emoji} {m.label}
    </Badge>
  );
}

// ─── Big Semaforo Display ─────────────────────────────────────────────────────
function SemaforoGrande({ data }: { data: PlayerLoadData }) {
  const config = {
    verde:    { gradient: "from-emerald-500 to-teal-400", icon: CheckCircle2, title: "ÓPTIMO", sub: "Entrenamiento normal" },
    amarillo: { gradient: "from-amber-500 to-orange-400", icon: AlertTriangle, title: "SOBRECARGA", sub: "Reducir intensidad" },
    rojo:     { gradient: "from-red-600 to-rose-500",     icon: Shield,        title: "ALTO RIESGO", sub: "Recomendar descanso" },
    gris:     { gradient: "from-slate-500 to-slate-400",   icon: Info,          title: "SIN DATOS",   sub: "No se registran entrenamientos o wellness" },
  }[data.semaforo];
  const Icon = config.icon;

  return (
    <Card className="shadow-card overflow-hidden">
      <div className={`bg-gradient-to-br ${config.gradient} p-6 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Semáforo de Riesgo</p>
            <p className="text-2xl font-black tracking-tight">{config.title}</p>
            <p className="text-sm opacity-90">{config.sub}</p>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        {data.semaforoMotivos.length > 0 ? (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Motivos detectados:</p>
            <ul className="space-y-1.5">
              {data.semaforoMotivos.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  {m}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Sin factores de riesgo detectados.</p>
        )}
        <div className={`rounded-xl border p-3 text-xs ${
          data.semaforo === "rojo" ? "border-red-200 bg-red-50/80 dark:border-red-800/30 dark:bg-red-950/10" :
          data.semaforo === "amarillo" ? "border-amber-200 bg-amber-50/80 dark:border-amber-800/30 dark:bg-amber-950/10" :
          "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800/30 dark:bg-emerald-950/10"
        }`}>
          <p className="font-semibold mb-0.5">Recomendación:</p>
          <p className="text-muted-foreground">{data.semaforoRecomendacion}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── ACWR Gauge ───────────────────────────────────────────────────────────────
function ACWRGauge({ acwr }: { acwr: number }) {
  const zones = [
    { label: "Sub-entre.", from: 0,   to: 0.6, color: "#0ea5e9",  textColor: "text-sky-600" },
    { label: "Bajo",       from: 0.6, to: 0.8, color: "#22c55e",  textColor: "text-green-600" },
    { label: "Óptimo",     from: 0.8, to: 1.3, color: "#10b981",  textColor: "text-emerald-600" },
    { label: "Precaución", from: 1.3, to: 1.5, color: "#f59e0b",  textColor: "text-amber-600" },
    { label: "Riesgo",     from: 1.5, to: 2.5, color: "#ef4444",  textColor: "text-red-600" },
  ];
  const zone = zones.find(z => acwr >= z.from && acwr < z.to) ?? zones[4];
  const posPercent = Math.min(99, (Math.min(acwr, 2.5) / 2.5) * 100);

  return (
    <div className="w-full space-y-2">
      <div className="relative h-4 rounded-full overflow-hidden flex shadow-inner">
        {zones.map(z => (
          <div key={z.label} style={{ width: `${((z.to - z.from) / 2.5) * 100}%`, background: z.color, opacity: 0.85 }} />
        ))}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-6 w-2 rounded-full bg-white shadow-lg border-2 border-foreground/20 transition-all duration-700"
          style={{ left: `calc(${posPercent}% - 4px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
        <span>0.0</span><span>0.6</span><span>0.8</span><span>1.3</span><span>1.5</span><span>2.5+</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-3xl font-black ${zone.textColor}`}>{acwr.toFixed(2)}</span>
        <div>
          <Badge style={{ background: `${zone.color}20`, color: zone.color, borderColor: `${zone.color}40` }} variant="outline" className="text-xs font-semibold">
            {zone.label}
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-0.5">Zona óptima: 0.8 – 1.3</p>
        </div>
      </div>
    </div>
  );
}

// ─── Score Circle ─────────────────────────────────────────────────────────────
function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  const size = 88;
  const radius = (size - 12) / 2;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={8} className="text-muted/20" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 3px ${color}60)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <p className="text-[10px] font-semibold text-muted-foreground text-center">{label}</p>
    </div>
  );
}

// ─── Formulario Registro Entrenamiento ────────────────────────────────────────
const BLANK_SESION = {
  nombre:      "",
  fecha:       new Date().toISOString().split("T")[0],
  hora:        "08:00",
  equipo:      "Fútbol Sub-10",
  categoria:   "Sub-10",
  entrenador:  "Carlos Méndez",
  lugar:       "Cancha Principal",
  tipo:        "Técnico" as TipoEntrenamiento,
  duracion:    60,
  intensidad:  "Media" as NivelIntensidad,
  rpe:         5,
  notas:       "",
};

const TIPOS_ENTRENAMIENTO: TipoEntrenamiento[] = ["Técnico", "Táctico", "Físico", "Recuperación", "Partido", "Gimnasio", "Mixto"];
const INTENSIDADES: NivelIntensidad[]          = ["Muy Baja", "Baja", "Media", "Alta", "Muy Alta"];
const EQUIPOS = ["Fútbol Sub-10", "Baloncesto Sub-12", "Natación Sub-14", "Voleibol Sub-16", "Sub-16"];
const LUGARES = ["Cancha Principal", "Cancha Auxiliar", "Gimnasio", "Piscina", "Pista Atlética", "Externo"];
const ENTRENADORES = ["Carlos Méndez", "Laura Vargas", "Pedro Torres", "Ana Jiménez"];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function CargasPage() {
  const [playerLoads, setPlayerLoads] = useState<PlayerLoadData[]>([]);
  const [alertas, setAlertas]         = useState<SportsAlerta[]>([]);
  const [selected, setSelected]       = useState<PlayerLoadData | null>(null);
  const [openReg, setOpenReg]         = useState(false);
  const [form, setForm]               = useState({ ...BLANK_SESION });
  const [liveLoad, setLiveLoad]       = useState(0);
  const [filtroHistorial, setFiltroHistorial] = useState<"7" | "14" | "28">("14");
  const [selectedTeamName, setSelectedTeamName] = useState<string>("all");

  const { role, coachName } = useRole();
  const isAdmin = role === "admin";

  const myTeams = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (isAdmin) return all;
    return all.filter(t => t.entrenador === coachName);
  }, [isAdmin, coachName]);

  const myCategories = useMemo(() => myTeams.map(t => t.categoria), [myTeams]);

  const loadData = () => {
    let data  = RendimientoStore.getPlayerLoadData();
    let alerts = RendimientoStore.getSportsAlertas();

    if (!isAdmin) {
      data = data.filter(d => myCategories.includes(d.equipo));
      const players = RendimientoStore.getJugadores();
      alerts = alerts.filter(a => {
        const p = players.find(x => x.nombre === a.jugador || x.id === a.jugadorId);
        return p && myCategories.includes(p.categoria);
      });
    }

    if (selectedTeamName !== "all") {
      const selTeamObj = myTeams.find(t => t.nombre === selectedTeamName);
      if (selTeamObj) {
        const cat = (selTeamObj.categoria || "").toLowerCase().trim();
        const nom = (selTeamObj.nombre || "").toLowerCase().trim();

        data = data.filter(d => {
          if (!d.equipo) return false;
          const dEq = d.equipo.toLowerCase().trim();
          return dEq === cat || dEq === nom || nom.includes(dEq) || dEq.includes(nom);
        });

        const players = RendimientoStore.getJugadores();
        alerts = alerts.filter(a => {
          const p = players.find(x => x.nombre === a.jugador || x.id === a.jugadorId);
          if (!p || !p.categoria) return false;
          const pCat = p.categoria.toLowerCase().trim();
          return pCat === cat || pCat === nom || nom.includes(pCat) || pCat.includes(nom);
        });
      }
    }

    setPlayerLoads(data);
    setAlertas(alerts);
    setSelected(s => {
      const found = data.find(d => d.jugadorId === s?.jugadorId);
      return found ?? data[0] ?? null;
    });
  };

  useEffect(() => {
    loadData();
  }, [myCategories, isAdmin, selectedTeamName]);

  useEffect(() => {
    setLiveLoad(calcCargaInterna(form.duracion, form.rpe));
  }, [form.duracion, form.rpe]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error("El nombre de la sesión es obligatorio"); return; }
    RendimientoStore.addSesionCompleta(form);
    toast.success(`✅ Sesión registrada — Carga: ${liveLoad} AU`);
    setOpenReg(false);
    setForm({ ...BLANK_SESION });
    loadData();
  };

  // Stats globales del equipo
  const teamStats = useMemo(() => {
    if (!playerLoads.length) return { verde: 0, amarillo: 0, rojo: 0, avgAcwr: 0, avgFatiga: 0, avgRecovery: 0 };
    return {
      verde:       playerLoads.filter(d => d.semaforo === "verde").length,
      amarillo:    playerLoads.filter(d => d.semaforo === "amarillo").length,
      rojo:        playerLoads.filter(d => d.semaforo === "rojo").length,
      avgAcwr:     Math.round((playerLoads.reduce((a, d) => a + d.acwr, 0) / playerLoads.length) * 100) / 100,
      avgFatiga:   Math.round(playerLoads.reduce((a, d) => a + d.fatigaScore, 0) / playerLoads.length),
      avgRecovery: Math.round(playerLoads.reduce((a, d) => a + d.recoveryScore, 0) / playerLoads.length),
    };
  }, [playerLoads]);

  // Filtrar historial
  const historialFiltrado = useMemo(() => {
    if (!selected) return [];
    const days = parseInt(filtroHistorial);
    return selected.historialCargas.slice(-days);
  }, [selected, filtroHistorial]);

  // Datos del atleta seleccionado
  const fatigaColor  = selected
    ? selected.fatigaScore >= 75 ? "#ef4444" : selected.fatigaScore >= 55 ? "#f59e0b" : "#10b981"
    : "#10b981";
  const recoveryColor = selected
    ? selected.recoveryScore >= 75 ? "#10b981" : selected.recoveryScore >= 55 ? "#f59e0b" : "#ef4444"
    : "#10b981";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-elegant">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Control de Cargas</h1>
            <p className="text-sm text-muted-foreground">Motor ACWR · Fatiga · Recuperación · Semáforo de Riesgo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Equipo:</span>
          <select
            value={selectedTeamName}
            onChange={(e) => setSelectedTeamName(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs font-bold shadow-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground"
          >
            <option value="all">Todos los equipos</option>
            {myTeams.map((t) => (
              <option key={t.id} value={t.nombre}>
                {t.nombre}
              </option>
            ))}
          </select>
          {alertas.filter(a => a.severidad === "critica").length > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <Bell className="h-3 w-3" /> {alertas.filter(a => a.severidad === "critica").length} críticas
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar
          </Button>
          {/* Registro Sheet */}
          <Sheet open={openReg} onOpenChange={setOpenReg}>
            <SheetTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-elegant gap-1">
                <Plus className="h-4 w-4" /> Registrar Entrenamiento
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-500" /> Registrar Entrenamiento
                </SheetTitle>
                <SheetDescription>Carga = Duración × RPE. Se calcula automáticamente.</SheetDescription>
              </SheetHeader>

              <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                {/* Live Carga Preview */}
                <div className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Carga Interna Estimada</p>
                  <p className="text-4xl font-black text-amber-600 mt-1">{liveLoad} <span className="text-xl font-semibold">AU</span></p>
                  <p className="text-xs text-muted-foreground">{form.duracion} min × RPE {form.rpe} = {liveLoad}</p>
                </div>

                {/* Nombre */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nombre de la sesión *</label>
                  <input
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                    placeholder="Ej: Físico aeróbico, Táctico defensivo..."
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </div>

                {/* Fecha + Hora */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha</label>
                    <input type="date" className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                      value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hora</label>
                    <input type="time" className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                      value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} />
                  </div>
                </div>

                {/* Equipo + Lugar */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Equipo</label>
                    <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                      value={form.equipo} onChange={e => setForm({ ...form, equipo: e.target.value })}>
                      {EQUIPOS.map(eq => <option key={eq}>{eq}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lugar</label>
                    <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                      value={form.lugar} onChange={e => setForm({ ...form, lugar: e.target.value })}>
                      {LUGARES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                {/* Entrenador + Tipo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entrenador</label>
                    <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                      value={form.entrenador} onChange={e => setForm({ ...form, entrenador: e.target.value })}>
                      {ENTRENADORES.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo</label>
                    <select className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                      value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoEntrenamiento })}>
                      {TIPOS_ENTRENAMIENTO.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Duración */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duración</label>
                    <span className="text-sm font-bold text-amber-600">{form.duracion} minutos</span>
                  </div>
                  <input type="range" min="15" max="180" step="5" value={form.duracion}
                    onChange={e => setForm({ ...form, duracion: Number(e.target.value) })}
                    className="w-full h-2 rounded-full accent-amber-500" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>15 min</span><span>90 min</span><span>180 min</span>
                  </div>
                </div>

                {/* Intensidad */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Intensidad</label>
                  <div className="flex gap-2 flex-wrap">
                    {INTENSIDADES.map((nivel, i) => {
                      const colors = ["bg-sky-100 border-sky-200 text-sky-700", "bg-green-100 border-green-200 text-green-700",
                        "bg-amber-100 border-amber-200 text-amber-700", "bg-orange-100 border-orange-200 text-orange-700",
                        "bg-red-100 border-red-200 text-red-700"];
                      const sel = form.intensidad === nivel;
                      return (
                        <button type="button" key={nivel}
                          onClick={() => setForm({ ...form, intensidad: nivel })}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                            sel ? `${colors[i]} scale-105 shadow-md` : "border-border hover:border-primary/40"
                          }`}>
                          {nivel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RPE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      RPE — Esfuerzo Percibido
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black" style={{ color: RPE_LABELS[form.rpe]?.color }}>{form.rpe}</span>
                      <span className="text-xs text-muted-foreground">{RPE_LABELS[form.rpe]?.label}</span>
                    </div>
                  </div>
                  <input type="range" min="1" max="10" value={form.rpe}
                    onChange={e => setForm({ ...form, rpe: Number(e.target.value) })}
                    className="w-full h-3 rounded-full" style={{ accentColor: RPE_LABELS[form.rpe]?.color }} />
                  {/* RPE Reference Scale */}
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {[1,3,5,7,10].map(v => (
                      <div key={v} className="rounded-lg border p-1" style={{ borderColor: `${RPE_LABELS[v]?.color}40`, background: `${RPE_LABELS[v]?.color}10` }}>
                        <p className="text-xs font-bold" style={{ color: RPE_LABELS[v]?.color }}>{v}</p>
                        <p className="text-[9px] text-muted-foreground leading-tight">{RPE_LABELS[v]?.label.split(" ")[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas (opcional)</label>
                  <textarea className="w-full rounded-xl border bg-background px-3 py-2 text-sm min-h-[60px] resize-none"
                    placeholder="Observaciones del entrenamiento..."
                    value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setOpenReg(false)}>Cancelar</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-elegant">
                    <Flame className="mr-1 h-4 w-4" /> Registrar Carga
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {playerLoads.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Info className="h-10 w-10 text-muted-foreground animate-pulse" />
            <p className="text-sm font-medium">No hay datos de control de cargas para este equipo</p>
            <p className="text-xs text-center max-w-sm">Asegúrate de que hay jugadores asignados a la categoría de este equipo y que tengan encuestas de Wellness o entrenamientos guardados.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Team Overview Banner */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              { label: "🟢 Óptimo",       value: teamStats.verde,       cls: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30" },
              { label: "🟡 Precaución",   value: teamStats.amarillo,    cls: "text-amber-600   bg-amber-50   border-amber-200   dark:bg-amber-950/20   dark:border-amber-800/30"   },
              { label: "🔴 Alto Riesgo",  value: teamStats.rojo,        cls: "text-red-600     bg-red-50     border-red-200     dark:bg-red-950/20     dark:border-red-700"        },
              { label: "ACWR Equipo",     value: teamStats.avgAcwr.toFixed(2), cls: "text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800/30" },
              { label: "Fatiga Prom.",    value: `${teamStats.avgFatiga}%`,    cls: "text-sky-600    bg-sky-50    border-sky-200    dark:bg-sky-950/20    dark:border-sky-800/30"    },
              { label: "Recovery Prom.", value: `${teamStats.avgRecovery}%`,   cls: "text-teal-600   bg-teal-50   border-teal-200   dark:bg-teal-950/20   dark:border-teal-800/30"   },
            ].map(c => (
              <div key={c.label} className={`rounded-2xl border p-3 text-center shadow-card ${c.cls}`}>
                <p className="text-2xl font-black">{c.value}</p>
                <p className="text-[10px] font-semibold mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Athlete Selector */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {playerLoads.map(d => (
          <button key={d.jugadorId} onClick={() => setSelected(d)}
            className={`rounded-2xl border p-4 text-left transition-all hover:shadow-elegant hover:-translate-y-0.5 ${
              selected?.jugadorId === d.jugadorId ? "border-primary bg-primary/5 shadow-elegant" : "bg-card"
            }`}>
            <div className="flex items-center gap-3 mb-3">
              <img src={d.avatar} alt="" className="h-10 w-10 rounded-full ring-2 ring-border" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{d.jugador}</p>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-muted text-muted-foreground border-none font-bold">
                    {d.equipo}
                  </Badge>
                  <SemaforoBadge color={d.semaforo} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">ACWR</p>
                <p className="font-bold">{d.acwr.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Carga Semanal</p>
                <p className="font-bold">{d.cargaSemanal} AU</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fatiga</p>
                <p className="font-bold" style={{ color: d.fatigaScore >= 70 ? "#ef4444" : d.fatigaScore >= 50 ? "#f59e0b" : "#10b981" }}>
                  {d.fatigaScore}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Recovery</p>
                <p className="font-bold" style={{ color: d.recoveryScore >= 70 ? "#10b981" : d.recoveryScore >= 50 ? "#f59e0b" : "#ef4444" }}>
                  {d.recoveryScore}%
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Detail Section */}
      {selected && (
        <Tabs defaultValue="dashboard">
          <TabsList className="h-9 rounded-xl flex-wrap">
            <TabsTrigger value="dashboard"  className="rounded-lg text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="semaforo"   className="rounded-lg text-xs">
              Semáforo
              {selected.semaforo !== "verde" && (
                <span className={`ml-1 h-2 w-2 rounded-full ${selected.semaforo === "rojo" ? "bg-red-500" : "bg-amber-500"}`} />
              )}
            </TabsTrigger>
            <TabsTrigger value="historial"  className="rounded-lg text-xs">Historial</TabsTrigger>
            <TabsTrigger value="alertas"    className="rounded-lg text-xs">
              Alertas
              {alertas.filter(a => a.jugadorId === selected.jugadorId).length > 0 && (
                <span className="ml-1 rounded-full bg-destructive text-destructive-foreground text-[9px] px-1">
                  {alertas.filter(a => a.jugadorId === selected.jugadorId).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── DASHBOARD TAB ─────────────────────────────────────────── */}
          <TabsContent value="dashboard" className="space-y-4 mt-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Left: Score Circles + ACWR */}
              <div className="space-y-4">
                {/* Score Circles */}
                <Card className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{selected.jugador}</CardTitle>
                    <CardDescription>Estado físico calculado en tiempo real</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-around">
                      <ScoreCircle score={selected.fatigaScore}  label={`Fatiga ${selected.fatigaScore >= 75 ? "⚠️" : ""}`} color={fatigaColor} />
                      <ScoreCircle score={selected.recoveryScore} label="Recovery"  color={recoveryColor} />
                    </div>
                    <SemaforoBadge color={selected.semaforo} size="lg" />
                  </CardContent>
                </Card>

                {/* ACWR */}
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-primary" /> ACWR
                    </CardTitle>
                    <CardDescription>Ratio Carga Aguda : Carga Crónica</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ACWRGauge acwr={selected.acwr} />
                  </CardContent>
                </Card>
              </div>

              {/* Right: 8 metric cards */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Carga Hoy",      value: `${selected.cargaHoy}`,        suffix: " AU", color: "from-amber-500 to-orange-400",   icon: Flame },
                  { label: "Carga Semanal",   value: `${selected.cargaSemanal}`,    suffix: " AU", color: "from-orange-500 to-red-400",      icon: BarChart3 },
                  { label: "Carga Mensual",   value: `${selected.cargaMensual}`,    suffix: " AU", color: "from-violet-500 to-purple-400",   icon: TrendingUp },
                  { label: "Carga Temporada", value: `${selected.cargaTemporada}`,  suffix: " AU", color: "from-indigo-500 to-blue-400",     icon: Activity },
                  { label: "Carga Aguda",     value: `${selected.cargaAguda}`,      suffix: " AU", color: "from-rose-500 to-pink-400",       icon: Zap },
                  { label: "Carga Crónica",   value: `${selected.cargaCronica}`,    suffix: " AU", color: "from-sky-500 to-cyan-400",        icon: Brain },
                  { label: "Carga Máxima",    value: `${selected.cargaMaxima}`,     suffix: " AU", color: "from-emerald-500 to-teal-400",    icon: TrendingUp },
                  { label: "Recovery",        value: `${selected.recoveryScore}`,   suffix: "%",   color: "from-teal-500 to-green-400",      icon: Heart },
                ].map(c => (
                  <Card key={c.label} className="shadow-card overflow-hidden">
                    <CardContent className="p-4">
                      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${c.color} text-white`}>
                        <c.icon className="h-4 w-4" />
                      </div>
                      <div className="flex items-end gap-0.5">
                        <span className="text-xl font-black">{c.value}</span>
                        <span className="text-xs text-muted-foreground mb-0.5">{c.suffix}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Timeline Quick Chart */}
            <Card className="shadow-card">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Evolución de Carga — {selected.jugador}
                  </CardTitle>
                  <CardDescription>Carga diaria, fatiga y recovery — últimas 2 semanas</CardDescription>
                </div>
                <div className="flex rounded-lg border bg-muted/30 p-0.5">
                  {(["7","14","28"] as const).map(f => (
                    <button key={f} onClick={() => setFiltroHistorial(f)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${filtroHistorial === f ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {f}d
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={historialFiltrado} margin={{ left: -10, right: 5, top: 5 }}>
                    <defs>
                      <linearGradient id="gCarga" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="fecha" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="carga"   stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="score"   orientation="right" domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine yAxisId="carga" y={400} stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.4} />
                    <Area yAxisId="carga"  type="monotone" dataKey="carga"    name="Carga AU"   stroke="#f59e0b" fill="url(#gCarga)"  strokeWidth={2} dot={false} />
                    <Line yAxisId="score"  type="monotone" dataKey="fatiga"   name="Fatiga %"   stroke="#ef4444" strokeWidth={2}      dot={false} strokeDasharray="5 2" />
                    <Line yAxisId="score"  type="monotone" dataKey="recovery" name="Recovery %"  stroke="#10b981" strokeWidth={2}     dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SEMAFORO TAB ──────────────────────────────────────────── */}
          <TabsContent value="semaforo" className="mt-4">
            <SemaforoGrande data={selected} />
          </TabsContent>

          {/* ── HISTORIAL TAB ─────────────────────────────────────────── */}
          <TabsContent value="historial" className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Período:</p>
              {(["7","14","28"] as const).map(f => (
                <button key={f} onClick={() => setFiltroHistorial(f)}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition-all ${filtroHistorial === f ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary/40"}`}>
                  {f === "7" ? "Últimos 7 días" : f === "14" ? "Últimas 2 semanas" : "Últimos 28 días"}
                </button>
              ))}
            </div>

            {/* Carga diaria */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Carga Diaria</CardTitle>
                <CardDescription>Historial de unidades de carga (AU) por sesión</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historialFiltrado} margin={{ left: -10, right: 5, top: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="fecha" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 11 }} />
                    <ReferenceLine y={400} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.6} label={{ value: "Umbral", fill: "#f59e0b", fontSize: 9 }} />
                    <Bar dataKey="carga" name="Carga AU" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fatiga & Recovery chart */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fatiga vs Recovery</CardTitle>
                <CardDescription>Evolución del estado físico — zona óptima: fatiga baja y recovery alta</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historialFiltrado} margin={{ left: -10, right: 5, top: 5 }}>
                    <defs>
                      <linearGradient id="gFat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="fecha" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="fatiga"   name="Fatiga %"    stroke="#ef4444" fill="url(#gFat)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="recovery" name="Recovery %"  stroke="#10b981" fill="url(#gRec)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ALERTAS TAB ───────────────────────────────────────────── */}
          <TabsContent value="alertas" className="space-y-3 mt-4">
            {alertas.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center py-12 gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <p className="text-sm font-medium">Sin alertas activas</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{alertas.length} alerta(s) activa(s)</p>
                </div>
                {alertas.map(a => (
                  <div key={a.id} className={`rounded-2xl border p-4 flex items-start gap-3 ${
                    a.severidad === "critica" ? "border-red-200 bg-red-50/80 dark:border-red-800/30 dark:bg-red-950/10"
                    : "border-amber-200 bg-amber-50/80 dark:border-amber-800/30 dark:bg-amber-950/10"
                  }`}>
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      a.severidad === "critica" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{a.jugador}</p>
                        <Badge variant="outline" className={`text-[10px] capitalize ${
                          a.severidad === "critica" ? "border-red-400 text-red-600" : "border-amber-400 text-amber-700"
                        }`}>
                          {a.severidad}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium mt-0.5">{a.mensaje}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{a.detalle}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{a.fecha}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
        </>
      )}
    </div>
  );
}
