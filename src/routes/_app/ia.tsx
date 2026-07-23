import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Brain, AlertTriangle, TrendingDown, Sparkles, Activity, ArrowRight, 
  Zap, Target, Workflow, Plus, CheckCircle2, ChevronRight, Users, 
  DollarSign, Trophy, UserCheck, ShieldAlert, FileText, ClipboardCheck, 
  Calendar, Sliders, Settings, Coins, Clock4, Database, ShieldCheck,
  Mic, MicOff, ImageIcon, X
} from "lucide-react";
import { 
  aiRiskScores, aiInsights, aiEventos, aiPredicciones, workflows, workflowLogs,
  jugadores, pagos, crmLeads, entrenadores, convocatorias, matches
} from "@/lib/mock-data";
import RendimientoStore from "@/lib/rendimiento-store";
import { TacticalStore } from "@/lib/tactical-store";
import { AIStore, AIConfig, AIAgentName } from "@/lib/ai-store";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/ia")({ component: IADashboard });

const workflowEstadoStyle = {
  activo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  pausado: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  borrador: "bg-muted text-muted-foreground",
} as const;

function IADashboard() {
  const { role, coachName } = useRole();
  const [activeTab, setActiveTab] = useState("ia-deportiva");
  const [selectedPlayerId, setSelectedPlayerId] = useState("j1");
  const [selectedTeamId, setSelectedTeamId] = useState("Fútbol Sub-10");
  const [selectedSubTab, setSelectedSubTab] = useState("jugador");

  // AI Workout Generator States
  const [wgEdad, setWgEdad] = useState("Sub-10");
  const [wgObjetivo, setWgObjetivo] = useState("");
  const [wgDuracion, setWgDuracion] = useState("60");
  const [wgNivel, setWgNivel] = useState("Principiante");
  const [wgOutput, setWgOutput] = useState("");
  const [wgLoading, setWgLoading] = useState(false);

  // AI Chronicle Generator States
  const [cgRival, setCgRival] = useState("");
  const [cgResultado, setCgResultado] = useState<"victoria" | "derrota" | "empate">("victoria");
  const [cgMarcadorPropio, setCgMarcadorPropio] = useState<number | "">("");
  const [cgMarcadorRival, setCgMarcadorRival] = useState<number | "">("");
  const [cgDestacados, setCgDestacados] = useState("");
  const [cgNotaDT, setCgNotaDT] = useState("");
  const [cgOutput, setCgOutput] = useState("");
  const [cgLoading, setCgLoading] = useState(false);

  // Dynamic Categories from Store
  const availableCategories = useMemo(() => {
    const list = RendimientoStore.getCategorias();
    return list && list.length > 0 ? list : [
      { id: "c1", nombre: "Sub-8" },
      { id: "c2", nombre: "Sub-10" },
      { id: "c3", nombre: "Sub-12" },
      { id: "c4", nombre: "Sub-14" },
      { id: "c5", nombre: "Sub-16" },
      { id: "c6", nombre: "Sub-18" },
      { id: "c7", nombre: "Mayor" },
    ];
  }, []);

  // Voice dictation states
  const [isListening, setIsListening] = useState(false);

  // Muro Chronicle Publish image
  const [cgImage, setCgImage] = useState<string | null>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta reconocimiento de voz (prueba usando Google Chrome).");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("🎙️ Escuchando... Di tu nota sobre el partido ahora.");
    };

    recognition.onerror = (event: any) => {
      console.error(event);
      toast.error("Error en reconocimiento de voz: " + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setCgNotaDT(prev => prev ? prev + " " + speechToText : speechToText);
      toast.success("Nota añadida por voz con éxito.");
    };

    recognition.start();
  };

  const handleCgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCgImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishToWall = async () => {
    if (!cgOutput) {
      toast.error("Primero debes generar la crónica.");
      return;
    }

    const authorName = role === "coach" && coachName ? coachName : (role === "admin" ? "Admin Demo" : "Usuario Academia");
    const authorUser = "@" + authorName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
    const authorAvatar = role === "admin" 
      ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
      : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80";

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const formattedTiempo = `${now.getDate()} ${meses[now.getMonth()]} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const orgId = RendimientoStore.getActiveOrganizacionId();
    const newPost = {
      id: `p-${Date.now()}`,
      autor: authorName,
      usuario: authorUser,
      avatar: authorAvatar,
      tiempo: formattedTiempo,
      tipo: "publicacion",
      contenido: cgOutput,
      imagen: cgImage ?? undefined,
      likes: 0,
      organizacion_id: orgId
    };

    const { error } = await supabase.from("muro_posts").insert(newPost);
    if (error) {
      toast.error("Error al publicar en la base de datos: " + error.message);
    } else {
      toast.success("📢 ¡Crónica publicada con éxito en el Muro de la Academia!");
      setCgImage(null);
    }
  };

  // Load config settings
  const [config, setLocalConfig] = useState<AIConfig>(AIStore.getConfig());

  // Load physical/wellness calculations
  const loadData = RendimientoStore.getPlayerLoadData();
  const activePlayer = useMemo(() => {
    return loadData.find(p => p.jugadorId === selectedPlayerId);
  }, [selectedPlayerId, loadData]);

  // AI Store entities
  const priorities = AIStore.getPriorities();
  const recommendations = AIStore.getRecommendations();
  const predictions = AIStore.getPredictions();
  const logs = AIStore.getLogs();

  // Stat computations
  const abandonoAlto = aiRiskScores.filter((r) => r.scoreAbandono >= 60).length;
  const moraAlta = aiRiskScores.filter((r) => r.scoreMora >= 60).length;
  const lesionAlta = aiRiskScores.filter((r) => r.scoreLesion >= 60).length;
  const topRiesgo = [...aiRiskScores].sort((a, b) => b.scoreAbandono - a.scoreAbandono).slice(0, 5);
  const workflowsActivos = workflows.filter((w) => w.estado === "activo").length;
  const ejecucionesWorkflows = workflows.reduce((a, w) => a + w.ejecuciones, 0);

  // Financial stats
  const totalRecaudado = RendimientoStore.getPagos().reduce((acc, p) => acc + (p.monto || 0), 0);
  const morososList = RendimientoStore.getJugadores().filter(j => j.estadoPago === "moroso");
  const crmConversion = 0;

  // Activity logs metrics computations
  const totalQueries = logs.length;
  const avgResponseTime = logs.length > 0 
    ? Math.round(logs.reduce((acc, l) => acc + l.responseTimeMs, 0) / logs.length) 
    : 0;
  const totalCost = logs.length > 0 
    ? parseFloat(logs.reduce((acc, l) => acc + l.costEstimateUSD, 0).toFixed(4)) 
    : 0;
  const totalTimeSaved = logs.length > 0 
    ? Math.round(logs.reduce((acc, l) => acc + l.timeSavedMinutes, 0)) 
    : 0;

  const handleSaveConfig = () => {
    AIStore.setConfig(config);
    toast.success("Configuración de DeportivOS AI guardada correctamente");
  };

  const handleGenerateTraining = () => {
    setWgLoading(true);
    setWgOutput("");
    setTimeout(() => {
      const result = `### 📋 Generalidades
* **Categoría/Edad:** ${wgEdad}
* **Objetivo Principal:** ${wgObjetivo}
* **Duración Total:** ${wgDuracion} min.

### ⏱️ Fase 1: Calentamiento (${Math.round(parseInt(wgDuracion) * 0.25)} min)
* **Nombre:** Rondo de activación dinámica
* **Descripción:** Los jugadores forman un círculo en espacios reducidos con 1 o 2 defensores al medio. Se trabaja a 1 o 2 toques según el nivel ${wgNivel.toLowerCase()}. Enfoque en control orientado rápido.
* **Espacio y Materiales:** Conos delimitadores, 1 balón por rondo.
* **Consigna clave para el DT:** Estimular la comunicación constante y el perfilamiento corporal correcto antes de recibir.

### ⚽ Fase 2: Parte Principal (${Math.round(parseInt(wgDuracion) * 0.55)} min)
* **Nombre del Ejercicio:** Circuito táctico de ${wgObjetivo.toLowerCase()}
* **Descripción paso a paso:** 
  1. Los jugadores se organizan en parejas partiendo desde tres cuartos de cancha.
  2. Realizan pase y devolución rápida para abrir la banda.
  3. El extremo lanza un centro raso o aéreo buscando la llegada del delantero.
  4. Finalizan al arco defendido por un portero de la categoría.
* **Variante (para hacerlo más fácil o difícil):** Si es muy difícil, quitar la marca pasiva. Si es fácil, agregar un defensor real que recupere y contraataque.
* **Consigna clave para el DT:** Exigir precisión y potencia en el último toque. Si el nivel es ${wgNivel.toLowerCase()}, priorizar la colocación del cuerpo.

### 🔄 Fase 3: Vuelta a la Calma (${Math.round(parseInt(wgDuracion) * 0.20)} min)
* **Descripción:** Trote ligero de regeneración y estiramiento estático guiado en círculo.
* **Charla de cierre (Feedback):** ¿Qué decisiones tomamos hoy antes de rematar? ¿Cuándo es mejor tirar con potencia y cuándo colocar el balón?`;
      
      setWgOutput(result);
      setWgLoading(false);
      toast.success("¡Sesión de entrenamiento generada por DeportivOS AI!");
    }, 1500);
  };

  const handleSaveToTacticalPlanning = async () => {
    if (!wgOutput) {
      toast.error("Primero debes generar la sesión.");
      return;
    }

    const hoy = new Date();
    const fechaHoyStr = hoy.toISOString().split("T")[0];
    const durMin = parseInt(wgDuracion) || 60;
    const f1Dur = Math.round(durMin * 0.25);
    const f2Dur = Math.round(durMin * 0.55);
    const f3Dur = Math.round(durMin * 0.20);
    const targetTeam = wgEdad || "Asoderive U13";
    const activeCoach = coachName || "Edgar Calderón";

    // 1. Guardar Microciclo en RendimientoStore
    const planMicrociclo = {
      id: `plan_ia_${Date.now()}`,
      nombre: `Plan IA - ${wgObjetivo} (${targetTeam})`,
      fecha_inicio: fechaHoyStr,
      fecha_fin: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      objetivos: wgObjetivo || "Desarrollo de sesión asistido por IA",
      ejercicios: [
        { id: `ex_1_${Date.now()}`, nombre: `Fase 1: Rondo de activación (${wgNivel})`, duracion: f1Dur },
        { id: `ex_2_${Date.now()}`, nombre: `Fase 2: Circuito táctico de ${wgObjetivo}`, duracion: f2Dur },
        { id: `ex_3_${Date.now()}`, nombre: `Fase 3: Vuelta a la calma y feedback`, duracion: f3Dur }
      ],
      equipo: targetTeam,
      organizacion_id: RendimientoStore.getActiveOrganizacionId()
    };

    await RendimientoStore.addPlanificacion(planMicrociclo);

    // 2. Guardar Plan Semanal en TacticalStore
    const weeklyPlanItem = {
      id: `wp_ia_${Date.now()}`,
      semana: `${fechaHoyStr} al Semanal`,
      equipo: targetTeam,
      categoria: targetTeam,
      objetivo: wgObjetivo || "Desarrollo técnico-táctico integral",
      cargaEsperada: durMin * 6,
      responsable: activeCoach,
      actividades: [
        { dia: 0, titulo: `Fase 1: Rondo + Fase 2: Circuito de ${wgObjetivo}`, hora: "16:00", duracion: durMin, tipo: "entrenamiento" as const },
        { dia: 1, titulo: "Trabajo táctico de campo y posesión", hora: "16:00", duracion: durMin, tipo: "entrenamiento" as const },
        { dia: 2, titulo: "Descanso activo y estiramientos", hora: "", duracion: 0, tipo: "descanso" as const },
        { dia: 3, titulo: "Transición y juego en espacio reducido", hora: "16:00", duracion: durMin, tipo: "entrenamiento" as const },
        { dia: 4, titulo: "Análisis de video táctico pre-partido", hora: "17:00", duracion: 30, tipo: "video" as const },
        { dia: 5, titulo: "Partido Oficial de Campeonato", hora: "09:00", duracion: 90, tipo: "partido" as const },
        { dia: 6, titulo: "Sesión de recuperación y crioterapia", hora: "10:00", duracion: 45, tipo: "recuperacion" as const }
      ]
    };

    TacticalStore.saveWeeklyPlan(weeklyPlanItem);

    // 3. Guardar en "deportivos_training_plans"
    const STORAGE_KEY = "deportivos_training_plans";
    let existingPlans: any[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      existingPlans = raw ? JSON.parse(raw) : [];
    } catch {
      existingPlans = [];
    }

    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split("T")[0];
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split("T")[0];
    const NOMBRES_MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mesNombre = NOMBRES_MESES[hoy.getMonth()] || "Julio";

    const fullPlan = {
      id: `plan-ia-full-${Date.now()}`,
      categoria: targetTeam,
      objetivo: wgObjetivo || "Desarrollo técnico-táctico con IA",
      entrenador: activeCoach,
      equipo: targetTeam,
      contenidos: {
        tecnica: ["Control orientado rápido", "Pase y perfilamiento corporal"],
        tactica: [`Circuito de ${wgObjetivo}`, "Rondo de posesión"],
        fisica: [`Activación de ${f1Dur} min`, `Regenerativo de ${f3Dur} min`]
      },
      meses: [
        {
          mes: mesNombre,
          fechaInicio: primerDiaMes,
          fechaFin: ultimoDiaMes,
          semanas: [
            { semana: "Semana 1", contenidos: [wgObjetivo, "Rondo de activación", "Trabajo específico", "Charla de cierre"] },
            { semana: "Semana 2", contenidos: ["Toma de decisiones rápidas", "Juegos de posición", "Falta táctica", "Evaluación RPE"] },
            { semana: "Semana 3", contenidos: ["Defensa organizada", "Ataque rápido por bandas", "ABP Córners", "Recuperación activa"] },
            { semana: "Semana 4", contenidos: ["Repaso técnico e intensidad", "Partido aplicativo", "Prueba física", "Feedback final"] }
          ],
          nota: `Plan generado por DeportivOS AI para ${targetTeam}.`
        }
      ],
      notaFinal: wgOutput,
      creadoEn: fechaHoyStr
    };

    existingPlans.unshift(fullPlan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingPlans));

    // 4. Agregar sesión a RendimientoStore para Modo Cancha en Vivo
    try {
      RendimientoStore.addSesion({
        fecha: fechaHoyStr,
        equipo: targetTeam,
        tipo: "entrenamiento",
        duracion: durMin,
        rpePromedio: 6,
        carga: durMin * 6,
        asistenciaCount: 18,
        notas: `[Plan IA] ${wgObjetivo}.\n\n${wgOutput}`
      });
    } catch (e) {
      console.log("Sesión guardada en RendimientoStore", e);
    }

    toast.success("🚀 ¡Plan asignado exitosamente al Coach!", {
      description: `El plan y entrenamiento de ${targetTeam} están listos en Planificación Táctica y Cancha.`,
    });
  };

  const handleGenerateChronicle = () => {
    setCgLoading(true);
    setCgOutput("");
    setTimeout(() => {
      const outcomeText = cgResultado === "victoria" 
        ? "un triunfo muy valioso" 
        : cgResultado === "empate" 
        ? "un empate muy luchado" 
        : "un partido de enorme aprendizaje";

      let intro = "";
      let highlights = "";
      let learning = "";

      if (cgResultado === "victoria") {
        intro = `Hoy sumamos ${outcomeText} ante un rival competitivo como ${cgRival} con un marcador final de ${cgMarcadorPropio}-${cgMarcadorRival}. La victoria premia la disciplina y el trabajo que venimos haciendo en la semana, pero sobre todo, el espíritu de compañerismo del grupo.`;
        highlights = `* La contundencia ofensiva del plantel, destacando la participación de ${cgDestacados}.\n* El orden y solidaridad defensiva en los minutos de mayor presión del oponente.`;
        learning = `Nos quedamos con la alegría del triunfo, pero con la cabeza fría para seguir mejorando. En los entrenamientos seguiremos trabajando en la marca de balón parado y las salidas limpias. ¡Humildad y esfuerzo continuo!`;
      } else if (cgResultado === "empate") {
        intro = `Hoy disputamos ${outcomeText} frente a ${cgRival} cerrando con un vibrante marcador de ${cgMarcadorPropio}-${cgMarcadorRival}. Fue un partido de ida y vuelta donde los chicos demostraron que saben competir bajo presión y apoyarse mutuamente en cada jugada.`;
        highlights = `* Jugadas clave y jugadas destacadas: ${cgDestacados}.\n* La garra del equipo para sostener el resultado en un campo exigente.`;
        learning = `Cada punto sumado en estas condiciones enseña el valor de la perseverancia. Esta semana puliremos las transiciones ofensivas para llegar más finos el fin de semana.`;
      } else {
        intro = `Hoy nos tocó visitar a un rival durísimo como ${cgRival} en ${outcomeText} culminando con marcador de ${cgMarcadorPropio}-${cgMarcadorRival}. Aunque el resultado numérico no nos favoreció, el verdadero triunfo estuvo en la actitud, la entrega y el carácter formativo de nuestros atletas.`;
        highlights = `* Momentos destacados del encuentro: ${cgDestacados}.\n* La entrega física admirable y el hecho de no bajar los brazos hasta el último pitazo final.`;
        learning = `El fútbol formativo se trata de esto: aprender de la adversidad. La nota de nuestro DT: "${cgNotaDT}". Nos quedamos con el esfuerzo del segundo tiempo. Trabajaremos duro en la semana para corregir detalles y volver más fuertes.`;
      }

      const result = `📢 **¡CRÓNICA DE LA JORNADA!** ⚽

${intro}

🌟 **Momentos destacados:**
${highlights}

💪 **El aprendizaje del día:**
${learning}

¡A seguir creciendo, equipo! 🦅`;

      setCgOutput(result);
      setCgLoading(false);
      toast.success("¡Crónica de partido redactada por DeportivOS AI!");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-amber-500 text-white shadow-elegant">
            <Brain className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">IA & Automatización</h1>
            <p className="text-sm text-muted-foreground">Monitoreo predictivo y análisis analítico de DeportivOS AI.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/ia/asistente">
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-amber-500 text-white font-bold gap-1 text-xs">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" /> Abrir Chat DeportivOS AI
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex gap-2 border-b pb-1 overflow-x-auto scrollbar-none">
        {[
          { id: "ia-deportiva", label: "IA Deportiva", icon: Brain },
          { id: "generadores-ia", label: "Generadores IA", icon: Sparkles },
          { id: "analisis-modular", label: "Análisis Modular", icon: Target },
          { id: "workflows", label: "Workflows & Automatización", icon: Workflow },
          { id: "centro-actividad", label: "Centro de Actividad", icon: Database },
          { id: "configuracion-ia", label: "Configuración IA", icon: Settings }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === tab.id
                  ? "border-primary text-primary font-black"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: IA DEPORTIVA */}
      {activeTab === "ia-deportiva" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={AlertTriangle} label="Riesgo de abandono" value={abandonoAlto.toString()} hint="atletas en riesgo alto" accent="warning" />
            <StatCard icon={TrendingDown} label="Riesgo de mora" value={moraAlta.toString()} hint="familias con probabilidad alta" accent="destructive" />
            <StatCard icon={Activity} label="Riesgo de lesión" value={lesionAlta.toString()} hint="atletas con alerta preventiva" accent="warning" />
            <StatCard icon={Sparkles} label="Insights generados" value={aiInsights.length.toString()} hint="últimos 7 días" accent="primary" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Target className="h-4.5 w-4.5 text-primary" /> Top atletas en riesgo</CardTitle>
                  <CardDescription>Ranking predictivo por probabilidad de abandono</CardDescription>
                </div>
                <Link to="/ia/riesgos" className="text-xs text-primary hover:underline inline-flex items-center gap-1">Ver todos <ArrowRight className="h-3 w-3" /></Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {topRiesgo.map((r) => (
                  <Link to="/jugadores/$id" params={{ id: r.jugadorId }} key={r.jugadorId} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition bg-white/[0.01]">
                    <img src={r.avatar} alt="" className="h-9 w-9 rounded-full border border-white/10" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-xs truncate text-white">{r.jugador}</p>
                        <Badge variant={r.nivelAbandono === "critico" ? "destructive" : "secondary"}>{r.scoreAbandono}%</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{r.categoria} · {r.sede}</p>
                      <Progress value={r.scoreAbandono} className="h-1.5 mt-2" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-card bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4.5 w-4.5 text-amber-500 animate-pulse" /> Actividad IA</CardTitle>
                <CardDescription>Últimos eventos del motor analítico</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiEventos.map((e) => (
                  <div key={e.id} className="flex gap-2 text-xs border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-white/90 leading-relaxed">{e.texto}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{e.fecha}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4.5 w-4.5 text-primary" /> Insights automáticos</CardTitle>
                  <CardDescription>Patrones detectados por la IA</CardDescription>
                </div>
                <Link to="/ia/insights" className="text-xs text-primary hover:underline">Ver todos</Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiInsights.slice(0, 4).map((i) => (
                  <div key={i.id} className="rounded-lg border p-3 bg-white/[0.01]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-white">{i.titulo}</p>
                      <Badge variant={i.impacto === "positivo" ? "default" : "secondary"} className="shrink-0 text-[9px]">{i.categoria}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{i.detalle}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-card bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4.5 w-4.5 text-primary" /> Predicciones activas</CardTitle>
                  <CardDescription>Eventos anticipados por la IA</CardDescription>
                </div>
                <Link to="/ia/predicciones" className="text-xs text-primary hover:underline">Ver todas</Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiPredicciones.slice(0, 4).map((p) => (
                  <div key={p.id} className="rounded-lg border p-3 bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold text-white">{p.jugador}</p>
                      <Badge variant={p.tipo === "lesion" || p.tipo === "abandono" ? "destructive" : "outline"} className="text-[9px]">{p.probabilidad}% · {p.horizonte}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{p.descripcion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "generadores-ia" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Generador de Entrenamientos */}
          <Card className="bg-card border-white/5 flex flex-col shadow-elegant">
            <CardHeader className="border-b border-white/5 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4.5 w-4.5 text-primary" /> Generador de Sesiones de Entrenamiento
              </CardTitle>
              <CardDescription>Planifica un entrenamiento estructurado en 3 fases adaptado a tu categoría.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Edad / Categoría</label>
                  <select 
                    value={wgEdad} 
                    onChange={e => setWgEdad(e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#0f111a] px-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat.id || cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nivel de Jugadores</label>
                  <select 
                    value={wgNivel} 
                    onChange={e => setWgNivel(e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#0f111a] px-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Principiante">Principiante (Formativo)</option>
                    <option value="Intermedio">Intermedio (Desarrollo)</option>
                    <option value="Avanzado">Avanzado (Competitivo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Objetivo Principal de la Sesión</label>
                  <input 
                    type="text" 
                    value={wgObjetivo} 
                    onChange={e => setWgObjetivo(e.target.value)}
                    placeholder="Ej. Control y pase corto, Presión alta"
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#0f111a] px-3 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Duración Total</label>
                  <select 
                    value={wgDuracion} 
                    onChange={e => setWgDuracion(e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#0f111a] px-2 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="60">60 min.</option>
                    <option value="90">90 min.</option>
                    <option value="120">120 min.</option>
                  </select>
                </div>
              </div>

              <Button 
                onClick={handleGenerateTraining}
                disabled={wgLoading}
                className="w-full bg-gradient-primary text-white text-xs font-bold gap-1.5 shadow-elegant"
              >
                <Sparkles className="h-4 w-4" /> {wgLoading ? "Generando sesión..." : "Generar Sesión con IA"}
              </Button>

              {wgOutput && (
                <div className="mt-4 space-y-3.5">
                  <div className="flex flex-wrap justify-between items-center bg-slate-100 dark:bg-slate-900 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">📋 Plan de Entrenamiento Listo</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-[10px] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 gap-1 font-bold"
                        onClick={() => {
                          navigator.clipboard.writeText(wgOutput);
                          toast.success("Copiado al portapapeles");
                        }}
                      >
                        Copiar Texto
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 text-[10px] bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black gap-1.5 shadow-sm"
                        onClick={handleSaveToTacticalPlanning}
                      >
                        <Sparkles className="h-3 w-3" /> 🚀 Asignar a Planificación del Coach
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] text-slate-800 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                    {wgOutput}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Redactor de Crónicas */}
          <Card className="bg-card border-white/5 flex flex-col shadow-elegant">
            <CardHeader className="border-b border-white/5 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" /> Redactor Automático de Crónicas
              </CardTitle>
              <CardDescription>Crea un informe emocionante y motivador del partido para enviar a los padres.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Rival del Encuentro</label>
                  <input 
                    type="text" 
                    value={cgRival} 
                    onChange={e => setCgRival(e.target.value)}
                    placeholder="Ej. Deportivo Alajuelense"
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#0f111a] px-3 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Resultado del Partido</label>
                  <select 
                    value={cgResultado} 
                    onChange={e => setCgResultado(e.target.value as any)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#0f111a] px-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="victoria">Victoria (Ganamos)</option>
                    <option value="derrota">Derrota (Perdimos)</option>
                    <option value="empate">Empate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Goles Propios</label>
                  <input 
                    type="number" 
                    value={cgMarcadorPropio} 
                    onChange={e => setCgMarcadorPropio(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Ej. 2"
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#0f111a] px-3 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Goles Rival</label>
                  <input 
                    type="number" 
                    value={cgMarcadorRival} 
                    onChange={e => setCgMarcadorRival(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Ej. 1"
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#0f111a] px-3 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Figuras / Goleadores</label>
                  <input 
                    type="text" 
                    value={cgDestacados} 
                    onChange={e => setCgDestacados(e.target.value)}
                    placeholder="Ej. Doblete de Juan, atajadas de Sofía"
                    className="w-full h-9 rounded-lg border border-white/10 bg-[#0f111a] px-3 text-xs text-white outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Nota rápida del Entrenador (DT)</label>
                  <button 
                    type="button"
                    onClick={startListening}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                      isListening 
                        ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                        : "bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-3 w-3" /> Detener Voz
                      </>
                    ) : (
                      <>
                        <Mic className="h-3 w-3 animate-bounce" /> Hablar (Dictar)
                      </>
                    )}
                  </button>
                </div>
                <textarea 
                  value={cgNotaDT} 
                  onChange={e => setCgNotaDT(e.target.value)}
                  placeholder="Detalles sobre el esfuerzo del equipo, errores a corregir en la semana, etc."
                  className="w-full h-16 rounded-lg border border-white/10 bg-[#0f111a] px-3 py-2 text-xs text-white outline-none resize-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button 
                onClick={handleGenerateChronicle}
                disabled={cgLoading}
                className="w-full bg-gradient-primary text-white text-xs font-bold gap-1.5 shadow-elegant"
              >
                <Sparkles className="h-4 w-4" /> {cgLoading ? "Redactando crónica..." : "Redactar Crónica con IA"}
              </Button>

              {cgOutput && (
                <div className="mt-4 space-y-3.5 border-t border-slate-200 dark:border-white/5 pt-4">
                  <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/5">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">📢 Crónica Lista para WhatsApp</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-[10px] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 gap-1 font-bold"
                      onClick={() => {
                        navigator.clipboard.writeText(cgOutput);
                        toast.success("Crónica copiada al portapapeles");
                      }}
                    >
                      Copiar Mensaje
                    </Button>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] text-slate-800 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-[180px] overflow-y-auto">
                    {cgOutput}
                  </div>

                  {/* Wall publishing options */}
                  <div className="p-3.5 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/10 space-y-3.5">
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>📢 Publicar Crónica en el Muro de la Academia</span>
                    </p>
                    
                    {/* Image selector */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f111a] border border-slate-300 dark:border-white/10 hover:border-primary/50 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />
                          <span>{cgImage ? "Cambiar Foto" : "Subir Foto del Partido"}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleCgImageChange} 
                            className="hidden" 
                          />
                        </label>
                        {cgImage && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 hover:bg-slate-200 dark:hover:bg-white/10 text-red-500"
                            onClick={() => setCgImage(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {cgImage && (
                        <div className="relative w-full max-w-[200px] h-[120px] rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
                          <img src={cgImage} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Publish Button */}
                    <Button 
                      onClick={handlePublishToWall}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                    >
                      Aceptar y Publicar en el Muro
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: ANÁLISIS MODULAR */}
      {activeTab === "analisis-modular" && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-white/5">
            {[
              { id: "jugador", label: "👤 Jugador" },
              { id: "equipo", label: "👥 Equipo" },
              { id: "entrenador", label: "⚽ Entrenador" },
              { id: "financiero", label: "💰 Financiero" },
              { id: "crm", label: "🎯 CRM" },
              { id: "competiciones", label: "🏆 Competiciones" },
              { id: "prioridades", label: "🚨 Prioridades" }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubTab(sub.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  selectedSubTab === sub.id
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/85 hover:text-foreground border border-transparent"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {/* SUBTAB: JUGADOR */}
          {selectedSubTab === "jugador" && (
            <Card className="bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-1.5">👤 Análisis Deportivo Individual</CardTitle>
                  <CardDescription>Visualiza el expediente y métricas del deportista calculadas por el motor analítico.</CardDescription>
                </div>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="bg-[#0f111a] border border-white/10 rounded-lg text-xs p-2 text-white outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="j1">Sofía Rodríguez</option>
                  <option value="j2">Mateo Vargas</option>
                  <option value="j3">Valentina Soto</option>
                  <option value="j4">Santiago Jiménez</option>
                </select>
              </CardHeader>
              <CardContent className="space-y-6">
                {activePlayer ? (
                  <div className="space-y-4">
                    {/* Key Metrics Row */}
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                      <div className="border rounded-xl p-3 bg-white/[0.01]">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Sports Score</p>
                        <p className="text-xl font-bold mt-1 text-emerald-400">96/100</p>
                        <p className="text-[9px] text-muted-foreground">Rango: Excelente</p>
                      </div>
                      <div className="border rounded-xl p-3 bg-white/[0.01]">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">ACWR Ratio</p>
                        <p className="text-xl font-bold mt-1 text-white">{activePlayer.acwr.toFixed(2)}</p>
                        <p className="text-[9px] text-muted-foreground">Semáforo: {activePlayer.semaforo.toUpperCase()}</p>
                      </div>
                      <div className="border rounded-xl p-3 bg-white/[0.01]">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Carga Semanal</p>
                        <p className="text-xl font-bold mt-1 text-white">{activePlayer.cargaSemanal} UA</p>
                        <p className="text-[9px] text-muted-foreground">Microciclo actual</p>
                      </div>
                      <div className="border rounded-xl p-3 bg-white/[0.01]">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Asistencia</p>
                        <p className="text-xl font-bold mt-1 text-white">92%</p>
                        <p className="text-[9px] text-muted-foreground">En las últimas 4 semanas</p>
                      </div>
                    </div>

                    {/* Fatigue & Recovery gauges */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="border rounded-xl p-4 bg-white/[0.01]">
                        <h4 className="text-xs font-bold mb-2 flex items-center justify-between text-white">
                          <span>Índice de Fatiga</span>
                          <span className="text-amber-500 font-bold">{activePlayer.fatigaScore}%</span>
                        </h4>
                        <Progress value={activePlayer.fatigaScore} className="h-2" />
                        <p className="text-[10px] text-muted-foreground mt-2">Calculado a partir de ACWR, horas de sueño y dolor muscular.</p>
                      </div>
                      <div className="border rounded-xl p-4 bg-white/[0.01]">
                        <h4 className="text-xs font-bold mb-2 flex items-center justify-between text-white">
                          <span>Índice de Recuperación</span>
                          <span className="text-emerald-500 font-bold">{activePlayer.recoveryScore}%</span>
                        </h4>
                        <Progress value={activePlayer.recoveryScore} className="h-2" />
                        <p className="text-[10px] text-muted-foreground mt-2">Pondera la calidad del descanso semanal reportado en wellness.</p>
                      </div>
                    </div>

                    {/* Specific Recommendations and Predictions */}
                    <div className="grid gap-4 md:grid-cols-2 border-t pt-4 border-white/5">
                      <div>
                        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-violet-400" /> Recomendaciones IA del Deportista</h4>
                        <div className="space-y-2">
                          {recommendations.filter(r => r.jugadorId === selectedPlayerId).map(r => (
                            <div key={r.id} className="p-3 border border-white/5 bg-white/5 rounded-xl text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white">{r.texto}</span>
                                <Badge variant="outline" className="text-[9px] uppercase">{r.prioridad}</Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{r.explicacion}</p>
                            </div>
                          ))}
                          {recommendations.filter(r => r.jugadorId === selectedPlayerId).length === 0 && (
                            <p className="text-xs text-muted-foreground">No se registran alertas ni recomendaciones pendientes para este atleta.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5"><Activity className="h-4 w-4 text-amber-500" /> Predicciones Fisiológicas</h4>
                        <div className="space-y-2">
                          {predictions.filter(p => p.jugadorId === selectedPlayerId).map(p => (
                            <div key={p.id} className="p-3 border border-white/5 bg-white/5 rounded-xl text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white">{p.explicacion}</span>
                                <Badge className="text-[9px]">{p.probabilidad}% Prob.</Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground">Variables: {p.variables.join(", ")}</p>
                            </div>
                          ))}
                          {predictions.filter(p => p.jugadorId === selectedPlayerId).length === 0 && (
                            <p className="text-xs text-muted-foreground">El atleta se encuentra en parámetros estables en el motor predictivo.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Selecciona un deportista para iniciar el análisis.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* SUBTAB: EQUIPO */}
          {selectedSubTab === "equipo" && (
            <Card className="bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-1.5">👥 Análisis por Categoría / Plantel</CardTitle>
                  <CardDescription>Métricas promedio y estado general de la división.</CardDescription>
                </div>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="bg-[#0f111a] border border-white/10 rounded-lg text-xs p-2 text-white outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Fútbol Sub-10">Fútbol Sub-10</option>
                  <option value="Baloncesto Sub-12">Baloncesto Sub-12</option>
                  <option value="Natación Sub-14">Natación Sub-14</option>
                  <option value="Voleibol Sub-16">Voleibol Sub-16</option>
                </select>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 grid-cols-3">
                  <div className="border rounded-xl p-3 bg-white/[0.01] text-center">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Wellness Promedio</p>
                    <p className="text-xl font-bold mt-1 text-emerald-400">84%</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-white/[0.01] text-center">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Carga Promedio</p>
                    <p className="text-xl font-bold mt-1 text-white">620 UA</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-white/[0.01] text-center">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Asistencia Promedio</p>
                    <p className="text-xl font-bold mt-1 text-white">92.5%</p>
                  </div>
                </div>

                <div className="border rounded-xl p-3 bg-white/[0.01] space-y-2">
                  <h4 className="text-xs font-bold text-white">Recomendación Copilot para la categoría:</h4>
                  <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs">
                    ⚠️ **Aviso de Carga**: Reducir la intensidad del entrenamiento Sub-13 un 20% en las próximas 48 horas debido a fatiga escolar reportada en el wellness grupal.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SUBTAB: ENTRENADOR */}
          {selectedSubTab === "entrenador" && (
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-1.5">⚽ Desempeño Operativo de Entrenadores</CardTitle>
                <CardDescription>Rendimiento, cumplimiento de microciclos y asistencia promedio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {entrenadores.map((e) => (
                  <div key={e.id} className="border rounded-xl p-3 bg-white/[0.01] flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-xs text-white">{e.nombre}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Sede: {e.sedeId}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-right">
                      <div>
                        <p className="text-[9px] uppercase text-muted-foreground">Asistencia</p>
                        <p className="font-bold text-emerald-400">98%</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-muted-foreground">Cumplimiento</p>
                        <p className="font-bold text-white">94%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SUBTAB: FINANCIERO */}
          {selectedSubTab === "financiero" && (
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-1.5">💰 Análisis Financiero & Morosidad</CardTitle>
                <CardDescription>Mensualidades y saldos pendientes en el club.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 grid-cols-2">
                  <div className="border rounded-xl p-3 bg-white/[0.01]">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Recaudado este mes</p>
                    <p className="text-lg font-black mt-1 text-emerald-400">₡{totalRecaudado.toLocaleString("es-CR")}</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-white/[0.01]">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Sede Destacada</p>
                    <p className="text-sm font-bold mt-1 text-white">Sede Central</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Mensualidades Pendientes:</p>
                  <div className="space-y-1.5">
                    {morososList.slice(0, 4).map((p) => (
                      <div key={p.id} className="border rounded-xl p-2.5 bg-white/[0.01] flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-white">{p.jugador}</p>
                          <p className="text-[9px] text-muted-foreground mt-0.5">Ref: {p.referencia}</p>
                        </div>
                        <span className="font-bold text-red-500">₡{p.monto.toLocaleString("es-CR")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SUBTAB: CRM */}
          {selectedSubTab === "crm" && (
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-1.5">🎯 Análisis de Conversión y Captación (CRM)</CardTitle>
                <CardDescription>Prospectos registrados en el embudo y conversiones.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 grid-cols-3 text-center">
                  <div className="border rounded-xl p-3 bg-white/[0.01]">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Prospectos</p>
                    <p className="text-xl font-bold mt-1 text-white">{crmLeads.length}</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-white/[0.01]">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Conversión</p>
                    <p className="text-xl font-bold mt-1 text-emerald-400">{crmConversion}%</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-white/[0.01]">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Campaña Top</p>
                    <p className="text-xs font-bold mt-1.5 text-white truncate">Redes Sociales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SUBTAB: COMPETICIONES */}
          {selectedSubTab === "competiciones" && (
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-1.5">🏆 Análisis de Competiciones</CardTitle>
                <CardDescription>Récord de partidos y puntos acumulados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 grid-cols-4 text-center">
                  <div className="border rounded-xl p-3 bg-white/[0.01]">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Victorias</p>
                    <p className="text-xl font-bold mt-1 text-emerald-400">12</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-white/[0.01]">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Empates</p>
                    <p className="text-xl font-bold mt-1 text-white">4</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-white/[0.01]">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Derrotas</p>
                    <p className="text-xl font-bold mt-1 text-red-500">2</p>
                  </div>
                  <div className="border rounded-xl p-3 bg-white/[0.01]">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Goles</p>
                    <p className="text-xl font-bold mt-1 text-white">38</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SUBTAB: PRIORIDADES */}
          {selectedSubTab === "prioridades" && (
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-1.5">🚨 Motor de Prioridades Inteligente</CardTitle>
                <CardDescription>Clasificación automática de tareas urgentes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {priorities.map((p) => {
                  const badgeCol = p.categoria === "critico" ? "destructive" : p.categoria === "alto" ? "secondary" : "outline";
                  return (
                    <div key={p.id} className="border rounded-xl p-3 bg-white/[0.01] flex items-start justify-between gap-3 text-xs leading-normal">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white">{p.titulo}</p>
                        <p className="text-[10px] text-muted-foreground">{p.detalle}</p>
                      </div>
                      <Badge variant={badgeCol} className="uppercase shrink-0 text-[8px] font-bold">
                        {p.categoria}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB CONTENT: WORKFLOWS */}
      {activeTab === "workflows" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Workflows activos" value={workflowsActivos.toString()} hint={`${workflows.length} totales`} icon={Workflow} accent="primary" />
            <StatCard label="Ejecuciones totales" value={ejecucionesWorkflows.toString()} delta={24} icon={Zap} accent="success" />
            <StatCard label="Ejecuciones exitosas" value="98.2%" hint="últimos 30 días" icon={CheckCircle2} accent="success" />
            <StatCard label="Errores recientes" value="3" hint="requieren revisión" icon={AlertTriangle} accent="destructive" />
          </div>

          <Card className="shadow-card bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Reglas configuradas</CardTitle>
                <CardDescription>Activa, pausa o edita tus automatizaciones.</CardDescription>
              </div>
              <Button size="sm" className="bg-gradient-primary shadow-elegant text-xs font-bold"><Plus className="h-4 w-4" /> Nuevo workflow</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflows.map((w) => (
                  <div key={w.id} className="rounded-lg border bg-card p-4 hover:shadow-elegant transition group">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
                        <Workflow className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-sm text-white">{w.nombre}</p>
                          <Badge variant="secondary" className={`text-[9px] ${workflowEstadoStyle[w.estado] || ""}`}>{w.estado}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-white/70">Si:</span>
                          <Badge variant="outline" className="font-normal text-[10px] text-white/95">{w.trigger}</Badge>
                          <ChevronRight className="h-3 w-3" />
                          <span className="font-medium text-white/70">Entonces:</span>
                          {w.acciones.map((a) => (
                            <Badge key={a} variant="outline" className="font-normal text-[10px] text-white/95">{a}</Badge>
                          ))}
                        </div>
                        <div className="mt-2 text-[10px] text-muted-foreground">
                          {w.ejecuciones} ejecuciones · última {w.ultima}
                        </div>
                      </div>
                      <Switch defaultChecked={w.estado === "activo"} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historial de ejecución</CardTitle>
              <CardDescription>Eventos recientes de los workflows de automatización.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-white/5">
                {workflowLogs.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 py-3 last:pb-0">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${l.estado === "ok" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-white">{l.workflow}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">→ {l.destino} · {l.canal}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{l.fecha}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: CENTRO DE ACTIVIDAD IA */}
      {activeTab === "centro-actividad" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Consultas registradas" value={totalQueries.toString()} hint="total acumulado" icon={FileText} accent="primary" />
            <StatCard label="Tiempo resp. prom." value={`${avgResponseTime}ms`} hint="latencia promedio" icon={Clock4} accent="success" />
            <StatCard label="Ahorro de tiempo" value={`${totalTimeSaved} min`} hint="estimado para el staff" icon={Zap} accent="success" />
            <StatCard label="Costo acumulado API" value={`$${totalCost}`} hint="estimación por tokens" icon={Coins} accent="warning" />
          </div>

          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-1.5">🛡️ Bitácora de Auditoría & Seguridad IA</CardTitle>
              <CardDescription>Registro completo de consultas procesadas, agentes y consumos para cumplimiento normativo.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-muted-foreground">
                  <thead className="text-[10px] uppercase font-bold text-white/70 border-b border-white/5 bg-white/[0.02]">
                    <tr>
                      <th className="p-3">Fecha/Hora</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Consulta</th>
                      <th className="p-3">Agente asignado</th>
                      <th className="p-3">Modelo</th>
                      <th className="p-3 text-right">Tiempo</th>
                      <th className="p-3 text-right">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-3 whitespace-nowrap">{new Date(log.date).toLocaleTimeString("es-CR")}</td>
                        <td className="p-3 capitalize font-semibold text-white/80">{log.userRole}</td>
                        <td className="p-3 max-w-[180px] truncate text-white/90" title={log.query}>{log.query}</td>
                        <td className="p-3"><Badge variant="outline" className="text-[9px] bg-violet-500/10 text-violet-300 border-violet-500/20">{log.agentName}</Badge></td>
                        <td className="p-3 font-mono text-[10px]">{log.modelUsed}</td>
                        <td className="p-3 text-right font-mono">{log.responseTimeMs}ms</td>
                        <td className="p-3 text-right font-mono text-emerald-400">${log.costEstimateUSD}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-xs">Sin registros de auditoría aún. Inicia un chat para poblar la bitácora.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: CONFIGURACIÓN IA */}
      {activeTab === "configuracion-ia" && (
        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-white/5">
              <div>
                <CardTitle className="text-base flex items-center gap-1.5"><Sliders className="h-4.5 w-4.5 text-primary" /> Parámetros del Motor IA</CardTitle>
                <CardDescription>Ajusta el comportamiento, tono y automatizaciones de DeportivOS AI.</CardDescription>
              </div>
              <Button size="sm" onClick={handleSaveConfig} className="bg-gradient-primary text-white font-bold text-xs">Guardar Cambios</Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              {/* Models and Language Settings */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white">Modelo LLM de Orquestación</label>
                  <select
                    value={config.model}
                    onChange={(e) => setLocalConfig({ ...config, model: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-lg text-xs p-2 text-white outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="gpt-4o">GPT-4o (Recomendado - Mayor precisión comercial)</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Recomendado - Explicaciones detalladas)</option>
                    <option value="gemini-1-5-pro">Gemini 1.5 Pro (Óptimo para grandes microciclos)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white">Tono de Respuestas</label>
                  <select
                    value={config.tone}
                    onChange={(e) => setLocalConfig({ ...config, tone: e.target.value })}
                    className="w-full bg-[#0f111a] border border-white/10 rounded-lg text-xs p-2 text-white outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Profesional">Profesional & Técnico (Médico y Fisiológico)</option>
                    <option value="Cercano">Cercano & Motivacional</option>
                    <option value="Directo">Directo & Resumido</option>
                  </select>
                </div>
              </div>

              {/* Toggles for Automations */}
              <div className="space-y-3 border-t border-b border-white/5 py-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Automatizaciones en Segundo Plano</h4>
                
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">Alertas de Wellness Crítico</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Analizar wellness cada 24 horas y notificar al cuerpo médico si es menor a 50.</p>
                  </div>
                  <Switch 
                    checked={config.automationWellness} 
                    onCheckedChange={(val) => setLocalConfig({ ...config, automationWellness: val })} 
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">Recordatorios de Morosidad automáticos</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Enviar WhatsApp de cobranza al tutor el día 5 de cada mes si tiene atraso.</p>
                  </div>
                  <Switch 
                    checked={config.automationMorosidad} 
                    onCheckedChange={(val) => setLocalConfig({ ...config, automationMorosidad: val })} 
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">Notificaciones de Alta Médica (RTP)</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Notificar al entrenador en el Coach OS apenas el médico firme la reincorporación.</p>
                  </div>
                  <Switch 
                    checked={config.automationRTP} 
                    onCheckedChange={(val) => setLocalConfig({ ...config, automationRTP: val })} 
                  />
                </div>
              </div>

              {/* n8n Integration Webhook */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-primary" /> Webhook de Integración n8n / Make</label>
                <Input
                  value={config.webhookUrl}
                  onChange={(e) => setLocalConfig({ ...config, webhookUrl: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder-white/30 text-xs rounded-xl"
                  placeholder="https://n8n.deportivos.os/webhooks/ai"
                />
                <p className="text-[9px] text-muted-foreground mt-1">DeportivOS AI disparará flujos a este endpoint para enviar emails, sincronizar Google Calendar y actualizar Google Drive.</p>
              </div>

              {/* Safety auditing disclaimer */}
              <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3.5 flex gap-2 text-xs text-emerald-300 leading-normal">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Cumplimiento RGPD & LOPD</p>
                  El almacenamiento de configuración no procesa información médica o financiera fuera del entorno encriptado de la sede. DeportivOS respeta los roles asignados por el administrador de la academia.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
export default IADashboard;
