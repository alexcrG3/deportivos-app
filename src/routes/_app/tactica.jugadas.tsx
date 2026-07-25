import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TacticalStore, TacticalPlay, PlayCategory, BoardSession } from "@/lib/tactical-store";
import { Play, Plus, BookOpen, Target, Tag, User, Calendar, Filter, Eye, Zap } from "lucide-react";
import { toast } from "sonner";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/tactica/jugadas")({ component: JugadasTacticas });

const CATEGORY_COLORS: Record<PlayCategory, string> = {
  ataque:       "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  defensa:      "bg-blue-500/15    text-blue-400    border-blue-500/25",
  "balon-parado":"bg-amber-500/15  text-amber-400   border-amber-500/25",
  contraataque: "bg-orange-500/15  text-orange-400  border-orange-500/25",
  transicion:   "bg-purple-500/15  text-purple-400  border-purple-500/25",
  presion:      "bg-red-500/15     text-red-400     border-red-500/25",
  posesion:     "bg-sky-500/15     text-sky-400     border-sky-500/25",
  recuperacion: "bg-teal-500/15    text-teal-400    border-teal-500/25",
};

const NIVEL_COLORS: Record<string, string> = {
  basico:      "bg-emerald-500/10 text-emerald-400",
  intermedio:  "bg-amber-500/10   text-amber-400",
  avanzado:    "bg-red-500/10     text-red-400",
};

const CATEGORY_LABELS: Record<PlayCategory, string> = {
  ataque:       "⚔️ Ataque",
  defensa:      "🛡️ Defensa",
  "balon-parado":"🎯 Balón Parado",
  contraataque: "⚡ Contraataque",
  transicion:   "🔄 Transición",
  presion:      "🔥 Presión",
  posesion:     "⚽ Posesión",
  recuperacion: "↩️ Recuperación",
};

const ALL_CATEGORIES: ("todas" | PlayCategory)[] = [
  "todas", "ataque", "defensa", "balon-parado", "contraataque", "transicion", "presion", "posesion", "recuperacion"
];

function JugadasTacticas() {
  const plays = TacticalStore.getPlays();
  const [activeCategory, setActiveCategory] = useState<"todas" | PlayCategory>("todas");
  const [selectedPlay, setSelectedPlay] = useState<TacticalPlay | null>(null);

  const filtered = activeCategory === "todas"
    ? plays
    : plays.filter(p => p.categoria === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-[#E2E8F0] text-[#0F172A]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Biblioteca de Jugadas</h1>
            <p className="text-[#64748B] text-sm">Repositorio táctico profesional por categorías</p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5"
          onClick={() => toast.info("Editor de jugadas — Próximamente en Parte 2/3")}
        >
          <Plus className="h-4 w-4" /> Nueva Jugada
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground mr-1" />
        {ALL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border ${
              activeCategory === cat
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "bg-white text-[#475569] hover:bg-slate-50 border-[#E2E8F0]"
            }`}
          >
            {cat === "todas" ? "📋 Todas" : CATEGORY_LABELS[cat as PlayCategory]}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className={`grid gap-4 ${selectedPlay ? "lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        {/* Play cards */}
        <div className={`${selectedPlay ? "lg:col-span-2" : "col-span-full"} grid gap-4 ${selectedPlay ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {filtered.map(play => (
            <Card
              key={play.id}
              className={`bg-white shadow-sm cursor-pointer transition-all border rounded-[12px] hover:border-slate-300 ${
                selectedPlay?.id === play.id ? "border-[#2563EB] ring-1 ring-[#2563EB]" : "border-[#E2E8F0]"
              }`}
              onClick={() => setSelectedPlay(play.id === selectedPlay?.id ? null : play)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold text-[#0F172A] leading-snug">{play.nombre}</CardTitle>
                  <Badge variant="outline" className={`shrink-0 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium uppercase ${NIVEL_COLORS[play.nivel]}`}>
                    {play.nivel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={`border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium ${CATEGORY_COLORS[play.categoria]}`}>
                    {CATEGORY_LABELS[play.categoria]}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-100 text-[#475569] border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">{play.disciplina}</Badge>
                </div>

                <p className="text-sm text-[#64748B] leading-relaxed line-clamp-2">{play.descripcion}</p>

                <div className="border-t border-[#E2E8F0] pt-2">
                  <p className="text-[11px] uppercase font-bold text-[#64748B] mb-1">Objetivo</p>
                  <p className="text-sm text-[#0F172A] leading-relaxed line-clamp-2 flex items-start gap-1">
                    <Target className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                    {play.objetivo}
                  </p>
                </div>

                {/* Tags */}
                {play.etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {play.etiquetas.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-0.5 text-[11px] bg-slate-50 border border-[#E2E8F0] px-2 py-1 rounded-full text-[#64748B]">
                        <Tag className="h-3 w-3" />{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[#64748B] border-t border-[#E2E8F0] pt-2">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{play.autor}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{play.fecha}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm gap-1"
                    onClick={(e) => { e.stopPropagation(); setSelectedPlay(play); }}
                  >
                    <Eye className="h-4 w-4" /> Detalles
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      const firstFrame = play.frames[0];
                      const session: BoardSession = {
                        id: "board-default",
                        nombre: `Simulación: ${play.nombre}`,
                        sport: play.disciplina.toLowerCase() === "baloncesto" ? "basketball" : "football",
                        formationId: "f-433",
                        players: firstFrame?.players.map((p: any) => {
                          const allJugadores = RendimientoStore.getJugadores();
                          const pOs = allJugadores.find(j => j.id === p.jugadorId);
                          return {
                            slotId: p.slotId,
                            jugadorId: p.jugadorId || p.slotId,
                            x: p.x,
                            y: p.y,
                            nombre: pOs?.nombre ?? p.slotId,
                            numero: (pOs as any)?.dorsal || (pOs as any)?.numero || 10,
                            avatar: (pOs as any)?.avatar || "",
                          };
                        }) ?? [],
                        arrows: firstFrame?.arrows ?? [],
                        zones: [],
                        cones: [],
                        ball: firstFrame?.ball ?? { x: 50, y: 50 },
                        ballVisible: true,
                        tool: "select",
                        lastSaved: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        playId: play.id,
                        activeFrame: 0,
                      } as any;
                      TacticalStore.saveBoardSession(session);
                      toast.success(`Cargando jugada "${play.nombre}"...`);
                      window.location.href = "/tactica/pizarra";
                    }}
                  >
                    <Zap className="h-3 w-3" /> Animar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
              No hay jugadas registradas en esta categoría.
            </div>
          )}
        </div>

        {selectedPlay && (
          <Card className="bg-white shadow-sm border border-[#E2E8F0] rounded-[12px] lg:col-span-1 h-fit sticky top-4">
             <CardHeader className="pb-3 border-b border-[#E2E8F0]">
               <div className="flex items-start justify-between">
                 <CardTitle className="text-base text-[#0F172A] font-bold">{selectedPlay.nombre}</CardTitle>
                 <button onClick={() => setSelectedPlay(null)} className="text-[#64748B] hover:text-[#0F172A] p-1">✕</button>
               </div>
               <CardDescription className="text-sm text-[#64748B]">Vista detallada de la jugada</CardDescription>
             </CardHeader>
            <CardContent className="space-y-4 text-sm pt-4">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className={`border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium ${CATEGORY_COLORS[selectedPlay.categoria]}`}>
                  {CATEGORY_LABELS[selectedPlay.categoria]}
                </Badge>
                <Badge variant="outline" className={`border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium ${NIVEL_COLORS[selectedPlay.nivel]}`}>{selectedPlay.nivel}</Badge>
                <Badge variant="outline" className="bg-slate-100 text-[#475569] border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">{selectedPlay.disciplina}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] uppercase font-bold text-[#64748B]">Descripción</p>
                <p className="text-[#0F172A] leading-relaxed">{selectedPlay.descripcion}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] uppercase font-bold text-[#64748B]">Objetivo Táctico</p>
                <p className="text-[#0F172A] leading-relaxed flex items-start gap-1">
                  <Target className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />{selectedPlay.objetivo}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] uppercase font-bold text-[#64748B]">Etiquetas</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPlay.etiquetas.map(tag => (
                    <span key={tag} className="text-[11px] bg-slate-50 border border-[#E2E8F0] px-2 py-1 rounded-full text-[#64748B]">#{tag}</span>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-3 flex gap-2">
                <div className="flex-1">
                  <p className="text-[11px] text-[#64748B]">Autor</p>
                  <p className="font-medium text-[#0F172A]">{selectedPlay.autor}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-[#64748B]">Fecha</p>
                  <p className="font-medium text-[#0F172A]">{selectedPlay.fecha}</p>
                </div>
              </div>

              <Link to="/tactica/pizarra" className="w-full block">
                <Button
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5"
                  onClick={() => {
                    const firstFrame = selectedPlay.frames[0];
                    const session: BoardSession = {
                      id: "board-default",
                      nombre: `Simulación: ${selectedPlay.nombre}`,
                      sport: selectedPlay.disciplina.toLowerCase() === "baloncesto" ? "basketball" : "football",
                      formationId: "f-433",
                      players: firstFrame?.players.map((p: any) => {
                        const allJugadores = RendimientoStore.getJugadores();
                        const pOs = allJugadores.find(j => j.id === p.jugadorId);
                        return {
                          slotId: p.slotId,
                          jugadorId: p.jugadorId || p.slotId,
                          x: p.x,
                          y: p.y,
                          nombre: pOs?.nombre ?? p.slotId,
                          numero: (pOs as any)?.dorsal || (pOs as any)?.numero || 10,
                          avatar: (pOs as any)?.avatar || "",
                        };
                      }) ?? [],
                      arrows: firstFrame?.arrows ?? [],
                      zones: [],
                      cones: [],
                      ball: firstFrame?.ball ?? { x: 50, y: 50 },
                      ballVisible: true,
                      tool: "select",
                      lastSaved: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                      playId: selectedPlay.id,
                      activeFrame: 0,
                    } as any;
                    TacticalStore.saveBoardSession(session);
                    toast.success(`Cargando la jugada "${selectedPlay.nombre}" en la pizarra...`);
                  }}
                >
                  <Play className="h-3.5 w-3.5" /> Animar en Pizarra
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default JugadasTacticas;
