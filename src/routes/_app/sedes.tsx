import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import RendimientoStore from "@/lib/rendimiento-store";
import { Plus, MapPin, Users, MoreHorizontal, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/sedes")({
  component: SedesPage,
  ssr: false,
});

function SedesPage() {
  const [mounted, setMounted] = useState(false);
  const [sedesList, setSedesList] = useState<any[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  
  // Form fields
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [disciplina, setDisciplina] = useState("Fútbol");
  const [encargado, setEncargado] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [wazeUrl, setWazeUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"sedes" | "instalaciones">("sedes");

  useEffect(() => {
    setMounted(true);
    setSedesList(RendimientoStore.getSedes());
  }, []);

  const handleCreateSede = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !direccion) {
      toast.error("Por favor completa el nombre y la dirección.");
      return;
    }
    
    RendimientoStore.addSede({
      nombre,
      direccion,
      disciplina,
      encargado: encargado || "Sin asignar",
      estado: "activo",
      jugadores: 0,
      mapsUrl,
      wazeUrl
    });

    setSedesList(RendimientoStore.getSedes());
    setNombre("");
    setDireccion("");
    setEncargado("");
    setMapsUrl("");
    setWazeUrl("");
    setOpenCreate(false);
    toast.success("Nueva Sede guardada exitosamente.");
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sedes & Instalaciones</h1>
          <p className="text-sm text-muted-foreground">Gestiona las sedes principales y las canchas o instalaciones asociadas a tu academia.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="bg-gradient-primary shadow-elegant">
          <Plus className="h-4 w-4" /> {activeTab === "sedes" ? "Nueva sede" : "Nueva instalación"}
        </Button>
      </div>

      {/* Pestañas de Navegación Interna */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant={activeTab === "sedes" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("sedes")}
          className="font-bold text-xs gap-1.5"
        >
          <Building2 className="h-4 w-4" /> Sedes ({sedesList.length})
        </Button>
        <Button
          variant={activeTab === "instalaciones" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("instalaciones")}
          className="font-bold text-xs gap-1.5"
        >
          <MapPin className="h-4 w-4" /> Instalaciones & Canchas (3)
        </Button>
      </div>

      {activeTab === "sedes" ? (
        sedesList.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sedesList.map((s) => (
            <Card key={s.id} className="shadow-card transition-all hover:shadow-elegant hover:-translate-y-0.5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{s.nombre}</p>
                      <p className="text-xs text-muted-foreground">{s.disciplina}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {s.direccion}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" /> {s.jugadores} jugadores
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Encargado</p>
                    <p className="text-sm font-medium">{s.encargado}</p>
                  </div>
                  <Badge variant={s.estado === "activo" ? "secondary" : "outline"} className={s.estado === "activo" ? "bg-success/15 text-success" : ""}>
                    {s.estado === "activo" ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center shadow-card bg-card border-dashed">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-sm text-white">No hay sedes registradas</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Registra las sedes físicas o ubicaciones de entrenamiento de tu academia.
          </p>
          <Button onClick={() => setOpenCreate(true)} variant="outline" size="sm" className="mt-4 gap-1">
            <Plus className="h-3.5 w-3.5" /> Registrar primera sede
          </Button>
        </Card>
      )
      ) : (
        /* Vista de Instalaciones y Canchas */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-primary/15 text-primary border-primary/30">Cancha Sintética 1</Badge>
              <Badge variant="outline" className="bg-success/15 text-success">Disponible</Badge>
            </div>
            <p className="text-sm font-semibold text-foreground">Cancha Principal Fútbol 11 (Medidas Oficiales)</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Sede Central — Campus Deportivo
            </p>
            <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
              <span>Superficie: Sintética Élite</span>
              <span>Iluminación: LED 500 Lux</span>
            </div>
          </Card>

          <Card className="shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-primary/15 text-primary border-primary/30">Cancha Sintética 2</Badge>
              <Badge variant="outline" className="bg-success/15 text-success">Disponible</Badge>
            </div>
            <p className="text-sm font-semibold text-foreground">Cancha Auxiliar Fútbol 9 (Formación)</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Sede Central — Campus Deportivo
            </p>
            <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
              <span>Superficie: Sintética</span>
              <span>Iluminación: Sí</span>
            </div>
          </Card>

          <Card className="shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-primary/15 text-primary border-primary/30">Gimnasio & Readaptación</Badge>
              <Badge variant="outline" className="bg-amber-500/15 text-amber-600">Mantenimiento</Badge>
            </div>
            <p className="text-sm font-semibold text-foreground">Centro de Valoración y Fisioterapia</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Sede Heredia, Belén
            </p>
            <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
              <span>Equipamiento: Fuerza & Funcional</span>
              <span>Área: 120 m²</span>
            </div>
          </Card>
        </div>
      )}

      {/* Creation Modal */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Sede</DialogTitle>
            <DialogDescription>
              Crea una ubicación física de tu academia deportiva.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSede} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Sede</Label>
              <Input
                id="nombre"
                placeholder="Ej. Sede Central, Canchas del Norte"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                placeholder="Ej. San José, Av. 10"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapsUrl">Enlace de Google Maps (URL)</Label>
              <Input
                id="mapsUrl"
                placeholder="https://maps.app.goo.gl/..."
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wazeUrl">Enlace de Waze (URL)</Label>
              <Input
                id="wazeUrl"
                placeholder="https://waze.com/ul?ll=..."
                value={wazeUrl}
                onChange={(e) => setWazeUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disciplina">Disciplina Base</Label>
              <Input
                id="disciplina"
                placeholder="Ej. Fútbol, Baloncesto"
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="encargado">Encargado / Administrador</Label>
              <Input
                id="encargado"
                placeholder="Ej. Carlos Méndez"
                value={encargado}
                onChange={(e) => setEncargado(e.target.value)}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button type="submit">Guardar Sede</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
