import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, ArrowRight, Eye, EyeOff, User, Mail, Lock, Fingerprint } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {      // 1. Resolve Role and links dynamically from DB
      let resolvedRole: "admin" | "coach" | "padres" = "padres";
      let matchedPlayerName = "";

      // Query database table "usuarios" directly for this email
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
        } else {
          resolvedRole = "padres";
        }
      } else {
        // If not pre-registered admin/coach, they are a Parent.
        resolvedRole = "padres";
      }

      // If they are registering as a parent, associate them with their athletes
      if (resolvedRole === "padres") {
        // Try to associate with players using the Parent's ID (cédula)
        if (cedula.trim()) {
          const players = RendimientoStore.getJugadores();
          // Find all players where the parent's ID matches the entered cedula
          const linkedPlayers = players.filter(
            (p) => 
              p.encargadoIdentificacion && 
              p.encargadoIdentificacion.trim().replace(/-/g, "") === cedula.trim().replace(/-/g, "")
          );

          if (linkedPlayers.length > 0) {
            matchedPlayerName = linkedPlayers.map(p => p.nombre).join(", ");
            // Link parent email and name to these players
            const updatedPlayers = players.map(p => {
              const matchesThisPlayer = linkedPlayers.some(lp => lp.id === p.id);
              return matchesThisPlayer 
                ? { ...p, correoEncargado: email, encargado: nombre } 
                : p;
            });
            RendimientoStore.set("jugadores_dynamics", updatedPlayers);
          }
        }
      }

      // 2. Sign up user in Supabase Auth with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            role: resolvedRole,
          },
        },
      });

      if (error && !error.message.includes("already registered")) {
        toast.error("Error al registrar: " + error.message);
        setLoading(false);
        return;
      }

      // 3. Mark state as active and save/update in DB
      const storeRole = resolvedRole === "coach" ? "coaches" : resolvedRole;
      const finalUser = {
        id: matchedUser?.id || ("u-" + Math.floor(1000 + Math.random() * 9000)),
        nombre,
        email: email.trim().toLowerCase(),
        role: storeRole,
        sede_id: matchedUser?.sede_id || "s1",
        estado: "activo",
        fecha_creacion: matchedUser?.fecha_creacion || new Date().toISOString().split("T")[0],
        organizacion_id: matchedUser?.organizacion_id || "00000000-0000-0000-0000-000000000000"
      };

      const { error: upsertError } = await supabase.from("usuarios").upsert(finalUser);
      if (upsertError) {
        console.error("Error saving user to DB:", upsertError.message);
      }

      // 4. Log in automatically and override legacy session states
      localStorage.setItem("auth_email", email.trim().toLowerCase());
      localStorage.setItem("user-role", resolvedRole);
      if (resolvedRole === "coach") {
        localStorage.setItem("coach-name", nombre);
      }

      if (matchedPlayerName) {
        toast.success(`¡Registro completado! Vinculado con el atleta: ${matchedPlayerName}`);
      } else {
        toast.success("¡Registro completado con éxito!");
      }
      
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);

    } catch (err: any) {
      console.error(err);
      toast.error("Ocurrió un error inesperado durante el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      <div className="flex items-center justify-center p-6 overflow-y-auto">
        <Card className="w-full max-w-md border-none shadow-none my-8">
          <CardContent className="p-0 space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
                <Trophy className="h-5 w-5" />
              </div>
              <span className="font-semibold">Élite Sports</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
              <p className="text-xs text-muted-foreground">
                Únete a la plataforma de alto rendimiento de tu academia.
              </p>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input 
                    id="nombre" 
                    type="text" 
                    placeholder="E.g. Juan Pérez"
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)}
                    className="pl-9"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cedula">Número de Cédula / Identificación (Encargado)</Label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input 
                    id="cedula" 
                    type="text" 
                    placeholder="E.g. 1-2345-6789 (para asociar a tus hijos)"
                    value={cedula} 
                    onChange={(e) => setCedula(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Se utilizará para vincularte automáticamente con el registro e inscripciones de tus hijos.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="correo@ejemplo.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    placeholder="Mínimo 6 caracteres"
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

              <Button type="submit" className="w-full bg-gradient-primary shadow-elegant mt-2" disabled={loading}>
                {loading ? "Creando cuenta..." : (<>Registrarse <ArrowRight className="ml-1 h-4 w-4" /></>)}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground pt-2">
              <p>
                ¿Ya tienes una cuenta? <Link to="/login" className="text-primary hover:underline font-medium">Inicia Sesión</Link>
              </p>
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
            Regístrate y conéctate al ecosistema de tu club.
          </h2>
          <p className="text-primary-foreground/80">
            Control de asistencia, seguimiento fisiológico, táctica interactiva y gestión de mensualidades.
          </p>
        </div>
      </div>
    </div>
  );
}
