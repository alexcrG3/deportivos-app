import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { StatCard } from "@/components/stat-card";
import { Users2, Target, ClipboardList, Megaphone, TrendingUp, ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { crmLeads, crmPruebas, crmCampanas, crmPipelineStages, sedes, type CRMLead } from "@/lib/mock-data";

import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/crm")({ component: CRMDashboard });

function CRMDashboard() {
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
        } else if (data) {
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
  const tasaConv = Math.round((aprobados / total) * 100);
  const pruebasProg = crmPruebas.filter((p) => p.estado === "programada").length;

  const porSede = sedes.slice(0, 3).map((s) => ({
    sede: s.nombre,
    leads: leads.filter((l) => l.sedeId === s.id).length,
  }));

  const embudo = crmPipelineStages
    .filter((s) => s.id !== "descartado")
    .map((s) => ({ ...s, count: leads.filter((l) => l.stage === s.id).length }));
  const maxEmbudo = Math.max(...embudo.map((e) => e.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM Deportivo</h1>
          <p className="text-sm text-muted-foreground">Captación, evaluación e inscripción de nuevos atletas.</p>
        </div>
        <Link to="/inscripcion" target="_blank">
          <Button variant="outline" className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
            <ExternalLink className="h-3.5 w-3.5" /> Abrir Formulario Público
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users2} label="Leads nuevos" value={nuevos.toString()} hint={`de ${total} totales`} />
        <StatCard icon={Target} label="Prospectos activos" value={prospectos.toString()} />
        <StatCard icon={ClipboardList} label="Pruebas programadas" value={pruebasProg.toString()} />
        <StatCard icon={TrendingUp} label="Tasa de conversión" value={`${tasaConv}%`} hint={`${aprobados} aprobados`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Embudo de conversión</CardTitle>
            <CardDescription>Distribución de leads por etapa del pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {embudo.map((s) => (
              <div key={s.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.nombre}</span>
                  <span className="text-muted-foreground">{s.count}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(s.count / maxEmbudo) * 100}%`, background: s.color }} />
                </div>
              </div>
            ))}
            <Link to="/leads" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline pt-2">
              Ver pipeline completo <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Captación por sede</CardTitle>
            <CardDescription>Leads por sede activa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {porSede.map((s) => (
              <div key={s.sede} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{s.sede}</span>
                  <span className="font-medium">{s.leads}</span>
                </div>
                <Progress value={(s.leads / total) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" /> Campañas activas</CardTitle>
              <CardDescription>Resultados recientes</CardDescription>
            </div>
            <Link to="/campanas" className="text-sm text-primary hover:underline">Ver todas</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {crmCampanas.filter((c) => c.estado === "activa").map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">{c.segmento} · {c.canal}</p>
                </div>
                <Badge variant="secondary">{c.conversiones} conv.</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Últimos leads</CardTitle>
              <CardDescription>Ingresos recientes al CRM</CardDescription>
            </div>
            <Link to="/leads" className="text-sm text-primary hover:underline">Ver pipeline</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {leads.slice(0, 6).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-md hover:bg-muted/50 p-2 text-sm">
                <div>
                  <p className="font-medium">{l.nombre}</p>
                  <p className="text-xs text-muted-foreground">{l.disciplina} · {l.sede}</p>
                </div>
                <Badge variant="outline" className="text-xs">{l.fuente}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
