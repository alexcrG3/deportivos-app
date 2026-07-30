import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { coachDiary as initialDiary } from "@/lib/mock-data";
import { NotebookPen, Calendar, Users, FileText, ClipboardList, Trash2, Edit2, Mic, MicOff, AlertCircle, ShieldAlert } from "lucide-react";
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
  hayLesion?: boolean;
  jugadorLesionadoId?: string;
  jugadorLesionadoNombre?: string;
  gravedadLesion?: string;
  descripcionLesion?: string;
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

  // Cargar lista de todos los jugadores para selector de lesiones
  const allJugadores = useMemo(() => RendimientoStore.getJugadores(), []);

  // Form states
  const [form, setForm] = useState({
    temaDeHoy: "",
    equipoId: "",
    fecha: new Date().toISOString().slice(0, 10),
    observaciones: "",
    proximaClase: "",
    hayLesion: false,
    jugadorLesionadoId: "",
    gravedadLesion: "leve" as "leve" | "moderada" | "grave",
    descripcionLesion: "",
  });

  // Inicializar equipoId por defecto cuando carguen los equipos
  useEffect(() => {
    if (dynamicEquipos.length > 0 && !form.equipoId) {
      setForm(f => ({ ...f, equipoId: dynamicEquipos[0].id }));
    }
  }, [dynamicEquipos]);

  // Editing state
  const [editingEntry, setEditingEntry] = useState<MinutaEntry | null>(null);

  // Load from Supabase (Unificar minutas_diario, sesiones_entrenamiento e incidencias_lesiones)
  const loadMinutas = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();

    // Determinar los nombres de equipos permitidos según el rol
    let allowedTeamNames: string[] | null = null;
    if (role === "coach" && coachName) {
      allowedTeamNames = RendimientoStore.getEquipos()
        .filter((e: any) => e.entrenador === coachName)
        .map((e: any) => e.nombre);
    } else if (role === "admin" && selectedCoachName) {
      allowedTeamNames = RendimientoStore.getEquipos()
        .filter((e: any) => e.entrenador === selectedCoachName)
        .map((e: any) => e.nombre);
    }

    try {
      let minutasQuery = supabase
        .from("minutas_diario")
        .select("*")
        .eq("organizacion_id", orgId)
        .order("fecha", { ascending: false });

      let sesionesQuery = supabase
        .from("sesiones_entrenamiento")
        .select("*")
        .eq("organizacion_id", orgId)
        .order("fecha", { ascending: false });

      if (allowedTeamNames && allowedTeamNames.length > 0) {
        minutasQuery = minutasQuery.in("equipo", allowedTeamNames);
        sesionesQuery = sesionesQuery.in("equipo", allowedTeamNames);
      }

      const { data: minutasData } = await minutasQuery;
      const { data: sesionesData } = await sesionesQuery;
      const { data: lesionesData } = await supabase.from("incidencias_lesiones").select("*");

      const combinedMap = new Map<string, MinutaEntry>();

      (sesionesData || []).forEach((s: any) => {
        const key = s.fecha || s.id;
        const lesion = (lesionesData || []).find((l: any) => l.fecha === s.fecha || l.sesion_id === s.id);
        combinedMap.set(key, {
          id: `sesion-${s.id}`,
          temaDeHoy: s.nombre || `Sesión de Cancha (${s.fecha})`,
          fecha: s.fecha,
          equipo: s.equipo || "General",
          equipoId: s.equipo_id || "",
          observaciones: s.notas_entrenador || "Sin observaciones.",
          proximaClase: s.proxima_clase || "",
          hayLesion: !!lesion,
          jugadorLesionadoNombre: lesion ? lesion.jugador_nombre : undefined,
          gravedadLesion: lesion ? lesion.gravedad : undefined,
          descripcionLesion: lesion ? lesion.descripcion : undefined,
        });
      });

      (minutasData || []).forEach((m: any) => {
        const key = m.fecha || m.id;
        const existing = combinedMap.get(key);
        combinedMap.set(key, {
          id: m.id,
          temaDeHoy: m.titulo || existing?.temaDeHoy || `Minuta de Lección (${m.fecha})`,
          fecha: m.fecha,
          equipo: m.equipo || existing?.equipo || "General",
          equipoId: m.equipo_id || existing?.equipoId || "",
          observaciones: m.observaciones || existing?.observaciones || "",
          proximaClase: m.proxima_clase || existing?.proximaClase || "",
          hayLesion: m.hay_lesion || existing?.hayLesion || false,
          jugadorLesionadoNombre: m.jugador_lesionado_nombre || existing?.jugadorLesionadoNombre,
          gravedadLesion: m.gravedad_lesion || existing?.gravedadLesion,
          descripcionLesion: m.descripcion_lesion || existing?.descripcionLesion,
        });
      });

      const list = Array.from(combinedMap.values()).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
      setEntries(list);
    } catch (e) {
      console.warn("Error cargando minutas unificadas:", e);
    }
  };

  useEffect(() => {
    loadMinutas();
  }, [selectedCoachId, role]);

  const saveToStorage = async (updated: MinutaEntry[]) => {
    setEntries(updated);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    for (const e of updated) {
      const lesionPlayer = allJugadores.find((j) => j.id === e.jugadorLesionadoId);
      await supabase.from("minutas_diario").upsert({
        id: e.id,
        titulo: e.temaDeHoy,
        fecha: e.fecha,
        equipo: e.equipo,
        observaciones: e.observaciones,
        proxima_clase: e.proximaClase,
        hay_lesion: e.hayLesion,
        jugador_lesionado_id: e.jugadorLesionadoId,
        jugador_lesionado_nombre: e.jugadorLesionadoNombre || lesionPlayer?.nombre,
        gravedad_lesion: e.gravedadLesion,
        descripcion_lesion: e.descripcionLesion,
        asistencia: {},
        organizacion_id: orgId,
      });

      if (e.hayLesion && e.jugadorLesionadoId) {
        await supabase.from("incidencias_lesiones").upsert({
          id: `les-${Date.now()}-${e.jugadorLesionadoId}`,
          jugador_id: e.jugadorLesionadoId,
          jugador_nombre: e.jugadorLesionadoNombre || lesionPlayer?.nombre || "Atleta",
          fecha: e.fecha,
          gravedad: e.gravedadLesion || "leve",
          zona_corporal: "Extremidad Inferior",
          descripcion: e.descripcionLesion || "Incidencia registrada desde Bitácora.",
          notificado_admin: true,
          estado_atencion: "pendiente_seguro",
        });
      }
    }
  };

  const handleSaveEntry = () => {
    if (!form.observaciones.trim()) {
      toast.error("Las observaciones del grupo son obligatorias.");
      return;
    }

    const team = dynamicEquipos.find(e => e.id === form.equipoId) || dynamicEquipos[0];
    const lesionPlayer = allJugadores.find(j => j.id === form.jugadorLesionadoId);

    const newEntry: MinutaEntry = {
      id: `minuta_${Date.now()}`,
      temaDeHoy: form.temaDeHoy || `Minuta de Lección (${form.fecha})`,
      fecha: form.fecha,
      equipo: team?.nombre || "General",
      equipoId: form.equipoId,
      observaciones: form.observaciones,
      proximaClase: form.proximaClase,
      hayLesion: form.hayLesion,
      jugadorLesionadoId: form.jugadorLesionadoId,
      jugadorLesionadoNombre: lesionPlayer?.nombre,
      gravedadLesion: form.gravedadLesion,
      descripcionLesion: form.descripcionLesion,
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
      hayLesion: false,
      jugadorLesionadoId: "",
      gravedadLesion: "leve",
      descripcionLesion: "",
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

  const [isRecording, setIsRecording] = useState(false);

  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      toast.info("🎙️ Escuchando... Dicta las observaciones para la bitácora.");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setForm((f) => ({
        ...f,
        observaciones: f.observaciones ? `${f.observaciones} ${transcript}` : transcript,
      }));
      toast.success("✨ Dictado capturado con éxito.");
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("No se pudo capturar el audio.");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <div className="space-y-6">
      <CoachOsBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-header-title">Minutas de Lección</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" && selectedCoachName
              ? `Minutas de ${selectedCoachName}`
              : "Seguimiento grupal — lleva registro de los temas trabajados y en dónde quedó el avance del equipo."}
          </p>
        </div>
      </div>

      {/* Formulario de Nueva Minuta */}
      <Card className="premium-card border-primary/20">
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
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Observaciones del Grupo *</label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={startSpeechRecognition}
                className={`h-7 text-[10px] font-bold gap-1.5 px-2 rounded-lg transition ${
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                }`}
              >
                {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {isRecording ? "Detener" : "🎙️ Dictar por Voz"}
              </Button>
            </div>
            <Textarea 
              placeholder="Detalles sobre el comportamiento, dudas generales o incidentes del grupo..." 
              rows={3} 
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              className="bg-background border-input text-foreground text-xs"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Para la Próxima Clase (Temas a Recordar / Reforzar)</label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={startSpeechRecognition}
                className={`h-7 text-[10px] font-bold gap-1.5 px-2 rounded-lg transition ${
                  isRecording ? "bg-red-500 text-white animate-pulse" : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                }`}
              >
                {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {isRecording ? "Detener" : "🎙️ Dictar por Voz"}
              </Button>
            </div>
            <Textarea 
              placeholder="Ej: Continuar con la práctica de juego rápido y pases cortos..." 
              rows={2} 
              value={form.proximaClase}
              onChange={e => setForm(f => ({ ...f, proximaClase: e.target.value }))}
              className="bg-background border-input text-foreground text-xs"
            />
          </div>

          {/* MÓDULO DE REPORTE DE LESIONES EN LA BITÁCORA */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground">¿Ocurrió alguna lesión durante la práctica?</Label>
                <p className="text-[11px] text-muted-foreground">Notifica automáticamente al Área de Administración y Seguro Deportivo.</p>
              </div>
              <Switch checked={form.hayLesion} onCheckedChange={(val) => setForm(f => ({ ...f, hayLesion: val }))} />
            </div>

            {form.hayLesion && (
              <div className="space-y-3 pt-3 border-t border-border/60">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-muted-foreground">Seleccionar Jugador Lesionado:</Label>
                  <Select 
                    value={form.jugadorLesionadoId} 
                    onValueChange={(val) => setForm(f => ({ ...f, jugadorLesionadoId: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs bg-background rounded-xl border-input text-foreground">
                      <SelectValue placeholder="Seleccionar alumno..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allJugadores.map((j) => (
                        <SelectItem key={j.id} value={j.id}>{j.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-muted-foreground">Gravedad de la Incidencia:</Label>
                  <div className="flex gap-2">
                    {[
                      { key: "leve", label: "🟢 Leve", class: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" },
                      { key: "moderada", label: "🟡 Moderada", class: "border-amber-500/30 text-amber-500 bg-amber-500/10" },
                      { key: "grave", label: "🔴 Grave", class: "border-rose-500/30 text-rose-500 bg-rose-500/10" },
                    ].map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, gravedadLesion: st.key as any }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                          form.gravedadLesion === st.key ? `${st.class} ring-1 ring-primary` : "border-border text-muted-foreground bg-background"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-muted-foreground">Descripción del Incidente Médicos:</Label>
                  <Input
                    value={form.descripcionLesion}
                    onChange={(e) => setForm(f => ({ ...f, descripcionLesion: e.target.value }))}
                    placeholder="Ej. Torcedura leve de tobillo en choque defensivo."
                    className="h-9 text-xs bg-background rounded-xl border-input"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSaveEntry} className="btn-primary">
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
            <Card key={d.id} className="premium-card hover:shadow-sm transition-all space-y-2">
              <CardHeader className="flex-row items-start justify-between space-y-0 p-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 border border-primary/20">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-foreground font-bold flex items-center gap-2">
                      {d.temaDeHoy}
                      {d.hayLesion && (
                        <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] font-bold gap-1">
                          <AlertCircle className="h-3 w-3" /> Incidencia Médica
                        </Badge>
                      )}
                    </CardTitle>
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
                    className="h-7 w-7 text-muted-foreground hover:text-rose-500 rounded-lg"
                    onClick={() => handleDeleteEntry(d.id, d.temaDeHoy)}
                    title="Eliminar minuta"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2 text-xs">
                <div>
                  <span className="font-bold text-foreground block text-[11px]">Observaciones del Grupo:</span>
                  <p className="text-muted-foreground text-xs">{d.observaciones || "Sin observaciones."}</p>
                </div>

                {d.proximaClase && (
                  <div>
                    <span className="font-bold text-primary block text-[11px]">Para la Próxima Clase:</span>
                    <p className="text-muted-foreground text-xs">{d.proximaClase}</p>
                  </div>
                )}

                {d.hayLesion && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Lesión Reportada: {d.jugadorLesionadoNombre || "Jugador"} ({d.gravedadLesion || "Leve"})
                    </div>
                    {d.descripcionLesion && <p className="text-[11px] opacity-90">{d.descripcionLesion}</p>}
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
