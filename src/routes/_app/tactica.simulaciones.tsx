import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TacticalStore } from "@/lib/tactical-store";
import RendimientoStore from "@/lib/rendimiento-store";
import { jugadores } from "@/lib/mock-data";
import { PlayCircle, ShieldAlert, Sparkles, Brain, CheckCircle, RotateCcw, AlertTriangle, Layers, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tactica/simulaciones")({ component: SimulacionesTacticas });

function SimulacionesTacticas() {
  const formations = TacticalStore.getFormations();
  const loads = RendimientoStore.getPlayerLoadData();

  // Simulation hypothesis state
  const [selectedFormId, setSelectedFormId] = useState<string>("f-433");
  const [playerMinutes, setPlayerMinutes] = useState<Record<string, number>>({
    j1: 90, j2: 90, j3: 60, j4: 90, j5: 90
  });

  const activeForm = formations.find(f => f.id === selectedFormId) || formations[0];

  // Run simulation reactively based on state changes
  const simResult = useMemo(() => {
    return TacticalStore.runMatchSimulation(selectedFormId, {
      playerMinutes,
      activeForm: activeForm.id
    });
  }, [selectedFormId, playerMinutes, activeForm]);

  const handleMinutesChange = (jugId: string, mins: number) => {
    setPlayerMinutes(prev => ({ ...prev, [jugId]: mins }));
  };

  const resetSim = () => {
    setPlayerMinutes({ j1: 90, j2: 90, j3: 60, j4: 90, j5: 90 });
    setSelectedFormId("f-433");
    toast.success("Simulación restablecida");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-elegant">
            <PlayCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Simulador Táctico IA</h1>
            <p className="text-xs text-muted-foreground">Proyección y simulación del impacto físico en alineaciones</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={resetSim}>
          <RotateCcw className="h-3.5 w-3.5" /> Restablecer
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Hypothesis controls */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="bg-card shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-primary" /> 1. Sistema de Juego
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[10px] text-muted-foreground mb-2">Selecciona la formación a simular:</p>
              <div className="grid grid-cols-2 gap-2">
                {formations.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFormId(f.id)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition text-center ${
                      selectedFormId === f.id
                        ? "bg-primary text-white shadow-elegant"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent"
                    }`}
                  >
                    {f.nombre}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-primary" /> 2. Minutos Proyectados
              </CardTitle>
              <CardDescription>Ajusta los minutos para simular fatiga acumulada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {jugadores.slice(0, 5).map(j => {
                const load = loads.find(l => l.jugadorId === j.id);
                const currentMins = playerMinutes[j.id] ?? 90;
                return (
                  <div key={j.id} className="space-y-1.5 p-2 rounded-xl bg-white/[0.01] border border-white/5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{j.nombre.split(" ")[0]}</span>
                      <span className="font-mono text-muted-foreground">{currentMins} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="15"
                        value={currentMins}
                        onChange={e => handleMinutesChange(j.id, parseInt(e.target.value))}
                        className="w-full accent-primary h-1 bg-white/10 rounded"
                      />
                    </div>
                    {load && (
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-muted-foreground">Estado inicial:</span>
                        <span className={
                          load.semaforo === "rojo" ? "text-red-400 font-bold" :
                          load.semaforo === "amarillo" ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"
                        }>
                          {load.semaforo === "rojo" ? "Fatigado 🔴" : load.semaforo === "amarillo" ? "Alerta 🟡" : "Óptimo 🟢"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Projections */}
        <div className="space-y-4 lg:col-span-2">
          {/* Main simulation score card */}
          <Card className="bg-card shadow-card border-violet-500/10 bg-gradient-to-br from-card to-violet-950/10">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-white/5">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-400" />
                  Diagnóstico Táctico IA (Simulación)
                </CardTitle>
                <CardDescription>Resultados del análisis en tiempo real</CardDescription>
              </div>
              <Badge variant="outline" className={`text-xs font-bold uppercase ${
                simResult.riesgoLesion === "critico" ? "bg-red-500/15 text-red-400 border-red-500/25 animate-pulse" :
                simResult.riesgoLesion === "alto" ? "bg-orange-500/15 text-orange-400 border-orange-500/25" :
                "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
              }`}>
                Riesgo lesión: {simResult.riesgoLesion}
              </Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-xs">
              <div className="grid gap-4 sm:grid-cols-3 text-center">
                <div className="border border-white/5 bg-white/[0.01] p-3 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Estado General</p>
                  <p className="text-2xl font-black text-foreground mt-1">{simResult.estadoGeneral}%</p>
                </div>
                <div className="border border-white/5 bg-white/[0.01] p-3 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Nivel de Confianza</p>
                  <p className="text-lg font-bold text-violet-300 mt-1">{simResult.nivelConfianza}</p>
                </div>
                <div className="border border-white/5 bg-white/[0.01] p-3 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Esquema evaluado</p>
                  <p className="text-lg font-bold text-foreground mt-1">{simResult.formacion}</p>
                </div>
              </div>

              {/* Alert details */}
              {simResult.detallesCambios.length > 0 && (
                <div className="p-3.5 rounded-xl border border-red-500/10 bg-red-500/5 space-y-1.5">
                  <h4 className="font-bold text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                    Conflictos detectados en la simulación
                  </h4>
                  <div className="space-y-1">
                    {simResult.detallesCambios.map((d, i) => (
                      <p key={i} className="text-red-700 dark:text-red-200 leading-relaxed">• {d}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Advantages and disadvantages */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-white/[0.01] border-white/5">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Ventajas del Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <ul className="space-y-1">
                      {simResult.ventajas.map((adv, i) => (
                        <li key={i} className="text-foreground/85 dark:text-slate-300">• {adv}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.01] border-white/5">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-amber-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Riesgos de la Simulación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <ul className="space-y-1">
                      {simResult.desventajas.map((dis, i) => (
                        <li key={i} className="text-foreground/85 dark:text-slate-300">• {dis}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Confirm suggestion button */}
              <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                <Button variant="outline" className="text-xs" onClick={() => toast.info("Simulación guardada en historial")}>
                  Guardar Simulación
                </Button>
                <Link to="/tactica/pizarra">
                  <Button className="bg-primary hover:bg-primary/95 text-white font-bold text-xs">
                    Aplicar en Pizarra
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SimulacionesTacticas;
