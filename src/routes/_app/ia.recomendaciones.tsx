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
  critica: "bg-red-500/10 text-red-700",
  alta: "bg-orange-500/10 text-orange-700",
  media: "bg-amber-500/10 text-amber-700",
  baja: "bg-emerald-500/10 text-emerald-700"
};

const confidenceColors = {
  Alta: "bg-emerald-500/10 text-emerald-700",
  Media: "bg-amber-500/10 text-amber-700",
  Baja: "bg-red-500/10 text-red-700"
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
            <Card key={r.id} className={`border border-[#E2E8F0] rounded-[12px] shadow-sm ${r.completada ? "opacity-60 bg-slate-50" : "bg-white"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#0F172A]">
                    <Icon className="h-4.5 w-4.5 text-primary shrink-0" />
                    {r.jugador}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Badge variant="outline" className={`text-[12px] font-medium rounded-full px-[10px] py-[4px] ${priorityColors[r.prioridad]}`}>
                      {r.prioridad.toUpperCase()}
                    </Badge>
                    <Badge className={`text-[12px] font-medium rounded-full px-[10px] py-[4px] ${confidenceColors[r.confianza]}`}>
                      Confianza: {r.confianza}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs text-[#64748B] font-medium pt-1">
                  {r.texto}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Explanation and variables */}
                <div className="text-[11px] bg-slate-50 border border-[#E2E8F0] p-3 rounded-[12px] space-y-1.5">
                  <p className="text-[#475569]"><span className="font-bold text-[#0F172A]">Explicación:</span> {r.explicacion}</p>
                  <div className="flex flex-wrap gap-1 items-center pt-1">
                    <span className="text-[10px] text-[#475569] mr-1">Variables utilizadas:</span>
                    {r.variables.map((v, i) => (
                      <Badge key={i} variant="secondary" className="text-[12px] font-medium bg-white border border-[#E2E8F0] text-[#475569] rounded-full px-[10px] py-[4px]">
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
                        ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                        : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[8px] px-4 py-2 text-sm font-medium"
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
