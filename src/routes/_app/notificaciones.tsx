import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, CheckCheck, DollarSign, Activity, FileText, Zap, Copy, ExternalLink, Code2, AlertTriangle, ShieldCheck, Stethoscope, CalendarCheck } from "lucide-react";
import NotificationDispatcherEngine, { SystemNotificationPayload } from "@/lib/notification-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/notificaciones")({ component: NotifPage });

function NotifPage() {
  const [notifications, setNotifications] = useState<SystemNotificationPayload[]>([]);
  const [tab, setTab] = useState<string>("todas");
  const [selectedNotifForJson, setSelectedNotifForJson] = useState<SystemNotificationPayload | null>(null);

  const reloadNotifs = () => {
    const list = NotificationDispatcherEngine.getNotifications();
    setNotifications(list);
    if (list.length > 0 && !selectedNotifForJson) {
      setSelectedNotifForJson(list[0]);
    }
  };

  useEffect(() => {
    reloadNotifs();
  }, []);

  const noLeidas = notifications.filter((n) => !n.leida).length;

  const filtered = notifications.filter((n) => {
    if (tab === "todas") return true;
    if (tab === "no_leidas") return !n.leida;
    if (tab === "criticas") return n.notification_type === "CRITICAL_ALERT" || n.notification_type === "MEDICAL_ALERT";
    return n.recipient_role === tab;
  });

  const handleCopyJson = (payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("Payload JSON copiado al portapapeles");
  };

  const handleMarkAllRead = () => {
    NotificationDispatcherEngine.markAllAsRead();
    reloadNotifs();
    toast.success("Todas las notificaciones marcadas como leídas");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Centro de Notificaciones & Eventos Push</h1>
          <p className="text-sm text-muted-foreground">{noLeidas} sin leer · Notificaciones Push y payloads JSON para backend.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleMarkAllRead} className="gap-1.5 text-xs font-semibold">
            <CheckCheck className="h-4 w-4" /> Marcar todo leído
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <Card className="shadow-card">
        <CardHeader className="pb-3 border-b">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex flex-wrap gap-1 bg-transparent p-0 h-auto">
              <TabsTrigger value="todas">Todas ({notifications.length})</TabsTrigger>
              <TabsTrigger value="no_leidas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
                No leídas ({noLeidas})
              </TabsTrigger>
              <TabsTrigger value="criticas" className="data-[state=active]:bg-destructive data-[state=active]:text-white font-bold">
                🚨 Alertas Críticas
              </TabsTrigger>
              <TabsTrigger value="padre">Rol Padre</TabsTrigger>
              <TabsTrigger value="coach">Rol Coach</TabsTrigger>
              <TabsTrigger value="admin">Rol Admin</TabsTrigger>
              <TabsTrigger value="json_console" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white font-mono text-xs">
                💻 Consola Payload JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="pt-4">
          {tab === "json_console" ? (
            /* CONSOLA DE INSPECCIÓN JSON PARA DESARROLLADORES BACKEND */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 text-slate-100 space-y-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Code2 className="h-4 w-4" /> Estructura JSON del Payload Notificación API (Backend Standard)
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyJson(selectedNotifForJson || notifications[0])}
                    className="h-7 text-xs font-mono border-slate-700 hover:bg-slate-800 text-slate-200"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copiar JSON
                  </Button>
                </div>

                <pre className="text-xs font-mono text-emerald-400 bg-slate-900/90 p-4 rounded-lg overflow-x-auto border border-slate-800">
                  {JSON.stringify(
                    selectedNotifForJson
                      ? {
                          to_user_id: selectedNotifForJson.to_user_id,
                          notification_type: selectedNotifForJson.notification_type,
                          title: selectedNotifForJson.title,
                          body: selectedNotifForJson.body,
                          deep_link_route: selectedNotifForJson.deep_link_route,
                          requires_badge: selectedNotifForJson.requires_badge,
                          recipient_role: selectedNotifForJson.recipient_role,
                          canal: selectedNotifForJson.canal,
                          created_at: selectedNotifForJson.created_at,
                        }
                      : {
                          to_user_id: "usr_9823472934",
                          notification_type: "CRITICAL_ALERT",
                          title: "🚨 Alerta Médica: Lesión en Cancha",
                          body: "El alumno Santiago Jiménez sufrió un golpe fuerte. Trámite de seguro iniciado.",
                          deep_link_route: "/medico",
                          requires_badge: true,
                        },
                    null,
                    2
                  )}
                </pre>
              </div>

              {/* Selector de Evento */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Seleccionar Notificación para ver Payload:</label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNotifForJson(n)}
                      className={`p-3 rounded-xl border transition cursor-pointer text-xs space-y-1 ${
                        selectedNotifForJson?.id === n.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground truncate">{n.title}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{n.notification_type}</Badge>
                      </div>
                      <p className="text-muted-foreground truncate">{n.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* LISTA REGULAR DE NOTIFICACIONES */
            <ul className="divide-y divide-border">
              {filtered.map((n) => {
                return (
                  <li key={n.id} className={`flex items-start gap-4 py-4 ${!n.leida ? "bg-primary/5 -mx-6 px-6" : ""}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted border">
                      {n.notification_type === "MEDICAL_ALERT" ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : n.notification_type === "WELLNESS_ALERT" ? (
                        <Stethoscope className="h-5 w-5 text-amber-500" />
                      ) : n.notification_type === "BILLING_NOTICE" ? (
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                      ) : n.notification_type === "MATCH_CALLOUT" ? (
                        <CalendarCheck className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <Zap className="h-5 w-5 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{n.title}</p>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono font-bold">
                          {n.canal}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {n.recipient_role}
                        </Badge>
                        {!n.leida && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>

                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        {n.deep_link_route && (
                          <Link to={n.deep_link_route as any} className="text-primary font-bold hover:underline flex items-center gap-1">
                            Ver Pantalla → ({n.deep_link_route})
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}

              {filtered.length === 0 && (
                <li className="py-12 text-center text-sm text-muted-foreground">
                  <Bell className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  Sin notificaciones en este filtro.
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
