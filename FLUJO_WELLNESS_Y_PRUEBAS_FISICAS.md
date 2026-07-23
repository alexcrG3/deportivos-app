# 📋 Especificación Oficial: Flujo de Wellness, Pruebas Físicas e Incidencias en Athletix OS

> **Garantía de Persistencia**: Todo este flujo funciona **100% conectado a la Base de Datos de Supabase (PostgreSQL)**. No se utiliza `localStorage` para el registro de asistencias, encuestas wellness, evaluaciones físicas ni incidencias médicas.

---

## 1. 📱 Flujo de Encuesta Wellness (Padres ➔ Supabase DB ➔ Entrenador en Cancha)

### A. Para el Padre de Familia (Portal `Padres OS`)
- **Frecuencia**: Todos los días de entrenamiento, antes de ir a la cancha.
- **Acceso**: Banner destacado **`❤️ Encuesta Wellness Diaria`** en su panel principal.
- **Tiempo de respuesta**: 15 segundos en el celular.
- **Campos Evaluados**:
  1. 😴 **Calidad del Sueño** (1 = Muy malo, 5 = Excelente)
  2. ⚡ **Nivel de Fatiga** (1 = Ninguna, 5 = Extrema)
  3. 🩹 **Dolores o Molestias** (Ninguna, Rodilla, Tobillo, Crecimiento, etc.)
  4. 😄 **Estado de Ánimo / Estrés** (1 = Estresado, 5 = Excelente)
- **Persistencia**: Se guarda en la tabla Supabase `wellness` asociada al `jugador_id` y la fecha del día (`CURRENT_DATE`).

### B. Para el Entrenador en Cancha (Modo Oscuro / Pantalla de Ingreso)
- Al abrir el **Paso 1: Asistencia en Cancha**, la app consulta Supabase y renderiza automáticamente el **Indicador de Color**:
  - 🟢 **Verde (Óptimo)**: Sueño adecuado, fatiga baja y 0 dolores.
  - 🟡 **Amarillo (Atención)**: Fatiga ligera o molestia menor. *(Al tocar el punto salta el letrero con el comentario que escribió el papá desde la casa)*.
  - 🔴 **Rojo (Alerta)**: Malestar general, fiebre o dolor articular.
- **Contingencia en Cancha**: Si el padre **NO** envió la encuesta desde la casa, el entrenador tiene el botón **`❤️ Encuestar`** sobre la tarjeta del alumno para preguntarle al niño en 3 segundos y marcarlo en pantalla.

---

## 2. ⏱️ Flujo de Pruebas Físicas (Exclusivo del Entrenador ➔ Supabase DB)

### ¿Por qué los Padres NO tienen acceso a las Pruebas Físicas?
- Las **Pruebas Físicas** (Test de Velocidad 30m, Agilidad T-Test, Salto Vertical, Test de Cooper, RPE de Carga) son **mediciones biomecánicas de campo**.
- Requieren cronómetro profesional, conos, protocolo técnico y la supervisión en vivo del entrenador.

### ¿Cómo las toma el Entrenador?
- En el **Paso 2 (Trabajo Específico)** o desde la misma tarjeta del alumno en el **Paso 1**, el profesor presiona **`⏱️ + Test`**.
- Ingresa el tiempo/resultado (ej. `3.85 segundos`) con su cronómetro de mano.
- **Persistencia**: Se guarda en la tabla Supabase `resultados_pruebas` asociada al atleta.

---

## 3. 🚨 Flujo de Lesiones y Cierre de Sesión (Entrenador ➔ Administración)

- Al finalizar la práctica en el **Paso 3 (Cierre de Sesión)**:
  1. **Bitácora por Voz**: El entrenador dicta la nota del entrenamiento mediante el botón de micrófono (`Voice-to-Text`).
  2. **Switch de Lesión Médica**: Si ocurrió un percance, el profesor activa el interruptor de lesión, selecciona al alumno y la gravedad (*Leve*, *Moderada*, *Grave*).
- **Persistencia**: Se guarda en la tabla Supabase `incidencias_lesiones`, notificando automáticamente a la **Oficina de Administración** para activar el **Seguro Médico Deportivo**.

---

## 🗄️ Esquema de Tablas en Supabase DB

| Tabla en Supabase DB | Propósito y Conexión |
| :--- | :--- |
| **`wellness`** | Registra encuestas diarias enviadas por los padres o llenadas en cancha por el entrenador. |
| **`sesiones_entrenamiento`** | Registra el inicio, duración, estado y notas dictadas por el profesor. |
| **`asistencia_registros`** | Guarda las marcas `[P] [T] [A] [J]` por niño de cada sesión. |
| **`resultados_pruebas`** | Registra los tiempos y resultados de las evaluaciones físicas aplicadas por el entrenador. |
| **`incidencias_lesiones`** | Almacena los reportes de lesiones enviados a la Administración para seguros. |
