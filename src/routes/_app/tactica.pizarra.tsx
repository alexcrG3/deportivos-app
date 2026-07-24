import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TacticalBoard } from "@/components/tactical-board";
import { supabase } from "@/lib/supabase";
import {
  TacticalStore, SportType, sportLabels, BoardSession,
  getPlayerAvailability, availabilityConfig
} from "@/lib/tactical-store";
import RendimientoStore from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import { StatCard } from "@/components/stat-card";
import {
  ShieldHalf, ChevronDown, Users, Brain, Sparkles,
  Plus, X, Search, CheckCircle2, AlertCircle, XCircle,
  Zap, Info, Layers, Film, Scissors, Target, Upload, Video, ArrowRight, Tag, LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tactica/pizarra")({ component: PizarraTactica });

const SPORT_OPTIONS: SportType[] = [
  "football", "futsal", "basketball", "volleyball", "rugby",
  "hockey", "tennis", "swimming", "martial-arts", "athletics", "baseball"
];

// Maps each SportType to its formation disciplina label
// Also used to filter the player roster in the sidebar.
const SPORT_DISCIPLINA: Partial<Record<SportType, string>> = {
  football:       "Fútbol",
  futsal:         "Fútbol",
  basketball:     "Baloncesto",
  volleyball:     "Voleibol",
  swimming:       "Natación",
  // rugby, hockey, tennis, athletics, baseball, martial-arts
  // don't have matching player disciplinas in the data yet
};

// ── POSITION-AWARE SPAWN MAP ────────────────────────────────────────────────
// Maps posicionPrincipal → ideal x,y coordinates on the 100×65 field.
// The team attacks left→right: own goal at x≈2, rival goal at x≈98.
const POSITION_SPAWN_MAP: Record<string, { x: number; y: number }> = {
  // ── Fútbol ──
  "Portero":            { x: 5,  y: 32 },
  "POR":                { x: 5,  y: 32 },
  "Defensa central":    { x: 22, y: 32 },
  "DFC":                { x: 22, y: 32 },
  "Lateral":            { x: 20, y: 18 },
  "DFI":                { x: 20, y: 18 },
  "DFD":                { x: 20, y: 46 },
  "Mediocampista":      { x: 45, y: 32 },
  "MCD":                { x: 40, y: 32 },
  "MC":                 { x: 48, y: 32 },
  "Volante ofensivo":   { x: 60, y: 32 },
  "MCO":                { x: 60, y: 32 },
  "Extremo":            { x: 65, y: 12 },
  "EXT":                { x: 65, y: 12 },
  "Delantero":          { x: 78, y: 32 },
  "DEL":                { x: 78, y: 32 },
  // ── Baloncesto (cancha 100×65) ──
  "Base":               { x: 35, y: 32 },
  "BAS":                { x: 35, y: 32 },
  "Escolta":            { x: 25, y: 18 },
  "ESC":                { x: 25, y: 18 },
  "Alero":              { x: 25, y: 46 },
  "ALO":                { x: 25, y: 46 },
  "Ala-pívot":          { x: 12, y: 22 },
  "APY":                { x: 12, y: 22 },
  "Pívot":              { x: 8,  y: 32 },
  "PIV":                { x: 8,  y: 32 },
  // ── Voleibol ──
  "Armador":            { x: 38, y: 32 },
  "COL":                { x: 38, y: 32 },
  "Opuesto":            { x: 62, y: 32 },
  "OP":                 { x: 62, y: 32 },
  "Central":            { x: 50, y: 20 },
  "CEN":                { x: 50, y: 20 },
  "Receptor":           { x: 50, y: 44 },
  "PUN":                { x: 50, y: 44 },
  "Líbero":             { x: 50, y: 32 },
  "Voleibol_LIB":       { x: 50, y: 32 },
  "LIB":                { x: 50, y: 32 }, // fallback
  "REM":                { x: 62, y: 32 },
  // ── Natación (calles horizontales) ──
  "Libre":              { x: 50, y: 10 },
  "Natación_LIB":       { x: 50, y: 10 },
  "Espalda":            { x: 50, y: 21 },
  "ESP":                { x: 50, y: 21 },
  "Pecho":              { x: 50, y: 32 },
  "BRA":                { x: 50, y: 32 },
  "Mariposa":           { x: 50, y: 43 },
  "MAR":                { x: 50, y: 43 },
  "Combinado":          { x: 50, y: 54 },
};

// Maps player positions to candidate formation slots (slotId prefixes or keys)
const POSITION_TO_SLOTS: Record<string, string[]> = {
  // Fútbol
  "POR": ["GK"],
  "Portero": ["GK"],
  "DFC": ["CB1", "CB2", "CB3", "LCM", "RCM"],
  "Defensa central": ["CB1", "CB2", "CB3", "LCM", "RCM"],
  "DFI": ["LB", "LWB"],
  "Lateral Izq.": ["LB", "LWB"],
  "DFD": ["RB", "RWB"],
  "Lateral Der.": ["RB", "RWB"],
  "MCD": ["CDM1", "CDM2", "CM", "LCM", "RCM"],
  "MC": ["CM", "LCM", "RCM", "LM", "RM", "CDM1", "CDM2", "CAM"],
  "Mediocampista": ["CM", "LCM", "RCM", "LM", "RM", "CDM1", "CDM2", "CAM"],
  "MCO": ["CAM", "LM", "RM", "CM", "LCM", "RCM"],
  "Volante ofensivo": ["CAM", "LM", "RM", "CM", "LCM", "RCM"],
  "EXT": ["LW", "RW"],
  "Extremo": ["LW", "RW"],
  "DEL": ["CF", "LS", "RS"],
  "Delantero": ["CF", "LS", "RS"],

  // Baloncesto
  "BAS": ["PG"],
  "Base": ["PG"],
  "ESC": ["SG"],
  "Escolta": ["SG"],
  "ALO": ["SF"],
  "Alero": ["SF"],
  "APY": ["PF"],
  "Ala-pívot": ["PF"],
  "PIV": ["C"],
  "Pívot": ["C"],
};


// Fallback round-robin for players with unknown/generic positions
const FALLBACK_SPAWNS = [
  { x: 50, y: 32 }, { x: 30, y: 20 }, { x: 70, y: 20 },
  { x: 20, y: 45 }, { x: 80, y: 45 }, { x: 35, y: 55 },
];

function getSpawnForPlayer(
  posicion: string | undefined,
  playersOnBoard: number,
  disciplina?: string
): { x: number; y: number } {
  if (posicion) {
    const key = `${disciplina}_${posicion}`;
    if (disciplina && POSITION_SPAWN_MAP[key]) {
      return POSITION_SPAWN_MAP[key];
    }
    if (POSITION_SPAWN_MAP[posicion]) {
      return POSITION_SPAWN_MAP[posicion];
    }
  }
  return FALLBACK_SPAWNS[playersOnBoard % FALLBACK_SPAWNS.length];
}

const disciplineToSport = (dispName: string): SportType => {
  const norm = dispName.toLowerCase();
  if (norm.includes("fút") || norm.includes("fut")) return "football";
  if (norm.includes("balon") || norm.includes("basket")) return "basketball";
  if (norm.includes("volei") || norm.includes("volley")) return "volleyball";
  if (norm.includes("natac") || norm.includes("swim")) return "swimming";
  return "football";
};

function PizarraTactica() {
  const { role, coachName } = useRole();
  const isAdmin = role === "admin";

  const listDisciplines = RendimientoStore.getDisciplinas();
  const isSingleDiscipline = listDisciplines.length === 1;
  const singleDisciplineName = isSingleDiscipline ? listDisciplines[0].nombre : null;

  // Compute which SportType options to show in the selector.
  // Superadmin (isAdmin) sees ALL sports.
  // Regular users only see sports matching their academy's registered disciplines.
  const allowedSportOptions: SportType[] = useMemo(() => {
    const isSuperAdmin = localStorage.getItem("is_superadmin") === "true";
    if (isAdmin || isSuperAdmin) return SPORT_OPTIONS;
    if (listDisciplines.length === 0) return SPORT_OPTIONS;
    // Map each discipline name to a SportType
    const mapped = listDisciplines
      .map(d => disciplineToSport(d.nombre))
      .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
    return mapped.length > 0 ? mapped : SPORT_OPTIONS;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, listDisciplines]);

  const formations = useMemo(() => TacticalStore.getFormations(), []);
  const [selectedSport, setSelectedSport] = useState<SportType>(() => {
    const saved = TacticalStore.getBoardSession();
    if (saved && saved.id !== "board-default") return saved.sport;
    if (isSingleDiscipline && !isAdmin && singleDisciplineName) {
      return disciplineToSport(singleDisciplineName);
    }
    return "football";
  });
  const [selectedFormationId, setSelectedFormationId] = useState<string>(() => {
    const saved = TacticalStore.getBoardSession();
    if (saved && saved.id !== "board-default") return saved.formationId;
    return "f-433";
  });
  const [viewTab, setViewTab] = useState<"dashboard" | "lienzo">("dashboard");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [dashboardTag, setDashboardTag] = useState<string | null>(null);

  const [showPlayers, setShowPlayers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [boardKey, setBoardKey] = useState(0);
  const [boardPlayerIds, setBoardPlayerIds] = useState<Set<string>>(() => {
    const saved = TacticalStore.getBoardSession();
    if (saved && saved.players) {
      const realIds = saved.players.map((p: any) => p.jugadorId).filter((id: string) => id && !id.startsWith("ghost-"));
      return new Set(realIds);
    }
    return new Set();
  });

  // Build a fresh session with ghost players for the given formation
  const buildGhostSession = useCallback((formationId: string, existingSession?: any) => {
    const formation = formations.find(f => f.id === formationId);
    const ghostPlayers = (formation?.slots ?? []).map((s: any) => ({
      slotId: s.slotId,
      jugadorId: `ghost-${s.slotId}`,
      x: s.x,
      y: s.y,
      nombre: s.label ?? s.slotId,
      numero: 0,
    }));
    return {
      players: ghostPlayers,
      arrows: existingSession?.arrows ?? [],
      zones: existingSession?.zones ?? [],
      cones: existingSession?.cones ?? [],
      ball: existingSession?.ball ?? { x: 50, y: 32 },
      formationId,
    };
  }, [formations]);

  // Full board session state — kept in sync via onSessionChange so we can preserve
  // arrows/zones/cones when remounting the board after sidebar add/remove actions.
  // Start with ghost players so slot matching works on the first player add.
  const [boardSession, setBoardSession] = useState<any>(() => {
    const saved = TacticalStore.getBoardSession();
    if (saved && saved.id !== "board-default") return saved;
    return buildGhostSession("f-433");
  });
  const [activeTab, setActiveTab] = useState<"squad" | "rival">("squad");
  const [analyzingMatch, setAnalyzingMatch] = useState(false);
  const [matchAnalysis, setMatchAnalysis] = useState<any | null>(null);
  const [detailedPlayerId, setDetailedPlayerId] = useState<string | null>(null);
  
  // Modos de Pizarra: partido (con partidos y convocatorias) o entrenamiento (por equipo)
  const [boardMode, setBoardMode] = useState<"partido" | "entrenamiento">("partido");

  // Load players and partidos from Supabase reactively
  const [jugadoresList, setJugadoresList] = useState<any[]>(() => RendimientoStore.getJugadores());
  const [allMatches, setAllMatches] = useState<any[]>(() => RendimientoStore.getPartidos());

  useEffect(() => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    // Jugadores
    supabase.from("jugadores").select("*").eq("organizacion_id", orgId).then(({ data }) => {
      if (data && data.length > 0) setJugadoresList(data.map((j: any) => ({
        id: j.id, nombre: j.nombre, avatar: j.avatar,
        categoria: j.categoria, disciplina: j.disciplina,
        posicionPrincipal: j.posicion, posicion: j.posicion,
      })));
    });
    // Partidos
    supabase.from("partidos").select("*").eq("organizacion_id", orgId).then(({ data }) => {
      if (data && data.length > 0) setAllMatches(data.map((p: any) => ({
        id: p.id, equipoId: p.equipo_id, equipo: p.equipo, rival: p.rival,
        tipo: p.tipo, fecha: p.fecha, hora: p.hora, sede: p.sede,
        estado: p.estado, resultado: p.resultado, organizacion_id: p.organizacion_id,
      })));
    });
  }, []);

  const myTeams = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    if (isAdmin) return all;
    return all.filter(t => t.entrenador === coachName);
  }, [isAdmin, coachName]);

  const matchesList = useMemo(() => {
    const all = RendimientoStore.getEquipos();
    const myTeamsIds = myTeams.map(t => t.id);
    const myTeamsNames = myTeams.map(t => t.nombre);
    return allMatches.map(m => {
      const matchTeam = all.find(t => t.id === m.equipoId);
      return {
        ...m,
        equipo: matchTeam ? matchTeam.nombre : m.equipo
      };
    }).filter(m => {
      if (isAdmin) return true;
      return (m.equipoId && myTeamsIds.includes(m.equipoId)) || myTeamsNames.includes(m.equipo);
    });
  }, [allMatches, myTeams, isAdmin]);

  const [selectedMatchId, setSelectedMatchId] = useState<string>(() => matchesList[0]?.id || "");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => myTeams[0]?.id || "");

  useEffect(() => {
    if (matchesList.length > 0 && !selectedMatchId) {
      setSelectedMatchId(matchesList[0].id);
    }
  }, [matchesList.length, selectedMatchId]);

  useEffect(() => {
    if (myTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(myTeams[0].id);
    }
  }, [myTeams.length, selectedTeamId]);

  const selectedMatch = useMemo(() => {
    return matchesList.find(m => m.id === selectedMatchId);
  }, [matchesList, selectedMatchId]);

  const selectedTeam = useMemo(() => {
    return myTeams.find(t => t.id === selectedTeamId);
  }, [myTeams, selectedTeamId]);

  // Load convocatorias from Supabase
  const [convocatorias, setConvocatorias] = useState<any[]>([]);
  useEffect(() => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase
      .from("convocatorias")
      .select("*")
      .eq("organizacion_id", orgId)
      .then(({ data }) => { if (data) setConvocatorias(data); });
  }, []);

  const matchConvocatoria = useMemo(() => {
    if (!selectedMatch) return null;
    return convocatorias.find((c: any) => 
      (c.partidoId === selectedMatch.id || c.partido_id === selectedMatch.id) ||
      c.titulo.toLowerCase().includes(selectedMatch.rival.toLowerCase()) ||
      c.equipo.toLowerCase().includes(selectedMatch.equipo.toLowerCase()) ||
      selectedMatch.equipo.toLowerCase().includes(c.equipo.toLowerCase())
    );
  }, [selectedMatch, convocatorias]);

  const convokedPlayers = useMemo(() => {
    if (!selectedMatch) return [];
    if (matchConvocatoria && matchConvocatoria.jugadores) {
      const convokedIds = matchConvocatoria.jugadores.map((p: any) => p.id);
      return jugadoresList.filter(j => convokedIds.includes(j.id));
    }
    const matchTeam = myTeams.find(t => t.id === selectedMatch.equipoId || t.nombre === selectedMatch.equipo);
    if (matchTeam) {
      return jugadoresList.filter(j => j.categoria === matchTeam.categoria || j.categoria === matchTeam.nombre);
    }
    return jugadoresList;
  }, [selectedMatch, matchConvocatoria, jugadoresList, myTeams]);

  const trainingPlayers = useMemo(() => {
    if (!selectedTeam) return jugadoresList;
    return jugadoresList.filter(j => j.categoria === selectedTeam.categoria || j.categoria === selectedTeam.nombre);
  }, [selectedTeam, jugadoresList]);

  const basePlayers = boardMode === "partido" ? convokedPlayers : trainingPlayers;

  const categoriesOfSport = useMemo(() => {
    const sportDisciplina = SPORT_DISCIPLINA[selectedSport];
    const playersOfSport = jugadoresList.filter(j =>
      sportDisciplina ? j.disciplina === sportDisciplina : true
    );
    const uniqueCats = Array.from(new Set(playersOfSport.map(p => p.categoria).filter(Boolean)));
    return uniqueCats;
  }, [selectedSport, jugadoresList]);

  const selectedFormation = formations.find(f => f.id === selectedFormationId);
  const loadData = RendimientoStore.getPlayerLoadData();

  const handleSessionChange = useCallback((session: BoardSession) => {
    // Keep full session in sync (preserves arrows/zones/cones on remount)
    setBoardSession(session);
    const realIds = session.players.map(p => p.jugadorId).filter((id: string) => !id.startsWith("ghost-"));
    console.log("[Pizarra] handleSessionChange, realIds:", realIds);
    setBoardPlayerIds(new Set(realIds));
  }, []);


  const handleFormationChange = useCallback((formId: string) => {
    setSelectedFormationId(formId);
    setBoardSession(buildGhostSession(formId));
    setBoardPlayerIds(new Set());
    setBoardKey(k => k + 1);
    toast.success(`Formación ${formations.find(f => f.id === formId)?.nombre} cargada`);
  }, [formations, buildGhostSession]);

  const handleSportChange = useCallback((sport: SportType) => {
    setSelectedSport(sport);
    const disciplina = SPORT_DISCIPLINA[sport];
    const compatible = disciplina
      ? formations.find(f => f.disciplina === disciplina)
      : undefined;
    const newFormId = compatible?.id ?? selectedFormationId;
    if (compatible) setSelectedFormationId(newFormId);
    setBoardSession(buildGhostSession(newFormId));
    setBoardPlayerIds(new Set());
    setBoardKey(k => k + 1);
  }, [formations, selectedFormationId, buildGhostSession]);

  // ── ADD MY SQUAD PLAYER ─────────────────────────────────────────────────────
  const addPlayerToBoard = useCallback((jugadorId: string) => {
    if (boardPlayerIds.has(jugadorId)) { toast.info("Ya está en la pizarra"); return; }
    const jug = jugadoresList.find(j => j.id === jugadorId) || basePlayers.find(j => j.id === jugadorId);
    if (!jug) { toast.error("No se pudo encontrar la información del jugador."); return; }

    const pos = jug.posicion || "DEL";
    const candidateSlots = POSITION_TO_SLOTS[pos] || POSITION_TO_SLOTS[pos.toUpperCase()] || [];

    setBoardSession((prev: any) => {
      let targetSlot = prev.players.find((p: any) => candidateSlots.includes(p.slotId) && p.jugadorId.startsWith("ghost-"));
      if (!targetSlot) targetSlot = prev.players.find((p: any) => candidateSlots.includes(p.slotId));
      if (!targetSlot) targetSlot = prev.players.find((p: any) => p.jugadorId.startsWith("ghost-"));

      let updatedPlayers = [...prev.players];
      let newSlotId = `free-${jugadorId}`;
      let spawnX = 50, spawnY = 32;

      if (targetSlot) {
        newSlotId = targetSlot.slotId;
        spawnX = targetSlot.x;
        spawnY = targetSlot.y;
        updatedPlayers = updatedPlayers.filter((p: any) => p.slotId !== targetSlot!.slotId);
      } else {
        const spawn = getSpawnForPlayer(pos, prev.players.length, jug.disciplina);
        spawnX = spawn.x; spawnY = spawn.y;
      }

      const num = jug.numero || jug.dorsal || (jug.identificacion ? parseInt(jug.identificacion.slice(-2)) : null) || 10;
      updatedPlayers.push({ slotId: newSlotId, jugadorId, x: spawnX, y: spawnY, nombre: jug.nombre, numero: num, avatar: jug.avatar });
      return { ...prev, players: updatedPlayers };
    });
    setBoardPlayerIds(prev => new Set([...prev, jugadorId]));
    setBoardKey(k => k + 1);
    toast.success(`${jug.nombre.split(" ")[0]} añadido ✅`);
  }, [boardPlayerIds, jugadoresList, basePlayers]);

  // ── REMOVE SQUAD PLAYER ────────────────────────────────────────────────────
  const removePlayerFromBoard = useCallback((jugadorId: string) => {
    const jug = jugadoresList.find((j: any) => j.id === jugadorId);
    setBoardSession((prev: any) => ({ ...prev, players: prev.players.filter((p: any) => p.jugadorId !== jugadorId) }));
    setBoardPlayerIds(prev => { const n = new Set(prev); n.delete(jugadorId); return n; });
    setBoardKey(k => k + 1);
    toast.success(`${jug?.nombre?.split(" ")[0] ?? "Jugador"} quitado`);
  }, [jugadoresList]);

  // ── CLEAR PIZZARA ──────────────────────────────────────────────────────────
  const clearAllPlayers = useCallback(() => {
    setBoardSession((prev: any) => buildGhostSession(selectedFormationId));
    setBoardPlayerIds(new Set());
    setBoardKey(k => k + 1);
    toast.success("Pizarra despejada");
  }, [buildGhostSession, selectedFormationId]);

  // ── ADD RIVAL PLAYER ─────────────────────────────────────────────────────────
  const addRivalToBoard = useCallback((rivalNum: number) => {
    const rivalId = `rival-${rivalNum}`;
    if (boardPlayerIds.has(rivalId)) { toast.info("Este rival ya está en el campo"); return; }
    const spawnX = 65 + (rivalNum * 2.8) % 30;
    const spawnY = 10 + (rivalNum * 4.8) % 50;
    const newRival = { slotId: `rival-slot-${rivalNum}`, jugadorId: rivalId, x: spawnX, y: spawnY, nombre: `Rival ${rivalNum}`, numero: rivalNum };
    setBoardSession((prev: any) => ({ ...prev, players: [...prev.players, newRival] }));
    setBoardPlayerIds(prev => new Set([...prev, rivalId]));
    setBoardKey(k => k + 1);
    toast.success(`Rival ${rivalNum} añadido 🔴`);
  }, [boardPlayerIds]);

  // ── REMOVE RIVAL PLAYER ──────────────────────────────────────────────────────
  const removeRivalFromBoard = useCallback((rivalNum: number) => {
    const rivalId = `rival-${rivalNum}`;
    setBoardSession((prev: any) => ({ ...prev, players: prev.players.filter((p: any) => p.jugadorId !== rivalId) }));
    setBoardPlayerIds(prev => { const next = new Set(prev); next.delete(rivalId); return next; });
    setBoardKey(k => k + 1);
    toast.success(`Rival ${rivalNum} retirado`);
  }, []);

  // ── SPAWN ALL 11 RIVALS AT ONCE ─────────────────────────────────────────────
  const spawnAll11Rivals = useCallback(() => {
    const positions = [
      { x: 92, y: 32 }, { x: 80, y: 15 }, { x: 80, y: 25 }, { x: 80, y: 40 }, { x: 80, y: 50 },
      { x: 70, y: 20 }, { x: 70, y: 32 }, { x: 70, y: 45 },
      { x: 60, y: 15 }, { x: 60, y: 32 }, { x: 60, y: 50 },
    ];
    const updatedIds = new Set(boardPlayerIds);
    const newRivals: any[] = [];
    positions.forEach((pos, idx) => {
      const num = idx + 1;
      const rivalId = `rival-${num}`;
      if (!updatedIds.has(rivalId)) {
        newRivals.push({ slotId: `rival-slot-${num}`, jugadorId: rivalId, x: pos.x, y: pos.y, nombre: `Rival ${num}`, numero: num });
        updatedIds.add(rivalId);
      }
    });
    setBoardSession((prev: any) => ({ ...prev, players: [...prev.players, ...newRivals] }));
    setBoardPlayerIds(updatedIds);
    setBoardKey(k => k + 1);
    toast.success("Equipo rival (11 jugadores) desplegado 🔴");
  }, [boardPlayerIds]);

  const handleAnalyzeMatch = () => {
    setAnalyzingMatch(true);
    setTimeout(() => {
      const result = TacticalStore.runMatchSimulation(selectedFormationId, { playerMinutes: {}, activeForm: selectedFormationId });
      setMatchAnalysis(result);
      setAnalyzingMatch(false);
      toast.success("Análisis IA completado");
    }, 1000);
  };

  const handleOptimizeLineup = () => {
    const result = TacticalStore.getLineupRecommendation(selectedFormationId);
    const newPlayers: any[] = [];
    const newIds = new Set<string>();
    result.titularesSugeridos.slice(0, 11).forEach((name: string, idx: number) => {
      const jugObj = jugadoresList.find((j: any) => j.nombre === name);
      if (jugObj) {
        const spawn = getSpawnForPlayer(jugObj.posicion, idx, jugObj.disciplina);
        const num = jugObj.numero || (parseInt(jugObj.identificacion.slice(-2)) || 10);
        newPlayers.push({ slotId: `opt-${jugObj.id}`, jugadorId: jugObj.id, x: spawn.x, y: spawn.y, nombre: jugObj.nombre, numero: num, avatar: jugObj.avatar });
        newIds.add(jugObj.id);
      }
    });
    setBoardSession((prev: any) => ({ ...prev, players: newPlayers }));
    setBoardPlayerIds(newIds);

    setBoardKey(k => k + 1); // remount to clear old arrows/zones
    toast.success("Alineación IA aplicada ✨");
  };

  const detailedPlayer = detailedPlayerId ? jugadoresList.find(j => j.id === detailedPlayerId) : null;
  const detailedLoad = detailedPlayerId ? loadData.find(l => l.jugadorId === detailedPlayerId) : null;

  const sportDisciplina = SPORT_DISCIPLINA[selectedSport];
  const filteredJugadores = useMemo(() => {
    const filtered = basePlayers.filter(j => {
      const matchesSearch =
        j.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.posicion || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
    return [...filtered].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [basePlayers, searchQuery]);

  // DB data for Centro Táctico Dashboard
  const dbEquipos = useMemo(() => RendimientoStore.getEquipos(), []);
  const dbEntrenadores = useMemo(() => RendimientoStore.getEntrenadores(), []);
  const activeTeamName = dbEquipos[0]?.nombre || "Asoderive U13";
  const mainCoach = dbEntrenadores[0]?.nombre || coachName || "Edgar Calderón";

  const totalPizarras = useMemo(() => {
    const session = TacticalStore.getBoardSession();
    return session ? 14 : 12;
  }, []);

  const totalJugadasBalonParado = useMemo(() => {
    const plays = TacticalStore.getPlays();
    return Math.max(8, plays.filter((p) => p.categoria === "balon-parado").length + 5);
  }, []);

  const minutosVideoAnalizados = useMemo(() => {
    const videos = TacticalStore.getVideoAnalyses();
    return videos.reduce((acc, v) => acc + (parseInt(String(v.duracion || "45"), 10) || 45), 185);
  }, []);

  const pizarrasRecientes = useMemo(() => {
    return [
      {
        id: "piz-1",
        titulo: "Salida de Balón 4-3-3",
        equipo: activeTeamName,
        sistema: "4-3-3",
        modificado: "Hace 20 min",
        autor: mainCoach,
        tag: "Presión Alta",
        aspectoColor: "from-indigo-600/30 to-violet-900/30 border-indigo-500/40",
      },
      {
        id: "piz-2",
        titulo: "Córner Ofensivo - Bloqueo al Primer Poste",
        equipo: dbEquipos[1]?.nombre || "Asoderive U11",
        sistema: "Balón Parado",
        modificado: "Ayer",
        autor: dbEntrenadores[1]?.nombre || "Tiffany Eduarte",
        tag: "Balón Parado",
        aspectoColor: "from-amber-600/30 to-orange-900/30 border-amber-500/40",
      },
      {
        id: "piz-3",
        titulo: `Presión Tras Pérdida (${dbEquipos[2]?.nombre || "Élite Sub-12 A"})`,
        equipo: dbEquipos[2]?.nombre || "Élite Sub-12 A",
        sistema: "Transición Defensiva",
        modificado: "Hace 3 días",
        autor: dbEntrenadores[2]?.nombre || "Carlos Araya",
        tag: "Transición Ofensiva",
        aspectoColor: "from-emerald-600/30 to-teal-900/30 border-emerald-500/40",
      },
    ];
  }, [activeTeamName, mainCoach, dbEquipos, dbEntrenadores]);

  const videoScoutingFeed = useMemo(() => {
    return [
      {
        id: "v1",
        titulo: `Rival: Deportivo Central (${dbEquipos[0]?.categoria || "Sub-13"})`,
        tipo: "Partido de Liga",
        statusLabel: "🟢 Analizado (12 clips recortados)",
        statusColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
        fecha: "Ayer",
        tag: "Presión Alta",
      },
      {
        id: "v2",
        titulo: "Análisis de Errores en Salida - Jornada 10",
        tipo: "Video Propio",
        statusLabel: "🟡 En Edición (Faltan etiquetas)",
        statusColor: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        fecha: "Hace 2 días",
        tag: "Bloque Bajo",
      },
      {
        id: "v3",
        titulo: "Scouting Balón Parado Rival (Cortes)",
        tipo: "Cortes de Video",
        statusLabel: "🟢 Publicado a Jugadores",
        statusColor: "bg-blue-500/10 text-blue-600 border-blue-500/30",
        fecha: "Hace 4 días",
        tag: "Saques de Banda",
      },
    ];
  }, [dbEquipos]);

  const filteredPizarras = useMemo(() => {
    return pizarrasRecientes.filter((p) => {
      const matchSearch =
        p.titulo.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
        p.equipo.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
        p.sistema.toLowerCase().includes(dashboardSearch.toLowerCase());
      const matchTag = dashboardTag ? p.tag === dashboardTag : true;
      return matchSearch && matchTag;
    });
  }, [pizarrasRecientes, dashboardSearch, dashboardTag]);

  const filteredVideos = useMemo(() => {
    return videoScoutingFeed.filter((v) => {
      const matchSearch =
        v.titulo.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
        v.tipo.toLowerCase().includes(dashboardSearch.toLowerCase());
      const matchTag = dashboardTag ? v.tag === dashboardTag : true;
      return matchSearch && matchTag;
    });
  }, [videoScoutingFeed, dashboardSearch, dashboardTag]);

  const boardCount = boardPlayerIds.size;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shrink-0">
            <ShieldHalf className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pizarra Táctica</h1>
            <p className="text-sm text-muted-foreground">
              Interactiva · Drag &amp; Drop · <span className="text-primary font-semibold">{boardCount}</span> jugador{boardCount !== 1 ? "es" : ""} en campo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {/* Mode Switcher */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1">Modo de Pizarra</span>
            <div className="flex bg-slate-800/80 border border-white/10 rounded-xl p-1 h-10 items-center">
              <button
                onClick={() => setBoardMode("partido")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all h-8 ${
                  boardMode === "partido"
                    ? "bg-primary text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ⚽ Partido
              </button>
              <button
                onClick={() => setBoardMode("entrenamiento")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all h-8 ${
                  boardMode === "entrenamiento"
                    ? "bg-primary text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📋 Entrenamiento
              </button>
            </div>
          </div>

          {/* Sport / Discipline Selector */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1">Deporte</span>
            {isSingleDiscipline && !isAdmin && allowedSportOptions.length === 1 ? (
              <Badge className="bg-primary/10 text-primary border border-primary/20 py-2.5 px-4 rounded-xl text-sm font-semibold h-10 flex items-center">
                {sportLabels[allowedSportOptions[0]]}
              </Badge>
            ) : (
              <div className="relative">
                <select
                  value={selectedSport}
                  onChange={e => handleSportChange(e.target.value as SportType)}
                  className="appearance-none bg-slate-800 border border-white/20 rounded-xl px-4 pr-9 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-primary cursor-pointer h-10 min-w-[140px]"
                >
                  {allowedSportOptions.map(s => <option key={s} value={s} className="bg-slate-900 text-white">{sportLabels[s]}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            )}
          </div>

          {/* Conditional Dropdown depending on Mode */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1">
              {boardMode === "partido" ? "Seleccionar Partido" : "Seleccionar Equipo"}
            </span>
            {boardMode === "partido" ? (
              <div className="relative">
                <select
                  value={selectedMatchId}
                  onChange={e => setSelectedMatchId(e.target.value)}
                  className="appearance-none bg-slate-800 border border-white/20 rounded-xl px-4 pr-9 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-primary cursor-pointer h-10 min-w-[220px] max-w-[240px] truncate"
                >
                  {matchesList.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.equipo} vs {m.rival} ({m.fecha})
                    </option>
                  ))}
                  {matchesList.length === 0 && (
                    <option value="" disabled className="bg-slate-900 text-white">Sin partidos</option>
                  )}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedTeamId}
                  onChange={e => setSelectedTeamId(e.target.value)}
                  className="appearance-none bg-slate-800 border border-white/20 rounded-xl px-4 pr-9 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-primary cursor-pointer h-10 min-w-[180px]"
                >
                  {myTeams.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.nombre} ({t.categoria})
                    </option>
                  ))}
                  {myTeams.length === 0 && (
                    <option value="" disabled className="bg-slate-900 text-white">Sin equipos</option>
                  )}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            )}
          </div>

          {/* Formation dropdown — only shown for sports that have defined formations */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mb-1">Estrategia / Táctica</span>
            {(() => {
              const disciplina = SPORT_DISCIPLINA[selectedSport];
              const sportFormations = disciplina
                ? formations.filter(f => f.disciplina === disciplina)
                : [];
              if (sportFormations.length === 0) {
                return (
                  <span className="px-3 py-2 text-xs bg-slate-800 border border-white/15 rounded-xl text-slate-400 font-medium h-10 flex items-center justify-center min-w-[110px]">
                    Posición libre
                  </span>
                );
              }
              return (
                <div className="relative">
                  <select
                    value={selectedFormationId}
                    onChange={e => handleFormationChange(e.target.value)}
                    className="appearance-none bg-slate-800 border border-white/20 rounded-xl px-4 pr-9 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-primary cursor-pointer h-10 min-w-[100px]"
                  >
                    {sportFormations.map(f => (
                      <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                        {f.nombre}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              );
            })()}
          </div>

          <Button
            variant="outline"
            size="default"
            className="gap-2 text-sm border-white/15"
            onClick={() => setShowPlayers(p => !p)}
          >
            <Users className="h-4 w-4" />
            {showPlayers ? "Ocultar plantel" : "Ver plantel"}
          </Button>
        </div>
      </div>

      {/* IA Tools bar — horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        <Button
          size="default"
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2 text-sm shadow-lg px-5 shrink-0"
          onClick={handleAnalyzeMatch}
          disabled={analyzingMatch}
        >
          <Brain className="h-4 w-4" />
          {analyzingMatch ? "Analizando…" : "Analizar Partido"}
        </Button>
        <Button
          size="default"
          variant="outline"
          className="gap-2 text-sm border-violet-500/40 text-violet-300 hover:bg-violet-500/15 font-bold px-5 shrink-0"
          onClick={handleOptimizeLineup}
        >
          <Sparkles className="h-4 w-4 text-violet-400" />
          Optimizar Alineación
        </Button>
        <Link to="/tactica/simulaciones">
          <Button size="default" variant="outline" className="gap-2 text-sm border-white/15 font-semibold px-5 shrink-0">
            <Zap className="h-4 w-4" />
            Simulador
          </Button>
        </Link>
        <Link to="/tactica/matriz">
          <Button size="default" variant="outline" className="gap-2 text-sm border-white/15 font-semibold px-5 shrink-0">
            Disponibilidad
          </Button>
        </Link>
      </div>

      {/* Analysis Result */}
      {matchAnalysis && (
        <Card className="border-violet-500/25 bg-gradient-to-r from-card to-violet-950/10">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-400" /> Informe Automático IA
            </CardTitle>
            <button className="text-sm text-muted-foreground hover:text-foreground transition" onClick={() => setMatchAnalysis(null)}>✕ Cerrar</button>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Estado general", value: `${matchAnalysis.estadoGeneral}%`, color: "text-emerald-500" },
              { label: "Listos", value: `${matchAnalysis.disponiblesCount} jugadores`, color: "text-foreground" },
              { label: "Precaución / Riesgo", value: `${matchAnalysis.precaucionCount} / ${matchAnalysis.riesgoCount}`, color: "text-amber-500" },
              { label: "Confianza IA", value: matchAnalysis.nivelConfianza, color: "text-violet-500" },
            ].map(item => (
              <div key={item.label} className="border border-border bg-muted/40 p-4 rounded-xl text-center">
                <p className="text-xs uppercase font-bold text-muted-foreground tracking-wide">{item.label}</p>
                <p className={`text-xl font-black mt-1 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Layout: Board above, sidebar below on mobile/tablet */}
      <div className="flex flex-col xl:flex-row gap-5">
        {/* Canvas */}
        <div className="flex-1 min-w-0 w-full order-1">
          <TacticalBoard
            sport={selectedSport}
            slots={selectedFormation?.slots ?? []}
            readonly={false}
            onSessionChange={handleSessionChange}
            initialSession={boardSession}
          />
        </div>


        {/* Right sidebar */}
        {showPlayers && (
          <div className="w-full xl:w-80 shrink-0 space-y-4 order-2">
            {/* Player Detailed analysis */}
            {detailedPlayer && detailedLoad ? (
              <div className="rounded-2xl border border-violet-500/30 bg-slate-900 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-white/10">
                  <p className="text-sm font-bold text-white">Analizador IA del Jugador</p>
                  <button className="text-slate-400 hover:text-white transition text-lg leading-none" onClick={() => setDetailedPlayerId(null)}>✕</button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={detailedPlayer.avatar} alt="" className="h-12 w-12 rounded-full border-2 border-violet-400/40 shadow" />
                    <div>
                      <p className="font-bold text-white text-base leading-tight">{detailedPlayer.nombre}</p>
                      <p className="text-slate-400 text-sm">{detailedPlayer.posicion || "Jugador"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Recovery</p>
                      <p className="font-black text-white text-3xl mt-1 leading-none">{detailedLoad.recoveryScore}</p>
                      <p className="text-xs text-slate-500 mt-1">/ 100</p>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Wellness</p>
                      <p className="font-black text-white text-3xl mt-1 leading-none">{detailedLoad.wellnessScore}</p>
                      <p className="text-xs text-slate-500 mt-1">/ 100</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "ACWR Semanal", value: String(detailedLoad.acwr), color: detailedLoad.acwr > 1.3 ? "text-red-400" : detailedLoad.acwr > 1.1 ? "text-amber-400" : "text-emerald-400" },
                      { label: "Fatiga", value: `${detailedLoad.fatigaScore}%`, color: detailedLoad.fatigaScore > 70 ? "text-red-400" : detailedLoad.fatigaScore > 50 ? "text-amber-400" : "text-emerald-400" },
                      { label: "Carga Semanal", value: `${detailedLoad.cargaSemanal} AU`, color: "text-sky-300" },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5">
                        <span className="text-sm text-slate-300 font-medium">{row.label}</span>
                        <span className={`font-bold text-sm ${row.color}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`rounded-xl px-4 py-3 text-center font-bold text-sm border ${
                    detailedLoad.semaforo === "rojo" ? "bg-red-500/20 border-red-500/40 text-red-200" :
                    detailedLoad.semaforo === "amarillo" ? "bg-amber-500/20 border-amber-500/40 text-amber-200" :
                    "bg-emerald-500/20 border-emerald-500/40 text-emerald-200"
                  }`}>
                    {detailedLoad.semaforo === "rojo" ? "🔴 No se recomienda jugar" :
                     detailedLoad.semaforo === "amarillo" ? "🟡 Usar con precaución (max 60 min)" :
                     "🟢 Disponible al 100%"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 shrink-0 text-violet-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Analizador IA</p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Haz clic en el <strong className="text-violet-400 font-bold">nombre</strong> de cualquier jugador de la lista para ver su análisis de fatiga, carga y recuperación.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <Card className="border-white/8 bg-white/[0.02]">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Cómo usar</p>
                {[
                  { icon: <Plus className="h-4 w-4 text-emerald-400 shrink-0" />, text: "Pulsa + para añadir al campo" },
                  { icon: <X className="h-4 w-4 text-red-400 shrink-0" />, text: "Pulsa ✕ para quitar del campo" },
                  { icon: <span className="text-amber-400 text-sm shrink-0">⟵</span>, text: "Arrastra el token para moverlo" },
                  { icon: <span className="text-red-400 text-sm shrink-0">🗑</span>, text: 'Herramienta "Borrar" + clic en token' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Players list Card */}
            <Card className="border-white/10">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab("squad")}
                      className={`text-sm font-bold pb-1 border-b-2 transition ${
                        activeTab === "squad" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Plantel
                    </button>
                    <button
                      onClick={() => setActiveTab("rival")}
                      className={`text-sm font-bold pb-1 border-b-2 transition ${
                        activeTab === "rival" ? "border-red-500 text-red-400" : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Rival (Rojo)
                    </button>
                  </div>
                  <button
                    onClick={clearAllPlayers}
                    className="text-xs text-red-400 hover:text-red-300 transition font-medium"
                  >
                    Limpiar todo
                  </button>
                </div>

                {activeTab === "squad" ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar jugador..."
                      className="pl-9 h-9 text-sm bg-white/5 border-white/15"
                    />
                  </div>
                ) : (
                  <Button
                    onClick={spawnAll11Rivals}
                    className="w-full h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-bold gap-1 shadow-md"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir 11 Rivales (Rojo)
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-4 pt-2">
                <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
                  {activeTab === "squad" ? (
                    <>
                      {filteredJugadores.length === 0 && (
                        <div className="text-center py-6 space-y-1">
                          <p className="text-sm font-semibold text-white/70">
                            {searchQuery
                              ? "Sin coincidencias en la búsqueda"
                              : sportDisciplina
                                ? `No hay jugadores de ${sportDisciplina} registrados`
                                : "Sin jugadores registrados"}
                          </p>
                          {!searchQuery && sportDisciplina && (
                            <p className="text-xs text-muted-foreground">
                              Agrega jugadores de {sportDisciplina} desde la sección de Plantilla
                            </p>
                          )}
                        </div>
                      )}
                      {filteredJugadores.map(j => {
                        const avail = getPlayerAvailability(j.id);
                        const onBoard = boardPlayerIds.has(j.id);
                        const AvailIcon =
                          avail === "disponible" ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> :
                          avail === "precaucion"  ? <AlertCircle  className="h-4 w-4 text-amber-400  shrink-0" /> :
                                                   <XCircle      className="h-4 w-4 text-red-400     shrink-0" />;

                        const availLoad = loadData.find(l => l.jugadorId === j.id);
                        const availTooltip =
                          avail === "disponible"    ? "✅ Disponible — Carga y bienestar en rango normal" :
                          avail === "precaucion"    ? `⚠️ Precaución — Carga elevada (${availLoad?.cargaSemanal ?? "—"} UA esta semana). Puede jugar pero monitorear` :
                          /* no-recomendado */        `🚫 No recomendado — Carga crítica o lesión activa (${availLoad?.cargaSemanal ?? "—"} UA). No se aconseja participar`;

                        return (
                          <div
                            key={j.id}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                              onBoard ? "bg-primary/10 border-primary/30" : "border-white/8 hover:bg-white/5"
                            }`}
                          >
                            <button
                              className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                              onClick={() => setDetailedPlayerId(j.id)}
                            >
                              <img src={j.avatar} alt="" className="h-8 w-8 rounded-full shrink-0 border border-white/15" />
                              <div className="min-w-0 flex-1">
                                <p className={`font-semibold text-sm truncate ${onBoard ? "text-primary" : "text-slate-900 dark:text-white"}`}>
                                  {j.nombre.split(" ").slice(0, 2).join(" ")}
                                </p>
                                <p className="text-muted-foreground text-xs truncate">
                                  {j.posicion || "Jugador"}
                                </p>
                              </div>
                            </button>
                            {/* Availability icon — hover to see reason */}
                            <span title={availTooltip} className="cursor-help shrink-0">
                              {AvailIcon}
                            </span>
                            {onBoard ? (
                              <button
                                onClick={() => removePlayerFromBoard(j.id)}
                                className="h-7 w-7 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-100 transition shrink-0"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => addPlayerToBoard(j.id)}
                                disabled={avail === "no-recomendado"}
                                className={`h-7 w-7 flex items-center justify-center rounded-full transition shrink-0 ${
                                  avail === "no-recomendado"
                                    ? "bg-white/5 text-muted-foreground cursor-not-allowed opacity-40"
                                    : "bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 hover:text-emerald-100"
                                }`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      {Array.from({ length: 11 }, (_, i) => {
                        const num = i + 1;
                        const rivalId = `rival-${num}`;
                        const onBoard = boardPlayerIds.has(rivalId);

                        return (
                          <div
                            key={rivalId}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                              onBoard ? "bg-red-500/10 border-red-500/30" : "border-white/8 hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm bg-red-600 text-white shadow border border-red-400">
                                {num}
                              </span>
                              <div>
                                <p className="font-semibold text-sm text-slate-900 dark:text-white">Rival {num}</p>
                                <p className="text-slate-400 text-xs">Oponente</p>
                              </div>
                            </div>

                            {onBoard ? (
                              <button
                                onClick={() => removeRivalFromBoard(num)}
                                className="h-7 w-7 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-100 transition shrink-0"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => addRivalToBoard(num)}
                                className="h-7 w-7 flex items-center justify-center rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-100 transition shrink-0"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default PizarraTactica;
