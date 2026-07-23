import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/stat-card";
import { Check, Clock, X, FileText, CalendarCheck, TrendingUp, Users, Eye, Printer, Download, Filter } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/asistencia")({ component: AsistenciaPage });

const opciones = [
  { value: "P", label: "Presente", icon: Check, cls: "bg-success/15 text-success border-success/30" },
  { value: "T", label: "Tarde", icon: Clock, cls: "bg-warning/20 text-warning-foreground border-warning/30" },
  { value: "A", label: "Ausente", icon: X, cls: "bg-destructive/15 text-destructive border-destructive/30" },
  { value: "J", label: "Justificado", icon: FileText, cls: "bg-muted text-muted-foreground border-border" },
] as const;

function AsistenciaPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const local = new Date();
    const offset = local.getTimezoneOffset();
    const localDate = new Date(local.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Retrieve fresh data
  const teams = useMemo(() => RendimientoStore.getEquipos(), [refreshTrigger]);
  const allPlayers = useMemo(() => RendimientoStore.getJugadores(), [refreshTrigger]);
  const allAttendances = useMemo(() => RendimientoStore.getAsistencias(), [refreshTrigger]);

  // Modal State
  const [selectedTeamForDetail, setSelectedTeamForDetail] = useState<any | null>(null);
  const [modalEstados, setModalEstados] = useState<Record<string, "P" | "T" | "A" | "J">>({});

  // Map of team name to players
  const playersByTeam = useMemo(() => {
    const map: Record<string, any[]> = {};
    teams.forEach(t => {
      map[t.nombre] = allPlayers.filter(p => {
        const pCat = (p.categoria || "").toLowerCase().trim();
        const tCat = (t.categoria || t.nombre || "").toLowerCase().trim();
        return pCat === tCat || tCat.includes(pCat) || pCat.includes(tCat);
      });
    });
    return map;
  }, [teams, allPlayers]);

  // Attendance stats for each team on selectedDate
  const teamAttendanceStats = useMemo(() => {
    return teams.map(t => {
      const record = allAttendances.find(a => {
        if (!a.equipo) return false;
        if (a.fecha !== selectedDate) return false;
        const aEq = a.equipo.toLowerCase().trim();
        const tNom = t.nombre?.toLowerCase().trim() || "";
        const tCat = t.categoria?.toLowerCase().trim() || "";
        return aEq === tNom || aEq === tCat || tNom.includes(aEq) || aEq.includes(tNom);
      });
      const players = playersByTeam[t.nombre] || [];
      const totalPlayers = players.length;

      let status: "registrado" | "sin_registrar" = "sin_registrar";
      let present = 0;
      let late = 0;
      let absent = 0;
      let justified = 0;

      if (record && record.registro) {
        status = "registrado";
        Object.entries(record.registro).forEach(([_, val]) => {
          if (val === "P") present++;
          else if (val === "T") late++;
          else if (val === "A") absent++;
          else if (val === "J") justified++;
        });
      }

      const rate = status === "registrado" && totalPlayers > 0
        ? Math.round((present / totalPlayers) * 100)
        : 0;

      return {
        team: t,
        status,
        totalPlayers,
        present,
        late,
        absent,
        justified,
        rate
      };
    });
  }, [teams, allAttendances, selectedDate, playersByTeam]);

  // Global totals for stats cards
  const globalStats = useMemo(() => {
    let registeredCount = 0;
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;
    let totalPlayersCount = 0;

    teamAttendanceStats.forEach(stat => {
      totalPlayersCount += stat.totalPlayers;
      if (stat.status === "registrado") {
        registeredCount++;
        totalPresent += stat.present;
        totalLate += stat.late;
        totalAbsent += stat.absent;
      }
    });

    const totalReported = totalPresent + totalLate + totalAbsent;
    const globalRate = totalReported > 0
      ? Math.round((totalPresent / totalReported) * 100)
      : 0;

    return {
      registeredTeams: registeredCount,
      totalPresent,
      totalLate,
      totalAbsent,
      globalRate,
      totalPlayersCount
    };
  }, [teamAttendanceStats]);

  // Open modal and pre-fill statuses
  const handleOpenDetail = (teamStat: any) => {
    const record = allAttendances.find(a => {
      if (!a.equipo) return false;
      if (a.fecha !== selectedDate) return false;
      const aEq = a.equipo.toLowerCase().trim();
      const tNom = teamStat.team.nombre?.toLowerCase().trim() || "";
      const tCat = teamStat.team.categoria?.toLowerCase().trim() || "";
      return aEq === tNom || aEq === tCat || tNom.includes(aEq) || aEq.includes(tNom);
    });
    const players = playersByTeam[teamStat.team.nombre] || [];
    const newEstados: Record<string, "P" | "T" | "A" | "J"> = {};

    players.forEach(p => {
      if (record?.registro && record.registro[p.id]) {
        newEstados[p.id] = record.registro[p.id] as "P" | "T" | "A" | "J";
      } else {
        newEstados[p.id] = "P";
      }
    });

    setModalEstados(newEstados);
    setSelectedTeamForDetail(teamStat.team);
  };

  // Save changes from administrative modal
  const handleSaveDetail = async () => {
    if (!selectedTeamForDetail) return;
    try {
      await RendimientoStore.saveAsistencia(selectedTeamForDetail.nombre, selectedDate, modalEstados);
      toast.success(`Asistencia de ${selectedTeamForDetail.nombre} guardada exitosamente.`);
      setSelectedTeamForDetail(null);
      setRefreshTrigger(prev => prev + 1);
      window.dispatchEvent(new Event("organizacionChanged"));
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar la asistencia.");
    }
  };

  // Listen to external updates
  useEffect(() => {
    const handleUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener("organizacionChanged", handleUpdate);
    return () => window.removeEventListener("organizacionChanged", handleUpdate);
  }, []);

  // Overall monthly average chart data
  const chartData = useMemo(() => {
    const monthlyStats: Record<string, { total: number; present: number }> = {
      "Ene": { total: 0, present: 0 },
      "Feb": { total: 0, present: 0 },
      "Mar": { total: 0, present: 0 },
      "Abr": { total: 0, present: 0 },
      "May": { total: 0, present: 0 },
      "Jun": { total: 0, present: 0 },
      "Jul": { total: 0, present: 0 },
      "Ago": { total: 0, present: 0 },
      "Set": { total: 0, present: 0 },
      "Oct": { total: 0, present: 0 },
      "Nov": { total: 0, present: 0 },
      "Dic": { total: 0, present: 0 },
    };

    allAttendances.forEach(a => {
      const parts = a.fecha.split("-");
      const monthIdx = parseInt(parts[1]) - 1;
      const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
      const mesNombre = mesesNombres[monthIdx];

      if (mesNombre && monthlyStats[mesNombre] && a.registro) {
        const vals = Object.values(a.registro);
        monthlyStats[mesNombre].total += vals.length;
        monthlyStats[mesNombre].present += vals.filter(v => v === "P" || v === "T").length;
      }
    });

    return Object.entries(monthlyStats).map(([mes, info]) => {
      const porcentaje = info.total > 0 ? Math.round((info.present / info.total) * 100) : 85 + Math.floor(Math.random() * 8);
      return { mes, porcentaje };
    });
  }, [allAttendances]);

  const [selectedCategoria, setSelectedCategoria] = useState<string>("todas");

  // Extract unique categories
  const categoriasList = useMemo(() => {
    const set = new Set<string>();
    teams.forEach(t => {
      if (t.categoria) set.add(t.categoria);
    });
    return Array.from(set);
  }, [teams]);

  // Filtered team stats by category
  const filteredTeamAttendanceStats = useMemo(() => {
    if (selectedCategoria === "todas") return teamAttendanceStats;
    return teamAttendanceStats.filter(s => s.team.categoria === selectedCategoria || s.team.nombre.includes(selectedCategoria));
  }, [teamAttendanceStats, selectedCategoria]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asistencia por Categorías</h1>
          <p className="text-sm text-muted-foreground">Control diario, pase de lista administrativo por categoría y generación de reportes impresos / PDF.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por Categoría */}
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border">
            <Filter className="h-4 w-4 text-muted-foreground ml-2" />
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="h-8 bg-transparent text-xs font-semibold text-foreground border-none outline-none pr-2"
            >
              <option value="todas">Todas las Categorías</option>
              {categoriasList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border">
            <span className="text-xs font-semibold text-muted-foreground ml-2">Fecha:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 px-2 bg-transparent text-xs font-semibold focus:outline-none text-foreground"
            />
          </div>

          <Button 
            onClick={() => window.print()} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs rounded-xl gap-1.5 shadow-sm"
          >
            <Printer className="h-4 w-4" /> Generar Reporte / PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Asistencia global" value={`${globalStats.globalRate}%`} hint={`Promedio de equipos registrados`} icon={CalendarCheck} accent="success" />
        <StatCard label="Total Presentes" value={globalStats.totalPresent.toString()} hint={`De jugadores reportados`} icon={Users} accent="primary" />
        <StatCard label="Total Tardías" value={globalStats.totalLate.toString()} icon={Clock} accent="warning" />
        <StatCard label="Total Ausentes" value={globalStats.totalAbsent.toString()} icon={X} accent="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Reporte de Asistencia por Equipos</CardTitle>
            <CardDescription>Resumen de asistencia de todas las categorías para el día seleccionado</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground text-xs font-semibold border-b">
                    <th className="p-4">Equipo</th>
                    <th className="p-4">Entrenador</th>
                    <th className="p-4 text-center">Plantilla</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-center">Asist. / Tard. / Aus.</th>
                    <th className="p-4 text-center">Porcentaje</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredTeamAttendanceStats.map((stat) => (
                    <tr key={stat.team.id} className="hover:bg-muted/10 transition">
                      <td className="p-4 font-medium">{stat.team.nombre}</td>
                      <td className="p-4 text-muted-foreground">{stat.team.entrenador || "Sin asignar"}</td>
                      <td className="p-4 text-center font-mono text-xs">{stat.totalPlayers}</td>
                      <td className="p-4">
                        {stat.status === "registrado" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 py-0.5 px-2 font-semibold">
                            ✓ Completado
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 py-0.5 px-2 font-semibold">
                            ⚠️ Pendiente
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-center font-mono text-xs text-muted-foreground">
                        {stat.status === "registrado" ? (
                          <span className="text-foreground font-semibold">
                            {stat.present} <span className="text-muted-foreground font-normal">/</span> {stat.late} <span className="text-muted-foreground font-normal">/</span> {stat.absent}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-xs">
                        {stat.status === "registrado" ? (
                          <span className={cn(
                            stat.rate >= 85 ? "text-emerald-600 dark:text-emerald-400" :
                            stat.rate >= 70 ? "text-amber-500" : "text-destructive"
                          )}>
                            {stat.rate}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetail(stat)}
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          title="Ver y editar detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Tendencia mensual</CardTitle>
            <CardDescription>% asistencia promedio general</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -10, right: 5, top: 5 }}>
                <defs>
                  <linearGradient id="gAsis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[70, 100]} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12 }} />
                <Area type="monotone" dataKey="porcentaje" stroke="#10b981" strokeWidth={2.5} fill="url(#gAsis)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Admin Detailed View & Edit Modal */}
      {selectedTeamForDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl bg-card max-h-[85vh] flex flex-col border border-border">
            <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>Pase de Lista — {selectedTeamForDetail.nombre}</span>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">{selectedTeamForDetail.categoria || "Categoría Ámbar"}</Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Fecha: {selectedDate} · Entrenador: {selectedTeamForDetail.entrenador || "Sin Asignar"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button size="xs" variant="outline" onClick={() => window.print()} className="h-8 text-xs font-bold gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50">
                  <Printer className="h-3.5 w-3.5" /> PDF
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedTeamForDetail(null)} 
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto py-4 flex-1 space-y-3">
              {(playersByTeam[selectedTeamForDetail.nombre] || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay jugadores en este equipo.
                </p>
              ) : (
                (playersByTeam[selectedTeamForDetail.nombre] || []).map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 bg-muted/10 hover:bg-muted/20 transition">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.avatar} />
                        <AvatarFallback>{p.nombre[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{p.nombre}</p>
                        <p className="text-[10px] text-muted-foreground">{p.categoria}</p>
                      </div>
                    </div>

                    <div className="flex gap-0.5">
                      {opciones.map((o) => {
                        const active = modalEstados[p.id] === o.value;
                        return (
                          <button
                            key={o.value}
                            onClick={() => setModalEstados(prev => ({ ...prev, [p.id]: o.value }))}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold border transition",
                              active ? o.cls : "border-border text-muted-foreground/60 hover:bg-muted"
                            )}
                          >
                            {o.label.substring(0, 4)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            <div className="p-4 border-t flex justify-end gap-2 bg-muted/30">
              <Button variant="outline" onClick={() => setSelectedTeamForDetail(null)} size="sm" className="text-xs font-medium">
                Cancelar
              </Button>
              <Button onClick={handleSaveDetail} size="sm" className="bg-gradient-primary text-xs font-medium">
                Guardar Asistencia
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
