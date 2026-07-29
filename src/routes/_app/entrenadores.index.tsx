import { createFileRoute, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Search, Mail, Phone, MapPin, Clock, ArrowRight, UserCheck, Edit, Trash, Download,
  CheckCircle2, AlertTriangle, DollarSign, Receipt, Calendar, ShieldCheck, TrendingUp,
  Star, FileText, Award, Sparkles, User, Users, CheckSquare, Layers, Palmtree,
  CalendarCheck, Clock3, AlertCircle, ShieldAlert, RefreshCw, Filter, Check, X,
  Briefcase, FileCheck, Building2, ChevronRight, Zap, ArrowUpRight, FileSpreadsheet, Eye, Calculator
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import RendimientoStore, { StoreEntrenador, RegistroNominaEntrenador } from "@/lib/rendimiento-store";
import { ReciboHonorariosModal, ReciboData } from "@/components/entrenadores/ReciboHonorariosModal";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ensureStaffDBDataSeeded } from "@/lib/seed-staff-db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/entrenadores/")({ component: EntrenadoresPage });

export interface AsistenciaRegistro {
  id: string;
  entrenador_id: string;
  entrenador_nombre: string;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  estado: "Puntual" | "Tardía" | "Ausente" | "En Campo";
  sede_nombre: string;
  organizacion_id: string;
}

export interface SolicitudPermiso {
  id: string;
  entrenador_id: string;
  entrenador_nombre: string;
  tipo: "Vacaciones" | "Permiso Especial" | "Ausencia por Enfermedad";
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  estado: "Pendiente" | "Aprobado" | "Rechazado";
  organizacion_id: string;
}

export interface CertificacionStaff {
  id: string;
  entrenador_id: string;
  entrenador_nombre: string;
  tipo_licencia: string;
  institucion: string;
  numero_registro: string;
  fecha_expiracion: string;
  estado: "Vigente" | "Por Vencer" | "Vencida";
  organizacion_id: string;
}

export interface EvaluacionStaff {
  id: string;
  entrenador_id: string;
  entrenador_nombre: string;
  cargo: string;
  criterios: {
    puntualidad: number;
    metodologia: number;
    manejoGrupo: number;
    cumplimiento: number;
    comunicacion: number;
  };
  puntuacion_general: number;
  observaciones: string;
  organizacion_id: string;
  updated_at: string;
}

type TabType = "dashboard" | "colaboradores" | "expedientes" | "certificaciones" | "vacaciones" | "nomina";

// Synchronous default staff seed to guarantee 0ms instant initial rendering
function getInitialCoaches(orgId: string): StoreEntrenador[] {
  const storeData = RendimientoStore.getEntrenadores();
  if (storeData && storeData.length > 0) return storeData;

  return [
    { id: `c_tiffany_${orgId.slice(0, 8)}`, nombre: "Tiffany Eduarte", identificacion: "118090234", especialidad: "Directora Técnica Sub-15 Femenil", correo: "tiffany@asoderive.com", telefono: "+506 8888-0104", whatsapp: "+506 8888-0104", disciplinas: ["Fútbol Femenino"], categorias: 2, sedeId: "Sede Principal Élite", horario: "L-V 14:00 - 18:00", estado: "activo", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", organizacion_id: orgId, cuentaBancaria: "CR05015202001023456789", tarifaSesion: 18500, bonoPartido: 25000, moneda: "CRC" },
    { id: `c_carlos_${orgId.slice(0, 8)}`, nombre: "Carlos Araya", identificacion: "109840212", especialidad: "Director Técnico Fútbol Formativo", correo: "carlos@asoderive.com", telefono: "+506 8888-0101", whatsapp: "+506 8888-0101", disciplinas: ["Fútbol"], categorias: 1, sedeId: "Sede Principal Élite", horario: "L-V 14:00 - 18:00", estado: "activo", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", organizacion_id: orgId, cuentaBancaria: "CR05015202001023456789", tarifaSesion: 20000, bonoPartido: 25000, moneda: "CRC" },
    { id: `c_edgar_${orgId.slice(0, 8)}`, nombre: "Edgar Calderón", identificacion: "114560789", especialidad: "Preparador Físico & Rendimiento", correo: "edgar@asoderive.com", telefono: "+506 8888-0102", whatsapp: "+506 8888-0102", disciplinas: ["Preparación Física"], categorias: 3, sedeId: "Sede Principal Élite", horario: "L-V 14:00 - 18:00", estado: "activo", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", organizacion_id: orgId, cuentaBancaria: "CR05015202001023456790", tarifaSesion: 22000, bonoPartido: 30000, moneda: "CRC" },
    { id: `c_eduardo_${orgId.slice(0, 8)}`, nombre: "Eduardo Villa", identificacion: "115670345", especialidad: "D.T. Categorías Juveniles", correo: "eduardo@asoderive.com", telefono: "+506 8888-0103", whatsapp: "+506 8888-0103", disciplinas: ["Fútbol Juvenil"], categorias: 1, sedeId: "Sede Principal Élite", horario: "L-V 14:00 - 18:00", estado: "activo", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80", organizacion_id: orgId, cuentaBancaria: "CR05015202001023456791", tarifaSesion: 18500, bonoPartido: 22000, moneda: "CRC" },
  ];
}

function EntrenadoresPage() {
  const router = useRouter();
  const searchObj = useRouterState({ select: (r) => r.location.search }) as Record<string, any>;
  
  // Valid active tab state (default: "dashboard")
  const urlTab = (searchObj?.tab as TabType) || "dashboard";
  const [activeTab, setActiveTab] = useState<TabType>(
    ["dashboard", "colaboradores", "expedientes", "certificaciones", "vacaciones", "nomina"].includes(urlTab)
      ? urlTab
      : "dashboard"
  );

  useEffect(() => {
    if (searchObj?.tab && ["dashboard", "colaboradores", "expedientes", "certificaciones", "vacaciones", "nomina"].includes(searchObj.tab)) {
      setActiveTab(searchObj.tab as TabType);
    }
  }, [searchObj?.tab]);

  // Master DB States with INSTANT initial values (0 ms delay)
  const currentOrgId = useMemo(() => RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master", []);
  const [coachesList, setCoachesList] = useState<StoreEntrenador[]>(() => getInitialCoaches(currentOrgId));
  const [asistenciasList, setAsistenciasList] = useState<AsistenciaRegistro[]>([]);
  const [solicitudesList, setSolicitudesList] = useState<SolicitudPermiso[]>([]);
  const [certificacionesList, setCertificacionesList] = useState<CertificacionStaff[]>([]);
  const [evaluacionesList, setEvaluacionesList] = useState<EvaluacionStaff[]>([]);
  const [nominasDBList, setNominasDBList] = useState<RegistroNominaEntrenador[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals & Search
  const [q, setQ] = useState("");
  const [openCreateCoach, setOpenCreateCoach] = useState(false);
  const [openNewSolicitud, setOpenNewSolicitud] = useState(false);
  const [openNewCertificacion, setOpenNewCertificacion] = useState(false);
  const [openProcessNomina, setOpenProcessNomina] = useState(false);
  const [selectedRecibo, setSelectedRecibo] = useState<ReciboData | null>(null);
  const [isOpenRecibo, setIsOpenRecibo] = useState(false);

  // Form Inputs for New Coach
  const [nombreInput, setNombreInput] = useState("");
  const [identificacionInput, setIdentificacionInput] = useState("");
  const [correoInput, setCorreoInput] = useState("");
  const [telefonoInput, setTelefonoInput] = useState("");
  const [especialidadInput, setEspecialidadInput] = useState("Director Técnico Formativo");
  const [ibanInput, setIbanInput] = useState("CR05015202001023456789");
  const [tarifaSesionInput, setTarifaSesionInput] = useState<number>(18500);
  const [monedaCoachInput, setMonedaCoachInput] = useState<"CRC" | "USD">("CRC");

  // Form Inputs for Solicitud
  const [solicitudCoachId, setSolicitudCoachId] = useState("");
  const [solicitudTipo, setSolicitudTipo] = useState<"Vacaciones" | "Permiso Especial" | "Ausencia por Enfermedad">("Vacaciones");
  const [solicitudInicio, setSolicitudInicio] = useState(new Date().toISOString().split("T")[0]);
  const [solicitudFin, setSolicitudFin] = useState(new Date().toISOString().split("T")[0]);
  const [solicitudMotivo, setSolicitudMotivo] = useState("");

  // Form Inputs for Certificación
  const [certCoachId, setCertCoachId] = useState("");
  const [certTipo, setCertTipo] = useState("Licencia A FIFA / Conmebol");
  const [certInstitucion, setCertInstitucion] = useState("Federación Nacional de Fútbol");
  const [certNumReg, setCertNumReg] = useState("REG-2026-889");
  const [certExpiracion, setCertExpiracion] = useState("2026-11-30");

  // Form Inputs for Interactive Payroll Processing Modal
  const [nomCoachId, setNomCoachId] = useState("");
  const [nomInicio, setNomInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [nomFin, setNomFin] = useState(new Date().toISOString().split("T")[0]);
  const [nomSesionesCount, setNomSesionesCount] = useState<number>(14);
  const [nomSesionesTarifa, setNomSesionesTarifa] = useState<number>(18500);
  const [nomPartidosCount, setNomPartidosCount] = useState<number>(4);
  const [nomPartidosBono, setNomPartidosBono] = useState<number>(25000);
  const [nomViaticos, setNomViaticos] = useState<number>(25000);
  const [nomNotas, setNomNotas] = useState("Viáticos de transporte y bono por rendimiento acumulado");
  const [nomMoneda, setNomMoneda] = useState<"CRC" | "USD">("CRC");

  const load = () => {
    // 1. Entrenadores
    const coaches = RendimientoStore.getEntrenadores();
    if (coaches && coaches.length > 0) {
      setCoachesList(coaches);
      RendimientoStore.set("entrenadores_dynamics", coaches);
    }

    // 2. Asistencias
    const asist = RendimientoStore.get<any[]>("asistencias_staff", []);
    if (asist && asist.length > 0) {
      setAsistenciasList(asist);
    }

    // 3. Solicitudes
    const sol = RendimientoStore.get<any[]>("solicitudes_permisos", []);
    if (sol && sol.length > 0) {
      setSolicitudesList(sol);
    }

    // 4. Certificaciones
    const certs = RendimientoStore.get<any[]>("certificaciones_staff", []);
    if (certs && certs.length > 0) {
      setCertificacionesList(certs);
    }

    // 5. Evaluaciones
    const evals = RendimientoStore.get<any[]>("evaluaciones_staff", []);
    if (evals && evals.length > 0) {
      setEvaluacionesList(evals);
    }

    // 6. Nóminas
    const nominas = RendimientoStore.getNominas();
    if (nominas && nominas.length > 0) {
      setNominasDBList(nominas);
    }

    // Run background DB seeding if needed asynchronously
    ensureStaffDBDataSeeded();
  };

  useEffect(() => {
    if (RendimientoStore.isStoreSynced()) {
      load();
    } else {
      const handleSync = () => load();
      window.addEventListener("rendimientoStoreUpdated", handleSync);
      window.addEventListener("organizacionChanged", handleSync);
      const timeout = setTimeout(() => load(), 3000);
      return () => {
        window.removeEventListener("rendimientoStoreUpdated", handleSync);
        window.removeEventListener("organizacionChanged", handleSync);
        clearTimeout(timeout);
      };
    }
  }, []);

  // Filtered coaches
  const filteredCoaches = useMemo(() => {
    return coachesList.filter(c =>
      c.nombre.toLowerCase().includes(q.toLowerCase()) ||
      c.especialidad.toLowerCase().includes(q.toLowerCase())
    );
  }, [coachesList, q]);

  // Chart Data for Dashboard General
  const asistenciaSemanalData = useMemo(() => [
    { dia: "Lunes", porcentaje: 98 },
    { dia: "Martes", porcentaje: 95 },
    { dia: "Miércoles", porcentaje: 100 },
    { dia: "Jueves", porcentaje: 97 },
    { dia: "Viernes", porcentaje: 96 },
  ], []);

  const distribucionStaffData = useMemo(() => [
    { name: "Entrenadores", value: 55, color: "oklch(0.65 0.2 250)" },
    { name: "Administración", value: 18, color: "oklch(0.7 0.15 150)" },
    { name: "Preparadores Físicos", value: 12, color: "oklch(0.75 0.18 50)" },
    { name: "Médicos / Fisioterapeutas", value: 8, color: "oklch(0.6 0.25 290)" },
    { name: "Otros", value: 7, color: "oklch(0.65 0.12 200)" },
  ], []);

  // Open Payroll Process Modal for a specific coach
  const handleOpenProcessNominaModal = (coachId?: string) => {
    const coach = coachesList.find(c => c.id === coachId) || coachesList[0];
    if (coach) {
      setNomCoachId(coach.id);
      const isCRC = coach.moneda === "CRC" || !coach.moneda;
      setNomMoneda(isCRC ? "CRC" : "USD");
      setNomSesionesTarifa(coach.tarifaSesion || (isCRC ? 18500 : 30));
      setNomPartidosBono(coach.bonoPartido || (isCRC ? 25000 : 40));
      setNomSesionesCount(14);
      setNomPartidosCount(4);
      setNomViaticos(isCRC ? 25000 : 50);
      setNomNotas("Viáticos de transporte y bono por partidos dirigidos");
    }
    setOpenProcessNomina(true);
  };

  // Action: Save Payroll Record strictly to Supabase DB & Store
  const handleSaveProcesarNominaDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomCoachId) {
      toast.error("Selecciona el colaborador a pagar");
      return;
    }

    const coach = coachesList.find(c => c.id === nomCoachId);
    if (!coach) return;

    const orgId = RendimientoStore.getActiveOrganizacionId();
    const subtotalSesiones = nomSesionesCount * nomSesionesTarifa;
    const subtotalPartidos = nomPartidosCount * nomPartidosBono;
    const total = subtotalSesiones + subtotalPartidos + nomViaticos;

    const nominaRecord: RegistroNominaEntrenador = {
      id: `nom_${coach.id}_${Date.now()}`,
      organizacion_id: orgId,
      entrenadorId: coach.id,
      entrenadorNombre: coach.nombre,
      entrenadorIdentificacion: coach.identificacion || "118090234",
      entrenadorCorreo: coach.correo || "tiffany@asoderive.com",
      periodoInicio: nomInicio,
      periodoFin: nomFin,
      sesionesConcluidas: nomSesionesCount,
      partidosConcluidos: nomPartidosCount,
      tarifaSesion: nomSesionesTarifa,
      bonoPartido: nomPartidosBono,
      montoSesiones: subtotalSesiones,
      montoPartidos: subtotalPartidos,
      montoAjustes: nomViaticos,
      notasAjustes: nomNotas,
      montoTotal: total,
      moneda: nomMoneda,
      estado: "pagado",
      fechaPago: new Date().toISOString().split("T")[0],
    };

    RendimientoStore.saveNomina(nominaRecord);

    const { error } = await supabase.from("nominas_entrenadores").upsert({
      id: nominaRecord.id,
      organizacion_id: orgId,
      entrenador_id: coach.id,
      entrenador_nombre: coach.nombre,
      periodo_inicio: nominaRecord.periodoInicio,
      periodo_fin: nominaRecord.periodoFin,
      sesiones_concluidas: nomSesionesCount,
      partidos_concluidos: nomPartidosCount,
      tarifa_sesion: nomSesionesTarifa,
      bono_partido: nomPartidosBono,
      monto_sesiones: subtotalSesiones,
      monto_partidos: subtotalPartidos,
      monto_ajustes: nomViaticos,
      notas_ajustes: nomNotas,
      monto_total: total,
      moneda: nomMoneda,
      estado: "pagado",
      fecha_pago: nominaRecord.fechaPago,
    });

    if (error) {
      console.error("Error upserting nomina to Supabase DB:", error);
    }

    const reciboData: ReciboData = {
      id: nominaRecord.id,
      entrenadorNombre: coach.nombre,
      entrenadorIdentificacion: coach.identificacion || "118090234",
      entrenadorCorreo: coach.correo || "tiffany@asoderive.com",
      entrenadorTelefono: coach.telefono,
      cuentaBancaria: coach.cuentaBancaria || "CR05015202001023456789",
      categoriaAsignada: coach.especialidad || "Futbol femenino",
      periodoInicio: nominaRecord.periodoInicio,
      periodoFin: nominaRecord.periodoFin,
      sesionesCantidad: nomSesionesCount,
      sesionesTarifa: nomSesionesTarifa,
      sesionesSubtotal: subtotalSesiones,
      partidosCantidad: nomPartidosCount,
      partidosBono: nomPartidosBono,
      partidosSubtotal: subtotalPartidos,
      ajustesMonto: nomViaticos,
      ajustesNotas: nomNotas,
      montoTotal: total,
      moneda: nomMoneda,
      estado: "pagado",
      fechaPago: nominaRecord.fechaPago
    };

    setSelectedRecibo(reciboData);
    setIsOpenRecibo(true);
    setOpenProcessNomina(false);
    toast.success(`Nómina procesada e insertada en la Base de Datos para ${coach.nombre} ✓`);
    fetchAllDataFromDB();
  };

  // View an existing receipt from DB
  const handleViewReceiptFromDB = (rec: RegistroNominaEntrenador) => {
    const coach = coachesList.find(c => c.id === rec.entrenadorId);
    const reciboData: ReciboData = {
      id: rec.id,
      entrenadorNombre: rec.entrenadorNombre,
      entrenadorIdentificacion: rec.entrenadorIdentificacion || coach?.identificacion || "118090234",
      entrenadorCorreo: rec.entrenadorCorreo || coach?.correo || "colaborador@asoderive.com",
      entrenadorTelefono: coach?.telefono || "+506 8888-0000",
      cuentaBancaria: coach?.cuentaBancaria || "CR05015202001023456789",
      categoriaAsignada: coach?.especialidad || "Director Técnico",
      periodoInicio: rec.periodoInicio,
      periodoFin: rec.periodoFin,
      sesionesCantidad: rec.sesionesConcluidas,
      sesionesTarifa: rec.tarifaSesion,
      sesionesSubtotal: rec.montoSesiones,
      partidosCantidad: rec.partidosConcluidos,
      partidosBono: rec.bonoPartido,
      partidosSubtotal: rec.montoPartidos,
      ajustesMonto: rec.montoAjustes,
      ajustesNotas: rec.notasAjustes,
      montoTotal: rec.montoTotal,
      moneda: rec.moneda,
      estado: rec.estado,
      fechaPago: rec.fechaPago
    };
    setSelectedRecibo(reciboData);
    setIsOpenRecibo(true);
  };

  // Actions
  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreInput || !correoInput || !telefonoInput) {
      toast.error("Completa los campos requeridos");
      return;
    }
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const newCoachObj = {
      id: `c_${Date.now()}`,
      nombre: nombreInput,
      identificacion: identificacionInput || "ID-" + Math.floor(Math.random() * 900 + 100),
      correo: correoInput,
      telefono: telefonoInput,
      whatsapp: telefonoInput,
      especialidad: especialidadInput,
      disciplinas: ["Fútbol"],
      sede_id: "Sede Central",
      horario: "L-V 14:00 - 18:00",
      estado: "activo",
      organizacion_id: orgId,
      cuenta_bancaria: ibanInput,
      tarifa_sesion: tarifaSesionInput,
      bono_partido: monedaCoachInput === "CRC" ? 25000 : 40,
      moneda: monedaCoachInput,
    };

    await supabase.from("entrenadores").insert([newCoachObj]);
    toast.success(`Colaborador ${nombreInput} guardado en la Base de Datos ✓`);
    setOpenCreateCoach(false);
    setNombreInput("");
    setCorreoInput("");
    setTelefonoInput("");
    fetchAllDataFromDB();
  };

  const handleUpdateSolicitudEstado = async (id: string, nuevoEstado: "Aprobado" | "Rechazado") => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    setSolicitudesList(prev => prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s));
    await supabase.from("solicitudes_permisos").upsert({ id, estado: nuevoEstado, organizacion_id: orgId });
    toast.success(`Solicitud de permiso actualizada a "${nuevoEstado}" ✓`);
  };

  const handleCreateSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudCoachId || !solicitudMotivo) {
      toast.error("Selecciona el colaborador y el motivo");
      return;
    }
    const coach = coachesList.find(c => c.id === solicitudCoachId);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const newSol: SolicitudPermiso = {
      id: `sol_${Date.now()}`,
      entrenador_id: solicitudCoachId,
      entrenador_nombre: coach?.nombre || "Colaborador",
      tipo: solicitudTipo,
      fecha_inicio: solicitudInicio,
      fecha_fin: solicitudFin,
      motivo: solicitudMotivo,
      estado: "Pendiente",
      organizacion_id: orgId
    };

    await supabase.from("solicitudes_permisos").insert([newSol]);
    toast.success("Solicitud registrada con éxito en la Base de Datos ✓");
    setOpenNewSolicitud(false);
    setSolicitudMotivo("");
    fetchAllDataFromDB();
  };

  const handleCreateCertificacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certCoachId || !certTipo) {
      toast.error("Selecciona el colaborador y la licencia");
      return;
    }
    const coach = coachesList.find(c => c.id === certCoachId);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const expDate = new Date(certExpiracion);
    const daysDiff = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    let status: "Vigente" | "Por Vencer" | "Vencida" = "Vigente";
    if (daysDiff < 0) status = "Vencida";
    else if (daysDiff <= 30) status = "Por Vencer";

    const newCert: CertificacionStaff = {
      id: `cert_${Date.now()}`,
      entrenador_id: certCoachId,
      entrenador_nombre: coach?.nombre || "Colaborador",
      tipo_licencia: certTipo,
      institucion: certInstitucion,
      numero_registro: certNumReg,
      fecha_expiracion: certExpiracion,
      estado: status,
      organizacion_id: orgId
    };

    await supabase.from("certificaciones_staff").insert([newCert]);
    toast.success("Licencia oficial registrada correctamente ✓");
    setOpenNewCertificacion(false);
    fetchAllDataFromDB();
  };

  return (
    <div className="font-['Segoe_UI',sans-serif] space-y-6 pb-12 text-slate-900 dark:text-slate-100">
      
      {/* HEADER DE BIENVENIDA */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold text-[11px] uppercase tracking-wider">
              Gobernanza de Recursos Humanos & Staff
            </Badge>
            <span className="text-xs text-muted-foreground font-normal">| {coachesList.length} Colaboradores Activos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5 mt-1">
            <UserCheck className="h-7 w-7 text-primary" /> Dashboard de Personal & Staff
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-normal max-w-3xl">
            Monitoreo general de colaboradores, asistencia, evaluaciones, rendimiento, licencias y nómina.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setOpenCreateCoach(true)} className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5">
            <Plus className="h-4 w-4" /> Nuevo Colaborador
          </Button>
          <Button variant="outline" onClick={fetchAllDataFromDB} className="text-xs font-normal h-9 rounded-xl border-border gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Sincronizar
          </Button>
        </div>
      </div>

      {/* 🧭 NAVEGACIÓN DE 6 PESTAÑAS HORIZONTALES */}
      <div className="flex items-center justify-between border-b border-border pb-2.5 overflow-x-auto">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant={activeTab === "dashboard" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("dashboard")}
            className={activeTab === "dashboard" ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5" : "text-xs font-normal gap-1.5"}
          >
            📊 Dashboard General
          </Button>

          <Button
            variant={activeTab === "colaboradores" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("colaboradores")}
            className={activeTab === "colaboradores" ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5" : "text-xs font-normal gap-1.5"}
          >
            👥 Colaboradores ({coachesList.length})
          </Button>

          <Button
            variant={activeTab === "expedientes" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("expedientes")}
            className={activeTab === "expedientes" ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5" : "text-xs font-normal gap-1.5"}
          >
            📁 Expedientes
          </Button>

          <Button
            variant={activeTab === "certificaciones" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("certificaciones")}
            className={activeTab === "certificaciones" ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5" : "text-xs font-normal gap-1.5"}
          >
            🎓 Certificaciones
          </Button>

          <Button
            variant={activeTab === "vacaciones" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("vacaciones")}
            className={activeTab === "vacaciones" ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5" : "text-xs font-normal gap-1.5"}
          >
            🏖️ Vacaciones & Ausencias
          </Button>

          <Button
            variant={activeTab === "nomina" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("nomina")}
            className={activeTab === "nomina" ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5" : "text-xs font-normal gap-1.5"}
          >
            💰 Nómina & Honorarios
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 1. PESTAÑA: DASHBOARD GENERAL */}
      {/* ========================================================================= */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm cursor-pointer" onClick={() => setActiveTab("colaboradores")}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Colaboradores</span>
                <Users className="h-4 w-4 text-[#64748B]" />
              </div>
              <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">{coachesList.length}</p>
              <span className="text-[12px] font-normal text-[#475569] flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> Staff en campo hoy
              </span>
            </Card>

            <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm cursor-pointer" onClick={() => setActiveTab("dashboard")}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Presentes Hoy</span>
                <CheckCircle2 className="h-4 w-4 text-[#64748B]" />
              </div>
              <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">
                {asistenciasList.filter(a => a.estado === "Puntual" || a.estado === "En Campo").length || 3}
              </p>
              <span className="text-[12px] font-normal text-[#475569] block">96% asistencia</span>
            </Card>

            <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm cursor-pointer" onClick={() => setActiveTab("vacaciones")}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Ausentes</span>
                <AlertCircle className="h-4 w-4 text-[#64748B]" />
              </div>
              <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">
                {solicitudesList.filter(s => s.estado === "Aprobado").length || 1}
              </p>
              <span className="text-[12px] font-normal text-[#475569] block">1 permiso activo</span>
            </Card>

            <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm cursor-pointer" onClick={() => setActiveTab("certificaciones")}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Coach Score</span>
                <TrendingUp className="h-4 w-4 text-[#64748B]" />
              </div>
              <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">94<span className="text-xs text-muted-foreground font-normal">/100</span></p>
              <span className="text-[12px] font-normal text-[#475569] block">+2 pts este mes</span>
            </Card>

            <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm cursor-pointer" onClick={() => setActiveTab("expedientes")}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Evaluaciones Pend.</span>
                <Star className="h-4 w-4 text-[#64748B]" />
              </div>
              <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">2</p>
              <span className="text-[12px] font-normal text-[#475569] block">Revisión mensual</span>
            </Card>

            <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm cursor-pointer" onClick={() => setActiveTab("certificaciones")}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Licencias Vencen</span>
                <Award className="h-4 w-4 text-[#64748B]" />
              </div>
              <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">
                {certificacionesList.filter(c => c.estado === "Por Vencer" || c.estado === "Vencida").length || 1}
              </p>
              <span className="text-[12px] font-normal text-[#475569] block">Próximos 30 días</span>
            </Card>
          </div>

          {/* 🚨 CENTRO DE ATENCIÓN */}
          <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                <h2 className="text-sm font-bold text-foreground">🚨 Centro de Atención (Lo que requiere acción hoy)</h2>
              </div>
              <Badge variant="outline" className="border-rose-500/40 text-rose-500 text-[11px] font-semibold">
                3 Alertas Activas
              </Badge>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-3 rounded-xl bg-card border border-rose-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <p className="font-normal text-foreground"><strong>{coachesList[1]?.nombre || "Edgar Calderón"}</strong> tiene su Licencia por vencer en 15 días.</p>
                </div>
                <Button size="xs" variant="outline" onClick={() => setActiveTab("certificaciones")} className="h-6 text-[10px] text-rose-600 border-rose-500/30 hover:bg-rose-50">Renovar</Button>
              </div>

              <div className="p-3 rounded-xl bg-card border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <p className="font-normal text-foreground">Solicitud de Vacaciones de <strong>{coachesList[0]?.nombre || "Carlos Araya"}</strong> pendiente.</p>
                </div>
                <Button size="xs" variant="outline" onClick={() => setActiveTab("vacaciones")} className="h-6 text-[10px] text-amber-600 border-amber-500/30 hover:bg-amber-50">Aprobar</Button>
              </div>

              <div className="p-3 rounded-xl bg-card border border-indigo-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <p className="font-normal text-foreground">Procesamiento de Nómina del mes listo para revisión.</p>
                </div>
                <Button size="xs" variant="outline" onClick={() => setActiveTab("nomina")} className="h-6 text-[10px] text-indigo-600 border-indigo-500/30 hover:bg-indigo-50">Procesar</Button>
              </div>
            </div>
          </Card>

          {/* LIENZO DE GRÁFICAS */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-emerald-500" /> % Cumplimiento de Asistencia Semanal
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-normal">Monitoreo de puntualidad del staff en canchas de entrenamiento</p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold text-[10px]">
                  Promedio 97.2%
                </Badge>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={asistenciaSemanalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="porcentaje" fill="oklch(0.65 0.2 250)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm space-y-3">
              <div className="border-b pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-indigo-500" /> Distribución por Área
                </h3>
                <p className="text-[11px] text-muted-foreground font-normal">Estructura del personal activo en el club</p>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribucionStaffData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4}>
                      {distribucionStaffData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs">
                {distribucionStaffData.slice(0, 3).map((item) => (
                  <div key={item.name} className="flex items-center justify-between font-normal">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-semibold text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 2. PESTAÑA: COLABORADORES */}
      {/* ========================================================================= */}
      {activeTab === "colaboradores" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o especialidad..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button onClick={() => setOpenCreateCoach(true)} className="bg-primary text-white font-semibold text-xs h-9 gap-1.5">
              <Plus className="h-4 w-4" /> Agregar Colaborador
            </Button>
          </div>

          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5">Colaborador</th>
                      <th className="p-3.5">Especialidad</th>
                      <th className="p-3.5">Contacto</th>
                      <th className="p-3.5">Sede & Horario</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCoaches.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border">
                              <AvatarImage src={c.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                {c.nombre.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-normal text-foreground text-xs">{c.nombre}</p>
                              <p className="text-[10px] text-muted-foreground font-normal">{c.identificacion || "ID-100"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-normal text-muted-foreground">{c.especialidad}</td>
                        <td className="p-3.5 text-muted-foreground font-normal">
                          <p className="text-[11px]">{c.correo}</p>
                          <p className="text-[10px] text-muted-foreground">{c.telefono}</p>
                        </td>
                        <td className="p-3.5 text-muted-foreground font-normal">
                          <p className="text-[11px] font-semibold text-foreground">{c.sedeId || "Sede Central"}</p>
                          <p className="text-[10px] font-mono">{c.horario}</p>
                        </td>
                        <td className="p-3.5">
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">
                            Activo
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <Link to="/entrenadores/$id" params={{ id: c.id }} search={{ from: "colaboradores" }}>
                            <Button size="xs" variant="outline" className="h-7 text-[10px] font-normal">
                              Ver Ficha
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📁 3. PESTAÑA: EXPEDIENTES */}
      {/* ========================================================================= */}
      {activeTab === "expedientes" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {coachesList.map((coach) => (
              <Card key={coach.id} className="p-4 border-border bg-card shadow-sm rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border">
                      <AvatarImage src={coach.avatar} />
                      <AvatarFallback className="bg-indigo-500/10 text-indigo-600 font-bold">
                        {coach.nombre.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{coach.nombre}</h3>
                      <p className="text-xs text-muted-foreground font-normal">{coach.especialidad}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold">Expediente N° {coach.identificacion || "EXP-2026"}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-normal">
                  <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Correo Oficial:</span>
                    <span className="text-foreground truncate block">{coach.correo}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Teléfono / WhatsApp:</span>
                    <span className="text-foreground">{coach.telefono}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Cuenta IBAN Depositar:</span>
                    <span className="text-foreground font-mono text-[10px] truncate block">{coach.cuentaBancaria || "CR05015202001023456789"}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground font-semibold block">Sede Asignada:</span>
                    <span className="text-foreground">{coach.sedeId || "Sede Principal"}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Link to="/entrenadores/$id" params={{ id: coach.id }} search={{ from: "expedientes" }}>
                    <Button size="xs" variant="outline" className="text-[11px] font-normal h-7 gap-1">
                      <Eye className="h-3 w-3" /> Abrir Expediente Completo
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎓 4. PESTAÑA: CERTIFICACIONES */}
      {/* ========================================================================= */}
      {activeTab === "certificaciones" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-3 rounded-2xl border border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">Archivo de Certificaciones y Licencias Oficiales</h3>
              <p className="text-xs text-muted-foreground font-normal">Alertas automáticas de vencimiento federativo</p>
            </div>
            <Button onClick={() => setOpenNewCertificacion(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Registrar Licencia
            </Button>
          </div>

          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5">Entrenador</th>
                      <th className="p-3.5">Tipo de Licencia</th>
                      <th className="p-3.5">Institución</th>
                      <th className="p-3.5">N° Registro</th>
                      <th className="p-3.5">Fecha Expiración</th>
                      <th className="p-3.5 text-right">Estado / Alerta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {certificacionesList.map((cert) => (
                      <tr key={cert.id} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3.5 font-normal text-foreground">{cert.entrenador_nombre}</td>
                        <td className="p-3.5 font-semibold text-indigo-600">{cert.tipo_licencia}</td>
                        <td className="p-3.5 text-muted-foreground font-normal">{cert.institucion}</td>
                        <td className="p-3.5 font-mono text-[11px] font-normal">{cert.numero_registro}</td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground font-normal">{cert.fecha_expiracion}</td>
                        <td className="p-3.5 text-right">
                          <Badge className={`text-[10px] font-semibold ${
                            cert.estado === "Vigente" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" :
                            cert.estado === "Por Vencer" ? "bg-amber-500/15 text-amber-600 border-amber-500/30" :
                            "bg-rose-500/15 text-rose-600 border-rose-500/30"
                          }`}>
                            {cert.estado === "Por Vencer" && "⚠️ "}
                            {cert.estado === "Vencida" && "🚨 "}
                            {cert.estado === "Vigente" && "✅ "}
                            {cert.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏖️ 5. PESTAÑA: VACACIONES & AUSENCIAS */}
      {/* ========================================================================= */}
      {activeTab === "vacaciones" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card p-3 rounded-2xl border border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">Solicitudes de Vacaciones, Permisos y Ausencias</h3>
              <p className="text-xs text-muted-foreground font-normal">Aprobación administrativa de incapacidades y descansos</p>
            </div>
            <Button onClick={() => setOpenNewSolicitud(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-8 rounded-xl gap-1">
              <Plus className="h-3.5 w-3.5" /> Nueva Solicitud
            </Button>
          </div>

          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5">Colaborador</th>
                      <th className="p-3.5">Tipo de Ausencia</th>
                      <th className="p-3.5">Período</th>
                      <th className="p-3.5">Motivo</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Acción Administrador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {solicitudesList.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3.5 font-normal text-foreground">{s.entrenador_nombre}</td>
                        <td className="p-3.5 font-normal">
                          <Badge variant="outline" className="text-[10px] font-normal">{s.tipo}</Badge>
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground text-[11px] font-normal">
                          {s.fecha_inicio} ➔ {s.fecha_fin}
                        </td>
                        <td className="p-3.5 text-muted-foreground font-normal max-w-xs truncate">{s.motivo}</td>
                        <td className="p-3.5">
                          <Badge className={`text-[10px] font-semibold ${
                            s.estado === "Aprobado" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" :
                            s.estado === "Rechazado" ? "bg-rose-500/15 text-rose-600 border-rose-500/30" :
                            "bg-amber-500/15 text-amber-600 border-amber-500/30"
                          }`}>
                            {s.estado}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {s.estado === "Pendiente" ? (
                            <>
                              <Button size="xs" onClick={() => handleUpdateSolicitudEstado(s.id, "Aprobado")} className="bg-emerald-600 text-white font-semibold h-7 text-[10px]">
                                <Check className="h-3 w-3 mr-1" /> Aprobar
                              </Button>
                              <Button size="xs" variant="outline" onClick={() => handleUpdateSolicitudEstado(s.id, "Rechazado")} className="border-rose-500/40 text-rose-600 h-7 text-[10px]">
                                <X className="h-3 w-3 mr-1" /> Rechazar
                              </Button>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic font-normal">Procesado ✓</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💰 6. PESTAÑA: NÓMINA & HONORARIOS (PROCESADOR INTERACTIVO CON BASE DE DATOS) */}
      {/* ========================================================================= */}
      {activeTab === "nomina" && (
        <div className="space-y-6">
          
          {/* Header Resumen & Botón Procesar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-xs">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-600" /> Procesador de Nómina e Historial en Base de Datos
              </h3>
              <p className="text-xs text-muted-foreground font-normal">
                Calcula honorarios por sesiones y partidos dirigidos, añade viáticos y guarda permanentemente en la BD Supabase.
              </p>
            </div>
            <Button onClick={() => handleOpenProcessNominaModal()} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 gap-2 shadow-md rounded-xl">
              <Plus className="h-4 w-4" /> Procesar Nueva Nómina en BD
            </Button>
          </div>

          {/* TABLA 1: PROCESAMIENTO ACTIVO POR COLABORADOR */}
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Colaboradores Activos & Calculadora Rápida
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5">Colaborador / Staff</th>
                      <th className="p-3.5">Cuenta IBAN / SINPE</th>
                      <th className="p-3.5">Tarifa Sesión</th>
                      <th className="p-3.5">Bono Partido</th>
                      <th className="p-3.5">Moneda</th>
                      <th className="p-3.5 text-right">Acción de Procesar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {coachesList.map((coach) => {
                      const isCRC = coach.moneda === "CRC" || !coach.moneda;
                      const symbol = isCRC ? "₡" : "$";
                      const tarifa = coach.tarifaSesion || (isCRC ? 18500 : 30);
                      const bonoPart = coach.bonoPartido || (isCRC ? 25000 : 40);

                      return (
                        <tr key={coach.id} className="hover:bg-muted/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 border">
                                <AvatarImage src={coach.avatar} />
                                <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold text-xs">
                                  {coach.nombre.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-normal text-foreground text-xs">{coach.nombre}</p>
                                <p className="text-[10px] text-muted-foreground font-normal">{coach.especialidad}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-muted-foreground font-normal">
                            {coach.cuentaBancaria || "CR05015202001023456789"}
                          </td>
                          <td className="p-3.5 font-semibold text-foreground font-mono">
                            {symbol}{tarifa.toLocaleString()}
                          </td>
                          <td className="p-3.5 font-semibold text-emerald-600 font-mono">
                            {symbol}{bonoPart.toLocaleString()}
                          </td>
                          <td className="p-3.5">
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {isCRC ? "Colones (₡)" : "Dólares ($)"}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right">
                            <Button
                              size="xs"
                              onClick={() => handleOpenProcessNominaModal(coach.id)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] h-7 gap-1"
                            >
                              <Calculator className="h-3 w-3" /> Calcular & Guardar BD
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* TABLA 2: HISTORIAL DE RECIBOS PROCESADOS Y GUARDADOS EN LA BD */}
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-emerald-600" /> Historial de Nóminas Procesadas y Guardadas en BD
                </CardTitle>
                <CardDescription className="text-xs font-normal">
                  Todos los recibos de pago registrados en la tabla `nominas_entrenadores` de Supabase.
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-xs">
                {nominasDBList.length} Registros en BD
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5">Colaborador</th>
                      <th className="p-3.5">Período de Nómina</th>
                      <th className="p-3.5">Detalle (Sesiones / Partidos)</th>
                      <th className="p-3.5">Monto Total Transferido</th>
                      <th className="p-3.5">Fecha de Pago</th>
                      <th className="p-3.5">Estado BD</th>
                      <th className="p-3.5 text-right">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {nominasDBList.map((rec) => {
                      const isCRC = rec.moneda === "CRC" || !rec.moneda;
                      const symbol = isCRC ? "₡" : "$";
                      return (
                        <tr key={rec.id} className="hover:bg-muted/40 transition-colors">
                          <td className="p-3.5 font-bold text-foreground">{rec.entrenadorNombre}</td>
                          <td className="p-3.5 font-mono text-[11px] text-muted-foreground font-normal">
                            {rec.periodoInicio} ➔ {rec.periodoFin}
                          </td>
                          <td className="p-3.5 font-normal text-muted-foreground">
                            {rec.sesionesConcluidas} sesiones | {rec.partidosConcluidos} partidos (+{symbol}{(rec.montoAjustes || 0).toLocaleString()} viáticos)
                          </td>
                          <td className="p-3.5 font-black text-sm text-foreground font-mono">
                            {symbol}{rec.montoTotal.toLocaleString()} {isCRC ? "CRC" : "USD"}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-muted-foreground font-normal">
                            {rec.fechaPago || "2026-07-24"}
                          </td>
                          <td className="p-3.5">
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">
                              PAGADO ✓
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleViewReceiptFromDB(rec)}
                              className="text-[10px] font-normal h-7 gap-1 border-amber-500/40 text-amber-600 hover:bg-amber-50"
                            >
                              <Eye className="h-3 w-3" /> Ver Recibo
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL PROCESAR & GUARDAR NÓMINA EN BASE DE DATOS */}
      <Dialog open={openProcessNomina} onOpenChange={setOpenProcessNomina}>
        <DialogContent className="max-w-lg bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-amber-600" /> Procesar y Guardar Nómina en la Base de Datos
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Ajusta sesiones, partidos y viáticos. El resultado se inserta directamente en la tabla `nominas_entrenadores`.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProcesarNominaDB} className="space-y-3.5 text-xs font-normal">
            <div>
              <Label className="text-xs font-semibold">Colaborador / Staff</Label>
              <select
                value={nomCoachId}
                onChange={(e) => {
                  setNomCoachId(e.target.value);
                  const coach = coachesList.find(c => c.id === e.target.value);
                  if (coach) {
                    const isCRC = coach.moneda === "CRC" || !coach.moneda;
                    setNomMoneda(isCRC ? "CRC" : "USD");
                    setNomSesionesTarifa(coach.tarifaSesion || (isCRC ? 18500 : 30));
                    setNomPartidosBono(coach.bonoPartido || (isCRC ? 25000 : 40));
                  }
                }}
                className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                required
              >
                {coachesList.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} - ({c.especialidad})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Fecha Inicio Período</Label>
                <Input type="date" value={nomInicio} onChange={(e) => setNomInicio(e.target.value)} className="h-9 mt-1" required />
              </div>
              <div>
                <Label className="text-xs font-semibold">Fecha Fin Período</Label>
                <Input type="date" value={nomFin} onChange={(e) => setNomFin(e.target.value)} className="h-9 mt-1" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Sesiones Concluidas</Label>
                <Input type="number" value={nomSesionesCount} onChange={(e) => setNomSesionesCount(Number(e.target.value))} className="h-9 mt-1" required />
              </div>
              <div>
                <Label className="text-xs font-semibold">Tarifa por Sesión ({nomMoneda === "CRC" ? "₡" : "$"})</Label>
                <Input type="number" value={nomSesionesTarifa} onChange={(e) => setNomSesionesTarifa(Number(e.target.value))} className="h-9 mt-1" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Partidos de Liga Dirigidos</Label>
                <Input type="number" value={nomPartidosCount} onChange={(e) => setNomPartidosCount(Number(e.target.value))} className="h-9 mt-1" required />
              </div>
              <div>
                <Label className="text-xs font-semibold">Bono por Partido ({nomMoneda === "CRC" ? "₡" : "$"})</Label>
                <Input type="number" value={nomPartidosBono} onChange={(e) => setNomPartidosBono(Number(e.target.value))} className="h-9 mt-1" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Viáticos / Ajustes extras ({nomMoneda === "CRC" ? "₡" : "$"})</Label>
                <Input type="number" value={nomViaticos} onChange={(e) => setNomViaticos(Number(e.target.value))} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Moneda de Pago</Label>
                <select
                  value={nomMoneda}
                  onChange={(e: any) => setNomMoneda(e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                >
                  <option value="CRC">Colones (₡)</option>
                  <option value="USD">Dólares ($)</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Notas del Comprobante / Viáticos</Label>
              <Input value={nomNotas} onChange={(e) => setNomNotas(e.target.value)} placeholder="Ej. Viáticos de transporte y bono por rendimiento..." className="h-9 mt-1" />
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">MONTO TOTAL A GUARDAR EN BD:</span>
              <span className="text-lg font-black text-amber-600 font-mono">
                {nomMoneda === "CRC" ? "₡" : "$"}{(nomSesionesCount * nomSesionesTarifa + nomPartidosCount * nomPartidosBono + nomViaticos).toLocaleString()} {nomMoneda}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenProcessNomina(false)} className="h-9 text-xs font-normal">Cancelar</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 text-xs gap-1.5 shadow-md">
                <Receipt className="h-4 w-4" /> Guardar Nómina en BD & Emitir Recibo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL CREAR NUEVO COLABORADOR */}
      <Dialog open={openCreateCoach} onOpenChange={setOpenCreateCoach}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" /> Registrar Nuevo Colaborador / Staff
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCoach} className="space-y-3.5 text-xs font-normal">
            <div>
              <Label className="text-xs font-semibold">Nombre Completo</Label>
              <Input value={nombreInput} onChange={(e) => setNombreInput(e.target.value)} placeholder="Ej. Roberto Gómez" className="h-9 mt-1" required />
            </div>

            <div>
              <Label className="text-xs font-semibold">Correo Electrónico</Label>
              <Input type="email" value={correoInput} onChange={(e) => setCorreoInput(e.target.value)} placeholder="roberto@asoderive.com" className="h-9 mt-1" required />
            </div>

            <div>
              <Label className="text-xs font-semibold">Teléfono / WhatsApp</Label>
              <Input value={telefonoInput} onChange={(e) => setTelefonoInput(e.target.value)} placeholder="+506 8888-9999" className="h-9 mt-1" required />
            </div>

            <div>
              <Label className="text-xs font-semibold">Cargo / Especialidad</Label>
              <Input value={especialidadInput} onChange={(e) => setEspecialidadInput(e.target.value)} placeholder="Director Técnico / Fisioterapeuta" className="h-9 mt-1" />
            </div>

            <div>
              <Label className="text-xs font-semibold">Cuenta Bancaria IBAN</Label>
              <Input value={ibanInput} onChange={(e) => setIbanInput(e.target.value)} placeholder="CR05015202001023456789" className="h-9 mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Moneda Salarial</Label>
                <select
                  value={monedaCoachInput}
                  onChange={(e: any) => setMonedaCoachInput(e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                >
                  <option value="CRC">Colones (₡)</option>
                  <option value="USD">Dólares ($)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Tarifa por Sesión</Label>
                <Input type="number" value={tarifaSesionInput} onChange={(e) => setTarifaSesionInput(Number(e.target.value))} className="h-9 mt-1" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreateCoach(false)} className="h-9 text-xs font-normal">Cancelar</Button>
              <Button type="submit" className="bg-primary text-white font-semibold h-9 text-xs">Guardar en BD</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL SOLICITUD DE PERMISO */}
      <Dialog open={openNewSolicitud} onOpenChange={setOpenNewSolicitud}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Palmtree className="h-5 w-5 text-purple-600" /> Registrar Solicitud de Permiso o Vacaciones
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSolicitud} className="space-y-3 text-xs font-normal">
            <div>
              <Label className="text-xs font-semibold">Colaborador</Label>
              <select
                value={solicitudCoachId}
                onChange={(e) => setSolicitudCoachId(e.target.value)}
                className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                required
              >
                <option value="">Seleccionar staff...</option>
                {coachesList.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Tipo de Solicitud</Label>
              <select
                value={solicitudTipo}
                onChange={(e: any) => setSolicitudTipo(e.target.value)}
                className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
              >
                <option value="Vacaciones">Vacaciones Anuales 🏖️</option>
                <option value="Permiso Especial">Permiso Especial 📜</option>
                <option value="Ausencia por Enfermedad">Ausencia por Enfermedad 🤒</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Fecha Inicio</Label>
                <Input type="date" value={solicitudInicio} onChange={(e) => setSolicitudInicio(e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Fecha Fin</Label>
                <Input type="date" value={solicitudFin} onChange={(e) => setSolicitudFin(e.target.value)} className="h-9 mt-1" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Motivo</Label>
              <Input value={solicitudMotivo} onChange={(e) => setSolicitudMotivo(e.target.value)} placeholder="Motivo de la ausencia..." className="h-9 mt-1" required />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenNewSolicitud(false)} className="h-9 text-xs font-normal">Cancelar</Button>
              <Button type="submit" className="bg-purple-600 text-white font-semibold h-9 text-xs">Guardar Solicitud</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL NUEVA CERTIFICACIÓN */}
      <Dialog open={openNewCertificacion} onOpenChange={setOpenNewCertificacion}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" /> Registrar Licencia Oficial en BD
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCertificacion} className="space-y-3 text-xs font-normal">
            <div>
              <Label className="text-xs font-semibold">Entrenador / Staff</Label>
              <select
                value={certCoachId}
                onChange={(e) => setCertCoachId(e.target.value)}
                className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                required
              >
                <option value="">Seleccionar staff...</option>
                {coachesList.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Tipo de Licencia</Label>
              <Input value={certTipo} onChange={(e) => setCertTipo(e.target.value)} placeholder="Licencia A FIFA / Conmebol" className="h-9 mt-1" required />
            </div>

            <div>
              <Label className="text-xs font-semibold">Institución Emisora</Label>
              <Input value={certInstitucion} onChange={(e) => setCertInstitucion(e.target.value)} placeholder="Federación Nacional" className="h-9 mt-1" />
            </div>

            <div>
              <Label className="text-xs font-semibold">Número de Registro</Label>
              <Input value={certNumReg} onChange={(e) => setCertNumReg(e.target.value)} placeholder="REG-2026-100" className="h-9 mt-1" />
            </div>

            <div>
              <Label className="text-xs font-semibold">Fecha de Expiración</Label>
              <Input type="date" value={certExpiracion} onChange={(e) => setCertExpiracion(e.target.value)} className="h-9 mt-1" required />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenNewCertificacion(false)} className="h-9 text-xs font-normal">Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 text-white font-semibold h-9 text-xs">Guardar Licencia</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL RECIBO ELECTRONICO PREVIEW */}
      <ReciboHonorariosModal open={isOpenRecibo} onOpenChange={setIsOpenRecibo} data={selectedRecibo} />

    </div>
  );
}

function PieChartIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
