import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { playerLoads, playerAvailability } from "@/lib/mock-data";
import { HeartPulse, TrendingUp, Activity } from "lucide-react";

export const Route = createFileRoute("/_app/carga")({ component: CargaPage });

function Bar({ v, color }: { v: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${v * 10}%` }} />
    </div>
  );
}

function CargaPage() {
  const promedio = playerLoads.length > 0 ? Math.round(playerLoads.reduce((a, p) => a + p.intensidad, 0) / playerLoads.length * 10) : 0;
  const fatigaAlta = playerLoads.filter((p) => p.fatiga >= 7).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Control de carga</h1>
        <p className="text-sm text-muted-foreground">Monitoreo diario de intensidad, esfuerzo, fatiga y recuperación.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Activity className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Carga promedio</p><p className="text-2xl font-semibold">{promedio}%</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><HeartPulse className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Fatiga alta</p><p className="text-2xl font-semibold">{fatigaAlta}</p></div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/15 text-warning"><TrendingUp className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Con molestias</p><p className="text-2xl font-semibold">{playerLoads.filter((p) => p.molestias).length}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Cargas individuales (hoy)</CardTitle>
          <CardDescription>Escalas 1-10 · La IA usa estos datos para generar alertas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-2 text-left">Jugador</th>
                  <th className="p-2 text-left">Intensidad</th>
                  <th className="p-2 text-left">Esfuerzo</th>
                  <th className="p-2 text-left">Fatiga</th>
                  <th className="p-2 text-left">Recuperación</th>
                  <th className="p-2 text-left">Molestias</th>
                  <th className="p-2 text-right">Disponibilidad</th>
                </tr>
              </thead>
              <tbody>
                {playerLoads.map((p) => {
                  const disp = playerAvailability.find((a) => a.jugadorId === p.jugadorId);
                  return (
                    <tr key={p.jugadorId} className="border-b hover:bg-muted/40">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7"><AvatarImage src={p.avatar} /><AvatarFallback>{p.jugador[0]}</AvatarFallback></Avatar>
                          <span className="truncate">{p.jugador}</span>
                        </div>
                      </td>
                      <td className="p-2 w-32"><Bar v={p.intensidad} color="bg-primary" /></td>
                      <td className="p-2 w-32"><Bar v={p.esfuerzo} color="bg-blue-500" /></td>
                      <td className="p-2 w-32"><Bar v={p.fatiga} color="bg-destructive" /></td>
                      <td className="p-2 w-32"><Bar v={p.recuperacion} color="bg-success" /></td>
                      <td className="p-2 text-xs text-muted-foreground">{p.molestias ?? "—"}</td>
                      <td className="p-2 text-right">
                        {disp && (
                          <Badge variant="secondary" className={
                            disp.estado === "disponible" ? "bg-success/15 text-success" :
                            disp.estado === "restriccion" ? "bg-warning/15 text-warning" :
                            "bg-destructive/15 text-destructive"
                          }>
                            {disp.estado === "disponible" ? "🟢 OK" : disp.estado === "restriccion" ? "🟡 Restr." : disp.estado === "lesionado" ? "🔴 Lesión" : "⚪ Ausente"}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
