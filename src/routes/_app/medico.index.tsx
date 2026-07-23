import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/stat-card";
import RendimientoStore from "@/lib/rendimiento-store";
import {
  Stethoscope, HeartPulse, ShieldCheck, Activity, Search, Calendar, FileText,
  UserCheck, AlertTriangle, XCircle, ArrowRight, Plus, Sparkles, UserPlus
} from "lucide-react";

export const Route = createFileRoute("/_app/medico/")({
  component: MedicoIndexPage,
});

function MedicoIndexPage() {
  const [q, setQ] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");

  const jugadores = useMemo(() => RendimientoStore.getJugadores(), []);
  const citas = useMemo(() => RendimientoStore.getCitasFisioterapia(), []);

  // Map medical history per player
  const jugadoresConEstado = useMemo(() => {
    return jugadores.map((j) => {
      const hist = RendimientoStore.getHistorialMedico(j.id);
      return {
        ...j,
        estadoMedico: hist.estadoMedico || "alta",
        diagnosticoActual: hist.diagnosticoActual || "Apto",
        medico: hist.medicoAsignado || "Dr. Solano",
        fisioterapeuta: hist.fisioterapeutaAsignado || "Licda. Castro",
      };
    });
  }, [jugadores]);

  const filtered = useMemo(() => {
    return jugadoresConEstado.filter((j) => {
      const matchSearch =
        j.nombre.toLowerCase().includes(q.toLowerCase()) ||
        j.identificacion.toLowerCase().includes(q.toLowerCase()) ||
        j.categoria.toLowerCase().includes(q.toLowerCase());

      if (!matchSearch) return false;

      if (filterEstado === "todos") return true;
      return j.estadoMedico === filterEstado;
    });
  }, [jugadoresConEstado, q, filterEstado]);

  const stats = useMemo(() => {
    const total = jugadoresConEstado.length || 1;
    const alta = jugadoresConEstado.filter((j) => j.estadoMedico === "alta").length;
    const rehab = jugadoresConEstado.filter((j) => j.estadoMedico === "rehabilitacion").length;
    const precaucion = jugadoresConEstado.filter((j) => j.estadoMedico === "precaucion").length;
    const baja = jugadoresConEstado.filter((j) => j.estadoMedico === "baja").length;

    return { total, alta, rehab, precaucion, baja };
  }, [jugadoresConEstado]);

  return (
    <div className="space-y-6">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-wider border border-indigo-500/30">
            DEPARTAMENTO MÉDICO & REHABILITACIÓN
          </Badge>
          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white">
            <Stethoscope className="h-6 w-6 text-indigo-400" /> Sistema Médico & Fisioterapia Deportiva
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Expedientes clínicos, valoraciones antropométricas, agenda de fisioterapia e historial de altas deportivas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="bg-gradient-primary shadow-elegant font-bold rounded-2xl text-xs h-9">
            <Link to="/medico/citas">
              <Calendar className="h-4 w-4 mr-1.5" /> Agenda de Fisioterapia ({citas.length})
            </Link>
          </Button>
        </div>
      </div>

      {/* METRIC KPIS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Atletas de Alta" value={stats.alta.toString()} hint="100% Aptos para juego" icon={ShieldCheck} accent="success" />
        <StatCard label="En Fisioterapia / Rehab" value={stats.rehab.toString()} hint="En proceso de recuperación" icon={Activity} accent="warning" />
        <StatCard label="Precaución Física" value={stats.precaucion.toString()} hint="Carga controlada" icon={AlertTriangle} accent="warning" />
        <StatCard label="Baja Médica" value={stats.baja.toString()} hint="Inhabilitados temporalmente" icon={XCircle} accent="destructive" />
      </div>

      {/* ATHLETE MEDICAL DIRECTORY TABLE */}
      <Card className="shadow-card border border-slate-200/80 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Directorio Clínico de Jugadores ({filtered.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Accede al expediente clínico y ficha antropométrica individual de cada atleta.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por atleta, ID o categoría..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {["todos", "alta", "rehabilitacion", "baja"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterEstado(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition ${
                    filterEstado === st
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5">Deportista</th>
                <th className="p-3.5">ID Documento</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5 text-center">Estado Médico</th>
                <th className="p-3.5">Diagnóstico / Observación</th>
                <th className="p-3.5 text-right">Expediente Clínico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No se encontraron expedientes médicos para esta búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-indigo-200 dark:border-indigo-900">
                          <AvatarImage src={j.avatar} />
                          <AvatarFallback className="bg-indigo-600 text-white font-bold">{j.nombre[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{j.nombre}</p>
                          <p className="text-[10px] text-slate-400">Edad: {j.edad} años · Sede: {j.sede || "Central"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                      {j.identificacion || "DOC-20004"}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border-indigo-200 text-[10px]">
                        {j.categoria}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge
                        className={`font-black border-none px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${
                          j.estadoMedico === "alta"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : j.estadoMedico === "rehabilitacion"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                            : j.estadoMedico === "precaucion"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                        }`}
                      >
                        {j.estadoMedico}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate font-medium">
                      {j.diagnosticoActual}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button asChild size="xs" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] gap-1 shadow-xs">
                        <Link to="/medico/jugador/$id" params={{ id: j.id }}>
                          Abrir Expediente <FileText className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
