import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TacticalStore, Opponent, PregameChecklist } from "@/lib/tactical-store";
import RendimientoStore from "@/lib/rendimiento-store";
import {
  Swords, Plus, ShieldAlert, Award, Star, Info, TrendingUp,
  Video, Eye, BrainCircuit, CheckSquare, FileText, ArrowRight,
  Shield, AlertTriangle, ArrowLeftRight, Layout, Calendar
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tactica/rivales")({ component: RivalesTacticos });

const DANGER_INDEX: Record<Opponent["peligrosidad"], { label: string; style: string }> = {
  bajo:     { label: "🟢 Bajo",     style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  medio:    { label: "🟡 Medio",    style: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  alto:     { label: "🟠 Alto",     style: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  "muy-alto":{ label: "🔴 Muy Alto",  style: "bg-red-500/10 text-red-700 dark:text-red-450 border-red-500/20" },
};

const RESULT_BADGE: Record<string, string> = {
  victoria: "bg-emerald-500/15 text-emerald-750 dark:text-emerald-400 border-emerald-500/20",
  derrota:  "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20",
  empate:   "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

const RESULT_SYMBOL: Record<string, string> = {
  victoria: "V", derrota: "D", empate: "E"
};

function RivalesTacticos() {
  const dbPartidos = RendimientoStore.getPartidos();
  const customOpponents = TacticalStore.getOpponents();

  const opponents = useMemo(() => {
    const rivalNames = Array.from(new Set(dbPartidos.map(m => m.rival).filter(Boolean)));
    const extracted: Opponent[] = rivalNames.map((rivalName, idx) => {
      const rivalMatches = dbPartidos.filter(m => m.rival === rivalName);
      const resultadosRecientes = rivalMatches.map(m => {
        let tipo: "victoria" | "derrota" | "empate" = "empate";
        if (m.resultado) {
          if (m.resultado.propio > m.resultado.rival) {
            tipo = "derrota";
          } else if (m.resultado.propio < m.resultado.rival) {
            tipo = "victoria";
          }
        }
        return {
          fecha: m.fecha,
          resultado: m.resultado ? `${m.resultado.rival}-${m.resultado.propio}` : "Programado",
          rival: m.equipo,
          tipo
        };
      });

      return {
        id: `db-opp-${rivalName}`,
        nombre: rivalName,
        escudo: ["🛡️", "🦅", "🦁", "⚡"][idx % 4],
        entrenador: "D.T. Rival",
        sistemaBase: "4-3-3",
        fortalezas: ["Transiciones ofensivas rápidas", "Juego colectivo"],
        debilidades: ["Repliegue defensivo lento", "Vulnerabilidad defensiva por las bandas"],
        resultadosRecientes,
        jugadoresDestacados: ["Extremo veloz", "Mediocentro de control"],
        observaciones: `Rival extraído del calendario de partidos del club.`,
        peligrosidad: "medio",
      };
    });

    const filteredCustom = customOpponents.filter(o => o.id !== "op1" && o.id !== "op2");
    return [...extracted, ...filteredCustom];
  }, [dbPartidos, customOpponents]);

  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ficha" | "analisis" | "checklist" | "ia">("ficha");
  const [showAddRival, setShowAddRival] = useState(false);

  // New Opponent Form State
  const [newRivalForm, setNewRivalForm] = useState({
    nombre: "",
    escudo: "⚽",
    entrenador: "",
    sistemaBase: "4-3-3",
    peligrosidad: "medio" as Opponent["peligrosidad"],
    observaciones: "",
  });

  const activeOpponentId = selectedOpponentId || opponents[0]?.id || null;
  const selectedOpp = opponents.find(o => o.id === activeOpponentId) ?? opponents[0];

  // Pregame Checklist for the match against selected Opponent
  const [checklist, setChecklist] = useState<PregameChecklist>(() =>
    TacticalStore.getPregameChecklist(selectedOpp?.id ?? "default")
  );

  useEffect(() => {
    if (selectedOpp?.id) {
      setChecklist(TacticalStore.getPregameChecklist(selectedOpp.id));
    }
  }, [selectedOpp?.id]);

  const handleToggleChecklistItem = (itemId: string) => {
    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, completado: !item.completado } : item
    );
    const updatedChecklist = { ...checklist, items: updatedItems };
    setChecklist(updatedChecklist);
    TacticalStore.savePregameChecklist(updatedChecklist);
    toast.success("Estado del checklist actualizado");
  };

  const handleSelectOpponent = (id: string) => {
    setSelectedOpponentId(id);
    const cl = TacticalStore.getPregameChecklist(id);
    setChecklist(cl);
  };

  const handleAddRival = () => {
    if (!newRivalForm.nombre || !newRivalForm.entrenador) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }
    const newOpp: Opponent = {
      id: `opp-${Date.now()}`,
      nombre: newRivalForm.nombre,
      escudo: newRivalForm.escudo,
      entrenador: newRivalForm.entrenador,
      sistemaBase: newRivalForm.sistemaBase,
      peligrosidad: newRivalForm.peligrosidad,
      fortalezas: ["Presión alta intensa", "Juego por las bandas"],
      debilidades: ["Espacios tras los centrales", "Defensa de balones parados"],
      resultadosRecientes: [
        { fecha: "2026-07-01", resultado: "1-1", rival: "Nosotros", tipo: "empate" }
      ],
      jugadoresDestacados: ["Delantero Centro (Nueve)", "Mediocentro Creativo"],
      observaciones: newRivalForm.observaciones || "Rival de nivel intermedio, buena transición ofensiva.",
    };
    
    TacticalStore.saveOpponent(newOpp);
    
    setSelectedOpponentId(newOpp.id);
    setShowAddRival(false);
    setNewRivalForm({
      nombre: "",
      escudo: "⚽",
      entrenador: "",
      sistemaBase: "4-3-3",
      peligrosidad: "medio",
      observaciones: "",
    });
    toast.success("Rival agregado correctamente");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-orange-700 text-white shadow-elegant">
            <Swords className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Expedientes de Rivales</h1>
            <p className="text-xs text-muted-foreground">Base de datos de inteligencia competitiva y scouter táctico</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs bg-gradient-to-r from-red-600 to-orange-700 text-white font-bold"
          onClick={() => setShowAddRival(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Agregar Rival
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Sidebar: Rival selection list */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest pl-1">Lista de Oponentes</p>
          <div className="space-y-2">
            {opponents.map(opp => {
              const danger = DANGER_INDEX[opp.peligrosidad];
              const isSelected = selectedOpp?.id === opp.id;
              return (
                <button
                  key={opp.id}
                  onClick={() => handleSelectOpponent(opp.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-300 flex items-center justify-between ${
                    isSelected
                      ? "border-orange-500/40 bg-orange-500/5 shadow-sm"
                      : "border-border bg-card/40 hover:bg-card/80 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl filter drop-shadow">{opp.escudo}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-foreground truncate">{opp.nombre}</p>
                      <p className="text-[10px] text-muted-foreground truncate">DT: {opp.entrenador}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${danger.style}`}>
                      {danger.label}
                    </span>
                    <span className="text-[8px] text-muted-foreground">{opp.sistemaBase}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail view */}
        {selectedOpp ? (
          <div className="lg:col-span-8 space-y-4">
            {/* Header info */}
            <Card className="bg-card border-border overflow-hidden relative">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />
              <CardContent className="p-5 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <span className="text-5xl filter drop-shadow-lg">{selectedOpp.escudo}</span>
                  <div>
                    <h2 className="text-lg font-black text-foreground">{selectedOpp.nombre}</h2>
                    <p className="text-xs text-muted-foreground">Director Técnico: <span className="text-foreground font-semibold">{selectedOpp.entrenador}</span></p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[9px] font-bold border-border text-foreground">
                        Sistema Base: {selectedOpp.sistemaBase}
                      </Badge>
                      <Badge variant="outline" className={`text-[9px] font-black ${DANGER_INDEX[selectedOpp.peligrosidad].style}`}>
                        Peligrosidad: {DANGER_INDEX[selectedOpp.peligrosidad].label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Link to="/tactica/estrategias">
                  <Button size="sm" className="text-xs bg-background border border-border hover:bg-muted text-foreground gap-1.5">
                    Preparar Estrategia <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Sub-Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl border border-border w-fit">
              <button
                onClick={() => setActiveTab("ficha")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "ficha" ? "bg-primary text-white" : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                <Info className="h-3.5 w-3.5" /> Ficha General
              </button>
              <button
                onClick={() => setActiveTab("analisis")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "analisis" ? "bg-primary text-white" : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Fases de Juego
              </button>
              <button
                onClick={() => setActiveTab("checklist")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "checklist" ? "bg-primary text-white" : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" /> Checklist Prepartido
              </button>
              <button
                onClick={() => setActiveTab("ia")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "ia" ? "bg-primary text-white" : "text-muted-foreground hover:bg-background hover:text-foreground"
                }`}
              >
                <BrainCircuit className="h-3.5 w-3.5 text-orange-500" /> Scouter IA
              </button>
            </div>

            {/* TAB CONTENT: FICHA GENERAL */}
            {activeTab === "ficha" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-card border-border">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-foreground flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Fortalezas Clave
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs">
                    <ul className="space-y-1.5">
                      {selectedOpp.fortalezas.map((f, i) => (
                        <li key={i} className="text-foreground pl-2 border-l-2 border-emerald-500/60 font-medium">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-500 dark:text-red-400" /> Debilidades Clave
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs">
                    <ul className="space-y-1.5">
                      {selectedOpp.debilidades.map((d, i) => (
                        <li key={i} className="text-foreground pl-2 border-l-2 border-red-500/60 font-medium">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border sm:col-span-2">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-xs text-foreground flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-500" /> Jugadores Clave y Destacados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOpp.jugadoresDestacados.map(p => (
                        <Badge key={p} variant="outline" className="text-[10px] bg-amber-500/5 text-amber-800 dark:text-amber-300 border-amber-500/20 font-semibold">
                          ⭐ {p}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border sm:col-span-2">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-xs text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Resultados Recientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 flex gap-2 overflow-x-auto">
                    {selectedOpp.resultadosRecientes.map((res, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 p-2 bg-muted/40 border border-border rounded-lg min-w-[90px]">
                        <span className="text-[10px] text-muted-foreground font-medium">{res.fecha}</span>
                        <Badge variant="outline" className={`text-[9px] font-black ${RESULT_BADGE[res.tipo]}`}>
                          {RESULT_SYMBOL[res.tipo]} {res.resultado}
                        </Badge>
                        <span className="text-[8px] text-muted-foreground truncate w-full text-center font-medium">vs {res.rival}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: FASES DE JUEGO */}
            {activeTab === "analisis" && (
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4 space-y-4 text-xs">
                    <div>
                      <h4 className="font-bold text-foreground mb-1">Ataque y Transiciones Ofensivas</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Tienden a iniciar salida rápida por bandas explotando el sistema base. {selectedOpp.fortalezas[0] || "Buen desborde"}.
                      </p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <h4 className="font-bold text-foreground mb-1">Defensa y Repliegues</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Transición defensiva lenta. Suelen dejar amplios espacios a la espalda de los mediocampistas creativos.
                      </p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <h4 className="font-bold text-foreground mb-1">Pelota Parada</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Fuerte defensa en zona para saques de esquina, pero vulnerables a combinaciones rápidas de esquina corta.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: CHECKLIST PREPARTIDO */}
            {activeTab === "checklist" && (
              <Card className="bg-card border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs text-foreground">Preparación del partido vs {selectedOpp.nombre}</CardTitle>
                  <CardDescription className="text-[10px]">Marca los preparativos completados por el cuerpo técnico</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {checklist.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/40 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={item.completado}
                        onChange={() => {}} // Controlled via onClick on container
                        className="rounded border-input bg-background text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className={`text-xs ${item.completado ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>
                        {item.label}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground/60 ml-auto shrink-0">
                        {item.categoria}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: SCOUTER IA */}
            {activeTab === "ia" && (
              <Card className="bg-gradient-to-r from-card to-orange-500/5 border-orange-500/20">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs text-foreground flex items-center gap-1.5">
                    <BrainCircuit className="h-4 w-4 text-orange-500" /> Athletix IA Scouting Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs space-y-3">
                  <p className="text-muted-foreground leading-relaxed">
                    Basado en las debilidades del rival y nuestra disponibilidad actual, se sugiere utilizar un esquema <strong>4-3-3 Abierto</strong>.
                  </p>
                  <div className="bg-muted/50 p-3 rounded-lg border border-border space-y-2">
                    <p className="font-bold text-foreground">Recomendación Táctica Principal:</p>
                    <p className="text-muted-foreground text-[11px]">
                      Aprovechar los contraataques directos. La debilidad en su repliegue defensivo nos permite transicionar rápido con nuestros extremos. Se aconseja presionar intensamente en zona media.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/tactica/analisis-ia" className="flex-1">
                      <Button size="sm" className="w-full text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold gap-1.5 shadow-elegant">
                        <BrainCircuit className="h-3.5 w-3.5" /> Abrir Consola IA Táctica
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 text-center py-12 text-muted-foreground">
            <Swords className="h-12 w-12 mx-auto mb-2 opacity-20" />
            No hay rivales registrados.
          </div>
        )}
      </div>

      {/* Add Rival Modal */}
      {showAddRival && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <Swords className="h-4 w-4 text-orange-500" /> Registrar Nuevo Rival
              </CardTitle>
              <button className="text-muted-foreground hover:text-foreground text-xs" onClick={() => setShowAddRival(false)}>✕ Cerrar</button>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">Escudo (Emoji)</label>
                  <input
                    value={newRivalForm.escudo}
                    onChange={e => setNewRivalForm(f => ({ ...f, escudo: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background text-center text-lg text-foreground outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-muted-foreground mb-1 block">Nombre del Rival *</label>
                  <input
                    placeholder="E.g. Saprissa FC"
                    value={newRivalForm.nombre}
                    onChange={e => setNewRivalForm(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Director Técnico *</label>
                <input
                  placeholder="Nombre del entrenador"
                  value={newRivalForm.entrenador}
                  onChange={e => setNewRivalForm(f => ({ ...f, entrenador: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Sistema Táctico</label>
                  <input
                    placeholder="E.g. 4-4-2"
                    value={newRivalForm.sistemaBase}
                    onChange={e => setNewRivalForm(f => ({ ...f, sistemaBase: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Nivel de Peligro</label>
                  <select
                    value={newRivalForm.peligrosidad}
                    onChange={e => setNewRivalForm(f => ({ ...f, peligrosidad: e.target.value as Opponent["peligrosidad"] }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  >
                    <option value="bajo" className="text-foreground bg-background">🟢 Bajo</option>
                    <option value="medio" className="text-foreground bg-background">🟡 Medio</option>
                    <option value="alto" className="text-foreground bg-background"><b>🟠 Alto</b></option>
                    <option value="muy-alto" className="text-foreground bg-background">🔴 Muy Alto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Observaciones Iniciales</label>
                <textarea
                  placeholder="Detalles sobre su estilo de juego..."
                  value={newRivalForm.observaciones}
                  onChange={e => setNewRivalForm(f => ({ ...f, observaciones: e.target.value }))}
                  className="w-full h-16 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs" onClick={handleAddRival}>
                  Registrar Rival
                </Button>
                <Button size="sm" variant="outline" className="border-border text-muted-foreground text-xs" onClick={() => setShowAddRival(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default RivalesTacticos;
