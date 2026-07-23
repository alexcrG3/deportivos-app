import { createFileRoute } from "@tanstack/react-router";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { whatsappMessages, whatsappTemplates, emailLogs } from "@/lib/mock-data";
import { MessageSquare, Mail, Send, CheckCheck, Eye, AlertCircle, Plus } from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/comunicaciones")({ component: ComunicacionesPage });

const waEstado: Record<string, string> = {
  leído: "bg-success/15 text-success",
  entregado: "bg-primary/15 text-primary",
  enviado: "bg-muted text-muted-foreground",
  fallido: "bg-destructive/15 text-destructive",
};

const emailEstado: Record<string, string> = {
  entregado: "bg-primary/15 text-primary",
  abierto: "bg-success/15 text-success",
  rebotado: "bg-destructive/15 text-destructive",
};

function ComunicacionesPage() {
  const hasPlayers = RendimientoStore.getJugadores().length > 0;
  const activeWaMessages = hasPlayers ? whatsappMessages : [];
  const activeEmailLogs = hasPlayers ? emailLogs : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comunicaciones</h1>
          <p className="text-sm text-muted-foreground">WhatsApp Business y emails transaccionales automatizados.</p>
        </div>
        <Button className="bg-gradient-primary shadow-elegant"><Send className="h-4 w-4" /> Nueva campaña</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mensajes WhatsApp (mes)" value={hasPlayers ? "1.248" : "0"} delta={hasPlayers ? 18 : 0} icon={MessageSquare} accent="success" />
        <StatCard label="Emails enviados (mes)" value={hasPlayers ? "864" : "0"} delta={hasPlayers ? 11 : 0} icon={Mail} accent="primary" />
        <StatCard label="Tasa de entrega" value={hasPlayers ? "98.4%" : "0%"} hint="WhatsApp + Email" icon={CheckCheck} accent="success" />
        <StatCard label="Errores recientes" value={hasPlayers ? "6" : "0"} hint="últimas 24 h" icon={AlertCircle} accent="destructive" />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <Tabs defaultValue="whatsapp">
            <TabsList>
              <TabsTrigger value="whatsapp"><MessageSquare className="h-4 w-4" /> WhatsApp</TabsTrigger>
              <TabsTrigger value="email"><Mail className="h-4 w-4" /> Email</TabsTrigger>
              <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="mt-4">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Destinatario</TableHead>
                      <TableHead>Plantilla</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeWaMessages.length > 0 ? (
                      activeWaMessages.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{m.destinatario}</div>
                            <div className="text-xs text-muted-foreground font-mono">{m.numero}</div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="font-mono text-xs">{m.plantilla}</Badge></TableCell>
                          <TableCell><Badge variant="secondary" className={waEstado[m.estado]}>{m.estado}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{m.fecha}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                          No hay mensajes enviados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="email" className="mt-4">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Destinatario</TableHead>
                      <TableHead>Asunto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeEmailLogs.length > 0 ? (
                      activeEmailLogs.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-sm">{e.destinatario}</TableCell>
                          <TableCell className="text-sm font-medium">{e.asunto}</TableCell>
                          <TableCell><Badge variant="outline">{e.tipo}</Badge></TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={emailEstado[e.estado]}>
                              {e.estado === "abierto" && <Eye className="h-3 w-3" />}
                              {e.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{e.fecha}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                          No hay correos enviados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="plantillas" className="mt-4 space-y-3">
              <div className="flex justify-end">
                <Button variant="outline"><Plus className="h-4 w-4" /> Nueva plantilla</Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {whatsappTemplates.map((t) => (
                  <Card key={t.id} className="shadow-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{t.categoria}</Badge>
                        <span className="text-xs text-muted-foreground">{t.uso} usos</span>
                      </div>
                      <CardTitle className="text-base font-mono mt-2">{t.nombre}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-2">Variables</p>
                      <div className="flex flex-wrap gap-1.5">
                        {t.variables.map((v) => (
                          <Badge key={v} variant="secondary" className="font-mono text-[10px]">{`{{${v}}}`}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
