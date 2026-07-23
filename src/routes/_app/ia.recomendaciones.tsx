import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AIStore, AIRecommendation } from "@/lib/ai-store";
import { Sparkles, ArrowRight, Dumbbell, Heart, DollarSign, Users2, Shield, Play, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ia/recomendaciones")({ component: RecomendacionesIA });

const iconos = { 
  lesion: Heart, 
  fatiga: Dumbbell, 
  wellness: Heart, 
  morosidad: DollarSign, 
  asistencia: Users2, 
  rendimiento: Sparkles 
} as const;

const priorityColors = {
  critica: "bg-red-500/10 text-red-500 border-red-500/20",
  alta: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  media: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  baja: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
};

const confidenceColors = {
  Alta: "text-emerald-400 bg-emerald-500/10",
  Media: "text-amber-400 bg-amber-500/10",
  Baja: "text-red-400 bg-red-500/10"
};

function RecomendacionesIA() {
  const [recs, setRecs] = useState<AIRecommendation[]>(AIStore.getRecommendations());

  const handleExecute = (id: string, text: string) => {
    AIStore.executeRecommendationAction(id);
    setRecs(AIStore.getRecommendations());
    toast.success(`Acción ejecutada: ${text}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" /> Recomendaciones IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Acciones preventivas generadas dinámicamente con sus variables e indicador de confianza.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {recs.map((r) => {
          const Icon = iconos[r.tipo] || Sparkles;
          return (
            <Card key={r.id} className={`border ${r.completada ? "opacity-60 bg-muted/20" : "bg-card"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                    <Icon className="h-4.5 w-4.5 text-primary shrink-0" />
                    {r.jugador}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Badge variant="outline" className={`text-[9px] font-bold ${priorityColors[r.prioridad]}`}>
                      {r.prioridad.toUpperCase()}
                    </Badge>
                    <Badge className={`text-[9px] font-bold ${confidenceColors[r.confianza]}`}>
                      Confianza: {r.confianza}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs text-white/80 font-medium pt-1">
                  {r.texto}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Explanation and variables */}
                <div className="text-[11px] bg-white/5 border border-white/5 p-3 rounded-xl space-y-1.5">
                  <p className="text-muted-foreground"><span className="font-bold text-white">Explicación:</span> {r.explicacion}</p>
                  <div className="flex flex-wrap gap-1 items-center pt-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Variables utilizadas:</span>
                    {r.variables.map((v, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] font-medium bg-white/5 border border-white/10 text-white/90">
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Execution bar */}
                <div className="flex items-center justify-between pt-1">
                  <Button
                    size="sm"
                    disabled={r.completada}
                    onClick={() => handleExecute(r.id, r.accionText)}
                    className={`text-xs gap-1 ${
                      r.completada 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-primary hover:opacity-90 text-white font-bold"
                    }`}
                  >
                    {r.completada ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Completada
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-white" /> {r.accionText}
                      </>
                    )}
                  </Button>

                  <Link
                    to="/jugadores/$id"
                    params={{ id: r.jugadorId }}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Ver expediente <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
export default RecomendacionesIA;
