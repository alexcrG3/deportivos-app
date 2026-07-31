import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flag, Plus, Calendar, Trash2, Edit2, Loader2, RefreshCw } from "lucide-react";
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
  entrenador?: string;
}

function ObjetivosPage() {
  const { role, coachName, selectedCoachId, selectedCoachName } = useRole();
  const [list, setList] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<Objective | null>(null);

  // Nombre del entrenador efectivo seleccionado en la vista
  const effectiveCoachName = useMemo(() => {
    if (role === "admin" && selectedCoachName) {
      return selectedCoachName;
    }
    if (role === "coach" && coachName) {
      return coachName;
    }
    return selectedCoachName || coachName || "";
  }, [role, selectedCoachName, coachName]);

  // Equipos asignados al entrenador activo
  const dynamicEquipos = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (!effectiveCoachName) return all;
    return all.filter(t => t.entrenador === effectiveCoachName);
  }, [effectiveCoachName]);

  // Jugadores pertenecientes al entrenador activo
  const dynamicJugadores = useMemo(() => {
    const allPlayers = RendimientoStore.getJugadores();
    if (!effectiveCoachName) return allPlayers;
    if (dynamicEquipos.length === 0) return [];
    
    const isFemaleTeam = dynamicEquipos.some(t => {
      const combined = ((t.nombre || "") + " " + (t.categoria || "")).toLowerCase();
      return combined.includes("femenin") || combined.includes("fem");
    });

    return allPlayers.filter(p => {
      const pGender = (p.genero || "").toLowerCase();
      const pCat = (p.categoria || "").toLowerCase();
      const pTeam = (p.equipo || "").toLowerCase();
      const isFemalePlayer = pGender.includes("fem") || pCat.includes("femenin") || pTeam.includes("femenin");

      if (isFemaleTeam !== isFemalePlayer) return false;

      const normPCat = pCat.replace(/f[úu]tbol/g, "").trim();
      return dynamicEquipos.some(t => {
        const eqName = (t.nombre || "").toLowerCase().replace(/f[úu]tbol/g, "").trim();
        const eqCat = (t.categoria || "").toLowerCase().replace(/f[úu]tbol/g, "").trim();
        if (!eqName && !eqCat) return true;
        return (
          (eqCat && (normPCat.includes(eqCat) || eqCat.includes(normPCat))) ||
          (eqName && (pTeam.includes(eqName) || eqName.includes(pTeam) || normPCat.includes(eqName)))
        );
      });
    });
  }, [effectiveCoachName, dynamicEquipos]);

  // Form states
  const [form, setForm] = useState({
    jugadorId: "",
    tipo: "tecnico" as Objective["tipo"],
    titulo: "",
    progreso: 20,
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaObjetivo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    observaciones: "",
    estado: "en_progreso" as Objective["estado"],
  });

  useEffect(() => {
    if (dynamicJugadores.length > 0) {
      setForm(f => ({ ...f, jugadorId: dynamicJugadores[0].id }));
    }
  }, [dynamicJugadores]);

  // CARGA 100% EN VIVO DESDE SUPABASE
  const loadObjetivos = async () => {
    setLoading(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    
    const { data, error } = await supabase
      .from("objetivos_jugadores")
      .select("*")
      .eq("organizacion_id", orgId)
      .order("fecha_inicio", { ascending: false });

    if (error) {
      console.error("[Supabase Error] No se pudieron obtener los objetivos:", error.message);
      toast.error("Error consultando Supabase: " + error.message);
      setList([]);
      setLoading(false);
      return;
    }

    const mapped: Objective[] = (data || []).map((o: any) => ({
      id: o.id,
      jugadorId: o.jugador_id,
      jugador: o.jugador,
      avatar: o.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      tipo: o.tipo || "tecnico",
      titulo: o.titulo,
      progreso: o.progreso || 0,
      fechaInicio: o.fecha_inicio,
      fechaObjetivo: o.fecha_objetivo,
      observaciones: o.observaciones || "",
      estado: o.estado || "en_progreso",
      entrenador: o.entrenador || "",
    }));

    setList(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadObjetivos();
  }, [selectedCoachId, role, effectiveCoachName]);

  // VACIAR TODOS LOS REGISTROS DE PRUEBA DE LA TABLA EN SUPABASE
  const handlePurgeSupabase = async () => {
    if (!confirm("¿Deseas eliminar permanentemente TODOS los registros de objetivos guardados en Supabase para dejar la tabla limpia?")) {
      return;
    }
    setLoading(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const { error } = await supabase
      .from("objetivos_jugadores")
      .delete()
      .eq("organizacion_id", orgId);

    if (error) {
      toast.error("Error al borrar en Supabase: " + error.message);
      setLoading(false);
      return;
    }

    setList([]);
    setLoading(false);
    toast.success("¡Tabla 'objetivos_jugadores' vaciada completamente en Supabase!");
  };

  // Filtrado por entrenador seleccionado (Muestra información de TODOS hasta que se seleccione uno)
  const filteredList = useMemo(() => {
    const activeCoach = (effectiveCoachName || "").trim().toLowerCase();

    return list.filter(o => {
      // Si hay un entrenador activo seleccionado, filtrar por ese entrenador
      if (activeCoach) {
        return o.entrenador?.toLowerCase().trim() === activeCoach;
      }
      // Si no se ha seleccionado entrenador (— Seleccionar Entrenador —), mostrar la información de TODOS
      return true;
    });
  }, [list, effectiveCoachName]);

  // CREAR OBJETIVO EN SUPABASE
  const handleCreate = async () => {
    if (!form.titulo.trim()) {
      toast.error("El título del objetivo es obligatorio.");
      return;
    }
    const targetPlayer = dynamicJugadores.find(j => j.id === form.jugadorId) || dynamicJugadores[0];
    if (!targetPlayer) {
      toast.error("No hay ningún jugador disponible para asignar.");
      return;
    }

    const orgId = RendimientoStore.getActiveOrganizacionId();
    const newId = `obj_${Date.now()}`;
    const activeCoach = effectiveCoachName || coachName || "";

    const newItemPayload = {
      id: newId,
      jugador_id: targetPlayer.id,
      jugador: targetPlayer.nombre,
      avatar: targetPlayer.avatar,
      tipo: form.tipo,
      titulo: form.titulo,
      progreso: form.progreso,
      fecha_inicio: form.fechaInicio,
      fecha_objetivo: form.fechaObjetivo,
      observaciones: form.observaciones,
      estado: form.estado,
      entrenador: activeCoach,
      organizacion_id: orgId,
    };

    const { error } = await supabase.from("objetivos_jugadores").insert([newItemPayload]);

    if (error) {
      toast.error("Error al guardar en Supabase: " + error.message);
      return;
    }

    const newObjItem: Objective = {
      id: newId,
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
      entrenador: activeCoach,
    };

    setList(prev => [newObjItem, ...prev]);
    setIsOpenCreate(false);
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
    toast.success("¡Objetivo guardado directamente en Supabase!");
  };

  // ACTUALIZAR OBJETIVO EN SUPABASE
  const handleUpdate = async () => {
    if (!editingItem) return;
    if (!editingItem.titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }

    const { error } = await supabase
      .from("objetivos_jugadores")
      .update({
        jugador: editingItem.jugador,
        tipo: editingItem.tipo,
        titulo: editingItem.titulo,
        progreso: editingItem.progreso,
        fecha_inicio: editingItem.fechaInicio,
        fecha_objetivo: editingItem.fechaObjetivo,
        observaciones: editingItem.observaciones,
        estado: editingItem.estado,
        entrenador: editingItem.entrenador,
      })
      .eq("id", editingItem.id);

    if (error) {
      toast.error("Error al actualizar en Supabase: " + error.message);
      return;
    }

    setList(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
    setEditingItem(null);
    toast.success("¡Objetivo actualizado en Supabase!");
  };

  // ELIMINAR OBJETIVO DE SUPABASE
  const handleDelete = async (id: string, title: string) => {
    const { error } = await supabase
      .from("objetivos_jugadores")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar en Supabase: " + error.message);
      return;
    }

    setList(prev => prev.filter(item => item.id !== id));
    toast.success(`Objetivo "${title}" eliminado de Supabase.`);
  };

  return (
    <div className="space-y-6">
      <CoachOsBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-header-title">Objetivos individuales</h1>
          <p className="page-header-subtitle">
            {effectiveCoachName
              ? `Objetivos asignados por ${effectiveCoachName} — Datos 100% en vivo (Supabase)`
              : "Seguimiento de metas por atleta — Datos 100% en vivo (Supabase)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadObjetivos} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refrescar Supabase
          </Button>
          <Button variant="destructive" size="sm" onClick={handlePurgeSupabase} disabled={loading}>
            <Trash2 className="h-4 w-4 mr-1" /> Vaciar Supabase
          </Button>
          <Button onClick={() => setIsOpenCreate(true)}>
            <Plus className="mr-1 h-4 w-4" />Nuevo objetivo
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center bg-card border-border">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground">Consultando base de datos Supabase...</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.length === 0 ? (
            <Card className="col-span-full p-8 text-center bg-card border-border border-dashed">
              <Flag className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <h3 className="text-base font-bold text-foreground">No hay objetivos asignados</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {effectiveCoachName 
                  ? `No se encontraron objetivos guardados en Supabase para el profesor ${effectiveCoachName}.`
                  : "No se encontraron objetivos registrados en la base de datos de Supabase."}
              </p>
              <Button size="sm" className="mt-4" onClick={() => setIsOpenCreate(true)}>
                <Plus className="mr-1 h-4 w-4" /> Crear Nuevo Objetivo en Supabase
              </Button>
            </Card>
          ) : (
            filteredList.map((o) => (
              <Card key={o.id} className="premium-card hover:shadow-sm transition-all flex flex-col justify-between">
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
                    title="Eliminar objetivo de Supabase"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Guardar Objetivo en Supabase
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
                  placeholder="Detalles sobre el plan de acción..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsOpenCreate(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleCreate}>Guardar en Supabase</Button>
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
                <Edit2 className="h-5 w-5 text-primary" /> Editar Objetivo (Supabase)
              </CardTitle>
              <button 
                onClick={() => setEditingItem(null)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Deportista</label>
                <input 
                  type="text" 
                  value={editingItem.jugador}
                  disabled
                  className="w-full h-9 rounded-lg border border-input bg-muted px-3 text-xs text-muted-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo de Meta</label>
                  <select 
                    value={editingItem.tipo}
                    onChange={e => setEditingItem({ ...editingItem, tipo: e.target.value as Objective["tipo"] })}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="tecnico">Técnico</option>
                    <option value="tactico">Táctico</option>
                    <option value="fisico">Físico</option>
                    <option value="psicologico">Psicológico</option>
                    <option value="disciplinario">Disciplinario</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado</label>
                  <select 
                    value={editingItem.estado}
                    onChange={e => setEditingItem({ ...editingItem, estado: e.target.value as Objective["estado"] })}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="en_progreso">En Progreso</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Título / Meta</label>
                <input 
                  type="text" 
                  value={editingItem.titulo}
                  onChange={e => setEditingItem({ ...editingItem, titulo: e.target.value })}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Progreso (%):</label>
                  <span className="font-bold text-foreground">{editingItem.progreso}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={editingItem.progreso}
                  onChange={e => setEditingItem({ ...editingItem, progreso: parseInt(e.target.value) || 0 })}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Observaciones / Notas</label>
                <textarea 
                  value={editingItem.observaciones}
                  onChange={e => setEditingItem({ ...editingItem, observaciones: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditingItem(null)}>Cancelar</Button>
                <Button size="sm" onClick={handleUpdate}>Actualizar en Supabase</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
