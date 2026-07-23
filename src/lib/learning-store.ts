import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";

export interface LessonNode {
  id: string;
  title: string;
  subtitle: string;
  xp: number;
  actionUrl: string;
  actionLabel: string;
  icon: string;
  tip?: string;
  details?: string[];
}

export interface LearningPhase {
  phaseId: number;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  lessons: LessonNode[];
}

export interface RoleRoadmap {
  role: "admin" | "coach" | "padres";
  title: string;
  description: string;
  levelTitle: string;
  phases: LearningPhase[];
}

export interface ActiveStepState {
  lessonId: string;
  title: string;
  subtitle: string;
  xp: number;
  actionUrl: string;
  phaseTitle: string;
}

export const ROADMAP_DATA: Record<"admin" | "coach" | "padres", RoleRoadmap> = {
  // 👑 ADMINISTRACIÓN ROADMAP
  admin: {
    role: "admin",
    title: "Ruta de Maestría de Dirección de Club",
    description: "Domina la gestión integral de tu institución desde la identidad inicial hasta la retención con Inteligencia Artificial.",
    levelTitle: "Director Institucional Élite",
    phases: [
      {
        phaseId: 1,
        title: "Fase 1: Cimientos e Identidad del Club",
        subtitle: "Configura la marca, moneda regional, mapa GPS e instalaciones oficiales.",
        badge: "Fundación Institucional",
        color: "from-purple-600 to-indigo-600",
        lessons: [
          {
            id: "admin-1-1",
            title: "Identidad & Datos Oficiales",
            subtitle: "Logo, WhatsApp institucional y enlace web oficial",
            xp: 50,
            actionUrl: "/configuracion?tab=general",
            actionLabel: "Ir a Perfil de Organización",
            icon: "🏢",
            tip: "Un logo transparente en PNG y números oficiales otorgan respaldo profesional a tu club.",
            details: [
              "Subir el logo corporativo del club",
              "Registrar teléfonos oficiales de atención",
              "Vincular el sitio web institucional"
            ]
          },
          {
            id: "admin-1-2",
            title: "Configuración Regional & Moneda",
            subtitle: "Divisa local (₡, $, S/) y Zona Horaria para reportes",
            xp: 50,
            actionUrl: "/configuracion?tab=regional",
            actionLabel: "Ir a Configuración Regional",
            icon: "🌐",
            tip: "La zona horaria correcta asegura la precisión en las fechas de morosidad y filtros diarios.",
            details: [
              "Seleccionar la moneda local de cobro",
              "Establecer la Zona Horaria del servidor",
              "Ajustar el idioma de la plataforma"
            ]
          },
          {
            id: "admin-1-3",
            title: "Ubicación GPS & Galería del Club",
            subtitle: "Mapa interactivo OpenStreetMap y fotos de canchas",
            xp: 75,
            actionUrl: "/configuracion?tab=general",
            actionLabel: "Ir a Mapa e Instalaciones",
            icon: "📍",
            tip: "Las familias valoran conocer la ubicación exacta y fotos en alta resolución de las instalaciones.",
            details: [
              "Verificar la dirección física central",
              "Subir fotos en formato 16:9 de las canchas y gimnasio"
            ]
          },
          {
            id: "admin-1-4",
            title: "Suscripción & Licencia DeportivOS",
            subtitle: "Elección de plan mensual o anual con 50% de ahorro",
            xp: 100,
            actionUrl: "/configuracion?tab=suscripcion",
            actionLabel: "Ir a Suscripción & Plan",
            icon: "💳",
            tip: "El plan anual congela tu tarifa por deportista independientemente de tu crecimiento.",
            details: [
              "Revisar deportistas activos matriculados",
              "Seleccionar el ciclo de facturación preferido"
            ]
          }
        ]
      },
      {
        phaseId: 2,
        title: "Fase 2: Estructura Deportiva & Plantilla",
        subtitle: "Organiza categorías, sedes, matriculaciones y carnets QR.",
        badge: "Estructura Operativa",
        color: "from-blue-600 to-cyan-600",
        lessons: [
          {
            id: "admin-2-1",
            title: "Creación de Categorías y Sedes",
            subtitle: "Grupos por año de nacimiento y campos de entrenamiento",
            xp: 50,
            actionUrl: "/categorias",
            actionLabel: "Ir a Categorías",
            icon: "⚽",
            details: [
              "Definir categorías Sub-8 a Mayor",
              "Asignar entrenadores principales por categoría"
            ]
          },
          {
            id: "admin-2-2",
            title: "Matriculación de Alumnos & Tutores",
            subtitle: "Expedientes completos con contacto de encargados",
            xp: 75,
            actionUrl: "/jugadores",
            actionLabel: "Ir a Expedientes de Jugadores",
            icon: "👥",
            details: [
              "Registrar la ficha médica y posición del deportista",
              "Vincular el correo del encargado legal para facturación"
            ]
          },
          {
            id: "admin-2-3",
            title: "Carnet Digital & Check-in QR",
            subtitle: "Control de acceso en puerta por código QR",
            xp: 75,
            actionUrl: "/checkin",
            actionLabel: "Ir a Check-in QR",
            icon: "📲",
            details: [
              "Generar carnet digital de deportistas",
              "Probar escáner QR en tablet o móvil"
            ]
          }
        ]
      },
      {
        phaseId: 3,
        title: "Fase 3: Control Financiero & Tesorería",
        subtitle: "Gestión de mensualidades, recibos PDF, egresos y nóminas.",
        badge: "Salud Financiera",
        color: "from-emerald-600 to-teal-600",
        lessons: [
          {
            id: "admin-3-1",
            title: "Cobro de Mensualidades & Recibos",
            subtitle: "Registro de pagos, estados y comprobantes PDF",
            xp: 75,
            actionUrl: "/pagos",
            actionLabel: "Ir a Gestión de Pagos",
            icon: "💰",
            details: [
              "Registrar cobros mensuales de alumnos",
              "Emitir recibos en PDF con sello del club"
            ]
          },
          {
            id: "admin-3-2",
            title: "Nómina de Entrenadores & Gastos",
            subtitle: "Control de honorarios del staff y caja chica",
            xp: 75,
            actionUrl: "/finanzas",
            actionLabel: "Ir a Finanzas & Nómina",
            icon: "📝",
            details: [
              "Revisar liquidaciones del cuerpo técnico",
              "Registrar gastos de arbitraje e indumentaria"
            ]
          }
        ]
      },
      {
        phaseId: 4,
        title: "Fase 4: Inteligencia Artificial & Retención",
        subtitle: "Monitoreo de deserción y copiloto automatizado.",
        badge: "Master AI & Churn Control",
        color: "from-amber-600 to-orange-600",
        lessons: [
          {
            id: "admin-4-1",
            title: "Dashboard de Retención & Churn",
            subtitle: "Análisis predictivo de bajas y matriz de cohortes",
            xp: 100,
            actionUrl: "/retencion",
            actionLabel: "Ir a Alertas de Retención",
            icon: "📊",
            details: [
              "Intervenir alumnos en riesgo alto de abandono",
              "Enviar ofertas o contacto directo por WhatsApp"
            ]
          },
          {
            id: "admin-4-2",
            title: "Asistente DeportivOS AI",
            subtitle: "Consultas analíticas en lenguaje natural",
            xp: 100,
            actionUrl: "/ia",
            actionLabel: "Ir a DeportivOS AI",
            icon: "✨",
            details: [
              "Solicitar reportes ejecutivos de rendimiento",
              "Configurar automatizaciones institucionales"
            ]
          }
        ]
      }
    ]
  },

  // ⚽ ENTRENADORES ROADMAP
  coach: {
    role: "coach",
    title: "Ruta de Maestría para Directores Técnicos",
    description: "Perfecciona el control de tus plantillas, sesiones de campo, pizarra táctica e IA aplicada.",
    levelTitle: "Master Tactical Coach",
    phases: [
      {
        phaseId: 1,
        title: "Fase 1: Tu Día a Día en Coach OS",
        subtitle: "Gestión de tus equipos asignados y pase de lista en cancha.",
        badge: "Gestión de Campo",
        color: "from-indigo-600 to-blue-600",
        lessons: [
          {
            id: "coach-1-1",
            title: "Mis Equipos & Expedientes Alumnos",
            subtitle: "Revisión de la plantilla asignada y estado físico",
            xp: 50,
            actionUrl: "/equipos",
            actionLabel: "Ir a Mis Equipos",
            icon: "👟",
            details: [
              "Explorar listas de jugadores de tu categoría",
              "Ver fichas médicas y teléfonos de contacto"
            ]
          },
          {
            id: "coach-1-2",
            title: "Asistencia Veloz en 1-Clic",
            subtitle: "Toma de asistencia desde el celular en campo",
            xp: 75,
            actionUrl: "/asistencia",
            actionLabel: "Ir a Pasar Asistencia",
            icon: "✅",
            details: [
              "Marcar Presentes, Ausentes y Lesionados",
              "Notificar ausencias a los encargados"
            ]
          }
        ]
      },
      {
        phaseId: 2,
        title: "Fase 2: Convocatorias & Diario del DT",
        subtitle: "Citación oficial para partidos y observaciones técnicas.",
        badge: "Planificación de Jornada",
        color: "from-violet-600 to-purple-600",
        lessons: [
          {
            id: "coach-2-1",
            title: "Convocatorias Oficiales",
            subtitle: "Selección de lista de citados e indicaciones",
            xp: 75,
            actionUrl: "/convocatorias",
            actionLabel: "Ir a Convocatorias",
            icon: "📋",
            details: [
              "Crear la citación del próximo encuentro",
              "Enviar aviso al Muro de los padres"
            ]
          },
          {
            id: "coach-2-2",
            title: "Diario del Entrenador",
            subtitle: "Notas tácticas y evolución de deportistas",
            xp: 50,
            actionUrl: "/diario",
            actionLabel: "Ir a Diario del DT",
            icon: "📓",
            details: [
              "Registrar anotaciones individuales del partido",
              "Definir metas semanales por categoría"
            ]
          }
        ]
      },
      {
        phaseId: 3,
        title: "Fase 3: Centro Táctico & Pizarra Digital",
        subtitle: "Estrategias, jugadas preparadas y animación 2D/3D.",
        badge: "Táctica Pro",
        color: "from-emerald-600 to-teal-600",
        lessons: [
          {
            id: "coach-3-1",
            title: "Pizarra Táctica Interactiva",
            subtitle: "Diseño de jugadas y esquemas de juego",
            xp: 100,
            actionUrl: "/tactica/pizarra",
            actionLabel: "Ir a Pizarra Táctica",
            icon: "♟️",
            details: [
              "Armar alineaciones iniciales",
              "Graficar movimientos tácticos y balón parado"
            ]
          }
        ]
      },
      {
        phaseId: 4,
        title: "Fase 4: Inteligencia Artificial Deportiva",
        subtitle: "Generación automática de sesiones y dictado por voz.",
        badge: "AI Tactical Specialist",
        color: "from-amber-600 to-orange-600",
        lessons: [
          {
            id: "coach-4-1",
            title: "Generador IA de Sesiones",
            subtitle: "Entrenamientos en 3 fases adaptados a la categoría",
            xp: 100,
            actionUrl: "/ia",
            actionLabel: "Ir a Generador IA",
            icon: "✨",
            details: [
              "Generar sesiones por objetivo (Pase, Presión, Remate)",
              "Imprimir o exportar la ficha de entrenamiento"
            ]
          },
          {
            id: "coach-4-2",
            title: "Redactor por Voz de Crónicas",
            subtitle: "Dicta la crónica del partido al terminar la jornada",
            xp: 100,
            actionUrl: "/ia",
            actionLabel: "Ir a Redactor de Crónicas",
            icon: "🎙️",
            details: [
              "Usar dictado por micrófono para narrar el resultado",
              "Publicar automáticamente en el Muro del Club"
            ]
          }
        ]
      }
    ]
  },

  // 👨‍👩‍👧‍👦 PADRES DE FAMILIA ROADMAP
  padres: {
    role: "padres",
    title: "Ruta de la Familia DeportivOS",
    description: "Aprende a consultar la evolución deportiva de tu hijo, carnet digital y mensualidades.",
    levelTitle: "Padre de Familia Élite",
    phases: [
      {
        phaseId: 1,
        title: "Fase 1: Conexión con el Club",
        subtitle: "Carnet digital QR y ficha del deportista.",
        badge: "Identidad Deportiva",
        color: "from-purple-600 to-indigo-600",
        lessons: [
          {
            id: "padres-1-1",
            title: "Ficha del Alumno & Rendimiento",
            subtitle: "Consulta de asistencia y métricas físicas",
            xp: 50,
            actionUrl: "/jugadores/j1",
            actionLabel: "Ver Ficha de mi Hijo",
            icon: "🏃",
            details: [
              "Ver la tasa de asistencia a entrenamientos",
              "Revisar posiciones y recomendaciones del entrenador"
            ]
          },
          {
            id: "padres-1-2",
            title: "Carnet Digital QR",
            subtitle: "Código QR para el acceso rápido en la entrada",
            xp: 75,
            actionUrl: "/encargados",
            actionLabel: "Ver Carnet QR",
            icon: "📲",
            details: [
              "Presentar el QR en la puerta de la sede",
              "Verificar estados de notificaciones de entrada"
            ]
          }
        ]
      },
      {
        phaseId: 2,
        title: "Fase 2: Convocatorias & Muro del Club",
        subtitle: "Confirmación a partidos y noticias institucionales.",
        badge: "Comunidad Deportiva",
        color: "from-blue-600 to-cyan-600",
        lessons: [
          {
            id: "padres-2-1",
            title: "Convocatorias a Partidos",
            subtitle: "Confirmación de citación de tu hijo",
            xp: 75,
            actionUrl: "/muro",
            actionLabel: "Ir al Muro del Club",
            icon: "🏟️",
            details: [
              "Revisar la hora y cancha del encuentro",
              "Confirmar asistencia del deportista"
            ]
          }
        ]
      },
      {
        phaseId: 3,
        title: "Fase 3: Mensualidades & Tienda Oficial",
        subtitle: "Pagos transparentes y equipamiento deportivo.",
        badge: "Apoyo Continuo",
        color: "from-emerald-600 to-teal-600",
        lessons: [
          {
            id: "padres-3-1",
            title: "Consulta de Cuotas & Recibos",
            subtitle: "Estado de mensualidad y comprobantes PDF",
            xp: 75,
            actionUrl: "/pagos",
            actionLabel: "Ir a Mis Pagos",
            icon: "💳",
            details: [
              "Revisar cuotas al día o vigentes",
              "Descargar recibos de pago oficiales en PDF"
            ]
          },
          {
            id: "padres-3-2",
            title: "Tienda Oficial del Club",
            subtitle: "Uniformes, camisetas y accesorios oficiales",
            xp: 50,
            actionUrl: "/tienda",
            actionLabel: "Ir a Tienda del Club",
            icon: "🛍️",
            details: [
              "Seleccionar uniforme de entrenamiento o competencia",
              "Realizar pedidos directo a la administración"
            ]
          }
        ]
      }
    ]
  }
};

export class LearningStore {
  private static KEY = "deportivos_learning_progress";
  private static ACTIVE_KEY = "deportivos_active_learning_step";

  public static getCompletedLessons(): string[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  public static isLessonCompleted(lessonId: string): boolean {
    const list = this.getCompletedLessons();
    return list.includes(lessonId);
  }

  public static toggleLessonCompleted(lessonId: string): boolean {
    const list = this.getCompletedLessons();
    let updated: string[];
    let isCompletedNow = false;

    if (list.includes(lessonId)) {
      updated = list.filter((id) => id !== lessonId);
      isCompletedNow = false;
    } else {
      updated = [...list, lessonId];
      isCompletedNow = true;
    }

    if (typeof window !== "undefined") {
      localStorage.getItem(this.KEY);
      localStorage.setItem(this.KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("deportivos_learning_updated"));
    }
    return isCompletedNow;
  }

  public static getActiveStep(): ActiveStepState | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(this.ACTIVE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  public static setActiveStep(step: ActiveStepState): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.ACTIVE_KEY, JSON.stringify(step));
    window.dispatchEvent(new Event("deportivos_learning_updated"));
  }

  public static clearActiveStep(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.ACTIVE_KEY);
    window.dispatchEvent(new Event("deportivos_learning_updated"));
  }

  public static calculateXP(role: "admin" | "coach" | "padres"): { currentXP: number; totalXP: number; completedCount: number; totalCount: number } {
    const roadmap = ROADMAP_DATA[role];
    const completed = this.getCompletedLessons();

    let currentXP = 0;
    let totalXP = 0;
    let completedCount = 0;
    let totalCount = 0;

    roadmap.phases.forEach((phase) => {
      phase.lessons.forEach((lesson) => {
        totalCount++;
        totalXP += lesson.xp;
        if (completed.includes(lesson.id)) {
          completedCount++;
          currentXP += lesson.xp;
        }
      });
    });

    return { currentXP, totalXP, completedCount, totalCount };
  }
}

export default LearningStore;
