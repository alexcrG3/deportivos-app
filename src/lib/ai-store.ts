import RendimientoStore from "./rendimiento-store";
import { facturas, crmLeads, entrenadores, aiRiskScores, pagos, jugadores, encargados, convocatorias, matches } from "./mock-data";

// ─── AI STORE TYPES ─────────────────────────────────────────────────────────
export type AIRole = 
  | "Director Deportivo"
  | "Entrenador"
  | "Preparador Físico"
  | "Analista Deportivo"
  | "Médico Deportivo"
  | "Analista Financiero"
  | "Administrador"
  | "Asistente de Competencias";

export type AIAgentName =
  | "Coach AI"
  | "Performance AI"
  | "Medical AI"
  | "Finance AI"
  | "CRM AI"
  | "Competition AI"
  | "Parent AI"
  | "Player AI";

export interface AIConversation {
  id: string;
  userRole: string;
  title: string;
  date: string;
  active: boolean;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  sender: "user" | "ai";
  text: string;
  roleAssumed?: AIRole;
  agentName?: AIAgentName;
  date: string;
  actions?: AIAction[];
  pendingApproval?: {
    actionId: string;
    detail: string;
  };
  documentPayload?: {
    title: string;
    type: "expediente" | "informe";
    data: Record<string, any>;
    downloadUrl: string;
  };
}

export interface AIContext {
  conversationId: string;
  lastJugadorId?: string;
  lastEquipoId?: string;
  lastEntrenamientoId?: string;
}

export interface AIAction {
  id: string;
  conversationId: string;
  type: "evaluacion" | "cita" | "notificacion" | "carga" | "morosidad" | "convocatoria";
  status: "pending" | "completed";
  detail: string;
  date: string;
}

export interface AISummary {
  id: string;
  type: "diario" | "semanal" | "mensual";
  date: string;
  text: string;
}

export interface AIInsight {
  id: string;
  titulo: string;
  detalle: string;
  categoria: string;
  impacto: "positivo" | "negativo";
  fecha: string;
  destacado?: "jugador" | "equipo" | "riesgo" | "crecimiento" | "descenso" | "mejora";
  entidadNombre?: string;
}

export interface AILog {
  id: string;
  userRole: string;
  query: string;
  date: string;
  modelUsed: string;
  responseTimeMs: number;
  costEstimateUSD: number;
  timeSavedMinutes: number;
  agentName: AIAgentName;
}

export interface AIPrediction {
  id: string;
  jugadorId: string;
  jugador: string;
  avatar: string;
  tipo: "lesion" | "abandono" | "mora" | "asistencia" | "rendimiento";
  probabilidad: number;
  nivelConfianza: "Alta" | "Media" | "Baja";
  variables: string[];
  explicacion: string;
  horizonte: string;
}

export interface AIRecommendation {
  id: string;
  jugadorId: string;
  jugador: string;
  tipo: "lesion" | "fatiga" | "wellness" | "morosidad" | "asistencia" | "rendimiento";
  texto: string;
  prioridad: "critica" | "alta" | "media" | "baja";
  confianza: "Alta" | "Media" | "Baja";
  variables: string[];
  explicacion: string;
  accionText: string;
  completada: boolean;
}

export interface AIPriority {
  id: string;
  categoria: "critico" | "alto" | "medio" | "bajo";
  titulo: string;
  detalle: string;
  to: string;
}

export interface AIConfig {
  model: string;
  language: string;
  tone: string;
  detail: string;
  automationWellness: boolean;
  automationMorosidad: boolean;
  automationRTP: boolean;
  webhookUrl: string;
}

// ─── INITIAL SEED DATA ───────────────────────────────────────────────────────
const INITIAL_CONVERSATIONS: AIConversation[] = [
  { id: "conv-1", userRole: "admin", title: "Resumen deportivo de la semana", date: "2026-07-10T10:00:00Z", active: false },
  { id: "conv-2", userRole: "admin", title: "Análisis de riesgo Sub-17", date: "2026-07-11T15:30:00Z", active: true }
];

const INITIAL_MESSAGES: AIMessage[] = [
  {
    id: "msg-1",
    conversationId: "conv-2",
    sender: "user",
    text: "¿Quién tiene mayor riesgo de lesión?",
    date: "2026-07-11T15:30:00Z"
  },
  {
    id: "msg-2",
    conversationId: "conv-2",
    sender: "ai",
    text: "El sistema detecta que el atleta con mayor riesgo de lesión es **[Santiago Jiménez](/jugadores/j4)** de la categoría Sub-16/Sub-17 con un **ACWR crítico de 1.62** (zona de peligro) y una fatiga acumulada del 82%. Recomiendo descanso activo o reducción drástica del volumen de entrenamiento.",
    roleAssumed: "Médico Deportivo",
    agentName: "Medical AI",
    date: "2026-07-11T15:31:00Z"
  }
];

const INITIAL_CONTEXTS: AIContext[] = [
  { conversationId: "conv-2", lastJugadorId: "j4" }
];

const INITIAL_INSIGHTS: AIInsight[] = [
  { id: "ins-1", titulo: "Aumento de intensidad en Sub-15", detalle: "El equipo Sub-15 aumentó un 18% su intensidad acumulada promedio durante esta semana respecto al microciclo anterior.", categoria: "Cargas", impacto: "negativo", fecha: "2026-07-12T08:00:00Z", destacado: "equipo", entidadNombre: "Sub-15" },
  { id: "ins-2", titulo: "Mejora de Sports Score", detalle: "Sofía Rodríguez mejoró un 12% su Sports Score general respecto al mes anterior consolidándose en rango excelente.", categoria: "Rendimiento", impacto: "positivo", fecha: "2026-07-12T09:00:00Z", destacado: "jugador", entidadNombre: "Sofía Rodríguez" },
  { id: "ins-3", titulo: "Caída de asistencia femenina", detalle: "La asistencia general en la rama de fútbol femenino disminuyó un 8% en las últimas dos semanas por periodos vacacionales.", categoria: "Asistencia", impacto: "negativo", fecha: "2026-07-12T10:00:00Z", destacado: "descenso", entidadNombre: "Rama Femenina" },
  { id: "ins-4", titulo: "Entrenador Destacado", detalle: "El coach Carlos Gómez registra el mayor porcentaje de cumplimiento de microciclos planificados y 98% asistencia.", categoria: "Operación", impacto: "positivo", fecha: "2026-07-12T11:00:00Z", destacado: "mejora", entidadNombre: "Carlos Gómez" },
  { id: "ins-5", titulo: "Wellness bajo en U13", detalle: "La categoría Baloncesto Sub-12 (U13) presenta el menor Wellness promedio de la academia (71/100) debido a reportes recurrentes de fatiga escolar.", categoria: "Wellness", impacto: "negativo", fecha: "2026-07-12T12:00:00Z", destacado: "riesgo", entidadNombre: "Baloncesto Sub-12" }
];

const INITIAL_PREDICTIONS: AIPrediction[] = [
  {
    id: "pred-1",
    jugadorId: "j4",
    jugador: "Santiago Jiménez",
    avatar: "https://i.pravatar.cc/100?img=13",
    tipo: "lesion",
    probabilidad: 82,
    nivelConfianza: "Alta",
    variables: ["ACWR: 1.62", "Wellness Bajo (3 días)", "Carga semanal aumentada +32%", "Historial de desgarro"],
    explicacion: "Santiago presenta sobrecarga crítica por encima de su capacidad crónica debido al volumen acumulado del fin de semana.",
    horizonte: "7 días"
  },
  {
    id: "pred-2",
    jugadorId: "j2",
    jugador: "Mateo Vargas",
    avatar: "https://i.pravatar.cc/100?img=5",
    tipo: "abandono",
    probabilidad: 65,
    nivelConfianza: "Media",
    variables: ["Asistencia acumulada: 74%", "Wellness de ánimo reportado bajo", "Últimos 2 pagos con atraso"],
    explicacion: "Alta correlación histórica entre ausencias recurrentes consecutivas y desvinculación a corto plazo.",
    horizonte: "30 días"
  },
  {
    id: "pred-3",
    jugadorId: "j1",
    jugador: "Sofía Rodríguez",
    avatar: "https://i.pravatar.cc/100?img=1",
    tipo: "rendimiento",
    probabilidad: 91,
    nivelConfianza: "Alta",
    variables: ["Asistencia: 100%", "Sports Score: 95%", "Wellness: 96%", "Mejora potencia en test de salto"],
    explicacion: "La jugadora se encuentra en su zona óptima fisiológica, facilitando un pico de velocidad y fuerza en el próximo mes.",
    horizonte: "14 días"
  }
];

const INITIAL_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: "rec-1",
    jugadorId: "j4",
    jugador: "Santiago Jiménez",
    tipo: "lesion",
    texto: "Se recomienda reducir la carga de entrenamiento en un 30% durante las próximas 48 horas.",
    prioridad: "critica",
    confianza: "Alta",
    variables: ["ACWR superior (1.62)", "Wellness crítico", "Carga semanal elevada"],
    explicacion: "Santiago supera la zona dulce de carga (1.3) y reporta dolor muscular moderado.",
    accionText: "Reducir Carga",
    completada: false
  },
  {
    id: "rec-2",
    jugadorId: "j2",
    jugador: "Mateo Vargas",
    tipo: "morosidad",
    texto: "Enviar recordatorio automático de pago pendiente de mensualidad al representante de Mateo.",
    prioridad: "alta",
    confianza: "Alta",
    variables: ["1 cuota vencida", "Factura REF-10002 pendiente"],
    explicacion: "El pago de Julio no ha sido reportado y el encargado no responde los correos de facturación.",
    accionText: "Enviar Recordatorio",
    completada: false
  },
  {
    id: "rec-3",
    jugadorId: "j3",
    jugador: "Valentina Soto",
    tipo: "asistencia",
    texto: "Contactar a Valentina para conocer el motivo de sus ausencias de esta semana.",
    prioridad: "media",
    confianza: "Media",
    variables: ["2 ausencias consecutivas", "Último entrenamiento sin carga registrada"],
    explicacion: "Inasistencia injustificada sin reporte de indisposición médica.",
    accionText: "Contactar Atleta",
    completada: false
  }
];

const INITIAL_PRIORITIES: AIPriority[] = [
  { id: "prio-1", categoria: "critico", titulo: "Riesgo de lesión de Santiago", detalle: "Santiago Jiménez presenta riesgo de lesión del 82% por sobrecarga física aguda.", to: "/ia/predicciones" },
  { id: "prio-2", categoria: "alto", titulo: "Mensualidades Vencidas Sub-17", detalle: "Hay 5 mensualidades pendientes de cobro en la categoría de competencia.", to: "/finanzas" },
  { id: "prio-3", categoria: "medio", titulo: "Wellness Pendiente U13", detalle: "Categoría Sub-12 requiere completar check-in del día.", to: "/rendimiento/wellness" }
];

const DEFAULT_CONFIG: AIConfig = {
  model: "gpt-4o",
  language: "es",
  tone: "Profesional",
  detail: "Completo",
  automationWellness: true,
  automationMorosidad: false,
  automationRTP: true,
  webhookUrl: "https://n8n.deportivos.os/webhooks/ai"
};

// ─── CLASS AI STORE ──────────────────────────────────────────────────────────
export class AIStore {
  // --- LOCAL STORAGE HELPERS ---
  private static getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue;
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    try {
      return JSON.parse(val) as T;
    } catch {
      return defaultValue;
    }
  }

  private static setStorageItem<T>(key: string, val: T): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(val));
    }
  }

  // --- CONFIG CONFIGURATION ---
  public static getConfig(): AIConfig {
    return this.getStorageItem<AIConfig>("ai_config", DEFAULT_CONFIG);
  }

  public static setConfig(config: AIConfig): void {
    this.setStorageItem("ai_config", config);
  }

  // --- ENTITY GETTERS & SETTERS ---
  public static getConversations(): AIConversation[] {
    return this.getStorageItem<AIConversation[]>("ai_conversations", INITIAL_CONVERSATIONS);
  }

  public static getMessages(convId: string): AIMessage[] {
    return this.getStorageItem<AIMessage[]>("ai_messages", INITIAL_MESSAGES)
      .filter(m => m.conversationId === convId);
  }

  public static getContext(convId: string): AIContext | undefined {
    return this.getStorageItem<AIContext[]>("ai_context", INITIAL_CONTEXTS)
      .find(c => c.conversationId === convId);
  }

  public static getInsights(): AIInsight[] {
    return this.getStorageItem<AIInsight[]>("ai_insights", INITIAL_INSIGHTS);
  }

  public static getPredictions(): AIPrediction[] {
    return this.getStorageItem<AIPrediction[]>("ai_predictions", INITIAL_PREDICTIONS);
  }

  public static getRecommendations(): AIRecommendation[] {
    const list = this.getStorageItem<AIRecommendation[]>("ai_recommendations", INITIAL_RECOMMENDATIONS);
    const activePlayerIds = RendimientoStore.getJugadores().map(p => p.id);
    const activeOrgId = RendimientoStore.getActiveOrganizacionId();
    
    return list.filter(r => {
      if (activeOrgId === "00000000-0000-0000-0000-000000000000") return true;
      return activePlayerIds.includes(r.jugadorId || "");
    });
  }

  public static getPriorities(): AIPriority[] {
    return this.getStorageItem<AIPriority[]>("ai_priorities", INITIAL_PRIORITIES);
  }

  public static getActions(convId: string): AIAction[] {
    return this.getStorageItem<AIAction[]>("ai_actions", [])
      .filter(a => a.conversationId === convId);
  }

  public static getLogs(): AILog[] {
    return this.getStorageItem<AILog[]>("ai_logs", []);
  }

  public static addLog(log: Omit<AILog, "id" | "date">): void {
    const logs = this.getStorageItem<AILog[]>("ai_logs", []);
    const newLog: AILog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString()
    };
    logs.push(newLog);
    this.setStorageItem("ai_logs", logs);
  }

  public static addMessage(m: Omit<AIMessage, "id" | "date">): AIMessage {
    const all = this.getStorageItem<AIMessage[]>("ai_messages", INITIAL_MESSAGES);
    const newMsg: AIMessage = {
      ...m,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString()
    };
    all.push(newMsg);
    this.setStorageItem("ai_messages", all);
    return newMsg;
  }

  public static createConversation(userRole: string, title: string): AIConversation {
    const convs = this.getConversations();
    convs.forEach(c => c.active = false);

    const newConv: AIConversation = {
      id: `conv-${Date.now()}`,
      userRole,
      title,
      date: new Date().toISOString(),
      active: true
    };
    convs.push(newConv);
    this.setStorageItem("ai_conversations", convs);
    return newConv;
  }

  public static setActiveConversation(id: string): void {
    const convs = this.getConversations();
    convs.forEach(c => c.active = c.id === id);
    this.setStorageItem("ai_conversations", convs);
  }

  public static executeRecommendationAction(id: string): void {
    const recs = this.getRecommendations();
    const target = recs.find(r => r.id === id);
    if (target) {
      target.completada = true;
      this.setStorageItem("ai_recommendations", recs);

      // Create a completed action log in storage
      const actions = this.getStorageItem<AIAction[]>("ai_actions", []);
      actions.push({
        id: `act-${Date.now()}`,
        conversationId: "global",
        type: target.tipo === "morosidad" ? "morosidad" : "carga",
        status: "completed",
        detail: `Acción ejecutada: ${target.texto} para ${target.jugador}.`,
        date: new Date().toISOString()
      });
      this.setStorageItem("ai_actions", actions);
    }
  }

  // --- BUSQUEDA INTELIGENTE / QUERY ENGINE ---
  public static queryInteligente(query: string): any[] {
    const lower = query.toLowerCase();
    const loadData = RendimientoStore.getPlayerLoadData();

    if (lower.includes("riesgo alto") || lower.includes("riesgo maximo")) {
      return loadData.filter(d => d.semaforo === "rojo");
    }
    if (lower.includes("wellness menor a 80") || lower.includes("wellness bajo")) {
      return loadData.filter(d => d.wellnessScore < 80);
    }
    if (lower.includes("lesion") && (lower.includes("tres meses") || lower.includes("reciente"))) {
      return RendimientoStore.getLesiones();
    }
    if (lower.includes("entrenador") && lower.includes("asistencia")) {
      return entrenadores.map(e => ({ entrenador: e.nombre, asistencia: 95 + (e.id === "e1" ? 3 : 0) }));
    }

    return loadData;
  }

  // --- CRITICAL ACTIONS EXECUTIONS ---
  public static confirmAction(actionId: string, convId: string): AIMessage {
    if (actionId === "send-morosos") {
      const morosos = pagos.filter(p => p.estado === "pendiente" || p.estado === "vencido");
      morosos.forEach(m => {
        // Simulates notification sent
        console.log(`WhatsApp enviado a tutor de ${m.jugador}`);
      });
      
      const newAction: AIAction = {
        id: `act-${Date.now()}`,
        conversationId: convId,
        type: "morosidad",
        status: "completed",
        detail: `Enviados ${morosos.length} recordatorios de cuotas pendientes.`,
        date: new Date().toISOString()
      };
      
      const actions = this.getStorageItem<AIAction[]>("ai_actions", []);
      actions.push(newAction);
      this.setStorageItem("ai_actions", actions);

      return this.addMessage({
        conversationId: convId,
        sender: "ai",
        roleAssumed: "Analista Financiero",
        agentName: "Finance AI",
        text: `✅ **Notificaciones Enviadas**: Se han enviado con éxito **${morosos.length} recordatorios de pago** por WhatsApp e Email a todos los representantes con cuotas pendientes. Se registró la acción en la bitácora de auditoría.`
      });
    }

    return this.addMessage({
      conversationId: convId,
      sender: "ai",
      text: "La acción seleccionada no pudo completarse. ID de acción no identificado."
    });
  }

  // --- DETERMINISTIC NLP COPILOT RESPONDER ---
  public static processUserQuery(convId: string, query: string, userRole: string): AIMessage {
    const lower = query.toLowerCase();
    
    // Performance & cost profiling
    const startTime = Date.now();
    const config = this.getConfig();

    let answerText = "";
    let assumedRole: AIRole = "Administrador";
    let agentName: AIAgentName = "Coach AI";
    const actions: AIAction[] = [];
    let pendingApproval: { actionId: string; detail: string } | undefined = undefined;
    let documentPayload: AIMessage["documentPayload"] = undefined;

    // A. SECURITY ROLE CHECKS
    if (userRole === "coach" && (lower.includes("mora") || lower.includes("pagos") || lower.includes("factura") || lower.includes("ingreso") || lower.includes("finanzas"))) {
      return this.addMessage({
        conversationId: convId,
        sender: "ai",
        roleAssumed: "Analista Financiero",
        agentName: "Finance AI",
        text: "🚫 **Acceso Denegado**: Como Entrenador (Coach), no tienes permisos de seguridad suficientes para consultar el estado financiero, facturación o morosidad de la academia. Por favor, solicita esta información a la Dirección Administrativa."
      });
    }

    if (userRole === "padres" && !lower.includes("sofía") && !lower.includes("mateo")) {
      return this.addMessage({
        conversationId: convId,
        sender: "ai",
        roleAssumed: "Director Deportivo",
        agentName: "Parent AI",
        text: "🚫 **Acceso Restringido**: Como Padre/Tutor, por políticas de protección de datos, únicamente tienes permitido consultar el estado e información de tus hijos asociados (**[Sofía Rodríguez](/jugadores/j1)** y **[Mateo Vargas](/jugadores/j2)**)."
      });
    }

    // Context Retrieval
    const contexts = this.getStorageItem<AIContext[]>("ai_context", INITIAL_CONTEXTS);
    let currentContext = contexts.find(c => c.conversationId === convId);
    if (!currentContext) {
      currentContext = { conversationId: convId };
      contexts.push(currentContext);
    }

    // B. NLP COMMAND ROUTING & MULTI AGENT SYSTEM

    // 1. CRITICAL ACTIONS (MOROSIDAD BROADCASTS)
    if (lower.includes("envía recordatorio") && (lower.includes("moroso") || lower.includes("deuda"))) {
      assumedRole = "Analista Financiero";
      agentName = "Finance AI";
      const morosos = pagos.filter(p => p.estado === "pendiente");
      answerText = `⚠️ **Confirmación Requerida**: Se detectaron **${morosos.length} mensualidades pendientes**. ¿Desea enviar recordatorios de pago de cuotas por WhatsApp e Email de forma masiva?`;
      pendingApproval = {
        actionId: "send-morosos",
        detail: `Enviar recordatorios de cobro a ${morosos.length} representantes de familia.`
      };
    }
    // 2. CONVOCATORIA COMMAND
    else if (lower.includes("convoca") && (lower.includes("sub-15") || lower.includes("sub15") || lower.includes("sábado") || lower.includes("sabado"))) {
      assumedRole = "Entrenador";
      agentName = "Coach AI";
      
      const newAction: AIAction = {
        id: `act-${Date.now()}`,
        conversationId: convId,
        type: "convocatoria",
        status: "completed",
        detail: "Convocatoria Sub-15 creada para el próximo sábado.",
        date: new Date().toISOString()
      };
      actions.push(newAction);
      
      const allActions = this.getStorageItem<AIAction[]>("ai_actions", []);
      allActions.push(newAction);
      this.setStorageItem("ai_actions", allActions);

      answerText = `✅ **Convocatoria Programada**: Se ha creado la convocatoria del **Sub-15** para el próximo sábado. Se agregaron 14 jugadores habilitados físicamente, se envió notificación push y se actualizó el calendario del club.`;
    }
    // 3. DOCUMENT GENERATION (EXPEDIENTES / INFORME)
    else if (lower.includes("genera") && lower.includes("expediente") && (lower.includes("pedro") || lower.includes("santiago") || lower.includes("sofía") || lower.includes("sofia"))) {
      assumedRole = "Director Deportivo";
      agentName = "Player AI";
      let name = "Pedro Rodríguez";
      let pId = "j1";
      if (lower.includes("santiago")) { name = "Santiago Jiménez"; pId = "j4"; }
      else if (lower.includes("sofia") || lower.includes("sofía")) { name = "Sofía Rodríguez"; pId = "j1"; }

      documentPayload = {
        title: `Expediente Deportivo Completo — ${name}`,
        type: "expediente",
        data: {
          jugador: name,
          sportsScore: 96,
          wellnessPromedio: 94,
          lesionesRegistradas: 1,
          cuotasAlDia: "Sí",
          asistenciaRango: "98% (Excelente)",
          conclusiones: "El atleta muestra una progresión excepcional en microciclos con ACWR balanceado."
        },
        downloadUrl: `expediente_${name.toLowerCase().replace(/ /g, "_")}.pdf`
      };
      answerText = `📄 **Documento Generado**: He recopilado y estructurado el expediente completo de **[${name}](/jugadores/${pId})**. Incluye datos antropométricos, históricos de ACWR, fatiga, tests físicos, asistencia y pagos. Puedes descargarlo en el botón de abajo.`;
    }
    else if (lower.includes("genera") && lower.includes("informe mensual") && (lower.includes("sub-15") || lower.includes("sub15"))) {
      assumedRole = "Analista Deportivo";
      agentName = "Coach AI";
      documentPayload = {
        title: "Informe Mensual de Rendimiento — Sub-15",
        type: "informe",
        data: {
          categoria: "Sub-15 Masculino",
          entrenamientos: 12,
          asistenciaGrupal: "92.4%",
          wellnessPromedio: "84/100",
          lesionesNuevas: 0,
          conclusiones: "Microciclos de cargas estables con buena asimilación. Destaca la regularidad en la asistencia."
        },
        downloadUrl: "informe_mensual_sub15.pdf"
      };
      answerText = "📄 **Documento Generado**: He consolidado las estadísticas mensuales de la categoría **Sub-15**. Incluye resúmenes de intensidad, asistencia promedio, alertas y conclusiones. Puedes descargarlo a continuación.";
    }
    // 4. BÚSQUEDA INTELIGENTE
    else if (lower.includes("muéstrame") || lower.includes("busca") || lower.includes("filtra") || lower.includes("ver listado")) {
      assumedRole = "Analista Deportivo";
      agentName = "Performance AI";
      const results = this.queryInteligente(query);
      if (results.length > 0) {
        answerText = `🔍 **Resultados de Búsqueda Inteligente**:\n\n` +
          results.slice(0, 5).map((r: any) => {
            if (r.jugador) {
              return `• **[${r.jugador}](/jugadores/${r.jugadorId || r.id})** - Categoría: ${r.equipo || r.categoria} (Valor: ${(r.semaforo?.toUpperCase() || r.score) ?? r.wellnessScore ?? 'Activo'})`;
            }
            if (r.entrenador) {
              return `• Entrenador: **${r.entrenador}** - Asistencia: ${r.asistencia}%`;
            }
            return `• Registro: ${r.tipo || r.nombre}`;
          }).join("\n");
      } else {
        answerText = "No se encontraron registros que cumplan con ese criterio de búsqueda inteligente en DeportivOS.";
      }
    }
    // 5. AGENDAR EVALUACIÓN
    else if (lower.includes("agenda") || lower.includes("crea una evaluación") || lower.includes("evaluacion")) {
      assumedRole = "Preparador Físico";
      agentName = "Performance AI";
      let targetPlayer = "Sofía Rodríguez";
      let targetPlayerId = "j1";

      if (lower.includes("pedro") || lower.includes("santiago") || lower.includes("j4")) {
        targetPlayer = "Santiago Jiménez";
        targetPlayerId = "j4";
      } else if (lower.includes("mateo")) {
        targetPlayer = "Mateo Vargas";
        targetPlayerId = "j2";
      } else if (lower.includes("valentina")) {
        targetPlayer = "Valentina Soto";
        targetPlayerId = "j3";
      }

      try {
        RendimientoStore.addTest({
          jugadorId: targetPlayerId,
          jugador: targetPlayer,
          fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          tipo: "Resistencia",
          nombreTest: "Test de Recuperación Progresiva",
          resultado: "Programado",
          progreso: 0,
          estancado: false
        });

        const newAction: AIAction = {
          id: `act-${Date.now()}`,
          conversationId: convId,
          type: "evaluacion",
          status: "completed",
          detail: `Evaluación física agendada para ${targetPlayer} el próximo viernes.`,
          date: new Date().toISOString()
        };
        actions.push(newAction);

        const allActions = this.getStorageItem<AIAction[]>("ai_actions", []);
        allActions.push(newAction);
        this.setStorageItem("ai_actions", allActions);

        answerText = `✅ **Acción Completada**: He programado con éxito una evaluación física de **Resistencia** (*Test de Recuperación Progresiva*) para **[${targetPlayer}](/jugadores/${targetPlayerId})** para este viernes. Se ha enviado una notificación automática a su preparador y tutor.`;
      } catch (err) {
        answerText = `Hubo un inconveniente al programar la evaluación física para ${targetPlayer}. Por favor ingresa los datos manualmente en el módulo de Tests.`;
      }
    }
    // 6. DEPORTIVOS Y RIESGOS DE LESIÓN
    else if (lower.includes("riesgo de lesión") || lower.includes("lesion") || lower.includes("riesgo deportivo")) {
      assumedRole = "Médico Deportivo";
      agentName = "Medical AI";
      const loadRecords = RendimientoStore.getPlayerLoadData();
      const conRiesgo = loadRecords.filter(r => r.semaforo === "rojo" || r.semaforo === "amarillo");
      if (conRiesgo.length > 0) {
        answerText = `Actualmente se detectan **${conRiesgo.length} jugadores** con alertas de riesgo de lesión:\n\n` + 
          conRiesgo.map(r => `• **[${r.jugador}](/jugadores/${r.jugadorId})** (${r.equipo}) - Semáforo: **${r.semaforo.toUpperCase()}**\n  *Motivo*: ${r.semaforoMotivos[0] || 'Fatiga acumulada alta'}`).join("\n\n");
      } else {
        answerText = "¡Buenas noticias! En este momento no hay atletas registrados con nivel de riesgo de lesión Alto o en Precaución. Todos se encuentran en rango seguro.";
      }
    }
    // 7. FINANZAS / MOROSIDAD
    else if (lower.includes("moroso") || lower.includes("deuda") || lower.includes("pago pendiente")) {
      assumedRole = "Analista Financiero";
      agentName = "Finance AI";
      const morosos = pagos.filter(p => p.estado === "pendiente" || p.estado === "vencido");
      if (morosos.length > 0) {
        answerText = `Actualmente existen **${morosos.length} mensualidades pendientes o vencidas**:\n\n` +
          morosos.map(m => {
            const jugadorObj = jugadores.find(jug => jug.nombre === m.jugador);
            const encargadoObj = encargados.find(e => e.jugador === m.jugador);
            const jugadorId = jugadorObj?.id ?? 'j1';
            const cuotaText = `₡${m.monto.toLocaleString("es-CR")}`;
            const encargadoText = encargadoObj?.nombre ?? 'Padre de Familia';
            const telefonoText = encargadoObj?.telefono ?? '+506 8888-8888';
            return `• **[${m.jugador}](/jugadores/${jugadorId})** - Cuota: **${cuotaText}** (Estado: *${m.estado.toUpperCase()}*)\n  *Encargado*: ${encargadoText} · Teléfono: ${telefonoText}`;
          }).join("\n\n");
      } else {
        answerText = "El estado de facturación está al día. No se detectan saldos vencidos ni familias con morosidad activa.";
      }
    }
    // 8. CRM / PROSPECTOS
    else if (lower.includes("prospecto") || lower.includes("leads") || lower.includes("captacion") || lower.includes("campaña")) {
      assumedRole = "Analista Deportivo";
      agentName = "CRM AI";
      const crmConversion = Math.round((jugadores.length / crmLeads.length) * 100);
      answerText = `🎯 **Análisis CRM**: Contamos con **${crmLeads.length} prospectos en el embudo** de matrícula. La tasa de conversión a jugadores registrados es del **${crmConversion}%** este mes. La campaña publicitaria más efectiva es *Redes Sociales* (Instagram).`;
    }
    // 9. COMPETICIONES
    else if (lower.includes("partido") || lower.includes("competicion") || lower.includes("torneo") || lower.includes("tabla")) {
      assumedRole = "Asistente de Competencias";
      agentName = "Competition AI";
      answerText = "🏆 **Análisis de Competiciones**: El club acumula 12 victorias, 4 empates y 2 derrotas esta temporada. Tenemos programados 3 partidos de liga para este fin de semana. La tabla de posiciones ubica al Sub-17 en primer lugar.";
    }
    // 10. JUGADORES DESTACADOS
    else if (lower.includes("destacad") || lower.includes("mejor")) {
      assumedRole = "Analista Deportivo";
      agentName = "Player AI";
      answerText = "Los atletas destacados de este mes por consistencia de entrenamiento y puntajes máximos de tests físicos son:\n\n" +
        "1. ⭐ **[Sofía Rodríguez](/jugadores/j1)** (Wellness promedio: 96%, Cargas en zona óptima, +15% potencia en salto).\n" +
        "2. ⭐ **[Valentina Soto](/jugadores/j3)** (Asistencia perfecta 100%, progresión aeróbica en el test cooper).";
    }
    // DEFAULT GENERIC RESPONDER
    else {
      answerText = "Hola Carlos. Entiendo tu consulta. Como copiloto inteligente de DeportivOS puedo ayudarte con el estado deportivo del plantel, riesgos de lesión (ACWR), finanzas pendientes, morosos, control de asistencia y agendar evaluaciones físicas de tus atletas. ¿Deseas analizar algún jugador o equipo en específico?";
    }

    // Context tracking update
    this.setStorageItem("ai_context", contexts);

    // Save logs for Audit metrics
    const responseTimeMs = Date.now() - startTime + Math.round(Math.random() * 200 + 100);
    this.addLog({
      userRole,
      query,
      modelUsed: config.model.toUpperCase(),
      responseTimeMs,
      costEstimateUSD: parseFloat((0.001 + Math.random() * 0.002).toFixed(5)),
      timeSavedMinutes: parseFloat((1.5 + Math.random() * 2.0).toFixed(1)),
      agentName
    });

    return this.addMessage({
      conversationId: convId,
      sender: "ai",
      roleAssumed: assumedRole,
      agentName,
      text: answerText,
      actions: actions.length > 0 ? actions : undefined,
      pendingApproval,
      documentPayload
    });
  }

  // --- AUTOMATIC REPORTS GENERATOR (Daily, Weekly, Monthly) ---
  public static getReport(type: "diario" | "semanal" | "mensual"): string {
    const lesiones = RendimientoStore.getLesiones().filter(l => !l.completada).length;
    const loads = RendimientoStore.getPlayerLoadData();
    const riesgoAlto = loads.filter(l => l.semaforo === "rojo").length;
    const avgWellness = loads.length > 0 ? Math.round(loads.reduce((acc, l) => acc + l.wellnessScore, 0) / loads.length) : 85;
    const avgSportsScore = RendimientoStore.getSportsScoreData().length 
      ? Math.round(RendimientoStore.getSportsScoreData().reduce((a, d) => a + d.sportsScore, 0) / RendimientoStore.getSportsScoreData().length) 
      : 88;

    if (type === "diario") {
      return `📌 **Resumen de Hoy**:\n\n` +
        `• 📅 **3 Entrenamientos** programados para esta jornada.\n` +
        `• 🩹 **${lesiones} Jugadores lesionados** activos en tratamiento médico.\n` +
        `• 🔴 **${riesgoAlto} Atleta en riesgo alto** de sobrecarga física (ACWR > 1.5).\n` +
        `• 💰 **4 Pagos pendientes** de mensualidad por cobrar este mes.\n` +
        `• 🟢 **Wellness promedio del equipo: ${avgWellness}%** (buen estado de descanso).\n` +
        `• ⚡ **Sports Score promedio general: ${avgSportsScore}%**.`;
    }

    if (type === "semanal") {
      return `📊 **Resumen Semanal**:\n\n` +
        `• **Entrenamientos Realizados**: 14 sesiones completadas con éxito.\n` +
        `• **Asistencia Promedio**: 91.2% general del plantel.\n` +
        `• **Lesiones Activas**: ${lesiones} reportadas (2 reincorporadas a RTP).\n` +
        `• **Carga Total Promedio**: 640 UA acumuladas por categoría.\n` +
        `• **Finanzas**: $4,200 cobrados de cuotas semanales; 6 morosidades notificadas.\n` +
        `• **CRM**: 5 prospectos convertidos a miembros activos en la academia.\n` +
        `• **Competencias**: Sub-15 consolidó victoria (3-1); Sub-17 disputa liderato mañana.`;
    }

    return `📈 **Resumen Mensual**:\n\n` +
      `• **Crecimiento de Matrícula**: +8.4% (12 nuevos ingresos de atletas).\n` +
      `• **Captación (CRM Leads)**: 28 leads calificados registrados, 14 pruebas programadas.\n` +
      `• **Ingresos Consolidados**: $12,500 recaudados este mes.\n` +
      `• **Índice de Morosidad**: Reducido al 4.2% general.\n` +
      `• **Asistencia general del Club**: 89.5% de promedio.\n` +
      `• **Lesiones**: 3 incidentes leves, 0 graves.\n` +
      `• **Jugador Destacado del Mes**: **[Sofía Rodríguez](/jugadores/j1)** por consistencia física (Wellness promedio: 96%).`;
  }
}
export default AIStore;
