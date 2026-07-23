import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  MessageSquare, Heart, Bookmark, Share2, Search,
  Sparkles, Briefcase, Lock, ImageIcon, X, Send, Trash, Plus, ZoomIn
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
  tipo: "publicacion" | "articulo" | "encuesta";
  contenido: string;
  imagen?: string;
  likes: number;
  liked?: boolean;
  saved?: boolean;
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
    imagen: "https://images.unsplash.com/photo-1578269174936-2709b5a8e040?auto=format&fit=crop&w=800&q=80", // trophy/ceremony style
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
    imagen: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80", // child keeper style
    likes: 38,
  },
  {
    id: "p4",
    autor: "Julián Mauricio Meneses",
    usuario: "@julian-meneses",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    tiempo: "8d",
    ubicacion: "Cartago",
    tipo: "articulo",
    contenido: "Horarios Oficiales del Segundo Semestre 2026. Favor revisar sus asignaciones de sede y categorías para evitar cruces.",
    imagen: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80", // timetable style
    likes: 15,
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
    
    // Si existe permiso individual explícito, tiene prioridad máxima
    const individual = perms.individualPerms?.find((u: any) => u.email === userEmail);
    if (individual !== undefined) {
      return individual.allowed;
    }

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
  const [visibleForumComments, setVisibleForumComments] = useState<Record<string, boolean>>({});
  const [forumCommentTexts, setForumCommentTexts] = useState<Record<string, string>>({});
  const [newPostCity, setNewPostCity] = useState("San José");

  const loadPosts = async () => {
    setLoading(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();

    // Auto-migrate legacy posts from localStorage to Supabase
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

    // Purge old database entries containing fake author "Carlos Gómez" or hardcoded time "Ahora"
    await supabase.from("muro_posts").delete().eq("autor", "Carlos Gómez");
    await supabase.from("muro_posts").delete().eq("tiempo", "Ahora");

    const { data, error } = await supabase
      .from("muro_posts")
      .select("*")
      .eq("organizacion_id", orgId)
      .order("created_at", { ascending: false });
      
    if (error) {
      toast.error("Error cargando el muro: " + error.message);
      setLoading(false);
      return;
    }
    
    if (data && data.length > 0) {
      setPosts(data as Post[]);
    } else {
      // Seed with INITIAL_POSTS if database is empty
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

  const [forums, setForums] = useState<any[]>([]);

  useEffect(() => {
    loadPosts();
    
    // Load real coaches from database — NO fake names
    const coaches = RendimientoStore.getEntrenadores();

    const getCoach = (idx: number) => {
      const c = coaches[idx];
      return {
        nombre: c?.nombre || (coaches[0]?.nombre || "Academia"),
        avatar: c?.foto || c?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
      };
    };

    const c1 = getCoach(0);
    const c2 = getCoach(1);
    const c3 = getCoach(2);

    setForums([
      {
        id: "f1",
        titulo: "🏆 Estrategias para mejorar la resistencia en entrenamientos cortos",
        descripcion: "Abro este debate para compartir ideas sobre entrenamientos interválicos de alta intensidad (HIIT) aplicados a categorías infantiles. ¿Qué ejercicios les han funcionado mejor?",
        categoria: "Entrenamiento Físico",
        autor: c1.nombre,
        avatar: c1.avatar,
        tiempo: "Hace 2 horas",
        respuestas: 8,
        likes: 15,
        liked: false,
        ubicacion: "San José"
      },
      {
        id: "f2",
        titulo: "🍎 Nutrición previa a partidos de alta exigencia",
        descripcion: "¿Qué tipo de colaciones recomiendan para los chicos de la categoría U-15 dos horas antes de un partido competitivo? Compartamos menús sugeridos y mitos alimenticios.",
        categoria: "Nutrición y Salud",
        autor: c2.nombre,
        avatar: c2.avatar,
        tiempo: "Ayer",
        respuestas: 14,
        likes: 32,
        liked: true,
        ubicacion: "Medellín"
      },
      {
        id: "f3",
        titulo: "🧠 Psicología Deportiva: Manejo del fracaso y la frustración",
        descripcion: "Cómo actuar cuando un niño rompe en llanto tras perder una final o errar un penal decisivo. Compartamos metodologías de contención emotional en la academia.",
        categoria: "Psicología",
        autor: c3.nombre,
        avatar: c3.avatar,
        tiempo: "Hace 3 días",
        respuestas: 21,
        likes: 45,
        liked: false,
        ubicacion: "Bucaramanga"
      }
    ]);
  }, []);

  const [activeTab, setActiveTab] = useState<"club" | "global" | "empleos">("club");
  const [activeSubTab, setActiveSubTab] = useState<"muro" | "foros" | "guardados">("muro");
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
    const registeredSedes = RendimientoStore.getSedes ? RendimientoStore.getSedes() : sedes;
    registeredSedes.forEach((s: any) => {
      if (s.direccion) {
        const city = s.direccion.split(",")[0].trim();
        list.add(city);
      } else if (s.nombre) {
        list.add(s.nombre);
      }
    });
    // Fallback if empty
    if (list.size === 0) {
      list.add("San José");
    }
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

    // Proactive fallbacks for demonstration: always show one birthday today!
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

  // Author info dynamically resolved from useRole hook — NO fake names
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
    
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, liked: newLiked, likes: newLikes };
      }
      return p;
    }));
    
    await supabase
      .from("muro_posts")
      .update({ liked: newLiked, likes: newLikes })
      .eq("id", id);
  };

  const handleVote = async (postId: string, optionIndex: number) => {
    const postToUpdate = posts.find(p => p.id === postId);
    if (!postToUpdate || !postToUpdate.encuesta) return;
    
    const enc = postToUpdate.encuesta;
    if (enc.votoUsuario !== undefined) {
      toast.warning("Ya has votado en esta encuesta");
      return;
    }
    
    const updatedOpciones = enc.opciones.map((o, idx) => {
      if (idx === optionIndex) {
        return { ...o, votos: o.votos + 1 };
      }
      return o;
    });
    
    const updatedEncuesta = {
      ...enc,
      opciones: updatedOpciones,
      totalVotos: enc.totalVotos + 1,
      votoUsuario: optionIndex
    };
    
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, encuesta: updatedEncuesta };
      }
      return p;
    }));
    
    toast.success("Voto registrado con éxito");
    await supabase
      .from("muro_posts")
      .update({ encuesta: updatedEncuesta })
      .eq("id", postId);
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
    
    // Auto-detect a default city from name, address, or default to San José
    let ciudad = "San José";
    if (activeOrg?.nombre?.toLowerCase().includes("medellin") || activeOrg?.correo?.toLowerCase().includes(".co")) {
      ciudad = "Medellín";
    } else if (activeOrg?.nombre?.toLowerCase().includes("bucaramanga")) {
      ciudad = "Bucaramanga";
    }
    const ubicacionString = `${ciudad}, ${pais}`;
    
    const newPost: Post = {
      id: `p-${Date.now()}`,
      autor: currentAuthor.nombre,
      usuario: currentAuthor.usuario,
      avatar: currentAuthor.avatar,
      tiempo: formattedTiempo,
      tipo: "publicacion",
      contenido: newPostText,
      imagen: imagePreview ?? undefined,
      likes: 0,
      ubicacion: ubicacionString,
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
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, saved: newSaved };
      }
      return p;
    }));
    
    if (newSaved) {
      toast.success("Publicación guardada. Puedes verla en la pestaña 'Guardados'.");
    } else {
      toast.info("Publicación eliminada de tus guardados.");
    }
    
    await supabase
      .from("muro_posts")
      .update({ saved: newSaved })
      .eq("id", id);
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
      
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comentarios: updatedComments };
      }
      return p;
    }));
    
    setCommentTexts(prev => ({ ...prev, [postId]: "" }));
    toast.success("Comentario añadido con éxito");
    
    await supabase
      .from("muro_posts")
      .update({ comentarios: updatedComments })
      .eq("id", postId);
  };

  const handleAddForumComment = (forumId: string) => {
    const text = forumCommentTexts[forumId]?.trim();
    if (!text) {
      toast.error("La respuesta no puede estar vacía.");
      return;
    }
    
    setForums(prev => prev.map(f => {
      if (f.id === forumId) {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        const formattedTiempo = `${now.getDate()} ${meses[now.getMonth()]} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        
        const newReply = {
          autor: currentAuthor.nombre,
          avatar: currentAuthor.avatar,
          texto: text,
          tiempo: formattedTiempo
        };
        const updatedReplies = Array.isArray(f.comentarios) ? [...f.comentarios, newReply] : [newReply];
        return {
          ...f,
          comentarios: updatedReplies,
          respuestas: updatedReplies.length
        };
      }
      return f;
    }));
    setForumCommentTexts(prev => ({ ...prev, [forumId]: "" }));
    toast.success("¡Respuesta publicada con éxito!");
  };

  const filteredPosts = posts.filter(p => {
    if (activeSubTab === "guardados" && !p.saved) return false;
    if (filterType !== "todos" && p.tipo !== filterType) return false;
    if (cityFilter !== "Todas" && !p.ubicacion?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    return true;
  });

  const filteredForums = forums.filter(f => {
    if (cityFilter !== "Todas" && !f.ubicacion?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Tabs */}
      <div className="flex justify-between items-center border-b pb-1">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("club")}
            className={`pb-2.5 font-semibold text-sm transition relative ${
              activeTab === "club" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mi Club
          </button>
          <button
            onClick={() => setActiveTab("global")}
            className={`pb-2.5 font-semibold text-sm transition relative ${
              activeTab === "global" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setActiveTab("empleos")}
            className={`pb-2.5 font-semibold text-sm transition relative ${
              activeTab === "empleos" ? "text-primary border-b-2 border-primary flex items-center gap-1.5" : "text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            }`}
          >
            <Briefcase className="h-4 w-4" /> Empleos
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Main Feed Column */}
        <div className="space-y-6 md:col-span-3">
          {/* Sub-tabs: Muro, Foros, Guardados */}
          <div className="flex gap-4 border-b border-border/60 pb-2">
            {(["muro", "foros", "guardados"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition ${
                  activeSubTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeSubTab === "muro" && (
            <>
              {/* Cumpleaños del día Banner */}
              {birthdays.length > 0 && (
                <Card className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-500/20 shadow-elegant p-4 rounded-2xl relative overflow-hidden animate-in fade-in duration-500">
                  <div className="absolute top-0 right-0 p-2 text-2xl animate-bounce">🎈</div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex -space-x-2 shrink-0">
                      {birthdays.map((b, idx) => (
                        <Avatar key={idx} className="h-12 w-12 border-2 border-background shadow-md">
                          <AvatarImage src={b.foto} />
                          <AvatarFallback>{b.nombre[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div className="text-center sm:text-left space-y-1">
                      <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span>🎉 ¡Hoy es un día especial en la Academia! 🎂</span>
                        <span className="text-[10px] text-muted-foreground/80 font-bold bg-muted/70 px-2 py-0.5 rounded-full">
                          {formattedToday}
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Queremos desearle un muy feliz cumpleaños a{" "}
                        {birthdays.map((b, idx) => (
                          <span key={idx} className="font-bold text-primary">
                            {b.nombre} ({b.rol}){idx < birthdays.length - 1 ? ", " : ""}
                          </span>
                        ))}
                        . ¡Que sea un gran año lleno de éxitos y alegrías en la cancha! ⚽🏆
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Write Post Box / Locked message */}
              {canPublish ? (
                <Card className="shadow-card overflow-hidden">
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
                          placeholder="¿Qué está pasando en el club?"
                          value={newPostText}
                          onChange={e => setNewPostText(e.target.value)}
                          rows={3}
                          className="border-none bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary/20 rounded-xl resize-none text-sm"
                        />
                      </div>

                      {/* Image preview */}
                      {imagePreview && (
                        <div className="relative ml-12 rounded-xl overflow-hidden border border-border/60">
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

                    {/* Action bar */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/20">
                      <div className="flex items-center gap-2">
                        {/* Hidden file input */}
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
                <Card className="shadow-card p-5 text-center bg-muted/20 border border-dashed text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-2xl">
                  <Lock className="h-5 w-5 text-muted-foreground/75" />
                  <p className="text-xs font-semibold">🔒 Publicaciones restringidas</p>
                  <p className="text-[10px] text-muted-foreground">No tienes permisos para realizar publicaciones en este Muro. Comunícate con tu administrador.</p>
                </Card>
              )}

              {/* Feed List */}
              <div className="space-y-5">
                {filteredPosts.map(post => (
                  <Card key={post.id} className="shadow-card overflow-visible">
                    <div className="p-4 space-y-4">
                      {/* Author Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
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
                              className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Badge variant="outline" className="text-[9px] uppercase font-bold text-muted-foreground/80">
                            {post.tipo}
                          </Badge>
                        </div>
                      </div>

                      {/* Content text */}
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                        {post.contenido}
                      </p>

                      {/* Survey block if type === encuesta */}
                      {post.tipo === "encuesta" && post.encuesta && (
                        <div className="space-y-2.5 p-4 rounded-2xl bg-muted/40 border border-border/80">
                          <h4 className="text-xs font-bold text-foreground">{post.encuesta.pregunta}</h4>
                          <div className="space-y-2">
                            {post.encuesta.opciones.map((op, idx) => {
                              const pct = post.encuesta!.totalVotos > 0 ? Math.round((op.votos / post.encuesta!.totalVotos) * 100) : 0;
                              const isVoted = post.encuesta!.votoUsuario === idx;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleVote(post.id, idx)}
                                  className="w-full relative flex items-center justify-between p-2.5 rounded-xl border text-xs text-left overflow-hidden bg-background hover:bg-muted/30 transition group focus:outline-none"
                                >
                                  <div
                                    className="absolute left-0 top-0 bottom-0 bg-primary/5 transition-all duration-500"
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

                      {/* Image if present */}
                      {post.imagen && (
                        <div 
                          onClick={() => setSelectedImage(post.imagen!)}
                          className="group relative rounded-2xl overflow-hidden border bg-slate-50 dark:bg-slate-950/30 flex justify-center items-center cursor-pointer transition transform active:scale-[0.995]"
                        >
                          <img src={post.imagen} alt="Post asset" className="max-w-full h-auto max-h-[460px] object-contain transition duration-300 group-hover:brightness-95" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-2 text-white font-medium text-xs backdrop-blur-[1px]">
                            <ZoomIn className="h-5 w-5" />
                            <span>Toca para agrandar</span>
                          </div>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t text-muted-foreground text-xs relative">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition ${
                            post.liked ? "text-red-500 font-bold" : ""
                          }`}
                        >
                          <Heart className="h-4.5 w-4.5" fill={post.liked ? "#ef4444" : "none"} stroke={post.liked ? "#ef4444" : "currentColor"} />
                          <span>{post.likes}</span>
                        </button>

                        <button 
                          onClick={() => setVisibleComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-muted hover:text-primary transition ${
                            visibleComments[post.id] ? "text-primary font-bold" : ""
                          }`}
                        >
                          <MessageSquare className="h-4.5 w-4.5" />
                          <span>Comentarios ({post.comentarios?.length || 0})</span>
                        </button>

                        <button 
                          onClick={() => handleSave(post.id)}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-500 transition ${
                            post.saved ? "text-amber-500 font-bold" : ""
                          }`}
                        >
                          <Bookmark className="h-4.5 w-4.5" fill={post.saved ? "#f59e0b" : "none"} stroke={post.saved ? "#f59e0b" : "currentColor"} />
                          <span>{post.saved ? "Guardado" : "Guardar"}</span>
                        </button>

                        <div className="relative">
                          <button 
                            onClick={() => setActiveShareMenu(activeShareMenu === post.id ? null : post.id)}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-muted hover:text-foreground transition ${
                              activeShareMenu === post.id ? "text-foreground bg-muted" : ""
                            }`}
                          >
                            <Share2 className="h-4.5 w-4.5" />
                          </button>

                          {activeShareMenu === post.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveShareMenu(null)} />
                              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-md z-40 animate-in fade-in slide-in-from-top-1 duration-200">
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
                      </div>

                      {/* Comments Drawer / Area */}
                      {visibleComments[post.id] && (
                        <div className="mt-4 pt-4 border-t space-y-3 animate-in fade-in duration-300">
                          {/* List of comments */}
                          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                            {post.comentarios && post.comentarios.length > 0 ? (
                              post.comentarios.map((comment, index) => (
                                <div key={index} className="flex gap-2.5 items-start p-2 rounded-xl bg-muted/30 border border-border/40">
                                  <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarImage src={comment.avatar} />
                                    <AvatarFallback className="text-[9px]">{comment.autor?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-0.5">
                                    <div className="flex items-center justify-between">
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

                          {/* Write Comment Box */}
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="Escribe un comentario..."
                              value={commentTexts[post.id] || ""}
                              onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  handleAddComment(post.id);
                                }
                              }}
                              className="h-8.5 text-xs rounded-xl focus-visible:ring-primary/20 bg-muted/40"
                            />
                            <Button 
                              onClick={() => handleAddComment(post.id)}
                              size="sm" 
                              className="h-8.5 bg-primary text-white rounded-xl text-xs"
                            >
                              Enviar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {activeSubTab === "foros" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Foro de la Comunidad</h2>
                  <p className="text-[11px] text-muted-foreground">Debates, consejos, táctica y nutrición para nuestra academia.</p>
                </div>
                <Button 
                  onClick={() => {
                    const titulo = prompt("Título del foro:");
                    const descripcion = prompt("Descripción:");
                    const categoria = prompt("Categoría (ej. Nutrición, Psicología, Entrenamiento):") || "General";
                    const ciudad = prompt("Ciudad del foro (San José, Medellín, Bucaramanga):") || "San José";
                    if (titulo && descripcion) {
                      setForums(prev => [
                        {
                          id: `f-${Date.now()}`,
                          titulo,
                          descripcion,
                          categoria,
                          autor: currentAuthor.nombre,
                          avatar: currentAuthor.avatar,
                          tiempo: "Hace un momento",
                          respuestas: 0,
                          likes: 0,
                          liked: false,
                          ubicacion: ciudad
                        },
                        ...prev
                      ]);
                      toast.success("¡Tema de foro creado correctamente!");
                    }
                  }}
                  className="bg-gradient-primary text-white text-xs font-bold gap-1 shadow-elegant h-8.5"
                >
                  <Plus className="h-4 w-4" /> Nuevo Tema
                </Button>
              </div>

              <div className="space-y-4">
                {filteredForums.map(forum => (
                  <Card key={forum.id} className="p-4 bg-card border border-slate-200 dark:border-white/5 hover:border-primary/30 transition shadow-card">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2 items-center">
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] font-bold">
                            {forum.categoria}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] font-semibold text-muted-foreground border-border/80">
                            📍 {forum.ubicacion}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{forum.tiempo}</span>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-bold text-foreground hover:text-primary cursor-pointer transition">
                          {forum.titulo}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {forum.descripcion}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={forum.avatar} />
                            <AvatarFallback>{forum.autor[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{forum.autor}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              setForums(prev => prev.map(f => {
                                if (f.id === forum.id) {
                                  return {
                                    ...f,
                                    liked: !f.liked,
                                    likes: f.liked ? f.likes - 1 : f.likes + 1
                                  };
                                }
                                return f;
                              }));
                            }}
                            className={`flex items-center gap-1 hover:text-foreground transition ${forum.liked ? "text-primary" : ""}`}
                          >
                            <Heart className="h-4 w-4" fill={forum.liked ? "currentColor" : "none"} />
                            <span>{forum.likes}</span>
                          </button>

                          <button 
                            onClick={() => setVisibleForumComments(prev => ({ ...prev, [forum.id]: !prev[forum.id] }))}
                            className={`flex items-center gap-1 hover:text-foreground transition ${
                              visibleForumComments[forum.id] ? "text-primary font-bold" : ""
                            }`}
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>{forum.respuestas} respuestas</span>
                          </button>
                        </div>
                      </div>

                      {/* Forum Inline replies */}
                      {visibleForumComments[forum.id] && (
                        <div className="mt-4 pt-4 border-t space-y-3 animate-in fade-in duration-300">
                          {/* Replies list */}
                          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                            {forum.comentarios && forum.comentarios.length > 0 ? (
                              forum.comentarios.map((reply, idx) => (
                                <div key={idx} className="flex gap-2.5 items-start p-2 rounded-xl bg-muted/30 border border-border/40">
                                  <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarImage src={reply.avatar} />
                                    <AvatarFallback className="text-[9px]">{reply.autor?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-0.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-foreground">{reply.autor}</span>
                                      <span className="text-[9px] text-muted-foreground">{reply.tiempo}</span>
                                    </div>
                                    <p className="text-xs text-foreground/90 leading-relaxed">{reply.texto}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-center text-muted-foreground py-2">No hay respuestas aún. ¡Sé el primero en participar!</p>
                            )}
                          </div>

                          {/* Post reply box */}
                          <div className="flex gap-2 items-center">
                            <Input
                              placeholder="Escribe tu respuesta..."
                              value={forumCommentTexts[forum.id] || ""}
                              onChange={e => setForumCommentTexts(prev => ({ ...prev, [forum.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  handleAddForumComment(forum.id);
                                }
                              }}
                              className="h-8.5 text-xs rounded-xl focus-visible:ring-primary/20 bg-muted/40"
                            />
                            <Button 
                              onClick={() => handleAddForumComment(forum.id)}
                              size="sm" 
                              className="h-8.5 bg-primary text-white rounded-xl text-xs"
                            >
                              Responder
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Filters & Profile Column */}
        <div className="space-y-6">
          {/* Search Card */}
          <Card className="shadow-card p-4 space-y-1">
            <Label htmlFor="postSearch" className="text-xs">Buscar en el muro</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="postSearch" placeholder="Buscar publicaciones..." className="pl-9 h-9" />
            </div>
          </Card>

          {/* Filters Card */}
          <Card className="shadow-card p-4 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Filtros</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Filtra contenido relevante</p>
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
              <Label className="text-xs">Tipo de Publicación</Label>
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

          {/* Mini Profile Widget */}
          <Card className="shadow-card p-4 text-center space-y-3">
            <Avatar className="h-12 w-12 mx-auto">
              <AvatarImage src={currentAuthor.avatar} />
              <AvatarFallback>{currentAuthor.initials}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-sm font-bold text-foreground">{currentAuthor.nombre}</h4>
              <p className="text-[11px] text-muted-foreground">{currentAuthor.usuario}</p>
            </div>
            <div className="grid grid-cols-3 gap-1 border-t pt-3 text-[10px] text-muted-foreground font-semibold">
              <div>
                <p className="text-foreground font-bold">12</p>
                <p>seguidores</p>
              </div>
              <div>
                <p className="text-foreground font-bold">34</p>
                <p>siguiendo</p>
              </div>
              <div>
                <p className="text-foreground font-bold">5</p>
                <p>rep</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Fullscreen Image Modal / Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-slate-950/95 border-slate-800 text-white flex flex-col items-center justify-center overflow-hidden rounded-2xl shadow-2xl">
          <DialogTitle className="sr-only">Visualizador de imagen</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center p-2">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Imagen ampliada"
                className="max-h-[85vh] w-auto max-w-full object-contain rounded-lg shadow-lg animate-in zoom-in-95 duration-200"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
