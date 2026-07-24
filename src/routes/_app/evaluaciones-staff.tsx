import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, UserCheck, Award, Save, ShieldCheck, CheckCircle2 } from "lucide-react";
import RendimientoStore from "@/lib/rendimiento-store";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/evaluaciones-staff")({ component: EvaluacionesStaffPage });

const criteriosStaff = [
  { key: "puntualidad", label: "Puntualidad & Asistencia" },
  { key: "metodologia", label: "Metodología de Entrenamiento" },
  { key: "manejoGrupo", label: "Manejo & Liderazgo de Grupo" },
  { key: "cumplimiento", label: "Cumplimiento de Objetivos" },
  { key: "comunicacion", label: "Comunicación con Padres & Club" },
] as const;

function EvaluacionesStaffPage() {
  const [coachesList, setCoachesList] = useState<any[]>([]);
  const [evalsMap, setEvalsMap] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const orgId = RendimientoStore.getActiveOrganizacionId();
    const coaches = RendimientoStore.getEntrenadores();
    setCoachesList(coaches);

    // Fetch staff evaluations from DB
    const { data: dbEvals } = await supabase
      .from("evaluaciones_staff")
      .select("*")
      .eq("organizacion_id", orgId);

    const initialMap: Record<string, Record<string, number>> = {};
    for (const c of coaches) {
      const existing = (dbEvals || []).find((e: any) => e.entrenador_id === c.id);
      initialMap[c.id] = existing?.criterios || {
        puntualidad: 5,
        metodologia: 4,
        manejoGrupo: 5,
        cumplimiento: 4,
        comunicacion: 5,
      };
    }
    setEvalsMap(initialMap);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScoreChange = (coachId: string, key: string, val: number) => {
    setEvalsMap((prev) => ({
      ...prev,
      [coachId]: {
        ...(prev[coachId] || {}),
        [key]: val,
      },
    }));
  };

  const handleSaveStaffEvals = async () => {
    setSaving(true);
    const orgId = RendimientoStore.getActiveOrganizacionId();

    try {
      const inserts = coachesList.map((c) => ({
        entrenador_id: c.id,
        nombre: c.nombre,
        cargo: c.cargo || "Director Técnico",
        criterios: evalsMap[c.id] || {},
        organizacion_id: orgId,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from("evaluaciones_staff").upsert(inserts, { onConflict: "entrenador_id" });
      toast.success("Evaluaciones de Desempeño del Staff guardadas con éxito ✓");
    } catch (e: any) {
      toast.error("Error al guardar evaluación del staff: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER DE MÓDULO */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[10px] uppercase mb-1">
            Gobernanza de Recursos Humanos & Staff
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            👔 Evaluación de Desempeño del Staff
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Matriz de auditoría cualitativa y desempeño profesional para entrenadores y preparadores físicos.
          </p>
        </div>

        <Button
          onClick={handleSaveStaffEvals}
          disabled={saving}
          className="bg-gradient-primary text-white font-extrabold gap-2 shadow-elegant rounded-xl"
        >
          <Save className="h-4 w-4" /> {saving ? "Guardando..." : "✓ GUARDAR EVALUACIONES DE STAFF"}
        </Button>
      </div>

      {/* GRID DE ENTRENADORES Y CRITERIOS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coachesList.map((coach) => {
          const scores = evalsMap[coach.id] || {};
          const totalScore = Object.values(scores).reduce((acc, curr) => acc + curr, 0);
          const avgScore = (totalScore / (criteriosStaff.length || 1)).toFixed(1);

          return (
            <Card key={coach.id} className="shadow-card border bg-card">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 border-2 border-primary/20">
                    <AvatarImage src={coach.avatar} />
                    <AvatarFallback>{coach.nombre[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">{coach.nombre}</CardTitle>
                    <CardDescription className="text-xs">{coach.especialidad || "Entrenador Formativo"}</CardDescription>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between bg-primary/5 p-2 rounded-xl border border-primary/10">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Promedio Desempeño</span>
                  <Badge className="bg-primary text-white font-mono font-bold text-xs">
                    ⭐ {avgScore} / 5.0
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {criteriosStaff.map((crit) => {
                  const currentVal = scores[crit.key] || 5;
                  return (
                    <div key={crit.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-foreground">
                        <span>{crit.label}</span>
                        <span className="text-primary font-mono">{currentVal} ★</span>
                      </div>

                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleScoreChange(coach.id, crit.key, star)}
                            className={`flex-1 h-7 rounded-lg text-xs font-bold transition ${
                              star <= currentVal
                                ? "bg-amber-500 text-white shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            ★ {star}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default EvaluacionesStaffPage;
