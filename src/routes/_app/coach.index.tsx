import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Calendar, ChevronRight, MapPin,
  CheckSquare, Square, Plus, Play, Eye,
  Clock, Users, ClipboardList, FileText, HeartPulse, Star, X,
  ShieldHalf, Film, Zap, Dumbbell
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";

/** Always returns a lowercase string — never throws on non-string values */
const safeLower = (v: unknown): string => String(v ?? "").trim().toLowerCase();

/** Normalize category to U9 / U11 / U13 etc. for comparison */
const normCat = (v: unknown): string => {
  const s = safeLower(v);
  const m = s.match(/(?:sub[-_\s]?|u)(\d+)/);
  return m ? `u${m[1]}` : s;
};

export const Route = createFileRoute("/_app/coach/")({
  component: CoachOSDashboard,
});

interface Task {
  id: string;
  text: string;
  done: boolean;
}

function CoachOSDashboard() {
  const { coachName, selectedCoachName, selectedCoachId } = useRole();
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [allSesiones, setAllSesiones] = useState<any[]>([]);
  const [wellnessAlerts, setWellnessAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Which team card is currently selected (drives Agenda & Flujo below)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "t1", text: "Registrar asistencia de la sesión de ayer.", done: false },
    { id: "t2", text: "Completar notas cualitativas / Bitácora del entrenador.", done: false },
    { id: "t3", text: "Entregar componente de planificación metodológica (Sub-9 - Semana actual).", done: true },
  ]);
  const [newTask, setNewTask] = useState("");

  const activeCoachName = selectedCoachName || coachName || "";
  const firstName = activeCoachName.split(" ")[0] || "Entrenador";

  const [showRetroModal, setShowRetroModal] = useState(false);
  const navigate = useNavigate();

  // Date picker — defaults to today, user can navigate to past/future
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const selectedDateObj = new Date(`${selectedDate}T12:00:00`);
  const selectedDateLabel = selectedDateObj.toLocaleDateString("es-CR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ── Load teams & players from store (instant, no extra Supabase calls) ──────
  useEffect(() => {
    const loadStatic = () => {
      setLoading(true);
      // Leer directamente de la memoria del store (ya sincronizado al arrancar)
      const dbTeams = RendimientoStore.getEquipos() || [];
      const dbPlayers = (RendimientoStore.getJugadores() || []).slice(0, 500).map((j: any) => ({
        id: j.id, nombre: j.nombre, categoria: j.categoria, avatar: j.avatar, estado: j.estado,
      }));
      setAllTeams(dbTeams);
      setAllPlayers(dbPlayers);
      setLoading(false);
    };

    // Si el store ya está sincronizado, usar datos de memoria directamente
    if (RendimientoStore.isStoreSynced()) {
      loadStatic();
    } else {
      // Si aún no sincronizó, esperar el evento
      const handleSync = () => loadStatic();
      window.addEventListener("rendimientoStoreUpdated", handleSync);
      // Timeout de seguridad: si tarda más de 3s, mostrar lo que hay
      const timeout = setTimeout(() => loadStatic(), 3000);
      return () => {
        window.removeEventListener("rendimientoStoreUpdated", handleSync);
        clearTimeout(timeout);
      };
    }
  }, [selectedCoachId, coachName, selectedCoachName]);

  // ── Re-fetch matches, sesiones & wellness cuando cambia la fecha ──────────
  useEffect(() => {
    const loadForDate = async () => {
      const orgId = RendimientoStore.getActiveOrganizacionId();

      // Partidos y sesiones del store si están disponibles, sino consultar Supabase
      const storePartidos = (RendimientoStore.getPartidos() || []).filter((p: any) => p.fecha === selectedDate);
      const storeSesiones = (RendimientoStore.getSesiones() || []).filter((s: any) => s.fecha === selectedDate);

      if (storePartidos.length > 0 || storeSesiones.length > 0) {
        setAllMatches(storePartidos);
        setAllSesiones(storeSesiones);
      } else {
        // Fallback: consultar Supabase solo si el store no tiene datos de esa fecha
        const [{ data: dbMatches }, { data: dbSesiones }] = await Promise.all([
          supabase.from("partidos").select("*").eq("fecha", selectedDate).order("hora", { ascending: true }).limit(20),
          supabase.from("sesiones").select("*").eq("fecha", selectedDate).order("hora", { ascending: true }).limit(20),
        ]);
        setAllMatches(dbMatches || []);
        setAllSesiones(dbSesiones || []);
      }

      // Wellness siempre desde Supabase (datos muy específicos del día)
      const { data: dbWellness } = await supabase
        .from("wellness")
        .select("*")
        .eq("fecha", selectedDate)
        .limit(100);

      if (dbWellness && dbWellness.length > 0) {
        const atRisk = dbWellness
          .filter(w => (w.acwr || 0) > 1.3 || (w.fatiga || 0) >= 7 || (w.energia || 5) <= 3 || (w.animo || 5) <= 3)
          .slice(0, 4)
          .map(w => {
            const p = allPlayers.find((pl: any) => pl.id === (w.jugador_id || w.jugadorId));
            return {
              ...w,
              playerName: p?.nombre || w.jugador || "Jugador",
              playerCat: p?.categoria || "—",
              acwr: w.acwr ? Number(w.acwr).toFixed(2) : null,
            };
          });
        setWellnessAlerts(atRisk);
      } else {
        setWellnessAlerts([]);
      }
    };
    loadForDate();
  }, [selectedDate, allPlayers]);

  // ── My Teams: exact or partial coach name match ───────────────────────
  const myTeams = useMemo(() => {
    if (!activeCoachName) return allTeams.slice(0, 3);
    const fullLc = safeLower(activeCoachName);
    const firstLc = fullLc.split(" ")[0];
    const exact = allTeams.filter(t => safeLower(t.entrenador) === fullLc);
    if (exact.length > 0) return exact;
    const partial = allTeams.filter(t => safeLower(t.entrenador).includes(firstLc));
    return partial.length > 0 ? partial : allTeams.slice(0, 3);
  }, [allTeams, activeCoachName]);

  // Auto-select first team when teams load
  useEffect(() => {
    if (myTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(myTeams[0].id);
    }
  }, [myTeams]);

  // Currently selected team object
  const activeTeam = useMemo(
    () => myTeams.find(t => t.id === selectedTeamId) || myTeams[0] || null,
    [myTeams, selectedTeamId]
  );

  // Players for a given team (matched by normalized category)
  const playersForTeam = (team: any) => {
    const tCat = normCat(team.categoria || team.nombre);
    return allPlayers.filter(p => normCat(p.categoria) === tCat);
  };

  // Match for selected date — STRICTLY filtered to selected team; try/catch to prevent any crash
  const todayMatch = useMemo(() => {
    if (!activeTeam) return null;
    try {
      const tCat = normCat(activeTeam.categoria);
      const tNombre = safeLower(activeTeam.nombre);
      return allMatches.find(m => {
        // Primary: categoria field exists and matches
        if (m.categoria != null && String(m.categoria).trim() !== "") {
          return normCat(m.categoria) === tCat;
        }
        // Fallback: check local/equipo text fields
        const localStr = [m.local, m.equipo, m.equipo_local, m.equipo_id]
          .map(v => String(v ?? "")).join(" ");
        return safeLower(localStr).includes(tNombre) || safeLower(localStr).includes(tCat);
      }) ?? null;
    } catch {
      return null;
    }
  }, [allMatches, activeTeam]);

  // Session for selected date
  const todaySession = useMemo(() => {
    if (!activeTeam) return null;
    try {
      const tCat = normCat(activeTeam.categoria);
      const tNombre = safeLower(activeTeam.nombre);
      return allSesiones.find(s => {
        if (s.categoria != null && String(s.categoria).trim() !== "") {
          return normCat(s.categoria) === tCat;
        }
        const str = [s.equipo, s.equipo_id].map(v => String(v ?? "")).join(" ");
        return safeLower(str).includes(tNombre) || safeLower(str).includes(tCat);
      }) ?? null;
    } catch {
      return null;
    }
  }, [allSesiones, activeTeam]);

  const handleStartSession = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!todaySession) {
      setShowRetroModal(true);
    } else {
      navigate({
        to: "/entrenamientos",
        search: {
          teamName: activeTeam?.nombre,
          category: activeTeam?.categoria,
          fecha: selectedDate,
          autostart: "true",
        } as any,
      });
    }
  };

  // ── Task helpers ────────────────────────────────────────────────────────────
  const toggleTask = (id: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks(prev => [...prev, { id: `t${Date.now()}`, text: newTask.trim(), done: false }]);
    setNewTask("");
  };
  const removeTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-border/50">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary/60 mb-0.5">
            COACH OS ENTERPRISE V4.8 · ENTORNO DE TRABAJO VIVO
          </p>
          <h1 className="text-2xl font-bold">🏆 Coach OS: Centro de Trabajo Diario</h1>
          <p className="text-sm text-muted-foreground">
            (Buenos días, Mister{" "}
            <span className="font-semibold text-foreground">{firstName}</span>
            !) Tu centro operativo en vivo para el día de hoy.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Date picker — functional, drives agenda & wellness below */}
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground border rounded-lg px-3 py-1.5 cursor-pointer hover:border-primary/50 transition-colors">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              max={todayISO}
              onChange={e => e.target.value && setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground cursor-pointer"
            />
          </label>
          <Link to={"/planeamiento" as any}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ClipboardList className="w-3.5 h-3.5" />
              Planificación
            </Button>
          </Link>
          <Link to={"/entrenamientos" as any}>
            <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground">
              <Play className="w-3.5 h-3.5" />
              Modo Cancha en Vivo
            </Button>
          </Link>
        </div>
      </div>

      <Dialog open={showRetroModal} onOpenChange={setShowRetroModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sin Sesión Programada</DialogTitle>
            <DialogDescription>
              No hay una sesión de entrenamiento ni partido planificado para el <strong className="text-foreground">{selectedDate}</strong>.
              <br /><br />
              ¿Deseas iniciar una sesión espontánea o realizar un registro retroactivo de asistencia?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowRetroModal(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => {
                setShowRetroModal(false);
                navigate({ 
                  to: "/entrenamientos", 
                  search: { 
                    teamName: activeTeam?.nombre, 
                    category: activeTeam?.categoria, 
                    fecha: selectedDate, 
                    autostart: "true" 
                  } as any 
                });
              }}
            >
              Iniciar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row flex-1">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-6 p-6 border-r border-border/50 min-w-0">

          {/* Mis Equipos */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-sm">Mis Equipos & Categorías a Cargo</h2>
              </div>
              <Link to={"/equipos" as any}>
                <button className="text-xs text-primary hover:underline flex items-center gap-1">
                  Ver Estructura Completa <ChevronRight className="w-3 h-3" />
                </button>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-xl border bg-card animate-pulse" />)}
              </div>
            ) : myTeams.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No hay equipos asignados a este entrenador en la base de datos.
              </div>
            ) : (
              <div className={`grid gap-4 ${myTeams.length === 1 ? "grid-cols-1" : myTeams.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
                {myTeams.map(team => {
                  const teamPlayers = playersForTeam(team);
                  const shown = teamPlayers.slice(0, 5);
                  const rest = Math.max(0, teamPlayers.length - 5);
                  const isSelected = team.id === selectedTeamId;
                  return (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`rounded-xl border bg-card p-4 flex flex-col gap-3 text-left transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 shadow-md shadow-primary/10"
                          : "hover:border-primary/40 hover:shadow-sm"
                      }`}
                    >
                      {/* Clickable Header / Info — navigates directly to team details */}
                      <Link
                        to="/equipos"
                        search={{ teamId: team.id } as any}
                        className="flex flex-col gap-3 flex-1 group cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-2 py-0.5 ${isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-primary/10 text-primary border-primary/30"}`}
                            >
                              {team.categoria}
                            </Badge>
                            <span className="font-bold text-sm group-hover:text-primary transition-colors">{team.nombre}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shrink-0">
                            activo
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{team.sede || "Sede Central"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Entrenador:{" "}
                          <span className="font-semibold text-foreground">{team.entrenador || "Sin asignar"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {shown.map((p, i) => (
                              <Avatar key={p.id || i} className="h-7 w-7 border-2 border-card">
                                <AvatarImage src={p.avatar} />
                                <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                                  {(p.nombre || "?")[0]}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {rest > 0 ? `+${rest} · ` : ""}{teamPlayers.length} atletas
                          </span>
                        </div>
                      </Link>

                      {/* Separate Action Buttons Row at the Bottom */}
                      <div className="flex gap-2 border-t pt-2.5 mt-auto" onClick={e => e.stopPropagation()}>
                        <Link to={"/equipos" as any} search={{ teamId: team.id } as any} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-[11px] font-semibold gap-1 h-7 px-1.5">
                            <Eye className="w-3 h-3 text-primary" />
                            Ver Equipo
                          </Button>
                        </Link>
                        <Link to={"/plantillas" as any} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-[11px] font-semibold gap-1 h-7 px-1.5">
                            <FileText className="w-3 h-3 text-slate-500" />
                            Plantilla
                          </Button>
                        </Link>
                        <Link to={"/entrenamientos" as any} className="flex-1">
                          <Button size="sm" className="w-full text-[11px] font-semibold gap-1 h-7 px-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                            <ClipboardList className="w-3 h-3" />
                            Asistencia
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Mi Agenda de Cancha — reacts to selected team */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-sm">
                  Mi Agenda de Cancha (Hoy)
                  {activeTeam && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      · {activeTeam.categoria}
                    </span>
                  )}
                </h2>
              </div>
              <span className="text-xs text-muted-foreground capitalize">{selectedDateLabel}</span>
            </div>

            {todayMatch ? (
              <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/15 rounded-lg p-2 shrink-0">
                    <ShieldHalf className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                        PARTIDO OFICIAL
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {todayMatch.sede || todayMatch.estadio || "Cancha Academia Asoderive"}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">
                      {todayMatch.local || activeTeam?.nombre || "Equipo"} vs{" "}
                      {todayMatch.visitante || todayMatch.rival || "Rival FC"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {todayMatch.hora || "10:00 AM"}
                    </p>
                  </div>
                </div>
                <Link to={"/tactica/pizarra" as any}>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 shrink-0">
                    <Eye className="w-3 h-3" />
                    Ver Táctica
                  </Button>
                </Link>
              </div>
            ) : todaySession ? (
              <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/15 rounded-lg p-2 shrink-0">
                    <Dumbbell className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                        SESIÓN DE ENTRENAMIENTO
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {todaySession.sede || todaySession.instalacion || "Cancha Principal"}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">
                      {todaySession.nombre || `Entrenamiento ${activeTeam?.categoria}`}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {todaySession.hora || "15:00"} ({todaySession.duracion || 90} min)
                    </p>
                  </div>
                </div>
                <Link to={"/entrenamientos" as any} search={{ teamName: activeTeam?.nombre, category: activeTeam?.categoria, fecha: selectedDate, autostart: "true" } as any}>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 shrink-0">
                    <Play className="w-3 h-3" />
                    Pasar Lista
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-lg p-2 shrink-0">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Día libre o sin agendar para{" "}
                      <span className="font-bold">{activeTeam?.categoria || "hoy"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Puedes iniciar una sesión espontánea</p>
                  </div>
                </div>
                <Button size="sm" className="text-xs gap-1.5 shrink-0" onClick={handleStartSession}>
                  <Plus className="w-3 h-3" />
                  Nueva Sesión
                </Button>
              </div>
            )}
          </section>

          {/* Flujo Guiado — reacts to selected team */}
          <section className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-sm">
                  Flujo Guiado de Campo
                  {activeTeam && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      ({activeTeam.categoria})
                    </span>
                  )}
                </h2>
              </div>
              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                ✓ Plan Listo para Impartir
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Acceso directo con convivencia, asistencia y planificación táctica
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Link to={"/tactica/pizarra" as any}>
                <Button variant="outline" className="w-full text-xs gap-2 h-9 border-primary/30 hover:bg-primary/10">
                  <ShieldHalf className="w-3.5 h-3.5" />
                  VER PIZARRA TÁCTICA
                </Button>
              </Link>
              <Link to={"/tactica/video" as any}>
                <Button variant="outline" className="w-full text-xs gap-2 h-9 border-primary/30 hover:bg-primary/10">
                  <Film className="w-3.5 h-3.5" />
                  VER VIDEOANÁLISIS
                </Button>
              </Link>
            </div>
            <Button className="w-full h-11 text-sm font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25" onClick={handleStartSession}>
              <Play className="w-4 h-4" />
              INICIAR ENTRENAMIENTO EN CANCHA
            </Button>
          </section>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 p-6 lg:w-80 xl:w-96 shrink-0">

          {/* Alertas Médicas & Wellness */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-amber-500" />
                <h2 className="font-bold text-sm">⚕ Alertas Médicas & Wellness</h2>
              </div>
              <Link to={"/rendimiento/wellness" as any}>
                <button className="text-xs text-primary hover:underline">Ver Todas →</button>
              </Link>
            </div>

            {wellnessAlerts.length === 0 ? (
              <div className="rounded-xl border bg-card p-4 text-center">
                <Star className="w-5 h-5 mx-auto mb-1.5 text-emerald-400" />
                <p className="text-xs text-muted-foreground">Todos los jugadores en óptimas condiciones hoy</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {wellnessAlerts.map((alert, i) => (
                  <div key={i} className="rounded-xl border bg-card p-3 flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0 border border-amber-500/30">
                      <AvatarFallback className="text-xs font-bold bg-amber-500/10 text-amber-600">
                        {(alert.playerName || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{alert.playerName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge variant="outline" className="text-[9px] bg-amber-500/15 text-amber-600 border-amber-500/30 px-1.5 py-0">
                          Carga
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {alert.acwr
                            ? `Fatiga ≥ ACWL ${alert.acwr} (Zona de riesgo de lesión)`
                            : `Fatiga ${alert.fatiga}/10 · Alerta de carga`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tareas del Día */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-sm">⊙ Tareas del Día</h2>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <Input
                className="h-8 text-xs"
                placeholder="Nueva tarea..."
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTask()}
              />
              <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={addTask}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`rounded-xl border p-3 flex items-start gap-2.5 transition-all ${
                    task.done
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-card hover:border-border"
                  }`}
                >
                  {/* Checkbox — no floating badge, just green row */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="mt-0.5 shrink-0"
                    aria-label={task.done ? "Desmarcar tarea" : "Marcar como hecho"}
                  >
                    {task.done
                      ? <CheckSquare className="w-4 h-4 text-emerald-500" />
                      : <Square className="w-4 h-4 text-muted-foreground" />
                    }
                  </button>
                  <span className={`text-xs leading-relaxed flex-1 ${task.done ? "line-through text-muted-foreground" : ""}`}>
                    {task.text}
                  </span>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="shrink-0 text-muted-foreground/30 hover:text-destructive transition-colors mt-0.5"
                    aria-label="Eliminar tarea"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
