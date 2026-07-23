import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { instalaciones as initialInstalaciones, sedes } from "@/lib/mock-data";
import { Plus, MapPin, Users, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/instalaciones")({ component: InstalacionesPage });

interface Facility {
  id: string;
  nombre: string;
  tipo: string;
  sedeId: string;
  capacidad: number;
  estado: "Disponible" | "Mantenimiento";
  uso: number;
}

function InstalacionesPage() {
  const [list, setList] = useState<Facility[]>([]);
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<Facility | null>(null);

  // Form states
  const [form, setForm] = useState({
    nombre: "",
    tipo: "Cancha de fútbol",
    sedeId: sedes[0]?.id || "",
    capacidad: 30,
    estado: "Disponible" as Facility["estado"],
    uso: 50,
  });

  const loadInstalaciones = () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase
      .from("instalaciones")
      .select("*")
      .eq("organizacion_id", orgId)
      .then(({ data, error }) => {
        if (error) {
          toast.error("Error al cargar instalaciones de Supabase");
        } else if (data) {
          setList(data.map((i: any) => ({
            id: i.id,
            nombre: i.nombre,
            tipo: i.tipo || "Cancha de fútbol",
            sedeId: sedes[0]?.id || "",
            capacidad: i.capacidad || 30,
            estado: "Disponible",
            uso: 40,
          })));
        }
      });
  };

  useEffect(() => {
    loadInstalaciones();
  }, []);

  const handleCreate = () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre de la instalación es obligatorio.");
      return;
    }
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const newRecord = {
      nombre: form.nombre,
      tipo: form.tipo,
      capacidad: form.capacidad,
      ubicacion: "Ubicación Principal",
      organizacion_id: orgId,
    };

    supabase
      .from("instalaciones")
      .insert([newRecord])
      .then(({ error }) => {
        if (error) {
          toast.error("Error al registrar en Supabase");
        } else {
          toast.success("¡Nueva instalación deportiva agregada!");
          loadInstalaciones();
          setIsOpenCreate(false);
          setForm({
            nombre: "",
            tipo: "Cancha de fútbol",
            sedeId: sedes[0]?.id || "",
            capacidad: 30,
            estado: "Disponible",
            uso: 50,
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
      .from("instalaciones")
      .update({
        nombre: editingItem.nombre,
        tipo: editingItem.tipo,
        capacidad: editingItem.capacidad
      })
      .eq("id", editingItem.id)
      .then(({ error }) => {
        if (error) {
          toast.error("Error al actualizar en Supabase");
        } else {
          toast.success("¡Instalación actualizada correctamente!");
          loadInstalaciones();
          setEditingItem(null);
        }
      });
  };

  const handleDelete = (id: string, name: string) => {
    supabase
      .from("instalaciones")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          toast.error("Error al eliminar de Supabase");
        } else {
          toast.success(`Instalación "${name}" eliminada.`);
          loadInstalaciones();
        }
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Instalaciones</h1>
          <p className="text-sm text-muted-foreground">Canchas, gimnasios, piscinas y áreas deportivas.</p>
        </div>
        <Button onClick={() => setIsOpenCreate(true)} className="bg-gradient-primary shadow-elegant">
          <Plus className="h-4 w-4 mr-1" /> Nueva instalación
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((f) => {
          const disponible = f.estado === "Disponible";
          return (
            <Card key={f.id} className="shadow-card hover:shadow-elegant transition bg-card border-border">
              <CardHeader className="flex-row items-start justify-between space-y-0 p-4">
                <div>
                  <CardTitle className="text-base text-foreground font-semibold">{f.nombre}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{f.tipo}</CardDescription>
                </div>
                <Badge variant={disponible ? "secondary" : "outline"} className={disponible ? "bg-success/15 text-success border-success/20 text-[10px]" : "bg-warning/20 text-warning-foreground border-warning/30 text-[10px]"}>
                  {f.estado}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {sedes.find((s) => s.id === f.sedeId)?.nombre || "Sede Desconocida"}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5 text-primary" /> Capacidad {f.capacidad} deportistas
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Uso semanal</span>
                    <span className="font-semibold text-foreground">{f.uso}%</span>
                  </div>
                  <Progress value={f.uso} className="h-1.5" />
                </div>
                
                <div className="flex gap-1.5 pt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-grow text-xs border-border"
                    onClick={() => setEditingItem(f)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg border border-transparent"
                    onClick={() => handleDelete(f.id, f.nombre)}
                    title="Eliminar instalación"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Modal */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Registrar Nueva Instalación
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
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre de la Instalación *</label>
                <input 
                  type="text" 
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="E.g. Cancha Auxiliar B, Gimnasio Oeste"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo *</label>
                  <select 
                    value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {["Cancha de fútbol", "Gimnasio cubierto", "Piscina", "Cancha de baloncesto", "Cancha de tenis", "Sala fitness"].map(t => (
                      <option key={t} value={t} className="bg-background text-foreground">{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Sede Asignada *</label>
                  <select 
                    value={form.sedeId}
                    onChange={e => setForm(f => ({ ...f, sedeId: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {sedes.map(s => (
                      <option key={s.id} value={s.id} className="bg-background text-foreground">{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Capacidad *</label>
                  <input 
                    type="number" 
                    value={form.capacidad}
                    onChange={e => setForm(f => ({ ...f, capacidad: parseInt(e.target.value) || 0 }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado</label>
                  <select 
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value as Facility["estado"] }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="Disponible" className="bg-background text-foreground">Disponible</option>
                    <option value="Mantenimiento" className="bg-background text-foreground">Mantenimiento</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Uso (%)</label>
                  <input 
                    type="number" 
                    value={form.uso}
                    onChange={e => setForm(f => ({ ...f, uso: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleCreate}
                >
                  Guardar Instalación
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
                <Edit2 className="h-5 w-5 text-primary" /> Editar Instalación
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
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre de la Instalación *</label>
                <input 
                  type="text" 
                  value={editingItem.nombre}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo *</label>
                  <select 
                    value={editingItem.tipo}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, tipo: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {["Cancha de fútbol", "Gimnasio cubierto", "Piscina", "Cancha de baloncesto", "Cancha de tenis", "Sala fitness"].map(t => (
                      <option key={t} value={t} className="bg-background text-foreground">{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Sede Asignada *</label>
                  <select 
                    value={editingItem.sedeId}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, sedeId: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {sedes.map(s => (
                      <option key={s.id} value={s.id} className="bg-background text-foreground">{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Capacidad *</label>
                  <input 
                    type="number" 
                    value={editingItem.capacidad}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, capacidad: parseInt(e.target.value) || 0 } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado</label>
                  <select 
                    value={editingItem.estado}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, estado: e.target.value as Facility["estado"] } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="Disponible" className="bg-background text-foreground">Disponible</option>
                    <option value="Mantenimiento" className="bg-background text-foreground">Mantenimiento</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Uso (%)</label>
                  <input 
                    type="number" 
                    value={editingItem.uso}
                    onChange={e => setEditingItem(prev => prev ? { ...prev, uso: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                  />
                </div>
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

export default InstalacionesPage;
