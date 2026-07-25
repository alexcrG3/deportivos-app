import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { competiciones, standings } from "@/lib/mock-data";
import { Trophy, Medal } from "lucide-react";

export const Route = createFileRoute("/_app/posiciones")({ component: PosicionesPage });

function PosicionesPage() {
  const compsConTabla = competiciones.filter((c) => standings.some((s) => s.competicionId === c.id));
  const [selId, setSelId] = useState(compsConTabla[0]?.id ?? competiciones[0].id);
  const sel = competiciones.find((c) => c.id === selId)!;
  const tabla = standings.filter((s) => s.competicionId === sel.id).sort((a, b) => b.pts - a.pts);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header-title">Tablas de Posiciones</h1>
        <p className="page-header-subtitle">Standings automáticos de todas las competiciones.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {compsConTabla.map((c) => (
          <button key={c.id} onClick={() => setSelId(c.id)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selId === c.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted/40"}`}>
            {c.nombre}
          </button>
        ))}
      </div>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" />{sel.nombre}</CardTitle>
          <CardDescription>{sel.tipo} · {sel.categoria} · Jornada {sel.jornadaActual} de {sel.jornadas}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell">Pos</th>
                  <th className="table-header-cell text-left">Equipo</th>
                  <th className="table-header-cell text-center">PJ</th>
                  <th className="table-header-cell text-center">PG</th>
                  <th className="table-header-cell text-center">PE</th>
                  <th className="table-header-cell text-center">PP</th>
                  <th className="table-header-cell text-center">GF</th>
                  <th className="table-header-cell text-center">GC</th>
                  <th className="table-header-cell text-center">DG</th>
                  <th className="table-header-cell text-center">PTS</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((s, i) => {
                  const highlight = i === 0 ? "bg-success/5" : i < 3 ? "bg-primary/5" : "";
                  return (
                    <tr key={s.equipo} className={`table-row hover-row ${highlight}`}>
                      <td className="p-2 font-medium">
                        <div className="flex items-center gap-2">
                          {i === 0 && <Medal className="h-3 w-3 text-warning" />}
                          {i + 1}
                        </div>
                      </td>
                      <td className="p-2 font-medium">{s.equipo}</td>
                      <td className="p-2 text-center">{s.pj}</td>
                      <td className="p-2 text-center text-success">{s.pg}</td>
                      <td className="p-2 text-center">{s.pe}</td>
                      <td className="p-2 text-center text-destructive">{s.pp}</td>
                      <td className="p-2 text-center">{s.gf}</td>
                      <td className="p-2 text-center">{s.gc}</td>
                      <td className="p-2 text-center">
                        <Badge variant="outline" className={s.dg > 0 ? "text-success" : s.dg < 0 ? "text-destructive" : ""}>
                          {s.dg > 0 ? `+${s.dg}` : s.dg}
                        </Badge>
                      </td>
                      <td className="p-2 text-center font-bold text-primary">{s.pts}</td>
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
