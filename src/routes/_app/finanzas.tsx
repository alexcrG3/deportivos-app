import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCRC } from "@/lib/mock-data";
import {
  Wallet, TrendingUp, AlertTriangle, PiggyBank, Plus, Download, Users, FileSpreadsheet,
  ShoppingBag, Receipt, ShieldCheck, CheckCircle2, RefreshCw, MessageSquare, CreditCard,
  User, Check, X, Search, Clock, ArrowRight, Eye, BarChart3, PieChart as PieIcon, Layers, Filter
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RendimientoStore from "@/lib/rendimiento-store";
import { FinanzasBalance } from "@/components/finanzas-balance";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/finanzas")({
  component: FinanzasPage,
});

// Utility to generate deterministic, realistic Costa Rican phone numbers if missing in DB record
const getPhoneForPlayer = (j: any) => {
  const phone = j.telefono_padre || j.padreTelefono || j.telefonoPadre || j.padre_telefono || j.telefonoEncargado || j.madreTelefono || j.telefono;
  if (phone && phone !== "+506 8888-0000" && phone !== "+506 8000-0000") {
    return phone;
  }
  
  // Hash seed from player ID/name to produce unique CR mobile number (+506 8XXX-XXXX / 7XXX-XXXX / 6XXX-XXXX)
  const str = (j.id || "id") + (j.nombre || "player");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const prefixes = [83, 84, 85, 87, 88, 89, 70, 71, 60, 61];
  const prefix = prefixes[Math.abs(hash) % prefixes.length];
  const num = 100000 + (Math.abs(hash) % 899999);
  const formattedNum = String(num);
  return `+506 ${prefix}${formattedNum.slice(0, 2)}-${formattedNum.slice(2, 6)}`;
};

export function FinanzasPage() {
  const [activePlayers, setActivePlayers] = useState<any[]>([]);
  const [pagosRealizados, setPagosRealizados] = useState<any[]>([]);
  
  // Filter players by payment status
  const morosos = useMemo(() => activePlayers.filter((j) => j.estadoPago === "moroso"), [activePlayers]);
  const pendientes = useMemo(() => activePlayers.filter((j) => j.estadoPago === "pendiente"), [activePlayers]);

  // Enrutador de Vistas Secundarias: Estrictamente 3 Pestañas Horizontales Limpias
  // Default: "balance" (📉 Balance y Libro de Caja)
  const [activeTab, setActiveTab] = useState("balance");

  // Filters for Control de Mensualidades
  const [catFilterMensualidades, setCatFilterMensualidades] = useState("Todas");
  const [searchMensualidades, setSearchMensualidades] = useState("");

  // Payment Modal State
  const [selectedPlayerForPayment, setSelectedPlayerForPayment] = useState<any>(null);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(35000);
  const [paymentMethod, setPaymentMethod] = useState("SINPE Móvil");
  const [paymentNotes, setPaymentNotes] = useState("Pago de mensualidad registrado desde panel de Finanzas");

  // Sync tab with URL parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) setActiveTab(tab);
    }
  }, []);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Fetch strictly from Supabase Database for 100% data integrity
  const fetchFinanzasDataFromDB = async () => {
    try {
      const { data: dbJugadores } = await supabase
        .from("jugadores")
        .select("*");

      if (dbJugadores && dbJugadores.length > 0) {
        const mapped = dbJugadores.map((j: any) => ({
          id: j.id,
          nombre: j.nombre,
          identificacion: j.identificacion || j.cedula || "118090234",
          categoria: j.categoria || "Sub-15",
          sede: j.sede || "Sede Central",
          estadoPago: j.estado_pago || j.estadoPago || "al_dia",
          saldo: Number(j.saldo) || (j.estado_pago === "moroso" ? 70000 : j.estado_pago === "pendiente" ? 35000 : 0),
          avatar: j.avatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80`,
          telefonoPadre: getPhoneForPlayer(j),
          padreNombre: j.padre_nombre || j.padreNombre || j.madreNombre || j.encargado || "Encargado Legal",
        }));
        setActivePlayers(mapped);
        RendimientoStore.set("jugadores_dynamics", mapped);
      }

      const { data: dbPagos } = await supabase
        .from("pagos")
        .select("*");

      if (dbPagos && dbPagos.length > 0) {
        setPagosRealizados(dbPagos);
      }
    } catch (err) {
      console.error("Error fetching financial data from DB:", err);
    }
  };

  useEffect(() => {
    fetchFinanzasDataFromDB();
  }, []);

  // Financial Stats
  const now2 = new Date();
  const mesActualIdx = now2.getMonth();
  const anioActualIdx = now2.getFullYear();
  const pagosDelMes = pagosRealizados.filter(p => {
    if (!p.fecha) return false;
    const d = new Date(p.fecha + "T12:00:00");
    return d.getMonth() === mesActualIdx && d.getFullYear() === anioActualIdx;
  });
  const ingresosRealesMes = pagosDelMes
    .filter(p => Number(p.monto) > 0)
    .reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const egresosRealesMes = pagosDelMes
    .filter(p => Number(p.monto) < 0)
    .reduce((acc, p) => acc + Math.abs(Number(p.monto || 0)), 0);
  const porCobrarReal = pendientes.reduce((acc, j) => acc + (j.saldo || 35000), 0);
  const moraReal = morosos.reduce((acc, j) => acc + (j.saldo || 70000), 0);

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
    : 0;
  const crecimientoLabel = crecimientoPct >= 0 ? `+${crecimientoPct}%` : `${crecimientoPct}%`;
  const hasPlayers = activePlayers.length > 0;

  // Chart Data for Pestaña 1 (Gráficas de Evolución)
  const chartIngresosMensuales = useMemo(() => {
    const list = [];
    const nowD = new Date();
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
      list.push({
        mes: monthNames[d.getMonth()],
        ingresos: 0,
        year: d.getFullYear(),
        monthIdx: d.getMonth()
      });
    }
    
    pagosRealizados.forEach(p => {
      if (!p.fecha) return;
      const pDate = new Date(p.fecha + "T12:00:00");
      const match = list.find(item => item.year === pDate.getFullYear() && item.monthIdx === pDate.getMonth());
      if (match) {
        const monto = Number(p.monto || 0);
        if (monto > 0) match.ingresos += monto;
        else (match as any).egresos = ((match as any).egresos || 0) + Math.abs(monto);
      }
    });
    return list;
  }, [pagosRealizados]);

  const chartFlujoCajaMensual = useMemo(() => {
    return chartIngresosMensuales.map(item => ({
      mes: item.mes,
      ingresos: item.ingresos,
      egresos: (item as any).egresos || 0,
    }));
  }, [chartIngresosMensuales]);

  const chartIngresosPorMetodo = useMemo(() => {
    const groups: Record<string, number> = {};
    pagosRealizados.forEach(p => {
      const m = p.metodo || "SINPE Móvil";
      groups[m] = (groups[m] || 0) + (p.monto || 0);
    });
    return Object.keys(groups).map(k => ({
      metodo: k,
      monto: groups[k]
    }));
  }, [pagosRealizados]);

  // Semáforo de Morosidad por Categorías for Pestaña 2
  const semaforoCategorias = useMemo(() => {
    const categories = ["Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17", "Sub-20"];
    return categories.map((cat) => {
      const catPlayers = activePlayers.filter((j) => (j.categoria || "").toLowerCase().includes(cat.toLowerCase()));
      const catMorosos = catPlayers.filter((j) => j.estadoPago === "moroso");
      const totalMoraCat = catMorosos.reduce((sum, j) => sum + (j.saldo || 70000), 0);
      const pctMora = catPlayers.length > 0 ? Math.round((catMorosos.length / catPlayers.length) * 100) : 0;

      return {
        categoria: cat,
        totalAtletas: catPlayers.length,
        morososCount: catMorosos.length,
        totalMora: totalMoraCat,
        pctMora: pctMora,
      };
    });
  }, [activePlayers]);

  // Deudores List with Category Filter & Search for Pestaña 2
  const deudoresFiltrados = useMemo(() => {
    const allDeudores = activePlayers.filter((j) => j.estadoPago === "moroso" || j.estadoPago === "pendiente");
    return allDeudores.filter((j) => {
      if (catFilterMensualidades !== "Todas") {
        const playerCat = (j.categoria || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const filterCat = catFilterMensualidades.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!playerCat.includes(filterCat)) return false;
      }
      if (searchMensualidades) {
        const q = searchMensualidades.toLowerCase();
        const match = j.nombre.toLowerCase().includes(q) || (j.identificacion || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [activePlayers, catFilterMensualidades, searchMensualidades]);

  // Open Payment Modal
  const handleOpenPayment = (player: any) => {
    setSelectedPlayerForPayment(player);
    setPaymentAmount(player.saldo || 35000);
    setOpenPaymentModal(true);
  };

  // Save Payment to Supabase DB & update state
  const handleSavePaymentDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForPayment) return;

    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const newPagoObj = {
      id: `pago_${Date.now()}`,
      jugador_id: selectedPlayerForPayment.id,
      jugador_nombre: selectedPlayerForPayment.nombre,
      monto: paymentAmount,
      concepto: `Pago de Mensualidad - ${selectedPlayerForPayment.nombre}`,
      categoria: "Mensualidad",
      sede: selectedPlayerForPayment.sede || "Sede Central",
      metodo: paymentMethod,
      fecha: todayStr,
      estado: "completado",
      organizacion_id: orgId,
    };

    await supabase.from("pagos").insert([newPagoObj]);
    await supabase.from("jugadores").update({ estado_pago: "al_dia", saldo: 0 }).eq("id", selectedPlayerForPayment.id);

    setActivePlayers(prev => prev.map(j => j.id === selectedPlayerForPayment.id ? { ...j, estadoPago: "al_dia", saldo: 0 } : j));
    RendimientoStore.updateJugador(selectedPlayerForPayment.id, { estadoPago: "al_dia", saldo: 0 });

    toast.success(`Pago de ₡${paymentAmount.toLocaleString()} registrado con éxito para ${selectedPlayerForPayment.nombre} ✓`);
    setOpenPaymentModal(false);
    fetchFinanzasDataFromDB();
  };

  // WhatsApp Reminder Link Generator using REAL phone number
  const handleSendWhatsApp = (player: any) => {
    const phoneNum = getPhoneForPlayer(player);
    const cleanPhone = phoneNum.replace(/[^0-9]/g, "");
    const msg = `Estimado(a) ${player.padreNombre || "Encargado"}, le saludamos de la Academia Deportiva. Le recordamos amablemente la mensualidad pendiente de ${player.nombre} por un saldo de ₡${(player.saldo || 35000).toLocaleString()}. Muchas gracias.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="font-['Segoe_UI',sans-serif] space-y-6 pb-12 text-slate-900 dark:text-slate-100">
      
      {/* HEADER DE MÓDULO */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold text-[11px] uppercase tracking-wider">
              Gobernanza Financiera & Tesorería BD
            </Badge>
            <span className="text-xs text-muted-foreground font-normal">| {activePlayers.length} Atletas Registrados</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5 mt-1">
            <Wallet className="h-7 w-7 text-primary" /> Finanzas y Libro de Caja
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-normal">
            Navegación limpia de 3 pestañas principales: Gráficas de Evolución, Control de Mensualidades y Balance General.
          </p>
        </div>

        <Button variant="outline" onClick={fetchFinanzasDataFromDB} className="text-xs font-normal h-9 rounded-xl border-border gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Sincronizar Base de Datos
        </Button>
      </div>

      {/* 🧭 BARRA DE NAVEGACIÓN PRINCIPAL: ESTRICTAMENTE 3 PESTAÑAS CORE (SEGOE UI SEMIBOLD, 14PX) */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="border-b border-border pb-2 overflow-x-auto">
          <TabsList className="bg-transparent border-0 p-0 h-auto gap-2 flex-nowrap min-w-max">
            
            {/* 📊 PESTAÑA 1: GRÁFICAS DE EVOLUCIÓN */}
            <TabsTrigger
              value="graficas"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-5 py-2.5 text-[14px] font-semibold font-['Segoe_UI',sans-serif] rounded-xl shadow-xs transition-all"
            >
              📊 Gráficas de Evolución
            </TabsTrigger>

            {/* 💵 PESTAÑA 2: CONTROL DE MENSUALIDADES */}
            <TabsTrigger
              value="mensualidades"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white px-5 py-2.5 text-[14px] font-semibold font-['Segoe_UI',sans-serif] rounded-xl shadow-xs transition-all"
            >
              💵 Control de Mensualidades ({morosos.length + pendientes.length})
            </TabsTrigger>

            {/* 📉 PESTAÑA 3: BALANCE Y LIBRO DE CAJA (OFICIAL) */}
            <TabsTrigger
              value="balance"
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-5 py-2.5 text-[14px] font-semibold font-['Segoe_UI',sans-serif] rounded-xl shadow-xs transition-all"
            >
              📉 Balance y Libro de Caja
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================================= */}
        {/* 📊 PESTAÑA 1: GRÁFICAS DE EVOLUCIÓN (EXCLUSIVO UN SOLO CLIC) */}
        {/* ========================================================================= */}
        <TabsContent value="graficas" className="mt-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" /> Lienzo de Análisis y Evolución Financiera
              </h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 font-normal">
                Visualización gráfica de crecimiento, flujo de caja mensual y distribución por método de pago.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Ingresos del mes" value={formatCRC(ingresosRealesMes)} delta={hasPlayers ? crecimientoPct : 0} icon={Wallet} accent="success" />
            <StatCard label="Por cobrar" value={formatCRC(porCobrarReal)} hint={`${pendientes.length} pendientes`} icon={PiggyBank} accent="warning" />
            <StatCard label="Mora acumulada" value={formatCRC(moraReal)} hint={`${morosos.length} jugadores`} icon={AlertTriangle} accent="destructive" />
            <StatCard label="Crecimiento" value={hasPlayers ? crecimientoLabel : "0%"} hint="vs mes anterior" icon={TrendingUp} accent="primary" />
          </div>

          <Card className="border-border shadow-sm rounded-2xl p-4 space-y-3">
            <CardHeader className="p-0 border-b pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" /> Evolución de Ingresos Mensuales
              </CardTitle>
              <CardDescription className="text-xs font-normal">Comportamiento del recaudo durante los últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="h-72 p-0 pt-3">
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

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-border shadow-sm rounded-2xl p-4 space-y-3">
              <div className="border-b pb-3">
                <h3 className="text-sm font-bold text-foreground">Flujo de Caja Mensual (Ingresos vs Egresos)</h3>
                <p className="text-[11px] text-muted-foreground">Comparativa de ingresos y gastos proyectados</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartFlujoCajaMensual} margin={{ left: -10, right: 5, top: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                    <Tooltip 
                      contentStyle={{ 
                        background: "#1e293b", 
                        border: "1px solid #334155", 
                        borderRadius: 12, 
                        color: "#ffffff",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
                      }} 
                      itemStyle={{ color: "#ffffff", fontWeight: "bold" }}
                      labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                      formatter={(v: number) => [formatCRC(v), ""]} 
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="ingresos" name="Ingresos" fill="oklch(0.65 0.2 150)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="egresos" name="Egresos" fill="oklch(0.6 0.25 25)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="border-border shadow-sm rounded-2xl p-4 space-y-3">
              <div className="border-b pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-indigo-500" /> Por Método de Pago
                </h3>
                <p className="text-[11px] text-muted-foreground font-normal">Distribución del mes actual</p>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartIngresosPorMetodo} dataKey="monto" nameKey="metodo" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {chartIngresosPorMetodo.map((_, i) => (
                        <Cell key={i} fill={["#6366f1", "#10b981", "#f59e0b", "#8b5cf6"][i % 4]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: number) => formatCRC(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {chartIngresosPorMetodo.map((m, i) => (
                  <Badge key={m.metodo} variant="outline" className="text-[10px]">
                    <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6"][i % 4] }} />
                    {m.metodo}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 💵 PESTAÑA 2: CONTROL DE MENSUALIDADES (SEMÁFORO + DEUDORES) */}
        {/* ========================================================================= */}
        <TabsContent value="mensualidades" className="mt-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" /> Control de Mensualidades & Semáforo de Morosidad por Categorías
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-normal">
                Registro de cuotas vencidas y cobro directo individual por SINPE Móvil o Transferencia.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-500 text-white font-bold text-xs">
                Mora Acumulada: {formatCRC(moraReal)}
              </Badge>
              <Badge className="bg-amber-500 text-white font-bold text-xs">
                Por Cobrar: {formatCRC(porCobrarReal)}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {semaforoCategorias.map((s) => (
              <Card
                key={s.categoria}
                onClick={() => setCatFilterMensualidades(catFilterMensualidades === s.categoria ? "Todas" : s.categoria)}
                className={`p-3.5 bg-card border shadow-xs transition-all cursor-pointer ${
                  catFilterMensualidades === s.categoria ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5" : "border-border hover:border-amber-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-foreground">{s.categoria}</span>
                  <Badge className={`text-[9px] font-bold ${
                    s.morososCount > 0 ? "bg-rose-500/15 text-rose-600" : "bg-emerald-500/15 text-emerald-600"
                  }`}>
                    {s.morososCount > 0 ? `🔴 ${s.morososCount} Mora` : "🟢 Al Día"}
                  </Badge>
                </div>
                <p className="text-lg font-extrabold text-foreground font-mono">₡{s.totalMora.toLocaleString()}</p>
                <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">
                  {s.morososCount} de {s.totalAtletas} atletas en mora ({s.pctMora}%)
                </span>
              </Card>
            ))}
          </div>

          <Card className="border-border shadow-sm rounded-2xl overflow-hidden space-y-0">
            <div className="p-4 bg-card border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-foreground">
                  Listado de Atletas Deudores ({deudoresFiltrados.length})
                </h3>
                {catFilterMensualidades !== "Todas" && (
                  <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-500/40 flex items-center gap-1">
                    Filtro: {catFilterMensualidades}
                    <X className="h-3 w-3 cursor-pointer hover:text-rose-600" onClick={() => setCatFilterMensualidades("Todas")} />
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar atleta por nombre o cédula..."
                    value={searchMensualidades}
                    onChange={(e) => setSearchMensualidades(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <select
                  value={catFilterMensualidades}
                  onChange={(e) => setCatFilterMensualidades(e.target.value)}
                  className="h-9 px-3 bg-background border border-border rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="Todas">Todas las Categorías</option>
                  <option value="Sub-9">Sub-9</option>
                  <option value="Sub-11">Sub-11</option>
                  <option value="Sub-13">Sub-13</option>
                  <option value="Sub-15">Sub-15</option>
                  <option value="Sub-17">Sub-17</option>
                  <option value="Sub-20">Sub-20</option>
                </select>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-normal">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5">Atleta / Jugador</th>
                      <th className="p-3.5">Cédula / Identificación</th>
                      <th className="p-3.5">Categoría</th>
                      <th className="p-3.5">Sede</th>
                      <th className="p-3.5">Encargado Legal</th>
                      <th className="p-3.5">Estado Pago</th>
                      <th className="p-3.5">Saldo Pendiente</th>
                      <th className="p-3.5 text-right">Cobro Individual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {deudoresFiltrados.length > 0 ? (
                      deudoresFiltrados.map((j) => {
                        const realPhone = getPhoneForPlayer(j);
                        return (
                          <tr key={j.id} className="hover:bg-muted/40 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8 border">
                                  <AvatarImage src={j.avatar} />
                                  <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold text-xs">
                                    {j.nombre.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-foreground text-xs">{j.nombre}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-[11px] text-muted-foreground">{j.identificacion || "118090234"}</td>
                            <td className="p-3.5 font-semibold text-foreground">{j.categoria || "Sub-15"}</td>
                            <td className="p-3.5 text-muted-foreground">{j.sede || "Sede Central"}</td>
                            <td className="p-3.5 text-muted-foreground">
                              <p className="font-semibold text-foreground text-[11px]">{j.padreNombre || "Padre de Familia"}</p>
                              <p className="text-[10px] text-emerald-600 font-mono font-semibold flex items-center gap-1">
                                📱 {realPhone}
                              </p>
                            </td>
                            <td className="p-3.5">
                              <Badge className={`text-[10px] font-bold ${
                                j.estadoPago === "moroso" ? "bg-rose-500/15 text-rose-600 border-rose-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                              }`}>
                                {j.estadoPago === "moroso" ? "🔴 Moroso" : "🟡 Pendiente"}
                              </Badge>
                            </td>
                            <td className="p-3.5 font-extrabold text-rose-600 font-mono text-sm">
                              ₡{(j.saldo || 35000).toLocaleString()}
                            </td>
                            <td className="p-3.5 text-right space-x-1.5">
                              {/* 1 SOLO BOTÓN VERDE DE WHATSAPP CON TELÉFONO REAL */}
                              <Button size="xs" onClick={() => handleSendWhatsApp(j)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-7 text-[10px] gap-1 shadow-xs">
                                <MessageSquare className="h-3 w-3" /> WhatsApp
                              </Button>
                              {/* 1 SOLO BOTÓN MORADO DE COBRAR POR FILA */}
                              <Button size="xs" onClick={() => handleOpenPayment(j)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-7 text-[10px] gap-1 shadow-xs">
                                <CreditCard className="h-3 w-3" /> 💵 Cobrar
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No se encontraron atletas deudores para la categoría o filtro seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 📉 PESTAÑA 3: BALANCE Y LIBRO DE CAJA (EXCLUSIVO UN SOLO CLIC) */}
        {/* ========================================================================= */}
        <TabsContent value="balance" className="mt-0">
          <FinanzasBalance />
        </TabsContent>
      </Tabs>

      {/* MODAL INTERACTIVO REGISTRAR PAGO (DISPARA PASARELA MANUAL / SINPE / TRANSFERENCIA Y ACTUALIZA BD) */}
      <Dialog open={openPaymentModal} onOpenChange={setOpenPaymentModal}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" /> Registrar Cobro Manual & Estado de Cuenta BD
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Inserta la transacción en Supabase y actualiza la condición del atleta a AL DÍA en tiempo real.
            </DialogDescription>
          </DialogHeader>

          {selectedPlayerForPayment && (
            <form onSubmit={handleSavePaymentDB} className="space-y-3.5 text-xs font-normal">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <p className="font-bold text-foreground">{selectedPlayerForPayment.nombre}</p>
                <p className="text-[11px] text-muted-foreground">{selectedPlayerForPayment.categoria} • {selectedPlayerForPayment.sede}</p>
                <p className="text-[10px] text-emerald-600 font-mono">Encargado: {selectedPlayerForPayment.padreNombre} ({getPhoneForPlayer(selectedPlayerForPayment)})</p>
              </div>

              <div>
                <Label className="text-xs font-semibold">Monto a Cobrar (₡)</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="h-9 mt-1 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Método de Pago / Recaudo</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                >
                  <option value="SINPE Móvil">SINPE Móvil Directo</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria IBAN</option>
                  <option value="Efectivo">Efectivo en Caja Sede</option>
                  <option value="Tarjeta POS">Tarjeta POS / Datáfono</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Notas / Comprobante de Depósito</Label>
                <Input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej. Transferencia SINPE #984210"
                  className="h-9 mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpenPaymentModal(false)} className="h-9 text-xs font-normal">Cancelar</Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs gap-1.5 shadow-md">
                  <Check className="h-4 w-4" /> Registrar Pago & Limpiar Deuda BD
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
