import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Trophy, Plus, Swords, MapPin, ArrowRight, Medal } from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/competiciones")({ component: CompeticionesPage });

const tipoColor: Record<string, string> = {
  Liga: "bg-primary/15 text-primary",
  Copa: "bg-warning/15 text-warning",
  Torneo: "bg-success/15 text-success",
  Festival: "bg-secondary text-secondary-foreground",
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

  // Form state
  const [form, setForm] = useState({
    nombre: "",
    tipo: "Liga",
    disciplina: "Fútbol",
    categoria: "Sub-15",
    equipos: 10,
    jornadaActual: 1,
    jornadas: 18,
    temporadaId: "",
    sedes: [] as string[]
  });

  const loadData = () => {
    const comps = RendimientoStore.getCompeticiones();
    setCompeticionesList(comps);
    
    // Si no hay nada seleccionado, seleccionar el primero por defecto
    if (comps.length > 0) {
      setSel(prev => {
        const stillExists = comps.find(c => c.id === prev?.id);
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

    // Inicializar categoria, disciplina y temporada por defecto
    if (temps.length > 0) {
      setForm(f => ({ ...f, temporadaId: temps[0].id }));
    }
    if (cats.length > 0) {
      setForm(f => ({ ...f, categoria: cats[0].nombre }));
    }
    if (discs.length > 0) {
      const firstDisc = typeof discs[0] === "string" ? discs[0] : (discs[0].nombre || "Fútbol");
      setForm(f => ({ ...f, disciplina: firstDisc }));
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
      return {
        local: p.local,
        visitante: p.visitante || "Rival"
      };
    }
    const eqId = p.equipoId || p.equipo_id;
    const allTeams = RendimientoStore.getEquipos();
    const teamObj = allTeams.find((e: any) => e.id === eqId);
    const clubName = teamObj ? teamObj.nombre : (p.equipo || "Club");
    return {
      local: p.local ? clubName : (p.rival || "Rival"),
      visitante: p.local ? (p.rival || "Rival") : clubName
    };
  };

  const partidos = useMemo(() => {
    if (!sel) return [];
    const allPartidos = RendimientoStore.getPartidos();
    return allPartidos.filter((p) => {
      if (p.competicionId === sel.id || p.competicion === sel.nombre) return true;
      // Fallback matching for demo data by category and type
      if (p.tipo === sel.tipo) {
        const pCat = p.equipo ? p.equipo.toLowerCase() : "";
        const cCat = sel.categoria ? sel.categoria.toLowerCase() : "";
        return pCat.includes(cCat) || cCat.includes(pCat) || (pCat.includes("u13") && cCat.includes("u13"));
      }
      return false;
    });
  }, [sel]);

  const tabla = useMemo(() => {
    if (!sel) return [];

    const teamsMap = new Map<string, {
      equipo: string;
      pj: number;
      pg: number;
      pe: number;
      pp: number;
      gf: number;
      gc: number;
      dg: number;
      pts: number;
    }>();

    const getTeamRecord = (name: string) => {
      if (!teamsMap.has(name)) {
        teamsMap.set(name, {
          equipo: name,
          pj: 0,
          pg: 0,
          pe: 0,
          pp: 0,
          gf: 0,
          gc: 0,
          dg: 0,
          pts: 0,
        });
      }
      return teamsMap.get(name)!;
    };

    // Scan all matching matches to populate participating teams
    for (const p of partidos) {
      const { local, visitante } = getMatchTeams(p);
      if (local) getTeamRecord(local);
      if (visitante) getTeamRecord(visitante);
    }

    // Filter matches that are played (estado === "jugado")
    const playedMatches = partidos.filter(p => p.estado === "jugado" && p.resultado);

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
    }

    for (const rec of teamsMap.values()) {
      rec.dg = rec.gf - rec.gc;
    }

    return Array.from(teamsMap.values()).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
  }, [sel, partidos]);

  const topGoleadores = useMemo(() => {
    const goalsMap = new Map<string, number>();

    const playedMatches = partidos.filter(p => p.estado === "jugado" && Array.isArray(p.eventos));

    for (const p of playedMatches) {
      for (const e of p.eventos) {
        if (e.tipo === "gol" && e.jugador) {
          const playerName = e.jugador.trim();
          goalsMap.set(playerName, (goalsMap.get(playerName) || 0) + 1);
        }
      }
    }

    return Array.from(goalsMap.entries())
      .map(([name, goals]) => ({ nombre: name, goles: goals }))
      .sort((a, b) => b.goles - a.goles)
      .slice(0, 5);
  }, [partidos]);

  const temp = useMemo(() => {
    if (!sel) return null;
    return temporadasList.find((t) => t.id === sel.temporadaId || t.nombre === sel.temporadaId);
  }, [sel, temporadasList]);

  const handleCreateCompeticion = () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre de la competición es obligatorio.");
      return;
    }

    const newComp = RendimientoStore.addCompeticion({
      nombre: form.nombre,
      tipo: form.tipo,
      disciplina: form.disciplina,
      categoria: form.categoria,
      equipos: Number(form.equipos),
      jornadaActual: Number(form.jornadaActual),
      jornadas: Number(form.jornadas),
      temporadaId: form.temporadaId,
      sedes: form.sedes.length > 0 ? form.sedes : ["Sede Central"],
      estado: "en_curso"
    });

    toast.success("¡Nueva competición registrada con éxito!");
    setIsOpenCreate(false);
    
    // Reset form name and reload lists
    setForm(f => ({ ...f, nombre: "" }));
    loadData();
    setSel(newComp);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Competiciones</h1>
          <p className="text-sm text-muted-foreground">Ligas, copas y torneos de la organización.</p>
        </div>
        <Button onClick={() => setIsOpenCreate(true)}>
          <Plus className="mr-1 h-4 w-4" />Nueva competición
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
        <div className="space-y-2">
          {competicionesList.map((c) => (
            <button key={c.id} onClick={() => setSel(c)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${sel?.id === c.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{c.nombre}</span>
                <Badge variant="secondary" className={tipoColor[c.tipo] ?? ""}>{c.tipo}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{c.disciplina} · {c.categoria} · {c.equipos} equipos</p>
              <div className="mt-2">
                <Progress value={(c.jornadaActual / c.jornadas) * 100} className="h-1.5" />
                <p className="mt-1 text-xs text-muted-foreground">Jornada {c.jornadaActual} / {c.jornadas}</p>
              </div>
            </button>
          ))}
          {competicionesList.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground border-2 border-dashed rounded-xl">
              No hay competiciones registradas.
            </div>
          )}
        </div>

        {sel ? (
          <div className="space-y-4">
            <Card className="shadow-card bg-card border-border">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-foreground"><Trophy className="h-5 w-5 text-primary" />{sel.nombre}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                      <span>{sel.tipo}</span>
                      <span>{temp?.nombre || "Sin temporada"}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{sel.sedes?.join(", ")}</span>
                    </CardDescription>
                  </div>
                  <Link to="/partidos" className="text-sm text-primary hover:underline inline-flex items-center gap-1 font-bold">
                    Ver partidos <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Equipo</th>
                        <th className="p-2 text-center">PJ</th>
                        <th className="p-2 text-center">PG</th>
                        <th className="p-2 text-center">PE</th>
                        <th className="p-2 text-center">PP</th>
                        <th className="p-2 text-center">GF</th>
                        <th className="p-2 text-center">GC</th>
                        <th className="p-2 text-center">DG</th>
                        <th className="p-2 text-center font-semibold text-foreground">PTS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabla.map((s, i) => (
                        <tr key={s.equipo} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                          <td className="p-2 font-medium text-foreground">{i + 1}</td>
                          <td className="p-2 font-medium text-foreground flex items-center gap-2">
                            {i === 0 && <Medal className="h-3 w-3 text-warning animate-pulse" />}
                            {s.equipo}
                          </td>
                          <td className="p-2 text-center text-muted-foreground">{s.pj}</td>
                          <td className="p-2 text-center text-muted-foreground">{s.pg}</td>
                          <td className="p-2 text-center text-muted-foreground">{s.pe}</td>
                          <td className="p-2 text-center text-muted-foreground">{s.pp}</td>
                          <td className="p-2 text-center text-muted-foreground">{s.gf}</td>
                          <td className="p-2 text-center text-muted-foreground">{s.gc}</td>
                          <td className="p-2 text-center text-muted-foreground">{s.dg > 0 ? `+${s.dg}` : s.dg}</td>
                          <td className="p-2 text-center font-semibold text-foreground">{s.pts}</td>
                        </tr>
                      ))}
                      {tabla.length === 0 && (
                        <tr><td colSpan={10} className="p-4 text-center text-muted-foreground text-xs">Sin tabla disponible para esta competición.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-card border-border shadow-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2 text-foreground"><Swords className="h-4 w-4 text-primary" />Próximos partidos</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {partidos.slice(0, 4).map((p: any) => {
                    const { local, visitante } = getMatchTeams(p);
                    return (
                      <div key={p.id} className="rounded-lg border border-border p-2.5 text-sm bg-muted/5 hover:bg-muted/20 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {local} vs {visitante}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {p.estado === "jugado" ? "Final" : p.estado === "en_curso" ? "En vivo" : "Prog"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.fecha} · {p.hora} · {p.sede}
                          {p.estado === "jugado" && p.resultado && (
                            <span className="font-bold text-primary ml-1.5 bg-primary/10 px-1.5 py-0.5 rounded">
                              {p.resultado.propio} - {p.resultado.rival}
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                  {partidos.length === 0 && <p className="text-xs text-muted-foreground py-2 text-center">Sin partidos programados.</p>}
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2 text-foreground"><Medal className="h-4 w-4 text-primary" />Máximos goleadores</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {topGoleadores.map((g, idx) => (
                    <div key={g.nombre} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm bg-muted/5 hover:bg-muted/10 transition-all">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary w-5">{idx + 1}.</span>
                        <span className="font-semibold text-foreground">{g.nombre}</span>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary font-bold text-xs">
                        ⚽ {g.goles} {g.goles === 1 ? "gol" : "goles"}
                      </Badge>
                    </div>
                  ))}
                  {topGoleadores.length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">No hay estadísticas de goleadores disponibles en este momento.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="shadow-card flex items-center justify-center p-8 bg-card border-border border-2 border-dashed">
            <p className="text-sm text-muted-foreground">No hay ninguna competición seleccionada o creada.</p>
          </Card>
        )}
      </div>

      {/* Modal Nueva Competición */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> Nueva Competición
              </CardTitle>
              <button 
                onClick={() => setIsOpenCreate(false)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre de la Competición *</label>
                <Input 
                  placeholder="Ej: Liga Menor Oro U-15"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo *</label>
                  <select 
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="Liga">Liga</option>
                    <option value="Copa">Copa</option>
                    <option value="Torneo">Torneo</option>
                    <option value="Festival">Festival</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Disciplina</label>
                  <select 
                    value={form.disciplina}
                    onChange={e => setForm(f => ({ ...f, disciplina: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {disciplinasList.length > 0 ? (
                      disciplinasList.map((d: any) => {
                        const name = typeof d === "string" ? d : (d.nombre || "Fútbol");
                        return <option key={name} value={name}>{name}</option>;
                      })
                    ) : (
                      <>
                        <option value="Fútbol">Fútbol</option>
                        <option value="Baloncesto">Baloncesto</option>
                        <option value="Voleibol">Voleibol</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Categoría *</label>
                  <select 
                    value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {categoriasList.map((c: any) => (
                      <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ))}
                    {categoriasList.length === 0 && (
                      <option value="Sub-15">Sub-15</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Equipos</label>
                  <Input 
                    type="number"
                    value={form.equipos}
                    onChange={e => setForm(f => ({ ...f, equipos: Number(e.target.value) }))}
                    className="bg-background border-input text-foreground h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Jornadas</label>
                  <Input 
                    type="number"
                    value={form.jornadas}
                    onChange={e => setForm(f => ({ ...f, jornadas: Number(e.target.value) }))}
                    className="bg-background border-input text-foreground h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Temporada *</label>
                  <select 
                    value={form.temporadaId}
                    onChange={e => setForm(f => ({ ...f, temporadaId: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {temporadasList.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                    {temporadasList.length === 0 && (
                      <option value="">Sin temporadas</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Sede Sede</label>
                  <select 
                    multiple
                    value={form.sedes}
                    onChange={e => {
                      const opts = Array.from(e.target.selectedOptions, option => option.value);
                      setForm(f => ({ ...f, sedes: opts }));
                    }}
                    className="w-full h-16 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {sedesList.map(s => (
                      <option key={s.id} value={s.nombre}>{s.nombre}</option>
                    ))}
                    {sedesList.length === 0 && (
                      <option value="Sede Central">Sede Central</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold h-9"
                  onClick={handleCreateCompeticion}
                >
                  Registrar Competición
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs h-9" 
                  onClick={() => setIsOpenCreate(false)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default CompeticionesPage;
