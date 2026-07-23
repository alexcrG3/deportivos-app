import { Bell, Moon, Search, Sun, ChevronDown, Users, Stethoscope, LifeBuoy } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/hooks/use-role";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useMemo } from "react";
import { sedes } from "@/lib/mock-data";
import RendimientoStore from "@/lib/rendimiento-store";
import { NotificationCenterPopover } from "@/components/NotificationCenterPopover";
import { InteractiveGuidesModal } from "@/components/InteractiveGuidesModal";
import { BookOpen, Rocket } from "lucide-react";

export function AppTopbar() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { role, setRole, coachName, setCoachName } = useRole();
  const [sede, setSede] = useState(sedes[0].nombre);
  const [openGuides, setOpenGuides] = useState(false);

  const authEmail = typeof window !== "undefined" ? localStorage.getItem("auth_email") : null;
  const loggedUser = useMemo(() => {
    if (!authEmail) return null;
    return RendimientoStore.getUsuarios().find((u) => u.email.toLowerCase() === authEmail.toLowerCase());
  }, [authEmail]);

  const displayName = useMemo(() => {
    if (role === "coach" && coachName) return coachName;
    if (loggedUser) return loggedUser.nombre;
    if (authEmail) {
      const prefix = authEmail.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return role === "admin" ? "Admin Demo" : role === "coach" ? coachName : "Manuel Rodríguez";
  }, [loggedUser, authEmail, role, coachName]);

  const displayRole = role === "admin" ? "Administrador" : role === "coach" ? "Coach Deportivo" : "Padre de Familia";
  const initials = displayName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  const [allCoaches, setAllCoaches] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const list = RendimientoStore.getEntrenadores();
    setAllCoaches(Array.from(new Set(list.map((e: any) => e.nombre as string))).sort());
  }, []);

  const isSuperAdmin = useMemo(() => {
    if (!mounted) return false;
    return localStorage.getItem("is_superadmin") === "true";
  }, [mounted]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <span className="hidden sm:inline text-muted-foreground text-xs">Sede:</span>
            <span className="font-medium">{sede}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Cambiar sede</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSede("Todas las sedes")}>Todas las sedes</DropdownMenuItem>
          {sedes.map((s) => (
            <DropdownMenuItem key={s.id} onClick={() => setSede(s.nombre)}>
              {s.nombre}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative ml-auto hidden lg:block w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar jugadores, pagos..." className="pl-9 h-9 bg-muted/40 border-transparent focus-visible:bg-background" />
      </div>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate({ to: "/ruta-aprendizaje" })} 
        aria-label="Ruta DeportivOS" 
        title="Ruta de Maestría y Aprendizaje Interactivo"
        className="gap-1.5 font-extrabold text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl shadow-sm"
      >
        <Rocket className="h-4 w-4 text-amber-500 animate-pulse" />
        <span className="hidden md:inline">Ruta DeportivOS</span>
      </Button>

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setOpenGuides(true)} 
        aria-label="Guías Interactivas" 
        title="Guías Interactivas y Manuales Paso a Paso"
        className="gap-1.5 font-bold text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl"
      >
        <BookOpen className="h-4 w-4" />
        <span className="hidden md:inline">Guías Interactivas</span>
      </Button>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate({ to: "/soporte" })} 
        aria-label="Soporte y Tickets" 
        title="Soporte y Tickets de Ayuda"
        className="relative"
      >
        <LifeBuoy className="h-4 w-4 text-primary" />
      </Button>

      <NotificationCenterPopover />

      <InteractiveGuidesModal open={openGuides} onOpenChange={setOpenGuides} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-sm font-medium">{displayName}</span>
              <span className="text-xs text-muted-foreground">{displayRole}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* User header */}
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">{displayName}</span>
              <span className="text-xs text-muted-foreground truncate">{displayRole}</span>
              <span className="text-[10px] text-muted-foreground/70 truncate">
                {mounted ? (localStorage.getItem("auth_email") || "—") : "—"}
              </span>
            </div>
          </div>
          <DropdownMenuSeparator />
          {role !== "admin" && (
            <DropdownMenuItem onClick={() => { setRole("admin"); window.location.reload(); }} className="cursor-pointer">
              Cambiar a Administrador
            </DropdownMenuItem>
          )}
          {/* Sub-menu: selects which coach to simulate */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              Simular Coach
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              {allCoaches.map((name) => (
                <DropdownMenuItem
                  key={name}
                  className={`cursor-pointer ${role === "coach" && coachName === name ? "font-semibold text-primary" : ""}`}
                  onClick={() => { setRole("coach"); setCoachName(name); window.location.reload(); }}
                >
                  {name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {(role === "admin" || isSuperAdmin) && (
            <DropdownMenuItem
              onClick={() => {
                toast.info("🩺 Modo Fisioterapeuta Clínico activado");
                navigate({ to: "/medico/citas" });
              }}
              className="cursor-pointer font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
            >
              <Stethoscope className="mr-2 h-4 w-4 text-indigo-500" />
              Simular Fisioterapeuta
            </DropdownMenuItem>
          )}
          {role !== "padres" && (
            <DropdownMenuItem onClick={() => { setRole("padres"); window.location.reload(); }} className="cursor-pointer">
              Cambiar a Padre de Familia
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configuración</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive cursor-pointer"
            onClick={() => {
              toast.success("Sesión cerrada correctamente");
              // Only the superadmin (alex@mail.com) returns to Centro de Mando.
              // Regular academy admins and other roles go to /login.
              const activeOrg = localStorage.getItem("active_organizacion_id") || "00000000-0000-0000-0000-000000000000";
              const isSuperAdmin = role === "admin" && (
                localStorage.getItem("is_superadmin") === "true" ||
                localStorage.getItem("impersonated_from_saas") === "true" ||
                activeOrg !== "00000000-0000-0000-0000-000000000000"
              );
              localStorage.setItem("active_organizacion_id", "00000000-0000-0000-0000-000000000000");
              localStorage.removeItem("impersonated_from_saas");
              if (isSuperAdmin) {
                window.location.href = "/saas-admin";
              } else {
                window.location.href = "/login";
              }
            }}
          >
            Cerrar sesión
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
