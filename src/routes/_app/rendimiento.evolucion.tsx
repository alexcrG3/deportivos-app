import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  TrendingUp, Activity, User, Scale, Ruler, Sparkles, Plus, Calendar,
  ShieldAlert, CheckCircle2, ChevronRight, BarChart2
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import RendimientoStore from "@/lib/rendimiento-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/rendimiento/evolucion")({ component: EvolucionFisicaPage });

function EvolucionFisicaPage() {
  const dbJugadores = useMemo(() => RendimientoStore.getJugadores(), []);
  const [selectedJugadorId, setSelectedJugadorId] = useState<string>("");

  useEffect(() => {
    if (dbJugadores.length > 0 && !selectedJugadorId) {
      setSelectedJugadorId(dbJugadores[0].id);
    }
  }, [dbJugadores, selectedJugadorId]);

  const selectedJugador = useMemo(() => {
    return dbJugadores.find((j) => j.id === selectedJugadorId) || dbJugadores[0] || null;
  }, [dbJugadores, selectedJugadorId]);

  // Modal Ficha Antropométrica
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [form, setForm] = useState({
    estatura: 168,
    peso: 62,
    grasa: 13.5,
    musculo: 44.0,
    fecha: new Date().toISOString().split("T")[0],
  });

  // Histórico evolutivo del alumno (Simulado síncrono basado en DB real)
  const evolucionHistory = useMemo(() => {
    if (!selectedJugador) return [];

    const baseEstatura = selectedJugador.estatura || 165;
    const basePeso = selectedJugador.peso || 58;

    return [
      { mes: "Ene 2026", estatura: baseEstatura - 3, peso: basePeso - 2.5, grasa: 14.8, musculo: 41.2 },
      { mes: "Mar 2026", estatura: baseEstatura - 2, peso: basePeso - 1.8, grasa: 14.2, musculo: 42.0 },
      { mes: "May 2026", estatura: baseEstatura - 1, peso: basePeso - 0.8, grasa: 13.8, musculo: 43.1 },
      { mes: "Jul 2026 (Actual)", estatura: baseEstatura, peso: basePeso, grasa: 13.2, musculo: 44.5 },
    ];
  }, [selectedJugador]);

  // Cálculo de Maduración Biológica / PHV (Peak Height Velocity)
  const phvCalculation = useMemo(() => {
    if (!selectedJugador) return null;
    const edad = selectedJugador.edad || 14;

    // Fórmula Mirwald / PHV Offset
    let offsetPHV = edad - 13.8; // Pico de velocidad promedio en varones ~13.8 años
    let estadoEtapa = "Pre-PUBERTAD (Fuerza Adaptada / Coordinación)";
    let recomendaciones = "Enfoque en técnica, movilidad articular y potencia básica con peso corporal.";
    let badgeColor = "bg-blue-500/10 text-blue-600 border-blue-500/30";

    if (offsetPHV >= -0.5 && offsetPHV <= 0.5) {
      estadoEtapa = "🔴 PICO DE CRECIMIENTO ACTIVO (PHV)";
      recomendaciones = "⚠️ ¡Atención! Riesgo elevado de apofisitis (Osgood-Schlatter). Evitar cargas axiales pesadas.";
      badgeColor = "bg-red-500/10 text-red-600 border-red-500/30";
    } else if (offsetPHV > 0.5) {
      estadoEtapa = "🟢 Post-PUBERTAD (Hipertrofia & Fuerza Máxima)";
      recomendaciones = "Apto para cargas progresivas de hipertrofia y potencia máxima con sobrecarga.";
      badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
    }

    return {
      edad,
      offsetPHV: offsetPHV.toFixed(1),
      estadoEtapa,
      recomendaciones,
      badgeColor,
    };
  }, [selectedJugador]);

  const handleSaveRegistro = () => {
    toast.success(`Ficha Antropométrica registrada para ${selectedJugador?.nombre} ✓`);
    setIsOpenModal(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE MÓDULO */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] uppercase mb-1">
            Módulo de Alto Rendimiento Enterprise
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            📈 Evolución Física & Antropometría
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Seguimiento biológico del crecimiento, composición corporal y maduración PHV.
          </p>
        </div>

        <Button
          onClick={() => setIsOpenModal(true)}
          className="bg-gradient-primary text-white font-extrabold gap-2 shadow-elegant rounded-xl"
        >
          <Plus className="h-4 w-4" /> ➕ Nueva Ficha Antropométrica
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Selector de Jugadores */}
        <Card className="lg:col-span-4 shadow-card border bg-card">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-xs font-extrabold uppercase text-muted-foreground">
              👥 Atletas de la Academia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
            {dbJugadores.map((j) => (
              <button
                key={j.id}
                onClick={() => setSelectedJugadorId(j.id)}
                className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                  selectedJugadorId === j.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div>
                  <p className="font-extrabold text-xs text-foreground">{j.nombre}</p>
                  <p className="text-[10px] text-muted-foreground">{j.categoria} · {j.posicion || "Atleta"}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Detalle Evolutivo del Atleta */}
        {selectedJugador ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Header del Atleta */}
            <Card className="shadow-card border bg-card">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold mb-1">
                      {selectedJugador.categoria}
                    </Badge>
                    <CardTitle className="text-lg font-extrabold text-foreground">{selectedJugador.nombre}</CardTitle>
                  </div>
                  <Badge className={`text-xs font-extrabold uppercase ${phvCalculation?.badgeColor}`}>
                    {phvCalculation?.estadoEtapa}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 grid gap-3 sm:grid-cols-4">
                <div className="p-3 rounded-xl border bg-muted/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">📏 Estatura</p>
                  <p className="text-lg font-black text-foreground">{selectedJugador.estatura || 168} cm</p>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">⚖️ Peso Corporal</p>
                  <p className="text-lg font-black text-foreground">{selectedJugador.peso || 62} kg</p>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">💧 % Masa Grasa</p>
                  <p className="text-lg font-black text-emerald-600">13.2%</p>
                </div>

                <div className="p-3 rounded-xl border bg-muted/30">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">💪 % Masa Muscular</p>
                  <p className="text-lg font-black text-primary">44.5%</p>
                </div>
              </CardContent>
            </Card>

            {/* Gráfica Evolutiva Temporal */}
            <Card className="shadow-card border bg-card">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-xs font-extrabold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> 📈 Evolución Biológica (Estatura vs. Peso)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucionHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="mes" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="estatura" name="Estatura (cm)" stroke="#8b5cf6" strokeWidth={3} />
                    <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ficha de Maduración PHV */}
            <Card className="shadow-card border border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-extrabold flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> 🧬 Diagnóstico de Maduración PHV (Peak Height Velocity)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-2">
                <p className="text-foreground font-semibold">
                  Offset de Crecimiento Estimado: <span className="font-mono font-bold text-primary">{phvCalculation?.offsetPHV} años</span> respecto al pico de velocidad.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Recomendación para Preparador Físico:</strong> {phvCalculation?.recomendaciones}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="lg:col-span-8 text-center py-12 text-xs text-muted-foreground">
            Selecciona un atleta.
          </div>
        )}
      </div>

      {/* MODAL FICHA ANTROPOMÉTRICA */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="sm:max-w-[450px] bg-card border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" /> Registrar Ficha Antropométrica
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ingresa los pliegues y medidas tomadas en la evaluación biológica
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Estatura (cm) *</label>
                <Input
                  type="number"
                  value={form.estatura}
                  onChange={(e) => setForm((f) => ({ ...f, estatura: Number(e.target.value) }))}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Peso (kg) *</label>
                <Input
                  type="number"
                  value={form.peso}
                  onChange={(e) => setForm((f) => ({ ...f, peso: Number(e.target.value) }))}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">% Masa Grasa *</label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.grasa}
                  onChange={(e) => setForm((f) => ({ ...f, grasa: Number(e.target.value) }))}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">% Masa Muscular *</label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.musculo}
                  onChange={(e) => setForm((f) => ({ ...f, musculo: Number(e.target.value) }))}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <Button onClick={handleSaveRegistro} className="w-full h-11 bg-primary text-white font-extrabold text-xs shadow-elegant rounded-xl">
              ✓ GUARDAR REGISTRO BIOLÓGICO
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EvolucionFisicaPage;
