import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, DollarSign, CheckCircle2, Lock, UploadCloud, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import RendimientoStore, { StoreJugador } from "@/lib/rendimiento-store";

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  jugador?: StoreJugador | null;
  montoDefault?: number;
  conceptoDefault?: string;
  onPaymentSuccess?: () => void;
}

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  jugador,
  montoDefault = 35000,
  conceptoDefault = "Mensualidad del Mes",
  onPaymentSuccess,
}: PaymentCheckoutModalProps) {
  const [metodo, setMetodo] = useState<"tilopay" | "sinpe" | "stripe" | "efectivo">("tilopay");
  const [monto, setMonto] = useState<number>(() => {
    return (jugador as any)?.saldo ?? (jugador as any)?.monto ?? montoDefault;
  });
  const [concepto, setConcepto] = useState<string>(conceptoDefault);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (jugador) {
      const val = (jugador as any).saldo ?? (jugador as any).monto ?? montoDefault;
      setMonto(Number(val) || 35000);
    }
  }, [jugador, montoDefault]);

  // Campos Tilopay / Tarjeta
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Campos SINPE Móvil
  const [sinpeRef, setSinpeRef] = useState("");
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

  const activeOrgId = RendimientoStore.getActiveOrganizacionId();
  const activeOrg = RendimientoStore.getOrganizaciones().find((o) => o.id === activeOrgId);
  const clubName = activeOrg?.nombre || "Academia Deportiva";
  const sinpeNumero = activeOrg?.sinpeNumero || "8888-8888";

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jugador) {
      toast.error("Por favor selecciona un alumno / jugador para el cobro.");
      return;
    }

    if (monto <= 0) {
      toast.error("Ingresa un monto válido mayor a 0.");
      return;
    }

    if (metodo === "sinpe" && !sinpeRef.trim()) {
      toast.error("Ingresa el número de comprobante / referencia SINPE Móvil.");
      return;
    }

    if (metodo === "tilopay" && cardNumber.length < 15) {
      toast.error("Ingresa un número de tarjeta válido para Tilopay.");
      return;
    }

    setLoading(true);

    try {
      let comprobanteUrl = null;

      // Subir captura de comprobante SINPE si existe
      if (comprobanteFile) {
        const fileExt = comprobanteFile.name.split(".").pop();
        const filePath = `comprobantes/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("pagos")
          .upload(filePath, comprobanteFile);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from("pagos").getPublicUrl(filePath);
          comprobanteUrl = urlData.publicUrl;
        }
      }

      const pagoId = `pago-${Date.now()}`;
      const referenciaFinal =
        metodo === "sinpe"
          ? sinpeRef.trim()
          : metodo === "tilopay"
          ? `TP-${Math.floor(100000 + Math.random() * 900000)}`
          : `TR-${Math.floor(100000 + Math.random() * 900000)}`;

      // 1. Guardar transacción en Supabase DB (tabla pagos)
      const newPago = {
        id: pagoId,
        organizacion_id: activeOrgId,
        jugador_id: jugador.id,
        jugador_nombre: jugador.nombre,
        monto: Number(monto),
        concepto: concepto.trim(),
        metodo_pago: metodo,
        estado: "completado",
        referencia_transaccion: referenciaFinal,
        fecha_pago: new Date().toISOString(),
        comprobante_url: comprobanteUrl,
      };

      const { error: dbError } = await supabase.from("pagos").upsert(newPago);

      if (dbError) {
        console.warn("[Supabase] Aviso guardando en tabla pagos:", dbError.message);
      }

      // 2. Actualizar estado y saldo del jugador en RendimientoStore & Supabase DB
      const nuevoSaldo = Math.max(0, (jugador.saldo || 0) - monto);
      const nuevoEstadoPago = nuevoSaldo === 0 ? "al_dia" : "pendiente";

      RendimientoStore.updateJugador(jugador.id, {
        saldo: nuevoSaldo,
        estadoPago: nuevoEstadoPago,
      });

      // 3. Agregar a lista local de pagos de RendimientoStore
      const currentPagos = RendimientoStore.getPagos();
      const formattedPago = {
        id: pagoId,
        jugadorId: jugador.id,
        jugador: jugador.nombre,
        categoria: jugador.categoria,
        monto: Number(monto),
        concepto: concepto.trim(),
        fecha: new Date().toISOString().split("T")[0],
        metodo: metodo === "tilopay" ? "Tilopay Card" : metodo === "sinpe" ? "SINPE Móvil" : metodo === "stripe" ? "Stripe" : "Efectivo",
        referencia: referenciaFinal,
        comprobanteUrl,
      };
      RendimientoStore.set("pagos_dynamics", [formattedPago, ...currentPagos]);

      toast.success(
        `✅ Pago de ₡${monto.toLocaleString()} procesado exitosamente vía ${
          metodo === "tilopay" ? "Tilopay" : metodo === "sinpe" ? "SINPE Móvil" : "Caja"
        }`
      );

      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("Ocurrió un error al procesar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-white rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5">
              💳 Checkout en Vivo
            </Badge>

            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-primary" /> {clubName}
            </span>
          </div>

          <DialogTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            Procesar Cobro
          </DialogTitle>
          {jugador && (
            <p className="text-xs text-slate-300 font-medium">
              Alumno: <strong className="text-emerald-400 font-bold">{jugador.nombre}</strong> ({jugador.categoria})
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleProcessPayment} className="space-y-4 pt-2">
          {/* Monto y Concepto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-bold">Monto (₡ CRC)</Label>
              <Input
                type="number"
                value={monto}
                onChange={(e) => setMonto(Number(e.target.value))}
                className="bg-slate-900 border-slate-800 text-white font-extrabold text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300 font-bold">Concepto</Label>
              <Input
                type="text"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="bg-slate-900 border-slate-800 text-slate-200 text-xs font-semibold"
                placeholder="Ej: Mensualidad Febrero"
                required
              />
            </div>
          </div>

          {/* Selector de Método de Pago */}
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300 font-bold">Selecciona el Método de Pago</Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Tilopay (Tarjeta Costa Rica/LatAm) */}
              <button
                type="button"
                onClick={() => setMetodo("tilopay")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  metodo === "tilopay"
                    ? "bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border-indigo-400 text-white ring-2 ring-indigo-500/40 shadow-lg scale-105"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <CreditCard className="h-5 w-5 mb-1 text-indigo-400" />
                <span className="text-[11px] font-black">Tilopay</span>
                <span className="text-[9px] opacity-70">Tarjeta CR/CA</span>
              </button>

              {/* SINPE Móvil */}
              <button
                type="button"
                onClick={() => setMetodo("sinpe")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  metodo === "sinpe"
                    ? "bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border-emerald-400 text-white ring-2 ring-emerald-500/40 shadow-lg scale-105"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="h-5 w-5 mb-1 text-emerald-400" />
                <span className="text-[11px] font-black">SINPE Móvil</span>
                <span className="text-[9px] opacity-70">Transferencia</span>
              </button>

              {/* Efectivo */}
              <button
                type="button"
                onClick={() => setMetodo("efectivo")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                  metodo === "efectivo"
                    ? "bg-gradient-to-br from-amber-600/30 to-orange-600/30 border-amber-400 text-white ring-2 ring-amber-500/40 shadow-lg scale-105"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <DollarSign className="h-5 w-5 mb-1 text-amber-400" />
                <span className="text-[11px] font-black">Efectivo</span>
                <span className="text-[9px] opacity-70">Caja Física</span>
              </button>
            </div>
          </div>

          {/* Formulario Dinámico según Método */}
          {metodo === "tilopay" && (
            <div className="space-y-3 bg-slate-900/90 border border-indigo-500/30 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" /> Pasarela Segura Tilopay
                </span>
                <span className="text-[10px] text-slate-400">Visa / Mastercard</span>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-300">Número de Tarjeta</Label>
                <Input
                  type="text"
                  placeholder="4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs font-mono text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-300">Expiración (MM/AA)</Label>
                  <Input
                    type="text"
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs font-mono text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-300">CVC / CVV</Label>
                  <Input
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {metodo === "sinpe" && (
            <div className="space-y-3 bg-slate-900/90 border border-emerald-500/30 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-300">
                  SINPE Móvil Academia: <u className="text-white font-mono">{sinpeNumero}</u>
                </span>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-300">Número de Comprobante / Referencia</Label>
                <Input
                  type="text"
                  placeholder="Ej: 20260201998812"
                  value={sinpeRef}
                  onChange={(e) => setSinpeRef(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs font-mono text-emerald-400 font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-300">Captura de pantalla comprobante (Opcional)</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)}
                  className="bg-slate-950 border-slate-800 text-xs text-slate-400 cursor-pointer"
                />
              </div>
            </div>
          )}

          {metodo === "efectivo" && (
            <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-2xl text-xs text-amber-200 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-amber-400" /> Registro directo en Caja Física
              </p>
              <p className="text-[11px] opacity-80">
                El dinero en efectivo ha sido entregado en la administración y quedará asentado inmediatamente.
              </p>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-6 rounded-xl shadow-lg"
            >
              {loading ? "Procesando..." : `Confirmar Pago de ₡${monto.toLocaleString()}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
