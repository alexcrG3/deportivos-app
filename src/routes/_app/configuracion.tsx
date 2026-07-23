import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { organizacion } from "@/lib/mock-data";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useRole, INITIAL_PERMISSIONS } from "@/hooks/use-role";
import {
  Shield, Users, GraduationCap, Wallet, ShieldCheck,
  LayoutDashboard, Sparkles, Activity, ScanLine, Command, Trophy,
  TrendingUp, Brain, BookOpen, Settings, Save, RotateCcw, Building2,
  UserPlus, UserCheck, Link2, Copy, Check, Mail, Clipboard, Plus,
  MessageSquare, Key, Pencil, Trash2, AlertTriangle, Bell, Zap, CalendarCheck, Stethoscope, DollarSign, CheckCircle2, Globe,
  MapPin, UploadCloud, Image as ImageIcon, ExternalLink, Phone, CreditCard, Receipt, Clock, ArrowRight
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RendimientoStore, { SistemaUsuario } from "@/lib/rendimiento-store";
import NotificationDispatcherEngine from "@/lib/notification-store";
import { supabase } from "@/lib/supabase";
import { sedes as sedesMock } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export const Route = createFileRoute("/_app/configuracion")({
  component: ConfigPage,
});

const ROLES = [
  { id: "admin", nombre: "ADMINISTRADORES", sub: "NEXUS RBAC IDENTITY", desc: "Acceso total y configuración de la academia", icon: Shield, color: "text-primary bg-primary/10 border-primary/20" },
  { id: "direccion", nombre: "DIRECCIÓN", sub: "NEXUS RBAC IDENTITY", desc: "Reportes gerenciales y visión global de sedes", icon: Building2, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { id: "coaches", nombre: "CUERPO DOCENTE / COACHES", sub: "NEXUS RBAC IDENTITY", desc: "Gestión de entrenamientos, convocatorias y evaluaciones", icon: GraduationCap, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { id: "fisioterapeuta", nombre: "FISIOTERAPEUTAS / MÉDICOS", sub: "NEXUS RBAC IDENTITY", desc: "Expedientes clínicos, citas de fisioterapia y semáforo de restricciones", icon: Stethoscope, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  { id: "padres", nombre: "PADRES DE FAMILIA", sub: "NEXUS RBAC IDENTITY", desc: "Seguimiento de sus hijos, pagos y asistencia", icon: Users, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { id: "jugadores", nombre: "ESTUDIANTES / JUGADORES", sub: "NEXUS RBAC IDENTITY", desc: "Visualización de estadísticas, entrenamientos y perfil", icon: GraduationCap, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "admin_staff", nombre: "PERSONAL APOYO / ADMIN", sub: "NEXUS RBAC IDENTITY", desc: "Gestión de caja, cobros y asistencia general", icon: Wallet, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
];

const MODULOS = [
  { id: "dashboard", nombre: "DASHBOARD GENERAL (ADMIN)", desc: "PANEL ADMINISTRATIVO CON MÉTRICAS FINANCIERAS, KPIs DE SEDE E INGRESOS. SOLO PARA ADMINISTRADORES.", icon: LayoutDashboard },
  { id: "crm", nombre: "CRM DEPORTIVO", desc: "EMBUDO DE VENTAS, SEGUIMIENTO DE PROSPECTOS Y CAMPAÑAS.", icon: Sparkles },
  { id: "operacion", nombre: "OPERACIÓN DEPORTIVA", desc: "GESTIÓN DE EQUIPOS, CATEGORÍAS Y DISCIPLINAS.", icon: Activity },
  { id: "asistencia", nombre: "ASISTENCIA", desc: "REGISTRO Y CONSULTA DE ASISTENCIA DIARIA.", icon: ScanLine },
  { id: "coach_os", nombre: "COACH OS / ENTRENAMIENTOS", desc: "INICIO DEL COACH: PANEL OPERATIVO, ENTRENAMIENTOS, BIBLIOTECA, CONVOCATORIAS Y DIARIO.", icon: Command },
  { id: "competiciones", nombre: "COMPETICIONES", desc: "SEGUIMIENTO DE PARTIDOS, TEMPORADAS Y CONVOCATORIAS.", icon: Trophy },
  { id: "rendimiento", nombre: "ALTO RENDIMIENTO", desc: "CARGAS DE TRABAJO, WELLNESS Y TESTS FÍSICOS.", icon: TrendingUp },
  { id: "finanzas", nombre: "FINANZAS Y COBROS", desc: "PAGOS RECIBIDOS, CAJA CHICA Y FACTURACIÓN.", icon: Wallet },
  { id: "ia", nombre: "IA & PREDICCIONES", desc: "DETECCIÓN DE RIESGOS, INSIGHTS Y ALERTAS AUTOMÁTICAS.", icon: Brain },
  { id: "biblioteca", nombre: "BIBLIOTECA DE ARCHIVOS", desc: "REPOSITORIO DE DOCUMENTOS, REGLAMENTOS Y ARCHIVOS.", icon: BookOpen },
  { id: "configuracion", nombre: "CONFIGURACIÓN DE SEDES", desc: "ADMINISTRACIÓN DE SEDES, PARÁMETRES E INTEGRACIONES.", icon: Settings },
];

function ConfigPage() {
  const { role, permissions, setPermissions, updatePermission } = useRole();
  const [selectedRole, setSelectedRole] = useState("admin");

  // Subscription state variables
  const [billingCycle, setBillingCycle] = useState<"mensual" | "anual">("anual");
  const [selectedPlanType, setSelectedPlanType] = useState<"mensual" | "anual">("anual");

  // Organization settings state variables
  const activeOrgId = useMemo(() => RendimientoStore.getActiveOrganizacionId(), []);
  const [allOrgs, setAllOrgs] = useState(() => RendimientoStore.getOrganizaciones());

  useEffect(() => {
    const handleSync = () => {
      setAllOrgs(RendimientoStore.getOrganizaciones());
    };
    window.addEventListener("organizacionChanged", handleSync);
    return () => window.removeEventListener("organizacionChanged", handleSync);
  }, []);

  const currentOrg = useMemo(() => {
    return allOrgs.find(o => o.id === activeOrgId) || allOrgs[0] || {
      id: "00000000-0000-0000-0000-000000000000",
      nombre: "Academia Deportiva Élite",
      correo: "admin@elite.com",
      pais: "Costa Rica",
      telefono: "+50622223333",
      moneda: "CRC",
      logo: ""
    };
  }, [allOrgs, activeOrgId]);

  const [orgNombre, setOrgNombre] = useState("");
  const [orgCorreo, setOrgCorreo] = useState("");
  const [orgTelefono, setOrgTelefono] = useState("");
  const [orgPais, setOrgPais] = useState("");
  const [orgMoneda, setOrgMoneda] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [orgIdioma, setOrgIdioma] = useState("es");
  const [orgZonaHoraria, setOrgZonaHoraria] = useState("America/Costa_Rica");
  const [orgDeporte, setOrgDeporte] = useState("Futbol");
  const [orgTipo, setOrgTipo] = useState("Academia Formativa");
  const [orgFundacion, setOrgFundacion] = useState("2018");
  const [orgSitioWeb, setOrgSitioWeb] = useState("https://www.asoderive.com");
  const [orgCiudad, setOrgCiudad] = useState("San José");
  const [orgDireccion, setOrgDireccion] = useState("Calle 4, Avenida 7, Sede Central");
  const [orgFotos, setOrgFotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=600&q=80"
  ]);

  useEffect(() => {
    if (currentOrg) {
      setOrgNombre(currentOrg.nombre || "");
      setOrgCorreo(currentOrg.correo || currentOrg.correo_admin || "");
      setOrgTelefono(currentOrg.telefono || "+50622223333");
      setOrgPais(currentOrg.pais || "Costa Rica");
      setOrgMoneda(currentOrg.moneda || "CRC");
      setOrgLogo(currentOrg.logo || "");
      setOrgIdioma((currentOrg as any).idioma || "es");
      setOrgZonaHoraria((currentOrg as any).zona_horaria || "America/Costa_Rica");
      setOrgDeporte((currentOrg as any).deporte || "Futbol");
      setOrgTipo((currentOrg as any).tipo || "Academia Formativa");
      setOrgFundacion((currentOrg as any).fundacion || "2018");
      setOrgSitioWeb((currentOrg as any).sitio_web || "https://www.asoderive.com");
      setOrgCiudad((currentOrg as any).ciudad || "San José");
      setOrgDireccion((currentOrg as any).direccion || "Calle 4, Avenida 7, Sede Central");
    }
  }, [currentOrg]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgLogo(reader.result as string);
        toast.success("Foto del logo cargada. Recuerda hacer clic en Guardar cambios.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newUrls: string[] = [];
      let processed = 0;
      const fileList = Array.from(files).slice(0, 5 - orgFotos.length);
      if (fileList.length === 0) {
        toast.warning("Límite de 5 fotos alcanzado.");
        return;
      }
      fileList.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            newUrls.push(reader.result as string);
          }
          processed++;
          if (processed === fileList.length) {
            setOrgFotos((prev) => [...prev, ...newUrls].slice(0, 5));
            toast.success(`${newUrls.length} foto(s) agregada(s) a la galería. Haz clic en Guardar Cambios.`);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSaveOrg = async () => {
    const list = RendimientoStore.getOrganizaciones();
    const updated = list.map(o => {
      if (o.id === activeOrgId) {
        return {
          ...o,
          nombre: orgNombre,
          correo: orgCorreo,
          telefono: orgTelefono,
          pais: orgPais,
          moneda: orgMoneda,
          logo: orgLogo,
          idioma: orgIdioma,
          zona_horaria: orgZonaHoraria,
          deporte: orgDeporte,
          tipo: orgTipo,
          fundacion: orgFundacion,
          sitio_web: orgSitioWeb,
          ciudad: orgCiudad,
          direccion: orgDireccion,
          fotos: orgFotos
        };
      }
      return o;
    });
    
    const toastId = toast.loading("Guardando datos de la organización en Supabase...");
    try {
      await RendimientoStore.set("organizaciones_dynamics", updated);
      if (typeof window !== "undefined") {
        supabase.from("organizaciones").upsert({
          id: activeOrgId,
          nombre: orgNombre,
          correo: orgCorreo,
          telefono: orgTelefono,
          pais: orgPais,
          moneda: orgMoneda,
          logo: orgLogo,
          updated_at: new Date().toISOString()
        }).then(() => {});
      }
      toast.success("Perfil de la organización guardado con éxito.", { id: toastId });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      toast.error("Error al guardar en Supabase. Revisa la consola.", { id: toastId });
    }
  };

  if (role === "coach") {
    return <CoachConfigPage />;
  }

  if (role === "padres") {
    return <ParentConfigPage />;
  }

  const storeRoleId = selectedRole === "coaches" ? "coach" : selectedRole;
  const activeRoleInfo = ROLES.find(r => r.id === selectedRole);

  const togglePermission = (roleId: string, moduleId: string) => {
    if (roleId === "admin" && moduleId === "configuracion") {
      toast.warning("El administrador principal debe conservar el acceso a configuración.");
      return;
    }
    const targetRoleId = roleId === "coaches" ? "coach" : roleId;
    const currentVal = permissions[targetRoleId]?.[moduleId] ?? false;
    updatePermission(targetRoleId, moduleId, !currentVal);
  };

  const handleSave = () => {
    toast.success(`Permisos de ${activeRoleInfo?.nombre} actualizados con éxito.`);
  };

  const handleReset = () => {
    const targetRoleId = selectedRole === "coaches" ? "coach" : selectedRole;
    const defaultPerms = targetRoleId === "coach" ? INITIAL_PERMISSIONS.coach : INITIAL_PERMISSIONS.admin;
    setPermissions({
      ...permissions,
      [targetRoleId]: { ...defaultPerms }
    });
    toast.info(`Permisos de ${activeRoleInfo?.nombre} restablecidos por defecto.`);
  };

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "regional") return "regional";
      if (param === "suscripcion") return "suscripcion";
      if (param === "general" || param === "org") return "org";
    }
    return "org";
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajustes y control de acceso de tu organización.</p>
      </div>      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="org">Organización</TabsTrigger>
          <TabsTrigger value="regional" className="bg-primary/10 text-primary font-bold border border-primary/20">🌐 Regional</TabsTrigger>
          <TabsTrigger value="suscripcion" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/30">💳 Suscripción & Plan</TabsTrigger>
          <TabsTrigger value="notificaciones_push" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">🔔 Notificaciones Push & Triggers</TabsTrigger>
          <TabsTrigger value="sedes">Sedes</TabsTrigger>
          <TabsTrigger value="roles">Roles y Permisos (RBAC)</TabsTrigger>
          <TabsTrigger value="muro_perms">Permisos de Muro</TabsTrigger>
          <TabsTrigger value="legal">Aspectos Legales</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones APIs</TabsTrigger>
          <TabsTrigger value="whatsapp" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">💬 Servicio WhatsApp</TabsTrigger>
        </TabsList>
        <TabsContent value="org" className="mt-4 space-y-6">
          {/* Card 1: Identidad & Perfil General */}
          <Card className="shadow-card border/80 bg-card text-foreground">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Datos & Perfil de la Organización
              </CardTitle>
              <CardDescription className="text-xs">
                Información general, logo de marca e identidad institucional de tu academia.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid gap-6 md:grid-cols-3">
              {/* Logo Upload Box */}
              <div className="flex flex-col items-center justify-center p-5 border border-border/80 rounded-2xl bg-muted/20 gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" /> Logo Oficial del Club
                </span>
                <div className="relative group h-32 w-32 rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {orgLogo ? (
                    <img src={orgLogo} className="h-full w-full object-cover" alt="Logo de la Academia" />
                  ) : (
                    <Trophy className="h-14 w-14" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                    Cambiar Imagen
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange}
                    className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground cursor-pointer"
                  />
                  <span className="text-[10px] text-muted-foreground text-center">Formatos permitidos: PNG, JPG, SVG</span>
                </div>
              </div>

              {/* General Form Fields */}
              <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold">Nombre Oficial de la Organización / Club *</Label>
                  <Input value={orgNombre} onChange={(e) => setOrgNombre(e.target.value)} placeholder="Ej. Academia Asoderive Élite" required className="h-9 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Categoría de Deporte Principal *</Label>
                  <select
                    value={orgDeporte}
                    onChange={(e) => setOrgDeporte(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="Futbol">⚽ Fútbol / Soccer</option>
                    <option value="Baloncesto">🏀 Baloncesto / Basketball</option>
                    <option value="Voleibol">🏐 Voleibol</option>
                    <option value="Beisbol">⚾ Béisbol / Softbol</option>
                    <option value="Natacion">🏊 Natación / Deportes Acuáticos</option>
                    <option value="Artes Marciales">🥋 Artes Marciales / Taekwondo</option>
                    <option value="Tenis">🎾 Tenis / Pádel</option>
                    <option value="Atletismo">🏃 Atletismo / Running</option>
                    <option value="Multideporte">🏆 Multideporte / Polideportivo</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Tipo de Organización / Nivel *</Label>
                  <select
                    value={orgTipo}
                    onChange={(e) => setOrgTipo(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="Academia Formativa">Academia Formativa Infantil/Juvenil</option>
                    <option value="Club Profesional">Club Profesional / Semiprofesional</option>
                    <option value="Alto Rendimiento">Centro Deportivo de Alto Rendimiento</option>
                    <option value="Escuela Comunal">Escuela Comunal de Iniciación</option>
                    <option value="Complejo Privado">Complejo Deportivo Privado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Año de Fundación</Label>
                  <Input value={orgFundacion} onChange={(e) => setOrgFundacion(e.target.value)} placeholder="2018" className="h-9 text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Moneda Principal</Label>
                  <Input value={orgMoneda} onChange={(e) => setOrgMoneda(e.target.value)} placeholder="CRC" className="h-9 text-xs" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Información de Contacto Directo */}
          <Card className="shadow-card border/80 bg-card text-foreground">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Información de Contacto & Canales Digitales
              </CardTitle>
              <CardDescription className="text-xs">
                Medios oficiales de comunicación pública para padres y representantes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo Electrónico Oficial *
                </Label>
                <Input type="email" value={orgCorreo} onChange={(e) => setOrgCorreo(e.target.value)} placeholder="contacto@tuclub.com" required className="h-9 text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Teléfono / WhatsApp Principal *
                </Label>
                <Input value={orgTelefono} onChange={(e) => setOrgTelefono(e.target.value)} placeholder="+506 8888 8888" required className="h-9 text-xs" />
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Sitio Web Oficial
                </Label>
                <Input value={orgSitioWeb} onChange={(e) => setOrgSitioWeb(e.target.value)} placeholder="https://www.tuclub.com" className="h-9 text-xs" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Ubicación Geográfica & Mapa Interactivo GPS */}
          <Card className="shadow-card border/80 bg-card text-foreground overflow-hidden">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Ubicación & Coordenadas de Sede Principal
              </CardTitle>
              <CardDescription className="text-xs">
                Localización exacta de las instalaciones centrales de la academia. Haz clic en el mapa para ajustar.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">País *</Label>
                  <Input value={orgPais} onChange={(e) => setOrgPais(e.target.value)} placeholder="Costa Rica" required className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Ciudad / Provincia *</Label>
                  <Input value={orgCiudad} onChange={(e) => setOrgCiudad(e.target.value)} placeholder="San José" required className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5 sm:col-span-3 lg:col-span-1">
                  <Label className="text-xs font-bold">Dirección Física Detallada *</Label>
                  <Input value={orgDireccion} onChange={(e) => setOrgDireccion(e.target.value)} placeholder="Calle 4, Avenida 7, Sede Central" required className="h-9 text-xs" />
                </div>
              </div>

              {/* REAL Interactive OpenStreetMap Map Viewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" /> Mapa Interactivo GPS (Sede Central)
                  </span>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${orgDireccion}, ${orgCiudad}, ${orgPais}`)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary font-semibold flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Abrir en Google Maps
                  </a>
                </div>

                <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-border shadow-md bg-muted">
                  {/* Real OpenStreetMap Embedded Map Canvas */}
                  <iframe
                    title="Mapa GPS Sede Principal"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-84.12%2C9.90%2C-84.04%2C9.97&amp;layer=mapnik&amp;marker=9.9347%2C-84.0875"
                    className="w-full h-full filter contrast-105"
                  ></iframe>

                  {/* Floating Address Overlay Pill */}
                  <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-background/90 backdrop-blur-md p-3 rounded-2xl border border-border shadow-xl flex items-center gap-3 max-w-md">
                    <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-extrabold text-xs text-foreground truncate">{orgNombre || "Sede Principal"}</h5>
                      <p className="text-[10px] text-muted-foreground truncate">{orgDireccion || "Calle 4, Avenida 7"}, {orgCiudad}, {orgPais}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Galería de Instalaciones del Club (Fotos Pro) */}
          <Card className="shadow-card border/80 bg-card text-foreground">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> Galería de Instalaciones del Club
              </CardTitle>
              <CardDescription className="text-xs">
                Sube fotos en alta resolución de tus canchas, gimnasio o instalaciones deportivas (máximo 5 fotos).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Interactive Upload Dropzone Input */}
              <label className="border-2 border-dashed border-primary/30 hover:border-primary transition rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-center bg-primary/5 hover:bg-primary/10 cursor-pointer group">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handlePhotosUpload} 
                  className="hidden" 
                />
                <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center group-hover:scale-110 transition">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition">
                    Haz clic aquí o arrastra tus fotos para subirlas
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-1">Soporta PNG, JPG, WEBP · Máximo 5MB por foto ({orgFotos.length}/5 cargadas)</p>
                </div>
              </label>

              {/* Pro Photos Grid Gallery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {orgFotos.map((foto, idx) => {
                  const tags = ["⚽ Campo Principal", "🏋️ Gimnasio & Fisioterapia", "🏟️ Graderías & Vestuarios", "🏊 Zona Acuática", "👟 Pista Deportiva"];
                  return (
                    <div key={idx} className="relative group rounded-2xl overflow-hidden border border-border shadow-md bg-muted aspect-video flex flex-col justify-end p-3">
                      <img src={foto} alt={`Instalación ${idx + 1}`} className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      
                      <div className="relative z-10 flex items-center justify-between">
                        <Badge className="bg-black/60 text-white border-white/20 text-[10px] font-bold backdrop-blur-sm">
                          {tags[idx % tags.length]}
                        </Badge>
                        <button 
                          onClick={() => {
                            setOrgFotos(prev => prev.filter((_, i) => i !== idx));
                            toast.info("Foto removida de la galería.");
                          }}
                          className="h-7 w-7 rounded-full bg-rose-600/90 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition hover:bg-rose-700 shadow-lg"
                          title="Eliminar foto"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div className="flex justify-end pt-4 border-t border-border/60">
                <Button onClick={handleSaveOrg} className="bg-gradient-primary shadow-elegant font-semibold px-6 text-xs gap-2">
                  <Save className="h-4 w-4" /> Guardar Perfil de Organización
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="mt-4 space-y-6">
          <Card className="shadow-card border/80 bg-card text-foreground">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Configuración Regional
              </CardTitle>
              <CardDescription className="text-xs">
                Ajustes de idioma, zona horaria y moneda de tu plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* 1. Idioma */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  🗣️ Idioma
                </Label>
                <div className="max-w-md">
                  <select
                    value={orgIdioma}
                    onChange={(e) => setOrgIdioma(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="es">🇪🇸 Español (Default)</option>
                    <option value="en">🇺🇸 English (Inglés)</option>
                    <option value="pt">🇧🇷 Português (Portugués)</option>
                  </select>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Idioma de la interfaz de la plataforma. Se aplica inmediatamente.
                </p>
              </div>

              {/* 2. Zona Horaria */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  🕒 Zona Horaria
                </Label>
                <div className="max-w-md">
                  <select
                    value={orgZonaHoraria}
                    onChange={(e) => setOrgZonaHoraria(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="America/Costa_Rica">🇨🇷 Costa Rica (UTC-6)</option>
                    <option value="America/Lima">🇵🇪 Perú (UTC-5)</option>
                    <option value="America/Mexico_City">🇲🇽 México (UTC-6)</option>
                    <option value="America/Bogota">🇨🇴 Colombia (UTC-5)</option>
                    <option value="America/Guatemala">🇬🇹 Guatemala (UTC-6)</option>
                    <option value="America/Panama">🇵🇦 Panamá (UTC-5)</option>
                    <option value="America/Santiago">🇨🇱 Chile (UTC-4)</option>
                    <option value="America/Argentina/Buenos_Aires">🇦🇷 Argentina (UTC-3)</option>
                    <option value="Europe/Madrid">🇪🇸 España (UTC+1)</option>
                  </select>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Afecta la visualización de fechas y horarios en toda la plataforma.
                </p>
              </div>

              {/* 3. Moneda */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  💲 Moneda
                </Label>
                <div className="max-w-md">
                  <select
                    value={orgMoneda}
                    onChange={(e) => setOrgMoneda(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="CRC">🇨🇷 CRC - Colón Costarricense (₡)</option>
                    <option value="USD">🇺🇸 USD - Dólar Estadounidense ($)</option>
                    <option value="PEN">🇵🇪 PEN - Sol Peruano (S/)</option>
                    <option value="MXN">🇲🇽 MXN - Peso Mexicano ($)</option>
                    <option value="COP">🇨🇴 COP - Peso Colombiano ($)</option>
                    <option value="ARS">🇦🇷 ARS - Peso Argentino ($)</option>
                    <option value="CLP">🇨🇱 CLP - Peso Chileno ($)</option>
                    <option value="EUR">🇪🇺 EUR - Euro (€)</option>
                  </select>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Moneda utilizada para mostrar precios, cobros y reportes.
                </p>
              </div>

              {/* Notice Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-sm">
                  <AlertTriangle className="h-4 w-4" /> Importante: Zona Horaria y Filtros
                </div>
                <ul className="space-y-1.5 leading-relaxed pl-1 text-[11px]">
                  <li>
                    <strong>Afecta principalmente:</strong> Esta configuración determina cómo se filtran y agrupan los datos en reportes, estadísticas y gráficas. Por ejemplo, al filtrar por "día de hoy" o generar estadísticas mensuales.
                  </li>
                  <li>
                    <strong>Cambio no retroactivo:</strong> Los datos históricos permanecen en la zona horaria original. Solo afecta cómo se interpretan y filtran los datos de ahora en adelante.
                  </li>
                  <li>
                    <strong>No afecta tu navegador:</strong> Esta es una configuración del servidor. La hora mostrada en tu navegador seguirá siendo la de tu dispositivo.
                  </li>
                </ul>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveOrg} className="bg-gradient-primary shadow-elegant font-semibold px-6 text-xs gap-2">
                  <Save className="h-4 w-4" /> Guardar Configuración Regional
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suscripcion" className="mt-4 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950 border border-purple-500/30 text-white shadow-elegant">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-extrabold uppercase">
                  ❇️ Suscripción Activa
                </Badge>
                <span className="text-xs text-slate-300">Plan DeportivOS Élite</span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">Gestión de Suscripción & Facturación de la Academia</h2>
              <p className="text-xs text-slate-300">
                Monitorea el estado de tu licencia, elige el ciclo de facturación y proyecta tus costos según los deportistas activos.
              </p>
            </div>
            <Button 
              onClick={() => toast.success("Solicitud de actualización de tarjeta enviada a DeportivOS Billing.")}
              className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg text-xs font-bold gap-2 shrink-0"
            >
              <CreditCard className="h-4 w-4" /> Actualizar Tarjeta
            </Button>
          </div>

          {/* Top Status Cards Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="shadow-card border/80 bg-card p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Suscripción Activa Hasta
              </span>
              <div className="text-lg font-extrabold text-foreground mt-1">30 de Noviembre de 2027</div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Renovación automática habilitada</p>
            </Card>

            <Card className="shadow-card border/80 bg-card p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-primary" /> Método de Pago Registrado
              </span>
              <div className="text-lg font-extrabold text-foreground mt-1">Pago Manual / Transferencia</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Soporte directo con comprobante o SINPE</p>
            </Card>

            <Card className="shadow-card border/80 bg-card p-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> Deportistas Activos en Club
              </span>
              <div className="text-lg font-extrabold text-primary mt-1">53 Deportistas</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Base para cálculo del plan dinámico</p>
            </Card>
          </div>

          {/* Plan Selector & Billing Toggle */}
          <div className="text-center space-y-4 pt-2">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Elige el Plan para tu Academia</h3>
              <p className="text-xs text-muted-foreground">Precios escalables adaptados al crecimiento de tu número de alumnos.</p>
            </div>

            {/* Cycle Toggle Button */}
            <div className="inline-flex items-center rounded-2xl border border-border bg-muted/40 p-1 gap-1">
              <button
                onClick={() => setBillingCycle("mensual")}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                  billingCycle === "mensual" ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pago Mensual
              </button>
              <button
                onClick={() => setBillingCycle("anual")}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                  billingCycle === "anual" ? "bg-gradient-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Pago Anual</span>
                <Badge className="bg-emerald-500 text-white text-[9px] py-0 px-1.5">AHORRA 50%</Badge>
              </button>
            </div>
          </div>

          {/* Plans Grid (Original DeportivOS Style) */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Plan 1: Pago Mensual */}
            <Card 
              onClick={() => setSelectedPlanType("mensual")}
              className={`cursor-pointer transition-all duration-200 border-2 relative ${
                selectedPlanType === "mensual" ? "border-primary shadow-elegant bg-primary/5" : "border-border/80 hover:border-primary/40 bg-card"
              }`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-extrabold">Pago Mensual</CardTitle>
                    <CardDescription className="text-xs">Sin compromisos de largo plazo.</CardDescription>
                  </div>
                  {selectedPlanType === "mensual" && (
                    <Badge className="bg-primary text-primary-foreground text-[10px]">SELECCIONADO</Badge>
                  )}
                </div>

                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-foreground">USD $1.00</span>
                  <span className="text-xs text-muted-foreground"> / deportista / mes</span>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-1">Mínimo USD $50 / mes</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Flexibilidad total: cancela cuando quieras</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Paga solo por los deportistas activos del mes</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Acceso ilimitado a todos los módulos y App de Padres</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Pásate al plan anual en cualquier momento</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan 2: Pago Anual (Featured) */}
            <Card 
              onClick={() => setSelectedPlanType("anual")}
              className={`cursor-pointer transition-all duration-200 border-2 relative overflow-hidden ${
                selectedPlanType === "anual" ? "border-purple-500 shadow-elegant bg-gradient-to-b from-purple-950/10 to-card" : "border-border/80 hover:border-purple-500/40 bg-card"
              }`}
            >
              <div className="absolute top-0 right-0 bg-gradient-primary text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> MÁS POPULAR | AHORRA 50%
              </div>

              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-extrabold text-purple-600 dark:text-purple-400">Pago Anual Élite</CardTitle>
                    <CardDescription className="text-xs">Recomendado para clubs en crecimiento sostenido.</CardDescription>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-3xl font-extrabold text-foreground">USD $0.50</span>
                  <span className="text-xs text-muted-foreground"> / deportista / mes</span>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Mínimo USD $300 / año</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2 text-foreground font-bold">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>Congela tu precio: no importa cuántos deportistas crezcas</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground font-bold">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>Ahorro garantizado del 50% en comparación a la tarifa mensual</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>Renueva solo una vez al año con factura electrónica</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>Soporte prioritario 24/7 y respaldos automáticos diarios</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Billing Estimator Bar */}
          <Card className="shadow-elegant border-border bg-gradient-to-r from-card via-muted/30 to-card p-5 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Proyección de Inversión Calculada</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-foreground">
                    USD ${billingCycle === "anual" ? (Math.max(53, 53) * 0.50 * 12).toFixed(2) : (Math.max(53, 53) * 1.00 * 12).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {billingCycle === "anual" ? "año (para 53 deportistas activos)" : "año proyectado"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Para gestionar tu facturación corporativa o cambiar moneda a tu moneda local, contacta al equipo central de DeportivOS.
                </p>
              </div>

              <Button 
                onClick={() => toast.success("Generando orden de renovación de suscripción...")}
                className="bg-gradient-primary text-white font-extrabold shadow-elegant px-8 text-xs gap-2 shrink-0 h-11 rounded-xl"
              >
                <Zap className="h-4 w-4" /> Renovar / Pagar Ahora
              </Button>
            </div>
          </Card>

          {/* Billing History Table */}
          <Card className="shadow-card border/80 bg-card text-foreground">
            <CardHeader className="border-b border-border/60">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Historial de Renovaciones & Facturas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border/60">
                    <th className="py-2 px-3 font-semibold">N° Factura</th>
                    <th className="py-2 px-3 font-semibold">Fecha</th>
                    <th className="py-2 px-3 font-semibold">Plan</th>
                    <th className="py-2 px-3 font-semibold">Monto Total</th>
                    <th className="py-2 px-3 font-semibold">Estado</th>
                    <th className="py-2 px-3 font-semibold text-right">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr className="hover:bg-muted/20">
                    <td className="py-2.5 px-3 font-mono font-bold">ATH-INV-2026-001</td>
                    <td className="py-2.5 px-3 text-muted-foreground">30 Nov 2026</td>
                    <td className="py-2.5 px-3 font-medium">Anual Élite (53 Cupos)</td>
                    <td className="py-2.5 px-3 font-extrabold text-foreground">USD $318.00</td>
                    <td className="py-2.5 px-3">
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                        Pagado
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => toast.info("Descargando factura en PDF...")} className="h-7 text-[11px] gap-1 text-primary">
                        <Receipt className="h-3.5 w-3.5" /> PDF
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones_push" className="mt-4 space-y-6">
          <Card className="shadow-card border-border bg-gradient-to-r from-slate-900 to-amber-950 text-white p-6 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase font-mono font-bold text-amber-400">Matriz de Notificaciones Push y Alertas</p>
                <h2 className="text-xl font-extrabold text-white">Triggers Automáticos & Reglas de Disparo</h2>
                <p className="text-xs text-slate-300">
                  Configura qué eventos en cancha, administración o la app de padres generan notificaciones push inmediatas.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-400">
                <Zap className="h-4 w-4" /> 7 Triggers de Notificación Activos
              </div>
            </div>
          </Card>

          {/* Grid of the 7 Triggers */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Trigger 1 */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] border-indigo-500/30 text-indigo-600 font-bold">Trigger #1</Badge>
                  <Switch defaultChecked />
                </div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 mt-1">
                  <CalendarCheck className="h-4 w-4 text-indigo-500" /> Citación a Partido (Convocatoria)
                </CardTitle>
                <CardDescription className="text-xs">
                  Disparador: El entrenador presiona [Enviar Convocatoria] el jueves en la noche.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] text-muted-foreground border">
                  "⚽ ¡Citación de Partido! Santiago Jiménez ha sido convocado para el juego contra LD Alajuelense..."
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Destinatario: <strong>Padres</strong></span>
                  <span className="text-muted-foreground">Deep Link: <code className="text-primary">/convocatorias</code></span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => NotificationDispatcherEngine.triggerConvocatoriaSent("Santiago Jiménez", "LD Alajuelense")}
                  className="w-full h-7 text-[11px] font-bold gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <Zap className="h-3 w-3" /> Probar Disparo Live #1
                </Button>
              </CardContent>
            </Card>

            {/* Trigger 2 */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] border-amber-500/30 text-amber-600 font-bold">Trigger #2</Badge>
                  <Switch defaultChecked />
                </div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 mt-1">
                  <Bell className="h-4 w-4 text-amber-500" /> Recordatorio de Convocatoria (Viernes 12 PM)
                </CardTitle>
                <CardDescription className="text-xs">
                  Disparador: Es viernes 12:00 PM y el padre no ha confirmado la citación.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] text-muted-foreground border">
                  "⏳ ¡Últimas horas! No has confirmado la asistencia de Santiago Jiménez..."
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Destinatario: <strong>Padres (Push Crítica)</strong></span>
                  <span className="text-muted-foreground">Deep Link: <code className="text-primary">/convocatorias</code></span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => NotificationDispatcherEngine.triggerConvocatoriaReminder("Santiago Jiménez")}
                  className="w-full h-7 text-[11px] font-bold gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <Zap className="h-3 w-3" /> Probar Disparo Live #2
                </Button>
              </CardContent>
            </Card>

            {/* Trigger 3 */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] border-rose-500/30 text-rose-600 font-bold">Trigger #3</Badge>
                  <Switch defaultChecked />
                </div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 mt-1">
                  <UserCheck className="h-4 w-4 text-rose-500" /> Baja en Plantilla (Declinación)
                </CardTitle>
                <CardDescription className="text-xs">
                  Disparador: Un padre presiona el botón [👎 No asistirá] en la convocatoria.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] text-muted-foreground border">
                  "❌ Baja en la Plantilla: El jugador Mateo Rojas ha declinado la convocatoria..."
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Destinatario: <strong>Entrenador / Coach OS</strong></span>
                  <span className="text-muted-foreground">Deep Link: <code className="text-primary">/coach</code></span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => NotificationDispatcherEngine.triggerConvocatoriaDeclined("Mateo Rojas", "Saprissa")}
                  className="w-full h-7 text-[11px] font-bold gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Zap className="h-3 w-3" /> Probar Disparo Live #3
                </Button>
              </CardContent>
            </Card>

            {/* Trigger 4 */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] border-destructive/30 text-destructive font-bold">Trigger #4</Badge>
                  <Switch defaultChecked />
                </div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 mt-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Alerta Médica por Lesión en Cancha
                </CardTitle>
                <CardDescription className="text-xs">
                  Disparador: El entrenador activa [Reportar Lesión] en el cierre de clase.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] text-muted-foreground border">
                  "🚨 Alerta Médica: El entrenador Edgar Calderón reportó una lesión Leve..."
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Destinatario: <strong>Administración</strong></span>
                  <span className="text-muted-foreground">Deep Link: <code className="text-primary">/medico</code></span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => NotificationDispatcherEngine.triggerMedicalInjury("Edgar Calderón", "Ian Gutiérrez", "Moderada")}
                  className="w-full h-7 text-[11px] font-bold gap-1 text-destructive border-destructive/20 hover:bg-destructive/10"
                >
                  <Zap className="h-3 w-3" /> Probar Disparo Live #4
                </Button>
              </CardContent>
            </Card>

            {/* Trigger 5 */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] border-amber-500/30 text-amber-600 font-bold">Trigger #5</Badge>
                  <Switch defaultChecked />
                </div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 mt-1">
                  <ShieldCheck className="h-4 w-4 text-amber-500" /> Auditoría de Asistencia Staff (20 Min)
                </CardTitle>
                <CardDescription className="text-xs">
                  Disparador: Pasan 20 min del inicio de clase sin que el entrenador registre asistencia.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] text-muted-foreground border">
                  "⚠️ Auditoría de Staff: El entrenamiento de U9 inició a las 16:00, pero el profesor..."
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Destinatario: <strong>Dashboard Admin</strong></span>
                  <span className="text-muted-foreground">Deep Link: <code className="text-primary">/asistencia-staff</code></span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => NotificationDispatcherEngine.triggerStaffAttendanceAudit("U9", "16:00")}
                  className="w-full h-7 text-[11px] font-bold gap-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  <Zap className="h-3 w-3" /> Probar Disparo Live #5
                </Button>
              </CardContent>
            </Card>

            {/* Trigger 6 */}
            <Card className="shadow-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] border-emerald-500/30 text-emerald-600 font-bold">Trigger #6</Badge>
                  <Switch defaultChecked />
                </div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 mt-1">
                  <DollarSign className="h-4 w-4 text-emerald-500" /> Aviso de Facturación y Mora (Día 6)
                </CardTitle>
                <CardDescription className="text-xs">
                  Disparador: Es el día 6 del mes y la mensualidad del alumno sigue en "Pendiente".
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] text-muted-foreground border">
                  "💳 Aviso de Facturación: Se ha generado el cobro de tu mensualidad..."
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Destinatario: <strong>Padres (Push + Email)</strong></span>
                  <span className="text-muted-foreground">Deep Link: <code className="text-primary">/pagos</code></span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => NotificationDispatcherEngine.triggerBillingReminder("Aaron Pacheco")}
                  className="w-full h-7 text-[11px] font-bold gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  <Zap className="h-3 w-3" /> Probar Disparo Live #6
                </Button>
              </CardContent>
            </Card>

            {/* Trigger 7 */}
            <Card className="shadow-card border-border md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] border-indigo-500/30 text-indigo-600 font-bold">Trigger #7</Badge>
                  <Switch defaultChecked />
                </div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 mt-1">
                  <Stethoscope className="h-4 w-4 text-indigo-500" /> Alerta de Wellness Físico (Previo a Práctica)
                </CardTitle>
                <CardDescription className="text-xs">
                  Disparador: Un padre reporta valor de dolor alto o malestar en la encuesta Wellness.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 font-mono text-[11px] text-muted-foreground border">
                  "🩺 Alerta de Wellness: El papá de Santiago Jiménez reportó una alerta física previa..."
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Destinatario: <strong>Entrenador del Equipo</strong></span>
                  <span className="text-muted-foreground">Deep Link: <code className="text-primary">/rendimiento/wellness</code></span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => NotificationDispatcherEngine.triggerWellnessAlert("Santiago Jiménez")}
                  className="w-full h-7 text-[11px] font-bold gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  <Zap className="h-3 w-3" /> Probar Disparo Live #7
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="mt-4 space-y-8">
          {/* Header section similar to the first image */}
          <div className="bg-card/50 border border-border/80 rounded-2xl p-6 shadow-elegant flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  Gestión de Permisos
                  <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary">RBAC Activo</Badge>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Control de acceso granular y visibilidad modular por perfiles de usuario.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleReset} className="text-xs h-9">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Restablecer
              </Button>
              <Button size="sm" onClick={handleSave} className="text-xs bg-gradient-primary shadow-elegant h-9">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Guardar Permisos
              </Button>
            </div>
          </div>

          {/* Grid of Role Cards */}
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Configuración de Permisos por Rol</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                const RoleIcon = role.icon;
                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                      isSelected
                        ? "border-primary bg-primary/[0.03] shadow-md shadow-primary/5"
                        : "border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/20"
                    }`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${role.color}`}>
                      <RoleIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-muted-foreground/80 tracking-wider leading-none mb-1">{role.sub}</p>
                      <p className="text-sm font-semibold tracking-tight truncate leading-tight text-foreground">{role.nombre}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{role.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid of Modules & Toggles */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                Módulos de visibilidad para: <span className="text-primary font-bold">{activeRoleInfo?.nombre}</span>
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {Object.values(permissions[storeRoleId] || {}).filter(Boolean).length} de {MODULOS.length} activos
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULOS.map((mod) => {
                const isActive = permissions[storeRoleId]?.[mod.id] ?? false;
                const ModIcon = mod.icon;
                return (
                  <div
                    key={mod.id}
                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-[130px] ${
                      isActive
                        ? "border-green-500/20 bg-green-500/[0.01] shadow-sm"
                        : "border-border bg-card opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className={`p-2.5 rounded-xl ${
                        isActive ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                      }`}>
                        <ModIcon className="h-5 w-5" />
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => togglePermission(selectedRole, mod.id)}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-wide uppercase text-foreground truncate">{mod.nombre}</p>
                      <p className="text-[10px] text-muted-foreground/80 font-normal leading-normal mt-1 line-clamp-2 uppercase">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4 space-y-6">
          <UsuariosTab />
        </TabsContent>

        <TabsContent value="muro_perms" className="mt-4 space-y-6">
          <MuroPermissionsTab />
        </TabsContent>

        <TabsContent value="legal" className="mt-4">
          <LegalConfigTab />
        </TabsContent>

        <TabsContent value="integraciones" className="mt-4">
          <IntegracionesTab />
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4">
          <WhatsAppServiceConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsuariosTab() {
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const activeOrgId = useMemo(() => RendimientoStore.getActiveOrganizacionId(), []);
  const [usuarios, setUsuarios] = useState<SistemaUsuario[]>(() => RendimientoStore.getUsuarios());
  const [openCreate, setOpenCreate] = useState(false);
  const [openInvite, setOpenInvite] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SistemaUsuario | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ nombre: string; email: string; code: string; link: string } | null>(null);

  // Create form state
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("coaches");
  const [sedeId, setSedeId] = useState("s1");
  const [avatar, setAvatar] = useState("");

  // Edit form state
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("coaches");
  const [editSedeId, setEditSedeId] = useState("s1");
  const [editAvatar, setEditAvatar] = useState("");

  const roleLabels: Record<string, string> = {
    superadmin: "Super Administrador",
    admin: "Administrador",
    direccion: "Dirección",
    coaches: "Cuerpo Docente / Coach",
    admin_staff: "Personal de Apoyo",
  };

  const roleBadgeColor: Record<string, string> = {
    superadmin: "text-purple-600 bg-purple-500/10 border-purple-500/20",
    admin: "text-primary bg-primary/10 border-primary/20",
    direccion: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    coaches: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    admin_staff: "text-rose-600 bg-rose-500/10 border-rose-500/20",
  };

  // Load users from DB on mount
  const fetchDBUsers = async () => {
    try {
      const { data, error } = await supabase.from("usuarios").select("*");
      if (data) {
        const normalized = data.map((u: any) => ({
          id: u.id,
          nombre: u.nombre,
          email: u.email,
          role: u.role,
          sedeId: u.sede_id || "s1",
          sede: sedesMock.find(s => s.id === (u.sede_id || "s1"))?.nombre ?? "Sede Central",
          estado: u.estado,
          fechaCreacion: u.fecha_creacion,
          avatar: u.avatar || "",
          organizacion_id: u.organizacion_id
        }));
        setUsuarios(normalized);
      }
    } catch (e) {
      console.error("Error loading users:", e);
    }
  };

  useEffect(() => {
    fetchDBUsers();
  }, []);

  // ---- CREATE ----
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email) { toast.error("Por favor completa los campos obligatorios"); return; }
    
    const newUser = {
      id: "u-" + Math.floor(1000 + Math.random() * 9000),
      nombre,
      email: email.trim().toLowerCase(),
      role,
      sede_id: sedeId,
      estado: "invitado",
      fecha_creacion: new Date().toISOString().split("T")[0],
      organizacion_id: activeOrgId
    };

    const { error } = await supabase.from("usuarios").insert(newUser);
    if (error) {
      toast.error("Error al pre-registrar: " + error.message);
      return;
    }

    await fetchDBUsers();
    setOpenCreate(false);
    setNombre(""); setEmail(""); setRole("coaches"); setSedeId("s1"); setAvatar("");
    toast.success("Usuario pre-registrado con éxito. El usuario ya puede crear su cuenta en la pantalla de registro.");
  };

  // ---- EDIT ----
  const openEditDialog = (u: SistemaUsuario) => {
    setSelectedUser(u);
    setEditNombre(u.nombre);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditSedeId(u.sedeId);
    setEditAvatar(u.avatar || "");
    setOpenEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!editNombre || !editEmail) { toast.error("Por favor completa los campos obligatorios"); return; }

    const updatedUser = {
      nombre: editNombre,
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      sede_id: editSedeId,
      avatar: editAvatar,
    };

    const { error } = await supabase
      .from("usuarios")
      .update(updatedUser)
      .eq("id", selectedUser.id);

    if (error) {
      toast.error("Error al actualizar: " + error.message);
      return;
    }

    await fetchDBUsers();
    setOpenEdit(false);
    setSelectedUser(null);
    toast.success("Usuario actualizado correctamente");
  };

  // ---- DELETE ----
  const openDeleteDialog = (u: SistemaUsuario) => {
    setSelectedUser(u);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    if (selectedUser.email === "alex@mail.com") {
      toast.error("No se puede eliminar al Super Administrador");
      setOpenDelete(false);
      return;
    }

    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", selectedUser.id);

    if (error) {
      toast.error("Error al eliminar: " + error.message);
      return;
    }

    await fetchDBUsers();
    setOpenDelete(false);
    setSelectedUser(null);
    toast.success("Usuario eliminado");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card/50 border border-border/80 rounded-2xl p-6 shadow-elegant flex flex-col sm:flex-row sm:items-center gap-4 justify-between text-foreground">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            Control de Usuarios
            <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary">{usuarios.length} {usuarios.length === 1 ? "usuario" : "usuarios"}</Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gestiona el equipo de trabajo: crea, edita y elimina usuarios del sistema.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => copyToClipboard(appOrigin + '/inscripcion?orgId=' + activeOrgId)}
            className="text-xs h-9 border-primary/30 text-primary hover:bg-primary/5 font-semibold gap-1.5"
          >
            <Link2 className="h-4 w-4" />
            Enlace de Inscripción Pública
          </Button>
          <Button onClick={() => setOpenCreate(true)} className="bg-gradient-primary shadow-elegant text-xs h-9 font-semibold gap-1.5">
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* User Table */}
      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Usuario</TableHead>
                <TableHead>Correo electrónico</TableHead>
                <TableHead>Rol asignado</TableHead>
                <TableHead>Sede asignada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                    No hay usuarios registrados aún.
                  </TableCell>
                </TableRow>
              )}
              {usuarios.map((u) => {
                const initials = u.nombre.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
                const isSuperAdmin = u.email === "alex@mail.com";
                const roleCls = roleBadgeColor[u.role] ?? "text-muted-foreground bg-muted/40 border-border/60";
                const roleSpanCls = "text-[11px] font-semibold px-2 py-0.5 rounded-full border " + roleCls;
                const deleteBtnCls = isSuperAdmin
                  ? "h-7 w-7 hover:bg-red-500/10 opacity-30 cursor-not-allowed"
                  : "h-7 w-7 hover:bg-red-500/10 text-muted-foreground hover:text-red-500";
                const deleteTitle = isSuperAdmin ? "No se puede eliminar al Super Admin" : "Eliminar usuario";
                return (
                  <TableRow key={u.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          {u.avatar && <AvatarImage src={u.avatar} />}
                          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-purple-500/30 text-xs font-bold text-primary border border-primary/20">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{u.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <span className={roleSpanCls}>
                        {roleLabels[u.role] || u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.sede}</TableCell>
                    <TableCell>
                      <Badge variant={u.estado === "activo" ? "success" : "secondary"} className="text-[10px] capitalize">
                        {u.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.estado === "invitado" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const inviteLink = appOrigin + '/login?code=' + (u.codigoAcceso ?? '');
                              setInviteInfo({ nombre: u.nombre, email: u.email, code: u.codigoAcceso || "", link: inviteLink });
                              setOpenInvite(true);
                            }}
                            className="text-primary text-[11px] h-7 px-2 hover:bg-primary/5"
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            Ver código
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => openEditDialog(u)}
                          title="Editar usuario"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={deleteBtnCls}
                          onClick={() => !isSuperAdmin && openDeleteDialog(u)}
                          title={deleteTitle}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ====== CREATE DIALOG ====== */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Crear Nuevo Usuario
            </DialogTitle>
            <DialogDescription>
              El usuario recibirá un código de acceso único para registrarse en la plataforma.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="userName">Nombre completo *</Label>
              <Input id="userName" placeholder="Ej. Carlos Torres" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="userEmail">Correo electrónico *</Label>
              <Input id="userEmail" type="email" placeholder="Ej. carlos.t@elite.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Foto de perfil</Label>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  {avatar && <AvatarImage src={avatar} />}
                  <AvatarFallback className="bg-muted text-xs">Foto</AvatarFallback>
                </Avatar>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setAvatar(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Rol del Sistema</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coaches">Coach / Entrenador</SelectItem>
                    <SelectItem value="admin_staff">Personal Administrativo</SelectItem>
                    <SelectItem value="direccion">Dirección</SelectItem>
                    <SelectItem value="admin">Administrador Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sede Asignada</Label>
                <Select value={sedeId} onValueChange={setSedeId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sedesMock.map((s) => (<SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-primary shadow-elegant">Generar Invitación</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ====== EDIT DIALOG ====== */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" /> Editar Usuario
            </DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario. Los cambios se aplican de inmediato.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="editUserName">Nombre completo *</Label>
              <Input id="editUserName" placeholder="Nombre completo" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editUserEmail">Correo electrónico *</Label>
              <Input id="editUserEmail" type="email" placeholder="correo@ejemplo.com" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Foto de perfil</Label>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  {editAvatar && <AvatarImage src={editAvatar} />}
                  <AvatarFallback className="bg-muted text-xs">Foto</AvatarFallback>
                </Avatar>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditAvatar(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Rol del Sistema</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coaches">Coach / Entrenador</SelectItem>
                    <SelectItem value="admin_staff">Personal Administrativo</SelectItem>
                    <SelectItem value="direccion">Dirección</SelectItem>
                    <SelectItem value="admin">Administrador Principal</SelectItem>
                    {selectedUser?.email === "alex@mail.com" && <SelectItem value="superadmin">Super Administrador</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sede Asignada</Label>
                <Select value={editSedeId} onValueChange={setEditSedeId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sedesMock.map((s) => (<SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-primary shadow-elegant">Guardar Cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ====== DELETE CONFIRMATION DIALOG ====== */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">¿Eliminar usuario?</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Estás a punto de eliminar a <strong>{selectedUser?.nombre}</strong> ({selectedUser?.email}).
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpenDelete(false)}>Cancelar</Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ====== INVITE DETAILS DIALOG ====== */}
      <Dialog open={openInvite} onOpenChange={setOpenInvite}>
        <DialogContent className="sm:max-w-[480px] p-6 text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-6 w-6" />
            </div>
            <DialogTitle className="mt-4 text-lg font-semibold">¡Invitación Generada Exitosamente!</DialogTitle>
            <DialogDescription className="text-xs">
              Envía estas credenciales a <strong>{inviteInfo?.nombre}</strong> ({inviteInfo?.email}) para que inicie sesión.
            </DialogDescription>
          </DialogHeader>
          {inviteInfo && (
            <div className="space-y-4 my-4 p-4 rounded-2xl bg-muted/40 border border-border/80 text-left">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Código de Acceso Único</span>
                <div className="flex items-center justify-between bg-background p-2.5 rounded-xl border font-mono font-bold text-lg text-primary">
                  <span>{inviteInfo.code}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-muted" onClick={() => copyToClipboard(inviteInfo.code)}>
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Link de Invitación Directo</span>
                <div className="flex items-center justify-between bg-background p-2.5 rounded-xl border text-xs text-muted-foreground truncate gap-2">
                  <span className="truncate flex-1 font-mono">{inviteInfo.link}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 hover:bg-muted" onClick={() => copyToClipboard(inviteInfo.link)}>
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-center pt-2">
            <Button onClick={() => setOpenInvite(false)} className="w-full bg-gradient-primary shadow-elegant">Entendido, cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MuroPermissionsTab() {
  const activeTeams = RendimientoStore.getEquipos();
  const activeUsers = RendimientoStore.getUsuarios();

  const defaultEquiposMap: Record<string, { nombre: string; coach: boolean; padres: boolean }> = {};
  activeTeams.forEach(t => {
    defaultEquiposMap[t.id] = { nombre: t.nombre, coach: true, padres: false };
  });

  const defaultIndividualPerms = activeUsers.map(u => ({
    email: u.email,
    nombre: u.nombre,
    role: u.role === "coaches" ? "Coach Deportivo" : u.role === "admin" ? "Administrador" : "Personal de Apoyo",
    allowed: u.role === "admin"
  }));

  const DEFAULT_PERMS = {
    globalAdmin: true,
    globalCoach: true,
    globalPadres: false,
    equipos: defaultEquiposMap,
    individualPerms: defaultIndividualPerms
  };

  const [perms, setPerms] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("muro-publish-perms");
        if (saved) {
          const parsed = JSON.parse(saved);
          // Merge with defaults so missing fields from old sessions don't crash
          return {
            ...DEFAULT_PERMS,
            ...parsed,
            equipos: parsed.equipos ?? DEFAULT_PERMS.equipos,
            individualPerms: Array.isArray(parsed.individualPerms) ? parsed.individualPerms : DEFAULT_PERMS.individualPerms,
          };
        }
      } catch {
        localStorage.removeItem("muro-publish-perms");
      }
    }
    return DEFAULT_PERMS;
  });

  const savePerms = (newPerms: typeof perms) => {
    setPerms(newPerms);
    localStorage.setItem("muro-publish-perms", JSON.stringify(newPerms));
  };

  const toggleGlobal = (key: "globalAdmin" | "globalCoach" | "globalPadres") => {
    const updated = {
      ...perms,
      [key]: !perms[key]
    };
    savePerms(updated);
    toast.success("Permisos globales actualizados.");
  };

  const toggleEquipoPerm = (eqId: string, roleKey: "coach" | "padres") => {
    const updatedEquipos = {
      ...perms.equipos,
      [eqId]: {
        ...perms.equipos[eqId as keyof typeof perms.equipos],
        [roleKey]: !perms.equipos[eqId as keyof typeof perms.equipos][roleKey]
      }
    };
    const updated = {
      ...perms,
      equipos: updatedEquipos
    };
    savePerms(updated);
    toast.success("Permisos por equipo actualizados.");
  };

  const toggleIndividualPerm = (email: string) => {
    const updatedIndiv = perms.individualPerms.map((user: { email: string; nombre: string; role: string; allowed: boolean }) => {
      if (user.email === email) {
        return { ...user, allowed: !user.allowed };
      }
      return user;
    });
    const updated = {
      ...perms,
      individualPerms: updatedIndiv
    };
    savePerms(updated);
    toast.success("Permiso individual actualizado.");
  };

  // Add individual mock user option
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const CANDIDATES = activeUsers
    .filter(u => !perms.individualPerms.some((ip: any) => ip.email === u.email))
    .map(u => ({
      email: u.email,
      nombre: u.nombre,
      role: u.role === "coaches" ? "Coach Deportivo" : u.role === "admin" ? "Administrador" : "Personal de Apoyo"
    }));

  const handleAddIndividual = () => {
    if (!selectedUserEmail) return;
    const cand = CANDIDATES.find(c => c.email === selectedUserEmail);
    if (!cand) return;

    if (perms.individualPerms.some((u: { email: string }) => u.email === cand.email)) {
      toast.warning("El usuario ya está en la lista de permisos individuales.");
      return;
    }

    const updated = {
      ...perms,
      individualPerms: [...perms.individualPerms, { ...cand, allowed: true }]
    };
    savePerms(updated);
    toast.success(`${cand.nombre} agregado con éxito.`);
    setSelectedUserEmail("");
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Permisos Globales de Publicación
          </CardTitle>
          <CardDescription>Establece qué roles pueden publicar noticias o posts generales en el Muro del club.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold">Administradores</h4>
              <p className="text-xs text-muted-foreground">Permitir a los administradores crear posts generales en el Muro.</p>
            </div>
            <Switch checked={perms.globalAdmin} onCheckedChange={() => toggleGlobal("globalAdmin")} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold">Coaches / Entrenadores</h4>
              <p className="text-xs text-muted-foreground">Permitir a los profesores crear posts globales.</p>
            </div>
            <Switch checked={perms.globalCoach} onCheckedChange={() => toggleGlobal("globalCoach")} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold">Padres de Familia</h4>
              <p className="text-xs text-muted-foreground">Permitir a todos los padres publicar posts globales (inactivo recomendado para evitar spam).</p>
            </div>
            <Switch checked={perms.globalPadres} onCheckedChange={() => toggleGlobal("globalPadres")} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" /> Permisos por Equipo Específico
          </CardTitle>
          <CardDescription>Habilita la publicación a nivel de equipos para dinamizar foros o tableros de equipo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipo</TableHead>
                <TableHead className="text-center">Coaches del Equipo</TableHead>
                <TableHead className="text-center">Padres del Equipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.entries(perms.equipos) as [string, { nombre: string; coach: boolean; padres: boolean }][]).map(([eqId, eqData]) => (
                <TableRow key={eqId}>
                  <TableCell className="font-semibold text-sm">{eqData.nombre}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch checked={eqData.coach} onCheckedChange={() => toggleEquipoPerm(eqId, "coach")} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch checked={eqData.padres} onCheckedChange={() => toggleEquipoPerm(eqId, "padres")} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Individual Permissions Manager */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" /> Permisos de Publicación Individuales
          </CardTitle>
          <CardDescription>Otorga o revoca permisos de forma selectiva a personas específicas (Admins, Coaches o Padres).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Buscar y Agregar Persona</Label>
              <select
                value={selectedUserEmail}
                onChange={e => setSelectedUserEmail(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">-- Seleccionar usuario --</option>
                {CANDIDATES.map(c => (
                  <option key={c.email} value={c.email}>{c.nombre} ({c.role})</option>
                ))}
              </select>
            </div>
            <Button onClick={handleAddIndividual} size="sm" className="bg-gradient-primary shadow-elegant h-9 gap-1">
              <Plus className="h-4 w-4" /> Agregar Permiso
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="text-center">Permiso de Publicación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perms.individualPerms.map((user: { email: string; nombre: string; role: string; allowed: boolean }) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div className="leading-tight">
                      <p className="font-semibold text-sm">{user.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch checked={user.allowed} onCheckedChange={() => toggleIndividualPerm(user.email)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CoachConfigPage() {
  const { coachName } = useRole();
  const activeOrgId = RendimientoStore.getActiveOrganizacionId();

  // Find the logged-in coach's real data from the store
  const coachData = useMemo(() => {
    const coaches = RendimientoStore.get<any[]>("entrenadores_dynamics", []);
    const found = coaches.find(c =>
      c.nombre === coachName && (!activeOrgId || c.organizacion_id === activeOrgId)
    );
    return {
      nombre: found?.nombre || coachName || "Entrenador",
      correo: found?.correo || found?.email || "",
      telefono: found?.telefono || found?.whatsapp || "",
      especialidad: found?.especialidad || found?.categoria || "",
    };
  }, [coachName, activeOrgId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Configuración de entrenador guardada correctamente.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración del Entrenador</h1>
        <p className="text-sm text-muted-foreground">Gestiona tus preferencias de entrenamiento y notificaciones.</p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">Mi Perfil</TabsTrigger>
          <TabsTrigger value="preferencias">Preferencias de Práctica</TabsTrigger>
          <TabsTrigger value="notificaciones">Alertas & Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Mis Datos</CardTitle>
              <CardDescription>Información básica de tu perfil docente.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Nombre Completo</Label><Input defaultValue={coachData.nombre} /></div>
                <div className="space-y-2"><Label>Correo Electrónico</Label><Input defaultValue={coachData.correo} disabled /></div>
                <div className="space-y-2"><Label>WhatsApp</Label><Input defaultValue={coachData.telefono} /></div>
                <div className="space-y-2"><Label>Especialidad</Label><Input defaultValue={coachData.especialidad} /></div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Cambiar Contraseña</Label>
                  <Input type="password" placeholder="Contraseña actual" className="mb-2" />
                  <Input type="password" placeholder="Nueva contraseña" />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" className="bg-gradient-primary shadow-elegant">Guardar Preferencias</Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Preferencias de Práctica</CardTitle>
              <CardDescription>Parámetros por defecto para tus entrenamientos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Duración por defecto de sesión (minutos)</Label>
                  <Input type="number" defaultValue="90" />
                </div>
                <div className="space-y-2">
                  <Label>Disciplina Principal</Label>
                  <Input defaultValue="Fútbol" disabled />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold">Alertas de Wellness</h4>
                  <p className="text-xs text-muted-foreground">Notificar automáticamente si un jugador reporta menos de 6 horas de sueño.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-gradient-primary shadow-elegant">Guardar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Alertas & Notificaciones</CardTitle>
              <CardDescription>Elige cómo deseas recibir notificaciones importantes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold">Notificaciones de WhatsApp</h4>
                  <p className="text-xs text-muted-foreground">Enviar avisos automáticos de partidos o cancelaciones a los padres por chat.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold">Alertas de Lesión</h4>
                  <p className="text-xs text-muted-foreground">Recibir notificación inmediata si el cuerpo médico cambia la disponibilidad de un atleta.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-gradient-primary shadow-elegant">Guardar Alertas</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ParentConfigPage() {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Configuración de encargado guardada correctamente.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración del Encargado</h1>
        <p className="text-sm text-muted-foreground">Administra tus datos de contacto y notificaciones familiares.</p>
      </div>

      <Tabs defaultValue="encargado">
        <TabsList>
          <TabsTrigger value="encargado">Mis Datos</TabsTrigger>
          <TabsTrigger value="estudiante">Información del Estudiante</TabsTrigger>
          <TabsTrigger value="facturacion">Suscripción & Facturación</TabsTrigger>
        </TabsList>

        <TabsContent value="encargado" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Datos del Encargado</CardTitle>
              <CardDescription>Información del tutor legal registrado en la academia.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Nombre Completo</Label><Input defaultValue="Manuel Rodríguez" /></div>
                <div className="space-y-2"><Label>Correo Electrónico</Label><Input defaultValue="manuel.r@correo.com" /></div>
                <div className="space-y-2"><Label>Teléfono Celular (WhatsApp)</Label><Input defaultValue="+506 7777 8888" /></div>
                <div className="space-y-2"><Label>Parentesco</Label><Input defaultValue="Padre" disabled /></div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Cambiar Contraseña</Label>
                  <Input type="password" placeholder="Contraseña actual" className="mb-2" />
                  <Input type="password" placeholder="Nueva contraseña" />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" className="bg-gradient-primary shadow-elegant">Guardar Cambios</Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="estudiante" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Ficha del Estudiante Asociado</CardTitle>
              <CardDescription>Detalles médicos y de contacto de tu hija, Sofía Rodríguez.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Alergias Conocidas</Label><Input defaultValue="Maní, Polvo" /></div>
                <div className="space-y-2"><Label>Medicamentos Frecuentes</Label><Input defaultValue="Inhalador salbutamol (si es necesario)" /></div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Restricciones de Práctica u Observaciones</Label>
                  <Input defaultValue="Requiere descanso breve en sprints largos bajo humedad alta." />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-gradient-primary shadow-elegant">Guardar Ficha Médica</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facturacion" className="mt-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Historial de Pagos y Suscripción</CardTitle>
              <CardDescription>Detalles financieros y recibos de pago.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl border bg-muted/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Plan de Mensualidad Activo</h4>
                  <p className="text-xs text-muted-foreground">Fútbol Sub-10 · Sede Central</p>
                </div>
                <span className="font-bold text-sm">₡35,000 / mes</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Últimos Pagos</h4>
                <div className="p-3 rounded-lg border flex justify-between text-xs items-center bg-background">
                  <span>05 de Julio, 2026 - Mensualidad Julio</span>
                  <span className="font-bold text-emerald-600">₡35,000 (Pago Confirmado)</span>
                </div>
                <div className="p-3 rounded-lg border flex justify-between text-xs items-center bg-background">
                  <span>05 de Junio, 2026 - Mensualidad Junio</span>
                  <span className="font-bold text-emerald-600">₡35,000 (Pago Confirmado)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LegalConfigTab() {
  const [config, setConfig] = useState(() => RendimientoStore.getLegalConfig());
  const [liberacion, setLiberacion] = useState(config.liberacion);
  const [tratamiento, setTratamiento] = useState(config.tratamiento);
  const [fotos, setFotos] = useState(config.fotos);
  const [firmaCoordinador, setFirmaCoordinador] = useState(config.firmaCoordinadorBase64 || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    RendimientoStore.saveLegalConfig({
      liberacion,
      tratamiento,
      fotos,
      firmaCoordinadorBase64: firmaCoordinador
    });
    toast.success("Aspectos legales y firma del coordinador actualizados correctamente");
  };

  useEffect(() => {
    const canvas = document.getElementById('coordinador-signature-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 400;
    canvas.height = rect.height || 120;

    if (!firmaCoordinador) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = firmaCoordinador;
  }, [firmaCoordinador]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Aspectos Legales & Redacción de Fichas
        </CardTitle>
        <CardDescription>
          Configura los textos legales que se mostrarán en la ficha de inscripción del club. Puedes usar <code className="text-primary font-bold">{`{nombre}`}</code> y <code className="text-primary font-bold">{`{identificacion}`}</code> como comodines para que se completen automáticamente con los datos del encargado legal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label className="font-semibold text-zinc-700 dark:text-zinc-200">1. Liberación de Responsabilidad Social *</Label>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-zinc-800 dark:text-zinc-100"
              value={liberacion}
              onChange={(e) => setLiberacion(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-zinc-700 dark:text-zinc-200">2. Aceptación de Tratamiento de Datos *</Label>
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-zinc-800 dark:text-zinc-100"
              value={tratamiento}
              onChange={(e) => setTratamiento(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold text-zinc-700 dark:text-zinc-200">3. Permiso de Fotografías *</Label>
            <textarea
              className="w-full min-h-[100px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-zinc-800 dark:text-zinc-100"
              value={fotos}
              onChange={(e) => setFotos(e.target.value)}
              required
            />
          </div>

          {/* Firma del Coordinador Deportivo */}
          <div className="space-y-2 border-t pt-4">
            <Label className="font-semibold text-zinc-700 dark:text-zinc-200 block">4. Firma Digital del Coordinador Deportivo *</Label>
            <p className="text-xs text-muted-foreground">Esta firma se estampará automáticamente en el apartado "Firma de Coordinación Deportiva" de todas las fichas de inscripción oficiales.</p>
            
            <div className="relative border border-dashed border-zinc-300 rounded-xl bg-zinc-50 overflow-hidden select-none max-w-md">
              <canvas
                id="coordinador-signature-canvas"
                className="w-full h-[120px] bg-zinc-50 cursor-crosshair block touch-none"
                onMouseDown={(e) => {
                  const canvas = e.currentTarget;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / rect.width;
                  const scaleY = canvas.height / rect.height;

                  if (!canvas.width || canvas.width === 300) {
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                  }

                  ctx.beginPath();
                  ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                  (canvas as any).isDrawing = true;
                }}
                onMouseMove={(e) => {
                  const canvas = e.currentTarget;
                  if (!(canvas as any).isDrawing) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / rect.width;
                  const scaleY = canvas.height / rect.height;
                  ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                  ctx.strokeStyle = '#0284c7';
                  ctx.lineWidth = 2.5;
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  ctx.stroke();
                }}
                onMouseUp={(e) => {
                  const canvas = e.currentTarget;
                  (canvas as any).isDrawing = false;
                  setFirmaCoordinador(canvas.toDataURL());
                }}
                onMouseLeave={(e) => {
                  const canvas = e.currentTarget;
                  (canvas as any).isDrawing = false;
                }}
                onTouchStart={(e) => {
                  const canvas = e.currentTarget;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  const touch = e.touches[0];
                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / rect.width;
                  const scaleY = canvas.height / rect.height;

                  if (!canvas.width || canvas.width === 300) {
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                  }

                  ctx.beginPath();
                  ctx.moveTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
                  (canvas as any).isDrawing = true;
                }}
                onTouchMove={(e) => {
                  const canvas = e.currentTarget;
                  if (!(canvas as any).isDrawing) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  const touch = e.touches[0];
                  const rect = canvas.getBoundingClientRect();
                  const scaleX = canvas.width / rect.width;
                  const scaleY = canvas.height / rect.height;
                  ctx.lineTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
                  ctx.strokeStyle = '#0284c7';
                  ctx.lineWidth = 2.5;
                  ctx.lineCap = 'round';
                  ctx.lineJoin = 'round';
                  ctx.stroke();
                }}
                onTouchEnd={(e) => {
                  const canvas = e.currentTarget;
                  (canvas as any).isDrawing = false;
                  setFirmaCoordinador(canvas.toDataURL());
                }}
              />
              {!firmaCoordinador && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-[10px] font-semibold">
                  Dibuja la firma del coordinador aquí
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="text-[10px] h-6 px-2 text-red-500 hover:text-red-600"
                onClick={() => {
                  setFirmaCoordinador("");
                  const canvas = document.getElementById('coordinador-signature-canvas') as HTMLCanvasElement;
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                  }
                }}
              >
                Limpiar Firma
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" className="bg-gradient-primary shadow-elegant">
              Guardar Aspectos Legales
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface IntegracionesConfig {
  wsProvider: "demo" | "meta" | "twilio";
  wsMetaPhoneId: string;
  wsMetaToken: string;
  wsTwilioSid: string;
  wsTwilioToken: string;
  wsTwilioFrom: string;
  
  emailProvider: "demo" | "resend" | "sendgrid";
  emailApiKey: string;
  emailFrom: string;
  emailFromName: string;
}

function IntegracionesTab() {
  const [config, setConfig] = useState<IntegracionesConfig>(() => {
    const DEFAULT = {
      wsProvider: "demo",
      wsMetaPhoneId: "",
      wsMetaToken: "",
      wsTwilioSid: "",
      wsTwilioToken: "",
      wsTwilioFrom: "",
      emailProvider: "demo",
      emailApiKey: "",
      emailFrom: "noreply@elite.com",
      emailFromName: "Academia Deportiva Élite",
    };
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("deportivos_integraciones_config");
        if (saved) return { ...DEFAULT, ...JSON.parse(saved) };
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT;
  });

  const handleSave = () => {
    localStorage.setItem("deportivos_integraciones_config", JSON.stringify(config));
    toast.success("Configuraciones de integración guardadas con éxito.");
  };

  // State for Test Dialogs
  const [openWSTest, setOpenWSTest] = useState(false);
  const [openEmailTest, setOpenEmailTest] = useState(false);
  
  const [wsDest, setWSDest] = useState("");
  const [wsMsg, setWSMsg] = useState("¡Hola! Este es un mensaje de prueba de DeportivOS.");
  const [emailDest, setEmailDest] = useState("");
  const [emailSubject, setEmailSubject] = useState("Prueba de integración - DeportivOS");
  const [emailBody, setEmailBody] = useState("<p>Este es un correo de prueba enviado desde <strong>DeportivOS</strong>.</p>");
  const [testing, setTesting] = useState(false);

  const handleTestWS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsDest) {
      toast.error("Por favor ingresa el número de destino.");
      return;
    }
    setTesting(true);
    if (config.wsProvider === "demo") {
      setTimeout(() => {
        setTesting(false);
        setOpenWSTest(false);
        toast.success(`[DEMO] WhatsApp simulado enviado con éxito a ${wsDest}.`);
      }, 1000);
    } else if (config.wsProvider === "meta") {
      try {
        const url = `https://graph.facebook.com/v18.0/${config.wsMetaPhoneId}/messages`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.wsMetaToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: wsDest.replace(/\D/g, ""), // clean number
            type: "text",
            text: { body: wsMsg }
          })
        });
        const data = await res.json();
        setTesting(false);
        if (res.ok) {
          toast.success("WhatsApp enviado con éxito por Meta Cloud API.");
          setOpenWSTest(false);
        } else {
          toast.error(`Error de Meta API: ${data.error?.message || "Error desconocido"}`);
        }
      } catch (err: any) {
        setTesting(false);
        toast.error(`Error al conectar con la API de Meta: ${err.message}`);
      }
    } else if (config.wsProvider === "twilio") {
      try {
        toast.info("Enviando vía Twilio...");
        const url = `https://api.twilio.com/2010-04-01/Accounts/${config.wsTwilioSid}/Messages.json`;
        const auth = btoa(`${config.wsTwilioSid}:${config.wsTwilioToken}`);
        const body = new URLSearchParams({
          To: `whatsapp:${wsDest}`,
          From: `whatsapp:${config.wsTwilioFrom}`,
          Body: wsMsg
        });
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: body.toString()
        });
        const data = await res.json();
        setTesting(false);
        if (res.ok) {
          toast.success("WhatsApp enviado con éxito por Twilio.");
          setOpenWSTest(false);
        } else {
          toast.error(`Error de Twilio: ${data.message || "Error desconocido"}`);
        }
      } catch (err: any) {
        setTesting(false);
        toast.error(`Error de CORS o Conectividad: ${err.message}. Recuerda que Twilio puede requerir proxies en producción.`);
      }
    }
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailDest) {
      toast.error("Por favor ingresa el correo de destino.");
      return;
    }
    setTesting(true);
    if (config.emailProvider === "demo") {
      setTimeout(() => {
        setTesting(false);
        setOpenEmailTest(false);
        toast.success(`[DEMO] Correo electrónico simulado enviado con éxito a ${emailDest}.`);
      }, 1000);
    } else if (config.emailProvider === "resend") {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.emailApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: `${config.emailFromName} <${config.emailFrom}>`,
            to: [emailDest],
            subject: emailSubject,
            html: emailBody
          })
        });
        const data = await res.json();
        setTesting(false);
        if (res.ok) {
          toast.success("Correo enviado con éxito por Resend.");
          setOpenEmailTest(false);
        } else {
          toast.error(`Error de Resend: ${data.message || "Error desconocido"}`);
        }
      } catch (err: any) {
        setTesting(false);
        toast.error(`Error al conectar con Resend: ${err.message}. Nota: La API de Resend podría bloquear llamadas directas desde cliente (CORS) por seguridad.`);
      }
    } else if (config.emailProvider === "sendgrid") {
      try {
        const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.emailApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: emailDest }] }],
            from: { email: config.emailFrom, name: config.emailFromName },
            subject: emailSubject,
            content: [{ type: "text/html", value: emailBody }]
          })
        });
        setTesting(false);
        if (res.status === 202 || res.ok) {
          toast.success("Correo enviado con éxito por SendGrid.");
          setOpenEmailTest(false);
        } else {
          const data = await res.json().catch(() => ({}));
          toast.error(`Error de SendGrid: ${data.errors?.[0]?.message || "Error desconocido"}`);
        }
      } catch (err: any) {
        setTesting(false);
        toast.error(`Error al conectar con SendGrid: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Description Header */}
      <div className="bg-card/50 border border-border/80 rounded-2xl p-6 shadow-elegant flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Link2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              Configuración de APIs e Integraciones
              <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary">API Gateways</Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Define las credenciales de WhatsApp Business y Correo Electrónico. El cliente puede colocar sus propias credenciales aquí para los envíos reales.</p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-gradient-primary shadow-elegant text-xs h-9">
          <Save className="h-4 w-4 mr-1.5" />
          Guardar Integraciones
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* WhatsApp Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-green-500">
              <MessageSquare className="h-5 w-5" /> WhatsApp Business API
            </CardTitle>
            <CardDescription>Conecta tu cuenta para enviar notificaciones automáticas por WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Proveedor de WhatsApp</Label>
              <Select 
                value={config.wsProvider} 
                onValueChange={(v: any) => setConfig({ ...config, wsProvider: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo">Simulado / Demo (No requiere credenciales)</SelectItem>
                  <SelectItem value="meta">Meta Cloud API (Oficial y Directo)</SelectItem>
                  <SelectItem value="twilio">Twilio SMS / WhatsApp API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.wsProvider === "meta" && (
              <div className="space-y-4 pt-2 border-t border-border/80">
                <div className="space-y-1.5">
                  <Label>ID del Número de Teléfono (Phone Number ID)</Label>
                  <Input 
                    placeholder="Ej. 109384729103847" 
                    value={config.wsMetaPhoneId}
                    onChange={e => setConfig({ ...config, wsMetaPhoneId: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground">Obtenido de la consola de desarrolladores de Meta (WhatsApp Setup).</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Token de Acceso Permanente (Access Token)</Label>
                  <Input 
                    type="password"
                    placeholder="Token permanente EAAB..." 
                    value={config.wsMetaToken}
                    onChange={e => setConfig({ ...config, wsMetaToken: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground">Token de sistema de Meta Cloud API con permisos de whatsapp_business_messaging.</p>
                </div>
              </div>
            )}

            {config.wsProvider === "twilio" && (
              <div className="space-y-4 pt-2 border-t border-border/80">
                <div className="space-y-1.5">
                  <Label>Account SID de Twilio</Label>
                  <Input 
                    placeholder="Ej. ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" 
                    value={config.wsTwilioSid}
                    onChange={e => setConfig({ ...config, wsTwilioSid: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Auth Token de Twilio</Label>
                  <Input 
                    type="password"
                    placeholder="Tu Auth Token" 
                    value={config.wsTwilioToken}
                    onChange={e => setConfig({ ...config, wsTwilioToken: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Número Emisor (Twilio From Number)</Label>
                  <Input 
                    placeholder="Ej. +14155238886 (Twilio Sandbox o número propio)" 
                    value={config.wsTwilioFrom}
                    onChange={e => setConfig({ ...config, wsTwilioFrom: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-border/80">
              <span className="text-xs text-muted-foreground">
                Estado: <span className={config.wsProvider === "demo" ? "text-amber-500 font-semibold" : "text-green-500 font-semibold"}>
                  {config.wsProvider === "demo" ? "Modo Demo Activo" : "Configurado"}
                </span>
              </span>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setOpenWSTest(true)}
              >
                Enviar WhatsApp de Prueba
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-primary">
              <Mail className="h-5 w-5" /> Correo Electrónico API
            </CardTitle>
            <CardDescription>Configura el emisor para el envío automático de recibos, facturas y estados de cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Proveedor de Correo</Label>
              <Select 
                value={config.emailProvider} 
                onValueChange={(v: any) => setConfig({ ...config, emailProvider: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo">Simulado / Demo (No requiere credenciales)</SelectItem>
                  <SelectItem value="resend">Resend API (Recomendado, moderno y fácil)</SelectItem>
                  <SelectItem value="sendgrid">SendGrid API</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.emailProvider !== "demo" && (
              <div className="space-y-4 pt-2 border-t border-border/80">
                <div className="space-y-1.5">
                  <Label>API Key (Llave de API)</Label>
                  <Input 
                    type="password"
                    placeholder="re_..." 
                    value={config.emailApiKey}
                    onChange={e => setConfig({ ...config, emailApiKey: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Correo Emisor ("De:")</Label>
                    <Input 
                      placeholder="Ej. cobros@miacademia.com" 
                      value={config.emailFrom}
                      onChange={e => setConfig({ ...config, emailFrom: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground">Debe ser un dominio verificado en tu proveedor.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nombre Emisor</Label>
                    <Input 
                      placeholder="Ej. Academia Élite" 
                      value={config.emailFromName}
                      onChange={e => setConfig({ ...config, emailFromName: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-border/80">
              <span className="text-xs text-muted-foreground">
                Estado: <span className={config.emailProvider === "demo" ? "text-amber-500 font-semibold" : "text-green-500 font-semibold"}>
                  {config.emailProvider === "demo" ? "Modo Demo Activo" : "Configurado"}
                </span>
              </span>
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setOpenEmailTest(true)}
              >
                Enviar Email de Prueba
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog for WhatsApp Test */}
      <Dialog open={openWSTest} onOpenChange={setOpenWSTest}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-500" /> Probar Envío de WhatsApp
            </DialogTitle>
            <DialogDescription>
              Envía un mensaje de prueba al teléfono indicado usando el canal configurado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTestWS} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Número Destinatario (Con código de país, sin +)</Label>
              <Input 
                placeholder="Ej. 50688888888" 
                value={wsDest}
                onChange={e => setWSDest(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mensaje de Texto</Label>
              <Textarea 
                value={wsMsg}
                onChange={e => setWSMsg(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenWSTest(false)} disabled={testing}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white" disabled={testing}>
                {testing ? "Enviando..." : "Enviar Mensaje"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog for Email Test */}
      <Dialog open={openEmailTest} onOpenChange={setOpenEmailTest}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Probar Envío de Correo
            </DialogTitle>
            <DialogDescription>
              Envía un correo de prueba al destinatario indicado usando el proveedor configurado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTestEmail} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Correo Destinatario</Label>
              <Input 
                type="email"
                placeholder="ejemplo@correo.com" 
                value={emailDest}
                onChange={e => setEmailDest(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Asunto</Label>
              <Input 
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cuerpo del Correo (HTML)</Label>
              <Textarea 
                value={emailBody}
                onChange={e => setEmailBody(e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenEmailTest(false)} disabled={testing}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-primary shadow-elegant" disabled={testing}>
                {testing ? "Enviando..." : "Enviar Correo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WhatsAppServiceConfigTab() {
  const [apiKey, setApiKey] = useState("AK-WAP-8842-ATH");
  const [saldoMensajes, setSaldoMensajes] = useState(450);

  const handleOpenPaymentPortal = () => {
    toast.loading("Redirigiendo al Portal Oficial del Proveedor de Servicio WhatsApp...");
    setTimeout(() => {
      window.open("https://paypal.com", "_blank");
      toast.success("Portal oficial de recarga abierto.");
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-4">
      {/* Main WhatsApp Service Card (matching and surpassing reference screenshot) */}
      <Card className="shadow-2xl border-0 overflow-hidden rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {/* Card Header (Deep Green WhatsApp Gradient Header) */}
        <div className="bg-gradient-to-r from-[#128C7E] via-[#075E54] to-[#128C7E] p-6 text-white text-center space-y-2 relative">
          <div className="mx-auto h-14 w-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md">
            <MessageSquare className="h-7 w-7 text-emerald-300" />
          </div>
          <h2 className="text-xl font-black tracking-wide">Pago de Servicio de Whatsapp</h2>
          <p className="text-xs text-emerald-100/80 font-medium">Portal de Gestión de Licencias & Recarga de Mensajería API</p>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Information Box (Mint Light Green) */}
          <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 space-y-3 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
            <p className="font-semibold text-emerald-950 dark:text-emerald-300">
              <strong className="text-emerald-800 dark:text-emerald-400 font-extrabold">Nota Importante:</strong> El Servicio de Whatsapp es un servicio externo al software.
            </p>
            <p>
              A cada escuela se le concede un código Identificador <strong className="text-emerald-700 dark:text-emerald-300 font-mono bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 font-bold">"Apikey"</strong>.
            </p>
            <p>
              Presione el boton verde de abajo para entrar en el sitio web oficial del servicio
            </p>
            <p>
              Despues verá una ventana flotante donde debera colocar su <strong className="text-emerald-800 dark:text-emerald-300 font-extrabold">Apikey</strong>
            </p>
            <p>
              Acto seguido será redirigido a la Plataforma <strong className="text-slate-900 dark:text-white font-extrabold underline">PAYPAL</strong> para efectuar el pago del servicio.
            </p>
          </div>

          {/* ApiKey Display & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Su Código Apikey Único</Label>
              <div className="flex items-center gap-2">
                <Input value={apiKey} onChange={e => setApiKey(e.target.value)} className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 h-9 bg-white dark:bg-slate-950" />
                <Button size="sm" variant="outline" className="h-9 px-2 text-xs" onClick={() => { navigator.clipboard.writeText(apiKey); toast.success("Apikey copiada"); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Estado del Servicio</Label>
              <div className="h-9 px-3 rounded-lg border bg-white dark:bg-slate-950 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Activo
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">{saldoMensajes} msjs disp.</span>
              </div>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-400 uppercase font-bold tracking-widest">o</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Action Button (Matches Screenshot: Green Button with Headset/WhatsApp Icon) */}
          <Button
            onClick={handleOpenPaymentPortal}
            className="w-full bg-[#25D366] hover:bg-[#1ebd59] text-white font-extrabold text-xs sm:text-sm py-3.5 h-auto rounded-full shadow-lg hover:shadow-xl transition-all gap-2 tracking-wide uppercase cursor-pointer"
          >
            <MessageSquare className="h-5 w-5 fill-current" />
            CONTACTAR SERV WHATSAPP
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

