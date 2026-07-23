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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 no-print">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-elegant">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Análisis Táctico IA</h1>
            <p className="text-xs text-muted-foreground">Recomendaciones del modelo LLM orquestado con Sports Science</p>
          </div>
        </div>
        <div className="flex gap-2">
          {report && (
            <Button size="sm" variant="outline" className="text-xs border-border text-foreground gap-1.5" onClick={() => { window.print(); toast.info("Generando PDF..."); }}>
              <Printer className="h-3.5 w-3.5" /> Exportar Reporte
            </Button>
          )}
          <Button
            size="sm"
            className="text-xs bg-gradient-to-r from-violet-600 to-indigo-700 text-white font-bold gap-1.5 shadow-elegant"
            onClick={handleGenerateReport}
          >
            <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" /> Analizar Partido con IA
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left Column: AI Chat Assistant & Report */}
        <div className="lg:col-span-2 space-y-4">
          {/* Detailed IA Report Card */}
          {report && (
            <Card className="bg-card border-violet-500/20 bg-gradient-to-br from-card to-violet-500/5 print-report-card print:border-none print:shadow-none">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm text-foreground flex items-center gap-1.5 font-bold">
                  <Brain className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" /> Informe Táctico e Insights de IA
                </CardTitle>
                <CardDescription className="text-xs">Generado automáticamente analizando el plantel y el rival</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* 2 column lists */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Fortalezas</p>
                    {report.fortalezas.map((f, i) => <p key={i} className="text-foreground pl-2 border-l border-emerald-500/30 font-medium">{f}</p>)}
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-red-700 dark:text-red-400 flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> Debilidades</p>
                    {report.debilidades.map((d, i) => <p key={i} className="text-foreground pl-2 border-l border-red-500/30 font-medium">{d}</p>)}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-3">
                  <div className="space-y-1.5">
                    <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Errores Críticos Detectados</p>
                    {report.errores.map((e, i) => <p key={i} className="text-foreground pl-2 border-l border-amber-500/30 font-medium">{e}</p>)}
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Aspectos Positivos / Por Mejorar</p>
                    {report.positivos.map((p, i) => <p key={i} className="text-foreground pl-2 border-l border-blue-500/30 font-medium">{p}</p>)}
                    {report.mejorar.map((p, i) => <p key={i} className="text-foreground pl-2 border-l border-indigo-500/30 font-medium">🔧 {p}</p>)}
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-2 bg-muted/30 p-3 rounded-xl border border-border">
                  <p className="font-bold text-foreground flex items-center gap-1"><Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Plan de Acción Recomendado</p>
                  <div className="space-y-1">
                    {report.recomendaciones.map((r, i) => (
                      <p key={i} className="text-foreground pl-2 border-l border-amber-500/40 font-medium">💡 {r}</p>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  <p className="font-bold text-foreground flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-primary" /> Siguientes Pasos de Entrenamiento</p>
                  <div className="space-y-1">
                    {report.pasos.map((s, i) => (
                      <p key={i} className="text-foreground pl-2 border-l border-primary/40 font-medium">• {s}</p>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-2 flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>Generado por: DeportivOS AI Core</span>
                  <span>Confianza del Modelo: <strong className="text-emerald-600 dark:text-emerald-400">{report.confianza}</strong></span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card shadow-card flex flex-col h-[480px] border-border no-print">
            <CardHeader className="pb-3 border-b border-border shrink-0">
              <CardTitle className="text-sm flex items-center gap-2 text-foreground font-bold">
                <Terminal className="h-4.5 w-4.5 text-primary" />
                Copiloto Táctico Interactivo
              </CardTitle>
              <CardDescription className="text-xs">Consulta automatizada y simulación de escenarios de juego</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 max-w-[85%] ${
                    m.sender === "user" ? "ml-auto flex-row-reverse" : ""
                  }`}
                >
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                    m.sender === "user" ? "bg-primary text-white" : "bg-violet-600 text-white"
                  }`}>
                    {m.sender === "user" ? "U" : "🤖"}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed border font-medium ${
                    m.sender === "user"
                      ? "bg-primary/10 border-primary/20 text-foreground rounded-tr-none"
                      : "bg-muted/40 border-border text-foreground rounded-tl-none"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 items-center text-xs text-muted-foreground">
                  <div className="h-7 w-7 rounded-full bg-violet-600 text-white flex items-center justify-center animate-pulse">🤖</div>
                  <span className="animate-pulse">Procesando tácticas y analizando rival...</span>
                </div>
              )}
            </CardContent>
            {/* Input row */}
            <div className="p-3 border-t border-border flex gap-2 shrink-0 bg-muted/20">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Pregunta a la IA táctica (ej. ¿Qué formación me recomiendas?)..."
                className="flex-1 bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              />
              <Button size="icon" onClick={handleSend} className="bg-primary text-white h-9 w-9 shrink-0 hover:bg-primary/95">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Preloaded analysis */}
        <div className="space-y-4 no-print">

          {/* Plantel Status Card */}
          <Card className="bg-card shadow-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Disponibilidad Táctica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                <div className="border border-emerald-500/25 bg-emerald-500/10 p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400">
                  <p>🟢 Aptos</p>
                  <p className="text-sm font-black mt-0.5">{summary.jugadoresDisponibles}</p>
                </div>
                <div className="border border-amber-500/25 bg-amber-500/10 p-1.5 rounded-lg text-amber-700 dark:text-amber-400">
                  <p>🟡 Alerta</p>
                  <p className="text-sm font-black mt-0.5">{summary.jugadoresPrecaucion}</p>
                </div>
                <div className="border border-red-500/25 bg-red-500/10 p-1.5 rounded-lg text-red-700 dark:text-red-400">
                  <p>🔴 Riesgo</p>
                  <p className="text-sm font-black mt-0.5">{summary.jugadoresNoRecomendados}</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px] font-medium">
                {summary.jugadoresNoRecomendados > 0
                  ? `⚠️ Atención: ${summary.jugadoresNoRecomendados} jugadores clave presentan fatiga. Evita cargarlos físicamente en el esquema táctico.`
                  : "✅ Todo el plantel se encuentra en condiciones óptimas para el partido."}
              </p>
            </CardContent>
          </Card>

          {/* AI Insights & Recs */}
          <Card className="bg-card shadow-card border-violet-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Alertas y Sugerencias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {recs.map(r => (
                <div key={r.id} className="p-2.5 rounded-xl border border-violet-500/10 bg-violet-500/5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-foreground">{r.jugador}</p>
                    <Badge variant="outline" className={`text-[8px] font-bold ${
                      r.prioridad === "critica" ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    }`}>{r.prioridad}</Badge>
                  </div>
                  <p className="text-muted-foreground text-[10px] leading-relaxed font-medium">{r.texto}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Opponent analysis summary */}
          {nextRival && (
            <Card className="bg-card shadow-card border-orange-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                  <Swords className="h-4 w-4 text-orange-500" />
                  Rival: Inteligencia IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{nextRival.escudo}</span>
                  <div>
                    <p className="font-bold text-foreground text-sm">{nextRival.nombre}</p>
                    <p className="text-muted-foreground text-[10px] font-medium">DT: {nextRival.entrenador}</p>
                  </div>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 italic bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 mt-1 font-medium">
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
