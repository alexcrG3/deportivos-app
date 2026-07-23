import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.doadnhxmkmklhlszgcwe:AthletixOS2026!@aws-1-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL database for full migration in Spanish...');

  // 0. Drop all old English & Spanish tables to ensure a clean slate
  console.log('Dropping old tables to clean up schema...');
  const dropQuery = `
    DROP TABLE IF EXISTS 
      organizaciones,
      physical_test_results, lesiones, pagos, jugadores, categorias, 
      temporadas, disciplinas, sedes, training_sessions, wellness_logs, 
      physical_tests_bank, organizacion, movimientos_caja_hoy, notificaciones, 
      partidos_competicion, performance_goals, performance_plans, player_availability, 
      player_competition_stats, player_loads, player_objectives, quick_evaluations, 
      recovery_sessions, standings, training_loads, training_templates, trofeos, 
      whatsapp_templates, whatsapp_messages, workflows, workflow_logs,
      sesiones_entrenamiento, registros_wellness, banco_pruebas_fisicas, resultados_pruebas_fisicas,
      objetivos_rendimiento, planes_rendimiento, disponibilidad_jugadores, estadisticas_competicion_jugadores,
      cargas_jugadores, objetivos_jugadores, evaluaciones_rapidas, sesiones_recuperacion,
      clasificaciones, cargas_entrenamiento, plantillas_entrenamiento, plantillas_whatsapp,
      mensajes_whatsapp, flujos_trabajo, registros_flujos_trabajo
    CASCADE;
  `;
  await client.query(dropQuery);
  console.log('Old tables dropped successfully.');

  // Create tables in order
  const queries = [
    // 1. Sedes
    `CREATE TABLE IF NOT EXISTS sedes (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      direccion TEXT,
      disciplina VARCHAR(50),
      encargado VARCHAR(100),
      estado VARCHAR(20) DEFAULT 'activo',
      jugadores INTEGER DEFAULT 0
    );`,

    // 2. Disciplinas
    `CREATE TABLE IF NOT EXISTS disciplinas (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      icono VARCHAR(10),
      color VARCHAR(50),
      categorias INTEGER DEFAULT 0,
      sedes INTEGER DEFAULT 0,
      entrenadores INTEGER DEFAULT 0,
      activos INTEGER DEFAULT 0
    );`,

    // 3. Temporadas
    `CREATE TABLE IF NOT EXISTS temporadas (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      anio INTEGER,
      inicio DATE,
      fin DATE,
      estado VARCHAR(20) DEFAULT 'activa',
      disciplinas TEXT[],
      sedes INTEGER DEFAULT 0,
      equipos INTEGER DEFAULT 0,
      campeones TEXT[]
    );`,

    // 4. Categorias
    `CREATE TABLE IF NOT EXISTS categorias (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      disciplina VARCHAR(50),
      edad_min INTEGER,
      edad_max INTEGER,
      genero VARCHAR(20),
      sede_id VARCHAR(50) REFERENCES sedes(id),
      entrenador VARCHAR(100),
      capacidad INTEGER DEFAULT 0,
      jugadores INTEGER DEFAULT 0,
      estado VARCHAR(20) DEFAULT 'activo'
    );`,

    // 5. Jugadores
    `CREATE TABLE IF NOT EXISTS jugadores (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      identificacion VARCHAR(50),
      correo VARCHAR(100),
      telefono VARCHAR(50),
      genero VARCHAR(20),
      fecha_nacimiento DATE,
      disciplina VARCHAR(50),
      categoria VARCHAR(100),
      sede VARCHAR(100),
      estado VARCHAR(20) DEFAULT 'activo',
      estado_pago VARCHAR(20) DEFAULT 'al_dia',
      encargado VARCHAR(100),
      parentesco VARCHAR(50),
      telefono_encargado VARCHAR(50),
      correo_encargado VARCHAR(100),
      posicion VARCHAR(20),
      avatar TEXT,
      qr TEXT
    );`,

    // 6. Pagos
    `CREATE TABLE IF NOT EXISTS pagos (
      id VARCHAR(50) PRIMARY KEY,
      jugador VARCHAR(100),
      monto NUMERIC,
      metodo VARCHAR(50),
      referencia VARCHAR(100),
      fecha DATE,
      estado VARCHAR(20) DEFAULT 'completado'
    );`,

    // 7. Sesiones Entrenamiento (was training_sessions)
    `CREATE TABLE IF NOT EXISTS sesiones_entrenamiento (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(100),
      equipo_id VARCHAR(50),
      equipo VARCHAR(100),
      categoria VARCHAR(100),
      entrenador_id VARCHAR(50),
      entrenador VARCHAR(100),
      fecha DATE,
      hora VARCHAR(20),
      sede VARCHAR(100),
      instalacion VARCHAR(100),
      duracion INTEGER,
      intensidad VARCHAR(20),
      objetivo TEXT,
      estado VARCHAR(20) DEFAULT 'programada',
      bloques JSONB
    );`,

    // 8. Registros Wellness (was wellness_logs)
    `CREATE TABLE IF NOT EXISTS registros_wellness (
      id VARCHAR(50) PRIMARY KEY,
      jugador_id VARCHAR(50),
      jugador VARCHAR(100),
      avatar TEXT,
      fecha DATE,
      sueno INTEGER,
      fatiga INTEGER,
      dolor INTEGER,
      energia INTEGER,
      estres INTEGER,
      animo INTEGER,
      promedio NUMERIC,
      nivel VARCHAR(20),
      tendencia VARCHAR(20),
      score INTEGER
    );`,

    // 9. Banco Pruebas Fisicas (was physical_tests_bank)
    `CREATE TABLE IF NOT EXISTS banco_pruebas_fisicas (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      unidad VARCHAR(20),
      categoria VARCHAR(50)
    );`,

    // 10. Resultados Pruebas Fisicas (was physical_test_results)
    `CREATE TABLE IF NOT EXISTS resultados_pruebas_fisicas (
      id VARCHAR(50) PRIMARY KEY,
      jugador_id VARCHAR(50),
      jugador VARCHAR(100),
      avatar TEXT,
      test_id VARCHAR(50) REFERENCES banco_pruebas_fisicas(id),
      test VARCHAR(100),
      fecha DATE,
      resultado NUMERIC,
      unidad VARCHAR(20),
      delta NUMERIC
    );`,

    // 11. Lesiones
    `CREATE TABLE IF NOT EXISTS lesiones (
      id VARCHAR(50) PRIMARY KEY,
      jugador_id VARCHAR(50),
      jugador VARCHAR(100),
      fecha DATE,
      tipo VARCHAR(100),
      zona_corporal VARCHAR(100),
      gravedad VARCHAR(20),
      diagnostico TEXT,
      tratamiento JSONB,
      dolor INTEGER,
      movilidad INTEGER,
      progreso_rtp INTEGER,
      retorno_checklist JSONB,
      restricciones TEXT,
      carga_permitida INTEGER,
      completada BOOLEAN,
      estado VARCHAR(20)
    );`,

    // 12. Organizacion
    `CREATE TABLE IF NOT EXISTS organizacion (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      pais VARCHAR(50),
      moneda VARCHAR(10),
      correo VARCHAR(100),
      telefono VARCHAR(50)
    );`,

    // 13. Movimientos Caja Hoy
    `CREATE TABLE IF NOT EXISTS movimientos_caja_hoy (
      id VARCHAR(50) PRIMARY KEY,
      hora VARCHAR(20),
      tipo VARCHAR(20),
      concepto TEXT,
      metodo VARCHAR(50),
      monto NUMERIC
    );`,

    // 14. Notificaciones
    `CREATE TABLE IF NOT EXISTS notificaciones (
      id VARCHAR(50) PRIMARY KEY,
      tipo VARCHAR(50),
      prioridad VARCHAR(20),
      titulo VARCHAR(100),
      mensaje TEXT,
      fecha VARCHAR(50),
      leida BOOLEAN DEFAULT FALSE,
      link VARCHAR(100)
    );`,

    // 15. Partidos Competicion
    `CREATE TABLE IF NOT EXISTS partidos_competicion (
      id VARCHAR(50) PRIMARY KEY,
      competicion_id VARCHAR(50),
      competicion VARCHAR(100),
      jornada INTEGER,
      fecha DATE,
      hora VARCHAR(20),
      sede VARCHAR(100),
      cancha VARCHAR(100),
      local VARCHAR(100),
      visitante VARCHAR(100),
      categoria VARCHAR(100),
      disciplina VARCHAR(50),
      arbitros VARCHAR(100),
      estado VARCHAR(20),
      resultado VARCHAR(50)
    );`,

    // 16. Objetivos Rendimiento (was performance_goals)
    `CREATE TABLE IF NOT EXISTS objetivos_rendimiento (
      id VARCHAR(50) PRIMARY KEY,
      jugador_id VARCHAR(50) REFERENCES jugadores(id),
      jugador VARCHAR(100),
      avatar TEXT,
      objetivo TEXT,
      progreso INTEGER,
      fecha DATE
    );`,

    // 17. Planes Rendimiento (was performance_plans)
    `CREATE TABLE IF NOT EXISTS planes_rendimiento (
      id VARCHAR(50) PRIMARY KEY,
      tipo VARCHAR(50),
      nombre VARCHAR(100),
      equipo VARCHAR(100),
      inicio DATE,
      fin DATE,
      objetivo TEXT,
      intensidad VARCHAR(20),
      volumen INTEGER,
      capacidades TEXT[],
      color VARCHAR(50)
    );`,

    // 18. Disponibilidad Jugadores (was player_availability)
    `CREATE TABLE IF NOT EXISTS disponibilidad_jugadores (
      id SERIAL PRIMARY KEY,
      jugador_id VARCHAR(50) REFERENCES jugadores(id),
      jugador VARCHAR(100),
      avatar TEXT,
      posicion VARCHAR(20),
      equipo VARCHAR(100),
      estado VARCHAR(50),
      motivo VARCHAR(255),
      dias_estimados INTEGER
    );`,

    // 19. Estadisticas Competicion Jugadores (was player_competition_stats)
    `CREATE TABLE IF NOT EXISTS estadisticas_competicion_jugadores (
      jugador_id VARCHAR(50) PRIMARY KEY REFERENCES jugadores(id),
      pj INTEGER DEFAULT 0,
      titular INTEGER DEFAULT 0,
      minutos INTEGER DEFAULT 0,
      goles INTEGER DEFAULT 0,
      asistencias INTEGER DEFAULT 0,
      amarillas INTEGER DEFAULT 0,
      rojas INTEGER DEFAULT 0,
      rendimiento NUMERIC DEFAULT 0
    );`,

    // 20. Cargas Jugadores (was player_loads)
    `CREATE TABLE IF NOT EXISTS cargas_jugadores (
      id SERIAL PRIMARY KEY,
      jugador_id VARCHAR(50) REFERENCES jugadores(id),
      jugador VARCHAR(100),
      avatar TEXT,
      fecha DATE,
      intensidad INTEGER,
      esfuerzo INTEGER,
      fatiga INTEGER,
      recuperacion INTEGER,
      molestias VARCHAR(255),
      carga_semanal INTEGER
    );`,

    // 21. Objetivos Jugadores (was player_objectives)
    `CREATE TABLE IF NOT EXISTS objetivos_jugadores (
      id VARCHAR(50) PRIMARY KEY,
      jugador_id VARCHAR(50) REFERENCES jugadores(id),
      jugador VARCHAR(100),
      avatar TEXT,
      tipo VARCHAR(50),
      titulo VARCHAR(255),
      fecha_inicio DATE,
      fecha_objetivo DATE,
      progreso INTEGER,
      estado VARCHAR(50),
      observaciones TEXT
    );`,

    // 22. Evaluaciones Rapidas (was quick_evaluations)
    `CREATE TABLE IF NOT EXISTS evaluaciones_rapidas (
      jugador_id VARCHAR(50) PRIMARY KEY REFERENCES jugadores(id),
      jugador VARCHAR(100),
      avatar TEXT,
      actitud INTEGER,
      esfuerzo INTEGER,
      tecnica INTEGER,
      tactica INTEGER,
      disciplina INTEGER,
      liderazgo INTEGER
    );`,

    // 23. Sesiones Recuperacion (was recovery_sessions)
    `CREATE TABLE IF NOT EXISTS sesiones_recuperacion (
      id VARCHAR(50) PRIMARY KEY,
      jugador_id VARCHAR(50) REFERENCES jugadores(id),
      jugador VARCHAR(100),
      fecha DATE,
      tipo VARCHAR(100),
      duracion INTEGER,
      notas TEXT
    );`,

    // 24. Clasificaciones (was standings)
    `CREATE TABLE IF NOT EXISTS clasificaciones (
      id SERIAL PRIMARY KEY,
      competicion_id VARCHAR(50),
      equipo VARCHAR(100),
      pj INTEGER,
      pg INTEGER,
      pe INTEGER,
      pp INTEGER,
      gf INTEGER,
      gc INTEGER,
      dg INTEGER,
      pts INTEGER
    );`,

    // 25. Cargas Entrenamiento (was training_loads)
    `CREATE TABLE IF NOT EXISTS cargas_entrenamiento (
      id VARCHAR(50) PRIMARY KEY,
      jugador_id VARCHAR(50) REFERENCES jugadores(id),
      jugador VARCHAR(100),
      avatar TEXT,
      fecha DATE,
      duracion INTEGER,
      rpe INTEGER,
      carga_interna NUMERIC,
      carga_externa NUMERIC,
      volumen_semanal NUMERIC,
      volumen_mensual NUMERIC,
      intensidad VARCHAR(20),
      tiempo_efectivo NUMERIC,
      monotonia NUMERIC,
      strain NUMERIC
    );`,

    // 26. Plantillas Entrenamiento (was training_templates)
    `CREATE TABLE IF NOT EXISTS plantillas_entrenamiento (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(255),
      duracion INTEGER,
      bloques INTEGER,
      usos INTEGER,
      autor VARCHAR(100),
      compartida BOOLEAN,
      categoria VARCHAR(100)
    );`,

    // 27. Trofeos
    `CREATE TABLE IF NOT EXISTS trofeos (
      id VARCHAR(50) PRIMARY KEY,
      temporada VARCHAR(100),
      competicion VARCHAR(100),
      equipo VARCHAR(100),
      tipo VARCHAR(50)
    );`,

    // 28. Plantillas Whatsapp (was whatsapp_templates)
    `CREATE TABLE IF NOT EXISTS plantillas_whatsapp (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(100),
      categoria VARCHAR(50),
      variables TEXT[],
      uso INTEGER DEFAULT 0
    );`,

    // 29. Mensajes Whatsapp (was whatsapp_messages)
    `CREATE TABLE IF NOT EXISTS mensajes_whatsapp (
      id VARCHAR(50) PRIMARY KEY,
      destinatario VARCHAR(100),
      numero VARCHAR(50),
      plantilla VARCHAR(100),
      estado VARCHAR(20),
      fecha VARCHAR(50)
    );`,

    // 30. Flujos Trabajo (was workflows)
    `CREATE TABLE IF NOT EXISTS flujos_trabajo (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(255),
      trigger VARCHAR(100),
      acciones TEXT[],
      ejecuciones INTEGER DEFAULT 0,
      ultima VARCHAR(50),
      estado VARCHAR(20) DEFAULT 'activo'
    );`,

    // 31. Registros Flujos Trabajo (was workflow_logs)
    `CREATE TABLE IF NOT EXISTS registros_flujos_trabajo (
      id VARCHAR(50) PRIMARY KEY,
      workflow VARCHAR(255),
      destino VARCHAR(100),
      canal VARCHAR(50),
      estado VARCHAR(20),
      fecha VARCHAR(50)
    );`
  ];

  // Create table 'organizaciones' first
  const createOrganizacionesQuery = `
    CREATE TABLE IF NOT EXISTS organizaciones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      correo_admin VARCHAR(255) NOT NULL,
      pais VARCHAR(100),
      moneda VARCHAR(10) DEFAULT 'CRC',
      plan_suscripcion VARCHAR(50) DEFAULT 'basic',
      estado VARCHAR(20) DEFAULT 'activo',
      fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
    );
  `;
  await client.query(createOrganizacionesQuery);
  console.log('Created table organizaciones successfully.');

  const insertDefaultOrgQuery = `
    INSERT INTO organizaciones (id, nombre, slug, correo_admin, pais)
    VALUES ('00000000-0000-0000-0000-000000000000', 'Academia Deportiva Élite', 'elite-default', 'admin@elite.com', 'Costa Rica')
    ON CONFLICT (id) DO NOTHING;
  `;
  await client.query(insertDefaultOrgQuery);
  console.log('Inserted default organization successfully.');

  for (let query of queries) {
    // Dynamically inject the tenant foreign key column before the closing parentheses
    const lastParenIndex = query.lastIndexOf(')');
    if (lastParenIndex !== -1) {
      query = query.substring(0, lastParenIndex) + 
        `, organizacion_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000' REFERENCES organizaciones(id) ON DELETE CASCADE` + 
        query.substring(lastParenIndex);
    }
    try {
      await client.query(query);
      console.log('Executed query successfully.');
    } catch (e: any) {
      console.error('Error executing query:', e.message);
    }
  }

  const tables = [
    'organizaciones',
    'sedes', 'disciplinas', 'temporadas', 'categorias', 'jugadores', 'pagos',
    'sesiones_entrenamiento', 'registros_wellness', 'banco_pruebas_fisicas',
    'resultados_pruebas_fisicas', 'lesiones', 'organizacion', 'movimientos_caja_hoy',
    'notificaciones', 'partidos_competicion', 'objetivos_rendimiento', 'planes_rendimiento',
    'disponibilidad_jugadores', 'estadisticas_competicion_jugadores', 'cargas_jugadores',
    'objetivos_jugadores', 'evaluaciones_rapidas', 'sesiones_recuperacion', 'clasificaciones',
    'cargas_entrenamiento', 'plantillas_entrenamiento', 'trofeos', 'plantillas_whatsapp',
    'mensajes_whatsapp', 'flujos_trabajo', 'registros_flujos_trabajo'
  ];

  console.log('Enabling Row Level Security (RLS) and creating tenant policies on all tables...');
  for (const table of tables) {
    try {
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
      console.log(`Enabled RLS on table: ${table}`);

      // Drop existing policy if any
      await client.query(`DROP POLICY IF EXISTS policy_${table}_aislamiento ON ${table};`);

      // Create tenant isolation policy
      const columnToCheck = table === 'organizaciones' ? 'id' : 'organizacion_id';
      await client.query(`
        CREATE POLICY policy_${table}_aislamiento ON ${table}
        FOR ALL
        USING (
          ${columnToCheck} = ((auth.jwt() -> 'user_metadata' ->> 'organizacion_id')::UUID)
        );
      `);
      console.log(`Created RLS policy for table: ${table}`);
    } catch (e: any) {
      console.error(`Error enabling RLS/policy on table ${table}:`, e.message);
    }
  }

  await client.end();
  console.log('Full migration finished in Spanish.');
}

main().catch(console.error);
