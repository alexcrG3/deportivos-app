import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AIStore, AIPrediction } from "@/lib/ai-store";
import { TrendingUp, ArrowRight, Clock, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/_app/ia/predicciones")({ component: PrediccionesIA });

const tipoColors: Record<string, string> = {
  lesion: "bg-red-500/10 text-red-700",
  abandono: "bg-orange-500/10 text-orange-700",
  mora: "bg-amber-500/10 text-amber-700",
  asistencia: "bg-blue-500/10 text-blue-700",
  rendimiento: "bg-emerald-500/10 text-emerald-700"
};

const confidenceColors = {
  Alta: "bg-emerald-500/10 text-emerald-700",
  Media: "bg-amber-500/10 text-amber-700",
  Baja: "bg-red-500/10 text-red-700"
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
          <Card key={p.id} className="bg-white border border-[#E2E8F0] rounded-[12px] shadow-sm overflow-hidden hover:border-[#CBD5E1] transition">
            <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center gap-5">
              {/* Left Column: Avatar & Name */}
              <div className="flex items-center gap-3 shrink-0">
                <img src={p.avatar} alt="" className="h-12 w-12 rounded-full border border-white/10" />
                <div>
                  <h4 className="font-bold text-[28px] text-[#0F172A] my-1 font-mono tracking-tight">{p.jugador}</h4>
                  <div className="flex gap-1.5 mt-1">
                    <Badge className={`text-[12px] rounded-full px-[10px] py-[4px] uppercase font-medium tracking-wider ${tipoColors[p.tipo]}`}>
                      {p.tipo}
                    </Badge>
                    <Badge variant="outline" className="text-[12px] rounded-full px-[10px] py-[4px] font-medium border-[#E2E8F0] text-[#475569]">
                      H: {p.horizonte}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Middle Column: Details, variables, explanation */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-[#0F172A]">Análisis Predictivo:</span> {p.explicacion}
                </div>
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-muted-foreground mr-1">Variables correlacionadas:</span>
                  {p.variables.map((v, i) => (
                    <Badge key={i} variant="outline" className="text-[12px] bg-slate-100 text-[#475569] border-[#E2E8F0] rounded-full px-[10px] py-[4px] font-medium">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Right Column: Probabilities & Confidence indicators */}
              <div className="flex md:flex-col items-end gap-3 justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Probabilidad</p>
                  <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">{p.probabilidad}%</p>
                </div>
                <div className="text-right space-y-1">
                  <Badge className={`text-[12px] font-medium rounded-full px-[10px] py-[4px] ${confidenceColors[p.nivelConfianza]}`}>
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
            <Progress value={p.probabilidad} className="h-1.5 rounded-none bg-slate-100" />
          </Card>
        ))}
      </div>

      {/* Warning Disclaimer */}
      <div className="border border-[#E2E8F0] bg-white rounded-[12px] p-6 shadow-sm flex gap-3 text-xs text-[#475569] leading-relaxed max-w-2xl">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="font-bold text-[#0F172A] mb-0.5">Nota Importante de Confianza Predictiva</p>
          DeportivOS AI nunca presenta una recomendación o predicción como una verdad absoluta. Cada cálculo se basa en tendencias matemáticas, wellness diario e históricos de entrenamiento. Por favor, complemente este análisis con evaluaciones clínicas y la experiencia de su cuerpo técnico.
        </div>
      </div>
    </div>
  );
}
export default PrediccionesIA;
