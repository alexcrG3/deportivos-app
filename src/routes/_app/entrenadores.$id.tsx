import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  entrenadores, sedes, equipos, categorias, jugadores, horarios, eventos, asistenciaMensual,
  getPlayerOS, formatCRC,
} from "@/lib/mock-data";
import {
  ArrowLeft, Users, ShieldHalf, ClipboardCheck, AlertTriangle, CalendarDays, MessageSquare,
  Trophy, Activity, TrendingUp, TrendingDown, Heart, Wallet, FileWarning, Bell, QrCode,
  CheckCircle2, XCircle, Clock3, FileText, Send, Phone, Mail, Plus, Target, Zap, Star,
  ChevronRight, MapPin, ExternalLink, AlertCircle, Stethoscope,
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/_app/entrenadores/$id")({
  component: CoachOS,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-medium">Entrenador no encontrado</p>
      <Button asChild variant="outline" className="mt-4">
        <Link to="/entrenadores">Volver al listado</Link>
      </Button>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-6 text-destructive">{(error as Error).message}</div>
  ),
});

function CoachOS() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const coach = entrenadores.find((c) => c.id === id);
  if (!coach) throw notFound();

  const sede = sedes.find((s) => s.id === coach.sedeId);
  const equiposCoach = equipos.filter((e) => e.entrenador === coach.nombre);
  const catsCoach = categorias.filter((c) => c.entrenador === coach.nombre);
  const horariosCoach = horarios.filter((h) => h.entrenador === coach.nombre);
  const eventosCoach = eventos.filter((e) => e.sedeId === coach.sedeId).slice(0, 5);

  // Roster: jugadores en categorías del entrenador, fallback a jugadores de su sede
  const rosterIds = useMemo(() => {
    const catNames = catsCoach.map((c) => c.nombre);
    const matched = jugadores.filter((j) =>
      catNames.some((cn) => cn.includes(j.disciplina)) && j.sedeId === coach.sedeId
    );
    return (matched.length ? matched : jugadores.filter((j) => j.sedeId === coach.sedeId)).slice(0, 18);
  }, [coach.sedeId, catsCoach]);

  // Métricas derivadas
  const rosterPlayers = rosterIds.map((j) => {
    const os = getPlayerOS(j.id)!;
    return { ...j, os };
  });

  const totalJugadores = rosterPlayers.length;
  const jugadoresHabilitados = rosterPlayers.filter((p) => p.os.estadoOp === "habilitado").length;
  const jugadoresAviso = rosterPlayers.filter((p) => p.os.estadoOp === "aviso" || p.os.estadoOp === "tolerancia").length;
  const jugadoresRestringidos = rosterPlayers.filter((p) => p.os.estadoOp === "restriccion").length;
  const jugadoresLesionados = rosterPlayers.filter((p) => p.os.lesiones.some((l: any) => l.estado !== "recuperado")).length;
  const asistenciaPromedio = Math.round(rosterPlayers.reduce((s, p) => s + p.os.stats.asistenciaPct, 0) / Math.max(1, totalJugadores));
  const rendimientoPromedio = Math.round(rosterPlayers.reduce((s, p) => s + p.os.stats.promRend, 0) / Math.max(1, totalJugadores));
  const bajaAsistencia = rosterPlayers.filter((p) => p.os.stats.asistenciaPct < 80).length;
  const bajoRendimiento = rosterPlayers.filter((p) => p.os.stats.promRend < 70).length;

  // Alertas generadas
  const alertas = [
    ...rosterPlayers.filter((p) => p.os.estadoOp === "restriccion").map((p) => ({
      id: `al-r-${p.id}`, tipo: "Financiera", prioridad: "alta" as const,
      jugadorId: p.id, jugador: p.nombre, mensaje: `Saldo pendiente: ${formatCRC(p.saldo)}. Requiere aprobación.`,
    })),
    ...rosterPlayers.filter((p) => p.os.stats.asistenciaPct < 80).map((p) => ({
      id: `al-a-${p.id}`, tipo: "Asistencia", prioridad: "media" as const,
      jugadorId: p.id, jugador: p.nombre, mensaje: `Asistencia baja: ${p.os.stats.asistenciaPct}%`,
    })),
    ...rosterPlayers.filter((p) => p.os.stats.promRend < 70).map((p) => ({
      id: `al-p-${p.id}`, tipo: "Rendimiento", prioridad: "media" as const,
      jugadorId: p.id, jugador: p.nombre, mensaje: `Rendimiento promedio: ${p.os.stats.promRend}/100`,
    })),
    ...rosterPlayers.filter((p) => p.os.lesiones.some((l: any) => l.estado !== "recuperado")).map((p) => ({
      id: `al-l-${p.id}`, tipo: "Médica", prioridad: "alta" as const,
      jugadorId: p.id, jugador: p.nombre, mensaje: `Lesión activa registrada`,
    })),
  ].slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="mt-1">
            <Link to="/entrenadores"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <Avatar className="h-16 w-16 ring-2 ring-primary/30">
            <AvatarImage src={coach.avatar} />
            <AvatarFallback>{coach.nombre[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{coach.nombre}</h1>
              <Badge variant="secondary" className="bg-success/15 text-success">Activo</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{coach.especialidad} · {sede?.nombre}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {coach.disciplinas.map((d) => <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm"><Phone className="h-4 w-4" /> Llamar</Button>
          <Button variant="outline" size="sm"><MessageSquare className="h-4 w-4" /> WhatsApp</Button>
          <Button variant="outline" size="sm"><Mail className="h-4 w-4" /> Email</Button>
          <Button size="sm" className="bg-gradient-primary shadow-elegant"><QrCode className="h-4 w-4" /> QR Check-In</Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={ShieldHalf} label="Equipos" value={equiposCoach.length} hint={`${catsCoach.length} categorías`} accent="primary" />
        <KpiCard icon={Users} label="Jugadores activos" value={totalJugadores} hint={`${jugadoresHabilitados} habilitados`} accent="success" />
        <KpiCard icon={ClipboardCheck} label="Asistencia promedio" value={`${asistenciaPromedio}%`} delta={asistenciaPromedio >= 85 ? 4 : -3} accent={asistenciaPromedio >= 85 ? "success" : "warning"} />
        <KpiCard icon={Activity} label="Rendimiento promedio" value={`${rendimientoPromedio}/100`} delta={rendimientoPromedio >= 75 ? 2 : -1} accent="primary" />
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="equipos">Equipos</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
          <TabsTrigger value="alertas">
            Alertas {alertas.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5">{alertas.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="riesgo">En riesgo</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="comunicacion">Comunicación</TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader>
                <CardTitle>Resumen del día</CardTitle>
                <CardDescription>Actividades programadas y pendientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {horariosCoach.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay entrenamientos programados.</p>
                )}
                {horariosCoach.slice(0, 4).map((h) => (
                  <div key={h.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Clock3 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{h.titulo}</p>
                      <p className="text-xs text-muted-foreground">{h.dia} · {h.inicio}–{h.fin} · {h.instalacion}</p>
                    </div>
                    <Badge variant="outline">{h.categoria}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Alertas activas</CardTitle>
                <CardDescription>Requieren atención</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <AlertRow icon={AlertTriangle} label="Restringidos" count={jugadoresRestringidos} variant="destructive" />
                <AlertRow icon={Heart} label="Lesionados" count={jugadoresLesionados} variant="destructive" />
                <AlertRow icon={ClipboardCheck} label="Baja asistencia" count={bajaAsistencia} variant="warning" />
                <AlertRow icon={TrendingDown} label="Bajo rendimiento" count={bajoRendimiento} variant="warning" />
                <AlertRow icon={Wallet} label="En aviso financiero" count={jugadoresAviso} variant="warning" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Tendencia de asistencia</CardTitle>
                <CardDescription>Últimos 7 meses</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={asistenciaMensual}>
                    <defs>
                      <linearGradient id="gAsist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} domain={[60, 100]} />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                    <Area type="monotone" dataKey="porcentaje" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#gAsist)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Radar del equipo</CardTitle>
                <CardDescription>Promedio de habilidades del roster</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <TeamRadar players={rosterPlayers} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* EQUIPOS */}
        <TabsContent value="equipos" className="space-y-4">
          {equiposCoach.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Este entrenador aún no tiene equipos asignados.</CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {equiposCoach.map((e) => {
                const cat = categorias.find((c) => c.nombre === e.categoria);
                const sedeE = sedes.find((s) => s.id === cat?.sedeId);
                return (
                  <Card key={e.id} className="shadow-card overflow-hidden hover:shadow-elegant transition">
                    <div className="h-16 bg-gradient-primary relative">
                      <div className="absolute -bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-xl bg-card border-4 border-card shadow-elegant">
                        <ShieldHalf className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <CardHeader className="pt-7 pb-2">
                      <CardTitle className="text-base">{e.nombre}</CardTitle>
                      <CardDescription>{e.disciplina} · {e.categoria}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <Row label="Jugadores" value={String(e.jugadores)} icon={Users} />
                      <Row label="Asistencia" value={`${asistenciaPromedio}%`} icon={ClipboardCheck} />
                      <Row label="Rendimiento" value={`${rendimientoPromedio}/100`} icon={Activity} />
                      <Row label="Sede" value={sedeE?.nombre ?? "—"} icon={MapPin} />
                      <Badge variant="outline" className="w-full justify-center mt-2">Uniforme: {e.uniforme}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ROSTER */}
        <TabsContent value="roster" className="space-y-4">
          <RosterPanel players={rosterPlayers} onOpen={(pid) => navigate({ to: "/jugadores/$id", params: { id: pid } })} />
        </TabsContent>

        {/* ASISTENCIA */}
        <TabsContent value="asistencia" className="space-y-4">
          <AttendancePanel players={rosterPlayers} />
        </TabsContent>

        {/* EVALUACIONES */}
        <TabsContent value="evaluaciones" className="space-y-4">
          <EvaluationsPanel players={rosterPlayers} coach={coach.nombre} />
        </TabsContent>

        {/* ALERTAS */}
        <TabsContent value="alertas" className="space-y-4">
          <AlertsPanel alertas={alertas} onOpen={(pid) => navigate({ to: "/jugadores/$id", params: { id: pid } })} />
        </TabsContent>

        {/* EN RIESGO */}
        <TabsContent value="riesgo" className="space-y-4">
          <RiskPanel players={rosterPlayers} onOpen={(pid) => navigate({ to: "/jugadores/$id", params: { id: pid } })} />
        </TabsContent>

        {/* CALENDARIO */}
        <TabsContent value="calendario" className="space-y-4">
          <CalendarPanel horariosCoach={horariosCoach} eventosCoach={eventosCoach} />
        </TabsContent>

        {/* COMUNICACIÓN */}
        <TabsContent value="comunicacion" className="space-y-4">
          <CommsPanel players={rosterPlayers} coachName={coach.nombre} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ====================== SUBCOMPONENTES ====================== */

function KpiCard({ icon: Icon, label, value, hint, delta, accent = "primary" }: {
  icon: any; label: string; value: string | number; hint?: string; delta?: number;
  accent?: "primary" | "success" | "warning" | "destructive";
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <Card className="shadow-card">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold leading-tight">{value}</p>
          {(hint || delta !== undefined) && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              {delta !== undefined && (
                <span className={delta >= 0 ? "text-success" : "text-destructive"}>
                  {delta >= 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />}
                  {Math.abs(delta)}%
                </span>
              )}
              {hint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertRow({ icon: Icon, label, count, variant }: { icon: any; label: string; count: number; variant: "destructive" | "warning" }) {
  const styles = variant === "destructive"
    ? "bg-destructive/10 text-destructive"
    : "bg-warning/15 text-warning";
  return (
    <div className="flex items-center justify-between rounded-lg border p-2.5">
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${styles}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm">{label}</span>
      </div>
      <Badge variant={count > 0 ? (variant === "destructive" ? "destructive" : "secondary") : "outline"}>
        {count}
      </Badge>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function statusBadge(estado: string) {
  if (estado === "habilitado") return <Badge className="bg-success/15 text-success hover:bg-success/20">🟢 Habilitado</Badge>;
  if (estado === "tolerancia") return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">🟢 Tolerancia</Badge>;
  if (estado === "aviso") return <Badge className="bg-warning/15 text-warning hover:bg-warning/20">🟠 Aviso</Badge>;
  return <Badge variant="destructive">🔴 Restringido</Badge>;
}

function TeamRadar({ players }: { players: any[] }) {
  const skills = ["Técnico", "Físico", "Táctico", "Actitud", "Velocidad", "Resistencia"];
  const data = skills.map((skill) => {
    const avg = players.reduce((s, p) => s + (p.os.radar.find((r: any) => r.skill === skill)?.valor ?? 0), 0) / Math.max(1, players.length);
    return { skill, valor: Math.round(avg) };
  });
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data}>
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="valor" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.35} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- ROSTER ---------------- */
function RosterPanel({ players, onOpen }: { players: any[]; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = players.filter((p) => p.nombre.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Input placeholder="Buscar jugador..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Badge variant="outline">{filtered.length} jugadores</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Card key={p.id} className="shadow-card hover:shadow-elegant transition cursor-pointer" onClick={() => onOpen(p.id)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={p.avatar} />
                    <AvatarFallback>{p.nombre[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-card">
                    {p.os.numero}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.os.posicionPrincipal}</p>
                  <div className="mt-1.5">{statusBadge(p.os.estadoOp)}</div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Asis.</p>
                  <p className={`text-sm font-semibold ${p.os.stats.asistenciaPct < 80 ? "text-warning" : ""}`}>{p.os.stats.asistenciaPct}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Rend.</p>
                  <p className={`text-sm font-semibold ${p.os.stats.promRend < 70 ? "text-warning" : ""}`}>{p.os.stats.promRend}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Saldo</p>
                  <p className={`text-sm font-semibold ${p.saldo > 0 ? "text-destructive" : "text-success"}`}>{p.saldo === 0 ? "—" : formatCRC(p.saldo)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- ASISTENCIA ---------------- */
function AttendancePanel({ players }: { players: any[] }) {
  type Estado = "presente" | "ausente" | "tarde" | "justificado" | null;
  const [marks, setMarks] = useState<Record<string, Estado>>({});
  const setAll = (e: Estado) => setMarks(Object.fromEntries(players.map((p) => [p.id, e])));
  const counts = {
    presente: Object.values(marks).filter((m) => m === "presente").length,
    ausente: Object.values(marks).filter((m) => m === "ausente").length,
    tarde: Object.values(marks).filter((m) => m === "tarde").length,
    justificado: Object.values(marks).filter((m) => m === "justificado").length,
  };
  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Pasar asistencia</CardTitle>
            <CardDescription>Registro rápido del entrenamiento de hoy</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAll("presente")}><CheckCircle2 className="h-4 w-4" /> Todos presentes</Button>
            <Button size="sm" variant="outline" onClick={() => setMarks({})}>Limpiar</Button>
            <Button size="sm" className="bg-gradient-primary" onClick={() => toast.success("Asistencia guardada")}>Guardar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className="bg-success/15 text-success">Presentes: {counts.presente}</Badge>
            <Badge className="bg-warning/15 text-warning">Tarde: {counts.tarde}</Badge>
            <Badge variant="destructive">Ausentes: {counts.ausente}</Badge>
            <Badge variant="outline">Justificados: {counts.justificado}</Badge>
          </div>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-1.5 pr-3">
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-md border p-2.5">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.avatar} />
                    <AvatarFallback>{p.nombre[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.nombre}</p>
                    <p className="text-[11px] text-muted-foreground">#{p.os.numero} · {p.os.posicionPrincipal}</p>
                  </div>
                  <div className="flex gap-1">
                    {(["presente", "tarde", "ausente", "justificado"] as const).map((e) => {
                      const active = marks[p.id] === e;
                      const styles =
                        e === "presente" ? "data-[a=1]:bg-success data-[a=1]:text-success-foreground" :
                        e === "tarde" ? "data-[a=1]:bg-warning data-[a=1]:text-warning-foreground" :
                        e === "ausente" ? "data-[a=1]:bg-destructive data-[a=1]:text-destructive-foreground" :
                        "data-[a=1]:bg-primary data-[a=1]:text-primary-foreground";
                      return (
                        <Button key={e} size="sm" variant="outline" data-a={active ? 1 : 0}
                          className={`h-8 px-2 text-xs capitalize ${styles}`}
                          onClick={() => setMarks((m) => ({ ...m, [p.id]: e }))}>
                          {e[0].toUpperCase()}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Ranking de asistencia</CardTitle>
          <CardDescription>Top jugadores del mes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...players].sort((a, b) => b.os.asistenciaPct - a.os.asistenciaPct).slice(0, 8).map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
              <Avatar className="h-8 w-8"><AvatarImage src={p.avatar} /><AvatarFallback>{p.nombre[0]}</AvatarFallback></Avatar>
              <p className="flex-1 text-sm truncate">{p.nombre}</p>
              <div className="w-32"><Progress value={p.os.stats.asistenciaPct} /></div>
              <span className="w-12 text-right text-sm font-semibold">{p.os.stats.asistenciaPct}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- EVALUACIONES ---------------- */
function EvaluationsPanel({ players, coach }: { players: any[]; coach: string }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<any>(null);
  const [scores, setScores] = useState({ tec: 75, fis: 75, tac: 75, men: 75, dis: 75, act: 75 });
  const [comment, setComment] = useState("");

  const openEval = (p: any) => {
    setTarget(p);
    setScores({
      tec: p.os.radar[0].valor, fis: p.os.radar[1].valor, tac: p.os.radar[2].valor,
      men: 75, dis: 80, act: p.os.radar[3].valor,
    });
    setComment("");
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Centro de evaluaciones</CardTitle>
            <CardDescription>Técnica · Física · Táctica · Mental · Disciplina · Actitud (0–100)</CardDescription>
          </div>
          <Button size="sm" variant="outline"><Zap className="h-4 w-4" /> Evaluación masiva</Button>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Avatar className="h-9 w-9"><AvatarImage src={p.avatar} /><AvatarFallback>{p.nombre[0]}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.nombre}</p>
                <p className="text-xs text-muted-foreground">Promedio: {p.os.stats.promRend}/100</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openEval(p)}><Star className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Evaluar a {target?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {([
              ["tec", "Técnica"], ["fis", "Físico"], ["tac", "Táctica"],
              ["men", "Mental"], ["dis", "Disciplina"], ["act", "Actitud"],
            ] as const).map(([k, label]) => (
              <div key={k}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span>{label}</span>
                  <span className="font-semibold">{(scores as any)[k]}/100</span>
                </div>
                <Slider value={[(scores as any)[k]]} onValueChange={([v]) => setScores((s) => ({ ...s, [k]: v }))} max={100} step={1} />
              </div>
            ))}
            <div>
              <p className="text-sm mb-1.5">Comentario</p>
              <Textarea placeholder="Observaciones del entrenador..." value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="bg-gradient-primary" onClick={() => { toast.success(`Evaluación guardada para ${target?.nombre}`); setOpen(false); }}>
              Guardar evaluación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- ALERTAS ---------------- */
function AlertsPanel({ alertas, onOpen }: { alertas: any[]; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<string>("todas");
  const types = ["todas", "Financiera", "Médica", "Asistencia", "Rendimiento"];
  const filtered = filter === "todas" ? alertas : alertas.filter((a) => a.tipo === filter);
  return (
    <Card className="shadow-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Centro de alertas</CardTitle>
          <CardDescription>Generadas automáticamente por reglas del sistema</CardDescription>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {types.map((t) => <SelectItem key={t} value={t}>{t === "todas" ? "Todas" : t}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-2">
        {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Sin alertas. Todo bajo control. 🎉</p>}
        {filtered.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer" onClick={() => onOpen(a.jugadorId)}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-md ${a.prioridad === "alta" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"}`}>
              {a.tipo === "Médica" ? <Heart className="h-4 w-4" /> :
               a.tipo === "Financiera" ? <Wallet className="h-4 w-4" /> :
               a.tipo === "Asistencia" ? <ClipboardCheck className="h-4 w-4" /> :
               <Activity className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{a.jugador} <Badge variant="outline" className="ml-1 text-[10px]">{a.tipo}</Badge></p>
              <p className="text-xs text-muted-foreground truncate">{a.mensaje}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------------- EN RIESGO ---------------- */
function RiskPanel({ players, onOpen }: { players: any[]; onOpen: (id: string) => void }) {
  const enriched = players.map((p) => {
    const reasons: string[] = [];
    if (p.os.stats.asistenciaPct < 80) reasons.push("Baja asistencia");
    if (p.os.stats.promRend < 70) reasons.push("Bajo rendimiento");
    if (p.os.estadoOp === "restriccion") reasons.push("Morosidad");
    if (p.os.estadoOp === "aviso") reasons.push("Aviso financiero");
    if (p.os.lesiones.some((l: any) => l.estado !== "recuperado")) reasons.push("Lesión activa");
    if (p.os.documentos.some((d: any) => d.estado === "vencido")) reasons.push("Documentación vencida");
    return { ...p, reasons, riskScore: reasons.length };
  }).filter((p) => p.reasons.length > 0).sort((a, b) => b.riskScore - a.riskScore);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Jugadores en riesgo</CardTitle>
        <CardDescription>{enriched.length} jugadores requieren seguimiento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {enriched.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Ningún jugador en riesgo.</p>}
        {enriched.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 cursor-pointer" onClick={() => onOpen(p.id)}>
            <Avatar className="h-10 w-10"><AvatarImage src={p.avatar} /><AvatarFallback>{p.nombre[0]}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{p.nombre}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {p.reasons.map((r: string) => <Badge key={r} variant="destructive" className="text-[10px]">{r}</Badge>)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Riesgo</p>
              <p className="text-lg font-bold text-destructive">{p.riskScore}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---------------- CALENDARIO ---------------- */
function CalendarPanel({ horariosCoach, eventosCoach }: { horariosCoach: any[]; eventosCoach: any[] }) {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Semana de entrenamientos</CardTitle>
          <CardDescription>Sesiones programadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {dias.map((d) => (
              <div key={d} className="space-y-2">
                <p className="text-xs font-semibold text-center text-muted-foreground uppercase">{d.slice(0, 3)}</p>
                {horariosCoach.filter((h) => h.dia === d).map((h) => (
                  <div key={h.id} className="rounded-md border bg-primary/5 p-2 text-xs">
                    <p className="font-medium truncate">{h.titulo}</p>
                    <p className="text-muted-foreground">{h.inicio}–{h.fin}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Próximos eventos</CardTitle>
          <CardDescription>Partidos, torneos y reuniones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {eventosCoach.map((e) => (
            <div key={e.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] capitalize">{e.tipo}</Badge>
                <span className="text-[11px] text-muted-foreground">{e.fecha} · {e.hora}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{e.titulo}</p>
              <p className="text-xs text-muted-foreground">{e.disciplina}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- COMUNICACIÓN ---------------- */
function CommsPanel({ players, coachName }: { players: any[]; coachName: string }) {
  const [channel, setChannel] = useState<"whatsapp" | "email" | "push">("whatsapp");
  const [audience, setAudience] = useState<"equipo" | "encargados" | "seleccion">("equipo");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const send = () => {
    const count = audience === "seleccion" ? selected.length : players.length;
    toast.success(`Mensaje enviado a ${count} ${audience === "encargados" ? "encargados" : "jugadores"} vía ${channel}`);
    setMessage("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2 shadow-card">
        <CardHeader>
          <CardTitle>Comunicación rápida</CardTitle>
          <CardDescription>De parte de {coachName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium mb-1.5 text-muted-foreground">Canal</p>
              <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Notificación push</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5 text-muted-foreground">Audiencia</p>
              <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipo">Equipo completo</SelectItem>
                  <SelectItem value="encargados">Encargados</SelectItem>
                  <SelectItem value="seleccion">Selección manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {audience === "seleccion" && (
            <div className="rounded-md border p-2 max-h-40 overflow-auto">
              {players.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={(e) => setSelected((s) => e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id))}
                  />
                  <span className="text-sm">{p.nombre}</span>
                </label>
              ))}
            </div>
          )}

          <Textarea placeholder="Escribe tu mensaje..." value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
          <div className="flex justify-end">
            <Button className="bg-gradient-primary shadow-elegant" onClick={send} disabled={!message.trim()}>
              <Send className="h-4 w-4" /> Enviar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Plantillas rápidas</CardTitle>
          <CardDescription>Mensajes pre-armados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            "Recordatorio de entrenamiento mañana 4pm.",
            "Cambio de horario: revisar calendario.",
            "Partido confirmado este sábado.",
            "Reunión de padres este viernes.",
            "Felicitaciones por el desempeño del equipo.",
          ].map((tpl) => (
            <button key={tpl} className="w-full text-left text-xs rounded-md border p-2 hover:bg-muted/40 transition" onClick={() => setMessage(tpl)}>
              {tpl}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
