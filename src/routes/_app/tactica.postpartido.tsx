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
      <div className="page-header mb-6 no-print">
        <div className="flex items-center gap-3">
          <div className="icon-box icon-box-success">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="page-header-title">Análisis Postpartido</h1>
            <p className="page-header-subtitle">Informes automáticos · Comparación · Evolución táctica</p>
          </div>
        </div>
        <div className="flex gap-2 ml-auto items-center">
          <Link to="/ia">
            <Button size="sm" variant="outline" className="btn-secondary gap-1.5">
              <Sparkles className="h-4 w-4 animate-pulse text-[#2563EB]" /> Redactar Crónica con IA
            </Button>
          </Link>
          {tab === "informe" && report && (
            <Button size="sm" variant="outline" className="btn-secondary gap-1.5" onClick={() => { window.print(); toast.info("Preparando PDF..."); }}>
              <Printer className="h-4 w-4" /> Exportar PDF
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#F8F9FA] rounded-[12px] border border-[#E2E8F0] w-fit no-print">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors ${tab === t.id ? "bg-[#2563EB] text-white shadow-sm" : "text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ─── INFORME ─── */}
      {tab === "informe" && (
        <div className="space-y-4">
          {/* Match selector */}
          <Card className="premium-card no-print">
            <CardContent className="p-6 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-[#64748B] font-bold uppercase mb-1 block">Seleccionar Partido</label>
                <select value={selectedMatchId} onChange={e => { setSelectedMatchId(e.target.value); setReport(null); }}
                  className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none">
                  <option value="">-- Seleccionar partido jugado --</option>
                  {playedMatches.map(m => (
                    <option key={m.id} value={m.id}>vs {m.rival} · {m.fecha}</option>
                  ))}
                  {playedMatches.length === 0 && <option disabled>No hay partidos jugados</option>}
                </select>
              </div>
              <Button size="sm" className="btn-primary gap-1.5" onClick={handleGenerateReport}>
                <Sparkles className="h-4 w-4" /> Generar Informe IA
              </Button>
            </CardContent>
          </Card>

          {!report && !selectedMatchId && (
            <div className="text-center py-12 text-[#64748B] text-sm space-y-2">
              <ClipboardList className="h-12 w-12 mx-auto text-slate-300" />
              <p>Selecciona un partido y genera el informe automático</p>
            </div>
          )}

          {report && (
            <div className="space-y-4 print:space-y-3">
              {/* Resultado */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="premium-card text-center">
                  <CardContent className="p-4">
                    <p className="kpi-label">Resultado</p>
                    <p className="kpi-number text-[#0F172A]">{report.resultado.propio} – {report.resultado.rival}</p>
                    <Badge variant="outline" className={`badge-pill mt-2 ${report.resultado.propio > report.resultado.rival ? "badge-success" : report.resultado.propio === report.resultado.rival ? "badge-neutral" : "badge-danger"}`}>
                      {report.resultado.propio > report.resultado.rival ? "Victoria" : report.resultado.propio === report.resultado.rival ? "Empate" : "Derrota"}
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="premium-card text-center">
                  <CardContent className="p-4">
                    <p className="kpi-label">Formación</p>
                    <p className="kpi-number text-[#2563EB]">{report.formacion}</p>
                  </CardContent>
                </Card>
                <Card className="premium-card text-center">
                  <CardContent className="p-4">
                    <p className="kpi-label">Jugadores</p>
                    <p className="kpi-number text-[#0F172A]">{report.participacion.length}</p>
                  </CardContent>
                </Card>
                <Card className="premium-card text-center">
                  <CardContent className="p-4">
                    <p className="kpi-label">SS Promedio</p>
                    <p className="kpi-number text-emerald-600">{Math.round(loads.reduce((s, l) => s + l.recoveryScore, 0) / (loads.length || 1))}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Participación */}
              <Card className="premium-card">
                <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                  <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5"><Users className="h-4 w-4 text-[#2563EB]" /> Participación del Plantel</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-4">
                  <div className="space-y-3">
                    {report.participacion.map(p => {
                      const j = jugadores.find(jj => jj.id === p.jugadorId);
                      return (
                        <div key={p.jugadorId} className="flex items-center gap-3 text-sm">
                          <img src={j?.avatar ?? ""} alt="" className="h-8 w-8 rounded-full border border-[#E2E8F0] shrink-0" />
                          <span className="flex-1 font-medium text-[#0F172A] truncate">{j?.nombre ?? p.jugadorId}</span>
                          <span className="text-[#64748B] text-xs">{p.posicion}</span>
                          <span className="font-mono text-xs text-[#64748B]">{p.minutos}'</span>
                          {p.esTitular ? <Badge variant="outline" className="badge-pill badge-info">TIT</Badge> : <Badge variant="outline" className="badge-pill badge-warning">SUP</Badge>}
                          <div className="flex gap-1">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div key={i} className={`w-1.5 h-2 rounded-sm ${i < p.evaluacion ? "bg-emerald-500" : "bg-slate-200"}`} />
                            ))}
                          </div>
                          <span className="font-bold text-[#0F172A] text-xs w-4 text-center">{p.evaluacion}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Observaciones y conclusiones */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="premium-card">
                  <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                    <CardTitle className="text-sm text-[#0F172A] font-bold">📋 Observaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-4 text-sm text-[#475569] leading-relaxed">{report.observaciones}</CardContent>
                </Card>
                <Card className="premium-card">
                  <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                    <CardTitle className="text-sm text-[#0F172A] font-bold">✅ Conclusiones</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-4 text-sm text-[#475569] leading-relaxed">{report.conclusiones}</CardContent>
                </Card>
              </div>

              {/* Reporte Disciplinario, Médico y Semáforo de Gestión */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="premium-card border-red-200 bg-red-50/50">
                  <CardHeader className="p-4 pb-2 border-b border-red-200">
                    <CardTitle className="text-sm text-red-700 flex items-center justify-between font-bold">
                      <span>🏥 Reporte Médico & Seguro</span>
                      <Badge className="badge-pill badge-danger text-[10px]">Seguro Médico Activo</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-3 text-sm space-y-1">
                    <p className="text-[#475569]"><span className="font-semibold text-[#0F172A]">Incidencias Médicas:</span> Registradas automáticamente en el módulo de Alto Rendimiento / Lesiones.</p>
                  </CardContent>
                </Card>
                <Card className="premium-card border-amber-200 bg-amber-50/50">
                  <CardHeader className="p-4 pb-2 border-b border-amber-200">
                    <CardTitle className="text-sm text-amber-700 flex items-center justify-between font-bold">
                      <span>⭐ Semáforo del Jugador</span>
                      <Badge className="badge-pill badge-warning text-[10px]">MVP / Retención</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-3 text-sm space-y-2">
                    <p className="text-[#475569]"><span className="font-semibold text-[#0F172A]">MVP del Partido:</span> Rendimiento destacado y liderazgo en cancha.</p>
                    <p className="text-[#475569]"><span className="font-semibold text-[#0F172A]">Alerta de Retención:</span> Alumnos con frustración o desmotivación identificados para contacto con padres.</p>
                  </CardContent>
                </Card>
              </div>

              {/* Acciones pendientes */}
              <Card className="premium-card">
                <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                  <CardTitle className="text-sm text-[#0F172A] font-bold">📌 Acciones Pendientes</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-4 space-y-2">
                  {report.accionesPendientes.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-[#475569] font-medium">{a}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recomendaciones IA */}
              <Card className="premium-card bg-[#F8FAFC]">
                <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                  <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[#2563EB]" /> Recomendaciones IA</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-4 space-y-3">
                  {report.recomendacionesIA.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" />
                      <span className="text-[#475569] font-medium">{r}</span>
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
          <div className="grid sm:grid-cols-2 gap-4">
            {[{ label: "Partido A", val: compareAId, set: setCompareAId }, { label: "Partido B", val: compareBId, set: setCompareBId }].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-xs text-[#64748B] font-bold uppercase mb-1 block">{label}</label>
                <select value={val} onChange={e => set(e.target.value)}
                  className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none">
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
                  <Card key={i} className="premium-card">
                    <CardContent className="p-4">
                      <p className="text-sm font-bold text-[#0F172A] mb-3">{metric.metrica}</p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#64748B] w-24 truncate font-medium">{metric.labelA}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#2563EB] rounded-full transition-all" style={{ width: `${(metric.valorA / max) * 100}%` }} />
                          </div>
                          <span className="text-sm font-bold text-[#0F172A] w-12 text-right">{metric.valorA}{metric.unidad ?? ""}</span>
                          <div className="w-4 shrink-0">{aWins && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-[#64748B] w-24 truncate font-medium">{metric.labelB}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${(metric.valorB / max) * 100}%` }} />
                          </div>
                          <span className="text-sm font-bold text-[#0F172A] w-12 text-right">{metric.valorB}{metric.unidad ?? ""}</span>
                          <div className="w-4 shrink-0">{!aWins && metric.valorB > metric.valorA && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-[#64748B] text-sm space-y-2">
              <BarChart3 className="h-12 w-12 mx-auto text-slate-300" />
              <p>Selecciona dos partidos para comparar métricas</p>
            </div>
          )}
        </div>
      )}

      {/* ─── EVOLUCIÓN TÁCTICA ─── */}
      {tab === "evolucion" && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Partidos", val: evolution.length, color: "text-[#0F172A]" },
              { label: "Victorias", val: victorias,  color: "text-emerald-600" },
              { label: "Empates",  val: empates,     color: "text-amber-500" },
              { label: "Derrotas", val: derrotas,    color: "text-red-600" },
              { label: "Goles/PJ", val: golesProm,   color: "text-[#2563EB]" },
            ].map(kpi => (
              <Card key={kpi.label} className="premium-card text-center">
                <CardContent className="p-4">
                  <p className="kpi-label">{kpi.label}</p>
                  <p className={`kpi-number ${kpi.color}`}>{kpi.val}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Formaciones más usadas */}
          <Card className="premium-card">
            <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
              <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5"><ShieldHalf className="h-4 w-4 text-[#2563EB]" /> Formaciones Más Utilizadas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-4">
              <div className="space-y-3">
                {Object.entries(
                  evolution.reduce<Record<string, number>>((acc, e) => { acc[e.formacion] = (acc[e.formacion] ?? 0) + 1; return acc; }, {})
                ).sort(([, a], [, b]) => b - a).map(([form, count]) => (
                  <div key={form} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#0F172A] w-12">{form}</span>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${(count / evolution.length) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-[#64748B] w-8 text-right">{count}x</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Match history timeline */}
          <Card className="premium-card">
            <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
              <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5"><Activity className="h-4 w-4 text-[#2563EB]" /> Historial de Partidos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-3">
              {evolution.map((e, i) => {
                const r = e.resultado;
                const isWin  = r && r.propio > r.rival;
                const isDraw = r && r.propio === r.rival;
                return (
                  <div key={i} className="flex items-center gap-3 text-sm border border-[#E2E8F0] rounded-[12px] p-3 hover:bg-slate-50 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isWin ? "bg-emerald-500/10 text-emerald-700" : isDraw ? "bg-amber-500/10 text-amber-700" : "bg-red-500/10 text-red-700"}`}>
                      {isWin ? "V" : isDraw ? "E" : "D"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0F172A] truncate">vs {e.rival}</p>
                      <p className="text-xs text-[#64748B] font-medium">{e.fecha} · <span className="font-bold">{e.formacion}</span></p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-[#0F172A] text-base">{r ? `${r.propio} – ${r.rival}` : "—"}</p>
                      <p className="text-xs text-[#64748B] font-medium">SS: {e.sportsScorePromedio}</p>
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
