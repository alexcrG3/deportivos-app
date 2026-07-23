import { useState, useEffect } from "react";
import { Bell, CheckCheck, ExternalLink, Zap, Activity, DollarSign, Stethoscope, AlertTriangle, UserX, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotificationDispatcherEngine, { SystemNotificationPayload } from "@/lib/notification-store";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function NotificationCenterPopover() {
  const [notifications, setNotifications] = useState<SystemNotificationPayload[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"todos" | "padre" | "coach" | "admin">("todos");
  const navigate = useNavigate();

  const reloadNotifications = () => {
    setNotifications(NotificationDispatcherEngine.getNotifications());
  };

  useEffect(() => {
    reloadNotifications();
    const interval = setInterval(reloadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.leida).length;

  const filtered = notifications.filter((n) => {
    if (roleFilter === "todos") return true;
    return n.recipient_role === roleFilter;
  });

  const handleNotificationClick = (notif: SystemNotificationPayload) => {
    NotificationDispatcherEngine.markAsRead(notif.id);
    reloadNotifications();
    setIsOpen(false);

    if (notif.deep_link_route) {
      toast.info(`Navegando a: ${notif.deep_link_route}`);
      navigate({ to: notif.deep_link_route as any });
    }
  };

  const handleMarkAllRead = () => {
    NotificationDispatcherEngine.markAllAsRead();
    reloadNotifications();
    toast.success("Todas las notificaciones marcadas como leídas");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-extrabold text-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 sm:w-96 p-0 shadow-xl border-border rounded-2xl">
        {/* Header */}
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground">Notificaciones & Alertas Push</h4>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 font-bold">
                {unreadCount} nuevas
              </Badge>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground">
            <CheckCheck className="h-3 w-3" /> Todo leído
          </Button>
        </div>

        {/* Role Filter tabs */}
        <div className="px-3 py-2 border-b border-border flex items-center gap-1 bg-muted/10">
          {(["todos", "padre", "coach", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                roleFilter === r ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {r === "todos" ? "Todas" : r}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
          {filtered.length > 0 ? (
            filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3 transition cursor-pointer hover:bg-muted/50 flex items-start gap-2.5 ${
                  !n.leida ? "bg-primary/5" : "opacity-80"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {n.notification_type === "MEDICAL_ALERT" ? (
                    <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive"><AlertTriangle className="h-3.5 w-3.5" /></div>
                  ) : n.notification_type === "WELLNESS_ALERT" ? (
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600"><Stethoscope className="h-3.5 w-3.5" /></div>
                  ) : n.notification_type === "BILLING_NOTICE" ? (
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600"><DollarSign className="h-3.5 w-3.5" /></div>
                  ) : n.notification_type === "MATCH_CALLOUT" ? (
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600"><CalendarCheck className="h-3.5 w-3.5" /></div>
                  ) : (
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Zap className="h-3.5 w-3.5" /></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">{n.canal}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">{n.body}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px]">
                    <span className="text-primary font-semibold flex items-center gap-0.5">
                      Abrir ruta <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                    <span className="text-muted-foreground">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
              No hay notificaciones para este rol.
            </div>
          )}
        </div>

        {/* Live Push Simulator Box */}
        <div className="p-3 bg-muted/40 border-t border-border space-y-2">
          <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" /> Simulador de Disparadores Push (Triggers)
          </p>

          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                NotificationDispatcherEngine.triggerConvocatoriaSent("Santiago Jiménez", "LD Alajuelense");
                reloadNotifications();
              }}
              className="h-6 px-1.5 text-[10px] font-semibold justify-start truncate"
            >
              ⚽ 1. Convocatoria Enviada
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                NotificationDispatcherEngine.triggerConvocatoriaReminder("Santiago Jiménez");
                reloadNotifications();
              }}
              className="h-6 px-1.5 text-[10px] font-semibold justify-start truncate text-amber-600"
            >
              ⏳ 2. Recordatorio Viernes
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                NotificationDispatcherEngine.triggerConvocatoriaDeclined("Mateo Rojas", "Saprissa");
                reloadNotifications();
              }}
              className="h-6 px-1.5 text-[10px] font-semibold justify-start truncate text-destructive"
            >
              ❌ 3. Baja de Plantilla
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                NotificationDispatcherEngine.triggerMedicalInjury("Edgar Calderón", "Ian Gutiérrez", "Moderada");
                reloadNotifications();
              }}
              className="h-6 px-1.5 text-[10px] font-semibold justify-start truncate text-destructive font-bold"
            >
              🚨 4. Alerta Médica Lesión
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                NotificationDispatcherEngine.triggerStaffAttendanceAudit("U9", "16:00");
                reloadNotifications();
              }}
              className="h-6 px-1.5 text-[10px] font-semibold justify-start truncate text-amber-600"
            >
              ⚠️ 5. Auditoría Asistencia
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                NotificationDispatcherEngine.triggerBillingReminder("Aaron Pacheco");
                reloadNotifications();
              }}
              className="h-6 px-1.5 text-[10px] font-semibold justify-start truncate text-emerald-600"
            >
              💳 6. Cobro Día 6
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
