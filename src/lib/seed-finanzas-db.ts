import { supabase } from "./supabase";
import RendimientoStore from "./rendimiento-store";

export async function ensureFinanzasDBSeeded() {
  if (typeof window === "undefined") return;

  const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";

  try {
    // 1. Ensure "pagos" table exists and has sample Entradas (Ingresos)
    const { data: dbPagos } = await supabase.from("pagos").select("id").limit(1);

    if (!dbPagos || dbPagos.length === 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      const samplePagos = [
        {
          id: `pago_seed_1_${orgId.slice(0, 8)}`,
          jugadorId: "j1",
          jugadorNombre: "Ian Gutiérrez Valverde",
          monto: 35000,
          concepto: "Cobro de Mensualidad U13 - Julio",
          categoria: "Mensualidad",
          sede: "Sede Central",
          metodo: "SINPE Móvil",
          fecha: todayStr,
          estado: "completado",
          organizacion_id: orgId,
          moneda: "CRC",
        },
        {
          id: `pago_seed_2_${orgId.slice(0, 8)}`,
          jugadorId: "j2",
          jugadorNombre: "Mateo Rojas Calvo",
          monto: 40000,
          concepto: "Cobro de Mensualidad U15 - Julio",
          categoria: "Mensualidad",
          sede: "Sede Central",
          metodo: "Transferencia Bancaria",
          fecha: todayStr,
          estado: "completado",
          organizacion_id: orgId,
          moneda: "CRC",
        },
        {
          id: `pago_seed_3_${orgId.slice(0, 8)}`,
          jugadorId: "j3",
          jugadorNombre: "Carlos Jiménez Ruiz",
          monto: 50000,
          concepto: "Matrícula Temporada 2026",
          categoria: "Matrícula",
          sede: "Sede Norte",
          metodo: "Tarjeta POS",
          fecha: todayStr,
          estado: "completado",
          organizacion_id: orgId,
          moneda: "CRC",
        },
        {
          id: `pago_seed_4_${orgId.slice(0, 8)}`,
          jugadorId: "j4",
          jugadorNombre: "Tienda Oficial Asoderive",
          monto: 45000,
          concepto: "Venta de Uniformes Oficiales de Entreno",
          categoria: "Uniformes & Tienda",
          sede: "Sede Central",
          metodo: "Efectivo",
          fecha: todayStr,
          estado: "completado",
          organizacion_id: orgId,
          moneda: "CRC",
        },
        {
          id: `pago_seed_5_${orgId.slice(0, 8)}`,
          jugadorId: "j5",
          jugadorNombre: "Gabriel Quesada Blanco",
          monto: 60000,
          concepto: "Inscripción Torneo Nacional Formativo",
          categoria: "Torneos",
          sede: "Sede Central",
          metodo: "Transferencia Bancaria",
          fecha: todayStr,
          estado: "completado",
          organizacion_id: orgId,
          moneda: "CRC",
        },
      ];

      await supabase.from("pagos").upsert(samplePagos);
      console.log("[Finanzas DB Seed] ✅ Pagos (Ingresos) registrados en Supabase BD");
    }
  } catch (err) {
    console.error("[Finanzas DB Seed Error]:", err);
  }
}
