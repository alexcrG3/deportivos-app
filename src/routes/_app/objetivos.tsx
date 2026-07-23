import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { playerObjectives as initialObjectives } from "@/lib/mock-data";
import { Flag, Plus, Calendar, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";
import RendimientoStore from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/lib/supabase";
import { CoachOsBanner } from "@/components/coach-os-banner";

export const Route = createFileRoute("/_app/objetivos")({ component: ObjetivosPage });

const tipoMeta: Record<string, string> = {
  tecnico: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  tactico: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
  fisico: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  psicologico: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20",
  disciplinario: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

interface Objective {
  id: string;
  jugadorId?: string;
  jugador: string;
  avatar: string;
  tipo: "tecnico" | "tactico" | "fisico" | "psicologico" | "disciplinario";
  titulo: string;
  progreso: number;
  fechaInicio: string;
  fechaObjetivo: string;
  observaciones: string;
  estado: "en_progreso" | "completado";
}

function ObjetivosPage() {
  const { role, coachName, selectedCoachId, selectedCoachName } = useRole();
  const [list, setList] = useState<Objective[]>([]);
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<Objective | null>(null);

  // Obtener equipos del coach/admin
  const dynamicEquipos = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (role === "admin") return all;
    return all.filter(t => t.entrenador === coachName);
  }, [role, coachName]);

  // Helper para normalizar categorías
  const normalizeCategoryName = (s: string) => {
    return s.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace("elite", "")
      .replace("sub", "")
      .replace("futbol", "")
      .replace("femenino", "")
      .trim();
  };

  // Obtener jugadores del coach/admin
  const dynamicJugadores = useMemo(() => {
    const allPlayers = RendimientoStore.getJugadores();
    if (role === "admin") return allPlayers;
    
    return allPlayers.filter(p => {
      const pCat = normalizeCategoryName(p.categoria || "");
      return dynamicEquipos.some(eq => {
        const tCat = normalizeCategoryName(eq.categoria || eq.nombre || "");
        return pCat === tCat || (tCat && pCat.includes(tCat)) || (pCat && tCat.includes(pCat));
      });
    });
  }, [role, dynamicEquipos]);

  // Form states
  const [form, setForm] = useState({
    jugadorId: "",
    tipo: "tecnico" as Objective["tipo"],
    titulo: "",
    progreso: 20,
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaObjetivo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // +30 days
    observaciones: "",
    estado: "en_progreso" as Objective["estado"],
  });

  // Inicializar jugadorId por defecto una vez que se cargan los jugadores
  useEffect(() => {
    if (dynamicJugadores.length > 0 && !form.jugadorId) {
      setForm(f => ({ ...f, jugadorId: dynamicJugadores[0].id }));
    }
  }, [dynamicJugadores]);

  // Load from Supabase (objetivos_jugadores) or fallback to mock
  const loadObjetivos = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const { data, error } = await supabase
      .from("objetivos_jugadores")
      .select("*")
      .eq("organizacion_id", orgId)
      .order("fecha_inicio", { ascending: false });

    if (error || !data || data.length === 0) {
      // Fallback to mock data if no DB records exist
      setList(initialObjectives as Objective[]);
      return;
    }

    const mapped: Objective[] = data.map((o: any) => ({
      id: o.id,
      jugadorId: o.jugador_id,
      jugador: o.jugador,
      avatar: o.avatar || "",
      tipo: o.tipo || "tecnico",
      titulo: o.titulo,
      progreso: o.progreso || 0,
      fechaInicio: o.fecha_inicio,
      fechaObjetivo: o.fecha_objetivo,
      observaciones: o.observaciones || "",
      estado: o.estado || "en_progreso",
    }));
    setList(mapped);
  };

  useEffect(() => {
    loadObjetivos();
  }, [selectedCoachId, role]);

  const saveToStorage = async (updated: Objective[]) => {
    setList(updated);
    // Persist to Supabase
    const orgId = RendimientoStore.getActiveOrganizacionId();
    for (const o of updated) {
      await supabase.from("objetivos_jugadores").upsert({
        id: o.id,
        jugador_id: o.jugadorId,
        jugador: o.jugador,
        avatar: o.avatar,
        tipo: o.tipo,
        titulo: o.titulo,
        progreso: o.progreso,
        fecha_inicio: o.fechaInicio,
        fecha_objetivo: o.fechaObjetivo,
        observaciones: o.observaciones,
        estado: o.estado,
        organizacion_id: orgId,
      });
    }
  };

  const handleCreate = () => {
    if (!form.titulo.trim()) {
      toast.error("El título del objetivo es obligatorio.");
      return;
    }
    const targetPlayer = dynamicJugadores.find(j => j.id === form.jugadorId) || dynamicJugadores[0];
    if (!targetPlayer) {
      toast.error("No hay ningún jugador disponible para asignar.");
      return;
    }
    const newItem: Objective = {
      id: `obj_${Date.now()}`,
      jugadorId: targetPlayer.id,
      jugador: targetPlayer.nombre,
      avatar: targetPlayer.avatar,
      tipo: form.tipo,
      titulo: form.titulo,
      progreso: form.progreso,
      fechaInicio: form.fechaInicio,
      fechaObjetivo: form.fechaObjetivo,
      observaciones: form.observaciones,
      estado: form.estado,
    };

    const updated = [newItem, ...list];
    saveToStorage(updated);
    setIsOpenCreate(false);

    // Reset form
    setForm({
      jugadorId: dynamicJugadores[0]?.id || "",
      tipo: "tecnico",
      titulo: "",
      progreso: 20,
      fechaInicio: new Date().toISOString().slice(0, 10),
      fechaObjetivo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      observaciones: "",
      estado: "en_progreso",
    });
    toast.success("¡Nuevo objetivo de rendimiento establecido!");
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    if (!editingItem.titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }
    const updated = list.map(item => item.id === editingItem.id ? editingItem : item);
    saveToStorage(updated);
    setEditingItem(null);
    toast.success("¡Objetivo del deportista actualizado!");
  };

  const handleDelete = (id: string, title: string) => {
    const updated = list.filter(item => item.id !== id);
    saveToStorage(updated);
    toast.success(`Objetivo "${title}" eliminado.`);
  };

  return (
    <div className="space-y-6">
      <CoachOsBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Objetivos individuales</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" && selectedCoachName
              ? `Objetivos asignados por ${selectedCoachName}`
              : "Seguimiento de metas por atleta — visible en su Player OS."}
          </p>
        </div>
        <Button onClick={() => setIsOpenCreate(true)}>
          <Plus className="mr-1 h-4 w-4" />Nuevo objetivo
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((o) => (
          <Card key={o.id} className="shadow-card transition-all hover:shadow-elegant bg-card border-border flex flex-col justify-between">
            <div>
              <CardHeader className="flex-row items-start justify-between space-y-0 p-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={o.avatar} />
                    <AvatarFallback>{o.jugador[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-bold text-foreground truncate">{o.jugador}</CardTitle>
                    <Badge variant="secondary" className={`mt-1 capitalize text-[9px] font-bold border ${tipoMeta[o.tipo] || "bg-muted text-muted-foreground"}`}>
                      {o.tipo}
                    </Badge>
                  </div>
                </div>
                {o.estado === "completado" ? (
                  <Badge className="bg-success/10 text-success border border-success/20 text-[9px] font-bold" variant="secondary">Completado</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] font-bold border-border">En progreso</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <p className="text-xs font-bold text-foreground flex items-start gap-2 leading-snug">
                  <Flag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {o.titulo}
                </p>
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Progreso del Objetivo</span>
                    <span className="font-semibold text-foreground">{o.progreso}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border/30">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/70" style={{ width: `${o.progreso}%` }} />
                  </div>
                </div>
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> {o.fechaInicio} → {o.fechaObjetivo}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/20 p-2 rounded-lg border border-border/55">{o.observaciones}</p>
              </CardContent>
            </div>
            
            <div className="p-4 pt-0 flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="xs" 
                className="text-[10px] border-border h-7 font-bold px-2.5"
                onClick={() => setEditingItem(o)}
              >
                <Edit2 className="h-3 w-3 mr-1" /> Editar
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg border border-transparent"
                onClick={() => handleDelete(o.id, o.titulo)}
                title="Eliminar objetivo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Establecer Nuevo Objetivo
              </CardTitle>
              <button 
                onClick={() => setIsOpenCreate(false)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Seleccionar Jugador *</label>
                  <select 
                    value={form.jugadorId}
                    onChange={e => setForm(f => ({ ...f, jugadorId: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {dynamicJugadores.map(jg => (
                      <option key={jg.id} value={jg.id} className="bg-background text-foreground">{jg.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo de Meta *</label>
                  <select 
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Objective["tipo"] }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="tecnico">Técnico</option>
                    <option value="tactico">Táctico</option>
                    <option value="fisico">Físico</option>
                    <option value="psicologico">Psicológico</option>
                    <option value="disciplinario">Disciplinario</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Título / Meta del Objetivo *</label>
                <input 
                  type="text" 
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="E.g. Lograr 85% de efectividad en tiros libres"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Inicio *</label>
                  <input 
                    type="date" 
                    value={form.fechaInicio}
                    onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Límite *</label>
                  <input 
                    type="date" 
                    value={form.fechaObjetivo}
                    onChange={e => setForm(f => ({ ...f, fechaObjetivo: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Progreso Inicial (%)</label>
                  <input 
                    type="number" 
                    value={form.progreso}
                    onChange={e => setForm(f => ({ ...f, progreso: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado Inicial</label>
                  <select 
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as Objective["estado"] }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="en_progreso">En Progreso</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Observaciones / Notas adicionales</label>
                <textarea 
                  value={form.observaciones}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  placeholder="Notas sobre el plan de acción..."
                  className="w-full h-16 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleCreate}
                >
                  Establecer Objetivo
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs" 
                  onClick={() => setIsOpenCreate(false)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" /> Editar Objetivo
              </CardTitle>
              <button 
                onClick={() => setEditingItem(null)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Jugador</label>
                  <input 
                    type="text" 
                    value={editingItem.jugador}
                    disabled
                    className="w-full h-9 rounded-lg border border-input bg-muted px-3 text-xs text-muted-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo de Meta *</label>
                  <select 
                    value={editingItem.tipo}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, tipo: e.target.value as Objective["tipo"] } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="tecnico">Técnico</option>
                    <option value="tactico">Táctico</option>
                    <option value="fisico">Físico</option>
                    <option value="psicologico">Psicológico</option>
                    <option value="disciplinario">Disciplinario</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Título / Meta del Objetivo *</label>
                <input 
                  type="text" 
                  value={editingItem.titulo}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Inicio *</label>
                  <input 
                    type="date" 
                    value={editingItem.fechaInicio}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, fechaInicio: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Límite *</label>
                  <input 
                    type="date" 
                    value={editingItem.fechaObjetivo}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, fechaObjetivo: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Progreso (%)</label>
                  <input 
                    type="number" 
                    value={editingItem.progreso}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, progreso: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado</label>
                  <select 
                    value={editingItem.estado}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, estado: e.target.value as Objective["estado"] } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="en_progreso">En Progreso</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Observaciones / Notas</label>
                <textarea 
                  value={editingItem.observaciones}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, observaciones: e.target.value } : null)}
                  className="w-full h-16 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleUpdate}
                >
                  Guardar Cambios
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs" 
                  onClick={() => setEditingItem(null)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ObjetivosPage;
