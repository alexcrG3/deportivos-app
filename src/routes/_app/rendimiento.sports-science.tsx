import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RendimientoStore, {
  type SportsScoreData,
  type WellnessAlerta,
  sportsScoreLabel,
  acwrToScore,
} from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import {
  Activity, HeartPulse, Heart, Flame, Gauge, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Shield, Zap, Brain, Moon, ChevronRight, RefreshCw,
  Bell, CheckCircle2, XCircle, Info, Dumbbell, Star, BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, BarChart, Bar, ReferenceLine, ComposedChart, Line,
} from "recharts";

export const Route = createFileRoute("/_app/rendimiento/sports-science")({
  component: SportsSciencePage,
});

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({
  score, size = 160, showLabel = true,
}: { score: number; size?: number; showLabel?: boolean }) {
  const radius   = (size - 20) / 2;
  const circ     = 2 * Math.PI * radius;
  const pct      = Math.min(100, Math.max(0, score));
  const dash     = (pct / 100) * circ;
  const { label, color } = sportsScoreLabel(score);
  const strokeColor =
    score >= 90 ? "#10b981" : score >= 75 ? "#0ea5e9" : score >= 55 ? "#f59e0b" : "#ef4444";

  const gradId = `ssring-${size}`;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.5} />
            <stop offset="100%" stopColor={strokeColor} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke="currentColor" strokeWidth={10} className="text-muted/20" />
        {/* Value */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={`url(#${gradId})`} strokeWidth={10}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className={`font-black leading-none ${size >= 160 ? "text-5xl" : size >= 120 ? "text-3xl" : "text-2xl"} ${color}`}>
          {score}
        </span>
        {showLabel && <span className={`text-xs font-semibold ${color} opacity-80`}>{label}</span>}
        {showLabel && size >= 160 && <span className="text-[10px] text-muted-foreground">Sports Score</span>}
      </div>
    </div>
  );
}

// ─── ACWR Gauge ───────────────────────────────────────────────────────────────
function ACWRGauge({ acwr }: { acwr: number }) {
  const pct = Math.min(2.5, acwr);
  const zones = [
    { label: "Bajo", from: 0,   to: 0.6, color: "#0ea5e9" },
    { label: "Verde",from: 0.6, to: 0.8, color: "#22c55e" },
    { label: "Óptimo",from:0.8, to: 1.3, color: "#10b981" },
    { label: "Alerta",from: 1.3,to: 1.5, color: "#f59e0b" },
    { label: "Riesgo",from: 1.5,to: 2.5, color: "#ef4444" },
  ];
  const zone = zones.find(z => acwr >= z.from && acwr < z.to) || zones[4];
  const posPercent = Math.min(99, (pct / 2.5) * 100);

  return (
    <div className="w-full">
      <div className="relative h-3 rounded-full overflow-hidden flex">
        {zones.map(z => (
          <div key={z.label} style={{ width: `${((z.to - z.from) / 2.5) * 100}%`, background: z.color, opacity: 0.85 }} />
        ))}
        {/* Cursor */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-5 w-1.5 rounded-full bg-white shadow-md border border-border transition-all duration-700"
          style={{ left: `${posPercent}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>0.0</span><span>0.8</span><span>1.3</span><span>1.5</span><span>2.5+</span>
      </div>
      <div className="mt-1 flex items-center gap-1">
        <span className="text-lg font-bold" style={{ color: zone.color }}>{acwr.toFixed(2)}</span>
        <Badge style={{ background: `${zone.color}20`, color: zone.color, borderColor: `${zone.color}40` }} variant="outline" className="text-[10px]">
          {zone.label}
        </Badge>
      </div>
    </div>
  );
}

// ─── Mini Score Bar ───────────────────────────────────────────────────────────
function MiniScoreBar({ value, color = "#10b981" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold w-7 text-right">{value}</span>
    </div>
  );
}

// ─── Tendencia Icon ───────────────────────────────────────────────────────────
function TendenciaIcon({ t }: { t: "subiendo" | "estable" | "bajando" }) {
  if (t === "subiendo") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (t === "bajando")  return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

// ─── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({
  icon: Icon, label, value, suffix = "", subtext, accent = "primary",
  onClick, clickable = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; suffix?: string;
  subtext?: string; accent?: string; onClick?: () => void; clickable?: boolean;
}) {
  const accentMap: Record<string, string> = {
    primary:     "from-violet-500 to-purple-400",
    emerald:     "from-emerald-500 to-teal-400",
    sky:         "from-sky-500 to-blue-400",
    amber:       "from-amber-500 to-orange-400",
    red:         "from-red-500 to-rose-400",
    indigo:      "from-indigo-500 to-violet-400",
    cyan:        "from-cyan-500 to-sky-400",
    fuchsia:     "from-fuchsia-500 to-pink-400",
  };
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-card p-4 shadow-card transition-all duration-200 ${
        clickable ? "cursor-pointer hover:shadow-elegant hover:-translate-y-1 hover:border-primary/30" : ""
      }`}
    >
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${accentMap[accent] || accentMap.primary} text-white shadow-md`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex items-end gap-0.5">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground mb-0.5">{suffix}</span>}
      </div>
      <p className="mt-0.5 text-xs font-medium">{label}</p>
      {subtext && <p className="text-[10px] text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  );
}

function SportsSciencePage() {
  const [data, setData]         = useState<SportsScoreData[]>([]);
  const [alertas, setAlertas]   = useState<WellnessAlerta[]>([]);
  const [selected, setSelected] = useState<SportsScoreData | null>(null);
  const [loading, setLoading]   = useState(true);
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
    setLoading(true);
    let d = RendimientoStore.getSportsScoreData();
    let a = RendimientoStore.getWellnessAlertas();

    if (!isAdmin) {
      d = d.filter(x => myCategories.includes(x.equipo));
      const players = RendimientoStore.getJugadores();
      a = a.filter(al => {
        const p = players.find(x => x.nombre === al.jugador || x.id === al.jugadorId);
        return p && myCategories.includes(p.categoria);
      });
    }

    if (selectedTeamName !== "all") {
      const selTeamObj = myTeams.find(t => t.nombre === selectedTeamName);
      console.log("SPORTS SCIENCE FILTER DEBUG:", {
        selectedTeamName,
        selTeamObj: selTeamObj ? { nombre: selTeamObj.nombre, categoria: selTeamObj.categoria } : null,
        dCategories: d.map(x => x.equipo),
      });
      if (selTeamObj) {
        const cat = (selTeamObj.categoria || "").toLowerCase().trim();
        const nom = (selTeamObj.nombre || "").toLowerCase().trim();
        
        d = d.filter(x => {
          if (!x.equipo) return false;
          const xEq = x.equipo.toLowerCase().trim();
          return xEq === cat || xEq === nom || nom.includes(xEq) || xEq.includes(nom);
        });

        const players = RendimientoStore.getJugadores();
        a = a.filter(al => {
          const p = players.find(x => x.nombre === al.jugador || x.id === al.jugadorId);
          if (!p || !p.categoria) return false;
          const pCat = p.categoria.toLowerCase().trim();
          return pCat === cat || pCat === nom || nom.includes(pCat) || pCat.includes(nom);
        });
      }
    }

    setData(d);
    setAlertas(a);
    setSelected(d.length > 0 ? d[0] : null);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [myCategories, isAdmin, selectedTeamName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm">Calculando Sports Science Engine...</p>
        </div>
      </div>
    );
  }

  const teamAvgScore    = data.length > 0 ? Math.round(data.reduce((a, d) => a + d.sportsScore, 0) / data.length) : 0;
  const teamAvgWellness = data.length > 0 ? Math.round(data.reduce((a, d) => a + d.wellnessScore, 0) / data.length) : 0;
  const teamAvgACWR     = data.length > 0 ? (data.reduce((a, d) => a + d.acwr, 0) / data.length).toFixed(2) : "0.00";
  const alertasActivas  = alertas.filter(a => a.activa).length;

  const contadorEstados = {
    excelente: data.filter(d => d.estado === "excelente").length,
    bueno:     data.filter(d => d.estado === "bueno").length,
    precaución:data.filter(d => d.estado === "precaución").length,
    riesgo:    data.filter(d => d.estado === "riesgo").length,
  };

  const chartData = selected ? selected.historial.map(h => ({
    fecha:    h.fecha.slice(5),
    Score:    h.score,
    Wellness: h.wellnessScore,
    Carga:    h.carga,
  })) : [];

  const teamBarData = data.map(d => ({
    nombre:   d.jugador,
    Score:    d.sportsScore,
    Wellness: d.wellnessScore,
    Carga:    Math.round(d.cargaSemanal / 10),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-elegant">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sports Science Engine</h1>
            <p className="text-sm text-muted-foreground">Centro de indicadores deportivos · Cálculo automático sin IA</p>
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
          {alertasActivas > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <Bell className="h-3 w-3" /> {alertasActivas} alertas
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar
          </Button>
        </div>
      </div>

      {data.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Info className="h-10 w-10 text-muted-foreground animate-pulse" />
            <p className="text-sm font-medium">No hay datos de Sports Science para este equipo</p>
            <p className="text-xs text-center max-w-sm">Asegúrate de que hay jugadores asignados a la categoría de este equipo y que tengan encuestas de Wellness o registros de carga guardados.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Team Overview Banner */}
      <div className="rounded-2xl border bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 p-5 shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-3xl font-black text-violet-600">{teamAvgScore}</p>
            <p className="text-xs text-muted-foreground font-medium">Sports Score Equipo</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-emerald-600">{teamAvgWellness}</p>
            <p className="text-xs text-muted-foreground font-medium">Wellness Promedio</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-sky-600">{teamAvgACWR}</p>
            <p className="text-xs text-muted-foreground font-medium">ACWR Equipo</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black text-amber-600">{alertasActivas}</p>
            <p className="text-xs text-muted-foreground font-medium">Alertas Activas</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400">🟢 Excelente: {contadorEstados.excelente}</Badge>
          <Badge className="gap-1 bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400">🔵 Bueno: {contadorEstados.bueno}</Badge>
          <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400">🟡 Precaución: {contadorEstados.precaución}</Badge>
          <Badge className="gap-1 bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400">🔴 Riesgo: {contadorEstados.riesgo}</Badge>
        </div>
      </div>

      {/* Athlete Selector */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.map(d => {
          const { color, bg, emoji } = sportsScoreLabel(d.sportsScore);
          return (
            <button
              key={d.jugadorId}
              onClick={() => setSelected(d)}
              className={`rounded-2xl border p-3 text-left transition-all duration-200 ${
                selected.jugadorId === d.jugadorId
                  ? "border-primary bg-primary/5 shadow-elegant"
                  : "bg-card hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-card"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <img src={d.avatar} alt="" className="h-9 w-9 rounded-full ring-2 ring-border" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{d.jugador}</p>
                  <div className="flex items-center gap-1">
                    <TendenciaIcon t={d.tendencia} />
                    <span className="text-[10px] text-muted-foreground capitalize">{d.tendencia}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xl font-black ${color}`}>{d.sportsScore}</span>
                <span className="text-lg">{emoji}</span>
              </div>
              <p className={`text-[10px] font-semibold ${color}`}>{sportsScoreLabel(d.sportsScore).label}</p>
            </button>
          );
        })}
      </div>

      {/* Main Dashboard for Selected Athlete */}
      <Tabs defaultValue="dashboard">
        <TabsList className="h-9 rounded-xl">
          <TabsTrigger value="dashboard"  className="rounded-lg text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="carga"      className="rounded-lg text-xs">Cargas</TabsTrigger>
          <TabsTrigger value="equipo"     className="rounded-lg text-xs">Equipo</TabsTrigger>
          <TabsTrigger value="alertas"    className="rounded-lg text-xs">
            Alertas
            {alertasActivas > 0 && <span className="ml-1 rounded-full bg-destructive text-destructive-foreground text-[9px] px-1">{alertasActivas}</span>}
          </TabsTrigger>
        </TabsList>

        {/* ─── Dashboard Tab ─────────────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Sports Score Principal */}
            <Card className="lg:col-span-1 shadow-card overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 dark:from-violet-950/20 dark:to-indigo-950/10 pointer-events-none" />
              <CardContent className="relative flex flex-col items-center justify-center py-8 gap-4">
                <div className="text-center mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {selected.jugador}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{selected.fecha}</p>
                </div>
                <ScoreRing score={selected.sportsScore} size={172} showLabel />
                <div className="w-full space-y-2 px-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3" />Wellness</span>
                    <MiniScoreBar value={selected.wellnessScore} color="#10b981" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />Fatiga▼</span>
                    <MiniScoreBar value={selected.fatigaScore} color="#0ea5e9" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" />Lesión</span>
                    <MiniScoreBar value={selected.lesionScore} color={selected.lesionScore < 60 ? "#ef4444" : "#10b981"} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3" />Recup.</span>
                    <MiniScoreBar value={selected.recuperacionScore} color="#f59e0b" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <TendenciaIcon t={selected.tendencia} />
                  <span className="text-muted-foreground text-xs capitalize">Tendencia: {selected.tendencia}</span>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="lg:col-span-2 space-y-4">
              {/* ACWR Card */}
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-primary" /> ACWR — Ratio Carga Aguda:Crónica
                    <Badge variant="outline" className="text-[10px]">
                      {selected.acwr >= 0.8 && selected.acwr <= 1.3 ? "✅ Zona Óptima" :
                       selected.acwr > 1.3 ? "⚠️ Zona de Alerta" : "📉 Carga Baja"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>Zona verde: 0.8 – 1.3 · Riesgo de lesión aumenta fuera de rango</CardDescription>
                </CardHeader>
                <CardContent>
                  <ACWRGauge acwr={selected.acwr} />
                </CardContent>
              </Card>

              {/* 10 Cards Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricCard icon={Activity}    label="Estado General"    value={sportsScoreLabel(selected.sportsScore).label} suffix=""     subtext={`Score: ${selected.sportsScore}/100`} accent="primary"  clickable />
                <MetricCard icon={Flame}        label="Carga Hoy"         value={selected.cargaHoy || "–"}   suffix=" AU"   subtext="Unidades de carga"           accent="amber"   clickable />
                <MetricCard icon={BarChart3}    label="Carga Semanal"     value={selected.cargaSemanal}      suffix=" AU"   subtext="Últimos 7 días"              accent="indigo"  clickable />
                <MetricCard icon={TrendingUp}   label="Carga Mensual"     value={selected.cargaMensual}      suffix=" AU"   subtext="Últimos 30 días"             accent="cyan"    clickable />
                <MetricCard icon={HeartPulse}   label="Wellness Score"    value={selected.wellnessScore}     suffix="/100"  subtext="Bienestar global"            accent="emerald" clickable />
                <MetricCard icon={Zap}          label="Fatiga Inversa"    value={selected.fatigaScore}       suffix="/100"  subtext="100=sin fatiga"              accent="sky"     clickable />
                <MetricCard icon={RefreshCw}    label="Recuperación"      value={selected.recuperacionScore} suffix="/100"  subtext="Dolor muscular invertido"    accent="fuchsia" clickable />
                <MetricCard icon={Shield}       label="Riesgo de Lesión"  value={`${100 - selected.lesionScore}%`} suffix="" subtext={selected.lesionScore < 50 ? "Lesión activa" : "Sin riesgo alto"} accent={selected.lesionScore < 60 ? "red" : "emerald"} clickable />
                <MetricCard icon={Gauge}        label="ACWR"              value={selected.acwr.toFixed(2)}   suffix=""      subtext={selected.acwr >= 0.8 && selected.acwr <= 1.3 ? "Zona óptima" : "Fuera de zona"} accent={selected.acwr > 1.5 ? "red" : "amber"} clickable />
                <MetricCard icon={TrendingUp}   label="Tendencia"         value={selected.tendencia}         suffix=""      subtext="vs. últimos 3 días"          accent={selected.tendencia === "subiendo" ? "emerald" : selected.tendencia === "bajando" ? "red" : "primary"} clickable />
              </div>
            </div>
          </div>

          {/* Timeline del atleta */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Evolución — {selected.jugador}
              </CardTitle>
              <CardDescription>Sports Score, Wellness y Carga de entrenamiento (últimos 7 días)</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Sin historial suficiente. Registra wellness diario.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ left: -10, right: 5, top: 5 }}>
                    <defs>
                      <linearGradient id="gScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="fecha" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="score" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <YAxis yAxisId="carga" orientation="right" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine yAxisId="score" y={75} stroke="#10b981" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: "Bueno", fill: "#10b981", fontSize: 9 }} />
                    <Area yAxisId="score" type="monotone" dataKey="Score" name="Sports Score" stroke="#8b5cf6" fill="url(#gScore)" strokeWidth={2.5} dot={{ r: 3, fill: "#8b5cf6" }} />
                    <Line yAxisId="score" type="monotone" dataKey="Wellness" name="Wellness" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="5 2" />
                    <Bar yAxisId="carga" dataKey="Carga" name="Carga AU" fill="#f59e0b" fillOpacity={0.5} radius={[3, 3, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Cargas Tab ──────────────────────────────────────────────── */}
        <TabsContent value="carga" className="space-y-4 mt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Carga Hoy",     value: selected.cargaHoy,    color: "text-amber-600",  sub: "unidades AU" },
              { label: "Carga Semanal", value: selected.cargaSemanal, color: "text-indigo-600", sub: "últimos 7 días" },
              { label: "Carga Mensual", value: selected.cargaMensual, color: "text-cyan-600",   sub: "últimos 30 días" },
            ].map(c => (
              <Card key={c.label} className="shadow-card text-center py-6">
                <p className={`text-4xl font-black ${c.color}`}>{c.value}</p>
                <p className="text-xs font-semibold mt-1">{c.label}</p>
                <p className="text-[10px] text-muted-foreground">{c.sub}</p>
              </Card>
            ))}
          </div>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distribución Semanal de Cargas — Equipo</CardTitle>
              <CardDescription>Comparativa por atleta (Sports Score vs Carga normalizada)</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamBarData} margin={{ left: -10, right: 5, top: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="nombre" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Score"    name="Sports Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Wellness" name="Wellness"     fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Carga"    name="Carga /10"    fill="#f59e0b" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Link to="/rendimiento/cargas">
              <Button variant="outline" size="sm" className="gap-1">
                <Flame className="h-3.5 w-3.5" /> Ver Control de Cargas completo <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </TabsContent>

        {/* ─── Equipo Tab ──────────────────────────────────────────────── */}
        <TabsContent value="equipo" className="space-y-4 mt-4">
          <div className="grid gap-3">
            {data.map(d => {
              const { label: lbl, color, emoji } = sportsScoreLabel(d.sportsScore);
              return (
                <div
                  key={d.jugadorId}
                  onClick={() => setSelected(d)}
                  className={`rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-elegant hover:-translate-y-0.5 ${
                    selected.jugadorId === d.jugadorId ? "border-primary bg-primary/5" : "bg-card"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <img src={d.avatar} alt="" className="h-12 w-12 rounded-full ring-2 ring-border" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{d.jugador}</p>
                        <TendenciaIcon t={d.tendencia} />
                        <Badge variant="outline" className="text-[10px] capitalize">{d.tendencia}</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Wellness</span>
                          <MiniScoreBar value={d.wellnessScore} color="#10b981" />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Fatiga▼</span>
                          <MiniScoreBar value={d.fatigaScore} color="#0ea5e9" />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Lesión</span>
                          <MiniScoreBar value={d.lesionScore} color={d.lesionScore < 60 ? "#ef4444" : "#10b981"} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">ACWR</span>
                          <span className="text-xs font-bold">{d.acwr.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-3xl font-black ${color}`}>{d.sportsScore}</p>
                      <p className={`text-xs font-semibold ${color}`}>{emoji} {lbl}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── Alertas Tab ─────────────────────────────────────────────── */}
        <TabsContent value="alertas" className="space-y-3 mt-4">
          {alertas.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <p className="text-sm font-medium">Sin alertas activas</p>
                <p className="text-xs">Todos los atletas están en rangos normales</p>
              </CardContent>
            </Card>
          ) : (
            alertas.map(a => (
              <div key={a.id} className={`rounded-2xl border p-4 flex items-start gap-3 ${
                a.severidad === "critica"
                  ? "border-red-200 bg-red-50/80 dark:border-red-800/30 dark:bg-red-950/10"
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
                  <p className="text-xs text-muted-foreground mt-0.5">{a.mensaje}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{a.fecha}</p>
                </div>
              </div>
            ))
          )}
          <div className="flex justify-between pt-2">
            <Link to="/rendimiento/wellness">
              <Button variant="outline" size="sm" className="gap-1">
                <Heart className="h-3.5 w-3.5" /> Ver Wellness <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link to="/rendimiento/lesiones">
              <Button variant="outline" size="sm" className="gap-1">
                <Shield className="h-3.5 w-3.5" /> Ver Lesiones <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}
