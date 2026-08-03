import { supabase } from "./supabase";
import RendimientoStore from "./rendimiento-store";

export async function ensureStaffDBDataSeeded() {
  if (typeof window === "undefined") return;

  const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";

  try {
    // 1. Ensure "entrenadores" table is populated
    const { data: dbCoaches } = await supabase.from("entrenadores").select("id").eq("organizacion_id", orgId);
    
    if (!dbCoaches || dbCoaches.length === 0) {
      const coachesSeed = [
        {
          id: `c_tiffany_${orgId.slice(0, 8)}`,
          nombre: "Tiffany Eduarte",
          identificacion: "118090234",
          correo: "tiffany@asoderive.com",
          telefono: "+506 8888-0104",
          whatsapp: "+506 8888-0104",
          especialidad: "Directora Técnica Sub-15 Femenil",
          disciplinas: ["Fútbol Femenino"],
          categorias: 2,
          sede_id: "Sede Principal Élite",
          horario: "L-V 14:00 - 18:00",
          estado: "activo",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          organizacion_id: orgId,
          cuenta_bancaria: "CR05015202001023456789",
          tarifa_sesion: 18500,
          bono_partido: 25000,
          moneda: "CRC",
        },
        {
          id: `c_carlos_${orgId.slice(0, 8)}`,
          nombre: "Carlos Araya",
          identificacion: "109840212",
          correo: "carlos@asoderive.com",
          telefono: "+506 8888-0101",
          whatsapp: "+506 8888-0101",
          especialidad: "Director Técnico Fútbol Formativo",
          disciplinas: ["Fútbol Formativo"],
          categorias: 1,
          sede_id: "Sede Principal Élite",
          horario: "L-V 14:00 - 18:00",
          estado: "activo",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
          organizacion_id: orgId,
          cuenta_bancaria: "CR05015202001023456789",
          tarifa_sesion: 20000,
          bono_partido: 25000,
          moneda: "CRC",
        },
        {
          id: `c_edgar_${orgId.slice(0, 8)}`,
          nombre: "Edgar Calderón",
          identificacion: "114560789",
          correo: "edgar@asoderive.com",
          telefono: "+506 8888-0102",
          whatsapp: "+506 8888-0102",
          especialidad: "Preparador Físico & Rendimiento",
          disciplinas: ["Preparación Física"],
          categorias: 3,
          sede_id: "Sede Principal Élite",
          horario: "L-V 14:00 - 18:00",
          estado: "activo",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
          organizacion_id: orgId,
          cuenta_bancaria: "CR05015202001023456790",
          tarifa_sesion: 22000,
          bono_partido: 30000,
          moneda: "CRC",
        },
        {
          id: `c_eduardo_${orgId.slice(0, 8)}`,
          nombre: "Eduardo Villa",
          identificacion: "115670345",
          correo: "eduardo@asoderive.com",
          telefono: "+506 8888-0103",
          whatsapp: "+506 8888-0103",
          especialidad: "D.T. Categorías Juveniles",
          disciplinas: ["Fútbol Juvenil"],
          categorias: 1,
          sede_id: "Sede Principal Élite",
          horario: "L-V 14:00 - 18:00",
          estado: "activo",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
          organizacion_id: orgId,
          cuenta_bancaria: "CR05015202001023456791",
          tarifa_sesion: 18500,
          bono_partido: 22000,
          moneda: "CRC",
        },
      ];

      await supabase.from("entrenadores").upsert(coachesSeed);
      console.log("[Staff DB Seed] ✅ Entrenadores creados en Supabase BD");
    }

    // Fetch active coaches from DB
    const { data: coachesData } = await supabase.from("entrenadores").select("*").eq("organizacion_id", orgId);
    const activeCoaches = coachesData || [];

    if (activeCoaches.length > 0) {
      // 2. Ensure "asistencias_staff" table is populated
      try {
        const { data: dbAsistencia, error: asistErr } = await supabase.from("asistencias_staff").select("id").eq("organizacion_id", orgId);
        if (!asistErr && (!dbAsistencia || dbAsistencia.length === 0)) {
          const todayStr = new Date().toISOString().split("T")[0];
          const asistenciasSeed = activeCoaches.map((c, idx) => ({
            id: `asist_${c.id}_${todayStr}`,
            entrenador_id: c.id,
            entrenador_nombre: c.nombre,
            fecha: todayStr,
            hora_entrada: idx === 2 ? "14:15" : "13:52",
            hora_salida: "18:05",
            estado: idx === 2 ? "Tardía" : "Puntual",
            sede_nombre: "Sede Principal Élite",
            organizacion_id: orgId,
          }));
          const { error: upsertErr } = await supabase.from("asistencias_staff").upsert(asistenciasSeed);
          if (!upsertErr) console.log("[Staff DB Seed] ✅ Asistencias registradas en Supabase BD");
        }
      } catch {
        // Tabla asistencias_staff no existe aún en Supabase — se ignora silenciosamente
      }

      // 3. Ensure "solicitudes_permisos" table is populated
      try {
        const { data: dbSolicitudes, error: solErr } = await supabase.from("solicitudes_permisos").select("id").eq("organizacion_id", orgId);
        if (!solErr && (!dbSolicitudes || dbSolicitudes.length === 0)) {
          const solicitudesSeed = [
            {
              id: `sol_1_${orgId}`,
              entrenador_id: activeCoaches[0].id,
              entrenador_nombre: activeCoaches[0].nombre,
              tipo: "Vacaciones",
              fecha_inicio: "2026-08-01",
              fecha_fin: "2026-08-07",
              motivo: "Período anual de descanso",
              estado: "Pendiente",
              organizacion_id: orgId,
            },
            {
              id: `sol_2_${orgId}`,
              entrenador_id: activeCoaches[1]?.id || activeCoaches[0].id,
              entrenador_nombre: activeCoaches[1]?.nombre || activeCoaches[0].nombre,
              tipo: "Permiso Especial",
              fecha_inicio: "2026-07-28",
              fecha_fin: "2026-07-29",
              motivo: "Seminario de preparación física de alto rendimiento",
              estado: "Aprobado",
              organizacion_id: orgId,
            },
          ];
          const { error: upsertSolErr } = await supabase.from("solicitudes_permisos").upsert(solicitudesSeed);
          if (!upsertSolErr) console.log("[Staff DB Seed] ✅ Solicitudes de permiso registradas en Supabase BD");
        }
      } catch { /* tabla no existe aún */ }

      try {
        const { data: dbCerts, error: certErr } = await supabase.from("certificaciones_staff").select("id").eq("organizacion_id", orgId);
        if (!certErr && (!dbCerts || dbCerts.length === 0)) {
          const certsSeed = activeCoaches.map((c, idx) => ({
            id: `cert_${c.id}`,
            entrenador_id: c.id,
            entrenador_nombre: c.nombre,
            tipo_licencia: idx === 0 ? "Licencia A FIFA / Conmebol" : idx === 1 ? "Certificación Nacional Preparación Física" : "Licencia B Formativa",
            institucion: "Federación Nacional de Fútbol",
            numero_registro: `REG-2026-00${idx + 1}`,
            fecha_expiracion: idx === 1 ? "2026-08-15" : "2027-05-20",
            estado: idx === 1 ? "Por Vencer" : "Vigente",
            organizacion_id: orgId,
          }));
          const { error: certUpsertErr } = await supabase.from("certificaciones_staff").upsert(certsSeed);
          if (!certUpsertErr) console.log("[Staff DB Seed] ✅ Certificaciones registradas en Supabase BD");
        }
      } catch { /* tabla no existe aún */ }

      try {
        const { data: dbEvals, error: evalErr } = await supabase.from("evaluaciones_staff").select("id").eq("organizacion_id", orgId);
        if (!evalErr && (!dbEvals || dbEvals.length === 0)) {
          const evalsSeed = activeCoaches.map((c, idx) => ({
            id: `eval_${c.id}`,
            entrenador_id: c.id,
            entrenador_nombre: c.nombre,
            cargo: c.especialidad,
            criterios: {
              puntualidad: 5,
              metodologia: 5,
              manejoGrupo: 4,
              cumplimiento: 5,
              comunicacion: 4,
            },
            puntuacion_general: 96 - idx * 3,
            observaciones: "Excelente metodología de entrenamiento y puntualidad.",
            organizacion_id: orgId,
            updated_at: new Date().toISOString(),
          }));
          const { error: evalUpsertErr } = await supabase.from("evaluaciones_staff").upsert(evalsSeed);
          if (!evalUpsertErr) console.log("[Staff DB Seed] ✅ Evaluaciones del staff registradas en Supabase BD");
        }
      } catch { /* tabla no existe aún */ }

      try {
        const { data: dbNominas, error: nomErr } = await supabase.from("nominas_entrenadores").select("id").eq("organizacion_id", orgId);
        if (!nomErr && (!dbNominas || dbNominas.length === 0)) {
          const nominasSeed = activeCoaches.map((c) => {
            const tarifa = c.tarifa_sesion || 18500;
            const bonoPart = c.bono_partido || 25000;
            const viaticos = 25000;
            const total = tarifa * 14 + bonoPart * 4 + viaticos;
            return {
              id: `nom_${c.id}_2026_07`,
              organizacion_id: orgId,
              entrenador_id: c.id,
              entrenador_nombre: c.nombre,
              periodo_inicio: "2026-07-01",
              periodo_fin: "2026-07-24",
              sesiones_concluidas: 14,
              partidos_concluidos: 4,
              tarifa_sesion: tarifa,
              bono_partido: bonoPart,
              monto_sesiones: tarifa * 14,
              monto_partidos: bonoPart * 4,
              monto_ajustes: viaticos,
              notas_ajustes: "Viáticos de transporte y bono por partidos dirigidos",
              monto_total: total,
              moneda: c.moneda || "CRC",
              estado: "pagado",
              fecha_pago: "2026-07-24",
            };
          });
          const { error: nomUpsertErr } = await supabase.from("nominas_entrenadores").upsert(nominasSeed);
          if (!nomUpsertErr) console.log("[Staff DB Seed] ✅ Registros de Nómina guardados en Supabase BD");
        }
      } catch { /* tabla no existe aún */ }
    }
  } catch (err) {
    console.error("[Staff DB Seed Error]:", err);
  }
}
