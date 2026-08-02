import RendimientoStore from "./rendimiento-store";

export interface WhatsAppMessagePayload {
  telefono: string;
  nombreEncargado: string;
  nombreAlumno: string;
  tipo: "recordatorio_pago" | "convocatoria_partido" | "aviso_general";
  montoPendiente?: number;
  partidoInfo?: {
    equipoRival: string;
    fechaHora: string;
    lugar: string;
    competicion?: string;
  };
}

export class NotificationGateway {
  /**
   * Envía o prepara notificación por WhatsApp (usando TextMeBot / Gateway de WhatsApp)
   */
  public static async sendWhatsAppNotification(payload: WhatsAppMessagePayload): Promise<{ success: boolean; message: string }> {
    const activeOrgId = RendimientoStore.getActiveOrganizacionId();
    const activeOrg = RendimientoStore.getOrganizaciones().find((o) => o.id === activeOrgId);
    const clubName = activeOrg?.nombre || "Athletix Academy";

    // Formatear número de teléfono a estándar internacional sin caracteres especiales
    const cleanPhone = payload.telefono.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 8 ? `506${cleanPhone}` : cleanPhone;

    let mensajeTexto = "";

    if (payload.tipo === "recordatorio_pago") {
      mensajeTexto = `⚽ *${clubName}* — Recordatorio de Pago\n\nEstimado(a) *${payload.nombreEncargado}*:\nEsperamos que te encuentres muy bien. Te recordamos cordialmente que la mensualidad de *${payload.nombreAlumno}* (Monto: ₡${(payload.montoPendiente || 0).toLocaleString()} CRC) se encuentra pendiente.\n\nPuedes realizar tu pago fácilmente por *SINPE Móvil* o Tarjeta (*Tilopay*).\n\n¡Muchas gracias por apoyar el desarrollo de nuestros deportistas! 🙌`;
    } else if (payload.tipo === "convocatoria_partido") {
      const p = payload.partidoInfo;
      mensajeTexto = `🏆 *${clubName}* — ¡Convocatoria a Partido!\n\nEstimado(a) *${payload.nombreEncargado}*:\nLe informamos que *${payload.nombreAlumno}* ha sido convocado(a) para el siguiente encuentro:\n\n🆚 *Rival:* ${p?.equipoRival || "Equipo Rival"}\n📅 *Fecha y Hora:* ${p?.fechaHora || "Por confirmar"}\n📍 *Lugar:* ${p?.lugar || "Cancha Principal"}\n🏆 *Competición:* ${p?.competicion || "Torneo Oficial"}\n\nPor favor confirmar asistencia con tu entrenador. ¡Éxito equipo! ⚽🔥`;
    } else {
      mensajeTexto = `📢 *${clubName}* — Comunicado Oficial\n\nEstimado(a) *${payload.nombreEncargado}*:\nInformación importante referente a *${payload.nombreAlumno}*.\n\nAtentamente,\nCuerpo Técnico ${clubName}`;
    }

    try {
      // Intento de envío vía API Gateway de TextMeBot (si la apiKey está configurada en la academia)
      const apiKeyTextMeBot = (activeOrg as any)?.textmebotKey || "demo_apikey";

      if (apiKeyTextMeBot && apiKeyTextMeBot !== "demo_apikey") {
        const url = `https://api.textmebot.com/send.php?recipient=+${formattedPhone}&apikey=${apiKeyTextMeBot}&text=${encodeURIComponent(mensajeTexto)}`;
        await fetch(url, { mode: "no-cors" });
        return { success: true, message: `Mensaje WhatsApp enviado a +${formattedPhone}` };
      }

      // Fallback nativo directo: Abrir enlace wa.me pre-cargado
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(mensajeTexto)}`;
      if (typeof window !== "undefined") {
        window.open(whatsappUrl, "_blank");
      }

      return { success: true, message: `Abriendo WhatsApp Web para +${formattedPhone}` };
    } catch (err: any) {
      console.error("Error en Gateway WhatsApp:", err);
      return { success: false, message: err.message || "Error al enviar WhatsApp" };
    }
  }

  /**
   * Envía Notificación Push PWA a la pantalla del dispositivo
   */
  public static async sendPushNotification(titulo: string, cuerpo: string): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) return false;

    try {
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission === "granted") {
        new Notification(titulo, {
          body: cuerpo,
          icon: "/favicon.png",
          badge: "/favicon.png",
        });
        return true;
      }
    } catch (e) {
      console.warn("Error enviando Push Notification:", e);
    }
    return false;
  }
}
