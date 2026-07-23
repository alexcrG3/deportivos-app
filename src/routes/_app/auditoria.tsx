import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auditoria } from "@/lib/mock-data";
import { ScrollText, Search, Download } from "lucide-react";

export const Route = createFileRoute("/_app/auditoria")({ component: AuditoriaPage });

const rolStyle: Record<string, string> = {
  Admin: "bg-destructive/15 text-destructive",
  Finanzas: "bg-success/15 text-success",
  Profesor: "bg-primary/15 text-primary",
  Workflow: "bg-warning/20 text-warning",
};

function AuditoriaPage() {
  const [q, setQ] = useState("");
  const filtered = auditoria.filter((a) =>
    [a.usuario, a.accion, a.modulo, a.detalle].some((s) => s.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auditoría global</h1>
          <p className="text-sm text-muted-foreground">Registro inmutable de cambios, pagos, cierres, workflows y mensajes.</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4" /> Exportar</Button>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2"><ScrollText className="h-5 w-5 text-primary" /> Activity log</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar usuario, módulo, acción..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
          </div>
          <CardDescription>{filtered.length} eventos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{a.fecha}</TableCell>
                    <TableCell className="text-sm font-medium">{a.usuario}</TableCell>
                    <TableCell><Badge variant="secondary" className={rolStyle[a.rol] || "bg-muted text-muted-foreground"}>{a.rol}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{a.modulo}</Badge></TableCell>
                    <TableCell className="text-sm">{a.accion}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.detalle}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
