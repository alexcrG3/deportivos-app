import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TacticalStore } from "@/lib/tactical-store";
import { AIStore } from "@/lib/ai-store";
import { useRole } from "@/hooks/use-role";
import {
  Brain, Send, Sparkles, AlertTriangle, CheckCircle, HelpCircle,
  Lightbulb, ShieldAlert, Swords, Terminal, Printer, FileText, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tactica/analisis-ia")({ component: AnalisisIATactica });

function AnalisisIATactica() {
  const { role } = useRole();
  const summary = TacticalStore.getSummary();
  const recs = AIStore.getRecommendations().slice(0, 3);
  const nextRival = TacticalStore.getOpponents()[0];

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    {
      sender: "ai",
      text: "👋 ¡Hola, Entrenador! Soy tu Copiloto Táctico AI. He analizado el estado del plantel (disponibilidad física) y el próximo rival. ¿En qué puedo ayudarte hoy? Por ejemplo: *¿Cómo neutralizamos el ataque aéreo del próximo rival?* o *¿Qué alineación es más segura físicamente?*"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{
    fortalezas: string[];
    debilidades: string[];
    errores: string[];
    positivos: string[];
    mejorar: string[];
    recomendaciones: string[];
    pasos: string[];
    confianza: string;
  } | null>(null);

  const handleSend = () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setQuery("");
    setLoading(true);

    setTimeout(() => {
      const response = AIStore.processUserQuery("tactica-session", userMsg, role);
      setMessages(prev => [...prev, { sender: "ai", text: response.text }]);
      setLoading(false);
      toast.success("Análisis IA táctico completado");
    }, 1200);
  };

  const handleGenerateReport = () => {
    setLoading(true);
    setTimeout(() => {
      setReport({
        fortalezas: [
          "Buen repliegue defensivo rápido en bloque bajo.",
          "Transiciones rápidas con extremos veloces (J10 y J11).",
          "Excelente recuperación tras pérdida en menos de 6 segundos."
        ],
        debilidades: [
          "Distancia excesiva entre la línea de mediocampistas y centrales.",
          "Vulnerabilidad en saques de banda largos al área propia.",
          "Bajo porcentaje de duelos aéreos ganados por los defensas."
        ],
        errores: [
          "Pérdida de marca en pelota parada en el minuto 72 del último encuentro.",
          "Falta de presión en salida sobre el mediocentro creativo rival."
        ],
        positivos: [
          "Sports Score promedio del equipo se mantiene en 87%.",
          "Disponibilidad de jugadores clave en zona verde sin riesgos de sobrecarga."
        ],
        mejorar: [
          "Cohesión y comunicación del bloque de centrales en la zona de definición.",
          "Precisión del pase vertical largo."
        ],
        recomendaciones: [
          "Utilizar un esquema táctico 4-3-3 Abierto para ensanchar al rival.",
          "Presionar alto los primeros 20 minutos para provocar fallos en salida del rival.",
          "Dosificar a J4 para prevenir sobrecargas en isquiotibiales."
        ],
        pasos: [
          "Sesión de videoanálisis el martes enfocada en repliegue rápido.",
          "Práctica de balón parado defensivo el jueves en el entrenamiento.",
          "Reunión individual de scouter con el bloque defensivo."
        ],
        confianza: "Alta (94%)"
      });
      setLoading(false);
      toast.success("Informe táctico de IA generado con éxito");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          /* Hide main sidebar, topbar, floating buttons */
          aside, nav, header, [data-sidebar="sidebar"], .app-sidebar, .app-topbar, .float-ai-button {
            display: none !important;
          }
          
          /* Hide page controls and buttons */
          .no-print, button, a {
            display: none !important;
          }
          
          /* Hide interactive chat and widget columns */
          .lg\\:col-span-1, .h-\\[480px\\], .no-print {
            display: none !important;
          }
          
          /* Reset layout padding and spacing */
          .flex-1.p-6, main, .p-6, .grid {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          
          /* Style the report card to be clean and full page */
          .print-report-card {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            border: 2px solid #e2e8f0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 1.5rem !important;
            border-radius: 12px !important;
          }

          /* Force text readable contrast on print */
          .print-report-card text-foreground,
          .print-report-card p,
          .print-report-card span,
          .print-report-card h1,
          .print-report-card h2,
          .print-report-card h3,
          .print-report-card h4,
          .print-report-card li {
            color: #0f172a !important;
          }

          /* Colors of strengths and weaknesses borders */
          .print-report-card .border-l {
            border-left-width: 3px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="page-header mb-6 no-print">
        <div className="flex items-center gap-3">
          <div className="icon-box icon-box-primary">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="page-header-title">Análisis Táctico IA</h1>
            <p className="page-header-subtitle">Recomendaciones del modelo LLM orquestado con Sports Science</p>
          </div>
        </div>
        <div className="flex gap-2">
          {report && (
            <Button size="sm" variant="outline" className="btn-secondary gap-1.5" onClick={() => { window.print(); toast.info("Generando PDF..."); }}>
              <Printer className="h-4 w-4" /> Exportar Reporte
            </Button>
          )}
          <Button
            size="sm"
            className="btn-primary gap-1.5"
            onClick={handleGenerateReport}
          >
            <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" /> Analizar Partido con IA
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left Column: AI Chat Assistant & Report */}
        <div className="lg:col-span-2 space-y-4">
          {/* Detailed IA Report Card */}
          {report && (
            <Card className="premium-card print-report-card">
              <CardHeader className="pb-3 border-b border-[#E2E8F0] bg-slate-50/50">
                <CardTitle className="text-base text-[#0F172A] flex items-center gap-2 font-bold">
                  <Brain className="h-5 w-5 text-[#2563EB]" /> Informe Táctico e Insights de IA
                </CardTitle>
                <CardDescription className="text-sm">Generado automáticamente analizando el plantel y el rival</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-sm">
                {/* 2 column lists */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="font-bold text-emerald-700 flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Fortalezas</p>
                    {report.fortalezas.map((f, i) => <p key={i} className="text-[#0F172A] pl-3 border-l-2 border-emerald-500 font-medium">{f}</p>)}
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-red-700 flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> Debilidades</p>
                    {report.debilidades.map((d, i) => <p key={i} className="text-[#0F172A] pl-3 border-l-2 border-red-500 font-medium">{d}</p>)}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 border-t border-[#E2E8F0] pt-6">
                  <div className="space-y-2">
                    <p className="font-bold text-amber-700 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Errores Críticos Detectados</p>
                    {report.errores.map((e, i) => <p key={i} className="text-[#0F172A] pl-3 border-l-2 border-amber-500 font-medium">{e}</p>)}
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-[#2563EB] flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Aspectos Positivos / Por Mejorar</p>
                    {report.positivos.map((p, i) => <p key={i} className="text-[#0F172A] pl-3 border-l-2 border-blue-400 font-medium">{p}</p>)}
                    {report.mejorar.map((p, i) => <p key={i} className="text-[#0F172A] pl-3 border-l-2 border-indigo-400 font-medium">🔧 {p}</p>)}
                  </div>
                </div>

                <div className="border-t border-[#E2E8F0] pt-6 space-y-3 bg-slate-50 p-4 rounded-[12px]">
                  <p className="font-bold text-[#0F172A] flex items-center gap-1.5 text-base"><Lightbulb className="h-5 w-5 text-amber-500" /> Plan de Acción Recomendado</p>
                  <div className="space-y-2">
                    {report.recomendaciones.map((r, i) => (
                      <p key={i} className="text-[#0F172A] pl-3 border-l-[3px] border-amber-400 font-medium bg-white p-2 rounded-r-[8px]">💡 {r}</p>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#E2E8F0] pt-6 space-y-3">
                  <p className="font-bold text-[#0F172A] flex items-center gap-1.5 text-base"><FileText className="h-5 w-5 text-[#2563EB]" /> Siguientes Pasos de Entrenamiento</p>
                  <div className="space-y-2">
                    {report.pasos.map((s, i) => (
                      <p key={i} className="text-[#0F172A] pl-3 border-l-[3px] border-[#2563EB] font-medium bg-slate-50 p-2 rounded-r-[8px]">• {s}</p>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#E2E8F0] pt-4 flex justify-between items-center text-xs text-[#64748B]">
                  <span>Generado por: DeportivOS AI Core</span>
                  <span>Confianza del Modelo: <strong className="text-emerald-600">{report.confianza}</strong></span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="premium-card flex flex-col h-[480px] no-print">
            <CardHeader className="pb-3 border-b border-[#E2E8F0] shrink-0">
              <CardTitle className="text-base flex items-center gap-2 text-[#0F172A] font-bold">
                <Terminal className="h-5 w-5 text-[#2563EB]" />
                Copiloto Táctico Interactivo
              </CardTitle>
              <CardDescription className="text-sm">Consulta automatizada y simulación de escenarios de juego</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/30">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 max-w-[85%] ${
                    m.sender === "user" ? "ml-auto flex-row-reverse" : ""
                  }`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                    m.sender === "user" ? "bg-[#2563EB] text-white" : "bg-violet-600 text-white"
                  }`}>
                    {m.sender === "user" ? "U" : "🤖"}
                  </div>
                  <div className={`p-4 rounded-[12px] text-sm leading-relaxed border font-medium ${
                    m.sender === "user"
                      ? "bg-[#2563EB] border-[#2563EB] text-white rounded-tr-none"
                      : "bg-white border-[#E2E8F0] text-[#0F172A] rounded-tl-none shadow-sm"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 items-center text-sm text-[#64748B]">
                  <div className="h-8 w-8 rounded-full bg-violet-600 text-white flex items-center justify-center animate-pulse">🤖</div>
                  <span className="animate-pulse">Procesando tácticas y analizando rival...</span>
                </div>
              )}
            </CardContent>
            {/* Input row */}
            <div className="p-4 border-t border-[#E2E8F0] flex gap-2 shrink-0 bg-white rounded-b-[12px]">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Pregunta a la IA táctica (ej. ¿Qué formación me recomiendas?)..."
                className="flex-1 bg-white border border-[#E2E8F0] rounded-[8px] px-4 py-2 text-sm text-[#0F172A] outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent placeholder:text-[#94A3B8]"
              />
              <Button size="icon" onClick={handleSend} className="bg-[#2563EB] text-white h-10 w-10 shrink-0 hover:bg-[#1D4ED8] rounded-[8px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Preloaded analysis */}
        <div className="space-y-4 no-print">

          {/* Plantel Status Card */}
          <Card className="premium-card">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="kpi-label flex items-center gap-1.5 text-xs">
                <Lightbulb className="h-4 w-4 text-emerald-600" />
                Disponibilidad Táctica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="border border-emerald-200 bg-emerald-50 p-2 rounded-[8px] text-emerald-700">
                  <p>🟢 Aptos</p>
                  <p className="text-xl font-black mt-1">{summary.jugadoresDisponibles}</p>
                </div>
                <div className="border border-amber-200 bg-amber-50 p-2 rounded-[8px] text-amber-700">
                  <p>🟡 Alerta</p>
                  <p className="text-xl font-black mt-1">{summary.jugadoresPrecaucion}</p>
                </div>
                <div className="border border-red-200 bg-red-50 p-2 rounded-[8px] text-red-700">
                  <p>🔴 Riesgo</p>
                  <p className="text-xl font-black mt-1">{summary.jugadoresNoRecomendados}</p>
                </div>
              </div>
              <p className="text-[#64748B] leading-relaxed text-xs font-medium">
                {summary.jugadoresNoRecomendados > 0
                  ? `⚠️ Atención: ${summary.jugadoresNoRecomendados} jugadores clave presentan fatiga. Evita cargarlos físicamente en el esquema táctico.`
                  : "✅ Todo el plantel se encuentra en condiciones óptimas para el partido."}
              </p>
            </CardContent>
          </Card>

          {/* AI Insights & Recs */}
          <Card className="premium-card">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="kpi-label flex items-center gap-1.5 text-xs">
                <Sparkles className="h-4 w-4 text-violet-600" />
                Alertas y Sugerencias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {recs.map(r => (
                <div key={r.id} className="p-3 rounded-[8px] border border-violet-100 bg-violet-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-bold text-[#0F172A] text-sm">{r.jugador}</p>
                    <Badge variant="outline" className={`badge-pill text-[10px] ${
                      r.prioridad === "critica" ? "badge-danger" : "badge-warning"
                    }`}>{r.prioridad}</Badge>
                  </div>
                  <p className="text-[#475569] text-xs leading-relaxed font-medium">{r.texto}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Opponent analysis summary */}
          {nextRival && (
            <Card className="premium-card">
              <CardHeader className="pb-3 border-b border-[#E2E8F0]">
                <CardTitle className="kpi-label flex items-center gap-1.5 text-xs">
                  <Swords className="h-4 w-4 text-orange-500" />
                  Rival: Inteligencia IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{nextRival.escudo}</span>
                  <div>
                    <p className="font-bold text-[#0F172A] text-base">{nextRival.nombre}</p>
                    <p className="text-[#64748B] text-xs font-medium">DT: {nextRival.entrenador}</p>
                  </div>
                </div>
                <p className="text-xs text-amber-800 italic bg-amber-50 p-3 rounded-[8px] border border-amber-200 mt-2 font-medium">
                  💡 Recomendación IA: {nextRival.nombre} usa esquema {nextRival.sistemaBase}. Se aconseja presionar la salida de sus defensas lentos.
                </p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

export default AnalisisIATactica;
