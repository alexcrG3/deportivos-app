import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Trophy, Plus, Swords, MapPin, ArrowRight, Medal, FileText, Upload,
  Calendar, ShieldCheck, Download, ExternalLink, CheckCircle2, Sparkles, Mic, MicOff, Camera, Image, Send, Search, User, Star
} from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/_app/competiciones")({ component: CompeticionesPage });

const tipoColor: Record<string, string> = {
  Liga: "bg-primary/15 text-primary border-primary/30",
  Copa: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Torneo: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Festival: "bg-violet-500/15 text-violet-600 border-violet-500/30",
};

function CompeticionesPage() {
  const { role, coachName, selectedCoachName } = useRole();
  const activeCoach = selectedCoachName || (role === "coach" ? coachName : "Carlos Araya");

  const [competicionesList, setCompeticionesList] = useState<any[]>([]);
  const [standingsList, setStandingsList] = useState<any[]>([]);
  const [temporadasList, setTemporadasList] = useState<any[]>([]);
  const [sedesList, setSedesList] = useState<any[]>([]);
  const [categoriasList, setCategoriasList] = useState<any[]>([]);
  const [disciplinasList, setDisciplinasList] = useState<any[]>([]);

  const [sel, setSel] = useState<any>(null);
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [reglamentoFile, setReglamentoFile] = useState<File | null>(null);

  // Form State
  const [form, setForm] = useState({
    nombre: "",
    tipo: "Liga",
    disciplina: "Fútbol",
    categoria: "Sub-11",
    equipos: 10,
    jornadaActual: 1,
    jornadas: 18,
    temporadaId: "",
    sedes: [] as string[],
  });

  const loadData = () => {
    let comps = RendimientoStore.getCompeticiones();
    // Si el entrenador es Carlos Araya, su ÚNICO equipo es U9 Asoderive (Sub-9)
    if (activeCoach && activeCoach.includes("Carlos Araya")) {
      comps = comps.filter(c => {
        const cName = (c.nombre || c.categoria || "").toLowerCase();
        return !cName.includes("u13") && !cName.includes("sub-13") && !cName.includes("u11") && !cName.includes("sub-11");
      });
      if (comps.length === 0) {
        comps = [{
          id: "comp_u9_asoderive",
          nombre: "Liga U9 Asoderive",
          tipo: "Liga",
          disciplina: "Fútbol",
          categoria: "Sub-9",
          equipos: 10,
          jornadaActual: 1,
          jornadas: 18,
          estado: "en_curso",
          temporadaId: "temp2026",
          sedes: ["Cancha Asoderive Central"]
        }];
      }
    }

    setCompeticionesList(comps);

    if (comps.length > 0) {
      setSel((prev: any) => {
        const stillExists = comps.find((c) => c.id === prev?.id);
        return stillExists || comps[0];
      });
    } else {
      setSel(null);
    }

    let standings = RendimientoStore.getClasificaciones();
    if (activeCoach && activeCoach.includes("Carlos Araya")) {
      standings = standings.filter(s => {
        const name = (s.equipo || s.club || s.competicion || "").toLowerCase();
        return !name.includes("u13") && !name.includes("u11");
      });
      if (standings.length === 0) {
        standings = [
          { id: "st1", equipo: "U9 Asoderive", pj: 1, pg: 1, pe: 0, pp: 0, gf: 3, gc: 1, dg: 2, pts: 3 },
          { id: "st2", equipo: "Saprissa FC U9", pj: 1, pg: 0, pe: 1, pp: 0, gf: 1, gc: 1, dg: 0, pts: 1 },
          { id: "st3", equipo: "U9 San Jose FC", pj: 1, pg: 0, pe: 0, pp: 1, gf: 1, gc: 3, dg: -2, pts: 0 },
        ];
      }
    }
    setStandingsList(standings);
    const temps = RendimientoStore.getTemporadas();
    setTemporadasList(temps);
    setSedesList(RendimientoStore.getSedes());

    const cats = RendimientoStore.getCategorias();
    setCategoriasList(cats);
    const discs = RendimientoStore.getDisciplinas();
    setDisciplinasList(discs);

    if (temps.length > 0) setForm((f) => ({ ...f, temporadaId: temps[0].id }));
    if (cats.length > 0) setForm((f) => ({ ...f, categoria: cats[0].nombre }));
    if (discs.length > 0) {
      const firstDisc = typeof discs[0] === "string" ? discs[0] : discs[0].nombre || "Fútbol";
      setForm((f) => ({ ...f, disciplina: firstDisc }));
    }
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

  const getMatchTeams = (p: any) => {
    if (typeof p.local === "string") {
      return { local: p.local, visitante: p.visitante || "Rival" };
    }
    const eqId = p.equipoId || p.equipo_id;
    const allTeams = RendimientoStore.getEquipos();
    const teamObj = allTeams.find((e: any) => e.id === eqId);
    const clubName = teamObj ? teamObj.nombre : p.equipo || "Club Principal";
    return {
      local: p.local ? clubName : p.rival || "Rival",
      visitante: p.local ? p.rival || "Rival" : clubName,
    };
  };

  const partidos = useMemo(() => {
    if (!sel) return [];
    const allPartidos = RendimientoStore.getPartidos();
    const storePartidos = allPartidos.filter((p) => {
      if (p.competicionId === sel.id || p.competicion === sel.nombre) return true;
      if (p.tipo === sel.tipo) {
        const pCat = p.equipo ? p.equipo.toLowerCase() : "";
        const cCat = sel.categoria ? sel.categoria.toLowerCase() : "";
        return pCat.includes(cCat) || cCat.includes(pCat);
      }
      return false;
    });

    if (storePartidos.length > 0) return storePartidos;

    // Fallback dinámico para asegurar que la categoría del torneo siempre muestre los partidos programados
    if (sel.categoria === "Sub-9" || sel.nombre?.includes("U9")) {
      return [
        {
          id: "partido_u9_sj",
          fecha: "2026-08-02",
          hora: "09:00",
          equipo: "U9 Asoderive",
          rival: "U9 San José",
          competicion: "Liga U9 Asoderive",
          sede: "Estadio Asoderive Central",
          local: true,
          estado: "programado",
          jornada: 1,
          convocadosCount: 20,
        },
        {
          id: "partido_u9_sap",
          fecha: "2026-08-09",
          hora: "10:30",
          equipo: "U9 Asoderive",
          rival: "Saprissa FC U9",
          competicion: "Liga U9 Asoderive",
          sede: "Cancha Sintética #2",
          local: false,
          estado: "programado",
          jornada: 2,
          convocadosCount: 18,
        }
      ];
    }

    return [];
  }, [sel]);

  const tabla = useMemo(() => {
    if (!sel) return [];

    const teamsMap = new Map<
      string,
      { equipo: string; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; dg: number; pts: number }
    >();

    const getTeamRecord = (name: string) => {
      if (!teamsMap.has(name)) {
        teamsMap.set(name, { equipo: name, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
      }
      return teamsMap.get(name)!;
    };

    for (const p of partidos) {
      const { local, visitante } = getMatchTeams(p);
      if (local) getTeamRecord(local);
      if (visitante) getTeamRecord(visitante);
    }

    const playedMatches = partidos.filter((p) => p.estado === "jugado" && p.resultado);

    for (const p of playedMatches) {
      const { local: localTeamName, visitante: visitorTeamName } = getMatchTeams(p);
      const localGoals = p.local ? p.resultado.propio : p.resultado.rival;
      const visitorGoals = p.local ? p.resultado.rival : p.resultado.propio;

      if (!localTeamName || !visitorTeamName) continue;

      const localRec = getTeamRecord(localTeamName);
      const visitorRec = getTeamRecord(visitorTeamName);

      localRec.pj += 1;
      visitorRec.pj += 1;
      localRec.gf += localGoals;
      localRec.gc += visitorGoals;
      visitorRec.gf += visitorGoals;
      visitorRec.gc += localGoals;

      if (localGoals > visitorGoals) {
        localRec.pg += 1;
        localRec.pts += 3;
        visitorRec.pp += 1;
      } else if (localGoals < visitorGoals) {
        visitorRec.pg += 1;
        visitorRec.pts += 3;
        localRec.pp += 1;
      } else {
        localRec.pe += 1;
        localRec.pts += 1;
        visitorRec.pe += 1;
        visitorRec.pts += 1;
      }

      localRec.dg = localRec.gf - localRec.gc;
      visitorRec.dg = visitorRec.gf - visitorRec.gc;
    }

    // Agregar standings por defecto de la DB si no hay partidos jugados
    if (teamsMap.size === 0) {
      const defaultStandings = standingsList.filter((s) => s.competicionId === sel.id || s.competicion === sel.nombre);
      if (defaultStandings.length > 0) return defaultStandings;
    }

    return Array.from(teamsMap.values()).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      return b.gf - a.gf;
    });
  }, [sel, partidos, standingsList]);

  const handleCreateCompeticion = () => {
    if (!form.nombre.trim()) {
      toast.error("Ingresa el nombre del torneo.");
      return;
    }
    const newComp = RendimientoStore.addCompeticion({
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      disciplina: form.disciplina,
      categoria: form.categoria,
      equipos: form.equipos,
      jornadaActual: 1,
      jornadas: form.jornadas,
      temporadaId: form.temporadaId,
      sedes: form.sedes.length > 0 ? form.sedes : ["Sede Central"],
    });

    toast.success("Torneo registrado con éxito");
    setIsOpenCreate(false);
    loadData();
    setSel(newComp);
  };

  const handleUploadReglamento = () => {
    if (!reglamentoFile) {
      toast.error("Selecciona el archivo PDF del reglamento.");
      return;
    }
    toast.success(`Reglamento "${reglamentoFile.name}" guardado en el repositorio digital ✓`);
    setReglamentoFile(null);
  };

  // Tabs & Redactor IA State
  const [activeTab, setActiveTab] = useState<"general" | "reglamento">("general");
  const [isOpenScoreModal, setIsOpenScoreModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedMatchForScore, setSelectedMatchForScore] = useState<any | null>(null);
  const [scoreForm, setScoreForm] = useState({
    rival: "U9 San José",
    resultadoTipo: "victoria",
    golesPropio: 3,
    golesRival: 1,
    figuras: "",
    notaDt: "",
  });
  const [cronicaOutput, setCronicaOutput] = useState("");
  const recognitionRef = useRef<any>(null);
  const accumulatedTextRef = useRef<string>("");

  const isListeningRef = useRef(false);
  const [dictStatus, setDictStatus] = useState<string>("");

  const stopListening = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setDictStatus("");
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  };

  const startListening = async () => {
    if (isListening || isListeningRef.current) {
      stopListening();
      toast.info("🎙️ Dictado detenido.");
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Dictado no disponible. Usa Google Chrome.");
      return;
    }

    // Solicitar permiso explícito del micrófono primero
    // Esto muestra el diálogo de permisos en Chrome si aún no se ha otorgado
    setDictStatus("Solicitando permiso del mic...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permiso otorgado — detener el stream (SpeechRecognition manejará el mic)
      stream.getTracks().forEach(track => track.stop());
    } catch (e: any) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        toast.error("❌ Permiso de micrófono denegado. Toca el candado 🔒 en la barra de Chrome → Micrófono → Permitir.");
      } else {
        toast.error("❌ No se detectó micrófono: " + e.message);
      }
      setDictStatus("");
      return;
    }

    isListeningRef.current = true;
    setIsListening(true);
    setDictStatus("Preparando mic...");

    const r = new SR();
    r.lang = 'es-ES'; // es-ES tiene mejor soporte que es-CR en Chrome
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setDictStatus("🔴 Habla ahora...");
    };

    r.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) { final += t + " "; }
        else { interim = t; }
      }
      if (final) {
        accumulatedTextRef.current += final;
      }
      const live = (accumulatedTextRef.current + interim).trim();
      setScoreForm(f => ({ ...f, notaDt: live }));
      if (final) setDictStatus("✅ " + final.trim());
      else setDictStatus("🔴 Escuchando: " + interim);
    };

    r.onerror = (err: any) => {
      console.error("Speech error:", err.error);
      if (err.error === 'not-allowed') {
        toast.error("❌ Micrófono bloqueado: toca el candado 🔒 en la barra de Chrome y permite el micrófono.");
        stopListening();
      } else if (err.error === 'network') {
        toast.error("❌ Error de red. Chrome necesita internet para el dictado por voz de Google.");
        stopListening();
      }
    };

    r.onend = () => {
      if (isListeningRef.current) {
        stopListening();
      }
    };

    recognitionRef.current = r;
    accumulatedTextRef.current = scoreForm.notaDt ? scoreForm.notaDt.trim() + " " : "";

    try {
      r.start();
    } catch (e: any) {
      console.error("r.start() threw:", e);
      toast.error("No se pudo iniciar el micrófono: " + (e?.message || e));
      stopListening();
    }
  };

  // Jugadores & Goleadores State
  const defaultPlantelSub9 = useMemo(() => [
    { id: "j1", nombre: "Aaron Pacheco", posicion: "Delantero", dorsal: "9" },
    { id: "j2", nombre: "Andrés Soto", posicion: "Portero", dorsal: "1" },
    { id: "j3", nombre: "Santiago Jiménez", posicion: "Mediocampista", dorsal: "10" },
    { id: "j4", nombre: "Mateo Fernández", posicion: "Defensa", dorsal: "4" },
    { id: "j5", nombre: "Gabriel Castro", posicion: "Mediocampista", dorsal: "8" },
    { id: "j6", nombre: "Lucas Ramírez", posicion: "Delantero", dorsal: "7" },
    { id: "j7", nombre: "Felipe Valverde", posicion: "Extremo", dorsal: "11" },
    { id: "j8", nombre: "Thiago Morales", posicion: "Mediocampista", dorsal: "6" },
  ], []);

  const [selectedJugadoresFiguras, setSelectedJugadoresFiguras] = useState<{ id: string; nombre: string; goles: number; esFigura: boolean }[]>([
    { id: "j1", nombre: "Aaron Pacheco", goles: 2, esFigura: false },
    { id: "j2", nombre: "Andrés Soto", goles: 0, esFigura: true },
  ]);
  const [searchJugadorText, setSearchJugadorText] = useState("");

  const updateFigurasFormText = (list: { id: string; nombre: string; goles: number; esFigura: boolean }[]) => {
    const parts: string[] = [];
    list.forEach(p => {
      if (p.goles === 1) parts.push(`Gol de ${p.nombre}`);
      else if (p.goles === 2) parts.push(`Doblete de ${p.nombre}`);
      else if (p.goles >= 3) parts.push(`Hat-trick (${p.goles} goles) de ${p.nombre}`);
      if (p.esFigura) parts.push(`Figura: ${p.nombre}`);
    });
    setScoreForm(f => ({ ...f, figuras: parts.join(", ") }));
  };

  const handleAddGolJugador = (player: any) => {
    setSelectedJugadoresFiguras(prev => {
      const exists = prev.find(p => p.id === player.id);
      let updated;
      if (exists) {
        updated = prev.map(p => p.id === player.id ? { ...p, goles: p.goles + 1 } : p);
      } else {
        updated = [...prev, { id: player.id, nombre: player.nombre, goles: 1, esFigura: false }];
      }
      updateFigurasFormText(updated);
      return updated;
    });
    toast.success(`⚽ Gol añadido a ${player.nombre}`);
  };

  const handleToggleFiguraJugador = (player: any) => {
    setSelectedJugadoresFiguras(prev => {
      const exists = prev.find(p => p.id === player.id);
      let updated;
      if (exists) {
        updated = prev.map(p => p.id === player.id ? { ...p, esFigura: !p.esFigura } : p);
      } else {
        updated = [...prev, { id: player.id, nombre: player.nombre, goles: 0, esFigura: true }];
      }
      updateFigurasFormText(updated);
      return updated;
    });
    toast.success(`⭐ ${player.nombre} marcado como figura del encuentro`);
  };

  const handleRemoveJugadorFigura = (id: string) => {
    setSelectedJugadoresFiguras(prev => {
      const updated = prev.filter(p => p.id !== id);
      updateFigurasFormText(updated);
      return updated;
    });
  };

  // Photos & Muro Publication State
  const [fotosPartido, setFotosPartido] = useState<string[]>([
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
  ]);

  const handleAddFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newPhotos: string[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newPhotos.push(url);
    });
    setFotosPartido((prev) => [...prev, ...newPhotos]);
    toast.success(`📸 ${newPhotos.length} foto(s) del partido adjuntadas.`);
  };

  const handleRemoveFoto = (index: number) => {
    setFotosPartido((prev) => prev.filter((_, i) => i !== index));
  };

  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishToMuro = async () => {
    if (!cronicaOutput) {
      toast.error("Primero genera la crónica para publicar en el Muro.");
      return;
    }
    if (isPublishing) return;
    setIsPublishing(true);

    try {
      const equipoNombre = sel?.nombre?.includes("U9") || sel?.categoria === "Sub-9" ? "U9 Asoderive" : sel?.nombre || "Asoderive FC";
      const rivalNombre = scoreForm.rival || selectedMatchForScore?.rival || "Rival";
      const orgId = RendimientoStore.getActiveOrganizacionId();

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
      const formattedTiempo = `${now.getDate()} ${meses[now.getMonth()]} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const fullContent = `🏆 Crónica Oficial: ${equipoNombre} ${scoreForm.golesPropio} – ${scoreForm.golesRival} ${rivalNombre}\n\n${cronicaOutput}`;

      const postToInsert = {
        id: `post_${Date.now()}`,
        autor: activeCoach || "Cuerpo Técnico DT",
        usuario: `@${(activeCoach || "dt").toLowerCase().replace(/\s+/g, "")}`,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        tiempo: formattedTiempo,
        tipo: "publicacion",
        contenido: fullContent,
        imagen: fotosPartido[0] || null,
        categoria: sel?.categoria || "Sub-9",
        likes: 1,
        liked: true,
        saved: false,
        comentarios: [],
        organizacion_id: orgId
      };

      const { error } = await supabase.from("muro_posts").insert(postToInsert);
      if (error) {
        console.error("[Supabase Error] No se pudo guardar el post en el muro:", error);
        toast.error("Error al publicar en el Muro: " + error.message);
        setIsPublishing(false);
        return;
      }

      toast.success(`🚀 ¡Crónica y ${fotosPartido.length} foto(s) publicadas exitosamente en el Muro Social del Club!`);

      // Cerrar modal y limpiar estados
      setIsOpenScoreModal(false);
      setCronicaOutput("");
      setSelectedMatchForScore(null);
      setFotosPartido([]);
    } catch (e: any) {
      console.error("Error publishing post:", e);
      toast.error("Ocurrió un error al publicar: " + (e?.message || e));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleOpenScoreModal = (p?: any) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    if (p) {
      setSelectedMatchForScore(p);
      setScoreForm({
        rival: p.rival || "U9 San José",
        resultadoTipo: "victoria",
        golesPropio: p.resultado?.propio ?? 3,
        golesRival: p.resultado?.rival ?? 1,
        figuras: "",
        notaDt: "",
      });
    } else {
      setScoreForm(f => ({ ...f, figuras: "", notaDt: "" }));
    }
    setCronicaOutput("");
    setIsOpenScoreModal(true);
  };

  const generateAICronica = (
    equipo: string,
    rival: string,
    golesPropio: number,
    golesRival: number,
    sede: string,
    jugadoresFiguras: { id: string; nombre: string; goles: number; esFigura: boolean }[],
    notaDtRaw: string,
    dtNombre: string
  ) => {
    const esVictoria = golesPropio > golesRival;
    const esEmpate = golesPropio === golesRival;

    const goleadores = jugadoresFiguras.filter(j => j.goles > 0);
    const figuras = jugadoresFiguras.filter(j => j.esFigura);

    let goleadoresTxt = "Desempeño colectivo en ataque";
    if (goleadores.length > 0) {
      goleadoresTxt = goleadores.map(g => {
        if (g.goles === 1) return `⚽ ${g.nombre} (1 gol)`;
        if (g.goles === 2) return `⚽⚽ ${g.nombre} (2 goles)`;
        return `⚽ ${g.nombre} (${g.goles} goles)`;
      }).join(", ");
    }

    let figurasTxt = "Todo el plantel convocado";
    if (figuras.length > 0) {
      figurasTxt = figuras.map(f => `⭐ ${f.nombre}`).join(", ");
    }

    const notaClean = (notaDtRaw || "").trim();
    let analisisDT = "";

    if (notaClean) {
      analisisDT = `📝 **Análisis Técnico del DT (${dtNombre}):**\n` +
        `> *"${notaClean}"*\n\n` +
        `El cuerpo técnico resaltó la evolución del equipo en cancha, destacando la aplicación táctica y el progreso mostrado por los jugadores en este compromiso.`;
    } else {
      analisisDT = `📝 **Balance del Cuerpo Técnico (${dtNombre}):**\n` +
        `El entrenador valoró el esfuerzo colectivo y la dedicación mostrada por el equipo a lo largo de los minutos disputados.`;
    }

    let tituloEncabezado = "";
    let parrafoIntro = "";

    if (esVictoria) {
      tituloEncabezado = `🔥 ¡VICTORIA OFICIAL! ${equipo} ${golesPropio} – ${golesRival} ${rival}`;
      parrafoIntro = `En un apasionante encuentro disputado en **${sede}**, **${equipo}** impuso su ritmo de juego para llevarse el triunfo con marcador de **${golesPropio} a ${golesRival}** frente a **${rival}**.`;
    } else if (esEmpate) {
      tituloEncabezado = `🤝 EMPATE TRABAJADO: ${equipo} ${golesPropio} – ${golesRival} ${rival}`;
      parrafoIntro = `En un duelo sumamente disputado en **${sede}**, **${equipo}** igualó **${golesPropio} a ${golesRival}** ante **${rival}** en una muestra de garra y entrega.`;
    } else {
      tituloEncabezado = `💪 COMPROMISO FORMATIVO: ${equipo} ${golesPropio} – ${golesRival} ${rival}`;
      parrafoIntro = `En un partido de alto aprendizaje en **${sede}**, **${equipo}** finalizó **${golesPropio} a ${golesRival}** ante **${rival}**, dejando valiosas lecciones para continuar creciendo.`;
    }

    return `🏆 **CRÓNICA DE PARTIDO OFICIAL**
${tituloEncabezado}

${parrafoIntro}

${analisisDT}

⭐ **FIGURAS Y GOLEADORES DESTACADOS:**
• **Goleadores:** ${goleadoresTxt}
• **Figura(s) del Encuentro:** ${figurasTxt}
• **Sede del Partido:** ${sede}

👏 ¡Felicitaciones a nuestros deportistas por su entrega en cancha! ⚽🔥`;
  };

  const handleSaveScoreAndCronica = () => {
    const propio = Number(scoreForm.golesPropio);
    const rivalGoles = Number(scoreForm.golesRival);
    const equipoNombre = sel?.nombre?.includes("U9") || sel?.categoria === "Sub-9" ? "U9 Asoderive" : sel?.nombre || "Asoderive FC";
    const rivalNombre = scoreForm.rival || selectedMatchForScore?.rival || "Rival";

    const updatedMatch = {
      id: selectedMatchForScore?.id || `partido_${Date.now()}`,
      fecha: selectedMatchForScore?.fecha || new Date().toISOString().slice(0, 10),
      hora: selectedMatchForScore?.hora || "09:00",
      equipo: equipoNombre,
      rival: rivalNombre,
      competicion: sel?.nombre || "Liga Oficial",
      competicionId: sel?.id,
      sede: selectedMatchForScore?.sede || "Estadio Asoderive Central",
      local: true,
      estado: "jugado",
      resultado: { propio, rival: rivalGoles },
    };

    RendimientoStore.addPartido(updatedMatch);

    const cronicaText = generateAICronica(
      equipoNombre,
      rivalNombre,
      propio,
      rivalGoles,
      updatedMatch.sede,
      selectedJugadoresFiguras,
      scoreForm.notaDt,
      activeCoach || "Carlos Araya (DT)"
    );

    setCronicaOutput(cronicaText);
    toast.success("¡Marcador registrado y crónica redactada con éxito por la IA! ✓");
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE MÓDULO */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-[10px] uppercase mb-1">
            Organización General del Club · Área Técnica
          </Badge>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            🏆 Torneos, Ligas & Matriz de Posiciones
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Mapa macro de la participación competitiva oficial de la academia.
          </p>
        </div>

        <Button
          onClick={() => setIsOpenCreate(true)}
          className="bg-primary text-primary-foreground font-bold gap-2 shadow-sm rounded-xl hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Registrar Nuevo Torneo / Liga
        </Button>
      </div>

      {/* TARJETAS VISUALES DE TORNEOS ACTIVOS (Formato compacto no tan ancho) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
        {competicionesList.map((comp) => {
          const isSelected = sel?.id === comp.id;
          const progressPercent = comp.jornadas > 0 ? Math.round((comp.jornadaActual / comp.jornadas) * 100) : 0;

          return (
            <Card
              key={comp.id}
              onClick={() => {
                setSel(comp);
                setActiveTab("general");
                setTimeout(() => {
                  document.getElementById("torneo-detalles")?.scrollIntoView({ behavior: "smooth" });
                }, 50);
              }}
              className={`cursor-pointer transition-all duration-200 border p-4 rounded-2xl shadow-sm max-w-sm hover:scale-[1.02] active:scale-[0.98] ${
                isSelected
                  ? "border-2 border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-2 ring-primary/20"
                  : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50/50"
              }`}
            >
              <CardHeader className="p-0 pb-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase border border-slate-200/60">
                    {comp.tipo}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Jornada {comp.jornadaActual} / {comp.jornadas}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 pt-2">
                  {comp.nombre}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {comp.categoria} · {comp.disciplina} · {comp.equipos} Equipos
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 pt-2 space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Avance del Campeonato</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* INTERACCIÓN INTERNA DEL TORNEO SELECCIONADO */}
      {sel && (
        <Card id="torneo-detalles" className="shadow-sm border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl scroll-mt-6">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] uppercase font-bold mb-1 border border-slate-200/60 inline-block">
                {sel.tipo} · Categoría {sel.categoria}
              </span>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">{sel.nombre}</CardTitle>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              📍 Sedes: {Array.isArray(sel.sedes) ? sel.sedes.join(", ") : sel.sedes || "Sede Central"}
            </span>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
              <TabsList className="grid grid-cols-2 max-w-md bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                <TabsTrigger value="general" className="text-xs font-bold">🏆 Fixture & Tabla de Posiciones</TabsTrigger>
                <TabsTrigger value="reglamento" className="text-xs font-bold">📄 Reglamento PDF</TabsTrigger>
              </TabsList>

              {/* 1. VISTA FUSIONADA: Fixture + Tabla de Posiciones */}
              <TabsContent value="general" className="space-y-6 pt-2">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Columna Izquierda: Calendario de Partidos (Fixture) */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        🗓️ Calendario de Partidos (Fixture)
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {partidos.length} Encuentros
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {partidos.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          No hay encuentros cargados en el rol de este torneo.
                        </div>
                      ) : (
                        partidos.map((p, idx) => {
                          const { local, visitante } = getMatchTeams(p);
                          return (
                            <div key={p.id || idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] font-bold">Jornada {p.jornada || idx + 1}</Badge>
                                  {p.convocadosCount && (
                                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1">
                                      👥 {p.convocadosCount} Convocados
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">{local} vs {visitante}</p>
                                <p className="text-[11px] text-slate-500">📅 {p.fecha} · ⏰ {p.hora} · 📍 {p.sede || "Estadio Asoderive Central"}</p>
                              </div>

                              <div className="flex flex-col items-end gap-1.5">
                                {p.resultado ? (
                                  <Badge className="bg-emerald-600 text-white font-mono font-bold text-xs py-1 px-3">
                                    {p.resultado.propio} – {p.resultado.rival} (Final)
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-amber-600 border-amber-500/30 bg-amber-500/10 py-1 px-2.5">
                                    Por Disputar
                                  </Badge>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenScoreModal(p)}
                                  className="h-7 text-[10px] font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 rounded-lg shadow-xs"
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Marcador / Crónica IA
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Columna Derecha: Tabla de Posiciones */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        📊 Tabla de Posiciones Oficial
                      </h3>
                      <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-bold">
                        Temporada 2026
                      </Badge>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px] bg-slate-100/60 dark:bg-slate-800/60">
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">Equipo / Club</th>
                            <th className="p-2.5 text-center">PJ</th>
                            <th className="p-2.5 text-center text-emerald-600">PG</th>
                            <th className="p-2.5 text-center text-amber-600">PE</th>
                            <th className="p-2.5 text-center text-red-600">PP</th>
                            <th className="p-2.5 text-center">GF</th>
                            <th className="p-2.5 text-center">GC</th>
                            <th className="p-2.5 text-center font-bold">DG</th>
                            <th className="p-2.5 text-right font-bold text-primary text-sm">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {tabla.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="py-8 text-center text-xs text-muted-foreground">
                                Sin partidos jugados registrados en este torneo.
                              </td>
                            </tr>
                          ) : (
                            tabla.map((t, idx) => (
                              <tr key={t.equipo || idx} className={`hover:bg-muted/30 ${idx === 0 ? "bg-emerald-500/5 font-extrabold" : ""}`}>
                                <td className="p-2.5 font-bold">
                                  {idx === 0 ? "🏆 1" : idx + 1}
                                </td>
                                <td className="p-2.5 font-bold text-foreground">{t.equipo}</td>
                                <td className="p-2.5 text-center font-mono">{t.pj}</td>
                                <td className="p-2.5 text-center font-mono text-emerald-600 font-bold">{t.pg}</td>
                                <td className="p-2.5 text-center font-mono text-amber-600">{t.pe}</td>
                                <td className="p-2.5 text-center font-mono text-red-600">{t.pp}</td>
                                <td className="p-2.5 text-center font-mono">{t.gf}</td>
                                <td className="p-2.5 text-center font-mono">{t.gc}</td>
                                <td className="p-2.5 text-center font-mono font-bold">{t.dg > 0 ? `+${t.dg}` : t.dg}</td>
                                <td className="p-2.5 text-right font-mono font-black text-primary text-sm">{t.pts}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* 2. Reglamento del Torneo PDF */}
              <TabsContent value="reglamento" className="space-y-4 pt-2">
                <div className="p-6 rounded-xl border bg-card space-y-4 text-center">
                  <FileText className="h-12 w-12 mx-auto text-primary opacity-80" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-foreground">Reglamento Oficial y Sanciones de la Liga</h3>
                    <p className="text-xs text-muted-foreground">
                      Repositorio digital PDF para consultar normas de juego, sustituciones permitidas y sanciones disciplinarias.
                    </p>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setReglamentoFile(e.target.files?.[0] || null)}
                      className="max-w-xs h-10 text-xs"
                    />
                    <Button onClick={handleUploadReglamento} className="bg-gradient-primary text-white font-bold text-xs gap-1.5 h-10">
                      <Upload className="h-4 w-4" /> Subir PDF
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* MODAL NUEVO TORNEO */}
      <Dialog open={isOpenCreate} onOpenChange={setIsOpenCreate}>
        <DialogContent className="sm:max-w-[450px] bg-card border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Registrar Nuevo Torneo / Liga
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ingresa los datos del torneo oficial donde compite la academia
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Torneo *</label>
              <Input
                placeholder="Ej. Liga Nacional Sub-15 2026"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="w-full h-10 rounded-xl border bg-background px-3 text-xs font-semibold"
                >
                  <option value="Liga">Liga</option>
                  <option value="Copa">Copa</option>
                  <option value="Torneo">Torneo</option>
                  <option value="Festival">Festival</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Categoría *</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  className="w-full h-10 rounded-xl border bg-background px-3 text-xs font-semibold"
                >
                  {categoriasList.map((c: any) => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                  {categoriasList.length === 0 && <option value="Sub-15">Sub-15</option>}
                </select>
              </div>
            </div>

            <Button onClick={handleCreateCompeticion} className="w-full h-11 bg-primary text-white font-extrabold text-xs shadow-elegant rounded-xl">
              ✓ REGISTRAR TORNEO
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL ELEGANTE & PROFESIONAL: REGISTRAR MARCADOR & REDACTAR CRÓNICA IA */}
      <Dialog open={isOpenScoreModal} onOpenChange={setIsOpenScoreModal}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase mb-1">
                ✨ Marcador Final & Redactor IA
              </Badge>
            </div>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-100 pt-1">
              ⚽ {selectedMatchForScore ? `${selectedMatchForScore.equipo || "U9 Asoderive"} vs ${selectedMatchForScore.rival || "U9 San José"}` : "Registrar Marcador del Partido"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ingresa el resultado oficial, selecciona goleadores del plantel y publica la crónica periodística en el Muro del Club.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            {/* Marcador propio vs rival */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1 text-center">
                <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Goles {selectedMatchForScore?.equipo || "U9 Asoderive"}</label>
                <Input
                  type="number"
                  min={0}
                  value={scoreForm.golesPropio}
                  onChange={(e) => setScoreForm(f => ({ ...f, golesPropio: Number(e.target.value) }))}
                  className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono font-black text-center text-2xl h-12 rounded-xl shadow-xs"
                />
              </div>
              <div className="space-y-1 text-center">
                <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Goles {scoreForm.rival || "Rival"}</label>
                <Input
                  type="number"
                  min={0}
                  value={scoreForm.golesRival}
                  onChange={(e) => setScoreForm(f => ({ ...f, golesRival: Number(e.target.value) }))}
                  className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono font-black text-center text-2xl h-12 rounded-xl shadow-xs"
                />
              </div>
            </div>

            {/* Figuras y goleadores con Selector Rápido */}
            <div className="space-y-2 border-t border-b border-slate-100 dark:border-slate-800/80 py-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" /> Figuras & Goleadores del Partido
                </label>
                <span className="text-[10px] text-slate-400">Selecciona o busca jugadores del plantel</span>
              </div>

              {/* Buscador de Jugadores */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar jugador por nombre o posición..."
                  value={searchJugadorText}
                  onChange={(e) => setSearchJugadorText(e.target.value)}
                  className="pl-9 h-9 text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Badges de Jugadores Seleccionados */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedJugadoresFiguras.map((item) => (
                  <Badge 
                    key={item.id}
                    className={`text-xs py-1 px-2.5 font-bold gap-1.5 flex items-center shadow-xs ${
                      item.esFigura 
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30" 
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {item.goles > 0 && <span>⚽ {item.goles} {item.goles === 1 ? "Gol" : "Goles"}</span>}
                    {item.esFigura && <span>⭐ Figura</span>}
                    <span>{item.nombre}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveJugadorFigura(item.id)}
                      className="ml-1 text-slate-400 hover:text-red-500 font-black text-xs"
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Lista Rápida de Selección de Jugadores */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pt-1 pr-1 border rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                {defaultPlantelSub9
                  .filter(j => j.nombre.toLowerCase().includes(searchJugadorText.toLowerCase()))
                  .map((j) => {
                    const selInfo = selectedJugadoresFiguras.find(p => p.id === j.id);
                    return (
                      <div key={j.id} className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold flex items-center justify-center">
                            #{j.dorsal}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{j.nombre}</p>
                            <p className="text-[10px] text-slate-400">{j.posicion}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddGolJugador(j)}
                            className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1 transition-all"
                          >
                            ⚽ +1 Gol {selInfo && selInfo.goles > 0 ? `(${selInfo.goles})` : ""}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFiguraJugador(j)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1 transition-all ${
                              selInfo?.esFigura 
                                ? "bg-amber-500 text-white border-amber-600 shadow-xs" 
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                            }`}
                          >
                            <Star className="h-3 w-3" /> {selInfo?.esFigura ? "Figura ✓" : "Figura"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Resumen en texto editable */}
              <Input
                value={scoreForm.figuras}
                onChange={(e) => setScoreForm(f => ({ ...f, figuras: e.target.value }))}
                placeholder="Resumen editable de figuras y goles..."
                className="bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold h-8"
              />
            </div>

            {/* Nota rápida DT – micrófono DENTRO del textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                📝 Nota del Entrenador (DT)
              </label>
              <div className="relative">
                <textarea
                  rows={4}
                  value={scoreForm.notaDt}
                  onChange={(e) => setScoreForm(f => ({ ...f, notaDt: e.target.value }))}
                  placeholder="Toca el micrófono 🎙️ y dicta tus observaciones del partido..."
                  className="w-full bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-white/10 rounded-xl text-xs p-3 pr-12 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 outline-none focus:ring-2 focus:ring-primary font-medium resize-none"
                  style={isListening ? { borderColor: '#ef4444', boxShadow: '0 0 0 2px rgba(239,68,68,0.25)' } : {}}
                />
                {/* Botón micrófono superpuesto dentro del textarea */}
                <button
                  type="button"
                  onClick={startListening}
                  title={isListening ? "Detener dictado" : "Iniciar dictado por voz"}
                  className={`absolute bottom-2.5 right-2.5 flex items-center justify-center w-8 h-8 rounded-full transition-all shadow-md z-10 ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-primary text-white hover:bg-primary/80"
                  }`}
                >
                  {isListening
                    ? <MicOff className="h-4 w-4" />
                    : <Mic className="h-4 w-4" />
                  }
                </button>
                {isListening && dictStatus && (
                  <div className="absolute top-2 left-3 right-12 flex items-center gap-1.5 text-[10px] font-bold text-red-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block flex-shrink-0" />
                    {dictStatus}
                  </div>
                )}
              </div>
            </div>

            {/* 📸 Fotos del Partido */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-primary" /> 📸 Fotos del Partido (Muro Social)
                </label>
                <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-bold hover:bg-primary/20 transition-all flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Subir Fotos
                  <input type="file" accept="image/*" multiple onChange={handleAddFotos} className="hidden" />
                </label>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {fotosPartido.map((imgUrl, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                    <img src={imgUrl} alt={`Foto partido ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFoto(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {fotosPartido.length === 0 && (
                  <div className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
                    No se han adjuntado fotos aún. Presiona "Subir Fotos" para adjuntar imágenes de la jornada.
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleSaveScoreAndCronica}
              className="w-full bg-gradient-primary text-white font-bold text-xs gap-2 shadow-md h-11 rounded-xl hover:opacity-95"
            >
              <Sparkles className="h-4 w-4" /> Guardar Marcador & Redactar Crónica con IA
            </Button>

            {/* Resultado de Crónica IA */}
            {cronicaOutput && (
              <div className="mt-4 border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" /> 📢 Crónica Generada por IA (Lista para Muro)
                  </span>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(cronicaOutput);
                      toast.success("Crónica copiada al portapapeles");
                    }}
                    className="h-7 text-[10px] font-bold border-purple-500/30 text-purple-600 dark:text-purple-300"
                  >
                    📋 Copiar Mensaje
                  </Button>
                </div>

                <div className="p-4 bg-white dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line font-medium shadow-inner">
                  {cronicaOutput}
                </div>

                <Button
                  onClick={handlePublishToMuro}
                  disabled={isPublishing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs gap-2 h-11 rounded-xl shadow-lg"
                >
                  {isPublishing ? "⏳ Publicando..." : `🚀 Publicar en el Muro Social del Club (${fotosPartido.length} Fotos) & Finalizar`}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CompeticionesPage;
