import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/stat-card";
import {
  CalendarClock, Bell, TrendingUp, Brain, AlertTriangle, Plus, CheckCircle2, ChevronRight, Check, Trophy, Wallet, ClipboardCheck, Calendar, Megaphone,
  AlertCircle, FileWarning, Dumbbell, Swords, Stethoscope, Star, UserPlus, Users, ShieldHalf, Activity, Sparkles, ArrowRight, HeartPulse, ShieldAlert, PackageX,
  ExternalLink, Trash2, X, Zap, Film, CheckSquare, FileText, Eye, MapPin, Clock, ClipboardList, Play,
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
import { AcademyHeaderBanner } from "@/components/AcademyHeaderBanner";

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
    <Link to={to} className="group rounded-[12px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotColor[prio]}`} />
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-all" />
      </div>
      <p className="mt-3 text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">{count}</p>
      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{label}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
    </Link>
  );
}

function Dashboard() {
  const { role, coachName } = useRole();
  const greetingName = role === "admin" ? "Administrador" : role === "coach" ? (coachName ? coachName.split(" ")[0] : "Entrenador") : "Manuel";

  // ─── ALL HOOKS MUST COME BEFORE ANY CONDITIONAL RETURN ───
  const [showWizard, setShowWizard] = useState(true);

  // ─── LIMPIEZA AUTOMÁTICA DE CLAVES LOCALES OBSOLETAS ───
  useEffect(() => {
    if (typeof window !== "undefined") {
      const legacyKeys = [
        "jugadores_dynamics", "entrenadores_dynamics", "equipos_dynamics", 
        "categorias_dynamics", "pagos_dynamics", "sedes_dynamics", "lesiones"
      ];
      legacyKeys.forEach(k => {
        localStorage.removeItem(`deportivos_hp_${k}`);
      });
      localStorage.removeItem("deportivos_cloud_migrated");
    }
  }, []);
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
    (s: number, c: any) => s + c.jugadores.filter((j: any) => j.estado === "pendiente").length, 0);
  const partidosProg = matches.filter((m) => m.estado !== "jugado").slice(0, 6);
  const lesionesActivas = injuryRecords.filter((i) => i.estado === "activa");
  const evaluacionesPend = quickEvaluations.slice(0, 5);
  const inscripciones = crmLeads.filter((l: any) => l.stage === "prueba" || (l as any).stage === "aprobado" || (l as any).stage === "inscrito").slice(0, 6);
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
    { icon: Wallet, actor: "Juan Pérez", text: "realizó un pago de", highlight: "₡45 000", tiempo: "hace 5 min", color: "text-emerald-500" },
    { icon: AlertCircle, actor: "María Gómez", text: "faltó al entrenamiento", highlight: "Sub-18", tiempo: "hace 20 min", color: "text-red-500" },
    { icon: FileWarning, actor: "Carlos Rojas", text: "subió un certificado médico", highlight: "Válido", tiempo: "hace 45 min", color: "text-sky-500" },
    { icon: Star, actor: "Diego Soto", text: "registró una evaluación técnica", highlight: "9.2/10", tiempo: "hace 1 h", color: "text-amber-500" },
    { icon: Megaphone, actor: "Nueva convocatoria", text: "publicada —", highlight: "Sub-16", tiempo: "hace 1 h", color: "text-primary" },
    { icon: UserPlus, actor: "Nuevo jugador:", text: "inscrito oficialmente", highlight: "Antonella Núñez", tiempo: "hace 2 h", color: "text-emerald-500" },
    { icon: Stethoscope, actor: "Lesión registrada:", text: "esguince leve —", highlight: "Sub-14", tiempo: "hace 3 h", color: "text-red-500" },
    { icon: Wallet, actor: "Arreglo de pago:", text: "aprobado para mensualidad", highlight: "Sub-12", tiempo: "hace 4 h", color: "text-sky-500" },
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
    const prospectos = crmLeads.filter((l: any) => l.stage === "nuevo" || l.stage === "contactado").length;
    const pruebas = crmLeads.filter((l: any) => l.stage === "prueba").length;
    const inscritos = crmLeads.filter((l: any) => l.stage === "aprobado" || l.stage === "inscrito").length;
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
      {/* Banner Destacado de la Academia Activa */}
      <AcademyHeaderBanner 
        badgeText="ACADEMIA ACTIVA"
        subtitle="PANEL DE GESTIÓN EMPRESARIAL & ALTO RENDIMIENTO MULTIDEPORTIVO"
      />

      {/* Row 1: Glassmorphic Executive Command Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20 shrink-0">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Centro de Operaciones Enterprise
              </h2>
              <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-bold uppercase tracking-wider">
                Executive UI 2.0
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Visión 360° de la academia: IA, Finanzas, Deporte, Staff y Operaciones Diarias.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <Button variant="outline" className="btn-secondary h-9 text-xs">
            <Bell className="h-3.5 w-3.5 mr-1" /> Alertas
          </Button>
          <Button className="btn-primary h-9 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo Jugador
          </Button>
        </div>
      </div>



      {showWizard && !wizardCompleted && (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-bold text-[10px] uppercase tracking-wider">
                    Asistente de Configuración
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-medium">Tus primeros pasos en DeportivOS</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  ¡Te damos la bienvenida a {activeOrg?.nombre || "tu nueva academia"}!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Completa las siguientes tareas esenciales para habilitar todas las herramientas operativas de rendimiento, finanzas y entrenamientos de tu academia.
                </p>
                
                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-500">Progreso de la configuración</span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold">{progressPercent}% completado</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
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
                      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100" 
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                    hasLogo ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}>
                    {hasLogo ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">1</span>}
                  </div>
                  <div className="flex-1 truncate">
                    <p className={hasLogo ? "line-through opacity-70" : ""}>Sube el Logo del Club</p>
                    <span className="text-[9px] text-slate-400 font-normal">Ajustes generales</span>
                  </div>
                </Link>

                <Link 
                  to="/entrenadores" 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs font-semibold ${
                    hasCoaches 
                      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100" 
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                    hasCoaches ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}>
                    {hasCoaches ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">2</span>}
                  </div>
                  <div className="flex-1 truncate">
                    <p className={hasCoaches ? "line-through opacity-70" : ""}>Registra un Coach</p>
                    <span className="text-[9px] text-slate-400 font-normal">Cuerpo técnico</span>
                  </div>
                </Link>

                <Link 
                  to="/equipos" 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs font-semibold ${
                    hasTeams 
                      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100" 
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                    hasTeams ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}>
                    {hasTeams ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">3</span>}
                  </div>
                  <div className="flex-1 truncate">
                    <p className={hasTeams ? "line-through opacity-70" : ""}>Crea un Equipo</p>
                    <span className="text-[9px] text-slate-400 font-normal">Operación deportiva</span>
                  </div>
                </Link>

                <Link 
                  to="/jugadores" 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-xs font-semibold ${
                    hasPlayers 
                      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100" 
                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${
                    hasPlayers ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}>
                    {hasPlayers ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">4</span>}
                  </div>
                  <div className="flex-1 truncate">
                    <p className={hasPlayers ? "line-through opacity-70" : ""}>Inscribe un Atleta</p>
                    <span className="text-[9px] text-slate-400 font-normal">Roster del club</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Close button */}
            <button 
              onClick={() => setShowWizard(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 transition"
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
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">🤖</span>
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Alertas IA / Insights del Club
            </h2>
            <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold">Proactivo</Badge>
          </div>
          <Link to="/ia/asistente" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
            Abrir DeportivOS AI Copilot <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        
        <div className="grid gap-3 md:grid-cols-3">
          {/* Tarjeta 1: Copilot Status Monocromático */}
          <Card className="p-4 shadow-sm border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[12px] flex flex-col justify-between col-span-1">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-bold text-[9px] uppercase tracking-wider">
                  Copilot Enterprise
                </Badge>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Diagnóstico Automático Hoy</p>
              <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" /> Riesgos
                  </div>
                  <span className="font-bold text-lg text-slate-900 dark:text-slate-100 mt-1 block">{alertasIA.length}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" /> Sugerencias
                  </div>
                  <span className="font-bold text-lg text-slate-900 dark:text-slate-100 mt-1 block">7</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" /> Fugas CRM
                  </div>
                  <span className="font-bold text-lg text-slate-900 dark:text-slate-100 mt-1 block">{aiRiskScores.filter(r => r.nivelAbandono === "critico").length || 2}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" /> Prioridad
                  </div>
                  <span className="font-bold text-lg text-slate-900 dark:text-slate-100 mt-1 block">1</span>
                </div>
              </div>
            </div>
            <Link to="/ia/asistente" className="w-full mt-2">
              <Button size="sm" className="w-full btn-primary gap-1.5">
                <Brain className="h-3.5 w-3.5" /> Consultar Asistente IA <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </Card>

          {/* Tarjeta 2: Panel de Detecciones Monocromático con Dots */}
          <Card className="p-4 shadow-sm border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[12px] col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-500" /> Detecciones Prioritarias de Negocio & Deporte
              </p>
              <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">Base de Datos</Badge>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              <div className="flex items-center justify-between py-2.5 px-1 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">Finanzas / Morosidad:</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 font-semibold text-xs shrink-0">{morosidadPorCat}</span>
              </div>

              <div className="flex items-center justify-between py-2.5 px-1 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">Carga Física / Riesgo:</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 font-semibold text-xs shrink-0">{riesgoLesionDet}</span>
              </div>

              <div className="flex items-center justify-between py-2.5 px-1 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                  <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">CRM / Retención:</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 font-semibold text-xs shrink-0">{desercionDet}</span>
              </div>

              <div className="flex items-center justify-between py-2.5 px-1 bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">Performance Destacado:</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 font-semibold text-xs shrink-0">{destacadosDet}</span>
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
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">📊</span>
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Resumen Ejecutivo · KPIs Macro del Club
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Finanzas · Deporte · Staff & Metodología</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {/* Card 1: Equipos Activos */}
          <Link to="/equipos" className="group">
            <Card className="p-4 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between hover:border-primary/50 transition">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Equipos Registrados</p>
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-2xl font-bold my-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">{RendimientoStore.getEquipos().length}</p>
              </div>
              <p className="text-[11px] font-semibold text-primary group-hover:underline flex items-center gap-1 mt-1">
                Ver Equipos <ArrowRight className="h-3 w-3" />
              </p>
            </Card>
          </Link>

          {/* Card 2: Categorías de la Academia */}
          <Link to="/categorias" className="group">
            <Card className="p-4 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between hover:border-primary/50 transition">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Categorías Activas</p>
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold my-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">{RendimientoStore.getCategorias().length}</p>
              </div>
              <p className="text-[11px] font-semibold text-primary group-hover:underline flex items-center gap-1 mt-1">
                Ver Estructura <ArrowRight className="h-3 w-3" />
              </p>
            </Card>
          </Link>

          {/* Card 3: Financiero */}
          <Card className="p-4 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Facturado Mes</p>
                <Badge variant="outline" className="text-[9px] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-semibold px-1.5 py-0">CRC</Badge>
              </div>
              <p className="text-xl font-bold my-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">{formatCRC(ingresosMes)}</p>
            </div>
            <p className="text-[11px] font-normal text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{morosos.length} deudores</span>
            </p>
          </Card>

          {/* Card 4: Deportivo */}
          <Card className="p-4 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Asistencia Gral</p>
                <Badge variant="outline" className="text-[9px] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-semibold px-1.5 py-0">Semanal</Badge>
              </div>
              <p className="text-xl font-bold my-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">{asistenciaProm}%</p>
            </div>
            <p className="text-[11px] font-normal text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{sportsScienceAdminStats.lesionesActivasCount} lesiones</span>
            </p>
          </Card>

          {/* Card 5: Staff & Metodología */}
          <Card className="p-4 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Staff Metodología</p>
                <Badge variant="outline" className="text-[9px] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-semibold px-1.5 py-0">Aprobado</Badge>
              </div>
              <p className="text-xl font-bold my-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">92%</p>
            </div>
            <p className="text-[11px] font-normal text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{trainingSessions.length} sesiones</span>
            </p>
          </Card>

          {/* Card 6: Sports Science & Cargas */}
          <Card className="p-4 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Sports Science</p>
                <Badge variant="outline" className="text-[9px] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-semibold px-1.5 py-0">ACWR</Badge>
              </div>
              <p className="text-xl font-bold my-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">{sportsScienceAdminStats.avgAcwr.toFixed(2)}</p>
            </div>
            <p className="text-[11px] font-normal text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">{sportsScienceAdminStats.jugadoresEnRiesgo} en riesgo</span>
            </p>
          </Card>
        </div>
      </section>

      {/* ================================================================================= */}
      {/* [NIVEL 3] PANEL DIVIDIDO DE OPERACIÓN DIARIA (Actividad + Agenda & Atención 👥📅)  */}
      {/* ================================================================================= */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bloque Inferior Izquierdo: Actividad Reciente */}
        <Card className="lg:col-span-2 shadow-sm border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[12px]">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Activity className="h-4 w-4 text-primary" /> Actividad Reciente (Feed Transversal)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Eventos en tiempo real: Finanzas, Operaciones, Médica y Técnica</CardDescription>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold tracking-tight">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> En Vivo
            </span>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            {actividad.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {actividad.map((a, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150 cursor-pointer">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      <a.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {a.actor && <span className="font-bold text-slate-900 dark:text-slate-100 mr-1">{a.actor}</span>}
                        {a.text && <span className="mr-1">{a.text}</span>}
                        {a.highlight && <span className="font-bold text-slate-900 dark:text-slate-100">{a.highlight}</span>}
                      </p>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-semibold shrink-0 border border-slate-200/60 dark:border-slate-700/60">{a.tiempo}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No hay actividad reciente registrada.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloque Inferior Derecho: Agenda del Día & Centro de Atención Dinámico */}
        <Card className="shadow-sm border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[12px] flex flex-col justify-between">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Calendar className="h-4 w-4 text-primary" /> Agenda del Día & Atención
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Horarios de canchas y tareas requeridas</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex flex-col justify-between h-full">
            {/* Ocupación de Canchas Dinámica con Estructura de KPI Macro */}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Ocupación de Canchas Hoy</p>
                <Badge variant="outline" className="text-[10px] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-semibold px-2 py-0">En Tiempo Real</Badge>
              </div>
              <div className="flex items-baseline gap-2 my-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono tracking-tight">{ocupacionCanchasHoy.length}</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {ocupacionCanchasHoy.length > 0 
                    ? `Próxima reserva a las ${ocupacionCanchasHoy[0].hora}` 
                    : "reservas activas hoy"}
                </span>
              </div>

              {ocupacionCanchasHoy.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs mt-2">
                  {ocupacionCanchasHoy.map((oc) => (
                    <div key={oc.id} className="py-2 flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">{oc.sede} · {oc.cancha}</span>
                        <p className="text-[11px] text-slate-500 truncate">{oc.hora} • {oc.equipo}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-semibold shrink-0 border border-slate-200/60 dark:border-slate-700/60">{oc.estado}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">Sin reservas activas registradas para el día de hoy.</p>
              )}
            </div>

            {/* Línea Divisoria Horizontal Ultra Sutil (#E2E8F0) */}
            <div className="border-t border-slate-100 dark:border-slate-800 my-4" />

            {/* Centro de Atención & Tareas Pendientes Dinámicas */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" /> Tareas & Aprobaciones Pendientes
              </p>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <Link to="/rendimiento/planificacion" className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium truncate">
                      <span className="font-bold text-slate-900 dark:text-slate-100 mr-1">3</span> planificaciones por aprobar
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </Link>

                <Link to="/retencion" className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium truncate">
                      <span className="font-bold text-slate-900 dark:text-slate-100 mr-1">{aiRiskScores.filter(r => r.nivelAbandono === "critico" || r.nivelAbandono === "alto").length}</span> alumnos en riesgo de abandono
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </Link>

                <Link to="/convocatorias" className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium truncate">
                      <span className="font-bold text-slate-900 dark:text-slate-100 mr-1">{convocatoriasPend}</span> convocatorias por confirmar
                    </p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
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
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">📈</span>
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Estado de Crecimiento del Club & Embudo CRM
            </h2>
          </div>
          <Link to="/crm" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
            Gestionar Leads en CRM →
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Panel Embudo CRM Dinámico Monocromático con Barras por Temperatura de Etapa */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Conversión de Leads en CRM
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">Captación de alumnos y matrículas activas</CardDescription>
              </div>
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-semibold text-[10px]">
                CRM Activo
              </Badge>
            </div>

            <div className="space-y-3.5 my-2">
              {/* Etapa 1: Base fría / Prospectos (Entrada masiva de arriba) */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">1. Prospectos / Leads recibidos</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{crmStats.prospectos} prospectos</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 dark:bg-slate-500 rounded-full transition-all duration-500" style={{ width: "100%" }} />
                </div>
              </div>

              {/* Etapa 2: En proceso / En prueba (Intermedio) */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">2. En Clase de Prueba / Evaluación</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{crmStats.pruebas} atletas ({crmStats.percentPruebas}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${crmStats.percentPruebas}%` }} />
                </div>
              </div>

              {/* Etapa 3: Éxito / Cierre ganado (Abajo) */}
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">3. Inscritos Formalmente</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{crmStats.inscritos} nuevos jugadores ({crmStats.percentInscritos}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${crmStats.percentInscritos}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Roster de la academia:</span>
              <Link to="/jugadores" className="text-primary font-semibold hover:underline">Ver Atletas ({currentPlayers.length}) →</Link>
            </div>
          </Card>

          {/* Panel Próximos Eventos y Partidos Monocromático */}
          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" /> Próximos Eventos & Partidos Destacados
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">Calendario institucional del club</CardDescription>
              </div>
              <Link to="/partidos" className="text-xs text-primary hover:underline font-semibold">Ver agenda</Link>
            </div>

            <div className="space-y-2">
              {proximos.slice(0, 4).map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
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

  // --- DATE PICKER & COACH OS STATE ---
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  const orgTeams = useMemo(() => RendimientoStore.getEquipos(), [updateTrigger]);

  const myTeams = useMemo(() => {
    if (!greetingName) return orgTeams;
    const matchCoach = orgTeams.filter(t => (t.entrenador || "").toLowerCase().includes(greetingName.toLowerCase()));
    return matchCoach.length > 0 ? matchCoach : orgTeams;
  }, [orgTeams, greetingName]);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (myTeams.length > 0 && (!selectedTeamId || !myTeams.some(t => t.id === selectedTeamId))) {
      setSelectedTeamId(myTeams[0].id);
    }
  }, [myTeams]);

  const activeTeam = useMemo(() => {
    return myTeams.find(t => t.id === selectedTeamId) || myTeams[0];
  }, [myTeams, selectedTeamId]);

  const navigate = useNavigate();

  const playersForTeam = (team: any) => {
    const all = RendimientoStore.getJugadores();
    if (!team) return all;
    const safeLower = (v: unknown): string => String(v ?? "").trim().toLowerCase();
    const normCat = (v: unknown): string => {
      const s = safeLower(v);
      const m = s.match(/(?:sub[-_\s]?|u)(\d+)/);
      return m ? `u${m[1]}` : s;
    };
    const catNorm = normCat(team.categoria || team.nombre);
    const teamNameNorm = safeLower(team.nombre || "");

    const matched = all.filter(p => {
      const pCatNorm = normCat(p.categoria || (p as any).equipo || "");
      const pTeamNorm = safeLower((p as any).equipo || p.categoria || "");
      return pCatNorm === catNorm || pTeamNorm.includes(teamNameNorm) || teamNameNorm.includes(pTeamNorm);
    });

    return matched.length > 0 ? matched : all.slice(0, 15);
  };

  const todayMatch = useMemo(() => {
    const matches = RendimientoStore.getPartidos();
    return matches.find(m => m.fecha === selectedDate && (!activeTeam || m.equipo === activeTeam.nombre || (m as any).categoria === activeTeam.categoria));
  }, [selectedDate, activeTeam, updateTrigger]);

  const todaySession = useMemo(() => {
    const sesiones = RendimientoStore.getSesiones();
    return sesiones.find(s => s.fecha === selectedDate && (!activeTeam || s.equipo === activeTeam.nombre));
  }, [selectedDate, activeTeam, updateTrigger]);

  const isSessionCompleted = useMemo(() => {
    if (todaySession && (todaySession as any).asistenciaCompletada) return true;
    const asistencias = RendimientoStore.getAsistencias();
    const todayStr = new Date().toISOString().split("T")[0];
    const hasAttendance = asistencias.some(a => {
      const matchDate = a.fecha === selectedDate || a.fecha === todayStr;
      const matchTeam = !activeTeam || a.equipo === activeTeam.nombre || a.equipo === activeTeam.categoria;
      return matchDate && matchTeam;
    });
    if (hasAttendance) return true;

    if (typeof window !== "undefined" && activeTeam) {
      const localKey = `completed_session_${selectedDate}_${activeTeam.id}`;
      if (localStorage.getItem(localKey) === "true") return true;
    }
    return false;
  }, [todaySession, selectedDate, activeTeam, updateTrigger]);

  const academyAgendaGeneral = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const storeSesiones = RendimientoStore.getSesiones();
    const storePartidos = RendimientoStore.getPartidos();
    const coachTeamNames = new Set(myTeams.map(t => (t.nombre || "").toLowerCase()));

    // 1. Map real sessions across all teams in academy
    const sessionsList = storeSesiones.filter(s => s.fecha && s.fecha >= todayStr).map(s => ({
      id: s.id,
      nombre: s.nombre || `Entrenamiento ${s.equipo || ""}`,
      categoria: s.equipo || s.categoria || "General",
      entrenador: s.entrenador || greetingName || "Staff Técnico",
      hora: s.hora || "16:00",
      fecha: s.fecha,
      cancha: s.lugar || s.cancha || "Cancha Principal",
      tipo: "Entrenamiento",
      isMyTeam: (s.equipo && coachTeamNames.has(s.equipo.toLowerCase())) || (activeTeam && s.equipo === activeTeam.nombre),
    }));

    // 2. Map real matches across all teams in academy
    const matchesList = storePartidos.filter(p => p.fecha && p.fecha >= todayStr).map(p => ({
      id: p.id,
      nombre: `Partido vs ${p.rival || p.visitante || "Rival FC"}`,
      categoria: p.categoria || p.equipo || "Competencia",
      entrenador: p.entrenador || "Staff Técnico",
      hora: p.hora || "10:00 AM",
      fecha: p.fecha,
      cancha: p.sede || p.estadio || p.cancha || "Cancha Principal",
      tipo: "Partido",
      isMyTeam: (p.equipo && coachTeamNames.has(p.equipo.toLowerCase())) || (p.local && coachTeamNames.has(p.local.toLowerCase())),
    }));

    let allAcademyEvents = [...sessionsList, ...matchesList];

    // If fewer than 4 events, generate comprehensive academy schedule covering all org teams & coaches
    if (allAcademyEvents.length < 4) {
      const coachesList = ["Carlos Araya", "Manuel Solís", "Roberto Gómez", "Esteban Ramírez"];
      const canchasList = ["Cancha Principal", "Cancha 2 (Sintética)", "Cancha 3 (Fut 7)", "Estadio Central"];

      orgTeams.forEach((t, idx) => {
        const d = new Date(today);
        d.setDate(d.getDate() + (idx % 3));
        const dateStr = d.toISOString().split("T")[0];
        const isMatch = idx === 2;

        allAcademyEvents.push({
          id: `acad_gen_${idx}_${dateStr}`,
          nombre: isMatch ? `Partido Oficial vs Deportivo San José` : `Entrenamiento Táctico ${t.categoria || t.nombre}`,
          categoria: t.categoria || t.nombre,
          entrenador: t.entrenador || coachesList[idx % coachesList.length],
          hora: idx === 0 ? "16:00" : idx === 1 ? "17:30" : idx === 2 ? "10:00 AM" : "19:00",
          fecha: dateStr,
          cancha: canchasList[idx % canchasList.length],
          tipo: isMatch ? "Partido" : "Entrenamiento",
          isMyTeam: myTeams.some(mt => mt.id === t.id),
        });
      });
    }

    // Sort chronologically by date and time
    allAcademyEvents.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

    // Deduplicate
    const seen = new Set();
    return allAcademyEvents.filter(ev => {
      const key = `${ev.fecha}_${ev.categoria}_${ev.nombre}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
  }, [orgTeams, myTeams, activeTeam, greetingName, updateTrigger]);

  const overduePlayers = useMemo(() => {
    const players = RendimientoStore.getJugadores();
    const payments = RendimientoStore.getPagos();
    const overdueMap: Record<string, number> = {};
    payments.filter(p => p.estado === "pendiente" || p.estado === "atrasado").forEach(p => {
      overdueMap[p.jugadorId] = (overdueMap[p.jugadorId] || 0) + (p.monto || 15000);
    });
    return players
      .filter(p => overdueMap[p.id])
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        nombre: p.nombre,
        encargado: p.encargadoNombre || "Encargado",
        telefono: (p as any).encargadoTelefono || "88888888",
        saldo: overdueMap[p.id] || 25000,
      }));
  }, [updateTrigger]);

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

  const defaultCoachTasks = [
    { id: 1, text: "Tomar asistencia", color: "bg-red-500", done: false, url: "/asistencia", isCustom: false },
    { id: 2, text: "Registrar evaluación", color: "bg-orange-500", done: false, url: "/evaluaciones", isCustom: false },
    { id: 3, text: "Publicar convocatoria", color: "bg-amber-500", done: false, url: "/convocatorias", isCustom: false },
    { id: 4, text: "Revisar wellness", color: "bg-blue-500", done: false, url: "/rendimiento/wellness", isCustom: false },
    { id: 5, text: "Confirmar jugadores", color: "bg-emerald-500", done: true, url: "/jugadores", isCustom: false },
  ];

  const [tasks, setTasks] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const savedCustom = localStorage.getItem("deportivos_coach_custom_tasks");
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          return [...defaultCoachTasks, ...parsed];
        } catch (e) {
          // ignore error
        }
      }
    }
    return defaultCoachTasks;
  });

  const [showAddTask, setShowAddTask] = useState(false);
  const [newCustomTaskText, setNewCustomTaskText] = useState("");

  useEffect(() => {
    setTasks(prev => prev.map(t => {
      if (t.id === 1) return { ...t, done: hasTodayAttendance };
      if (t.id === 2) return { ...t, done: hasTodayEvaluation };
      if (t.id === 4) return { ...t, done: hasTodayWellness };
      return t;
    }));
  }, [hasTodayAttendance, hasTodayEvaluation, hasTodayWellness]);

  const toggleTask = (id: number | string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
      const customOnly = updated.filter(t => t.isCustom);
      localStorage.setItem("deportivos_coach_custom_tasks", JSON.stringify(customOnly));
      return updated;
    });
  };

  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTaskText.trim()) return;
    const newTask = {
      id: `task_${Date.now()}`,
      text: newCustomTaskText.trim(),
      color: "bg-purple-500",
      done: false,
      isCustom: true,
    };
    setTasks(prev => {
      const updated = [...prev, newTask];
      const customOnly = updated.filter(t => t.isCustom);
      localStorage.setItem("deportivos_coach_custom_tasks", JSON.stringify(customOnly));
      return updated;
    });
    setNewCustomTaskText("");
    setShowAddTask(false);
    toast.success("Tarea personal agregada a tu jornada diaria");
  };

  const handleDeleteCustomTask = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      const customOnly = updated.filter(t => t.isCustom);
      localStorage.setItem("deportivos_coach_custom_tasks", JSON.stringify(customOnly));
      return updated;
    });
    toast.info("Tarea eliminada");
  };

  const todayTeams = useMemo(() => {
    const sessions = RendimientoStore.getSesiones();
    const targetDate = selectedDate || new Date().toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];

    const norm = (str: string = "") => str.toLowerCase().replace(/[^a-z0-9]/g, "");
    const activeTeamNorms = new Set(orgTeams.flatMap(e => [norm(e.nombre), norm(e.categoria)].filter(Boolean)));

    // 1. Obtener equipos con sesiones programadas o activas hoy/fecha seleccionada
    const todaySessions = sessions.filter(s => {
      const matchDate = s.fecha === targetDate || s.fecha === todayStr;
      if (!matchDate) return false;
      if (orgTeams.length === 0) return true;
      const sEqNorm = norm(s.equipo || s.categoria);
      return Array.from(activeTeamNorms).some(tn => tn.includes(sEqNorm) || sEqNorm.includes(tn));
    });

    const items = todaySessions.map((session, idx) => {
      const colors = [
        "text-blue-500 bg-blue-500/10 border-blue-500/20",
        "text-purple-500 bg-purple-500/10 border-purple-500/20",
        "text-amber-500 bg-blue-500/10 border-blue-500/20"
      ];
      return {
        id: session.id || `ses-${idx}`,
        title: session.equipo || session.categoria || "Entrenamiento",
        time: session.hora || "3:00 pm",
        type: session.nombre || "Sesión de Cancha",
        icon: (session.tipo as any) === "Partido" || (session.tipo as any) === "Competencia" ? Trophy : Dumbbell,
        color: colors[idx % colors.length]
      };
    });

    // 2. Incluir la sesión activa/completada de "Mi Agenda de Cancha" si no estuviera ya listada
    if (todaySession || isSessionCompleted) {
      const titleName = todaySession?.equipo || activeTeam?.nombre || activeTeam?.categoria || "Plantel";
      if (!items.some(it => norm(it.title) === norm(titleName))) {
        items.push({
          id: todaySession?.id || `ses-agenda-${targetDate}`,
          title: titleName,
          time: todaySession?.hora || "15:00",
          type: todaySession?.nombre || "Sesión de Cancha",
          icon: Dumbbell,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
        });
      }
    }

    // 3. Obtener equipos que no tienen sesión explícita pero sí registros de Asistencia, Wellness o Pruebas hoy
    const teamsWithAttendance = RendimientoStore.getAsistencias()
      .filter(a => a.fecha === targetDate || a.fecha === todayStr)
      .map(a => norm(a.equipo));

    const wellnessJugadorIds = RendimientoStore.getWellness()
      .filter(w => w.fecha === targetDate || w.fecha === todayStr)
      .map(w => w.jugadorId);

    const testJugadorIds = RendimientoStore.getResultadosPruebas()
      .filter(rp => rp.fecha === targetDate || rp.fecha === todayStr)
      .map(rp => rp.jugadorId);

    const players = RendimientoStore.getJugadores();
    const activePlayerIds = new Set([...wellnessJugadorIds, ...testJugadorIds]);
    const teamsWithActivity = players
      .filter(p => activePlayerIds.has(p.id))
      .map(p => norm(p.categoria || (p as any).equipo));

    const activeActivityTeams = new Set([...teamsWithAttendance, ...teamsWithActivity]);

    orgTeams.forEach(t => {
      const tNorm = norm(t.nombre);
      const catNorm = norm(t.categoria);
      const isAlreadyIn = items.some(it => norm(it.title) === tNorm || norm(it.title) === catNorm);
      const hasTodayActivity = activeActivityTeams.has(tNorm) || activeActivityTeams.has(catNorm);

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
  }, [orgTeams, selectedDate, todaySession, isSessionCompleted, activeTeam, updateTrigger]);

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
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // e.g. "2026-07-30"

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const monthNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

    // 1. Get real sessions and real matches for current coach's teams safely
    const storeSesiones = RendimientoStore.getSesiones();
    const storePartidos = RendimientoStore.getPartidos();
    const coachTeamIds = new Set(myTeams.map(t => t.id));
    const coachTeamNames = new Set(myTeams.map(t => (t.nombre || "").toLowerCase()));

    const realSessions = storeSesiones.filter((s) => {
      const teamStr = typeof s.equipo === "string" ? s.equipo.toLowerCase() : "";
      const isCoachTeam = (s.equipoId && coachTeamIds.has(s.equipoId)) || 
                          (teamStr && coachTeamNames.has(teamStr));
      return isCoachTeam && s.fecha && s.fecha >= todayStr;
    });

    const realMatches = storePartidos.filter((p) => {
      const teamStr = typeof p.equipo === "string" ? p.equipo.toLowerCase() : "";
      const localStr = typeof p.local === "string" ? p.local.toLowerCase() : "";
      const isCoachTeam = (p.equipoId && coachTeamIds.has(p.equipoId)) ||
                          (teamStr && coachTeamNames.has(teamStr)) ||
                          (localStr && coachTeamNames.has(localStr));
      return isCoachTeam && p.fecha && p.fecha >= todayStr;
    }).map((m) => {
      const rivalName = typeof m.rival === "string" ? m.rival : (typeof m.visitante === "string" ? m.visitante : "Rival FC");
      const localName = typeof m.local === "string" ? m.local : (typeof m.equipo === "string" ? m.equipo : (activeTeam?.nombre || "Mi Equipo"));
      return {
        id: m.id,
        nombre: `Partido vs ${rivalName} (${m.categoria || activeTeam?.categoria || "Sub-9"})`,
        fecha: m.fecha,
        hora: m.hora || "17:00",
        tipo: "Competencia",
        equipo: localName,
        asistenciaCompletada: false,
      };
    });

    let validEvents: any[] = [...realSessions, ...realMatches];

    // 2. If no real events or fewer than 4, project ONLY routine training sessions (no invented matches!)
    if (validEvents.length < 4) {
      const offsets = [0, 1, 3, 5];
      const generated: typeof storeSesiones = [];
      const teamsToUse = myTeams.length > 0 ? myTeams : (activeTeam ? [activeTeam] : []);

      offsets.forEach((offset, idx) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        const dateStr = d.toISOString().split("T")[0];

        const team = teamsToUse[idx % Math.max(1, teamsToUse.length)];
        const teamName = team ? team.nombre : "Plantel Sub-9";
        const catName = team ? team.categoria : "Sub-9";

        generated.push({
          id: `fut_gen_coach_${idx}_${dateStr}`,
          nombre: `Entrenamiento de Cancha: ${catName}`,
          fecha: dateStr,
          hora: "16:00",
          tipo: "Entrenamiento",
          equipo: teamName,
          asistenciaCompletada: false,
        } as any);
      });

      validEvents = [...validEvents, ...generated];
    }

    // Sort chronologically ascending (closest upcoming event first)
    validEvents.sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || "").localeCompare(b.hora || ""));

    // Deduplicate by id/title+fecha
    const seen = new Set();
    const uniqueEvents = validEvents.filter((ev) => {
      const key = `${ev.fecha}_${ev.nombre}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueEvents.slice(0, 4).map((s) => {
      const [year, month, day] = s.fecha.split("-").map(Number);
      const mLabel = monthNames[(month || 1) - 1] || "JUL";
      const dayNum = day || 1;
      const isToday = s.fecha === todayStr;
      const isTomorrow = s.fecha === tomorrowStr;

      let statusBadge = "PRÓXIMO";
      let badgeColor = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

      if (isToday) {
        statusBadge = "HOY";
        badgeColor = "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30";
      } else if (isTomorrow) {
        statusBadge = "MAÑANA";
        badgeColor = "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30";
      } else if (s.tipo === "Competencia" || s.tipo === "Partido") {
        statusBadge = "PARTIDO";
        badgeColor = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30";
      }

      return {
        id: s.id,
        rawDate: s.fecha,
        dayNum,
        monthLabel: mLabel,
        statusBadge,
        badgeColor,
        title: s.nombre || s.titulo || `Entrenamiento (${s.equipo})`,
        time: s.hora || "16:00",
        type: s.tipo || "Entrenamiento",
        equipo: s.equipo || "Plantel Principal",
      };
    });
  }, [updateTrigger, myTeams, activeTeam]);

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
      {/* Banner Destacado de la Academia Activa */}
      <AcademyHeaderBanner 
        badgeText="ACADEMIA ACTIVA"
        subtitle="PANEL DE ENTRENADORES & CUERPO TÉCNICO"
      />

      {/* Row 1: High-Impact Glassmorphic Greeting Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-sky-500/20 shrink-0">
            {greetingName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                ¡Hola, Coach {greetingName}! 👋
              </h2>
              <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-bold uppercase tracking-wider">
                Portal del Coach
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {todayTeams.length > 0 
                ? `Tienes ${todayTeams.length} sesión${todayTeams.length > 1 ? "es" : ""} programada${todayTeams.length > 1 ? "s" : ""} para el día de hoy.` 
                : "Sin sesiones de entrenamiento programadas para hoy."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto justify-end">
          {/* Functional Date Picker */}
          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 cursor-pointer shadow-xs hover:border-sky-500/50 transition-colors">
            <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => e.target.value && setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none text-xs cursor-pointer font-bold text-slate-900 dark:text-slate-100"
            />
          </label>

          <Button variant="outline" size="sm" asChild className="h-8 text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800">
            <Link to="/planeamiento">
              <ClipboardList className="w-3.5 h-3.5 text-sky-500" />
              <span>Planificación</span>
            </Link>
          </Button>

          <Button size="sm" asChild className="h-8 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white gap-1.5 shadow-sm">
            <Link to="/entrenamientos">
              <Play className="w-3.5 h-3.5" />
              <span>Modo Cancha</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Row 2: Premium 4 Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Sesiones Hoy */}
        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-blue-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sesiones Hoy
            </span>
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Dumbbell className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {todayTeams.length}
            </h3>
            <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-300 border-none text-[10px] font-bold">
              {todayTeams.length > 0 ? "Activas" : "Día Libre"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Entrenamientos en plantilla
          </p>
        </div>

        {/* Card 2: Convocatorias */}
        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Convocatorias
            </span>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Megaphone className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {activeConvocatorias.length}
            </h3>
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-300 border-none text-[10px] font-bold">
              Publicadas
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Convocatorias de partido
          </p>
        </div>

        {/* Card 3: Enfermería */}
        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              En Enfermería
            </span>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {activeInjuriesCount}
            </h3>
            <Badge className={cn(
              "border-none text-[10px] font-bold",
              activeInjuriesCount > 0 ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 animate-pulse" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}>
              {activeInjuriesCount > 0 ? "Bajas Médicas" : "Sin Lesionados"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Atletas en tratamiento / baja
          </p>
        </div>

        {/* Card 4: Score de Rendimiento */}
        <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rendimiento
            </span>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {(100 - (alerts.length * 10)).toFixed(0)}%
            </h3>
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-none text-[10px] font-bold">
              Nivel Élite
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
            Score operativo óptimo
          </p>
        </div>
      </div>

      {/* Row 3: Secciones Principales en 2 COLUMNAS SIDE-BY-SIDE (Columna 1: Agenda, Próximos Eventos, Checklist & Cancha | Columna 2: Mis Equipos, IA, Wellness, Riesgo & Cobros) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* COLUMNA 1 (Izquierda): Agenda de Cancha, Eventos, Checklist & Cancha (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Card 1: Mi Agenda de Cancha (Hoy) */}
          <Card className="shadow-card border border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Calendar className="w-4.5 h-4.5 text-sky-500" />
                  Mi Agenda de Cancha (Hoy)
                  {activeTeam && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      · {activeTeam.categoria}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Plan de entrenamiento y partidos del día para iniciar en cancha
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayMatch ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 rounded-xl p-3 shrink-0 text-amber-600 dark:text-amber-400">
                      <ShieldHalf className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 border-none">
                          PARTIDO OFICIAL
                        </Badge>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-amber-500" />
                          {todayMatch.sede || todayMatch.estadio || "Cancha Academia Asoderive"}
                        </span>
                      </div>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {todayMatch.local || activeTeam?.nombre || "Equipo"} vs {todayMatch.visitante || todayMatch.rival || "Rival FC"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="w-3 h-3 text-amber-500" />
                        {todayMatch.hora || "10:00 AM"}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" asChild className="text-xs font-bold gap-1.5 w-full bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                    <Link to="/tactica/pizarra">
                      <Eye className="w-3.5 h-3.5" /> Ver Táctica
                    </Link>
                  </Button>
                </div>
              ) : todaySession ? (
                <div className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                  isSessionCompleted 
                    ? "border-emerald-500/30 bg-emerald-500/5" 
                    : "border-sky-500/30 bg-sky-500/5"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-3 shrink-0 ${
                      isSessionCompleted 
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                        : "bg-sky-500/20 text-sky-600 dark:text-sky-400"
                    }`}>
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${
                          isSessionCompleted 
                            ? "bg-emerald-600 text-white" 
                            : "bg-sky-600 text-white"
                        } text-[9px] font-bold px-2 py-0.5 border-none`}>
                          {isSessionCompleted ? "COMPLETADO" : "SESIÓN EN CANCHA"}
                        </Badge>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-sky-500" />
                          {todaySession.sede || todaySession.instalacion || "Cancha Principal"}
                        </span>
                      </div>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                        {todaySession.nombre || `Entrenamiento ${activeTeam?.categoria}`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="w-3 h-3 text-sky-500" />
                        {todaySession.hora || "15:00"} ({todaySession.duracion || 90} min)
                      </p>
                    </div>
                  </div>
                  {isSessionCompleted && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 flex items-center justify-center gap-1.5 w-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> ENTRENAMIENTO TERMINADO
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-4 flex flex-col justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-200 dark:bg-slate-800 rounded-xl p-2.5 shrink-0 text-slate-500">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Día libre para <span className="text-sky-600 dark:text-sky-400">{activeTeam?.categoria || "hoy"}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Puedes iniciar una sesión espontánea</p>
                    </div>
                  </div>
                  <Button size="sm" asChild className="text-xs font-bold gap-1.5 w-full bg-sky-600 hover:bg-sky-700 text-white">
                    <Link to="/entrenamientos" search={{ teamName: activeTeam?.nombre, category: activeTeam?.categoria, fecha: selectedDate, autostart: "true" }}>
                      <Plus className="w-3.5 h-3.5" /> Nueva Sesión
                    </Link>
                  </Button>
                </div>
              )}

              {/* Gran Botón de Inicio o Estado de Entrenamiento */}
              <div className="pt-1">
                {isSessionCompleted ? (
                  <Button size="lg" asChild className="w-full h-11 text-xs font-black gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-xl uppercase tracking-wider">
                    <Link to="/entrenamientos" search={{ teamName: activeTeam?.nombre, category: activeTeam?.categoria, fecha: selectedDate }}>
                      <CheckCircle2 className="w-4 h-4" /> ENTRENAMIENTO TERMINADO ({activeTeam?.categoria || "General"})
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" asChild className="w-full h-11 text-xs font-black gap-2 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white shadow-md rounded-xl uppercase tracking-wider">
                    <Link to="/entrenamientos" search={{ teamName: activeTeam?.nombre, category: activeTeam?.categoria, fecha: selectedDate, autostart: "true" }}>
                      <Play className="w-4 h-4" /> INICIAR ENTRENAMIENTO ({activeTeam?.categoria || "General"})
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Próximos Eventos */}
          <Card className="shadow-card border border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <CalendarClock className="w-4.5 h-4.5 text-sky-500" /> Próximos eventos
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Planificación deportiva y calendario de la academia
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 gap-1 shrink-0">
                <Link to="/entrenamientos">
                  Ver Todo <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {upcomingEvents.length === 0 ? (
                  <div className="col-span-2 text-center py-4 text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/5">
                    📅 No hay eventos próximos programados.
                  </div>
                ) : (
                  upcomingEvents.slice(0, 4).map((evt) => (
                    <div 
                      key={evt.id} 
                      className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-sky-500/40 hover:shadow-xs transition-all flex items-center gap-2 group"
                    >
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg font-black text-[10px] transition-transform group-hover:scale-105 shadow-xs",
                        evt.badgeColor
                      )}>
                        <span className="text-[8px] uppercase font-bold tracking-tight opacity-80">{evt.monthLabel}</span>
                        <span className="text-xs font-black leading-none mt-0.5">{evt.dayNum}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {evt.title}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                          <span>⏰ {evt.time}</span>
                          <span>•</span>
                          <span className="capitalize">{evt.type}</span>
                        </p>
                      </div>

                      <Badge className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border-none shrink-0", evt.badgeColor)}>
                        {evt.statusBadge}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Checklist de Jornada */}
          <Card className="shadow-card border border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" /> Checklist de Jornada
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Completa y gestiona tus tareas operativas del día
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddTask(!showAddTask)}
                className="h-7 text-xs font-bold text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/10 gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Nueva Tarea
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {showAddTask && (
                <form onSubmit={handleAddCustomTask} className="flex gap-2 p-2.5 rounded-xl border border-sky-500/30 bg-sky-500/5 animate-in fade-in duration-200">
                  <Input
                    placeholder="Escribe tu nueva tarea..."
                    value={newCustomTaskText}
                    onChange={(e) => setNewCustomTaskText(e.target.value)}
                    className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="h-8 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shrink-0">
                    Guardar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddTask(false)} className="h-8 w-8 p-0 text-slate-400">
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`group p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      task.done 
                        ? "border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-850/40 opacity-60" 
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500/40 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${task.color}`} />
                      <span className={`text-xs font-semibold truncate text-slate-900 dark:text-slate-100 ${task.done ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
                        {task.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {task.url && !task.done && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 px-1.5 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                        >
                          <Link to={task.url}>
                            Ir <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}

                      {task.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomTask(task.id, e)}
                          className="text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-colors ${
                        task.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-700 bg-background"
                      }`}>
                        {task.done && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Mis Equipos & Categorías a Cargo */}
          <Card className="shadow-card border border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Users className="w-4.5 h-4.5 text-sky-500" /> Mis Equipos & Categorías
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Equipos asignados bajo tu dirección técnica
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 gap-1 shrink-0">
                <Link to="/equipos">
                  Ver Todo <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {myTeams.map((team) => {
                const teamPlayers = playersForTeam(team);
                const shown = teamPlayers.slice(0, 5);
                const rest = Math.max(0, teamPlayers.length - 5);
                const isSelected = team.id === selectedTeamId;
                return (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`rounded-2xl border bg-white dark:bg-slate-900 p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? "border-sky-500 ring-2 ring-sky-500/20 shadow-md"
                        : "border-slate-200/90 dark:border-slate-800 hover:border-sky-500/40 hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold px-2 py-0.5 ${
                              isSelected 
                                ? "bg-sky-600 text-white border-sky-600" 
                                : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30"
                            }`}
                          >
                            {team.categoria}
                          </Badge>
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{team.nombre}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shrink-0">
                          Activo
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{team.sede || "Sede Central"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {shown.map((p, i) => (
                            <Avatar key={p.id || i} className="h-7 w-7 border-2 border-white dark:border-slate-900">
                              <AvatarImage src={p.avatar} />
                              <AvatarFallback className="text-[9px] font-bold bg-sky-500/10 text-sky-600">
                                {(p.nombre || "?")[0]}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {rest > 0 ? `+${rest} · ` : ""}{teamPlayers.length} atletas
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1" onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm" asChild className="flex-1 text-[11px] font-bold gap-1 h-7 px-1">
                        <Link to="/equipos" search={{ teamId: team.id }}>
                          <Eye className="w-3 h-3 text-sky-500" /> Ver
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1 text-[11px] font-bold gap-1 h-7 px-1">
                        <Link to="/plantillas">
                          <FileText className="w-3 h-3 text-slate-400" /> Plantilla
                        </Link>
                      </Button>
                      <Button size="sm" asChild className="flex-1 text-[11px] font-bold gap-1 h-7 px-1 bg-sky-600 hover:bg-sky-700 text-white">
                        <Link to="/asistencia">
                          <ClipboardList className="w-3 h-3" /> Asistencia
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Card 5: Agenda General de Cancha (Toda la Academia) */}
          <Card className="shadow-card border border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Calendar className="w-4.5 h-4.5 text-indigo-500" /> Agenda General de Cancha
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Programación global de la academia para todos los coaches y planteles
                </CardDescription>
              </div>
              <span className="text-xs text-slate-500 font-medium">{academyAgendaGeneral.length} eventos en agenda</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {academyAgendaGeneral.map((session: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all ${
                      session.isMyTeam 
                        ? "bg-sky-500/10 border-sky-500/30 shadow-xs" 
                        : session.tipo === "Partido"
                        ? "bg-amber-500/5 border-amber-500/25"
                        : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] font-bold ${
                            session.isMyTeam 
                              ? "bg-sky-600 text-white border-none" 
                              : session.tipo === "Partido"
                              ? "bg-amber-500 text-white border-none"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {session.categoria} {session.isMyTeam && "• Mi Equipo"}
                        </Badge>

                        {session.tipo === "Partido" && (
                          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[8px] font-extrabold px-1.5 py-0.2">
                            PARTIDO
                          </Badge>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-500" /> {session.fecha === todayDateStr ? "Hoy" : session.fecha} • {session.hora}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {session.nombre}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60 mt-0.5">
                      <span className="flex items-center gap-1">
                        👨‍🏫 Coach: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{session.entrenador}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        📍 {session.cancha}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 2 (Derecha): IA Recomienda, Wellness, Riesgo & Cobros (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
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
              <Card className="shadow-card border border-slate-200/80 dark:border-slate-800">
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
                    <div key={s.label} className="flex items-center justify-between rounded-xl border p-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                        <span className="text-xs font-medium">{s.emoji} {s.label}</span>
                      </div>
                      <span className={`text-xs font-bold ${s.text}`}>{s.count}</span>
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
            const ranking = [...loadData]
              .sort((a, b) => {
                const map: Record<string, number> = { rojo: 3, amarillo: 2, verde: 1 };
                if (map[a.semaforo] !== map[b.semaforo]) {
                  return map[b.semaforo] - map[a.semaforo];
                }
                return b.fatigaScore - a.fatigaScore;
              })
              .slice(0, 3);

            return (
              <Card className="shadow-card border border-slate-200/80 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100 truncate">
                      <ShieldAlert className="h-4 w-4 text-amber-500 animate-pulse shrink-0" /> 
                      <span className="truncate">Riesgo del Equipo</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-semibold shrink-0">Cargas & Lesiones</Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Semáforo de riesgo de lesiones y sobrecarga
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Semáforo Counters */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 flex flex-col items-center justify-center min-w-0">
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">🟢 {cnt.verde}</p>
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1 truncate w-full">Óptimo</p>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 flex flex-col items-center justify-center min-w-0">
                      <p className="text-base font-black text-amber-600 dark:text-amber-400 leading-none">🟡 {cnt.amarillo}</p>
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1 truncate w-full">Precaución</p>
                    </div>
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 flex flex-col items-center justify-center min-w-0">
                      <p className="text-base font-black text-rose-600 dark:text-rose-400 leading-none">🔴 {cnt.rojo}</p>
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-1 truncate w-full">Riesgo</p>
                    </div>
                  </div>

                  {/* Ranking */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Ranking de Mayor Riesgo</p>
                    <div className="space-y-1.5">
                      {ranking.filter(r => r.semaforo === "rojo" || r.semaforo === "amarillo").length === 0 ? (
                        <div className="text-center py-3 text-[11px] text-muted-foreground border border-dashed rounded-xl bg-muted/5">
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

          {/* Alertas de Cobro & Mensualidad */}
          <Card className="shadow-card border border-rose-500/20 bg-rose-500/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <CheckSquare className="h-4 w-4 text-rose-500" /> Alertas de Cobro & Mensualidad
                </CardTitle>
                <Badge className="bg-rose-500 text-white text-[9px] font-bold border-none">
                  {overduePlayers.length} pendientes
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Recordatorios amables para la gestión de mensualidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {overduePlayers.length === 0 ? (
                <div className="text-center py-4 text-xs text-emerald-600 dark:text-emerald-400 font-medium border border-dashed border-emerald-500/20 rounded-xl bg-emerald-500/5">
                  ✓ Todos los atletas están al día con sus cuotas
                </div>
              ) : (
                overduePlayers.map((player: any) => (
                  <div key={player.id} className="rounded-xl border border-rose-500/20 bg-white dark:bg-slate-900 p-3 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{player.nombre}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Encargado: {player.encargado}</p>
                      </div>
                      <Badge className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 shrink-0 border-none">
                        ₡{player.saldo.toLocaleString()} pendiente
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] font-bold gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 w-full"
                      onClick={() => {
                        const msg = `Hola ${player.encargado}, le saludamos de la Academia. Le recordamos amablemente la mensualidad pendiente de ${player.nombre} por un monto de ₡${player.saldo.toLocaleString()}. ¡Muchas gracias!`;
                        window.open(`https://wa.me/${player.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                    >
                      💬 Recordar por WhatsApp
                    </Button>
                  </div>
                ))
              )}
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
      {/* Banner Destacado de la Academia Activa */}
      <AcademyHeaderBanner 
        badgeText="ACADEMIA ACTIVA"
        subtitle="PORTAL OFICIAL DE ENCARGADOS Y FAMILIAS"
      />

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
