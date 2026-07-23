import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Phone, Mail, MessageSquare, MapPin, Calendar, User, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { crmLeads, getCRMLead, type CRMStageId, type CRMLead } from "@/lib/mock-data";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/leads")({ component: LeadsPipeline });

const crmPipelineStages = [
  { id: "nuevo", nombre: "Nuevo Lead", color: "oklch(0.6 0.25 290)" },
  { id: "interesado", nombre: "Interesado / Contactado", color: "oklch(0.65 0.2 200)" },
  { id: "prueba", nombre: "Clase de Prueba", color: "oklch(0.7 0.15 150)" },
  { id: "evaluacion", nombre: "Evaluación Técnica", color: "oklch(0.75 0.18 80)" },
  { id: "decision", nombre: "Decisión Familiar", color: "oklch(0.6 0.12 40)" },
  { id: "aprobado", nombre: "Aprobado", color: "oklch(0.62 0.18 140)" },
];

function LeadsPipeline() {
  const [leads, setLeads] = useState<CRMLead[]>([]);

  const loadLeads = () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase
      .from("crm_leads")
      .select("*")
      .eq("organizacion_id", orgId)
      .then(({ data, error }) => {
        if (error) {
          toast.error("Error al cargar leads de Supabase");
        } else if (data) {
          setLeads(data.map((l: any) => ({
            id: l.id,
            nombre: l.nombre,
            disciplina: l.categoria_interes || "Fútbol",
            categoria: "U13",
            correo: l.email || "",
            telefono: l.telefono || "",
            stage: l.estado || "nuevo",
            fuente: "Sitio web",
            score: 85,
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${l.nombre}`,
          })));
        }
      });
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const [query, setQuery] = useState("");
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(
    () => leads.filter((l) => l.nombre.toLowerCase().includes(query.toLowerCase()) || l.disciplina.toLowerCase().includes(query.toLowerCase())),
    [leads, query]
  );

  const handleDrop = (stage: CRMStageId) => {
    if (!dragId) return;
    supabase
      .from("crm_leads")
      .update({ estado: stage })
      .eq("id", dragId)
      .then(({ error }) => {
        if (error) {
          toast.error("Error al mover lead en Supabase");
        } else {
          toast.success("Lead movido", { description: `Etapa: ${crmPipelineStages.find((s) => s.id === stage)?.nombre}` });
          loadLeads();
        }
      });
    setDragId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline de Leads</h1>
          <p className="text-sm text-muted-foreground">Arrastra entre etapas para actualizar el estado</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/inscripcion" target="_blank">
            <Button variant="outline" className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
              <ExternalLink className="h-3.5 w-3.5" /> Formulario Público
            </Button>
          </Link>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8 w-64" placeholder="Buscar lead…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <NewLeadDialog onCreate={loadLeads} />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
        {crmPipelineStages.map((stage) => {
          const items = filtered.filter((l) => l.stage === stage.id);
          return (
            <div
              key={stage.id}
              className="min-w-[290px] w-[290px] flex-shrink-0 flex flex-col gap-2.5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* STAGE HEADER */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">{stage.nombre}</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                  {items.length}
                </span>
              </div>

              {/* STAGE CONTAINER COLUMN */}
              <div className="space-y-2.5 bg-slate-50/70 dark:bg-slate-950/50 rounded-2xl p-2.5 min-h-[480px] border border-slate-200/60 dark:border-slate-800/60">
                {items.map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onClick={() => setOpenLead(l.id)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all space-y-2.5 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <Avatar className="h-8 w-8 shrink-0 border border-slate-100 dark:border-slate-800">
                        <AvatarImage src={l.avatar} />
                        <AvatarFallback className="bg-slate-800 text-white font-bold text-xs">{l.nombre[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-purple-600 transition-colors">{l.nombre}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {l.disciplina} · <span className="font-medium text-slate-600 dark:text-slate-400">{l.categoria}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200/40">
                        {l.fuente}
                      </span>
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        Score {l.score}
                      </span>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-xs text-slate-400">Sin leads</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetailSheet lead={leads.find(l => l.id === openLead) || null} onOpenChange={(o) => !o && setOpenLead(null)} onConvert={(id) => {
        supabase
          .from("crm_leads")
          .update({ estado: "inscrito" })
          .eq("id", id)
          .then(() => {
            loadLeads();
            setOpenLead(null);
            toast.success("Lead convertido en jugador", { description: "Player OS creado automáticamente" });
          });
      }} />
    </div>
  );
}

function NewLeadDialog({ onCreate }: { onCreate: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", correo: "", disciplina: "Fútbol", fuente: "Sitio web" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" /> Nuevo Lead</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar nuevo lead</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nombre completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <Input placeholder="Correo" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.disciplina} onValueChange={(v) => setForm({ ...form, disciplina: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Fútbol", "Baloncesto", "Natación", "Voleibol"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.fuente} onValueChange={(v) => setForm({ ...form, fuente: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Sitio web", "WhatsApp", "Facebook", "Instagram", "Referidos", "Eventos"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={() => {
            if (!form.nombre) return toast.error("Nombre requerido");
            const orgId = RendimientoStore.getActiveOrganizacionId();
            const newRecord = {
              nombre: form.nombre,
              email: form.correo,
              telefono: form.telefono,
              estado: "nuevo",
              categoria_interes: form.disciplina,
              notas: "Creado desde panel",
              organizacion_id: orgId,
            };
            supabase
              .from("crm_leads")
              .insert([newRecord])
              .then(({ error }) => {
                if (error) {
                  toast.error("Error al registrar lead en Supabase");
                } else {
                  toast.success("Lead registrado exitosamente!");
                  onCreate();
                  setOpen(false);
                  setForm({ nombre: "", telefono: "", correo: "", disciplina: "Fútbol", fuente: "Sitio web" });
                }
              });
          }}>Crear lead</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeadDetailSheet({ lead, onOpenChange, onConvert }: { lead: CRMLead | null; onOpenChange: (o: boolean) => void; onConvert: (id: string) => void }) {
  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {lead && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14"><AvatarImage src={lead.avatar} /><AvatarFallback>{lead.nombre[0]}</AvatarFallback></Avatar>
                <div>
                  <SheetTitle>{lead.nombre}</SheetTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{lead.disciplina}</Badge>
                    <Badge variant="secondary">{crmPipelineStages.find((s) => s.id === lead.stage)?.nombre || lead.stage}</Badge>
                  </div>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="info" className="mt-6">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="actividad">Actividad</TabsTrigger>
                <TabsTrigger value="pruebas">Pruebas</TabsTrigger>
                <TabsTrigger value="scouting">Scouting</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-3 mt-4">
                <InfoRow icon={Phone} label="Teléfono" value={lead.telefono} />
                <InfoRow icon={Mail} label="Correo" value={lead.correo} />
                <InfoRow icon={User} label="Encargado" value="—" />
                <InfoRow icon={MapPin} label="Sede" value="Sede Central" />
                <InfoRow icon={Calendar} label="Ingreso" value="2026-07-18" />
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
                  <p className="text-sm">Registrado en la base de datos de Supabase</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" variant="outline"><MessageSquare className="h-4 w-4 mr-1" /> WhatsApp</Button>
                  {(lead.stage === "aprobado" || lead.stage === "nuevo") && (
                    <Button className="flex-1" onClick={() => onConvert(lead.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Convertir en jugador
                    </Button>
                  )}
                  {lead.stage !== "aprobado" && lead.stage !== "inscrito" && (
                    <Button className="flex-1" variant="default" onClick={() => onConvert(lead.id)}>
                      <ArrowRight className="h-4 w-4 mr-1" /> Inscribir directo
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="actividad" className="space-y-2 mt-4">
                {lead.actividades.length === 0 && <p className="text-sm text-muted-foreground">Sin actividades registradas.</p>}
                {lead.actividades.map((a) => (
                  <div key={a.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{a.titulo}</span>
                      <span className="text-xs text-muted-foreground">{a.fecha}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{a.descripcion}</p>
                    <p className="text-xs mt-1">Por: {a.responsable}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="pruebas" className="space-y-2 mt-4">
                {lead.pruebas.length === 0 && <p className="text-sm text-muted-foreground">Sin pruebas programadas.</p>}
                {lead.pruebas.map((p) => (
                  <div key={p.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{p.tipo} · {p.disciplina}</span>
                      <Badge variant={p.estado === "completada" ? "default" : p.estado === "cancelada" ? "destructive" : "secondary"}>{p.estado}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.fecha} {p.hora} · {p.sede} · {p.entrenador}</p>
                    {p.resultado && <p className="text-xs"><span className="font-medium">Resultado:</span> {p.resultado}</p>}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="scouting" className="space-y-2 mt-4">
                {!lead.scouting ? <p className="text-sm text-muted-foreground">Sin evaluación de scouting.</p> : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ["Técnica", lead.scouting.tecnica],
                        ["Táctica", lead.scouting.tactica],
                        ["Físico", lead.scouting.fisico],
                        ["Inteligencia", lead.scouting.inteligencia],
                        ["Disciplina", lead.scouting.disciplinaScore],
                        ["Actitud", lead.scouting.actitud],
                      ].map(([k, v]) => (
                        <div key={k as string} className="rounded-lg border p-2">
                          <p className="text-xs text-muted-foreground">{k}</p>
                          <p className="text-lg font-bold">{v}<span className="text-xs text-muted-foreground">/100</span></p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border p-3 space-y-2">
                      <div><p className="text-xs text-muted-foreground">Potencial</p><p className="font-semibold">{lead.scouting.potencial}/100</p></div>
                      <div><p className="text-xs text-muted-foreground">Fortalezas</p><p className="text-sm">{lead.scouting.fortalezas}</p></div>
                      <div><p className="text-xs text-muted-foreground">Debilidades</p><p className="text-sm">{lead.scouting.debilidades}</p></div>
                      <div><p className="text-xs text-muted-foreground">Recomendación</p><Badge>{lead.scouting.recomendacion}</Badge></div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm truncate">{value || "—"}</p>
      </div>
    </div>
  );
}
