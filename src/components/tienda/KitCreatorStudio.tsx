import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RotateCw, Sparkles, ShoppingCart, Shield, Eye, Palette,
  Sliders, Layers, Check, Shirt, Award, User, RefreshCw, ZoomIn
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface KitCreatorProps {
  onAddToCart?: (item: {
    productoId: string;
    sku: string;
    nombre: string;
    precio: number;
    talla: string;
    color: string;
    cantidad: number;
    imagen: string;
  }) => void;
  logoEquipo?: string;
  nombreEquipo?: string;
}

export function KitCreatorStudio({
  onAddToCart,
  logoEquipo,
  nombreEquipo = "ACADEMIA DEPORTIVOS",
}: KitCreatorProps) {
  // Preset kits
  const [viewAngle, setViewAngle] = useState<"frente" | "espalda">("frente");
  const [selectedKitType, setSelectedKitType] = useState<"local" | "visitante" | "alternativo" | "portero">("local");
  
  // Customization States
  const [primaryColor, setPrimaryColor] = useState("#1e3a8a"); // Royal Blue
  const [secondaryColor, setSecondaryColor] = useState("#ffffff"); // White
  const [accentColor, setAccentColor] = useState("#f59e0b"); // Amber/Gold
  const [patternStyle, setPatternStyle] = useState<"stripes" | "hoops" | "cyber" | "solid" | "slash">("stripes");
  
  // Player Personalization
  const [playerName, setPlayerName] = useState("PACHECO");
  const [playerNumber, setPlayerNumber] = useState("10");
  const [numberFont, setNumberFont] = useState<"fifa" | "modern" | "cyber" | "classic">("fifa");
  
  // Sizing & Component
  const [kitPackage, setKitPackage] = useState<"completo" | "camiseta" | "short" | "medias">("completo");
  const [size, setSize] = useState("M");
  const [quantity, setQuantity] = useState(1);

  // Pre-configured color presets
  const colorPresets = [
    { name: "Azul Real", main: "#1e3a8a", sec: "#ffffff", acc: "#f59e0b" },
    { name: "Negro & Oro", main: "#090d16", sec: "#d97706", acc: "#fbbf24" },
    { name: "Verde Esmeralda", main: "#065f46", sec: "#ffffff", acc: "#34d399" },
    { name: "Rojo Pasión", main: "#991b1b", sec: "#ffffff", acc: "#fbbf24" },
    { name: "Blanco Puro", main: "#f8fafc", sec: "#1e293b", acc: "#0284c7" },
    { name: "Cian Cyber", main: "#0891b2", sec: "#0f172a", acc: "#22d3ee" },
  ];

  // Pricing calculation based on package
  const priceMap = {
    completo: 45000,
    camiseta: 28000,
    short: 12000,
    medias: 6500,
  };

  const currentPrice = priceMap[kitPackage] * quantity;

  const applyPreset = (preset: typeof colorPresets[0], type: "local" | "visitante" | "alternativo" | "portero") => {
    setSelectedKitType(type);
    setPrimaryColor(preset.main);
    setSecondaryColor(preset.sec);
    setAccentColor(preset.acc);
  };

  const handleAddToCart = () => {
    const packageNameMap = {
      completo: "UNIFORME COMPLETO (CAMISETA + SHORT + MEDIAS)",
      camiseta: "CAMISETA OFICIAL DE COMPETENCIA",
      short: "PANTALÓN SHORT OFICIAL",
      medias: "MEDIAS COMPRESIVAS DE FÚTBOL",
    };

    const customSummary = `${packageNameMap[kitPackage]} - [${playerName.toUpperCase()} #${playerNumber}]`;
    const sku = `KIT-CUSTOM-${Date.now().toString().slice(-6)}`;

    // Create preview data URL
    const itemData = {
      productoId: `custom-kit-${Date.now()}`,
      sku,
      nombre: customSummary,
      precio: priceMap[kitPackage],
      talla: size,
      color: `Personalizado (${primaryColor})`,
      cantidad: quantity,
      imagen: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&auto=format&fit=crop&q=80",
    };

    if (onAddToCart) {
      onAddToCart(itemData);
      toast.success("¡Kit personalizado añadido al carrito con éxito!", {
        description: `${customSummary} (Talla ${size})`,
      });
    }
  };

  return (
    <div className="w-full bg-slate-950 text-white rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
      
      {/* Header Studio */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] uppercase tracking-widest">
              <Sparkles className="h-3 w-3 mr-1" /> DeportivOS 3D Kit Studio Pro
            </Badge>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] uppercase">
              FIFA Kit Creator Tech
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase mt-1">
            Estudio Interactivo de Uniformes
          </h2>
          <p className="text-xs text-slate-400">
            Diseña, personaliza con tu nombre y dorsal en 3D, y ordena la indumentaria oficial de la academia.
          </p>
        </div>

        {/* Rotación y selector de kit predefinido */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewAngle(viewAngle === "frente" ? "espalda" : "frente")}
            className="bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-bold gap-2 rounded-xl h-9"
          >
            <RotateCw className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
            <span>Rotar a {viewAngle === "frente" ? "Espalda (Dorsal)" : "Frente (Escudo)"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= PANEL IZQUIERDO: SELECCIÓN DE ESTILOS & PAQUETES ================= */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
              <Layers className="h-4 w-4" /> Uniformes de Academia
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPreset(colorPresets[0], "local")}
                className={cn(
                  "p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between h-20",
                  selectedKitType === "local" ? "bg-slate-800 border-amber-400 ring-2 ring-amber-400/30" : "bg-slate-950 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Titular</span>
                  <div className="h-3 w-3 rounded-full bg-blue-900 border border-white/20" />
                </div>
                <span className="text-white text-[11px] font-black uppercase">Local Azul</span>
              </button>

              <button
                onClick={() => applyPreset(colorPresets[1], "visitante")}
                className={cn(
                  "p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between h-20",
                  selectedKitType === "visitante" ? "bg-slate-800 border-amber-400 ring-2 ring-amber-400/30" : "bg-slate-950 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Visitante</span>
                  <div className="h-3 w-3 rounded-full bg-slate-950 border border-amber-400" />
                </div>
                <span className="text-amber-400 text-[11px] font-black uppercase">Negro & Oro</span>
              </button>

              <button
                onClick={() => applyPreset(colorPresets[2], "alternativo")}
                className={cn(
                  "p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between h-20",
                  selectedKitType === "alternativo" ? "bg-slate-800 border-amber-400 ring-2 ring-amber-400/30" : "bg-slate-950 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Alternativo</span>
                  <div className="h-3 w-3 rounded-full bg-emerald-800 border border-white/20" />
                </div>
                <span className="text-emerald-300 text-[11px] font-black uppercase">Verde Pro</span>
              </button>

              <button
                onClick={() => applyPreset(colorPresets[5], "portero")}
                className={cn(
                  "p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between h-20",
                  selectedKitType === "portero" ? "bg-slate-800 border-amber-400 ring-2 ring-amber-400/30" : "bg-slate-950 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Guardameta</span>
                  <div className="h-3 w-3 rounded-full bg-cyan-600 border border-white/20" />
                </div>
                <span className="text-cyan-300 text-[11px] font-black uppercase">Cyber Neón</span>
              </button>
            </div>
          </div>

          {/* Selector de Patrón Gráfico de la Camiseta */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
              <Sliders className="h-4 w-4" /> Patrón Visual Camiseta
            </h3>

            <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
              {[
                { id: "stripes", label: "Rayas Verticales" },
                { id: "hoops", label: "Franjas Horizontales" },
                { id: "cyber", label: "Mesh Malla Cyber" },
                { id: "slash", label: "Banda Diagonal" },
                { id: "solid", label: "Sólido Pro" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPatternStyle(p.id as any)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-[11px] text-left transition-all",
                    patternStyle === p.id
                      ? "bg-amber-400 text-slate-950 font-black border-amber-400"
                      : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Componente Incluido en Pedido */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
              <Shirt className="h-4 w-4" /> Piezas del Kit
            </h3>

            <div className="space-y-1.5 text-xs">
              {[
                { id: "completo", name: "Uniforme Completo", sub: "Camiseta + Short + Medias", price: "₡45,000" },
                { id: "camiseta", name: "Solo Camiseta", sub: "Camiseta Oficial Personalizada", price: "₡28,000" },
                { id: "short", name: "Solo Pantalón Short", sub: "Pantalón oficial de juego", price: "₡12,000" },
                { id: "medias", name: "Solo Medias Pro", sub: "Medias de alta compresión", price: "₡6,500" },
              ].map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setKitPackage(pkg.id as any)}
                  className={cn(
                    "w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between",
                    kitPackage === pkg.id
                      ? "bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50"
                      : "bg-slate-950 border-slate-800 hover:border-slate-700"
                  )}
                >
                  <div>
                    <p className="font-bold text-white text-xs leading-tight">{pkg.name}</p>
                    <p className="text-[10px] text-slate-400">{pkg.sub}</p>
                  </div>
                  <span className="text-xs font-black text-emerald-400">{pkg.price}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ================= PANEL CENTRAL: CANVAS DE VISUALIZACIÓN 3D / VECTORIAL ================= */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
          
          <div className="relative w-full aspect-[3/4] max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-between shadow-2xl overflow-hidden group">
            
            {/* Iluminación de estudio en el centro */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />
            
            {/* Indicador de Vista */}
            <div className="relative z-10 flex items-center justify-between w-full border-b border-slate-800/80 pb-2">
              <Badge className="bg-slate-800 text-amber-400 font-mono text-[10px] uppercase">
                {viewAngle === "frente" ? "VISTA FRONTAL DE COMPETENCIA" : "VISTA DORSAL DE ESPALDA"}
              </Badge>

              <button
                onClick={() => setViewAngle(viewAngle === "frente" ? "espalda" : "frente")}
                className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg"
              >
                <RefreshCw className="h-3 w-3" /> Girar 180°
              </button>
            </div>

            {/* CANVAS VECTORIAL DINÁMICO DE UNIFORME EN 3D REALISTA */}
            <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center py-2 transition-all duration-500">
              
              {/* === CAMISETA 3D PRO === */}
              <div className="relative w-64 h-72 flex flex-col items-center justify-center drop-shadow-[0_25px_45px_rgba(0,0,0,0.95)]">
                <svg viewBox="0 0 300 340" className="w-full h-full filter drop-shadow-xl">
                  <defs>
                    {/* Fabric Base 3D Gradient */}
                    <linearGradient id="jerseyBodyGrad" x1="15%" y1="0%" x2="85%" y2="100%">
                      <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
                      <stop offset="35%" stopColor={primaryColor} />
                      <stop offset="70%" stopColor={primaryColor} stopOpacity="0.85" />
                      <stop offset="100%" stopColor="#090d16" stopOpacity="0.9" />
                    </linearGradient>

                    {/* Sleeve 3D Lighting Gradient */}
                    <linearGradient id="sleeveLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={primaryColor} />
                      <stop offset="100%" stopColor="#04060a" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="sleeveRightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={primaryColor} />
                      <stop offset="100%" stopColor="#04060a" stopOpacity="0.8" />
                    </linearGradient>

                    {/* 3D Highlight Gradient (Chest/Shoulders Volume) */}
                    <radialGradient id="chestHighlight" cx="50%" cy="30%" r="60%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
                    </radialGradient>

                    {/* Inner Collar Depth Gradient */}
                    <linearGradient id="innerCollarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#090d16" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>

                    {/* Micro Polyester Fabric Mesh Texture */}
                    <pattern id="microMeshTexture" width="6" height="6" patternUnits="userSpaceOnUse">
                      <circle cx="3" cy="3" r="1.2" fill="#ffffff" opacity="0.06" />
                      <path d="M 0 3 L 6 3" stroke="#000000" strokeWidth="0.5" opacity="0.08" />
                    </pattern>

                    {/* Vertical Stripes Pattern */}
                    <pattern id="patternStripes3D" width="40" height="340" patternUnits="userSpaceOnUse">
                      <rect width="20" height="340" fill={secondaryColor} opacity="0.8" />
                      <rect width="2" height="340" fill="#000000" opacity="0.15" />
                    </pattern>

                    {/* Horizontal Hoops Pattern */}
                    <pattern id="patternHoops3D" width="300" height="48" patternUnits="userSpaceOnUse">
                      <rect width="300" height="24" fill={secondaryColor} opacity="0.8" />
                      <rect y="22" width="300" height="2" fill="#000000" opacity="0.2" />
                    </pattern>

                    {/* Cyber Grid Pattern */}
                    <pattern id="patternCyber3D" width="24" height="24" patternUnits="userSpaceOnUse">
                      <path d="M 0 12 L 12 0 L 24 12 L 12 24 Z" fill="none" stroke={secondaryColor} strokeWidth="1.5" opacity="0.4" />
                      <circle cx="12" cy="12" r="3" fill={accentColor} opacity="0.6" />
                    </pattern>

                    {/* Diagonal Slash Pattern */}
                    <pattern id="patternSlash3D" width="300" height="340" patternUnits="userSpaceOnUse">
                      <polygon points="0,40 300,280 300,320 0,80" fill={secondaryColor} opacity="0.8" />
                      <polygon points="0,95 300,335 300,340 0,100" fill={accentColor} opacity="0.6" />
                    </pattern>

                    {/* Clip path for main torso body */}
                    <clipPath id="torsoClip">
                      <path d="M 92,42 C 115,48 185,48 208,42 L 234,68 C 242,108 238,135 220,152 C 215,142 208,136 202,132 L 204,285 C 160,295 140,295 96,285 L 98,132 C 92,136 85,142 80,152 C 62,135 58,108 66,68 Z" />
                    </clipPath>
                  </defs>

                  {/* 1. FONDO INTERIOR DEL CUELLO (Sombra de Profundidad 3D) */}
                  <ellipse cx="150" cy="46" rx="34" ry="16" fill="url(#innerCollarGrad)" stroke="#090d16" strokeWidth="2" />
                  <path d="M 125,45 C 135,52 165,52 175,45" fill="none" stroke="#334155" strokeWidth="1" />
                  {/* Etiqueta interna de la marca */}
                  <rect x="136" y="38" width="28" height="10" rx="2" fill="#0f172a" stroke={accentColor} strokeWidth="0.5" />
                  <text x="150" y="45" fontSize="5" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="0.5">DEPORTIVOS M</text>

                  {/* 2. MANGA IZQUIERDA 3D (Organic Curve) */}
                  <g>
                    <path
                      d="M 92,42 L 42,75 C 34,118 48,155 78,162 L 98,132 C 90,115 88,85 92,42 Z"
                      fill="url(#sleeveLeftGrad)"
                      stroke="#090d16"
                      strokeWidth="1.5"
                    />
                    {/* Puño de Manga Izquierda */}
                    <path
                      d="M 42,75 L 37,84 C 44,128 55,155 72,166 L 78,162 C 60,150 50,118 42,75 Z"
                      fill={accentColor}
                    />
                  </g>

                  {/* 3. MANGA DERECHA 3D (Organic Curve) */}
                  <g>
                    <path
                      d="M 208,42 L 258,75 C 266,118 252,155 222,162 L 202,132 C 210,115 212,85 208,42 Z"
                      fill="url(#sleeveRightGrad)"
                      stroke="#090d16"
                      strokeWidth="1.5"
                    />
                    {/* Puño de Manga Derecha */}
                    <path
                      d="M 258,75 L 263,84 C 256,128 245,155 228,166 L 222,162 C 240,150 250,118 258,75 Z"
                      fill={accentColor}
                    />
                  </g>

                  {/* 4. CUERPO PRINCIPAL DE LA CAMISETA 3D */}
                  <path
                    d="M 92,42 C 120,50 180,50 208,42 L 204,285 C 165,296 135,296 96,285 Z"
                    fill="url(#jerseyBodyGrad)"
                    stroke="#04060a"
                    strokeWidth="2"
                  />

                  {/* PATRÓN SELECCIONADO APLICADO AL CUERPO */}
                  <g clipPath="url(#torsoClip)">
                    {patternStyle === "stripes" && (
                      <rect x="50" y="30" width="200" height="260" fill="url(#patternStripes3D)" />
                    )}
                    {patternStyle === "hoops" && (
                      <rect x="50" y="30" width="200" height="260" fill="url(#patternHoops3D)" />
                    )}
                    {patternStyle === "cyber" && (
                      <rect x="50" y="30" width="200" height="260" fill="url(#patternCyber3D)" />
                    )}
                    {patternStyle === "slash" && (
                      <rect x="50" y="30" width="200" height="260" fill="url(#patternSlash3D)" />
                    )}
                  </g>

                  {/* CAPA DE TEXTURA MICRO-MESH REALISTA */}
                  <path
                    d="M 92,42 C 120,50 180,50 208,42 L 204,285 C 165,296 135,296 96,285 Z"
                    fill="url(#microMeshTexture)"
                    pointerEvents="none"
                  />

                  {/* CAPA DE SOMBRAS Y VOLUMEN ANATÓMICO 3D (Chest & Rib Creases) */}
                  <path
                    d="M 92,42 C 120,50 180,50 208,42 L 204,285 C 165,296 135,296 96,285 Z"
                    fill="url(#chestHighlight)"
                    pointerEvents="none"
                  />

                  {/* PLIEGUES Y ARRUGAS REALISTAS DEL TEJIDO (Real Fabric Creases) */}
                  <g stroke="#000000" strokeWidth="1.2" opacity="0.25" fill="none">
                    {/* Arrugas axilas */}
                    <path d="M 98,135 C 110,145 115,160 118,180" />
                    <path d="M 202,135 C 190,145 185,160 182,180" />
                    {/* Pliegue cintura */}
                    <path d="M 105,230 C 130,240 170,240 195,230" />
                    {/* Pliegue pectoral */}
                    <path d="M 115,110 C 135,118 165,118 185,110" />
                  </g>
                  <g stroke="#ffffff" strokeWidth="0.8" opacity="0.15" fill="none">
                    <path d="M 100,136 C 112,146 117,161 120,181" />
                    <path d="M 200,136 C 188,146 183,161 180,181" />
                    <path d="M 106,231 C 131,241 171,241 196,231" />
                  </g>

                  {/* PANALES LATERALES DE VENTILACIÓN */}
                  <path d="M 98,132 L 96,285 C 93,283 90,250 92,150 Z" fill={secondaryColor} opacity="0.7" />
                  <path d="M 202,132 L 204,285 C 207,283 210,250 208,150 Z" fill={secondaryColor} opacity="0.7" />

                  {/* 5. CUELLO EN V 3D ANATÓMICO CON RIBETE */}
                  <path
                    d="M 116,44 C 130,78 170,78 184,44 L 172,42 C 160,68 140,68 128,42 Z"
                    fill={accentColor}
                    stroke="#090d16"
                    strokeWidth="1"
                  />
                  <polygon points="150,78 138,58 162,58" fill={secondaryColor} opacity="0.9" />

                  {/* DOBLADILLO DE INFERIOR (Stitching line) */}
                  <path d="M 97,280 C 135,290 165,290 203,280" stroke="#000000" strokeWidth="1" strokeDasharray="3 2" fill="none" opacity="0.4" />

                  {/* ================= VISTA FRONTAL: LOGOS, ESCUDO Y SPONSOR ================= */}
                  {viewAngle === "frente" && (
                    <>
                      {/* Logo Marca Pecho Derecho (Relieve 3D) */}
                      <g transform="translate(122, 102)">
                        <path d="M 0,0 L 14,-8 L 8,4 Z" fill={secondaryColor} filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.6))" />
                        <path d="M 3,4 L 18,-4 L 12,8 Z" fill={accentColor} />
                      </g>

                      {/* Escudo Academia Pecho Izquierdo (Shield 3D con Brillo) */}
                      <g transform="translate(178, 102)" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.7))">
                        {/* Escudo Base */}
                        <path d="M -16,-16 L 16,-16 L 16,6 C 16,18 0,26 0,26 C 0,26 -16,18 -16,6 Z" fill="#090d16" stroke={accentColor} strokeWidth="2" />
                        <path d="M -13,-13 L 13,-13 L 13,4 C 13,14 0,22 0,22 C 0,22 -13,14 -13,4 Z" fill="url(#jerseyBodyGrad)" />
                        <circle cx="0" cy="-2" r="9" fill={accentColor} />
                        <text x="0" y="1" fontSize="7" fontWeight="900" fill="#000000" textAnchor="middle" letterSpacing="0.5">ATH</text>
                        {/* Estrella de campeón sobre el escudo */}
                        <polygon points="0,-21 2,-17 6,-17 3,-14 4,-10 0,-12 -4,-10 -3,-14 -6,-17 -2,-17" fill="#fbbf24" />
                      </g>

                      {/* Sponsor Principal Pecho (Heat-Press Vinyl Text 3D) */}
                      <g transform="translate(150, 175)" filter="drop-shadow(0px 3px 5px rgba(0,0,0,0.8))">
                        <rect x="-55" y="-16" width="110" height="32" rx="6" fill="#090d16" opacity="0.85" stroke={accentColor} strokeWidth="1.5" />
                        <rect x="-52" y="-13" width="104" height="26" rx="4" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
                        <text x="0" y="5" fontSize="15" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="2.5" className="font-mono">
                          DEPORTIVOS
                        </text>
                        <text x="0" y="13" fontSize="5" fontWeight="800" fill={accentColor} textAnchor="middle" letterSpacing="3">
                          SPORTS SCIENCE ACADEMY
                        </text>
                      </g>
                    </>
                  )}

                  {/* ================= VISTA DORSAL ESPALDA: NOMBRE & DORSAL 3D ================= */}
                  {viewAngle === "espalda" && (
                    <>
                      {/* Nombre del Jugador Arco Curvado */}
                      <g transform="translate(150, 115)" filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.9))">
                        <text
                          x="0"
                          y="0"
                          fontSize="16"
                          fontWeight="900"
                          fill={secondaryColor}
                          stroke="#000000"
                          strokeWidth="0.8"
                          textAnchor="middle"
                          letterSpacing="3"
                          className="uppercase font-sans font-black tracking-widest"
                        >
                          {playerName || "JUGADOR"}
                        </text>
                      </g>

                      {/* Número Dorsal Gigante 3D Pro */}
                      <g transform="translate(150, 215)" filter="drop-shadow(0px 8px 12px rgba(0,0,0,0.95))">
                        {/* Sombra de relieve / Bisel */}
                        <text
                          x="2"
                          y="3"
                          fontSize="82"
                          fontWeight="900"
                          fill="#000000"
                          opacity="0.6"
                          textAnchor="middle"
                          className={cn(
                            numberFont === "fifa" ? "font-mono font-black" : numberFont === "cyber" ? "font-mono tracking-widest" : "font-sans"
                          )}
                        >
                          {playerNumber || "10"}
                        </text>
                        {/* Número Frontal */}
                        <text
                          x="0"
                          y="0"
                          fontSize="80"
                          fontWeight="900"
                          fill={secondaryColor}
                          stroke={accentColor}
                          strokeWidth="3"
                          textAnchor="middle"
                          className={cn(
                            numberFont === "fifa" ? "font-mono font-black" : numberFont === "cyber" ? "font-mono tracking-widest" : "font-sans"
                          )}
                        >
                          {playerNumber || "10"}
                        </text>
                        {/* Escudo mini impreso al pie del número */}
                        <circle cx="0" cy="18" r="4" fill={accentColor} />
                      </g>
                    </>
                  )}
                </svg>
              </div>

              {/* === SHORT / PANTALÓN 3D (Visible si kit incluye short/completo) === */}
              {(kitPackage === "completo" || kitPackage === "short") && (
                <div className="w-48 h-28 -mt-8 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] z-0">
                  <svg viewBox="0 0 220 130" className="w-full h-full">
                    <defs>
                      <linearGradient id="shortGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={secondaryColor === "#ffffff" ? "#0f172a" : primaryColor} />
                        <stop offset="100%" stopColor="#04060a" />
                      </linearGradient>
                    </defs>
                    
                    {/* Cintura Elástica 3D */}
                    <path d="M 30,15 C 70,22 150,22 190,15 L 192,26 C 150,33 70,33 28,26 Z" fill={accentColor} stroke="#000000" strokeWidth="1" />
                    {/* Cordones de Ajuste */}
                    <path d="M 106,26 L 104,40 M 114,26 L 116,40" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

                    {/* Silueta Anatómica del Short */}
                    <path
                      d="M 28,26 C 70,33 150,33 192,26 L 210,105 C 170,112 130,108 122,80 L 110,65 L 98,80 C 90,108 50,112 10,105 Z"
                      fill="url(#shortGrad)"
                      stroke="#04060a"
                      strokeWidth="2"
                    />

                    {/* Franja de Acento Lateral */}
                    <path d="M 28,26 L 10,105 L 18,106 L 34,27 Z" fill={accentColor} />
                    <path d="M 192,26 L 210,105 L 202,106 L 186,27 Z" fill={accentColor} />

                    {/* Dorsal Mini en la Pierna Izquierda */}
                    <text x="45" y="85" fontSize="18" fontWeight="900" fill="#ffffff" stroke="#000000" strokeWidth="0.8" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.8))">
                      #{playerNumber}
                    </text>

                    {/* Escudo Mini Pierna Derecha */}
                    <g transform="translate(170, 78)">
                      <circle cx="0" cy="0" r="8" fill={accentColor} stroke="#ffffff" strokeWidth="1" />
                      <text x="0" y="3" fontSize="6" fontWeight="900" fill="#000000" textAnchor="middle">ATH</text>
                    </g>
                  </svg>
                </div>
              )}

              {/* === MEDIAS DE FÚTBOL COMPRESIVAS 3D (Visibles si kit completo o medias) === */}
              {(kitPackage === "completo" || kitPackage === "medias") && (
                <div className="flex items-center gap-8 -mt-2 drop-shadow-xl z-0">
                  {/* Media Izquierda 3D */}
                  <div className="w-9 h-24 relative flex flex-col items-center">
                    <svg viewBox="0 0 50 120" className="w-full h-full">
                      <defs>
                        <linearGradient id="sockGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                          <stop offset="30%" stopColor={primaryColor} />
                          <stop offset="100%" stopColor="#04060a" />
                        </linearGradient>
                      </defs>
                      {/* Cuerpo de Media */}
                      <path d="M 8,5 L 42,5 L 40,95 C 40,110 32,118 20,118 C 10,118 5,110 5,95 Z" fill="url(#sockGrad)" stroke="#090d16" strokeWidth="1.5" />
                      {/* Banda elástica superior */}
                      <rect x="7" y="5" width="36" height="12" rx="2" fill={accentColor} />
                      <rect x="7" y="22" width="36" height="4" fill={secondaryColor} opacity="0.8" />
                      {/* Logo ATH */}
                      <text x="25" y="48" fontSize="9" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1" className="font-mono">ATH</text>
                      {/* Refuerzo de tobillo y talón */}
                      <path d="M 8,80 C 18,85 32,85 40,80" stroke="#000000" strokeWidth="1.5" fill="none" opacity="0.4" />
                    </svg>
                  </div>

                  {/* Media Derecha 3D */}
                  <div className="w-9 h-24 relative flex flex-col items-center">
                    <svg viewBox="0 0 50 120" className="w-full h-full">
                      {/* Cuerpo de Media */}
                      <path d="M 8,5 L 42,5 L 45,95 C 45,110 40,118 28,118 C 16,118 8,110 10,95 Z" fill="url(#sockGrad)" stroke="#090d16" strokeWidth="1.5" />
                      {/* Banda elástica superior */}
                      <rect x="7" y="5" width="36" height="12" rx="2" fill={accentColor} />
                      <rect x="7" y="22" width="36" height="4" fill={secondaryColor} opacity="0.8" />
                      {/* Logo ATH */}
                      <text x="25" y="48" fontSize="9" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="1" className="font-mono">ATH</text>
                      {/* Refuerzo de tobillo y talón */}
                      <path d="M 10,80 C 18,85 32,85 42,80" stroke="#000000" strokeWidth="1.5" fill="none" opacity="0.4" />
                    </svg>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Canvas: Resumen de personalización */}
            <div className="relative z-10 w-full border-t border-slate-800/80 pt-2 flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-mono font-bold text-amber-400 uppercase">
                {playerName} #{playerNumber}
              </span>
              <span className="font-bold text-emerald-400">Talla {size}</span>
            </div>

          </div>

        </div>

        {/* ================= PANEL DERECHO: PERSONALIZACIÓN DE DORSAL & ORDEN ================= */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Panel de Personalización de Nombre y Dorsal */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
              <User className="h-4 w-4" /> Personalizar Nombre & Dorsal
            </h3>

            <div className="space-y-3">
              <div>
                <Label className="text-[11px] text-slate-300 font-bold uppercase">Nombre en la Espalda</Label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase().slice(0, 14))}
                  placeholder="EJ. PACHECO"
                  className="bg-slate-950 border-slate-800 text-amber-300 font-black text-sm uppercase mt-1 h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-slate-300 font-bold uppercase">Número Dorsal</Label>
                  <Input
                    type="number"
                    value={playerNumber}
                    onChange={(e) => setPlayerNumber(e.target.value.slice(0, 2))}
                    placeholder="10"
                    className="bg-slate-950 border-slate-800 text-amber-300 font-black text-sm mt-1 h-9"
                  />
                </div>

                <div>
                  <Label className="text-[11px] text-slate-300 font-bold uppercase">Estilo de Fuente</Label>
                  <select
                    value={numberFont}
                    onChange={(e) => setNumberFont(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold h-9 px-2 mt-1"
                  >
                    <option value="fifa">FIFA Pro Bold</option>
                    <option value="modern">Modern Mesh</option>
                    <option value="cyber">Cyber Tech</option>
                    <option value="classic">Classic Sports</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Color Picker Personalizado */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
              <Palette className="h-4 w-4" /> Paleta de Colores
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px] text-slate-400 uppercase font-semibold">Color Base</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 w-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-[10px] font-mono text-slate-300">{primaryColor}</span>
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-slate-400 uppercase font-semibold">Secundario</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-8 w-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-[10px] font-mono text-slate-300">{secondaryColor}</span>
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-slate-400 uppercase font-semibold">Acentos/Bordes</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-8 w-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-[10px] font-mono text-slate-300">{accentColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selector de Talla & Resumen de Pedido */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <Label className="text-[11px] text-slate-300 font-bold uppercase flex items-center justify-between">
                <span>Talla Oficial</span>
                <span className="text-[10px] text-amber-400 font-normal">Guía de Tallas Incluida</span>
              </Label>

              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {["6", "8", "10", "12", "14", "16", "XS", "S", "M", "L", "XL", "2XL"].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={cn(
                      "h-8 w-9 rounded-xl text-xs font-black transition-all border",
                      size === sz
                        ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
                    )}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Total e Instant Checkout Button */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Precio Total Kit</p>
                  <p className="text-xl font-black text-emerald-400 leading-tight">
                    ₡{currentPrice.toLocaleString("es-CR")}
                  </p>
                </div>

                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] uppercase">
                  Envío a Cancha Gratis
                </Badge>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs h-11 gap-2 rounded-xl shadow-xl transition-all"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>AÑADIR KIT PERSONALIZADO AL CARRITO</span>
              </Button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
