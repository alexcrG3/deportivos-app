# 📖 Manual Detallado Título por Título: Módulo de IA & Automatización (`/ia`)

Este documento especifica de forma exhaustiva qué hace cada **título, subsección, formulario, botón y tarjeta** dentro de las **6 pestañas** del módulo de Inteligencia Artificial de Athletix OS.

---

## 📑 PESTAÑA 1: 🧠 IA DEPORTIVA

### 📌 Título Principal: `Métricas Predictivas & Semáforos de Riesgo`
Muestra el estado fisiológico y de retención de los atletas combinando datos de Wellness, asistencias y carga física acumulada.

#### 1. Filtros de Selección de Atleta y Categoría:
* **Selector de Categoría / Equipo:** Permite filtrar el diagnóstico predictivo para una categoría entera (ej. *Fútbol Sub-10*, *Sub-15*, *Sub-17*, *Mayor*).
* **Selector de Jugador Individual:** Permite seleccionar un atleta específico (ej. *Sofía Rodríguez*, *Santiago Jiménez*) para cargar su expediente predictivo.

#### 2. Sección: Tarjeta de Semáforo de Riesgo de Lesión (ACWR)
* **Semáforo Visual (Verde / Amarillo / Rojo):**
  * **Verde (Zona Dulce 0.8 - 1.3):** Carga física óptima, mínimo riesgo de lesión.
  * **Amarillo (Precaución 1.3 - 1.5):** Fatiga acumulada en aumento.
  * **Rojo (Peligro > 1.5):** Sobrecarga muscular crítica. Requiere reducción del 30% del volumen.
* **Métricas internas:** Muestra el ACWR numérico, el porcentaje de fatiga acumulada y el motivo específico de la alerta (ej. *"Carga semanal aumentada +32%"*).

#### 3. Sección: Tarjeta de Predicción de Abandono Deportivo (Attrition Risk)
* **Probabilidad Numérica (%):** Calcula la posibilidad de desvinculación a 30 días basándose en la tasa de asistencia, wellness de estado de ánimo y retrasos en mensualidades.
* **Factores Desencadenantes:** Lista los motivos del riesgo (ej. *"Asistencia acumulada < 75%"*, *"2 cuotas con atraso"*).

#### 4. Sección: Tarjeta de Proyección de Rendimiento & Test Físicos
* **Estimación a 14 y 30 Días:** Proyecta la evolución en capacidad aeróbica (Vo2Max), potencia de salto e índice de velocidad si el atleta mantiene su Wellness por encima de 85 puntos.

#### 5. Sección: Tabla / Carrusel de Atletas Destacados del Mes
* Muestra el Top 3 de atletas con mejor rendimiento, asistencia perfecta (100%) y progresiones sobresalientes en los tests físicos.

---

## ⚡ PESTAÑA 2: GENERADORES IA

### 📌 Título Principal: `Generadores de Contenido & Planeamiento con IA`

#### 1. Tarjeta: `⚡ Generador Inteligente de Sesiones de Entrenamiento`
* **Campos del Formulario:**
  * `Categoría`: Desplegable para seleccionar la edad objetivo (*Sub-8* hasta *Mayor*).
  * `Objetivo Táctico`: Campo de texto libre para definir la meta del entreno (ej. *"Presión tras pérdida"*, *"Transición rápida"*, *"Salida desde el fondo"*).
  * `Duración (minutos)`: Duración total de la práctica (ej. *60 min*, *90 min*).
  * `Nivel de Dificultad`: Selector de exigencia (*Principiante*, *Intermedio*, *Avanzado/Elite*).
* **Botón de Acción:** `[✨ Generar Sesión con IA]`
* **Área de Resultado:**
  * Muestra el entrenamiento estructurado en 3 fases: **Calentamiento**, **Fase Principal (Ejercicios con variantes)** y **Vuelta a la Calma**.
  * **Botón de Guardado:** `[💾 Guardar como Plantilla en Coach OS]` para usarlo directamente en el módulo de entrenamientos.

#### 2. Tarjeta: `📰 Generador de Crónicas Deportivas para el Muro Social`
* **Campos del Formulario:**
  * `Rival`: Nombre del equipo contrario (ej. *"Deportivo Saprissa Sub-15"*).
  * `Resultado`: Selector de estado (*Victoria*, *Empate*, *Derrota*).
  * `Marcador Propio / Marcador Rival`: Goles o puntos anotados (ej. *3 - 1*).
  * `Jugadores Destacados`: Nombres de las figuras del encuentro.
  * `Nota Táctica del DT`: Comentarios u observaciones del entrenador.
  * `🎙️ Botón de Dictado por Voz`: Permite grabar la nota hablando al micrófono sin necesidad de escribir.
  * `🖼️ Imagen del Partido`: Opción para adjuntar una foto del juego.
* **Botón de Acción:** `[✨ Generar Crónica Narrativa]`
* **Área de Resultado:**
  * Redacta una crónica deportiva periodística lista para ser leída.
  * **Botón de Publicación:** `[🚀 Publicar en el Muro del Club]` para que sea visible por atletas y padres de familia.

---

## 🎯 PESTAÑA 3: ANÁLISIS MODULAR

### 📌 Título Principal: `Diagnóstico por Áreas Especializadas`

#### 1. Módulo: `🩺 Fisiología & Salud (Medical AI)`
* **Título Interno:** *Alertas de Carga, ACWR y Estado Fisiológico*
* **Lo que hace:** Muestra la lista de jugadores bajo seguimiento médico, atletas en rehabilitación y el promedio de Wellness del club (sueño, estrés, dolor muscular y ánimo).

#### 2. Módulo: `💰 Finanzas & Caja (Finance AI)`
* **Título Interno:** *Análisis Financiero, Cobranzas y Morosidad*
* **Lo que hace:** Desglosa el saldo acumulado por cobrar (₡ CRC), el total de mensualidades vencidas (2+ meses) y las cuotas pendientes del mes en curso con accesos rápidos a tutores legales.

#### 3. Módulo: `🎯 Captación & CRM (CRM AI)`
* **Título Interno:** *Embudo de Matrícula & Eficiencia de Prospectos*
* **Lo que hace:** Analiza la cantidad de prospectos (*leads*) en el embudo, la tasa de conversión a alumnos matriculados y el canal publicitario con mayor rendimiento.

#### 4. Módulo: `🏆 Competiciones & Liga (Competition AI)`
* **Título Interno:** *Rendimiento en Liga & Balance de Torneos*
* **Lo que hace:** Analiza la racha de resultados (Victorias/Empates/Derrotas), diferencia de goles y rendimiento en partidos de local vs visitante.

---

## 🔗 PESTAÑA 4: WORKFLOWS & AUTOMATIZACIÓN

### 📌 Título Principal: `Orquestador de Flujos en Segundo Plano`

#### 1. Sección: `Reglas de Automatización Activas`
Muestra las tarjetas con los 4 workflows automatizados del sistema:
* **Workflow 1 (Wellness Crítico):** Se dispara automáticamente si un deportista reporta un Wellness menor a 50 puntos. Notifica de inmediato al preparador físico.
* **Workflow 2 (Recordatorio de Cobranza):** Se ejecuta el día 5 de cada mes enviando un mensaje automático por WhatsApp a los representantes con cuota pendiente.
* **Workflow 3 (Alta Médica RTP):** Notifica al Director Técnico en el Coach OS en el instante que el médico firma la reincorporación de un deportista lesionado.
* **Workflow 4 (Integraciones Externas Webhook):** Dispara notificaciones a endpoints de **n8n / Make**.

#### 2. Sección: `Disparadores & Acciones (Triggers & Actions)`
* Muestra el diagrama lógico de cada flujo: **Disparador (Trigger)** ➔ **Condición** ➔ **Acción ejecutada**.

#### 3. Sección: `Bitácora de Ejecuciones Recientes (Logs)`
* Muestra la tabla de ejecuciones en tiempo real con fecha, hora, estado (*Completado*, *Pausado*, *Error*) y el detalle de la acción efectuada.

---

## 📋 PESTAÑA 5: CENTRO DE ACTIVIDAD

### 📌 Título Principal: `Bitácora de Auditoría & Eficiencia del Motor IA`

#### 1. Sección: `Métricas Globales de Desempeño del Motor`
* **Tarjeta 1 (Latencia Media):** Tiempo promedio de respuesta en milisegundos (ej. *320 ms*).
* **Tarjeta 2 (Costo Acumulado en USD):** Estimación transparente de costo por procesamiento de tokens (ej. *$0.045 USD*).
* **Tarjeta 3 (Tiempo Ahorrado al Personal):** Cálculo de horas/minutos ahorrados al cuerpo técnico por el uso de la IA (ej. *14.5 horas este mes*).
* **Tarjeta 4 (Consultas Procesadas):** Total de peticiones atendidas por el asistente.

#### 2. Sección: `Tabla de Registro de Auditoría (Audit Logs)`
* Muestra la tabla de auditoría detallada línea por línea:
  * `Hora`: Fecha y hora exacta de la consulta.
  * `Rol del Usuario`: Rol del usuario que hizo la pregunta (*Administrador*, *Entrenador*, *Médico*).
  * `Consulta Realizada`: Texto exacto consultado.
  * `Agente Asignado`: Sub-agente que respondió (*Finance AI*, *Medical AI*, *Coach AI*, etc.).
  * `Modelo LLM`: Modelo utilizado (*GPT-4o*, *Gemini 1.5 Pro*, *Claude 3.5*).
  * `Tiempo (ms)` & `Costo ($)`: Latencia y costo en dólares.

---

## ⚙️ PESTAÑA 6: CONFIGURACIÓN IA

### 📌 Título Principal: `Parámetros del Motor IA`

#### 1. Sección: `Modelo LLM de Orquestación`
* **Selector Desplegable:** Permite alternar entre los motores de inteligencia artificial principales:
  * **GPT-4o** (Recomendado para precisión comercial y financiera).
  * **Claude 3.5 Sonnet** (Recomendado para explicaciones técnicas y detalladas).
  * **Gemini 1.5 Pro** (Recomendado para grandes volúmenes de datos).

#### 2. Sección: `Tono de Respuestas`
* **Selector Desplegable:** Permite ajustar el estilo de comunicación del Agente IA:
  * **Profesional & Técnico** (Lenguaje médico, fisiológico y formal).
  * **Cercano & Motivacional** (Tono de apoyo al deportista y familias).
  * **Directo & Resumido** (Respuestas cortas enfocadas en cifras y datos concretos).

#### 3. Sección: `📜 Reglas de la Academia e Instrucciones de Comportamiento (System Prompt)`
* **Cuadro de Texto Amplio (Textarea):** Campo de entrenamiento para escribir las normas personalizadas de tu club.
* **Ejemplos de entrenamiento que puedes escribir aquí:**
  * *"1. Para consultas de montos por cobrar entregar la cifra consolidada en colones (₡)."*
  * *"2. Las cuotas de mensualidad vencen los días 5 de cada mes."*
  * *"3. El número de teléfono oficial para comprobantes de pago SINPE Móvil es +506 8888-8888."*
* El Agente IA obedecerá estrictamente estas instrucciones en todos los chats.

#### 4. Sección: `Automatizaciones en Segundo Plano (Interruptores / Switches)`
* **Switch 1 (Alertas de Wellness Crítico):** Activa/desactiva la revisión cada 24h.
* **Switch 2 (Recordatorios de Morosidad automáticos):** Activa/desactiva el envío automático de WhatsApp los días 5.
* **Switch 3 (Notificaciones de Alta Médica RTP):** Activa/desactiva la notificación al DT tras firma médica.

#### 5. Sección: `Zap / Webhook de Integración n8n / Make`
* **Campo de Texto URL:** Permite ingresar la URL de Webhook para conectar Athletix OS con flujos externos en **n8n**, **Make** o **Zapier** (para sincronizar Google Calendar, enviar correos corporativos o actualizar Google Sheets).

#### 6. Botón Principal: `[Guardar Cambios]`
* Guarda toda la configuración y el entrenamiento del System Prompt en la base de datos de la sede.
