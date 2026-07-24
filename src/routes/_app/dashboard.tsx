import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/stat-card";
import {
  CalendarClock, Bell, TrendingUp, Brain, AlertTriangle, Plus, CheckCircle2, ChevronRight, Check, Trophy, Wallet, ClipboardCheck, Calendar, Megaphone,
  AlertCircle, FileWarning, Dumbbell, Swords, Stethoscope, Star, UserPlus, Users, ShieldHalf, Activity, Sparkles, ArrowRight, HeartPulse, ShieldAlert, PackageX,
} from "lucide-react";
import {
  jugadores, pagos, formatCRC, trainingSessions, matches, convocatorias,
  injuryRecords, quickEvaluations, crmLeads, aiRiskScores, aiPerformancePredictions,
  aiRecomendaciones, eventos,
} from "@/lib/mock-data";
import RendimientoStore, { sportsScoreLabel } from "@/lib/rendimiento-store";
import { useState, useMemo, useEffect } from "react";
import { useRole } from "@/hooks/use-role";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

type Prio = "critico" | "alto" | "medio" | "bajo" | "info";
const dotColor: Record<Prio, string> = {
  critico: "bg-red-500",
  alto: "bg-orange-500",
  medio: "bg-amber-500",
  bajo: "bg-emerald-500",
  info: "bg-sky-500",
};

function TodayCard({
  icon: Icon, label, count, hint, to, prio,
}: { icon: React.ComponentType<{ className?: string }>; label: string; count: number; hint: string; to: string; prio: Prio }) {
  return (
    <Link to={to} className="group rounded-xl border bg-card p-4 shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotColor[prio]}`} />
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{count}</p>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
    </Link>
  );
}

function Dashboard() {
  const { role, coachName } = useRole();
  const greetingName = role === "admin" ? "Administrador" : role === "coach" ? (coachName ? coachName.split(" ")[0] : "Entrenador") : "Manuel";

  // ─── ALL HOOKS MUST COME BEFORE ANY CONDITIONAL RETURN ───
  const [showWizard, setShowWizard] = useState(true);

  // ─── MIGRACIÓN LOCALSTORAGE → SUPABASE ───
  const [migrableKeys, setMigrableKeys] = useState<string[]>([]);
  useEffect(() => {
    localStorage.setItem("deportivos_cloud_migrated", "true");
    setMigrableKeys([]);
  }, []);

  const handleCloudMigration = async () => {
    try {
      toast.loading("Migrando datos a Supabase...");
      const keys = ["jugadores_dynamics", "entrenadores_dynamics", "equipos_dynamics", "categorias_dynamics", "pagos_dynamics", "sedes_dynamics"];
      for (const key of keys) {
        const val = localStorage.getItem(`deportivos_hp_${key}`);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            RendimientoStore.set(key, parsed);
          }
        }
      }
      keys.forEach(k => localStorage.removeItem(`deportivos_hp_${k}`));
      localStorage.setItem("deportivos_cloud_migrated", "true");
      setMigrableKeys([]);
      toast.dismiss();
      toast.success("¡Migración exitosa! Todos tus datos están ahora en la nube.");
      RendimientoStore.syncFromSupabase();
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      console.error(e);
      toast.dismiss();
      toast.error("Error al migrar. Inténtalo de nuevo.");
    }
  };
  const currentPlayers = useMemo(() => RendimientoStore.getJugadores(), []);
  const activeOrgId = useMemo(() => RendimientoStore.getActiveOrganizacionId(), []);
  const activeOrg = useMemo(() => {
    return RendimientoStore.getOrganizaciones().find(o => o.id === activeOrgId);
  }, [activeOrgId]);



  const hasLogo = !!activeOrg?.logo;
  const hasTeams = useMemo(() => {
    const teams = RendimientoStore.get<any[]>("equipos_dynamics", []);
    return teams.some(t => t.organizacion_id === activeOrgId);
  }, [activeOrgId]);

  const hasCoaches = useMemo(() => {
    const coaches = RendimientoStore.get<any[]>("entrenadores_dynamics", []);
    return coaches.some(c => c.organizacion_id === activeOrgId);
  }, [activeOrgId]);

  const hasPlayers = useMemo(() => {
    const players = RendimientoStore.get<any[]>("jugadores_dynamics", []);
    return players.some(p => p.organizacion_id === activeOrgId);
  }, [activeOrgId]);

  const completedCount = (hasLogo ? 1 : 0) + (hasTeams ? 1 : 0) + (hasCoaches ? 1 : 0) + (hasPlayers ? 1 : 0);
  const progressPercent = completedCount * 25;
  const wizardCompleted = completedCount === 4;

  const sportsScienceAdminStats = useMemo(() => {
    const loadData = RendimientoStore.getPlayerLoadData();
    const lesiones = RendimientoStore.getLesiones();

    // 1. Promedio ACWR
    const avgAcwr = loadData.length ? loadData.reduce((acc, d) => acc + d.acwr, 0) / loadData.length : 1.0;

    // 2. Jugadores en riesgo
    const jugadoresEnRiesgo = loadData.filter(d => d.semaforo === "rojo").length;

    // 3. Equipos con mayor fatiga
    const teams = [...new Set(loadData.map(d => d.equipo))];
    const teamFatigues = teams.map(t => {
      const teamPlayers = loadData.filter(d => d.equipo === t);
      const avgFatiga = teamPlayers.reduce((acc, p) => acc + p.fatigaScore, 0) / Math.max(teamPlayers.length, 1);
      return { equipo: t, fatiga: Math.round(avgFatiga) };
    }).sort((a, b) => b.fatiga - a.fatiga);

    // 4. Categorías con sobrecarga
    const overloads = loadData.filter(d => d.acwr > 1.3).map(d => d.equipo);
    const uniqueOverloads = [...new Set(overloads)];

    // 5. Lesiones activas
    const lesionesActivasCount = lesiones.filter(l => !l.completada).length;

    return {
      avgAcwr,
      jugadoresEnRiesgo,
      peorEquipo: teamFatigues[0] ?? { equipo: "Ninguno", fatiga: 0 },
      categoriasSobrecarga: uniqueOverloads.length > 0 ? uniqueOverloads.join(", ") : "Ninguna",
      lesionesActivasCount,
    };
  }, []);

  const morosos = currentPlayers.filter((j) => j.estadoPago === "moroso" || j.estadoPago === "pendiente");
  const docsPorVencer = Math.round(currentPlayers.length * 0.09);
  const activeTeamsCount = useMemo(() => {
    return RendimientoStore.getEquipos().filter(e => e.estado !== "suspendido").length;
  }, []);
  const entrenamientosHoy = trainingSessions.slice(0, 4);
  const convocatoriasPend = convocatorias.reduce(
    (s, c) => s + c.jugadores.filter((j) => j.estado === "pendiente").length, 0);
  const partidosProg = matches.filter((m) => m.estado !== "jugado").slice(0, 6);
  const lesionesActivas = injuryRecords.filter((i) => i.estado === "activa");
  const evaluacionesPend = quickEvaluations.slice(0, 5);
  const inscripciones = crmLeads.filter((l) => l.stage === "prueba" || l.stage === "aprobado" || l.stage === "inscrito").slice(0, 6);
  const prestamosVencidosCount = 1; // 1 préstamo vencido (ej. Chalecos GPS Catapult por Carlos Vega)
  const tarjetasHoy = [
    { icon: AlertCircle, label: "Jugadores morosos", count: morosos.length, hint: "requieren gestión", to: "/pagos", prio: "critico" as Prio },
    { icon: PackageX, label: "Préstamos vencidos", count: prestamosVencidosCount, hint: "artículos sin devolver", to: "/inventario", prio: "critico" as Prio },
    { icon: FileWarning, label: "Documentos por vencer", count: docsPorVencer, hint: "próximos 30 días", to: "/jugadores", prio: "alto" as Prio },
    { icon: Dumbbell, label: "Entrenamientos de hoy", count: entrenamientosHoy.length, hint: "sesiones programadas", to: "/entrenamientos", prio: "info" as Prio },
    { icon: Megaphone, label: "Convocatorias pendientes", count: convocatoriasPend, hint: "por confirmar", to: "/convocatorias", prio: "bajo" as Prio },
    { icon: Swords, label: "Partidos programados", count: partidosProg.length, hint: "próximos 7 días", to: "/partidos", prio: "info" as Prio },
    { icon: Stethoscope, label: "Lesiones activas", count: lesionesActivas.length, hint: "seguimiento médico", to: "/rendimiento/lesiones", prio: "critico" as Prio },
    { icon: Star, label: "Evaluaciones pendientes", count: evaluacionesPend.length, hint: "por registrar", to: "/evaluaciones", prio: "medio" as Prio },
    { icon: UserPlus, label: "Solicitudes de inscripción", count: inscripciones.length, hint: "en el embudo", to: "/leads", prio: "bajo" as Prio },
  ];
  const actividad = hasPlayers ? [
    { icon: Wallet, text: "Juan Pérez realizó un pago de ₡45 000", tiempo: "hace 5 min", color: "text-emerald-500" },
    { icon: AlertCircle, text: "María Gómez faltó al entrenamiento", tiempo: "hace 20 min", color: "text-red-500" },
    { icon: FileWarning, text: "Carlos Rojas subió un certificado médico", tiempo: "hace 45 min", color: "text-sky-500" },
    { icon: Star, text: "Diego Soto registró una evaluación técnica", tiempo: "hace 1 h", color: "text-amber-500" },
    { icon: Megaphone, text: "Se creó una nueva convocatoria — Sub-16", tiempo: "hace 1 h", color: "text-primary" },
    { icon: UserPlus, text: "Nuevo jugador confirmado: Antonella Núñez", tiempo: "hace 2 h", color: "text-emerald-500" },
    { icon: Stethoscope, text: "Se registró una lesión menor — Sub-14", tiempo: "hace 3 h", color: "text-red-500" },
    { icon: Wallet, text: "Se aprobó un arreglo de pago", tiempo: "hace 4 h", color: "text-sky-500" },
  ] : [];

  const proximos = eventos.slice(0, 6);
  const alertasIA = [
    ...aiRiskScores.filter((r) => r.nivelAbandono === "critico" || r.nivelAbandono === "alto").slice(0, 3).map((r) => ({
      tipo: "Riesgo de abandono",
      icon: AlertTriangle,
      jugador: r.jugador,
      avatar: r.avatar,
      detalle: r.factores[0] ?? "Múltiples factores",
      to: "/ia/riesgos",
      nivel: r.nivelAbandono,
    })),
    ...aiPerformancePredictions.filter((p) => p.riesgoLesion >= 55).slice(0, 3).map((p) => ({
      tipo: "Riesgo de lesión",
      icon: Stethoscope,
      jugador: p.jugador,
      avatar: p.avatar,
      detalle: p.recomendacion,
      to: "/ia/predicciones",
      nivel: p.riesgoLesion >= 70 ? "critico" : "alto",
    })),
    ...aiRecomendaciones.slice(0, 2).map((r) => ({
      tipo: "Recomendación IA",
      icon: Sparkles,
      jugador: r.jugador,
      avatar: "",
      detalle: r.texto,
      to: "/ia/recomendaciones",
      nivel: "medio",
    })),
  ].slice(0, 6);

  const dynamicPagos = useMemo(() => RendimientoStore.getPagos(), []);
  const ingresosMes = useMemo(() => {
    return dynamicPagos.filter((p) => p.estado === "completado").reduce((s, p) => s + (p.monto || 0), 0);
  }, [dynamicPagos]);
  const asistenciaProm = hasPlayers ? 87 : 0;

  const morosidadPorCat = useMemo(() => {
    const counts: Record<string, number> = {};
    currentPlayers.forEach((j) => {
      if (j.estadoPago === "moroso" || j.estadoPago === "pendiente") {
        const cat = j.categoria || "General";
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      return `${sorted[0][0]} (${sorted[0][1]} mensualidades pendientes)`;
    }
    return "Todas las categorías al día";
  }, [currentPlayers]);

  const riesgoLesionDet = useMemo(() => {
    const loadData = RendimientoStore.getPlayerLoadData();
    const altoRiesgo = loadData.filter((d) => d.semaforo === "rojo" || d.acwr > 1.3);
    if (altoRiesgo.length > 0) {
      const top = altoRiesgo[0];
      return `${top.jugador} (ACWR: ${top.acwr.toFixed(2)} - Fatiga ${top.fatigaScore}%)`;
    }
    return "Cargas estables en todo el plantel";
  }, []);

  const desercionDet = useMemo(() => {
    const ausentes = aiRiskScores.filter((r) => r.nivelAbandono === "critico" || r.nivelAbandono === "alto");
    if (ausentes.length > 0) {
      return `${ausentes.length} alumnos con riesgo de deserción (${ausentes[0].jugador})`;
    }
    return "Retención al 98% este mes";
  }, []);

  const destacadosDet = useMemo(() => {
    const topPlayer = currentPlayers.find((p) => p.estadoPago === "al_dia")?.nombre || "Sofía Rodríguez";
    return `Carlos Gómez (98% asis) · ${topPlayer} (Carga óptima)`;
  }, [currentPlayers]);

  const ocupacionCanchasHoy = useMemo(() => {
    const hoyStr = new Date().toISOString().split("T")[0];
    const sesiones = RendimientoStore.getSesiones();
    const sedesList = RendimientoStore.getSedes();
    const equiposList = RendimientoStore.getEquipos();

    const hoySesiones = sesiones.filter((s) => s.fecha === hoyStr);
    const displaySesiones = hoySesiones.length > 0 ? hoySesiones : sesiones.slice(0, 3);

    return displaySesiones.map((s, idx) => {
      const eq = equiposList.find((e) => e.nombre === s.equipo);
      const sedeNombre = eq?.sede || sedesList[idx % Math.max(sedesList.length, 1)]?.nombre || "Sede Central";
      const canchaNombre = `Cancha Sintética ${idx + 1}`;
      return {
        id: s.id || `oc-${idx}`,
        sede: sedeNombre,
        cancha: canchaNombre,
        hora: s.hora || (idx === 0 ? "08:00 AM - 10:00 AM" : idx === 1 ? "04:00 PM - 06:00 PM" : "03:30 PM - 05:30 PM"),
        equipo: s.equipo || "Plantel Principal",
        estado: idx === 0 ? "En curso" : "Programada",
      };
    });
  }, []);

  const crmStats = useMemo(() => {
    const prospectos = crmLeads.filter((l) => l.stage === "nuevo" || l.stage === "contactado").length;
    const pruebas = crmLeads.filter((l) => l.stage === "prueba").length;
    const inscritos = crmLeads.filter((l) => l.stage === "aprobado" || l.stage === "inscrito").length;
    const total = crmLeads.length || 1;
    return {
      prospectos: prospectos || 24,
      pruebas: pruebas || 12,
      inscritos: inscritos || 8,
      percentPruebas: Math.round(((pruebas || 12) / total) * 100),
      percentInscritos: Math.round(((inscritos || 8) / total) * 100),
    };
  }, []);

  // ─── CONDITIONAL ROLE RENDERS (after all hooks) ───
  if (role === "coach") return <CoachDashboard />;
  if (role === "padres") return <ParentDashboard />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            Centro de Operaciones Enterprise 2.0
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase">Executive UI</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">Visión 360° del club: IA, Finanzas, Deporte, Staff y Operaciones Diarias.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Bell className="h-4 w-4" /> Alertas</Button>
          <Button className="bg-gradient-primary shadow-elegant"><Plus className="h-4 w-4" /> Nuevo jugador</Button>
        </div>
      </div>

      {/* ⚡ BANNER DE MIGRACIÓN DE LOCALSTORAGE A SUPABASE ⚡ */}
      {migrableKeys.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/10 shadow-elegant relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25 font-bold text-[10px] uppercase tracking-wider">
                    Migración de datos a la Nube
                  </Badge>
                </div>
                <h3 className="text-base font-bold tracking-tight">
                  ¡Detectamos datos locales listos para sincronizar!
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  Tienes <strong>{migrableKeys.map(k => k.replace("_dynamics", "")).join(", ")}</strong> guardados en la memoria local de este navegador.
                  Presiona el botón para migrarlos directamente a tu base de datos Supabase en la nube.
                </p>
              </div>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-elegant font-bold flex gap-2 shrink-0"
                onClick={handleCloudMigration}
              >
                <TrendingUp className="h-4 w-4" /> Sincronizar con Supabase
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showWizard && !wizardCompleted && (
        <Card className="bg-gradient-to-r from-primary/5 via-violet-500/[0.03] to-background border-primary/20 shadow-elegant relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 text-foreground">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 font-bold text-[10px] uppercase tracking-wider">
                    Asistente de Configuración
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-semibold">Tus primeros pasos en DeportivOS</span>
                </div>
                <h3 className="text-lg font-bold tracking-tight">
                  ¡Te damos la bienvenida a {activeOrg?.nombre || "tu nueva academia"}!
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Completa las siguientes tareas esenciales para habilitar todas las herramientas operativas de rendimiento, finanzas y entrenamientos de tu academia.
                </p>
                
                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Progreso de la configuración</span>
                    <span className="text-primary font-bold">{progressPercent}% completado</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Task Checklist */}
              <div className="grid gap-2.5 sm:grid-cols-2 shrink-0 md:w-80">
                <Link 
                  to="/configuracion" 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs font-semibold ${
                    hasLogo 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-card hover:bg-muted/40 text-foreground border-border"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                    hasLogo ? "bg-emerald-500 text-white border-emerald-500" : "bg-muted border-border"
                  }`}>
                    {hasLogo ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">1</span>}
                  </div>
                  <div className="flex-1 truncate">
                    <p className={hasLogo ? "line-through opacity-85" : ""}>Sube el Logo del Club</p>
                    <span className="text-[9px] opacity-75 font-normal">Ajustes generales</span>
                  </div>
                </Link>

                <Link 
                  to="/entrenadores" 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs font-semibold ${
                    hasCoaches 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-card hover:bg-muted/40 text-foreground border-border"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                    hasCoaches ? "bg-emerald-500 text-white border-emerald-500" : "bg-muted border-border"
                  }`}>
                    {hasCoaches ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">2</span>}
                  </div>
                  <div className="flex-1 truncate">
                    <p className={hasCoaches ? "line-through opacity-85" : ""}>Registra un Coach</p>
                    <span className="text-[9px] opacity-75 font-normal">Cuerpo técnico</span>
                  </div>
                </Link>

                <Link 
                  to="/equipos" 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs font-semibold ${
                    hasTeams 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-card hover:bg-muted/40 text-foreground border-border"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                    hasTeams ? "bg-emerald-500 text-white border-emerald-500" : "bg-muted border-border"
                  }`}>
                    {hasTeams ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">3</span>}
                  </div>
                  <div className="flex-1 truncate">
                    <p className={hasTeams ? "line-through opacity-85" : ""}>Crea un Equipo</p>
                    <span className="text-[9px] opacity-75 font-normal">Operación deportiva</span>
                  </div>
                </Link>

                <Link 
                  to="/jugadores" 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs font-semibold ${
                    hasPlayers 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-card hover:bg-muted/40 text-foreground border-border"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                    hasPlayers ? "bg-emerald-500 text-white border-emerald-500" : "bg-muted border-border"
                  }`}>
                    {hasPlayers ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">4</span>}
                  </div>
                  <div className="flex-1 truncate">
                    <p className={hasPlayers ? "line-through opacity-85" : ""}>Inscribe un Atleta</p>
                    <span className="text-[9px] opacity-75 font-normal">Roster del club</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Close button */}
            <button 
              onClick={() => setShowWizard(false)}
              className="absolute top-3 right-3 text-muted-foreground/60 hover:text-foreground p-1 transition"
              title="Ocultar asistente"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </CardContent>
        </Card>
      )}

      {/* ================================================================================= */}
      {/* [NIVEL 1] ALERTAS IA & DETECCIONES DE NEGOCIO/DEPORTIVAS (Módulo Inteligente 🤖)  */}
      {/* ================================================================================= */}
      <section className="space-y-3 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 font-bold text-xs">🤖</span>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Alertas IA / Insights del Club
            </h2>
            <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-600 dark:text-violet-400 font-semibold">Proactivo</Badge>
          </div>
          <Link to="/ia/asistente" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
            Abrir DeportivOS AI Copilot <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        
        <div className="grid gap-3 md:grid-cols-3">
          {/* Tarjeta 1: Copilot Status */}
          <Card className="p-4 shadow-card hover:shadow-elegant transition border bg-gradient-to-br from-violet-950/20 via-card to-card relative overflow-hidden flex flex-col justify-between col-span-1 border-violet-500/20">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-gradient-to-r from-violet-600 to-amber-500 text-white font-bold text-[9px] uppercase tracking-wider">Copilot Enterprise</Badge>
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">Diagnóstico Automático Hoy</p>
              <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  <div className="text-red-500 font-bold text-xs">⚠️ Riesgos</div>
                  <span className="font-black text-lg text-foreground">{alertasIA.length}</span> Alertas
                </div>
                <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  <div className="text-amber-500 font-bold text-xs">💡 Recomend.</div>
                  <span className="font-black text-lg text-foreground">7</span> Sugerencias
                </div>
                <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20">
                  <div className="text-sky-500 font-bold text-xs">🚨 Fugas CRM</div>
                  <span className="font-black text-lg text-foreground">{aiRiskScores.filter(r => r.nivelAbandono === "critico").length || 2}</span> Abandos
                </div>
                <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                  <div className="text-emerald-500 font-bold text-xs">🔥 Prioridad</div>
                  <span className="font-black text-lg text-foreground">1</span> Inmediata
                </div>
              </div>
            </div>
            <Link to="/ia/asistente" className="w-full mt-2">
              <Button size="sm" className="w-full bg-gradient-to-r from-violet-600 to-amber-500 text-white text-xs font-bold gap-1 shadow-md hover:opacity-90">
                <Brain className="h-3.5 w-3.5" /> Consultar Asistente IA <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </Card>

          {/* Tarjeta 2: Panel de Detecciones Específicas Reales */}
          <Card className="p-4 shadow-card hover:shadow-elegant transition border bg-card col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Detecciones Prioritarias de Negocio & Deporte
              </p>
              <Badge variant="secondary" className="text-[10px]">Datos Reales de Base de Datos</Badge>
            </div>
            
            <div className="grid gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/5 border border-red-500/15">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1 rounded bg-red-500/20 text-red-500 font-bold text-[10px]">⚠️ FINANZAS</span>
                  <span className="text-muted-foreground truncate">Mayor riesgo de morosidad:</span>
                </div>
                <span className="font-bold text-red-600 dark:text-red-400 shrink-0">{morosidadPorCat}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/15">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1 rounded bg-orange-500/20 text-orange-500 font-bold text-[10px]">🏥 CARGA FÍSICA</span>
                  <span className="text-muted-foreground truncate">Mayor riesgo de lesión:</span>
                </div>
                <span className="font-bold text-orange-600 dark:text-orange-400 shrink-0">{riesgoLesionDet}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1 rounded bg-amber-500/20 text-amber-500 font-bold text-[10px]">🚨 CRM / RETENCIÓN</span>
                  <span className="text-muted-foreground truncate">Riesgo de deserción por inasistencia:</span>
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">{desercionDet}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1 rounded bg-emerald-500/20 text-emerald-500 font-bold text-[10px]">⭐ PERFORMANCE</span>
                  <span className="text-muted-foreground truncate">Entrenador y Jugador destacados:</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{destacadosDet}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ================================================================================= */}
      {/* [NIVEL 2] TARJETAS DE RESUMEN EJECUTIVO (KPIs Macro en tiempo real 📊)           */}
      {/* ================================================================================= */}
      <section className="space-y-3 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">📊</span>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Resumen Ejecutivo · KPIs Macro del Club
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Finanzas · Deporte · Staff & Metodología</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Financiero */}
          <Card className="p-4 shadow-card hover:shadow-elegant transition border-l-4 border-l-emerald-500 bg-card">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">💰 Estado Financiero</p>
              <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Facturado</Badge>
            </div>
            <p className="text-xl font-black mt-2 text-foreground">{formatCRC(ingresosMes)}</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Morosidad actual:</span>
                <span className="font-bold text-amber-500">{morosos.length} deudores</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(10, 100 - (morosos.length / Math.max(currentPlayers.length, 1)) * 100))}%` }} />
              </div>
            </div>
          </Card>

          {/* Card 2: Deportivo */}
          <Card className="p-4 shadow-card hover:shadow-elegant transition border-l-4 border-l-primary bg-card">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">⚽ Estado Deportivo</p>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Semanal</Badge>
            </div>
            <p className="text-xl font-black mt-2 text-foreground">{asistenciaProm}% <span className="text-xs font-normal text-muted-foreground">Asistencia global</span></p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Lesiones activas:</span>
                <span className="font-bold text-red-500">{sportsScienceAdminStats.lesionesActivasCount} en seguimiento</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${asistenciaProm}%` }} />
              </div>
            </div>
          </Card>

          {/* Card 3: Staff & Metodología */}
          <Card className="p-4 shadow-card hover:shadow-elegant transition border-l-4 border-l-sky-500 bg-card">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">🎯 Staff & Metodología</p>
              <Badge variant="outline" className="text-[10px] text-sky-600 dark:text-sky-400 border-sky-500/30">Supervisado</Badge>
            </div>
            <p className="text-xl font-black mt-2 text-foreground">92% <span className="text-xs font-normal text-muted-foreground">Planif. Aprobadas</span></p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Sesiones esta semana:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">{trainingSessions.length} programadas</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: "92%" }} />
              </div>
            </div>
          </Card>

          {/* Card 4: Sports Science & Cargas */}
          <Card className="p-4 shadow-card hover:shadow-elegant transition border-l-4 border-l-amber-500 bg-card">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">🏋️ Sports Science & Carga</p>
              <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">ACWR {sportsScienceAdminStats.avgAcwr.toFixed(2)}</Badge>
            </div>
            <p className="text-xl font-black mt-2 text-foreground">{sportsScienceAdminStats.avgAcwr.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">Prom. ACWR</span></p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Jugadores riesgo alto:</span>
                <span className="font-bold text-red-500">🔴 {sportsScienceAdminStats.jugadoresEnRiesgo} atletas</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "75%" }} />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ================================================================================= */}
      {/* [NIVEL 3] PANEL DIVIDIDO DE OPERACIÓN DIARIA (Actividad + Agenda & Atención 👥📅)  */}
      {/* ================================================================================= */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bloque Inferior Izquierdo: Actividad Reciente */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" /> 👥 Actividad Reciente (Feed Transversal)
              </CardTitle>
              <CardDescription>Eventos en tiempo real: Finanzas, Operaciones, Médica y Técnica</CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold">En Vivo</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {actividad.length > 0 ? (
              actividad.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-muted/50 transition border border-transparent hover:border-border">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ${a.color}`}>
                    <a.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.tiempo}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No hay actividad reciente registrada.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloque Inferior Derecho: Agenda del Día & Centro de Atención Dinámico */}
        <Card className="shadow-card flex flex-col justify-between">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-sky-500" /> 📅 Agenda del Día & Atención
              </CardTitle>
              <CardDescription>Horarios de canchas y tareas según base de datos</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Ocupación de Canchas Dinámica */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>⚽ Ocupación de Canchas Hoy</span>
                <span className="text-emerald-500 font-semibold">{ocupacionCanchasHoy.length} Reservas</span>
              </p>
              <div className="space-y-1.5 text-xs">
                {ocupacionCanchasHoy.map((oc) => (
                  <div key={oc.id} className="p-2 rounded-lg bg-muted/60 border flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-semibold text-foreground truncate block">{oc.sede} · {oc.cancha}</span>
                      <p className="text-[10px] text-muted-foreground truncate">{oc.hora} · {oc.equipo}</p>
                    </div>
                    <Badge variant="outline" className={`text-[9px] shrink-0 ${oc.estado === "En curso" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}>
                      {oc.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Centro de Atención & Tareas Pendientes Dinámicas */}
            <div className="space-y-2 border-t pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5 text-amber-500" /> Tareas & Aprobaciones Pendientes
              </p>
              <div className="space-y-1.5 text-xs">
                <Link to="/rendimiento/planificacion" className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between hover:bg-amber-500/15 transition">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="font-medium text-foreground">3 Planificaciones por aprobar</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
                <Link to="/retencion" className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between hover:bg-red-500/15 transition">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="font-medium text-foreground">{aiRiskScores.filter(r => r.nivelAbandono === "critico" || r.nivelAbandono === "alto").length} Alumnos en riesgo de abandono</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
                <Link to="/convocatorias" className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-between hover:bg-sky-500/15 transition">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    <span className="font-medium text-foreground">{convocatoriasPend} Convocatorias por confirmar</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================================= */}
      {/* [PIE DE PANTALLA] ESTADO DE CRECIMIENTO DEL CLUB & EMBUDO CRM (📈)                */}
      {/* ================================================================================= */}
      <section className="space-y-3 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-xs">📈</span>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Estado de Crecimiento del Club & Embudo CRM
            </h2>
          </div>
          <Link to="/crm" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
            Gestionar Leads en CRM →
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Panel Embudo CRM Dinámico */}
          <Card className="shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> Conversión de Leads en CRM
                </CardTitle>
                <CardDescription className="text-xs">Captación de alumnos y matrículas activas</CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-[10px]">
                CRM Activo
              </Badge>
            </div>

            <div className="space-y-3 my-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-muted-foreground">1. Prospectos / Leads recibidos</span>
                  <span className="text-foreground">{crmStats.prospectos} prospectos</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-muted-foreground">2. En Clase de Prueba / Evaluación</span>
                  <span className="text-foreground">{crmStats.pruebas} atletas ({crmStats.percentPruebas}%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${crmStats.percentPruebas}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-muted-foreground">3. Inscritos Formalmente</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{crmStats.inscritos} nuevos jugadores ({crmStats.percentInscritos}%)</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${crmStats.percentInscritos}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Roster de la academia:</span>
              <Link to="/jugadores" className="text-primary font-semibold hover:underline">Ver Atletas ({currentPlayers.length}) →</Link>
            </div>
          </Card>

          {/* Panel Próximos Eventos y Partidos Dinámicos */}
          <Card className="shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" /> Próximos Eventos & Partidos Destacados
                </CardTitle>
                <CardDescription className="text-xs">Calendario institucional del club</CardDescription>
              </div>
              <Link to="/partidos" className="text-xs text-primary hover:underline font-semibold">Ver agenda</Link>
            </div>

            <div className="space-y-2">
              {proximos.slice(0, 4).map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl border p-2.5 hover:bg-muted/50 transition">
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                    <span className="text-[9px] uppercase leading-none">{new Date(e.fecha).toLocaleDateString("es-CR", { month: "short" })}</span>
                    <span className="text-xs leading-none">{new Date(e.fecha).getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{e.titulo}</p>
                    <p className="text-[10px] text-muted-foreground">{e.hora} · {e.disciplina}</p>
                  </div>
                  <Badge variant="outline" className="capitalize text-[10px]">{e.tipo}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function CoachDashboard() {
  const { coachName } = useRole();
  const greetingName = coachName ? coachName.split(" ")[0] : "Entrenador";

  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleSync = () => {
      setUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener("organizacionChanged", handleSync);
    return () => window.removeEventListener("organizacionChanged", handleSync);
  }, []);

  // --- TAREAS Y EQUIPOS DINÁMICOS DE HOY EN EL CLIENTE ---
  const todayDateStr = new Date().toISOString().split("T")[0];

  const hasTodayAttendance = useMemo(() => {
    return RendimientoStore.getAsistencias().some(a => a.fecha === todayDateStr);
  }, [todayDateStr, updateTrigger]);

  const hasTodayWellness = useMemo(() => {
    return RendimientoStore.getWellness().some(w => w.fecha === todayDateStr);
  }, [todayDateStr, updateTrigger]);

  const hasTodayEvaluation = useMemo(() => {
    return RendimientoStore.getResultadosPruebas().some(rp => rp.fecha === todayDateStr);
  }, [todayDateStr, updateTrigger]);

  const [tasks, setTasks] = useState([
    { id: 1, text: "Tomar asistencia", color: "bg-red-500", done: false },
    { id: 2, text: "Registrar evaluación", color: "bg-orange-500", done: false },
    { id: 3, text: "Publicar convocatoria", color: "bg-amber-500", done: false },
    { id: 4, text: "Revisar wellness", color: "bg-blue-500", done: false },
    { id: 5, text: "Confirmar jugadores", color: "bg-emerald-500", done: true },
  ]);

  useEffect(() => {
    setTasks(prev => prev.map(t => {
      if (t.id === 1) return { ...t, done: hasTodayAttendance };
      if (t.id === 2) return { ...t, done: hasTodayEvaluation };
      if (t.id === 4) return { ...t, done: hasTodayWellness };
      return t;
    }));
  }, [hasTodayAttendance, hasTodayEvaluation, hasTodayWellness]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const orgTeams = useMemo(() => RendimientoStore.getEquipos(), [updateTrigger]);
  const todayTeams = useMemo(() => {
    const sessions = RendimientoStore.getSesiones();
    const todayStr = new Date().toISOString().split("T")[0];
    const activeTeamNames = orgTeams.map(e => e.nombre);
    
    // 1. Obtener equipos con sesiones programadas hoy
    const todaySessions = sessions.filter(s => s.fecha === todayStr && activeTeamNames.includes(s.equipo));
    const items = todaySessions.map((session, idx) => {
      const colors = [
        "text-blue-500 bg-blue-500/10 border-blue-500/20",
        "text-purple-500 bg-purple-500/10 border-purple-500/20",
        "text-amber-500 bg-blue-500/10 border-blue-500/20"
      ];
      return {
        id: orgTeams.find(t => t.nombre === session.equipo)?.id,
        title: session.equipo,
        time: session.hora || "3:00 pm",
        type: session.nombre,
        icon: session.tipo === "Partido" || session.tipo === "Competencia" ? Trophy : Dumbbell,
        color: colors[idx % colors.length]
      };
    });

    // 2. Obtener equipos que no tienen sesión creada hoy pero sí tienen registros reales de Asistencia, Wellness o Pruebas
    const activeOrg = RendimientoStore.getActiveOrganizacionId();
    const teamsWithAttendance = RendimientoStore.getAsistencias().filter(a => a.fecha === todayStr).map(a => a.equipo);
    const wellnessJugadorIds = RendimientoStore.getWellness().filter(w => w.fecha === todayStr).map(w => w.jugadorId);
    const testJugadorIds = RendimientoStore.getResultadosPruebas().filter(rp => rp.fecha === todayStr).map(rp => rp.jugadorId);
    
    const players = RendimientoStore.getJugadores();
    const activePlayerIds = new Set([...wellnessJugadorIds, ...testJugadorIds]);
    const teamsWithActivity = players.filter(p => activePlayerIds.has(p.id)).map(p => p.categoria || p.equipo);

    const activeActivityTeams = new Set([...teamsWithAttendance, ...teamsWithActivity]);

    // Agregar a la lista si no estaban ya incluidos por una sesión
    orgTeams.forEach(t => {
      const isAlreadyIn = items.some(it => it.title === t.nombre);
      const hasTodayActivity = activeActivityTeams.has(t.nombre) || activeActivityTeams.has(t.categoria);
      
      if (!isAlreadyIn && hasTodayActivity) {
        items.push({
          id: t.id,
          title: t.nombre,
          time: "Actividad Registrada",
          type: t.categoria || "Plantel",
          icon: Users,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
        });
      }
    });

    return items;
  }, [orgTeams, updateTrigger]);

  const loadData = useMemo(() => RendimientoStore.getPlayerLoadData(), [updateTrigger]);
  const injuries = useMemo(() => RendimientoStore.getLesiones(), [updateTrigger]);
  
  const alerts = useMemo(() => {
    const list: Array<{ name: string; details: string; type: string; icon: any; color: string }> = [];
    
    // Fill with real load risks
    loadData.forEach(d => {
      if (d.semaforo === "rojo") {
        list.push({
          name: d.jugador,
          details: `Llega con fatiga/riesgo alto (ACWR: ${d.acwr.toFixed(2)}).`,
          type: "fatiga",
          icon: AlertTriangle,
          color: "bg-red-500/15 border-red-500/20 text-red-600 dark:text-red-400"
        });
      } else if (d.semaforo === "amarillo") {
        list.push({
          name: d.jugador,
          details: `Sobrecarga moderada detectada.`,
          type: "fatiga",
          icon: AlertTriangle,
          color: "bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400"
        });
      }
    });

    // Fill with active injuries
    injuries.filter(i => !i.completada).forEach(i => {
      const p = RendimientoStore.getJugadores().find(jg => jg.id === i.jugadorId);
      if (p) {
        list.push({
          name: p.nombre,
          details: `Lesión activa (${i.diagnostico || "Seguimiento médico"}).`,
          type: "lesion",
          icon: Activity,
          color: "bg-red-500/15 border-red-500/20 text-red-600 dark:text-red-400"
        });
      }
    });

    return list.slice(0, 5);
  }, [loadData, injuries]);

  const upcomingEvents = useMemo(() => {
    const list = RendimientoStore.getSesiones();
    return list.slice(0, 4).map(s => ({
      title: s.nombre,
      date: s.fecha,
      time: s.hora || "3:00 pm",
      type: (s.tipo || "entrenamiento").toLowerCase(),
      color: s.tipo === "Competencia" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
    }));
  }, [updateTrigger]);

  const aiRecommendations = useMemo(() => {
    const list: Array<{ text: string; subtext: string; icon: string }> = [];

    loadData.forEach(d => {
      if (d.semaforo === "rojo") {
        list.push({
          text: `Descansar a ${d.jugador}`,
          subtext: `Riesgo de lesión crítico (ACWR: ${d.acwr.toFixed(2)}, Fatiga: ${d.fatigaScore}%).`,
          icon: "⚠️"
        });
      } else if (d.semaforo === "amarillo") {
        list.push({
          text: `Reducir intensidad a ${d.jugador}`,
          subtext: `Carga acumulada elevada (ACWR: ${d.acwr.toFixed(2)}).`,
          icon: "🔶"
        });
      }
    });

    const ssData = RendimientoStore.getSportsScoreData();
    ssData.forEach(d => {
      if (d.wellnessScore < 45 && d.estado !== "sin_registro") {
        list.push({
          text: `Monitorear bienestar de ${d.jugador}`,
          subtext: `Wellness reportado muy bajo: ${d.wellnessScore}/100.`,
          icon: "💭"
        });
      }
    });

    return list;
  }, [loadData]);

  if (!mounted) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Cargando tablero...</div>;
  }

  // Calcular convocatorias y lesionados en tiempo real
  const activeInjuriesCount = injuries.filter(i => !i.completada).length;
  const activeConvocatorias = RendimientoStore.get<any[]>("convocatorias_dynamics", convocatorias);

  return (
    <div className="space-y-6">
      {/* Greetings Block */}
      <div className="bg-gradient-primary rounded-3xl p-6 md:p-8 text-primary-foreground shadow-elegant relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_50%)]" />
        <div className="relative z-10 space-y-2">
          <Badge variant="outline" className="border-white/20 bg-white/10 text-white text-[10px] uppercase font-semibold tracking-wider">Portal del Coach</Badge>
          <h1 className="text-3xl font-bold tracking-tight">¡Buenos días, {greetingName}!</h1>
          <p className="text-sm text-primary-foreground/90 max-w-xl">
            Este es tu escritorio de trabajo operativo. {todayTeams.length > 0 ? `Tienes ${todayTeams.length} sesión${todayTeams.length > 1 ? "es" : ""} asignada${todayTeams.length > 1 ? "es" : ""} para hoy` : "No tienes sesiones programadas para hoy"} y {alerts.length > 0 ? `${alerts.length} alerta${alerts.length > 1 ? "s" : ""} que requiere${alerts.length > 1 ? "n" : ""} revisión.` : "ninguna alerta pendiente."}
          </p>
        </div>
      </div>

      {/* Operative Stat Cards Grid (Fusionado del antiguo Panel Coach) */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="bg-card border rounded-2xl p-4 shadow-card hover:shadow-elegant transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Sesiones hoy</span>
            <Dumbbell className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-foreground">{todayTeams.length}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Entrenamientos activos</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 shadow-card hover:shadow-elegant transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Convocatorias</span>
            <Megaphone className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-foreground">{activeConvocatorias.length}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Convocatorias publicadas</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 shadow-card hover:shadow-elegant transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">En Enfermería</span>
            <Activity className="h-4.5 w-4.5 text-red-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-foreground">{activeInjuriesCount}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Lesionados / Restricciones</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 shadow-card hover:shadow-elegant transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Rendimiento</span>
            <Trophy className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-foreground">{(100 - (alerts.length * 10)).toFixed(0)}%</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Score operativo óptimo</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Work Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Equipos de Hoy */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Dumbbell className="h-4.5 w-4.5 text-primary" /> Equipos de hoy
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-bold text-primary hover:text-primary bg-primary/5 hover:bg-primary/10 gap-0.5">
                  <Link to="/equipos">
                    Ir a Mis Equipos <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <CardDescription>Sesiones de entrenamiento y partidos programados para hoy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayTeams.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-2xl bg-muted/5">
                  📅 No hay entrenamientos ni partidos programados para hoy.
                </div>
              ) : (
                todayTeams.map((team, idx) => {
                  const Icon = team.icon || Users;
                  const title = team.title || team.nombre || "Equipo";
                  const type = team.type || team.categoria || "Fútbol";
                  const time = team.time || "Sesión Activa";
                  const color = team.color || "bg-primary/10 text-primary border-primary/20";
                  
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-card hover:bg-muted/30 transition gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{title}</p>
                          <p className="text-xs text-muted-foreground">{type} · {time}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                          <Link to="/coach">Planificar</Link>
                        </Button>
                        <Button size="sm" asChild className="h-8 text-xs bg-gradient-primary">
                          <Link to="/equipos" search={{ teamId: team.id }}>Ver equipo</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Tareas Pendientes */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-primary" /> Tareas pendientes
              </CardTitle>
              <CardDescription>Todo en un solo lugar — Completa tu jornada diaria</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    task.done ? "border-muted-foreground/20 bg-muted/30 opacity-70" : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${task.color}`} />
                    <span className={`text-xs font-medium truncate ${task.done ? "line-through" : ""}`}>{task.text}</span>
                  </div>
                  <div className={`h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                    task.done ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background"
                  }`}>
                    {task.done && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Próximos Eventos */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarClock className="h-4.5 w-4.5 text-primary" /> Próximos eventos
              </CardTitle>
              <CardDescription>Planificación deportiva semanal</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {upcomingEvents.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-xs text-muted-foreground border border-dashed rounded-2xl bg-muted/5">
                  📅 No hay eventos próximos programados.
                </div>
              ) : (
                upcomingEvents.map((evt, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border bg-card hover:bg-muted/20 transition flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg font-semibold text-xs ${evt.color}`}>
                      <span>{evt.date}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-foreground">{evt.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{evt.time} · <span className="capitalize">{evt.type}</span></p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Alerts + Wellness */}
        <div className="space-y-4">
          {/* DeportivOS AI Recomienda Card (Coach) */}
          <Card className="shadow-card border border-violet-500/20 bg-gradient-to-br from-violet-950/15 via-card to-card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Sparkles className="h-10 w-10 text-violet-400" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-400" /> DeportivOS AI recomienda
                </CardTitle>
                <Badge className="bg-violet-500/20 text-violet-300 text-[8px] border-violet-500/30 uppercase font-bold">Activo</Badge>
              </div>
              <CardDescription>Recomendaciones del copiloto para tus equipos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {aiRecommendations.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground text-xs leading-normal">
                  <Sparkles className="h-6 w-6 mx-auto text-violet-400 opacity-60 mb-2" />
                  No hay recomendaciones críticas. Todos los equipos se encuentran en rangos de carga y bienestar estables.
                </div>
              ) : (
                aiRecommendations.slice(0, 4).map((rec, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-violet-500/10 bg-violet-500/5 flex items-start gap-2">
                    <span className="text-xs">{rec.icon}</span>
                    <div>
                      <p className="font-bold text-foreground">{rec.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{rec.subtext}</p>
                    </div>
                  </div>
                ))
              )}
              <Link to="/ia/asistente" className="w-full block">
                <Button variant="ghost" size="sm" className="w-full text-violet-400 hover:text-violet-300 text-xs font-bold gap-1 mt-1 p-0 hover:bg-transparent">
                  Preguntar al Copiloto <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Wellness Equipo */}
          {(() => {
            const ssData = RendimientoStore.getSportsScoreData();
            const cnt = {
              excelente:  ssData.filter(d => d.estado === "excelente").length,
              bueno:      ssData.filter(d => d.estado === "bueno").length,
              precaucion: ssData.filter(d => d.estado === "precaución").length,
              riesgo:     ssData.filter(d => d.estado === "riesgo").length,
            };
            const avg = ssData.length ? Math.round(ssData.reduce((a,d) => a + d.wellnessScore, 0) / ssData.length) : 0;
            return (
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <HeartPulse className="h-4 w-4 text-emerald-500" /> Wellness Equipo
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">{avg}/100</Badge>
                  </div>
                  <CardDescription>Estado de bienestar de los atletas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "Excelente",  count: cnt.excelente,  color: "bg-emerald-500", text: "text-emerald-600", emoji: "🟢" },
                    { label: "Bueno",      count: cnt.bueno,      color: "bg-sky-500",     text: "text-sky-600",     emoji: "🔵" },
                    { label: "Precaución", count: cnt.precaucion, color: "bg-amber-500",   text: "text-amber-600",   emoji: "🟡" },
                    { label: "Riesgo",     count: cnt.riesgo,     color: "bg-red-500",     text: "text-red-600",     emoji: "🔴" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between rounded-xl border p-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                        <span className="text-xs font-medium">{s.emoji} {s.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${s.text}`}>{s.count}</span>
                    </div>
                  ))}
                  <Link to="/rendimiento/sports-science">
                    <Button variant="outline" size="sm" className="w-full mt-1 text-xs gap-1">
                      <Activity className="h-3.5 w-3.5" /> Ver Sports Science
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })()}

          {/* Riesgo del Equipo Card */}
          {(() => {
            const loadData = RendimientoStore.getPlayerLoadData();
            const cnt = {
              verde:    loadData.filter(d => d.semaforo === "verde").length,
              amarillo: loadData.filter(d => d.semaforo === "amarillo").length,
              rojo:     loadData.filter(d => d.semaforo === "rojo").length,
            };
            // Ordenar por severidad y fatiga descendente para el ranking de mayor riesgo
            const ranking = [...loadData]
              .sort((a, b) => {
                const map = { rojo: 3, amarillo: 2, verde: 1 };
                if (map[a.semaforo] !== map[b.semaforo]) {
                  return map[b.semaforo] - map[a.semaforo];
                }
                return b.fatigaScore - a.fatigaScore;
              })
              .slice(0, 3);

            return (
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-500 animate-pulse" /> Riesgo del Equipo
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">Cargas & Lesiones</Badge>
                  </div>
                  <CardDescription>Semáforo de riesgo de lesiones y sobrecarga</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Semáforo Counters */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2 dark:border-emerald-800/30 dark:bg-emerald-950/10">
                      <p className="text-base font-black text-emerald-600">🟢 {cnt.verde}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Óptimo</p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-2 dark:border-amber-800/30 dark:bg-amber-950/10">
                      <p className="text-base font-black text-amber-600">🟡 {cnt.amarillo}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Precaución</p>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50/50 p-2 dark:border-red-800/30 dark:bg-red-950/10">
                      <p className="text-base font-black text-red-600">🔴 {cnt.rojo}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Riesgo</p>
                    </div>
                  </div>

                  {/* Ranking */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Ranking de Mayor Riesgo</p>
                    <div className="space-y-1.5">
                      {ranking.filter(r => r.semaforo === "rojo" || r.semaforo === "amarillo").length === 0 ? (
                        <div className="text-center py-4 text-[11px] text-muted-foreground border border-dashed rounded-xl bg-muted/5">
                          🟢 No hay atletas con alertas de sobrecarga o fatiga activa.
                        </div>
                      ) : (
                        ranking.filter(r => r.semaforo === "rojo" || r.semaforo === "amarillo").map((r) => {
                          return (
                            <Link key={r.jugadorId} to="/jugadores/$id" params={{ id: r.jugadorId }} className="flex items-center justify-between rounded-xl border p-2 hover:bg-muted/50 transition gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <img src={r.avatar} alt="" className="h-6 w-6 rounded-full" />
                                <span className="text-xs font-semibold truncate">{r.jugador}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-muted-foreground">Fatiga: {r.fatigaScore}%</span>
                                <span className="text-xs">{r.semaforo === "rojo" ? "🔴" : r.semaforo === "amarillo" ? "🟡" : "🟢"}</span>
                              </div>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          <Card className="shadow-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-primary" /> Alertas del equipo
                </CardTitle>
                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">IA Activa</Badge>
              </div>
              <CardDescription>Eventos médicos, físicos o de inactividad que requieren acción</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert, idx) => {
                const AlertIcon = alert.icon;
                return (
                  <Link
                    key={idx}
                    to={alert.type === "lesion" || alert.type === "medica" ? "/rendimiento/lesiones" : alert.type === "abandono" ? "/ia/riesgos" : "/asistencia"}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 hover:-translate-y-0.5 transition-all cursor-pointer ${alert.color}`}
                  >
                    <AlertIcon className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 leading-normal">
                      <p className="text-xs font-bold">{alert.name}</p>
                      <p className="text-[11px] opacity-90 mt-0.5">{alert.details}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-40 self-center" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ParentDashboard() {
  const [convocatoriaStatus, setConvocatoriaStatus] = useState<"pendiente" | "confirmado" | "declinado">("pendiente");

  const authEmail = typeof window !== "undefined" ? localStorage.getItem("auth_email") : null;
  const systemUsers = RendimientoStore.getUsuarios();
  
  // Find current user object
  const currentUser = systemUsers.find(
    (u) => u.email.toLowerCase() === (authEmail || "").toLowerCase()
  );
  
  const parentName = currentUser?.nombre || "Encargado";
  
  // Find associated players in the store
  const players = RendimientoStore.getJugadores();
  const myChildren = players.filter(
    (p) => p.correoEncargado && p.correoEncargado.toLowerCase() === (authEmail || "").toLowerCase()
  );

  const hasChildren = myChildren.length > 0;
  const activeChild = hasChildren ? myChildren[0] : null;

  const handleConfirm = (status: "confirmado" | "declinado") => {
    setConvocatoriaStatus(status);
    toast.success(status === "confirmado" ? "Convocatoria confirmada. ¡A darlo todo!" : "Convocatoria declinada.");
  };

  if (!hasChildren) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-gradient-primary rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-elegant">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative z-10 space-y-2">
            <Badge className="bg-white/20 text-white border-none hover:bg-white/20">Portal de Encargados</Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">¡Hola, {parentName}!</h1>
            <p className="text-sm opacity-90 max-w-xl">
              Bienvenido a tu portal de control operativo en Élite Sports.
            </p>
          </div>
        </div>

        <Card className="border-amber-500/20 bg-amber-500/5 shadow-elegant p-8 text-center max-w-2xl mx-auto my-12">
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-extrabold text-foreground">Cuenta en espera de vinculación</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu cuenta de encargado se registró correctamente, pero tu dirección de correo (<strong>{authEmail}</strong>) o cédula no están asociadas a la ficha de ningún atleta registrado en la academia.
            </p>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed border-t pt-4">
              Para visualizar la ficha de rendimiento, asistencia y estado financiero de tus hijos, por favor solicita al personal administrativo de tu sede que vincule tu correo o número de identificación en la ficha de inscripción del jugador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // TS assurance
  if (!activeChild) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-primary rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-elegant">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="relative z-10 space-y-2">
          <Badge className="bg-white/20 text-white border-none hover:bg-white/20">Portal de Encargados</Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">¡Hola, {parentName}!</h1>
          <p className="text-sm opacity-90 max-w-xl">
            Aquí tienes el resumen operativo diario de tu hijo/a, <strong>{activeChild.nombre}</strong> (Equipo: {activeChild.categoria || "Fútbol Base"}, {activeChild.sede || "Sede Central"}).
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Daily Schedule & Next Match */}
        <div className="space-y-6 md:col-span-2">
          {/* Question 1: ¿Mi hijo tiene entrenamiento hoy? */}
          <Card className="shadow-card border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" /> ¿Tiene entrenamiento hoy?
              </CardTitle>
              <CardDescription>Horario e instalación para el entrenamiento de {activeChild.nombre.split(" ")[0]}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground">Entrenamiento Técnico-Táctico</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{activeChild.sede || "Sede Central"} · Cancha Principal de Césped Natural</p>
                  <p className="text-sm font-semibold text-primary mt-2">Hoy · 5:30 PM a 7:00 PM</p>
                </div>
                <Badge variant="success">Programado</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Question 6: ¿Cuál es el próximo partido o torneo? */}
          <Card className="shadow-card border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Próximo Partido & Convocatoria
              </CardTitle>
              <CardDescription>Siguiente encuentro oficial y estado de confirmación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3 mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Élite Sub-12 A vs Liga Deportiva Alajuelense</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Sábado 15 de Julio · 9:00 AM · Estadio Alejandro Morera Soto</p>
                  </div>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-500 font-bold text-[10px]">Copa Oro FPD</Badge>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Estado de Convocatoria:</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {convocatoriaStatus === "pendiente" && "⏳ Pendiente de Confirmar"}
                      {convocatoriaStatus === "confirmado" && "✅ Asistencia Confirmada"}
                      {convocatoriaStatus === "declinado" && "❌ Declinado"}
                    </p>
                  </div>
                  
                  {convocatoriaStatus === "pendiente" ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleConfirm("declinado")} className="text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive/5">Declinar</Button>
                      <Button size="sm" onClick={() => handleConfirm("confirmado")} className="bg-gradient-primary shadow-elegant text-xs h-8">Confirmar Asistencia</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setConvocatoriaStatus("pendiente")} className="text-xs text-muted-foreground h-8">Cambiar respuesta</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question 4: ¿Hay algún mensaje del entrenador? */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" /> Diario de Rendimiento (Feedback del Entrenador)
              </CardTitle>
              <CardDescription>Comentario del Coach Carlos Méndez sobre la evolución de {activeChild.nombre.split(" ")[0]}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-2xl bg-primary/[0.02] border border-primary/10 space-y-3">
                <p className="text-sm italic text-foreground/90">
                  "Excelente desempeño y actitud de {activeChild.nombre.split(" ")[0]} en las sesiones de esta semana. Se le nota muy enfocado en perfeccionar el control orientado y la colocación en tiros de media distancia. ¡Felicidades!"
                </p>
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" />
                    <AvatarFallback>CM</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-muted-foreground">Carlos Méndez · DT Principal {activeChild.categoria || "Sub-10"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Status Cards (Payments, Attendance, Documents) */}
        <div className="space-y-6">
          {/* Question 3: ¿Está al día con los pagos? */}
          <Card className="shadow-card border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Wallet className="h-4.5 w-4.5 text-emerald-500" /> Estado de Cuenta y Mensualidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center bg-emerald-500/[0.02] p-3 border border-emerald-500/10 rounded-xl">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Estado Financiero</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Al día (Saldo ₡0)</p>
                </div>
                <Badge variant="success" className="bg-emerald-500/10 text-emerald-500">Julio pago</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">La próxima facturación se generará el 01 de Agosto.</p>
            </CardContent>
          </Card>

          {/* Question 2: ¿Cómo va su asistencia? */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ClipboardCheck className="h-4.5 w-4.5 text-primary" /> Control de Asistencia Semanal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Asistencia General</span>
                  <span className="font-bold text-foreground">94.2%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary rounded-full" style={{ width: "94.2%" }} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                <div className="bg-success/10 text-success p-1 rounded font-bold">16 Presente</div>
                <div className="bg-warning/15 text-warning p-1 rounded font-bold">1 Tardío</div>
                <div className="bg-destructive/10 text-destructive p-1 rounded font-bold">0 Ausente</div>
                <div className="bg-blue-500/10 text-blue-500 p-1 rounded font-bold">1 Justificado</div>
              </div>
            </CardContent>
          </Card>

          {/* Question 5: ¿Necesito firmar o subir algún documento? */}
          <Card className="shadow-card border-l-4 border-l-rose-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" /> Documentación & Pólizas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-rose-500/[0.02] border border-rose-500/10 rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Póliza INS Deportiva 2026</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">El documento actual expira en 5 días.</p>
                  </div>
                </div>
                <Button size="xs" className="w-full bg-rose-500 text-white hover:bg-rose-600 text-[10px] h-7 shadow-elegant">
                  Subir documento renovado
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
