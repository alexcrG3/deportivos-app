import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TacticalStore, TacticalLibraryItem, TacticalTemplate,
  LibraryCategory, LibraryPermission,
} from "@/lib/tactical-store";
import {
  BookOpen, Plus, Filter, Search, Download, Share2,
  Dumbbell, Layers, Video, FileText, Layout, BookMarked,
  Star, Eye, Edit2, Copy, Printer, Sparkles, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/tactica/biblioteca")({ component: BibliotecaTactica });

const CATEGORY_CONFIG: Record<LibraryCategory, { label: string; icon: string; color: string }> = {
  ejercicio:    { label: "Ejercicio",    icon: "🏃", color: "bg-blue-500/20 text-blue-350 dark:text-blue-300 border-blue-500/30" },
  jugada:       { label: "Jugada",       icon: "⚽", color: "bg-violet-500/20 text-violet-350 dark:text-violet-300 border-violet-500/30" },
  sesion:       { label: "Sesión",       icon: "📅", color: "bg-emerald-500/20 text-emerald-350 dark:text-emerald-300 border-emerald-500/30" },
  video:        { label: "Video",        icon: "🎬", color: "bg-amber-500/20 text-amber-350 dark:text-amber-300 border-amber-500/30" },
  pdf:          { label: "PDF",          icon: "📄", color: "bg-red-500/20 text-red-350 dark:text-red-300 border-red-500/30" },
  presentacion: { label: "Presentación", icon: "📊", color: "bg-cyan-500/20 text-cyan-350 dark:text-cyan-300 border-cyan-500/30" },
  diagrama:     { label: "Diagrama",     icon: "🗺️", color: "bg-rose-500/20 text-rose-350 dark:text-rose-300 border-rose-500/30" },
  plantilla:    { label: "Plantilla",    icon: "📋", color: "bg-teal-500/20 text-teal-350 dark:text-teal-300 border-teal-500/30" },
};

const PERMISSION_CONFIG: Record<LibraryPermission, { label: string; icon: string; color: string }> = {
  lectura:  { label: "Solo lectura", icon: "👁️", color: "bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/30" },
  edicion:  { label: "Editable",     icon: "✏️", color: "bg-blue-500/20 text-blue-550 dark:text-blue-300 border-blue-500/30" },
  duplicar: { label: "Duplicable",   icon: "📋", color: "bg-emerald-500/20 text-emerald-550 dark:text-emerald-300 border-emerald-500/30" },
};

const NIVEL_CONFIG = {
  basico:      { label: "Básico",      color: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" },
  intermedio:  { label: "Intermedio",  color: "bg-amber-500/20 text-amber-700 dark:text-amber-300" },
  avanzado:    { label: "Avanzado",    color: "bg-red-500/20 text-red-700 dark:text-red-300" },
};

function BibliotecaTactica() {
  const [items, setItems] = useState<TacticalLibraryItem[]>(() => TacticalStore.getTacticalLibrary());
  const [templates] = useState<TacticalTemplate[]>(() => TacticalStore.getTacticalTemplates());
  const [activeTab, setActiveTab] = useState<"contenido" | "plantillas">("contenido");
  const [filterCat, setFilterCat] = useState<LibraryCategory | "todos">("todos");
  const [filterNivel, setFilterNivel] = useState<"todos" | "basico" | "intermedio" | "avanzado">("todos");
  const [searchQ, setSearchQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [activePreviewItem, setActivePreviewItem] = useState<TacticalLibraryItem | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [newItem, setNewItem] = useState<Partial<TacticalLibraryItem>>({
    categoria: "ejercicio", nivel: "basico", disciplina: "Fútbol",
    categoriaEdad: "General", compartido: false, permisos: "lectura",
  });

  const filteredItems = items.filter(item => {
    if (filterCat !== "todos" && item.categoria !== filterCat) return false;
    if (filterNivel !== "todos" && item.nivel !== filterNivel) return false;
    if (searchQ && !item.titulo.toLowerCase().includes(searchQ.toLowerCase()) && !item.descripcion.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const getDisplayAuthor = (autor: string) => {
    const coaches = RendimientoStore.getEntrenadores();
    if (coaches.length === 0) return "Administrador";
    
    // Check if the author is a default mockup name
    if (autor === "Carlos Méndez" || autor === "Andrés Pérez" || autor === "Ricardo Mora" || autor === "Sistema") {
      if (autor === "Andrés Pérez" && coaches.length > 1) {
        return coaches[1].nombre;
      }
      if (autor === "Ricardo Mora" && coaches.length > 2) {
        return coaches[2].nombre;
      }
      return coaches[0].nombre;
    }
    return autor;
  };

  const handleAddItem = () => {
    if (!newItem.titulo || !newItem.descripcion) { toast.error("Completa título y descripción"); return; }
    const coaches = RendimientoStore.getEntrenadores();
    const item: TacticalLibraryItem = {
      id: `lib-${Date.now()}`,
      categoria: newItem.categoria as LibraryCategory,
      titulo: newItem.titulo ?? "",
      descripcion: newItem.descripcion ?? "",
      disciplina: newItem.disciplina ?? "Fútbol",
      categoriaEdad: newItem.categoriaEdad ?? "General",
      nivel: newItem.nivel as TacticalLibraryItem["nivel"],
      objetivo: newItem.objetivo ?? "",
      autor: coaches[0]?.nombre ?? "Administrador",
      fecha: new Date().toISOString().split("T")[0],
      etiquetas: [],
      compartido: false,
      permisos: newItem.permisos as LibraryPermission,
    };
    TacticalStore.saveTacticalLibraryItem(item);
    setItems(TacticalStore.getTacticalLibrary());
    setNewItem({ categoria: "ejercicio", nivel: "basico", disciplina: "Fútbol", categoriaEdad: "General", compartido: false, permisos: "lectura" });
    setShowAdd(false);
    toast.success("Ítem agregado a la biblioteca");
  };

  const handleShare = (id: string) => {
    toast.info("Enlace de compartición copiado al portapapeles");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-elegant animate-pulse-slow">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Biblioteca Táctica Institucional
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Repositorio premium de recursos tácticos para el cuerpo técnico y metodológico.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-slate-300 hover:border-slate-400 dark:border-slate-700/80 dark:hover:border-slate-600 bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 gap-1.5 rounded-xl shadow-elegant"
            onClick={() => { window.print(); toast.info("Preparando exportación..."); }}
          >
            <Printer className="h-3.5 w-3.5" /> Exportar Biblioteca
          </Button>
          <Button
            size="sm"
            className="text-xs bg-gradient-primary text-white gap-1.5 shadow-elegant rounded-xl hover:opacity-90 font-bold"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Agregar Recurso
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800/80 w-fit shadow-elegant">
        <button
          onClick={() => setActiveTab("contenido")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === "contenido"
              ? "bg-gradient-primary text-white shadow-elegant"
              : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Layers className="h-3.5 w-3.5" /> Recursos de Campo ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("plantillas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === "plantillas"
              ? "bg-gradient-primary text-white shadow-elegant"
              : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Layout className="h-3.5 w-3.5" /> Plantillas Organizacionales ({templates.length})
        </button>
      </div>

      {activeTab === "contenido" && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-100/70 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800/60 rounded-2xl shadow-elegant flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                placeholder="Buscar recursos en la biblioteca..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/60 pl-10 pr-4 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-150"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Categoría:</span>
                <select
                  value={filterCat}
                  onChange={e => setFilterCat(e.target.value as typeof filterCat)}
                  className="h-9 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 text-xs text-slate-800 dark:text-slate-300 outline-none focus:ring-1 focus:ring-violet-500/40"
                >
                  <option value="todos" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">Todas</option>
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                    <option key={k} value={k} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Complejidad:</span>
                <select
                  value={filterNivel}
                  onChange={e => setFilterNivel(e.target.value as typeof filterNivel)}
                  className="h-9 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/80 px-3 text-xs text-slate-800 dark:text-slate-300 outline-none focus:ring-1 focus:ring-violet-500/40"
                >
                  <option value="todos" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">Todos los niveles</option>
                  <option value="basico" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">🟢 Básico</option>
                  <option value="intermedio" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">💡 Intermedio</option>
                  <option value="avanzado" className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">🔥 Avanzado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mr-1">Filtros Rápidos:</span>
            <button
              onClick={() => setFilterCat("todos")}
              className={`text-[10px] px-3.5 py-1.5 rounded-xl border font-bold transition-all duration-200 ${
                filterCat === "todos"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 border-slate-900 dark:border-slate-100 shadow"
                  : "text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900"
              }`}
            >
              Ver Todo
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setFilterCat(k as LibraryCategory)}
                className={`text-[10px] px-3.5 py-1.5 rounded-xl border font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  filterCat === k
                    ? "bg-gradient-primary text-white border-violet-500 shadow-elegant"
                    : "text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900"
                }`}
              >
                <span>{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 py-16 text-center shadow-inner">
              <CardContent className="space-y-3">
                <div className="h-12 w-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500 shadow">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-300">No se encontraron recursos</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Prueba cambiando los términos de búsqueda o removiendo los filtros seleccionados.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map(item => {
                const catCfg = CATEGORY_CONFIG[item.categoria];
                const permCfg = PERMISSION_CONFIG[item.permisos];
                const nivelCfg = NIVEL_CONFIG[item.nivel];
                const getActionButtonText = () => {
                  if (item.categoria === "video") return "Reproducir Video";
                  if (item.categoria === "pdf") return "Ver Documento";
                  if (item.categoria === "presentacion") return "Abrir Presentación";
                  if (item.categoria === "diagrama") return "Ver Diagrama";
                  if (item.categoria === "ejercicio" || item.categoria === "jugada") return "Ver Pizarra Táctica";
                  return "Ver Recurso";
                };

                return (
                  <Card
                    key={item.id}
                    className="bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between shadow-card hover:shadow-elegant"
                  >
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catCfg.color}`}>
                            {catCfg.icon} {catCfg.label}
                          </span>
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${nivelCfg.color}`}>
                            {nivelCfg.label}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug line-clamp-2">
                            {item.titulo}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                            {item.descripcion}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 space-y-3">
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-lg border ${permCfg.color} flex items-center gap-1`}>
                            {permCfg.icon} {permCfg.label}
                          </span>
                          {item.compartido && (
                            <span className="text-[8px] font-bold px-2 py-0.5 rounded-lg border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-0.5">
                              🌐 Red Club
                            </span>
                          )}
                          {item.objetivo && (
                            <span className="text-[8px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                              🎯 {item.objetivo}
                            </span>
                          )}
                        </div>
                        {item.etiquetas.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {item.etiquetas.map(e => (
                              <span key={e} className="text-[8px] bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 px-2 py-0.5 rounded-md text-slate-500 dark:text-slate-400 font-semibold">
                                #{e}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className="bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-900 p-4 space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">{item.disciplina} · {item.categoriaEdad}</span>
                        <span>Por: {getDisplayAuthor(item.autor)}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        <Button
                          variant="outline"
                          className="col-span-4 text-[10px] font-extrabold h-7 border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg gap-1"
                          onClick={() => { setActivePreviewItem(item); setCurrentSlideIndex(0); }}
                        >
                          <Eye className="h-3 w-3 text-slate-400" /> {getActionButtonText()}
                        </Button>
                        <Button
                          variant="outline"
                          className="col-span-1 h-7 px-0 border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg flex items-center justify-center"
                          onClick={() => handleShare(item.id)}
                          title="Compartir recurso"
                        >
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "plantillas" && (
        <div className="space-y-4">
          <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/40 w-fit font-medium">
            📋 Formatos estandarizados para la unificación de criterios técnicos y análisis del club.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map(tpl => (
              <Card
                key={tpl.id}
                className="bg-white dark:bg-[#0b0e14] border border-slate-200 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-0.5 group relative flex flex-col justify-between shadow-card hover:shadow-elegant"
              >
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-teal-600 to-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-5 space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-inner">
                      <Layout className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {tpl.nombre}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {tpl.tipo} · {getDisplayAuthor(tpl.autor)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {tpl.descripcion}
                  </p>
                </CardContent>
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 border-t border-slate-100 dark:border-slate-900/80 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] font-bold h-8 border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 gap-1.5 flex-1 rounded-lg"
                    onClick={() => toast.info("Generando documento desde plantilla...")}
                  >
                    <Copy className="h-3.5 w-3.5 text-slate-400" /> Usar Formato
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-8 px-2 border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg flex items-center justify-center"
                    onClick={() => toast.info("Descargando plantilla de impresión...")}
                    title="Descargar plantilla"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white dark:bg-card border-border w-full max-w-lg shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-foreground flex items-center gap-2"><Plus className="h-4 w-4 text-teal-500" /> Agregar a la Biblioteca</CardTitle>
              <button className="text-muted-foreground hover:text-foreground text-xs" onClick={() => setShowAdd(false)}>✕ Cerrar</button>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Categoría</label>
                  <select value={newItem.categoria} onChange={e => setNewItem(n => ({ ...n, categoria: e.target.value as LibraryCategory }))}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none">
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k} className="text-foreground bg-background">{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Nivel</label>
                  <select value={newItem.nivel} onChange={e => setNewItem(n => ({ ...n, nivel: e.target.value as TacticalLibraryItem["nivel"] }))}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none">
                    <option value="basico" className="text-foreground bg-background">Básico</option>
                    <option value="intermedio" className="text-foreground bg-background">Intermedio</option>
                    <option value="avanzado" className="text-foreground bg-background">Avanzado</option>
                  </select>
                </div>
              </div>
              <input placeholder="Título *" value={newItem.titulo ?? ""} onChange={e => setNewItem(n => ({ ...n, titulo: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none" />
              <textarea placeholder="Descripción *" value={newItem.descripcion ?? ""} onChange={e => setNewItem(n => ({ ...n, descripcion: e.target.value }))}
                className="w-full h-16 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none resize-none" />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Disciplina</label>
                  <input value={newItem.disciplina ?? ""} onChange={e => setNewItem(n => ({ ...n, disciplina: e.target.value }))}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Categoría edad</label>
                  <input value={newItem.categoriaEdad ?? ""} onChange={e => setNewItem(n => ({ ...n, categoriaEdad: e.target.value }))}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Permisos</label>
                  <select value={newItem.permisos} onChange={e => setNewItem(n => ({ ...n, permisos: e.target.value as LibraryPermission }))}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none">
                    <option value="lectura" className="text-foreground bg-background">Solo lectura</option>
                    <option value="edicion" className="text-foreground bg-background">Editable</option>
                    <option value="duplicar" className="text-foreground bg-background">Duplicable</option>
                  </select>
                </div>
              </div>
              <input placeholder="Objetivo principal" value={newItem.objetivo ?? ""} onChange={e => setNewItem(n => ({ ...n, objetivo: e.target.value }))}
                className="w-full h-8 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none" />
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs" onClick={handleAddItem}>Agregar a Biblioteca</Button>
                <Button size="sm" variant="outline" className="border-border text-muted-foreground text-xs" onClick={() => setShowAdd(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {activePreviewItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <CardHeader className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CATEGORY_CONFIG[activePreviewItem.categoria].icon}</span>
                <div>
                  <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{activePreviewItem.titulo}</CardTitle>
                  <CardDescription className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Categoría: {CATEGORY_CONFIG[activePreviewItem.categoria].label} · Por {getDisplayAuthor(activePreviewItem.autor)}</CardDescription>
                </div>
              </div>
              <button className="text-slate-450 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" onClick={() => setActivePreviewItem(null)}>
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="p-5 overflow-y-auto space-y-4 flex-1">
              {activePreviewItem.categoria === "video" ? (
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg border border-slate-200 dark:border-slate-800">
                    <iframe
                      src="https://www.youtube.com/embed/mjq4ApnRtrI?autoplay=1"
                      title="Tactical Video Analysis"
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {activePreviewItem.descripcion}
                  </p>
                </div>
              ) : activePreviewItem.categoria === "pdf" ? (
                <div className="space-y-4">
                  <div className="h-80 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <FileText className="h-16 w-16 text-red-500 animate-pulse-slow" />
                    <div>
                      <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Visor de Documento PDF</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manual de Metodología de Juego - 14 Páginas</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg px-4 gap-1.5" onClick={() => toast.success("Descargando PDF...")}>
                        <Download className="h-3.5 w-3.5" /> Descargar Completo
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {activePreviewItem.descripcion}
                  </p>
                </div>
              ) : activePreviewItem.categoria === "presentacion" ? (
                <div className="space-y-4">
                  <div className="h-72 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col justify-between p-6 relative shadow-inner">
                    <div className="absolute top-3 right-3 text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">
                      Diapositiva {currentSlideIndex + 1} de 3
                    </div>
                    <div className="my-auto space-y-2 text-center">
                      {currentSlideIndex === 0 && (
                        <>
                          <h4 className="text-lg font-black text-violet-400">1. Introducción al Sistema Táctico</h4>
                          <p className="text-xs text-slate-300 max-w-md mx-auto">Conceptos metodológicos básicos sobre la ocupación del espacio y transiciones de fase.</p>
                        </>
                      )}
                      {currentSlideIndex === 1 && (
                        <>
                          <h4 className="text-lg font-black text-emerald-400">2. Estructura de Ataque (3-2-5)</h4>
                          <p className="text-xs text-slate-300 max-w-md mx-auto">Posicionamiento en amplitud de los extremos y ocupación de pasillos interiores por los mediocentros ofensivos.</p>
                        </>
                      )}
                      {currentSlideIndex === 2 && (
                        <>
                          <h4 className="text-lg font-black text-amber-400">3. Conclusiones y Tareas de Campo</h4>
                          <p className="text-xs text-slate-300 max-w-md mx-auto">Simulación práctica y repeticiones a balón parado bajo situaciones de juego real.</p>
                        </>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentSlideIndex === 0}
                        className="text-white hover:bg-white/10 text-xs"
                        onClick={() => setCurrentSlideIndex(c => Math.max(0, c - 1))}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentSlideIndex === 2}
                        className="text-white hover:bg-white/10 text-xs"
                        onClick={() => setCurrentSlideIndex(c => Math.min(2, c + 1))}
                      >
                        Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {activePreviewItem.descripcion}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-64 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <BookMarked className="h-14 w-14 text-violet-500" />
                    <div>
                      <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{activePreviewItem.titulo}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Este recurso requiere ser visualizado en la Pizarra de Entrenamiento.</p>
                    </div>
                    {(activePreviewItem.categoria === "ejercicio" || activePreviewItem.categoria === "jugada") && (
                      <Link to="/tactica/pizarra">
                        <Button size="sm" className="bg-gradient-primary text-white text-xs font-bold rounded-lg px-4 gap-1.5">
                          <Play className="h-3.5 w-3.5 fill-current" /> Abrir Pizarra Táctica
                        </Button>
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {activePreviewItem.descripcion}
                  </p>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex justify-end gap-2">
              <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 dark:border-slate-800 dark:text-slate-300 text-xs font-bold" onClick={() => setActivePreviewItem(null)}>
                Cerrar Vista
              </Button>
              <Button size="sm" className="bg-gradient-primary text-white text-xs font-bold" onClick={() => toast.success("Enlace de recurso compartido")}>
                Compartir
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BibliotecaTactica;
