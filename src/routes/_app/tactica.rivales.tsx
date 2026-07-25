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
      <div className="page-header mb-6">
        <div className="flex items-center gap-3">
          <div className="icon-box icon-box-danger">
            <Swords className="h-6 w-6" />
          </div>
          <div>
            <h1 className="page-header-title">Expedientes de Rivales</h1>
            <p className="page-header-subtitle">Base de datos de inteligencia competitiva y scouter táctico</p>
          </div>
        </div>
        <Button
          size="sm"
          className="btn-primary gap-1.5"
          onClick={() => setShowAddRival(true)}
        >
          <Plus className="h-4 w-4" /> Agregar Rival
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs uppercase font-bold text-[#64748B] tracking-widest pl-1">Lista de Oponentes</p>
          <div className="space-y-2">
            {opponents.map(opp => {
              const danger = DANGER_INDEX[opp.peligrosidad];
              const isSelected = selectedOpp?.id === opp.id;
              return (
                <button
                  key={opp.id}
                  onClick={() => handleSelectOpponent(opp.id)}
                  className={`w-full text-left p-4 rounded-[12px] border transition-all duration-300 flex items-center justify-between ${
                    isSelected
                      ? "border-[#2563EB] bg-slate-50 ring-1 ring-[#2563EB]"
                      : "border-[#E2E8F0] bg-white hover:bg-slate-50 hover:border-slate-300 text-[#0F172A]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl filter drop-shadow">{opp.escudo}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[#0F172A] truncate">{opp.nombre}</p>
                      <p className="text-[11px] text-[#64748B] truncate">DT: {opp.entrenador}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`badge-pill text-[10px] ${danger.style.includes('emerald') ? 'badge-success' : danger.style.includes('amber') ? 'badge-warning' : danger.style.includes('orange') ? 'badge-warning' : 'badge-danger'}`}>
                      {danger.label}
                    </span>
                    <span className="text-[11px] font-medium text-[#64748B]">{opp.sistemaBase}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail view */}
        {selectedOpp ? (
          <div className="lg:col-span-8 space-y-4">
            <Card className="premium-card relative">
              <CardContent className="p-6 flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <span className="text-5xl filter drop-shadow-lg">{selectedOpp.escudo}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-[#0F172A]">{selectedOpp.nombre}</h2>
                    <p className="text-sm text-[#64748B]">Director Técnico: <span className="text-[#0F172A] font-semibold">{selectedOpp.entrenador}</span></p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="badge-pill badge-neutral">
                        Sistema Base: {selectedOpp.sistemaBase}
                      </Badge>
                      <Badge variant="outline" className={`badge-pill ${DANGER_INDEX[selectedOpp.peligrosidad].style.includes('emerald') ? 'badge-success' : DANGER_INDEX[selectedOpp.peligrosidad].style.includes('amber') || DANGER_INDEX[selectedOpp.peligrosidad].style.includes('orange') ? 'badge-warning' : 'badge-danger'}`}>
                        Peligrosidad: {DANGER_INDEX[selectedOpp.peligrosidad].label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Link to="/tactica/estrategias">
                  <Button size="sm" className="btn-secondary gap-1.5">
                    Preparar Estrategia <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Sub-Tabs */}
            <div className="flex gap-1 p-1 bg-[#F8F9FA] rounded-[12px] border border-[#E2E8F0] w-fit">
              <button
                onClick={() => setActiveTab("ficha")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors ${
                  activeTab === "ficha" ? "bg-[#2563EB] text-white shadow-sm" : "text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"
                }`}
              >
                <Info className="h-4 w-4" /> Ficha General
              </button>
              <button
                onClick={() => setActiveTab("analisis")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors ${
                  activeTab === "analisis" ? "bg-[#2563EB] text-white shadow-sm" : "text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"
                }`}
              >
                <FileText className="h-4 w-4" /> Fases de Juego
              </button>
              <button
                onClick={() => setActiveTab("checklist")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors ${
                  activeTab === "checklist" ? "bg-[#2563EB] text-white shadow-sm" : "text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"
                }`}
              >
                <CheckSquare className="h-4 w-4" /> Checklist Prepartido
              </button>
              <button
                onClick={() => setActiveTab("ia")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-sm font-semibold transition-colors ${
                  activeTab === "ia" ? "bg-[#2563EB] text-white shadow-sm" : "text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]"
                }`}
              >
                <BrainCircuit className={`h-4 w-4 ${activeTab === "ia" ? "text-white" : "text-amber-500"}`} /> Scouter IA
              </button>
            </div>

            {/* TAB CONTENT: FICHA GENERAL */}
            {activeTab === "ficha" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="premium-card">
                  <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                    <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-600" /> Fortalezas Clave
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-4 text-sm">
                    <ul className="space-y-2">
                      {selectedOpp.fortalezas.map((f, i) => (
                        <li key={i} className="text-[#0F172A] pl-2 border-l-2 border-emerald-500 font-medium">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                    <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-red-500" /> Debilidades Clave
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-4 text-sm">
                    <ul className="space-y-2">
                      {selectedOpp.debilidades.map((d, i) => (
                        <li key={i} className="text-[#0F172A] pl-2 border-l-2 border-red-500 font-medium">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="premium-card sm:col-span-2">
                  <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                    <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-500" /> Jugadores Clave y Destacados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedOpp.jugadoresDestacados.map(p => (
                        <Badge key={p} variant="outline" className="badge-pill badge-warning">
                          ⭐ {p}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="premium-card sm:col-span-2">
                  <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                    <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-[#2563EB]" /> Resultados Recientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-4 flex gap-3 overflow-x-auto">
                    {selectedOpp.resultadosRecientes.map((res, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 border border-[#E2E8F0] rounded-[12px] min-w-[120px]">
                        <span className="text-[11px] text-[#64748B] font-medium">{res.fecha}</span>
                        <Badge variant="outline" className={`badge-pill ${res.tipo === 'victoria' ? 'badge-success' : res.tipo === 'derrota' ? 'badge-danger' : 'badge-neutral'}`}>
                          {RESULT_SYMBOL[res.tipo]} {res.resultado}
                        </Badge>
                        <span className="text-xs text-[#64748B] truncate w-full text-center font-medium">vs {res.rival}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: FASES DE JUEGO & VIDEO SCOUTING */}
            {activeTab === "analisis" && (
              <div className="space-y-4">
                <Card className="premium-card">
                  <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                    <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-[#2563EB]" /> 🧠 Análisis Táctico Base & Estructura de Juego
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 space-y-6 text-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 rounded-[12px] border border-[#E2E8F0] bg-slate-50 space-y-2">
                        <p className="kpi-label">Estructura & Bloque Defensivo</p>
                        <p className="font-bold text-[#0F172A]">Sistema: {selectedOpp.sistemaBase} · <span className="text-amber-600 font-bold">Bloque Medio-Bajo</span></p>
                        <p className="text-xs text-[#64748B]">Suelen replegar a 2 líneas de 4 al perder el balón en 3/4 de cancha.</p>
                      </div>

                      <div className="p-4 rounded-[12px] border border-[#E2E8F0] bg-slate-50 space-y-2">
                        <p className="kpi-label">Presión & Salida de Balón</p>
                        <p className="font-bold text-[#0F172A]"><span className="text-emerald-600 font-bold">Presión Tras Pérdida</span></p>
                        <p className="text-xs text-[#64748B]">Presionan los primeros 3 segundos con pivote y extremos para forzar el error.</p>
                      </div>
                    </div>

                    {/* Jugadores Peligrosos */}
                    <div className="pt-4 space-y-3 border-t border-[#E2E8F0]">
                      <p className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> 🎯 Jugadores Peligrosos (Marca Especial)
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="p-4 rounded-[12px] border border-amber-200 bg-amber-50 space-y-1.5">
                          <p className="font-bold text-sm text-[#0F172A]">#7 - Extremo Izquierdo (Rápido)</p>
                          <p className="text-xs text-[#475569] font-medium">Engancha hacia adentro para buscar remate de diestra. <span className="text-[#2563EB] font-bold">Marca: Cobertura de lateral + ayuda de contención.</span></p>
                        </div>

                        <div className="p-4 rounded-[12px] border border-amber-200 bg-amber-50 space-y-1.5">
                          <p className="font-bold text-sm text-[#0F172A]">#10 - Volante Organizador</p>
                          <p className="text-xs text-[#475569] font-medium">Excelente visión de pase filtrado a la espalda de centrales. <span className="text-[#2563EB] font-bold">Marca: Presión apretada antes de recepción.</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Video Clips de Táctica Fija */}
                    <div className="pt-4 space-y-3 border-t border-[#E2E8F0]">
                      <p className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Video className="h-4 w-4 text-teal-600" /> 🎥 Video Clips de Táctica Fija (Balón Parado)
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="p-4 rounded-[12px] border border-[#E2E8F0] bg-slate-50 flex flex-col gap-3">
                          <div>
                            <p className="font-bold text-sm text-[#0F172A]">Córner Defensivo - Marca en Zona</p>
                            <p className="text-xs text-[#64748B] mt-0.5">Clip de 25s · Salida de esquina corta</p>
                          </div>
                          <Button size="sm" variant="outline" className="w-full text-xs font-bold gap-1.5 border-teal-500 text-teal-700 bg-white hover:bg-teal-50">
                            <Video className="h-3.5 w-3.5" /> Ver Clip
                          </Button>
                        </div>

                        <div className="p-4 rounded-[12px] border border-[#E2E8F0] bg-slate-50 flex flex-col gap-3">
                          <div>
                            <p className="font-bold text-sm text-[#0F172A]">Tiro Libre Directo - Jugada Ensayada</p>
                            <p className="text-xs text-[#64748B] mt-0.5">Clip de 18s · Pase raso al borde del área</p>
                          </div>
                          <Button size="sm" variant="outline" className="w-full text-xs font-bold gap-1.5 border-teal-500 text-teal-700 bg-white hover:bg-teal-50">
                            <Video className="h-3.5 w-3.5" /> Ver Clip
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB CONTENT: CHECKLIST PREPARTIDO */}
            {activeTab === "checklist" && (
              <Card className="premium-card">
                <CardHeader className="p-4 pb-2 border-b border-[#E2E8F0]">
                  <CardTitle className="text-sm text-[#0F172A] font-bold">Preparación del partido vs {selectedOpp.nombre}</CardTitle>
                  <CardDescription className="text-xs text-[#64748B]">Marca los preparativos completados por el cuerpo técnico</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-4 space-y-3">
                  {checklist.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className="flex items-center gap-3 p-3 rounded-[8px] border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.completado}
                        onChange={() => {}} // Controlled via onClick on container
                        className="rounded border-[#E2E8F0] bg-white text-[#2563EB] focus:ring-[#2563EB] h-4 w-4 cursor-pointer"
                      />
                      <span className={`text-sm ${item.completado ? "line-through text-[#94A3B8]" : "text-[#0F172A] font-medium"}`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[#64748B] ml-auto shrink-0">
                        {item.categoria}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* TAB CONTENT: SCOUTER IA */}
            {activeTab === "ia" && (
              <Card className="premium-card bg-orange-50/50 border-orange-200">
                <CardHeader className="p-4 pb-2 border-b border-orange-200">
                  <CardTitle className="text-sm text-[#0F172A] font-bold flex items-center gap-1.5">
                    <BrainCircuit className="h-4 w-4 text-orange-600" /> DeportivOS IA Scouting Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-4 text-sm space-y-4">
                  <p className="text-[#475569] leading-relaxed">
                    Basado en las debilidades del rival y nuestra disponibilidad actual, se sugiere utilizar un esquema <strong>4-3-3 Abierto</strong>.
                  </p>
                  <div className="bg-white p-4 rounded-[12px] border border-orange-200 space-y-2">
                    <p className="font-bold text-[#0F172A]">Recomendación Táctica Principal:</p>
                    <p className="text-[#475569] text-xs leading-relaxed">
                      Aprovechar los contraataques directos. La debilidad en su repliegue defensivo nos permite transicionar rápido con nuestros extremos. Se aconseja presionar intensamente en zona media.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/tactica/analisis-ia" className="flex-1">
                      <Button size="sm" className="w-full text-sm bg-orange-600 hover:bg-orange-700 text-white font-bold gap-1.5 rounded-[8px] py-2">
                        <BrainCircuit className="h-4 w-4" /> Abrir Consola IA Táctica
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
