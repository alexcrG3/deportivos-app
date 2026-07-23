import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import RendimientoStore from "@/lib/rendimiento-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Package, PackageOpen, PackageCheck, PackageX, Boxes, Archive,
  ArrowRightLeft, Plus, Search, AlertTriangle, AlertCircle, Clock,
  BarChart3, Check, RotateCcw, TrendingDown,
  ShieldAlert, CalendarX, ChevronRight, FileDown,
  Filter, Tag, Layers3, Eye, Pencil, Trash2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

export const Route = createFileRoute("/_app/inventario")({ component: InventarioPage });

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
type EstadoItem = "disponible" | "stock_bajo" | "critico" | "vencido" | "prestado";
type EstadoPrestamo = "activo" | "devuelto" | "vencido";
type EstadoDevolucion = "bueno" | "danado" | "perdido";

interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  descripcion: string;
}

interface ArticuloInventario {
  id: string;
  nombre: string;
  categoriaId: string;
  descripcion: string;
  stockActual: number;
  stockMinimo: number;
  stockTotal: number;
  unidad: string;
  ubicacion: string;
  fechaVencimiento?: string;
  fechaRevision?: string;
  icono: string;
  precio?: number;
}

interface Prestamo {
  id: string;
  articuloId: string;
  responsable: string;
  cargo: string;
  cantidad: number;
  fechaPrestamo: string;
  fechaDevolucionEsperada: string;
  fechaDevolucionReal?: string;
  estado: EstadoPrestamo;
  estadoDevolucion?: EstadoDevolucion;
  notas: string;
}

interface MovimientoKardex {
  id: string;
  articuloId: string;
  tipo: "entrada" | "salida" | "prestamo" | "devolucion" | "baja";
  cantidad: number;
  fecha: string;
  responsable: string;
  notas: string;
}

// ─────────────────────────────────────────────
//  MOCK DATA
// ─────────────────────────────────────────────
const CATEGORIAS_INIT: Categoria[] = [
  { id: "c1", nombre: "Balones", icono: "⚽", color: "bg-orange-500/15 text-orange-600 border-orange-500/30", descripcion: "Balones de entrenamiento y competición" },
  { id: "c2", nombre: "Mallas y Redes", icono: "🥅", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", descripcion: "Mallas de portería y redes de delimitación" },
  { id: "c3", nombre: "Conos y Señalizadores", icono: "🔶", color: "bg-amber-500/15 text-amber-600 border-amber-500/30", descripcion: "Conos fluorescentes y señalizadores de campo" },
  { id: "c4", nombre: "Petos y Uniformes", icono: "👕", color: "bg-violet-500/15 text-violet-600 border-violet-500/30", descripcion: "Petos de entrenamiento y uniformes" },
  { id: "c5", nombre: "Equipamiento GPS", icono: "📡", color: "bg-sky-500/15 text-sky-600 border-sky-500/30", descripcion: "Chalecos GPS y wearables de rendimiento" },
  { id: "c6", nombre: "Material Médico", icono: "🏥", color: "bg-red-500/15 text-red-600 border-red-500/30", descripcion: "Botiquines y material de primeros auxilios" },
  { id: "c7", nombre: "Agilidad y Coordinación", icono: "🪜", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", descripcion: "Escaleras, vallas y materiales de coordinación" },
  { id: "c8", nombre: "Cronómetros y Tecnología", icono: "⏱️", color: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30", descripcion: "Cronómetros digitales y equipos tecnológicos" },
  { id: "c9", nombre: "Chalecos", icono: "🦺", color: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30", descripcion: "Chalecos de entrenamiento, petos tácticos con dorsal e infantiles" },
];


const ARTICULOS_INIT: ArticuloInventario[] = [
  { id: "a1", nombre: "Balón Adidas Champions #5", categoriaId: "c1", descripcion: "Balón oficial de entrenamiento talla 5", stockActual: 35, stockMinimo: 15, stockTotal: 40, unidad: "unidades", ubicacion: "Bodega Principal – Estante A", icono: "⚽", precio: 25000 },
  { id: "a2", nombre: "Balón Nike #4 Juvenil", categoriaId: "c1", descripcion: "Balón categoría juvenil talla 4", stockActual: 8, stockMinimo: 10, stockTotal: 20, unidad: "unidades", ubicacion: "Bodega Principal – Estante A", icono: "⚽", precio: 18000 },
  { id: "a3", nombre: "Balón Mini Infantil #3", categoriaId: "c1", descripcion: "Balón para categorías sub-8 y sub-10", stockActual: 2, stockMinimo: 8, stockTotal: 12, unidad: "unidades", ubicacion: "Bodega Principal – Estante A", icono: "⚽", precio: 12000 },
  { id: "a4", nombre: "Malla de Portería Oficial", categoriaId: "c2", descripcion: "Malla para portería reglamentaria 7.32m x 2.44m", stockActual: 4, stockMinimo: 2, stockTotal: 6, unidad: "pares", ubicacion: "Bodega Principal – Zona Redes", icono: "🥅", precio: 85000 },
  { id: "a5", nombre: "Malla Portería Mini", categoriaId: "c2", descripcion: "Malla portería mini para entrenamiento infantil", stockActual: 6, stockMinimo: 2, stockTotal: 8, unidad: "pares", ubicacion: "Bodega Principal – Zona Redes", icono: "🥅", precio: 35000 },
  { id: "a6", nombre: "Conos Fluorescentes Naranja", categoriaId: "c3", descripcion: "Conos de señalización de 23cm", stockActual: 110, stockMinimo: 50, stockTotal: 120, unidad: "unidades", ubicacion: "Bodega Principal – Estante C", icono: "🔶", precio: 1500 },
  { id: "a7", nombre: "Estacas de Señalización", categoriaId: "c3", descripcion: "Estacas multicolor para circuitos de entrenamiento", stockActual: 40, stockMinimo: 20, stockTotal: 50, unidad: "unidades", ubicacion: "Bodega Principal – Estante C", icono: "🔶", precio: 800 },
  { id: "a8", nombre: "Petos Azules Talla Única", categoriaId: "c4", descripcion: "Petos de entrenamiento reversibles azul/blanco", stockActual: 22, stockMinimo: 15, stockTotal: 30, unidad: "unidades", ubicacion: "Bodega Principal – Estante B", icono: "👕", precio: 5500 },
  { id: "a9", nombre: "Petos Rojos Talla Única", categoriaId: "c4", descripcion: "Petos de entrenamiento reversibles rojo/amarillo", stockActual: 18, stockMinimo: 15, stockTotal: 28, unidad: "unidades", ubicacion: "Bodega Principal – Estante B", icono: "👕", precio: 5500 },
  { id: "a10", nombre: "Chalecos GPS Catapult", categoriaId: "c5", descripcion: "Chalecos con pod GPS para métricas de rendimiento", stockActual: 7, stockMinimo: 5, stockTotal: 10, unidad: "unidades", ubicacion: "Vitrina Tecnología", icono: "📡", precio: 350000, fechaRevision: "2025-03-15" },
  { id: "a11", nombre: "Botiquín Primeros Auxilios Completo", categoriaId: "c6", descripcion: "Botiquín certificado con material de primeros auxilios deportivos", stockActual: 2, stockMinimo: 2, stockTotal: 2, unidad: "unidades", ubicacion: "Enfermería", icono: "🏥", precio: 45000, fechaVencimiento: "2025-01-10" },
  { id: "a12", nombre: "Escaleras de Agilidad 6m", categoriaId: "c7", descripcion: "Escalera plana de coordinación y agilidad 6 metros", stockActual: 5, stockMinimo: 3, stockTotal: 6, unidad: "unidades", ubicacion: "Bodega Principal – Estante D", icono: "🪜", precio: 22000 },
  { id: "a13", nombre: "Cronómetros Digitales Robic", categoriaId: "c8", descripcion: "Cronómetros profesionales para control de tiempos y recuperación", stockActual: 4, stockMinimo: 3, stockTotal: 8, unidad: "unidades", ubicacion: "Vitrina Tecnología", icono: "⏱️", precio: 18000, fechaRevision: "2025-02-28" },
  { id: "a14", nombre: "Vallas de Coordinación 50cm", categoriaId: "c7", descripcion: "Mini vallas plegables para trabajos de coordinación", stockActual: 20, stockMinimo: 10, stockTotal: 20, unidad: "unidades", ubicacion: "Bodega Principal – Estante D", icono: "🪜", precio: 8500 },
  { id: "a15", nombre: "Chalecos de Entrenamiento Amarillos", categoriaId: "c9", descripcion: "Chalecos de entrenamiento talla adulto, color amarillo fluorescente", stockActual: 20, stockMinimo: 15, stockTotal: 25, unidad: "unidades", ubicacion: "Bodega Principal – Estante B", icono: "🦺", precio: 6500 },
  { id: "a16", nombre: "Chalecos de Entrenamiento Verdes", categoriaId: "c9", descripcion: "Chalecos de entrenamiento talla adulto, color verde limón", stockActual: 18, stockMinimo: 15, stockTotal: 20, unidad: "unidades", ubicacion: "Bodega Principal – Estante B", icono: "🦺", precio: 6500 },
  { id: "a17", nombre: "Chalecos Infantiles Naranja", categoriaId: "c9", descripcion: "Chalecos talla infantil para categorías Sub-10 y Sub-12", stockActual: 12, stockMinimo: 10, stockTotal: 15, unidad: "unidades", ubicacion: "Bodega Principal – Estante B", icono: "🦺", precio: 5000 },
  { id: "a18", nombre: "Chalecos Tácticos con Dorsal", categoriaId: "c9", descripcion: "Chalecos numerados del 1 al 20 para prácticas tácticas", stockActual: 20, stockMinimo: 20, stockTotal: 20, unidad: "unidades", ubicacion: "Bodega Principal – Estante B", icono: "🦺", precio: 9500 },
];


const PRESTAMOS_INIT: Prestamo[] = [
  { id: "p1", articuloId: "a1", responsable: "Andrés Mora", cargo: "Entrenador Sub-17", cantidad: 5, fechaPrestamo: "2025-01-08", fechaDevolucionEsperada: "2025-01-20", estado: "activo", notas: "Para torneo inter-ligas" },
  { id: "p2", articuloId: "a10", responsable: "Carlos Vega", cargo: "Preparador Físico", cantidad: 3, fechaPrestamo: "2025-01-10", fechaDevolucionEsperada: "2025-01-17", estado: "vencido", notas: "Sesión de tests físicos Sub-15" },
  { id: "p3", articuloId: "a13", responsable: "Luis Rodríguez", cargo: "Entrenador Sub-13", cantidad: 2, fechaPrestamo: "2025-01-05", fechaDevolucionEsperada: "2025-01-12", estado: "devuelto", estadoDevolucion: "bueno", fechaDevolucionReal: "2025-01-12", notas: "" },
  { id: "p4", articuloId: "a2", responsable: "Sofía Alvarado", cargo: "Entrenadora Femenino", cantidad: 4, fechaPrestamo: "2025-01-14", fechaDevolucionEsperada: "2025-01-22", estado: "activo", notas: "Entrenamiento técnico-táctico" },
];

const MOVIMIENTOS_INIT: MovimientoKardex[] = [
  { id: "m1", articuloId: "a1", tipo: "entrada", cantidad: 10, fecha: "2025-01-02", responsable: "Admin", notas: "Compra de repuesto temporada 2025" },
  { id: "m2", articuloId: "a1", tipo: "prestamo", cantidad: 5, fecha: "2025-01-08", responsable: "Andrés Mora", notas: "Torneo inter-ligas" },
  { id: "m3", articuloId: "a11", tipo: "entrada", cantidad: 2, fecha: "2024-11-15", responsable: "Admin", notas: "Reposición anual" },
  { id: "m4", articuloId: "a13", tipo: "prestamo", cantidad: 2, fecha: "2025-01-05", responsable: "Luis Rodríguez", notas: "" },
  { id: "m5", articuloId: "a13", tipo: "devolucion", cantidad: 2, fecha: "2025-01-12", responsable: "Luis Rodríguez", notas: "Devuelto en buen estado" },
  { id: "m6", articuloId: "a3", tipo: "baja", cantidad: 2, fecha: "2025-01-06", responsable: "Admin", notas: "Daño irreparable en entrenamiento" },
  { id: "m7", articuloId: "a10", tipo: "prestamo", cantidad: 3, fecha: "2025-01-10", responsable: "Carlos Vega", notas: "Tests físicos" },
];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const today = new Date().toISOString().split("T")[0];

function getEstadoArticulo(a: ArticuloInventario, prestamos: Prestamo[]): EstadoItem {
  if (a.fechaVencimiento && a.fechaVencimiento < today) return "vencido";
  const prestado = prestamos.filter(p => p.articuloId === a.id && p.estado === "activo")
    .reduce((sum, p) => sum + p.cantidad, 0);
  if (a.stockActual === 0 && prestado > 0) return "prestado";
  if (a.stockActual <= 0) return "critico";
  if (a.stockActual < a.stockMinimo) return "stock_bajo";
  return "disponible";
}

function diasRestantes(fecha: string): number {
  return Math.ceil((new Date(fecha).getTime() - new Date(today).getTime()) / 86400000);
}

function formatFecha(f: string) {
  return new Date(f + "T12:00:00").toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCRC(n: number) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n);
}

const ESTADO_CONFIG: Record<EstadoItem, { label: string; color: string; icon: typeof Package; dot: string }> = {
  disponible: { label: "Disponible", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: PackageCheck, dot: "bg-emerald-500" },
  stock_bajo: { label: "Stock Bajo", color: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: AlertTriangle, dot: "bg-amber-500" },
  critico: { label: "Crítico", color: "bg-red-500/15 text-red-600 border-red-500/30", icon: AlertCircle, dot: "bg-red-500 animate-pulse" },
  vencido: { label: "Vencido", color: "bg-slate-500/15 text-slate-500 border-slate-500/30", icon: CalendarX, dot: "bg-slate-500" },
  prestado: { label: "Prestado", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: PackageOpen, dot: "bg-blue-500" },
};

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────
function InventarioPage() {
  const [articulos, setArticulos] = useState<ArticuloInventario[]>(ARTICULOS_INIT);
  const [prestamos, setPrestamos] = useState<Prestamo[]>(PRESTAMOS_INIT);
  const [movimientos, setMovimientos] = useState<MovimientoKardex[]>(MOVIMIENTOS_INIT);
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_INIT);

  const [searchArticulos, setSearchArticulos] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [filterEstado, setFilterEstado] = useState("all");
  const [activeTab, setActiveTab] = useState("dashboard");

  // Modals
  const [modalArticulo, setModalArticulo] = useState(false);
  const [modalPrestamo, setModalPrestamo] = useState(false);
  const [modalDevolucion, setModalDevolucion] = useState<Prestamo | null>(null);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [articuloDetalle, setArticuloDetalle] = useState<ArticuloInventario | null>(null);

  // Form states
  const [formArticulo, setFormArticulo] = useState<Partial<ArticuloInventario>>({});
  const [editingArticulo, setEditingArticulo] = useState<ArticuloInventario | null>(null);
  const [formEdicion, setFormEdicion] = useState<Partial<ArticuloInventario>>({});
  const [formPrestamo, setFormPrestamo] = useState<Partial<Prestamo & { articuloNombre: string }>>({});
  const [formCategoria, setFormCategoria] = useState<Partial<Categoria>>({});
  const [estadoDevolucionForm, setEstadoDevolucionForm] = useState<EstadoDevolucion>("bueno");

  // ── Entrenadores del sistema
  const [entrenadores, setEntrenadores] = useState<any[]>([]);
  useEffect(() => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const fromStore = RendimientoStore.get<any[]>("entrenadores_dynamics", []);
    const filtered = fromStore.filter((c: any) =>
      !c.organizacion_id || c.organizacion_id === orgId
    );
    setEntrenadores(filtered);
  }, []);

  // ── Derived stats
  const estadosArticulos = useMemo(() =>
    articulos.map(a => ({ ...a, estado: getEstadoArticulo(a, prestamos) })),
    [articulos, prestamos]
  );

  const totalItems = articulos.reduce((s, a) => s + a.stockActual, 0);
  const totalValor = articulos.reduce((s, a) => s + (a.stockActual * (a.precio ?? 0)), 0);
  const prestamosActivos = prestamos.filter(p => p.estado === "activo");
  const prestamosVencidos = prestamos.filter(p => p.estado === "vencido");
  const itemsBajoStock = estadosArticulos.filter(a => a.estado === "stock_bajo" || a.estado === "critico");
  const itemsVencidos = estadosArticulos.filter(a => a.estado === "vencido");
  const alertasCount = itemsBajoStock.length + itemsVencidos.length + prestamosVencidos.length;

  // Chart data
  const chartCategoria = useMemo(() => categorias.map(c => ({
    name: c.nombre.split(" ")[0],
    cantidad: articulos.filter(a => a.categoriaId === c.id).reduce((s, a) => s + a.stockActual, 0),
    fill: ["#f97316", "#3b82f6", "#f59e0b", "#8b5cf6", "#0ea5e9", "#ef4444", "#10b981", "#6366f1"][categorias.indexOf(c) % 8],
  })), [articulos, categorias]);

  // Filtered articulos
  const articulosFiltrados = useMemo(() => estadosArticulos.filter(a => {
    const matchSearch = a.nombre.toLowerCase().includes(searchArticulos.toLowerCase()) ||
      a.ubicacion.toLowerCase().includes(searchArticulos.toLowerCase());
    const matchCat = filterCategoria === "all" || a.categoriaId === filterCategoria;
    const matchEstado = filterEstado === "all" || a.estado === filterEstado;
    return matchSearch && matchCat && matchEstado;
  }), [estadosArticulos, searchArticulos, filterCategoria, filterEstado]);

  // ── Actions
  function guardarArticulo() {
    if (!formArticulo.nombre || !formArticulo.categoriaId) {
      toast.error("Nombre y categoría son obligatorios");
      return;
    }
    const nuevo: ArticuloInventario = {
      id: `a${Date.now()}`,
      nombre: formArticulo.nombre!,
      categoriaId: formArticulo.categoriaId!,
      descripcion: formArticulo.descripcion ?? "",
      stockActual: Number(formArticulo.stockActual ?? 0),
      stockMinimo: Number(formArticulo.stockMinimo ?? 0),
      stockTotal: Number(formArticulo.stockTotal ?? formArticulo.stockActual ?? 0),
      unidad: formArticulo.unidad ?? "unidades",
      ubicacion: formArticulo.ubicacion ?? "",
      icono: formArticulo.icono ?? "📦",
      precio: Number(formArticulo.precio ?? 0),
      fechaVencimiento: formArticulo.fechaVencimiento,
      fechaRevision: formArticulo.fechaRevision,
    };
    setArticulos(prev => [...prev, nuevo]);
    setMovimientos(prev => [...prev, {
      id: `m${Date.now()}`,
      articuloId: nuevo.id,
      tipo: "entrada",
      cantidad: nuevo.stockActual,
      fecha: today,
      responsable: "Admin",
      notas: "Registro inicial de artículo",
    }]);
    toast.success(`"${nuevo.nombre}" agregado al inventario`);
    setModalArticulo(false);
    setFormArticulo({});
  }

  function guardarPrestamo() {
    if (!formPrestamo.articuloId || !formPrestamo.responsable || !formPrestamo.cantidad || !formPrestamo.fechaDevolucionEsperada) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    const articulo = articulos.find(a => a.id === formPrestamo.articuloId);
    if (!articulo || articulo.stockActual < Number(formPrestamo.cantidad)) {
      toast.error("Stock insuficiente para el préstamo");
      return;
    }
    const nuevoPrestamo: Prestamo = {
      id: `p${Date.now()}`,
      articuloId: formPrestamo.articuloId!,
      responsable: formPrestamo.responsable!,
      cargo: formPrestamo.cargo ?? "",
      cantidad: Number(formPrestamo.cantidad),
      fechaPrestamo: today,
      fechaDevolucionEsperada: formPrestamo.fechaDevolucionEsperada!,
      estado: "activo",
      notas: formPrestamo.notas ?? "",
    };
    setPrestamos(prev => [...prev, nuevoPrestamo]);
    setArticulos(prev => prev.map(a => a.id === formPrestamo.articuloId ? { ...a, stockActual: a.stockActual - Number(formPrestamo.cantidad) } : a));
    setMovimientos(prev => [...prev, { id: `m${Date.now()}`, articuloId: formPrestamo.articuloId!, tipo: "prestamo", cantidad: Number(formPrestamo.cantidad), fecha: today, responsable: formPrestamo.responsable!, notas: formPrestamo.notas ?? "" }]);
    toast.success("Préstamo registrado correctamente");
    setModalPrestamo(false);
    setFormPrestamo({});
  }

  function registrarDevolucion(prestamo: Prestamo) {
    const articulo = articulos.find(a => a.id === prestamo.articuloId);
    const deltaStock = estadoDevolucionForm === "perdido" ? 0 : prestamo.cantidad;
    setPrestamos(prev => prev.map(p => p.id === prestamo.id ? { ...p, estado: "devuelto", estadoDevolucion: estadoDevolucionForm, fechaDevolucionReal: today } : p));
    if (deltaStock > 0 && articulo) {
      setArticulos(prev => prev.map(a => a.id === prestamo.articuloId ? { ...a, stockActual: a.stockActual + deltaStock } : a));
    }
    setMovimientos(prev => [...prev, { id: `m${Date.now()}`, articuloId: prestamo.articuloId, tipo: "devolucion", cantidad: prestamo.cantidad, fecha: today, responsable: prestamo.responsable, notas: `Estado: ${estadoDevolucionForm}` }]);
    toast.success("Devolución registrada");
    setModalDevolucion(null);
    setEstadoDevolucionForm("bueno");
  }

  function guardarCategoria() {
    if (!formCategoria.nombre) { toast.error("El nombre es obligatorio"); return; }
    const nueva: Categoria = {
      id: `cat${Date.now()}`,
      nombre: formCategoria.nombre!,
      icono: formCategoria.icono ?? "📦",
      color: "bg-slate-500/15 text-slate-600 border-slate-500/30",
      descripcion: formCategoria.descripcion ?? "",
    };
    setCategorias(prev => [...prev, nueva]);
    toast.success("Categoría creada");
    setModalCategoria(false);
    setFormCategoria({});
  }

  function getCatNombre(id: string) {
    return categorias.find(c => c.id === id)?.nombre ?? "—";
  }
  function getCatIcono(id: string) {
    return categorias.find(c => c.id === id)?.icono ?? "📦";
  }
  function getArticuloNombre(id: string) {
    return articulos.find(a => a.id === id)?.nombre ?? "—";
  }

  function guardarEdicion() {
    if (!editingArticulo || !formEdicion.nombre || !formEdicion.categoriaId) {
      toast.error("Nombre y categoría son obligatorios");
      return;
    }
    setArticulos(prev => prev.map(a => a.id === editingArticulo.id ? { ...a, ...formEdicion } as ArticuloInventario : a));
    toast.success(`"${formEdicion.nombre}" actualizado correctamente`);
    setEditingArticulo(null);
    setFormEdicion({});
  }

  function eliminarArticulo(art: ArticuloInventario) {
    const tienePrestamoActivo = prestamos.some(p => p.articuloId === art.id && p.estado === "activo");
    if (tienePrestamoActivo) {
      toast.error("No se puede eliminar: el artículo tiene préstamos activos");
      return;
    }
    if (!window.confirm(`¿Eliminar "${art.nombre}" del inventario? Esta acción no se puede deshacer.`)) return;
    setArticulos(prev => prev.filter(a => a.id !== art.id));
    setMovimientos(prev => [...prev, {
      id: `m${Date.now()}`,
      articuloId: art.id,
      tipo: "baja",
      cantidad: art.stockActual,
      fecha: today,
      responsable: "Admin",
      notas: "Artículo eliminado del inventario",
    }]);
    toast.success(`"${art.nombre}" eliminado del inventario`);
  }

  const TIPO_MOV_CONFIG: Record<string, { label: string; color: string }> = {
    entrada: { label: "Entrada", color: "bg-emerald-500/15 text-emerald-600" },
    salida: { label: "Salida", color: "bg-red-500/15 text-red-600" },
    prestamo: { label: "Préstamo", color: "bg-blue-500/15 text-blue-600" },
    devolucion: { label: "Devolución", color: "bg-indigo-500/15 text-indigo-600" },
    baja: { label: "Baja / Merma", color: "bg-slate-500/15 text-slate-500" },
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Boxes className="h-6 w-6 text-primary" />
            Inventario Deportivo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestión integral de materiales, equipamiento y préstamos de la academia</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setModalPrestamo(true); setFormPrestamo({}); }}>
            <ArrowRightLeft className="h-3.5 w-3.5" /> Nuevo Préstamo
          </Button>
          <Button size="sm" className="gap-1.5 bg-gradient-primary shadow-elegant text-xs font-bold" onClick={() => { setModalArticulo(true); setFormArticulo({}); }}>
            <Plus className="h-4 w-4" /> Agregar Artículo
          </Button>
        </div>
      </div>

      {/* ─── Alertas Banner ─── */}
      {alertasCount > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {itemsBajoStock.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 p-3.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 shrink-0">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">{itemsBajoStock.length} Art. con Stock Bajo o Crítico</p>
                <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80">Requieren reposición urgente</p>
              </div>
            </div>
          )}
          {prestamosVencidos.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/8 p-3.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/15 shrink-0">
                <ShieldAlert className="h-4.5 w-4.5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700 dark:text-red-400">{prestamosVencidos.length} Préstamo{prestamosVencidos.length > 1 ? "s" : ""} Vencido{prestamosVencidos.length > 1 ? "s" : ""}</p>
                <p className="text-[11px] text-red-600/80">Devolución pendiente y atrasada</p>
              </div>
            </div>
          )}
          {itemsVencidos.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-500/30 bg-slate-500/8 p-3.5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-500/15 shrink-0">
                <CalendarX className="h-4.5 w-4.5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{itemsVencidos.length} Artículo{itemsVencidos.length > 1 ? "s" : ""} Vencido{itemsVencidos.length > 1 ? "s" : ""}</p>
                <p className="text-[11px] text-slate-500/80">Fecha de uso expirada</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TABS ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1.5">
          <TabsTrigger value="dashboard" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Dashboard</TabsTrigger>
          <TabsTrigger value="articulos" className="text-xs gap-1.5"><Package className="h-3.5 w-3.5" />Artículos</TabsTrigger>
          <TabsTrigger value="prestamos" className="text-xs gap-1.5 relative">
            <ArrowRightLeft className="h-3.5 w-3.5" />Préstamos
            {(prestamosActivos.length + prestamosVencidos.length) > 0 && (
              <span className="ml-0.5 h-4 w-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">{prestamosActivos.length + prestamosVencidos.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="categorias" className="text-xs gap-1.5"><Tag className="h-3.5 w-3.5" />Categorías</TabsTrigger>
          <TabsTrigger value="reportes" className="text-xs gap-1.5"><FileDown className="h-3.5 w-3.5" />Reportes</TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════ DASHBOARD ═══════════════════════════ */}
        <TabsContent value="dashboard" className="space-y-5">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Artículos en Stock", value: totalItems.toString(), sub: `${articulos.length} referencias`, icon: Boxes, color: "text-primary bg-primary/10", delta: null },
              { label: "Valor del Inventario", value: formatCRC(totalValor), sub: "Valor total estimado", icon: Archive, color: "text-emerald-500 bg-emerald-500/10", delta: null },
              { label: "Prestados Actualmente", value: prestamosActivos.length.toString(), sub: `${prestamosActivos.reduce((s, p) => s + p.cantidad, 0)} unidades fuera`, icon: PackageOpen, color: "text-blue-500 bg-blue-500/10", delta: null },
              { label: "Alertas Activas", value: alertasCount.toString(), sub: "Acciones requeridas", icon: alertasCount > 0 ? AlertCircle : PackageCheck, color: alertasCount > 0 ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10", delta: null },
            ].map((kpi) => (
              <Card key={kpi.label} className="shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium truncate">{kpi.label}</p>
                      <p className="text-2xl font-bold tracking-tight mt-1 truncate">{kpi.value}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{kpi.sub}</p>
                    </div>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kpi.color}`}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts + Stock Critico */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Bar chart */}
            <Card className="shadow-card lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Layers3 className="h-4 w-4 text-primary" />Stock por Categoría</CardTitle>
                <CardDescription className="text-xs">Distribución de unidades disponibles actualmente</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartCategoria} margin={{ left: -20, right: 5, top: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 10, fontSize: 12 }}
                      cursor={{ fill: "var(--color-muted)/20" }}
                    />
                    <Bar dataKey="cantidad" radius={[5, 5, 0, 0]} maxBarSize={38}>
                      {chartCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Stock crítico / bajo */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-amber-500" />Nivel de Stock</CardTitle>
                <CardDescription className="text-xs">Artículos por debajo del mínimo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {itemsBajoStock.length === 0 ? (
                  <div className="py-8 text-center">
                    <PackageCheck className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Todo el stock está en niveles óptimos</p>
                  </div>
                ) : itemsBajoStock.slice(0, 6).map(a => {
                  const pct = Math.round((a.stockActual / a.stockTotal) * 100);
                  return (
                    <div key={a.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate max-w-[150px]">{a.icono} {a.nombre}</span>
                        <Badge variant="outline" className={`text-[10px] ${a.estado === "critico" ? ESTADO_CONFIG.critico.color : ESTADO_CONFIG.stock_bajo.color}`}>
                          {a.stockActual}/{a.stockTotal}
                        </Badge>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Préstamos activos + Movimientos recientes */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><ArrowRightLeft className="h-4 w-4 text-blue-500" />Préstamos Activos</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab("prestamos")}>Ver todos <ChevronRight className="h-3 w-3 ml-0.5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {prestamosActivos.length === 0 && prestamosVencidos.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No hay préstamos activos</p>
                ) : [...prestamosVencidos, ...prestamosActivos].slice(0, 5).map(p => {
                  const dias = diasRestantes(p.fechaDevolucionEsperada);
                  const esVencido = p.estado === "vencido";
                  return (
                    <div key={p.id} className={`flex items-center gap-3 rounded-lg p-2.5 border transition ${esVencido ? "border-red-500/30 bg-red-500/5" : "border-transparent hover:bg-muted/30"}`}>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${esVencido ? "bg-red-500/15" : "bg-blue-500/10"}`}>
                        {getCatIcono(articulos.find(a => a.id === p.articuloId)?.categoriaId ?? "")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{getArticuloNombre(p.articuloId)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{p.responsable} · {p.cantidad} {articulos.find(a => a.id === p.articuloId)?.unidad ?? "ud."}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className={`text-[10px] ${esVencido ? "bg-red-500/15 text-red-600 border-red-500/30" : dias <= 3 ? "bg-amber-500/15 text-amber-600 border-amber-500/30" : "bg-muted text-muted-foreground"}`}>
                          {esVencido ? `${Math.abs(dias)}d vencido` : `${dias}d restantes`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />Movimientos Recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...movimientos].reverse().slice(0, 7).map(m => {
                  const cfg = TIPO_MOV_CONFIG[m.tipo];
                  return (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-muted/30 transition">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${cfg.color}`}>
                        {m.tipo === "entrada" ? "▲" : m.tipo === "salida" || m.tipo === "baja" ? "▼" : m.tipo === "prestamo" ? "↗" : "↙"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{getArticuloNombre(m.articuloId)}</p>
                        <p className="text-[11px] text-muted-foreground">{cfg.label} · {m.cantidad} ud. · {formatFecha(m.fecha)}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════ ARTÍCULOS ═══════════════════════════ */}
        <TabsContent value="articulos" className="space-y-4">
          {/* Filtros */}
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Buscar por nombre, ubicación…" className="pl-9 h-9 text-xs" value={searchArticulos} onChange={e => setSearchArticulos(e.target.value)} />
                </div>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="h-9 text-xs w-44"><Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder="Categoría" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.icono} {c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="h-9 text-xs w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {Object.entries(ESTADO_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabla */}
          <Card className="shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-bold w-12"></TableHead>
                  <TableHead className="text-xs font-bold">Artículo</TableHead>
                  <TableHead className="text-xs font-bold">Categoría</TableHead>
                  <TableHead className="text-xs font-bold text-center">Stock Actual</TableHead>
                  <TableHead className="text-xs font-bold text-center">Mínimo</TableHead>
                  <TableHead className="text-xs font-bold">Estado</TableHead>
                  <TableHead className="text-xs font-bold">Ubicación</TableHead>
                  <TableHead className="text-xs font-bold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articulosFiltrados.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">No se encontraron artículos</TableCell></TableRow>
                )}
                {articulosFiltrados.map(a => {
                  const estado = a.estado as EstadoItem;
                  const cfg = ESTADO_CONFIG[estado];
                  const pct = Math.round((a.stockActual / Math.max(a.stockTotal, 1)) * 100);
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/20 group transition">
                      <TableCell className="text-2xl text-center py-3">{a.icono}</TableCell>
                      <TableCell className="py-3">
                        <div>
                          <p className="text-xs font-semibold">{a.nombre}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{a.descripcion}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs">{getCatIcono(a.categoriaId)} {getCatNombre(a.categoriaId)}</span>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="space-y-1 min-w-[70px]">
                          <p className="text-sm font-bold">{a.stockActual}<span className="text-[10px] text-muted-foreground font-normal">/{a.stockTotal}</span></p>
                          <Progress value={pct} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <span className="text-xs text-muted-foreground">{a.stockMinimo} {a.unidad}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </Badge>
                        {a.fechaVencimiento && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">Vence: {formatFecha(a.fechaVencimiento)}</p>
                        )}
                        {a.fechaRevision && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">Rev: {formatFecha(a.fechaRevision)}</p>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-[11px] text-muted-foreground">{a.ubicacion}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Ver detalle"
                            onClick={() => setArticuloDetalle(a)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                            title="Registrar préstamo"
                            onClick={() => { setFormPrestamo({ articuloId: a.id }); setModalPrestamo(true); }}>
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                            title="Editar artículo"
                            onClick={() => { setEditingArticulo(a); setFormEdicion({ ...a }); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            title="Eliminar artículo"
                            onClick={() => eliminarArticulo(a)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════ PRÉSTAMOS ═══════════════════════════ */}
        <TabsContent value="prestamos" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Control de Préstamos</p>
              <p className="text-xs text-muted-foreground">{prestamosActivos.length} activos · {prestamosVencidos.length} vencidos · {prestamos.filter(p => p.estado === "devuelto").length} devueltos</p>
            </div>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => { setModalPrestamo(true); setFormPrestamo({}); }}>
              <Plus className="h-3.5 w-3.5" /> Nuevo Préstamo
            </Button>
          </div>

          {/* Vencidos primero */}
          {[...prestamosVencidos, ...prestamosActivos, ...prestamos.filter(p => p.estado === "devuelto")].map(p => {
            const art = articulos.find(a => a.id === p.articuloId);
            const dias = diasRestantes(p.fechaDevolucionEsperada);
            const esVencido = p.estado === "vencido";
            const esDevuelto = p.estado === "devuelto";
            return (
              <Card key={p.id} className={`shadow-card border transition ${esVencido ? "border-red-500/30 bg-red-500/3" : esDevuelto ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl bg-muted">
                      {art?.icono ?? "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{art?.nombre ?? "—"}</p>
                        <Badge variant="outline" className={`text-[10px] ${esVencido ? ESTADO_CONFIG.critico.color : esDevuelto ? "bg-emerald-500/15 text-emerald-600" : "bg-blue-500/15 text-blue-600 border-blue-500/30"}`}>
                          {esVencido ? "⚠ VENCIDO" : esDevuelto ? "✓ Devuelto" : "En Préstamo"}
                        </Badge>
                        {p.estadoDevolucion && (
                          <Badge variant="outline" className="text-[10px]">{p.estadoDevolucion === "bueno" ? "✅ Buen estado" : p.estadoDevolucion === "danado" ? "⚠ Dañado" : "❌ Perdido"}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <strong>{p.responsable}</strong>{p.cargo ? ` · ${p.cargo}` : ""} · <strong>{p.cantidad}</strong> {art?.unidad ?? "ud."}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Prestado: {formatFecha(p.fechaPrestamo)} → Devolver: {formatFecha(p.fechaDevolucionEsperada)}
                        {p.fechaDevolucionReal ? ` → Devuelto: ${formatFecha(p.fechaDevolucionReal)}` : ""}
                      </p>
                      {p.notas && <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">"{p.notas}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {!esDevuelto && (
                        <Badge variant="outline" className={`text-[10px] ${esVencido ? "bg-red-500/15 text-red-600 border-red-500/30 animate-pulse" : dias <= 3 ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                          <Clock className="h-2.5 w-2.5 mr-1" />
                          {esVencido ? `${Math.abs(dias)} días de retraso` : `${dias} días restantes`}
                        </Badge>
                      )}
                      {!esDevuelto && (
                        <Button size="sm" variant={esVencido ? "destructive" : "outline"} className="h-7 text-xs gap-1" onClick={() => { setModalDevolucion(p); setEstadoDevolucionForm("bueno"); }}>
                          <RotateCcw className="h-3 w-3" /> Registrar Devolución
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ═══════════════════════════ CATEGORÍAS ═══════════════════════════ */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Categorías de Inventario</p>
              <p className="text-xs text-muted-foreground">{categorias.length} categorías activas</p>
            </div>
            <Button size="sm" className="gap-1.5 text-xs bg-gradient-primary" onClick={() => { setModalCategoria(true); setFormCategoria({}); }}>
              <Plus className="h-3.5 w-3.5" /> Nueva Categoría
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categorias.map(c => {
              const itemsEnCat = articulos.filter(a => a.categoriaId === c.id);
              const totalEnCat = itemsEnCat.reduce((s, a) => s + a.stockActual, 0);
              const alertasEnCat = itemsEnCat.filter(a => {
                const est = getEstadoArticulo(a, prestamos);
                return est === "stock_bajo" || est === "critico" || est === "vencido";
              }).length;
              return (
                <Card key={c.id} className="shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-all cursor-pointer group" onClick={() => { setFilterCategoria(c.id); setActiveTab("articulos"); }}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl border ${c.color}`}>{c.icono}</div>
                      {alertasEnCat > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-600 border-amber-500/30">{alertasEnCat} alerta{alertasEnCat > 1 ? "s" : ""}</Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{c.nombre}</p>
                      <p className="text-[11px] text-muted-foreground">{c.descripcion}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">{itemsEnCat.length} referencias</span>
                      <span className="text-xs font-bold">{totalEnCat} uds. en stock</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition">
                      <Eye className="h-3 w-3" /> Ver artículos
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══════════════════════════ REPORTES ═══════════════════════════ */}
        <TabsContent value="reportes" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {[
              { titulo: "Reporte Kardex", sub: "Historial completo de movimientos", icon: FileDown, color: "text-primary bg-primary/10", accion: "kardex" },
              { titulo: "Artículos Vencidos", sub: "Artículos fuera de fecha de uso", icon: CalendarX, color: "text-red-500 bg-red-500/10", accion: "vencidos" },
              { titulo: "Préstamos Activos", sub: "Reporte de materiales prestados", icon: ArrowRightLeft, color: "text-blue-500 bg-blue-500/10", accion: "prestamos_activos" },
              { titulo: "Bajas y Mermas", sub: "Registro de pérdidas y daños", icon: PackageX, color: "text-slate-500 bg-slate-500/10", accion: "bajas" },
            ].map(r => (
              <Card key={r.titulo} className="shadow-card hover:shadow-elegant hover:-translate-y-0.5 transition-all cursor-pointer"
                onClick={() => toast.success(`📊 Generando "${r.titulo}"... Se descargará en un momento.`)}>
                <CardContent className="p-5 space-y-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${r.color}`}>
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{r.titulo}</p>
                    <p className="text-[11px] text-muted-foreground">{r.sub}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5">
                    <FileDown className="h-3 w-3" /> Descargar PDF
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabla Kardex */}
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Historial de Movimientos (Kardex)</CardTitle>
              <CardDescription className="text-xs">Registro inmutable de todas las entradas, salidas y préstamos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-bold">Fecha</TableHead>
                    <TableHead className="text-xs font-bold">Artículo</TableHead>
                    <TableHead className="text-xs font-bold">Tipo</TableHead>
                    <TableHead className="text-xs font-bold text-center">Cantidad</TableHead>
                    <TableHead className="text-xs font-bold">Responsable</TableHead>
                    <TableHead className="text-xs font-bold">Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...movimientos].reverse().map(m => {
                    const cfg = TIPO_MOV_CONFIG[m.tipo];
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/20 transition">
                        <TableCell className="text-xs py-2.5">{formatFecha(m.fecha)}</TableCell>
                        <TableCell className="text-xs py-2.5 font-medium">{getArticuloNombre(m.articuloId)}</TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs py-2.5 text-center font-bold">{m.cantidad}</TableCell>
                        <TableCell className="text-xs py-2.5 text-muted-foreground">{m.responsable}</TableCell>
                        <TableCell className="text-xs py-2.5 text-muted-foreground italic">{m.notas || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════ MODAL: NUEVO ARTÍCULO ═══════════ */}
      <Dialog open={modalArticulo} onOpenChange={setModalArticulo}>
        <DialogContent className="sm:max-w-[520px] bg-background border shadow-elegant text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Package className="h-5 w-5 text-primary" /> Nuevo Artículo de Inventario
            </DialogTitle>
            <DialogDescription className="text-xs">Registra un nuevo artículo o material al inventario de la academia</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Nombre del Artículo *</Label>
                <Input placeholder="Ej. Balón Adidas Champions #5" className="text-sm h-9" value={formArticulo.nombre ?? ""} onChange={e => setFormArticulo(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Categoría *</Label>
                <Select value={formArticulo.categoriaId ?? ""} onValueChange={v => setFormArticulo(p => ({ ...p, categoriaId: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.icono} {c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ícono (emoji)</Label>
                <Input placeholder="⚽" className="text-sm h-9" value={formArticulo.icono ?? ""} onChange={e => setFormArticulo(p => ({ ...p, icono: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stock Inicial *</Label>
                <Input type="number" min={0} placeholder="0" className="text-sm h-9" value={formArticulo.stockActual ?? ""} onChange={e => setFormArticulo(p => ({ ...p, stockActual: Number(e.target.value), stockTotal: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stock Mínimo</Label>
                <Input type="number" min={0} placeholder="0" className="text-sm h-9" value={formArticulo.stockMinimo ?? ""} onChange={e => setFormArticulo(p => ({ ...p, stockMinimo: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Unidad de Medida</Label>
                <Input placeholder="unidades, pares, kits…" className="text-sm h-9" value={formArticulo.unidad ?? ""} onChange={e => setFormArticulo(p => ({ ...p, unidad: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Precio Unitario (₡)</Label>
                <Input type="number" min={0} placeholder="0" className="text-sm h-9" value={formArticulo.precio ?? ""} onChange={e => setFormArticulo(p => ({ ...p, precio: Number(e.target.value) }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Ubicación en Bodega</Label>
                <Input placeholder="Ej. Bodega Principal – Estante A" className="text-sm h-9" value={formArticulo.ubicacion ?? ""} onChange={e => setFormArticulo(p => ({ ...p, ubicacion: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fecha de Vencimiento</Label>
                <Input type="date" className="text-sm h-9" value={formArticulo.fechaVencimiento ?? ""} onChange={e => setFormArticulo(p => ({ ...p, fechaVencimiento: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fecha de Revisión</Label>
                <Input type="date" className="text-sm h-9" value={formArticulo.fechaRevision ?? ""} onChange={e => setFormArticulo(p => ({ ...p, fechaRevision: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Descripción</Label>
                <Textarea placeholder="Descripción del artículo…" className="text-xs resize-none" rows={2} value={formArticulo.descripcion ?? ""} onChange={e => setFormArticulo(p => ({ ...p, descripcion: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 text-xs h-9" onClick={() => setModalArticulo(false)}>Cancelar</Button>
              <Button className="flex-1 bg-gradient-primary text-xs h-9" onClick={guardarArticulo}>
                <Check className="h-3.5 w-3.5 mr-1.5" /> Guardar Artículo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ MODAL: NUEVO PRÉSTAMO ═══════════ */}
      <Dialog open={modalPrestamo} onOpenChange={setModalPrestamo}>
        <DialogContent className="sm:max-w-[460px] bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" /> Registrar Préstamo
            </DialogTitle>
            <DialogDescription className="text-xs">Registra la salida temporal de material de la bodega</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Artículo *</Label>
              <Select value={formPrestamo.articuloId ?? ""} onValueChange={v => setFormPrestamo(p => ({ ...p, articuloId: v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccionar artículo…" /></SelectTrigger>
                <SelectContent>
                  {articulos.filter(a => a.stockActual > 0).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.icono} {a.nombre} ({a.stockActual} disp.)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Cantidad *</Label>
                <Input type="number" min={1} placeholder="1" className="text-sm h-9"
                  value={formPrestamo.cantidad ?? ""}
                  onChange={e => setFormPrestamo(p => ({ ...p, cantidad: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Devolución Esperada *</Label>
                <Input type="date" className="text-sm h-9" value={formPrestamo.fechaDevolucionEsperada ?? ""}
                  onChange={e => setFormPrestamo(p => ({ ...p, fechaDevolucionEsperada: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Responsable *</Label>
              {entrenadores.length > 0 ? (
                <Select
                  value={formPrestamo.responsable ?? ""}
                  onValueChange={v => {
                    const coach = entrenadores.find((c: any) => c.nombre === v);
                    setFormPrestamo(p => ({
                      ...p,
                      responsable: v,
                      cargo: coach?.especialidad ?? coach?.cargo ?? "",
                    }));
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Seleccionar entrenador…" />
                  </SelectTrigger>
                  <SelectContent>
                    {entrenadores.map((c: any) => (
                      <SelectItem key={c.id} value={c.nombre}>
                        {c.nombre}{c.especialidad ? ` — ${c.especialidad}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="Nombre del entrenador o responsable" className="text-sm h-9"
                  value={formPrestamo.responsable ?? ""}
                  onChange={e => setFormPrestamo(p => ({ ...p, responsable: e.target.value }))} />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Cargo / Función</Label>
              <Input
                placeholder="Se completa automáticamente al seleccionar"
                className="text-sm h-9 bg-muted/40"
                value={formPrestamo.cargo ?? ""}
                onChange={e => setFormPrestamo(p => ({ ...p, cargo: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notas adicionales</Label>
              <Input placeholder="Ej. Para torneo inter-ligas…" className="text-sm h-9"
                value={formPrestamo.notas ?? ""}
                onChange={e => setFormPrestamo(p => ({ ...p, notas: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 text-xs h-9" onClick={() => setModalPrestamo(false)}>Cancelar</Button>
              <Button className="flex-1 text-xs h-9" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }} onClick={guardarPrestamo}>
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" /> Registrar Préstamo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ MODAL: DEVOLUCIÓN ═══════════ */}
      <Dialog open={!!modalDevolucion} onOpenChange={() => setModalDevolucion(null)}>
        <DialogContent className="sm:max-w-[400px] bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <RotateCcw className="h-5 w-5 text-emerald-500" /> Registrar Devolución
            </DialogTitle>
            <DialogDescription className="text-xs">
              {modalDevolucion && `${getArticuloNombre(modalDevolucion.articuloId)} · ${modalDevolucion.cantidad} unidades · ${modalDevolucion.responsable}`}
            </DialogDescription>
          </DialogHeader>
          {modalDevolucion && (
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Estado del Artículo al Devolver</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["bueno", "danado", "perdido"] as EstadoDevolucion[]).map(est => (
                    <button key={est} onClick={() => setEstadoDevolucionForm(est)}
                      className={`rounded-lg border p-3 text-xs font-semibold capitalize transition text-center ${estadoDevolucionForm === est ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/40"}`}>
                      {est === "bueno" ? "✅ Bueno" : est === "danado" ? "⚠️ Dañado" : "❌ Perdido"}
                    </button>
                  ))}
                </div>
              </div>
              {estadoDevolucionForm === "perdido" && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/8 p-3 text-xs text-red-600 font-medium">
                  ⚠️ El artículo se registrará como perdido y no se reincorporará al stock.
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 text-xs h-9" onClick={() => setModalDevolucion(null)}>Cancelar</Button>
                <Button className="flex-1 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => registrarDevolucion(modalDevolucion)}>
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Confirmar Devolución
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════ MODAL: DETALLE ARTÍCULO ═══════════ */}
      <Dialog open={!!articuloDetalle} onOpenChange={() => setArticuloDetalle(null)}>
        <DialogContent className="sm:max-w-[460px] bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              {articuloDetalle?.icono} {articuloDetalle?.nombre}
            </DialogTitle>
            <DialogDescription className="text-xs">{articuloDetalle?.descripcion}</DialogDescription>
          </DialogHeader>
          {articuloDetalle && (() => {
            const estado = getEstadoArticulo(articuloDetalle, prestamos);
            const cfg = ESTADO_CONFIG[estado];
            const historial = movimientos.filter(m => m.articuloId === articuloDetalle.id);
            const prestamosArt = prestamos.filter(p => p.articuloId === articuloDetalle.id && p.estado !== "devuelto");
            return (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Stock Actual", value: `${articuloDetalle.stockActual} ${articuloDetalle.unidad}`, color: "text-primary" },
                    { label: "Stock Mínimo", value: `${articuloDetalle.stockMinimo} ${articuloDetalle.unidad}`, color: "" },
                    { label: "Valor Total", value: articuloDetalle.precio ? formatCRC(articuloDetalle.precio * articuloDetalle.stockActual) : "—", color: "text-emerald-600" },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg bg-muted/30 p-3 text-center">
                      <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Estado</p>
                  <Badge variant="outline" className={`text-xs gap-1.5 ${cfg.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} /> {cfg.label}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong className="text-foreground">Categoría:</strong> {getCatIcono(articuloDetalle.categoriaId)} {getCatNombre(articuloDetalle.categoriaId)}</p>
                  <p><strong className="text-foreground">Ubicación:</strong> {articuloDetalle.ubicacion || "—"}</p>
                  {articuloDetalle.fechaVencimiento && <p><strong className="text-foreground">Vencimiento:</strong> {formatFecha(articuloDetalle.fechaVencimiento)}</p>}
                  {articuloDetalle.fechaRevision && <p><strong className="text-foreground">Próxima Revisión:</strong> {formatFecha(articuloDetalle.fechaRevision)}</p>}
                </div>
                {prestamosArt.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Préstamos Activos</p>
                    {prestamosArt.map(pr => (
                      <div key={pr.id} className="rounded-lg border bg-blue-500/5 border-blue-500/20 p-2.5 text-xs mb-1.5">
                        <p className="font-semibold">{pr.responsable} · {pr.cantidad} unidades</p>
                        <p className="text-muted-foreground">Devolver: {formatFecha(pr.fechaDevolucionEsperada)}</p>
                      </div>
                    ))}
                  </div>
                )}
                {historial.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Últimos Movimientos</p>
                    <div className="space-y-1.5">
                      {[...historial].reverse().slice(0, 4).map(m => {
                        const cfg = TIPO_MOV_CONFIG[m.tipo];
                        return (
                          <div key={m.id} className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className={`text-[10px] ${cfg.color} shrink-0`}>{cfg.label}</Badge>
                            <span className="text-muted-foreground">{m.cantidad} ud. · {formatFecha(m.fecha)} · {m.responsable}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <Button className="w-full text-xs h-9 gap-1.5" onClick={() => { setArticuloDetalle(null); setFormPrestamo({ articuloId: articuloDetalle.id }); setModalPrestamo(true); }}>
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Crear Préstamo para este Artículo
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══════════ MODAL: NUEVA CATEGORÍA ═══════════ */}
      <Dialog open={modalCategoria} onOpenChange={setModalCategoria}>
        <DialogContent className="sm:max-w-[380px] bg-background border shadow-elegant text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold"><Tag className="h-5 w-5 text-primary" /> Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nombre *</Label>
              <Input placeholder="Ej. Equipamiento de Portería" className="text-sm h-9" value={formCategoria.nombre ?? ""} onChange={e => setFormCategoria(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ícono (emoji)</Label>
              <Input placeholder="🏋️" className="text-sm h-9" value={formCategoria.icono ?? ""} onChange={e => setFormCategoria(p => ({ ...p, icono: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descripción</Label>
              <Input placeholder="Breve descripción de la categoría" className="text-sm h-9" value={formCategoria.descripcion ?? ""} onChange={e => setFormCategoria(p => ({ ...p, descripcion: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 text-xs h-9" onClick={() => setModalCategoria(false)}>Cancelar</Button>
              <Button className="flex-1 bg-gradient-primary text-xs h-9" onClick={guardarCategoria}><Check className="h-3.5 w-3.5 mr-1.5" />Crear</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ MODAL: EDITAR ARTÍCULO ═══════════ */}
      <Dialog open={!!editingArticulo} onOpenChange={() => { setEditingArticulo(null); setFormEdicion({}); }}>
        <DialogContent className="sm:max-w-[520px] bg-background border shadow-elegant text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Pencil className="h-5 w-5 text-amber-500" /> Editar Artículo
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingArticulo?.icono} {editingArticulo?.nombre}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Nombre del Artículo *</Label>
                <Input placeholder="Nombre" className="text-sm h-9"
                  value={formEdicion.nombre ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Categoría *</Label>
                <Select value={formEdicion.categoriaId ?? ""} onValueChange={v => setFormEdicion(p => ({ ...p, categoriaId: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                  <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.icono} {c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ícono (emoji)</Label>
                <Input placeholder="⚽" className="text-sm h-9"
                  value={formEdicion.icono ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, icono: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stock Actual</Label>
                <Input type="number" min={0} className="text-sm h-9"
                  value={formEdicion.stockActual ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, stockActual: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stock Total</Label>
                <Input type="number" min={0} className="text-sm h-9"
                  value={formEdicion.stockTotal ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, stockTotal: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stock Mínimo</Label>
                <Input type="number" min={0} className="text-sm h-9"
                  value={formEdicion.stockMinimo ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, stockMinimo: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Precio Unitario (₡)</Label>
                <Input type="number" min={0} className="text-sm h-9"
                  value={formEdicion.precio ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, precio: Number(e.target.value) }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Unidad de Medida</Label>
                <Input placeholder="unidades, pares, kits…" className="text-sm h-9"
                  value={formEdicion.unidad ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, unidad: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Ubicación en Bodega</Label>
                <Input placeholder="Bodega Principal – Estante A" className="text-sm h-9"
                  value={formEdicion.ubicacion ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, ubicacion: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fecha de Vencimiento</Label>
                <Input type="date" className="text-sm h-9"
                  value={formEdicion.fechaVencimiento ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, fechaVencimiento: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fecha de Revisión</Label>
                <Input type="date" className="text-sm h-9"
                  value={formEdicion.fechaRevision ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, fechaRevision: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Descripción</Label>
                <Textarea placeholder="Descripción del artículo…" className="text-xs resize-none" rows={2}
                  value={formEdicion.descripcion ?? ""}
                  onChange={e => setFormEdicion(p => ({ ...p, descripcion: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 text-xs h-9" onClick={() => { setEditingArticulo(null); setFormEdicion({}); }}>Cancelar</Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs h-9" onClick={guardarEdicion}>
                <Check className="h-3.5 w-3.5 mr-1.5" /> Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
