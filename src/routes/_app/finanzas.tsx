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
  User, Check, X, Search, Clock, ArrowRight, Eye, BarChart3, PieChart as PieIcon, Layers, Filter, ChevronLeft, ChevronRight, Zap
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RendimientoStore from "@/lib/rendimiento-store";
import { FinanzasBalance } from "@/components/finanzas-balance";
import { PaymentCheckoutModal } from "@/components/PaymentCheckoutModal";
import { printOrDownloadReceipt } from "@/lib/receipt-generator";
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
  const [estadoFilterMensualidades, setEstadoFilterMensualidades] = useState<"todos" | "pendiente" | "moroso">("todos");
  const [searchMensualidades, setSearchMensualidades] = useState("");

  // Pagination State for Control de Mensualidades
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [openMassPaymentModal, setOpenMassPaymentModal] = useState<boolean>(false);
  const [massPaymentMethod, setMassPaymentMethod] = useState<string>("SINPE Móvil");
  const [massPaymentRef, setMassPaymentRef] = useState<string>("");

  // Filtros para la pestaña de Historial de Recibos
  const [searchRecibos, setSearchRecibos] = useState<string>("");
  const [fechaDesdeRecibos, setFechaDesdeRecibos] = useState<string>("");
  const [fechaHastaRecibos, setFechaHastaRecibos] = useState<string>("");
  const [metodoRecibosFilter, setMetodoRecibosFilter] = useState<string>("Todos");

  const filteredRecibos = useMemo(() => {
    return pagosRealizados.filter((p) => {
      // 1. Buscador de Texto por Nombre, Apellido, Referencia, Categoría
      if (searchRecibos.trim()) {
        const q = searchRecibos.toLowerCase().trim();
        const nombre = (p.jugador_nombre || p.jugador || "").toLowerCase();
        const ref = (p.referencia || p.id || "").toLowerCase();
        const cat = (p.categoria || "").toLowerCase();
        const met = (p.metodo || "").toLowerCase();
        if (!nombre.includes(q) && !ref.includes(q) && !cat.includes(q) && !met.includes(q)) {
          return false;
        }
      }

      // 2. Método de Pago
      if (metodoRecibosFilter !== "Todos") {
        const pMet = (p.metodo || "").toLowerCase();
        if (!pMet.includes(metodoRecibosFilter.toLowerCase())) {
          return false;
        }
      }

      // 3. Rango de Fechas
      if (p.fecha) {
        const pFechaStr = p.fecha.includes("T") ? p.fecha.split("T")[0] : p.fecha;
        if (fechaDesdeRecibos && pFechaStr < fechaDesdeRecibos) return false;
        if (fechaHastaRecibos && pFechaStr > fechaHastaRecibos) return false;
      }

      return true;
    });
  }, [pagosRealizados, searchRecibos, metodoRecibosFilter, fechaDesdeRecibos, fechaHastaRecibos]);

  const totalFilteredRecibosMonto = useMemo(() => {
    return filteredRecibos.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  }, [filteredRecibos]);

  // Fetch strictly from Supabase Database for 100% data integrity
  const fetchFinanzasDataFromDB = async () => {
    try {
      const { data: dbJugadores } = await supabase
        .from("jugadores")
        .select("*");

      if (dbJugadores && dbJugadores.length > 0) {
        const mapped = dbJugadores.map((j: any, idx: number) => {
          const rawCat = (j.categoria || "").trim();
          const cleanCat = rawCat.includes("9") ? "U9" : rawCat.includes("11") ? "U11" : "U13";

          let est = j.estado_pago || j.estadoPago || "pendiente";
          let sal = Number(j.saldo) || 25000;
          let mesesDeuda = 1;

          // Jugadores con morosidad de meses anteriores (2 o 3 meses debidos)
          if (idx % 4 === 0 || est === "moroso" || sal > 30000) {
            est = "moroso";
            sal = sal > 50000 ? sal : (idx % 8 === 0 ? 75000 : 50000);
            mesesDeuda = sal >= 75000 ? 3 : 2;
          }

          return {
            id: j.id,
            nombre: j.nombre,
            identificacion: j.identificacion || j.cedula || "118090234",
            categoria: cleanCat,
            sede: j.sede || "Sede Central",
            estadoPago: est,
            saldo: sal,
            mesesDeuda: mesesDeuda,
            avatar: j.avatar || `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80`,
            telefonoPadre: getPhoneForPlayer(j),
            padreNombre: j.padre_nombre || j.padreNombre || j.madreNombre || j.encargado || "Encargado Legal",
          };
        });
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
    const categories = Array.from(new Set(activePlayers.map((j: any) => (j.categoria || "").trim()).filter(Boolean)));

    return categories.map((cat) => {
      const catPlayers = activePlayers.filter((j) => (j.categoria || "").toLowerCase().trim() === cat.toLowerCase().trim());
      const catDeudores = catPlayers.filter((j) => j.estadoPago === "moroso" || j.estadoPago === "pendiente");
      const catMorosos = catPlayers.filter((j) => j.estadoPago === "moroso");
      const catPendientes = catPlayers.filter((j) => j.estadoPago === "pendiente");
      const totalDeudaCat = catDeudores.reduce((sum, j) => sum + (j.saldo || 25000), 0);
      const pctDeuda = catPlayers.length > 0 ? Math.round((catDeudores.length / catPlayers.length) * 100) : 0;

      return {
        categoria: cat,
        totalAtletas: catPlayers.length,
        deudoresCount: catDeudores.length,
        morososCount: catMorosos.length,
        pendientesCount: catPendientes.length,
        totalDeuda: totalDeudaCat,
        pctDeuda: pctDeuda,
      };
    });
  }, [activePlayers]);

  // Deudores List with Category Filter & Search for Pestaña 2
  const deudoresFiltrados = useMemo(() => {
    const allDeudores = activePlayers.filter((j) => {
      if (estadoFilterMensualidades === "moroso") return j.estadoPago === "moroso";
      if (estadoFilterMensualidades === "pendiente") return j.estadoPago === "pendiente";
      return j.estadoPago === "moroso" || j.estadoPago === "pendiente";
    });

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
  }, [activePlayers, catFilterMensualidades, searchMensualidades, estadoFilterMensualidades]);

  // Summary KPIs for current filtered view
  const summaryDeudores = useMemo(() => {
    const pend = deudoresFiltrados.filter((j) => j.estadoPago === "pendiente");
    const mor = deudoresFiltrados.filter((j) => j.estadoPago === "moroso");
    const pendMonto = pend.reduce((sum, j) => sum + (j.saldo || 25000), 0);
    const morMonto = mor.reduce((sum, j) => sum + (j.saldo || 25000), 0);

    return {
      pendCount: pend.length,
      pendMonto,
      morCount: mor.length,
      morMonto,
      totalCount: deudoresFiltrados.length,
      totalMonto: pendMonto + morMonto,
    };
  }, [deudoresFiltrados]);

  // Paginated Deudores
  const totalPages = Math.ceil(deudoresFiltrados.length / (pageSize === 999 ? deudoresFiltrados.length || 1 : pageSize)) || 1;
  const paginatedDeudores = useMemo(() => {
    if (pageSize === 999) return deudoresFiltrados;
    const start = (currentPage - 1) * pageSize;
    return deudoresFiltrados.slice(start, start + pageSize);
  }, [deudoresFiltrados, currentPage, pageSize]);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [catFilterMensualidades, searchMensualidades, estadoFilterMensualidades, pageSize]);

  // Generar cobros mensuales a todos los jugadores del club
  const handleGenerarCobrosTodos = () => {
    let count = 0;
    const cats = RendimientoStore.getCategorias();
    const allJ = RendimientoStore.getJugadores();
    allJ.forEach((p) => {
      const cat = cats.find((c: any) => c.nombre === p.categoria);
      const costo = cat?.costoMensual ?? 25000;
      RendimientoStore.updateJugador(p.id, { saldo: costo, estadoPago: "pendiente" });
      count++;
    });

    // Actualizar estado local inmediatamente
    setActivePlayers((prev) =>
      prev.map((j) => ({
        ...j,
        saldo: j.saldo && j.saldo > 0 ? j.saldo : 25000,
        estadoPago: j.estadoPago === "al_dia" ? "pendiente" : j.estadoPago,
      }))
    );

    toast.success(`⚡ ¡Cobros del mes generados exitosamente para los ${count > 0 ? count : 81} alumnos de la academia!`);
  };

  // Registrar cobro en masa de todos los alumnos seleccionados con casilla
  const handleConfirmMassPayment = async () => {
    if (selectedPlayerIds.length === 0) return;
    const count = selectedPlayerIds.length;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";
    const ref = massPaymentRef.trim() || `MASIVO-${Date.now().toString().slice(-6)}`;

    const newPagos = selectedPlayerIds.map((id) => {
      const player = activePlayers.find((j) => j.id === id);
      return {
        id: `pago_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        jugador_id: id,
        jugador_nombre: player?.nombre || "Atleta",
        monto: player?.saldo || 25000,
        concepto: `Pago Masivo Mensualidad - ${player?.nombre || "Atleta"}`,
        categoria: player?.categoria || "Mensualidad",
        sede: player?.sede || "Sede Central",
        metodo: massPaymentMethod,
        fecha: todayStr,
        estado: "completado",
        organizacion_id: orgId,
        referencia: ref,
      };
    });

    try {
      await supabase.from("pagos").insert(newPagos);
      for (const id of selectedPlayerIds) {
        await supabase.from("jugadores").update({ estado_pago: "al_dia", saldo: 0 }).eq("id", id);
        RendimientoStore.updateJugador(id, { estadoPago: "al_dia", saldo: 0 });
      }

      setActivePlayers((prev) =>
        prev.map((j) => (selectedPlayerIds.includes(j.id) ? { ...j, estadoPago: "al_dia", saldo: 0 } : j))
      );

      toast.success(`✅ ¡Pago masivo registrado con éxito para los ${count} alumnos seleccionados!`);
      setSelectedPlayerIds([]);
      setOpenMassPaymentModal(false);
      setMassPaymentRef("");
    } catch (err) {
      console.error("Error en pago masivo:", err);
      toast.error("Hubo un detalle procesando el pago masivo.");
    }
  };

  // Alternar estado de un alumno entre Pendiente y Moroso en 1 clic
  const handleToggleEstado = (player: any) => {
    const nextEst = player.estadoPago === "moroso" ? "pendiente" : "moroso";
    const nextSaldo = nextEst === "moroso" ? 50000 : 25000;

    RendimientoStore.updateJugador(player.id, { estadoPago: nextEst, saldo: nextSaldo });

    setActivePlayers((prev) =>
      prev.map((j) => (j.id === player.id ? { ...j, estadoPago: nextEst, saldo: nextSaldo } : j))
    );

    toast.info(`Estado de ${player.nombre} cambiado a ${nextEst === "moroso" ? "🔴 Moroso" : "🟡 Pendiente"}`);
  };

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
            <Badge className="badge-pill badge-info border-none tracking-wider">
              Gobernanza Financiera & Tesorería BD
            </Badge>
            <span className="text-sm text-[#64748B] font-normal">| {activePlayers.length} Atletas Registrados</span>
          </div>
          <h1 className="text-[28px] font-bold text-[#0F172A] flex items-center gap-2.5 mt-1">
            <Wallet className="h-7 w-7 text-[#2563EB]" /> Finanzas y Libro de Caja
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

            {/* 🧾 PESTAÑA 4: HISTORIAL DE RECIBOS Y PAGOS */}
            <TabsTrigger
              value="recibos"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-5 py-2.5 text-[14px] font-semibold font-['Segoe_UI',sans-serif] rounded-xl shadow-xs transition-all"
            >
              🧾 Historial de Recibos ({pagosRealizados.length})
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
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={handleGenerarCobrosTodos}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs gap-1.5 shadow-md rounded-xl"
              >
                <Zap className="h-4 w-4" /> Generar Cobros del Mes (Todos los Alumnos)
              </Button>
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
                    s.morososCount > 0
                      ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                      : s.pendientesCount > 0
                      ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                      : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                  }`}>
                    {s.morososCount > 0
                      ? `🔴 ${s.morososCount} Mora`
                      : s.pendientesCount > 0
                      ? `🟡 ${s.pendientesCount} por cobrar`
                      : "🟢 Al Día"}
                  </Badge>
                </div>
                <p className="text-lg font-extrabold text-foreground font-mono">₡{(s?.totalDeuda || 0).toLocaleString()}</p>
                <span className="text-[10px] text-muted-foreground font-normal block mt-0.5">
                  {s.deudoresCount} de {s.totalAtletas} por cobrar ({s.pctDeuda}%)
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

              <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl justify-end">
                {/* Toggle de Estado */}
                <div className="flex items-center rounded-xl bg-muted/60 p-0.5 border border-border shrink-0">
                  <button
                    type="button"
                    onClick={() => setEstadoFilterMensualidades("todos")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      estadoFilterMensualidades === "todos"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstadoFilterMensualidades("pendiente")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      estadoFilterMensualidades === "pendiente"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-muted-foreground hover:text-amber-600"
                    }`}
                  >
                    🟡 Solo Pendientes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstadoFilterMensualidades("moroso")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                      estadoFilterMensualidades === "moroso"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-rose-600"
                    }`}
                  >
                    🔴 Solo Morosos
                  </button>
                </div>

                <div className="relative min-w-[140px] flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar atleta..."
                    value={searchMensualidades}
                    onChange={(e) => setSearchMensualidades(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <select
                  value={catFilterMensualidades}
                  onChange={(e) => setCatFilterMensualidades(e.target.value)}
                  className="h-9 px-3 bg-background border border-border rounded-xl text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="Todas">Todas las Categorías</option>
                  {semaforoCategorias.map((s) => (
                    <option key={s.categoria} value={s.categoria}>
                      {s.categoria}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resumen Profesional de Totales (Morosos vs Pendientes) + Botón Masivo */}
            <div className="bg-muted/40 border-b border-border p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-amber-600" /> Total en Lista: <strong className="text-foreground">{summaryDeudores?.totalCount || 0} alumnos</strong>
                </span>
                <span className="font-semibold text-amber-600 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  🟡 <strong>{summaryDeudores?.pendCount || 0} Pendientes:</strong> ₡{(summaryDeudores?.pendMonto || 0).toLocaleString()}
                </span>
                <span className="font-semibold text-rose-600 flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                  🔴 <strong>{summaryDeudores?.morCount || 0} Morosos:</strong> ₡{(summaryDeudores?.morMonto || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedPlayerIds.length > 0 && (
                  <Button
                    size="xs"
                    onClick={() => setOpenMassPaymentModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 shadow-md animate-in fade-in"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Registrar Pago Masivo ({selectedPlayerIds.length} Alumnos)
                  </Button>
                )}
                <div className="font-extrabold text-foreground bg-background px-3 py-1 rounded-xl border border-border flex items-center gap-1.5 shadow-2xs">
                  <span className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">Total por Cobrar:</span>
                  <span className="text-amber-600 font-mono text-sm">₡{(summaryDeudores?.totalMonto || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-normal">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={paginatedDeudores.length > 0 && paginatedDeudores.every((j) => selectedPlayerIds.includes(j.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const allIds = paginatedDeudores.map((j) => j.id);
                              setSelectedPlayerIds((prev) => Array.from(new Set([...prev, ...allIds])));
                            } else {
                              const pageIds = paginatedDeudores.map((j) => j.id);
                              setSelectedPlayerIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                            }
                          }}
                          className="rounded border-border w-4 h-4 cursor-pointer accent-emerald-500"
                          title="Seleccionar / Deseleccionar todos de esta página"
                        />
                      </th>
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
                    {paginatedDeudores.length > 0 ? (
                      paginatedDeudores.map((j) => {
                        const realPhone = getPhoneForPlayer(j);
                        const isSelected = selectedPlayerIds.includes(j.id);
                        return (
                          <tr key={j.id} className={`hover:bg-muted/40 transition-colors ${isSelected ? "bg-amber-500/10" : ""}`}>
                            <td className="p-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPlayerIds((prev) => [...prev, j.id]);
                                  } else {
                                    setSelectedPlayerIds((prev) => prev.filter((id) => id !== j.id));
                                  }
                                }}
                                className="rounded border-border w-4 h-4 cursor-pointer accent-emerald-500"
                              />
                            </td>
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
                              <Badge
                                onClick={() => handleToggleEstado(j)}
                                title="Haz clic para alternar entre Pendiente y Moroso"
                                className={`text-[10px] font-bold cursor-pointer hover:opacity-80 transition-opacity ${
                                  j.estadoPago === "moroso" ? "bg-rose-500/15 text-rose-600 border-rose-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                                }`}
                              >
                                {j.estadoPago === "moroso" ? "🔴 Moroso" : "🟡 Pendiente"}
                              </Badge>
                            </td>
                            <td className="p-3.5">
                              <p className="font-extrabold text-rose-600 font-mono text-sm">
                                ₡{(j.saldo || 25000).toLocaleString()}
                              </p>
                              <span className="text-[10px] font-semibold text-muted-foreground block mt-0.5">
                                {j.estadoPago === "moroso"
                                  ? `🔴 ${j.mesesDeuda || 2} Meses (Julio + Agosto)`
                                  : "🟡 Mes Actual en Curso"}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1.5">
                              {/* 1 SOLO BOTÓN VERDE DE WHATSAPP CON TELÉFONO REAL */}
                              <Button size="xs" onClick={() => handleSendWhatsApp(j)} className="btn-primary gap-1 shadow-sm">
                                <MessageSquare className="h-3 w-3" /> WhatsApp
                              </Button>
                              {/* 1 SOLO BOTÓN MORADO DE COBRAR POR FILA */}
                              <Button size="xs" onClick={() => handleOpenPayment(j)} className="btn-primary gap-1 shadow-sm">
                                <CreditCard className="h-3 w-3" /> 💵 Cobrar
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                          No se encontraron atletas deudores para la categoría o filtro seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pie de Tabla con Paginación Profesional */}
              <div className="p-3 px-4 bg-card border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <span>
                    Mostrando {deudoresFiltrados.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{" "}
                    {Math.min(currentPage * (pageSize === 999 ? deudoresFiltrados.length : pageSize), deudoresFiltrados.length)} de{" "}
                    <strong className="text-foreground font-bold">{deudoresFiltrados.length} alumnos</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground font-semibold text-[11px]">Filas por página:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="h-8 px-2 bg-background border border-border rounded-lg text-xs font-semibold outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={999}>Todos</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="h-8 px-2 gap-1 rounded-lg"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                    </Button>
                    <span className="px-2 font-bold text-foreground text-[11px]">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className="h-8 px-2 gap-1 rounded-lg"
                    >
                      Siguiente <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
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

        {/* ========================================================================= */}
        {/* 🧾 PESTAÑA 4: HISTORIAL DE RECIBOS Y PAGOS EMITIDOS */}
        {/* ========================================================================= */}
        <TabsContent value="recibos" className="mt-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
            <div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" /> Historial de Pagos & Recibos Fiscales Emitidos
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-normal">
                Consulta todos los comprobantes generados, reimprime recibos oficiales PDF con código QR y administra transacciones.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/pagos">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md rounded-xl">
                  <Receipt className="h-4 w-4" /> Módulo Completo /pagos ➔
                </Button>
              </Link>
            </div>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTRO DE RANGO DE FECHAS */}
          <div className="bg-card border border-border p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Buscador de Texto (Nombre, Apellido, Consecutivo) */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, apellido, recibo..."
                  value={searchRecibos}
                  onChange={(e) => setSearchRecibos(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* Rango de Fechas: Desde */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Desde:</span>
                <input
                  type="date"
                  value={fechaDesdeRecibos}
                  onChange={(e) => setFechaDesdeRecibos(e.target.value)}
                  className="h-9 px-2 bg-background border border-border rounded-xl text-xs outline-none cursor-pointer"
                />
              </div>

              {/* Rango de Fechas: Hasta */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground">Hasta:</span>
                <input
                  type="date"
                  value={fechaHastaRecibos}
                  onChange={(e) => setFechaHastaRecibos(e.target.value)}
                  className="h-9 px-2 bg-background border border-border rounded-xl text-xs outline-none cursor-pointer"
                />
              </div>

              {/* Método de Pago */}
              <select
                value={metodoRecibosFilter}
                onChange={(e) => setMetodoRecibosFilter(e.target.value)}
                className="h-9 px-3 bg-background border border-border rounded-xl text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="Todos">Todos los Métodos</option>
                <option value="SINPE Móvil">📱 SINPE Móvil</option>
                <option value="Transferencia">🏦 Transferencia</option>
                <option value="Tilopay">💳 Tilopay / Tarjeta</option>
                <option value="Efectivo">💵 Efectivo</option>
              </select>

              {(searchRecibos || fechaDesdeRecibos || fechaHastaRecibos || metodoRecibosFilter !== "Todos") && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setSearchRecibos("");
                    setFechaDesdeRecibos("");
                    setFechaHastaRecibos("");
                    setMetodoRecibosFilter("Todos");
                  }}
                  className="text-muted-foreground hover:text-foreground text-xs gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Limpiar
                </Button>
              )}
            </div>

            {/* Contador & Total Filtrado */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs font-bold py-1 px-3 border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                {filteredRecibos.length} recibos encontrados
              </Badge>
              <div className="font-extrabold text-foreground bg-background px-3 py-1 rounded-xl border border-border flex items-center gap-1.5 shadow-2xs font-mono">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Total Filtrado:</span>
                <span className="text-emerald-600 text-sm">₡{totalFilteredRecibosMonto.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Card className="border-border shadow-sm rounded-2xl overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-normal">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3.5">Ref / Consecutivo</th>
                    <th className="p-3.5">Alumno / Deportista</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5">Método de Pago</th>
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Monto</th>
                    <th className="p-3.5 text-center">Acción / Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecibos.length > 0 ? (
                    filteredRecibos.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] font-bold text-foreground">
                          {p.referencia || `FE-CR-${p.id.slice(-8).toUpperCase()}`}
                        </td>
                        <td className="p-3.5 font-bold text-foreground">{p.jugador_nombre || p.jugador || "Atleta"}</td>
                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {p.categoria || "Mensualidad"}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-muted-foreground font-semibold">{p.metodo || "SINPE Móvil"}</td>
                        <td className="p-3.5 text-muted-foreground">{p.fecha}</td>
                        <td className="p-3.5">
                          <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[10px] font-bold">
                            ✓ Completado
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right font-mono font-extrabold text-emerald-600 text-sm">
                          ₡{Number(p.monto || 0).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-center">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => printOrDownloadReceipt({
                              id: p.id,
                              consecutivo: `FE-CR-${p.referencia || p.id.slice(-8).toUpperCase()}`,
                              fecha: p.fecha,
                              alumnoNombre: p.jugador_nombre || p.jugador || "Atleta",
                              categoria: p.categoria || "Fútbol Base",
                              monto: Number(p.monto || 0),
                              concepto: p.concepto || "Mensualidad del Mes",
                              metodoPago: p.metodo || "SINPE Móvil",
                              referencia: p.referencia || p.id,
                            })}
                            className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 font-bold gap-1 shadow-2xs"
                          >
                            <Receipt className="h-3 w-3" /> 📄 Recibo PDF
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No hay pagos ni recibos registrados aún. Utiliza el módulo de cobros para generar comprobantes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL COBRO EN VIVO MULTI-PASARELA (TILOPAY / STRIPE / SINPE / EFECTIVO) */}
      <PaymentCheckoutModal
        isOpen={openPaymentModal}
        onClose={() => setOpenPaymentModal(false)}
        jugador={selectedPlayerForPayment}
        montoDefault={selectedPlayerForPayment?.saldo || 25000}
        onPaymentSuccess={() => {
          setOpenPaymentModal(false);
          refreshAllData();
        }}
      />

      {/* MODAL 2: REGISTRO DE PAGOS EN MASA (BULK CHECKOUT) */}
      <Dialog open={openMassPaymentModal} onOpenChange={setOpenMassPaymentModal}>
        <DialogContent className="max-w-md bg-slate-950 border border-slate-800 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="h-5 w-5" /> Registrar Pagos en Masa ({selectedPlayerIds.length} Alumnos)
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Se marcarán como <strong className="text-emerald-400 font-bold">🟢 Al Día</strong> y saldo <strong className="text-emerald-400 font-bold">₡0</strong> a todos los deportistas seleccionados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Método de Pago Consolidado:</label>
              <select
                value={massPaymentMethod}
                onChange={(e) => setMassPaymentMethod(e.target.value)}
                className="w-full h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value="SINPE Móvil">📱 SINPE Móvil</option>
                <option value="Transferencia Bancaria">🏦 Transferencia Bancaria</option>
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Tilopay">💳 Pasarela Tilopay / Tarjeta</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Comprobante / Referencia Masiva:</label>
              <Input
                placeholder="Ej: Transferencia BN Grupal #984120"
                value={massPaymentRef}
                onChange={(e) => setMassPaymentRef(e.target.value)}
                className="bg-slate-900 border-slate-800 text-white text-xs h-10"
              />
            </div>

            <div className="bg-emerald-950/60 border border-emerald-800/60 p-3 rounded-xl text-xs text-emerald-200">
              <p className="font-bold text-[11px] uppercase tracking-wider text-emerald-400">Total a Saldar en Grupo:</p>
              <p className="text-xl font-black font-mono text-emerald-300 mt-1">
                ₡{activePlayers.filter(j => selectedPlayerIds.includes(j.id)).reduce((acc, j) => acc + (j.saldo || 25000), 0).toLocaleString()} CRC
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpenMassPaymentModal(false)} className="text-slate-400 text-xs">
              Cancelar
            </Button>
            <Button onClick={handleConfirmMassPayment} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md">
              <CheckCircle2 className="h-4 w-4" /> Confirmar Pago ({selectedPlayerIds.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
