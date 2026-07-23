import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRole } from "@/hooks/use-role";
import { AIStore, AIMessage, AIConversation, AIRole, AIAgentName } from "@/lib/ai-store";
import { 
  Sparkles, Send, Bot, User, MessageSquare, Plus, FileText, 
  AlertTriangle, Play, HelpCircle, Lock, Calendar, ArrowRight, ShieldCheck,
  Volume2, Mic, MicOff, Download, Check
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ia/asistente")({ component: AsistenteIA });

const roleIcons: Record<AIRole, string> = {
  "Director Deportivo": "📋",
  "Entrenador": "⚽",
  "Preparador Físico": "⚡",
  "Analista Deportivo": "📊",
  "Médico Deportivo": "🩺",
  "Analista Financiero": "💰",
  "Administrador": "⚙️",
  "Asistente de Competencias": "🏆"
};

const agentAvatars: Record<AIAgentName, string> = {
  "Coach AI": "⚽",
  "Performance AI": "⚡",
  "Medical AI": "🩺",
  "Finance AI": "💰",
  "CRM AI": "🎯",
  "Competition AI": "🏆",
  "Parent AI": "👨‍👩‍👧‍👦",
  "Player AI": "🏃"
};

// Helper to render markdown links [Pedro](/jugadores/j1) as TanStack Router Links
function renderMessageText(text: string) {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const linkText = match[1];
    const linkUrl = match[2];

    if (linkUrl.startsWith("/jugadores/")) {
      const partsOfUrl = linkUrl.split("/");
      const id = partsOfUrl[partsOfUrl.length - 1];
      parts.push(
        <Link
          key={match.index}
          to="/jugadores/$id"
          params={{ id }}
          className="text-primary font-semibold hover:underline underline-offset-2"
        >
          {linkText}
        </Link>
      );
    } else {
      parts.push(
        <Link
          key={match.index}
          to={linkUrl as any}
          className="text-primary font-semibold hover:underline underline-offset-2"
        >
          {linkText}
        </Link>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function AsistenteIA() {
  const { role } = useRole();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConv, setActiveConv] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [reportType, setReportType] = useState<"diario" | "semanal" | "mensual" | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and load conversations
  const loadConversations = () => {
    const list = AIStore.getConversations();
    setConversations(list);
    let active = list.find(c => c.active && c.userRole === role);
    if (!active && list.length > 0) {
      active = list[0];
    }
    if (active) {
      setActiveConv(active);
      setMessages(AIStore.getMessages(active.id));
    }
  };

  useEffect(() => {
    loadConversations();
  }, [role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConv = (id: string) => {
    AIStore.setActiveConversation(id);
    const list = AIStore.getConversations();
    setConversations(list);
    const active = list.find(c => c.id === id);
    if (active) {
      setActiveConv(active);
      setMessages(AIStore.getMessages(active.id));
    }
  };

  const handleNewChat = () => {
    const title = `Consulta DeportivOS AI ${new Date().toLocaleDateString("es-ES")}`;
    const newConv = AIStore.createConversation(role, title);
    loadConversations();
    setActiveConv(newConv);
    setMessages([]);
  };

  const handleSend = (text: string) => {
    if (!text.trim() || !activeConv) return;

    const userMsg = AIStore.addMessage({
      conversationId: activeConv.id,
      sender: "user",
      text: text.trim()
    });

    setMessages(prev => [...prev, userMsg]);
    setInputMsg("");

    setTimeout(() => {
      const aiReply = AIStore.processUserQuery(activeConv.id, text.trim(), role);
      setMessages(prev => [...prev, aiReply]);
    }, 600);
  };

  const handleReportAction = (type: "diario" | "semanal" | "mensual") => {
    setReportType(type);
    handleSend(`Generar informe ${type}`);
  };

  // Critical Action Confirmation trigger
  const handleConfirmAction = (actionId: string) => {
    if (!activeConv) return;
    const reply = AIStore.confirmAction(actionId, activeConv.id);
    setMessages(prev => [...prev, reply]);
  };

  // Simulated Voice Command
  const handleToggleVoice = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      toast.info("Grabando... Di tu consulta en voz alta");
      setTimeout(() => {
        setIsRecording(false);
        setInputMsg("Muéstrame los jugadores con riesgo alto");
        toast.success("Voz captada: 'Muéstrame los jugadores con riesgo alto'");
      }, 3000);
    }
  };

  // TTS Read Aloud API
  const handleSpeak = (text: string, msgId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Síntesis de voz no disponible en este navegador");
      return;
    }

    if (isSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "es-ES";
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);
    
    setIsSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Simulated PDF Downloader
  const handleDownloadPDF = (filename: string, title: string) => {
    const element = document.createElement("a");
    const file = new Blob([`DEPORTIVOS REPORT\n\nDocument: ${title}\nGenerated on: ${new Date().toLocaleString()}\nConfidence: High\n\nThis is a simulated PDF document generated by DeportivOS AI.`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Archivo descargado: ${filename}`);
  };

  const currentSuggestions = role === "admin"
    ? [
        { label: "Riesgos de lesión", query: "¿Quién tiene mayor riesgo de lesión?" },
        { label: "Ver morosos", query: "Muéstrame los morosos" },
        { label: "Generar informe Sub-15", query: "Genera el informe mensual del Sub-15" }
      ]
    : role === "coach"
    ? [
        { label: "Ver Sub-17", query: "¿Cómo está el equipo Sub-17?" },
        { label: "Riesgos de lesión", query: "¿Quién tiene mayor riesgo de lesión?" },
        { label: "Generar informe Sub-15", query: "Genera el informe mensual del Sub-15" }
      ]
    : [
        { label: "Rendimiento de Sofía", query: "¿Cómo está el rendimiento de Sofía?" },
        { label: "Recomendación médica", query: "¿Y qué recomiendas?" }
      ];

  const quickActions = [
    { label: "Analizar Equipo", query: "¿Cómo está el equipo Sub-17?" },
    { label: "Ver Riesgos", query: "¿Quién tiene mayor riesgo de lesión?" },
    { label: "Resumen Diario", type: "diario" },
    { label: "Resumen Semanal", type: "semanal" },
    { label: "Resumen Mensual", type: "mensual" }
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 overflow-hidden">
      {/* LEFT SIDEBAR: History list */}
      <div className="w-[280px] shrink-0 border rounded-2xl bg-card flex flex-col overflow-hidden shadow-card">
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-primary" /> Historial de Chats
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={handleNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.filter(c => c.userRole === role).map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectConv(c.id)}
              className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center gap-2.5 transition border ${
                c.active
                  ? "bg-primary/10 border-primary/20 text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">{c.title}</span>
            </button>
          ))}
          {conversations.filter(c => c.userRole === role).length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">Sin consultas anteriores.</div>
          )}
        </div>
        <div className="p-3 border-t bg-muted/20 text-[10px] text-muted-foreground flex items-center gap-1.5 justify-center">
          <Lock className="h-3 w-3" /> Datos seguros y auditados
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden border rounded-2xl bg-[#090b11] shadow-card">
        
        {/* Welcome / Quick reports header */}
        <div className="p-4 border-b bg-gradient-to-r from-violet-950/20 to-amber-950/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" /> Asistente DeportivOS AI
            </h2>
            <p className="text-xs text-muted-foreground">
              Buenos días, Carlos. Consultas, comandos y automatizaciones en tiempo real.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs gap-1"
              onClick={() => handleReportAction("diario")}
            >
              <FileText className="h-3.5 w-3.5 text-amber-500" /> Resumen Diario
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs gap-1"
              onClick={() => handleReportAction("semanal")}
            >
              <FileText className="h-3.5 w-3.5 text-blue-500" /> Resumen Semanal
            </Button>
          </div>
        </div>

        {/* Message scroll panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-white shadow-elegant">
                <Bot className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-white">¿En qué puedo ayudarte hoy?</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Asumo automáticamente diferentes roles y agentes especializados (Coach AI, Medical AI, Finance AI, etc.) para asistirte mediante lenguaje natural.
              </p>

              {/* Quick Actions Grid */}
              <div className="w-full grid grid-cols-2 gap-2 pt-2">
                {quickActions.slice(0, 4).map((a) => (
                  <Button
                    key={a.label}
                    variant="outline"
                    className="justify-start text-left text-xs p-3 h-auto rounded-xl hover:bg-muted/50"
                    onClick={() => {
                      if (a.query) handleSend(a.query);
                      if (a.type) handleReportAction(a.type as any);
                    }}
                  >
                    <Play className="h-3 w-3 mr-2 text-primary fill-primary" />
                    <span>{a.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div className={`flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold ${
                  m.sender === "user" ? "bg-amber-500 text-black animate-elegant-pulse" : "bg-violet-900/60 border border-violet-500/20 text-white"
                }`}>
                  {m.sender === "user" ? <User className="h-4.5 w-4.5" /> : <span>{agentAvatars[m.agentName || "Coach AI"]}</span>}
                </div>
                <div className="space-y-1">
                  {m.agentName && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        {roleIcons[m.roleAssumed || "Administrador"]} {m.agentName}
                      </span>
                      {m.sender === "ai" && (
                        <button
                          onClick={() => handleSpeak(m.text, m.id)}
                          className={`text-muted-foreground hover:text-white p-0.5 transition ${
                            isSpeakingId === m.id ? "text-amber-400" : ""
                          }`}
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                  <div className={`rounded-2xl p-4 text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                    m.sender === "user"
                      ? "bg-amber-500 text-black font-semibold rounded-tr-none"
                      : "bg-white/5 border border-white/5 text-white/95 rounded-tl-none"
                  }`}>
                    {m.sender === "user" ? m.text : renderMessageText(m.text)}

                    {/* Render action cards if any */}
                    {m.actions && m.actions.map(act => (
                      <div key={act.id} className="mt-3 border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3 flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-emerald-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-emerald-300">Acción Registrada</p>
                          <p className="text-[10px] text-muted-foreground truncate">{act.detail}</p>
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Programado</Badge>
                      </div>
                    ))}

                    {/* RENDER CRITICAL ACTION BUTTONS */}
                    {m.pendingApproval && (
                      <div className="mt-3 border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
                          <AlertTriangle className="h-4 w-4" /> Aprobación Requerida
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{m.pendingApproval.detail}</p>
                        <div className="flex gap-2 pt-1">
                          <Button 
                            size="sm" 
                            className="bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold h-8 py-1.5 px-4"
                            onClick={() => handleConfirmAction(m.pendingApproval!.actionId)}
                          >
                            Sí, enviar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-[10px] font-bold h-8 py-1.5 px-4 border-white/10"
                            onClick={() => handleSend("Cancelar")}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* RENDER MOCK DOCUMENTS PAYLOAD */}
                    {m.documentPayload && (
                      <div className="mt-3 border border-emerald-500/25 bg-emerald-500/5 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                          <span className="text-[11px] font-bold text-emerald-400">{m.documentPayload.title}</span>
                          <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5 font-bold uppercase">PDF Listo</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground space-y-1">
                          {Object.entries(m.documentPayload.data).map(([k, v]) => (
                            <div key={k} className="flex justify-between border-b border-white/[0.02] pb-0.5 last:border-b-0">
                              <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                              <span className="font-bold text-white/90">{v as any}</span>
                            </div>
                          ))}
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-[10px] h-8 gap-1.5 mt-1"
                          onClick={() => handleDownloadPDF(m.documentPayload!.downloadUrl, m.documentPayload!.title)}
                        >
                          <Download className="h-3.5 w-3.5" /> Descargar PDF
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 border-t bg-[#07090d]">
          {messages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3">
              {currentSuggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSend(s.query)}
                  className="shrink-0 text-xs bg-white/5 border border-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full text-white/80 transition"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(inputMsg); }}
            className="flex gap-2 relative items-center"
          >
            {/* Microphone button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2.5 rounded-xl border transition shrink-0 ${
                isRecording 
                  ? "bg-red-500/20 border-red-500/30 text-red-500 animate-pulse"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
              }`}
              title="Comando por voz"
            >
              {isRecording ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
            </button>

            <Input
              placeholder={isRecording ? "Escuchando voz..." : "Pregunta a la IA sobre finanzas, cargas, CRM..."}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder-white/30 rounded-xl pr-10 focus-visible:ring-violet-500 font-medium"
              disabled={isRecording}
            />
            <Button
              type="submit"
              disabled={!inputMsg.trim() || isRecording}
              size="icon"
              className="absolute right-1.5 h-8 w-8 rounded-lg bg-gradient-to-r from-violet-600 to-amber-500 hover:opacity-90 transition text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Equalizer animation when recording */}
          {isRecording && (
            <div className="flex justify-center items-center gap-1 pt-3 animate-pulse">
              <span className="h-3.5 w-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="h-5 w-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="h-4 w-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              <span className="h-6 w-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              <span className="h-3.5 w-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            </div>
          )}

          <div className="flex items-center justify-between mt-2.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-400" /> Permisos: {role === "admin" ? "Administrador Completo" : role === "coach" ? "Entrenador Restringido (Sin Finanzas)" : "Padre Autorizado (Auto-Consulta)"}</span>
            <span>Seguridad SSL activa</span>
          </div>
        </div>

      </div>
    </div>
  );
}
export default AsistenteIA;
