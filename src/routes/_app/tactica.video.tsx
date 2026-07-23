import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { jugadores } from "@/lib/mock-data";
import {
  TacticalStore, VideoAnalysis, VideoMarker, VideoClip,
  VideoMarkerCategory,
} from "@/lib/tactical-store";
import RendimientoStore from "@/lib/rendimiento-store";
import {
  Video, Plus, Play, Flag, Scissors, ChevronRight,
  Clock, Tag, Users, Bookmark, Share2, Filter,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tactica/video")({ component: VideoAnalisisTactico });

const MARKER_CONFIG: Record<VideoMarkerCategory, { label: string; color: string; emoji: string }> = {
  gol:          { label: "Gol",           color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", emoji: "⚽" },
  error:        { label: "Error",         color: "bg-red-500/20 text-red-300 border-red-500/30",            emoji: "❌" },
  recuperacion: { label: "Recuperación",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30",         emoji: "🔵" },
  presion:      { label: "Presión",       color: "bg-amber-500/20 text-amber-300 border-amber-500/30",      emoji: "💪" },
  contraataque: { label: "Contraataque",  color: "bg-violet-500/20 text-violet-300 border-violet-500/30",   emoji: "⚡" },
  falta:        { label: "Falta",         color: "bg-orange-500/20 text-orange-300 border-orange-500/30",   emoji: "🟡" },
  tarjeta:      { label: "Tarjeta",       color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",   emoji: "🟨" },
  lesion:       { label: "Lesión",        color: "bg-rose-500/20 text-rose-300 border-rose-500/30",         emoji: "🩹" },
};

const TIPO_CONFIG = {
  partido:        { label: "Partido",        color: "bg-violet-500/20 text-violet-300" },
  entrenamiento:  { label: "Entrenamiento",  color: "bg-blue-500/20 text-blue-300" },
  rival:          { label: "Rival",          color: "bg-red-500/20 text-red-300" },
};

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function VideoAnalisisTactico() {
  const [customVideos, setCustomVideos] = useState<VideoAnalysis[]>(() => TacticalStore.getVideoAnalyses());
  const dbPartidos = RendimientoStore.getPartidos();
  const opponentsList = TacticalStore.getOpponents();
  const opponentName = opponentsList[0]?.nombre || "Club Heredia FC";

  const videos = useMemo(() => {
    const demoVideos: VideoAnalysis[] = [
      {
        id: "demo-vid-1",
        titulo: `Análisis vs ${opponentName}`,
        descripcion: "Análisis del partido de liga. Enfoque en la presión alta en salida y transiciones rápidas.",
        fecha: "2026-07-05",
        equipo: "Sub-15",
        categoria: "Sub-15",
        tipo: "partido",
        etiquetas: ["presión", "transición", "análisis"],
        autor: "Carlos Méndez",
        duracion: 5400,
        url: "https://www.youtube.com/embed/mjq4ApnRtrI",
        marcas: [
          { id: "mk-demo-1", tiempo: 180,  descripcion: "Presión alta efectiva en salida del rival", categoria: "presion", notas: "Recuperación en 8 segundos" },
          { id: "mk-demo-2", tiempo: 1250, descripcion: "Error defensivo en el lateral izquierdo", categoria: "error", notas: "Cubrir la espalda del lateral" },
          { id: "mk-demo-3", tiempo: 2100, descripcion: "Gol de contraataque — excelente transición", categoria: "contraataque", notas: "3 toques, del portero al 9" }
        ],
        clips: [
          { id: "cl-demo-1", titulo: "Secuencia de presión minuto 3", inicio: 160, fin: 200, comentarios: ["Referencia para el entreno del martes"], compartido: true }
        ]
      },
      {
        id: "demo-vid-2",
        titulo: "Sesión táctica — Sistemática defensiva",
        descripcion: "Grabación del entrenamiento. Trabajo de basculación y línea de 4 defensores.",
        fecha: "2026-07-08",
        equipo: "Sub-15",
        categoria: "Sub-15",
        tipo: "entrenamiento",
        etiquetas: ["defensa", "línea", "entrenamiento"],
        autor: "Andrés Pérez",
        duracion: 3600,
        url: "https://www.youtube.com/embed/mjq4ApnRtrI",
        marcas: [
          { id: "mk-demo-4", tiempo: 420, descripcion: "Buena basculación defensiva tras pase lateral", categoria: "presion", notas: "Mantener la distancia entre líneas" }
        ],
        clips: []
      },
      {
        id: "demo-vid-3",
        titulo: "Scouting de Oponente — Bloque Bajo del Rival",
        descripcion: "Análisis del parado táctico y transiciones del próximo rival en liga.",
        fecha: "2026-07-10",
        equipo: "Sub-15",
        categoria: "Sub-15",
        tipo: "rival",
        etiquetas: ["scouting", "rival", "bloque-bajo"],
        autor: "Carlos Méndez",
        duracion: 4800,
        url: "https://www.youtube.com/embed/mjq4ApnRtrI",
        marcas: [
          { id: "mk-demo-5", tiempo: 600, descripcion: "Estructura defensiva 5-4-1 del oponente", categoria: "presion", notas: "Cierran los carriles interiores" }
        ],
        clips: []
      }
    ];

    const dynamicVids: VideoAnalysis[] = dbPartidos.map((m, idx) => {
      const stored = customVideos.find(v => v.id === `db-vid-${m.id}`);
      return {
        id: `db-vid-${m.id}`,
        titulo: `Análisis vs ${m.rival || "Rival"}`,
        descripcion: `Análisis táctico del partido contra ${m.rival || "Rival"} jugado el ${m.fecha}. Enfoque en transiciones y posicionamiento.`,
        fecha: m.fecha,
        equipo: m.equipo,
        categoria: m.categoria || "General",
        tipo: "partido" as const,
        etiquetas: ["análisis", "partido", m.rival].filter(Boolean) as string[],
        autor: m.entrenador || "Director Técnico",
        duracion: 5400,
        url: stored?.url || "https://www.youtube.com/embed/mjq4ApnRtrI",
        marcas: stored?.marcas || [
          { id: `mk-${m.id}-1`, tiempo: 320,  descripcion: "Presión coordinada en salida", categoria: "presion" as const, notas: "Buen posicionamiento del bloque medio" },
          { id: `mk-${m.id}-2`, tiempo: 1450, descripcion: "Transición ofensiva rápida", categoria: "contraataque" as const, notas: "Pase vertical efectivo" }
        ],
        clips: stored?.clips || []
      };
    });

    const filteredCustom = customVideos.filter(v => v.id !== "vid1" && v.id !== "vid2" && !v.id.startsWith("db-vid-"));
    return [...demoVideos, ...dynamicVids, ...filteredCustom];
  }, [dbPartidos, customVideos, opponentName]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeSelectedId = selectedId || videos[0]?.id || null;

  const [activeTab, setActiveTab] = useState<"marcas" | "clips">("marcas");
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [showAddClip, setShowAddClip] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [filterTipo, setFilterTipo] = useState<"todos" | "partido" | "entrenamiento" | "rival">("todos");

  // New marker form
  const [markerForm, setMarkerForm] = useState({ tiempo: 0, descripcion: "", categoria: "presion" as VideoMarkerCategory, jugadorId: "", notas: "" });
  // New clip form
  const [clipForm, setClipForm] = useState({ titulo: "", inicio: 0, fin: 0, comentario: "" });
  // New video form
  const [videoForm, setVideoForm] = useState({ titulo: "", descripcion: "", fecha: "", equipo: "Sub-15", categoria: "Sub-15", etiquetas: "", autor: "Carlos Méndez", url: "", tipo: "partido" as VideoAnalysis["tipo"] });

  const selected = videos.find(v => v.id === activeSelectedId) ?? videos[0];
  const filteredVideos = filterTipo === "todos" ? videos : videos.filter(v => v.tipo === filterTipo);

  const handleAddMarker = () => {
    if (!activeSelectedId || !markerForm.descripcion) { toast.error("Completa los campos requeridos"); return; }
    const marker: VideoMarker = {
      id: `mk-${Date.now()}`,
      tiempo: markerForm.tiempo,
      descripcion: markerForm.descripcion,
      categoria: markerForm.categoria,
      jugadorId: markerForm.jugadorId || undefined,
      notas: markerForm.notas || undefined,
    };
    TacticalStore.addVideoMarker(activeSelectedId, marker);
    setCustomVideos(TacticalStore.getVideoAnalyses());
    setMarkerForm({ tiempo: 0, descripcion: "", categoria: "presion", jugadorId: "", notas: "" });
    setShowAddMarker(false);
    toast.success("Marca añadida correctamente");
  };

  const handleAddClip = () => {
    if (!activeSelectedId || !clipForm.titulo || clipForm.fin <= clipForm.inicio) { toast.error("Verifica el rango del clip"); return; }
    const clip: VideoClip = {
      id: `cl-${Date.now()}`,
      titulo: clipForm.titulo,
      inicio: clipForm.inicio,
      fin: clipForm.fin,
      comentarios: clipForm.comentario ? [clipForm.comentario] : [],
      compartido: false,
    };
    TacticalStore.addVideoClip(activeSelectedId, clip);
    setCustomVideos(TacticalStore.getVideoAnalyses());
    setClipForm({ titulo: "", inicio: 0, fin: 0, comentario: "" });
    setShowAddClip(false);
    toast.success("Clip creado correctamente");
  };

  const handleAddVideo = () => {
    if (!videoForm.titulo || !videoForm.url) { toast.error("Título y URL son requeridos"); return; }
    const nv: VideoAnalysis = {
      id: `vid-${Date.now()}`,
      ...videoForm,
      etiquetas: videoForm.etiquetas.split(",").map(e => e.trim()).filter(Boolean),
      duracion: 3600,
      marcas: [],
      clips: [],
    };
    TacticalStore.saveVideoAnalysis(nv);
    setCustomVideos(TacticalStore.getVideoAnalyses());
    setSelectedId(nv.id);
    setShowAddVideo(false);
    toast.success("Video registrado correctamente");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-elegant">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Videoanálisis Táctico</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Registra videos · Crea marcas · Genera clips · Analiza con IA</p>
          </div>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" className="text-xs border-slate-350 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-700 dark:bg-slate-900 dark:text-slate-200 gap-1.5 rounded-xl shadow-elegant" onClick={() => setShowAddVideo(true)}>
            <Plus className="h-3.5 w-3.5" /> Registrar Video
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Left: video list */}
        <div className="w-full lg:w-72 shrink-0 space-y-3">
          {/* Filter */}
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80 w-fit">
            {(["todos", "partido", "entrenamiento", "rival"] as const).map(f => (
              <button key={f} onClick={() => setFilterTipo(f)} className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg capitalize transition-all ${filterTipo === f ? "bg-gradient-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"}`}>
                {f}
              </button>
            ))}
          </div>

          {filteredVideos.map(v => {
            const tipoCfg = TIPO_CONFIG[v.tipo];
            return (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${activeSelectedId === v.id ? "border-amber-400 dark:border-amber-500/50 bg-amber-50/60 dark:bg-slate-900/60 shadow-elegant" : "border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-900"}`}
              >
                <div className="flex items-start gap-2">
                  <div className="shrink-0 h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Play className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate">{v.titulo}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">{v.fecha} · {fmtTime(v.duracion)}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${tipoCfg.color}`}>{tipoCfg.label}</span>
                      <span className="text-[8px] text-slate-500 dark:text-slate-450 font-bold">{v.marcas.length} marcas · {v.clips.length} clips</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredVideos.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">
              <Video className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No hay videos registrados
            </div>
          )}
        </div>

        {/* Right: video detail */}
        {selected ? (
          <div className="flex-1 space-y-4">
            {/* Video embed */}
            <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800 shadow-card">
              <CardContent className="p-0 overflow-hidden rounded-xl">
                <div className="relative aspect-video bg-black">
                  <iframe
                    src={selected.url}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selected.titulo}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Video info */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">{selected.titulo}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-semibold">{selected.descripcion}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {selected.etiquetas.map(e => (
                    <span key={e} className="text-[9px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-semibold">{e}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="text-xs border-slate-300 hover:border-slate-400 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 gap-1.5 rounded-lg font-bold" onClick={() => setShowAddMarker(true)}>
                  <Flag className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" /> + Marca
                </Button>
                <Button size="sm" variant="outline" className="text-xs border-slate-300 hover:border-slate-400 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 gap-1.5 rounded-lg font-bold" onClick={() => setShowAddClip(true)}>
                  <Scissors className="h-3.5 w-3.5 text-violet-650 dark:text-violet-450" /> + Clip
                </Button>
              </div>
            </div>

            {/* Tabs: Marcas / Clips */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border w-fit">
              <button onClick={() => setActiveTab("marcas")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "marcas" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
                <Flag className="h-3.5 w-3.5" /> Marcas ({selected.marcas.length})
              </button>
              <button onClick={() => setActiveTab("clips")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === "clips" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"}`}>
                <Scissors className="h-3.5 w-3.5" /> Clips ({selected.clips.length})
              </button>
            </div>

            {/* Marcas list */}
            {activeTab === "marcas" && (
              <div className="space-y-2">
                {selected.marcas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    <Flag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No hay marcas. Haz clic en <strong>+ Marca</strong> para agregar.
                  </div>
                ) : (
                  [...selected.marcas].sort((a, b) => a.tiempo - b.tiempo).map(mk => {
                    const cfg = MARKER_CONFIG[mk.categoria];
                    return (
                      <div key={mk.id} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.color}`}>
                        <div className="text-sm font-mono font-bold shrink-0 opacity-80">{fmtTime(mk.tiempo)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-bold uppercase">{cfg.emoji} {cfg.label}</span>
                            {mk.jugadorId && <span className="text-[9px] opacity-75">{jugadores.find(j => j.id === mk.jugadorId)?.nombre ?? mk.jugadorId}</span>}
                          </div>
                          <p className="text-xs font-semibold mt-0.5">{mk.descripcion}</p>
                          {mk.notas && <p className="text-[10px] opacity-75 mt-0.5 italic">{mk.notas}</p>}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Add Marker form */}
                {showAddMarker && (
                  <Card className="bg-card border-amber-500/20">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs text-white flex items-center gap-1.5"><Flag className="h-3.5 w-3.5 text-amber-400" /> Nueva Marca</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Tiempo (min:seg)</label>
                          <input type="number" placeholder="Segundos" value={markerForm.tiempo} onChange={e => setMarkerForm(f => ({ ...f, tiempo: Number(e.target.value) }))}
                            className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Categoría</label>
                          <select value={markerForm.categoria} onChange={e => setMarkerForm(f => ({ ...f, categoria: e.target.value as VideoMarkerCategory }))}
                            className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none">
                            {Object.entries(MARKER_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <input placeholder="Descripción *" value={markerForm.descripcion} onChange={e => setMarkerForm(f => ({ ...f, descripcion: e.target.value }))}
                        className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none" />
                      <input placeholder="Notas adicionales (opcional)" value={markerForm.notas} onChange={e => setMarkerForm(f => ({ ...f, notas: e.target.value }))}
                        className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none" />
                      <div className="flex gap-2">
                        <Button size="sm" className="text-xs flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleAddMarker}>Guardar Marca</Button>
                        <Button size="sm" variant="outline" className="text-xs border-white/10 text-muted-foreground" onClick={() => setShowAddMarker(false)}>Cancelar</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Clips list */}
            {activeTab === "clips" && (
              <div className="space-y-2">
                {selected.clips.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    <Scissors className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No hay clips. Usa <strong>+ Clip</strong> para generar uno.
                  </div>
                ) : (
                  selected.clips.map(cl => (
                    <div key={cl.id} className="flex items-start gap-3 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
                      <Scissors className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-white text-xs">{cl.titulo}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtTime(cl.inicio)} → {fmtTime(cl.fin)}</p>
                        {cl.comentarios.map((c, i) => <p key={i} className="text-[10px] text-muted-foreground italic mt-1">💬 {c}</p>)}
                      </div>
                      {cl.compartido && <Share2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                    </div>
                  ))
                )}

                {showAddClip && (
                  <Card className="bg-card border-violet-500/20">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-xs text-white flex items-center gap-1.5"><Scissors className="h-3.5 w-3.5 text-violet-400" /> Nuevo Clip</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <input placeholder="Título del clip *" value={clipForm.titulo} onChange={e => setClipForm(f => ({ ...f, titulo: e.target.value }))}
                        className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none" />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">Inicio (seg)</label>
                          <input type="number" value={clipForm.inicio} onChange={e => setClipForm(f => ({ ...f, inicio: Number(e.target.value) }))}
                            className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">Fin (seg)</label>
                          <input type="number" value={clipForm.fin} onChange={e => setClipForm(f => ({ ...f, fin: Number(e.target.value) }))}
                            className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none" />
                        </div>
                      </div>
                      <input placeholder="Comentario (opcional)" value={clipForm.comentario} onChange={e => setClipForm(f => ({ ...f, comentario: e.target.value }))}
                        className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white outline-none" />
                      <div className="flex gap-2">
                        <Button size="sm" className="text-xs flex-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleAddClip}>Crear Clip</Button>
                        <Button size="sm" variant="outline" className="text-xs border-white/10 text-muted-foreground" onClick={() => setShowAddClip(false)}>Cancelar</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            <div className="text-center space-y-2">
              <Video className="h-12 w-12 mx-auto opacity-20" />
              <p>Selecciona un video para analizarlo</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Video modal */}
      {showAddVideo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-foreground flex items-center gap-2"><Video className="h-4 w-4 text-amber-500" /> Registrar Video</CardTitle>
              <button className="text-muted-foreground hover:text-foreground text-xs" onClick={() => setShowAddVideo(false)}>✕ Cerrar</button>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <input placeholder="Título *" value={videoForm.titulo} onChange={e => setVideoForm(f => ({ ...f, titulo: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none" />
              <input placeholder="URL (YouTube embed o video URL) *" value={videoForm.url} onChange={e => setVideoForm(f => ({ ...f, url: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none" />
              <textarea placeholder="Descripción" value={videoForm.descripcion} onChange={e => setVideoForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full h-16 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Fecha (YYYY-MM-DD)" value={videoForm.fecha} onChange={e => setVideoForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none" />
                <select value={videoForm.tipo} onChange={e => setVideoForm(f => ({ ...f, tipo: e.target.value as VideoAnalysis["tipo"] }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none">
                  <option value="partido" className="text-foreground bg-background">Partido</option>
                  <option value="entrenamiento" className="text-foreground bg-background">Entrenamiento</option>
                  <option value="rival" className="text-foreground bg-background">Rival</option>
                </select>
              </div>
              <input placeholder="Etiquetas (separadas por coma)" value={videoForm.etiquetas} onChange={e => setVideoForm(f => ({ ...f, etiquetas: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none" />
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs" onClick={handleAddVideo}>Registrar Video</Button>
                <Button size="sm" variant="outline" className="border-border text-muted-foreground text-xs" onClick={() => setShowAddVideo(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default VideoAnalisisTactico;
