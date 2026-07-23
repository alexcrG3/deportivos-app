import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LearningStore, { ActiveStepState } from "@/lib/learning-store";
import { Rocket, CheckCircle2, ArrowLeft, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function ActiveStepFloatingWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState<ActiveStepState | null>(null);

  const refreshState = () => {
    setActiveStep(LearningStore.getActiveStep());
  };

  useEffect(() => {
    refreshState();
    const handleUpdate = () => refreshState();
    window.addEventListener("athletix_learning_updated", handleUpdate);
    return () => window.removeEventListener("athletix_learning_updated", handleUpdate);
  }, []);

  // Hide if no active step or if user is currently on the roadmap page itself
  if (!activeStep || location.pathname === "/ruta-aprendizaje") {
    return null;
  }

  const handleCompleteActiveStep = () => {
    const isCompleted = LearningStore.toggleLessonCompleted(activeStep.lessonId);
    LearningStore.clearActiveStep();
    if (isCompleted) {
      toast.success(`🎉 ¡Lección completada! +${activeStep.xp} XP ganados.`);
    }
    navigate({ to: "/ruta-aprendizaje" });
  };

  const handleDismiss = () => {
    LearningStore.clearActiveStep();
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm w-full bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-xl border border-blue-500/40 text-white rounded-3xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center justify-between">
        <Badge className="bg-gradient-primary text-white text-[9px] font-black uppercase px-2.5 py-0.5 shadow-sm flex items-center gap-1">
          <Rocket className="h-3 w-3 text-amber-400 animate-pulse" /> Lección en Curso
        </Badge>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          title="Cerrar guía flotante"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1">
        <h4 className="font-extrabold text-sm text-white flex items-center justify-between">
          <span className="truncate">{activeStep.title}</span>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] ml-2 shrink-0">
            +{activeStep.xp} XP
          </Badge>
        </h4>
        <p className="text-[11px] text-slate-300 line-clamp-2">
          {activeStep.subtitle}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleCompleteActiveStep}
          className="flex-1 bg-gradient-primary text-white text-xs font-extrabold gap-1 shadow-elegant rounded-xl h-9"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Completar (+{activeStep.xp} XP)</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate({ to: "/ruta-aprendizaje" })}
          className="bg-slate-900 border-white/10 text-white hover:bg-slate-800 text-xs font-bold gap-1 rounded-xl h-9 px-3"
          title="Volver a la vista completa de la ruta"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ruta</span>
        </Button>
      </div>
    </div>
  );
}
