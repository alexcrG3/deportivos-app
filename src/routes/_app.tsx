import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { FloatAIButton } from "@/components/float-ai-button";
import { ActiveStepFloatingWidget } from "@/components/ActiveStepFloatingWidget";
import RendimientoStore from "@/lib/rendimiento-store";
import { TacticalStore } from "@/lib/tactical-store";
import { seedEjemploPaso5 } from "@/lib/seed-ejemplo-paso5";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  ssr: false,
});

function AppLayout() {
  // Initialize isSyncing based on store status to prevent the empty dashboard flash
  const [isSyncing, setIsSyncing] = useState(() => {
    if (typeof window === "undefined") return true;
    return !RendimientoStore.isStoreSynced();
  });

  // On mobile/tablet (< 1024px or touch devices) the sidebar starts closed.
  // On desktop (≥ 1024px and mouse device) it starts open.
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    return window.innerWidth >= 1024 && !isTouch;
  });

  useEffect(() => {
    const update = () => {
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      setSidebarOpen(window.innerWidth >= 1024 && !isTouch);
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    let mounted = true;
    const safetyTimer = setTimeout(() => {
      if (mounted) setIsSyncing(false);
    }, 2000);

    if (!RendimientoStore.isStoreSynced()) {
      setIsSyncing(true);
      Promise.all([
        RendimientoStore.syncFromSupabase().catch((err) => console.warn("Rendimiento sync warning:", err)),
        TacticalStore.syncFromSupabase().catch((err) => console.warn("Tactical sync warning:", err))
      ]).finally(() => {
        if (mounted) {
          clearTimeout(safetyTimer);
          setIsSyncing(false);
          try { seedEjemploPaso5(); } catch {}
        }
      });
    } else {
      clearTimeout(safetyTimer);
      setIsSyncing(false);
    }

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  if (isSyncing) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-950 px-4 text-white">
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant animate-bounce">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Cargando Academia Deportiva
            </h2>
            <p className="text-xs text-slate-400 animate-pulse font-medium">
              Sincronizando entrenamientos, jugadores y finanzas en tiempo real...
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full relative overflow-hidden max-w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col min-w-0 max-w-full overflow-x-hidden">
          <AppTopbar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
            <Outlet />
          </main>
        </SidebarInset>
        <FloatAIButton />
        <ActiveStepFloatingWidget />
      </div>
    </SidebarProvider>
  );
}
