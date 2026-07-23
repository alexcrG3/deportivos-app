import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  trainingSessions, matches, convocatorias, playerAvailability, playerObjectives,
  quickEvaluations, coachOperativeAlerts, entrenadores,
} from "@/lib/mock-data";
import { Dumbbell, Swords, Megaphone, HeartPulse, AlertTriangle, Flag, Star, ArrowRight, ShieldHalf, Sparkles, Layers, Activity } from "lucide-react";
import { TacticalStore } from "@/lib/tactical-store";
import { AIStore } from "@/lib/ai-store";
import RendimientoStore from "@/lib/rendimiento-store";


export const Route = createFileRoute("/_app/coach")({ component: CoachDashboard });

function CoachDashboard() {
  const coach = entrenadores[0];
  const hoy = trainingSessions.filter((s) => s.estado !== "completada").slice(0, 3);
  const proximosPartidos = matches.filter((m) => m.estado === "programado").slice(0, 3);
  const pendientesConv = convocatorias.slice(0, 2);
  const lesionados = playerAvailability.filter((p) => p.estado === "lesionado");
  const restringidos = playerAvailability.filter((p) => p.estado === "restriccion");
  const objetivosPend = playerObjectives.filter((o) => o.estado === "en_progreso").slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Panel del Coach</p>
          <h1 className="text-2xl font-semibold tracking-tight">Buen día, {coach.nombre.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">Tu jornada operativa en un solo lugar.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/entrenamientos">Ver entrenamientos</Link></Button>
          <Button asChild><Link to="/entrenamientos">+ Nueva sesión</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Entrenamientos hoy" value={hoy.length.toString()} icon={Dumbbell} accent="primary" delta={8} />
        <StatCard label="Próximos partidos" value={proximosPartidos.length.toString()} icon={Swords} accent="warning" />
        <StatCard label="Convocatorias pendientes" value={pendientesConv.length.toString()} icon={Megaphone} accent="primary" />
        <StatCard label="Lesionados / restricciones" value={`${lesionados.length}/${restringidos.length}`} icon={HeartPulse} accent="destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Sesiones de hoy</CardTitle>
              <CardDescription>Entrenamientos y actividades del día</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link to="/entrenamientos">Todo <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {hoy.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                  {s.hora}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{s.nombre}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.equipo} · {s.instalacion} · {s.duracion} min</p>
                </div>
                <Badge variant={s.intensidad === "Alta" ? "destructive" : s.intensidad === "Media" ? "default" : "secondary"}>
                  {s.intensidad}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Alertas operativas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {coachOperativeAlerts.map((a) => (
              <div key={a.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                <span className={`mt-1.5 h-2 w-2 rounded-full ${a.severidad === "alta" ? "bg-destructive" : a.severidad === "media" ? "bg-warning" : "bg-muted-foreground"}`} />
                <span className="flex-1">{a.texto}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Swords className="h-4 w-4" />Próximos partidos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {proximosPartidos.map((m) => (
              <Link key={m.id} to="/partidos" className="block rounded-lg border p-3 hover:bg-muted/40">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{m.equipo}</span>
                  <Badge variant="outline">{m.tipo}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">vs {m.rival} · {m.fecha} {m.hora} · {m.local ? "Local" : "Visitante"}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Flag className="h-4 w-4" />Objetivos activos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {objetivosPend.map((o) => (
              <div key={o.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6"><AvatarImage src={o.avatar} /><AvatarFallback>{o.jugador[0]}</AvatarFallback></Avatar>
                  <span className="text-xs font-medium truncate flex-1">{o.jugador}</span>
                  <span className="text-xs text-muted-foreground">{o.progreso}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${o.progreso}%` }} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{o.titulo}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-4 w-4" />Evaluaciones pendientes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {quickEvaluations.slice(0, 5).map((e) => (
              <div key={e.jugadorId} className="flex items-center gap-2">
                <Avatar className="h-7 w-7"><AvatarImage src={e.avatar} /><AvatarFallback>{e.jugador[0]}</AvatarFallback></Avatar>
                <span className="flex-1 text-sm truncate">{e.jugador}</span>
                <Button asChild size="sm" variant="ghost"><Link to="/evaluaciones">Evaluar</Link></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─── TACTICAL DASHBOARD WIDGETS ────────────────────────────────────── */}
      <div className="border-t border-white/10 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldHalf className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Centro Táctico — Resumen de Operación</h2>
          </div>
          <Link to="/tactica">
            <Button size="sm" variant="ghost" className="text-xs text-primary gap-1">
              Ver Centro Táctico <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Widget 1: Próximo Rival */}
          {(() => {
            const opp = TacticalStore.getOpponents()[0];
            return (
              <Card className="bg-card shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Próximo Rival</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {opp ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{opp.escudo}</span>
                        <div>
                          <p className="font-bold text-white">{opp.nombre}</p>
                          <p className="text-muted-foreground text-[10px]">Esquema base: {opp.sistemaBase}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] uppercase font-bold ${
                        opp.peligrosidad === "muy-alto" || opp.peligrosidad === "alto" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        Peligro: {opp.peligrosidad}
                      </Badge>
                    </>
                  ) : (
                    <div className="text-muted-foreground leading-snug py-1">
                      ⚔️ Sin rivales registrados.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Widget 2: Estado Táctico */}
          {(() => {
            const lastLineup = TacticalStore.getLastLineup();
            const form = lastLineup ? TacticalStore.getFormations().find(f => f.id === lastLineup.formacionId) : null;
            return (
              <Card className="bg-card shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Estado Táctico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {lastLineup ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-bold text-white">{form?.nombre ?? lastLineup.nombre}</p>
                          <p className="text-muted-foreground text-[10px]">Alineación definida</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        Sistema listo para el encuentro.
                      </p>
                    </>
                  ) : (
                    <div className="text-muted-foreground leading-snug py-1">
                      📋 Sin alineación definida aún.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Widget 3: Disponibilidad del Plantel */}
          {(() => {
            const summary = TacticalStore.getSummary();
            const hasPlayers = RendimientoStore.getJugadores().length > 0;
            return (
              <Card className="bg-card shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Disponibilidad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {hasPlayers ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-400" />
                        <div>
                          <p className="font-bold text-emerald-400">{summary.jugadoresDisponibles} Disponibles</p>
                          <p className="text-muted-foreground text-[10px]">{summary.jugadoresPrecaucion} en precaución</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[9px] font-bold ${
                        summary.jugadoresNoRecomendados > 0 ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {summary.jugadoresNoRecomendados} No recomendados
                      </Badge>
                    </>
                  ) : (
                    <div className="text-muted-foreground leading-snug py-1">
                      👥 Sin jugadores en el plantel.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Widget 4: Recomendaciones IA */}
          {(() => {
            const rec = AIStore.getRecommendations()[0];
            return (
              <Card className="bg-card shadow-card border-violet-500/15">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider text-violet-400 font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3 animate-pulse" /> IA Sugerencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs leading-relaxed text-muted-foreground">
                  {rec ? (
                    <div className="line-clamp-2" title={rec.texto}>
                      <span className="font-bold text-white">{rec.jugador}:</span> {rec.texto}
                    </div>
                  ) : (
                    "No hay sugerencias tácticas de la IA."
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

