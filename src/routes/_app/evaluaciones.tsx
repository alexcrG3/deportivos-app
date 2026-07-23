import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import RendimientoStore from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import { CoachOsBanner } from "@/components/coach-os-banner";

export const Route = createFileRoute("/_app/evaluaciones")({ component: EvaluacionesPage });

const criterios = [
  { key: "actitud", label: "Actitud" },
  { key: "esfuerzo", label: "Esfuerzo" },
  { key: "tecnica", label: "Técnica" },
  { key: "tactica", label: "Táctica" },
  { key: "disciplina", label: "Disciplina" },
  { key: "liderazgo", label: "Liderazgo" },
] as const;

function EvaluacionesPage() {
  const { role, coachName, selectedCoachId, selectedCoachName } = useRole();
  const [evals, setEvals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const effectiveCoachName = role === "admin" && selectedCoachName ? selectedCoachName : coachName;

  const loadEvaluaciones = async () => {
    setLoading(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();

    // Load players, optionally filtered by coach's teams
    const allPlayers = RendimientoStore.getJugadores();
    let relevantPlayers = allPlayers;

    if (effectiveCoachName) {
      const coachTeams = RendimientoStore.getEquipos()
        .filter((e: any) => e.entrenador === effectiveCoachName);
      if (coachTeams.length > 0) {
        const cats = coachTeams.map((t: any) => (t.categoria || t.nombre || "").toLowerCase());
        relevantPlayers = allPlayers.filter(p => {
          const pCat = (p.categoria || "").toLowerCase();
          return cats.some(c => pCat.includes(c) || c.includes(pCat));
        });
      } else {
        // If coach has no teams, they have no players to evaluate
        relevantPlayers = [];
      }
    }

    // Fetch existing evaluations from DB
    const { data: dbEvals } = await supabase
      .from("evaluaciones_rapidas")
      .select("*")
      .eq("organizacion_id", orgId);

    const evalMap = new Map((dbEvals || []).map((e: any) => [e.jugador_id, e]));

    // Merge: show all relevant players, pre-fill DB scores if they exist
    const merged = relevantPlayers.map(p => {
      const existing = evalMap.get(p.id);
      return {
        jugadorId: p.id,
        jugador: p.nombre,
        avatar: p.avatar || "",
        actitud: existing?.actitud ?? 0,
        esfuerzo: existing?.esfuerzo ?? 0,
        tecnica: existing?.tecnica ?? 0,
        tactica: existing?.tactica ?? 0,
        disciplina: existing?.disciplina ?? 0,
        liderazgo: existing?.liderazgo ?? 0,
      };
    });

    setEvals(merged);
    setLoading(false);
  };

  useEffect(() => {
    loadEvaluaciones();
  }, [selectedCoachId, selectedCoachName, role]);

  const setScore = (jid: string, key: string, val: number) => {
    setEvals(prev => prev.map(e => e.jugadorId === jid ? { ...e, [key]: val } : e));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const rows = evals.map(e => ({
      jugador_id: e.jugadorId,
      jugador: e.jugador,
      avatar: e.avatar,
      actitud: e.actitud,
      esfuerzo: e.esfuerzo,
      tecnica: e.tecnica,
      tactica: e.tactica,
      disciplina: e.disciplina,
      liderazgo: e.liderazgo,
      organizacion_id: orgId,
    }));

    const { error } = await supabase.from("evaluaciones_rapidas").upsert(rows, { onConflict: "jugador_id" });
    setSaving(false);
    if (error) {
      toast.error("Error al guardar evaluaciones: " + error.message);
    } else {
      toast.success("¡Evaluaciones guardadas en la nube correctamente!");
    }
  };

  return (
    <div className="space-y-6">
      <CoachOsBanner />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Evaluaciones rápidas</h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin" && selectedCoachName
              ? `Evaluaciones de jugadores de ${selectedCoachName}`
              : "Post-entrenamiento — escala 1-5 por criterio."}
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          Guardar todas
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando evaluaciones...
        </div>
      ) : evals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {role === "admin" && !selectedCoachName
            ? "Selecciona un entrenador en el menú lateral para ver sus evaluaciones."
            : "No hay jugadores para evaluar."}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Evaluación de jugadores</CardTitle>
            <CardDescription>
              {effectiveCoachName ? `Entrenador: ${effectiveCoachName}` : "Escala 1-5 por criterio"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-2 text-left">Jugador</th>
                    {criterios.map((c) => <th key={c.key} className="p-2 text-center">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {evals.map((e) => (
                    <tr key={e.jugadorId} className="border-b hover:bg-muted/40">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={e.avatar} />
                            <AvatarFallback>{e.jugador?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="truncate font-medium">{e.jugador}</span>
                        </div>
                      </td>
                      {criterios.map((c) => {
                        const val = e[c.key] as number;
                        return (
                          <td key={c.key} className="p-2">
                            <div className="flex items-center justify-center gap-0.5">
                              {[1, 2, 3, 4].map((n) => (
                                <button key={n} onClick={() => setScore(e.jugadorId, c.key, n)} title={`Nivel ${n}`}>
                                  <Star className={`h-4 w-4 ${n <= val ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
                                </button>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
