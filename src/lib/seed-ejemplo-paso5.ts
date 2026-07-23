/**
 * seed-ejemplo-paso5.ts
 *
 * Inyecta un partido de ejemplo "vs Heredia U13" y su convocatoria oficial
 * con jugadores reales del plantel U13 de Edgar Calderón.
 *
 * Usa RendimientoStore.addPartido() para escribir directamente en memoryCache
 * y athletix_cache_convocatorias para el módulo de convocatorias.
 */

import RendimientoStore from "@/lib/rendimiento-store";

export function seedEjemploPaso5() {
  if (typeof window === "undefined") return;

  // ── Limpiar flag viejo (el seed anterior estaba roto) ──
  localStorage.removeItem("athletix_seed_paso5");

  // Solo ejecutar una vez
  if (localStorage.getItem("athletix_seed_paso5_v2")) return;

  // ── Fecha del próximo sábado ───────────────────────────────────────────────
  const fechaSabado = (() => {
    const d = new Date();
    const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSat);
    return d.toISOString().split("T")[0];
  })();

  // ── 1. Crear el partido usando el store (escribe en memoryCache + cache) ──
  const partidoId = `partido_heredia_u13_demo`;

  // Evitar duplicados si ya existe
  const yaExiste = RendimientoStore.getPartidos().some(
    (p: any) => p.id === partidoId
  );

  let savedPartido: any;
  if (!yaExiste) {
    savedPartido = RendimientoStore.addPartido({
      id: partidoId,
      competicion: "Liga Mayor U13 CR",
      competicionId: "liga_u13_cr",
      jornada: 8,
      fecha: fechaSabado,
      hora: "10:00",
      sede: "Cancha Academia Asoderive",
      cancha: "Cancha Principal",
      local: "Academia Asoderive U13",
      visitante: "Club Heredia FC U13",
      categoria: "U13",
      disciplina: "Fútbol",
      arbitros: "Mario Quesada",
      estado: "programado",
      resultado: null,
    });
    console.log("[Seed Paso 5] ✅ Partido creado:", savedPartido?.id);
  } else {
    savedPartido = RendimientoStore.getPartidos().find(
      (p: any) => p.id === partidoId
    );
    console.log("[Seed Paso 5] ⚠️ Partido ya existía, reutilizando.");
  }

  // ── 2. Obtener jugadores reales U13 ────────────────────────────────────────
  const allPlayers = RendimientoStore.getJugadores();
  const u13Players = allPlayers.filter((p: any) => {
    const cat = (p.categoria || "").toLowerCase();
    return (
      cat.includes("u13") ||
      cat.includes("sub-13") ||
      cat.includes("sub13") ||
      cat.includes("13")
    );
  });

  console.log(`[Seed Paso 5] Jugadores U13 encontrados: ${u13Players.length}`);

  // Posiciones de titulares en 4-3-3
  const posiciones433 = [
    "POR",
    "DFD", "DFC", "DFC", "DFI",
    "MCD", "MC", "MCO",
    "EXT", "DEL", "EXT",
  ];

  const titulares = u13Players.slice(0, 11).map((j: any, idx: number) => ({
    id: j.id,
    nombre: j.nombre,
    avatar: j.avatar || `https://i.pravatar.cc/80?u=${j.id}`,
    posicion: j.posicionPrincipal || posiciones433[idx] || "MED",
    dorsal: idx + 1,
    estado: "pendiente",
  }));

  const suplentes = u13Players.slice(11, 15).map((j: any, idx: number) => ({
    id: j.id,
    nombre: j.nombre,
    avatar: j.avatar || `https://i.pravatar.cc/80?u=${j.id}`,
    posicion: j.posicionPrincipal || "MED",
    dorsal: 12 + idx,
    estado: "pendiente",
  }));

  const reservas = u13Players.slice(15, 18).map((j: any, idx: number) => ({
    id: j.id,
    nombre: j.nombre,
    avatar: j.avatar || `https://i.pravatar.cc/80?u=${j.id}`,
    posicion: j.posicionPrincipal || "MED",
    dorsal: 16 + idx,
    estado: "reserva",
  }));

  const todosConvocados = [...titulares, ...suplentes, ...reservas];

  if (todosConvocados.length === 0) {
    console.warn("[Seed Paso 5] ⚠️ No se encontraron jugadores U13. Seed abortado.");
    return;
  }

  // ── 3. Crear la convocatoria oficial ──────────────────────────────────────
  const convId = `conv_heredia_u13_demo`;

  // La clave usada en convocatorias.tsx es "athletix_convocatorias" directamente
  const convKey = "athletix_convocatorias";
  let existingConv: any[] = [];
  try {
    existingConv = JSON.parse(localStorage.getItem(convKey) || "[]");
  } catch { existingConv = []; }

  // Evitar duplicados
  const convYaExiste = existingConv.some((c: any) => c.id === convId);
  if (!convYaExiste) {
    const nuevaConv = {
      id: convId,
      tipo: "partido",
      titulo: "Partido del Sábado vs. Heredia U13 — Jornada 8",
      fecha: fechaSabado,
      hora: "10:00",
      equipo: "U13 — Academia Asoderive",
      entrenador: "Edgar Calderón",
      partidoId: partidoId,
      rival: "Club Heredia FC U13",
      sede: "Cancha Academia Asoderive",
      uniformeLocal: "Camiseta Blanca / Short Azul",
      horaConcentracion: "09:00",
      notas:
        "Puntualidad obligatoria. Presentarse con uniforme completo, botella de agua y refrigerio ligero. Concentración una hora antes del partido.",
      jugadores: todosConvocados,
    };

    localStorage.setItem(convKey, JSON.stringify([nuevaConv, ...existingConv]));
    console.log(
      `[Seed Paso 5] ✅ Convocatoria creada con ${todosConvocados.length} jugadores.`
    );
  } else {
    console.log("[Seed Paso 5] ⚠️ Convocatoria ya existía.");
  }

  // ── Marcar como ejecutado ─────────────────────────────────────────────────
  localStorage.setItem("athletix_seed_paso5_v2", "1");
}
