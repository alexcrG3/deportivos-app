import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { StatCard } from "@/components/stat-card";
import { useMemo } from "react";
import RendimientoStore, { type Lesion } from "@/lib/rendimiento-store";
import { Activity, Plus, ShieldAlert, Sparkles, HeartPulse, Stethoscope, ChevronRight, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_app/rendimiento/lesiones")({ component: LesionesPage });

function LesionesPage() {
  const [lesiones, setLesiones] = useState<Lesion[]>([]);
  const [openNewLesion, setOpenNewLesion] = useState(false);
  const [selectedTeamName, setSelectedTeamName] = useState<string>("all");

  const { role, coachName } = useRole();
  const isAdmin = role === "admin";

  const myTeams = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (isAdmin) return all;
    return all.filter(t => t.entrenador === coachName);
  }, [isAdmin, coachName]);

  const myCategories = useMemo(() => myTeams.map(t => t.categoria), [myTeams]);

  // Load real players dynamically to register injuries
  const dbPlayers = useMemo(() => {
    const raw = RendimientoStore.getJugadores();
    if (isAdmin) return raw;
    return raw.filter(p => myCategories.includes(p.categoria));
  }, [isAdmin, myCategories]);

  // Form state
  const [newLesion, setNewLesion] = useState({
    jugadorId: "",
    jugador: "",
    fecha: new Date().toISOString().split("T")[0],
    tipo: "Contractura",
    zonaCorporal: "Isquiotibiales",
    gravedad: "Leve" as any,
    diagnostico: "Contractura muscular leve",
    tratamiento: ["Reposo activo", "Fisioterapia"],
    dolor: 3,
    movilidad: 90,
    progresoRtp: 80,
    retornoChecklist: { altaMedica: false, altaDeportiva: false, sinDolor: true, movilidadCompleta: true },
    restricciones: "Evitar sprints",
    cargaPermitida: 75,
    completada: false,
  });

  // Set initial player in form state when players are loaded
  useEffect(() => {
    if (dbPlayers.length > 0 && !newLesion.jugadorId) {
      setNewLesion(prev => ({
        ...prev,
        jugadorId: dbPlayers[0].id,
        jugador: dbPlayers[0].nombre,
      }));
    }
  }, [dbPlayers]);

  const loadData = () => {
    const raw = RendimientoStore.getLesiones();
    let filtered = raw;

    if (!isAdmin) {
      const players = RendimientoStore.getJugadores();
      filtered = filtered.filter(l => {
        const p = players.find(x => x.id === l.jugadorId);
        return p && myCategories.includes(p.categoria);
      });
    }

    if (selectedTeamName !== "all") {
      const selTeamObj = myTeams.find(t => 
        t.nombre.toLowerCase().trim() === selectedTeamName.toLowerCase().trim()
      );
      if (selTeamObj) {
        const cat = (selTeamObj.categoria || "").toLowerCase().trim();
        const nom = (selTeamObj.nombre || "").toLowerCase().trim();
        const players = RendimientoStore.getJugadores();
        
        filtered = filtered.filter(l => {
          const p = players.find(x => x.id === l.jugadorId);
          if (!p || !p.categoria) return false;
          const pCat = p.categoria.toLowerCase().trim();
          return pCat === cat || pCat === nom || nom.includes(pCat) || pCat.includes(nom);
        });
      }
    }

    setLesiones(filtered);
  };

  useEffect(() => {
    loadData();
  }, [myCategories, isAdmin, selectedTeamName]);

  const handleAddLesion = (e: React.FormEvent) => {
    e.preventDefault();
    RendimientoStore.addLesion(newLesion);
    toast.success("Expediente de lesión registrado con éxito");
    setOpenNewLesion(false);
    loadData();
  };

  const handleUpdateRtp = (id: string, progress: number, completada: boolean = false) => {
    RendimientoStore.updateLesion(id, {
      progresoRtp: progress,
      completada,
      retornoChecklist: {
        altaMedica: progress >= 90,
        altaDeportiva: progress === 100,
        sinDolor: true,
        movilidadCompleta: progress >= 80,
      },
    });
    toast.success("Progreso de retorno al deporte (RTP) actualizado");
    loadData();
  };

  const activeCount = lesiones.filter(l => !l.completada).length;
  const criticalCount = lesiones.filter(l => !l.completada && l.gravedad === "Grave").length;
  const activeLesiones = lesiones.filter(l => !l.completada);
  const rtpValue = activeLesiones.length > 0 
    ? `${Math.round(activeLesiones.reduce((sum, l) => sum + l.progresoRtp, 0) / activeLesiones.length)}%` 
    : "100%";
  const rtpHint = activeLesiones.length > 0 
    ? "Progreso de retorno al deporte" 
    : "Sin deportistas lesionados";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expediente Médico & Lesiones</h1>
          <p className="text-sm text-muted-foreground">Control médico de lesiones, rehabilitación, tratamientos de fisioterapia y retorno al deporte (RTP).</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Equipo:</span>
          <select
            value={selectedTeamName}
            onChange={(e) => setSelectedTeamName(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs font-bold shadow-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground mr-2"
          >
            <option value="all">Todos los equipos</option>
            {myTeams.map((t) => (
              <option key={t.id} value={t.nombre}>
                {t.nombre}
              </option>
            ))}
          </select>
          <Sheet open={openNewLesion} onOpenChange={setOpenNewLesion}>
          <SheetTrigger asChild>
            <Button className="bg-gradient-primary shadow-elegant"><Plus className="mr-1 h-4 w-4" />Registrar Lesión</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Registrar Lesión Deportiva</SheetTitle>
              <SheetDescription>Completa los detalles de la lesión y restricciones del atleta.</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleAddLesion} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Jugador</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required value={newLesion.jugadorId} onChange={(e) => {
                  const targetPlayer = dbPlayers.find(p => p.id === e.target.value);
                  setNewLesion({ ...newLesion, jugadorId: e.target.value, jugador: targetPlayer?.nombre || "" });
                }}>
                  {dbPlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Tipo de Lesión</label>
                  <Input required placeholder="Ej. Esguince, Desgarro" value={newLesion.tipo} onChange={(e) => setNewLesion({ ...newLesion, tipo: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Zona Corporal</label>
                  <Input required placeholder="Ej. Muslo izquierdo" value={newLesion.zonaCorporal} onChange={(e) => setNewLesion({ ...newLesion, zonaCorporal: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Gravedad</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newLesion.gravedad} onChange={(e) => setNewLesion({ ...newLesion, gravedad: e.target.value as any })}>
                    <option value="Leve">Leve</option>
                    <option value="Moderada">Moderada</option>
                    <option value="Grave">Grave</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Carga Max Permitida (%)</label>
                  <Input type="number" required value={newLesion.cargaPermitida} onChange={(e) => setNewLesion({ ...newLesion, cargaPermitida: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Diagnóstico Médico</label>
                <Textarea required placeholder="Escribe el diagnóstico..." value={newLesion.diagnostico} onChange={(e) => setNewLesion({ ...newLesion, diagnostico: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Restricciones de Entrenamiento</label>
                <Input required placeholder="Ej. No hacer saltos, sólo trote ligero" value={newLesion.restricciones} onChange={(e) => setNewLesion({ ...newLesion, restricciones: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Guardar Expediente</Button>
            </form>
          </SheetContent>
        </Sheet>
        </div>
      </div>

      {lesiones.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <HeartPulse className="h-10 w-10 text-muted-foreground animate-pulse" />
            <p className="text-sm font-medium">No hay expedientes médicos de lesión registrados para este equipo</p>
            <p className="text-xs text-center max-w-sm">Todo está en orden. El equipo no presenta lesiones activas ni historial clínico guardado.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={HeartPulse} label="Lesiones Activas" value={activeCount.toString()} hint="En fase de rehabilitación" accent="primary" />
        <StatCard icon={ShieldAlert} label="Alertas Críticas" value={criticalCount.toString()} hint="Gravedad alta" accent="destructive" />
        <StatCard icon={Stethoscope} label="RTP Promedio" value={rtpValue} hint={rtpHint} accent="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle>Historial Clínico y Expedientes Activos</CardTitle>
            <CardDescription>Seguimiento de lesiones y tratamientos físicos en curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lesiones.length === 0 && <p className="text-sm text-muted-foreground py-6">Sin historial ni expedientes de lesión registrados.</p>}
            {lesiones.map((l) => (
              <div key={l.id} className="p-4 rounded-lg border bg-card hover:shadow-elegant transition space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-sm mr-2">{l.jugador}</span>
                    <Badge variant={l.completada ? "secondary" : "destructive"}>{l.completada ? "Alta" : "Activa"}</Badge>
                    <Badge variant="outline" className="ml-1 text-xs">{l.gravedad}</Badge>
                    <Badge variant="secondary" className="ml-1 text-xs bg-violet-500/10 text-violet-400 border-violet-500/20">
                      {RendimientoStore.getJugadores().find(p => p.id === l.jugadorId)?.categoria || "Sin categoría"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">Registro: {l.fecha}</span>
                </div>
                <p className="text-xs text-muted-foreground">**Diagnóstico:** {l.diagnostico}</p>
                <p className="text-xs text-muted-foreground">**Tratamiento:** {l.tratamiento.join(", ")}</p>
                <div className="text-xs space-y-1 border-t pt-2 mt-2">
                  <p className="font-semibold text-primary">Restricciones de Carga: {l.restricciones} (Máx: {l.cargaPermitida}%)</p>
                  <p>Progreso RTP: {l.progresoRtp}%</p>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                    <div className="h-full bg-primary" style={{ width: `${l.progresoRtp}%` }} />
                  </div>
                </div>

                {!l.completada && (
                  <div className="pt-2 flex gap-2">
                    <Button size="xs" variant="outline" onClick={() => handleUpdateRtp(l.id, 80)}>Avanzar RTP (80%)</Button>
                    <Button size="xs" variant="default" onClick={() => handleUpdateRtp(l.id, 100, true)}>Dar de Alta (100%)</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> IA Lesiones & Recaídas</CardTitle>
            <CardDescription>Predicciones de seguridad física y médica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {activeLesiones.length === 0 && <p className="text-xs text-muted-foreground py-4">Sin factores de riesgo o alertas de recaída detectadas hoy.</p>}
            {activeLesiones.map(l => (
              <div key={l.id} className="p-3 border rounded-lg bg-destructive/5 border-destructive/20 space-y-1">
                <div className="flex items-center justify-between font-semibold text-destructive">
                  <span>{l.jugador}</span>
                  <span>Riesgo de Recaída</span>
                </div>
                <p className="text-xs text-muted-foreground">Riesgo estimado: 35%. La carga actual debe restringirse al {l.cargaPermitida}% de volumen habitual.</p>
              </div>
            ))}
            {activeLesiones.length > 0 && (
              <div className="p-3 border rounded-lg bg-card space-y-2">
                <p className="font-semibold text-xs flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Documentos Adjuntos</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between border-b pb-1">
                    <span>Radiografia_Tobillo.png</span>
                    <Badge variant="outline" className="text-[10px]">RX</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Resonancia_Muscular.pdf</span>
                    <Badge variant="outline" className="text-[10px]">RMN</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </>
      )}
    </div>
  );
}
