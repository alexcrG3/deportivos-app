import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save auth email
      localStorage.setItem("auth_email", email.trim().toLowerCase());

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
          <CardContent className="p-0 space-y-8">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
                <Trophy className="h-5 w-5" />
              </div>
              <span className="font-semibold">Élite Sports</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">Inicia sesión</h1>
              <p className="text-sm text-muted-foreground">
                Ingresa a tu plataforma deportiva multi-sede.
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
              <div className="pt-2 border-t border-slate-800">
                <Link to="/landing" className="text-[11px] text-slate-500 hover:text-amber-400 hover:underline transition-colors flex items-center justify-center gap-1">
                  🌐 Ver presentación comercial (Landing Page)
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex bg-gradient-primary relative overflow-hidden p-12 text-primary-foreground">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_50%)]" />
        <div className="relative z-10 m-auto max-w-md space-y-6">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
            Plataforma Deportiva 2026
          </div>
          <h2 className="text-4xl font-semibold leading-tight">
            Gestiona tu academia deportiva desde un solo lugar.
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
