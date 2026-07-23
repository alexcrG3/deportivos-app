# Guía de Próximos Pasos - Athletix OS

¡Felicidades! La academia ya está configurada con su estructura básica: sedes, categorías, equipos, jugadores, entrenadores asignados y branding (logo).

A continuación se detallan las acciones operativas inmediatas que deben realizar tanto el equipo de **Administración** como los **Entrenadores (Coaches)** para comenzar a operar la app en su día a día y alimentar los reportes y dashboards en tiempo real.

---

## 1. Plan de Acción para Entrenadores (Coaches)
Una vez que el entrenador tiene asignado su grupo/equipo, su labor diaria en la aplicación se centra en la **Operación Deportiva** y el **Rendimiento**:

### A. Gestión Diaria y Entrenamientos
1. **Crear Sesiones de Entrenamiento (`/entrenamientos`):**
   - Registrar la planificación diaria: objetivos de la sesión, duración y enfoque táctico.
   - Vincular la sesión con su equipo asignado.
2. **Pasar Asistencia Diaria (`/asistencia`):**
   - Al finalizar cada entrenamiento, marcar quién asistió, quién tuvo falta justificada/injustificada, o retrasos.
   - *Importancia:* Esto alimenta el indicador de **Asistencia Promedio** del Dashboard de Operaciones.
3. **Registro de Cargas de Trabajo y Wellness (`/rendimiento/wellness` y `/rendimiento/cargas`):**
   - Registrar la percepción de esfuerzo (RPE) de los jugadores o datos de bienestar diarios (sueño, fatiga, estrés).

### B. Planificación y Preparación del Partido
1. **Convocatorias y Partidos (`/convocatorias` y `/partidos`):**
   - Crear el partido en el calendario.
   - Generar la lista de jugadores convocados y enviarla al muro/comunicaciones.
2. **Pizarra Táctica y Formación (`/tactica`):**
   - Configurar la alineación inicial, táctica (ej. 4-3-3), roles específicos en el campo y jugadas preparadas.
3. **Análisis Post-Partido (`/tactica/postpartido`):**
   - Registrar el resultado final, minutos jugados por jugador, goles, asistencias y las observaciones de rendimiento individuales.

### C. Evaluaciones y Pruebas Físicas (`/rendimiento/tests` y `/evaluaciones`)
1. **Tests de Rendimiento:**
   - Aplicar y registrar los resultados de las pruebas físicas y antropométricas periódicas establecidas por la dirección académica.

---

## 2. Plan de Acción para Administración (Super Admin / Dirección)
La administración se enfoca en el control operativo, financiero y la comunicación general de la academia:

### A. Operación Financiera (`/finanzas` y `/pagos`)
1. **Configuración de Mensualidades y Cobros:**
   - Registrar los planes de pago y tarifas de los estudiantes/jugadores.
2. **Control de Caja y Pagos Activos (`/caja` y `/pagos`):**
   - Registrar los pagos mensuales recibidos de los padres.
   - Controlar egresos cotidianos de la academia.
   - *Importancia:* Esto limpia y activa el **Dashboard de Finanzas** con flujos reales.

### B. Canales de Comunicación (`/comunicaciones` y `/muro`)
1. **Publicaciones en el Muro General:**
   - Publicar circulares oficiales, avisos de partidos o cambios de horarios.
2. **Campañas de Correo o Mensajes (`/campanas`):**
   - Enviar recordatorios automáticos de cobro o alertas de inactividad médica a los padres y encargados.

### C. Monitoreo Médico y Alertas (`/rendimiento/lesiones` y `/ia/riesgos`)
1. **Seguimiento de Lesiones:**
   - Registrar altas/bajas médicas de jugadores y restricciones específicas de entrenamiento.
2. **Revisión del Módulo IA (`/ia/insights`):**
   - Analizar las alertas predictivas de deserción de alumnos por falta de pagos/asistencia y los riesgos de lesiones calculados por el sistema.

### D. Auditoría y Control de Roles (`/configuracion` y `/auditoria`)
1. **Monitoreo de Acceso de Usuarios:**
   - Verificar que los entrenadores estén usando su cuenta personal y completando sus reportes a tiempo.
