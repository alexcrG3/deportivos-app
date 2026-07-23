import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Megaphone, Calendar, Users, Send, Plus, X, CheckSquare, Square, Pencil, Trash2, Eye } from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";
import { CoachOsBanner } from "@/components/coach-os-banner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/convocatorias")({ component: ConvocatoriasPage });

const estadoMeta: Record<string, { label: string; className: string }> = {
  confirmado: { label: "Confirmado", className: "bg-success/15 text-success border-success/20" },
  pendiente: { label: "Pendiente", className: "bg-warning/15 text-warning border-warning/20" },
  rechazado: { label: "Rechazado", className: "bg-destructive/15 text-destructive border-destructive/20" },
  lesionado: { label: "Lesionado", className: "bg-destructive/15 text-destructive border-destructive/20" },
  suspendido: { label: "Suspendido", className: "bg-muted text-muted-foreground border-transparent" },
};

function ConvocatoriasPage() {
  const { role, coachName, selectedCoachId, selectedCoachName } = useRole();
  const [list, setList] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isOpenCreate, setIsOpenCreate] = useState(false);

  // Obtener equipos filtrados dinámicamente según el rol o entrenador seleccionado
  const dynamicEquipos = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    const activeCoach = selectedCoachName || (role === "coach" ? coachName : null);
    if (!activeCoach || (role === "admin" && !selectedCoachName)) return all;
    return all.filter(t => t.entrenador === activeCoach);
  }, [role, coachName, selectedCoachName]);

  // Form state
  const [newForm, setNewForm] = useState({
    titulo: "",
    tipo: "partido",
    equipoId: "",
    fecha: new Date().toISOString().slice(0, 10),
    hora: "09:00",
  });

  // Inicializar equipoId por defecto cuando carguen los equipos
  useEffect(() => {
    if (dynamicEquipos.length > 0 && !newForm.equipoId) {
      setNewForm(f => ({ ...f, equipoId: dynamicEquipos[0].id }));
    }
  }, [dynamicEquipos]);

  const sedesList = useMemo(() => {
    return RendimientoStore.getSedes();
  }, []);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const loadConvocatorias = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    let query = supabase
      .from("convocatorias")
      .select("*")
      .eq("organizacion_id", orgId)
      .order("fecha", { ascending: false });

    // Filter by coach name when admin has selected a coach
    if (role === "admin" && selectedCoachName) {
      query = query.eq("entrenador", selectedCoachName);
    } else if (role === "coach" && coachName) {
      query = query.eq("entrenador", coachName);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Error cargando convocatorias: " + error.message);
      return;
    }
    const mapped = (data || []).map((c: any) => ({
      id: c.id,
      tipo: c.tipo,
      titulo: c.titulo,
      fecha: c.fecha,
      hora: c.hora,
      equipo: c.equipo,
      entrenador: c.entrenador,
      partidoId: c.partido_id,
      rival: c.rival,
      sede: c.sede,
      uniformeLocal: c.uniforme_local,
      horaConcentracion: c.hora_concentracion,
      notas: c.notas,
      jugadores: c.jugadores || [],
    }));
    setList(mapped);
    if (mapped.length > 0) setSelectedId(mapped[0].id);
  };

  useEffect(() => { loadConvocatorias(); }, [selectedCoachId, role]);

  // Helper para normalizar nombres de categorías
  const normalizeCategoryName = (s: string) => {
    return s.toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace("elite", "")
      .replace("sub", "")
      .replace("futbol", "")
      .replace("femenino", "")
      .trim();
  };

  // Filtrar jugadores elegibles según el equipo seleccionado
  const selectablePlayers = useMemo(() => {
    const selectedTeam = dynamicEquipos.find(e => e.id === newForm.equipoId);
    if (!selectedTeam) return [];
    
    const allPlayers = RendimientoStore.getJugadores();
    return allPlayers.filter(p => {
      const pCat = normalizeCategoryName(p.categoria || "");
      const tCat = normalizeCategoryName(selectedTeam.categoria || selectedTeam.nombre || "");
      return pCat === tCat || (tCat && pCat.includes(tCat)) || (pCat && tCat.includes(pCat));
    });
  }, [dynamicEquipos, newForm.equipoId]);

  // Dejar la selección vacía por defecto al abrir o cambiar de equipo
  useEffect(() => {
    if (isOpenCreate) {
      setSelectedPlayerIds([]);
    }
  }, [isOpenCreate, newForm.equipoId]);

  const sel = useMemo(() => {
    return list.find(c => c.id === selectedId) || list[0] || null;
  }, [list, selectedId]);

  const playerLoadsMap = useMemo(() => {
    const data = RendimientoStore.getPlayerLoadData();
    return new Map(data.map(d => [d.jugadorId, d.semaforo]));
  }, []);

  const handleResend = () => {
    if (!sel) return;
    toast.success(`¡Convocatoria "${sel.titulo}" reenviada! Notificaciones despachadas por WhatsApp.`);
  };

  const handleUpdatePlayerStatus = (convId: string, playerId: string, nuevoEstado: "confirmado" | "rechazado" | "pendiente") => {
    const currentConv = list.find(c => c.id === convId);
    if (!currentConv) return;
    
    const updatedJugadores = currentConv.jugadores.map((j: any) => {
      if (j.id === playerId) {
        return { ...j, estado: nuevoEstado };
      }
      return j;
    });

    // Update locally
    setList(prev => prev.map(c => {
      if (c.id === convId) {
        return { ...c, jugadores: updatedJugadores };
      }
      return c;
    }));

    // Update Supabase
    supabase.from("convocatorias").update({
      jugadores: updatedJugadores
    }).eq("id", convId).then(({ error }) => {
      if (error) toast.error("Error al registrar confirmación: " + error.message);
      else {
        const player = currentConv.jugadores.find((p: any) => p.id === playerId);
        toast.success(`Asistencia de ${player?.nombre || "jugador"} actualizada.`);
      }
    });
  };

  const handleConfirmAttendance = (convId: string, nuevoEstado: "confirmado" | "rechazado") => {
    const currentConv = list.find(c => c.id === convId);
    if (!currentConv) return;
    
    const firstPending = currentConv.jugadores.find((j: any) => j.estado === "pendiente");
    if (!firstPending) {
      toast.info("Todos los jugadores convocados ya han respondido a esta convocatoria.");
      return;
    }

    handleUpdatePlayerStatus(convId, firstPending.id, nuevoEstado);
  };

  const handleConfirmAllPlayers = (convId: string) => {
    const currentConv = list.find(c => c.id === convId);
    if (!currentConv) return;

    const updatedJugadores = currentConv.jugadores.map((j: any) => ({
      ...j,
      estado: "confirmado" as const
    }));

    setList(prev => prev.map(c => {
      if (c.id === convId) {
        return { ...c, jugadores: updatedJugadores };
      }
      return c;
    }));

    supabase.from("convocatorias").update({
      jugadores: updatedJugadores
    }).eq("id", convId).then(({ error }) => {
      if (error) toast.error("Error al confirmar todos: " + error.message);
      else toast.success("Todos los convocados han sido marcados como CONFIRMADOS.");
    });
  };

  const togglePlayerSelect = (pId: string) => {
    setSelectedPlayerIds(prev => 
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const DEFAULT_WHATSAPP_TEMPLATE = `⚽ ¡Citación de Partido - Academia Asoderive!

Hola, {Nombre_Padre}.
Te informamos que tu hijo(a) {Nombre_Alumno} ha sido convocado(a) por el profesor {Nombre_Entrenador} para el partido de este fin de semana en la categoría {Nombre_Categoría}.

📋 DETALLES DEL ENCUENTRO:
🏆 Torneo / Liga: {Nombre_Torneo}
🆚 Rival: {Nombre_Rival}
📅 Fecha: {Fecha_Partido}
📍 Lugar: {Nombre_Cancha}
📍 Ubicación GPS: {Link_Google_Maps_Waze}
⏰ Hora de Citación: {Hora_Citación_Profe} (El partido arranca a las {Hora_Partido})
👕 Uniforme Obligatorio: {Uniforme_Color_Titular} (Por favor, llevar también la camiseta alterna {Uniforme_Color_Alterno} en la mochila).

⚠️ CONFIRMACIÓN REQUERIDA:
Por favor, ingresa a la aplicación para confirmar la asistencia de tu hijo(a) antes de este viernes a las 6:00 PM para que el cuerpo técnico pueda cerrar la estrategia del equipo.

Si tienes algún inconveniente de fuerza mayor, por favor repórtalo directamente por el chat oficial de la app.

¡Te esperamos para apoyar al equipo! 💪🥅`;

  const DEFAULT_EMAIL_TEMPLATE = `Línea de Asunto: 📝 Convocatoria de Partido Oficial - {Nombre_Alumno} - Categoría {Nombre_Categoría}

Estimada familia {Apellido_Familia},

Esperamos que se encuentren muy bien. Por medio de la presente, el Área Deportiva de la Academia Asoderive formaliza la convocatoria de su hijo(a) {Nombre_Alumno} para la próxima jornada competitiva.

A continuación, detallamos la hoja de ruta oficial para el encuentro:

📊 Ficha del Partido
• Categoría: {Nombre_Categoría} (Fútbol U13)
• Director Técnico a Cargo: Prof. {Nombre_Entrenador}
• Rival: {Nombre_Rival}
• Fase / Jornada: Jornada 5 - {Nombre_Torneo}

🗺️ Logística y Horarios
• Fecha del partido: {Fecha_Partido}
• Hora del pitazo inicial: {Hora_Partido}
• Hora de arribo obligatoria (Citación): {Hora_Citación_Profe}
  (Es indispensable cumplir con la hora de citación para realizar los ejercicios de calentamiento previos y la charla táctica en el vestidor).
• Sede / Cancha: {Nombre_Cancha}
• Ubicación Waze/Maps: {Link_Google_Maps_Waze}

🧳 Equipamiento Requerido
El alumno debe presentarse portando el kit de vestimenta oficial de competencia:
• Camiseta titular de juego: {Uniforme_Color_Titular}
• Camiseta alterna de juego en la mochila (Obligatorio): {Uniforme_Color_Alterno}
• Espinilleras/Canilleras reglamentarias (Uso obligatorio).
• Termo de hidratación de un litro debidamente rotulado.

🔔 Políticas de Confirmación Administrativa
Le recordamos que según nuestro Manual de Convivencia para Padres, es una obligación confirmar o declinar la participación del menor a través de nuestro portal digital.
• Fecha límite de confirmación: Viernes 6:00 PM

Atentamente,
Coordinación Deportiva - Academia Asoderive
Soporte: soporte@asoderive.com`;

  const [createStep, setCreateStep] = useState<"formulario" | "configurar_mensaje">("formulario");
  const [templateChannel, setTemplateChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [mensajeTemplate, setMensajeTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [emailTemplate, setEmailTemplate] = useState(DEFAULT_EMAIL_TEMPLATE);
  const [isOpenPreviewModal, setIsOpenPreviewModal] = useState(false);
  const [isOpenMotivoModal, setIsOpenMotivoModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("Salud / Malestar Físico");
  const [motivoNotas, setMotivoNotas] = useState("");
  const [pendingPlayerToReject, setPendingPlayerToReject] = useState<{ convId: string; playerId: string } | null>(null);

  const samplePlayer = useMemo(() => {
    const firstSelected = RendimientoStore.getJugadores().find(j => selectedPlayerIds.includes(j.id));
    return firstSelected || RendimientoStore.getJugadores()[0] || {
      nombre: "Aaron Pacheco Fonseca",
      encargadoLegal: "Patricia Fonseca",
      madreNombre: "Patricia Fonseca",
      padreNombre: "Marco Pacheco",
      categoria: "Sub-13",
      sede: "Cancha Sintética Asoderive #1",
      disciplina: "Fútbol",
    };
  }, [selectedPlayerIds]);

  const previewMessageEvaluated = useMemo(() => {
    const apoderado = samplePlayer.encargadoLegal || samplePlayer.madreNombre || samplePlayer.padreNombre || "Patricia Fonseca";
    const alumno = samplePlayer.nombre || "Aaron Pacheco Fonseca";
    const apellido = alumno.split(" ").slice(1).join(" ") || "Pacheco";
    const team = dynamicEquipos.find(e => e.id === newForm.equipoId) || dynamicEquipos[0];
    const categoria = team?.categoria || samplePlayer.categoria || "Sub-13";
    const entrenador = team?.entrenador || coachName || "Edgar Calderón";
    const torneo = "Torneo Apertura 2026";
    const rival = "Liga Deportiva Alajuelense";
    const fecha = newForm.fecha || "25/07/2026";
    const hora = newForm.hora || "09:00 AM";
    const horaCitacion = "08:15 AM";
    const cancha = "Estadio Asoderive Central";
    const mapsLink = "https://waze.com/ul?q=Asoderive";
    const titular = "Local Azul & Oro";
    const alterno = "Visitante Blanco Pro";

    const targetTemplate = templateChannel === "whatsapp" ? mensajeTemplate : emailTemplate;

    return targetTemplate
      .replace(/\{Nombre_Padre\}/g, apoderado)
      .replace(/\{Nombre_Padre\/Madre\}/g, apoderado)
      .replace(/\{Nombre_Alumno\}/g, alumno)
      .replace(/\{Apellido_Familia\}/g, apellido)
      .replace(/\{Nombre_Entrenador\}/g, entrenador)
      .replace(/\{Nombre_Categoría\}/g, categoria)
      .replace(/\{Nombre_Torneo\}/g, torneo)
      .replace(/\{Nombre_Rival\}/g, rival)
      .replace(/\{Fecha_Partido\}/g, fecha)
      .replace(/\{Nombre_Cancha\}/g, cancha)
      .replace(/\{Link_Google_Maps_Waze\}/g, mapsLink)
      .replace(/\{Hora_Citación_Profe\}/g, horaCitacion)
      .replace(/\{Hora_Partido\}/g, hora)
      .replace(/\{Uniforme_Color_Titular\}/g, titular)
      .replace(/\{Uniforme_Color_Alterno\}/g, alterno);
  }, [mensajeTemplate, emailTemplate, templateChannel, samplePlayer, dynamicEquipos, newForm]);

  const [editingConv, setEditingConv] = useState<any | null>(null);
  const [convToDelete, setConvToDelete] = useState<any | null>(null);

  const handleOpenCreateModal = () => {
    setEditingConv(null);
    setCreateStep("formulario");
    setMensajeTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    setEmailTemplate(DEFAULT_EMAIL_TEMPLATE);
    setIsOpenCreate(true);
  };

  const handleOpenEditModal = (conv: any) => {
    setEditingConv(conv);
    setNewForm({
      titulo: conv.titulo || "",
      tipo: conv.tipo || "partido",
      equipoId: dynamicEquipos.find(e => e.nombre === conv.equipo)?.id || dynamicEquipos[0]?.id || "",
      fecha: conv.fecha || new Date().toISOString().slice(0, 10),
      hora: conv.hora || "09:00",
    });
    setSelectedPlayerIds(conv.jugadores?.map((j: any) => j.id) || []);
    setCreateStep("formulario");
    setIsOpenCreate(true);
  };

  const confirmDeleteConvocatoria = () => {
    if (!convToDelete) return;
    const id = convToDelete.id;
    const titulo = convToDelete.titulo;

    const filtered = list.filter(c => c.id !== id);
    setList(filtered);
    if (filtered.length > 0) {
      setSelectedId(filtered[0].id);
    } else {
      setSelectedId("");
    }

    supabase.from("convocatorias").delete().eq("id", id).then(({ error }) => {
      if (error) toast.error("Error al eliminar convocatoria: " + error.message);
      else toast.success(`Convocatoria "${titulo}" eliminada correctamente.`);
    });

    setConvToDelete(null);
  };

  const handleGoToConfigurarMensaje = () => {
    if (!newForm.titulo.trim()) {
      toast.error("El título de la convocatoria es obligatorio.");
      return;
    }
    if (selectedPlayerIds.length === 0) {
      toast.error("Debes convocar al menos a un deportista.");
      return;
    }
    setCreateStep("configurar_mensaje");
  };

  const handleCreateConvocatoria = () => {
    const team = dynamicEquipos.find(e => e.id === newForm.equipoId) || dynamicEquipos[0];
    const calledPlayers = RendimientoStore.getJugadores()
      .filter(j => selectedPlayerIds.includes(j.id))
      .map((j, idx) => {
        const existingStatus = editingConv?.jugadores?.find((ej: any) => ej.id === j.id)?.estado || "pendiente";
        return {
          id: j.id,
          nombre: j.nombre,
          avatar: j.avatar,
          posicion: ["POR", "DEF", "MED", "DEL"][idx % 4],
          estado: existingStatus as const,
          encargadoLegal: j.encargadoLegal || j.madreNombre || j.padreNombre || "Patricia Fonseca",
          telefonoEncargado: (j as any).whatsappEncargado || (j as any).madreWhatsapp || (j as any).padreWhatsapp || j.telefonoEncargado || j.madreTelefono || j.padreTelefono || j.telefonoEmergencia || "+506 8888-9900",
          emailEncargado: j.emailEncargado || j.madreEmail || j.padreEmail || j.email || "encargado@athletix.cr",
        };
      });

    if (editingConv) {
      const updatedConv = {
        ...editingConv,
        tipo: newForm.tipo,
        titulo: newForm.titulo,
        fecha: newForm.fecha,
        hora: newForm.hora,
        equipo: team.nombre,
        entrenador: team.entrenador,
        jugadores: calledPlayers,
        mensajeTemplate: mensajeTemplate,
      };

      setList(prev => prev.map(c => c.id === editingConv.id ? updatedConv : c));
      setSelectedId(editingConv.id);
      setIsOpenCreate(false);
      setEditingConv(null);
      setCreateStep("formulario");

      const orgId = RendimientoStore.getActiveOrganizacionId();
      supabase.from("convocatorias").upsert({
        id: updatedConv.id,
        tipo: updatedConv.tipo,
        titulo: updatedConv.titulo,
        fecha: updatedConv.fecha,
        hora: updatedConv.hora,
        equipo: updatedConv.equipo,
        entrenador: updatedConv.entrenador,
        jugadores: updatedConv.jugadores,
        organizacion_id: orgId,
      }).then(({ error }) => {
        if (error) toast.error("Error actualizando convocatoria: " + error.message);
        else toast.success(`¡Convocatoria "${updatedConv.titulo}" actualizada con éxito!`);
      });
      return;
    }

    const newConv = {
      id: `conv_${Date.now()}`,
      tipo: newForm.tipo,
      titulo: newForm.titulo,
      fecha: newForm.fecha,
      hora: newForm.hora,
      equipo: team.nombre,
      entrenador: team.entrenador,
      jugadores: calledPlayers,
      mensajeTemplate: mensajeTemplate,
    };

    // Optimistic UI update first
    setList([newConv, ...list]);
    setSelectedId(newConv.id);
    setIsOpenCreate(false);
    setCreateStep("formulario");
    setNewForm({
      titulo: "",
      tipo: "partido",
      equipoId: dynamicEquipos[0]?.id || "",
      fecha: new Date().toISOString().slice(0, 10),
      hora: "09:00",
    });

    // Persist to Supabase in background
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase.from("convocatorias").upsert({
      id: newConv.id,
      tipo: newConv.tipo,
      titulo: newConv.titulo,
      fecha: newConv.fecha,
      hora: newConv.hora,
      equipo: newConv.equipo,
      entrenador: newConv.entrenador,
      jugadores: newConv.jugadores,
      organizacion_id: orgId,
    }).then(({ error }) => {
      if (error) toast.error("Error guardando convocatoria: " + error.message);
      else toast.success("¡Convocatoria publicada y mensajes personalizados despachados por WhatsApp!");
    });
  };

  return (
    <div className="space-y-6">
      <CoachOsBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Convocatorias</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" && selectedCoachName
              ? `Convocatorias de ${selectedCoachName}`
              : "Gestión de convocados y disponibilidad en tiempo real."}
          </p>
        </div>
        <Button onClick={handleOpenCreateModal}>
          <Megaphone className="mr-1 h-4 w-4" />Nueva convocatoria
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No hay convocatorias registradas.</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-12 items-start">
          {/* Left panel: List */}
          <div className="md:col-span-4 lg:col-span-3 space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {list.map((c) => (
              <button 
                key={c.id} 
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                  selectedId === c.id 
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30" 
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <p className="text-sm font-bold truncate text-foreground">{c.titulo}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.equipo} · {c.fecha} {c.hora}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="bg-success/10 text-success border border-success/20 text-[10px]">
                    {c.jugadores.filter((j: any) => j.estado === "confirmado").length} confirmados
                  </Badge>
                  <Badge variant="secondary" className="bg-warning/10 text-warning border border-warning/20 text-[10px]">
                    {c.jugadores.filter((j: any) => j.estado === "pendiente").length} pendientes
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          {/* Right panel: Details */}
          {sel && (
            <Card className="md:col-span-8 lg:col-span-9 shadow-card bg-card border-border">
              <CardHeader className="p-4 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">{sel.titulo}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-3 pt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{sel.fecha} · {sel.hora}</span>
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{sel.equipo}</span>
                      <span className="font-semibold text-primary">DT: {sel.entrenador}</span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => setIsOpenPreviewModal(true)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs gap-1.5 shadow-sm">
                      <Eye className="h-3.5 w-3.5" /> Simular Mensaje (WhatsApp / Email)
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleOpenEditModal(sel)} className="border-border text-xs font-semibold gap-1">
                      <Pencil className="h-3.5 w-3.5 text-indigo-500" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConvToDelete(sel)} className="border-border text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1">
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleResend} className="border-border text-xs font-semibold gap-1">
                      <Send className="h-3.5 w-3.5" /> Reenviar
                    </Button>
                  </div>
                </div>
                {/* Detalles de Logística del Encuentro (MVP) */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-foreground">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">📍 Sede / Campo</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{sel.sede || "Sede por definir"}</p>
                    {sel.sede && (
                      <div className="flex gap-2 mt-1 font-bold">
                        {(() => {
                          const matchedSede = sedesList.find((s: any) => s.nombre === sel.sede || s.id === sel.sede);
                          const mapsLink = matchedSede?.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sel.sede)}`;
                          const wazeLink = matchedSede?.wazeUrl || `https://waze.com/ul?q=${encodeURIComponent(sel.sede)}`;
                          return (
                            <>
                              <a 
                                href={mapsLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline"
                              >
                                Google Maps 🗺️
                              </a>
                              <span className="text-slate-300">|</span>
                              <a 
                                href={wazeLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline"
                              >
                                Waze 🚗
                              </a>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">⏰ Citación / Convocatoria</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{sel.horaConcentracion || sel.hora || "—"}</p>
                    <p className="text-[9px] text-slate-400">Llegada recomendada</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400">👕 Uniforme Sugerido</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{sel.uniformeLocal || "Uniforme Principal"}</p>
                  </div>
                </div>

                {/* Zona de Confirmación de Asistencia (Parent Portal Simulation) */}
                <div className="mt-3.5 p-3.5 bg-gradient-to-r from-primary/5 to-violet-500/5 rounded-xl border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 justify-center sm:justify-start">
                      📲 Simulador de Portal de Padres (WhatsApp / SMS)
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Simula la respuesta que el padre enviará al hacer clic desde su celular
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-center sm:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsOpenPreviewModal(true)}
                      className="h-8 text-[11px] font-bold text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 gap-1 shadow-xs"
                    >
                      📱 Ver Pantalla Celular (WhatsApp / Correo)
                    </Button>
                    <select 
                      id="sim-player-select"
                      className="h-8 rounded-lg border border-primary/20 bg-background px-2 text-xs text-foreground outline-none w-full sm:w-36"
                    >
                      <option value="">-- Elegir Jugador --</option>
                      {sel.jugadores.map((j: any) => (
                        <option key={j.id} value={j.id}>{j.nombre}</option>
                      ))}
                    </select>
                    <div className="flex gap-1.5">
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-750 text-white font-bold text-[10px] h-8 px-2.5"
                        onClick={() => {
                          const pId = (document.getElementById("sim-player-select") as HTMLSelectElement).value;
                          if (!pId) {
                            toast.error("Selecciona un jugador para simular");
                            return;
                          }
                          handleUpdatePlayerStatus(sel.id, pId, "confirmado");
                        }}
                      >
                        Confirmar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-red-200 text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-[10px] h-8 px-2.5"
                        onClick={() => {
                          const pId = (document.getElementById("sim-player-select") as HTMLSelectElement).value;
                          if (!pId) {
                            toast.error("Selecciona un jugador para simular");
                            return;
                          }
                          handleUpdatePlayerStatus(sel.id, pId, "rechazado");
                        }}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">
                    Lista de Convocados ({sel.jugadores.length}) · <span className="text-primary normal-case font-bold">Haz clic en ✓ o ✕ para marcar manualmente</span>
                  </p>
                  <Button 
                    variant="outline" 
                    className="h-7 text-[10px] border-emerald-500/30 text-emerald-650 hover:bg-emerald-50 font-bold px-2 py-0"
                    onClick={() => handleConfirmAllPlayers(sel.id)}
                  >
                    ✓ Confirmar Todos
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {sel.jugadores.map((j: any) => {
                    const meta = estadoMeta[j.estado] || estadoMeta.pendiente;
                    return (
                      <div key={j.id} className="flex items-center gap-3 rounded-xl border border-border p-2.5 justify-between bg-card hover:border-muted-foreground/30 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={j.avatar} />
                            <AvatarFallback>{j.nombre[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate flex items-center gap-1.5 text-foreground leading-tight">
                              {j.nombre}
                              {(() => {
                                const sem = playerLoadsMap.get(j.id);
                                if (sem === "rojo") return <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse animate-duration-1000" title="Riesgo Alto" />;
                                if (sem === "amarillo") return <span className="inline-block h-2 w-2 rounded-full bg-amber-500" title="Sobrecarga" />;
                                if (sem === "verde") return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Óptimo" />;
                                return null;
                              })()}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium flex items-center gap-1">
                              <span>{j.posicion}</span>
                              <span>·</span>
                              <span className="text-slate-700 dark:text-slate-300 font-semibold truncate" title={`Encargado: ${j.encargadoLegal || "Patricia Fonseca"}`}>
                                👤 {j.encargadoLegal || "Patricia Fonseca"}
                              </span>
                            </p>
                            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5 truncate">
                              <span>📱 {j.telefonoEncargado || "+506 8888-9900"}</span>
                              <span>✉️ {j.emailEncargado || "encargado@athletix.cr"}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Quick Manual Actions */}
                          <button 
                            onClick={() => handleUpdatePlayerStatus(sel.id, j.id, "confirmado")}
                            title="Confirmar Asistencia"
                            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 rounded text-emerald-600 border border-emerald-500/20 bg-emerald-500/5 transition-colors"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => handleUpdatePlayerStatus(sel.id, j.id, "rechazado")}
                            title="Rechazar Asistencia"
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-950/30 rounded text-red-650 border border-red-500/20 bg-red-500/5 transition-colors"
                          >
                            ✕
                          </button>
                          <Badge variant="secondary" className={`${meta.className} text-[9px] px-2 py-0.5 rounded-full border cursor-pointer`} onClick={() => {
                            // Cycle state manually on click
                            const nextState = j.estado === "pendiente" ? "confirmado" : j.estado === "confirmado" ? "rechazado" : "pendiente";
                            handleUpdatePlayerStatus(sel.id, j.id, nextState);
                          }}>
                            {meta.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* New Convocatoria Modal Flow (Step 1: Formulario -> Step 2: Configurar Mensaje) */}
      {isOpenCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {createStep === "formulario" ? (
            <Card className="bg-card border-border w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border shrink-0">
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" /> Nueva Convocatoria
                </CardTitle>
                <button 
                  onClick={() => setIsOpenCreate(false)} 
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕ Cerrar
                </button>
              </CardHeader>
              <div className="p-4 pt-2 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Título de Convocatoria *</label>
                  <input 
                    type="text" 
                    value={newForm.titulo}
                    onChange={e => setNewForm(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="E.g. Convocatoria Jornada 5 vs Saprissa FC"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo *</label>
                    <select 
                      value={newForm.tipo}
                      onChange={e => setNewForm(f => ({ ...f, tipo: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                    >
                      <option value="partido" className="text-foreground bg-background">Partido Oficial</option>
                      <option value="entrenamiento" className="text-foreground bg-background">Entrenamiento Especial</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Equipo *</label>
                    <select 
                      value={newForm.equipoId}
                      onChange={e => setNewForm(f => ({ ...f, equipoId: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-input bg-background px-2 text-xs text-foreground outline-none"
                    >
                      {dynamicEquipos.map(eq => (
                        <option key={eq.id} value={eq.id} className="text-foreground bg-background">{eq.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Fecha *</label>
                    <input 
                      type="date" 
                      value={newForm.fecha}
                      onChange={e => setNewForm(f => ({ ...f, fecha: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Hora *</label>
                    <input 
                      type="time" 
                      value={newForm.hora}
                      onChange={e => setNewForm(f => ({ ...f, hora: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Athletes Checklist */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                    <span>Seleccionar Convocados *</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-primary normal-case">({selectedPlayerIds.length} seleccionados)</span>
                      {selectablePlayers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedPlayerIds.length === selectablePlayers.length) {
                              setSelectedPlayerIds([]);
                            } else {
                              setSelectedPlayerIds(selectablePlayers.map(p => p.id));
                            }
                          }}
                          className="text-[9px] text-primary hover:underline font-bold normal-case cursor-pointer bg-transparent border-0 p-0"
                        >
                          {selectedPlayerIds.length === selectablePlayers.length ? "| Desmarcar todos" : "| Marcar todos"}
                        </button>
                      )}
                    </div>
                  </label>
                  <div className="border border-input rounded-xl p-2.5 max-h-[160px] overflow-y-auto space-y-1.5 bg-muted/20">
                    {selectablePlayers.map(p => {
                      const isChecked = selectedPlayerIds.includes(p.id);
                      return (
                        <button 
                          key={p.id}
                          type="button"
                          onClick={() => togglePlayerSelect(p.id)}
                          className="flex items-center justify-between w-full p-1.5 rounded-lg hover:bg-muted text-left transition text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-6 w-6"><AvatarImage src={p.avatar} /><AvatarFallback>{p.nombre[0]}</AvatarFallback></Avatar>
                            <span className="font-medium truncate text-foreground">{p.nombre}</span>
                          </div>
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-border shrink-0 bg-muted/10 flex gap-2">
                <Button 
                  className="flex-1 bg-primary text-white text-xs font-bold"
                  onClick={handleGoToConfigurarMensaje}
                >
                  Publicar Convocatoria
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground text-xs" 
                  onClick={() => setIsOpenCreate(false)}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          ) : (
            /* STEP 2: Configurar Mensaje Modal (exact layout from screenshot 2) */
            <Card className="bg-card border-border w-full max-w-lg shadow-2xl overflow-hidden flex flex-col rounded-2xl">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border/60 shrink-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-purple-600" /> Configurar Mensaje
                  </CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] font-bold gap-1 text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                    onClick={() => setIsOpenPreviewModal(true)}
                  >
                    👁️ Vista Previa Padre
                  </Button>
                  <button 
                    onClick={() => setIsOpenCreate(false)} 
                    className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </CardHeader>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Selector de Canal para Editar Plantilla */}
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTemplateChannel("whatsapp")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                        templateChannel === "whatsapp"
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      🟢 Plantilla WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateChannel("email")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                        templateChannel === "email"
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      ✉️ Plantilla Correo (Email HTML)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpenPreviewModal(true)}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    👁️ Probar Simultáneamente en Pantalla
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                    <span>
                      {templateChannel === "whatsapp" ? "Contenido para WhatsApp (Formato Directo & Emojis):" : "Contenido para Correo Oficial (Formato Institucional HTML):"}
                    </span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                      Canal: {templateChannel.toUpperCase()}
                    </span>
                  </label>

                  <textarea
                    rows={9}
                    value={templateChannel === "whatsapp" ? mensajeTemplate : emailTemplate}
                    onChange={(e) => {
                      if (templateChannel === "whatsapp") setMensajeTemplate(e.target.value);
                      else setEmailTemplate(e.target.value);
                    }}
                    className="w-full rounded-xl border border-input bg-background p-3 text-xs font-mono text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-none"
                  />
                </div>

                {/* Variable Chips Box */}
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">Variables dinámicas:</span>
                    {[
                      "{Nombre_Padre}",
                      "{Nombre_Alumno}",
                      "{Apellido_Familia}",
                      "{Nombre_Entrenador}",
                      "{Nombre_Categoría}",
                      "{Nombre_Torneo}",
                      "{Nombre_Rival}",
                      "{Fecha_Partido}",
                      "{Nombre_Cancha}",
                      "{Link_Google_Maps_Waze}",
                      "{Hora_Citación_Profe}",
                      "{Hora_Partido}",
                      "{Uniforme_Color_Titular}",
                      "{Uniforme_Color_Alterno}",
                    ].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          if (templateChannel === "whatsapp") setMensajeTemplate((prev) => prev + " " + v);
                          else setEmailTemplate((prev) => prev + " " + v);
                        }}
                        className="rounded-lg border border-purple-200 bg-white dark:bg-slate-800 dark:border-purple-900 px-2 py-0.5 text-[10px] font-mono font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 transition shadow-xs cursor-pointer"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-border shrink-0 bg-muted/10 flex justify-end gap-3">
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md"
                  onClick={() => setCreateStep("formulario")}
                >
                  Regresar al Formulario
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md gap-1.5"
                  onClick={handleCreateConvocatoria}
                >
                  🚀 PUBLICAR Y NOTIFICAR PADRES
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* MODAL SIMULADOR VISTA PREVIA DUAL PADRE (WhatsApp vs Correo Electrónico) */}
      {isOpenPreviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <Card className={cn(
            "bg-slate-950 border-slate-800 w-full shadow-2xl overflow-hidden rounded-[2.5rem] text-white flex flex-col border-[6px] transition-all duration-300",
            templateChannel === "email" ? "max-w-xl sm:max-w-2xl" : "max-w-sm"
          )}>
            {/* Modal Header & Channel Selector */}
            <div className="bg-slate-900 p-3.5 pt-4 flex flex-col items-center justify-center shrink-0 border-b border-slate-800 space-y-2">
              <div className="w-16 h-2 bg-slate-700 rounded-full" />
              
              <div className="w-full flex items-center justify-between px-2">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTemplateChannel("whatsapp")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1",
                      templateChannel === "whatsapp" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    )}
                  >
                    💬 WhatsApp Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateChannel("email")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1",
                      templateChannel === "email" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    )}
                  >
                    ✉️ Correo Oficial (Email HTML)
                  </button>
                </div>

                <button
                  onClick={() => setIsOpenPreviewModal(false)}
                  className="font-bold text-xs text-slate-400 hover:text-rose-400 cursor-pointer bg-slate-800 px-2.5 py-1 rounded-lg"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            {/* Recipient Meta Banner */}
            <div className="bg-slate-900/90 p-3 border-b border-slate-800 flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-indigo-500/40">
                <AvatarImage src={samplePlayer.avatar} />
                <AvatarFallback className="bg-indigo-900 text-white font-bold">
                  {(samplePlayer.encargadoLegal || samplePlayer.nombre)[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  Para: {samplePlayer.encargadoLegal || samplePlayer.madreNombre || samplePlayer.padreNombre || "Patricia Fonseca"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Padre/Encargado legal de: <span className="font-semibold text-amber-400">{samplePlayer.nombre}</span>
                </p>
              </div>
            </div>

            {/* VISTA 1: WHATSAPP CHAT SIMULATION */}
            {templateChannel === "whatsapp" ? (
              <div className="p-4 space-y-3 bg-[#0b141a] flex-1 overflow-y-auto min-h-[340px]">
                <div className="text-center my-1">
                  <span className="bg-slate-800/80 text-[9px] text-slate-400 px-2 py-0.5 rounded-full font-mono">
                    HOY 09:15 AM
                  </span>
                </div>

                {/* Chat Bubble */}
                <div className="bg-[#202c33] text-slate-100 p-3.5 rounded-2xl rounded-tl-none shadow-md space-y-2 border border-slate-700/50">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs border-b border-slate-700/60 pb-1.5">
                    <Megaphone className="h-3.5 w-3.5" /> Academia Asoderive Oficial
                  </div>

                  <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
                    {previewMessageEvaluated}
                  </p>

                  <div className="text-[9px] text-slate-400 text-right font-mono flex items-center justify-end gap-1 pt-1">
                    09:15 AM <span className="text-emerald-400 font-bold">✓✓</span>
                  </div>
                </div>

                {/* Interactive Parent Response Buttons */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center">
                    Botones interactivos en la pantalla del celular:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (sel) {
                          const firstPending = sel.jugadores.find((j: any) => j.estado === "pendiente") || sel.jugadores[0];
                          if (firstPending) {
                            handleUpdatePlayerStatus(sel.id, firstPending.id, "confirmado");
                            toast.success(`🎉 ${firstPending.nombre} marcado como CONFIRMADO por su encargado.`);
                          }
                        } else {
                          toast.success("¡Asistencia confirmada exitosamente!");
                        }
                        setIsOpenPreviewModal(false);
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-2 rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      🟢 Confirmar Asistencia
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (sel) {
                          const firstPending = sel.jugadores.find((j: any) => j.estado === "pendiente") || sel.jugadores[0];
                          if (firstPending) {
                            setPendingPlayerToReject({ convId: sel.id, playerId: firstPending.id });
                          }
                        }
                        setIsOpenMotivoModal(true);
                        setIsOpenPreviewModal(false);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold py-2 px-2 rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1 cursor-pointer border border-slate-700"
                    >
                      🔴 Reportar Ausencia
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* VISTA 2: CLIENTE DE CORREO ELECTRÓNICO INSTITUCIONAL (EMAIL HTML MOCKUP) */
              <div className="p-4 bg-slate-900 flex-1 overflow-y-auto min-h-[360px] text-slate-200 text-xs leading-relaxed space-y-4">
                {/* Header Mail Meta */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 font-mono text-[11px]">
                  <p className="text-amber-400 font-bold">
                    📌 Asunto: 📝 Convocatoria de Partido Oficial - {samplePlayer.nombre} - Categoría {dynamicEquipos[0]?.categoria || "Sub-13"}
                  </p>
                  <p className="text-slate-400">De: <strong>Coordinación Deportiva Asoderive</strong> &lt;soporte@asoderive.com&gt;</p>
                  <p className="text-slate-400">Para: <strong>{samplePlayer.encargadoLegal || "Patricia Fonseca"}</strong> &lt;{samplePlayer.emailEncargado || "encargado@athletix.cr"}&gt;</p>
                </div>

                {/* Body Mail Template HTML Box */}
                <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100">
                  {/* Institutional Club Branding Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                        ATH
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white tracking-tight">ACADEMIA DEPORTIVA ASODERIVE</h4>
                        <p className="text-[10px] text-amber-400 font-mono">Boletín Oficial de Convocatoria Competitiva</p>
                      </div>
                    </div>
                    <Badge className="bg-indigo-600 text-white font-mono text-[9px] uppercase">Oficial HTML Email</Badge>
                  </div>

                  <p className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed">
                    {previewMessageEvaluated}
                  </p>

                  {/* HTML Email Call to Action Buttons */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (sel) {
                          const firstPending = sel.jugadores.find((j: any) => j.estado === "pendiente") || sel.jugadores[0];
                          if (firstPending) {
                            handleUpdatePlayerStatus(sel.id, firstPending.id, "confirmado");
                            toast.success(`🎉 ${firstPending.nombre} marcado como CONFIRMADO por email.`);
                          }
                        } else {
                          toast.success("¡Asistencia confirmada exitosamente!");
                        }
                        setIsOpenPreviewModal(false);
                      }}
                      className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-3 rounded-xl text-xs shadow-lg uppercase tracking-wider text-center cursor-pointer"
                    >
                      🟢 CONFIRMAR ASISTENCIA AL PARTIDO
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (sel) {
                          const firstPending = sel.jugadores.find((j: any) => j.estado === "pendiente") || sel.jugadores[0];
                          if (firstPending) {
                            setPendingPlayerToReject({ convId: sel.id, playerId: firstPending.id });
                          }
                        }
                        setIsOpenMotivoModal(true);
                        setIsOpenPreviewModal(false);
                      }}
                      className="w-full sm:flex-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 text-rose-300 font-black py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider text-center cursor-pointer"
                    >
                      🔴 DECLINAR ASISTENCIA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Phone Footer */}
            <div className="bg-slate-950 p-3 text-center border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono">Simulador Athletix OS 2026</span>
              <Button
                onClick={() => setIsOpenPreviewModal(false)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-1.5 px-4 rounded-xl"
              >
                Cerrar Vista Previa
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL TÁCTIL PADRE: REPORTAR MOTIVO DE AUSENCIA */}
      {isOpenMotivoModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-md shadow-2xl rounded-3xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-lg">
                  🔴
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground leading-tight">Reportar Ausencia de Alumno</h3>
                  <p className="text-[11px] text-muted-foreground">Notificación oficial al Cuerpo Técnico</p>
                </div>
              </div>
              <button onClick={() => setIsOpenMotivoModal(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground uppercase">Motivo Principal de la Ausencia *</label>
                <select
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl h-10 px-3 text-xs text-foreground font-semibold outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Salud / Malestar Físico">🏥 Salud / Malestar Físico o Gripe</option>
                  <option value="Compromiso Familiar / Viaje">✈️ Compromiso Familiar / Viaje Programado</option>
                  <option value="Estudio / Examen Académico">📚 Examen Académico / Deberes de Estudio</option>
                  <option value="Lesión Deportivo / En Recuperación">🤕 Lesión / En Recuperación Médica</option>
                  <option value="Inconveniente de Transporte">🚗 Inconveniente de Transporte / Traslado</option>
                  <option value="Otro Motivo">📌 Otro Motivo Justificado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground uppercase">Notas Adicionales para el Entrenador (Opcional)</label>
                <textarea
                  rows={3}
                  value={motivoNotas}
                  onChange={(e) => setMotivoNotas(e.target.value)}
                  placeholder="Ej. El doctor recomendó reposo por 48 horas. Estará listo para el entrenamiento del martes."
                  className="w-full bg-background border border-input rounded-xl p-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                💡 Esta justificación se enviará directamente al panel de control del DT <strong>{sel?.entrenador || "Edgar Calderón"}</strong> para ajustar la convocatoria oficial del equipo.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpenMotivoModal(false)}
                className="text-xs font-bold rounded-xl h-9"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (pendingPlayerToReject && sel) {
                    handleUpdatePlayerStatus(sel.id, pendingPlayerToReject.playerId, "rechazado");
                  }
                  toast.info(`Ausencia reportada por motivo: "${motivoRechazo}". Notificado al DT.`);
                  setIsOpenMotivoModal(false);
                  setMotivoNotas("");
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl h-9 px-4"
              >
                Enviar Justificación al DT
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE CONVOCATORIA */}
      {convToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[80] flex items-center justify-center p-4">
          <Card className="bg-card border-border w-full max-w-sm shadow-2xl rounded-3xl p-6 space-y-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-xl font-bold">
              🗑️
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">¿Eliminar Convocatoria?</h3>
              <p className="text-xs text-muted-foreground">
                Estás a punto de eliminar <strong>"{convToDelete.titulo}"</strong>. Se borrará permanentemente de la base de datos Supabase.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => setConvToDelete(null)} className="text-xs font-bold rounded-xl h-9">
                Cancelar
              </Button>
              <Button onClick={confirmDeleteConvocatoria} className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl h-9 px-4">
                Sí, Eliminar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ConvocatoriasPage;
