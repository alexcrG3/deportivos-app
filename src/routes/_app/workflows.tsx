import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { workflows, workflowLogs } from "@/lib/mock-data";
import { Workflow, Plus, Zap, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/workflows")({ component: WorkflowsPage });

const estadoStyle = {
  activo: "bg-success/15 text-success",
  pausado: "bg-warning/20 text-warning",
  borrador: "bg-muted text-muted-foreground",
};

function WorkflowsPage() {
  const hasPlayers = RendimientoStore.getJugadores().length > 0;
  
  const activeWorkflows = hasPlayers ? workflows : [];
  const activeLogs = hasPlayers ? workflowLogs : [];

  const activos = activeWorkflows.filter((w) => w.estado === "activo").length;
  const ejec = activeWorkflows.reduce((a, w) => a + w.ejecuciones, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflows · Automatizaciones</h1>
          <p className="text-sm text-muted-foreground">Reglas con triggers, condiciones y acciones automáticas.</p>
        </div>
        <Button className="bg-gradient-primary shadow-elegant"><Plus className="h-4 w-4" /> Nuevo workflow</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Workflows activos" value={activos.toString()} hint={`${activeWorkflows.length} totales`} icon={Workflow} accent="primary" />
        <StatCard label="Ejecuciones totales" value={ejec.toString()} delta={hasPlayers ? 24 : 0} icon={Zap} accent="success" />
        <StatCard label="Ejecuciones exitosas" value={hasPlayers ? "98.2%" : "0%"} hint="últimos 30 días" icon={CheckCircle2} accent="success" />
        <StatCard label="Errores recientes" value={hasPlayers ? "3" : "0"} hint="requieren revisión" icon={AlertTriangle} accent="destructive" />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Reglas configuradas</CardTitle>
          <CardDescription>Activa, pausa o edita tus automatizaciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeWorkflows.length > 0 ? (
              activeWorkflows.map((w) => (
                <div key={w.id} className="rounded-lg border bg-card p-4 hover:shadow-elegant transition group">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm">{w.nombre}</p>
                        <Badge variant="secondary" className={estadoStyle[w.estado]}>{w.estado}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Si:</span>
                        <Badge variant="outline" className="font-normal">{w.trigger}</Badge>
                        <ChevronRight className="h-3 w-3" />
                        <span className="font-medium">Entonces:</span>
                        {w.acciones.map((a) => (
                          <Badge key={a} variant="outline" className="font-normal">{a}</Badge>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {w.ejecuciones} ejecuciones · última {w.ultima}
                      </div>
                    </div>
                    <Switch defaultChecked={w.estado === "activo"} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No hay workflows creados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Historial de ejecución</CardTitle>
          <CardDescription>Eventos recientes de los workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          {activeLogs.length > 0 ? (
            <ul className="divide-y">
              {activeLogs.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-3">
                  <div className={`h-2 w-2 rounded-full ${l.estado === "ok" ? "bg-success" : "bg-destructive"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.workflow}</p>
                    <p className="text-xs text-muted-foreground">→ {l.destino} · {l.canal}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{l.fecha}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No hay historial de ejecución registrado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
