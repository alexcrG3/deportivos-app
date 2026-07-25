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
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-[#E2E8F0] text-[#0F172A]">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Estrategias de Partido</h1>
            <p className="text-[#64748B] text-sm">Planes tácticos y preparación por oponente</p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5"
          onClick={() => setIsOpenCreate(true)}
        >
          <Plus className="h-4 w-4" /> Nueva Estrategia
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Strategy List */}
        <div className="md:col-span-1 space-y-3">
          <Card className="bg-white shadow-sm border border-[#E2E8F0] rounded-[12px]">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-[#64748B] uppercase tracking-wider font-bold">Planes Activos</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0 space-y-2">
              {strategies.map(s => {
                const opp = opponents.find(o => o.id === s.opponentId);
                const isSelected = selectedStrategyId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStrategyId(s.id)}
                    className={`w-full text-left p-3 rounded-[12px] transition border text-sm flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-slate-50 border-[#2563EB] ring-1 ring-[#2563EB]"
                        : "bg-white border-[#E2E8F0] hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                        {opp?.escudo} {opp?.nombre ?? "Rival Desconocido"}
                      </span>
                      <Badge variant="outline" className="bg-slate-100 text-[#475569] border-none rounded-full px-[8px] py-[2px] text-[10px] font-medium">
                        {s.formacionSugerida}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-[#64748B] leading-relaxed font-medium">{s.planTactico}</p>
                    <span className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1 font-medium">
                      <Calendar className="h-3 w-3" />
                      {new Date(s.createdAt).toLocaleDateString("es-ES")}
                    </span>
                  </button>
                );
              })}

              {strategies.length === 0 && (
                <p className="text-sm text-[#64748B] p-4 text-center">No hay estrategias registradas.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Strategy Details */}
        <div className="md:col-span-2">
          {selectedStrategy && selectedOpponent ? (
            <Card className="bg-white shadow-sm border border-[#E2E8F0] rounded-[12px]">
              <CardHeader className="pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedOpponent.escudo}</span>
                    <div>
                      <CardTitle className="text-xl text-[#0F172A] font-bold">Estrategia vs. {selectedOpponent.nombre}</CardTitle>
                      <CardDescription className="text-sm text-[#64748B] font-medium mt-0.5">
                        Director Técnico: {selectedOpponent.entrenador} · Formación rival base: {selectedOpponent.sistemaBase}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium shrink-0 mt-1">
                    Esquema Propuesto: {selectedStrategy.formacionSugerida}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-sm">
                {/* Plan Táctico principal */}
                <div className="space-y-2 border-l-[3px] border-[#2563EB] pl-4 py-1.5 bg-slate-50 rounded-r-[8px] p-3">
                  <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                    <Brain className="h-5 w-5 text-[#2563EB]" /> Plan Táctico General
                  </h3>
                  <p className="text-[#0F172A] leading-relaxed text-justify">{selectedStrategy.planTactico}</p>
                </div>

                {/* Objetivos */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="bg-slate-50 border border-[#E2E8F0] rounded-[12px] shadow-none">
                    <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0] bg-slate-100 rounded-t-[12px]">
                      <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5">
                        🎯 Objetivos Clave
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                      <ul className="space-y-2">
                        {selectedStrategy.objetivos.map((obj, i) => (
                          <li key={i} className="text-[#0F172A] flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5 font-bold">•</span> {obj}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-50 border border-[#E2E8F0] rounded-[12px] shadow-none">
                    <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0] bg-slate-100 rounded-t-[12px]">
                      <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5">
                        👁️ Observaciones del Oponente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                      <p className="text-[#0F172A] leading-relaxed">{selectedStrategy.notasRival}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Fortalezas vs Debilidades */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="font-bold text-[#0F172A] mb-2 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-600" /> Fortalezas a Explotar
                    </h4>
                    <div className="space-y-1.5">
                      {selectedStrategy.fortalezasPropias.map((f, i) => (
                        <div key={i} className="p-2.5 rounded-[8px] bg-emerald-500/10 text-emerald-700 font-medium">
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#0F172A] mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-red-600" /> Debilidades a Mitigar
                    </h4>
                    <div className="space-y-1.5">
                      {selectedStrategy.debilidadesPropias.map((d, i) => (
                        <div key={i} className="p-2.5 rounded-[8px] bg-red-500/10 text-red-700 font-medium">
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Indicaciones finales */}
                <div className="space-y-2 border-t border-[#E2E8F0] pt-4">
                  <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-[#64748B]" /> Indicaciones Finales del Cuerpo Técnico
                  </h4>
                  <p className="text-[#475569] leading-relaxed italic">{selectedStrategy.indicaciones}</p>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Link to="/tactica/pizarra">
                    <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium">
                      Abrir Pizarra de Partido
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white shadow-sm border border-[#E2E8F0] rounded-[12px]">
              <CardContent className="p-12 text-center text-[#64748B] text-sm">
                <Target className="h-10 w-10 mx-auto mb-2 text-slate-300" />
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
