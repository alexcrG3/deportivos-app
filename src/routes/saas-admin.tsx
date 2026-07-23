import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, Plus, Search, ShieldCheck, Users, 
  RotateCw, Ban, ChevronRight, Activity, LogOut,
  BookOpen, Globe, Heart, Award, Sparkles, Trophy,
  LifeBuoy, MessageSquare, Clock, CheckCircle2, AlertCircle,
  HelpCircle, Send, FileText, Filter, ShieldAlert
} from "lucide-react";
import RendimientoStore, { StoreSupportTicket } from "@/lib/rendimiento-store";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/saas-admin")({
  component: SaasAdminDashboard,
});

function SaasAdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [saasTab, setSaasTab] = useState<"directorios" | "revista" | "tickets">("directorios");
  const [orgs, setOrgs] = useState<any[]>([]);
  const [globalPosts, setGlobalPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Support Tickets Admin State
  const [tickets, setTickets] = useState<StoreSupportTicket[]>([]);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("todos");
  const [ticketOrgFilter, setTicketOrgFilter] = useState<string>("todas");
  const [ticketSearchQuery, setTicketSearchQuery] = useState<string>("");
  const [selectedTicketAdmin, setSelectedTicketAdmin] = useState<StoreSupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState("");
  
  // Registration modal state
  const [openCreate, setOpenCreate] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPais, setNewPais] = useState("Costa Rica");
  const [newPlan, setNewPlan] = useState("basic");

  const refreshTickets = () => {
    setTickets(RendimientoStore.getSupportTickets());
  };

  useEffect(() => {
    setMounted(true);
    setOrgs(RendimientoStore.getOrganizaciones());
    refreshTickets();
    // Always stamp the superadmin session so logout can detect it reliably
    localStorage.setItem("auth_email", "alex@mail.com");
    localStorage.setItem("is_superadmin", "true");
    
    // Fetch global posts across all academies
    const fetchGlobalPosts = async () => {
      const { data, error } = await supabase
        .from("muro_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setGlobalPosts(data);
      }
    };
    fetchGlobalPosts();
  }, []);

  // Get total dynamic players and coaches across all local cache
  const allPlayers = useMemo(() => {
    if (!mounted) return [];
    return RendimientoStore.get<any[]>("jugadores_dynamics", []);
  }, [mounted]);
  const allCoaches = useMemo(() => {
    if (!mounted) return [];
    return RendimientoStore.get<any[]>("entrenadores_dynamics", []);
  }, [mounted]);
  const allTeams = useMemo(() => {
    if (!mounted) return [];
    return RendimientoStore.get<any[]>("equipos_dynamics", []);
  }, [mounted]);

  // Filter organizations by search query
  const filteredOrgs = useMemo(() => {
    return orgs.filter(o => 
      o.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.pais.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orgs, searchQuery]);

  // Statistics
  const totalOrgs = orgs.length;
  const activeOrgs = orgs.filter(o => o.estado !== "suspendido").length;
  const totalMembers = allPlayers.length;
  const totalTeams = allTeams.length;

  // Support Tickets Statistics & Logic
  const pendingTicketsCount = useMemo(() => {
    return tickets.filter(t => t.estado === "abierto" || t.estado === "en_progreso").length;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = ticketStatusFilter === "todos" ? true : t.estado === ticketStatusFilter;
      const matchOrg = ticketOrgFilter === "todas" ? true : t.organizacion_id === ticketOrgFilter;
      const matchSearch = 
        t.titulo.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
        t.descripcion.toLowerCase().includes(ticketSearchQuery.toLowerCase()) ||
        (t.organizacion_nombre && t.organizacion_nombre.toLowerCase().includes(ticketSearchQuery.toLowerCase())) ||
        (t.creadorNombre && t.creadorNombre.toLowerCase().includes(ticketSearchQuery.toLowerCase()));
      return matchStatus && matchOrg && matchSearch;
    });
  }, [tickets, ticketStatusFilter, ticketOrgFilter, ticketSearchQuery]);

  const handleUpdateTicketStatus = (ticketId: string, newStatus: StoreSupportTicket["estado"]) => {
    RendimientoStore.updateSupportTicketStatus(ticketId, newStatus);
    toast.success("Estado del ticket actualizado correctamente");
    refreshTickets();
    if (selectedTicketAdmin && selectedTicketAdmin.id === ticketId) {
      setSelectedTicketAdmin(prev => prev ? { ...prev, estado: newStatus } : null);
    }
  };

  const handleAdminSendReply = () => {
    if (!selectedTicketAdmin || !adminReplyText.trim()) return;
    RendimientoStore.addTicketResponse(selectedTicketAdmin.id, {
      autorNombre: "Soporte Central Athletix SaaS",
      autorEmail: "soporte@athletixos.com",
      mensaje: adminReplyText.trim(),
      esAdminSaaS: true
    });
    toast.success("Respuesta oficial enviada a la academia");
    setAdminReplyText("");
    refreshTickets();
    const updated = RendimientoStore.getSupportTickets().find(t => t.id === selectedTicketAdmin.id);
    if (updated) setSelectedTicketAdmin(updated);
  };

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "hace unos minutos";
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 30) return `hace ${diffDays}d`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const handleRefresh = () => {
    setOrgs(RendimientoStore.getOrganizaciones());
    toast.success("Listado actualizado");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 flex flex-col items-center justify-center">
        <div className="text-center space-y-2">
          <Building2 className="h-8 w-8 text-primary animate-pulse mx-auto" />
          <p className="text-xs text-muted-foreground font-semibold">Cargando Centro de Mando...</p>
        </div>
      </div>
    );
  }

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre || !newEmail) return;

    const newOrg = RendimientoStore.addOrganizacion({
      nombre: newNombre,
      correo: newEmail,
      pais: newPais,
      plan_suscripcion: newPlan,
      estado: "activo"
    });

    setOrgs(RendimientoStore.getOrganizaciones());
    setNewNombre("");
    setNewEmail("");
    setOpenCreate(false);
    toast.success(`Academia "${newOrg.nombre}" creada exitosamente`);
  };

  const handleToggleStatus = (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const list = RendimientoStore.getOrganizaciones();
    const updated = list.map(o => {
      if (o.id === id) {
        return { ...o, estado: currentStatus === "suspendido" ? "activo" : "suspendido" };
      }
      return o;
    });
    RendimientoStore.set("organizaciones_dynamics", updated);
    setOrgs(updated);
    toast.success(currentStatus === "suspendido" ? "Academia activada" : "Academia suspendida");
  };

  const handleChangePlan = (id: string, plan: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const list = RendimientoStore.getOrganizaciones();
    const updated = list.map(o => {
      if (o.id === id) {
        return { ...o, plan_suscripcion: e.target.value };
      }
      return o;
    });
    RendimientoStore.set("organizaciones_dynamics", updated);
    setOrgs(updated);
    toast.success(`Plan actualizado a ${e.target.value.toUpperCase()}`);
  };

  const handleImpersonate = (id: string, nombre: string) => {
    RendimientoStore.setActiveOrganizacionId(id);
    localStorage.setItem("impersonated_from_saas", "true");
    toast.success(`Accediendo al entorno de: ${nombre}`);
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 300);
  };

  const handleLogout = () => {
    toast.success("Sesión cerrada");
    localStorage.removeItem("is_superadmin");
    localStorage.removeItem("impersonated_from_saas");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 flex flex-col">
      {/* Top Header Navigation */}
      <header className="border-b bg-background/90 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-tight text-foreground">Athletix OS</span>
          <span className="text-muted-foreground/60 text-xs font-medium">— Centro de Mando</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout} 
          className="text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <LogOut className="h-3.5 w-3.5" /> Cerrar Sesión
        </Button>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Title area */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-elegant">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">CENTRO DE MANDO</h1>
              <p className="text-xs text-muted-foreground font-medium">Gestión global de academias • Athletix SaaS</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9 px-3 gap-1.5 text-xs font-semibold">
              <RotateCw className="h-3.5 w-3.5" /> Actualizar
            </Button>
            <Button onClick={() => setOpenCreate(true)} className="h-9 px-4 bg-gradient-primary shadow-elegant gap-1.5 text-xs font-semibold">
              <Plus className="h-4 w-4" /> Nueva Academia
            </Button>
          </div>
        </div>

        {/* KPI Cards section */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-elegant border/80 relative overflow-hidden bg-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Academias</span>
                <div className="text-3xl font-extrabold">{totalOrgs}</div>
                <p className="text-[10px] text-muted-foreground">Organizaciones conectadas</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Building2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border/80 relative overflow-hidden bg-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Activas</span>
                <div className="text-3xl font-extrabold">{activeOrgs}</div>
                <p className="text-[10px] text-muted-foreground">Estado operativo</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border/80 relative overflow-hidden bg-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jugadores Totales</span>
                <div className="text-3xl font-extrabold">{totalMembers}</div>
                <p className="text-[10px] text-muted-foreground">Miembros registrados</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border/80 relative overflow-hidden bg-card">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Equipos Registrados</span>
                <div className="text-3xl font-extrabold">{totalTeams}</div>
                <p className="text-[10px] text-muted-foreground">Equipos en la red</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Activity className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 border-b border-border pb-1 overflow-x-auto">
          <button
            onClick={() => setSaasTab("directorios")}
            className={`pb-2.5 font-bold text-sm transition relative whitespace-nowrap ${
              saasTab === "directorios" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🏢 Directorio de Academias
          </button>
          <button
            onClick={() => setSaasTab("revista")}
            className={`pb-2.5 font-bold text-sm transition relative flex items-center gap-1.5 whitespace-nowrap ${
              saasTab === "revista" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" /> 📖 Revista Deportiva Global
          </button>
          <button
            onClick={() => setSaasTab("tickets")}
            className={`pb-2.5 font-bold text-sm transition relative flex items-center gap-1.5 whitespace-nowrap ${
              saasTab === "tickets" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LifeBuoy className="h-4 w-4 text-amber-500" /> 🎟️ Tickets & Soporte
            {pendingTicketsCount > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] py-0 px-1.5 ml-1 animate-pulse">
                {pendingTicketsCount}
              </Badge>
            )}
          </button>
        </div>

        {saasTab === "directorios" && (
          <Card className="shadow-elegant border/80 bg-card overflow-hidden">
            <div className="p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Directorio de Academias</h2>
                <p className="text-xs text-muted-foreground">Consulta todas las academias activas y accede como administrador.</p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, ubicación, correo..." 
                  className="pl-9 h-9 text-xs" 
                />
              </div>
            </div>
            <CardContent className="p-0 divide-y divide-border/60">
              {filteredOrgs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No se encontraron academias registradas.</div>
              ) : (
                filteredOrgs.map((org) => {
                  const orgTeamsCount = allTeams.filter(t => t.organizacion_id === org.id).length;
                  const orgPlayersCount = allPlayers.filter(p => p.organizacion_id === org.id).length;
                  const initials = org.nombre.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
                  const isDefaultOrg = org.id === "00000000-0000-0000-0000-000000000000";

                  return (
                    <div 
                      key={org.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-muted/40 transition cursor-pointer"
                      onClick={() => handleImpersonate(org.id, org.nombre)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground font-bold text-sm shadow-elegant overflow-hidden">
                          {org.logo ? (
                            <img src={org.logo} className="h-full w-full object-cover" alt="Logo de la Academia" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {org.nombre}
                            {isDefaultOrg && <Badge variant="outline" className="text-[9px] py-0 px-1 bg-primary/10 border-primary/20 text-primary">Preinstalado</Badge>}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="font-bold uppercase tracking-wider text-xs text-primary/80">
                              {org.plan_suscripcion === "premium" ? "Plan Premium" : org.plan_suscripcion === "enterprise" ? "Plan Enterprise" : "Plan Básico"}
                            </span>
                            <span>·</span>
                            <span>{org.correo}</span>
                            <span>·</span>
                            <span>{org.pais}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3.5" onClick={e => e.stopPropagation()}>
                        {/* Metrics columns */}
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-semibold">
                          <div className="flex flex-col items-center">
                            <span className="text-foreground font-bold text-xs">{isDefaultOrg ? 12 : orgTeamsCount}</span>
                            <span>EQUIPOS</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-foreground font-bold text-xs">{isDefaultOrg ? 0 : orgPlayersCount}</span>
                            <span>JUGADORES</span>
                          </div>
                        </div>

                        {/* Active/Suspended status badge */}
                        {org.estado === "suspendido" ? (
                          <Badge variant="destructive" className="h-7 text-[10px] font-semibold gap-1 px-2.5">
                            • SUSPENDIDO
                          </Badge>
                        ) : (
                          <Badge className="h-7 text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1 px-2.5">
                            • ACTIVO
                          </Badge>
                        )}

                        {/* Impersonate button */}
                        <Button 
                          size="sm" 
                          onClick={() => handleImpersonate(org.id, org.nombre)}
                          className="h-8 px-3 text-xs bg-gradient-primary shadow-elegant font-semibold gap-1"
                        >
                          Ingresar <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        )}

        {saasTab === "revista" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Editorial Header Cover banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 p-8 md:p-12 shadow-elegant">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
              
              <div className="max-w-2xl space-y-4 relative z-10">
                <Badge className="bg-primary/20 hover:bg-primary/20 text-primary-foreground border-primary/35 text-[10px] tracking-widest uppercase font-black px-3 py-1">
                  ✨ Edición de Red Global — Julio 2026
                </Badge>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  REVISTA DEPORTIVA ATHLETIX
                </h1>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">
                  El escaparate definitivo de todas las academias de nuestra red. Explora crónicas, entrevistas de IA, tácticas ganadoras y el rendimiento estelar de las futuras estrellas del deporte global.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> {orgs.length} Academias Activas</span>
                  <span>•</span>
                  <span>{globalPosts.length} Publicaciones del Muro</span>
                </div>
              </div>
            </div>

            {/* Curated Magazine Layout */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Column: Chronicles Feed from all walls */}
              <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-base font-extrabold flex items-center gap-2">
                    📰 Crónicas e Historias de Muros del Club
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground uppercase border-border/85">
                    Últimas Actualizaciones
                  </Badge>
                </div>

                {globalPosts.length === 0 ? (
                  <Card className="p-8 text-center bg-muted/20 border-dashed">
                    <p className="text-xs text-muted-foreground font-semibold">No hay publicaciones de muros aún para compilar en la revista.</p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {globalPosts.map((post: any) => {
                      const postOrg = orgs.find(o => o.id === post.organizacion_id);
                      return (
                        <Card key={post.id} className="shadow-card border border-border/60 hover:border-primary/20 transition overflow-hidden bg-card">
                          <div className="p-5 space-y-4">
                            {/* Academy and Post Header */}
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-primary text-white font-black text-xs flex items-center justify-center shadow-elegant overflow-hidden">
                                  {postOrg?.logo ? <img src={postOrg.logo} className="h-full w-full object-cover" /> : postOrg?.nombre?.[0]?.toUpperCase() || "A"}
                                </div>
                                <div>
                                  <div className="text-xs font-black text-foreground uppercase tracking-wide flex items-center gap-1.5">
                                    {postOrg?.nombre || "Academia Asociada"}
                                    <Badge variant="outline" className="text-[8px] bg-primary/5 border-primary/25 text-primary tracking-wider uppercase px-1.5 py-0.25 font-bold">
                                      {post.ubicacion || postOrg?.pais || "Red"}
                                    </Badge>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                    Publicado por <span className="font-bold">{post.autor}</span> • {post.tiempo}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-[9px] uppercase font-bold text-muted-foreground/80 border-none bg-slate-100 dark:bg-slate-900 px-2 py-0.5">
                                {post.tipo || "Red"}
                              </Badge>
                            </div>

                            {/* Content */}
                            <p className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap font-medium">
                              {post.contenido}
                            </p>

                            {/* Post Asset Image */}
                            {post.imagen && (
                              <div className="rounded-2xl overflow-hidden border border-border/40 max-h-64 flex justify-center bg-slate-50 dark:bg-slate-950/20">
                                <img src={post.imagen} alt="Asset" className="w-full object-cover" />
                              </div>
                            )}

                            {/* Engagement stats */}
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-3 font-semibold">
                              <span className="flex items-center gap-1.5 hover:text-red-500 transition cursor-pointer">
                                ❤️ <span className="text-foreground">{post.likes}</span> Reacciones
                              </span>
                              <span className="flex items-center gap-1">
                                💬 <span className="text-foreground">{post.comentarios?.length || 0}</span> Respuestas
                              </span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Red Spotlights, Highlights & Stats */}
              <div className="space-y-6">
                <div className="border-b pb-2">
                  <h2 className="text-base font-extrabold flex items-center gap-2">
                    🏆 Destacados de la Red
                  </h2>
                </div>

                {/* Cover Spotlight Player Card */}
                <Card className="shadow-elegant bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-purple-500/20 p-5 rounded-2xl space-y-4 bg-card">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-amber-500 text-white border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 flex items-center gap-0.5">
                      <Trophy className="h-2.5 w-2.5" /> Fichaje de la Semana
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-bold">JULIO 2026</span>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="h-16 w-16 mx-auto rounded-full border-2 border-purple-500/30 overflow-hidden shadow-elegant">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Santiago Torres Lozada</h4>
                      <p className="text-[10px] text-primary font-extrabold uppercase">Academia Deportiva Élite • Sub-12</p>
                    </div>
                  </div>

                  <div className="border-t pt-3 text-[11px] text-muted-foreground leading-relaxed font-medium space-y-2">
                    <p className="italic">"Considerado la revelación defensiva bajo los tres palos del club, con atajadas heroicas durante las últimas jornadas regionales."</p>
                    <div className="grid grid-cols-3 text-center border-t border-border/40 pt-2 text-[10px]">
                      <div>
                        <p className="text-foreground font-black text-xs">84%</p>
                        <p>Atajadas</p>
                      </div>
                      <div>
                        <p className="text-foreground font-black text-xs">12</p>
                        <p>Partidos</p>
                      </div>
                      <div>
                        <p className="text-foreground font-black text-xs">9</p>
                        <p>Goles Concedidos</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Academies Rankings */}
                <Card className="shadow-elegant p-4 space-y-3 bg-card">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    🌟 Academias Más Populares
                  </h3>
                  <div className="space-y-3 pt-1">
                    {orgs.map((org, index) => {
                      const initials = org.nombre.split(" ").slice(0, 2).map((w: any) => w[0]).join("").toUpperCase();
                      return (
                        <div key={org.id} className="flex items-center justify-between gap-3 text-xs border-b border-border/40 pb-2.5 last:border-none last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-muted-foreground w-4">#{index + 1}</span>
                            <div className="h-7 w-7 rounded-lg bg-gradient-primary text-white font-bold text-[10px] flex items-center justify-center overflow-hidden shrink-0">
                              {org.logo ? <img src={org.logo} className="h-full w-full object-cover" /> : initials}
                            </div>
                            <span className="font-bold text-foreground truncate max-w-[130px]">{org.nombre}</span>
                          </div>
                          <Badge variant="outline" className="text-[9px] bg-slate-100 dark:bg-slate-900 border-none font-bold">
                            {org.pais}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
        {saasTab === "tickets" && (
          <Card className="shadow-elegant border/80 bg-card overflow-hidden">
            <div className="p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <LifeBuoy className="h-5 w-5 text-primary" /> Gestión Global de Tickets y Soporte
                </h2>
                <p className="text-xs text-muted-foreground">
                  Atiende las sugerencias, necesidades y requerimientos reportados por todas las academias.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Organization filter */}
                <select
                  value={ticketOrgFilter}
                  onChange={e => setTicketOrgFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none"
                >
                  <option value="todas">🏢 Todas las academias</option>
                  {orgs.map(o => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={ticketStatusFilter}
                  onChange={e => setTicketStatusFilter(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none"
                >
                  <option value="todos">📌 Todos los estados</option>
                  <option value="abierto">Abierto</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="cerrado">Cerrado</option>
                </select>

                {/* Search */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={ticketSearchQuery}
                    onChange={e => setTicketSearchQuery(e.target.value)}
                    placeholder="Buscar ticket..." 
                    className="pl-9 h-9 text-xs" 
                  />
                </div>
              </div>
            </div>

            <CardContent className="p-0 divide-y divide-border/60">
              {filteredTickets.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground">
                  No se encontraron tickets con los filtros seleccionados.
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const hasResponses = t.respuestas && t.respuestas.length > 0;
                  return (
                    <div 
                      key={t.id} 
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/40 transition cursor-pointer group"
                      onClick={() => setSelectedTicketAdmin(t)}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 group-hover:scale-105 transition">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-foreground truncate">{t.titulo}</span>
                            <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/20 text-primary">
                              {t.organizacion_nombre || "Academia"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {t.descripcion}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[11px] text-muted-foreground">
                              Por: <strong>{t.creadorNombre}</strong> ({t.creadorEmail})
                            </span>
                            <span>·</span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatRelativeTime(t.creadoEn)}
                            </span>
                            {hasResponses && (
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <MessageSquare className="h-3 w-3" /> {t.respuestas.length} respuestas
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Status controls */}
                      <div className="flex items-center gap-2 self-start md:self-center shrink-0" onClick={e => e.stopPropagation()}>
                        <select
                          value={t.estado}
                          onChange={e => handleUpdateTicketStatus(t.id, e.target.value as any)}
                          className={`h-8 rounded-lg text-xs font-semibold px-2.5 border cursor-pointer ${
                            t.estado === "resuelto" ? "bg-emerald-500/15 border-emerald-300 text-emerald-700 dark:text-emerald-300" :
                            t.estado === "en_progreso" ? "bg-blue-500/15 border-blue-300 text-blue-700 dark:text-blue-300" :
                            t.estado === "abierto" ? "bg-amber-500/15 border-amber-300 text-amber-700 dark:text-amber-300" :
                            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          <option value="abierto">Abierto</option>
                          <option value="en_progreso">En progreso</option>
                          <option value="resuelto">Resuelto</option>
                          <option value="cerrado">Cerrado</option>
                        </select>
                        <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => setSelectedTicketAdmin(t)}>
                          Ver Hilo <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest pt-8">
          ⚡ ATHLETIX OS — PLATAFORMA SAAS DE GESTIÓN DEPORTIVA
        </footer>
      </main>

      {/* Admin Ticket Thread & Reply Dialog */}
      {selectedTicketAdmin && (
        <Dialog open={!!selectedTicketAdmin} onOpenChange={() => setSelectedTicketAdmin(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge className="bg-primary/10 border-primary/20 text-primary">
                  {selectedTicketAdmin.organizacion_nombre}
                </Badge>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  ID: {selectedTicketAdmin.id}
                </span>
              </div>
              <DialogTitle className="text-lg font-bold leading-tight">{selectedTicketAdmin.titulo}</DialogTitle>
              <DialogDescription className="text-xs">
                Enviado por {selectedTicketAdmin.creadorNombre} ({selectedTicketAdmin.creadorEmail}) · {formatRelativeTime(selectedTicketAdmin.creadoEn)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
              {/* Ticket description card */}
              <div className="bg-muted/40 p-4 rounded-xl space-y-2 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Requerimiento Original</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Cambiar Estado:</span>
                    <select
                      value={selectedTicketAdmin.estado}
                      onChange={e => handleUpdateTicketStatus(selectedTicketAdmin.id, e.target.value as any)}
                      className="h-7 text-xs rounded border px-2 font-bold bg-background cursor-pointer"
                    >
                      <option value="abierto">Abierto</option>
                      <option value="en_progreso">En progreso</option>
                      <option value="resuelto">Resuelto</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                  {selectedTicketAdmin.descripcion}
                </p>
              </div>

              {/* Hilo de conversación */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Hilo de Respuesta ({selectedTicketAdmin.respuestas?.length || 0})
                </h4>

                {(!selectedTicketAdmin.respuestas || selectedTicketAdmin.respuestas.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg text-center">
                    Aún no hay respuestas en este ticket.
                  </p>
                ) : (
                  selectedTicketAdmin.respuestas.map((r) => (
                    <div 
                      key={r.id} 
                      className={`p-3.5 rounded-xl text-xs space-y-1.5 border ${
                        r.esAdminSaaS 
                          ? "bg-purple-500/10 border-purple-500/20 text-foreground ml-4" 
                          : "bg-muted/60 border-border text-foreground mr-4"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5 text-primary">
                          {r.esAdminSaaS && <Sparkles className="h-3.5 w-3.5 text-purple-500" />}
                          {r.autorNombre}
                          {r.esAdminSaaS && <Badge className="bg-purple-600 text-white text-[9px] py-0 px-1">SuperAdmin SaaS</Badge>}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatRelativeTime(r.fecha)}</span>
                      </div>
                      <p className="leading-relaxed text-xs">{r.mensaje}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Admin Response Box */}
            <div className="pt-3 border-t border-border space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Responder como Soporte Central SaaS</Label>
              <div className="flex gap-2">
                <Textarea
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Escribe la respuesta oficial para la academia..."
                  className="text-xs flex-1 min-h-[60px]"
                />
                <Button onClick={handleAdminSendReply} className="bg-gradient-primary gap-1 self-end shadow-elegant">
                  <Send className="h-3.5 w-3.5" /> Responder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Registration dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[420px] bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Building2 className="h-5 w-5 text-primary" /> Registrar Nueva Academia
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Crea una nueva academia aislada en la plataforma SaaS.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrg} className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Nombre de la Academia *</Label>
              <Input 
                value={newNombre} 
                onChange={e => setNewNombre(e.target.value)} 
                placeholder="Ej. Academia Real Madrid Costa Rica" 
                required 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Correo de la Administración *</Label>
              <Input 
                type="email" 
                value={newEmail} 
                onChange={e => setNewEmail(e.target.value)} 
                placeholder="Ej. contacto@realmadrid.cr" 
                required 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">País</Label>
              <Input 
                value={newPais} 
                onChange={e => setNewPais(e.target.value)} 
                placeholder="Ej. Costa Rica" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Plan de Suscripción</Label>
              <select
                value={newPlan}
                onChange={e => setNewPlan(e.target.value)}
                className="h-10 px-3 rounded-md border bg-card text-sm cursor-pointer"
              >
                <option value="basic">Básico</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-primary">Crear Entorno</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
