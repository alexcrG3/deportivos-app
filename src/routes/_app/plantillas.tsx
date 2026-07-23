import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trainingTemplates as initialTemplates } from "@/lib/mock-data";
import { LayoutTemplate, Copy, Share2, Plus, Clock, Layers, User, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import { CoachOsBanner } from "@/components/coach-os-banner";

export const Route = createFileRoute("/_app/plantillas")({ component: PlantillasPage });

interface Template {
  id: string;
  nombre: string;
  duracion: number;
  bloques: number;
  usos: number;
  autor: string;
  compartida: boolean;
  categoria: string;
}

function PlantillasPage() {
  const { role, coachName, selectedCoachId, selectedCoachName } = useRole();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  const [newForm, setNewForm] = useState({
    nombre: "",
    categoria: "Técnico",
    autor: "Admin Demo",
    duracion: 60,
    bloques: 5,
    compartida: false,
  });

  // Load from Supabase (plantillas_entrenamiento)
  const loadPlantillas = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    let query = supabase
      .from("plantillas_entrenamiento")
      .select("*")
      .eq("organizacion_id", orgId);

    // Filter by coach's name as autor when admin has selected a coach
    if (role === "admin" && selectedCoachName) {
      query = query.eq("autor", selectedCoachName);
    } else if (role === "coach" && coachName) {
      query = query.eq("autor", coachName);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      setTemplates(initialTemplates as Template[]);
      return;
    }
    const mapped: Template[] = data.map((t: any) => ({
      id: t.id,
      nombre: t.nombre,
      duracion: t.duracion || 60,
      bloques: t.bloques || 5,
      usos: t.usos || 0,
      autor: t.autor || "",
      compartida: t.compartida ?? false,
      categoria: t.categoria || "General",
    }));
    setTemplates(mapped);
  };

  useEffect(() => {
    loadPlantillas();
  }, [selectedCoachId, role]);

  const saveToStorage = async (updatedList: Template[]) => {
    setTemplates(updatedList);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    for (const t of updatedList) {
      await supabase.from("plantillas_entrenamiento").upsert({
        id: t.id,
        nombre: t.nombre,
        duracion: t.duracion,
        bloques: t.bloques,
        usos: t.usos,
        autor: t.autor,
        compartida: t.compartida,
        categoria: t.categoria,
        organizacion_id: orgId,
      });
    }
  };

  const handleUseTemplate = (tpl: Template) => {
    const updated = templates.map(t => {
      if (t.id === tpl.id) {
        return { ...t, usos: t.usos + 1 };
      }
      return t;
    });
    saveToStorage(updated);
    toast.success(`¡Plantilla "${tpl.nombre}" cargada exitosamente en la sesión activa!`);
  };

  const handleDuplicate = (tpl: Template) => {
    const newTpl: Template = {
      ...tpl,
      id: `tpl_${Date.now()}`,
      nombre: `${tpl.nombre} (Copia)`,
      usos: 0,
    };
    const updated = [newTpl, ...templates];
    saveToStorage(updated);
    toast.success(`¡Copia de "${tpl.nombre}" creada con éxito!`);
  };

  const handleToggleShare = (tpl: Template) => {
    const updated = templates.map(t => {
      if (t.id === tpl.id) {
        const nextShare = !t.compartida;
        toast.info(nextShare ? `Plantilla "${t.nombre}" ahora es pública y compartida` : `Plantilla "${t.nombre}" ahora es privada`);
        return { ...t, compartida: nextShare };
      }
      return t;
    });
    saveToStorage(updated);
  };

  const handleDelete = (id: string, nombre: string) => {
    const updated = templates.filter(t => t.id !== id);
    saveToStorage(updated);
    toast.success(`Plantilla "${nombre}" eliminada correctamente.`);
  };

  const handleCreateTemplate = () => {
    if (!newForm.nombre.trim()) {
      toast.error("El nombre de la plantilla es obligatorio.");
      return;
    }
    const newTpl: Template = {
      id: `tpl_${Date.now()}`,
      nombre: newForm.nombre,
      categoria: newForm.categoria,
      autor: newForm.autor,
      duracion: newForm.duracion,
      bloques: newForm.bloques,
      compartida: newForm.compartida,
      usos: 0,
    };

    const updated = [newTpl, ...templates];
    saveToStorage(updated);
    setIsOpenCreate(false);
    setNewForm({
      nombre: "",
      categoria: "Técnico",
      autor: "Admin Demo",
      duracion: 60,
      bloques: 5,
      compartida: false,
    });
    toast.success("¡Nueva plantilla de entrenamiento guardada!");
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    if (!editingTemplate.nombre.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    const updated = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
    saveToStorage(updated);
    setEditingTemplate(null);
    toast.success("¡Plantilla actualizada correctamente!");
  };

  return (
    <div className="space-y-6">
      <CoachOsBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plantillas</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" && selectedCoachName
              ? `Plantillas de ${selectedCoachName}`
              : "Sesiones guardadas para reutilizar y compartir."}
          </p>
        </div>
        <Button onClick={() => setIsOpenCreate(true)}>
          <Plus className="mr-1 h-4 w-4" />Nueva plantilla
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} className="shadow-card transition-all hover:shadow-elegant hover:-translate-y-0.5 bg-card border-border">
            <CardHeader className="flex-row items-start justify-between space-y-0 p-4 pb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5">
                {t.compartida && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">Compartida</Badge>}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                  onClick={() => setEditingTemplate(t)}
                  title="Editar plantilla"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg"
                  onClick={() => handleDelete(t.id, t.nombre)}
                  title="Eliminar plantilla"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3">
              <div>
                <CardTitle className="text-base text-foreground font-semibold">{t.nombre}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground uppercase font-bold tracking-wide">{t.categoria}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.duracion} min</span>
                <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{t.bloques} bloques</span>
                <span className="flex items-center gap-1 font-semibold">{t.usos} usos</span>
              </div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" />{t.autor}</p>
              <div className="flex gap-1 pt-1">
                <Button 
                  size="sm" 
                  className="flex-1 bg-primary text-white hover:bg-primary/95 text-xs font-bold"
                  onClick={() => handleUseTemplate(t)}
                >
                  Usar plantilla
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => handleDuplicate(t)}
                  title="Duplicar"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`h-8 w-8 p-0 ${t.compartida ? "text-primary hover:bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  onClick={() => handleToggleShare(t)}
                  title={t.compartida ? "Hacer privada" : "Compartir"}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Template Modal */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-primary" /> Crear Nueva Plantilla
              </CardTitle>
              <button 
                onClick={() => setIsOpenCreate(false)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre de la Plantilla *</label>
                <input 
                  type="text" 
                  value={newForm.nombre}
                  onChange={e => setNewForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="E.g. Tácticas defensivas 45min"
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Categoría *</label>
                  <select 
                    value={newForm.categoria}
                    onChange={e => setNewForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {["Universal", "Físico", "Técnico", "Táctico", "Recuperación", "Porteros"].map(cat => (
                      <option key={cat} value={cat} className="text-foreground bg-background">{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Autor *</label>
                  <input 
                    type="text" 
                    value={newForm.autor}
                    onChange={e => setNewForm(f => ({ ...f, autor: e.target.value }))}
                    placeholder="Entrenador"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Duración (min) *</label>
                  <input 
                    type="number" 
                    value={newForm.duracion}
                    onChange={e => setNewForm(f => ({ ...f, duracion: parseInt(e.target.value) || 0 }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Bloques *</label>
                  <input 
                    type="number" 
                    value={newForm.bloques}
                    onChange={e => setNewForm(f => ({ ...f, bloques: parseInt(e.target.value) || 0 }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="compartida" 
                  checked={newForm.compartida}
                  onChange={e => setNewForm(f => ({ ...f, compartida: e.target.checked }))}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="compartida" className="text-xs text-foreground cursor-pointer select-none">Compartir con el equipo</label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleCreateTemplate}
                >
                  Guardar Plantilla
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

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" /> Editar Plantilla de Entrenamiento
              </CardTitle>
              <button 
                onClick={() => setEditingTemplate(null)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre de la Plantilla *</label>
                <input 
                  type="text" 
                  value={editingTemplate.nombre}
                  onChange={e => setEditingTemplate(prev => prev ? { ...prev, nombre: e.target.value } : null)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Categoría *</label>
                  <select 
                    value={editingTemplate.categoria}
                    onChange={e => setEditingTemplate(prev => prev ? { ...prev, categoria: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    {["Universal", "Físico", "Técnico", "Táctico", "Recuperación", "Porteros"].map(cat => (
                      <option key={cat} value={cat} className="text-foreground bg-background">{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Autor *</label>
                  <input 
                    type="text" 
                    value={editingTemplate.autor}
                    onChange={e => setEditingTemplate(prev => prev ? { ...prev, autor: e.target.value } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Duración (min) *</label>
                  <input 
                    type="number" 
                    value={editingTemplate.duracion}
                    onChange={e => setEditingTemplate(prev => prev ? { ...prev, duracion: parseInt(e.target.value) || 0 } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Bloques *</label>
                  <input 
                    type="number" 
                    value={editingTemplate.bloques}
                    onChange={e => setEditingTemplate(prev => prev ? { ...prev, bloques: parseInt(e.target.value) || 0 } : null)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="edit_compartida" 
                  checked={editingTemplate.compartida}
                  onChange={e => setEditingTemplate(prev => prev ? { ...prev, compartida: e.target.checked } : null)}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="edit_compartida" className="text-xs text-foreground cursor-pointer select-none">Compartir con el equipo</label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleUpdateTemplate}
                >
                  Guardar Cambios
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs" 
                  onClick={() => setEditingTemplate(null)}
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

export default PlantillasPage;
