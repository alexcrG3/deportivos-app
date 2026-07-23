import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Search, ChevronRight, ClipboardCheck, MessageSquare, FileText } from "lucide-react";
import { crmLeads, crmScouting, crmPruebas, crmActividades } from "@/lib/mock-data";

import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/prospectos")({ component: ProspectosPage });

function ProspectosPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const { data, error } = await supabase
      .from("crm_leads")
      .select("*")
      .eq("organizacion_id", orgId);
    
    if (error) {
      toast.error("Error al cargar prospectos de la base de datos");
    } else if (data) {
      const mapped = data.map((l: any) => ({
        id: l.id,
        nombre: l.nombre,
        disciplina: l.categoria_interes || "Fútbol",
        categoria: "Sub-13",
        edad: 12,
        correo: l.email || "",
        telefono: l.telefono || "",
        stage: l.estado || "nuevo",
        fuente: "Sitio web",
        score: 85,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${l.nombre}`,
      }));
      setLeads(mapped);
      const filteredProspectos = mapped.filter((l) => ["interesado", "prueba", "evaluacion", "decision", "aprobado"].includes(l.stage));
      if (filteredProspectos.length > 0) {
        setSelected(filteredProspectos[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const prospectos = leads.filter((l) => ["interesado", "prueba", "evaluacion", "decision", "aprobado"].includes(l.stage));
  const filtered = prospectos.filter((p) => p.nombre.toLowerCase().includes(query.toLowerCase()));
  const current = prospectos.find((p) => p.id === selected);
  const scouting = current ? crmScouting.find((s) => s.leadId === current.id) || { leadId: current.id, tecnica: 80, tactica: 75, fisico: 85, inteligencia: 80, disciplinaScore: 90, actitud: 85, fortalezas: "Velocidad y técnica individual", debilidades: "Aspecto defensivo posicional", potencial: 85, recomendacion: "Fichaje recomendado" } : null;
  const pruebas = current ? crmPruebas.filter((p) => p.leadId === current.id || p.jugador === current.nombre) : [];
  const actividades = current ? crmActividades.filter((a) => a.leadId === current.id) || [] : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prospectos</h1>
        <p className="text-sm text-muted-foreground">Leads avanzados con evaluaciones y pruebas en curso</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="lg:max-h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Buscar prospecto…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full text-left p-3 hover:bg-muted/50 flex items-center gap-3 ${selected === p.id ? "bg-muted" : ""}`}
              >
                <Avatar className="h-9 w-9"><AvatarImage src={p.avatar} /><AvatarFallback>{p.nombre[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.disciplina} · {p.categoria}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </Card>

        {current && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarImage src={current.avatar} /><AvatarFallback>{current.nombre[0]}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{current.nombre}</h2>
                  <p className="text-sm text-muted-foreground">{current.edad} años · {current.disciplina} · {current.sede}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge>{current.stage}</Badge>
                    <Badge variant="outline">{current.fuente}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold">{current.score}</p>
                </div>
              </div>

              <Tabs defaultValue="scouting">
                <TabsList>
                  <TabsTrigger value="scouting"><Star className="h-3 w-3 mr-1" /> Scouting</TabsTrigger>
                  <TabsTrigger value="pruebas"><ClipboardCheck className="h-3 w-3 mr-1" /> Pruebas</TabsTrigger>
                  <TabsTrigger value="actividad"><MessageSquare className="h-3 w-3 mr-1" /> Actividad</TabsTrigger>
                  <TabsTrigger value="archivos"><FileText className="h-3 w-3 mr-1" /> Archivos</TabsTrigger>
                </TabsList>

                <TabsContent value="scouting" className="space-y-3 mt-4">
                  {!scouting ? (
                    <p className="text-sm text-muted-foreground">Sin evaluación. <Button size="sm" variant="link">Crear evaluación</Button></p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ["Técnica", scouting.tecnica], ["Táctica", scouting.tactica], ["Físico", scouting.fisico],
                          ["Inteligencia", scouting.inteligencia], ["Disciplina", scouting.disciplinaScore], ["Actitud", scouting.actitud],
                        ].map(([k, v]) => (
                          <div key={k as string} className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">{k}</p>
                            <div className="flex items-end gap-1 mt-1">
                              <span className="text-2xl font-bold">{v}</span>
                              <span className="text-xs text-muted-foreground pb-1">/100</span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-muted mt-2 overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${v}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border p-3 bg-emerald-500/5 border-emerald-500/30">
                          <p className="text-xs text-muted-foreground">Fortalezas</p>
                          <p className="text-sm font-medium">{scouting.fortalezas}</p>
                        </div>
                        <div className="rounded-lg border p-3 bg-orange-500/5 border-orange-500/30">
                          <p className="text-xs text-muted-foreground">Debilidades</p>
                          <p className="text-sm font-medium">{scouting.debilidades}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Potencial proyectado</p>
                          <p className="text-xl font-bold">{scouting.potencial}<span className="text-sm text-muted-foreground">/100</span></p>
                        </div>
                        <Badge className="text-base px-3 py-1">{scouting.recomendacion}</Badge>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="pruebas" className="space-y-2 mt-4">
                  {pruebas.length === 0 ? <p className="text-sm text-muted-foreground">Sin pruebas registradas.</p> : pruebas.map((p) => (
                    <div key={p.id} className="rounded-lg border p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.tipo} · {p.disciplina}</p>
                        <p className="text-xs text-muted-foreground">{p.fecha} {p.hora} · {p.entrenador}</p>
                      </div>
                      <Badge variant={p.estado === "completada" ? "default" : "secondary"}>{p.estado}</Badge>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="actividad" className="space-y-2 mt-4">
                  {actividades.length === 0 ? <p className="text-sm text-muted-foreground">Sin actividades.</p> : actividades.map((a) => (
                    <div key={a.id} className="rounded-lg border p-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{a.titulo}</span>
                        <span className="text-xs text-muted-foreground">{a.fecha}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{a.descripcion}</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="archivos" className="mt-4">
                  <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No hay archivos adjuntos.
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
