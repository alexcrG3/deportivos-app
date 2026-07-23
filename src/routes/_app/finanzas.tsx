import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ingresosMensuales, jugadores, formatCRC, flujoCajaMensual, ingresosPorSede, ingresosPorMetodo, encargados } from "@/lib/mock-data";
import { Wallet, TrendingUp, AlertTriangle, PiggyBank, Plus, Download, Users, FileSpreadsheet, ShoppingBag, Receipt, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RendimientoStore, { RegistroNominaEntrenador } from "@/lib/rendimiento-store";
import { FinanzasEgresos } from "@/components/finanzas-egresos";
import { FinanzasBalance } from "@/components/finanzas-balance";
import { ReciboHonorariosModal, ReciboData } from "@/components/entrenadores/ReciboHonorariosModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/finanzas")({
  component: FinanzasPage,
});

interface Becado {
  id: string;
  nombre: string;
  sede: string;
  categoria: string;
  beca: string;
  tipo: string;
  vigencia: string;
}

interface ArregloPago {
  id: string;
  nombre: string;
  sede: string;
  categoria: string;
  deudaOriginal: number;
  cuotaMensual: number;
  cuotasPagas: number;
  cuotasTotales: number;
  estado: string;
}

function FinanzasPage() {
  const [activePlayers, setActivePlayers] = useState(() => RendimientoStore.getJugadores());
  const [pagosRealizados, setPagosRealizados] = useState(() => RendimientoStore.getPagos());
  
  const morosos = activePlayers.filter((j) => j.estadoPago === "moroso");
  const pendientes = activePlayers.filter((j) => j.estadoPago === "pendiente");
  const [activeTab, setActiveTab] = useState("reportes-morosidad");
  const [selectedPeriodo, setSelectedPeriodo] = useState<"01-15" | "16-30">("01-15");
  const [selectedRecibo, setSelectedRecibo] = useState<ReciboData | null>(null);
  const [isOpenRecibo, setIsOpenRecibo] = useState(false);
  const [ajustesMap, setAjustesMap] = useState<Record<string, number>>({});
  const [selectedCategoryReport, setSelectedCategoryReport] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) setActiveTab(tab);
    }
  }, []);

  // Calcular suma real de pagos recibidos en el mes
  const ingresosRealesMes = pagosRealizados.reduce((acc, p) => acc + (p.monto || 0), 0);
  // Por cobrar es la suma de los saldos de los jugadores marcados como pendientes
  const porCobrarReal = pendientes.reduce((acc, j) => acc + (j.saldo || 0), 0);
  // Mora acumulada real es la suma de los saldos de los jugadores marcados como morosos
  const moraReal = morosos.reduce((acc, j) => acc + (j.saldo || 0), 0);

  // Crecimiento: comparar pagos del mes actual vs mes anterior
  const now = new Date();
  const mesActual = now.getMonth();
  const anioActual = now.getFullYear();
  const pagosEsteMs = pagosRealizados.filter(p => {
    if (!p.fecha) return false;
    const d = new Date(p.fecha);
    return d.getMonth() === mesActual && d.getFullYear() === anioActual;
  }).reduce((acc, p) => acc + (p.monto || 0), 0);
  const prevMonth = mesActual === 0 ? 11 : mesActual - 1;
  const prevYear = mesActual === 0 ? anioActual - 1 : anioActual;
  const pagosMesAnterior = pagosRealizados.filter(p => {
    if (!p.fecha) return false;
    const d = new Date(p.fecha);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  }).reduce((acc, p) => acc + (p.monto || 0), 0);
  const crecimientoPct = pagosMesAnterior > 0
    ? Math.round(((pagosEsteMs - pagosMesAnterior) / pagosMesAnterior) * 100)
    : (pagosEsteMs > 0 ? 100 : 0);
  const crecimientoLabel = crecimientoPct > 0 ? `+${crecimientoPct}%` : `${crecimientoPct}%`;

  // Get all unique categories/teams
  const uniqueCategories = Array.from(new Set(activePlayers.map(j => j.categoria).filter(Boolean)));
  
  // Calculate team-level reports
  const teamReports = uniqueCategories.map(cat => {
    const playersInCat = activePlayers.filter(j => j.categoria === cat);
    const morososInCat = playersInCat.filter(j => j.estadoPago === "moroso");
    const totalAdeudado = morososInCat.reduce((acc, curr) => acc + (curr.saldo || 0), 0);
    const morosidadPct = playersInCat.length > 0 ? (morososInCat.length / playersInCat.length) * 100 : 0;
    
    return {
      categoria: cat,
      totalJugadores: playersInCat.length,
      morosos: morososInCat.length,
      totalAdeudado,
      morosidadPct,
    };
  }).sort((a, b) => b.totalAdeudado - a.totalAdeudado); // sort by highest debt first

  // Filtered by selectedCategoryReport
  const reportTeamReports = selectedCategoryReport === "Todas"
    ? teamReports
    : teamReports.filter(t => t.categoria === selectedCategoryReport);

  const reportMorosos = selectedCategoryReport === "Todas"
    ? morosos
    : morosos.filter(m => m.categoria === selectedCategoryReport);

  const reportPendientes = selectedCategoryReport === "Todas"
    ? pendientes
    : pendientes.filter(p => p.categoria === selectedCategoryReport);

  const reportPlayers = selectedCategoryReport === "Todas"
    ? activePlayers
    : activePlayers.filter(j => j.categoria === selectedCategoryReport);

  // Calculate global stats using filtered data
  const totalMorososMonto = reportMorosos.reduce((acc, curr) => acc + (curr.saldo || 0), 0);
  const totalPendientesMonto = reportPendientes.reduce((acc, curr) => acc + (curr.saldo || 0), 0);

  const filteredMorosos = reportMorosos.filter((m) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.nombre.toLowerCase().includes(query) ||
      m.categoria.toLowerCase().includes(query) ||
      m.sede.toLowerCase().includes(query)
    );
  });

  const hasPlayers = activePlayers.length > 0;

  const [becados, setBecados] = useState<Becado[]>(() => {
    if (typeof window === "undefined") return [];
    const cached = localStorage.getItem("athletix_becados_v2");
    if (cached) return JSON.parse(cached);
    const initial = [
      { id: "b1", nombre: "Ian Gutiérrez Valverde", sede: "Sede Central", categoria: "U13", beca: "100%", tipo: "Deportiva", vigencia: "Ene 2026 - Dic 2026" },
      { id: "b2", nombre: "Mateo Rojas Calvo", sede: "Sede Central", categoria: "U15", beca: "50%", tipo: "Socioeconómica", vigencia: "Ene 2026 - Dic 2026" },
      { id: "b3", nombre: "Paula Fernández Calderón", sede: "Sede Central", categoria: "U15", beca: "75%", tipo: "Talento", vigencia: "Feb 2026 - Jul 2026" },
    ];
    localStorage.setItem("athletix_becados_v2", JSON.stringify(initial));
    return initial;
  });

  const [arreglos, setArreglos] = useState<ArregloPago[]>(() => {
    if (typeof window === "undefined") return [];
    const cached = localStorage.getItem("athletix_arreglos_v2");
    if (cached) return JSON.parse(cached);
    const initial = [
      { id: "a1", nombre: "Adrián Solís Navarro", sede: "Sede Central", categoria: "U13", deudaOriginal: 120000, cuotaMensual: 20000, cuotasPagas: 3, cuotasTotales: 6, estado: "Al día" },
      { id: "a2", nombre: "Gabriel Quesada Blanco", sede: "Sede Central", categoria: "U15", deudaOriginal: 90000, cuotaMensual: 15000, cuotasPagas: 2, cuotasTotales: 6, estado: "Pendiente" },
      { id: "a3", nombre: "Brayan Zamora Calderón", sede: "Sede Central", categoria: "U15", deudaOriginal: 60000, cuotaMensual: 10000, cuotasPagas: 4, cuotasTotales: 6, estado: "Al día" },
    ];
    localStorage.setItem("athletix_arreglos_v2", JSON.stringify(initial));
    return initial;
  });


  const [newBeca, setNewBeca] = useState(() => ({
    jugadorId: "",
    nombre: "",
    sede: "Sede Central",
    categoria: uniqueCategories[0] || "U13",
    beca: "",
    tipo: "Deportiva" as "Deportiva" | "Socioeconómica" | "Talento" | "Convenio",
    vigencia: "Ene 2026 - Dic 2026",
  }));

  const becaFilteredPlayers = useMemo(() => {
    return activePlayers.filter(j => j.categoria === newBeca.categoria);
  }, [activePlayers, newBeca.categoria]);

  const handleBecaCategoryChange = (cat: string) => {
    const playersInCat = activePlayers.filter(j => j.categoria === cat);
    const firstPlayer = playersInCat[0];
    setNewBeca(prev => ({
      ...prev,
      categoria: cat,
      jugadorId: firstPlayer?.id || "",
      nombre: firstPlayer?.nombre || "",
      sede: firstPlayer?.sede || "Sede Central",
    }));
  };

  const handleBecaPlayerChange = (playerId: string) => {
    const player = activePlayers.find(j => j.id === playerId);
    if (player) {
      setNewBeca(prev => ({
        ...prev,
        jugadorId: player.id,
        nombre: player.nombre,
        sede: player.sede || "Sede Central",
      }));
    }
  };

  const [openBeca, setOpenBeca] = useState(false);

  const handleAddBeca = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeca.nombre) return;
    const updated = [
      ...becados,
      {
        id: `b${becados.length + 1}`,
        nombre: newBeca.nombre,
        sede: newBeca.sede,
        categoria: newBeca.categoria,
        beca: newBeca.beca,
        tipo: newBeca.tipo,
        vigencia: newBeca.vigencia,
      },
    ];
    setBecados(updated);
    localStorage.setItem("athletix_becados_v2", JSON.stringify(updated));
    
    const firstCat = uniqueCategories[0] || "U13";
    const playersInCat = activePlayers.filter(j => j.categoria === firstCat);
    const firstPlayer = playersInCat[0];
    setNewBeca({
      jugadorId: firstPlayer?.id || "",
      nombre: firstPlayer?.nombre || "",
      sede: firstPlayer?.sede || "Sede Central",
      categoria: firstCat,
      beca: "",
      tipo: "Deportiva",
      vigencia: "Ene 2026 - Dic 2026",
    });
    setOpenBeca(false);
  };

  const [newArreglo, setNewArreglo] = useState(() => ({
    jugadorId: "",
    nombre: "",
    sede: "Sede Central",
    categoria: uniqueCategories[0] || "U13",
    deudaOriginal: 0,
    cuotaMensual: 0,
    cuotasPagas: 0,
    cuotasTotales: 0,
    estado: "Al día",
  }));

  const arregloFilteredPlayers = useMemo(() => {
    return activePlayers.filter(j => j.categoria === newArreglo.categoria);
  }, [activePlayers, newArreglo.categoria]);

  const handleArregloCategoryChange = (cat: string) => {
    const playersInCat = activePlayers.filter(j => j.categoria === cat);
    const firstPlayer = playersInCat[0];
    setNewArreglo(prev => ({
      ...prev,
      categoria: cat,
      jugadorId: firstPlayer?.id || "",
      nombre: firstPlayer?.nombre || "",
      sede: firstPlayer?.sede || "Sede Central",
    }));
  };

  const handleArregloPlayerChange = (playerId: string) => {
    const player = activePlayers.find(j => j.id === playerId);
    if (player) {
      setNewArreglo(prev => ({
        ...prev,
        jugadorId: player.id,
        nombre: player.nombre,
        sede: player.sede || "Sede Central",
      }));
    }
  };

  const [openArreglo, setOpenArreglo] = useState(false);

  const handleAddArreglo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArreglo.nombre) return;
    const updated = [
      ...arreglos,
      {
        id: `a${arreglos.length + 1}`,
        nombre: newArreglo.nombre,
        sede: newArreglo.sede,
        categoria: newArreglo.categoria,
        deudaOriginal: newArreglo.deudaOriginal,
        cuotaMensual: newArreglo.cuotaMensual,
        cuotasPagas: newArreglo.cuotasPagas,
        cuotasTotales: newArreglo.cuotasTotales,
        estado: newArreglo.estado,
      },
    ];
    setArreglos(updated);
    localStorage.setItem("athletix_arreglos_v2", JSON.stringify(updated));
    
    const firstCat = uniqueCategories[0] || "U13";
    const playersInCat = activePlayers.filter(j => j.categoria === firstCat);
    const firstPlayer = playersInCat[0];
    setNewArreglo({
      jugadorId: firstPlayer?.id || "",
      nombre: firstPlayer?.nombre || "",
      sede: firstPlayer?.sede || "Sede Central",
      categoria: firstCat,
      deudaOriginal: 0,
      cuotaMensual: 0,
      cuotasPagas: 0,
      cuotasTotales: 0,
      estado: "Al día",
    });
    setOpenArreglo(false);
  };

  useEffect(() => {
    if (uniqueCategories.length > 0) {
      const firstCat = uniqueCategories[0];
      const playersInCat = activePlayers.filter(j => j.categoria === firstCat);
      const firstPlayer = playersInCat[0];
      
      setNewBeca(prev => {
        if (!prev.nombre && firstPlayer) {
          return {
            ...prev,
            categoria: firstCat,
            jugadorId: firstPlayer.id,
            nombre: firstPlayer.nombre,
            sede: firstPlayer.sede || "Sede Central",
          };
        }
        return prev;
      });

      setNewArreglo(prev => {
        if (!prev.nombre && firstPlayer) {
          return {
            ...prev,
            categoria: firstCat,
            jugadorId: firstPlayer.id,
            nombre: firstPlayer.nombre,
            sede: firstPlayer.sede || "Sede Central",
          };
        }
        return prev;
      });
    }
  }, [activePlayers, uniqueCategories]);

  const mesesMap = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

  const chartIngresosMensuales = useMemo(() => {
    const list: { mes: string; ingresos: number; year: number; monthIdx: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        mes: `${mesesMap[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
        ingresos: 0,
        year: d.getFullYear(),
        monthIdx: d.getMonth()
      });
    }
    
    pagosRealizados.forEach(p => {
      if (!p.fecha) return;
      const pDate = new Date(p.fecha);
      const pYear = pDate.getFullYear();
      const pMonth = pDate.getMonth();
      const match = list.find(item => item.year === pYear && item.monthIdx === pMonth);
      if (match) {
        match.ingresos += (p.monto || 0);
      }
    });
    return list;
  }, [pagosRealizados]);

  const chartFlujoCajaMensual = useMemo(() => {
    return chartIngresosMensuales.map(item => ({
      mes: item.mes,
      ingresos: item.ingresos,
      egresos: Math.round(item.ingresos * 0.45),
    }));
  }, [chartIngresosMensuales]);

  const chartIngresosPorMetodo = useMemo(() => {
    const groups: Record<string, number> = {};
    pagosRealizados.forEach(p => {
      const m = p.metodo || "Otro";
      groups[m] = (groups[m] || 0) + (p.monto || 0);
    });
    return Object.keys(groups).map(k => ({
      metodo: k,
      monto: groups[k]
    }));
  }, [pagosRealizados]);

  const chartIngresosPorSede = useMemo(() => {
    const groups: Record<string, number> = {};
    pagosRealizados.forEach(p => {
      const player = activePlayers.find(j => j.id === p.jugadorId);
      const sede = player?.sede || "Sede Central";
      groups[sede] = (groups[sede] || 0) + (p.monto || 0);
    });
    return Object.keys(groups).map(k => ({
      sede: k,
      monto: groups[k]
    })).sort((a, b) => b.monto - a.monto);
  }, [pagosRealizados, activePlayers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finanzas</h1>
        <p className="text-sm text-muted-foreground">Mensualidades, pagos y estados de cuenta.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ingresos del mes" value={formatCRC(ingresosRealesMes)} delta={hasPlayers ? crecimientoPct : 0} icon={Wallet} accent="success" />
        <StatCard label="Por cobrar" value={formatCRC(porCobrarReal)} hint={`${pendientes.length} pendientes`} icon={PiggyBank} accent="warning" />
        <StatCard label="Mora acumulada" value={formatCRC(moraReal)} hint={`${morosos.length} jugadores`} icon={AlertTriangle} accent="destructive" />
        <StatCard label="Crecimiento" value={hasPlayers ? crecimientoLabel : "0%"} hint="vs mes anterior" icon={TrendingUp} accent="primary" />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Evolución de ingresos</CardTitle>
          <CardDescription>Últimos meses</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartIngresosMensuales} margin={{ left: -10, right: 5, top: 5 }}>
              <defs>
                <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} formatter={(v: number) => formatCRC(v)} />
              <Area type="monotone" dataKey="ingresos" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#gF)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Flujo de caja</CardTitle>
            <CardDescription>Ingresos vs egresos mensuales</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartFlujoCajaMensual} margin={{ left: -10, right: 5, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} formatter={(v: number) => formatCRC(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="ingresos" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Por método de pago</CardTitle>
            <CardDescription>Distribución del mes</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartIngresosPorMetodo} dataKey="monto" nameKey="metodo" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {chartIngresosPorMetodo.map((_, i) => (
                    <Cell key={i} fill={["var(--color-primary)", "var(--color-success)", "var(--color-warning)", "var(--color-chart-5)"][i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} formatter={(v: number) => formatCRC(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center -mt-2">
              {chartIngresosPorMetodo.map((m, i) => (
                <Badge key={m.metodo} variant="outline" className="text-[10px]">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: ["var(--color-primary)", "var(--color-success)", "var(--color-warning)", "var(--color-chart-5)"][i] }} />
                  {m.metodo}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Ingresos por sede</CardTitle>
          <CardDescription>Comparativa del mes actual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {chartIngresosPorSede.map((s) => {
            const max = Math.max(...chartIngresosPorSede.map((x) => x.monto));
            const pct = (s.monto / max) * 100;
            return (
              <div key={s.sede}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Sede {s.sede}</span>
                  <span className="font-semibold">{formatCRC(s.monto)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-2 mb-4">
              <div className="overflow-x-auto w-full md:w-auto scrollbar-none pb-1">
                <TabsList className="bg-transparent border-0 p-0 h-auto gap-1 flex-nowrap min-w-max">
                  <TabsTrigger value="reportes-morosidad" className="data-[state=active]:bg-muted px-3 py-1.5 text-xs font-medium rounded-md">📊 Reportes de Morosidad</TabsTrigger>
                  <TabsTrigger value="nomina" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-3 py-1.5 text-xs font-bold rounded-md">💵 Nómina de Staff (Entrenadores)</TabsTrigger>
                  <TabsTrigger value="egresos" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-3 py-1.5 text-xs font-bold rounded-md">🛍️ Salidas & Egresos (Compras)</TabsTrigger>
                  <TabsTrigger value="morosos" className="data-[state=active]:bg-muted px-3 py-1.5 text-xs font-medium rounded-md">Morosos ({morosos.length})</TabsTrigger>
                  <TabsTrigger value="pendientes" className="data-[state=active]:bg-muted px-3 py-1.5 text-xs font-medium rounded-md">Pendientes ({pendientes.length})</TabsTrigger>
                  <TabsTrigger value="becados" className="data-[state=active]:bg-muted px-3 py-1.5 text-xs font-medium rounded-md">Becados ({becados.length})</TabsTrigger>
                  <TabsTrigger value="arreglos" className="data-[state=active]:bg-muted px-3 py-1.5 text-xs font-medium rounded-md">Arreglos de Pago ({arreglos.length})</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs border-border gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 font-bold shadow-sm"
                  onClick={() => {
                    if (activeTab === "reportes-morosidad") {
                      toast.success(`Exportando Reporte de Morosidad (${selectedCategoryReport === "Todas" ? "Todas las categorías" : selectedCategoryReport}) en formato Excel...`);
                    } else if (activeTab === "morosos") {
                      toast.success(`Exportando listado de ${morosos.length} atletas Morosos a Excel...`);
                    } else if (activeTab === "pendientes") {
                      toast.success(`Exportando listado de ${pendientes.length} atletas Pendientes a Excel...`);
                    } else if (activeTab === "becados") {
                      toast.success(`Exportando listado de ${becados.length} atletas Becados a Excel...`);
                    } else if (activeTab === "arreglos") {
                      toast.success(`Exportando listado de ${arreglos.length} Arreglos de Pago a Excel...`);
                    }
                  }}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  {activeTab === "reportes-morosidad" ? "Exportar Reporte" : "Exportar Lista"}
                </Button>

                <Dialog open={openBeca} onOpenChange={setOpenBeca}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus className="mr-1 h-3.5 w-3.5" />Nueva Beca</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nueva Beca / Descuento</DialogTitle>
                      <DialogDescription>Asigna una beca deportiva o socioeconómica a un jugador.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddBeca} className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="beca-categoria">Categoría / Equipo</Label>
                          <select id="beca-categoria" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground" value={newBeca.categoria} onChange={(e) => handleBecaCategoryChange(e.target.value)}>
                            {uniqueCategories.map(cat => (
                              <option key={cat} value={cat} className="text-foreground bg-popover">{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="beca-nombre">Seleccionar Jugador</Label>
                          <select id="beca-nombre" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground" value={newBeca.jugadorId} onChange={(e) => handleBecaPlayerChange(e.target.value)}>
                            <option value="" disabled className="text-muted-foreground bg-popover">-- Seleccione --</option>
                            {becaFilteredPlayers.map(p => (
                              <option key={p.id} value={p.id} className="text-foreground bg-popover">{p.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="beca-porcentaje">Porcentaje de Beca</Label>
                          <Input id="beca-porcentaje" required placeholder="Ej. 50%" value={newBeca.beca} onChange={(e) => setNewBeca({ ...newBeca, beca: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="beca-tipo">Tipo de Beca</Label>
                          <select id="beca-tipo" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-semibold" value={newBeca.tipo} onChange={(e) => setNewBeca({ ...newBeca, tipo: e.target.value as any })}>
                            <option value="Deportiva" className="text-foreground bg-popover">Deportiva</option>
                            <option value="Socioeconómica" className="text-foreground bg-popover">Socioeconómica</option>
                            <option value="Talento" className="text-foreground bg-popover">Talento</option>
                            <option value="Convenio" className="text-foreground bg-popover">Convenio</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="beca-sede">Sede (Auto)</Label>
                          <Input id="beca-sede" disabled className="bg-muted text-muted-foreground" value={newBeca.sede} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="beca-vigencia">Vigencia</Label>
                          <Input id="beca-vigencia" required placeholder="Ej. Ene 2026 - Dic 2026" value={newBeca.vigencia} onChange={(e) => setNewBeca({ ...newBeca, vigencia: e.target.value })} />
                        </div>
                      </div>
                      <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpenBeca(false)}>Cancelar</Button>
                        <Button type="submit" disabled={!newBeca.nombre}>Guardar Beca</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
 
                <Dialog open={openArreglo} onOpenChange={setOpenArreglo}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus className="mr-1 h-3.5 w-3.5" />Nuevo Arreglo</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuevo Arreglo de Pago</DialogTitle>
                      <DialogDescription>Define cuotas para un jugador con saldo pendiente o morosidad.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddArreglo} className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="arr-categoria">Categoría / Equipo</Label>
                          <select id="arr-categoria" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground" value={newArreglo.categoria} onChange={(e) => handleArregloCategoryChange(e.target.value)}>
                            {uniqueCategories.map(cat => (
                              <option key={cat} value={cat} className="text-foreground bg-popover">{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="arr-nombre">Seleccionar Jugador</Label>
                          <select id="arr-nombre" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground" value={newArreglo.jugadorId} onChange={(e) => handleArregloPlayerChange(e.target.value)}>
                            <option value="" disabled className="text-muted-foreground bg-popover">-- Seleccione --</option>
                            {arregloFilteredPlayers.map(p => (
                              <option key={p.id} value={p.id} className="text-foreground bg-popover">{p.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="arr-deuda">Deuda Total (CRC)</Label>
                          <Input id="arr-deuda" type="number" required placeholder="Ej. 60000" value={newArreglo.deudaOriginal || ""} onChange={(e) => setNewArreglo({ ...newArreglo, deudaOriginal: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="arr-cuota">Cuota Mensual (CRC)</Label>
                          <Input id="arr-cuota" type="number" required placeholder="Ej. 10000" value={newArreglo.cuotaMensual || ""} onChange={(e) => setNewArreglo({ ...newArreglo, cuotaMensual: Number(e.target.value) })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="arr-totales">Total Cuotas</Label>
                          <Input id="arr-totales" type="number" required placeholder="Ej. 6" value={newArreglo.cuotasTotales || ""} onChange={(e) => setNewArreglo({ ...newArreglo, cuotasTotales: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="arr-pagas">Cuotas Pagas</Label>
                          <Input id="arr-pagas" type="number" required placeholder="0" value={newArreglo.cuotasPagas} onChange={(e) => setNewArreglo({ ...newArreglo, cuotasPagas: Number(e.target.value) })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="arr-sede">Sede (Auto)</Label>
                          <Input id="arr-sede" disabled className="bg-muted text-muted-foreground" value={newArreglo.sede} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="arr-estado">Estado Inicial</Label>
                          <select id="arr-estado" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-semibold" value={newArreglo.estado} onChange={(e) => setNewArreglo({ ...newArreglo, estado: e.target.value })}>
                            <option value="Al día" className="text-foreground bg-popover">Al día</option>
                            <option value="Pendiente" className="text-foreground bg-popover">Pendiente</option>
                          </select>
                        </div>
                      </div>
                      <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpenArreglo(false)}>Cancelar</Button>
                        <Button type="submit" disabled={!newArreglo.nombre}>Guardar Arreglo</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <TabsContent value="nomina" className="mt-0 space-y-6">
              <Card className="shadow-card border-border bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase font-mono font-bold text-amber-400">Nómina Centralizada en Finanzas</p>
                    <h2 className="text-lg font-extrabold text-white">Honorarios y Cierre de Nómina de Staff</h2>
                    <p className="text-xs text-slate-300">
                      Gestión de salarios, bonos por partidos dirigidos y dispersión bancaria masiva.
                    </p>
                  </div>
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
              </Card>

              <Card className="shadow-card border-border">
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
                        <th className="p-3.5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {RendimientoStore.getEntrenadores().map((coach, idx) => {
                        const tarifaSes = coach.tarifaSesion || 25;
                        const bonoPart = coach.bonoPartido || 35;
                        const symbol = (coach.moneda || "USD") === "CRC" ? "₡" : "$";
                        const cats = RendimientoStore.getCategorias().filter(c => c.entrenador === coach.nombre);
                        const catName = cats[0]?.nombre || "U9 / U13 Asoderive";

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
                            montoTotal: totalCalculado,
                            moneda: coach.moneda || "USD",
                            estado: "pagado",
                            fechaPago: new Date().toISOString().slice(0, 10),
                          };

                          RendimientoStore.aprobarNomina(record.id);
                          RendimientoStore.saveNomina(record);
                          toast.success(`🚀 Nómina aprobada y egreso registrado para ${coach.nombre}`);
                        };

                        return (
                          <tr key={coach.id} className="hover:bg-muted/30 transition">
                            <td className="p-3.5">
                              <p className="font-bold text-foreground">{coach.nombre}</p>
                              <p className="text-[10px] text-muted-foreground">{catName}</p>
                            </td>
                            <td className="p-3.5 text-center font-mono text-[11px]">
                              {symbol}{tarifaSes} / {symbol}{bonoPart}
                            </td>
                            <td className="p-3.5 text-center font-bold text-emerald-600">
                              {sesionesCount} ({symbol}{montoSesiones})
                            </td>
                            <td className="p-3.5 text-center font-bold text-indigo-600">
                              {partidosCount} ({symbol}{montoPartidos})
                            </td>
                            <td className="p-3.5 text-center">
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={ajustesMap[coach.id] || ""}
                                onChange={(e) => setAjustesMap({ ...ajustesMap, [coach.id]: parseFloat(e.target.value) || 0 })}
                                className="w-20 h-7 text-center text-xs font-mono"
                              />
                            </td>
                            <td className="p-3.5 text-right font-black text-sm font-mono text-foreground">
                              {symbol}{totalCalculado.toFixed(2)}
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button size="sm" variant="outline" onClick={handleVerRecibo} className="h-7 text-[11px] font-bold gap-1">
                                  <Receipt className="h-3.5 w-3.5 text-indigo-500" /> Recibo
                                </Button>
                                {isPagado ? (
                                  <Badge className="bg-emerald-600 text-white font-bold text-[10px] h-7 px-2.5 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
                                  </Badge>
                                ) : (
                                  <Button size="sm" onClick={handleAprobarNomina} className="h-7 text-[11px] font-bold gap-1 bg-emerald-600 hover:bg-emerald-500 text-white">
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
            </TabsContent>

            <TabsContent value="reportes-morosidad" className="mt-0 space-y-6">
              {/* Filtro por Categoría */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/40 rounded-lg border border-border">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Filtro de Reportes por Categoría / Equipo</h3>
                  <p className="text-xs text-muted-foreground">Filtra las métricas de resumen, la tabla de morosidad de equipos y los atletas consolidados en tiempo real.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="report-cat-select" className="text-xs font-semibold">Categoría Seleccionada:</Label>
                  <select
                    id="report-cat-select"
                    value={selectedCategoryReport}
                    onChange={(e) => setSelectedCategoryReport(e.target.value)}
                    className="flex h-8 w-48 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold text-foreground"
                  >
                    <option value="Todas">Todas las Categorías</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {selectedCategoryReport !== "Todas" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-border gap-1 text-emerald-600 hover:text-emerald-700"
                      onClick={() => {
                        toast.success(`Descargando reporte de morosidad para la categoría "${selectedCategoryReport}"...`);
                      }}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" /> Exportar Categoría
                    </Button>
                  )}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-destructive/5 border-destructive/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">Total Morosidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-destructive">{formatCRC(totalMorososMonto)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{morosos.length} atletas morosos</p>
                  </CardContent>
                </Card>
                <Card className="bg-warning/5 border-warning/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">Total Pendiente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-warning">{formatCRC(totalPendientesMonto)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{pendientes.length} atletas pendientes</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">Monto en Riesgo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-primary">{formatCRC(totalMorososMonto + totalPendientesMonto)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Mora + Pendiente del mes</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground uppercase font-semibold">Porcentaje de Mora</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-foreground">
                      {activePlayers.length > 0 ? ((morosos.length / activePlayers.length) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Sobre el total del roster ({activePlayers.length})</p>
                  </CardContent>
                </Card>
              </div>

              {/* Morosidad por Equipos / Categorias */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Users className="h-4.5 w-4.5 text-primary" /> Morosidad por Categorías y Equipos
                    </CardTitle>
                    <CardDescription className="text-xs">Estado de cobros y saldos vencidos por cada grupo deportivo.</CardDescription>
                  </div>
                  <Button variant="outline" size="xs" onClick={() => {
                    toast.success("Descargando reporte 'Morosidad_Por_Equipos.xlsx'...");
                  }} className="text-[10px] gap-1 border-border">
                    <Download className="h-3 w-3" /> Descargar Excel
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>Categoría / Equipo</TableHead>
                        <TableHead className="text-center">Total Atletas</TableHead>
                        <TableHead className="text-center">Atletas en Mora</TableHead>
                        <TableHead className="text-right">Mora Acumulada</TableHead>
                        <TableHead className="text-center w-40">% Morosidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportTeamReports.map((team) => (
                        <TableRow key={team.categoria}>
                          <TableCell className="font-semibold text-sm text-foreground">{team.categoria}</TableCell>
                          <TableCell className="text-center text-sm">{team.totalJugadores}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={team.morosos > 0 ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"} variant="secondary">
                              {team.morosos} morosos
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm text-destructive">{formatCRC(team.totalAdeudado)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold w-9 text-right">{team.morosidadPct.toFixed(0)}%</span>
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full rounded-full ${
                                  team.morosidadPct > 30 ? "bg-destructive" : team.morosidadPct > 10 ? "bg-warning" : "bg-success"
                                }`} style={{ width: `${team.morosidadPct}%` }} />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Consolidated Delinquent List */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <AlertTriangle className="h-4.5 w-4.5 text-destructive" /> Listado Consolidado de Atletas Morosos
                      </CardTitle>
                      <CardDescription className="text-xs">Detalle de contacto de encargados y balances vencidos de toda la academia.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Buscar por jugador o categoría..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-8 text-xs max-w-[200px]"
                      />
                      <Button variant="outline" size="xs" onClick={() => {
                        toast.success("Descargando padrón 'Atletas_Morosos_Detallado.xlsx'...");
                      }} className="text-[10px] gap-1 border-border">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Exportar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>Atleta</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Sede</TableHead>
                        <TableHead>Contacto de Encargado (Padres)</TableHead>
                        <TableHead className="text-right">Saldo Vencido</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMorosos.map((m) => {
                        const parent = encargados.find(e => e.jugadorId === m.id);
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="font-semibold text-sm text-foreground flex items-center gap-2">
                              <img src={m.avatar} alt="" className="h-7 w-7 rounded-full border border-border" />
                              {m.nombre}
                            </TableCell>
                            <TableCell><Badge variant="outline">{m.categoria}</Badge></TableCell>
                            <TableCell className="text-sm">{m.sede}</TableCell>
                            <TableCell className="text-xs space-y-0.5">
                              {parent ? (
                                <>
                                  <p className="font-medium text-foreground">{parent.parentesco}: <span className="font-semibold">{parent.nombre}</span></p>
                                  <p className="text-muted-foreground">{parent.telefono} · {parent.correo}</p>
                                </>
                              ) : (
                                <span className="text-muted-foreground italic">Sin encargado registrado</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold text-sm text-destructive">{formatCRC(m.saldo || 25000)}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="xs"
                                variant="outline"
                                className="text-[10px] h-7 gap-1 border-border hover:bg-muted"
                                onClick={() => {
                                  if (parent) {
                                    toast.success(`Recordatorio de cobro enviado a ${parent.nombre} (${parent.correo})`);
                                  } else {
                                    toast.info("Enviando aviso de pago al atleta...");
                                  }
                                }}
                              >
                                🔔 Cobrar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredMorosos.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-4 text-center text-muted-foreground text-sm">
                            No se encontraron atletas morosos con los filtros indicados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="morosos" className="mt-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Jugador</TableHead>
                      <TableHead>Sede</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {morosos.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell className="font-medium text-sm">{j.nombre}</TableCell>
                        <TableCell className="text-sm">{j.sede}</TableCell>
                        <TableCell><Badge variant="outline">{j.categoria}</Badge></TableCell>
                        <TableCell><Badge className="bg-destructive/15 text-destructive" variant="secondary">Moroso</Badge></TableCell>
                        <TableCell className="text-right font-medium text-sm">{formatCRC(j.saldo || 25000)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="pendientes" className="mt-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Jugador</TableHead>
                      <TableHead>Sede</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendientes.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell className="font-medium text-sm">{j.nombre}</TableCell>
                        <TableCell className="text-sm">{j.sede}</TableCell>
                        <TableCell><Badge variant="outline">{j.categoria}</Badge></TableCell>
                        <TableCell><Badge className="bg-warning/20 text-warning" variant="secondary">Pendiente</Badge></TableCell>
                        <TableCell className="text-right font-medium text-sm">{formatCRC(j.saldo || 25000)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="becados" className="mt-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Jugador</TableHead>
                      <TableHead>Sede</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Descuento / Beca</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Vigencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {becados.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-sm">{b.nombre}</TableCell>
                        <TableCell className="text-sm">{b.sede}</TableCell>
                        <TableCell><Badge variant="outline">{b.categoria}</Badge></TableCell>
                        <TableCell>
                          <Badge className="bg-success/15 text-success font-semibold" variant="secondary">{b.beca}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{b.tipo}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.vigencia}</TableCell>
                      </TableRow>
                    ))}
                    {becados.length === 0 && (
                      <TableRow>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground text-sm">No hay becados registrados</td>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="arreglos" className="mt-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Jugador</TableHead>
                      <TableHead>Sede</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Deuda Total</TableHead>
                      <TableHead className="text-right">Cuota Mensual</TableHead>
                      <TableHead className="text-center">Progreso de Cuotas</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arreglos.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-sm">{a.nombre}</TableCell>
                        <TableCell className="text-sm">{a.sede}</TableCell>
                        <TableCell><Badge variant="outline">{a.categoria}</Badge></TableCell>
                        <TableCell className="text-right text-sm">{formatCRC(a.deudaOriginal)}</TableCell>
                        <TableCell className="text-right font-semibold text-sm text-primary">{formatCRC(a.cuotaMensual)}</TableCell>
                        <TableCell className="text-center text-sm">
                          <span className="font-medium">{a.cuotasPagas}</span> / {a.cuotasTotales} cuotas
                          <div className="mx-auto mt-1 w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${(a.cuotasPagas / a.cuotasTotales) * 100}%` }} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={a.estado === "Al día" ? "bg-success/15 text-success" : "bg-warning/20 text-warning"} variant="secondary">
                            {a.estado}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {arreglos.length === 0 && (
                      <TableRow>
                        <td colSpan={7} className="p-4 text-center text-muted-foreground text-sm">No hay arreglos de pago activos</td>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="egresos" className="mt-4">
              <FinanzasEgresos />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recibo Honorarios Modal */}
      <ReciboHonorariosModal open={isOpenRecibo} onOpenChange={setIsOpenRecibo} data={selectedRecibo} />
    </div>
  );
}
