import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";

export type UserRole = "admin" | "coach" | "padres" | "fisioterapeuta";

export const INITIAL_PERMISSIONS = {
  admin: {
    dashboard: true, crm: true, operacion: true, asistencia: true, coach_os: true,
    competiciones: true, rendimiento: true, medico: true, finanzas: true, ia: true, biblioteca: true, configuracion: true, muro: true
  },
  coach: {
    // Coach NO ve el Dashboard General (admin). Su inicio es Coach OS.
    dashboard: false, crm: false, operacion: true, asistencia: true, coach_os: true,
    competiciones: true, rendimiento: true, medico: false, finanzas: false, ia: true, biblioteca: true, configuracion: false, muro: true
  },
  fisioterapeuta: {
    // Fisioterapeuta ve el Área Médica, Citas, Lesiones y Wellness
    dashboard: false, crm: false, operacion: false, asistencia: false, coach_os: false,
    competiciones: false, rendimiento: true, medico: true, finanzas: false, ia: true, biblioteca: true, configuracion: false, muro: true
  },
  padres: {
    // Padres tienen acceso a su Dashboard de auto-consulta y al Muro del Club
    dashboard: true, crm: false, operacion: false, asistencia: true, coach_os: false,
    competiciones: true, rendimiento: true, medico: false, finanzas: true, ia: false, biblioteca: false, configuracion: false, muro: true
  }
};

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  coachName: string;
  setCoachName: (name: string) => void;
  permissions: Record<string, Record<string, boolean>>;
  setPermissions: (perms: Record<string, Record<string, boolean>>) => void;
  updatePermission: (roleId: string, moduleId: string, value: boolean) => void;
  // Admin viewing a coach's data
  selectedCoachId: string | null;
  selectedCoachName: string | null;
  selectedCoachIdentificacion: string | null;
  setSelectedCoach: (id: string | null, name: string | null, identificacion?: string | null) => void;
}

const RoleContext = createContext<RoleContextType>({
  role: "admin",
  setRole: () => {},
  coachName: "",
  setCoachName: () => {},
  permissions: INITIAL_PERMISSIONS,
  setPermissions: () => {},
  updatePermission: () => {},
  selectedCoachId: null,
  selectedCoachName: null,
  selectedCoachIdentificacion: null,
  setSelectedCoach: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("admin");
  const [coachName, setCoachNameState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("coach_name") || "";
  });
  const [permissions, setPermissionsState] = useState<Record<string, Record<string, boolean>>>(INITIAL_PERMISSIONS);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [selectedCoachName, setSelectedCoachName] = useState<string | null>(null);
  const [selectedCoachIdentificacion, setSelectedCoachIdentificacion] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authEmail = localStorage.getItem("auth_email");
      
      const loadRoleFromDB = async () => {
        let resolvedRole: UserRole | null = null;
        let resolvedCoachName = "";

        if (authEmail) {
          try {
            const { data: dbUsers } = await supabase
              .from("usuarios")
              .select("*")
              .eq("email", authEmail.trim().toLowerCase());

            const matchedUser = dbUsers && dbUsers.length > 0 ? dbUsers[0] : null;

            if (matchedUser) {
              const rawRole = matchedUser.role.toLowerCase();
              if (rawRole.includes("admin") || rawRole.includes("staff") || rawRole.includes("director") || rawRole === "direccion") {
                resolvedRole = "admin";
              } else if (rawRole.includes("fisio") || rawRole.includes("medico") || rawRole.includes("terapeuta")) {
                resolvedRole = "fisioterapeuta";
              } else if (rawRole.includes("coach") || rawRole.includes("entrenador") || rawRole.includes("coaches")) {
                resolvedRole = "coach";
                resolvedCoachName = matchedUser.nombre;
              } else {
                resolvedRole = "padres";
              }

              // Force update their status to "activo" if it's currently "invitado" in DB
              if (matchedUser.estado === "invitado") {
                await supabase
                  .from("usuarios")
                  .update({ estado: "activo" })
                  .eq("id", matchedUser.id);
              }
            } else {
              // Fallback to check if it's a parent email of any player
              const players = RendimientoStore.getJugadores();
              const isParent = players.some(
                (p) => p.correoEncargado && p.correoEncargado.trim().toLowerCase() === authEmail.trim().toLowerCase()
              );
              if (isParent) {
                resolvedRole = "padres";
              }
            }
          } catch (e) {
            console.error("Error loading role from Supabase:", e);
          }
        }

        // Prioritize manually simulated role in localStorage first to support simulator toggles.
        const storedRole = (localStorage.getItem("user-role") as UserRole | null) || resolvedRole;
        if (storedRole === "admin" || storedRole === "coach" || storedRole === "padres") {
          setRoleState(storedRole);
          localStorage.setItem("user-role", storedRole);
        }

        const finalCoachName = resolvedCoachName || localStorage.getItem("coach-name");
        if (finalCoachName) {
          setCoachNameState(finalCoachName);
          localStorage.setItem("coach-name", finalCoachName);
        }
      };

      loadRoleFromDB();

      const storedPerms = localStorage.getItem("user-permissions");
      if (storedPerms) {
        try {
          setPermissionsState(JSON.parse(storedPerms));
        } catch (e) {
          console.error("Error parsing stored permissions", e);
        }
      }

      // Restore selected coach from sessionStorage (clears on browser close)
      const storedCoachId = sessionStorage.getItem("selected_coach_id");
      const storedCoachName = sessionStorage.getItem("selected_coach_name");
      const storedCoachIdent = sessionStorage.getItem("selected_coach_identificacion");
      if (storedCoachId && storedCoachName) {
        setSelectedCoachId(storedCoachId);
        setSelectedCoachName(storedCoachName);
        setSelectedCoachIdentificacion(storedCoachIdent || null);
      }
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("user-role", newRole);
    }
  };

  const setCoachName = (name: string) => {
    setCoachNameState(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("coach-name", name);
    }
  };

  const setPermissions = (newPerms: Record<string, Record<string, boolean>>) => {
    setPermissionsState(newPerms);
    if (typeof window !== "undefined") {
      localStorage.setItem("user-permissions", JSON.stringify(newPerms));
    }
  };

  const updatePermission = (roleId: string, moduleId: string, value: boolean) => {
    setPermissionsState(prev => {
      const updated = {
        ...prev,
        [roleId]: {
          ...(prev[roleId] || {}),
          [moduleId]: value
        }
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("user-permissions", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const setSelectedCoach = (id: string | null, name: string | null, identificacion: string | null = null) => {
    setSelectedCoachId(id);
    setSelectedCoachName(name);
    setSelectedCoachIdentificacion(identificacion);
    if (typeof window !== "undefined") {
      if (id && name) {
        sessionStorage.setItem("selected_coach_id", id);
        sessionStorage.setItem("selected_coach_name", name);
        sessionStorage.setItem("selected_coach_identificacion", identificacion || "");
      } else {
        sessionStorage.removeItem("selected_coach_id");
        sessionStorage.removeItem("selected_coach_name");
        sessionStorage.removeItem("selected_coach_identificacion");
      }
    }
  };

  return (
    <RoleContext.Provider value={{
      role, setRole,
      coachName, setCoachName,
      permissions, setPermissions, updatePermission,
      selectedCoachId, selectedCoachName, selectedCoachIdentificacion, setSelectedCoach
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
