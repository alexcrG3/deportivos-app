import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  MessageSquare, Heart, Bookmark, Share2, Search,
  Lock, ImageIcon, X, Send, Trash, ZoomIn, Megaphone,
  LayoutGrid, PartyPopper
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRole } from "@/hooks/use-role";
import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/muro")({
  component: MuroPage,
});

interface Post {
  id: string;
  autor: string;
  usuario: string;
  avatar: string;
  tiempo: string;
  ubicacion?: string;
  tipo: "publicacion" | "articulo" | "encuesta" | "aviso";
  contenido: string;
  imagen?: string;
  likes: number;
  liked?: boolean;
  saved?: boolean;
  categoria?: string; // sub-12, sub-15, etc. for segmentation
  encuesta?: {
    pregunta: string;
    opciones: { texto: string; votos: number }[];
    totalVotos: number;
    votoUsuario?: number;
  };
  comentarios?: {
    autor: string;
    avatar: string;
    texto: string;
    tiempo: string;
  }[];
}

const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    autor: "Manuel Luján",
    usuario: "@manuel-lujan",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    tiempo: "29 may",
    tipo: "publicacion",
    contenido: "¡Jornada de Premiación! Reconocemos tu dedicación, tu disciplina y tu pasión. Te esperamos este Sábado 24 de Mayo a las 17:00 Hs en el Salón Social del Club.",
    imagen: "https://images.unsplash.com/photo-1578269174936-2709b5a8e040?auto=format&fit=crop&w=900&q=80",
    likes: 24,
  },
  {
    id: "p2",
    autor: "Manuel Luján",
    usuario: "@manuel-lujan",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    tiempo: "29 may",
    ubicacion: "Heredia",
    tipo: "encuesta",
    contenido: "¿Cuál consideras que es la mejor jornada de entrenamiento para el rendimiento físico de los chicos?",
    likes: 12,
    encuesta: {
      pregunta: "¿Mejor Jornada de entrenamiento?",
      opciones: [
        { texto: "Mañana", votos: 45 },
        { texto: "Tarde", votos: 45 },
        { texto: "Noche", votos: 10 }
      ],
      totalVotos: 100,
    }
  },
  {
    id: "p3",
    autor: "Club Atlético Florencia",
    usuario: "@caf",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    tiempo: "3d",
    tipo: "publicacion",
    contenido: "¡Feliz cumpleaños, campeón! Que hoy recibas grandes regalos y sigas demostrando tu talento bajo los tres palos. ¡Que todos tus sueños se hagan realidad, Santiago Torres Lozada!",
    imagen: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=80",
    likes: 38,
  },
  {
    id: "aviso-1",
    autor: "Academia Deportiva",
    usuario: "@academia-oficial",
    avatar: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=100&q=80",
    tiempo: "24 jul",
    tipo: "aviso",
    contenido: "📋 CONVOCATORIA OFICIAL — Torneo Apertura 2026\n\nSe informa a todos los jugadores de las categorías Sub-12, Sub-15 y Femenino que el Torneo Apertura 2026 dará inicio el próximo sábado 2 de agosto. Presentación obligatoria a las 07:00 a.m. en uniforme completo. Los entrenadores publicarán las listas de convocados antes del miércoles 30 de julio.",
    imagen: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80",
    likes: 47,
  },
  {
    id: "aviso-2",
    autor: "Dirección Administrativa",
    usuario: "@direccion",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    tiempo: "22 jul",
    tipo: "aviso",
    contenido: "💳 RECORDATORIO DE PAGO — Mensualidad Agosto 2026\n\nEstimados padres de familia, se les recuerda que el plazo para cancelar la mensualidad de agosto vence el 5 de agosto de 2026. Quienes realicen el pago antes del 1 de agosto tendrán un descuento del 5%. Pueden efectuar el pago directamente en la plataforma DeportivOS, en el módulo de Pagos, o via SINPE Móvil al número de la Academia. Ante cualquier consulta, comunicarse con la administración.",
    likes: 33,
  },
  {
    id: "aviso-3",
    autor: "Cuerpo Técnico",
    usuario: "@cuerpo-tecnico",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    tiempo: "20 jul",
    tipo: "aviso",
    contenido: "🏟️ CAMBIO DE SEDE — Entrenamientos Semana del 28 de Julio\n\nPor trabajos de mantenimiento en el césped de la Sede Central, los entrenamientos de la semana del 28 de julio al 1 de agosto se realizarán en el Campo Auxiliar Norte (Heredia). El horario permanece igual. Se solicita a los padres ajustar la logística de transporte con anticipación. Agradecemos la comprensión de toda la familia de la academia.",
    imagen: "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=900&q=80",
    likes: 28,
  }
];


function MuroPage() {
  const { role, coachName } = useRole();

  const MURO_DEFAULTS = {
    globalAdmin: true,
    globalCoach: true,
    globalPadres: false,
    equipos: {
      "eq1": { nombre: "Élite Sub-12 A", coach: true, padres: true },
      "eq2": { nombre: "Élite Sub-15", coach: true, padres: false },
      "eq3": { nombre: "Élite Femenino", coach: true, padres: false }
    },
    individualPerms: [
      { email: "admin@deportivos.com", nombre: "Admin Demo", role: "Administrador", allowed: true },
      { email: "carlos.g@elite.com", nombre: "Carlos Gómez", role: "Coach Deportivo", allowed: true },
      { email: "manuel.r@correo.com", nombre: "Manuel Rodríguez", role: "Padre de Familia", allowed: true },
      { email: "esteban.soto@elite.com", nombre: "Esteban Soto", role: "Coach Deportivo", allowed: false },
      { email: "mariela.ortiz@correo.com", nombre: "Mariela Ortiz", role: "Madre de Familia", allowed: false }
    ]
  };

  const [perms] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("muro-publish-perms");
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...MURO_DEFAULTS,
            ...parsed,
            equipos: parsed.equipos ?? MURO_DEFAULTS.equipos,
            individualPerms: Array.isArray(parsed.individualPerms)
              ? parsed.individualPerms
              : MURO_DEFAULTS.individualPerms,
          };
        }
      } catch {
        localStorage.removeItem("muro-publish-perms");
      }
    }
    return MURO_DEFAULTS;
  });

  const canPublish = (() => {
    const userEmail = role === "admin" ? "admin@deportivos.com" : role === "coach" ? "carlos.g@elite.com" : "manuel.r@correo.com";
    const individual = perms.individualPerms?.find((u: any) => u.email === userEmail);
    if (individual !== undefined) return individual.allowed;
    if (role === "admin") return perms.globalAdmin;
    if (role === "coach") return perms.globalCoach;
    if (role === "padres") {
      if (perms.globalPadres) return true;
      return perms.equipos["eq1"]?.padres ?? false;
    }
    return false;
  })();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visibleComments, setVisibleComments] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [activeShareMenu, setActiveShareMenu] = useState<string | null>(null);
  const [birthdayGreeted, setBirthdayGreeted] = useState<Record<string, boolean>>({});

  const loadPosts = async () => {
    setLoading(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();

    // Auto-migrate legacy posts
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("deportivos_muro_posts");
      if (saved) {
        try {
          const legacyPosts = JSON.parse(saved);
          if (Array.isArray(legacyPosts) && legacyPosts.length > 0) {
            const customLegacy = legacyPosts.filter(p =>
              p.id && !p.id.startsWith("p1") && !p.id.startsWith("p2") && !p.id.startsWith("p3") && !p.id.startsWith("p4")
            );
            if (customLegacy.length > 0) {
              const toInsert = customLegacy.map(p => ({
                id: p.id,
                autor: p.autor,
                usuario: p.usuario,
                avatar: p.avatar,
                tiempo: p.tiempo,
                tipo: p.tipo || "publicacion",
                contenido: p.contenido,
                imagen: p.imagen || null,
                likes: p.likes || 0,
                liked: p.liked || false,
                saved: p.saved || false,
                encuesta: p.encuesta || null,
                organizacion_id: orgId
              }));
              await supabase.from("muro_posts").insert(toInsert);
            }
          }
        } catch (e) {
          console.error("Error migrating legacy posts:", e);
        } finally {
          localStorage.removeItem("deportivos_muro_posts");
        }
      }
    }

    // Fetch posts for active organization from Supabase
    const { data, error } = await supabase
      .from("muro_posts")
      .select("*")
      .or(`organizacion_id.eq.${orgId},organizacion_id.eq.00000000-0000-0000-0000-000000000000,organizacion_id.eq.org_asoderive_master,organizacion_id.is.null`)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error cargando el muro: " + error.message);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      // Ensure official avisos are always seeded — even when DB already has posts
      const AVISO_IDS = ["aviso-1", "aviso-2", "aviso-3"];
      const existingIds = new Set(data.map((p: any) => {
        // Strip the org suffix we add during seeding
        const raw = p.id as string;
        const base = AVISO_IDS.find(a => raw.startsWith(a));
        return base ?? raw;
      }));
      const missingAvisos = INITIAL_POSTS.filter(
        p => AVISO_IDS.includes(p.id) && !existingIds.has(p.id)
      );
      if (missingAvisos.length > 0) {
        const toSeed = missingAvisos.map((p, idx) => ({
          ...p,
          id: `${p.id}-${orgId.substring(0, 8)}-${idx}`,
          organizacion_id: orgId
        }));
        await supabase.from("muro_posts").insert(toSeed);
        setPosts([...toSeed, ...data] as Post[]);
      } else {
        setPosts(data as Post[]);
      }
    } else {
      const seeded = INITIAL_POSTS.map((p, idx) => ({
        ...p,
        id: `${p.id}-${orgId.substring(0, 8)}-${idx}`,
        organizacion_id: orgId
      }));
      const { error: seedErr } = await supabase.from("muro_posts").insert(seeded);
      if (!seedErr) {
        setPosts(seeded);
      } else {
        console.error("Error seeding muro posts:", seedErr);
        setPosts(seeded);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Feed tab: "parati" = general feed | "avisos" = official announcements only
  const [activeTab, setActiveTab] = useState<"parati" | "avisos">("parati");
  const [newPostText, setNewPostText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"todos" | "publicacion" | "articulo" | "encuesta">("todos");
  const [cityFilter, setCityFilter] = useState("Todas");

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const formattedToday = `${today.getDate()} ${meses[today.getMonth()]} · ${pad(today.getHours())}:${pad(today.getMinutes())}`;

  const cities = useMemo(() => {
    const list = new Set<string>();
    const registeredSedes = RendimientoStore.getSedes ? RendimientoStore.getSedes() : [];
    registeredSedes.forEach((s: any) => {
      if (s.direccion) {
        const city = s.direccion.split(",")[0].trim();
        list.add(city);
      } else if (s.nombre) {
        list.add(s.nombre);
      }
    });
    if (list.size === 0) list.add("San José");
    return Array.from(list);
  }, []);

  const birthdays = useMemo(() => {
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const playersList = RendimientoStore.getJugadores();
    const coachesList = RendimientoStore.getEntrenadores();
    const list: Array<{ nombre: string; foto: string; rol: string; edad?: number }> = [];

    playersList.forEach(p => {
      if (p.fechaNacimiento) {
        const parts = p.fechaNacimiento.split("-");
        if (parts.length === 3) {
          const bdMonth = parseInt(parts[1], 10);
          const bdDay = parseInt(parts[2], 10);
          if (bdMonth === todayMonth && bdDay === todayDay) {
            const birthYear = parseInt(parts[0], 10);
            const edad = today.getFullYear() - birthYear;
            list.push({
              nombre: p.nombre,
              foto: p.avatar || `https://i.pravatar.cc/100?u=${p.id}`,
              rol: `Jugador (Categoría ${p.categoria})`,
              edad: isNaN(edad) ? undefined : edad
            });
          }
        }
      }
    });

    coachesList.forEach(c => {
      const bdStr = (c as any).fechaNacimiento;
      if (bdStr) {
        const parts = bdStr.split("-");
        if (parts.length === 3) {
          const bdMonth = parseInt(parts[1], 10);
          const bdDay = parseInt(parts[2], 10);
          if (bdMonth === todayMonth && bdDay === todayDay) {
            list.push({
              nombre: c.nombre,
              foto: c.avatar,
              rol: `Entrenador (${c.especialidad})`
            });
          }
        }
      }
    });

    if (list.length === 0) {
      list.push({
        nombre: "Santiago Torres Lozada",
        foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
        rol: "Jugador de la Categoría Sub-12",
        edad: 12
      });
    }

    return list;
  }, [posts]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLoggedAuthor = () => {
    if (role === "admin") {
      return {
        nombre: "Admin Demo",
        usuario: "@admin",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
        initials: "AD"
      };
    } else if (role === "coach") {
      const username = "@" + (coachName || "entrenador").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
      return {
        nombre: coachName || "Entrenador Academia",
        usuario: username,
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
        initials: coachName ? coachName.substring(0, 2).toUpperCase() : "EA"
      };
    } else {
      return {
        nombre: "Manuel Rodríguez",
        usuario: "@manuel-rod",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
        initials: "MR"
      };
    }
  };
  const currentAuthor = getLoggedAuthor();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDeletePost = async (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success("Publicación eliminada correctamente.");
    await supabase.from("muro_posts").delete().eq("id", id);
  };

  const handleLike = async (id: string) => {
    const postToUpdate = posts.find(p => p.id === id);
    if (!postToUpdate) return;
    const newLiked = !postToUpdate.liked;
    const newLikes = newLiked ? postToUpdate.likes + 1 : postToUpdate.likes - 1;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: newLiked, likes: newLikes } : p));
    await supabase.from("muro_posts").update({ liked: newLiked, likes: newLikes }).eq("id", id);
  };

  const handleVote = async (postId: string, optionIndex: number) => {
    const postToUpdate = posts.find(p => p.id === postId);
    if (!postToUpdate || !postToUpdate.encuesta) return;
    const enc = postToUpdate.encuesta;
    if (enc.votoUsuario !== undefined) {
      toast.warning("Ya has votado en esta encuesta");
      return;
    }
    const updatedOpciones = enc.opciones.map((o, idx) =>
      idx === optionIndex ? { ...o, votos: o.votos + 1 } : o
    );
    const updatedEncuesta = {
      ...enc,
      opciones: updatedOpciones,
      totalVotos: enc.totalVotos + 1,
      votoUsuario: optionIndex
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, encuesta: updatedEncuesta } : p));
    toast.success("Voto registrado con éxito");
    await supabase.from("muro_posts").update({ encuesta: updatedEncuesta }).eq("id", postId);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !imagePreview) {
      toast.error("Escribe algo o adjunta una imagen.");
      return;
    }
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const formattedTiempo = `${now.getDate()} ${meses[now.getMonth()]} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const orgs = RendimientoStore.getOrganizaciones();
    const activeOrg = orgs.find(o => o.id === orgId) || orgs[0];
    const pais = activeOrg?.pais || "Costa Rica";
    let ciudad = "San José";
    if (activeOrg?.nombre?.toLowerCase().includes("medellin") || activeOrg?.correo?.toLowerCase().includes(".co")) ciudad = "Medellín";
    else if (activeOrg?.nombre?.toLowerCase().includes("bucaramanga")) ciudad = "Bucaramanga";
    const ubicacionString = `${ciudad}, ${pais}`;

    // If posting as coach, tag their team category for segmentation
    const categoriaTag = role === "coach" ? "sub-12" : undefined;

    const newPost: Post = {
      id: `p-${Date.now()}`,
      autor: currentAuthor.nombre,
      usuario: currentAuthor.usuario,
      avatar: currentAuthor.avatar,
      tiempo: formattedTiempo,
      tipo: activeTab === "avisos" ? "aviso" : "publicacion",
      contenido: newPostText,
      imagen: imagePreview ?? undefined,
      likes: 0,
      ubicacion: ubicacionString,
      categoria: categoriaTag,
    };

    setPosts([newPost, ...posts]);
    setNewPostText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Publicación compartida correctamente");

    await supabase.from("muro_posts").insert({
      ...newPost,
      organizacion_id: orgId
    });
  };

  const handleSave = async (id: string) => {
    const postToUpdate = posts.find(p => p.id === id);
    if (!postToUpdate) return;
    const newSaved = !postToUpdate.saved;
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: newSaved } : p));
    if (newSaved) {
      toast.success("Publicación guardada en tus favoritos.");
    } else {
      toast.info("Publicación eliminada de tus favoritos.");
    }
    await supabase.from("muro_posts").update({ saved: newSaved }).eq("id", id);
  };

  const handleAddComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text) {
      toast.error("El comentario no puede estar vacío.");
      return;
    }
    const postToUpdate = posts.find(p => p.id === postId);
    if (!postToUpdate) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const formattedTiempo = `${now.getDate()} ${meses[now.getMonth()]} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const newComment = {
      autor: currentAuthor.nombre,
      avatar: currentAuthor.avatar,
      texto: text,
      tiempo: formattedTiempo
    };
    const updatedComments = Array.isArray(postToUpdate.comentarios)
      ? [...postToUpdate.comentarios, newComment]
      : [newComment];
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comentarios: updatedComments } : p));
    setCommentTexts(prev => ({ ...prev, [postId]: "" }));
    toast.success("Comentario añadido con éxito");
    await supabase.from("muro_posts").update({ comentarios: updatedComments }).eq("id", postId);
  };

  const handleGreetBirthday = (nombre: string) => {
    const key = nombre.replace(/\s/g, "-");
    setBirthdayGreeted(prev => ({ ...prev, [key]: true }));

    // Inject a birthday greeting post into the feed
    const now = new Date();
    const padN = (n: number) => String(n).padStart(2, "0");
    const mesesArr = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const tiempo = `${now.getDate()} ${mesesArr[now.getMonth()]} · ${padN(now.getHours())}:${padN(now.getMinutes())}`;

    const greetPost: Post = {
      id: `greet-${Date.now()}`,
      autor: currentAuthor.nombre,
      usuario: currentAuthor.usuario,
      avatar: currentAuthor.avatar,
      tiempo,
      tipo: "publicacion",
      contenido: `🥳🎉 ¡Feliz cumpleaños, ${nombre}! Todo el club te desea un día lleno de alegrías y muchos goles más en la cancha. ¡Que tengas el mejor día de tu vida! 🎂⚽🏆`,
      likes: 0,
    };

    setPosts(prev => [greetPost, ...prev]);
    toast.success(`¡Felicitación enviada al muro de ${nombre}! 🎉`);

    const orgId = RendimientoStore.getActiveOrganizacionId();
    supabase.from("muro_posts").insert({ ...greetPost, organizacion_id: orgId });
  };

  // === Segmentation filter ===
  // Coaches see only posts from their category or without category
  // Parents see only posts tagged to their child's category or without category
  const filteredPosts = posts.filter(p => {
    // Tab filter
    if (activeTab === "avisos") return p.tipo === "aviso";
    // Guardados filter — handled via save icon now (not a separate tab)
    // Type filter
    if (filterType !== "todos" && p.tipo !== filterType) return false;
    // City filter
    if (cityFilter !== "Todas" && !p.ubicacion?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    // Segmentation by role
    if (role === "padres" && p.categoria) {
      // Parent of sub-12 only sees sub-12 tagged posts
      return p.categoria === "sub-12";
    }
    return true;
  });

  // Badge label for post type
  const tipoBadge: Record<string, { label: string; color: string }> = {
    publicacion: { label: "Post", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    articulo: { label: "Artículo", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    encuesta: { label: "Encuesta", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
    aviso: { label: "📢 Aviso", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  };

  return (
    <div className="space-y-5">
      {/* ─── Tab Navigation ─── */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-0">
        {([
          { key: "parati", label: "📱 Para ti", icon: LayoutGrid },
          { key: "avisos", label: "🌟 Avisos Oficiales", icon: Megaphone },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold transition-all relative ${
              activeTab === key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* ─── Main Feed ─── */}
        <div className="space-y-5 md:col-span-3">

          {/* ─── Birthday Banner ─── */}
          {activeTab === "parati" && birthdays.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-rose-400/25 bg-gradient-to-r from-rose-500/10 via-amber-400/10 to-purple-500/10 shadow-sm animate-in fade-in duration-500">
              {/* decorative blobs */}
              <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full bg-amber-400/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-rose-400/15 blur-2xl" />

              <div className="relative p-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex -space-x-2 shrink-0">
                    {birthdays.map((b, idx) => (
                      <Avatar key={idx} className="h-12 w-12 border-2 border-background shadow-md ring-2 ring-rose-400/30">
                        <AvatarImage src={b.foto} />
                        <AvatarFallback>{b.nombre[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span>🎉 ¡Cumpleaños en la Academia! 🎂</span>
                      <span className="text-[10px] text-muted-foreground/80 font-bold bg-muted/70 px-2 py-0.5 rounded-full">
                        {formattedToday}
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Hoy cumple años{" "}
                      {birthdays.map((b, idx) => (
                        <span key={idx} className="font-bold text-foreground">
                          {b.nombre}{b.edad ? ` (${b.edad} años)` : ""}{idx < birthdays.length - 1 ? ", " : ""}
                        </span>
                      ))}
                      . ¡Un gran año lleno de éxitos en la cancha! ⚽🏆
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {birthdays.map((b, idx) => {
                      const key = b.nombre.replace(/\s/g, "-");
                      const greeted = birthdayGreeted[key];
                      return (
                        <Button
                          key={idx}
                          size="sm"
                          onClick={() => handleGreetBirthday(b.nombre)}
                          disabled={greeted}
                          className={`gap-1.5 text-xs font-bold h-8 rounded-full transition-all ${
                            greeted
                              ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 cursor-default"
                              : "bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:opacity-90 shadow-sm"
                          }`}
                        >
                          {greeted ? "✓ Felicitado" : (
                            <>
                              <PartyPopper className="h-3.5 w-3.5" />
                              Felicitar
                            </>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Create Post Box ─── */}
          {canPublish ? (
            <Card className="premium-card overflow-hidden">
              <form onSubmit={handleCreatePost}>
                <div className="p-4 space-y-3">
                  <div className="flex gap-3 items-start">
                    <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                      <AvatarImage src={currentAuthor.avatar} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                        {currentAuthor.initials}
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      placeholder={activeTab === "avisos" ? "Escribe un aviso oficial para el club..." : "¿Qué está pasando en la academia?"}
                      value={newPostText}
                      onChange={e => setNewPostText(e.target.value)}
                      rows={3}
                      className="border-none bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl resize-none text-sm"
                    />
                  </div>

                  {imagePreview && (
                    <div className="relative rounded-xl overflow-hidden border border-border/60">
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="w-full max-h-64 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Imagen
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newPostText.trim() && !imagePreview}
                    className="bg-gradient-primary shadow-elegant text-xs h-8 gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Publicar
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card className="premium-card p-5 text-center bg-muted/20 border border-dashed text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-2xl">
              <Lock className="h-5 w-5 text-muted-foreground/75" />
              <p className="text-xs font-semibold">🔒 Publicaciones restringidas</p>
              <p className="text-[10px] text-muted-foreground">No tienes permisos para publicar en este Muro. Comunícate con tu administrador.</p>
            </Card>
          )}

          {/* ─── Post Feed ─── */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-4xl">📭</p>
              <p className="text-sm font-semibold text-foreground">No hay publicaciones aquí</p>
              <p className="text-xs text-muted-foreground">
                {activeTab === "avisos" ? "Aún no hay avisos oficiales publicados." : "Sé el primero en publicar algo en el muro."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredPosts.map(post => (
                <Card key={post.id} className="premium-card overflow-hidden rounded-2xl border border-border/60">

                  {/* ── Post Header ── */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 ring-2 ring-border/60">
                        <AvatarImage src={post.avatar} />
                        <AvatarFallback>{post.autor[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground">{post.autor}</span>
                          <span className="text-[11px] text-muted-foreground">{post.usuario}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {post.tiempo} {post.ubicacion && `· ${post.ubicacion}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canPublish && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {post.tipo && tipoBadge[post.tipo] && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${tipoBadge[post.tipo].color}`}>
                          {tipoBadge[post.tipo].label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Caption ── */}
                  <p className="px-4 pb-3 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {post.contenido}
                  </p>

                  {/* ── Survey block ── */}
                  {post.tipo === "encuesta" && post.encuesta && (
                    <div className="mx-4 mb-3 space-y-2.5 p-4 rounded-2xl bg-muted/40 border border-border/80">
                      <h4 className="text-xs font-bold text-foreground">{post.encuesta.pregunta}</h4>
                      <div className="space-y-2">
                        {post.encuesta.opciones.map((op, idx) => {
                          const pct = post.encuesta!.totalVotos > 0 ? Math.round((op.votos / post.encuesta!.totalVotos) * 100) : 0;
                          const isVoted = post.encuesta!.votoUsuario === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleVote(post.id, idx)}
                              className="w-full relative flex items-center justify-between p-2.5 rounded-xl border text-xs text-left overflow-hidden bg-background hover:bg-muted/30 transition"
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-primary/8 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                              <span className="relative z-10 font-medium flex items-center gap-1.5">
                                {op.texto}
                                {isVoted && <span className="text-emerald-500">✓</span>}
                              </span>
                              <span className="relative z-10 font-bold text-muted-foreground">{pct}%</span>
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{post.encuesta.totalVotos} votos · Toca una opción para votar</span>
                    </div>
                  )}

                  {/* ── FULL-WIDTH MEDIA (Instagram style) ── */}
                  {post.imagen && (
                    <div
                      onClick={() => setSelectedImage(post.imagen!)}
                      className="group relative w-full cursor-pointer overflow-hidden bg-slate-100 dark:bg-slate-950/40"
                    >
                      <img
                        src={post.imagen}
                        alt="Post media"
                        className="w-full object-cover transition duration-300 group-hover:brightness-90"
                        style={{ maxHeight: "520px", minHeight: "200px" }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-2 text-white text-xs font-semibold bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          <ZoomIn className="h-4 w-4" />
                          Ver imagen
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Interaction Bar (Instagram style) ── */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-3">
                    {/* Left: Heart + Comment */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 group transition-all ${post.liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                      >
                        <Heart
                          className={`h-5 w-5 transition-transform group-active:scale-125 duration-150 ${post.liked ? "fill-red-500" : ""}`}
                          fill={post.liked ? "#ef4444" : "none"}
                          stroke={post.liked ? "#ef4444" : "currentColor"}
                        />
                        <span className="text-xs font-semibold">{post.likes}</span>
                      </button>

                      <button
                        onClick={() => setVisibleComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                        className={`flex items-center gap-1.5 transition-all ${visibleComments[post.id] ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                      >
                        <MessageSquare className="h-5 w-5" />
                        <span className="text-xs font-semibold">{post.comentarios?.length || 0}</span>
                      </button>
                    </div>

                    {/* Right: Save + Share */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <button
                          onClick={() => setActiveShareMenu(activeShareMenu === post.id ? null : post.id)}
                          className="text-muted-foreground hover:text-foreground transition"
                        >
                          <Share2 className="h-5 w-5" />
                        </button>
                        {activeShareMenu === post.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setActiveShareMenu(null)} />
                            <div className="absolute right-0 bottom-8 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-md z-40 animate-in fade-in slide-in-from-bottom-1 duration-200">
                              <button
                                onClick={() => {
                                  const shareText = `*${post.autor} en DeportivOS:* \n\n${post.contenido}`;
                                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
                                  setActiveShareMenu(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition font-medium flex items-center gap-2 text-foreground"
                              >
                                🟢 WhatsApp
                              </button>
                              <button
                                onClick={() => {
                                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
                                  setActiveShareMenu(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition font-medium flex items-center gap-2 text-foreground"
                              >
                                🔵 Facebook
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(post.contenido);
                                  toast.success("📝 Contenido copiado al portapapeles");
                                  setActiveShareMenu(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-muted transition font-medium flex items-center gap-2 text-foreground border-t border-border/40 mt-1 pt-1.5"
                              >
                                🔗 Copiar Contenido
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleSave(post.id)}
                        className={`transition-all group ${post.saved ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}
                      >
                        <Bookmark
                          className="h-5 w-5 transition-transform group-active:scale-110 duration-150"
                          fill={post.saved ? "#f59e0b" : "none"}
                          stroke={post.saved ? "#f59e0b" : "currentColor"}
                        />
                      </button>
                    </div>
                  </div>

                  {/* ── Comments Section ── */}
                  {visibleComments[post.id] && (
                    <div className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3 animate-in fade-in duration-300">
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {post.comentarios && post.comentarios.length > 0 ? (
                          post.comentarios.map((comment, index) => (
                            <div key={index} className="flex gap-2.5 items-start">
                              <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                                <AvatarImage src={comment.avatar} />
                                <AvatarFallback className="text-[9px]">{comment.autor?.[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted/30 rounded-xl px-3 py-1.5">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <span className="text-[11px] font-bold text-foreground">{comment.autor}</span>
                                  <span className="text-[9px] text-muted-foreground">{comment.tiempo}</span>
                                </div>
                                <p className="text-xs text-foreground/90 leading-relaxed">{comment.texto}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-center text-muted-foreground py-2">Sé el primero en comentar esta publicación.</p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={currentAuthor.avatar} />
                          <AvatarFallback className="text-[9px]">{currentAuthor.initials}</AvatarFallback>
                        </Avatar>
                        <Input
                          placeholder="Añade un comentario..."
                          value={commentTexts[post.id] || ""}
                          onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") handleAddComment(post.id); }}
                          className="h-8 text-xs rounded-full focus-visible:ring-primary/20 bg-muted/40 border-border/50"
                        />
                        <Button
                          onClick={() => handleAddComment(post.id)}
                          size="sm"
                          className="h-8 bg-primary text-white rounded-full text-xs px-3"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ─── Sidebar: Filters & Profile ─── */}
        <div className="space-y-5">
          {/* Search */}
          <Card className="shadow-card p-4 space-y-1">
            <Label htmlFor="postSearch" className="text-xs font-semibold">Buscar en el muro</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="postSearch" placeholder="Buscar publicaciones..." className="pl-9 h-9 text-sm" />
            </div>
          </Card>

          {/* Filters */}
          {activeTab === "parati" && (
            <Card className="shadow-card p-4 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Filtros</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Refina el contenido</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Ciudad</Label>
                <select
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Todas">Todas</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Tipo de contenido</Label>
                <div className="flex flex-wrap gap-1.5">
                  {(["todos", "publicacion", "articulo", "encuesta"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition ${
                        filterType === type ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted-foreground/15"
                      }`}
                    >
                      {type === "todos" ? "Todos" : type}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Mini Profile Widget */}
          <Card className="shadow-card overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
            <div className="px-4 pb-4 -mt-8 space-y-3">
              <Avatar className="h-14 w-14 border-3 border-background shadow-md ring-2 ring-primary/20">
                <AvatarImage src={currentAuthor.avatar} />
                <AvatarFallback className="text-sm font-bold">{currentAuthor.initials}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-sm font-bold text-foreground">{currentAuthor.nombre}</h4>
                <p className="text-[11px] text-muted-foreground">{currentAuthor.usuario}</p>
              </div>
              <div className="grid grid-cols-3 gap-1 border-t pt-3 text-center">
                <div>
                  <p className="text-sm font-bold text-foreground">{posts.filter(p => p.autor === currentAuthor.nombre).length}</p>
                  <p className="text-[10px] text-muted-foreground">Posts</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">34</p>
                  <p className="text-[10px] text-muted-foreground">Siguiendo</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">12</p>
                  <p className="text-[10px] text-muted-foreground">Seguidores</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Segmentation Info (Coach only) */}
          {role === "coach" && (
            <Card className="shadow-card p-4 space-y-2 border border-primary/15 bg-primary/5">
              <h3 className="text-xs font-bold text-primary">📡 Segmentación Activa</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tus publicaciones con categoría <strong>Sub-12</strong> solo serán visibles para los padres de esa categoría.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* ─── Fullscreen Image Lightbox ─── */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-5xl p-2 bg-slate-950/98 border-slate-800 text-white flex flex-col items-center justify-center overflow-hidden rounded-2xl shadow-2xl">
          <DialogTitle className="sr-only">Visualizador de imagen</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center p-2">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Imagen ampliada"
                className="max-h-[88vh] w-auto max-w-full object-contain rounded-lg shadow-lg animate-in zoom-in-95 duration-200"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
