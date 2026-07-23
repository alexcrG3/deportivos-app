import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Megaphone, Plus, Send, Mail, MessageSquare, TrendingUp, Link as LinkIcon } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { crmCampanas } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/campanas")({ component: CampanasPage });

function CampanasPage() {
  const [campanas, setCampanas] = useState(crmCampanas);
  const activas = campanas.filter((c) => c.estado === "activa").length;
  const totalEnviados = campanas.reduce((s, c) => s + c.enviados, 0);
  const totalConv = campanas.reduce((s, c) => s + c.conversiones, 0);
  const tasa = Math.round((totalConv / totalEnviados) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campañas</h1>
          <p className="text-sm text-muted-foreground">Captación masiva por WhatsApp y Email</p>
        </div>
        <NewCampanaDialog onCreate={(c) => setCampanas((p) => [c, ...p])} />
      </div>

      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-800 text-white rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4 border border-indigo-500/20">
        <div className="space-y-1">
          <Badge className="bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-md">
            📢 Captación Masiva Prospectos
          </Badge>
          <h2 className="text-lg font-black flex items-center gap-2 text-white">
            <Megaphone className="h-5 w-5 text-amber-300 animate-pulse" /> Enlace Público de Pre-Inscripción
          </h2>
          <p className="text-xs text-indigo-100 max-w-xl leading-relaxed">
            Comparte este enlace en tus publicaciones de redes sociales, WhatsApp o correos de campaña para captar prospectos en tiempo real.
          </p>
        </div>
        <Button 
          className="bg-white text-indigo-700 hover:bg-slate-100 font-extrabold text-xs px-5 py-3.5 h-auto rounded-2xl shadow-lg gap-2 shrink-0 transition-transform active:scale-95 cursor-pointer"
          onClick={() => {
            if (typeof window !== "undefined") {
              const url = `${window.location.origin}/inscripcion`;
              navigator.clipboard.writeText(url);
              toast.success("¡Enlace público copiado al portapapeles!", { description: url });
            }
          }}
        >
          <LinkIcon className="h-4 w-4 text-indigo-600" /> Copiar Enlace Público
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Megaphone} label="Campañas activas" value={activas.toString()} />
        <StatCard icon={Send} label="Enviados" value={totalEnviados.toString()} />
        <StatCard icon={TrendingUp} label="Conversiones" value={totalConv.toString()} />
        <StatCard icon={TrendingUp} label="Tasa conversión" value={`${tasa}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {campanas.map((c) => {
          const apertura = Math.round((c.abiertos / c.enviados) * 100);
          const conv = Math.round((c.conversiones / c.enviados) * 100);
          return (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {c.canal === "WhatsApp" ? <MessageSquare className="h-4 w-4 text-emerald-500" /> : <Mail className="h-4 w-4 text-blue-500" />}
                      {c.nombre}
                    </CardTitle>
                    <CardDescription>{c.segmento}</CardDescription>
                  </div>
                  <Badge variant={c.estado === "activa" ? "default" : c.estado === "pausada" ? "secondary" : "outline"}>{c.estado}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-xs text-muted-foreground">Enviados</p><p className="text-lg font-bold">{c.enviados}</p></div>
                  <div><p className="text-xs text-muted-foreground">Abiertos</p><p className="text-lg font-bold">{c.abiertos}</p></div>
                  <div><p className="text-xs text-muted-foreground">Conv.</p><p className="text-lg font-bold text-primary">{c.conversiones}</p></div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs"><span>Tasa apertura</span><span>{apertura}%</span></div>
                  <Progress value={apertura} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs"><span>Tasa conversión</span><span>{conv}%</span></div>
                  <Progress value={conv} />
                </div>
                <p className="text-xs text-muted-foreground">{c.inicio} → {c.fin}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function NewCampanaDialog({ onCreate }: { onCreate: (c: any) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", canal: "WhatsApp", segmento: "Todos", mensaje: "" });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva campaña</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Crear campaña</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nombre de campaña" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={form.canal} onValueChange={(v) => setForm({ ...form, canal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["WhatsApp", "Email"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.segmento} onValueChange={(v) => setForm({ ...form, segmento: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Todos", "Sub-10/12", "Sub-14/16", "Sede Central", "Sede Norte", "Fútbol", "Baloncesto"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Textarea placeholder="Mensaje de la campaña…" rows={4} value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} />
          <Button className="w-full" onClick={() => {
            if (!form.nombre) return toast.error("Nombre requerido");
            onCreate({ id: `cm${Date.now()}`, ...form, estado: "activa", enviados: 0, abiertos: 0, conversiones: 0, inicio: new Date().toISOString().slice(0, 10), fin: "—" });
            setOpen(false);
            toast.success("Campaña creada");
          }}>Lanzar campaña</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
