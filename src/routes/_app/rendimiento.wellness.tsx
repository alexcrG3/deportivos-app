import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RendimientoStore, {
  type WellnessRegistro,
  type WellnessAlerta,
  type WellnessSuenoLabel,
  type WellnessDolorLabel,
  type WellnessEstresLabel,
  type WellnessAnimoEmoji,
  type WellnessSensacionLabel,
  calcWellnessScore,
  sportsScoreLabel,
} from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import {
  Moon, Zap, Brain, Heart, Smile, Star, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, ChevronRight, Plus, X, Clock, Activity,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} from "recharts";

export const Route = createFileRoute("/_app/rendimiento/wellness")({ component: WellnessPage });

// ─── Score Ring Component ─────────────────────────────────────────────────────
function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 16) / 2;
  const circ = 2 * Math.PI * radius;
  const pct  = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * circ;
  const { label: lbl, color } = sportsScoreLabel(score);

  const gradId = `wring-${Math.round(score)}`;
  const strokeColor =
    score >= 90 ? "#10b981" : score >= 75 ? "#0ea5e9" : score >= 55 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.6} />
            <stop offset="100%" stopColor={strokeColor} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor"
          strokeWidth={8} className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={`url(#${gradId})`} strokeWidth={8}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold leading-none ${size > 100 ? "text-3xl" : "text-xl"} ${color}`}>{score}</span>
        {label && <span className="text-[10px] text-muted-foreground mt-0.5">{label || lbl}</span>}
      </div>
    </div>
  );
}

// ─── Semaphore Dot ────────────────────────────────────────────────────────────
function SemaforoDot({ score }: { score: number }) {
  const cls = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-orange-500" : "bg-red-500";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls} shadow-sm`} />;
}

// ─── WellnessButton ───────────────────────────────────────────────────────────
function WellnessButton({
  label, selected, onClick, colorClass = "bg-primary/10 border-primary/20 hover:border-primary text-primary",
}: { label: string; selected: boolean; onClick: () => void; colorClass?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 ${
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
          : `${colorClass} opacity-80 hover:opacity-100 hover:scale-[1.03]`
      }`}
    >
      {label}
    </button>
  );
}

const SUENO_OPTIONS: Array<{ label: WellnessSuenoLabel; val: number }> = [
  { label: "Muy malo", val: 1 }, { label: "Malo", val: 2 }, { label: "Regular", val: 3 },
  { label: "Bueno", val: 4 }, { label: "Excelente", val: 5 },
];
const DOLOR_OPTIONS: Array<{ label: WellnessDolorLabel; val: number }> = [
  { label: "Ninguno", val: 1 }, { label: "Leve", val: 2 }, { label: "Moderado", val: 3 },
  { label: "Alto", val: 4 }, { label: "Muy alto", val: 5 },
];
const ESTRES_OPTIONS: Array<{ label: WellnessEstresLabel; val: number }> = [
  { label: "Muy bajo", val: 1 }, { label: "Bajo", val: 2 }, { label: "Normal", val: 3 },
  { label: "Alto", val: 4 }, { label: "Muy alto", val: 5 },
];
const ANIMO_OPTIONS: Array<{ label: WellnessAnimoEmoji; val: number }> = [
  { label: "😊", val: 5 }, { label: "🙂", val: 4 }, { label: "😐", val: 3 },
  { label: "🙁", val: 2 }, { label: "😫", val: 1 },
];
const SENSACION_OPTIONS: Array<{ label: WellnessSensacionLabel; val: number }> = [
  { label: "Excelente", val: 5 }, { label: "Buena", val: 4 }, { label: "Regular", val: 3 },
  { label: "Mala", val: 2 }, { label: "Muy mala", val: 1 },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
function WellnessPage() {
  const [logs, setLogs]         = useState<WellnessRegistro[]>([]);
  const [alertas, setAlertas]   = useState<WellnessAlerta[]>([]);
  const [showCheckin, setShowCheckin] = useState(false);

  const { role, coachName } = useRole();
  const isAdmin = role === "admin";

  const myTeams = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (isAdmin) return all;
    return all.filter(t => t.entrenador === coachName);
  }, [isAdmin, coachName]);

  const myCategories = useMemo(() => myTeams.map(t => t.categoria), [myTeams]);

  const activePlayers = useMemo(() => {
    const raw = RendimientoStore.getJugadores();
    if (isAdmin) return raw;
    return raw.filter(p => myCategories.includes(p.categoria));
  }, [isAdmin, myCategories]);

  const JUGADORES_MAP = useMemo(() => {
    const map: Record<string, string> = {};
    activePlayers.forEach(p => {
      map[p.id] = p.nombre;
    });
    return map;
  }, [activePlayers]);

  const BLANK_FORM = useMemo(() => {
    const firstPlayer = activePlayers[0];
    return {
      jugadorId:    firstPlayer?.id || "",
      jugador:      firstPlayer?.nombre || "",
      fecha:        new Date().toISOString().split("T")[0],
      sueñoHoras:   8,
      sueñoCalidad: 0 as number,
      fatiga:       0 as number,
      estres:       0 as number,
      dolorMuscular:0 as number,
      animo:        0 as number,
      energia:      0 as number,
      motivacion:   3,
      suenoLabel:   "" as WellnessSuenoLabel | "",
      dolorLabel:   "" as WellnessDolorLabel | "",
      estresLabel:  "" as WellnessEstresLabel | "",
      animoEmoji:   "" as WellnessAnimoEmoji | "",
      sensacionLabel: "" as WellnessSensacionLabel | "",
    };
  }, [activePlayers]);

  const [form, setForm]         = useState({
    jugadorId:    "",
    jugador:      "",
    fecha:        new Date().toISOString().split("T")[0],
    sueñoHoras:   8,
    sueñoCalidad: 0,
    fatiga: 0,
    estres: 0,
    dolorMuscular: 0,
    animo: 0,
    energia: 0,
    motivacion: 3,
    suenoLabel: "" as any,
    dolorLabel: "" as any,
    estresLabel: "" as any,
    animoEmoji: "" as any,
    sensacionLabel: "" as any,
  });

  useEffect(() => {
    setForm(BLANK_FORM);
  }, [BLANK_FORM]);

  const [liveScore, setLiveScore] = useState(0);
  const [filtro, setFiltro]     = useState<"hoy" | "semana" | "mes">("semana");
  const [jugFiltro, setJugFiltro] = useState("todos");

  const loadData = () => {
    let w = RendimientoStore.getWellness();
    let a = RendimientoStore.getWellnessAlertas();
    if (!isAdmin) {
      w = w.filter(x => {
        const p = activePlayers.find(pl => pl.id === x.jugadorId);
        return p !== undefined;
      });
      a = a.filter(al => {
        const p = activePlayers.find(pl => pl.id === al.jugadorId);
        return p !== undefined;
      });
    }
    setLogs(w);
    setAlertas(a);
  };

  useEffect(() => {
    loadData();
  }, [activePlayers, isAdmin]);

  // Live score preview
  useEffect(() => {
    if (form.sueñoCalidad && form.dolorMuscular && form.estres && form.animo && form.energia) {
      setLiveScore(calcWellnessScore(form as any));
    }
  }, [form]);

  const isFormComplete =
    form.sueñoCalidad > 0 && form.dolorMuscular > 0 &&
    form.estres > 0 && form.animo > 0 && form.energia > 0 && form.sensacionLabel;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) {
      toast.error("Completa todas las preguntas antes de guardar");
      return;
    }
    RendimientoStore.addWellness({
      ...form as any,
      motivacion: form.energia, // map energy to motivacion
    });
    toast.success("✅ Wellness registrado correctamente", { description: `Score: ${liveScore}` });
    setShowCheckin(false);
    setForm({ ...BLANK_FORM });
    loadData();
  };

  // Filter logs
  const now = new Date();
  const filteredLogs = logs.filter(l => {
    const d = new Date(l.fecha);
    if (filtro === "hoy") {
      return l.fecha === now.toISOString().split("T")[0];
    }
    if (filtro === "semana") {
      const s = new Date(now); s.setDate(now.getDate() - 7);
      return d >= s;
    }
    const s = new Date(now); s.setDate(now.getDate() - 30);
    return d >= s;
  }).filter(l => jugFiltro === "todos" || l.jugadorId === jugFiltro);

  // Stats
  const avgScore   = filteredLogs.length ? Math.round(filteredLogs.reduce((a, l) => a + (l.wellnessScore || l.score || 0), 0) / filteredLogs.length) : 0;
  const avgSueno   = filteredLogs.length ? (filteredLogs.reduce((a, l) => a + l.sueñoHoras, 0) / filteredLogs.length).toFixed(1) : "0.0";
  const avgEnergia = filteredLogs.length ? (filteredLogs.reduce((a, l) => a + l.energia, 0) / filteredLogs.length).toFixed(1) : "0";
  const avgDolor   = filteredLogs.length ? (filteredLogs.reduce((a, l) => a + l.dolorMuscular, 0) / filteredLogs.length).toFixed(1) : "0";

  // Chart data (timeline)
  const timelineData = [...filteredLogs]
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .reduce<Array<{ fecha: string; wellnessScore: number; sueño: number; dolor: number; estres: number; energia: number }>>((acc, l) => {
      const key = l.fecha;
      const ex = acc.find(x => x.fecha === key);
      if (ex) {
        ex.wellnessScore = Math.round((ex.wellnessScore + (l.wellnessScore || l.score || 0)) / 2);
      } else {
        acc.push({
          fecha:        key.slice(5),
          wellnessScore: l.wellnessScore || l.score || 0,
          sueño:        l.sueñoCalidad * 20,
          dolor:        (6 - l.dolorMuscular) * 20,
          estres:       (6 - l.estres) * 20,
          energia:      l.energia * 20,
        });
      }
      return acc;
    }, []);

  // Radar data for latest entry per athlete
  const latestPerJugador = Object.values(
    filteredLogs.reduce<Record<string, WellnessRegistro>>((acc, l) => {
      if (!acc[l.jugadorId] || l.fecha > acc[l.jugadorId].fecha) acc[l.jugadorId] = l;
      return acc;
    }, {})
  );

  const radarData = [
    { indicator: "Sueño",   ...Object.fromEntries(latestPerJugador.map(l => [l.jugador.split(" ")[0], l.sueñoCalidad * 20])) },
    { indicator: "Energía", ...Object.fromEntries(latestPerJugador.map(l => [l.jugador.split(" ")[0], l.energia * 20])) },
    { indicator: "Ánimo",   ...Object.fromEntries(latestPerJugador.map(l => [l.jugador.split(" ")[0], l.animo * 20])) },
    { indicator: "Dolor▼",  ...Object.fromEntries(latestPerJugador.map(l => [l.jugador.split(" ")[0], (6 - l.dolorMuscular) * 20])) },
    { indicator: "Estrés▼", ...Object.fromEntries(latestPerJugador.map(l => [l.jugador.split(" ")[0], (6 - l.estres) * 20])) },
  ];
  const radarColors = ["#10b981", "#0ea5e9", "#f59e0b", "#ef4444"];

  const getAnimoLabel = (val: number) => ["", "😫", "🙁", "😐", "🙂", "😊"][val] || "–";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-elegant">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Wellness</h1>
            <p className="text-sm text-muted-foreground">Monitoreo diario de bienestar del atleta · check-in en 20 segundos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/rendimiento/sports-science">
            <Button variant="outline" size="sm" className="gap-1">
              <Activity className="h-4 w-4" /> Sports Science
            </Button>
          </Link>
          <Button
            className="bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-elegant gap-1"
            onClick={() => setShowCheckin(true)}
          >
            <Plus className="h-4 w-4" /> Registrar Wellness
          </Button>
        </div>
      </div>

      {/* Alertas activas */}
      {alertas.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-900/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{alertas.length} alertas activas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertas.slice(0, 4).map(a => (
              <Badge key={a.id} variant="outline" className={`text-xs gap-1 ${a.severidad === "critica" ? "border-red-400 text-red-600" : "border-amber-400 text-amber-700"}`}>
                <AlertTriangle className="h-3 w-3" />
                {a.jugador.split(" ")[0]} — {a.mensaje}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Heart,  label: "Wellness Promedio", value: `${avgScore}`,      suffix: "/100",   color: "from-emerald-500 to-teal-400" },
          { icon: Moon,   label: "Horas Sueño",       value: `${avgSueno}`,      suffix: " hrs",   color: "from-sky-500 to-blue-400" },
          { icon: Zap,    label: "Energía Promedio",  value: `${avgEnergia}`,    suffix: "/5",     color: "from-amber-500 to-orange-400" },
          { icon: Brain,  label: "Dolor Muscular",    value: `${avgDolor}`,      suffix: "/5",     color: "from-violet-500 to-purple-400" },
        ].map(c => (
          <Card key={c.label} className="shadow-card overflow-hidden">
            <CardContent className="p-4">
              <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${c.color} text-white`}>
                <c.icon className="h-4 w-4" />
              </div>
              <div className="flex items-end gap-0.5">
                <span className="text-2xl font-bold">{c.value}</span>
                <span className="text-sm text-muted-foreground mb-0.5">{c.suffix}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border bg-muted/30 p-0.5">
          {(["hoy", "semana", "mes"] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all ${filtro === f ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
        <select
          value={jugFiltro}
          onChange={e => setJugFiltro(e.target.value)}
          className="h-8 rounded-lg border bg-background px-2 text-xs"
        >
          <option value="todos">Todos los atletas</option>
          {Object.entries(JUGADORES_MAP).map(([id, n]) => (
            <option key={id} value={id}>{n}</option>
          ))}
        </select>
      </div>

      {/* Charts */}
      {filteredLogs.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Timeline */}
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Evolución del Wellness</CardTitle>
              <CardDescription>Score de bienestar, sueño y energía en el tiempo</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ left: -10, right: 5, top: 5 }}>
                  <defs>
                    <linearGradient id="gWellness" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gSueno" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="fecha" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="wellnessScore" name="Wellness" stroke="#10b981" fill="url(#gWellness)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="sueño"         name="Sueño"    stroke="#0ea5e9" fill="url(#gSueno)"    strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="energia"       name="Energía"  stroke="#f59e0b" fill="none"            strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Radar del Equipo</CardTitle>
              <CardDescription>Comparación por indicadores hoy</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius={75}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                  {latestPerJugador.slice(0, 4).map((l, i) => (
                    <Radar key={l.jugadorId} name={l.jugador.split(" ")[0]}
                      dataKey={l.jugador.split(" ")[0]} stroke={radarColors[i]}
                      fill={radarColors[i]} fillOpacity={0.1} strokeWidth={1.5} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center text-muted-foreground shadow-card bg-card">
          <Activity className="h-10 w-10 mx-auto text-primary opacity-60 mb-3 animate-pulse" />
          <p className="text-sm font-bold">Sin datos de Wellness suficientes</p>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
            Aún no se han registrado encuestas de bienestar para los atletas de esta categoría en el período seleccionado.
          </p>
        </Card>
      )}

      {/* Athlete List */}
      <Card className="shadow-card">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Semáforo de Bienestar</CardTitle>
            <CardDescription>Estado y último registro por atleta</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">{latestPerJugador.length} atletas</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {latestPerJugador.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Sin registros para el período seleccionado</p>
          )}
          {latestPerJugador.map(l => {
            const score = l.wellnessScore || l.score || 0;
            const { label: lbl, color } = sportsScoreLabel(score);
            const players = RendimientoStore.getJugadores();
            const playerRec = players.find(p => p.id === l.jugadorId);
            const avatarUrl = l.avatar || playerRec?.avatar || `https://i.pravatar.cc/100?u=${l.jugadorId}`;
            return (
              <div key={l.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:shadow-elegant transition-all hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <img src={avatarUrl}
                    alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-border" />
                  <div>
                    <p className="font-semibold text-sm">{l.jugador}</p>
                    <p className="text-xs text-muted-foreground">
                      {l.fecha} · {l.hora || "–"}
                      {" · "}😴 {l.suenoLabel || `${l.sueñoCalidad}/5`}
                      {" · "}💪 {l.dolorLabel || `Dolor ${l.dolorMuscular}/5`}
                      {" · "}{getAnimoLabel(l.animo)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto sm:ml-0">
                  <ScoreRing score={score} size={56} label="" />
                  <div className="text-right">
                    <p className={`text-sm font-bold ${color}`}>{lbl}</p>
                    <p className="text-xs text-muted-foreground">{score}/100</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Check-In Modal */}
      {showCheckin && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowCheckin(false); }}>
          <div className="w-full sm:max-w-lg rounded-2xl border bg-background shadow-2xl overflow-y-auto max-h-[90vh]">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white">
                    <Heart className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">Check-In Wellness</h2>
                    <p className="text-xs text-muted-foreground">~20 segundos · guarda automáticamente</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isFormComplete && <ScoreRing score={liveScore} size={48} label="" />}
                  <button type="button" onClick={() => setShowCheckin(false)} className="rounded-lg p-1.5 hover:bg-muted transition">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Atleta */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Atleta</label>
                  <select
                    className="w-full rounded-xl border bg-muted/30 px-3 py-2 text-sm"
                    value={form.jugadorId}
                    onChange={e => setForm({ ...form, jugadorId: e.target.value, jugador: JUGADORES_MAP[e.target.value] })}
                  >
                    {Object.entries(JUGADORES_MAP).map(([id, n]) => (
                      <option key={id} value={id}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Sueño */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Moon className="h-3.5 w-3.5" /> Calidad del Sueño
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {SUENO_OPTIONS.map(o => (
                      <WellnessButton key={o.label} label={o.label} selected={form.suenoLabel === o.label}
                        onClick={() => setForm({ ...form, suenoLabel: o.label, sueñoCalidad: o.val })} />
                    ))}
                  </div>
                </div>

                {/* Dolor Muscular */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Activity className="h-3.5 w-3.5" /> Dolor Muscular
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {DOLOR_OPTIONS.map(o => (
                      <WellnessButton key={o.label} label={o.label} selected={form.dolorLabel === o.label}
                        colorClass={o.val >= 4 ? "bg-red-50 border-red-200 hover:border-red-400 text-red-700 dark:bg-red-950/20" : "bg-primary/10 border-primary/20 hover:border-primary text-primary"}
                        onClick={() => setForm({ ...form, dolorLabel: o.label, dolorMuscular: o.val })} />
                    ))}
                  </div>
                </div>

                {/* Estrés */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Brain className="h-3.5 w-3.5" /> Nivel de Estrés
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {ESTRES_OPTIONS.map(o => (
                      <WellnessButton key={o.label} label={o.label} selected={form.estresLabel === o.label}
                        onClick={() => setForm({ ...form, estresLabel: o.label, estres: o.val })} />
                    ))}
                  </div>
                </div>

                {/* Estado de Ánimo */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Smile className="h-3.5 w-3.5" /> Estado de Ánimo
                  </label>
                  <div className="flex gap-2">
                    {ANIMO_OPTIONS.map(o => (
                      <button
                        type="button" key={o.label}
                        onClick={() => setForm({ ...form, animoEmoji: o.label, animo: o.val })}
                        className={`flex-1 rounded-xl border py-2.5 text-2xl transition-all duration-200 ${
                          form.animoEmoji === o.label ? "border-primary bg-primary/10 scale-110 shadow-md" : "border-border hover:border-primary/50 hover:scale-105"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energía */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Zap className="h-3.5 w-3.5" /> Nivel de Energía
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        type="button" key={v}
                        onClick={() => setForm({ ...form, energia: v })}
                        className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-all duration-200 ${
                          form.energia === v ? "border-amber-400 bg-amber-400 text-white scale-110 shadow-md" :
                          form.energia > 0 && v <= form.energia ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/20" :
                          "border-border hover:border-amber-300"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sensación General */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Star className="h-3.5 w-3.5" /> Sensación General
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {SENSACION_OPTIONS.map(o => (
                      <WellnessButton key={o.label} label={o.label} selected={form.sensacionLabel === o.label}
                        onClick={() => setForm({ ...form, sensacionLabel: o.label, motivacion: o.val })} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t p-4 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCheckin(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormComplete}
                  className={`flex-1 transition-all ${isFormComplete ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-elegant" : "opacity-50"}`}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Guardar Wellness
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
