import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TacticalStore, Strategy, Opponent } from "@/lib/tactical-store";
import { Swords, Target, User, Calendar, Plus, Brain, ShieldAlert, Award, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tactica/estrategias")({ component: EstrategiasTacticas });

function EstrategiasTacticas() {
  const [strategies, setStrategies] = useState<Strategy[]>(() => TacticalStore.getStrategies());
  const opponents = TacticalStore.getOpponents();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(
    strategies.length > 0 ? strategies[0].id : null
  );

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);
  const selectedOpponent = selectedStrategy
    ? opponents.find(o => o.id === selectedStrategy.opponentId)
    : null;

  // Dialog State
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [newForm, setNewForm] = useState({
    opponentId: opponents[0]?.id || "",
    formacionSugerida: "4-3-3",
    planTactico: "",
    objetivosInput: "",
    fortalezasInput: "",
    debilidadesInput: "",
    notasRival: "",
    indicaciones: "",
  });

  const handleCreateStrategy = () => {
    if (!newForm.opponentId) {
      toast.error("Debes seleccionar un rival.");
      return;
    }
    if (!newForm.planTactico.trim()) {
      toast.error("El plan táctico general es obligatorio.");
      return;
    }

    const newStrategy: Strategy = {
      id: `st-${Date.now()}`,
      opponentId: newForm.opponentId,
      objetivos: newForm.objetivosInput.split(",").map(x => x.trim()).filter(Boolean),
      planTactico: newForm.planTactico,
      fortalezasPropias: newForm.fortalezasInput.split(",").map(x => x.trim()).filter(Boolean),
      debilidadesPropias: newForm.debilidadesInput.split(",").map(x => x.trim()).filter(Boolean),
      indicaciones: newForm.indicaciones || "Sin indicaciones específicas.",
      notasRival: newForm.notasRival || "Sin notas adicionales del rival.",
      formacionSugerida: newForm.formacionSugerida,
      createdAt: new Date().toISOString(),
    };

    TacticalStore.saveStrategy(newStrategy);
    const updated = TacticalStore.getStrategies();
    setStrategies(updated);
    setSelectedStrategyId(newStrategy.id);
    setIsOpenCreate(false);

    // Reset Form
    setNewForm({
      opponentId: opponents[0]?.id || "",
      formacionSugerida: "4-3-3",
      planTactico: "",
      objetivosInput: "",
      fortalezasInput: "",
      debilidadesInput: "",
      notasRival: "",
      indicaciones: "",
    });

    toast.success("¡Estrategia de partido creada con éxito!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-elegant">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Estrategias de Partido</h1>
            <p className="text-xs text-muted-foreground">Planes tácticos y preparación por oponente</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs bg-gradient-to-r from-violet-600 to-indigo-700 text-white"
          onClick={() => setIsOpenCreate(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Nueva Estrategia
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Strategy List */}
        <div className="md:col-span-1 space-y-3">
          <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800 shadow-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-extrabold">Planes Activos</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0 space-y-2">
              {strategies.map(s => {
                const opp = opponents.find(o => o.id === s.opponentId);
                const isSelected = selectedStrategyId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStrategyId(s.id)}
                    className={`w-full text-left p-3 rounded-xl transition border text-xs flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-violet-50 dark:bg-violet-950/20 border-violet-300 dark:border-violet-800/80 text-violet-700 dark:text-violet-300 shadow-elegant"
                        : "bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-transparent text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-950 dark:hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                        {opp?.escudo} {opp?.nombre ?? "Rival Desconocido"}
                      </span>
                      <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                        {s.formacionSugerida}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{s.planTactico}</p>
                    <span className="text-[9px] text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1 font-bold">
                      <Calendar className="h-3 w-3" />
                      {new Date(s.createdAt).toLocaleDateString("es-ES")}
                    </span>
                  </button>
                );
              })}

              {strategies.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 p-4 text-center">No hay estrategias registradas.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Strategy Details */}
        <div className="md:col-span-2">
          {selectedStrategy && selectedOpponent ? (
            <Card className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800/60 shadow-card">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedOpponent.escudo}</span>
                    <div>
                      <CardTitle className="text-lg text-slate-900 dark:text-slate-100 font-extrabold">Estrategia vs. {selectedOpponent.nombre}</CardTitle>
                      <CardDescription className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                        Director Técnico: {selectedOpponent.entrenador} · Formación rival base: {selectedOpponent.sistemaBase}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 text-xs font-extrabold font-mono rounded-lg">
                    Esquema Propuesto: {selectedStrategy.formacionSugerida}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-xs">
                {/* Plan Táctico principal */}
                <div className="space-y-2 border-l-4 border-violet-600 dark:border-violet-500 pl-4 py-1.5 bg-slate-50 dark:bg-slate-900/40 rounded-r-xl p-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Brain className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" /> Plan Táctico General
                  </h3>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-justify font-medium">{selectedStrategy.planTactico}</p>
                </div>

                {/* Objetivos */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-1">
                        🎯 Objetivos Clave
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <ul className="space-y-2">
                        {selectedStrategy.objetivos.map((obj, i) => (
                          <li key={i} className="text-slate-800 dark:text-slate-200 flex items-start gap-1.5 font-semibold">
                            <span className="text-emerald-600 dark:text-emerald-500 mt-0.5 font-bold">•</span> {obj}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-50/60 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs text-amber-700 dark:text-amber-400 font-black flex items-center gap-1">
                        👁️ Observaciones del Oponente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">{selectedStrategy.notasRival}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Fortalezas vs Debilidades */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-500" /> Fortalezas a Explotar
                    </h4>
                    <div className="space-y-1.5">
                      {selectedStrategy.fortalezasPropias.map((f, i) => (
                        <div key={i} className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold">
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-red-650 dark:text-red-500" /> Debilidades a Mitigar
                    </h4>
                    <div className="space-y-1.5">
                      {selectedStrategy.debilidadesPropias.map((d, i) => (
                        <div key={i} className="p-2.5 rounded-lg border border-red-500/30 bg-red-50/50 dark:bg-red-500/10 text-red-800 dark:text-red-300 font-bold">
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Indicaciones finales */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="font-extrabold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-500" /> Indicaciones Finales del Cuerpo Técnico
                  </h4>
                  <p className="text-slate-700 dark:text-slate-400 leading-relaxed italic font-semibold">{selectedStrategy.indicaciones}</p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Link to="/tactica/pizarra">
                    <Button className="bg-gradient-primary hover:opacity-90 text-white font-extrabold text-xs shadow-elegant rounded-xl px-4 py-2">
                      Abrir Pizarra de Partido
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-card border-slate-200 dark:border-slate-800 shadow-card">
              <CardContent className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                <Target className="h-10 w-10 mx-auto mb-2 text-violet-500/30" />
                Selecciona un plan estratégico activo para ver sus detalles.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* CREATE STRATEGY DIALOG */}
      <Dialog open={isOpenCreate} onOpenChange={setIsOpenCreate}>
        <DialogContent className="bg-card border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-2">
            <DialogTitle className="text-base text-foreground">Crear Plan Táctico / Estrategia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Seleccionar Oponente / Rival *</Label>
              <select
                value={newForm.opponentId}
                onChange={e => setNewForm(f => ({ ...f, opponentId: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
              >
                {opponents.map(opp => (
                  <option key={opp.id} value={opp.id} className="bg-background text-foreground">
                    {opp.escudo} {opp.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Formación Sugerida *</Label>
              <Input
                type="text"
                value={newForm.formacionSugerida}
                onChange={e => setNewForm(f => ({ ...f, formacionSugerida: e.target.value }))}
                placeholder="E.g. 4-3-3"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Plan Táctico General *</Label>
              <textarea
                value={newForm.planTactico}
                onChange={e => setNewForm(f => ({ ...f, planTactico: e.target.value }))}
                placeholder="Describe el planteamiento general del partido contra el rival..."
                className="w-full min-h-[70px] rounded-lg border border-input bg-background p-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Objetivos Clave (Separados por comas)</Label>
              <Input
                type="text"
                value={newForm.objetivosInput}
                onChange={e => setNewForm(f => ({ ...f, objetivosInput: e.target.value }))}
                placeholder="E.g. Bloquear bandas, Ganar línea de fondo"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Fortalezas a Explotar (Separados por comas)</Label>
              <Input
                type="text"
                value={newForm.fortalezasInput}
                onChange={e => setNewForm(f => ({ ...f, fortalezasInput: e.target.value }))}
                placeholder="E.g. Velocidad, Remate de larga distancia"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Debilidades a Mitigar (Separados por comas)</Label>
              <Input
                type="text"
                value={newForm.debilidadesInput}
                onChange={e => setNewForm(f => ({ ...f, debilidadesInput: e.target.value }))}
                placeholder="E.g. Repliegue lento, Balón parado"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Observaciones del Oponente / Notas del Rival</Label>
              <textarea
                value={newForm.notasRival}
                onChange={e => setNewForm(f => ({ ...f, notasRival: e.target.value }))}
                placeholder="E.g. El rival explota la banda izquierda con su extremo hábil..."
                className="w-full min-h-[60px] rounded-lg border border-input bg-background p-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Indicaciones Finales del Cuerpo Técnico</Label>
              <textarea
                value={newForm.indicaciones}
                onChange={e => setNewForm(f => ({ ...f, indicaciones: e.target.value }))}
                placeholder="Indicaciones finales que se compartirán con el equipo..."
                className="w-full min-h-[60px] rounded-lg border border-input bg-background p-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2 justify-end border-t pt-3">
              <Button variant="outline" size="sm" onClick={() => setIsOpenCreate(false)} className="text-xs">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCreateStrategy} className="text-xs bg-primary hover:bg-primary/95 text-white">
                Guardar Estrategia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EstrategiasTacticas;
