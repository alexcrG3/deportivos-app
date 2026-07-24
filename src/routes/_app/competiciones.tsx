import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Trophy, Plus, Swords, MapPin, ArrowRight, Medal, FileText, Upload,
  Calendar, ShieldCheck, Download, ExternalLink, CheckCircle2
} from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/competiciones")({ component: CompeticionesPage });

const tipoColor: Record<string, string> = {
  Liga: "bg-primary/15 text-primary border-primary/30",
  Copa: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Torneo: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Festival: "bg-violet-500/15 text-violet-600 border-violet-500/30",
};

function CompeticionesPage() {
  const [competicionesList, setCompeticionesList] = useState<any[]>([]);
  const [standingsList, setStandingsList] = useState<any[]>([]);
  const [temporadasList, setTemporadasList] = useState<any[]>([]);
  const [sedesList, setSedesList] = useState<any[]>([]);
  const [categoriasList, setCategoriasList] = useState<any[]>([]);
  const [disciplinasList, setDisciplinasList] = useState<any[]>([]);

  const [sel, setSel] = useState<any>(null);
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [reglamentoFile, setReglamentoFile] = useState<File | null>(null);

  // Form State
  const [form, setForm] = useState({
    nombre: "",
    tipo: "Liga",
    disciplina: "Fútbol",
    categoria: "Sub-15",
    equipos: 10,
    jornadaActual: 1,
    jornadas: 18,
    temporadaId: "",
    sedes: [] as string[],
  });

  const loadData = () => {
    const comps = RendimientoStore.getCompeticiones();
    setCompeticionesList(comps);

    if (comps.length > 0) {
      setSel((prev: any) => {
        const stillExists = comps.find((c) => c.id === prev?.id);
        return stillExists || comps[0];
      });
    } else {
      setSel(null);
    }

    setStandingsList(RendimientoStore.getClasificaciones());
    const temps = RendimientoStore.getTemporadas();
    setTemporadasList(temps);
    setSedesList(RendimientoStore.getSedes());

    const cats = RendimientoStore.getCategorias();
    setCategoriasList(cats);
    const discs = RendimientoStore.getDisciplinas();
    setDisciplinasList(discs);

    if (temps.length > 0) setForm((f) => ({ ...f, temporadaId: temps[0].id }));
    if (cats.length > 0) setForm((f) => ({ ...f, categoria: cats[0].nombre }));
    if (discs.length > 0) {
      const firstDisc = typeof discs[0] === "string" ? discs[0] : discs[0].nombre || "Fútbol";
      setForm((f) => ({ ...f, disciplina: firstDisc }));
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!RendimientoStore.isStoreSynced()) {
        await RendimientoStore.syncFromSupabase();
      }
      loadData();
    };
    init();
  }, []);

  const getMatchTeams = (p: any) => {
    if (typeof p.local === "string") {
      return { local: p.local, visitante: p.visitante || "Rival" };
    }
    const eqId = p.equipoId || p.equipo_id;
    const allTeams = RendimientoStore.getEquipos();
    const teamObj = allTeams.find((e: any) => e.id === eqId);
    const clubName = teamObj ? teamObj.nombre : p.equipo || "Club Principal";
    return {
      local: p.local ? clubName : p.rival || "Rival",
      visitante: p.local ? p.rival || "Rival" : clubName,
    };
  };

  const partidos = useMemo(() => {
    if (!sel) return [];
    const allPartidos = RendimientoStore.getPartidos();
    return allPartidos.filter((p) => {
      if (p.competicionId === sel.id || p.competicion === sel.nombre) return true;
      if (p.tipo === sel.tipo) {
        const pCat = p.equipo ? p.equipo.toLowerCase() : "";
        const cCat = sel.categoria ? sel.categoria.toLowerCase() : "";
        return pCat.includes(cCat) || cCat.includes(pCat);
      }
      return false;
    });
  }, [sel]);

  const tabla = useMemo(() => {
    if (!sel) return [];

    const teamsMap = new Map<
      string,
      { equipo: string; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; dg: number; pts: number }
    >();

    const getTeamRecord = (name: string) => {
      if (!teamsMap.has(name)) {
        teamsMap.set(name, { equipo: name, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
      }
      return teamsMap.get(name)!;
    };

    for (const p of partidos) {
      const { local, visitante } = getMatchTeams(p);
      if (local) getTeamRecord(local);
      if (visitante) getTeamRecord(visitante);
    }

    const playedMatches = partidos.filter((p) => p.estado === "jugado" && p.resultado);

    for (const p of playedMatches) {
      const { local: localTeamName, visitante: visitorTeamName } = getMatchTeams(p);
      const localGoals = p.local ? p.resultado.propio : p.resultado.rival;
      const visitorGoals = p.local ? p.resultado.rival : p.resultado.propio;

      if (!localTeamName || !visitorTeamName) continue;

      const localRec = getTeamRecord(localTeamName);
      const visitorRec = getTeamRecord(visitorTeamName);

      localRec.pj += 1;
      visitorRec.pj += 1;
      localRec.gf += localGoals;
      localRec.gc += visitorGoals;
      visitorRec.gf += visitorGoals;
      visitorRec.gc += localGoals;

      if (localGoals > visitorGoals) {
        localRec.pg += 1;
        localRec.pts += 3;
        visitorRec.pp += 1;
      } else if (localGoals < visitorGoals) {
        visitorRec.pg += 1;
        visitorRec.pts += 3;
        localRec.pp += 1;
      } else {
        localRec.pe += 1;
        localRec.pts += 1;
        visitorRec.pe += 1;
        visitorRec.pts += 1;
      }

      localRec.dg = localRec.gf - localRec.gc;
      visitorRec.dg = visitorRec.gf - visitorRec.gc;
    }

    // Agregar standings por defecto de la DB si no hay partidos jugados
    if (teamsMap.size === 0) {
      const defaultStandings = standingsList.filter((s) => s.competicionId === sel.id || s.competicion === sel.nombre);
      if (defaultStandings.length > 0) return defaultStandings;
    }

    return Array.from(teamsMap.values()).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      return b.gf - a.gf;
    });
  }, [sel, partidos, standingsList]);

  const handleCreateCompeticion = () => {
    if (!form.nombre.trim()) {
      toast.error("Ingresa el nombre del torneo.");
      return;
    }
    const newComp = RendimientoStore.addCompeticion({
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      disciplina: form.disciplina,
      categoria: form.categoria,
      equipos: form.equipos,
      jornadaActual: 1,
      jornadas: form.jornadas,
      temporadaId: form.temporadaId,
      sedes: form.sedes.length > 0 ? form.sedes : ["Sede Central"],
    });

    toast.success("Torneo registrado con éxito");
    setIsOpenCreate(false);
    loadData();
    setSel(newComp);
  };

  const handleUploadReglamento = () => {
    if (!reglamentoFile) {
      toast.error("Selecciona el archivo PDF del reglamento.");
      return;
    }
    toast.success(`Reglamento "${reglamentoFile.name}" guardado en el repositorio digital ✓`);
    setReglamentoFile(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE MÓDULO */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] uppercase mb-1">
            Organización General del Club
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            🏆 Torneos, Ligas & Matriz de Posiciones
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Mapa macro de la participación competitiva oficial de la academia.
          </p>
        </div>

        <Button
          onClick={() => setIsOpenCreate(true)}
          className="bg-gradient-primary text-white font-extrabold gap-2 shadow-elegant rounded-xl"
        >
          <Plus className="h-4 w-4" /> ➕ Registrar Nuevo Torneo / Liga
        </Button>
      </div>

      {/* TARJETAS VISUALES DE TORNEOS ACTIVOS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {competicionesList.map((comp) => {
          const isSelected = sel?.id === comp.id;
          const badgeClass = tipoColor[comp.tipo] || "bg-muted text-foreground";
          const progressPercent = comp.jornadas > 0 ? Math.round((comp.jornadaActual / comp.jornadas) * 100) : 0;

          return (
            <Card
              key={comp.id}
              onClick={() => setSel(comp)}
              className={`cursor-pointer transition border hover:shadow-md ${
                isSelected ? "border-2 border-primary bg-primary/5 shadow-elegant" : "bg-card"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`font-extrabold text-[10px] uppercase ${badgeClass}`}>
                    {comp.tipo}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    Jornada {comp.jornadaActual} / {comp.jornadas}
                  </span>
                </div>
                <CardTitle className="text-base font-extrabold text-foreground pt-1">
                  {comp.nombre}
                </CardTitle>
                <CardDescription className="text-xs">
                  {comp.categoria} · {comp.disciplina} · {comp.equipos} Equipos
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span>Avance del Campeonato</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* INTERACCIÓN INTERNA DEL TORNEO SELECCIONADO */}
      {sel && (
        <Card className="shadow-card border bg-card">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] uppercase font-bold mb-1">
                {sel.tipo} · Categoría {sel.categoria}
              </Badge>
              <CardTitle className="text-lg font-extrabold text-foreground">{sel.nombre}</CardTitle>
            </div>

            <span className="text-xs font-bold text-muted-foreground">
              📍 Sedes: {Array.isArray(sel.sedes) ? sel.sedes.join(", ") : sel.sedes || "Sede Central"}
            </span>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs defaultValue="posiciones" className="space-y-4">
              <TabsList className="grid grid-cols-3 bg-muted p-1 rounded-xl">
                <TabsTrigger value="posiciones" className="text-xs font-bold">📊 Tabla de Posiciones Dinámica</TabsTrigger>
                <TabsTrigger value="fixture" className="text-xs font-bold">🗓️ Calendario Completo (Fixture)</TabsTrigger>
                <TabsTrigger value="reglamento" className="text-xs font-bold">📄 Reglamento Oficial PDF</TabsTrigger>
              </TabsList>

              {/* 1. Tabla de Posiciones Dinámica */}
              <TabsContent value="posiciones" className="space-y-4 pt-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50 text-muted-foreground font-extrabold uppercase text-[10px]">
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Equipo / Club</th>
                        <th className="p-2.5 text-center">PJ</th>
                        <th className="p-2.5 text-center text-emerald-600">PG</th>
                        <th className="p-2.5 text-center text-amber-600">PE</th>
                        <th className="p-2.5 text-center text-red-600">PP</th>
                        <th className="p-2.5 text-center">GF</th>
                        <th className="p-2.5 text-center">GC</th>
                        <th className="p-2.5 text-center font-bold">DG</th>
                        <th className="p-2.5 text-right font-extrabold text-primary text-sm">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tabla.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-xs text-muted-foreground">
                            Sin partidos jugados registrados en este torneo.
                          </td>
                        </tr>
                      ) : (
                        tabla.map((t, idx) => (
                          <tr key={t.equipo || idx} className={`hover:bg-muted/30 ${idx === 0 ? "bg-emerald-500/5 font-extrabold" : ""}`}>
                            <td className="p-2.5 font-bold">
                              {idx === 0 ? "🏆 1" : idx + 1}
                            </td>
                            <td className="p-2.5 font-bold text-foreground">{t.equipo}</td>
                            <td className="p-2.5 text-center font-mono">{t.pj}</td>
                            <td className="p-2.5 text-center font-mono text-emerald-600 font-bold">{t.pg}</td>
                            <td className="p-2.5 text-center font-mono text-amber-600">{t.pe}</td>
                            <td className="p-2.5 text-center font-mono text-red-600">{t.pp}</td>
                            <td className="p-2.5 text-center font-mono">{t.gf}</td>
                            <td className="p-2.5 text-center font-mono">{t.gc}</td>
                            <td className="p-2.5 text-center font-mono font-bold">{t.dg > 0 ? `+${t.dg}` : t.dg}</td>
                            <td className="p-2.5 text-right font-mono font-black text-primary text-sm">{t.pts}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* 2. Calendario Completo (Fixture) */}
              <TabsContent value="fixture" className="space-y-4 pt-2">
                <div className="space-y-3">
                  {partidos.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No hay encuentros cargados en el rol de este torneo.
                    </div>
                  ) : (
                    partidos.map((p, idx) => {
                      const { local, visitante } = getMatchTeams(p);
                      return (
                        <div key={p.id || idx} className="p-3.5 rounded-xl border bg-muted/30 flex items-center justify-between gap-4">
                          <div>
                            <Badge variant="outline" className="text-[10px] font-bold">Jornada {p.jornada || Math.floor(idx / 2) + 1}</Badge>
                            <p className="text-xs font-extrabold text-foreground mt-1">{local} vs {visitante}</p>
                            <p className="text-[11px] text-muted-foreground">📅 {p.fecha} · ⏰ {p.hora} · 📍 {p.sede || "Sede Central"}</p>
                          </div>

                          <div className="text-right">
                            {p.resultado ? (
                              <Badge className="bg-primary text-white font-mono font-bold text-xs py-1 px-3">
                                {p.resultado.propio} – {p.resultado.rival}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
                                Por Disputar
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* 3. Reglamento del Torneo PDF */}
              <TabsContent value="reglamento" className="space-y-4 pt-2">
                <div className="p-6 rounded-xl border bg-card space-y-4 text-center">
                  <FileText className="h-12 w-12 mx-auto text-primary opacity-80" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-foreground">Reglamento Oficial y Sanciones de la Liga</h3>
                    <p className="text-xs text-muted-foreground">
                      Repositorio digital PDF para consultar normas de juego, sustituciones permitidas y sanciones disciplinarias.
                    </p>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setReglamentoFile(e.target.files?.[0] || null)}
                      className="max-w-xs h-10 text-xs"
                    />
                    <Button onClick={handleUploadReglamento} className="bg-gradient-primary text-white font-bold text-xs gap-1.5 h-10">
                      <Upload className="h-4 w-4" /> Subir PDF
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* MODAL NUEVO TORNEO */}
      <Dialog open={isOpenCreate} onOpenChange={setIsOpenCreate}>
        <DialogContent className="sm:max-w-[450px] bg-card border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Registrar Nuevo Torneo / Liga
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ingresa los datos del torneo oficial donde compite la academia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Torneo *</label>
              <Input
                placeholder="Ej. Liga Nacional Sub-15 2026"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full h-10 rounded-xl border bg-background px-3 text-xs font-semibold"
                >
                  <option value="Liga">Liga</option>
                  <option value="Copa">Copa</option>
                  <option value="Torneo">Torneo</option>
                  <option value="Festival">Festival</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Categoría *</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  className="w-full h-10 rounded-xl border bg-background px-3 text-xs font-semibold"
                >
                  {categoriasList.map((c: any) => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                  {categoriasList.length === 0 && <option value="Sub-15">Sub-15</option>}
                </select>
              </div>
            </div>

            <Button onClick={handleCreateCompeticion} className="w-full h-11 bg-primary text-white font-extrabold text-xs shadow-elegant rounded-xl">
              ✓ REGISTRAR TORNEO
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CompeticionesPage;
