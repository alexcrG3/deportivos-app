import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, CheckCircle2, QrCode, ArrowRight } from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";
import { toast } from "sonner";

export const Route = createFileRoute("/inscripcion")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      orgId: (search.orgId as string) || undefined,
      role: (search.role as string) || undefined,
    };
  },
  component: PublicInscripcionPage,
});

function PublicInscripcionPage() {
  const search = Route.useSearch();
  const orgId = search.orgId;

  const orgs = useMemo(() => RendimientoStore.getOrganizaciones(), []);
  
  // Selected Organization
  const [selectedOrgId, setSelectedOrgId] = useState(() => {
    if (orgId && orgs.some(o => o.id === orgId)) {
      return orgId;
    }
    return orgs[0]?.id || "";
  });

  const currentOrg = useMemo(() => {
    return orgs.find(o => o.id === selectedOrgId);
  }, [orgs, selectedOrgId]);

  // Form states
  const [nombre, setNombre] = useState("");
  const [identificacion, setIdentificacion] = useState("");
  const [genero, setGenero] = useState("Masculino");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [encargado, setEncargado] = useState("");
  const [parentesco, setParentesco] = useState("Padre");
  const [telefonoEncargado, setTelefonoEncargado] = useState("");
  const [correoEncargado, setCorreoEncargado] = useState("");

  // Teams of the active organization
  const teams = useMemo(() => {
    const previousOrgId = RendimientoStore.getActiveOrganizacionId();
    RendimientoStore.setActiveOrganizacionId(selectedOrgId);
    const list = RendimientoStore.getEquipos();
    RendimientoStore.setActiveOrganizacionId(previousOrgId);
    return list;
  }, [selectedOrgId]);

  const [selectedTeamId, setSelectedTeamId] = useState("");

  const selectedTeam = useMemo(() => {
    return teams.find(t => t.id === selectedTeamId) || teams[0];
  }, [teams, selectedTeamId]);

  // Submission success screen
  const [submitted, setSubmitted] = useState(false);
  const [newPlayer, setNewPlayer] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !identificacion || !fechaNacimiento || !correo || !telefono) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const previousOrgId = RendimientoStore.getActiveOrganizacionId();
    RendimientoStore.setActiveOrganizacionId(selectedOrgId);

    const player = RendimientoStore.addJugador({
      nombre,
      identificacion,
      fechaNacimiento,
      genero,
      disciplina: selectedTeam?.disciplina || "Multideporte",
      categoria: selectedTeam?.nombre || "General",
      sedeId: "s1",
      sede: "Sede Central",
      correo,
      telefono,
      encargado,
      parentesco,
      telefonoEncargado,
      correoEncargado,
      posicion: "General",
      numero: 0,
      estadoPago: "al_dia",
      saldo: 0,
    } as any);

    RendimientoStore.setActiveOrganizacionId(previousOrgId);
    setNewPlayer(player);
    setSubmitted(true);
    toast.success("¡Inscripción registrada con éxito!");
  };

  if (submitted && newPlayer) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-8 text-white">
        <Card className="max-w-md w-full bg-slate-955 border-emerald-500/20 shadow-xl overflow-hidden relative text-center p-6 space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-8 w-8 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">¡Inscripción Completada!</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Te damos la bienvenida a <strong>{currentOrg?.nombre}</strong>. Tu registro ha sido procesado exitosamente en nuestra plataforma de administración.
            </p>
          </div>

          {/* Ticket / Credential Card */}
          <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-4 text-left space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <div className="h-9 w-9 bg-gradient-primary rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                {currentOrg?.logo ? (
                  <img src={currentOrg.logo} className="h-full w-full object-cover" alt="Logo" />
                ) : (
                  <Trophy className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{newPlayer.nombre}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{newPlayer.categoria} · {newPlayer.disciplina}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Identificación</p>
                <p className="font-semibold text-slate-300">{newPlayer.identificacion}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Código QR</p>
                <p className="font-semibold text-slate-300 font-mono">{newPlayer.qr}</p>
              </div>
            </div>

            {/* QR Scanner Mockup */}
            <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 bg-slate-950 p-4 rounded-xl gap-2 mt-2">
              <QrCode className="h-28 w-28 text-slate-300 animate-pulse" />
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Pase de Entrada QR</span>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              onClick={() => {
                setSubmitted(false);
                setNombre("");
                setIdentificacion("");
                setFechaNacimiento("");
                setCorreo("");
                setTelefono("");
                setEncargado("");
                setTelefonoEncargado("");
                setCorreoEncargado("");
              }}
              className="w-full bg-gradient-primary font-bold text-xs h-10"
            >
              Registrar otra inscripción
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      {/* Top navbar */}
      <header className="border-b border-slate-900 bg-slate-955 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-elegant border border-white/10">
            {currentOrg?.logo ? (
              <img src={currentOrg.logo} className="h-full w-full object-cover" alt="Logo de la Academia" />
            ) : (
              <Trophy className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white">{currentOrg?.nombre || "Inscripción en Línea"}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admisiones e Inscripción</p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">DeportivOS</span>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* If no orgId in query params, show selector */}
        {!orgId && (
          <Card className="bg-slate-900 border-slate-800 text-white p-4 shadow-card">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Selecciona tu Academia Deportiva</Label>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-800 bg-slate-950 text-sm text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id} className="text-slate-900 bg-white">
                    {o.nombre} ({o.pais})
                  </option>
                ))}
              </select>
            </div>
          </Card>
        )}

        <Card className="bg-slate-900 border-slate-800 text-white shadow-card overflow-hidden">
          <CardHeader className="border-b border-slate-800 p-6">
            <CardTitle className="text-lg font-bold">Ficha de Admisión Deportiva</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Registra los datos del deportista para solicitar el ingreso a los entrenamientos.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Atleta */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-slate-800 pb-1">
                  1. Información del Deportista
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nombre Completo *</Label>
                    <Input 
                      placeholder="Ej. Mateo Rojas" 
                      value={nombre} 
                      onChange={e => setNombre(e.target.value)} 
                      required 
                      className="bg-slate-955 border-slate-800 focus:border-primary text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Cédula / Identificación *</Label>
                    <Input 
                      placeholder="Ej. 1-1234-5678" 
                      value={identificacion} 
                      onChange={e => setIdentificacion(e.target.value)} 
                      required 
                      className="bg-slate-955 border-slate-800 focus:border-primary text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Fecha de Nacimiento *</Label>
                    <Input 
                      type="date" 
                      value={fechaNacimiento} 
                      onChange={e => setFechaNacimiento(e.target.value)} 
                      required 
                      className="bg-slate-955 border-slate-800 focus:border-primary text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Género</Label>
                    <select
                      value={genero}
                      onChange={e => setGenero(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-slate-800 bg-slate-955 text-xs text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Masculino" className="text-slate-900 bg-white">Masculino</option>
                      <option value="Femenino" className="text-slate-900 bg-white">Femenino</option>
                      <option value="Otro" className="text-slate-900 bg-white">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Correo de Contacto *</Label>
                    <Input 
                      type="email" 
                      placeholder="Ej. mateo@mail.com" 
                      value={correo} 
                      onChange={e => setCorreo(e.target.value)} 
                      required 
                      className="bg-slate-955 border-slate-800 focus:border-primary text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Teléfono *</Label>
                    <Input 
                      placeholder="Ej. +50688889999" 
                      value={telefono} 
                      onChange={e => setTelefono(e.target.value)} 
                      required 
                      className="bg-slate-955 border-slate-800 focus:border-primary text-white text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Equipo / Disciplina */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-slate-800 pb-1">
                  2. Selección de Equipo y Horario
                </h3>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Equipo / Categoría Disponibles *</Label>
                  {teams.length === 0 ? (
                    <div className="p-3 bg-slate-955 rounded-xl border border-slate-800 text-xs text-slate-500">
                      No hay equipos registrados en esta academia actualmente. Contacta al administrador.
                    </div>
                  ) : (
                    <select
                      value={selectedTeamId}
                      onChange={e => setSelectedTeamId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-slate-800 bg-slate-955 text-xs text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="" className="text-slate-900 bg-white">-- Selecciona un equipo --</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id} className="text-slate-900 bg-white">
                          {t.nombre} ({t.disciplina} - {t.horario || "Sin horario"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Section 3: Padres */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-slate-800 pb-1">
                  3. Datos del Encargado / Responsable (Menores de edad)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nombre del Encargado</Label>
                    <Input 
                      placeholder="Ej. Sofía Méndez" 
                      value={encargado} 
                      onChange={e => setEncargado(e.target.value)} 
                      className="bg-slate-955 border-slate-800 focus:border-primary text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Parentesco</Label>
                    <select
                      value={parentesco}
                      onChange={e => setParentesco(e.target.value)}
                      className="w-full h-9 px-3 rounded-md border border-slate-800 bg-slate-955 text-xs text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Padre" className="text-slate-900 bg-white">Padre</option>
                      <option value="Madre" className="text-slate-900 bg-white">Madre</option>
                      <option value="Tutor" className="text-slate-900 bg-white">Tutor / Legal</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Teléfono del Encargado</Label>
                    <Input 
                      placeholder="Ej. +50677778888" 
                      value={telefonoEncargado} 
                      onChange={e => setTelefonoEncargado(e.target.value)} 
                      className="bg-slate-955 border-slate-800 focus:border-primary text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Correo del Encargado</Label>
                    <Input 
                      type="email" 
                      placeholder="Ej. sofia.m@mail.com" 
                      value={correoEncargado} 
                      onChange={e => setCorreoEncargado(e.target.value)} 
                      className="bg-slate-955 border-slate-800 focus:border-primary text-white text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <Button 
                  type="submit" 
                  className="bg-gradient-primary px-8 shadow-elegant font-bold text-xs h-10"
                  disabled={teams.length === 0 || !selectedTeamId}
                >
                  Confirmar Inscripción <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-slate-900 text-[10px] text-slate-500 uppercase tracking-widest">
        ⚡ Impulsado por DeportivOS — Gestión Deportiva Inteligente
      </footer>
    </div>
  );
}
