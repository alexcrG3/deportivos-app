import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { encargados, jugadores, getPlayerOS } from "@/lib/mock-data";
import { CarnetJugadorPremium } from "@/components/carnet/CarnetJugadorPremium";
import { Search, Phone, Mail, CreditCard, Shield, Sparkles, UserCheck, Heart, ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useRole } from "@/hooks/use-role";
import RendimientoStore from "@/lib/rendimiento-store";

export const Route = createFileRoute("/_app/encargados")({
  component: EncargadosPage,
});

function EncargadosPage() {
  const { role } = useRole();
  const isAdmin = role === "admin";

  const allPlayers = useMemo(() => RendimientoStore.getJugadores(), []);
  
  // Lista de deportistas / hijos a cargo para el padre o encargado
  // En demo/producción, selecciona a los hijos del encargado autenticado
  const misHijos = useMemo(() => {
    if (allPlayers.length >= 2) {
      return [allPlayers[0], allPlayers[1]]; // Mateo Rojas y Valeria Soto
    }
    return allPlayers.length > 0 ? [allPlayers[0]] : [jugadores[0]];
  }, [allPlayers]);

  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
  const [q, setQ] = useState("");

  // Target child selected
  const activeChild = misHijos[selectedChildIndex] || misHijos[0];
  const fullPlayerOS = useMemo(() => {
    return activeChild ? getPlayerOS(activeChild.id) : getPlayerOS("j-1");
  }, [activeChild]);

  // Lista general filtrada para administradores que necesiten buscar cualquier carnet
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter(
      (j) =>
        j.nombre.toLowerCase().includes(q.toLowerCase()) ||
        (j.identificacion && j.identificacion.includes(q)) ||
        (j.disciplina && j.disciplina.toLowerCase().includes(q.toLowerCase()))
    );
  }, [allPlayers, q]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* HEADER DE LA SECCIÓN DE CARNETS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              <Sparkles className="h-3 w-3 mr-1" /> Carnet Digital Atleta Pro Pass 2026
            </Badge>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] uppercase">
              Verificación Cancha 24/7
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mt-1">
            Carnet Digital & Licencia de Competencia
          </h1>
          <p className="text-xs text-slate-300">
            Acreditación oficial holográfica 3D, código de escaneo rápido y ficha médica de tus hijos a cargo.
          </p>
        </div>
      </div>

      {/* SELECTOR DE HIJOS (SI TIENE MÁS DE 1 HIJO) */}
      {misHijos.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs font-black uppercase text-slate-900 dark:text-slate-100">Mis Hijos Inscritos</p>
              <p className="text-[11px] text-slate-500">Selecciona el hijo para consultar o imprimir su carnet:</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {misHijos.map((hijo, idx) => (
              <button
                key={hijo.id || idx}
                onClick={() => setSelectedChildIndex(idx)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                  selectedChildIndex === idx
                    ? "bg-slate-900 text-amber-400 border-amber-400 ring-2 ring-amber-400/30 shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
                }`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={hijo.avatar} />
                  <AvatarFallback className="text-[10px] font-bold">{hijo.nombre[0]}</AvatarFallback>
                </Avatar>
                <span>{hijo.nombre}</span>
                <Badge className="bg-amber-400/20 text-amber-300 text-[9px] px-1.5 py-0 font-mono">
                  {hijo.categoria || "Sub-13"}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONTENEDOR DEL CARNET DE CADA HIJO */}
      {activeChild && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* VISTA DEL CARNET 3D HOLOGRÁFICO EN EL CENTRO */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <CarnetJugadorPremium
              jugador={{
                id: activeChild.id,
                nombre: activeChild.nombre,
                identificacion: activeChild.identificacion || "CR-98412",
                avatar: activeChild.avatar,
                disciplina: activeChild.disciplina || "Fútbol",
                categoria: activeChild.categoria || "Sub-13",
                edad: activeChild.edad || 12,
                posicion: activeChild.posicion || "Jugador de Campo",
                tipoSanguineo: fullPlayerOS.condicionesMedicas?.tipoSanguineo || "O+",
              }}
              equipo={activeChild.equipo || `${activeChild.disciplina || "Fútbol"} ${activeChild.categoria || "Oficial"}`}
              logoEquipo={fullPlayerOS.logoEquipo || undefined}
              numero={fullPlayerOS.numero || 10}
              entrenador={fullPlayerOS.entrenador || "Edgar Calderón"}
              estadoOp={fullPlayerOS.estadoOp || activeChild.estadoPago || "habilitado"}
              alergias={fullPlayerOS.alergias || []}
              medicamentos={fullPlayerOS.medicamentos || []}
              restriccionesMed={fullPlayerOS.restriccionesMed || []}
              contactosEmergencia={fullPlayerOS.contactosEmergencia || [
                { nombre: "Manuel Rodríguez", parentesco: "Padre de Familia", telefono: "+506 8888-9999" }
              ]}
              token={activeChild.token || activeChild.id}
            />
          </div>

          {/* FICHA RESUMEN Y ESTADO OPERATIVO DEL DEPORTISTA */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Card de Estado Oficial */}
            <Card className="shadow-card border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-amber-400">
                    <AvatarImage src={activeChild.avatar} />
                    <AvatarFallback className="text-base font-black">{activeChild.nombre[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-base font-black uppercase text-slate-900 dark:text-slate-100 leading-tight">
                      {activeChild.nombre}
                    </h3>
                    <p className="text-xs text-amber-500 font-bold">
                      {activeChild.disciplina || "Fútbol"} · {activeChild.categoria || "Categoría Oficial"}
                    </p>
                  </div>
                </div>

                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 font-bold uppercase text-[10px] px-2 py-1">
                  Habilitado
                </Badge>
              </div>

              {/* Grid de Atributos del Hijo */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Cédula / ID</p>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeChild.identificacion || "CR-1029-3849"}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Edad / Sede</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeChild.edad ? `${activeChild.edad} años` : "Sede Central"}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Dorsal Oficial</p>
                  <p className="font-bold text-amber-500 mt-0.5">#{fullPlayerOS.numero || 10}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Entrenador</p>
                  <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                    {fullPlayerOS.entrenador || "Edgar Calderón"}
                  </p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-amber-500 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4" /> Licencia DeportivOS Verified
                  </span>
                  <span className="font-mono text-[10px]">2026-OK</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Carnet válido para torneos nacionales, control de ingreso a cancha y atención médica de emergencia.
                </p>
              </div>
            </Card>

          </div>

        </div>
      )}

      {/* MODO ADMINISTRADOR: BUSCADOR DE CARNETS GENERAL DE LA ACADEMIA */}
      {isAdmin && (
        <Card className="shadow-card border-slate-200 dark:border-slate-800 rounded-3xl mt-8">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-500" /> Búsqueda General de Carnets (Modo Administrador)
            </CardTitle>
            <CardDescription className="text-xs">
              Busca cualquier deportista o encargado para generar o verificar su carnet oficial.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar deportista por nombre, cédula o disciplina..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            <div className="rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold text-xs">Deportista</TableHead>
                    <TableHead className="font-bold text-xs">Disciplina / Categoría</TableHead>
                    <TableHead className="font-bold text-xs">Identificación</TableHead>
                    <TableHead className="font-bold text-xs text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.slice(0, 5).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold text-xs">{p.nombre}</TableCell>
                      <TableCell className="text-xs">{p.disciplina} - {p.categoria}</TableCell>
                      <TableCell className="font-mono text-xs">{p.identificacion || "CR-9821"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const idx = misHijos.findIndex((h) => h.id === p.id);
                            if (idx >= 0) setSelectedChildIndex(idx);
                          }}
                          className="text-xs font-bold gap-1 rounded-xl"
                        >
                          Ver Carnet <ArrowRight className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
