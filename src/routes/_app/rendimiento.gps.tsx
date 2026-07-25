import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import RendimientoStore, { type Sesion } from "@/lib/rendimiento-store";
import { Cpu, RefreshCw, Upload, Map, Heart, Zap, Sparkles, Activity } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/_app/rendimiento/gps")({ component: GPSPage });

const brands = [
  { name: "Garmin", logo: "⌚" },
  { name: "Polar", logo: "❤️" },
  { name: "Catapult", logo: "🏆" },
  { name: "STATSports", logo: "📊" },
  { name: "Apple Watch", logo: "🍏" },
  { name: "Fitbit", logo: "💠" },
  { name: "WHOOP", logo: "⚡" },
  { name: "Coros", logo: "🏔️" },
];

function GPSPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("Garmin");
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = () => {
    setSesiones(RendimientoStore.getSesiones());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncDevice = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Find a session that is not synced yet and sync it
      const unsynced = sesiones.find(s => !s.gpsSincronizado);
      if (unsynced) {
        RendimientoStore.updateSesion(unsynced.id, {
          gpsSincronizado: true,
          gpsData: {
            distancia: 6100,
            sprints: 10,
            aceleraciones: 38,
            velocidadMax: 29,
            frecuenciaCardiaca: 148,
          },
        });
        toast.success(`Sincronización exitosa con ${selectedBrand}. Cargado entrenamiento "${unsynced.nombre}"`);
      } else {
        toast.info("Todos los entrenamientos actuales ya están sincronizados");
      }
      setIsSyncing(false);
      loadData();
    }, 1500);
  };

  // Calculations for stats
  const synced = sesiones.filter(s => s.gpsSincronizado && s.gpsData);
  const totalDist = synced.reduce((acc, s) => acc + (s.gpsData?.distancia || 0), 0);
  const maxVel = synced.length > 0 ? Math.max(...synced.map(s => s.gpsData?.velocidadMax || 0)) : 0;
  const avgHR = synced.length > 0
    ? Math.round(synced.reduce((acc, s) => acc + (s.gpsData?.frecuenciaCardiaca || 0), 0) / synced.length)
    : 0;

  // Chart data prep
  const chartData = synced.map(s => ({
    nombre: s.nombre.slice(0, 10),
    Distancia: s.gpsData?.distancia || 0,
    FC: s.gpsData?.frecuenciaCardiaca || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-[10px] uppercase mb-1">
            Alto Rendimiento · Área Técnica
          </Badge>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">GPS & Wearables</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Importación y análisis de datos de dispositivos de rendimiento y sensores.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 font-semibold border-slate-200 dark:border-slate-800" onClick={() => toast.success("Importador CSV abierto")}><Upload className="h-4 w-4 text-primary" /> Importar CSV</Button>
          <Button size="sm" className="gap-1 bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-sm rounded-xl" onClick={handleSyncDevice} disabled={isSyncing}>
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} /> 
            {isSyncing ? "Sincronizando..." : "Sincronizar Dispositivo"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Distancia Sincronizada</p>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold my-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">{(totalDist / 1000).toFixed(1)} km</p>
          </div>
          <p className="text-xs font-normal text-slate-600 dark:text-slate-300">
            Acumulado <span className="mx-1 text-slate-300 dark:text-slate-600">•</span> <span className="font-semibold text-slate-700 dark:text-slate-200">GPS en vivo</span>
          </p>
        </Card>

        <Card className="p-5 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Velocidad Máxima</p>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold my-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">{maxVel} km/h</p>
          </div>
          <p className="text-xs font-normal text-slate-600 dark:text-slate-300">
            Sprint pico <span className="mx-1 text-slate-300 dark:text-slate-600">•</span> <span className="font-semibold text-slate-700 dark:text-slate-200">Récord de equipo</span>
          </p>
        </Card>

        <Card className="p-5 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Frecuencia Cardíaca</p>
              <Heart className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold my-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">{avgHR} bpm</p>
          </div>
          <p className="text-xs font-normal text-slate-600 dark:text-slate-300">
            Promedio FC <span className="mx-1 text-slate-300 dark:text-slate-600">•</span> <span className="font-semibold text-slate-700 dark:text-slate-200">Zona aeróbica</span>
          </p>
        </Card>

        <Card className="p-5 shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">Dispositivo Enlazado</p>
              <Cpu className="h-4 w-4 text-sky-500" />
            </div>
            <p className="text-2xl font-bold my-1 text-slate-900 dark:text-slate-100 font-mono tracking-tight">{selectedBrand}</p>
          </div>
          <p className="text-xs font-normal text-slate-600 dark:text-slate-300">
            Estado <span className="mx-1 text-slate-300 dark:text-slate-600">•</span> <span className="font-semibold text-slate-700 dark:text-slate-200">Sincronización activa</span>
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle>Dispositivos Compatibles</CardTitle>
            <CardDescription>Selecciona tu proveedor para enlazar automáticamente mediante API o Bluetooth</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {brands.map((b) => (
              <button key={b.name} onClick={() => setSelectedBrand(b.name)}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition hover:shadow-elegant ${selectedBrand === b.name ? "border-primary bg-primary/5 text-primary" : "bg-card"}`}>
                <span className="text-3xl mb-1">{b.logo}</span>
                <span className="text-xs font-semibold">{b.name}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> Diagnóstico IA GPS</CardTitle>
            <CardDescription>Alertas de sobrecarga mecánica y FC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {synced.map((s) => (
              <div key={s.id} className="p-3 border rounded-lg bg-card space-y-1">
                <p className="font-semibold text-xs">{s.nombre}</p>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2 pt-1">
                  <span>Sprint Max: {s.gpsData?.velocidadMax} km/h</span>
                  <span>Dist: {s.gpsData?.distancia} m</span>
                </div>
                <p className="text-[10px] text-primary italic mt-1">Carga cardiovascular y de sprints óptima. Recuperación sugerida de 24 horas.</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Historial de Esfuerzo Físico</CardTitle>
            <CardDescription>Volumen e intensidades en los últimos entrenamientos sincronizados</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -10, right: 5, top: 5 }}>
                <defs>
                  <linearGradient id="gGPS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="nombre" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="Distancia" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gGPS)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* MAP & HEATMAP PLACEHOLDER */}
        <Card className="shadow-card overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><Map className="h-4 w-4 text-primary" /> Visualizador GPS & Heatmap</CardTitle>
            <CardDescription>Ruta e intensidad de movimientos en el campo</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex items-center justify-center bg-muted/40 h-64 border-t relative">
            {/* Visual simulation of GPS heatmap overlay */}
            <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400')" }} />
            <div className="absolute inset-0 bg-radial-gradient from-emerald-500/20 via-transparent to-transparent" />
            <div className="relative text-center p-4 bg-background/90 rounded-lg shadow border backdrop-blur-sm max-w-xs space-y-1">
              <p className="font-semibold text-xs text-foreground uppercase tracking-wider">Heatmap de Entrenamiento</p>
              <p className="text-[10px] text-muted-foreground">La intensidad física se concentró en el sector defensivo izquierdo (Sede Central - Fútbol).</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
