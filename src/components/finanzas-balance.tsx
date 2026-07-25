import { useState, useMemo, useEffect } from "react";
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
  Download,
  Wallet,
  ArrowDownRight,
  ShieldCheck,
  Check,
  Zap,
  BarChart3,
  Plus,
  ChevronDown,
  Banknote,
  Camera,
  Receipt,
  Sparkles,
  UploadCloud,
  FileText,
  Trash2,
  Pencil
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RendimientoStore, { StoreEgreso } from "@/lib/rendimiento-store";
import { formatCRC } from "@/lib/mock-data";
import { toast } from "sonner";
import { scanReceiptOrComprobanteSync } from "@/lib/ocr-scanner";
import { supabase } from "@/lib/supabase";
import { ensureFinanzasDBSeeded } from "@/lib/seed-finanzas-db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface MovimientoFinanciero {
  id: string;
  tipo: "Entrada" | "Salida";
  fecha: string;
  concepto: string;
  entidad: string; // Cliente o Proveedor
  categoria: string;
  sede: string;
  metodo: string;
  monto: number;
  moneda: "CRC" | "USD";
  referencia?: string;
}

function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function FinanzasBalance() {
  const now = new Date();
  const firstDayStr = getLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const lastDayOfMonth = getLocalDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  // 🎛️ 1. Barra de Filtros Inteligentes (Filtros Multicriterio)
  const [fechaDesde, setFechaDesde] = useState(firstDayStr);
  const [fechaHasta, setFechaHasta] = useState(lastDayOfMonth);
  const [sedeFilter, setSedeFilter] = useState("Todas");
  const [tipoFilter, setTipoFilter] = useState<"Todo" | "Entrada" | "Salida">("Todo");
  const [metodoPagoFilter, setMetodoPagoFilter] = useState("Todos");
  const [monedaFilter, setMonedaFilter] = useState<"CRC" | "USD">("CRC");
  const [searchQuery, setSearchQuery] = useState("");

  // DB Master State
  const [movimientosList, setMovimientosList] = useState<MovimientoFinanciero[]>([]);
  const [loading, setLoading] = useState(false);

  // New Egreso Modal State
  const [openNewEgresoModal, setOpenNewEgresoModal] = useState(false);
  const [egresoConcepto, setEgresoConcepto] = useState("");
  const [egresoProveedor, setEgresoProveedor] = useState("");
  const [egresoCategoria, setEgresoCategoria] = useState("Equipamiento Deportivo");
  const [egresoSede, setEgresoSede] = useState("Sede Central");
  const [egresoMetodo, setEgresoMetodo] = useState("Transferencia Bancaria");
  const [egresoMonto, setEgresoMonto] = useState<number>(50000);
  const [egresoMoneda, setEgresoMoneda] = useState<"CRC" | "USD">("CRC");

  // Unified Movimientos Modal States (+ Registrar Movimiento)
  const [openManualCashModal, setOpenManualCashModal] = useState(false);
  const [manualTipo, setManualTipo] = useState<"Ingreso" | "Egreso">("Ingreso");
  const [manualMonto, setManualMonto] = useState<number>(25000);
  const [manualConcepto, setManualConcepto] = useState("");
  const [manualEntidad, setManualEntidad] = useState("");
  const [manualCategoria, setManualCategoria] = useState("Mensualidad");
  const [manualSede, setManualSede] = useState("Sede Central");
  const [manualMoneda, setManualMoneda] = useState<"CRC" | "USD">("CRC");
  const [manualMetodo, setManualMetodo] = useState("Efectivo");

  // Searchable Athlete Select for Manual Cash Payment
  const [athleteSearch, setAthleteSearch] = useState("");
  const [showAthleteDropdown, setShowAthleteDropdown] = useState(false);

  const filteredJugadores = useMemo(() => {
    const jugadores = RendimientoStore.getJugadores();
    if (!athleteSearch.trim()) return jugadores.slice(0, 12);
    return jugadores.filter(j =>
      j.nombre.toLowerCase().includes(athleteSearch.toLowerCase()) ||
      (j.categoria && j.categoria.toLowerCase().includes(athleteSearch.toLowerCase())) ||
      (j.encargado && j.encargado.toLowerCase().includes(athleteSearch.toLowerCase()))
    ).slice(0, 15);
  }, [athleteSearch]);

  // IA Comprobante Modal State (Ingreso SINPE / Transferencia)
  const [openIAComprobanteModal, setOpenIAComprobanteModal] = useState(false);
  const [iaComprobanteFile, setIaComprobanteFile] = useState<File | null>(null);
  const [iaComprobanteFileName, setIaComprobanteFileName] = useState<string | null>(null);
  const [iaComprobanteScanning, setIaComprobanteScanning] = useState(false);
  const [iaComprobanteData, setIaComprobanteData] = useState<{
    monto: number;
    cliente: string;
    referencia: string;
    concepto: string;
  } | null>(null);

  // IA Tiquete Modal State (Egreso Factura)
  const [openIATiqueteModal, setOpenIATiqueteModal] = useState(false);
  const [iaTiqueteFile, setIaTiqueteFile] = useState<File | null>(null);
  const [iaTiqueteFileName, setIaTiqueteFileName] = useState<string | null>(null);
  const [iaTiqueteScanning, setIaTiqueteScanning] = useState(false);
  const [iaTiqueteData, setIaTiqueteData] = useState<{
    monto: number;
    proveedor: string;
    concepto: string;
    referencia: string;
    categoria?: string;
  } | null>(null);

  // Delete Confirmation Modal State
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<MovimientoFinanciero | null>(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<MovimientoFinanciero | null>(null);
  const [editConcepto, setEditConcepto] = useState("");
  const [editEntidad, setEditEntidad] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editMetodo, setEditMetodo] = useState("");
  const [editMonto, setEditMonto] = useState(0);
  const [editFecha, setEditFecha] = useState("");




  // Fetch strictly from Database in background
  const fetchFinanzasDataFromDB = async () => {
    setLoading(true);

    try {
      const [resPagos, resNominas] = await Promise.all([
        supabase.from("pagos").select("*").order("fecha", { ascending: false }).order("id", { ascending: false }),
        supabase.from("nominas_entrenadores").select("*").order("fecha_pago", { ascending: false }),
      ]);

      const list: MovimientoFinanciero[] = [];
      const existingIds = new Set<string>();

      // 1. Process Transactions from Supabase DB (pagos table: handles both Entradas and Salidas/Egresos)
      if (resPagos.data && resPagos.data.length > 0) {
        resPagos.data.forEach((p: any) => {
          const cleanId = String(p.id).replace(/^(pago_|egreso_|egr_)/, "");
          const rawMonto = Number(p.monto || p.monto_total || p.montoTotal || 0);
          const isEgreso = rawMonto < 0 || String(p.referencia || "").startsWith("EGRESO:") || String(p.id || "").startsWith("egr_");

          existingIds.add(cleanId);
          existingIds.add(p.id);

          let rawRef = String(p.referencia || "");
          let parsedRef = rawRef;
          let parsedConcept = p.concepto || "";

          // Extract embedded [CAT:...] from referencia
          let categoriaFromRef: string | null = null;
          const catMatch = rawRef.match(/^\[CAT:([^\]]+)\]\s*/);
          if (catMatch) {
            categoriaFromRef = catMatch[1];
            rawRef = rawRef.replace(/^\[CAT:[^\]]+\]\s*/, "");
          }

          if (rawRef.includes(" | ")) {
            const parts = rawRef.split(" | ");
            parsedRef = parts[0].replace(/^Factura\s*/i, "").replace(/^EGRESO:\s*/i, "");
            parsedConcept = parts.slice(1).join(" | ");
          } else if (rawRef.startsWith("EGRESO:")) {
            parsedRef = "EGRESO";
            parsedConcept = rawRef.replace(/^EGRESO:\s*/i, "");
          } else if (/^Factura\s+/i.test(rawRef)) {
            parsedRef = rawRef.replace(/^Factura\s*/i, "");
          }

          if (!parsedConcept) {
            parsedConcept = isEgreso ? "Gasto Operativo / Compra" : "Cobro de Mensualidad";
          }

          if (isEgreso) {
            list.push({
              id: `egreso_${cleanId}`,
              tipo: "Salida",
              fecha: p.fecha || todayStr,
              concepto: parsedConcept,
              entidad: p.jugador || p.jugador_nombre || p.jugadorNombre || p.proveedor || "Proveedor Oficial",
              categoria: categoriaFromRef || p.categoria || "Otros Gastos",
              sede: p.sede || "Sede Central",
              metodo: p.metodo || p.metodo_pago || p.metodoPago || "Factura / Efectivo",
              monto: Math.abs(rawMonto),
              moneda: p.moneda === "USD" ? "USD" : "CRC",
              referencia: parsedRef || "#341",
            });
          } else {
            list.push({
              id: `pago_${cleanId}`,
              tipo: "Entrada",
              fecha: p.fecha || todayStr,
              concepto: parsedConcept,
              entidad: p.jugador || p.jugador_nombre || p.jugadorNombre || "Cliente / Atleta",
              categoria: p.categoria || "Mensualidad",
              sede: p.sede || "Sede Central",
              metodo: p.metodo || p.metodo_pago || p.metodoPago || "SINPE Móvil",
              monto: Math.abs(rawMonto),
              moneda: p.moneda === "USD" ? "USD" : "CRC",
              referencia: parsedRef || "N° 0284",
            });
          }
        });
      }



      // 3. Process Salidas (Nóminas de Entrenadores)
      if (resNominas.data && resNominas.data.length > 0) {
        resNominas.data.forEach((n: any) => {
          list.push({
            id: `nomina_${n.id}`,
            tipo: "Salida",
            fecha: n.fecha_pago || n.fechaPago || todayStr,
            concepto: `Nómina de Honorarios (${n.entrenador_nombre})`,
            entidad: n.entrenador_nombre || "Entrenador / Staff",
            categoria: "Nómina de Staff",
            sede: "Sede Central",
            metodo: "Transferencia Bancaria",
            monto: Number(n.monto_total) || 384000,
            moneda: n.moneda === "USD" ? "USD" : "CRC",
          });
        });
      }

      if (list.length > 0) {
        const getIdTs = (id: string) => {
          const m = id.match(/(\d{10,})/);
          return m ? parseInt(m[1], 10) : 0;
        };
        list.sort((a, b) => {
          const dateDiff = b.fecha.localeCompare(a.fecha);
          if (dateDiff !== 0) return dateDiff;
          return getIdTs(b.id) - getIdTs(a.id);
        });
        setMovimientosList(list);
      }
    } catch (err) {
      console.error("Error fetching financial data from DB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanzasDataFromDB();
  }, []);

  // Quick Preset Handlers
  const applyPreset = (preset: "este_mes" | "mes_anterior" | "trimestre" | "anio" | "todo") => {
    const d = new Date();
    if (preset === "este_mes") {
      setFechaDesde(getLocalDateStr(new Date(d.getFullYear(), d.getMonth(), 1)));
      setFechaHasta(getLocalDateStr(d));
    } else if (preset === "mes_anterior") {
      const prevMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(d.getFullYear(), d.getMonth(), 0);
      setFechaDesde(getLocalDateStr(prevMonth));
      setFechaHasta(getLocalDateStr(lastDayPrevMonth));
    } else if (preset === "trimestre") {
      const threeMonthsAgo = new Date(d.getFullYear(), d.getMonth() - 3, 1);
      setFechaDesde(getLocalDateStr(threeMonthsAgo));
      setFechaHasta(getLocalDateStr(d));
    } else if (preset === "anio") {
      setFechaDesde(`${d.getFullYear()}-01-01`);
      setFechaHasta(getLocalDateStr(d));
    } else if (preset === "todo") {
      setFechaDesde("2025-01-01");
      setFechaHasta(getLocalDateStr(d));
    }
  };

  // Multicriteria Filtering Logic
  const filteredMovimientos = useMemo(() => {
    return movimientosList.filter((m) => {
      // 1. Date Range
      if (fechaDesde && m.fecha < fechaDesde) return false;
      if (fechaHasta && m.fecha > fechaHasta) return false;

      // 2. Sede Filter
      if (sedeFilter !== "Todas" && m.sede !== sedeFilter) return false;

      // 3. Tipo Movimiento Filter
      if (tipoFilter !== "Todo" && m.tipo !== tipoFilter) return false;

      // 4. Método de Pago Filter
      if (metodoPagoFilter !== "Todos" && !m.metodo.toLowerCase().includes(metodoPagoFilter.toLowerCase())) return false;

      // 5. Moneda Filter
      if (m.moneda !== monedaFilter) return false;

      // 6. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          m.concepto.toLowerCase().includes(q) ||
          m.entidad.toLowerCase().includes(q) ||
          m.categoria.toLowerCase().includes(q) ||
          m.sede.toLowerCase().includes(q) ||
          m.metodo.toLowerCase().includes(q) ||
          (m.referencia && m.referencia.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [movimientosList, fechaDesde, fechaHasta, sedeFilter, tipoFilter, metodoPagoFilter, monedaFilter, searchQuery]);

  // 📊 2. KPIs de Balance Neto (Segoe UI)
  const totalEntradas = useMemo(() => {
    return filteredMovimientos
      .filter((m) => m.tipo === "Entrada")
      .reduce((sum, m) => sum + m.monto, 0);
  }, [filteredMovimientos]);

  const totalSalidas = useMemo(() => {
    return filteredMovimientos
      .filter((m) => m.tipo === "Salida")
      .reduce((sum, m) => sum + m.monto, 0);
  }, [filteredMovimientos]);

  const balanceNeto = totalEntradas - totalSalidas;

  const margenUtilidad = useMemo(() => {
    if (totalEntradas === 0) return 0;
    return Math.round((balanceNeto / totalEntradas) * 100);
  }, [totalEntradas, balanceNeto]);

  const isCRC = monedaFilter === "CRC";
  const currencySymbol = isCRC ? "₡" : "$";

  // 🚨 3. Gráfico Izquierdo (Flujo de Movimientos Dinámico Eje X por Semanas o Meses)
  const chartFlujoDinamicData = useMemo(() => {
    const dStart = new Date(fechaDesde);
    const dEnd = new Date(fechaHasta);
    const diffDays = Math.ceil((dEnd.getTime() - dStart.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 45) {
      const weeks = [
        { name: "Semana 1 (Días 1-7)", entradas: 0, salidas: 0 },
        { name: "Semana 2 (Días 8-14)", entradas: 0, salidas: 0 },
        { name: "Semana 3 (Días 15-21)", entradas: 0, salidas: 0 },
        { name: "Semana 4 (Días 22+)", entradas: 0, salidas: 0 },
      ];

      filteredMovimientos.forEach((m) => {
        const day = new Date(m.fecha).getDate();
        let weekIndex = 0;
        if (day >= 8 && day <= 14) weekIndex = 1;
        else if (day >= 15 && day <= 21) weekIndex = 2;
        else if (day >= 22) weekIndex = 3;

        if (m.tipo === "Entrada") weeks[weekIndex].entradas += m.monto;
        else weeks[weekIndex].salidas += m.monto;
      });

      return weeks;
    } else {
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
      const groups: Record<string, { entradas: 0; salidas: 0 }> = {};

      filteredMovimientos.forEach((m) => {
        const d = new Date(m.fecha);
        const mKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        if (!groups[mKey]) groups[mKey] = { entradas: 0, salidas: 0 };

        if (m.tipo === "Entrada") groups[mKey].entradas += m.monto as any;
        else groups[mKey].salidas += m.monto as any;
      });

      return Object.keys(groups).map((key) => ({
        name: key,
        entradas: groups[key].entradas,
        salidas: groups[key].salidas,
      }));
    }
  }, [filteredMovimientos, fechaDesde, fechaHasta]);

  // Gráfico Derecho (Distribución de Salidas por Categoría)
  const chartDistribucionSalidas = useMemo(() => {
    const egresosOnly = filteredMovimientos.filter((m) => m.tipo === "Salida");
    const categoriesMap: Record<string, number> = {};

    egresosOnly.forEach((e) => {
      const cat = e.categoria || "Otros Gastos";
      categoriesMap[cat] = (categoriesMap[cat] || 0) + e.monto;
    });

    const colors = ["#ef4444", "#f59e0b", "#6366f1", "#10b981", "#8b5cf6", "#ec4899"];
    const entries = Object.keys(categoriesMap).map((cat, idx) => ({
      name: cat,
      value: categoriesMap[cat],
      color: colors[idx % colors.length],
    }));

    if (entries.length === 0) {
      return [{ name: "Sin Salidas", value: 1, color: "#cbd5e1" }];
    }

    return entries;
  }, [filteredMovimientos]);

  // 📥 Exportar Balance a Excel
  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const dataToExport = filteredMovimientos.map((m) => ({
        Tipo: m.tipo,
        Fecha: m.fecha,
        Concepto: m.concepto,
        "Cliente / Proveedor": m.entidad,
        Categoría: m.categoria,
        Sede: m.sede,
        "Método de Pago": m.metodo,
        Monto: m.monto,
        Moneda: m.moneda,
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Libro de Caja");

      const fileName = `Balance_y_Libro_de_Caja_${fechaDesde}_a_${fechaHasta}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Archivo '${fileName}' exportado con éxito ✓`);
    } catch (err) {
      console.error("Error exporting to Excel:", err);
      toast.error("No se pudo exportar el archivo Excel");
    }
  };

  // Action: Open Manual Cash Modal
  const handleOpenManualCashModal = (tipo: "Ingreso" | "Egreso") => {
    setManualTipo(tipo);
    setManualConcepto(tipo === "Ingreso" ? "Pago de mensualidad Julio" : "Pago de arbitraje partido sábado");
    setManualEntidad("");
    setAthleteSearch("");
    setShowAthleteDropdown(false);
    setManualCategoria(tipo === "Ingreso" ? "Mensualidad" : "Arbitraje & Eventos");
    setManualMonto(25000);
    setOpenManualCashModal(true);
  };

  // Action: Save Manual Cash Movement to DB
  const handleSaveManualCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMonto || !manualConcepto || !manualEntidad) {
      toast.error("Por favor completa el monto, concepto y cliente/proveedor");
      return;
    }

    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";

    if (manualTipo === "Ingreso") {
      const newPago = {
        id: `pago_cash_${Date.now()}`,
        jugadorId: "manual_cash",
        jugadorNombre: manualEntidad,
        monto: manualMonto,
        metodo: manualMetodo,
        concepto: manualConcepto,
        categoria: manualCategoria,
        sede: manualSede,
        moneda: manualMoneda,
        fecha: todayStr,
        organizacion_id: orgId,
      };

      const currentPagos = RendimientoStore.getPagos();
      RendimientoStore.set("pagos_dynamics", [newPago, ...currentPagos]);

      const ingresoRef = `[CAT:${manualCategoria}] ${manualConcepto}`.slice(0, 100);
      const { error: ingrErr } = await supabase.from("pagos").insert([{
        id: newPago.id,
        jugador: manualEntidad,
        monto: manualMonto,
        metodo: manualMetodo,
        referencia: ingresoRef,
        fecha: todayStr,
        estado: "completado",
        organizacion_id: orgId,
      }]);

      if (ingrErr) {
        toast.error(`❌ Error en BD: ${ingrErr.message}`);
        return;
      }

      toast.success(`💵 Ingreso de ₡${manualMonto.toLocaleString()} registrado en la BD`);
    } else {
      const newEgreso: StoreEgreso = {
        id: `egr_cash_${Date.now()}`,
        fecha: todayStr,
        concepto: manualConcepto,
        proveedor: manualEntidad,
        categoria: manualCategoria,
        sede: manualSede,
        metodoPago: manualMetodo,
        monto: manualMonto,
        moneda: manualMoneda,
        estado: "Pagado",
        organizacion_id: orgId,
      };

      RendimientoStore.saveEgreso(newEgreso);
      try {
        const refConCat = `[CAT:${newEgreso.categoria}] EGRESO: ${newEgreso.concepto}`.slice(0, 100);
        await supabase.from("pagos").insert([{
          id: newEgreso.id,
          jugador: newEgreso.proveedor,
          monto: -Math.abs(newEgreso.monto),
          metodo: manualMetodo,
          referencia: refConCat,
          fecha: newEgreso.fecha,
          estado: "completado",
          organizacion_id: orgId,
        }]);
      } catch (err) {
        console.warn("Supabase pagos egreso insert warning:", err);
      }

      toast.success(`📉 Gasto en Efectivo de ₡${manualMonto.toLocaleString()} registrado exitosamente en la BD`);
    }

    setOpenManualCashModal(false);
    fetchFinanzasDataFromDB();
  };

  // Action: IA Comprobante Scan
  const handleSimulateScanIAComprobante = () => {
    if (!iaComprobanteFileName && !iaComprobanteFile) {
      document.getElementById("file-ia-comprobante")?.click();
      return;
    }
    setIaComprobanteScanning(true);
    setTimeout(() => {
      const res = scanReceiptOrComprobanteSync(iaComprobanteFile || iaComprobanteFileName || "", iaComprobanteFileName || "");
      setIaComprobanteData({
        monto: res.monto,
        cliente: res.cliente,
        referencia: res.referencia,
        concepto: res.concepto,
      });
      setIaComprobanteScanning(false);
      toast.success("✨ ¡Comprobante procesado con éxito por la IA Visión OCR!");
    }, 400);
  };

  // Action: Save IA Comprobante Payment to DB
  const handleSaveIAComprobante = async () => {
    if (!iaComprobanteData) return;
    const dbOrgId = "00000000-0000-0000-0000-000000000000";
    const refText = iaComprobanteData.referencia || "SINPE";
    const fullRefText = (iaComprobanteData.concepto ? `${refText} | ${iaComprobanteData.concepto}` : refText).slice(0, 100);
    const newPagoId = `pag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newPago = {
      id: newPagoId,
      jugadorNombre: iaComprobanteData.cliente,
      monto: iaComprobanteData.monto,
      metodo: "SINPE Móvil",
      referencia: fullRefText,
      concepto: iaComprobanteData.concepto || "Cobro / Ingreso SINPE",
      categoria: "Mensualidad",
      sede: "Sede Central",
      moneda: "CRC" as const,
      fecha: todayStr,
      organizacion_id: dbOrgId,
    };
    const currentPagos = RendimientoStore.getPagos();
    RendimientoStore.set("pagos_dynamics", [newPago, ...currentPagos]);
    
    try {
      const { error } = await supabase.from("pagos").insert([{
        id: newPago.id,
        jugador: newPago.jugadorNombre,
        monto: newPago.monto,
        metodo: "SINPE Móvil",
        referencia: fullRefText,
        fecha: newPago.fecha,
        estado: "completado",
        organizacion_id: dbOrgId,
      }]);
      if (error) {
        console.error("Supabase insert error:", error);
        toast.error(`❌ Error en Supabase BD: ${error.message}`);
        return;
      }
    } catch (e: any) {
      console.warn("Supabase pagos insert warning:", e);
      toast.error(`❌ Error de conexión BD: ${e?.message || e}`);
      return;
    }

    const newItem: MovimientoFinanciero = {
      id: `pago_${newPago.id}`,
      tipo: "Entrada",
      fecha: newPago.fecha,
      concepto: newPago.concepto,
      entidad: newPago.jugadorNombre,
      categoria: "Mensualidad",
      sede: "Sede Central",
      metodo: "SINPE Móvil",
      monto: Math.abs(newPago.monto),
      moneda: "CRC",
      referencia: fullRefText,
    };

    setMovimientosList((prev) => [newItem, ...prev.filter((x) => x.id !== newItem.id)]);
    toast.success(`📸 Ingreso por ₡${iaComprobanteData.monto.toLocaleString()} (${refText}) guardado exitosamente en BD Supabase`);
    setOpenIAComprobanteModal(false);
    setIaComprobanteFile(null);
    setIaComprobanteFileName(null);
    setIaComprobanteData(null);
    fetchFinanzasDataFromDB();
  };

  // Action: IA Tiquete Scan
  const handleSimulateScanIATiquete = () => {
    if (!iaTiqueteFileName && !iaTiqueteFile) {
      document.getElementById("file-ia-tiquete")?.click();
      return;
    }
    setIaTiqueteScanning(true);
    setTimeout(() => {
      const res = scanReceiptOrComprobanteSync(iaTiqueteFile || iaTiqueteFileName || "", iaTiqueteFileName || "");
      setIaTiqueteData({
        monto: res.monto,
        proveedor: res.proveedor,
        concepto: res.concepto,
        referencia: res.referencia || "#341",
      });
      setIaTiqueteScanning(false);
      toast.success("✨ ¡Tiquete/Factura procesado con éxito por la IA Visión OCR!");
    }, 400);
  };

  // Action: Save IA Tiquete Egreso to DB
  const handleSaveIATiquete = async () => {
    if (!iaTiqueteData) return;
    const dbOrgId = "00000000-0000-0000-0000-000000000000";
    const refText = iaTiqueteData.referencia || "#341";
    const newEgresoId = `pag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullRefText = `Factura ${refText} | ${iaTiqueteData.concepto || "Compra / Gasto Tiquete IA"}`.slice(0, 100);
    
    const newEgreso: StoreEgreso = {
      id: newEgresoId,
      fecha: todayStr,
      concepto: iaTiqueteData.concepto || "Compra / Gasto Tiquete IA",
      proveedor: iaTiqueteData.proveedor || "Proveedor Oficial",
      categoria: iaTiqueteData.categoria || "Equipamiento Deportivo",
      sede: "Sede Central",
      metodoPago: "Factura / Tiquete IA",
      monto: iaTiqueteData.monto,
      moneda: "CRC",
      estado: "Pagado",
      referencia: refText,
      organizacion_id: dbOrgId,
    };

    RendimientoStore.saveEgreso(newEgreso);

    try {
      const catPrefix = `[CAT:${newEgreso.categoria}] `;
      const fullRefWithCat = (catPrefix + fullRefText).slice(0, 100);
      const { error } = await supabase.from("pagos").insert([{
        id: newEgreso.id,
        jugador: newEgreso.proveedor,
        monto: -Math.abs(newEgreso.monto),
        metodo: newEgreso.metodoPago,
        referencia: fullRefWithCat,
        fecha: newEgreso.fecha,
        estado: "completado",
        organizacion_id: dbOrgId,
      }]);

      if (error) {
        console.error("Supabase insert error:", error);
        toast.error(`❌ Error en Supabase BD: ${error.message}`);
        return;
      }
    } catch (e: any) {
      console.warn("Supabase pagos egreso insert error:", e);
      toast.error(`❌ Error de conexión con Supabase BD: ${e?.message || e}`);
      return;
    }

    const newItem: MovimientoFinanciero = {
      id: `egreso_${newEgreso.id}`,
      tipo: "Salida",
      fecha: newEgreso.fecha,
      concepto: newEgreso.concepto,
      entidad: newEgreso.proveedor,
      categoria: newEgreso.categoria,
      sede: "Sede Central",
      metodo: newEgreso.metodoPago,
      monto: Math.abs(newEgreso.monto),
      moneda: "CRC",
      referencia: fullRefText,
    };

    setMovimientosList((prev) => [newItem, ...prev.filter((x) => x.id !== newItem.id)]);
    toast.success(`🧾 Egreso '${refText}' por ₡${iaTiqueteData.monto.toLocaleString()} guardado exitosamente en BD Supabase`);
    setOpenIATiqueteModal(false);
    setIaTiqueteFileName(null);
    setIaTiqueteData(null);
    fetchFinanzasDataFromDB();
  };

  // Action: Save New Egreso to Supabase DB
  const handleSaveNewEgresoDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!egresoConcepto || !egresoMonto) {
      toast.error("Completa el concepto y el monto del egreso");
      return;
    }

    const dbOrgId = "00000000-0000-0000-0000-000000000000";
    const newEgreso: StoreEgreso = {
      id: `pag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fecha: todayStr,
      concepto: egresoConcepto,
      proveedor: egresoProveedor || "Proveedor General",
      categoria: egresoCategoria,
      sede: egresoSede,
      metodoPago: egresoMetodo,
      monto: egresoMonto,
      moneda: egresoMoneda,
      estado: "Pagado",
      organizacion_id: dbOrgId,
    };

    RendimientoStore.saveEgreso(newEgreso);
    try {
      const refConCat = `[CAT:${newEgreso.categoria}] EGRESO: ${newEgreso.concepto}`.slice(0, 100);
      const { error } = await supabase.from("pagos").insert([{
        id: newEgreso.id,
        jugador: newEgreso.proveedor,
        monto: -Math.abs(newEgreso.monto),
        metodo: newEgreso.metodoPago,
        referencia: refConCat,
        fecha: newEgreso.fecha,
        estado: "completado",
        organizacion_id: dbOrgId,
      }]);
      if (error) {
        console.error("Supabase insert error:", error);
        toast.error(`❌ Error en BD: ${error.message}`);
        return;
      }
    } catch (err: any) {
      console.warn("Supabase pagos egreso insert warning:", err);
      toast.error(`❌ Error de conexión: ${err?.message || err}`);
      return;
    }

    toast.success(`Egreso '${egresoConcepto}' registrado por ₡${egresoMonto.toLocaleString()} ✓`);
    setOpenNewEgresoModal(false);
    setEgresoConcepto("");
    setEgresoProveedor("");
    fetchFinanzasDataFromDB();
  };

  // Action: Open Delete Confirmation Modal
  const handleOpenDeleteModal = (m: MovimientoFinanciero) => {
    setMovementToDelete(m);
    setDeleteConfirmModalOpen(true);
  };

  // Action: Open Edit Modal
  const handleOpenEditModal = (m: MovimientoFinanciero) => {
    setMovementToEdit(m);
    setEditConcepto(m.concepto);
    setEditEntidad(m.entidad);
    setEditCategoria(m.categoria);
    setEditMetodo(m.metodo);
    setEditMonto(m.monto);
    setEditFecha(m.fecha);
    setEditModalOpen(true);
  };

  // Action: Save Edited Movement to Supabase
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementToEdit) return;
    const rawId = movementToEdit.id.replace(/^(pago_|egreso_|egreso_local_|egr_|nomina_)/, "");
    const isEgreso = movementToEdit.tipo === "Salida";
    const newRef = `[CAT:${editCategoria}] ${isEgreso ? "EGRESO" : "INGRESO"}: ${editConcepto}`.slice(0, 100);
    const { error } = await supabase.from("pagos").update({
      jugador: editEntidad,
      monto: isEgreso ? -Math.abs(editMonto) : Math.abs(editMonto),
      metodo: editMetodo,
      referencia: newRef,
      fecha: editFecha,
    }).eq("id", rawId);
    if (error) {
      toast.error(`❌ Error al editar: ${error.message}`);
      return;
    }
    toast.success(`✅ Movimiento actualizado correctamente`);
    setEditModalOpen(false);
    fetchFinanzasDataFromDB();
  };

  // Action: Execute Delete Financial Movement (Pago or Egreso) from DB & Local Store
  const handleConfirmDeleteMovimiento = async () => {
    if (!movementToDelete) return;
    const m = movementToDelete;
    const rawId = m.id.replace(/^(pago_|egreso_|egreso_local_|egr_|nomina_)/, "");

    // 1. Delete permanently from Supabase DB (pagos, egresos, nominas_entrenadores)
    try {
      await Promise.all([
        supabase.from("pagos").delete().eq("id", m.id),
        supabase.from("pagos").delete().eq("id", rawId),
        supabase.from("pagos").delete().like("id", `%${rawId}%`),
        supabase.from("egresos").delete().eq("id", m.id),
        supabase.from("egresos").delete().eq("id", rawId),
        supabase.from("nominas_entrenadores").delete().eq("id", rawId),
      ]);
    } catch (e) {
      console.warn("Supabase delete error:", e);
    }

    // 2. Delete from local RendimientoStore
    RendimientoStore.deleteEgreso(rawId);
    RendimientoStore.deleteEgreso(m.id);
    const currentPagos = RendimientoStore.getPagos();
    const updatedPagos = currentPagos.filter((p: any) => p.id !== rawId && p.id !== m.id && !String(p.id).includes(rawId));
    RendimientoStore.set("pagos_dynamics", updatedPagos);

    // 3. Update local UI list state
    setMovimientosList((prev) => prev.filter((item) => item.id !== m.id && !item.id.includes(rawId)));
    toast.success(`🗑️ Movimiento "${m.concepto}" eliminado exitosamente de la BD`);
    setDeleteConfirmModalOpen(false);
    setMovementToDelete(null);
    fetchFinanzasDataFromDB();
  };

  return (
    <div className="font-['Segoe_UI',sans-serif] space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* HEADER DE SECCIÓN LÍMPIO (SINCRO) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> 📉 Balance y Libro de Caja General
          </h2>
          <p className="text-xs text-muted-foreground font-normal">
            Control de entradas vs salidas y auditoría contable en tiempo real.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchFinanzasDataFromDB}
          className="text-xs font-normal h-8 rounded-xl border-border gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Sincronizar
        </Button>
      </div>

      {/* 🎛️ 1. BARRA DE FILTROS INTELIGENTES (FILTROS MULTICRITERIO) */}
      <Card className="border-border shadow-xs rounded-2xl p-4 bg-card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-primary" /> Filtros Multicriterio de Caja
          </span>

          <div className="flex items-center gap-1 overflow-x-auto">
            <Button size="xs" variant="ghost" onClick={() => applyPreset("este_mes")} className="text-[10px] h-6">Este Mes</Button>
            <Button size="xs" variant="ghost" onClick={() => applyPreset("mes_anterior")} className="text-[10px] h-6">Mes Anterior</Button>
            <Button size="xs" variant="ghost" onClick={() => applyPreset("trimestre")} className="text-[10px] h-6">Trimestre</Button>
            <Button size="xs" variant="ghost" onClick={() => applyPreset("anio")} className="text-[10px] h-6">Año 2026</Button>
            <Button size="xs" variant="ghost" onClick={() => applyPreset("todo")} className="text-[10px] h-6">Todo</Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 text-xs font-normal">
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">Fecha Desde</Label>
            <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="h-8 text-xs mt-1" />
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">Fecha Hasta</Label>
            <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="h-8 text-xs mt-1" />
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">Sede Operativa</Label>
            <select
              value={sedeFilter}
              onChange={(e) => setSedeFilter(e.target.value)}
              className="w-full h-8 px-2 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
            >
              <option value="Todas">Todas las Sedes</option>
              <option value="Sede Central">Sede Central Élite</option>
              <option value="Sede Norte">Sede Norte</option>
              <option value="Sede Occidente">Sede Occidente</option>
            </select>
          </div>

          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground">Tipo de Movimiento</Label>
            <select
              value={tipoFilter}
              onChange={(e: any) => setTipoFilter(e.target.value)}
              className="w-full h-8 px-2 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
            >
              <option value="Todo">Todos los Movimientos</option>
              <option value="Entrada">Ingresos / Entradas (🟢)</option>
              <option value="Salida">Egresos / Salidas (🔴)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <Label className="text-[11px] font-semibold text-muted-foreground">Método Pago</Label>
              <select
                value={metodoPagoFilter}
                onChange={(e) => setMetodoPagoFilter(e.target.value)}
                className="w-full h-8 px-1.5 bg-background border border-border rounded-xl text-[11px] font-normal mt-1 outline-none truncate"
              >
                <option value="Todos">Todos</option>
                <option value="SINPE">SINPE Móvil</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta POS</option>
              </select>
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-muted-foreground">Moneda</Label>
              <select
                value={monedaFilter}
                onChange={(e: any) => setMonedaFilter(e.target.value)}
                className="w-full h-8 px-1 bg-background border border-border rounded-xl text-[11px] font-bold mt-1 outline-none"
              >
                <option value="CRC">CRC (₡)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* 📊 2. KPIS DE BALANCE NETO (SEGOE UI) */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-card border-emerald-500/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold text-emerald-600">Total Entradas (Ingresos)</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-600">
            {currencySymbol}{totalEntradas.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{monedaFilter}</span>
          </p>
          <span className="text-[10px] text-muted-foreground font-normal">Cobros brutas del período</span>
        </Card>

        <Card className="p-4 bg-card border-rose-500/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold text-rose-600">Total Salidas (Egresos)</span>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black font-mono text-rose-600">
            {currencySymbol}{totalSalidas.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{monedaFilter}</span>
          </p>
          <span className="text-[10px] text-muted-foreground font-normal">Compras y gastos recurrentes</span>
        </Card>

        <Card className={`p-4 bg-card shadow-xs space-y-1 ${balanceNeto >= 0 ? "border-emerald-500/30" : "border-rose-500/30"}`}>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Balance Neto (Ganancia Real)</span>
            <Badge className={`text-[10px] font-bold ${balanceNeto >= 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
              {balanceNeto >= 0 ? "▲ Superávit" : "▼ Déficit"}
            </Badge>
          </div>
          <p className={`text-2xl font-black font-mono ${balanceNeto >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {currencySymbol}{balanceNeto.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{monedaFilter}</span>
          </p>
          <span className="text-[10px] text-muted-foreground font-normal">Resta: Entradas − Salidas</span>
        </Card>

        <Card className="p-4 bg-card border-indigo-500/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold text-indigo-600">Margen de Utilidad (%)</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black font-mono text-indigo-600">
            {margenUtilidad}%
          </p>
          <span className="text-[10px] text-muted-foreground font-normal">Rentabilidad neta sobre ingresos</span>
        </Card>
      </div>

      {/* 📉 3. GRÁFICOS DINÁMICOS (LIENZO CENTRAL) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border shadow-sm rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Flujo de Movimientos Dinámico
              </h3>
              <p className="text-[11px] text-muted-foreground font-normal">
                Eje X desglosado automáticamente por Semanas ({fechaDesde} a {fechaHasta})
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold">
              Comparativo Entradas vs Salidas
            </Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartFlujoDinamicData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="entradas" name="Entradas (Ingresos)" fill="oklch(0.65 0.2 150)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salidas" name="Salidas (Egresos)" fill="oklch(0.6 0.25 25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border shadow-sm rounded-2xl p-4 space-y-3">
          <div className="border-b pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-rose-500" /> Distribución de Salidas
            </h3>
            <p className="text-[11px] text-muted-foreground font-normal">Categorización automática de egresos</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartDistribucionSalidas} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                  {chartDistribucionSalidas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1 text-xs">
            {chartDistribucionSalidas.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between font-normal">
                <span className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[170px]">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-semibold text-foreground font-mono">{currencySymbol}{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 📑 4. DETALLE DE MOVIMIENTOS FINANCIEROS (LIBRO DE CAJA GENERAL CON ACCIONES NATIVAS DE EGRESO Y EXCEL) */}
      <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
        <div className="p-4 bg-card border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> Libro de Caja General & Tabla de Auditoría
            </h3>
            <p className="text-xs text-muted-foreground font-normal">
              Historial cronológico de transacciones registradas en la Base de Datos.
            </p>
          </div>

          {/* ACCIONES NATIVAS: BUSCADOR + REGISTRAR EGRESO + EXPORTAR EXCEL */}
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl justify-end">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por N° factura, ticket, concepto, cliente o proveedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm rounded-xl px-3.5">
                  <Plus className="h-4 w-4" /> + Registrar Movimiento <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-1.5 space-y-1 bg-card border-border shadow-xl rounded-xl font-['Segoe_UI',sans-serif]">
                <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Opciones de Entradas & Salidas
                </DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={() => handleOpenManualCashModal("Ingreso")}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-emerald-500/10 focus:bg-emerald-500/10 transition"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 shrink-0 mt-0.5">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      💵 Pago Manual / Efectivo <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-none text-[9px] px-1 py-0 font-semibold">Ingreso</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      Para registrar al papá o alumno que pagó en efectivo en mano.
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setOpenIAComprobanteModal(true)}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-purple-500/10 focus:bg-purple-500/10 transition"
                >
                  <div className="p-2 rounded-lg bg-purple-500/15 text-purple-600 shrink-0 mt-0.5">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      📸 Validar Comprobante IA <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-none text-[9px] px-1 py-0 font-semibold">Ingreso SINPE/Transf</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      Arrastra la captura de pantalla de SINPE Móvil o Transferencia.
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => handleOpenManualCashModal("Egreso")}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-rose-500/10 focus:bg-rose-500/10 transition"
                >
                  <div className="p-2 rounded-lg bg-rose-500/15 text-rose-600 shrink-0 mt-0.5">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      📉 Gasto Manual / Efectivo <Badge className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border-none text-[9px] px-1 py-0 font-semibold">Egreso</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      Para registrar cuando sacas dinero de la caja física (ej: árbitros).
                    </p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setOpenIATiqueteModal(true)}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer hover:bg-amber-500/10 focus:bg-amber-500/10 transition"
                >
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 shrink-0 mt-0.5">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      🧾 Escanear Tiquete / Factura IA <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-none text-[9px] px-1 py-0 font-semibold">Egreso Factura</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      Escanea el tiquete del supermercado o compras del club.
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm rounded-xl"
            >
              <Download className="h-4 w-4" /> 📥 Exportar Balance a Excel
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                <tr>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">N° Recibo / Factura</th>
                  <th className="p-3.5">Concepto / Detalle</th>
                  <th className="p-3.5">Cliente / Proveedor</th>
                  <th className="p-3.5">Categoría / Sede</th>
                  <th className="p-3.5">Método de Pago</th>
                  <th className="p-3.5 text-right">Monto ({monedaFilter})</th>
                  <th className="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMovimientos.length > 0 ? (
                  filteredMovimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3.5">
                        <Badge className={`text-[10px] font-bold ${
                          m.tipo === "Entrada"
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-600 border-rose-500/30"
                        }`}>
                          {m.tipo === "Entrada" ? "🟢 Entrada" : "🔴 Salida"}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground font-normal">{m.fecha}</td>
                      <td className="p-3.5">
                        <Badge variant="secondary" className="font-mono text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                          🧾 {m.referencia || "N° 0284"}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-semibold text-foreground">{m.concepto}</td>
                      <td className="p-3.5 text-muted-foreground font-normal">{m.entidad}</td>
                      <td className="p-3.5 text-muted-foreground font-normal">
                        <span className="font-semibold text-foreground block text-[11px]">{m.categoria}</span>
                        <span className="text-[10px] text-muted-foreground">{m.sede}</span>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px] font-normal">{m.metodo}</Badge>
                      </td>
                      <td className={`p-3.5 text-right font-black font-mono text-sm ${
                        m.tipo === "Entrada" ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {m.tipo === "Entrada" ? "+" : "-"}{currencySymbol}{m.monto.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEditModal(m)}
                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-500/10 rounded-lg transition"
                            title="Editar movimiento"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDeleteModal(m)}
                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg transition"
                            title="Eliminar movimiento de la BD"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground font-normal text-xs">
                      No hay movimientos registrados para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL REGISTRAR EGRESO DIRECTO EN BD */}
      <Dialog open={openNewEgresoModal} onOpenChange={setOpenNewEgresoModal}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-rose-600" /> Registrar Egreso / Gasto Operativo en BD
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Agrega una salida de dinero que actualizará el Balance y el Libro de Caja inmediatamente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewEgresoDB} className="space-y-3 text-xs font-normal">
            <div>
              <Label className="text-xs font-semibold">Concepto / Detalle del Gasto</Label>
              <Input
                value={egresoConcepto}
                onChange={(e) => setEgresoConcepto(e.target.value)}
                placeholder="Ej. Compra de Balones Molten N°5"
                className="h-9 mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Proveedor / Entidad Receptor</Label>
              <Input
                value={egresoProveedor}
                onChange={(e) => setEgresoProveedor(e.target.value)}
                placeholder="Ej. Deportes Carlos S.A."
                className="h-9 mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Categoría del Gasto</Label>
                <select
                  value={egresoCategoria.startsWith("__custom__") ? "__custom__" : egresoCategoria}
                  onChange={(e) => setEgresoCategoria(e.target.value === "__custom__" ? "__custom__" : e.target.value)}
                  className="w-full h-9 px-2 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                >
                  <option value="Arbitraje & Eventos">Arbitraje & Eventos</option>
                  <option value="Equipamiento Deportivo">Equipamiento Deportivo</option>
                  <option value="Alimentación & Hidratación">Alimentación & Hidratación</option>
                  <option value="Mantenimiento de Sedes">Mantenimiento de Sedes</option>
                  <option value="Nómina de Staff">Nómina de Staff</option>
                  <option value="Servicios Públicos & Alquiler">Servicios Públicos & Alquiler</option>
                  <option value="Viáticos & Transporte">Viáticos & Transporte</option>
                  <option value="Uniformes & Dotación">Uniformes & Dotación</option>
                  <option value="Médico & Paramédico">Médico & Paramédico</option>
                  <option value="Publicidad & Marketing">Publicidad & Marketing</option>
                  <option value="Eventos & Torneos">Eventos & Torneos</option>
                  <option value="Otros Gastos">Otros Gastos</option>
                  <option value="__custom__">✏️ Otra (escribir...)</option>
                </select>
                {egresoCategoria.startsWith("__custom__") || (egresoCategoria !== "" && ![
                  "Arbitraje & Eventos","Equipamiento Deportivo","Alimentación & Hidratación",
                  "Mantenimiento de Sedes","Nómina de Staff","Servicios Públicos & Alquiler",
                  "Viáticos & Transporte","Uniformes & Dotación","Médico & Paramédico",
                  "Publicidad & Marketing","Eventos & Torneos","Otros Gastos"
                ].includes(egresoCategoria)) ? (
                  <Input
                    value={egresoCategoria.startsWith("__custom__") ? "" : egresoCategoria}
                    onChange={(e) => setEgresoCategoria(e.target.value || "__custom__")}
                    placeholder="Ej. Psicología Deportiva"
                    className="h-8 mt-1.5 text-xs"
                    autoFocus
                  />
                ) : null}
              </div>

              <div>
                <Label className="text-xs font-semibold">Sede Afectada</Label>
                <select
                  value={egresoSede}
                  onChange={(e) => setEgresoSede(e.target.value)}
                  className="w-full h-9 px-2 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                >
                  <option value="Sede Central">Sede Central Élite</option>
                  <option value="Sede Norte">Sede Norte</option>
                  <option value="Sede Occidente">Sede Occidente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Método de Pago</Label>
                <select
                  value={egresoMetodo.startsWith("__custom__") ? "__custom__" : egresoMetodo}
                  onChange={(e) => setEgresoMetodo(e.target.value === "__custom__" ? "__custom__" : e.target.value)}
                  className="w-full h-9 px-2 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                >
                  <option value="Efectivo">Efectivo en Caja</option>
                  <option value="SINPE Móvil">SINPE Móvil</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Tarjeta POS">Tarjeta POS / Datáfono</option>
                  <option value="Cheque">Cheque Bancario</option>
                  <option value="Depósito Bancario">Depósito Bancario</option>
                  <option value="Factura Crédito">Factura a Crédito</option>
                  <option value="PayPal">PayPal</option>
                  <option value="__custom__">✏️ Otro (escribir...)</option>
                </select>
                {egresoMetodo.startsWith("__custom__") || (egresoMetodo !== "" && ![
                  "Efectivo","SINPE Móvil","Transferencia Bancaria","Tarjeta POS",
                  "Cheque","Depósito Bancario","Factura Crédito","PayPal"
                ].includes(egresoMetodo)) ? (
                  <Input
                    value={egresoMetodo.startsWith("__custom__") ? "" : egresoMetodo}
                    onChange={(e) => setEgresoMetodo(e.target.value || "__custom__")}
                    placeholder="Ej. Criptomoneda, Banca en línea..."
                    className="h-8 mt-1.5 text-xs"
                    autoFocus
                  />
                ) : null}
              </div>

              <div>
                <Label className="text-xs font-semibold">Moneda del Gasto</Label>
                <select
                  value={egresoMoneda}
                  onChange={(e: any) => setEgresoMoneda(e.target.value)}
                  className="w-full h-9 px-2 bg-background border border-border rounded-xl text-xs font-bold mt-1 outline-none"
                >
                  <option value="CRC">Colones (₡)</option>
                  <option value="USD">Dólares ($)</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Monto del Egreso ({egresoMoneda === "CRC" ? "₡" : "$"})</Label>
              <Input
                type="number"
                value={egresoMonto}
                onChange={(e) => setEgresoMonto(Number(e.target.value))}
                className="h-9 mt-1 font-mono font-bold text-rose-600"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenNewEgresoModal(false)} className="h-9 text-xs font-normal">Cancelar</Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 text-xs gap-1.5 shadow-md">
                <Check className="h-4 w-4" /> Registrar Egreso en BD
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 1. MODAL FORMULARIO MANUAL EN EFECTIVO (SIN IA) - INGRESO / EGRESO */}
      {/* ========================================================================= */}
      <Dialog open={openManualCashModal} onOpenChange={setOpenManualCashModal}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {manualTipo === "Ingreso" ? (
                <>
                  <Banknote className="h-5 w-5 text-emerald-600" /> 💵 Registrar Pago Manual en Efectivo (Ingreso)
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-rose-600" /> 📉 Registrar Gasto Manual en Efectivo (Egreso)
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              {manualTipo === "Ingreso"
                ? "Formulario rápido para dinero recibido en billetes/efectivo en mano."
                : "Formulario rápido para dinero retirado de la caja física del club."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveManualCash} className="space-y-3.5 text-xs font-normal pt-1">
            {/* Monto Obligatorio */}
            <div>
              <Label className="text-xs font-bold text-foreground">
                Monto {manualTipo === "Ingreso" ? "Entrante" : "Saliente"} en Efectivo *
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2 font-mono font-bold text-muted-foreground text-sm">
                  {manualMoneda === "CRC" ? "₡" : "$"}
                </span>
                <Input
                  type="number"
                  value={manualMonto}
                  onChange={(e) => setManualMonto(Number(e.target.value))}
                  placeholder="25000"
                  className={`pl-8 h-9 font-mono font-bold text-base ${
                    manualTipo === "Ingreso" ? "text-emerald-600 focus-visible:ring-emerald-500" : "text-rose-600 focus-visible:ring-rose-500"
                  }`}
                  required
                />
              </div>
            </div>

            {/* Concepto / Detalle Obligatorio */}
            <div>
              <Label className="text-xs font-bold text-foreground">Concepto / Detalle *</Label>
              <Input
                value={manualConcepto}
                onChange={(e) => setManualConcepto(e.target.value)}
                placeholder={manualTipo === "Ingreso" ? "Ej. Pago de mensualidad Julio - Categoría U-11" : "Ej. Pago de arbitraje partido sábado"}
                className="h-9 mt-1"
                required
              />
            </div>

            {/* Cliente / Proveedor Obligatorio con Búsqueda en Vivo de Alumnos */}
            <div className="relative">
              <Label className="text-xs font-bold text-foreground">
                {manualTipo === "Ingreso" ? "Alumno / Cliente que Paga *" : "Proveedor / Persona Recibió el Dinero *"}
              </Label>
              {manualTipo === "Ingreso" ? (
                <div className="relative mt-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={manualEntidad ? manualEntidad : athleteSearch}
                      onChange={(e) => {
                        setManualEntidad(e.target.value);
                        setAthleteSearch(e.target.value);
                        setShowAthleteDropdown(true);
                      }}
                      onFocus={() => setShowAthleteDropdown(true)}
                      placeholder="Escribe o busca un alumno por nombre, categoría..."
                      className="pl-9 pr-7 h-9 text-xs font-medium bg-background"
                      required
                    />
                    {manualEntidad && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualEntidad("");
                          setAthleteSearch("");
                          setShowAthleteDropdown(true);
                        }}
                        className="absolute right-2.5 top-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Dropdown flotante con lista de alumnos */}
                  {showAthleteDropdown && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-card border border-border shadow-2xl rounded-xl p-1.5 space-y-1 text-xs">
                      <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider flex items-center justify-between border-b border-border/50 pb-1 mb-1">
                        <span>Alumnos Registrados ({filteredJugadores.length})</span>
                        <span className="text-[9px] font-normal lowercase text-muted-foreground">Clic para seleccionar</span>
                      </div>
                      {filteredJugadores.length === 0 ? (
                        <div className="p-3 text-center text-muted-foreground text-[11px]">
                          No se encontró en la base de datos. Se usará el nombre personalizado: <strong>"{athleteSearch}"</strong>
                        </div>
                      ) : (
                        filteredJugadores.map((j) => (
                          <div
                            key={j.id}
                            onClick={() => {
                              const label = `${j.nombre} (${j.categoria || 'Sin Cat.'})`;
                              setManualEntidad(label);
                              setAthleteSearch(label);
                              setManualConcepto(`Pago de mensualidad - ${j.categoria || 'General'}`);
                              setShowAthleteDropdown(false);
                            }}
                            className="p-2 rounded-lg hover:bg-emerald-500/15 dark:hover:bg-emerald-950/50 cursor-pointer flex items-center justify-between transition border border-transparent hover:border-emerald-500/30"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-foreground flex items-center gap-1.5">
                                <span>👤 {j.nombre}</span>
                                {j.categoria && <Badge variant="outline" className="text-[9px] py-0 px-1 font-semibold bg-muted/50">{j.categoria}</Badge>}
                              </div>
                              {j.encargado && (
                                <div className="text-[10px] text-muted-foreground">Encargado: {j.encargado}</div>
                              )}
                            </div>
                            {j.estadoPago === "moroso" && (
                              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] border-none font-bold">
                                Saldo Pendiente
                              </Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Input
                  value={manualEntidad}
                  onChange={(e) => setManualEntidad(e.target.value)}
                  placeholder="Ej. Asociación de Árbitros de San José"
                  className="h-9 mt-1"
                  required
                />
              )}
            </div>

            {/* Método de Pago - Dropdown con opción personalizada */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Método de Pago</Label>
                <select
                  value={manualMetodo.startsWith("__custom__") ? "__custom__" : manualMetodo}
                  onChange={(e) => setManualMetodo(e.target.value === "__custom__" ? "__custom__" : e.target.value)}
                  className="w-full h-9 mt-1 px-2 bg-background border border-border rounded-xl text-xs font-normal outline-none"
                >
                  <option value="Efectivo">Efectivo en Caja</option>
                  <option value="SINPE Móvil">SINPE Móvil</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Tarjeta POS">Tarjeta POS / Datáfono</option>
                  <option value="Cheque">Cheque Bancario</option>
                  <option value="Depósito Bancario">Depósito Bancario</option>
                  <option value="Factura Crédito">Factura a Crédito</option>
                  <option value="PayPal">PayPal</option>
                  <option value="__custom__">✏️ Otro (escribir...)</option>
                </select>
                {(manualMetodo.startsWith("__custom__") || (manualMetodo !== "" && ![
                  "Efectivo","SINPE Móvil","Transferencia Bancaria","Tarjeta POS",
                  "Cheque","Depósito Bancario","Factura Crédito","PayPal"
                ].includes(manualMetodo))) && (
                  <Input
                    value={manualMetodo.startsWith("__custom__") ? "" : manualMetodo}
                    onChange={(e) => setManualMetodo(e.target.value || "__custom__")}
                    placeholder="Ej. Crypto, Banca móvil..."
                    className="h-8 mt-1.5 text-xs"
                    autoFocus
                  />
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Moneda</Label>
                <select
                  value={manualMoneda}
                  onChange={(e: any) => setManualMoneda(e.target.value)}
                  className="w-full h-9 mt-1 px-2 bg-background border border-border rounded-xl text-xs font-bold outline-none"
                >
                  <option value="CRC">Colones (₡)</option>
                  <option value="USD">Dólares ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Categoría</Label>
                <select
                  value={manualCategoria.startsWith("__custom__") ? "__custom__" : manualCategoria}
                  onChange={(e) => setManualCategoria(e.target.value === "__custom__" ? "__custom__" : e.target.value)}
                  className="w-full h-9 mt-1 px-2 bg-background border border-border rounded-xl text-xs font-normal outline-none"
                >
                  {manualTipo === "Ingreso" ? (
                    <>
                      <option value="Mensualidad">Mensualidad Atleta</option>
                      <option value="Matrícula">Matrícula Anual</option>
                      <option value="Uniformes & Tienda">Uniformes & Tienda</option>
                      <option value="Torneos & Eventos">Inscripción a Torneo</option>
                      <option value="Patrocinio">Patrocinio / Sponsor</option>
                      <option value="Alquiler de Instalaciones">Alquiler de Instalaciones</option>
                      <option value="Otro Ingreso">Otro Ingreso</option>
                      <option value="__custom__">✏️ Otra (escribir...)</option>
                    </>
                  ) : (
                    <>
                      <option value="Arbitraje & Eventos">Arbitraje & Eventos</option>
                      <option value="Equipamiento Deportivo">Equipamiento Deportivo</option>
                      <option value="Alimentación & Hidratación">Alimentación & Hidratación</option>
                      <option value="Mantenimiento de Sedes">Mantenimiento de Sedes</option>
                      <option value="Nómina de Staff">Nómina de Staff</option>
                      <option value="Servicios Públicos & Alquiler">Servicios Públicos & Alquiler</option>
                      <option value="Viáticos & Transporte">Viáticos & Transporte</option>
                      <option value="Uniformes & Dotación">Uniformes & Dotación</option>
                      <option value="Médico & Paramédico">Médico & Paramédico</option>
                      <option value="Publicidad & Marketing">Publicidad & Marketing</option>
                      <option value="Eventos & Torneos">Eventos & Torneos</option>
                      <option value="Otros Gastos">Otros Gastos</option>
                      <option value="__custom__">✏️ Otra (escribir...)</option>
                    </>
                  )}
                </select>
                {(manualCategoria.startsWith("__custom__") || (manualCategoria !== "" && ![
                  "Mensualidad","Matrícula","Uniformes & Tienda","Torneos & Eventos","Patrocinio","Alquiler de Instalaciones","Otro Ingreso",
                  "Arbitraje & Eventos","Equipamiento Deportivo","Alimentación & Hidratación","Mantenimiento de Sedes","Nómina de Staff",
                  "Servicios Públicos & Alquiler","Viáticos & Transporte","Uniformes & Dotación","Médico & Paramédico",
                  "Publicidad & Marketing","Eventos & Torneos","Otros Gastos"
                ].includes(manualCategoria))) && (
                  <Input
                    value={manualCategoria.startsWith("__custom__") ? "" : manualCategoria}
                    onChange={(e) => setManualCategoria(e.target.value || "__custom__")}
                    placeholder="Ej. Psicología Deportiva"
                    className="h-8 mt-1.5 text-xs"
                    autoFocus
                  />
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Sede</Label>
                <select
                  value={manualSede}
                  onChange={(e) => setManualSede(e.target.value)}
                  className="w-full h-9 mt-1 px-2 bg-background border border-border rounded-xl text-xs font-normal outline-none"
                >
                  <option value="Sede Central">Sede Central Élite</option>
                  <option value="Sede Norte">Sede Norte</option>
                  <option value="Sede Occidente">Sede Occidente</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border mt-3">
              <Button type="button" variant="outline" onClick={() => setOpenManualCashModal(false)} className="h-9 text-xs font-normal">
                Cancelar
              </Button>
              <Button
                type="submit"
                className={`font-bold h-9 text-xs gap-1.5 shadow-md ${
                  manualTipo === "Ingreso" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
                }`}
              >
                <Check className="h-4 w-4" />
                {manualTipo === "Ingreso" ? "Guardar Pago en Efectivo" : "Guardar Gasto en Efectivo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. MODAL IA COMPROBANTE SINPE / TRANSFERENCIA (INGRESO) */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. MODAL IA COMPROBANTE SINPE / TRANSFERENCIA (INGRESO) */}
      {/* ========================================================================= */}
      <Dialog open={openIAComprobanteModal} onOpenChange={(open) => {
        setOpenIAComprobanteModal(open);
        if (!open) {
          setIaComprobanteFileName(null);
          setIaComprobanteData(null);
        }
      }}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" /> 📸 Validar Comprobante con IA (SINPE / Transferencia)
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Selecciona o arrastra la captura de pantalla del comprobante para extracción automática con visión por IA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs font-normal pt-1">
            {/* Real File Input Dropzone */}
            <input
              type="file"
              id="file-ia-comprobante"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setIaComprobanteFile(file);
                  setIaComprobanteFileName(file.name);
                  setIaComprobanteScanning(true);
                  setTimeout(() => {
                    const res = scanReceiptOrComprobanteSync(file, file.name);
                    setIaComprobanteData({
                      monto: res.monto,
                      cliente: res.cliente,
                      referencia: res.referencia,
                      concepto: res.concepto,
                    });
                    setIaComprobanteScanning(false);
                    toast.success(`✨ ¡${file.name} escaneado con éxito por la IA Visión OCR!`);
                  }, 400);
                }
              }}
            />
            <label
              htmlFor="file-ia-comprobante"
              className="block border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-500/5 rounded-xl p-6 text-center space-y-2 hover:bg-purple-500/10 transition cursor-pointer"
            >
              <UploadCloud className="h-8 w-8 text-purple-600 mx-auto" />
              <div className="font-semibold text-purple-900 dark:text-purple-200">
                {iaComprobanteFileName ? (
                  <span className="text-emerald-600 font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {iaComprobanteFileName}
                  </span>
                ) : (
                  "Haz clic aquí para seleccionar el archivo del comprobante"
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Formatos soportados: PNG, JPG, PDF (Hasta 10MB)</p>
            </label>

            {/* Scan Action Button */}
            {!iaComprobanteData && (
              <Button
                onClick={handleSimulateScanIAComprobante}
                disabled={iaComprobanteScanning}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs gap-2 shadow-md cursor-pointer"
              >
                {iaComprobanteScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Analizando Comprobante con Visión IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Escanear y Validar con IA
                  </>
                )}
              </Button>
            )}

            {/* Scanned Result Preview with Editable Fields */}
            {iaComprobanteData && (
              <div className="bg-purple-500/10 border border-purple-300 dark:border-purple-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-200">
                  <span className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Extracción Completada por IA
                  </span>
                  <Badge className="bg-purple-600 text-white text-[10px]">Verifica los datos extraídos</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-semibold">Monto Detectado (₡)</Label>
                    <Input
                      type="number"
                      value={iaComprobanteData.monto}
                      onChange={(e) => setIaComprobanteData({ ...iaComprobanteData, monto: Number(e.target.value) })}
                      className="h-8 text-xs font-mono font-bold text-purple-700 dark:text-purple-300 bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-semibold">Ref. SINPE / Transf.</Label>
                    <Input
                      value={iaComprobanteData.referencia}
                      onChange={(e) => setIaComprobanteData({ ...iaComprobanteData, referencia: e.target.value })}
                      className="h-8 text-xs font-mono bg-background"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground font-semibold">Atleta / Cliente</Label>
                    <Input
                      value={iaComprobanteData.cliente}
                      onChange={(e) => setIaComprobanteData({ ...iaComprobanteData, cliente: e.target.value })}
                      className="h-8 text-xs font-medium bg-background"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground font-semibold">Concepto</Label>
                    <Input
                      value={iaComprobanteData.concepto}
                      onChange={(e) => setIaComprobanteData({ ...iaComprobanteData, concepto: e.target.value })}
                      className="h-8 text-xs font-medium bg-background"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-purple-200 dark:border-purple-800/60">
                  <Button variant="outline" size="sm" onClick={() => setIaComprobanteData(null)} className="h-8 text-xs font-normal">Re-escanear</Button>
                  <Button size="sm" onClick={handleSaveIAComprobante} className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-8 text-xs gap-1.5">
                    <Check className="h-3.5 w-3.5" /> Confirmar & Guardar Ingreso BD
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3. MODAL IA TIQUETE / FACTURA (EGRESO) */}
      {/* ========================================================================= */}
      <Dialog open={openIATiqueteModal} onOpenChange={(open) => {
        setOpenIATiqueteModal(open);
        if (!open) {
          setIaTiqueteFileName(null);
          setIaTiqueteData(null);
        }
      }}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-600" /> 🧾 Escanear Tiquete / Factura con IA (Egreso)
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Selecciona o arrastra la imagen de la factura o tiquete de compra para procesar el gasto automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs font-normal pt-1">
            {/* Real File Input Dropzone */}
            <input
              type="file"
              id="file-ia-tiquete"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setIaTiqueteFile(file);
                  setIaTiqueteFileName(file.name);
                  setIaTiqueteScanning(true);
                  setTimeout(() => {
                    const res = scanReceiptOrComprobanteSync(file, file.name);
                    setIaTiqueteData({
                      monto: res.monto,
                      proveedor: res.proveedor,
                      concepto: res.concepto,
                      referencia: res.referencia || "#341",
                    });
                    setIaTiqueteScanning(false);
                    toast.success(`✨ ¡${file.name} escaneado con éxito por la IA Visión OCR!`);
                  }, 400);
                }
              }}
            />
            <label
              htmlFor="file-ia-tiquete"
              className="block border-2 border-dashed border-amber-300 dark:border-amber-800 bg-amber-500/5 rounded-xl p-6 text-center space-y-2 hover:bg-amber-500/10 transition cursor-pointer"
            >
              <UploadCloud className="h-8 w-8 text-amber-600 mx-auto" />
              <div className="font-semibold text-amber-900 dark:text-amber-200">
                {iaTiqueteFileName ? (
                  <span className="text-emerald-600 font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {iaTiqueteFileName}
                  </span>
                ) : (
                  "Haz clic aquí para seleccionar la imagen del tiquete/factura"
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Formatos soportados: PNG, JPG, PDF (Hasta 10MB)</p>
            </label>

            {/* Scan Action Button */}
            {!iaTiqueteData && (
              <Button
                onClick={handleSimulateScanIATiquete}
                disabled={iaTiqueteScanning}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 text-xs gap-2 shadow-md cursor-pointer"
              >
                {iaTiqueteScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Procesando Factura con Visión IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Escanear Factura con Visión IA
                  </>
                )}
              </Button>
            )}

            {/* Scanned Result Preview with Editable Fields */}
            {iaTiqueteData && (
              <div className="bg-amber-500/10 border border-amber-300 dark:border-amber-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                  <span className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Extracción de Factura Completada
                  </span>
                  <Badge className="bg-amber-600 text-white text-[10px]">Verifica los datos extraídos</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-semibold">Monto Total (₡)</Label>
                    <Input
                      type="number"
                      value={iaTiqueteData.monto}
                      onChange={(e) => setIaTiqueteData({ ...iaTiqueteData, monto: Number(e.target.value) })}
                      className="h-8 text-xs font-mono font-bold text-rose-600 bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground font-semibold">N° Factura / Consecutivo</Label>
                    <Input
                      value={iaTiqueteData.referencia || ""}
                      onChange={(e) => setIaTiqueteData({ ...iaTiqueteData, referencia: e.target.value })}
                      placeholder="Ej: #341 o N° 0284"
                      className="h-8 text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-background"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground font-semibold font-semibold">Establecimiento / Proveedor</Label>
                    <Input
                      value={iaTiqueteData.proveedor}
                      onChange={(e) => setIaTiqueteData({ ...iaTiqueteData, proveedor: e.target.value })}
                      className="h-8 text-xs font-medium bg-background"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground font-semibold font-semibold">Detalle de Compra</Label>
                    <Input
                      value={iaTiqueteData.concepto}
                      onChange={(e) => setIaTiqueteData({ ...iaTiqueteData, concepto: e.target.value })}
                      className="h-8 text-xs font-medium bg-background"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-amber-200 dark:border-amber-800/60">
                  <Button variant="outline" size="sm" onClick={() => setIaTiqueteData(null)} className="h-8 text-xs font-normal">Re-escanear</Button>
                  <Button size="sm" onClick={handleSaveIATiquete} className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-8 text-xs gap-1.5">
                    <Check className="h-3.5 w-3.5" /> Registrar Egreso en BD
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ✏️ MODAL DE EDICIÓN DE MOVIMIENTO */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-500" />
              Editar Movimiento Financiero
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-normal">
              Modifica los datos del movimiento y guarda los cambios en la BD.
            </DialogDescription>
          </DialogHeader>

          {movementToEdit && (
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs font-normal">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Fecha</Label>
                  <Input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} className="h-9 mt-1 text-xs" required />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Monto ({movementToEdit.moneda === "USD" ? "$" : "₡"})</Label>
                  <Input type="number" value={editMonto} onChange={(e) => setEditMonto(Number(e.target.value))} className="h-9 mt-1 font-mono font-bold" required />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Concepto / Detalle</Label>
                <Input value={editConcepto} onChange={(e) => setEditConcepto(e.target.value)} className="h-9 mt-1" required />
              </div>

              <div>
                <Label className="text-xs font-semibold">{movementToEdit.tipo === "Entrada" ? "Cliente / Atleta" : "Proveedor / Persona"}</Label>
                <Input value={editEntidad} onChange={(e) => setEditEntidad(e.target.value)} className="h-9 mt-1" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Categoría</Label>
                  <select
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className="w-full h-9 mt-1 px-2 bg-background border border-border rounded-xl text-xs font-normal outline-none"
                  >
                    {movementToEdit.tipo === "Entrada" ? (
                      <>
                        <option value="Mensualidad">Mensualidad Atleta</option>
                        <option value="Matrícula">Matrícula Anual</option>
                        <option value="Uniformes & Tienda">Uniformes & Tienda</option>
                        <option value="Torneos & Eventos">Inscripción a Torneo</option>
                        <option value="Patrocinio">Patrocinio / Sponsor</option>
                        <option value="Alquiler de Instalaciones">Alquiler de Instalaciones</option>
                        <option value="Otro Ingreso">Otro Ingreso</option>
                      </>
                    ) : (
                      <>
                        <option value="Arbitraje & Eventos">Arbitraje & Eventos</option>
                        <option value="Equipamiento Deportivo">Equipamiento Deportivo</option>
                        <option value="Alimentación & Hidratación">Alimentación & Hidratación</option>
                        <option value="Mantenimiento de Sedes">Mantenimiento de Sedes</option>
                        <option value="Nómina de Staff">Nómina de Staff</option>
                        <option value="Servicios Públicos & Alquiler">Servicios Públicos & Alquiler</option>
                        <option value="Viáticos & Transporte">Viáticos & Transporte</option>
                        <option value="Uniformes & Dotación">Uniformes & Dotación</option>
                        <option value="Médico & Paramédico">Médico & Paramédico</option>
                        <option value="Publicidad & Marketing">Publicidad & Marketing</option>
                        <option value="Eventos & Torneos">Eventos & Torneos</option>
                        <option value="Otros Gastos">Otros Gastos</option>
                      </>
                    )}
                    <option value={editCategoria} hidden>{editCategoria}</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Método de Pago</Label>
                  <select
                    value={editMetodo}
                    onChange={(e) => setEditMetodo(e.target.value)}
                    className="w-full h-9 mt-1 px-2 bg-background border border-border rounded-xl text-xs font-normal outline-none"
                  >
                    <option value="Efectivo">Efectivo en Caja</option>
                    <option value="SINPE Móvil">SINPE Móvil</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Tarjeta POS">Tarjeta POS / Datáfono</option>
                    <option value="Cheque">Cheque Bancario</option>
                    <option value="Depósito Bancario">Depósito Bancario</option>
                    <option value="Factura Crédito">Factura a Crédito</option>
                    <option value="Factura / Tiquete IA">Factura / Tiquete IA</option>
                    <option value={editMetodo} hidden>{editMetodo}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} className="h-9 text-xs font-normal">Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5">
                  <Pencil className="h-4 w-4" /> Guardar Cambios
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 🗑️ MODAL ELEGANTE DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <Dialog open={deleteConfirmModalOpen} onOpenChange={setDeleteConfirmModalOpen}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> ¿Eliminar Movimiento Financiero?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-normal">
              Esta acción eliminará de forma permanente el registro de la base de datos de Supabase y recalculará el balance.
            </DialogDescription>
          </DialogHeader>

          {movementToDelete && (
            <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2.5 text-xs font-normal">
              <div className="flex items-center justify-between">
                <Badge className={movementToDelete.tipo === "Entrada" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-bold" : "bg-rose-500/15 text-rose-600 border-rose-500/30 font-bold"}>
                  {movementToDelete.tipo === "Entrada" ? "🟢 Entrada" : "🔴 Salida"}
                </Badge>
                <span className="font-mono text-muted-foreground">{movementToDelete.fecha}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Concepto / Detalle</span>
                <span className="font-semibold text-foreground text-sm leading-snug block">{movementToDelete.concepto}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-border/60">
                <span className="text-muted-foreground">{movementToDelete.entidad}</span>
                <span className={`font-mono font-black text-sm ${movementToDelete.tipo === "Entrada" ? "text-emerald-600" : "text-rose-600"}`}>
                  {movementToDelete.tipo === "Entrada" ? "+" : "-"}{currencySymbol}{movementToDelete.monto.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmModalOpen(false);
                setMovementToDelete(null);
              }}
              className="text-xs h-9 rounded-xl border-border font-normal"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDeleteMovimiento}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm rounded-xl px-4"
            >
              <Trash2 className="h-4 w-4" /> Sí, Eliminar de la BD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
