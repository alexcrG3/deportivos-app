import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PlusCircle,
  Receipt,
  Search,
  Printer,
  Download,
  Trash2,
  FileText,
  Building2,
  DollarSign,
  Calendar,
  Tag,
  CreditCard,
  CheckCircle2,
  ShoppingBag,
  TrendingDown,
  Upload,
  Eye,
  Filter
} from "lucide-react";
import RendimientoStore, { StoreEgreso, MONEDAS_LATAM } from "@/lib/rendimiento-store";
import { toast } from "sonner";

const CATEGORIAS_GASTO = [
  "Equipamiento Deportivo",
  "Mantenimiento y Servicios",
  "Arbitraje y Torneaje",
  "Transporte y Viajes",
  "Alimentación e Hidratación",
  "Salarios y Honorarios",
  "Marketing y Publicidad",
  "Gastos Administrativos",
  "Otro"
];

const METODOS_PAGO = [
  "Transferencia SINPE",
  "Transferencia Banco",
  "Efectivo",
  "Tarjeta de Crédito / Débito",
  "Cheque"
];

const SEDES_LIST = [
  "Sede Central",
  "Sede Este",
  "Sede Norte",
  "Sede Sur",
  "Cobertura General"
];

export function FinanzasEgresos() {
  const [egresos, setEgresos] = useState<StoreEgreso[]>([]);

  // Form State
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS_GASTO[0]);
  const [sede, setSede] = useState(SEDES_LIST[0]);
  const [monedaCode, setMonedaCode] = useState("CRC");
  const [precioUnitario, setPrecioUnitario] = useState<number | "">(0);
  const [cantidad, setCantidad] = useState<number | "">(1);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [descripcion, setDescripcion] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [comprobanteFile, setComprobanteFile] = useState<string | null>(null);

  // Filters State
  const [searchFilter, setSearchFilter] = useState("");
  const [sedeFilter, setSedeFilter] = useState("Todas");
  const [monedaFilter, setMonedaFilter] = useState("Todas");
  const [categoriaFilter, setCategoriaFilter] = useState("Todas");

  useEffect(() => {
    setEgresos(RendimientoStore.getEgresos());
  }, []);

  const selectedMonedaObj = useMemo(() => {
    return MONEDAS_LATAM.find((m) => m.code === monedaCode) || MONEDAS_LATAM[0];
  }, [monedaCode]);

  const totalCalculadoForm = useMemo(() => {
    const p = typeof precioUnitario === "number" ? precioUnitario : 0;
    const c = typeof cantidad === "number" ? cantidad : 0;
    return p * c;
  }, [precioUnitario, cantidad]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprobanteFile(file.name);
      toast.success(`Archivo "${file.name}" cargado como comprobante.`);
    }
  };

  const handleSaveEgreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("Por favor ingrese el nombre del producto o servicio.");
      return;
    }
    const pUnit = typeof precioUnitario === "number" ? precioUnitario : 0;
    const cant = typeof cantidad === "number" ? cantidad : 1;
    if (pUnit <= 0) {
      toast.error("Ingrese un precio unitario válido.");
      return;
    }

    const newEgreso = RendimientoStore.addEgreso({
      nombre: nombre.trim(),
      categoria,
      sede,
      moneda: selectedMonedaObj.code,
      simboloMoneda: selectedMonedaObj.symbol,
      precioUnitario: pUnit,
      cantidad: cant,
      montoTotal: pUnit * cant,
      fecha,
      descripcion: descripcion.trim() || "Sin descripción adicional",
      comprobante: comprobanteFile || undefined,
      metodoPago,
      proveedor: proveedor.trim() || "Proveedor General"
    });

    setEgresos(RendimientoStore.getEgresos());
    toast.success(`Egreso "${newEgreso.nombre}" registrado exitosamente.`);

    // Reset Form
    setNombre("");
    setPrecioUnitario(0);
    setCantidad(1);
    setDescripcion("");
    setProveedor("");
    setComprobanteFile(null);
  };

  const handleDeleteEgreso = (id: string, nombreEgreso: string) => {
    if (window.confirm(`¿Está seguro de eliminar el registro de egreso "${nombreEgreso}"?`)) {
      RendimientoStore.deleteEgreso(id);
      setEgresos(RendimientoStore.getEgresos());
      toast.info(`Egreso "${nombreEgreso}" eliminado.`);
    }
  };

  // Filtered List
  const filteredEgresos = useMemo(() => {
    return egresos.filter((item) => {
      const matchSearch =
        !searchFilter ||
        item.nombre.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.descripcion.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.proveedor && item.proveedor.toLowerCase().includes(searchFilter.toLowerCase())) ||
        item.id.toLowerCase().includes(searchFilter.toLowerCase());

      const matchSede = sedeFilter === "Todas" || item.sede === sedeFilter;
      const matchMoneda = monedaFilter === "Todas" || item.moneda === monedaFilter;
      const matchCat = categoriaFilter === "Todas" || item.categoria === categoriaFilter;

      return matchSearch && matchSede && matchMoneda && matchCat;
    });
  }, [egresos, searchFilter, sedeFilter, monedaFilter, categoriaFilter]);

  // Total General sum calculation
  const totalSumDisplay = useMemo(() => {
    const currentSymbol = monedaFilter !== "Todas"
      ? (MONEDAS_LATAM.find(m => m.code === monedaFilter)?.symbol || "₡")
      : "₡";

    const total = filteredEgresos.reduce((acc, item) => acc + item.montoTotal, 0);
    return `${currentSymbol} ${total.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [filteredEgresos, monedaFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5 shadow-card">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Registro de Egresos & Compras
              </h2>
              <p className="text-xs text-muted-foreground">
                Control de salidas de dinero, compras de equipamiento, servicios y facturas institucionales.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold px-3 py-1 text-xs">
            {egresos.length} Registros Activos
          </Badge>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs font-semibold">
            <Printer className="h-4 w-4" /> Imprimir Reporte
          </Button>
        </div>
      </div>

      {/* Main Grid: Form on Top / Side, Table on Bottom */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Formulario de Registro */}
        <Card className="lg:col-span-5 shadow-card border border-border/80 bg-card">
          <CardHeader className="p-5 pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <PlusCircle className="h-5 w-5 text-emerald-600" /> Registrar Nueva Salida de Dinero
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-mono">
                FORMULARIO
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Complete los campos para registrar una compra o gasto operativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSaveEgreso} className="space-y-4 text-xs">
              {/* Nombre del Producto / Servicio */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                  Nombre del producto / servicio <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Balones de fútbol Nike Flight U13"
                  className="h-9 text-xs"
                />
              </div>

              {/* Sede y Moneda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Sede Afectada <span className="text-destructive">*</span>
                  </Label>
                  <select
                    value={sede}
                    onChange={(e) => setSede(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {SEDES_LIST.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Moneda <span className="text-destructive">*</span>
                  </Label>
                  <select
                    value={monedaCode}
                    onChange={(e) => setMonedaCode(e.target.value)}
                    className="w-full h-9 rounded-md border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 px-2.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {MONEDAS_LATAM.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Precio Unitario y Cantidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Precio unitario ({selectedMonedaObj.symbol}) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">
                      {selectedMonedaObj.symbol}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={precioUnitario}
                      onChange={(e) => setPrecioUnitario(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="h-9 pl-7 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Cantidad <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                    placeholder="1"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Vista previa de Cálculo Total */}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-emerald-900 dark:text-emerald-300">TOTAL ESTIMADO DE SALIDA</p>
                  <p className="text-xs text-muted-foreground">{typeof cantidad === "number" ? cantidad : 1} unid. × {selectedMonedaObj.symbol} {typeof precioUnitario === "number" ? precioUnitario.toLocaleString() : 0}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {selectedMonedaObj.symbol} {totalCalculadoForm.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase">{selectedMonedaObj.code}</p>
                </div>
              </div>

              {/* Categoría y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Categoría de Gasto <span className="text-destructive">*</span>
                  </Label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {CATEGORIAS_GASTO.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Fecha de Emisión <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Proveedor y Método de Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Proveedor / Comercio
                  </Label>
                  <Input
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    placeholder="Ej. Deportes 10 S.A."
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Método de Pago
                  </Label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {METODOS_PAGO.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Descripción / Detalle del Egreso
                </Label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles del egreso, justificación de compra o notas..."
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Comprobante Adjunto */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Comprobante o Factura (PDF / Imagen)
                </Label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 h-9 px-3 rounded-md border border-dashed border-input bg-muted/30 hover:bg-muted/50 transition-colors text-xs text-muted-foreground">
                    <Upload className="h-4 w-4 text-emerald-600" />
                    <span>{comprobanteFile ? comprobanteFile : "Seleccionar archivo..."}</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {comprobanteFile && (
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setComprobanteFile(null)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md gap-2 text-xs">
                <CheckCircle2 className="h-4 w-4" /> GUARDAR REGISTRO DE EGRESO
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista y Filtros de Egresos */}
        <Card className="lg:col-span-7 shadow-card border border-border/80 bg-card flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b bg-muted/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Receipt className="h-5 w-5 text-emerald-600" /> Historial & Lista de Egresos
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Listado oficial de compras y facturas institucionales registradas.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs bg-muted">
                  {filteredEgresos.length} de {egresos.length}
                </Badge>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-3">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por concepto, proveedor o ID..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background"
                  />
                </div>

                <div>
                  <select
                    value={sedeFilter}
                    onChange={(e) => setSedeFilter(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm"
                  >
                    <option value="Todas">Sede: Todas</option>
                    {SEDES_LIST.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={monedaFilter}
                    onChange={(e) => setMonedaFilter(e.target.value)}
                    className="w-full h-8 rounded-md border border-emerald-500/40 bg-emerald-50/40 px-2 text-xs font-bold text-emerald-900 shadow-sm"
                  >
                    <option value="Todas">Moneda: Todas</option>
                    {MONEDAS_LATAM.map((m) => (
                      <option key={m.code} value={m.code}>{m.code} ({m.symbol})</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[700px] text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Producto / Servicio</TableHead>
                      <TableHead>Categoría & Sede</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">P. Unitario</TableHead>
                      <TableHead className="text-right font-bold">Total</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Comprobante</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEgresos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground italic">
                          No se encontraron registros de egresos con los filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEgresos.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-[11px] font-semibold text-slate-500">
                            {item.id.replace("egr-", "#")}
                          </TableCell>
                          <TableCell className="font-medium">
                            <p className="text-slate-900 dark:text-slate-100 font-bold leading-tight">{item.nombre}</p>
                            {item.proveedor && (
                              <p className="text-[10px] text-muted-foreground mt-0.5">Prov: {item.proveedor}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                {item.categoria}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3 shrink-0" /> {item.sede}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold">
                            {item.cantidad}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-600 dark:text-slate-400">
                            {item.simboloMoneda} {item.precioUnitario.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                            {item.simboloMoneda} {item.montoTotal.toLocaleString("es-CR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            <p className="font-medium text-slate-700 dark:text-slate-300">{item.fecha}</p>
                            <p className="text-[10px] text-slate-400">{item.metodoPago}</p>
                          </TableCell>
                          <TableCell>
                            {item.comprobante ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[10px]">
                                <FileText className="h-3 w-3" /> Ver Adjunto
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Sin archivo</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              title="Eliminar registro"
                              onClick={() => handleDeleteEgreso(item.id, item.nombre)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </div>

          {/* Footer Resumen Total */}
          <div className="p-4 border-t bg-slate-900 text-white rounded-b-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-slate-300">TOTAL GENERAL ACUMULADO</p>
                <p className="text-[11px] text-slate-400">
                  {monedaFilter !== "Todas" ? `Filtro moneda: ${monedaFilter}` : "Suma acumulada de egresos en vista"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black font-mono text-emerald-400">
                {totalSumDisplay}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
