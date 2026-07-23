import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exerciseLibrary, exerciseCategorias } from "@/lib/mock-data";
import { Search, Heart, Copy, Share2, Play, Clock, Users } from "lucide-react";
import { CoachOsBanner } from "@/components/coach-os-banner";

export const Route = createFileRoute("/_app/biblioteca")({ component: BibliotecaPage });

function BibliotecaPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [nivel, setNivel] = useState<string>("todos");

  const list = useMemo(() => exerciseLibrary.filter((e) => {
    if (q && !e.titulo.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat !== "todas" && e.categoria !== cat) return false;
    if (nivel !== "todos" && e.nivel !== nivel) return false;
    return true;
  }), [q, cat, nivel]);

  return (
    <div className="space-y-6">
      <CoachOsBanner />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Biblioteca de ejercicios</h1>
        <p className="text-sm text-muted-foreground">Recursos reutilizables clasificados por objetivo y nivel.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar ejercicios…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {exerciseCategorias.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={nivel} onValueChange={setNivel}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los niveles</SelectItem>
            <SelectItem value="Iniciación">Iniciación</SelectItem>
            <SelectItem value="Intermedio">Intermedio</SelectItem>
            <SelectItem value="Avanzado">Avanzado</SelectItem>
            <SelectItem value="Elite">Elite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((e) => (
          <Card key={e.id} className="overflow-hidden shadow-card transition-all hover:shadow-elegant hover:-translate-y-0.5">
            <div className="relative aspect-video bg-muted">
              <img src={e.thumb} alt={e.titulo} className="h-full w-full object-cover" loading="lazy" />
              <button className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur hover:bg-background">
                <Heart className={`h-4 w-4 ${e.favorito ? "fill-destructive text-destructive" : ""}`} />
              </button>
              <div className="absolute left-2 bottom-2 flex gap-1">
                <Badge className="bg-background/80 text-foreground backdrop-blur">{e.categoria}</Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-medium leading-tight">{e.titulo}</p>
                <p className="mt-1 text-xs text-muted-foreground">{e.disciplina} · {e.edad} · {e.nivel}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{e.duracion} min</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.jugadores}</span>
                <span>Dificultad {"●".repeat(e.dificultad)}</span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="flex-1"><Play className="mr-1 h-3 w-3" />Usar</Button>
                <Button size="sm" variant="ghost"><Copy className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost"><Share2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
