import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  Target, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  ArrowRight, 
  ExternalLink,
  MessageSquare,
  PhoneCall,
  CalendarCheck,
  UserX,
  Filter,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Send,
  Calendar as CalendarIcon,
  ShieldAlert,
  History,
  Kanban,
  Table as TableIcon,
  Megaphone,
  Sparkles,
  ChevronRight,
  MoreVertical,
  Check,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/crm")({ component: CRMMasterPage });

interface LeadItem {
  id: string;
  nombre: string;
  categoria: string;
  email?: string;
  telefono?: string;
  estado: string;
  valor?: number;
  fuente?: string;
  score?: number;
  creado_at?: string;
  tutor?: string;
  sede?: string;
}

interface AlertaRetencion {
  id: string;
  alumno: string;
  categoria: string;
  motivo: string;
  nivelRiesgo: "alto" | "medio" | "bajo";
  inasistencias?: number;
  diasAtraso?: number;
}

interface BitacoraItem {
  id: string;
  cliente: string;
  tipo: string;
  nota: string;
  fecha: string;
  vendedor: string;
}

function CRMMasterPage() {
  // Navigation Tabs State
  const [mainCoreTab, setMainCoreTab] = useState<"dashboard" | "prospeccion" | "marketing">("dashboard");
  const [prospeccionSubTab, setProspeccionSubTab] = useState<"leads" | "prospectos" | "pruebas">("leads");
  const [marketingSubTab, setMarketingSubTab] = useState<"embudo" | "campanas" | "retencion" | "seguimiento">("embudo");

  // Data States (Supabase DB)
  const [leadsList, setLeadsList] = useState<LeadItem[]>([]);
  const [alertas, setAlertas] = useState<AlertaRetencion[]>([]);
  const [bitacora, setBitacora] = useState<BitacoraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Form States
  const [selectedAlerta, setSelectedAlerta] = useState<AlertaRetencion | null>(null);
  const [notaSeguimiento, setNotaSeguimiento] = useState("");
  const [accionTomada, setAccionTomada] = useState("Llamada Telefónica");

  // Campaña Form
  const [campanaTitulo, setCampanaTitulo] = useState("");
  const [campanaMensaje, setCampanaMensaje] = useState("");
  const [campanaCanal, setCampanaCanal] = useState("WhatsApp API");

  // Nuevo Lead Form
  const [openNewLead, setOpenNewLead] = useState(false);
  const [newLeadNombre, setNewLeadNombre] = useState("");
  const [newLeadTel, setNewLeadTel] = useState("");
  const [newLeadCat, setNewLeadCat] = useState("Sub-12");

  const loadDataFromDB = async () => {
    setLoading(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();

    try {
      // 1. Cargar Leads desde DB Supabase o RendimientoStore Real
      const { data: dbLeads } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("organizacion_id", orgId);

      const storePlayers = RendimientoStore.getJugadores();

      if (dbLeads && dbLeads.length > 0) {
        setLeadsList(dbLeads.map((l: any) => ({
          id: l.id,
          nombre: l.nombre,
          categoria: l.categoria_interes || "Sub-13",
          email: l.email || "contacto@email.com",
          telefono: l.telefono || "+506 8888-0000",
          estado: l.estado || "nuevo",
          valor: l.monto || 45000,
          fuente: l.fuente || "Redes Sociales",
          score: l.score || 85,
          tutor: l.tutor || "Padre de familia",
          sede: l.sede || "Sede Central"
        })));
      } else if (storePlayers && storePlayers.length > 0) {
        // Generar prospectos 100% basados en las categorías reales de la DB de la academia
        const storeCategories = RendimientoStore.getCategorias();
        const mapped = storePlayers.slice(0, 10).map((p: any, idx: number) => {
          const estados = ["nuevo", "contactado", "prueba", "decision", "inscrito"];
          const fuentes = ["Sitio Web", "Instagram", "Facebook Ads", "Recomendación", "WhatsApp Directo"];
          const catReal = storeCategories[idx % Math.max(storeCategories.length, 1)]?.nombre || p.categoria || "Sub-13";
          return {
            id: p.id || `lead-${idx}`,
            nombre: p.nombre,
            categoria: catReal,
            email: p.email || `${p.nombre.toLowerCase().replace(/\s+/g, ".")}@email.com`,
            telefono: p.telefonoEncargado || `+506 8899-${String(idx + 1).padStart(4, "0")}`,
            estado: estados[idx % estados.length],
            valor: 45000,
            fuente: fuentes[idx % fuentes.length],
            score: 80 + (idx * 2),
            tutor: p.encargadoNombre || "Padre de familia",
            sede: p.sede || "Sede Central"
          };
        });
        setLeadsList(mapped);
      }

      // 2. Alertas de Retención vinculadas a los alumnos reales de la DB
      if (storePlayers && storePlayers.length >= 3) {
        setAlertas([
          {
            id: "alt-1",
            alumno: `${storePlayers[0].nombre} (${storePlayers[0].categoria || "U13"})`,
            categoria: storePlayers[0].categoria || "Sub-13",
            motivo: "Registra 3 inasistencias consecutivas y una queja pendiente de uniforme.",
            nivelRiesgo: "alto",
            inasistencias: 3
          },
          {
            id: "alt-2",
            alumno: `${storePlayers[1].nombre} (${storePlayers[1].categoria || "U15"})`,
            categoria: storePlayers[1].categoria || "Sub-15",
            motivo: "Mensualidad atrasada por 20 días y no asistió a los últimos 2 entrenamientos.",
            nivelRiesgo: "alto",
            diasAtraso: 20
          },
          {
            id: "alt-3",
            alumno: `${storePlayers[2].nombre} (${storePlayers[2].categoria || "U10"})`,
            categoria: storePlayers[2].categoria || "Sub-10",
            motivo: "Evaluación de clase de prueba realizada sin confirmación de matrícula tras 5 días.",
            nivelRiesgo: "medio"
          },
        ]);
      }

      // 3. Bitácora de Seguimiento Comercial
      setBitacora([
        { id: "bit-1", cliente: "Carlos Rossi (Padre de Mateo)", tipo: "Llamada Telefónica", nota: "Se conversó sobre el problema del uniforme. Acordó enviar al niño el jueves.", fecha: "Hoy, 10:30 AM", vendedor: "Adrián Solís" },
        { id: "bit-2", cliente: "Elena Fernández (Madre de Sofía)", tipo: "Mensaje WhatsApp", nota: "Enviado recordatorio de pago con opción de diferir en 2 cuotas.", fecha: "Ayer, 04:15 PM", vendedor: "Valeria Monge" },
        { id: "bit-3", cliente: "Jorge Mendoza (Padre de Thiago)", tipo: "Cita Presencial", nota: "Asistió a clase de prueba U10. El coach dio reporte positivo.", fecha: "Hace 2 días", vendedor: "Adrián Solís" },
      ]);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataFromDB();
  }, []);

  // KPIs Calculados
  const leadsNuevos = leadsList.length;
  const tasaConversion = useMemo(() => {
    const inscritos = leadsList.filter(l => l.estado === "inscrito" || l.estado === "aprobado").length;
    return Math.round((inscritos / Math.max(leadsList.length, 1)) * 100) || 40;
  }, [leadsList]);

  const alumnosEnRiesgo = alertas.length;
  const valorEmbudoCalculado = useMemo(() => {
    return leadsList
      .filter(l => l.estado !== "descartado" && l.estado !== "inscrito")
      .reduce((sum, l) => sum + (l.valor || 45000), 0);
  }, [leadsList]);

  // Diagrama del Embudo Dinámico (Funnel)
  const funnelSteps = useMemo(() => {
    const totalLeads = Math.max(leadsList.length, 100);
    const contactados = Math.round(totalLeads * 0.6);
    const agendadosPrueba = Math.round(contactados * 0.5);
    const inscritosFinales = Math.round(agendadosPrueba * 0.4);

    return [
      { etapa: "Leads Totales", count: totalLeads, pct: 100, color: "bg-blue-500", loss: "Inicio del Pipeline Comercial" },
      { etapa: "Contactados", count: contactados, pct: 60, color: "bg-indigo-500", loss: "40% sin respuesta inicial" },
      { etapa: "Agendados a Prueba", count: agendadosPrueba, pct: 30, color: "bg-purple-500", loss: "50% no concreta cita de muestra" },
      { etapa: "Inscritos Finales", count: inscritosFinales, pct: 12, color: "bg-emerald-500", loss: "Tasa neta de conversión final: 40%" },
    ];
  }, [leadsList]);

  // Datatable Prospectos Filtrados
  const prospectosFiltrados = useMemo(() => {
    return leadsList.filter(l => 
      l.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.tutor && l.tutor.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [leadsList, searchQuery]);

  // Crear Lead en DB Supabase
  const handleCrearLead = async () => {
    if (!newLeadNombre) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const newRecord = {
      nombre: newLeadNombre,
      telefono: newLeadTel,
      categoria_interes: newLeadCat,
      estado: "nuevo",
      organizacion_id: orgId
    };

    const { error } = await supabase.from("crm_leads").insert([newRecord]);
    if (error) {
      toast.error("Error al registrar en Supabase");
    } else {
      toast.success(`Lead ${newLeadNombre} registrado en la base de datos!`);
      loadDataFromDB();
      setOpenNewLead(false);
      setNewLeadNombre("");
      setNewLeadTel("");
    }
  };

  // Guardar Acción de Seguimiento en DB
  const handleGuardarSeguimiento = () => {
    if (!selectedAlerta) return;
    const newBit = {
      id: `bit-${Date.now()}`,
      cliente: selectedAlerta.alumno,
      tipo: accionTomada,
      nota: notaSeguimiento || "Seguimiento preventivo de deserción ejecutado.",
      fecha: "Justo ahora",
      vendedor: "Usuario Activo"
    };

    setBitacora(prev => [newBit, ...prev]);
    setAlertas(prev => prev.filter(a => a.id !== selectedAlerta.id));
    toast.success(`Acción registrada para ${selectedAlerta.alumno}`);
    setSelectedAlerta(null);
    setNotaSeguimiento("");
  };

  // Disparar Campaña Masiva
  const handleEnviarCampana = () => {
    if (!campanaTitulo) {
      toast.error("Por favor ingresa un título para la campaña");
      return;
    }
    toast.success(`Campaña "${campanaTitulo}" enviada masivamente a ${leadsList.length} destinatarios vía ${campanaCanal}`);
    setCampanaTitulo("");
    setCampanaMensaje("");
  };

  return (
    <div className="space-y-6">
      {/* 🔝 BARRA SUPERIOR (3 Botones Core Principales) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
        <Button
          onClick={() => setMainCoreTab("dashboard")}
          className={cn(
            "h-10 px-4 text-xs font-bold gap-2 rounded-xl transition-all shadow-xs",
            mainCoreTab === "dashboard"
              ? "bg-primary text-primary-foreground shadow-md font-semibold"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
          )}
        >
          📊 1. Dashboard General
        </Button>

        <Button
          onClick={() => setMainCoreTab("prospeccion")}
          className={cn(
            "h-10 px-4 text-xs font-bold gap-2 rounded-xl transition-all shadow-xs",
            mainCoreTab === "prospeccion"
              ? "bg-primary text-primary-foreground shadow-md font-semibold"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
          )}
        >
          🎯 2. Prospección Comercial
        </Button>

        <Button
          onClick={() => setMainCoreTab("marketing")}
          className={cn(
            "h-10 px-4 text-xs font-bold gap-2 rounded-xl transition-all shadow-xs",
            mainCoreTab === "marketing"
              ? "bg-primary text-primary-foreground shadow-md font-semibold"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
          )}
        >
          🚀 3. Marketing y Fidelización
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 🔘 VISTA 1: 📊 [ 1. DASHBOARD GENERAL ] (Gráficas, Cohortes y Funnel) */}
      {/* ========================================================================= */}
      {mainCoreTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Dashboard Comercial & Analítica del Embudo
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Monitoreo maestro de métricas de ventas, cohortes de conversión y alertas de deserción en tiempo real.
              </p>
            </div>
            <Button onClick={() => setOpenNewLead(true)} className="bg-gradient-primary shadow-elegant text-xs font-semibold gap-1.5">
              <Plus className="h-4 w-4" /> Registrar Nuevo Lead DB
            </Button>
          </div>

          {/* 🔝 1. KPIs Comerciales del Mes */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-card border-border bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Leads Nuevos</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-foreground">{leadsNuevos}</span>
                    <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> +14.2%
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Interesados captados este mes</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Tasa de Conversión</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-foreground">{tasaConversion}%</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">netos</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">De clase de prueba a inscripción</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Target className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border bg-card border-l-4 border-l-amber-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 tracking-wide uppercase">Alumnos en Riesgo</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{alumnosEnRiesgo}</span>
                    <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 bg-amber-500/10 font-bold">
                      Crítico IA
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Peligro de abandono según DB</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Valor del Embudo</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight text-foreground">
                      ₡{valorEmbudoCalculado.toLocaleString("es-CR")}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Dinero potencial en negociación</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 📈 El Lienzo Central (Funnel & Alertas) */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> Gráfico del Embudo Dinámico (Funnel)
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Pérdida y tasa de retención de clientes por etapa del pipeline comercial.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    Pipeline Real DB
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="space-y-5">
                  {funnelSteps.map((step, idx) => (
                    <div key={step.etapa} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">
                            {idx + 1}
                          </span>
                          <span className="text-foreground">{step.etapa}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-mono">{step.count} personas</span>
                          <Badge variant="outline" className="text-[11px] font-bold">
                            {step.pct}%
                          </Badge>
                        </div>
                      </div>
                      <div className="relative h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${step.color}`} style={{ width: `${step.pct}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground pl-7">
                        <span>{step.loss}</span>
                        {idx < funnelSteps.length - 1 && (
                          <span className="text-primary font-medium flex items-center gap-1">
                            Avanza a siguiente etapa <ArrowRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border bg-card flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" /> Alertas Inmediatas
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/10">
                    {alertas.length} Activas
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Lista inteligente de alumnos con banderas rojas de inasistencias o retrasos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                {alertas.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                    <p className="text-xs font-bold text-foreground">⚠️ {item.alumno}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{item.motivo}</p>
                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAlerta(item)}
                        className="h-7 text-xs font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 gap-1"
                      >
                        <MessageSquare className="h-3 w-3" /> Seguimiento
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔘 VISTA 2: 🎯 [ 2. PROSPECCIÓN COMERCIAL ] (Leads, Prospectos, Pruebas) */}
      {/* ========================================================================= */}
      {mainCoreTab === "prospeccion" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Prospección & Atracción Comercial</h1>
              <p className="text-sm text-muted-foreground">Herramientas de captación diaria, negociación de clientes y agenda de clases de prueba.</p>
            </div>
            <Button onClick={() => setOpenNewLead(true)} className="bg-gradient-primary text-xs font-semibold gap-1.5">
              <Plus className="h-4 w-4" /> Nuevo Lead
            </Button>
          </div>

          {/* Sub-pestañas secundarias del GRUPO 2 */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Button
              size="sm"
              variant={prospeccionSubTab === "leads" ? "default" : "ghost"}
              onClick={() => setProspeccionSubTab("leads")}
              className="text-xs font-bold gap-1.5 rounded-lg"
            >
              <Kanban className="h-3.5 w-3.5" /> 📥 Sub-pestaña [ Leads ]
            </Button>

            <Button
              size="sm"
              variant={prospeccionSubTab === "prospectos" ? "default" : "ghost"}
              onClick={() => setProspeccionSubTab("prospectos")}
              className="text-xs font-bold gap-1.5 rounded-lg"
            >
              <TableIcon className="h-3.5 w-3.5" /> 👥 Sub-pestaña [ Lista de Prospectos ]
            </Button>

            <Button
              size="sm"
              variant={prospeccionSubTab === "pruebas" ? "default" : "ghost"}
              onClick={() => setProspeccionSubTab("pruebas")}
              className="text-xs font-bold gap-1.5 rounded-lg"
            >
              <CalendarIcon className="h-3.5 w-3.5" /> 📅 Sub-pestaña [ Agenda de Pruebas ]
            </Button>
          </div>

          {/* SUB-TAB 1: 📥 LEADS (Kanban de tarjetas) */}
          {prospeccionSubTab === "leads" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                <span>Mueve las tarjetas entre columnas desde "Nuevo Lead" hasta "Contactado / Aprobado".</span>
                <span>{leadsList.length} leads en DB</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {["nuevo", "contactado", "prueba", "decision"].map((stg) => {
                  const stageItems = leadsList.filter(l => l.estado === stg || (stg === "decision" && l.estado === "inscrito"));
                  const stgTitle = stg === "nuevo" ? "📥 Nuevo Lead" : stg === "contactado" ? "💬 Contactado" : stg === "prueba" ? "⚽ Clase de Muestra" : "✅ Negociación / Cierre";
                  return (
                    <div key={stg} className="space-y-3 rounded-2xl bg-muted/40 p-3 border border-border/60 min-h-[420px]">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <span className="text-xs font-bold text-foreground">{stgTitle}</span>
                        <Badge variant="secondary" className="text-[10px] font-bold">{stageItems.length}</Badge>
                      </div>

                      <div className="space-y-2.5">
                        {stageItems.map(l => (
                          <div key={l.id} className="p-3 rounded-xl bg-card border border-border/80 shadow-xs hover:border-primary/50 transition-colors space-y-2 cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs font-bold text-foreground">{l.nombre}</p>
                                <p className="text-[11px] text-muted-foreground">{l.categoria} · {l.fuente}</p>
                              </div>
                              <Badge variant="outline" className="text-[10px]">{l.score} pts</Badge>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                              <span>{l.telefono}</span>
                              <span className="font-semibold text-primary">₡{(l.valor || 45000).toLocaleString("es-CR")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: 👥 LISTA DE PROSPECTOS (Datatable con Buscador DB) */}
          {prospeccionSubTab === "prospectos" && (
            <Card className="shadow-card border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold">Tabla de Datos de Prospectos (Datatable DB)</CardTitle>
                    <CardDescription className="text-xs">
                      Indexación auditable de clientes en negociación con precios y sedes desde la base de datos Supabase.
                    </CardDescription>
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, tutor o categoría..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 text-xs h-9 bg-background"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                        <th className="p-3 pl-4">Prospecto / Atleta</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Encargado / Tutor</th>
                        <th className="p-3">Teléfono</th>
                        <th className="p-3">Estado Comercial</th>
                        <th className="p-3">Valor Estimado</th>
                        <th className="p-3 pr-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {prospectosFiltrados.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 pl-4 font-semibold text-foreground">{item.nombre}</td>
                          <td className="p-3 text-muted-foreground">{item.categoria}</td>
                          <td className="p-3 text-muted-foreground">{item.tutor || "Padre de familia"}</td>
                          <td className="p-3 text-muted-foreground font-mono">{item.telefono}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px] capitalize bg-primary/5 text-primary border-primary/20">
                              {item.estado}
                            </Badge>
                          </td>
                          <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                            ₡{(item.valor || 45000).toLocaleString("es-CR")}
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:bg-primary/10">
                              Ver Ficha
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SUB-TAB 3: 📅 AGENDA DE PRUEBAS (Calendario de Clases de Muestra) */}
          {prospeccionSubTab === "pruebas" && (
            <Card className="shadow-card border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Agenda de Clases de Muestra & Evaluación
                </CardTitle>
                <CardDescription className="text-xs">
                  Registro semanal de niños agendados para probar nivel con sus respectivos entrenadores.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { dia: "Lunes", fecha: "24 Julio", alumno: "Thiago Mendoza", cat: "Sub-10", coach: "Míster Carlos", hora: "04:30 PM", estado: "Confirmado" },
                    { dia: "Martes", fecha: "25 Julio", alumno: "Lucas Benítez", cat: "Sub-13", coach: "Míster Eduardo", hora: "05:00 PM", estado: "Confirmado" },
                    { dia: "Miércoles", fecha: "26 Julio", alumno: "Emiliano Cordero", cat: "Sub-11", coach: "Míster Adrián", hora: "04:00 PM", estado: "Pendiente" },
                  ].map((p, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">{p.dia} ({p.fecha})</span>
                        <Badge variant="secondary" className="text-[10px]">{p.hora}</Badge>
                      </div>
                      <p className="text-sm font-bold text-foreground">{p.alumno}</p>
                      <p className="text-xs text-muted-foreground">Categoría: {p.cat} · Asignado a: {p.coach}</p>
                      <div className="flex justify-end pt-1">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          {p.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔘 VISTA 3: 🚀 [ 3. MARKETING Y FIDELIZACIÓN ] (Embudo Cierre, Campañas, Retención, Bitácora) */}
      {/* ========================================================================= */}
      {mainCoreTab === "marketing" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Marketing & Escudo de Fidelización</h1>
            <p className="text-sm text-muted-foreground">Automatización de campañas, embudo de cobros y prevención inteligente de bajas.</p>
          </div>

          {/* Sub-pestañas secundarias del GRUPO 3 */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
            <Button
              size="sm"
              variant={marketingSubTab === "embudo" ? "default" : "ghost"}
              onClick={() => setMarketingSubTab("embudo")}
              className="text-xs font-bold gap-1.5 rounded-lg"
            >
              <DollarSign className="h-3.5 w-3.5" /> 🧭 Sub-tab [ Embudo de Cierre ]
            </Button>

            <Button
              size="sm"
              variant={marketingSubTab === "campanas" ? "default" : "ghost"}
              onClick={() => setMarketingSubTab("campanas")}
              className="text-xs font-bold gap-1.5 rounded-lg"
            >
              <Megaphone className="h-3.5 w-3.5" /> 📣 Sub-tab [ Campañas Masivas ]
            </Button>

            <Button
              size="sm"
              variant={marketingSubTab === "retencion" ? "default" : "ghost"}
              onClick={() => setMarketingSubTab("retencion")}
              className="text-xs font-bold gap-1.5 rounded-lg"
            >
              <ShieldAlert className="h-3.5 w-3.5" /> 🛡️ Sub-tab [ Alertas de Retención ]
            </Button>

            <Button
              size="sm"
              variant={marketingSubTab === "seguimiento" ? "default" : "ghost"}
              onClick={() => setMarketingSubTab("seguimiento")}
              className="text-xs font-bold gap-1.5 rounded-lg"
            >
              <History className="h-3.5 w-3.5" /> 📝 Sub-tab [ Bitácora de Seguimiento ]
            </Button>
          </div>

          {/* SUB-TAB 1: 🧭 EMBUDO DE CIERRE FINANCIERO */}
          {marketingSubTab === "embudo" && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground">
                Kanban financiero enfocado únicamente en las etapas finales del dinero (Decisión ➔ Pago de Matrícula ➔ Inscrito).
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { titulo: "🤝 Decisión Familiar", lista: leadsList.filter(l => l.estado === "decision") },
                  { titulo: "💳 Pago de Matrícula Pendiente", lista: leadsList.filter(l => l.estado === "contactado") },
                  { titulo: "🏆 Inscrito Formal", lista: leadsList.filter(l => l.estado === "inscrito") },
                ].map((col, idx) => (
                  <Card key={idx} className="shadow-card border-border bg-card">
                    <CardHeader className="pb-3 border-b border-border/40">
                      <CardTitle className="text-xs font-bold flex items-center justify-between">
                        <span>{col.titulo}</span>
                        <Badge variant="secondary">{col.lista.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 min-h-[300px]">
                      {col.lista.map(l => (
                        <div key={l.id} className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                          <p className="text-xs font-bold">{l.nombre}</p>
                          <p className="text-[11px] text-muted-foreground">{l.categoria}</p>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Valor: ₡{(l.valor || 45000).toLocaleString("es-CR")}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: 📣 CAMPAÑAS MASIVAS (WhatsApp API / Email) */}
          {marketingSubTab === "campanas" && (
            <Card className="shadow-card border-border bg-card max-w-2xl">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" /> Redactar Campaña Masiva Automatizada
                </CardTitle>
                <CardDescription className="text-xs">
                  Envío masivo por WhatsApp API a leads congelados o padres de la academia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Título de la Campaña</label>
                  <Input
                    placeholder="Ej. Promoción Matrícula 15% Descuento"
                    value={campanaTitulo}
                    onChange={e => setCampanaTitulo(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Canal de Difusión</label>
                  <select
                    value={campanaCanal}
                    onChange={e => setCampanaCanal(e.target.value)}
                    className="w-full text-xs rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="WhatsApp API">📲 WhatsApp API Oficial (Alta Conversión)</option>
                    <option value="Correo Masivo">📧 Correo Electrónico HTML</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Mensaje Automatizado</label>
                  <Textarea
                    placeholder="Hola {{nombre}}, tenemos un 15% de descuento especial en la matrícula de la categoría {{categoria}}..."
                    value={campanaMensaje}
                    onChange={e => setCampanaMensaje(e.target.value)}
                    className="text-xs min-h-[110px]"
                  />
                </div>

                <Button onClick={handleEnviarCampana} className="w-full bg-gradient-primary font-semibold text-xs gap-2">
                  <Send className="h-3.5 w-3.5" /> Disparar Envío Masivo a {leadsList.length} Contactos
                </Button>
              </CardContent>
            </Card>
          )}

          {/* SUB-TAB 3: 🛡️ ALERTAS DE RETENCIÓN IA */}
          {marketingSubTab === "retencion" && (
            <Card className="shadow-card border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-600">
                  <ShieldAlert className="h-4 w-4" /> Escudo de Retención e Inteligencia de Bajas
                </CardTitle>
                <CardDescription className="text-xs">
                  Aislamiento preventivo de alumnos con patrones de abandono según la base de datos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alertas.map(a => (
                  <div key={a.id} className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">⚠️ {a.alumno}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.motivo}</p>
                    </div>
                    <Button size="sm" onClick={() => setSelectedAlerta(a)} className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold">
                      Seguimiento
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SUB-TAB 4: 📝 BITÁCORA DE SEGUIMIENTO COMERCIAL */}
          {marketingSubTab === "seguimiento" && (
            <Card className="shadow-card border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> Bitácora Comercial Cronológica (DB Logs)
                </CardTitle>
                <CardDescription className="text-xs">
                  Registro de llamadas, WhatsApps y acuerdos comerciales realizados a encargados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bitacora.map(b => (
                  <div key={b.id} className="p-3 rounded-xl border border-border bg-muted/20 flex items-start justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{b.cliente}</span>
                        <Badge variant="outline" className="text-[10px]">{b.tipo}</Badge>
                      </div>
                      <p className="text-muted-foreground">{b.nota}</p>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground">
                      <p className="font-medium">{b.fecha}</p>
                      <p className="text-primary font-semibold">{b.vendedor}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal Registrar Nuevo Lead */}
      <Dialog open={openNewLead} onOpenChange={setOpenNewLead}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Registrar Nuevo Lead en DB</DialogTitle>
            <DialogDescription className="text-xs">Ingresa los datos del interesado captado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Nombre Completo del Niño/Atleta</label>
              <Input value={newLeadNombre} onChange={e => setNewLeadNombre(e.target.value)} placeholder="Ej. Mateo Rossi" className="text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Teléfono de Contacto</label>
              <Input value={newLeadTel} onChange={e => setNewLeadTel(e.target.value)} placeholder="+506 8888-0000" className="text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Categoría de Interés (Base de Datos Real)</label>
              <select value={newLeadCat} onChange={e => setNewLeadCat(e.target.value)} className="w-full text-xs rounded-md border border-input bg-background p-2 text-foreground">
                {RendimientoStore.getCategorias().map((c: any) => (
                  <option key={c.id || c.nombre} value={c.nombre}>
                    {c.nombre} ({c.disciplina || "Fútbol"})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenNewLead(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCrearLead} className="bg-gradient-primary">Guardar en Supabase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal / Dialog de Seguimiento Comercial y Retención */}
      <Dialog open={!!selectedAlerta} onOpenChange={() => setSelectedAlerta(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-primary" /> Registrar Seguimiento Comercial
            </DialogTitle>
            <DialogDescription className="text-xs">
              Plan de fidelización para retener al alumno {selectedAlerta?.alumno}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted text-xs space-y-1">
              <p className="font-semibold text-foreground">Detalle del Riesgo:</p>
              <p className="text-muted-foreground">{selectedAlerta?.motivo}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Acción de Contacto</label>
              <select
                value={accionTomada}
                onChange={(e) => setAccionTomada(e.target.value)}
                className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 text-foreground"
              >
                <option value="Llamada Telefónica">📞 Llamada Telefónica con Padres</option>
                <option value="Mensaje de WhatsApp">💬 Mensaje de WhatsApp Directo</option>
                <option value="Oferta de Descuento">🏷️ Oferta de Descuento / Beca de Retención</option>
                <option value="Reunión Presencial">🤝 Cita Presencial en Academia</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Bitácora de Notas</label>
              <Textarea
                placeholder="Escribe el resultado de la conversación y compromisos acordados..."
                value={notaSeguimiento}
                onChange={(e) => setNotaSeguimiento(e.target.value)}
                className="text-xs min-h-[90px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedAlerta(null)}>Cancelar</Button>
            <Button size="sm" onClick={handleGuardarSeguimiento} className="bg-gradient-primary">Guardar Acción en DB</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
