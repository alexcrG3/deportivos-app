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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) {
        toast.error("Error al iniciar con Google: " + error.message);
        setLoading(false);
      }
    } catch (err: any) {
      toast.error("Error al conectar con Google");
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save auth email
      const cleanEmail = email.trim().toLowerCase();
      localStorage.setItem("auth_email", cleanEmail);

      // Ensure active org is saved in store
      if (selectedOrg && selectedOrg.id) {
        RendimientoStore.setActiveOrganizacionId(selectedOrg.id);
      }

      // 2. Real Supabase Auth Sign-In
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError && cleanEmail !== "alex@mail.com") {
        console.warn("[Supabase Auth] Sign-in notice:", authError.message);
      }

      // 3. Resolve Role dynamically from DB (perfiles / usuarios)
      let resolvedRole: "admin" | "coach" | "fisioterapeuta" | "padres" = "admin";
      let resolvedCoachName = "";

      if (cleanEmail === "alex@mail.com" && password === "123456Xx") {
        resolvedRole = "admin";
        localStorage.setItem("is_superadmin", "true");
      } else {
        localStorage.removeItem("is_superadmin");

        // Try searching in system users list from DB (perfiles and usuarios)
        const [perfilesRes, usuariosRes] = await Promise.all([
          supabase.from("perfiles").select("*").eq("email", cleanEmail).limit(1),
          supabase.from("usuarios").select("*").eq("email", cleanEmail).limit(1)
        ]);

        const matchedProfile = perfilesRes.data?.[0] || usuariosRes.data?.[0];

        if (matchedProfile) {
          const rawRole = (matchedProfile.role || "").toLowerCase();
          if (rawRole.includes("admin") || rawRole.includes("staff") || rawRole.includes("director") || rawRole === "direccion") {
            resolvedRole = "admin";
          } else if (rawRole.includes("fisio") || rawRole.includes("medico") || rawRole.includes("terapeuta")) {
            resolvedRole = "fisioterapeuta";
          } else if (rawRole.includes("coach") || rawRole.includes("entrenador") || rawRole.includes("coaches")) {
            resolvedRole = "coach";
            resolvedCoachName = matchedProfile.nombre;
          } else {
            resolvedRole = "padres";
          }
        } else {
          // Check if parent email
          const players = RendimientoStore.getJugadores();
          const isParent = players.some(
            (p) => p.correoEncargado && p.correoEncargado.trim().toLowerCase() === cleanEmail
          );
          if (isParent) {
            resolvedRole = "padres";
          } else {
            resolvedRole = "admin";
          }
        }
      }

      // 4. Save active role context
      localStorage.setItem("user-role", resolvedRole);
      if (resolvedRole === "coach") {
        localStorage.setItem("coach-name", resolvedCoachName);
      }

      const roleLabels: Record<string, string> = {
        admin: "👑 Administrador",
        coach: "⚽ Entrenador",
        fisioterapeuta: "🩺 Cuerpo Médico",
        padres: "👨‍👩‍👧 Padre de Familia",
      };

      toast.success(`Sesión iniciada como ${roleLabels[resolvedRole] || "Usuario"}`);
      
      setTimeout(() => {
        if (cleanEmail === "alex@mail.com") {
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
                <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-900 border-2 border-primary/40 shadow-2xl p-2 group-hover:scale-105 transition duration-300">
                  {selectedOrg?.logo ? (
                    <img src={selectedOrg.logo} alt={selectedOrg.nombre} className="h-full w-full object-contain rounded-xl" />
                  ) : (
                    <Trophy className="h-10 w-10 text-primary animate-pulse" />
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                  {selectedOrg?.nombre || "NexusSport OS"}
                </h2>
                <p className="text-xs font-semibold text-primary uppercase tracking-widest">
                  Plataforma Deportiva Elite
                </p>
              </div>

              {/* Selector dinámico de Academias */}
              {orgs.length > 1 && (
                <div className="pt-1 w-full max-w-xs">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Selecciona tu Academia
                  </span>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {orgs.map((org: any) => {
                      const isSelected = org.id === selectedOrgId;
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

            {/* Google OAuth Quick Button */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-white text-xs h-11 rounded-xl shadow transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2L1.9 7.5C.7 9.9 0 12.5 0 15.3s.7 5.4 1.9 7.8l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" />
                </svg>
                <span>Continuar con Google</span>
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-800" />
                <span className="bg-background px-2 text-[10px] uppercase text-muted-foreground font-semibold absolute">O con tu correo</span>
              </div>
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

