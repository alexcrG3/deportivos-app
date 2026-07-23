import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TacticalStore, TacticalPlay, PlayCategory, BoardSession } from "@/lib/tactical-store";
import { Play, Plus, BookOpen, Target, Tag, User, Calendar, Filter, Eye, Zap } from "lucide-react";
import { toast } from "sonner";
import { getPlayerOS } from "@/lib/mock-data";

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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-elegant">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Biblioteca de Jugadas</h1>
            <p className="text-xs text-muted-foreground">Repositorio táctico profesional por categorías</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold"
          onClick={() => toast.info("Editor de jugadas — Próximamente en Parte 2/3")}
        >
          <Plus className="h-3.5 w-3.5" /> Nueva Jugada
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground mr-1" />
        {ALL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
              activeCategory === cat
                ? "bg-primary text-white border-primary"
                : "bg-muted text-muted-foreground hover:bg-muted/85 hover:text-foreground border-transparent"
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
              className={`bg-card shadow-card cursor-pointer hover:shadow-elegant transition-all border-border hover:border-border/80 ${
                selectedPlay?.id === play.id ? "border-primary/30 bg-primary/5" : ""
              }`}
              onClick={() => setSelectedPlay(play.id === selectedPlay?.id ? null : play)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm leading-snug text-foreground">{play.nombre}</CardTitle>
                  <Badge variant="outline" className={`shrink-0 text-[8px] font-bold uppercase ${NIVEL_COLORS[play.nivel]}`}>
                    {play.nivel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={`text-[9px] font-bold ${CATEGORY_COLORS[play.categoria]}`}>
                    {CATEGORY_LABELS[play.categoria]}
                  </Badge>
                  <Badge variant="outline" className="text-[9px]">{play.disciplina}</Badge>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{play.descripcion}</p>

                <div className="border-t border-border pt-2">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">Objetivo</p>
                  <p className="text-[10px] text-foreground/80 leading-relaxed line-clamp-2 flex items-start gap-1">
                    <Target className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" />
                    {play.objetivo}
                  </p>
                </div>

                {/* Tags */}
                {play.etiquetas.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {play.etiquetas.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-0.5 text-[8px] bg-muted border border-border px-1.5 py-0.5 rounded-full text-muted-foreground">
                        <Tag className="h-2 w-2" />{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border pt-2">
                  <span className="flex items-center gap-1"><User className="h-2.5 w-2.5" />{play.autor}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{play.fecha}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-[10px] h-7 gap-1"
                    onClick={(e) => { e.stopPropagation(); setSelectedPlay(play); }}
                  >
                    <Eye className="h-3 w-3" /> Detalles
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-[10px] h-7 gap-1 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      const firstFrame = play.frames[0];
                      const session: BoardSession = {
                        id: "board-default",
                        nombre: `Simulación: ${play.nombre}`,
                        sport: play.disciplina.toLowerCase() === "baloncesto" ? "basketball" : "football",
                        formationId: "f-433",
                        players: firstFrame?.players.map((p) => {
                          const pOs = getPlayerOS(p.jugadorId);
                          return {
                            slotId: p.slotId,
                            jugadorId: p.jugadorId,
                            x: p.x,
                            y: p.y,
                            nombre: pOs?.nombre ?? p.slotId,
                            numero: pOs?.numero,
                            avatar: pOs?.avatar,
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
          <Card className="bg-card shadow-card border-primary/20 lg:col-span-1 h-fit sticky top-4">
             <CardHeader className="pb-3">
               <div className="flex items-start justify-between">
                 <CardTitle className="text-base text-foreground">{selectedPlay.nombre}</CardTitle>
                 <button onClick={() => setSelectedPlay(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
               </div>
               <CardDescription>Vista detallada de la jugada</CardDescription>
             </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className={`text-[9px] font-bold ${CATEGORY_COLORS[selectedPlay.categoria]}`}>
                  {CATEGORY_LABELS[selectedPlay.categoria]}
                </Badge>
                <Badge variant="outline" className={`text-[9px] ${NIVEL_COLORS[selectedPlay.nivel]}`}>{selectedPlay.nivel}</Badge>
                <Badge variant="outline" className="text-[9px]">{selectedPlay.disciplina}</Badge>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Descripción</p>
                <p className="text-foreground/85 leading-relaxed">{selectedPlay.descripcion}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Objetivo Táctico</p>
                <p className="text-amber-600 dark:text-amber-400 leading-relaxed flex items-start gap-1">
                  <Target className="h-3 w-3 shrink-0 mt-0.5" />{selectedPlay.objetivo}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] uppercase font-bold text-muted-foreground">Etiquetas</p>
                <div className="flex flex-wrap gap-1">
                  {selectedPlay.etiquetas.map(tag => (
                    <span key={tag} className="text-[9px] bg-muted border border-border px-2 py-0.5 rounded-full text-muted-foreground">#{tag}</span>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-3 flex gap-2">
                <div className="flex-1">
                  <p className="text-[9px] text-muted-foreground">Autor</p>
                  <p className="font-semibold text-foreground">{selectedPlay.autor}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-muted-foreground">Fecha</p>
                  <p className="font-semibold text-foreground">{selectedPlay.fecha}</p>
                </div>
              </div>

              <Link to="/tactica/pizarra" className="w-full block">
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5"
                  onClick={() => {
                    const firstFrame = selectedPlay.frames[0];
                    const session: BoardSession = {
                      id: "board-default",
                      nombre: `Simulación: ${selectedPlay.nombre}`,
                      sport: selectedPlay.disciplina.toLowerCase() === "baloncesto" ? "basketball" : "football",
                      formationId: "f-433",
                      players: firstFrame?.players.map((p) => {
                        const pOs = getPlayerOS(p.jugadorId);
                        return {
                          slotId: p.slotId,
                          jugadorId: p.jugadorId,
                          x: p.x,
                          y: p.y,
                          nombre: pOs?.nombre ?? p.slotId,
                          numero: pOs?.numero,
                          avatar: pOs?.avatar,
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
