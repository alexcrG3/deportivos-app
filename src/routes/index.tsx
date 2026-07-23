import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ShieldCheck,
  Zap,
  Users,
  Award,
  Calendar,
  CreditCard,
  QrCode,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  HeartPulse,
  Flame,
  Brain,
  MessageSquare,
  HelpCircle,
  Play,
  Check,
  Sliders,
  BellRing,
  Globe,
  Dumbbell,
  Stethoscope,
  BarChart3,
  Layers,
  ChevronDown
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<"pf" | "director" | "padre">("pf");
  const [pricingPeriod, setPricingPeriod] = useState<"monthly" | "annual">("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  // FAQ Data
  const faqs = [
    {
      q: "¿DeportivOS funciona para academias de cualquier disciplina deportiva?",
      a: "Sí, totalmente. DeportivOS está diseñado modularmente para adaptarse a fútbol, baloncesto, natación, artes marciales, tenis, atletismo y gimnasia. Puedes personalizar categorías, disciplinas y pruebas físicas dinámicamente."
    },
    {
      q: "¿Cómo funciona el control de fatiga y Wellness para evitar lesiones?",
      a: "Utilizamos el protocolo internacional RPE (Rating of Perceived Exertion) combinado con encuestas diarias de Wellness (sueño, estrés, dolor muscular y ánimo). Nuestro motor calcula la relación ACWR (Acute:Chronic Workload Ratio) y notifica automáticamente al cuerpo técnico con semáforos de riesgo."
    },
    {
      q: "¿Se pueden enviar recordatorios de pago y convocatorias por WhatsApp?",
      a: "Sí. DeportivOS se integra directamente con la API de WhatsApp para enviar citaciones de partidos, pases de asistencia, pases QR y alertas automáticas de cartera vencida directamente al teléfono de los padres sin intervención manual."
    },
    {
      q: "¿Puedo probar la plataforma antes de adquirir una suscripción?",
      a: "¡Absolutamente! Ofrecemos un periodo de prueba gratuito de 14 días con acceso ilimitado a todos los módulos (Sports Science, Control de Canchas, Pagos y Carnets Digitales) sin requerir tarjeta de crédito."
    },
    {
      q: "Mis datos y la información de los atletas menores de edad, ¿están seguros?",
      a: "La seguridad es nuestra máxima prioridad. Todos los datos están encriptados de extremo a extremo en infraestructura Supabase PostgreSQL con políticas RLS de aislamiento estricto y cumplimiento de normativas de protección de datos de menores."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0C10] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 overflow-x-hidden">
      {/* BACKGROUND GLOW DECORATIVE ELEMENTS */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-[10%] right-[15%] w-[450px] h-[450px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] left-[35%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[150px]" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B0C10]/80 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="h-full w-full bg-[#0B0C10] rounded-[10px] flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                Deportiv<span className="text-amber-400">OS</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v2.0 Pro
                </span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider">Sports Science & Management Engine</span>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">Módulos</a>
            <a href="#sports-science" className="hover:text-amber-400 transition-colors">Sports Science</a>
            <a href="#roles" className="hover:text-amber-400 transition-colors">Para tu Equipo</a>
            <a href="#pricing" className="hover:text-amber-400 transition-colors">Planes</a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">FAQ</a>
          </nav>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/5 transition-all border border-white/10"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/dashboard"
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-2">
                Ir a la App
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* HERO TEXT */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              {/* BADGE */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                <span>La Suite Tecnológica Deportiva #1 en Latinoamérica</span>
              </div>

              {/* TITLE */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                La Inteligencia Deportivo-Operativa para <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">Clubes de Alto Rendimiento</span>
              </h1>

              {/* SUBTITLE */}
              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Revoluciona tu academia con monitoreo biomecánico y de fatiga (<strong className="text-amber-400 font-semibold">Wellness RPE</strong>), control operativo de canchas, cobros automatizados por WhatsApp y pases QR digitales para cada atleta.
              </p>

              {/* CTAS */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => setDemoModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-emerald-400 hover:opacity-95 shadow-xl shadow-amber-500/25 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                >
                  <Sparkles className="h-5 w-5 fill-slate-950" />
                  Agendar Demo Personalizada
                </button>

                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/15 backdrop-blur-md transition-all flex items-center justify-center gap-2 group"
                >
                  <Play className="h-4 w-4 fill-slate-200 group-hover:text-amber-400 transition-colors" />
                  Probar Modo Interactivo
                </Link>
              </div>

              {/* TRUST BADGES */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Sin tarjeta de crédito requerida
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-amber-400" /> Cumplimiento de datos de menores
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Zap className="h-4 w-4 text-violet-400" /> Sincronización en tiempo real
                </span>
              </div>
            </div>

            {/* HERO VISUAL DEMO CARD */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* GLOW BACKDROP */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-100 transition duration-1000" />

                {/* MAIN GLASS CARD */}
                <div className="relative bg-[#11131F]/90 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl space-y-6">
                  {/* CARD HEADER */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-400 p-0.5">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                          alt="Atleta Atlethix"
                          className="h-full w-full rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">Santiago Jiménez</h4>
                        <p className="text-xs text-slate-400 font-medium">Categoría U15 · Élite Liga</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      ALTA TOTAL 🟢
                    </span>
                  </div>

                  {/* WELLNESS METRICS RADAR */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <HeartPulse className="h-3.5 w-3.5 text-amber-400" />
                          Wellness Score
                        </span>
                        <span className="font-bold text-amber-400">92/100</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                        <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full w-[92%]" />
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-emerald-400" />
                          RPE Semana
                        </span>
                        <span className="font-bold text-emerald-400">420 AU</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                        <div className="bg-emerald-400 h-full rounded-full w-[65%]" />
                      </div>
                    </div>
                  </div>

                  {/* QUICK STATS & QR PASSPORT */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <QrCode className="h-3.5 w-3.5" /> Carnet Digital Atleta
                      </div>
                      <div className="text-sm font-semibold text-white">ID: DEP-2026-889</div>
                      <div className="text-xs text-slate-400">Cuota Mensual: <span className="text-emerald-400 font-bold">AL DÍA ✓</span></div>
                    </div>
                    <div className="bg-white p-2 rounded-xl shadow-md">
                      <QrCode className="h-10 w-10 text-slate-950" />
                    </div>
                  </div>

                  {/* LIVE FOOTER ALERT */}
                  <div className="flex items-center gap-2.5 text-xs text-slate-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                    <BellRing className="h-4 w-4 text-amber-400 shrink-0" />
                    <span><strong>Notificación Push:</strong> Convocatoria enviada por WhatsApp para el partido del Sábado vs Alajuelense.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* METRICS & SOCIAL PROOF TICKER */}
      <section className="py-10 bg-slate-950/60 border-y border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">+10,000</div>
              <div className="text-xs sm:text-sm font-medium text-slate-400">Atletas Evaluados</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">98.4%</div>
              <div className="text-xs sm:text-sm font-medium text-slate-400">Cobros a Tiempo</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-violet-400 tracking-tight">-40%</div>
              <div className="text-xs sm:text-sm font-medium text-slate-400">Riesgo de Lesiones Musculares</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-blue-400 tracking-tight">4.9 / 5.0</div>
              <div className="text-xs sm:text-sm font-medium text-slate-400">Satisfacción Cuerpos Técnicos</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE PILLARS GRID */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Módulos Principales</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Todo lo que Tu Club Necesita en Una Sola Plataforma Unificada
            </p>
            <p className="text-slate-400 text-base">
              Diseñado minuciosamente para conectar a Directores Financieros, Preparadores Físicos, Entrenadores de Cancha y Familias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* PILLAR 1 */}
            <div className="bg-[#11131F] border border-white/10 rounded-2xl p-6 hover:border-amber-500/40 transition-all duration-300 group hover:-translate-y-1 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Sports Science & Wellness</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Semáforo de fatiga muscular, encuestas de sueño/estrés, control de carga RPE y algoritmos de prevención de lesiones ACWR.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/10">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-amber-400" /> Test EVA de dolor muscular</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-amber-400" /> Expediente clínico de fisio</li>
              </ul>
            </div>

            {/* PILLAR 2 */}
            <div className="bg-[#11131F] border border-white/10 rounded-2xl p-6 hover:border-emerald-500/40 transition-all duration-300 group hover:-translate-y-1 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Gestión Operativa de Canchas</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Pase de lista táctil en 1-Click desde el celular, asignación de horarios de entrenamientos, canchas y convocatorias automáticas.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/10">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Dictado por voz de notas</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400" /> Control de inventario y conos</li>
              </ul>
            </div>

            {/* PILLAR 3 */}
            <div className="bg-[#11131F] border border-white/10 rounded-2xl p-6 hover:border-violet-500/40 transition-all duration-300 group hover:-translate-y-1 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Cobros & Mensualidades</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Automatización de estado de cartera vencida, pasarelas de pago, facturación electrónica y nómina de entrenadores.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/10">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-violet-400" /> Alertas por WhatsApp</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-violet-400" /> Venta de uniformes en tienda</li>
              </ul>
            </div>

            {/* PILLAR 4 */}
            <div className="bg-[#11131F] border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 transition-all duration-300 group hover:-translate-y-1 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Player Card Digital QR</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Carnets digitales con QR de verificación instantánea para torniquetes, visores, seguros médicos e historial de pruebas físicas.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/10">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-400" /> Radar de capacidades 2D</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-400" /> Exportable en HD para imprenta</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ROLE INTERACTIVE SHOWCASE */}
      <section id="roles" className="py-24 bg-slate-950/70 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Experiencia por Roles</h2>
            <p className="text-3xl font-extrabold text-white">Una Interfaz Hecha a la Medida para Cada Usuario</p>
          </div>

          {/* ROLE SELECTOR TABS */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-white/10">
              <button
                onClick={() => setSelectedRole("pf")}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  selectedRole === "pf"
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Stethoscope className="h-4 w-4" />
                Cuerpo Técnico / Fisio
              </button>
              <button
                onClick={() => setSelectedRole("director")}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  selectedRole === "director"
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Director / Administración
              </button>
              <button
                onClick={() => setSelectedRole("padre")}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  selectedRole === "padre"
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users className="h-4 w-4" />
                Atleta y Familia
              </button>
            </div>
          </div>

          {/* ROLE DISPLAY CONTENT */}
          <div className="bg-[#11131F] border border-white/15 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl backdrop-blur-xl">
            {selectedRole === "pf" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Modo Preparador Físico & Médica
                  </div>
                  <h3 className="text-2xl font-bold text-white">Monitoreo Científico del Plantel</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Registra la escala de dolor EVA (1-10), pruebas físicas de aceleración/salto y ejecuta el protocolo de retorno al juego (RTP) con semáforos integrados en el mapa del entrenador.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Historial antropométrico y curvas de crecimiento</li>
                    <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Notificación instantánea de bajas al DT</li>
                  </ul>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Semáforo de Carga Semanal</span>
                    <span className="text-amber-400 font-bold">ACWR: 1.15 (Óptimo)</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-200">
                      <span>Cargas de Entrenamiento</span>
                      <span className="font-bold text-emerald-400">Zona Segura</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[70%]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRole === "director" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    Panel Director Deportivo
                  </div>
                  <h3 className="text-2xl font-bold text-white">Control 360° Financiero y de Canchas</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Supervisa los ingresos por mensualidades, estado de cartera vencida, nómina de entrenadores y disponibilidad de canchas en todas las sedes.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Reporte exportable en Excel e informes ejecutivos</li>
                    <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Integración con pasarelas de pago locales</li>
                  </ul>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Recaudación del Mes</span>
                    <span className="text-emerald-400 font-bold">$12,450.00 USD</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-200">
                      <span>Cumplimiento de Cobros</span>
                      <span className="font-bold text-violet-400">96.8%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full w-[96%]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRole === "padre" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    App para Padres & Atletas
                  </div>
                  <h3 className="text-2xl font-bold text-white">Transparencia y Seguimiento Familiar</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Los padres responden el test de Wellness diario en 10 segundos, reciben convocatorias por WhatsApp, pagan mensualidades y compran uniformes en la tienda oficial.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Notificaciones push de horarios y partidos</li>
                    <li className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Ficha de rendimiento del jugador en tiempo real</li>
                  </ul>
                </div>
                <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 p-3 rounded-xl">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-emerald-400" />
                      Recordatorio WhatsApp
                    </span>
                    <span className="text-[10px] text-slate-400">Enviado hoy</span>
                  </div>
                  <div className="text-xs text-slate-400 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300">
                    ✓ Encuesta de Wellness completada para la sesión de hoy.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PRICING MATRIX */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Planes y Precios</h2>
            <p className="text-3xl font-extrabold text-white">Inversión Transparente para Escuelas y Clubes</p>
            
            {/* PERIOD TOGGLE */}
            <div className="pt-4 flex items-center justify-center gap-3 text-sm">
              <span className={pricingPeriod === "monthly" ? "text-white font-bold" : "text-slate-400"}>Mensual</span>
              <button
                onClick={() => setPricingPeriod(pricingPeriod === "monthly" ? "annual" : "monthly")}
                className="w-14 h-8 rounded-full bg-slate-800 p-1 border border-white/10 transition-colors"
              >
                <div className={`h-6 w-6 rounded-full bg-amber-400 transition-transform ${pricingPeriod === "annual" ? "translate-x-6" : ""}`} />
              </button>
              <span className={pricingPeriod === "annual" ? "text-white font-bold flex items-center gap-1" : "text-slate-400"}>
                Anual
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  2 Meses Gratis
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* PLAN STARTER */}
            <div className="bg-[#11131F] border border-white/10 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Starter Club</h3>
                <p className="text-xs text-slate-400">Ideal para academias en crecimiento hasta 50 atletas.</p>
                <div className="text-4xl font-black text-white">
                  {pricingPeriod === "annual" ? "$49" : "$59"} <span className="text-xs font-normal text-slate-400">/ mes</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-white/10">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Hasta 50 Atletas incluidos</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Pase de lista táctil y asistencias</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Módulo de Cobros & Mensualidades</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Carnets QR básicos</li>
                </ul>
              </div>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full py-3 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 border border-white/15 text-white transition-all"
              >
                Comenzar Prueba Gratis
              </button>
            </div>

            {/* PLAN PRO (POPULAR) */}
            <div className="relative bg-[#151828] border-2 border-amber-500/60 rounded-3xl p-8 space-y-6 flex flex-col justify-between shadow-2xl shadow-amber-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-md">
                Más Popular 🔥
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Pro Sports Science</h3>
                <p className="text-xs text-slate-400">Para clubes de alto rendimiento hasta 250 atletas.</p>
                <div className="text-4xl font-black text-amber-400">
                  {pricingPeriod === "annual" ? "$119" : "$139"} <span className="text-xs font-normal text-slate-400">/ mes</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-white/10">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Hasta 250 Atletas incluidos</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Motor Sports Science & Wellness RPE</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Notificaciones WhatsApp automatizadas</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Módulo Clínico Fisioterapia & Lesiones</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400" /> Tienda de Uniformes e Inventario</li>
                </ul>
              </div>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:opacity-90 transition-all shadow-lg shadow-amber-500/20"
              >
                Solicitar Acceso Pro
              </button>
            </div>

            {/* PLAN ENTERPRISE */}
            <div className="bg-[#11131F] border border-white/10 rounded-3xl p-8 space-y-6 flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Elite Multi-Sede</h3>
                <p className="text-xs text-slate-400">Para ligas, federaciones o franquicias deportivas sin límite.</p>
                <div className="text-4xl font-black text-white">Personalizado</div>
                <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-white/10">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Atletas e Instalaciones ilimitadas</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Dominio propio y marca blanca</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Integración API personalizada</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Soporte dedicado 24/7</li>
                </ul>
              </div>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full py-3 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 border border-white/15 text-white transition-all"
              >
                Contactar Ventas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 bg-slate-950/80 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Respuesta a tus Dudas</h2>
            <p className="text-3xl font-extrabold text-white">Preguntas Frecuentes</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-[#11131F] border border-white/10 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-white/5 transition-colors"
                >
                  <span className="font-semibold text-white text-base">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 text-amber-400 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 text-slate-300 text-sm leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER & CTA */}
      <footer className="bg-[#07080C] border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-white/15 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">¿Listo para Digitalizar tu Club Deportivo?</h3>
              <p className="text-slate-300 text-sm max-w-xl">Únete a más de 50 academias líderes que gestionan su rendimiento y operación con DeportivOS.</p>
            </div>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="px-8 py-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/25 shrink-0 transition-all transform hover:-translate-y-0.5"
            >
              Agendar Demo Gratuita
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <Zap className="h-4 w-4 text-amber-400" />
              DeportivOS © 2026 · Todos los derechos reservados.
            </div>
            <div className="flex gap-6">
              <a href="#features" className="hover:text-amber-400 transition-colors">Términos de Servicio</a>
              <a href="#features" className="hover:text-amber-400 transition-colors">Política de Privacidad</a>
              <a href="#faq" className="hover:text-amber-400 transition-colors">Soporte Técnico</a>
            </div>
          </div>

        </div>
      </footer>

      {/* DEMO MODAL */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#11131F] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => { setDemoModalOpen(false); setDemoSubmitted(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            {!demoSubmitted ? (
              <>
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Agendar Demo de DeportivOS</h3>
                  <p className="text-xs text-slate-400">Ingresa tus datos y un especialista en Sports Science se pondrá en contacto contigo.</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setDemoSubmitted(true);
                  }}
                  className="space-y-4 text-sm"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Carlos Méndez"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de la Academia / Club</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Élite FC Costa Rica"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono WhatsApp</label>
                    <input
                      required
                      type="tel"
                      placeholder="+506 8888 8888"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all"
                  >
                    Confirmar Solicitud
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-white">¡Solicitud Recibida!</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Gracias por tu interés en DeportivOS. Nuestro equipo te contactará por WhatsApp en las próximas 2 horas para coordinar tu demostración guiada.
                </p>
                <button
                  onClick={() => { setDemoModalOpen(false); setDemoSubmitted(false); }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all"
                >
                  Cerrar Ventana
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
