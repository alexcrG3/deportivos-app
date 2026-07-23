import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  ShoppingBag, ShoppingCart, Plus, Search, Filter, Tag, Check, X,
  Pencil, Trash2, Eye, Package, ShieldCheck, ArrowRight, Truck,
  CreditCard, Sparkles, AlertCircle, Clock, CheckCircle2, UserCheck,
  ChevronRight, Box, SlidersHorizontal, RefreshCw, BarChart2, Layers, ZoomIn, Maximize2, Settings
} from "lucide-react";
import { useRole } from "@/hooks/use-role";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { KitCreatorStudio } from "@/components/tienda/KitCreatorStudio";

export const Route = createFileRoute("/_app/tienda")({ component: TiendaPage });

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────
type CategoriaProducto = string;

interface ConfigFiltros {
  categorias: string[];
  colores: string[];
  tallas: string[];
  marcas: string[];
}

const DEFAULT_CONFIG_FILTROS: ConfigFiltros = {
  categorias: ["CAMISETA", "ACCESORIOS", "BALONES", "CALZADO", "MALETINES", "MEDIAS", "PROTECTORES", "SHORT"],
  colores: ["Blanco", "Negro", "Azul", "Rojo", "Verde", "Amarillo", "Rosa", "Gris"],
  tallas: ["6", "8", "10", "12", "14", "16", "XS", "S", "M", "L", "XL", "2XL"],
  marcas: ["DeportivOS", "Adidas", "Nike", "Puma", "Under Armour", "Kappa"],
};

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoria: CategoriaProducto;
  descripcion: string;
  precio: number;
  imagen: string;
  popular?: boolean;
  destacado?: boolean;
  genero?: "Masculino" | "Femenino" | "Unisex" | "Infantil";
  marca?: string;
  colores?: string[];
  tallas: string[];
  stockPorTalla: Record<string, number>;
  activo: boolean;
}

interface ItemCarrito {
  productoId: string;
  sku: string;
  nombre: string;
  precio: number;
  talla: string;
  color?: string;
  cantidad: number;
  imagen: string;
}

interface Pedido {
  id: string;
  codigo: string;
  clienteNombre: string;
  atletaNombre: string;
  categoriaAtleta: string;
  fecha: string;
  items: ItemCarrito[];
  total: number;
  metodoPago: "tarjeta" | "transferencia" | "cargo_mensualidad";
  estado: "pendiente" | "listo_entrega" | "entregado" | "cancelado";
  notas?: string;
}

// ─────────────────────────────────────────────
//  STORE DATA
// ─────────────────────────────────────────────
const PRODUCTOS_INICIALES: Producto[] = [];

const PEDIDOS_INICIALES: Pedido[] = [
  {
    id: "ped-1",
    codigo: "ORD-9821",
    clienteNombre: "Sofía Alvarado",
    atletaNombre: "Mateo Alvarado",
    categoriaAtleta: "Sub-12 A",
    fecha: "2026-07-20",
    items: [
      { productoId: "prod-1", sku: "ATH-KD8363", nombre: "KIT OFICIAL DE COMPETENCIA ALEMANIA 2026", precio: 35000, talla: "10", color: "Blanco/Negro", cantidad: 1, imagen: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&auto=format&fit=crop&q=80" },
      { productoId: "prod-7", sku: "ATH-SOC220", nombre: "MEDIAS COMPRESIVAS DE FÚTBOL", precio: 6500, talla: "Juvenil (35-39)", color: "Blanco", cantidad: 2, imagen: "https://images.unsplash.com/photo-1579298245158-33e8f568f7d3?w=600&auto=format&fit=crop&q=80" },
    ],
    total: 48000,
    metodoPago: "tarjeta",
    estado: "listo_entrega",
    notas: "Retira la mamá en el entrenamiento del jueves",
  },
];

function formatCRC(amount: number) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(amount);
}

// Compress Base64 images to prevent Supabase payload errors
function compressImage(base64Str: string, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith("data:image")) return resolve(base64Str);
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(base64Str);
  });
}

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
function TiendaPage() {
  const { role } = useRole();
  const isAdmin = role === "admin";

  const [productos, setProductos] = useState<Producto[]>(() => {
    return RendimientoStore.get<Producto[]>("tienda_productos", PRODUCTOS_INICIALES);
  });
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    return RendimientoStore.get<Pedido[]>("tienda_pedidos", PEDIDOS_INICIALES);
  });
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Filter States
  const [categoriaSel, setCategoriaSel] = useState<string>("TODAS");
  const [colorSel, setColorSel] = useState<string>("TODOS");
  const [tallaSel, setTallaSel] = useState<string>("TODAS");
  const [generoSel, setGeneroSel] = useState<string>("TODOS");
  const [marcaSel, setMarcaSel] = useState<string>("TODAS");
  const [busqueda, setBusqueda] = useState<string>("");
  const [ordenarPor, setOrdenarPor] = useState<string>("popular");

  // Tab State
  const [activeTab, setActiveTab] = useState<string>("tienda");

  // Modals
  const [modalProductoDetail, setModalProductoDetail] = useState<Producto | null>(null);
  const [tallaSeleccionada, setTallaSeleccionada] = useState<string>("");
  const [colorSeleccionado, setColorSeleccionado] = useState<string>("");
  const [cantidadSel, setCantidadSel] = useState<number>(1);

  // Lightbox Modal Image Zoom State
  const [imagenAmpliada, setImagenAmpliada] = useState<{ url: string; titulo: string; producto: Producto } | null>(null);

  // Custom Delete Modal State
  const [productoEliminar, setProductoEliminar] = useState<Producto | null>(null);

  // Dynamic Filter Options Configuration State
  const [configFiltros, setConfigFiltros] = useState<ConfigFiltros>(() => {
    return RendimientoStore.get<ConfigFiltros>("tienda_config_filtros", DEFAULT_CONFIG_FILTROS);
  });
  const [modalConfigFiltros, setModalConfigFiltros] = useState<boolean>(false);
  const [nuevaOpcionInput, setNuevaOpcionInput] = useState<string>("");
  const [seccionConfigSel, setSeccionConfigSel] = useState<"categorias" | "colores" | "tallas" | "marcas">("categorias");

  const saveConfigFiltros = (newConfig: ConfigFiltros) => {
    setConfigFiltros(newConfig);
    RendimientoStore.set("tienda_config_filtros", newConfig);
    supabase.from("tienda_config").upsert({ id: "config_filtros", data: newConfig }).then();
  };

  // Admin Modals
  const [modalAdminProducto, setModalAdminProducto] = useState<boolean>(false);
  const [productoEditar, setProductoEditar] = useState<Partial<Producto> | null>(null);
  const [modalCheckout, setModalCheckout] = useState<boolean>(false);
  const [atletaAsignado, setAtletaAsignado] = useState<string>("Mateo Alvarado");
  const [metodoPagoSel, setMetodoPagoSel] = useState<"tarjeta" | "transferencia" | "cargo_mensualidad">("cargo_mensualidad");

  // Supabase Sync (Reads clean products from DB without wiping local storage)
  useEffect(() => {
    const fetchSupabaseTienda = async () => {
      try {
        const { data: dataProds, error } = await supabase.from("tienda_productos").select("*");
        if (error) {
          console.warn("Supabase tienda_productos fetch warning:", error.message);
        } else if (dataProds && dataProds.length > 0) {
          const mappedProds: Producto[] = dataProds.map((p: any) => ({
            id: p.id,
            sku: p.sku || `SKU-${p.id}`,
            nombre: p.nombre,
            categoria: p.categoria,
            descripcion: p.descripcion,
            precio: Number(p.precio),
            imagen: p.imagen || "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&auto=format&fit=crop&q=80",
            popular: p.popular,
            destacado: p.destacado,
            genero: p.genero || "Unisex",
            marca: p.marca || "DeportivOS",
            tallas: p.tallas || [],
            stockPorTalla: p.stock_por_talla || {},
            colores: p.colores || [],
            activo: p.activo ?? true,
          }));
          setProductos(mappedProds);
          RendimientoStore.set("tienda_productos", mappedProds);
        } else {
          const localSaved = RendimientoStore.get<Producto[]>("tienda_productos", []);
          if (localSaved && localSaved.length > 0) {
            setProductos(localSaved);
          }
        }

        const { data: dataPeds } = await supabase.from("tienda_pedidos").select("*").order("created_at", { ascending: false });
        if (dataPeds && dataPeds.length > 0) {
          const mappedPeds: Pedido[] = dataPeds.map((p: any) => ({
            id: p.id,
            codigo: p.codigo,
            clienteNombre: p.cliente_nombre,
            atletaNombre: p.atleta_nombre,
            categoriaAtleta: p.categoria_atleta,
            fecha: p.fecha,
            items: p.items || [],
            total: Number(p.total),
            metodoPago: p.metodo_pago,
            estado: p.estado,
            notas: p.notas,
          }));
          setPedidos(mappedPeds);
          RendimientoStore.set("tienda_pedidos", mappedPeds);
        }
      } catch (err) {
        console.warn("Supabase fetch note:", err);
      }
    };
    fetchSupabaseTienda();
  }, []);

  const updateProductosState = (newProds: Producto[]) => {
    setProductos(newProds);
    RendimientoStore.set("tienda_productos", newProds);
  };

  const updatePedidosState = (newPeds: Pedido[]) => {
    setPedidos(newPeds);
    RendimientoStore.set("tienda_pedidos", newPeds);
  };

  // Filtered Products Calculation
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (!p.activo && !isAdmin) return false;
      const matchCat = categoriaSel === "TODAS" || p.categoria === categoriaSel;
      const matchColor = colorSel === "TODOS" || p.colores?.some((c) => c.toLowerCase().includes(colorSel.toLowerCase()));
      const matchTalla = tallaSel === "TODAS" || p.tallas.includes(tallaSel);
      const matchGenero = generoSel === "TODOS" || p.genero === generoSel;
      const matchMarca = marcaSel === "TODAS" || p.marca === marcaSel;
      const matchBusqueda =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(busqueda.toLowerCase());

      return matchCat && matchColor && matchTalla && matchGenero && matchMarca && matchBusqueda;
    }).sort((a, b) => {
      if (ordenarPor === "precio_asc") return a.precio - b.precio;
      if (ordenarPor === "precio_desc") return b.precio - a.precio;
      if (ordenarPor === "nombre") return a.nombre.localeCompare(b.nombre);
      return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
    });
  }, [productos, categoriaSel, colorSel, tallaSel, generoSel, marcaSel, busqueda, ordenarPor, isAdmin]);

  // Cart helper totals
  const totalCarrito = useMemo(() => carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0), [carrito]);
  const itemsCountCarrito = useMemo(() => carrito.reduce((acc, i) => acc + i.cantidad, 0), [carrito]);

  // Handle Add to Cart
  const handleAddToCart = (producto: Producto) => {
    if (!tallaSeleccionada) {
      toast.error("Por favor selecciona una talla.");
      return;
    }
    const stockDisponible = producto.stockPorTalla[tallaSeleccionada] || 0;
    if (stockDisponible < cantidadSel) {
      toast.error(`Stock insuficiente. Solo quedan ${stockDisponible} unidades de la talla ${tallaSeleccionada}.`);
      return;
    }

    const index = carrito.findIndex(
      (i) => i.productoId === producto.id && i.talla === tallaSeleccionada && i.color === colorSeleccionado
    );

    if (index > -1) {
      const nuevo = [...carrito];
      nuevo[index].cantidad += cantidadSel;
      setCarrito(nuevo);
    } else {
      setCarrito([
        ...carrito,
        {
          productoId: producto.id,
          sku: producto.sku,
          nombre: producto.nombre,
          precio: producto.precio,
          talla: tallaSeleccionada,
          color: colorSeleccionado || producto.colores?.[0],
          cantidad: cantidadSel,
          imagen: producto.imagen,
        },
      ]);
    }

    toast.success(`🛒 Agregado: ${producto.nombre} (Talla: ${tallaSeleccionada})`);
    setModalProductoDetail(null);
  };

  const handleRemoveFromCart = (index: number) => {
    const nuevo = [...carrito];
    nuevo.splice(index, 1);
    setCarrito(nuevo);
    toast.info("Producto eliminado del carrito");
  };

  const handleVaciarCarrito = () => {
    setCarrito([]);
    setModalCheckout(false);
    toast.info("Carrito vaciado correctamente");
  };

  // Complete Order
  const handleFinalizarCompra = () => {
    if (carrito.length === 0) return;

    const nuevoPedido: Pedido = {
      id: `ped-${Date.now()}`,
      codigo: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      clienteNombre: "Padre de Familia",
      atletaNombre: atletaAsignado,
      categoriaAtleta: "Categoría Oficial",
      fecha: new Date().toISOString().split("T")[0],
      items: [...carrito],
      total: totalCarrito,
      metodoPago: metodoPagoSel,
      estado: "pendiente",
      notas: "Pedido realizado desde la Tienda Oficial DeportivOS",
    };

    const productosActualizados = productos.map((p) => {
      const itemsComprados = carrito.filter((item) => item.productoId === p.id);
      if (itemsComprados.length === 0) return p;
      const nuevoStock = { ...p.stockPorTalla };
      itemsComprados.forEach((item) => {
        if (nuevoStock[item.talla] !== undefined) {
          nuevoStock[item.talla] = Math.max(0, nuevoStock[item.talla] - item.cantidad);
        }
      });
      return { ...p, stockPorTalla: nuevoStock };
    });

    updateProductosState(productosActualizados);
    updatePedidosState([nuevoPedido, ...pedidos]);
    setCarrito([]);
    setModalCheckout(false);

    supabase.from("tienda_pedidos").insert({
      id: nuevoPedido.id,
      codigo: nuevoPedido.codigo,
      cliente_nombre: nuevoPedido.clienteNombre,
      atleta_nombre: nuevoPedido.atletaNombre,
      categoria_atleta: nuevoPedido.categoriaAtleta,
      fecha: nuevoPedido.fecha,
      items: nuevoPedido.items,
      total: nuevoPedido.total,
      metodo_pago: nuevoPedido.metodoPago,
      estado: nuevoPedido.estado,
      notas: nuevoPedido.notas,
    }).then(({ error }) => {
      if (error) console.warn("Supabase insert note:", error.message);
    });

    toast.success(`🎉 ¡Pedido #${nuevoPedido.codigo} registrado con éxito!`);
  };

  // Admin Save Product (Persists to local storage AND Supabase DB with compression)
  const handleSaveAdminProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoEditar?.nombre || !productoEditar?.precio) {
      toast.error("Nombre y Precio son requeridos");
      return;
    }

    const toastId = toast.loading("Guardando producto en la base de datos...");

    let imagenFinal = productoEditar.imagen || "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&auto=format&fit=crop&q=80";
    if (imagenFinal.startsWith("data:image")) {
      imagenFinal = await compressImage(imagenFinal, 800, 0.75);
    }

    const prodFinal: Producto = {
      id: productoEditar.id || `prod-${Date.now()}`,
      sku: productoEditar.sku || `ATH-${Math.floor(1000 + Math.random() * 9000)}`,
      nombre: productoEditar.nombre!.toUpperCase(),
      categoria: productoEditar.categoria || "CAMISETA",
      descripcion: productoEditar.descripcion || "",
      precio: Number(productoEditar.precio),
      imagen: imagenFinal,
      genero: productoEditar.genero || "Unisex",
      marca: productoEditar.marca || "DeportivOS",
      tallas: productoEditar.tallas || ["S", "M", "L"],
      stockPorTalla: productoEditar.stockPorTalla || { S: 10, M: 10, L: 10 },
      colores: productoEditar.colores || ["Oficial"],
      activo: productoEditar.activo ?? true,
    };

    let nuevosProds: Producto[] = [];
    if (productoEditar.id) {
      nuevosProds = productos.map((p) => (p.id === productoEditar.id ? prodFinal : p));
    } else {
      nuevosProds = [prodFinal, ...productos];
    }

    // 1) Save to local state & localStorage immediately
    updateProductosState(nuevosProds);

    // 2) Save to Supabase DB matching exact table columns
    try {
      const { error } = await supabase.from("tienda_productos").upsert({
        id: prodFinal.id,
        nombre: prodFinal.nombre,
        categoria: prodFinal.categoria,
        descripcion: prodFinal.descripcion,
        precio: prodFinal.precio,
        imagen: prodFinal.imagen,
        destacado: prodFinal.destacado ?? false,
        popular: prodFinal.popular ?? false,
        tallas: prodFinal.tallas,
        stock_por_talla: prodFinal.stockPorTalla,
        colores: prodFinal.colores,
        activo: prodFinal.activo,
      });

      toast.dismiss(toastId);

      if (error) {
        console.error("Supabase upsert error:", error);
        toast.success(`Guardado en memoria local ("${prodFinal.nombre}")`);
      } else {
        toast.success(`🎉 "${prodFinal.nombre}" guardado con éxito en la Base de Datos Supabase`);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      console.warn("Supabase save exception:", err);
      toast.success(`Guardado en memoria local ("${prodFinal.nombre}")`);
    }

    setModalAdminProducto(false);
    setProductoEditar(null);
  };

  // Delete product handlers
  const abrirModalEliminar = (id: string) => {
    const prod = productos.find((p) => p.id === id);
    if (prod) setProductoEliminar(prod);
  };

  const confirmarEliminarProducto = () => {
    if (!productoEliminar) return;
    const id = productoEliminar.id;
    const nombre = productoEliminar.nombre;
    const filtrados = productos.filter((p) => p.id !== id);
    updateProductosState(filtrados);
    supabase.from("tienda_productos").delete().eq("id", id).then(({ error }) => {
      if (error) console.warn("Supabase delete product note:", error.message);
    });
    toast.success(`"${nombre}" eliminado del catálogo`);
    setProductoEliminar(null);
  };

  return (
    <div className="space-y-5">
      {/* ── STORE HEADER TOP NAVIGATION BAR (DEPORTIVOS INTEGRATED DESIGN) ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden space-y-4">
        {/* Top Header Information */}
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-[9px] uppercase tracking-wider">
                TIENDA OFICIAL DE LA ACADEMIA
              </Badge>
              <span className="text-xs text-indigo-200/80 font-medium">Equipamiento & Indumentaria Oficial 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <ShoppingBag className="h-7 w-7 text-indigo-400" /> Tienda & Uniformes
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setActiveTab("kit_creator")}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg h-11 px-4 rounded-2xl gap-2"
            >
              <Sparkles className="h-4 w-4 text-slate-950" />
              <span>Diseñador 3D Kit Studio</span>
            </Button>

            <Button
              onClick={() => setModalCheckout(true)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg h-11 px-5 rounded-2xl gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Mi Carrito</span>
              {itemsCountCarrito > 0 && (
                <span className="bg-white text-indigo-950 text-[11px] font-black px-2 py-0.5 rounded-full ml-1">
                  {itemsCountCarrito}
                </span>
              )}
            </Button>

            {isAdmin && (
              <Button
                onClick={() => {
                  setProductoEditar({
                    tallas: ["6", "8", "10", "12", "14", "S", "M", "L"],
                    stockPorTalla: { "6": 10, "8": 10, "10": 10, "12": 10, "14": 10, "S": 10, "M": 10, "L": 10 },
                    categoria: "CAMISETA",
                    precio: 25000,
                    activo: true,
                  });
                  setModalAdminProducto(true);
                }}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs h-11 px-4 rounded-2xl gap-2"
              >
                <Plus className="h-4 w-4" /> Publicar Producto
              </Button>
            )}
          </div>
        </div>

        {/* Ambient Glow background */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── MAIN TABS & CATEGORIES BAR ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl flex-nowrap shrink-0 overflow-x-auto max-w-full">
            <TabsTrigger value="tienda" className="text-xs font-bold gap-2 rounded-xl whitespace-nowrap">
              <ShoppingBag className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Catálogo Oficial
            </TabsTrigger>
            <TabsTrigger value="kit_creator" className="text-xs font-bold gap-2 rounded-xl text-amber-500 font-black whitespace-nowrap">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> 🎽 Custom Kit Studio 3D
            </TabsTrigger>
            <TabsTrigger value="mis_pedidos" className="text-xs font-bold gap-2 rounded-xl whitespace-nowrap">
              <Package className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Seguimiento de Pedidos {pedidos.length > 0 && `(${pedidos.length})`}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="text-xs font-bold gap-2 rounded-xl text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Control de Stock & Despacho (Admin)
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* TAB 1: TIENDA COMPLETA CON SIDEBAR DE FILTROS DEPORTIVOS */}
        <TabsContent value="tienda" className="pt-2">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* ── LEFT SIDEBAR FILTERS (DEPORTIVOS STYLED) ── */}
            <aside className="w-full lg:w-64 shrink-0 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-card">
              
              {/* Categories Navigation */}
              <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-indigo-600" /> Categorías
                  </h3>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Editar Categorías y Filtros"
                      onClick={() => setModalConfigFiltros(true)}
                      className="h-6 px-1.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg gap-1"
                    >
                      <Settings className="h-3 w-3" /> Editar
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400 font-bold uppercase">
                  {["TODAS", ...configFiltros.categorias].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoriaSel(cat)}
                      className={`text-left py-1.5 px-2.5 rounded-xl transition ${
                        categoriaSel === cat
                          ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 font-extrabold"
                          : "hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {cat === "TODAS" ? "✨ Todas las categorías" : `• ${cat}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dropdowns Filters */}
              <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                
                {/* Color Select */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Color:</Label>
                  <Select value={colorSel} onValueChange={setColorSel}>
                    <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <SelectValue placeholder="Seleccione un color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los colores</SelectItem>
                      {configFiltros.colores.map((col) => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Talla Select */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Talla:</Label>
                  <Select value={tallaSel} onValueChange={setTallaSel}>
                    <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <SelectValue placeholder="Seleccione una talla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todas las tallas</SelectItem>
                      {configFiltros.tallas.map((t) => (
                        <SelectItem key={t} value={t}>Talla {t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Género Select */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Género:</Label>
                  <Select value={generoSel} onValueChange={setGeneroSel}>
                    <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <SelectValue placeholder="Seleccione un género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los géneros</SelectItem>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Marca Select */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Marca:</Label>
                  <Select value={marcaSel} onValueChange={setMarcaSel}>
                    <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <SelectValue placeholder="Seleccione una marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todas las marcas</SelectItem>
                      {configFiltros.marcas.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Input */}
                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Buscar:</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Nombre o Código SKU"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Action */}
              <Button
                variant="outline"
                onClick={() => {
                  setCategoriaSel("TODAS");
                  setColorSel("TODOS");
                  setTallaSel("TODAS");
                  setGeneroSel("TODOS");
                  setMarcaSel("TODAS");
                  setBusqueda("");
                  toast.info("Filtros restablecidos");
                }}
                className="w-full text-xs font-bold rounded-xl h-9 border-slate-200 dark:border-slate-800"
              >
                Limpiar Filtros
              </Button>
            </aside>

            {/* ── MAIN CATALOG GRID ── */}
            <main className="flex-1 space-y-4 min-w-0">
              {/* Category Banner Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                    {categoriaSel === "TODAS" ? "Indumentaria & Equipamiento" : categoriaSel}
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">
                    {productosFiltrados.length} productos disponibles
                  </span>
                </div>

                {/* Sorting Tool */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Ordenar:</span>
                  <Select value={ordenarPor} onValueChange={setOrdenarPor}>
                    <SelectTrigger className="h-8 text-xs w-40 bg-white dark:bg-slate-900 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Más Populares</SelectItem>
                      <SelectItem value="precio_asc">Menor precio</SelectItem>
                      <SelectItem value="precio_desc">Mayor precio</SelectItem>
                      <SelectItem value="nombre">Nombre (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PRODUCTS GRID RESPONSIBA OPTIMIZADA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {productosFiltrados.map((prod) => {
                  const totalStock = Object.values(prod.stockPorTalla).reduce((a, b) => a + b, 0);
                  const isOut = totalStock === 0;

                  return (
                    <Card
                      key={prod.id}
                      className="shadow-card hover:shadow-elegant transition-all duration-300 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 flex flex-col justify-between group relative min-w-0"
                    >
                      <div>
                        {/* Square Aspect Ratio Product Image Box with Object-Contain & Click-to-Zoom */}
                        <div
                          onClick={() => setImagenAmpliada({ url: prod.imagen, titulo: prod.nombre, producto: prod })}
                          className="bg-slate-50 dark:bg-slate-950 aspect-square w-full overflow-hidden relative border-b border-slate-100 dark:border-slate-800 flex items-center justify-center p-4 cursor-pointer group"
                        >
                          <img
                            src={prod.imagen}
                            alt={prod.nombre}
                            className="max-h-full max-w-full object-contain object-center group-hover:scale-105 transition-transform duration-500 rounded-xl"
                          />

                          {/* Zoom Hover Overlay */}
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                            <span className="bg-slate-900/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                              <ZoomIn className="h-3.5 w-3.5" /> Ampliar Imagen
                            </span>
                          </div>

                          {prod.destacado && (
                            <Badge className="absolute top-2.5 left-2.5 bg-indigo-600 text-white font-bold text-[9px] uppercase shadow-sm pointer-events-none">
                              OFICIAL 2026
                            </Badge>
                          )}

                          {/* Quick Admin Actions on Image Corner */}
                          {isAdmin && (
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl shadow-lg z-10 border border-white/20">
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Editar producto e inventario"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductoEditar({ ...prod });
                                  setModalAdminProducto(true);
                                }}
                                className="h-7 w-7 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-lg"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Eliminar producto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModalEliminar(prod.id);
                                }}
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Info Box */}
                        <CardContent className="p-3.5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono border-b border-slate-100 dark:border-slate-800/80 pb-1.5">
                            <span className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider truncate max-w-[120px]" title={prod.sku}>
                              {prod.sku}
                            </span>
                            <span className="font-black text-sm text-indigo-600 dark:text-indigo-400 whitespace-nowrap ml-auto">
                              {formatCRC(prod.precio)}
                            </span>
                          </div>

                          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug uppercase line-clamp-2 min-h-[32px]">
                            {prod.nombre}
                          </h3>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {prod.descripcion}
                          </p>

                          {/* Tallas disponibles */}
                          <div className="pt-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              TALLAS DISPONIBLES:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {prod.tallas.slice(0, 5).map((talla) => (
                                <span
                                  key={talla}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                >
                                  {talla}
                                </span>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </div>

                      {/* Action buttons PWA Responsivas */}
                      <CardFooter className="p-3 pt-0 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                        <div className="flex items-center gap-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setModalProductoDetail(prod);
                              setTallaSeleccionada(prod.tallas[0] || "");
                              setColorSeleccionado(prod.colores?.[0] || "");
                              setCantidadSel(1);
                            }}
                            className="flex-1 text-xs font-black border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl h-8 px-2"
                          >
                            VER
                          </Button>

                          <Button
                            disabled={isOut}
                            onClick={() => {
                              setModalProductoDetail(prod);
                              setTallaSeleccionada(prod.tallas[0] || "");
                              setColorSeleccionado(prod.colores?.[0] || "");
                              setCantidadSel(1);
                            }}
                            size="sm"
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs h-8 rounded-xl shadow-md gap-1 px-2 min-w-0"
                          >
                            <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">AGREGAR</span>
                          </Button>
                        </div>

                        {/* Direct Admin Action Row */}
                        {isAdmin && (
                          <div className="flex items-center justify-between gap-1.5 w-full pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setProductoEditar({ ...prod });
                                setModalAdminProducto(true);
                              }}
                              className="flex-1 text-[10px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 h-7 rounded-lg gap-1"
                            >
                              <Pencil className="h-3 w-3 shrink-0" /> <span className="truncate">Editar</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => abrirModalEliminar(prod.id)}
                              className="flex-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-7 rounded-lg gap-1"
                            >
                              <Trash2 className="h-3 w-3 shrink-0" /> <span className="truncate">Eliminar</span>
                            </Button>
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </main>
          </div>
        </TabsContent>

        {/* TAB INTERACTIVO 3D KIT CREATOR STUDIO */}
        <TabsContent value="kit_creator" className="pt-2">
          <KitCreatorStudio
            onAddToCart={(item) => setCarrito((prev) => [...prev, item])}
          />
        </TabsContent>

        {/* TAB 2: SEGUIMIENTO DE MIS PEDIDOS */}
        <TabsContent value="mis_pedidos" className="pt-2 space-y-4">
          <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" /> HISTORIAL Y ESTADO DE PEDIDOS DE INDUMENTARIA
              </CardTitle>
              <CardDescription className="text-xs">
                Revisa los uniformes encargados y su estado de despacho en la sede.
              </CardDescription>
            </CardHeader>

            <div className="space-y-3">
              {pedidos.map((ped) => (
                <div key={ped.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{ped.codigo}</span>
                    <span className="text-xs font-bold">Deportista: <strong>{ped.atletaNombre}</strong></span>
                    <Badge className={`text-[10px] font-bold ${ped.estado === "listo_entrega" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}`}>
                      {ped.estado === "listo_entrega" ? "🟢 LISTO PARA RETIRAR EN LA SEDE" : "⏳ EN CONFECCIÓN DE UNIFORME"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ped.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                        <img src={item.imagen} alt={item.nombre} className="h-10 w-10 object-cover rounded-md" />
                        <div>
                          <p className="font-bold line-clamp-1">{item.nombre}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">Talla: <strong className="text-indigo-600">{item.talla}</strong> | Cant: {item.cantidad}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold pt-1">
                    <span>TOTAL: {formatCRC(ped.total)}</span>
                    <span className="text-slate-400 font-normal">Método: {ped.metodoPago.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: ADMIN CONTROL (SI ES ADMIN) */}
        {isAdmin && (
          <TabsContent value="admin" className="pt-2 space-y-6">
            <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-indigo-600" /> DESPACHO Y CONTROL DE PEDIDOS RECIBIDOS
                </h3>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">CÓDIGO</TableHead>
                    <TableHead className="text-xs font-bold">ATLETA</TableHead>
                    <TableHead className="text-xs font-bold">ARTÍCULOS Y TALLAS</TableHead>
                    <TableHead className="text-xs font-bold">TOTAL</TableHead>
                    <TableHead className="text-xs font-bold text-right">ESTADO ENTREGA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((ped) => (
                    <TableRow key={ped.id}>
                      <TableCell className="font-mono text-xs font-bold text-indigo-600">{ped.codigo}</TableCell>
                      <TableCell className="text-xs font-bold">{ped.atletaNombre}</TableCell>
                      <TableCell className="text-xs">
                        {ped.items.map((i, idx) => (
                          <div key={idx}>{i.nombre} (Talla: <strong>{i.talla}</strong>) x{i.cantidad}</div>
                        ))}
                      </TableCell>
                      <TableCell className="font-bold text-xs">{formatCRC(ped.total)}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={ped.estado}
                          onValueChange={(val: any) => {
                            const actualizados = pedidos.map((p) => (p.id === ped.id ? { ...p, estado: val } : p));
                            updatePedidosState(actualizados);
                            supabase.from("tienda_pedidos").update({ estado: val }).eq("id", ped.id).then();
                            toast.success("Estado de entrega actualizado");
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-36 ml-auto rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
                            <SelectItem value="listo_entrega">🟢 Listo Entrega</SelectItem>
                            <SelectItem value="entregado">✓ Entregado</SelectItem>
                            <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* TABLA 2: GESTOR DE PRODUCTOS E INVENTARIO POR TALLA */}
            <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Box className="h-4 w-4 text-indigo-600" /> INVENTARIO DE PRODUCTOS & CONTROL DE STOCK POR TALLA
                  </h3>
                  <p className="text-xs text-slate-400">Edita fotografías, precios, categorías y existencias físicas de cada talla.</p>
                </div>

                <Button
                  onClick={() => {
                    setProductoEditar({
                      tallas: ["6", "8", "10", "12", "14", "S", "M", "L"],
                      stockPorTalla: { "6": 10, "8": 10, "10": 10, "12": 10, "14": 10, "S": 10, "M": 10, "L": 10 },
                      categoria: "CAMISETA",
                      precio: 25000,
                      activo: true,
                    });
                    setModalAdminProducto(true);
                  }}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Publicar Producto
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-bold">PRODUCTO</TableHead>
                    <TableHead className="text-xs font-bold">SKU / CATEGORÍA</TableHead>
                    <TableHead className="text-xs font-bold">PRECIO</TableHead>
                    <TableHead className="text-xs font-bold">STOCK POR TALLA</TableHead>
                    <TableHead className="text-xs font-bold text-right">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((prod) => (
                    <TableRow key={prod.id}>
                      <TableCell className="flex items-center gap-3">
                        <img src={prod.imagen} alt={prod.nombre} className="h-10 w-10 object-cover rounded-lg border shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{prod.nombre}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{prod.descripcion}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-indigo-600 block">{prod.sku}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{prod.categoria}</span>
                      </TableCell>
                      <TableCell className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        {formatCRC(prod.precio)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {Object.entries(prod.stockPorTalla).map(([talla, cant]) => (
                            <span
                              key={talla}
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                cant === 0
                                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              T{talla}: {cant}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setProductoEditar({ ...prod });
                              setModalAdminProducto(true);
                            }}
                            className="h-8 w-8 p-0 text-indigo-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirModalEliminar(prod.id)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* MODAL DETALLE & SELECCIÓN DE TALLA PARA AGREGAR */}
      <Dialog open={!!modalProductoDetail} onOpenChange={() => setModalProductoDetail(null)}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl bg-white dark:bg-slate-900 border-0 shadow-2xl p-6">
          {modalProductoDetail && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-32 w-32 rounded-2xl bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                  <img src={modalProductoDetail.imagen} alt={modalProductoDetail.nombre} className="h-full w-full object-cover rounded-xl" />
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-indigo-600 block">{modalProductoDetail.sku}</span>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{modalProductoDetail.nombre}</h2>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatCRC(modalProductoDetail.precio)}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {modalProductoDetail.descripcion}
              </p>

              {/* Selector de Talla con Stock */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  SELECCIONA TU TALLA DESEADA (*REQUERIDO):
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {modalProductoDetail.tallas.map((talla) => {
                    const stock = modalProductoDetail.stockPorTalla[talla] ?? 0;
                    const isSelected = tallaSeleccionada === talla;
                    const isOut = stock === 0;

                    return (
                      <button
                        key={talla}
                        type="button"
                        disabled={isOut}
                        onClick={() => setTallaSeleccionada(talla)}
                        className={`p-2 rounded-xl border text-center transition text-xs font-bold flex flex-col items-center justify-center ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105"
                            : isOut
                            ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 hover:border-indigo-500"
                        }`}
                      >
                        <span>{talla}</span>
                        <span className={`text-[9px] font-normal ${isSelected ? "text-white" : "text-slate-400"}`}>
                          {isOut ? "Agotado" : `${stock} dispon.`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => handleAddToCart(modalProductoDetail)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 h-auto rounded-2xl shadow-lg gap-2"
                >
                  <ShoppingBag className="h-4 w-4" /> AGREGAR AL CARRITO — {formatCRC(modalProductoDetail.precio * cantidadSel)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL CHECKOUT CARRITO */}
      <Dialog open={modalCheckout} onOpenChange={setModalCheckout}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl bg-white dark:bg-slate-900 border-0 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" /> CARRITO DE COMPRAS
            </DialogTitle>
          </DialogHeader>

          {carrito.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-xs font-bold text-slate-400">Tu carrito de compras está vacío</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalCheckout(false)}
                className="text-xs font-bold rounded-xl mt-2"
              >
                Cerrar Ventana
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="max-h-52 overflow-y-auto space-y-2">
                {carrito.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img src={item.imagen} alt={item.nombre} className="h-10 w-10 object-cover rounded-md shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{item.nombre}</p>
                        <p className="text-[10px] text-slate-400">Talla: <strong className="text-indigo-600">{item.talla}</strong> (x{item.cantidad})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs font-bold">{formatCRC(item.precio * item.cantidad)}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveFromCart(idx)}
                        className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                        title="Eliminar este producto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Atleta para entrega:</Label>
                <Input
                  value={atletaAsignado}
                  onChange={(e) => setAtletaAsignado(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Método de Pago:</Label>
                <Select value={metodoPagoSel} onValueChange={(val: any) => setMetodoPagoSel(val)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cargo_mensualidad">💳 Cargo a la Próxima Mensualidad</SelectItem>
                    <SelectItem value="tarjeta">💳 Tarjeta de Crédito / Débito</SelectItem>
                    <SelectItem value="transferencia">🏦 Transferencia Bancaria (SINPE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 border-t flex items-center justify-between font-black text-sm">
                <span>TOTAL:</span>
                <span className="text-indigo-600">{formatCRC(totalCarrito)}</span>
              </div>

              <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVaciarCarrito}
                    className="flex-1 sm:flex-none border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold rounded-xl gap-1.5 h-9"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Vaciar Carrito
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setModalCheckout(false)}
                    className="flex-1 sm:flex-none text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold rounded-xl h-9"
                  >
                    Cancelar
                  </Button>
                </div>

                <Button
                  onClick={handleFinalizarCompra}
                  className="w-full sm:w-auto flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 h-9 rounded-xl shadow-xl gap-2 uppercase tracking-wider"
                >
                  <CheckCircle2 className="h-4 w-4" /> CONFIRMAR PEDIDO
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL ADMIN AGREGAR PRODUCTO */}
      <Dialog open={modalAdminProducto} onOpenChange={setModalAdminProducto}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl bg-white dark:bg-slate-900 border-0 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" /> PUBLICAR UNIFORME / PRODUCTO
            </DialogTitle>
          </DialogHeader>

          {productoEditar && (
            <form onSubmit={handleSaveAdminProducto} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold">Nombre del Producto *</Label>
                <Input
                  required
                  value={productoEditar.nombre || ""}
                  onChange={(e) => setProductoEditar({ ...productoEditar, nombre: e.target.value })}
                  placeholder="Ej. CAMISETA OFICIAL COMPETENCIA 2026"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Categoría *</Label>
                  <Select
                    value={productoEditar.categoria || "CAMISETA"}
                    onValueChange={(val: any) => setProductoEditar({ ...productoEditar, categoria: val })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configFiltros.categorias.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Precio (₡) *</Label>
                  <Input
                    type="number"
                    required
                    value={productoEditar.precio || 0}
                    onChange={(e) => setProductoEditar({ ...productoEditar, precio: Number(e.target.value) })}
                    className="h-9 text-xs font-bold rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Fotografía del Producto (Subir Archivo o URL)</Label>
                <div className="flex items-center gap-3">
                  {productoEditar.imagen && (
                    <div className="h-14 w-14 rounded-xl border bg-slate-50 dark:bg-slate-950 p-1 shrink-0 overflow-hidden">
                      <img src={productoEditar.imagen} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProductoEditar(p => ({ ...p, imagen: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="h-8 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl"
                    />
                    <Input
                      value={productoEditar.imagen || ""}
                      onChange={(e) => setProductoEditar({ ...productoEditar, imagen: e.target.value })}
                      placeholder="O pega una URL: https://..."
                      className="h-8 text-xs rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* MATRIZ DE STOCK POR TALLA EN ADMIN */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <Label className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Stock por Talla Disponibles:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Define la cantidad física</span>
                </Label>

                <div className="grid grid-cols-5 gap-2">
                  {configFiltros.tallas.map((talla) => {
                    const currentVal = productoEditar.stockPorTalla?.[talla] ?? 0;
                    return (
                      <div key={talla} className="space-y-0.5 text-center">
                        <span className="text-[10px] font-bold text-slate-500 block">Talla {talla}</span>
                        <Input
                          type="number"
                          min={0}
                          value={currentVal}
                          onChange={(e) => {
                            const newStock = { ...(productoEditar.stockPorTalla || {}), [talla]: Number(e.target.value) };
                            const newTallas = Array.from(new Set([...(productoEditar.tallas || []), talla]));
                            setProductoEditar({ ...productoEditar, stockPorTalla: newStock, tallas: newTallas });
                          }}
                          className="h-7 text-xs font-bold text-center rounded-lg"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Descripción</Label>
                <Textarea
                  rows={2}
                  value={productoEditar.descripcion || ""}
                  onChange={(e) => setProductoEditar({ ...productoEditar, descripcion: e.target.value })}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalAdminProducto(false)} className="text-xs rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl">
                  Guardar Producto & Stock
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL LIGHTBOX AMPLIAR IMAGEN DE PRODUCTO                        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!imagenAmpliada} onOpenChange={() => setImagenAmpliada(null)}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl bg-slate-950 text-white border-slate-800 p-6 shadow-2xl">
          {imagenAmpliada && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-400 block text-left">
                    {imagenAmpliada.producto.sku}
                  </span>
                  <h3 className="text-sm font-bold uppercase text-slate-100 text-left">
                    {imagenAmpliada.titulo}
                  </h3>
                </div>
                <span className="font-black text-lg text-indigo-400">
                  {formatCRC(imagenAmpliada.producto.precio)}
                </span>
              </div>

              {/* High-Res Image Display Container */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 max-h-[480px] flex items-center justify-center overflow-hidden">
                <img
                  src={imagenAmpliada.url}
                  alt={imagenAmpliada.titulo}
                  className="max-h-[420px] max-w-full object-contain rounded-xl shadow-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400 font-medium">
                  Categoría: <strong className="text-slate-200">{imagenAmpliada.producto.categoria}</strong>
                </span>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setImagenAmpliada(null)}
                    className="text-xs font-bold border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      const prod = imagenAmpliada.producto;
                      setImagenAmpliada(null);
                      setModalProductoDetail(prod);
                      setTallaSeleccionada(prod.tallas[0] || "");
                      setColorSeleccionado(prod.colores?.[0] || "");
                      setCantidadSel(1);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" /> Seleccionar Talla & Comprar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL PERSONALIZADO CONFIRMAR ELIMINACIÓN DE PRODUCTO             */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!productoEliminar} onOpenChange={() => setProductoEliminar(null)}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl bg-white dark:bg-slate-900 border-0 shadow-2xl p-6">
          {productoEliminar && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="h-10 w-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    ¿Eliminar producto del catálogo?
                  </h3>
                  <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
                </div>
              </div>

              {/* Product Preview Card */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <img
                  src={productoEliminar.imagen}
                  alt={productoEliminar.nombre}
                  className="h-14 w-14 object-contain rounded-xl border bg-white dark:bg-slate-900 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] font-bold text-indigo-600 block">{productoEliminar.sku}</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{productoEliminar.nombre}</h4>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5">{formatCRC(productoEliminar.precio)}</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                El producto dejará de estar disponible para compras y se removerá de la tienda virtual de la academia.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setProductoEliminar(null)}
                  className="text-xs font-bold rounded-xl border-slate-200 dark:border-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmarEliminarProducto}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Sí, Eliminar Producto
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL CONFIGURACIÓN DINÁMICA DE CATEGORÍAS, MARCAS, COLORES Y TALLAS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <Dialog open={modalConfigFiltros} onOpenChange={setModalConfigFiltros}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl bg-white dark:bg-slate-900 border-0 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600" /> GESTOR DE CATEGORÍAS, MARCAS, COLORES Y TALLAS
            </DialogTitle>
            <DialogDescription className="text-xs">
              Agrega o elimina las opciones que se muestran en los filtros y al publicar uniformes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Section Switcher Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
              {(["categorias", "colores", "tallas", "marcas"] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => {
                    setSeccionConfigSel(sec);
                    setNuevaOpcionInput("");
                  }}
                  className={`py-1.5 rounded-xl capitalize transition ${
                    seccionConfigSel === sec
                      ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            {/* Input to Add New Option */}
            <div className="flex items-center gap-2">
              <Input
                value={nuevaOpcionInput}
                onChange={(e) => setNuevaOpcionInput(e.target.value)}
                placeholder={`Añadir nueva ${seccionConfigSel.slice(0, -1)}...`}
                className="h-9 text-xs rounded-xl flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!nuevaOpcionInput.trim()) return;
                    const val = nuevaOpcionInput.trim().toUpperCase();
                    const actualList = configFiltros[seccionConfigSel];
                    if (actualList.includes(val)) {
                      toast.error("Esta opción ya existe");
                      return;
                    }
                    saveConfigFiltros({
                      ...configFiltros,
                      [seccionConfigSel]: [...actualList, val],
                    });
                    setNuevaOpcionInput("");
                    toast.success(`Añadida nueva ${seccionConfigSel.slice(0, -1)}: ${val}`);
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (!nuevaOpcionInput.trim()) return;
                  const val = nuevaOpcionInput.trim().toUpperCase();
                  const actualList = configFiltros[seccionConfigSel];
                  if (actualList.includes(val)) {
                    toast.error("Esta opción ya existe");
                    return;
                  }
                  saveConfigFiltros({
                    ...configFiltros,
                    [seccionConfigSel]: [...actualList, val],
                  });
                  setNuevaOpcionInput("");
                  toast.success(`Añadida nueva ${seccionConfigSel.slice(0, -1)}: ${val}`);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar
              </Button>
            </div>

            {/* List of Badges with Delete (x) */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-400 uppercase block">
                Opciones actuales de {seccionConfigSel}:
              </Label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[120px] max-h-52 overflow-y-auto">
                {configFiltros[seccionConfigSel].map((item) => (
                  <Badge
                    key={item}
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => {
                        const filtrados = configFiltros[seccionConfigSel].filter((i) => i !== item);
                        saveConfigFiltros({
                          ...configFiltros,
                          [seccionConfigSel]: filtrados,
                        });
                        toast.info(`Eliminada opción: ${item}`);
                      }}
                      className="text-slate-400 hover:text-red-500 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => setModalConfigFiltros(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
              >
                Listo / Guardar Filtros
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
