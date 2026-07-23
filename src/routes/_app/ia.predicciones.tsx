import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AIStore, AIPrediction } from "@/lib/ai-store";
import { TrendingUp, ArrowRight, Clock, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_app/ia/predicciones")({ component: PrediccionesIA });

const tipoColors: Record<string, string> = {
  lesion: "text-red-500 bg-red-500/10 border-red-500/20",
  abandono: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  mora: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  asistencia: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  rendimiento: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
};

const confidenceColors = {
  Alta: "text-emerald-400 bg-emerald-500/10",
  Media: "text-amber-400 bg-amber-500/10",
  Baja: "text-red-400 bg-red-500/10"
};

function PrediccionesIA() {
  const predictions = AIStore.getPredictions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary animate-pulse" /> Motor de Predicciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Probabilidad y análisis probabilístico de eventos a corto y mediano plazo.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {predictions.map((p) => (
          <Card key={p.id} className="bg-card shadow-card border border-white/5 overflow-hidden hover:border-white/10 transition">
            <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
              {/* Left Column: Avatar & Name */}
              <div className="flex items-center gap-3 shrink-0">
                <img src={p.avatar} alt="" className="h-12 w-12 rounded-full border border-white/10" />
                <div>
                  <h4 className="font-bold text-sm text-white">{p.jugador}</h4>
                  <div className="flex gap-1.5 mt-1">
                    <Badge className={`text-[9px] uppercase font-bold tracking-wider ${tipoColors[p.tipo]}`}>
                      {p.tipo}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] font-medium border-white/10 text-muted-foreground">
                      H: {p.horizonte}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Middle Column: Details, variables, explanation */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-white">Análisis Predictivo:</span> {p.explicacion}
                </div>
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-muted-foreground mr-1">Variables correlacionadas:</span>
                  {p.variables.map((v, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] bg-white/5 text-white/95 border-white/10">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Right Column: Probabilities & Confidence indicators */}
              <div className="flex md:flex-col items-end gap-3 justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Probabilidad</p>
                  <p className="text-3xl font-black text-white">{p.probabilidad}%</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={`text-[9px] font-bold ${confidenceColors[p.nivelConfianza]}`}>
                    Confianza: {p.nivelConfianza}
                  </Badge>
                  <div>
                    <Link to="/jugadores/$id" params={{ id: p.jugadorId }} className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
                      Ver ficha <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
            {/* Progress bar along the bottom of the card */}
            <Progress value={p.probabilidad} className="h-1.5 rounded-none bg-white/5" />
          </Card>
        ))}
      </div>

      {/* Warning Disclaimer */}
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 flex gap-3 text-xs text-amber-300 leading-relaxed max-w-2xl">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="font-bold text-white mb-0.5">Nota Importante de Confianza Predictiva</p>
          Athletix AI nunca presenta una recomendación o predicción como una verdad absoluta. Cada cálculo se basa en tendencias matemáticas, wellness diario e históricos de entrenamiento. Por favor, complemente este análisis con evaluaciones clínicas y la experiencia de su cuerpo técnico.
        </div>
      </div>
    </div>
  );
}
export default PrediccionesIA;
