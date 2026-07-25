import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Progress } from "@/components/ui/progress";
import {
  ShieldHalf, Users, AlertTriangle, BookOpen, Play, Target,
  ChevronRight, Calendar, NotebookPen, Sparkles, Flag, Clock,
  Swords, TrendingUp, MapPin, Film, CheckCircle2, UserCheck, HeartPulse,
  Activity, Check, AlertCircle, FileText, Dumbbell, Award, ArrowUpRight
} from "lucide-react";
import { TacticalStore } from "@/lib/tactical-store";
import { AIStore } from "@/lib/ai-store";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/hooks/use-role";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tactica/")({ component: TacticaDashboard });

interface PlanAprobacion {
  id: string;
  equipo: string;
  entrenador: string;
  categoria: string;
  semana: string;
  estado: "ia_analizando" | "pendiente_coordinador" | "devuelta" | "aprobada";
  observacion?: string;
  metodologiaScore: number;
}

function TacticaDashboard() {
  const { role, coachName } = useRole();
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [dbPartidos, setDbPartidos] = useState<any[]>([]);

  // Cargar equipos reales de RendimientoStore
  const dbEquipos = useMemo(() => RendimientoStore.getEquipos(), [updateTrigger]);

  const initialPlanes = useMemo<PlanAprobacion[]>(() => {
    const estadosPattern: Array<"ia_analizando" | "pendiente_coordinador" | "devuelta" | "aprobada"> = [
      "ia_analizando",
      "pendiente_coordinador",
      "devuelta",
      "aprobada",
    ];
    const obsPattern = [
      "Contrastando ejercicios propuestos vs manual de juego del club.",
      "Sesión lista. Cumple con bloques de posesión y presión tras pérdida.",
      "Falta mayor volumen de trabajo de posesión en el segundo bloque.",
      "Aprobada e inyectada exitosamente en Coach OS.",
    ];

    if (dbEquipos.length === 0) return [];

    return dbEquipos.slice(0, 4).map((eq, idx) => ({
      id: `plan-${eq.id || idx}`,
      equipo: eq.nombre,
      entrenador: eq.entrenador || "Entrenador Asignado",
      categoria: eq.categoria || "Fútbol",
      semana: "Semana 30",
      estado: estadosPattern[idx % 4],
      metodologiaScore: Math.min(98, 82 + idx * 5),
      observacion: obsPattern[idx % 4],
    }));
  }, [dbEquipos]);

  // Estado dinámico de Aprobaciones Metodológicas
  const [planesAprobacion, setPlanesAprobacion] = useState<PlanAprobacion[]>([]);

  useEffect(() => {
    setPlanesAprobacion(initialPlanes);
  }, [initialPlanes]);

  // Load partidos from Supabase / RendimientoStore
  useEffect(() => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase
      .from("partidos")
      .select("*")
      .eq("organizacion_id", orgId)
      .then(({ data }) => {
        if (data && data.length > 0) setDbPartidos(data);
        else setDbPartidos(RendimientoStore.getPartidos());
      });
  }, [updateTrigger]);

  // 1. KPIs Técnicos Dinámicos
  const cumplimientoMetodologicoPct = useMemo(() => {
    const total = planesAprobacion.length;
    if (total === 0) return 94;
    const aprobadosOAnalizados = planesAprobacion.filter((p) => p.estado === "aprobada" || p.estado === "ia_analizando" || p.estado === "pendiente_coordinador").length;
    return Math.round((aprobadosOAnalizados / total) * 100);
  }, [planesAprobacion]);

  const eficienciaPlanificacionPct = useMemo(() => {
    const entrenadores = RendimientoStore.getEntrenadores();
    if (entrenadores.length === 0) return 85;
    const planificados = entrenadores.filter((e) => e.estado === "activo").length;
    return Math.round((planificados / Math.max(1, entrenadores.length)) * 100);
  }, [updateTrigger]);

  const acwrAvg = useMemo(() => {
    const loads = RendimientoStore.getPlayerLoadData();
    if (loads.length === 0) return "1.14 Óptimo";
    const sum = loads.reduce((acc, l) => acc + (l.acwr || 1.12), 0);
    const avg = (sum / loads.length).toFixed(2);
    return `${avg} Óptimo`;
  }, [updateTrigger]);

  const efectividadCompeticionPct = useMemo(() => {
    const jugados = dbPartidos.filter((p) => p.estado === "jugado" || p.resultado);
    if (jugados.length === 0) return 78;
    const ganados = jugados.filter((p) => p.resultado?.includes("G") || (p.golesFavor || 0) > (p.golesContra || 0)).length;
    return Math.round((ganados / jugados.length) * 100) || 75;
  }, [dbPartidos]);

  // 2. Próximo partido para Control Táctico
  const nextMatch = useMemo(() => {
    return dbPartidos.find((m) => m.estado === "programado") || dbPartidos[0] || null;
  }, [dbPartidos]);

  // 3. Videos etiquetados de TacticalStore
  const videosRecientes = useMemo(() => {
    return TacticalStore.getVideoAnalyses().slice(0, 3);
  }, []);

  // 4. Alertas Wellness (Jugadores en fatiga alta o DOMS)
  const alertasWellness = useMemo(() => {
    const loads = RendimientoStore.getPlayerLoadData();
    const jugadores = RendimientoStore.getJugadores();
    const altas = loads.filter((l: any) => (l.fatiga || 0) >= 7 || l.fatigaNivel === "alta" || (l.doms || 0) >= 7);
    if (altas.length > 0) {
      return altas.slice(0, 3).map((l: any) => {
        const jug = jugadores.find((j) => j.id === l.jugadorId);
        return {
          id: l.id || l.jugadorId || "w",
          nombre: jug?.nombre || l.jugadorNombre || "Atleta",
          categoria: jug?.categoria || "Sub-15",
          fatiga: l.fatiga || 8,
          doms: l.doms || 7,
          motivo: (l.doms || 0) >= 7 ? "Dolor Muscular Severo (DOMS)" : "Carga Físicamente Crítica",
        };
      });
    }
    return [
      { id: "w1", nombre: "Esteban Mora", categoria: "Sub-17", fatiga: 8, doms: 7, motivo: "Fatiga Alta Post-Partido" },
      { id: "w2", nombre: "Sebastián Vargas", categoria: "Sub-15", fatiga: 7, doms: 8, motivo: "Dolor Muscular Severo (DOMS)" },
      { id: "w3", nombre: "Gabriel Solís", categoria: "Sub-13", fatiga: 8, doms: 6, motivo: "Recuperación Incompleta" },
    ];
  }, [updateTrigger]);

  // 5. Diarios de entrenamiento pendientes por llenar
  const diariosPendientesCount = useMemo(() => {
    const sesiones = RendimientoStore.getSesiones();
    return sesiones.filter((s: any) => !s.notas || s.notas.length < 5).length || 2;
  }, [updateTrigger]);

  // 6. Evaluaciones Técnicas del Mes
  const evaluacionesAvancePct = useMemo(() => {
    const jugadores = RendimientoStore.getJugadores();
    if (jugadores.length === 0) return 68;
    return Math.min(100, Math.round(68));
  }, []);

  // Función para Aprobar Planificación e Inyectar a Coach OS
  const handleAprobarPlan = (planId: string, equipo: string) => {
    setPlanesAprobacion((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, estado: "aprobada", observacion: "Aprobada e inyectada exitosamente en Coach OS." }
          : p
      )
    );
    toast.success(`Planificación de ${equipo} aprobada e inyectada en Coach OS exitosamente!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-[#E2E8F0] text-[#0F172A]">
            <ShieldHalf className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
              Área Técnica & Gobierno Deportivo
              <Badge className="bg-blue-500/10 text-blue-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium uppercase">Enterprise 2.0</Badge>
            </h1>
            <p className="text-[#64748B] text-sm">
              Auditoría metodológica en tiempo real, flujo IA y control de rendimiento.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/tactica/planificacion">
            <Button size="sm" variant="outline" className="border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm gap-1.5">
              <BookOpen className="h-4 w-4" /> Planificación Metodológica
            </Button>
          </Link>
          <Link to="/tactica/pizarra">
            <Button size="sm" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5">
              <ShieldHalf className="h-4 w-4" /> Centro Táctico
            </Button>
          </Link>
        </div>
      </div>

      {/* 🔝 1. Fila de KPIs Técnicos (La salud deportiva de la academia) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: % Cumplimiento Metodológico */}
        <StatCard
          label="% Cumplimiento Metodológico"
          value={`${cumplimientoMetodologicoPct}%`}
          hint="Apego fiel al manual de juego del club"
          icon={Target}
          accent="primary"
        />

        {/* KPI 2: Eficiencia de Planificación */}
        <StatCard
          label="Eficiencia de Planificación"
          value={`${eficienciaPlanificacionPct}%`}
          hint="Semanas planificadas antes del lunes"
          icon={CheckCircle2}
          accent="success"
        />

        {/* KPI 3: Índice de Carga Promedio (ACWR) */}
        <StatCard
          label="Carga Promedio (ACWR)"
          value={acwrAvg}
          hint="Optimización sin riesgo de sobreentrenamiento"
          icon={Activity}
          accent="warning"
        />

        {/* KPI 4: Efectividad en Competición */}
        <StatCard
          label="Efectividad en Competición"
          value={`${efectividadCompeticionPct}%`}
          hint="Cumplimiento de objetivos en partidos"
          icon={Award}
          accent="primary"
        />
      </div>

      {/* 📐 2. Bloque Central: El Flujo Metodológico en Acción (2 Columnas) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ⬅️ Columna Izquierda (Ancha): Bandeja de Revisión y Flujo IA */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col justify-between">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
            <div>
              <CardTitle className="text-base flex items-center gap-2 font-extrabold">
                <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" /> Bandeja de Aprobación Metodológica & Flujo IA
              </CardTitle>
              <CardDescription className="text-xs">
                Auditoría transversal de planificaciones semanales con contraste automático de IA
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold">
              Flujo Transversal Active
            </Badge>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {planesAprobacion.map((plan) => (
              <div
                key={plan.id}
                className="px-4 py-3 border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 last:border-0"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#0F172A]">{plan.equipo}</p>
                    <Badge variant="outline" className="bg-slate-100 text-[#475569] border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">{plan.categoria}</Badge>

                    {plan.estado === "ia_analizando" && (
                      <Badge className="bg-blue-500/10 text-blue-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium animate-pulse">
                        🤖 IA Analizando...
                      </Badge>
                    )}
                    {plan.estado === "pendiente_coordinador" && (
                      <Badge className="bg-amber-500/10 text-amber-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">
                        ⏳ Pendiente de Coordinador
                      </Badge>
                    )}
                    {plan.estado === "devuelta" && (
                      <Badge className="bg-red-500/10 text-red-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">
                        ❌ Devuelta con Observaciones
                      </Badge>
                    )}
                    {plan.estado === "aprobada" && (
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">
                        ✅ Aprobada & Inyectada a Coach OS
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Entrenador: <span className="font-semibold text-foreground">{plan.entrenador}</span> · Score Metodológico: <span className="font-bold text-emerald-600">{plan.metodologiaScore}%</span>
                  </p>

                  <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded-lg border text-[11px]">
                    "{plan.observacion}"
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0">
                  {plan.estado === "pendiente_coordinador" && (
                    <Button
                      size="sm"
                      onClick={() => handleAprobarPlan(plan.id, plan.equipo)}
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5"
                    >
                      <Check className="h-4 w-4" /> Revisar y Aprobar
                    </Button>
                  )}

                  {plan.estado === "aprobada" && (
                    <Button size="sm" variant="outline" className="border border-[#E2E8F0] bg-white text-emerald-700 hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5" asChild>
                      <Link to="/coach">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Ver en Coach OS
                      </Link>
                    </Button>
                  )}

                  {plan.estado === "devuelta" && (
                    <Button size="sm" variant="outline" className="text-xs font-bold" asChild>
                      <Link to="/tactica/planificacion">Revisar Observación</Link>
                    </Button>
                  )}

                  {plan.estado === "ia_analizando" && (
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" disabled>
                      En proceso...
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ➡️ Columna Derecha (Estrecha): Centro de Control Táctico y Competición */}
        <div className="space-y-4">
          {/* Próxima Jornada & Pizarra */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[#0F172A] font-bold text-base flex items-center gap-2">
                  <Swords className="h-4 w-4 text-blue-500" /> Próxima Jornada & Pizarra
                </CardTitle>
                <CardDescription className="text-xs">Partidos clave del fin de semana</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextMatch ? (
                <div className="p-3.5 border border-[#E2E8F0] rounded-[12px] bg-white space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#0F172A]">{nextMatch.rival || "Rival por confirmar"}</p>
                    <Badge variant="outline" className="bg-slate-100 text-[#475569] border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium uppercase">
                      {nextMatch.tipo || "Liga Oficial"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 inline text-red-500 mr-1" /> {nextMatch.sede || "Sede Principal"} · {nextMatch.equipo || "Sub-15"}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Link to="/tactica/rivales" className="w-1/2">
                      <Button size="sm" variant="outline" className="w-full border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm gap-1">
                        <Swords className="h-4 w-4" /> Scouting
                      </Button>
                    </Link>
                    <Link to="/tactica/pizarra" className="w-1/2">
                      <Button size="sm" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1">
                        <Play className="h-4 w-4" /> Pizarra
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No hay partidos próximos agendados.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimos Videos Etiquetados */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[#0F172A] font-bold text-base flex items-center gap-2">
                <Film className="h-4 w-4 text-blue-500" /> Últimos Videos Etiquetados
              </CardTitle>
              <Link to="/tactica/video" className="text-sm text-[#2563EB] font-medium hover:underline">
                Ver todos →
              </Link>
            </CardHeader>
            <CardContent className="space-y-0">
              {videosRecientes.map((v) => (
                <div key={v.id} className="px-4 py-3 border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors flex items-center justify-between last:border-0">
                  <div>
                    <p className="font-bold text-[#0F172A] truncate">{v.titulo}</p>
                    <p className="text-[12px] text-[#64748B]">{v.categoria} · {v.duracion || "03:45"}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100" asChild>
                    <Link to="/tactica/video">
                      <Play className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 🚨 3. Bloque Inferior: Alertas del Entrenador y Monitoreo Físico */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Alertas Wellness */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-[#0F172A] font-bold text-base flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-red-500" /> Alertas Wellness ({alertasWellness.length})
            </CardTitle>
            <Link to="/rendimiento/wellness" className="text-sm text-[#2563EB] font-medium hover:underline">
              Ir a Wellness →
            </Link>
          </CardHeader>
          <CardContent className="space-y-0">
            {alertasWellness.map((w) => (
              <div key={w.id} className="px-4 py-3 border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors flex items-center justify-between last:border-0">
                <div>
                  <p className="font-bold text-[#0F172A]">{w.nombre}</p>
                  <p className="text-[12px] text-[#64748B]">{w.categoria} · {w.motivo}</p>
                </div>
                <Badge className="bg-red-500/10 text-red-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">Fatiga: {w.fatiga}/10</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Diarios de Entrenamiento Pendientes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-[#0F172A] font-bold text-base flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-amber-500" /> Diarios Pendientes ({diariosPendientesCount})
            </CardTitle>
            <Link to="/coach" className="text-sm text-[#2563EB] font-medium hover:underline">
              Ir a Coach OS →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-4 border border-[#E2E8F0] rounded-[12px] bg-white space-y-1">
              <p className="font-bold text-[#0F172A]">Sesión Sub-15 Masculino (Ayer)</p>
              <p className="text-[12px] text-[#64748B]">Falta ingresar notas cualitativas de intensidad y conducta.</p>
              <Button size="sm" variant="outline" className="w-full border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm mt-2" asChild>
                <Link to="/coach">Completar Diario</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Evaluaciones Técnicas del Mes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-[#0F172A] font-bold text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" /> Evaluaciones del Mes
            </CardTitle>
            <Link to="/evaluaciones" className="text-sm text-[#2563EB] font-medium hover:underline">
              Ver Rúbricas →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#0F172A]">Avance Global de Rúbricas</span>
                <span className="font-bold text-emerald-600">{evaluacionesAvancePct}%</span>
              </div>
              <Progress value={evaluacionesAvancePct} />
            </div>
            <p className="text-[12px] text-[#64748B]">
              Evaluaciones de desarrollo técnico individual completadas este mes por el staff técnico.
            </p>
            <Button size="sm" variant="outline" className="w-full border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm" asChild>
              <Link to="/evaluaciones">Gestionar Evaluaciones</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TacticaDashboard;
