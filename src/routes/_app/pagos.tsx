import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCRC } from "@/lib/mock-data";
import {
  Plus, Search, Download, DollarSign, Zap, Pencil, Check, X,
  AlertTriangle, CalendarClock, CheckSquare, Users, Trash2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import RendimientoStore, { StoreJugador } from "@/lib/rendimiento-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pagos")({ component: PagosPage });

function fmt(n: number) {
  return "₡" + n.toLocaleString("es-CR");
}

function PagosPage() {
  const [q, setQ] = useState("");
  const [pagosList, setPagosList] = useState<any[]>([]);
  const [allPlayers, setAllPlayers] = useState<StoreJugador[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  // Inline edit mensualidad categoría
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCosto, setEditingCosto] = useState("");

  // Modal generar cobros del mes
  const [openGenerar, setOpenGenerar] = useState(false);

  // Modal pago individual
  const [openIndividual, setOpenIndividual] = useState(false);
  const [selJugId, setSelJugId] = useState("");
  const [montoInd, setMontoInd] = useState("");
  const [metodoInd, setMetodoInd] = useState("Sinpe Móvil");
  const [refInd, setRefInd] = useState("");

  // Modal cobro masivo
  const [openMasivo, setOpenMasivo] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [metodoPago, setMetodoPago] = useState("Sinpe Móvil");
  const [refMasiva, setRefMasiva] = useState("");

  // Modal exportar
  const [openExport, setOpenExport] = useState(false);

  // Modal revertir pago
  const [revertTarget, setRevertTarget] = useState<{ id: string; nombre: string; monto: number } | null>(null);

  const refreshData = () => {
    const jugadores = RendimientoStore.getJugadores();
    setPagosList(RendimientoStore.getPagos());
    setAllPlayers(jugadores);
    setCategorias(RendimientoStore.getCategorias());
  };

  // Migración única: corregir pagos sin categoría en localStorage
  useEffect(() => {
    const norm = (s: string) =>
      (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const jugadores = RendimientoStore.getJugadores();
    const stored: any[] = JSON.parse(localStorage.getItem("pagos_dynamics") || "[]");
    let changed = false;

    const patched = stored.map(p => {
      if (p.categoria && p.categoria !== "Sin categoría") return p;
      const player =
        jugadores.find(j => j.id === p.jugadorId) ||
        jugadores.find(j => norm(j.nombre) === norm(p.jugador));
      if (player) {
        changed = true;
        return { ...p, categoria: player.categoria };
      }
      return p;
    });

    if (changed) {
      localStorage.setItem("pagos_dynamics", JSON.stringify(patched));
      setPagosList(RendimientoStore.getPagos());
    }
  }, []);

  useEffect(() => { refreshData(); }, []);

  const jugadoresConDeuda = allPlayers.filter(j => (j.saldo || 0) > 0);
  const pendientesCount = allPlayers.filter(j => j.estadoPago === "pendiente").length;
  const morososCount = allPlayers.filter(j => j.estadoPago === "moroso").length;
  const totalRecaudado = pagosList.reduce((acc, p) => acc + (p.monto || 0), 0);

  // ── Generar cobros ──
  const handleGenerarCobros = () => {
    const cats = RendimientoStore.getCategorias();
    let updated = 0;
    RendimientoStore.getJugadores().forEach(p => {
      if (p.estadoPago === "al_dia") {
        const cat = cats.find(c => c.nombre === p.categoria);
        const costo = cat?.costoMensual ?? 30000;
        RendimientoStore.updateJugador(p.id, { saldo: costo, estadoPago: "pendiente" });
        updated++;
      }
    });
    toast.success(`${updated} jugadores ahora tienen cobro pendiente`);
    setOpenGenerar(false);
    refreshData();
  };

  // ── Editar mensualidad ──
  const handleSaveCosto = (catId: string) => {
    const val = parseInt(editingCosto.replace(/\D/g, ""), 10);
    if (!val || val <= 0) { toast.error("Ingresa un monto válido"); return; }
    RendimientoStore.updateCategoria(catId, { costoMensual: val });
    toast.success("Mensualidad actualizada");
    setEditingCatId(null);
    refreshData();
  };

  // ── Pago individual ──
  const openModalIndividual = () => {
    const fresh = RendimientoStore.getJugadores().filter(j => (j.saldo || 0) > 0);
    setAllPlayers(RendimientoStore.getJugadores());
    if (fresh.length === 0) {
      toast.warning("Ningún jugador tiene saldo pendiente. Genera cobros del mes primero.");
      return;
    }
    const first = fresh[0];
    setSelJugId(first.id);
    setMontoInd(String(first.saldo || ""));
    setMetodoInd("Sinpe Móvil");
    setRefInd("");
    setOpenIndividual(true);
  };

  const handleJugadorChange = (id: string) => {
    setSelJugId(id);
    const found = jugadoresConDeuda.find(j => j.id === id);
    if (found) setMontoInd(String(found.saldo || ""));
  };

  const handlePagoIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selJugId || !montoInd) { toast.error("Completa los campos obligatorios"); return; }
    const player = RendimientoStore.getJugadores().find(j => j.id === selJugId);
    if (!player) return;
    RendimientoStore.addPago({
      jugadorId: player.id,
      jugadorNombre: player.nombre,
      monto: Number(montoInd),
      metodo: metodoInd,
      referencia: refInd,
    });
    toast.success(`Pago de ${fmt(Number(montoInd))} registrado para ${player.nombre}`);
    setOpenIndividual(false);
    refreshData();
  };

  const jugSel = jugadoresConDeuda.find(j => j.id === selJugId);
  const catSel = jugSel ? categorias.find(c => c.nombre === jugSel.categoria) : null;

  // ── Cobro masivo ──
  const openModalMasivo = () => {
    const fresh = RendimientoStore.getJugadores().filter(j => (j.saldo || 0) > 0);
    setAllPlayers(RendimientoStore.getJugadores());
    if (fresh.length === 0) {
      toast.warning("Ningún jugador tiene saldo pendiente. Genera cobros del mes primero.");
      return;
    }
    setSelectedIds(new Set());
    setMetodoPago("Sinpe Móvil");
    setRefMasiva("");
    setOpenMasivo(true);
  };

  const togglePlayer = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === jugadoresConDeuda.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(jugadoresConDeuda.map(j => j.id)));
    }
  };

  const totalSeleccionado = [...selectedIds].reduce((acc, id) => {
    const j = jugadoresConDeuda.find(x => x.id === id);
    return acc + (j?.saldo || 0);
  }, 0);

  const handlePagoMasivo = () => {
    if (selectedIds.size === 0) { toast.error("Selecciona al menos un jugador"); return; }
    let count = 0;
    const freshPlayers = RendimientoStore.getJugadores();
    selectedIds.forEach(id => {
      const player = freshPlayers.find(j => j.id === id);
      if (!player) return;
      RendimientoStore.addPago({
        jugadorId: player.id,
        jugadorNombre: player.nombre,
        monto: player.saldo || 0,
        metodo: metodoPago,
        referencia: refMasiva,
      });
      count++;
    });
    toast.success(`${count} pagos registrados correctamente`);
    setOpenMasivo(false);
    refreshData();
  };

  const filtered = pagosList.filter(p => {
    if (!q) return true;
    const s = q.toLowerCase().trim();
    return (
      (p.jugador || "").toLowerCase().includes(s) ||
      (p.categoria || "").toLowerCase().includes(s)
    );
  });

  // ── Revertir Pago ──
  const handleRevertPago = (pagoId: string, jugadorNombre: string, monto: number) => {
    setRevertTarget({ id: pagoId, nombre: jugadorNombre, monto });
  };

  const confirmRevert = () => {
    if (!revertTarget) return;
    RendimientoStore.revertPago(revertTarget.id);
    toast.success(`Pago de ${revertTarget.nombre} revertido con éxito.`);
    setRevertTarget(null);
    refreshData();
  };

  // ── Exportar XLSX (Excel con diseño y formato) ──
  const handleExport = async (catFilter: string | null) => {
    try {
      const XLSX = await import("xlsx");
      
      const players = catFilter
        ? allPlayers.filter(j => j.categoria === catFilter)
        : allPlayers;

      // Obtener datos del club / organización activa
      const activeOrgId = RendimientoStore.getActiveOrganizacionId();
      const activeOrg = RendimientoStore.getOrganizaciones().find(o => o.id === activeOrgId);
      const clubName = activeOrg?.nombre || "DEPORTIVOS ACADEMY";

      // 1. Crear el bloque de encabezado elegante
      const headerRows = [
        [clubName.toUpperCase()],
        ["REPORTE ESTRATÉGICO DE PAGOS Y MENSUALIDADES"],
        [`Fecha de Emisión: ${new Date().toLocaleDateString("es-CR")} ${new Date().toLocaleTimeString("es-CR")}`],
        [`Filtro Aplicado: ${catFilter ? `Categoría ${catFilter}` : "Consolidado General"}`],
        [], // Espaciador
        ["RESUMEN DE ESTADO FINANCIERO"],
        [
          `Total Alumnos: ${players.length}`,
          `Al Día: ${players.filter(p => p.estadoPago === "al_dia").length}`,
          `Pendientes: ${players.filter(p => p.estadoPago === "pendiente").length}`,
          `En Mora: ${players.filter(p => p.estadoPago === "moroso").length}`,
          `Total Deuda: ₡${players.reduce((acc, p) => acc + (p.saldo || 0), 0).toLocaleString("es-CR")}`
        ],
        [], // Espaciador
      ];

      // 2. Encabezados de la Tabla de Datos
      const tableHeaders = [
        "#",
        "Nombre del Alumno",
        "Categoría",
        "Sede",
        "Estado de Pago",
        "Monto Pendiente",
        "Nombre Encargado",
        "Teléfono Encargado"
      ];

      // 3. Filas de Datos
      const dataRows = players.map((j, idx) => [
        idx + 1,
        j.nombre,
        j.categoria || "Sin categoría",
        j.sede || "Sin sede",
        j.estadoPago === "al_dia" ? "Al día" : j.estadoPago === "moroso" ? "Moroso" : "Pendiente",
        j.saldo || 0,
        j.encargado || "No registrado",
        j.telefonoEncargado || "No registrado"
      ]);

      // Unir todo en una estructura de matriz única para la hoja
      const finalMatrix = [
        ...headerRows,
        tableHeaders,
        ...dataRows
      ];

      // Crear la hoja a partir de la matriz 2D
      const worksheet = XLSX.utils.aoa_to_sheet(finalMatrix);

      // Combinar celdas para el diseño del encabezado
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Club Name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Subtitle
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // Date
        { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } }, // Filter
        { s: { r: 5, c: 0 }, e: { r: 5, c: 7 } }, // Summary Title
        { s: { r: 6, c: 0 }, e: { r: 6, c: 7 } }, // Summary KPI string
      ];

      // Configurar anchos de columna óptimos
      worksheet["!cols"] = [
        { wch: 6 },   // #
        { wch: 30 },  // Nombre del Alumno
        { wch: 14 },  // Categoría
        { wch: 16 },  // Sede
        { wch: 16 },  // Estado de Pago
        { wch: 18 },  // Monto Pendiente
        { wch: 25 },  // Nombre Encargado
        { wch: 20 },  // Teléfono Encargado
      ];

      // Formatear la columna de Monto Pendiente como Moneda (Columna F / índice 5, comenzando en la fila 9)
      const startRowIndex = headerRows.length + 1; // Fila donde inician los datos (1-based index corregido)
      for (let r = startRowIndex; r < finalMatrix.length; r++) {
        const cellRef = XLSX.utils.encode_cell({ r, c: 5 });
        if (worksheet[cellRef]) {
          worksheet[cellRef].t = "n"; // Tipo numérico
          worksheet[cellRef].z = '"₡"#,##0'; // Formato de moneda Colón
        }
      }

      // Crear libro de trabajo y descargar
      const workbook = XLSX.utils.book_new();
      const sheetName = catFilter ? catFilter.slice(0, 30) : "Estado de Cuenta";
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const filename = catFilter
        ? `Reporte_Pagos_${catFilter.replace(/\s+/g, "_")}.xlsx`
        : `Reporte_Pagos_Consolidado.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast.success(`Excel corporativo descargado: ${filename}`);
      setOpenExport(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar el reporte corporativo en Excel");
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pagos & Mensualidades</h1>
          <p className="text-sm text-muted-foreground">Gestión de cobros, tarifas y estados de cuenta.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpenExport(true)}>
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Button
            variant="outline" size="sm"
            className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
            onClick={() => setOpenGenerar(true)}
          >
            <Zap className="h-4 w-4 mr-1" /> Generar Cobros del Mes
          </Button>
          <Button
            variant="outline" size="sm"
            className="border-primary/40 text-primary hover:bg-primary/10"
            onClick={openModalMasivo}
          >
            <CheckSquare className="h-4 w-4 mr-1" /> Cobro Masivo
          </Button>
          <Button onClick={openModalIndividual} className="bg-gradient-primary shadow-elegant" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Pago Individual
          </Button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card"><CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center"><DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
          <div><p className="text-xs text-muted-foreground">Total Recaudado</p><p className="text-lg font-bold">{fmt(totalRecaudado)}</p></div>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/15 flex items-center justify-center"><CalendarClock className="h-5 w-5 text-amber-500" /></div>
          <div><p className="text-xs text-muted-foreground">Pendientes</p><p className="text-lg font-bold">{pendientesCount} jugadores</p></div>
        </CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-destructive/15 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-xs text-muted-foreground">En Mora</p><p className="text-lg font-bold">{morososCount} jugadores</p></div>
        </CardContent></Card>
      </div>

      {/* ── Mensualidades por categoría ── */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Mensualidades por Categoría</CardTitle>
          <CardDescription className="text-xs">Clic en ✏️ para editar el costo mensual de cada categoría.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {categorias.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay categorías registradas.</p>
          ) : (
            <div className="divide-y divide-border">
              {categorias.map(cat => {
                const enCat = allPlayers.filter(j => j.categoria === cat.nombre);
                const pagaron = enCat.filter(j => j.estadoPago === "al_dia").length;
                const pendientes = enCat.filter(j => j.estadoPago === "pendiente").length;
                const morosos = enCat.filter(j => j.estadoPago === "moroso").length;
                const total = enCat.length;
                const pct = total > 0 ? Math.round((pagaron / total) * 100) : 0;
                return (
                <div key={cat.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold">{cat.nombre}</p>
                        <span className="text-xs text-muted-foreground">({total} jugadores)</span>
                      </div>
                      {/* Barra de progreso de pago */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{pct}%</span>
                      </div>
                      {/* Contadores */}
                      <div className="flex gap-3 mt-1.5">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">✓ {pagaron} pagaron</span>
                        {pendientes > 0 && <span className="text-[11px] font-bold text-amber-500">⏳ {pendientes} pendientes</span>}
                        {morosos > 0 && <span className="text-[11px] font-bold text-rose-600">⚠ {morosos} morosos</span>}
                      </div>
                    </div>
                    {/* Mensualidad editable */}
                    <div className="flex items-center gap-2 shrink-0">
                      {editingCatId === cat.id ? (
                        <>
                          <Input autoFocus type="number" value={editingCosto}
                            onChange={e => setEditingCosto(e.target.value)}
                            className="h-8 w-28 text-sm" placeholder="30000" />
                          <button onClick={() => handleSaveCosto(cat.id)} className="text-success"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingCatId(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                        </>
                      ) : (
                        <>
                          <div className="text-right">
                            <p className="text-sm font-bold text-success">{fmt(cat.costoMensual ?? 30000)}<span className="text-xs font-normal text-muted-foreground ml-1">/mes</span></p>
                            <p className="text-[11px] text-success">{fmt((cat.costoMensual ?? 30000) * pagaron)} recaudado</p>
                          </div>
                          <button onClick={() => { setEditingCatId(cat.id); setEditingCosto(String(cat.costoMensual ?? 30000)); }}
                            className="text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Historial ── */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar jugador..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Referencia</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-center w-20">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="h-8 w-8 opacity-20" />
                        <p className="font-medium">Sin pagos registrados</p>
                        <p className="text-xs">Genera los cobros del mes y registra los pagos recibidos.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.referencia}</TableCell>
                    <TableCell className="font-medium text-sm">{p.jugador}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[11px] font-bold">
                        {p.categoria || "Sin categoría"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.metodo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.fecha}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold border-none px-2.5 py-0.5 rounded-full text-[11px]">completado</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{fmt(p.monto)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRevertPago(p.id, p.jugador, p.monto)}
                        title="Revertir Pago"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {/* ════════════════════════════════════════════
          MODAL 1: Generar cobros del mes
      ════════════════════════════════════════════ */}
      <Dialog open={openGenerar} onOpenChange={setOpenGenerar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> Generar Cobros del Mes
            </DialogTitle>
            <DialogDescription>
              Aplica el costo mensual de cada categoría a todos los jugadores que están al día. No duplica cobros existentes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            {categorias.map(cat => {
              const count = allPlayers.filter(j => j.categoria === cat.nombre && j.estadoPago === "al_dia").length;
              return (
                <div key={cat.id} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                  <span className="font-medium">{cat.nombre}</span>
                  <span className="text-xs text-muted-foreground">{count} al día</span>
                  <span className="font-bold text-success">{fmt(cat.costoMensual ?? 30000)}</span>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground pt-2">
              Recibirán cobro: <strong>{allPlayers.filter(j => j.estadoPago === "al_dia").length} jugadores</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenGenerar(false)}>Cancelar</Button>
            <Button className="bg-amber-500 text-white hover:bg-amber-600" onClick={handleGenerarCobros}>
              <Zap className="h-4 w-4 mr-1" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ════════════════════════════════════════════
          MODAL 2: Pago Individual
      ════════════════════════════════════════════ */}
      <Dialog open={openIndividual} onOpenChange={setOpenIndividual}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" /> Pago Individual
            </DialogTitle>
            <DialogDescription>
              Aplica un pago al saldo pendiente del jugador seleccionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePagoIndividual} className="space-y-4">
            {/* Selector jugador */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Jugador *</Label>
              <select
                value={selJugId}
                onChange={e => handleJugadorChange(e.target.value)}
                className="h-10 px-3 rounded-md border bg-card text-sm text-foreground"
                required
              >
                <option value="">-- Seleccionar --</option>
                {jugadoresConDeuda.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} — {fmt(j.saldo || 0)}
                  </option>
                ))}
              </select>

              {/* Detalle jugador seleccionado */}
              {jugSel && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 grid grid-cols-2 gap-y-1.5 text-xs mt-1">
                  <span className="text-muted-foreground">Categoría</span>
                  <span className="font-semibold text-right">{jugSel.categoria}</span>
                  <span className="text-muted-foreground">Mensualidad</span>
                  <span className="font-semibold text-success text-right">{fmt(catSel?.costoMensual ?? 30000)}/mes</span>
                  <span className="text-muted-foreground font-medium border-t pt-1">Saldo pendiente</span>
                  <span className="font-bold text-destructive text-right border-t pt-1">{fmt(jugSel.saldo || 0)}</span>
                </div>
              )}
            </div>

            {/* Monto y método */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Monto (₡) *</Label>
                <Input
                  type="number" value={montoInd}
                  onChange={e => setMontoInd(e.target.value)}
                  min={1} required placeholder="Ej: 25000"
                />
                {montoInd && Number(montoInd) > 0 && (
                  <p className="text-[10px] text-muted-foreground">{fmt(Number(montoInd))}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Método *</Label>
                <select
                  value={metodoInd}
                  onChange={e => setMetodoInd(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-card text-sm text-foreground"
                >
                  <option>Sinpe Móvil</option>
                  <option>Transferencia</option>
                  <option>Efectivo</option>
                  <option>Tarjeta</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Referencia</Label>
              <Input value={refInd} onChange={e => setRefInd(e.target.value)} placeholder="Ej. #908234" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenIndividual(false)}>Cancelar</Button>
              <Button type="submit" className="bg-success text-success-foreground hover:bg-success/90">Confirmar Pago</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* ════════════════════════════════════════════
          MODAL 3: Cobro Masivo con checkboxes
      ════════════════════════════════════════════ */}
      <Dialog open={openMasivo} onOpenChange={setOpenMasivo}>
        <DialogContent className="max-w-xl flex flex-col" style={{ maxHeight: "88vh" }}>
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" /> Cobro Masivo
            </DialogTitle>
            <DialogDescription>
              Marca los jugadores que ya pagaron. Se registra el saldo pendiente actual de cada uno.
            </DialogDescription>
          </DialogHeader>

          {/* Método y referencia global */}
          <div className="grid grid-cols-2 gap-3 shrink-0 pb-3 border-b">
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-semibold">Método de Pago</Label>
              <select
                value={metodoPago}
                onChange={e => setMetodoPago(e.target.value)}
                className="h-9 px-3 rounded-md border bg-card text-sm text-foreground"
              >
                <option>Sinpe Móvil</option>
                <option>Transferencia</option>
                <option>Efectivo</option>
                <option>Tarjeta</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-semibold">Referencia (opcional)</Label>
              <Input value={refMasiva} onChange={e => setRefMasiva(e.target.value)}
                placeholder="Ej: Depósito julio" className="h-9 text-sm" />
            </div>
          </div>

          {/* Barra seleccionar todos + contador */}
          <div className="shrink-0 flex items-center justify-between py-2 border-b">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary rounded cursor-pointer"
                checked={selectedIds.size === jugadoresConDeuda.length && jugadoresConDeuda.length > 0}
                onChange={toggleAll}
              />
              <span className="text-xs font-semibold">
                Seleccionar todos ({jugadoresConDeuda.length})
              </span>
            </label>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
              selectedIds.size > 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {selectedIds.size} seleccionados — {fmt(totalSeleccionado)}
            </span>
          </div>

          {/* Lista scrollable de jugadores */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {jugadoresConDeuda.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Users className="h-8 w-8 opacity-20" />
                <p className="text-sm">No hay jugadores con saldo pendiente.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {jugadoresConDeuda.map(j => {
                  const isSelected = selectedIds.has(j.id);
                  return (
                    <div
                      key={j.id}
                      onClick={() => togglePlayer(j.id)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${
                        isSelected ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary rounded cursor-pointer shrink-0"
                        checked={isSelected}
                        onChange={() => togglePlayer(j.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{j.nombre}</p>
                        <p className="text-xs text-muted-foreground">{j.categoria}{j.sede ? ` · ${j.sede}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{fmt(j.saldo || 0)}</p>
                        <span className={`text-[10px] font-semibold ${
                          j.estadoPago === "moroso" ? "text-destructive" : "text-amber-500"
                        }`}>
                          {j.estadoPago === "moroso" ? "MOROSO" : "PENDIENTE"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t pt-3">
            <Button variant="outline" onClick={() => setOpenMasivo(false)}>Cancelar</Button>
            <Button
              disabled={selectedIds.size === 0}
              onClick={handlePagoMasivo}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              <Users className="h-4 w-4 mr-1" />
              Confirmar {selectedIds.size > 0 ? `${selectedIds.size} pagos` : "pagos"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════
          MODAL: Exportar reporte
      ════════════════════════════════════════════ */}
      <Dialog open={openExport} onOpenChange={setOpenExport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" /> Exportar Reporte de Pagos
            </DialogTitle>
            <DialogDescription>
              Elige exportar el reporte total o filtrado por categoría. Se descarga como archivo CSV (compatible con Excel).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {/* Opción: Total */}
            <button
              onClick={() => handleExport(null)}
              className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
            >
              <div>
                <p className="text-sm font-bold group-hover:text-primary transition-colors">Reporte Total</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Todos los jugadores · {allPlayers.filter(j => j.estadoPago === "al_dia").length} pagaron ·{" "}
                  {allPlayers.filter(j => j.estadoPago !== "al_dia").length} deben
                </p>
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
            </button>

            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2">
              Por Categoría
            </div>

            {/* Opciones por categoría */}
            {categorias.map(cat => {
              const enCat = allPlayers.filter(j => j.categoria === cat.nombre);
              const pagaron = enCat.filter(j => j.estadoPago === "al_dia").length;
              const deben = enCat.filter(j => j.estadoPago !== "al_dia").length;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleExport(cat.nombre)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
                >
                  <div>
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{cat.nombre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {enCat.length} jugadores ·{" "}
                      <span className="text-success font-medium">{pagaron} pagaron</span>
                      {deben > 0 && <span className="text-destructive font-medium"> · {deben} deben</span>}
                    </p>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenExport(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════
          MODAL: Confirmar reversión de pago
      ════════════════════════════════════════════ */}
      <Dialog open={!!revertTarget} onOpenChange={open => { if (!open) setRevertTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Revertir Pago
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <span className="block text-sm text-muted-foreground">
                ¿Estás seguro de que deseas revertir este pago?
              </span>
              {revertTarget && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jugador</span>
                    <span className="font-semibold text-foreground">{revertTarget.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto</span>
                    <span className="font-bold text-destructive">{fmt(revertTarget.monto)}</span>
                  </div>
                </div>
              )}
              <span className="block text-xs text-muted-foreground">
                Esto eliminará el registro del historial y restaurará el saldo pendiente del jugador.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setRevertTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmRevert}>
              Sí, revertir pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
