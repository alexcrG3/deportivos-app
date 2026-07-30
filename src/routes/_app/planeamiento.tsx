import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Sparkles, Activity, Award, Pencil, Info, UserX, CloudSun, MapPin, CheckCircle2, ChevronRight,
  Plus, Trash2, BookOpen, Clock, Calendar, Check, Search, Dumbbell, Shield, Zap, X,
  Calendar as CalendarIcon, Layers, CalendarRange
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/planeamiento")({
  component: CoachPlannerPage,
});

interface SesionBloque {
  nombre: string;
  duracionMin: number;
  descripcion: string;
  ejercicios?: string[];
}

interface DiaPlan {
  diaSemana: string;
  fecha: string;
  tipoJornada: "Entreno" | "Partido" | "Recuperación" | "Descanso";
  objetivoFisico: string;
  objetivoTecnico: string;
  objetivoTactico: string;
  objetivoMental: string;
  bloques: SesionBloque[];
  sugeridoIA?: boolean;
  asistenciaResumen?: string;
  cumplimientoEstrellas?: number;
}

// Catálogo Oficial del Club
const CATALOGO_CLUB = {
  tactico: [
    "Salida limpia desde atrás", "Presión alta tras pérdida", "Basculación y coberturas",
    "Transición ofensiva rápida", "Pases en rombo", "Amplitud por bandas", "Juego entre líneas"
  ],
  fisico: [
    "Coordinación y agilidad", "Fuerza explosiva", "Velocidad de reacción",
    "Resistencia aeróbica", "Potencia aeróbica", "Movilidad articular", "Core e inestabilidad"
  ],
  tecnico: [
    "Pase a dos toques", "Control orientado", "Remate a puerta",
    "Conducción y regate", "Perfilación defensiva", "Pases filtrados", "Juego aéreo"
  ],
  mental: [
    "Concentración constante", "Liderazgo en cancha", "Comunicación viva entre líneas",
    "Tolerancia a la frustración", "Mentalidad competitiva", "Resiliencia defensiva"
  ]
};

export function CoachPlannerPage() {
  const { role, coachName } = useRole();

  const [dbEquipos, setDbEquipos] = useState<any[]>([]);
  const [equipoSel, setEquipoSel] = useState<string>("U11 Asoderive");
  const [categoriaSel, setCategoriaSel] = useState<string>("Sub-11");
  const [alcance, setAlcance] = useState<"Semanal" | "Quincenal" | "Mensual">("Semanal");
  const [lesionadosDb, setLesionadosDb] = useState<any[]>([]);

  useEffect(() => {
    const fetchEquiposDb = async () => {
      // 1. Equipos con los entrenadores REALES según la base de datos Supabase
      const equiposReales = [
        { id: "eq_u9_00000000", nombre: "U9 Asoderive", disciplina: "Fútbol", categoria: "Sub-9", entrenador: "Carlos Araya", sede: "Sede Central", estado: "activo" },
        { id: "eq_u11_00000000", nombre: "U11 Asoderive", disciplina: "Fútbol", categoria: "Sub-11", entrenador: "Tiffany Eduarte", sede: "Sede Central", estado: "activo" },
        { id: "eq_u13_00000000", nombre: "U13 Asoderive", disciplina: "Fútbol", categoria: "Sub-13", entrenador: "Eduardo Villa", sede: "Sede Central", estado: "activo" }
      ];

      // Actualizar automáticamente los registros desactualizados en Supabase DB
      await supabase.from("equipos").upsert(equiposReales);

      // 2. Consultar la tabla `equipos` ya actualizada desde Supabase PostgreSQL
      const { data } = await supabase.from("equipos").select("*").order("nombre");
      
      if (data && data.length > 0) {
        const activeCoach = coachName || "Carlos Araya";
        const misEquipos = data.filter((e: any) => 
          (e.entrenador && e.entrenador.toLowerCase().includes(activeCoach.toLowerCase())) ||
          (e.entrenador_nombre && e.entrenador_nombre.toLowerCase().includes(activeCoach.toLowerCase()))
        );

        if (misEquipos.length > 0) {
          setDbEquipos(misEquipos);
          setEquipoSel(misEquipos[0].nombre);
        } else {
          setDbEquipos(data);
          setEquipoSel(data[0].nombre);
        }
      }

      const { data: lesData } = await supabase.from("incidencias_lesiones").select("*");
      if (lesData) {
        setLesionadosDb(lesData);
      }
    };
    fetchEquiposDb();
  }, [coachName]);

  useEffect(() => {
    const eqObj = dbEquipos.find((e) => e.nombre === equipoSel || e.id === equipoSel);
    if (eqObj) {
      setCategoriaSel(eqObj.categoria || "Sub-11");
    } else {
      if (equipoSel.includes("U9") || equipoSel.includes("Sub-9")) setCategoriaSel("Sub-9");
      else if (equipoSel.includes("U11") || equipoSel.includes("Sub-11")) setCategoriaSel("Sub-11");
      else if (equipoSel.includes("U13") || equipoSel.includes("Sub-13")) setCategoriaSel("Sub-13");
      else if (equipoSel.includes("U15") || equipoSel.includes("Sub-15")) setCategoriaSel("Sub-15");
      else setCategoriaSel("Sub-11");
    }
  }, [equipoSel, dbEquipos]);

  const reglaCategoria = useMemo(() => {
    const cat = categoriaSel.toLowerCase();
    if (cat.includes("sub-6") || cat.includes("sub-8") || cat.includes("u6") || cat.includes("u8")) {
      return {
        rango: "U6 - U8 (INICIACIÓN)",
        permitido: "Coordinación, Diversión y Dominio básico de balón.",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        tallaMaxCarga: 300,
      };
    } else if (cat.includes("sub-9") || cat.includes("sub-10") || cat.includes("u9") || cat.includes("u10")) {
      return {
        rango: "U9 - U10 (FORMACIÓN BASE)",
        permitido: "Técnica individual y Toma de decisiones básicas.",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        tallaMaxCarga: 400,
      };
    } else if (cat.includes("sub-11") || cat.includes("sub-12") || cat.includes("u11") || cat.includes("u12")) {
      return {
        rango: "U11 - U12 (DESARROLLO TÁCTICO)",
        permitido: "Principios tácticos simples (Amplitud, Apoyos, Coberturas).",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        tallaMaxCarga: 480,
      };
    } else if (cat.includes("sub-13") || cat.includes("sub-15") || cat.includes("u13") || cat.includes("u15")) {
      return {
        rango: "U13 - U15 (ESPECIALIZACIÓN)",
        permitido: "Sistemas de juego avanzados, Transiciones y Prep. Física.",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        tallaMaxCarga: 600,
      };
    } else {
      return {
        rango: "U16 - U18 (ALTO RENDIMIENTO)",
        permitido: "Catálogo completo de Alto Rendimiento y Modelos Complejos.",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        tallaMaxCarga: 750,
      };
    }
  }, [categoriaSel]);

  const hoyStr = useMemo(() => {
    const now = new Date();
    const utc6 = new Date(now.getTime() - 6 * 3600000);
    return utc6.toISOString().split("T")[0];
  }, []);

  const diasSemanaArray = useMemo(() => {
    const curr = new Date(hoyStr + "T00:00:00");
    const first = curr.getDate() - curr.getDay() + 1;
    const lunes = new Date(curr.setDate(first));

    const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const result: { nombre: string; fechaStr: string; semana: number }[] = [];
    const numSemanas = alcance === "Mensual" ? 4 : alcance === "Quincenal" ? 2 : 1;

    for (let s = 0; s < numSemanas; s++) {
      nombresDias.forEach((nombre, i) => {
        const d = new Date(lunes);
        d.setDate(lunes.getDate() + (s * 7) + i);
        const dateStr = d.toISOString().split("T")[0];
        result.push({ nombre, fechaStr: dateStr, semana: s + 1 });
      });
    }
    return result;
  }, [hoyStr, alcance]);

  const [diasPlan, setDiasPlan] = useState<Record<string, DiaPlan>>({});
  const [loadingDb, setLoadingDb] = useState(true);
  const [tieneDatosPlan, setTieneDatosPlan] = useState(false);

  const cargarPlanificacionesDb = async () => {
    setLoadingDb(true);
    try {
      const { data } = await supabase
        .from("planificaciones")
        .select("*")
        .eq("equipo", equipoSel);

      const mapaInicial: Record<string, DiaPlan> = {};
      let datosEncontrados = false;

      diasSemanaArray.forEach(({ nombre, fechaStr }) => {
        mapaInicial[fechaStr] = {
          diaSemana: nombre,
          fecha: fechaStr,
          tipoJornada: "Descanso",
          objetivoFisico: "",
          objetivoTecnico: "",
          objetivoTactico: "",
          objetivoMental: "",
          bloques: [],
        };
      });

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          if (row.ejercicios && typeof row.ejercicios === "object") {
            Object.keys(row.ejercicios).forEach((fKey) => {
              const dItem = row.ejercicios[fKey];
              if (dItem && (dItem.objetivoTactico || dItem.objetivoFisico || dItem.objetivoTecnico || dItem.tipoJornada === "Entreno")) {
                datosEncontrados = true;
              }
              if (mapaInicial[fKey]) {
                mapaInicial[fKey] = { ...mapaInicial[fKey], ...dItem };
              }
            });
          }
        });
      }

      setTieneDatosPlan(datosEncontrados);
      setDiasPlan(mapaInicial);
    } catch (e) {
      console.warn("Nota de consulta en planificaciones Supabase:", e);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    cargarPlanificacionesDb();
  }, [equipoSel, diasSemanaArray]);

  const guardarPlanificacionDb = async (nuevosDias: Record<string, DiaPlan>) => {
    try {
      const planId = `plan-coach-${equipoSel.replace(/\s+/g, "-").toLowerCase()}`;
      const payload = {
        id: planId,
        nombre: `Plan de Entrenamiento - ${equipoSel}`,
        equipo: equipoSel,
        fecha_inicio: diasSemanaArray[0]?.fechaStr,
        fecha_fin: diasSemanaArray[6]?.fechaStr,
        objetivos: `Planificación operacional para ${categoriaSel}`,
        ejercicios: nuevosDias,
      };

      const { error } = await supabase.from("planificaciones").upsert(payload);
      if (error) {
        toast.error("Error al guardar plan en Supabase: " + error.message);
      } else {
        setTieneDatosPlan(true);
        toast.success("💾 Planificación sincronizada en Supabase DB.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. PANEL LATERAL "A PIE" PARA CONFIGURACIÓN DE DÍA
  const [diaModalSel, setDiaModalSel] = useState<DiaPlan | null>(null);
  const [panelLateralAbierto, setPanelLateralAbierto] = useState(false);

  const abrirConfiguracionDia = (dia: DiaPlan) => {
    setDiaModalSel(JSON.parse(JSON.stringify(dia)));
    setPanelLateralAbierto(true);
  };

  const guardarDiaEditado = () => {
    if (!diaModalSel) return;
    const actualizados = { ...diasPlan, [diaModalSel.fecha]: diaModalSel };
    setDiasPlan(actualizados);
    guardarPlanificacionDb(actualizados);
    setPanelLateralAbierto(false);
    toast.success(`Sesión del ${diaModalSel.diaSemana} guardada correctamente.`);
  };

  const iniciarPlanificacionManual = () => {
    const actualizados = { ...diasPlan };
    diasSemanaArray.forEach(({ fechaStr }, idx) => {
      const dayIdx = idx % 7;
      const esEntreno = dayIdx === 0 || dayIdx === 2 || dayIdx === 4;
      actualizados[fechaStr] = {
        ...actualizados[fechaStr],
        tipoJornada: esEntreno ? "Entreno" : dayIdx === 5 ? "Partido" : "Descanso",
        objetivoFisico: esEntreno ? "Coordinación y agilidad" : "",
        objetivoTecnico: esEntreno ? "Pase y control orientado" : "",
        objetivoTactico: esEntreno ? "Salida limpia desde atrás" : "",
        objetivoMental: esEntreno ? "Concentración constante" : "",
        bloques: esEntreno
          ? [
              { nombre: "1. Activación", duracionMin: 15, descripcion: "Rondo 4vs1 y movilidad articular" },
              { nombre: "2. Principal Técnica", duracionMin: 20, descripcion: "Circuitos de pase a dos toques" },
              { nombre: "3. Principal Táctica", duracionMin: 25, descripcion: "Movimientos defensivos en bloque" },
              { nombre: "4. Vuelta a la Calma", duracionMin: 10, descripcion: "Estiramientos dirigidos" },
            ]
          : [],
        sugeridoIA: false,
      };
    });
    setDiasPlan(actualizados);
    guardarPlanificacionDb(actualizados);
  // Modales de Planificación Manual
  const [openSelectorModal, setOpenSelectorModal] = useState(false);
  const [openEditWeekly, setOpenEditWeekly] = useState(false);
  const [weeklyResponsable, setWeeklyResponsable] = useState(coachName || "Carlos Araya");
  const [weeklyObjetivo, setWeeklyObjetivo] = useState("Desarrollo del juego asociativo y transiciones rápidas");
  const [weeklyActividades, setWeeklyActividades] = useState([
    { dia: 0, titulo: "Técnica individual y pases cortos", hora: "14:00", tipo: "entreno" },
    { dia: 1, titulo: "Visualización de táctica grupal", hora: "15:00", tipo: "video" },
    { dia: 2, titulo: "Posicionamiento de líneas y basculación", hora: "14:00", tipo: "entreno" },
    { dia: 3, titulo: "Sesión regenerativa y estiramientos", hora: "09:00", tipo: "recuperacion" },
    { dia: 4, titulo: "Fútbol tenis y táctica fija", hora: "14:00", tipo: "entreno" },
    { dia: 5, titulo: "Partido amistoso vs Academias", hora: "10:00", tipo: "partido" },
    { dia: 6, titulo: "Descanso activo", hora: "", tipo: "descanso" },
  ]);

  const updateWeeklyActivity = (diaIdx: number, field: string, value: any) => {
    setWeeklyActividades(prev => {
      const exists = prev.some(a => a.dia === diaIdx);
      if (exists) {
        return prev.map(a => a.dia === diaIdx ? { ...a, [field]: value } : a);
      }
      return [...prev, { dia: diaIdx, titulo: "", hora: "", tipo: "entreno", [field]: value }];
    });
  };

  const handleSaveWeeklyManual = (e: React.FormEvent) => {
    e.preventDefault();
    const actualizados = { ...diasPlan };
    diasSemanaArray.forEach(({ fechaStr }, idx) => {
      const act = weeklyActividades.find(a => a.dia === idx) || { titulo: "Entrenamiento", tipo: "entreno" };
      const esDescanso = act.tipo === "descanso";
      actualizados[fechaStr] = {
        ...actualizados[fechaStr],
        tipoJornada: esDescanso ? "Descanso" : act.tipo === "partido" ? "Partido" : act.tipo === "recuperacion" ? "Recuperación" : "Entreno",
        objetivoFisico: !esDescanso ? "Acondicionamiento físico específico" : "",
        objetivoTecnico: !esDescanso ? (act.titulo || "Técnica individual y táctica de conjunto") : "",
        objetivoTactico: !esDescanso ? weeklyObjetivo : "",
        objetivoMental: !esDescanso ? "Enfoque y disciplina" : "",
        bloques: !esDescanso ? [
          { nombre: "1. Calentamiento", duracionMin: 15, descripcion: act.titulo || "Calentamiento con balón" },
          { nombre: "2. Fase Principal", duracionMin: 45, descripcion: "Trabajo técnico-táctico en campo" },
          { nombre: "3. Vuelta a la Calma", duracionMin: 15, descripcion: "Estiramientos y retroalimentación" }
        ] : [],
        sugeridoIA: false,
      };
    });
    setDiasPlan(actualizados);
    guardarPlanificacionDb(actualizados);
    setOpenEditWeekly(false);
    toast.success("✅ Planificación semanal guardada correctamente.");
  };

  const [openCreatePlan, setOpenCreatePlan] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planStart, setPlanStart] = useState("");
  const [planEnd, setPlanEnd] = useState("");
  const [planObjectives, setPlanObjectives] = useState("");
  const [planExercises, setPlanExercises] = useState([{ id: "ex_1", nombre: "", duracion: 15 }]);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditPhase, setOpenEditPhase] = useState(false);
  const [phaseName, setPhaseName] = useState("");
  const [phaseStart, setPhaseStart] = useState("");
  const [phaseEnd, setPhaseEnd] = useState("");
  const [phaseNotas, setPhaseNotas] = useState("");

  const [aiModalAbierto, setAiModalAbierto] = useState(false);
  const [aiPrioridades, setAiPrioridades] = useState<string[]>(["Salida limpia desde atrás", "Presión alta tras pérdida"]);
  const [aiGenerando, setAiGenerando] = useState(false);

  const ejecutarAthletixAI = () => {
    toast.info("Athletix AI está calculando las cargas...");
    setTimeout(() => {
      const planGenerado = { ...diasPlan };
      diasSemanaArray.forEach(({ fechaStr }, idx) => {
        const dayIdx = idx % 7;
        const esEntreno = dayIdx === 0 || dayIdx === 2 || dayIdx === 4;
        
        planGenerado[fechaStr] = {
          ...planGenerado[fechaStr],
          tipoJornada: esEntreno ? "Entreno" : dayIdx === 5 ? "Partido" : "Descanso",
          objetivoFisico: esEntreno ? "Activación neuro-muscular" : "",
          objetivoTecnico: esEntreno ? "Finalización bajo presión" : "",
          objetivoTactico: esEntreno ? "Transiciones defensa-ataque" : "",
          objetivoMental: esEntreno ? "Tolerancia a la frustración" : "",
          sugeridoIA: true,
          bloques: esEntreno
            ? [
                { nombre: "1. Calentamiento Preventivo", duracionMin: 15, descripcion: "✨ Rondo móvil adaptativo IA" },
                { nombre: "2. Circuito Físico-Técnico", duracionMin: 20, descripcion: "✨ Potencia y finalización" },
                { nombre: "3. Posesión Dirigida", duracionMin: 20, descripcion: "✨ 3 zonas con comodines" },
                { nombre: "4. Acción a Balón Parado", duracionMin: 10, descripcion: "✨ Córners ofensivos IA" },
                { nombre: "5. Partido Reducido", duracionMin: 15, descripcion: "✨ Fútbol aplicado con consignas IA" },
                { nombre: "6. Recuperación Activa", duracionMin: 10, descripcion: "✨ Trote ligero y core" },
              ]
            : [],
        };
      });
      setDiasPlan(planGenerado);
      setTieneDatosPlan(true);
      setAiModalAbierto(false);
      guardarPlanificacionDb(planGenerado);
    }, 1500);
  };

  const cargaSemanalCalculada = useMemo(() => {
    let total = 0;
    let partidos = 0;
    Object.values(diasPlan).forEach((d) => {
      if (d.tipoJornada === "Entreno" || d.tipoJornada === "Recuperación") {
        total += d.bloques?.reduce((acc, b) => acc + (b.duracionMin || 0), 0) * 3;
      } else if (d.tipoJornada === "Partido") {
        total += 180;
        partidos += 1;
      }
    });
    return { total: total || 420, partidos };
  }, [diasPlan]);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[12px] p-6 shadow-none space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-lg">
              ⚽
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">EQUIPO ACTIVO</p>
              <Select value={equipoSel} onValueChange={setEquipoSel}>
                <SelectTrigger className="h-7 border-none p-0 font-bold text-[#0F172A] text-lg focus:ring-0 shadow-none">
                  <SelectValue placeholder="Seleccionar equipo" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px] bg-white border border-[#E2E8F0]">
                  {dbEquipos.map((e) => (
                    <SelectItem key={e.id} value={e.nombre} className="font-medium text-xs">
                      {e.nombre} ({e.categoria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center bg-[#F8F9FA] p-1 rounded-full border border-[#E2E8F0]">
            {(["Semanal", "Quincenal", "Mensual"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setAlcance(mode)}
                className={`px-4 py-1 rounded-full font-medium text-xs transition-all ${
                  alcance === mode
                    ? "bg-[#FFFFFF] text-[#2563EB] shadow-sm font-bold"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {mode === "Semanal" ? "🗓️ Semanal" : mode === "Quincenal" ? "🗓️ Quincenal" : "📅 Mensual"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setOpenSelectorModal(true)}
              variant="outline"
              className="bg-white hover:bg-slate-50 text-slate-700 dark:text-slate-200 border-slate-300 font-semibold text-xs py-2.5 px-4 rounded-[12px] shadow-none gap-2 uppercase tracking-wider"
            >
              <Pencil className="h-4 w-4 text-slate-500" /> ✏️ Planificar Manualmente
            </Button>
            <Button
              onClick={() => setAiModalAbierto(true)}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-5 rounded-[12px] shadow-none gap-2 uppercase tracking-wider"
            >
              <Sparkles className="h-4 w-4 animate-pulse text-amber-300" /> ✨ Planificar con IA
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#F1F5F9] pt-4">
          <div className={`p-4 rounded-[12px] border text-xs flex items-center justify-between ${reglaCategoria.color}`}>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{reglaCategoria.rango}</p>
              <p className="text-xs font-regular text-[#475569]">{reglaCategoria.permitido}</p>
            </div>
          </div>

          <div className="p-4 rounded-[12px] border border-[#E2E8F0] bg-[#FFFFFF] text-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">CARGA ACUMULADA SEMANAL</p>
              <p className="text-[26px] font-bold text-[#0F172A] leading-none">{cargaSemanalCalculada.total} <span className="text-xs font-normal text-[#64748B]">UA</span></p>
              <p className="text-xs font-regular text-[#475569]">Límite de categoría • {reglaCategoria.tallaMaxCarga} UA</p>
            </div>
          </div>

          <div className="p-4 rounded-[12px] border border-[#E2E8F0] bg-[#FFFFFF] text-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">COMPETICIONES DE LA SEMANA</p>
              <p className="text-[26px] font-bold text-[#0F172A] leading-none">{cargaSemanalCalculada.partidos} <span className="text-xs font-normal text-[#64748B]">Partido(s)</span></p>
              <p className="text-xs font-regular text-[#475569]">Zona horaria activa • UTC-6 Costa Rica</p>
            </div>
          </div>
        </div>
      </div>

      {!tieneDatosPlan ? (
        <Card className="p-8 border rounded-[12px] bg-[#FFFFFF] border-[#E2E8F0] shadow-none text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <Badge className="bg-blue-50 text-[#2563EB] border border-blue-100 font-semibold text-[10px] uppercase tracking-wider">
              ESTADO VACÍO DE PLANIFICACIÓN
            </Badge>
            <h2 className="text-xl font-bold text-[#0F172A]">Semana sin planificar en {equipoSel}</h2>
            <p className="text-xs text-[#64748B]">
              Selecciona uno de los dos caminos principales para armar la microciclo metodológica de esta semana.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div
              onClick={() => setAiModalAbierto(true)}
              className="group cursor-pointer p-6 rounded-[12px] border border-[#2563EB]/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 hover:border-[#2563EB] transition-all space-y-4 relative overflow-hidden"
            >
              <div className="h-12 w-12 rounded-[12px] bg-[#2563EB] text-white flex items-center justify-center font-bold text-xl shadow-md">
                🪄
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider">EL CAMINO RÁPIDO</span>
                <h3 className="font-bold text-base text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  Planificar con Athletix AI
                </h3>
                <p className="text-xs text-[#64748B]">
                  Genera tu semana en 5 segundos basada en las reglas y objetivos del club.
                </p>
              </div>
              <Button className="w-full bg-[#2563EB] text-white font-semibold text-xs rounded-[12px] shadow-none">
                ✨ Generar Microciclo con IA
              </Button>
            </div>

            <div
              onClick={iniciarPlanificacionManual}
              className="group cursor-pointer p-6 rounded-[12px] border border-[#E2E8F0] bg-[#FFFFFF] hover:border-slate-400 transition-all space-y-4"
            >
              <div className="h-12 w-12 rounded-[12px] bg-slate-100 text-[#0F172A] flex items-center justify-center font-bold text-xl">
                📋
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">EL CAMINO MANUAL</span>
                <h3 className="font-bold text-base text-[#0F172A] group-hover:text-slate-800 transition-colors">
                  Crear Planificación Manual
                </h3>
                <p className="text-xs text-[#64748B]">
                  Diseña tus días, pilares y ejercicios paso a paso desde cero.
                </p>
              </div>
              <Button variant="outline" className="w-full border-[#E2E8F0] text-[#0F172A] font-semibold text-xs rounded-[12px]">
                ✍️ Crear Plan Desde Cero
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3 space-y-4">
            {alcance === "Semanal" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {diasSemanaArray.filter(d => d.semana === 1).map(({ nombre, fechaStr }) => {
                  const dia = diasPlan[fechaStr] || {
                    diaSemana: nombre,
                    fecha: fechaStr,
                    tipoJornada: "Entreno",
                    objetivoFisico: "",
                    objetivoTecnico: "",
                    objetivoTactico: "",
                    objetivoMental: "",
                    bloques: [],
                  };
                  const esHoy = fechaStr === hoyStr;
                  return (
                    <Card key={fechaStr} className={`border rounded-[12px] p-4 flex flex-col justify-between space-y-3 shadow-none transition-all ${dia.sugeridoIA ? "border-[#2563EB] bg-[#F8FAFC]" : "bg-[#FFFFFF] border-[#E2E8F0]"} ${esHoy ? "border-purple-600 bg-purple-50/30 ring-2 ring-purple-500/20 shadow-sm" : ""}`}>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${esHoy ? "text-purple-900" : "text-[#0F172A]"}`}>{nombre}</span>
                          {esHoy && <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[10px] shadow-sm">HOY</span>}
                        </div>
                        <p className="text-[11px] text-[#64748B] font-mono">{fechaStr}</p>
                        <div className="pt-1">
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase ${dia.tipoJornada === "Entreno" ? "bg-blue-50 text-[#2563EB]" : dia.tipoJornada === "Partido" ? "bg-emerald-50 text-[#059669]" : dia.tipoJornada === "Recuperación" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-[#64748B]"}`}>
                            {dia.tipoJornada}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5 flex-1 min-h-[150px]">
                        {dia.tipoJornada === "Descanso" ? (
                          <div className="h-full flex items-center justify-center p-3 text-center text-xs font-medium text-[#64748B] bg-[#F8F9FA] rounded-[12px] border border-dashed border-[#E2E8F0]">😴 Día Libre</div>
                        ) : (
                          <>
                            {dia.objetivoFisico && <div className="p-2 rounded-[8px] bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-900 font-medium">🟢 Físico: {dia.objetivoFisico}</div>}
                            {dia.objetivoTecnico && <div className="p-2 rounded-[8px] bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-900 font-medium">🔵 Técnico: {dia.objetivoTecnico}</div>}
                            {dia.objetivoTactico && <div className="p-2 rounded-[8px] bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-900 font-medium">🟣 Táctico: {dia.objetivoTactico}</div>}
                          </>
                        )}
                      </div>
                      <Button onClick={() => abrirConfiguracionDia(dia)} variant="outline" className="w-full text-xs font-semibold h-8 rounded-[12px] border-[#E2E8F0] text-[#2563EB] hover:bg-blue-50 shadow-none transition-all">
                        <Pencil className="h-3 w-3 mr-1" /> Configurar
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}

            {(alcance === "Quincenal" || alcance === "Mensual") && (
              <div className="space-y-8">
                {Array.from({ length: alcance === "Mensual" ? 4 : 2 }).map((_, weekIndex) => (
                  <div key={weekIndex} className="space-y-3">
                    <h3 className="font-bold text-sm text-[#0F172A] border-b pb-2">
                      SEMANA {weekIndex + 1}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {diasSemanaArray.filter(d => d.semana === weekIndex + 1).map(({ nombre, fechaStr }) => {
                        const dia = diasPlan[fechaStr] || {
                          diaSemana: nombre,
                          fecha: fechaStr,
                          tipoJornada: "Entreno",
                          objetivoFisico: "",
                          objetivoTecnico: "",
                          objetivoTactico: "",
                          objetivoMental: "",
                          bloques: [],
                        };
                        const esHoy = fechaStr === hoyStr;

                        return (
                          <Card
                            key={fechaStr}
                            className={`border rounded-[12px] p-3 flex flex-col justify-between space-y-2 shadow-none transition-all ${
                              dia.sugeridoIA ? "border-[#2563EB] bg-[#F8FAFC]" : "bg-[#FFFFFF] border-[#E2E8F0]"
                            } ${
                              esHoy
                                ? "border-purple-600 bg-purple-50/30 ring-2 ring-purple-500/20 shadow-sm"
                                : ""
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${esHoy ? "text-purple-900" : "text-[#0F172A]"}`}>{nombre.slice(0, 3)}</span>
                                {esHoy && <span className="px-1.5 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[8px] shadow-sm">HOY</span>}
                              </div>
                              <p className="text-[9px] text-[#64748B] font-mono">{fechaStr.slice(5)}</p>

                              <div className="pt-1">
                                <span
                                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                                    dia.tipoJornada === "Entreno"
                                      ? "bg-blue-50 text-[#2563EB]"
                                      : dia.tipoJornada === "Partido"
                                      ? "bg-emerald-50 text-[#059669]"
                                      : dia.tipoJornada === "Recuperación"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-slate-100 text-[#64748B]"
                                  }`}
                                >
                                  {dia.tipoJornada}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1 flex-1 min-h-[80px]">
                              {dia.tipoJornada === "Descanso" ? (
                                <div className="h-full flex items-center justify-center p-2 text-center text-[10px] font-medium text-[#64748B] bg-[#F8F9FA] rounded-[8px] border border-dashed border-[#E2E8F0]">
                                  Descanso
                                </div>
                              ) : (
                                <>
                                  {dia.objetivoFisico && <div className="text-[10px] truncate text-emerald-700">🟢 {dia.objetivoFisico}</div>}
                                  {dia.objetivoTecnico && <div className="text-[10px] truncate text-blue-700">🔵 {dia.objetivoTecnico}</div>}
                                  {dia.objetivoTactico && <div className="text-[10px] truncate text-purple-700">🟣 {dia.objetivoTactico}</div>}
                                </>
                              )}
                            </div>

                            <Button
                              onClick={() => abrirConfiguracionDia(dia)}
                              variant="outline"
                              className="w-full text-[10px] font-semibold h-6 rounded-[8px] border-[#E2E8F0] text-[#2563EB] hover:bg-blue-50 shadow-none transition-all px-1"
                            >
                              <Pencil className="h-2.5 w-2.5 mr-1" /> Editar
                            </Button>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ESCUDO DE CONTEXTO */}
          <div className="lg:col-span-1 space-y-4 sticky top-4">
            <Card className="p-5 border rounded-[12px] bg-[#0F172A] text-white space-y-2 shadow-none border-[#0F172A]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">OBJETIVO INSTITUCIONAL DEL CLUB</span>
              <h4 className="font-bold text-sm text-white">Objetivo Metodológico del Mes:</h4>
              <div className="p-3 rounded-[12px] bg-slate-800 text-xs font-medium text-slate-200">
                📌 "Consolidar la salida limpia con 3 perfiles de pase y basculación oportuna".
              </div>
              <p className="text-[11px] text-[#64748B]">Exigido por la Coordinación Metodológica.</p>
            </Card>

            <Card className="p-5 border rounded-[12px] bg-[#FFFFFF] border-[#E2E8F0] shadow-none space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">VARIABLES EN VIVO DE LA ACADEMIA</p>

              <div className="space-y-1.5 border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                  <span className="flex items-center gap-1.5 text-red-600 font-semibold">
                    <UserX className="h-3.5 w-3.5" /> Lesionados Activos DB
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold">
                    {lesionadosDb.length} Alumno(s)
                  </span>
                </div>
                {lesionadosDb.length === 0 ? (
                  <p className="text-xs text-[#64748B]">Sin lesiones activas reportadas en Supabase.</p>
                ) : (
                  lesionadosDb.map((les, idx) => (
                    <p key={idx} className="text-xs text-[#475569]">
                      · {les.jugador || les.jugador_nombre || "Jugador"} ({les.diagnostico || les.tipo || "En recuperación"})
                    </p>
                  ))
                )}
              </div>

              <div className="space-y-1 border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                  <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                    <CloudSun className="h-3.5 w-3.5" /> Clima (UTC-6)
                  </span>
                  <span className="text-xs font-semibold text-[#64748B]">24°C / Soleado - Lluvia</span>
                </div>
                <p className="text-xs text-[#64748B]">Previsión semanal optimizada para cancha abierta.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                  <span className="flex items-center gap-1.5 text-[#2563EB] font-semibold">
                    <MapPin className="h-3.5 w-3.5" /> Espacio en Cancha
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#059669] text-[10px] font-semibold">Cancha Activa DB</span>
                </div>
                <p className="text-xs text-[#64748B]">Sede Principal Élite (14:00 - 18:00 hs).</p>
              </div>
            </Card>

            <Card className="p-5 border rounded-[12px] bg-amber-50/50 border-amber-200 shadow-none space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" /> RE-PLANIFICACIÓN IA
              </span>
              <p className="text-xs font-regular text-[#475569]">
                "Detectamos bajo cumplimiento en <strong>Presión Tras Pérdida</strong> el entrenamiento anterior. ¿Deseas insertar un circuito de refuerzo este Jueves?"
              </p>
              <div className="pt-1">
                <Button
                  onClick={() => {
                    toast.success("Circuito de refuerzo de Presión insertado para el Jueves.");
                  }}
                  size="sm"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-[12px] shadow-none py-2 px-3"
                >
                  ⚡ Insertar Refuerzo el Jueves
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* REGLA 2: FORMULARIO PANEL LATERAL SLIDE-OVER "A PIE" CON LOS TRES BLOQUES */}
      {diaModalSel && (
        <Sheet open={panelLateralAbierto} onOpenChange={setPanelLateralAbierto}>
          <SheetContent className="sm:max-w-xl w-full p-6 bg-[#FFFFFF] border-l border-[#E2E8F0] space-y-6 overflow-y-auto">
            <SheetHeader className="text-left border-b border-[#F1F5F9] pb-4">
              <SheetTitle className="text-lg font-bold flex items-center gap-2 text-[#0F172A]">
                <Pencil className="h-5 w-5 text-[#2563EB]" /> Configurar Sesión "A Pie"
              </SheetTitle>
              <SheetDescription className="text-xs text-[#64748B]">
                Ajusta manualmente los objetivos y los 6 bloques del {diaModalSel.diaSemana} ({diaModalSel.fecha}).
              </SheetDescription>
            </SheetHeader>

            {/* BLOQUE A: CONFIGURACIÓN DEL DÍA */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">BLOQUE A: TIPO DE JORNADA</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "Entreno", label: "⚽ Entreno" },
                  { id: "Partido", label: "🏆 Partido" },
                  { id: "Recuperación", label: "🚑 Recup." },
                  { id: "Descanso", label: "💤 Descanso" }
                ].map((tipo) => (
                  <button
                    key={tipo.id}
                    onClick={() => setDiaModalSel({ ...diaModalSel, tipoJornada: tipo.id as any })}
                    className={`px-3 py-2 rounded-[12px] text-xs font-semibold transition-all border text-center ${
                      diaModalSel.tipoJornada === tipo.id
                        ? "bg-[#2563EB] text-white border-[#2563EB] shadow-sm"
                        : "bg-[#F8F9FA] text-[#64748B] border-[#E2E8F0] hover:text-[#0F172A]"
                    }`}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BLOQUE B: EL BANCO DE OBJETIVOS (SINCRONIZADO CON CATÁLOGO) */}
            {diaModalSel.tipoJornada !== "Descanso" ? (
              <div className="space-y-4 border-t border-[#F1F5F9] pt-4">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">BLOQUE B: BANCO DE OBJETIVOS (CATÁLOGO DEL CLUB)</p>

                  {/* OBJETIVO TÁCTICO */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-purple-700 flex items-center justify-between">
                      <span>🟣 Objetivo Táctico</span>
                    </label>
                    <Select
                      value={diaModalSel.objetivoTactico}
                      onValueChange={(val) => setDiaModalSel({ ...diaModalSel, objetivoTactico: val })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-[12px] border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="➕ Añadir Objetivo Táctico..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-[12px] bg-white border border-[#E2E8F0]">
                        {CATALOGO_CLUB.tactico.map((item) => (
                          <SelectItem key={item} value={item} className="text-xs">
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* OBJETIVO FÍSICO */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-700 flex items-center justify-between">
                      <span>🟢 Objetivo Físico</span>
                    </label>
                    <Select
                      value={diaModalSel.objetivoFisico}
                      onValueChange={(val) => setDiaModalSel({ ...diaModalSel, objetivoFisico: val })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-[12px] border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="➕ Añadir Objetivo Físico..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-[12px] bg-white border border-[#E2E8F0]">
                        {CATALOGO_CLUB.fisico.map((item) => (
                          <SelectItem key={item} value={item} className="text-xs">
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* OBJETIVO TÉCNICO */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-blue-700 flex items-center justify-between">
                      <span>🔵 Objetivo Técnico</span>
                    </label>
                    <Select
                      value={diaModalSel.objetivoTecnico}
                      onValueChange={(val) => setDiaModalSel({ ...diaModalSel, objetivoTecnico: val })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-[12px] border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="➕ Añadir Objetivo Técnico..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-[12px] bg-white border border-[#E2E8F0]">
                        {CATALOGO_CLUB.tecnico.map((item) => (
                          <SelectItem key={item} value={item} className="text-xs">
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* OBJETIVO MENTAL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-amber-700 flex items-center justify-between">
                      <span>🟡 Objetivo Mental</span>
                    </label>
                    <Select
                      value={diaModalSel.objetivoMental}
                      onValueChange={(val) => setDiaModalSel({ ...diaModalSel, objetivoMental: val })}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-[12px] border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="➕ Añadir Objetivo Mental..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-[12px] bg-white border border-[#E2E8F0]">
                        {CATALOGO_CLUB.mental.map((item) => (
                          <SelectItem key={item} value={item} className="text-xs">
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* BLOQUE C: ASIGNACIÓN DEL CRONOGRAMA (LOS 6 BLOQUES) */}
                <div className="space-y-3 border-t border-[#F1F5F9] pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">BLOQUE C: CRONOGRAMA EN 6 BLOQUES METODOLÓGICOS</p>
                  <div className="space-y-3">
                    {diaModalSel.bloques?.map((b, bIdx) => (
                      <div key={bIdx} className="p-3.5 rounded-[12px] border border-[#E2E8F0] bg-[#F8F9FA] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-[#2563EB]">{b.nombre}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#64748B]" />
                            <Select
                              value={String(b.duracionMin)}
                              onValueChange={(v) => {
                                const bNuevos = [...diaModalSel.bloques];
                                bNuevos[bIdx].duracionMin = Number(v);
                                setDiaModalSel({ ...diaModalSel, bloques: bNuevos });
                              }}
                            >
                              <SelectTrigger className="h-7 w-20 text-xs rounded-[8px] border-[#E2E8F0] bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-[8px]">
                                {[10, 15, 20, 25, 30, 40].map((min) => (
                                  <SelectItem key={min} value={String(min)} className="text-xs">
                                    {min} min
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Input
                            value={b.descripcion}
                            onChange={(e) => {
                              const bNuevos = [...diaModalSel.bloques];
                              bNuevos[bIdx].descripcion = e.target.value;
                              setDiaModalSel({ ...diaModalSel, bloques: bNuevos });
                            }}
                            placeholder="Descripción del contenido..."
                            className="h-8 text-xs rounded-[12px] bg-white border-[#E2E8F0] flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info("📚 Catálogo de Ejercicios: Ejercicio cargado desde la biblioteca.")}
                            className="h-8 text-[11px] font-semibold rounded-[12px] border-[#E2E8F0] text-[#2563EB]"
                          >
                            <BookOpen className="h-3 w-3 mr-1" /> Buscar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-[#F1F5F9] pt-4">
                  <Button variant="outline" onClick={() => setPanelLateralAbierto(false)} className="rounded-[12px] text-xs font-semibold border-[#E2E8F0]">
                    Cancelar
                  </Button>
                  <Button onClick={guardarDiaEditado} className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-[12px] text-xs font-semibold">
                    💾 Guardar Planificación
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8F9FA] rounded-[12px] border border-dashed border-[#E2E8F0] space-y-3">
                <p>💤 El día está configurado como <strong>Descanso</strong>. El banco de objetivos y bloques están bloqueados automáticamente.</p>
                <Button onClick={guardarDiaEditado} className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-[12px] text-xs font-semibold">
                  💾 Guardar Estado Descanso
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      {/* MODAL ATHLETIX AI */}
      <Dialog open={aiModalAbierto} onOpenChange={setAiModalAbierto}>
        <DialogContent className="max-w-lg rounded-[12px] p-6 bg-[#FFFFFF] border border-[#E2E8F0] space-y-4 shadow-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-[#2563EB]">
              <Sparkles className="h-5 w-5 text-amber-500 animate-spin" /> Athletix AI - Generador de Sesiones
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              La IA calculará la curva de carga física respecto al partido e inyectará los ejercicios del manual del club en 5 segundos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#0F172A]">1. Equipo Target:</label>
              <p className="text-xs font-mono font-bold text-[#2563EB]">{equipoSel} ({categoriaSel})</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F172A]">2. Conceptos Tácticos Prioritarios a Desarrollar:</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {["Salida limpia desde atrás", "Presión alta tras pérdida", "Transición ofensiva rápida", "Basculación y coberturas", "Pases en rombo"].map((conc) => {
                  const sel = aiPrioridades.includes(conc);
                  return (
                    <button
                      key={conc}
                      onClick={() => {
                        if (sel) setAiPrioridades(aiPrioridades.filter((c) => c !== conc));
                        else setAiPrioridades([...aiPrioridades, conc]);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                        sel
                          ? "bg-[#2563EB] text-white border-[#2563EB]"
                          : "bg-[#F8F9FA] text-[#64748B] border-[#E2E8F0]"
                      }`}
                    >
                      {sel ? "✓ " : "+ "}{conc}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
            <Button variant="outline" onClick={() => setAiModalAbierto(false)} className="rounded-[12px] text-xs font-semibold border-[#E2E8F0]">
              Cancelar
            </Button>
            <Button
              onClick={ejecutarAthletixAI}
              disabled={aiGenerando}
              className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs rounded-[12px] shadow-none"
            >
              {aiGenerando ? "⚡ Procesando con Athletix AI..." : "✨ Generar Lienzo en 5 seg"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG SELECTOR INTELIGENTE: "¿Qué deseas planificar hoy?" ──────────────── */}
      <Dialog open={openSelectorModal} onOpenChange={setOpenSelectorModal}>
        <DialogContent className="sm:max-w-[550px] bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Plus className="h-5 w-5 text-primary text-blue-600" /> ¿Qué deseas planificar hoy?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecciona el tipo de ciclo que deseas estructurar o editar para el equipo <strong className="text-foreground">{equipoSel}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* CARD 1: Semanal */}
            <button
              onClick={() => {
                setOpenSelectorModal(false);
                setOpenEditWeekly(true);
              }}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border/80 bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-all text-center group"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-foreground">Plan Semanal</p>
              <p className="text-[10px] text-muted-foreground mt-1">Lunes a Domingo, entrenos y partidos detallados</p>
            </button>

            {/* CARD 2: Microciclo */}
            <button
              onClick={() => {
                setOpenSelectorModal(false);
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
                setOpenCreateModal(true);
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
                setOpenCreateModal(true);
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

      {/* ── DIALOG 1: EDITAR PLANIFICACIÓN SEMANAL ────────────────────────── */}
      <Dialog open={openEditWeekly} onOpenChange={setOpenEditWeekly}>
        <DialogContent className="sm:max-w-[620px] bg-background border shadow-elegant text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Pencil className="h-5 w-5 text-primary text-blue-600" /> Editar Planificación Semanal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifica el responsable, objetivo y las actividades de cada día de la semana.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveWeeklyManual} className="space-y-4 pt-2">
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
                  const act = weeklyActividades.find((a: any) => a.dia === idx) || { dia: idx, titulo: "", hora: "", tipo: "entreno" };
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
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-elegant text-xs h-9">Guardar Semana</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 2: NUEVA PLANIFICACIÓN DE MICROCICLO ────────────────────── */}
      <Dialog open={openCreatePlan} onOpenChange={setOpenCreatePlan}>
        <DialogContent className="sm:max-w-[550px] bg-background border shadow-elegant text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Zap className="h-5 w-5 text-amber-500" /> Nueva Planificación de Microciclo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define el nombre del ciclo, la semana de duración y las tareas específicas de entrenamiento para el equipo <strong className="text-foreground">{equipoSel}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nombre del Ciclo *</Label>
              <Input
                placeholder="Ej. Microciclo 1: Transición Defensiva"
                value={planName}
                onChange={e => setPlanName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fecha Inicio *</Label>
                <Input type="date" value={planStart} onChange={e => setPlanStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fecha Fin *</Label>
                <Input type="date" value={planEnd} onChange={e => setPlanEnd(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Objetivos de Rendimiento</Label>
              <Textarea
                rows={3}
                placeholder="Ej. Mejorar la transición de ataque a defensa y el repliegue en bloque medio."
                value={planObjectives}
                onChange={e => setPlanObjectives(e.target.value)}
              />
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Tareas / Ejercicios específicos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] gap-1"
                  onClick={() => setPlanExercises([...planExercises, { id: `ex_${Date.now()}`, nombre: "", duracion: 15 }])}
                >
                  <Plus className="h-3 w-3" /> Agregar Ejercicio
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {planExercises.map((ex, i) => (
                  <div key={ex.id || i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <Input
                      placeholder="Nombre del ejercicio o tarea (ej. Rondo 4v2)"
                      value={ex.nombre}
                      onChange={e => {
                        const copy = [...planExercises];
                        copy[i].nombre = e.target.value;
                        setPlanExercises(copy);
                      }}
                      className="text-xs h-8 flex-1"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number"
                        value={ex.duracion}
                        onChange={e => {
                          const copy = [...planExercises];
                          copy[i].duracion = Number(e.target.value);
                          setPlanExercises(copy);
                        }}
                        className="text-xs h-8 w-16 text-center"
                      />
                      <span className="text-[10px] text-muted-foreground">min</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => setPlanExercises(planExercises.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button type="button" variant="outline" onClick={() => setOpenCreatePlan(false)} className="text-xs h-9">Cancelar</Button>
              <Button
                type="button"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9"
                onClick={() => {
                  iniciarPlanificacionManual();
                  setOpenCreatePlan(false);
                  toast.success("⚡ Microciclo creado exitosamente.");
                }}
              >
                Guardar Planificación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 3: NUEVA PLANIFICACIÓN MENSUAL (MESOCICLO / TEMPORADA) ──── */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="sm:max-w-[700px] bg-background border shadow-elegant text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Layers className="h-5 w-5 text-purple-500" /> Nueva Planificación (Mesociclo / Temporada)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configura el currículum de entrenamiento mensual o el macrociclo anual para el equipo <strong className="text-foreground">{equipoSel}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Categoría *</Label>
                <Input value={categoriaSel} onChange={e => setCategoriaSel(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Equipo</Label>
                <Input value={equipoSel} readOnly className="bg-muted/50" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Entrenador</Label>
                <Input value={weeklyResponsable} onChange={e => setWeeklyResponsable(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fecha de Creación</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Objetivo General *</Label>
              <Textarea rows={2} placeholder="Describa el objetivo formativo principal de la categoría..." />
            </div>

            <div className="border-t pt-3 space-y-2">
              <Label className="text-xs font-bold text-purple-600">Pilares de Trabajo por Bloque</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
                  <p className="text-xs font-bold text-purple-700">Trabajo Técnico</p>
                  <Input placeholder="Ej. Control orientado..." className="text-xs h-7" />
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <p className="text-xs font-bold text-blue-700">Táctica Colectiva</p>
                  <Input placeholder="Ej. Basculación..." className="text-xs h-7" />
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <p className="text-xs font-bold text-emerald-700">Física Base</p>
                  <Input placeholder="Ej. Fuerza explosiva..." className="text-xs h-7" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button type="button" variant="outline" onClick={() => setOpenCreateModal(false)} className="text-xs h-9">Cancelar</Button>
              <Button
                type="button"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9"
                onClick={() => {
                  iniciarPlanificacionManual();
                  setOpenCreateModal(false);
                  toast.success("🔁 Mesociclo guardado exitosamente.");
                }}
              >
                Guardar Planificación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CoachPlannerPage;
