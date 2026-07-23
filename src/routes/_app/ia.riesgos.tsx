import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { aiRiskScores, type RiskLevel } from "@/lib/mock-data";
import { AIStore } from "@/lib/ai-store";
import { AlertTriangle, TrendingDown, Activity, CalendarX, Search, Sparkles, X, Brain } from "lucide-react";

export const Route = createFileRoute("/_app/ia/riesgos")({ component: RiesgosIA });

const levelVariant = (l: RiskLevel) =>
  l === "critico" ? "destructive" : l === "alto" ? "destructive" : l === "medio" ? "secondary" : "outline";

function RiesgosIA() {
  const [naturalQuery, setNaturalQuery] = useState("");
  const [isSearchingIntelligent, setIsSearchingIntelligent] = useState(false);

  const tabs = [
    { id: "abandono", label: "Abandono", icon: AlertTriangle, key: "scoreAbandono", nivel: "nivelAbandono" },
    { id: "mora", label: "Mora", icon: TrendingDown, key: "scoreMora", nivel: "nivelMora" },
    { id: "lesion", label: "Lesiones", icon: Activity, key: "scoreLesion", nivel: "nivelLesion" },
    { id: "asistencia", label: "Asistencia", icon: CalendarX, key: "scoreAsistencia", nivel: "nivelAsistencia" },
  ] as const;

  // Intelligent Search Engine
  const intelligentResults = useMemo(() => {
    if (!naturalQuery.trim()) return [];
    return AIStore.queryInteligente(naturalQuery);
  }, [naturalQuery]);

  const handleClearSearch = () => {
    setNaturalQuery("");
    setIsSearchingIntelligent(false);
  };

  const suggestions = [
    "Muéstrame todos los jugadores con riesgo alto",
    "Equipos con Wellness menor a 80",
    "Jugadores lesionados"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de Riesgos & Búsqueda Inteligente</h1>
          <p className="text-sm text-muted-foreground">Rankings predictivos por tipo de riesgo de DeportivOS AI.</p>
        </div>
      </div>

      {/* Intelligent Search Input */}
      <Card className="border border-violet-500/20 bg-gradient-to-r from-violet-950/5 to-card">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Búsqueda Inteligente: Escribe 'riesgo alto', 'wellness menor a 80' o 'jugadores lesionados'..."
              value={naturalQuery}
              onChange={(e) => {
                setNaturalQuery(e.target.value);
                setIsSearchingIntelligent(e.target.value.length > 0);
              }}
              className="pl-9 pr-10 bg-background border-input text-foreground rounded-xl focus-visible:ring-violet-500"
            />
            {naturalQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Natural Search suggestions */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
              <Brain className="h-3 w-3 text-violet-400" /> Consultas de ejemplo:
            </span>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setNaturalQuery(s);
                  setIsSearchingIntelligent(true);
                }}
                className="text-[10px] bg-muted hover:bg-muted/80 px-2.5 py-1 rounded-full text-muted-foreground hover:text-foreground transition border border-transparent"
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DISPLAY RESULTS */}
      {isSearchingIntelligent ? (
        <Card className="border-violet-500/20 bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Resultados de Búsqueda Inteligente
                </CardTitle>
                <CardDescription>Consulta construida dinámicamente para: &quot;{naturalQuery}&quot;</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {intelligentResults.length} coincidencias
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {intelligentResults.map((r, i) => {
              const score = r.fatigaScore ?? r.score ?? r.wellnessScore ?? 75;
              const jugadorId = r.jugadorId ?? r.id ?? 'j1';
              const semaforo = r.semaforo ?? 'rojo';
              return (
                <Link
                  to="/jugadores/$id"
                  params={{ id: jugadorId }}
                  key={jugadorId}
                  className="flex items-center gap-3 rounded-lg border p-3.5 hover:bg-muted/50 transition bg-white/[0.02]"
                >
                  <div className="w-6 text-center text-xs font-mono text-muted-foreground">{i + 1}</div>
                  <img src={r.avatar || "https://i.pravatar.cc/100?img=1"} alt="" className="h-10 w-10 rounded-full border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-xs truncate text-white">{r.jugador ?? r.nombre}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">Score: {score}</span>
                        <Badge variant={semaforo === "rojo" ? "destructive" : "secondary"}>
                          {semaforo.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.equipo || r.categoria || "Atleta"}</p>
                    <Progress value={score} className="h-1.5 mt-2" />
                  </div>
                </Link>
              );
            })}
            {intelligentResults.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Ningún atleta coincide con el filtro de búsqueda inteligente.
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="abandono">
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                <t.icon className="h-4 w-4 mr-1.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((t) => {
            const sorted = [...aiRiskScores].sort((a, b) => (b[t.key] as number) - (a[t.key] as number));
            return (
              <TabsContent key={t.id} value={t.id} className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Ranking · {t.label}</CardTitle>
                    <CardDescription>Ordenado de mayor a menor riesgo predictivo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sorted.map((r, i) => {
                      const score = r[t.key] as number;
                      const nivel = r[t.nivel] as RiskLevel;
                      return (
                        <Link
                          to="/jugadores/$id"
                          params={{ id: r.jugadorId }}
                          key={r.jugadorId}
                          className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition bg-white/[0.02]"
                        >
                          <div className="w-6 text-center text-xs font-mono text-muted-foreground">{i + 1}</div>
                          <img src={r.avatar} alt="" className="h-9 w-9 rounded-full border border-white/10" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-xs truncate text-white">{r.jugador}</p>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">{score}</span>
                                <Badge variant={levelVariant(nivel)}>{nivel}</Badge>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{r.categoria} · {r.sede}</p>
                            <Progress value={score} className="h-1.5 mt-2" />
                            {r.factores.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {r.factores.slice(0, 3).map((f, idx) => (
                                  <Badge key={idx} variant="outline" className="text-[9px] border-white/10 text-muted-foreground bg-white/5">
                                    {f}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}
export default RiesgosIA;
