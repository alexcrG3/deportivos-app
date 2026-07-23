import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/use-role";
import { equipos as staticEquipos } from "@/lib/mock-data";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard, Users, Building2, Wallet, Receipt, UserRound, Settings, Trophy,
  Dribbble, Layers, ShieldHalf, Megaphone, CalendarDays, ClipboardCheck, CalendarRange,
  MapPinned, BarChart3, Activity, FileText, Banknote, Workflow, MessageSquare, Bell, ScrollText,
  ScanLine, Target, UserPlus, ClipboardList, Sparkles, Brain, AlertTriangle, Lightbulb, TrendingUp, Bot,
  Dumbbell, BookOpen, LayoutTemplate, Swords, HeartPulse, Flag, NotebookPen, Star, Command,
  Medal, ListOrdered, Gauge, Stethoscope, Timer, Flame, ChevronRight, Filter, GitBranch,
  MessageCircle, Mail, HandCoins, AlertOctagon, GraduationCap, ShieldCheck, KeyRound, Sliders, Plug, Package, ShoppingBag, LifeBuoy,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
  SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type SubItem = { title: string; url: string; search?: Record<string, any> };
type Module = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  items?: SubItem[];
};

const ADMIN_MODULES: Module[] = [
  { id: "saas-admin", title: "Centro de Mando", icon: Building2, url: "/saas-admin" },
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
  {
    id: "operacion_deportiva",
    title: "Operación Deportiva",
    icon: Building2,
    url: "/operacion",
    items: [
      { title: "Jugadores", url: "/jugadores" },
      { title: "Convocatorias", url: "/convocatorias" },
      { title: "Pasar Asistencia", url: "/asistencia" },
      { title: "Horarios y Calendario", url: "/horarios" },
      { title: "Categorías", url: "/categorias" },
      { title: "Disciplinas", url: "/disciplinas" },
      { title: "Sedes e Instalaciones", url: "/sedes" },
    ],
  },

  {
    id: "crm_clientes",
    title: "Gestión de Clientes",
    icon: Users,
    url: "/crm",
    items: [
      { title: "Check-in QR", url: "/checkin" },
      { title: "Leads y Prospectos", url: "/leads" },
      { title: "Pruebas Deportivas", url: "/pruebas" },
      { title: "Campañas & Captación", url: "/campanas" },
      { title: "Alertas de Retención", url: "/retencion" },
    ],
  },
  {
    id: "control_staff",
    title: "Control de Staff",
    icon: UserRound,
    url: "/entrenadores",
    items: [
      { title: "Entrenadores", url: "/entrenadores" },
      { title: "Asistencia Staff", url: "/asistencia-staff" },
      { title: "Reportes Rendimiento", url: "/reportes" },
    ],
  },
  {
    id: "finanzas_facturacion",
    title: "Finanzas & Pagos",
    icon: Wallet,
    url: "/finanzas",
    items: [
      { title: "Mensualidades", url: "/pagos" },
      { title: "Nómina de Entrenadores", url: "/finanzas", search: { tab: "nomina" } },
      { title: "Registro de Egresos", url: "/egresos" },
      { title: "Balance Financiero", url: "/balance" },
      { title: "Facturación CR", url: "/facturacion" },
      { title: "Caja y Movimientos", url: "/caja" },
    ],
  },
  {
    id: "area_tecnica_auditoria",
    title: "Área Técnica",
    icon: ShieldHalf,
    url: "/coach",
    items: [
      { title: "Coach OS", url: "/coach" },
      { title: "Planificación Táctica", url: "/tactica/planificacion" },
      { title: "Centro Táctico", url: "/tactica" },
      { title: "Competiciones", url: "/competiciones" },
      { title: "Alto Rendimiento", url: "/rendimiento" },
      { title: "  ├─ Tests Físicos", url: "/rendimiento/tests" },
      { title: "  ├─ Wellness", url: "/rendimiento/wellness" },
      { title: "  ├─ Control de Cargas", url: "/rendimiento/cargas" },
      { title: "  └─ Sports Science", url: "/rendimiento/sports-science" },
    ],
  },
  {
    id: "logistica_indumentaria",
    title: "Logística & Indumentaria",
    icon: Package,
    url: "/inventario",
    items: [
      { title: "Control de Inventario", url: "/inventario" },
      { title: "Tienda de Uniformes", url: "/tienda" },
    ],
  },
  {
    id: "area_medica_fisioterapia",
    title: "Área Médica & Fisioterapia",
    icon: Stethoscope,
    url: "/medico",
    items: [
      { title: "Directorio Médico", url: "/medico" },
      { title: "Citas Fisioterapia", url: "/medico/citas" },
    ],
  },
  {
    id: "ia_automatizacion",
    title: "IA & Automatización",
    icon: Sparkles,
    url: "/ia",
  },
  {
    id: "muro_club",
    title: "Muro del Club",
    icon: Megaphone,
    url: "/muro",
  },
  {
    id: "soporte_tickets",
    title: "Soporte & Sugerencias",
    icon: LifeBuoy,
    url: "/soporte",
  },
  {
    id: "configuracion_general",
    title: "Configuración General",
    icon: Settings,
    url: "/configuracion",
  },
];

const COACH_MODULES: Module[] = [
  {
    id: "coach", title: "Inicio Coach OS", icon: Command, url: "/coach",
    items: [
      { title: "Mis Equipos", url: "/equipos", items: [] } as any,
      { title: "Entrenamientos", url: "/entrenamientos" },
      { title: "Convocatorias", url: "/convocatorias" },
      { title: "Objetivos", url: "/objetivos" },
      { title: "Diario del entrenador", url: "/diario" },
      { title: "Biblioteca", url: "/biblioteca" },
    ]
  },
  { id: "calendario", title: "Calendario", icon: CalendarDays, url: "/calendario" },
  {
    id: "tactica", title: "Centro Táctico", icon: ShieldHalf, url: "/tactica",
    items: [
      { title: "Pizarra", url: "/tactica/pizarra" },
      { title: "Formaciones", url: "/tactica/formaciones" },
      { title: "Jugadas", url: "/tactica/jugadas" },
      { title: "Estrategias", url: "/tactica/estrategias" },
      { title: "Rivales", url: "/tactica/rivales" },
      { title: "Análisis IA", url: "/tactica/analisis-ia" },
      { title: "Simulaciones", url: "/tactica/simulaciones" },
      { title: "Disponibilidad", url: "/tactica/matriz" },
      { title: "Biblioteca", url: "/tactica/biblioteca" },
      { title: "Planificación", url: "/tactica/planificacion" },
      { title: "Videoanálisis", url: "/tactica/video" },
      { title: "Postpartido", url: "/tactica/postpartido" },
    ]
  },
  {
    id: "competiciones", title: "Competiciones", icon: Trophy, url: "/competiciones",
    items: [
      { title: "Temporadas", url: "/temporadas" },
      { title: "Partidos", url: "/partidos" },
    ]
  },
  {
    id: "rendimiento_coach", title: "Alto Rendimiento", icon: Activity, url: "/rendimiento",
    items: [
      { title: "Dashboard", url: "/rendimiento" },
      { title: "Planificación", url: "/rendimiento/planificacion" },
      { title: "Control de Cargas", url: "/rendimiento/cargas" },
      { title: "Wellness", url: "/rendimiento/wellness" },
      { title: "GPS & Wearables", url: "/rendimiento/gps" },
      { title: "Tests Físicos", url: "/rendimiento/tests" },
      { title: "Lesiones & Rehab", url: "/rendimiento/lesiones" },
      { title: "Expedientes Médicos", url: "/medico" },
      { title: "Citas Fisioterapia", url: "/medico/citas" },
      { title: "Sports Science", url: "/rendimiento/sports-science" },
    ],
  },
  {
    id: "area_medica_coach",
    title: "Área Médica & Fisioterapia",
    icon: Stethoscope,
    url: "/medico",
    items: [
      { title: "Directorio Médico", url: "/medico" },
      { title: "Citas Fisioterapia", url: "/medico/citas" },
    ],
  },
  { id: "muro", title: "Muro del Club", icon: Megaphone, url: "/muro" },
  { id: "coach_tienda", title: "Tienda de Uniformes", icon: ShoppingBag, url: "/tienda" },
  { id: "ia_coach", title: "IA & Automatización", icon: Sparkles, url: "/ia" },
  { id: "mensajes", title: "Mensajes", icon: MessageSquare, url: "/notificaciones" },
  { id: "config_coach", title: "Configuración", icon: Settings, url: "/configuracion" }
];
const PADRES_MODULES: Module[] = [
  { id: "padres_inicio", title: "Inicio", icon: LayoutDashboard, url: "/dashboard" },
  { id: "padres_muro", title: "Muro del Club", icon: Megaphone, url: "/muro" },
  { id: "padres_hijo", title: "Mi Hijo (Player OS)", icon: UserRound, url: "/jugadores/j1" },
  { id: "padres_carnet", title: "Carnet Digital Hijos", icon: ScanLine, url: "/encargados" },
  { id: "padres_pagos", title: "Pagos y Mensualidad", icon: Wallet, url: "/pagos" },
  { id: "padres_tienda", title: "Tienda de Uniformes", icon: ShoppingBag, url: "/tienda" },
  { id: "padres_mensajes", title: "Mensajes", icon: MessageSquare, url: "/notificaciones" },
  { id: "padres_config", title: "Configuración", icon: Settings, url: "/configuracion" }
];

export function AppSidebar() {
  const { role, coachName, selectedCoachId, selectedCoachName, setSelectedCoach } = useRole();

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

const FISIO_MODULES: Module[] = [
  {
    id: "medico", title: "Área Médica & Fisioterapia", icon: Stethoscope, url: "/medico",
    items: [
      { title: "Portal de Fisioterapia", url: "/medico" },
      { title: "Agenda de Citas", url: "/medico/citas" },
      { title: "Lesiones & Retorno", url: "/rendimiento/lesiones" },
      { title: "Control de Wellness", url: "/rendimiento/wellness" },
    ]
  },
  { id: "jugadores", title: "Expedientes de Jugadores", icon: Users, url: "/jugadores" },
  { id: "muro", title: "Muro de la Academia", icon: MessageSquare, url: "/muro" },
];

  const modules = useMemo(() => {
    let baseModules: Module[] = [];
    if (role === "coach") {
      baseModules = COACH_MODULES.map(m => {
        if (m.id === "coach") {
          return {
            ...m,
            items: m.items?.map(sub =>
              sub.title === "Mis Equipos" ? { ...sub, items: coachTeamItems } : sub
            )
          };
        }
        return m;
      });
    } else if (role === "fisioterapeuta") {
      baseModules = FISIO_MODULES;
    } else {
      baseModules = role === "admin" ? ADMIN_MODULES : PADRES_MODULES;
    }

    // Filter out "Centro de Mando" if not superadmin
    if (!isSuperAdmin) {
      baseModules = baseModules.filter(m => m.id !== "saas-admin");
    }

    return baseModules;
  }, [role, coachTeamItems, isSuperAdmin]);

  // Load coaches from Supabase for admin coach selector
  const loadCoaches = async () => {
    if (role !== "admin" || coachesList.length > 0) return;
    setLoadingCoaches(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const { data } = await supabase
      .from("entrenadores")
      .select("id, nombre, identificacion")
      .eq("organizacion_id", orgId);
    if (data) setCoachesList(data);
    setLoadingCoaches(false);
  };

  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => pathname === p || (p !== "/" && pathname.startsWith(p + "/"));
  const groupActive = (m: Module) =>
    (m.url && m.url !== "#" && isActive(m.url)) ||
    (m.items?.some((s) => s.url && s.url !== "#" && isActive(s.url)) ?? false);

  const activeModule = useMemo(() => {
    return modules.find((m) => groupActive(m));
  }, [modules, pathname]);

  const [openId, setOpenId] = useState<string | null>(
    () => activeModule?.id ?? null
  );

  useEffect(() => {
    if (activeModule) {
      setOpenId(activeModule.id);
    }
  }, [pathname, activeModule]);

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

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgEmail) return;
    const newOrg = RendimientoStore.addOrganizacion({
      nombre: newOrgName,
      correo: newOrgEmail,
      pais: newOrgCountry
    });
    toast.success(`Club "${newOrgName}" registrado con éxito`);
    setOpenNewOrg(false);
    RendimientoStore.setActiveOrganizacionId(newOrg.id);
    window.location.reload();
  };

  return (
    <Sidebar collapsible="icon" key={`${role}-${coachName}-${activeOrgId}`}>
      <SidebarHeader>
        <div className={cn("flex items-center gap-3 px-2 py-3 overflow-hidden transition-all duration-200", collapsed && "justify-center px-0")}>
          <div className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant overflow-hidden border border-white/10 transition-all duration-200",
            collapsed ? "h-9 w-9" : "h-14 w-14"
          )}>
            {activeOrg && activeOrg.logo ? (
              <img src={activeOrg.logo} className="h-full w-full object-cover animate-fade-in" alt="Logo de la Academia" />
            ) : (
              <Trophy className={collapsed ? "h-5 w-5" : "h-7 w-7"} />
            )}
          </div>
          {!collapsed && mounted && (
            <div className="flex flex-col leading-tight text-sidebar-foreground w-full max-w-[170px]">
              <span className="text-[10px] opacity-60 font-bold uppercase tracking-wider mb-1">Academia Activa</span>
              {isSuperAdmin ? (
                <select
                  value={activeOrgId}
                  onChange={(e) => handleOrgChange(e.target.value)}
                  className="w-full text-xs font-semibold bg-sidebar-accent/60 border border-sidebar-border/80 rounded px-1.5 py-0.5 text-sidebar-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id} className="text-slate-900 bg-background dark:text-white dark:bg-slate-900">
                      {o.nombre}
                    </option>
                  ))}
                  <option value="__new__" className="text-slate-900 bg-background dark:text-white dark:bg-slate-900">
                    + Registrar Nuevo Club...
                  </option>
                </select>
              ) : (
                <span className="text-sm font-extrabold text-white tracking-tight leading-snug break-words">
                  {activeOrg?.nombre || "Cargando..."}
                </span>
              )}
            </div>
          )}
          {!collapsed && !mounted && (
            <div className="flex flex-col leading-tight text-sidebar-foreground">
              <span className="text-[10px] opacity-60 font-bold uppercase tracking-wider mb-0.5">Academia Activa</span>
              <span className="text-xs font-semibold text-muted-foreground animate-pulse">Cargando...</span>
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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((m) => {
                const active = groupActive(m);
                if (!m.items) {
                  return (
                    <SidebarMenuItem key={m.id}>
                      <SidebarMenuButton asChild isActive={isActive(m.url)} tooltip={m.title}>
                        <Link to={m.url} className="flex items-center gap-3">
                          <m.icon className="h-4 w-4 shrink-0" />
                          <span>{m.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                const isOpen = openId === m.id;
                const targetUrl = m.items?.[0]?.url || m.url;
                return (
                  <Collapsible
                    key={m.id}
                    open={isOpen && !collapsed}
                    onOpenChange={(v) => setOpenId(v ? m.id : null)}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton asChild isActive={active} tooltip={m.title} className="py-2.5 h-auto cursor-pointer">
                          <Link
                            to={targetUrl}
                            className="flex items-center gap-3 w-full min-w-0"
                            onClick={() => {
                              setOpenId(isOpen ? null : m.id);
                            }}
                          >
                            <m.icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 text-left text-xs leading-tight truncate font-semibold">{m.title}</span>
                            <ChevronRight className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
                          </Link>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {/* Admin Coach Selector — only shown when admin opens Coach OS */}
                          {role === "admin" && m.id === "coach" && !collapsed && (
                            <SidebarMenuSubItem>
                              <div className="px-2 py-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 mb-1.5">
                                  Ver como entrenador
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
                                  className="w-full text-xs bg-sidebar-accent/60 border border-sidebar-border/80 rounded px-2 py-1.5 text-sidebar-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
                                >
                                  <option value="" className="text-slate-900 bg-background dark:text-white dark:bg-slate-900">
                                    {loadingCoaches ? "Cargando..." : "— Todos —"}
                                  </option>
                                  {coachesList.map((c: any) => (
                                    <option key={c.id} value={c.id} className="text-slate-900 bg-background dark:text-white dark:bg-slate-900">
                                      {c.nombre}
                                    </option>
                                  ))}
                                </select>
                                {selectedCoachId && selectedCoachName && (
                                  <p className="text-[10px] text-primary mt-1.5 font-medium truncate">
                                    📋 {selectedCoachName}
                                  </p>
                                )}
                              </div>
                            </SidebarMenuSubItem>
                          )}
                          {m.items.map((s: any, i) => {
                            if (s.items && s.items.length > 0) {
                              return (
                                <Collapsible key={`${s.url}-${i}`} className="w-full">
                                  <SidebarMenuSubItem>
                                    <CollapsibleTrigger asChild>
                                      <SidebarMenuSubButton className="flex items-center justify-between w-full hover:bg-sidebar-accent/50 rounded-md py-1 px-2 text-sidebar-foreground/80 hover:text-sidebar-foreground">
                                        <span>{s.title}</span>
                                        <ChevronRight className="h-3 w-3 transition-transform duration-200" />
                                      </SidebarMenuSubButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <SidebarMenuSub className="pl-4 border-l border-sidebar-border/50 mt-1">
                                        {s.items.map((sub: any, si: number) => (
                                          <SidebarMenuSubItem key={`${sub.url}-${si}`}>
                                            <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                                              <Link to={sub.url} search={sub.search}>{sub.title}</Link>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        ))}
                                      </SidebarMenuSub>
                                    </CollapsibleContent>
                                  </SidebarMenuSubItem>
                                </Collapsible>
                              );
                            }
                            return (
                              <SidebarMenuSubItem key={`${s.url}-${i}`}>
                                <SidebarMenuSubButton asChild isActive={isActive(s.url)} className="py-1.5 h-auto leading-tight text-xs">
                                  <Link to={s.url} search={s.search} className="truncate">{s.title}</Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
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

// suppress unused icon warnings for future use
export const _reserved = { Users, Building2, Receipt, UserRound, Dribbble, Layers, ShieldHalf, Megaphone, CalendarDays, ClipboardCheck, CalendarRange, MapPinned, BarChart3, FileText, Banknote, MessageSquare, Bell, ScrollText, ScanLine, Target, UserPlus, ClipboardList, AlertTriangle, Lightbulb, TrendingUp, Bot, Dumbbell, BookOpen, LayoutTemplate, Swords, HeartPulse, Flag, NotebookPen, Star, Medal, ListOrdered, Gauge, Stethoscope, Timer, Flame, Filter, GitBranch, MessageCircle, Mail, HandCoins, AlertOctagon, GraduationCap, ShieldCheck, KeyRound, Sliders, Plug };
