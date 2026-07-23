import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/stat-card";
import { trofeos } from "@/lib/mock-data";
import { CalendarRange, Trophy, Copy, Archive, Plus, Users, ClipboardCheck } from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";
import { toast } from "sonner";

import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_app/temporadas")({ component: TemporadasPage });

const estadoMeta: Record<string, { label: string; className: string }> = {
  activa: { label: "Activa", className: "bg-success/15 text-success" },
  cerrada: { label: "Cerrada", className: "bg-muted text-muted-foreground" },
  archivada: { label: "Archivada", className: "bg-warning/15 text-warning" },
};

function TemporadasPage() {
  const { role, selectedCoachId, selectedCoachName } = useRole();
  const [temporadasList, setTemporadasList] = useState<any[]>([]);
  const [competicionesList, setCompeticionesList] = useState<any[]>([]);
  const [sel, setSel] = useState<any>(null);
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);

  // Form state
  const [form, setForm] = useState({
    nombre: "",
    inicio: new Date().toISOString().slice(0, 10),
    fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    sedes: 1,
    equipos: 0,
    disciplinas: "Fútbol, Baloncesto",
    estado: "activa"
  });

  const [editForm, setEditForm] = useState({
    id: "",
    nombre: "",
    inicio: "",
    fin: "",
    sedes: 1,
    equipos: 0,
    disciplinas: "",
    estado: "activa"
  });

  const handleOpenEdit = () => {
    if (!sel) return;
    setEditForm({
      id: sel.id,
      nombre: sel.nombre,
      inicio: sel.inicio,
      fin: sel.fin,
      sedes: sel.sedes,
      equipos: sel.equipos,
      disciplinas: Array.isArray(sel.disciplinas) ? sel.disciplinas.join(", ") : (sel.disciplinas || ""),
      estado: sel.estado
    });
    setIsOpenEdit(true);
  };

  const handleUpdateTemporada = () => {
    if (!editForm.nombre.trim()) {
      toast.error("El nombre de la temporada es obligatorio.");
      return;
    }
    RendimientoStore.updateTemporada(editForm.id, {
      nombre: editForm.nombre,
      inicio: editForm.inicio,
      fin: editForm.fin,
      sedes: Number(editForm.sedes),
      equipos: Number(editForm.equipos),
      disciplinas: editForm.disciplinas.split(",").map(d => d.trim()).filter(Boolean),
      estado: editForm.estado
    });
    toast.success("¡Temporada actualizada con éxito!");
    setIsOpenEdit(false);
    loadData();
  };

  const handleDelete = () => {
    if (!sel) return;
    if (confirm(`¿Estás seguro de que deseas eliminar la temporada "${sel.nombre}"? Esta acción no se puede deshacer.`)) {
      RendimientoStore.deleteTemporada(sel.id);
      toast.success("Temporada eliminada con éxito");
      loadData();
    }
  };

  const loadData = () => {
    const list = RendimientoStore.getTemporadas();
    setTemporadasList(list);
    if (list.length > 0) {
      setSel(prev => {
        const stillExists = list.find(t => t.id === prev?.id);
        return stillExists || list[0];
      });
    } else {
      setSel(null);
    }
    setCompeticionesList(RendimientoStore.getCompeticiones());
  };

  useEffect(() => {
    const init = async () => {
      if (!RendimientoStore.isStoreSynced()) {
        await RendimientoStore.syncFromSupabase();
      }
      loadData();
    };
    init();
  }, []);

  const compsTemp = useMemo(() => {
    if (!sel) return [];
    return competicionesList.filter((c) => c.temporadaId === sel.id || c.temporadaId === sel.nombre);
  }, [sel, competicionesList]);

  const trofeosTemp = useMemo(() => {
    if (!sel) return [];
    return trofeos.filter((t) => t.temporada === (sel.nombre || "").replace("Temporada ", ""));
  }, [sel]);

  const handleCreateTemporada = () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre de la temporada es obligatorio.");
      return;
    }

    const newTemp = RendimientoStore.addTemporada({
      nombre: form.nombre,
      inicio: form.inicio,
      fin: form.fin,
      sedes: Number(form.sedes),
      equipos: Number(form.equipos),
      disciplinas: form.disciplinas.split(",").map(d => d.trim()),
      estado: form.estado
    });

    toast.success("¡Nueva temporada deportiva creada!");
    setIsOpenCreate(false);
    setForm(f => ({ ...f, nombre: "" }));
    loadData();
    setSel(newTemp);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Temporadas</h1>
          <p className="text-sm text-muted-foreground">Gestión completa de temporadas deportivas.</p>
        </div>
        {role !== "padres" && (
          <Button onClick={() => setIsOpenCreate(true)}>
            <Plus className="mr-1 h-4 w-4" />Nueva temporada
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarRange} label="Temporadas" value={temporadasList.length.toString()} hint="registradas" accent="primary" />
        <StatCard icon={Trophy} label="Activas" value={temporadasList.filter((t) => t.estado === "activa").length.toString()} hint="en curso" accent="success" />
        <StatCard icon={Users} label="Equipos" value={temporadasList.reduce((a, t) => a + (Number(t.equipos) || 0), 0).toString()} hint="inscritos histórico" accent="primary" />
        <StatCard icon={Trophy} label="Trofeos" value={trofeos.length.toString()} hint="históricos" accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
        <div className="space-y-2">
          {temporadasList.map((t) => (
            <button key={t.id} onClick={() => setSel(t)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${sel?.id === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{t.nombre}</p>
                <Badge variant="secondary" className={estadoMeta[t.estado]?.className || "bg-muted text-muted-foreground"}>
                  {estadoMeta[t.estado]?.label || t.estado}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t.inicio} → {t.fin}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.equipos} equipos · {Array.isArray(t.disciplinas) ? t.disciplinas.length : 0} disciplinas
              </p>
            </button>
          ))}
          {temporadasList.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground border-2 border-dashed rounded-xl">
              No hay temporadas deportivas creadas.
            </div>
          )}
        </div>

        {sel ? (
          <Card className="shadow-card bg-card border-border">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground"><CalendarRange className="h-5 w-5 text-primary" />{sel.nombre}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground pt-0.5">{sel.inicio} – {sel.fin} · {sel.sedes} sedes</CardDescription>
                </div>
                {role !== "padres" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs border-primary/30 text-primary hover:bg-primary/5 font-semibold" onClick={handleOpenEdit}>
                      Editar
                    </Button>
                    <Button size="sm" variant="destructive" className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold" onClick={handleDelete}>
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Disciplinas Asociadas</p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(sel.disciplinas) ? (
                    sel.disciplinas.map((d: string) => <Badge key={d} variant="outline" className="text-xs">{d}</Badge>)
                  ) : (
                    <span className="text-xs text-muted-foreground">Ninguna disciplina asignada</span>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Competiciones en esta Temporada ({compsTemp.length})</p>
                <div className="space-y-2">
                  {compsTemp.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-xl border border-border p-2.5 text-xs bg-muted/5">
                      <div>
                        <p className="font-bold text-foreground">{c.nombre}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{c.tipo} · {c.categoria} · {c.jornadas} jornadas</p>
                      </div>
                      <Badge variant="secondary" className={c.estado === "en_curso" ? "bg-success/15 text-success" : ""}>{c.estado}</Badge>
                    </div>
                  ))}
                  {compsTemp.length === 0 && <p className="text-xs text-muted-foreground py-2">Sin competiciones registradas en esta temporada.</p>}
                </div>
              </div>

              {trofeosTemp.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Campeones Históricos</p>
                  <div className="space-y-2">
                    {trofeosTemp.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 rounded-xl border border-border p-2.5 text-xs bg-muted/5">
                        <Trophy className="h-4 w-4 text-warning" />
                        <span className="font-bold text-foreground">{t.equipo}</span>
                        <span className="text-xs text-muted-foreground">— {t.competicion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card flex items-center justify-center p-8 bg-card border-border border-2 border-dashed">
            <p className="text-sm text-muted-foreground">No hay ninguna temporada seleccionada o creada.</p>
          </Card>
        )}
      </div>

      {/* Modal Nueva Temporada */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-primary" /> Nueva Temporada
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
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre de la Temporada *</label>
                <Input 
                  placeholder="Ej: Temporada 2027 o Torneo 2026/27"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Inicio *</label>
                  <input 
                    type="date" 
                    value={form.inicio}
                    onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Fin *</label>
                  <input 
                    type="date" 
                    value={form.fin}
                    onChange={e => setForm(f => ({ ...f, fin: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Sedes</label>
                  <Input 
                    type="number"
                    value={form.sedes}
                    onChange={e => setForm(f => ({ ...f, sedes: Number(e.target.value) }))}
                    className="bg-background border-input text-foreground h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Equipos</label>
                  <Input 
                    type="number"
                    value={form.equipos}
                    onChange={e => setForm(f => ({ ...f, equipos: Number(e.target.value) }))}
                    className="bg-background border-input text-foreground h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado</label>
                  <select 
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="activa">Activa</option>
                    <option value="cerrada">Cerrada</option>
                    <option value="archivada">Archivada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Disciplinas (Separadas por comas)</label>
                <Input 
                  placeholder="Ej: Fútbol, Baloncesto, Tenis"
                  value={form.disciplinas}
                  onChange={e => setForm(f => ({ ...f, disciplinas: e.target.value }))}
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold h-9"
                  onClick={handleCreateTemporada}
                >
                  Registrar Temporada
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs h-9" 
                  onClick={() => setIsOpenCreate(false)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Editar Temporada */}
      {isOpenEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-primary" /> Editar Temporada
              </CardTitle>
              <button 
                onClick={() => setIsOpenEdit(false)} 
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Cerrar
              </button>
            </CardHeader>
            <CardContent className="p-4 pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre de la Temporada *</label>
                <Input 
                  placeholder="Ej: Temporada 2027 o Torneo 2026/27"
                  value={editForm.nombre}
                  onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Inicio *</label>
                  <input 
                    type="date" 
                    value={editForm.inicio}
                    onChange={e => setEditForm(f => ({ ...f, inicio: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Fin *</label>
                  <input 
                    type="date" 
                    value={editForm.fin}
                    onChange={e => setEditForm(f => ({ ...f, fin: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Sedes</label>
                  <Input 
                    type="number"
                    value={editForm.sedes}
                    onChange={e => setEditForm(f => ({ ...f, sedes: Number(e.target.value) }))}
                    className="bg-background border-input text-foreground h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Equipos</label>
                  <Input 
                    type="number"
                    value={editForm.equipos}
                    onChange={e => setEditForm(f => ({ ...f, equipos: Number(e.target.value) }))}
                    className="bg-background border-input text-foreground h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado</label>
                  <select 
                    value={editForm.estado}
                    onChange={e => setEditForm(f => ({ ...f, estado: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                  >
                    <option value="activa">Activa</option>
                    <option value="cerrada">Cerrada</option>
                    <option value="archivada">Archivada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Disciplinas (Separadas por comas)</label>
                <Input 
                  placeholder="Ej: Fútbol, Baloncesto, Tenis"
                  value={editForm.disciplinas}
                  onChange={e => setEditForm(f => ({ ...f, disciplinas: e.target.value }))}
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold h-9"
                  onClick={handleUpdateTemporada}
                >
                  Guardar Cambios
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs h-9" 
                  onClick={() => setIsOpenEdit(false)}
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

export default TemporadasPage;
