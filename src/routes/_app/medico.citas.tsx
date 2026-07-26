import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import RendimientoStore, { CitaFisioterapia } from "@/lib/rendimiento-store";
import { AtencionClinicaModal } from "@/components/AtencionClinicaModal";
import {
  Calendar, Clock, UserCheck, Plus, CheckCircle2, XCircle, ArrowLeft, Stethoscope, ActivitySquare, Search, FileText, ExternalLink, Activity, Pill, Zap, HeartPulse, Check, MapPin, Star, MessageSquare, Video, Settings, ShieldCheck, DollarSign, Building2, Map, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/medico/citas")({
  component: MedicoCitasPage,
});

// ─────────────────────────────────────────────
//  TYPES FOR MEDICAL MARKETPLACE
// ─────────────────────────────────────────────
interface MedicoEspecialista {
  id: string;
  nombre: string;
  especialidad: string;
  foto: string;
  estrellas: number;
  resenasCount: number;
  ubicacion: string;
  provincia: string;
  lat: number;
  lng: number;
  precioConsulta: number;
  modeloCobro: "comision" | "renta_fija";
  comisionPorcentaje: number;
  montoRentaFija: number;
  phone: string;
  horariosDisponibles: string[];
}

// Formateador de fecha latino DD/MM/YYYY
export function formatFechaLatino(dateInput?: string): string {
  if (!dateInput || dateInput === "Sin programar") return dateInput || "Sin programar";

  const clean = dateInput.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;

  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const parts = clean.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  return clean;
}

export function homologarNombreMedico(rawName?: string): string {
  if (!rawName) return "Licda. Melissa Fernández";
  if (rawName === "Licda. Mariela Castro") return "Licda. Melissa Fernández";
  if (rawName === "Lic. Carlos Fonseca") return "Dr. Mauricio Alpízar";
  return rawName;
}

export function MedicoCitasPage() {
  const [userRole, setUserRole] = useState<"admin" | "entrenador" | "padre">("admin");
  const [activeTab, setActiveTab] = useState<"directorio" | "agenda" | "tratamientos" | "configuracion">("directorio");
  const [citasList, setCitasList] = useState(() => RendimientoStore.getCitasFisioterapia());
  const [medicosList, setMedicosList] = useState<MedicoEspecialista[]>(() => {
    return RendimientoStore.get<MedicoEspecialista[]>("directorio_medicos", []);
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [openCreateTratamiento, setOpenCreateTratamiento] = useState(false);
  const [modalReservarMedico, setModalReservarMedico] = useState<{ medico: MedicoEspecialista; slot: string } | null>(null);
  const [modalRecomendacionMedico, setModalRecomendacionMedico] = useState<MedicoEspecialista | null>(null);
  const [recomendarJugadorId, setRecomendarJugadorId] = useState("j1");
  const [recomendarMotivo, setRecomendarMotivo] = useState("Carga muscular e inflamación preventiva");

  const [search, setSearch] = useState("");
  const [searchDirectorio, setSearchDirectorio] = useState("");
  const [filterProvincia, setFilterProvincia] = useState("all");
  const [selectedPinMedico, setSelectedPinMedico] = useState<MedicoEspecialista | null>(null);

  const [selectedCitaForAtencion, setSelectedCitaForAtencion] = useState<CitaFisioterapia | null>(null);
  const [isOpenAtencionModal, setIsOpenAtencionModal] = useState(false);

  const jugadores = useMemo(() => RendimientoStore.getJugadores(), []);
  const [reservaJugadorId, setReservaJugadorId] = useState(jugadores[0]?.id || "j1");

  const handleEnviarRecomendacionEntrenador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRecomendacionMedico) return;
    const jObj = jugadores.find((j) => j.id === recomendarJugadorId);
    const medico = modalRecomendacionMedico;

    toast.success(
      `📩 Recomendación enviada a los Padres de ${jObj?.nombre || "Atleta"}: "El Míster Carlos te recomienda agendar una consulta con ${medico.nombre} (${medico.especialidad}) por ${recomendarMotivo}."`
    );
    setModalRecomendacionMedico(null);
  };

  // Form state para agendar cita interna
  const [jugadorId, setJugadorId] = useState("j1");
  const [fisioterapeutaNombre, setFisioterapeutaNombre] = useState("Licda. Melissa Fernández");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [hora, setHora] = useState("15:00");
  const [motivo, setMotivo] = useState("Descarga miofascial e hidroterapia");
  const [tratamientoAplicado, setTratamientoAplicado] = useState("Electroterapia + Crioterapia");
  const [nivelDolorEva, setNivelDolorEva] = useState(3);

  // Form state para afiliar nuevo especialista (Paso 1 y Paso 2)
  const [openAfiliarModal, setOpenAfiliarModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEspecialidad, setNuevoEspecialidad] = useState("Ortopedia y Traumatología Deportiva");
  const [nuevoColegiado, setNuevoColegiado] = useState("");
  const [nuevoFoto, setNuevoFoto] = useState("");
  const [nuevoUbicacion, setNuevoUbicacion] = useState("");
  const [nuevoProvincia, setNuevoProvincia] = useState("San José");
  const [nuevoPrecio, setNuevoPrecio] = useState("28000");
  const [nuevoPhone, setNuevoPhone] = useState("50688990011");
  const [nuevoHorariosRaw, setNuevoHorariosRaw] = useState("Lun 27 Jul - 10:00 AM, Mié 29 Jul - 02:00 PM, Vie 31 Jul - 04:30 PM");
  const [nuevoModeloCobro, setNuevoModeloCobro] = useState<"comision" | "renta_fija">("comision");
  const [nuevoComision, setNuevoComision] = useState("10");
  const [nuevoRentaFija, setNuevoRentaFija] = useState("15000");

  // Strict Supabase DB Sync
  const updateMedicosState = (newList: MedicoEspecialista[]) => {
    setMedicosList(newList);
    RendimientoStore.set("directorio_medicos", newList);
  };

  const fetchDirectorioDB = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";
    try {
      const { data: resMeds } = await supabase.from("directorio_medicos").select("*").eq("organizacion_id", orgId);
      if (resMeds && resMeds.length > 0) {
        const mapped: MedicoEspecialista[] = resMeds.map((m: any) => ({
          id: m.id,
          nombre: m.nombre,
          especialidad: m.especialidad,
          foto: m.foto || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80",
          estrellas: Number(m.estrellas || 4.9),
          resenasCount: Number(m.resenas_count || 40),
          ubicacion: m.ubicacion,
          provincia: m.provincia || "San José",
          lat: Number(m.lat || 9.9281),
          lng: Number(m.lng || -84.0907),
          precioConsulta: Number(m.precio_consulta || 25000),
          modeloCobro: m.modelo_cobro || "comision",
          comisionPorcentaje: Number(m.comision_porcentaje || 10),
          montoRentaFija: Number(m.monto_renta_fija || 15000),
          phone: m.phone || "50688991122",
          horariosDisponibles: Array.isArray(m.horarios_disponibles) && m.horarios_disponibles.length > 0
            ? m.horarios_disponibles
            : ["Lun 27 Jul - 10:00 AM", "Mié 29 Jul - 02:00 PM"],
        }));
        updateMedicosState(mapped);
      } else {
        // Seed DB directly in Supabase if empty
        const initialDBMedicos = [
          {
            id: "med_01",
            nombre: "Dr. Mauricio Alpízar",
            especialidad: "Ortopedia y Traumatología Deportiva",
            foto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80",
            estrellas: 4.9,
            resenas_count: 42,
            ubicacion: "Curridabat – Torre Médica CIMA",
            provincia: "San José",
            lat: 9.9281,
            lng: -84.0907,
            precio_consulta: 28000,
            modelo_cobro: "comision",
            comision_porcentaje: 10,
            monto_renta_fija: 15000,
            phone: "50688991122",
            horarios_disponibles: ["Lun 27 Jul - 10:00 AM", "Mié 29 Jul - 02:00 PM", "Vie 31 Jul - 04:30 PM"],
            organizacion_id: orgId,
          },
          {
            id: "med_02",
            nombre: "Licda. Melissa Fernández",
            especialidad: "Fisioterapia y Readaptación Funcional",
            foto: "https://images.unsplash.com/photo-1594824813566-88855364bd52?w=300&auto=format&fit=crop&q=80",
            estrellas: 5.0,
            resenas_count: 56,
            ubicacion: "Santa Ana – Centro Clínico Biblica",
            provincia: "San José",
            lat: 9.9325,
            lng: -84.1812,
            precio_consulta: 22000,
            modelo_cobro: "comision",
            comision_porcentaje: 10,
            monto_renta_fija: 15000,
            phone: "50687773344",
            horarios_disponibles: ["Mar 28 Jul - 09:00 AM", "Jue 30 Jul - 11:30 AM", "Sáb 01 Ago - 08:00 AM"],
            organizacion_id: orgId,
          },
          {
            id: "med_03",
            nombre: "Dr. José Carlos Sánchez",
            especialidad: "Medicina del Deporte y Ecografía",
            foto: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80",
            estrellas: 4.8,
            resenas_count: 38,
            ubicacion: "Heredia Central – Mediplaza Sede Norte",
            provincia: "Heredia",
            lat: 9.9981,
            lng: -84.1197,
            precio_consulta: 30000,
            modelo_cobro: "renta_fija",
            comision_porcentaje: 0,
            monto_renta_fija: 15000,
            phone: "50683335566",
            horarios_disponibles: ["Lun 27 Jul - 03:00 PM", "Mié 29 Jul - 09:30 AM", "Vie 31 Jul - 01:00 PM"],
            organizacion_id: orgId,
          },
          {
            id: "med_04",
            nombre: "Dra. Karen Solano",
            especialidad: "Nutrición Deportiva & Composición Corporal",
            foto: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80",
            estrellas: 4.9,
            resenas_count: 29,
            ubicacion: "Alajuela – Centro de Alto Rendimiento GAM",
            provincia: "Alajuela",
            lat: 10.0162,
            lng: -84.2116,
            precio_consulta: 25000,
            modelo_cobro: "comision",
            comision_porcentaje: 12,
            monto_renta_fija: 15000,
            phone: "50686664422",
            horarios_disponibles: ["Mar 28 Jul - 02:00 PM", "Jue 30 Jul - 04:00 PM", "Vie 31 Jul - 10:00 AM"],
            organizacion_id: orgId,
          },
        ];
        await supabase.from("directorio_medicos").insert(initialDBMedicos);
        
        const mapped: MedicoEspecialista[] = initialDBMedicos.map((m: any) => ({
          id: m.id,
          nombre: m.nombre,
          especialidad: m.especialidad,
          foto: m.foto,
          estrellas: m.estrellas,
          resenasCount: m.resenas_count,
          ubicacion: m.ubicacion,
          provincia: m.provincia,
          lat: m.lat,
          lng: m.lng,
          precioConsulta: m.precio_consulta,
          modeloCobro: m.modelo_cobro,
          comisionPorcentaje: m.comision_porcentaje,
          montoRentaFija: m.monto_renta_fija,
          phone: m.phone,
          horariosDisponibles: m.horarios_disponibles,
        }));
        updateMedicosState(mapped);
      }
    } catch (err) {
      console.warn("Directorio DB fetch error:", err);
    }
  };

  useEffect(() => {
    fetchDirectorioDB();
  }, []);

  const handleAfiliarMedico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoEspecialidad || !nuevoUbicacion) {
      toast.error("Por favor completa el nombre, especialidad y ubicación del médico.");
      return;
    }

    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";
    const newId = `med_${Date.now()}`;
    const horariosArr = nuevoHorariosRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const latCoord = nuevoProvincia === "Heredia" ? 9.9981 : nuevoProvincia === "Alajuela" ? 10.0162 : nuevoProvincia === "Cartago" ? 9.8644 : 9.9281;
    const lngCoord = nuevoProvincia === "Heredia" ? -84.1197 : nuevoProvincia === "Alajuela" ? -84.2116 : nuevoProvincia === "Cartago" ? -83.9194 : -84.0907;

    const nuevoMedico: MedicoEspecialista = {
      id: newId,
      nombre: nuevoNombre,
      especialidad: nuevoEspecialidad,
      foto: nuevoFoto || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80",
      estrellas: 5.0,
      resenasCount: 1,
      ubicacion: nuevoUbicacion,
      provincia: nuevoProvincia,
      lat: latCoord,
      lng: lngCoord,
      precioConsulta: Number(nuevoPrecio) || 25000,
      modeloCobro: nuevoModeloCobro,
      comisionPorcentaje: Number(nuevoComision) || 10,
      montoRentaFija: Number(nuevoRentaFija) || 15000,
      phone: nuevoPhone || "50688990011",
      horariosDisponibles: horariosArr.length > 0 ? horariosArr : ["Lun 27 Jul - 10:00 AM", "Mié 29 Jul - 02:00 PM"],
    };

    // Insert to Supabase DB
    await supabase.from("directorio_medicos").insert([{
      id: nuevoMedico.id,
      nombre: nuevoMedico.nombre,
      especialidad: nuevoMedico.especialidad,
      foto: nuevoMedico.foto,
      estrellas: nuevoMedico.estrellas,
      resenas_count: nuevoMedico.resenasCount,
      ubicacion: nuevoMedico.ubicacion,
      provincia: nuevoMedico.provincia,
      lat: nuevoMedico.lat,
      lng: nuevoMedico.lng,
      precio_consulta: nuevoMedico.precioConsulta,
      modelo_cobro: nuevoMedico.modeloCobro,
      comision_porcentaje: nuevoMedico.comisionPorcentaje,
      monto_renta_fija: nuevoMedico.montoRentaFija,
      phone: nuevoMedico.phone,
      horarios_disponibles: nuevoMedico.horariosDisponibles,
      organizacion_id: orgId,
    }]).then(({ error }) => {
      if (error) console.warn("Supabase insert note:", error.message);
    });

    const updated = [nuevoMedico, ...medicosList];
    updateMedicosState(updated);
    setOpenAfiliarModal(false);

    // Reset form
    setNuevoNombre("");
    setNuevoFoto("");
    setNuevoUbicacion("");
    setNuevoPrecio("28000");

    toast.success(`🎉 ¡${nuevoMedico.nombre} afiliado con éxito al Marketplace y publicado en la Pestaña 1!`);
  };

  const handleDeleteMedico = async (id: string, nombre: string) => {
    await supabase.from("directorio_medicos").delete().eq("id", id);
    const updated = medicosList.filter((m) => m.id !== id);
    updateMedicosState(updated);
    toast.success(`Especialista ${nombre} eliminado de la base de datos BD ✓`);
  };

  const handleCreateCita = (e: React.FormEvent) => {
    e.preventDefault();
    const selJugador = jugadores.find((j) => j.id === jugadorId);

    RendimientoStore.addCitaFisioterapia({
      jugadorId,
      jugadorNombre: selJugador?.nombre || "Deportista U13",
      fisioterapeutaNombre,
      fecha,
      hora,
      motivo,
      tratamientoAplicado,
      nivelDolorEva: Number(nivelDolorEva),
      estado: "programada",
    });

    setCitasList(RendimientoStore.getCitasFisioterapia());
    setOpenCreate(false);
    toast.success("Cita de fisioterapia agendada con éxito.");
  };

  const handleCreateTratamientoDirecto = (e: React.FormEvent) => {
    e.preventDefault();
    const selJugador = jugadores.find((j) => j.id === trataJugadorId);

    RendimientoStore.addCitaFisioterapia({
      jugadorId: trataJugadorId,
      jugadorNombre: selJugador?.nombre || "Deportista U13",
      fisioterapeutaNombre,
      fecha: new Date().toISOString().split("T")[0],
      hora: "10:00",
      motivo: trataDiagnostico,
      tratamientoAplicado: trataTecnicas,
      nivelDolorEva: Number(trataEva),
      estado: "completada",
    });

    setCitasList(RendimientoStore.getCitasFisioterapia());
    setOpenCreateTratamiento(false);
    toast.success("Sesión de tratamiento registrada exitosamente en el historial clínico.");
  };

  // 💰 MONETIZACIÓN AUTOMÁTICA: RESERVA Y COMISIÓN A FINANZAS
  const handleConfirmarReservaMarketplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalReservarMedico) return;

    const { medico, slot } = modalReservarMedico;
    const selJugador = jugadores.find((j) => j.id === reservaJugadorId);
    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";
    const todayStr = new Date().toISOString().split("T")[0];

    // Cálculo de comisión para la academia (10% de la consulta o renta fija)
    const montoComision = Math.round(medico.precioConsulta * (medico.comisionPorcentaje / 100));

    // 1. Agregar cita a la agenda médica
    RendimientoStore.addCitaFisioterapia({
      jugadorId: selJugador?.id || "j1",
      jugadorNombre: selJugador?.nombre || "Deportista Registrado",
      fisioterapeutaNombre: medico.nombre,
      fecha: todayStr,
      hora: slot.split("-")[1]?.trim() || "10:00 AM",
      motivo: `Consulta Especializada (${medico.especialidad})`,
      tratamientoAplicado: `Evaluación clínica en ${medico.ubicacion}`,
      nivelDolorEva: 3,
      estado: "programada",
    });
    setCitasList(RendimientoStore.getCitasFisioterapia());

    // 2. INYECCIÓN AUTOMÁTICA DE COMISIÓN EN SUPABASE BD (PAGOS / LIBRO DE CAJA GENERAL)
    const nuevoPagoComision = {
      id: `pago_medico_${Date.now()}`,
      jugador_id: selJugador?.id || "j1",
      jugador_nombre: selJugador?.nombre || "Padre de Familia",
      monto: montoComision,
      concepto: `Comisión Directorio Médico - ${medico.nombre} (${medico.especialidad})`,
      categoria: "Directorio Médico / Comisiones",
      sede: medico.ubicacion,
      metodo: "Transferencia Bancaria",
      fecha: todayStr,
      estado: "completado",
      organizacion_id: orgId,
    };

    await supabase.from("pagos").insert([nuevoPagoComision]).then(({ error }) => {
      if (error) console.warn("Supabase pago insert note:", error.message);
    });
    RendimientoStore.savePago(nuevoPagoComision);

    toast.success(
      `🎉 ¡Cita reservada con ${medico.nombre}! Inyectados ₡${montoComision.toLocaleString()} de comisión al Libro de Caja General de Finanzas.`
    );
    setModalReservarMedico(null);
  };

  const handleAtenderClick = (c: CitaFisioterapia) => {
    setSelectedCitaForAtencion(c);
    setIsOpenAtencionModal(true);
  };

  const handleAtencionComplete = () => {
    setCitasList(RendimientoStore.getCitasFisioterapia());
    setActiveTab("tratamientos");
    toast.info("Redirigido a Historial de Tratamientos para auditar el registro clínico ✓");
  };

  // 🔒 MATRIZ DE PRIVACIDAD MÉDICA QUIRÚRGICA (SEGMENTACIÓN POR ROLES)
  const filteredCitas = useMemo(() => {
    return citasList.filter((c) => {
      const jObj = jugadores.find((j) => j.id === c.jugadorId || j.nombre === c.jugadorNombre);
      const cat = jObj?.categoria || "";

      // 1. Rol Padre: Candado por ID de hijo
      if (userRole === "padre") {
        if (c.jugadorId !== "j1" && c.jugadorNombre !== "Brayan Zamora") return false;
      }

      // 2. Rol Entrenador: Candado por categoría asignada (Sub-15)
      if (userRole === "entrenador") {
        if (cat !== "Sub-15" && cat !== "U15") return false;
      }

      // Buscador global (únicamente para admin y coach de su grupo)
      return (
        c.jugadorNombre.toLowerCase().includes(search.toLowerCase()) ||
        c.fisioterapeutaNombre.toLowerCase().includes(search.toLowerCase()) ||
        c.motivo.toLowerCase().includes(search.toLowerCase()) ||
        cat.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [citasList, jugadores, search, userRole]);

  const tratamientosCompletados = useMemo(() => {
    return filteredCitas.filter((c) => c.estado === "completada" || c.tratamientoAplicado);
  }, [filteredCitas]);

  // Medicos filtrados en Marketplace
  const medicosFiltrados = useMemo(() => {
    return medicosList.filter((m) => {
      if (filterProvincia !== "all" && m.provincia !== filterProvincia) return false;
      if (searchDirectorio) {
        const q = searchDirectorio.toLowerCase();
        return (
          m.nombre.toLowerCase().includes(q) ||
          m.especialidad.toLowerCase().includes(q) ||
          m.ubicacion.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [medicosList, filterProvincia, searchDirectorio]);

  return (
    <div className="font-['Segoe_UI',sans-serif] space-y-6 pb-12 text-slate-900 dark:text-slate-100 w-full max-w-full overflow-x-hidden">
      
      {/* BOTÓN VOLVER */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-slate-500 font-bold">
          <Link to="/medico">
            <ArrowLeft className="h-4 w-4" /> Volver al Área Médica
          </Link>
        </Button>
      </div>

      {/* HEADER BANNER CON CONMUTADOR DE ROLES DE SEGURIDAD (RESPONSIVO PWA 100%) */}
      <div className="page-header flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full max-w-full overflow-hidden box-border">
        <div className="space-y-1.5 w-full md:w-auto min-w-0 max-w-full">
          <div className="flex flex-wrap items-center gap-2 max-w-full">
            <Badge className="badge-pill badge-neutral truncate max-w-full">
              PORTAL MÉDICO & MARKETPLACE ESTILO HULIHEALTH
            </Badge>
            <Badge className="badge-pill badge-neutral truncate max-w-full">
              {userRole === "admin" ? "🏢 ROL ADMINISTRADOR (ACCESO COMPLETO)" : userRole === "entrenador" ? "📋 ROL ENTRENADOR (COACH OS)" : "👨‍👩‍👦 ROL PADRE DE FAMILIA / ATLETA"}
            </Badge>
          </div>
          <h1 className="page-header-title flex items-center gap-2 truncate max-w-full">
            <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400 shrink-0" /> <span className="truncate">Fisioterapia, Tratamientos & Directorio</span>
          </h1>
          <p className="page-header-subtitle max-w-xl">
            {userRole === "admin"
              ? "Gobernanza completa, agenda de citas, bitácora clínica, escala EVA y panel de comisiones BD hacia Finanzas."
              : userRole === "entrenador"
              ? "Herramienta de recomendación médica de primer impacto para místeres y preparadores físicos."
              : "Catálogo oficial de especialistas afiliados con pasarela de pago digital en colones (₡)."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto max-w-full min-w-0">
          {/* CONTROL DE SIMULACIÓN DE ROL (MOBILE-OPTIMIZED) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 bg-slate-950/80 border border-indigo-500/40 p-2 rounded-2xl text-xs font-semibold w-full sm:w-auto max-w-full box-border overflow-hidden">
            <span className="text-[10px] text-slate-400 font-mono uppercase shrink-0">Vista por Rol:</span>
            <select
              value={userRole}
              onChange={(e: any) => {
                const newRole = e.target.value;
                setUserRole(newRole);
                if (newRole === "padre") setActiveTab("directorio");
                if (newRole === "entrenador" && activeTab === "configuracion") setActiveTab("directorio");
              }}
              className="bg-indigo-900 text-white font-bold h-8 px-2 rounded-xl text-[11px] outline-none border border-indigo-400/40 cursor-pointer w-full sm:w-auto max-w-full truncate"
            >
              <option value="admin">🏢 Administrador (Control Total & Comisiones)</option>
              <option value="entrenador">📋 Entrenador (Coach OS - Recomendaciones)</option>
              <option value="padre">👨‍👩‍👦 Padre / Alumno (App Móvil - Compras)</option>
            </select>
          </div>

          {activeTab === "agenda" && userRole !== "padre" && (
            <Button onClick={() => setOpenCreate(!openCreate)} className="btn-primary gap-1.5 w-full sm:w-auto shrink-0">
              <Plus className="h-4 w-4" /> ➕ Agendar Nueva Cita
            </Button>
          )}

          {activeTab === "tratamientos" && userRole !== "padre" && (
            <Button onClick={() => setOpenCreateTratamiento(!openCreateTratamiento)} className="btn-primary gap-1.5 w-full sm:w-auto shrink-0">
              <Plus className="h-4 w-4" /> ➕ Registrar Tratamiento
            </Button>
          )}

          {activeTab === "directorio" && userRole === "admin" && (
            <Button
              onClick={() => setActiveTab("configuracion")}
              className="btn-secondary gap-1.5 w-full sm:w-auto shrink-0"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span className="truncate">Configurar Proveedores & Comisiones</span>
            </Button>
          )}
        </div>
      </div>

      {/* 🧭 NAVEGACIÓN SUPERIOR POR PESTAÑAS HORIZONTALES (RESTRICCIÓN POR ROLES) */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <div className="border-b border-border pb-2 overflow-x-auto">
          <TabsList className="bg-transparent border-0 p-0 h-auto gap-1 flex-nowrap min-w-max">
            <TabsTrigger
              value="directorio"
              className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#64748B] border border-[#E2E8F0] px-4 py-2 text-[13px] font-medium rounded-[8px] transition-all shadow-sm"
            >
              🏥 Directorio Médico & Marketplace ({medicosList.length})
            </TabsTrigger>

            {userRole !== "padre" && (
              <TabsTrigger
                value="agenda"
                className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#64748B] border border-[#E2E8F0] px-4 py-2 text-[13px] font-medium rounded-[8px] transition-all shadow-sm"
              >
                📅 Agenda de Citas Logística ({citasList.length})
              </TabsTrigger>
            )}

            {userRole !== "padre" && (
              <TabsTrigger
                value="tratamientos"
                className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#64748B] border border-[#E2E8F0] px-4 py-2 text-[13px] font-medium rounded-[8px] transition-all shadow-sm"
              >
                🩺 Historial de Tratamientos ({tratamientosCompletados.length})
              </TabsTrigger>
            )}

            {userRole === "admin" && (
              <TabsTrigger
                value="configuracion"
                className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-[#64748B] border border-[#E2E8F0] px-4 py-2 text-[13px] font-medium rounded-[8px] transition-all shadow-sm"
              >
                ⚙️ Configuración & Comisiones BD
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* ========================================================================= */}
        {/* 📅 PESTAÑA 1: AGENDA DE CITAS & TURNOS DE FISIOTERAPIA */}
        {/* ========================================================================= */}
        <TabsContent value="agenda" className="mt-0 space-y-4">
          
          {/* FORMULARIO AGENDAR CITA */}
          {openCreate && (
            <Card className="premium-card space-y-4">
              <CardTitle className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <ActivitySquare className="h-5 w-5 text-[#2563EB]" /> Agendar Cita de Fisioterapia
              </CardTitle>
              <form onSubmit={handleCreateCita} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Deportista</label>
                    <select
                      value={jugadorId}
                      onChange={(e) => setJugadorId(e.target.value)}
                      className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-semibold mt-1 outline-none"
                    >
                      {jugadores.map((j) => (
                        <option key={j.id} value={j.id}>{j.nombre} ({j.categoria})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">Fisioterapeuta / Especialista Afiliado</label>
                    <select
                      value={fisioterapeutaNombre}
                      onChange={(e) => setFisioterapeutaNombre(e.target.value)}
                      className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-semibold mt-1 outline-none"
                    >
                      {medicosList && medicosList.length > 0 ? (
                        medicosList.map((m) => (
                          <option key={m.id} value={m.nombre}>{m.nombre} ({m.especialidad})</option>
                        ))
                      ) : (
                        <>
                          <option value="Licda. Melissa Fernández">Licda. Melissa Fernández (Fisioterapia y Readaptación)</option>
                          <option value="Dr. Mauricio Alpízar">Dr. Mauricio Alpízar (Ortopedia y Traumatología)</option>
                          <option value="Dr. José Carlos Sánchez">Dr. José Carlos Sánchez (Medicina del Deporte)</option>
                          <option value="Dra. Karen Solano">Dra. Karen Solano (Nutrición Deportiva)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-foreground">Fecha</label>
                      <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-9 text-xs rounded-xl mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground">Hora</label>
                      <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="h-9 text-xs rounded-xl mt-1" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Motivo de Consulta</label>
                    <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="h-9 text-xs rounded-xl mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Tratamiento Planificado</label>
                    <Input value={tratamientoAplicado} onChange={(e) => setTratamientoAplicado(e.target.value)} className="h-9 text-xs rounded-xl mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground">Nivel de Dolor Escala EVA (1 - 10)</label>
                    <Input type="number" min="1" max="10" value={nivelDolorEva} onChange={(e) => setNivelDolorEva(Number(e.target.value))} className="h-9 text-xs rounded-xl mt-1" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpenCreate(false)} className="h-8 text-xs font-semibold rounded-xl">Cancelar</Button>
                  <Button type="submit" className="h-8 text-xs bg-indigo-600 text-white font-bold rounded-xl shadow-xs">Guardar Turno</Button>
                </div>
              </form>
            </Card>
          )}

          {/* AGENDA DE CITAS TABLE */}
          <Card className="border border-border rounded-3xl bg-card p-6 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" /> Listado de Citas Programadas ({filteredCitas.length})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-normal">Agenda de fisioterapia deportiva y acceso directo al expediente clínico.</CardDescription>
              </div>

              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por jugador, categoría o especialista..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-normal">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <th className="p-3.5">Deportista</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5">Fisioterapeuta</th>
                    <th className="p-3.5">Fecha y Hora</th>
                    <th className="p-3.5">Motivo & Tratamiento</th>
                    <th className="p-3.5 text-center">Nivel Dolor (EVA)</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCitas.map((c) => {
                    const jObj = jugadores.find((j) => j.id === c.jugadorId || (c.jugadorNombre && (j.nombre.toLowerCase().includes(c.jugadorNombre.toLowerCase()) || c.jugadorNombre.toLowerCase().includes(j.nombre.toLowerCase()))));
                    const targetId = jObj?.id || c.jugadorId || "j1";
                    const displayName = (c.jugadorNombre && c.jugadorNombre !== "Deportista U13") ? c.jugadorNombre : (jObj?.nombre || "Santiago Jiménez Valverde");
                    const catName = jObj?.categoria || (displayName.includes("Mateo") ? "U15 Liga" : "U13 Asoderive");
                    const avatarUrl = jObj?.avatar || "";

                    return (
                      <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-indigo-100 dark:border-indigo-950">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback className="bg-indigo-600 text-white font-bold">{displayName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link
                                to="/medico/jugador/$id"
                                params={{ id: targetId }}
                                className="font-bold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1 text-xs"
                              >
                                {displayName} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </Link>
                              <p className="text-[10px] text-muted-foreground font-mono">ID: {jObj?.identificacion || "DOC-20004"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border-indigo-200 text-[10px]">
                            {catName}
                          </Badge>
                        </td>

                        <td className="p-3.5 text-indigo-600 font-semibold">{homologarNombreMedico(c.fisioterapeutaNombre)}</td>
                        <td className="p-3.5 font-mono text-muted-foreground">{formatFechaLatino(c.fecha)} - {c.hora}</td>
                        <td className="p-3.5">
                          <p className="font-semibold text-foreground">{c.motivo}</p>
                          <p className="text-[10px] text-muted-foreground">{c.tratamientoAplicado}</p>
                        </td>
                        <td className="p-3.5 text-center">
                          <Badge className={`font-mono text-[10px] font-bold ${c.nivelDolorEva > 4 ? "bg-rose-500/15 text-rose-600 border-rose-500/30" : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"}`}>
                            EVA {c.nivelDolorEva}/10
                          </Badge>
                        </td>
                        <td className="p-3.5 text-center">
                          <Badge className={`font-bold text-[10px] uppercase border-none px-2.5 py-0.5 rounded-full ${
                            c.estado === "completada" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-indigo-500/15 text-indigo-600 border-indigo-500/30"
                          }`}>
                            {c.estado}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.estado === "completada" ? (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleAtenderClick(c)}
                                className="h-7 text-[10px] font-bold rounded-lg border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 gap-1"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Ver / Editar Ficha
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                onClick={() => handleAtenderClick(c)}
                                className="h-7 text-[10px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white gap-1 shadow-xs"
                              >
                                <Stethoscope className="h-3.5 w-3.5" /> Atender
                              </Button>
                            )}
                            <Button asChild size="xs" variant="outline" className="h-7 text-[10px] font-bold rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1">
                              <Link to="/medico/jugador/$id" params={{ id: targetId }}>
                                <FileText className="h-3.5 w-3.5" /> Expediente
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 🩺 PESTAÑA 2: HISTORIAL DE TRATAMIENTOS & CONTROL DE ESCALA EVA */}
        {/* ========================================================================= */}
        <TabsContent value="tratamientos" className="mt-0 space-y-4">
          
          {/* FORMULARIO TRATAMIENTO DIRECTO */}
          {openCreateTratamiento && (
            <Card className="shadow-card border border-emerald-500/30 rounded-3xl bg-card p-6 space-y-4">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Pill className="h-5 w-5 text-emerald-600" /> Registrar Sesión de Tratamiento Clínico
              </CardTitle>
              <form onSubmit={handleCreateTratamientoDirecto} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground">Deportista Atendido</label>
                    <select
                      value={trataJugadorId}
                      onChange={(e) => setTrataJugadorId(e.target.value)}
                      className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-semibold mt-1 outline-none"
                    >
                      {jugadores.map((j) => (
                        <option key={j.id} value={j.id}>{j.nombre} ({j.categoria})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">Técnicas / Terapias Aplicadas</label>
                    <Input
                      value={trataTecnicas}
                      onChange={(e) => setTrataTecnicas(e.target.value)}
                      placeholder="Ej. Termoterapia + Ultrasonido + Crioterapia"
                      className="h-9 text-xs rounded-xl mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground">Nivel de Dolor Escala EVA (1 - 10)</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={trataEva}
                      onChange={(e) => setTrataEva(Number(e.target.value))}
                      className="h-9 text-xs rounded-xl mt-1 font-mono font-bold text-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">Diagnóstico / Comentarios del Fisioterapeuta</label>
                  <Input
                    value={trataDiagnostico}
                    onChange={(e) => setTrataDiagnostico(e.target.value)}
                    placeholder="Ej. Readaptación de rodilla con ejercicio en bosu y vendaje funcional"
                    className="h-9 text-xs rounded-xl mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpenCreateTratamiento(false)} className="h-8 text-xs font-semibold rounded-xl">Cancelar</Button>
                  <Button type="submit" className="h-8 text-xs bg-emerald-600 text-white font-bold rounded-xl shadow-xs gap-1">
                    <Check className="h-4 w-4" /> Guardar Tratamiento BD
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* DATATABLE CLÍNICO DE TRATAMIENTOS APLICADOS */}
          <Card className="border border-border rounded-3xl bg-card p-6 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-emerald-600" /> Bitácora de Terapias Aplicadas & Escala EVA ({tratamientosCompletados.length})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-normal">
                  Registro detallado de técnicas fisioterapéuticas, evolución de dolor y readaptación deportiva.
                </CardDescription>
              </div>

              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-mono text-[10px]">
                Escala EVA Calibrada 1-10
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-normal">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <th className="p-3.5">Deportista</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5">Fisioterapeuta</th>
                    <th className="p-3.5">Fecha Sesión</th>
                    <th className="p-3.5">Técnicas / Terapias Aplicadas</th>
                    <th className="p-3.5 text-center">Nivel Dolor (EVA)</th>
                    <th className="p-3.5 text-center">Estado Clínico</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tratamientosCompletados.length > 0 ? (
                    tratamientosCompletados.map((t) => {
                      const jObj = jugadores.find((j) => j.id === t.jugadorId || (t.jugadorNombre && j.nombre.toLowerCase().includes(t.jugadorNombre.toLowerCase())));
                      const targetId = jObj?.id || t.jugadorId || "j1";
                      const displayName = t.jugadorNombre || jObj?.nombre || "Santiago Jiménez Valverde";
                      const catName = jObj?.categoria || "U13 Asoderive";
                      const avatarUrl = jObj?.avatar || "";

                      return (
                        <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-emerald-100 dark:border-emerald-950">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="bg-emerald-600 text-white font-bold">{displayName[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-foreground text-xs">{displayName}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">ID: {jObj?.identificacion || "DOC-20004"}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border-emerald-200 text-[10px]">
                              {catName}
                            </Badge>
                          </td>

                          <td className="p-3.5 font-semibold text-emerald-600">{homologarNombreMedico(t.fisioterapeutaNombre)}</td>
                          <td className="p-3.5 font-mono text-muted-foreground">{formatFechaLatino(t.fecha)}</td>
                          <td className="p-3.5">
                            <p className="font-bold text-foreground">{t.tratamientoAplicado}</p>
                            <p className="text-[10px] text-muted-foreground italic">{t.motivo}</p>
                          </td>
                          <td className="p-3.5 text-center">
                            <Badge className={`font-mono text-[10px] font-bold ${t.nivelDolorEva > 4 ? "bg-rose-500/15 text-rose-600 border-rose-500/30" : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"}`}>
                              EVA {t.nivelDolorEva}/10
                            </Badge>
                          </td>
                          <td className="p-3.5 text-center">
                            <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                              ✓ Sesión Finalizada
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right">
                            <Button asChild size="xs" variant="outline" className="h-7 text-[10px] font-bold rounded-lg border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 gap-1">
                              <Link to="/medico/jugador/$id" params={{ id: targetId }}>
                                <FileText className="h-3.5 w-3.5" /> Expediente
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No hay sesiones de tratamiento registradas en la bitácora.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 🏥 PESTAÑA 3: DIRECTORIO MÉDICO & MARKETPLACE HULIHEALTH STYLE (DIVIDIDO EN 2 BLOQUES) */}
        {/* ========================================================================= */}
        <TabsContent value="directorio" className="mt-0 space-y-6">
          
          {/* BARRA DE BÚSQUEDA Y FILTROS POR PROVINCIA */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600" /> Marketplace de Especialistas Médicos & Ortopedistas Afiliados
              </h3>
              <p className="text-xs text-purple-700 dark:text-purple-400 font-normal">
                Reserva de turnos con cobro de comisión directo e inyección al Libro de Caja General.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg justify-end">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar especialista, clínica u ortopedista..."
                  value={searchDirectorio}
                  onChange={(e) => setSearchDirectorio(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background"
                />
              </div>

              <select
                value={filterProvincia}
                onChange={(e) => setFilterProvincia(e.target.value)}
                className="h-9 px-3 bg-background border border-border rounded-xl text-xs font-semibold outline-none"
              >
                <option value="all">Todas las Sedes GAM</option>
                <option value="San José">📍 San José</option>
                <option value="Heredia">📍 Heredia</option>
                <option value="Alajuela">📍 Alajuela</option>
              </select>
            </div>
          </div>

          {/* LIENZO DIVIDIDO EN 2 BLOQUES: IZQUIERDA TARJETAS / DERECHA MAPA */}
          <div className="grid gap-6 lg:grid-cols-12 w-full max-w-full min-w-0">
            
            {/* ⬅️ BLOQUE IZQUIERDO (COLUMNA ANCHA: 7/12): LISTA DE TARJETAS PROFESIONALES */}
            <div className="lg:col-span-7 space-y-4 w-full min-w-0 max-w-full overflow-hidden">
              {medicosFiltrados.map((m) => (
                <Card key={m.id} className="p-3 sm:p-4 bg-card border border-border shadow-xs hover:border-purple-500/40 transition-all rounded-2xl space-y-3 w-full min-w-0 max-w-full box-border overflow-hidden">
                  
                  {/* Perfil del Médico (Mobile-Optimized PWA) */}
                  <div className="flex items-start gap-2.5 sm:gap-3.5 w-full min-w-0">
                    <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-purple-500/30 rounded-2xl shrink-0">
                      <AvatarImage src={m.foto} className="object-cover" />
                      <AvatarFallback className="bg-purple-600 text-white font-bold text-base">{m.nombre[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
                        <h4 className="font-extrabold text-xs sm:text-sm text-foreground truncate min-w-0 flex-1">{m.nombre}</h4>
                        <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                          <span>{m.estrellas}</span>
                          <span className="text-[9px] text-muted-foreground font-normal">({m.resenasCount})</span>
                        </div>
                      </div>

                      <p className="text-[11px] sm:text-xs font-semibold text-purple-600 dark:text-purple-400 truncate">{m.especialidad}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-muted-foreground font-normal pt-1 min-w-0">
                        <span className="flex items-center gap-1 min-w-0 truncate">
                          <MapPin className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          <span className="truncate text-[10px] sm:text-[11px]">{m.ubicacion}</span>
                        </span>
                        <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] self-start sm:self-auto shrink-0">
                          ₡{m.precioConsulta.toLocaleString()} / Sesión
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Agenda Digital de Turnos Abiertos (Carrusel Horizontal) */}
                  <div className="pt-2 border-t space-y-1.5 w-full min-w-0 max-w-full overflow-hidden">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground flex items-center gap-1 truncate">
                      <Clock className="h-3 w-3 text-indigo-500 shrink-0" /> Turnos Disponibles (Agendamiento directo):
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full w-full min-w-0 scrollbar-thin">
                      {m.horariosDisponibles.map((slot, idx) => (
                        <Button
                          key={idx}
                          size="xs"
                          variant="outline"
                          onClick={() => setModalReservarMedico({ medico: m, slot })}
                          className="h-7 text-[10px] font-mono font-bold border-purple-500/30 hover:bg-purple-600 hover:text-white rounded-lg shrink-0 px-2"
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Botonera de Acción Rápida (PWA Mobile Ready - Roles Adaptativos) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => window.open(`https://wa.me/${m.phone}`, "_blank")}
                        className="flex-1 sm:flex-none h-8 text-[11px] font-semibold rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp
                      </Button>

                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => toast.info(`Videoconsulta agendada con ${m.nombre}`)}
                        className="flex-1 sm:flex-none h-8 text-[11px] font-semibold rounded-xl border-indigo-500/30 text-indigo-600 hover:bg-indigo-50 gap-1.5"
                      >
                        <Video className="h-3.5 w-3.5 text-indigo-600" /> Videoconsulta
                      </Button>

                      {(userRole === "entrenador" || userRole === "admin") && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setModalRecomendacionMedico(m)}
                          className="flex-1 sm:flex-none h-8 text-[11px] font-medium rounded-[8px] badge-pill badge-info gap-1.5"
                        >
                          💬 Compartir Recomendación
                        </Button>
                      )}
                    </div>

                    <Button
                      size="xs"
                      onClick={() => setModalReservarMedico({ medico: m, slot: m.horariosDisponibles[0] })}
                      className="w-full sm:w-auto btn-primary h-8 text-[11px] gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> {userRole === "padre" ? "🛒 Comprar & Reservar (₡" + m.precioConsulta.toLocaleString() + ")" : "Reservar Cita (₡" + m.precioConsulta.toLocaleString() + ")"}
                    </Button>
                  </div>

                </Card>
              ))}
            </div>

            {/* ➡️ BLOQUE DERECHO (COLUMNA STICKY: 5/12): MAPA INTERACTIVO DE SEDES GAM */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="premium-card space-y-3 sticky top-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <h3 className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
                    <Map className="h-4 w-4 text-[#2563EB]" /> Mapa de Consultorios Médicos GAM
                  </h3>
                  <span className="badge-pill badge-neutral text-[9px] font-mono">Pines Geolocalizados BD</span>
                </div>

                {/* Simulated Google Maps Canvas (Mobile Responsive PWA) */}
                <div className="relative w-full min-h-[300px] bg-slate-100 rounded-[12px] overflow-hidden border border-[#E2E8F0] p-3 flex flex-col justify-between space-y-3">
                  <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>

                  <div className="relative z-10 flex items-center justify-between text-[10px] text-[#64748B] font-mono bg-white border border-[#E2E8F0] p-2 rounded-[8px]">
                    <span>Costa Rica - GAM (San José, Heredia, Alajuela)</span>
                    <span className="text-[#2563EB] font-bold shrink-0">{medicosFiltrados.length} Consultorios</span>
                  </div>

                  {/* Pines Interactivos de Médicos en el Mapa */}
                  <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2 my-auto max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                    {medicosFiltrados.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedPinMedico(m)}
                        className={`p-2 rounded-[8px] border transition-all cursor-pointer text-left space-y-1 ${
                          selectedPinMedico?.id === m.id
                            ? "bg-[#2563EB] text-white border-[#1D4ED8] shadow-md"
                            : "bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="h-3 w-3 text-[#2563EB] shrink-0" />
                          <p className="font-bold text-[11px] truncate">{m.nombre}</p>
                        </div>
                        <p className="text-[9px] text-[#64748B] truncate">{m.ubicacion}</p>
                        <p className="text-[10px] font-mono font-bold text-emerald-600">₡{m.precioConsulta.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {selectedPinMedico && (
                    <div className="relative z-10 bg-white border border-[#E2E8F0] p-2 rounded-[8px] text-[#0F172A] text-[10px] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold block truncate">{selectedPinMedico.nombre}</span>
                        <p className="text-[9px] text-[#64748B] truncate">{selectedPinMedico.ubicacion}</p>
                      </div>
                      <Button size="xs" onClick={() => setModalReservarMedico({ medico: selectedPinMedico, slot: selectedPinMedico.horariosDisponibles[0] })} className="btn-primary h-7 text-[10px] shrink-0">
                        Reservar
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* ⚙️ PESTAÑA 4: CONFIGURACIÓN DE PROVEEDORES MÉDICOS & COMISIONES */}
        {/* ========================================================================= */}
        <TabsContent value="configuracion" className="mt-0 space-y-4">
          {userRole !== "admin" ? (
            <Card className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-center space-y-4 shadow-xl">
              <ShieldCheck className="h-12 w-12 text-rose-500 mx-auto animate-bounce" />
              <Badge className="bg-rose-600 text-white font-extrabold uppercase px-3 py-1 text-xs">🔒 ERROR 403 - ACCESO RESTRINGIDO</Badge>
              <h2 className="text-xl font-black text-rose-900 dark:text-rose-200">Acceso Denegado (Protección Legal de Datos Médicos del Club)</h2>
              <p className="text-xs text-rose-700 dark:text-rose-300 max-w-lg mx-auto font-medium">
                La pestaña de Configuración Comercial, Alta de Especialistas y Reglas de Monetización BD está reservada exclusivamente para el Administrador Global del Club. El acceso para tu rol no está autorizado.
              </p>
              <Button onClick={() => setActiveTab("directorio")} className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs h-9 px-4 shadow-md">
                Regresar al Catálogo del Directorio Médico
              </Button>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-600" /> Configuración de Monetización & Comisiones de Especialistas BD
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-normal">
                    Mantenimiento del catálogo comercial de médicos, horarios de turnos abiertos y reglas de comisión hacia Finanzas.
                  </p>
                </div>

                <Button
                  onClick={() => setOpenAfiliarModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs h-9 gap-1.5 shadow-md"
                >
                  <Plus className="h-4 w-4" /> ➕ Afiliar Nuevo Especialista
                </Button>
              </div>

              <Card className="border border-border rounded-3xl bg-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-normal">
                      <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                        <tr>
                          <th className="p-3.5">Especialista / Médico</th>
                          <th className="p-3.5">Especialidad & Ubicación</th>
                          <th className="p-3.5">Modelo de Cobro</th>
                          <th className="p-3.5 font-mono">Comisión por Cita (%)</th>
                          <th className="p-3.5 font-mono">Renta Fija Mensual (₡)</th>
                          <th className="p-3.5 text-right">Acciones BD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {medicosList.map((m) => (
                          <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                            <td className="p-3.5 font-bold text-foreground flex items-center gap-2">
                              <Avatar className="h-8 w-8 border border-purple-500/30">
                                <AvatarImage src={m.foto} />
                                <AvatarFallback>{m.nombre[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-xs">{m.nombre}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">₡{m.precioConsulta.toLocaleString()} / Sesión</p>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <p className="font-semibold text-purple-600 dark:text-purple-400 text-xs">{m.especialidad}</p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-purple-500" /> {m.ubicacion} ({m.provincia})
                              </p>
                            </td>
                            <td className="p-3.5">
                              <select
                                value={m.modeloCobro}
                                onChange={(e: any) => {
                                  const newMode = e.target.value;
                                  const updated = medicosList.map((x) =>
                                    x.id === m.id
                                      ? {
                                          ...x,
                                          modeloCobro: newMode,
                                          comisionPorcentaje: newMode === "renta_fija" ? 0 : (x.comisionPorcentaje || 10),
                                          montoRentaFija: newMode === "comision" ? 0 : (x.montoRentaFija || 15000),
                                        }
                                      : x
                                  );
                                  updateMedicosState(updated);
                                }}
                                className="h-8 px-2 bg-background border border-border rounded-xl text-xs font-semibold outline-none"
                              >
                                <option value="comision">Porcentaje de Comisión por Cita</option>
                                <option value="renta_fija">Renta Fija (Suscripción Mensual)</option>
                              </select>
                            </td>
                            <td className="p-3.5">
                              <Input
                                type="number"
                                value={m.modeloCobro === "renta_fija" ? 0 : m.comisionPorcentaje}
                                disabled={m.modeloCobro === "renta_fija"}
                                onChange={(e) => {
                                  const updated = medicosList.map((x) => x.id === m.id ? { ...x, comisionPorcentaje: Number(e.target.value) } : x);
                                  updateMedicosState(updated);
                                }}
                                className={
                                  m.modeloCobro === "renta_fija"
                                    ? "h-8 w-20 text-xs font-mono font-bold bg-muted/60 text-muted-foreground opacity-50 cursor-not-allowed border-dashed"
                                    : "h-8 w-20 text-xs font-mono font-bold"
                                }
                              />
                            </td>
                            <td className="p-3.5">
                              <Input
                                type="number"
                                value={m.modeloCobro === "comision" ? 0 : m.montoRentaFija}
                                disabled={m.modeloCobro === "comision"}
                                onChange={(e) => {
                                  const updated = medicosList.map((x) => x.id === m.id ? { ...x, montoRentaFija: Number(e.target.value) } : x);
                                  updateMedicosState(updated);
                                }}
                                className={
                                  m.modeloCobro === "comision"
                                    ? "h-8 w-28 text-xs font-mono font-bold bg-muted/60 text-muted-foreground opacity-50 cursor-not-allowed border-dashed"
                                    : "h-8 w-28 text-xs font-mono font-bold"
                                }
                              />
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="xs"
                                  onClick={async () => {
                                    const finalComision = m.modeloCobro === "renta_fija" ? 0 : Number(m.comisionPorcentaje || 0);
                                    const finalRenta = m.modeloCobro === "comision" ? 0 : Number(m.montoRentaFija || 0);

                                    await supabase.from("directorio_medicos").update({
                                      modelo_cobro: m.modeloCobro,
                                      comision_porcentaje: finalComision,
                                      monto_renta_fija: finalRenta,
                                    }).eq("id", m.id);

                                    const updated = medicosList.map((x) =>
                                      x.id === m.id
                                        ? { ...x, comisionPorcentaje: finalComision, montoRentaFija: finalRenta }
                                        : x
                                    );
                                    updateMedicosState(updated);
                                    toast.success(`Configuración BD guardada para ${m.nombre} (Comisión: ${finalComision}%, Renta: ₡${finalRenta.toLocaleString()}) ✓`);
                                  }}
                                  className="bg-amber-600 text-white font-bold h-7 text-[10px] rounded-lg shadow-xs gap-1"
                                >
                                  <Check className="h-3 w-3" /> Guardar BD
                                </Button>

                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => handleDeleteMedico(m.id, m.nombre)}
                                  className="text-rose-500 hover:bg-rose-50 hover:text-rose-700 h-7 w-7 p-0 rounded-lg"
                                  title="Eliminar especialista"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

      </Tabs>

      {/* MODAL RESERVAR CITA DE MARKETPLACE (PROCESA COMISIÓN Y AUTOMATIZA FINANZAS) */}
      <Dialog open={!!modalReservarMedico} onOpenChange={(open) => !open && setModalReservarMedico(null)}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" /> Reservar Cita en Marketplace Médico
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Vincula la cita con un atleta y genera la comisión automática para el club.
            </DialogDescription>
          </DialogHeader>

          {modalReservarMedico && (
            <form onSubmit={handleConfirmarReservaMarketplace} className="space-y-3 text-xs font-normal">
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-1">
                <p className="font-extrabold text-foreground">{modalReservarMedico.medico.nombre}</p>
                <p className="text-[11px] text-purple-600 font-semibold">{modalReservarMedico.medico.especialidad}</p>
                <p className="text-[10px] text-muted-foreground">Horario: {modalReservarMedico.slot}</p>
                <p className="text-[10px] font-mono font-bold text-emerald-600">
                  Costo: ₡{modalReservarMedico.medico.precioConsulta.toLocaleString()} (Comisión Club: ₡{Math.round(modalReservarMedico.medico.precioConsulta * (modalReservarMedico.medico.comisionPorcentaje / 100)).toLocaleString()})
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Seleccionar Atleta / Alumno</label>
                <select
                  value={reservaJugadorId}
                  onChange={(e) => setReservaJugadorId(e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-semibold mt-1 outline-none"
                  required
                >
                  {jugadores.map((j) => (
                    <option key={j.id} value={j.id}>👤 {j.nombre} ({j.categoria})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalReservarMedico(null)} className="h-9 text-xs font-semibold">Cancelar</Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs gap-1.5 shadow-md">
                  <Check className="h-4 w-4" /> Confirmar Reserva & Inyectar Comisión BD
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL CLÍNICO DEL FISIOTERAPEUTA */}
      <AtencionClinicaModal
        open={isOpenAtencionModal}
        onOpenChange={setIsOpenAtencionModal}
        cita={selectedCitaForAtencion}
        onComplete={handleAtencionComplete}
      />

      {/* ➕ MODAL PASO 1 Y 2: AFILIAR NUEVO ESPECIALISTA (MARKETPLACE HUILHEALTH) */}
      <Dialog open={openAfiliarModal} onOpenChange={setOpenAfiliarModal}>
        <DialogContent className="max-w-xl bg-card border-border rounded-3xl font-['Segoe_UI',sans-serif] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-purple-600" /> Afiliar Nuevo Especialista Médico al Marketplace
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Estructurado en 2 Pasos: Perfil Profesional + Agenda Huli de Horarios y Reglas de Monetización BD.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAfiliarMedico} className="space-y-4 text-xs font-normal pt-2">
            
            {/* PASO 1: DATOS PROFESIONALES Y DE ATRACCIÓN */}
            <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 border-b border-purple-500/20 pb-1.5">
                <Badge className="bg-purple-600 text-white font-bold text-[10px]">PASO 1</Badge>
                <h4 className="font-bold text-purple-900 dark:text-purple-300 text-xs">Datos Profesionales & Ficha Comercial</h4>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold text-foreground">Nombre Completo del Médico *</label>
                  <Input
                    placeholder="Ej: Dr. Mauricio Alpízar"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="h-8 text-xs mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground">Especialidad Destacada *</label>
                  <select
                    value={nuevoEspecialidad}
                    onChange={(e) => setNuevoEspecialidad(e.target.value)}
                    className="w-full h-8 px-2 bg-background border border-border rounded-xl text-xs font-semibold mt-1 outline-none"
                  >
                    <option value="Ortopedia y Traumatología Deportiva">Ortopedia y Traumatología Deportiva</option>
                    <option value="Fisioterapia y Readaptación Funcional">Fisioterapia y Readaptación Funcional</option>
                    <option value="Medicina del Deporte y Ecografía">Medicina del Deporte y Ecografía</option>
                    <option value="Nutrición Deportiva & Composición Corporal">Nutrición Deportiva & Composición Corporal</option>
                    <option value="Psicología Deportiva & Alto Rendimiento">Psicología Deportiva & Alto Rendimiento</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground">Número de Colegiado</label>
                  <Input
                    placeholder="Ej: Med-10492"
                    value={nuevoColegiado}
                    onChange={(e) => setNuevoColegiado(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground">URL Fotografía de Perfil</label>
                  <Input
                    placeholder="https://..."
                    value={nuevoFoto}
                    onChange={(e) => setNuevoFoto(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground">Clínica / Consultorio Privado *</label>
                  <Input
                    placeholder="Ej: Curridabat – Torre Médica CIMA"
                    value={nuevoUbicacion}
                    onChange={(e) => setNuevoUbicacion(e.target.value)}
                    className="h-8 text-xs mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground">Sede / Provincia GAM (Pin Mapa)</label>
                  <select
                    value={nuevoProvincia}
                    onChange={(e) => setNuevoProvincia(e.target.value)}
                    className="w-full h-8 px-2 bg-background border border-border rounded-xl text-xs font-semibold mt-1 outline-none"
                  >
                    <option value="San José">📍 San José</option>
                    <option value="Heredia">📍 Heredia</option>
                    <option value="Alajuela">📍 Alajuela</option>
                    <option value="Cartago">📍 Cartago</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground font-mono">Costo de Consulta (₡) *</label>
                  <Input
                    type="number"
                    value={nuevoPrecio}
                    onChange={(e) => setNuevoPrecio(e.target.value)}
                    className="h-8 text-xs mt-1 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground">Teléfono / WhatsApp Directo</label>
                  <Input
                    placeholder="50688990011"
                    value={nuevoPhone}
                    onChange={(e) => setNuevoPhone(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            {/* PASO 2: AGENDA DE HORARIOS ABIERTOS & MONETIZACIÓN BD */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-500/20 pb-1.5">
                <Badge className="bg-amber-600 text-white font-bold text-[10px]">PASO 2</Badge>
                <h4 className="font-bold text-amber-900 dark:text-amber-300 text-xs">Agenda de Turnos Abiertos & Reglas de Comisión BD</h4>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" /> Turnos Disponibles de la Semana (Separados por comas)
                </label>
                <Input
                  placeholder="Lun 27 Jul - 10:00 AM, Mié 29 Jul - 02:00 PM, Vie 31 Jul - 04:30 PM"
                  value={nuevoHorariosRaw}
                  onChange={(e) => setNuevoHorariosRaw(e.target.value)}
                  className="h-8 text-xs mt-1 font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Se mostrarán como botones de agendamiento 1-clic directo en el catálogo público del club.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-foreground">Modelo de Monetización</label>
                  <select
                    value={nuevoModeloCobro}
                    onChange={(e: any) => setNuevoModeloCobro(e.target.value)}
                    className="w-full h-8 px-2 bg-background border border-border rounded-xl text-xs font-semibold mt-1 outline-none"
                  >
                    <option value="comision">Porcentaje de Comisión por Cita</option>
                    <option value="renta_fija">Renta Fija (Suscripción Mensual)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground font-mono">Comisión por Cita (%)</label>
                  <Input
                    type="number"
                    value={nuevoComision}
                    onChange={(e) => setNuevoComision(e.target.value)}
                    className="h-8 text-xs mt-1 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground font-mono">Renta Fija Mensual (₡)</label>
                  <Input
                    type="number"
                    value={nuevoRentaFija}
                    onChange={(e) => setNuevoRentaFija(e.target.value)}
                    className="h-8 text-xs mt-1 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Sincronización Inmediata con Supabase BD `directorio_medicos`
              </span>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenAfiliarModal(false)} className="h-9 text-xs font-semibold">Cancelar</Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs gap-1.5 shadow-md">
                  <Check className="h-4 w-4" /> Guardar & Afiliar Especialista BD
                </Button>
              </div>
            </div>

          </form>
        </DialogContent>
      </Dialog>
      {/* 📋 MODAL COACH OS: COMPARTIR RECOMENDACIÓN MÉDICA A PADRE DE FAMILIA */}
      <Dialog open={!!modalRecomendacionMedico} onOpenChange={(open) => !open && setModalRecomendacionMedico(null)}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-indigo-600" /> Compartir Recomendación Médica (Coach OS)
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Envía una recomendación directa a la App del Padre de Familia para agendar consulta con el especialista del club.
            </DialogDescription>
          </DialogHeader>

          {modalRecomendacionMedico && (
            <form onSubmit={handleEnviarRecomendacionEntrenador} className="space-y-3 text-xs font-normal pt-1">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-1">
                <p className="font-extrabold text-foreground">{modalRecomendacionMedico.nombre}</p>
                <p className="text-[11px] text-indigo-600 font-semibold">{modalRecomendacionMedico.especialidad}</p>
                <p className="text-[10px] text-muted-foreground">Ubicación: {modalRecomendacionMedico.ubicacion}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Seleccionar Alumno / Jugador de tu Plantilla *</label>
                <select
                  value={recomendarJugadorId}
                  onChange={(e) => setRecomendarJugadorId(e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-semibold mt-1 outline-none"
                  required
                >
                  {jugadores.map((j) => (
                    <option key={j.id} value={j.id}>⚽ {j.nombre} ({j.categoria})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Motivo / Causa de la Recomendación *</label>
                <Input
                  placeholder="Ej: Fatiga muscular o molestia articular tras el partido"
                  value={recomendarMotivo}
                  onChange={(e) => setRecomendarMotivo(e.target.value)}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setModalRecomendacionMedico(null)} className="h-9 text-xs font-semibold">Cancelar</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow-md">
                  <Check className="h-4 w-4" /> Enviar Mensaje a App del Padre
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
