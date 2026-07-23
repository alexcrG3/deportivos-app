import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft, QrCode, MessageSquare, Mail, Phone, Edit, MoreHorizontal,
  Activity, TrendingUp, Trophy, Users, Stethoscope, FileText, Send,
  AlertTriangle, CheckCircle2, Clock, Lock, MapPin, User,
  Plus, Download, Eye, Star, Target, Heart, Pill, ShieldAlert,
  DollarSign, History, Sparkles, ExternalLink, Bell, Info,
  ShieldCheck, BadgeCheck, Trash2, Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, BarChart, Bar, Legend, LineChart, Line
} from "recharts";
import { getPlayerOS, estadoOperativoMeta, formatCRC, encargados, getRiskScore, aiRecomendaciones, aiPredicciones, sedes } from "@/lib/mock-data";
import { toast } from "sonner";
import { CarnetJugadorPremium } from "@/components/carnet/CarnetJugadorPremium";
import { cn } from "@/lib/utils";
import { TacticalStore } from "@/lib/tactical-store";
import RendimientoStore, {
  type Sesion,
  type Ciclo,
  type WellnessRegistro,
  type TestFisico,
  type Lesion,
  sportsScoreLabel,
} from "@/lib/rendimiento-store";

const estadoPagoLabel = {
  al_dia: { label: "Al día", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold" },
  pendiente: { label: "Pendiente", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold" },
  moroso: { label: "Moroso", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold" },
};

function FirmaInitializer({ base64 }: { base64: string }) {
  useEffect(() => {
    const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 500;
    canvas.height = rect.height || 180;

    if (!base64) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = base64;
  }, [base64]);
  return null;
}

export const Route = createFileRoute("/_app/jugadores/$id")({
  validateSearch: () => ({}),
  component: PlayerOS,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-lg font-semibold">Jugador no encontrado</p>
      <Link to="/jugadores" className="mt-3 text-sm text-primary underline">Volver a jugadores</Link>
    </div>
  ),
});

function PlayerOS() {
  const { id } = Route.useParams();
  const data = getPlayerOS(id);
  if (!data) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">No se encontró la información del jugador</p>
        <Link to="/jugadores" className="mt-3 text-sm text-primary underline">Volver a la lista de jugadores</Link>
      </div>
    );
  }
  const { jugador: j, estadoOp: rawEstadoOp, numero, posicionPrincipal, secundarias, posicionCoords, perfil,
    altura, peso, imc, entrenador, equipo, radar, rendimientoMensual, stats, evaluaciones,
    notasEntrenador, objetivos, lesiones, alergias, medicamentos, restriccionesMed,
    condicionesMedicas, contactosEmergencia, seguro, documentos, comunicaciones, historial,
    pagosJugador, token, alertas } = data;
  const estadoOp = (rawEstadoOp && estadoOperativoMeta[rawEstadoOp as keyof typeof estadoOperativoMeta]) ? rawEstadoOp : "habilitado" as const;
  const meta = estadoOperativoMeta[estadoOp as keyof typeof estadoOperativoMeta];
  const encargado = encargados.find((e) => e.jugadorId === j.id);
  const legalConfig = RendimientoStore.getLegalConfig();
  const parentName = j.nombreFirmante || j.encargado || j.madreNombre || j.padreNombre || "—";
  const parentId = j.identificacionFirmante || (j as any).encargadoIdentificacion || "—";

  const renderTextWithPlaceholders = (text: string) => {
    if (!text) return "";
    return text
      .replace(/{nombre}/g, parentName)
      .replace(/{identificacion}/g, parentId);
  };

  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [openFicha, setOpenFicha] = useState(false);
  const [openFichaTecnica, setOpenFichaTecnica] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editNumero, setEditNumero] = useState(0);
  const [editIdentificacion, setEditIdentificacion] = useState("");
  const [editFechaNacimiento, setEditFechaNacimiento] = useState("");
  const [editGenero, setEditGenero] = useState("");
  const [editDisciplina, setEditDisciplina] = useState("");
  const [editCategoria, setEditCategoria] = useState("");
  const [editSedeId, setEditSedeId] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editCorreo, setEditCorreo] = useState("");
  const [editPosicion, setEditPosicion] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  // Nuevos campos unificados
  const [editBarrio, setEditBarrio] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editTelefonoResidencia, setEditTelefonoResidencia] = useState("");
  const [editTipoSangre, setEditTipoSangre] = useState("");
  const [editSeguroEps, setEditSeguroEps] = useState("");
  const [editEnfermedades, setEditEnfermedades] = useState("");
  const [editCirugias, setEditCirugias] = useState("");
  const [editAlergiasInput, setEditAlergiasInput] = useState("");
  const [editLesionesInput, setEditLesionesInput] = useState("");
  const [editInstitucionEducativa, setEditInstitucionEducativa] = useState("");
  const [editGradoActual, setEditGradoActual] = useState("");
  const [editPeso, setEditPeso] = useState<number>(0);
  const [editAltura, setEditAltura] = useState<number>(0);

  // Padres
  const [editPadreNombre, setEditPadreNombre] = useState("");
  const [editPadreOcupacion, setEditPadreOcupacion] = useState("");
  const [editPadreEmpresa, setEditPadreEmpresa] = useState("");
  const [editPadreTelefono, setEditPadreTelefono] = useState("");
  const [editPadreCorreo, setEditPadreCorreo] = useState("");
  const [editMadreNombre, setEditMadreNombre] = useState("");
  const [editMadreOcupacion, setEditMadreOcupacion] = useState("");
  const [editMadreEmpresa, setEditMadreEmpresa] = useState("");
  const [editMadreTelefono, setEditMadreTelefono] = useState("");
  const [editMadreCorreo, setEditMadreCorreo] = useState("");
  const [editConsentLiberacion, setEditConsentLiberacion] = useState(false);
  const [editConsentDatos, setEditConsentDatos] = useState(false);
  const [editConsentFotos, setEditConsentFotos] = useState(false);
  const [editFirmaBase64, setEditFirmaBase64] = useState("");
  const [editEncargadoIdentificacion, setEditEncargadoIdentificacion] = useState("");
  const [editMadreIdentificacion, setEditMadreIdentificacion] = useState("");
  const [editPadreIdentificacion, setEditPadreIdentificacion] = useState("");
  const [editParentescoFirmante, setEditParentescoFirmante] = useState<"Madre" | "Padre" | "Tutor">("Madre");
  const [editNombreFirmante, setEditNombreFirmante] = useState("");
  const [editIdentificacionFirmante, setEditIdentificacionFirmante] = useState("");

  useEffect(() => {
    if (editParentescoFirmante === "Madre") {
      setEditNombreFirmante(editMadreNombre);
      setEditIdentificacionFirmante(editMadreIdentificacion);
    } else if (editParentescoFirmante === "Padre") {
      setEditNombreFirmante(editPadreNombre);
      setEditIdentificacionFirmante(editPadreIdentificacion);
    }
  }, [editParentescoFirmante, editMadreNombre, editMadreIdentificacion, editPadreNombre, editPadreIdentificacion]);

  const categories = useMemo(() => RendimientoStore.getCategorias(), []);

  const categoryOptions = useMemo(() => {
    const orgCats = categories
      .filter(c => c.disciplina === editDisciplina)
      .map(c => c.nombre);
    
    if (orgCats.length > 0) {
      return orgCats;
    }

    // Fallbacks for the demo/empty state
    if (editDisciplina === "Fútbol") {
      return ["Sub-7 Fútbol", "Sub-9 Fútbol", "Sub-12 Fútbol", "Sub-14 Fútbol", "Sub-15 Fútbol", "Mayor Femenino", "Mayor"];
    }
    if (editDisciplina === "Baloncesto") {
      return ["Sub-10 Baloncesto", "Sub-14 Baloncesto", "Juvenil Baloncesto"];
    }
    if (editDisciplina === "Natación") {
      return ["Iniciación Natación", "Competitivo Natación"];
    }
    return ["Sub-10", "Sub-12", "Sub-14", "Sub-16", "Sub-18", "Mayor"];
  }, [categories, editDisciplina]);

  const positionOptions = useMemo(() => {
    if (editDisciplina === "Fútbol") {
      return ["Portero", "Defensa central", "Lateral", "Mediocampista", "Volante ofensivo", "Extremo", "Delantero"];
    }
    if (editDisciplina === "Baloncesto") {
      return ["Base", "Escolta", "Alero", "Ala-pívot", "Pívot"];
    }
    if (editDisciplina === "Voleibol") {
      return ["Armador", "Opuesto", "Central", "Receptor", "Líbero"];
    }
    if (editDisciplina === "Natación") {
      return ["Libre", "Espalda", "Pecho", "Mariposa", "Combinado"];
    }
    return ["—"];
  }, [editDisciplina]);

  const handleOpenEdit = () => {
    setEditNombre(j.nombre);
    setEditNumero(numero);
    setEditIdentificacion(j.identificacion);
    const dynamics = RendimientoStore.getJugadores().find(x => x.id === j.id);
    setEditFechaNacimiento(dynamics?.fechaNacimiento || `${2026 - j.edad}-01-15`);
    setEditGenero(j.genero || "Mixto");
    setEditDisciplina(j.disciplina);
    setEditCategoria(j.categoria);
    setEditSedeId(j.sedeId || "s1");
    setEditTelefono(dynamics?.telefono || "+506 8888 9999");
    setEditCorreo(dynamics?.correo || "");
    setEditPosicion(posicionPrincipal);
    setEditAvatar(dynamics?.avatar || j.avatar);
    
    // Cargar nuevos campos
    setEditBarrio(dynamics?.barrio || "");
    setEditDireccion(dynamics?.direccion || "");
    setEditTelefonoResidencia(dynamics?.telefonoResidencia || "");
    setEditTipoSangre(dynamics?.tipoSangre || "");
    setEditSeguroEps(dynamics?.seguroEps || "INS — Instituto Nacional de Seguros");
    setEditEnfermedades(dynamics?.enfermedades || "");
    setEditCirugias(dynamics?.cirugias || "");
    setEditAlergiasInput(dynamics?.alergiasInput || "");
    setEditLesionesInput(dynamics?.lesionesInput || "");
    setEditInstitucionEducativa(dynamics?.institucionEducativa || "");
    setEditGradoActual(dynamics?.gradoActual || "");
    setEditPeso(dynamics?.peso || 0);
    setEditAltura(dynamics?.altura || 0);

    // Padres
    setEditPadreNombre(dynamics?.padreNombre || "");
    setEditPadreOcupacion(dynamics?.padreOcupacion || "");
    setEditPadreEmpresa(dynamics?.padreEmpresa || "");
    setEditPadreTelefono(dynamics?.padreTelefono || "");
    setEditPadreCorreo(dynamics?.padreCorreo || "");
    setEditMadreNombre(dynamics?.madreNombre || "");
    setEditMadreOcupacion(dynamics?.madreOcupacion || "");
    setEditMadreEmpresa(dynamics?.madreEmpresa || "");
    setEditMadreTelefono(dynamics?.madreTelefono || "");
    setEditMadreCorreo(dynamics?.madreCorreo || "");
    setEditConsentLiberacion(dynamics?.consentLiberacion || false);
    setEditConsentDatos(dynamics?.consentDatos || false);
    setEditConsentFotos(dynamics?.consentFotos || false);
    setEditFirmaBase64(dynamics?.firmaBase64 || "");
    setEditEncargadoIdentificacion(dynamics?.encargadoIdentificacion || "");
    setEditMadreIdentificacion(dynamics?.madreIdentificacion || "");
    setEditPadreIdentificacion(dynamics?.padreIdentificacion || "");
    setEditParentescoFirmante(dynamics?.parentescoFirmante || "Madre");
    setEditNombreFirmante(dynamics?.nombreFirmante || "");
    setEditIdentificacionFirmante(dynamics?.identificacionFirmante || "");

    setOpenEdit(true);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre || !editIdentificacion) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const assignedSede = sedes.find(s => s.id === editSedeId)?.nombre ?? "Sede Central";

    RendimientoStore.updateJugador(j.id, {
      nombre: editNombre,
      numero: Number(editNumero),
      identificacion: editIdentificacion,
      fechaNacimiento: editFechaNacimiento,
      genero: editGenero,
      disciplina: editDisciplina,
      categoria: editCategoria,
      sede: assignedSede,
      decaySedeId: editSedeId, // wait, it's sedeId
      sedeId: editSedeId,
      correo: editCorreo,
      telefono: editTelefono,
      posicion: editPosicion,
      avatar: editAvatar,
      
      // Guardar nuevos campos
      barrio: editBarrio,
      direccion: editDireccion,
      telefonoResidencia: editTelefonoResidencia,
      tipoSangre: editTipoSangre,
      seguroEps: editSeguroEps,
      enfermedades: editEnfermedades,
      cirugias: editCirugias,
      alergiasInput: editAlergiasInput,
      lesionesInput: editLesionesInput,
      institucionEducativa: editInstitucionEducativa,
      gradoActual: editGradoActual,
      peso: Number(editPeso),
      altura: Number(editAltura),

      // Padres
      padreNombre: editPadreNombre,
      padreOcupacion: editPadreOcupacion,
      padreEmpresa: editPadreEmpresa,
      padreTelefono: editPadreTelefono,
      padreCorreo: editPadreCorreo,
      madreNombre: editMadreNombre,
      madreOcupacion: editMadreOcupacion,
      madreEmpresa: editMadreEmpresa,
      madreTelefono: editMadreTelefono,
      madreCorreo: editMadreCorreo,
      consentLiberacion: editConsentLiberacion,
      consentDatos: editConsentDatos,
      consentFotos: editConsentFotos,
      firmaBase64: editFirmaBase64,
      encargadoIdentificacion: editEncargadoIdentificacion,
      madreIdentificacion: editMadreIdentificacion,
      padreIdentificacion: editPadreIdentificacion,
      parentescoFirmante: editParentescoFirmante,
      nombreFirmante: editNombreFirmante,
      identificacionFirmante: editIdentificacionFirmante,
    } as any);

    setOpenEdit(false);
    toast.success("Perfil del atleta actualizado");
    router.invalidate();
  };

  const handleDeletePlayer = () => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${j.nombre}? Esta acción no se puede deshacer y borrará al jugador del sistema.`)) {
      RendimientoStore.deleteJugador(j.id);
      toast.success("Jugador eliminado con éxito");
      router.navigate({ to: "/jugadores" });
    }
  };

  // El QR apunta al carnet público
  const carnetUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/player-card/${token}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(carnetUrl)}`;


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              window.history.back();
            } else {
              router.navigate({ to: "/jugadores" });
            }
          }}
          className="flex items-center gap-1 hover:text-foreground transition-colors focus:outline-none cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{j.nombre}</span>
      </div>

      {/* ESTRUCTURA GENERAL EN 2 COLUMNAS PRINCIPALES A NIVEL DE PÁGINA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ========================================================= */}
        {/* COLUMNA 1 (IZQUIERDA): FICHA TÉCNICA PRO COMPLETA (SCOUTING CARD CON FOTO) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-4 sticky top-4">
          <div className="rounded-3xl bg-slate-950 text-white shadow-2xl p-6 space-y-5 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-48 w-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Encabezado Ficha */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
                <Star className="h-4 w-4 fill-amber-400" /> FICHA TÉCNICA PRO (SCOUTING)
              </div>
              <Button size="sm" onClick={() => window.print()} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] h-7 px-3 rounded-lg gap-1.5 shadow-md">
                <Printer className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>

            {/* Hero Foto + Nombre */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-3xl blur-sm opacity-60" />
                <div className="relative h-36 w-36 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-slate-900 shadow-2xl">
                  <img src={j.avatar.replace("100?img=", "600?img=")} alt={j.nombre} className="h-full w-full object-cover" />
                  <div className="absolute bottom-1 right-1 bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded shadow">
                    #{numero}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  {j.categoria} · {j.disciplina}
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white pt-1">{j.nombre}</h2>
                <p className="text-xs text-slate-400 font-medium">
                  Posición: <span className="text-amber-400 font-bold">{posicionPrincipal}</span> {secundarias?.length ? `(${secundarias.join(", ")})` : ""}
                </p>
              </div>
            </div>

            {/* Badges de Medidas */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <p className="text-[9px] font-bold uppercase text-slate-400">Edad</p>
                <p className="text-sm font-black text-white">{j.edad} a</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <p className="text-[9px] font-bold uppercase text-slate-400">Altura</p>
                <p className="text-sm font-black text-white">{altura ? `${altura}m` : "1.74m"}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <p className="text-[9px] font-bold uppercase text-slate-400">Peso</p>
                <p className="text-sm font-black text-white">{peso ? `${peso}kg` : "68kg"}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <p className="text-[9px] font-bold uppercase text-slate-400">Perfil</p>
                <p className="text-sm font-black text-amber-400">{perfil || "Hábil"}</p>
              </div>
            </div>

            {/* Radar Evaluativo */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <p className="text-[11px] font-extrabold uppercase text-blue-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" /> ATRIBUTOS DE SCOUTING
              </p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={
                    j.disciplina === "Baloncesto" ? [
                      { skill: "Tiro 3P", valor: 85 }, { skill: "Drible", valor: 88 },
                      { skill: "Rebote", valor: 78 }, { skill: "Defensa", valor: 82 },
                      { skill: "Físico", valor: 90 }, { skill: "Pase", valor: 86 }
                    ] : j.disciplina === "Natación" ? [
                      { skill: "Potencia", valor: 92 }, { skill: "Técnica", valor: 90 },
                      { skill: "Viraje", valor: 85 }, { skill: "Salida", valor: 88 },
                      { skill: "Resistencia", valor: 94 }, { skill: "Ritmo", valor: 87 }
                    ] : radar
                  }>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="skill" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: "bold" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" />
                    <Radar name={j.nombre} dataKey="valor" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Características por Deporte */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <p className="text-[11px] font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> CARACTERÍSTICAS TÁCTICAS ({j.disciplina.toUpperCase()})
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200">⚡ Veloz & Explosivo</div>
                <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200">🎯 Visión de Juego</div>
                <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200">💪 Fuerte en 1vs1</div>
                <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200">🔥 Pase Filoso</div>
              </div>
            </div>

            {/* Palmarés */}
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <p className="text-[11px] font-extrabold uppercase text-amber-400 tracking-wider border-b border-slate-800 pb-1.5">
                🏆 LOGROS DESTACADOS
              </p>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-amber-400 font-bold block text-[10px]">2025 · Campeón Institucional</span>
                  <span className="text-white font-bold">Torneo Apertura {j.categoria}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-amber-400 font-bold block text-[10px]">2025 · Atleta Destacado</span>
                  <span className="text-white font-bold">Liga de {j.disciplina}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMNA 2 (DERECHA): TODA LA INFORMACIÓN Y EXPEDIENTE DEL ATLETA */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-6">

          {/* Quick stats strip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            <QuickStat icon={Activity} label="Asistencia" value={`${stats.asistenciaPct}%`} />
            <QuickStat icon={Trophy} label="Partidos" value={stats.partidos} />
            <QuickStat icon={Star} label="Goles" value={stats.goles} />
            <QuickStat icon={TrendingUp} label="Rendimiento" value={`${stats.promRend}/100`} />
            <QuickStat icon={Clock} label="Minutos" value={stats.minutos} />
            <QuickStat icon={DollarSign} label="Saldo" value={j.saldo > 0 ? formatCRC(j.saldo) : "Al día"} tone={j.saldo > 0 ? "warn" : "ok"} />
          </div>

          {/* Resumen Operativo y Alertas */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary" /> Resumen Operativo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 grid grid-cols-2 gap-2 text-xs">
                <StatusChip label="Operativo" tone={j.esSuspendido || estadoOp === "restriccion" ? "danger" : "ok"} value={j.esSuspendido ? "Suspendido" : meta.label} />
                <StatusChip label="Financiero" tone={j.saldo === 0 ? "ok" : "warn"} value={j.saldo === 0 ? "Al día" : formatCRC(j.saldo)} />
                <StatusChip label="Médico" tone={j.esSuspendido || lesiones.length > 0 ? "warn" : "ok"} value={j.esSuspendido || lesiones.length > 0 ? "Restricción Médica" : "OK"} />
                <StatusChip label="Documentos" tone="ok" value="Al día" />
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Heart className="h-4 w-4 text-emerald-500" /> State Wellness
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs">
                {j.esSuspendido || lesiones.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">🩹 En Recuperación / Reposo</span>
                      <Badge variant="outline" className="font-bold border-rose-500/30 text-rose-600 bg-rose-500/10">Restricción Activa</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">Motivo: {j.razonSuspension || "Lesión física"} · Carga permitida: 0%</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-600">⚡ Estado Óptimo</span>
                      <Badge variant="outline" className="font-bold">Score 88/100</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">Sueño: 8.5 hrs · Dolor: Ninguno · Carga: Normal</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* TABS DE DETALLE */}
          <Tabs defaultValue="general" className="space-y-4">
            <div className="overflow-x-auto pb-1 max-w-full no-scrollbar">
              <TabsList className="inline-flex h-auto flex-nowrap justify-start gap-1 bg-muted/40 p-1 min-w-max">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="deportivo">Deportivo</TabsTrigger>
                <TabsTrigger value="rendimiento">Rendimiento</TabsTrigger>
                <TabsTrigger value="alto-rendimiento">Alto Rendimiento</TabsTrigger>
                <TabsTrigger value="entrenador">Entrenador</TabsTrigger>
                <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
                <TabsTrigger value="medico">Médico</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
                <TabsTrigger value="comunicacion">Comunicación</TabsTrigger>
                <TabsTrigger value="ia">IA</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
                <TabsTrigger value="tactica">Táctica</TabsTrigger>
              </TabsList>
            </div>

        {/* TAB FICHA TÉCNICA PRO DIRECTA EN PÁGINA — NUEVO DISEÑO 2 COLUMNAS ultra-premium */}
        <TabsContent value="ficha-pro" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMNA 1: FICHA TÉCNICA PRO / SCOUTING CARD (COMPACTA Y ALTA, SIN FOTO REPETIDA) */}
            <div className="lg:col-span-5 rounded-3xl bg-slate-950 text-white shadow-2xl p-6 space-y-5 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-48 w-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              {/* Header Card */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
                  <Star className="h-4 w-4 fill-amber-400" /> FICHA DE SCOUTING & EVALUACIÓN
                </div>
                <Button size="sm" onClick={() => window.print()} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] h-7 px-2.5 rounded-lg gap-1">
                  <Printer className="h-3 w-3" /> PDF
                </Button>
              </div>

              {/* Title & Position */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5">#{numero}</Badge>
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">{j.categoria} · {j.disciplina}</span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">{j.nombre}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Posición: <span className="text-amber-400 font-bold">{posicionPrincipal}</span> {secundarias?.length ? `(${secundarias.join(", ")})` : ""}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Edad</p>
                  <p className="text-sm font-black text-white">{j.edad} a</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Altura</p>
                  <p className="text-sm font-black text-white">{altura ? `${altura}m` : "1.74m"}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Peso</p>
                  <p className="text-sm font-black text-white">{peso ? `${peso}kg` : "68kg"}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                  <p className="text-[9px] font-bold uppercase text-slate-400">Perfil</p>
                  <p className="text-sm font-black text-amber-400">{perfil || "Hábil"}</p>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <p className="text-[11px] font-extrabold uppercase text-blue-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400" /> ATRIBUTOS DE RENDIMIENTO
                </p>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={
                      j.disciplina === "Baloncesto" ? [
                        { skill: "Tiro 3P", valor: 85 }, { skill: "Drible", valor: 88 },
                        { skill: "Rebote", valor: 78 }, { skill: "Defensa", valor: 82 },
                        { skill: "Físico", valor: 90 }, { skill: "Pase", valor: 86 }
                      ] : j.disciplina === "Natación" ? [
                        { skill: "Potencia", valor: 92 }, { skill: "Técnica", valor: 90 },
                        { skill: "Viraje", valor: 85 }, { skill: "Salida", valor: 88 },
                        { skill: "Resistencia", valor: 94 }, { skill: "Ritmo", valor: 87 }
                      ] : radar
                    }>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="skill" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" />
                      <Radar name={j.nombre} dataKey="valor" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Característica & Aptitudes */}
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <p className="text-[11px] font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" /> CARACTERÍSTICAS TÁCTICAS ({j.disciplina.toUpperCase()})
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200">⚡ Veloz & Explosivo</div>
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200">🎯 Visión de Juego</div>
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200">💪 Fuerte en 1vs1</div>
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-200">🔥 Pase Filoso</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <p className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> VALORES Y APTITUDES
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300">🤝 Compañerismo</div>
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300">🏆 Liderazgo</div>
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300">🧠 Inteligencia Táctica</div>
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300">⭐ Disciplinado</div>
                  </div>
                </div>
              </div>

              {/* Palmarés */}
              <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                <p className="text-[11px] font-extrabold uppercase text-amber-400 tracking-wider border-b border-slate-800 pb-1.5">
                  🏆 LOGROS Y PALMARÉS
                </p>
                <div className="space-y-1.5 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-amber-400 font-bold block text-[10px]">2025 · Campeón Institucional</span>
                    <span className="text-white font-bold">Torneo Apertura {j.categoria}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-amber-400 font-bold block text-[10px]">2025 · Atleta Destacado</span>
                    <span className="text-white font-bold">Liga de {j.disciplina}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA 2: TODA LA DATA DEL ATLETA ORGANIZADA EN BLOQUES LIMPIOS */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Bloque 1: Información Personal y Adscripción */}
              <Card className="shadow-card border border-border/60">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Expediente General y Adscripción
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <Field label="Nombre Completo" value={j.nombre} />
                  <Field label="Identificación" value={j.identificacion} />
                  <Field label="Fecha de Nacimiento" value={j.fechaNacimiento || j.nacimiento} />
                  <Field label="Género" value={j.genero} />
                  <Field label="Teléfono Atleta" value={j.telefono || "+506 8888-9999"} />
                  <Field label="Correo Electrónico" value={j.correo || "—"} />
                  <Field label="Sede Actual" value={j.sede} />
                  <Field label="Entrenador a cargo" value={j.entrenador || "José Delgado"} />
                  <Field label="Equipo Inscrito" value={j.equipo || `${j.disciplina} ${j.categoria}`} />
                </CardContent>
              </Card>

              {/* Bloque 2: Apoderado y Contacto de Emergencia */}
              <Card className="shadow-card border border-border/60">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Apoderado Legal y Emergencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 grid grid-cols-2 gap-4 text-xs">
                  <Field label="Nombre Encargado" value={parentName} />
                  <Field label="Cédula Encargado" value={parentId} />
                  <Field label="Teléfono Emergencia" value={j.telefonoEncargado || "+506 8888-9999"} />
                  <Field label="Correo Encargado" value={j.correoEncargado || "apoderado@mail.com"} />
                </CardContent>
              </Card>

              {/* Bloque 3: Datos Médicos y Seguro */}
              <Card className="shadow-card border border-border/60">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-rose-500">
                    <ShieldAlert className="h-4 w-4" /> Ficha Médica y Seguro Deportivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <Field label="Tipo de Sangre" value={j.tipoSangre || "O+"} />
                  <Field label="Alergias" value={alergias?.length ? alergias.join(", ") : "Ninguna reportada"} />
                  <Field label="Condición Médica" value={condicionesMedicas?.length ? condicionesMedicas.join(", ") : "Apto sin restricción"} />
                  <Field label="Seguro Médico" value={seguro?.proveedor || "INS Deportivo (Activo)"} />
                  <Field label="Póliza N°" value={seguro?.poliza || "POL-2026-9921"} />
                  <Field label="Vencimiento Póliza" value={seguro?.vencimiento || "15/12/2026"} />
                </CardContent>
              </Card>

              {/* Bloque 4: Estatus Financiero y Matrícula */}
              <Card className="shadow-card border border-border/60">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600">
                    <DollarSign className="h-4 w-4" /> Historial Financiero y Mensualidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 grid grid-cols-3 gap-4 text-xs">
                  <Field label="Cuota Mensual" value={`₡${(j.montoFinal || 25000).toLocaleString("es-CR")}`} />
                  <Field label="Estado Actual" value={<Badge className={estadoPagoLabel[j.estadoPago].cls}>{estadoPagoLabel[j.estadoPago].label}</Badge>} />
                  <Field label="Saldo Pendiente" value={j.saldo > 0 ? `₡${j.saldo.toLocaleString("es-CR")}` : "₡0 (Al día)"} />
                </CardContent>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* GENERAL */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader><CardTitle className="text-base">Datos personales</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre completo" value={j.nombre} />
                <Field label="Identificación" value={j.identificacion} />
                <Field label="Fecha de nacimiento" value={j.fechaNacimiento || j.nacimiento} />
                <Field label="Edad" value={`${RendimientoStore.calcularEdad(j.fechaNacimiento || j.nacimiento)} años`} />
                <Field label="Género" value={j.genero} />
                <Field label="Teléfono del Atleta" value={j.telefono || "+506 8000 0000"} />
                <Field label="Correo Electrónico" value={j.correo || "—"} />
                <Field label="Barrio" value={j.barrio || "San Pedro"} />
                <Field label="Dirección Residencial" value={j.direccion || "San José, Costa Rica"} />
                <Field label="Teléfono de Residencia" value={j.telefonoResidencia || "—"} />
                <Field label="Institución Educativa" value={j.institucionEducativa || "—"} />
                <Field label="Grado Actual" value={j.gradoActual || "—"} />
                <Field label="Peso" value={j.peso ? `${j.peso} kg` : "—"} />
                <Field label="Altura" value={j.altura ? `${j.altura} cm` : "—"} />
                <Field label="Tipo de Sangre / RH" value={j.tipoSangre || "—"} />
                <Field label="Seguro Médico / EPS" value={j.seguroEps || "—"} />
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Adscripción</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <KV k="Sede" v={j.sede} />
                <KV k="Disciplina" v={j.disciplina} />
                <KV k="Categoría" v={j.categoria} />
                <KV k="Equipo" v={equipo} />
                <KV k="Entrenador" v={entrenador} />
                <KV k="Número" v={`#${numero}`} />
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Información de los Padres / Encargados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {/* Madre */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b">
                    <div className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                    <span className="text-sm font-semibold">Madre</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <KV k="Nombre Completo" v={j.madreNombre || "—"} />
                    <KV k="Teléfono Celular" v={j.madreTelefono || "—"} />
                    <KV k="Correo Electrónico" v={j.madreCorreo || "—"} />
                    <KV k="Ocupación" v={j.madreOcupacion || "—"} />
                    <KV k="Empresa / Trabajo" v={j.madreEmpresa || "—"} />
                  </div>
                </div>

                {/* Padre */}
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span className="text-sm font-semibold">Padre</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <KV k="Nombre Completo" v={j.padreNombre || "—"} />
                    <KV k="Teléfono Celular" v={j.padreTelefono || "—"} />
                    <KV k="Correo Electrónico" v={j.padreCorreo || "—"} />
                    <KV k="Ocupación" v={j.padreOcupacion || "—"} />
                    <KV k="Empresa / Trabajo" v={j.padreEmpresa || "—"} />
                  </div>
                </div>

                {/* Encargado Legal / Firmante */}
                <div className="rounded-xl border bg-primary/5 border-primary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-primary/10">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      <span className="text-sm font-semibold text-primary">Encargado Legal</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-semibold">
                      {j.parentescoFirmante || j.parentesco || "Tutor"}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <KV k="Nombre Completo" v={j.nombreFirmante || j.encargado || j.madreNombre || j.padreNombre || "—"} />
                    <KV k="Cédula / Identificación" v={j.identificacionFirmante || j.encargadoIdentificacion || j.madreIdentificacion || j.padreIdentificacion || "—"} />
                    <KV k="Parentesco" v={j.parentescoFirmante || j.parentesco || "Madre"} />
                    <KV k="Teléfono Celular" v={j.telefonoEncargado || j.madreTelefono || j.padreTelefono || "—"} />
                    <KV k="Correo Electrónico" v={j.correoEncargado || j.madreCorreo || j.padreCorreo || "—"} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEPORTIVO */}
        <TabsContent value="deportivo" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader><CardTitle className="text-base">Perfil técnico</CardTitle><CardDescription>Radar de habilidades</CardDescription></CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radar}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Skill" dataKey="valor" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Atributos</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <KV k="Posición principal" v={<Badge className="bg-primary/15 text-primary" variant="secondary">{posicionPrincipal}</Badge>} />
                <KV k="Posiciones secundarias" v={secundarias.join(", ") || "—"} />
                <KV k="Perfil dominante" v={perfil} />
                <KV k="Altura" v={`${altura} cm`} />
                <KV k="Peso" v={`${peso} kg`} />
                <KV k="IMC" v={<span className="tabular-nums">{imc}</span>} />
                <KV k="Velocidad" v={`${radar[4].valor}/100`} />
                <KV k="Resistencia" v={`${radar[5].valor}/100`} />
                <KV k="Potencia" v={`${Math.round((radar[1].valor + radar[4].valor) / 2)}/100`} />
                <KV k="Estado físico" v={<Badge className="bg-success/15 text-success" variant="secondary">Óptimo</Badge>} />
                <KV k="Estado competitivo" v={<Badge variant="outline">Activo</Badge>} />
              </CardContent>
            </Card>
          </div>

          {/* MAPA POSICIONAL */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Mapa posicional</CardTitle>
              <CardDescription>Posición principal y alternativas en cancha</CardDescription>
            </CardHeader>
            <CardContent>
              <PositionMap principal={posicionPrincipal} secundarias={secundarias} coords={posicionCoords} disciplina={j.disciplina} numero={numero} />
            </CardContent>
          </Card>
        </TabsContent>


        {/* RENDIMIENTO */}
        <TabsContent value="rendimiento" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Partidos" value={stats.partidos} sub="Temporada" />
            <KpiCard label="Goles + asist." value={stats.goles + stats.asistencias} sub={`${stats.goles}G · ${stats.asistencias}A`} />
            <KpiCard label="Minutos" value={stats.minutos} sub="Total jugados" />
            <KpiCard label="Rendimiento" value={`${stats.promRend}/100`} sub="Promedio" />
          </div>
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Evolución mensual</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rendimientoMensual}>
                  <defs>
                    <linearGradient id="gRend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gAsist" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="rendimiento" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gRend)" name="Rendimiento" />
                  <Area type="monotone" dataKey="asistencia" stroke="var(--color-success)" strokeWidth={2} fill="url(#gAsist)" name="Asistencia" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALTO RENDIMIENTO */}
        <TabsContent value="alto-rendimiento" className="space-y-4">
          <AltoRendimientoTab jugador={j} equipo={equipo} />
        </TabsContent>

        {/* ENTRENADOR */}
        <TabsContent value="entrenador" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Observaciones del entrenador</CardTitle>
                <CardDescription>Notas privadas y públicas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-3">
                  <Textarea placeholder="Escribe una nueva observación..." className="min-h-[80px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" />
                  <div className="mt-2 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input type="checkbox" defaultChecked className="rounded" /> Nota privada
                    </label>
                    <Button size="sm" onClick={() => toast.success("Observación guardada")}><Send className="h-3.5 w-3.5" /> Guardar</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {notasEntrenador.map((n) => (
                    <div key={n.id} className="rounded-lg border p-3 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{n.autor}</span>
                        <div className="flex items-center gap-2">
                          {n.privada && <Badge variant="outline" className="gap-1 text-[10px]"><Lock className="h-2.5 w-2.5" /> Privada</Badge>}
                          <span>{n.fecha}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm">{n.texto}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base">Objetivos activos</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {objetivos.map((o) => (
                  <div key={o.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{o.titulo}</span>
                      <span className="text-xs text-muted-foreground">{o.progreso}%</span>
                    </div>
                    <Progress value={o.progreso} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">Vence: {o.vence}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-base">Historial de evaluaciones</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Área</TableHead><TableHead>Nota</TableHead><TableHead>Autor</TableHead><TableHead>Fecha</TableHead><TableHead>Comentario</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {evaluaciones.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell><Badge variant="outline">{e.area}</Badge></TableCell>
                      <TableCell><span className="font-semibold">{e.nota}</span><span className="text-xs text-muted-foreground">/100</span></TableCell>
                      <TableCell className="text-sm">{e.autor}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.fecha}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md">{e.comentario}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FINANZAS */}
        <TabsContent value="finanzas" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className={cn("shadow-card border-l-4", j.saldo > 0 ? "border-l-warning" : "border-l-success")}>
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Saldo actual</p>
                <p className="mt-2 text-2xl font-bold">{j.saldo > 0 ? formatCRC(j.saldo) : "₡0"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{j.saldo > 0 ? "Saldo pendiente" : "Sin deudas"}</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Pagado este año</p>
                <p className="mt-2 text-2xl font-bold">{formatCRC(pagosJugador.filter(p => p.estado === "pagado").reduce((a, p) => a + p.monto, 0))}</p>
                <p className="mt-1 text-xs text-muted-foreground">{pagosJugador.length} transacciones</p>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Estado operativo</p>
                  <div className="mt-2">
                    <EstadoOperativoBadge
                      estadoOp={estadoOp}
                      customDesc={
                        j.esSuspendido
                          ? (j.razonSuspension || "Suspensión activa")
                          : j.saldo === 0
                          ? "Al día · Sin deudas"
                          : undefined
                      }
                    />
                  </div>
                </div>
                {estadoOp !== "habilitado" && j.saldo > 0 && <Button size="sm" variant="outline">Cobrar</Button>}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Historial de pagos</CardTitle>
              <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> Registrar pago</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Concepto</TableHead><TableHead>Método</TableHead><TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead><TableHead className="text-right">Monto</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {pagosJugador.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">{p.concepto}</TableCell>
                      <TableCell className="text-sm">{p.metodo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.fecha}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={p.estado === "pagado" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
                          {p.estado === "pagado" ? "Pagado" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCRC(p.monto)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MÉDICO */}
        <TabsContent value="medico" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" /> Lesiones</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {lesiones.map((l) => (
                  <div key={l.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{l.tipo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{l.desde} → {l.hasta}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{l.severidad}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span className="text-success font-medium capitalize">{l.estado}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="shadow-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> Alergias</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {alergias.length ? alergias.map((a) => <Badge key={a} variant="outline" className="bg-destructive/5 border-destructive/30 text-destructive">{a}</Badge>) : <EmptyState text="Sin alergias registradas" />}
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Pill className="h-4 w-4 text-warning" /> Medicamentos</CardTitle></CardHeader>
                <CardContent className="text-sm">{medicamentos.length ? medicamentos.join(", ") : <EmptyState text="Sin medicamentos" />}</CardContent>
              </Card>
              <Card className="shadow-card">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-warning" /> Restricciones y condiciones</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {restriccionesMed.length > 0 && restriccionesMed.map((r) => <p key={r} className="text-destructive">• {r}</p>)}
                  {condicionesMedicas.length > 0 && condicionesMedicas.map((c) => <p key={c} className="text-muted-foreground">• {c}</p>)}
                  {restriccionesMed.length === 0 && condicionesMedicas.length === 0 && <EmptyState text="Sin restricciones ni condiciones" />}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contactos emergencia + Seguro */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Contactos de emergencia</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {contactosEmergencia.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground">{c.parentesco}</p>
                    </div>
                    <a href={`tel:${c.telefono.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline">
                      <Phone className="h-3.5 w-3.5" /> {c.telefono}
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Seguro médico</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <KV k="Aseguradora" v={seguro.aseguradora} />
                <KV k="Póliza" v={<span className="font-mono">{seguro.poliza}</span>} />
                <KV k="Cobertura" v={seguro.cobertura} />
                <KV k="Vence" v={seguro.vence} />
                <KV k="Estado" v={<Badge className="bg-success/15 text-success" variant="secondary">{seguro.estado}</Badge>} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        {/* DOCUMENTOS */}
        <TabsContent value="documentos" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Centro de documentos</CardTitle>
              <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> Subir documento</Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {documentos.map((d) => {
                const cls = d.estado === "vigente" ? "bg-success/15 text-success" :
                  d.estado === "por vencer" ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive";
                return (
                  <div key={d.id} className="group rounded-lg border p-4 hover:shadow-elegant transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className={cls}>{d.estado}</Badge>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-tight">{d.nombre}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{d.tipo} · {d.tam}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Vence: {d.vence}</p>
                    <div className="mt-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMUNICACIÓN */}
        <TabsContent value="comunicacion" className="space-y-6">
          {/* Directorio de Contactos Oficiales (Madre, Padre, Encargado Legal) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Directorio de Contactos del Atleta
              </h3>
              <Badge variant="outline" className="text-xs font-semibold bg-primary/5 text-primary border-primary/20">
                Canales Oficiales
              </Badge>
            </div>
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              {/* Tarjeta Madre */}
              <Card className="shadow-card border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-20 w-20 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
                <CardHeader className="p-4 pb-2 border-b border-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-pink-500" /> Madre
                    </span>
                    <Badge variant="secondary" className="text-[10px] bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300">
                      Familiar
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-black mt-1 text-slate-900 dark:text-white">
                    {j.madreNombre || "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-2 text-xs">
                  <div className="space-y-1 text-slate-600 dark:text-slate-400">
                    <p className="flex justify-between"><span className="text-muted-foreground">Teléfono:</span> <span className="font-semibold text-slate-900 dark:text-white">{j.madreTelefono || "—"}</span></p>
                    <p className="flex justify-between truncate"><span className="text-muted-foreground">Correo:</span> <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{j.madreCorreo || "—"}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Ocupación:</span> <span>{j.madreOcupacion || "—"}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Empresa:</span> <span>{j.madreEmpresa || "—"}</span></p>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-muted/40">
                    <Button size="sm" variant="outline" className="h-8 text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-bold" onClick={() => {
                      if (j.madreTelefono) window.open(`https://wa.me/${j.madreTelefono.replace(/\D/g, "")}`, "_blank");
                      else toast.error("No hay número registrado");
                    }}>
                      <MessageSquare className="h-3.5 w-3.5" /> WA
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 gap-1 font-bold" onClick={() => {
                      if (j.madreCorreo) window.open(`mailto:${j.madreCorreo}`, "_blank");
                      else toast.error("No hay correo registrado");
                    }}>
                      <Mail className="h-3.5 w-3.5" /> Email
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1 font-bold" onClick={() => {
                      if (j.madreTelefono) window.open(`tel:${j.madreTelefono}`, "_self");
                      else toast.error("No hay teléfono registrado");
                    }}>
                      <Phone className="h-3.5 w-3.5" /> Llamar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tarjeta Padre */}
              <Card className="shadow-card border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-20 w-20 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                <CardHeader className="p-4 pb-2 border-b border-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-blue-500" /> Padre
                    </span>
                    <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      Familiar
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-black mt-1 text-slate-900 dark:text-white">
                    {j.padreNombre || "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-2 text-xs">
                  <div className="space-y-1 text-slate-600 dark:text-slate-400">
                    <p className="flex justify-between"><span className="text-muted-foreground">Teléfono:</span> <span className="font-semibold text-slate-900 dark:text-white">{j.padreTelefono || "—"}</span></p>
                    <p className="flex justify-between truncate"><span className="text-muted-foreground">Correo:</span> <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{j.padreCorreo || "—"}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Ocupación:</span> <span>{j.padreOcupacion || "—"}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Empresa:</span> <span>{j.padreEmpresa || "—"}</span></p>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-muted/40">
                    <Button size="sm" variant="outline" className="h-8 text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 font-bold" onClick={() => {
                      if (j.padreTelefono) window.open(`https://wa.me/${j.padreTelefono.replace(/\D/g, "")}`, "_blank");
                      else toast.error("No hay número registrado");
                    }}>
                      <MessageSquare className="h-3.5 w-3.5" /> WA
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 gap-1 font-bold" onClick={() => {
                      if (j.padreCorreo) window.open(`mailto:${j.padreCorreo}`, "_blank");
                      else toast.error("No hay correo registrado");
                    }}>
                      <Mail className="h-3.5 w-3.5" /> Email
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1 font-bold" onClick={() => {
                      if (j.padreTelefono) window.open(`tel:${j.padreTelefono}`, "_self");
                      else toast.error("No hay teléfono registrado");
                    }}>
                      <Phone className="h-3.5 w-3.5" /> Llamar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tarjeta Encargado Legal / Firmante */}
              <Card className="shadow-card border-primary/30 bg-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-20 w-20 bg-primary/10 rounded-full blur-xl pointer-events-none" />
                <CardHeader className="p-4 pb-2 border-b border-primary/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-primary" /> Encargado Legal
                    </span>
                    <Badge variant="default" className="text-[10px] bg-primary text-primary-foreground font-black">
                      {j.parentescoFirmante || j.parentesco || "Firmante"}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-black mt-1 text-primary">
                    {j.nombreFirmante || j.encargado || j.madreNombre || j.padreNombre || "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-2 text-xs">
                  <div className="space-y-1 text-slate-600 dark:text-slate-400">
                    <p className="flex justify-between"><span className="text-muted-foreground">Cédula / ID:</span> <span className="font-mono font-bold text-slate-900 dark:text-white">{j.identificacionFirmante || j.encargadoIdentificacion || "—"}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Teléfono:</span> <span className="font-semibold text-slate-900 dark:text-white">{j.telefonoEncargado || j.madreTelefono || j.padreTelefono || "—"}</span></p>
                    <p className="flex justify-between truncate"><span className="text-muted-foreground">Correo:</span> <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{j.correoEncargado || j.madreCorreo || j.padreCorreo || "—"}</span></p>
                    <p className="flex justify-between"><span className="text-muted-foreground">Estatus:</span> <span className="text-emerald-600 font-bold">Autorizado Oficial</span></p>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-primary/10">
                    <Button size="sm" className="h-8 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-bold shadow-sm" onClick={() => {
                      const tel = j.telefonoEncargado || j.madreTelefono || j.padreTelefono;
                      if (tel) window.open(`https://wa.me/${tel.replace(/\D/g, "")}`, "_blank");
                      else toast.error("No hay teléfono registrado");
                    }}>
                      <MessageSquare className="h-3.5 w-3.5" /> WA
                    </Button>
                    <Button size="sm" className="h-8 text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground gap-1 font-bold shadow-sm" onClick={() => {
                      const mail = j.correoEncargado || j.madreCorreo || j.padreCorreo;
                      if (mail) window.open(`mailto:${mail}`, "_blank");
                      else toast.error("No hay correo registrado");
                    }}>
                      <Mail className="h-3.5 w-3.5" /> Email
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-[11px] border-primary/30 text-primary gap-1 font-bold" onClick={() => {
                      const tel = j.telefonoEncargado || j.madreTelefono || j.padreTelefono;
                      if (tel) window.open(`tel:${tel}`, "_self");
                      else toast.error("No hay teléfono registrado");
                    }}>
                      <Phone className="h-3.5 w-3.5" /> Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Plantillas de Envío Rápido */}
          <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
            <Button variant="outline" className="h-auto justify-start p-3.5 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" onClick={() => toast.success(`Mensaje de WhatsApp enviado al Encargado Legal (${j.telefonoEncargado || j.madreTelefono})`)}>
              <MessageSquare className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="ml-2 text-left min-w-0">
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-300 truncate">Enviar Estado de Cuenta WA</p>
                <p className="text-[11px] text-muted-foreground truncate">Notifica mensualidad a {j.nombreFirmante || j.encargado || "Encargado"}</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto justify-start p-3.5 border-primary/30 bg-primary/5 hover:bg-primary/10" onClick={() => toast.success(`Reporte de Rendimiento enviado por email a los padres`)}>
              <Mail className="h-5 w-5 text-primary shrink-0" />
              <div className="ml-2 text-left min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Enviar Reporte Deportivo</p>
                <p className="text-[11px] text-muted-foreground truncate">PDF de evaluaciones a {j.madreNombre || "Madre"}</p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto justify-start p-3.5 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10" onClick={() => toast.info(`Convocatoria enviada a los contactos registrados`)}>
              <Phone className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="ml-2 text-left min-w-0">
                <p className="text-xs font-bold text-amber-950 dark:text-amber-300 truncate">Notificar Convocatoria</p>
                <p className="text-[11px] text-muted-foreground truncate">Aviso de próximo partido / torneo</p>
              </div>
            </Button>
          </div>

          {/* Historial de Comunicaciones */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Historial de Comunicaciones
              </CardTitle>
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={() => toast.success("Registrando nueva comunicación...")}>
                <Plus className="h-3.5 w-3.5" /> Registrar Bitácora
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-4">
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[650px] w-full">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-[120px]">Canal</TableHead>
                    <TableHead>Asunto / Mensaje</TableHead>
                    <TableHead>Destino (Padre / Encargado)</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comunicaciones.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {c.canal === "WhatsApp" ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 gap-1 font-semibold">
                              <MessageSquare className="h-3 w-3" /> WA
                            </Badge>
                          ) : c.canal === "Email" ? (
                            <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-primary/30 gap-1 font-semibold">
                              <Mail className="h-3 w-3" /> Email
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/30 gap-1 font-semibold">
                              <Phone className="h-3 w-3" /> Llamada
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <p className="font-semibold text-slate-900 dark:text-white">{c.asunto}</p>
                        {c.detalle && <p className="text-xs text-muted-foreground mt-0.5">{c.detalle}</p>}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {c.destino}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.fecha}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="capitalize font-semibold text-[11px]">
                          {c.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          </Card>
        </TabsContent>

        {/* IA */}
        <TabsContent value="ia" className="space-y-4">
          <IAPanel jugadorId={j.id} />
        </TabsContent>

        {/* HISTORIAL */}
        <TabsContent value="historial" className="space-y-4">
          <TimelineCard historial={historial} />
        </TabsContent>

        {/* TÁCTICA */}
        <TabsContent value="tactica" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left Column: Tactical Profile & Stats */}
            <div className="space-y-4">
              <Card className="bg-card shadow-card border-white/5">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm text-white">Perfil Táctico</CardTitle>
                  <CardDescription className="text-[10px]">Posiciones y roles preferidos en el campo</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3 text-xs text-muted-foreground">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="border border-white/5 bg-white/[0.01] p-2.5 rounded-xl">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Principal</p>
                      <p className="text-white font-bold text-xs mt-0.5">{posicionPrincipal || "Mediocampista"}</p>
                    </div>
                    <div className="border border-white/5 bg-white/[0.01] p-2.5 rounded-xl">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Secundarias</p>
                      <p className="text-white font-bold text-xs mt-0.5">{secundarias?.join(", ") || "Lateral"}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-2.5 space-y-1">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Roles Tácticos Sugeridos</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[9px] border-white/10 text-white">Titular Habitual</Badge>
                      <Badge variant="outline" className="text-[9px] border-white/10 text-white">Especialista Balón Parado</Badge>
                      <Badge variant="outline" className="text-[9px] border-white/10 text-white">Líder de Pressing</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-card border-white/5">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm text-white">Métricas de Temporada</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-center">
                  <div className="border border-white/5 bg-white/[0.01] p-2.5 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Partidos Jugados</p>
                    <p className="text-base font-black text-white mt-0.5">14</p>
                  </div>
                  <div className="border border-white/5 bg-white/[0.01] p-2.5 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Minutos Totales</p>
                    <p className="text-base font-black text-white mt-0.5">1,120'</p>
                  </div>
                  <div className="border border-white/5 bg-white/[0.01] p-2.5 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Titularidades</p>
                    <p className="text-base font-black text-emerald-400 mt-0.5">12</p>
                  </div>
                  <div className="border border-white/5 bg-white/[0.01] p-2.5 rounded-xl">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Efectividad Pases</p>
                    <p className="text-base font-black text-blue-400 mt-0.5">88.5%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center Column: Heatmap (SVG mock) */}
            <div className="space-y-4">
              <Card className="bg-card shadow-card border-white/5">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm text-white">Mapa de Calor Táctico</CardTitle>
                  <CardDescription className="text-[10px]">Zonas de mayor influencia en la temporada</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden shadow-lg border border-white/10">
                    <svg viewBox="0 0 100 65" className="w-full bg-[#1e293b]" style={{ aspectRatio: "100/65" }}>
                      {/* Grass lanes */}
                      {Array.from({ length: 10 }).map((_, i) => (
                        <rect key={i} x={i * 10} y={0} width={10} height={65} fill={i % 2 === 0 ? "#14532d" : "#166534"} opacity={0.65} />
                      ))}
                      {/* White field lines */}
                      <rect x={2} y={2} width={96} height={61} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={0.4} />
                      <line x1={50} y1={2} x2={50} y2={63} stroke="rgba(255,255,255,0.7)" strokeWidth={0.3} />
                      <circle cx={50} cy={32.5} r={9.15} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={0.3} />
                      <rect x={2} y={16.5} width={16.5} height={32} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={0.3} />
                      <rect x={81.5} y={16.5} width={16.5} height={32} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={0.3} />

                      {/* Heatmap Gradients */}
                      <defs>
                        <radialGradient id="heat-main" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                          <stop offset="40%" stopColor="#f97316" stopOpacity={0.6} />
                          <stop offset="70%" stopColor="#eab308" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                        </radialGradient>
                        <radialGradient id="heat-support" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
                          <stop offset="60%" stopColor="#eab308" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                        </radialGradient>
                      </defs>

                      {/* Render Heat zones based on general position */}
                      {posicionPrincipal?.toLowerCase().includes("defens") || posicionPrincipal?.toLowerCase().includes("zaga") ? (
                        <>
                          <circle cx={30} cy={32.5} r={18} fill="url(#heat-main)" />
                          <circle cx={20} cy={20} r={12} fill="url(#heat-support)" />
                          <circle cx={20} cy={45} r={12} fill="url(#heat-support)" />
                        </>
                      ) : posicionPrincipal?.toLowerCase().includes("delanter") || posicionPrincipal?.toLowerCase().includes("atac") ? (
                        <>
                          <circle cx={75} cy={32.5} r={18} fill="url(#heat-main)" />
                          <circle cx={85} cy={20} r={12} fill="url(#heat-support)" />
                          <circle cx={85} cy={45} r={12} fill="url(#heat-support)" />
                        </>
                      ) : (
                        <>
                          {/* Midfielders fallback */}
                          <circle cx={50} cy={32.5} r={22} fill="url(#heat-main)" />
                          <circle cx={35} cy={25} r={14} fill="url(#heat-support)" />
                          <circle cx={65} cy={40} r={14} fill="url(#heat-support)" />
                        </>
                      )}
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Zona defensiva</span>
                    <span>Mediocampo</span>
                    <span>Zona de ataque</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Technical Staff Observations */}
            <div className="space-y-4">
              <Card className="bg-card shadow-card border-white/5">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm text-white">Observaciones del Staff</CardTitle>
                  <CardDescription className="text-[10px]">Indicaciones y evaluaciones tácticas recientes</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2 text-xs">
                  {TacticalStore.getStaffNotes()
                    .filter(n => n.jugadorId === j.id || (!n.jugadorId && n.texto.toLowerCase().includes(j.nombre.split(" ")[0].toLowerCase())))
                    .map(note => (
                      <div key={note.id} className="p-2.5 rounded-lg border border-white/5 bg-white/[0.01] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[10px] capitalize">{note.rol} ({note.categoria})</span>
                          <span className="text-[9px] text-muted-foreground">{note.fecha}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed italic">"{note.texto}"</p>
                      </div>
                    ))}
                  {TacticalStore.getStaffNotes()
                    .filter(n => n.jugadorId === j.id || (!n.jugadorId && n.texto.toLowerCase().includes(j.nombre.split(" ")[0].toLowerCase())))
                    .length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic text-center py-4">Sin observaciones específicas registradas para este atleta.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom row: Match History & Formations */}
          <Card className="bg-card shadow-card border-white/5">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-white">Historial de Convocatorias y Formaciones</CardTitle>
              <CardDescription className="text-[10px]">Desglose de la participación táctica en los últimos encuentros</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5">
                    <TableHead className="text-[10px] text-muted-foreground uppercase font-bold">Fecha</TableHead>
                    <TableHead className="text-[10px] text-muted-foreground uppercase font-bold">Rival</TableHead>
                    <TableHead className="text-[10px] text-muted-foreground uppercase font-bold">Formación</TableHead>
                    <TableHead className="text-[10px] text-muted-foreground uppercase font-bold">Posición</TableHead>
                    <TableHead className="text-[10px] text-muted-foreground uppercase font-bold">Minutos</TableHead>
                    <TableHead className="text-[10px] text-muted-foreground uppercase font-bold">Rol</TableHead>
                    <TableHead className="text-[10px] text-muted-foreground uppercase font-bold text-right">Nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { fecha: "2026-07-05", rival: "Deportivo Saprissa", formacion: "4-3-3", posicion: posicionPrincipal, minutos: 90, rol: "Titular", nota: 8 },
                    { fecha: "2026-06-28", rival: "L.D. Alajuelense", formacion: "4-4-2", posicion: posicionPrincipal, minutos: 75, rol: "Titular", nota: 7 },
                    { fecha: "2026-06-21", rival: "Municipal Grecia", formacion: "4-3-3", posicion: posicionPrincipal, minutos: 90, rol: "Titular", nota: 9 },
                    { fecha: "2026-06-14", rival: "Herediano", formacion: "3-5-2", posicion: posicionPrincipal, minutos: 30, rol: "Suplente", nota: 6 },
                    { fecha: "2026-06-07", rival: "Limón FC", formacion: "4-3-3", posicion: posicionPrincipal, minutos: 90, rol: "Titular", nota: 8 },
                  ].map((row, idx) => (
                    <TableRow key={idx} className="border-white/5 text-xs text-muted-foreground">
                      <TableCell className="font-medium text-white">{row.fecha}</TableCell>
                      <TableCell>{row.rival}</TableCell>
                      <TableCell className="font-mono">{row.formacion}</TableCell>
                      <TableCell>{row.posicion}</TableCell>
                      <TableCell>{row.minutos}'</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[8px] font-bold ${row.rol === "Titular" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                          {row.rol}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-400">{row.nota}/10</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div> {/* Cierre Columna 2 */}
      </div> {/* Cierre Contenedor Principal de 2 Columnas */}

      {/* Dialog para Ficha de Inscripción Legal */}
      <Dialog open={openFicha} onOpenChange={setOpenFicha}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 rounded-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Ficha de Inscripción y Matrícula Legal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Documento oficial de registro del deportista en la plataforma DeportivOS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4 text-xs">
            {/* Encabezado Club */}
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border">
              <div>
                <p className="font-extrabold text-sm text-primary uppercase">{legalConfig.razonSocial || "CLUB DEPORTIVO DEPORTIVOS"}</p>
                <p className="text-[11px] text-muted-foreground">Cédula Jurídica: {legalConfig.cedulaJuridica || "3-101-998877"}</p>
                <p className="text-[11px] text-muted-foreground">Sede: {j.sede}</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs px-3 py-1 font-bold">
                MATRÍCULA ACTIVA
              </Badge>
            </div>

            {/* Bloque 1: Datos del Deportista */}
            <div className="space-y-2 border p-4 rounded-xl bg-card">
              <p className="font-bold text-sm text-primary uppercase border-b pb-1">1. DATOS DEL DEPORTISTA</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Nombre Completo:</span><span className="font-bold text-sm">{j.nombre}</span></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Identificación:</span><span className="font-bold">{j.identificacion}</span></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Edad / Nacimiento:</span><span>{j.edad} Años (15/01/{2026 - j.edad})</span></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Disciplina:</span><span className="font-semibold">{j.disciplina}</span></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Categoría:</span><Badge variant="outline">{j.categoria}</Badge></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Dorsal / Camiseta:</span><span className="font-bold">#{numero}</span></div>
              </div>
            </div>

            {/* Bloque 2: Apoderado Legal */}
            <div className="space-y-2 border p-4 rounded-xl bg-card">
              <p className="font-bold text-sm text-primary uppercase border-b pb-1">2. DATOS DEL APODERADO LEGAL (RESPONSABLE)</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Nombre Representante:</span><span className="font-bold">{parentName}</span></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Identificación:</span><span className="font-bold">{parentId}</span></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Teléfono Contacto:</span><span>{j.telefono || "+506 8888 9999"}</span></div>
                <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Correo Electrónico:</span><span>{j.correo || "apoderado@mail.com"}</span></div>
              </div>
            </div>

            {/* Bloque 3: Consentimientos Legales */}
            <div className="space-y-2 border p-4 rounded-xl bg-card">
              <p className="font-bold text-sm text-primary uppercase border-b pb-1">3. EXONERACIÓN Y LIBERACIÓN DE RESPONSABILIDAD</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed italic">
                "{renderTextWithPlaceholders(legalConfig.liberacionTexto)}"
              </p>
              <div className="flex items-center gap-2 pt-2 text-emerald-600 font-bold">
                <CheckCircle2 className="h-4 w-4" /> Aceptado y Firmado Digitalmente
              </div>
            </div>

            {/* Pie de página de impresión */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpenFicha(false)}>Cerrar</Button>
              <Button onClick={() => window.print()} className="bg-primary text-primary-foreground font-bold gap-1.5">
                <Printer className="h-4 w-4" /> Imprimir Documento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[600px] bg-background border shadow-elegant max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Edit className="h-5 w-5 text-primary" /> Editar Perfil del Atleta
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Modifica los datos personales y adscripción deportiva del atleta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlayer} className="space-y-4 pt-2">
            <Tabs defaultValue="generales" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted/40 p-1 mb-4">
                <TabsTrigger value="generales" className="text-xs">Atleta</TabsTrigger>
                <TabsTrigger value="medicos" className="text-xs">Salud</TabsTrigger>
                <TabsTrigger value="padres" className="text-xs">Padres</TabsTrigger>
                <TabsTrigger value="legal" className="text-xs">Firma & Legal</TabsTrigger>
              </TabsList>

              {/* PESTAÑA: ATLETA */}
              <TabsContent value="generales" className="space-y-4 outline-none">
                {/* Foto del Atleta */}
                <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-xl border border-dashed border-white/20">
                  <div className="relative shrink-0">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={editAvatar} />
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {editNombre ? editNombre.slice(0, 2).toUpperCase() : "AT"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col gap-1.5 grow">
                    <label className="text-xs font-semibold text-muted-foreground">Foto del Atleta (Archivo)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditAvatar(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-slate-400
                        file:mr-4 file:py-1.5 file:px-3
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-primary/15 file:text-primary
                        hover:file:bg-primary/25 cursor-pointer file:cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Nombre Completo *</label>
                    <Input
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="bg-card border"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Número de Identificación *</label>
                    <Input
                      value={editIdentificacion}
                      onChange={e => setEditIdentificacion(e.target.value)}
                      placeholder="Ej. 1-1234-5678"
                      className="bg-card border"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Fecha de Nacimiento *</label>
                    <Input
                      type="date"
                      value={editFechaNacimiento}
                      onChange={e => setEditFechaNacimiento(e.target.value)}
                      className="bg-card border"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Género</label>
                    <select
                      value={editGenero}
                      onChange={e => setEditGenero(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-card text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Mixto">Mixto</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Número / Dorsal</label>
                    <Input
                      type="number"
                      value={editNumero || ""}
                      onChange={e => setEditNumero(Number(e.target.value))}
                      placeholder="Ej. 10"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Posición de Juego</label>
                    <select
                      value={editPosicion}
                      onChange={e => setEditPosicion(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-card text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary"
                    >
                      {positionOptions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Sede</label>
                    <select
                      value={editSedeId}
                      onChange={e => setEditSedeId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-card text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary"
                    >
                      {sedes.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Disciplina</label>
                    <select
                      value={editDisciplina}
                      onChange={e => setEditDisciplina(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-card text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Fútbol">Fútbol</option>
                      <option value="Baloncesto">Baloncesto</option>
                      <option value="Natación">Natación</option>
                      <option value="Voleibol">Voleibol</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Categoría</label>
                    <select
                      value={editCategoria}
                      onChange={e => setEditCategoria(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-card text-sm ring-offset-background outline-none focus:ring-2 focus:ring-primary"
                    >
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Teléfono del Atleta</label>
                    <Input
                      value={editTelefono}
                      onChange={e => setEditTelefono(e.target.value)}
                      placeholder="Ej. +506 8888 9999"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Correo Electrónico</label>
                    <Input
                      type="email"
                      value={editCorreo}
                      onChange={e => setEditCorreo(e.target.value)}
                      placeholder="Ej. atleta@correo.com"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Barrio / Localidad</label>
                    <Input
                      value={editBarrio}
                      onChange={e => setEditBarrio(e.target.value)}
                      placeholder="Ej. San Pedro"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Teléfono de Residencia</label>
                    <Input
                      value={editTelefonoResidencia}
                      onChange={e => setEditTelefonoResidencia(e.target.value)}
                      placeholder="Ej. +506 2222 3333"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Dirección Residencial</label>
                    <Input
                      value={editDireccion}
                      onChange={e => setEditDireccion(e.target.value)}
                      placeholder="Ej. 100m Norte de la Iglesia..."
                      className="bg-card border"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* PESTAÑA: MÉDICOS Y EDUCATIVOS */}
              <TabsContent value="medicos" className="space-y-4 outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Tipo de Sangre / RH</label>
                    <Input
                      value={editTipoSangre}
                      onChange={e => setEditTipoSangre(e.target.value)}
                      placeholder="Ej. O+, A-"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Seguro Médico / EPS</label>
                    <Input
                      value={editSeguroEps}
                      onChange={e => setEditSeguroEps(e.target.value)}
                      placeholder="Ej. INS, EPS Sura"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Peso (kg)</label>
                    <Input
                      type="number"
                      value={editPeso || ""}
                      onChange={e => setEditPeso(Number(e.target.value))}
                      placeholder="Ej. 45"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Altura (cm)</label>
                    <Input
                      type="number"
                      value={editAltura || ""}
                      onChange={e => setEditAltura(Number(e.target.value))}
                      placeholder="Ej. 152"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Enfermedades Padecidas</label>
                    <Input
                      value={editEnfermedades}
                      onChange={e => setEditEnfermedades(e.target.value)}
                      placeholder="Ej. Asma, ninguna"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Cirugías Realizadas</label>
                    <Input
                      value={editCirugias}
                      onChange={e => setEditCirugias(e.target.value)}
                      placeholder="Ej. Apendicectomía, ninguna"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Alergias</label>
                    <Input
                      value={editAlergiasInput}
                      onChange={e => setEditAlergiasInput(e.target.value)}
                      placeholder="Ej. Polen, Maní, ninguna"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">Lesiones Deportivas</label>
                    <Input
                      value={editLesionesInput}
                      onChange={e => setEditLesionesInput(e.target.value)}
                      placeholder="Ej. Esguince tobillo izquierdo, ninguna"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Institución Educativa</label>
                    <Input
                      value={editInstitucionEducativa}
                      onChange={e => setEditInstitucionEducativa(e.target.value)}
                      placeholder="Ej. Liceo de Costa Rica"
                      className="bg-card border"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Grado Actual</label>
                    <Input
                      value={editGradoActual}
                      onChange={e => setEditGradoActual(e.target.value)}
                      placeholder="Ej. 6° Primaria"
                      className="bg-card border"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* PESTAÑA: PADRES / ENCARGADOS */}
              <TabsContent value="padres" className="space-y-4 outline-none">
                <div className="space-y-4">
                  {/* Cédula del Encargado Legal */}
                  <div className="flex flex-col gap-1.5 p-3 border rounded-xl bg-muted/40">
                    <label className="text-xs font-semibold text-muted-foreground">Cédula del Encargado Legal (para aspectos legales) *</label>
                    <Input 
                      value={editEncargadoIdentificacion} 
                      onChange={e => setEditEncargadoIdentificacion(e.target.value)} 
                      placeholder="Ej. 1-1234-5678" 
                      className="bg-card border h-9" 
                      required 
                    />
                  </div>

                  {/* Datos de la Madre */}
                  <div className="p-3 border rounded-xl bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <div className="h-2 w-2 rounded-full bg-pink-500" />
                      <span className="text-xs font-bold uppercase text-muted-foreground">Datos de la Madre</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Nombre Completo</label>
                        <Input value={editMadreNombre} onChange={e => setEditMadreNombre(e.target.value)} className="h-9 bg-card border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Identificación / Cédula</label>
                        <Input value={editMadreIdentificacion} onChange={e => setEditMadreIdentificacion(e.target.value)} className="h-9 bg-card border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Teléfono Celular</label>
                        <Input value={editMadreTelefono} onChange={e => setEditMadreTelefono(e.target.value)} className="h-9 bg-card border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Correo Electrónico</label>
                        <Input type="email" value={editMadreCorreo} onChange={e => setEditMadreCorreo(e.target.value)} className="h-9 bg-card border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Ocupación / Profesión</label>
                        <Input value={editMadreOcupacion} onChange={e => setEditMadreOcupacion(e.target.value)} className="h-9 bg-card border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Empresa / Trabajo</label>
                        <Input value={editMadreEmpresa} onChange={e => setEditMadreEmpresa(e.target.value)} className="h-9 bg-card border" />
                      </div>
                    </div>
                  </div>

                  {/* Datos del Padre */}
                  <div className="p-3 border rounded-xl bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold uppercase text-muted-foreground">Datos del Padre</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Nombre Completo</label>
                        <Input value={editPadreNombre} onChange={e => setEditPadreNombre(e.target.value)} className="h-9 bg-card border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Identificación / Cédula</label>
                        <Input value={editPadreIdentificacion} onChange={e => setEditPadreIdentificacion(e.target.value)} className="h-9 bg-card border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Teléfono Celular</label>
                        <Input value={editPadreTelefono} onChange={e => setEditPadreTelefono(e.target.value)} className="h-9 bg-card border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Correo Electrónico</label>
                        <Input type="email" value={editPadreCorreo} onChange={e => setEditPadreCorreo(e.target.value)} className="h-9 bg-card border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Ocupación / Profesión</label>
                        <Input value={editPadreOcupacion} onChange={e => setEditPadreOcupacion(e.target.value)} className="h-9 bg-card border" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Empresa / Trabajo</label>
                        <Input value={editPadreEmpresa} onChange={e => setEditPadreEmpresa(e.target.value)} className="h-9 bg-card border" />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* PESTAÑA: FIRMA & ASPECTOS LEGALES */}
              <TabsContent value="legal" className="space-y-4 outline-none">
                <div className="rounded-2xl border p-4 bg-muted/20 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <span className="text-xs font-bold uppercase text-muted-foreground">Consentimiento y Firma del Encargado</span>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Checkboxes de consentimiento */}
                    <label className="flex items-start gap-3 cursor-pointer text-xs select-none">
                      <input 
                        type="checkbox" 
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        checked={editConsentLiberacion}
                        onChange={e => setEditConsentLiberacion(e.target.checked)}
                      />
                      <span>Acepto la <strong>Liberación de Responsabilidad Social</strong> y autorizo traslados de emergencia.</span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer text-xs select-none">
                      <input 
                        type="checkbox" 
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        checked={editConsentDatos}
                        onChange={e => setEditConsentDatos(e.target.checked)}
                      />
                      <span>Acepto la política de privacidad y el <strong>Tratamiento de Datos Personales</strong> del menor.</span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer text-xs select-none">
                      <input 
                        type="checkbox" 
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        checked={editConsentFotos}
                        onChange={e => setEditConsentFotos(e.target.checked)}
                      />
                      <span>Acepto el <strong>Permiso de Fotografías y Uso de Imagen</strong> del menor en actividades del club.</span>
                    </label>
                  </div>

                  {/* Selector del Firmante */}
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="flex items-center gap-2 pb-1">
                      <span className="text-xs font-bold uppercase text-muted-foreground">Datos del Firmante Legal</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Parentesco del Firmante</label>
                        <select
                          className="h-9 px-3 rounded-lg border bg-card text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-zinc-800 dark:text-zinc-200"
                          value={editParentescoFirmante}
                          onChange={(e) => {
                            const val = e.target.value as "Madre" | "Padre" | "Tutor";
                            setEditParentescoFirmante(val);
                            if (val === "Madre") {
                              setEditNombreFirmante(editMadreNombre);
                              setEditIdentificacionFirmante(editMadreIdentificacion);
                            } else if (val === "Padre") {
                              setEditNombreFirmante(editPadreNombre);
                              setEditIdentificacionFirmante(editPadreIdentificacion);
                            } else {
                              setEditNombreFirmante("");
                              setEditIdentificacionFirmante("");
                            }
                          }}
                        >
                          <option value="Madre">Madre</option>
                          <option value="Padre">Padre</option>
                          <option value="Tutor">Tutor / Legal</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nombre del Firmante</label>
                        <Input
                          value={editNombreFirmante}
                          onChange={(e) => setEditNombreFirmante(e.target.value)}
                          disabled={editParentescoFirmante !== "Tutor"}
                          className="h-9 bg-card border text-xs"
                          placeholder="Nombre completo"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Identificación del Firmante</label>
                        <Input
                          value={editIdentificacionFirmante}
                          onChange={(e) => setEditIdentificacionFirmante(e.target.value)}
                          disabled={editParentescoFirmante !== "Tutor"}
                          className="h-9 bg-card border text-xs"
                          placeholder="Ej. 1-1234-5678"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Canvas de Firma */}
                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Firma de Conformidad del Encargado *</label>
                    
                    {/* Canvas container */}
                    <div className="relative border border-dashed border-zinc-300 rounded-2xl bg-zinc-50 overflow-hidden select-none">
                      <canvas
                        id="signature-canvas"
                        className="w-full h-[180px] bg-zinc-50 cursor-crosshair block touch-none"
                        onMouseDown={(e) => {
                          const canvas = e.currentTarget;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          const rect = canvas.getBoundingClientRect();
                          const scaleX = canvas.width / rect.width;
                          const scaleY = canvas.height / rect.height;
                          ctx.beginPath();
                          ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                          (canvas as any).isDrawing = true;
                        }}
                        onMouseMove={(e) => {
                          const canvas = e.currentTarget;
                          if (!(canvas as any).isDrawing) return;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          const rect = canvas.getBoundingClientRect();
                          const scaleX = canvas.width / rect.width;
                          const scaleY = canvas.height / rect.height;
                          ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                          ctx.strokeStyle = '#1e3a8a'; // Deep blue ink
                          ctx.lineWidth = 3;
                          ctx.lineCap = 'round';
                          ctx.lineJoin = 'round';
                          ctx.stroke();
                        }}
                        onMouseUp={(e) => {
                          const canvas = e.currentTarget;
                          (canvas as any).isDrawing = false;
                          setEditFirmaBase64(canvas.toDataURL());
                        }}
                        onMouseLeave={(e) => {
                          const canvas = e.currentTarget;
                          (canvas as any).isDrawing = false;
                        }}
                        onTouchStart={(e) => {
                          const canvas = e.currentTarget;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          const touch = e.touches[0];
                          const rect = canvas.getBoundingClientRect();
                          const scaleX = canvas.width / rect.width;
                          const scaleY = canvas.height / rect.height;
                          ctx.beginPath();
                          ctx.moveTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
                          (canvas as any).isDrawing = true;
                        }}
                        onTouchMove={(e) => {
                          const canvas = e.currentTarget;
                          if (!(canvas as any).isDrawing) return;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          const touch = e.touches[0];
                          const rect = canvas.getBoundingClientRect();
                          const scaleX = canvas.width / rect.width;
                          const scaleY = canvas.height / rect.height;
                          ctx.lineTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
                          ctx.strokeStyle = '#1e3a8a';
                          ctx.lineWidth = 3;
                          ctx.lineCap = 'round';
                          ctx.lineJoin = 'round';
                          ctx.stroke();
                        }}
                        onTouchEnd={(e) => {
                          const canvas = e.currentTarget;
                          (canvas as any).isDrawing = false;
                          setEditFirmaBase64(canvas.toDataURL());
                        }}
                      />
                      
                      {!editFirmaBase64 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-xs font-semibold">
                          Dibuja tu firma aquí (Mouse o Táctil)
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground">La firma se estampará en la ficha oficial.</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-7 px-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setEditFirmaBase64("");
                          const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
                          if (canvas) {
                            const ctx = canvas.getContext('2d');
                            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                          }
                        }}
                      >
                        Limpiar Firma
                      </Button>
                    </div>
                  </div>
                </div>

                <FirmaInitializer base64={editFirmaBase64} />
              </TabsContent>
            </Tabs>

            <div className="flex items-center gap-3 pt-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenEdit(false)}
                className="h-11 px-6"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-11 px-6 bg-gradient-primary shadow-elegant"
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para la Ficha de Inscripción */}
      <Dialog open={openFicha} onOpenChange={setOpenFicha}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-zinc-900 border p-6 shadow-elegant printable-ficha rounded-3xl outline-none">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm 10mm;
              }
              html, body {
                width: 100% !important;
                height: auto !important;
                background: white !important;
                color: black !important;
                overflow: visible !important;
              }
              body * {
                visibility: hidden !important;
              }
              .printable-ficha, .printable-ficha * {
                visibility: visible !important;
              }
              .printable-ficha {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                right: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                border: none !important;
                overflow: visible !important;
                display: block !important;
                transform: none !important;
              }
              .no-print {
                display: none !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}} />
          
          {/* Botones de Acción (ocultos en impresión) */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b no-print">
            <div>
              <DialogTitle className="text-base font-bold text-zinc-800">Ficha de Inscripción Oficial</DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Visualiza y genera el PDF de la ficha de inscripción del atleta.
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                <Download className="h-4 w-4 mr-1.5" /> Imprimir / PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => setOpenFicha(false)}>
                Cerrar
              </Button>
            </div>
          </div>

          {/* CONTENIDO DE LA FICHA */}
          <div className="w-full font-serif border border-zinc-400 p-6 bg-white flex flex-col gap-6 text-zinc-900 leading-normal">
            {/* Encabezado */}
            <div className="w-full border border-zinc-400 grid grid-cols-4 text-center divide-x divide-zinc-400 text-[10px]">
              <div className="p-2 flex flex-col items-center justify-center font-bold">
                <Trophy className="h-10 w-10 text-zinc-700" />
                <span className="mt-1 font-semibold text-[8px]">DEPORTIVOS</span>
              </div>
              <div className="p-2 flex flex-col items-center justify-center font-bold col-span-2">
                <p className="text-xs uppercase tracking-wider font-extrabold">Academia Deportiva Élite Sports</p>
                <p className="text-[9px] font-normal text-zinc-500 mt-1">Sede: {j.sede} · Disciplina: {j.disciplina}</p>
                <p className="text-[9px] font-bold text-zinc-700 mt-1">Fórmula Oficial de Registro</p>
              </div>
              <div className="p-2 flex flex-col justify-between text-left gap-1">
                <div><strong>Código:</strong> ATH-REG-{j.id.toUpperCase()}</div>
                <div><strong>Versión:</strong> 03</div>
                <div><strong>Fecha:</strong> {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <div className="text-center font-bold text-base underline uppercase tracking-widest text-zinc-800 my-1">
              Ficha de Inscripción
            </div>

            {/* Fila Categoría y Fecha */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2 border border-zinc-300 p-2 bg-zinc-50">
                <span className="font-bold uppercase text-[10px]">Categoría:</span>
                <span className="font-mono font-medium">{j.categoria}</span>
              </div>
              <div className="grid grid-cols-3 border border-zinc-300 divide-x divide-zinc-300 text-center bg-zinc-50">
                <div className="p-1 flex flex-col"><span className="text-[8px] font-bold uppercase text-zinc-500">Día</span><span className="text-xs font-mono font-medium">{new Date().getDate()}</span></div>
                <div className="p-1 flex flex-col"><span className="text-[8px] font-bold uppercase text-zinc-500">Mes</span><span className="text-xs font-mono font-medium">{new Date().getMonth() + 1}</span></div>
                <div className="p-1 flex flex-col"><span className="text-[8px] font-bold uppercase text-zinc-500">Año</span><span className="text-xs font-mono font-medium">{new Date().getFullYear()}</span></div>
              </div>
            </div>

            {/* 1. DATOS DEL JUGADOR */}
            <div className="flex flex-col">
              <div className="bg-zinc-800 text-white text-[10px] font-bold uppercase px-3 py-1 tracking-wider">
                Datos del Jugador
              </div>
              <div className="border border-t-0 border-zinc-300 divide-y divide-zinc-300 text-xs">
                <div className="grid grid-cols-2 divide-x divide-zinc-300">
                  <div className="p-2"><strong>Apellidos:</strong> <span className="font-mono">{j.nombre.split(" ").slice(1).join(" ") || "—"}</span></div>
                  <div className="p-2"><strong>Nombres:</strong> <span className="font-mono">{j.nombre.split(" ")[0] || "—"}</span></div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-zinc-300">
                  <div className="p-2"><strong>Documento de Identidad:</strong> <span className="font-mono">{j.identificacion}</span></div>
                  <div className="p-2"><strong>Lugar y Fecha de Nacimiento:</strong> <span className="font-mono">{j.fechaNacimiento || j.nacimiento}</span></div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-zinc-300">
                  <div className="p-2"><strong>Edad:</strong> <span className="font-mono">{RendimientoStore.calcularEdad(j.fechaNacimiento || j.nacimiento)} años</span></div>
                  <div className="p-2"><strong>Peso:</strong> <span className="font-mono">{j.peso ? `${j.peso} kg` : "—"}</span></div>
                  <div className="p-2"><strong>Talla:</strong> <span className="font-mono">{j.altura ? `${j.altura} cm` : "—"}</span></div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-zinc-300">
                  <div className="p-2"><strong>Barrio en que reside:</strong> <span className="font-mono">{j.barrio || "—"}</span></div>
                  <div className="p-2"><strong>Teléfono Residencia:</strong> <span className="font-mono">{j.telefonoResidencia || "—"}</span></div>
                </div>
                <div className="p-2"><strong>Dirección donde reside:</strong> <span className="font-mono">{j.direccion || "—"}</span></div>
                <div className="grid grid-cols-2 divide-x divide-zinc-300">
                  <div className="p-2"><strong>Celular:</strong> <span className="font-mono">{j.telefono || "—"}</span></div>
                  <div className="p-2"><strong>Email:</strong> <span className="font-mono">{j.correo || "—"}</span></div>
                </div>
              </div>
            </div>

            {/* 2. INFORMACIÓN MÉDICA */}
            <div className="flex flex-col">
              <div className="bg-zinc-800 text-white text-[10px] font-bold uppercase px-3 py-1 tracking-wider">
                Información Médica
              </div>
              <div className="border border-t-0 border-zinc-300 divide-y divide-zinc-300 text-xs">
                <div className="grid grid-cols-3 divide-x divide-zinc-300">
                  <div className="p-2 col-span-2"><strong>Seguro Médico EPS:</strong> <span className="font-mono">{j.seguroEps || "—"}</span></div>
                  <div className="p-2"><strong>Grupo Sanguíneo / RH:</strong> <span className="font-mono">{j.tipoSangre || "—"}</span></div>
                </div>
                <div className="p-2"><strong>Enfermedades Padecidas:</strong> <span className="font-mono">{j.enfermedades || "Ninguna"}</span></div>
                <div className="p-2"><strong>Cirugías:</strong> <span className="font-mono">{j.cirugias || "Ninguna"}</span></div>
                <div className="p-2"><strong>Lesiones Deportivas:</strong> <span className="font-mono">{j.lesionesInput || "Ninguna"}</span></div>
                <div className="p-2"><strong>Alergias:</strong> <span className="font-mono">{j.alergiasInput || "Ninguna"}</span></div>
              </div>
            </div>

            {/* 3. INFORMACIÓN EDUCATIVA */}
            <div className="flex flex-col">
              <div className="bg-zinc-800 text-white text-[10px] font-bold uppercase px-3 py-1 tracking-wider">
                Información Educativa
              </div>
              <div className="border border-t-0 border-zinc-300 grid grid-cols-2 divide-x divide-zinc-300 text-xs">
                <div className="p-2"><strong>Institución Educativa:</strong> <span className="font-mono">{j.institucionEducativa || "—"}</span></div>
                <div className="p-2"><strong>Grado Actual:</strong> <span className="font-mono">{j.gradoActual || "—"}</span></div>
              </div>
            </div>

            {/* 4. INFORMACIÓN FAMILIAR */}
            <div className="flex flex-col">
              <div className="bg-zinc-800 text-white text-[10px] font-bold uppercase px-3 py-1 tracking-wider">
                Información Familiar
              </div>
              <div className="border border-t-0 border-zinc-300 text-xs">
                <table className="w-full text-left divide-y divide-zinc-300">
                  <thead className="bg-zinc-50 text-[10px] font-bold uppercase text-zinc-700">
                    <tr className="divide-x divide-zinc-300">
                      <th className="p-2">Familiar</th>
                      <th className="p-2">Nombres y Apellidos</th>
                      <th className="p-2">Ocupación</th>
                      <th className="p-2">Empresa donde Labora</th>
                      <th className="p-2">Teléfono</th>
                      <th className="p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-300 font-mono text-[11px]">
                    <tr className="divide-x divide-zinc-300">
                      <td className="p-2 font-bold bg-zinc-50/50">Madre</td>
                      <td className="p-2">{j.madreNombre || "—"}</td>
                      <td className="p-2">{j.madreOcupacion || "—"}</td>
                      <td className="p-2">{j.madreEmpresa || "—"}</td>
                      <td className="p-2">{j.madreTelefono || "—"}</td>
                      <td className="p-2">{j.madreCorreo || "—"}</td>
                    </tr>
                    <tr className="divide-x divide-zinc-300">
                      <td className="p-2 font-bold bg-zinc-50/50">Padre</td>
                      <td className="p-2">{j.padreNombre || "—"}</td>
                      <td className="p-2">{j.padreOcupacion || "—"}</td>
                      <td className="p-2">{j.padreEmpresa || "—"}</td>
                      <td className="p-2">{j.padreTelefono || "—"}</td>
                      <td className="p-2">{j.padreCorreo || "—"}</td>
                    </tr>
                    <tr className="divide-x divide-zinc-300 bg-amber-50/30">
                      <td className="p-2 font-bold text-amber-950 bg-amber-100/50">Encargado Legal</td>
                      <td className="p-2 font-bold">{j.nombreFirmante || j.encargado || j.madreNombre || j.padreNombre || "—"} ({j.identificacionFirmante || j.encargadoIdentificacion || "—"})</td>
                      <td className="p-2">{j.parentescoFirmante || j.parentesco || "Tutor Legal"}</td>
                      <td className="p-2">Firmante Registrado</td>
                      <td className="p-2">{j.telefonoEncargado || j.madreTelefono || j.padreTelefono || "—"}</td>
                      <td className="p-2">{j.correoEncargado || j.madreCorreo || j.padreCorreo || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. ASPECTO LEGAL */}
            <div className="flex flex-col">
              <div className="bg-zinc-800 text-white text-[10px] font-bold uppercase px-3 py-1 tracking-wider">
                Aspecto Legal y Consentimientos
              </div>
              <div className="border border-t-0 border-zinc-300 p-3 space-y-4 text-[10px] leading-relaxed text-zinc-700 bg-zinc-50/20">
                <div className="space-y-1">
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 font-bold font-mono text-zinc-900 border border-zinc-400 px-1 rounded bg-zinc-100">
                      {(j as any).consentLiberacion ? "✓" : " "}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-950 uppercase text-[8px] tracking-wide">Liberación de Responsabilidad Social:</h4>
                      <p className="mt-0.5 whitespace-pre-line text-justify">{renderTextWithPlaceholders(legalConfig.liberacion)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 font-bold font-mono text-zinc-900 border border-zinc-400 px-1 rounded bg-zinc-100">
                      {(j as any).consentDatos ? "✓" : " "}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-950 uppercase text-[8px] tracking-wide">Aceptación Tratamiento de Datos:</h4>
                      <p className="mt-0.5 whitespace-pre-line text-justify">{renderTextWithPlaceholders(legalConfig.tratamiento)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-start gap-2.5">
                    <div className="shrink-0 font-bold font-mono text-zinc-900 border border-zinc-400 px-1 rounded bg-zinc-100">
                      {(j as any).consentFotos ? "✓" : " "}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-950 uppercase text-[8px] tracking-wide">Permiso de Fotografías:</h4>
                      <p className="mt-0.5 whitespace-pre-line text-justify">{renderTextWithPlaceholders(legalConfig.fotos)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Firmas en modo web */}
            <div className="grid grid-cols-2 gap-12 mt-8 text-center text-xs no-print">
              <div className="flex flex-col items-center justify-end">
                {j.firmaBase64 ? (
                  <img src={j.firmaBase64} alt="Firma del Encargado" className="max-h-12 object-contain" />
                ) : (
                  <div className="h-12 flex items-center justify-center text-red-500 text-[10px]">Firma pendiente</div>
                )}
                <div className="w-48 border-b border-zinc-400 mt-1" />
                <span className="mt-2 text-[10px] font-bold text-zinc-700 uppercase">Firma del Encargado Legal</span>
                <span className="text-[9px] text-zinc-500 font-mono mt-0.5">{parentName} ({j.parentescoFirmante || "Encargado"})</span>
                <span className="text-[8px] text-zinc-400 font-mono">Cédula: {parentId}</span>
              </div>
              <div className="flex flex-col items-center justify-end">
                {legalConfig.firmaCoordinadorBase64 ? (
                  <img src={legalConfig.firmaCoordinadorBase64} alt="Firma Coordinación" className="max-h-12 object-contain" />
                ) : (
                  <div className="h-12 flex items-center justify-center text-red-500 text-[10px]">Firma de Coordinación pendiente</div>
                )}
                <div className="w-48 border-b border-zinc-400 mt-1" />
                <span className="mt-2 text-[10px] font-bold text-zinc-700 uppercase">Firma de Coordinación Deportiva</span>
                <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Coordinador Deportivo</span>
              </div>
            </div>
            
            {/* Firmas en modo impresión */}
            <div className="hidden print:grid grid-cols-2 gap-12 mt-16 text-center text-xs">
              <div className="flex flex-col items-center justify-end">
                {j.firmaBase64 ? (
                  <img src={j.firmaBase64} alt="Firma del Encargado" className="max-h-16 object-contain" />
                ) : (
                  <div className="h-16" />
                )}
                <div className="w-48 border-b border-zinc-400 mt-1" />
                <span className="mt-2 text-[10px] font-bold text-zinc-700 uppercase">Firma del Encargado Legal</span>
                <span className="text-[9px] text-zinc-500 font-mono mt-0.5">{parentName} ({j.parentescoFirmante || "Encargado"})</span>
                <span className="text-[8px] text-zinc-400 font-mono">Cédula: {parentId}</span>
              </div>
              <div className="flex flex-col items-center justify-end">
                {legalConfig.firmaCoordinadorBase64 ? (
                  <img src={legalConfig.firmaCoordinadorBase64} alt="Firma Coordinación" className="max-h-16 object-contain" />
                ) : (
                  <div className="h-16" />
                )}
                <div className="w-48 border-b border-zinc-400 mt-1" />
                <span className="mt-2 text-[10px] font-bold text-zinc-700 uppercase">Firma de Coordinación Deportiva</span>
                <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Coordinador Deportivo</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimelineCard({ historial }: { historial: any[] }) {
  const [filter, setFilter] = useState<string>("todos");
  const filtros = [
    { id: "todos", label: "Todos" },
    { id: "financiero", label: "Financiero" },
    { id: "deportivo", label: "Deportivo" },
    { id: "medico", label: "Médico" },
    { id: "documentos", label: "Documentos" },
    { id: "comunicaciones", label: "Comunicaciones" },
  ];
  const items = useMemo(() => filter === "todos" ? historial : historial.filter((h) => h.categoria === filter), [filter, historial]);
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Línea de tiempo del atleta</CardTitle>
        <CardDescription>Eventos cronológicos · {items.length} registros</CardDescription>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {filtros.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                filter === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted/50 border-border text-muted-foreground")}>
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6 pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
          {items.map((h) => {
            const Icon = iconForHistorial(h.tipo);
            const tone = toneForHistorial(h.tipo);
            return (
              <div key={h.id} className="relative">
                <div className={cn("absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background", tone)}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{h.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{h.detalle}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">por {h.usuario}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{h.fecha}</span>
                </div>
              </div>
            );
          })}
          {items.length === 0 && <p className="text-sm text-muted-foreground italic">Sin eventos en esta categoría</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusChip({ label, value, tone }: { label: string; value: React.ReactNode; tone: "ok" | "warn" | "bad" }) {
  const toneCls = tone === "ok" ? "border-success/30 bg-success/5 text-success"
    : tone === "warn" ? "border-warning/30 bg-warning/5 text-warning"
    : "border-destructive/30 bg-destructive/5 text-destructive";
  return (
    <div className={cn("rounded-lg border p-3", toneCls)}>
      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums truncate">{value}</p>
    </div>
  );
}

function PositionMap({ principal, secundarias, coords, disciplina, numero }: {
  principal: string; secundarias: string[]; coords: Record<string, { x: number; y: number }>;
  disciplina: string; numero: number;
}) {
  const p = coords[principal];
  const isFutbol = disciplina === "Fútbol";
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_220px]">
      <div className="relative mx-auto w-full max-w-[420px] aspect-[2/3] rounded-xl border-2 border-success/30 bg-gradient-to-b from-success/10 to-success/20 overflow-hidden shadow-inner">
        {/* líneas cancha */}
        <div className="absolute inset-4 border-2 border-white/40 rounded-md" />
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-px bg-white/40" />
        {isFutbol && <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full border-2 border-white/40" />}
        {/* secundarias */}
        {secundarias.map((s) => {
          const c = coords[s];
          if (!c) return null;
          return (
            <div key={s} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${c.x}%`, top: `${c.y}%` }}>
              <div className="h-7 w-7 rounded-full border-2 border-dashed border-warning bg-warning/20 ring-2 ring-background" />
              <span className="mt-1 text-[10px] font-semibold bg-background/80 px-1.5 rounded">{s}</span>
            </div>
          );
        })}
        {/* principal */}
        {p && (
          <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant ring-4 ring-background animate-in zoom-in">
              <span className="text-sm font-bold">{numero}</span>
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/40" />
            </div>
            <span className="mt-1 text-[11px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{principal}</span>
          </div>
        )}
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Principal</p>
          <Badge className="mt-1 bg-primary text-primary-foreground">{principal}</Badge>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Secundarias</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {secundarias.length ? secundarias.map((s) => <Badge key={s} variant="outline" className="border-warning/40 text-warning">{s}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
          </div>
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">Mapa de scouting · {disciplina}</p>
      </div>
    </div>
  );
}


/* ---------- subcomponents ---------- */

function EstadoOperativoBadge({ estadoOp, customDesc }: { estadoOp: keyof typeof estadoOperativoMeta; customDesc?: string }) {
  const m = estadoOperativoMeta[estadoOp] ?? estadoOperativoMeta["habilitado"];
  const descText = customDesc ?? m.desc;
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 ring-1", m.bg, m.ring)}>
      <span className={cn("relative flex h-2 w-2")}>
        <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", m.dot)} />
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", m.dot)} />
      </span>
      <span className={cn("text-xs font-semibold", m.text)}>{m.label}</span>
      <span className="text-xs text-muted-foreground hidden sm:inline">· {descText}</span>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: React.ReactNode; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-card hover:border-primary/30">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className={cn("mt-1 text-base font-semibold tabular-nums", tone === "warn" && "text-warning", tone === "ok" && "text-success")}>{value}</p>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1 min-w-0 overflow-hidden">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium truncate">{label}</p>
      <div className="text-sm font-medium break-words text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 min-w-0 overflow-hidden text-xs">
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className="font-medium text-right truncate max-w-[65%]" title={typeof v === 'string' ? v : undefined}>{v}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground italic">{text}</p>;
}

function QrDialog({ qrUrl, carnetUrl, token, jugador, estadoOp, numero, equipo }: { qrUrl: string; carnetUrl: string; token: string; jugador: any; estadoOp: keyof typeof estadoOperativoMeta; numero: number; equipo: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-bold border-amber-400/40 text-amber-500 hover:bg-amber-500/10">
          <QrCode className="h-4 w-4" /> Carnet Pro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh] bg-slate-950 text-white border-slate-800 p-6">
        <DialogHeader className="text-left mb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-amber-400 uppercase tracking-wide">
            <Sparkles className="h-5 w-5 text-amber-400" /> Acreditación Pro Atleta
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Pase Oficial 3D Holográfico DeportivOS · Imprimible y escaneable en cancha.
          </DialogDescription>
        </DialogHeader>

        <CarnetJugadorPremium
          jugador={{
            id: jugador.id,
            nombre: jugador.nombre,
            identificacion: jugador.identificacion,
            avatar: jugador.avatar,
            disciplina: jugador.disciplina,
            categoria: jugador.categoria,
            sede: jugador.sede,
            edad: jugador.edad,
            posicion: jugador.posicionPrincipal || "Jugador de Campo",
            saldo: jugador.saldo,
          }}
          equipo={equipo}
          numero={numero}
          estadoOp={estadoOp}
          token={token}
        />
      </DialogContent>
    </Dialog>
  );
}

function iconForHistorial(tipo: string) {
  switch (tipo) {
    case "Pago": return DollarSign;
    case "Asistencia": return CheckCircle2;
    case "Evaluación": return Star;
    case "Comunicación": return MessageSquare;
    case "Documento": return FileText;
    case "Médico": return Stethoscope;
    case "Nota": return Edit;
    default: return Activity;
  }
}

function toneForHistorial(tipo: string) {
  switch (tipo) {
    case "Pago": return "bg-success";
    case "Asistencia": return "bg-primary";
    case "Evaluación": return "bg-warning";
    case "Médico": return "bg-destructive";
    case "Nota": return "bg-muted-foreground";
    default: return "bg-primary";
  }
}

function IAPanel({ jugadorId }: { jugadorId: string }) {
  const risk = getRiskScore(jugadorId);
  const recs = aiRecomendaciones.filter((r) => r.jugadorId === jugadorId);
  const preds = aiPredicciones.filter((p) => p.jugadorId === jugadorId);
  if (!risk) return <Card><CardContent className="p-6 text-sm text-muted-foreground">Sin datos IA disponibles.</CardContent></Card>;

  const scores = [
    { label: "Abandono", value: risk.scoreAbandono, nivel: risk.nivelAbandono },
    { label: "Mora", value: risk.scoreMora, nivel: risk.nivelMora },
    { label: "Lesión", value: risk.scoreLesion, nivel: risk.nivelLesion },
    { label: "Asistencia", value: risk.scoreAsistencia, nivel: risk.nivelAsistencia },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {scores.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Riesgo {s.label}</p>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-bold">{s.value}</p>
                <Badge variant={s.nivel === "critico" || s.nivel === "alto" ? "destructive" : s.nivel === "medio" ? "secondary" : "outline"}>{s.nivel}</Badge>
              </div>
              <Progress value={s.value} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {risk.factores.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Factores detectados</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {risk.factores.map((f, i) => <Badge key={i} variant="outline">{f}</Badge>)}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> Recomendaciones</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recs.length === 0 && <p className="text-sm text-muted-foreground">Sin recomendaciones actuales.</p>}
            {recs.map((r) => (
              <div key={r.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm">{r.texto}</p>
                  <Badge variant={r.prioridad === "critica" ? "destructive" : "secondary"}>{r.prioridad}</Badge>
                </div>
                <Button size="sm" variant="outline" className="mt-2">{r.accion}</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Predicciones</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {preds.length === 0 && <p className="text-sm text-muted-foreground">Sin predicciones activas.</p>}
            {preds.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="capitalize">{p.tipo}</Badge>
                  <span className="text-sm font-mono">{p.probabilidad}% · {p.horizonte}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.descripcion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ==========================================
// ALTO RENDIMIENTO SUB-TAB FOR PLAYER OS
// ==========================================

import {
  Flame as LucideFlame,
  Moon as LucideMoon,
  TrendingUp as LucideTrendingUp,
  Gauge as LucideGauge,
  Timer as LucideTimer,
  AlertTriangle as LucideAlertTriangle,
  Award as LucideAward,
  HeartPulse as LucideHeartPulse,
  Stethoscope as LucideStethoscope,
  Plus as LucidePlus,
  Copy as LucideCopy,
  RefreshCw as LucideRefreshCw,
  Upload as LucideUpload,
  Sparkles as LucideSparkles,
  CheckCircle2 as LucideCheckCircle2,
  ChevronRight as LucideChevronRight,
  ShieldAlert as LucideShieldAlert,
  ShieldCheck as LucideShieldCheck,
  FileSpreadsheet as LucideFileSpreadsheet,
  FileText as LucideFileText,
  Map as LucideMap,
  Zap as LucideZap,
  Target as LucideTarget,
  Trash as LucideTrash,
  Edit2 as LucideEdit2
} from "lucide-react";

const sesionTipoColor: Record<string, string> = {
  Técnica: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  Táctica: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  Física: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Recuperación: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Competencia: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

function AltoRendimientoTab({ jugador, equipo }: { jugador: any; equipo: string }) {
  const [activeSubTab, setActiveSubTab] = useState("dashboard-hp");
  const [openFichaTecnicaModal, setOpenFichaTecnicaModal] = useState(false);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [wellnessLogs, setWellnessLogs] = useState<WellnessRegistro[]>([]);
  const [tests, setTests] = useState<TestFisico[]>([]);
  const [lesiones, setLesiones] = useState<Lesion[]>([]);
  const [draggingOverDay, setDraggingOverDay] = useState<string | null>(null);

  // Planning state
  const [openNuevaSesion, setOpenNuevaSesion] = useState(false);
  const [openNuevoCiclo, setOpenNuevoCiclo] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [selectedSesionForDetail, setSelectedSesionForDetail] = useState<Sesion | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newSesion, setNewSesion] = useState({
    nombre: "",
    tipo: "Física" as any,
    fecha: "2026-07-12",
    hora: "09:00",
    duracion: 60,
    equipo: equipo,
  });
  const [newCiclo, setNewCiclo] = useState({
    nombre: "",
    tipo: "microciclo" as any,
    subtipo: "Preparación General",
    inicio: "2026-07-15",
    fin: "2026-07-22",
    equipo: equipo,
    objetivo: "",
    intensidad: "Media" as any,
    volumen: 480,
    color: "bg-primary",
  });

  // Modals state
  const [openRpe, setOpenRpe] = useState(false);
  const [selectedSesionId, setSelectedSesionId] = useState("");
  const [loggedRPE, setLoggedRPE] = useState(6);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("Garmin");

  // Wellness form
  const [openWellness, setOpenWellness] = useState(false);
  const [checkin, setCheckin] = useState({
    sueñoHoras: 8,
    sueñoCalidad: 4,
    fatiga: 2,
    estres: 1,
    dolorMuscular: 2,
    animo: 5,
    energia: 4,
    motivacion: 5,
  });

  // Tests form
  const [openTest, setOpenTest] = useState(false);
  const [newTest, setNewTest] = useState({
    tipo: "Velocidad" as any,
    nombreTest: "Sprint 30m",
    resultado: "4.15s",
    progreso: 5.0,
    estancado: false,
  });

  // Injury form
  const [openInjury, setOpenInjury] = useState(false);
  const [newInjury, setNewInjury] = useState({
    tipo: "Contractura",
    zonaCorporal: "Isquiotibiales",
    gravedad: "Leve" as any,
    diagnostico: "Contractura muscular leve detectada en pruebas",
    tratamiento: "Reposo activo y fisioterapia",
    restricciones: "Evitar sprints de alta velocidad",
    cargaPermitida: 75,
  });

  const loadData = () => {
    if (!jugador) return;
    setSesiones(RendimientoStore.getSesiones().filter(s => s.equipo === equipo));
    setCiclos(RendimientoStore.getCiclos().filter(c => c.equipo === equipo));
    setWellnessLogs(RendimientoStore.getWellness().filter(w => w?.jugadorId === jugador?.id));
    setTests(RendimientoStore.getTests().filter(t => t?.jugadorId === jugador?.id));
    setLesiones(RendimientoStore.getLesiones().filter(l => l?.jugadorId === jugador?.id));
  };

  useEffect(() => {
    if (jugador?.id) loadData();
  }, [jugador?.id, equipo]);

  // Actions handlers
  const handleSaveRpe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSesionId) return;
    const s = sesiones.find(x => x.id === selectedSesionId);
    if (!s) return;

    RendimientoStore.updateSesion(selectedSesionId, {
      rpe: loggedRPE,
      carga: s.duracion * loggedRPE,
    });
    toast.success("Esfuerzo RPE registrado para esta sesión");
    setOpenRpe(false);
    setSelectedSesionId("");
    loadData();
  };

  const handleSyncGPS = (sesionId: string) => {
    RendimientoStore.updateSesion(sesionId, {
      gpsSincronizado: true,
      gpsData: {
        distancia: 5900 + Math.floor(Math.random() * 800),
        sprints: 9 + Math.floor(Math.random() * 6),
        aceleraciones: 34 + Math.floor(Math.random() * 15),
        velocidadMax: 27 + Math.floor(Math.random() * 4),
        frecuenciaCardiaca: 145 + Math.floor(Math.random() * 15),
      },
    });
    toast.success("Métricas del dispositivo sincronizadas");
    loadData();
  };

  const handleAddWellness = (e: React.FormEvent) => {
    e.preventDefault();
    RendimientoStore.addWellness({
      ...checkin,
      jugadorId: jugador.id,
      jugador: jugador.nombre,
      fecha: new Date().toISOString().slice(0, 10),
    });
    toast.success("Check-In diario de bienestar guardado");
    setOpenWellness(false);
    loadData();
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    RendimientoStore.addTest({
      ...newTest,
      jugadorId: jugador.id,
      jugador: jugador.nombre,
      fecha: new Date().toISOString().slice(0, 10),
    });
    toast.success("Evaluación física guardada");
    setOpenTest(false);
    loadData();
  };

  const handleAddInjury = (e: React.FormEvent) => {
    e.preventDefault();
    RendimientoStore.addLesion({
      ...newInjury,
      jugadorId: jugador.id,
      jugador: jugador.nombre,
      fecha: new Date().toISOString().slice(0, 10),
      tratamiento: [newInjury.tratamiento],
      dolor: 4,
      movilidad: 85,
      progresoRtp: 30,
      retornoChecklist: { altaMedica: false, altaDeportiva: false, sinDolor: true, movilidadCompleta: false },
      completada: false,
    });
    toast.success("Expediente de lesión registrado");
    setOpenInjury(false);
    loadData();
  };

  const handleToggleEstancado = (id: string, current: boolean) => {
    RendimientoStore.updateTest(id, { estancado: !current });
    toast.success("Estado de estancamiento actualizado");
    loadData();
  };

  const handleUpdateRtp = (id: string, progress: number, done: boolean) => {
    RendimientoStore.updateLesion(id, {
      progresoRtp: progress,
      completada: done,
      retornoChecklist: { altaMedica: progress >= 90, altaDeportiva: done, sinDolor: true, movilidadCompleta: progress >= 80 },
    });
    toast.success(done ? "Dado de alta médica y deportiva" : "Progreso RTP actualizado");
    loadData();
  };

  const handleDragReschedule = (sessionId: string, newDate: string) => {
    const s = sesiones.find(x => x.id === sessionId);
    if (!s) return;
    if (s.fecha === newDate) return;

    RendimientoStore.updateSesion(sessionId, { fecha: newDate });
    toast.success(`Sesión "${s.nombre}" reprogramada al ${newDate}`);
    loadData();
  };

  const handleAddSesion = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSessionId) {
      RendimientoStore.updateSesion(editingSessionId, newSesion);
      toast.success("Sesión de entrenamiento actualizada");
    } else {
      RendimientoStore.addSesion({
        ...newSesion,
        equipo: equipo,
      });
      toast.success("Sesión de entrenamiento planificada");
    }
    setEditingSessionId(null);
    setNewSesion({
      nombre: "",
      tipo: "Física",
      fecha: "2026-07-12",
      hora: "09:00",
      duracion: 60,
      equipo: equipo,
    });
    setOpenNuevaSesion(false);
    loadData();
  };

  const handleEditClick = (s: Sesion) => {
    setEditingSessionId(s.id);
    setNewSesion({
      nombre: s.nombre,
      tipo: s.tipo,
      fecha: s.fecha,
      hora: s.hora,
      duracion: s.duracion,
      equipo: s.equipo,
    });
    setOpenNuevaSesion(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta sesión de la planificación?")) {
      RendimientoStore.deleteSesion(id);
      toast.success("Sesión eliminada con éxito");
      loadData();
    }
  };

  const handleAddCiclo = (e: React.FormEvent) => {
    e.preventDefault();
    const colors = ["bg-primary", "bg-violet-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    RendimientoStore.addCiclo({
      ...newCiclo,
      equipo: equipo,
      color: randColor,
      capacidades: [],
      activo: true,
    });
    toast.success("Ciclo de planificación guardado");
    setNewCiclo({
      nombre: "",
      tipo: "microciclo",
      subtipo: "Preparación General",
      inicio: "2026-07-15",
      fin: "2026-07-22",
      equipo: equipo,
      objetivo: "",
      intensidad: "Media",
      volumen: 480,
      color: "bg-primary",
    });
    setOpenNuevoCiclo(false);
    loadData();
  };

  // Computations
  const totalMinutos = sesiones.reduce((acc, s) => acc + s.duracion, 0);
  const avgRpe = sesiones.filter(s => s.rpe !== undefined).length > 0
    ? (sesiones.filter(s => s.rpe !== undefined).reduce((acc, s) => acc + (s.rpe || 0), 0) / sesiones.filter(s => s.rpe !== undefined).length).toFixed(1)
    : "0.0";

  const loadDataRecord = useMemo(() => {
    if (!jugador?.id) return undefined;
    return RendimientoStore.getPlayerLoadData().find(r => r.jugadorId === jugador.id);
  }, [jugador?.id, sesiones, wellnessLogs]);

  const cargaSemanal = loadDataRecord ? loadDataRecord.cargaSemanal : sesiones.filter(s => s.rpe !== undefined).reduce((acc, s) => acc + (s.carga || 0), 0);
  const activeLesiones = lesiones.filter(l => !l.completada);
  const latestWellness = wellnessLogs[wellnessLogs.length - 1];

  const getSemaforoClass = (score: number) => {
    if (score >= 80) return "bg-success/15 text-success border-success/30";
    if (score >= 60) return "bg-warning/20 text-warning-foreground border-warning/30";
    return "bg-destructive/15 text-destructive border-destructive/30";
  };

  const chartData = sesiones.filter(s => s.rpe !== undefined).map(s => ({
    fecha: s.fecha.slice(5),
    "Carga (AU)": s.carga || 0,
    "RPE": s.rpe || 0,
    "Distancia (m)": s.gpsData?.distancia || 0,
  }));

  const diasSemana = ["2026-07-10", "2026-07-11", "2026-07-12", "2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16"];
  const diasNombres = ["Viernes 10", "Sábado 11", "Domingo 12", "Lunes 13", "Martes 14", "Miércoles 15", "Jueves 16"];

  return (
    <div className="space-y-6">
      {activeLesiones.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5 shadow-card">
          <CardContent className="pt-4 flex items-start gap-3">
            <LucideShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-destructive">Restricción Médica Activa</p>
              <p className="text-xs text-muted-foreground">El jugador tiene un expediente médico activo por {activeLesiones[0].tipo} ({activeLesiones[0].zonaCorporal}). Carga máxima permitida: {activeLesiones[0].cargaPermitida}%.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-auto flex-wrap justify-start gap-1 bg-muted/30 p-1">
            <TabsTrigger value="dashboard-hp" className="text-xs py-1.5 px-3">Dashboard</TabsTrigger>
            <TabsTrigger value="planificacion-hp" className="text-xs py-1.5 px-3">Planificación</TabsTrigger>
            <TabsTrigger value="cargas-hp" className="text-xs py-1.5 px-3">Cargas</TabsTrigger>
            <TabsTrigger value="wellness-hp" className="text-xs py-1.5 px-3">Wellness</TabsTrigger>
            <TabsTrigger value="gps-hp" className="text-xs py-1.5 px-3">GPS / Wearables</TabsTrigger>
            <TabsTrigger value="tests-hp" className="text-xs py-1.5 px-3">Tests Físicos</TabsTrigger>
            <TabsTrigger value="lesiones-hp" className="text-xs py-1.5 px-3">Lesiones</TabsTrigger>
          </TabsList>
        </div>

        {/* 1. DASHBOARD HP */}
        <TabsContent value="dashboard-hp" className="space-y-4 mt-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Carga Semanal</p>
              <p className="text-xl font-bold mt-1">{cargaSemanal} AU</p>
              <Progress value={Math.min(cargaSemanal / 25, 100)} className="h-1.5 mt-2" />
            </Card>
            <Card className="p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Esfuerzo RPE Promedio</p>
              <p className="text-xl font-bold mt-1">{avgRpe}/10</p>
              <p className="text-[10px] text-muted-foreground mt-1">Percepción subjetiva</p>
            </Card>
            <Card className="p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">ACWR (Cargas)</p>
              <p className="text-xl font-bold mt-1">{loadDataRecord ? loadDataRecord.acwr.toFixed(2) : "1.00"}</p>
              {loadDataRecord && (
                <Badge className={`text-[9px] mt-1 border-0 ${
                  loadDataRecord.acwr > 1.5 ? "bg-destructive/15 text-destructive" :
                  loadDataRecord.acwr > 1.3 ? "bg-warning/20 text-warning-foreground" :
                  "bg-success/15 text-success"
                }`}>
                  {loadDataRecord.acwr > 1.5 ? "Alto Riesgo" : loadDataRecord.acwr > 1.3 ? "Precaución" : "Óptimo"}
                </Badge>
              )}
            </Card>
            <Card className="p-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Readiness Wellness</p>
              <p className="text-xl font-bold mt-1">{latestWellness ? `${latestWellness.score || latestWellness.wellnessScore}%` : "—"}</p>
              {latestWellness && <Badge className={`text-[9px] mt-1 border-0 ${getSemaforoClass(latestWellness.score || latestWellness.wellnessScore || 0)}`}>{latestWellness.score && (latestWellness.score >= 80 || (latestWellness.wellnessScore && latestWellness.wellnessScore >= 80)) ? "Excelente" : "Precaución"}</Badge>}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Histórico de Carga del Jugador</CardTitle></CardHeader>
              <CardContent className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -10, right: 5, top: 5 }}>
                    <defs>
                      <linearGradient id="pCarga" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="fecha" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="Carga (AU)" stroke="var(--color-primary)" strokeWidth={2} fill="url(#pCarga)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-primary" /> Semáforo de Riesgo
                </CardTitle>
                {loadDataRecord && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    loadDataRecord.semaforo === "rojo" ? "bg-red-500 text-white animate-pulse" :
                    loadDataRecord.semaforo === "amarillo" ? "bg-amber-500 text-white" :
                    "bg-emerald-500 text-white"
                  }`}>
                    {loadDataRecord.semaforo === "rojo" ? "Riesgo Alto" :
                     loadDataRecord.semaforo === "amarillo" ? "Sobrecarga" :
                     "Óptimo"}
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {loadDataRecord && loadDataRecord.semaforoMotivos.length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-muted-foreground">Motivos:</p>
                    <ul className="space-y-1.5 pl-1">
                      {loadDataRecord.semaforoMotivos.map((motivo, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-tight">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/50 shrink-0" />
                          <span>{motivo}</span>
                        </li>
                      ))}
                    </ul>
                    <div className={`mt-2 rounded-lg border p-2 ${
                      loadDataRecord.semaforo === "rojo" ? "border-red-200 bg-red-50/50" :
                      loadDataRecord.semaforo === "amarillo" ? "border-amber-200 bg-amber-50/50" :
                      "border-emerald-200 bg-emerald-50/50"
                    }`}>
                      <p className="font-bold text-[10px]">Recomendación:</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">{loadDataRecord.semaforoRecomendacion}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border rounded-lg bg-success/5 border-success/20 space-y-1">
                    <p className="font-semibold text-success-foreground">Estado Físico Óptimo</p>
                    <p className="text-muted-foreground">El atleta se encuentra en perfectas condiciones. Carga y wellness balanceados.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. PLANIFICACIÓN */}
        <TabsContent value="planificacion-hp" className="space-y-4 mt-0">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Planificación de {jugador.nombre} ({equipo})</h3>
            <div className="flex gap-2">
              <Sheet open={openNuevaSesion} onOpenChange={(open) => {
                setOpenNuevaSesion(open);
                if (!open) {
                  setEditingSessionId(null);
                  setNewSesion({
                    nombre: "",
                    tipo: "Física",
                    fecha: "2026-07-12",
                    hora: "09:00",
                    duracion: 60,
                    equipo: equipo,
                  });
                }
              }}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm"><LucidePlus className="mr-1 h-3.5 w-3.5" />Nueva Sesión</Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{editingSessionId ? "Editar Sesión de Entrenamiento" : `Planificar Sesión para ${equipo}`}</SheetTitle>
                    <SheetDescription>
                      {editingSessionId ? "Modifica los detalles de este entrenamiento." : "Agrega una nueva sesión de entrenamiento para esta categoría."}
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleAddSesion} className="space-y-4 pt-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Nombre de la Sesión</label>
                      <Input required placeholder="Ej. Táctico de presión alta" value={newSesion.nombre} onChange={(e) => setNewSesion({ ...newSesion, nombre: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Tipo</label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newSesion.tipo} onChange={(e) => setNewSesion({ ...newSesion, tipo: e.target.value as any })}>
                          <option value="Técnica">Técnica</option>
                          <option value="Táctica">Táctica</option>
                          <option value="Física">Física</option>
                          <option value="Recuperación">Recuperación</option>
                          <option value="Competencia">Competencia</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Duración (min)</label>
                        <Input type="number" required value={newSesion.duracion} onChange={(e) => setNewSesion({ ...newSesion, duracion: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Fecha</label>
                        <Input type="date" required value={newSesion.fecha} onChange={(e) => setNewSesion({ ...newSesion, fecha: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Hora</label>
                        <Input type="time" required value={newSesion.hora} onChange={(e) => setNewSesion({ ...newSesion, hora: e.target.value })} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Guardar Sesión</Button>
                  </form>
                </SheetContent>
              </Sheet>

              <Sheet open={openNuevoCiclo} onOpenChange={setOpenNuevoCiclo}>
                <SheetTrigger asChild>
                  <Button size="sm" className="bg-gradient-primary shadow-elegant"><LucidePlus className="mr-1 h-3.5 w-3.5" />Nuevo Ciclo</Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Crear Ciclo para {equipo}</SheetTitle>
                    <SheetDescription>Configura temporadas, macrociclos, mesociclos y microciclos.</SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleAddCiclo} className="space-y-4 pt-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Nombre del Ciclo</label>
                      <Input required placeholder="Ej. Macrociclo Competitivo Apertura" value={newCiclo.nombre} onChange={(e) => setNewCiclo({ ...newCiclo, nombre: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Tipo</label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newCiclo.tipo} onChange={(e) => setNewCiclo({ ...newCiclo, tipo: e.target.value as any })}>
                          <option value="temporada">Temporada</option>
                          <option value="macrociclo">Macrociclo</option>
                          <option value="mesociclo">Mesociclo</option>
                          <option value="microciclo">Microciclo</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Inicio</label>
                        <Input type="date" required value={newCiclo.inicio} onChange={(e) => setNewCiclo({ ...newCiclo, inicio: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Fin</label>
                        <Input type="date" required value={newCiclo.fin} onChange={(e) => setNewCiclo({ ...newCiclo, fin: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Intensidad</label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newCiclo.intensidad} onChange={(e) => setNewCiclo({ ...newCiclo, intensidad: e.target.value as any })}>
                          <option value="Baja">Baja</option>
                          <option value="Media">Media</option>
                          <option value="Alta">Alta</option>
                          <option value="Muy alta">Muy alta</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Volumen Total (min)</label>
                        <Input type="number" required value={newCiclo.volumen} onChange={(e) => setNewCiclo({ ...newCiclo, volumen: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Objetivo</label>
                      <Textarea required placeholder="Escribe el objetivo deportivo..." value={newCiclo.objetivo} onChange={(e) => setNewCiclo({ ...newCiclo, objetivo: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full">Guardar Ciclo</Button>
                  </form>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 shadow-card">
              <CardHeader><CardTitle className="text-sm">Cronograma y Sesiones del Equipo</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                  {diasSemana.map((dia, idx) => {
                    const sesionesDelDia = sesiones.filter(s => s.fecha === dia);
                    return (
                      <div
                        key={dia}
                        className={cn(
                          "rounded-lg border min-h-[160px] flex flex-col transition-all duration-200 bg-muted/10",
                          draggingOverDay === dia ? "border-primary bg-primary/10 scale-[1.03] shadow-md" : "border-border"
                        )}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggingOverDay !== dia) setDraggingOverDay(dia);
                        }}
                        onDragLeave={() => setDraggingOverDay(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDraggingOverDay(null);
                          const sessionId = e.dataTransfer.getData("sessionId");
                          if (sessionId) handleDragReschedule(sessionId, dia);
                        }}
                      >
                        <div className="border-b bg-muted/40 p-1.5 text-center text-[10px] font-semibold uppercase text-muted-foreground rounded-t-lg">
                          {diasNombres[idx].split(" ")[0]}
                        </div>
                        <div className="p-1 space-y-1.5 flex-1">
                          {sesionesDelDia.map((s) => (
                            <div
                              key={s.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("sessionId", s.id);
                              }}
                              onClick={() => {
                                setSelectedSesionForDetail(s);
                                setShowDeleteConfirm(false);
                              }}
                              className={cn(
                                "rounded p-2.5 text-[11px] border shadow-sm cursor-grab active:cursor-grabbing hover:scale-102 hover:shadow-md transition-all duration-150 relative text-left",
                                sesionTipoColor[s.tipo] || ""
                              )}
                            >
                              <p className="font-semibold text-xs">{s.hora}</p>
                              <p className="font-medium truncate mt-0.5">{s.nombre}</p>
                              <p className="opacity-75">{s.duracion} min</p>
                            </div>
                          ))}
                          {sesionesDelDia.length === 0 && (
                            <div className="text-[9px] text-muted-foreground text-center py-6">Descanso</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-sm">Ciclos activos y objetivos</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-xs">
                {ciclos.map((c) => (
                  <div key={c.id} className="p-2 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{c.nombre}</span>
                      <Badge className="text-[9px] capitalize">{c.tipo}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{c.inicio} al {c.fin}</p>
                    <p className="mt-1.5 font-medium text-primary">Objetivo: {c.objetivo}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. CONTROL DE CARGAS */}
        <TabsContent value="cargas-hp" className="space-y-4 mt-0">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <h3 className="text-sm font-semibold">Registro y Control de Cargas de Entrenamiento</h3>
            <Sheet open={openRpe} onOpenChange={setOpenRpe}>
              <SheetTrigger asChild>
                <Button size="sm" className="bg-gradient-primary shadow-elegant"><LucidePlus className="mr-1 h-3.5 w-3.5" />Registrar Esfuerzo (RPE)</Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Registrar RPE para {jugador.nombre}</SheetTitle>
                  <SheetDescription>Completa el esfuerzo de la sesión para el control de carga acumulada.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSaveRpe} className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Seleccionar Sesión</label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required value={selectedSesionId} onChange={(e) => setSelectedSesionId(e.target.value)}>
                      <option value="">-- Selecciona sesión --</option>
                      {sesiones.filter(s => s.rpe === undefined).map(s => (
                        <option key={s.id} value={s.id}>{s.fecha} · {s.nombre} ({s.duracion} min)</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Esfuerzo RPE (1-10)</label>
                    <div className="flex items-center gap-4">
                      <Input type="range" min="1" max="10" value={loggedRPE} onChange={(e) => setLoggedRPE(Number(e.target.value))} />
                      <span className="text-lg font-bold border rounded px-3 py-1 bg-muted">{loggedRPE}</span>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Guardar Registro</Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid gap-3">
            {sesiones.map((s) => (
              <div key={s.id} className="rounded-lg border p-3 flex flex-wrap items-center justify-between gap-4 bg-card hover:shadow-elegant transition">
                <div className="space-y-1">
                  <p className="font-semibold text-xs">{s.nombre}</p>
                  <p className="text-[11px] text-muted-foreground">{s.fecha} · {s.duracion} min · {s.equipo}</p>
                </div>
                <div className="flex items-center gap-3">
                  {s.rpe !== undefined ? (
                    <div className="text-right">
                      <p className="text-xs font-bold">RPE: {s.rpe}/10</p>
                      <p className="text-[10px] text-muted-foreground">{s.carga} AU</p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-dashed text-[10px]">Pendiente</Badge>
                  )}
                  {s.gpsSincronizado && s.gpsData ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">Wearable Sync</Badge>
                  ) : (
                    <Button size="xs" variant="outline" onClick={() => handleSyncGPS(s.id)}>Sincronizar</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 4. WELLNESS */}
        <TabsContent value="wellness-hp" className="space-y-4 mt-0">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <h3 className="text-sm font-semibold">Bienestar Diario</h3>
            <Sheet open={openWellness} onOpenChange={setOpenWellness}>
              <SheetTrigger asChild>
                <Button size="sm" className="bg-gradient-primary shadow-elegant"><LucidePlus className="mr-1 h-3.5 w-3.5" />Nuevo Check-In</Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Registrar Check-In Diario</SheetTitle>
                  <SheetDescription>Completa el formulario de bienestar de hoy.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleAddWellness} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Horas Sueño</label>
                      <Input type="number" required value={checkin.sueñoHoras} onChange={(e) => setCheckin({ ...checkin, sueñoHoras: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Calidad Sueño (1-5)</label>
                      <Input type="number" min="1" max="5" required value={checkin.sueñoCalidad} onChange={(e) => setCheckin({ ...checkin, sueñoCalidad: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Fatiga (1-5)</label>
                      <Input type="number" min="1" max="5" required value={checkin.fatiga} onChange={(e) => setCheckin({ ...checkin, fatiga: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Dolor Muscular (1-5)</label>
                      <Input type="number" min="1" max="5" required value={checkin.dolorMuscular} onChange={(e) => setCheckin({ ...checkin, dolorMuscular: Number(e.target.value) })} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Guardar Registro</Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid gap-3">
            {wellnessLogs.map((w) => (
              <div key={w.id} className="rounded-lg border p-3 bg-card hover:shadow-elegant transition flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-xs">{w.fecha}</p>
                  <p className="text-[10px] text-muted-foreground">Sueño: {w.sueñoHoras} hrs · Calidad: {w.sueñoCalidad}/5 · Fatiga: {w.fatiga}/5 · Dolor Muscular: {w.dolorMuscular}/5</p>
                </div>
                <div className={`rounded px-2 py-0.5 text-[10px] border font-bold ${getSemaforoClass(w.score || 0)}`}>
                  {w.score}%
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 5. GPS & WEARABLES */}
        <TabsContent value="gps-hp" className="space-y-4 mt-0">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            <Card className="flex-1 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Enlace de Hardware</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
                    <option value="Garmin">Garmin</option>
                    <option value="Polar">Polar</option>
                    <option value="WHOOP">WHOOP</option>
                    <option value="Apple Watch">Apple Watch</option>
                    <option value="Catapult">Catapult</option>
                  </select>
                  <Button className="gap-1 bg-gradient-primary shadow-elegant" onClick={() => {
                    toast.success(`Dispositivo ${selectedBrand} enlazado con éxito`);
                  }}><LucideRefreshCw className="h-4 w-4" /> Enlazar</Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/30 p-2 rounded text-center">
                    <p className="font-bold">5.8 km</p>
                    <p className="text-[10px] text-muted-foreground">Distancia Prom</p>
                  </div>
                  <div className="bg-muted/30 p-2 rounded text-center">
                    <p className="font-bold">145 bpm</p>
                    <p className="text-[10px] text-muted-foreground">FC Promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 shadow-sm overflow-hidden min-h-[200px] relative">
              {/* Soccer field map simulated overlay */}
              <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=400')" }} />
              <div className="absolute inset-0 bg-radial-gradient from-primary/30 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 p-2 bg-background/95 border rounded backdrop-blur-sm text-[10px]">
                <p className="font-bold">Mapa de Calor GPS de {jugador.nombre}</p>
                <p className="text-muted-foreground">Posiciones tácticas en carril izquierdo.</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 6. TESTS FÍSICOS */}
        <TabsContent value="tests-hp" className="space-y-4 mt-0">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <h3 className="text-sm font-semibold">Evaluaciones Físicas</h3>
            <Sheet open={openTest} onOpenChange={setOpenTest}>
              <SheetTrigger asChild>
                <Button size="sm" className="bg-gradient-primary shadow-elegant"><LucidePlus className="mr-1 h-3.5 w-3.5" />Registrar Test</Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Registrar Evaluación Física</SheetTitle>
                  <SheetDescription>Guarda los resultados del test físico de {jugador.nombre}.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleAddTest} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Capacidad</label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newTest.tipo} onChange={(e) => setNewTest({ ...newTest, tipo: e.target.value as any })}>
                        <option value="Velocidad">Velocidad</option>
                        <option value="Resistencia">Resistencia</option>
                        <option value="Salto">Salto</option>
                        <option value="Fuerza">Fuerza</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Nombre del Test</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm font-semibold"
                        value={newTest.nombreTest}
                        onChange={(e) => setNewTest({ ...newTest, nombreTest: e.target.value })}
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Resultado</label>
                      <Input required placeholder="Ej. 4.15s / Nivel 18" value={newTest.resultado} onChange={(e) => setNewTest({ ...newTest, resultado: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Progreso (%)</label>
                      <Input type="number" step="0.1" required value={newTest.progreso} onChange={(e) => setNewTest({ ...newTest, progreso: Number(e.target.value) })} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Guardar Test</Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid gap-3">
            {tests.map((t) => (
              <div key={t.id} className={`rounded-lg border p-3 flex items-center justify-between gap-4 bg-card ${t.estancado ? "border-warning/30 bg-warning/5" : ""}`}>
                <div className="space-y-1">
                  <p className="font-semibold text-xs">{t.nombreTest} ({t.tipo})</p>
                  <p className="text-[10px] text-muted-foreground">Fecha: {t.fecha} · Resultado: {t.resultado} · Progreso: {t.progreso > 0 ? `+${t.progreso}` : t.progreso}%</p>
                  {t.estancado && <p className="text-[9px] text-destructive font-semibold">⚠️ Estancamiento Detectado. Requiere ajuste de carga.</p>}
                </div>
                <Button size="xs" variant={t.estancado ? "default" : "outline"} onClick={() => handleToggleEstancado(t.id, t.estancado)}>
                  {t.estancado ? "Marcar en Progreso" : "Marcar Estancado"}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 7. LESIONES */}
        <TabsContent value="lesiones-hp" className="space-y-4 mt-0">
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <h3 className="text-sm font-semibold">Expediente Médico</h3>
            <Sheet open={openInjury} onOpenChange={setOpenInjury}>
              <SheetTrigger asChild>
                <Button size="sm" className="bg-gradient-primary shadow-elegant"><LucidePlus className="mr-1 h-3.5 w-3.5" />Registrar Lesión</Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Registrar Nueva Lesión</SheetTitle>
                  <SheetDescription>Registra el diagnóstico, tratamiento y alta deportiva del atleta.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleAddInjury} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Tipo</label>
                      <Input required placeholder="Ej. Esguince" value={newInjury.tipo} onChange={(e) => setNewInjury({ ...newInjury, tipo: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Zona Corporal</label>
                      <Input required placeholder="Ej. Tobillo derecho" value={newInjury.zonaCorporal} onChange={(e) => setNewInjury({ ...newInjury, zonaCorporal: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Gravedad</label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newInjury.gravedad} onChange={(e) => setNewInjury({ ...newInjury, gravedad: e.target.value as any })}>
                        <option value="Leve">Leve</option>
                        <option value="Moderada">Moderada</option>
                        <option value="Grave">Grave</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Max Carga (%)</label>
                      <Input type="number" required value={newInjury.cargaPermitida} onChange={(e) => setNewInjury({ ...newInjury, cargaPermitida: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Diagnóstico</label>
                    <Textarea required placeholder="Escribe el diagnóstico..." value={newInjury.diagnostico} onChange={(e) => setNewInjury({ ...newInjury, diagnostico: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Tratamiento inicial</label>
                    <Input required placeholder="Ej. Fisioterapia y reposo" value={newInjury.tratamiento} onChange={(e) => setNewInjury({ ...newInjury, tratamiento: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Restricciones</label>
                    <Input required placeholder="Ej. Evitar impactos" value={newInjury.restricciones} onChange={(e) => setNewInjury({ ...newInjury, restricciones: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full">Registrar Lesión</Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid gap-3">
            {lesiones.map((l) => (
              <div key={l.id} className="p-3 border rounded-lg bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs mr-2">{l.tipo} ({l.zonaCorporal})</span>
                    <Badge variant={l.completada ? "secondary" : "destructive"} className="text-[9px]">{l.completada ? "Alta" : "Rehabilitación"}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{l.fecha}</span>
                </div>
                <p className="text-xs text-muted-foreground">**Diagnóstico:** {l.diagnostico}</p>
                <div className="text-xs space-y-1 pt-1.5 border-t">
                  <p className="font-semibold text-primary">Restricciones: {l.restricciones} (Máx Carga: {l.cargaPermitida}%)</p>
                  <p>Progreso de recuperación: {l.progresoRtp}%</p>
                </div>
                {!l.completada && (
                  <div className="pt-2 flex gap-1.5">
                    <Button size="xs" variant="outline" onClick={() => handleUpdateRtp(l.id, 80, false)}>Avanzar (80%)</Button>
                    <Button size="xs" variant="default" onClick={() => handleUpdateRtp(l.id, 100, true)}>Dar de Alta (100%)</Button>
                  </div>
                )}
              </div>
            ))}
            {lesiones.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Sin lesiones registradas para este jugador.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Styled Dialog for Session Details & Delete Confirmation */}
      <Dialog open={!!selectedSesionForDetail} onOpenChange={(open) => { if (!open) setSelectedSesionForDetail(null); }}>
        <DialogContent className="sm:max-w-md bg-background border shadow-elegant">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <span className={cn("inline-block h-3.5 w-3.5 rounded-full", 
                selectedSesionForDetail?.tipo === "Técnica" ? "bg-blue-500" :
                selectedSesionForDetail?.tipo === "Táctica" ? "bg-violet-500" :
                selectedSesionForDetail?.tipo === "Física" ? "bg-emerald-500" :
                selectedSesionForDetail?.tipo === "Recuperación" ? "bg-amber-500" : "bg-rose-500"
              )} />
              {selectedSesionForDetail?.nombre}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Detalles de la sesión planificada para la categoría {equipo}
            </DialogDescription>
          </DialogHeader>

          {!showDeleteConfirm ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm border-y py-3">
                <div>
                  <span className="text-muted-foreground block text-xs uppercase font-semibold">Tipo</span>
                  <span className="font-semibold">{selectedSesionForDetail?.tipo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase font-semibold">Duración</span>
                  <span className="font-semibold">{selectedSesionForDetail?.duracion} minutos</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase font-semibold">Fecha</span>
                  <span className="font-semibold">{selectedSesionForDetail?.fecha}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs uppercase font-semibold">Hora</span>
                  <span className="font-semibold">{selectedSesionForDetail?.hora}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  onClick={() => {
                    if (selectedSesionForDetail) {
                      handleEditClick(selectedSesionForDetail);
                      setSelectedSesionForDetail(null);
                    }
                  }}
                  className="w-full h-11 flex items-center justify-center gap-2 font-medium bg-gradient-primary"
                >
                  <LucideEdit2 className="h-4 w-4" /> Editar Entrenamiento
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full h-11 border-destructive text-destructive hover:bg-destructive/5 flex items-center justify-center gap-2 font-medium"
                >
                  <LucideTrash className="h-4 w-4" /> Eliminar Sesión
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <LucideShieldAlert className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-base text-foreground">¿Confirmas la eliminación?</p>
                <p className="text-sm text-muted-foreground">
                  Esta acción no se puede deshacer y borrará permanentemente la sesión de entrenamiento.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-11"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (selectedSesionForDetail) {
                      RendimientoStore.deleteSesion(selectedSesionForDetail.id);
                      toast.success("Sesión eliminada con éxito");
                      setSelectedSesionForDetail(null);
                      loadData();
                    }
                  }}
                  className="flex-1 h-11 font-medium"
                >
                  Sí, eliminar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
    </div>
  );
}

