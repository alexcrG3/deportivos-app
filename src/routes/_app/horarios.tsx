import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sedes } from "@/lib/mock-data";
import { Plus, AlertTriangle, Edit, Trash2, X, Calendar, Clock, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/horarios")({ component: HorariosPage });

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7..20

const colorMap: Record<string, string> = {
  primary: "bg-purple-100 dark:bg-purple-950/50 text-purple-900 dark:text-purple-100 border-l-4 border-l-purple-600 border-purple-200 shadow-sm",
  warning: "bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-100 border-l-4 border-l-amber-500 border-amber-200 shadow-sm",
  destructive: "bg-rose-100 dark:bg-rose-950/50 text-rose-900 dark:text-rose-100 border-l-4 border-l-rose-600 border-rose-200 shadow-sm",
  success: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 border-l-4 border-l-emerald-600 border-emerald-200 shadow-sm",
  "chart-5": "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100 border-l-4 border-l-indigo-600 border-indigo-200 shadow-sm",
};

interface ScheduleItem {
  id: string;
  titulo: string;
  dia: string;
  inicio: string;
  fin: string;
  sedeId: string;
  instalacion: string;
  color: string;
}

function HorariosPage() {
  const [list, setList] = useState<ScheduleItem[]>([]);
  const [sede, setSede] = useState("todas");
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Form states
  const [form, setForm] = useState({
    titulo: "",
    dia: "Lunes",
    inicio: "08:00",
    fin: "09:30",
    sedeId: sedes[0]?.id || "",
    instalacion: "Cancha Principal",
    color: "primary",
  });

  const loadHorarios = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    
    try {
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
                  // In Costa Rica: K is Martes. But if they select preset M, J, the UI saves 'M, J' where M is Martes.
                  // We map K or M (if J is present) to Martes, and K to Martes.
                  daysList.push("Martes");
                }
                if (p === "miércoles" || p === "miercoles" || p === "mié" || (p === "m" && parts.includes("l"))) {
                  // If 'm' is in 'L, M, V', it means Miércoles
                  daysList.push("Miércoles");
                }
                if (p === "j" || p === "jueves" || p === "jue") daysList.push("Jueves");
                if (p === "v" || p === "viernes" || p === "vie") daysList.push("Viernes");
                if (p === "s" || p === "sábado" || p === "sabado" || p === "sáb") daysList.push("Sábado");
                if (p === "d" || p === "domingo" || p === "dom") daysList.push("Domingo");
              }
            }
            
            // Deduplicate days list
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
              console.error("Failed to insert coach schedules:", insertErr.message);
            }
          }
        })();
      }

      await (window as any).horariosSyncPromise;

      // Reset promise lock after a delay to allow future renders to update
      setTimeout(() => {
        (window as any).horariosSyncPromise = null;
      }, 1000);

      // Fetch final clean list
      const { data: finalHorarios, error: horError } = await supabase
        .from("horarios")
        .select("*")
        .eq("organizacion_id", orgId);

      if (horError) throw horError;

      const displayList = finalHorarios || [];

      setList(displayList.map((h: any) => ({
        id: h.id,
        titulo: h.equipo || "Entrenamiento U13",
        dia: h.dia || "Lunes",
        inicio: (h.hora_inicio || "08:00:00").substring(0, 5),
        fin: (h.hora_fin || "09:30:00").substring(0, 5),
        sedeId: sedes[0]?.id || "",
        instalacion: h.instalacion || "Cancha Principal",
        color: h.equipo && h.equipo.includes("Entrenamiento") ? "success" : "primary",
      })));

    } catch (e) {
      toast.error("Error al cargar horarios de Supabase");
      console.error(e);
    }
  };

  useEffect(() => {
    loadHorarios();
  }, []);

  const handleCreate = () => {
    if (!form.titulo.trim()) {
      toast.error("El nombre del entrenamiento es obligatorio.");
      return;
    }
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const newRecord = {
      dia: form.dia,
      hora_inicio: `${form.inicio}:00`,
      hora_fin: `${form.fin}:00`,
      equipo: form.titulo,
      instalacion: form.instalacion,
      organizacion_id: orgId,
    };

    supabase
      .from("horarios")
      .insert([newRecord])
      .then(({ error }) => {
        if (error) {
          toast.error("Error al programar en Supabase");
        } else {
          toast.success("¡Nuevo horario de entrenamiento programado!");
          loadHorarios();
          setIsOpenCreate(false);
          setForm({
            titulo: "",
            dia: "Lunes",
            inicio: "08:00",
            fin: "09:30",
            sedeId: sedes[0]?.id || "",
            instalacion: "Cancha Principal",
            color: "primary",
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
      .from("horarios")
      .update({
        dia: editingItem.dia,
        hora_inicio: `${editingItem.inicio}:00`,
        hora_fin: `${editingItem.fin}:00`,
        equipo: editingItem.titulo,
        instalacion: editingItem.instalacion
      })
      .eq("id", editingItem.id)
      .then(({ error }) => {
        if (error) {
          toast.error("Error al actualizar en Supabase");
        } else {
          toast.success("¡Horario de entrenamiento actualizado!");
          loadHorarios();
          setEditingItem(null);
        }
      });
  };

  const handleDelete = (id: string, title: string) => {
    supabase
      .from("horarios")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          toast.error("Error al eliminar de Supabase");
        } else {
          toast.success(`Entrenamiento "${title}" removido.`);
          loadHorarios();
          setEditingItem(null);
        }
      });
  };

  const [viewMode, setViewMode] = useState<"horario" | "calendario">("horario");
  const [currentMonth, setCurrentMonth] = useState("Julio 2026");

  const items = list.filter((h) => sede === "todas" || h.sedeId === sede);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Horarios & Calendario Deportivo</h1>
          <p className="text-sm text-muted-foreground">Programación semanal de sesiones y vista de calendario mensual de la academia.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Modo de Vista */}
          <div className="flex items-center rounded-xl bg-muted p-1 border border-border">
            <Button
              size="sm"
              variant={viewMode === "horario" ? "default" : "ghost"}
              onClick={() => setViewMode("horario")}
              className="h-8 text-xs font-bold gap-1.5 rounded-lg"
            >
              <Clock className="h-3.5 w-3.5" /> Horarios (Semana)
            </Button>
            <Button
              size="sm"
              variant={viewMode === "calendario" ? "default" : "ghost"}
              onClick={() => setViewMode("calendario")}
              className="h-8 text-xs font-bold gap-1.5 rounded-lg"
            >
              <Calendar className="h-3.5 w-3.5" /> Calendario (Mes)
            </Button>
          </div>

          <Select value={sede} onValueChange={setSede}>
            <SelectTrigger className="w-[170px] bg-background border-input text-foreground h-9 text-xs">
              <SelectValue placeholder="Todas las sedes" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="todas">Todas las sedes</SelectItem>
              {sedes.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button onClick={() => setIsOpenCreate(true)} className="bg-gradient-primary shadow-elegant h-9 text-xs font-bold">
            <Plus className="h-4 w-4 mr-1" /> Nuevo entrenamiento
          </Button>
        </div>
      </div>

      <Card className="shadow-card border-warning/40 bg-warning/5">
        <CardContent className="p-4 flex items-center gap-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div>
            <p className="font-semibold text-warning-foreground">Sin conflictos detectados</p>
            <p className="text-xs text-muted-foreground">No hay sobreposiciones de entrenadores ni instalaciones programadas.</p>
          </div>
        </CardContent>
      </Card>

      {/* VISTA 1: HORARIOS SEMANALES (GRILLA POR HORAS) */}
      {viewMode === "horario" ? (
        <Card className="shadow-card overflow-hidden bg-card border-border">
          <div className="overflow-x-auto">
            <div className="min-w-[900px] grid grid-cols-[60px_repeat(6,1fr)]">
              <div className="border-b border-r border-border bg-muted/40 p-2 text-xs font-semibold text-muted-foreground">Hora</div>
              {dias.map((d) => (
                <div key={d} className="border-b border-r border-border last:border-r-0 bg-muted/40 p-2 text-xs font-bold text-foreground">{d}</div>
              ))}
              {hours.map((h) => (
                <Fragment key={h}>
                  <div className="border-b border-r border-border p-2 text-[10px] text-muted-foreground font-medium">{String(h).padStart(2, "0")}:00</div>
                  {dias.map((d) => {
                    const slots = items.filter((it) => {
                      const startHour = parseInt(it.inicio.split(":")[0]);
                      const endHour = parseInt(it.fin.split(":")[0]);
                      if (startHour === endHour) {
                        return it.dia === d && h === startHour;
                      }
                      return it.dia === d && h >= startHour && h < endHour;
                    });
                    return (
                      <div key={`${d}-${h}`} className="border-b border-r border-border last:border-r-0 p-1 min-h-[64px] hover:bg-muted/20 transition">
                        {slots.map((s) => (
                          <div 
                            key={s.id} 
                            onClick={() => setEditingItem(s)}
                            className={cn("rounded-lg border-l-4 p-1.5 mb-1 cursor-pointer hover:shadow-elegant transition-all text-left", colorMap[s.color] ?? colorMap.primary)}
                          >
                            <p className="text-[11px] font-bold leading-tight truncate">{s.titulo}</p>
                            <p className="text-[9px] opacity-80 mt-0.5 font-medium">{s.inicio}–{s.fin}</p>
                            <p className="text-[9px] opacity-70 truncate mt-0.5">{s.instalacion}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        /* VISTA 2: CALENDARIO MENSUAL ELEGANT LIGHT MODE (ACADEMIA DEPORTIVA PRO) */
        <Card className="shadow-xl overflow-hidden bg-white border-slate-200/80 rounded-3xl p-6 space-y-6">
          {/* Header del Calendario */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-sm">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-black text-xl tracking-tight text-slate-900 flex items-center gap-2">
                  {currentMonth}
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-2.5 py-0.5 font-bold uppercase">
                    31 DÍAS DE ACTIVIDAD
                  </Badge>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Programación oficial de entrenamientos y partidos por categoría</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
                <Button size="xs" variant="ghost" className="h-7 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs font-bold px-3 text-slate-800">Julio 2026</span>
                <Button size="xs" variant="ghost" className="h-7 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg"><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs rounded-xl shadow-sm">
                Hoy
              </Button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-slate-500 py-2.5 uppercase tracking-wider bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="text-rose-600 font-black">DOMINGO</div>
            <div>LUNES</div>
            <div>MARTES</div>
            <div>MIÉRCOLES</div>
            <div>JUEVES</div>
            <div>VIERNES</div>
            <div className="text-indigo-600 font-black">SÁBADO</div>
          </div>

          {/* Grilla Mensual de Días */}
          <div className="grid grid-cols-7 gap-2 text-xs">
            {/* Días previos del mes anterior */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[125px] p-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 opacity-40 text-[11px] font-bold text-slate-400">
                {28 + i}
              </div>
            ))}
            
            {/* Días de Julio */}
            {Array.from({ length: 31 }).map((_, i) => {
              const dayNum = i + 1;
              const isToday = dayNum === 21;
              const dayOfWeekIndex = (i + 3) % 7;
              const dayNamesMap = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
              const currentDayName = dayNamesMap[dayOfWeekIndex];
              const dayEvents = items.filter(it => it.dia === currentDayName);

              return (
                <div 
                  key={dayNum} 
                  className={cn(
                    "min-h-[130px] p-2.5 rounded-2xl border flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md group relative overflow-hidden",
                    isToday 
                      ? "border-purple-500 bg-gradient-to-b from-purple-50/80 via-white to-purple-50/30 ring-2 ring-purple-500/20" 
                      : "border-slate-200/80 bg-white hover:border-indigo-300 hover:bg-slate-50/40"
                  )}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className={cn(
                      "font-black text-xs px-2 py-0.5 rounded-lg",
                      isToday ? "bg-purple-600 text-white shadow-sm" : "text-slate-800"
                    )}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0 font-bold">
                        {dayEvents.length} {dayEvents.length === 1 ? "sesión" : "sesiones"}
                      </Badge>
                    ) : (
                      <span className="text-[9px] text-slate-300 font-medium">—</span>
                    )}
                  </div>

                  <div className="space-y-1.5 my-1.5 flex-1 flex flex-col justify-start">
                    {dayEvents.slice(0, 2).map((ev, idx) => {
                      const cleanTitle = ev.titulo.replace("Entrenamiento - ", "");
                      const isFutbol = cleanTitle.toLowerCase().includes("fútbol") || cleanTitle.toLowerCase().includes("delanteros") || cleanTitle.toLowerCase().includes("táctico");
                      const isBasket = cleanTitle.toLowerCase().includes("basket") || cleanTitle.toLowerCase().includes("tiro");
                      
                      return (
                        <div 
                          key={idx} 
                          onClick={() => setEditingItem(ev)}
                          className={cn(
                            "p-1.5 rounded-xl border text-[10px] leading-tight font-bold cursor-pointer transition-all duration-150 shadow-sm flex items-center justify-between gap-1",
                            isFutbol 
                              ? "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-600 hover:text-white" 
                              : isBasket
                              ? "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-500 hover:text-white"
                              : "bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-600 hover:text-white"
                          )}
                        >
                          <span className="truncate font-semibold">{cleanTitle}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-black/5 font-bold shrink-0">{ev.inicio}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <p className="text-[10px] text-purple-600 font-bold text-center pt-0.5 group-hover:underline">
                        + {dayEvents.length - 2} más
                      </p>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-400 font-medium truncate pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span className="truncate">{dayEvents[0]?.instalacion || "Sin actividad"}</span>
                    <span className="text-[8px] text-slate-400 font-bold">U15</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 text-xs pt-1">
        <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15" variant="secondary">Fútbol</Badge>
        <Badge className="bg-warning/10 text-warning border border-warning/20 hover:bg-warning/15" variant="secondary">Baloncesto</Badge>
        <Badge className="bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/15" variant="secondary">Femenino</Badge>
        <Badge className="bg-muted text-muted-foreground border border-transparent hover:bg-muted" variant="secondary">Natación</Badge>
        <Badge className="bg-success/10 text-success border border-success/20 hover:bg-success/15" variant="secondary">Abierto</Badge>
      </div>

      {/* Create Modal */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Programar Entrenamiento
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
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre del Entrenamiento *</label>
                <input 
                  type="text" 
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="E.g. Élite Sub-12 - Técnico"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Día de la Semana *</label>
                  <select 
                    value={form.dia}
                    onChange={e => setForm(f => ({ ...f, dia: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {dias.map(day => (
                      <option key={day} value={day} className="bg-background text-foreground">{day}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Categoría Visual (Color) *</label>
                  <select 
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="primary" className="text-primary">Fútbol (Púrpura)</option>
                    <option value="warning" className="text-warning">Baloncesto (Amarillo)</option>
                    <option value="destructive" className="text-destructive">Femenino (Rojo)</option>
                    <option value="success" className="text-success">Abierto (Verde)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Hora Inicio *</label>
                  <input 
                    type="time" 
                    value={form.inicio}
                    onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Hora Fin *</label>
                  <input 
                    type="time" 
                    value={form.fin}
                    onChange={e => setForm(f => ({ ...f, fin: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Instalación *</label>
                  <input 
                    type="text" 
                    value={form.instalacion}
                    onChange={e => setForm(f => ({ ...f, instalacion: e.target.value }))}
                    placeholder="E.g. Cancha Principal"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleCreate}
                >
                  Programar Entrenamiento
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

      {/* Edit / Delete Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" /> Editar Horario de Entrenamiento
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
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre del Entrenamiento *</label>
                <input 
                  type="text" 
                  value={editingItem.titulo}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Día de la Semana *</label>
                  <select 
                    value={editingItem.dia}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, dia: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {dias.map(day => (
                      <option key={day} value={day} className="bg-background text-foreground">{day}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Categoría Visual (Color) *</label>
                  <select 
                    value={editingItem.color}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, color: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="primary" className="text-primary">Fútbol (Púrpura)</option>
                    <option value="warning" className="text-warning">Baloncesto (Amarillo)</option>
                    <option value="destructive" className="text-destructive">Femenino (Rojo)</option>
                    <option value="success" className="text-success">Abierto (Verde)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Hora Inicio *</label>
                  <input 
                    type="time" 
                    value={editingItem.inicio}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, inicio: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Hora Fin *</label>
                  <input 
                    type="time" 
                    value={editingItem.fin}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, fin: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Instalación *</label>
                  <input 
                    type="text" 
                    value={editingItem.instalacion}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, instalacion: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-grow bg-primary text-white text-xs font-bold"
                  onClick={handleUpdate}
                >
                  Guardar Cambios
                </Button>
                <Button 
                  variant="destructive" 
                  className="text-xs font-bold px-3 text-white" 
                  onClick={() => handleDelete(editingItem.id, editingItem.titulo)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
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

export default HorariosPage;
