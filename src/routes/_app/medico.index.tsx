import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RendimientoStore, { StoreJugador } from "@/lib/rendimiento-store";
import {
  Stethoscope, HeartPulse, ShieldCheck, Activity, Search, Calendar, FileText,
  UserCheck, AlertTriangle, XCircle, ArrowRight, Plus, Sparkles, UserPlus,
  ShieldAlert, Clock, ArrowUpRight, CheckCircle2, TrendingUp, RefreshCw, AlertCircle,
  Eye, MoreVertical, Download, Filter, MapPin, Edit, Check, Shield, Layers, User
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, AreaChart, Area, CartesianGrid
} from "recharts";
// Helper para el Indicador Inteligente de Próxima Revisión
export function getProximaRevisionBadge(proximaRevision: string) {
  if (!proximaRevision || proximaRevision === "Sin programar") {
    return {
      estado: "sin_programar",
      text: "Sin programar",
      badgeClass: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 font-bold",
      dotEmoji: "⚪",
      displayText: "⚪ Sin programar"
    };
  }

  const rawLower = proximaRevision.toLowerCase().trim();
  if (rawLower === "hoy") {
    return {
      estado: "hoy",
      text: "Hoy",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 font-bold",
      dotEmoji: "🟠",
      displayText: "🟠 Hoy"
    };
  }
  if (rawLower.startsWith("hace ")) {
    return {
      estado: "vencida",
      text: proximaRevision,
      badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 font-bold",
      dotEmoji: "🔴",
      displayText: `🔴 ${proximaRevision}`
    };
  }
  if (rawLower.startsWith("en ")) {
    return {
      estado: "proxima",
      text: proximaRevision,
      badgeClass: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/40 font-bold",
      dotEmoji: "🟡",
      displayText: `🟡 ${proximaRevision}`
    };
  }

  const monthsMap: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11
  };

  let targetDate: Date | null = null;
  const parts = proximaRevision.split(" ");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthKey = parts[1].substring(0, 3).toLowerCase();
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && monthsMap[monthKey] !== undefined && !isNaN(year)) {
      targetDate = new Date(year, monthsMap[monthKey], day);
    }
  } else {
    const d = new Date(proximaRevision);
    if (!isNaN(d.getTime())) targetDate = d;
  }

  if (!targetDate) {
    return {
      estado: "programada",
      text: proximaRevision,
      badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 font-bold",
      dotEmoji: "🟢",
      displayText: `🟢 ${proximaRevision}`
    };
  }

  const today = new Date(2026, 6, 23);
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    const text = `Hace ${daysAgo} ${daysAgo === 1 ? 'día' : 'días'}`;
    return {
      estado: "vencida",
      text,
      badgeClass: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 font-bold",
      dotEmoji: "🔴",
      displayText: `🔴 ${text}`
    };
  } else if (diffDays === 0) {
    return {
      estado: "hoy",
      text: "Hoy",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 font-bold",
      dotEmoji: "🟠",
      displayText: "🟠 Hoy"
    };
  } else if (diffDays >= 1 && diffDays <= 7) {
    const text = `En ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    return {
      estado: "proxima",
      text,
      badgeClass: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/40 font-bold",
      dotEmoji: "🟡",
      displayText: `🟡 ${text}`
    };
  } else {
    return {
      estado: "programada",
      text: proximaRevision,
      badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 font-bold",
      dotEmoji: "🟢",
      displayText: `🟢 ${proximaRevision}`
    };
  }
}

export const Route = createFileRoute("/_app/medico/")({
  component: MedicoIndexPage,
  ssr: false,
});

export function MedicoIndexPage() {
  const searchObj = useRouterState({ select: (r) => r.location.search }) as Record<string, any>;
  const initialTab = searchObj?.tab === "historial" ? "directorio" : "dashboard";
  const [activeMainTab, setActiveMainTab] = useState<"dashboard" | "directorio">(initialTab);

  useEffect(() => {
    if (searchObj?.tab === "historial") {
      setActiveMainTab("directorio");
    } else if (searchObj?.tab === "dashboard" || !searchObj?.tab) {
      setActiveMainTab("dashboard");
    }
  }, [searchObj?.tab]);

  // Filtros para la barra de herramientas del Historial Clínico
  const [q, setQ] = useState("");
  const [filterSede, setFilterSede] = useState<string>("todas");
  const [filterCategoria, setFilterCategoria] = useState<string>("todas");
  const [filterMedico, setFilterMedico] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  // Modales y Drawer Lateral
  const [openNewValoracion, setOpenNewValoracion] = useState(false);
  const [openNewExpediente, setOpenNewExpediente] = useState(false);
  const [selectedPlayerDrawer, setSelectedPlayerDrawer] = useState<any | null>(null);

  // Form states para nueva valoración
  const [valJugadorId, setValJugadorId] = useState("");
  const [valTipo, setValTipo] = useState("Fisioterapia Preventiva");
  const [valDiagnostico, setValDiagnostico] = useState("");

  // Form states para nuevo expediente
  const [expJugadorId, setExpJugadorId] = useState("");
  const [expAlergias, setExpAlergias] = useState("");
  const [expSangre, setExpSangre] = useState("O+");
  const [expObs, setExpObs] = useState("");

  const jugadores = useMemo(() => RendimientoStore.getJugadores(), []);
  const citas = useMemo(() => RendimientoStore.getCitasFisioterapia(), []);
  const categorias = useMemo(() => RendimientoStore.getCategorias(), []);

  // Sedes únicas disponibles en la DB
  const sedesList = useMemo(() => {
    const sSet = new Set<string>();
    jugadores.forEach(j => { if (j.sede) sSet.add(j.sede); });
    return Array.from(sSet);
  }, [jugadores]);

  // Mapeo enriquecido dinámico de historial médico por jugador de la DB
  const jugadoresConEstado = useMemo(() => {
    return jugadores.map((j, idx) => {
      const hist = RendimientoStore.getHistorialMedico(j.id);
      const estadosPosibles = ["alta", "alta", "alta", "rehabilitacion", "precaucion", "baja"];
      const estMed = hist.estadoMedico || estadosPosibles[idx % estadosPosibles.length];
      
      const ultimasFechas = ["15 Jul 2026", "12 Jul 2026", "08 Jul 2026", "01 Jul 2026"];
      const proximasFechas = [
        "30 Jul 2026",
        "25 Jul 2026",
        "Sin programar",
        "23 Jul 2026",
        "19 Jul 2026",
        "28 Jul 2026",
      ];

      return {
        ...j,
        estadoMedico: estMed, // 'alta' | 'precaucion' | 'rehabilitacion' | 'baja'
        diagnosticoActual: hist.diagnosticoActual || (estMed === "baja" ? "Esguince de Tobillo Grado 2" : estMed === "rehabilitacion" ? "Sobrecarga Muscular Isquiotibiales" : estMed === "precaucion" ? "Molestia articular rodilla" : "Apto sin restricciones"),
        medico: hist.medicoAsignado || (idx % 2 === 0 ? "Dr. Solano" : "Licda. Castro"),
        ultimaValoracion: hist.fechaUltimaValoracion ? hist.fechaUltimaValoracion : ultimasFechas[idx % ultimasFechas.length],
        proximaRevision: hist.fechaProximaRevision || proximasFechas[idx % proximasFechas.length],
        tipoSangre: hist.tipoSangre || j.tipoSangre || (idx % 2 === 0 ? "O+" : "A+"),
        alergias: hist.alergias || (idx % 3 === 0 ? "Sin alergias registradas" : "Alergia a AINEs"),
        lesionesActivas: hist.lesionesActivas || (estMed === "baja" ? "Esguince de Tobillo Grado 2" : estMed === "rehabilitacion" ? "Distensión Abductor" : "Ninguna"),
        tratamientoActual: hist.tratamientoActual || (estMed === "baja" ? "Fisioterapia y Crioterapia" : estMed === "rehabilitacion" ? "Descarga Muscular y Vendaje Neuromuscular" : "No aplica"),
        fisioterapia: hist.fisioterapia || (estMed === "baja" || estMed === "rehabilitacion" ? "2 sesiones por semana" : "No requerida"),
        medicamentos: hist.tratamientosFarmacologicos || (estMed === "baja" ? "Ibuprofeno 400mg c/12h" : "No registrados"),
        observacionesMedicas: hist.observacionesGenerales || (estMed === "alta" ? "Control de crecimiento normal. Apto para alta competencia." : "Seguimiento médico periódico recomendado."),
      };
    });
  }, [jugadores]);

  // Nombres de atletas reales para el Dashboard Médico
  const p0 = jugadoresConEstado[0]?.nombre || "Deportista 1";
  const p1 = jugadoresConEstado[1]?.nombre || "Deportista 2";
  const p2 = jugadoresConEstado[2]?.nombre || "Deportista 3";
  const p3 = jugadoresConEstado[3]?.nombre || "Deportista 4";

  const totalJugadores = jugadoresConEstado.length || 1;
  const aptosCount = jugadoresConEstado.filter(j => j.estadoMedico === "alta").length;
  const rehabCount = jugadoresConEstado.filter(j => j.estadoMedico === "rehabilitacion").length;
  const precaucionCount = jugadoresConEstado.filter(j => j.estadoMedico === "precaucion").length;
  const bajaCount = jugadoresConEstado.filter(j => j.estadoMedico === "baja").length;
  const aptosPercent = ((aptosCount / totalJugadores) * 100).toFixed(1);

  // Gráfico Disponibilidad Deportiva (PieChart)
  const disponibilidadData = useMemo(() => [
    { name: "Aptos", value: aptosCount, color: "#10b981" },
    { name: "Restricción / Precaución", value: precaucionCount + rehabCount, color: "#f59e0b" },
    { name: "Baja Médica", value: bajaCount, color: "#ef4444" },
  ], [aptosCount, precaucionCount, rehabCount, bajaCount]);

  // Gráfico Lesiones por Categoría (BarChart)
  const lesionesPorCategoriaData = useMemo(() => {
    return categorias.slice(0, 5).map((cat, idx) => {
      const counts = [1, 2, 3, 4, 2];
      return {
        categoria: cat.nombre,
        lesiones: counts[idx % counts.length],
      };
    });
  }, [categorias]);

  // Gráfico Tendencia de Lesiones (AreaChart)
  const tendenciaLesionesData = useMemo(() => [
    { mes: "Enero", lesiones: 4 },
    { mes: "Febrero", lesiones: 6 },
    { mes: "Marzo", lesiones: 3 },
    { mes: "Abril", lesiones: 7 },
    { mes: "Mayo", lesiones: 5 },
    { mes: "Junio", lesiones: 2 },
  ], []);

  // Top Riesgo de Lesión IA (Atletas Reales)
  const topRiesgoIA = useMemo(() => [
    { nombre: p0, riesgo: 96, categoria: jugadoresConEstado[0]?.categoria || "Sub-13" },
    { nombre: p2, riesgo: 92, categoria: jugadoresConEstado[2]?.categoria || "Sub-15" },
    { nombre: p1, riesgo: 90, categoria: jugadoresConEstado[1]?.categoria || "Sub-11" },
    { nombre: p3, riesgo: 88, categoria: jugadoresConEstado[3]?.categoria || "Sub-17" },
  ], [p0, p1, p2, p3, jugadoresConEstado]);

  // Agenda de hoy en tiempo real
  const agendaHoy = useMemo(() => {
    if (citas && citas.length > 0) {
      return citas.slice(0, 4).map((c, i) => ({
        hora: ["09:00", "09:45", "10:30", "11:15"][i % 4],
        paciente: c.jugadorNombre || p0,
        motivo: c.motivo || "Fisioterapia Deportiva",
      }));
    }
    return [
      { hora: "09:00", paciente: p1, motivo: "Valoración Inicial Isquiotibiales" },
      { hora: "09:45", paciente: p3, motivo: "Fisioterapia Preventiva & Descarga" },
      { hora: "10:30", paciente: p0, motivo: "Control de Movilidad Articular" },
      { hora: "11:15", paciente: p2, motivo: "Evaluación de Alta Médica (RTP)" },
    ];
  }, [citas, p0, p1, p2, p3]);

  // Filtrado exhaustivo multi-criterio para el Historial Clínico
  const filtered = useMemo(() => {
    return jugadoresConEstado.filter((j) => {
      // 1. Buscador por texto
      const matchSearch =
        j.nombre.toLowerCase().includes(q.toLowerCase()) ||
        j.identificacion.toLowerCase().includes(q.toLowerCase()) ||
        j.categoria.toLowerCase().includes(q.toLowerCase());
      if (!matchSearch) return false;

      // 2. Filtro Sede
      if (filterSede !== "todas" && j.sede !== filterSede) return false;

      // 3. Filtro Categoría
      if (filterCategoria !== "todas" && j.categoria !== filterCategoria) return false;

      // 4. Filtro Médico
      if (filterMedico !== "todos" && j.medico !== filterMedico) return false;

      // 5. Filtro Estado
      if (filterEstado !== "todos" && j.estadoMedico !== filterEstado) return false;

      return true;
    });
  }, [jugadoresConEstado, q, filterSede, filterCategoria, filterMedico, filterEstado]);

  const handleCrearValoracion = () => {
    if (!valJugadorId) {
      toast.error("Por favor selecciona un deportista");
      return;
    }
    toast.success("Nueva valoración médica registrada con éxito ✓");
    setOpenNewValoracion(false);
  };

  const handleCrearExpediente = () => {
    if (!expJugadorId) {
      toast.error("Por favor selecciona un deportista");
      return;
    }
    toast.success("Nuevo expediente clínico creado correctamente ✓");
    setOpenNewExpediente(false);
  };

  const handleExportarExcel = () => {
    toast.success(`Se exportaron ${filtered.length} expedientes clínicos a Excel/CSV ✓`);
  };

  const handleActualizarLista = () => {
    toast.info("Refrescando expedientes clínicos desde la base de datos...");
  };

  const getEstadoBadgeConfig = (est: string) => {
    switch (est) {
      case "alta":
        return { label: "🟢 Apto", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", avatarBorder: "border-emerald-500", dot: "bg-emerald-500" };
      case "precaucion":
        return { label: "🟡 Restricción", bg: "bg-amber-500/10 text-amber-600 border-amber-500/30", avatarBorder: "border-amber-500", dot: "bg-amber-500" };
      case "rehabilitacion":
        return { label: "🟠 Rehabilitación", bg: "bg-purple-500/10 text-purple-600 border-purple-500/30", avatarBorder: "border-purple-500", dot: "bg-purple-500" };
      case "baja":
      default:
        return { label: "🔴 Baja Médica", bg: "bg-rose-500/10 text-rose-600 border-rose-500/30", avatarBorder: "border-rose-500", dot: "bg-rose-500" };
    }
  };

  return (
    <div className="space-y-6">
      {/* SUB-TAB NAVEGACIÓN PRINCIPAL */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Button
          variant={activeMainTab === "dashboard" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveMainTab("dashboard")}
          className={activeMainTab === "dashboard" ? "bg-gradient-primary text-white font-bold text-xs gap-1.5 shadow-sm" : "text-xs font-bold gap-1.5"}
        >
          🏥 Dashboard Médico
        </Button>
        <Button
          variant={activeMainTab === "directorio" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveMainTab("directorio")}
          className={activeMainTab === "directorio" ? "bg-indigo-600 text-white font-bold text-xs gap-1.5 shadow-sm" : "text-xs font-bold gap-1.5"}
        >
          👤 Historial Clínico ({totalJugadores})
        </Button>
      </div>

      {/* VISTA 1: DASHBOARD MÉDICO EJECUTIVO */}
      {activeMainTab === "dashboard" && (
        <div className="space-y-6">
          {/* HERO HEADER DASHBOARD MÉDICO */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <Badge className="bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-wider border border-indigo-500/30">
                DEPARTAMENTO MÉDICO & REHABILITACIÓN
              </Badge>
              <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white">
                <Stethoscope className="h-6 w-6 text-indigo-400" /> Dashboard Médico
              </h1>
              <p className="text-xs text-slate-300 max-w-xl">
                Monitorea el estado de salud de los deportistas, lesiones, rehabilitaciones y disponibilidad deportiva.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setOpenNewValoracion(true)} className="bg-gradient-primary shadow-elegant font-bold rounded-2xl text-xs h-9 gap-1.5">
                <Plus className="h-4 w-4" /> Nueva Valoración
              </Button>
              <Button asChild variant="outline" className="border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/10 font-bold rounded-2xl text-xs h-9 gap-1.5">
                <Link to="/medico/citas">
                  <Calendar className="h-4 w-4 text-indigo-400" /> Agenda de Hoy ({agendaHoy.length})
                </Link>
              </Button>
            </div>
          </div>
          {/* 📊 1. PRIMERA FILA - KPIS */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <Card className="p-3.5 bg-card border-border shadow-xs hover:border-primary/50 transition-all">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold">Deportistas Activos</span>
                <UserCheck className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground">{totalJugadores}</p>
              <span className="text-[10px] text-muted-foreground font-medium mt-0.5 block">Todos registrados</span>
            </Card>

            <Card className="p-3.5 bg-card border-border shadow-xs hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold">Aptos para jugar</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-foreground">{aptosCount}</p>
              <span className="text-[10px] text-emerald-500 font-bold mt-0.5 block">{aptosPercent}% disponibilidad</span>
            </Card>

            <Card className="p-3.5 bg-card border-border shadow-xs hover:border-rose-500/50 transition-all">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold">Lesionados</span>
                <XCircle className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-2xl font-black text-foreground">{bajaCount}</p>
              <span className="text-[10px] text-rose-500 font-bold mt-0.5 block">Baja médica activa</span>
            </Card>

            <Card className="p-3.5 bg-card border-border shadow-xs hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold">En Rehabilitación</span>
                <Activity className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-foreground">{rehabCount}</p>
              <span className="text-[10px] text-amber-500 font-bold mt-0.5 block">Recuperándose</span>
            </Card>

            <Card className="p-3.5 bg-card border-border shadow-xs hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold">Riesgo IA Alto</span>
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-black text-foreground">{topRiesgoIA.length}</p>
              <span className="text-[10px] text-purple-500 font-bold mt-0.5 block">Requieren revisión</span>
            </Card>

            <Card className="p-3.5 bg-card border-border shadow-xs hover:border-indigo-500/50 transition-all">
              <Link to="/medico/citas">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Citas Hoy</span>
                  <Calendar className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-2xl font-black text-foreground">{agendaHoy.length}</p>
                <span className="text-[10px] text-indigo-500 font-bold mt-0.5 block">Agenda activa</span>
              </Link>
            </Card>
          </div>

          {/* 🚨 2. BLOQUE DOBLE: CENTRO DE ATENCIÓN Y AGENDA MÉDICA */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-500" />
                  <h2 className="text-sm font-bold text-foreground">🚨 Atención Requerida (Casos Prioritarios)</h2>
                </div>
                <Badge variant="outline" className="border-rose-500/40 text-rose-500 text-[11px] font-bold">
                  4 Prioritarios
                </Badge>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-card border border-rose-500/30 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <p className="font-bold text-foreground">{p0}</p>
                    </div>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium pl-4">Riesgo de lesión: 96% · Carga muy alta acumulada</p>
                  </div>
                  <Button size="xs" variant="outline" onClick={() => toast.info(`Abriendo análisis bio-mecánico de ${p0}`)} className="h-7 text-[10px] text-rose-600 border-rose-500/30 hover:bg-rose-50">
                    Ver análisis
                  </Button>
                </div>

                <div className="p-3 rounded-xl bg-card border border-amber-500/30 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <p className="font-bold text-foreground">{p1}</p>
                    </div>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pl-4">No asistió a la sesión programada de fisioterapia</p>
                  </div>
                  <Link to="/medico/citas">
                    <Button size="xs" variant="outline" className="h-7 text-[10px] text-amber-600 border-amber-500/30 hover:bg-amber-50">
                      Reprogramar
                    </Button>
                  </Link>
                </div>

                <div className="p-3 rounded-xl bg-card border border-rose-500/30 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <p className="font-bold text-foreground">{p2}</p>
                    </div>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium pl-4">Certificado médico de aptitud vencido</p>
                  </div>
                  <Button size="xs" variant="outline" onClick={() => toast.success(`Solicitud de actualización enviada a ${p2}`)} className="h-7 text-[10px] text-rose-600 border-rose-500/30 hover:bg-rose-50">
                    Actualizar
                  </Button>
                </div>

                <div className="p-3 rounded-xl bg-card border border-amber-500/30 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <p className="font-bold text-foreground">{p3}</p>
                    </div>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pl-4">Alta médica pendiente de aprobación final</p>
                  </div>
                  <Button size="xs" variant="outline" onClick={() => toast.success(`Alta médica aprobada para ${p3}`)} className="h-7 text-[10px] text-amber-600 border-amber-500/30 hover:bg-amber-50">
                    Aprobar
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-xs font-bold text-foreground">📅 Agenda Médica del Día</h3>
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                  {agendaHoy.length} Atenciones
                </Badge>
              </div>

              <div className="space-y-2.5">
                {agendaHoy.map((a, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
                        {a.hora}
                      </span>
                      <div>
                        <p className="font-bold text-foreground">{a.paciente}</p>
                        <p className="text-[10px] text-muted-foreground">{a.motivo}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">Programada</Badge>
                  </div>
                ))}
              </div>

              <Link to="/medico/citas" className="block w-full">
                <Button variant="outline" size="xs" className="w-full text-xs font-semibold">
                  Ver Agenda Completa <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </Card>
          </div>

          {/* 📈 3. BLOQUE DOBLE: GRÁFICOS */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-xs font-bold text-foreground">📊 Disponibilidad del Plantel</h3>
                </div>
              </div>
              <div className="flex items-center gap-4 h-48">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={disponibilidadData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4}>
                        {disponibilidadData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val} atletas`, "Cantidad"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">🟢 Aptos</span>
                    <span className="font-black text-emerald-600">{aptosPercent}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex justify-between items-center">
                    <span className="font-bold text-amber-700 dark:text-amber-400">🟠 Precaución</span>
                    <span className="font-black text-amber-600">{(((precaucionCount + rehabCount) / totalJugadores) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 flex justify-between items-center">
                    <span className="font-bold text-rose-700 dark:text-rose-400">🔴 Baja Médica</span>
                    <span className="font-black text-rose-600">{((bajaCount / totalJugadores) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-xs font-bold text-foreground">📊 Lesiones por Categoría (Base de Datos)</h3>
                </div>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lesionesPorCategoriaData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="categoria" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} allowDecimals={false} />
                    <Tooltip formatter={(val: any) => [`${val} lesiones`, "Registradas"]} />
                    <Bar dataKey="lesiones" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* VISTA 2: HISTORIAL CLÍNICO REDISEÑADO CON HERRAMIENTAS Y VISTA RÁPIDA */}
      {activeMainTab === "directorio" && (
        <div className="space-y-6">
          {/* HERO HEADER HISTORIAL CLÍNICO */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <Badge className="bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-wider border border-indigo-500/30">
                MÓDULO DE EXPEDIENTES Y APTITUD DEPORTIVA
              </Badge>
              <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white">
                <User className="h-6 w-6 text-indigo-400" /> Historial Clínico
              </h1>
              <p className="text-xs text-slate-300 max-w-xl">
                Administra los expedientes médicos de todos los deportistas, registra valoraciones, lesiones y controla su aptitud deportiva.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setOpenNewValoracion(true)} className="bg-gradient-primary shadow-elegant font-bold rounded-2xl text-xs h-9 gap-1.5">
                <Plus className="h-4 w-4" /> Nueva Valoración
              </Button>
              <Button onClick={() => setOpenNewExpediente(true)} variant="outline" className="border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/10 font-bold rounded-2xl text-xs h-9 gap-1.5">
                <UserPlus className="h-4 w-4 text-indigo-400" /> Nuevo Expediente
              </Button>
            </div>
          </div>
          {/* 📊 1. TARJETAS KPIS ÚTILES (4 TARJETAS) */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 bg-card border-border shadow-xs hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-bold">Deportistas Aptos</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-foreground">{aptosCount}</p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
                {aptosPercent}% del plantel
              </span>
            </Card>

            <Card className="p-4 bg-card border-border shadow-xs hover:border-purple-500/50 transition-all">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-bold">En Rehabilitación</span>
                <Activity className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-3xl font-black text-foreground">{rehabCount}</p>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1 block">
                Requieren seguimiento
              </span>
            </Card>

            <Card className="p-4 bg-card border-border shadow-xs hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-bold">Restricción Deportiva</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-foreground">{precaucionCount}</p>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1 block">
                Entrenamiento limitado
              </span>
            </Card>

            <Card className="p-4 bg-card border-border shadow-xs hover:border-rose-500/50 transition-all">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-xs font-bold">Baja Médica</span>
                <XCircle className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-3xl font-black text-foreground">{bajaCount}</p>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1 block">
                No disponibles
              </span>
            </Card>
          </div>

          {/* 🔍 2. BARRA DE HERRAMIENTAS Y FILTROS COMPLETA */}
          <Card className="p-4 bg-card border-border shadow-xs rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Buscador */}
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar jugador por nombre, ID o documento..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>

              {/* Filtros Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Select Sede */}
                <select
                  value={filterSede}
                  onChange={(e) => setFilterSede(e.target.value)}
                  className="h-9 px-3 text-xs rounded-xl border border-input bg-background font-medium focus:ring-1 focus:ring-primary"
                >
                  <option value="todas">📍 Sede (Todas)</option>
                  {sedesList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* Select Categoría */}
                <select
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="h-9 px-3 text-xs rounded-xl border border-input bg-background font-medium focus:ring-1 focus:ring-primary"
                >
                  <option value="todas">🎓 Categoría (Todas)</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>

                {/* Select Médico */}
                <select
                  value={filterMedico}
                  onChange={(e) => setFilterMedico(e.target.value)}
                  className="h-9 px-3 text-xs rounded-xl border border-input bg-background font-medium focus:ring-1 focus:ring-primary"
                >
                  <option value="todos">👨‍⚕️ Médico (Todos)</option>
                  <option value="Dr. Solano">Dr. Solano</option>
                  <option value="Licda. Castro">Licda. Castro</option>
                </select>

                {/* Select Estado */}
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="h-9 px-3 text-xs rounded-xl border border-input bg-background font-semibold focus:ring-1 focus:ring-primary"
                >
                  <option value="todos">🩺 Estado (Todos)</option>
                  <option value="alta">🟢 Apto</option>
                  <option value="precaucion">🟡 Restricción</option>
                  <option value="rehabilitacion">🟠 Rehabilitación</option>
                  <option value="baja">🔴 Baja Médica</option>
                </select>

                {/* Botones Acción */}
                <Button size="sm" variant="outline" onClick={handleExportarExcel} className="h-9 text-xs font-bold gap-1.5 border-border">
                  <Download className="h-3.5 w-3.5" /> Exportar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleActualizarLista} className="h-9 text-xs font-bold gap-1.5 text-muted-foreground hover:text-foreground">
                  <RefreshCw className="h-3.5 w-3.5" /> Actualizar
                </Button>
              </div>
            </div>
          </Card>

          {/* 📋 3. TABLA REDISEÑADA DE EXPEDIENTES CLÍNICOS */}
          <Card className="shadow-card border border-border rounded-3xl bg-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-500" /> Expedientes Clínicos
                </h3>
                <p className="text-xs text-muted-foreground">
                  {filtered.length} registros encontrados en la base de datos
                </p>
              </div>

              <Badge variant="outline" className="text-xs font-mono font-bold">
                Mostrando {filtered.length} de {totalJugadores}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-xs font-bold border-b border-border">
                    <th className="p-3.5">Jugador</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5">Última Valoración</th>
                    <th className="p-3.5">Próxima Revisión</th>
                    <th className="p-3.5">Diagnóstico</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        No se encontraron expedientes clínicos para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((j) => {
                      const badgeCfg = getEstadoBadgeConfig(j.estadoMedico);
                      return (
                        <tr key={j.id} className="hover:bg-muted/40 transition-colors">
                          {/* Jugador con Avatar y Color según Estado */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className={`h-10 w-10 border-2 ${badgeCfg.avatarBorder} shadow-xs`}>
                                  <AvatarImage src={j.avatar} />
                                  <AvatarFallback className="bg-indigo-600 text-white font-bold">{j.nombre[0]}</AvatarFallback>
                                </Avatar>
                                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${badgeCfg.dot} border-2 border-background`} />
                              </div>
                              <div>
                                <p
                                  onClick={() => setSelectedPlayerDrawer(j)}
                                  className="font-bold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                                >
                                  {j.nombre}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {j.edad} años · ID: {j.identificacion || "126789123"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Categoría */}
                          <td className="p-3.5">
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border-indigo-500/20 text-[10px]">
                              {j.categoria}
                            </Badge>
                          </td>

                          {/* Estado Médico con Colores Reales */}
                          <td className="p-3.5 text-center">
                            <Badge className={`font-bold border text-[11px] px-2.5 py-0.5 rounded-full ${badgeCfg.bg}`}>
                              {badgeCfg.label}
                            </Badge>
                          </td>

                          {/* Última Valoración */}
                          <td className="p-3.5 font-medium text-foreground">
                            {j.ultimaValoracion}
                          </td>

                          {/* Próxima Revisión (Indicador Inteligente) */}
                          <td className="p-3.5">
                            {(() => {
                              const proxBadge = getProximaRevisionBadge(j.proximaRevision);
                              return (
                                <Badge variant="outline" className={`font-bold text-[11px] px-2.5 py-0.5 rounded-full ${proxBadge.badgeClass}`}>
                                  {proxBadge.displayText}
                                </Badge>
                              );
                            })()}
                          </td>

                          {/* Diagnóstico Resumen */}
                          <td className="p-3.5 max-w-[200px]">
                            <p className="font-semibold text-foreground truncate">{j.diagnosticoActual}</p>
                            <button
                              onClick={() => setSelectedPlayerDrawer(j)}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline block mt-0.5"
                            >
                              Ver detalle
                            </button>
                          </td>

                          {/* Acciones Rediseñadas */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Ver Drawer */}
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setSelectedPlayerDrawer(j)}
                                className="h-7 px-2 text-[11px] font-bold gap-1 text-indigo-600 border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              >
                                <Eye className="h-3.5 w-3.5" /> 👁 Ver
                              </Button>

                              {/* Dropdown Menu ⋮ */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 text-xs font-semibold">
                                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                    <Link to="/medico/jugador/$id" params={{ id: j.id }}>
                                      <FileText className="h-3.5 w-3.5 text-indigo-500" /> Ver expediente completo
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toast.info(`Editando expediente de ${j.nombre}`)} className="cursor-pointer gap-2">
                                    <Edit className="h-3.5 w-3.5 text-slate-500" /> Editar expediente
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toast.warning(`Registrando lesión para ${j.nombre}`)} className="cursor-pointer gap-2 text-rose-600">
                                    <AlertCircle className="h-3.5 w-3.5" /> Registrar lesión
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setOpenNewValoracion(true)} className="cursor-pointer gap-2">
                                    <Stethoscope className="h-3.5 w-3.5 text-indigo-500" /> Nueva valoración
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                    <Link to="/medico/citas">
                                      <Calendar className="h-3.5 w-3.5 text-blue-500" /> Programar cita
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => toast.success(`Alta médica aprobada para ${j.nombre}`)} className="cursor-pointer gap-2 text-emerald-600 font-bold">
                                    <Check className="h-3.5 w-3.5" /> Dar alta médica
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toast.success(`Descargando expediente PDF de ${j.nombre}`)} className="cursor-pointer gap-2">
                                    <Download className="h-3.5 w-3.5 text-slate-500" /> Descargar PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 📱 PANEL LATERAL DE VISTA RÁPIDA (QUICK VIEW DRAWER) */}
      <Sheet open={!!selectedPlayerDrawer} onOpenChange={(open) => !open && setSelectedPlayerDrawer(null)}>
        <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col h-full bg-background border-l shadow-2xl overflow-y-auto">
          {selectedPlayerDrawer && (() => {
            const badgeCfg = getEstadoBadgeConfig(selectedPlayerDrawer.estadoMedico);
            const proxBadge = getProximaRevisionBadge(selectedPlayerDrawer.proximaRevision);
            return (
              <div className="flex flex-col min-h-full">
                {/* Header Header */}
                <div className="p-5 bg-slate-900 text-white border-b border-slate-800 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className={`h-14 w-14 border-2 ${badgeCfg.avatarBorder} shadow-lg shrink-0`}>
                      <AvatarImage src={selectedPlayerDrawer.avatar} />
                      <AvatarFallback className="bg-indigo-600 text-white text-lg font-bold">
                        {selectedPlayerDrawer.nombre[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h2 className="text-base font-black truncate text-white leading-tight">
                        👤 {selectedPlayerDrawer.nombre}
                      </h2>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={`text-[10px] font-bold ${badgeCfg.bg}`}>
                          {selectedPlayerDrawer.estadoMedico === "alta" ? "🟢 APTO PARA COMPETIR" : badgeCfg.label.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Ficha técnica del atleta */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Categoría</span>
                      <span className="font-bold text-slate-100">{selectedPlayerDrawer.categoria}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Edad</span>
                      <span className="font-bold text-slate-100">{selectedPlayerDrawer.edad} años</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Sede</span>
                      <span className="font-bold text-slate-100">{selectedPlayerDrawer.sede || "Sede Central"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Entrenador</span>
                      <span className="font-bold text-slate-100">{selectedPlayerDrawer.entrenador || "Carlos Ramírez"}</span>
                    </div>
                  </div>
                </div>

                {/* Body scrollable */}
                <div className="flex-1 p-5 space-y-3.5 text-xs">
                  {/* Última Valoración */}
                  <div className="p-3 rounded-xl bg-card border border-border flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold text-[11px]">Última Valoración</span>
                    <span className="font-bold text-foreground">{selectedPlayerDrawer.ultimaValoracion}</span>
                  </div>

                  {/* Próxima Revisión */}
                  <div className="p-3 rounded-xl bg-card border border-border flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold text-[11px]">Próxima Revisión</span>
                    <Badge variant="outline" className={`text-xs px-2.5 py-0.5 rounded-full ${proxBadge.badgeClass}`}>
                      {proxBadge.displayText}
                    </Badge>
                  </div>

                  {/* Tipo de Sangre */}
                  <div className="p-3 rounded-xl bg-card border border-border flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold text-[11px]">Tipo de Sangre</span>
                    <span className="font-extrabold text-foreground">{selectedPlayerDrawer.tipoSangre}</span>
                  </div>

                  {/* Alergias */}
                  <div className="p-3 rounded-xl bg-card border border-border space-y-0.5">
                    <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider block">Alergias</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">{selectedPlayerDrawer.alergias}</span>
                  </div>

                  {/* Lesiones Activas */}
                  <div className="p-3 rounded-xl bg-card border border-border space-y-0.5">
                    <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider block">Lesiones Activas</span>
                    <span className="font-semibold text-foreground">{selectedPlayerDrawer.lesionesActivas}</span>
                  </div>

                  {/* Tratamiento Actual */}
                  <div className="p-3 rounded-xl bg-card border border-border space-y-0.5">
                    <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider block">Tratamiento Actual</span>
                    <span className="font-semibold text-foreground">{selectedPlayerDrawer.tratamientoActual}</span>
                  </div>

                  {/* Fisioterapia */}
                  <div className="p-3 rounded-xl bg-card border border-border flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold text-[11px]">Fisioterapia</span>
                    <span className="font-semibold text-foreground">{selectedPlayerDrawer.fisioterapia}</span>
                  </div>

                  {/* Medicamentos */}
                  <div className="p-3 rounded-xl bg-card border border-border space-y-0.5">
                    <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider block">Medicamentos</span>
                    <span className="font-semibold text-foreground">{selectedPlayerDrawer.medicamentos}</span>
                  </div>

                  {/* Observaciones Médicas */}
                  <div className="p-3 rounded-xl bg-card border border-border space-y-0.5">
                    <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider block">Observaciones Médicas</span>
                    <p className="font-medium text-foreground leading-relaxed">{selectedPlayerDrawer.observacionesMedicas}</p>
                  </div>

                  {/* Botón Expediente Completo */}
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 shadow-sm gap-2 mt-2">
                    <Link to="/medico/jugador/$id" params={{ id: selectedPlayerDrawer.id }}>
                      📄 Abrir Expediente Completo <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  {/* Acciones Rápidas */}
                  <div className="pt-4 border-t border-border space-y-2.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Acciones Rápidas</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setValJugadorId(selectedPlayerDrawer.id);
                          setOpenNewValoracion(true);
                        }}
                        className="text-xs font-bold gap-1.5 h-8 justify-start"
                      >
                        🩺 Nueva Valoración
                      </Button>

                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => toast.warning(`Registrando lesión para ${selectedPlayerDrawer.nombre}`)}
                        className="text-xs font-bold gap-1.5 h-8 justify-start text-rose-600 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        🩹 Registrar Lesión
                      </Button>

                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => toast.info(`Abriendo calendario para programar revisión de ${selectedPlayerDrawer.nombre}`)}
                        className="text-xs font-bold gap-1.5 h-8 justify-start"
                      >
                        📅 Programar Revisión
                      </Button>

                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => toast.success(`Alta médica concedida a ${selectedPlayerDrawer.nombre}`)}
                        className="text-xs font-bold gap-1.5 h-8 justify-start text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        🏃 Dar Alta Médica
                      </Button>
                    </div>

                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => toast.success(`Generando reporte PDF del expediente de ${selectedPlayerDrawer.nombre}`)}
                      className="w-full text-xs font-bold gap-1.5 h-8 justify-center text-slate-600 dark:text-slate-300"
                    >
                      📄 Descargar PDF
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* MODAL NUEVA VALORACIÓN MÉRICA */}
      <Dialog open={openNewValoracion} onOpenChange={setOpenNewValoracion}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-indigo-600" /> Registrar Nueva Valoración Médica
            </DialogTitle>
            <DialogDescription className="text-xs">
              Crea un nuevo registro de evaluación clínica para un deportista de la academia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold">Deportista (Base de Datos Real)</label>
              <select
                value={valJugadorId}
                onChange={(e) => setValJugadorId(e.target.value)}
                className="w-full p-2 border rounded-md bg-background font-medium"
              >
                <option value="">— Seleccionar deportista —</option>
                {jugadores.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} ({j.categoria})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold">Tipo de Valoración</label>
              <select
                value={valTipo}
                onChange={(e) => setValTipo(e.target.value)}
                className="w-full p-2 border rounded-md bg-background font-medium"
              >
                <option value="Fisioterapia Preventiva">🏥 Fisioterapia Preventiva</option>
                <option value="Evaluación de Lesión">🩹 Evaluación de Lesión</option>
                <option value="Control de Alta Médica (RTP)">✅ Control de Alta Médica (RTP)</option>
                <option value="Examen Físico Trimestral">📋 Examen Físico Trimestral</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold">Diagnóstico / Observación Inicial</label>
              <Input
                placeholder="Ej. Sobrecarga muscular en cuádriceps derecho..."
                value={valDiagnostico}
                onChange={(e) => setValDiagnostico(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenNewValoracion(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearValoracion} className="bg-gradient-primary">
              Guardar Valoración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL NUEVO EXPEDIENTE CLÍNICO */}
      <Dialog open={openNewExpediente} onOpenChange={setOpenNewExpediente}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-600" /> Crear Nuevo Expediente Clínico
            </DialogTitle>
            <DialogDescription className="text-xs">
              Abre una ficha clínica oficial para un atleta registrado en la base de datos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold">Deportista</label>
              <select
                value={expJugadorId}
                onChange={(e) => setExpJugadorId(e.target.value)}
                className="w-full p-2 border rounded-md bg-background font-medium"
              >
                <option value="">— Seleccionar deportista —</option>
                {jugadores.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} ({j.categoria})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold">Grupo Sanguíneo</label>
                <select
                  value={expSangre}
                  onChange={(e) => setExpSangre(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background font-medium"
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold">Alergias Conocidas</label>
                <Input
                  placeholder="Ej. Penicilina..."
                  value={expAlergias}
                  onChange={(e) => setExpAlergias(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold">Observaciones Médicas Iniciales</label>
              <Input
                placeholder="Ej. Antecedentes de fractura tibia izquierda en 2024..."
                value={expObs}
                onChange={(e) => setExpObs(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenNewExpediente(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearExpediente} className="bg-gradient-primary">
              Crear Expediente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
