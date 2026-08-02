import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, Sparkles, Trophy, ChevronDown } from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";

interface AcademyHeaderBannerProps {
  subtitle?: string;
  badgeText?: string;
}

export function AcademyHeaderBanner({
  subtitle = "PANEL DE GESTIÓN EMPRESARIAL & ALTO RENDIMIENTO",
  badgeText = "ACADEMIA ACTIVA",
}: AcademyHeaderBannerProps) {
  const { role } = useRole();
  const isSuperAdmin = typeof window !== "undefined" && localStorage.getItem("is_superadmin") === "true";
  const activeOrgId = RendimientoStore.getActiveOrganizacionId();
  const orgs = useMemo(() => RendimientoStore.getOrganizaciones(), []);

  const handleOrgChange = (id: string) => {
    RendimientoStore.setActiveOrganizacionId(id);
    window.location.reload();
  };

  const activeOrg = useMemo(() => {
    return orgs.find((o: any) => o.id === activeOrgId) || orgs[0];
  }, [orgs, activeOrgId]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl border border-slate-800/80 mb-6 p-5 md:p-7 transition-all duration-300">
      {/* Dynamic Background Effects */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #38bdf8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-sky-500/20 to-orange-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Side: Academy Logo & Info */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Academy Logo Box */}
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-500 to-amber-500 opacity-40 blur transition duration-300 group-hover:opacity-75" />
            <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center overflow-hidden shadow-inner p-1.5">
              {activeOrg && activeOrg.logo ? (
                <img 
                  src={activeOrg.logo} 
                  alt={activeOrg.nombre} 
                  className="h-full w-full object-contain rounded-xl"
                />
              ) : (
                <div className="h-full w-full rounded-xl bg-gradient-to-br from-sky-600 to-blue-800 flex items-center justify-center text-white">
                  <Trophy className="h-8 w-8 text-amber-300" />
                </div>
              )}
            </div>
          </div>

          {/* Academy Name & Subtitle */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-sky-400" />
                {badgeText}
              </Badge>
              <span className="text-slate-400 text-xs font-semibold hidden sm:inline-block">
                • {activeOrg?.deporte || "Multideporte"}
              </span>
            </div>

            {isSuperAdmin ? (
              <div className="relative group mt-1">
                <select
                  value={activeOrgId}
                  onChange={(e) => handleOrgChange(e.target.value)}
                  className="appearance-none bg-slate-900/90 text-xl md:text-3xl font-black tracking-tight text-white pr-9 pl-1 py-0.5 rounded-lg border border-slate-700/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all hover:border-sky-400"
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-white text-base">
                      {o.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
              </div>
            ) : (
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase drop-shadow-sm">
                {activeOrg?.nombre || "Cargando Academia..."}
              </h1>
            )}

            <p className="text-xs md:text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Stats / Operational Status */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-end border-t border-slate-800/80 md:border-t-0 pt-3 md:pt-0">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Sedes</span>
            <span className="text-base font-black text-sky-400">
              {activeOrg?.sedes ? activeOrg.sedes.length : 1} Sede(s)
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Estado OS</span>
            <span className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
              ACTIVO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
