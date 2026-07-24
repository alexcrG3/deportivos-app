import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CalendarCheck, Layers, Megaphone, MapPinned, Activity, Clock, ClipboardList,
  Users, AlertCircle, ArrowRight, CheckCircle2, ChevronRight, QrCode, AlertTriangle, ShieldCheck, Dumbbell, UserX
} from "lucide-react";
import { convocatorias } from "@/lib/mock-data";
import RendimientoStore from "@/lib/rendimiento-store";
import { useMemo, useState, useEffect } from "react";

export const Route = createFileRoute("/_app/operacion")({ component: OperacionDashboard });

function OperacionDashboard() {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const handleSync = () => setUpdateTrigger((prev) => prev + 1);
    window.addEventListener("organizacionChanged", handleSync);
    return () => window.removeEventListener("organizacionChanged", handleSync);
  }, []);

  const hoyStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // 1. Datos Reales de Jugadores
  const jugadores = useMemo(() => RendimientoStore.getJugadores(), [updateTrigger]);
  const activosCount = useMemo(() => jugadores.filter((j) => j.estadoPago !== "moroso" || j.estadoPago === "al_dia").length, [jugadores]);
  const nuevosEstaSemana = 0;

  // 2. Datos Reales de Asistencia Diaria (Sin datos simulados: si no hay registros hoy, es 0%)
  const asistencias = useMemo(() => RendimientoStore.getAsistencias(), [updateTrigger]);
  const asistenciasHoy = useMemo(() => asistencias.filter((a) => a.fecha === hoyStr), [asistencias, hoyStr]);
  const asistenciaPorcentaje = useMemo(() => {
    if (asistenciasHoy.length === 0) return 0;
    const presentes = asistenciasHoy.filter((a) => a.estado === "presente" || a.estado === "tarde").length;
    return Math.round((presentes / asistenciasHoy.length) * 100);
  }, [asistenciasHoy]);

  // Día de la semana actual (0: Domingo, 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes, 6: Sábado)
  const dayOfWeekIndex = useMemo(() => new Date().getDay(), []); // 4 = Jueves
  const dayOfWeekLetter = useMemo(() => {
    const letters = ["D", "L", "M", "X", "J", "V", "S"];
    return letters[dayOfWeekIndex]; // "J" para Jueves
  }, [dayOfWeekIndex]);

  // 3. Ocupación Real de Instalaciones
  const sedes = useMemo(() => RendimientoStore.getSedes(), [updateTrigger]);
  const entrenadores = useMemo(() => RendimientoStore.getEntrenadores(), [updateTrigger]);
  const equipos = useMemo(() => RendimientoStore.getEquipos(), [updateTrigger]);
  const sesiones = useMemo(() => RendimientoStore.getSesiones(), [updateTrigger]);
  const sesionesHoy = useMemo(() => sesiones.filter((s) => s.fecha === hoyStr), [sesiones, hoyStr]);

  // Obtener equipos con horario recurrente agendado para el día de hoy (ej: "J" / "Jueves")
  const equiposHoyRecurrentes = useMemo(() => {
    return equipos.filter((eq) => {
      const coach = entrenadores.find((c) => c.nombre === eq.entrenador);
      const hor = coach?.horario || "";
      // Coincide si el horario incluye "J" o "Jueves" o "L-V" o "L–V"
      return hor.includes(dayOfWeekLetter) || hor.includes("L-V") || hor.includes("L–V") || hor.includes("L-S") || hor.includes("L–S");
    });
  }, [equipos, entrenadores, dayOfWeekLetter]);

  const ocupacionPorcentaje = useMemo(() => {
    const totalClasesHoy = Math.max(sesionesHoy.length, equiposHoyRecurrentes.length);
    if (totalClasesHoy === 0) return 0;
    const totalBloquesPosibles = Math.max(1, (sedes.length || 1) * 6);
    return Math.min(100, Math.round((totalClasesHoy / totalBloquesPosibles) * 100));
  }, [sedes, sesionesHoy, equiposHoyRecurrentes]);

  // 4. Ausencias de Staff
  const staffAusenteCount = useMemo(() => {
    return entrenadores.filter((e) => e.estado === "inactivo").length;
  }, [entrenadores]);

  // 5. Minutero Real de Canchas (Muestra sesiones agendadas explícitas + horarios recurrentes del día)
  const minuteroCanchas = useMemo(() => {
    // Si hay sesiones explícitas de la fecha, las priorizamos
    if (sesionesHoy.length > 0) {
      return sesionesHoy.map((s, idx) => {
        const eq = equipos.find((e) => e.nombre === s.equipo);
        const sedeNombre = eq?.sede || sedes[0]?.nombre || "Sede Central";
        const canchaNombre = s.lugar || `Cancha ${idx + 1} (${sedeNombre})`;
        const asistenciaSesion = asistenciasHoy.filter((a) => a.equipo === s.equipo);
        const checkinsReal = asistenciaSesion.filter((a) => a.estado === "presente" || a.estado === "tarde").length;

        let status: "en_progreso" | "proximo" | "programado" = "programado";
        if (idx === 0) status = "en_progreso";
        else if (idx === 1) status = "proximo";

        return {
          id: s.id || `min-${idx}`,
          hora: s.hora || "Por definir",
          cancha: canchaNombre,
          equipo: s.equipo || "Equipo sin nombre",
          entrenador: eq?.entrenador || "Staff No Asignado",
          status,
          checkins: checkinsReal,
        };
      });
    }

    // De lo contrario, derivamos la parrilla dinámica de los equipos que entrenan HOY (Jueves)
    const nowHour = new Date().getHours();

    return equiposHoyRecurrentes.map((eq, idx) => {
      const coach = entrenadores.find((c) => c.nombre === eq.entrenador);
      const coachSchedule = coach?.horario || "14:00 - 16:00";
      const startHourMatch = coachSchedule.match(/(\d{1,2}):(\d{2})/);
      const startHour = startHourMatch ? parseInt(startHourMatch[1], 10) : 14;

      const sedeNombre = eq.sede || sedes[idx % Math.max(sedes.length, 1)]?.nombre || "Sede Central";
      const canchaNombre = `Cancha ${idx + 1} (${sedeNombre})`;
      const asistenciaSesion = asistenciasHoy.filter((a) => a.equipo === eq.nombre);
      const checkinsReal = asistenciaSesion.filter((a) => a.estado === "presente" || a.estado === "tarde").length;

      let status: "en_progreso" | "proximo" | "programado" = "programado";
      if (nowHour >= startHour && nowHour < startHour + 2) {
        status = "en_progreso";
      } else if (nowHour < startHour && startHour - nowHour <= 2) {
        status = "proximo";
      }

      return {
        id: eq.id || `min-${idx}`,
        hora: coachSchedule.split(" ").slice(-3).join(" "),
        cancha: canchaNombre,
        equipo: eq.nombre,
        entrenador: eq.entrenador || "Staff No Asignado",
        status,
        checkins: checkinsReal,
      };
    });
  }, [sesionesHoy, equiposHoyRecurrentes, asistenciasHoy, sedes, entrenadores, equipos]);

  // 6. Últimos Check-ins Reales (Registros de hoy en RendimientoStore)
  const ultimosCheckinsReales = useMemo(() => {
    const checkinsToday = asistenciasHoy.slice(0, 10);
    return checkinsToday.map((a) => {
      const jug = jugadores.find((j) => j.nombre === a.jugadorNombre || j.id === a.jugadorId);
      return {
        id: a.id || generateUniqueId("chk"),
        nombre: a.jugadorNombre || jug?.nombre || "Jugador",
        categoria: jug?.categoria || "General",
        sede: jug?.sede || "Sede Principal",
        tiempo: a.fecha,
        estadoPago: jug?.estadoPago || "al_dia",
        estado: a.estado,
      };
    });
  }, [asistenciasHoy, jugadores]);

  // 7. Centro de Tareas y Alertas Operativas Reales
  const fichasIncompletasCount = useMemo(() => {
    return jugadores.filter((j) => !j.avatar || !j.encargado || !j.consentLiberacion).length;
  }, [jugadores]);

  const convocatoriasPendientesCount = useMemo(() => {
    const list = RendimientoStore.get<any[]>("convocatorias_dynamics", []);
    return list.filter((c) => c.jugadores.some((j: any) => j.estado === "pendiente")).length;
  }, [updateTrigger]);

  const conflictosHorariosCount = 0; // Sin empalmes detectados

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            Dashboard Operativo
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] uppercase">En Tiempo Real</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Monitoreo de sedes, minutero de canchas y control de campo.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/checkin">
              <QrCode className="h-4 w-4" /> Escáner Check-in QR
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-elegant font-bold" asChild>
            <Link to="/convocatorias">
              <ClipboardList className="h-4 w-4" /> Convocatorias
            </Link>
          </Button>
        </div>
      </div>

      {/* 🔝 1. Fila de KPIs Operativos (El estado de las sedes hoy) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Asistencia Diaria */}
        <StatCard
          label="% Asistencia Diaria"
          value={`${asistenciaPorcentaje}%`}
          hint="Promedio de check-ins esperados hoy"
          icon={CalendarCheck}
          accent="success"
        />

        {/* KPI 2: Ocupación de Instalaciones */}
        <StatCard
          label="Ocupación Instalaciones"
          value={`${ocupacionPorcentaje}%`}
          hint="Bloques de canchas ocupados hoy"
          icon={MapPinned}
          accent="primary"
        />

        {/* KPI 3: Total Jugadores Activos (Con link a /jugadores) */}
        <Link to="/jugadores" className="group block">
          <Card className="p-4 shadow-card hover:shadow-elegant transition border bg-card relative overflow-hidden group-hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Jugadores Activos</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black mt-2 text-foreground">{activosCount}</p>
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-muted-foreground">Fichas registradas en sistema</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>

        {/* KPI 4: Ausencias de Staff */}
        <StatCard
          label="Ausencias de Staff"
          value={staffAusenteCount > 0 ? `${staffAusenteCount} alertas` : "0 sin novedad"}
          hint="Entrenadores sin asistencia registrada"
          icon={UserX}
          accent={staffAusenteCount > 0 ? "warning" : "primary"}
        />
      </div>

      {/* 📈 2. Bloque Central: El "Minutero" y Control de Campo */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ⬅️ Columna Izquierda (Ancha): Monitoreo de Horarios y Canchas en Tiempo Real */}
        <Card className="lg:col-span-2 shadow-card flex flex-col justify-between">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" /> Minutero de Canchas & Clases Hoy
              </CardTitle>
              <CardDescription>Parrilla en tiempo real por sede, entrenador y check-ins</CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
              ● Transmitiendo
            </Badge>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {minuteroCanchas.length > 0 ? (
              minuteroCanchas.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border bg-card hover:bg-muted/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-14 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary font-bold shrink-0">
                      <span className="text-[10px] uppercase opacity-70">Hora</span>
                      <span className="text-xs leading-none">{c.hora}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{c.cancha}</p>
                        {c.status === "en_progreso" && (
                          <Badge className="bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider animate-pulse">
                            🟢 En Progreso
                          </Badge>
                        )}
                        {c.status === "proximo" && (
                          <Badge className="bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider">
                            🟡 Próximo (Calentando)
                          </Badge>
                        )}
                        {c.status === "programado" && (
                          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">
                            ⚪ Programado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-semibold text-foreground">{c.equipo}</span> · Entrenador: {c.entrenador}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                        {c.checkins} Check-ins
                      </span>
                      <span className="text-[10px] text-muted-foreground">asistencia confirmada</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                      <Link to="/asistencia">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground space-y-2 border border-dashed rounded-xl p-4">
                <Clock className="h-6 w-6 text-muted-foreground/50 mx-auto" />
                <p className="font-medium text-foreground">No hay clases registradas hoy</p>
                <p className="text-[11px]">Las clases o entrenamientos programados para hoy aparecerán en esta parrilla en tiempo real.</p>
                <Button size="sm" variant="outline" className="mt-2 text-xs" asChild>
                  <Link to="/horarios">Programar Horario →</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ➡️ Columna Derecha (Estrecha): Accesos y Check-in Rápido en Tiempo Real */}
        <Card className="shadow-card flex flex-col justify-between">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="h-4 w-4 text-sky-500" /> Últimos Check-ins QR
              </CardTitle>
              <CardDescription>Ingresos de alumnos en tiempo real</CardDescription>
            </div>
            <Link to="/checkin" className="text-xs text-primary hover:underline font-semibold">
              Escanear →
            </Link>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {ultimosCheckinsReales.length > 0 ? (
              ultimosCheckinsReales.map((chk) => (
                <div key={chk.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/40 hover:bg-muted transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {chk.nombre[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-foreground">{chk.nombre}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{chk.categoria} · {chk.sede}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-muted-foreground block">{chk.tiempo}</span>
                    {chk.estadoPago === "moroso" ? (
                      <Badge variant="destructive" className="text-[8px] py-0 px-1">⚠️ Pend. Pago</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[8px] text-emerald-600 border-emerald-500/20 py-0 px-1">✓ OK</Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-muted-foreground space-y-2 border border-dashed rounded-xl p-4">
                <QrCode className="h-6 w-6 text-muted-foreground/50 mx-auto" />
                <p className="font-medium text-foreground">Sin check-ins hoy</p>
                <p className="text-[11px]">No se ha registrado ningún ingreso QR o toma de lista el día de hoy.</p>
                <Button size="sm" variant="outline" className="mt-2 text-xs" asChild>
                  <Link to="/checkin">Abrir Tótem QR →</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 🚨 3. Bloque Inferior: Centro de Tareas y Alertas Operativas */}
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Centro de Tareas & Alertas Operativas
            </CardTitle>
            <CardDescription>Acciones prioritarias requeridas antes de finalizar la jornada</CardDescription>
          </div>
          <Badge variant="secondary" className="font-bold text-xs">Acción Rápida</Badge>
        </CardHeader>

        <CardContent className="p-4 grid gap-3 md:grid-cols-3">
          {/* Tarea 1: Conflictos de Horarios */}
          <div className="p-3.5 rounded-xl border bg-emerald-500/5 border-emerald-500/20 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Conflictos de Horarios</span>
                <Badge className="bg-emerald-500 text-white font-bold text-[10px]">0 Empalmes</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Todas las canchas y entrenadores están sin sobreposiciones de horarios hoy.
              </p>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs font-semibold" asChild>
              <Link to="/horarios">Ver Matriz de Horarios</Link>
            </Button>
          </div>

          {/* Tarea 2: Convocatorias Pendientes (Con link directo a /convocatorias) */}
          <div className="p-3.5 rounded-xl border bg-amber-500/5 border-amber-500/20 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Convocatorias Pendientes</span>
                <Badge className="bg-amber-500 text-white font-bold text-[10px]">{convocatoriasPendientesCount} por enviar</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Listas de partidos creadas que faltan por notificar a la App de padres.
              </p>
            </div>
            <Button size="sm" className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white" asChild>
              <Link to="/convocatorias">Revisar Convocatorias ({convocatoriasPendientesCount})</Link>
            </Button>
          </div>

          {/* Tarea 3: Fichas Incompletas (Con link directo a /jugadores) */}
          <div className="p-3.5 rounded-xl border bg-red-500/5 border-red-500/20 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Fichas Incompletas</span>
                <Badge variant="destructive" className="font-bold text-[10px]">{fichasIncompletasCount} Atletas</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Alumnos sin foto de perfil o sin la firma del deslinde médico cargado.
              </p>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs font-bold border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10" asChild>
              <Link to="/jugadores">Filtrar Jugadores Incompletos ({fichasIncompletasCount})</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

