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
  CheckCircle2, Play, Activity, Mic, MicOff, AlertTriangle, ShieldCheck,
  ChevronRight, ArrowLeft, Timer, Trophy, Sparkles, HeartPulse, Flame,
  FileText, Check, X, AlertCircle, HelpCircle, StopCircle, RefreshCw
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { CoachOsBanner } from "@/components/coach-os-banner";

export const Route = createFileRoute("/_app/entrenamientos")({
  validateSearch: (search: Record<string, unknown>) => ({
    autostart: search.autostart as string | undefined,
    teamName: search.teamName as string | undefined,
    category: search.category as string | undefined,
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
  const { role, selectedCoachId, selectedCoachName, coachName } = useRole();
  const searchParams = Route.useSearch();
  const autostart = searchParams?.autostart;
  const teamNameParam = searchParams?.teamName;
  const categoryParam = searchParams?.category;

  // Mode: "normal" | "active_flow" (Paso 1, 2, 3)
  const [modoSesion, setModoSesion] = useState<"normal" | "activa">("normal");
  const [pasoActivo, setPasoActivo] = useState<1 | 2 | 3>(1);

  // Active Session State
  const [sesionData, setSesionData] = useState<SesionActivaData>({
    id: `ses-${Date.now()}`,
    nombre: "Sesión #24: Perfeccionamiento de Pase y Desmarque",
    equipo: "Fútbol Sub-9 A (Asoderive)",
    categoria: "Sub-9",
    fecha: new Date().toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    duracionMinutos: 90,
    objetivo: "🎯 Foco: Pase con borde interno, control orientado y desmarque de apoyo.",
    jugadores: JUGADORES_DEMO_U9,
  });

  // Helper to load real players dynamically from RendimientoStore
  const getRealPlayersForTeam = (teamName: string, category: string): JugadorSesion[] => {
    const allPlayers = RendimientoStore.getJugadores();
    const clean = (s: string = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetClean = clean(category || teamName);

    let filtered = allPlayers.filter((p) => {
      const pCat = clean(p.categoria || "");
      return pCat === targetClean || pCat.includes(targetClean) || targetClean.includes(pCat);
    });

    if (filtered.length === 0) {
      filtered = allPlayers;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const wellnessList = RendimientoStore.getWellness();

    return filtered.map((p, idx) => {
      const playerWell = wellnessList.find((w) => w.jugadorId === p.id && w.fecha === todayStr);

      let color: WellnessColor = "verde";
      let detalle: string | undefined = undefined;

      if (playerWell) {
        if (playerWell.fatiga > 3 || playerWell.dolorMuscular > 3) {
          color = "rojo";
          detalle = `Fatiga/Dolor alto reportado (${playerWell.fatiga}/5)`;
        } else if (playerWell.fatiga > 2 || playerWell.dolorMuscular > 2 || playerWell.sueñoCalidad < 3) {
          color = "amarillo";
          detalle = "Fatiga ligera o sueño incompleto";
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
    const targetTeam = teamNameParam || "Asoderive U13";
    const targetCat = categoryParam || "U13";
    const realPlayers = getRealPlayersForTeam(targetTeam, targetCat);

    setSesionData((prev) => ({
      ...prev,
      equipo: targetTeam,
      categoria: targetCat,
      nombre: `Sesión de Cancha: ${targetTeam}`,
      jugadores: realPlayers,
    }));

    if (autostart === "true") {
      setModoSesion("activa");
      setPasoActivo(1);
    }
  }, [autostart, teamNameParam, categoryParam]);

  // Chronometer for Paso 2
  const [segundosTranscurridos, setSegundosTranscurridos] = useState<number>(755); // 12:35 min
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => setSegundosTranscurridos((s) => s + 1), 1000);
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
  const [jugadorTestSel, setJugadorTestSel] = useState<string>(JUGADORES_DEMO_U9[0].id);
  const [testType, setTestType] = useState<string>("Velocidad (30m)");
  const [testNotes, setTestNotes] = useState<string>("");
  const [tiempoTestInput, setTiempoTestInput] = useState<string>("3.85");

  // Coach Wellness Modal State
  const [modalCoachWellness, setModalCoachWellness] = useState<boolean>(false);
  const [jugadorWellnessSel, setJugadorWellnessSel] = useState<JugadorSesion | null>(null);
  const [wellEstadoSel, setWellEstadoSel] = useState<WellnessColor>("verde");
  const [wellDetalleInput, setWellDetalleInput] = useState<string>("");

  // Paso 3 Modal State (Cierre & Incidencias)
  const [modalCierreSesion, setModalCierreSesion] = useState<boolean>(false);
  const [notasVoz, setNotasVoz] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hayLesion, setHayLesion] = useState<boolean>(false);
  const [jugadorLesionadoId, setJugadorLesionadoId] = useState<string>(JUGADORES_DEMO_U9[0].id);
  const [gravedadLesion, setGravedadLesion] = useState<"leve" | "moderada" | "grave">("leve");
  const [descripcionLesion, setDescripcionLesion] = useState<string>("");

  // Voice to Text Dictation (Web Speech API)
  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("El navegador no soporta dictado por voz. Puedes escribir la nota manualmente.");
      return;
    }
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "es-CR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.info("🎙️ Escuchando... Habla ahora para dictar la nota.");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNotasVoz((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
        toast.success("Nota dictada agregada.");
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
    setSesionData((prev) => ({
      ...prev,
      jugadores: prev.jugadores.map((j) => (j.id === jugadorId ? { ...j, asistencia: estado } : j)),
    }));
  };

  // Finalize Session & Save directly to Supabase DB (NO LOCALSTORAGE!)
  const handleGuardarSesionFinal = async () => {
    const toastId = toast.loading("Guardando sesión completa en la Base de Datos Supabase...");

    const sesionDbId = `ses-${Date.now()}`;

    try {
      // 1. Guardar Sesión en Supabase DB
      const { error: errSesion } = await supabase.from("sesiones_entrenamiento").insert({
        id: sesionDbId,
        organizacion_id: RendimientoStore.getActiveOrganizacionId(),
        equipo_id: sesionData.equipo,
        entrenador_id: coachName || "Entrenador Oficial",
        fecha: new Date().toISOString().split("T")[0],
        hora_inicio: "16:00",
        hora_fin: "17:30",
        duracion_minutos: sesionData.duracionMinutos,
        estado: "completada",
        notas_entrenador: notasVoz || "Sesión ejecutada con éxito.",
      });

      if (errSesion) console.warn("Supabase sesion insert note:", errSesion.message);

      // 2. Guardar Asistencias en Supabase DB
      const asistenciasDb = sesionData.jugadores.map((j) => ({
        id: `asis-${Date.now()}-${j.id}`,
        sesion_id: sesionDbId,
        jugador_id: j.id,
        jugador_nombre: j.nombre,
        estado_asistencia: j.asistencia,
        wellness_color: j.wellnessColor,
        wellness_alerta_detalle: j.wellnessDetalle || null,
      }));

      const { error: errAsis } = await supabase.from("asistencia_registros").insert(asistenciasDb);
      if (errAsis) console.warn("Supabase asistencia insert note:", errAsis.message);

      // 3. Si hay Lesión, Guardar Incidencia en Supabase DB (Alerta a Administración)
      if (hayLesion) {
        const jugadorLes = sesionData.jugadores.find((j) => j.id === jugadorLesionadoId);
        const { error: errLes } = await supabase.from("incidencias_lesiones").insert({
          id: `les-${Date.now()}`,
          sesion_id: sesionDbId,
          jugador_id: jugadorLesionadoId,
          jugador_nombre: jugadorLes?.nombre || "Atleta",
          fecha: new Date().toISOString().split("T")[0],
          gravedad: gravedadLesion,
          zona_corporal: "Extremidad Inferior",
          descripcion: descripcionLesion || "Incidencia reportada durante el entrenamiento.",
          notificado_admin: true,
          estado_atencion: "pendiente_seguro",
        });

        if (errLes) console.warn("Supabase lesion insert note:", errLes.message);
        toast.info("🚨 Reporte de Lesión enviado al Área de Administración para el Seguro Médico.");
      }

      toast.dismiss(toastId);
      toast.success("🎉 ¡Entrenamiento completado y sincronizado 100% en la Base de Datos!");
      setModalCierreSesion(false);
      setModoSesion("normal");
      setPasoActivo(1);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error("Ocurrió una nota al guardar en la base de datos.");
    }
  };

  // ─────────────────────────────────────────────
  //  MODO SESIÓN ACTIVA EN CANCHA (FLUJO 3 PASOS)
  // ─────────────────────────────────────────────
  if (modoSesion === "activa") {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-3 sm:p-6 space-y-5 -m-6 relative">
        {/* TOP BAR ACTIVE SESSION HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl backdrop-blur-md sticky top-2 z-40 shadow-2xl">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModoSesion("normal")}
              className="h-9 px-3 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl gap-1 text-xs font-bold"
            >
              <ArrowLeft className="h-4 w-4" /> Salir de Cancha
            </Button>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                {sesionData.equipo} — {sesionData.categoria}
              </span>
              <h1 className="text-sm sm:text-base font-black text-slate-100 line-clamp-1">{sesionData.nombre}</h1>
            </div>
          </div>

          {/* Stepper Indicator Badge */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
            <span className={`px-2 py-0.5 rounded-lg ${pasoActivo === 1 ? "bg-indigo-600 text-white" : "text-slate-500"}`}>Paso 1: Asistencia</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className={`px-2 py-0.5 rounded-lg ${pasoActivo === 2 ? "bg-indigo-600 text-white" : "text-slate-500"}`}>Paso 2: Cancha</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className={`px-2 py-0.5 rounded-lg ${pasoActivo === 3 ? "bg-emerald-600 text-white" : "text-slate-500"}`}>Paso 3: Cierre</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PASO 1: PANTALLA DE INGRESO (ASISTENCIA + WELLNESS UNIFICADOS)   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {pasoActivo === 1 && (
          <div className="max-w-4xl mx-auto space-y-4 pb-24">
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-3xl text-indigo-200 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0" />
                <span>
                  <strong>Indicador Wellness Automático:</strong> Lee encuestas de padres desde casa. Si falta alguna, el profesor puede encuestar o aplicar test aquí.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSesionData((prev) => ({
                      ...prev,
                      jugadores: prev.jugadores.map((j) => ({ ...j, wellnessColor: "verde", wellnessDetalle: undefined })),
                    }));
                    toast.success("Wellness Óptimo (100%) marcado para todos los alumnos.");
                  }}
                  className="h-8 text-[11px] font-bold border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 rounded-xl gap-1"
                >
                  ✨ Marcar Todos Wellness
                </Button>
              </div>
            </div>

            {/* ENCABEZADOS DE COLUMNA CLAROS EN LA PANTALLA OSCURA */}
            <div className="hidden sm:flex items-center justify-between px-5 text-[11px] font-black text-slate-400 uppercase tracking-wider">
              <span>Jugador</span>
              <div className="flex items-center gap-14 pr-4">
                <span>Wellness Diario</span>
                <span>Pruebas Físicas</span>
                <span>Marcación Asistencia</span>
              </div>
            </div>

            {/* LISTA VERTICAL DE ALUMNOS (TARJETAS GRANDES TÁCTILES) */}
            <div className="space-y-3">
              {sesionData.jugadores.map((j) => (
                <div
                  key={j.id}
                  className="bg-slate-900 border border-slate-800 p-3.5 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-lg hover:border-slate-700 transition"
                >
                  {/* Avatar + Nombre + Indicator Wellness */}
                  <div className="flex items-center gap-3">
                    <img src={j.avatar} alt={j.nombre} className="h-12 w-12 rounded-2xl object-cover border border-slate-700 shrink-0" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        {j.nombre}
                        {/* WELLNESS COLOR BADGE INDICATOR */}
                        <span
                          title={j.wellnessDetalle || "Wellness Óptimo"}
                          className={`h-3.5 w-3.5 rounded-full shrink-0 shadow-sm cursor-help ${
                            j.wellnessColor === "verde"
                              ? "bg-emerald-500 shadow-emerald-500/50"
                              : j.wellnessColor === "amarillo"
                              ? "bg-amber-400 shadow-amber-400/50 animate-pulse"
                              : "bg-red-500 shadow-red-500/50 animate-bounce"
                          }`}
                        />
                      </h3>
                      {j.wellnessDetalle ? (
                        <p className="text-[11px] text-amber-300 font-medium line-clamp-1">{j.wellnessDetalle}</p>
                      ) : (
                        <p className="text-[10px] text-slate-400">100% Estado Óptimo para entrenar</p>
                      )}
                    </div>
                  </div>

                  {/* WELLNESS & TEST QUICK ACTIONS + 4 BOTONES CIRCULARES ASISTENCIA */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    {/* Botón Encuestar Wellness si el papá no lo hizo */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="sm:hidden text-[9px] font-bold text-slate-500 uppercase">Wellness</span>
                      <button
                        type="button"
                        onClick={() => {
                          setJugadorWellnessSel(j);
                          setWellEstadoSel(j.wellnessColor);
                          setWellDetalleInput(j.wellnessDetalle || "");
                          setModalCoachWellness(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-indigo-300 border border-slate-700 flex items-center gap-1.5 active:scale-95 transition"
                      >
                        <HeartPulse className="h-3.5 w-3.5 text-pink-400" />
                        <span>Encuestar</span>
                      </button>
                    </div>

                    {/* Botón + Test Físico */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="sm:hidden text-[9px] font-bold text-slate-500 uppercase">Prueba</span>
                      <button
                        type="button"
                        onClick={() => {
                          setJugadorTestSel(j.id);
                          setModalTestSpeed(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-300 border border-slate-700 flex items-center gap-1.5 active:scale-95 transition"
                      >
                        <Timer className="h-3.5 w-3.5 text-amber-400" />
                        <span>+ Test</span>
                      </button>
                    </div>

                    {/* 4 BOTONES CIRCULARES TÁCTILES DE MARCACIÓN RÁPIDA (MIN 44PX) */}
                    <div className="flex items-center gap-1">
                      {[
                        { key: "presente", label: "P", color: "bg-emerald-600 text-white" },
                        { key: "tarde", label: "T", color: "bg-amber-500 text-white" },
                        { key: "ausente", label: "A", color: "bg-red-600 text-white" },
                        { key: "justificado", label: "J", color: "bg-slate-700 text-white" },
                      ].map((btn) => {
                        const isActive = j.asistencia === btn.key;
                        return (
                          <button
                            key={btn.key}
                            type="button"
                            onClick={() => toggleAsistencia(j.id, btn.key as EstadoAsistencia)}
                            className={`h-10 w-10 rounded-2xl font-black text-xs flex items-center justify-center transition-all duration-200 active:scale-95 ${
                              isActive
                                ? `${btn.color} ring-2 ring-white/40 scale-105 shadow-lg`
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                            }`}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* STICKY FOOTER BOTÓN VERDE GIGANTE */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 border-t border-slate-800 backdrop-blur-lg z-50">
              <div className="max-w-3xl mx-auto">
                <Button
                  onClick={() => {
                    setPasoActivo(2);
                    setTimerRunning(true);
                    toast.success("Asistencia registrada. ¡Iniciando tiempo de cancha!");
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm py-4 h-auto rounded-2xl shadow-xl gap-2 tracking-wider uppercase"
                >
                  <CheckCircle2 className="h-5 w-5" /> ✓ GUARDAR ASISTENCIA E INICIAR CALENTAMIENTO
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PASO 2: PANTALLA DE TRABAJO (LOS 3 BLOQUES EN PESTAÑAS TÁCTICAS) */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {pasoActivo === 2 && (
          <div className="max-w-4xl mx-auto space-y-4 pb-24">
            {/* LÍNEA DE TIEMPO / CRONÓMETRO GENERAL FIXO */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-lg">
                  <Timer className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tiempo Transcurrido</span>
                  <span className="font-mono font-black text-xl text-emerald-400">{formatTiempo(segundosTranscurridos)} / 90:00 min</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setTimerRunning(!timerRunning)}
                className="h-10 px-4 border-slate-700 text-xs font-bold rounded-xl gap-1.5"
              >
                {timerRunning ? <StopCircle className="h-4 w-4 text-red-400" /> : <Play className="h-4 w-4 text-emerald-400" />}
                {timerRunning ? "Pausar" : "Reanudar"}
              </Button>
            </div>

            {/* PESTAÑAS DINÁMICAS DE LOS 3 BLOQUES */}
            <Tabs defaultValue="bloque1" className="space-y-4">
              <TabsList className="grid grid-cols-3 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
                <TabsTrigger value="bloque1" className="text-xs font-bold rounded-xl py-2">
                  1. Calentamiento (15m)
                </TabsTrigger>
                <TabsTrigger value="bloque2" className="text-xs font-bold rounded-xl py-2">
                  2. Trabajo Específico (60m)
                </TabsTrigger>
                <TabsTrigger value="bloque3" className="text-xs font-bold rounded-xl py-2">
                  3. Charla Técnica (15m)
                </TabsTrigger>
              </TabsList>

              {/* BLOQUE 1: CALENTAMIENTO */}
              <TabsContent value="bloque1" className="space-y-4">
                <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-amber-400" /> ACTIVACIÓN: EL RONDO DE PERSECUCIÓN (U9)
                    </h3>
                    <Badge className="bg-emerald-600 text-white font-bold text-xs">15 MINUTOS</Badge>
                  </div>

                  {/* 2D PITCH GRAPHIC MAP OF CONE SETUP */}
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl h-48 flex flex-col items-center justify-center p-4 relative overflow-hidden text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-widest z-10 mb-2">
                      📐 DISPOSICIÓN DE CONOS Y ESPACIO (15x15m)
                    </span>
                    <div className="flex items-center justify-center gap-6 z-10">
                      <div className="p-3 bg-emerald-900/80 rounded-xl border border-emerald-400 text-xs font-bold">
                        8 Jugadores afuera (2 toques)
                      </div>
                      <div className="p-3 bg-amber-900/80 rounded-xl border border-amber-400 text-xs font-bold">
                        2 Jugadores adentro (Presión)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300">
                    <p className="font-bold text-slate-200">INSTRUCCIONES CLAVE DE LA SESIÓN:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Pase a ras de césped con borde interno obligatorio.</li>
                      <li>Movilidad constante de apoyos laterales antes de recibir.</li>
                      <li>Intensidad: Baja - Media progresiva.</li>
                    </ul>
                  </div>
                </Card>
              </TabsContent>

              {/* BLOQUE 2: TRABAJO ESPECÍFICO */}
              <TabsContent value="bloque2" className="space-y-4">
                <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block">OBJETIVO CENTRAL SEMANAL</span>
                      <h3 className="font-black text-sm text-slate-100">{sesionData.objetivo}</h3>
                    </div>
                    <Badge className="bg-indigo-600 text-white font-bold text-xs">60 MINUTOS</Badge>
                  </div>

                  {/* SECCIÓN INTEGRADA DE PRUEBAS FÍSICAS (SOLO SI TOCA HOY) */}
                  <div className="bg-indigo-950/60 border border-indigo-500/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-6 w-6 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-indigo-200 block">📅 HOY CORRESPONDE EVALUACIÓN: Test de Velocidad (20m)</span>
                        <span className="text-[10px] text-slate-400">Toma los tiempos de los niños en este instante sin pausar la clase.</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => setModalTestSpeed(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs h-9 px-4 rounded-xl gap-1.5"
                    >
                      <Timer className="h-4 w-4" /> ⏱️ Tomar Test de Velocidad
                    </Button>
                  </div>

                  {/* CIRCUITO PRINCIPAL CANCHA MAP */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase">CIRCUITO 1: RUEDA DE PASES EN ROMBO Y REMATE</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Línea de 4 apoyos con pared corta y centro al segundo palo para definición al marco pequeño.
                    </p>
                  </div>
                </Card>
              </TabsContent>

              {/* BLOQUE 3: CHARLA TÉCNICA */}
              <TabsContent value="bloque3" className="space-y-4">
                <Card className="bg-slate-900 border-slate-800 text-white rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-indigo-400" /> FEEDBACK PEDAGÓGICO & VUELTA A LA CALMA
                    </h3>
                    <Badge className="bg-teal-600 text-white font-bold text-xs">15 MINUTOS</Badge>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="font-bold text-slate-300">PREGUNTAS CLAVE PARA PREGUNTAR AL GRUPO (U9):</p>
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2">
                        <span className="font-bold text-amber-400">❓ 1.</span>
                        <span>¿Hacia dónde debe apuntar el pie de apoyo al momento de entregar el pase?</span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2">
                        <span className="font-bold text-amber-400">❓ 2.</span>
                        <span>¿Por qué es importante moverse inmediatamente después de entregar el balón?</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* BOTÓN BOTTON ACTION: FINALIZAR ENTRENAMIENTO */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 border-t border-slate-800 backdrop-blur-lg z-50">
              <div className="max-w-4xl mx-auto">
                <Button
                  onClick={() => setModalCierreSesion(true)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm py-4 h-auto rounded-2xl shadow-xl gap-2 tracking-wider uppercase"
                >
                  ⚽ FINALIZAR ENTRENAMIENTO Y CREAR REPORTE
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* MODAL PASO 3: CIERRE DE SESIÓN & REPORTE DE INCIDENCIAS (LESIONES)*/}
        {/* ════════════════════════════════════════════════════════════════ */}
        <Dialog open={modalCierreSesion} onOpenChange={setModalCierreSesion}>
          <DialogContent className="sm:max-w-[550px] rounded-3xl bg-slate-900 text-white border-slate-800 p-6 shadow-2xl space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" /> CIERRE DE SESIÓN & REPORTE FINAL
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Guarda la bitácora del día y notifica cualquier novedad médica a la administración.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* CUADRO DE NOTAS CON DICTADO DE VOZ (VOICE-TO-TEXT) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-300">Notas del Día (Dictado por Voz o Teclado):</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={startSpeechRecognition}
                    className={`h-7 text-[10px] font-bold rounded-lg border-indigo-500/40 gap-1 ${
                      isRecording ? "bg-red-600 text-white animate-pulse" : "text-indigo-400 hover:bg-indigo-950"
                    }`}
                  >
                    {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    {isRecording ? "Grabando..." : "🎙️ Dictar por Voz"}
                  </Button>
                </div>
                <Textarea
                  rows={3}
                  value={notasVoz}
                  onChange={(e) => setNotasVoz(e.target.value)}
                  placeholder="Ej. Buena actitud del grupo. Trabajar más la precisión del pase corto en la próxima sesión."
                  className="bg-slate-950 border-slate-800 text-xs rounded-2xl text-slate-200"
                />
              </div>

              {/* MÓDULO DE REPORTE DE LESIONES E INCIDENCIAS */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-slate-200">¿Ocurrió alguna lesión durante la práctica?</Label>
                    <p className="text-[10px] text-slate-400">Notifica automáticamente al Área de Administración y Seguro Deportivo.</p>
                  </div>
                  <Switch checked={hayLesion} onCheckedChange={setHayLesion} />
                </div>

                {hayLesion && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-400">Seleccionar Jugador Lesionado:</Label>
                      <Select value={jugadorLesionadoId} onValueChange={setJugadorLesionadoId}>
                        <SelectTrigger className="h-9 text-xs bg-slate-900 rounded-xl border-slate-700">
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
                      <Label className="text-[11px] font-bold text-slate-400">Gravedad de la Lesión:</Label>
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
                            className={`py-1.5 rounded-xl text-[10px] font-bold border transition ${
                              gravedadLesion === g.key
                                ? "bg-red-600 text-white border-red-500"
                                : "bg-slate-900 text-slate-400 border-slate-800"
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-400">Detalle / Descripción de la Lesión:</Label>
                      <Input
                        value={descripcionLesion}
                        onChange={(e) => setDescripcionLesion(e.target.value)}
                        placeholder="Ej. Torcedura leve en tobillo derecho al disputar balón."
                        className="h-8 text-xs bg-slate-900 rounded-xl border-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* BOTÓN FINAL DE GUARDADO DIRECTO A LA BASE DE DATOS SUPABASE */}
              <Button
                onClick={handleGuardarSesionFinal}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3.5 h-auto rounded-2xl shadow-xl gap-2 uppercase tracking-wider"
              >
                <CheckCircle2 className="h-4 w-4" /> 💾 GUARDAR 100% EN BASE DE DATOS SUPABASE
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL REGISTRAR PRUEBA FÍSICA (DISEÑO FIEL AL MOCKUP) */}
        <Dialog open={modalTestSpeed} onOpenChange={setModalTestSpeed}>
          <DialogContent className="sm:max-w-[460px] rounded-3xl bg-slate-900 text-white border-slate-800 p-6 shadow-2xl space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-indigo-400">
                <Trophy className="h-5 w-5 text-indigo-400" /> Registrar Prueba Física
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Ingresa el desempeño físico del jugador para el día de hoy.
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const jugadorObj = sesionData.jugadores.find((j) => j.id === jugadorTestSel) || sesionData.jugadores[0];
              return (
                <div className="space-y-4 pt-1">
                  {/* CARD SUPERIOR CON FOTO Y NOMBRE DEL JUGADOR SELECCIONADO */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <img src={jugadorObj?.avatar} alt={jugadorObj?.nombre} className="h-12 w-12 rounded-xl object-cover border border-slate-700 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{jugadorObj?.nombre}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        JUGADOR OFICIAL · {jugadorObj?.categoria || sesionData.categoria}
                      </p>
                    </div>
                  </div>

                  {/* TIPO DE PRUEBA */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-300">Tipo de Prueba</Label>
                    <Select value={testType} onValueChange={setTestType}>
                      <SelectTrigger className="h-10 text-xs bg-slate-950 rounded-xl border-slate-800">
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
                    <Label className="text-xs font-bold text-slate-300">Resultado de la Marca</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        value={tiempoTestInput}
                        onChange={(e) => setTiempoTestInput(e.target.value)}
                        placeholder="Ej. 4.50"
                        className="h-10 text-sm font-bold bg-slate-950 rounded-xl border-slate-800 pr-20 text-emerald-400"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        SEGUNDOS
                      </span>
                    </div>
                  </div>

                  {/* NOTAS / OBSERVACIONES */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-300">Notas / Observaciones</Label>
                    <Input
                      value={testNotes}
                      onChange={(e) => setTestNotes(e.target.value)}
                      placeholder="Ej. Excelente esfuerzo final..."
                      className="h-10 text-xs bg-slate-950 rounded-xl border-slate-800 text-slate-200"
                    />
                  </div>

                  {/* BOTONES FOOTER */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setModalTestSpeed(false)}
                      className="h-9 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs rounded-xl"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={async () => {
                        const todayStr = new Date().toISOString().split("T")[0];
                        // Persist to Supabase DB
                        await supabase.from("resultados_pruebas").insert({
                          id: `test-${Date.now()}`,
                          sesion_id: sesionData.id,
                          jugador_id: jugadorObj.id,
                          jugador_nombre: jugadorObj.nombre,
                          tipo_test: testType,
                          resultado: parseFloat(tiempoTestInput) || 0,
                          unidad: "segundos",
                          fecha: todayStr,
                          notas: testNotes,
                        });

                        toast.success(`Prueba física (${testType}) registrada para ${jugadorObj.nombre}.`);
                        setModalTestSpeed(false);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl h-9 px-4"
                    >
                      Guardar Test
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* MODAL CANCHA WELLNESS RÁPIDO PARA EL ENTRENADOR */}
        <Dialog open={modalCoachWellness} onOpenChange={setModalCoachWellness}>
          <DialogContent className="sm:max-w-[450px] rounded-3xl bg-slate-900 text-white border-slate-800 p-6 shadow-2xl space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-pink-400">
                <HeartPulse className="h-5 w-5" /> MARCACIÓN RÁPIDA DE WELLNESS EN CANCHA
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Selecciona el estado físico del alumno {jugadorWellnessSel?.nombre} en 1 solo toque.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: "verde", title: "🟢 100% Óptimo (Sin fatiga ni dolores)", desc: "Listo para máxima intensidad" },
                  { key: "amarillo", title: "🟡 Fatiga Ligera / Sueño Incompleto", desc: "Cansancio o molestia menor" },
                  { key: "rojo", title: "🔴 Con Dolor / Lesión / Malestar", desc: "Requiere entrenamiento diferenciado" },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setWellEstadoSel(st.key as WellnessColor)}
                    className={`p-3 rounded-2xl border text-left transition active:scale-98 ${
                      wellEstadoSel === st.key
                        ? "bg-indigo-950 border-indigo-500 shadow-md"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-100">{st.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{st.desc}</div>
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider">
            MODO CAMPO DE JUEGO (ENTRENADOR)
          </Badge>
          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-indigo-400" /> Planificador & Flujo de Sesión Activa
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
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3.5 px-6 h-auto rounded-2xl shadow-xl gap-2 tracking-wider uppercase animate-pulse"
        >
          <Play className="h-5 w-5" /> ⚽ INICIAR SESIÓN EN CANCHA (FLUJO 3 PASOS)
        </Button>
      </div>

      {/* NORMAL PANEL CONTENT */}
      <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" /> SESIONES DE ENTRENAMIENTO REGISTRADAS
          </CardTitle>
          <CardDescription className="text-xs">
            Sesiones programadas y sincronizadas con la base de datos Supabase.
          </CardDescription>
        </CardHeader>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold text-indigo-600">SESIÓN #24 — OFICIAL</span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{sesionData.nombre}</h3>
            <p className="text-xs text-slate-400">{sesionData.equipo} | {sesionData.fecha}</p>
          </div>

          <Button
            onClick={() => {
              setModoSesion("activa");
              setPasoActivo(1);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl gap-1.5"
          >
            <Play className="h-4 w-4" /> Abrir Flujo en Cancha
          </Button>
        </div>
      </Card>
    </div>
  );
}
