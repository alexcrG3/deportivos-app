# Bitácora de Cambios - DeportivOS

Este archivo registra de manera agrupada todos los cambios, mejoras, correcciones y ajustes aplicados al software en cada sesión de desarrollo. Los registros más nuevos se añaden siempre al principio.


## [22/07/2026 - Planificación de Landing Page SaaS Elite & Inicialización de Servidor Local]

- **Planificación de Landing Page de Alto Rendimiento (SaaS Elite):**
  - **Plan de Implementación:** Creación de la propuesta integral de diseño para la Landing Page de DeportivOS ([implementation_plan.md](file:///C:/Users/AlexG3/.gemini/antigravity/brain/c238d055-e8da-49bd-9e57-f0cac0a4e876/implementation_plan.md)).
  - **Concepto y Estética Visual:** Definición de línea de diseño *High-Performance Dark* con *Glassmorphism*, acentos en Neón Ámbar (`#F59E0B`), Esmeralda (`#10B981`) y tipografía `Outfit`.
  - **Estructura de Secciones Propuesta:**
    - Header & Navigation con accesos a demo y portal.
    - Hero Section con propuesta de valor única, CTAs y mockup flotante del *Wellness Engine*.
    - Barra de Métricas y Social Proof (+10k atletas, 98% cobros a tiempo).
    - Grid interactivo de 4 pilares: *Sports Science*, *Gestión Operativa y Canchas*, *Cobros & Mensualidades*, *Tarjeta Digital del Atleta (Player Card)*.
    - Vista interactiva por roles (Preparador Físico, Director Deportivo, Atleta/Padres).
    - Matriz de Planes y Precios (Starter, Pro Club, Enterprise).
    - Preguntas Frecuentes (FAQ) y Footer con captación de clientes.

- **Servidor de Desarrollo Local:**
  - Diagnóstico y ejecución del servidor Vite en entorno local Windows a través de CMD (`cmd /c npm run dev`).
  - Confirmación de disponibilidad en **`http://localhost:5173/`**.

---

## [22/07/2026 - Módulo Clínico del Fisioterapeuta, Rol RBAC Fisioterapeuta, Matriz de Notificaciones Push y Nómina de Staff]

- **Módulo Clínico del Fisioterapeuta (Flujo de Atención en 3 Pasos):**
  - **Componente Modal (`<AtencionClinicaModal />`):** Interfaz médica en 3 bloques verticales desplegable al presionar el botón de la agenda de citas (`/medico/citas`):
    - *📑 Bloque 1: Diagnóstico e Historial (El Pasado):* Origen de la alerta reportada por el DT desde cancha, antecedentes y contraindicaciones (alergias/cirugías previas) y Slider interactivo de la **Escala de Dolor EVA (1 al 10)** con código de colores.
    - *📋 Bloque 2: Registro del Tratamiento (El Presente):* Checklist de Fisioterapia Avanzada (*Crioterapia*, *Termoterapia*, *Electroterapia TENS/EMS*, *Ultrasonido Terapéutico*, *Terapia Manual*, *Punción Seca*) y cuadro de texto para ejercicios de Readaptación Funcional guiados (bosu, propiocepción, core).
    - *🚀 Bloque 3: Retorno al Juego & Restricciones (El Futuro):* Selector táctil del **Semáforo Coach OS** (🔴 *Baja Total*, 🟡 *Trabajo Diferenciado*, 🟢 *Alta Deportiva Total*) y agendamiento directo de la próxima cita médica.
  - **Sincronización Automática:** Al guardar el registro clínico, la cita cambia su estado a **`COMPLETADA`** y la restricción del semáforo actualiza en tiempo real el estado operativo del jugador en el panel del entrenador (Coach OS), en `/convocatorias` y en la Ficha Médica.
  - **UX en Agenda (`medico.citas.tsx`):** Lógica inteligente de botones de acción: citas en estado `PROGRAMADA` muestran el botón violeta destacado **`🩺 Atender`**, mientras que las citas `COMPLETADA` muestran el botón **`📄 Ver / Editar Ficha`** en verde esmeralda.
  - **Identidad de Deportistas y Categorías Reales:** Corrección de fallbacks estáticos para mostrar nombres completos reales de la academia (*Santiago Jiménez Valverde*, *Ian Gutiérrez Solano*, *Mateo Rojas Calvo*) y sus categorías asignadas (*U13 Asoderive*, *U15 Liga*).

- **Creación e Integración del Rol RBAC de Fisioterapeuta / Médico (`use-role.tsx`):**
  - **Nuevo Rol Oficial:** Registrado el tipo `UserRole = "admin" | "coach" | "padres" | "fisioterapeuta"`.
  - **Aislamiento Contable & Seguridad RBAC:** Configurada la matriz de permisos para dar acceso total al Área Médica (`/medico`), Citas, Lesiones, Wellness y Expedientes, restringiendo totalmente módulos de finanzas, cobros y CRM.
  - **Barra Lateral Adaptativa (`app-sidebar.tsx`):** Creación del conjunto de navegación `FISIO_MODULES` para mostrar únicamente herramientas clínicas a usuarios con el perfil médico.
  - **Simulador Exclusivo para Superadmin (`app-topbar.tsx`):** Adición de la opción **`🩺 Simular Fisioterapeuta`** en el menú desplegable de usuario, protegida para que solo el Superadministrador pueda alternar al modo clínico de prueba.

- **Matriz de Notificaciones Push & Triggers del Sistema (`notification-store.ts`):**
  - **Motor Dispatcher (`NotificationDispatcherEngine`):** Implementación de los 7 disparadores automáticos del sistema (citaciones de partidos, recordatorios a padres, bajas médicas, cierres de cobro, etc.) con formato JSON Payload y Deep Links de navegación instantánea.
  - **Centro de Notificaciones (`NotificationCenterPopover.tsx`):** Integración de la campana interactiva con contador de no leídos en la barra superior, simulador de push en tiempo real y filtrado por rol.
  - **Consola y Configuración (`configuracion.tsx`, `notificaciones.tsx`):** Adición de la pestaña **`🔔 Notificaciones Push & Triggers`** con switches ON/OFF y la **Consola Payload JSON** para desarrolladores backend.

- **Centralización de Nómina de Entrenadores en Finanzas (`/finanzas`):**
  - Adición de la pestaña **`💵 Nómina de Staff (Entrenadores)`** en el módulo financiero con soporte para lectura de parámetros de URL (`/finanzas?tab=nomina`) y enlace directo en el menú lateral.

- **Persistencia en Base de Datos Supabase:**
  - Vinculación del almacenamiento y actualización de turnos médicos a la tabla Supabase `citas_fisioterapia` con persistencia en la nube (`upsert`).

---


## [22/07/2026 - Módulo de Cancha en Vivo para Entrenadores, Flujo de Wellness/Tests y Gestor Dinámico de Evaluaciones]

- **Modo Cancha en Vivo para Entrenadores (`/entrenamientos`):**
  - **Paso 1 (Asistencia + Wellness Unificados):** Pantalla oscura táctil diseñada para uso en teléfono móvil en la cancha. Botones gigantes de 44px (`P`, `T`, `A`, `J`) para pasar lista por alumno en menos de 1 minuto.
  - **Indicadores Wellness en Cancha:** Integración automática de estados **🟢 Óptimo**, **🟡 Fatiga Ligera** y **🔴 Dolor/Malestar** leyendo encuestas enviadas por padres desde casa.
  - **Acciones Rápidas en Cancha:** Incorporación del modal táctil **`❤️ Marcación Rápida de Wellness`** (para que el entrenador evalúe en 3 segundos si el padre no envió la encuesta) y el modal **`⏱️ Registrar Prueba Física`** (con tarjeta del jugador, selector de test, marca e ingreso de notas).
  - **Carga Real de Plantillas por Equipo:** Conexión dinámica con `RendimientoStore.getJugadores()` para mostrar los 18 alumnos reales del equipo (ej. *Asoderive U13*) en lugar de listas de prueba.
  - **Paso 2 (Trabajo de Cancha & Cronómetro):** Reloj de sesión en vivo, visualizador 2D de conos/pizarra de ejercicios y pestañas organizadas (*Calentamiento*, *Trabajo Específico*, *Charla Técnica*).
  - **Paso 3 (Cierre de Sesión, Notas por Voz e Incidencias Médicas):** Dictado por voz mediante Web Speech API (`Voice-to-Text`) y switch de registro de lesiones para notificación directa a Administración y seguros.
- **Gestor Dinámico de Catálogo de Pruebas Físicas (`/rendimiento/tests`):**
  - Creación del **`⚙️ Gestor de Catálogo de Pruebas Físicas`** que permite a la administración agregar o eliminar cualquier tipo de prueba física (ej. *Sprint 30m*, *Yo-Yo Test*, *Course Navette*, *Cooper Test*, *Salto Vertical CMJ*, *Agilidad T-Test*, etc.).
  - **Unificación Total:** Sincronización dinámica de este catálogo de pruebas en todos los módulos desplegables de la aplicación (`/equipos`, `/entrenamientos`, `/rendimiento/tests` y `/jugadores/$id`).
- **Persistencia Directa en Supabase DB:**
  - Creación de migraciones ejecutadas mediante Node en Supabase PostgreSQL para las tablas `sesiones_entrenamiento`, `asistencia_registros`, `incidencias_lesiones`, `wellness` y `resultados_pruebas`. Eliminación total de almacenamiento volátil (`localStorage`) para datos de sesión.
- **Restructuración de Sidebar y Permisos de Menú (`app-sidebar.tsx`):**
  - Creación de la categoría **`📦 Logística & Indumentaria`** (agrupando *Control de Inventario* y *Tienda de Uniformes*).
  - Restricción de permisos: Padres y Entrenadores únicamente ven el acceso a *Tienda de Uniformes* (quedando *Inventario* protegido exclusivamente para Administración).

---

### 📌 PENDIENTES PRIORITARIOS PARA MAÑANA (TAREAS PROGRAMADAS)

- [ ] **Módulo de Medidas / Antropometría de Jugadores:**
  - Desarrollar la sección de registro y seguimiento antropométrico (peso, talla/estatura, porcentaje de grasa, pliegues cutáneos, IMC y curvas de crecimiento físico por categoría).
- [ ] **Módulo de Carnets Digitales Oficiales:**
  - **Carnets de Jugadores:** Carnet digital descargable/imprimible con foto, código QR de verificación, categoría, sede y datos de emergencia.
  - **Carnets de Personal Administrativo:** Carnet de acreditación con rol de gestión y código de acceso al centro de mando.
  - **Carnets de Entrenadores:** Carnet oficial de cuerpo técnico con licencia deportiva, categoría asignada y código QR de validación en cancha.

---

## [21/07/2026 - Módulo de Tienda de Uniformes, Persistencia Supabase e Inventario por Tallas]

- **Módulo de Tienda en Línea y Confección de Uniformes (`/tienda`):**
  - Desarrollo del módulo e interfaz premium [tienda.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/tienda.tsx) con soporte para venta de indumentaria de competencia, camisetas de entreno, abrigos, mochilas y equipamiento.
  - **Inventario Dinámico por Talla:** Control independiente de existencias por cada talla (infantiles `6, 8, 10, 12, 14, 16` y adultos `S, M, L, XL`). Deshabilitación automática de tallas agotadas y alertas de stock en tiempo real.
  - **Doble Rol (Padres & Administración):**
    - *Padres:* Catálogo interactivo con tarjetas glassmorphic, filtros por categoría, selector de talla/color, carrito de compras deslizable, simulación de pago (cargo a próxima mensualidad, tarjeta o transferencia) y pestaña de seguimiento del estado del pedido (*En preparación*, *Listo para retirar*, *Entregado*).
    - *Administración:* Dashboard de ventas recaudadas, control de despacho de pedidos recibidos y CRUD de catálogo para crear o modificar indumentaria y ajustar existencias por talla.
- **Sincronización Híbrida con Supabase & LocalStorage:**
  - Vinculación del módulo con la base de datos mediante las tablas `tienda_productos` y `tienda_pedidos` en Supabase con mecanismo de respaldo en `RendimientoStore`.
  - Script SQL de estructura de base de datos generado en [schema_tienda_supabase.sql](file:///d:/AntigravitDev/DeportivOS%20OS/scripts/schema_tienda_supabase.sql).

---

## [21/07/2026 - Módulo de Inventario Deportivo, Gestión de WhatsApp y Mejoras del Dashboard]

- **Módulo Completo de Inventario Deportivo (`/inventario`):**
  - Se desarrolló e integró el módulo de gestión de inventario para materiales y equipamiento deportivo ([inventario.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/inventario.tsx)).
  - **5 Secciones de Gestión:** Dashboard con métricas y gráficas Recharts de stock por categoría, Control de Artículos con búsqueda y filtros por estado semafórico (🟢 Disponible / 🟡 Stock Bajo / 🔴 Crítico / ⚫ Vencido / 🔵 Prestado), Sistema de Préstamos a Staff con fecha límite y control de vencimientos, Categorización editable y Kardex Inmutable exportable.
  - **CRUD Completo de Artículos:** Botones de acción siempre visibles para ver detalle, registrar préstamos, editar campos y eliminar ítems (con protección automática ante préstamos activos).
  - **Vincular Entrenadores Reales:** El modal de préstamos obtiene automáticamente la lista de coaches activos en la academia desde `RendimientoStore`, auto-completando su especialidad/cargo.
  - **Nuevos Materiales Precargados:** Inclusión de balones, mallas, conos, cronómetros, botiquines y la nueva categoría de **Chalecos** (tácticos, de entrenamiento y tallas infantiles).
- **Alertas de Inventario en el Dashboard (`/dashboard`):**
  - Se agregó la tarjeta de atención prioritaria **"Préstamos vencidos"** en la sección *Hoy* del Centro de Operaciones con enlace directo al inventario.
  - Se corrigió el contraste tipográfico de los badges de la tarjeta **DeportivOS AI Copilot** adaptándolos dinámicamente a temas claro y oscuro (`slate-900` / `slate-100`).
- **Integración de Gestión y Pago de Servicio de WhatsApp (`/configuracion`):**
  - Creación de la pestaña **`💬 Servicio WhatsApp`** en el módulo de configuración con la pasarela de recarga de ApiKey del club.
  - Generación del documento comparativo técnico y de rentabilidad ([COMPARATIVA_WHATSAPP_KAPSO_TEXTMEBOT.md](file:///d:/AntigravitDev/DeportivOS%20OS/COMPARATIVA_WHATSAPP_KAPSO_TEXTMEBOT.md)) evaluando Kapso vs TextMeBot y esquemas de reventa de paquetes para la academia.

---

## [20/07/2026 - Sesión de Tarde - Filtro por Equipos en Alto Rendimiento, Conexión a Base de Datos y Correcciones de Compilación]

- **Filtro de Equipos Completo en Alto Rendimiento:**
  - Se implementó el menú desplegable (dropdown) selector de equipo en todos los módulos de Alto Rendimiento: **Control de Cargas** ([rendimiento.cargas.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/rendimiento.cargas.tsx)), **Sports Science** ([rendimiento.sports-science.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/rendimiento.sports-science.tsx)), **Tests Físicos** ([rendimiento.tests.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/rendimiento.tests.tsx)) y **Lesiones** ([rendimiento.lesiones.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/rendimiento.lesiones.tsx)).
  - Cada selector cuenta con lógica fuzzy-matching para alinear las categorías de los jugadores con el nombre del equipo y tarjetas informativas de estado vacío personalizadas.
- **Conexión de Tests Físicos y Lesiones a Supabase:**
  - Se vinculó el listado de **Tests Físicos** para leer e inyectar dinámicamente los datos reales de la tabla de Supabase `resultados_pruebas_fisicas` de forma robusta.
  - Se habilitó la persistencia y sincronización a la base de datos de la nube de Supabase para las **Lesiones** deportivas en el despachador de escrituras del store.
- **Correcciones Críticas de Compilación y Limpieza de Zombis:**
  - Se corrigieron errores de sintaxis JSX (tags desbalanceados y fragmentos React omitidos) que bloqueaban el empaquetador de TanStack Router y causaban pantallas en blanco.
  - Se eliminó un proceso zombi en el puerto `5173` para restaurar el entorno de desarrollo local original del club.
  - Se inyectó la propiedad faltante `equipo` en el retorno de datos del Sports Science del store para evitar filtros vacíos.
- **Orden Alfabético por Primer Nombre:**
  - Se actualizó el método de obtención de jugadores en el store para ordenar las listas alfabéticamente por su primer nombre (`nombre`) con salvaguardas contra campos vacíos.
- **Persistencia de Banner de Migración:**
  - Implementación de la clave `deportivos_cloud_migrated` para evitar que el banner de migración se muestre en bucles infinitos en el Dashboard tras una sincronización exitosa.

---


## [20/07/2026 - Sesión de Noche - Unificación de Roles en Competiciones, Sincronización CRM con Supabase y Soporte de Simulador de Coach]

- **Competiciones Globales y Restricciones a Padres:**
  - Se modificaron las consultas en [temporadas.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/temporadas.tsx) y [partidos.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/partidos.tsx) para que tanto directores, entrenadores y padres puedan consultar todas las temporadas y partidos de la academia de forma global.
  - Se añadieron verificaciones basadas en el hook de roles para ocultar e impedir las acciones de creación (`+ Nuevo partido`, `+ Nueva temporada`), duplicado, edición y eliminación de datos a los usuarios que accedan bajo el rol de `padres`, asegurando un visor de solo lectura para ellos.
- **CRM Deportivo Conectado a Supabase:**
  - Migración del módulo [crm.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/crm.tsx) y la gestión de [prospectos.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/prospectos.tsx) para recuperar y gestionar los prospectos directamente desde la tabla `crm_leads` en Supabase en lugar de datos estáticos en memoria.
  - Sembrado de 10 atletas y leads de prueba reales en Supabase vinculando de forma consistente sus actividades de captación, campañas y pruebas.
- **Visualización Cruzada de Entrenamientos (Edgar Calderón y Coaches):**
  - Vinculación en la base de datos de las 8 sesiones de entrenamiento del equipo **U13** en Supabase, registrando de forma persistente a **Edgar Calderón** (`t1`) como su entrenador asignado para solucionar listados vacíos.
  - Vinculación del resto de entrenamientos en la base de datos a sus respectivos entrenadores asignados (**Tiffany Eduarte**, **Carlos Araya** y **Eduardo Villa**).
  - Actualización del buscador y visor de [entrenamientos.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/entrenamientos.tsx) para realizar búsquedas mediante un operador híbrido `or` (`entrenador_id` o `entrenador` por texto libre).
- **Persistencia de Roles del Simulador Administrativo:**
  - Corrección de la lógica de recuperación de rol en [use-role.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/hooks/use-role.tsx) para dar prioridad absoluta al rol guardado en `localStorage` (simulación), permitiendo alternar y probar vistas administrativas de entrenadores o padres de forma persistente en refrescos de página.

---

## [19/07/2026 - Sesión de Tarde (II) - Ajustes de Cumpleaños, Autenticación de Superadmin y Diseño de Login]

- **Fecha y Hora en Tarjetas de Cumpleaños:** Se añadió un badge dinámico con fondo sutil en la tarjeta de felicitaciones del muro para mostrar la fecha y hora de la felicitación en tiempo real (ej: `19 jul · 16:00`), asimilándose al formato visual de cualquier post convencional.
- **Flujo de Logout e Impersonación del Superadmin:** Se rediseñó el botón de "Cerrar sesión" en el encabezado global para comprobar de forma robusta la identidad de superusuario de Alex. Si es superadmin o está simulando el contexto de cualquier academia desde el Centro de Mando, al cerrar sesión se limpia la simulación y se le devuelve directamente al **Centro de Mando** (`/saas-admin`), en lugar de redirigirlo a la pantalla de login.
- **Email de Usuario en Menú de Perfil:** El dropdown de "Mi Cuenta" en la barra superior (`app-topbar.tsx`) ahora muestra dinámicamente el correo electrónico del usuario activo (ej: `alex@mail.com`) debajo de su nombre y rol respectivo.
- **Rediseño Estético del Login:**
  - Se eliminaron las referencias al término "SaaS", renombrándolo como "Plataforma Deportiva 2026".
  - Se reemplazó la tarjeta estadística de cobros mensuales ("₡6.2M Ingresos/mes") por una métrica más atractiva y motivacional para el público general: **"12 Equipos"**.

---

## [19/07/2026 - Sesión de Tarde - Biblioteca Táctica Premium y Ejemplos Reales de Fútbol]

- **Unificación de 8 Categorías de la Biblioteca:** Se agregaron 8 ejemplos reales de fútbol (uno para cada categoría de la biblioteca general).
- **Sembrado de Ejemplos en la Biblioteca de Jugadas (Playbook):** Se agregaron 8 jugadas reales de fútbol de pizarra estructuradas (una para cada categoría del playbook: *Ataque, Defensa, Balón Parado, Contraataque, Transición, Presión, Posesión, Recuperación*), resolviendo el vacío de datos en estas secciones del Playbook.
- **Asociación Dinámica de Autores:** Se corrigió el problema de autores ficticios/hardcodeados ("Carlos Méndez", "Andrés Pérez", "Ricardo Mora"). Ahora, los recursos y plantillas resuelven y muestran dinámicamente los nombres de los entrenadores y profesores reales existentes en la base de datos de tu academia (y usa "Administrador" como fallback).
- **Auto-sembrado inteligente:** Modificado el store para que auto-cargue y siembre estos 8 ejemplos si la caché local se encuentra desactualizada.

### 🎨 Diseño y Rediseño Visual Premium (Biblioteca y Estrategias)
- **Efectos Glassmorphism y Soporte de Temas:** Se implementaron filtros y barras de búsqueda con fondo adaptativo para garantizar un contraste perfecto tanto en modo claro (Light Mode) como en modo oscuro (Dark Mode).
- **Corrección de Contraste en Estrategias de Partido:** Se rediseñó la paleta de colores de la vista de planes estratégicos (`tactica.estrategias.tsx`). Se reemplazaron los fondos grises planos y textos opacos de baja visibilidad por elementos de alta legibilidad, aumentando el contraste en los resúmenes de planes, objetivos clave, indicaciones del cuerpo técnico y tarjetas laterales de planes activos.
- **Tarjetas y Efectos de Clic Tácticos:** Se rediseñó la rejilla de tarjetas con un borde superior degradado, efectos de elevación tridimensional al colocar el cursor y transiciones de color.
- **Acciones y Botones Inteligentes:** Botones interactivos adaptados a cada tipo de recurso (ej. "Reproducir Video", "Ver Documento PDF", etc.) para mejorar la experiencia de usuario y el valor comercial de la aplicación.

---

## [18/07/2026 - Sesión de Noche - Optimización Extrema de Pizarra Táctica y Correcciones de Fluidez]

### ⚡ Rendimiento y Fluidez en Pizarra Táctica (SVG)
- **Eliminación del Lag (Cámara Lenta):** Se implementó un *throttling* inteligente (aislamiento de estado) en `TacticalBoard`. Al arrastrar jugadores o dibujar, la sincronización masiva con el componente padre se pausa. Esto evita que la aplicación principal intente re-renderizarse 60 veces por segundo, garantizando 60 FPS al mover elementos.
- **Sincronización en "Pointer Up":** Los datos de posición de las fichas se sincronizan con el estado global únicamente cuando el usuario suelta el clic, reduciendo drásticamente el costo computacional.

### 🐛 Comportamientos Inesperados Resueltos
- **Bucle Infinito (Crasheo de Pantalla Blanca):** Corregido un error crítico provocado por un bucle infinito en React al generar referencias nuevas de formaciones. Se estabilizó la memoria de `formations` con `useMemo` para evitar re-montajes cíclicos del componente.
- **Desaparición de Jugadores al Clic:** Eliminada la variable `key={boardKey}` del render. Esto detuvo el reinicio forzado del componente que causaba la activación persistente del modo "Borrador" de manera invisible, lo cual eliminaba fichas al intentar interactuar con ellas.

### 🔄 Funcionalidad de Curvatura de Flechas
- **Invertir Curva (Menú Contextual):** Se restringió el botón de `🔄 Invertir Curva` para que solo aparezca si la flecha seleccionada es realmente curva (o cuando se cambia a estilo Curva). Si la flecha es recta, el botón se oculta para no confundir al usuario.

### ⚡ Optimización de Carga Inicial (Hydration Flash)
- **Bloqueo de Dashboard Vacío:** Se corrigió el molesto parpadeo que mostraba el Asistente de Configuración (0 jugadores) por un instante antes de sincronizar con Supabase. Ahora la vista del Dashboard espera a que la descarga e hidratación de datos esté completada al 100% para mostrar el panel ya poblado de forma directa.

---
## [18/07/2026 - Sesión de Tarde - Eliminación de Datos Hardcodeados y Filtrado por Categoría en Módulos de Rendimiento]

### 🔧 Pizarra Táctica — Corrección de Modo Partido y Entrenamiento
- **Dos modos reales de pizarra (`boardMode`):** Se separó el flujo en dos modos claros:
  - **Modo Partido:** Carga los jugadores **convocados** del partido seleccionado. Si no hay convocatoria, hace fallback al plantel completo de la categoría.
  - **Modo Entrenamiento:** Muestra el plantel completo del equipo asignado al coach.
- **Filtro por Coach (`useRole`):** Los dropdowns solo muestran los partidos y equipos asignados al entrenador conectado.
- **Bloqueo de Disciplina Única:** Si la academia solo tiene una disciplina registrada, el selector de deporte se oculta y la cancha se bloquea automáticamente.

### 👥 Filtrado por Categoría en Alto Rendimiento (Dashboard, Cargas, Sports Science)
- **Coach ve solo su equipo:** Se integró `useRole` en Dashboard de Rendimiento, Control de Cargas y Sports Science. Gráficos, listas, alertas y estadísticas se filtran a la(s) categoría(s) del entrenador conectado (ej. solo U13).
- **Nombres Completos:** Eliminados todos los cortes de nombres (`.split(" ")[0]`). Todos los listados y gráficas muestran el **nombre completo con apellidos**.

### 🩺 Lesiones — Cálculo Dinámico y Limpieza de Datos Falsos
- **RTP Promedio Dinámico:** Ya no muestra un 65% estático. Calcula el promedio real de `progresoRtp` sobre lesiones activas. Sin lesionados → muestra **100% — Plantel disponible**.
- **Ocultación de Adjuntos Falsos:** Los documentos de ejemplo (Radiografía_Tobillo.png, etc.) se ocultan cuando no hay lesiones activas registradas.
- **Formulario Conectado:** El selector de jugador para registrar lesiones carga los atletas reales del plantel de la categoría del entrenador.

### 🌿 Wellness — Avatares y Filtros Corregidos
- **Avatares Reparados (404 → OK):** Corregido el bug de imágenes rotas en el Semáforo de Bienestar. Antes se usaba el UUID como número de pravatar (`?img=UUID`), fallando siempre. Ahora busca la foto del jugador en la DB con fallback seguro a `?u=UUID`.
- **Filtrado por Categoría:** Gráfico de evolución, alertas y lista del semáforo filtrados exclusivamente a la categoría del entrenador conectado.

### 🏃 Tests Físicos — Conexión con Banco de Pruebas y Datos Reales
- **Selector de Jugador Corregido (definitivo):** El formulario de registro ya no muestra nombres hardcodeados ("Sofía Rodríguez", "Valentina Soto", etc.). Carga los jugadores reales del plantel U13.
- **Integración con Banco de Pruebas:** El dropdown de "Nombre de Test" sincronizado con el **Banco de Pruebas Físicas** del club. Los tests creados ahí aparecen automáticamente en el formulario.
- **Estado Vacío del Gráfico:** Corregido el cuadro gris en blanco. Si no hay tests, muestra: *"Sin evaluaciones físicas registradas en este equipo"*.
- **Filtrado por Categoría:** El historial de evaluaciones solo muestra tests de atletas de la categoría asignada.

### ✅ Dashboard de Rendimiento — Corrección de Pantalla en Blanco
- **ReferenceError corregido:** Se detectó y solucionó un `ReferenceError: performancePlans is not defined` que causaba la pantalla de error blanca. Se restableció la importación de `performancePlans` y `performanceGoals` desde `mock-data.ts`.

---

## 🔜 PRÓXIMOS PASOS / PENDIENTES (Para mañana)

### 🧹 Limpieza y Re-sembrado de la Base de Datos
- **Depuración de Tablas:** Limpiar y borrar todos los datos acumulados y de prueba de las tablas de la base de datos para iniciar con un esquema depurado.
- **Conservación Selectiva:** No borrar los datos de **Jugadores** (atletas) ni de **Entrenadores** (coaches). Se mantendrán intactos.
- **Sembrado de Datos Reales:** Inyectar los datos limpios e históricos de rendimiento y wellness correspondientes.

### 📊 Reportes Financieros de Morosidad
- **Por Equipos:** Visualización del estado de cobros y morosidad segmentado por categorías y equipos para que los coordinadores y entrenadores controlen sus planteles.
- **Morosidad Total:** Reporte consolidated financiero con el monto de saldos vencidos total y la lista unificada de todos los atletas morosos de la academia.

### 📥 Carga Masiva (Excel) e Integración de Academias
- **Plantilla de Carga (Excel):** Formato estándar en `.xlsx` para cargar masivamente a todos los jugadores y entrenadores de forma ágil y masiva.
- **Verificación de Academias Existentes:** Definición de flujo y herramientas de migración cuando una academia ya cuenta con toda su información registrada en otros formatos para integrarla de forma limpia.

---

## [17/07/2026 - Sesión de Noche - Optimización de Base de Datos, Carga por Lotes, Persistencia de Mensualidades y Eliminación Remota]

### ⚡ Optimización de Rendimiento y Redirección
- **Unificación de Consultas:** Implementación de `syncPromise` en `RendimientoStore` para centralizar llamadas concurrentes a Supabase y evitar colapsar la conexión con múltiples peticiones de red idénticas.
- **Hydration Fix:** Evaluación diferida de `isSyncing` del lado del cliente en `_app.tsx`, solucionando el error 500 de Hydration (SSR).
- **Redirección de Superadmin:** Configuración del logout condicional en el Topbar para redireccionar a los Superadmins (`alex@mail.com`) al Centro de Mando (`/saas-admin`) y a los demás usuarios a `/login`.

### 📦 Carga Masiva por Lotes (Excel) y Unificación de Escrituras (Bulk Upsert)
- **Inserción Loteada:** Creación del método `addJugadoresBatch()` para procesar todos los atletas cargados del Excel en memoria y disparar una única solicitud de inserción a Supabase.
- **Escrituras Masivas (Upsert Batch):** Reemplazo de bucles iterativos asíncronos (`Promise.all` mapeando solicitudes individuales) por unificaciones bulk (`upsert(batch)`) en el guardado de jugadores, pagos, categorías, sedes, entrenadores, equipos y organizaciones.

### 🗄️ Ampliado de Límites de Columnas (PostgreSQL SQL Directo)
- **Incremento de Capacidad en Columnas:** Ejecución de una migración en caliente sobre Supabase (`ALTER TABLE`) para extender la capacidad de la columna `posicion` de `varchar(20)` a `varchar(100)` y `genero` a `varchar(50)`. Esto eliminó el error de longitud máxima al importar jugadores con posiciones largas como *"Mediocampista Central"*.

### 💰 Normalización de Tarifas e Integración de Mensualidades
- **Consistencia de Claves en Categorías:** Ajuste del getter `getCategorias()` para normalizar y respetar `costo_mensual` de Supabase sobre la interfaz de usuario, impidiendo que el precio de ₡25,000 se revirtiera a ₡30,000.
- **Ajuste Retroactivo de Saldos:** Actualización en bloque sobre la base de datos de los saldos de los 81 jugadores registrados en U9, U11, U13 y U15 para alinearlos a la nueva tarifa de ₡25,000.

### 🗑️ Sincronización Remota de Borrados Físicos en la Nube
- **CRUD Limpio:** Conexión de los métodos de eliminación (`clearJugadores`, `deleteJugador`, `deleteCategoria`, `deleteEntrenador` y `deleteEquipo`) a órdenes de borrado físico en Supabase. Ahora los duplicados y limpiezas de plantel desaparecen permanentemente.
- **Alertas Emergentes (Sonner Toasts):** Incorporación de avisos visuales interactivos en la esquina superior para confirmar sincronizaciones exitosas y advertir de fallas de red.

---

## [16/07/2026 - Sesión de Noche (II) - Sincronización Supabase, RLS, Gestión de Avatares y Correcciones de Categorías]

### 🖼️ Carga de Fotos de Perfil (Avatar) para Usuarios Administrativos
- **Ampliación del Modelo:** Se añadió la propiedad opcional `avatar` a la definición del tipo `SistemaUsuario`.
- **Uploader Base64 en Formularios:** Se incorporaron campos de tipo archivo (`input file`) en los modales de **Crear Nuevo Usuario** y **Editar Usuario** en la pestaña de administración (`configuracion.tsx`). Al subir una foto, esta se codifica en Base64 para guardarla directamente en el registro.
- **Renderización Dinámica:** Se actualizó la tabla de usuarios en configuración y el menú de usuario de la barra superior (`app-topbar.tsx`) para renderizar de manera elegante la foto cargada del usuario, manteniendo las iniciales clásicas con degradado como respaldo.

### 🛡️ Activación de Seguridad (RLS) y Políticas para Entrenadores y Equipos
- **RLS Activado en Catálogo:** Se actualizaron y ejecutaron los scripts de base de datos para habilitar Row Level Security (`ALTER TABLE ENABLE RLS`) en las tablas `entrenadores` y `equipos`.
- **Políticas de Acceso Público:** Se crearon políticas de acceso `Allow all` para el rol `public` en ambas tablas, permitiendo que la aplicación realice lecturas y escrituras de forma segura y autorizada sin colapsar el acceso anónimo.

### 🔄 Sincronización en Segundo Plano de Coaches y Equipos
- **Conexión Supabase:** Se añadieron las peticiones para sincronizar las tablas `entrenadores` y `equipos` en la rutina centralizada `syncFromSupabase()`.
- **Consistencia de Contadores:** Los contadores de asignaciones de equipos y categorías en la lista de entrenadores ahora se recalculan de forma limpia y automática con datos de Supabase en tiempo real, corrigiendo discrepancias de caché local desactualizada.

### 🐛 Corrección de Crash al Cargar Entrenadores (TypeError de Disciplinas)
- **Adaptador de Datos:** Se identificó que la base de datos guarda `disciplina` (singular string) y el frontend renderizaba mapeando `disciplinas` (plural array). Se implementó un mapeador dinámico en `syncFromSupabase()` para inyectar `disciplinas: [disciplina]` y una lógica tolerante defensiva en [entrenadores.index.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/entrenadores.index.tsx).

### 📊 Corrección de Pérdida de Datos en Categorías y Ocupación `44/0`
- **Mapeo de Campos Faltantes:** Se corrigió el método `set()` en `rendimiento-store.ts` para que al guardar categorías en Supabase incluya campos previamente omitidos como `capacidad`, `edad_min`, `edad_max`, `genero` y `sede_id`. Esto solucionó la lectura de capacidad en `0` que mostraba ocupaciones erróneas.
- **Persistencia de Mensualidad (`costo_mensual`):** Se realizó una migración en PostgreSQL para añadir la columna faltante `costo_mensual` a la tabla `categorias`. Ahora cambios de cuotas (ej. de 30000 a 25000) persisten correctamente tras recargas de pantalla.

---

## [16/07/2026 - Sesión de Noche - Módulo de Pagos: Cobro Masivo, Reportes Excel y Correcciones de Historial]

### 💳 Cobro Masivo con Selección Múltiple de Jugadores
- **Modal Independiente "Cobro Masivo":** Se creó un modal propio (separado del Pago Individual) con una lista scrollable de todos los jugadores con saldo pendiente, cada uno con su checkbox interactivo.
- **Seleccionar Todos:** Botón en el encabezado que marca/desmarca todos los jugadores de la lista en un solo clic.
- **Total en Tiempo Real:** El modal muestra un acumulador dinámico del monto total seleccionado mientras el usuario escoge jugadores.
- **Método y Referencia Compartidos:** Un único campo de método de pago y referencia se aplica a todos los pagos generados en lote.

### 📊 Estadísticas de Pago por Categoría
- **Contadores en Mensualidades:** La sección de Mensualidades por Categoría ahora muestra en cada fila cuántos jugadores **pagaron**, cuántos están **pendientes** y cuántos están **en mora**.
- **Barra de Progreso Visual:** Indicador visual verde proporcional al porcentaje de jugadores al día en cada categoría.
- **Monto Recaudado:** Debajo del costo mensual se muestra el monto ya recaudado en esa categoría.

### 📥 Exportación a Excel con Encabezado Corporativo
- **Formato XLSX Real:** Se migró la exportación de CSV a archivos `.xlsx` usando SheetJS, con estructura binaria compatible con Microsoft Excel.
- **Encabezado Elegante:** Cada archivo exportado incluye el nombre de la academia en mayúsculas, título del reporte, fecha y hora de emisión, filtro aplicado y un resumen de estado financiero (total alumnos, al día, pendientes, en mora, total deuda).
- **Exportar Total o por Categoría:** El modal de exportación permite elegir entre un reporte consolidado general o uno filtrado por categoría específica.
- **Anchos de Columna Automáticos:** Las columnas se auto-ajustan al contenido para evitar que los datos aparezcan cortados (`###`) en Excel.

### 🔙 Modal de Confirmación para Revertir Pagos
- **Eliminado el `confirm()` nativo del browser:** Ya no aparece el feo popup del sistema operativo al revertir un pago.
- **Modal propio con detalle:** Se implementó un Dialog modal que muestra el nombre del jugador y el monto formateado, con botones **Cancelar** y **Sí, revertir pago** (en rojo destructivo).

### 🔍 Búsqueda por Categoría en Historial de Pagos
- **Búsqueda funcional:** Se corrigió la búsqueda en el historial para que filtre correctamente por nombre de jugador Y por categoría (ej. escribir `U13` muestra solo pagos de esa categoría).
- **Columna Categoría en Historial:** Todos los registros del historial ahora muestran correctamente la categoría del jugador, incluidos los pagos históricos.
- **Migración automática de datos legados:** Al cargar la página de Pagos, se ejecuta una migración que corrige en `localStorage` todos los pagos anteriores que tenían `"Sin categoría"` persistido, asignándoles la categoría correcta del jugador mediante búsqueda por ID o nombre normalizado (sin tildes).
- **Enriquecimiento en el Store:** `getPagos()` en `rendimiento-store.ts` ahora enriquece automáticamente cada pago al leerlo, inyectando la categoría del jugador si el registro no la trae o trae `"Sin categoría"`.

---

## [16/07/2026 - Sesión de Tarde - Importación Masiva Excel y Estabilización de Datos]


### 📥 Importación Masiva desde Excel (SheetJS)
- **Plantillas Oficiales:** Se agregaron botones de descarga de plantillas Excel pre-formateadas en las secciones de **Entrenadores** y **Jugadores** (descarga local instantánea de archivos `.xlsx`).
- **Carga de Datos:** Implementado el parseo interactivo con SheetJS (`xlsx`) para cargar plantillas diligenciadas por el usuario.
- **Validación:** Se creó un modal de resumen de importación que detalla la cantidad de registros creados con éxito y la lista de filas con advertencias o campos obligatorios faltantes.

### 🛡️ Protección Absoluta contra Pérdida de Datos
- **Remoción del Cache Buster:** Se eliminó por completo la lógica de *cache-busting* global que borraba la base de datos `localStorage` tras cambios de versión (`DATA_VERSION`). Las academias, equipos, coaches y atletas creados por el usuario ya no se borrarán bajo ninguna actualización de versión.
- **Evitación de Hydration Flash (SSR):** Se implementó una rutina defensiva en los getters dinámicos de `RendimientoStore`. Al detectar que se ejecutan en el servidor (`!isBrowser()`), retornan arreglos vacíos `[]` de inmediato, eliminando la aparición fugaz (flash) de los equipos demo al recargar en una academia limpia.

### 🧩 Correcciones y Flexibilidad en Formularios
- **Categorías Dinámicas en Rosters:** Se reemplazaron las listas quemadas en duro (`Sub-7 Fútbol`, etc.) de los formularios de atletas en `jugadores.index.tsx` y `jugadores.$id.tsx` por listas alimentadas dinámicamente desde el store con las categorías reales de la academia.
- **Asignación sin Bloqueos (Opcionalidad):**
  - Se hizo opcional el campo *"Entrenador Responsable"* en la creación de Categorías para permitir crearlas incluso si no existen entrenadores en la academia limpia.
  - Se hizo opcional el campo *"Categoría Deportiva"* en la creación de Equipos, proveyendo un input de texto libre y aviso visual si no hay categorías creadas todavía.
- **Orden del Wizard:** Se ajustó la secuencia del asistente de configuración en el dashboard: **1. Logo ➔ 2. Coach ➔ 3. Equipo ➔ 4. Atleta** para habilitar la pre-existencia de coaches antes de asociarlos a un equipo.

## [14/07/2026 - Sesión de Tarde - Sustitución Táctica Inteligente y Flechas de Curvatura Ajustable]

### ⚽ Sustitución Táctica Inteligente por Rol y Formación
- **Mapeo de Posiciones (`POSITION_TO_SLOTS`):** Se definió una relación entre las posiciones principales de los jugadores (ej. `POR`, `DFC`, `DFI`, `BAS`, etc.) y los identificadores de slot tácticos del tablero (`GK`, `CB1`, `LB`, `PG`, etc.).
- **Sustitución en addPlayerToBoard:** Se reconfiguró la lógica para que al añadir un jugador del plantel (columna derecha) a la cancha mediante el botón `+`, reemplace el slot correspondiente en la formación activa (sea una posición fantasma o un jugador real), tomando sus coordenadas exactas de forma instantánea.
- **Retorno Automático de Fantasmas:** Al remover un jugador real de la pizarra táctica con `✕`, la posición táctica se restablece automáticamente como "jugador fantasma" libre en la cancha.
- **Corrección de Contraste en Lista:** Se reemplazó el color de texto fijo `text-white` por colores adaptativos `text-slate-900 dark:text-white` en los listados del Plantel y de Rivales, solucionando la invisibilidad de los nombres de los jugadores en el tema claro de la aplicación.

### 🔄 Curvatura de Flechas Ajustable (Izquierda / Derecha)
- **Extensión del Modelo (`curvedOffset`):** Se añadió el campo opcional `curvedOffset?: number` a la interfaz `Arrow` en [tactical-store.ts](file:///d:/AntigravitDev/DeportivOS/src/lib/tactical-store.ts).
- **Arrastre Interactivo de Curvas:** Se habilitó el arrastre interactivo en el modo de selección. Al hacer clic y mover el cuerpo de cualquier flecha curva, se calcula dinámicamente el desplazamiento perpendicular, permitiendo curvar los pases, disparos o movimientos hacia la izquierda o derecha de forma fluida.
- **Acciones Contextuales de Flecha:** Se implementó una barra de herramientas contextual al seleccionar una flecha en el tablero que permite:
  - **Invertir Curva (🔄):** Cambia el sentido de la curva (izquierda ⟷ derecha) multiplicando el offset por `-1`.
  - **Línea Recta / Curva (📐):** Endereza la flecha o la vuelve a curvar con un solo toque.
- **Destello de Selección:** Se añadió un borde púrpura punteado (`#7c3aed`) debajo de la flecha seleccionada como retroalimentación visual de selección activa.

## [15/07/2026 - Sesión Nocturna - Simulación de Coaches y Planificación Táctica Premium U-11]

### 👥 Simulación Dinámica de Coaches y Filtro Reactivo de Equipos
- **Simulador de Coach en Topbar:** Se integró la opción **"Simular Coach"** en el menú desplegable del avatar en [app-topbar.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/components/app-topbar.tsx). Despliega dinámicamente un submenú con todos los entrenadores del sistema para facilitar simulaciones de roles.
- **Sidebar Reactivo al Entrenador:** Se reconfiguró [app-sidebar.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/components/app-sidebar.tsx) para remontarse automáticamente usando una clave compuesta con `coachName`. Al cambiar de coach, el menú lateral **"Mis Equipos"** filtra y muestra instantáneamente solo los equipos asignados a ese entrenador específico (ej. Carlos Méndez solo ve *Élite Sub-12 A*).
- **Seguridad en SSR / Pre-render:** Se eliminaron las llamadas directas a `RendimientoStore` (que utiliza `localStorage`) durante el renderizado inicial en el Sidebar y Topbar. Se implementó una hidratación segura usando los datos estáticos de `mock-data.ts` como fallback, erradicando los crashes de servidor de TanStack Start.

### 🧹 Versionado y Purga Automática de Caché (Data Buster)
- **Versionado Global:** Se añadió la constante `DATA_VERSION = "5"` en [rendimiento-store.ts](file:///d:/AntigravitDev/DeportivOS%20OS/src/lib/rendimiento-store.ts).
- **Auto-Purga Dinámica:** Al cargar la app en el cliente, el store detecta si el navegador tiene una versión de datos desactualizada. De ser así, vacía todas las claves `deportivos_hp_` de `localStorage` y vuelve a sembrar los registros frescos. Esto garantiza que las correcciones de jugadores (22 por equipo de fútbol) e instructores se apliquen al instante a todos los usuarios sin necesidad de limpiar la caché del navegador manualmente.

### 📋 Planificación Táctica e Inyección de Currículum U-11
- **Currículum de la Categoría U-11:** Se reemplazó el plan ficticio semanal por el plan de entrenamiento real de Carlos Méndez para el equipo *Élite Sub-12 A* en [tactica.planificacion.tsx](file:///d:/AntigravitDev/DeportivOS%20OS/src/routes/_app/tactica.planificacion.tsx):
  - **Trabajo Técnico:** Pase corto/largo, Control orientado, Conducción, Finalización y Juego aéreo.
  - **Táctica Individual/Colectiva:** Desmarques, Apoyos/coberturas, Amplitud/profundidad, Transiciones y Posición.
  - **Conceptos Físicos:** Velocidad de reacción, Agilidad, Cambios de dirección, Técnica de carrera y Coordinación.
  - **Cronograma de Julio:** Semanas 1 a 4 con banner de receso de entrenamientos en la Semana 3.
  - **Cronograma de Agosto:** Semanas 5 a 8 con notas competitivas de final de mes.

### ⚙️ CRUD Interactivo Premium con Rangos de Fecha Inteligentes
- **Panel de Control Premium (Dashboard):** Se rediseñó toda la interfaz de planificación táctica con un aspecto visual premium: tarjetas con sombras elegantes, efectos hover tridimensionales, pilares de trabajo por columnas y un formato de cronograma tipo tablero Kanban interactivo.
- **Semana de Descanso Visual:** La semana sin entrenamientos (Julio Semana 3) cuenta con un fondo ámbar texturizado, icono de taza de café y estilo desactivado que salta a la vista.
- **Rango de Fechas Automatizado (Date Range Picker):** Se quitó la edición manual por texto del nombre del mes. Se colocaron selectores de fecha nativos tipo calendario (Desde/Hasta).
  - Al cambiar las fechas, el sistema calcula de forma automática el nombre del mes correspondiente (ej: *Julio*).
  - Divide el intervalo de fechas en 4 partes iguales, auto-actualizando los rangos en formato `DD/MM` en los títulos de cada columna semanal sin que el usuario tenga que escribir nada.
- **Formulario de Planificación Dinámico:** Se habilitó y dio soporte funcional completo al botón **"+ Nueva Planificación"** para crear, editar, persistir en `localStorage` y eliminar planes de entrenamiento con diálogos modales detallados de confirmación.

## [13/07/2026 - Sesión de Medianoche - Firma, Ficha y Despliegue cPanel]

### ✍️ Flujo de Firmas Legales y Coordinación Deportiva
- **Firma Global del Coordinador:** Panel digital interactivo (canvas) en Configuración General que permite registrar la firma de la administración y estamparla de forma automática en todas las fichas de inscripción oficiales.
- **Selector Reactivo del Firmante:** Integrado desplegable (Madre / Padre / Tutor) en la creación y edición del atleta. Sincroniza en tiempo real el Nombre y la Cédula individual desde los datos de los padres (deshabilitando campos para garantizar consistencia) o habilita la edición libre si es un Tutor externo.
- **Cédulas Independientes:** Se agregaron inputs independientes para la cédula de la madre y del padre en la ficha del atleta.
- **Firmas en Blanco por Defecto:** Se removió el trazo de firma azul ficticio (SVG de prueba) de todos los atletas de prueba, permitiendo iniciar con el panel de firma completamente en blanco.

### 🖨️ Correcciones en Impresión Física y PDF
- **Ajuste de Escala en Impresión:** Se reconfiguró el CSS de `@media print` de la Ficha para desactivar el posicionamiento y centrado translate de Radix UI (`transform: none !important;` y `position: absolute !important;`), obligando a la ficha a expandirse de forma centrada y cubrir el 100% del ancho del papel físico (A4).
- **Metadatos del Firmante al Pie:** La ficha impresa detalla con precisión quién firma (Nombre, Parentesco, Cédula) debajo del recuadro de firma.

### 📦 Compilación y Empaquetado SPA para cPanel
- **Entorno SPA Estático:** Se crearon los archivos `src/entry-spa.tsx`, `index.html` en la raíz del proyecto y el archivo de configuración `vite-spa.config.ts` para posibilitar una compilación SPA 100% de cliente, eliminando la dependencia del servidor SSR de TanStack Start.
- **Enrutamiento Apache (.htaccess):** Se añadió un archivo `.htaccess` en el compilado estático para redirigir todas las peticiones a `index.html` y evitar errores 404 al recargar páginas o navegar por rutas profundas.
- **Paquete Listo para Subir:** Generado el comprimido `public_html.zip` con todos los recursos listos para ser subidos y extraídos en el cPanel del cliente.

## [13/07/2026 - Sesión nocturna]

### 🖼️ Gestión y Carga de Foto de Perfil (Archivo Local)
- **Carga de Archivos de Imagen:** Se implementó un cargador de archivos nativo (`<input type="file">`) dentro del modal de edición del atleta en `jugadores.$id.tsx`.
- **Conversión Base64:** Al seleccionar un archivo de imagen, se lee en tiempo real con `FileReader` y se codifica como un Base64 Data URL, mostrándolo al instante en la vista previa del modal y guardándolo en `localStorage` de forma persistente.
- **Portarretratos Consistentes:** Se segmentaron los avatares aleatorios de pravatar por género y edad (niños varones, niñas, hombres adultos y mujeres adultas), garantizando que las fotos por defecto correspondan con la edad y sexo del atleta.

### 👥 CRUD de Entrenadores y Categorías con Asignación Bidireccional
- **CRUD Entrenadores:** Rediseñada la página `/entrenadores` para soportar creación, edición y eliminación de entrenadores con Dialogs modales.
- **CRUD Categorías/Equipos:** Creado el formulario modal para registrar nuevas categorías y equipos deportivos.
- **Asignación Bidireccional:** Se programó el método `assignCategoriasToEntrenador` en el store. Al asociar categorías a un entrenador (o viceversa), se actualizan ambos modelos en paralelo.
- **Filtro de Equipos por Coach:** Si un usuario se loguea como Coach (Carlos Méndez), la sección de `Equipos` solo le mostrará sus propios planteles asignados.

### 🧭 Navegación Inteligente y Pestaña Activa
- **Retorno al origen:** El botón "Volver" del perfil del jugador ahora ejecuta `window.history.back()`, regresando al usuario a la vista de donde provino (como la plantilla de un equipo).
- **Persistencia de Pestaña:** Se agregó el parámetro de búsqueda `tab` en la URL de `/equipos` para almacenar la pestaña activa. Al volver del perfil del jugador, se mantiene la pestaña **Plantilla** seleccionada de forma automática.
- **Filas Clickables:** Toda la fila de la tabla de la plantilla ahora es interactiva y clickable para abrir el expediente del atleta.

### 🧹 Datos Demográficos Limpios
- **Distribución de Edades:** Las jugadoras de *Élite Femenino* ahora tienen edades variadas y realistas entre los 17 y 29 años.
- **Posiciones de Fútbol Reales:** Se amplió la asignación de posiciones de juego a 11 roles tácticos reales de campo (POR, DFC, DFD, DFI, MCD, MC, MCO, EXT, DEL).
- **Cédulas sin guiones:** Se limpiaron las identificaciones de todos los registros en `mock-data.ts`. Se configuró un purificador automático en la lectura de cache del store para limpiar guiones heredados.

## [12/07/2026 - Sesión nocturna]

### 🧭 Menú del Coach — Reestructuración de arquitectura
- Eliminados del menú lateral: **Asistencia**, **Check-in QR** y **Evaluaciones** como items independientes.
- Estos módulos ahora viven **dentro de cada equipo** en `Mis Equipos`. Al entrar a un equipo aparecen como tabs: Resumen, Plantilla, Asistencia, Check-in QR, Entrenamientos, Evaluaciones, Estadísticas, Convocatorias, Partidos, Player OS.
- Menú del Coach simplificado: Inicio, Mis Equipos, Calendario, Coach OS, Competiciones, Player OS, **Muro del Club**, Mensajes, Configuración.

### 👨‍👩‍👧 Portal de Padres — Nuevo rol completo
- Nuevo rol `padres` en `use-role.tsx` con sus permisos propios limitados.
- Switcher **"Cambiar a Padre"** en el topbar (junto a Administrador y Coach).
- Sidebar exclusivo para padres: Inicio, Muro del Club, Mi Hijo (Player OS), Pagos y Mensualidad, Mensajes, Configuración.
- **Configuración del padre** totalmente independiente de la del admin y coach.
- Dashboard del padre enfocado en 6 preguntas clave: ¿entrenamiento hoy?, ¿asistencia?, ¿pagos?, ¿mensajes?, ¿documentos?, ¿próximo partido?

### 📰 Muro del Club — Red Social Interna
- Accesible para los 3 roles: Admin, Coach y Padres (link en sidebar de cada uno).
- Posts de ejemplo con imágenes: jornada de premiación, cumpleaños de jugador, horarios, campeonato.
- Tabs: **Mi Club / Global / Empleos** y sub-tabs: **Muro / Foros / Guardados**.
- Filtros por tipo de publicación (publicación, artículo, encuesta) y por ciudad.
- Sistema de likes, votaciones en encuestas, guardar posts y compartir.

### 🔐 Permisos de publicación en el Muro
- Solo usuarios autorizados ven la **caja de publicar**. Los no autorizados ven `🔒 Publicaciones restringidas`.
- Sistema en 3 niveles desde **Configuración → Permisos de Muro** (solo admin):
  1. **Global por rol**: todos los admin / todos los coaches / todos los padres.
  2. **Por equipo específico**: coaches o padres de un equipo en particular.
  3. **Individual**: otorgar permiso a una persona concreta por email.
- Panel de administración con tabla de permisos individuales (agregar / toggle ON-OFF).

### 🖼️ Publicación con imágenes en el Muro
- `Textarea` multi-línea en lugar de input de una sola línea.
- Botón **"Imagen"** que abre el selector de archivos del OS.
- **Preview** de la imagen antes de publicar con botón X para cancelarla.
- Botón Publicar deshabilitado si no hay texto ni imagen.
- Avatar y nombre correcto según rol activo (AD / CG / MR).
- Post publicado aparece inmediatamente en el feed con imagen adjunta.

### 🐛 Bugs corregidos
| Error | Causa | Solución |
|---|---|---|
| `Plus is not defined` | Ícono no importado en `configuracion.tsx` | Agregado al import de lucide-react |
| `Cannot read properties of undefined (reading 'map')` en `MuroPermissionsTab` | `localStorage` con datos viejos sin `individualPerms` ni `equipos` | Merge defensivo con defaults + `try/catch` en ambos archivos (`configuracion.tsx` y `muro.tsx`) |
| `Label is not defined` en `muro.tsx` | Eliminado de imports en refactor pero seguía en uso (líneas 482, 497, 511) | Re-agregado |
| `Search is not defined` en `muro.tsx` | Ícono no importado | Agregado |
| `cityFilter is not defined` en `muro.tsx` | Estado eliminado en refactor pero referenciado en el sidebar de filtros | Re-agregado con `useState` |

---

## 🔜 PENDIENTE — Módulo de Inventario

### Contexto
Una academia deportiva maneja inventario físico constante: uniformes, balones, conos, petos, materiales médicos, equipos electrónicos, trofeos, etc. Necesita control total de entradas, salidas y responsables.

### Categorías de ítems
| Categoría | Ejemplos |
|---|---|
| Equipamiento deportivo | Balones, conos, petos, porterías portátiles, mallas |
| Uniformes y vestuario | Camisetas, shorts, medias, chalecos por talla y equipo |
| Materiales médicos | Botiquín, vendas, hielo sintético, spray frío |
| Tecnología | Cronómetros, GPS de rendimiento, tablets, cámaras |
| Infraestructura | Redes, banderines, marcadores de campo |
| Trofeos | Medallas, trofeos, diplomas por temporada |

### Campos por ítem
- Nombre, Categoría, Código SKU, Cantidad (total / disponible / prestada / dañada), Talla/especificación, Sede asignada, Valor unitario, Proveedor, Fecha adquisición, Estado (`Disponible` / `En préstamo` / `En reparación` / `Dado de baja`), Foto.

### Movimientos (Entradas y Salidas)
- **Tipo**: Entrada (compra/donación) / Salida (préstamo/asignación) / Devolución / Baja
- **Responsable**: quién entrega — **Receptor**: jugador, coach o equipo que recibe
- **Fecha + Fecha estimada de devolución** (para préstamos)
- **Observaciones** y firma/confirmación de autorización

### Alertas automáticas
- Stock mínimo (umbral configurable por ítem)
- Préstamos vencidos sin devolución
- Artículos en mal estado que requieren reemplazo
- Diferencias entre inventario físico y sistema

### Reportes
- Inventario general por sede
- Artículos más prestados
- Historial por artículo o por persona
- Valoración total del inventario (auditoría financiera)
- Préstamos activos pendientes de devolución

### Acceso por rol
| Rol | Acceso |
|---|---|
| Admin | Ver todo, configurar ítems, aprobar compras, reportes |
| Coach | Ver materiales de su equipo, solicitar artículos, registrar salidas |
| Bodeguero (Personal apoyo) | Registrar entradas/salidas, confirmar devoluciones |
| Padres | Sin acceso |

### Ubicación en menú
- **Admin**: Operación Deportiva → Inventario
- **Coach**: Panel Coach → "Materiales de mi equipo"

## [11/07/2026 - 00:43]
* **Mejoras en Ficha de Jugador:**
  * Incorporación de botones de acción **`+ Nueva Sesión`** y **`+ Nuevo Ciclo`** directamente en la pestaña de Planificación de Alto Rendimiento. Estos formularios autocompletan la categoría correspondiente al atleta seleccionado.
* **Sembrado de Datos y Migración:**
  * Inyección automática de sesiones de entrenamiento de ejemplo para múltiples categorías en `RendimientoStore` (`Fútbol Sub-10` para Sofía, `Baloncesto Sub-12` para Mateo, etc.).
  * Ampliado el sembrado de datos iniciales agregando múltiples registros históricos de Wellness (sueño, fatiga, estrés), Tests Físicos (Yo-Yo test, Sentadillas, Salto Vertical) y Lesiones (Esguince de muñeca recuperado para Sofía, y Tendinitis rotuliana activa para Mateo).
  * Programación de una rutina en caliente que auto-migra y actualiza las bases de datos de LocalStorage ya existentes en navegadores previos.
* **Corrección de Errores (ReferenceError):**
  * Solución a la caída de pantalla al definir en el expediente del jugador la constante `sesionTipoColor` que colorea los entrenamientos.
* **Optimización de UX para Tablets:**
  * Creación de un modal de detalle estilizado (`Dialog` de Shadcn/Radix) con botones táctiles de gran tamaño (`h-11`) para facilitar la edición y eliminación en tabletas.
  * Reemplazo de los mensajes de confirmación de borrado nativos e interactivos del navegador por confirmaciones integradas visualmente.
  * Bloqueo de las interacciones de arrastre (drag) al presionar los botones del planificador para asegurar clics/toques confiables.
* **Personalización del Sidebar:**
  * Configuración de la barra lateral en un color azul marino/pizarra deportivo y elegante (`oklch(0.24 0.08 250)`).
  * Adaptación de textos, logotipo de *"Élite Sports"* y el pie de *"Plan Pro"* para máxima legibilidad sobre este fondo.

## [21/07/2026 - 04:00]
* **Corrección de Adaptabilidad y Desbordamiento PWA Móvil/Tablet:**
  * Configuración defensiva de estilos CSS (`overflow-x: hidden` y `max-width: 100vw`) en los elementos raíz (`html`, `body`) para bloquear desbordamientos horizontales en dispositivos móviles.
  * Ajustes en la estructura principal del layout shell (`_app.tsx`) con contenedores limitados (`min-w-0 max-w-full overflow-x-hidden`) para encapsular las rejillas y evitar estiramientos no deseados.
  * Implementación global de pestañas adaptables mediante reglas CSS dirigidas a `[role="tablist"]`, forzando el deslizamiento horizontal táctil nativo en menús de pestañas de todas las páginas que superaban el ancho de pantalla en celulares.
  * Ocultado automático de la barra de búsqueda superior en anchos de tableta (`lg:block`), previniendo que los íconos de usuario, temas y notificaciones se apretasen o encimaran.
* **Refactorización de Panel Lateral (Sidebar):**
  * Corrección de la visibilidad de subenlaces en dispositivos móviles y tabletas ajustando la variable lógica de colapsado `collapsed` a `false` al renderizarse en el contenedor móvil `Sheet`.
  * Integración de auto-cierre del panel lateral en celulares (`setOpenMobile(false)`) al presionar cualquier subenlace de destino final.
  * Adición de colapsado automático inteligente en tabletas (`setOpen(false)`) ante clics de navegación para optimizar el espacio de lectura horizontal.
  * Rediseño adaptativo del logo del club en el cabezal del sidebar, disminuyendo su escala a `h-9 w-9` y centrándolo estéticamente cuando la barra lateral se encuentra contraída en modo icono.
  * Conversión de los menús principales desplegables (como "Operación Deportiva" o "Coach OS") de enlaces navegables a divs puros para que al presionarlos solo alternen el despliegue del menú sin disparar redirecciones accidentales ni cerrar el panel.
* **Finanzas, Morosidad, Becas y Arreglos de Pago:**
  * Vinculación dinámica de gráficos financieros al historial de pagos en tiempo real provenientes de la base de datos de Supabase en lugar de arreglos estáticos vacíos.
  * Implementación de reglas de morosidad automatizadas basadas en el rebasamiento del costo mensual correspondiente a cada categoría del atleta.
  * Persistencia en el caché del navegador de becas y convenios, incorporando formularios de creación interactivos con menús desplegables condicionales que filtran los jugadores por categoría de manera inteligente.
* **Distribución y Empaquetado de Despliegue:**

## [22/07/2026]
* **Rediseño Completo del Departamento de Área Médica & Fisioterapia (`/medico/jugador/$id`):**
  * Implementación completa de las 8 pestañas clínicas con diseño profesional y adaptabilidad móvil/tablet:
    1. **Historial Clínico Completo**: Formulario exhaustivo de 10 campos (antecedentes patológicos, tratamientos farmacológicos, alergias, lesiones, ortopedia, auscultación, antecedentes familiares, etc.) con guardado en `RendimientoStore` y tabla resumen antropométrica.
    2. **Partes de Lesiones**: Bitácora de bajas médicas oficiales con formulario de emisión y tabla interactiva de partes.
    3. **Fisioterapia & Sesiones**: Agendamiento de citas de rehabilitación, escala de dolor EVA y recordatorios por WhatsApp.
    4. **Parte Médico Diario**: Rediseño modular para emisión de dictámenes diarios, recomendaciones tácticas, restricciones de carga y alternador de baja médica automática.
    5. **Valoración Antropométrica (ISAK)**: Medición de 8 submódulos con cálculo automático de IMC, masa muscular y porcentaje graso.
    6. **Control de Peso**: Registro de pesajes diarios con comparación respecto a peso establecido y cálculo de desviaciones.
    7. **Control de Infecciones & Aislamiento**: Bitácora de cuadros infectocontagiosos con filtrado por estado (Baja sin alta vs Con Alta).
    8. **Control de Temperatura Corporal**: Bitácora de constantes vitales (°C y presión arterial) con detección de fiebre.
* **Acciones CRUD Interactivas Completas:**
  * Integración de operaciones Crear, Leer, Editar y Eliminar (CRUD real) en las 8 pestañas con modales y formularios pre-llenados.
  * Poblamiento de datos de muestra reales para la categoría U13 en todas las secciones para pruebas de uso inmediato.
* **Optimización en Menú Lateral (Sidebar):**
  * Reubicación del módulo principal **`Área Médica & Fisioterapia`** al bloque final antes de **`Configuración & IA`**, eliminando la redundancia dentro de Operación Deportiva.
  * Adaptación del `TabsList` con desplazamiento horizontal suave para navegación en dispositivos móviles y tablets.

