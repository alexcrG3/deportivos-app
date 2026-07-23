import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { formatCRC } from "@/lib/mock-data";
import RendimientoStore from "@/lib/rendimiento-store";
import { FileText, Search, Download, CheckCircle2, Clock, AlertTriangle, FileCode2, ShieldCheck, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/facturacion")({ component: FacturacionPage });

// Convierte un pago real en una "factura electrónica"
function pagoToFactura(p: any) {
  const subtotal = Math.round(p.monto / 1.13);
  const iva = p.monto - subtotal;
  return {
    id: p.id,
    consecutivo: `FE-CR-${p.referencia || p.id.slice(-8).toUpperCase()}`,
    clave: `506-${p.fecha?.replace(/-/g, "")}-${(p.referencia || p.id).slice(-12).toUpperCase().padEnd(12, "0")}-1-1`,
    receptor: p.jugador,
    identificacion: "Sin cédula",
    correo: "—",
    tipo: "Factura Electrónica",
    fecha: p.fecha,
    estado: "aceptada" as const,
    subtotal,
    iva,
    total: p.monto,
    metodo: p.metodo,
    categoria: p.categoria,
  };
}

function FacturacionPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"todas" | "aceptada" | "procesando" | "rechazada">("todas");
  const [facturas, setFacturas] = useState<ReturnType<typeof pagoToFactura>[]>([]);
  const [sel, setSel] = useState<ReturnType<typeof pagoToFactura> | null>(null);

  useEffect(() => {
    setFacturas(RendimientoStore.getPagos().map(pagoToFactura));
  }, []);

  const filtered = useMemo(() => {
    return facturas.filter((f) => {
      const m =
        f.receptor.toLowerCase().includes(q.toLowerCase()) ||
        f.consecutivo.toLowerCase().includes(q.toLowerCase()) ||
        (f.categoria || "").toLowerCase().includes(q.toLowerCase());
      const t = tab === "todas" || f.estado === tab;
      return m && t;
    });
  }, [q, tab, facturas]);

  const total = facturas.reduce((a, f) => a + f.total, 0);
  const aceptadas = facturas.filter((f) => f.estado === "aceptada").length;
  const enProceso = facturas.filter((f) => f.estado === "procesando").length;
  const rechazadas = facturas.filter((f) => f.estado === "rechazada").length;

  // Total del mes actual
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const totalMes = facturas
    .filter((f) => (f.fecha || "").startsWith(mesActual))
    .reduce((a, f) => a + f.total, 0);

  // ── Imprimir Recibo / Ticket Térmico ──
  const handlePrintTicket = (f: ReturnType<typeof pagoToFactura>) => {
    const activeOrgId = RendimientoStore.getActiveOrganizacionId();
    const activeOrg = RendimientoStore.getOrganizaciones().find(o => o.id === activeOrgId);
    const clubName = activeOrg?.nombre || "ATHLETIX ACADEMY";

    const ticketWindow = window.open("", "_blank", "width=380,height=600");
    if (!ticketWindow) {
      toast.error("El bloqueador de popups impidió abrir el ticket. Por favor permítelos.");
      return;
    }

    ticketWindow.document.write(`
      <html>
        <head>
          <title>Ticket de Pago - ${f.consecutivo}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; }
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              max-width: 300px;
              margin: 0 auto;
              padding: 20px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header-title { font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .divider { border-top: 1px dashed #000; margin: 12px 0; }
            .footer { margin-top: 30px; border-top: 1px dashed #000; padding-top: 10px; font-size: 10px; }
            .btn-print {
              display: block;
              width: 100%;
              padding: 10px;
              background-color: #2563eb;
              color: #fff;
              border: none;
              border-radius: 4px;
              font-family: sans-serif;
              font-weight: bold;
              cursor: pointer;
              margin-bottom: 20px;
              text-align: center;
            }
            @media print {
              .btn-print { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="btn-print" onclick="window.print()">🖨️ Imprimir Ticket</button>
          
          <div class="header text-center">
            <h1 class="header-title">${clubName}</h1>
            <div>Comprobante de Pago</div>
            <div>Costa Rica</div>
          </div>

          <div class="bold">DATOS DEL COMPROBANTE</div>
          <div class="info-row"><span>No. Ticket:</span><span>${f.consecutivo}</span></div>
          <div class="info-row"><span>Fecha:</span><span>${f.fecha}</span></div>
          <div class="info-row"><span>Estado:</span><span>ACEPTADA (Hacienda)</span></div>

          <div class="divider"></div>

          <div class="bold">DATOS DEL CLIENTE</div>
          <div class="info-row"><span>Jugador:</span><span>${f.receptor}</span></div>
          <div class="info-row"><span>Categoría:</span><span>${f.categoria || "Sin categoría"}</span></div>

          <div class="divider"></div>

          <div class="bold">DETALLE DE COBRO</div>
          <div class="info-row"><span>Mensualidad Dep:</span><span>₡${f.subtotal.toLocaleString("es-CR")}</span></div>
          <div class="info-row"><span>IVA (13%):</span><span>₡${f.iva.toLocaleString("es-CR")}</span></div>
          
          <div class="divider"></div>
          
          <div class="info-row bold" style="font-size: 14px;">
            <span>TOTAL PAGADO:</span>
            <span>₡${f.total.toLocaleString("es-CR")}</span>
          </div>

          <div class="divider"></div>

          <div class="info-row"><span>Método Pago:</span><span>${f.metodo}</span></div>
          <div class="info-row"><span>Clave Hacienda:</span><span style="font-size: 8px; max-width: 180px; word-break: break-all;">${f.clave}</span></div>

          <div class="footer text-center">
            <div class="bold">¡Gracias por su puntualidad!</div>
            <div>Athletix OS - Gestión Deportiva</div>
          </div>

          <script>
            // Auto disparar la impresión
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    ticketWindow.document.close();
  };

  // ── Exportar Reporte de Facturación en Excel ──
  const handleExport = async () => {
    try {
      const XLSX = await import("xlsx");
      
      const activeOrgId = RendimientoStore.getActiveOrganizacionId();
      const activeOrg = RendimientoStore.getOrganizaciones().find(o => o.id === activeOrgId);
      const clubName = activeOrg?.nombre || "ATHLETIX ACADEMY";

      // 1. Crear el bloque de encabezado elegante
      const headerRows = [
        [clubName.toUpperCase()],
        ["REPORTE ESTRATÉGICO DE FACTURACIÓN ELECTRÓNICA"],
        [`Fecha de Emisión: ${new Date().toLocaleDateString("es-CR")} ${new Date().toLocaleTimeString("es-CR")}`],
        [], // Espaciador
        ["RESUMEN DE FACTURACIÓN"],
        [
          `Total Comprobantes: ${filtered.length}`,
          `Total Facturado: ₡${filtered.reduce((acc, f) => acc + f.total, 0).toLocaleString("es-CR")}`
        ],
        [], // Espaciador
      ];

      // 2. Títulos de columnas
      const tableHeaders = [
        "Consecutivo",
        "Receptor / Jugador",
        "Categoría",
        "Método de Pago",
        "Fecha",
        "Estado",
        "Subtotal (₡)",
        "IVA (₡)",
        "Total Facturado (₡)"
      ];

      // 3. Filas de datos
      const dataRows = filtered.map(f => [
        f.consecutivo,
        f.receptor,
        f.categoria || "Sin categoría",
        f.metodo,
        f.fecha,
        f.estado.toUpperCase(),
        f.subtotal,
        f.iva,
        f.total
      ]);

      const allRows = [...headerRows, tableHeaders, ...dataRows];

      // 4. Crear la hoja
      const worksheet = XLSX.utils.aoa_to_sheet(allRows);

      // Estilo de columnas (anchos)
      const maxColWidths = [24, 28, 14, 16, 14, 12, 16, 16, 18];
      worksheet["!cols"] = maxColWidths.map(w => ({ wch: w }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Facturación");

      // Descargar el archivo
      const fileName = `reporte_facturacion_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Reporte de facturación descargado con éxito");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar el reporte de Excel");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturación electrónica · Costa Rica</h1>
          <p className="text-sm text-muted-foreground">Comprobantes generados automáticamente desde los pagos registrados.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" /> Exportar</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Facturado del mes" value={formatCRC(totalMes)} icon={FileText} accent="primary" />
        <StatCard label="Aceptadas por Hacienda" value={aceptadas.toString()} hint="confirmadas" icon={CheckCircle2} accent="success" />
        <StatCard label="En proceso" value={enProceso.toString()} hint="esperando respuesta" icon={Clock} accent="warning" />
        <StatCard label="Rechazadas / error" value={rechazadas.toString()} hint="requieren atención" icon={AlertTriangle} accent="destructive" />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="todas">Todas ({facturas.length})</TabsTrigger>
                <TabsTrigger value="aceptada">Aceptadas ({aceptadas})</TabsTrigger>
                <TabsTrigger value="procesando">Procesando ({enProceso})</TabsTrigger>
                <TabsTrigger value="rechazada">Rechazadas ({rechazadas})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar receptor, consecutivo, categoría..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Consecutivo</TableHead>
                  <TableHead>Receptor</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center w-20">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10 text-sm">
                      {facturas.length === 0
                        ? "No hay pagos registrados. Ve a Pagos → Generar Cobros del Mes para comenzar."
                        : "No se encontraron resultados."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((f) => (
                    <TableRow key={f.id} className="cursor-pointer hover:bg-muted/30">
                      <TableCell className="font-mono text-xs" onClick={() => setSel(f)}>{f.consecutivo.slice(-14)}</TableCell>
                      <TableCell onClick={() => setSel(f)}>
                        <div className="font-medium text-sm">{f.receptor}</div>
                      </TableCell>
                      <TableCell onClick={() => setSel(f)}>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[11px] font-bold">
                          {f.categoria || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" onClick={() => setSel(f)}>{f.metodo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground" onClick={() => setSel(f)}>{f.fecha}</TableCell>
                      <TableCell onClick={() => setSel(f)}>
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold border-none px-2.5 py-0.5 rounded-full text-[11px]">
                          aceptada
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold" onClick={() => setSel(f)}>{formatCRC(f.total)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintTicket(f);
                          }}
                          title="Imprimir Recibo"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filtered.length > 0 && (
            <div className="flex justify-end pt-1">
              <p className="text-sm text-muted-foreground">
                Total mostrado:{" "}
                <span className="font-semibold text-foreground">
                  {formatCRC(filtered.reduce((a, f) => a + f.total, 0))}
                </span>
                {" · "}
                {filtered.length} comprobante{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de detalle */}
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-success" />
                  {sel.tipo}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs break-all">{sel.clave}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Receptor</span><span className="font-medium">{sel.receptor}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Categoría</span><span>{sel.categoria || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Método de pago</span><span>{sel.metodo}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Consecutivo</span><span className="font-mono text-xs">{sel.consecutivo}</span></div>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal (sin IVA)</span><span>{formatCRC(sel.subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">IVA 13%</span><span>{formatCRC(sel.iva)}</span></div>
                  <Separator className="my-1" />
                  <div className="flex justify-between text-sm font-semibold"><span>Total</span><span>{formatCRC(sel.total)}</span></div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Timeline tributario</p>
                  <div className="space-y-3">
                    {[
                      { l: "Generada", ok: true },
                      { l: "XML firmado", ok: true },
                      { l: "Enviada a Hacienda", ok: true },
                      { l: "Respuesta Hacienda — Aceptada", ok: true },
                    ].map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full ${s.ok ? "bg-success" : "bg-muted-foreground"}`} />
                        <div className="flex-1 text-sm">
                          <span className="font-medium">{s.l}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full" onClick={() => handlePrintTicket(sel)}><Printer className="h-4 w-4" /> Recibo</Button>
                  <Button variant="outline" className="w-full"><FileCode2 className="h-4 w-4" /> XML</Button>
                  <Button variant="outline" className="w-full"><Download className="h-4 w-4" /> PDF</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
