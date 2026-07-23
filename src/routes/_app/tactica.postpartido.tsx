import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TacticalStore, PostMatchReport, TacticalEvolutionEntry } from "@/lib/tactical-store";
import { matches, jugadores, getPlayerOS } from "@/lib/mock-data";
import RendimientoStore from "@/lib/rendimiento-store";
import {
  ClipboardList, BarChart3, TrendingUp, Sparkles, Printer,
  CheckCircle2, AlertTriangle, Trophy, ShieldHalf, Star,
  ArrowRight, Users, Activity,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tactica/postpartido")({ component: PostpartidoTactico });

function PostpartidoTactico() {
  const [tab, setTab] = useState<"informe" | "comparacion" | "evolucion">("informe");
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [compareAId, setCompareAId] = useState<string>("");
  const [compareBId, setCompareBId] = useState<string>("");
  const [report, setReport] = useState<PostMatchReport | null>(null);

  const playedMatches = matches.filter(m => m.estado === "jugado");
  const evolution = TacticalStore.getTacticalEvolution();
  const loads = RendimientoStore.getPlayerLoadData();

  const tabs = [
    { id: "informe",     label: "Informe Postpartido", icon: ClipboardList },
    { id: "comparacion", label: "Comparación",         icon: BarChart3 },
    { id: "evolucion",   label: "Evolución Táctica",   icon: TrendingUp },
  ] as const;

  const handleGenerateReport = () => {
    if (!selectedMatchId) { toast.error("Selecciona un partido"); return; }
    const match = matches.find(m => m.id === selectedMatchId);
    if (!match) return;
    const r = TacticalStore.generatePostMatchReport(selectedMatchId, {
      rival: match.rival,
      resultado: match.resultado,
    });
    TacticalStore.savePostMatchReport(r);
    setReport(r);
    toast.success("Informe generado automáticamente por la IA");
  };

  const comparison = (compareAId && compareBId) ? TacticalStore.compareMatches(compareAId, compareBId) : [];

  const victorias  = evolution.filter(e => e.resultado && e.resultado.propio > e.resultado.rival).length;
  const empates    = evolution.filter(e => e.resultado && e.resultado.propio === e.resultado.rival).length;
  const derrotas   = evolution.filter(e => e.resultado && e.resultado.propio < e.resultado.rival).length;
  const golesProm  = evolution.filter(e => e.resultado).length > 0
    ? (evolution.reduce((s, e) => s + (e.resultado?.propio ?? 0), 0) / evolution.length).toFixed(1) : "0";
  const scoreProm  = Math.round(evolution.reduce((s, e) => s + e.sportsScorePromedio, 0) / (evolution.length || 1));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 border-b pb-4 no-print">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-elegant">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Análisis Postpartido</h1>
            <p className="text-xs text-muted-foreground">Informes automáticos · Comparación · Evolución táctica</p>
          </div>
        </div>
        <div className="flex gap-2 ml-auto items-center">
          <Link to="/ia">
            <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 hover:border-primary gap-1.5 font-bold">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Redactar Crónica con IA
            </Button>
          </Link>
          {tab === "informe" && report && (
            <Button size="sm" variant="outline" className="text-xs border-white/10 text-white gap-1.5" onClick={() => { window.print(); toast.info("Preparando PDF..."); }}>
              <Printer className="h-3.5 w-3.5" /> Exportar PDF
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border w-fit no-print">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === t.id ? "bg-primary text-white shadow" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ─── INFORME ─── */}
      {tab === "informe" && (
        <div className="space-y-4">
          {/* Match selector */}
          <Card className="bg-card border-white/5 no-print">
            <CardContent className="p-4 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] text-muted-foreground font-bold uppercase mb-1 block">Seleccionar Partido</label>
                <select value={selectedMatchId} onChange={e => { setSelectedMatchId(e.target.value); setReport(null); }}
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white outline-none">
                  <option value="">-- Seleccionar partido jugado --</option>
                  {playedMatches.map(m => (
                    <option key={m.id} value={m.id}>vs {m.rival} · {m.fecha}</option>
                  ))}
                  {playedMatches.length === 0 && <option disabled>No hay partidos jugados</option>}
                </select>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs gap-1.5 shadow-elegant" onClick={handleGenerateReport}>
                <Sparkles className="h-3.5 w-3.5" /> Generar Informe IA
              </Button>
            </CardContent>
          </Card>

          {!report && !selectedMatchId && (
            <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
              <ClipboardList className="h-12 w-12 mx-auto opacity-20" />
              <p>Selecciona un partido y genera el informe automático</p>
            </div>
          )}

          {report && (
            <div className="space-y-4 print:space-y-3">
              {/* Resultado */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-card border-white/5 text-center">
                  <CardContent className="p-3">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Resultado</p>
                    <p className="text-xl font-black text-white mt-1">{report.resultado.propio} – {report.resultado.rival}</p>
                    <Badge variant={report.resultado.propio > report.resultado.rival ? "success" : report.resultado.propio === report.resultado.rival ? "secondary" : "destructive"} className="text-[9px] mt-1">
                      {report.resultado.propio > report.resultado.rival ? "Victoria" : report.resultado.propio === report.resultado.rival ? "Empate" : "Derrota"}
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="bg-card border-white/5 text-center">
                  <CardContent className="p-3">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Formación</p>
                    <p className="text-xl font-black text-violet-400 mt-1">{report.formacion}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-white/5 text-center">
                  <CardContent className="p-3">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Jugadores</p>
                    <p className="text-xl font-black text-white mt-1">{report.participacion.length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-white/5 text-center">
                  <CardContent className="p-3">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">SS Promedio</p>
                    <p className="text-xl font-black text-emerald-400 mt-1">{Math.round(loads.reduce((s, l) => s + l.recoveryScore, 0) / (loads.length || 1))}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Participación */}
              <Card className="bg-card border-white/5">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs text-white flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> Participación del Plantel</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-1.5">
                    {report.participacion.map(p => {
                      const j = jugadores.find(jj => jj.id === p.jugadorId);
                      return (
                        <div key={p.jugadorId} className="flex items-center gap-2 text-xs">
                          <img src={j?.avatar ?? ""} alt="" className="h-6 w-6 rounded-full border border-white/10 shrink-0" />
                          <span className="flex-1 font-medium text-white truncate">{j?.nombre ?? p.jugadorId}</span>
                          <span className="text-muted-foreground text-[10px]">{p.posicion}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{p.minutos}'</span>
                          {p.esTitular ? <Badge variant="outline" className="text-[8px] border-blue-500/30 text-blue-400">TIT</Badge> : <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-400">SUP</Badge>}
                          <div className="flex gap-0.5">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-sm ${i < p.evaluacion ? "bg-emerald-400" : "bg-white/10"}`} />
                            ))}
                          </div>
                          <span className="font-bold text-white text-[10px] w-4">{p.evaluacion}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Observaciones y conclusiones */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="bg-card border-white/5">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-white">📋 Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs text-muted-foreground leading-relaxed">{report.observaciones}</CardContent>
                </Card>
                <Card className="bg-card border-white/5">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-white">✅ Conclusiones</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs text-muted-foreground leading-relaxed">{report.conclusiones}</CardContent>
                </Card>
              </div>

              {/* Reporte Disciplinario, Médico y Semáforo de Gestión */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="bg-card border-red-500/20 bg-gradient-to-br from-card to-red-950/10">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-red-400 flex items-center justify-between">
                      <span>🏥 Reporte Médico & Seguro</span>
                      <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[9px]">Seguro Médico Activo</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 text-xs space-y-1">
                    <p className="text-muted-foreground"><span className="font-semibold text-white">Incidencias Médicas:</span> Registradas automáticamente en el módulo de Alto Rendimiento / Lesiones.</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-amber-500/20 bg-gradient-to-br from-card to-amber-950/10">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-amber-400 flex items-center justify-between">
                      <span>⭐ Semáforo del Jugador</span>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px]">MVP / Retención</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 text-xs space-y-1">
                    <p className="text-muted-foreground"><span className="font-semibold text-white">MVP del Partido:</span> Rendimiento destacado y liderazgo en cancha.</p>
                    <p className="text-muted-foreground"><span className="font-semibold text-white">Alerta de Retención:</span> Alumnos con frustración o desmotivación identificados para contacto con padres.</p>
                  </CardContent>
                </Card>
              </div>

              {/* Acciones pendientes */}
              <Card className="bg-card border-white/5">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs text-white">📌 Acciones Pendientes</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-1.5">
                  {report.accionesPendientes.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-muted-foreground">{a}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recomendaciones IA */}
              <Card className="bg-card border-violet-500/20 bg-gradient-to-r from-card to-violet-950/5">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs text-white flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-violet-400" /> Recomendaciones IA</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  {report.recomendacionesIA.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <ArrowRight className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{r}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ─── COMPARACIÓN ─── */}
      {tab === "comparacion" && (
        <div className="space-y-4">
          {/* Selectors */}
          <div className="grid sm:grid-cols-2 gap-3">
            {[{ label: "Partido A", val: compareAId, set: setCompareAId }, { label: "Partido B", val: compareBId, set: setCompareBId }].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-[10px] text-muted-foreground font-bold uppercase mb-1 block">{label}</label>
                <select value={val} onChange={e => set(e.target.value)}
                  className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white outline-none">
                  <option value="">-- Seleccionar --</option>
                  {evolution.map(e => <option key={e.fecha} value={e.fecha}>vs {e.rival} · {e.fecha}</option>)}
                </select>
              </div>
            ))}
          </div>

          {comparison.length > 0 ? (
            <div className="space-y-3">
              {comparison.map((metric, i) => {
                const max = Math.max(metric.valorA, metric.valorB, 1);
                const aWins = metric.valorA >= metric.valorB;
                return (
                  <Card key={i} className="bg-card border-white/5">
                    <CardContent className="p-4">
                      <p className="text-xs font-bold text-white mb-2">{metric.metrica}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-24 truncate">{metric.labelA}</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(metric.valorA / max) * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-white w-10 text-right">{metric.valorA}{metric.unidad ?? ""}</span>
                          {aWins && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-24 truncate">{metric.labelB}</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${(metric.valorB / max) * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-white w-10 text-right">{metric.valorB}{metric.unidad ?? ""}</span>
                          {!aWins && metric.valorB > metric.valorA && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
              <BarChart3 className="h-12 w-12 mx-auto opacity-20" />
              <p>Selecciona dos partidos para comparar métricas</p>
            </div>
          )}
        </div>
      )}

      {/* ─── EVOLUCIÓN TÁCTICA ─── */}
      {tab === "evolucion" && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Partidos", val: evolution.length, color: "text-white" },
              { label: "Victorias", val: victorias,  color: "text-emerald-400" },
              { label: "Empates",  val: empates,     color: "text-amber-400" },
              { label: "Derrotas", val: derrotas,    color: "text-red-400" },
              { label: "Goles/PJ", val: golesProm,   color: "text-violet-400" },
            ].map(kpi => (
              <Card key={kpi.label} className="bg-card border-white/5 text-center">
                <CardContent className="p-3">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">{kpi.label}</p>
                  <p className={`text-xl font-black mt-1 ${kpi.color}`}>{kpi.val}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Formaciones más usadas */}
          <Card className="bg-card border-white/5">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs text-white flex items-center gap-1.5"><ShieldHalf className="h-3.5 w-3.5 text-primary" /> Formaciones Más Utilizadas</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {Object.entries(
                evolution.reduce<Record<string, number>>((acc, e) => { acc[e.formacion] = (acc[e.formacion] ?? 0) + 1; return acc; }, {})
              ).sort(([, a], [, b]) => b - a).map(([form, count]) => (
                <div key={form} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs font-bold text-white w-10">{form}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-violet-600 rounded-full" style={{ width: `${(count / evolution.length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{count}x</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Match history timeline */}
          <Card className="bg-card border-white/5">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs text-white flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-blue-400" /> Historial de Partidos</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {evolution.map((e, i) => {
                const r = e.resultado;
                const isWin  = r && r.propio > r.rival;
                const isDraw = r && r.propio === r.rival;
                return (
                  <div key={i} className="flex items-center gap-3 text-xs border border-white/5 rounded-xl p-2.5">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isWin ? "bg-emerald-500/20 text-emerald-400" : isDraw ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                      {isWin ? "V" : isDraw ? "E" : "D"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">vs {e.rival}</p>
                      <p className="text-[10px] text-muted-foreground">{e.fecha} · {e.formacion}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-white text-sm">{r ? `${r.propio}–${r.rival}` : "—"}</p>
                      <p className="text-[10px] text-muted-foreground">SS: {e.sportsScorePromedio}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default PostpartidoTactico;
