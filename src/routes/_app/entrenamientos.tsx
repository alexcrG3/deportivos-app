import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Dumbbell, Clock, MapPin, Users, Plus, GripVertical, Search,
  CheckCircle2, Play, Activity, Mic, MicOff, AlertTriangle, ShieldCheck, ShieldHalf, Tv,
  ChevronRight, ArrowLeft, Timer, Trophy, Sparkles, HeartPulse, Flame,
  FileText, Check, X, AlertCircle, HelpCircle, StopCircle, RefreshCw, Trash2, Lock, Unlock, Maximize2
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import RendimientoStore, { calcWellnessScore } from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { CoachOsBanner } from "@/components/coach-os-banner";
import TacticalBoard from "@/components/tactical-board";
import { CanchaBCoachBoard } from "@/components/cancha-bcoach-board";

export const Route = createFileRoute("/_app/entrenamientos")({
  validateSearch: (search: Record<string, unknown> = {}): {
    autostart?: string;
    teamName?: string;
    category?: string;
    fecha?: string;
  } => ({
    autostart: typeof search?.autostart === "string" ? search.autostart : undefined,
    teamName: typeof search?.teamName === "string" ? search.teamName : undefined,
    category: typeof search?.category === "string" ? search.category : undefined,
    fecha: typeof search?.fecha === "string" ? search.fecha : undefined,
  }),
  component: EntrenamientosPage,
});

// ─────────────────────────────────────────────
//  TYPES FOR ACTIVE SESSION FLOW
// ─────────────────────────────────────────────
type EstadoAsistencia = "presente" | "tarde" | "ausente" | "justificado";
type WellnessColor = "verde" | "amarillo" | "rojo";

interface JugadorSesion {
  id: string;
  nombre: string;
  avatar: string;
  categoria: string;
  asistencia: EstadoAsistencia;
  wellnessColor: WellnessColor;
  wellnessDetalle?: string;
  tiempoTest?: string;
  testStatus?: "excelente" | "promedio" | "bajo";
}

interface SesionActivaData {
  id: string;
  nombre: string;
  equipo: string;
  categoria: string;
  fecha: string;
  duracionMinutos: number;
  objetivo: string;
  jugadores: JugadorSesion[];
  preguntasPedagogicas?: string[];
}

const JUGADORES_DEMO_U9: JugadorSesion[] = [
  { id: "j1", nombre: "Aaron Pacheco Fonseca", avatar: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80", categoria: "Sub-9", asistencia: "presente", wellnessColor: "verde" },
  { id: "j2", nombre: "Adrián Soto Brenes", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80", categoria: "Sub-9", asistencia: "presente", wellnessColor: "amarillo", wellnessDetalle: "Dolor ligero de rodilla por crecimiento (reportado por mamá)" },
  { id: "j3", nombre: "Andrés Vargas Chaves", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80", categoria: "Sub-9", asistencia: "presente", wellnessColor: "verde" },
  { id: "j4", nombre: "Daniel Mora Jiménez", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", categoria: "Sub-9", asistencia: "tarde", wellnessColor: "verde" },
  { id: "j5", nombre: "Gabriel Castro Solís", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", categoria: "Sub-9", asistencia: "presente", wellnessColor: "rojo", wellnessDetalle: "Mal dormir (menos de 6h) y dolor de garganta" },
  { id: "j6", nombre: "Mateo Alvarado Pérez", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80", categoria: "Sub-9", asistencia: "presente", wellnessColor: "verde" },
  { id: "j7", nombre: "Santiago Navarro Rojas", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80", categoria: "Sub-9", asistencia: "ausente", wellnessColor: "verde" },
];

function EntrenamientosPage() {
  const { autostart, teamName: teamNameParam, category: categoryParam, fecha: fechaParam } = Route.useSearch();
  const { role, selectedCoachId, selectedCoachName, coachName } = useRole();

  // Mode: "normal" | "active_flow" (Paso 1, 2, 3)
  const [modoSesion, setModoSesion] = useState<"normal" | "activa">("normal");
  const [pasoActivo, setPasoActivo] = useState<1 | 2 | 3>(1);
  const [paso1Concluido, setPaso1Concluido] = useState<boolean>(false);
  const [modalConfirmPaso1, setModalConfirmPaso1] = useState<boolean>(false);

  const hoyYmd = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [fechaSesion, setFechaSesion] = useState<string>(fechaParam || hoyYmd);
  const isFechaRetroactiva = fechaSesion !== hoyYmd;
  const [isHistorialBloqueado, setIsHistorialBloqueado] = useState<boolean>(true);
  const isReadOnly = isFechaRetroactiva && isHistorialBloqueado;

  useEffect(() => {
    if (fechaSesion !== hoyYmd) {
      setIsHistorialBloqueado(true);
    } else {
      setIsHistorialBloqueado(false);
    }
  }, [fechaSesion, hoyYmd]);

  // Formatear texto de fecha legible dinámicamente
  const fechaTextoFormateada = useMemo(() => {
    const [y, m, d] = fechaSesion.split("-").map(Number);
    if (!y || !m || !d) return "";
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }, [fechaSesion]);

  // Active Session State
  const [sesionData, setSesionData] = useState<SesionActivaData>({
    id: `ses-${Date.now()}`,
    nombre: "Sesión de Cancha",
    equipo: "U9 Asoderive",
    categoria: "Sub-9",
    fecha: fechaTextoFormateada,
    duracionMinutos: 90,
    objetivo: "🎯 Foco: Pase con borde interno, control orientado y desmarque de apoyo.",
    jugadores: JUGADORES_DEMO_U9,
  });

  // Verificar si la fecha seleccionada corresponde a un día sin práctica regular según el horario del equipo
  const esDiaSinEntrenamiento = useMemo(() => {
    const [y, m, d] = fechaSesion.split("-").map(Number);
    if (!y || !m || !d) return false;
    const dayOfWeek = new Date(y, m - 1, d).getDay(); // 0 = Dom, 1 = Lun, 2 = Mar, 3 = Mié, 4 = Jue, 5 = Vie, 6 = Sáb

    // Consultar la configuración del equipo desde RendimientoStore
    const equiposList = RendimientoStore.getEquipos();
    const cleanStr = (s: string = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetClean = cleanStr(sesionData?.equipo || sesionData?.categoria || teamNameParam || categoryParam || "u9");

    const equipoObj = equiposList.find((eq) => {
      const nameClean = cleanStr(eq.nombre || "");
      const catClean = cleanStr(eq.categoria || "");
      return (nameClean && (nameClean.includes(targetClean) || targetClean.includes(nameClean))) ||
             (catClean && (catClean.includes(targetClean) || targetClean.includes(catClean)));
    });

    let configuredDays: number[] = [];

    if (equipoObj) {
      if (Array.isArray(equipoObj.dias_entrenamiento) && equipoObj.dias_entrenamiento.length > 0) {
        configuredDays = equipoObj.dias_entrenamiento;
      } else if (equipoObj.horario) {
        const sched = equipoObj.horario.toLowerCase();
        if (sched.includes("lun")) configuredDays.push(1);
        if (sched.includes("mar")) configuredDays.push(2);
        if (sched.includes("mié") || sched.includes("mie")) configuredDays.push(3);
        if (sched.includes("jue")) configuredDays.push(4);
        if (sched.includes("vie")) configuredDays.push(5);
        if (sched.includes("sáb") || sched.includes("sab")) configuredDays.push(6);
        if (sched.includes("dom")) configuredDays.push(0);
      }
    }

    // Por defecto para U9 Asoderive, entrenan Martes (2), Miércoles (3), Jueves (4)
    if (configuredDays.length === 0) {
      configuredDays = [2, 3, 4];
    }

    return !configuredDays.includes(dayOfWeek);
  }, [fechaSesion, sesionData?.equipo, sesionData?.categoria, teamNameParam, categoryParam]);

  // Mantener fecha de sesionData en sincro con fechaSesion
  useEffect(() => {
    setSesionData((prev) => ({
      ...prev,
      fecha: fechaTextoFormateada,
    }));
  }, [fechaTextoFormateada]);

  // Helper to load real players dynamically from RendimientoStore
  const getRealPlayersForTeam = (teamName: string, category: string): JugadorSesion[] => {
    const allPlayers = RendimientoStore.getJugadores();
    const clean = (s: string = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetClean = clean(category || teamName);
    const targetNumMatch = (category || teamName).match(/\d+/);
    const targetNum = targetNumMatch ? targetNumMatch[0] : "";

    let filtered = allPlayers.filter((p) => {
      const pCatClean = clean(p.categoria || "");
      if (pCatClean && (pCatClean === targetClean || pCatClean.includes(targetClean) || targetClean.includes(pCatClean))) {
        return true;
      }
      if (targetNum) {
        const pNumMatch = (p.categoria || "").match(/\d+/);
        if (pNumMatch && pNumMatch[0] === targetNum) return true;
      }
      return false;
    });

    if (filtered.length === 0 && allPlayers.length > 0) {
      filtered = allPlayers;
    }

    if (filtered.length === 0) {
      return JUGADORES_DEMO_U9;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const wellnessList = RendimientoStore.getWellness();

    return filtered.map((p, idx) => {
      const playerWell = wellnessList.find((w) => w.jugadorId === p.id && (w.fecha === fechaSesion || w.fecha === todayStr));

      let color: WellnessColor = "ninguno" as any;
      let detalle: string | undefined = undefined;

      if (playerWell) {
        const score = calcWellnessScore(playerWell);
        if (score < 50 || playerWell.fatiga > 3 || playerWell.dolorMuscular > 3) {
          color = "rojo";
          detalle = `Alerta Médica (${score}% Score)`;
        } else if (score < 75 || playerWell.fatiga > 2 || playerWell.dolorMuscular > 2 || playerWell.sueñoCalidad <= 2) {
          color = "amarillo";
          detalle = `Precaución (${score}% Score)`;
        } else {
          color = "verde";
          detalle = `Óptimo (${score}% Score)`;
        }
      }

      return {
        id: p.id || `j-${idx}`,
        nombre: p.nombre,
        avatar: p.foto || p.avatar || `https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80`,
        categoria: p.categoria || category || "General",
        asistencia: "presente" as EstadoAsistencia,
        wellnessColor: color,
        wellnessDetalle: detalle,
      };
    });
  };

  useEffect(() => {
    const targetTeam = teamNameParam || "U9 Asoderive";
    const targetCat = categoryParam || "Sub-9";

    const loadSessionPlayers = async () => {
      const realPlayers = getRealPlayersForTeam(targetTeam, targetCat);

      // Cargar asistencias guardadas para la fechaSesion desde Supabase y RendimientoStore
      const asistenciasMap: Record<string, EstadoAsistencia> = {};
      const wellnessMap: Record<string, { color: WellnessColor; detalle?: string }> = {};

      try {
        const { data: dbAsist } = await supabase
          .from("asistencia_registros")
          .select("*")
          .eq("fecha", fechaSesion);

        if (dbAsist && dbAsist.length > 0) {
          dbAsist.forEach((a: any) => {
            if (a.jugador_id && a.estado_asistencia) {
              asistenciasMap[a.jugador_id] = a.estado_asistencia as EstadoAsistencia;
            }
            if (a.jugador_id && a.wellness_color) {
              wellnessMap[a.jugador_id] = {
                color: a.wellness_color as WellnessColor,
                detalle: a.wellness_alerta_detalle || undefined,
              };
            }
          });
        }
      } catch (e) {}

      try {
        const storeAsist = RendimientoStore.getAsistencias().filter((a) => a.fecha === fechaSesion);
        storeAsist.forEach((a) => {
          if (a.jugadorId && a.estado) {
            asistenciasMap[a.jugadorId] = a.estado as EstadoAsistencia;
          }
        });
      } catch (e) {}

      // Cargar notas de cierre/dictado y minutas desde Supabase para fechaSesion
      try {
        const { data: dbSesion } = await supabase
          .from("minutas_diario")
          .select("*")
          .filter("fecha", "eq", fechaSesion)
          .maybeSingle();

        if (dbSesion) {
          if (dbSesion.observaciones) setNotasVoz(dbSesion.observaciones);
          if (dbSesion.proxima_clase) setProximaClase(dbSesion.proxima_clase);
          if (dbSesion.hay_lesion) {
            setHayLesion(true);
            if (dbSesion.jugador_lesionado_id) setJugadorLesionadoId(dbSesion.jugador_lesionado_id);
            if (dbSesion.gravedad_lesion) setGravedadLesion(dbSesion.gravedad_lesion);
            if (dbSesion.descripcion_lesion) setDescripcionLesion(dbSesion.descripcion_lesion);
          }
        }
      } catch (e) {}

      // Sincronizar retroactivamente registros de Wellness y Test marcados en sesiones de cancha
      try {
        const allSessions = RendimientoStore.getSesiones();
        const existingWellness = RendimientoStore.getWellness();
        const existingTests = RendimientoStore.getTests();

        allSessions.forEach((s: any) => {
          if (s.jugadores && Array.isArray(s.jugadores)) {
            s.jugadores.forEach((j: any) => {
              if (j.wellnessColor && (j.wellnessColor as any) !== "ninguno") {
                const alreadyHasW = existingWellness.some(w => w.jugadorId === j.id && w.fecha === s.fecha);
                if (!alreadyHasW) {
                  const wScore = j.wellnessColor === "verde" ? 100 : j.wellnessColor === "amarillo" ? 70 : 40;
                  RendimientoStore.addWellness({
                    jugadorId: j.id,
                    jugadorNombre: j.nombre,
                    fecha: s.fecha || fechaSesion,
                    wellnessScore: wScore,
                    fatiga: j.wellnessColor === "verde" ? 1 : j.wellnessColor === "amarillo" ? 3 : 4,
                    dolorMuscular: j.wellnessColor === "verde" ? 1 : j.wellnessColor === "amarillo" ? 2 : 4,
                    suenoHoras: j.wellnessColor === "verde" ? 8 : j.wellnessColor === "amarillo" ? 6.5 : 5,
                    energia: j.wellnessColor === "verde" ? 5 : j.wellnessColor === "amarillo" ? 3 : 2,
                    estres: 1,
                    notas: j.wellnessDetalle || `Registrado en sesión de ${s.equipo || "cancha"}`,
                  });
                }
              }

              if (j.testStatus || j.testValor) {
                const alreadyHasT = existingTests.some(t => t.jugadorId === j.id && t.fecha === s.fecha);
                if (!alreadyHasT) {
                  const testName = j.testNombre || "Sprint 30m";
                  const val = j.testValor || (j.testStatus === "excelente" ? "4.15s" : j.testStatus === "promedio" ? "4.50s" : "5.10s");
                  const calif = j.testStatus === "excelente" ? "Excelente" : j.testStatus === "promedio" ? "Promedio" : "Bajo";

                  RendimientoStore.addTest({
                    jugadorId: j.id,
                    jugador: j.nombre,
                    fecha: s.fecha || fechaSesion,
                    tipo: "Velocidad",
                    nombreTest: testName,
                    resultado: String(val),
                    progreso: 5.0,
                    estancado: false,
                  });

                  RendimientoStore.addEvaluacion({
                    jugadorId: j.id,
                    jugadorNombre: j.nombre,
                    fecha: s.fecha || fechaSesion,
                    equipo: s.equipo || targetCat,
                    prueba: testName,
                    valor: parseFloat(String(val)) || 4.2,
                    unidad: "s",
                    calificacion: calif,
                    notas: "Registrado en sesión de cancha",
                  });
                }
              }
            });
          }
        });
      } catch (e) {}

      try {
        const { data: dbSesion } = await supabase
          .from("sesiones_entrenamiento")
          .select("*")
          .eq("fecha", fechaSesion)
          .maybeSingle();

        if (dbSesion) {
          if (dbSesion.notas_entrenador) setNotasVoz(dbSesion.notas_entrenador);
          if (dbSesion.proxima_clase) setProximaClase(dbSesion.proxima_clase);
          if (dbSesion.estado === "completada") setPaso1Concluido(true);
        }
        const { data: dbMinuta } = await supabase
          .from("minutas_diario")
          .select("*")
          .eq("fecha", fechaSesion)
          .maybeSingle();

        if (dbMinuta) {
          if (dbMinuta.observaciones) setNotasVoz(dbMinuta.observaciones);
          if (dbMinuta.proxima_clase) setProximaClase(dbMinuta.proxima_clase);
          if (dbMinuta.hay_lesion) {
            setHayLesion(true);
            if (dbMinuta.jugador_lesionado_id) setJugadorLesionadoId(dbMinuta.jugador_lesionado_id);
            if (dbMinuta.gravedad_lesion) setGravedadLesion(dbMinuta.gravedad_lesion);
            if (dbMinuta.descripcion_lesion) setDescripcionLesion(dbMinuta.descripcion_lesion);
          }
        }
      } catch (e) {}

      // Aplicar asistencias/wellness/tests guardados a cada jugador
      const testMapStore = RendimientoStore.getTests();
      const wellnessMapStore = RendimientoStore.getWellness();

      const jugadoresActualizados = realPlayers.map((j) => {
        const estadoGuardado = asistenciasMap[j.id];
        const wellGuardado = wellnessMap[j.id];

        // Buscar si hay wellness guardado para esta fecha en el store o Supabase
        const wLog = wellnessMapStore.find(w => w.jugadorId === j.id && w.fecha === fechaSesion);
        const wColor: WellnessColor = wellGuardado 
          ? wellGuardado.color 
          : wLog 
          ? (wLog.wellnessScore >= 90 ? "verde" : wLog.wellnessScore >= 60 ? "amarillo" : "rojo")
          : j.wellnessColor;

        // Buscar si hay test guardado para esta fecha en el store o Supabase
        const testLog = testMapStore.find(t => (t.jugadorId === j.id || t.jugador === j.nombre) && t.fecha === fechaSesion);
        const tVal = testLog ? (testLog.resultado.endsWith("s") ? testLog.resultado : `${testLog.resultado}s`) : j.testValor;
        const tStatus: "excelente" | "promedio" | "bajo" | undefined = testLog 
          ? (parseFloat(testLog.resultado) < 4.0 ? "excelente" : parseFloat(testLog.resultado) <= 4.5 ? "promedio" : "bajo")
          : j.testStatus;

        return {
          ...j,
          asistencia: estadoGuardado || j.asistencia,
          wellnessColor: wColor,
          wellnessDetalle: wellGuardado ? wellGuardado.detalle : (wLog?.notas || j.wellnessDetalle),
          testValor: tVal,
          tiempoTest: testLog ? testLog.resultado.replace("s", "") : j.tiempoTest,
          testStatus: tStatus,
          testNombre: testLog ? testLog.nombreTest : j.testNombre,
        };
      });

      const planificaciones = RendimientoStore.getPlanificaciones();
      const cleanCat = (targetCat || "").toLowerCase().trim();
      const planEncontrado = planificaciones.find(
        (p) => p && ((p.categoria || "").toLowerCase().includes(cleanCat) || (p.equipo || "").toLowerCase().includes(cleanCat))
      );

      const preguntasReales = planEncontrado?.preguntasPedagogicas || planEncontrado?.preguntas || undefined;

      setSesionData((prev) => ({
        ...prev,
        equipo: targetTeam,
        categoria: targetCat,
        nombre: `Sesión de Cancha: ${targetTeam}`,
        jugadores: jugadoresActualizados,
        preguntasPedagogicas: preguntasReales,
      }));
    };

    loadSessionPlayers();

    const t1 = setTimeout(loadSessionPlayers, 500);
    const t2 = setTimeout(loadSessionPlayers, 1500);
    window.addEventListener("organizacionChanged", loadSessionPlayers);

    if (autostart === "true") {
      setModoSesion("activa");
      setPasoActivo(1);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("organizacionChanged", loadSessionPlayers);
    };
  }, [autostart, teamNameParam, categoryParam, fechaSesion]);

  // Chronometer & Countdown State for Paso 2
  const [tabBloqueActivo, setTabBloqueActivo] = useState<"bloque1" | "bloque2" | "bloque3">("bloque1");
  const [segundosRestantes, setSegundosRestantes] = useState<number>(900); // 15:00 default para Bloque 1
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [showTacticalCanvas, setShowTacticalCanvas] = useState<boolean>(false);

  // Inicializar cuenta regresiva según el bloque seleccionado
  const handleCambiarBloque = (bloque: "bloque1" | "bloque2" | "bloque3") => {
    setTabBloqueActivo(bloque);
    setTimerRunning(false);
    if (bloque === "bloque1") setSegundosRestantes(900); // 15 mins
    else if (bloque === "bloque2") setSegundosRestantes(3600); // 60 mins
    else setSegundosRestantes(900); // 15 mins
  };

  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => {
        setSegundosRestantes((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTiempo = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Physical Test Stopwatch State inside Paso 2
  const [modalTestSpeed, setModalTestSpeed] = useState<boolean>(false);
  const [isTestMasivo, setIsTestMasivo] = useState<boolean>(false);
  const [jugadorTestSel, setJugadorTestSel] = useState<string>(JUGADORES_DEMO_U9[0].id);
  const [testType, setTestType] = useState<string>("Yo-Yo Test");
  const [testNotes, setTestNotes] = useState<string>("");
  const [tiempoTestInput, setTiempoTestInput] = useState<string>("3.85");

  // Coach Wellness Modal State
  const [modalCoachWellness, setModalCoachWellness] = useState<boolean>(false);
  const [jugadorWellnessSel, setJugadorWellnessSel] = useState<JugadorSesion | null>(null);
  const [wellEstadoSel, setWellEstadoSel] = useState<WellnessColor>("verde");
  const [wellDetalleInput, setWellDetalleInput] = useState<string>("");

  // Bloque 3 Feedback Pedagogico State
  const [notaPregunta1, setNotaPregunta1] = useState<string>("");
  const [notaPregunta2, setNotaPregunta2] = useState<string>("");
  const [showNotaField1, setShowNotaField1] = useState<boolean>(false);
  const [showNotaField2, setShowNotaField2] = useState<boolean>(false);

  // Paso 3 Modal State (Cierre & Incidencias)
  const [modalCierreSesion, setModalCierreSesion] = useState<boolean>(false);
  const [modalPizarraTactica, setModalPizarraTactica] = useState<boolean>(false);
  const [isFullScreenPizarra, setIsFullScreenPizarra] = useState<boolean>(false);

  // Sesión inicial de Pizarra Táctica con los jugadores reales desplegados en la cancha verde
  const initialTacticalSession = useMemo(() => {
    const positions = [
      { x: 10, y: 32.5 },  // Portero
      { x: 28, y: 15 },    // Lateral Izquierdo
      { x: 26, y: 32.5 },  // Central
      { x: 28, y: 50 },    // Lateral Derecho
      { x: 50, y: 15 },    // Extremo Izquierdo
      { x: 48, y: 32.5 },  // Mediocentro
      { x: 50, y: 50 },    // Extremo Derecho
      { x: 75, y: 32.5 },  // Delantero
    ];

    const playersOnBoard = (sesionData.jugadores || []).map((j, idx) => {
      const pos = positions[idx % positions.length];
      return {
        slotId: `slot-${j.id}`,
        jugadorId: j.id,
        nombre: j.nombre,
        avatar: j.avatar,
        x: pos.x,
        y: pos.y,
      };
    });

    return {
      id: `cancha-pizarra-${fechaSesion}`,
      nombre: `Pizarra Táctica — ${sesionData.equipo}`,
      sport: "football" as const,
      players: playersOnBoard,
      arrows: [],
      zones: [],
      cones: [
        { id: "c1", x: 20, y: 10, color: "#f59e0b" },
        { id: "c2", x: 20, y: 55, color: "#f59e0b" },
        { id: "c3", x: 80, y: 10, color: "#f59e0b" },
        { id: "c4", x: 80, y: 55, color: "#f59e0b" },
      ],
      ball: { x: 50, y: 32.5 },
    };
  }, [sesionData.jugadores, sesionData.equipo, fechaSesion]);
  const [notasVoz, setNotasVoz] = useState<string>("");
  const [proximaClase, setProximaClase] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hayLesion, setHayLesion] = useState<boolean>(false);
  const [jugadorLesionadoId, setJugadorLesionadoId] = useState<string>(JUGADORES_DEMO_U9[0].id);
  const [gravedadLesion, setGravedadLesion] = useState<"leve" | "moderada" | "grave">("leve");
  const [descripcionLesion, setDescripcionLesion] = useState<string>("");

  const [activeSpeechTarget, setActiveSpeechTarget] = useState<"notasVoz" | "proximaClase">("notasVoz");

  // Voice to Text Dictation (Web Speech API)
  const startSpeechRecognition = (target: "notasVoz" | "proximaClase" = "notasVoz") => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("El navegador no soporta dictado por voz. Puedes escribir la nota manualmente.");
      return;
    }
    setActiveSpeechTarget(target);
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "es-CR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info(`🎙️ Escuchando... Dictando en ${target === "notasVoz" ? "Notas del Día" : "Para la Próxima Clase"}.`);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (target === "notasVoz") {
          setNotasVoz((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else {
          setProximaClase((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsRecording(false);
        toast.success("✨ Dictado capturado correctamente.");
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch (err) {
      setIsRecording(false);
      toast.error("Error al iniciar micrófono.");
    }
  };

  // Change Player Attendance in Paso 1
  const toggleAsistencia = (jugadorId: string, estado: EstadoAsistencia) => {
    if (isFechaRetroactiva && isHistorialBloqueado) {
      toast.warning("🔒 Historial bloqueado en modo solo lectura. Haz clic en 'Habilitar Edición de Historial' arriba para modificar esta fecha pasada.");
      return;
    }
    setSesionData((prev) => ({
      ...prev,
      jugadores: prev.jugadores.map((j) => {
        if (j.id !== jugadorId) return j;
        const isAbsentOrJustified = estado === "ausente" || estado === "justificado";
        return {
          ...j,
          asistencia: estado,
          wellnessColor: isAbsentOrJustified ? ("ninguno" as any) : (j.wellnessColor === ("ninguno" as any) ? "verde" : j.wellnessColor),
          wellnessDetalle: isAbsentOrJustified ? undefined : j.wellnessDetalle,
          tiempoTest: isAbsentOrJustified ? undefined : j.tiempoTest,
          testStatus: isAbsentOrJustified ? undefined : j.testStatus,
        };
      }),
    }));
  };

  // Finalize Session & Save directly
  const handleGuardarSesionFinal = async () => {
    const toastId = toast.loading("Guardando registro de entrenamiento...");

    const sesionDbId = `ses-${Date.now()}`;
    
    // Obtener UUID real del equipo
    const equipos = RendimientoStore.getEquipos();
    const equipoReal = equipos.find(e => 
      (e.nombre || "").toLowerCase() === (sesionData.equipo || "").toLowerCase() ||
      (e.categoria || "").toLowerCase() === (sesionData.categoria || "").toLowerCase()
    );
    const equipoIdUUID = equipoReal?.id || null;

    // 1. Guardar Sesión en Supabase DB
    try {
      await supabase.from("sesiones_entrenamiento").delete().eq("fecha", fechaSesion);
      const { error } = await supabase.from("sesiones_entrenamiento").insert({
        id: sesionDbId,
        organizacion_id: RendimientoStore.getActiveOrganizacionId(),
        equipo_id: equipoIdUUID,
        entrenador_id: selectedCoachId || coachName || "Entrenador Oficial",
        entrenador: coachName || selectedCoachName || "Entrenador Oficial",
        nombre: sesionData.nombre || `Sesión de Cancha: ${sesionData.equipo}`,
        equipo: equipoReal?.nombre || sesionData.equipo,
        categoria: equipoReal?.categoria || sesionData.categoria,
        sede: "Sede Central",
        instalacion: "Cancha Principal",
        intensidad: "Media",
        objetivo: sesionData.objetivo || "Entrenamiento Regular",
        bloques: [],
        fecha: fechaSesion,
        hora: "16:00",
        hora_inicio: "16:00",
        hora_fin: "17:30",
        duracion: sesionData.duracionMinutos,
        estado: "completada",
        notas_entrenador: notasVoz || "Sesión ejecutada con éxito.",
      });
      if (error) throw error;
    } catch (e: any) {
      console.warn("Nota de inserción en sesiones_entrenamiento:", e);
      toast.dismiss(toastId);
      toast.error("Error al guardar: " + (e?.message || JSON.stringify(e)));
      return;
    }

    // 2. Guardar Asistencias en Supabase DB
    try {
      await supabase.from("asistencia_registros").delete().eq("fecha", fechaSesion);
      const asistenciasDb = (sesionData.jugadores || []).map((j) => ({
        id: `asis-${Date.now()}-${j.id}`,
        sesion_id: sesionDbId,
        jugador_id: j.id,
        jugador_nombre: j.nombre,
        estado_asistencia: j.asistencia,
        wellness_color: j.wellnessColor,
        wellness_alerta_detalle: j.wellnessDetalle || null,
        fecha: fechaSesion,
      }));
      const { error } = await supabase.from("asistencia_registros").insert(asistenciasDb);
      if (error) throw error;
    } catch (e: any) {
      console.warn("Nota de inserción en asistencia_registros:", e);
      toast.dismiss(toastId);
      toast.error("Error al guardar asistencias: " + (e?.message || JSON.stringify(e)));
      return;
    }

    // 3. Sincronizar Asistencias, Wellness y Tests en RendimientoStore Local
    try {
      (sesionData.jugadores || []).forEach((j) => {
        RendimientoStore.addAsistencia({
          id: `asis-local-${Date.now()}-${j.id}`,
          jugadorId: j.id,
          jugadorNombre: j.nombre,
          fecha: fechaSesion,
          estado: j.asistencia,
          equipo: sesionData.equipo,
        });

        // Guardar Registro de Wellness si fue marcado en la cancha
        if (j.wellnessColor && (j.wellnessColor as any) !== "ninguno") {
          const wScore = j.wellnessColor === "verde" ? 100 : j.wellnessColor === "amarillo" ? 70 : 40;
          RendimientoStore.addWellness({
            jugadorId: j.id,
            jugadorNombre: j.nombre,
            fecha: fechaSesion,
            wellnessScore: wScore,
            fatiga: j.wellnessColor === "verde" ? 1 : j.wellnessColor === "amarillo" ? 3 : 4,
            dolorMuscular: j.wellnessColor === "verde" ? 1 : j.wellnessColor === "amarillo" ? 2 : 4,
            suenoHoras: j.wellnessColor === "verde" ? 8 : j.wellnessColor === "amarillo" ? 6.5 : 5,
            energia: j.wellnessColor === "verde" ? 5 : j.wellnessColor === "amarillo" ? 3 : 2,
            estres: 1,
            notas: j.wellnessDetalle || `Registrado en sesión de ${sesionData.equipo}`,
          });
        }

        // Guardar Evaluación / Test Físico si fue marcado en la cancha
        if (j.testStatus || j.testValor) {
          const testName = j.testNombre || "Sprint 30m";
          const val = j.testValor || (j.testStatus === "excelente" ? "4.15s" : j.testStatus === "promedio" ? "4.50s" : "5.10s");
          const calif = j.testStatus === "excelente" ? "Excelente" : j.testStatus === "promedio" ? "Promedio" : "Bajo";

          RendimientoStore.addTest({
            jugadorId: j.id,
            jugador: j.nombre,
            fecha: fechaSesion,
            tipo: "Velocidad",
            nombreTest: testName,
            resultado: String(val),
            progreso: 5.0,
            estancado: false,
          });

          RendimientoStore.addEvaluacion({
            jugadorId: j.id,
            jugadorNombre: j.nombre,
            fecha: fechaSesion,
            equipo: sesionData.equipo,
            prueba: testName,
            valor: parseFloat(String(val)) || 4.2,
            unidad: "s",
            calificacion: calif,
            notas: "Registrado en sesión de cancha",
          });
        }

        // Guardar Registro de Carga de Entrenamiento (Control de Cargas ACWR) si asistió
        if (j.asistencia === "presente" || j.asistencia === "tardanza") {
          RendimientoStore.addCargaEntrenamiento({
            jugadorId: j.id,
            jugadorNombre: j.nombre,
            fecha: fechaSesion,
            duracion: sesionData.duracionMinutos || 90,
            rpe: 6,
            intensidad: "Media",
          });
        }
      });
    } catch (e) {
      console.warn("Nota de sincronización local:", e);
    }

    // 4. Si hay Lesión, Guardar Incidencia en Supabase DB
    if (hayLesion) {
      try {
        const jugadorLes = (sesionData.jugadores || []).find((j) => j.id === jugadorLesionadoId);
        const { error } = await supabase.from("incidencias_lesiones").insert({
          id: `les-${Date.now()}`,
          sesion_id: sesionDbId,
          jugador_id: jugadorLesionadoId,
          jugador_nombre: jugadorLes?.nombre || "Atleta",
          fecha: fechaSesion,
          gravedad: gravedadLesion,
          zona_corporal: "Extremidad Inferior",
          descripcion: descripcionLesion || "Incidencia reportada durante el entrenamiento.",
          notificado_admin: true,
          estado_atencion: "pendiente_seguro",
        });
        if (error) throw error;
        toast.info("🚨 Reporte de Lesión enviado a Administración.");
      } catch (e) {
        console.warn("Nota de inserción en incidencias_lesiones:", e);
      }
    }

    // 5. Sincronizar en la tabla global de Bitácora / Minutas (minutas_diario)
    try {
      const jugadorLes = (sesionData.jugadores || []).find((j) => j.id === jugadorLesionadoId);
      await supabase.from("minutas_diario").upsert({
        id: `minuta-${sesionDbId}`,
        titulo: sesionData.nombre || `Sesión de Cancha: ${sesionData.equipo}`,
        fecha: fechaSesion,
        equipo: sesionData.equipo,
        observaciones: notasVoz || "Sesión ejecutada con éxito.",
        proxima_clase: proximaClase || "",
        hay_lesion: hayLesion,
        jugador_lesionado_id: hayLesion ? jugadorLesionadoId : null,
        jugador_lesionado_nombre: hayLesion ? (jugadorLes?.nombre || "Atleta") : null,
        gravedad_lesion: hayLesion ? gravedadLesion : null,
        descripcion_lesion: hayLesion ? descripcionLesion : null,
        organizacion_id: RendimientoStore.getActiveOrganizacionId(),
      });
    } catch (e) {
      console.warn("Nota de inserción en minutas_diario:", e);
    }

    toast.dismiss(toastId);
    toast.success("🎉 ¡Entrenamiento completado y guardado correctamente!");
    setModalCierreSesion(false);
    setModoSesion("normal");
    setPasoActivo(1);
    
    // 🔥 IMPORTANTE: Recargar la vista con la base de datos actualizada
    cargarSesionesDb();
  };

  // ─────────────────────────────────────────────
  // Carga 100% directa desde Supabase PostgreSQL
  // ─────────────────────────────────────────────
  const [listaSesionesDb, setListaSesionesDb] = useState<any[]>([]);
  const [loadingSesionesDb, setLoadingSesionesDb] = useState<boolean>(true);

  const cargarSesionesDb = async () => {
    setLoadingSesionesDb(true);

    try {
      // Consultar absolutamente TODAS las sesiones almacenadas en la tabla Supabase
      const { data, error } = await supabase
        .from("sesiones_entrenamiento")
        .select("*")
        .order("fecha", { ascending: false });

      if (data && data.length > 0) {
        setListaSesionesDb(data);
      } else {
        // Si no hay datos en la tabla sesiones_entrenamiento
        const { data: asisData } = await supabase
          .from("asistencia_registros")
          .select("fecha, sesion_id")
          .order("fecha", { ascending: false });

        if (asisData && asisData.length > 0) {
          const fechasUnicas = Array.from(new Set(asisData.map((a: any) => a.fecha)));
          const sesionesReales = fechasUnicas.map((f: string) => ({
            id: `ses-db-${f}`,
            nombre: `Sesión de Cancha (${f})`,
            equipo_id: sesionData.equipo,
            fecha: f,
          }));
          setListaSesionesDb(sesionesReales);
        } else {
          setListaSesionesDb([]);
        }
      }
    } catch (e) {
      console.warn("Error al cargar sesiones de Supabase:", e);
      setListaSesionesDb([]);
    } finally {
      setLoadingSesionesDb(false);
    }
  };

  useEffect(() => {
    cargarSesionesDb();
  }, [hoyYmd, sesionData.equipo]);

  // ─────────────────────────────────────────────
  //  MODO SESIÓN ACTIVA EN CANCHA (FLUJO 3 PASOS)
  // ─────────────────────────────────────────────
  if (modoSesion === "activa") {
    return (
      <div className="min-h-screen bg-[#F4F5F7] -m-6 p-6 space-y-6 text-[#0F172A]">
        {/* HEADER TOP DE SALA DE CANCHA */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModoSesion("normal")}
              className="h-9 px-3 border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8F9FA] rounded-xl gap-1 text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4 text-[#2563EB]" /> Salir de Cancha
            </Button>
            <div>
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                {sesionData.equipo} — {sesionData.categoria}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-[#0F172A] line-clamp-1">{sesionData.nombre}</h1>
            </div>
          </div>

          {/* Stepper Indicator + Date Picker (Pase Retroactivo) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Fecha de Asistencia */}
            <div className="flex items-center gap-1.5 bg-[#F8F9FA] p-1 rounded-xl border border-[#E2E8F0]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase px-2">Fecha:</span>
              <input
                type="date"
                value={fechaSesion}
                onChange={(e) => setFechaSesion(e.target.value)}
                className="bg-white text-xs font-bold text-[#0F172A] px-2.5 py-1 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
              />
              {isFechaRetroactiva && (
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-amber-500/10 text-amber-700 border border-amber-500/30 text-[10px] font-bold">
                    Pase Retroactivo
                  </Badge>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (isHistorialBloqueado) {
                        setIsHistorialBloqueado(false);
                        toast.success(`🔓 Edición del historial habilitada para la fecha ${fechaSesion}.`);
                      } else {
                        setIsHistorialBloqueado(true);
                        toast.info("🔒 Historial bloqueado en modo solo lectura.");
                      }
                    }}
                    className={`h-7 px-2 text-[10px] font-black rounded-lg gap-1.5 transition-all ${
                      isHistorialBloqueado
                        ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                        : "bg-emerald-600 text-white hover:bg-emerald-500"
                    }`}
                  >
                    {isHistorialBloqueado ? <Lock className="h-3.5 w-3.5 text-amber-700" /> : <Unlock className="h-3.5 w-3.5" />}
                    {isHistorialBloqueado ? "Habilitar Edición de Historial" : "Bloquear Historial"}
                  </Button>
                </div>
              )}
            </div>

            {/* Stepper Indicator Badge Capsules Clickeables e Interactivas */}
            <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-3 py-1.5 rounded-full border border-[#E2E8F0] text-xs font-bold">
              <button
                type="button"
                onClick={() => setPasoActivo(1)}
                className={`px-3 py-1 rounded-full flex items-center gap-1 transition ${
                  pasoActivo === 1
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : paso1Concluido
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {paso1Concluido && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                <span>Paso 1: Asistencia</span>
              </button>

              <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />

              <button
                type="button"
                onClick={() => {
                  if (!paso1Concluido) {
                    toast.info("Completa y guarda la asistencia del Paso 1 antes de pasar a cancha.");
                    return;
                  }
                  setPasoActivo(2);
                }}
                className={`px-3 py-1 rounded-full transition ${
                  pasoActivo === 2 ? "bg-[#2563EB] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Paso 2: Cancha
              </button>

              <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />

              <button
                type="button"
                onClick={() => {
                  setPasoActivo(3);
                }}
                className={`px-3 py-1 rounded-full transition ${
                  pasoActivo === 3 ? "bg-[#10B981] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Paso 3: Cierre
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PASO 1: PANTALLA DE INGRESO (ASISTENCIA + WELLNESS UNIFICADOS)   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {pasoActivo === 1 && (
          <div className="max-w-5xl mx-auto space-y-4 pb-24">
            {/* BANNER DE HISTORIAL SOLO LECTURA */}
            {isReadOnly && (
              <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-amber-950 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <Lock className="h-6 w-6 text-amber-600 shrink-0" />
                  <div>
                    <strong className="text-xs sm:text-sm font-extrabold text-amber-900 block">🔒 Historial en Modo Solo Lectura ({fechaSesion})</strong>
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                      Estás consultando una fecha pasada. Todos los botones están deshabilitados para evitar cambios accidentales.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => {
                    setIsHistorialBloqueado(false);
                    toast.success(`🔓 Edición del historial habilitada para ${fechaSesion}.`);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs h-9 px-4 rounded-xl shadow-sm gap-1.5 uppercase tracking-wide shrink-0"
                >
                  <Unlock className="h-4 w-4" /> Habilitar Edición de Historial
                </Button>
              </div>
            )}

            {/* ADVERTENCIA DE DÍA SIN ENTRENAMIENTO PROGRAMADO */}
            {esDiaSinEntrenamiento && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-amber-900 text-xs flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="font-bold">⚠️ Atención: {fechaTextoFormateada} no es un día regular de entrenamiento.</strong>
                  <p className="text-[11px] text-amber-700 font-medium">
                    Puedes tomar asistencia extraordinaria (partido amistoso, reposición o torneo). Si es un error, cambia la fecha arriba.
                  </p>
                </div>
              </div>
            )}

            {/* BITÁCORA Y DICTADO POR VOZ DEL DÍA SI YA EXISTE O FUE GUARDADO */}
            {notasVoz && (
              <div className="bg-indigo-50/90 border border-indigo-200 p-4 rounded-xl text-indigo-950 text-xs shadow-sm space-y-2">
                <div className="flex items-center justify-between font-bold text-indigo-900">
                  <span className="flex items-center gap-2 text-xs uppercase tracking-wide font-extrabold">
                    🎙️ Notas de Cierre & Bitácora del Día (Dictado por Voz)
                  </span>
                  <Badge className="bg-indigo-600 text-white font-bold text-[10px]">Guardado en DB</Badge>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100 text-xs text-slate-800 font-medium whitespace-pre-wrap shadow-2xs">
                  "{notasVoz}"
                </div>
              </div>
            )}

            <div className={`bg-[#2563EB]/10 border border-[#2563EB]/20 p-4 rounded-xl text-[#2563EB] text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm ${isReadOnly ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#2563EB] shrink-0" />
                <span>
                  <strong className="font-bold">Acciones Rápidas del Equipo:</strong> Marca el Wellness del grupo en 1 clic o programa un Test Físico para la plantilla.
                </span>
              </div>

              {/* ACCIONES EN LOTE PARA WELLNESS Y TEST FÍSICO GRUPAL */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isReadOnly}
                  onClick={() => {
                    if (isReadOnly) return;
                    setIsTestMasivo(true);
                    setModalTestSpeed(true);
                  }}
                  className="h-8.5 text-[11px] font-extrabold bg-white border-[#2563EB]/40 text-[#2563EB] hover:bg-[#2563EB]/10 rounded-xl gap-1.5 shadow-sm"
                >
                  <Timer className="h-3.5 w-3.5 text-amber-500" /> 🏃 Aplicar Test al Equipo
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={isReadOnly}
                  onClick={() => {
                    if (isReadOnly) return;
                    setSesionData((prev) => ({
                      ...prev,
                      jugadores: prev.jugadores.map((j) => {
                        if (j.asistencia === "ausente" || j.asistencia === "justificado") {
                          return { ...j, wellnessColor: "ninguno" as any, wellnessDetalle: undefined };
                        }
                        return { ...j, wellnessColor: "verde", wellnessDetalle: undefined };
                      }),
                    }));
                    toast.success("✨ Semáforo Wellness (100% Óptimo) aplicado a los atletas presentes.");
                  }}
                  className="h-8.5 text-[11px] font-extrabold bg-white border-[#2563EB]/40 text-[#2563EB] hover:bg-[#2563EB]/10 rounded-xl gap-1.5 shadow-sm"
                >
                  ✨ Marcar Todos Wellness (100% Óptimo)
                </Button>
              </div>
            </div>

            {/* CONTENEDOR DE PLANTILLA DE JUGADORES PWA READY (MICRO-CARD ESPACIADAS Y ALTERNADAS) */}
            <div className="space-y-3">
              {/* ENCABEZADOS DE COLUMNA PARA PANTALLAS MD+ */}
              <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-white rounded-xl border border-[#E2E8F0] text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider shadow-sm">
                <span>JUGADOR / ATLETA</span>
                <div className="flex items-center gap-12 pr-2">
                  <span>WELLNESS / PRUEBAS</span>
                  <span>MARCACIÓN DE ASISTENCIA</span>
                </div>
              </div>

              {/* LISTA DE ALUMNOS EN MICRO-TARJETAS INDEPENDIENTES CON FONDO CEBRA Y BOTONES ERGONÓMICOS TÁCTILES */}
              {sesionData.jugadores.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] text-center space-y-3 shadow-sm my-4">
                  <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                  <h4 className="font-bold text-sm text-[#0F172A]">No hay jugadores en la lista de asistencia</h4>
                  <p className="text-xs text-[#64748B] max-w-md mx-auto">
                    No se encontraron atletas registrados para la categoría "{sesionData.categoria}". Puedes cargar la plantilla de demostración para iniciar la toma de asistencia.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSesionData((prev) => ({ ...prev, jugadores: JUGADORES_DEMO_U9 }));
                      toast.success("✨ Plantilla de alumnos cargada exitosamente.");
                    }}
                    className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl px-4 py-2"
                  >
                    ✨ Cargar Plantilla Demo (Sub-9)
                  </Button>
                </div>
              ) : (
                sesionData.jugadores.map((j, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={j.id}
                    className={`p-4 rounded-xl border border-[#E2E8F0] transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isEven ? "bg-white" : "bg-[#F8F9FA]"
                    } hover:border-[#2563EB]/40`}
                  >
                    {/* Avatar + Nombre + Indicator Wellness */}
                    <div className="flex items-center gap-3.5">
                      <img src={j.avatar} alt={j.nombre} className="h-12 w-12 rounded-xl object-cover border border-[#E2E8F0] shrink-0 shadow-sm" />
                      <div>
                        <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
                          {j.nombre}
                          <span
                            title={j.wellnessDetalle || "Wellness Óptimo"}
                            className={`h-3 w-3 rounded-full shrink-0 shadow-sm cursor-help ${
                              j.wellnessColor === "verde"
                                ? "bg-[#10B981]"
                                : j.wellnessColor === "amarillo"
                                ? "bg-amber-400 animate-pulse"
                                : "bg-red-500 animate-bounce"
                            }`}
                          />
                        </h3>
                        {j.wellnessDetalle ? (
                          <p className="text-[11px] text-amber-600 font-semibold line-clamp-1">{j.wellnessDetalle}</p>
                        ) : (
                          <p className="text-[11px] text-[#64748B] font-normal">100% Estado Óptimo para entrenar</p>
                        )}
                      </div>
                    </div>

                    {/* ACCIONES BIENESTAR + BOTONES DE MARCACIÓN TÁCTIL INTERRUPTORES (PILLS GRANDES) */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2E8F0]">
                      {/* ACCIONES BIENESTAR + PRUEBAS FÍSICAS INDIVIDUALES */}
                      <div className="flex items-center gap-2">
                        {/* Botón dinámico de Wellness con indicación visual de Semáforo */}
                        <button
                          type="button"
                          disabled={isReadOnly}
                          title="Encuestar estado de Salud / Wellness"
                          onClick={() => {
                            if (isReadOnly) {
                              toast.warning("🔒 Historial bloqueado. Haz clic en 'Habilitar Edición de Historial' arriba para hacer cambios.");
                              return;
                            }
                            setJugadorWellnessSel(j);
                            setWellEstadoSel(j.wellnessColor || ("ninguno" as any));
                            setWellDetalleInput(j.wellnessDetalle || "");
                            setModalCoachWellness(true);
                          }}
                          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 active:scale-95 transition shadow-sm ${
                            isReadOnly ? "opacity-40 cursor-not-allowed" : ""
                          } ${
                            j.asistencia === "ausente" || j.asistencia === "justificado"
                              ? "bg-slate-100 text-slate-400 border-slate-200"
                              : (j.wellnessColor as any) === "ninguno" || !j.wellnessColor
                              ? "bg-white text-slate-600 border-[#E2E8F0] hover:bg-[#F4F5F7]"
                              : j.wellnessColor === "verde"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : j.wellnessColor === "amarillo"
                              ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          <HeartPulse className={`h-4 w-4 shrink-0 ${
                            j.asistencia === "ausente" || j.asistencia === "justificado"
                              ? "text-slate-400"
                              : (j.wellnessColor as any) === "ninguno" || !j.wellnessColor
                              ? "text-slate-400"
                              : j.wellnessColor === "verde"
                              ? "text-emerald-600"
                              : j.wellnessColor === "amarillo"
                              ? "text-amber-600"
                              : "text-red-600"
                          }`} />
                          <span>
                            {j.asistencia === "ausente" || j.asistencia === "justificado"
                              ? "⚪ N/A"
                              : (j.wellnessColor as any) === "ninguno" || !j.wellnessColor
                              ? "🤍 Wellness"
                              : j.wellnessColor === "verde"
                              ? "🟢 Óptimo"
                              : j.wellnessColor === "amarillo"
                              ? "🟡 Fatiga"
                              : "🔴 Alerta"}
                          </span>
                        </button>

                        {/* Botón dinámico de Test Físico con Semáforo según Calificación */}
                        <button
                          type="button"
                          disabled={isReadOnly}
                          title="Registrar Prueba Física / Velocidad"
                          onClick={() => {
                            if (isReadOnly) {
                              toast.warning("🔒 Historial bloqueado. Haz clic en 'Habilitar Edición de Historial' arriba para hacer cambios.");
                              return;
                            }
                            setIsTestMasivo(false);
                            setJugadorTestSel(j.id);
                            setModalTestSpeed(true);
                          }}
                          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 active:scale-95 transition shadow-sm ${
                            isReadOnly ? "opacity-40 cursor-not-allowed" : ""
                          } ${
                            j.asistencia === "ausente" || j.asistencia === "justificado"
                              ? "bg-slate-100 text-slate-400 border-slate-200"
                              : j.testStatus === "excelente"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : j.testStatus === "promedio"
                              ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                              : j.testStatus === "bajo"
                              ? "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                              : "bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F4F5F7]"
                          }`}
                        >
                          <Timer className={`h-4 w-4 shrink-0 ${
                            j.asistencia === "ausente" || j.asistencia === "justificado"
                              ? "text-slate-400"
                              : j.testStatus === "excelente"
                              ? "text-emerald-600"
                              : j.testStatus === "promedio"
                              ? "text-amber-600"
                              : j.testStatus === "bajo"
                              ? "text-red-600"
                              : "text-amber-500"
                          }`} />
                          <span>
                            {j.asistencia === "ausente" || j.asistencia === "justificado"
                              ? "⚪ N/A"
                              : j.tiempoTest
                              ? `${j.testStatus === "excelente" ? "🟢" : j.testStatus === "promedio" ? "🟡" : "🔴"} 🏃 ${j.tiempoTest} seg.`
                              : "+ Test"}
                          </span>
                        </button>
                      </div>

                      {/* 4 BOTONES DE MARCACIÓN TÁCTIL ERGONÓMICOS TIPO PILLS / INTERRUPTORES */}
                      <div className="grid grid-cols-4 gap-1.5 w-full sm:w-auto">
                        {[
                          { key: "presente", label: "P", activeBg: "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/30 font-black" },
                          { key: "tarde", label: "T", activeBg: "bg-amber-500 text-white shadow-md ring-2 ring-amber-500/30 font-black" },
                          { key: "ausente", label: "A", activeBg: "bg-red-600 text-white shadow-md ring-2 ring-red-600/30 font-black" },
                          { key: "justificado", label: "J", activeBg: "bg-[#2563EB] text-white shadow-md ring-2 ring-[#2563EB]/30 font-black" },
                        ].map((btn) => {
                          const isActive = j.asistencia === btn.key;
                          return (
                            <button
                              key={btn.key}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => toggleAsistencia(j.id, btn.key as EstadoAsistencia)}
                              className={`h-11 min-w-[44px] px-3 rounded-xl font-black text-xs flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                                isReadOnly
                                  ? isActive
                                    ? `${btn.activeBg} opacity-40 cursor-not-allowed`
                                    : "bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] opacity-40 cursor-not-allowed"
                                  : isActive
                                  ? `${btn.activeBg} scale-[1.05]`
                                  : "bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] hover:bg-[#E2E8F0] hover:text-[#475569] opacity-70"
                              }`}
                            >
                              <span className="text-xs leading-none font-black">{btn.label}</span>
                              <span className="text-[8px] leading-none opacity-90 mt-0.5 font-bold uppercase">{btn.key.slice(0, 3)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
              )}
            </div>

            {/* STICKY FOOTER PERMANENTE (SIEMPRE VISIBLE EN NAVEGACIÓN Y PWA MÓVIL) */}
            <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/95 border-t border-[#E2E8F0] backdrop-blur-md z-50 shadow-2xl">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <div className="hidden sm:block text-xs text-[#64748B]">
                  <strong className="text-[#0F172A] font-bold">Resumen de Asistencia:</strong>{" "}
                  {sesionData.jugadores.filter((j) => j.asistencia === "presente").length} Presentes ·{" "}
                  {sesionData.jugadores.filter((j) => j.asistencia === "ausente").length} Ausentes
                </div>
                <Button
                  onClick={() => {
                    if (paso1Concluido) {
                      setModalConfirmPaso1(true);
                      toast.info("💡 Este paso ya fue concluido. Selecciona si deseas avanzar al Paso 2 o seguir editando la asistencia.");
                      return;
                    }

                    // Marcar Paso 1 como concluido exitosamente
                    setPaso1Concluido(true);
                    setPasoActivo(2);
                    toast.success("✅ Asistencia registrada por primera vez. ¡Avanzando a Paso 2 (Cancha)!");

                    // Persistir en store local usando el API oficial de RendimientoStore
                    try {
                      const mapaRegistro: Record<string, "P" | "T" | "A" | "J"> = {};
                      (sesionData.jugadores || []).forEach((j) => {
                        const mapEstado: Record<string, "P" | "T" | "A" | "J"> = {
                          presente: "P",
                          tarde: "T",
                          ausente: "A",
                          justificado: "J",
                        };
                        mapaRegistro[j.id] = mapEstado[j.asistencia] || "P";
                      });
                      RendimientoStore.saveAsistencia(sesionData.equipo, fechaSesion, mapaRegistro);
                    } catch (e) {
                      console.warn("Sincro local asistencia:", e);
                    }

                    // 3. Respaldar en Supabase en segundo plano sin bloquear la UI
                    setTimeout(async () => {
                      try {
                        const asistenciasDb = (sesionData.jugadores || []).map((j) => ({
                          id: `asis-db-${Date.now()}-${j.id}`,
                          sesion_id: sesionData.id,
                          jugador_id: j.id,
                          jugador_nombre: j.nombre,
                          estado_asistencia: j.asistencia,
                          wellness_color: j.wellnessColor,
                          wellness_alerta_detalle: j.wellnessDetalle || null,
                          fecha: fechaSesion,
                        }));
                        await supabase.from("asistencia_registros").upsert(asistenciasDb);
                      } catch (e) {
                        console.warn("Resguardo Supabase asistencia opcional:", e);
                      }
                    }, 0);
                  }}
                  className={`w-full sm:w-auto h-12 px-6 font-black text-xs sm:text-sm rounded-xl shadow-md gap-2 uppercase tracking-wide flex-1 sm:flex-initial transition ${
                    paso1Concluido
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
                  <span>{paso1Concluido ? "✓ PASO 1 CONCLUIDO — CONTINUAR A PASO 2" : "✓ GUARDAR ASISTENCIA E INICIAR CALENTAMIENTO"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PASO 2: PANTALLA DE TRABAJO (LOS 3 BLOQUES EN PESTAÑAS TÁCTICAS) */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {pasoActivo === 2 && (
          <div className="max-w-5xl mx-auto space-y-5 pb-24">
            {/* BARRA SUPERIOR DE BLOQUES CON BORDE Y RESALTE VISUAL FUERTE DE ESTADO ACTIVO */}
            <Tabs value={tabBloqueActivo} onValueChange={(val) => handleCambiarBloque(val as any)} className="w-full space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <TabsList className="grid grid-cols-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-auto min-h-[48px] flex-1">
                  <TabsTrigger
                    value="bloque1"
                    className="rounded-xl text-xs font-black py-2 px-2 transition-all data-[state=active]:bg-[#2563EB] data-[state=active]:text-white data-[state=active]:shadow-md border-b-4 border-transparent data-[state=active]:border-emerald-400 truncate"
                  >
                    🔥 Bloque 1<span className="hidden xl:inline">: Calentamiento</span> <span className="opacity-90 font-medium">(15m)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="bloque2"
                    className="rounded-xl text-xs font-black py-2 px-2 transition-all data-[state=active]:bg-[#2563EB] data-[state=active]:text-white data-[state=active]:shadow-md border-b-4 border-transparent data-[state=active]:border-emerald-400 truncate"
                  >
                    ⚽ Bloque 2<span className="hidden xl:inline">: Específico</span> <span className="opacity-90 font-medium">(60m)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="bloque3"
                    className="rounded-xl text-xs font-black py-2 px-2 transition-all data-[state=active]:bg-[#2563EB] data-[state=active]:text-white data-[state=active]:shadow-md border-b-4 border-transparent data-[state=active]:border-emerald-400 truncate"
                  >
                    🧘 Bloque 3<span className="hidden xl:inline">: Calma</span> <span className="opacity-90 font-medium">(15m)</span>
                  </TabsTrigger>
                </TabsList>

                <Button
                  size="sm"
                  type="button"
                  onClick={() => setModalPizarraTactica(true)}
                  className="h-11 px-4 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl gap-2 shadow-md shrink-0 uppercase tracking-wider active:scale-95 transition"
                >
                  <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                  <span>🎨 Abrir Pizarra Táctica</span>
                </Button>
              </div>

              {/* BLOQUE 1: CALENTAMIENTO (FASE INICIAL) */}
              <TabsContent value="bloque1" className="space-y-4">
                <Card className="bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl p-6 space-y-5 shadow-sm">
                  {/* HEADER CON CRONÓMETRO REGRESIVO Y CONTROLES VIVOS DE CAMPO */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Fase Inicial</span>
                      <h3 className="font-black text-lg text-[#0F172A] flex items-center gap-2">
                        <Flame className="h-5 w-5 text-amber-500" /> Rueda de Pases con Control Orientado
                      </h3>
                    </div>

                    {/* CRONÓMETRO DIGITAL DINÁMICO REY DE LA CANCHA */}
                    <div className="bg-[#0F172A] text-white p-2.5 rounded-2xl flex items-center gap-3 border border-slate-700 shadow-md self-stretch sm:self-auto justify-between sm:justify-start">
                      <div className="px-2">
                        <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-widest block">RELOJ CANCHA</span>
                        <span className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                          {formatTiempo(segundosRestantes)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 border-l border-slate-700 pl-2.5">
                        <Button
                          size="sm"
                          onClick={() => setTimerRunning(!timerRunning)}
                          className={`h-9 px-3 rounded-xl font-extrabold text-xs gap-1.5 transition ${
                            timerRunning ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                          }`}
                        >
                          {timerRunning ? <StopCircle className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                          <span>{timerRunning ? "Pausar" : "Iniciar"}</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSegundosRestantes(900)}
                          title="Reiniciar a 15:00"
                          className="h-9 w-9 p-0 text-slate-300 hover:bg-slate-800 rounded-xl"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* PIZARRA TÁCTICA Y CONTENEDOR DE VÍDEO VIVO */}
                  <div className="rounded-2xl bg-[#064E3B] border-2 border-[#059669] p-5 flex flex-col justify-between relative overflow-hidden text-white shadow-md space-y-4">
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 z-10">
                      <span className="text-xs font-black text-emerald-200 uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldHalf className="h-4 w-4 text-emerald-400" /> DISPOSICIÓN DE CONOS Y ESPACIO (15X15M)
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => setModalPizarraTactica(true)}
                          className="h-8 text-[11px] font-black bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-1.5 shadow-md border border-emerald-400/40"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                          <span>🎨 Abrir Pizarra Táctica</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowTacticalCanvas(!showTacticalCanvas)}
                          className="h-8 text-[11px] font-extrabold bg-[#022C22] text-emerald-300 border-[#059669] hover:bg-[#065F46] rounded-xl gap-1.5"
                        >
                          <Tv className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{showTacticalCanvas ? "📐 Ver Disposición Táctica" : "📺 Ver Demo Vídeo Corto para Alumnos"}</span>
                        </Button>
                      </div>
                    </div>

                    {showTacticalCanvas ? (
                      <div className="z-10 bg-black/60 p-6 rounded-xl border border-emerald-500/40 text-center space-y-2 animate-fadeIn">
                        <p className="text-xs font-bold text-emerald-300">▶ Demo de Video Corto Ejecución Táctica (PWA Tablet)</p>
                        <div className="h-28 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 text-slate-400 text-xs font-medium">
                          🎥 [Video 1080p: Ejercicio de Rueda de Pases y Apoyo en 2 toques]
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-4 z-10 py-3">
                        <div className="p-3.5 bg-[#022C22]/90 rounded-xl border border-[#10B981] text-xs font-extrabold shadow-sm flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>8 Jugadores afuera (2 toques obligatorios)</span>
                        </div>
                        <div className="p-3.5 bg-[#78350F]/90 rounded-xl border border-[#F59E0B] text-xs font-extrabold shadow-sm flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                          <span>2 Jugadores adentro (Presión orientada)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-[#0F172A]">
                    <p className="font-black text-[#0F172A] text-xs uppercase tracking-wider">INSTRUCCIONES CLAVE DE LA SESIÓN:</p>
                    <ul className="list-disc list-inside space-y-1.5 text-[#64748B] font-semibold leading-relaxed">
                      <li>Pase a ras de césped con borde interno obligatorio.</li>
                      <li>Movilidad constante de apoyos laterales antes de recibir el balón.</li>
                      <li>Intensidad: Baja - Media progresiva.</li>
                    </ul>
                  </div>
                </Card>
              </TabsContent>

              {/* BLOQUE 2: TRABAJO ESPECÍFICO */}
              <TabsContent value="bloque2" className="space-y-4">
                <Card className="bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl p-6 space-y-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                    <div>
                      <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">OBJETIVO CENTRAL SEMANAL</span>
                      <h3 className="font-black text-base text-[#0F172A]">{sesionData.objetivo}</h3>
                    </div>

                    {/* CRONÓMETRO REGRESIVO BLOQUE 2 (60 MINS) */}
                    <div className="bg-[#0F172A] text-white p-2.5 rounded-2xl flex items-center gap-3 border border-slate-700 shadow-md">
                      <div className="px-2">
                        <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-widest block">TIEMPO BLOQUE</span>
                        <span className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                          {formatTiempo(segundosRestantes)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setTimerRunning(!timerRunning)}
                        className={`h-9 px-3 rounded-xl font-extrabold text-xs gap-1.5 ${
                          timerRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-500"
                        }`}
                      >
                        {timerRunning ? <StopCircle className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                        <span>{timerRunning ? "Pausar" : "Iniciar"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* SECCIÓN INTEGRADA DE PRUEBAS FÍSICAS */}
                  <div className="bg-[#2563EB]/10 border border-[#2563EB]/20 p-4.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-[#0F172A]">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-6 w-6 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-[#0F172A] block">📅 HOY CORRESPONDE EVALUACIÓN: Test de Velocidad (20m)</span>
                        <span className="text-[11px] text-[#64748B]">Toma los tiempos de los niños en este instante sin pausar la clase.</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setIsTestMasivo(true);
                        setModalTestSpeed(true);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-md active:scale-95 transition"
                    >
                      <Timer className="h-4 w-4" /> ⏱️ Tomar Test de Velocidad
                    </Button>
                  </div>

                  {/* CIRCUITO PRINCIPAL CON GRAFICO TÁCTICO VERDE Y BOTÓN DE VÍDEO DEMO */}
                  <div className="rounded-2xl bg-[#064E3B] border-2 border-[#059669] p-5 flex flex-col justify-between relative overflow-hidden text-white shadow-md space-y-4">
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 z-10">
                      <div>
                        <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest block">CIRCUITO 1: RUEDA DE PASES EN ROMBO Y REMATE</span>
                        <p className="text-xs text-emerald-100 font-semibold mt-0.5">
                          Línea de 4 apoyos con pared corta y centro al segundo palo para definición al marco pequeño.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => setModalPizarraTactica(true)}
                          className="h-8.5 text-[11px] font-black bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-1.5 shadow-md border border-emerald-400/40"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                          <span>🎨 Abrir Pizarra Táctica</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowTacticalCanvas(!showTacticalCanvas)}
                          className="h-8.5 text-[11px] font-extrabold bg-[#022C22] text-emerald-300 border-[#059669] hover:bg-[#065F46] rounded-xl gap-1.5 shrink-0"
                        >
                          <Tv className="h-4 w-4 text-emerald-400" />
                          <span>{showTacticalCanvas ? "📐 Ver Gráfico Táctico Cancha" : "📺 Ver Demo Video Corto Circuito"}</span>
                        </Button>
                      </div>
                    </div>

                    {showTacticalCanvas ? (
                      <div className="z-10 bg-black/60 p-5 rounded-xl border border-emerald-500/40 text-center space-y-2 animate-fadeIn">
                        <p className="text-xs font-bold text-emerald-300">▶ Demo de Video 1080p: Circuito Rombo de Pases y Remate (PWA Tablet)</p>
                        <div className="h-32 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 text-slate-400 text-xs font-medium">
                          🎥 [Video Reproductor: Rueda de Pases en Rombo a 2 toques con definición]
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-center gap-4 z-10 py-2">
                        <div className="p-3 bg-[#022C22]/90 rounded-xl border border-[#10B981] text-xs font-extrabold shadow-sm flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>4 Jugadores en Vértices (Pases Continuos)</span>
                        </div>
                        <div className="p-3 bg-[#78350F]/90 rounded-xl border border-[#F59E0B] text-xs font-extrabold shadow-sm flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                          <span>2 Porteros / Marcos Pequeños (Remate)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              {/* BLOQUE 3: CHARLA TÉCNICA Y CALMA */}
              <TabsContent value="bloque3" className="space-y-4">
                <Card className="bg-white border border-[#E2E8F0] text-[#0F172A] rounded-2xl p-6 space-y-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                    <h3 className="font-black text-base text-[#2563EB] flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-[#2563EB]" /> FEEDBACK PEDAGÓGICO & VUELTA A LA CALMA
                    </h3>

                    {/* CRONÓMETRO REGRESIVO BLOQUE 3 (15 MINS) */}
                    <div className="bg-[#0F172A] text-white p-2.5 rounded-2xl flex items-center gap-3 border border-slate-700 shadow-md">
                      <div className="px-2">
                        <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-widest block">VUELTA A LA CALMA</span>
                        <span className="text-xl font-black font-mono text-emerald-400 tracking-tight">
                          {formatTiempo(segundosRestantes)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setTimerRunning(!timerRunning)}
                        className={`h-9 px-3 rounded-xl font-extrabold text-xs gap-1.5 ${
                          timerRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-500"
                        }`}
                      >
                        {timerRunning ? <StopCircle className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                        <span>{timerRunning ? "Pausar" : "Iniciar"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* PREGUNTAS CLAVE DINÁMICAS DESDE EL PLANEAMIENTO METODOLÓGICO */}
                  {sesionData.preguntasPedagogicas && sesionData.preguntasPedagogicas.length > 0 ? (
                    <div className="space-y-3 text-xs">
                      <p className="font-black text-[#0F172A] uppercase tracking-wider">
                        PREGUNTAS CLAVE DEL PLANEAMIENTO METODOLÓGICO ({sesionData.categoria}):
                      </p>
                      <div className="space-y-3">
                        {sesionData.preguntasPedagogicas.map((pregunta, idx) => (
                          <div key={idx} className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E2E8F0] space-y-3 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex items-start gap-2 text-[#0F172A] flex-1">
                                <span className="font-extrabold text-amber-500 shrink-0">❓ {idx + 1}.</span>
                                <span className="font-bold text-xs">{pregunta}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowNotaField1(!showNotaField1)}
                                className="h-8 text-[11px] font-extrabold bg-white border-[#E2E8F0] text-[#2563EB] hover:bg-[#2563EB]/10 rounded-xl gap-1 shrink-0"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>📝 Agregar Nota de Respuesta</span>
                              </Button>
                            </div>

                            {showNotaField1 && (
                              <div className="space-y-2 pt-1 animate-fadeIn">
                                <div className="relative">
                                  <Input
                                    value={notaPregunta1}
                                    onChange={(e) => setNotaPregunta1(e.target.value)}
                                    placeholder="Ej. El grupo comprendió la regla del desmarque de apoyo..."
                                    className="h-10 text-xs bg-white rounded-xl border-[#E2E8F0] pr-10 text-[#0F172A]"
                                  />
                                  <button
                                    type="button"
                                    onClick={startSpeechRecognition}
                                    title="Dictar nota por voz"
                                    className="absolute right-2 top-2 p-1 text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition"
                                  >
                                    <Mic className={`h-4 w-4 ${isRecording ? "text-red-500 animate-bounce" : ""}`} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#E2E8F0] text-xs text-[#64748B] flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-[#2563EB] shrink-0" />
                      <span>Sin preguntas metodológicas registradas para este plan. Puedes ingresar observaciones generales en el reporte final.</span>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>

            {/* BOTÓN INFERIOR DE ACCIÓN DINÁMICO (STICKY FOOTER SEGÚN BLOQUE ACTIVO) */}
            <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/95 border-t border-[#E2E8F0] backdrop-blur-md z-50 shadow-2xl">
              <div className="max-w-4xl mx-auto">
                {tabBloqueActivo === "bloque1" && (
                  <Button
                    onClick={() => handleCambiarBloque("bloque2")}
                    className="w-full h-12 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-black text-xs sm:text-sm rounded-xl shadow-md gap-2 uppercase tracking-wide"
                  >
                    ⏩ TERMINAR CALENTAMIENTO E INICIAR TRABAJO ESPECÍFICO
                  </Button>
                )}

                {tabBloqueActivo === "bloque2" && (
                  <Button
                    onClick={() => handleCambiarBloque("bloque3")}
                    className="w-full h-12 bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-black text-xs sm:text-sm rounded-xl shadow-md gap-2 uppercase tracking-wide"
                  >
                    ⏩ TERMINAR TRABAJO ESPECÍFICO E INICIAR VUELTA A LA CALMA
                  </Button>
                )}

                {tabBloqueActivo === "bloque3" && (
                  <Button
                    onClick={() => {
                      setPasoActivo(3);
                      setModalCierreSesion(true);
                      toast.success("🏆 ¡Entrenamiento físico finalizado! Ingresando al Paso 3 (Cierre & Reporte).");
                    }}
                    className="w-full h-12 bg-emerald-600 text-white hover:bg-emerald-500 font-black text-xs sm:text-sm rounded-xl shadow-md gap-2 uppercase tracking-wide animate-pulse"
                  >
                    🏁 FINALIZAR ENTRENAMIENTO E IR AL REPORTE DE CIERRE
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PASO 3: PANTALLA DE CIERRE & REPORTE FINAL DE LA SESIÓN          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {pasoActivo === 3 && (
          <div className="max-w-5xl mx-auto space-y-6 pb-24">
            {/* Header del Reporte */}
            <Card className="bg-white border-[#E2E8F0] shadow-sm p-6 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold text-[10px] uppercase">
                      ✓ Sesión Finalizada & Guardada en DB
                    </Badge>
                    {isFechaRetroactiva && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-extrabold text-[10px] uppercase">
                        Pase Retroactivo
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-[#0F172A] mt-1 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-[#2563EB]" />
                    Reporte Final de Cancha: {sesionData.equipo}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {fechaTextoFormateada} · Categoría {sesionData.categoria} · Sede Central
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setModoSesion("normal");
                      setPasoActivo(1);
                    }}
                    className="h-10 text-xs font-bold border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8F9FA] rounded-xl gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Volver a Sesiones
                  </Button>
                  <Button
                    onClick={handleGuardarSesionFinal}
                    className="h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-sm gap-2 uppercase tracking-wide"
                  >
                    <CheckCircle2 className="h-4 w-4 text-white" /> 💾 Guardar Cambios del Reporte
                  </Button>
                </div>
              </div>

              {/* Tarjetas de Resumen Numérico de Asistencia */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Presentes</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {sesionData.jugadores.filter((j) => j.asistencia === "presente").length}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">Tarde</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">
                    {sesionData.jugadores.filter((j) => j.asistencia === "tarde").length}
                  </p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-xs font-extrabold text-red-800 uppercase tracking-wider">Ausentes</p>
                  <p className="text-2xl font-black text-red-700 mt-1">
                    {sesionData.jugadores.filter((j) => j.asistencia === "ausente").length}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <p className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">Justificados</p>
                  <p className="text-2xl font-black text-blue-700 mt-1">
                    {sesionData.jugadores.filter((j) => j.asistencia === "justificado").length}
                  </p>
                </div>
              </div>
            </Card>

            {/* SECCIÓN 1: NOTAS DEL DÍA & DICTADO POR VOZ */}
            <Card className="bg-white border-[#E2E8F0] shadow-sm p-6 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-black text-[#0F172A] flex items-center gap-2">
                  <Mic className="h-5 w-5 text-[#2563EB]" />
                  Notas del Día & Bitácora del Entrenador (Dictado por Voz o Teclado):
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startSpeechRecognition}
                  className={`h-8.5 text-xs font-bold gap-2 rounded-xl transition ${
                    isRecording ? "bg-red-500 text-white animate-pulse" : "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30 hover:bg-[#2563EB]/20"
                  }`}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isRecording ? "Detener Dictado" : "🎙️ Dictar por Voz"}
                </Button>
              </div>

              <Textarea
                value={notasVoz}
                onChange={(e) => setNotasVoz(e.target.value)}
                placeholder="Escribe o dicta las observaciones tácticas, actitudinales o notas destacadas del entrenamiento..."
                rows={3}
                className="bg-[#F8F9FA] text-xs font-medium border-[#E2E8F0] rounded-xl text-[#0F172A] focus:bg-white p-3"
              />

              <div className="pt-2 space-y-1.5 border-t border-[#E2E8F0]">
                <Label className="text-xs font-bold text-[#0F172A]">Para la Próxima Clase (Temas a Recordar / Reforzar):</Label>
                <Textarea
                  value={proximaClase}
                  onChange={(e) => setProximaClase(e.target.value)}
                  placeholder="Ej. Continuar con la práctica de juego rápido y pases cortos."
                  rows={2}
                  className="bg-[#F8F9FA] text-xs font-medium border-[#E2E8F0] rounded-xl text-[#0F172A] focus:bg-white p-3"
                />
              </div>
            </Card>

            {/* SECCIÓN 2: REGISTRO DE LESIONES E INCIDENCIAS */}
            <Card className="bg-white border-[#E2E8F0] shadow-sm p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h3 className="font-bold text-sm text-[#0F172A]">Registro de Lesiones o Incidencias Médicas</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="lesion-switch-p3" className="text-xs font-bold text-[#64748B] cursor-pointer">
                    ¿Ocurrió alguna lesión en la práctica?
                  </Label>
                  <Switch
                    id="lesion-switch-p3"
                    checked={hayLesion}
                    onCheckedChange={setHayLesion}
                  />
                </div>
              </div>

              {hayLesion && (
                <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-[#0F172A]">Seleccionar Jugador Lesionado:</Label>
                      <Select value={jugadorLesionadoId} onValueChange={setJugadorLesionadoId}>
                        <SelectTrigger className="bg-white text-xs h-10 border-[#E2E8F0] rounded-xl">
                          <SelectValue placeholder="Seleccionar jugador..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sesionData.jugadores.map((j) => (
                            <SelectItem key={j.id} value={j.id} className="text-xs font-medium">
                              {j.nombre} ({j.categoria})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-[#0F172A]">Nivel de Gravedad:</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "leve", label: "Leve (1-3 días)" },
                          { key: "moderada", label: "Moderada (1-2 sem)" },
                          { key: "grave", label: "Grave (+3 sem)" },
                        ].map((g) => (
                          <button
                            key={g.key}
                            type="button"
                            onClick={() => setGravedadLesion(g.key as any)}
                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                              gravedadLesion === g.key
                                ? "bg-red-600 text-white border-red-600 shadow-sm"
                                : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8F9FA]"
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Descripción de la Lesión:</Label>
                    <Input
                      value={descripcionLesion}
                      onChange={(e) => setDescripcionLesion(e.target.value)}
                      placeholder="Ej. Torcedura leve en tobillo derecho al disputar balón."
                      className="bg-white text-xs h-10 border-[#E2E8F0] rounded-xl"
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* SECCIÓN 3: TABLA DETALLADA DE ASISTENCIA Y WELLNESS */}
            <Card className="bg-white border-[#E2E8F0] shadow-sm p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-[#0F172A] uppercase tracking-wider">
                Desglose Individual de la Plantilla ({sesionData.jugadores.length} Atletas)
              </h3>

              <div className="divide-y divide-[#E2E8F0]">
                {sesionData.jugadores.map((j) => (
                  <div key={j.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={j.avatar} alt={j.nombre} className="h-10 w-10 rounded-xl object-cover border border-[#E2E8F0]" />
                      <div>
                        <p className="font-bold text-xs text-[#0F172A]">{j.nombre}</p>
                        <p className="text-[11px] text-[#64748B]">
                          Wellness: {j.wellnessColor === "verde" ? "🟢 Óptimo" : j.wellnessColor === "amarillo" ? "🟡 Fatiga" : "🔴 Alerta"}
                          {j.wellnessDetalle ? ` (${j.wellnessDetalle})` : ""}
                        </p>
                      </div>
                    </div>

                    <Badge
                      className={`font-black text-xs px-3 py-1 uppercase rounded-xl ${
                        j.asistencia === "presente"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : j.asistencia === "tarde"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : j.asistencia === "ausente"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : "bg-blue-100 text-blue-800 border-blue-300"
                      }`}
                    >
                      {j.asistencia}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* MODAL ADVERTENCIA: PASO 1 YA CONCLUIDO */}
        <Dialog open={modalConfirmPaso1} onOpenChange={setModalConfirmPaso1}>
          <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white text-[#0F172A] border border-[#E2E8F0] p-6 shadow-xl space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-black flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" /> Paso 1: Asistencia Concluida
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B] pt-1">
                La asistencia de este entrenamiento ya fue registrada e ingresada con éxito a la Base de Datos.
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-semibold space-y-1">
              <p className="font-bold text-emerald-950">✓ Estado: Asistencia Registrada</p>
              <p className="text-[11px] text-emerald-800">
                Puedes avanzar directamente al <strong className="font-bold">Paso 2 (Cancha)</strong> o guardar las modificaciones aplicadas.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalConfirmPaso1(false);
                  toast.info("Puedes realizar cambios adicionales en la asistencia.");
                }}
                className="h-10 border-[#E2E8F0] text-[#64748B] hover:bg-[#F8F9FA] text-xs font-bold rounded-xl"
              >
                Seguir Editando
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setModalConfirmPaso1(false);
                  setPasoActivo(2);
                  toast.success("Avanzando al Paso 2: Tiempo de Cancha.");
                }}
                className="h-10 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-xs rounded-xl px-4 shadow-sm gap-1.5"
              >
                <span>Avanzar al Paso 2 (Cancha)</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MODAL PASO 3: CIERRE DE SESIÓN & REPORTE DE INCIDENCIAS          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <Dialog open={modalCierreSesion} onOpenChange={setModalCierreSesion}>
          <DialogContent className="sm:max-w-[550px] rounded-xl bg-white text-[#0F172A] border border-[#E2E8F0] p-6 shadow-lg space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-[#0F172A]">
                <CheckCircle2 className="h-5 w-5 text-[#10B981]" /> CIERRE DE SESIÓN & REPORTE FINAL
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Guarda la bitácora del día y notifica cualquier novedad médica a la administración.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* CUADRO DE NOTAS CON DICTADO DE VOZ (VOICE-TO-TEXT) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-[#0F172A]">Notas del Día (Dictado por Voz o Teclado):</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startSpeechRecognition("notasVoz")}
                    className={`h-7 text-[11px] font-semibold rounded-lg border-[#E2E8F0] gap-1.5 ${
                      isRecording && activeSpeechTarget === "notasVoz" ? "bg-red-600 text-white animate-pulse" : "text-[#2563EB] bg-[#2563EB]/10 hover:bg-[#2563EB]/20 border-[#2563EB]/20"
                    }`}
                  >
                    {isRecording && activeSpeechTarget === "notasVoz" ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    {isRecording && activeSpeechTarget === "notasVoz" ? "Grabando..." : "🎙️ Dictar por Voz"}
                  </Button>
                </div>
                <Textarea
                  rows={3}
                  value={notasVoz}
                  onChange={(e) => setNotasVoz(e.target.value)}
                  placeholder="Ej. Buena actitud del grupo. Trabajar más la precisión del pase corto en la próxima sesión."
                  className="bg-[#F8F9FA] border-[#E2E8F0] text-xs rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* PARA LA PRÓXIMA CLASE */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-[#0F172A]">Para la Próxima Clase (Temas a Recordar / Reforzar):</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => startSpeechRecognition("proximaClase")}
                    className={`h-7 text-[11px] font-semibold rounded-lg border-[#E2E8F0] gap-1.5 ${
                      isRecording && activeSpeechTarget === "proximaClase" ? "bg-red-600 text-white animate-pulse" : "text-[#2563EB] bg-[#2563EB]/10 hover:bg-[#2563EB]/20 border-[#2563EB]/20"
                    }`}
                  >
                    {isRecording && activeSpeechTarget === "proximaClase" ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    {isRecording && activeSpeechTarget === "proximaClase" ? "Grabando..." : "🎙️ Dictar por Voz"}
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={proximaClase}
                  onChange={(e) => setProximaClase(e.target.value)}
                  placeholder="Ej. Continuar con la práctica de juego rápido y pases cortos."
                  className="bg-[#F8F9FA] border-[#E2E8F0] text-xs rounded-xl text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* MÓDULO DE REPORTE DE LESIONES E INCIDENCIAS */}
              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-[#0F172A]">¿Ocurrió alguna lesión durante la práctica?</Label>
                    <p className="text-[11px] text-[#64748B]">Notifica automáticamente al Área de Administración y Seguro Deportivo.</p>
                  </div>
                  <Switch checked={hayLesion} onCheckedChange={setHayLesion} />
                </div>

                {hayLesion && (
                  <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#64748B]">Seleccionar Jugador Lesionado:</Label>
                      <Select value={jugadorLesionadoId} onValueChange={setJugadorLesionadoId}>
                        <SelectTrigger className="h-9 text-xs bg-white rounded-xl border-[#E2E8F0] text-[#0F172A]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sesionData.jugadores.map((j) => (
                            <SelectItem key={j.id} value={j.id}>{j.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#64748B]">Gravedad de la Lesión:</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "leve", label: "Leve (Golpe)" },
                          { key: "moderada", label: "Moderada (Reposo)" },
                          { key: "grave", label: "Grave (Centro Médico)" },
                        ].map((g) => (
                          <button
                            key={g.key}
                            type="button"
                            onClick={() => setGravedadLesion(g.key as any)}
                            className={`py-1.5 rounded-xl text-[11px] font-semibold border transition ${
                              gravedadLesion === g.key
                                ? "bg-red-600 text-white border-red-600 shadow-sm"
                                : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8F9FA]"
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#64748B]">Detalle / Descripción de la Lesión:</Label>
                      <Input
                        value={descripcionLesion}
                        onChange={(e) => setDescripcionLesion(e.target.value)}
                        placeholder="Ej. Torcedura leve en tobillo derecho al disputar balón."
                        className="h-9 text-xs bg-white rounded-xl border-[#E2E8F0] text-[#0F172A]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* BOTÓN FINAL DE GUARDADO AZUL REY CORPORATIVO (#2563EB) */}
              <Button
                onClick={handleGuardarSesionFinal}
                className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl shadow-sm gap-2 uppercase tracking-wide"
              >
                <CheckCircle2 className="h-4 w-4 text-white" /> 💾 GUARDAR REPORTE Y FINALIZAR SESIÓN
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL REGISTRAR PRUEBA FÍSICA */}
        <Dialog open={modalTestSpeed} onOpenChange={setModalTestSpeed}>
          <DialogContent className="sm:max-w-[460px] rounded-xl bg-white text-[#0F172A] border border-[#E2E8F0] p-6 shadow-lg space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-[#0F172A]">
                <Trophy className="h-5 w-5 text-amber-500" /> Registrar Prueba Física
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Ingresa el desempeño físico del jugador para el día de hoy.
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const jugadorObj = sesionData.jugadores.find((j) => j.id === jugadorTestSel) || sesionData.jugadores[0];
              return (
                <div className="space-y-4 pt-1">
                  {/* CARD SUPERIOR CON FOTO Y NOMBRE (INDIVIDUAL O PLANTILLA COMPLETA) */}
                  {isTestMasivo ? (
                    <div className="p-3.5 bg-[#2563EB]/10 rounded-xl border border-[#2563EB]/20 flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#0F172A]">Plantilla Completa del Equipo</h4>
                        <p className="text-[11px] text-[#2563EB] uppercase font-bold">
                          {sesionData.jugadores.length} ATLETAS · {sesionData.categoria} ({sesionData.equipo})
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex items-center gap-3">
                      <img src={jugadorObj?.avatar} alt={jugadorObj?.nombre} className="h-12 w-12 rounded-xl object-cover border border-[#E2E8F0] shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-[#0F172A]">{jugadorObj?.nombre}</h4>
                        <p className="text-[11px] text-[#64748B] uppercase font-semibold">
                          JUGADOR OFICIAL · {jugadorObj?.categoria || sesionData.categoria}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TIPO DE PRUEBA */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Tipo de Prueba</Label>
                    <Select value={testType} onValueChange={setTestType}>
                      <SelectTrigger className="h-10 text-xs bg-white rounded-xl border-[#E2E8F0] text-[#0F172A]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const DEFAULT_CATALOG = ["Sprint 30m", "Yo-Yo Test", "Course Navette", "Cooper Test", "Salto Vertical CMJ", "Agilidad T-Test"];
                          const saved = typeof window !== "undefined" ? localStorage.getItem("deportivos_catalogo_pruebas") : null;
                          const list: string[] = saved ? JSON.parse(saved) : DEFAULT_CATALOG;
                          return list.map((testName) => (
                            <SelectItem key={testName} value={testName}>🏃 {testName}</SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* RESULTADO DE LA MARCA CON BADGE DE UNIDAD */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Resultado de la Marca</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        value={tiempoTestInput}
                        onChange={(e) => setTiempoTestInput(e.target.value)}
                        placeholder="Ej. 4.50"
                        className="h-10 text-sm font-bold bg-white rounded-xl border-[#E2E8F0] pr-20 text-[#10B981]"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        SEGUNDOS
                      </span>
                    </div>
                  </div>

                  {/* NOTAS / OBSERVACIONES */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-[#0F172A]">Notas / Observaciones</Label>
                    <Input
                      value={testNotes}
                      onChange={(e) => setTestNotes(e.target.value)}
                      placeholder="Ej. Excelente esfuerzo final..."
                      className="h-10 text-xs bg-white rounded-xl border-[#E2E8F0] text-[#0F172A]"
                    />
                  </div>

                  {/* BOTONES FOOTER */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalTestSpeed(false)}
                      className="h-9 border-[#E2E8F0] text-[#64748B] hover:bg-[#F8F9FA] text-xs rounded-xl"
                    >
                      Cancelar
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const todayStr = fechaSesion || new Date().toISOString().split("T")[0];
                        const val = parseFloat(tiempoTestInput) || 0;
                        const status: "excelente" | "promedio" | "bajo" = val < 4.0 ? "excelente" : val <= 4.5 ? "promedio" : "bajo";
                        const formattedVal = `${val}s`;
                        const calif = status === "excelente" ? "Excelente" : status === "promedio" ? "Promedio" : "Bajo";
                        const activeOrg = RendimientoStore.getActiveOrganizacionId() || "00000000-0000-0000-0000-000000000000";

                        setSesionData((prev) => ({
                          ...prev,
                          jugadores: prev.jugadores.map((j) => ({
                            ...j,
                            tiempoTest: `${val}`,
                            testValor: formattedVal,
                            testStatus: status,
                            testNombre: testType,
                          })),
                        }));

                        // Guardar inmediatamente en RendimientoStore para cada jugador
                        sesionData.jugadores.forEach((j) => {
                          RendimientoStore.addTest({
                            jugadorId: j.id,
                            jugador: j.nombre,
                            fecha: todayStr,
                            tipo: "Velocidad",
                            nombreTest: testType,
                            resultado: formattedVal,
                            progreso: 5.0,
                            estancado: false,
                          });

                          RendimientoStore.addEvaluacion({
                            jugadorId: j.id,
                            jugadorNombre: j.nombre,
                            fecha: todayStr,
                            equipo: sesionData.equipo,
                            prueba: testType,
                            valor: val,
                            unidad: "s",
                            calificacion: calif,
                            notas: testNotes || "Prueba masiva de equipo",
                          });
                        });

                        const records = sesionData.jugadores.map((j) => ({
                          id: `test-${Date.now()}-${j.id}`,
                          jugador_id: j.id,
                          jugador: j.nombre,
                          fecha: todayStr,
                          test_id: testType.toLowerCase().replace(/\s+/g, "-"),
                          test: testType,
                          resultado: val,
                          unidad: "segundos",
                          organizacion_id: activeOrg,
                        }));

                        try {
                          await supabase.from("resultados_pruebas_fisicas").upsert(records);
                        } catch (e) {
                          console.warn("Inserción remota test opcional:", e);
                        }

                        toast.success(`🏃 ¡Test (${testType}: ${formattedVal}) registrado para los ${sesionData.jugadores.length} atletas!`);
                        setModalTestSpeed(false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-9 px-3 shadow-sm gap-1"
                    >
                      ✨ Guardar en Todo el Equipo
                    </Button>

                    <Button
                      type="button"
                      onClick={async () => {
                        if (!jugadorObj) return;
                        const todayStr = fechaSesion || new Date().toISOString().split("T")[0];
                        const val = parseFloat(tiempoTestInput) || 0;
                        const status: "excelente" | "promedio" | "bajo" = val < 4.0 ? "excelente" : val <= 4.5 ? "promedio" : "bajo";
                        const formattedVal = `${val}s`;
                        const calif = status === "excelente" ? "Excelente" : status === "promedio" ? "Promedio" : "Bajo";
                        const activeOrg = RendimientoStore.getActiveOrganizacionId() || "00000000-0000-0000-0000-000000000000";

                        setSesionData((prev) => ({
                          ...prev,
                          jugadores: prev.jugadores.map((j) =>
                            j.id === jugadorObj.id
                              ? { ...j, tiempoTest: `${val}`, testValor: formattedVal, testStatus: status, testNombre: testType }
                              : j
                          ),
                        }));

                        RendimientoStore.addTest({
                          jugadorId: jugadorObj.id,
                          jugador: jugadorObj.nombre,
                          fecha: todayStr,
                          tipo: "Velocidad",
                          nombreTest: testType,
                          resultado: formattedVal,
                          progreso: 5.0,
                          estancado: false,
                        });

                        RendimientoStore.addEvaluacion({
                          jugadorId: jugadorObj.id,
                          jugadorNombre: jugadorObj.nombre,
                          fecha: todayStr,
                          equipo: sesionData.equipo,
                          prueba: testType,
                          valor: val,
                          unidad: "s",
                          calificacion: calif,
                          notas: testNotes || "Prueba registrada en cancha",
                        });

                        try {
                          await supabase.from("resultados_pruebas_fisicas").upsert([{
                            id: `test-${Date.now()}`,
                            jugador_id: jugadorObj.id,
                            jugador: jugadorObj.nombre,
                            fecha: todayStr,
                            test_id: testType.toLowerCase().replace(/\s+/g, "-"),
                            test: testType,
                            resultado: val,
                            unidad: "segundos",
                            organizacion_id: activeOrg,
                          }]);
                        } catch (e) {
                          console.warn("Inserción remota test opcional:", e);
                        }

                        toast.success(`Prueba física (${testType}: ${formattedVal}) registrada para ${jugadorObj.nombre}.`);
                        setModalTestSpeed(false);
                      }}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs rounded-xl h-9 px-3 shadow-sm"
                    >
                      Guardar Solo Atleta
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* MODAL CANCHA WELLNESS RÁPIDO PARA EL ENTRENADOR */}
        <Dialog open={modalCoachWellness} onOpenChange={setModalCoachWellness}>
          <DialogContent className="sm:max-w-[450px] rounded-xl bg-white text-[#0F172A] border border-[#E2E8F0] p-6 shadow-lg space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-pink-500">
                <HeartPulse className="h-5 w-5" /> MARCACIÓN RÁPIDA DE WELLNESS EN CANCHA
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Selecciona el estado físico del alumno {jugadorWellnessSel?.nombre} en 1 solo toque.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: "verde", title: "🟢 100% Óptimo (Sin fatiga ni dolores)", desc: "Listo para máxima intensidad" },
                  { key: "amarillo", title: "🟡 Fatiga Ligera / Sueño Incompleto", desc: "Cansancio o molestia menor" },
                  { key: "rojo", title: "🔴 Alerta Médica / Dolor Muscular Activo", desc: "Requiere reposo o evaluación médica" },
                  { key: "ninguno", title: "⚪ Sin Wellness / N/A (Desmarcar Estado)", desc: "Sin evaluación de bienestar (ej: atleta ausente)" },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setWellEstadoSel(st.key as WellnessColor)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      wellEstadoSel === st.key
                        ? "border-[#2563EB] bg-[#2563EB]/10 ring-2 ring-[#2563EB]/20"
                        : "border-[#E2E8F0] bg-[#F8F9FA] hover:bg-white"
                    }`}
                  >
                    <div className="font-bold text-xs text-[#0F172A]">{st.title}</div>
                    <div className="text-[11px] text-[#64748B]">{st.desc}</div>
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-300">Nota / Comentario del Profe (Opcional):</Label>
                <Input
                  value={wellDetalleInput}
                  onChange={(e) => setWellDetalleInput(e.target.value)}
                  placeholder="Ej. Dolor leve en rodilla derecha."
                  className="h-9 text-xs bg-slate-950 rounded-xl border-slate-800"
                />
              </div>

              <Button
                onClick={() => {
                  if (jugadorWellnessSel) {
                    setSesionData((prev) => ({
                      ...prev,
                      jugadores: prev.jugadores.map((item) =>
                        item.id === jugadorWellnessSel.id
                          ? { ...item, wellnessColor: wellEstadoSel, wellnessDetalle: wellDetalleInput || undefined }
                          : item
                      ),
                    }));
                    // Persist to Supabase DB wellness table
                    const todayStr = new Date().toISOString().split("T")[0];
                    supabase.from("wellness").upsert({
                      jugador_id: jugadorWellnessSel.id,
                      fecha: todayStr,
                      fatiga: wellEstadoSel === "rojo" ? 4 : wellEstadoSel === "amarillo" ? 3 : 1,
                      dolor_muscular: wellEstadoSel === "rojo" ? 4 : 1,
                      sueño_calidad: wellEstadoSel === "rojo" ? 2 : 4,
                      notas: wellDetalleInput || "Wellness asignado por entrenador en cancha.",
                    }).then();
                  }
                  toast.success("Estado Wellness guardado exitosamente.");
                  setModalCoachWellness(false);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl h-9"
              >
                Guardar Estado Wellness
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL PANTALLA COMPLETA INMERSIVA DE PIZARRA TÁCTICA BCOACH EN CANCHA */}
        {modalPizarraTactica && (
          <div className="fixed inset-0 z-[99999] bg-[#183b18] text-white flex flex-col p-0 overflow-hidden animate-fadeIn">
            {/* CONTENEDOR 100% PANTALLA COMPLETA EDGE-TO-EDGE DE LA PIZARRA */}
            <div className="flex-1 w-full h-full overflow-hidden min-h-0">
              <CanchaBCoachBoard
                teamName={sesionData.equipo}
                category={sesionData.categoria}
                onClose={() => setModalPizarraTactica(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  //  MODO NORMAL (PANEL GENERAL DE ENTRENAMIENTOS)
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <CoachOsBanner />

      {/* TOP HEADER WITH BIG BUTTON TO LAUNCH CANCHA MODE */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
        <div className="space-y-1.5 flex-1 min-w-0">
          <Badge className="bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider">
            MODO CAMPO DE JUEGO (ENTRENADOR)
          </Badge>
          <h1 className="text-lg sm:text-2xl font-black flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-indigo-400 shrink-0" />
            <span className="truncate">Planificador & Flujo de Sesión Activa</span>
          </h1>
          <p className="text-xs text-slate-300">
            Pasa lista en 1 clic con indicadores Wellness y guía los 3 bloques tácticos de la clase sin enredos.
          </p>
        </div>

        <Button
          onClick={() => {
            setModoSesion("activa");
            setPasoActivo(1);
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3 px-5 h-auto rounded-2xl shadow-xl gap-2 tracking-wider uppercase shrink-0"
        >
          <Play className="h-4 w-4 shrink-0" />
          <span>⚽ INICIAR SESIÓN EN CANCHA</span>
        </Button>
      </div>

      {/* NORMAL PANEL CONTENT */}
      <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" /> SESIONES DE ENTRENAMIENTO REGISTRADAS EN LA DB
          </CardTitle>
          <CardDescription className="text-xs">
            Historial de sesiones sincronizadas directamente con Supabase PostgreSQL.
          </CardDescription>
        </CardHeader>

        <div className="space-y-3">
          {loadingSesionesDb ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl animate-pulse">
              ⚡ Sincronizando repositorio de sesiones desde Supabase PostgreSQL...
            </div>
          ) : listaSesionesDb.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300">
              🗄️ No se encontraron registros de entrenamiento en Supabase para este club. Presiona <strong>INICIAR SESIÓN EN CANCHA</strong> para registrar la primera.
            </div>
          ) : (
            listaSesionesDb.map((s, idx) => (
              <div key={s.id || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 hover:border-indigo-500/40 transition">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-indigo-600">
                    {s.id?.startsWith("ses-db") ? "REGISTRO EN DB (SUPABASE)" : "SESIÓN REPOSITORIO DB"}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{s.nombre || s.titulo || sesionData.nombre}</h3>
                  <p className="text-xs text-slate-400">{s.equipo_id || s.equipo || sesionData.equipo} | 📅 {s.fecha}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setFechaSesion(s.fecha);
                      setModoSesion("activa");
                      setPasoActivo(s.estado === "completada" ? 3 : 1);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl gap-1.5 h-9"
                  >
                    <Play className="h-4 w-4" /> Abrir Flujo en Cancha
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!confirm(`¿Eliminar la sesión "${s.nombre || s.fecha}" de la base de datos Supabase?`)) return;
                      const { error } = await supabase.from("sesiones_entrenamiento").delete().eq("id", s.id);
                      if (error) {
                        toast.error("Error al borrar registro en Supabase: " + error.message);
                      } else {
                        toast.success("🗑️ Sesión eliminada exitosamente de Supabase DB.");
                        cargarSesionesDb();
                      }
                    }}
                    className="h-9 px-3 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 rounded-xl"
                    title="Eliminar de Supabase"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
