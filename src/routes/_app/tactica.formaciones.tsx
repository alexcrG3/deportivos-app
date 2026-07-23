import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SportField } from "@/components/sport-field";
import { TacticalStore, Formation } from "@/lib/tactical-store";
import { Layers, Plus, Check, ShieldHalf, Crosshair } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tactica/formaciones")({ component: FormacionesTacticas });

const DISCIPLINE_FILTERS = ["Todas", "Fútbol", "Baloncesto", "Voleibol", "Rugby"];

const SLOT_COLORS: Record<string, string> = {
  GK: "#6366f1", CB1: "#3b82f6", CB2: "#3b82f6", CB3: "#3b82f6",
  RB: "#22c55e", LB: "#22c55e", RWB: "#22c55e", LWB: "#22c55e",
  CM: "#f59e0b", RM: "#f59e0b", LM: "#f59e0b",
  RCM: "#f59e0b", LCM: "#f59e0b", CDM1: "#a78bfa", CDM2: "#a78bfa",
  CAM: "#fb923c", RW: "#ef4444", LW: "#ef4444",
  CF: "#ef4444", RS: "#ef4444", LS: "#ef4444",
  PG: "#6366f1", SG: "#3b82f6", SF: "#22c55e",
  PF: "#f59e0b", C: "#8b5cf6",
};
function getSlotColor(slotId: string) { return SLOT_COLORS[slotId] ?? "#94a3b8"; }

function FormationPreview({ formation, sport }: { formation: Formation; sport: "football" | "basketball" }) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      <SportField sport={sport} width={280} height={182} className="w-full h-auto" />
      {/* Overlay positions */}
      {formation.slots.map(slot => (
        <div
          key={slot.slotId}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${slot.x}%`, top: `${(slot.y / 65) * 100}%` }}
        >
          <div
            className="h-6 w-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[7px] font-black text-white"
            style={{ backgroundColor: getSlotColor(slot.slotId) }}
          >
            {slot.slotId.slice(0, 2)}
          </div>
          <span className="text-[6px] text-white font-bold leading-none mt-0.5 drop-shadow-lg">
            {slot.jugadorId ? "✓" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function FormacionesTacticas() {
  const [filter, setFilter] = useState("Todas");
  const [activeFormationId, setActiveFormationId] = useState<string>(() => {
    const session = TacticalStore.getBoardSession();
    return session.formationId || "f-433";
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const formations = TacticalStore.getFormations();
  const filtered = filter === "Todas"
    ? formations
    : formations.filter(f => f.disciplina === filter);

  const selectedFormation = formations.find(f => f.id === (selectedId ?? activeFormationId));

  const handleUse = (f: Formation) => {
    setActiveFormationId(f.id);
    
    // Save to the tactical board session in localStorage
    const session = TacticalStore.getBoardSession();
    const sport = f.disciplina === "Baloncesto" ? "basketball" : "football";
    TacticalStore.saveBoardSession({
      ...session,
      sport,
      formationId: f.id,
      players: [], // Reset players so positions spawn correctly
      clearedByUser: false
    });

    toast.success(`Formación ${f.nombre} seleccionada. ¡Redirigiendo a la Pizarra!`);
    setTimeout(() => {
      navigate({ to: "/tactica/pizarra" });
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-elegant">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Formaciones</h1>
            <p className="text-xs text-muted-foreground">Biblioteca de formaciones y sistemas de juego</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold"
          onClick={() => toast.info("Editor de formaciones — Próximamente en Parte 2/3")}
        >
          <Plus className="h-3.5 w-3.5" /> Nueva Formación
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DISCIPLINE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition border ${
              filter === f
                ? "bg-primary text-white border-primary"
                : "bg-muted text-muted-foreground hover:bg-muted/85 hover:text-foreground border-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Formation grid */}
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          {filtered.map(f => {
            const isActive = f.id === activeFormationId;
            const sport = f.disciplina === "Baloncesto" ? "basketball" : "football";
            return (
              <Card
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                className={`bg-card shadow-card cursor-pointer transition-all border ${
                  isActive ? "border-primary/50 bg-primary/5 shadow-elegant" :
                  selectedId === f.id ? "border-violet-500/40 bg-violet-500/5" :
                  "border-border hover:border-border/80"
                }`}
              >
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Crosshair className="h-4 w-4 text-primary shrink-0" />
                      <CardTitle className="text-base font-bold text-foreground truncate">{f.nombre}</CardTitle>
                    </div>
                    {isActive && (
                      <Badge variant="outline" className="text-[9px] font-bold bg-primary/10 text-primary border-primary/20 shrink-0">
                        <Check className="h-2.5 w-2.5 mr-0.5" /> Activa
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[9px] border-border text-foreground font-semibold bg-muted/40">{f.disciplina}</Badge>
                    {f.predefinida && <Badge variant="outline" className="text-[9px] bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 font-semibold">Predefinida</Badge>}
                    <Badge variant="outline" className="text-[9px] border-border text-foreground font-semibold bg-muted/40">{f.slots.length} pos.</Badge>
                  </div>

                  {/* Mini field preview */}
                  <FormationPreview formation={f} sport={sport as "football" | "basketball"} />

                  <Button
                    size="sm"
                    className={`w-full text-xs gap-1.5 font-bold ${
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/20 hover:bg-primary/20"
                        : "bg-gradient-to-r from-violet-600 to-purple-700 text-white"
                    }`}
                    onClick={e => { e.stopPropagation(); handleUse(f); }}
                  >
                    {isActive ? (<><Check className="h-3.5 w-3.5" /> En uso</>) : (<><ShieldHalf className="h-3.5 w-3.5" /> Usar esta formación</>)}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sidebar: selected formation detail */}
        <div className="space-y-4">
          {selectedFormation ? (
            <Card className="bg-card shadow-card border-border sticky top-4">
              <CardHeader className="pb-3 p-4">
                <CardTitle className="text-base text-foreground font-bold">{selectedFormation.nombre}</CardTitle>
                <CardDescription className="text-muted-foreground text-xs">Posiciones y roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge variant="outline" className="text-[9px] border-border text-foreground font-semibold bg-muted/40">{selectedFormation.disciplina}</Badge>
                  {selectedFormation.predefinida && <Badge variant="outline" className="text-[9px] bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 font-semibold">Predefinida</Badge>}
                </div>

                {/* Slot list */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selectedFormation.slots.map(slot => (
                    <div key={slot.slotId} className="flex items-center gap-2 text-xs p-1.5 rounded-lg bg-muted/30 border border-border">
                      <div
                        className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                        style={{ backgroundColor: getSlotColor(slot.slotId) }}
                      >
                        {slot.slotId.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-bold leading-none truncate">{slot.slotId}</p>
                        <p className="text-muted-foreground text-[9px] mt-0.5 truncate">{slot.label}</p>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-medium shrink-0">
                        {slot.x.toFixed(0)}%/{slot.y.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => handleUse(selectedFormation)} 
                  className="w-full text-xs gap-1.5 bg-gradient-to-r from-violet-600 to-purple-700 text-white mt-2 font-bold"
                >
                  <Layers className="h-3.5 w-3.5" /> Abrir en Pizarra
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card shadow-card border-border">
              <CardContent className="p-6 text-center text-muted-foreground text-xs">
                <Layers className="h-8 w-8 mx-auto mb-2 text-primary/30" />
                Selecciona una formación para ver sus detalles
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default FormacionesTacticas;
