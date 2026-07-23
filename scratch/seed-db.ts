import pg from 'pg';
const { Client } = pg;
import * as mockData from '../src/lib/mock-data';

const client = new Client({
  connectionString: 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL for full seeding in Spanish...');

  // 1. Clear existing data
  console.log('Clearing existing data...');
  const truncateQuery = `
    TRUNCATE TABLE 
      organizaciones,
      sedes, disciplinas, temporadas, categorias, jugadores, pagos, 
      sesiones_entrenamiento, registros_wellness, banco_pruebas_fisicas, resultados_pruebas_fisicas, 
      lesiones, organizacion, movimientos_caja_hoy, notificaciones, partidos_competicion, 
      objetivos_rendimiento, planes_rendimiento, disponibilidad_jugadores, 
      estadisticas_competicion_jugadores, cargas_jugadores, objetivos_jugadores, 
      evaluaciones_rapidas, sesiones_recuperacion, clasificaciones, cargas_entrenamiento, 
      plantillas_entrenamiento, trofeos, plantillas_whatsapp, mensajes_whatsapp, 
      flujos_trabajo, registros_flujos_trabajo 
    CASCADE;
  `;
  await client.query(truncateQuery);

  const insertDefaultOrgQuery = `
    INSERT INTO organizaciones (id, nombre, slug, correo_admin, pais)
    VALUES 
      ('00000000-0000-0000-0000-000000000000', 'Academia Deportiva Élite', 'elite-default', 'admin@elite.com', 'Costa Rica'),
      ('11111111-1111-1111-1111-111111111111', 'Club Deportivo Los Halcones', 'halcones', 'contacto@halcones.com', 'Costa Rica'),
      ('22222222-2222-2222-2222-222222222222', 'Centro Acuático Delfines', 'delfines', 'info@delfines.com', 'Costa Rica'),
      ('33333333-3333-3333-3333-333333333333', 'Club Voleibol Élite', 'voleibol', 'laura@voleibol.com', 'Costa Rica'),
      ('44444444-4444-4444-4444-444444444444', 'Academia Tenis Smash', 'tenis', 'juan@tenis.com', 'Costa Rica'),
      ('55555555-5555-5555-5555-555555555555', 'Dojo Garra Marcial', 'artes-marciales', 'pedro@martialarts.com', 'Costa Rica'),
      ('66666666-6666-6666-6666-666666666666', 'Asociación Atletismo Gacelas', 'atletismo', 'sofia@atletismo.com', 'Costa Rica'),
      ('77777777-7777-7777-7777-777777777777', 'Cachorros Béisbol Club', 'beisbol', 'jose@beisbol.com', 'Costa Rica')
    ON CONFLICT (id) DO NOTHING;
  `;
  await client.query(insertDefaultOrgQuery);
  console.log('Inserted default organizations successfully.');

  // 2. Seed Sedes
  console.log('Seeding sedes...');
  for (const s of mockData.sedes) {
    await client.query(
      `INSERT INTO sedes (id, nombre, direccion, disciplina, encargado, estado, jugadores)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [s.id, s.nombre, s.direccion, s.disciplina, s.encargado, s.estado, s.jugadores]
    );
  }

  // 3. Seed Disciplinas
  console.log('Seeding disciplinas...');
  for (const d of mockData.disciplinas) {
    await client.query(
      `INSERT INTO disciplinas (id, nombre, icono, color, categorias, sedes, entrenadores, activos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [d.id, d.nombre, d.icono, d.color, d.categorias, d.sedes, d.entrenadores, d.activos]
    );
  }

  // 4. Seed Temporadas
  console.log('Seeding temporadas...');
  for (const t of mockData.temporadas) {
    await client.query(
      `INSERT INTO temporadas (id, nombre, anio, inicio, fin, estado, disciplinas, sedes, equipos, campeones)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [t.id, t.nombre, t.anio, t.inicio, t.fin, t.estado, t.disciplinas, t.sedes, t.equipos, t.campeones]
    );
  }

  // 5. Seed Categorias
  console.log('Seeding categorias...');
  for (const c of mockData.categorias) {
    await client.query(
      `INSERT INTO categorias (id, nombre, disciplina, edad_min, edad_max, genero, sede_id, entrenador, capacidad, jugadores, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [c.id, c.nombre, c.disciplina, c.edadMin, c.edadMax, c.genero, c.sedeId, c.entrenador, c.capacidad, c.jugadores, c.estado]
    );
  }

  // 6. Seed Jugadores
  console.log('Seeding jugadores...');
  for (const j of mockData.jugadores) {
    await client.query(
      `INSERT INTO jugadores (id, nombre, identificacion, correo, telefono, genero, fecha_nacimiento, disciplina, categoria, sede, estado, estado_pago, encargado, parentesco, telefono_encargado, correo_encargado, posicion, avatar, qr)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        j.id, j.nombre, j.identificacion, j.correo, j.telefono, j.genero, j.fechaNacimiento,
        j.disciplina, j.categoria, j.sede, j.estado, j.estadoPago, j.encargado, j.parentesco,
        j.telefonoEncargado, j.correoEncargado, j.posicion, j.avatar, j.qr
      ]
    );
  }

  // 7. Seed Pagos
  console.log('Seeding pagos...');
  for (const p of mockData.pagos) {
    await client.query(
      `INSERT INTO pagos (id, jugador, monto, metodo, referencia, fecha, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [p.id, p.jugador, p.monto, p.metodo, p.referencia, p.fecha, p.estado]
    );
  }

  // 8. Seed Sesiones Entrenamiento (was training_sessions)
  console.log('Seeding sesiones_entrenamiento...');
  for (const ts of mockData.trainingSessions) {
    await client.query(
      `INSERT INTO sesiones_entrenamiento (id, nombre, equipo_id, equipo, categoria, entrenador_id, entrenador, fecha, hora, sede, instalacion, duracion, intensidad, objetivo, estado, bloques)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        ts.id, ts.nombre, ts.equipoId, ts.equipo, ts.categoria, ts.entrenadorId, ts.entrenador,
        ts.fecha, ts.hora, ts.sede, ts.instalacion, ts.duracion, ts.intensidad, ts.objetivo, ts.estado,
        JSON.stringify(ts.bloques)
      ]
    );
  }

  // 9. Seed Registros Wellness (was wellness_logs)
  console.log('Seeding registros_wellness...');
  for (const wl of mockData.wellnessLogs) {
    const score = Math.round(wl.promedio * 20);
    await client.query(
      `INSERT INTO registros_wellness (id, jugador_id, jugador, avatar, fecha, sueno, fatiga, dolor, energia, estres, animo, promedio, nivel, tendencia, score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        wl.id, wl.jugadorId, wl.jugador, wl.avatar, wl.fecha, wl.sueno, wl.fatiga, wl.dolor,
        wl.energia, wl.estres, wl.animo, wl.promedio, wl.nivel, wl.tendencia, score
      ]
    );
  }

  // 10. Seed Banco Pruebas Fisicas (was physical_tests_bank)
  console.log('Seeding banco_pruebas_fisicas...');
  for (const pt of mockData.physicalTestsBank) {
    await client.query(
      `INSERT INTO banco_pruebas_fisicas (id, nombre, unidad, categoria)
       VALUES ($1, $2, $3, $4)`,
      [pt.id, pt.nombre, pt.unidad, pt.categoria]
    );
  }

  // 11. Seed Resultados Pruebas Fisicas (was physical_test_results)
  console.log('Seeding resultados_pruebas_fisicas...');
  for (const ptr of mockData.physicalTestResults) {
    await client.query(
      `INSERT INTO resultados_pruebas_fisicas (id, jugador_id, jugador, avatar, test_id, test, fecha, resultado, unidad, delta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [ptr.id, ptr.jugadorId, ptr.jugador, ptr.avatar, ptr.testId, ptr.test, ptr.fecha, ptr.resultado, ptr.unidad, ptr.delta]
    );
  }

  // 12. Seed Lesiones
  console.log('Seeding lesiones...');
  for (const ir of mockData.injuryRecords) {
    await client.query(
      `INSERT INTO lesiones (id, jugador_id, jugador, fecha, tipo, zona_corporal, gravedad, diagnostico, tratamiento, dolor, movilidad, progreso_rtp, retorno_checklist, restricciones, carga_permitida, completada, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        ir.id, ir.jugadorId, ir.jugador, ir.fecha, ir.tipo, ir.zonaCorporal, ir.gravedad,
        ir.diagnostico, JSON.stringify(ir.tratamiento), ir.dolor, ir.movilidad, ir.progresoRtp,
        JSON.stringify(ir.retornoChecklist), ir.restricciones, ir.cargaPermitida, ir.completada, ir.estado
      ]
    );
  }

  // 13. Seed Organizacion
  console.log('Seeding organizacion...');
  const o = mockData.organizacion;
  await client.query(
    `INSERT INTO organizacion (nombre, pais, moneda, correo, telefono)
     VALUES ($1, $2, $3, $4, $5)`,
    [o.nombre, o.pais, o.moneda, o.correo, o.telefono]
  );

  // 14. Seed Movimientos Caja Hoy
  console.log('Seeding movimientos_caja_hoy...');
  for (const m of mockData.movimientosCajaHoy) {
    await client.query(
      `INSERT INTO movimientos_caja_hoy (id, hora, tipo, concepto, metodo, monto)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [m.id, m.hora, m.tipo, m.concepto, m.metodo, m.monto]
    );
  }

  // 15. Seed Notificaciones
  console.log('Seeding notificaciones...');
  for (const n of mockData.notificaciones) {
    await client.query(
      `INSERT INTO notificaciones (id, tipo, prioridad, titulo, mensaje, fecha, leida, link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [n.id, n.tipo, n.prioridad, n.titulo, n.mensaje, n.fecha, n.leida, n.link]
    );
  }

  // 16. Seed Partidos Competicion
  console.log('Seeding partidos_competicion...');
  for (const pc of mockData.partidosCompeticion) {
    await client.query(
      `INSERT INTO partidos_competicion (id, competicion_id, competicion, jornada, fecha, hora, sede, cancha, local, visitante, categoria, disciplina, arbitros, estado, resultado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        pc.id, pc.competicionId, pc.competicion, pc.jornada, pc.fecha, pc.hora, pc.sede,
        pc.cancha, pc.local, pc.visitante, pc.categoria, pc.disciplina, pc.arbitros, pc.estado, pc.resultado
      ]
    );
  }

  // 17. Seed Objetivos Rendimiento (was performance_goals)
  console.log('Seeding objetivos_rendimiento...');
  for (const pgGoal of mockData.performanceGoals) {
    await client.query(
      `INSERT INTO objetivos_rendimiento (id, jugador_id, jugador, avatar, objetivo, progreso, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [pgGoal.id, pgGoal.jugadorId, pgGoal.jugador, pgGoal.avatar, pgGoal.objetivo, pgGoal.progreso, pgGoal.fecha]
    );
  }

  // 18. Seed Planes Rendimiento (was performance_plans)
  console.log('Seeding planes_rendimiento...');
  for (const pp of mockData.performancePlans) {
    await client.query(
      `INSERT INTO planes_rendimiento (id, tipo, nombre, equipo, inicio, fin, objetivo, intensidad, volumen, capacidades, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [pp.id, pp.tipo, pp.nombre, pp.equipo, pp.inicio, pp.fin, pp.objetivo, pp.intensidad, pp.volumen, pp.capacidades, pp.color]
    );
  }

  // 19. Seed Disponibilidad Jugadores (was player_availability)
  console.log('Seeding disponibilidad_jugadores...');
  for (const pa of mockData.playerAvailability) {
    await client.query(
      `INSERT INTO disponibilidad_jugadores (jugador_id, jugador, avatar, posicion, equipo, estado, motivo, dias_estimados)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [pa.jugadorId, pa.jugador, pa.avatar, pa.posicion, pa.equipo, pa.estado, pa.motivo, pa.diasEstimados]
    );
  }

  // 20. Seed Estadisticas Competicion Jugadores (was player_competition_stats)
  console.log('Seeding estadisticas_competicion_jugadores...');
  for (const pcs of mockData.playerCompetitionStats) {
    await client.query(
      `INSERT INTO estadisticas_competicion_jugadores (jugador_id, pj, titular, minutos, goles, asistencias, amarillas, rojas, rendimiento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [pcs.jugadorId, pcs.pj, pcs.titular, pcs.minutos, pcs.goles, pcs.asistencias, pcs.amarillas, pcs.rojas, pcs.rendimiento]
    );
  }

  // 21. Seed Cargas Jugadores (was player_loads)
  console.log('Seeding cargas_jugadores...');
  for (const pl of mockData.playerLoads) {
    await client.query(
      `INSERT INTO cargas_jugadores (jugador_id, jugador, avatar, fecha, intensidad, esfuerzo, fatiga, recuperacion, molestias, carga_semanal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [pl.jugadorId, pl.jugador, pl.avatar, pl.fecha, pl.intensidad, pl.esfuerzo, pl.fatiga, pl.recuperacion, pl.molestias, pl.cargaSemanal]
    );
  }

  // 22. Seed Objetivos Jugadores (was player_objectives)
  console.log('Seeding objetivos_jugadores...');
  for (const po of mockData.playerObjectives) {
    await client.query(
      `INSERT INTO objetivos_jugadores (id, jugador_id, jugador, avatar, tipo, titulo, fecha_inicio, fecha_objetivo, progreso, estado, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [po.id, po.jugadorId, po.jugador, po.avatar, po.tipo, po.titulo, po.fechaInicio, po.fechaObjetivo, po.progreso, po.estado, po.observaciones]
    );
  }

  // 23. Seed Quick Evaluations (was quick_evaluations)
  console.log('Seeding evaluaciones_rapidas...');
  for (const qe of mockData.quickEvaluations) {
    await client.query(
      `INSERT INTO evaluaciones_rapidas (jugador_id, jugador, avatar, actitud, esfuerzo, tecnica, tactica, disciplina, liderazgo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [qe.jugadorId, qe.jugador, qe.avatar, qe.actitud, qe.esfuerzo, qe.tecnica, qe.tactica, qe.disciplina, qe.liderazgo]
    );
  }

  // 24. Seed Sesiones Recuperacion (was recovery_sessions)
  console.log('Seeding sesiones_recuperacion...');
  for (const rs of mockData.recoverySessions) {
    await client.query(
      `INSERT INTO sesiones_recuperacion (id, jugador_id, jugador, fecha, tipo, duracion, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [rs.id, rs.jugadorId, rs.jugador, rs.fecha, rs.tipo, rs.duracion, rs.notes ?? rs.notas]
    );
  }

  // 25. Seed Standings (was standings)
  console.log('Seeding clasificaciones...');
  for (const st of mockData.standings) {
    await client.query(
      `INSERT INTO clasificaciones (competicion_id, equipo, pj, pg, pe, pp, gf, gc, dg, pts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [st.competicionId, st.equipo, st.pj, st.pg, st.pe, st.pp, st.gf, st.gc, st.dg, st.pts]
    );
  }

  // 26. Seed Cargas Entrenamiento (was training_loads)
  console.log('Seeding cargas_entrenamiento...');
  for (const tl of mockData.trainingLoads) {
    await client.query(
      `INSERT INTO cargas_entrenamiento (id, jugador_id, jugador, avatar, fecha, duracion, rpe, carga_interna, carga_externa, volumen_semanal, volumen_mensual, intensidad, tiempo_efectivo, monotonia, strain)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        tl.id, tl.jugadorId, tl.jugador, tl.avatar, tl.fecha, tl.duracion, tl.rpe, tl.cargaInterna,
        tl.cargaExterna, tl.volumenSemanal, tl.volumenMensual, tl.intensidad, tl.tiempoEfectivo, tl.monotonia, tl.strain
      ]
    );
  }

  // 27. Seed Plantillas Entrenamiento (was training_templates)
  console.log('Seeding plantillas_entrenamiento...');
  for (const tt of mockData.trainingTemplates) {
    await client.query(
      `INSERT INTO plantillas_entrenamiento (id, nombre, duracion, bloques, usos, autor, compartida, categoria)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [tt.id, tt.nombre, tt.duracion, tt.bloques, tt.usos, tt.autor, tt.compartida, tt.categoria]
    );
  }

  // 28. Seed Trofeos
  console.log('Seeding trofeos...');
  for (const tf of mockData.trofeos) {
    await client.query(
      `INSERT INTO trofeos (id, temporada, competicion, equipo, tipo)
       VALUES ($1, $2, $3, $4, $5)`,
      [tf.id, tf.temporada, tf.competicion, tf.equipo, tf.tipo]
    );
  }

  // 29. Seed Plantillas Whatsapp (was whatsapp_templates)
  console.log('Seeding plantillas_whatsapp...');
  for (const wt of mockData.whatsappTemplates) {
    await client.query(
      `INSERT INTO plantillas_whatsapp (id, nombre, categoria, variables, uso)
       VALUES ($1, $2, $3, $4, $5)`,
      [wt.id, wt.nombre, wt.categoria, wt.variables, wt.uso]
    );
  }

  // 30. Seed Whatsapp Messages (was whatsapp_messages)
  console.log('Seeding mensajes_whatsapp...');
  for (const wm of mockData.whatsappMessages) {
    await client.query(
      `INSERT INTO mensajes_whatsapp (id, destinatario, numero, plantilla, estado, fecha)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [wm.id, wm.destinatario, wm.numero, wm.plantilla, wm.estado, wm.fecha]
    );
  }

  // 31. Seed Workflows (was workflows)
  console.log('Seeding flujos_trabajo...');
  for (const wf of mockData.workflows) {
    await client.query(
      `INSERT INTO flujos_trabajo (id, nombre, trigger, acciones, ejecuciones, ultima, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [wf.id, wf.nombre, wf.trigger, wf.acciones, wf.ejecuciones, wf.ultima, wf.estado]
    );
  }

  // 32. Seed Workflow Logs (was workflow_logs)
  console.log('Seeding registros_flujos_trabajo...');
  for (const wfl of mockData.workflowLogs) {
    await client.query(
      `INSERT INTO registros_flujos_trabajo (id, workflow, destino, canal, estado, fecha)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [wfl.id, wfl.workflow, wfl.destino, wfl.canal, wfl.estado, wfl.fecha]
    );
  }

  console.log('Full seeding finished successfully in Spanish!');
  await client.end();
}

main().catch(console.error);
