import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/stat-card";
import RendimientoStore from "@/lib/rendimiento-store";
import { UserCheck, Clock, UserX, Search, CalendarCheck, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/asistencia-staff")({
  component: AsistenciaStaffPage,
});

function AsistenciaStaffPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState<string>("");
  const coaches = useMemo(() => RendimientoStore.getEntrenadores(), []);

  // Local attendance status state per coach
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "presente" | "tardia" | "ausente">>({
    "t1": "presente",
    "t2": "presente",
    "t3": "tardia",
    "t4": "presente",
  });

  const filteredCoaches = useMemo(() => {
    return coaches.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()) || c.especialidad.toLowerCase().includes(search.toLowerCase()));
  }, [coaches, search]);

  const stats = useMemo(() => {
    const vals = Object.values(attendanceMap);
    const total = coaches.length || 1;
    const presentes = vals.filter(v => v === "presente").length;
    const tardias = vals.filter(v => v === "tardia").length;
    const ausentes = vals.filter(v => v === "ausente").length;
    const rate = Math.round(((presentes + tardias) / total) * 100);

    return { presentes, tardias, ausentes, rate, total };
  }, [attendanceMap, coaches]);

  const toggleStatus = (id: string, status: "presente" | "tardia" | "ausente") => {
    setAttendanceMap(prev => ({ ...prev, [id]: status }));
    toast.success("Registro de asistencia actualizado para el entrenador.");
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-wider backdrop-blur-md border border-indigo-500/30">
            AUDITORÍA DE PERSONAL TÉCNICO
          </Badge>
          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white">
            <ShieldCheck className="h-6 w-6 text-indigo-400" /> Asistencia y Puntualidad de Entrenadores
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Control independiente de asistencia, llegadas tardías y reemplazos del staff deportivo.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
          <CalendarCheck className="h-4 w-4 text-indigo-400 ml-2" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 px-2 bg-transparent text-xs font-bold text-white outline-none"
          />
        </div>
      </div>

      {/* METRIC STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Puntualidad Staff" value={`${stats.rate}%`} hint={`Cumplimiento de horario`} icon={CalendarCheck} accent="primary" />
        <StatCard label="Entrenadores Presentes" value={stats.presentes.toString()} hint={`En campo de juego`} icon={UserCheck} accent="success" />
        <StatCard label="Llegadas Tardías" value={stats.tardias.toString()} hint={`Registradas hoy`} icon={Clock} accent="warning" />
        <StatCard label="Ausencias Notificadas" value={stats.ausentes.toString()} hint={`Requieren sustitución`} icon={UserX} accent="warning" />
      </div>

      {/* STAFF ATTENDANCE TABLE */}
      <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Bitácora de Asistencia de Entrenadores ({selectedDate})
            </CardTitle>
            <CardDescription className="text-xs">
              Puntualidad por profesor y reemplazos de sesión.
            </CardDescription>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar profesor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5">Entrenador</th>
                <th className="p-3.5">Especialidad</th>
                <th className="p-3.5">Horario Programado</th>
                <th className="p-3.5 text-center">Estado de Asistencia</th>
                <th className="p-3.5 text-right">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredCoaches.map((c) => {
                const status = attendanceMap[c.id] || "presente";
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-indigo-100 dark:border-indigo-950">
                          <AvatarImage src={c.avatar} />
                          <AvatarFallback className="bg-indigo-600 text-white font-bold">{c.nombre[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{c.nombre}</p>
                          <p className="text-[10px] text-slate-400">{c.correo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px] font-bold">{c.especialidad}</Badge>
                    </td>
                    <td className="p-3.5 font-medium text-slate-600 dark:text-slate-400">
                      {c.horario || "14:00 - 18:00"}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        status === "presente"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : status === "tardia"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                      }`}>
                        {status === "presente" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {status === "tardia" && <Clock className="h-3.5 w-3.5" />}
                        {status === "ausente" && <XCircle className="h-3.5 w-3.5" />}
                        {status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant={status === "presente" ? "default" : "outline"}
                          onClick={() => toggleStatus(c.id, "presente")}
                          className="h-7 text-[10px] font-bold rounded-lg"
                        >
                          Presente
                        </Button>
                        <Button
                          size="xs"
                          variant={status === "tardia" ? "default" : "outline"}
                          onClick={() => toggleStatus(c.id, "tardia")}
                          className="h-7 text-[10px] font-bold rounded-lg"
                        >
                          Tardía
                        </Button>
                        <Button
                          size="xs"
                          variant={status === "ausente" ? "destructive" : "outline"}
                          onClick={() => toggleStatus(c.id, "ausente")}
                          className="h-7 text-[10px] font-bold rounded-lg"
                        >
                          Ausente
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
