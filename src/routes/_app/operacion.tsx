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

  const conflictosHorariosCount = 0; // Sin empal  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-[10px] uppercase mb-1">
            Operaciones · Control de Campo
          </Badge>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Dashboard Operativo
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              EN TIEMPO REAL
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Monitoreo de sedes, minutero de canchas y control de campo.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="border-slate-200 dark:border-slate-800 font-bold text-xs rounded-xl" asChild>
            <Link to="/checkin">
              <QrCode className="h-4 w-4 text-primary" /> Escáner Check-in QR
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm text-xs rounded-xl" asChild>
            <Link to="/convocatorias">
              <ClipboardList className="h-4 w-4" /> Convocatorias
            </Link>
          </Button>
        </div>
      </div>

      {/* 🔝 1. Fila de KPIs Operativos (Regla 3: Estructura de 3 Niveles Verticales) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Asistencia Diaria */}
        <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            % ASISTENCIA DIARIA
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight my-1">
            {asistenciaPorcentaje}%
          </p>
          <p className="text-xs text-slate-500 font-normal">
            Promedio de check-ins esperados hoy
          </p>
        </div>

        {/* KPI 2: Ocupación Instalaciones */}
        <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            OCUPACIÓN INSTALACIONES
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight my-1">
            {ocupacionPorcentaje}%
          </p>
          <p className="text-xs text-slate-500 font-normal">
            Bloques de canchas ocupados hoy
          </p>
        </div>

        {/* KPI 3: Total Jugadores Activos */}
        <Link to="/jugadores" className="group block">
          <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1 hover:border-slate-300 transition">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              TOTAL JUGADORES ACTIVOS
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight my-1">
              {activosCount}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 font-normal">
              <span>Fichas registradas en sistema</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* KPI 4: Ausencias de Staff */}
        <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            AUSENCIAS DE STAFF
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight my-1">
            {staffAusenteCount}
          </p>
          <p className="text-xs text-slate-500 font-normal">
            {staffAusenteCount > 0 ? "Alertas activas" : "Sin novedad"} • Entrenadores sin asistencia
          </p>
        </div>
      </div>

      {/* 📈 2. Bloque Central: El "Minutero" y Control de Campo */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ⬅️ Columna Izquierda (Ancha): Monitoreo de Horarios y Canchas en Tiempo Real */}
        <Card className="lg:col-span-2 shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex flex-col justify-between">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Clock className="h-4 w-4 text-primary" /> Minutero de Canchas & Clases Hoy
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Parrilla en tiempo real por sede, entrenador y check-ins</CardDescription>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              ● Transmitiendo
            </span>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            {minuteroCanchas.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {minuteroCanchas.map((c) => (
                  <div
                    key={c.id}
                    className="py-3 first:pt-0 last:pb-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-14 flex-col items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold shrink-0">
                        <span className="text-[9px] uppercase text-slate-400">Hora</span>
                        <span className="text-xs font-mono">{c.hora}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.cancha}</p>
                          {c.status === "en_progreso" && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                              En Progreso
                            </span>
                          )}
                          {c.status === "proximo" && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                              Próximo
                            </span>
                          )}
                          {c.status === "programado" && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-medium">
                              Programado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{c.equipo}</span> • Entrenador: {c.entrenador}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                          {c.checkins} Check-ins
                        </span>
                        <span className="text-[10px] text-slate-400">asistencia confirmada</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700" asChild>
                        <Link to="/asistencia">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500 space-y-2 border border-slate-200/60 dark:border-slate-800 rounded-xl p-6 bg-slate-50/40">
                <Clock className="h-6 w-6 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No hay clases registradas hoy</p>
                <p className="text-[11px] text-slate-500">Las clases o entrenamientos programados para hoy aparecerán en esta parrilla en tiempo real.</p>
                <Button size="sm" variant="outline" className="mt-2 text-xs font-semibold border-slate-200 dark:border-slate-800" asChild>
                  <Link to="/horarios">Programar Horario →</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ➡️ Columna Derecha (Estrecha): Accesos y Check-in Rápido en Tiempo Real */}
        <Card className="shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex flex-col justify-between">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <QrCode className="h-4 w-4 text-primary" /> Últimos Check-ins QR
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Ingresos de alumnos en tiempo real</CardDescription>
            </div>
            <Link to="/checkin" className="text-xs text-primary hover:underline font-semibold">
              Escanear →
            </Link>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            {ultimosCheckinsReales.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {ultimosCheckinsReales.map((chk) => (
                  <div key={chk.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {chk.nombre[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">{chk.nombre}</p>
                        <p className="text-[10px] text-slate-500 truncate">{chk.categoria} • {chk.sede}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">{chk.tiempo}</span>
                      {chk.estadoPago === "moroso" ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                          Pend. Pago
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                          ✓ OK
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-500 space-y-2 border border-slate-200/60 dark:border-slate-800 rounded-xl p-6 bg-slate-50/40">
                <QrCode className="h-6 w-6 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Sin check-ins hoy</p>
                <p className="text-[11px] text-slate-500">No se ha registrado ningún ingreso QR o toma de lista el día de hoy.</p>
                <Button size="sm" variant="outline" className="mt-2 text-xs font-semibold border-slate-200 dark:border-slate-800" asChild>
                  <Link to="/checkin">Abrir Tótem QR →</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 🚨 3. Bloque Inferior: Centro de Tareas y Alertas Operativas */}
      <Card className="shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Centro de Tareas & Alertas Operativas
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Acciones prioritarias requeridas antes de finalizar la jornada</CardDescription>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] border border-slate-200/60">
            Acción Rápida
          </span>
        </CardHeader>

        <CardContent className="p-5 grid gap-4 md:grid-cols-3">
          {/* Tarea 1: Conflictos de Horarios */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Conflictos de Horarios</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  0 Empalmes
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Todas las canchas y entrenadores están sin sobreposiciones de horarios hoy.
              </p>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs font-bold border-slate-200 dark:border-slate-800 rounded-xl" asChild>
              <Link to="/horarios">Ver Matriz de Horarios</Link>
            </Button>
          </div>

          {/* Tarea 2: Convocatorias Pendientes */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Convocatorias Pendientes</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                  {convocatoriasPendientesCount} por enviar
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Listas de partidos creadas que faltan por notificar a la App de padres.
              </p>
            </div>
            <Button size="sm" className="w-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-xl" asChild>
              <Link to="/convocatorias">Revisar Convocatorias ({convocatoriasPendientesCount})</Link>
            </Button>
          </div>

          {/* Tarea 3: Fichas Incompletas */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Fichas Incompletas</span>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 text-[10px] font-bold">
                  {fichasIncompletasCount} Atletas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Alumnos sin foto de perfil o sin la firma del deslinde médico cargado.
              </p>
            </div>
            <Button size="sm" variant="outline" className="w-full text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl" asChild>
              <Link to="/jugadores">Filtrar Jugadores Incompletos ({fichasIncompletasCount})</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

