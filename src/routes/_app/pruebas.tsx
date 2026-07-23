import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calendar, MapPin, User, ClipboardCheck } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { crmPruebas } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pruebas")({ component: PruebasPage });

function PruebasPage() {
  const [pruebas, setPruebas] = useState(crmPruebas);
  const programadas = pruebas.filter((p) => p.estado === "programada").length;
  const completadas = pruebas.filter((p) => p.estado === "completada").length;
  const aptos = pruebas.filter((p) => p.resultado === "Apto").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pruebas Deportivas</h1>
          <p className="text-sm text-muted-foreground">Pruebas individuales, grupales, visorías y captaciones</p>
        </div>
        <NewPruebaDialog onCreate={(p) => setPruebas((prev) => [p, ...prev])} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Calendar} label="Programadas" value={programadas.toString()} />
        <StatCard icon={ClipboardCheck} label="Completadas" value={completadas.toString()} />
        <StatCard icon={User} label="Aptos" value={aptos.toString()} hint={`${Math.round((aptos / completadas) * 100) || 0}% del total`} />
        <StatCard icon={MapPin} label="Total" value={pruebas.length.toString()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximas pruebas y resultados</CardTitle>
          <CardDescription>Agenda completa de evaluaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atleta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Fecha / Hora</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Entrenador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pruebas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.jugador}</TableCell>
                  <TableCell><Badge variant="outline">{p.tipo}</Badge></TableCell>
                  <TableCell>{p.disciplina}</TableCell>
                  <TableCell>{p.fecha} · {p.hora}</TableCell>
                  <TableCell>{p.sede}</TableCell>
                  <TableCell>{p.entrenador}</TableCell>
                  <TableCell>
                    <Badge variant={p.estado === "completada" ? "default" : p.estado === "cancelada" ? "destructive" : "secondary"}>{p.estado}</Badge>
                  </TableCell>
                  <TableCell>{p.resultado ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function NewPruebaDialog({ onCreate }: { onCreate: (p: any) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ jugador: "", tipo: "Individual", disciplina: "Fútbol", sede: "Sede Central", entrenador: "Coach Ramírez", fecha: "", hora: "15:00" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Programar prueba</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva prueba deportiva</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nombre del atleta" value={form.jugador} onChange={(e) => setForm({ ...form, jugador: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Individual", "Grupal", "Visoría", "Campamento", "Captación"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.disciplina} onValueChange={(v) => setForm({ ...form, disciplina: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Fútbol", "Baloncesto", "Natación", "Voleibol"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
          </div>
          <Button className="w-full" onClick={() => {
            if (!form.jugador || !form.fecha) return toast.error("Completa nombre y fecha");
            onCreate({ id: `pr${Date.now()}`, leadId: "l1", ...form, categoria: "Sub-14", estado: "programada", resultado: null });
            setOpen(false);
            toast.success("Prueba programada");
          }}>Programar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
