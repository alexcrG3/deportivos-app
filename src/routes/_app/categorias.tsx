import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { disciplinas, sedes } from "@/lib/mock-data";
import { Plus, Search, Users, FolderKanban, Edit, Trash2 } from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/categorias")({ component: CategoriasPage });

function CategoriasPage() {
  const router = useRouter();
  const [categoriesList, setCategoriesList] = useState<any[]>(() => RendimientoStore.getCategorias());
  const [openCreate, setOpenCreate] = useState(false);
  const [q, setQ] = useState("");
  const [disc, setDisc] = useState("todas");
  const [sede, setSede] = useState("todas");

  const coaches = useMemo(() => RendimientoStore.getEntrenadores(), []);
  const activePlayers = useMemo(() => RendimientoStore.getJugadores(), []);

  // Form states (Create)
  const [nombre, setNombre] = useState("");
  const [disciplina, setDisciplina] = useState("Fútbol");
  const [edadMin, setEdadMin] = useState(8);
  const [edadMax, setEdadMax] = useState(10);
  const [genero, setGenero] = useState("Mixto");
  const [sedeId, setSedeId] = useState("s1");
  const [entrenador, setEntrenador] = useState(() => coaches[0]?.nombre || "Sin asignar");
  const [capacidad, setCapacidad] = useState(20);
  const [costoMensual, setCostoMensual] = useState(30000);

  // Form states (Edit)
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editNombre, setEditNombre] = useState("");
  const [editDisciplina, setEditDisciplina] = useState("Fútbol");
  const [editEdadMin, setEditEdadMin] = useState(8);
  const [editEdadMax, setEditEdadMax] = useState(10);
  const [editGenero, setEditGenero] = useState("Mixto");
  const [editSedeId, setEditSedeId] = useState("s1");
  const [editEntrenador, setEditEntrenador] = useState("Sin asignar");
  const [editCapacidad, setEditCapacidad] = useState(20);
  const [editCostoMensual, setEditCostoMensual] = useState(30000);

  const handleOpenEdit = (c: any) => {
    setEditId(c.id);
    setEditNombre(c.nombre);
    setEditDisciplina(c.disciplina);
    setEditEdadMin(c.edadMin);
    setEditEdadMax(c.edadMax);
    setEditGenero(c.genero);
    setEditSedeId(c.sedeId);
    setEditEntrenador(c.entrenador || "Sin asignar");
    setEditCapacidad(c.capacidad);
    setEditCostoMensual(c.costoMensual ?? 30000);
    setOpenEdit(true);
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    RendimientoStore.updateCategoria(editId, {
      nombre: editNombre,
      disciplina: editDisciplina,
      edadMin: Number(editEdadMin),
      edadMax: Number(editEdadMax),
      genero: editGenero,
      sedeId: editSedeId,
      entrenador: editEntrenador,
      capacidad: Number(editCapacidad),
      costoMensual: Number(editCostoMensual),
    });

    setOpenEdit(false);
    toast.success("Categoría actualizada con éxito");
    setCategoriesList(RendimientoStore.getCategorias());
    router.invalidate();
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${name}"? Esta acción no se puede deshacer.`)) {
      RendimientoStore.deleteCategoria(id);
      toast.success("Categoría eliminada con éxito");
      setCategoriesList(RendimientoStore.getCategorias());
      router.invalidate();
    }
  };

  const filtered = useMemo(() =>
    categoriesList.filter((c) =>
      c.nombre.toLowerCase().includes(q.toLowerCase()) &&
      (disc === "todas" || c.disciplina === disc) &&
      (sede === "todas" || c.sedeId === sede)
    ), [categoriesList, q, disc, sede]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    RendimientoStore.addCategoria({
      nombre,
      disciplina,
      edadMin: Number(edadMin),
      edadMax: Number(edadMax),
      genero,
      sedeId,
      entrenador,
      capacidad: Number(capacidad),
      costoMensual: Number(costoMensual),
      jugadores: 0,
    });

    setNombre("");
    setOpenCreate(false);
    toast.success("Categoría registrada con éxito");
    setCategoriesList(RendimientoStore.getCategorias());
    router.invalidate();
  };

  return (
    <div className="space-y-6">
      {/* Pestañas Dashboard Estructura */}
      <div className="flex items-center gap-1.5 border-b pb-3">
        <Link
          to="/equipos"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          👥 Equipos
        </Link>
        <Link
          to="/categorias"
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground shadow-sm"
        >
          🏷️ Categorías
        </Link>
        <Link
          to="/disciplinas"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          ⚽ Disciplinas
        </Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estructura Deportiva</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} categorías deportivas registradas.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="bg-gradient-primary shadow-elegant">
          <Plus className="h-4 w-4 mr-1.5" /> Nueva categoría
        </Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar categoría..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={disc} onValueChange={setDisc}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las disciplinas</SelectItem>
              {disciplinas.map((d) => <SelectItem key={d.id} value={d.nombre}>{d.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sede} onValueChange={setSede}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las sedes</SelectItem>
              {sedes.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const dynamicJugadores = activePlayers.filter((p) => p.categoria === c.nombre).length;
          const pct = Math.round((dynamicJugadores / c.capacidad) * 100);
          const full = pct >= 95;
          return (
            <Card key={c.id} className="shadow-card hover:shadow-elegant transition group">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.disciplina}</p>
                    <h3 className="font-semibold leading-tight">{c.nombre}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={full ? "destructive" : "secondary"}>{full ? "Lleno" : "Disponible"}</Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleOpenEdit(c)} title="Editar categoría">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDeleteCategory(c.id, c.nombre)} title="Eliminar categoría">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Edad</p><p className="font-medium text-foreground">{c.edadMin}–{c.edadMax} años</p></div>
                  <div><p className="text-muted-foreground">Género</p><p className="font-medium text-foreground">{c.genero}</p></div>
                  <div><p className="text-muted-foreground">Entrenador</p><p className="font-medium text-foreground truncate" title={c.entrenador}>{c.entrenador}</p></div>
                  <div><p className="text-muted-foreground">Sede</p><p className="font-medium text-foreground">{sedes.find((s) => s.id === c.sedeId)?.nombre}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Mensualidad</p><p className="font-semibold text-primary">₡{(c.costoMensual ?? 30000).toLocaleString()}</p></div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Ocupación</span>
                    <span className="font-medium">{dynamicJugadores}/{c.capacidad}</span>
                  </div>
                  <Progress value={pct} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog para Nueva Categoría */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[480px] bg-background border shadow-elegant">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FolderKanban className="h-5 w-5 text-primary" /> Crear Nueva Categoría
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define los parámetros deportivos y asigna un entrenador a la nueva categoría.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Nombre de la Categoría *</Label>
              <Input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Sub-14 Fútbol Masculino"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Disciplina</Label>
                <select
                  value={disciplina}
                  onChange={e => {
                    setDisciplina(e.target.value);
                    // Autofill default coach for discipline
                    const found = coaches.find(co => co.disciplinas.includes(e.target.value));
                    if (found) setEntrenador(found.nombre);
                  }}
                  className="h-10 px-3 rounded-md border bg-card text-sm"
                >
                  <option value="Fútbol">Fútbol</option>
                  <option value="Baloncesto">Baloncesto</option>
                  <option value="Natación">Natación</option>
                  <option value="Voleibol">Voleibol</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Género</Label>
                <select
                  value={genero}
                  onChange={e => setGenero(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-card text-sm"
                >
                  <option value="Mixto">Mixto</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Edad Mínima</Label>
                <Input
                  type="number"
                  value={edadMin}
                  onChange={e => setEdadMin(Number(e.target.value))}
                  min={4}
                  max={40}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Edad Máxima</Label>
                <Input
                  type="number"
                  value={edadMax}
                  onChange={e => setEdadMax(Number(e.target.value))}
                  min={4}
                  max={40}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Capacidad</Label>
                <Input
                  type="number"
                  value={capacidad}
                  onChange={e => setCapacidad(Number(e.target.value))}
                  min={5}
                  max={100}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Mensualidad (₡)</Label>
                <Input
                  type="number"
                  value={costoMensual}
                  onChange={e => setCostoMensual(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Entrenador Responsable</Label>
              <select
                value={entrenador}
                onChange={e => setEntrenador(e.target.value)}
                className="h-10 px-3 rounded-md border bg-card text-sm text-foreground"
              >
                <option value="Sin asignar">Sin asignar</option>
                {coaches.map(co => (
                  <option key={co.id} value={co.nombre}>
                    {co.nombre} ({co.especialidad})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">
                Selecciona al entrenador responsable de planificar las sesiones y dirigir este grupo.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Sede</Label>
              <select
                value={sedeId}
                onChange={e => setSedeId(e.target.value)}
                className="h-10 px-3 rounded-md border bg-card text-sm"
              >
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-primary">Crear Categoría</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Categoría */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[480px] bg-background border shadow-elegant">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FolderKanban className="h-5 w-5 text-primary" /> Editar Categoría
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifica los parámetros de la categoría seleccionada.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateCategory} className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Nombre de la Categoría *</Label>
              <Input
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                placeholder="Ej. Sub-14 Fútbol Masculino"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Disciplina</Label>
                <select
                  value={editDisciplina}
                  onChange={e => {
                    setEditDisciplina(e.target.value);
                    const found = coaches.find(co => co.disciplinas.includes(e.target.value));
                    if (found) setEditEntrenador(found.nombre);
                  }}
                  className="h-10 px-3 rounded-md border bg-card text-sm"
                >
                  <option value="Fútbol">Fútbol</option>
                  <option value="Baloncesto">Baloncesto</option>
                  <option value="Natación">Natación</option>
                  <option value="Voleibol">Voleibol</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Género</Label>
                <select
                  value={editGenero}
                  onChange={e => setEditGenero(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-card text-sm"
                >
                  <option value="Mixto">Mixto</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Edad Mínima</Label>
                <Input
                  type="number"
                  value={editEdadMin}
                  onChange={e => setEditEdadMin(Number(e.target.value))}
                  min={4}
                  max={40}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Edad Máxima</Label>
                <Input
                  type="number"
                  value={editEdadMax}
                  onChange={e => setEditEdadMax(Number(e.target.value))}
                  min={4}
                  max={40}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Capacidad</Label>
                <Input
                  type="number"
                  value={editCapacidad}
                  onChange={e => setEditCapacidad(Number(e.target.value))}
                  min={5}
                  max={100}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Mensualidad (₡)</Label>
                <Input
                  type="number"
                  value={editCostoMensual}
                  onChange={e => setEditCostoMensual(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Entrenador Responsable</Label>
              <select
                value={editEntrenador}
                onChange={e => setEditEntrenador(e.target.value)}
                className="h-10 px-3 rounded-md border bg-card text-sm text-foreground"
              >
                <option value="Sin asignar">Sin asignar</option>
                {coaches.map(co => (
                  <option key={co.id} value={co.nombre}>
                    {co.nombre} ({co.especialidad})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Sede</Label>
              <select
                value={editSedeId}
                onChange={e => setEditSedeId(e.target.value)}
                className="h-10 px-3 rounded-md border bg-card text-sm"
              >
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-primary">Guardar Cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
