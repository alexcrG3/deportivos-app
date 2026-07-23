import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { disciplinas as initialDisciplinas } from "@/lib/mock-data";
import { Plus, Search, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/disciplinas")({ component: DisciplinasPage });

interface Discipline {
  id: string;
  nombre: string;
  activos: number;
  categorias: number;
  sedes: number;
  entrenadores: number;
  color: string;
  icono: string;
}

function DisciplinasPage() {
  const [list, setList] = useState<Discipline[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<Discipline | null>(null);

  // Form states
  const [form, setForm] = useState({
    nombre: "",
    icono: "⚽",
    color: "#6366f1",
    categorias: 3,
    sedes: 2,
    entrenadores: 2,
    activos: 0,
  });

  // Load from Supabase
  const loadDisciplinas = () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase
      .from("disciplinas")
      .select("*")
      .eq("organizacion_id", orgId)
      .then(({ data, error }) => {
        if (error) {
          toast.error("Error al cargar disciplinas de Supabase");
        } else if (data) {
          setList(data.map((d: any) => ({
            id: d.id,
            nombre: d.nombre,
            icono: d.icono || "⚽",
            color: d.color || "#6366f1",
            categorias: d.categorias !== undefined && d.categorias !== null ? d.categorias : 0,
            sedes: d.sedes !== undefined && d.sedes !== null ? d.sedes : 0,
            entrenadores: d.entrenadores !== undefined && d.entrenadores !== null ? d.entrenadores : 0,
            activos: d.activos !== undefined && d.activos !== null ? d.activos : 0,
          })));
        }
      });
  };

  useEffect(() => {
    loadDisciplinas();
  }, []);

  const handleCreate = () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre de la disciplina es obligatorio.");
      return;
    }
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const newRecord = {
      id: "d-" + Math.random().toString(36).substring(2, 11),
      nombre: form.nombre,
      icono: form.icono,
      color: form.color,
      categorias: 0,
      sedes: 0,
      entrenadores: 0,
      activos: 0,
      organizacion_id: orgId,
    };

    supabase
      .from("disciplinas")
      .insert([newRecord])
      .then(({ error }) => {
        if (error) {
          toast.error("Error al registrar disciplina en Supabase");
        } else {
          toast.success("¡Nueva disciplina registrada con éxito!");
          loadDisciplinas();
          setIsOpenCreate(false);
          setForm({
            nombre: "",
            icono: "⚽",
            color: "#6366f1",
            categorias: 3,
            sedes: 2,
            entrenadores: 2,
            activos: 0,
          });
        }
      });
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    if (!editingItem.nombre.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    supabase
      .from("disciplinas")
      .update({ nombre: editingItem.nombre })
      .eq("id", editingItem.id)
      .then(({ error }) => {
        if (error) {
          toast.error("Error al actualizar en Supabase");
        } else {
          toast.success("¡Disciplina actualizada correctamente!");
          loadDisciplinas();
          setEditingItem(null);
        }
      });
  };

  const handleDelete = (id: string, name: string) => {
    supabase
      .from("disciplinas")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          toast.error("Error al eliminar de Supabase");
        } else {
          toast.success(`Disciplina "${name}" eliminada.`);
          loadDisciplinas();
        }
      });
  };

  const filteredList = useMemo(() => {
    return list.filter(item => 
      item.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [list, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Disciplinas</h1>
          <p className="text-sm text-muted-foreground">Administra las disciplinas deportivas de la academia.</p>
        </div>
        <Button onClick={() => setIsOpenCreate(true)} className="bg-gradient-primary shadow-elegant">
          <Plus className="h-4 w-4 mr-1" /> Nueva disciplina
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Buscar disciplina..." 
          className="pl-9 bg-background border-input text-foreground"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No se encontraron disciplinas.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredList.map((d) => (
            <Card key={d.id} className="shadow-card group hover:shadow-elegant transition-all duration-200 hover:-translate-y-0.5 bg-card border-border">
              <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-card shrink-0" style={{ background: `color-mix(in oklab, ${d.color} 15%, transparent)` }}>
                  {d.icono}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-bold text-foreground truncate">{d.nombre}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{d.activos} jugadores activos</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 p-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/50 p-2 border border-border/30">
                    <p className="text-sm font-semibold text-foreground">{d.categorias}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Categorías</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 border border-border/30">
                    <p className="text-sm font-semibold text-foreground">{d.sedes}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Sedes</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 border border-border/30">
                    <p className="text-sm font-semibold text-foreground">{d.entrenadores}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Coaches</p>
                  </div>
                </div>
                
                <div className="flex gap-1.5 pt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs border-border"
                    onClick={() => setEditingItem(d)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg border border-transparent"
                    onClick={() => handleDelete(d.id, d.nombre)}
                    title="Eliminar disciplina"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Registrar Nueva Disciplina
              </CardTitle>
              <button 
                onClick={() => setIsOpenCreate(false)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre de la Disciplina *</label>
                <input 
                  type="text" 
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="E.g. Fútbol, Baloncesto, Natación"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Icono (Emoji) *</label>
                  <select 
                    value={form.icono}
                    onChange={e => setForm(f => ({ ...f, icono: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {["⚽", "🏀", "🏊", "🏐", "🎾", "🏈", "🥋", "🏃", "🏸"].map(icon => (
                      <option key={icon} value={icon} className="bg-background text-foreground">{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Color de Marca *</label>
                  <input 
                    type="color" 
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full h-9 p-1 rounded-lg border border-input bg-background outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Categorías</label>
                  <input 
                    type="number" 
                    value={form.categorias}
                    onChange={e => setForm(f => ({ ...f, categorias: parseInt(e.target.value) || 0 }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Sedes</label>
                  <input 
                    type="number" 
                    value={form.sedes}
                    onChange={e => setForm(f => ({ ...f, sedes: parseInt(e.target.value) || 0 }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Coaches</label>
                  <input 
                    type="number" 
                    value={form.entrenadores}
                    onChange={e => setForm(f => ({ ...f, entrenadores: parseInt(e.target.value) || 0 }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Jugadores Activos Iniciales</label>
                <input 
                  type="number" 
                  value={form.activos}
                  onChange={e => setForm(f => ({ ...f, activos: parseInt(e.target.value) || 0 }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleCreate}
                >
                  Guardar Disciplina
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs" 
                  onClick={() => setIsOpenCreate(false)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-primary" /> Editar Disciplina
              </CardTitle>
              <button 
                onClick={() => setEditingItem(null)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre de la Disciplina *</label>
                <input 
                  type="text" 
                  value={editingItem.nombre}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Icono (Emoji) *</label>
                  <select 
                    value={editingItem.icono}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, icono: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {["⚽", "🏀", "🏊", "🏐", "🎾", "🏈", "🥋", "🏃", "🏸"].map(icon => (
                      <option key={icon} value={icon} className="bg-background text-foreground">{icon}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Color de Marca *</label>
                  <input 
                    type="color" 
                    value={editingItem.color}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, color: e.target.value } : null)}
                    className="w-full h-9 p-1 rounded-lg border border-input bg-background outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Categorías</label>
                  <input 
                    type="number" 
                    value={editingItem.categorias}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, categorias: parseInt(e.target.value) || 0 } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Sedes</label>
                  <input 
                    type="number" 
                    value={editingItem.sedes}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, sedes: parseInt(e.target.value) || 0 } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">Coaches</label>
                  <input 
                    type="number" 
                    value={editingItem.entrenadores}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, entrenadores: parseInt(e.target.value) || 0 } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Jugadores Activos</label>
                <input 
                  type="number" 
                  value={editingItem.activos}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, activos: parseInt(e.target.value) || 0 } : null)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleUpdate}
                >
                  Guardar Cambios
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs" 
                  onClick={() => setEditingItem(null)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default DisciplinasPage;
