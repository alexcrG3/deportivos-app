import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Swords, MapPin, Trophy, Plus, User, Award, Trash2, Edit, X } from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/hooks/use-role";
import { toast } from "sonner";
import { CoachOsBanner } from "@/components/coach-os-banner";

const estadoMeta: Record<string, { label: string; className: string }> = {
  confirmado: { label: "Confirmado", className: "bg-success/15 text-success border-success/20" },
  pendiente: { label: "Pendiente", className: "bg-warning/15 text-warning border-warning/20" },
  rechazado: { label: "Rechazado", className: "bg-destructive/15 text-destructive border-destructive/20" },
  lesionado: { label: "Lesionado", className: "bg-destructive/15 text-destructive border-destructive/20" },
  suspendido: { label: "Suspendido", className: "bg-muted text-muted-foreground border-transparent" },
};

export const Route = createFileRoute("/_app/partidos")({ component: PartidosPage });

interface MatchEvent {
  minuto: number;
  tipo: "gol" | "tarjeta_amarilla" | "asistencia";
  jugador: string;
}

interface Match {
  id: string;
  equipoId?: string;
  equipo: string;
  rival: string;
  tipo: "Liga" | "Copa" | "Amistoso" | "Torneo";
  fecha: string;
  hora: string;
  sede: string;
  local: boolean;
  estado: "jugado" | "programado" | "en_curso";
  formacion: string;
  capitan: string;
  resultado?: { propio: number; rival: number } | null;
  mvp?: string | null;
  eventos?: MatchEvent[];
}

const getDisciplineSettings = (disc: string) => {
  const d = (disc || "").toLowerCase();
  if (d.includes("basket") || d.includes("baloncesto") || d.includes("básquet")) {
    return {
      scoreLabel: "Puntos",
      actionLabel: "+ Anotar",
      scorerTitle: "Detalles de Encestadores (Puntos)",
      scorerSelectPlaceholder: "-- Seleccionar Encestador --",
      scorerUnit: "pts",
      scoreWidth: "w-20",
      inputPlaceholder: "Pts",
      valueType: "number",
      icon: "🏀",
    };
  }
  if (d.includes("voley") || d.includes("voleibol")) {
    return {
      scoreLabel: "Sets",
      actionLabel: "+ Anotar",
      scorerTitle: "Sets / Puntos por Jugador",
      scorerSelectPlaceholder: "-- Seleccionar Jugador --",
      scorerUnit: "pts",
      scoreWidth: "w-14",
      inputPlaceholder: "Set/Pts",
      valueType: "number",
      icon: "🏐",
    };
  }
  if (d.includes("natac") || d.includes("swimming")) {
    return {
      scoreLabel: "Posiciones / Tiempos",
      actionLabel: "+ Registrar",
      scorerTitle: "Tiempos Registrados por Nadador",
      scorerSelectPlaceholder: "-- Seleccionar Nadador --",
      scorerUnit: "",
      scoreWidth: "w-24",
      inputPlaceholder: "Tiempo",
      valueType: "text",
      icon: "🏊",
    };
  }
  return {
    scoreLabel: "Goles",
    actionLabel: "+ Agregar",
    scorerTitle: "Detalles de Anotadores (Goles)",
    scorerSelectPlaceholder: "-- Seleccionar Goleador --",
    scorerUnit: "Min",
    scoreWidth: "w-14",
    inputPlaceholder: "Min",
    valueType: "minute",
    icon: "⚽",
  };
};

function PartidosPage() {
  const { role, coachName, selectedCoachId, selectedCoachName } = useRole();
  const [list, setList] = useState<Match[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenScoreboard, setIsOpenScoreboard] = useState(false);
  const [scoreboardForm, setScoreboardForm] = useState<Match | null>(null);

  // Cargar equipos del coach/admin
  const dynamicEquipos = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (role === "admin") return all;
    return all.filter(t => t.entrenador === coachName);
  }, [role, coachName]);

  // Helper para normalizar categorías
  const normalizeCategoryName = (s: string) => {
    return s.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace("elite", "")
      .replace("sub", "")
      .replace("futbol", "")
      .replace("femenino", "")
      .trim();
  };

  // Cargar jugadores del coach/admin
  const dynamicJugadores = useMemo(() => {
    const allPlayers = RendimientoStore.getJugadores();
    if (role === "admin") return allPlayers;
    
    return allPlayers.filter(p => {
      const pCat = normalizeCategoryName(p.categoria || "");
      return dynamicEquipos.some(eq => {
        const tCat = normalizeCategoryName(eq.categoria || eq.nombre || "");
        return pCat === tCat || (tCat && pCat.includes(tCat)) || (pCat && tCat.includes(pCat));
      });
    });
  }, [role, dynamicEquipos]);

  // Form states
  const [newForm, setNewForm] = useState({
    equipoId: "",
    rival: "",
    tipo: "Liga" as Match["tipo"],
    fecha: new Date().toISOString().slice(0, 10),
    hora: "09:00",
    sede: "Sede Central (Cancha Principal)",
    local: true,
    formacion: "4-3-3",
    capitan: "",
    estado: "programado" as Match["estado"],
    scorePropio: 0,
    scoreRival: 0,
    mvp: "",
  });

  // Inicializar valores de formulario por defecto cuando se cargan equipos y jugadores
  useEffect(() => {
    if (dynamicEquipos.length > 0 && !newForm.equipoId) {
      setNewForm(f => ({ ...f, equipoId: dynamicEquipos[0].id }));
    }
  }, [dynamicEquipos]);

  useEffect(() => {
    if (dynamicJugadores.length > 0 && !newForm.capitan) {
      setNewForm(f => ({ ...f, capitan: dynamicJugadores[0].nombre }));
    }
  }, [dynamicJugadores]);

  const [editForm, setEditForm] = useState<Match | null>(null);
  const [convocatorias, setConvocatorias] = useState<any[]>([]);

  const loadPartidos = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    let query = supabase
      .from("partidos")
      .select("*")
      .eq("organizacion_id", orgId)
      .order("fecha", { ascending: false });

    // Fetch convocatorias for the same organization
    const { data: convData } = await supabase
      .from("convocatorias")
      .select("*")
      .eq("organizacion_id", orgId);
    if (convData) {
      setConvocatorias(convData);
    }

    // Everyone (Admins, Coaches, and Parents) can view all matches globally in Competiciones. No query filtering by coach teams.

    const { data, error } = await query;
    if (error) {
      toast.error("Error cargando partidos: " + error.message);
      return;
    }
    const allTeams = RendimientoStore.getEquipos();
    const mapped: Match[] = (data || []).map((p: any) => {
      const matchTeam = allTeams.find(t => t.id === p.equipo_id);
      return {
        id: p.id,
        equipoId: p.equipo_id,
        equipo: matchTeam ? matchTeam.nombre : (p.equipo || "—"),
        rival: p.rival,
        tipo: p.tipo || "Liga",
        fecha: p.fecha,
        hora: p.hora || "09:00",
        sede: p.sede || "",
        local: p.local ?? true,
        formacion: p.formacion || "4-3-3",
        capitan: p.capitan || "",
        estado: p.estado || "programado",
        resultado: p.resultado || null,
        mvp: p.mvp || null,
        eventos: p.eventos || [],
      };
    });
    setList(mapped);
    if (mapped.length > 0) setSelectedId(mapped[0].id);
  };

  useEffect(() => { loadPartidos(); }, [role]);

  const saveToStorage = async (updatedList: Match[]) => {
    setList(updatedList);
    // Persist latest item to Supabase (upsert)
    if (updatedList.length > 0) {
      const m = updatedList[0];
      const orgId = RendimientoStore.getActiveOrganizacionId();
      await supabase.from("partidos").upsert({
        id: m.id, equipo_id: m.equipoId, equipo: m.equipo, rival: m.rival,
        tipo: m.tipo, fecha: m.fecha, hora: m.hora, sede: m.sede, local: m.local,
        formacion: m.formacion, capitan: m.capitan, estado: m.estado,
        resultado: m.resultado, mvp: m.mvp, eventos: m.eventos, organizacion_id: orgId,
      });
    }
  };

  const sel = useMemo(() => {
    return list.find(m => m.id === selectedId) || list[0] || null;
  }, [list, selectedId]);

  const matchConvocatoria = useMemo(() => {
    if (!sel) return null;
    return convocatorias.find((c: any) => 
      c.partido_id === sel.id || 
      c.partidoId === sel.id ||
      (c.fecha === sel.fecha && c.rival === sel.rival)
    );
  }, [sel, convocatorias]);

  const jugado = sel ? sel.estado === "jugado" && sel.resultado : false;

  const playerLoadsMap = useMemo(() => {
    const data = RendimientoStore.getPlayerLoadData();
    return new Map(data.map(d => [d.jugador.toLowerCase(), d.semaforo]));
  }, []);

  const handleCreateMatch = () => {
    if (!newForm.rival.trim()) {
      toast.error("El nombre del rival es obligatorio.");
      return;
    }
    const team = dynamicEquipos.find(e => e.id === newForm.equipoId) || dynamicEquipos[0];
    if (!team) {
      toast.error("No hay equipos asignados para registrar partidos.");
      return;
    }
    
    // Create new match object
    const newMatch: Match = {
      id: `match_${Date.now()}`,
      equipoId: team.id,
      equipo: team.nombre,
      rival: newForm.rival,
      tipo: newForm.tipo,
      fecha: newForm.fecha,
      hora: newForm.hora,
      sede: newForm.sede,
      local: newForm.local,
      formacion: newForm.formacion,
      capitan: newForm.capitan,
      estado: newForm.estado,
      resultado: newForm.estado === "jugado" ? { propio: newForm.scorePropio, rival: newForm.scoreRival } : null,
      mvp: newForm.estado === "jugado" && newForm.mvp ? newForm.mvp : null,
      eventos: newForm.estado === "jugado" ? [
        { minuto: 15, tipo: "gol", jugador: newForm.capitan },
        { minuto: 40, tipo: "tarjeta_amarilla", jugador: dynamicJugadores[1]?.nombre || "Jugador" }
      ] : [],
    };

    const updated = [newMatch, ...list];
    saveToStorage(updated);
    setSelectedId(newMatch.id);
    setIsOpenCreate(false);
    
    // Reset form
    setNewForm({
      equipoId: dynamicEquipos[0]?.id || "",
      rival: "",
      tipo: "Liga",
      fecha: new Date().toISOString().slice(0, 10),
      hora: "09:00",
      sede: "Sede Central (Cancha Principal)",
      local: true,
      formacion: "4-3-3",
      capitan: dynamicJugadores[0]?.nombre || "",
      estado: "programado",
      scorePropio: 0,
      scoreRival: 0,
      mvp: "",
    });

    toast.success("¡Partido registrado con éxito!");
  };

  const handleOpenEdit = () => {
    if (!sel) return;
    setEditForm({
      ...sel,
    });
    setIsOpenEdit(true);
  };

  const handleUpdateMatch = () => {
    if (!editForm) return;
    if (!editForm.rival.trim()) {
      toast.error("El nombre del rival es obligatorio.");
      return;
    }

    const updated = list.map(m => {
      if (m.id === editForm.id) {
        return {
          ...editForm,
        };
      }
      return m;
    });

    saveToStorage(updated);
    setIsOpenEdit(false);
    setEditForm(null);
    toast.success("¡Partido actualizado correctamente!");
  };

  const handleOpenScoreboard = () => {
    if (!sel) return;
    setScoreboardForm({
      ...sel,
      resultado: sel.resultado || { propio: 0, rival: 0 },
      mvp: sel.mvp || "",
      eventos: sel.eventos || [],
    });
    setIsOpenScoreboard(true);
  };

  const handleSaveScoreboard = () => {
    if (!scoreboardForm) return;
    const updated = list.map(m => {
      if (m.id === scoreboardForm.id) {
        return {
          ...m,
          estado: "jugado" as Match["estado"],
          resultado: scoreboardForm.resultado,
          mvp: scoreboardForm.mvp || null,
          eventos: scoreboardForm.eventos || [],
        };
      }
      return m;
    });

    saveToStorage(updated);
    setIsOpenScoreboard(false);
    setScoreboardForm(null);
    toast.success("¡Marcador y eventos registrados con éxito!");
  };

  const handleDeleteMatch = (id: string, rivalName: string) => {
    const updated = list.filter(m => m.id !== id);
    saveToStorage(updated);
    toast.success(`Partido vs ${rivalName} eliminado.`);
  };

  return (
    <div className="space-y-6">
      <CoachOsBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Partidos</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" && selectedCoachName
              ? `Partidos de ${selectedCoachName}`
              : "Gestión pre y post-partido — alimenta Player OS automáticamente."}
          </p>
        </div>
        {role !== "padres" && (
          <Button onClick={() => setIsOpenCreate(true)}>
            <Plus className="mr-1 h-4 w-4" />Nuevo partido
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay partidos registrados.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
          {/* Left: Match List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {list.map((m) => (
              <button 
                key={m.id} 
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                  selectedId === m.id 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground truncate max-w-[200px]">{m.equipo}</span>
                  <Badge variant={m.estado === "jugado" ? "secondary" : "default"} className={m.estado === "jugado" ? "bg-success/10 text-success border-success/20 text-[10px]" : "text-[10px]"}>
                    {m.estado === "jugado" ? "Jugado" : m.estado === "en_curso" ? "En Curso" : "Programado"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">vs {m.rival} · {m.fecha} {m.hora}</p>
                {m.resultado && (
                  <p className="mt-1.5 text-sm font-black text-primary">{m.resultado.propio} – {m.resultado.rival}</p>
                )}
              </button>
            ))}
          </div>

          {/* Right: Selected Match Details */}
          {sel && (
            <Card className="shadow-card bg-card border-border">
              <CardHeader className="p-4 pb-3 border-b border-border">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                      <Swords className="h-5 w-5 text-primary" />{sel.equipo} vs {sel.rival}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-3 pt-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] font-bold">{sel.tipo}</Badge>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{sel.sede} · {sel.local ? "Local" : "Visitante"}</span>
                      <span className="font-semibold text-primary">Formación {sel.formacion}</span>
                    </CardDescription>
                  </div>
                  {role !== "padres" && (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={handleOpenEdit} className="border-border text-xs font-semibold">
                        Editar Partido
                      </Button>
                      <Button size="sm" onClick={handleOpenScoreboard} className="bg-primary text-white text-xs font-semibold">
                        Cargar Marcador
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg border border-transparent"
                        onClick={() => handleDeleteMatch(sel.id, sel.rival)}
                        title="Eliminar partido"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {jugado && sel.resultado && (
                  <div className="mt-4 flex items-center justify-between bg-primary/5 rounded-2xl p-4 border border-primary/10">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Resultado Final</p>
                      <p className="text-3xl font-black text-foreground mt-0.5">{sel.resultado.propio} – {sel.resultado.rival}</p>
                    </div>
                    {sel.mvp && (
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 justify-end"><Award className="h-3.5 w-3.5 text-amber-500" />Jugador del Partido (MVP)</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{sel.mvp}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Capitán Designado</p>
                  <div className="flex items-center gap-2 bg-muted/30 p-2.5 rounded-xl border border-border/50 w-fit">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                      {sel.capitan}
                      {(() => {
                        const sem = playerLoadsMap.get(sel.capitan.toLowerCase());
                        if (sem === "rojo") return <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Riesgo Alto" />;
                        if (sem === "amarillo") return <span className="inline-block h-2 w-2 rounded-full bg-amber-500" title="Sobrecarga" />;
                        if (sem === "verde") return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Óptimo" />;
                        return null;
                      })()}
                    </span>
                  </div>
                </div>

                {sel.estado === "jugado" && sel.eventos && sel.eventos.length > 0 ? (
                  <div>
                    <p className="mb-2.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Línea de Tiempo & Eventos</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {sel.eventos.map((e, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-2.5 text-xs bg-card">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">{e.minuto}'</span>
                          <span className="flex-1 flex items-center gap-1.5 font-semibold text-foreground truncate">
                            {e.jugador}
                            {(() => {
                              const sem = playerLoadsMap.get(e.jugador.toLowerCase());
                              if (sem === "rojo") return <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Riesgo Alto" />;
                              if (sem === "amarillo") return <span className="inline-block h-2 w-2 rounded-full bg-amber-500" title="Sobrecarga" />;
                              if (sem === "verde") return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Óptimo" />;
                              return null;
                            })()}
                          </span>
                          <Badge variant={e.tipo === "gol" ? "default" : e.tipo === "tarjeta_amarilla" ? "secondary" : "outline"}
                            className={e.tipo === "gol" ? "bg-success/10 text-success border-success/20 text-[10px]" : e.tipo === "tarjeta_amarilla" ? "bg-warning/10 text-warning border-warning/20 text-[10px]" : "text-[10px]"}>
                            {e.tipo === "gol" ? "⚽ Gol" : e.tipo === "tarjeta_amarilla" ? "🟨 Amarilla" : "🎯 Asistencia"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : matchConvocatoria ? (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-border pb-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Convocatoria del Partido</p>
                        <h4 className="text-sm font-bold text-foreground mt-0.5">{matchConvocatoria.titulo}</h4>
                      </div>
                      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20 font-semibold">
                        {matchConvocatoria.jugadores?.length || 0} Convocados
                      </Badge>
                    </div>

                    {matchConvocatoria.notas && (
                      <p className="text-xs text-muted-foreground italic mb-4 bg-muted/20 p-2.5 rounded-lg border border-border/40">
                        "{matchConvocatoria.notas}"
                      </p>
                    )}

                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider mb-2.5">
                      Lista de Convocados
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(matchConvocatoria.jugadores || []).map((j: any) => {
                        const meta = estadoMeta[j.estado] || estadoMeta.pendiente;
                        return (
                          <div key={j.id} className="flex items-center gap-3 rounded-xl border border-border p-2.5 justify-between bg-card">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarImage src={j.avatar} />
                                <AvatarFallback>{j.nombre ? j.nombre[0] : "P"}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate flex items-center gap-1.5 text-foreground leading-tight">
                                  {j.nombre}
                                  {(() => {
                                    const sem = playerLoadsMap.get(j.nombre.toLowerCase());
                                    if (sem === "rojo") return <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Riesgo Alto" />;
                                    if (sem === "amarillo") return <span className="inline-block h-2 w-2 rounded-full bg-amber-500" title="Sobrecarga" />;
                                    if (sem === "verde") return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Óptimo" />;
                                    return null;
                                  })()}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{j.posicion}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className={`${meta.className} text-[9px] px-2 py-0.5 rounded-full shrink-0 border`}>
                              {meta.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-muted/10">
                    <Trophy className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" />
                    Partido programado. Registra la alineación y la convocatoria antes del inicio para recibir alertas.
                    <div className="mt-4 flex justify-center gap-2">
                      <Button size="xs" variant="outline" onClick={() => toast.info("Visualizador de alineación próximamente en Parte 2")}>Ver alineación</Button>
                      <Button size="xs" onClick={() => window.location.href = '/convocatorias'}>Convocar jugadores</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* New Match Modal */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border shrink-0">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" /> Registrar Nuevo Partido
              </CardTitle>
              <button 
                onClick={() => setIsOpenCreate(false)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <div className="p-4 pt-2 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Equipo Local (Club) *</label>
                  <select 
                    value={newForm.equipoId}
                    onChange={e => setNewForm(f => ({ ...f, equipoId: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {dynamicEquipos.map(eq => (
                      <option key={eq.id} value={eq.id} className="bg-background text-foreground">{eq.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Equipo Rival *</label>
                  <input 
                    type="text" 
                    value={newForm.rival}
                    onChange={e => setNewForm(f => ({ ...f, rival: e.target.value }))}
                    placeholder="E.g. Saprissa FC"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo *</label>
                  <select 
                    value={newForm.tipo}
                    onChange={e => setNewForm(f => ({ ...f, tipo: e.target.value as Match["tipo"] }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="Liga" className="bg-background text-foreground">Liga</option>
                    <option value="Copa" className="bg-background text-foreground">Copa</option>
                    <option value="Amistoso" className="bg-background text-foreground">Amistoso</option>
                    <option value="Torneo" className="bg-background text-foreground">Torneo</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Local / Visitante</label>
                  <select 
                    value={newForm.local ? "true" : "false"}
                    onChange={e => setNewForm(f => ({ ...f, local: e.target.value === "true" }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="true" className="bg-background text-foreground">Local</option>
                    <option value="false" className="bg-background text-foreground">Visitante</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado *</label>
                  <select 
                    value={newForm.estado}
                    onChange={e => setNewForm(f => ({ ...f, estado: e.target.value as Match["estado"] }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="programado" className="bg-background text-foreground">Programado</option>
                    <option value="jugado" className="bg-background text-foreground">Jugado (Finalizado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha *</label>
                  <input 
                    type="date" 
                    value={newForm.fecha}
                    onChange={e => setNewForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Hora *</label>
                  <input 
                    type="time" 
                    value={newForm.hora}
                    onChange={e => setNewForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Instalación / Sede *</label>
                <input 
                  type="text" 
                  value={newForm.sede}
                  onChange={e => setNewForm(f => ({ ...f, sede: e.target.value }))}
                  placeholder="E.g. Sede Central (Cancha Principal)"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Formación sugerida *</label>
                  <input 
                    type="text" 
                    value={newForm.formacion}
                    onChange={e => setNewForm(f => ({ ...f, formacion: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Capitán *</label>
                  <select 
                    value={newForm.capitan}
                    onChange={e => setNewForm(f => ({ ...f, capitan: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {dynamicJugadores.map(jg => (
                      <option key={jg.id} value={jg.nombre} className="bg-background text-foreground">{jg.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newForm.estado === "jugado" && (
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-3 space-y-3">
                  <p className="text-[10px] font-black uppercase text-primary">Detalles del Resultado</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Goles Club *</label>
                      <input 
                        type="number" 
                        value={newForm.scorePropio}
                        onChange={e => setNewForm(f => ({ ...f, scorePropio: parseInt(e.target.value) || 0 }))}
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Goles Rival *</label>
                      <input 
                        type="number" 
                        value={newForm.scoreRival}
                        onChange={e => setNewForm(f => ({ ...f, scoreRival: parseInt(e.target.value) || 0 }))}
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Jugador del partido (MVP)</label>
                    <select 
                      value={newForm.mvp}
                      onChange={e => setNewForm(f => ({ ...f, mvp: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                    >
                      <option value="" className="bg-background text-foreground">Ninguno</option>
                      {dynamicJugadores.map(jg => (
                        <option key={jg.id} value={jg.nombre} className="bg-background text-foreground">{jg.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border shrink-0 bg-muted/10 flex gap-2">
              <Button 
                className="flex-1 bg-primary text-white text-xs font-bold"
                onClick={handleCreateMatch}
              >
                Publicar Partido
              </Button>
              <Button 
                variant="outline" 
                className="border-border text-muted-foreground text-xs" 
                onClick={() => setIsOpenCreate(false)}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
      {/* Edit Match Modal */}
      {isOpenEdit && editForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col rounded-xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border shrink-0">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" /> Editar Configuración del Partido
              </CardTitle>
              <button 
                onClick={() => setIsOpenEdit(false)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <div className="p-4 pt-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Equipo Rival *</label>
                  <input 
                    type="text" 
                    value={editForm.rival}
                    onChange={e => setEditForm(prev => prev ? { ...prev, rival: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado *</label>
                  <select 
                    value={editForm.estado}
                    onChange={e => setEditForm(prev => prev ? { ...prev, estado: e.target.value as Match["estado"] } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="programado">Programado</option>
                    <option value="en_curso">En curso</option>
                    <option value="jugado">Jugado (Finalizado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo *</label>
                  <select 
                    value={editForm.tipo}
                    onChange={e => setEditForm(prev => prev ? { ...prev, tipo: e.target.value as Match["tipo"] } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="Liga">Liga</option>
                    <option value="Copa">Copa</option>
                    <option value="Amistoso">Amistoso</option>
                    <option value="Torneo">Torneo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Localía</label>
                  <select 
                    value={editForm.local ? "true" : "false"}
                    onChange={e => setEditForm(prev => prev ? { ...prev, local: e.target.value === "true" } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="true">Local</option>
                    <option value="false">Visitante</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Formación *</label>
                  <input 
                    type="text" 
                    value={editForm.formacion}
                    onChange={e => setEditForm(prev => prev ? { ...prev, formacion: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha *</label>
                  <input 
                    type="date" 
                    value={editForm.fecha}
                    onChange={e => setEditForm(prev => prev ? { ...prev, fecha: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Hora *</label>
                  <input 
                    type="time" 
                    value={editForm.hora}
                    onChange={e => setEditForm(prev => prev ? { ...prev, hora: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Instalación / Sede *</label>
                  <input 
                    type="text" 
                    value={editForm.sede}
                    onChange={e => setEditForm(prev => prev ? { ...prev, sede: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Capitán *</label>
                  <select 
                    value={editForm.capitan}
                    onChange={e => setEditForm(prev => prev ? { ...prev, capitan: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {dynamicJugadores.map(jg => (
                      <option key={jg.id} value={jg.nombre} className="bg-background text-foreground">{jg.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-border shrink-0 bg-muted/10 flex gap-2">
              <Button 
                className="flex-1 bg-primary text-white text-xs font-bold h-9"
                onClick={handleUpdateMatch}
              >
                Guardar Configuración
              </Button>
              <Button 
                variant="outline" 
                className="border-border text-muted-foreground text-xs h-9" 
                onClick={() => setIsOpenEdit(false)}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Scoreboard / Cargar Resultado Modal */}
      {isOpenScoreboard && scoreboardForm && (() => {
        const matchTeamForDisc = dynamicEquipos.find(e => e.id === scoreboardForm.equipoId);
        const discipline = matchTeamForDisc?.disciplina || scoreboardForm.disciplina || "Fútbol";
        const settings = getDisciplineSettings(discipline);

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-card border-border w-full max-w-lg shadow-2xl overflow-hidden max-h-[95vh] flex flex-col rounded-xl">
              {/* Stadium Scoreboard Header */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-6 text-center relative border-b border-white/10 shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25)_0%,transparent_75%)] pointer-events-none" />
                <button 
                  onClick={() => setIsOpenScoreboard(false)} 
                  className="absolute top-4 right-4 text-white/70 hover:text-white text-xs bg-white/10 hover:bg-white/20 p-1 px-2.5 rounded-lg transition-colors"
                >
                  ✕ Cerrar
                </button>
                
                <p className="text-[10px] uppercase tracking-widest font-black text-indigo-400 mb-1">
                  Registrar Marcador Oficial · {discipline}
                </p>
                
                <div className="flex items-center justify-center gap-6 mt-4">
                  {/* Local/Club team */}
                  <div className="flex-1 text-right">
                    <p className="text-base font-black truncate">{scoreboardForm.equipo}</p>
                    <p className="text-[10px] text-indigo-300 font-medium">{scoreboardForm.local ? "Local" : "Visitante"}</p>
                  </div>
                  
                  {/* Score inputs */}
                  <div className="flex items-center gap-2 bg-black/40 p-2.5 rounded-xl border border-white/15 shrink-0">
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      value={scoreboardForm.resultado?.propio ?? ""}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setScoreboardForm(prev => prev ? { 
                          ...prev, 
                          resultado: { propio: val, rival: prev.resultado?.rival || 0 } 
                        } : null);
                      }}
                      className={`h-14 text-3xl font-black text-center bg-slate-950 text-white rounded-lg border border-indigo-500/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${settings.scoreWidth}`}
                    />
                    <span className="text-2xl font-black text-indigo-400/60 px-1">:</span>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      value={scoreboardForm.resultado?.rival ?? ""}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setScoreboardForm(prev => prev ? { 
                          ...prev, 
                          resultado: { propio: prev.resultado?.propio || 0, rival: val } 
                        } : null);
                      }}
                      className={`h-14 text-3xl font-black text-center bg-slate-950 text-white rounded-lg border border-indigo-500/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${settings.scoreWidth}`}
                    />
                  </div>
                  
                  {/* Rival team */}
                  <div className="flex-1 text-left">
                    <p className="text-base font-black truncate">{scoreboardForm.rival}</p>
                    <p className="text-[10px] text-indigo-300 font-medium">{!scoreboardForm.local ? "Local" : "Visitante"}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Eventos del Partido / Anotadores */}
                <div className="space-y-3 bg-muted/40 p-4 rounded-lg border border-border">
                  <p className="text-[10px] font-black uppercase text-indigo-400">{settings.scorerTitle}</p>
                  <div className="flex gap-2">
                    <select 
                      id="goleador-select"
                      className="flex-1 h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                    >
                      <option value="">{settings.scorerSelectPlaceholder}</option>
                      {dynamicJugadores.map(jg => (
                        <option key={jg.id} value={jg.nombre}>{jg.nombre}</option>
                      ))}
                    </select>
                    <input 
                      type={settings.valueType === "text" ? "text" : "number"}
                      id="goleador-minuto"
                      placeholder={settings.inputPlaceholder}
                      className="w-20 h-9 rounded-lg border border-input bg-background px-2 text-xs text-center text-foreground outline-none"
                    />
                    <Button 
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 h-9"
                      onClick={() => {
                        const selJugador = (document.getElementById("goleador-select") as HTMLSelectElement).value;
                        const valInput = (document.getElementById("goleador-minuto") as HTMLInputElement).value;
                        if (!selJugador) {
                          toast.error("Selecciona un jugador");
                          return;
                        }
                        setScoreboardForm(prev => {
                          if (!prev) return null;
                          const newEventos = [...(prev.eventos || []), { 
                            tipo: settings.valueType === "minute" ? "gol" : "anotacion", 
                            jugador: selJugador, 
                            minuto: settings.valueType === "minute" ? (parseInt(valInput) || 90) : undefined,
                            valor: settings.valueType !== "minute" ? valInput : undefined
                          }];
                          
                          let newPropio = prev.resultado?.propio || 0;
                          if (settings.valueType === "minute") {
                            newPropio = newEventos.filter(e => e.tipo === "gol").length;
                          } else if (settings.valueType === "number") {
                            newPropio = newEventos.reduce((sum, e) => sum + (parseInt(e.valor) || 0), 0);
                          }
                          
                          return {
                            ...prev,
                            resultado: { propio: newPropio, rival: prev.resultado?.rival || 0 },
                            eventos: newEventos
                          };
                        });
                        (document.getElementById("goleador-select") as HTMLSelectElement).value = "";
                        (document.getElementById("goleador-minuto") as HTMLInputElement).value = "";
                      }}
                    >
                      {settings.actionLabel}
                    </Button>
                  </div>

                  <div className="space-y-1 max-h-[120px] overflow-y-auto pt-1">
                    {(scoreboardForm.eventos || []).map((ev, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-background p-2 rounded-lg border border-border">
                        <span className="font-medium text-foreground">
                          {settings.icon} {ev.jugador} {ev.minuto !== undefined ? `(Min ${ev.minuto}')` : `(${ev.valor} ${settings.scorerUnit})`}
                        </span>
                        <button 
                          className="text-destructive hover:underline text-[10px] font-bold"
                          onClick={() => {
                            setScoreboardForm(prev => {
                              if (!prev) return null;
                              const newEventos = (prev.eventos || []).filter((_, idx) => idx !== i);
                              let newPropio = prev.resultado?.propio || 0;
                              if (settings.valueType === "minute") {
                                newPropio = newEventos.filter(e => e.tipo === "gol").length;
                              } else if (settings.valueType === "number") {
                                newPropio = newEventos.reduce((sum, e) => sum + (parseInt(e.valor) || 0), 0);
                              }
                              return {
                                ...prev,
                                resultado: { propio: newPropio, rival: prev.resultado?.rival || 0 },
                                eventos: newEventos
                              };
                            });
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                    {(scoreboardForm.eventos || []).length === 0 && (
                      <p className="text-[10px] text-muted-foreground text-center py-2">
                        No se han registrado marcas todavía.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 bg-muted/40 p-3 rounded-lg border border-border">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Jugador más valioso (MVP)</label>
                  <select 
                    value={scoreboardForm.mvp || ""}
                    onChange={e => setScoreboardForm(prev => prev ? { ...prev, mvp: e.target.value || null } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="" className="bg-background text-foreground">Ninguno</option>
                    {dynamicJugadores.map(jg => (
                      <option key={jg.id} value={jg.nombre} className="bg-background text-foreground">{jg.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="p-4 border-t border-border shrink-0 bg-muted/10 flex gap-2">
                <Button 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9"
                  onClick={handleSaveScoreboard}
                >
                  Publicar Marcador y MVP
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs h-9" 
                  onClick={() => setIsOpenScoreboard(false)}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}

export default PartidosPage;
