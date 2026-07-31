import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, ArrowRight, Eye, EyeOff, ShieldCheck, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      code: (search.code as string) || undefined,
    };
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Dynamic Academies / Organizations State
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  useEffect(() => {
    const list = RendimientoStore.getOrganizaciones();
    setOrgs(list);
    const activeId = RendimientoStore.getActiveOrganizacionId();
    if (activeId && list.some((o: any) => o.id === activeId)) {
      setSelectedOrgId(activeId);
    } else if (list.length > 0) {
      setSelectedOrgId(list[0].id);
    }
  }, []);

  const selectedOrg = orgs.find((o: any) => o.id === selectedOrgId) || orgs[0] || {
    id: "default",
    nombre: "Academia Asoderive",
    logo: null,
  };

  const handleSelectOrg = (id: string) => {
    setSelectedOrgId(id);
    RendimientoStore.setActiveOrganizacionId(id);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save auth email
      localStorage.setItem("auth_email", email.trim().toLowerCase());

      // Ensure active org is saved in store
      if (selectedOrg && selectedOrg.id) {
        RendimientoStore.setActiveOrganizacionId(selectedOrg.id);
      }

      // 2. Resolve Role dynamically
      let resolvedRole: "admin" | "coach" | "padres" = "admin";
      let resolvedCoachName = "";

      if (email.trim().toLowerCase() === "alex@mail.com" && password === "123456Xx") {
        resolvedRole = "admin";
        localStorage.setItem("is_superadmin", "true");
      } else {
        localStorage.removeItem("is_superadmin");

        // Try searching in system users list from DB
        const { data: dbUsers, error: dbError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("email", email.trim().toLowerCase());

        const matchedUser = dbUsers && dbUsers.length > 0 ? dbUsers[0] : null;

        if (matchedUser) {
          const rawRole = matchedUser.role.toLowerCase();
          if (rawRole.includes("admin") || rawRole.includes("staff") || rawRole.includes("director") || rawRole === "direccion") {
            resolvedRole = "admin";
          } else if (rawRole.includes("coach") || rawRole.includes("entrenador") || rawRole.includes("coaches")) {
            resolvedRole = "coach";
            resolvedCoachName = matchedUser.nombre;
          } else {
            resolvedRole = "padres";
          }

          // Mark user as active on successful login in DB
          if (matchedUser.estado !== "activo") {
            await supabase
              .from("usuarios")
              .update({ estado: "activo" })
              .eq("id", matchedUser.id);
          }
        } else {
          // If not in users list, check if this email is a parent email of any player
          const players = RendimientoStore.getJugadores();
          const isParent = players.some(
            (p) => p.correoEncargado && p.correoEncargado.trim().toLowerCase() === email.trim().toLowerCase()
          );
          if (isParent) {
            resolvedRole = "padres";
          } else {
            // Default fallback
            resolvedRole = "admin";
          }
        }
      }

      // 3. Save to localStorage to let useRole hook read it
      localStorage.setItem("user-role", resolvedRole);
      if (resolvedRole === "coach") {
        localStorage.setItem("coach-name", resolvedCoachName);
      }

      toast.success(`Sesión iniciada como ${resolvedRole === "admin" ? "Administrador" : resolvedRole === "coach" ? "Entrenador" : "Padre de Familia"}`);
      
      // Force window reload or state refresh to let AppSidebar/AppTopbar read new role instantly
      setTimeout(() => {
        if (email.trim().toLowerCase() === "alex@mail.com") {
          window.location.href = "/saas-admin";
        } else {
          window.location.href = "/dashboard";
        }
      }, 300);
    } catch (err: any) {
      console.error(err);
      toast.error("Ocurrió un error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardContent className="p-0 space-y-6">
            
            {/* Dynamic Centered Academy Branding Header */}
            <div className="flex flex-col items-center justify-center text-center space-y-4 pt-2">
              {/* Centered Logo Container - Dark Frame with Ambient Glow */}
              <div className="relative group flex items-center justify-center">
                <div className="absolute -inset-3 bg-gradient-to-r from-primary via-indigo-500 to-amber-500 rounded-3xl blur-xl opacity-35 group-hover:opacity-60 transition duration-500" />
                
                <div className="relative h-44 w-44 md:h-52 md:w-52 rounded-3xl bg-slate-950/90 border border-slate-800/50 shadow-xl flex items-center justify-center p-1.5 transition-all duration-300 group-hover:scale-105 overflow-hidden">
                  <img
                    src={
                      selectedOrg && selectedOrg.logo
                        ? selectedOrg.logo
                        : (selectedOrg?.nombre?.toLowerCase().includes("asoderive") || !selectedOrg
                            ? "/asoderive-logo.jpg"
                            : "/favicon.png")
                    }
                    alt={selectedOrg?.nombre || "Logo de la Academia"}
                    className="h-full w-full object-contain rounded-2xl filter drop-shadow-md"
                  />
                </div>
              </div>

              {/* Centered Greeting & Academy Subtitle */}
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                  ¡Iniciemos el Día!
                </h2>
                <p className="text-sm font-semibold text-muted-foreground">
                  {selectedOrg?.nombre || "Academia Asoderive"}
                </p>
              </div>

              {/* Selector of Registered Academies (if multiple exist) */}
              {orgs.length > 1 && (
                <div className="w-full pt-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Academia Inscrita:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 max-h-32 overflow-y-auto p-1">
                    {orgs.map((org) => {
                      const isSelected = org.id === selectedOrg?.id;
                      return (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => handleSelectOrg(org.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 ring-2 ring-primary/30"
                              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {org.logo ? (
                            <img src={org.logo} alt={org.nombre} className="h-4 w-4 object-contain rounded-full" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                          <span className="max-w-[140px] truncate">{org.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-center">
              <h1 className="text-xl font-bold tracking-tight">Inicia sesión</h1>
              <p className="text-xs text-muted-foreground">
                Ingresa tus credenciales para acceder a la plataforma.
              </p>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <a href="#" className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-primary shadow-elegant" disabled={loading}>
                {loading ? "Ingresando..." : (<>Ingresar <ArrowRight className="ml-1 h-4 w-4" /></>)}
              </Button>
            </form>
            <div className="space-y-2 text-center text-sm text-muted-foreground">
              <p>
                ¿No tienes cuenta?{" "}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Regístrate aquí
                </Link>
              </p>
              <p className="text-xs text-slate-500">
                ¿Deseas inscribir a un atleta?{" "}
                <Link to="/inscripcion" className="text-primary hover:underline font-medium">
                  Pre-inscríbete aquí
                </Link>
              </p>
              <div className="pt-3 border-t border-slate-800/60 flex flex-col items-center gap-1.5 text-center">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  © 2026 NexusSport OS. Al entrar aceptas los{" "}
                  <Link to="/terminos" className="text-primary font-semibold hover:underline">
                    Términos y Condiciones
                  </Link>{" "}
                  y las{" "}
                  <Link to="/privacidad" className="text-primary font-semibold hover:underline">
                    Políticas de Privacidad (PRODHAB)
                  </Link>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex bg-gradient-primary relative overflow-hidden p-12 text-primary-foreground">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_50%)]" />
        <div className="relative z-10 m-auto max-w-md space-y-6">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur font-semibold">
            Plataforma Deportiva 2026
          </div>
          <h2 className="text-4xl font-extrabold leading-tight">
            Gestiona {selectedOrg?.nombre || "tu academia deportiva"} desde un solo lugar.
          </h2>
          <p className="text-primary-foreground/80">
            Jugadores, sedes, pagos y reportes — todo en una experiencia moderna pensada para Latinoamérica.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { k: "258", v: "Jugadores" },
              { k: "4", v: "Sedes" },
              { k: "12", v: "Equipos" },
            ].map((s) => (
              <div key={s.v} className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <div className="text-2xl font-semibold">{s.k}</div>
                <div className="text-xs opacity-80">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

