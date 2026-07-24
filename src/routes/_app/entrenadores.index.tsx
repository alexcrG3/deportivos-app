import { createFileRoute, Link, useRouter, useRouterState } from "@tanstack/react-router";
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

import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar 
} from "recharts";
import { 
  AlertCircle, CheckCircle, ShieldAlert, Award, FileText, 
  Sparkles as SparklesIcon, Calendar as CalendarIcon, UserCheck as UserCheckIcon,
  TrendingUp as TrendingUpIcon, Star as StarIcon, Palmtree as PalmtreeIcon,
  Banknote as BanknoteIcon, ArrowUpRight, ArrowDownRight, RefreshCw, Zap,
  User, Users, CheckSquare, Layers
} from "lucide-react";

export const Route = createFileRoute("/_app/entrenadores/")({ component: EntrenadoresPage });

function EntrenadoresPage() {
  const router = useRouter();
  const searchObj = useRouterState({ select: (r) => r.location.search }) as Record<string, any>;
  const tabFromUrl = searchObj?.tab || "dashboard";
  // Master Active Tab State
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  const [coachesList, setCoachesList] = useState<StoreEntrenador[]>(() => RendimientoStore.getEntrenadores());

  useEffect(() => {
    if (searchObj?.tab) {
      setActiveTab(searchObj.tab);
    }
  }, [searchObj?.tab]);

  const asistenciaSemanalData = useMemo(() => [
    { dia: "Lunes", porcentaje: 98 },
    { dia: "Martes", porcentaje: 95 },
    { dia: "Miércoles", porcentaje: 100 },
    { dia: "Jueves", porcentaje: 97 },
    { dia: "Viernes", porcentaje: 94 },
  ], []);

  const distribucionStaffData = useMemo(() => [
    { name: "Entrenadores", value: 55, color: "oklch(0.65 0.2 250)" },
    { name: "Administración", value: 18, color: "oklch(0.7 0.15 150)" },
    { name: "Preparadores", value: 12, color: "oklch(0.75 0.18 50)" },
    { name: "Médicos", value: 8, color: "oklch(0.6 0.25 290)" },
    { name: "Otros", value: 7, color: "oklch(0.65 0.12 200)" },
  ], []);

  const coachScoresData = useMemo(() => {
    const scores = [96, 91, 85, 79, 88, 94];
    return (coachesList.length > 0 ? coachesList : [
      { id: "c1", nombre: "Carlos Araya", avatar: "" },
      { id: "c2", nombre: "Edgar Calderón", avatar: "" },
      { id: "c3", nombre: "Eduardo Villa", avatar: "" },
      { id: "c4", nombre: "Tiffany Eduarte", avatar: "" },
    ]).map((c, idx) => ({
      id: c.id,
      nombre: c.nombre,
      score: scores[idx % scores.length],
      avatar: c.avatar || ""
    }));
  }, [coachesList]);

  const coachName0 = coachesList[0]?.nombre || "Carlos Araya";
  const coachName1 = coachesList[1]?.nombre || "Edgar Calderón";
  const coachName2 = coachesList[2]?.nombre || "Eduardo Villa";
  const coachName3 = coachesList[3]?.nombre || "Tiffany Eduarte";

  const fetchCoaches = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    
    // Purge legacy mock coaches from Supabase
    await supabase.from("entrenadores").delete().like("id", "t_main_%");
    await supabase.from("entrenadores").delete().like("id", "t_carlos_%");

    const { data: dbData, error } = await supabase.from("entrenadores").select("*");

    let coachesData = (dbData || []).filter((c: any) => 
      !c.id?.startsWith("t_main_") && !c.id?.startsWith("t_carlos_")
    );

    // If active org filter applies or missing coaches, auto-seed the real DB coaches
    const requiredCoaches = [
      { id: `c_carlos_${orgId.slice(0, 8)}`, nombre: "Carlos Araya", especialidad: "D.T. Fútbol Formativo", correo: "carlos@asoderive.com", telefono: "+506 8888-0101", estado: "activo", organizacion_id: orgId },
      { id: `c_edgar_${orgId.slice(0, 8)}`, nombre: "Edgar Calderón", especialidad: "Preparador Físico & Rendimiento", correo: "edgar@asoderive.com", telefono: "+506 8888-0102", estado: "activo", organizacion_id: orgId },
      { id: `c_eduardo_${orgId.slice(0, 8)}`, nombre: "Eduardo Villa", especialidad: "D.T. Categorías Juveniles", correo: "eduardo@asoderive.com", telefono: "+506 8888-0103", estado: "activo", organizacion_id: orgId },
      { id: `c_tiffany_${orgId.slice(0, 8)}`, nombre: "Tiffany Eduarte", especialidad: "Fisioterapeuta & Preparadora", correo: "tiffany@asoderive.com", telefono: "+506 8888-0104", estado: "activo", organizacion_id: orgId },
    ];

    if (coachesData.length === 0 || !coachesData.some((c: any) => c.nombre?.toLowerCase().includes("edgar") || c.nombre?.toLowerCase().includes("eduardo") || c.nombre?.toLowerCase().includes("tiffany"))) {
      await supabase.from("entrenadores").upsert(requiredCoaches);
      const { data: reFetched } = await supabase.from("entrenadores").select("*");
      coachesData = reFetched || requiredCoaches;
    }

    const mapped = coachesData.map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      identificacion: c.identificacion || "ID-100",
      correo: c.correo || `${c.nombre.toLowerCase().replace(/\s+/g, ".")}@academia.com`,
      telefono: c.telefono || "+506 8888-0000",
      whatsapp: c.whatsapp || c.telefono || "+506 8888-0000",
      especialidad: c.especialidad || "Entrenador Formativo",
      disciplinas: c.disciplinas || ["Fútbol"],
      categorias: 1,
      sedeId: c.sede_id || "sede-central",
      horario: c.horario || "L-V 14:00 - 16:00",
      estado: c.estado || "activo",
      avatar: c.avatar || `https://images.unsplash.com/photo-${c.nombre.includes("Tiffany") ? "1534528741775-53994a69daeb" : "1507003211169-0a1dd7228f2d"}?auto=format&fit=crop&w=100&q=80`,
      organizacion_id: orgId
    }));

    RendimientoStore.set("entrenadores_dynamics", mapped);
    setCoachesList(mapped);
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
  const [avatar, setAvatar] = useState("");

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
      toast.success("Fotografía cargada correctamente ✓");
    };
    reader.readAsDataURL(file);
  };

  const toggleAssignedCategory = (catName: string) => {
    setAssignedCats(prev => prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]);
  };

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
    setScheduleStart("14:00");
    setScheduleEnd("16:00");
    setSelectedDisciplines(["Fútbol"]);
    setAssignedCats([]);
    setAvatar("");
    setOpenCreate(true);
  };

  const handleCreateCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !identificacion || !correo || !telefono) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const finalDaysStr = selectedDays.length > 0 ? selectedDays.join(", ") : "L-V";
    const finalHorario = `${finalDaysStr} ${scheduleStart} - ${scheduleEnd}`;

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
      avatar,
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

  const ALL_WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
  const [selectedDays, setSelectedDays] = useState<string[]>(["Lun", "Mar", "Mié", "Jue", "Vie"]);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const parseExistingDays = (horarioStr: string): string[] => {
    if (!horarioStr) return ["Lun", "Mar", "Mié", "Jue", "Vie"];
    const lower = horarioStr.toLowerCase();
    const days: string[] = [];
    if (lower.includes("lun") || lower.includes("l-v") || lower.includes("l-d") || lower.includes("l,")) days.push("Lun");
    if (lower.includes("mar") || lower.includes("m,") || lower.includes("l-v") || lower.includes("l-d") || lower.includes("k")) days.push("Mar");
    if (lower.includes("mié") || lower.includes("mier") || lower.includes("m,") || lower.includes("l-v") || lower.includes("l-d")) days.push("Mié");
    if (lower.includes("jue") || lower.includes("j,") || lower.includes("l-v") || lower.includes("l-d")) days.push("Jue");
    if (lower.includes("vie") || lower.includes("v,") || lower.includes("l-v") || lower.includes("l-d")) days.push("Vie");
    if (lower.includes("sáb") || lower.includes("sab") || lower.includes("s,") || lower.includes("l-d")) days.push("Sáb");
    if (lower.includes("dom") || lower.includes("d,") || lower.includes("l-d")) days.push("Dom");
    return days.length > 0 ? Array.from(new Set(days)) : ["Lun", "Mar", "Mié", "Jue", "Vie"];
  };

  const handleOpenEdit = (t: StoreEntrenador) => {
    setEditingId(t.id);
    setNombre(t.nombre);
    setIdentificacion(t.identificacion);
    setCorreo(t.correo);
    setTelefono(t.telefono);
    setEspecialidad(t.especialidad);
    setSedeId(t.sedeId || "s1");
    setAvatar(t.avatar || "");
    
    const parsed = parseExistingHorario(t.horario);
    setSelectedDays(parseExistingDays(t.horario));
    setScheduleStart(parsed.start);
    setScheduleEnd(parsed.end);

    setSelectedDisciplines(t.disciplinas || ["Fútbol"]);

    // Pre-populate assigned categories
    const cats = RendimientoStore.getCategorias().filter(c => c.entrenador === t.nombre);
    setAssignedCats(cats.map(c => c.nombre));

    setOpenEdit(true);
  };

  const handleSaveCoachEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    const finalDaysStr = selectedDays.length > 0 ? selectedDays.join(", ") : "L-V";
    const finalHorario = `${finalDaysStr} ${scheduleStart} - ${scheduleEnd}`;

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
      avatar,
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
      {/* Header Controls & Quick Actions */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" /> Dashboard de Personal & Staff
          </h1>
          <p className="text-xs text-muted-foreground">
            Monitoreo general de colaboradores, asistencia, evaluaciones, rendimiento y certificaciones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleOpenCreate} className="bg-gradient-primary shadow-elegant gap-1.5 text-xs h-9 font-semibold">
            <Plus className="h-4 w-4" /> Nuevo Colaborador
          </Button>
          <Link to="/asistencia-staff">
            <Button variant="outline" className="gap-1.5 text-xs h-9 font-semibold border-border">
              <CalendarIcon className="h-4 w-4 text-emerald-500" /> Registrar Asistencia
            </Button>
          </Link>
          <Link to="/evaluaciones-staff">
            <Button variant="outline" className="gap-1.5 text-xs h-9 font-semibold border-border">
              <StarIcon className="h-4 w-4 text-amber-500" /> Crear Evaluación
            </Button>
          </Link>
          <Link to="/finanzas" search={{ tab: "nomina" }}>
            <Button variant="outline" className="gap-1.5 text-xs h-9 font-semibold border-border">
              <BanknoteIcon className="h-4 w-4 text-emerald-600" /> Procesar Nómina
            </Button>
          </Link>
          <Link to="/reportes">
            <Button variant="outline" className="gap-1.5 text-xs h-9 font-semibold border-border">
              <Download className="h-4 w-4 text-primary" /> Exportar Reporte
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex items-center justify-between border-b border-border pb-2.5 overflow-x-auto">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "dashboard" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("dashboard")}
            className={activeTab === "dashboard" ? "bg-gradient-primary text-white font-bold text-xs gap-1.5 shadow-sm" : "text-xs font-bold gap-1.5"}
          >
            📊 Dashboard General
          </Button>
          <Button
            variant={activeTab === "colaboradores" || activeTab === "entrenadores" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("colaboradores")}
            className="text-xs font-bold gap-1.5"
          >
            👥 Colaboradores ({coachesList.length})
          </Button>
          <Button
            variant={activeTab === "expedientes" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("expedientes")}
            className="text-xs font-bold gap-1.5"
          >
            📁 Expedientes
          </Button>
          <Button
            variant={activeTab === "certificaciones" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("certificaciones")}
            className="text-xs font-bold gap-1.5"
          >
            🎓 Certificaciones
          </Button>
          <Button
            variant={activeTab === "vacaciones" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("vacaciones")}
            className="text-xs font-bold gap-1.5"
          >
            🏖️ Vacaciones & Ausencias
          </Button>
          <Button
            variant={activeTab === "nomina" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("nomina")}
            className={activeTab === "nomina" ? "bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shadow-sm" : "text-xs font-bold gap-1.5"}
          >
            💰 Nómina & Honorarios
          </Button>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* 📊 1. PRIMERA FILA - KPIs (6 TARJETAS METRICAS) */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <Card className="p-3 bg-card border-border shadow-xs hover:border-primary/50 transition-all cursor-pointer" onClick={() => setActiveTab("colaboradores")}>
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold">Colaboradores</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-black text-foreground">42</p>
              <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5 mt-0.5">
                <ArrowUpRight className="h-3 w-3" /> 4 en campo hoy
              </span>
            </Card>

            <Card className="p-3 bg-card border-border shadow-xs hover:border-emerald-500/50 transition-all cursor-pointer">
              <Link to="/asistencia-staff">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Presentes Hoy</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-foreground">39</p>
                <span className="text-[10px] text-emerald-500 font-semibold mt-0.5 block">92.8% asistencia</span>
              </Link>
            </Card>

            <Card className="p-3 bg-card border-border shadow-xs hover:border-rose-500/50 transition-all cursor-pointer">
              <Link to="/asistencia-staff">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Ausentes</span>
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                </div>
                <p className="text-2xl font-black text-foreground">3</p>
                <span className="text-[10px] text-rose-500 font-semibold mt-0.5 block">1 incapacidad, 2 lic.</span>
              </Link>
            </Card>

            <Card className="p-3 bg-card border-border shadow-xs hover:border-indigo-500/50 transition-all cursor-pointer">
              <Link to="/reportes">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Coach Score</span>
                  <TrendingUpIcon className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-2xl font-black text-foreground">91<span className="text-xs text-muted-foreground font-normal">/100</span></p>
                <span className="text-[10px] text-indigo-500 font-semibold mt-0.5 block">+2 pts este mes</span>
              </Link>
            </Card>

            <Card className="p-3 bg-card border-border shadow-xs hover:border-amber-500/50 transition-all cursor-pointer">
              <Link to="/evaluaciones-staff">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-[11px] font-bold">Evaluaciones Pend.</span>
                  <StarIcon className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-foreground">4</p>
                <span className="text-[10px] text-amber-500 font-semibold mt-0.5 block">Vencen este viernes</span>
              </Link>
            </Card>

            <Card className="p-3 bg-card border-border shadow-xs hover:border-orange-500/50 transition-all cursor-pointer" onClick={() => setActiveTab("certificaciones")}>
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold">Licencias Vencen</span>
                <Award className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-2xl font-black text-foreground">2</p>
              <span className="text-[10px] text-orange-500 font-semibold mt-0.5 block">Próximos 30 días</span>
            </Card>
          </div>

          {/* 🚨 2. CENTRO DE ATENCIÓN (LO QUE REQUIERE ACCIÓN HOY) */}
          <Card className="border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                <h2 className="text-sm font-bold text-foreground">🚨 Centro de Atención (Lo que requiere acción hoy)</h2>
              </div>
              <Badge variant="outline" className="border-rose-500/40 text-rose-500 text-[11px] font-semibold">
                6 Alertas Activas
              </Badge>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-3 rounded-xl bg-card border border-rose-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <p className="font-medium text-foreground"><strong>{coachName0}</strong> no registró asistencia hoy.</p>
                </div>
                <Link to="/asistencia-staff">
                  <Button size="xs" variant="outline" className="h-6 text-[10px] text-rose-600 border-rose-500/30 hover:bg-rose-50">Resolver</Button>
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-card border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <p className="font-medium text-foreground"><strong>{coachName1}</strong> no entregó planificación.</p>
                </div>
                <Link to="/tactica/planificacion">
                  <Button size="xs" variant="outline" className="h-6 text-[10px] text-amber-600 border-amber-500/30 hover:bg-amber-50">Reclamar</Button>
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-card border border-rose-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <p className="font-medium text-foreground"><strong>2 entrenadores</strong> con licencias vencidas.</p>
                </div>
                <Button size="xs" variant="outline" onClick={() => setActiveTab("certificaciones")} className="h-6 text-[10px] text-rose-600 border-rose-500/30 hover:bg-rose-50">Revisar</Button>
              </div>

              <div className="p-3 rounded-xl bg-card border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <p className="font-medium text-foreground"><strong>{coachName3}</strong> inicia vacaciones mañana.</p>
                </div>
                <Button size="xs" variant="outline" onClick={() => setActiveTab("vacaciones")} className="h-6 text-[10px] text-amber-600 border-amber-500/30 hover:bg-amber-50">Ver Detalle</Button>
              </div>

              <div className="p-3 rounded-xl bg-card border border-rose-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <p className="font-medium text-foreground">Evaluación trimestral de <strong>{coachesList.length} colaboradores</strong> pend.</p>
                </div>
                <Link to="/evaluaciones-staff">
                  <Button size="xs" variant="outline" className="h-6 text-[10px] text-rose-600 border-rose-500/30 hover:bg-rose-50">Evaluar</Button>
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-card border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <p className="font-medium text-foreground">Score de <strong>{coachName2}</strong> bajó de 92 a 81.</p>
                </div>
                <Link to="/reportes">
                  <Button size="xs" variant="outline" className="h-6 text-[10px] text-amber-600 border-amber-500/30 hover:bg-amber-50">Ver Gráfica</Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* 📈 3. BLOQUE DE RENDIMIENTO DEL STAFF Y ASISTENCIA SEMANAL */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Rendimiento del Staff */}
            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUpIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold text-foreground">📈 Rendimiento del Staff (Coach Score)</h3>
                </div>
                <Link to="/reportes">
                  <Button variant="ghost" size="xs" className="text-[11px] text-primary gap-1">
                    Ver reporte completo <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {coachScoresData.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.navigate({ to: "/entrenadores/$id", params: { id: c.id } })}>
                    <div className="flex items-center gap-2.5 w-32 shrink-0">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={c.avatar} />
                        <AvatarFallback className="text-[10px] font-bold">{c.nombre[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-foreground truncate">{c.nombre}</span>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${c.score}%` }} 
                      />
                    </div>
                    <span className="text-xs font-black text-foreground w-12 text-right">{c.score} <span className="text-[10px] text-muted-foreground font-normal">pts</span></span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Asistencia Semanal */}
            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-xs font-bold text-foreground">📅 Asistencia Semanal (Patrones de Asistencia)</h3>
                </div>
                <Link to="/asistencia-staff">
                  <Button variant="ghost" size="xs" className="text-[11px] text-emerald-600 gap-1">
                    Asistencia diaria <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={asistenciaSemanalData}>
                    <defs>
                      <linearGradient id="asistenciaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="dia" stroke="#888888" fontSize={11} />
                    <YAxis domain={[80, 100]} stroke="#888888" fontSize={11} unit="%" />
                    <Tooltip formatter={(val: any) => [`${val}%`, "Asistencia"]} />
                    <Area type="monotone" dataKey="porcentaje" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#asistenciaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* 🏖️ 4. BLOQUE TRIPLE: ESTADO DEL PERSONAL, CERTIFICACIONES, EVALUACIONES */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Estado del Personal */}
            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PalmtreeIcon className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-foreground">🏖️ Estado del Personal</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground font-semibold">Vacaciones</p>
                  <p className="text-base font-black text-amber-600">2 colab.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground font-semibold">Permisos</p>
                  <p className="text-base font-black text-blue-600">1 colab.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground font-semibold">Incapacidades</p>
                  <p className="text-base font-black text-rose-600">1 colab.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                  <p className="text-[10px] text-muted-foreground font-semibold">Injustificadas</p>
                  <p className="text-base font-black text-emerald-600">0</p>
                </div>
              </div>
              <Button variant="outline" size="xs" onClick={() => setActiveTab("vacaciones")} className="w-full text-xs font-semibold">
                Gestionar Ausencias
              </Button>
            </Card>

            {/* Certificaciones */}
            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-xs font-bold text-foreground">🎓 Certificaciones (Próximas a vencer)</h3>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-xl bg-muted/40 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">UEFA C · {coachName0}</p>
                    <span className="text-[10px] text-rose-500 font-semibold">Vence en 15 días</span>
                  </div>
                  <Button size="xs" variant="outline" className="h-6 text-[10px]">Renovar</Button>
                </div>
                <div className="p-2 rounded-xl bg-muted/40 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Primeros Auxilios · {coachName1}</p>
                    <span className="text-[10px] text-amber-500 font-semibold">Vence en 30 días</span>
                  </div>
                  <Button size="xs" variant="outline" className="h-6 text-[10px]">Renovar</Button>
                </div>
                <div className="p-2 rounded-xl bg-muted/40 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">FIFA Safeguarding · {coachName3}</p>
                    <span className="text-[10px] text-muted-foreground font-semibold">Vence en 45 días</span>
                  </div>
                  <Button size="xs" variant="outline" className="h-6 text-[10px]">Renovar</Button>
                </div>
              </div>
              <Button variant="outline" size="xs" onClick={() => setActiveTab("certificaciones")} className="w-full text-xs font-semibold">
                Ver todas las licencias
              </Button>
            </Card>

            {/* Evaluaciones */}
            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarIcon className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-foreground">⭐ Evaluaciones</h3>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs font-black text-amber-600">4</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Pendientes</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs font-black text-emerald-600">12</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Este Mes</p>
                </div>
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-xs font-black text-indigo-600">92<span className="text-[9px]">/100</span></p>
                  <p className="text-[9px] text-muted-foreground font-medium">Promedio</p>
                </div>
              </div>
              <Link to="/evaluaciones-staff" className="block w-full">
                <Button variant="default" size="xs" className="w-full text-xs font-semibold bg-gradient-primary">
                  Ir a Evaluaciones
                </Button>
              </Link>
            </Card>
          </div>

          {/* 📋 5. BLOQUE DOBLE: PLANIFICACIONES Y NÓMINA */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Planificaciones */}
            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <h3 className="text-xs font-bold text-foreground">📋 Planificaciones Semanales</h3>
                </div>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[10px] font-bold gap-1">
                  <SparklesIcon className="h-3 w-3" /> Promedio IA: 93/100
                </Badge>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-muted/40 border">
                  <p className="text-xs font-black text-foreground">6</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Entrenadores</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs font-black text-emerald-600">5</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Entregadas</p>
                </div>
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-xs font-black text-rose-600">1</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Pendientes</p>
                </div>
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs font-black text-blue-600">4</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Aprobadas</p>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs font-black text-amber-600">1</p>
                  <p className="text-[9px] text-muted-foreground font-medium">Devueltas</p>
                </div>
              </div>
              <Link to="/tactica/planificacion" className="block w-full">
                <Button variant="outline" size="xs" className="w-full text-xs font-semibold">
                  Revisar Planificaciones
                </Button>
              </Link>
            </Card>

            {/* Nómina */}
            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BanknoteIcon className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-xs font-bold text-foreground">💰 Nómina & Contratos</h3>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground">Próxima: 28 de Julio</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-muted/40 border">
                  <p className="text-[10px] text-muted-foreground font-semibold">Monto Estimado</p>
                  <p className="text-sm font-black text-foreground">₡4.850.000</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border">
                  <p className="text-[10px] text-muted-foreground font-semibold">Colaboradores</p>
                  <p className="text-sm font-black text-foreground">42 recibos</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">Pendientes</p>
                  <p className="text-sm font-black text-amber-600">1 contrato</p>
                </div>
              </div>
              <Link to="/finanzas" search={{ tab: "nomina" }} className="block w-full">
                <Button variant="default" size="xs" className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                  Procesar Nómina
                </Button>
              </Link>
            </Card>
          </div>

          {/* 📊 6. BLOQUE FINAL: DISTRIBUCIÓN DEL PERSONAL Y ACTIVIDAD RECIENTE */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Distribución del Personal */}
            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-xs font-bold text-foreground">📊 Distribución del Personal</h3>
                </div>
              </div>
              <div className="flex items-center gap-4 h-44">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distribucionStaffData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3}>
                        {distribucionStaffData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val}%`, "Porcentaje"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-1.5 text-xs">
                  {distribucionStaffData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-muted-foreground font-medium">{d.name}</span>
                      </div>
                      <span className="font-bold text-foreground">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Actividad Reciente */}
            <Card className="p-4 bg-card border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold text-foreground">📝 Actividad Reciente</h3>
                </div>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">09:10</span>
                  <p className="text-foreground"><strong>{coachName0}</strong> registró asistencia en Sede Central.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">09:30</span>
                  <p className="text-foreground"><strong>{coachName1}</strong> entregó la planificación semanal.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">10:20</span>
                  <p className="text-foreground"><strong>{coachName3}</strong> aprobó una evaluación de desempeño.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">11:15</span>
                  <p className="text-foreground">Se registró una nueva certificación de Primeros Auxilios.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "nomina" && (
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
      )}

      {activeTab !== "dashboard" && activeTab !== "nomina" && (
        /* VISTA DE DIRECTORIO DE ENTRENADORES Y SUBMODULOS */
        <div className="space-y-4">
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
                      : (t as any).disciplina
                        ? <Badge variant="outline">{(t as any).disciplina}</Badge>
                        : <Badge variant="outline">Fútbol</Badge>}
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
        </div>
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
            <div className="flex items-center gap-4 p-3 rounded-xl border bg-card/50">
              <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-lg font-bold">{nombre ? nombre[0] : "📷"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-semibold">Fotografía de Perfil</Label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition">
                    <Upload className="h-3.5 w-3.5" /> Subir Imagen
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                  {avatar && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar("")} className="text-xs text-rose-500 h-8">
                      Quitar
                    </Button>
                  )}
                </div>
              </div>
            </div>

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

            <div className="flex flex-col gap-2 p-3 rounded-xl border bg-card/50">
              <Label className="text-xs font-bold text-foreground">Días de Entrenamiento *</Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_WEEKDAYS.map(day => {
                  const active = selectedDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                          : "bg-card text-muted-foreground border-input hover:border-primary/50"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t mt-1">
                <Label className="text-xs font-semibold text-muted-foreground">Horario:</Label>
                <Input
                  type="time"
                  value={scheduleStart}
                  onChange={e => setScheduleStart(e.target.value)}
                  className="h-8 text-xs w-28"
                  required
                />
                <span className="text-xs text-muted-foreground font-bold">a</span>
                <Input
                  type="time"
                  value={scheduleEnd}
                  onChange={e => setScheduleEnd(e.target.value)}
                  className="h-8 text-xs w-28"
                  required
                />
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
            <div className="flex items-center gap-4 p-3 rounded-xl border bg-card/50">
              <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-sm">
                <AvatarImage src={avatar} />
                <AvatarFallback className="text-lg font-bold">{nombre ? nombre[0] : "📷"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-semibold">Fotografía de Perfil</Label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition">
                    <Upload className="h-3.5 w-3.5" /> Subir Imagen
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                  {avatar && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar("")} className="text-xs text-rose-500 h-8">
                      Quitar
                    </Button>
                  )}
                </div>
              </div>
            </div>

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

            <div className="flex flex-col gap-2 p-3 rounded-xl border bg-card/50">
              <Label className="text-xs font-bold text-foreground">Días de Entrenamiento *</Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_WEEKDAYS.map(day => {
                  const active = selectedDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                          : "bg-card text-muted-foreground border-input hover:border-primary/50"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t mt-1">
                <Label className="text-xs font-semibold text-muted-foreground">Horario:</Label>
                <Input
                  type="time"
                  value={scheduleStart}
                  onChange={e => setScheduleStart(e.target.value)}
                  className="h-8 text-xs w-28"
                  required
                />
                <span className="text-xs text-muted-foreground font-bold">a</span>
                <Input
                  type="time"
                  value={scheduleEnd}
                  onChange={e => setScheduleEnd(e.target.value)}
                  className="h-8 text-xs w-28"
                  required
                />
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
