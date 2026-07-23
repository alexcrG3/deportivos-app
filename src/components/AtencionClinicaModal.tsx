import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Stethoscope, AlertTriangle, ShieldCheck, Calendar, Activity, Zap, CheckCircle2, History, ClipboardList, Rocket, HeartPulse } from "lucide-react";
import RendimientoStore, { CitaFisioterapia, StoreJugador } from "@/lib/rendimiento-store";
import { toast } from "sonner";

interface AtencionClinicaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cita: CitaFisioterapia | null;
  onComplete?: () => void;
}

export function AtencionClinicaModal({ open, onOpenChange, cita, onComplete }: AtencionClinicaModalProps) {
  const [activeTab, setActiveTab] = useState<"pasado" | "presente" | "futuro">("pasado");

  // Bloque 1: El Pasado
  const [origenAlerta, setOrigenAlerta] = useState("");
  const [antecedentesAlergias, setAntecedentesAlergias] = useState("Sin alergias conocidas. Cirugía de rodilla derecha en 2024.");
  const [nivelDolorEva, setNivelDolorEva] = useState(5);

  // Bloque 2: El Presente
  const [tecnicasSeleccionadas, setTecnicasSeleccionadas] = useState<string[]>([
    "Crioterapia (Hielo)",
    "Electroterapia (TENS / EMS)",
  ]);
  const [rutinaReadaptacion, setRutinaReadaptacion] = useState(
    "Ejercicios de propiocepción en bosu (3x10s), fortalecimiento de core y estiramientos dinámicos asistidos."
  );

  // Bloque 3: El Futuro
  const [semaforoRestriccion, setSemaforoRestriccion] = useState<"🔴 Baja Total" | "🟡 Trabajo Diferenciado" | "🟢 Alta Deportiva Total">("🟡 Trabajo Diferenciado");
  const [proximaCitaFecha, setProximaCitaFecha] = useState("");

  const jugador: StoreJugador | null = cita
    ? RendimientoStore.getJugadores().find((j) => j.id === cita.jugadorId || j.nombre === cita.jugadorNombre) || null
    : null;

  useEffect(() => {
    if (cita) {
      setOrigenAlerta(cita.motivo || "Reporte inicial: Dolor y molestia tras esfuerzo en práctica.");
      setNivelDolorEva(cita.nivelDolorEva || 5);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 3);
      setProximaCitaFecha(nextWeek.toISOString().slice(0, 10));
    }
  }, [cita]);

  if (!cita) return null;

  const toggleTecnica = (tecnica: string) => {
    if (tecnicasSeleccionadas.includes(tecnica)) {
      setTecnicasSeleccionadas(tecnicasSeleccionadas.filter((t) => t !== tecnica));
    } else {
      setTecnicasSeleccionadas([...tecnicasSeleccionadas, tecnica]);
    }
  };

  const handleSaveAtencion = (e: React.FormEvent) => {
    e.preventDefault();

    // Update appointment
    RendimientoStore.updateCitaFisioterapia(cita.id, {
      estado: "completada",
      nivelDolorEva,
      tratamientoAplicado: tecnicasSeleccionadas.join(", ") + " + Readaptación",
    });

    // Update player operational status & semaforo
    if (jugador) {
      let estadoOp: any = "verde";
      if (semaforoRestriccion.includes("Baja Total")) estadoOp = "rojo-lesion";
      else if (semaforoRestriccion.includes("Diferenciado")) estadoOp = "amarillo";
      
      RendimientoStore.updateJugador(jugador.id, {
        estadoOp,
        notasSalud: `Restricción Fisioterapia: ${semaforoRestriccion}. Tratamiento: ${tecnicasSeleccionadas.join(", ")}. EVA: ${nivelDolorEva}/10.`,
      });
    }

    toast.success(`✅ Atención clínica completada para ${cita.jugadorNombre}. Semáforo actualizado a ${semaforoRestriccion}.`);
    onOpenChange(false);
    if (onComplete) onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] bg-background border shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-t-3xl border-b border-indigo-500/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 ring-2 ring-indigo-400">
                <AvatarImage src={jugador?.avatar} />
                <AvatarFallback className="bg-indigo-600 font-black text-white text-lg">
                  {cita.jugadorNombre[0]}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-500/40 text-[10px] uppercase font-mono font-bold">
                    Modulo Clínico Fisioterapeuta
                  </Badge>
                  <span className="text-xs text-indigo-300 font-mono">ID: {jugador?.identificacion || "DOC-102"}</span>
                </div>
                <h3 className="text-xl font-extrabold text-white">{cita.jugadorNombre}</h3>
                <p className="text-xs text-slate-300">
                  Categoría: <strong>{jugador?.categoria || "U13 Asoderive"}</strong> · Especialista: <strong>{cita.fisioterapeutaNombre}</strong>
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">Fecha del Turno</span>
              <p className="text-xs font-bold text-indigo-300">{cita.fecha} - {cita.hora}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveAtencion} className="p-6 space-y-6">
          {/* Workflow Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-3 bg-muted/60 p-1 rounded-2xl">
              <TabsTrigger value="pasado" className="rounded-xl font-bold text-xs gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <History className="h-4 w-4" /> 1. Diagnóstico & EVA
              </TabsTrigger>
              <TabsTrigger value="presente" className="rounded-xl font-bold text-xs gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <ClipboardList className="h-4 w-4" /> 2. Tratamiento Día
              </TabsTrigger>
              <TabsTrigger value="futuro" className="rounded-xl font-bold text-xs gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <Rocket className="h-4 w-4" /> 3. Retorno & Semáforo
              </TabsTrigger>
            </TabsList>

            {/* BLOQUE 1: DIAGNÓSTICO E HISTORIAL DE INGRESO (EL PASADO) */}
            <TabsContent value="pasado" className="space-y-5 mt-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
                <p className="text-xs font-bold uppercase font-mono flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" /> Origen de la Alerta (Reporte Inicial del Entrenador)
                </p>
                <p className="text-xs font-medium italic">
                  "{origenAlerta}"
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <HeartPulse className="h-4 w-4 text-indigo-500" /> Ficha de Antecedentes y Contraindicaciones Médicas
                </Label>
                <Textarea
                  value={antecedentesAlergias}
                  onChange={(e) => setAntecedentesAlergias(e.target.value)}
                  rows={2}
                  className="text-xs rounded-xl"
                  placeholder="Alergias, medicamentos, cirugías previas..."
                />
              </div>

              {/* Slider de Dolor EVA */}
              <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">
                    Evolución del Dolor en Sesión de Hoy (Escala EVA: 1 al 10)
                  </Label>
                  <Badge className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    nivelDolorEva >= 7 ? "bg-destructive text-white" : nivelDolorEva >= 4 ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                  }`}>
                    Nivel EVA: {nivelDolorEva} / 10
                  </Badge>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={nivelDolorEva}
                  onChange={(e) => setNivelDolorEva(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>1 (Sin dolor)</span>
                  <span>5 (Dolor moderado)</span>
                  <span>10 (Dolor insoportable)</span>
                </div>
              </div>
            </TabsContent>

            {/* BLOQUE 2: REGISTRO DEL TRATAMIENTO DEL DÍA (EL PRESENTE) */}
            <TabsContent value="presente" className="space-y-5 mt-4">
              <div className="space-y-3">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-indigo-500" /> Checklist de Fisioterapia Avanzada (Técnicas Aplicadas Hoy)
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    "Crioterapia (Hielo)",
                    "Termoterapia (Calor)",
                    "Electroterapia (TENS / EMS)",
                    "Ultrasonido Terapéutico / Láser",
                    "Terapia Manual (Masoterapia / Movilización)",
                    "Punción Seca / Kinesiotaping",
                  ].map((tecnica) => (
                    <div
                      key={tecnica}
                      onClick={() => toggleTecnica(tecnica)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-2.5 text-xs ${
                        tecnicasSeleccionadas.includes(tecnica)
                          ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/40 text-indigo-900 dark:text-indigo-200 font-bold"
                          : "bg-background border-border text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <Checkbox checked={tecnicasSeleccionadas.includes(tecnica)} onCheckedChange={() => toggleTecnica(tecnica)} />
                      <span>{tecnica}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-500" /> Readaptación Funcional (Ejercicio Guiado en Camilla / Gimnasio)
                </Label>
                <Textarea
                  value={rutinaReadaptacion}
                  onChange={(e) => setRutinaReadaptacion(e.target.value)}
                  rows={3}
                  className="text-xs rounded-xl"
                  placeholder="Detalla ejercicios de propiocepción, bosu, estiramientos o fortalecimiento..."
                />
              </div>
            </TabsContent>

            {/* BLOQUE 3: PLAN DE RETORNO AL JUEGO & RESTRICCIONES (EL FUTURO) */}
            <TabsContent value="futuro" className="space-y-5 mt-4">
              <div className="space-y-3">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-indigo-500" /> Semáforo de Restricciones en Coach OS (Estatus del Alumno)
                </Label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "🔴 Baja Total", title: "🔴 Baja Total", desc: "Reposo absoluto. No pisa cancha." },
                    { id: "🟡 Trabajo Diferenciado", title: "🟡 Trabajo Diferenciado", desc: "Calentamiento sí. Sin fútbol ni contacto." },
                    { id: "🟢 Alta Deportiva Total", title: "🟢 Alta Deportiva Total", desc: "100% recuperado para entrenar y jugar." },
                  ].map((sem) => (
                    <div
                      key={sem.id}
                      onClick={() => setSemaforoRestriccion(sem.id as any)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-1.5 text-xs ${
                        semaforoRestriccion === sem.id
                          ? "bg-slate-900 text-white border-indigo-500 ring-2 ring-indigo-500 shadow-md"
                          : "bg-background border-border text-foreground hover:bg-muted/30"
                      }`}
                    >
                      <p className="font-extrabold text-sm">{sem.title}</p>
                      <p className="text-[11px] opacity-80 leading-snug">{sem.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-indigo-500" /> Programar Próxima Cita
                  </Label>
                  <Input
                    type="date"
                    value={proximaCitaFecha}
                    onChange={(e) => setProximaCitaFecha(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" /> Sincronización Automática
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Al guardar, la cita cambiará a <strong className="text-emerald-600">COMPLETADA</strong> y la restricción viajará directo al panel del DT en Coach OS.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Buttons */}
          <DialogFooter className="pt-4 border-t border-border flex flex-row items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs font-bold">
              Cancelar
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs gap-1.5 shadow-md">
              <CheckCircle2 className="h-4 w-4" /> 💾 Guardar Registro Clínico & Sincronizar Coach OS
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
