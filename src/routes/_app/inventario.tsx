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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Package, PackageOpen, PackageCheck, PackageX, Boxes, Archive,
  ArrowRightLeft, Plus, Search, AlertTriangle, AlertCircle, Clock,
  BarChart3, Check, RotateCcw, TrendingDown,
  ShieldAlert, CalendarX, ChevronRight, FileDown,
  Filter, Tag, Layers3, Eye, Pencil, Trash2, RefreshCw, X, FolderPlus, Sparkles
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend
} from "recharts";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/inventario")({ component: InventarioPage, ssr: false });

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
  sku: string;
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
  precio: number;
  miniatura?: string;
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

// ─────────────────────────────────────────────
//  INITIAL PERSISTED SEED DATA FOR SUPABASE DB
// ─────────────────────────────────────────────
const CATEGORIAS_INIT: Categoria[] = [
  { id: "c1", nombre: "Balones", icono: "⚽", color: "bg-orange-500/15 text-orange-600 border-orange-500/30", descripcion: "Balones de entrenamiento y competición oficial" },
  { id: "c2", nombre: "Mallas y Redes", icono: "🥅", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", descripcion: "Mallas de portería y redes de delimitación de campo" },
  { id: "c3", nombre: "Conos y Señalizadores", icono: "🔶", color: "bg-amber-500/15 text-amber-600 border-amber-500/30", descripcion: "Conos fluorescentes y estacas de circuito" },
  { id: "c4", nombre: "Petos y Uniformes", icono: "👕", color: "bg-violet-500/15 text-violet-600 border-violet-500/30", descripcion: "Petos de entrenamiento y uniformes de la academia" },
  { id: "c5", nombre: "Equipamiento GPS", icono: "📡", color: "bg-sky-500/15 text-sky-600 border-sky-500/30", descripcion: "Chalecos GPS Catapult y sensores de rendimiento" },
  { id: "c6", nombre: "Material Médico", icono: "🏥", color: "bg-red-500/15 text-red-600 border-red-500/30", descripcion: "Botiquines y material de primeros auxilios" },
  { id: "c7", nombre: "Agilidad y Coordinación", icono: "🪜", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", descripcion: "Escaleras, vallas y anillos de coordinación" },
  { id: "c8", nombre: "Cronómetros y Tecnología", icono: "⏱️", color: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30", descripcion: "Cronómetros digitales y fotocélulas de tiempo" },
  { id: "c9", nombre: "Chalecos", icono: "🦺", color: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30", descripcion: "Chalecos tácticos numerados y petos con dorsal" },
];

const ARTICULOS_INIT: ArticuloInventario[] = [
  { id: "a1", sku: "BAL-001", nombre: "Balón Adidas Champions #5", categoriaId: "c1", descripcion: "Balón oficial de entrenamiento talla 5", stockActual: 35, stockMinimo: 10, stockTotal: 40, unidad: "unidades", ubicacion: "Bodega Principal – Estante A", icono: "⚽", precio: 25000 },
  { id: "a2", sku: "BAL-002", nombre: "Balón Nike Strike #4 Juvenil", categoriaId: "c1", descripcion: "Balón categoría juvenil talla 4", stockActual: 4, stockMinimo: 10, stockTotal: 20, unidad: "unidades", ubicacion: "Bodega Principal – Estante A", icono: "⚽", precio: 18000 },
  { id: "a3", sku: "BAL-003", nombre: "Balón Mini Infantil #3", categoriaId: "c1", descripcion: "Balón para categorías Sub-8 y Sub-10", stockActual: 2, stockMinimo: 8, stockTotal: 12, unidad: "unidades", ubicacion: "Bodega Principal – Estante A", icono: "⚽", precio: 12000 },
  { id: "a4", sku: "RED-001", nombre: "Malla de Portería Oficial 7.32m", categoriaId: "c2", descripcion: "Malla para portería reglamentaria", stockActual: 4, stockMinimo: 2, stockTotal: 6, unidad: "pares", ubicacion: "Bodega Principal – Zona Redes", icono: "🥅", precio: 85000 },
  { id: "a5", sku: "CON-001", nombre: "Conos Fluorescentes Naranja (Juego 50)", categoriaId: "c3", descripcion: "Conos de señalización de 23cm", stockActual: 110, stockMinimo: 30, stockTotal: 120, unidad: "unidades", ubicacion: "Bodega Principal – Estante C", icono: "🔶", precio: 1500 },
  { id: "a6", sku: "EST-001", nombre: "Estacas de Agilidad con Punta", categoriaId: "c3", descripcion: "Estacas multicolor para circuitos de carrera", stockActual: 40, stockMinimo: 15, stockTotal: 50, unidad: "unidades", ubicacion: "Bodega Principal – Estante C", icono: "🔶", precio: 2800 },
  { id: "a7", sku: "PET-001", nombre: "Petos Azules Reversibles Sub-15", categoriaId: "c4", descripcion: "Petos de entrenamiento azul/blanco", stockActual: 22, stockMinimo: 15, stockTotal: 30, unidad: "unidades", ubicacion: "Bodega Principal – Estante B", icono: "👕", precio: 5500 },
  { id: "a8", sku: "GPS-001", nombre: "Chalecos GPS Catapult Vector", categoriaId: "c5", descripcion: "Chalecos con pod GPS para rendimiento", stockActual: 7, stockMinimo: 5, stockTotal: 10, unidad: "unidades", ubicacion: "Vitrina Tecnología", icono: "📡", precio: 350000 },
  { id: "a9", sku: "MED-001", nombre: "Botiquín de Primeros Auxilios Campo", categoriaId: "c6", descripcion: "Botiquín equipado con estanqueidad", stockActual: 2, stockMinimo: 2, stockTotal: 2, unidad: "unidades", ubicacion: "Enfermería Sede Central", icono: "🏥", precio: 45000 },
  { id: "a10", sku: "ESC-001", nombre: "Escaleras de Coordinación 6m", categoriaId: "c7", descripcion: "Escaleras para ejercicios de frecuencia de zancada", stockActual: 5, stockMinimo: 3, stockTotal: 6, unidad: "unidades", ubicacion: "Bodega Principal – Estante D", icono: "🪜", precio: 22000 },
  { id: "a11", sku: "CRO-001", nombre: "Cronómetros Digitales Profesionales", categoriaId: "c8", descripcion: "Cronómetros Robic de 100 memorias", stockActual: 4, stockMinimo: 3, stockTotal: 8, unidad: "unidades", ubicacion: "Vitrina Tecnología", icono: "⏱️", precio: 18000 },
];

const PRESTAMOS_INIT: Prestamo[] = [
  { id: "p1", articuloId: "a1", responsable: "Entrenador Andrés Mora", cargo: "Director Técnico Sub-17", cantidad: 5, fechaPrestamo: "2026-07-20", fechaDevolucionEsperada: "2026-07-28", estado: "activo", notas: "Para práctica táctica de campo" },
  { id: "p2", articuloId: "a8", responsable: "Prof. Carlos Vega", cargo: "Preparador Físico", cantidad: 3, fechaPrestamo: "2026-07-22", fechaDevolucionEsperada: "2026-07-29", estado: "activo", notas: "Medición GPS de cargas de entrenamiento" },
  { id: "p3", articuloId: "a11", responsable: "Entrenador Luis Rodríguez", cargo: "Director Técnico Sub-13", cantidad: 2, fechaPrestamo: "2026-07-15", fechaDevolucionEsperada: "2026-07-22", estado: "devuelto", estadoDevolucion: "bueno", fechaDevolucionReal: "2026-07-22", notas: "Devuelto en perfecto estado" },
];

function formatCRC(n: number) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n);
}

// 🪄 Helper function to generate 100% AUTOMATIC SKU codes based on selected category & item count
const generateAutoSKU = (categoriaId: string, currentArticulos: ArticuloInventario[], currentCategorias: Categoria[]) => {
  if (!categoriaId) return `INV-${Math.floor(100 + Math.random() * 900)}`;
  const cat = currentCategorias.find((c) => c.id === categoriaId);
  const catName = cat?.nombre || "INV";
  const cleanCat = catName.toUpperCase().replace(/[^A-Z]/g, "");
  const prefix = cleanCat.slice(0, 3) || "INV";
  const countInCat = currentArticulos.filter((a) => a.categoriaId === categoriaId).length + 1;
  return `${prefix}-${String(countInCat).padStart(3, "0")}`;
};

export function InventarioPage() {
  const [articulos, setArticulos] = useState<ArticuloInventario[]>(() => {
    return RendimientoStore.get<ArticuloInventario[]>("inventario_articulos", ARTICULOS_INIT);
  });

  const [categorias, setCategorias] = useState<Categoria[]>(() => {
    return RendimientoStore.get<Categoria[]>("inventario_categorias", CATEGORIAS_INIT);
  });

  const [prestamos, setPrestamos] = useState<Prestamo[]>(() => {
    return RendimientoStore.get<Prestamo[]>("inventario_prestamos", PRESTAMOS_INIT);
  });

  // Enrutador de Vistas Secundarias (Sub-Routing)
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [estFilter, setEstFilter] = useState("all");

  // Modal States
  const [modalNuevoArticulo, setModalNuevoArticulo] = useState(false);
  const [modalNuevaCategoria, setModalNuevaCategoria] = useState(false);
  const [modalNuevoPrestamo, setModalNuevoPrestamo] = useState(false);
  const [modalDevolucion, setModalDevolucion] = useState<Prestamo | null>(null);

  // Form States
  const [formArticulo, setFormArticulo] = useState<Partial<ArticuloInventario>>({});
  const [formCategoria, setFormCategoria] = useState<Partial<Categoria>>({});
  const [formPrestamo, setFormPrestamo] = useState<Partial<Prestamo>>({});
  const [estadoDevolucion, setEstadoDevolucion] = useState<EstadoDevolucion>("bueno");

  // Staff Entrenadores List
  const [entrenadores, setEntrenadores] = useState<any[]>([]);

  // Sync state to RendimientoStore and Supabase
  const updateArticulosState = (newList: ArticuloInventario[]) => {
    setArticulos(newList);
    RendimientoStore.set("inventario_articulos", newList);
  };

  const updateCategoriasState = (newList: Categoria[]) => {
    setCategorias(newList);
    RendimientoStore.set("inventario_categorias", newList);
  };

  const updatePrestamosState = (newList: Prestamo[]) => {
    setPrestamos(newList);
    RendimientoStore.set("inventario_prestamos", newList);
  };

  // Seed Supabase DB if empty to guarantee Database persistence
  const ensureInventarioDBSeeded = async (orgId: string) => {
    try {
      const { data: catCheck } = await supabase.from("inventario_categorias").select("id").eq("organizacion_id", orgId);
      if (!catCheck || catCheck.length === 0) {
        const catsToInsert = CATEGORIAS_INIT.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          icono: c.icono,
          color: c.color,
          descripcion: c.descripcion,
          organizacion_id: orgId,
        }));
        await supabase.from("inventario_categorias").insert(catsToInsert);
      }

      const { data: artCheck } = await supabase.from("inventario_articulos").select("id").eq("organizacion_id", orgId);
      if (!artCheck || artCheck.length === 0) {
        const artsToInsert = ARTICULOS_INIT.map((a) => ({
          id: a.id,
          sku: a.sku,
          nombre: a.nombre,
          categoria_id: a.categoriaId,
          descripcion: a.descripcion,
          stock_actual: a.stockActual,
          stock_minimo: a.stockMinimo,
          stock_total: a.stockTotal,
          unidad: a.unidad,
          ubicacion: a.ubicacion,
          icono: a.icono,
          precio: a.precio,
          organizacion_id: orgId,
        }));
        await supabase.from("inventario_articulos").insert(artsToInsert);
      }
    } catch (err) {
      console.warn("Error seeding DB inventario:", err);
    }
  };

  // Fetch strictly from Database (Supabase)
  const fetchInventarioDB = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";

    try {
      await ensureInventarioDBSeeded(orgId);

      const [resArts, resCats, resPrest, resStaff] = await Promise.all([
        supabase.from("inventario_articulos").select("*").eq("organizacion_id", orgId),
        supabase.from("inventario_categorias").select("*").eq("organizacion_id", orgId),
        supabase.from("inventario_prestamos").select("*").eq("organizacion_id", orgId),
        supabase.from("entrenadores").select("*").eq("organizacion_id", orgId),
      ]);

      if (resCats.data && resCats.data.length > 0) {
        const mappedCats: Categoria[] = resCats.data.map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          icono: c.icono || "📦",
          color: c.color || "bg-slate-500/15 text-slate-600 border-slate-500/30",
          descripcion: c.descripcion || "",
        }));
        updateCategoriasState(mappedCats);
      }

      if (resArts.data && resArts.data.length > 0) {
        const mappedArts: ArticuloInventario[] = resArts.data.map((a: any) => ({
          id: a.id,
          sku: a.sku || `SKU-${a.id}`,
          nombre: a.nombre,
          categoriaId: a.categoria_id || a.categoriaId || "c1",
          descripcion: a.descripcion || "",
          stockActual: Number(a.stock_actual ?? a.stockActual ?? 10),
          stockMinimo: Number(a.stock_minimo ?? a.stockMinimo ?? 5),
          stockTotal: Number(a.stock_total ?? a.stockTotal ?? 15),
          unidad: a.unidad || "unidades",
          ubicacion: a.ubicacion || "Bodega Principal",
          icono: a.icono || "📦",
          precio: Number(a.precio || 15000),
        }));
        updateArticulosState(mappedArts);
      }

      if (resPrest.data && resPrest.data.length > 0) {
        const mappedPrest: Prestamo[] = resPrest.data.map((p: any) => ({
          id: p.id,
          articuloId: p.articulo_id || p.articuloId,
          responsable: p.responsable,
          cargo: p.cargo || "Entrenador Staff",
          cantidad: Number(p.cantidad || 1),
          fechaPrestamo: p.fecha_prestamo || p.fechaPrestamo,
          fechaDevolucionEsperada: p.fecha_devolucion_esperada || p.fechaDevolucionEsperada,
          fechaDevolucionReal: p.fecha_devolucion_real || p.fechaDevolucionReal,
          estado: p.estado || "activo",
          estadoDevolucion: p.estado_devolucion || p.estadoDevolucion,
          notas: p.notas || "",
        }));
        updatePrestamosState(mappedPrest);
      }

      if (resStaff.data && resStaff.data.length > 0) {
        setEntrenadores(resStaff.data);
      } else {
        const fromStore = RendimientoStore.get<any[]>("entrenadores_dynamics", []);
        setEntrenadores(fromStore);
      }
    } catch (err) {
      console.error("Error fetching inventory from DB:", err);
    }
  };

  useEffect(() => {
    fetchInventarioDB();
  }, []);

  // Filtered Articles Calculation
  const articulosFiltrados = useMemo(() => {
    return articulos.filter((a) => {
      if (catFilter !== "all" && a.categoriaId !== catFilter) return false;
      
      const prestadoCount = prestamos
        .filter((p) => p.articuloId === a.id && p.estado === "activo")
        .reduce((sum, p) => sum + p.cantidad, 0);

      const isStockBajo = a.stockActual <= a.stockMinimo;

      if (estFilter === "bajo" && !isStockBajo) return false;
      if (estFilter === "optimo" && isStockBajo) return false;
      if (estFilter === "prestado" && prestadoCount === 0) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          a.nombre.toLowerCase().includes(q) ||
          a.sku.toLowerCase().includes(q) ||
          a.descripcion.toLowerCase().includes(q) ||
          a.ubicacion.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [articulos, prestamos, catFilter, estFilter, searchQuery]);

  // Derived Inventory Metrics
  const totalArticulosDiferentes = articulos.length;
  const valorTotalInventario = articulos.reduce((sum, a) => sum + (a.stockActual * (a.precio || 0)), 0);
  const articulosStockBajo = articulos.filter((a) => a.stockActual <= a.stockMinimo);
  const totalItemsPrestados = prestamos
    .filter((p) => p.estado === "activo")
    .reduce((sum, p) => sum + p.cantidad, 0);

  // Chart Data: Stock Total por Categoría
  const chartStockPorCategoria = useMemo(() => {
    return categorias.map((cat) => {
      const items = articulos.filter((a) => a.categoriaId === cat.id);
      const totalStock = items.reduce((sum, a) => sum + a.stockActual, 0);
      return {
        name: cat.nombre,
        icono: cat.icono,
        stock: totalStock,
        cantidadItems: items.length,
      };
    }).sort((a, b) => b.stock - a.stock);
  }, [categorias, articulos]);

  // Helper getters
  const getCatNombre = (id: string) => categorias.find((c) => c.id === id)?.nombre || "Sin Categoría";
  const getCatIcono = (id: string) => categorias.find((c) => c.id === id)?.icono || "📦";
  const getArticuloNombre = (id: string) => articulos.find((a) => a.id === id)?.nombre || "Artículo";

  // Open Modal Add Article & Auto-generate SKU
  const handleOpenModalNuevoArticulo = () => {
    const defaultCatId = categorias[0]?.id || "c1";
    const autoSku = generateAutoSKU(defaultCatId, articulos, categorias);
    setFormArticulo({
      categoriaId: defaultCatId,
      sku: autoSku,
      stockActual: 15,
      stockMinimo: 5,
      precio: 15000,
      unidad: "unidades",
      ubicacion: "Bodega Principal – Estante A",
      icono: "📦",
    });
    setModalNuevoArticulo(true);
  };

  // Change category in article form -> Auto update SKU
  const handleCategorySelectInForm = (catId: string) => {
    const autoSku = generateAutoSKU(catId, articulos, categorias);
    setFormArticulo((prev) => ({
      ...prev,
      categoriaId: catId,
      sku: autoSku,
    }));
  };

  // CRUD Actions: Create New Article
  const handleSaveNuevoArticulo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formArticulo.nombre || !formArticulo.categoriaId) {
      toast.error("El nombre y la categoría son obligatorios");
      return;
    }

    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";
    const finalSku = formArticulo.sku || generateAutoSKU(formArticulo.categoriaId, articulos, categorias);

    const nuevo: ArticuloInventario = {
      id: `art_${Date.now()}`,
      sku: finalSku,
      nombre: formArticulo.nombre,
      categoriaId: formArticulo.categoriaId,
      descripcion: formArticulo.descripcion || "",
      stockActual: Number(formArticulo.stockActual ?? 10),
      stockMinimo: Number(formArticulo.stockMinimo ?? 5),
      stockTotal: Number(formArticulo.stockActual ?? 10),
      unidad: formArticulo.unidad || "unidades",
      ubicacion: formArticulo.ubicacion || "Bodega Principal",
      icono: formArticulo.icono || "📦",
      precio: Number(formArticulo.precio ?? 15000),
    };

    const updated = [nuevo, ...articulos];
    updateArticulosState(updated);

    await supabase.from("inventario_articulos").insert([{
      id: nuevo.id,
      sku: nuevo.sku,
      nombre: nuevo.nombre,
      categoria_id: nuevo.categoriaId,
      descripcion: nuevo.descripcion,
      stock_actual: nuevo.stockActual,
      stock_minimo: nuevo.stockMinimo,
      stock_total: nuevo.stockTotal,
      unidad: nuevo.unidad,
      ubicacion: nuevo.ubicacion,
      icono: nuevo.icono,
      precio: nuevo.precio,
      organizacion_id: orgId,
    }]);

    toast.success(`Artículo "${nuevo.nombre}" (SKU: ${nuevo.sku}) creado exitosamente en Supabase BD ✓`);
    setModalNuevoArticulo(false);
    setFormArticulo({});
  };

  // CRUD Actions: Delete Article
  const handleDeleteArticulo = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}" del inventario?`)) return;
    const updated = articulos.filter((a) => a.id !== id);
    updateArticulosState(updated);
    await supabase.from("inventario_articulos").delete().eq("id", id);
    toast.success(`Artículo "${nombre}" eliminado del sistema ✓`);
  };

  // CRUD Actions: Create Category
  const handleSaveNuevaCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoria.nombre) {
      toast.error("El nombre de la categoría es obligatorio");
      return;
    }

    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";
    const nueva: Categoria = {
      id: `cat_${Date.now()}`,
      nombre: formCategoria.nombre,
      icono: formCategoria.icono || "📦",
      color: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
      descripcion: formCategoria.descripcion || "",
    };

    const updated = [...categorias, nueva];
    updateCategoriasState(updated);

    await supabase.from("inventario_categorias").insert([{
      id: nueva.id,
      nombre: nueva.nombre,
      icono: nueva.icono,
      color: nueva.color,
      descripcion: nueva.descripcion,
      organizacion_id: orgId,
    }]);

    toast.success(`Categoría "${nueva.nombre}" creada correctamente en Supabase BD ✓`);
    setModalNuevaCategoria(false);
    setFormCategoria({});
  };

  // CRUD Actions: Register New Loan to Coach
  const handleSaveNuevoPrestamo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrestamo.articuloId || !formPrestamo.responsable || !formPrestamo.cantidad) {
      toast.error("Completa el artículo, responsable y la cantidad");
      return;
    }

    const targetArt = articulos.find((a) => a.id === formPrestamo.articuloId);
    if (!targetArt || targetArt.stockActual < Number(formPrestamo.cantidad)) {
      toast.error(`Stock insuficiente. Solo hay ${targetArt?.stockActual || 0} disponibles.`);
      return;
    }

    const orgId = RendimientoStore.getActiveOrganizacionId() || "org_asoderive_master";
    const todayStr = new Date().toISOString().split("T")[0];

    const nuevoPrestamo: Prestamo = {
      id: `prest_${Date.now()}`,
      articuloId: formPrestamo.articuloId,
      responsable: formPrestamo.responsable,
      cargo: formPrestamo.cargo || "Director Técnico",
      cantidad: Number(formPrestamo.cantidad),
      fechaPrestamo: todayStr,
      fechaDevolucionEsperada: formPrestamo.fechaDevolucionEsperada || todayStr,
      estado: "activo",
      notas: formPrestamo.notas || "Entregado para sesión de campo",
    };

    // Discount stock
    const articulosActualizados = articulos.map((a) =>
      a.id === formPrestamo.articuloId
        ? { ...a, stockActual: a.stockActual - Number(formPrestamo.cantidad) }
        : a
    );

    updateArticulosState(articulosActualizados);
    updatePrestamosState([nuevoPrestamo, ...prestamos]);

    await supabase.from("inventario_prestamos").insert([{
      id: nuevoPrestamo.id,
      articulo_id: nuevoPrestamo.articuloId,
      responsable: nuevoPrestamo.responsable,
      cargo: nuevoPrestamo.cargo,
      cantidad: nuevoPrestamo.cantidad,
      fecha_prestamo: nuevoPrestamo.fechaPrestamo,
      fecha_devolucion_esperada: nuevoPrestamo.fechaDevolucionEsperada,
      estado: nuevoPrestamo.estado,
      notas: nuevoPrestamo.notas,
      organizacion_id: orgId,
    }]);

    await supabase.from("inventario_articulos").update({
      stock_actual: targetArt.stockActual - Number(formPrestamo.cantidad)
    }).eq("id", targetArt.id);

    toast.success(`Préstamo de ${formPrestamo.cantidad} unidades registrado a ${formPrestamo.responsable} ✓`);
    setModalNuevoPrestamo(false);
    setFormPrestamo({});
  };

  // CRUD Actions: Register Loan Return (Recalculates Stock)
  const handleConfirmarDevolucion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDevolucion) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const isPerdido = estadoDevolucion === "perdido";
    const deltaStock = isPerdido ? 0 : modalDevolucion.cantidad;

    const prestamosActualizados = prestamos.map((p) =>
      p.id === modalDevolucion.id
        ? { ...p, estado: "devuelto" as EstadoPrestamo, estadoDevolucion, fechaDevolucionReal: todayStr }
        : p
    );

    let articulosActualizados = articulos;
    if (deltaStock > 0) {
      articulosActualizados = articulos.map((a) =>
        a.id === modalDevolucion.articuloId
          ? { ...a, stockActual: a.stockActual + deltaStock }
          : a
      );
      updateArticulosState(articulosActualizados);
      await supabase.from("inventario_articulos").update({
        stock_actual: (articulos.find((a) => a.id === modalDevolucion.articuloId)?.stockActual || 0) + deltaStock
      }).eq("id", modalDevolucion.articuloId);
    }

    updatePrestamosState(prestamosActualizados);
    await supabase.from("inventario_prestamos").update({
      estado: "devuelto",
      estado_devolucion: estadoDevolucion,
      fecha_devolucion_real: todayStr
    }).eq("id", modalDevolucion.id);

    toast.success(`Devolución de ${modalDevolucion.cantidad} unidades asentada correctamente (${estadoDevolucion.toUpperCase()}) ✓`);
    setModalDevolucion(null);
  };

  return (
    <div className="font-['Segoe_UI',sans-serif] space-y-6 pb-12 text-slate-900 dark:text-slate-100">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold text-[11px] uppercase tracking-wider">
              Control Patrimonial & Logística BD
            </Badge>
            <span className="text-xs text-muted-foreground font-normal">| {totalArticulosDiferentes} Ítems Registrados</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5 mt-1">
            <Boxes className="h-7 w-7 text-primary" /> Gestión de Inventario & Activos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-normal">
            Control de stock, alertas de reorden, mantenimiento de categorías en BD y bitácora de préstamos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchInventarioDB} className="text-xs font-normal h-9 rounded-xl border-border gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Sincronizar Base de Datos
          </Button>

          {activeTab === "articulos" && (
            <Button onClick={handleOpenModalNuevoArticulo} className="bg-primary text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-md">
              <Plus className="h-4 w-4" /> ➕ Agregar Artículo
            </Button>
          )}

          {activeTab === "categorias" && (
            <Button onClick={() => setModalNuevaCategoria(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-md">
              <FolderPlus className="h-4 w-4" /> ➕ Nueva Categoría
            </Button>
          )}

          {activeTab === "prestamos" && (
            <Button onClick={() => setModalNuevoPrestamo(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-md">
              <Plus className="h-4 w-4" /> ➕ Nuevo Préstamo
            </Button>
          )}
        </div>
      </div>

      {/* 🧭 NAVEGACIÓN PRINCIPAL: ENRUTADOR DE 4 PESTAÑAS HORIZONTALES (SEGOE UI SEMIBOLD, 14PX) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-border pb-2 overflow-x-auto">
          <TabsList className="bg-transparent border-0 p-0 h-auto gap-2 flex-nowrap min-w-max">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2.5 text-[14px] font-semibold font-['Segoe_UI',sans-serif] rounded-xl shadow-xs transition-all"
            >
              📊 Dashboard Analítico
            </TabsTrigger>

            <TabsTrigger
              value="articulos"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-4 py-2.5 text-[14px] font-semibold font-['Segoe_UI',sans-serif] rounded-xl shadow-xs transition-all"
            >
              📦 Tabla Maestra de Artículos ({articulos.length})
            </TabsTrigger>

            <TabsTrigger
              value="categorias"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white px-4 py-2.5 text-[14px] font-semibold font-['Segoe_UI',sans-serif] rounded-xl shadow-xs transition-all"
            >
              📁 Categorías & Filtros ({categorias.length})
            </TabsTrigger>

            <TabsTrigger
              value="prestamos"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white px-4 py-2.5 text-[14px] font-semibold font-['Segoe_UI',sans-serif] rounded-xl shadow-xs transition-all"
            >
              🔄 Préstamos & Pérdidas ({prestamos.filter(p => p.estado === "activo").length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================================= */}
        {/* 📊 PESTAÑA 1: DASHBOARD ANALÍTICO (GRÁFICAS DE RESUMEN) */}
        {/* ========================================================================= */}
        <TabsContent value="dashboard" className="mt-0 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 bg-card border-border shadow-xs space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Valor Total del Inventario</span>
              <p className="text-2xl font-black font-mono text-primary">{formatCRC(valorTotalInventario)}</p>
              <span className="text-[10px] text-muted-foreground font-normal">{articulos.length} tipos de materiales</span>
            </Card>

            <Card className="p-4 bg-card border-amber-500/30 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-amber-600">Stock Bajo & Reorden</span>
              <p className="text-2xl font-black font-mono text-amber-600">{articulosStockBajo.length} Ítems</p>
              <span className="text-[10px] text-muted-foreground font-normal">Requieren compra de insumos</span>
            </Card>

            <Card className="p-4 bg-card border-blue-500/30 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-blue-600">Material Prestado en Campo</span>
              <p className="text-2xl font-black font-mono text-blue-600">{totalItemsPrestados} Unidades</p>
              <span className="text-[10px] text-muted-foreground font-normal">En uso por entrenadores</span>
            </Card>

            <Card className="p-4 bg-card border-emerald-500/30 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-emerald-600">Estatus Operativo General</span>
              <p className="text-2xl font-black font-mono text-emerald-600">
                {articulosStockBajo.length === 0 ? "100% Óptimo" : "Atención Requerida"}
              </p>
              <span className="text-[10px] text-muted-foreground font-normal">Auditoría en tiempo real BD</span>
            </Card>
          </div>

          {/* Gráfico de Barras: Stock Total por Categoría */}
          <Card className="border-border shadow-sm rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Distribución de Stock por Categoría de Material
                </h3>
                <p className="text-xs text-muted-foreground font-normal">Conteo total de unidades físicas almacenadas en bodegas</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartStockPorCategoria} margin={{ left: -10, right: 10, top: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                  <Bar dataKey="stock" name="Unidades Físicas" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Alert List for Low Stock */}
          {articulosStockBajo.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5 p-4 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> Alertas de Reorden Automático ({articulosStockBajo.length} Ítems con Stock Bajo)
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {articulosStockBajo.map((a) => (
                  <div key={a.id} className="p-3 bg-card border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <span>{a.icono}</span> {a.nombre}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Mínimo: {a.stockMinimo} {a.unidad} | Actual: <span className="font-bold text-rose-600">{a.stockActual} {a.unidad}</span>
                      </p>
                    </div>
                    <Button size="xs" onClick={() => setActiveTab("articulos")} className="bg-amber-600 text-white h-7 text-[10px] rounded-lg">
                      Ver Ítem
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* 📦 PESTAÑA 2: TABLA MAESTRA DE ARTÍCULOS (SE OCULTA EL GRÁFICO Y LISTA DATATABLE) */}
        {/* ========================================================================= */}
        <TabsContent value="articulos" className="mt-0 space-y-4">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            {/* Header & Filtros */}
            <div className="p-4 bg-card border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-600" /> Tabla Maestra de Artículos de Inventario BD
                </h3>
                <p className="text-xs text-muted-foreground font-normal">
                  Listado oficial de insumos registrados en la Base de Datos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl justify-end">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por SKU, nombre, categoría o ubicación..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="h-9 px-2 bg-background border border-border rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="all">Todas las Categorías ({categorias.length})</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                  ))}
                </select>

                <select
                  value={estFilter}
                  onChange={(e) => setEstFilter(e.target.value)}
                  className="h-9 px-2 bg-background border border-border rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="all">Todos los Estatus</option>
                  <option value="optimo">🟢 Stock Óptimo</option>
                  <option value="bajo">🔴 Stock Bajo / Reorden</option>
                  <option value="prestado">🔄 En Préstamo</option>
                </select>
              </div>
            </div>

            {/* Datatable de Artículos */}
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-normal">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5">SKU / Código</th>
                      <th className="p-3.5">Miniatura</th>
                      <th className="p-3.5">Nombre del Artículo</th>
                      <th className="p-3.5">Categoría</th>
                      <th className="p-3.5">Stock Disponible</th>
                      <th className="p-3.5">Stock Prestado</th>
                      <th className="p-3.5">Costo Unitario</th>
                      <th className="p-3.5">Valor Total Lote</th>
                      <th className="p-3.5">Estatus</th>
                      <th className="p-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {articulosFiltrados.length > 0 ? (
                      articulosFiltrados.map((a) => {
                        const prestadoCount = prestamos
                          .filter((p) => p.articuloId === a.id && p.estado === "activo")
                          .reduce((sum, p) => sum + p.cantidad, 0);

                        const isStockBajo = a.stockActual <= a.stockMinimo;
                        const valorTotalLote = a.stockActual * (a.precio || 0);

                        return (
                          <tr key={a.id} className="hover:bg-muted/40 transition-colors">
                            <td className="p-3.5 font-mono text-[11px] font-bold text-foreground">{a.sku}</td>
                            <td className="p-3.5 text-lg">{a.icono}</td>
                            <td className="p-3.5">
                              <p className="font-bold text-foreground text-xs">{a.nombre}</p>
                              <p className="text-[10px] text-muted-foreground">{a.ubicacion}</p>
                            </td>
                            <td className="p-3.5">
                              <Badge variant="outline" className="text-[10px] font-normal">
                                {getCatIcono(a.categoriaId)} {getCatNombre(a.categoriaId)}
                              </Badge>
                            </td>
                            <td className="p-3.5 font-mono font-bold text-foreground">
                              {a.stockActual} {a.unidad}
                            </td>
                            <td className="p-3.5 font-mono font-semibold text-blue-600">
                              {prestadoCount > 0 ? `${prestadoCount} prestados` : "0"}
                            </td>
                            <td className="p-3.5 font-mono text-muted-foreground">₡{(a.precio || 0).toLocaleString()}</td>
                            <td className="p-3.5 font-mono font-extrabold text-primary">₡{valorTotalLote.toLocaleString()}</td>
                            <td className="p-3.5">
                              <Badge className={`text-[10px] font-bold ${
                                isStockBajo
                                  ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                                  : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                              }`}>
                                {isStockBajo ? "🔴 Stock Bajo" : "🟢 Óptimo"}
                              </Badge>
                            </td>
                            <td className="p-3.5 text-right space-x-1">
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => {
                                  setFormPrestamo({ articuloId: a.id });
                                  setModalNuevoPrestamo(true);
                                }}
                                className="h-7 text-[10px] text-blue-600 hover:bg-blue-500/10"
                              >
                                Prestar
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleDeleteArticulo(a.id, a.nombre)}
                                className="h-7 text-[10px] text-rose-600 hover:bg-rose-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-muted-foreground">
                          No se encontraron artículos para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 📁 PESTAÑA 3: CATEGORÍAS & AGRUPACIONES (MANTENIMIENTO DE FILTROS) */}
        {/* ========================================================================= */}
        <TabsContent value="categorias" className="mt-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <FolderPlus className="h-4 w-4 text-indigo-600" /> Mantenimiento de Categorías Oficiales Supabase BD ({categorias.length})
              </h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 font-normal">
                Agrupaciones que organizan los artículos de la academia y alimentan los gráficos.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categorias.map((c) => {
              const countArticulos = articulos.filter((a) => a.categoriaId === c.id).length;
              const sumStock = articulos.filter((a) => a.categoriaId === c.id).reduce((sum, a) => sum + a.stockActual, 0);

              return (
                <Card key={c.id} className="p-4 bg-card border-border shadow-xs hover:border-indigo-500/40 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{c.icono}</span>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {countArticulos} Ítems Registrados
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{c.nombre}</h4>
                    <p className="text-xs text-muted-foreground font-normal">{c.descripcion}</p>
                  </div>
                  <div className="pt-2 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Stock total acumulado:</span>
                    <span className="font-bold font-mono text-indigo-600">{sumStock} unidades</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 🔄 PESTAÑA 4: PRÉSTAMOS & PÉRDIDAS (BITÁCORA DE CAMPO DE ENTRENADORES) */}
        {/* ========================================================================= */}
        <TabsContent value="prestamos" className="mt-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-emerald-600" /> Bitácora de Préstamos a Entrenadores & Pérdidas
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-normal">
                Registro de material entregado a campo. Al asentar devoluciones se recalcula el stock en tiempo real.
              </p>
            </div>
          </div>

          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-normal">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
                    <tr>
                      <th className="p-3.5">Artículo Prestado</th>
                      <th className="p-3.5">Entrenador / Responsable</th>
                      <th className="p-3.5">Cantidad</th>
                      <th className="p-3.5">Fecha Préstamo</th>
                      <th className="p-3.5">Devolución Esperada</th>
                      <th className="p-3.5">Estado Préstamo</th>
                      <th className="p-3.5 text-right">Acción Devolución</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {prestamos.length > 0 ? (
                      prestamos.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                          <td className="p-3.5 font-bold text-foreground">{getArticuloNombre(p.articuloId)}</td>
                          <td className="p-3.5">
                            <p className="font-semibold text-foreground">{p.responsable}</p>
                            <p className="text-[10px] text-muted-foreground">{p.cargo}</p>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-indigo-600">{p.cantidad} unidades</td>
                          <td className="p-3.5 font-mono text-muted-foreground">{p.fechaPrestamo}</td>
                          <td className="p-3.5 font-mono text-muted-foreground">{p.fechaDevolucionEsperada}</td>
                          <td className="p-3.5">
                            <Badge className={`text-[10px] font-bold ${
                              p.estado === "activo"
                                ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                                : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                            }`}>
                              {p.estado === "activo" ? "⏳ En Uso / Pendiente" : `✓ Devuelto (${p.estadoDevolucion || "bueno"})`}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right">
                            {p.estado === "activo" ? (
                              <Button
                                size="xs"
                                onClick={() => setModalDevolucion(p)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 text-[10px] gap-1 shadow-xs"
                              >
                                <RotateCcw className="h-3 w-3" /> Registrar Devolución
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Completado</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No hay registros de préstamos de material.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL 1: AGREGAR NUEVO ARTÍCULO (CON SKU AUTOMÁTICO BD Y CATEGORÍAS REALES DE BD) */}
      <Dialog open={modalNuevoArticulo} onOpenChange={setModalNuevoArticulo}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" /> ➕ Agregar Nuevo Artículo a Inventario BD
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Ingresa el material físico con su SKU generado automáticamente según la categoría.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNuevoArticulo} className="space-y-3 text-xs font-normal">
            <div>
              <Label className="text-xs font-semibold">Nombre del Artículo</Label>
              <Input
                value={formArticulo.nombre || ""}
                onChange={(e) => setFormArticulo({ ...formArticulo, nombre: e.target.value })}
                placeholder="Ej. Balón Molten V5M5000 N°5"
                className="h-9 mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold flex items-center justify-between">
                  Categoría BD
                  <Sparkles className="h-3 w-3 text-purple-600" />
                </Label>
                <select
                  value={formArticulo.categoriaId || ""}
                  onChange={(e) => handleCategorySelectInForm(e.target.value)}
                  className="w-full h-9 px-2 bg-background border border-border rounded-xl text-xs font-semibold mt-1 outline-none"
                  required
                >
                  <option value="">Selecciona Categoria</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold flex items-center justify-between">
                  SKU / Código
                  <Badge variant="outline" className="text-[9px] text-purple-600 border-purple-500/30">Auto BD</Badge>
                </Label>
                <Input
                  value={formArticulo.sku || ""}
                  readOnly
                  placeholder="Autogenerado BD"
                  className="h-9 mt-1 font-mono font-bold bg-muted/40 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs font-semibold">Stock Inicial</Label>
                <Input
                  type="number"
                  value={formArticulo.stockActual ?? 15}
                  onChange={(e) => setFormArticulo({ ...formArticulo, stockActual: Number(e.target.value) })}
                  className="h-9 mt-1 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Stock Mínimo (Alerta)</Label>
                <Input
                  type="number"
                  value={formArticulo.stockMinimo ?? 5}
                  onChange={(e) => setFormArticulo({ ...formArticulo, stockMinimo: Number(e.target.value) })}
                  className="h-9 mt-1 font-mono font-bold text-amber-600"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Costo Unitario (₡)</Label>
                <Input
                  type="number"
                  value={formArticulo.precio ?? 15000}
                  onChange={(e) => setFormArticulo({ ...formArticulo, precio: Number(e.target.value) })}
                  className="h-9 mt-1 font-mono font-bold text-primary"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Ubicación Física</Label>
              <Input
                value={formArticulo.ubicacion || ""}
                onChange={(e) => setFormArticulo({ ...formArticulo, ubicacion: e.target.value })}
                placeholder="Ej. Bodega Principal – Estante B"
                className="h-9 mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalNuevoArticulo(false)} className="h-9 text-xs font-normal">Cancelar</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 text-xs gap-1.5 shadow-md">
                <Check className="h-4 w-4" /> Guardar Artículo BD
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: AGREGAR NUEVA CATEGORÍA */}
      <Dialog open={modalNuevaCategoria} onOpenChange={setModalNuevaCategoria}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-indigo-600" /> ➕ Crear Nueva Categoría de Insumos BD
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Agrupación que alimentará los filtros y gráficos del inventario.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNuevaCategoria} className="space-y-3 text-xs font-normal">
            <div>
              <Label className="text-xs font-semibold">Nombre de la Categoría</Label>
              <Input
                value={formCategoria.nombre || ""}
                onChange={(e) => setFormCategoria({ ...formCategoria, nombre: e.target.value })}
                placeholder="Ej. Material de Gimnasio & Pesas"
                className="h-9 mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Icono (Emoji)</Label>
              <Input
                value={formCategoria.icono || "🏋️"}
                onChange={(e) => setFormCategoria({ ...formCategoria, icono: e.target.value })}
                placeholder="Ej. 🏋️, ⚽, 👕"
                className="h-9 mt-1 text-base"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Descripción de la Categoría</Label>
              <Textarea
                value={formCategoria.descripcion || ""}
                onChange={(e) => setFormCategoria({ ...formCategoria, descripcion: e.target.value })}
                placeholder="Descripción del tipo de material..."
                className="mt-1 h-20 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalNuevaCategoria(false)} className="h-9 text-xs font-normal">Cancelar</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs gap-1.5 shadow-md">
                <Check className="h-4 w-4" /> Guardar Categoría BD
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: REGISTRAR PRÉSTAMO A ENTRENADOR */}
      <Dialog open={modalNuevoPrestamo} onOpenChange={setModalNuevoPrestamo}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" /> ➕ Registrar Préstamo de Material BD
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Asigna material a un entrenador para la práctica del día.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNuevoPrestamo} className="space-y-3 text-xs font-normal">
            <div>
              <Label className="text-xs font-semibold">Artículo a Prestar</Label>
              <select
                value={formPrestamo.articuloId || ""}
                onChange={(e) => setFormPrestamo({ ...formPrestamo, articuloId: e.target.value })}
                className="w-full h-9 px-2 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                required
              >
                <option value="">Selecciona Artículo</option>
                {articulos.map((a) => (
                  <option key={a.id} value={a.id}>{a.icono} {a.nombre} (Stock: {a.stockActual})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Entrenador / Responsable</Label>
                {entrenadores.length > 0 ? (
                  <select
                    value={formPrestamo.responsable || ""}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, responsable: e.target.value })}
                    className="w-full h-9 px-2 bg-background border border-border rounded-xl text-xs font-normal mt-1 outline-none"
                    required
                  >
                    <option value="">Selecciona Staff</option>
                    {entrenadores.map((ent) => (
                      <option key={ent.id} value={ent.nombre}>{ent.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={formPrestamo.responsable || ""}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, responsable: e.target.value })}
                    placeholder="Ej. Carlos Vega"
                    className="h-9 mt-1"
                    required
                  />
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold">Cantidad a Entregar</Label>
                <Input
                  type="number"
                  value={formPrestamo.cantidad ?? 5}
                  onChange={(e) => setFormPrestamo({ ...formPrestamo, cantidad: Number(e.target.value) })}
                  className="h-9 mt-1 font-mono font-bold text-emerald-600"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Fecha Devolución Esperada</Label>
              <Input
                type="date"
                value={formPrestamo.fechaDevolucionEsperada || new Date().toISOString().split("T")[0]}
                onChange={(e) => setFormPrestamo({ ...formPrestamo, fechaDevolucionEsperada: e.target.value })}
                className="h-9 mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Notas / Sesión</Label>
              <Input
                value={formPrestamo.notas || ""}
                onChange={(e) => setFormPrestamo({ ...formPrestamo, notas: e.target.value })}
                placeholder="Ej. Entrenamiento táctico Sub-17"
                className="h-9 mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalNuevoPrestamo(false)} className="h-9 text-xs font-normal">Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-1.5 shadow-md">
                <Check className="h-4 w-4" /> Registrar Préstamo BD
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: ASENTAR DEVOLUCIÓN DE PRÉSTAMO (RECALCULA STOCK) */}
      <Dialog open={!!modalDevolucion} onOpenChange={(open) => !open && setModalDevolucion(null)}>
        <DialogContent className="max-w-md bg-card border-border rounded-2xl font-['Segoe_UI',sans-serif]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-emerald-600" /> Asentar Devolución de Campo
            </DialogTitle>
            <DialogDescription className="text-xs font-normal">
              Regresa los materiales al inventario y recalcula el stock en tiempo real.
            </DialogDescription>
          </DialogHeader>

          {modalDevolucion && (
            <form onSubmit={handleConfirmarDevolucion} className="space-y-3.5 text-xs font-normal">
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                <p className="font-bold text-foreground">{getArticuloNombre(modalDevolucion.articuloId)}</p>
                <p className="text-[11px] text-muted-foreground">Responsable: {modalDevolucion.responsable} • {modalDevolucion.cantidad} Unidades</p>
              </div>

              <div>
                <Label className="text-xs font-semibold">Estado de los Ítems Devueltos</Label>
                <select
                  value={estadoDevolucion}
                  onChange={(e: any) => setEstadoDevolucion(e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-xl text-xs font-bold mt-1 outline-none"
                >
                  <option value="bueno">🟢 Devuelto en Buen Estado (Retorna al Stock)</option>
                  <option value="danado">🟡 Devuelto Dañado / Inservible</option>
                  <option value="perdido">🔴 Material Perdido en Campo (No Retorna al Stock)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalDevolucion(null)} className="h-9 text-xs font-normal">Cancelar</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-1.5 shadow-md">
                  <Check className="h-4 w-4" /> Confirmar Devolución & Actualizar BD
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
