import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { eventos as initialEventos } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, Trash2, Edit2, X, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import RendimientoStore from "@/lib/rendimiento-store";

import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/calendario")({ component: CalendarioPage });

const tipoColor: Record<string, string> = {
  partido: "bg-primary/15 text-primary border-primary/20",
  torneo: "bg-destructive/15 text-destructive border-destructive/20",
  reunion: "bg-warning/20 text-warning-foreground border-warning/30",
  actividad: "bg-success/15 text-success border-success/20",
  entrenamiento: "bg-secondary text-secondary-foreground border-transparent",
};

interface Event {
  id: string;
  titulo: string;
  tipo: "partido" | "torneo" | "reunion" | "actividad" | "entrenamiento";
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:MM
  sedeId: string;
  disciplina: string;
}

function CalendarioPage() {
  const [list, setList] = useState<Event[]>([]);
  const [month, setMonth] = useState(() => new Date().getMonth()); // Dinámico
  const [year, setYear] = useState(() => new Date().getFullYear()); // Dinámico
  const [sede, setSede] = useState("todas");
  const [tipo, setTipo] = useState("todos");

  // Sedes dinámicas del store
  const [sedes, setSedes] = useState<any[]>(() => RendimientoStore.getSedes());

  useEffect(() => {
    const handleOrgChange = () => {
      setSedes(RendimientoStore.getSedes());
    };
    window.addEventListener("organizacionChanged", handleOrgChange);
    return () => window.removeEventListener("organizacionChanged", handleOrgChange);
  }, []);

  // Selection states for detail modals
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<Event | null>(null);

  // Form states
  const [form, setForm] = useState({
    titulo: "",
    tipo: "partido" as Event["tipo"],
    fecha: new Date().toISOString().split("T")[0],
    hora: "09:00",
    sedeId: sedes[0]?.id || "",
    disciplina: "Fútbol",
  });

  const [horarios, setHorarios] = useState<any[]>([]);

  const loadEventos = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    try {
      // 1. Fetch current DB eventos
      const { data: eventsData } = await supabase
        .from("eventos")
        .select("*")
        .eq("organizacion_id", orgId);

      if (eventsData) {
        setList(eventsData.map((e: any) => ({
          id: e.id,
          titulo: e.titulo,
          tipo: e.tipo || "actividad",
          fecha: (e.fecha_inicio || "").split("T")[0],
          hora: (e.fecha_inicio || "T09:00").split("T")[1]?.substring(0, 5) || "09:00",
          sedeId: "s1",
          disciplina: "Fútbol",
        })));
      }

      if (!(window as any).horariosSyncPromise) {
        (window as any).horariosSyncPromise = (async () => {
          // 1. Fetch coaches
          const { data: dbCoaches } = await supabase
            .from("entrenadores")
            .select("*")
            .eq("organizacion_id", orgId);

          const coaches = dbCoaches || [];

          // Clean up ALL generated coach schedules to prevent duplicates/orphan entries
          await supabase
            .from("horarios")
            .delete()
            .like("equipo", "Entrenamiento - %")
            .eq("organizacion_id", orgId);

          // Helper to parse coach schedule
          const parseCoachSchedule = (scheduleStr: string) => {
            if (!scheduleStr) return [];
            const normalized = scheduleStr.trim().toLowerCase();
            
            const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*[-–a]\s*(\d{1,2})(?::(\d{2}))?/;
            const match = normalized.match(timeRegex);
            if (!match) return [];
            
            let startHour = parseInt(match[1], 10);
            let startMin = match[2] ? parseInt(match[2], 10) : 0;
            let endHour = parseInt(match[3], 10);
            let endMin = match[4] ? parseInt(match[4], 10) : 0;
            
            if (startHour >= 1 && startHour <= 6) startHour += 12;
            if (endHour >= 1 && endHour <= 6) endHour += 12;
            
            const startTimeStr = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00`;
            const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00`;
            
            const daysList: string[] = [];
            const dayOrder = ["l", "k", "m", "j", "v", "s", "d"];
            const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

            const daysPart = normalized.split(/\d/)[0].trim();

            const rangeMatch = daysPart.match(/^([lkmjvsd])\s*[-–]\s*([lkmjvsd])$/);
            if (rangeMatch) {
              const startChar = rangeMatch[1];
              const endChar = rangeMatch[2];
              const startIdx = dayOrder.indexOf(startChar);
              const endIdx = dayOrder.indexOf(endChar);
              if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
                for (let i = startIdx; i <= endIdx; i++) {
                  daysList.push(dayNames[i]);
                }
              }
            } else {
              const parts = daysPart.split(",").map(p => p.trim());
              for (const p of parts) {
                if (p === "l" || p === "lunes" || p === "lun") daysList.push("Lunes");
                if (p === "k" || p === "martes" || p === "mar" || p === "m") {
                  daysList.push("Martes");
                }
                if (p === "miércoles" || p === "miercoles" || p === "mié" || (p === "m" && parts.includes("l"))) {
                  daysList.push("Miércoles");
                }
                if (p === "j" || p === "jueves" || p === "jue") daysList.push("Jueves");
                if (p === "v" || p === "viernes" || p === "vie") daysList.push("Viernes");
                if (p === "s" || p === "sábado" || p === "sabado" || p === "sáb") daysList.push("Sábado");
                if (p === "d" || p === "domingo" || p === "dom") daysList.push("Domingo");
              }
            }
            
            const uniqueDays = Array.from(new Set(daysList));
            return uniqueDays.map(dia => ({ dia, inicio: startTimeStr, fin: endTimeStr }));
          };

          // Generate clean inserts
          const inserts: any[] = [];
          for (const coach of coaches) {
            if (!coach.horario) continue;
            const parsedItems = parseCoachSchedule(coach.horario);
            
            for (const item of parsedItems) {
              inserts.push({
                dia: item.dia,
                hora_inicio: item.inicio,
                hora_fin: item.fin,
                equipo: `Entrenamiento - ${coach.nombre}`,
                instalacion: "Cancha Principal",
                organizacion_id: orgId
              });
            }
          }

          // Insert fresh clean schedules
          if (inserts.length > 0) {
            const { error: insertErr } = await supabase.from("horarios").insert(inserts);
            if (insertErr) {
              console.error("Failed to insert coach schedules in calendar:", insertErr.message);
            }
          }
        })();
      }

      await (window as any).horariosSyncPromise;

      setTimeout(() => {
        (window as any).horariosSyncPromise = null;
      }, 1000);

      // Fetch final clean list
      const { data: finalHorarios, error: horError } = await supabase
        .from("horarios")
        .select("*")
        .eq("organizacion_id", orgId);

      if (horError) throw horError;

      setHorarios(finalHorarios || []);

    } catch (e) {
      console.error(e);
      toast.error("Error al cargar eventos de Supabase");
    }
  };

  useEffect(() => {
    loadEventos();
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleDateString("es", { month: "long", year: "numeric" });

  const allEvents = useMemo(() => {
    const customEvents = list;

    // Cargar entrenamientos del RendimientoStore
    const sessions = RendimientoStore.getSesiones().map((s) => ({
      id: s.id,
      titulo: `Entrenamiento: ${s.equipo} (${s.tipo || "Práctica"})`,
      tipo: "entrenamiento" as const,
      fecha: s.fecha,
      hora: s.hora || "16:00",
      sedeId: "s1", // Por defecto Sede Central
      disciplina: "Fútbol",
    }));

    // Cargar partidos del RendimientoStore
    const matches = RendimientoStore.getPartidos().map((p) => ({
      id: p.id,
      titulo: `Partido: ${p.local} vs ${p.visitante}`,
      tipo: "partido" as const,
      fecha: p.fecha,
      hora: p.hora || "09:00",
      sedeId: "s1",
      disciplina: p.disciplina || "Fútbol",
    }));

    // Project weekly schedules onto the calendar month
    const projectedSchedules: Event[] = [];
    const diaToDayIndex: Record<string, number> = {
      "Domingo": 0,
      "Lunes": 1,
      "Martes": 2,
      "Miércoles": 3,
      "Miercoles": 3,
      "Jueves": 4,
      "Viernes": 5,
      "Sábado": 6,
      "Sabado": 6
    };

    const numDays = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= numDays; day++) {
      const date = new Date(year, month, day);
      const dayOfWeekIndex = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
      
      for (const h of horarios) {
        const scheduleDayIndex = diaToDayIndex[h.dia];
        if (scheduleDayIndex === dayOfWeekIndex) {
          const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          projectedSchedules.push({
            id: `proj-${h.id}-${dateString}`,
            titulo: `${h.equipo || "Entrenamiento"} (${(h.hora_inicio || "08:00:00").substring(0, 5)} - ${(h.hora_fin || "09:30:00").substring(0, 5)})`,
            tipo: "entrenamiento" as const,
            fecha: dateString,
            hora: (h.hora_inicio || "08:00:00").substring(0, 5),
            sedeId: h.sede_id || "s1",
            disciplina: "Fútbol"
          });
        }
      }
    }

    return [...customEvents, ...sessions, ...matches, ...projectedSchedules];
  }, [list, horarios, month, year]);

  const filtered = useMemo(() => {
    return allEvents.filter((e) =>
      (sede === "todas" || e.sedeId === sede) && (tipo === "todos" || e.tipo === tipo)
    );
  }, [allEvents, sede, tipo]);

  const getEventsForDay = (d: number) => {
    return filtered.filter((e) => {
      const parts = e.fecha.split("-");
      const evYear = parseInt(parts[0]);
      const evMonth = parseInt(parts[1]) - 1; // YYYY-MM-DD parts[1] is 1-indexed
      const evDay = parseInt(parts[2]);
      return evDay === d && evMonth === month && evYear === year;
    });
  };

  const handleCreate = () => {
    if (!form.titulo.trim()) {
      toast.error("El título del evento es obligatorio.");
      return;
    }
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const newRecord = {
      titulo: form.titulo,
      tipo: form.tipo,
      fecha_inicio: `${form.fecha}T${form.hora}:00Z`,
      fecha_fin: `${form.fecha}T${form.hora}:00Z`,
      organizacion_id: orgId,
    };

    supabase
      .from("eventos")
      .insert([newRecord])
      .then(({ error }) => {
        if (error) {
          toast.error("Error al agendar en Supabase");
        } else {
          toast.success("¡Nuevo evento agendado!");
          loadEventos();
          setIsOpenCreate(false);
          setForm({
            titulo: "",
            tipo: "partido" as Event["tipo"],
            fecha: new Date().toISOString().split("T")[0],
            hora: "09:00",
            sedeId: sedes[0]?.id || "",
            disciplina: "Fútbol",
          });
        }
      });
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    if (!editingItem.titulo.trim()) {
      toast.error("El título es obligatorio.");
      return;
    }

    supabase
      .from("eventos")
      .update({
        titulo: editingItem.titulo,
        tipo: editingItem.tipo,
        fecha_inicio: `${editingItem.fecha}T${editingItem.hora}:00Z`,
        fecha_fin: `${editingItem.fecha}T${editingItem.hora}:00Z`
      })
      .eq("id", editingItem.id)
      .then(({ error }) => {
        if (error) {
          toast.error("Error al actualizar en Supabase");
        } else {
          toast.success("¡Evento actualizado correctamente!");
          loadEventos();
          setEditingItem(null);
          setSelectedDayNumber(null);
        }
      });
  };

  const handleDelete = (id: string, name: string) => {
    supabase
      .from("eventos")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          toast.error("Error al eliminar de Supabase");
        } else {
          toast.success(`Evento "${name}" eliminado.`);
          loadEventos();
          setSelectedDayNumber(null);
        }
      });
  };

  // Open creation modal with specific date prefilled
  const handleOpenCreateForDate = (dayNum: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    setForm(prev => ({ ...prev, fecha: formattedDate }));
    setIsOpenCreate(true);
  };

  return (
    <div className="space-y-6">
      {/* Pestañas Dashboard Planificación Temporal */}
      <div className="flex items-center gap-1.5 border-b pb-3">
        <Link
          to="/horarios"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          ⏱️ Horarios
        </Link>
        <Link
          to="/calendario"
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground shadow-sm"
        >
          📅 Calendario
        </Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Horarios & Calendario</h1>
          <p className="text-sm text-muted-foreground">Vista global mensual de eventos, entrenamientos y agenda del club.</p>
        </div>
        <Button onClick={() => setIsOpenCreate(true)} className="bg-gradient-primary shadow-elegant">
          <Plus className="h-4 w-4 mr-1" /> Nuevo evento
        </Button>
      </div>

      <Card className="shadow-card bg-card border-border">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setMonth((m) => Math.max(0, m - 1))} className="border-border">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-bold capitalize min-w-[180px] text-center text-foreground">{monthName}</h2>
            <Button variant="outline" size="icon" onClick={() => setMonth((m) => Math.min(11, m + 1))} className="border-border">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1" />
          <Select value={sede} onValueChange={setSede}>
            <SelectTrigger className="w-[180px] bg-background border-input text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="todas">Todas las sedes</SelectItem>
              {sedes.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-[160px] bg-background border-input text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="partido">Partidos</SelectItem>
              <SelectItem value="torneo">Torneos</SelectItem>
              <SelectItem value="reunion">Reuniones</SelectItem>
              <SelectItem value="actividad">Actividades</SelectItem>
              <SelectItem value="entrenamiento">Entrenamientos</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="shadow-card overflow-hidden bg-card border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-foreground font-semibold">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
            <div key={d} className="p-2 text-center text-xs">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square border-b border-r border-border bg-muted/5 last:border-r-0" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const evts = getEventsForDay(d);
            const todayObj = new Date();
            const isToday = d === todayObj.getDate() && month === todayObj.getMonth() && year === todayObj.getFullYear();
            return (
              <div 
                key={d} 
                onClick={() => setSelectedDayNumber(d)}
                className={cn(
                  "aspect-square border-b border-r border-border p-1.5 hover:bg-muted/30 transition cursor-pointer overflow-hidden flex flex-col justify-between last:border-r-0", 
                  isToday && "bg-primary/5"
                )}
              >
                <p className={cn("text-xs font-bold", isToday && "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-black")}>
                  {d}
                </p>
                <div className="space-y-0.5 overflow-hidden flex-1 mt-1">
                  {evts.slice(0, 2).map((e) => (
                    <div key={e.id} className={cn("text-[9px] px-1.5 py-0.5 rounded-md truncate font-medium border leading-normal", tipoColor[e.tipo] || "bg-muted")}>
                      {e.titulo}
                    </div>
                  ))}
                  {evts.length > 2 && <p className="text-[8px] text-muted-foreground font-black text-right pr-0.5">+{evts.length - 2} más</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming Events list */}
      <Card className="shadow-card bg-card border-border">
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-foreground">
            <CalIcon className="h-4 w-4 text-primary" /> Próximos eventos programados
          </h3>
          {filtered.slice(0, 6).map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl p-2.5 hover:bg-muted/30 border border-transparent hover:border-border transition">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-muted border border-border">
                  <p className="text-[8px] font-black uppercase text-muted-foreground">Mes {e.fecha.split("-")[1]}</p>
                  <p className="text-sm font-black leading-none text-foreground">{e.fecha.split("-")[2]}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{e.titulo}</p>
                  <p className="text-[10px] text-muted-foreground">{e.hora} · {e.disciplina} · {sedes.find(s => s.id === e.sedeId)?.nombre || "Sede"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${tipoColor[e.tipo]} text-[9px] font-bold`} variant="secondary">{e.tipo}</Badge>
                {e.id.startsWith("evt_") && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                    onClick={(evt) => {
                      evt.stopPropagation();
                      handleDelete(e.id, e.titulo);
                    }}
                    title="Eliminar evento"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Day Events Details Modal */}
      {selectedDayNumber !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <CalIcon className="h-5 w-5 text-primary" /> Día {selectedDayNumber} de {new Date(year, month).toLocaleDateString("es", { month: "long" })}
              </CardTitle>
              <button 
                onClick={() => setSelectedDayNumber(null)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">Eventos Programados</p>
                <Button 
                  size="xs" 
                  onClick={() => {
                    handleOpenCreateForDate(selectedDayNumber);
                  }} 
                  className="text-[10px] font-bold h-7 gap-1"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Añadir Evento
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {getEventsForDay(selectedDayNumber).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No hay eventos programados para este día.</p>
                ) : (
                  getEventsForDay(selectedDayNumber).map(e => (
                    <div key={e.id} className="flex items-center justify-between p-2 rounded-xl border border-border bg-muted/20">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{e.titulo}</p>
                        <p className="text-[10px] text-muted-foreground">{e.hora} · {e.disciplina}</p>
                      </div>
                      {e.id.startsWith("evt_") && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditingItem(e)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(e.id, e.titulo)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button variant="outline" size="sm" onClick={() => setSelectedDayNumber(null)} className="border-border text-xs text-muted-foreground">
                  Aceptar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Event Modal */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Nuevo Evento
              </CardTitle>
              <button 
                onClick={() => setIsOpenCreate(false)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Título del Evento *</label>
                <input 
                  type="text" 
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="E.g. Clásico Metropolitano Sub-12"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo de Evento *</label>
                  <select 
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Event["tipo"] }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="partido">Partido</option>
                    <option value="torneo">Torneo</option>
                    <option value="reunion">Reunión</option>
                    <option value="actividad">Actividad</option>
                    <option value="entrenamiento">Entrenamiento</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Disciplina *</label>
                  <input 
                    type="text" 
                    value={form.disciplina}
                    onChange={e => setForm(f => ({ ...f, disciplina: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha *</label>
                  <input 
                    type="date" 
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Hora *</label>
                  <input 
                    type="time" 
                    value={form.hora}
                    onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Sede *</label>
                <select 
                  value={form.sedeId}
                  onChange={e => setForm(f => ({ ...f, sedeId: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                >
                  {sedes.map(s => (
                    <option key={s.id} value={s.id} className="bg-background text-foreground">{s.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleCreate}
                >
                  Guardar Evento
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

      {/* Edit Event Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" /> Editar Evento
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
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Título del Evento *</label>
                <input 
                  type="text" 
                  value={editingItem.titulo}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo de Evento *</label>
                  <select 
                    value={editingItem.tipo}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, tipo: e.target.value as Event["tipo"] } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="partido">Partido</option>
                    <option value="torneo">Torneo</option>
                    <option value="reunion">Reunión</option>
                    <option value="actividad">Actividad</option>
                    <option value="entrenamiento">Entrenamiento</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Disciplina *</label>
                  <input 
                    type="text" 
                    value={editingItem.disciplina}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, disciplina: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha *</label>
                  <input 
                    type="date" 
                    value={editingItem.fecha}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, fecha: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Hora *</label>
                  <input 
                    type="time" 
                    value={editingItem.hora}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, hora: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Sede *</label>
                <select 
                  value={editingItem.sedeId}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, sedeId: e.target.value } : null)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                >
                  {sedes.map(s => (
                    <option key={s.id} value={s.id} className="bg-background text-foreground">{s.nombre}</option>
                  ))}
                </select>
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

export default CalendarioPage;
