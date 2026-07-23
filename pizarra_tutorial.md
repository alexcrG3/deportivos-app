# Manual de Usuario: Pizarra Táctica de DeportivOS 🧠📋
*¡Guía rápida paso a paso diseñada para entrenadores y cuerpo técnico!*

---

## 📌 Introducción
La **Pizarra Táctica** es una herramienta profesional interactiva diseñada para planificar formaciones de partidos, crear ejercicios de entrenamientos y analizar la disposición estratégica de tu equipo en tiempo real, directamente conectada con los datos de **Supabase**.

---

## 🛠️ Fila 1: Selectores de Configuración Base (Barra Superior)
Esta fila te permite parametrizar las reglas de la cancha y el contexto del encuentro:

```
[ Partido / Entrenamiento ]   [ Fútbol ▾ ]   [ U13 vs Club Heredia FC... ▾ ]   [ 4-3-3 ▾ ]   [ 👥 Ocultar/Mostrar Plantel ]
```

### 1. Selector de Modo: `[ Partido / Entrenamiento ]`
*   **Modo Partido**: Habilita la selección de partidos programados y carga automáticamente la lista de jugadores **Convocados** de la base de datos.
*   **Modo Entrenamiento**: Limpia las alineaciones de partidos y te permite seleccionar cualquiera de tus equipos completos (ej. U13, U15) para diseñar jugadas o prácticas generales en base a toda la plantilla del club.

### 2. Selector de Deporte: `[ Fútbol ▾ ]`
*   Configura el tapiz del campo de juego (Líneas de la cancha de fútbol 11, fútbol 5/futsal, baloncesto, voleibol, tenis, etc.).
*   Ajusta automáticamente las posiciones ideales y la cantidad reglamentaria de jugadores correspondientes a la disciplina deportiva elegida.

### 3. Selector de Partido / Equipo: `[ U13 vs Club Heredia FC... ▾ ]`
*   **Si estás en Modo Partido**: Muestra la lista de encuentros oficiales agendados. Al seleccionar un partido, la pizarra se vincula a esa fecha y carga el oponente.
*   **Si estás en Modo Entrenamiento**: Muestra tu lista de equipos a cargo para cargar su plantilla en la barra lateral derecha.

### 4. Selector de Formación: `[ 4-3-3 ▾ ]`
*   Te permite cambiar de forma instantánea el esquema base del equipo en campo (ej. `4-3-3`, `4-4-2`, `3-5-2`, `5-3-2`).
*   Al elegir una formación, se colocan automáticamente "Fichas Fantasma" (círculos vacíos) en las posiciones ideales de la cancha para que sirvan de guía.

### 5. Botón `👥 Ocultar / Mostrar Plantel`
*   Maximiza la visibilidad de la pizarra táctica ocultando el panel de jugadores de la derecha, ideal para cuando se expone en pantallas o tablets.

---

## 🧠 Fila 2: El Motor de Inteligencia Competitiva (IA & Datos)
Esta fila ejecuta las simulaciones, recomendaciones tácticas y chequeos físicos basados en los datos del club:

```
[ 🧠 Analizar Partido ]   [ ✨ Optimizar Alineación ]   [ ⚡ Simulador ]   [ Disponibilidad ]
```

### 1. `🧠 Analizar Partido`
*   **Qué hace**: Lanza el motor de Inteligencia Artificial para evaluar tu esquema seleccionado contra el sistema del rival.
*   **El resultado**: Te abre un informe táctico detallando las ventajas de tu formación actual, desventajas/riesgos tácticos frente al rival y sugerencias para contrarrestar sus fortalezas.

### 2. `✨ Optimizar Alineación`
*   **Qué hace**: Analiza el estado físico diario de todos tus convocados (recovery score, fatiga y dolores) y calcula la mejor alineación de 11 inicial posible.
*   **El resultado**: Coloca automáticamente a los jugadores más en forma en sus respectivas posiciones ideales dentro de la cancha, ahorrándote el armado manual.

### 3. `⚡ Simulador`
*   **Qué hace**: Abre una comparativa estadística visual frente a frente contra el rival (altura promedio, velocidad media de la plantilla, índice de posesión reciente y puntajes de recuperación de rendimiento).

### 4. `Disponibilidad`
*   **Qué hace**: Muestra un resumen rápido del estado físico general de tu convocatoria: cuántos jugadores están aptos al 100%, cuántos con fatiga ligera y si hay alguno descartado por sobrecarga o lesión médica.

---

## ✏️ Fila 3: Herramientas de Dibujo y Edición (Líneas y Zonas)
Esta barra contiene los pinceles tácticos interactivos:

```
[ ⬈ Seleccionar ]   [ ➜ Pase ]   [ ➜ Movimiento ]   [ ➜ Disparo ]   [ ▢ Zona ]   [ ◯ Cono ]   [ 🗑️ Borrar ]
```

*   **`⬈ Seleccionar` (Herramienta principal)**: Te permite arrastrar libremente a los jugadores a cualquier parte de la cancha. **¡Truco!** Si seleccionas una flecha dibujada, aparecerán opciones en la barra inferior para **Invertir su curva (Izquierda/Derecha)** o convertirla en línea recta.
*   **`➜ Pase` (Línea verde continua)**: Dibuja la trayectoria del balón.
*   **`➜ Movimiento` (Línea amarilla punteada)**: Representa el desmarque, carrera o desplazamiento de un jugador sin balón.
*   **`➜ Disparo` (Línea roja continua)**: Dibuja la trayectoria del remate o tiro a portería.
*   **`▢ Zona`**: Arrastra sobre la cancha para sombrear un área táctica específica (ej. zona de presión o bloque defensivo).
*   **`◯ Cono`**: Coloca conos naranjas en la cancha para diseñar circuitos de entrenamiento y ejercicios físicos.
*   **`🗑️ Borrar`**: Haz clic en cualquier elemento (línea, cono, zona) para eliminarlo individualmente de la pizarra.

---

## 👥 Panel Derecho: Lista de Jugadores e Interacción
El panel lateral te permite meter y sacar jugadores de la pizarra:

*   **Añadir al campo (`+`)**: Haz clic en el botón verde de suma al lado de cualquier jugador de la lista. El sistema buscará su posición natural y lo colocará automáticamente en su lugar correspondiente en la cancha (ej. si es lateral izquierdo, irá a la banda izquierda; si es portero, directo al marco).
*   **Quitar del campo (`x`)**: Haz clic en el botón rojo para retirar al jugador de la pizarra y devolver su ficha a la lista del plantel.
*   **Semáforo de Carga**: El pequeño círculo verde, amarillo o rojo al lado del nombre de cada jugador te indica visualmente y al instante su nivel de fatiga física diario antes de que lo coloques en la pizarra.

---

## ⚡ Utilidades Específicas por Modo (Partido vs. Entrenamiento)

Aquí detallamos qué objetivos persigue cada uno de los dos modos de la pizarra y qué puedes lograr con ellos:

### 📅 Modo Partido (Para preparar el día de competición)
Este modo está enfocado en la preparación del próximo compromiso oficial del calendario.
*   **Alineación Oficial**: Puedes diseñar el 11 titular que saltará al campo y distribuirlo en el esquema táctico.
*   **Gestión de Convocados**: La barra lateral solo te mostrará los jugadores que fueron seleccionados oficialmente en la convocatoria (dejando fuera a los que quedaron en reserva por descanso, rotación o lesión).
*   **Análisis del Rival**: Permite desplegar las 11 fichas rojas del equipo rival basándose en su sistema base guardado. Así puedes prever sus movimientos, ensayar coberturas defensivas y planificar la presión alta.
*   **Simulación IA**: El recomendador te ayuda a ajustar los emparejamientos individuales para neutralizar a los jugadores clave del oponente antes del partido del fin de semana.

### 🏃 Modo Entrenamiento (Para diseñar jugadas y sesiones prácticas)
Este modo está enfocado en la enseñanza diaria en el campo de entrenamiento y desarrollo de conceptos.
*   **Acceso a Plantilla Completa**: Te permite cargar a **todos** los deportistas registrados en el equipo (sin importar si están convocados a un partido o no).
*   **Diseño de Jugadas Preparadas (ABP)**: Útil para crear jugadas de tiro libre, saques de esquina o salidas de presión y guardarlas en la biblioteca táctica del club.
*   **Circuitos Físicos y Técnicos**: Utiliza la herramienta de **Conos** y **Zonas** para dibujar las estaciones de trabajo físico, zonas de posesión (rondos) o espacios reducidos directamente sobre la pizarra y compartirlas con tus asistentes.
*   **Explicaciones Didácticas**: Funciona como un bloc táctico interactivo rápido para explicarle a los jugadores un movimiento específico durante la sesión de entrenamiento.

