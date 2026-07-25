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
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-[#E2E8F0] text-[#0F172A]">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight">Formaciones</h1>
            <p className="text-[#64748B] text-sm">Biblioteca de formaciones y sistemas de juego</p>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5"
          onClick={() => toast.info("Editor de formaciones — Próximamente en Parte 2/3")}
        >
          <Plus className="h-4 w-4" /> Nueva Formación
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {DISCIPLINE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border ${
              filter === f
                ? "bg-[#2563EB] text-white border-[#2563EB]"
                : "bg-white text-[#475569] hover:bg-slate-50 border-[#E2E8F0]"
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
                className={`bg-white shadow-sm cursor-pointer transition-all border rounded-[12px] overflow-hidden ${
                  isActive ? "border-[#2563EB] ring-1 ring-[#2563EB]" :
                  selectedId === f.id ? "border-blue-300 bg-blue-50/50" :
                  "border-[#E2E8F0] hover:border-slate-300"
                }`}
              >
                <CardHeader className="pb-2 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Crosshair className="h-4 w-4 text-[#2563EB] shrink-0" />
                      <CardTitle className="text-base font-bold text-[#0F172A] truncate">{f.nombre}</CardTitle>
                    </div>
                    {isActive && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium shrink-0">
                        <Check className="h-3 w-3 mr-1" /> Activa
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-slate-100 text-[#475569] border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">{f.disciplina}</Badge>
                    {f.predefinida && <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">Predefinida</Badge>}
                    <Badge variant="outline" className="bg-slate-100 text-[#475569] border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">{f.slots.length} pos.</Badge>
                  </div>

                  {/* Mini field preview */}
                  <FormationPreview formation={f} sport={sport as "football" | "basketball"} />

                  <Button
                    size="sm"
                    className={`w-full rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5 ${
                      isActive
                        ? "bg-slate-100 text-[#0F172A] hover:bg-slate-200"
                        : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                    }`}
                    onClick={e => { e.stopPropagation(); handleUse(f); }}
                  >
                    {isActive ? (<><Check className="h-4 w-4" /> En uso</>) : (<><ShieldHalf className="h-4 w-4" /> Usar esta formación</>)}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sidebar: selected formation detail */}
        <div className="space-y-4">
          {selectedFormation ? (
            <Card className="bg-white shadow-sm border border-[#E2E8F0] rounded-[12px] sticky top-4">
              <CardHeader className="pb-3 p-4 border-b border-[#E2E8F0]">
                <CardTitle className="text-base text-[#0F172A] font-bold">{selectedFormation.nombre}</CardTitle>
                <CardDescription className="text-[#64748B] text-sm">Posiciones y roles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-4">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge variant="outline" className="bg-slate-100 text-[#475569] border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">{selectedFormation.disciplina}</Badge>
                  {selectedFormation.predefinida && <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-none rounded-full px-[10px] py-[4px] text-[12px] font-medium">Predefinida</Badge>}
                </div>

                {/* Slot list */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selectedFormation.slots.map(slot => (
                    <div key={slot.slotId} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50 border border-[#E2E8F0]">
                      <div
                        className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ backgroundColor: getSlotColor(slot.slotId) }}
                      >
                        {slot.slotId.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0F172A] font-bold leading-none truncate">{slot.slotId}</p>
                        <p className="text-[#64748B] text-[11px] mt-0.5 truncate">{slot.label}</p>
                      </div>
                      <span className="text-[11px] text-[#64748B] font-medium shrink-0">
                        {slot.x.toFixed(0)}%/{slot.y.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => handleUse(selectedFormation)} 
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium gap-1.5 mt-2"
                >
                  <Layers className="h-4 w-4" /> Abrir en Pizarra
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white shadow-sm border border-[#E2E8F0] rounded-[12px]">
              <CardContent className="p-6 text-center text-[#64748B] text-sm flex flex-col items-center">
                <Layers className="h-8 w-8 mx-auto mb-2 text-slate-300" />
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
