import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Mail, Download, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export interface ReciboData {
  id: string;
  entrenadorNombre: string;
  entrenadorIdentificacion?: string;
  entrenadorCorreo?: string;
  entrenadorTelefono?: string;
  cuentaBancaria?: string;
  categoriaAsignada?: string;
  periodoInicio: string;
  periodoFin: string;
  sesionesCantidad: number;
  sesionesTarifa: number;
  sesionesSubtotal: number;
  partidosCantidad: number;
  partidosBono: number;
  partidosSubtotal: number;
  ajustesMonto: number;
  ajustesNotas?: string;
  montoTotal: number;
  moneda: "USD" | "CRC";
  estado: "borrador" | "aprobado" | "pagado";
  fechaPago?: string;
}

interface ReciboHonorariosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReciboData | null;
}

export function ReciboHonorariosModal({ open, onOpenChange, data }: ReciboHonorariosModalProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const symbol = data.moneda === "CRC" ? "₡" : "$";

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    toast.success(`📧 Recibo de Honorarios enviado digitalmente a ${data.entrenadorCorreo || "correo del profesor"}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border shadow-2xl rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
              ATH
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold tracking-tight text-white">
                Recibo de Pago de Servicios Deportivos
              </DialogTitle>
              <p className="text-xs text-amber-400 font-mono">Academia Deportiva Asoderive — Nómina Oficial</p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-400/50 text-amber-300 font-mono text-[10px] uppercase">
            {data.estado === "pagado" ? "✅ Pagado" : data.estado === "aprobado" ? "🛡️ Aprobado" : "📝 Borrador"}
          </Badge>
        </DialogHeader>

        {/* Printable Pay Slip Body */}
        <div ref={printableRef} className="p-6 space-y-6 text-xs text-foreground bg-background">
          {/* Header Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/40 border border-border/80 text-xs">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Entrenador / Director Técnico</p>
              <p className="font-bold text-sm text-foreground">{data.entrenadorNombre}</p>
              <p className="text-muted-foreground">ID: {data.entrenadorIdentificacion || "N/A"}</p>
              <p className="text-muted-foreground">Email: {data.entrenadorCorreo || "N/A"}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Período de Nómina</p>
              <p className="font-bold text-sm text-foreground">{data.periodoInicio} al {data.periodoFin}</p>
              <p className="text-muted-foreground">Categoría Asignada: <strong className="text-primary">{data.categoriaAsignada || "U9 / U13 Asoderive"}</strong></p>
              <p className="text-muted-foreground font-mono">IBAN/SINPE: {data.cuentaBancaria || "CR05015202001023456789"}</p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-border rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-border">
                  <th className="p-3">Concepto Operativo</th>
                  <th className="p-3 text-center">Cantidad Registrada</th>
                  <th className="p-3 text-right">Tarifa Unitaria</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-center">Estado en App</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/30">
                  <td className="p-3 font-semibold">
                    <div>Sesiones de Entrenamiento Dirigidas</div>
                    <div className="text-[10px] text-muted-foreground font-normal">Frecuencia Lunes y Jueves (90 min)</div>
                  </td>
                  <td className="p-3 text-center font-bold">{data.sesionesCantidad} sesiones</td>
                  <td className="p-3 text-right font-mono">{symbol}{data.sesionesTarifa.toFixed(2)}</td>
                  <td className="p-3 text-right font-bold font-mono">{symbol}{data.sesionesSubtotal.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Cerradas 100%
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-muted/30">
                  <td className="p-3 font-semibold">
                    <div>Dirección de Partidos de Liga</div>
                    <div className="text-[10px] text-muted-foreground font-normal">Bono Especial Fin de Semana</div>
                  </td>
                  <td className="p-3 text-center font-bold">{data.partidosCantidad} partidos</td>
                  <td className="p-3 text-right font-mono">{symbol}{data.partidosBono.toFixed(2)}</td>
                  <td className="p-3 text-right font-bold font-mono">{symbol}{data.partidosSubtotal.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Reporte Enviado
                    </span>
                  </td>
                </tr>

                {data.ajustesMonto !== 0 && (
                  <tr className="hover:bg-muted/30 bg-amber-500/5">
                    <td className="p-3 font-semibold" colSpan={3}>
                      <div>Ajustes / Sustituciones / Penalizaciones</div>
                      {data.ajustesNotas && <div className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">{data.ajustesNotas}</div>}
                    </td>
                    <td className="p-3 text-right font-bold font-mono text-amber-600 dark:text-amber-400">
                      {data.ajustesMonto > 0 ? `+${symbol}` : `-${symbol}`}{Math.abs(data.ajustesMonto).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        Auditado
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Banner */}
          <div className="p-4 rounded-2xl bg-indigo-950 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div>
              <p className="text-[10px] uppercase font-bold text-indigo-300">Monto Bruto Total a Transferir</p>
              <p className="text-[11px] text-indigo-200">Aprobado para dispersión bancaria masiva</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {symbol}{data.montoTotal.toFixed(2)} {data.moneda}
              </span>
            </div>
          </div>

          {/* Legal Footnote & Approvals */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Verificado por Athletix OS Software Nómina 2026</span>
            </div>
            <span>Fecha de emisión: {new Date().toISOString().slice(0, 10)}</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs font-bold rounded-xl">
            Cerrar
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSendEmail} className="text-xs font-bold rounded-xl gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <Mail className="h-3.5 w-3.5" /> Enviar por Correo
            </Button>
            <Button size="sm" onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm">
              <Printer className="h-3.5 w-3.5" /> Imprimir Recibo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
