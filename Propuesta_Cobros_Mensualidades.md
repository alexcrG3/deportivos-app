# Propuesta de Cobros y Mensualidades - Athletix OS

Actualmente, las métricas y reportes financieros del Dashboard de Finanzas (`/finanzas`) y la lista de pagos (`/pagos`) se alimentan de datos estáticos precargados (Mock Data). No hay una opción que defina cuánto vale la mensualidad por categoría o sede, ni un flujo para cobrar de manera real.

A continuación, se detalla la propuesta técnica y operativa para implementar esto de manera dinámica.

---

## 1. Definición del Costo de las Clases (Mensualidad)

Para saber cuánto cobrarle a cada estudiante, debemos definir las tarifas. Proponemos añadir el campo de precio en dos posibles niveles de configuración:

### Opción A: Tarifa por Categoría (Recomendada)
Cada categoría deportiva (ej. *Sub-10*, *Sub-15*, *Fútbol Femenino*) tiene un costo mensual asociado.
* **Cambio en BD/Store:** Añadir el campo `costo_mensual` (numérico) a la tabla/objeto de `Categorias`.
* **Interfaz:** Al crear o editar una categoría en `/categorias`, se añade un input para ingresar el costo mensual (ej. `₡30,000`).

### Opción B: Tarifa Plana por Matrícula del Jugador
El costo se define individualmente en la ficha de cada jugador.
* **Cambio en BD/Store:** Añadir el campo `tarifa_mensual` en el registro de `Jugadores`.

---

## 2. Flujo de Cobro Mensual (Cómo Cobrar)

Proponemos automatizar y estructurar los cobros en 3 pasos:

### Paso 1: Generación de Facturas/Cobros Mensuales (Débito)
Cada inicio de mes (o de forma manual mediante un botón "Generar Cobros del Mes"), el sistema crea un registro de "Cobro Pendiente" para cada jugador activo basado en el costo de su categoría.
* **Nueva Tabla en BD:** `cobros_mensuales`
  - `id` (UUID)
  - `jugador_id` (Relación con Jugadores)
  - `mes` (ej. "2026-07")
  - `monto` (El valor de la mensualidad en ese momento)
  - `estado` (`pendiente`, `pagado`, `vencido`)

### Paso 2: El Registro de Pago (Crédito)
Cuando un padre de familia realiza el pago (ya sea por transferencia, efectivo o tarjeta), el administrador registra el pago en la sección `/pagos`:
1. Hace clic en **"Registrar Pago"**.
2. Selecciona el **Jugador** (autocompletado).
3. Selecciona el **Mes/Cobro** que está cancelando.
4. Ingresa el **Método de pago** (Sinpe Movil, Transferencia, Efectivo) y la **Referencia bancaria**.
5. Al guardar, el estado del cobro del jugador cambia a `pagado` y su saldo pendiente se reduce a 0.

### Paso 3: Sincronización en Tiempo Real con los Dashboards
Con este esquema, los dashboards de `/finanzas` se calcularán sumando dinámicamente los registros de la base de datos:
* **Ingresos del Mes:** Suma de todos los pagos registrados con fecha dentro del mes actual.
* **Por Cobrar:** Suma de todos los cobros del mes actual en estado `pendiente`.
* **Mora Acumulada:** Suma de todos los cobros vencidos de meses anteriores que siguen sin pagarse.

---

## 3. Plan de Implementación de Base de Datos (SQL)

Para habilitar esto en Supabase, ejecutaremos la creación de la tabla de cobros e ingresos:

```sql
-- Tabla para registrar los cobros que se le generan a los jugadores mensualmente
CREATE TABLE public.cobros_mensuales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizacion_id UUID NOT NULL,
    jugador_id UUID REFERENCES public.jugadores(id) ON DELETE CASCADE,
    mes VARCHAR(7) NOT NULL, -- Formato "YYYY-MM"
    monto NUMERIC(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'pagado', 'vencido'
    fecha_limite DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla para el historial de transacciones/pagos recibidos
CREATE TABLE public.pagos_recibidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizacion_id UUID NOT NULL,
    cobro_id UUID REFERENCES public.cobros_mensuales(id) ON DELETE SET NULL,
    jugador_id UUID REFERENCES public.jugadores(id) ON DELETE CASCADE,
    monto NUMERIC(10,2) NOT NULL,
    metodo VARCHAR(50) NOT NULL, -- 'transferencia', 'sinpe', 'efectivo', 'tarjeta'
    referencia VARCHAR(100),
    fecha_pago DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```
