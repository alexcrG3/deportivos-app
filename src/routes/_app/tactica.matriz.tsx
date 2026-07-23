import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlayerAvailability, availabilityConfig } from "@/lib/tactical-store";
import RendimientoStore from "@/lib/rendimiento-store";
import { jugadores } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, ShieldAlert, Award, Star, HeartPulse, Filter } from "lucide-react";

export const Route = createFileRoute("/_app/tactica/matriz")({ component: MatrizDisponibilidad });

function MatrizDisponibilidad() {
  const loads = RendimientoStore.getPlayerLoadData();
  const [filter, setFilter] = useState<"todos" | "disponibles" | "precaucion" | "riesgo">("todos");

  const filteredPlayers = jugadores.filter(j => {
    const status = getPlayerAvailability(j.id);
    if (filter === "disponibles") return status === "disponible";
    if (filter === "precaucion") return status === "precaucion";
    if (filter === "riesgo") return status === "no-recomendado";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-elegant">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Matriz de Disponibilidad</h1>
            <p className="text-xs text-muted-foreground">Estado físico y evaluación médica consolidada</p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3">
        <Filter className="h-4 w-4 text-muted-foreground mr-1" />
        <button
          onClick={() => setFilter("todos")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
            filter === "todos" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent"
          }`}
        >
          Todos ({jugadores.length})
        </button>
        <button
          onClick={() => setFilter("disponibles")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border ${
            filter === "disponibles" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground hover:bg-muted/85 hover:text-foreground border border-transparent"
          }`}
        >
          Disponibles 🟢
        </button>
        <button
          onClick={() => setFilter("precaucion")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border ${
            filter === "precaucion" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground hover:bg-muted/85 hover:text-foreground border border-transparent"
          }`}
        >
          Precaución 🟡
        </button>
        <button
          onClick={() => setFilter("riesgo")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border ${
            filter === "riesgo" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-muted text-muted-foreground hover:bg-muted/85 hover:text-foreground border border-transparent"
          }`}
        >
          Riesgo Alto 🔴
        </button>
      </div>

      {/* Availability table */}
      <Card className="bg-card shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow>
                <TableHead className="text-xs text-muted-foreground">Jugador</TableHead>
                <TableHead className="text-xs text-muted-foreground">Disciplina / Cat.</TableHead>
                <TableHead className="text-xs text-muted-foreground">Sports Score</TableHead>
                <TableHead className="text-xs text-muted-foreground">ACWR (Cargas)</TableHead>
                <TableHead className="text-xs text-muted-foreground">Wellness</TableHead>
                <TableHead className="text-xs text-muted-foreground">Estado Físico</TableHead>
                <TableHead className="text-xs text-muted-foreground">Convocable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map(j => {
                const load = loads.find(l => l.jugadorId === j.id);
                const avail = getPlayerAvailability(j.id);
                const cfg = availabilityConfig[avail];

                return (
                  <TableRow key={j.id} className="hover:bg-white/[0.01] border-white/5">
                    <TableCell className="font-semibold text-white flex items-center gap-2">
                      <img src={j.avatar} alt="" className="h-7 w-7 rounded-full border border-white/10" />
                      <div>
                        <p className="font-bold">{j.nombre}</p>
                        <p className="text-[10px] text-muted-foreground">{j.identificacion}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {j.disciplina} <p className="text-[10px] opacity-75">{j.categoria}</p>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-white text-xs">
                      {load?.recoveryScore ?? 82}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <span className={load?.acwr && load.acwr > 1.3 ? "text-red-400 font-bold" : "text-emerald-400"}>
                        {load?.acwr ?? "1.05"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {load?.wellnessScore ?? 85}%
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className={`text-[10px] font-bold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className={avail === "no-recomendado" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}>
                        {avail === "no-recomendado" ? "No" : "Sí"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredPlayers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                    No se encontraron jugadores con el filtro seleccionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default MatrizDisponibilidad;
