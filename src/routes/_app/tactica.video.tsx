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
      <div className="page-header mb-6 no-print">
        <div className="flex items-center gap-3">
          <div className="icon-box icon-box-warning">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <h1 className="page-header-title">Videoanálisis Táctico</h1>
            <p className="page-header-subtitle">Registra videos · Crea marcas · Genera clips · Analiza con IA</p>
          </div>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" className="btn-secondary gap-1.5" onClick={() => setShowAddVideo(true)}>
            <Plus className="h-4 w-4" /> Registrar Video
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Left: video list */}
        <div className="w-full lg:w-72 shrink-0 space-y-3">
          {/* Filter */}
          <div className="flex gap-1.5 p-1 bg-[#F8F9FA] rounded-[12px] border border-[#E2E8F0] w-fit">
            {(["todos", "partido", "entrenamiento", "rival"] as const).map(f => (
              <button key={f} onClick={() => setFilterTipo(f)} className={`text-[10px] font-extrabold px-3 py-1.5 rounded-[8px] capitalize transition-colors ${filterTipo === f ? "bg-[#2563EB] text-white shadow-sm" : "text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"}`}>
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
                className={`w-full text-left p-3.5 rounded-[12px] border transition-colors ${activeSelectedId === v.id ? "border-[#2563EB] bg-blue-50/50 shadow-sm" : "border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]"}`}
              >
                <div className="flex items-start gap-2">
                  <div className="shrink-0 h-8 w-8 rounded-[8px] bg-blue-50 flex items-center justify-center text-[#2563EB]">
                    <Play className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0F172A] text-xs truncate">{v.titulo}</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5 font-medium">{v.fecha} · {fmtTime(v.duracion)}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-[4px] font-bold ${tipoCfg.color}`}>{tipoCfg.label}</span>
                      <span className="text-[9px] text-[#64748B] font-bold">{v.marcas.length} marcas · {v.clips.length} clips</span>
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
            <Card className="premium-card p-0">
              <CardContent className="p-0 overflow-hidden rounded-[12px]">
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
            <div className="flex items-start justify-between gap-4 flex-wrap bg-white p-4 rounded-[12px] border border-[#E2E8F0]">
              <div>
                <h2 className="font-bold text-[#0F172A] text-base leading-snug">{selected.titulo}</h2>
                <p className="text-sm text-[#475569] mt-1 leading-relaxed">{selected.descripcion}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {selected.etiquetas.map(e => (
                    <span key={e} className="text-[10px] bg-slate-100 border border-[#E2E8F0] px-2 py-0.5 rounded-[4px] text-[#64748B] font-semibold">{e}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="btn-secondary text-xs gap-1.5" onClick={() => setShowAddMarker(true)}>
                  <Flag className="h-4 w-4 text-[#2563EB]" /> + Marca
                </Button>
                <Button size="sm" variant="outline" className="btn-secondary text-xs gap-1.5" onClick={() => setShowAddClip(true)}>
                  <Scissors className="h-4 w-4 text-violet-500" /> + Clip
                </Button>
              </div>
            </div>

            {/* Tabs: Marcas / Clips */}
            <div className="flex gap-1 p-1 bg-[#F8F9FA] rounded-[12px] border border-[#E2E8F0] w-fit">
              <button onClick={() => setActiveTab("marcas")} className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors ${activeTab === "marcas" ? "bg-[#2563EB] text-white shadow-sm" : "text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"}`}>
                <Flag className="h-4 w-4" /> Marcas ({selected.marcas.length})
              </button>
              <button onClick={() => setActiveTab("clips")} className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors ${activeTab === "clips" ? "bg-[#2563EB] text-white shadow-sm" : "text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"}`}>
                <Scissors className="h-4 w-4" /> Clips ({selected.clips.length})
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
                  <Card className="premium-card">
                    <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                      <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5"><Flag className="h-4 w-4 text-[#2563EB]" /> Nueva Marca</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-[#64748B] font-bold block mb-1">Tiempo (min:seg o seg)</label>
                          <input type="number" placeholder="Segundos" value={markerForm.tiempo} onChange={e => setMarkerForm(f => ({ ...f, tiempo: Number(e.target.value) }))}
                            className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-[#64748B] font-bold block mb-1">Categoría</label>
                          <select value={markerForm.categoria} onChange={e => setMarkerForm(f => ({ ...f, categoria: e.target.value as VideoMarkerCategory }))}
                            className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none">
                            {Object.entries(MARKER_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <input placeholder="Descripción *" value={markerForm.descripcion} onChange={e => setMarkerForm(f => ({ ...f, descripcion: e.target.value }))}
                        className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none" />
                      <input placeholder="Notas adicionales (opcional)" value={markerForm.notas} onChange={e => setMarkerForm(f => ({ ...f, notas: e.target.value }))}
                        className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none" />
                      <div className="flex gap-2">
                        <Button size="sm" className="btn-primary flex-1" onClick={handleAddMarker}>Guardar Marca</Button>
                        <Button size="sm" variant="outline" className="btn-secondary" onClick={() => setShowAddMarker(false)}>Cancelar</Button>
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
                  <Card className="premium-card">
                    <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                      <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5"><Scissors className="h-4 w-4 text-violet-500" /> Nuevo Clip</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-4 space-y-3">
                      <input placeholder="Título del clip *" value={clipForm.titulo} onChange={e => setClipForm(f => ({ ...f, titulo: e.target.value }))}
                        className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-[#64748B] font-bold block mb-1">Inicio (seg)</label>
                          <input type="number" value={clipForm.inicio} onChange={e => setClipForm(f => ({ ...f, inicio: Number(e.target.value) }))}
                            className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-[#64748B] font-bold block mb-1">Fin (seg)</label>
                          <input type="number" value={clipForm.fin} onChange={e => setClipForm(f => ({ ...f, fin: Number(e.target.value) }))}
                            className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none" />
                        </div>
                      </div>
                      <input placeholder="Comentario (opcional)" value={clipForm.comentario} onChange={e => setClipForm(f => ({ ...f, comentario: e.target.value }))}
                        className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none" />
                      <div className="flex gap-2">
                        <Button size="sm" className="btn-primary flex-1 bg-violet-600 hover:bg-violet-700" onClick={handleAddClip}>Crear Clip</Button>
                        <Button size="sm" variant="outline" className="btn-secondary" onClick={() => setShowAddClip(false)}>Cancelar</Button>
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
          <Card className="premium-card w-full max-w-md shadow-2xl p-0">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-[#E2E8F0]">
              <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-2"><Video className="h-4 w-4 text-[#2563EB]" /> Registrar Video</CardTitle>
              <button className="text-[#64748B] hover:text-[#0F172A] text-xs font-bold" onClick={() => setShowAddVideo(false)}>✕ Cerrar</button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-3">
              <input placeholder="Título *" value={videoForm.titulo} onChange={e => setVideoForm(f => ({ ...f, titulo: e.target.value }))}
                className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
              <input placeholder="URL (YouTube embed o video URL) *" value={videoForm.url} onChange={e => setVideoForm(f => ({ ...f, url: e.target.value }))}
                className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
              <textarea placeholder="Descripción" value={videoForm.descripcion} onChange={e => setVideoForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full h-20 rounded-[8px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] outline-none resize-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Fecha (YYYY-MM-DD)" value={videoForm.fecha} onChange={e => setVideoForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
                <select value={videoForm.tipo} onChange={e => setVideoForm(f => ({ ...f, tipo: e.target.value as VideoAnalysis["tipo"] }))}
                  className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]">
                  <option value="partido">Partido</option>
                  <option value="entrenamiento">Entrenamiento</option>
                  <option value="rival">Rival</option>
                </select>
              </div>
              <input placeholder="Etiquetas (separadas por coma)" value={videoForm.etiquetas} onChange={e => setVideoForm(f => ({ ...f, etiquetas: e.target.value }))}
                className="w-full h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]" />
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="btn-primary flex-1" onClick={handleAddVideo}>Registrar Video</Button>
                <Button size="sm" variant="outline" className="btn-secondary" onClick={() => setShowAddVideo(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default VideoAnalisisTactico;
