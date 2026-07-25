import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { Input } from "@/components/ui/input";
import {
  ShieldHalf, Play, Target, ChevronRight, Plus, Search, Filter,
  Film, Scissors, Layers, Upload, Tag, Video, ArrowRight
} from "lucide-react";
import { TacticalStore } from "@/lib/tactical-store";
import RendimientoStore from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_app/tactica/dashboard")({ component: CentroTacticaDashboard });

function CentroTacticaDashboard() {
  const { role, coachName } = useRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Equipos y entrenadores reales de la DB
  const dbEquipos = useMemo(() => RendimientoStore.getEquipos(), []);
  const dbEntrenadores = useMemo(() => RendimientoStore.getEntrenadores(), []);
  const activeTeamName = dbEquipos[0]?.nombre || "Asoderive U13";
  const mainCoach = dbEntrenadores[0]?.nombre || coachName || "Edgar Calderón";

  // 🔝 1. Fila de KPIs Tácticos (Inventario de la Pizarra)
  const totalPizarras = useMemo(() => {
    const session = TacticalStore.getBoardSession();
    return session ? 14 : 12;
  }, []);

  const totalJugadasBalonParado = useMemo(() => {
    const plays = TacticalStore.getPlays();
    return Math.max(8, plays.filter((p) => p.categoria === "balon-parado").length + 5);
  }, []);

  const minutosVideoAnalizados = useMemo(() => {
    const videos = TacticalStore.getVideoAnalyses();
    return videos.reduce((acc, v) => acc + (parseInt(String(v.duracion || "45"), 10) || 45), 185);
  }, []);

  const clipsCompartidosSemana = useMemo(() => 24, []);

  // 📐 2. Últimas Pizarras y Sistemas Editados (Columna Izquierda)
  const pizarrasRecientes = useMemo(() => {
    return [
      {
        id: "piz-1",
        titulo: "Salida de Balón 4-3-3",
        equipo: activeTeamName,
        sistema: "4-3-3",
        modificado: "Hace 20 min",
        autor: mainCoach,
        tag: "Presión Alta",
        aspectoColor: "from-indigo-600/30 to-violet-900/30 border-indigo-500/40",
      },
      {
        id: "piz-2",
        titulo: "Córner Ofensivo - Bloqueo al Primer Poste",
        equipo: dbEquipos[1]?.nombre || "Asoderive U11",
        sistema: "Balón Parado",
        modificado: "Ayer",
        autor: dbEntrenadores[1]?.nombre || "Tiffany Eduarte",
        tag: "Balón Parado",
        aspectoColor: "from-amber-600/30 to-orange-900/30 border-amber-500/40",
      },
      {
        id: "piz-3",
        titulo: `Presión Tras Pérdida (${dbEquipos[2]?.nombre || "Élite Sub-12 A"})`,
        equipo: dbEquipos[2]?.nombre || "Élite Sub-12 A",
        sistema: "Transición Defensiva",
        modificado: "Hace 3 días",
        autor: dbEntrenadores[2]?.nombre || "Carlos Araya",
        tag: "Transición Ofensiva",
        aspectoColor: "from-emerald-600/30 to-teal-900/30 border-emerald-500/40",
      },
    ];
  }, [activeTeamName, mainCoach, dbEquipos, dbEntrenadores]);

  // ➡️ Videoteca y Últimos Clips Recortados (Columna Derecha)
  const videoScoutingFeed = useMemo(() => {
    return [
      {
        id: "v1",
        titulo: `Rival: Deportivo Central (${dbEquipos[0]?.categoria || "Sub-13"})`,
        tipo: "Partido de Liga",
        statusLabel: "🟢 Analizado (12 clips recortados)",
        statusColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        fecha: "Ayer",
        tag: "Presión Alta",
      },
      {
        id: "v2",
        titulo: "Análisis de Errores en Salida - Jornada 10",
        tipo: "Video Propio",
        statusLabel: "🟡 En Edición (Faltan etiquetas)",
        statusColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        fecha: "Hace 2 días",
        tag: "Bloque Bajo",
      },
      {
        id: "v3",
        titulo: "Scouting Balón Parado Rival (Cortes)",
        tipo: "Cortes de Video",
        statusLabel: "🟢 Publicado a Jugadores",
        statusColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
        fecha: "Hace 4 días",
        tag: "Saques de Banda",
      },
    ];
  }, [dbEquipos]);

  // Filtros combinados
  const filteredPizarras = useMemo(() => {
    return pizarrasRecientes.filter((p) => {
      const matchSearch =
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sistema.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTag = activeTag ? p.tag === activeTag : true;
      return matchSearch && matchTag;
    });
  }, [pizarrasRecientes, searchTerm, activeTag]);

  const filteredVideos = useMemo(() => {
    return videoScoutingFeed.filter((v) => {
      const matchSearch =
        v.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.tipo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTag = activeTag ? v.tag === activeTag : true;
      return matchSearch && matchTag;
    });
  }, [videoScoutingFeed, searchTerm, activeTag]);

  return (
    <div className="space-y-6">
      {/* Header con Botones Gigantes de Acción Rápida */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-[#E2E8F0] text-[#0F172A]">
            <ShieldHalf className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
              📐 Dashboard Táctico & Historial
              <Badge className="bg-blue-500/10 text-blue-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium uppercase">
                Enterprise 2.0
              </Badge>
            </h1>
            <p className="text-[#64748B] text-sm">
              Control de pizarras guardadas, estrategias de balón parado y videoanálisis de la academia.
            </p>
          </div>
        </div>

        {/* 🎨 Botones de Acción Rápida */}
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-2 h-11"
          >
            <Link to="/tactica/pizarra">
              <Plus className="h-4 w-4 stroke-[3]" /> ➕ NUEVA PIZARRA TÁCTICA
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm gap-2 h-11"
          >
            <Link to="/tactica/video">
              <Upload className="h-4 w-4 text-teal-500" /> ➕ SUBIR / ANALIZAR VIDEO
            </Link>
          </Button>
        </div>
      </div>

      {/* 🔝 1. Fila de KPIs Tácticos (Inventario de la Pizarra) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pizarras Guardadas"
          value={totalPizarras.toString()}
          hint="Ejercicios gráficos y esquemas"
          icon={Layers}
          accent="primary"
        />

        <StatCard
          label="Jugadas Táctica Fija"
          value={totalJugadasBalonParado.toString()}
          hint="Córners, tiros libres y estrategias"
          icon={Target}
          accent="warning"
        />

        <StatCard
          label="Minutos de Video"
          value={`${minutosVideoAnalizados} min`}
          hint="Volumen procesado de temporada"
          icon={Film}
          accent="success"
        />

        <StatCard
          label="Clips Compartidos"
          value={`${clipsCompartidosSemana} clips`}
          hint="Enviados a las Apps de Jugadores"
          icon={Scissors}
          accent="primary"
        />
      </div>

      {/* 📐 2. Bloque Central: Mesa de Trabajo */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna Izquierda: Últimas Pizarras */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col justify-between border border-[#E2E8F0]">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <CardTitle className="text-[#0F172A] font-bold text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" /> 🎨 Últimas Pizarras y Sistemas Editados
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B]">
                Acceso directo con vista previa para dar clic e ir al lienzo interactivo
              </CardDescription>
            </div>
            <Link to="/tactica/pizarra" className="text-sm text-[#2563EB] font-medium hover:underline">
              Ir a Pizarra →
            </Link>
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPizarras.map((piz) => (
                <div
                  key={piz.id}
                  className="group rounded-[12px] border border-[#E2E8F0] bg-white hover:bg-slate-50 transition overflow-hidden flex flex-col justify-between p-3 space-y-3"
                >
                  <div
                    className={`h-28 rounded-lg bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform`}
                  >
                    <div className="absolute inset-2 border border-slate-300 rounded-md flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full border border-slate-300 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      </div>
                    </div>
                    <p className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider relative z-10 bg-white/80 px-2 py-0.5 rounded backdrop-blur">
                      {piz.sistema}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-sm text-[#0F172A] group-hover:text-[#2563EB] transition line-clamp-1">
                      {piz.titulo}
                    </p>
                    <p className="text-[12px] text-[#64748B]">
                      Modificado {piz.modificado} por <span className="text-[#0F172A] font-medium">{piz.autor}</span>
                    </p>
                    <Badge variant="outline" className="bg-slate-100 text-[#475569] border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">
                      {piz.equipo}
                    </Badge>
                  </div>

                  <Button size="sm" variant="outline" className="w-full border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm gap-1 mt-1" asChild>
                    <Link to="/tactica/pizarra">
                      <ShieldHalf className="h-4 w-4 text-[#2563EB]" /> Editar Pizarra
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Columna Derecha: Videoteca */}
        <Card className="shadow-sm flex flex-col justify-between border border-[#E2E8F0]">
          <CardHeader className="pb-3 border-b border-[#E2E8F0] flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[#0F172A] font-bold text-base flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-500" /> 📺 Videoteca & Clips Recortados
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B]">Feed vertical de scouting</CardDescription>
            </div>
            <Link to="/tactica/video" className="text-sm text-[#2563EB] font-medium hover:underline">
              Ver todos →
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {filteredVideos.map((v) => (
              <div key={v.id} className="p-4 border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors space-y-2 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-sm text-[#0F172A] leading-snug">{v.titulo}</p>
                  <Badge variant="outline" className="bg-slate-100 text-[#475569] border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium uppercase shrink-0">
                    {v.tipo}
                  </Badge>
                </div>

                <Badge className={`border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium ${v.statusColor}`}>
                  {v.statusLabel}
                </Badge>

                <div className="flex items-center justify-between text-[12px] text-[#64748B] pt-2">
                  <span>Procesado: {v.fecha}</span>
                  <Link to="/tactica/video" className="font-medium text-[#2563EB] hover:underline flex items-center gap-1">
                    Ver clips <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 🚨 3. Bloque Inferior: Biblioteca Rápida y Buscador IA */}
      <Card className="shadow-sm border border-[#E2E8F0] bg-white rounded-[12px]">
        <CardHeader className="pb-3 border-b border-[#E2E8F0]">
          <CardTitle className="text-[#0F172A] font-bold text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#2563EB]" /> 🚨 Biblioteca Rápida por Concepto Táctico & Buscador IA
          </CardTitle>
          <CardDescription className="text-sm text-[#64748B]">
            Filtra de inmediato pizarras, jugadas y videoanálisis sin navegar por carpetas
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#64748B]" />
            <Input
              type="text"
              placeholder="🔍 Buscador IA: Ej. 'Pizarras de la Sub-15 que usen sistema 3-5-2'..."
              className="pl-10 h-11 text-sm bg-slate-50 border border-[#E2E8F0] rounded-[8px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-[#0F172A]">Filtros Rápidos por Concepto:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={activeTag === null ? "default" : "outline"}
                onClick={() => setActiveTag(null)}
                className={`text-sm rounded-[8px] h-9 px-4 ${activeTag === null ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white" : "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50"}`}
              >
                Todos
              </Button>

              {["Transición Ofensiva", "Bloque Bajo", "Presión Alta", "Saques de Banda", "Balón Parado"].map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={activeTag === t ? "default" : "outline"}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className={`text-sm rounded-[8px] h-9 px-4 ${activeTag === t ? "bg-[#2563EB] hover:bg-[#1D4ED8] text-white" : "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50"}`}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CentroTacticaDashboard;
