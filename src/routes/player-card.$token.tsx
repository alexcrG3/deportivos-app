import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { getPlayerOSByToken } from "@/lib/mock-data";
import { CarnetJugadorPremium } from "@/components/carnet/CarnetJugadorPremium";

export const Route = createFileRoute("/player-card/$token")({
  component: PublicPlayerCard,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="text-center space-y-2">
        <Shield className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="text-lg font-bold">Carnet Digital No Válido</p>
        <p className="text-sm text-muted-foreground">El token proporcionado no corresponde a ningún atleta registrado.</p>
      </div>
    </div>
  ),
});

function PublicPlayerCard() {
  const { token } = Route.useParams();
  const data = getPlayerOSByToken(token);
  if (!data) throw notFound();

  const {
    jugador: j,
    estadoOp,
    numero,
    equipo,
    entrenador,
    alergias,
    medicamentos,
    restriccionesMed,
    contactosEmergencia,
    stats,
  } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8 flex flex-col items-center justify-center space-y-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 w-full max-w-lg px-2">
        <span className="flex items-center gap-1.5 font-bold tracking-widest uppercase text-amber-400">
          <Shield className="h-4 w-4 text-amber-400" />
          ATHLETIX OS · VERIFIED PASS
        </span>
        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
          {token.slice(0, 12).toUpperCase()}
        </span>
      </div>

      {/* Componente Maestro del Carnet Premium */}
      <CarnetJugadorPremium
        jugador={{
          id: j.id,
          nombre: j.nombre,
          identificacion: j.identificacion,
          avatar: j.avatar,
          disciplina: j.disciplina,
          categoria: j.categoria,
          sede: j.sede,
          edad: j.edad,
          posicion: j.posicionPrincipal || "Jugador de Campo",
          saldo: j.saldo,
        }}
        equipo={equipo}
        numero={numero}
        entrenador={entrenador}
        estadoOp={estadoOp}
        alergias={alergias}
        medicamentos={medicamentos}
        restriccionesMed={restriccionesMed}
        contactosEmergencia={contactosEmergencia}
        token={token}
        asistenciaPct={stats?.asistenciaPct || 95}
      />

      <div className="text-center pt-2">
        <Link
          to="/jugadores/$id"
          params={{ id: j.id }}
          className="text-xs text-slate-400 hover:text-amber-400 transition-colors underline font-medium"
        >
          Ver Perfil Player OS Completo
        </Link>
        <p className="text-[10px] text-slate-400 font-mono mt-1">
          TOKEN AUTENTICADO · ATHLETIX OS PRO 2026
        </p>
      </div>
    </div>
  );
}
