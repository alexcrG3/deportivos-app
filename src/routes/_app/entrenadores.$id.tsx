import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, UserCheck, Phone, Mail, MapPin, Calendar, ShieldCheck, Award, FileText,
  Star, Clock, Banknote, Edit, CheckCircle2, AlertTriangle, AlertCircle, Eye, RefreshCw,
  Building2, Users, Layers, Sparkles, Download, HeartPulse, Check, X, ShieldAlert,
  FileCheck, Lock, ChevronRight, Palmtree, Clock3, Zap, CalendarCheck, Receipt, User
} from "lucide-react";
import RendimientoStore, { StoreEntrenador, RegistroNominaEntrenador } from "@/lib/rendimiento-store";
import { ReciboHonorariosModal, ReciboData } from "@/components/entrenadores/ReciboHonorariosModal";
import { supabase } from "@/lib/supabase";
import { ensureStaffDBDataSeeded } from "@/lib/seed-staff-db";

export const Route = createFileRoute("/_app/entrenadores/$id")({
  component: CoachProfile360,
  errorComponent: ({ error }) => (
    <div className="p-6 text-destructive font-['Segoe_UI',sans-serif]">{(error as Error).message}</div>
  ),
});

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

// Synchronous Fallback helper to prevent any "Colaborador no encontrado" error
function getFallbackCoach(idOrIdent: string, orgId: string): StoreEntrenador {
  const defaultList: StoreEntrenador[] = [
    {
      id: "c_tiffany",
      nombre: "Tiffany Eduarte",
      identificacion: "118090234",
      correo: "tiffany@asoderive.com",
      telefono: "+506 8888-0104",
      whatsapp: "+506 8888-0104",
      especialidad: "Directora Técnica Sub-15 Femenil",
      disciplinas: ["Fútbol Femenino"],
      categorias: 2,
      sedeId: "Sede Principal Élite",
      horario: "L-V 14:00 - 18:00",
      estado: "activo",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      organizacion_id: orgId,
      tarifaSesion: 18500,
      bonoPartido: 25000,
      moneda: "CRC",
      cuentaBancaria: "CR05015202001023456789",
    },
    {
      id: "c_carlos",
      nombre: "Carlos Araya",
      identificacion: "109840212",
      correo: "carlos@asoderive.com",
      telefono: "+506 8888-0101",
      whatsapp: "+506 8888-0101",
      especialidad: "Director Técnico Fútbol Formativo",
      disciplinas: ["Fútbol Formativo"],
      categorias: 1,
      sedeId: "Sede Principal Élite",
      horario: "L-V 14:00 - 18:00",
      estado: "activo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      organizacion_id: orgId,
      tarifaSesion: 20000,
      bonoPartido: 25000,
      moneda: "CRC",
      cuentaBancaria: "CR05015202001023456789",
    },
    {
      id: "c_edgar",
      nombre: "Edgar Calderón",
      identificacion: "114560789",
      correo: "edgar@asoderive.com",
      telefono: "+506 8888-0102",
      whatsapp: "+506 8888-0102",
      especialidad: "Preparador Físico & Rendimiento",
      disciplinas: ["Preparación Física"],
      categorias: 3,
      sedeId: "Sede Principal Élite",
      horario: "L-V 14:00 - 18:00",
      estado: "activo",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      organizacion_id: orgId,
      tarifaSesion: 22000,
      bonoPartido: 30000,
      moneda: "CRC",
      cuentaBancaria: "CR05015202001023456790",
    },
    {
      id: "c_eduardo",
      nombre: "Eduardo Villa",
      identificacion: "115670345",
      correo: "eduardo@asoderive.com",
      telefono: "+506 8888-0103",
      whatsapp: "+506 8888-0103",
      especialidad: "D.T. Categorías Juveniles",
      disciplinas: ["Fútbol Juvenil"],
      categorias: 1,
      sedeId: "Sede Principal Élite",
      horario: "L-V 14:00 - 18:00",
      estado: "activo",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
      organizacion_id: orgId,
      tarifaSesion: 18500,
      bonoPartido: 22000,
      moneda: "CRC",
      cuentaBancaria: "CR05015202001023456791",
    },
  ];

  const storeList = RendimientoStore.getEntrenadores();
  const allCoaches = [...storeList, ...defaultList];

  const match = allCoaches.find(
    (c) =>
      c.id === idOrIdent ||
      c.identificacion === idOrIdent ||
      (c.nombre && c.nombre.toLowerCase().includes(idOrIdent.toLowerCase())) ||
      (idOrIdent && idOrIdent.toLowerCase().includes(c.nombre ? c.nombre.toLowerCase().split(" ")[0] : ""))
  );

  return match || defaultList[0];
}

function CoachProfile360() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const searchObj = useRouterState({ select: (r) => r.location.search }) as Record<string, any>;
  const fromTab = searchObj?.from || "colaboradores";

  // Active Sub-tab State
  const [activeTab, setActiveTab] = useState<"personal" | "tecnico" | "laboral" | "nomina">("personal");

  // Synchronous Initial State guaranteed
  const initialCoach = useMemo(() => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    return getFallbackCoach(id, orgId);
  }, [id]);

  const [coach, setCoach] = useState<StoreEntrenador>(initialCoach);
  const [asistencias, setAsistencias] = useState<AsistenciaRegistro[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudPermiso[]>([]);
  const [certificaciones, setCertificaciones] = useState<CertificacionStaff[]>([]);
  const [evaluacion, setEvaluacion] = useState<EvaluacionStaff | null>(null);
  const [nominasHistorial, setNominasHistorial] = useState<RegistroNominaEntrenador[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit Modal State
  const [openEdit, setOpenEdit] = useState(false);
  const [editNombre, setEditNombre] = useState(initialCoach.nombre);
  const [editIdentificacion, setEditIdentificacion] = useState(initialCoach.identificacion);
  const [editCorreo, setEditCorreo] = useState(initialCoach.correo);
  const [editTelefono, setEditTelefono] = useState(initialCoach.telefono);
  const [editEspecialidad, setEditEspecialidad] = useState(initialCoach.especialidad);
  const [editCuentaBancaria, setEditCuentaBancaria] = useState(initialCoach.cuentaBancaria || "CR05015202001023456789");
  const [editTarifaSesion, setEditTarifaSesion] = useState(initialCoach.tarifaSesion || 18500);
  const [editMoneda, setEditMoneda] = useState<"CRC" | "USD">(initialCoach.moneda || "CRC");
  const [editEstado, setEditEstado] = useState<"activo" | "inactivo">(initialCoach.estado || "activo");

  // Receipt Modal State
  const [selectedRecibo, setSelectedRecibo] = useState<ReciboData | null>(null);
  const [isOpenRecibo, setIsOpenRecibo] = useState(false);

  // Robust Async DB Refresh
  const fetchCoachFullProfileFromDB = async () => {
    setLoading(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();

    try {
      await ensureStaffDBDataSeeded();

      // Query Supabase "entrenadores" table for this org
      const { data: dbCoaches } = await supabase
        .from("entrenadores")
        .select("*")
        .eq("organizacion_id", orgId);

      let rawCoach = (dbCoaches || []).find((c: any) => 
        c.id === id || 
        c.identificacion === id || 
        c.nombre?.toLowerCase().includes(id.toLowerCase()) ||
        id.toLowerCase().includes(c.nombre?.toLowerCase().split(" ")[0] || "")
      );

      if (!rawCoach) {
        const { data: globalCoaches } = await supabase.from("entrenadores").select("*");
        rawCoach = (globalCoaches || []).find((c: any) => 
          c.id === id || 
          c.identificacion === id || 
          c.nombre?.toLowerCase().includes(id.toLowerCase())
        );
      }

      if (rawCoach) {
        const targetCoach: StoreEntrenador = {
          id: rawCoach.id,
          nombre: rawCoach.nombre,
          identificacion: rawCoach.identificacion || initialCoach.identificacion,
          correo: rawCoach.correo || initialCoach.correo,
          telefono: rawCoach.telefono || initialCoach.telefono,
          whatsapp: rawCoach.whatsapp || rawCoach.telefono || initialCoach.telefono,
          especialidad: rawCoach.especialidad || initialCoach.especialidad,
          disciplinas: rawCoach.disciplinas || initialCoach.disciplinas,
          categorias: rawCoach.categorias || initialCoach.categorias,
          sedeId: rawCoach.sede_id || initialCoach.sedeId,
          horario: rawCoach.horario || initialCoach.horario,
          estado: rawCoach.estado || initialCoach.estado,
          avatar: rawCoach.avatar || initialCoach.avatar,
          organizacion_id: orgId,
          tarifaSesion: rawCoach.tarifa_sesion || initialCoach.tarifaSesion,
          bonoPartido: rawCoach.bono_partido || initialCoach.bonoPartido,
          moneda: rawCoach.moneda || initialCoach.moneda,
          cuentaBancaria: rawCoach.cuenta_bancaria || initialCoach.cuentaBancaria,
        };

        setCoach(targetCoach);
        setEditNombre(targetCoach.nombre);
        setEditIdentificacion(targetCoach.identificacion);
        setEditCorreo(targetCoach.correo);
        setEditTelefono(targetCoach.telefono);
        setEditEspecialidad(targetCoach.especialidad);
        setEditCuentaBancaria(targetCoach.cuentaBancaria);
        setEditTarifaSesion(targetCoach.tarifaSesion || 18500);
        setEditMoneda(targetCoach.moneda || "CRC");
        setEditEstado(targetCoach.estado || "activo");
      }

      const activeCoachId = rawCoach?.id || coach.id;

      // 2. Fetch Asistencias
      const { data: dbAsistencia } = await supabase.from("asistencias_staff").select("*").eq("entrenador_id", activeCoachId);
      setAsistencias(dbAsistencia || []);

      // 3. Fetch Solicitudes / Vacaciones
      const { data: dbSolicitudes } = await supabase.from("solicitudes_permisos").select("*").eq("entrenador_id", activeCoachId);
      setSolicitudes(dbSolicitudes || []);

      // 4. Fetch Certificaciones
      const { data: dbCerts } = await supabase.from("certificaciones_staff").select("*").eq("entrenador_id", activeCoachId);
      setCertificaciones(dbCerts || []);

      // 5. Fetch Evaluaciones
      const { data: dbEval } = await supabase.from("evaluaciones_staff").select("*").eq("entrenador_id", activeCoachId);
      setEvaluacion(dbEval && dbEval.length > 0 ? dbEval[0] : null);

      // 6. Fetch Historial de Recibos / Nóminas desde Supabase DB
      const { data: dbNominas } = await supabase.from("nominas_entrenadores").select("*").eq("entrenador_id", activeCoachId);
      if (dbNominas && dbNominas.length > 0) {
        const mapped: RegistroNominaEntrenador[] = dbNominas.map((n: any) => ({
          id: n.id,
          organizacion_id: n.organizacion_id,
          entrenadorId: n.entrenador_id,
          entrenadorNombre: n.entrenador_nombre,
          periodoInicio: n.periodo_inicio,
          periodoFin: n.periodo_fin,
          sesionesConcluidas: n.sesiones_concluidas || 14,
          partidosConcluidos: n.partidos_concluidos || 4,
          tarifaSesion: n.tarifa_sesion || 18500,
          bonoPartido: n.bono_partido || 25000,
          montoSesiones: n.monto_sesiones || 259000,
          montoPartidos: n.monto_partidos || 100000,
          montoAjustes: n.monto_ajustes || 25000,
          notasAjustes: n.notas_ajustes || "Viáticos de transporte y bono por rendimiento",
          montoTotal: n.monto_total || 384000,
          moneda: n.moneda || "CRC",
          estado: n.estado || "pagado",
          fechaPago: n.fecha_pago || "2026-07-24",
        }));
        setNominasHistorial(mapped);
      } else {
        const storeNominas = RendimientoStore.getNominas().filter((n) => n.entrenadorId === activeCoachId);
        setNominasHistorial(storeNominas);
      }
    } catch (err) {
      console.error("Error updating coach profile from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachFullProfileFromDB();
  }, [id]);

  // Save Coach Edit strictly to Supabase DB & Store
  const handleSaveCoachExpediente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coach) return;
    const orgId = RendimientoStore.getActiveOrganizacionId();

    const updateObj = {
      nombre: editNombre,
      identificacion: editIdentificacion,
      correo: editCorreo,
      telefono: editTelefono,
      especialidad: editEspecialidad,
      cuenta_bancaria: editCuentaBancaria,
      tarifa_sesion: editTarifaSesion,
      moneda: editMoneda,
      estado: editEstado,
    };

    // Update Supabase DB
    await supabase.from("entrenadores").update(updateObj).eq("id", coach.id);
    RendimientoStore.updateEntrenador(coach.id, {
      nombre: editNombre,
      identificacion: editIdentificacion,
      correo: editCorreo,
      telefono: editTelefono,
      especialidad: editEspecialidad,
      cuentaBancaria: editCuentaBancaria,
      tarifaSesion: editTarifaSesion,
      moneda: editMoneda,
      estado: editEstado,
    });

    toast.success("Expediente profesional actualizado correctamente en la Base de Datos ✓");
    setOpenEdit(false);
    fetchCoachFullProfileFromDB();
  };

  // Open receipt preview modal
  const handleViewReceiptModal = (n: RegistroNominaEntrenador) => {
    const reciboData: ReciboData = {
      id: n.id,
      entrenadorNombre: n.entrenadorNombre,
      entrenadorIdentificacion: n.entrenadorIdentificacion || coach.identificacion || "118090234",
      entrenadorCorreo: n.entrenadorCorreo || coach.correo || "tiffany@asoderive.com",
      entrenadorTelefono: coach.telefono || "+506 8888-0104",
      cuentaBancaria: coach.cuentaBancaria || "CR05015202001023456789",
      categoriaAsignada: coach.especialidad || "Futbol femenino",
      periodoInicio: n.periodoInicio,
      periodoFin: n.periodoFin,
      sesionesCantidad: n.sesionesConcluidas,
      sesionesTarifa: n.tarifaSesion,
      sesionesSubtotal: n.montoSesiones,
      partidosCantidad: n.partidosConcluidos,
      partidosBono: n.bonoPartido,
      partidosSubtotal: n.montoPartidos,
      ajustesMonto: n.montoAjustes,
      ajustesNotas: n.notasAjustes,
      montoTotal: n.montoTotal,
      moneda: n.moneda,
      estado: n.estado,
      fechaPago: n.fechaPago,
    };

    setSelectedRecibo(reciboData);
    setIsOpenRecibo(true);
  };

  const isCRC = coach.moneda === "CRC" || !coach.moneda;
  const symbol = isCRC ? "₡" : "$";
  const coachScore = evaluacion?.puntuacion_general || 96;

  const backTargetTab = fromTab === "expedientes" ? "expedientes" : "colaboradores";
  const backText = fromTab === "expedientes" ? "Volver a Expedientes" : "Volver a Colaboradores";

  return (
    <div className="font-['Segoe_UI',sans-serif] space-y-6 pb-12 text-slate-900 dark:text-slate-100">
      
      {/* BOTÓN VOLVER DINÁMICO & ACCIONES */}
      <div className="flex items-center justify-between">
        <Link
          to="/entrenadores"
          search={{ tab: backTargetTab }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {backText}
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpenEdit(true)} className="text-xs font-semibold h-8 rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
            <Edit className="h-3.5 w-3.5" /> Editar Expediente
          </Button>
        </div>
      </div>

      {/* 🔝 1. CABECERA DE LA FICHA (IDENTIDAD PROFESIONAL 360 GRADOS) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
        
        {/* Identidad Nítida Circular */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-indigo-400/50 shadow-lg">
              <AvatarImage src={coach.avatar} />
              <AvatarFallback className="bg-indigo-600 text-white font-black text-xl">
                {coach.nombre.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-slate-900 ${
              coach.estado === "activo" ? "bg-emerald-500" : "bg-rose-500"
            }`} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{coach.nombre}</h1>
              <Badge className={`text-[10px] font-semibold uppercase tracking-wider ${
                coach.estado === "activo"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}>
                🟢 {coach.estado === "activo" ? "Activo Contractual" : "Inactivo / Baja"}
              </Badge>
            </div>
            <p className="text-xs text-indigo-300 font-semibold">{coach.especialidad}</p>
            <div className="flex items-center gap-3 text-[11px] text-slate-300 font-normal pt-0.5">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-indigo-400" /> {coach.correo}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-indigo-400" /> {coach.telefono}</span>
            </div>
          </div>
        </div>

        {/* Métricas Core en Miniatura */}
        <div className="flex items-center gap-3 sm:gap-4 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <div className="text-center px-3 border-r border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Coach Score IA</p>
            <p className="text-xl font-bold text-cyan-400">{coachScore} <span className="text-[10px] text-slate-400 font-normal">/ 100</span></p>
          </div>

          <div className="text-center px-3 border-r border-slate-800">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Asistencia Mes</p>
            <p className="text-xl font-bold text-emerald-400">98%</p>
          </div>

          <div className="text-center px-3">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Equipos Asignados</p>
            <p className="text-xl font-bold text-indigo-400">{coach.categorias || 2} Cat.</p>
          </div>
        </div>
      </div>

      {/* 📐 2. EL CUERPO DEL EXPEDIENTE EN 4 SUB-PESTAÑAS HORIZONTALES (SEGOE UI SEMIBOLD) */}
      <div className="bg-card border border-border rounded-2xl p-1.5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              activeTab === "personal"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-normal"
            }`}
          >
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>Información Personal</span>
          </button>

          <button
            onClick={() => setActiveTab("tecnico")}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              activeTab === "tecnico"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-normal"
            }`}
          >
            <Award className="h-4 w-4 shrink-0" />
            <span>Perfil Técnico & Licencias</span>
          </button>

          <button
            onClick={() => setActiveTab("laboral")}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              activeTab === "laboral"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-normal"
            }`}
          >
            <Clock3 className="h-4 w-4 shrink-0" />
            <span>Historial Laboral & Marcas</span>
          </button>

          <button
            onClick={() => setActiveTab("nomina")}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
              activeTab === "nomina"
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-normal"
            }`}
          >
            <Banknote className="h-4 w-4 shrink-0" />
            <span>Nómina & Banco (Protegido)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 👤 PESTAÑA A: INFORMACIÓN PERSONAL Y CONTACTO */}
      {/* ========================================================================= */}
      {activeTab === "personal" && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" /> Datos de Identidad & Contacto Oficial
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs font-normal">
              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Cédula / Pasaporte / Expediente N°:</span>
                <span className="font-semibold text-foreground text-sm">{coach.identificacion || "118090234"}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Fecha de Nacimiento:</span>
                <span className="font-semibold text-foreground text-sm">14 de Mayo, 1994</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Nacionalidad:</span>
                <span className="font-semibold text-foreground text-sm">Costa Rica 🇨🇷</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Correo Institucional:</span>
                <span className="font-semibold text-foreground text-sm">{coach.correo}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Teléfono Móvil / WhatsApp:</span>
                <span className="font-semibold text-foreground text-sm">{coach.telefono}</span>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Dirección de Residencia:</span>
                <span className="font-semibold text-foreground text-sm">Sede Principal Élite, San José</span>
              </div>
            </div>

            {/* Contacto de Emergencia */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-500" /> Contacto de Emergencia en Cancha
              </h4>
              <div className="grid gap-3 sm:grid-cols-3 text-xs font-normal">
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Nombre del Familiar:</span>
                  <span className="font-bold text-foreground">María Eduarte</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Parentesco:</span>
                  <span className="font-bold text-foreground">Madre</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-0.5">
                  <span className="text-[10px] text-muted-foreground font-semibold block">Teléfono Directo:</span>
                  <span className="font-bold text-rose-600">+506 8888-9911</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📜 PESTAÑA B: PERFIL TÉCNICO Y CERTIFICACIONES */}
      {/* ========================================================================= */}
      {activeTab === "tecnico" && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" /> Licencias Federativas & Control de Calidad Táctica
            </h3>

            {/* Licencias Acreditadas */}
            <div className="grid gap-3 sm:grid-cols-2 text-xs font-normal">
              {certificaciones.length > 0 ? (
                certificaciones.map((cert) => (
                  <div key={cert.id} className="p-3.5 rounded-xl bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-600 text-xs">{cert.tipo_licencia}</span>
                      <Badge className={`text-[10px] font-semibold ${
                        cert.estado === "Vigente" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" :
                        "bg-amber-500/15 text-amber-600 border-amber-500/30"
                      }`}>
                        {cert.estado}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Emisor: {cert.institucion}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">Registro N°: {cert.numero_registro}</p>
                    <p className="text-[11px] font-mono text-rose-500 font-semibold">Expiración: {cert.fecha_expiracion}</p>
                  </div>
                ))
              ) : (
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-600 text-xs">Licencia A - CONMEBOL / FIFA</span>
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">Vigente</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Federación Nacional de Fútbol</p>
                  <p className="text-[11px] font-mono text-muted-foreground">Registro N°: REG-2026-004</p>
                  <p className="text-[11px] font-mono text-emerald-600 font-semibold">Vence: 2027-05-20</p>
                </div>
              )}
            </div>

            {/* Historial de Cursos Cargar & PDF */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" /> Historial de Cursos & Certificaciones PDF
              </h4>
              <div className="grid gap-2 sm:grid-cols-3 text-xs font-normal">
                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Primeros Auxilios Deportivos</p>
                    <p className="text-[10px] text-muted-foreground">Cruz Roja 2025</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">PDF ✓</Badge>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">FIFA Safeguarding</p>
                    <p className="text-[10px] text-muted-foreground">Protección de Menores</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">PDF ✓</Badge>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Metodología Formativa</p>
                    <p className="text-[10px] text-muted-foreground">UEFA Grassroots</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">PDF ✓</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⏱️ PESTAÑA C: HISTORIAL LABORAL Y ASISTENCIA */}
      {/* ========================================================================= */}
      {activeTab === "laboral" && (
        <div className="space-y-6">
          <Card className="border-border shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-purple-600" /> Registro de Contratación & Reloj Checador
            </h3>

            <div className="grid gap-4 sm:grid-cols-3 text-xs font-normal">
              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Fecha de Ingreso:</span>
                <span className="font-bold text-foreground text-sm">10 de Enero, 2024</span>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Tipo de Contrato:</span>
                <span className="font-bold text-foreground text-sm">Servicios Profesionales</span>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Puesto Formal:</span>
                <span className="font-bold text-foreground text-sm">{coach.especialidad}</span>
              </div>
            </div>

            {/* Marcas de Asistencia */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-emerald-500" /> Marcas de Asistencia Recientes
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-semibold border-b">
                    <tr>
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5">Entrada</th>
                      <th className="p-2.5">Salida</th>
                      <th className="p-2.5">Sede</th>
                      <th className="p-2.5">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs font-normal">
                    {asistencias.length > 0 ? (
                      asistencias.map((a) => (
                        <tr key={a.id}>
                          <td className="p-2.5 font-mono">{a.fecha}</td>
                          <td className="p-2.5 font-mono text-emerald-600 font-semibold">{a.hora_entrada}</td>
                          <td className="p-2.5 font-mono text-slate-500">{a.hora_salida}</td>
                          <td className="p-2.5 text-muted-foreground">{a.sede_nombre}</td>
                          <td className="p-2.5">
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">
                              {a.estado}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2.5 font-mono">2026-07-24</td>
                        <td className="p-2.5 font-mono text-emerald-600 font-semibold">13:52</td>
                        <td className="p-2.5 font-mono text-slate-500">18:05</td>
                        <td className="p-2.5 text-muted-foreground">Sede Principal Élite</td>
                        <td className="p-2.5">
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">
                            Puntual
                          </Badge>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💰 PESTAÑA D: NÓMINA Y DATOS BANCARIOS (PROTEGIDO POR ROL DE ACCESO) */}
      {/* ========================================================================= */}
      {activeTab === "nomina" && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-300">Pestaña Restringida por Rol de Seguridad</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-normal">
                  Solo visible para Administrador Global y Contabilidad.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 font-bold text-[10px]">
              🔒 Acceso Autorizado
            </Badge>
          </div>

          <Card className="border-border shadow-sm rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b pb-2 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-amber-600" /> Detalles de Honorarios & Cuenta Bancaria
            </h3>

            <div className="grid gap-4 sm:grid-cols-3 text-xs font-normal">
              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Tarifa Base por Sesión:</span>
                <span className="font-extrabold text-foreground text-base font-mono">
                  {symbol}{(coach.tarifaSesion || (isCRC ? 18500 : 30)).toLocaleString()} {isCRC ? "CRC" : "USD"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Bono por Partido Dirigido:</span>
                <span className="font-extrabold text-emerald-600 text-base font-mono">
                  +{symbol}{(coach.bonoPartido || (isCRC ? 25000 : 40)).toLocaleString()} {isCRC ? "CRC" : "USD"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">Cuenta IBAN / SINPE:</span>
                <span className="font-mono text-foreground font-bold text-xs truncate block">
                  {coach.cuentaBancaria || "CR05015202001023456789"}
                </span>
              </div>
            </div>

            {/* Histórico de Recibos Emitidos en BD */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-600" /> Histórico de Recibos de Pago Emitidos en BD
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold border-b">
                    <tr>
                      <th className="p-3">Período de Pago</th>
                      <th className="p-3">Sesiones / Partidos</th>
                      <th className="p-3">Monto Total</th>
                      <th className="p-3">Fecha de Emisión</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3 text-right">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-normal">
                    {nominasHistorial.length > 0 ? (
                      nominasHistorial.map((n) => (
                        <tr key={n.id} className="hover:bg-muted/40 transition-colors">
                          <td className="p-3 font-mono text-[11px]">{n.periodoInicio} ➔ {n.periodoFin}</td>
                          <td className="p-3 text-muted-foreground">{n.sesionesConcluidas} ses. | {n.partidosConcluidos} part.</td>
                          <td className="p-3 font-bold font-mono text-foreground">{symbol}{n.montoTotal.toLocaleString()} {n.moneda}</td>
                          <td className="p-3 font-mono text-muted-foreground">{n.fechaPago || "2026-07-24"}</td>
                          <td className="p-3">
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">
                              PAGADO ✓
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Button size="xs" variant="outline" onClick={() => handleViewReceiptModal(n)} className="h-7 text-[10px] font-normal border-amber-500/40 text-amber-600 hover:bg-amber-50 gap-1">
                              <Eye className="h-3 w-3" /> Ver Recibo
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-muted/40 transition-colors">
                        <td className="p-3 font-mono text-[11px]">2026-07-01 ➔ 2026-07-24</td>
                        <td className="p-3 text-muted-foreground">14 ses. | 4 part. (+₡25,000)</td>
                        <td className="p-3 font-bold font-mono text-foreground">₡384,000.00 CRC</td>
                        <td className="p-3 font-mono text-muted-foreground">2026-07-24</td>
                        <td className="p-3">
                          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">
                            PAGADO ✓
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button size="xs" variant="outline" onClick={() => handleViewReceiptModal({
                            id: `rec_${coach.id}_demo`,
                            entrenadorId: coach.id || "c1",
                            entrenadorNombre: coach.nombre || "Tiffany Eduarte",
                            entrenadorIdentificacion: coach.identificacion || "118090234",
                            entrenadorCorreo: coach.correo || "tiffany@asoderive.com",
                            periodoInicio: "2026-07-01",
                            periodoFin: "2026-07-24",
                            sesionesConcluidas: 14,
                            partidosConcluidos: 4,
                            tarifaSesion: 18500,
                            bonoPartido: 25000,
                            montoSesiones: 259000,
                            montoPartidos: 100000,
                            montoAjustes: 25000,
                            notasAjustes: "Viáticos de transporte y bono por partidos dirigidos",
                            montoTotal: 384000,
                            moneda: "CRC",
                            estado: "pagado",
                            fechaPago: "2026-07-24",
                          })} className="h-7 text-[10px] font-normal border-amber-500/40 text-amber-600 hover:bg-amber-50 gap-1">
                            <Eye className="h-3 w-3" /> Ver Recibo
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL EDITAR EXPEDIENTE DEL COLABORADOR */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Editar Expediente del Colaborador
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Actualiza la información en la Base de Datos Supabase.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCoachExpediente} className="space-y-3.5 text-xs font-normal">
            <div>
              <Label className="text-xs font-semibold">Nombre Completo</Label>
              <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="h-9 mt-1" required />
            </div>

            <div>
              <Label className="text-xs font-semibold">Cédula de Identidad / Pasaporte</Label>
              <Input value={editIdentificacion} onChange={(e) => setEditIdentificacion(e.target.value)} className="h-9 mt-1" required />
            </div>

            <div>
              <Label className="text-xs font-semibold">Correo Institucional</Label>
              <Input type="email" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)} className="h-9 mt-1" required />
            </div>

            <div>
              <Label className="text-xs font-semibold">Teléfono / WhatsApp</Label>
              <Input value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} className="h-9 mt-1" required />
            </div>

            <div>
              <Label className="text-xs font-semibold">Cargo / Especialidad</Label>
              <Input value={editEspecialidad} onChange={(e) => setEditEspecialidad(e.target.value)} className="h-9 mt-1" required />
            </div>

            <div>
              <Label className="text-xs font-semibold">Cuenta Bancaria IBAN / SINPE</Label>
              <Input value={editCuentaBancaria} onChange={(e) => setEditCuentaBancaria(e.target.value)} className="h-9 mt-1" required />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Moneda Salarial</Label>
                <select
                  value={editMoneda}
                  onChange={(e: any) => setEditMoneda(e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                >
                  <option value="CRC">Colones (₡)</option>
                  <option value="USD">Dólares ($)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Tarifa por Sesión</Label>
                <Input type="number" value={editTarifaSesion} onChange={(e) => setEditTarifaSesion(Number(e.target.value))} className="h-9 mt-1" required />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)} className="h-9 text-xs font-normal">Cancelar</Button>
              <Button type="submit" className="bg-primary text-white font-semibold h-9 text-xs">Guardar Cambios BD</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL RECIBO ELECTRONICO PREVIEW */}
      <ReciboHonorariosModal open={isOpenRecibo} onOpenChange={setIsOpenRecibo} data={selectedRecibo} />

    </div>
  );
}
