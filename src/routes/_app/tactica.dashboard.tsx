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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-elegant">
            <ShieldHalf className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              📐 Dashboard Táctico & Historial
              <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] uppercase">
                Enterprise 2.0
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Control de pizarras guardadas, estrategias de balón parado y videoanálisis de la academia.
            </p>
          </div>
        </div>

        {/* 🎨 Botones de Acción Rápida */}
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            className="bg-gradient-primary text-white font-extrabold text-xs h-11 px-4 shadow-elegant rounded-xl gap-2"
          >
            <Link to="/tactica/pizarra">
              <Plus className="h-4 w-4 stroke-[3]" /> ➕ NUEVA PIZARRA TÁCTICA
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="font-extrabold text-xs h-11 px-4 border-slate-300 dark:border-slate-800 hover:border-primary gap-2"
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
        <Card className="lg:col-span-2 shadow-card flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div>
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-500" /> 🎨 Últimas Pizarras y Sistemas Editados
              </CardTitle>
              <CardDescription className="text-xs">
                Acceso directo con vista previa para dar clic e ir al lienzo interactivo
              </CardDescription>
            </div>
            <Link to="/tactica/pizarra" className="text-xs text-primary font-bold hover:underline">
              Ir a Pizarra →
            </Link>
          </CardHeader>

          <CardContent className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPizarras.map((piz) => (
                <div
                  key={piz.id}
                  className="group rounded-xl border bg-card hover:bg-muted/40 transition overflow-hidden flex flex-col justify-between p-3 space-y-3"
                >
                  <div
                    className={`h-28 rounded-lg bg-gradient-to-br ${piz.aspectoColor} border flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform`}
                  >
                    <div className="absolute inset-2 border border-white/20 rounded-md flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full border border-white/20 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-white uppercase tracking-wider relative z-10 bg-black/40 px-2 py-0.5 rounded backdrop-blur">
                      {piz.sistema}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-extrabold text-xs text-foreground group-hover:text-primary transition line-clamp-1">
                      {piz.titulo}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Modificado {piz.modificado} por <span className="text-foreground font-bold">{piz.autor}</span>
                    </p>
                    <Badge variant="outline" className="text-[9px] font-semibold bg-primary/5">
                      {piz.equipo}
                    </Badge>
                  </div>

                  <Button size="sm" variant="outline" className="w-full text-xs font-bold gap-1 mt-1" asChild>
                    <Link to="/tactica/pizarra">
                      <ShieldHalf className="h-3 w-3 text-primary" /> Editar Pizarra
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Columna Derecha: Videoteca */}
        <Card className="shadow-card flex flex-col justify-between">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-extrabold flex items-center gap-2">
                <Video className="h-4 w-4 text-teal-500" /> 📺 Videoteca & Clips Recortados
              </CardTitle>
              <CardDescription className="text-xs">Feed vertical de scouting</CardDescription>
            </div>
            <Link to="/tactica/video" className="text-xs text-primary font-semibold hover:underline">
              Ver todos →
            </Link>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {filteredVideos.map((v) => (
              <div key={v.id} className="p-3 rounded-xl border bg-muted/30 hover:bg-muted transition space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-xs text-foreground leading-snug">{v.titulo}</p>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold shrink-0">
                    {v.tipo}
                  </Badge>
                </div>

                <Badge className={`text-[10px] font-bold ${v.statusColor}`}>
                  {v.statusLabel}
                </Badge>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                  <span>Procesado: {v.fecha}</span>
                  <Link to="/tactica/video" className="font-bold text-primary hover:underline flex items-center gap-0.5">
                    Ver clips <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 🚨 3. Bloque Inferior: Biblioteca Rápida y Buscador IA */}
      <Card className="shadow-card border bg-card">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" /> 🚨 Biblioteca Rápida por Concepto Táctico & Buscador IA
          </CardTitle>
          <CardDescription className="text-xs">
            Filtra de inmediato pizarras, jugadas y videoanálisis sin navegar por carpetas
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="🔍 Buscador IA: Ej. 'Pizarras de la Sub-15 que usen sistema 3-5-2'..."
              className="pl-10 h-11 text-xs font-medium bg-muted/30 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground">Filtros Rápidos por Concepto:</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={activeTag === null ? "default" : "outline"}
                onClick={() => setActiveTag(null)}
                className="text-xs font-extrabold rounded-lg h-8"
              >
                Todos
              </Button>

              {["Transición Ofensiva", "Bloque Bajo", "Presión Alta", "Saques de Banda", "Balón Parado"].map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={activeTag === t ? "default" : "outline"}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className="text-xs font-bold rounded-lg h-8 border-slate-300 dark:border-slate-800"
                >
                  [ {t} ]
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
