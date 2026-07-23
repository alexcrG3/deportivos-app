import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays, Plus, Pencil, Trash2, X, Save, ChevronDown, ChevronUp,
  Target, BookOpen, CalendarRange, AlertTriangle, Check, Shield, Zap,
  Activity, ArrowRight, Dribbble, Sparkles, Coffee, Calendar as CalendarIcon,
  MapPin, Clock, Award, Users, Layers, FileDown
} from "lucide-react";
import { toast } from "sonner";
import { TacticalStore } from "@/lib/tactical-store";
import RendimientoStore from "@/lib/rendimiento-store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_app/tactica/planificacion")({ component: PlanificacionTactica });

// ─── Types ───────────────────────────────────────────────────────────────────
interface WeekPlan {
  semana: string;       // e.g. "01/07 al 07/07"
  contenidos: string[]; // up to 4 contenidos
}

interface MonthPlan {
  mes: string;          // Auto-calculated (e.g. "Julio")
  fechaInicio: string;  // e.g. "2026-07-01"
  fechaFin: string;     // e.g. "2026-07-31"
  semanas: WeekPlan[];
  nota?: string;
}

interface PlanCategory {
  tecnica: string[];
  tactica: string[];
  fisica: string[];
}

interface TrainingPlan {
  id: string;
  categoria: string;
  objetivo: string;
  entrenador: string;
  equipo: string;
  contenidos: PlanCategory;
  meses: MonthPlan[];
  notaFinal?: string;
  creadoEn: string;
}

const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Helper to auto-calculate month name and weekly ranges based on start and end dates
function calcularSemanasYMes(inicioStr: string, finStr: string): { mes: string; semanas: WeekPlan[] } {
  if (!inicioStr || !finStr) {
    return {
      mes: "Sin definir",
      semanas: Array.from({ length: 4 }, (_, i) => ({ semana: `Semana ${i + 1}`, contenidos: ["", "", "", ""] }))
    };
  }

  const start = new Date(inicioStr + "T00:00:00");
  const end = new Date(finStr + "T00:00:00");
  
  // 1. Calculate month name from start date
  const mes = NOMBRES_MESES[start.getMonth()] || "Sin definir";

  // 2. Divide date range into 4 segments
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const daysPerSegment = Math.max(1, Math.floor(diffDays / 4));

  const semanas: WeekPlan[] = Array.from({ length: 4 }, (_, si) => {
    const sStart = new Date(start);
    sStart.setDate(start.getDate() + si * daysPerSegment);
    
    const sEnd = new Date(start);
    // For the last week, stretch to the exact end date to handle rounding
    if (si === 3) {
      sEnd.setTime(end.getTime());
    } else {
      sEnd.setDate(start.getDate() + (si + 1) * daysPerSegment - 1);
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const label = `${pad(sStart.getDate())}/${pad(sStart.getMonth() + 1)} al ${pad(sEnd.getDate())}/${pad(sEnd.getMonth() + 1)}`;
    return {
      semana: label,
      contenidos: ["", "", "", ""]
    };
  });

  return { mes, semanas };
}

// ─── Initial Data (se carga solo si no existe nada en localStorage) ─────────
const INITIAL_PLANS: TrainingPlan[] = [
  {
    id: "plan-u13-edgar-2026",
    categoria: "",
    objetivo: "Desarrollo de la técnica individual, comprensión de la táctica de juego colectiva y tomas de decisiones rápidas.",
    entrenador: "Edgar Calderón",
    equipo: "U13",
    contenidos: {
      tecnica: [
        "Pase corto y largo preciso",
        "Control orientado bajo presión",
        "Conducción veloz y amagues",
        "Finalización de jugadas de ataque",
        "Juego de cabeza básico",
      ],
      tactica: [
        "Desmarques de apoyo y ruptura",
        "Coberturas defensivas recíprocas",
        "Amplitud de juego por bandas",
        "Transiciones defensa-ataque rápidas",
        "Presión alta y recuperación de balón",
      ],
      fisica: [
        "Velocidad de reacción y aceleración",
        "Coordinación motriz específica",
        "Agilidad en giros y frenos",
        "Fuerza funcional general",
        "Resistencia aeróbica básica",
      ],
    },
    meses: [
      {
        mes: "Julio",
        fechaInicio: "2026-07-01",
        fechaFin: "2026-07-31",
        nota: "SEMANA DEL 15 AL 21 NO SE TRABAJA",
        semanas: [
          { semana: "01/07 al 07/07", contenidos: ["Coordinación", "Pase y control orientado", "Rondo 4 vs 1, 2 vs 2", "Colectivo dirigido"] },
          { semana: "08/07 al 14/07", contenidos: ["Posición de balón", "Desmarques de apoyo", "Juego de posesión", "Mini-campeonato de 5"] },
          { semana: "15/07 al 22/07", contenidos: ["Conducción del balón", "1 vs 1 y 2vs 2", "Remates – definición", "Línea de fondo y definición"] },
          { semana: "23/07 al 31/07", contenidos: ["Combinaciones de pases", "Vascular", "Posicionamiento de líneas", "Colectivo dirigido"] },
        ],
      },
      {
        mes: "Agosto",
        fechaInicio: "2026-08-01",
        fechaFin: "2026-08-31",
        nota: "Se estará valorando iniciar campeonato última semana de agosto.",
        semanas: [
          { semana: "01/08 al 07/08", contenidos: ["Marcaje individual", "Temporización defensiva", "Recuperación tras perdida", "Posicionamiento táctico"] },
          { semana: "08/08 al 14/08", contenidos: ["Coberturas", "Superioridad numérica", "Posicionamiento táctico", "Colectivo dirigido"] },
          { semana: "15/08 al 22/08", contenidos: ["Transiciones", "Salidas de juego (portería)", "Posesión y progresión de juego", "Juego por sector de la cancha"] },
          { semana: "23/08 al 31/08", contenidos: ["Vascular", "Cambio de ritmo", "Evaluación técnica y táctica", "Evaluación – colectivo."] },
        ],
      },
    ],
    creadoEn: "2026-07-01",
  },
];

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = "deportivos_training_plans";

function loadPlans(): TrainingPlan[] {
  if (typeof window === "undefined") return INITIAL_PLANS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Auto-migration: remove old dummy plan IDs from previous versions
    const OLD_IDS = ["plan-sub13-2026", "plan-sub15-2026"];
    let saved: TrainingPlan[] = raw ? JSON.parse(raw) : [];
    // Strip any stale dummy plans
    saved = saved.filter(p => !OLD_IDS.includes(p.id));
    // Merge in initial plans if not already present
    const merged = [...saved];
    INITIAL_PLANS.forEach(ip => {
      if (!merged.some(p => p.id === ip.id)) merged.push(ip);
    });
    // Persist the cleaned/merged result
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch { return INITIAL_PLANS; }
}

function savePlans(plans: TrainingPlan[]) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

// ─── Blank plan template ──────────────────────────────────────────────────────
function blankPlan(coachNameArg = "", equipoArg = ""): TrainingPlan {
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split("T")[0];
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split("T")[0];
  
  const { mes, semanas } = calcularSemanasYMes(primerDiaMes, ultimoDiaMes);

  return {
    id: `plan-${Date.now()}`,
    categoria: "",
    objetivo: "",
    entrenador: coachNameArg,
    equipo: equipoArg,
    contenidos: { tecnica: [""], tactica: [""], fisica: [""] },
    meses: [
      {
        mes,
        fechaInicio: primerDiaMes,
        fechaFin: ultimoDiaMes,
        semanas,
      },
    ],
    notaFinal: "",
    creadoEn: hoy.toISOString().split("T")[0],
  };
}

// ─── Plan Form Modal ──────────────────────────────────────────────────────────
function PlanModal({ plan, onSave, onClose }: {
  plan: TrainingPlan;
  onSave: (p: TrainingPlan) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<TrainingPlan>(JSON.parse(JSON.stringify(plan)));

  const setField = (field: keyof TrainingPlan, val: any) =>
    setDraft(d => ({ ...d, [field]: val }));

  const setContenido = (col: keyof PlanCategory, i: number, val: string) => {
    const arr = [...draft.contenidos[col]];
    arr[i] = val;
    setDraft(d => ({ ...d, contenidos: { ...d.contenidos, [col]: arr } }));
  };

  const addContenido = (col: keyof PlanCategory) =>
    setDraft(d => ({ ...d, contenidos: { ...d.contenidos, [col]: [...d.contenidos[col], ""] } }));

  const removeContenido = (col: keyof PlanCategory, i: number) => {
    const arr = draft.contenidos[col].filter((_, idx) => idx !== i);
    setDraft(d => ({ ...d, contenidos: { ...d.contenidos, [col]: arr } }));
  };

  const handleDateRangeChange = (mi: number, field: "fechaInicio" | "fechaFin", dateVal: string) => {
    const mesObj = { ...draft.meses[mi], [field]: dateVal };
    
    // Auto-recalculate month name and week intervals dynamically
    const { mes, semanas } = calcularSemanasYMes(mesObj.fechaInicio, mesObj.fechaFin);
    
    // Merge contents to keep what the user already typed in the inputs, just update the headers
    const updatedSemanas = semanas.map((s, si) => {
      const existing = draft.meses[mi].semanas[si];
      return {
        ...s,
        contenidos: existing ? existing.contenidos : s.contenidos
      };
    });

    const meses = draft.meses.map((m, i) => i === mi ? {
      ...m,
      [field]: dateVal,
      mes,
      semanas: updatedSemanas
    } : m);

    setDraft(d => ({ ...d, meses }));
  };

  const setMesField = (mi: number, field: "nota", val: string) => {
    const meses = draft.meses.map((m, i) => i === mi ? { ...m, [field]: val } : m);
    setDraft(d => ({ ...d, meses }));
  };

  const setSemContenido = (mi: number, si: number, ci: number, val: string) => {
    const meses = draft.meses.map((m, i) =>
      i === mi ? {
        ...m,
        semanas: m.semanas.map((s, j) => {
          if (j !== si) return s;
          const cont = [...s.contenidos];
          cont[ci] = val;
          return { ...s, contenidos: cont };
        })
      } : m
    );
    setDraft(d => ({ ...d, meses }));
  };

  const addMes = () => {
    const hoy = new Date();
    const start = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split("T")[0];
    const end = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split("T")[0];
    const { mes, semanas } = calcularSemanasYMes(start, end);

    setDraft(d => ({
      ...d,
      meses: [...d.meses, {
        mes,
        fechaInicio: start,
        fechaFin: end,
        semanas,
      }]
    }));
  };

  const removeMes = (i: number) =>
    setDraft(d => ({ ...d, meses: d.meses.filter((_, idx) => idx !== i) }));

  const handleSave = () => {
    if (!draft.categoria.trim()) { toast.error("La categoría es obligatoria"); return; }
    if (!draft.objetivo.trim()) { toast.error("El objetivo es obligatorio"); return; }
    onSave(draft);
  };

  const cols: { key: keyof PlanCategory; label: string; icon: any }[] = [
    { key: "tecnica", label: "Trabajo de Técnica aplicado", icon: Award },
    { key: "tactica", label: "Táctica individual y colectiva", icon: Shield },
    { key: "fisica", label: "Conceptos básicos parte física", icon: Zap },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-md overflow-y-auto py-8 px-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all scale-95 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">
                {plan.id.startsWith("plan-") && plan.categoria === "" ? "Nueva Planificación" : "Editar Planificación"}
              </h2>
              <p className="text-xs text-muted-foreground">Configura el currículum de entrenamiento mensual</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Categoría *</label>
              <Input value={draft.categoria} onChange={e => setField("categoria", e.target.value)} placeholder="Ej: Sub-13 A, U-11 Masculino..." className="h-10 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Equipo</label>
              <Input value={draft.equipo} onChange={e => setField("equipo", e.target.value)} placeholder="Ej: Élite Sub-12 A" className="h-10 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Entrenador</label>
              <Input value={draft.entrenador} onChange={e => setField("entrenador", e.target.value)} placeholder="Ej: Carlos Méndez" className="h-10 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fecha de creación</label>
              <Input type="date" value={draft.creadoEn} onChange={e => setField("creadoEn", e.target.value)} className="h-10 text-sm" />
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Objetivo General *</label>
              <Textarea value={draft.objetivo} onChange={e => setField("objetivo", e.target.value)} placeholder="Describa el objetivo formativo principal de la categoría..." rows={2} className="text-sm resize-none" />
            </div>
          </div>

          {/* Pillars Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase text-foreground tracking-wider">Pilares de Trabajo por Bloque</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cols.map(({ key, label, icon: Icon }) => (
                <div key={key} className="bg-muted/30 border border-border/80 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Icon className="h-4 w-4" />
                    <p className="text-xs font-bold">{label}</p>
                  </div>
                  <div className="space-y-2">
                    {draft.contenidos[key].map((item, i) => (
                      <div key={i} className="flex gap-1.5 items-center">
                        <Input value={item} onChange={e => setContenido(key, i, e.target.value)} placeholder="Ej: Control orientado..." className="h-8 text-xs flex-1" />
                        <button onClick={() => removeContenido(key, i)} className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addContenido(key)} className="text-[10px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1 mt-1 transition-colors">
                    <Plus className="h-3.5 w-3.5" /> Agregar ítem
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Plans */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold uppercase text-foreground tracking-wider">Cronograma Mensual</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8 border-border hover:bg-muted text-foreground" onClick={addMes}>
                <Plus className="h-3.5 w-3.5" /> Agregar Mes
              </Button>
            </div>

            {draft.meses.map((mes, mi) => (
              <div key={mi} className="border border-border bg-muted/20 hover:bg-muted/30 rounded-xl p-4 space-y-4 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 text-primary font-bold text-xs">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>Mes: {mes.mes}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-medium">Desde:</span>
                      <Input
                        type="date"
                        value={mes.fechaInicio}
                        onChange={e => handleDateRangeChange(mi, "fechaInicio", e.target.value)}
                        className="h-8 text-xs w-[130px]"
                      />
                      <span className="text-muted-foreground font-medium ml-1">Hasta:</span>
                      <Input
                        type="date"
                        value={mes.fechaFin}
                        onChange={e => handleDateRangeChange(mi, "fechaFin", e.target.value)}
                        className="h-8 text-xs w-[130px]"
                      />
                    </div>
                  </div>

                  <button onClick={() => removeMes(mi)} className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-muted/80 transition-colors ml-auto">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Weeks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {mes.semanas.map((s, si) => (
                    <div key={si} className="bg-card border border-border/80 rounded-lg p-3 space-y-2">
                      <div className="bg-primary/5 text-primary text-[10px] font-bold text-center rounded py-1 px-1.5 border border-primary/10 select-none">
                        Semana {si + 1}
                        <div className="text-[8px] text-muted-foreground/80 font-normal mt-0.5">{s.semana}</div>
                      </div>
                      <div className="space-y-1.5">
                        {[0, 1, 2, 3].map(ci => (
                          <Input key={ci} value={s.contenidos[ci] || ""} onChange={e => setSemContenido(mi, si, ci, e.target.value)} placeholder={`Contenido ${ci + 1}`} className="h-7 text-[10px] bg-muted/40 border-transparent focus-visible:bg-card focus-visible:border-border" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 items-center bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <Input value={mes.nota || ""} onChange={e => setMesField(mi, "nota", e.target.value)} placeholder="Nota del mes (Ej: SEMANA DEL 15 AL 21 NO SE TRABAJA)..." className="bg-transparent border-0 text-amber-500 placeholder:text-amber-500/40 text-xs p-0 h-auto focus-visible:ring-0 w-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Nota Final */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Notas Adicionales de Temporada</label>
            <Textarea value={draft.notaFinal || ""} onChange={e => setField("notaFinal", e.target.value)} placeholder="Notas sobre el inicio de campeonatos, evaluaciones, etc..." rows={2} className="text-sm resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-border bg-muted/40">
          <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted text-xs" onClick={onClose}>Cancelar</Button>
          <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-white text-xs gap-1.5 shadow-elegant" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" /> Guardar Planificación
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ planName, onConfirm, onCancel }: { planName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-destructive/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Eliminar planificación</p>
            <p className="text-xs text-muted-foreground">Esta acción borrará permanentemente el plan.</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">¿Estás seguro de que deseas eliminar la planificación para <span className="text-foreground font-semibold">"{planName}"</span>?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted text-xs" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-white text-xs gap-1.5" onClick={onConfirm}>
            <Trash2 className="h-3.5 w-3.5" /> Sí, eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onEdit, onDelete }: { plan: TrainingPlan; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(true);

  const cols = [
    { label: "Trabajo de Técnica aplicado", items: plan.contenidos.tecnica, icon: Award, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
    { label: "Táctica individual y colectiva", items: plan.contenidos.tactica, icon: Shield, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { label: "Conceptos básicos parte física", items: plan.contenidos.fisica, icon: Zap, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  ];

  return (
    <Card className="bg-gradient-to-br from-card/90 to-card/60 border border-border/80 hover:border-primary/30 transition-all duration-300 shadow-elegant hover:shadow-xl hover:shadow-primary/5 rounded-2xl overflow-hidden">
      {/* Card Header */}
      <CardHeader className="pb-4 bg-muted/20 border-b border-border/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-elegant">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground font-black tracking-tight">{plan.categoria}</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="font-semibold">{plan.equipo}</span>
                <span>•</span>
                <span>Responsable: <span className="text-foreground font-medium">{plan.entrenador}</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] py-1 border-border bg-muted/40 font-semibold text-muted-foreground">{plan.creadoEn}</Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-muted transition-all" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Objetivo Format */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-primary/20 text-primary p-1.5 rounded-lg shrink-0">
              <Target className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Objetivo de la Categoría</p>
              <p className="text-sm text-foreground/90 font-medium leading-relaxed">{plan.objetivo}</p>
            </div>
          </div>
        </div>

        {/* Pillars Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cols.map(({ label, items, icon: Icon, color }) => (
            <div key={label} className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-3 shadow-inner">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-md border ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-black text-foreground tracking-tight leading-snug">{label}</p>
              </div>
              <ul className="space-y-2">
                {items.filter(Boolean).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground group">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary shrink-0 mt-1.5 transition-colors" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Monthly schedules toggler */}
        <div className="border-t border-border/60 pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className="font-bold uppercase tracking-wider text-[11px]">Planes Mensuales ({plan.meses.length})</span>
            </div>
            {expanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
          </button>

          {expanded && (
            <div className="mt-5 space-y-8 animate-fade-in">
              {plan.meses.map((mes, mi) => (
                <div key={mi} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <h4 className="text-xs font-black text-foreground uppercase tracking-widest">Plan de {mes.mes}</h4>
                    </div>
                    {mes.fechaInicio && mes.fechaFin && (
                      <div className="text-[10px] text-muted-foreground font-semibold bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                        {mes.fechaInicio.split("-").reverse().join("/")} al {mes.fechaFin.split("-").reverse().join("/")}
                      </div>
                    )}
                  </div>

                  {mes.nota && (
                    <div className="flex items-start gap-2.5 text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs leading-relaxed font-bold">
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <div>{mes.nota}</div>
                    </div>
                  )}

                  {/* Kanban Style Grid (Weeks) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mes.semanas.map((s, si) => {
                      const isRestWeek = mes.mes === "Julio" && si === 2; // matching July week 3

                      return (
                        <div
                          key={si}
                          className={`relative border rounded-xl p-4 shadow-sm transition-all duration-300 ${
                            isRestWeek
                              ? "bg-amber-500/5 border-amber-500/20 text-amber-500/80 shadow-amber-500/5"
                              : "bg-card/40 border-border/60 hover:bg-card/80 hover:border-primary/20"
                          }`}
                        >
                          {/* Diagonal pattern overlay for rest week */}
                          {isRestWeek && (
                            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[size:10px_10px] rounded-xl pointer-events-none" />
                          )}

                          <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Semana # {si + 1}</p>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0.5 border ${
                              isRestWeek
                                ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                                : "border-border/80 text-muted-foreground bg-muted/30"
                            }`}>
                              {s.semana}
                            </Badge>
                          </div>

                          {isRestWeek ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                              <div className="bg-amber-500/20 p-2 rounded-xl">
                                <Coffee className="h-5 w-5 text-amber-500" />
                              </div>
                              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Receso / Descanso</p>
                              <p className="text-[10px] text-amber-500/70">Sin entrenamientos planificados</p>
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {s.contenidos.filter(Boolean).map((cont, ci) => (
                                <li key={ci} className="bg-muted/30 hover:bg-primary/5 border border-border/20 rounded-lg p-2 text-xs font-medium text-foreground/95 transition-all">
                                  {cont}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function PlanificacionTactica() {
  const { role, coachName, selectedCoachName } = useRole();
  const [plans, setPlans] = useState<TrainingPlan[]>(() => loadPlans());
  const [modal, setModal] = useState<{ open: boolean; plan: TrainingPlan | null }>({ open: false, plan: null });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Get teams dynamically from RendimientoStore, fallback to mock data
  const availableTeams = useMemo(() => {
    const list = [...RendimientoStore.getEquipos()];
    const hasU13 = list.some(t => t.nombre.toLowerCase() === "u13" || t.categoria.toLowerCase().includes("13") || t.nombre.toLowerCase().includes("13"));
    if (!hasU13) {
      list.unshift({ id: "eq13_temp", nombre: "U13", categoria: "Sub-13 Fútbol", disciplina: "Fútbol", entrenador: "Edgar Calderón", jugadores: 0, uniforme: "Verde / Blanco", estado: "activo" });
    }
    return list;
  }, []);

  // New Tab & Selection States
  const [activeTab, setActiveTab] = useState<"semanal" | "microciclos" | "mesociclos" | "temporada">("semanal");
  const [selectedTeam, setSelectedTeam] = useState(() => {
    const sub13 = availableTeams.find(t => t.nombre.toLowerCase() === "u13" || t.nombre.toLowerCase().includes("13"));
    return sub13 ? sub13.nombre : (availableTeams[0]?.nombre || "U13");
  });

  // Temporada Phases State (localStorage)
  const [annualPhases, setAnnualPhases] = useState(() => {
    const INITIAL_PHASES = [
      { nombre: "Pretemporada", inicio: "2026-01-06", fin: "2026-01-31", notas: "Evaluaciones físicas y tests iniciales.", estado: "Terminado" },
      { nombre: "Temporada Baja", inicio: "2026-02-01", fin: "2026-03-31", notas: "Construcción física y táctica grupal.", estado: "Terminado" },
      { nombre: "Liga Nacional", inicio: "2026-04-01", fin: "2026-07-15", notas: "Fase competitiva regular y torneo oficial.", estado: "Terminado" },
      { nombre: "Vacaciones", inicio: "2026-07-16", fin: "2026-07-31", notas: "Receso de invierno y campamentos libres.", estado: "Terminado" },
      { nombre: "Campamento", inicio: "2026-08-01", fin: "2026-08-07", notas: "Refuerzo técnico específico individual.", estado: "Terminado" },
      { nombre: "Copa Nacional", inicio: "2026-08-08", fin: "2026-10-31", notas: "Eliminatorias directas e inter-sedes.", estado: "En Curso" },
      { nombre: "Evaluaciones", inicio: "2026-11-01", fin: "2026-11-15", notas: "Cierre técnico y feedback individual.", estado: "Próximamente" },
      { nombre: "Tests Físicos", inicio: "2026-11-16", fin: "2026-11-30", notas: "Evaluación de progresiones anuales.", estado: "Próximamente" },
      { nombre: "Fin de Temporada", inicio: "2026-12-01", fin: "2026-12-31", notas: "Cierre del ciclo académico anual.", estado: "Próximamente" },
    ];
    if (typeof window === "undefined") return INITIAL_PHASES;
    const raw = localStorage.getItem("deportivos_annual_phases");
    if (!raw) {
      localStorage.setItem("deportivos_annual_phases", JSON.stringify(INITIAL_PHASES));
      return INITIAL_PHASES;
    }
    return JSON.parse(raw);
  });

  const saveAnnualPhases = (newPhases: any[]) => {
    setAnnualPhases(newPhases);
    localStorage.setItem("deportivos_annual_phases", JSON.stringify(newPhases));
  };

  // Phase editing states
  const [openEditPhase, setOpenEditPhase] = useState(false);
  const [editingPhaseIdx, setEditingPhaseIdx] = useState<number | null>(null);
  const [phaseName, setPhaseName] = useState("");
  const [phaseStart, setPhaseStart] = useState("");
  const [phaseEnd, setPhaseEnd] = useState("");
  const [phaseNotas, setPhaseNotas] = useState("");
  const [phaseStatus, setPhaseStatus] = useState("");

  const handleEditPhaseClick = (idx: number) => {
    const phase = annualPhases[idx];
    if (!phase) return;
    setEditingPhaseIdx(idx);
    setPhaseName(phase.nombre);
    setPhaseStart(phase.inicio);
    setPhaseEnd(phase.fin);
    setPhaseNotas(phase.notas || "");
    setPhaseStatus(phase.estado || "Próximamente");
    setOpenEditPhase(true);
  };

  const handleSavePhase = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...annualPhases];
    const newPhase = {
      nombre: phaseName,
      inicio: phaseStart,
      fin: phaseEnd,
      notas: phaseNotas,
      estado: phaseStatus
    };
    if (editingPhaseIdx === null) {
      updated.push(newPhase);
      toast.success("Nueva fase de temporada creada correctamente.");
    } else {
      updated[editingPhaseIdx] = newPhase;
      toast.success("Fase de temporada modificada correctamente.");
    }
    saveAnnualPhases(updated);
    setOpenEditPhase(false);
  };

  const handleExportSeasonPdf = () => {
    if ((window as any).__exportingSeasonPdf) return;
    (window as any).__exportingSeasonPdf = true;
    setTimeout(() => {
      (window as any).__exportingSeasonPdf = false;
    }, 1000);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Por favor, permite las ventanas emergentes para exportar el PDF.");
      return;
    }

    const phasesHtml = annualPhases.map(p => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-weight: bold; color: #1e293b; font-size: 13px;">${p.nombre}</td>
        <td style="padding: 12px; color: #475569; font-size: 13px;">${p.inicio.split("-").reverse().join("/")} al ${p.fin.split("-").reverse().join("/")}</td>
        <td style="padding: 12px; color: #64748b; font-size: 13px;">${p.estado}</td>
        <td style="padding: 12px; color: #334155; font-size: 13px;">${p.notas || "Sin observaciones"}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Temporada 2026 - DeportivOS</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 50px; color: #334155; line-height: 1.5; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #6366f1; padding-bottom: 15px; margin-bottom: 30px; }
            h1 { margin: 0; color: #1e1b4b; font-size: 24px; font-weight: 800; }
            .subtitle { color: #64748b; font-size: 12px; font-weight: 600; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8fafc; text-align: left; padding: 12px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; }
            .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>DEPORTIVOS - PLANIFICACIÓN ANUAL</h1>
              <div class="subtitle">Reporte Oficial de Fases y Periodos Clave (Temporada 2026)</div>
            </div>
            <div style="font-size: 12px; color: #64748b; text-align: right;">
              Generado: ${new Date().toLocaleDateString("es-CR")}<br>
              Responsable: Edgar Calderón
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fase de Temporada</th>
                <th>Periodo de Duración</th>
                <th>Estado</th>
                <th>Observaciones / Notas Metodológicas</th>
              </tr>
            </thead>
            <tbody>
              ${phasesHtml}
            </tbody>
          </table>
          <div class="footer">
            Academia Deportiva Élite © 2026 · DeportivOS - Inteligencia Deportiva Aplicada
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Nuevo Ciclo Modal States
  const [openCreatePlan, setOpenCreatePlan] = useState(false);
  const [openSelectorModal, setOpenSelectorModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");
  const [planStart, setPlanStart] = useState("");
  const [planEnd, setPlanEnd] = useState("");
  const [planObjectives, setPlanObjectives] = useState("");
  const [planExercises, setPlanExercises] = useState<{ id: string; nombre: string; duracion: number }[]>([
    { id: "ex_1", nombre: "", duracion: 15 }
  ]);

  const handleAddExerciseField = () => {
    setPlanExercises(prev => [...prev, { id: `ex_${Date.now()}_${Math.random()}`, nombre: "", duracion: 15 }]);
  };

  const handleRemoveExerciseField = (id: string) => {
    if (planExercises.length <= 1) return;
    setPlanExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const handleExerciseChange = (id: string, field: "nombre" | "duracion", value: any) => {
    setPlanExercises(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.nombre);
    setPlanStart(plan.fecha_inicio);
    setPlanEnd(plan.fecha_fin);
    setPlanObjectives(plan.objetivos || "");
    setPlanExercises(plan.ejercicios && plan.ejercicios.length > 0 ? plan.ejercicios.map((ex: any) => ({
      id: ex.id,
      nombre: ex.nombre,
      duracion: ex.duracion
    })) : [{ id: "ex_1", nombre: "", duracion: 15 }]);
    setOpenCreatePlan(true);
  };

  const handleSaveTeamPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !planStart || !planEnd) {
      toast.error("Por favor completa los campos requeridos (Nombre, Fecha Inicio y Fin).");
      return;
    }

    const newPlan = {
      id: editingPlanId || `plan_${Date.now()}`,
      nombre: planName,
      fecha_inicio: planStart,
      fecha_fin: planEnd,
      objetivos: planObjectives,
      ejercicios: planExercises.filter(ex => ex.nombre.trim() !== "").map(ex => ({
        id: ex.id,
        nombre: ex.nombre,
        duracion: Number(ex.duracion || 0)
      })),
      equipo: selectedTeam,
      organizacion_id: RendimientoStore.getActiveOrganizacionId()
    };

    await RendimientoStore.addPlanificacion(newPlan);
    toast.success(editingPlanId ? "Planificación de microciclo modificada con éxito." : "Planificación de microciclo guardada exitosamente.");
    setOpenCreatePlan(false);
    // Reset fields
    setEditingPlanId(null);
    setPlanName("");
    setPlanStart("");
    setPlanEnd("");
    setPlanObjectives("");
    setPlanExercises([{ id: "ex_1", nombre: "", duracion: 15 }]);
  };

  const teamPlanificaciones = useMemo(() => {
    const list = RendimientoStore.getPlanificaciones();
    const clean = (s: string = "") => s.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/futbol|fútbol|basquetbol|baloncesto|voleibol|elite|élite/g, "");
    const isSameTeam = (a: string = "", b: string = "") => {
      const ca = clean(a);
      const cb = clean(b);
      return ca === cb || ca.includes(cb) || cb.includes(ca);
    };
    return list.filter(p => isSameTeam(p.equipo, selectedTeam));
  }, [selectedTeam, openCreatePlan]);

  const weeklyPlans = useMemo(() => TacticalStore.getWeeklyPlans(), []);
  const activeWeeklyPlan = useMemo(() => {
    const clean = (s: string = "") => s.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/futbol|fútbol|basquetbol|baloncesto|voleibol|elite|élite/g, "");
    const isSameTeam = (a: string = "", b: string = "") => {
      const ca = clean(a);
      const cb = clean(b);
      return ca === cb || ca.includes(cb) || cb.includes(ca);
    };
    const targetCoachName = (role === "admin" && selectedCoachName) ? selectedCoachName : (role === "coach" ? coachName : null);
    const matches = weeklyPlans.filter(wp => isSameTeam(wp.equipo, selectedTeam));
    if (targetCoachName) {
      const filtered = matches.filter(wp => wp.responsable && wp.responsable.toLowerCase() === targetCoachName.toLowerCase());
      if (filtered.length > 0) return filtered[0];
    }
    return matches[0] || weeklyPlans[0];
  }, [weeklyPlans, selectedTeam, role, coachName, selectedCoachName]);

  // Filter mesociclo plans by team and by coach when role=coach
  const filteredPlans = useMemo(() => {
    const clean = (s: string = "") => s.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/futbol|fútbol|basquetbol|voleibol|elite|élite/g, "");
    const isSameTeam = (a: string = "", b: string = "") => {
      const ca = clean(a);
      const cb = clean(b);
      return ca === cb || ca.includes(cb) || cb.includes(ca);
    };
    let list = plans.filter(p => isSameTeam(p.equipo, selectedTeam));
    if (list.length === 0) {
      if (selectedTeam.toLowerCase().includes("13") || selectedTeam.toLowerCase() === "u13") {
        list = plans.filter(p => p.id.includes("sub13") || p.equipo.toLowerCase().includes("13"));
      } else if (selectedTeam.toLowerCase().includes("15")) {
        list = plans.filter(p => p.id.includes("sub15") || p.equipo.toLowerCase().includes("15"));
      }
    }
    // Coach or Admin simulating a coach: try filter by coach name, but keep list if no specific match
    const targetCoachName = (role === "admin" && selectedCoachName) ? selectedCoachName : (role === "coach" ? coachName : null);
    if (targetCoachName) {
      const coachMatch = list.filter(p => p.entrenador && p.entrenador.toLowerCase() === targetCoachName.toLowerCase());
      if (coachMatch.length > 0) {
        list = coachMatch;
      }
    }
    return list.length > 0 ? list : plans;
  }, [plans, selectedTeam, role, coachName, selectedCoachName]);

  const openNew = () => setModal({ open: true, plan: blankPlan(coachName, selectedTeam) });
  const openEdit = (p: TrainingPlan) => setModal({ open: true, plan: p });
  const closeModal = () => setModal({ open: false, plan: null });

  const handleSave = (saved: TrainingPlan) => {
    const next = plans.some(p => p.id === saved.id)
      ? plans.map(p => p.id === saved.id ? saved : p)
      : [...plans, saved];
    setPlans(next);
    savePlans(next);
    closeModal();
    toast.success(plans.some(p => p.id === saved.id) ? "Planificación actualizada correctamente" : "Nueva planificación guardada");
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const next = plans.filter(p => p.id !== deleteId);
    setPlans(next);
    savePlans(next);
    setDeleteId(null);
    toast.success("Planificación eliminada");
  };

  const planToDelete = plans.find(p => p.id === deleteId);
  const dayLabels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  // ─── Weekly Plan Edit States ──────────────────────────────────────────────
  const [openEditWeekly, setOpenEditWeekly] = useState(false);
  const [weeklyResponsable, setWeeklyResponsable] = useState("");
  const [weeklyObjetivo, setWeeklyObjetivo] = useState("");
  const [weeklyActividades, setWeeklyActividades] = useState<any[]>([]);

  const handleEditWeeklyClick = () => {
    if (!activeWeeklyPlan) return;
    setWeeklyResponsable(activeWeeklyPlan.responsable);
    setWeeklyObjetivo(activeWeeklyPlan.objetivo);
    setWeeklyActividades(activeWeeklyPlan.actividades.map((a: any) => ({ ...a })));
    setOpenEditWeekly(true);
  };

  const handleSaveWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWeeklyPlan) return;
    const updated: any = {
      ...activeWeeklyPlan,
      responsable: weeklyResponsable,
      objetivo: weeklyObjetivo,
      actividades: weeklyActividades
    };
    TacticalStore.saveWeeklyPlan(updated);
    toast.success("Planificación semanal actualizada correctamente");
    setOpenEditWeekly(false);
    window.dispatchEvent(new Event("organizacionChanged"));
  };

  const updateWeeklyActivity = (dayIdx: number, field: string, value: any) => {
    setWeeklyActividades(prev => {
      const exists = prev.some(a => a.dia === dayIdx);
      if (exists) return prev.map(a => a.dia === dayIdx ? { ...a, [field]: value } : a);
      return [...prev, { dia: dayIdx, titulo: "", hora: "", duracion: 0, tipo: "entreno", [field]: value }];
    });
  };

  const activeTeamObj = useMemo(() => {
    const teams = RendimientoStore.getEquipos();
    const clean = (s: string = "") => s.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/futbol|fútbol|basquetbol|baloncesto|voleibol|elite|élite/g, "");
    const isSameTeam = (a: string = "", b: string = "") => {
      const ca = clean(a);
      const cb = clean(b);
      return ca === cb || ca.includes(cb) || cb.includes(ca);
    };
    return teams.find(t => isSameTeam(t.nombre, selectedTeam)) || { categoria: selectedTeam, nombre: selectedTeam, id: "" };
  }, [selectedTeam]);

  const realTeamSessions = useMemo(() => {
    const list = RendimientoStore.getSesiones().filter(s => {
      const clean = (x: string = "") => x.toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace(/futbol|fútbol|basquetbol|baloncesto|voleibol|elite|élite/g, "");
      return clean(s.equipo) === clean(selectedTeam) || clean(s.equipo).includes(clean(selectedTeam)) || clean(selectedTeam).includes(clean(s.equipo));
    });
    if (!activeWeeklyPlan) return list;
    
    const isDateInISOWeek = (dateStr: string, weekStr: string) => {
      if (!dateStr || !weekStr) return false;
      const d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return false;
      const parts = weekStr.split("-W");
      if (parts.length !== 2) return false;
      const year = parseInt(parts[0], 10);
      const week = parseInt(parts[1], 10);
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dayOfWeek = simple.getDay();
      const ISOweekStart = simple;
      if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
      } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
      }
      const ISOweekEnd = new Date(ISOweekStart);
      ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
      const dTime = d.getTime();
      const startTime = new Date(ISOweekStart.toISOString().split("T")[0] + "T00:00:00").getTime();
      const endTime = new Date(ISOweekEnd.toISOString().split("T")[0] + "T23:59:59").getTime();
      return dTime >= startTime && dTime <= endTime;
    };
    
    return list.filter(s => isDateInISOWeek(s.fecha, activeWeeklyPlan.semana));
  }, [selectedTeam, activeWeeklyPlan]);

  const realTeamMatches = useMemo(() => {
    const list = RendimientoStore.getPartidos().filter(m => {
      const clean = (x: string = "") => x.toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace(/futbol|fútbol|basquetbol|baloncesto|voleibol|elite|élite/g, "");
      return clean(m.equipo) === clean(selectedTeam) || clean(m.equipo).includes(clean(selectedTeam)) || clean(selectedTeam).includes(clean(m.equipo));
    });
    if (!activeWeeklyPlan) return list;
    
    const isDateInISOWeek = (dateStr: string, weekStr: string) => {
      if (!dateStr || !weekStr) return false;
      const d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return false;
      const parts = weekStr.split("-W");
      if (parts.length !== 2) return false;
      const year = parseInt(parts[0], 10);
      const week = parseInt(parts[1], 10);
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dayOfWeek = simple.getDay();
      const ISOweekStart = simple;
      if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
      } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
      }
      const ISOweekEnd = new Date(ISOweekStart);
      ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
      const dTime = d.getTime();
      const startTime = new Date(ISOweekStart.toISOString().split("T")[0] + "T00:00:00").getTime();
      const endTime = new Date(ISOweekEnd.toISOString().split("T")[0] + "T23:59:59").getTime();
      return dTime >= startTime && dTime <= endTime;
    };
    
    return list.filter(m => isDateInISOWeek(m.fecha, activeWeeklyPlan.semana));
  }, [selectedTeam, activeWeeklyPlan]);

  const realCargaTotal = useMemo(() => {
    const list = RendimientoStore.get<any[]>("cargas_entrenamiento", []);
    const players = RendimientoStore.getJugadores();
    const clean = (x: string = "") => x.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/futbol|fútbol|basquetbol|baloncesto|voleibol|elite|élite/g, "");
    const isSameTeam = (a: string = "", b: string = "") => {
      const ca = clean(a);
      const cb = clean(b);
      return ca === cb || ca.includes(cb) || cb.includes(ca);
    };
    const teamPlayers = players.filter(p => {
      const pCat = clean(p.categoria || "");
      const tCat = clean(activeTeamObj.categoria || activeTeamObj.nombre || "");
      return pCat === tCat;
    });
    const playerIds = teamPlayers.map(p => p.id);
    const teamLoads = list.filter(l => playerIds.includes(l.jugadorId));
    return teamLoads.reduce((acc, cur) => acc + (Number(cur.cargaInterna) || 0), 0);
  }, [activeTeamObj]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header Widget */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-elegant animate-pulse-subtle">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-clip-text text-foreground">Planificación Táctica</h1>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Semanal · Microciclos · Mesociclos · Temporada completa</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="flex h-9 w-44 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-sm font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            {availableTeams.map(t => (
              <option key={t.id} value={t.nombre}>{t.nombre}</option>
            ))}
          </select>

          <Link to="/ia">
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 hover:border-primary text-primary bg-primary/5 gap-1.5 text-xs font-bold h-9 px-4 rounded-xl transition-all duration-300"
            >
              <Sparkles className="h-4 w-4 animate-pulse" /> Diseñar con IA
            </Button>
          </Link>

          <Button
            size="sm"
            className="bg-gradient-primary hover:opacity-90 text-white gap-1.5 shadow-elegant text-xs font-bold h-9 px-4 rounded-xl transition-all duration-300"
            onClick={() => setOpenSelectorModal(true)}
          >
            <Plus className="h-4 w-4" /> Nuevo Ciclo
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab("semanal")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === "semanal"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarIcon className="h-4 w-4" /> Semanal
        </button>
        <button
          onClick={() => setActiveTab("microciclos")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === "microciclos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="h-4 w-4" /> Microciclos
        </button>
        <button
          onClick={() => setActiveTab("mesociclos")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === "mesociclos"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" /> Mesociclos
        </button>
        <button
          onClick={() => setActiveTab("temporada")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === "temporada"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="h-4 w-4" /> Temporada
        </button>
      </div>

      {/* 1. WEEKLY CALENDAR TAB */}
      {activeTab === "semanal" && (
        <div className="space-y-6">
          {activeWeeklyPlan ? (
            <>
              {/* Estimates Header */}
              <div className="bg-card border rounded-2xl p-5 shadow-elegant flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">Semana {activeWeeklyPlan.semana}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Responsable: <span className="font-semibold text-foreground">{activeWeeklyPlan.responsable}</span> · Categoria: {activeTeamObj.categoria || selectedTeam}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="bg-muted/40 border border-border/80 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Carga estimada</p>
                    <p className="text-sm font-black text-primary mt-0.5">{realCargaTotal} UA</p>
                  </div>
                  <div className="bg-muted/40 border border-border/80 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Sesiones</p>
                    <p className="text-sm font-black text-foreground mt-0.5">{realTeamSessions.length}</p>
                  </div>
                  <div className="bg-muted/40 border border-border/80 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Partidos</p>
                    <p className="text-sm font-black text-violet-500 mt-0.5">{realTeamMatches.length}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs ml-auto"
                    onClick={handleEditWeeklyClick}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar Semana
                  </Button>
                </div>
              </div>

              {/* Weekly Day Columns Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
                {dayLabels.map((dayLabel, idx) => {
                  const dayAct = activeWeeklyPlan.actividades.find(a => a.dia === idx);
                  const isRest = dayAct?.tipo === "descanso";
                  const isMatch = dayAct?.tipo === "partido";

                  return (
                    <div key={dayLabel} className="bg-card border rounded-2xl p-3 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md transition">
                      <div className="text-center font-bold text-xs pb-2 border-b border-border/60 text-muted-foreground tracking-wider uppercase select-none">
                        {dayLabel}
                      </div>

                      <div className="flex-1 flex flex-col justify-center py-4">
                        {dayAct ? (
                          <div className={`p-2.5 rounded-xl border transition ${
                            isRest ? "bg-muted/40 border-dashed text-muted-foreground" :
                            isMatch ? "bg-violet-500/10 border-violet-500/30 text-violet-400 font-semibold" :
                            dayAct.tipo === "recuperacion" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium" :
                            dayAct.tipo === "video" ? "bg-amber-500/10 border-amber-500/30 text-amber-500 font-medium" :
                            "bg-primary/5 border-primary/20 text-foreground font-medium"
                          }`}>
                            <p className="text-xs line-clamp-3 leading-snug">{dayAct.titulo}</p>
                            {dayAct.hora && (
                              <p className="text-[9px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {dayAct.hora} {dayAct.duracion > 0 && `· ${dayAct.duracion} min`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-[10px] text-muted-foreground italic select-none">
                            Sin actividad
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest bg-muted px-2 py-0.5 rounded-md border border-border/40 select-none">
                          {isRest ? "Descanso" : isMatch ? "Competir" : "Entreno"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weekly Observation */}
              <div className="bg-muted/30 border rounded-2xl p-4 flex gap-2.5 items-start text-xs text-muted-foreground">
                <Target className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground">Objetivo Semanal:</span> {activeWeeklyPlan.objetivo}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-2xl">
              Sin planificación semanal para este equipo.
            </div>
          )}
        </div>
      )}

      {/* 2. MICROCICLOS TAB */}
      {activeTab === "microciclos" && (
        <div className="space-y-6">
          {teamPlanificaciones.length === 0 ? (
            <Card className="border border-dashed p-12 text-center shadow-sm">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Zap className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Sin microciclos metodológicos</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Aún no has registrado ningún microciclo para el equipo {selectedTeam}. Planifica el primer ciclo semanal para Edgar.
                  </p>
                </div>
                <Button onClick={() => setOpenCreatePlan(true)} variant="outline" className="text-xs h-8">
                  Comenzar planificación
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teamPlanificaciones.map((plan) => {
                const totalMins = (plan.ejercicios || []).reduce((acc: number, cur: any) => acc + (Number(cur.duracion) || 0), 0);
                return (
                  <Card key={plan.id} className="shadow-card border flex flex-col justify-between overflow-hidden group hover:border-primary/30 transition-all duration-300">
                    <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-start justify-between gap-2 space-y-0">
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-bold text-foreground truncate" title={plan.nombre}>
                          {plan.nombre}
                        </CardTitle>
                        <CardDescription className="text-[10px] mt-1 font-semibold flex items-center gap-1 text-primary">
                          <CalendarIcon className="h-3 w-3" />
                          {plan.fecha_inicio} al {plan.fecha_fin}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPlan(plan)}
                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (confirm("¿Estás seguro de que deseas eliminar este microciclo?")) {
                              await RendimientoStore.deletePlanificacion(plan.id);
                              toast.success("Planificación eliminada.");
                              // Trigger a state reload
                              setOpenCreatePlan(prev => !prev);
                              setOpenCreatePlan(prev => !prev);
                            }
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-5 flex-1 flex flex-col justify-between space-y-4">
                      {plan.objetivos && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Target className="h-3 w-3 text-primary" /> Objetivos de Rendimiento
                          </p>
                          <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg border leading-relaxed">
                            {plan.objetivos}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                          <span>Sesiones & Tareas ({plan.ejercicios?.length || 0})</span>
                          <span className="text-primary font-bold lowercase">{totalMins} mins</span>
                        </p>
                        <div className="space-y-1.5">
                          {(plan.ejercicios || []).map((ex: any, idx: number) => (
                            <div key={ex.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-card border text-xs hover:bg-muted/10 transition">
                              <span className="font-medium text-foreground truncate pr-2">
                                {idx + 1}. {ex.nombre}
                              </span>
                              <Badge variant="secondary" className="text-[9px] shrink-0 font-semibold bg-muted text-muted-foreground">
                                {ex.duracion} min
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. MESOCICLOS (CURRICULUM PLANS) TAB */}
      {activeTab === "mesociclos" && (
        <div className="space-y-6">

          {/* Plans List */}
          {filteredPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
              <div className="bg-muted p-4 rounded-full">
                <BookOpen className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">No hay currículos registrados para este equipo</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">Crea una nueva planificación para iniciar el control curricular del equipo.</p>
              </div>
              <Button size="sm" className="bg-gradient-primary text-white text-xs gap-1.5 rounded-xl px-4 shadow-elegant" onClick={openNew}>
                <Plus className="h-3.5 w-3.5" /> Crear primer plan
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPlans.map(p => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  onEdit={() => openEdit(p)}
                  onDelete={() => setDeleteId(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TEMPORADA TAB */}
      {activeTab === "temporada" && (
        <div className="space-y-6">
          <Card className="shadow-elegant border bg-card/60 p-6 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-6 px-0 pt-0 border-b border-border/40">
              <div>
                <CardTitle className="text-base font-black text-white">Temporada 2026</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">Vista anual de fases y periodos clave</CardDescription>
              </div>
              <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportSeasonPdf(); }} size="sm" variant="outline" className="text-xs gap-1.5 h-8 border-border bg-background hover:bg-muted text-foreground">
                <FileDown className="h-3.5 w-3.5" /> Exportar PDF
              </Button>
            </CardHeader>

            <CardContent className="px-0 pb-0 pt-6 space-y-8">
              {/* Color Categories Legend */}
              <div className="flex flex-wrap gap-2 select-none justify-start pb-4 border-b border-border/30">
                {annualPhases.map((phase, idx) => {
                  let colorClass = "bg-slate-500/10 border-slate-500/20 text-slate-400";
                  if (phase.nombre.includes("Pretemporada")) colorClass = "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
                  else if (phase.nombre.includes("Baja")) colorClass = "bg-blue-500/10 border-blue-500/20 text-blue-400";
                  else if (phase.nombre.includes("Liga")) colorClass = "bg-purple-500/10 border-purple-500/20 text-purple-400";
                  else if (phase.nombre.includes("Vacaciones")) colorClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                  else if (phase.nombre.includes("Campamento")) colorClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                  else if (phase.nombre.includes("Copa")) colorClass = "bg-rose-500/10 border-rose-500/20 text-rose-400";
                  else if (phase.nombre.includes("Evaluaciones")) colorClass = "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
                  else if (phase.nombre.includes("Tests")) colorClass = "bg-lime-500/10 border-lime-500/20 text-lime-400";
                  return (
                    <span key={idx} className={`text-[10px] font-bold px-2 py-1 rounded border ${colorClass}`}>
                      {phase.nombre}
                    </span>
                  );
                })}
              </div>

              {/* 12-Month Columns Timeline Grid (Image 4) */}
              <div className="space-y-4">
                {/* Month Headers */}
                <div className="grid grid-cols-12 gap-2 text-center text-xs font-bold text-muted-foreground pb-2 select-none border-b border-border/20">
                  <div>Ene</div>
                  <div>Feb</div>
                  <div>Mar</div>
                  <div>Abr</div>
                  <div>May</div>
                  <div>Jun</div>
                  <div>Jul</div>
                  <div>Ago</div>
                  <div>Sep</div>
                  <div>Oct</div>
                  <div>Nov</div>
                  <div>Dic</div>
                </div>

                {/* Timeline Bar Chart */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-center text-white select-none">
                  {annualPhases.map((phase, idx) => {
                    let colSpan = "col-span-1";
                    // Custom colspans based on phase index to sum to 12
                    if (idx === 0) colSpan = "col-span-1"; // Pretemporada (Jan)
                    else if (idx === 1) colSpan = "col-span-2"; // Temporada Baja (Feb-Mar)
                    else if (idx === 2) colSpan = "col-span-3"; // Liga (Apr-Jun)
                    else if (idx === 3) colSpan = "col-span-1"; // Vacaciones (Jul)
                    else if (idx === 4) colSpan = "col-span-1"; // Campamento (Aug)
                    else if (idx === 5) colSpan = "col-span-2"; // Copa (Sep-Oct)
                    else if (idx === 6) colSpan = "col-span-1"; // Evaluaciones (Nov)
                    else if (idx === 7) return null; // Hide physical tests from timeline bar to keep 12 columns neat
                    else if (idx === 8) colSpan = "col-span-1"; // Fin (Dec)

                    let colorBg = "bg-slate-500/20 text-slate-300 border-slate-500/30";
                    if (phase.nombre.includes("Pretemporada")) colorBg = "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
                    else if (phase.nombre.includes("Baja")) colorBg = "bg-blue-500/20 text-blue-300 border-blue-500/30";
                    else if (phase.nombre.includes("Liga")) colorBg = "bg-purple-500/20 text-purple-300 border-purple-500/30";
                    else if (phase.nombre.includes("Vacaciones")) colorBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                    else if (phase.nombre.includes("Campamento")) colorBg = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                    else if (phase.nombre.includes("Copa")) colorBg = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                    else if (phase.nombre.includes("Evaluaciones")) colorBg = "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
                    else if (phase.nombre.includes("Fin")) colorBg = "bg-slate-500/20 text-slate-300 border-slate-500/30";

                    return (
                      <div
                        key={idx}
                        onClick={() => handleEditPhaseClick(idx)}
                        className={`${colSpan} p-2 rounded-lg ${colorBg} border truncate shadow-elegant cursor-pointer hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all`}
                        title="Haz clic para modificar esta fase"
                      >
                        {phase.nombre}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vertical Phases List with Date Ranges */}
              <div className="pt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {annualPhases.map((phase, idx) => {
                  let colorClass = "border-slate-500/20 bg-slate-500/5 text-slate-400";
                  if (phase.nombre.includes("Pretemporada")) colorClass = "border-indigo-500/20 bg-indigo-500/5 text-indigo-400";
                  else if (phase.nombre.includes("Baja")) colorClass = "border-blue-500/20 bg-blue-500/5 text-blue-400";
                  else if (phase.nombre.includes("Liga")) colorClass = "border-purple-500/20 bg-purple-500/5 text-purple-400";
                  else if (phase.nombre.includes("Vacaciones")) colorClass = "border-emerald-500/20 bg-emerald-500/5 text-emerald-400";
                  else if (phase.nombre.includes("Campamento")) colorClass = "border-amber-500/20 bg-amber-500/5 text-amber-400";
                  else if (phase.nombre.includes("Copa")) colorClass = "border-rose-500/20 bg-rose-500/5 text-rose-400";
                  else if (phase.nombre.includes("Evaluaciones")) colorClass = "border-cyan-500/20 bg-cyan-500/5 text-cyan-400";
                  else if (phase.nombre.includes("Tests")) colorClass = "border-lime-500/20 bg-lime-500/5 text-lime-400";

                  return (
                    <div
                      key={idx}
                      onClick={() => handleEditPhaseClick(idx)}
                      className={`p-4 rounded-xl border ${colorClass.split(" ").slice(0, 2).join(" ")} space-y-1 hover:border-primary/40 cursor-pointer transition-all duration-200 relative group`}
                      title="Haz clic para modificar esta fase"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${colorClass.split(" ")[2]}`}>{phase.nombre}</span>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className={`text-[9px] ${
                            phase.estado === "Terminado" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                            phase.estado === "En Curso" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" :
                            "border-slate-500/30 text-slate-400 bg-slate-500/10"
                          }`}>{phase.estado}</Badge>
                          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {phase.inicio.split("-").reverse().join("/")} al {phase.fin.split("-").reverse().join("/")}
                      </p>
                      <p className="text-xs text-foreground/90 font-medium pt-1">{phase.notas || "Sin observaciones."}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog para Nuevo Ciclo de Planificación (Edgar Modal) */}
      <Dialog open={openCreatePlan} onOpenChange={setOpenCreatePlan}>
        <DialogContent className="sm:max-w-[500px] bg-background border shadow-elegant text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Zap className="h-5 w-5 text-primary" /> Nueva Planificación de Microciclo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define el nombre del ciclo, la semana de duración y las tareas específicas de entrenamiento para el equipo {selectedTeam}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTeamPlan} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="plan-name" className="text-xs font-semibold">Nombre del Ciclo <span className="text-destructive">*</span></Label>
              <Input
                id="plan-name"
                placeholder="Ej. Microciclo 1: Transición Defensiva"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="plan-start" className="text-xs font-semibold">Fecha Inicio <span className="text-destructive">*</span></Label>
                <Input
                  id="plan-start"
                  type="date"
                  value={planStart}
                  onChange={(e) => setPlanStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="plan-end" className="text-xs font-semibold">Fecha Fin <span className="text-destructive">*</span></Label>
                <Input
                  id="plan-end"
                  type="date"
                  value={planEnd}
                  onChange={(e) => setPlanEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="plan-obj" className="text-xs font-semibold">Objetivos de Rendimiento</Label>
              <textarea
                id="plan-obj"
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ej. Mejorar la transición de ataque a defensa y el repliegue en bloque medio."
                value={planObjectives}
                onChange={(e) => setPlanObjectives(e.target.value)}
              />
            </div>

            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Tareas / Ejercicios específicos</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddExerciseField} className="h-7 text-[10px] px-2.5">
                  <Plus className="h-3 w-3 mr-1" /> Agregar Ejercicio
                </Button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {planExercises.map((ex, index) => (
                  <div key={ex.id} className="flex gap-2 items-center">
                    <span className="text-xs font-mono text-muted-foreground w-4">{index + 1}.</span>
                    <Input
                      placeholder="Nombre del ejercicio o tarea (ej. Rondo de recuperación)"
                      value={ex.nombre}
                      onChange={(e) => handleExerciseChange(ex.id, "nombre", e.target.value)}
                      className="flex-1 text-xs h-8"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        placeholder="Mins"
                        value={ex.duracion || ""}
                        onChange={(e) => handleExerciseChange(ex.id, "duracion", e.target.value)}
                        className="w-16 text-xs h-8 text-center"
                      />
                      <span className="text-[10px] text-muted-foreground">min</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveExerciseField(ex.id)}
                      disabled={planExercises.length <= 1}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button type="button" variant="outline" onClick={() => setOpenCreatePlan(false)} className="text-xs h-9">
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-primary shadow-elegant text-xs h-9">
                Guardar Planificación
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Curriculum Modals */}
      {modal.open && modal.plan && (
        <PlanModal plan={modal.plan} onSave={handleSave} onClose={closeModal} />
      )}
      {deleteId && planToDelete && (
        <DeleteConfirm
          planName={planToDelete.categoria}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {/* Edit Phase Modal */}
      <Dialog open={openEditPhase} onOpenChange={setOpenEditPhase}>
        <DialogContent className="sm:max-w-[420px] bg-card border-border/80 text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-white">Modificar Fase de Temporada</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ajusta los periodos y notas metodológicas de la fase anual.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePhase} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nombre de la Fase</Label>
              <Input
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                required
                className="text-xs h-9 bg-muted/40 border-border/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fecha Inicio</Label>
                <Input
                  type="date"
                  value={phaseStart}
                  onChange={(e) => setPhaseStart(e.target.value)}
                  required
                  className="text-xs h-9 bg-muted/40 border-border/60"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fecha Fin</Label>
                <Input
                  type="date"
                  value={phaseEnd}
                  onChange={(e) => setPhaseEnd(e.target.value)}
                  required
                  className="text-xs h-9 bg-muted/40 border-border/60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Estado</Label>
              <select
                value={phaseStatus}
                onChange={(e) => setPhaseStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border/60 bg-muted/40 px-3 py-1 text-xs shadow-sm font-semibold focus-visible:outline-none"
              >
                <option value="Terminado">Terminado</option>
                <option value="En Curso">En Curso</option>
                <option value="Próximamente">Próximamente</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Notas / Objetivos</Label>
              <Textarea
                value={phaseNotas}
                onChange={(e) => setPhaseNotas(e.target.value)}
                rows={3}
                className="text-xs bg-muted/40 border-border/60 resize-none"
                placeholder="Describa el foco de esta fase de la temporada..."
              />
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button type="button" variant="outline" onClick={() => setOpenEditPhase(false)} className="text-xs h-9">
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-primary shadow-elegant text-xs h-9">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Planificación Semanal */}
      <Dialog open={openEditWeekly} onOpenChange={setOpenEditWeekly}>
        <DialogContent className="sm:max-w-[620px] bg-background border shadow-elegant text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Pencil className="h-5 w-5 text-primary" /> Editar Planificación Semanal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifica el responsable, objetivo y las actividades de cada día de la semana.
            </DialogDescription>
          </DialogHeader>

          {activeWeeklyPlan && (
            <form onSubmit={handleSaveWeekly} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Responsable</Label>
                  <Input
                    placeholder="Nombre del entrenador"
                    value={weeklyResponsable}
                    onChange={e => setWeeklyResponsable(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Objetivo Semanal</Label>
                  <Input
                    placeholder="Ej. Desarrollo del juego asociativo"
                    value={weeklyObjetivo}
                    onChange={e => setWeeklyObjetivo(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <Label className="text-xs font-bold text-foreground">Actividades por día</Label>
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((dayLabel, idx) => {
                    const act = weeklyActividades.find((a: any) => a.dia === idx) || { dia: idx, titulo: "", hora: "", duracion: 0, tipo: "entreno" };
                    return (
                      <div key={idx} className="grid grid-cols-[60px_1fr_90px_120px] gap-2 items-center bg-muted/20 border border-border/40 rounded-xl px-3 py-2">
                        <span className="text-xs font-bold text-muted-foreground">{dayLabel}</span>
                        <Input
                          placeholder="Actividad del día"
                          value={act.titulo || ""}
                          onChange={e => updateWeeklyActivity(idx, "titulo", e.target.value)}
                          className="text-xs h-8"
                        />
                        <Input
                          placeholder="HH:MM"
                          value={act.hora || ""}
                          onChange={e => updateWeeklyActivity(idx, "hora", e.target.value)}
                          className="text-xs h-8 text-center"
                        />
                        <select
                          value={act.tipo || "entreno"}
                          onChange={e => updateWeeklyActivity(idx, "tipo", e.target.value)}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="entreno">Entreno</option>
                          <option value="partido">Partido</option>
                          <option value="recuperacion">Recuperación</option>
                          <option value="video">Video</option>
                          <option value="descanso">Descanso</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button type="button" variant="outline" onClick={() => setOpenEditWeekly(false)} className="text-xs h-9">Cancelar</Button>
                <Button type="submit" className="bg-gradient-primary shadow-elegant text-xs h-9">Guardar Semana</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Selector Inteligente de Tipo de Ciclo */}
      <Dialog open={openSelectorModal} onOpenChange={setOpenSelectorModal}>
        <DialogContent className="sm:max-w-[550px] bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Plus className="h-5 w-5 text-primary" /> ¿Qué deseas planificar hoy?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecciona el tipo de ciclo que deseas estructurar o editar para el equipo {selectedTeam}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* CARD 1: Semanal */}
            <button
              onClick={() => {
                setOpenSelectorModal(false);
                handleEditWeeklyClick();
              }}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border/80 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-all text-center group"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-foreground">Plan Semanal</p>
              <p className="text-[10px] text-muted-foreground mt-1">Lunes a Domingo, entrenos y partidos detallados</p>
            </button>

            {/* CARD 2: Microciclo */}
            <button
              onClick={() => {
                setOpenSelectorModal(false);
                // Reset micro planning states for creation
                setEditingPlanId(null);
                setPlanName("");
                setPlanStart("");
                setPlanEnd("");
                setPlanObjectives("");
                setPlanExercises([{ id: "ex_1", nombre: "", duracion: 15 }]);
                setOpenCreatePlan(true);
              }}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border/80 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-all text-center group"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Zap className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-foreground">⚡ Microciclo</p>
              <p className="text-[10px] text-muted-foreground mt-1">Estructura de tareas y sesiones a corto plazo</p>
            </button>

            {/* CARD 3: Mesociclo */}
            <button
              onClick={() => {
                setOpenSelectorModal(false);
                openNew();
              }}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border/80 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-all text-center group"
            >
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Layers className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-foreground">🔁 Mesociclo</p>
              <p className="text-[10px] text-muted-foreground mt-1">Plan metodológico y contenidos mensuales</p>
            </button>

            {/* CARD 4: Temporada */}
            <button
              onClick={() => {
                setOpenSelectorModal(false);
                // Reset phase states for creation
                setEditingPhaseIdx(null);
                setPhaseName("");
                setPhaseStart("");
                setPhaseEnd("");
                setPhaseNotas("");
                setPhaseStatus("Próximamente");
                setOpenEditPhase(true);
              }}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border/80 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-all text-center group"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <CalendarRange className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-foreground">📆 Fase de Temporada</p>
              <p className="text-[10px] text-muted-foreground mt-1">Bloques y periodos clave del año</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlanificacionTactica;
