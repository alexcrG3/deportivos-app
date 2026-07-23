import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { coachDiary as initialDiary } from "@/lib/mock-data";
import { NotebookPen, Calendar, Users, FileText, ClipboardList, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import RendimientoStore from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/lib/supabase";
import { CoachOsBanner } from "@/components/coach-os-banner";

export const Route = createFileRoute("/_app/diario")({ component: DiarioPage });

interface MinutaEntry {
  id: string;
  temaDeHoy: string;
  fecha: string;
  equipo: string;
  equipoId: string;
  observaciones: string;
  proximaClase: string;
}

function DiarioPage() {
  const { role, coachName, selectedCoachId, selectedCoachName } = useRole();
  const [entries, setEntries] = useState<MinutaEntry[]>([]);

  // Cargar equipos dinámicamente
  const dynamicEquipos = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (role === "admin") return all;
    return all.filter(t => t.entrenador === coachName);
  }, [role, coachName]);

  // Form states
  const [form, setForm] = useState({
    temaDeHoy: "",
    equipoId: "",
    fecha: new Date().toISOString().slice(0, 10),
    observaciones: "",
    proximaClase: "",
  });

  // Inicializar equipoId por defecto cuando carguen los equipos
  useEffect(() => {
    if (dynamicEquipos.length > 0 && !form.equipoId) {
      setForm(f => ({ ...f, equipoId: dynamicEquipos[0].id }));
    }
  }, [dynamicEquipos]);

  // Editing state
  const [editingEntry, setEditingEntry] = useState<MinutaEntry | null>(null);

  // Load from Supabase (minutas_diario)
  const loadMinutas = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    let query = supabase
      .from("minutas_diario")
      .select("*")
      .eq("organizacion_id", orgId)
      .order("fecha", { ascending: false });

    // If admin viewing a specific coach, filter by their teams
    if (role === "admin" && selectedCoachName) {
      const coachTeams = RendimientoStore.getEquipos()
        .filter((e: any) => e.entrenador === selectedCoachName)
        .map((e: any) => e.nombre);
      if (coachTeams.length > 0) {
        query = query.in("equipo", coachTeams);
      }
    } else if (role === "coach" && coachName) {
      const coachTeams = RendimientoStore.getEquipos()
        .filter((e: any) => e.entrenador === coachName)
        .map((e: any) => e.nombre);
      if (coachTeams.length > 0) {
        query = query.in("equipo", coachTeams);
      }
    }

    const { data, error } = await query;
    if (error || !data) return;

    const mapped: MinutaEntry[] = data.map((d: any) => ({
      id: d.id,
      temaDeHoy: d.titulo || "",
      fecha: d.fecha || "",
      equipo: d.equipo || "",
      equipoId: "",
      observaciones: d.observaciones || "",
      proximaClase: "",
    }));
    setEntries(mapped);
  };


  useEffect(() => {
    loadMinutas();
  }, [selectedCoachId, role]);

  const saveToStorage = async (updated: MinutaEntry[]) => {
    setEntries(updated);
    // Persist to Supabase
    const orgId = RendimientoStore.getActiveOrganizacionId();
    for (const e of updated) {
      await supabase.from("minutas_diario").upsert({
        id: e.id,
        titulo: e.temaDeHoy,
        fecha: e.fecha,
        equipo: e.equipo,
        observaciones: e.observaciones,
        asistencia: {},
        organizacion_id: orgId,
      });
    }
  };


  const handleSaveEntry = () => {
    if (!form.temaDeHoy.trim()) {
      toast.error("El tema de hoy es obligatorio.");
      return;
    }
    if (!form.observaciones.trim()) {
      toast.error("Las observaciones del grupo son obligatorias.");
      return;
    }

    const team = dynamicEquipos.find(e => e.id === form.equipoId) || dynamicEquipos[0];
    const newEntry: MinutaEntry = {
      id: `minuta_${Date.now()}`,
      temaDeHoy: form.temaDeHoy,
      fecha: form.fecha,
      equipo: team?.nombre || "General",
      equipoId: form.equipoId,
      observaciones: form.observaciones,
      proximaClase: form.proximaClase,
    };

    const updated = [newEntry, ...entries];
    saveToStorage(updated);

    // Reset form
    setForm({
      temaDeHoy: "",
      equipoId: dynamicEquipos[0]?.id || "",
      fecha: new Date().toISOString().slice(0, 10),
      observaciones: "",
      proximaClase: "",
    });

    toast.success("¡Minuta de lección guardada exitosamente!");
  };

  const handleUpdateEntry = () => {
    if (!editingEntry) return;
    if (!editingEntry.temaDeHoy.trim()) {
      toast.error("El tema de hoy es obligatorio.");
      return;
    }
    if (!editingEntry.observaciones.trim()) {
      toast.error("Las observaciones son obligatorias.");
      return;
    }

    const updated = entries.map(e => e.id === editingEntry.id ? editingEntry : e);
    saveToStorage(updated);
    setEditingEntry(null);
    toast.success("¡Minuta actualizada correctamente!");
  };

  const handleDeleteEntry = (id: string, theme: string) => {
    const updated = entries.filter(e => e.id !== id);
    saveToStorage(updated);
    toast.success(`Minuta de "${theme}" eliminada.`);
  };

  return (
    <div className="space-y-6">
      <CoachOsBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Minutas de Lección</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" && selectedCoachName
              ? `Minutas de ${selectedCoachName}`
              : "Seguimiento grupal — lleva registro de los temas trabajados y en dónde quedó el avance del equipo."}
          </p>
        </div>
      </div>

      {/* Formulario de Nueva Minuta */}
      <Card className="shadow-card border-primary/20 bg-card">
        <CardHeader className="p-4 pb-2 border-b border-border bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <NotebookPen className="h-5 w-5 text-primary" /> Registrar Minuta de Clase
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Equipo *</label>
              <select 
                value={form.equipoId}
                onChange={e => setForm(f => ({ ...f, equipoId: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                {dynamicEquipos.map(eq => (
                  <option key={eq.id} value={eq.id} className="bg-background text-foreground">{eq.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha de Registro *</label>
              <input 
                type="date" 
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Tema de Hoy *</label>
              <Input 
                placeholder="Ej: Conducción de balón y pases a profundidad..." 
                value={form.temaDeHoy}
                onChange={e => setForm(f => ({ ...f, temaDeHoy: e.target.value }))}
                className="bg-background border-input text-foreground h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Observaciones del Grupo *</label>
            <Textarea 
              placeholder="Detalles sobre el comportamiento, dudas generales o incidentes del grupo..." 
              rows={3} 
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              className="bg-background border-input text-foreground text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Para la Próxima Clase</label>
            <Textarea 
              placeholder="Ej: Continuar con la práctica de juego rápido y pases cortos..." 
              rows={2} 
              value={form.proximaClase}
              onChange={e => setForm(f => ({ ...f, proximaClase: e.target.value }))}
              className="bg-background border-input text-foreground text-xs"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSaveEntry} className="bg-primary text-white text-xs font-bold px-6">
              Guardar Minuta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Minutas */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 pt-2">
          <ClipboardList className="h-4.5 w-4.5 text-primary" /> Historial de Minutas Guardadas
        </h3>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-muted/5">
            No se han registrado minutas de lección.
          </div>
        ) : (
          entries.map((d) => (
            <Card key={d.id} className="shadow-card bg-card border-border hover:shadow-elegant transition-all">
              <CardHeader className="flex-row items-start justify-between space-y-0 p-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 border border-primary/20">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-foreground font-bold">{d.temaDeHoy}</CardTitle>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {d.fecha}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {d.equipo}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={() => setEditingEntry(d)}
                    title="Editar minuta"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg"
                    onClick={() => handleDeleteEntry(d.id, d.temaDeHoy)}
                    title="Eliminar minuta"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1.5 space-y-3">
                <div>
                  <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Observaciones del Grupo</p>
                  <p className="text-xs text-foreground/90 leading-relaxed bg-muted/10 p-2.5 rounded-xl border border-border/40">{d.observaciones}</p>
                </div>
                {d.proximaClase && (
                  <div>
                    <p className="text-[9px] uppercase font-bold text-primary tracking-wider mb-0.5">Para la Próxima Clase (Recordatorio)</p>
                    <p className="text-xs text-foreground/80 leading-relaxed bg-primary/5 p-2.5 rounded-xl border border-primary/10">{d.proximaClase}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Edición */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-lg shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <NotebookPen className="h-5 w-5 text-primary" /> Editar Minuta de Lección
              </CardTitle>
              <button 
                onClick={() => setEditingEntry(null)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Equipo</label>
                  <select 
                    value={editingEntry.equipoId}
                    onChange={e => {
                      const selectedTeam = dynamicEquipos.find(eq => eq.id === e.target.value);
                      if (selectedTeam) {
                        setEditingEntry(prev => prev ? { ...prev, equipoId: selectedTeam.id, equipo: selectedTeam.nombre } : null);
                      }
                    }}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {dynamicEquipos.map(eq => (
                      <option key={eq.id} value={eq.id} className="bg-background text-foreground">{eq.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha</label>
                  <input 
                    type="date" 
                    value={editingEntry.fecha}
                    onChange={e => setEditingEntry(prev => prev ? { ...prev, fecha: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Tema de Hoy *</label>
                <Input 
                  value={editingEntry.temaDeHoy}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, temaDeHoy: e.target.value } : null)}
                  className="bg-background border-input text-foreground text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Observaciones del Grupo *</label>
                <Textarea 
                  value={editingEntry.observaciones}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, observaciones: e.target.value } : null)}
                  rows={3}
                  className="bg-background border-input text-foreground text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Para la Próxima Clase</label>
                <Textarea 
                  value={editingEntry.proximaClase}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, proximaClase: e.target.value } : null)}
                  rows={2}
                  className="bg-background border-input text-foreground text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleUpdateEntry}
                >
                  Guardar Cambios
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs" 
                  onClick={() => setEditingEntry(null)}
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

export default DiarioPage;
