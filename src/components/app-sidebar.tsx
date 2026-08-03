import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRole, INITIAL_PERMISSIONS } from "@/hooks/use-role";
import { equipos as staticEquipos } from "@/lib/mock-data";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, Users, Building2, Wallet, Settings, Trophy,
  Megaphone, Activity, Workflow, Sparkles, Gauge, Stethoscope,
  Package, ShoppingBag, HelpCircle, GitFork, Laptop, Presentation,
  Filter, UserCheck, LineChart, HeartPulse, ChevronRight, ChevronDown, ChevronUp, Command,
  CalendarDays, ScanLine, MessageSquare, ShieldHalf, UserRound, User, Calendar, CheckSquare,
  CalendarCheck, Folder, GraduationCap, Star, TrendingUp, Palmtree, Banknote, Pill, ClipboardCheck, Ambulance, Hospital, BarChart3, CreditCard, Receipt
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type SubLink = { id?: string; title: string; url: string; icon?: React.ComponentType<{ className?: string; strokeWidth?: number; size?: number; color?: string }>; search?: Record<string, any> };
export type SidebarItem = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; size?: number; color?: string }>;
  url: string;
  subLinks?: SubLink[];
  childrenItems?: SidebarItem[];
};
export type SidebarSection = {
  header?: string;
  items: SidebarItem[];
};

const ADMIN_NAV_SECTIONS: SidebarSection[] = [
  {
    header: "GESTIÓN DE ACADEMIA",
    items: [
      { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
      {
        id: "operacion",
        title: "Operación Deportiva",
        icon: Activity,
        url: "/operacion",
        childrenItems: [
          { id: "op_jugadores", title: "Jugadores", icon: User, url: "/jugadores" },
          {
            id: "op_estructura",
            title: "Estructura",
            icon: Users,
            url: "/categorias",
          },
          {
            id: "op_planificacion",
            title: "Horarios & Calendario",
            icon: Calendar,
            url: "/horarios",
          },
          {
            id: "op_control_campo",
            title: "Control de Campo",
            icon: CheckSquare,
            url: "/asistencia",
            subLinks: [
              { id: "op_asistencia", title: "Asistencia", url: "/asistencia" },
              { id: "op_checkin", title: "Check QR", url: "/checkin" },
              { id: "op_convocatorias", title: "Convocatorias", url: "/convocatorias" },
            ],
          },
          {
            id: "op_sedes",
            title: "Sedes & Instalaciones",
            icon: Building2,
            url: "/sedes",
          },
        ],
      },
    ],
  },
  {
    header: "ÁREA TÉCNICA",
    items: [
      {
        id: "coordinacion_general",
        title: "Coordinación General",
        icon: GitFork,
        url: "/tactica",
        subLinks: [
          { id: "coord_planificacion", title: "Planificación Metodológica", url: "/tactica/planificacion" },
        ],
      },
      {
        id: "coach_os",
        title: "Coach OS",
        icon: Laptop,
        url: "/dashboard",
        subLinks: [
          { id: "coach_sesiones", title: "Sesiones", url: "/entrenamientos" },
          { id: "coach_plantillas", title: "Entrenamientos", url: "/plantillas" },
          { id: "coach_convocatorias", title: "Convocatorias", url: "/convocatorias" },
          { id: "coach_objetivos", title: "Objetivos", url: "/objetivos" },
          { id: "coach_evaluaciones", title: "Evaluación de Jugadores", url: "/evaluaciones" },
          { id: "coach_planeamiento", title: "Planeamiento del Entrenador", url: "/planeamiento" },
          { id: "coach_diario", title: "Bitácora", url: "/diario" },
        ],
      },
      {
        id: "centro_tactico",
        title: "Centro Táctico",
        icon: Presentation,
        url: "/tactica/dashboard",
        subLinks: [
          { id: "tactico_pizarra", title: "Pizarra", url: "/tactica/pizarra" },
          { id: "tactico_jugadas", title: "Sistemas y Jugadas", url: "/tactica/jugadas" },
          { id: "tactico_video", title: "Videoanálisis", url: "/tactica/video" },
          { id: "tactico_biblioteca", title: "Biblioteca", url: "/biblioteca" },
        ],
      },
      {
        id: "competiciones",
        title: "Competiciones",
        icon: Trophy,
        url: "/partidos",
        subLinks: [
          { id: "comp_torneos", title: "Torneos", url: "/competiciones" },
          { id: "comp_rivales", title: "Rivales", url: "/tactica/rivales" },
        ],
      },
      {
        id: "alto_rendimiento",
        title: "Alto Rendimiento",
        icon: Gauge,
        url: "",
        subLinks: [
          { id: "rend_wellness", title: "Wellness", url: "/rendimiento/wellness" },
          { id: "rend_cargas", title: "Control de Cargas", url: "/rendimiento/cargas" },
          { id: "rend_tests", title: "Test Físicos", url: "/rendimiento/tests" },
          { id: "rend_ss", title: "Sport Science", url: "/rendimiento/sports-science" },
          { id: "rend_gps", title: "GPS y Wearables", url: "/rendimiento/gps" },
          { id: "rend_evolucion", title: "Evolución Física", url: "/rendimiento/evolucion" },
        ],
      },
    ],
  },
  {
    header: "CAPTACIÓN",
    items: [
      {
        id: "crm",
        title: "CRM Deportivo",
        icon: Filter,
        url: "/crm",
      },
    ],
  },
  {
    header: "ADMINISTRACIÓN Y CONTROL",
    items: [
      {
        id: "personal",
        title: "Personal",
        icon: UserCheck,
        url: "/personal",
      },
      {
        id: "finanzas",
        title: "Finanzas y Caja",
        icon: Wallet,
        url: "/finanzas",
        subLinks: [
          { id: "fin_graficas", title: "Dashboard & Gráficas", url: "/finanzas", search: { tab: "graficas" }, icon: BarChart3 },
          { id: "fin_mensualidades", title: "Control de Mensualidades", url: "/finanzas", search: { tab: "mensualidades" }, icon: CreditCard },
          { id: "fin_recibos", title: "Historial de Pagos & Recibos", url: "/pagos", icon: Receipt },
          { id: "fin_caja", title: "Libro de Caja & Balance", url: "/finanzas", search: { tab: "balance" }, icon: Wallet },
        ],
      },
      {
        id: "area_medica",
        title: "Área Médica",
        icon: HeartPulse,
        url: "/medico",
        subLinks: [
          { id: "med_historial", title: "Historial Clínico", url: "/medico", search: { tab: "historial" }, icon: User },
          { id: "med_lesiones", title: "Lesiones", url: "/rendimiento/lesiones", icon: Ambulance },
          { id: "med_directorio", title: "Directorio Médico", url: "/medico/citas", icon: Stethoscope },
          { id: "med_aptitud", title: "Aptitud Deportiva", url: "/medico", search: { tab: "aptitud" }, icon: ClipboardCheck },
          { id: "med_reportes", title: "Reportes", url: "/reportes", search: { tab: "medico" }, icon: LineChart },
        ],
      },
      {
        id: "logistica",
        title: "Logística e Inventario",
        icon: Package,
        url: "/inventario",
        subLinks: [
          { id: "log_tienda", title: "Tienda", url: "/tienda" },
          { id: "log_inventario", title: "Inventario", url: "/inventario" },
        ],
      },
    ],
  },
  {
    header: "SISTEMA",
    items: [
      { id: "bi", title: "Business Intelligence", icon: LineChart, url: "/reportes" },
      { id: "ia", title: "IA & Automatización", icon: Sparkles, url: "/ia" },
      { id: "configuracion", title: "Configuración General", icon: Settings, url: "/configuracion" },
      { id: "soporte", title: "Soporte & Sugerencias", icon: HelpCircle, url: "/soporte" },
    ],
  },
];



export function AppSidebar() {
  const { role, coachName, permissions, selectedCoachId, selectedCoachName, setSelectedCoach } = useRole();

  // Build dynamic "Mis Equipos" submenu filtered by the active coach's name
  const coachTeamItems = useMemo(() => {
    return staticEquipos
      .filter((eq: any) => eq.entrenador === coachName)
      .map((eq: any) => ({ title: eq.nombre, url: "/equipos", search: { teamId: eq.id } }));
  }, [coachName]);

  const [mounted, setMounted] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState("00000000-0000-0000-0000-000000000000");
  const [openNewOrg, setOpenNewOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgEmail, setNewOrgEmail] = useState("");
  const [newOrgCountry, setNewOrgCountry] = useState("Costa Rica");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [coachesList, setCoachesList] = useState<any[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  const isSuperAdmin = useMemo(() => {
    if (!mounted) return false;
    const currentUser = RendimientoStore.get<any>("currentUser", null);
    return currentUser?.email === "alex@mail.com" || currentUser?.role === "superadmin";
  }, [mounted]);

  const totalJugadoresCount = useMemo(() => {
    const list = RendimientoStore.getJugadores();
    return list ? list.length : 0;
  }, [mounted, activeOrgId]);

  const totalSedesCount = useMemo(() => {
    const list = RendimientoStore.getSedes();
    return list ? list.length : 0;
  }, [mounted, activeOrgId]);

  const activeOrg = useMemo(() => {
    return orgs.find(o => o.id === activeOrgId);
  }, [orgs, activeOrgId]);

  // Load coaches from Supabase DB for admin coach selector
  const loadCoaches = async () => {
    if (role !== "admin" || coachesList.length > 0) return;
    setLoadingCoaches(true);
    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";
    const { data } = await supabase
      .from("entrenadores")
      .select("id, nombre, identificacion")
      .or(`organizacion_id.eq.${orgId},organizacion_id.eq.org_asoderive_master,organizacion_id.is.null`)
      .order("nombre");
    if (data && data.length > 0) {
      setCoachesList(data);
    } else {
      const { data: allData } = await supabase
        .from("entrenadores")
        .select("id, nombre, identificacion")
        .order("nombre");
      if (allData) setCoachesList(allData);
    }
    setLoadingCoaches(false);
  };

  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const searchObj = useRouterState({ select: (r) => r.location.search }) as Record<string, any>;
  const isActive = (p: string) => pathname === p || (p !== "/" && pathname.startsWith(p + "/"));

  useEffect(() => {
    setMounted(true);
    setActiveOrgId(RendimientoStore.getActiveOrganizacionId());
    setOrgs(RendimientoStore.getOrganizaciones());

    const handleSync = () => {
      setOrgs(RendimientoStore.getOrganizaciones());
      setActiveOrgId(RendimientoStore.getActiveOrganizacionId());
    };
    window.addEventListener("organizacionChanged", handleSync);
    if (role === "admin") {
      loadCoaches();
    }
    return () => {
      window.removeEventListener("organizacionChanged", handleSync);
    };
  }, [role]);

  const handleOrgChange = (id: string) => {
    if (id === "__new__") {
      setOpenNewOrg(true);
      return;
    }
    RendimientoStore.setActiveOrganizacionId(id);
    setActiveOrgId(id);
    window.location.reload();
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgEmail) return;
    try {
      const newOrg = await RendimientoStore.addOrganizacion({
        nombre: newOrgName,
        correo: newOrgEmail,
        pais: newOrgCountry
      });
      toast.success(`Academia "${newOrgName}" registrada en la base de datos.`);
      setOpenNewOrg(false);
      RendimientoStore.setActiveOrganizacionId(newOrg.id);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Error al crear la academia.");
    }
  };

  const navSections = useMemo(() => {
    let sections = [...ADMIN_NAV_SECTIONS];
    
    // Poner Área Técnica arriba SOLO para el rol 'coach'
    const isCoachView = role === "coach";
    if (isCoachView) {
      const techIdx = sections.findIndex(s => s.header === "ÁREA TÉCNICA");
      const opIdx = sections.findIndex(s => s.header === "GESTIÓN DE ACADEMIA");
      if (techIdx !== -1 && opIdx !== -1) {
        const techSection = sections[techIdx];
        const opSection = sections[opIdx];
        const rest = sections.filter((_, i) => i !== techIdx && i !== opIdx);
        sections = [techSection, opSection, ...rest];
      }
    }

    if (isSuperAdmin && role === "admin" && !selectedCoachId) {
      sections = [
        {
          header: "SAAS ADMIN",
          items: [{ id: "saas-admin", title: "Centro de Mando", icon: Building2, url: "/saas-admin" }],
        },
        ...sections,
      ];
    }
    return sections;
  }, [role, isSuperAdmin, selectedCoachId]);

  return (
    <Sidebar collapsible="icon" key={`${role}-${coachName}-${activeOrgId}`}>
      <SidebarHeader>
        <div className={cn("flex items-center gap-3 px-2 py-3 overflow-hidden transition-all duration-200", collapsed && "justify-center px-0")}>
          {/* Logo Mark Container */}
          <div className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-md border border-white/20 transition-all duration-200 overflow-hidden p-1",
            collapsed ? "h-9 w-9" : "h-11 w-11"
          )}>
            <img src="/favicon.png" className="h-full w-full object-contain" alt="Nexus Sport" />
          </div>

          {!collapsed && (
            <div className="flex flex-col leading-none text-sidebar-foreground w-full max-w-[170px]">
              <span className="text-base font-black text-white tracking-wider uppercase font-sans">
                NEXUS<span className="text-sky-400">SPORT</span>
              </span>
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit mt-1 shadow-sm">
                <span>PREMIUM APP</span>
                <Sparkles className="h-3 w-3 text-amber-400 animate-pulse fill-amber-400" />
              </div>
            </div>
          )}
        </div>

        <Dialog open={openNewOrg} onOpenChange={setOpenNewOrg}>
          <DialogContent className="sm:max-w-[420px] bg-background border shadow-elegant text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Building2 className="h-5 w-5 text-primary" /> Registrar Nuevo Club
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Crea un nuevo entorno aislado para otra academia o club deportivo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrg} className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Nombre de la Academia / Club *</Label>
                <Input
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  placeholder="Ej. Club Deportivo San José"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Correo del Administrador *</Label>
                <Input
                  type="email"
                  value={newOrgEmail}
                  onChange={e => setNewOrgEmail(e.target.value)}
                  placeholder="Ej. admin@sanjose.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">País</Label>
                <Input
                  value={newOrgCountry}
                  onChange={e => setNewOrgCountry(e.target.value)}
                  placeholder="Ej. Costa Rica"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpenNewOrg(false)}>Cancelar</Button>
                <Button type="submit" className="bg-gradient-primary">Crear Entorno</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarHeader>

      <SidebarContent
        onClick={(e) => {
          if (collapsed) {
            setOpen(true);
            return;
          }
          const target = e.target as HTMLElement;
          if (target.closest("a")) {
            if (isMobile) {
              setOpenMobile(false);
            } else if (typeof window !== "undefined" && window.innerWidth < 1024) {
              setOpen(false);
            }
          }
        }}
      >
        {navSections.map((section, sIdx) => {
          const renderItem = (item: SidebarItem, level: number = 0) => {
            const roleKey = role === "coach" ? "coach" : role;
            const rolePerms = permissions[roleKey] || INITIAL_PERMISSIONS[roleKey as keyof typeof INITIAL_PERMISSIONS] || {};
            
            const checkAllowed = (it: SidebarItem): boolean => {
              // Admin siempre ve todo
              if (role === "admin") return true;
              
              // 1. Si el módulo principal está apagado (false), OCULTARLO DE INMEDIATO
              if (rolePerms[it.id] === false) return false;
              
              // 2. Si tiene sub-links y TODOS los sub-links están apagados, ocultar el módulo padre
              if (it.subLinks && it.subLinks.length > 0) {
                const anySubAllowed = it.subLinks.some(s => {
                  const sVal = s.id ? rolePerms[s.id] : undefined;
                  const sCompVal = s.id ? rolePerms[`${it.id}_${s.id}`] : undefined;
                  return sVal !== false && sCompVal !== false;
                });
                if (!anySubAllowed) return false;
              }

              // 3. Si tiene ítems hijos y TODOS los hijos están apagados, ocultar el módulo padre
              if (it.childrenItems && it.childrenItems.length > 0) {
                const anyChildAllowed = it.childrenItems.some(c => checkAllowed(c));
                if (!anyChildAllowed) return false;
              }

              if (rolePerms[it.id] === true) return true;
              
              return true;
            };

            if (!checkAllowed(item)) return null;

            const active = isActive(item.url);
            const Icon = item.icon;
            const hasChildren = (item.childrenItems && item.childrenItems.length > 0) || (item.subLinks && item.subLinks.length > 0);
            const isChildActive = (item.childrenItems?.some(c => isActive(c.url) || c.subLinks?.some(s => isActive(s.url))) ?? false) ||
                                  (item.subLinks?.some(s => isActive(s.url)) ?? false);
            const startOpen = active || isChildActive;

            const plClass = level === 0 ? "" : level === 1 ? "pl-2" : "pl-4";
            const subPlClass = level === 0 ? "pl-9" : level === 1 ? "pl-10" : "pl-11";

            if (hasChildren && !collapsed) {
              return (
                <Collapsible key={item.id} defaultOpen={startOpen} className="group/collapsible space-y-0.5">
                  <SidebarMenuItem className={plClass}>
                    <CollapsibleTrigger asChild>
                      {item.url ? (
                        <Link
                          to={item.url}
                          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-sidebar-accent/40 transition-colors group/row select-none cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Icon strokeWidth={1.5} size={17} color="currentColor" className="shrink-0 text-sidebar-foreground/80" />
                            <span className="flex-1 text-left text-[13px] font-semibold truncate leading-tight text-sidebar-foreground">
                              {item.title}
                            </span>
                          </div>
                          <div className="p-1 text-sidebar-foreground/60 group-hover/row:text-sidebar-foreground shrink-0 ml-2 rounded-md">
                            <ChevronUp className="h-4 w-4 block group-data-[state=open]/collapsible:hidden" />
                            <ChevronDown className="h-4 w-4 hidden group-data-[state=open]/collapsible:block" />
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-sidebar-accent/40 transition-colors group/row select-none cursor-pointer">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Icon strokeWidth={1.5} size={17} color="currentColor" className="shrink-0 text-sidebar-foreground/80" />
                            <span className="flex-1 text-left text-[13px] font-semibold truncate leading-tight text-sidebar-foreground">
                              {item.title}
                            </span>
                          </div>
                          <div className="p-1 text-sidebar-foreground/60 group-hover/row:text-sidebar-foreground shrink-0 ml-2 rounded-md">
                            <ChevronUp className="h-4 w-4 block group-data-[state=open]/collapsible:hidden" />
                            <ChevronDown className="h-4 w-4 hidden group-data-[state=open]/collapsible:block" />
                          </div>
                        </div>
                      )}
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-0.5 mt-0.5">
                      {/* Admin Coach Selector — solo en Coach OS */}
                      {role === "admin" && item.id === "coach_os" && (
                        <div className="pl-8 pr-2 py-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 mb-1">
                            VER COMO ENTRENADOR
                          </p>
                          <select
                            value={selectedCoachId || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) {
                                setSelectedCoach(null, null);
                              } else {
                                const found = coachesList.find((c: any) => c.id === val);
                                if (found) setSelectedCoach(found.id, found.nombre, found.identificacion || null);
                              }
                            }}
                            onFocus={loadCoaches}
                            className="w-full text-xs bg-sidebar-accent/60 border border-sidebar-border/80 rounded px-2 py-1 text-sidebar-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
                          >
                            <option value="" className="text-slate-900 bg-background dark:text-white dark:bg-slate-900">
                              {loadingCoaches ? "Cargando..." : "— Seleccionar Entrenador —"}
                            </option>
                            {coachesList.map((c: any) => (
                              <option key={c.id} value={c.id} className="text-slate-900 bg-background dark:text-white dark:bg-slate-900">
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                          {selectedCoachId && selectedCoachName && (
                            <p className="text-xs text-primary mt-1 font-medium truncate">
                              📋 {selectedCoachName}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Sub-enlaces (subLinks) uno a uno en fila vertical */}
                      {item.subLinks && item.subLinks.length > 0 && (
                        <div className="space-y-0.5 ml-4 border-l border-sidebar-border/30 pl-2">
                          {item.subLinks.map((sub: any, idx) => {
                            const roleKey = role === "coach" ? "coach" : role;
                            
                            // Verificar permisos por ID de sub-link (tanto por ID directo como compuesto)
                            const valById = sub.id ? permissions[roleKey]?.[sub.id] : undefined;
                            const valByCompKey = sub.id ? permissions[roleKey]?.[`${item.id}_${sub.id}`] : undefined;
                            const parentAllowed = permissions[roleKey]?.[item.id] !== false;
                            
                            const isDenied = valById === false || valByCompKey === false || !parentAllowed;
                            if (isDenied && role !== "admin") return null;

                            const isSamePath = pathname === sub.url || (sub.url !== "/" && pathname.startsWith(sub.url + "/"));
                            const hasSearch = sub.search && Object.keys(sub.search).length > 0;
                            let activeSub = false;

                            if (isSamePath) {
                              if (hasSearch) {
                                activeSub = Object.entries(sub.search!).every(([k, v]) => searchObj?.[k] === v);
                              } else {
                                activeSub = !item.subLinks?.some(other => other !== sub && other.url === sub.url && other.search && Object.entries(other.search).every(([k, v]) => searchObj?.[k] === v));
                              }
                            }
                            const SubIcon = sub.icon;
                            return (
                              <div key={sub.title + idx}>
                                <Link
                                  to={sub.url}
                                  search={sub.search}
                                  className={cn(
                                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors w-full min-w-0",
                                    activeSub
                                      ? "bg-primary text-primary-foreground font-semibold shadow-sm text-white"
                                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/40 font-medium"
                                  )}
                                >
                                  {SubIcon ? (
                                    <SubIcon strokeWidth={1.5} size={15} color="currentColor" className={cn("shrink-0", activeSub ? "text-white" : "text-sidebar-foreground/70")} />
                                  ) : (
                                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", activeSub ? "bg-white" : "bg-sidebar-foreground/40")} />
                                  )}
                                  <span className="truncate flex-1 text-left">{sub.title}</span>
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Subelementos anidados con sus propios íconos */}
                      {item.childrenItems && item.childrenItems.length > 0 && (
                        <SidebarMenu className="space-y-0.5 border-l border-sidebar-border/30 ml-4 pl-1">
                          {item.childrenItems.map((child) => renderItem(child, level + 1))}
                        </SidebarMenu>
                      )}
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.id} className={plClass}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title} className="py-1.5 px-2.5 h-auto cursor-pointer rounded-lg hover:bg-sidebar-accent/40">
                  <Link to={item.url} className="flex items-center gap-2.5 w-full min-w-0">
                    <Icon strokeWidth={1.5} size={17} color="currentColor" className={cn("shrink-0", active ? "text-white" : "text-sidebar-foreground/80")} />
                    <span className={cn("flex-1 text-left text-[13px] truncate leading-tight", active ? "font-semibold text-white" : "font-medium text-sidebar-foreground/90")}>
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          };

          const roleKey = role === "coach" ? "coach" : role;
          const rolePerms = permissions[roleKey] || INITIAL_PERMISSIONS[roleKey as keyof typeof INITIAL_PERMISSIONS] || {};
          const isItemAllowed = (item: SidebarItem): boolean => {
            if (roleKey === "admin") return true;
            if (rolePerms[item.id] === false) return false;
            if (rolePerms[item.id] === true) return true;
            if (item.childrenItems && item.childrenItems.some(c => isItemAllowed(c))) return true;
            return true;
          };

          const visibleItems = section.items.filter(item => isItemAllowed(item));

          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={section.header || `sec-${sIdx}`} className="py-1">
              {!collapsed && section.header && (
                <div className="px-3 pt-3 pb-1.5 text-[12px] font-medium uppercase tracking-wider text-sidebar-foreground/50 select-none">
                  {section.header}
                </div>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => renderItem(item, 0))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {/* Bloque Independiente final: Muro del Club */}
        {(() => {
          const roleKey = role === "coach" ? "coach" : role;
          const rolePerms = permissions[roleKey] || INITIAL_PERMISSIONS[roleKey as keyof typeof INITIAL_PERMISSIONS] || {};
          if (rolePerms["muro"] === false && roleKey !== "admin") return null;

          return (
            <SidebarGroup className="py-2 pt-3 border-t border-sidebar-border/30 mt-2">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/muro")} tooltip="Muro del Club" className="py-2 h-auto cursor-pointer">
                      <Link to="/muro" className="flex items-center gap-2.5 w-full min-w-0">
                        <Megaphone strokeWidth={1.5} size={18} color="currentColor" className="shrink-0" />
                        <span className="flex-1 text-left text-xs font-semibold truncate text-sidebar-foreground">
                          Muro del Club
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })()}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 pt-2">
        {!collapsed && (
          <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3 text-xs text-sidebar-foreground/80">
            <p className="font-semibold text-sidebar-foreground">Plan Élite</p>
            <p className="mt-1 opacity-70">
              {totalSedesCount} {totalSedesCount === 1 ? "sede" : "sedes"} · {totalJugadoresCount} {totalJugadoresCount === 1 ? "jugador" : "jugadores"}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

// suppress unused icon warnings
export const _reserved = { Users, Building2, UserRound, ShieldHalf, CalendarDays, ScanLine, MessageSquare, Command, Stethoscope, Laptop, Presentation, Trophy, Sparkles, Settings, Megaphone };
