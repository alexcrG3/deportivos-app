import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RendimientoStore, { type Sesion, type Ciclo } from "@/lib/rendimiento-store";
import { StatCard } from "@/components/stat-card";
import { formatCRC } from "@/lib/mock-data";
import { Plus, Timer, Target, Activity, Copy, CalendarDays, AlertTriangle, ShieldAlert, Award, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/rendimiento/planificacion")({ component: PlanificacionPage });

const sesionTipoColor: Record<string, string> = {
  Técnica: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Táctica: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  Física: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Recuperación: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Competencia: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

function PlanificacionPage() {
  const [tab, setTab] = useState<string>("dashboard");
  const [draggingOverDay, setDraggingOverDay] = useState<string | null>(null);
  const [filtroCiclo, setFiltroCiclo] = useState<string>("todos");
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [lesiones, setLesiones] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  const [openNuevaSesion, setOpenNuevaSesion] = useState(false);
  const [openNuevoCiclo, setOpenNuevoCiclo] = useState(false);

  // New session state
  const [newSesion, setNewSesion] = useState({
    nombre: "",
    tipo: "Física" as any,
    fecha: "2026-07-12",
    hora: "09:00",
    duracion: 60,
    equipo: "Sub-16",
  });

  // New cycle state
  const [newCiclo, setNewCiclo] = useState({
    nombre: "",
    tipo: "microciclo" as any,
    subtipo: "Preparación General",
    inicio: "2026-07-15",
    fin: "2026-07-22",
    equipo: "Sub-16",
    objetivo: "",
    intensidad: "Media" as any,
    volumen: 480,
    color: "bg-primary",
    capacidades: [] as string[],
    activo: true,
  });

  const loadData = () => {
    setSesiones(RendimientoStore.getSesiones());
    setCiclos(RendimientoStore.getCiclos());
    setLesiones(RendimientoStore.getLesiones());
    setTests(RendimientoStore.getTests());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSesion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSesion.nombre) return;
    RendimientoStore.addSesion(newSesion);
    toast.success("Sesión de entrenamiento planificada");
    setNewSesion({ nombre: "", tipo: "Física", fecha: "2026-07-12", hora: "09:00", duracion: 60, equipo: "Sub-16" });
    setOpenNuevaSesion(false);
    loadData();
  };

  const handleAddCiclo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCiclo.nombre) return;
    const colors = ["bg-primary", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    RendimientoStore.addCiclo({ ...newCiclo, color: randColor });
    toast.success("Ciclo de planificación guardado");
    setNewCiclo({
      nombre: "",
      tipo: "microciclo",
      subtipo: "Preparación General",
      inicio: "2026-07-15",
      fin: "2026-07-22",
      equipo: "Sub-16",
      objetivo: "",
      intensidad: "Media",
      volumen: 480,
      color: "bg-primary",
      capacidades: [],
      activo: true,
    });
    setOpenNuevoCiclo(false);
    loadData();
  };

  const handleDuplicarCiclo = (c: Ciclo) => {
    RendimientoStore.addCiclo({
      ...c,
      nombre: `${c.nombre} (Copia)`,
      inicio: "2026-08-01",
      fin: "2026-08-30",
    });
    toast.success("Ciclo duplicado con éxito para próximo mes");
    loadData();
  };

  const handleRescheduleSesion = (id: string, newFecha: string) => {
    RendimientoStore.updateSesion(id, { fecha: newFecha });
    toast.success("Fecha de sesión actualizada");
    loadData();
  };

  const handleDuplicarSesion = (s: Sesion) => {
    RendimientoStore.addSesion({
      nombre: `${s.nombre} (Copia)`,
      tipo: s.tipo,
      fecha: s.fecha,
      hora: s.hora,
      duracion: s.duracion,
      equipo: s.equipo,
    });
    toast.success("Sesión de entrenamiento duplicada");
    loadData();
  };

  // Metrics calculation
  const totalHoras = Math.round(sesiones.reduce((acc, s) => acc + s.duracion, 0) / 60);
  const sesionesRealizadas = sesiones.filter(s => s.rpe !== undefined).length;
  const sesionesPendientes = sesiones.filter(s => s.rpe === undefined).length;
  const totalCarga = sesiones.reduce((acc, s) => acc + (s.carga || 0), 0);

  const activeLesiones = lesiones.filter(l => !l.completada);
  const stagnantTests = tests.filter(t => t.estancado);

  const diasSemana = ["2026-07-10", "2026-07-11", "2026-07-12", "2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16"];
  const diasNombres = ["Viernes 10", "Sábado 11", "Domingo 12", "Lunes 13", "Martes 14", "Miércoles 15", "Jueves 16"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planificación Deportiva</h1>
          <p className="text-sm text-muted-foreground">Estructura temporadas, macrociclos, mesociclos y sesiones diarias.</p>
        </div>
        <div className="flex gap-2">
          <Sheet open={openNuevaSesion} onOpenChange={setOpenNuevaSesion}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" />Nueva Sesión</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Planificar Sesión</SheetTitle>
                <SheetDescription>Agrega una nueva sesión de entrenamiento para el equipo.</SheetDescription>
              </SheetHeader>
              <form onSubmit={handleAddSesion} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Nombre de la Sesión</label>
                  <Input required placeholder="Ej. Táctico de presión alta" value={newSesion.nombre} onChange={(e) => setNewSesion({ ...newSesion, nombre: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Tipo</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newSesion.tipo} onChange={(e) => setNewSesion({ ...newSesion, tipo: e.target.value as any })}>
                      <option value="Técnica">Técnica</option>
                      <option value="Táctica">Táctica</option>
                      <option value="Física">Física</option>
                      <option value="Recuperación">Recuperación</option>
                      <option value="Competencia">Competencia</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Duración (min)</label>
                    <Input type="number" required value={newSesion.duracion} onChange={(e) => setNewSesion({ ...newSesion, duracion: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Fecha</label>
                    <Input type="date" required value={newSesion.fecha} onChange={(e) => setNewSesion({ ...newSesion, fecha: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Hora</label>
                    <Input type="time" required value={newSesion.hora} onChange={(e) => setNewSesion({ ...newSesion, hora: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Equipo / Categoría</label>
                  <Input required value={newSesion.equipo} onChange={(e) => setNewSesion({ ...newSesion, equipo: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">Guardar Sesión</Button>
              </form>
            </SheetContent>
          </Sheet>

          <Sheet open={openNuevoCiclo} onOpenChange={setOpenNuevoCiclo}>
            <SheetTrigger asChild>
              <Button size="sm" className="bg-gradient-primary shadow-elegant"><Plus className="mr-1 h-4 w-4" />Nuevo Ciclo</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Crear Ciclo de Planificación</SheetTitle>
                <SheetDescription>Configura temporadas, macrociclos, mesociclos y microciclos.</SheetDescription>
              </SheetHeader>
              <form onSubmit={handleAddCiclo} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Nombre del Ciclo</label>
                  <Input required placeholder="Ej. Macrociclo Competitivo Apertura" value={newCiclo.nombre} onChange={(e) => setNewCiclo({ ...newCiclo, nombre: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Tipo</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newCiclo.tipo} onChange={(e) => setNewCiclo({ ...newCiclo, tipo: e.target.value as any })}>
                      <option value="temporada">Temporada</option>
                      <option value="macrociclo">Macrociclo</option>
                      <option value="mesociclo">Mesociclo</option>
                      <option value="microciclo">Microciclo</option>
                    </select>
                  </div>
                  {newCiclo.tipo === "macrociclo" && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Fase / Subtipo</label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newCiclo.subtipo} onChange={(e) => setNewCiclo({ ...newCiclo, subtipo: e.target.value })}>
                        <option value="Preparación General">Preparación General</option>
                        <option value="Preparación Específica">Preparación Específica</option>
                        <option value="Competitiva">Competitiva</option>
                        <option value="Transición">Transición</option>
                      </select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Inicio</label>
                    <Input type="date" required value={newCiclo.inicio} onChange={(e) => setNewCiclo({ ...newCiclo, inicio: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Fin</label>
                    <Input type="date" required value={newCiclo.fin} onChange={(e) => setNewCiclo({ ...newCiclo, fin: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Intensidad</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newCiclo.intensidad} onChange={(e) => setNewCiclo({ ...newCiclo, intensidad: e.target.value as any })}>
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Muy alta">Muy alta</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Volumen Total (min)</label>
                    <Input type="number" required value={newCiclo.volumen} onChange={(e) => setNewCiclo({ ...newCiclo, volumen: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Objetivo</label>
                  <Textarea required placeholder="Escribe el objetivo deportivo..." value={newCiclo.objetivo} onChange={(e) => setNewCiclo({ ...newCiclo, objetivo: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">Guardar Ciclo</Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {activeLesiones.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-destructive"><ShieldAlert className="h-4 w-4" /> Alertas Médicas (Riesgo en Planificación)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">Los siguientes jugadores tienen lesiones activas. El planificador les bloqueará la carga excesiva de trabajo y restringirá las sesiones intensas:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeLesiones.map((l) => (
                <Badge key={l.id} variant="secondary" className="bg-destructive/15 text-destructive border-destructive/20 font-medium">
                  {l.jugador} ({l.zonaCorporal}) — RTP: {l.progresoRtp}% — Max carga: {l.cargaPermitida}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stagnantTests.length > 0 && (
        <Card className="border-warning/40 bg-warning/5 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-warning-foreground"><Award className="h-4 w-4" /> Alerta de Rendimiento (Tests Físicos)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">Se detectó estancamiento físico en evaluaciones de atletas. Se recomienda programar microciclos con enfoque en las capacidades rezagadas:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {stagnantTests.map((t) => (
                <Badge key={t.id} variant="outline" className="border-warning/30 text-warning-foreground bg-warning/10">
                  {t.jugador}: Estancado en {t.tipo} ({t.nombreTest}) — Sugerencia: Foco en {t.tipo} en microciclo
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full max-w-[500px] grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="ciclos">Ciclos</TabsTrigger>
          <TabsTrigger value="planificador">Planificador</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-6 mt-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Calendar} label="Sesiones Totales" value={(sesionesRealizadas + sesionesPendientes).toString()} hint={`${sesionesRealizadas} completadas`} accent="primary" />
            <StatCard icon={Timer} label="Horas Planificadas" value={`${totalHoras} hrs`} hint="Volumen total" accent="success" />
            <StatCard icon={Activity} label="Carga Acumulada" value={totalCarga.toLocaleString()} hint="AU (min * RPE)" accent="warning" />
            <StatCard icon={Target} label="Objetivos Activos" value="8" hint="Táctico/Físico/Técnico" accent="destructive" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader>
                <CardTitle>Plan Anual / Temporada</CardTitle>
                <CardDescription>Visualización y estado de los macrociclos actuales</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative border-l pl-4 ml-2 space-y-4">
                  {ciclos.map((c) => (
                    <div key={c.id} className="relative group">
                      <div className="absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full border bg-background flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="p-3 rounded-lg border bg-card hover:shadow-elegant transition">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{c.nombre}</p>
                          <Badge className="capitalize" variant={c.activo ? "default" : "secondary"}>
                            {c.tipo} {c.subtipo ? `(${c.subtipo})` : ""}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{c.inicio} al {c.fin} · Intensidad: {c.intensidad} · {c.volumen} min</p>
                        <p className="text-xs mt-2 italic text-muted-foreground">Objetivo: {c.objetivo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Próximas Competencias</CardTitle>
                <CardDescription>Partidos e hitos del calendario competitivo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sesiones.filter(s => s.tipo === "Competencia").map((s) => (
                  <div key={s.id} className="rounded-lg border p-3 bg-rose-500/5 border-rose-500/20">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{s.nombre}</span>
                      <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20">Competencia</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.fecha} a las {s.hora} · {s.duracion} min</p>
                    <p className="text-xs mt-1 font-medium">{s.equipo}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CICLOS TAB */}
        <TabsContent value="ciclos" className="space-y-4 mt-0">
          <div className="flex items-center justify-between gap-2 border-b pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant={filtroCiclo === "todos" ? "default" : "outline"} onClick={() => setFiltroCiclo("todos")}>Todos</Button>
              <Button size="sm" variant={filtroCiclo === "temporada" ? "default" : "outline"} onClick={() => setFiltroCiclo("temporada")}>Temporadas</Button>
              <Button size="sm" variant={filtroCiclo === "macrociclo" ? "default" : "outline"} onClick={() => setFiltroCiclo("macrociclo")}>Macrociclos</Button>
              <Button size="sm" variant={filtroCiclo === "mesociclo" ? "default" : "outline"} onClick={() => setFiltroCiclo("mesociclo")}>Mesociclos</Button>
              <Button size="sm" variant={filtroCiclo === "microciclo" ? "default" : "outline"} onClick={() => setFiltroCiclo("microciclo")}>Microciclos</Button>
            </div>
          </div>

          <div className="grid gap-3">
            {ciclos.filter(c => filtroCiclo === "todos" || c.tipo === filtroCiclo).map((c) => (
              <div key={c.id} className="rounded-lg border p-4 bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{c.nombre}</p>
                    <Badge variant="outline" className="capitalize text-xs">{c.tipo}</Badge>
                    {c.subtipo && <Badge variant="secondary" className="text-xs">{c.subtipo}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.inicio} al {c.fin} · {c.equipo} · Volumen: {c.volumen} min</p>
                  <p className="text-xs font-medium text-primary">Objetivo: {c.objetivo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDuplicarCiclo(c)}><Copy className="mr-1 h-3.5 w-3.5" />Duplicar</Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">Archivar</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* PLANIFICADOR TAB */}
        <TabsContent value="planificador" className="space-y-4 mt-0">
          <Card className="shadow-card">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle>Planificador Interactivo (Cronograma de Sesiones)</CardTitle>
                <CardDescription>Mueve, reprograma o duplica entrenamientos de la semana</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {diasSemana.map((dia, idx) => {
                  const sesionesDelDia = sesiones.filter(s => s.fecha === dia);
                  return (
                    <div
                      key={dia}
                      className={cn(
                        "rounded-lg border min-h-[220px] flex flex-col transition-all duration-200 bg-muted/10",
                        draggingOverDay === dia ? "border-primary bg-primary/10 scale-[1.03] shadow-md" : "border-border"
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggingOverDay !== dia) setDraggingOverDay(dia);
                      }}
                      onDragLeave={() => setDraggingOverDay(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDraggingOverDay(null);
                        const sessionId = e.dataTransfer.getData("sessionId");
                        if (sessionId) handleRescheduleSesion(sessionId, dia);
                      }}
                    >
                      <div className="border-b bg-muted/40 p-2 text-center text-xs font-semibold uppercase text-muted-foreground rounded-t-lg">{diasNombres[idx]}</div>
                      <div className="p-2 space-y-2 flex-1">
                        {sesionesDelDia.map((s) => (
                          <div
                            key={s.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("sessionId", s.id);
                            }}
                            className={cn(
                              "rounded-md border p-2.5 text-xs shadow-sm cursor-grab active:cursor-grabbing hover:scale-105 hover:shadow-md transition-all duration-150",
                              sesionTipoColor[s.tipo]
                            )}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span>{s.hora}</span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 border-current bg-background/50">{s.tipo}</Badge>
                            </div>
                            <div className="font-semibold truncate mt-1">{s.nombre}</div>
                            <div className="text-[10px] opacity-75 mt-0.5">{s.duracion} min · {s.equipo}</div>

                            {/* Simple reschedule actions to simulate drag/drop or clicks */}
                            <div className="mt-2 pt-1.5 border-t border-current/10 flex items-center justify-between gap-1">
                              <select className="text-[9px] bg-transparent border-0 font-medium cursor-pointer" value={s.fecha} onChange={(e) => handleRescheduleSesion(s.id, e.target.value)}>
                                {diasSemana.map((d, dIdx) => (
                                  <option key={d} value={d} className="bg-popover text-foreground">{diasNombres[dIdx].split(" ")[0]}</option>
                                ))}
                              </select>
                              <button onClick={() => handleDuplicarSesion(s)} title="Duplicar Sesión" className="hover:opacity-100 opacity-60">
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {sesionesDelDia.length === 0 && (
                          <div className="text-[10px] text-muted-foreground text-center py-8">Descanso</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OBJETIVOS TAB */}
        <TabsContent value="objetivos" className="space-y-4 mt-0">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Objetivos Tácticos & Técnicos</CardTitle>
                <CardDescription>Metas del club en fundamentos y sistemas de juego</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 border rounded-lg bg-card space-y-1">
                  <div className="flex items-center justify-between"><span className="font-semibold">Transición Defensiva</span><Badge>Táctico</Badge></div>
                  <p className="text-xs text-muted-foreground">Lograr reagrupar 8 jugadores detrás del balón en menos de 6 segundos.</p>
                </div>
                <div className="p-3 border rounded-lg bg-card space-y-1">
                  <div className="flex items-center justify-between"><span className="font-semibold">Control Orientado</span><Badge>Técnico</Badge></div>
                  <p className="text-xs text-muted-foreground">Mejorar la recepción con perfil abierto en centrocampistas.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Objetivos Físicos & Psicológicos</CardTitle>
                <CardDescription>Planificación de rendimiento físico y mental</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 border rounded-lg bg-card space-y-1">
                  <div className="flex items-center justify-between"><span className="font-semibold">Consumo Máximo VO2</span><Badge>Físico</Badge></div>
                  <p className="text-xs text-muted-foreground">Aumentar un 4% de VO2 promedio en el equipo durante el mesociclo actual.</p>
                </div>
                <div className="p-3 border rounded-lg bg-card space-y-1">
                  <div className="flex items-center justify-between"><span className="font-semibold">Resiliencia y Liderazgo</span><Badge>Psicológico</Badge></div>
                  <p className="text-xs text-muted-foreground">Fortalecer comunicación post-error mediante sesiones dirigidas.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
