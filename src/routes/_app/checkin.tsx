import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  QrCode, ScanLine, Search, CheckCircle2, AlertTriangle, Ban, Clock,
  ShieldCheck, FileText, Stethoscope, Wallet, Activity, MapPin, User,
  Camera, History, Users as UsersIcon, KeyRound, X, Sparkles, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { jugadores, sedes, getPlayerOS, formatCRC, type PlayerOS } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/checkin")({ component: CheckinPage });

type AccessResult = "permitido" | "condicionado" | "restringido";
type LogEntry = {
  id: string;
  jugadorId: string;
  nombre: string;
  avatar: string;
  sede: string;
  entrenador: string;
  hora: string;
  fecha: string;
  estadoOp: string;
  resultado: AccessResult;
  motivo?: string;
  dispositivo: string;
  usuario: string;
  retraso?: number;
};

const seedLogs = (): LogEntry[] => {
  const now = new Date();
  return jugadores.slice(0, 14).map((j, i) => {
    const os = getPlayerOS(j.id)!;
    const minsAgo = 5 + i * 11;
    const t = new Date(now.getTime() - minsAgo * 60_000);
    const resultado: AccessResult =
      os.estadoOp === "restriccion" ? "restringido" : os.estadoOp === "aviso" ? "condicionado" : "permitido";
    return {
      id: `lg-${i}`,
      jugadorId: j.id,
      nombre: j.nombre,
      avatar: j.avatar,
      sede: j.sede,
      entrenador: os.entrenador,
      hora: t.toTimeString().slice(0, 5),
      fecha: t.toISOString().slice(0, 10),
      estadoOp: os.estadoOp,
      resultado,
      motivo:
        resultado === "restringido" ? `Mora ${formatCRC(j.saldo)}` :
        resultado === "condicionado" ? "Documentación por vencer" : undefined,
      dispositivo: i % 3 === 0 ? "Tablet recepción" : i % 3 === 1 ? "Móvil entrenador" : "Kiosko QR",
      usuario: i % 2 === 0 ? "Recepción" : os.entrenador,
      retraso: i % 4 === 0 ? (i % 12) : 0,
    };
  });
};

function statusMeta(estado: string) {
  switch (estado) {
    case "habilitado": return { label: "Habilitado", dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-500/10", ring: "ring-emerald-500/30" };
    case "tolerancia": return { label: "Atraso aceptable", dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-500/10", ring: "ring-emerald-500/30" };
    case "aviso":      return { label: "Aviso",       dot: "bg-amber-500",   text: "text-amber-600",   bg: "bg-amber-500/10",   ring: "ring-amber-500/30" };
    case "restriccion":return { label: "Restringido", dot: "bg-rose-500",    text: "text-rose-600",    bg: "bg-rose-500/10",    ring: "ring-rose-500/30" };
    default:           return { label: estado,        dot: "bg-muted",       text: "text-muted-foreground", bg: "bg-muted",     ring: "ring-border" };
  }
}

function resultMeta(r: AccessResult) {
  if (r === "permitido")   return { Icon: CheckCircle2, label: "Acceso permitido",  text: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
  if (r === "condicionado")return { Icon: AlertTriangle, label: "Acceso condicionado", text: "text-amber-600",  bg: "bg-amber-500/10",  border: "border-amber-500/30" };
  return                          { Icon: Ban,           label: "Acceso restringido", text: "text-rose-600",   bg: "bg-rose-500/10",   border: "border-rose-500/30" };
}

function CheckinPage() {
  const [logs, setLogs] = useState<LogEntry[]>(seedLogs);
  const [sedeFilter, setSedeFilter] = useState<string>("todas");
  const [selected, setSelected] = useState<PlayerOS | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [massOpen, setMassOpen] = useState(false);
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");

  const filteredLogs = useMemo(
    () => (sedeFilter === "todas" ? logs : logs.filter((l) => l.sede === sedeFilter)),
    [logs, sedeFilter],
  );

  const stats = useMemo(() => {
    const hoy = filteredLogs;
    return {
      ingresos: hoy.filter((l) => l.resultado !== "restringido").length,
      bloqueados: hoy.filter((l) => l.resultado === "restringido").length,
      condicionados: hoy.filter((l) => l.resultado === "condicionado").length,
      tardanzas: hoy.filter((l) => (l.retraso ?? 0) > 0).length,
      total: hoy.length,
    };
  }, [filteredLogs]);

  const simulateScan = () => {
    const j = jugadores[Math.floor(Math.random() * jugadores.length)];
    const os = getPlayerOS(j.id)!;
    setSelected(os);
  };

  const registerCheckin = (os: PlayerOS, forced = false) => {
    if (!os) return;
    const j = os.jugador;
    const resultado: AccessResult = forced
      ? "permitido"
      : os.estadoOp === "restriccion" ? "restringido"
      : os.estadoOp === "aviso" ? "condicionado" : "permitido";

    const now = new Date();
    const entry: LogEntry = {
      id: `lg-${Date.now()}`,
      jugadorId: j.id,
      nombre: j.nombre,
      avatar: j.avatar,
      sede: j.sede,
      entrenador: os.entrenador,
      hora: now.toTimeString().slice(0, 5),
      fecha: now.toISOString().slice(0, 10),
      estadoOp: forced ? "habilitado" : os.estadoOp,
      resultado,
      motivo: forced ? `Excepción: ${exceptionReason || "autorizado"}` : undefined,
      dispositivo: "Tablet recepción",
      usuario: forced ? "Admin (excepción)" : "Recepción",
      retraso: 0,
    };
    setLogs((prev) => [entry, ...prev]);

    if (resultado === "permitido") toast.success(`✅ Acceso permitido — ${j.nombre}`);
    else if (resultado === "condicionado") toast.warning(`⚠ Acceso condicionado — ${j.nombre}`);
    else toast.error(`⛔ Acceso restringido — ${j.nombre}`);

    setSelected(null);
    setExceptionOpen(false);
    setExceptionReason("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Centro operativo de acceso
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Check-in inteligente</h1>
          <p className="text-sm text-muted-foreground">
            Escanea, valida y registra el ingreso de atletas en segundos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sedeFilter} onValueChange={setSedeFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las sedes</SelectItem>
              {sedes.map((s) => <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setManualOpen(true)}>
            <Search className="mr-2 h-4 w-4" /> Manual
          </Button>
          <Button onClick={() => setMassOpen(true)}>
            <UsersIcon className="mr-2 h-4 w-4" /> Modo entrenador
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KPI icon={CheckCircle2} label="Ingresos hoy" value={stats.ingresos} tone="emerald" />
        <KPI icon={AlertTriangle} label="Condicionados" value={stats.condicionados} tone="amber" />
        <KPI icon={Ban} label="Bloqueados" value={stats.bloqueados} tone="rose" />
        <KPI icon={Clock} label="Tardanzas" value={stats.tardanzas} tone="violet" />
        <KPI icon={Activity} label="Escaneos totales" value={stats.total} tone="sky" />
      </div>

      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-fit sm:grid-cols-4">
          <TabsTrigger value="scanner"><ScanLine className="mr-2 h-4 w-4" />Scanner</TabsTrigger>
          <TabsTrigger value="recepcion"><Camera className="mr-2 h-4 w-4" />Recepción</TabsTrigger>
          <TabsTrigger value="historial"><History className="mr-2 h-4 w-4" />Historial</TabsTrigger>
          <TabsTrigger value="reglas"><ShieldCheck className="mr-2 h-4 w-4" />Reglas</TabsTrigger>
        </TabsList>

        {/* Scanner */}
        <TabsContent value="scanner" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-5 w-5 text-primary" /> Escáner QR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10">
                  <div className="absolute inset-6 rounded-lg border border-primary/40" />
                  <div className="absolute left-6 right-6 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary/70 shadow-[0_0_12px_2px_var(--color-primary)]" />
                  <div className="absolute left-4 top-4 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-primary" />
                  <div className="absolute right-4 top-4 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-primary" />
                  <div className="absolute bottom-4 left-4 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-primary" />
                  <div className="absolute bottom-4 right-4 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine className="h-16 w-16 text-primary/60" />
                  </div>
                </div>
                <Button className="w-full" onClick={simulateScan}>
                  <ScanLine className="mr-2 h-4 w-4" /> Simular escaneo
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Apunta la cámara al QR del carnet del atleta.
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5 text-primary" /> Últimos accesos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[420px]">
                  <div className="divide-y">
                    {filteredLogs.slice(0, 12).map((l) => {
                      const r = resultMeta(l.resultado);
                      return (
                        <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-muted/40">
                          <Avatar className="h-10 w-10"><AvatarImage src={l.avatar} /><AvatarFallback>{l.nombre[0]}</AvatarFallback></Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Link to="/jugadores/$id" params={{ id: l.jugadorId }} className="truncate font-medium hover:underline">{l.nombre}</Link>
                              <Badge variant="outline" className={`gap-1 ${r.text} ${r.border}`}>
                                <r.Icon className="h-3 w-3" />{r.label}
                              </Badge>
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              <MapPin className="mr-1 inline h-3 w-3" />{l.sede} · {l.entrenador} · {l.dispositivo}
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>{l.hora}</div>
                            {l.motivo && <div className="text-rose-500">{l.motivo}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recepción — pantalla grande */}
        <TabsContent value="recepcion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-5 w-5 text-primary" /> Panel de recepción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredLogs.slice(0, 9).map((l) => {
                  const r = resultMeta(l.resultado);
                  const s = statusMeta(l.estadoOp);
                  return (
                    <div key={l.id} className={`rounded-xl border ${r.border} ${r.bg} p-4`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 ring-2 ring-background"><AvatarImage src={l.avatar} /><AvatarFallback>{l.nombre[0]}</AvatarFallback></Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{l.nombre}</div>
                          <div className="truncate text-xs text-muted-foreground">{l.sede} · {l.hora}</div>
                        </div>
                        <r.Icon className={`h-7 w-7 ${r.text}`} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${s.bg} ${s.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
                        </span>
                        {l.motivo && <span className="text-xs text-muted-foreground">{l.motivo}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial */}
        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-5 w-5 text-primary" /> Historial de accesos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredLogs.map((l) => {
                  const r = resultMeta(l.resultado);
                  return (
                    <div key={l.id} className="flex items-center gap-3 p-3 text-sm">
                      <span className="w-16 text-xs text-muted-foreground">{l.hora}</span>
                      <Avatar className="h-8 w-8"><AvatarImage src={l.avatar} /><AvatarFallback>{l.nombre[0]}</AvatarFallback></Avatar>
                      <Link to="/jugadores/$id" params={{ id: l.jugadorId }} className="min-w-0 flex-1 truncate font-medium hover:underline">{l.nombre}</Link>
                      <span className="hidden text-xs text-muted-foreground md:inline">{l.sede}</span>
                      <span className="hidden text-xs text-muted-foreground lg:inline">{l.entrenador}</span>
                      <span className="hidden text-xs text-muted-foreground lg:inline">{l.dispositivo}</span>
                      <Badge variant="outline" className={`gap-1 ${r.text} ${r.border}`}>
                        <r.Icon className="h-3 w-3" />{r.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reglas */}
        <TabsContent value="reglas">
          <div className="grid gap-4 md:grid-cols-2">
            <RuleCard
              title="Morosidad"
              icon={Wallet}
              rules={[
                { label: "Saldo 0", state: "habilitado" },
                { label: "1 cuota pendiente (dentro de tolerancia)", state: "tolerancia" },
                { label: ">14 días de atraso", state: "aviso" },
                { label: "2+ cuotas vencidas", state: "restriccion" },
              ]}
            />
            <RuleCard
              title="Documentación"
              icon={FileText}
              rules={[
                { label: "Todo vigente", state: "habilitado" },
                { label: "Documento por vencer (<30 días)", state: "aviso" },
                { label: "Documento vencido", state: "restriccion" },
              ]}
            />
            <RuleCard
              title="Médico"
              icon={Stethoscope}
              rules={[
                { label: "Sin restricciones médicas", state: "habilitado" },
                { label: "Medicamento activo / alergia crítica", state: "aviso" },
                { label: "Lesión activa o restricción médica", state: "restriccion" },
              ]}
            />
            <RuleCard
              title="Disciplinario / Administrativo"
              icon={ShieldCheck}
              rules={[
                { label: "Sin sanciones", state: "habilitado" },
                { label: "Sanción menor activa", state: "aviso" },
                { label: "Suspensión disciplinaria/administrativa", state: "restriccion" },
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Ficha operativa rápida (resultado del escaneo) */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          {selected && <QuickProfile os={selected} onConfirm={() => registerCheckin(selected)} onException={() => setExceptionOpen(true)} onClose={() => setSelected(null)} />}
        </DialogContent>
      </Dialog>

      {/* Manual */}
      <ManualDialog open={manualOpen} onOpenChange={setManualOpen} onPick={(os) => { setManualOpen(false); setSelected(os); }} />

      {/* Masivo (entrenador) */}
      <MassDialog open={massOpen} onOpenChange={setMassOpen} onSave={(count) => {
        toast.success(`Asistencia masiva registrada (${count} jugadores)`);
        setMassOpen(false);
      }} />

      {/* Excepción */}
      <Dialog open={exceptionOpen} onOpenChange={setExceptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-amber-500" /> Aprobar excepción</DialogTitle>
            <DialogDescription>Autoriza el ingreso pese a las restricciones. Quedará registrado en auditoría.</DialogDescription>
          </DialogHeader>
          <Textarea value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value.slice(0, 500))} placeholder="Motivo de la excepción (visible en el historial)" rows={4} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setExceptionOpen(false)}>Cancelar</Button>
            <Button onClick={() => selected && registerCheckin(selected, true)} disabled={!exceptionReason.trim()}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Autorizar ingreso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Subcomponents ---------------- */

function KPI({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: "emerald" | "amber" | "rose" | "violet" | "sky" }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    rose: "bg-rose-500/10 text-rose-600",
    violet: "bg-violet-500/10 text-violet-600",
    sky: "bg-sky-500/10 text-sky-600",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function RuleCard({ title, icon: Icon, rules }: { title: string; icon: any; rules: { label: string; state: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Icon className="h-5 w-5 text-primary" /> {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rules.map((r, i) => {
          const m = statusMeta(r.state);
          return (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">{r.label}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${m.bg} ${m.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />{m.label}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function QuickProfile({ os, onConfirm, onException, onClose }: { os: PlayerOS; onConfirm: () => void; onException: () => void; onClose: () => void }) {
  const j = os!.jugador;
  const s = statusMeta(os!.estadoOp);
  const resultado: AccessResult = os!.estadoOp === "restriccion" ? "restringido" : os!.estadoOp === "aviso" ? "condicionado" : "permitido";
  const r = resultMeta(resultado);

  const docVencidos = os!.documentos.filter((d) => d.estado === "vencido").length;
  const docPorVencer = os!.documentos.filter((d) => d.estado === "por vencer").length;
  const lesionActiva = os!.restriccionesMed.length > 0;

  return (
    <div>
      <div className={`relative ${r.bg} p-5`}>
        <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-1 hover:bg-background/60"><X className="h-4 w-4" /></button>
        <div className="flex items-center gap-2">
          <r.Icon className={`h-6 w-6 ${r.text}`} />
          <DialogTitle className={`text-lg ${r.text}`}>{r.label}</DialogTitle>
        </div>
        <DialogDescription className="mt-1">
          Validación automática de finanzas, médico, documentos y disciplina.
        </DialogDescription>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-border"><AvatarImage src={j.avatar} /><AvatarFallback>{j.nombre[0]}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link to="/jugadores/$id" params={{ id: j.id }} className="truncate text-lg font-semibold hover:underline">{j.nombre}</Link>
              <Badge variant="outline">#{os!.numero}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">{j.disciplina} · {j.categoria} · {j.sede}</div>
            <div className="text-xs text-muted-foreground">Entrenador: {os!.entrenador} · {os!.equipo}</div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${s.bg} ${s.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
          </span>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <CheckBlock icon={Wallet} label="Finanzas" ok={j.saldo === 0} warn={os!.estadoOp === "aviso"} bad={os!.estadoOp === "restriccion"} detail={j.saldo === 0 ? "Al día" : formatCRC(j.saldo)} />
          <CheckBlock icon={Stethoscope} label="Médico" ok={!lesionActiva && os!.medicamentos.length === 0} warn={os!.medicamentos.length > 0} bad={lesionActiva} detail={lesionActiva ? "Restricción activa" : os!.medicamentos[0] ?? "Sin restricciones"} />
          <CheckBlock icon={FileText} label="Documentos" ok={docVencidos === 0 && docPorVencer === 0} warn={docPorVencer > 0 && docVencidos === 0} bad={docVencidos > 0} detail={docVencidos > 0 ? `${docVencidos} vencidos` : docPorVencer > 0 ? `${docPorVencer} por vencer` : "Vigentes"} />
          <CheckBlock icon={ShieldCheck} label="Disciplina" ok detail="Sin sanciones" />
        </div>

        {os!.alertas.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Alertas activas</div>
            {os!.alertas.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start gap-2 rounded-lg border p-2 text-xs">
                <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${a.severidad === "critical" ? "text-rose-500" : a.severidad === "warning" ? "text-amber-500" : "text-sky-500"}`} />
                <div className="min-w-0">
                  <div className="font-medium">{a.titulo}</div>
                  <div className="text-muted-foreground">{a.detalle}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="mt-5 gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          {resultado === "restringido" ? (
            <Button variant="outline" onClick={onException}><KeyRound className="mr-2 h-4 w-4" /> Aprobar excepción</Button>
          ) : null}
          <Button onClick={onConfirm} disabled={resultado === "restringido"}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> Registrar check-in
          </Button>
        </DialogFooter>
      </div>
    </div>
  );
}

function CheckBlock({ icon: Icon, label, ok, warn, bad, detail }: { icon: any; label: string; ok?: boolean; warn?: boolean; bad?: boolean; detail: string }) {
  const tone = bad ? "border-rose-500/30 bg-rose-500/5 text-rose-600" : warn ? "border-amber-500/30 bg-amber-500/5 text-amber-600" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-600";
  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <div className="flex items-center gap-2 text-xs font-medium">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{detail}</div>
    </div>
  );
}

function ManualDialog({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; onPick: (os: PlayerOS) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return jugadores.slice(0, 8);
    return jugadores.filter((j) => j.nombre.toLowerCase().includes(term) || j.identificacion.includes(term)).slice(0, 12);
  }, [q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Check-in manual</DialogTitle>
          <DialogDescription>Busca al atleta por nombre o identificación.</DialogDescription>
        </DialogHeader>
        <Input autoFocus placeholder="Nombre o identificación…" value={q} onChange={(e) => setQ(e.target.value)} />
        <ScrollArea className="h-72 rounded-lg border">
          <div className="divide-y">
            {results.map((j) => {
              const os = getPlayerOS(j.id)!;
              const s = statusMeta(os.estadoOp);
              return (
                <button key={j.id} onClick={() => onPick(os)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50">
                  <Avatar className="h-9 w-9"><AvatarImage src={j.avatar} /><AvatarFallback>{j.nombre[0]}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{j.nombre}</div>
                    <div className="truncate text-xs text-muted-foreground">{j.identificacion} · {j.sede}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${s.bg} ${s.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

type MassState = "presente" | "tarde" | "ausente" | "justificado";
function MassDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (v: boolean) => void; onSave: (count: number) => void }) {
  const roster = useMemo(() => jugadores.slice(0, 16), []);
  const [estados, setEstados] = useState<Record<string, MassState>>(() =>
    Object.fromEntries(roster.map((j) => [j.id, "presente" as MassState])),
  );
  const opts: { v: MassState; label: string; cls: string }[] = [
    { v: "presente",    label: "P", cls: "bg-emerald-500 text-white" },
    { v: "tarde",       label: "T", cls: "bg-amber-500 text-white" },
    { v: "ausente",     label: "A", cls: "bg-rose-500 text-white" },
    { v: "justificado", label: "J", cls: "bg-sky-500 text-white" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5" /> Check-in masivo</DialogTitle>
          <DialogDescription>Modo entrenador: marca asistencia de todo el equipo desde el móvil.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[420px] rounded-lg border">
          <div className="divide-y">
            {roster.map((j) => (
              <div key={j.id} className="flex items-center gap-3 p-2.5">
                <Avatar className="h-8 w-8"><AvatarImage src={j.avatar} /><AvatarFallback>{j.nombre[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{j.nombre}</div>
                  <div className="truncate text-xs text-muted-foreground">{j.categoria}</div>
                </div>
                <div className="flex gap-1">
                  {opts.map((o) => {
                    const active = estados[j.id] === o.v;
                    return (
                      <button
                        key={o.v}
                        onClick={() => setEstados((p) => ({ ...p, [j.id]: o.v }))}
                        className={`h-8 w-8 rounded-md text-xs font-bold transition ${active ? o.cls : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
                        title={o.v}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(roster.length)}><CheckCircle2 className="mr-2 h-4 w-4" /> Guardar asistencia</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
