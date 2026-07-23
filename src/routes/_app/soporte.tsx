import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  LifeBuoy, Plus, Search, MessageSquare, Clock, CheckCircle2, 
  AlertCircle, HelpCircle, Send, FileText, Sparkles, Filter, ShieldAlert
} from "lucide-react";
import RendimientoStore, { StoreSupportTicket } from "@/lib/rendimiento-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/soporte")({
  component: SoporteAcademiaPage,
});

function SoporteAcademiaPage() {
  const [tickets, setTickets] = useState<StoreSupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [openNewTicketModal, setOpenNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<StoreSupportTicket | null>(null);

  // Form State for New Ticket
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<"sugerencia" | "necesidad" | "soporte" | "facturacion">("sugerencia");
  const [prioridad, setPrioridad] = useState<"baja" | "media" | "alta" | "urgente">("media");
  
  // Reply State
  const [newReplyMessage, setNewReplyMessage] = useState("");

  const refreshTickets = () => {
    setTickets(RendimientoStore.getSupportTicketsForCurrentOrg());
  };

  useEffect(() => {
    refreshTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = statusFilter === "todos" ? true : t.estado === statusFilter;
      const matchSearch = 
        t.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tipo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [tickets, statusFilter, searchQuery]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) {
      toast.error("Por favor completa el título y la descripción del ticket");
      return;
    }

    const authEmail = localStorage.getItem("auth_email") || "admin@academia.com";
    const user = RendimientoStore.getUsuarios().find(u => u.email.toLowerCase() === authEmail.toLowerCase());
    const creadorNombre = user ? user.nombre : "Administrador de Academia";

    RendimientoStore.addSupportTicket({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      tipo,
      prioridad,
      estado: "abierto",
      creadorNombre,
      creadorEmail: authEmail
    });

    toast.success("¡Ticket enviado a Soporte Central exitosamente!");
    setTitulo("");
    setDescripcion("");
    setTipo("sugerencia");
    setPrioridad("media");
    setOpenNewTicketModal(false);
    refreshTickets();
  };

  const handleSendReply = () => {
    if (!selectedTicket || !newReplyMessage.trim()) return;

    const authEmail = localStorage.getItem("auth_email") || "admin@academia.com";
    const user = RendimientoStore.getUsuarios().find(u => u.email.toLowerCase() === authEmail.toLowerCase());
    const autorNombre = user ? user.nombre : "Administrador de Academia";

    RendimientoStore.addTicketResponse(selectedTicket.id, {
      autorNombre,
      autorEmail: authEmail,
      mensaje: newReplyMessage.trim(),
      esAdminSaaS: false
    });

    toast.success("Respuesta añadida al ticket");
    setNewReplyMessage("");
    refreshTickets();

    // Refresh selected ticket
    const updated = RendimientoStore.getSupportTickets().find(t => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
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

  const getStatusBadge = (estado: StoreSupportTicket["estado"]) => {
    switch (estado) {
      case "abierto":
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-200 dark:border-amber-800">Abierto</Badge>;
      case "en_progreso":
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-200 dark:border-blue-800">En progreso</Badge>;
      case "resuelto":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800">Resuelto</Badge>;
      case "cerrado":
        return <Badge variant="outline" className="text-muted-foreground">Cerrado</Badge>;
    }
  };

  const getPriorityBadge = (prioridad: StoreSupportTicket["prioridad"]) => {
    switch (prioridad) {
      case "urgente":
        return <Badge variant="destructive" className="text-[10px]">Urgente</Badge>;
      case "alta":
        return <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[10px]">Alta</Badge>;
      case "media":
        return <Badge variant="secondary" className="text-[10px]">Media</Badge>;
      case "baja":
        return <Badge variant="outline" className="text-[10px]">Baja</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" /> Soporte
          </h1>
          <p className="text-xs text-muted-foreground">Crea y consulta tickets de ayuda, sugerencias o necesidades para tu academia.</p>
        </div>
        <Button 
          onClick={() => setOpenNewTicketModal(true)} 
          className="bg-gradient-primary hover:opacity-90 shadow-elegant gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Nuevo ticket
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          {[
            { id: "todos", label: "Todos" },
            { id: "abierto", label: "Abierto" },
            { id: "en_progreso", label: "En progreso" },
            { id: "resuelto", label: "Resuelto" },
            { id: "cerrado", label: "Cerrado" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                statusFilter === tab.id
                  ? "bg-primary/90 text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar solicitudes..."
            className="pl-8 h-8 text-xs bg-muted/40 border-transparent focus-visible:bg-background"
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <Card className="shadow-elegant border/80 bg-card p-12 text-center">
            <HelpCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-foreground">No hay tickets registrados</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Si tienes alguna sugerencia, problema técnico o requerimiento especial para tu academia, crea una solicitud.
            </p>
            <Button onClick={() => setOpenNewTicketModal(true)} variant="outline" size="sm" className="mt-4 gap-2">
              <Plus className="h-3.5 w-3.5" /> Enviar solicitud
            </Button>
          </Card>
        ) : (
          filteredTickets.map((t) => {
            const hasResponses = t.respuestas && t.respuestas.length > 0;
            return (
              <Card 
                key={t.id} 
                className="shadow-sm hover:shadow-md transition cursor-pointer border/80 bg-card group"
                onClick={() => setSelectedTicket(t)}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 group-hover:scale-105 transition">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground truncate">{t.titulo}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {t.descripcion}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {getStatusBadge(t.estado)}
                        {getPriorityBadge(t.prioridad)}
                        {hasResponses && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {t.respuestas.length}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeTime(t.creadoEn)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal New Ticket */}
      <Dialog open={openNewTicketModal} onOpenChange={setOpenNewTicketModal}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateTicket}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="h-5 w-5 text-primary" /> Crear nuevo ticket de soporte
              </DialogTitle>
              <DialogDescription className="text-xs">
                Envía tus dudas, solicitudes de desarrollo o reporte de incidentes al equipo de Athletix OS.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Título del ticket</Label>
                <Input 
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ej: Solicitud de campo adicional en reportes..." 
                  className="text-xs" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Categoría / Tipo</Label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="sugerencia">💡 Sugerencia de Mejora</option>
                    <option value="necesidad">📋 Necesidad / Requerimiento</option>
                    <option value="soporte">🛠️ Soporte Técnico</option>
                    <option value="facturacion">💳 Facturación / Suscripción</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Prioridad</Label>
                  <select
                    value={prioridad}
                    onChange={e => setPrioridad(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">🚨 Urgente</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Descripción detallada</Label>
                <Textarea 
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Describe la necesidad o problema con el mayor detalle posible..."
                  className="text-xs min-h-[100px]"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpenNewTicketModal(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-primary text-xs shadow-elegant">
                Enviar Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Thread Detail Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                {getStatusBadge(selectedTicket.estado)}
                {getPriorityBadge(selectedTicket.prioridad)}
                <span className="text-[11px] text-muted-foreground ml-auto">
                  ID: {selectedTicket.id}
                </span>
              </div>
              <DialogTitle className="text-lg font-bold leading-tight">{selectedTicket.titulo}</DialogTitle>
              <DialogDescription className="text-xs">
                Enviado por {selectedTicket.creadorNombre} ({selectedTicket.creadorEmail}) · {formatRelativeTime(selectedTicket.creadoEn)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
              {/* Main Ticket Content */}
              <div className="bg-muted/40 p-4 rounded-xl space-y-2 border border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Detalle del requerimiento</span>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                  {selectedTicket.descripcion}
                </p>
              </div>

              {/* Thread Responses */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> Conversación ({selectedTicket.respuestas?.length || 0})
                </h4>

                {(!selectedTicket.respuestas || selectedTicket.respuestas.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg text-center">
                    Aún no hay respuestas del equipo de soporte. Te notificaremos cuando haya una actualización.
                  </p>
                ) : (
                  selectedTicket.respuestas.map((r) => (
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
                          {r.esAdminSaaS && <Sparkles className="h-3 w-3 text-purple-500" />}
                          {r.autorNombre}
                          {r.esAdminSaaS && <Badge className="bg-purple-500 text-[9px] py-0 px-1">Soporte SaaS</Badge>}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatRelativeTime(r.fecha)}</span>
                      </div>
                      <p className="leading-relaxed text-xs">{r.mensaje}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Input */}
            <div className="pt-3 border-t border-border flex items-center gap-2">
              <Input
                value={newReplyMessage}
                onChange={(e) => setNewReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendReply();
                }}
                placeholder="Escribe una respuesta..."
                className="text-xs flex-1"
              />
              <Button onClick={handleSendReply} size="sm" className="bg-gradient-primary gap-1">
                <Send className="h-3.5 w-3.5" /> Responder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
