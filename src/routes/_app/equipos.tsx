import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useRole } from "@/hooks/use-role";
import { normalizeCategoryName } from "@/lib/excel-utils";
import {
  Plus, Users, Trophy, ShieldHalf, ArrowLeft, ClipboardCheck, QrCode,
  NotebookPen, TrendingUp, Target, Calendar, Activity, ChevronRight,
  User, UserCheck, AlertCircle, Sparkles, Award, Star, Edit, Trash2, Clock,
  Shield, Zap, CalendarRange, Pencil, ChevronUp, ChevronDown, CalendarDays,
  AlertTriangle, BookOpen, FileDown, Layers, CalendarIcon, Play, Printer
} from "lucide-react";
import { equipos, sedes, formatCRC, matches, convocatorias as mockConvocatorias, hash } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import RendimientoStore, { calcWellnessScore } from "@/lib/rendimiento-store";
import { TacticalStore } from "@/lib/tactical-store";
import { CarnetJugadorPremium } from "@/components/carnet/CarnetJugadorPremium";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/equipos")({
  validateSearch: (search: Record<string, unknown>): { teamId?: string; tab?: string } => ({
    teamId: search.teamId as string | undefined,
    tab: search.tab as string | undefined,
  }),
  component: EquiposPage,
});

function EquiposPage() {
  const { teamId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const { role, coachName } = useRole();

  const [teamsList, setTeamsList] = useState<any[]>(() => RendimientoStore.getEquipos());
  const [openCreate, setOpenCreate] = useState(false);

  const allPlayers = useMemo(() => RendimientoStore.getJugadores(), []);

  const getTeamPlayersCount = (team: any) => {
    return allPlayers.filter(p => {
      const pCat = normalizeCategoryName(p.categoria || "");
      const tCat = normalizeCategoryName(team.categoria || team.nombre || "");
      return pCat === tCat;
    }).length;
  };

  const getTeamCoach = (team: any) => {
    if (team.entrenador && team.entrenador !== "Sin asignar") {
      return team.entrenador;
    }
    const teamCatName = normalizeCategoryName(team.categoria || team.nombre || "");
    const matchingCat = categories.find(c => normalizeCategoryName(c.nombre || "") === teamCatName);
    if (matchingCat && matchingCat.entrenador && matchingCat.entrenador !== "Sin asignar") {
      return matchingCat.entrenador;
    }
    return "Sin asignar";
  };

  const coaches = useMemo(() => RendimientoStore.getEntrenadores(), [role, coachName]);
  const categories = useMemo(() => RendimientoStore.getCategorias(), [role, coachName]);

  useEffect(() => {
    const fetchEquiposDB = async () => {
      const orgId = RendimientoStore.getActiveOrganizacionId();
      await supabase.from("equipos").delete().in("nombre", ["U5 Asoderive", "Academia U13", "Academia U11", "Academia Sub-15 Élite"]);
      
      const realAsoderiveTeams = [
        { id: `eq_u9_${orgId.slice(0, 8)}`, nombre: "U9 Asoderive", disciplina: "Fútbol", categoria: "Sub-9", entrenador: "Carlos Fonseca", sede: "Sede Central", estado: "activo", organizacion_id: orgId },
        { id: `eq_u11_${orgId.slice(0, 8)}`, nombre: "U11 Asoderive", disciplina: "Fútbol", categoria: "Sub-11", entrenador: "Carlos Fonseca", sede: "Sede Central", estado: "activo", organizacion_id: orgId },
        { id: `eq_u13_${orgId.slice(0, 8)}`, nombre: "U13 Asoderive", disciplina: "Fútbol", categoria: "Sub-13", entrenador: "Eduardo Mora", sede: "Sede Central", estado: "activo", organizacion_id: orgId },
      ];

      const { data: dbTeams } = await supabase.from("equipos").select("*").eq("organizacion_id", orgId);
      if (!dbTeams || dbTeams.length === 0 || !dbTeams.some(t => t.nombre.includes("Asoderive"))) {
        await supabase.from("equipos").upsert(realAsoderiveTeams);
        setTeamsList(realAsoderiveTeams);
        RendimientoStore.set("equipos_dynamics", realAsoderiveTeams);
      } else {
        const filtered = dbTeams.filter(t => !["U5 Asoderive", "Academia U13", "Academia U11", "Academia Sub-15 Élite"].includes(t.nombre) && !t.nombre.includes("U5"));
        setTeamsList(filtered.length > 0 ? filtered : realAsoderiveTeams);
        RendimientoStore.set("equipos_dynamics", filtered.length > 0 ? filtered : realAsoderiveTeams);
      }
    };
    fetchEquiposDB();
  }, [role, coachName]);

  // Form states (Create)
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [uniforme, setUniforme] = useState("Azul / Blanco");
  const [entrenador, setEntrenador] = useState("Sin asignar");

  useEffect(() => {
    if (categories.length > 0 && !categoria) {
      setCategoria(categories[0].nombre);
    }
  }, [categories, categoria]);

  useEffect(() => {
    if (coaches.length > 0 && (entrenador === "Sin asignar" || !coaches.some(c => c.nombre === entrenador))) {
      setEntrenador(coaches[0].nombre);
    }
  }, [coaches, entrenador]);

  // Form states (Edit)
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editNombre, setEditNombre] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editUniforme, setEditUniforme] = useState("Azul / Blanco");
  const [editEntrenador, setEditEntrenador] = useState("Sin asignar");
  const [editDiasEntrenamiento, setEditDiasEntrenamiento] = useState<number[]>([]);

  const handleOpenEdit = (e: any) => {
    setEditId(e.id);
    setEditNombre(e.nombre);
    setEditCategoria(e.categoria);
    setEditUniforme(e.uniforme);
    setEditEntrenador(e.entrenador || "Sin asignar");
    setEditDiasEntrenamiento(e.dias_entrenamiento || []);
    setOpenEdit(true);
  };

  const handleUpdateTeam = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editNombre) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const matchingCat = categories.find(c => c.nombre === editCategoria);
    const disciplina = matchingCat ? matchingCat.disciplina : "Fútbol";

    RendimientoStore.updateEquipo(editId, {
      nombre: editNombre,
      categoria: editCategoria,
      disciplina,
      entrenador: editEntrenador,
      uniforme: editUniforme,
      dias_entrenamiento: editDiasEntrenamiento,
    });

    setOpenEdit(false);
    toast.success("Equipo actualizado con éxito");
    setTeamsList(RendimientoStore.getEquipos());
    router.invalidate();
  };

  const handleDeleteTeam = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el equipo "${name}"? Esta acción no se puede deshacer.`)) {
      RendimientoStore.deleteEquipo(id);
      toast.success("Equipo eliminado con éxito");
      setTeamsList(RendimientoStore.getEquipos());
      router.invalidate();
    }
  };

  const visibleTeams = useMemo(() => {
    if (role === "coach") {
      return teamsList.filter(e => getTeamCoach(e) === coachName);
    }
    return teamsList;
  }, [role, coachName, teamsList]);

  const selectedTeam = useMemo(() => {
    return visibleTeams.find(e => e.id === teamId);
  }, [teamId, visibleTeams]);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const matchingCat = categories.find(c => c.nombre === categoria);
    const disciplina = matchingCat ? matchingCat.disciplina : "Fútbol";

    RendimientoStore.addEquipo({
      nombre,
      categoria,
      disciplina,
      entrenador,
      uniforme,
      jugadores: 0,
    });

    setNombre("");
    setOpenCreate(false);
    toast.success("Equipo registrado con éxito");
    setTeamsList(RendimientoStore.getEquipos());
    router.invalidate();
  };

  if (selectedTeam) {
    return <TeamDetail team={selectedTeam} onBack={() => navigate({ to: "/equipos", search: { teamId: undefined } })} />;
  }

  return (
    <div className="space-y-6">
      {/* Pestañas Dashboard Estructura */}
      <div className="flex items-center gap-1.5 border-b pb-3">
        <Link
          to="/equipos"
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground shadow-sm"
        >
          👥 Equipos
        </Link>
        <Link
          to="/categorias"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
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
          <h1 className="text-2xl font-semibold tracking-tight">Estructura — Equipos</h1>
          <p className="text-sm text-muted-foreground">{visibleTeams.length} equipos registrados.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="bg-gradient-primary shadow-elegant">
          <Plus className="h-4 w-4 mr-1.5" /> Nuevo equipo
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTeams.map((e) => (
          <Card
            key={e.id}
            onClick={() => navigate({ to: "/equipos", search: { teamId: e.id } })}
            className="shadow-card overflow-hidden hover:shadow-elegant transition cursor-pointer group"
          >
            <div className="h-20 bg-gradient-primary relative flex justify-end p-2 items-start gap-1">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20" 
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenEdit(e);
                  }} 
                  title="Editar equipo"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-white/80 hover:text-red-300 hover:bg-red-900/20" 
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteTeam(e.id, e.nombre);
                  }} 
                  title="Eliminar equipo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="absolute -bottom-6 left-5 flex h-14 w-14 items-center justify-center rounded-xl bg-card border-4 border-card shadow-elegant group-hover:scale-105 transition-transform">
                <ShieldHalf className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardHeader className="pt-8">
              <CardTitle className="text-base group-hover:text-primary transition-colors">{e.nombre}</CardTitle>
              <CardDescription>{e.disciplina} · {e.categoria || e.nombre}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> Jugadores</div>
                <span className="font-semibold">{getTeamPlayersCount(e)} jugadores</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Trophy className="h-4 w-4" /> Entrenador</div>
                <span className="font-medium text-xs">{getTeamCoach(e)}</span>
              </div>
              <Badge variant="outline" className="w-full justify-center">Uniforme: {e.uniforme}</Badge>
              {(() => {
                const coachNameForTeam = getTeamCoach(e);
                const coachObj = coaches.find(c => c.nombre === coachNameForTeam);
                const coachSchedule = coachObj?.horario;
                return coachSchedule ? (
                  <div className="flex items-center justify-between text-xs bg-primary/5 border border-dashed border-primary/20 p-2 rounded-lg mt-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>Horario:</span>
                    </div>
                    <span className="font-semibold text-primary">{coachSchedule}</span>
                  </div>
                ) : null;
              })()}

              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  navigate({
                    to: "/entrenamientos",
                    search: { autostart: "true", teamName: e.nombre, category: e.categoria || e.nombre } as any,
                  });
                }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[11px] sm:text-xs min-h-[40px] h-auto py-2.5 px-3 rounded-xl gap-1.5 shadow-md uppercase tracking-wider mt-2 leading-tight whitespace-normal text-center flex items-center justify-center"
              >
                <Play className="h-4 w-4 shrink-0" />
                <span>⚽ Iniciar Entrenamiento en Cancha</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para Nuevo Equipo */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[460px] bg-background border shadow-elegant">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <ShieldHalf className="h-5 w-5 text-primary" /> Registrar Nuevo Equipo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define el nombre del equipo, asígnale una categoría y vincula a su entrenador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Nombre del Equipo *</Label>
              <Input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej. Élite Sub-14 Masculino B"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Categoría Deportiva</Label>
              {categories.length === 0 ? (
                <>
                  <Input
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                    placeholder="Ej. U9, Sub-12 Fútbol, etc."
                  />
                  <p className="text-[10px] text-amber-500 font-medium">
                    Aún no tienes categorías creadas. Escribe el nombre libremente o deja en blanco — puedes asignarla después desde Categorías.
                  </p>
                </>
              ) : (
                <select
                  value={categoria}
                  onChange={e => {
                    setCategoria(e.target.value);
                    const foundCat = categories.find(c => c.nombre === e.target.value);
                    if (foundCat) setEntrenador(foundCat.entrenador);
                  }}
                  className="h-10 px-3 rounded-md border bg-card text-sm text-foreground"
                >
                  <option value="">-- Sin categoría --</option>
                  {categories.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Entrenador Principal</Label>
              {coaches.length === 0 ? (
                <select
                  value={entrenador}
                  onChange={e => setEntrenador(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-card text-sm text-foreground"
                >
                  <option value="Sin asignar">Sin asignar</option>
                </select>
              ) : (
                <select
                  value={entrenador}
                  onChange={e => setEntrenador(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-card text-sm text-foreground"
                >
                  <option value="">-- Selecciona Entrenador --</option>
                  {coaches.map(co => <option key={co.id} value={co.nombre}>{co.nombre}</option>)}
                  <option value="Sin asignar">Sin asignar</option>
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Detalle de Uniforme</Label>
              <Input
                value={uniforme}
                onChange={e => setUniforme(e.target.value)}
                placeholder="Ej. Azul / Blanco"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-primary">Guardar Equipo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Equipo */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[460px] bg-background border shadow-elegant">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <ShieldHalf className="h-5 w-5 text-primary" /> Editar Equipo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifica los detalles del equipo seleccionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateTeam} className="space-y-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Nombre del Equipo *</Label>
              <Input
                value={editNombre}
                onChange={e => setEditNombre(e.target.value)}
                placeholder="Ej. Élite Sub-14 Masculino B"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Categoría Deportiva</Label>
              {categories.length === 0 ? (
                <>
                  <Input
                    value={editCategoria}
                    onChange={e => setEditCategoria(e.target.value)}
                    placeholder="Ej. U9, Sub-12 Fútbol, etc."
                  />
                  <p className="text-[10px] text-amber-500 font-medium">
                    Aún no tienes categorías creadas. Escribe el nombre libremente.
                  </p>
                </>
              ) : (
                <select
                  value={editCategoria}
                  onChange={e => {
                    setEditCategoria(e.target.value);
                    const foundCat = categories.find(c => c.nombre === e.target.value);
                    if (foundCat) setEditEntrenador(foundCat.entrenador);
                  }}
                  className="h-10 px-3 rounded-md border bg-card text-sm text-foreground"
                >
                  <option value="">-- Sin categoría --</option>
                  {categories.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Entrenador Principal</Label>
              {coaches.length === 0 ? (
                <select
                  value={editEntrenador}
                  onChange={e => setEditEntrenador(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-card text-sm text-foreground"
                >
                  <option value="Sin asignar">Sin asignar</option>
                </select>
              ) : (
                <select
                  value={editEntrenador}
                  onChange={e => setEditEntrenador(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-card text-sm text-foreground"
                >
                  <option value="">-- Selecciona Entrenador --</option>
                  {coaches.map(co => <option key={co.id} value={co.nombre}>{co.nombre}</option>)}
                  <option value="Sin asignar">Sin asignar</option>
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Detalle de Uniforme</Label>
              <Input
                value={editUniforme}
                onChange={e => setEditUniforme(e.target.value)}
                placeholder="Ej. Azul / Blanco"
              />
            </div>

            {/* Días de Entrenamiento */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">📅 Días de Entrenamiento</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Lun", value: 1 },
                  { label: "Mar", value: 2 },
                  { label: "Mié", value: 3 },
                  { label: "Jue", value: 4 },
                  { label: "Vie", value: 5 },
                  { label: "Sáb", value: 6 },
                  { label: "Dom", value: 0 },
                ].map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setEditDiasEntrenamiento(prev =>
                      prev.includes(d.value) ? prev.filter(x => x !== d.value) : [...prev, d.value]
                    )}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      editDiasEntrenamiento.includes(d.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">El sistema mostrará un aviso si toman asistencia en un día no programado.</p>
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

interface TeamDetailProps {
  team: typeof equipos[0];
  onBack: () => void;
}

function TeamDetail({ team, onBack }: TeamDetailProps) {
  const navigate = Route.useNavigate();
  const searchTab = (Route.useSearch() as any).tab || "cancha";
  const tab = searchTab;
  const { role, coachName } = useRole();

  const handleTabChange = (val: string) => {
    navigate({
      search: { teamId: team.id, tab: val },
    });
  };

  const categories = useMemo(() => RendimientoStore.getCategorias(), []);
  const teamCategory = team.categoria || team.nombre;
  const teamCoach = useMemo(() => {
    if (team.entrenador && team.entrenador !== "Sin asignar") return team.entrenador;
    const teamCatName = normalizeCategoryName(team.categoria || team.nombre || "");
    const matchingCat = categories.find(c => normalizeCategoryName(c.nombre || "") === teamCatName);
    return matchingCat?.entrenador || "Sin asignar";
  }, [team, categories]);

  // Load dynamic players state and CRUD
  const [playersList, setPlayersList] = useState<any[]>([]);

  const loadPlayers = () => {
    setPlayersList(RendimientoStore.getJugadores());
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  // Convocatorias from Supabase
  const [teamConvocatorias, setTeamConvocatorias] = useState<any[]>([]);
  useEffect(() => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase
      .from("convocatorias")
      .select("*")
      .eq("organizacion_id", orgId)
      .order("fecha", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const filtered = data.filter((c: any) => {
          const eq = (c.equipo || "").toLowerCase();
          const tn = (team.nombre || "").toLowerCase();
          const tc = (team.categoria || "").toLowerCase();
          return eq.includes(tn) || eq.includes(tc) || tn.includes(eq) || tc.includes(eq);
        });
        setTeamConvocatorias(filtered);
      });
  }, [team]);

  const [isOpenPlayerCreate, setIsOpenPlayerCreate] = useState(false);
  const [isOpenPlayerEdit, setIsOpenPlayerEdit] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);

  // Player Form State
  const [playerForm, setPlayerForm] = useState({
    nombre: "",
    correo: "",
    identificacion: "",
    telefono: "",
    fechaNacimiento: "2010-01-01",
    posicion: "DEL",
    estadoPago: "al_dia"
  });

  const handleOpenPlayerCreate = () => {
    setPlayerForm({
      nombre: "",
      correo: "",
      identificacion: "",
      telefono: "",
      fechaNacimiento: "2010-01-01",
      posicion: "DEL",
      estadoPago: "al_dia"
    });
    setIsOpenPlayerCreate(true);
  };

  const handleOpenPlayerEdit = (player: any) => {
    setEditingPlayer(player);
    setPlayerForm({
      nombre: player.nombre || "",
      correo: player.correo || "",
      identificacion: player.identificacion || "",
      telefono: player.telefono || "",
      fechaNacimiento: player.fechaNacimiento || "2010-01-01",
      posicion: player.posicion || "DEL",
      estadoPago: player.estadoPago || "al_dia"
    });
    setIsOpenPlayerEdit(true);
  };

  const handleSavePlayer = () => {
    if (!playerForm.nombre.trim()) {
      toast.error("El nombre del jugador es obligatorio.");
      return;
    }
    
    if (isOpenPlayerEdit && editingPlayer) {
      RendimientoStore.updateJugador(editingPlayer.id, {
        nombre: playerForm.nombre,
        correo: playerForm.correo,
        identificacion: playerForm.identificacion,
        telefono: playerForm.telefono,
        fechaNacimiento: playerForm.fechaNacimiento,
        posicion: playerForm.posicion,
        estadoPago: playerForm.estadoPago
      });
      toast.success("Jugador actualizado con éxito.");
      setIsOpenPlayerEdit(false);
    } else {
      RendimientoStore.addJugador({
        nombre: playerForm.nombre,
        correo: playerForm.correo,
        identificacion: playerForm.identificacion,
        telefono: playerForm.telefono,
        fechaNacimiento: playerForm.fechaNacimiento,
        posicion: playerForm.posicion,
        categoria: team.categoria || "Sub-15"
      });
      toast.success("Nuevo jugador registrado en la plantilla.");
      setIsOpenPlayerCreate(false);
    }
    loadPlayers();
  };

  const handleDeletePlayer = (playerId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este jugador de la plantilla?")) {
      RendimientoStore.deleteJugador(playerId);
      loadPlayers();
    }
  };

  // Attendance State
  const [attendance, setAttendance] = useState<Record<string, "P" | "T" | "A" | "J">>({});
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const local = new Date();
    const offset = local.getTimezoneOffset();
    const localDate = new Date(local.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  });
  const [hasSavedAttendance, setHasSavedAttendance] = useState(false);
  const [isEditingHistory, setIsEditingHistory] = useState(false);

  const isTrainingDay = useMemo(() => {
    if (!attendanceDate) return true;
    let dias: number[] = team.dias_entrenamiento || [];
    if (dias.length === 0 && (team.entrenador?.toLowerCase().includes("araya") || team.nombre?.toLowerCase().includes("u9"))) {
      dias = [1, 5]; // Lunes y Viernes
    }
    if (dias.length === 0) return true;
    const [year, month, day] = attendanceDate.split("-").map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    return dias.includes(dayOfWeek);
  }, [attendanceDate, team]);

  const teamSessions = useMemo(() => {
    const listSesiones = RendimientoStore.getSesiones().filter(s => {
      if (!s.equipo) return false;
      const sEq = s.equipo.toLowerCase().trim();
      const tNom = team.nombre?.toLowerCase().trim() || "";
      const tCat = team.categoria?.toLowerCase().trim() || "";
      return sEq === tNom || sEq === tCat || tNom.includes(sEq) || sEq.includes(tNom);
    });

    let diasProgramados: number[] = team.dias_entrenamiento || [];
    if (diasProgramados.length === 0 && (team.entrenador?.toLowerCase().includes("araya") || team.nombre?.toLowerCase().includes("u9"))) {
      diasProgramados = [1, 5]; // Lunes (1) y Viernes (5) por defecto para Carlos Araya / U9
    }

    const listAsistencias = RendimientoStore.getAsistencias()
      .filter(a => {
        if (!a.equipo) return false;
        const aEq = a.equipo.toLowerCase().trim();
        const tNom = team.nombre?.toLowerCase().trim() || "";
        const tCat = team.categoria?.toLowerCase().trim() || "";
        const matchesTeam = aEq === tNom || aEq === tCat || tNom.includes(aEq) || aEq.includes(tNom);
        if (!matchesTeam) return false;

        // Si el equipo tiene días configurados, ignorar asistencias tomadas en días no autorizados
        if (diasProgramados.length > 0 && a.fecha) {
          const [y, m, d] = a.fecha.split("-").map(Number);
          const dayOfWeek = new Date(y, m - 1, d).getDay();
          if (!diasProgramados.includes(dayOfWeek)) return false;
        }

        return true;
      })
      .map(a => {
        const vals = Object.values(a.registro || {});
        const pres = vals.filter(v => v === "P" || v === "T").length;
        const total = vals.length;
        const pct = total > 0 ? Math.round((pres / total) * 100) : 0;
        return {
          id: `asist_${a.id || a.fecha}`,
          nombre: `Pase de Lista (${pres}/${total} presentes - ${pct}%)`,
          fecha: a.fecha,
          hora: "Entrenamiento",
          tipo: "Cancha / Asistencia",
          duracion: 90,
          rpe: undefined
        };
      });

    // Merge without duplicate dates if a formal session already exists for that date
    const mergedMap = new Map<string, any>();
    listAsistencias.forEach(a => mergedMap.set(a.fecha, a));
    listSesiones.forEach(s => mergedMap.set(s.fecha, s));

    return Array.from(mergedMap.values()).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [team, hasSavedAttendance]);

  const teamSavedAttendances = useMemo(() => {
    const list = RendimientoStore.getAsistencias();
    const diasProgramados: number[] = team.dias_entrenamiento || [];

    return list
      .filter(a => {
        if (a.equipo !== team.nombre) return false;
        if (diasProgramados.length > 0 && a.fecha) {
          const [y, m, d] = a.fecha.split("-").map(Number);
          const dayOfWeek = new Date(y, m - 1, d).getDay();
          if (!diasProgramados.includes(dayOfWeek)) return false;
        }
        return true;
      })
      .map(a => {
        const reg = a.registro || {};
        const vals = Object.values(reg);
        const p = vals.filter(v => v === "P").length;
        const t = vals.filter(v => v === "T").length;
        const a_count = vals.filter(v => v === "A").length;
        const j = vals.filter(v => v === "J").length;
        return {
          id: a.id,
          fecha: a.fecha,
          stats: `Presentes: ${p} | Tardes: ${t} | Ausentes: ${a_count} | Justificados: ${j}`
        };
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [team.nombre, team.dias_entrenamiento, hasSavedAttendance, attendance]);

  // Filter players assigned to this team
  const teamPlayers = useMemo(() => {
    return playersList.filter(p => {
      const pCat = normalizeCategoryName(p.categoria || "");
      const tCat = normalizeCategoryName(team.categoria || team.nombre || "");
      return pCat === tCat;
    });
  }, [playersList, team]);

  const playerLoadsMap = useMemo(() => {
    const data = RendimientoStore.getPlayerLoadData();
    return new Map(data.map(d => [d.jugadorId, d.semaforo]));
  }, [teamPlayers]);

  const teamMatches = useMemo(() => {
    const list = RendimientoStore.getPartidos();
    return list.filter(m => {
      if (m.equipoId === team.id) return true;
      if (!m.equipo) return false;
      const mEq = m.equipo.toLowerCase().trim();
      const tNom = team.nombre?.toLowerCase().trim() || "";
      const tCat = team.categoria?.toLowerCase().trim() || "";
      return mEq === tNom || mEq === tCat || tNom.includes(mEq) || mEq.includes(tNom);
    });
  }, [team]);

  useEffect(() => {
    const existing = RendimientoStore.getAsistencia(team.nombre, attendanceDate);
    if (existing && existing.registro) {
      setAttendance(existing.registro);
      setHasSavedAttendance(true);
    } else {
      const initial: Record<string, "P" | "T" | "A" | "J"> = {};
      teamPlayers.forEach(p => {
        initial[p.id] = "P";
      });
      setAttendance(initial);
      setHasSavedAttendance(false);
    }
  }, [team.nombre, attendanceDate, teamPlayers]);

  useEffect(() => {
    if (!hasSavedAttendance && teamPlayers.length > 0) {
      setAttendance(prev => {
        const next = { ...prev };
        let changed = false;
        teamPlayers.forEach(p => {
          if (!next[p.id]) {
            next[p.id] = "P";
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [teamPlayers, hasSavedAttendance]);

  // Sincronizar tests físicos y banco de pruebas
  useEffect(() => {
    const updateStates = () => {
      setSavedTests(RendimientoStore.getResultadosPruebas());
      setBancoPruebas(RendimientoStore.getBancoPruebas());
      setBancoWellness(RendimientoStore.getBancoWellness());
    };

    updateStates();
    window.addEventListener("organizacionChanged", updateStates);
    return () => {
      window.removeEventListener("organizacionChanged", updateStates);
    };
  }, [team.nombre, attendanceDate]);

  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);

  const handleSaveAttendance = async (force = false) => {
    if (!isTrainingDay) {
      const diasNombres = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const diasConfigurados = (team.dias_entrenamiento || []).map((d: number) => diasNombres[d]).join(", ");
      const msgDias = diasConfigurados ? `(Días programados: ${diasConfigurados})` : "(Sin días programados configurados)";
      if (!confirm(`Atención: Hoy no es un día de entrenamiento programado para este equipo ${msgDias}. ¿Deseas guardar la asistencia de todas formas?`)) {
        return;
      }
    }

    if (hasSavedAttendance && !isEditingHistory && !force) {
      setShowOverwriteWarning(true);
      return;
    }

    const isNew = !hasSavedAttendance;
    await RendimientoStore.saveAsistencia(team.nombre, attendanceDate, attendance);
    setHasSavedAttendance(true);
    setIsEditingHistory(false);
    setShowOverwriteWarning(false);

    if (isNew) {
      toast.success(`Asistencia para el equipo ${team.nombre} guardada exitosamente para la fecha ${attendanceDate}.`);
    } else {
      toast.success(`La asistencia se ha modificado y actualizado exitosamente para la fecha ${attendanceDate}.`);
    }
  };

  const handleDeleteAttendance = async (fecha: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el registro de asistencia del ${fecha}?`)) {
      return;
    }
    await RendimientoStore.deleteAsistencia(team.nombre, fecha);
    toast.success(`Registro de asistencia del ${fecha} eliminado.`);
    setHasSavedAttendance(false);
    setIsEditingHistory(false);
    window.dispatchEvent(new Event("organizacionChanged"));
  };

  // QR Checkin State
  const [qrCode, setQrCode] = useState("");
  const [scannedPlayer, setScannedPlayer] = useState<any | null>(null);

  // Wellness States (Paso 3)
  const [openWellnessModal, setOpenWellnessModal] = useState(false);
  const [wellnessPlayer, setWellnessPlayer] = useState<any | null>(null);
  const [wellSueño, setWellSueño] = useState<number>(4); // Default 4 (Bueno)
  const [wellFatiga, setWellFatiga] = useState<number>(1); // Default 1 (Ninguna)
  const [wellDolor, setWellDolor] = useState<number>(1); // Default 1 (Ninguno)
  const [wellEstres, setWellEstres] = useState<number>(1); // Default 1 (Ninguno)

  // Estados para Pruebas Físicas (Paso 4 en Asistencia)
  const [openTestModal, setOpenTestModal] = useState(false);
  const [testPlayer, setTestPlayer] = useState<any>(null);
  const [testType, setTestType] = useState<string>("Velocidad (30m)");
  const [testValue, setTestValue] = useState<string>("");
  const [testUnit, setTestUnit] = useState<string>("segundos");
  const [testNotes, setTestNotes] = useState<string>("");
  const [savedTests, setSavedTests] = useState<any[]>(() => RendimientoStore.getResultadosPruebas());

  // Estados para Configuración Dinámica de Métricas (Bancos)
  const [bancoWellness, setBancoWellness] = useState<any[]>(() => RendimientoStore.getBancoWellness());
  const [bancoPruebas, setBancoPruebas] = useState<any[]>(() => RendimientoStore.getBancoPruebas());
  const [newTestName, setNewTestName] = useState("");
  const [newTestUnit, setNewTestUnit] = useState("segundos");
  const [newTestEmoji, setNewTestEmoji] = useState("🏃");
  const [newWellName, setNewWellName] = useState("");
  const [newWellEmoji, setNewWellEmoji] = useState("❓");
  const [newWellType, setNewWellType] = useState("normal");

  const handleOpenWellnessModal = (player: any) => {
    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];
    const existing = RendimientoStore.getWellness().find(
      w => w.jugadorId === player.id && w.fecha === todayStr
    );
    setWellnessPlayer(player);
    if (existing) {
      setWellSueño(existing.sueñoCalidad || 4);
      setWellFatiga(existing.fatiga || 1);
      setWellDolor(existing.dolorMuscular || 1);
      setWellEstres(existing.estres || 1);
    } else {
      setWellSueño(4);
      setWellFatiga(1);
      setWellDolor(1);
      setWellEstres(1);
    }
    setOpenWellnessModal(true);
  };

  const handleSaveWellness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wellnessPlayer) return;
    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];

    const record = {
      jugadorId: wellnessPlayer.id,
      jugador: wellnessPlayer.nombre,
      fecha: todayStr,
      sueñoCalidad: wellSueño,
      sueñoHoras: 8,
      fatiga: wellFatiga,
      dolorMuscular: wellDolor,
      estres: wellEstres,
      animo: 4,
      energia: 4,
      motivacion: 4
    };

    try {
      await RendimientoStore.addWellness(record);
      toast.success(`Registro Wellness guardado para ${wellnessPlayer.nombre}`);
      setOpenWellnessModal(false);
      window.dispatchEvent(new Event("organizacionChanged"));
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar wellness diario");
    }
  };

  const handleOpenTestModal = (player: any) => {
    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];
    const existing = savedTests.find(t => t.jugadorId === player.id && t.fecha === todayStr);

    setTestPlayer(player);
    if (existing) {
      setTestType(existing.tipoTest);
      setTestValue(existing.resultado.toString());
      setTestUnit(existing.unidad);
      setTestNotes(existing.notes || "");
    } else {
      setTestType("Velocidad (30m)");
      setTestValue("");
      setTestUnit("segundos");
      setTestNotes("");
    }
    setOpenTestModal(true);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPlayer || !testValue) return;
    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];

    try {
      await RendimientoStore.addResultadoPrueba({
        jugadorId: testPlayer.id,
        jugador: testPlayer.nombre,
        fecha: todayStr,
        tipoTest: testType,
        resultado: parseFloat(testValue),
        unidad: testUnit,
        notas: testNotes
      });

      setSavedTests(RendimientoStore.getResultadosPruebas());
      toast.success(`Prueba física de ${testPlayer.nombre} guardada.`);
      setOpenTestModal(false);
      window.dispatchEvent(new Event("organizacionChanged"));
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar prueba física");
    }
  };

  const handleMarkAllWellness = async () => {
    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];
    let count = 0;
    for (const p of teamPlayers) {
      const existing = RendimientoStore.getWellness().find(
        w => w.jugadorId === p.id && w.fecha === todayStr
      );
      if (!existing) {
        const record = {
          jugadorId: p.id,
          jugador: p.nombre,
          fecha: todayStr,
          sueñoCalidad: 4,
          sueñoHoras: 8,
          fatiga: 1,
          dolorMuscular: 1,
          estres: 1,
          animo: 4,
          energia: 4,
          motivacion: 4
        };
        await RendimientoStore.addWellness(record);
        count++;
      }
    }
    if (count > 0) {
      toast.success(`Se registró Wellness óptimo para ${count} jugadores.`);
      window.dispatchEvent(new Event("organizacionChanged"));
    } else {
      toast.info("Todos los jugadores ya tienen registro Wellness para hoy.");
    }
  };

  const handleMarkAllTests = async () => {
    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];
    let count = 0;
    for (const p of teamPlayers) {
      const existing = savedTests.find(
        t => t.jugadorId === p.id && t.fecha === todayStr
      );
      if (!existing) {
        await RendimientoStore.addResultadoPrueba({
          jugadorId: p.id,
          jugador: p.nombre,
          fecha: todayStr,
          tipoTest: "Velocidad (30m)",
          resultado: 4.8,
          unidad: "segundos",
          notas: "Registro rápido general"
        });
        count++;
      }
    }
    if (count > 0) {
      setSavedTests(RendimientoStore.getResultadosPruebas());
      toast.success(`Se registró Prueba Física (Velocidad 30m) para ${count} jugadores.`);
      window.dispatchEvent(new Event("organizacionChanged"));
    } else {
      toast.info("Todos los jugadores ya tienen registro de Pruebas Físicas para hoy.");
    }
  };

  const hasWellnessOnThisDay = useMemo(() => {
    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];
    const playerIds = new Set(teamPlayers.map(p => p.id));
    return RendimientoStore.getWellness().some(w => playerIds.has(w.jugadorId) && w.fecha === todayStr);
  }, [teamPlayers, attendanceDate]);

  const hasTestsOnThisDay = useMemo(() => {
    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];
    const playerIds = new Set(teamPlayers.map(p => p.id));
    return savedTests.some(t => playerIds.has(t.jugadorId) && t.fecha === todayStr);
  }, [teamPlayers, attendanceDate, savedTests]);

  const handleClearAllWellness = async () => {
    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];
    const current = RendimientoStore.getWellness();
    const playerIds = new Set(teamPlayers.map(p => p.id));
    const updated = current.filter(w => !(playerIds.has(w.jugadorId) && w.fecha === todayStr));
    await RendimientoStore.set("wellness", updated);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    await supabase.from("wellness").delete().eq("fecha", todayStr).eq("organizacion_id", orgId);
    toast.success("Se eliminaron todos los registros Wellness de hoy para este equipo.");
    window.dispatchEvent(new Event("organizacionChanged"));
  };

  const handleClearAllTests = async () => {
    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];
    const current = RendimientoStore.getResultadosPruebas();
    const playerIds = new Set(teamPlayers.map(p => p.id));
    const updated = current.filter(t => !(playerIds.has(t.jugadorId) && t.fecha === todayStr));
    await RendimientoStore.set("resultados_pruebas", updated);
    setSavedTests(RendimientoStore.getResultadosPruebas());
    toast.success("Se eliminaron todos los registros de Pruebas Físicas de hoy para este equipo.");
    window.dispatchEvent(new Event("organizacionChanged"));
  };

  const handleAddBancoPrueba = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName) return;
    try {
      await RendimientoStore.addBancoPrueba({
        nombre: newTestName,
        unidad: newTestUnit,
        emoji: newTestEmoji
      });
      setBancoPruebas(RendimientoStore.getBancoPruebas());
      setNewTestName("");
      toast.success("Nueva prueba física añadida al banco.");
    } catch (err) {
      console.error(err);
      toast.error("Error al añadir prueba física.");
    }
  };

  const handleDeleteBancoPrueba = async (id: string) => {
    try {
      await RendimientoStore.deleteBancoPrueba(id);
      setBancoPruebas(RendimientoStore.getBancoPruebas());
      toast.success("Prueba física eliminada del banco.");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar prueba física.");
    }
  };

  const handleAddBancoWellness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWellName) return;
    try {
      const list = [...bancoWellness, {
        id: `w_${Date.now()}`,
        nombre: newWellName,
        tipo: newWellType,
        emoji: newWellEmoji,
        activo: true
      }];
      await RendimientoStore.saveBancoWellness(list);
      setBancoWellness(list);
      setNewWellName("");
      toast.success("Nueva métrica Wellness añadida.");
    } catch (err) {
      console.error(err);
      toast.error("Error al añadir métrica Wellness.");
    }
  };

  const handleToggleBancoWellness = async (id: string) => {
    try {
      const list = bancoWellness.map(w => w.id === id ? { ...w, activo: !w.activo } : w);
      await RendimientoStore.saveBancoWellness(list);
      setBancoWellness(list);
      toast.success("Estado de métrica Wellness actualizado.");
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar métrica Wellness.");
    }
  };

  const handleQRCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode) return;
    const player = allPlayers.find(p => p.identificacion === qrCode || p.id === qrCode || p.qr === qrCode);
    if (player) {
      setScannedPlayer(player);
      toast.success(`Check-in registrado para ${player.nombre}`);
      setQrCode("");
    } else {
      toast.error("Código QR o Identificación inválido");
    }
  };

  // ── CONVOCATORIAS CRUD ─────────────────────────────────────────
  const [openConvoc, setOpenConvoc] = useState(false);
  const [convocLoading, setConvocLoading] = useState(false);
  const [convocForm, setConvocForm] = useState({
    titulo: "",
    fecha: "",
    hora_concentracion: "",
    sede: "",
    rival: "",
    uniforme_local: "",
    notas: "",
  });
  const [convocSelectedIds, setConvocSelectedIds] = useState<Set<string>>(new Set());

  const loadConvocatorias = () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase
      .from("convocatorias")
      .select("*")
      .eq("organizacion_id", orgId)
      .order("fecha", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const filtered = data.filter((c: any) => {
          const eq = (c.equipo || "").toLowerCase();
          const tn = (team.nombre || "").toLowerCase();
          const tc = (team.categoria || "").toLowerCase();
          return eq.includes(tn) || eq.includes(tc) || tn.includes(eq) || tc.includes(eq);
        });
        setTeamConvocatorias(filtered);
      });
  };

  const handleOpenConvoc = () => {
    const today = new Date();
    // Next Saturday
    const daysToSat = (6 - today.getDay() + 7) % 7 || 7;
    const sat = new Date(today);
    sat.setDate(today.getDate() + daysToSat);
    const dateStr = sat.toISOString().split("T")[0];
    setConvocForm({ titulo: "", fecha: dateStr, hora_concentracion: "08:00", sede: "", rival: "", uniforme_local: "", notas: "" });
    setConvocSelectedIds(new Set(teamPlayers.map((p: any) => p.id)));
    setOpenConvoc(true);
  };

  const handleSaveConvoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convocForm.titulo || !convocForm.fecha) {
      toast.error("El título y la fecha son obligatorios.");
      return;
    }
    setConvocLoading(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const jugadoresConvocados = teamPlayers
      .filter((p: any) => convocSelectedIds.has(p.id))
      .map((p: any) => ({ id: p.id, nombre: p.nombre, posicion: p.posicion || "DEL", estado: "titular" }));
    const { error } = await supabase.from("convocatorias").insert({
      titulo: convocForm.titulo,
      fecha: convocForm.fecha,
      hora_concentracion: convocForm.hora_concentracion,
      sede: convocForm.sede,
      rival: convocForm.rival,
      uniforme_local: convocForm.uniforme_local,
      notas: convocForm.notas,
      equipo: team.nombre,
      organizacion_id: orgId,
      jugadores: jugadoresConvocados,
    });
    setConvocLoading(false);
    if (error) { toast.error("Error al guardar la convocatoria."); return; }
    toast.success("¡Convocatoria creada exitosamente!");
    setOpenConvoc(false);
    loadConvocatorias();
  };

  const handleDeleteConvoc = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta convocatoria? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("convocatorias").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar la convocatoria."); return; }
    toast.success("Convocatoria eliminada.");
    loadConvocatorias();
  };

  const toggleConvocPlayer = (id: string) => {
    setConvocSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  // ──────────────────────────────────────────────────────────────

  // Quick Evaluation State
  const [selectedPlayerForEval, setSelectedPlayerForEval] = useState(teamPlayers[0]?.id || "");
  const [tecScore, setTecScore] = useState(85);
  const [fisScore, setFisScore] = useState(80);
  const [tacScore, setTacScore] = useState(75);
  const [actScore, setActScore] = useState(90);
  const [evalComment, setEvalComment] = useState("");

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const player = teamPlayers.find(p => p.id === selectedPlayerForEval);
    if (!player) return;
    toast.success(`Evaluación técnica registrada para ${player.nombre}`);
    setEvalComment("");
  };

  // Planificación States
  const [openCreatePlan, setOpenCreatePlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planTipo, setPlanTipo] = useState<"semanal" | "microciclo" | "mesociclo" | "temporada">("microciclo");
  const [planSubTab, setPlanSubTab] = useState<"semanal" | "microciclos" | "mesociclos" | "temporada">("semanal");
  const [plans, setPlans] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("deportivos_training_plans");
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  });
  const [planName, setPlanName] = useState("");
  const [planStart, setPlanStart] = useState("");
  const [planEnd, setPlanEnd] = useState("");
  const [planObjectives, setPlanObjectives] = useState("");
  const [planExercises, setPlanExercises] = useState<{ id: string; nombre: string; duracion: number }[]>([
    { id: "ex_1", nombre: "", duracion: 15 }
  ]);

  const teamPlanificaciones = useMemo(() => {
    const list = RendimientoStore.getPlanificaciones();
    const clean = (s: string = "") => s.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/futbol|fútbol|basquetbol|baloncesto|voleibol|elite|élite/g, "");
    const isSameTeam = (a: string = "", b: string = "") => {
      const ca = clean(a);
      const cb = clean(b);
      return ca === cb || ca.includes(cb) || cb.includes(ca);
    };
    return list.filter(p => isSameTeam(p.equipo, team.nombre));
  }, [team.nombre, openCreatePlan]);

  const weeklyPlans = useMemo(() => TacticalStore.getWeeklyPlans(), []);
  const activeWeeklyPlan = useMemo(() => {
    const clean = (s: string = "") => s.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/futbol|fútbol|basquetbol|baloncesto|voleibol|elite|élite/g, "");
    const isSameTeam = (a: string = "", b: string = "") => {
      const ca = clean(a);
      const cb = clean(b);
      return ca === cb || ca.includes(cb) || cb.includes(ca);
    };
    const found = weeklyPlans.find(wp => isSameTeam(wp.equipo, team.nombre));
    if (found) return found;

    // Dynamically construct active weekly plan for team instead of hardcoding Carlos Méndez / Sub-15
    return {
      id: `wp_${team.id || "dynamic"}`,
      semana: "2026-W28",
      equipo: team.nombre,
      categoria: team.categoria || team.nombre,
      objetivo: "Preparación táctica para los compromisos de la semana",
      cargaEsperada: 480,
      responsable: teamCoach || coachName || "Entrenador",
      actividades: [
        { id: "a1", dia: 0, tipo: "entreno", hora: "16:00", duracion: 90, titulo: "Técnica individual + pressing", equipo: team.nombre },
        { id: "a2", dia: 1, tipo: "video",   hora: "15:00", duracion: 60, titulo: "Análisis del rival", equipo: team.nombre },
        { id: "a3", dia: 2, tipo: "entreno", hora: "16:00", duracion: 90, titulo: "Sistemática defensiva", equipo: team.nombre },
        { id: "a4", dia: 3, tipo: "recuperacion", hora: "09:00", duracion: 45, titulo: "Sesión regenerativa", equipo: team.nombre },
        { id: "a5", dia: 4, tipo: "entreno", hora: "16:00", duracion: 75, titulo: "Ensayo táctico precompetitivo", equipo: team.nombre },
        { id: "a6", dia: 5, tipo: "partido", hora: "10:00", duracion: 90, titulo: "Partido de campeonato", equipo: team.nombre },
        { id: "a7", dia: 6, tipo: "descanso", hora: "", duracion: 0, titulo: "Día de descanso", equipo: team.nombre },
      ],
    };
  }, [weeklyPlans, team.nombre, teamCoach, coachName]);

  const dayLabels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  const realTeamSessions = useMemo(() => {
    const list = RendimientoStore.getSesiones().filter(s => {
      const clean = (x: string = "") => x.toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace(/futbol|fútbol|basquetbol|baloncesto|voleibol|elite|élite/g, "");
      return clean(s.equipo) === clean(team.nombre) || clean(s.equipo).includes(clean(team.nombre)) || clean(team.nombre).includes(clean(s.equipo));
    });
    if (!activeWeeklyPlan) return list;
    
    const isDateInISOWeek = (dateStr: string, weekStr: string) => {
      if (!dateStr || !weekStr) return false;
      const d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return false;
      const parts = weekStr.split("-W");
      if (parts.length !== 2) return false;
      const year = parseInt(parts[0], 10);
      const week = parseInt(parts[1], 10);
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dayOfWeek = simple.getDay();
      const ISOweekStart = simple;
      if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
      } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
      }
      const ISOweekEnd = new Date(ISOweekStart);
      ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
      const dTime = d.getTime();
      const startTime = new Date(ISOweekStart.toISOString().split("T")[0] + "T00:00:00").getTime();
      const endTime = new Date(ISOweekEnd.toISOString().split("T")[0] + "T23:59:59").getTime();
      return dTime >= startTime && dTime <= endTime;
    };
    
    return list.filter(s => isDateInISOWeek(s.fecha, activeWeeklyPlan.semana));
  }, [team.nombre, activeWeeklyPlan]);

  const realTeamMatches = useMemo(() => {
    const list = RendimientoStore.getPartidos().filter(m => {
      const clean = (x: string = "") => x.toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace(/futbol|fútbol|basquetbol|baloncesto|voleibol|elite|élite/g, "");
      return clean(m.equipo) === clean(team.nombre) || clean(m.equipo).includes(clean(team.nombre)) || clean(team.nombre).includes(clean(m.equipo));
    });
    if (!activeWeeklyPlan) return list;
    
    const isDateInISOWeek = (dateStr: string, weekStr: string) => {
      if (!dateStr || !weekStr) return false;
      const d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return false;
      const parts = weekStr.split("-W");
      if (parts.length !== 2) return false;
      const year = parseInt(parts[0], 10);
      const week = parseInt(parts[1], 10);
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dayOfWeek = simple.getDay();
      const ISOweekStart = simple;
      if (dayOfWeek <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
      } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
      }
      const ISOweekEnd = new Date(ISOweekStart);
      ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
      const dTime = d.getTime();
      const startTime = new Date(ISOweekStart.toISOString().split("T")[0] + "T00:00:00").getTime();
      const endTime = new Date(ISOweekEnd.toISOString().split("T")[0] + "T23:59:59").getTime();
      return dTime >= startTime && dTime <= endTime;
    };
    
    return list.filter(m => isDateInISOWeek(m.fecha, activeWeeklyPlan.semana));
  }, [team.nombre, activeWeeklyPlan]);

  const realCargaTotal = useMemo(() => {
    const list = RendimientoStore.get<any[]>("cargas_entrenamiento", []);
    const playerIds = teamPlayers.map(p => p.id);
    const teamLoads = list.filter(l => playerIds.includes(l.jugadorId));
    return teamLoads.reduce((acc, cur) => acc + (Number(cur.cargaInterna) || 0), 0);
  }, [teamPlayers]);

  const filteredPlans = useMemo(() => {
    const clean = (s: string = "") => s.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/futbol|fútbol|basquetbol|basquetbol|voleibol|elite|élite/g, "");
    const isSameTeam = (a: string = "", b: string = "") => {
      const ca = clean(a);
      const cb = clean(b);
      return ca === cb || ca.includes(cb) || cb.includes(ca);
    };
    let list = plans.filter(p => isSameTeam(p.equipo, team.nombre));
    if (list.length === 0) {
      if (team.nombre.toLowerCase().includes("13") || team.nombre.toLowerCase() === "u13") {
        list = plans.filter(p => p.id.includes("sub13"));
      } else if (team.nombre.toLowerCase().includes("15")) {
        list = plans.filter(p => p.id.includes("sub15"));
      }
    }
    return list.length > 0 ? list : [plans[0]].filter(Boolean);
  }, [plans, team.nombre]);

  // Temporada Phases State (localStorage)
  const [annualPhases, setAnnualPhases] = useState(() => {
    const INITIAL_PHASES = [
      { nombre: "Pretemporada", inicio: "2026-01-06", fin: "2026-01-31", notas: "Evaluaciones físicas y tests iniciales.", estado: "Terminado" },
      { nombre: "Temporada Baja", inicio: "2026-02-01", fin: "2026-03-31", notas: "Construcción física y táctica grupal.", estado: "Terminado" },
      { nombre: "Liga Nacional", inicio: "2026-04-01", fin: "2026-07-15", notas: "Fase competitiva regular y torneo oficial.", estado: "Terminado" },
      { nombre: "Vacaciones", inicio: "2026-07-16", fin: "2026-07-31", notas: "Receso de invierno y campamentos libres.", estado: "Terminado" },
      { nombre: "Campamento", inicio: "2026-08-01", fin: "2026-08-07", notas: "Refuerzo técnico específico individual.", estado: "Terminado" },
      { nombre: "Copa Nacional", inicio: "2026-08-08", fin: "2026-10-31", notas: "Eliminatorias directas e inter-sedes.", estado: "En Curso" },
      { nombre: "Evaluaciones", inicio: "2026-11-01", fin: "2026-11-15", notas: "Cierre técnico y feedback individual.", estado: "Próximamente" },
      { nombre: "Tests Físicos", inicio: "2026-11-16", fin: "2026-11-30", notas: "Evaluación de progresiones anuales.", estado: "Próximamente" },
      { nombre: "Fin de Temporada", inicio: "2026-12-01", fin: "2026-12-31", notas: "Cierre del ciclo académico anual.", estado: "Próximamente" },
    ];
    if (typeof window === "undefined") return INITIAL_PHASES;
    const raw = localStorage.getItem("deportivos_annual_phases");
    if (!raw) {
      localStorage.setItem("deportivos_annual_phases", JSON.stringify(INITIAL_PHASES));
      return INITIAL_PHASES;
    }
    return JSON.parse(raw);
  });

  const saveAnnualPhases = (newPhases: any[]) => {
    setAnnualPhases(newPhases);
    localStorage.setItem("deportivos_annual_phases", JSON.stringify(newPhases));
  };

  const [openEditPhase, setOpenEditPhase] = useState(false);
  const [editingPhaseIdx, setEditingPhaseIdx] = useState<number | null>(null);
  const [phaseName, setPhaseName] = useState("");
  const [phaseStart, setPhaseStart] = useState("");
  const [phaseEnd, setPhaseEnd] = useState("");
  const [phaseNotas, setPhaseNotas] = useState("");
  const [phaseStatus, setPhaseStatus] = useState("");

  const handleEditPhaseClick = (idx: number) => {
    const phase = annualPhases[idx];
    if (!phase) return;
    setEditingPhaseIdx(idx);
    setPhaseName(phase.nombre);
    setPhaseStart(phase.inicio);
    setPhaseEnd(phase.fin);
    setPhaseNotas(phase.notes || phase.notas || "");
    setPhaseStatus(phase.estado || "Próximamente");
    setOpenEditPhase(true);
  };

  const handleSavePhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPhaseIdx === null) return;
    const updated = [...annualPhases];
    updated[editingPhaseIdx] = {
      ...updated[editingPhaseIdx],
      nombre: phaseName,
      inicio: phaseStart,
      fin: phaseEnd,
      notas: phaseNotas,
      estado: phaseStatus
    };
    saveAnnualPhases(updated);
    setOpenEditPhase(false);
    toast.success("Fase de temporada modificada correctamente.");
  };

  const handleExportSeasonPdf = () => {
    if ((window as any).__exportingSeasonPdf) return;
    (window as any).__exportingSeasonPdf = true;
    setTimeout(() => {
      (window as any).__exportingSeasonPdf = false;
    }, 1000);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Por favor, permite las ventanas emergentes para exportar el PDF.");
      return;
    }

    const phasesHtml = annualPhases.map(p => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin: 0 0 5px 0; color: #1e293b;">${p.nombre}</h3>
        <p style="margin: 0; font-size: 13px; color: #64748b;">${p.inicio.split("-").reverse().join("/")} al ${p.fin.split("-").reverse().join("/")}</p>
        ${p.notas ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #475569;"><strong>Notas:</strong> ${p.notas}</p>` : ""}
        <p style="margin: 5px 0 0 0; font-size: 12px;"><strong>Estado:</strong> ${p.estado}</p>
      </div>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Planificación de Temporada - ${team.nombre}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            h1 { color: #581c87; margin-bottom: 10px; }
            h2 { color: #6b21a8; margin-top: 0; font-weight: normal; font-size: 18px; margin-bottom: 30px; }
            .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Planificación Anual de Temporada 2026</h1>
            <h2>Equipo: ${team.nombre} | Academia DeportivOS</h2>
          </div>
          <div>
            ${phasesHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAddExerciseField = () => {
    setPlanExercises(prev => [...prev, { id: `ex_${Date.now()}_${Math.random()}`, nombre: "", duracion: 15 }]);
  };

  const handleRemoveExerciseField = (id: string) => {
    if (planExercises.length <= 1) return;
    setPlanExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const handleExerciseChange = (id: string, field: "nombre" | "duracion", value: any) => {
    setPlanExercises(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.nombre);
    setPlanStart(plan.fecha_inicio);
    setPlanEnd(plan.fecha_fin);
    setPlanObjectives(plan.objetivos || "");
    setPlanExercises(plan.ejercicios && plan.ejercicios.length > 0 ? plan.ejercicios.map((ex: any) => ({
      id: ex.id,
      nombre: ex.nombre,
      duracion: ex.duracion
    })) : [{ id: "ex_1", nombre: "", duracion: 15 }]);
    setOpenCreatePlan(true);
  };

  const [openEditWeekly, setOpenEditWeekly] = useState(false);
  const [weeklyResponsable, setWeeklyResponsable] = useState("");
  const [weeklyObjetivo, setWeeklyObjetivo] = useState("");
  const [weeklyActividades, setWeeklyActividades] = useState<any[]>([]);

  const handleEditWeeklyClick = () => {
    if (!activeWeeklyPlan) return;
    setWeeklyResponsable(activeWeeklyPlan.responsable);
    setWeeklyObjetivo(activeWeeklyPlan.objetivo);
    setWeeklyActividades(activeWeeklyPlan.actividades.map(a => ({ ...a })));
    setOpenEditWeekly(true);
  };

  const handleSaveWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWeeklyPlan) return;
    const updated: any = {
      ...activeWeeklyPlan,
      responsable: weeklyResponsable,
      objetivo: weeklyObjetivo,
      actividades: weeklyActividades
    };
    TacticalStore.saveWeeklyPlan(updated);
    toast.success("Planificación semanal actualizada correctamente");
    setOpenEditWeekly(false);
    window.dispatchEvent(new Event("organizacionChanged"));
  };

  const updateActivity = (dayIdx: number, field: string, value: any) => {
    setWeeklyActividades(prev => prev.map(a => a.dia === dayIdx ? { ...a, [field]: value } : a));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName || !planStart || !planEnd) {
      toast.error("Por favor completa los campos requeridos (Nombre, Fecha Inicio y Fin).");
      return;
    }

    const newPlan = {
      id: editingPlanId || `plan_${Date.now()}`,
      nombre: planName,
      fecha_inicio: planStart,
      fecha_fin: planEnd,
      objetivos: planObjectives,
      ejercicios: planExercises.filter(ex => ex.nombre.trim() !== "").map(ex => ({
        id: ex.id,
        nombre: ex.nombre,
        duracion: Number(ex.duracion || 0)
      })),
      equipo: team.nombre,
      organizacion_id: RendimientoStore.getActiveOrganizacionId()
    };

    await RendimientoStore.addPlanificacion(newPlan);
    toast.success(editingPlanId ? "Planificación de microciclo modificada con éxito." : "Planificación de microciclo guardada exitosamente.");
    setOpenCreatePlan(false);
    // Reset fields
    setEditingPlanId(null);
    setPlanName("");
    setPlanStart("");
    setPlanEnd("");
    setPlanObjectives("");
    setPlanExercises([{ id: "ex_1", nombre: "", duracion: 15 }]);
  };

  const activeBlock = useMemo(() => {
    if (tab === "plantilla" || tab === "playeros") return "plantilla";
    if (tab === "planificacion" || tab === "entrenamientos") return "planificacion";
    if (tab === "partidos" || tab === "convocatorias" || tab === "estadisticas") return "partidos";
    return "cancha";
  }, [tab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-10 w-10 border rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {team.nombre}
              <Badge variant="outline" className="border-primary/30 text-primary">{team.disciplina}</Badge>
            </h1>
            <p className="text-sm text-muted-foreground">Categoría: {teamCategory} · Entrenador: {teamCoach}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              navigate({
                to: "/entrenamientos",
                search: { autostart: "true", teamName: team.nombre, category: team.categoria || team.nombre } as any,
              });
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[11px] sm:text-xs min-h-[36px] h-auto py-2 px-3 sm:px-4 rounded-xl gap-1.5 shadow-md uppercase tracking-wider leading-tight whitespace-normal text-center flex items-center justify-center"
          >
            <Play className="h-4 w-4 shrink-0" />
            <span>⚽ Iniciar Entrenamiento en Cancha</span>
          </Button>

          <Badge className="bg-success/10 text-success border-success/20">
            Asistencia Prom: {(() => {
              const list = RendimientoStore.getAsistencias().filter(a => a.equipo === team.nombre);
              if (list.length === 0) return "Sin datos";
              const total = list.reduce((acc, a) => {
                const vals = Object.values(a.registro || {});
                const p = vals.filter(v => v === "P" || v === "T").length;
                return acc + (vals.length > 0 ? (p / vals.length) * 100 : 0);
              }, 0);
              return `${Math.round(total / list.length)}%`;
            })()}
          </Badge>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            Wellness Prom: {(() => {
              const playerIds = new Set(teamPlayers.map(p => p.id));
              const wells = RendimientoStore.getWellness().filter(w => playerIds.has(w.jugadorId));
              if (wells.length === 0) return "Sin datos";
              const avg = wells.reduce((acc, w) => acc + calcWellnessScore(w), 0) / wells.length;
              return `${avg.toFixed(1)}/10`;
            })()}
          </Badge>
        </div>
      </div>

      {/* Main Tabs - 4 Bloques Operativos Limpios */}
      <Tabs value={activeBlock} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto gap-1.5 bg-muted/70 p-1.5 rounded-2xl border border-border/60">
          <TabsTrigger value="cancha" className="text-xs py-2.5 font-bold flex items-center justify-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <ClipboardCheck className="h-4 w-4 shrink-0" />
            <span>1. Cancha & Asistencia</span>
          </TabsTrigger>
          <TabsTrigger value="plantilla" className="text-xs py-2.5 font-bold flex items-center justify-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Users className="h-4 w-4 shrink-0" />
            <span>2. Plantilla & Jugadores</span>
          </TabsTrigger>
          <TabsTrigger value="planificacion" className="text-xs py-2.5 font-bold flex items-center justify-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <BookOpen className="h-4 w-4 shrink-0" />
            <span>3. Planificación & Sesiones</span>
          </TabsTrigger>
          <TabsTrigger value="partidos" className="text-xs py-2.5 font-bold flex items-center justify-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Trophy className="h-4 w-4 shrink-0" />
            <span>4. Convocatorias & Partidos</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. CANCHA & ASISTENCIA BLOCK */}
        <TabsContent value="cancha" className="mt-4 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jugadores Activos</p>
                  <p className="text-xl font-bold">{teamPlayers.length} atletas</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Presentes Hoy</p>
                  <p className="text-xl font-bold">0% asistencia</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Próximo Partido</p>
                  <p className="text-sm font-semibold truncate max-w-[150px]">Sin programar</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado Físico Prom</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">Sin pruebas</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">Actividad Reciente del Equipo</CardTitle>
              <CardDescription>Resumen de las últimas 3 sesiones de trabajo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aún no hay entrenamientos ni actividad registrada recientemente para este equipo.
                </p>
              ) : (
                teamSessions.slice(0, 3).map((s, idx) => (
                  <div 
                    key={s.id} 
                    className={`border-l-2 pl-4 py-1 space-y-1 ${idx === 0 ? "border-primary" : "border-muted-foreground/30"}`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {s.fecha} {s.hora ? `· ${s.hora}` : ""}
                    </p>
                    <p className="text-sm font-semibold">{s.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Sesión de tipo {s.tipo} · Duración: {s.duracion} min. {s.rpe ? `· RPE: ${s.rpe}/10` : ""}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sub-navegación dentro de Cancha & Asistencia */}
          <div className="border-t border-border/60 pt-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Pase de Asistencia & Registro de Sesión
              </h3>
            </div>
            
            {/* Formulario de Asistencia Rápida y Tests Incorporado */}
            <div className="space-y-6">
              {/* Selector de Fecha y Estado */}
              <div className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Sesión Activa de Cancha</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Marca asistencias, RPE, Wellness y pruebas físicas en menos de 10 segundos.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    value={attendanceDate} 
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-auto text-xs h-9 font-semibold"
                  />
                  {hasSavedAttendance && !isEditingHistory ? (
                    <Button size="sm" variant="outline" onClick={() => setIsEditingHistory(true)} className="text-xs h-9 font-semibold">
                      Editar asistencia
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleSaveAttendance(false)} className="bg-gradient-primary text-xs h-9 font-semibold">
                      Guardar Asistencia
                    </Button>
                  )}
                </div>
              </div>

              {/* Tabla de Pase de Lista */}
              <Card className={`shadow-card overflow-hidden transition-all duration-350 ${hasSavedAttendance && !isEditingHistory ? "opacity-75 bg-muted/5 border-dashed" : "opacity-100 bg-card"}`}>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Jugador</TableHead>
                      <TableHead>Asistencia</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>Wellness Diario</span>
                          {hasWellnessOnThisDay && (
                            <Button size="xs" variant="outline" onClick={handleClearAllWellness} className="h-5 px-1.5 text-[9px] font-bold border-red-500/30 text-red-600 bg-red-500/5">Quitar</Button>
                          )}
                          <Button size="xs" variant="outline" onClick={handleMarkAllWellness} className="h-5 px-1.5 text-[9px] font-bold border-emerald-500/30 text-emerald-600 bg-emerald-500/5">Marcar Todos</Button>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span>Pruebas Físicas</span>
                          {hasTestsOnThisDay && (
                            <Button size="xs" variant="outline" onClick={handleClearAllTests} className="h-5 px-1.5 text-[9px] font-bold border-red-500/30 text-red-600 bg-red-500/5">Quitar</Button>
                          )}
                          <Button size="xs" variant="outline" onClick={handleMarkAllTests} className="h-5 px-1.5 text-[9px] font-bold border-violet-500/30 text-violet-600 bg-violet-500/5">Marcar Todos</Button>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamPlayers.map((p) => {
                      const todayStr = attendanceDate || new Date().toISOString().split("T")[0];
                      const wellReg = RendimientoStore.getWellness().find(w => w.jugadorId === p.id && w.fecha === todayStr);
                      const testReg = savedTests.find(t => t.jugadorId === p.id && t.fecha === todayStr);

                      return (
                        <TableRow key={p.id} className={hasSavedAttendance && !isEditingHistory ? "hover:bg-transparent" : ""}>
                          <TableCell className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={p.avatar} />
                              <AvatarFallback>{p.nombre[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-foreground">{p.nombre}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(["P", "T", "A", "J"] as const).map((opt) => {
                                const isSel = attendance[p.id] === opt;
                                const colors: Record<string, string> = {
                                  P: "bg-success text-success-foreground",
                                  T: "bg-warning text-warning-foreground",
                                  A: "bg-destructive text-destructive-foreground",
                                  J: "bg-blue-500 text-white",
                                };
                                const isDisabled = hasSavedAttendance && !isEditingHistory;
                                return (
                                  <button
                                    key={opt}
                                    disabled={isDisabled}
                                    onClick={() => setAttendance(prev => ({ ...prev, [p.id]: opt }))}
                                    className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                                      isDisabled 
                                        ? isSel ? `${colors[opt]} opacity-40 cursor-not-allowed` : "bg-muted/20 text-muted-foreground/20 cursor-not-allowed"
                                        : isSel ? colors[opt] : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {wellReg && wellReg.id ? (
                              <Badge onClick={() => handleOpenWellnessModal(p)} className="text-[10px] font-bold px-2 py-0.5 border cursor-pointer bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                🟢 {wellReg.score ?? wellReg.promedio ?? (wellReg.sueñoCalidad ? Math.round((wellReg.sueñoCalidad / 5) * 100) : 85)}%
                              </Badge>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleOpenWellnessModal(p)} className="h-7 text-[10px] font-semibold text-primary hover:bg-primary/5 px-2">
                                Encuestar
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {testReg ? (
                              <Badge onClick={() => handleOpenTestModal(p)} className="text-[10px] font-bold px-2 py-0.5 border cursor-pointer bg-amber-500/10 text-amber-500 border-amber-500/20">
                                🏃 {testReg.tipoTest.includes("Velocidad") ? "30m" : "Test"}: {testReg.resultado} {testReg.unidad.substring(0, 3)}.
                              </Badge>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => handleOpenTestModal(p)} className="h-7 text-[10px] font-semibold text-purple-400 hover:bg-purple-500/5 px-2">
                                + Test
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 2. PLANTILLA TAB & CARNETS */}
        <TabsContent value="plantilla" className="mt-4 space-y-4">
          <div className="flex border-b border-border/80 mb-4 overflow-x-auto select-none">
            <button
              onClick={() => handleTabChange("plantilla")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition shrink-0",
                tab !== "playeros" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              👥 Lista de Jugadores ({teamPlayers.length})
            </button>
            <button
              onClick={() => handleTabChange("playeros")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition shrink-0",
                tab === "playeros" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              🆔 Carnets & Player OS
            </button>
          </div>

          {tab === "playeros" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" /> Carnets Pro Holográficos & Licencias del Equipo
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Acreditaciones oficiales para competencia y control en cancha para {team.nombre}.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1 text-xs font-bold">
                  <Printer className="h-4 w-4 text-primary" /> Imprimir Carnets del Equipo
                </Button>
              </div>

              {teamPlayers.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">Aún no hay jugadores registrados en la plantilla de este equipo.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {teamPlayers.map((p) => (
                    <Card key={p.id} className="p-4 bg-slate-950/5 dark:bg-slate-950 border border-border/80 shadow-md rounded-2xl">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
                          Pase Oficial Atleta
                        </span>
                        <Link
                          to="/jugadores/$id"
                          params={{ id: p.id }}
                          className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                        >
                          Ver Player OS <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                      <CarnetJugadorPremium
                        jugador={{
                          id: p.id,
                          nombre: p.nombre,
                          identificacion: p.identificacion,
                          avatar: p.avatar,
                          disciplina: team.disciplina || "Fútbol",
                          categoria: teamCategory,
                          sede: "Sede Central",
                          edad: p.edad,
                          posicion: p.posicion || "Jugador de Campo",
                          saldo: p.saldo || 0,
                        }}
                        equipo={team.nombre}
                        numero={p.numero || (hash(p.id + "num") % 98) + 1}
                        entrenador={teamCoach}
                        estadoOp={p.estadoPago === "al_dia" ? "habilitado" : "aviso"}
                        token={`ATH-${p.id}`}
                      />
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Plantilla del Equipo ({teamPlayers.length})</h3>
                <Button onClick={handleOpenPlayerCreate} size="sm" className="bg-primary hover:bg-primary/95 text-white gap-1 text-xs">
                  <Plus className="h-4 w-4" /> Nuevo jugador
                </Button>
              </div>
              <Card className="shadow-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Jugador</TableHead>
                      <TableHead>Identificación</TableHead>
                      <TableHead>Posición</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Estado Pago</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamPlayers.map((p) => {
                      return (
                        <TableRow 
                          key={p.id}
                          className="cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => navigate({ to: "/jugadores/$id", params: { id: p.id } })}
                        >
                          <TableCell className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={p.avatar} />
                              <AvatarFallback>{p.nombre[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold flex items-center gap-1.5">
                                {p.nombre}
                                {(() => {
                                  const sem = playerLoadsMap.get(p.id);
                                  if (sem === "rojo") return <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Riesgo Alto" />;
                                  if (sem === "amarillo") return <span className="inline-block h-2 w-2 rounded-full bg-amber-500" title="Sobrecarga" />;
                                  if (sem === "verde") return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Óptimo" />;
                                  return null;
                                })()}
                              </p>
                              <p className="text-xs text-muted-foreground">{p.correo}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono">{p.identificacion}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-bold">
                              {p.posicion || "DEL"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{p.edad || (p.fechaNacimiento ? RendimientoStore.calcularEdad(p.fechaNacimiento) : "N/A")} años</TableCell>
                          <TableCell>
                            <Badge variant={p.estadoPago === "al_dia" ? "success" : "destructive"} className="text-[10px] capitalize">
                              {p.estadoPago.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Link to="/jugadores/$id" params={{ id: p.id }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted" title="Ver Perfil">
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenPlayerEdit(p)} title="Editar jugador">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => handleDeletePlayer(p.id)} title="Eliminar jugador">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        {/* 3. ASISTENCIA TAB */}
        <TabsContent value="asistencia" className="mt-4 space-y-4">
          <div className="bg-card border rounded-2xl p-5 shadow-elegant flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Pase de Asistencia Rápido</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">Marca los estados de asistencia para la sesión seleccionada.</p>
                {hasSavedAttendance ? (
                  <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15 border-emerald-500/20 text-[10px] py-0.5 px-2">
                    ✓ Guardada anteriormente
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] py-0.5 px-2 border-dashed">
                    ⚠️ Sin registrar
                  </Badge>
                )}
                {!isTrainingDay && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] font-bold">
                    ⚠️ Fuera de Horario (Miércoles y Jueves)
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Fecha:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => {
                    setAttendanceDate(e.target.value);
                    setIsEditingHistory(false);
                  }}
                  className="h-9 px-3 rounded-lg border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
              {hasSavedAttendance && !isEditingHistory ? (
                <Button 
                  onClick={() => setIsEditingHistory(true)} 
                  className="bg-amber-500 hover:bg-amber-600 text-white shadow-elegant text-xs h-9 font-medium"
                >
                  Editar asistencia
                </Button>
              ) : (
                <Button 
                  onClick={() => handleSaveAttendance(false)} 
                  className={`${isEditingHistory ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gradient-primary"} shadow-elegant text-xs h-9 font-medium`}
                >
                  {isEditingHistory ? "Guardar cambios" : "Guardar"}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 items-start">
            <Card className={`shadow-card overflow-hidden lg:col-span-2 transition-all duration-350 ${hasSavedAttendance && !isEditingHistory ? "opacity-60 bg-muted/5 border-dashed" : "opacity-100 bg-card"}`}>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Jugador</TableHead>
                    <TableHead>Asistencia</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1.5 justify-between">
                        <span>Wellness Diario</span>
                        <div className="flex items-center gap-1">
                          {hasWellnessOnThisDay && (
                            <Button 
                              size="xs" 
                              variant="outline" 
                              onClick={handleClearAllWellness}
                              className="h-5 px-1.5 text-[9px] font-bold border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10"
                            >
                              Quitar
                            </Button>
                          )}
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={handleMarkAllWellness}
                            className="h-5 px-1.5 text-[9px] font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
                          >
                            Marcar Todos
                          </Button>
                        </div>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1.5 justify-between">
                        <span>Pruebas Físicas</span>
                        <div className="flex items-center gap-1">
                          {hasTestsOnThisDay && (
                            <Button 
                              size="xs" 
                              variant="outline" 
                              onClick={handleClearAllTests}
                              className="h-5 px-1.5 text-[9px] font-bold border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10"
                            >
                              Quitar
                            </Button>
                          )}
                          <Button 
                            size="xs" 
                            variant="outline" 
                            onClick={handleMarkAllTests}
                            className="h-5 px-1.5 text-[9px] font-bold border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/5 hover:bg-violet-500/10"
                          >
                            Marcar Todos
                          </Button>
                        </div>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamPlayers.map((p) => {
                    const todayStr = attendanceDate || new Date().toISOString().split("T")[0];
                    
                    // Buscar registro de Wellness
                    const wellReg = RendimientoStore.getWellness().find(
                      w => w.jugadorId === p.id && w.fecha === todayStr
                    );

                    // Buscar registro de Pruebas Físicas
                    const testReg = savedTests.find(
                      t => t.jugadorId === p.id && t.fecha === todayStr
                    );

                    return (
                      <TableRow key={p.id} className={hasSavedAttendance && !isEditingHistory ? "hover:bg-transparent" : ""}>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={p.avatar} />
                            <AvatarFallback>{p.nombre[0]}</AvatarFallback>
                          </Avatar>
                          <span className={`text-sm font-semibold transition-colors ${hasSavedAttendance && !isEditingHistory ? "text-muted-foreground" : "text-foreground"}`}>{p.nombre}</span>
                        </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(["P", "T", "A", "J"] as const).map((opt) => {
                            const isSel = attendance[p.id] === opt;
                            const colors: Record<string, string> = {
                              P: "bg-success text-success-foreground hover:bg-success/90",
                              T: "bg-warning text-warning-foreground hover:bg-warning/90",
                              A: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                              J: "bg-blue-500 text-white hover:bg-blue-600",
                            };
                            const isDisabled = hasSavedAttendance && !isEditingHistory;
                            return (
                              <button
                                key={opt}
                                disabled={isDisabled}
                                onClick={() => setAttendance(prev => ({ ...prev, [p.id]: opt }))}
                                className={`h-7 w-7 rounded-lg text-xs font-bold transition-all duration-200 ${
                                  isDisabled 
                                    ? isSel 
                                      ? `${colors[opt]} opacity-30 cursor-not-allowed` 
                                      : "bg-muted/20 text-muted-foreground/20 cursor-not-allowed"
                                    : isSel 
                                      ? colors[opt] 
                                      : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>

                      {/* Celda Wellness en Asistencia */}
                      <TableCell>
                        {wellReg && wellReg.id ? (
                          (() => {
                            const sc = wellReg.score ?? wellReg.promedio ?? (wellReg.sueñoCalidad ? Math.round((wellReg.sueñoCalidad / 5) * 100) : 85);
                            let colorBadge = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                            let label = "🟢";
                            if (sc < 50) {
                              colorBadge = "bg-red-500/10 text-red-500 border-red-500/20";
                              label = "🔴";
                            } else if (sc < 75) {
                              colorBadge = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                              label = "🟡";
                            }
                            return (
                              <Badge 
                                onClick={() => handleOpenWellnessModal(p)}
                                className={`text-[10px] font-bold px-2 py-0.5 border cursor-pointer hover:scale-105 transition-all ${colorBadge}`}
                              >
                                {label} {sc}%
                              </Badge>
                            );
                          })()
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenWellnessModal(p)}
                            className="h-7 text-[10px] font-semibold text-primary hover:bg-primary/5 px-2"
                          >
                            Encuestar
                          </Button>
                        )}
                      </TableCell>

                      {/* Celda Pruebas Físicas en Asistencia */}
                      <TableCell>
                        {testReg ? (
                          (() => {
                            const resVal = Number(testReg.resultado);
                            const name = testReg.tipoTest || "";
                            
                            let colorBadge = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
                            let label = "🟢";

                            if (name.includes("Velocidad")) {
                              // Velocidad 30m: menor tiempo es mejor
                              if (resVal > 5.5) {
                                colorBadge = "bg-red-500/10 text-red-500 border-red-500/20";
                                label = "🔴";
                              } else if (resVal >= 4.6) {
                                colorBadge = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                                label = "🟡";
                              }
                            } else if (name.includes("Yo-Yo") || name.includes("Resistencia")) {
                              // Yo-Yo Test: mayor nivel es mejor
                              if (resVal < 11.0) {
                                colorBadge = "bg-red-500/10 text-red-500 border-red-500/20";
                                label = "🔴";
                              } else if (resVal <= 14.5) {
                                colorBadge = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                                label = "🟡";
                              }
                            } else {
                              // Default para tests personalizados genéricos
                              if (resVal < 6.0) {
                                colorBadge = "bg-red-500/10 text-red-500 border-red-500/20";
                                label = "🔴";
                              } else if (resVal < 12.0) {
                                colorBadge = "bg-amber-500/10 text-amber-500 border-amber-500/20";
                                label = "🟡";
                              }
                            }

                            return (
                              <Badge 
                                onClick={() => handleOpenTestModal(p)}
                                className={`text-[10px] font-bold px-2 py-0.5 border cursor-pointer hover:scale-105 transition-all ${colorBadge}`}
                              >
                                {label} {testReg.tipoTest.includes("Velocidad") ? "🏃" : "🔊"} {testReg.resultado} {testReg.unidad.substring(0, 3)}.
                              </Badge>
                            );
                          })()
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenTestModal(p)}
                            className="h-7 text-[10px] font-semibold text-purple-400 hover:bg-purple-500/5 px-2"
                          >
                            + Test
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Historial de Asistencias</CardTitle>
                <CardDescription>Fechas con pase de lista registrado en este equipo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {teamSavedAttendances.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/5">
                    No hay asistencia guardada para este equipo.
                  </div>
                ) : (
                  teamSavedAttendances.map((a) => (
                    <div key={a.fecha} className="p-3 border rounded-xl flex items-center justify-between text-xs hover:bg-muted/40 transition">
                      <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-foreground">{a.fecha}</p>
                        <p className="text-[10px] text-muted-foreground truncate" title={a.stats}>{a.stats}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAttendanceDate(a.fecha);
                            setIsEditingHistory(true);
                          }}
                          className="h-7 text-[11px] px-2 font-medium"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAttendance(a.fecha)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                          title="Eliminar asistencia"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 4. CHECK-IN QR TAB */}
        <TabsContent value="qr" className="mt-4 max-w-lg mx-auto">
          <Card className="shadow-card">
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <QrCode className="h-6 w-6" />
              </div>
              <CardTitle className="mt-2 text-base">Escanear Check-In QR</CardTitle>
              <CardDescription>Simula el escaneo ingresando el ID del jugador o su código QR.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleQRCheckIn} className="flex gap-2">
                <Input
                  placeholder="ID de jugador, cédula o QR string..."
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                />
                <Button type="submit" className="bg-gradient-primary shadow-elegant">Escanear</Button>
              </form>

              {scannedPlayer && (
                <div className="p-4 border rounded-2xl bg-emerald-500/[0.03] border-emerald-500/20 flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                  <Avatar className="h-12 w-12 border-2 border-emerald-500">
                    <AvatarImage src={scannedPlayer.avatar} />
                    <AvatarFallback>{scannedPlayer.nombre[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{scannedPlayer.nombre}</h4>
                    <p className="text-xs text-muted-foreground">Check-in exitoso en {team.nombre}</p>
                    <Badge variant="success" className="text-[9px] mt-1">Registrado hoy</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLANIFICACIÓN TAB */}
        <TabsContent value="planificacion" className="mt-4 space-y-4">
          {/* Sub-tab navigation inside Planificación */}
          <div className="flex border-b border-border/80 mb-6 overflow-x-auto select-none">
            <button
              onClick={() => setPlanSubTab("semanal")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                planSubTab === "semanal"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-4 w-4" /> Semanal
            </button>
            <button
              onClick={() => setPlanSubTab("microciclos")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                planSubTab === "microciclos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4" /> Microciclos
            </button>
            <button
              onClick={() => setPlanSubTab("mesociclos")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                planSubTab === "mesociclos"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4" /> Mesociclos
            </button>
            <button
              onClick={() => setPlanSubTab("temporada")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition shrink-0 ${
                planSubTab === "temporada"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-4 w-4" /> Temporada
            </button>
          </div>

          {/* 1. SEMANAL SUB-TAB */}
          {planSubTab === "semanal" && activeWeeklyPlan && (
            <div className="space-y-4">
              {/* Estimates Header */}
              <div className="bg-card border rounded-2xl p-5 shadow-elegant flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">Semana {activeWeeklyPlan.semana}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Responsable: <span className="font-semibold text-foreground">{activeWeeklyPlan.responsable}</span> · Categoria: {team.categoria || team.nombre}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="bg-muted/40 border border-border/80 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Carga estimada</p>
                    <p className="text-sm font-black text-primary mt-0.5">{realCargaTotal} UA</p>
                  </div>
                  <div className="bg-muted/40 border border-border/80 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Sesiones</p>
                    <p className="text-sm font-black text-foreground mt-0.5">{realTeamSessions.length}</p>
                  </div>
                  <div className="bg-muted/40 border border-border/80 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Partidos</p>
                    <p className="text-sm font-black text-violet-500 mt-0.5">{realTeamMatches.length}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs ml-auto"
                    onClick={handleEditWeeklyClick}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar Semana
                  </Button>
                </div>
              </div>

              {/* Weekly Day Columns Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3">
                {dayLabels.map((dayLabel, idx) => {
                  const dayAct = activeWeeklyPlan.actividades.find(a => a.dia === idx);
                  const isRest = dayAct?.tipo === "descanso";
                  const isMatch = dayAct?.tipo === "partido";

                  return (
                    <div key={dayLabel} className="bg-card border rounded-2xl p-3 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md transition">
                      <div className="text-center font-bold text-xs pb-2 border-b border-border/60 text-muted-foreground tracking-wider uppercase select-none">
                        {dayLabel}
                      </div>

                      <div className="flex-1 flex flex-col justify-center py-4">
                        {dayAct ? (
                          <div className={`p-2.5 rounded-xl border transition ${
                            isRest ? "bg-muted/40 border-dashed text-muted-foreground" :
                            isMatch ? "bg-violet-500/10 border-violet-500/30 text-violet-400 font-semibold" :
                            dayAct.tipo === "recuperacion" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium" :
                            dayAct.tipo === "video" ? "bg-amber-500/10 border-amber-500/30 text-amber-500 font-medium" :
                            "bg-primary/5 border-primary/20 text-foreground font-medium"
                          }`}>
                            <p className="text-xs line-clamp-3 leading-snug">{dayAct.titulo}</p>
                            {dayAct.hora && (
                              <p className="text-[9px] text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {dayAct.hora} {dayAct.duracion > 0 && `· ${dayAct.duracion} min`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-[10px] text-muted-foreground italic select-none">
                            Sin actividad
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest bg-muted px-2 py-0.5 rounded-md border border-border/40 select-none">
                          {isRest ? "Descanso" : isMatch ? "Competir" : "Entreno"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weekly Observation */}
              <div className="bg-muted/30 border rounded-2xl p-4 flex gap-2.5 items-start text-xs text-muted-foreground">
                <Target className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-foreground">Objetivo Semanal:</span> {activeWeeklyPlan.objetivo}
                </div>
              </div>
            </div>
          )}

          {/* 2. MICROCICLOS SUB-TAB */}
          {planSubTab === "microciclos" && (
            <div className="space-y-4">
              {/* Microciclos Header */}
              <div className="bg-card border rounded-2xl p-5 shadow-elegant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" /> Planificación de Microciclos
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Guía metodológica, objetivos de rendimiento y sesiones planificadas para la semana.
                  </p>
                </div>
                <Button onClick={() => { setPlanTipo("microciclo"); setEditingPlanId(null); setPlanName(""); setPlanStart(""); setPlanEnd(""); setPlanObjectives(""); setPlanExercises([{ id: "ex_1", nombre: "", duracion: 15 }]); setOpenCreatePlan(true); }} className="bg-gradient-primary shadow-elegant text-xs h-9">
                  <Plus className="h-4 w-4 mr-2" /> Nuevo Ciclo
                </Button>
              </div>

              <div className="bg-muted/30 border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Planificación Global de Ciclos
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    ¿Buscas planificar macrociclos, mesociclos globales o calendarios físicos y tácticos avanzados?
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link to="/rendimiento/planificacion" className="inline-flex h-8 items-center justify-center rounded-lg border bg-background px-3 text-xs font-medium hover:bg-muted hover:text-primary transition">
                    Planificación Física (Mesociclos)
                  </Link>
                  <Link to="/tactica/planificacion" className="inline-flex h-8 items-center justify-center rounded-lg border bg-background px-3 text-xs font-medium hover:bg-muted hover:text-primary transition">
                    Planificación Táctica
                  </Link>
                </div>
              </div>

              {teamPlanificaciones.length === 0 ? (
                <Card className="border border-dashed p-10 text-center shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Sin ciclos de entrenamiento</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        Aún no has planificado ningún microciclo para este equipo. Crea un microciclo para organizar las tareas y sesiones.
                      </p>
                    </div>
                    <Button onClick={() => setOpenCreatePlan(true)} variant="outline" className="text-xs h-8">
                      Comenzar planificación
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {teamPlanificaciones.map((plan) => {
                    const totalMins = (plan.ejercicios || []).reduce((acc: number, cur: any) => acc + (Number(cur.duracion) || 0), 0);
                    return (
                      <Card key={plan.id} className="shadow-card border flex flex-col justify-between overflow-hidden group hover:border-primary/30 transition-all duration-300">
                        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-start justify-between gap-2 space-y-0">
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-bold text-foreground truncate" title={plan.nombre}>
                              {plan.nombre}
                            </CardTitle>
                            <CardDescription className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-semibold">
                              <Calendar className="h-3 w-3 shrink-0" />
                              {plan.fechaInicio && plan.fechaFin ? `${plan.fechaInicio} al ${plan.fechaFin}` : "Fecha no definida"}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-muted"
                              onClick={() => {
                                RendimientoStore.deletePlanificacion(plan.id);
                                toast.success("Planificación eliminada");
                                window.dispatchEvent(new Event("organizacionChanged"));
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 pb-5 flex-1 flex flex-col justify-between space-y-4">
                          {plan.objetivos && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Target className="h-3 w-3 text-primary" /> Objetivos de Rendimiento
                              </p>
                              <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg border leading-relaxed">
                                {plan.objetivos}
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                              <span>Sesiones & Tareas ({plan.ejercicios?.length || 0})</span>
                              <span className="text-primary font-bold lowercase">{totalMins} mins</span>
                            </p>
                            <div className="space-y-1.5">
                              {(plan.ejercicios || []).map((ex: any, idx: number) => (
                                <div key={ex.id || idx} className="flex items-center justify-between p-2 rounded-lg bg-card border text-xs hover:bg-muted/10 transition">
                                  <span className="font-medium text-foreground truncate pr-2">
                                    {idx + 1}. {ex.nombre}
                                  </span>
                                  <Badge variant="secondary" className="text-[9px] shrink-0 font-semibold bg-muted text-muted-foreground">
                                    {ex.duracion} min
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. MESOCICLOS SUB-TAB */}
          {planSubTab === "mesociclos" && (
            <div className="space-y-6">
              {/* Mesocycle Overview Card (Image 2) */}
              <Card className="shadow-elegant border bg-card p-5">
                <CardHeader className="pb-3 px-0 pt-0">
                  <div className="flex items-center gap-2 text-primary">
                    <Layers className="h-5 w-5" />
                    <CardTitle className="text-sm font-bold text-white">Plan Metodológico de Mesociclo</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-4">
                  <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-4">
                    <li>Clasificar a la fase final del torneo</li>
                    <li>Mantener ACWR &lt;1.3 en todo el plantel</li>
                    <li>Elevar Sports Score promedio a 90</li>
                  </ul>

                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Bloques de Trabajo</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20 text-amber-500/80">
                        <p className="text-xs font-black">Base Competitiva</p>
                        <p className="text-[9px] font-semibold opacity-80 mt-0.5">Julio</p>
                        <p className="text-[10px] mt-2 font-medium opacity-90">- Construir base física sólida</p>
                      </div>
                      <div className="p-4 rounded-xl border bg-purple-500/5 border-purple-500/20 text-purple-400">
                        <p className="text-xs font-black">Carga Máxima</p>
                        <p className="text-[9px] font-semibold opacity-80 mt-0.5">Agosto</p>
                        <p className="text-[10px] mt-2 font-medium opacity-90">- 4 partidos de liga + Copa</p>
                      </div>
                      <div className="p-4 rounded-xl border bg-blue-500/5 border-blue-500/20 text-blue-400">
                        <p className="text-xs font-black">Descarga</p>
                        <p className="text-[9px] font-semibold opacity-80 mt-0.5">Septiembre</p>
                        <p className="text-[10px] mt-2 font-medium opacity-90">- Recuperación antes de playoffs</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plans List */}
              {filteredPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
                  <div className="bg-muted p-4 rounded-full">
                    <BookOpen className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">No hay currículos registrados para este equipo</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">Crea una nueva planificación para iniciar el control curricular del equipo.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredPlans.map((p, idx) => (
                    <PlanCard
                      key={p.id || idx}
                      plan={p}
                      onEdit={() => toast.info("Por favor, edita los mesociclos globales en la pestaña de Planificación Táctica")}
                      onDelete={() => toast.info("Por favor, gestiona los mesociclos globales en la pestaña de Planificación Táctica")}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. TEMPORADA SUB-TAB */}
          {planSubTab === "temporada" && (
            <div className="space-y-6">
              <Card className="shadow-elegant border bg-card/60 p-6 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-6 px-0 pt-0 border-b border-border/40">
                  <div>
                    <CardTitle className="text-base font-black text-white">Temporada 2026</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">Vista anual de fases y periodos clave</CardDescription>
                  </div>
                  <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExportSeasonPdf(); }} size="sm" variant="outline" className="text-xs gap-1.5 h-8 border-border bg-background hover:bg-muted text-foreground">
                    <FileDown className="h-3.5 w-3.5" /> Exportar PDF
                  </Button>
                </CardHeader>

                <CardContent className="px-0 pb-0 pt-6 space-y-8">
                  {/* Color Categories Legend */}
                  <div className="flex flex-wrap gap-2 select-none justify-start pb-4 border-b border-border/30">
                    {annualPhases.map((phase: any, idx: number) => {
                      let colorClass = "bg-slate-500/10 border-slate-500/20 text-slate-400";
                      if (phase.nombre.includes("Pretemporada")) colorClass = "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
                      else if (phase.nombre.includes("Baja")) colorClass = "bg-blue-500/10 border-blue-500/20 text-blue-400";
                      else if (phase.nombre.includes("Liga")) colorClass = "bg-purple-500/10 border-purple-500/20 text-purple-400";
                      else if (phase.nombre.includes("Vacaciones")) colorClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                      else if (phase.nombre.includes("Campamento")) colorClass = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                      else if (phase.nombre.includes("Copa")) colorClass = "bg-rose-500/10 border-rose-500/20 text-rose-400";
                      else if (phase.nombre.includes("Evaluaciones")) colorClass = "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
                      else if (phase.nombre.includes("Tests")) colorClass = "bg-lime-500/10 border-lime-500/20 text-lime-400";
                      return (
                        <span key={idx} className={`text-[10px] font-bold px-2 py-1 rounded border ${colorClass}`}>
                          {phase.nombre}
                        </span>
                      );
                    })}
                  </div>

                  {/* 12-Month Columns Timeline Grid */}
                  <div className="space-y-4">
                    {/* Month Headers */}
                    <div className="grid grid-cols-12 gap-2 text-center text-xs font-bold text-muted-foreground pb-2 select-none border-b border-border/20">
                      <div>Ene</div>
                      <div>Feb</div>
                      <div>Mar</div>
                      <div>Abr</div>
                      <div>May</div>
                      <div>Jun</div>
                      <div>Jul</div>
                      <div>Ago</div>
                      <div>Sep</div>
                      <div>Oct</div>
                      <div>Nov</div>
                      <div>Dic</div>
                    </div>

                    {/* Timeline Bar Chart */}
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-black text-center text-white select-none">
                      {annualPhases.map((phase: any, idx: number) => {
                        let colSpan = "col-span-1";
                        if (idx === 0) colSpan = "col-span-1"; // Pretemporada (Jan)
                        else if (idx === 1) colSpan = "col-span-2"; // Temporada Baja (Feb-Mar)
                        else if (idx === 2) colSpan = "col-span-3"; // Liga (Apr-Jun)
                        else if (idx === 3) colSpan = "col-span-1"; // Vacaciones (Jul)
                        else if (idx === 4) colSpan = "col-span-1"; // Campamento (Aug)
                        else if (idx === 5) colSpan = "col-span-2"; // Copa (Sep-Oct)
                        else if (idx === 6) colSpan = "col-span-1"; // Evaluaciones (Nov)
                        else if (idx === 7) return null;
                        else if (idx === 8) colSpan = "col-span-1"; // Fin (Dec)

                        let colorBg = "bg-slate-500/20 text-slate-300 border-slate-500/30";
                        if (phase.nombre.includes("Pretemporada")) colorBg = "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
                        else if (phase.nombre.includes("Baja")) colorBg = "bg-blue-500/20 text-blue-300 border-blue-500/30";
                        else if (phase.nombre.includes("Liga")) colorBg = "bg-purple-500/20 text-purple-300 border-purple-500/30";
                        else if (phase.nombre.includes("Vacaciones")) colorBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                        else if (phase.nombre.includes("Campamento")) colorBg = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                        else if (phase.nombre.includes("Copa")) colorBg = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                        else if (phase.nombre.includes("Evaluaciones")) colorBg = "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
                        else if (phase.nombre.includes("Fin")) colorBg = "bg-slate-500/20 text-slate-300 border-slate-500/30";

                        return (
                          <div
                            key={idx}
                            onClick={() => handleEditPhaseClick(idx)}
                            className={`${colSpan} p-2 rounded-lg ${colorBg} border truncate shadow-elegant cursor-pointer hover:opacity-95 hover:scale-[1.02] active:scale-95 transition-all`}
                            title="Haz clic para modificar esta fase"
                          >
                            {phase.nombre}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vertical Phases List with Date Ranges */}
                  <div className="pt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {annualPhases.map((phase: any, idx: number) => {
                      let colorClass = "border-slate-500/20 bg-slate-500/5 text-slate-400";
                      if (phase.nombre.includes("Pretemporada")) colorClass = "border-indigo-500/20 bg-indigo-500/5 text-indigo-400";
                      else if (phase.nombre.includes("Baja")) colorClass = "border-blue-500/20 bg-blue-500/5 text-blue-400";
                      else if (phase.nombre.includes("Liga")) colorClass = "border-purple-500/20 bg-purple-500/5 text-purple-400";
                      else if (phase.nombre.includes("Vacaciones")) colorClass = "border-emerald-500/20 bg-emerald-500/5 text-emerald-400";
                      else if (phase.nombre.includes("Campamento")) colorClass = "border-amber-500/20 bg-amber-500/5 text-amber-400";
                      else if (phase.nombre.includes("Copa")) colorClass = "border-rose-500/20 bg-rose-500/5 text-rose-400";
                      else if (phase.nombre.includes("Evaluaciones")) colorClass = "border-cyan-500/20 bg-cyan-500/5 text-cyan-400";
                      else if (phase.nombre.includes("Tests")) colorClass = "border-lime-500/20 bg-lime-500/5 text-lime-400";

                      return (
                        <div
                          key={idx}
                          onClick={() => handleEditPhaseClick(idx)}
                          className={`p-4 border rounded-2xl ${colorClass} cursor-pointer hover:scale-[1.01] transition-transform`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{phase.nombre}</span>
                            <Badge variant="outline" className="text-[9px] font-semibold">{phase.estado}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {phase.inicio.split("-").reverse().join("/")} al {phase.fin.split("-").reverse().join("/")}
                          </p>
                          {phase.notas && (
                            <p className="text-xs text-foreground mt-2 border-t pt-2 border-border/40 font-medium">
                              {phase.notas}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Dialog para Nuevo Ciclo de Planificación */}
        <Dialog open={openCreatePlan} onOpenChange={setOpenCreatePlan}>
          <DialogContent className="sm:max-w-[520px] bg-background border shadow-elegant text-foreground max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                {editingPlanId ? "Editar Ciclo de Planificación" : "Nuevo Ciclo de Planificación"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Selecciona el tipo de ciclo y define los detalles del plan de entrenamiento para este equipo.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSavePlan} className="space-y-4 pt-2">

              {/* Tipo de Ciclo Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tipo de Ciclo <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["semanal", "microciclo", "mesociclo", "temporada"] as const).map(tipo => {
                    const labels: Record<string, string> = { semanal: "Semanal", microciclo: "Microciclo", mesociclo: "Mesociclo", temporada: "Temporada" };
                    const icons: Record<string, string> = { semanal: "📅", microciclo: "⚡", mesociclo: "🔁", temporada: "📆" };
                    const selected = planTipo === tipo;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setPlanTipo(tipo)}
                        className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 px-1 text-[11px] font-semibold transition-all ${
                          selected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        <span className="text-base">{icons[tipo]}</span>
                        {labels[tipo]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="plan-name" className="text-xs font-semibold">Nombre del Ciclo <span className="text-destructive">*</span></Label>
                <Input
                  id="plan-name"
                  placeholder={planTipo === "semanal" ? "Ej. Semana 2026-W28: Transición" : planTipo === "microciclo" ? "Ej. Microciclo 1: Transición Defensiva" : planTipo === "mesociclo" ? "Ej. Mesociclo 1: Preparación Pretemporada" : "Ej. Temporada 2026-2027"}
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="plan-start" className="text-xs font-semibold">Fecha Inicio <span className="text-destructive">*</span></Label>
                  <Input
                    id="plan-start"
                    type="date"
                    value={planStart}
                    onChange={(e) => setPlanStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="plan-end" className="text-xs font-semibold">Fecha Fin <span className="text-destructive">*</span></Label>
                  <Input
                    id="plan-end"
                    type="date"
                    value={planEnd}
                    onChange={(e) => setPlanEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="plan-obj" className="text-xs font-semibold">Objetivos de Rendimiento</Label>
                <textarea
                  id="plan-obj"
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Ej. Mejorar la transición de ataque a defensa y el repliegue en bloque medio."
                  value={planObjectives}
                  onChange={(e) => setPlanObjectives(e.target.value)}
                />
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Tareas / Ejercicios específicos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddExerciseField} className="h-7 text-[10px] px-2.5">
                    <Plus className="h-3 w-3 mr-1" /> Agregar Ejercicio
                  </Button>
                </div>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {planExercises.map((ex, index) => (
                    <div key={ex.id} className="flex gap-2 items-center">
                      <span className="text-xs font-mono text-muted-foreground w-4">{index + 1}.</span>
                      <Input
                        placeholder="Nombre del ejercicio o tarea"
                        value={ex.nombre}
                        onChange={(e) => handleExerciseChange(ex.id, "nombre", e.target.value)}
                        className="flex-1 text-xs h-8"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <Input
                          type="number"
                          placeholder="Mins"
                          value={ex.duracion || ""}
                          onChange={(e) => handleExerciseChange(ex.id, "duracion", e.target.value)}
                          className="w-16 text-xs h-8 text-center"
                        />
                        <span className="text-[10px] text-muted-foreground">min</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveExerciseField(ex.id)}
                        disabled={planExercises.length <= 1}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button type="button" variant="outline" onClick={() => setOpenCreatePlan(false)} className="text-xs h-9">Cancelar</Button>
                <Button type="submit" className="bg-gradient-primary shadow-elegant text-xs h-9">Guardar Ciclo</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Editar Planificación Semanal */}
        <Dialog open={openEditWeekly} onOpenChange={setOpenEditWeekly}>
          <DialogContent className="sm:max-w-[620px] bg-background border shadow-elegant text-foreground max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Pencil className="h-5 w-5 text-primary" /> Editar Planificación Semanal
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Modifica el responsable, objetivo y actividades de cada día de la semana.
              </DialogDescription>
            </DialogHeader>

            {activeWeeklyPlan && (
              <form onSubmit={handleSaveWeekly} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Responsable</Label>
                    <Input
                      placeholder="Nombre del entrenador"
                      value={weeklyResponsable}
                      onChange={e => setWeeklyResponsable(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Objetivo Semanal</Label>
                    <Input
                      placeholder="Ej. Desarrollo del juego asociativo"
                      value={weeklyObjetivo}
                      onChange={e => setWeeklyObjetivo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t pt-3 space-y-3">
                  <Label className="text-xs font-bold text-foreground">Actividades por día</Label>
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"].map((dayLabel, idx) => {
                      const act = weeklyActividades.find(a => a.dia === idx) || { dia: idx, titulo: "", hora: "", duracion: 0, tipo: "entreno" };
                      return (
                        <div key={idx} className="grid grid-cols-[60px_1fr_90px_120px] gap-2 items-center bg-muted/20 border border-border/40 rounded-xl px-3 py-2">
                          <span className="text-xs font-bold text-muted-foreground">{dayLabel}</span>
                          <Input
                            placeholder="Actividad (ej. Rondo de presión)"
                            value={act.titulo || ""}
                            onChange={e => updateActivity(idx, "titulo", e.target.value)}
                            className="text-xs h-8"
                          />
                          <Input
                            placeholder="HH:MM"
                            value={act.hora || ""}
                            onChange={e => updateActivity(idx, "hora", e.target.value)}
                            className="text-xs h-8 text-center"
                          />
                          <select
                            value={act.tipo || "entreno"}
                            onChange={e => updateActivity(idx, "tipo", e.target.value)}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="entreno">Entreno</option>
                            <option value="partido">Partido</option>
                            <option value="recuperacion">Recuperación</option>
                            <option value="video">Video</option>
                            <option value="descanso">Descanso</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                  <Button type="button" variant="outline" onClick={() => setOpenEditWeekly(false)} className="text-xs h-9">Cancelar</Button>
                  <Button type="submit" className="bg-gradient-primary shadow-elegant text-xs h-9">Guardar Semana</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* 5. ENTRENAMIENTOS TAB */}
        <TabsContent value="entrenamientos" className="mt-4 space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Sesiones Planificadas</CardTitle>
                <CardDescription>Entrenamientos programados para la semana actual.</CardDescription>
              </div>
              <Button asChild size="sm" className="bg-gradient-primary shadow-elegant text-xs h-8">
                <Link to="/entrenamientos">Planificar sesión</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Aún no hay entrenamientos registrados para este equipo.
                </div>
              ) : (
                teamSessions.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border hover:border-primary/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{s.nombre}</span>
                        <Badge className="text-[9px] bg-primary/15 text-primary border-primary/20">{s.objetivo || "Entrenamiento"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.fecha} · {s.hora || "—"} · {s.sede || "—"} · {s.duracion} min</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">Ver detalles</Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. CONFIGURACION DE METRICAS (EVALUACIONES) TAB */}
        <TabsContent value="evaluaciones" className="mt-4 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Panel de Gestión de Wellness */}
            <Card className="shadow-card border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2 text-primary">
                  <Activity className="h-5 w-5" /> Configurar Wellness Diario
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Activa, desactiva o agrega las preguntas que haces a tus jugadores.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                {/* Lista de Métricas Wellness */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {bancoWellness.map((w) => (
                    <div key={w.id} className="p-3 border rounded-xl flex items-center justify-between text-xs bg-muted/10 hover:bg-muted/20 transition">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{w.emoji}</span>
                        <div>
                          <p className="font-bold text-foreground">{w.nombre}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-semibold">Tipo: {w.tipo === "inverso" ? "Inversa (Bajo es mejor)" : "Normal (Alto es mejor)"}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant={w.activo ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleBancoWellness(w.id)}
                        className={`h-7 text-[10px] font-bold px-2.5 transition-all ${
                          w.activo 
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {w.activo ? "Activo" : "Inactivo"}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Formulario Añadir Pregunta Wellness */}
                <form onSubmit={handleAddBancoWellness} className="border-t pt-4 space-y-3">
                  <p className="text-xs font-bold text-foreground">Añadir nueva métrica Wellness</p>
                  <div className="grid grid-cols-[50px_1fr] gap-2">
                    <Input
                      placeholder="Emoji"
                      value={newWellEmoji}
                      onChange={e => setNewWellEmoji(e.target.value)}
                      className="text-center text-sm h-9"
                    />
                    <Input
                      placeholder="Ej. ¿Cómo está tu estado de ánimo?"
                      value={newWellName}
                      onChange={e => setNewWellName(e.target.value)}
                      className="text-xs h-9"
                      required
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <select
                      value={newWellType}
                      onChange={e => setNewWellType(e.target.value)}
                      className="h-9 rounded-lg border border-input bg-background px-3 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                    >
                      <option value="normal">Normal (Alto es mejor)</option>
                      <option value="inverso">Inversa (Bajo es mejor)</option>
                    </select>
                    <Button type="submit" size="sm" className="bg-gradient-primary text-xs h-9 shadow-elegant">
                      + Añadir Métrica
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Panel de Gestión de Pruebas Físicas */}
            <Card className="shadow-card border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2 text-purple-400">
                  <Award className="h-5 w-5" /> Banco de Pruebas Físicas
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Gestiona las pruebas físicas del club (Yo-Yo, velocidad, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                {/* Lista de Pruebas Físicas */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {bancoPruebas.map((p) => (
                    <div key={p.id} className="p-3 border rounded-xl flex items-center justify-between text-xs bg-muted/10 hover:bg-muted/20 transition">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{p.emoji || "🏃"}</span>
                        <div>
                          <p className="font-bold text-foreground">{p.nombre}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-semibold">Unidad: {p.unidad}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBancoPrueba(p.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Formulario Añadir Prueba Física */}
                <form onSubmit={handleAddBancoPrueba} className="border-t pt-4 space-y-3">
                  <p className="text-xs font-bold text-foreground">Crear nueva prueba física</p>
                  <div className="grid grid-cols-[50px_1fr] gap-2">
                    <Input
                      placeholder="Emoji"
                      value={newTestEmoji}
                      onChange={e => setNewTestEmoji(e.target.value)}
                      className="text-center text-sm h-9"
                    />
                    <Input
                      placeholder="Ej. Salto Vertical (Abalakov)"
                      value={newTestName}
                      onChange={e => setNewTestName(e.target.value)}
                      className="text-xs h-9"
                      required
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <Input
                      placeholder="Unidad (segundos, metros, rep.)"
                      value={newTestUnit}
                      onChange={e => setNewTestUnit(e.target.value)}
                      className="text-xs h-9 w-[180px]"
                      required
                    />
                    <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 shadow-elegant">
                      + Crear Test
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

          </div>
        </TabsContent>


        {/* BLOQUE 4: CONVOCATORIAS & PARTIDOS — un solo TabsContent, sub-navegación condicional */}
        <TabsContent value="partidos" className="mt-4 space-y-4">

          {/* Sub-nav */}
          <div className="flex border-b border-border/80 overflow-x-auto select-none">
            <button
              onClick={() => handleTabChange("partidos")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${tab === "partidos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              🏆 Partidos & Resultados
            </button>
            <button
              onClick={() => handleTabChange("convocatorias")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${tab === "convocatorias" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              📋 Convocatorias Oficiales
            </button>
            <button
              onClick={() => handleTabChange("estadisticas")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${tab === "estadisticas" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              📊 Estadísticas del Equipo
            </button>
          </div>

          {/* ── PARTIDOS ── */}
          {tab !== "convocatorias" && tab !== "estadisticas" && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-sm">Calendario de Competición</CardTitle>
                <CardDescription>Partidos e historial de resultados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamMatches.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">No hay partidos registrados para este equipo.</div>
                ) : (
                  teamMatches.map((m, i) => (
                    <div key={i} className="p-4 rounded-xl border flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-sm">vs {m.visitante === team.nombre ? m.local : m.visitante}</h4>
                        <p className="text-xs text-muted-foreground">{m.fecha} · {m.hora || "—"} · Sede: {m.sede || "—"}</p>
                        <Badge variant={!m.resultado ? "secondary" : m.resultado.propio > m.resultado.rival ? "success" : "destructive"} className="text-[9px] mt-1 font-bold">
                          {!m.resultado ? "Pendiente" : m.resultado.propio > m.resultado.rival ? "Ganado" : "Perdido"}
                        </Badge>
                      </div>
                      <span className="font-mono text-sm font-extrabold">
                        {m.resultado ? `${m.resultado.propio} - ${m.resultado.rival}` : "—"}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* ── CONVOCATORIAS ── */}
          {tab === "convocatorias" && (
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">📋 Convocatorias Oficiales</CardTitle>
                  <CardDescription className="text-xs">Cita a los jugadores para los partidos del fin de semana.</CardDescription>
                </div>
                <Button size="sm" className="bg-gradient-primary shadow-elegant text-xs h-8 gap-1.5" onClick={handleOpenConvoc}>
                  <Plus className="h-3.5 w-3.5" /> Crear convocatoria
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {teamConvocatorias.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">📋</div>
                    <p className="text-sm font-semibold text-foreground">Sin convocatorias registradas</p>
                    <p className="text-xs text-muted-foreground max-w-xs">Crea la primera convocatoria para citar a tus jugadores al próximo partido.</p>
                    <Button size="sm" className="bg-gradient-primary text-xs h-8 gap-1.5 mt-1" onClick={handleOpenConvoc}>
                      <Plus className="h-3.5 w-3.5" /> Nueva convocatoria
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamConvocatorias.map((conv: any) => (
                      <div key={conv.id} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/60">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{conv.titulo}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              <span className="text-[11px] text-muted-foreground">📅 {conv.fecha}</span>
                              {(conv.hora_concentracion || conv.hora) && <span className="text-[11px] text-muted-foreground">⏰ {conv.hora_concentracion || conv.hora}</span>}
                              {conv.sede && <span className="text-[11px] text-muted-foreground">📍 {conv.sede}</span>}
                              {conv.rival && <span className="text-[11px] text-muted-foreground">🆚 vs {conv.rival}</span>}
                              {conv.uniforme_local && <span className="text-[11px] text-muted-foreground">👕 {conv.uniforme_local}</span>}
                            </div>
                            {conv.notas && <p className="text-[11px] text-muted-foreground italic mt-1 border-l-2 border-primary/30 pl-2">{conv.notas}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{(conv.jugadores || []).length} convocados</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10" onClick={() => handleDeleteConvoc(conv.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {(conv.jugadores || []).length > 0 && (
                          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {(conv.jugadores || []).map((j: any) => (
                              <div key={j.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-1.5 text-xs">
                                <Avatar className="h-6 w-6 shrink-0">
                                  <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">{(j.nombre || "?")[0]}</AvatarFallback>
                                </Avatar>
                                <span className="truncate font-medium text-foreground text-[11px]">{j.nombre}</span>
                                <Badge variant="outline" className="text-[8px] ml-auto shrink-0">{j.posicion}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── ESTADÍSTICAS ── */}
          {tab === "estadisticas" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="shadow-card">
                <CardContent className="p-5 text-center">
                  <span className="text-xs text-muted-foreground">Efectividad de Victoria</span>
                  <p className="text-3xl font-extrabold text-primary mt-2">0%</p>
                  <span className="text-[10px] text-muted-foreground">0 ganados · 0 perdidos · 0 empates</span>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5 text-center">
                  <span className="text-xs text-muted-foreground">Goles Marcados</span>
                  <p className="text-3xl font-extrabold text-emerald-500 mt-2">0</p>
                  <span className="text-[10px] text-muted-foreground">Promedio: 0 goles por partido</span>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5 text-center">
                  <span className="text-xs text-muted-foreground">Tarjetas Recibidas</span>
                  <p className="text-3xl font-extrabold text-rose-500 mt-2">0</p>
                  <span className="text-[10px] text-muted-foreground">0 amarillas · 0 rojas</span>
                </CardContent>
              </Card>
            </div>
          )}

        </TabsContent>

        {/* 10. PLAYER OS TAB */}
        <TabsContent value="playeros" className="mt-4">
          <Card className="shadow-card p-5">
            <h3 className="text-sm font-semibold mb-4">Portafolio del Atleta (Player OS)</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamPlayers.map((p) => (
                <Link
                  key={p.id}
                  to="/jugadores/$id"
                  params={{ id: p.id }}
                  className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary hover:bg-primary/[0.02] transition"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.avatar} />
                    <AvatarFallback>{p.nombre[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-foreground">{p.nombre}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{p.posicion || "DEL"}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Advertencia de Sobrescritura de Asistencia */}
      <Dialog open={showOverwriteWarning} onOpenChange={setShowOverwriteWarning}>
        <DialogContent className="sm:max-w-[420px] bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-amber-500">
              ⚠️ Registro Existente
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              La asistencia para el equipo <span className="font-semibold text-foreground">{team.nombre}</span> en la fecha <span className="font-semibold text-foreground">{attendanceDate}</span> ya fue guardada previamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-xs text-muted-foreground">
            Para evitar sobreescrituras accidentales, no se puede guardar directamente. Si deseas modificar este pase de lista, por favor ve a la sección de <span className="font-semibold text-foreground">Historial de Asistencias</span> (a la derecha) y haz clic en el botón <span className="font-semibold text-foreground">"Editar"</span> de esa fecha.
          </div>
          <div className="flex justify-end pt-2">
            <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/95" onClick={() => setShowOverwriteWarning(false)}>
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL CREAR CONVOCATORIA ──────────────────────────────── */}
      <Dialog open={openConvoc} onOpenChange={setOpenConvoc}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              📋 Nueva Convocatoria
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cita oficialmente a los jugadores para el próximo compromiso.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveConvoc} className="space-y-4 pt-2">
            {/* Título */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Título / Nombre del partido *</Label>
              <Input
                placeholder="Ej. Partido vs Deportivo Saprissa — Jornada 12"
                value={convocForm.titulo}
                onChange={e => setConvocForm(f => ({ ...f, titulo: e.target.value }))}
                required
                className="text-sm h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Fecha */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Fecha del partido *</Label>
                <Input
                  type="date"
                  value={convocForm.fecha}
                  onChange={e => setConvocForm(f => ({ ...f, fecha: e.target.value }))}
                  required
                  className="text-sm h-9"
                />
              </div>
              {/* Hora concentración */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">⏰ Hora de concentración</Label>
                <Input
                  type="time"
                  value={convocForm.hora_concentracion}
                  onChange={e => setConvocForm(f => ({ ...f, hora_concentracion: e.target.value }))}
                  className="text-sm h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Sede */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">📍 Sede / Estadio</Label>
                <Input
                  placeholder="Ej. Estadio Ricardo Saprissa"
                  value={convocForm.sede}
                  onChange={e => setConvocForm(f => ({ ...f, sede: e.target.value }))}
                  className="text-sm h-9"
                />
              </div>
              {/* Rival */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">🆚 Rival</Label>
                <Input
                  placeholder="Ej. Deportivo Saprissa"
                  value={convocForm.rival}
                  onChange={e => setConvocForm(f => ({ ...f, rival: e.target.value }))}
                  className="text-sm h-9"
                />
              </div>
            </div>

            {/* Uniforme */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">👕 Uniforme</Label>
              <Input
                placeholder="Ej. Camiseta azul, short blanco, medias azules"
                value={convocForm.uniforme_local}
                onChange={e => setConvocForm(f => ({ ...f, uniforme_local: e.target.value }))}
                className="text-sm h-9"
              />
            </div>

            {/* Notas */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">📝 Notas / Instrucciones</Label>
              <textarea
                placeholder="Ej. Traer botines limpios. El bus sale a las 7:30am."
                value={convocForm.notas}
                onChange={e => setConvocForm(f => ({ ...f, notas: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground resize-none"
              />
            </div>

            {/* Selección de jugadores */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">👥 Jugadores convocados ({convocSelectedIds.size} / {teamPlayers.length})</Label>
                <button
                  type="button"
                  className="text-[10px] font-bold text-primary hover:underline"
                  onClick={() => {
                    if (convocSelectedIds.size === teamPlayers.length) {
                      setConvocSelectedIds(new Set());
                    } else {
                      setConvocSelectedIds(new Set(teamPlayers.map((p: any) => p.id)));
                    }
                  }}
                >
                  {convocSelectedIds.size === teamPlayers.length ? "Deseleccionar todos" : "Seleccionar todos"}
                </button>
              </div>
              <div className="border rounded-xl overflow-hidden divide-y divide-border max-h-[220px] overflow-y-auto">
                {teamPlayers.map((p: any) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition ${convocSelectedIds.has(p.id) ? "bg-primary/5" : "hover:bg-muted/40"}`}
                  >
                    <input
                      type="checkbox"
                      checked={convocSelectedIds.has(p.id)}
                      onChange={() => toggleConvocPlayer(p.id)}
                      className="accent-primary h-4 w-4 rounded"
                    />
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-bold">{p.nombre[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-foreground flex-1">{p.nombre}</span>
                    <Badge variant="outline" className="text-[9px]">{p.posicion || "DEL"}</Badge>
                  </label>
                ))}
                {teamPlayers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No hay jugadores en la plantilla.</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenConvoc(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-primary gap-1.5" disabled={convocLoading}>
                {convocLoading ? "Guardando..." : "✓ Publicar convocatoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* ──────────────────────────────────────────────────────────── */}

      {/* Modal Cuestionario Wellness Asistido 1 a 1 (Paso 3) */}
      <Dialog open={openWellnessModal} onOpenChange={setOpenWellnessModal}>
        <DialogContent className="sm:max-w-[480px] bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Activity className="h-5 w-5 text-primary animate-pulse" /> Wellness Diario Asistido
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Encuesta de bienestar rápida para el día de hoy. Pregunta directamente al jugador.
            </DialogDescription>
          </DialogHeader>

          {wellnessPlayer && (
            <form onSubmit={handleSaveWellness} className="space-y-5 pt-2">
              {/* Info del Jugador */}
              <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border/60 rounded-xl">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={wellnessPlayer.avatar} />
                  <AvatarFallback>{wellnessPlayer.nombre[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-foreground">{wellnessPlayer.nombre}</p>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{wellnessPlayer.posicion || "DEL"} · Edad: {wellnessPlayer.edad} años</p>
                </div>
              </div>

              {/* Preguntas rápidas 1-5 dinámicas */}
              <div className="space-y-4">
                {bancoWellness.filter(w => w.activo).map((question) => {
                  let currentValue = 3;
                  let setValue = (v: number) => {};
                  
                  if (question.id === "w_sueno") {
                    currentValue = wellSueño;
                    setValue = setWellSueño;
                  } else if (question.id === "w_fatiga") {
                    currentValue = wellFatiga;
                    setValue = setWellFatiga;
                  } else if (question.id === "w_dolor") {
                    currentValue = wellDolor;
                    setValue = setWellDolor;
                  } else if (question.id === "w_estres") {
                    currentValue = wellEstres;
                    setValue = setWellEstres;
                  }

                  const options = question.tipo === "inverso" ? [
                    { v: 1, l: "Ninguna" },
                    { v: 2, l: "Leve" },
                    { v: 3, l: "Moderada" },
                    { v: 4, l: "Alta" },
                    { v: 5, l: "Muy Alta" }
                  ] : [
                    { v: 1, l: "Muy Malo" },
                    { v: 2, l: "Malo" },
                    { v: 3, l: "Regular" },
                    { v: 4, l: "Bueno" },
                    { v: 5, l: "Excelente" }
                  ];

                  return (
                    <div key={question.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-foreground">{question.emoji || "❓"} {question.nombre}</span>
                        <span className="text-muted-foreground uppercase text-[10px]">
                          {question.tipo === "inverso" ? "Bajo es mejor" : "Alto es mejor"}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {options.map((opt) => (
                          <Button
                            key={opt.v}
                            type="button"
                            variant={currentValue === opt.v ? (question.tipo === "inverso" ? "destructive" : "default") : "outline"}
                            className={`h-9 text-[10px] font-bold transition-all px-1 ${
                              currentValue === opt.v 
                                ? (question.tipo === "inverso" ? "bg-red-500 text-white border-red-600 hover:bg-red-600" : "bg-primary text-primary-foreground")
                                : "hover:bg-primary/5 border-border/80"
                            }`}
                            onClick={() => setValue(opt.v)}
                          >
                            {opt.v} <span className="text-[8px] font-normal block opacity-85 ml-1">{opt.l.split(" ")[0]}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Score de Bienestar Resultante Proyectado */}
              {(() => {
                const tempScore = calcWellnessScore({
                  sueñoCalidad: wellSueño,
                  dolorMuscular: wellDolor,
                  estres: wellEstres,
                  animo: 4,
                  energia: 4,
                  motivacion: 4
                });
                let textClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                let textLabel = "🟢 Óptimo (Listo para entrenar al máximo)";
                if (tempScore < 50) {
                  textClass = "text-red-500 bg-red-500/10 border-red-500/20";
                  textLabel = "🔴 Riesgo (Bajar intensidad / Carga diferenciada)";
                } else if (tempScore < 75) {
                  textClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
                  textLabel = "🟡 Precaución (Monitorear y evaluar)";
                }
                return (
                  <div className={`p-3 border rounded-xl flex items-center justify-between text-xs font-bold ${textClass}`}>
                    <span>{textLabel}</span>
                    <span className="text-sm font-black">{tempScore}% Score</span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button type="button" variant="outline" onClick={() => setOpenWellnessModal(false)} className="text-xs h-9">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-primary shadow-elegant text-xs h-9">
                  Guardar Bienestar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cuestionario Test Físico (Paso 4) */}
      <Dialog open={openTestModal} onOpenChange={setOpenTestModal}>
        <DialogContent className="sm:max-w-[420px] bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Award className="h-5 w-5 text-purple-400" /> Registrar Prueba Física
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ingresa el desempeño físico del jugador para el día de hoy.
            </DialogDescription>
          </DialogHeader>

          {testPlayer && (
            <form onSubmit={handleSaveTest} className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 bg-muted/40 border border-border/60 rounded-xl">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={testPlayer.avatar} />
                  <AvatarFallback>{testPlayer.nombre[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-bold text-foreground">{testPlayer.nombre}</p>
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">{testPlayer.posicion || "DEL"}</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tipo de Prueba</Label>
                <select
                  value={testType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTestType(val);
                  }}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-semibold"
                >
                  {(() => {
                    const DEFAULT_CATALOG = ["Sprint 30m", "Yo-Yo Test", "Course Navette", "Cooper Test", "Salto Vertical CMJ", "Agilidad T-Test"];
                    const saved = typeof window !== "undefined" ? localStorage.getItem("deportivos_catalogo_pruebas") : null;
                    const list: string[] = saved ? JSON.parse(saved) : DEFAULT_CATALOG;
                    return list.map((testName) => (
                      <option key={testName} value={testName}>🏃 {testName}</option>
                    ));
                  })()}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Resultado de la Marca</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    required
                    placeholder={testType.includes("Velocidad") ? "Ej. 4.50" : "Ej. 15.2"}
                    value={testValue}
                    onChange={(e) => setTestValue(e.target.value)}
                    className="text-xs h-9 pr-14"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-bold text-muted-foreground uppercase">
                    {testUnit}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Notas / Observaciones</Label>
                <Input
                  placeholder="Ej. Excelente esfuerzo final..."
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <Button type="button" variant="outline" onClick={() => setOpenTestModal(false)} className="text-xs h-9">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white shadow-elegant text-xs h-9">
                  Guardar Test
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Nuevo Jugador */}
      <Dialog open={isOpenPlayerCreate} onOpenChange={setIsOpenPlayerCreate}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5 text-primary" /> Registrar Nuevo Jugador
            </DialogTitle>
            <DialogDescription>
              Agrega un atleta directamente a la plantilla del equipo {team.nombre}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre completo *</label>
              <Input 
                value={playerForm.nombre}
                onChange={e => setPlayerForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej. Renata Acuña Zúñiga"
                className="bg-background border-input text-foreground h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Identificación / Cédula</label>
                <Input 
                  value={playerForm.identificacion}
                  onChange={e => setPlayerForm(f => ({ ...f, identificacion: e.target.value }))}
                  placeholder="Ej. 116630694"
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha de Nacimiento</label>
                <input 
                  type="date"
                  value={playerForm.fechaNacimiento}
                  onChange={e => setPlayerForm(f => ({ ...f, fechaNacimiento: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none animate-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Correo Electrónico</label>
                <Input 
                  type="email"
                  value={playerForm.correo}
                  onChange={e => setPlayerForm(f => ({ ...f, correo: e.target.value }))}
                  placeholder="ejemplo@club.com"
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Teléfono</label>
                <Input 
                  value={playerForm.telefono}
                  onChange={e => setPlayerForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="8888-8888"
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Posición de Juego</label>
                <select 
                  value={playerForm.posicion}
                  onChange={e => setPlayerForm(f => ({ ...f, posicion: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                >
                  <option value="DEL">Delantero (DEL)</option>
                  <option value="MED">Mediocampista (MED)</option>
                  <option value="DEF">Defensa (DEF)</option>
                  <option value="POR">Portero (POR)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado de Pago Inicial</label>
                <select 
                  value={playerForm.estadoPago}
                  onChange={e => setPlayerForm(f => ({ ...f, estadoPago: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                >
                  <option value="al_dia">Al día</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpenPlayerCreate(false)} className="text-xs h-9">
              Cancelar
            </Button>
            <Button onClick={handleSavePlayer} className="bg-primary hover:bg-primary/95 text-white text-xs h-9">
              Registrar Jugador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Jugador */}
      <Dialog open={isOpenPlayerEdit} onOpenChange={setIsOpenPlayerEdit}>
        <DialogContent className="max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Edit className="h-5 w-5 text-primary" /> Editar Datos del Jugador
            </DialogTitle>
            <DialogDescription>
              Modifica la información del atleta seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre completo *</label>
              <Input 
                value={playerForm.nombre}
                onChange={e => setPlayerForm(f => ({ ...f, nombre: e.target.value }))}
                className="bg-background border-input text-foreground h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Identificación / Cédula</label>
                <Input 
                  value={playerForm.identificacion}
                  onChange={e => setPlayerForm(f => ({ ...f, identificacion: e.target.value }))}
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha de Nacimiento</label>
                <input 
                  type="date"
                  value={playerForm.fechaNacimiento}
                  onChange={e => setPlayerForm(f => ({ ...f, fechaNacimiento: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Correo Electrónico</label>
                <Input 
                  type="email"
                  value={playerForm.correo}
                  onChange={e => setPlayerForm(f => ({ ...f, correo: e.target.value }))}
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Teléfono</label>
                <Input 
                  value={playerForm.telefono}
                  onChange={e => setPlayerForm(f => ({ ...f, telefono: e.target.value }))}
                  className="bg-background border-input text-foreground h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Posición de Juego</label>
                <select 
                  value={playerForm.posicion}
                  onChange={e => setPlayerForm(f => ({ ...f, posicion: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                >
                  <option value="DEL">Delantero (DEL)</option>
                  <option value="MED">Mediocampista (MED)</option>
                  <option value="DEF">Defensa (DEF)</option>
                  <option value="POR">Portero (POR)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Estado de Pago</label>
                <select 
                  value={playerForm.estadoPago}
                  onChange={e => setPlayerForm(f => ({ ...f, estadoPago: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                >
                  <option value="al_dia">Al día</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpenPlayerEdit(false)} className="text-xs h-9">
              Cancelar
            </Button>
            <Button onClick={handleSavePlayer} className="bg-primary hover:bg-primary/95 text-white text-xs h-9">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanCard({ plan, onEdit, onDelete }: { plan: any; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(true);

  const cols = [
    { label: "Trabajo de Técnica aplicado", items: plan.contenidos.tecnica, icon: Award, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
    { label: "Táctica individual y colectiva", items: plan.contenidos.tactica, icon: Shield, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { label: "Conceptos básicos parte física", items: plan.contenidos.fisica, icon: Zap, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  ];

  return (
    <Card className="bg-gradient-to-br from-card/90 to-card/60 border border-border/80 hover:border-primary/30 transition-all duration-300 shadow-elegant hover:shadow-xl hover:shadow-primary/5 rounded-2xl overflow-hidden">
      {/* Card Header */}
      <CardHeader className="pb-4 bg-muted/20 border-b border-border/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-elegant">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base text-foreground font-black tracking-tight">{plan.categoria}</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="font-semibold">{plan.equipo}</span>
                <span>•</span>
                <span>Responsable: <span className="text-foreground font-medium">{plan.entrenador}</span></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] py-1 border-border bg-muted/40 font-semibold text-muted-foreground">{plan.creadoEn}</Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-muted transition-all" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Objetivo Format */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-primary/20 text-primary p-1.5 rounded-lg shrink-0">
              <Target className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Objetivo de la Categoría</p>
              <p className="text-sm text-foreground/90 font-medium leading-relaxed">{plan.objetivo}</p>
            </div>
          </div>
        </div>

        {/* Pillars Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cols.map(({ label, items, icon: Icon, color }) => (
            <div key={label} className="bg-muted/10 border border-border/40 rounded-xl p-4 space-y-3 shadow-inner">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-md border ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-black text-foreground tracking-tight leading-snug">{label}</p>
              </div>
              <ul className="space-y-2">
                {items.filter(Boolean).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground group">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary shrink-0 mt-1.5 transition-colors" />
                    <span className="leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Monthly schedules toggler */}
        <div className="border-t border-border/60 pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className="font-bold uppercase tracking-wider text-[11px]">Planes Mensuales ({plan.meses.length})</span>
            </div>
            {expanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
          </button>

          {expanded && (
            <div className="mt-5 space-y-8 animate-fade-in">
              {plan.meses.map((mes: any, mi: number) => (
                <div key={mi} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <h4 className="text-xs font-black text-foreground uppercase tracking-widest">Plan de {mes.mes}</h4>
                    </div>
                    {mes.fechaInicio && mes.fechaFin && (
                      <div className="text-[10px] text-muted-foreground font-semibold bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                        {mes.fechaInicio.split("-").reverse().join("/")} al {mes.fechaFin.split("-").reverse().join("/")}
                      </div>
                    )}
                  </div>

                  {mes.nota && (
                    <div className="flex items-start gap-2.5 text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs leading-relaxed font-bold">
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <div>{mes.nota}</div>
                    </div>
                  )}

                  {/* Kanban Style Grid (Weeks) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mes.semanas.map((s: any, si: number) => {
                      const isRestWeek = mes.mes === "Julio" && si === 2; // matching July week 3

                      return (
                        <div
                          key={si}
                          className={`relative border rounded-xl p-4 shadow-sm transition-all duration-300 ${
                            isRestWeek
                              ? "bg-amber-500/5 border-amber-500/20 text-amber-500/80 shadow-amber-500/5"
                              : "bg-card/40 border-border/60 hover:bg-card/80 hover:border-primary/20"
                          }`}
                        >
                          {/* Diagonal pattern overlay for rest week */}
                          {isRestWeek && (
                            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[size:10px_10px] rounded-xl pointer-events-none" />
                          )}

                          <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Semana # {si + 1}</p>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0.5 border ${
                              isRestWeek
                                ? "border-amber-500/30 text-amber-500 bg-amber-500/10"
                                : "border-border/80 text-muted-foreground bg-muted/30"
                            }`}>
                              {s.semana}
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-foreground font-black leading-snug">{s.enfoque}</p>
                            {s.duracion > 0 && (
                              <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                                {s.duracion} min/sesión
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


