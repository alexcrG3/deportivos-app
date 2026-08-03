# Bitácora de Cambios - DeportivOS

Este archivo registra de manera agrupada todos los cambios, mejoras, correcciones y ajustes aplicados al software en cada sesión de desarrollo. Los registros más nuevos se añaden siempre al principio.

---

## [02/08/2026 - Noche: Sincronización Real del Muro Social con Supabase, Redactor IA Periodístico de Crónicas & Dictado de Voz por Micrófono]

### 🌐 Sincronización Real del Muro Social en Supabase (`src/routes/_app/muro.tsx`, `src/routes/_app/competiciones.tsx`)
- **Creación e Integración de Tablas Faltantes en Supabase:**
  - Ejecución de migraciones SQL para crear las tablas `muro_posts`, `sedes`, `asistencias_staff`, `solicitudes_permisos`, `certificaciones_staff`, `evaluaciones_staff` y `nominas_entrenadores`.
  - Ajuste de la columna `organizacion_id` a tipo `TEXT` para permitir IDs de organizaciones tanto estándar como personalizados (`org_asoderive_master`).
  - Adición de las columnas `categoria` (texto) y `comentarios` (JSONB) en la tabla `muro_posts`.
- **Eliminación de Borrados Automáticos:**
  - Eliminación de consultas antiguas en `muro.tsx` que borraban entradas recientes que contenían etiquetas temporales `tiempo: "Ahora"`.
- **Filtro Inclusivo de Organización:**
  - La consulta de publicaciones en `muro.tsx` utiliza una cláusula `.or(...)` para cargar publicaciones tanto de la organización activa como de la organización por defecto.

### 🎙️ Asistente de Voz y Dictado con Micrófono (`src/routes/_app/competiciones.tsx`)
- **Solicitud Explícita de Permisos (`getUserMedia`):**
  - Implementación de solicitud de permisos del navegador antes de iniciar el servicio `SpeechRecognition`.
  - Actualización del código de idioma a `es-ES` para mejorar la tasa de precisión del dictado de voz en Chrome.

### 🤖 Redactor IA de Crónicas Periodísticas Inteligente (`src/routes/_app/competiciones.tsx`)
- **Redacción Periodística Adaptativa (`generateAICronica`):**
  - La IA redacta de forma inteligente la crónica del partido tomando los datos reales ingresados en el modal:
    - **Figuras y Goleadores:** Muestra los nombres reales y número de goles anotados por jugador (ej: `Aaron Pacheco (2 goles)`, `Andrés Soto (Figura)`).
    - **Cita Técnica del Entrenador (`notaDt`):** Incorpora de forma destacada las palabras exactas del DT y genera un análisis sintético periodístico.
    - **Tono según Resultado:** La narrativa, el titular y la introducción cambian según si el partido fue Victoria, Empate o Derrota.
- **Flujo y Cierre de Modal:**
  - Corrección de la llamada de cierre del modal (`setIsOpenScoreModal(false)`).
  - Estado `isPublishing` con indicador `⏳ Publicando...` para evitar publicaciones duplicadas por clics repetidos.

---

## [01/08/2026 - Noche: Pasarelas de Pago en Vivo, Recibos PDF con QR, Iconos PWA 4K HD, Finanzas Dinámicas por Categoría (U9, U11, U13) & Paginación Profesional]

### 💳 Pasarelas de Pago en Vivo & Modal de Checkout Multi-Método
- **Integración de `PaymentCheckoutModal` (`src/components/PaymentCheckoutModal.tsx`):**
  - Sustituido el modal antiguo de 4 campos estáticos por la pasarela multi-método (Tilopay, SINPE Móvil, Stripe y Efectivo) en `/finanzas` y `/pagos`.
  - **Sincronización de Monto Real:** El modal detecta y sincroniza automáticamente el saldo pendiente exacto del alumno seleccionado en la tabla (ej: ₡25,000 cuota normal o ₡50,000/₡75,000 para morosos de 2 o 3 meses acumulados).
  - **Recibos PDF Oficiales con QR (`src/lib/receipt-generator.ts`):** Generación e impresión en tiempo real de comprobantes fiscales descargables con consecutivo único (`FE-CR-XXXX`), desglose de subtotal + IVA 13% y código QR de verificación.

### 📊 Módulo de Finanzas & Semáforo por Categorías Reales de Asoderive (`src/routes/_app/finanzas.tsx`)
- **Restricción a Equipos Reales de Asoderive:** Eliminación de tarjetas estáticas genéricas o categorías fantasma (Sub-15, Sub-20). Ahora se muestran exclusivamente las 3 categorías activas del club: **U9, U11 y U13**.
- **Resumen Ejecutivo de Totales (Barra KPI):** Implementación de mini-panel superior que contabiliza la cantidad exacta de alumnos y saldos monetarios de **Pendientes**, **Morosos** y **Total Consolidado por Cobrar**.
- **Desglose de Meses Vencidos:** Subtítulo descriptivo en la celda de saldo pendiente (`🔴 2 Meses: Julio + Agosto` vs `🟡 Mes Actual en Curso`).
- **Botón `⚡ Generar Cobros del Mes (Todos)`:** Carga automática de la mensualidad del nuevo mes a los 81 alumnos activos de la academia.
- **Paginación Profesional:** Pie de tabla con selector de filas por página (`10`, `25`, `50`, `Todos`) y controles de navegación fluida `Anterior`/`Siguiente`.
- **Cambio de Estado Interactivo en 1 Clic:** Posibilidad de alternar el estado de cualquier alumno entre `Pendiente 🟡` y `Moroso 🔴` haciendo clic directamente en la etiqueta de su fila.

### 📱 Iconos PWA Ultra HD 4K (`public/`, `scripts/resize_icons.ps1`)
- Script en PowerShell (`scripts/resize_icons.ps1`) que genera imágenes PNG en ultra alta definición desde el logo vectorial 4K:
  - `public/pwa-512x512.png` (Splash screen)
  - `public/pwa-192x192.png` (Pantalla de inicio)
  - `public/apple-touch-icon.png` (iOS Safari)
  - `public/favicon.png` (Favicon del navegador)
- Incremento de versión de caché PWA a `deportivos-pwa-v4` en `public/sw.js` e `index.html`.

### 🧹 Limpieza Técnica & Build de Producción
- Corregidos todos los errores de TypeScript (`npx tsc --noEmit` y `npm run build` sin errores).
- Configuración de despliegue en Vercel (`vercel.json`).

---

**📌 Notas y Agenda para la Sesión de Mañana:**
- [ ] **Revisión a Fondo del Flujo de Cobros:** Inspección detallada del proceso de cobranza y pasarelas en vivo.
- [ ] **Inteligencia Artificial Copiloto por Rol:** Potenciación y afinamiento de las capacidades de IA personalizadas para cada rol (*Administrador, Entrenador DT, Preparador Físico, Médico, Tutor/Padre*).

---

## [31/07/2026 - Noche: Pizarra Táctica bCoach Ultra-Elite — Equipamiento Físico Vectorial, Media Cancha, Trazos Curvos Bézier, Zonas Circulares y UI Zero-Clutter]

### 🏋️ Equipamiento Físico de Entrenamiento (5 nuevos objetos vectoriales SVG)
Nuevos tipos de datos e interfaces en `cancha-bcoach-board.tsx`: `BoardDummy`, `BoardLadder`, `BoardHurdle`, `BoardHoop`, `BoardPole`. Todos arrastrables, borrables individualmente con la herramienta Borrador y serializables en keyframes.

- **Muñecos de Barrera 🧍:** Cuerpo trapezoidal amarillo + cabeza circular. Ideal para ejercicios de tiro libre y barreras.
- **Escalera de Agilidad:** Rectángulo dorado con 7 peldaños. Para coordinación, frecuencia y velocidad.
- **Vallas de Salto:** Barra roja horizontal con bases circulares. Para ejercicios pliometricos.
- **Aros de Agilidad:** Circulo de color seleccionable. Para circuitos de coordinacion.
- **Picas / Banderines:** Palo vertical amarillo con banderín triangular. Para zigzag y delimitación.

#### `src/components/cancha-bcoach-board.tsx`
- Interfaces nuevas: `BoardDummy`, `BoardLadder`, `BoardHurdle`, `BoardHoop`, `BoardPole`.
- Estados React nuevos: `dummies`, `ladders`, `hurdles`, `hoops`, `poles`.
- ToolModes nuevos: `add-dummy`, `add-ladder`, `add-hurdle`, `add-hoop`, `add-pole`.
- `handlePointerDown`: Manejo de los 5 nuevos tipos de equipamiento al hacer tap en la cancha.
- `handlePointerMove`: Dragging fluido de los 5 nuevos tipos de objetos.
- `handleClear`: Limpieza de todos los arrays de equipamiento.
- Renderizado SVG vectorial de cada elemento con soporte de orientacion portrait.

### 🎯 Modo Media Cancha (Half-Pitch View)
Nueva funcion `FootballHalfField` que renderiza la mitad del campo con penalti, luna, arcos de esquina y media linea.

#### `src/components/cancha-bcoach-board.tsx`
- Nuevo tipo `PitchLayout = "full-pitch" | "half-pitch"`.
- Estado `pitchLayout` con valor inicial `"full-pitch"`.
- Toggle directo en la barra flotante: Cancha Completa ↔ Media Cancha.
- Renderizado condicional segun `pitchLayout`.

### Trazo Curvo Bezier (Desmarques en Arco)
Nueva herramienta "Desmarque Curvo" con interpolacion Q-curves para desmarques de ruptura y centros con rosca.

#### `src/components/cancha-bcoach-board.tsx`
- Nueva funcion `curvePointsToD(pts)`: Genera path SVG con comandos Q para suavizado Bezier cuadratico.
- Nuevo `StrokeStyle`: `"curve"` y `ToolMode`: `"draw-curve"`.
- Preview live mientras se dibuja y punta de flecha automatica al guardar.

### Zonas Circulares / Rondos (draw-circle-zone)
Nueva herramienta de zona circular (elipse) para delimitar rondos y zonas de presion.

#### `src/components/cancha-bcoach-board.tsx`
- Campo `shape?: "rect" | "circle"` en la interfaz `ShadedZone`.
- Nuevo `ToolMode`: `"draw-circle-zone"` y `StrokeStyle`: `"circle-zone"`.
- Renderizado condicional: `shape === "circle"` renderiza `<ellipse>`, sino `<rect>`.

### UI Zero-Clutter — Barra Flotante de Categorias (bCoach-style)
Reemplaza la barra antigua de 15+ botones expuestos por 4 botones de categoria compactos con Popover.

- **Materiales:** Parrilla 2x4 con Munecos, Escalera, Vallas, Aros, Picas, Mini Arco, Cono.
- **Dibujo y Zonas:** Mover, Lapiz, Pase, Tiro, Curvo, Zona Rect, Rondo Circular, Texto, Borrador.
- **Estilo y Jugador:** Paleta de trazos, grosor, petos de equipo, boton jugador y balon.
- **Toggle Cancha:** Cancha Completa / Media Cancha directo en la barra principal.
- Acciones rapidas: Deshacer, Limpiar, Ocultar barra.

---

## [30/07/2026 - Noche: Alto Rendimiento — Corrección de Datos, Sports Science, Modales de Riesgo en Control de Cargas]

### 🔧 Corrección General: Datos no aparecían en módulos de Alto Rendimiento
Se identificó y corrigió una cadena de 3 problemas que impedían que los registros guardados en una sesión de entrenamiento se reflejaran en los dashboards de Alto Rendimiento (Wellness, Tests Físicos, Control de Cargas, Sports Science).

#### `src/lib/rendimiento-store.ts`
- **`getWellness` / `addWellness`:** Normalización de fechas `DD/MM/YYYY → YYYY-MM-DD`. Match por `jugadorId` y por `jugadorNombre` / `jugador` para evitar fallo por diferencia de ID.
- **`addEvaluacion`:** Método creado para persistir resultados de Tests Físicos correctamente en Supabase (`resultados_pruebas_fisicas`).
- **`addCargaEntrenamiento`:** Nuevo método que persiste registros de carga interna en `cargas_entrenamiento` con soporte para ID y nombre de jugador.
- **`getPlayerLoadData`:** Match flexible por ID y nombre para Cargas y Wellness.
- **`getSportsScoreData`:** Mejorado para buscar Wellness por ID **y** nombre. Integración con `cargas_entrenamiento` (antes solo usaba `sesiones.carga`). Historial por jugador individual en lugar de por equipo. Estado `"sin_registro"` solo si no hay wellness **ni** cargas.

#### `src/routes/_app/entrenamientos.tsx`
- `handleGuardarSesionFinal` ahora llama a `addCargaEntrenamiento` automáticamente para cada jugador presente al guardar la sesión.

#### `src/routes/_app/rendimiento.wellness.tsx`
- Filtrado de equipos con fallback: si `coachName` no coincide exactamente con ningún equipo → muestra todos los datos.
- Parsing de fechas corregido para comparación correcta de rango.

#### `src/routes/_app/rendimiento.tests.tsx`
- Filtrado por categoría con fallback para evitar vistas vacías.
- Match de jugadores por nombre además de ID.

#### `src/routes/_app/rendimiento.cargas.tsx`
- Filtrado de equipos con fallback igual al de Wellness y Tests.
- **Modal "🔴 Alto Riesgo":** La tarjeta resumen del header ahora es clickable cuando hay jugadores en riesgo. Abre un `Dialog` con la lista completa: foto, equipo, ACWR, Carga Semanal, Fatiga, Recovery, motivos detectados y recomendación. Botón "Ver análisis completo →" selecciona al jugador y cierra el modal.
- **Modal "🟡 Precaución":** Misma funcionalidad que Alto Riesgo pero en color amber para jugadores con sobrecarga moderada.

#### `src/routes/_app/rendimiento.sports-science.tsx`
- Filtrado de equipos con fallback (si nombre del entrenador no coincide exactamente → muestra todo).
- `loadData` ahora aplica el mismo patrón defensivo: solo filtra si el filtro efectivamente devuelve resultados.

---

## [30/07/2026 - Pizarra Táctica bCoach Elite 100% Pantalla Completa, HUD & Dock Flotante de Cristal, Selector Multiequipo & Dock Compacto Mobile-First]


- **Transformación de la Cancha a 100% Pantalla Completa (Edge-to-Edge) (`src/components/cancha-bcoach-board.tsx`):**
  - Eliminadas las barras superiores e inferiores fijas oscuras que ocupaban ~35% de la pantalla. El campo verde ahora ocupa el 100% del viewport en teléfonos y tablets sin márgenes ni marcos negros.
  - Removido el contenedor con padding e historial rígido en el modal inmersivo de `src/routes/_app/entrenamientos.tsx`, otorgando 100% espacio real a la cancha (`p-0`).

- **HUD Superior Flotante Translúcido (Estilo Glassmorphism):**
  - Barra superior flotante de cristal (`bg-slate-950/85 backdrop-blur-md`) con píldoras independientes para: Volver, Modo 2D/Video, Cámara Foto del Campo, Cargar Video, Alineaciones 1-clic y Pantalla Completa.

- **Dock Inferior Flotante & Minimizable con Modo Mobile-First:**
  - **En Móvil (< 640px):** Barra ultra compacta de 1 sola fila con 6 botones táctiles grandes de 40×40px (Lápiz, Pase, Tiro, Zona, Jugador, Borrador), botón del color de equipo activo con ciclo de 1 toque, botón `⋮` de más herramientas y botón `👁` de ocultar.
  - **Bottom Sheet Táctil en Móvil:** Cajón deslizante animado desde abajo con gesto *swipe-down* (desliza 60px para cerrar) o toque en fondo oscuro. Contiene paleta de colores de trazo (36px), grosores, selector de equipo con confirmation toast, balón, texto, deshacer, limpiar y zoom.
  - **En Tablet/PC (≥ 640px):** Menú expandido completo de 2 filas flotantes sobre la cancha.

- **Selector Multiequipo y Despliegue 11vs11 Rival (Home vs Rival):**
  - Añadido soporte para 7 colores de equipos (`orange`, `blue`, `red`, `white`, `yellow`, `black`, `green`) con su correspondiente mapeo cromático y contraste de números.
  - Botón selector de color de equipo integrado en la barra flotante y en el Bottom Sheet. Al tocar sobre un jugador existente con la herramienta `add-player` activa, cambia instantáneamente el color del jugador.
  - Menú de **Alineaciones 1-Clic** actualizado con opciones para desplegar automáticamente **Mi Equipo (11)** y **Equipo Rival 11vs11** en el campo contrario (mirrored) en color Azul o Rojo.

- **Corrección de Zoom Fluido y Multitáctil:**
  - Removidos los bloqueos `maxWidth: 100%` y `maxHeight: 100%` que impedían el escalado visual cuando `zoom > 1`.
  - Zoom multitáctil con dos dedos (*pinch-to-zoom*) y botones `+` / `-` escalan la pizarra hasta 300% con scroll y pan fluido.

- **Persistencia en Repositorio GitHub:**
  - Commits subidos a la rama `main` de `https://github.com/alexcrG3/deportivos-app.git`:
    - `31810c4`: `feat(pizarra): cancha 100% pantalla completa estilo bCoach con dock y hud flotante de cristal`
    - `91dcd37`: `feat(pizarra): selector de color de equipo y despliegue 11vs11 para equipos rivales`
    - `efc555c`: `feat(pizarra/mobile): dock compacto 1-fila + bottom sheet drawer tactil para movil`
    - `f8c1a35`: `fix: selector color equipo mobile con ciclo 1-toque y confirmacion`
    - `19076e3`: `build-clean: adicion de ignores para videos en root`

---

## [29/07/2026 - Noche: Pizarra Táctica Profesional — Rediseño Completo, Foto de Campo, Pinch-Zoom & Botones Visibles]

- **Rediseño del Canvas SVG para Llenar Espacio en Todos los Dispositivos (`src/components/cancha-bcoach-board.tsx`):**
  - Eliminado el patrón `aspectRatio: "100/65"` + `flexShrink` que hacía que el campo se redujera al calcular la altura disponible en tablet y PC landscape, generando grandes barras negras a los lados.
  - El SVG ahora usa `width: 100%; height: 100%` con `preserveAspectRatio="xMidYMid meet"`, llenando todo el contenedor disponible.
  - El fondo del SVG se cambió a verde oscuro (`#183b18`) para que las áreas de letterbox se mezclen visualmente con el campo y no se vean barras negras.

- **Corrección del Layout Portrait (Móvil y Tablet Vertical):**
  - Reemplazado `100vh / 100vw` por `calc(100dvh - 9rem) / 100dvw` para descontar correctamente la altura de los toolbars superiores e inferiores.
  - La rotación `-90deg` ahora encaja exactamente en el viewport real disponible sin desbordarse hacia la zona de los controles.

- **Zoom Funcional con Scroll (`zoom > 1`):**
  - Cuando `zoom > 1`, el contenedor interior se expande proporcionalmente (`${zoom * 100}%`) y el contenedor padre activa `overflow: auto`, permitiendo navegar la pizarra ampliada con scroll.
  - Indicador de porcentaje de zoom flotante (ej. `150%`) visible en la esquina inferior derecha cuando el zoom difiere de 1×.

- **Pinch-to-Zoom Táctil Implementado (`handleTouchStart / Move / End`):**
  - Añadidas las funciones de gestos táctiles de 2 dedos que estaban referenciadas pero no definidas (causaban el crash `handleTouchStart is not defined`).
  - Gesto de apertura de dedos → zoom in hasta ×3; cierre de dedos → zoom out hasta ×0.5.

- **Botones de Acción Visibles en el Header (estilo video táctico):**
  - Eliminado el menú `+ Acciones` escondido en un Popover único.
  - Reemplazado por botones directamente visibles: **📷 Foto del Campo**, **📹 Video**, **👥 Alineaciones ▾**, **🗑️ Limpiar**, **⛶ Pantalla Completa**.
  - En móvil se muestran solo los íconos; en tablet/PC aparece el texto.
  - El dropdown de **Alineaciones** lista todas las formaciones disponibles (4-3-3, 4-4-2, 4-2-3-1, 3-4-3, etc.) en 1-clic.

- **Funcionalidad de Foto del Campo con Cámara Real:**
  - Nuevo botón **📷 Foto del Campo** que usa `<input type="file" accept="image/*" capture="environment">` para abrir directamente la cámara trasera del dispositivo en móvil/tablet.
  - La foto capturada se establece como fondo del SVG (`<image href={...} preserveAspectRatio="xMidYMid slice">`), permitiendo dibujar tácticas directamente sobre la foto del campo real.
  - Badge **"📸 Foto activa ✕"** aparece en el header para quitar la foto con 1 tap y volver a la cancha 2D verde.
  - Si se carga una imagen desde el explorador de archivos (no video), también se usa como fondo (no abre modo video).

- **`handleClear` Mejorado:**
  - El botón Limpiar ahora también resetea `backgroundImageUrl` y `activeVideoUrl`, dejando la pizarra completamente limpia incluyendo el fondo.

- **Respaldo de Seguridad:**
  - Backup de la versión anterior en `src/components/cancha-bcoach-board.backup.tsx`.

---

## [29/07/2026 - Rediseño de Asistencias, Módulo de Planificación Manual & Optimización de Rendimiento]

- **Historial de Asistencias Desacoplado & Vista Compacta (`src/routes/_app/equipos.tsx`):**
  - Reemplazada la antigua tabla estática de pase de lista en la pestaña *Cancha & Asistencia* por un **Historial de Asistencias** compacto tipo log.
  - Cada fila muestra la fecha formateada en idioma local, el tipo de sesión, la duración, el porcentaje de presencia acumulado y los Badges de resumen (`P` Presente, `T` Tardío, `A` Ausente, `J` Justificado).
  - Al hacer clic en cualquier fila del historial, se despliega una vista en línea con la lista de jugadores, sus estados individuales y un botón de acción rápida *"Editar esta asistencia"*.
  - El formulario de pase de lista activo queda reservado exclusivamente dentro del asistente guiado de 3 pasos (*Asistencia $\rightarrow$ Trabajo de Cancha $\rightarrow$ Cierre*) lanzado desde el botón **INICIAR ENTRENAMIENTO EN CANCHA**.

- **Suite de Planificación Manual Integrada (`src/routes/_app/planeamiento.tsx`):**
  - Implementada la funcionalidad del botón **"Planificar Manualmente"**, desplegando un modal de selección para *Planificación Semanal*, *Microciclo*, *Mesociclo* y *Macrociclo*.
  - Diseñado el flujo interactivo de creación paso a paso donde el entrenador configura objetivos formativos, volumen de minutos, intensidades RPE esperadas y ejercicios de la biblioteca.
  - Ajustes de diseño fluido y responsivo en rejilla para uso óptimo en pantallas de tablets y teléfonos móviles.

- **Optimización de Carga Inicial & Lecturas de Memoria (`src/routes/_app/*`):**
  - Reemplazadas las consultas `SELECT` redundantes a Supabase durante el montaje inicial de rutas por lecturas desde la memoria local del `RendimientoStore`.
  - Integrado el patrón de comprobación `RendimientoStore.isStoreSynced()` con escuchadores del evento `rendimientoStoreUpdated` y timeouts de seguridad.

- **Resiliencia en Rutas y Manejo de Parámetros `teamId` (`src/routes/_app/equipos.tsx`):**
  - Mejorado el algoritmo de coincidencia para el parámetro de búsqueda `teamId` en la URL (`/equipos?teamId=eq_u9`), permitiendo resolver de forma flexible IDs exactos o parciales (`eq_u9`, `u9`, `Sub-9`, etc.).
  - Añadido resguardo mediante bloques `try/catch` y `.catch()` en llamadas a Supabase (`convocatorias`), evitando pantallas de error 500 o fallos de red no controlados.

---

## [25/07/2026 - Sesión Nocturna: Corrección de Menú y Privilegios de Coach]

- **Ordenamiento Dinámico del Menú Lateral (`src/components/app-sidebar.tsx`):**
  - Se modificó la lógica de generación del menú de navegación para asegurar que el bloque del **Área Técnica / Coach OS** se priorice y aparezca siempre arriba (antes de Operación Deportiva) cuando el usuario inicie sesión con el rol de `coach`.
  - El usuario de tipo `admin` sigue conservando su estructura de menú completa (SAAS ADMIN, GESTIÓN DE ACADEMIA, etc.) sin alteraciones ni bloqueos, asegurando su capacidad operativa en todo momento.

- **Corrección y Filtrado Estricto de Permisos de Rol (`src/components/app-sidebar.tsx`):**
  - Se emparejaron con precisión milimétrica los IDs de la Configuración de Roles con los sub-enlaces de la barra de navegación (ej. `op_jugadores`, `op_asistencia`, `coord_planificacion`, `coach_sesiones`, `tactico_pizarra`).
  - La lectura de permisos ahora es estricta: si en el panel de configuración se apaga (pone en falso) el permiso para acceder a "Jugadores" o "Coordinación General", el ítem desaparece completamente de la barra de navegación del Coach.
  - La herramienta para Administradores de "Ver como entrenador" (`selectedCoachId`) ya no altera los accesos del menú lateral del admin, evitando que pierda el acceso al módulo de configuración cuando simula ser un coach.

- **Persistencia y Guardado de Sesiones de Entrenamiento (`src/routes/_app/entrenamientos.tsx`):**
  - Mejorado el motor de inserción de sesiones de entrenamiento en Supabase (`sesiones_entrenamiento`).
  - Corregido el mapeo y alineación del ID/Nombre del entrenador.
  - Integrado el campo de observaciones en el guardado (`notas_entrenador`), asegurando que todos los campos del nuevo formulario se guarden exitosamente en la base de datos de la nube.
  - Mitigados los errores visuales de las Cards de equipos. Ahora los botones de acción como Plantilla y Asistencia cuentan con paradas de propagación (`stopPropagation`) para evitar solapamientos con la navegación general de la tarjeta.

**📌 Pendientes para la próxima sesión (Mañana):**
- Revisar la pizarra táctica (lado derecho) junto con las convocatorias para el manejo de jugadores lesionados.

---

## [24/07/2026 - Módulo de Finanzas v2.0, Persistencia 100% Supabase BD, Edición Directa & Formato UTC-6]

- **Desconexión Absoluta de LocalStorage & Mock Data en Finanzas (`src/routes/_app/finanzas.tsx`, `src/components/finanzas-balance.tsx`):**
  - Eliminada la inicialización de estados desde `RendimientoStore` (`localStorage`). `activePlayers` y `pagosRealizados` arrancan en `[]` vacíos y se alimentan de forma 100% estricta en tiempo real desde las tablas `jugadores` y `pagos` en Supabase.
  - Eliminados los valores estáticos por defecto (fallbacks `|| 35000` y `|| 50000`) al parsear transacciones de la BD.

- **Herramienta de Edición Directa de Movimientos (CRUD Completo en BD):**
  - Incorporación del botón **Lápiz 🔵 (Editar)** en la columna de Acciones de la Tabla de Auditoría.
  - Implementación del modal de edición que permite modificar *Fecha*, *Monto*, *Concepto/Detalle*, *Cliente/Proveedor*, *Categoría* y *Método de Pago*, aplicando cambios directos en Supabase con `.update()`.

- **Mantenimiento e Integridad de Categorías en Supabase (`pagos` table):**
  - Dado que la tabla `pagos` de Supabase no cuenta con columna nativa `categoria`, se codificó el formato parseable `[CAT:Categoría] EGRESO / INGRESO: Detalle` en la columna `referencia`.
  - El motor de lectura extrae dinámicamente `[CAT:...]` de la referencia para asignar y mantener la categoría correcta en los gráficos de pastel ("Distribución de Salidas") y filtros.
  - Habilitada la opción **`✏️ Otro/a (escribir...)`** con caja de texto libre tanto para Métodos de Pago como para Categorías en los modales de egresos e ingresos.

- **Sincronización de KPIs & Gráficas de Evolución:**
  - Sincronizados los cálculos entre "Balance y Libro de Caja" y "Gráficas de Evolución" para evaluar únicamente las transacciones del mes en curso y separar ingresos de egresos reales.
  - Reemplazada la estimación artificial del 45% en los egresos del gráfico de barras mensual por la sumatoria real de egresos de Supabase.
  - Rediseñado el tooltip flotante del gráfico de barras con fondo oscuro contrastado (`#1e293b`) y texto en blanco brillante para una legibilidad impecable.

- **Normalización de Fechas y Zona Horaria Local (UTC-6 / Costa Rica):**
  - Reemplazadas todas las conversiones `.toISOString().split("T")[0]` por el formateador local `getLocalDateStr()`. Esto evita que transacciones registradas después de las 6:00 PM (18:00 hrs local) salten al día siguiente en UTC y distorsionen los totales.
  - Corregido el bug de sintaxis `const rawRef` a `let rawRef` que interrumpía la ejecución del fetch en segundo plano.
  - Ajustado el desempate secundario del orden cronológico utilizando el timestamp extraído de IDs alfanuméricos (`pag-${Date.now()}-xxx`) para garantizar que las transacciones más recientes aparezcan siempre en la parte superior.

---


- **Submenú Ampliado y Rediseñado de Área Médica (`src/components/app-sidebar.tsx`):**
  - Actualización completa de la navegación de **Área Médica** con 7 sub-enlaces oficiales e iconos Lucide dedicados:
    - 🏥 `Área Médica` (`/medico`) - Icono `Hospital`
    - 👤 `Historial Clínico` (`/medico?tab=historial`) - Icono `User`
    - 🚑 `Lesiones` (`/medico/lesiones`) - Icono `Ambulance`
    - 🩺 `Fisioterapia` (`/medico/fisioterapia`) - Icono `Stethoscope`
    - 💊 `Tratamientos` (`/medico/tratamientos`) - Icono `Pill`
    - 📅 `Citas` (`/medico/citas`) - Icono `CalendarDays`
    - 📝 `Aptitud Deportiva` (`/medico/aptitud`) - Icono `ClipboardCheck`
    - 📈 `Reportes` (`/medico/reportes`) - Icono `LineChart`

- **Indicador Inteligente de Próxima Revisión (`src/routes/_app/medico.index.tsx`):**
  - Implementación del helper y badge dinámico de estado en la columna *Próxima Revisión* del Historial Clínico para evitar la lectura manual de fechas por parte del equipo médico:
    - 🟢 **Programada:** `🟢 30 Jul 2026` (> 7 días para la revisión).
    - 🟡 **Próxima:** `🟡 En 2 días` (Entre 1 y 7 días para la revisión).
    - 🟠 **Hoy:** `🟠 Hoy` (La revisión es el día actual).
    - 🔴 **Vencida:** `🔴 Hace 4 días` (Fecha de revisión superada).
    - ⚪ **Sin programar:** `⚪ Sin programar` (Sin fecha agendada).

- **Panel Lateral de Vista Rápida - Quick View Drawer (`src/routes/_app/medico.index.tsx`):**
  - Sustitución de modal básico por un Drawer lateral completo al presionar `Ver` en la tabla de deportistas.
  - **Encabezado:** Nombre del jugador, foto/avatar, categoría, edad, sede, entrenador a cargo y badge de aptitud (`🟢 APTO PARA COMPETIR`).
  - **Desglose Clínico Dinámico:** Última Valoración, Badge de Próxima Revisión, Tipo de Sangre, Alergias, Lesiones Activas, Tratamiento Actual, Fisioterapia, Medicamentos y Observaciones Médicas provenientes directamente de `RendimientoStore`.
  - **Navegación:** Botón primario `[📄 Abrir Expediente Completo]` que redirige a la ficha individual del jugador (`/medico/jugador/$id`).
  - **Grid de Acciones Rápidas (5 Botones en 2 columnas):** `🩺 Nueva Valoración`, `🩹 Registrar Lesión`, `📅 Programar Revisión`, `🏃 Dar Alta Médica`, `📄 Descargar PDF`.

- **Estabilidad y Corrección de Errores SSR / Servidor (`src/server.ts`, `inventario.tsx`, `medico.index.tsx`):**
  - **Fix Error 500 (`NilError`):** Configuración de `ssr: false` en las rutas de cliente (`/inventario` y `/medico`) para prevenir fallos de hidratación en recargas directas del navegador (F5) generados por lectura de storage en Node.
  - **Interceptación de Excepciones Nitro/h3:** Modificado `isCatastrophicSsrErrorBody` en `src/server.ts` para capturar cualquier respuesta JSON con `unhandled: true` y garantizar que el servidor devuelva HTML limpio en lugar de texto plano JSON.
  - **Limpieza de Caché del Router Generator:** Eliminado archivo en conflicto `src/routeTree.gen.ts` para resolver SyntaxErrors en el parser de rutas de TanStack.

---

## [23/07/2026 - Módulo Operativo, Área Técnica v2.0, Planificación Metodológica y Coach OS (Enterprise 2.0)]

- **Dashboard Principal Enterprise 2.0 (`src/routes/_app/dashboard.tsx`):**
  - Reestructuración ejecutiva de 3 niveles: **Nivel 1 (Alertas IA & Insights del Club)** con diagnósticos proactivos de Finanzas, Carga Física, Retención CRM y Performance; **Nivel 2 (Resumen Ejecutivo KPIs Macro)** con métricas financieras, deportivas, metodológicas y ACWR; **Nivel 3 (Panel Dividido)** con feed transversal y minutero de canchas por sedes; **Pie de Pantalla** con embudo de conversión CRM y partidos destacados.

- **Dashboard Interno: Operación Deportiva (`src/routes/_app/operacion.tsx`):**
  - Reorganizado el Sidebar con 4 sub-módulos limpios (`Estructura Base`, `Planificación Temporal`, `Control de Campo`, `Infraestructura`).
  - **Parrilla de Canchas (Minutero en Tiempo Real):** Evaluaciones dinámicas de los horarios y planteles reales de la DB según el día de la semana (`Asoderive U11`, `Asoderive U13`, etc.), eliminando cualquier texto hardcodeado o prefijos estáticos ("Sintética").
  - **KPIs Operativos & Check-ins QR:** Monitoreo dinámico de Asistencia Diaria, Ocupación de Instalaciones, Total Jugadores Activos y Ausencias de Staff.

- **Área Técnica v2.0 & Gobierno Deportivo (`src/routes/_app/tactica.index.tsx`):**
  - Reestructurado el menú desplegable del sidebar con los 6 pilares Enterprise v2.0 (`Inicio / Dashboard Técnico`, `Planificación Metodológica`, `Coach OS`, `Centro Táctico`, `Competiciones`, `Alto Rendimiento`).
  - **Bandeja de Aprobación Metodológica & Flujo IA:** Contraste automático de Athletix AI sobre entregas semanales de los planteles reales del club, incluyendo botón interactivo `[Revisar y Aprobar]` que aprueba dinámicamente la planificación e inyecta las sesiones en Coach OS.
  - **KPIs y Controles:** % Cumplimiento Metodológico, Eficiencia de Planificación, Carga Promedio (ACWR), Alertas Wellness y Diarios pendientes.

- **Submódulo: Planificación Metodológica (`src/routes/_app/tactica.planificacion.tsx`):**
  - **Arquitectura de 3 Pilares:**
    1. **🤖 Motor de Auditoría e IA (Gobernanza):** Bandeja ejecutiva de revisiones y Métricas BI de cumplimiento semanal en vivo totalmente integradas a `RendimientoStore`.
    2. **⚙️ El Taller del Entrenador:** Panel de Mis Planificaciones (Borradores, Enviado a IA, Aprobados), Calendario Semanal Drag & Drop, Biblioteca de Sesiones y Historial.
    3. **📐 El ADN del Club:** Objetivos Formativos por Categoría y Libro de Estilo Institucional (Metodología 4-3-3).
  - Eliminación de datos estáticos y sincronización 100% con los equipos e instituciones reales del club.

- **Módulo Core: Coach OS - El Escritorio del Entrenador (`src/routes/_app/coach.tsx`):**
  - **Menú Exclusivo de 12 Submódulos:** Inicio / Control de Mando, Mi Agenda, Mis Equipos, Planificaciones, Sesiones (Modo Cancha), Biblioteca, Jugadores, Evaluaciones, Alto Rendimiento, Centro Táctico, Competiciones y Reportes & Coach Score.
  - **Flujo Guiado Cronológico (El Viaje del Día):** Barra interactiva guiando al míster hora a hora desde la mañana (Wellness) hasta la tarde (Modo Cancha) y noche (Coach Score).
  - **Flujo Guiado de Campo (Card Interactiva):** Próximo evento en vivo con accesos directos a `📐 VER PIZARRA TÁCTICA`, `📺 VER VIDEOANÁLISIS` y `▶️ INICIAR SESIÓN EN CANCHA`.
  - **Entorno Interactivo Modo Cancha (Modal en Vivo):** Cronómetro flotante en vivo, Escáner/Pase de Lista QR, Checklist de Ejercicios del Día con botón **`[ 📺 Charla Técnica ]`** para proyectar diagramas/videos a los jugadores en la cancha y Diario de Entrenamiento cualitativo.
  - **Reportes & Coach Score Gamificado:** Puntuación Élite 94/100, desglose de fortalezas y sugerencias inteligentes de Athletix AI Advisor para variar estímulos de entrenamiento.
  - **Estructura del Menú Coach OS (6 ítems oficiales):**
    - `🏠 Inicio / Dashboard`: **Centro de Trabajo Diario del Míster (`/coach`)** ➔ Entorno operativo vivo con 4 bloques core (El Minutero, Alertas Wellness, Flujo Guiado de Campo y Checklist de Tareas Pendientes).
    - `⚽ Sesiones`: Modo Cancha con cronómetro en vivo y pase de lista por Check-in QR (`/entrenamientos`).
    - `📚 Biblioteca`: Colección de ejercicios, circuitos, juegos reducidos y plantillas tácticas (`/biblioteca`).
    - `🎯 Objetivos`: Objetivos formativos semanal e individual (`/objetivos`).
    - `📊 Evaluaciones`: Evaluaciones cualitativas y cuantitativas por rúbrica (`/evaluaciones`).
    - `📝 Bitácora`: Diario cualitativo del entrenador (`/diario`).

- **Área Técnica & Gobierno Deportivo (`src/routes/_app/tactica.index.tsx`):**
  - Dashboard exclusivo de **Gobierno Deportivo** (`/tactica`) con KPIs de % Cumplimiento Metodológico, Eficiencia de Planificación, ACWR y Efectividad en Competición.
  - **Bandeja de Auditoría Metodológica & Flujo IA:** Contraste automático de planificaciones entregadas por entrenadores con botón interactivo `[Revisar y Aprobar]` que aprueba e inyecta la sesión en Coach OS.

- **Módulo: Centro Táctico (`src/routes/_app/tactica.*`):**
  - **Dashboard Táctico (`/tactica/dashboard`):** Fila de 4 KPIs (Pizarras Guardadas, Táctica Fija, Minutos de Video, Clips Compartidos), Mesa de Trabajo con Pizarras Recientes y Videoteca Scouting, Buscador IA e indexador por Concepto Táctico (*Transición Ofensiva, Bloque Bajo, Presión Alta, Saques de Banda, Balón Parado*) y botones de acción rápida `[➕ NUEVA PIZARRA TÁCTICA]` y `[➕ SUBIR / ANALIZAR VIDEO]`.
  - **Pizarra Interactiva (`/tactica/pizarra`):** Lienzo interactivo 2D/3D directo (Drag & Drop) con planteles reales de la DB, optimizador de alineación IA e integración a tablet de campo.
  - **Sistemas y Jugadas (`/tactica/jugadas`):** Estrategias de balón parado y sistemas estructurales (4-3-3, 3-5-2).
  - **Videoanálisis (`/tactica/video`):** Reproductor con herramientas de dibujo, recortes de clips y etiquetas scouting.

---


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

## [23/07/2026]
* **Integración del Generador de Sesiones IA con Planificación en Tiempo Real:**
  - Implementación del botón **`🚀 Asignar a Planificación del Coach`** en el módulo de IA (`/ia`).
  - Al guardar, la sesión táctica generada se registra simultáneamente como un plan de microciclo de rendimiento, se inyecta como sesión viva en el planificador de entrenamientos y se actualiza en el store táctico de la categoría correspondiente.
* **Aislamiento Estricto de Planificaciones por Entrenador:**
  - Corrección de la regla de respaldo que mezclaba datos y mostraba por defecto el plan base de Edgar Calderón (U13) a Carlos Araya (U11).
  - Sembrado de planes semanales iniciales independientes para **Carlos Araya** (categoría U11) y **Edgar Calderón** (categoría U13).
  - Refactorización de la lógica de filtrado de planes semanales y mesociclos para aislar estrictamente las vistas según el responsable (`entrenador` / `responsable`), garantizando privacidad y consistencia de datos por coach.
* **Infraestructura de PWA Instalable Móvil & Tablet:**
  - Creación del manifiesto de aplicación web **`manifest.json`** y del Service Worker **`sw.js`** en el directorio público.
  - Registro dinámico del Service Worker en `index.html` y adición de meta-etiquetas PWA optimizadas (`theme-color: #2563eb`, `apple-mobile-web-app-capable`, `apple-touch-icon`) para soportar la instalación nativa como aplicación móvil en iOS (iPad/iPhone) y Android.
* **Ajuste de Identidad Visual (Morado ➔ Azul Real Deportivo `#2563eb`):**
  - Reemplazo general de los estilos morados y violetas (`#8545e8`, `#7839d4`) por **Azul Real Deportivo (`#2563eb`, `#1d4ed8`)** en la barra lateral, botones activos del sidebar, badges, barras de progreso e indicadores de interfaz.
* **Estructura del Sidebar por Rol (Unificación & Restauración):**
  - Se eliminó la duplicidad de la opción *"Planificación"* del menú *Inicio Coach OS*, centralizándolo únicamente dentro del desplegable de **`Centro Táctico`** para entrenadores.
  - Se restauró el menú original de **`Área Técnica`** en el perfil de Administrador, manteniendo sus accesos a *Coach OS* (simulación de entrenadores), *Centro Táctico*, *Competiciones* y *Alto Rendimiento*.
* **Ocultado de la Vercel Toolbar:**
  - Inyección de reglas CSS específicas en `styles.css` para ocultar por completo el widget flotante de feedback y speed insights de Vercel en la versión de producción desplegada.

## [31/07/2026]
* **Rediseño Completo & Suite Táctica Profesional 2D/Video (`CanchaBCoachBoard`):**
  * **Sistema de Animación por Fotogramas / Pasos Tácticos (Playbook 60 FPS)**:
    - Implementación del motor de interpolación fluida a 60 FPS con aceleración cúbica ease-in-out (`requestAnimationFrame`).
    - Captura de fotogramas ilimitados con el botón `+ Paso (N)` y barra de control de reproducción (`Paso 1`, `Paso 2`, `Paso 3`, etc.).
    - Botón de eliminación de pasos individuales `🗑️` y control de pausar/reproducir.
  * **Animación de Pases y Tiros a Marco**:
    - Recorrido realista del balón siguiendo exactamente la trayectoria del pase o tiro trazado por el entrenador.
    - Animación visual de guiones deslizantes en flujo continuo (`bcoachPassFlow`) para trazos de pases punteados.
    - Efecto de pulso resplandeciente (Glow `bcoachShotGlow`) para flechas de tiros a marco.
  * **Conos Naranja & Equipamiento de Entrenamiento**:
    - Fichas vectoriales 2D de Conos de Entrenamiento (`#f97316`) con franja reflectante para circuitos físicos-tácticos y slalom.
    - Mini Arcos de Entrenamiento (`🥅`) vectoriales colocables en cualquier zona del campo.
    - Eliminación de conos y mini arcos integrada con la herramienta borrador `🧽` y la limpieza completa de la pizarra `🧹`.
  * **Guardiola Grid (5 Pasillos Tácticos & Tercios)**:
    - Interruptor `📐 Grid` para alternar la visualización de los 5 pasillos tácticos (Bandas, Pasillos Interiores / Half-spaces y Pasillo Central) y los 3 tercios de cancha.
  * **Banco y Biblioteca de Pizarras Guardadas**:
    - Almacenamiento local + sincronización asíncrona con Supabase (`pizarras`).
    - Carga en 1 toque de plantillas oficiales precargadas: *4-3-3 Ofensiva*, *4-4-2 Bloque Medio*, *4-2-3-1 Presión Alta*, *Futsal 5v5 (Rombo 1-2-1)*, *Juego de Posición 5v4*, *Salida Lavolpiana*.
    - Botones de acción `✏️ Editar` para renombrar ejercicios guardados y `🗑️ Eliminar` para borrar del banco.
  * **Numeración Dinámica de Camisetas por Color de Equipo**:
    - Seguimiento independiente de dorsales por color de uniforme (`orange`, `blue`, `red`, etc.), iniciando siempre en `#1`.
  * **Modal de Confirmación Dark Glassmorphic**:
    - Reemplazo de las ventanas `confirm()` nativas por un diálogo estilizado de vidrio oscuro con badge de advertencia.
  * **Optimización visual y de escala**:
    - Escalado del balón a tamaño proporcional realista (`r={1.15}`) respecto a las fichas de los jugadores (`r={1.8}`).
    - Estilización y centrado automático de etiquetas de texto con cápsulas de cristal (glassmorphism badges) para evitar desbordamientos de pantalla en móviles y tablets.
* **Implementación de Pizarra de Partido (Plan de Juego / Matchday Board) & Filtros de Carlos Araya:**
  * **Convocatoria Real & Dorsales Oficiales**:
    - Carga automática de los 11 titulares convocados de la categoría **U9 Asoderive** en la pizarra con nombres reales y dorsales en cápsulas identificadoras bajo cada ficha.
  * **Estrategia por Fases del Juego**:
    - Selector táctico de 1-clic con 4 fases: *🟢 Ataque Organizado*, *🔴 Bloque Defensivo*, *🔄 Transición* y *🎯 Balón Parado (ABP)*.
  * **Modo Entretiempo / Camerino (15 Minutos)**:
    - Módulo táctico de descanso para tablets/TVs con panel de **Sustituciones en Vivo** (remplazo de titulares por suplentes convocados) y botón **📲 Compartir Ajustes por WhatsApp / Email** para el cuerpo técnico.
  * **Selector de Modo en Cabecera & Accesos Directos**:
    - Desplegable superior para alternar entre *🏆 Modo Partido (Plan de Juego)* y *🏋️ Modo Entrenamiento*.
    - Acceso directo integrado en la Ficha de Convocatorias (`/convocatorias`) y en la Agenda de Partidos (`/partidos`).
  * **Aislamiento U9 Carlos Araya & Módulo CRUD de Eliminación**:
    - Purga total de torneos y rivales de U11 y U13 para Carlos Araya (limitado estrictamente a la categoría Sub-9 / U9 Asoderive).
    - Remoción de Liga Deportiva Alajuelense U9, dejando como único partido agendado el encuentro del 2 de agosto vs **U9 San Jose FC**.
    - Adición de botones de eliminación directa (CRUD Delete con ícono `Trash2`) en Expedientes de Rivales (`/tactica/rivales`) y Agenda de Partidos (`/partidos`).

## [03/08/2026]
* **Aislamiento Multi-Tenant SaaS Estricto y Eliminación de `localStorage`:**
  - **Aislamiento 100% Garantizado**: Remoción de los fallbacks y fallbacks de datos demo en el store (`RendimientoStore`) que causaban fugas cruzadas de datos entre academias (`getJugadores`, `getEquipos`, `getEntrenadores`, `getCategorias`, `getPartidos`, `getSedes`).
  - **Arreglo de Creación de Academias**: `addOrganizacion` ahora ejecuta un `INSERT` directo en la base de datos de Supabase PostgreSQL (`organizaciones`), evitando depender de almacenamiento local efímero. Las nuevas academias (ej. *Baloncesto CR*) arrancan limpias e independizadas desde la DB.
  - **Eliminación Total de `localStorage` en el Store**: Remoción completa de lecturas/escrituras a `localStorage` en `RendimientoStore`. Todos los datos del cliente se gestionan directamente a través del motor `memoryCache` sincronizado en tiempo real con Supabase PostgreSQL.
* **Consistencia de Navegación e Identidad de Academia (Centro de Mando & Banner):**
  - **Centro de Mando (`/saas-admin`)**: Carga del listado de organizaciones directamente desde la base de datos Supabase en tiempo de montaje.
  - **Banner Superior (`AcademyHeaderBanner`) y Barra Lateral (`AppSidebar`)**: Consulta reactiva a la base de datos de Supabase por el `activeOrgId` activo, eliminando la recaída o "fallback" automático en la academia por defecto (*Academia Asoderive*).
  - **Acciones CRUD de Academias en Centro de Mando**: Adición de botones de **Editar** (diálogo con edición de Nombre, Correo, País y Plan), **Desactivar / Activar** (toggle de estado `activo`/`suspendido`), y **Eliminar** (diálogo de confirmación con borrado en cascada en Supabase).
* **Corrección de Errores de Compilación y Renderizado SSR (Fix Error 500):**
  - **Resolución de Error 500 en `/entrenamientos`**: Corrección de una declaración de variable duplicada (`dbOrgs`) en el store durante la sincronización, asegurando compilación limpia en esbuild/Vite y la vista de entrenamientos.
  - **Exportación Default en Rutas**: Adición de `export default EntrenadoresPage` en `entrenadores.index.tsx` para corregir la importación en la ruta `/personal`.
  - **Verificación de Build**: Verificación de compilación de producción limpia (`npm run build`) con 0 errores.
* **Mantenimiento y Control de Versiones**:
  - Actualización del árbol de rutas generado (`src/routeTree.gen.ts`) y sincronización completa con el repositorio remoto de GitHub (`main`).
