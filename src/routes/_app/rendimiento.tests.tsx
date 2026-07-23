import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatCard } from "@/components/stat-card";
import RendimientoStore, { type TestFisico } from "@/lib/rendimiento-store";
import { Award, Plus, Sparkles, TrendingUp, ShieldAlert, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_app/rendimiento/tests")({ component: TestsPage });

const testTipos = [
  "Velocidad",
  "Agilidad",
  "Salto",
  "Resistencia",
  "Flexibilidad",
  "Fuerza",
  "VO2",
];

const testNames = [
  "Sprint 30m",
  "Yo-Yo Test",
  "Course Navette",
  "Cooper Test",
  "Salto Vertical CMJ",
  "Fuerza Max Banc",
];

function TestsPage() {
  const [tests, setTests] = useState<TestFisico[]>([]);
  const [openNewTest, setOpenNewTest] = useState(false);
  const [selectedTeamName, setSelectedTeamName] = useState<string>("all");

  const { role, coachName } = useRole();
  const isAdmin = role === "admin";

  const myTeams = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (isAdmin) return all;
    return all.filter(t => t.entrenador === coachName);
  }, [isAdmin, coachName]);

  const myCategories = useMemo(() => myTeams.map(t => t.categoria), [myTeams]);

  // Load real players dynamically to register tests
  const dbPlayers = useMemo(() => {
    const raw = RendimientoStore.getJugadores();
    if (isAdmin) return raw;
    return raw.filter(p => myCategories.includes(p.categoria));
  }, [isAdmin, myCategories]);

  // Load test types dynamically from Banco de Pruebas Físicas
  const bancoPruebasList = useMemo(() => {
    const fromDb = RendimientoStore.getBancoPruebas();
    if (fromDb && fromDb.length > 0) return fromDb;
    return testNames.map((name, i) => ({ id: `default-${i}`, nombre: name }));
  }, []);

  // Form state
  const [newTest, setNewTest] = useState({
    jugadorId: "",
    jugador: "",
    fecha: new Date().toISOString().split("T")[0],
    tipo: "Velocidad" as any,
    nombreTest: "",
    resultado: "4.15s",
    progreso: 5.0,
    estancado: false,
  });

  // Set initial player and test name when dbPlayers/bancoPruebas are loaded
  useEffect(() => {
    if (dbPlayers.length > 0 && !newTest.jugadorId) {
      setNewTest(prev => ({
        ...prev,
        jugadorId: dbPlayers[0].id,
        jugador: dbPlayers[0].nombre,
      }));
    }
  }, [dbPlayers]);

  useEffect(() => {
    if (bancoPruebasList.length > 0 && !newTest.nombreTest) {
      setNewTest(prev => ({
        ...prev,
        nombreTest: bancoPruebasList[0].nombre,
      }));
    }
  }, [bancoPruebasList]);

  const loadData = () => {
    const raw = RendimientoStore.getTests();
    let filtered = raw;

    if (!isAdmin) {
      const players = RendimientoStore.getJugadores();
      filtered = filtered.filter(t => {
        const p = players.find(x => x.id === t.jugadorId);
        return p && myCategories.includes(p.categoria);
      });
    }

    if (selectedTeamName !== "all") {
      const selTeamObj = myTeams.find(t => 
        t.nombre.toLowerCase().trim() === selectedTeamName.toLowerCase().trim()
      );
      if (selTeamObj) {
        const cat = (selTeamObj.categoria || "").toLowerCase().trim();
        const nom = (selTeamObj.nombre || "").toLowerCase().trim();
        const players = RendimientoStore.getJugadores();
        
        filtered = filtered.filter(t => {
          const p = players.find(x => x.id === t.jugadorId);
          if (!p || !p.categoria) return false;
          const pCat = p.categoria.toLowerCase().trim();
          return pCat === cat || pCat === nom || nom.includes(pCat) || pCat.includes(nom);
        });
      }
    }

    setTests(filtered);
  };

  useEffect(() => {
    loadData();
  }, [myCategories, isAdmin, selectedTeamName]);

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    RendimientoStore.addTest(newTest);
    toast.success("Evaluación física guardada con éxito");
    setOpenNewTest(false);
    loadData();
  };

  const handleToggleEstancamiento = (id: string, current: boolean) => {
    RendimientoStore.updateTest(id, { estancado: !current });
    toast.success("Estado de estancamiento actualizado");
    loadData();
  };

  // Calculations
  const totalEvaluaciones = tests.length;
  const mejorProgresion = tests.length > 0 ? Math.max(...tests.map(t => t.progreso)) : 0;
  const estancadosCount = tests.filter(t => t.estancado).length;

  // Chart data
  const chartData = tests.map(t => ({
    nombre: t.jugador, // Use full name instead of split name
    "Progreso %": t.progreso,
  }));

  // Dynamic Physical Test Catalog State
  const DEFAULT_CATALOG = ["Sprint 30m", "Yo-Yo Test", "Course Navette", "Cooper Test", "Salto Vertical CMJ", "Agilidad T-Test"];
  const [catalogoPruebas, setCatalogoPruebas] = useState<string[]>(() => {
    const saved = localStorage.getItem("athletix_catalogo_pruebas");
    return saved ? JSON.parse(saved) : DEFAULT_CATALOG;
  });
  const [modalCatalogo, setModalCatalogo] = useState(false);
  const [nuevoNombreTest, setNuevoNombreTest] = useState("");

  const guardarCatalogo = (newList: string[]) => {
    setCatalogoPruebas(newList);
    localStorage.setItem("athletix_catalogo_pruebas", JSON.stringify(newList));
    toast.success("Catálogo de pruebas físicas actualizado.");
  };

  const handleAgregarPrueba = () => {
    if (!nuevoNombreTest.trim()) return;
    if (catalogoPruebas.includes(nuevoNombreTest.trim())) {
      toast.error("Esta prueba ya existe en el catálogo.");
      return;
    }
    const updated = [...catalogoPruebas, nuevoNombreTest.trim()];
    guardarCatalogo(updated);
    setNuevoNombreTest("");
  };

  const handleEliminarPrueba = (nombre: string) => {
    if (catalogoPruebas.length <= 1) {
      toast.error("Debe existir al menos una prueba física en el catálogo.");
      return;
    }
    const updated = catalogoPruebas.filter(p => p !== nombre);
    guardarCatalogo(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tests Físicos & Evaluaciones</h1>
          <p className="text-sm text-muted-foreground">Historial de tests de velocidad, resistencia, VO2, agilidad y fuerza explosiva.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Equipo:</span>
          <select
            value={selectedTeamName}
            onChange={(e) => setSelectedTeamName(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 py-1 text-xs font-bold shadow-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-foreground mr-2"
          >
            <option value="all">Todos los equipos</option>
            {myTeams.map((t) => (
              <option key={t.id} value={t.nombre}>
                {t.nombre}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="gap-1 border-primary/40 text-primary hover:bg-primary/10 font-bold" onClick={() => setModalCatalogo(true)}>
            ⚙️ Configurar Pruebas
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.success("Evaluaciones físicas exportadas a PDF/Excel")}><FileSpreadsheet className="h-4 w-4" /> Exportar</Button>
          <Sheet open={openNewTest} onOpenChange={setOpenNewTest}>
            <SheetTrigger asChild>
              <Button className="bg-gradient-primary shadow-elegant"><Plus className="mr-1 h-4 w-4" />Registrar Test</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Registrar Evaluación Física</SheetTitle>
                <SheetDescription>Completa los resultados del test físico del atleta.</SheetDescription>
              </SheetHeader>
              <form onSubmit={handleAddTest} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Jugador</label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required value={newTest.jugadorId} onChange={(e) => {
                    const targetPlayer = dbPlayers.find(p => p.id === e.target.value);
                    setNewTest({ ...newTest, jugadorId: e.target.value, jugador: targetPlayer?.nombre || "" });
                  }}>
                    {dbPlayers.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Tipo</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newTest.tipo} onChange={(e) => setNewTest({ ...newTest, tipo: e.target.value as any })}>
                      {testTipos.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Nombre de Test</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newTest.nombreTest} onChange={(e) => setNewTest({ ...newTest, nombreTest: e.target.value })}>
                      {catalogoPruebas.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Resultado</label>
                    <Input required placeholder="Ej. 4.15s / 18.2" value={newTest.resultado} onChange={(e) => setNewTest({ ...newTest, resultado: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Progreso (%)</label>
                    <Input type="number" step="0.1" required value={newTest.progreso} onChange={(e) => setNewTest({ ...newTest, progreso: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Fecha de Evaluación</label>
                  <Input type="date" required value={newTest.fecha} onChange={(e) => setNewTest({ ...newTest, fecha: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">Guardar Evaluación</Button>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {tests.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Award className="h-10 w-10 text-muted-foreground animate-pulse" />
            <p className="text-sm font-medium">No hay evaluaciones físicas registradas para este equipo</p>
            <p className="text-xs text-center max-w-sm">Asegúrate de que hay jugadores asignados a la categoría de este equipo y registra su primer test físico.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard icon={Award} label="Total Evaluaciones" value={totalEvaluaciones.toString()} hint="Tests guardados" accent="primary" />
        <StatCard icon={TrendingUp} label="Mejor Progresión" value={`+${mejorProgresion}%`} hint="Crecimiento físico" accent="success" />
        <StatCard icon={ShieldAlert} label="Atletas Estancados" value={estancadosCount.toString()} hint="Requieren ajuste de macrociclo" accent="warning" />
      </div>

      {estancadosCount > 0 && (
        <Card className="border-warning/40 bg-warning/5 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-warning-foreground"><ShieldAlert className="h-4 w-4" /> Recomendación IA por Estancamiento Físico</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-muted-foreground">La IA ha detectado falta de progresión deportiva. Se recomienda reprogramar los microciclos de los atletas correspondientes para incorporar volumen específico.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle>Historial de Evaluaciones y Progreso</CardTitle>
            <CardDescription>Crecimiento en porcentaje del rendimiento atlético</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            {tests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin evaluaciones físicas registradas en este equipo.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -10, right: 5, top: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="nombre" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                  <Bar dataKey="Progreso %" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> IA Test Insights</CardTitle>
            <CardDescription>Estancamiento y evolución</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tests.map((t) => (
              <div key={t.id} className={`p-3 border rounded-lg space-y-1 ${t.estancado ? "bg-warning/5 border-warning/30" : "bg-success/5 border-success/30"}`}>
                <div className="flex items-center justify-between font-semibold">
                  <span>{t.jugador}</span>
                  <Badge variant={t.estancado ? "outline" : "default"}>{t.estancado ? "Estancado" : "En Progreso"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.tipo} — {t.nombreTest}: {t.resultado} ({t.progreso > 0 ? `+${t.progreso}` : t.progreso}%)</p>
                <p className="text-[10px] text-primary italic mt-1">{t.estancado ? "Acción recomendada: Ajustar volumen de resistencia en Planificación." : "Evolución óptima. Continuar con el plan de preparación."}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Historial Completo de Tests Físicos</CardTitle>
          <CardDescription>Bandeja y control de evaluaciones físicas del club</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tests.map((t) => (
            <div key={t.id} className="rounded-lg border p-4 bg-card hover:shadow-elegant transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-sm">{t.jugador}</p>
                <p className="text-xs text-muted-foreground">Test: {t.nombreTest} ({t.tipo}) · Fecha: {t.fecha} · Resultado: {t.resultado} · Progreso: {t.progreso > 0 ? `+${t.progreso}` : t.progreso}%</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={t.estancado ? "default" : "outline"} onClick={() => handleToggleEstancamiento(t.id, t.estancado)}>
                  {t.estancado ? "Marcar en Progreso" : "Marcar Estancado"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      </>
      )}

      {/* MODAL GESTOR DE CATÁLOGO DE PRUEBAS FÍSICAS */}
      <Dialog open={modalCatalogo} onOpenChange={setModalCatalogo}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              ⚙️ GESTOR DE CATÁLOGO DE PRUEBAS FÍSICAS
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Agrega o elimina las pruebas físicas personalizadas que utiliza tu club o academia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* AGREGAR NUEVA PRUEBA */}
            <div className="flex items-center gap-2">
              <Input
                value={nuevoNombreTest}
                onChange={(e) => setNuevoNombreTest(e.target.value)}
                placeholder="Ej. Sprint 10m, Test de Agilidad Illinois..."
                className="h-10 text-xs rounded-xl"
              />
              <Button onClick={handleAgregarPrueba} className="h-10 text-xs font-bold px-4 rounded-xl shrink-0">
                + Agregar
              </Button>
            </div>

            {/* LISTA DE PRUEBAS ACTUALES */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">Pruebas Activas en el Sistema ({catalogoPruebas.length})</span>
              {catalogoPruebas.map((nombre) => (
                <div key={nombre} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-xl border text-xs font-semibold">
                  <span>🏃 {nombre}</span>
                  <button
                    type="button"
                    onClick={() => handleEliminarPrueba(nombre)}
                    className="h-7 w-7 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition"
                    title="Eliminar prueba"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={() => setModalCatalogo(false)} className="w-full h-9 text-xs rounded-xl">
              Cerrar Gestor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
