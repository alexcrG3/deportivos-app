import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StatCard } from "@/components/stat-card";
import { Users2, Target, Filter, TrendingUp, ArrowRight, ExternalLink, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { crmPipelineStages, sedes, type CRMLead } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/captacion")({ component: EmbudoCaptacionView });

function EmbudoCaptacionView() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLeads = () => {
    setLoading(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase
      .from("crm_leads")
      .select("*")
      .eq("organizacion_id", orgId)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching leads from Supabase", error);
        } else if (data && data.length > 0) {
          setLeads(data.map((l: any) => ({
            id: l.id,
            nombre: l.nombre,
            disciplina: l.categoria_interes || "Fútbol",
            categoria: "Sub-13",
            correo: l.email || "",
            telefono: l.telefono || "",
            stage: l.estado || "nuevo",
            fuente: "Sitio web",
            score: 85,
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${l.nombre}`,
          })));
        } else {
          // Fallback mock leads for demonstration
          setLeads([
            { id: "1", nombre: "Mateo Fernández", disciplina: "Fútbol Sub-11", categoria: "Sub-11", correo: "mateo@mail.com", telefono: "8888-1111", stage: "nuevo", fuente: "Formulario Web", score: 90, avatar: "" },
            { id: "2", nombre: "Santiago Vargas", disciplina: "Fútbol Sub-13", categoria: "Sub-13", correo: "santiago@mail.com", telefono: "8888-2222", stage: "interesado", fuente: "Instagram", score: 85, avatar: "" },
            { id: "3", nombre: "Sofía Monge", disciplina: "Baloncesto U12", categoria: "Sub-12", correo: "sofia@mail.com", telefono: "8888-3333", stage: "prueba", fuente: "Recomendación", score: 95, avatar: "" },
            { id: "4", nombre: "Gabriel Castro", disciplina: "Fútbol Sub-15", categoria: "Sub-15", correo: "gabriel@mail.com", telefono: "8888-4444", stage: "evaluacion", fuente: "Facebook Ads", score: 78, avatar: "" },
            { id: "5", nombre: "Lucía Morales", disciplina: "Voleibol U14", categoria: "Sub-14", correo: "lucia@mail.com", telefono: "8888-5555", stage: "aprobado", fuente: "Volante impreso", score: 92, avatar: "" },
          ]);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const total = leads.length;
  const nuevos = leads.filter((l) => l.stage === "nuevo").length;
  const prospectos = leads.filter((l) => ["interesado", "prueba", "evaluacion", "decision"].includes(l.stage)).length;
  const aprobados = leads.filter((l) => l.stage === "aprobado" || l.stage === "inscrito").length;
  const tasaConv = total > 0 ? Math.round((aprobados / total) * 100) : 0;

  const embudo = crmPipelineStages
    .filter((s) => s.id !== "descartado")
    .map((s) => ({ ...s, count: leads.filter((l) => l.stage === s.id).length }));
  const maxEmbudo = Math.max(...embudo.map((e) => e.count), 1);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Filter className="h-6 w-6 text-primary" /> Embudo de Captación Deportivo
          </h1>
          <p className="text-sm text-muted-foreground">
            Pipeline de conversión de nuevos prospectos, pruebas y admisiones de atletas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/crm">
            <Button variant="outline" className="text-xs">
              Ver CRM Completo
            </Button>
          </Link>
          <Link to="/inscripcion" target="_blank">
            <Button className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <ExternalLink className="h-3.5 w-3.5" /> Abrir Formulario Público
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users2} label="Leads Nuevos" value={nuevos.toString()} hint={`de ${total} prospectos totales`} />
        <StatCard icon={Target} label="En Evaluación / Pruebas" value={prospectos.toString()} />
        <StatCard icon={CheckCircle2} label="Inscritos Aprobados" value={aprobados.toString()} />
        <StatCard icon={TrendingUp} label="Tasa de Conversión" value={`${tasaConv}%`} hint="Efectividad de captación" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Etapas del Pipeline de Captación</CardTitle>
          <CardDescription>Visualización del embudo interactivo de prospectos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {embudo.map((stage) => (
            <div key={stage.id} className="space-y-1.5 p-3 rounded-lg border bg-card/50 hover:bg-accent/40 transition-colors">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: stage.color }} />
                  {stage.nombre}
                </span>
                <span className="font-bold text-xs bg-muted px-2 py-0.5 rounded-full">{stage.count} prospectos</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(stage.count / maxEmbudo) * 100}%`, background: stage.color }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
