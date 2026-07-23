import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  RefreshCw,
  Building2,
  PieChart as PieIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  Download
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RendimientoStore, { StoreEgreso, MONEDAS_LATAM } from "@/lib/rendimiento-store";
import { formatCRC } from "@/lib/mock-data";
import { toast } from "sonner";

interface MovimientoFinanciero {
  id: string;
  tipo: "Entrada" | "Salida";
  fecha: string;
  concepto: string;
  categoria: string;
  sede: string;
  metodo: string;
  monto: number;
  entidad?: string; // Nombre del jugador o proveedor
}

export function FinanzasBalance() {
  // Date Range States (Default to current month)
  const now = new Date();
  const firstDayStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];

  const [modoFecha, setModoFecha] = useState<"rango" | "mes_anio">("rango");
  const [fechaDesde, setFechaDesde] = useState(firstDayStr);
  const [fechaHasta, setFechaHasta] = useState(todayStr);
  const [mesFilter, setMesFilter] = useState<string>("7"); // Julio (0-indexed 6 is July, or current month index)
  const [anioFilter, setAnioFilter] = useState<string>("2026");

  const [sedeFilter, setSedeFilter] = useState("Todas");
  const [categoriaFilter, setCategoriaFilter] = useState("Todas");
  const [modoPagoFilter, setModoPagoFilter] = useState("Todos");
  const [monedaVisualFilter, setMonedaVisualFilter] = useState("CRC");
  const [tipoFilter, setTipoFilter] = useState<"Todos" | "Entrada" | "Salida">("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Retrieve raw data
  const pagos = RendimientoStore.getPagos();
  const egresos = RendimientoStore.getEgresos();

  // Presets
  const applyPreset = (preset: "este_mes" | "mes_anterior" | "trimestre" | "anio" | "todo") => {
    const d = new Date();
    setModoFecha("rango");
    if (preset === "este_mes") {
      setFechaDesde(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0]);
      setFechaHasta(new Date().toISOString().split("T")[0]);
    } else if (preset === "mes_anterior") {
      const prevMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(d.getFullYear(), d.getMonth(), 0);
      setFechaDesde(prevMonth.toISOString().split("T")[0]);
      setFechaHasta(lastDayPrevMonth.toISOString().split("T")[0]);
    } else if (preset === "trimestre") {
      const threeMonthsAgo = new Date(d.getFullYear(), d.getMonth() - 3, 1);
      setFechaDesde(threeMonthsAgo.toISOString().split("T")[0]);
      setFechaHasta(new Date().toISOString().split("T")[0]);
    } else if (preset === "anio") {
      setFechaDesde(`${d.getFullYear()}-01-01`);
      setFechaHasta(new Date().toISOString().split("T")[0]);
    } else if (preset === "todo") {
      setFechaDesde("2025-01-01");
      setFechaHasta(new Date().toISOString().split("T")[0]);
    }
    toast.info("Filtro de fecha actualizado");
  };

  // Merge Payments (Entradas) and Egresos (Salidas)
  const todosMovimientos = useMemo(() => {
    const entradas: MovimientoFinanciero[] = pagos.map((p) => ({
      id: `in-${p.id || Math.random()}`,
      tipo: "Entrada",
      fecha: p.fecha || todayStr,
      concepto: p.concepto || "Cobro de Mensualidad",
      categoria: p.categoria || "Mensualidad",
      sede: p.sede || "Sede Central",
      metodo: p.metodo || "Transferencia SINPE",
      monto: p.monto || 0,
      entidad: p.jugador || "Atleta"
    }));

    const salidas: MovimientoFinanciero[] = egresos.map((e) => ({
      id: e.id,
      tipo: "Salida",
      fecha: e.fecha || todayStr,
      concepto: e.nombre,
      categoria: e.categoria,
      sede: e.sede,
      metodo: e.metodoPago,
      monto: e.montoTotal,
      entidad: e.proveedor || "Proveedor"
    }));

    return [...entradas, ...salidas].sort((a, b) => (b.fecha > a.fecha ? 1 : -1));
  }, [pagos, egresos, todayStr]);

  // Filtered Movimientos
  const filteredMovimientos = useMemo(() => {
    return todosMovimientos.filter((m) => {
      // Date filter mode
      if (modoFecha === "rango") {
        if (fechaDesde && m.fecha < fechaDesde) return false;
        if (fechaHasta && m.fecha > fechaHasta) return false;
      } else if (modoFecha === "mes_anio") {
        if (m.fecha) {
          const parts = m.fecha.split("-");
          const mMonth = (parseInt(parts[1] || "1", 10) - 1).toString();
          const mYear = parts[0] || "2026";
          if (mesFilter !== "Todos" && mMonth !== mesFilter) return false;
          if (anioFilter !== "Todos" && mYear !== anioFilter) return false;
        }
      }

      // Sede filter
      if (sedeFilter !== "Todas" && m.sede !== sedeFilter) return false;

      // Tipo / Categoría filter
      if (categoriaFilter !== "Todas" && m.categoria !== categoriaFilter) return false;

      // Modo de Pago filter
      if (modoPagoFilter !== "Todos" && !m.metodo.toLowerCase().includes(modoPagoFilter.toLowerCase())) return false;

      // Tipo Movimiento filter
      if (tipoFilter !== "Todos" && m.tipo !== tipoFilter) return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchConcepto = m.concepto.toLowerCase().includes(q);
        const matchCategoria = m.categoria.toLowerCase().includes(q);
        const matchEntidad = m.entidad ? m.entidad.toLowerCase().includes(q) : false;
        if (!matchConcepto && !matchCategoria && !matchEntidad) return false;
      }

      return true;
    });
  }, [todosMovimientos, modoFecha, fechaDesde, fechaHasta, mesFilter, anioFilter, sedeFilter, categoriaFilter, modoPagoFilter, tipoFilter, searchQuery]);

  // Financial Metrics Calculation
  const totalEntradas = useMemo(() => {
    return filteredMovimientos
      .filter((m) => m.tipo === "Entrada")
      .reduce((acc, m) => acc + m.monto, 0);
  }, [filteredMovimientos]);

  const totalSalidas = useMemo(() => {
    return filteredMovimientos
      .filter((m) => m.tipo === "Salida")
      .reduce((acc, m) => acc + m.monto, 0);
  }, [filteredMovimientos]);

  const balanceNeto = totalEntradas - totalSalidas;
  const margenUtilidad = totalEntradas > 0 ? Math.round((balanceNeto / totalEntradas) * 100) : 0;

  // Chart data: Monthly comparison
  const chartComparativo = useMemo(() => {
    const map: Record<string, { mes: string; entradas: number; salidas: number }> = {};

    filteredMovimientos.forEach((m) => {
      const monthKey = m.fecha.slice(0, 7); // YYYY-MM
      if (!map[monthKey]) {
        map[monthKey] = { mes: monthKey, entradas: 0, salidas: 0 };
      }
      if (m.tipo === "Entrada") {
        map[monthKey].entradas += m.monto;
      } else {
        map[monthKey].salidas += m.monto;
      }
    });

    return Object.values(map).sort((a, b) => (a.mes > b.mes ? 1 : -1));
  }, [filteredMovimientos]);

  const chartCategoriasEntradas = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMovimientos
      .filter((m) => m.tipo === "Entrada")
      .forEach((m) => {
        map[m.categoria] = (map[m.categoria] || 0) + m.monto;
      });

    const colors = ["#10b981", "#3b82f6", "#6366f1", "#14b8a6", "#84cc16"];
    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      fill: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [filteredMovimientos]);

  const chartCategoriasSalidas = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMovimientos
      .filter((m) => m.tipo === "Salida")
      .forEach((m) => {
        map[m.categoria] = (map[m.categoria] || 0) + m.monto;
      });

    const colors = ["#ef4444", "#f97316", "#eab308", "#8b5cf6", "#ec4899", "#06b6d4"];
    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      fill: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [filteredMovimientos]);

  // Export to Excel (CSV with UTF-8 BOM)
  const exportToExcel = () => {
    try {
      let csvContent = "\uFEFF"; // UTF-8 BOM for Excel compatibility

      // Header Meta
      csvContent += `BALANCE FINANCIERO Y ESTADO DE RESULTADOS - DEPORTIVOS\n`;
      csvContent += `Periodo:;${fechaDesde} a ${fechaHasta}\n`;
      csvContent += `Sede:;${sedeFilter}\n`;
      csvContent += `Fecha Generacion:;${new Date().toLocaleString("es-CR")}\n\n`;

      // Financial Summary
      csvContent += `RESUMEN FINANCIERO\n`;
      csvContent += `Total Entradas (Ingresos):;${totalEntradas}\n`;
      csvContent += `Total Salidas (Egresos):;${totalSalidas}\n`;
      csvContent += `Balance Neto (Ganancia/Perdida):;${balanceNeto}\n`;
      csvContent += `Margen Operativo (%):;${margenUtilidad}%\n\n`;

      // Movement Table Header
      csvContent += `ID;Tipo;Fecha;Concepto / Producto;Categoria;Sede;Metodo de Pago;Entidad / Cliente / Proveedor;Monto\n`;

      // Movement Table Rows
      filteredMovimientos.forEach((m) => {
        const cleanConcepto = m.concepto.replace(/;/g, ",");
        const cleanEntidad = (m.entidad || "").replace(/;/g, ",");
        const signoMonto = m.tipo === "Salida" ? -m.monto : m.monto;
        csvContent += `${m.id};${m.tipo};${m.fecha};"${cleanConcepto}";"${m.categoria}";"${m.sede}";"${m.metodo}";"${cleanEntidad}";${signoMonto}\n`;
      });

      // Blob creation and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Balance_Financiero_${fechaDesde}_al_${fechaHasta}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Reporte de Balance descargado con éxito en formato Excel (.csv).");
    } catch (e) {
      console.error(e);
      toast.error("Error al exportar el reporte a Excel.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-gradient-to-r from-blue-600/10 via-emerald-600/5 to-transparent p-5 shadow-card">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" /> Balance Financiero & Estado de Resultados
          </h2>
          <p className="text-xs text-muted-foreground">
            Auditoría consolidada de Entradas (Ingresos) vs. Salidas (Egresos) por rango de fechas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={exportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md h-9"
          >
            <FileSpreadsheet className="h-4 w-4" /> Exportar Balance a Excel
          </Button>
        </div>
      </div>

      {/* Panel de Filtros Multicriterio */}
      <Card className="shadow-card border border-border/80 bg-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Filtros Multicriterio del Balance
              </span>
            </div>

            {/* Selector Modo Rango vs Mes/Año & Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border p-0.5 bg-muted/30">
                <Button
                  variant={modoFecha === "rango" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-[11px] px-2.5 font-bold"
                  onClick={() => setModoFecha("rango")}
                >
                  Rango de Fechas
                </Button>
                <Button
                  variant={modoFecha === "mes_anio" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-[11px] px-2.5 font-bold"
                  onClick={() => setModoFecha("mes_anio")}
                >
                  Por Mes y Año
                </Button>
              </div>

              <div className="flex flex-wrap gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => applyPreset("este_mes")}>
                  Este Mes
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => applyPreset("mes_anterior")}>
                  Mes Anterior
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => applyPreset("trimestre")}>
                  Trimestre
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => applyPreset("todo")}>
                  Histórico
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* Fechas / Mes y Año */}
            {modoFecha === "rango" ? (
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fecha Desde:</Label>
                  <Input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Fecha Hasta:</Label>
                  <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Mes:</Label>
                  <select
                    value={mesFilter}
                    onChange={(e) => setMesFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm font-semibold"
                  >
                    <option value="Todos">-- Todos los Meses --</option>
                    <option value="0">Enero</option>
                    <option value="1">Febrero</option>
                    <option value="2">Marzo</option>
                    <option value="3">Abril</option>
                    <option value="4">Mayo</option>
                    <option value="5">Junio</option>
                    <option value="6">Julio</option>
                    <option value="7">Agosto</option>
                    <option value="8">Setiembre</option>
                    <option value="9">Octubre</option>
                    <option value="10">Noviembre</option>
                    <option value="11">Diciembre</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Año:</Label>
                  <select
                    value={anioFilter}
                    onChange={(e) => setAnioFilter(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm font-semibold"
                  >
                    <option value="Todos">-- Todos --</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              </>
            )}

            {/* Sede */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Sede:</Label>
              <select
                value={sedeFilter}
                onChange={(e) => setSedeFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm font-medium"
              >
                <option value="Todas">-- Todas las Sedes --</option>
                <option value="Sede Central">Sede Central</option>
                <option value="Sede Este">Sede Este</option>
                <option value="Sede Norte">Sede Norte</option>
                <option value="Sede Sur">Sede Sur</option>
              </select>
            </div>

            {/* Tipo / Categoría Ingreso */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo Ingreso / Egreso:</Label>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm font-medium"
              >
                <option value="Todas">-- Todos --</option>
                <option value="Mensualidad">Mensualidad</option>
                <option value="Matrícula">Matrícula</option>
                <option value="Torneo">Torneos & Ligamen</option>
                <option value="Equipamiento Deportivo">Equipamiento Deportivo</option>
                <option value="Mantenimiento y Servicios">Mantenimiento y Servicios</option>
                <option value="Arbitraje y Torneaje">Arbitraje y Torneaje</option>
                <option value="Transporte y Viajes">Transporte y Viajes</option>
                <option value="Salarios y Honorarios">Salarios y Honorarios</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Modo de Pago */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Modo de Pago:</Label>
              <select
                value={modoPagoFilter}
                onChange={(e) => setModoPagoFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs shadow-sm font-medium"
              >
                <option value="Todos">-- Todos los Modos --</option>
                <option value="Transferencia">Transferencia (SINPE / Banco)</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Moneda (Visual) */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Moneda (Visual):</Label>
              <select
                value={monedaVisualFilter}
                onChange={(e) => setMonedaVisualFilter(e.target.value)}
                className="w-full h-9 rounded-md border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 text-xs font-bold text-emerald-900 dark:text-emerald-300 shadow-sm"
              >
                {MONEDAS_LATAM.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} ({m.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards: Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entradas */}
        <Card className="shadow-card border-l-4 border-l-emerald-500 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ArrowDownLeft className="h-4 w-4" /> TOTAL ENTRADAS
              </p>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {formatCRC(totalEntradas)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {filteredMovimientos.filter((m) => m.tipo === "Entrada").length} transacciones
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Salidas */}
        <Card className="shadow-card border-l-4 border-l-rose-500 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4" /> TOTAL SALIDAS
              </p>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {formatCRC(totalSalidas)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {filteredMovimientos.filter((m) => m.tipo === "Salida").length} compras / egresos
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Balance Neto */}
        <Card className={`shadow-card border-l-4 ${balanceNeto >= 0 ? "border-l-primary" : "border-l-amber-500"} bg-card`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> BALANCE NETO
              </p>
              <p className={`text-2xl font-black font-mono mt-1 ${balanceNeto >= 0 ? "text-slate-900 dark:text-white" : "text-amber-600"}`}>
                {formatCRC(balanceNeto)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {balanceNeto >= 0 ? "Superávit Operativo" : "Déficit Operativo"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Margen Operativo */}
        <Card className="shadow-card border-l-4 border-l-teal-500 bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 flex items-center gap-1">
                <PieIcon className="h-4 w-4" /> MARGEN UTILIDAD
              </p>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {margenUtilidad}%
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Eficiencia sobre ingresos
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-teal-500/15 text-teal-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo */}
      {chartComparativo.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Evolución Flujo mensual */}
          <Card className="lg:col-span-8 shadow-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Flujo Mensual: Entradas (Ingresos) vs. Salidas (Egresos)
              </CardTitle>
              <CardDescription className="text-xs">
                Comparativa de volumen financiero registrado mes a mes.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 p-4 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartComparativo} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₡${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => formatCRC(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="entradas" name="Entradas (Ingresos 🟢)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="salidas" name="Salidas (Egresos 🔴)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart Desglose Categorías Salidas */}
          <Card className="lg:col-span-4 shadow-card">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-600">
                <PieIcon className="h-4 w-4" /> Distribución de Salidas
              </CardTitle>
              <CardDescription className="text-xs">
                Gasto acumulado por categoría
              </CardDescription>
            </CardHeader>
            <CardContent className="h-64 p-4 pt-0 flex flex-col items-center justify-center">
              {chartCategoriasSalidas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Sin salidas en el rango</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="75%">
                    <PieChart>
                      <Pie
                        data={chartCategoriasSalidas}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={35}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {chartCategoriasSalidas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCRC(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-1 justify-center max-h-16 overflow-y-auto">
                    {chartCategoriasSalidas.map((c) => (
                      <Badge key={c.name} variant="outline" className="text-[10px] px-1.5 py-0.5">
                        <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: c.fill }} />
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla Unificada de Movimientos Financieros */}
      <Card className="shadow-card border border-border/80 bg-card">
        <CardHeader className="p-4 pb-3 border-b bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" /> Detalle de Movimientos Financieros
              </CardTitle>
              <CardDescription className="text-xs">
                {filteredMovimientos.length} registro(s) encontrados entre {fechaDesde} y {fechaHasta}.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar movimiento o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[750px] text-xs">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto / Detalle</TableHead>
                  <TableHead>Cliente / Proveedor</TableHead>
                  <TableHead>Categoría & Sede</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right font-bold">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovimientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                      No hay movimientos registrados en el rango de fechas seleccionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovimientos.map((m) => (
                    <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        {m.tipo === "Entrada" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-semibold text-[10px]">
                            <ArrowDownLeft className="h-3 w-3" /> Entrada
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1 font-semibold text-[10px]">
                            <ArrowUpRight className="h-3 w-3" /> Salida
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-slate-600 dark:text-slate-400 font-medium">
                        {m.fecha}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        {m.concepto}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {m.entidad || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{m.categoria}</span>
                          <p className="text-[10px] text-muted-foreground">{m.sede}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.metodo}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold text-sm ${m.tipo === "Entrada" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {m.tipo === "Salida" ? "-" : "+"}{formatCRC(m.monto)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
