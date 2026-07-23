import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/stat-card";
import RendimientoStore, { CitaFisioterapia } from "@/lib/rendimiento-store";
import { AtencionClinicaModal } from "@/components/AtencionClinicaModal";
import {
  Calendar, Clock, UserCheck, Plus, CheckCircle2, XCircle, ArrowLeft, Stethoscope, ActivitySquare, Search, FileText, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/medico/citas")({
  component: MedicoCitasPage,
});

function MedicoCitasPage() {
  const [citasList, setCitasList] = useState(() => RendimientoStore.getCitasFisioterapia());
  const [openCreate, setOpenCreate] = useState(false);
  const [search, setSearch] = useState("");

  const [selectedCitaForAtencion, setSelectedCitaForAtencion] = useState<CitaFisioterapia | null>(null);
  const [isOpenAtencionModal, setIsOpenAtencionModal] = useState(false);

  const jugadores = useMemo(() => RendimientoStore.getJugadores(), []);

  // Form state
  const [jugadorId, setJugadorId] = useState("j1");
  const [fisioterapeutaNombre, setFisioterapeutaNombre] = useState("Licda. Mariela Castro");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [hora, setHora] = useState("15:00");
  const [motivo, setMotivo] = useState("Descarga miofascial e hidroterapia");
  const [tratamientoAplicado, setTratamientoAplicado] = useState("Electroterapia + Crioterapia");
  const [nivelDolorEva, setNivelDolorEva] = useState(3);

  const handleCreateCita = (e: React.FormEvent) => {
    e.preventDefault();
    const selJugador = jugadores.find((j) => j.id === jugadorId);

    RendimientoStore.addCitaFisioterapia({
      jugadorId,
      jugadorNombre: selJugador?.nombre || "Atleta",
      fisioterapeutaNombre,
      fecha,
      hora,
      motivo,
      tratamientoAplicado,
      nivelDolorEva: Number(nivelDolorEva),
      estado: "programada",
    });

    setCitasList(RendimientoStore.getCitasFisioterapia());
    setOpenCreate(false);
    toast.success("Cita de fisioterapia agendada con éxito.");
  };

  const toggleEstadoCita = (id: string, current: string) => {
    const next = current === "programada" ? "completada" : "programada";
    RendimientoStore.updateCitaFisioterapia(id, { estado: next as any });
    setCitasList(RendimientoStore.getCitasFisioterapia());
    toast.success(`Estado de la cita actualizado a ${next}.`);
  };

  const filteredCitas = useMemo(() => {
    return citasList.filter((c) => {
      const jObj = jugadores.find(j => j.id === c.jugadorId || j.nombre === c.jugadorNombre);
      const cat = jObj?.categoria || "";
      return (
        c.jugadorNombre.toLowerCase().includes(search.toLowerCase()) ||
        c.fisioterapeutaNombre.toLowerCase().includes(search.toLowerCase()) ||
        c.motivo.toLowerCase().includes(search.toLowerCase()) ||
        cat.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [citasList, jugadores, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-slate-500 font-bold">
          <Link to="/medico">
            <ArrowLeft className="h-4 w-4" /> Volver al Área Médica
          </Link>
        </Button>
      </div>

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-wider border border-indigo-500/30">
            PORTAL DEL FISIOTERAPEUTA & TRATAMIENTOS
          </Badge>
          <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white">
            <Calendar className="h-6 w-6 text-indigo-400" /> Agenda de Citas & Sesiones de Fisioterapia
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Programación de turnos médicos, consulta directa de expedientes clínicos y seguimiento de escala de dolor EVA.
          </p>
        </div>

        <Button onClick={() => setOpenCreate(!openCreate)} className="bg-gradient-primary shadow-elegant font-bold rounded-2xl text-xs h-9 gap-1.5">
          <Plus className="h-4 w-4" /> Agendar Nueva Cita
        </Button>
      </div>

      {/* FORMULARIO AGENDAR CITA */}
      {openCreate && (
        <Card className="shadow-card border border-indigo-200 dark:border-indigo-900 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ActivitySquare className="h-5 w-5 text-indigo-600" /> Agendar Cita de Fisioterapia
          </CardTitle>
          <form onSubmit={handleCreateCita} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deportista</label>
                <select
                  value={jugadorId}
                  onChange={(e) => setJugadorId(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                >
                  {jugadores.map((j) => (
                    <option key={j.id} value={j.id}>{j.nombre} ({j.categoria})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fisioterapeuta / Especialista</label>
                <Input
                  value={fisioterapeutaNombre}
                  onChange={(e) => setFisioterapeutaNombre(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fecha</label>
                  <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-9 text-xs rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hora</label>
                  <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="h-9 text-xs rounded-xl" />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Motivo de Consulta</label>
                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="h-9 text-xs rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tratamiento Planificado</label>
                <Input value={tratamientoAplicado} onChange={(e) => setTratamientoAplicado(e.target.value)} className="h-9 text-xs rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nivel de Dolor Escala EVA (1 - 10)</label>
                <Input type="number" min="1" max="10" value={nivelDolorEva} onChange={(e) => setNivelDolorEva(Number(e.target.value))} className="h-9 text-xs rounded-xl" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)} className="h-8 text-xs font-bold rounded-xl">Cancelar</Button>
              <Button type="submit" className="h-8 text-xs bg-indigo-600 text-white font-bold rounded-xl shadow-xs">Guardar Turno</Button>
            </div>
          </form>
        </Card>
      )}

      {/* AGENDA DE CITAS TABLE */}
      <Card className="shadow-card border border-slate-200/80 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Listado de Citas Programadas ({filteredCitas.length})
            </CardTitle>
            <CardDescription className="text-xs">Agenda de fisioterapia deportiva y acceso directo al expediente clínico.</CardDescription>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por jugador, categoría o especialista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5">Deportista</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5">Fisioterapeuta</th>
                <th className="p-3.5">Fecha y Hora</th>
                <th className="p-3.5">Motivo & Tratamiento</th>
                <th className="p-3.5 text-center">Nivel Dolor (EVA)</th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCitas.map((c) => {
                const jObj = jugadores.find((j) => j.id === c.jugadorId || (c.jugadorNombre && (j.nombre.toLowerCase().includes(c.jugadorNombre.toLowerCase()) || c.jugadorNombre.toLowerCase().includes(j.nombre.toLowerCase()))));
                const targetId = jObj?.id || c.jugadorId || "j1";
                const displayName = (c.jugadorNombre && c.jugadorNombre !== "Deportista U13") ? c.jugadorNombre : (jObj?.nombre || "Santiago Jiménez Valverde");
                const catName = jObj?.categoria || (displayName.includes("Mateo") ? "U15 Liga" : "U13 Asoderive");
                const avatarUrl = jObj?.avatar || "";

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-indigo-100 dark:border-indigo-950">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback className="bg-indigo-600 text-white font-bold">{displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            to="/medico/jugador/$id"
                            params={{ id: targetId }}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1 text-xs"
                          >
                            {displayName} <ExternalLink className="h-3 w-3 text-slate-400" />
                          </Link>
                          <p className="text-[10px] text-slate-400">ID: {jObj?.identificacion || "DOC-20004"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border-indigo-200 text-[10px]">
                        {catName}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-indigo-600 font-semibold">{c.fisioterapeutaNombre}</td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{c.fecha} - {c.hora}</td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800 dark:text-slate-200">{c.motivo}</p>
                      <p className="text-[10px] text-slate-400">{c.tratamientoAplicado}</p>
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge className={`font-mono text-[10px] ${c.nivelDolorEva > 4 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                        EVA {c.nivelDolorEva}/10
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge className={`font-bold text-[10px] uppercase border-none px-2.5 py-0.5 rounded-full ${
                        c.estado === "completada" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                      }`}>
                        {c.estado}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.estado === "completada" ? (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setSelectedCitaForAtencion(c);
                              setIsOpenAtencionModal(true);
                            }}
                            className="h-7 text-[10px] font-bold rounded-lg border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Ver / Editar Ficha
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            onClick={() => {
                              setSelectedCitaForAtencion(c);
                              setIsOpenAtencionModal(true);
                            }}
                            className="h-7 text-[10px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white gap-1 shadow-xs"
                          >
                            <Stethoscope className="h-3.5 w-3.5" /> Atender
                          </Button>
                        )}
                        <Button asChild size="xs" variant="outline" className="h-7 text-[10px] font-bold rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1">
                          <Link to="/medico/jugador/$id" params={{ id: targetId }}>
                            <FileText className="h-3.5 w-3.5" /> Expediente
                          </Link>
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

      {/* MODAL CLÍNICO DEL FISIOTERAPEUTA */}
      <AtencionClinicaModal
        open={isOpenAtencionModal}
        onOpenChange={setIsOpenAtencionModal}
        cita={selectedCitaForAtencion}
        onComplete={() => setCitasList(RendimientoStore.getCitasFisioterapia())}
      />
    </div>
  );
}
