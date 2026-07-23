import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIStore, AIInsight } from "@/lib/ai-store";
import { 
  Lightbulb, TrendingUp, TrendingDown, Award, ShieldAlert, 
  Sparkles, Clock, ArrowUpRight, BarChart3, Users, Zap 
} from "lucide-react";

export const Route = createFileRoute("/_app/ia/insights")({ component: InsightsIA });

const categoryColors: Record<string, string> = {
  Cargas: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  Rendimiento: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  Asistencia: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  Operación: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  Wellness: "text-rose-500 bg-rose-500/10 border-rose-500/20"
};

function InsightsIA() {
  const insights = AIStore.getInsights();

  // Find featured insights
  const insightDelDia = insights.find(i => i.destacado === "riesgo") || insights[0];
  const jugadorDestacado = insights.find(i => i.destacado === "jugador");
  const equipoDestacado = insights.find(i => i.destacado === "equipo");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary animate-pulse" /> Centro de Insights
          </h1>
          <p className="text-sm text-muted-foreground">
            Patrones y anomalías detectados automáticamente por el motor analítico de Athletix AI.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-primary/20 text-primary">
          <Zap className="h-3.5 w-3.5" /> Análisis continuo
        </Badge>
      </div>

      {/* Featured Grid Section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Insight del Día */}
        <Card className="shadow-card border-violet-500/20 bg-gradient-to-br from-violet-950/10 to-card relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Alerta Crítica</span>
              <ShieldAlert className="h-4 w-4 text-violet-400" />
            </div>
            <CardTitle className="text-base font-bold mt-1 text-white">{insightDelDia.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">{insightDelDia.detalle}</p>
            <div className="pt-2 flex items-center justify-between">
              <Badge className={categoryColors[insightDelDia.categoria]}>{insightDelDia.categoria}</Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Hoy 08:00
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Jugador Destacado */}
        {jugadorDestacado && (
          <Card className="shadow-card border-emerald-500/20 bg-gradient-to-br from-emerald-950/10 to-card relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Jugador Destacado</span>
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
              <CardTitle className="text-base font-bold mt-1 text-white">{jugadorDestacado.entidadNombre}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{jugadorDestacado.detalle}</p>
              <div className="pt-2 flex items-center justify-between">
                <Link to="/jugadores" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                  Ver expediente <ArrowUpRight className="h-3 w-3" />
                </Link>
                <Badge className={categoryColors[jugadorDestacado.categoria]}>{jugadorDestacado.categoria}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Equipo Destacado */}
        {equipoDestacado && (
          <Card className="shadow-card border-amber-500/20 bg-gradient-to-br from-amber-950/10 to-card relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Alerta de Carga</span>
                <BarChart3 className="h-4 w-4 text-amber-400" />
              </div>
              <CardTitle className="text-base font-bold mt-1 text-white">Categoría {equipoDestacado.entidadNombre}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{equipoDestacado.detalle}</p>
              <div className="pt-2 flex items-center justify-between">
                <Link to="/equipos" search={{ teamId: undefined }} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                  Ver microciclo <ArrowUpRight className="h-3 w-3" />
                </Link>
                <Badge className={categoryColors[equipoDestacado.categoria]}>{equipoDestacado.categoria}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Full insights list */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Historial de Patrones Detectados</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((i) => {
            const Icon = i.impacto === "positivo" ? TrendingUp : TrendingDown;
            const borderCol = i.impacto === "positivo" ? "border-l-emerald-500" : "border-l-red-500";
            return (
              <Card key={i.id} className={`border-l-4 ${borderCol} shadow-card bg-card`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                      <Icon className={`h-4 w-4 shrink-0 ${i.impacto === "positivo" ? "text-emerald-500" : "text-red-500"}`} />
                      {i.titulo}
                    </CardTitle>
                    <Badge variant="outline" className={`text-[10px] ${categoryColors[i.categoria] || ''}`}>
                      {i.categoria}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{i.detalle}</p>
                  <p className="text-[9px] text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Detectado el {new Date(i.fecha).toLocaleDateString("es-CR")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default InsightsIA;
