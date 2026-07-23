import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield, Trophy, Calendar, MapPin, Phone, Heart, Pill,
  AlertTriangle, RotateCw, Printer, Share2, CheckCircle2,
  Sparkles, QrCode, CreditCard, Activity, Copy, Check, Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarnetJugadorProps {
  jugador: {
    id: string;
    nombre: string;
    identificacion?: string;
    avatar?: string;
    disciplina?: string;
    categoria?: string;
    sede?: string;
    edad?: number;
    posicion?: string;
    tipoSanguineo?: string;
    saldo?: number;
  };
  equipo: string;
  logoEquipo?: string;
  numero?: number | string;
  entrenador?: string;
  estadoOp?: "habilitado" | "tolerancia" | "aviso" | "baja_medica" | string;
  alergias?: string[];
  medicamentos?: string[];
  restriccionesMed?: string[];
  contactosEmergencia?: { id?: string; nombre: string; parentesco: string; telefono: string }[];
  token?: string;
  asistenciaPct?: number;
}

export function CarnetJugadorPremium({
  jugador,
  equipo,
  logoEquipo,
  numero = 10,
  entrenador = "Edgar Calderón",
  estadoOp = "habilitado",
  alergias = [],
  medicamentos = [],
  restriccionesMed = [],
  contactosEmergencia = [],
  token,
  asistenciaPct = 95,
}: CarnetJugadorProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const cardToken = token || jugador.id || "ATH-2026-X89";
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
    typeof window !== "undefined" ? `${window.location.origin}/player-card/${cardToken}` : cardToken
  )}`;

  const isHabilitado = estadoOp === "habilitado" || estadoOp === "tolerancia";
  const isBaja = estadoOp === "baja_medica" || estadoOp === "critico";

  const handleCopyLink = async () => {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/player-card/${cardToken}` : cardToken;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-5 w-full max-w-lg mx-auto py-2 px-2 select-none">

      {/* Toolbar superior de acciones (Oculto al imprimir) */}
      <div className="flex flex-wrap items-center justify-center gap-2 w-full print:hidden">
        <Button
          size="sm"
          onClick={() => setIsFlipped(!isFlipped)}
          className="bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700/80 text-xs font-bold gap-1.5 shadow-md rounded-xl h-9 px-3.5"
        >
          <RotateCw className="h-3.5 w-3.5 text-amber-400" />
          <span>{isFlipped ? "Ver Frente" : "Girar Reverso 3D"}</span>
        </Button>

        <Button
          size="sm"
          onClick={() => setShowQrModal(true)}
          className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-bold gap-1.5 shadow-md rounded-xl h-9 px-3.5"
        >
          <Maximize2 className="h-3.5 w-3.5 text-amber-400" />
          <span>QR Pantalla Completa</span>
        </Button>

        <Button
          size="sm"
          onClick={handleCopyLink}
          className="bg-slate-900 hover:bg-slate-800 text-indigo-200 border border-indigo-500/40 text-xs font-bold gap-1.5 shadow-md rounded-xl h-9 px-3.5"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-indigo-400" />}
          <span>{copied ? "¡Enlace Copiado!" : "Compartir Digital"}</span>
        </Button>

        <Button
          size="sm"
          onClick={handlePrint}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md rounded-xl h-9 px-3.5"
        >
          <Printer className="h-3.5 w-3.5 text-white" />
          <span>Imprimir PVC</span>
        </Button>
      </div>

      {/* Tarjeta 3D Flip Container para la Pantalla Web */}
      <div className="w-full perspective-1000 print:hidden">
        <div
          className="relative w-full transition-transform duration-700 shadow-2xl rounded-2xl border border-white/20 bg-slate-950"
          style={{
            minHeight: "490px",
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            WebkitTransform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          
          {/* ==================== FRENTE DEL CARNET (PANTALLA) ==================== */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/20 shadow-2xl group"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(0deg)",
              WebkitTransform: "rotateY(0deg)",
            }}
          >
            {/* Patrón de fondo holográfico */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.25),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
            
            {/* HEADER */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-0.5 shadow-lg shadow-amber-500/20">
                  <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center overflow-hidden">
                    {logoEquipo ? (
                      <img src={logoEquipo} alt={equipo} className="h-full w-full object-contain p-1" />
                    ) : (
                      <Shield className="h-6 w-6 text-amber-400 fill-amber-400/20" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> DEPORTIVOS PRO LICENCIA
                  </p>
                  <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight uppercase drop-shadow-sm">
                    {equipo}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    {jugador.disciplina || "Fútbol"} · {jugador.categoria || "Categoría Oficial"}
                  </p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] tracking-wider uppercase px-2 py-0.5 shadow-md">
                  TEMPORADA 2026
                </Badge>
                <span className="text-[9px] text-slate-400 font-mono mt-1 uppercase tracking-widest">
                  {cardToken.slice(0, 12)}
                </span>
              </div>
            </div>

            {/* BODY */}
            <div className="relative z-10 grid grid-cols-12 gap-4 items-center my-2">
              <div className="col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 opacity-75 blur-sm animate-pulse" />
                  <Avatar className="relative h-24 w-24 ring-4 ring-slate-950 shadow-2xl rounded-full">
                    <AvatarImage src={jugador.avatar} className="object-cover" />
                    <AvatarFallback className="text-2xl font-black bg-slate-800 text-amber-400">
                      {jugador.nombre[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-xl ring-2 ring-slate-950 font-black text-base">
                    #{numero}
                  </div>
                </div>

                <div className="mt-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-md",
                      isHabilitado
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : isBaja
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full animate-ping", isHabilitado ? "bg-emerald-400" : isBaja ? "bg-rose-400" : "bg-amber-400")} />
                    {isHabilitado ? "Habilitado" : isBaja ? "Baja Médica" : "En Observación"}
                  </span>
                </div>
              </div>

              <div className="col-span-7 space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Atleta Oficial</p>
                  <h2 className="text-base sm:text-lg font-black text-white leading-snug tracking-wide uppercase font-sans">
                    {jugador.nombre}
                  </h2>
                  <p className="text-xs text-amber-300/90 font-semibold truncate">
                    {jugador.posicion || "Jugador de Campo"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-slate-200 text-[11px]">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-1.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Identificación</p>
                    <p className="font-mono font-bold truncate">{jugador.identificacion || "CR-80942"}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-1.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Edad / Sede</p>
                    <p className="font-bold truncate">{jugador.edad ? `${jugador.edad} años` : "Sede Central"}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-1.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Entrenador</p>
                    <p className="font-bold truncate">{entrenador}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-1.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Asistencia</p>
                    <p className="font-bold text-emerald-400">{asistenciaPct}% Promedio</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="relative z-10 border-t border-white/15 pt-2.5 flex items-center justify-between gap-3">
              <div className="flex flex-col justify-between space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-xl w-fit">
                  <Shield className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest truncate">
                    DEPORTIVOS VERIFIED PASS
                  </span>
                </div>

                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-0.5 h-6 opacity-80 overflow-hidden">
                    {[3,1,4,1,2,1,5,2,1,3,2,1,4,1,2,3,1,2,4,1,3,1,2,1,4,2].map((w, i) => (
                      <span key={i} className="bg-white h-full shrink-0" style={{ width: `${w * 1.5}px` }} />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-slate-400 truncate">
                    ID: {cardToken.toUpperCase().slice(0, 16)}
                  </span>
                </div>
              </div>

              <div
                onClick={() => setShowQrModal(true)}
                className="relative cursor-pointer group/qr flex flex-col items-center justify-center p-1.5 rounded-2xl bg-white shadow-2xl ring-4 ring-amber-400/50 hover:ring-amber-300 transition-all shrink-0"
              >
                <img
                  src={qrApiUrl}
                  alt="QR Carnet Atleta"
                  className="h-24 w-24 sm:h-28 sm:w-28 object-contain rounded-xl"
                />
                <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest mt-0.5">
                  🔍 ESCANEO RÁPIDO
                </span>
              </div>
            </div>

          </div>

          {/* ==================== REVERSO DEL CARNET (PANTALLA) ==================== */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-5 flex flex-col justify-between overflow-hidden rounded-2xl border border-white/20 shadow-2xl"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              WebkitTransform: "rotateY(180deg)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.15),transparent_70%)] pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-400 fill-rose-400/20" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Ficha Médica & Emergencias</h4>
                  <p className="text-[10px] text-slate-400">Pase Clínico Oficial de Seguridad Atleta</p>
                </div>
              </div>
              <Badge className="bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] px-2">
                GS: {jugador.tipoSanguineo || "O+"}
              </Badge>
            </div>

            <div className="space-y-3 my-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase">
                    <Heart className="h-3.5 w-3.5" /> Alergias Conocidas
                  </div>
                  <p className="text-[11px] font-medium text-slate-200">
                    {alergias.length > 0 ? alergias.join(", ") : "Sin alergias reportadas"}
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase">
                    <Pill className="h-3.5 w-3.5" /> Medicamentos
                  </div>
                  <p className="text-[11px] font-medium text-slate-200">
                    {medicamentos.length > 0 ? medicamentos.join(", ") : "Ningún medicamento registrado"}
                  </p>
                </div>
              </div>

              {restriccionesMed.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[10px] uppercase">
                    <AlertTriangle className="h-3.5 w-3.5" /> Restricciones Operativas
                  </div>
                  <p className="text-[11px] text-rose-200 mt-0.5">
                    {restriccionesMed.join(". ")}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-emerald-400" /> Contactos de Emergencia Directos
                </p>
                
                {contactosEmergencia.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {contactosEmergencia.slice(0, 2).map((c, idx) => (
                      <a
                        key={idx}
                        href={`tel:${c.telefono.replace(/\s/g, "")}`}
                        className="flex items-center justify-between bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-2 transition-colors"
                      >
                        <div>
                          <p className="font-bold text-white text-[11px] leading-tight">{c.nombre}</p>
                          <p className="text-[9px] text-emerald-300 font-medium">{c.parentesco}</p>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.telefono}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-slate-400 text-[11px]">
                    Central de la Academia: +506 2222-3333
                  </div>
                )}
              </div>

            </div>

            <div className="border-t border-white/15 pt-2 flex items-center justify-between gap-2 text-[9px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Validez Nacional DeportivOS
              </span>
              
              <div
                onClick={() => setShowQrModal(true)}
                className="cursor-pointer bg-white p-1 rounded-lg shadow ring-1 ring-emerald-400/40 flex items-center gap-1"
              >
                <img src={qrApiUrl} alt="QR Escaneo" className="h-7 w-7 object-contain rounded" />
                <span className="text-[8px] font-bold text-slate-900 uppercase pr-1">ESCANEAR</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ==================== SECCIÓN DE IMPRESIÓN IMPERMEABLE PVC (100% IDÉNTICA EN 1 SOLA PÁGINA) ==================== */}
      <div className="carnet-print-area hidden print:flex flex-col items-center justify-center space-y-3 w-full p-0 text-slate-950">
        <div className="text-center mb-1">
          <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">ACREDITACIÓN OFICIAL PVC · {equipo}</h2>
          <p className="text-[10px] font-bold text-slate-600">DEPORTIVOS PRO PASS · TEMPORADA 2026</p>
        </div>

        {/* FRENTE Y REVERSO IMPRESOS CON MAQUETACIÓN COMPACTA ANTI-CORTE DE PÁGINA */}
        <div className="flex flex-col items-center gap-3 w-full max-w-[370px] mx-auto carnet-print-card">
          
          {/* FRENTE IMPRESO IDÉNTICO COMPACTO */}
          <div className="w-[370px] h-[395px] rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-4 flex flex-col justify-between overflow-hidden border border-white/20 shadow-xl relative shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.25),transparent_70%)] pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-0.5 shadow-lg shadow-amber-500/20">
                  <div className="h-full w-full rounded-[10px] bg-slate-950 flex items-center justify-center overflow-hidden">
                    {logoEquipo ? (
                      <img src={logoEquipo} alt={equipo} className="h-full w-full object-contain p-1" />
                    ) : (
                      <Shield className="h-6 w-6 text-amber-400 fill-amber-400/20" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> DEPORTIVOS PRO LICENCIA
                  </p>
                  <h3 className="text-base font-black tracking-tight text-white leading-tight uppercase">
                    {equipo}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    {jugador.disciplina || "Fútbol"} · {jugador.categoria || "Categoría Oficial"}
                  </p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] tracking-wider uppercase px-2 py-0.5 shadow-md">
                  TEMPORADA 2026
                </Badge>
                <span className="text-[9px] text-slate-400 font-mono mt-1 uppercase tracking-widest">
                  {cardToken.slice(0, 12)}
                </span>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-12 gap-4 items-center my-2">
              <div className="col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative">
                  <Avatar className="relative h-24 w-24 ring-4 ring-slate-950 shadow-2xl rounded-full">
                    <AvatarImage src={jugador.avatar} className="object-cover" />
                    <AvatarFallback className="text-2xl font-black bg-slate-800 text-amber-400">
                      {jugador.nombre[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 shadow-xl ring-2 ring-slate-950 font-black text-base">
                    #{numero}
                  </div>
                </div>

                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Habilitado
                  </span>
                </div>
              </div>

              <div className="col-span-7 space-y-2">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Atleta Oficial</p>
                  <h2 className="text-base font-black text-white leading-snug tracking-wide uppercase font-sans">
                    {jugador.nombre}
                  </h2>
                  <p className="text-xs text-amber-300 font-semibold truncate">
                    {jugador.posicion || "Jugador de Campo"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-slate-200 text-[11px]">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-1.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Identificación</p>
                    <p className="font-mono font-bold truncate">{jugador.identificacion || "CR-80942"}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-1.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Edad / Sede</p>
                    <p className="font-bold truncate">{jugador.edad ? `${jugador.edad} años` : "Sede Central"}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-1.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Entrenador</p>
                    <p className="font-bold truncate">{entrenador}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-1.5">
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Asistencia</p>
                    <p className="font-bold text-emerald-400">{asistenciaPct}% Promedio</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 border-t border-white/15 pt-2.5 flex items-center justify-between gap-3">
              <div className="flex flex-col justify-between space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-xl w-fit">
                  <Shield className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest truncate">
                    DEPORTIVOS VERIFIED PASS
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-0.5 h-6 opacity-80 overflow-hidden">
                    {[3,1,4,1,2,1,5,2,1,3,2,1,4,1,2,3,1,2,4,1,3,1,2,1,4,2].map((w, i) => (
                      <span key={i} className="bg-white h-full shrink-0" style={{ width: `${w * 1.5}px` }} />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-slate-400 truncate font-mono">
                    ID: {cardToken.toUpperCase().slice(0, 16)}
                  </span>
                </div>
              </div>

              <div className="relative flex flex-col items-center justify-center p-1.5 rounded-2xl bg-white shadow-2xl ring-4 ring-amber-400/50 shrink-0">
                <img
                  src={qrApiUrl}
                  alt="QR Carnet Atleta"
                  className="h-28 w-28 object-contain rounded-xl"
                />
                <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest mt-0.5">
                  🔍 ESCANEO RÁPIDO
                </span>
              </div>
            </div>
          </div>

          {/* REVERSO IMPRESO IDÉNTICO COMPACTO */}
          <div className="w-[370px] h-[395px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-4 flex flex-col justify-between overflow-hidden border border-white/20 shadow-xl relative shrink-0 carnet-print-card">
            <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-400" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Ficha Médica & Emergencias</h4>
                  <p className="text-[10px] text-slate-400">Pase Clínico Oficial de Seguridad Atleta</p>
                </div>
              </div>
              <Badge className="bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] px-2">
                GS: {jugador.tipoSanguineo || "O+"}
              </Badge>
            </div>

            <div className="space-y-3 my-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase">
                    <Heart className="h-3.5 w-3.5" /> Alergias Conocidas
                  </div>
                  <p className="text-[11px] font-medium text-slate-200">
                    {alergias.length > 0 ? alergias.join(", ") : "Sin alergias reportadas"}
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px] uppercase">
                    <Pill className="h-3.5 w-3.5" /> Medicamentos
                  </div>
                  <p className="text-[11px] font-medium text-slate-200">
                    {medicamentos.length > 0 ? medicamentos.join(", ") : "Ningún medicamento registrado"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-emerald-400" /> Contactos de Emergencia Directos
                </p>
                
                {contactosEmergencia.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {contactosEmergencia.slice(0, 2).map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2"
                      >
                        <div>
                          <p className="font-bold text-white text-[11px] leading-tight">{c.nombre}</p>
                          <p className="text-[9px] text-emerald-300 font-medium">{c.parentesco}</p>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-emerald-400">
                          {c.telefono}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-slate-400 text-[11px]">
                    Central de la Academia: +506 2222-3333
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/15 pt-2 flex items-center justify-between gap-2 text-[9px] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Validez Nacional DeportivOS
              </span>
              
              <div className="bg-white p-1 rounded-lg shadow ring-1 ring-emerald-400/40 flex items-center gap-1">
                <img src={qrApiUrl} alt="QR Escaneo" className="h-8 w-8 object-contain rounded" />
                <span className="text-[8px] font-bold text-slate-900 uppercase pr-1">ESCANEAR</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de QR Ampliado Pantalla Completa */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-sm bg-slate-950 text-white border-slate-800 p-6 text-center select-none">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-lg font-black text-amber-400 uppercase">
              <QrCode className="h-5 w-5 text-amber-400" /> Código de Escaneo Rápido
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Apunta la cámara de tu teléfono para verificar la acreditación de {jugador.nombre}.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 flex flex-col items-center justify-center">
            <div className="p-3 bg-white rounded-3xl shadow-2xl ring-8 ring-amber-400/30">
              <img src={qrApiUrl} alt="QR Gigante" className="h-60 w-60 object-contain rounded-2xl" />
            </div>
            <p className="mt-4 text-xs font-mono font-bold text-amber-300">
              ID: {cardToken.toUpperCase()}
            </p>
            <p className="text-[11px] font-bold text-slate-300 uppercase mt-0.5">
              {jugador.nombre} · {equipo}
            </p>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
