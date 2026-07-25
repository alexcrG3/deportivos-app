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
      <div className="bg-white border border-[#E2E8F0] p-6 rounded-[12px] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-indigo-500/10 text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-500/30 rounded-full px-[10px] py-[4px]">
            AUDITORÍA DE PERSONAL TÉCNICO
          </Badge>
          <h1 className="text-[28px] font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#0F172A]" /> Asistencia y Puntualidad de Entrenadores
          </h1>
          <p className="text-sm text-[#64748B] max-w-xl">
            Control independiente de asistencia, llegadas tardías y reemplazos del staff deportivo.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-[12px] border border-[#E2E8F0]">
          <CalendarCheck className="h-4 w-4 text-[#64748B] ml-2" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-8 px-2 bg-transparent text-xs font-bold text-[#0F172A] outline-none"
          />
        </div>
      </div>

      {/* METRIC STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Puntualidad Staff</span>
            <CalendarCheck className="h-4 w-4 text-[#64748B]" />
          </div>
          <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">{stats.rate}%</p>
          <span className="text-[12px] font-normal text-[#475569]">Cumplimiento de horario</span>
        </Card>
        <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Entrenadores Presentes</span>
            <UserCheck className="h-4 w-4 text-[#64748B]" />
          </div>
          <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">{stats.presentes}</p>
          <span className="text-[12px] font-normal text-[#475569]">En campo de juego</span>
        </Card>
        <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Llegadas Tardías</span>
            <Clock className="h-4 w-4 text-[#64748B]" />
          </div>
          <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">{stats.tardias}</p>
          <span className="text-[12px] font-normal text-[#475569]">Registradas hoy</span>
        </Card>
        <Card className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Ausencias Notificadas</span>
            <UserX className="h-4 w-4 text-[#64748B]" />
          </div>
          <p className="text-[28px] font-bold text-[#0F172A] my-1 font-mono tracking-tight">{stats.ausentes}</p>
          <span className="text-[12px] font-normal text-[#475569]">Requieren sustitución</span>
        </Card>
      </div>

      {/* STAFF ATTENDANCE TABLE */}
      <Card className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden shadow-sm p-6 space-y-4">
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
              <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Entrenador</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Especialidad</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase text-[#64748B] tracking-wider">Horario Programado</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase text-[#64748B] tracking-wider text-center">Estado de Asistencia</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase text-[#64748B] tracking-wider text-right">Acción Rápida</th>
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
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-[10px] py-[4px] text-[12px] font-medium ${
                        status === "presente"
                          ? "bg-emerald-500/10 text-emerald-700"
                          : status === "tardia"
                          ? "bg-amber-500/10 text-amber-700"
                          : "bg-red-500/10 text-red-700"
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
                          variant="outline"
                          onClick={() => toggleStatus(c.id, "presente")}
                          className="border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm"
                        >
                          Presente
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => toggleStatus(c.id, "tardia")}
                          className="border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm"
                        >
                          Tardía
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => toggleStatus(c.id, "ausente")}
                          className="border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 rounded-[8px] px-4 py-2 text-sm"
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
