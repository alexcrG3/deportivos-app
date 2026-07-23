import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { asistenciaMensual, horarios, instalaciones, eventos, entrenadores, categorias } from "@/lib/mock-data";
import { CalendarCheck, Layers, Megaphone, MapPinned, Activity, Clock, ClipboardList } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/operacion")({ component: OperacionPage });

function OperacionPage() {
  const activeOrg = RendimientoStore.getActiveOrganizacionId();
  const hasPlayers = RendimientoStore.getJugadores().length > 0;
  
  const coachesCount = RendimientoStore.get<any[]>("entrenadores_dynamics", [])
    .filter(c => c.organizacion_id === activeOrg || (!c.organizacion_id && activeOrg === "00000000-0000-0000-0000-000000000000"))
    .length;
  
  const teamsCount = RendimientoStore.getEquipos().length;

  const hoy = hasPlayers ? horarios.slice(0, 5) : [];
  const proximos = hasPlayers ? eventos.slice(0, 4) : [];
  const activeInstalaciones = hasPlayers ? instalaciones : [];
  const activeAsistenciaMensual = hasPlayers ? asistenciaMensual : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operación deportiva</h1>
          <p className="text-sm text-muted-foreground">Resumen operativo en tiempo real.</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-elegant font-bold" asChild>
          <Link to="/convocatorias">
            <ClipboardList className="h-4 w-4" /> Gestión de Convocatorias
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Entrenamientos hoy" value="0" delta={0} icon={Clock} accent="primary" />
        <StatCard label="Asistencia diaria" value="0%" delta={0} icon={CalendarCheck} accent="success" />
        <StatCard label="Categorías activas" value={teamsCount.toString()} icon={Layers} accent="primary" />
        <StatCard label="Entrenadores activos" value={coachesCount.toString()} icon={Megaphone} accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Asistencia mensual</CardTitle>
              <CardDescription>Promedio global por mes</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-success/15 text-success">{hasPlayers ? "+4% vs anterior" : "0%"}</Badge>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeAsistenciaMensual} margin={{ left: -10, right: 5, top: 5 }}>
                <defs>
                  <linearGradient id="gOp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} domain={[70, 100]} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="porcentaje" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#gOp)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPinned className="h-4 w-4" /> Ocupación instalaciones</CardTitle>
            <CardDescription>Uso semanal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeInstalaciones.length > 0 ? (
              activeInstalaciones.slice(0, 5).map((f) => (
                <div key={f.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium truncate">{f.nombre}</span>
                    <span className="text-muted-foreground">{f.uso}%</span>
                  </div>
                  <Progress value={f.uso} />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No hay instalaciones registradas.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> Entrenamientos de hoy</CardTitle>
            <CardDescription>Próximas sesiones programadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {hoy.length > 0 ? (
              hoy.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                      <p className="text-[10px] uppercase opacity-70">Hoy</p>
                      <p className="text-xs font-bold leading-none">{h.inicio}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{h.titulo}</p>
                      <p className="text-xs text-muted-foreground">{h.instalacion} · {h.entrenador}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{h.inicio}–{h.fin}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No hay entrenamientos programados para hoy.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-4 w-4" /> Próximos eventos</CardTitle>
            <CardDescription>Partidos, torneos y reuniones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {proximos.length > 0 ? (
              proximos.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-muted">
                      <p className="text-[9px] uppercase text-muted-foreground">Jun</p>
                      <p className="text-sm font-bold leading-none">{e.fecha.split("-")[2]}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.titulo}</p>
                      <p className="text-xs text-muted-foreground">{e.hora} · {e.disciplina}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{e.tipo}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No hay próximos eventos programados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
