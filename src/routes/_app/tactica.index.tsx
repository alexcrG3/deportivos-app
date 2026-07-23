import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import {
  ShieldHalf, Users, AlertTriangle, BookOpen, Play, Target,
  ChevronRight, Calendar, NotebookPen, Sparkles, Flag, Clock,
  Swords, TrendingUp, MapPin, Film, CheckCircle2, UserCheck, HeartPulse
} from "lucide-react";
import { TacticalStore } from "@/lib/tactical-store";
import { AIStore } from "@/lib/ai-store";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/hooks/use-role";
import { useEffect, useMemo } from "react";

export const Route = createFileRoute("/_app/tactica/")({ component: TacticaDashboard });

const PELIGRO_COLOR: Record<string, string> = {
  "bajo":     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "medio":    "bg-amber-500/10  text-amber-400  border-amber-500/20",
  "alto":     "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "muy-alto": "bg-red-500/10    text-red-400    border-red-500/20",
};

const NOTE_ICON: Record<string, string> = {
  tecnica: "🎯", tactica: "🧠", fisica: "⚡", mental: "🧘",
  medica: "🩺", nutricional: "🥗"
};

function TacticaDashboard() {
  const { role, coachName } = useRole();
  const [activeSubTab, setActiveSubTab] = useState<"cuerpo" | "reuniones">("cuerpo");
  const [dbPartidos, setDbPartidos] = useState<any[]>([]);
  const [dbConvocatorias, setDbConvocatorias] = useState<any[]>([]);

  // Load matches and convocatorias from Supabase
  useEffect(() => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    // 1. Partidos
    supabase.from("partidos").select("*").eq("organizacion_id", orgId).then(({ data }) => {
      if (data) setDbPartidos(data);
    });
    // 2. Convocatorias
    supabase.from("convocatorias").select("*").eq("organizacion_id", orgId).then(({ data }) => {
      if (data) setDbConvocatorias(data);
    });
  }, []);

  const myTeams = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (role === "admin") return all;
    return all.filter(t => t.entrenador === coachName);
  }, [role, coachName]);

  const teamFilterMatches = useMemo(() => {
    const myTeamsIds = myTeams.map(t => t.id);
    const myTeamsNames = myTeams.map(t => t.nombre);
    return dbPartidos.filter(m => {
      if (role === "admin") return true;
      return (m.equipo_id && myTeamsIds.includes(m.equipo_id)) || myTeamsNames.includes(m.equipo);
    });
  }, [dbPartidos, myTeams, role]);

  const teamFilterConvocs = useMemo(() => {
    return dbConvocatorias.filter(c => {
      if (role === "admin") return true;
      return myTeams.some(t => {
        const eq = (c.equipo || "").toLowerCase();
        const tn = (t.nombre || "").toLowerCase();
        const tc = (t.categoria || "").toLowerCase();
        return eq.includes(tn) || eq.includes(tc) || tn.includes(eq) || tc.includes(eq);
      });
    });
  }, [dbConvocatorias, myTeams, role]);

  const summary = TacticalStore.getSummary();
  const rivals = TacticalStore.getOpponents();
  const nextRival = rivals[0];
  const recs = AIStore.getRecommendations().slice(0, 3);
  const lastForm = TacticalStore.getFormations().find(f => f.id === "f-433");

  // Next upcoming match
  const nextMatch = useMemo(() => {
    return teamFilterMatches.find(m => m.estado === "programado") || teamFilterMatches[0] || null;
  }, [teamFilterMatches]);

  // Recent matches
  const recentMatches = useMemo(() => {
    return teamFilterMatches.filter(m => m.estado === "jugado").slice(0, 3);
  }, [teamFilterMatches]);

  // Active convocatoria
  const activeConvoc = useMemo(() => {
    return teamFilterConvocs[0] || null;
  }, [teamFilterConvocs]);

  // Part 3/3 metrics
  const weeklyPlans = TacticalStore.getWeeklyPlans();
  const videos = TacticalStore.getVideoAnalyses();
  const libItems = TacticalStore.getTacticalLibrary();
  const staffNotes = TacticalStore.getStaffNotes();
  const meetings = TacticalStore.getTechnicalMeetings();
  const staffMembers = TacticalStore.getStaff();

  // Calculate weekly trainings from actual Supabase sessions and completed attendances
  const currentWeekTrainings = useMemo(() => {
    const today = new Date();
    // Get start of current week (Monday)
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const sesiones = RendimientoStore.getSesiones();
    const asistencias = RendimientoStore.getAsistencias();

    // Map completed attendances (asistencias) to pseudo sessions
    const asistenciaPseudoSesiones = asistencias.map(a => ({
      fecha: a.fecha,
      equipo: a.equipo,
    }));

    const allWeeklyEvents = [
      ...sesiones.map(s => ({ fecha: s.fecha, equipo: s.equipo })),
      ...asistenciaPseudoSesiones
    ];

    // Remove duplicates on the same day for the same team
    const uniqueEvents: Record<string, boolean> = {};
    const filteredEvents = allWeeklyEvents.filter(e => {
      const matchTeam = myTeams.some(t => e.equipo === t.nombre || e.equipo === t.categoria);
      if (!matchTeam) return false;

      // Normalize date comparison by parsing YYYY-MM-DD
      const dateStr = e.fecha.includes("T") ? e.fecha.split("T")[0] : e.fecha;
      const eventDate = new Date(dateStr + "T00:00:00");
      const isInWeek = eventDate >= startOfWeek && eventDate <= endOfWeek;

      const key = `${dateStr}_${e.equipo}`;
      if (isInWeek && !uniqueEvents[key]) {
        uniqueEvents[key] = true;
        return true;
      }
      return false;
    });

    return filteredEvents;
  }, [myTeams]);

  // Filter video analyses to match only coach's teams
  const filteredVideos = useMemo(() => {
    return videos.filter(v => {
      if (role === "admin") return true;
      return myTeams.some(t => {
        const cat = (v.categoria || v.equipo || "").toLowerCase();
        const tn = (t.nombre || "").toLowerCase();
        const tc = (t.categoria || "").toLowerCase();
        return cat.includes(tn) || cat.includes(tc) || tn.includes(cat) || tc.includes(cat);
      });
    });
  }, [videos, myTeams, role]);

  const totalWeeklyEntrenos = currentWeekTrainings.length;
  const totalUpcomingMatches = teamFilterMatches.filter(m => m.estado === "programado").length;
  const totalLibraryPlays = libItems.filter(i => i.categoria === "jugada").length;
  const totalVideosAnalizados = filteredVideos.length;
  
  const loads = RendimientoStore.getPlayerLoadData();
  const myTeamPlayerIds = useMemo(() => {
    const allPlayers = RendimientoStore.getJugadores();
    const myPlayers = role === "admin" ? allPlayers : allPlayers.filter(p => {
      const pCat = (p.categoria || "").toLowerCase();
      return myTeams.some(t => {
        const tc = (t.categoria || t.nombre || "").toLowerCase();
        return pCat === tc || pCat.includes(tc) || tc.includes(pCat);
      });
    });
    return new Set(myPlayers.map(p => p.id));
  }, [myTeams, role]);

  const filteredLoads = useMemo(() => {
    return loads.filter(l => myTeamPlayerIds.has(l.jugadorId));
  }, [loads, myTeamPlayerIds]);

  const avgSportsScore = filteredLoads.length > 0 ? Math.round(filteredLoads.reduce((s, l) => s + (l.recoveryScore || 85), 0) / filteredLoads.length) : 85;

  const realDisponibilidad = useMemo(() => {
    let verdes = 0;
    let amarillos = 0;
    let rojos = 0;
    filteredLoads.forEach(l => {
      if (l.semaforo === "rojo" || l.semaforo === "rojo-lesion") rojos++;
      else if (l.semaforo === "amarillo" || l.semaforo === "precaucion") amarillos++;
      else verdes++; // 'verde' and 'gris' (no warnings) are available
    });
    // Fallback if no loads
    if (filteredLoads.length === 0) {
      return { verdes: 15, amarillos: 0, rojos: 0 };
    }
    return { verdes, amarillos, rojos };
  }, [filteredLoads]);

  const greenPct = Math.round((realDisponibilidad.verdes / (realDisponibilidad.verdes + realDisponibilidad.amarillos + realDisponibilidad.rojos)) * 100) || 100;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-elegant">
            <ShieldHalf className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Centro Táctico</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Smart Tactical Board — Planificación profesional e inteligencia competitiva</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/tactica/pizarra">
            <Button className="bg-gradient-primary text-white font-extrabold gap-1.5 text-xs shadow-elegant rounded-xl">
              <ShieldHalf className="h-4 w-4" /> Abrir Pizarra
            </Button>
          </Link>
          <Link to="/tactica/rivales">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-300 hover:border-slate-400 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
              <Swords className="h-4 w-4" /> Ver Rivales
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Indicators Row */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800/60 p-3 text-center shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Entrenos Semana</p>
          <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">{totalWeeklyEntrenos}</p>
        </Card>
        <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800/60 p-3 text-center shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Próximos Partidos</p>
          <p className="text-lg font-black text-violet-600 dark:text-violet-400 mt-1">{totalUpcomingMatches}</p>
        </Card>
        <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800/60 p-3 text-center shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Jugadas Biblioteca</p>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">{totalLibraryPlays}</p>
        </Card>
        <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800/60 p-3 text-center shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Videos Analizados</p>
          <p className="text-lg font-black text-teal-600 dark:text-teal-400 mt-1">{totalVideosAnalizados}</p>
        </Card>
        <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800/60 p-3 text-center shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Disponibilidad</p>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{greenPct}%</p>
        </Card>
        <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800/60 p-3 text-center shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Sports Score Prom.</p>
          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">{avgSportsScore}</p>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users}        label="Disponibles"      value={realDisponibilidad.verdes.toString()}   hint="aptos para entrenar"     accent="success" />
        <StatCard icon={AlertTriangle} label="Con precaución"   value={realDisponibilidad.amarillos.toString()}    hint="revisar carga física"    accent="warning" />
        <StatCard icon={ShieldHalf}   label="No recomendados"  value={realDisponibilidad.rojos.toString()} hint="riesgo de sobrecarga"    accent="destructive" />
        <StatCard icon={BookOpen}     label="Jugadas guardadas" value={summary.jugadasRegistradas.toString()}     hint="en biblioteca táctica"   accent="primary" />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT: Next match + Convocatoria */}
        <div className="lg:col-span-2 space-y-4">

          {/* Próximo partido */}
          <Card className="bg-white dark:bg-card shadow-card border-slate-200 dark:border-slate-800/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold">
                  <Calendar className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" /> Próximo Partido
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">Preparación táctica para el encuentro</CardDescription>
              </div>
              <Link to="/partidos">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-violet-600 dark:text-violet-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
                  Ver todos <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {nextMatch ? (
                <div className="border border-violet-200 dark:border-violet-500/20 rounded-xl p-5 bg-slate-50 dark:bg-slate-900/50 backdrop-blur-md space-y-4 shadow-elegant">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white text-base tracking-wide">{nextMatch.rival}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-red-500" /> {nextMatch.sede} · <span className="text-violet-600 dark:text-violet-300 font-extrabold">{nextMatch.equipo}</span>
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300 border-violet-200 dark:border-violet-500/30 font-black px-2.5 py-0.5 tracking-wider uppercase">
                      {nextMatch.tipo}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                      <Clock className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" /> {nextMatch.fecha}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                      <Swords className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> {nextMatch.hora || "10:00"}
                    </span>
                  </div>
                  <div className="flex gap-2.5 pt-1">
                    <Link to="/tactica/estrategias">
                      <Button size="sm" variant="outline" className="text-xs font-extrabold gap-1.5 border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-white bg-white dark:bg-slate-900/40">
                        <Target className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Ver Estrategia
                      </Button>
                    </Link>
                    <Link to="/tactica/pizarra">
                      <Button size="sm" className="text-xs font-extrabold gap-1.5 bg-gradient-primary text-white shadow-elegant rounded-xl">
                        <Play className="h-4 w-4 fill-current" /> Preparar Táctica
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">No hay partidos programados.</p>
              )}
            </CardContent>
          </Card>

          {/* Convocatoria activa */}
          {activeConvoc && (
            <Card className="bg-white dark:bg-card shadow-card border-slate-200 dark:border-slate-800/60">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold">
                  <Users className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" /> Convocatoria Activa
                </CardTitle>
                <Link to="/convocatorias">
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-violet-600 dark:text-violet-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
                    Gestionar <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-2">
                  <div>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">{activeConvoc.equipo}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{activeConvoc.fecha}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold">
                    Confirmada
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50/50 dark:bg-white/[0.01]">
                    <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Titulares</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{Math.min(11, activeConvoc.jugadores.length)}</p>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50/50 dark:bg-white/[0.01]">
                    <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Suplentes</p>
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">{Math.max(0, activeConvoc.jugadores.length - 11)}</p>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-2 bg-slate-50/50 dark:bg-white/[0.01]">
                    <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Convocados</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white">{activeConvoc.jugadores.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cuerpo Técnico / Reuniones Sección */}
          <Card className="bg-white dark:bg-card shadow-card border-slate-200 dark:border-slate-800/60">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
              <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80 w-fit">
                <button onClick={() => setActiveSubTab("cuerpo")} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${activeSubTab === "cuerpo" ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"}`}>
                  👥 Cuerpo Técnico
                </button>
                <button onClick={() => setActiveSubTab("reuniones")} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${activeSubTab === "reuniones" ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"}`}>
                  📅 Reuniones Técnicas
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              {activeSubTab === "cuerpo" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {staffMembers.slice(0, 4).map(m => {
                    const note = staffNotes.find(n => n.rol === m.rol);
                    return (
                      <div key={m.rol} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0b0e14]/40 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{m.nombre}</p>
                          <Badge variant="outline" className="text-[8px] uppercase font-bold border-slate-350 bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-750 dark:text-slate-300">{m.rol}</Badge>
                        </div>
                        {note ? (
                          <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-900 text-[10px] space-y-0.5">
                            <p className="text-slate-700 dark:text-slate-400 italic line-clamp-3">"{note.texto}"</p>
                            <p className="text-[8px] text-slate-500 dark:text-slate-500 text-right font-semibold mt-1">{note.fecha}</p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Sin observaciones recientes</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {meetings.map(meet => (
                    <div key={meet.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/40 dark:bg-gradient-to-r dark:from-white/[0.01] dark:to-transparent text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">📅 Reunión Técnica del {meet.fecha}</p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{meet.hora}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-450">Agenda:</p>
                        {meet.agenda.map((a, idx) => (
                          <p key={idx} className="text-[10px] text-slate-750 dark:text-slate-300 pl-2 border-l border-violet-500/50">• {a}</p>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-450">Tareas pendientes:</p>
                        {meet.tareas.map(t => (
                          <div key={t.id} className="flex items-center gap-1.5 text-[10px]">
                            <span className={t.completada ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                              {t.completada ? "✓" : "⏰"}
                            </span>
                            <span className={t.completada ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-white font-medium"}>
                              {t.descripcion} (vence: {t.vence})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Notes + AI + Rival */}
        <div className="space-y-4">

          {/* Notas del entrenador */}
          <Card className="bg-white dark:bg-card shadow-card border-slate-200 dark:border-slate-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold">
                <NotebookPen className="h-4 w-4 text-violet-600 dark:text-violet-400" /> Notas del Entrenador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {staffNotes.filter(n => n.rol === "entrenador").slice(0, 3).map(n => (
                <div key={n.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span>{NOTE_ICON[n.categoria]}</span>
                    <Badge variant="outline" className="text-[8px] uppercase font-bold border-slate-350 bg-white text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-white">{n.categoria}</Badge>
                    <span className="ml-auto text-slate-500 dark:text-slate-500 text-[9px] font-bold">{n.fecha}</span>
                  </div>
                  <p className="text-slate-750 dark:text-slate-300 leading-relaxed font-semibold">{n.texto}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="bg-white dark:bg-card shadow-card border-slate-200 dark:border-slate-800/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold">
                <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-400 animate-pulse" /> Análisis IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recs.map(r => (
                <div key={r.id} className="p-2.5 rounded-xl border border-violet-200 dark:border-violet-500/10 bg-violet-50 dark:bg-violet-500/5 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-extrabold text-slate-800 dark:text-white">{r.jugador}</p>
                    <Badge variant="outline" className={`text-[8px] font-bold uppercase ${
                      r.prioridad === "critica" ? "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20" :
                      r.prioridad === "alta" ? "bg-orange-100 text-orange-850 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/20" :
                      "bg-amber-100 text-amber-850 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                    }`}>{r.prioridad}</Badge>
                  </div>
                  <p className="text-slate-650 dark:text-slate-400 leading-relaxed font-semibold">{r.texto}</p>
                </div>
              ))}
              <Link to="/tactica/analisis-ia">
                <Button variant="ghost" size="sm" className="w-full text-xs text-violet-600 dark:text-violet-400 font-extrabold gap-1 mt-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                  Ver análisis completo <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Next Rival card */}
          {nextRival && (
            <Card className="bg-white dark:bg-card shadow-card border-slate-200 dark:border-slate-800/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold">
                  <Swords className="h-4 w-4 text-orange-650 dark:text-orange-400" /> Próximo Rival
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{nextRival.escudo}</span>
                  <div>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">{nextRival.nombre}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-450 font-bold">DT: {nextRival.entrenador}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-bold border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900">{nextRival.sistemaBase}</Badge>
                  <Badge variant="outline" className={`text-[9px] font-bold ${PELIGRO_COLOR[nextRival.peligrosidad]}`}>
                    {nextRival.peligrosidad.replace("-", " ")}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">Fortalezas clave:</p>
                  {nextRival.fortalezas.slice(0, 2).map((f, i) => (
                    <p key={i} className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">• {f}</p>
                  ))}
                </div>
                <Link to="/tactica/rivales">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 border-slate-300 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-white font-extrabold">
                    <Swords className="h-3.5 w-3.5" /> Ver Expediente Completo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default TacticaDashboard;
