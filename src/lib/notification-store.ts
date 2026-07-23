import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type NotificationType = "CRITICAL_ALERT" | "MATCH_CALLOUT" | "REMINDER" | "MEDICAL_ALERT" | "STAFF_AUDIT" | "BILLING_NOTICE" | "WELLNESS_ALERT";

export interface SystemNotificationPayload {
  id: string;
  to_user_id: string;
  recipient_role: "padre" | "coach" | "admin";
  notification_type: NotificationType;
  title: string;
  body: string;
  deep_link_route: string;
  requires_badge: boolean;
  leida: boolean;
  canal: "App Push" | "WhatsApp" | "Email" | "Dashboard";
  created_at: string;
}

export const INITIAL_NOTIFICATIONS: SystemNotificationPayload[] = [
  {
    id: "notif_trigger_1",
    to_user_id: "usr_padre_1",
    recipient_role: "padre",
    notification_type: "MATCH_CALLOUT",
    title: "⚽ ¡Citación de Partido!",
    body: "Aaron Pacheco ha sido convocado para el juego contra Liga Deportiva Alajuelense. Revisa los detalles de la cancha y confirma tu asistencia aquí.",
    deep_link_route: "/convocatorias",
    requires_badge: true,
    leida: false,
    canal: "App Push",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif_trigger_4",
    to_user_id: "usr_admin_1",
    recipient_role: "admin",
    notification_type: "MEDICAL_ALERT",
    title: "🚨 Alerta Médica: Lesión en Cancha",
    body: "El entrenador Edgar Calderón reportó una lesión Leve del alumno Santiago Jiménez. Requiere trámite de seguro deportivo.",
    deep_link_route: "/medico",
    requires_badge: true,
    leida: false,
    canal: "App Push",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "notif_trigger_5",
    to_user_id: "usr_admin_1",
    recipient_role: "admin",
    notification_type: "STAFF_AUDIT",
    title: "⚠️ Auditoría de Staff: Asistencia Pendiente",
    body: "El entrenamiento de la categoría U9 inició a las 09:00 AM, pero el profesor aún no registra la asistencia en la plataforma.",
    deep_link_route: "/asistencia-staff",
    requires_badge: true,
    leida: false,
    canal: "Dashboard",
    created_at: new Date(Date.now() - 14400000).toISOString(),
  },
];

class NotificationDispatcherEngine {
  public static getNotifications(): SystemNotificationPayload[] {
    return RendimientoStore.get<SystemNotificationPayload[]>("notifications_v2", INITIAL_NOTIFICATIONS);
  }

  public static saveNotification(notif: SystemNotificationPayload) {
    const list = this.getNotifications();
    const filtered = list.filter(n => n.id !== notif.id);
    const updated = [notif, ...filtered];
    RendimientoStore.set("notifications_v2", updated);

    // Toast Push Simulation
    toast(notif.title, {
      description: notif.body,
      action: {
        label: "Ver en App",
        onClick: () => {
          if (typeof window !== "undefined") {
            window.location.href = notif.deep_link_route;
          }
        },
      },
    });

    // Supabase sync
    const activeOrg = RendimientoStore.getActiveOrganizacionId();
    supabase.from("notificaciones").upsert({
      id: notif.id,
      to_user_id: notif.to_user_id,
      recipient_role: notif.recipient_role,
      notification_type: notif.notification_type,
      title: notif.title,
      body: notif.body,
      deep_link_route: notif.deep_link_route,
      requires_badge: notif.requires_badge,
      leida: notif.leida,
      canal: notif.canal,
      organizacion_id: activeOrg,
    }).then(({ error }) => {
      if (error) console.error("[Supabase Error] notificaciones upsert:", error.message);
    });
  }

  public static markAsRead(id: string) {
    const list = this.getNotifications();
    const updated = list.map(n => n.id === id ? { ...n, leida: true, requires_badge: false } : n);
    RendimientoStore.set("notifications_v2", updated);
  }

  public static markAllAsRead() {
    const list = this.getNotifications();
    const updated = list.map(n => ({ ...n, leida: true, requires_badge: false }));
    RendimientoStore.set("notifications_v2", updated);
  }

  // 7 AUTOMATED SYSTEM TRIGGERS

  /** Trigger 1: Entrenador presiona [Enviar Convocatoria] */
  public static triggerConvocatoriaSent(alumnoNombre: string, rivalNombre: string) {
    const payload: SystemNotificationPayload = {
      id: `notif_${Date.now()}_1`,
      to_user_id: "usr_padre_family",
      recipient_role: "padre",
      notification_type: "MATCH_CALLOUT",
      title: "⚽ ¡Citación de Partido!",
      body: `⚽ ¡Citación de Partido! ${alumnoNombre} ha sido convocado para el juego contra ${rivalNombre}. Revisa los detalles de la cancha y confirma tu asistencia aquí.`,
      deep_link_route: "/convocatorias",
      requires_badge: true,
      leida: false,
      canal: "App Push",
      created_at: new Date().toISOString(),
    };
    this.saveNotification(payload);
  }

  /** Trigger 2: Viernes 12:00 PM sin respuesta de convocatoria */
  public static triggerConvocatoriaReminder(alumnoNombre: string) {
    const payload: SystemNotificationPayload = {
      id: `notif_${Date.now()}_2`,
      to_user_id: "usr_padre_family",
      recipient_role: "padre",
      notification_type: "CRITICAL_ALERT",
      title: "⏳ ¡Últimas horas de Confirmación!",
      body: `⏳ ¡Últimas horas! No has confirmado la asistencia de ${alumnoNombre} para el partido del fin de semana. El cupo se liberará a las 6:00 PM.`,
      deep_link_route: "/convocatorias",
      requires_badge: true,
      leida: false,
      canal: "App Push",
      created_at: new Date().toISOString(),
    };
    this.saveNotification(payload);
  }

  /** Trigger 3: Padre presiona [No asistirá] */
  public static triggerConvocatoriaDeclined(alumnoNombre: string, rivalNombre: string) {
    const payload: SystemNotificationPayload = {
      id: `notif_${Date.now()}_3`,
      to_user_id: "usr_coach_1",
      recipient_role: "coach",
      notification_type: "CRITICAL_ALERT",
      title: "❌ Baja en la Plantilla de Convocados",
      body: `❌ Baja en la Plantilla: El jugador ${alumnoNombre} ha declinado la convocatoria para el partido contra ${rivalNombre}. Revisa tu lista en Coach OS.`,
      deep_link_route: "/coach",
      requires_badge: true,
      leida: false,
      canal: "App Push",
      created_at: new Date().toISOString(),
    };
    this.saveNotification(payload);
  }

  /** Trigger 4: Entrenador activa [Reportar Lesión] */
  public static triggerMedicalInjury(entrenadorNombre: string, alumnoNombre: string, gravedad: string) {
    const payload: SystemNotificationPayload = {
      id: `notif_${Date.now()}_4`,
      to_user_id: "usr_admin_1",
      recipient_role: "admin",
      notification_type: "MEDICAL_ALERT",
      title: "🚨 Alerta Médica: Lesión en Cancha",
      body: `🚨 Alerta Médica: El entrenador ${entrenadorNombre} reportó una lesión ${gravedad} del alumno ${alumnoNombre}. Requiere trámite de seguro deportivo.`,
      deep_link_route: "/medico",
      requires_badge: true,
      leida: false,
      canal: "App Push",
      created_at: new Date().toISOString(),
    };
    this.saveNotification(payload);
  }

  /** Trigger 5: Entrenador sin pasar asistencia tras 20 minutos */
  public static triggerStaffAttendanceAudit(categoria: string, horaStr: string) {
    const payload: SystemNotificationPayload = {
      id: `notif_${Date.now()}_5`,
      to_user_id: "usr_admin_1",
      recipient_role: "admin",
      notification_type: "STAFF_AUDIT",
      title: "⚠️ Auditoría de Staff: Asistencia Atrasada",
      body: `⚠️ Auditoría de Staff: El entrenamiento de la categoría ${categoria} inició a las ${horaStr}, pero el profesor aún no registra la asistencia en la plataforma.`,
      deep_link_route: "/asistencia-staff",
      requires_badge: true,
      leida: false,
      canal: "Dashboard",
      created_at: new Date().toISOString(),
    };
    this.saveNotification(payload);
  }

  /** Trigger 6: Día 6 del mes - Mensualidad Pendiente */
  public static triggerBillingReminder(alumnoNombre: string) {
    const payload: SystemNotificationPayload = {
      id: `notif_${Date.now()}_6`,
      to_user_id: "usr_padre_family",
      recipient_role: "padre",
      notification_type: "BILLING_NOTICE",
      title: "💳 Aviso de Facturación Mensual",
      body: `💳 Aviso de Facturación: Se ha generado el cobro de tu mensualidad para ${alumnoNombre}. Recuerda que a partir de hoy se aplica el recargo por mora del 10%.`,
      deep_link_route: "/pagos",
      requires_badge: true,
      leida: false,
      canal: "Email",
      created_at: new Date().toISOString(),
    };
    this.saveNotification(payload);
  }

  /** Trigger 7: Padre reporta valor de dolor alto en encuesta de Wellness */
  public static triggerWellnessAlert(alumnoNombre: string) {
    const payload: SystemNotificationPayload = {
      id: `notif_${Date.now()}_7`,
      to_user_id: "usr_coach_1",
      recipient_role: "coach",
      notification_type: "WELLNESS_ALERT",
      title: "🩺 Alerta de Wellness Previa al Entrenamiento",
      body: `🩺 Alerta de Wellness: El papá de ${alumnoNombre} reportó una alerta física en rojo antes del entrenamiento. Revisa los detalles antes de iniciar la práctica.`,
      deep_link_route: "/rendimiento/wellness",
      requires_badge: true,
      leida: false,
      canal: "App Push",
      created_at: new Date().toISOString(),
    };
    this.saveNotification(payload);
  }
}

export default NotificationDispatcherEngine;
