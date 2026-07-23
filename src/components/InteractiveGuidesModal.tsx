import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/use-role";
import { 
  BookOpen, Search, Sparkles, CheckCircle2, ChevronRight, X, Clock, 
  HelpCircle, GraduationCap, ShieldCheck, Trophy, Dumbbell, Wallet, 
  Users, Settings, Lightbulb, AlertCircle, ArrowLeft, ArrowRight, 
  Share2, FileText, Check, QrCode, Building2
} from "lucide-react";
import { toast } from "sonner";

export interface GuideStep {
  title: string;
  subtitle: string;
  iconName?: string;
  summaryBox?: {
    title: string;
    items: string[];
  };
  tip?: string;
  sections?: {
    icon: string;
    title: string;
    description: string;
    badge?: string;
  }[];
  contentMd?: string;
}

export interface GuideItem {
  id: string;
  roleTarget: "admin" | "coach" | "padres" | "all";
  category: "PRIMEROS PASOS" | "OPERACIÓN" | "FINANZAS" | "IA & TÁCTICA" | "COMUNIDAD & PADRES";
  title: string;
  description: string;
  icon: any;
  durationMinutes: number;
  steps: GuideStep[];
}

const GUIDES_DATABASE: GuideItem[] = [
  // ----------------------------------------------------
  // GUÍAS DE ADMINISTRACIÓN
  // ----------------------------------------------------
  {
    id: "g-admin-tour",
    roleTarget: "admin",
    category: "PRIMEROS PASOS",
    title: "Tour Completo: Configuración del Club",
    description: "Configura logo, moneda regional, QR de pagos e información esencial para tu club.",
    icon: Settings,
    durationMinutes: 10,
    steps: [
      {
        title: "¡Bienvenido a DeportivOS!",
        subtitle: "Aprende los conceptos fundamentales para gestionar tu academia.",
        summaryBox: {
          title: "¿Qué aprenderás en esta guía?",
          items: [
            "Cómo configurar la identidad visual y datos de tu club",
            "Establecer tu zona horaria y moneda local (CRC, USD, PEN, etc.)",
            "Configurar notificaciones automáticas y comprobantes de pago",
            "Subir fotos de tus instalaciones y mapa GPS",
            "Gestionar tu plan de suscripción y renovaciones"
          ]
        },
        tip: "Un club con logo, información completa y dirección GPS transmite máximo profesionalismo y genera confianza inmediata en las familias."
      },
      {
        title: "Todas las Secciones de Configuración",
        subtitle: "Visión general de los paneles clave en /configuracion",
        sections: [
          {
            icon: "🏢",
            title: "Información General e Identidad",
            description: "Logo oficial, nombre de la institución, correo administrativo y redes sociales."
          },
          {
            icon: "⚽",
            title: "Categoría de Deporte & Nivel",
            description: "Deporte principal (Fútbol, Baloncesto, Voleibol) y nivel (Academia Formativa, Alto Rendimiento)."
          },
          {
            icon: "🌐",
            title: "Configuración Regional & Moneda",
            description: "Idioma de la plataforma, Zona Horaria (afecta reportes) y Moneda oficial (₡, $, S/)."
          },
          {
            icon: "🔔",
            title: "Notificaciones & Triggers",
            description: "Avisos de bienvenida, recordatorios de cuota y notificaciones push a padres."
          },
          {
            icon: "📍",
            title: "Mapa GPS e Instalaciones",
            description: "Dirección física detallada con mapa interactivo OpenStreetMap y galería fotográfica.",
            badge: "Importante"
          },
          {
            icon: "💳",
            title: "Suscripción & Plan DeportivOS",
            description: "Control de vigencia de licencia, selector de plan mensual o anual con 50% de ahorro."
          }
        ]
      },
      {
        title: "Paso 1: Identidad & Datos Oficiales",
        subtitle: "Mantén actualizado el perfil público de tu academia",
        summaryBox: {
          title: "Checklist de Identidad",
          items: [
            "Sube un logo con fondo transparente en formato PNG o WEBP",
            "Registra los números de contacto oficial (WhatsApp Institucional)",
            "Agrega el enlace web de tu academia para que los padres ingresen"
          ]
        },
        tip: "Estos datos aparecen automáticamente en todos los recibos y facturas generadas por el sistema."
      },
      {
        title: "Paso 2: Configuración Regional & Moneda",
        subtitle: "Ajusta la divisa con la que operará tu tesorería",
        sections: [
          {
            icon: "💲",
            title: "Moneda de Cobro",
            description: "Selecciona CRC (Colón Costarricense), USD (Dólares), PEN (Soles), MXN o COP."
          },
          {
            icon: "🕒",
            title: "Zona Horaria",
            description: "Determina cómo se filtran los reportes diarios y fechas de vencimiento de mensualidades."
          }
        ]
      },
      {
        title: "Paso 3: Fotos de Instalaciones y Ubicación GPS",
        subtitle: "Destaca tus canchas y sede principal",
        tip: "Puedes subir hasta 5 fotos en alta resolución de tus campos sintéticos, gimnasio o vestuarios."
      },
      {
        title: "¡Configuración Completa!",
        subtitle: "Tu academia está 100% lista para operar",
        summaryBox: {
          title: "Siguientes pasos recomendados:",
          items: [
            "Crea o matricula a tus deportistas en Operación Deportiva",
            "Registra tus categorías y sedes de entrenamiento",
            "Asigna entrenadores a sus respectivos equipos en Coach OS"
          ]
        }
      }
    ]
  },
  {
    id: "g-admin-operacion",
    roleTarget: "admin",
    category: "OPERACIÓN",
    title: "Módulo de Operación Deportiva & Jugadores",
    description: "Conoce el panel de gestión de deportistas, categorías, QR y asistencia.",
    icon: Users,
    durationMinutes: 8,
    steps: [
      {
        title: "Gestión Integral de Deportistas",
        subtitle: "Controla matriculaciones, fichas médicas y asistencia",
        summaryBox: {
          title: "Funciones del Módulo de Operación",
          items: [
            "Ficha digital completa de cada deportista con datos de tutores",
            "Control de asistencia por código QR y check-in por tablet",
            "Organización de categorías por años de nacimiento",
            "Asignación de sedes y horarios de entrenamiento"
          ]
        }
      },
      {
        title: "Alta de Jugadores y Formularios",
        subtitle: "Cómo matricular nuevos alumnos en la plataforma",
        sections: [
          {
            icon: "📝",
            title: "Formulario de Alumno",
            description: "Completa nombre, fecha de nacimiento, posición, tutor legal y teléfono."
          },
          {
            icon: "📲",
            title: "Check-in QR",
            description: "Genera el carnet digital con código QR para entrada en sedes."
          }
        ]
      }
    ]
  },
  {
    id: "g-admin-finanzas",
    roleTarget: "admin",
    category: "FINANZAS",
    title: "Finanzas, Pagos & Recibos Digitales",
    description: "Aprende a gestionar cobros de mensualidad, morosidad y comprobantes PDF.",
    icon: Wallet,
    durationMinutes: 7,
    steps: [
      {
        title: "Control de Tesorería del Club",
        subtitle: "Monitorea ingresos, estado de cobros y nóminas",
        summaryBox: {
          title: "¿Qué lograrás en este módulo?",
          items: [
            "Registro rápido de cuotas mensuales (Al día, Moroso, Pendiente)",
            "Emisión instantánea de Recibos en PDF para padres",
            "Cálculo automático de nómina de entrenadores y staff",
            "Alertas automáticas por WhatsApp a alumnos con atraso"
          ]
        }
      }
    ]
  },
  {
    id: "g-admin-ia",
    roleTarget: "admin",
    category: "IA & TÁCTICA",
    title: "IA & Automatizaciones DeportivOS AI",
    description: "Monitoreo predictivo de deserción, generación de crónicas y automatizaciones.",
    icon: Sparkles,
    durationMinutes: 5,
    steps: [
      {
        title: "Inteligencia Artificial para tu Club",
        subtitle: "Optimiza la toma de decisiones con análisis automático",
        summaryBox: {
          title: "Capacidades de DeportivOS AI",
          items: [
            "Detección predictiva de riesgo de abandono de deportistas",
            "Generador automático de sesiones de entrenamiento en 3 fases",
            "Redactor por voz de crónicas de partidos para familias",
            "Consultas en lenguaje natural al Asistente DeportivOS AI"
          ]
        }
      }
    ]
  },

  // ----------------------------------------------------
  // GUÍAS PARA ENTRENADORES (COACH OS)
  // ----------------------------------------------------
  {
    id: "g-coach-inicio",
    roleTarget: "coach",
    category: "PRIMEROS PASOS",
    title: "Guía del Entrenador: Inicio Coach OS",
    description: "Domina tu panel de control, asistencia en cancha y diario del DT.",
    icon: Dumbbell,
    durationMinutes: 8,
    steps: [
      {
        title: "¡Bienvenido al Panel de Entrenador!",
        subtitle: "Todo lo que necesitas para dirigir tus sesiones y partidos.",
        summaryBox: {
          title: "¿Qué aprenderás en Coach OS?",
          items: [
            "Cómo ver la lista de tus equipos asignados y sus jugadores",
            "Pasar asistencia en cancha desde tu celular en 1 clic",
            "Crear convocatorias oficiales para el próximo partido",
            "Llevar el Diario del Entrenador con observaciones técnicas",
            "Planificar sesiones de entrenamiento con ayuda de la IA"
          ]
        },
        tip: "Puedes acceder a Coach OS desde cualquier teléfono móvil o tablet sin necesidad de instalar aplicaciones pesadas."
      },
      {
        title: "Paso 1: Asistencia en Cancha",
        subtitle: "Registro veloz de asistencia en 30 segundos",
        sections: [
          {
            icon: "✅",
            title: "Presente",
            description: "Marca al jugador que asistió puntualmente al entrenamiento."
          },
          {
            icon: "❌",
            title: "Ausente",
            description: "El sistema notifica al padre sobre la inasistencia."
          },
          {
            icon: "🩺",
            title: "Justificado / Lesionado",
            description: "Registra si el jugador está en recuperación con el área médica."
          }
        ]
      },
      {
        title: "Paso 2: Convocatorias de Partido",
        subtitle: "Selecciona y cita a tus jugadores para la jornada",
        summaryBox: {
          title: "Proceso de Convocatoria",
          items: [
            "Elige el partido de la jornada en tu calendario",
            "Selecciona a los deportistas convocados por posición",
            "Define la hora y lugar de citación",
            "Envía la citación oficial al Muro y WhatsApp de los padres"
          ]
        }
      }
    ]
  },
  {
    id: "g-coach-tactica",
    roleTarget: "coach",
    category: "IA & TÁCTICA",
    title: "Centro Táctico & Pizarra Digital 2D/3D",
    description: "Diseña esquemas tácticos, jugadas preparadas y analiza rivales.",
    icon: Trophy,
    durationMinutes: 7,
    steps: [
      {
        title: "Pizarra y Análisis Táctico",
        subtitle: "Prepara tus partidos con herramientas profesionales",
        summaryBox: {
          title: "Herramientas del Centro Táctico",
          items: [
            "Pizarra táctica interactiva con animación de movimiento",
            "Diseño de formaciones (4-3-3, 4-4-2, 3-5-2) y alineaciones",
            "Biblioteca de jugadas a balón parado (tiros de esquina, faltas)",
            "Análisis de rivales y fortalezas/debilidades"
          ]
        }
      }
    ]
  },
  {
    id: "g-coach-ia",
    roleTarget: "coach",
    category: "IA & TÁCTICA",
    title: "Generador IA de Sesiones & Crónicas",
    description: "Crea entrenamientos estructurados y redacta informes por voz.",
    icon: Sparkles,
    durationMinutes: 5,
    steps: [
      {
        title: "Potencia tus Entrenamientos con DeportivOS AI",
        subtitle: "Ahorra tiempo de planificación diaria con inteligencia artificial",
        summaryBox: {
          title: "Cómo usar los Generadores IA",
          items: [
            "Ingresa la edad/categoría, objetivo táctico y duración deseada",
            "Obtén una sesión dividida en Calentamiento, Parte Principal y Vuelta a la Calma",
            "Usa el botón de Dictado por Voz para narrar lo sucedido en el partido",
            "Publica automáticamente la crónica en el Muro del Club"
          ]
        },
        tip: "Usa el micrófono de tu celular al terminar el partido para dictar tu nota rápida; la IA se encargará de redactarla de forma emocionante."
      }
    ]
  },

  // ----------------------------------------------------
  // GUÍAS PARA PADRES DE FAMILIA
  // ----------------------------------------------------
  {
    id: "g-padres-inicio",
    roleTarget: "padres",
    category: "COMUNIDAD & PADRES",
    title: "Guía de Padres: Mi Hijo & Carnet Digital",
    description: "Sigue el rendimiento de tu hijo, carnet QR y convocatorias de partidos.",
    icon: GraduationCap,
    durationMinutes: 5,
    steps: [
      {
        title: "¡Bienvenido a la App de Padres DeportivOS!",
        subtitle: "Mantente al tanto de la evolución deportiva de tu hijo.",
        summaryBox: {
          title: "¿Qué puedes hacer desde tu perfil de Padre?",
          items: [
            "Ver la ficha deportiva de tu hijo (asistencia, minutos jugados)",
            "Mostrar el Carnet Digital QR al ingresar a los campos deportivos",
            "Confirmar la asistencia a convocatorias de partidos oficiales",
            "Revisar el Muro del Club para fotos, comunicados y crónicas",
            "Consultar el estado de tus mensualidades y recibos"
          ]
        }
      },
      {
        title: "Paso 1: Carnet Digital QR",
        subtitle: "Tu acceso rápido en puerta",
        sections: [
          {
            icon: "📲",
            title: "Presentación del QR",
            description: "Abre la sección Carnet Digital y muéstralo al personal de entrada en la sede."
          },
          {
            icon: "✅",
            title: "Notificación de Entrada",
            description: "Recibirás una confirmación en tiempo real cuando tu hijo ingrese al complejo."
          }
        ]
      }
    ]
  },
  {
    id: "g-padres-pagos",
    roleTarget: "padres",
    category: "FINANZAS",
    title: "Consulta de Cuotas & Recibos de Pago",
    description: "Revisa tu estado de cuenta y descarga comprobantes de pago.",
    icon: Wallet,
    durationMinutes: 4,
    steps: [
      {
        title: "Gestión Transparente de Mensualidades",
        subtitle: "Consulta de comprobantes y estado de cuota",
        summaryBox: {
          title: "Funciones Financieras para Padres",
          items: [
            "Estado de cuenta en tiempo real (Al día / Pendiente)",
            "Descarga de recibos oficiales en formato PDF",
            "Instrucciones para transferencias y comprobantes SINPE/Tarjeta"
          ]
        }
      }
    ]
  }
];

export function InteractiveGuidesModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { role } = useRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<"admin" | "coach" | "padres" | "all">(
    role === "admin" ? "admin" : role === "coach" ? "coach" : "padres"
  );
  const [activeCategory, setActiveCategory] = useState<string>("TODAS");
  
  // Active Guide Viewing State
  const [activeGuide, setActiveGuide] = useState<GuideItem | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Filtered Guides List
  const filteredGuides = useMemo(() => {
    return GUIDES_DATABASE.filter((g) => {
      // Role Filter
      if (selectedRoleFilter !== "all" && g.roleTarget !== selectedRoleFilter && g.roleTarget !== "all") {
        return false;
      }
      // Category Filter
      if (activeCategory !== "TODAS" && g.category !== activeCategory) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedRoleFilter, activeCategory, searchQuery]);

  const handleStartGuide = (guide: GuideItem) => {
    setActiveGuide(guide);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (!activeGuide) return;
    if (currentStepIndex < activeGuide.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      toast.success("🎉 ¡Felicitaciones! Has completado esta guía interactiva.");
      setActiveGuide(null);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card text-foreground border border-border shadow-2xl rounded-3xl">
        {/* MODE 1: LIST / BROWSER OF GUIDES */}
        {!activeGuide ? (
          <div className="flex flex-col h-[620px]">
            {/* Top Search & Header */}
            <div className="p-5 border-b border-border/60 bg-muted/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-elegant">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight text-foreground">
                      Centro de Guías & Manuales Interactivos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Paso a paso especializado para la gestión del club.
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar guías (ej. Configuración, Asistencia, Pagos)..."
                  className="pl-9 h-10 text-xs rounded-xl bg-background border-border focus:ring-1 focus:ring-primary"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                  Esc
                </kbd>
              </div>

              {/* Role Filter Tabs */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
                  <button
                    onClick={() => setSelectedRoleFilter("admin")}
                    className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition ${
                      selectedRoleFilter === "admin"
                        ? "bg-gradient-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    👑 Administración ({GUIDES_DATABASE.filter(g => g.roleTarget === "admin").length})
                  </button>
                  <button
                    onClick={() => setSelectedRoleFilter("coach")}
                    className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition ${
                      selectedRoleFilter === "coach"
                        ? "bg-gradient-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    ⚽ Entrenadores ({GUIDES_DATABASE.filter(g => g.roleTarget === "coach").length})
                  </button>
                  <button
                    onClick={() => setSelectedRoleFilter("padres")}
                    className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition ${
                      selectedRoleFilter === "padres"
                        ? "bg-gradient-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    👨‍👩‍👧‍👦 Padres ({GUIDES_DATABASE.filter(g => g.roleTarget === "padres").length})
                  </button>
                </div>
              </div>
            </div>

            {/* Guides Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {filteredGuides.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Guías Disponibles ({filteredGuides.length})
                  </span>

                  <div className="grid gap-3">
                    {filteredGuides.map((guide) => {
                      const IconComp = guide.icon;
                      return (
                        <div
                          key={guide.id}
                          onClick={() => handleStartGuide(guide)}
                          className="group p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/30 hover:border-primary/40 transition cursor-pointer flex items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                              <IconComp className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-xs text-foreground group-hover:text-primary transition truncate">
                                  {guide.title}
                                </h4>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-muted/50 border-border">
                                  {guide.category}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {guide.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                              <Clock className="h-3 w-3 text-primary" /> {guide.durationMinutes} min
                            </span>
                            <div className="h-7 w-7 rounded-xl bg-muted group-hover:bg-primary group-hover:text-white flex items-center justify-center transition">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground space-y-2">
                  <Search className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs font-semibold">No se encontraron guías para la búsqueda.</p>
                </div>
              )}
            </div>

            {/* Footer summary */}
            <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground px-5">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> DeportivOS Academy Knowledge Center
              </span>
              <span className="font-bold text-foreground">{GUIDES_DATABASE.length} Guías Disponibles</span>
            </div>
          </div>
        ) : (
          /* MODE 2: STEP-BY-STEP INTERACTIVE LESSON VIEWER */
          <div className="flex flex-col h-[650px] bg-card text-foreground">
            {/* Header bar */}
            <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <button 
                onClick={() => setActiveGuide(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft className="h-4 w-4" /> Volver a la lista
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold flex items-center gap-1.5 text-foreground">
                  <BookOpen className="h-4 w-4 text-primary" /> {activeGuide.title}
                </span>
              </div>

              <button 
                onClick={() => setActiveGuide(null)}
                className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs hover:bg-rose-500 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress Segment Bar */}
            <div className="px-6 pt-4 pb-2 border-b border-border/40 space-y-2 bg-muted/10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-primary">
                  Paso {currentStepIndex + 1} de {activeGuide.steps.length}
                </span>
                <span className="text-muted-foreground font-medium">
                  ~{activeGuide.durationMinutes} min de lectura
                </span>
              </div>

              {/* Segmented Dots */}
              <div className="flex items-center gap-1.5">
                {activeGuide.steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      idx === currentStepIndex
                        ? "bg-gradient-primary shadow-sm scale-y-125"
                        : idx < currentStepIndex
                        ? "bg-emerald-500"
                        : "bg-muted border border-border/60"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Active Step Content */}
            {(() => {
              const step = activeGuide.steps[currentStepIndex];
              return (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Step Title Header */}
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                      {step.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {step.subtitle}
                    </p>
                  </div>

                  {/* Summary Box / What you'll learn */}
                  {step.summaryBox && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                      <div className="font-extrabold text-xs text-primary flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {step.summaryBox.title}
                      </div>
                      <ul className="space-y-2">
                        {step.summaryBox.items.map((item, i) => (
                          <li key={i} className="text-xs flex items-start gap-2 text-foreground">
                            <span className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              ✓
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Feature Cards Grid (if step has sections) */}
                  {step.sections && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {step.sections.map((sec, i) => (
                        <div key={i} className="p-3.5 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition space-y-1 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-lg">{sec.icon}</span>
                            {sec.badge && (
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[9px]">
                                {sec.badge}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-foreground mt-1">{sec.title}</h4>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{sec.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pro Tip Callout */}
                  {step.tip && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold text-amber-600 dark:text-amber-400 text-xs block">Consejo Pro:</span>
                        <p className="leading-relaxed text-[11px]">{step.tip}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Bottom Step Navigation Bar */}
            <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between px-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="text-xs font-bold gap-1 rounded-xl"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Anterior
              </Button>

              <div className="text-[11px] text-muted-foreground font-semibold">
                {currentStepIndex + 1} de {activeGuide.steps.length}
              </div>

              <Button
                onClick={handleNextStep}
                className="bg-gradient-primary text-white font-extrabold text-xs gap-1 px-6 shadow-elegant rounded-xl"
              >
                {currentStepIndex === activeGuide.steps.length - 1 ? (
                  <>Completar Guía 🎉</>
                ) : (
                  <>Siguiente <ArrowRight className="h-3.5 w-3.5" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
