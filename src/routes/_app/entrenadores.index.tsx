import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sedes, equipos, jugadores } from "@/lib/mock-data";
import { Plus, Search, Mail, Phone, MapPin, Clock, ArrowRight, UserCheck, Edit, Trash, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, DollarSign, Receipt, Calendar, ShieldCheck, Coins, TrendingUp } from "lucide-react";
import RendimientoStore, { StoreEntrenador, RegistroNominaEntrenador } from "@/lib/rendimiento-store";
import { ReciboHonorariosModal, ReciboData } from "@/components/entrenadores/ReciboHonorariosModal";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { downloadCoachTemplate, parseCoachesFromFile, type ParsedCoach } from "@/lib/excel-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/entrenadores/")({ component: EntrenadoresPage });

function EntrenadoresPage() {
  const router = useRouter();
  const [coachesList, setCoachesList] = useState<StoreEntrenador[]>(() => RendimientoStore.getEntrenadores());

  const fetchCoaches = () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase
      .from("entrenadores")
      .select("*")
      .eq("organizacion_id", orgId)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching coaches:", error.message);
        } else if (data) {
          const mapped = data.map((c: any) => ({
            id: c.id,
            nombre: c.nombre,
            identificacion: c.identificacion,
            correo: c.correo,
            telefono: c.telefono,
            whatsapp: c.whatsapp,
            especialidad: c.especialidad,
            disciplinas: c.disciplinas || ["Fútbol"],
            categorias: 0,
            sedeId: c.sede_id || "s1",
            horario: c.horario || "L-V 14:00 - 16:00",
            estado: c.estado || "activo",
            avatar: c.avatar || "",
            organizacion_id: c.organizacion_id
          }));
          RendimientoStore.set("entrenadores_dynamics", mapped);
          setCoachesList(mapped);
        }
      });
  };

  useEffect(() => {
    fetchCoaches();
    const handleSync = () => {
      fetchCoaches();
    };
    window.addEventListener("organizacionChanged", handleSync);
    return () => window.removeEventListener("organizacionChanged", handleSync);
  }, []);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [openImportResult, setOpenImportResult] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importCount, setImportCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"entrenadores" | "nomina">("entrenadores");
  const [selectedPeriodo, setSelectedPeriodo] = useState<"01-15" | "16-30">("01-15");
  const [tarifaSesionInput, setTarifaSesionInput] = useState<number>(25);
  const [bonoPartidoInput, setBonoPartidoInput] = useState<number>(35);
  const [cuentaBancariaInput, setCuentaBancariaInput] = useState<string>("CR05015202001023456789");
  const [monedaInput, setMonedaInput] = useState<"USD" | "CRC">("USD");

  const [ajustesMap, setAjustesMap] = useState<Record<string, number>>({});
  const [notasMap, setNotasMap] = useState<Record<string, string>>({});
  const [selectedRecibo, setSelectedRecibo] = useState<ReciboData | null>(null);
  const [isOpenRecibo, setIsOpenRecibo] = useState(false);

  // Form states
  const [nombre, setNombre] = useState("");
  const [identificacion, setIdentificacion] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [especialidad, setEspecialidad] = useState("Fútbol técnico");
  const [sedeId, setSedeId] = useState("s1");
  const [scheduleDays, setScheduleDays] = useState("L-V");
  const [scheduleStart, setScheduleStart] = useState("14:00");
  const [scheduleEnd, setScheduleEnd] = useState("16:00");
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>(["Fútbol"]);
  const [assignedCats, setAssignedCats] = useState<string[]>([]);

  const categories = useMemo(() => RendimientoStore.getCategorias(), []);

  const filtered = useMemo(() => {
    return coachesList.filter(t => 
      t.nombre.toLowerCase().includes(q.toLowerCase()) || 
      t.especialidad.toLowerCase().includes(q.toLowerCase())
    );
  }, [coachesList, q]);

  const handleOpenCreate = () => {
    setNombre("");
    setIdentificacion("");
    setCorreo("");
    setTelefono("");
    setEspecialidad("Fútbol técnico");
    setSedeId("s1");
    setScheduleDays("L-V");
    setScheduleStart("14:00");
    setScheduleEnd("16:00");
    setSelectedDisciplines(["Fútbol"]);
    setAssignedCats([]);
    setOpenCreate(true);
  };

  const handleCreateCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !identificacion || !correo || !telefono) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const finalHorario = `${scheduleDays} ${scheduleStart} - ${scheduleEnd}`;

    RendimientoStore.addEntrenador({
      nombre,
      identificacion,
      correo,
      telefono,
      whatsapp: telefono,
      especialidad,
      disciplinas: selectedDisciplines,
      sedeId,
      horario: finalHorario,
      estado: "activo",
    });

    RendimientoStore.assignCategoriasToEntrenador(nombre, assignedCats);

    setOpenCreate(false);
    toast.success("Entrenador registrado con éxito");
    setCoachesList(RendimientoStore.getEntrenadores());
    router.invalidate();
  };

  const parseExistingHorario = (hStr: string) => {
    if (!hStr) return { days: "L-V", start: "14:00", end: "16:00" };
    const normalized = hStr.trim();
    const firstDigitIndex = normalized.search(/\d/);
    if (firstDigitIndex === -1) return { days: "L-V", start: "14:00", end: "16:00" };
    
    let daysPart = normalized.substring(0, firstDigitIndex).trim();
    if (daysPart.endsWith("-") || daysPart.endsWith("–")) {
      daysPart = daysPart.substring(0, daysPart.length - 1).trim();
    }
    
    let days = "L-V";
    const lowerDays = daysPart.toLowerCase();
    if (lowerDays.includes("l-v") || lowerDays.includes("l v") || lowerDays.includes("lunes a viernes") || lowerDays.includes("l–v")) days = "L-V";
    else if (lowerDays.includes("l, m, v") || lowerDays.includes("l,m,v")) days = "L, M, V";
    else if (lowerDays.includes("m, j") || lowerDays.includes("m,j")) days = "M, J";
    else if (lowerDays.includes("s") || lowerDays.includes("sab")) days = "S";
    else if (lowerDays.includes("l-d")) days = "L-D";
    else days = daysPart || "L-V";

    const hoursPart = normalized.substring(firstDigitIndex).trim();
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*[-–a]\s*(\d{1,2})(?::(\d{2}))?/;
    const match = hoursPart.match(timeRegex);
    if (!match) return { days, start: "14:00", end: "16:00" };
    
    let startHour = parseInt(match[1], 10);
    let startMin = match[2] ? parseInt(match[2], 10) : 0;
    let endHour = parseInt(match[3], 10);
    let endMin = match[4] ? parseInt(match[4], 10) : 0;

    if (startHour >= 1 && startHour <= 6) startHour += 12;
    if (endHour >= 1 && endHour <= 6) endHour += 12;

    const start = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
    const end = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

    return { days, start, end };
  };

  const handleOpenEdit = (t: StoreEntrenador) => {
    setEditingId(t.id);
    setNombre(t.nombre);
    setIdentificacion(t.identificacion);
    setCorreo(t.correo);
    setTelefono(t.telefono);
    setEspecialidad(t.especialidad);
    setSedeId(t.sedeId || "s1");
    
    const parsed = parseExistingHorario(t.horario);
    setScheduleDays(parsed.days);
    setScheduleStart(parsed.start);
    setScheduleEnd(parsed.end);

    setSelectedDisciplines(t.disciplinas);

    // Pre-populate assigned categories
    const cats = RendimientoStore.getCategorias().filter(c => c.entrenador === t.nombre);
    setAssignedCats(cats.map(c => c.nombre));

    setOpenEdit(true);
  };

  const handleSaveCoachEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const finalHorario = `${scheduleDays} ${scheduleStart} - ${scheduleEnd}`;

    RendimientoStore.updateEntrenador(editingId, {
      nombre,
      identificacion,
      correo,
      telefono,
      whatsapp: telefono,
      especialidad,
      disciplinas: selectedDisciplines,
      sedeId,
      horario: finalHorario,
    });

    RendimientoStore.assignCategoriasToEntrenador(nombre, assignedCats);

    setOpenEdit(false);
    setEditingId(null);
    toast.success("Entrenador actualizado con éxito");
    setCoachesList(RendimientoStore.getEntrenadores());
    router.invalidate();
  };

  const handleDeleteCoach = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este entrenador? Esta acción no se puede deshacer.")) {
      RendimientoStore.deleteEntrenador(id);
      toast.success("Entrenador eliminado con éxito");
      setCoachesList(RendimientoStore.getEntrenadores());
      router.invalidate();
    }
  };

  const toggleDiscipline = (discName: string) => {
    if (selectedDisciplines.includes(discName)) {
      if (selectedDisciplines.length > 1) {
        setSelectedDisciplines(selectedDisciplines.filter(d => d !== discName));
      }
    } else {
      setSelectedDisciplines([...selectedDisciplines, discName]);
      setEspecialidad(discName);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const { valid, errors } = await parseCoachesFromFile(file);
      let added = 0;
      for (const coach of valid) {
        RendimientoStore.addEntrenador({
          nombre: coach.nombre,
          identificacion: coach.identificacion,
          correo: coach.correo,
          telefono: coach.telefono,
          whatsapp: coach.telefono,
          especialidad: coach.especialidad,
          disciplinas: coach.disciplinas,
          sedeId: "s1",
          horario: coach.horario,
          estado: "activo",
        });
        added++;
      }
      setCoachesList(RendimientoStore.getEntrenadores());
      setImportCount(added);
      setImportErrors(errors);
      setOpenImportResult(true);
    } catch (err) {
      toast.error("Error al importar el archivo Excel");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.invalidate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Entrenadores · Coach OS</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} entrenadores registrados en la academia.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadCoachTemplate()} className="gap-1.5 text-xs h-9 border-primary/30 text-primary hover:bg-primary/5 font-semibold">
            <Download className="h-4 w-4" /> Descargar Plantilla Excel
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} className="gap-1.5 text-xs h-9 font-semibold">
            <Upload className="h-4 w-4" /> {importing ? "Importando..." : "Importar desde Excel"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
          <Button onClick={handleOpenCreate} className="bg-gradient-primary shadow-elegant gap-1.5 text-xs h-9 font-semibold">
            <Plus className="h-4 w-4" /> Nuevo entrenador
          </Button>
        </div>
      </div>

      {/* Tabs selector */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "entrenadores" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("entrenadores")}
            className="text-xs font-bold gap-1.5"
          >
            👥 Directorio de Staff ({coachesList.length})
          </Button>
          <Button
            variant={activeTab === "nomina" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("nomina")}
            className={activeTab === "nomina" ? "bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm" : "text-xs font-bold gap-1.5"}
          >
            💵 Nómina & Cierre Quincenal
          </Button>
        </div>
      </div>

      {activeTab === "nomina" ? (
        /* VISTA DE NÓMINA Y HONORARIOS */
        <div className="space-y-6">
          {/* Header Controls & Period Selector */}
          <Card className="shadow-card border-border bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase font-mono font-bold text-amber-400">Motor de Nómina Automatizada</p>
                <h2 className="text-lg font-extrabold text-white">Corte Quincenal de Honorarios Deportivos</h2>
                <p className="text-xs text-slate-300">
                  Cómputo basado en sesiones con reporte cerrado en app + partidos de liga dirigidos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-1 flex items-center gap-1">
                  <button
                    onClick={() => setSelectedPeriodo("01-15")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedPeriodo === "01-15" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📅 01 al 15 de Julio
                  </button>
                  <button
                    onClick={() => setSelectedPeriodo("16-30")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedPeriodo === "16-30" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    📅 16 al 31 de Julio
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Table of Trainers Payroll */}
          <Card className="shadow-card border-border">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-500" />
                Desglose Individual de Entrenadores ({coachesList.length})
              </h3>
              <span className="text-xs text-muted-foreground">
                Período seleccionado: <strong className="text-primary font-mono">{selectedPeriodo === "01-15" ? "01 - 15 de Julio de 2026" : "16 - 31 de Julio de 2026"}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground font-bold border-b border-border">
                    <th className="p-3.5">Entrenador & Categoría</th>
                    <th className="p-3.5 text-center">Tarifas Base</th>
                    <th className="p-3.5 text-center">Sesiones Cerradas</th>
                    <th className="p-3.5 text-center">Partidos Dirigidos</th>
                    <th className="p-3.5 text-center">Ajustes (+/- $)</th>
                    <th className="p-3.5 text-right">Monto Bruto Total</th>
                    <th className="p-3.5 text-center">Acciones de Nómina</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coachesList.map((coach, idx) => {
                    const tarifaSes = coach.tarifaSesion || 25;
                    const bonoPart = coach.bonoPartido || 35;
                    const symbol = (coach.moneda || "USD") === "CRC" ? "₡" : "$";
                    const cats = RendimientoStore.getCategorias().filter(c => c.entrenador === coach.nombre);
                    const catName = cats[0]?.nombre || "U9 / U13 Asoderive";

                    // Simulated checked sessions & matches
                    const sesionesCount = idx === 0 ? 4 : idx === 1 ? 5 : 3;
                    const partidosCount = idx === 0 ? 2 : idx === 1 ? 1 : 2;

                    const montoSesiones = sesionesCount * tarifaSes;
                    const montoPartidos = partidosCount * bonoPart;
                    const ajusteMonto = ajustesMap[coach.id] || 0;
                    const totalCalculado = montoSesiones + montoPartidos + ajusteMonto;

                    const existingNomina = RendimientoStore.getNominas().find(n => n.entrenadorId === coach.id);
                    const isPagado = existingNomina?.estado === "pagado";

                    const handleVerRecibo = () => {
                      setSelectedRecibo({
                        id: existingNomina?.id || `rec_${coach.id}_${Date.now()}`,
                        entrenadorNombre: coach.nombre,
                        entrenadorIdentificacion: coach.identificacion || "1-1123-0988",
                        entrenadorCorreo: coach.correo,
                        entrenadorTelefono: coach.telefono,
                        cuentaBancaria: coach.cuentaBancaria || "CR05015202001023456789",
                        categoriaAsignada: catName,
                        periodoInicio: selectedPeriodo === "01-15" ? "01 de Julio" : "16 de Julio",
                        periodoFin: selectedPeriodo === "01-15" ? "15 de Julio" : "31 de Julio de 2026",
                        sesionesCantidad: sesionesCount,
                        sesionesTarifa: tarifaSes,
                        sesionesSubtotal: montoSesiones,
                        partidosCantidad: partidosCount,
                        partidosBono: bonoPart,
                        partidosSubtotal: montoPartidos,
                        ajustesMonto: ajusteMonto,
                        ajustesNotas: notasMap[coach.id] || undefined,
                        montoTotal: totalCalculado,
                        moneda: coach.moneda || "USD",
                        estado: isPagado ? "pagado" : "aprobado",
                      });
                      setIsOpenRecibo(true);
                    };

                    const handleAprobarNomina = () => {
                      const record: RegistroNominaEntrenador = {
                        id: existingNomina?.id || `nom_${coach.id}_${Date.now()}`,
                        entrenadorId: coach.id,
                        entrenadorNombre: coach.nombre,
                        entrenadorIdentificacion: coach.identificacion,
                        entrenadorCorreo: coach.correo,
                        cuentaBancaria: coach.cuentaBancaria || "CR05015202001023456789",
                        categoriaAsignada: catName,
                        periodoInicio: selectedPeriodo === "01-15" ? "2026-07-01" : "2026-07-16",
                        periodoFin: selectedPeriodo === "01-15" ? "2026-07-15" : "2026-07-31",
                        sesionesConcluidas: sesionesCount,
                        partidosConcluidos: partidosCount,
                        tarifaSesion: tarifaSes,
                        bonoPartido: bonoPart,
                        montoSesiones: montoSesiones,
                        montoPartidos: montoPartidos,
                        montoAjustes: ajusteMonto,
                        notasAjustes: notasMap[coach.id] || "",
                        montoTotal: totalCalculado,
                        moneda: coach.moneda || "USD",
                        estado: "pagado",
                        fechaPago: new Date().toISOString().slice(0, 10),
                      };

                      RendimientoStore.aprobarNomina(record.id);
                      RendimientoStore.saveNomina(record);
                      toast.success(`🚀 Nómina aprobada y egreso registrado para ${coach.nombre}`);
                      router.invalidate();
                    };

                    return (
                      <tr key={coach.id} className="hover:bg-muted/30 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarImage src={coach.avatar} />
                              <AvatarFallback>{coach.nombre[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-foreground">{coach.nombre}</p>
                              <p className="text-[10px] text-muted-foreground">{catName} · ID: {coach.identificacion || "N/A"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="space-y-0.5 font-mono text-[11px]">
                            <div>Sesión: <span className="font-bold text-primary">{symbol}{tarifaSes}</span></div>
                            <div>Partido: <span className="font-bold text-amber-600">{symbol}{bonoPart}</span></div>
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                            {sesionesCount} sesiones ({symbol}{montoSesiones})
                          </Badge>
                        </td>

                        <td className="p-3.5 text-center">
                          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold">
                            {partidosCount} partidos ({symbol}{montoPartidos})
                          </Badge>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={ajustesMap[coach.id] || ""}
                              onChange={(e) => setAjustesMap({ ...ajustesMap, [coach.id]: parseFloat(e.target.value) || 0 })}
                              className="w-20 h-7 text-center text-xs font-mono"
                            />
                          </div>
                        </td>

                        <td className="p-3.5 text-right font-black text-sm text-foreground font-mono">
                          {symbol}{totalCalculado.toFixed(2)}
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleVerRecibo}
                              className="h-7 text-[11px] font-bold gap-1 text-slate-700 dark:text-slate-200 border-border"
                            >
                              <Receipt className="h-3.5 w-3.5 text-indigo-500" /> Recibo
                            </Button>

                            {isPagado ? (
                              <Badge className="bg-emerald-600 text-white font-bold text-[10px] h-7 px-2.5 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={handleAprobarNomina}
                                className="h-7 text-[11px] font-bold gap-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" /> Aprobar & Pagar
                              </Button>
                            )}
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
      ) : (
        /* VISTA DE DIRECTORIO DE ENTRENADORES */
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar entrenador..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const dynamicCats = RendimientoStore.getCategorias();
          const dynamicTeams = RendimientoStore.getEquipos();
          
          const equiposT = dynamicTeams.filter((e) => e.entrenador === t.nombre);
          const catsT = dynamicCats.filter((c) => c.entrenador === t.nombre);
          const jugadoresCount = catsT.reduce((sum, c) => sum + c.jugadores, 0) ||
            equiposT.reduce((sum, e) => sum + e.jugadores, 0) ||
            jugadores.filter((j) => j.sedeId === t.sedeId).length;
          return (
            <Card key={t.id} className="shadow-card hover:shadow-elegant transition group flex flex-col justify-between">
              <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      <AvatarImage src={t.avatar} />
                      <AvatarFallback>{t.nombre[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{t.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.especialidad}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold border-none px-2.5 py-0.5 rounded-full text-[11px]">Activo</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-base font-semibold">{equiposT.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Equipos</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-base font-semibold">{catsT.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Categorías</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-base font-semibold">{jugadoresCount}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Jugadores</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" /> {t.correo}</p>
                    <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {t.telefono}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {sedes.find((s) => s.id === t.sedeId)?.nombre}</p>
                    <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {t.horario}</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(t.disciplinas)
                      ? t.disciplinas.map((d: string) => <Badge key={d} variant="outline">{d}</Badge>)
                      : t.disciplina
                        ? <Badge variant="outline">{(t as any).disciplina}</Badge>
                        : null}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button asChild className="flex-1 bg-gradient-primary shadow-elegant">
                    <Link to="/entrenadores/$id" params={{ id: t.id }}>
                      Abrir Coach OS <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleOpenEdit(t)} 
                    title="Editar Entrenador"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleDeleteCoach(t.id)} 
                    className="text-destructive hover:bg-destructive/10"
                    title="Eliminar Entrenador"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  )}

      {/* Dialog para Nuevo Entrenador */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[500px] bg-background border shadow-elegant max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <UserCheck className="h-5 w-5 text-primary" /> Registrar Nuevo Entrenador
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ingresa los datos del nuevo entrenador y asígnale categorías de trabajo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCoach} className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Nombre Completo *</Label>
              <Input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Juan Carlos Méndez"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Cédula / Identificación *</Label>
                <Input
                  value={identificacion}
                  onChange={e => setIdentificacion(e.target.value)}
                  placeholder="Ej. 115002400"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Teléfono *</Label>
                <Input
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="Ej. +506 8888 7777"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Correo Electrónico *</Label>
              <Input
                type="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="juan@academia.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Especialidad</Label>
              <Input
                value={especialidad}
                onChange={e => setEspecialidad(e.target.value)}
                placeholder="Ej. Táctico Juvenil"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Horario de Trabajo *</Label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={scheduleDays}
                  onChange={e => setScheduleDays(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                >
                  <option value="L-V">Lunes a Viernes (L-V)</option>
                  <option value="L, M, V">Lun, Mié, Vie (L, M, V)</option>
                  <option value="M, J">Mar, Jue (M, J)</option>
                  <option value="S">Sábados (S)</option>
                  <option value="L-D">Todos los días (L-D)</option>
                </select>
                <div className="flex items-center gap-1.5 col-span-2">
                  <Input
                    type="time"
                    value={scheduleStart}
                    onChange={e => setScheduleStart(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input
                    type="time"
                    value={scheduleEnd}
                    onChange={e => setScheduleEnd(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Sede Asignada</Label>
                <select
                  value={sedeId}
                  onChange={e => setSedeId(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-card text-sm"
                >
                  {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Disciplinas</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Fútbol", "Baloncesto", "Natación", "Voleibol"].map(d => {
                    const active = selectedDisciplines.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDiscipline(d)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-input"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Categorías y Equipos Asignados</Label>
              <div className="flex flex-wrap gap-2 pt-1 max-h-[120px] overflow-y-auto p-1 border rounded-lg bg-card/50">
                {categories.map(c => {
                  const active = assignedCats.includes(c.nombre);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleAssignedCategory(c.nombre)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ${
                        active ? "bg-primary/20 text-primary border-primary/40 font-semibold" : "bg-card text-muted-foreground border-input hover:border-slate-400"
                      }`}
                    >
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-primary">Guardar Entrenador</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Entrenador */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[500px] bg-background border shadow-elegant max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Edit className="h-5 w-5 text-primary" /> Editar Datos de Entrenador
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifica los detalles de adscripción, sede o asignación de categorías para este entrenador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCoachEdit} className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Nombre Completo *</Label>
              <Input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Juan Carlos Méndez"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Cédula / Identificación *</Label>
                <Input
                  value={identificacion}
                  onChange={e => setIdentificacion(e.target.value)}
                  placeholder="Ej. 115002400"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Teléfono *</Label>
                <Input
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="Ej. +506 8888 7777"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Correo Electrónico *</Label>
              <Input
                type="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                placeholder="juan@academia.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Especialidad</Label>
              <Input
                value={especialidad}
                onChange={e => setEspecialidad(e.target.value)}
                placeholder="Ej. Táctico Juvenil"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Horario de Trabajo *</Label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={scheduleDays}
                  onChange={e => setScheduleDays(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                >
                  <option value="L-V">Lunes a Viernes (L-V)</option>
                  <option value="L, M, V">Lun, Mié, Vie (L, M, V)</option>
                  <option value="M, J">Mar, Jue (M, J)</option>
                  <option value="S">Sábados (S)</option>
                  <option value="L-D">Todos los días (L-D)</option>
                </select>
                <div className="flex items-center gap-1.5 col-span-2">
                  <Input
                    type="time"
                    value={scheduleStart}
                    onChange={e => setScheduleStart(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input
                    type="time"
                    value={scheduleEnd}
                    onChange={e => setScheduleEnd(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Sede Asignada</Label>
                <select
                  value={sedeId}
                  onChange={e => setSedeId(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-card text-sm"
                >
                  {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Disciplinas</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Fútbol", "Baloncesto", "Natación", "Voleibol"].map(d => {
                    const active = selectedDisciplines.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDiscipline(d)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-input"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Categorías y Equipos Asignados</Label>
              <div className="flex flex-wrap gap-2 pt-1 max-h-[120px] overflow-y-auto p-1 border rounded-lg bg-card/50">
                {categories.map(c => {
                  const active = assignedCats.includes(c.nombre);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleAssignedCategory(c.nombre)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ${
                        active ? "bg-primary/20 text-primary border-primary/40 font-semibold" : "bg-card text-muted-foreground border-input hover:border-slate-400"
                      }`}
                    >
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setOpenEdit(false); setEditingId(null); }}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-primary">Guardar Cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Resultados de Importación */}
      <Dialog open={openImportResult} onOpenChange={setOpenImportResult}>
        <DialogContent className="sm:max-w-[460px] bg-background border shadow-elegant">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FileSpreadsheet className="h-5 w-5 text-primary" /> Resultado de la Importación
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Resumen del procesamiento del archivo Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-success/5 border-success/20 text-success">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">{importCount}</span> entrenadores cargados exitosamente a la academia.
              </div>
            </div>

            {importErrors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                  <AlertTriangle className="h-4 w-4" /> Filas omitidas con advertencias ({importErrors.length}):
                </div>
                <div className="max-h-[160px] overflow-y-auto border rounded-lg bg-muted/30 p-2 space-y-1 text-[11px] font-mono text-muted-foreground">
                  {importErrors.map((err, idx) => (
                    <div key={idx} className="border-b border-border/40 pb-1 last:border-0 last:pb-0">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setOpenImportResult(false)} className="bg-gradient-primary">Aceptar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recibo Honorarios Modal */}
      <ReciboHonorariosModal open={isOpenRecibo} onOpenChange={setIsOpenRecibo} data={selectedRecibo} />
    </div>
  );
}
