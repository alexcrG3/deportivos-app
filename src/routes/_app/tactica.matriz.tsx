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
      <div className="page-header mb-6 no-print">
        <div className="flex items-center gap-3">
          <div className="icon-box icon-box-primary">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="page-header-title">Matriz de Disponibilidad</h1>
            <p className="page-header-subtitle">Estado físico y evaluación médica consolidada</p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-3">
        <Filter className="h-4 w-4 text-[#64748B] mr-1" />
        <button
          onClick={() => setFilter("todos")}
          className={`px-3.5 py-1.5 rounded-[8px] text-xs font-bold transition-colors ${
            filter === "todos" ? "bg-[#2563EB] text-white" : "bg-white text-[#64748B] hover:bg-slate-50 border border-[#E2E8F0]"
          }`}
        >
          Todos ({jugadores.length})
        </button>
        <button
          onClick={() => setFilter("disponibles")}
          className={`px-3.5 py-1.5 rounded-[8px] text-xs font-bold transition-colors border ${
            filter === "disponibles" ? "bg-emerald-500/10 border-emerald-200 text-emerald-700" : "bg-white text-[#64748B] hover:bg-slate-50 border-[#E2E8F0]"
          }`}
        >
          Disponibles 🟢
        </button>
        <button
          onClick={() => setFilter("precaucion")}
          className={`px-3.5 py-1.5 rounded-[8px] text-xs font-bold transition-colors border ${
            filter === "precaucion" ? "bg-amber-500/10 border-amber-200 text-amber-700" : "bg-white text-[#64748B] hover:bg-slate-50 border-[#E2E8F0]"
          }`}
        >
          Precaución 🟡
        </button>
        <button
          onClick={() => setFilter("riesgo")}
          className={`px-3.5 py-1.5 rounded-[8px] text-xs font-bold transition-colors border ${
            filter === "riesgo" ? "bg-red-500/10 border-red-200 text-red-700" : "bg-white text-[#64748B] hover:bg-slate-50 border-[#E2E8F0]"
          }`}
        >
          Riesgo Alto 🔴
        </button>
      </div>

      {/* Availability table */}
      <Card className="premium-card">
        <CardContent className="p-0 overflow-hidden">
          <div className="table-container border-none shadow-none rounded-none">
            <Table>
              <TableHeader className="table-header-row bg-slate-50">
                <TableRow className="border-none">
                  <TableHead className="table-header-cell">Jugador</TableHead>
                  <TableHead className="table-header-cell">Disciplina / Cat.</TableHead>
                  <TableHead className="table-header-cell">Sports Score</TableHead>
                  <TableHead className="table-header-cell">ACWR (Cargas)</TableHead>
                  <TableHead className="table-header-cell">Wellness</TableHead>
                  <TableHead className="table-header-cell">Estado Físico</TableHead>
                  <TableHead className="table-header-cell">Convocable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map(j => {
                  const load = loads.find(l => l.jugadorId === j.id);
                  const avail = getPlayerAvailability(j.id);
                  const cfg = availabilityConfig[avail];

                  return (
                    <TableRow key={j.id} className="table-row">
                      <TableCell className="table-cell font-semibold text-[#0F172A] flex items-center gap-3">
                        <img src={j.avatar} alt="" className="h-8 w-8 rounded-full border border-[#E2E8F0]" />
                        <div>
                          <p className="font-bold">{j.nombre}</p>
                          <p className="text-[11px] text-[#64748B]">{j.identificacion}</p>
                        </div>
                      </TableCell>
                      <TableCell className="table-cell">
                        <div className="text-sm text-[#0F172A] font-medium">{j.disciplina}</div>
                        <div className="text-[11px] text-[#64748B]">{j.categoria}</div>
                      </TableCell>
                      <TableCell className="table-cell font-mono font-bold text-[#0F172A]">
                        {load?.recoveryScore ?? 82}
                      </TableCell>
                      <TableCell className="table-cell font-mono">
                        <span className={load?.acwr && load.acwr > 1.3 ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                          {load?.acwr ?? "1.05"}
                        </span>
                      </TableCell>
                      <TableCell className="table-cell font-mono text-[#0F172A] font-medium">
                        {load?.wellnessScore ?? 85}%
                      </TableCell>
                      <TableCell className="table-cell">
                        <Badge variant="outline" className={`badge-pill ${avail === 'disponible' ? 'badge-success' : avail === 'precaucion' ? 'badge-warning' : 'badge-danger'}`}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="table-cell">
                        <Badge variant="outline" className={`badge-pill ${avail === "no-recomendado" ? "badge-danger" : "badge-success"}`}>
                          {avail === "no-recomendado" ? "No" : "Sí"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {filteredPlayers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-[#64748B] text-sm">
                      No se encontraron jugadores con el filtro seleccionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MatrizDisponibilidad;
