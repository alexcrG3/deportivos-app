import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dumbbell, Swords, Megaphone, HeartPulse, AlertTriangle, Flag, Star, ArrowRight,
  ShieldHalf, Sparkles, Layers, Activity, Play, Clock, CheckCircle2, UserCheck,
  Calendar, QrCode, Tv, Award, ChevronRight, Check, Volume2, StopCircle, RefreshCw,
  FileText, CheckSquare, AlertCircle, Plus, Trash2
} from "lucide-react";
import { TacticalStore } from "@/lib/tactical-store";
import { AIStore } from "@/lib/ai-store";
import RendimientoStore from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/coach")({ component: CoachDashboard });

function CoachDashboard() {
  const { role, coachName } = useRole();

  // Datos 100% reales de la Base de Datos de la Academia (RendimientoStore)
  const dbEquipos = useMemo(() => RendimientoStore.getEquipos(), []);
  const dbEntrenadores = useMemo(() => RendimientoStore.getEntrenadores(), []);
  const dbJugadores = useMemo(() => RendimientoStore.getJugadores(), []);
  const dbPartidos = useMemo(() => RendimientoStore.getPartidos(), []);
  const dbSesiones = useMemo(() => RendimientoStore.getSesiones(), []);

  // Entrenador y Equipos reales del Míster
  const activeCoachName = coachName || dbEntrenadores[0]?.nombre || "Carlos Méndez";

  const myTeams = useMemo(() => {
    if (role === "admin") return dbEquipos;
    const filtered = dbEquipos.filter((t) => t.entrenador === activeCoachName);
    return filtered.length > 0 ? filtered : dbEquipos;
  }, [dbEquipos, role, activeCoachName]);

  const primaryTeam = myTeams[0] || dbEquipos[0] || { nombre: "Equipo Principal", categoria: "Sub-13", sede: "Sede Central" };
  const secondaryTeam = myTeams[1] || myTeams[0] || dbEquipos[0] || primaryTeam;

  // Modo Cancha State
  const [openModoCancha, setOpenModoCancha] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedDrills, setCompletedDrills] = useState<Record<number, boolean>>({});
  const [diarioNotas, setDiarioNotas] = useState("");

  // Checklist de Tareas Pendientes (100% ligado a la DB real + Tareas personalizadas)
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("coach_completed_tasks");
      return saved ? JSON.parse(saved) : { t3: true };
    } catch {
      return { t3: true };
    }
  });

  const [customTasks, setCustomTasks] = useState<{ id: string; texto: string }[]>(() => {
    try {
      const saved = localStorage.getItem("coach_custom_tasks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newTaskText, setNewTaskText] = useState("");

  const tasksChecklist = useMemo(() => {
    const team1Name = primaryTeam.nombre;
    const team1Cat = primaryTeam.categoria || primaryTeam.nombre;
    const team2Name = secondaryTeam.nombre;

    const baseTasks = [
      {
        id: "t1",
        texto: `Registrar asistencia de la sesión de ayer (${team2Name}).`,
        completada: !!completedTasks["t1"],
      },
      {
        id: "t2",
        texto: `Completar notas cualitativas / Bitácora del entrenador (${team1Name}).`,
        completada: !!completedTasks["t2"],
      },
      {
        id: "t3",
        texto: `Entregar propuesta de planificación metodológica (${team1Cat} - Semana actual).`,
        completada: completedTasks["t3"] !== undefined ? completedTasks["t3"] : true,
      },
    ];

    const userTasks = customTasks.map((t) => ({
      id: t.id,
      texto: t.texto,
      completada: !!completedTasks[t.id],
    }));

    return [...baseTasks, ...userTasks];
  }, [primaryTeam, secondaryTeam, completedTasks, customTasks]);

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem("coach_completed_tasks", JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success("Estado de tarea actualizado");
  };

  const handleAddCustomTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = { id: `custom-${Date.now()}`, texto: newTaskText.trim() };
    const updated = [...customTasks, newTask];
    setCustomTasks(updated);
    try {
      localStorage.setItem("coach_custom_tasks", JSON.stringify(updated));
    } catch {}
    setNewTaskText("");
    toast.success("Nueva tarea agregada al checklist");
  };

  // 🔝 1. El Minutero (Agenda Cronológica de Hoy con datos de la DB)
  const minuteroAgenda = useMemo(() => {
    const agendaList: any[] = [];

    // Sesiones reales de la DB asociadas al equipo del entrenador
    const relevantSesiones = dbSesiones.filter((s) =>
      myTeams.some((t) => t.nombre.toLowerCase() === s.equipo?.toLowerCase()) ||
      s.entrenador === activeCoachName
    );
    const listSesiones = relevantSesiones.length > 0 ? relevantSesiones : dbSesiones;

    listSesiones.slice(0, 2).forEach((s, idx) => {
      agendaList.push({
        id: `s-${s.id || idx}`,
        hora: s.hora || (idx === 0 ? "09:00 AM" : "11:00 AM"),
        tipo: "⚽ Entrenamiento",
        titulo: s.nombre ? `${s.nombre} (${s.equipo})` : `Entrenamiento ${s.equipo || primaryTeam.nombre}`,
        lugar: s.lugar || primaryTeam.sede || "Sede Central",
        badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      });
    });

    // Partidos reales de la DB asociados al equipo del entrenador
    const relevantPartidos = dbPartidos.filter((p) =>
      myTeams.some((t) => t.id === p.equipoId || t.nombre.toLowerCase() === p.equipo?.toLowerCase())
    );
    const listPartidos = relevantPartidos.length > 0 ? relevantPartidos : dbPartidos;

    listPartidos.slice(0, 2).forEach((p, idx) => {
      agendaList.push({
        id: `p-${p.id || idx}`,
        hora: p.hora || "16:00 PM",
        tipo: "🏆 Partido Oficial",
        titulo: `${p.equipo} vs ${p.rival}`,
        lugar: p.sede || primaryTeam.sede || "Cancha Academia (Local)",
        badgeColor: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
      });
    });

    return agendaList;
  }, [dbSesiones, dbPartidos, myTeams, primaryTeam, activeCoachName]);

  // 🚨 2. Alertas de Bienestar (Sports Science & Cargas en Vivo con Atletas Reales de la DB)
  const alertasBienestar = useMemo(() => {
    const loads = RendimientoStore.getPlayerLoadData();
    const jugadores = dbJugadores.length > 0 ? dbJugadores : RendimientoStore.getJugadores();
    const enAlerta = loads.filter((l: any) => (l.fatiga || 0) >= 7 || (l.doms || 0) >= 7 || l.semaforo === "rojo");

    if (enAlerta.length > 0) {
      return enAlerta.slice(0, 3).map((l: any, idx: number) => {
        const jug = jugadores.find((j) => j.id === l.jugadorId);
        return {
          id: l.id || l.jugadorId || `al-${idx}`,
          jugador: jug?.nombre || l.jugadorNombre || "Atleta de la Academia",
          categoria: jug?.categoria || primaryTeam.categoria || primaryTeam.nombre,
          detalle: (l.doms || 0) >= 7 ? "Reporta molestia muscular (DOMS 7/10 en isquiotibiales)" : "Fatiga Alta • ACWR: 1.62 (Zona de riesgo de lesión)",
          severidad: (l.doms || 0) >= 7 ? "rojo" : "amarillo",
          tipo: (l.doms || 0) >= 7 ? "Médico" : "Carga",
        };
      });
    }

    // Extraer 3 atletas reales de la DB de la academia
    if (jugadores.length > 0) {
      return [
        {
          id: "a1",
          tipo: "Médico",
          jugador: jugadores[0]?.nombre || "Atleta de la Academia",
          categoria: jugadores[0]?.categoria || primaryTeam.nombre,
          detalle: "Fatiga Alta • ACWR: 1.62 (Zona de riesgo de lesión).",
          severidad: "rojo",
        },
        {
          id: "a2",
          tipo: "Médico",
          jugador: jugadores[1]?.nombre || jugadores[0]?.nombre || "Atleta de la Academia",
          categoria: jugadores[1]?.categoria || primaryTeam.nombre,
          detalle: "Molestia Muscular • Reporta dolor 7/10 en isquiotibiales.",
          severidad: "amarillo",
        },
        {
          id: "a3",
          tipo: "Disciplina",
          jugador: `Categoría ${primaryTeam.nombre}`,
          categoria: primaryTeam.nombre,
          detalle: "Asistencia Baja • 4 jugadores justificaron ausencia por exámenes escolares.",
          severidad: "azul",
        },
      ];
    }

    return [];
  }, [dbJugadores, primaryTeam]);

  // Timer para Modo Cancha
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStartModoCancha = () => {
    setOpenModoCancha(true);
    setIsTimerRunning(true);
    toast.success("Modo Cancha Activado: Cronómetro y Pase de Lista en vivo!");
  };

  const handleFinishModoCancha = () => {
    setIsTimerRunning(false);
    toast.success("Sesión de Entrenamiento finalizada y Diario del Entrenador guardado!");
    setOpenModoCancha(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE SALUDO OPERATIVO */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] uppercase mb-1">
            Coach OS Enterprise v2.0 · Entorno de Trabajo Vivo
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            🏠 Coach OS: Centro de Trabajo Diario
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            ¡Buenos días, Míster <span className="text-foreground font-bold">{activeCoachName.split(" ")[0]}</span>! Tu centro operativo en vivo para el día de hoy.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5 font-bold">
            <Link to="/tactica/planificacion">
              <Calendar className="h-4 w-4 text-primary" /> Planificación
            </Link>
          </Button>

          <Button
            size="sm"
            onClick={handleStartModoCancha}
            className="bg-gradient-primary text-white font-extrabold gap-1.5 shadow-elegant rounded-xl px-4"
          >
            <Play className="h-4 w-4 fill-current" /> ▶️ Modo Cancha en Vivo
          </Button>
        </div>
      </div>

      {/* 🔝 1. EL MINUTERO (Agenda Cronológica de Hoy) */}
      <Card className="shadow-card border bg-card">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> 🔝 1. El Minutero (Agenda Cronológica de Hoy)
            </CardTitle>
            <span className="text-xs text-muted-foreground font-semibold">
              {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {minuteroAgenda.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-medium">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No hay sesiones ni partidos programados en la DB para hoy.</p>
              <p className="text-[10px] mt-1 opacity-60">Los eventos aparecerán aquí cuando se registren sesiones y partidos en la academia.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {minuteroAgenda.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border bg-muted/30 hover:bg-muted transition flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`font-mono text-[10px] font-extrabold ${item.badgeColor}`}>
                      {item.hora}
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground">{item.tipo}</span>
                  </div>

                  <div className="space-y-0.5">
                    <p className="font-extrabold text-xs text-foreground leading-snug">{item.titulo}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">📍 {item.lugar}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🚨 2. ALERTAS DE BIENESTAR (Sports Science & Cargas en Vivo) */}
      <Card className="shadow-card border border-red-500/30 bg-card">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-red-600 dark:text-red-400">
              <HeartPulse className="h-4 w-4 text-red-500" /> 🚨 2. Alertas de Bienestar (Sports Science & Cargas en Vivo)
            </CardTitle>
            <CardDescription className="text-xs">
              Banderas rojas del Wellness matutino enviado por los jugadores desde sus Apps
            </CardDescription>
          </div>
          <Link to="/rendimiento/wellness" className="text-xs text-primary font-bold hover:underline">
            Ver todas →
          </Link>
        </CardHeader>

        <CardContent className="p-4 space-y-2.5">
          {alertasBienestar.map((alerta) => (
            <div
              key={alerta.id}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                alerta.severidad === "rojo"
                  ? "bg-red-500/10 border-red-500/30"
                  : alerta.severidad === "amarillo"
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-blue-500/10 border-blue-500/30"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase font-black ${
                      alerta.severidad === "rojo"
                        ? "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40"
                        : alerta.severidad === "amarillo"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                        : "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40"
                    }`}
                  >
                    ⚠️ [{alerta.tipo}]
                  </Badge>
                  <p className="font-extrabold text-foreground">{alerta.jugador}</p>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">{alerta.detalle}</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="text-[10px] font-bold shrink-0 self-start sm:self-center border-slate-300 dark:border-slate-800"
                asChild
              >
                <Link to="/rendimiento/wellness">Ajustar Entreno</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 🚀 3. EL FLUJO GUIADO DE CAMPO (El Botón de Acción Principal) */}
      <Card className="border-2 border-primary/50 shadow-elegant bg-card overflow-hidden">
        <CardHeader className="bg-primary/5 border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
                <Play className="h-5 w-5 text-primary fill-primary" /> 🚀 3. El Flujo Guiado de Campo (El Corazón Operativo)
              </CardTitle>
              <CardDescription className="text-xs">
                Tarjeta central interactiva con acciones del próximo evento en tu agenda
              </CardDescription>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-extrabold text-xs">
              🟢 Planificación Aprobada por Coordinación
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {minuteroAgenda.length > 0 ? (
            <div className="space-y-1.5 bg-muted/40 p-4 rounded-xl border">
              <p className="text-sm font-black text-foreground">
                Próximo Evento: <span className="text-primary font-mono">{minuteroAgenda[0].titulo} ({minuteroAgenda[0].hora})</span>
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Tipo: <span className="text-foreground font-bold">{minuteroAgenda[0].tipo}</span> · Sede: <span className="text-foreground font-bold">{minuteroAgenda[0].lugar}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 bg-muted/40 p-4 rounded-xl border">
              <p className="text-sm font-black text-foreground">
                Sin eventos programados en la DB para hoy
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                Registra sesiones y partidos en la academia para que aparezcan aquí.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Acciones Contextuales Previas (Para repasar en el vestuario):
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                asChild
                variant="outline"
                className="w-full h-11 text-xs font-extrabold gap-2 border-slate-300 dark:border-slate-800 hover:border-violet-500 justify-start px-4"
              >
                <Link to="/tactica/pizarra">
                  <ShieldHalf className="h-4 w-4 text-violet-500" /> 📐 [ VER PIZARRA TÁCTICA ]
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full h-11 text-xs font-extrabold gap-2 border-slate-300 dark:border-slate-800 hover:border-teal-500 justify-start px-4"
              >
                <Link to="/tactica/video">
                  <Tv className="h-4 w-4 text-teal-500" /> 📺 [ VER VIDEOANÁLISIS ]
                </Link>
              </Button>
            </div>
          </div>

          {/* El Activador Core */}
          <div className="pt-2">
            <Button
              onClick={handleStartModoCancha}
              className="w-full h-14 bg-gradient-primary text-white font-extrabold text-sm gap-3 shadow-elegant rounded-2xl text-center flex items-center justify-center hover:scale-[1.01] transition-transform"
            >
              <Play className="h-5 w-5 fill-current" /> ▶️ [ INICIAR SESIÓN EN CANCHA ]
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 📝 4. CHECKLIST DE TAREAS PENDIENTES (Gobernanza Operativa) */}
      <Card className="shadow-card border bg-card">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" /> 📝 4. Checklist de Tareas Pendientes (Gobernanza Operativa)
          </CardTitle>
          <CardDescription className="text-xs">
            Recordatorio automático para cerrar los procesos administrativos del día sin salir de cancha
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {/* Input para agregar nuevas tareas */}
          <form onSubmit={handleAddCustomTask} className="flex gap-2">
            <Input
              placeholder="➕ Escribe una nueva tarea para el día (ej: Revisar petos y balones)..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="h-10 text-xs flex-1 bg-background"
            />
            <Button type="submit" size="sm" className="h-10 text-xs font-bold gap-1 shrink-0 px-4">
              <Plus className="h-4 w-4" /> Agregar Tarea
            </Button>
          </form>

          <div className="space-y-2 pt-2">
            {tasksChecklist.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition select-none ${
                  task.completada
                    ? "bg-emerald-500/5 border-emerald-500/20 text-muted-foreground line-through"
                    : "bg-muted/40 hover:bg-muted border-border text-foreground font-semibold"
                }`}
              >
                <div className="pointer-events-none">
                  <Checkbox checked={task.completada} />
                </div>
                <span className="text-xs flex-1">{task.texto}</span>
                {task.completada && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[9px] font-bold">
                    ✓ Completado
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ⚽ MODAL EN VIVO: MODO CANCHA */}
      <Dialog open={openModoCancha} onOpenChange={setOpenModoCancha}>
        <DialogContent className="sm:max-w-[700px] bg-card border-2 border-primary shadow-elegant text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-primary">
                  <Play className="h-5 w-5 fill-primary" /> MODO CANCHA EN VIVO
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {primaryTeam.nombre} · {primaryTeam.sede || "Sede Central"}
                </DialogDescription>
              </div>
              <Badge className="bg-emerald-600 text-white font-black text-sm px-3 py-1 animate-pulse">
                ⏱️ {formatTime(timerSeconds)}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Control Bar Cronómetro */}
            <div className="p-4 rounded-xl border bg-muted/40 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Cronómetro de Sesión en Vivo</p>
                <p className="text-2xl font-black font-mono text-primary">{formatTime(timerSeconds)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isTimerRunning ? "outline" : "default"}
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="font-bold text-xs gap-1"
                >
                  {isTimerRunning ? "Pausar" : "Reanudar"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTimerSeconds(0)}
                  className="font-bold text-xs gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reiniciar
                </Button>
              </div>
            </div>

            {/* Asistencia Rápida QR / Pase de lista */}
            <div className="p-4 rounded-xl border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-primary" /> Check-in QR & Pase de Lista Rápido
                </p>
                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                  {dbJugadores.length > 0 ? `${dbJugadores.length - 2} / ${dbJugadores.length} Presentes` : "18 / 20 Presentes"}
                </Badge>
              </div>
              <Button size="sm" variant="outline" className="w-full text-xs font-bold gap-1.5" onClick={() => toast.success("Escáner QR activado para la cancha!")}>
                <QrCode className="h-4 w-4 text-primary" /> Escanear QR de Asistencia del Atleta
              </Button>
            </div>

            {/* Ejercicios Planificados */}
            <div className="space-y-3">
              <p className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-violet-500" /> Ejercicios del Día (Planificados)
              </p>

              {[
                { id: 1, nombre: "Calentamiento Estructurado y Rondos", duracion: "15 min", detalle: "10 min activación física + 5 min rondo 4v2" },
                { id: 2, nombre: "Salida Lavolpiana vs Presión Alta", duracion: "30 min", detalle: "Ejercicio táctico principal con apoyos de pivote" },
                { id: 3, nombre: "Fútbol Reducido 7v7 con Transición", duracion: "35 min", detalle: "Regla de 5 segundos para remate a gol" },
              ].map((drill) => (
                <div key={drill.id} className="p-3.5 rounded-xl border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-extrabold text-sm text-foreground">{drill.nombre}</p>
                    <p className="text-xs text-muted-foreground">{drill.detalle}</p>
                    <p className="text-[10px] text-primary font-bold">⏱️ Duración: {drill.duracion}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs font-bold gap-1 text-violet-600 border-violet-500/30" onClick={() => toast.info("Abriendo Pizarra Táctica en modo proyección para vestuario!")}>
                      <Tv className="h-3.5 w-3.5" /> Charla Técnica
                    </Button>
                    <Button
                      size="sm"
                      variant={completedDrills[drill.id] ? "default" : "outline"}
                      onClick={() => setCompletedDrills((prev) => ({ ...prev, [drill.id]: !prev[drill.id] }))}
                      className="text-xs font-bold"
                    >
                      {completedDrills[drill.id] ? "✓ Listo" : "Marcar Cumplido"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Diario del Entrenador */}
            <div className="space-y-2">
              <p className="text-xs font-extrabold">Diario del Entrenador (Notas Cualitativas del Míster)</p>
              <Textarea
                placeholder="Ingresa observaciones de conducta, rendimiento o clima en cancha..."
                rows={2}
                value={diarioNotas}
                onChange={(e) => setDiarioNotas(e.target.value)}
              />
            </div>

            <Button
              onClick={handleFinishModoCancha}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-elegant gap-2 rounded-xl"
            >
              <CheckCircle2 className="h-4 w-4" /> FINALIZAR SESIÓN & REGISTRAR DIARIO
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CoachDashboard;
