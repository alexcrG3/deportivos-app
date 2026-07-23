import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRole } from "@/hooks/use-role";
import LearningStore, { ROADMAP_DATA, LessonNode, LearningPhase } from "@/lib/learning-store";
import { 
  Trophy, Sparkles, CheckCircle2, Lock, Play, ArrowRight, Lightbulb, 
  Target, Rocket, Award, ShieldCheck, ChevronRight, RefreshCw, Zap
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ruta-aprendizaje")({
  component: RutaAprendizajePage,
});

function RutaAprendizajePage() {
  const navigate = useNavigate();
  const { role } = useRole();
  const [selectedRole, setSelectedRole] = useState<"admin" | "coach" | "padres">(
    role === "admin" ? "admin" : role === "coach" ? "coach" : "padres"
  );
  
  const [completedList, setCompletedList] = useState<string[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<{ lesson: LessonNode; phase: LearningPhase } | null>(null);

  // Sync state from LearningStore
  const refreshProgress = () => {
    setCompletedList(LearningStore.getCompletedLessons());
  };

  useEffect(() => {
    refreshProgress();
  }, []);

  const currentRoadmap = ROADMAP_DATA[selectedRole];

  // Calculate XP & Stats
  const { currentXP, totalXP, completedCount, totalCount } = useMemo(() => {
    return LearningStore.calculateXP(selectedRole);
  }, [selectedRole, completedList]);

  const percentage = totalXP > 0 ? Math.round((currentXP / totalXP) * 100) : 0;

  const handleToggleComplete = (lessonId: string) => {
    const isNowCompleted = LearningStore.toggleLessonCompleted(lessonId);
    refreshProgress();
    if (isNowCompleted) {
      toast.success("🎉 ¡Lección completada! +XP ganados para tu nivel.");
    } else {
      toast.info("Lección marcada como pendiente.");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 md:p-8 border border-blue-500/30 text-white shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Rocket className="h-64 w-64 text-blue-400" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-primary text-white border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 shadow-elegant">
                  🚀 Ruta de Maestría Athletix OS
                </Badge>
                <span className="text-xs text-slate-300">Aprende haciendo tareas reales</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {currentRoadmap.title}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {currentRoadmap.description}
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="flex items-center bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 shrink-0 self-start md:self-auto">
              <button
                onClick={() => setSelectedRole("admin")}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition ${
                  selectedRole === "admin"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                👑 Administración
              </button>
              <button
                onClick={() => setSelectedRole("coach")}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition ${
                  selectedRole === "coach"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ⚽ Entrenador
              </button>
              <button
                onClick={() => setSelectedRole("padres")}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition ${
                  selectedRole === "padres"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                👨‍👩‍👧‍👦 Padres
              </button>
            </div>
          </div>

          {/* Level Progress Bar Container */}
          <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black">
                  🏆
                </div>
                <div>
                  <span className="font-extrabold text-white text-sm">{currentRoadmap.levelTitle}</span>
                  <span className="text-[11px] text-slate-300 block">
                    {completedCount} de {totalCount} lecciones completadas ({percentage}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold py-1 px-3">
                  ⚡ {currentXP} / {totalXP} XP Ganados
                </Badge>
              </div>
            </div>

            <Progress value={percentage} className="h-2.5 bg-slate-800" />
          </div>
        </div>
      </div>

      {/* ROADMAP VISUAL NODES PATH */}
      <div className="relative max-w-4xl mx-auto space-y-12">
        {/* Central Connecting Vertical Line */}
        <div className="absolute left-6 md:left-8 top-10 bottom-10 w-1 bg-gradient-to-b from-blue-500 via-sky-500 to-emerald-500 opacity-30 rounded-full"></div>

        {currentRoadmap.phases.map((phase) => (
          <div key={phase.phaseId} className="relative space-y-6">
            {/* Phase Header Card */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-gradient-primary text-white font-black text-lg md:text-xl flex items-center justify-center shadow-elegant shrink-0 border-2 border-white/20 z-10">
                F{phase.phaseId}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-extrabold uppercase">
                    {phase.badge}
                  </Badge>
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-foreground mt-0.5 tracking-tight">
                  {phase.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {phase.subtitle}
                </p>
              </div>
            </div>

            {/* Lessons Nodes Grid */}
            <div className="pl-12 md:pl-20 space-y-4">
              {phase.lessons.map((lesson, idx) => {
                const isCompleted = completedList.includes(lesson.id);
                // Previous lesson index check to mark active vs locked
                const allRoleLessons = currentRoadmap.phases.flatMap(p => p.lessons);
                const globalIndex = allRoleLessons.findIndex(l => l.id === lesson.id);
                const isPrevCompleted = globalIndex === 0 || completedList.includes(allRoleLessons[globalIndex - 1].id);
                const isActive = !isCompleted && isPrevCompleted;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => setSelectedLesson({ lesson, phase })}
                    className={`group p-4 md:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 relative shadow-card ${
                      isCompleted
                        ? "bg-card border-emerald-500/40 hover:border-emerald-500"
                        : isActive
                        ? "bg-gradient-to-r from-blue-950/20 via-card to-sky-950/20 border-blue-500/80 shadow-elegant"
                        : "bg-muted/30 border-border/60 hover:border-border opacity-70"
                    }`}
                  >
                    {/* Active Pulsing Indicator Badge */}
                    {isActive && (
                      <div className="absolute -top-2.5 right-6 bg-gradient-primary text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                        <Sparkles className="h-3 w-3" /> LECCIÓN EN CURSO
                      </div>
                    )}

                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Node Circle Icon */}
                      <div className={`h-11 w-11 md:h-12 md:w-12 rounded-2xl flex items-center justify-center text-lg md:text-xl shrink-0 border transition ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm"
                          : isActive
                          ? "bg-blue-600 text-white border-blue-400 shadow-elegant scale-105"
                          : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {isCompleted ? "✓" : lesson.icon}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs md:text-sm text-foreground group-hover:text-primary transition truncate">
                            {lesson.title}
                          </h4>
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px] font-bold">
                            +{lesson.xp} XP
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {lesson.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Button
                        size="sm"
                        className={`text-xs font-bold gap-1 rounded-xl shrink-0 ${
                          isCompleted
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                            : isActive
                            ? "bg-gradient-primary text-white shadow-elegant"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <>Completada <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /></>
                        ) : isActive ? (
                          <>Ver Tarea <ArrowRight className="h-3.5 w-3.5" /></>
                        ) : (
                          <>Bloqueada <Lock className="h-3.5 w-3.5" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* LESSON DETAIL ACTION MODAL */}
      {selectedLesson && (
        <Dialog open={!!selectedLesson} onOpenChange={() => setSelectedLesson(null)}>
          <DialogContent className="max-w-lg p-6 bg-card text-foreground border border-border shadow-2xl rounded-3xl space-y-5">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-extrabold uppercase">
                  {selectedLesson.phase.title}
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-xs font-extrabold">
                  ⚡ +{selectedLesson.lesson.xp} XP
                </Badge>
              </div>
              <DialogTitle className="text-xl font-extrabold text-foreground pt-1 flex items-center gap-2">
                <span>{selectedLesson.lesson.icon}</span>
                <span>{selectedLesson.lesson.title}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {selectedLesson.lesson.subtitle}
              </DialogDescription>
            </DialogHeader>

            {/* Checklist of Real Actions */}
            {selectedLesson.lesson.details && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2.5">
                <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-primary" /> Tareas Reales a Completar en la App:
                </span>
                <ul className="space-y-1.5 text-xs">
                  {selectedLesson.lesson.details.map((d, i) => (
                    <li key={i} className="flex items-center gap-2 text-foreground">
                      <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pro Tip */}
            {selectedLesson.lesson.tip && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-xs block">Consejo Pro Athletix:</span>
                  <p className="leading-relaxed text-[11px]">{selectedLesson.lesson.tip}</p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  handleToggleComplete(selectedLesson.lesson.id);
                  setSelectedLesson(null);
                }}
                className="w-full sm:w-auto text-xs font-bold gap-1 rounded-xl"
              >
                {completedList.includes(selectedLesson.lesson.id) ? (
                  <>Marcar como Pendiente</>
                ) : (
                  <>✅ Marcar como Completado</>
                )}
              </Button>

              <Button
                onClick={() => {
                  LearningStore.setActiveStep({
                    lessonId: selectedLesson.lesson.id,
                    title: selectedLesson.lesson.title,
                    subtitle: selectedLesson.lesson.subtitle,
                    xp: selectedLesson.lesson.xp,
                    actionUrl: selectedLesson.lesson.actionUrl,
                    phaseTitle: selectedLesson.phase.title,
                  });
                  navigate({ to: selectedLesson.lesson.actionUrl as any });
                  setSelectedLesson(null);
                }}
                className="w-full sm:w-auto bg-gradient-primary text-white font-extrabold text-xs gap-1.5 px-6 shadow-elegant rounded-xl"
              >
                <span>{selectedLesson.lesson.actionLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
