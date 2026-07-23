import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Brain, Sparkles, Send, X, ArrowRight, Bot, User, Lock, 
  AlertCircle, Calendar, Volume2, Mic, MicOff, Download, Check, AlertTriangle 
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import { AIStore, AIMessage, AIConversation, AIRole, AIAgentName } from "@/lib/ai-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

export function FloatAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { role } = useRole();
  const [activeConv, setActiveConv] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch active conversation
  useEffect(() => {
    if (isOpen) {
      const convs = AIStore.getConversations();
      let active = convs.find(c => c.active && c.userRole === role);
      if (!active) {
        active = AIStore.createConversation(role, "Nueva Consulta Copilot");
      }
      setActiveConv(active);
      setMessages(AIStore.getMessages(active.id));
    }
  }, [isOpen, role]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        setInputMsg("¿Quién tiene mayor riesgo de lesión?");
        toast.success("Voz captada: '¿Quién tiene mayor riesgo de lesión?'");
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
    const file = new Blob([`ATHLETIX OS REPORT\n\nDocument: ${title}\nGenerated on: ${new Date().toLocaleString()}\nConfidence: High\n\nThis is a simulated PDF document generated by Athletix AI.`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Archivo descargado: ${filename}`);
  };

  const currentSuggestions = role === "admin" 
    ? ["¿Quién tiene mayor riesgo de lesión?", "Muéstrame los morosos", "Genera el informe mensual del Sub-15"]
    : role === "coach"
    ? ["¿Cómo está el equipo Sub-17?", "¿Quién tiene mayor riesgo de lesión?", "Genera el informe mensual del Sub-15"]
    : ["¿Cómo está el rendimiento de Sofía?", "¿Y qué recomiendas?"];

  return (
    <>
      {/* Permanent floating button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-purple-600 to-amber-500 text-white shadow-[0_8px_30px_rgb(139,92,246,0.3)] hover:shadow-[0_8px_30px_rgb(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
        title="Abrir Athletix AI Copiloto"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6 animate-pulse" />}
      </button>

      {/* Slide Sidebar */}
      <div
        className={`fixed top-0 right-0 z-[80] h-full w-full max-w-[420px] bg-[#0c0d16]/95 border-l border-white/10 backdrop-blur-xl shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-gradient-to-r from-violet-950/20 to-amber-950/10">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-amber-500 text-white shadow-md">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Athletix AI <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30">Copilot</span>
              </h2>
              <p className="text-[10px] text-muted-foreground">Tu asistente deportivo inteligente</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat message area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-3">
              <Bot className="h-10 w-10 text-violet-500/80 animate-bounce" />
              <h3 className="text-sm font-semibold text-white">¡Hola! Soy tu Copiloto Deportivo</h3>
              <p className="text-xs text-muted-foreground max-width-[280px]">
                Conozco el estado de toda la academia: atletas, wellness, lesiones, competiciones y más.
              </p>
              <div className="w-full pt-4 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide text-left">Preguntas sugeridas:</p>
                {currentSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="w-full text-left text-xs bg-white/5 border border-white/5 p-2 rounded-xl hover:bg-white/10 hover:border-white/10 text-white/95 transition flex items-center justify-between"
                  >
                    <span>{s}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs font-semibold ${
                  m.sender === "user" ? "bg-amber-500 text-black" : "bg-violet-900/60 border border-violet-500/20 text-white"
                }`}>
                  {m.sender === "user" ? <User className="h-4 w-4" /> : <span>{agentAvatars[m.agentName || "Coach AI"]}</span>}
                </div>
                <div className="space-y-1">
                  {m.agentName && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        {roleIcons[m.roleAssumed || "Administrador"]} {m.agentName}
                      </span>
                      {m.sender === "ai" && (
                        <button
                          onClick={() => handleSpeak(m.text, m.id)}
                          className={`text-muted-foreground hover:text-white p-0.5 transition ${
                            isSpeakingId === m.id ? "text-amber-400" : ""
                          }`}
                        >
                          <Volume2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                  <div className={`rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-amber-500 text-black font-medium rounded-tr-none"
                      : "bg-white/5 border border-white/5 text-white/90 rounded-tl-none"
                  }`}>
                    {m.sender === "user" ? m.text : renderMessageText(m.text)}

                    {/* RENDER CRITICAL ACTION BUTTONS */}
                    {m.pendingApproval && (
                      <div className="mt-3 border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-300 font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" /> Aprobación Requerida
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">{m.pendingApproval.detail}</p>
                        <div className="flex gap-2 pt-1">
                          <Button 
                            size="sm" 
                            className="bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold h-7 py-1 px-3.5"
                            onClick={() => handleConfirmAction(m.pendingApproval!.actionId)}
                          >
                            Sí, enviar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-[10px] font-bold h-7 py-1 px-3.5 border-white/10"
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
                          <span className="text-[10px] font-bold text-emerald-400">{m.documentPayload.title}</span>
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
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-[10px] h-7 gap-1 mt-1"
                          onClick={() => handleDownloadPDF(m.documentPayload!.downloadUrl, m.documentPayload!.title)}
                        >
                          <Download className="h-3 w-3" /> Descargar PDF
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

        {/* Input box form */}
        <div className="p-4 border-t border-white/5 bg-[#08090f]">
          {messages.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none">
              {currentSuggestions.slice(0, 2).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="shrink-0 text-[10px] bg-white/5 border border-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-full text-white/80 transition"
                >
                  {s}
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
              className={`p-2 rounded-xl border transition ${
                isRecording 
                  ? "bg-red-500/20 border-red-500/30 text-red-500 animate-pulse"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
              }`}
              title="Comando por voz"
            >
              {isRecording ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
            </button>

            <Input
              placeholder={isRecording ? "Escuchando voz..." : "Pregunta al copiloto..."}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder-white/40 rounded-xl pr-10 focus-visible:ring-violet-500"
              disabled={isRecording}
            />
            <Button
              type="submit"
              disabled={!inputMsg.trim() || isRecording}
              size="icon"
              className="absolute right-1.5 h-7 w-7 rounded-lg bg-gradient-to-r from-violet-600 to-amber-500 hover:opacity-90 transition text-white"
            >
              <Send className="h-3 w-3" />
            </Button>
          </form>

          {/* Equalizer animation when recording */}
          {isRecording && (
            <div className="flex justify-center items-center gap-1 pt-3 animate-pulse">
              <span className="h-3 w-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="h-5 w-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="h-4 w-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              <span className="h-6 w-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              <span className="h-3 w-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            </div>
          )}

          <div className="flex items-center justify-between mt-2.5 text-[9px] text-muted-foreground">
            <span>Seguridad: Activa ({role.toUpperCase()})</span>
            <span className="flex items-center gap-0.5"><Lock className="h-2 w-2" /> Datos Encriptados</span>
          </div>
        </div>
      </div>
    </>
  );
}
export default FloatAIButton;
