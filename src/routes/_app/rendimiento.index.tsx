import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/stat-card";
import {
  Activity, HeartPulse, Gauge, Dumbbell, Stethoscope, Zap, TrendingUp,
  AlertTriangle, ArrowRight, Sparkles, Timer, Flame, Brain,
} from "lucide-react";
import RendimientoStore, { sportsScoreLabel } from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import { performancePlans, performanceGoals } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/rendimiento/")({ component: RendimientoHub });

function RendimientoHub() {
  const { role, coachName } = useRole();
  const isAdmin = role === "admin";

  const myTeams = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (isAdmin) return all;
    return all.filter(t => t.entrenador === coachName);
  }, [isAdmin, coachName]);

  const myCategories = useMemo(() => myTeams.map(t => t.categoria), [myTeams]);

  const rawPlayerLoadData = RendimientoStore.getPlayerLoadData();
  const rawSesionesList = RendimientoStore.getSesiones();
  const rawLesionesList = RendimientoStore.getLesiones();
  const rawWellnessList = RendimientoStore.getWellness();

  // Filter lists by the coach's category U13 (or multiple assigned teams)
  const playerLoadData = useMemo(() => {
    if (isAdmin) return rawPlayerLoadData;
    return rawPlayerLoadData.filter(d => myCategories.includes(d.equipo));
  }, [rawPlayerLoadData, isAdmin, myCategories]);

  const sesionesList = useMemo(() => {
    if (isAdmin) return rawSesionesList;
    return rawSesionesList.filter(s => myCategories.includes(s.equipo));
  }, [rawSesionesList, isAdmin, myCategories]);

  const lesionesList = useMemo(() => {
    if (isAdmin) return rawLesionesList;
    // Map players to get their categories for injury filtering
    const players = RendimientoStore.getJugadores();
    return rawLesionesList.filter(l => {
      const p = players.find(x => x.id === l.jugadorId);
      return p && myCategories.includes(p.categoria);
    });
  }, [rawLesionesList, isAdmin, myCategories]);

  const wellnessList = useMemo(() => {
    if (isAdmin) return rawWellnessList;
    const players = RendimientoStore.getJugadores();
    return rawWellnessList.filter(w => {
      const p = players.find(x => x.id === w.jugadorId);
      return p && myCategories.includes(p.categoria);
    });
  }, [rawWellnessList, isAdmin, myCategories]);

  const ratedSesiones = sesionesList.filter(s => s.carga !== undefined && s.carga > 0);
  const cargaProm = ratedSesiones.length > 0
    ? Math.round(ratedSesiones.reduce((acc, s) => acc + (s.carga || 0), 0) / ratedSesiones.length)
    : 0;

  const wellnessProm = wellnessList.length > 0
    ? ((wellnessList.reduce((acc, w) => acc + (w.wellnessScore || w.score || 0), 0) / wellnessList.length) / 20).toFixed(1)
    : "0.0";

  const lesionActivas = lesionesList.filter(l => !l.completada).length;
  const alertasIA = playerLoadData.filter(d => d.semaforo === "rojo").length;

  const topRiesgo = [...playerLoadData]
    .sort((a, b) => {
      const map = { rojo: 2, amarillo: 1, verde: 0 };
      if (map[a.semaforo] !== map[b.semaforo]) return map[b.semaforo] - map[a.semaforo];
      return b.fatigaScore - a.fatigaScore;
    })
    .slice(0, 5);

  const wellnessBajo = [...playerLoadData]
    .filter(d => d.wellnessScore < 60)
    .slice(0, 5);

  const links = [
    { to: "/rendimiento/planificacion", label: "Planificación", icon: Timer, desc: "Micro, meso y macrociclos" },
    { to: "/rendimiento/cargas", label: "Control de cargas", icon: Flame, desc: "RPE, carga interna/externa" },
    { to: "/rendimiento/wellness", label: "Wellness", icon: HeartPulse, desc: "Sueño, fatiga, ánimo" },
    { to: "/rendimiento/gps", label: "GPS & Wearables", icon: Gauge, desc: "Distancia, sprints, FC" },
    { to: "/rendimiento/tests", label: "Tests físicos", icon: Dumbbell, desc: "Banco de pruebas e histórico" },
    { to: "/rendimiento/lesiones", label: "Prevención de lesiones", icon: Stethoscope, desc: "Historial y retorno" },
    { to: "/rendimiento/sports-science", label: "Sports Science", icon: Brain, desc: "Score, ACWR, fatiga, riesgo" },
  ] as const;

  // Sports Score promedio del equipo
  const ssData = RendimientoStore.getSportsScoreData();
  const avgSportsScore = ssData.length ? Math.round(ssData.reduce((a, d) => a + d.sportsScore, 0) / ssData.length) : 0;
  const { label: ssLabel } = sportsScoreLabel(avgSportsScore);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-elegant">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Centro de Alto Rendimiento</h1>
            <p className="text-sm text-muted-foreground">Planificación, monitoreo y analítica integral del atleta.</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1"><Zap className="h-3 w-3" /> Motor activo</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Flame}         label="Carga interna prom." value={cargaProm.toString()}   hint="AU · últimos 7 días" accent="primary"     />
        <StatCard icon={HeartPulse}    label="Wellness promedio"   value={`${wellnessProm}/5`}   hint="del plantel"       accent="success"     />
        <StatCard icon={Stethoscope}   label="Lesiones activas"    value={lesionActivas.toString()} hint="requieren seguimiento" accent="warning" />
        <StatCard icon={Brain}         label="Sports Score Equipo" value={`${avgSportsScore}`}   hint={ssLabel}          accent="destructive" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="group rounded-xl border bg-card p-4 shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <l.icon className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="mt-3 font-semibold">{l.label}</p>
            <p className="text-sm text-muted-foreground">{l.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Top riesgo de lesión</CardTitle>
              <CardDescription>Predicción IA basada en carga y wellness</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> IA</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {topRiesgo.map((r) => {
              const estimatedRisk = Math.round(
                (r.acwr > 1.5 ? 40 : r.acwr > 1.3 ? 25 : 10) +
                (r.fatigaScore * 0.4) +
                (100 - r.wellnessScore) * 0.2
              );
              return (
                <Link to="/jugadores/$id" params={{ id: r.jugadorId }} key={r.jugadorId} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition">
                  <img src={r.avatar} alt="" className="h-10 w-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{r.jugador}</p>
                      <Badge variant={estimatedRisk >= 65 ? "destructive" : "secondary"}>{estimatedRisk}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{r.semaforoRecomendacion}</p>
                    <Progress value={estimatedRisk} className="h-1.5 mt-1.5" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HeartPulse className="h-4 w-4" /> Wellness bajo</CardTitle>
            <CardDescription>Atletas con señales de fatiga</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {wellnessBajo.length === 0 && <p className="text-sm text-muted-foreground">Sin alertas activas.</p>}
            {wellnessBajo.map((w) => (
              <div key={w.jugadorId} className="flex items-center gap-2 rounded-lg border p-2">
                <img src={w.avatar} alt="" className="h-8 w-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{w.jugador}</p>
                  <p className="text-xs text-muted-foreground">Score: {w.wellnessScore}/100 · Fatiga: {w.fatigaScore}% · ACWR: {w.acwr.toFixed(2)}</p>
                </div>
                <Badge variant="destructive">Bajo</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Timer className="h-4 w-4" /> Ciclos activos</CardTitle>
              <CardDescription>Planificación deportiva vigente</CardDescription>
            </div>
            <Link to="/rendimiento/planificacion" className="text-sm text-primary hover:underline">Ver todo</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {performancePlans.slice(0, 4).map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${p.color}`} />
                    <p className="text-sm font-medium">{p.nombre}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{p.tipo}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.equipo} · {p.inicio} → {p.fin}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Objetivos físicos</CardTitle>
            <CardDescription>Progreso hacia metas individuales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {performanceGoals.slice(0, 5).map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-lg border p-2">
                <img src={g.avatar} alt="" className="h-8 w-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{g.jugador}</p>
                    <span className="text-xs text-muted-foreground">{g.progreso}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{g.objetivo}</p>
                  <Progress value={g.progreso} className="h-1.5 mt-1" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
