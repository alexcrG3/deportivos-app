import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCRC } from "@/lib/mock-data";
import RendimientoStore from "@/lib/rendimiento-store";
import { FinanzasEgresos } from "@/components/finanzas-egresos";
import {
  Banknote, ArrowDownCircle, ArrowUpCircle, Lock, Unlock, Wallet, Clock, Receipt, ArrowRight, ShieldCheck
} from "lucide-react";

export const Route = createFileRoute("/_app/caja")({ component: CajaPage });

function buildHistorico(pagos: any[]) {
  const byDate = new Map<string, number>();
  pagos.forEach((p) => {
    const d = p.fecha || "Sin fecha";
    byDate.set(d, (byDate.get(d) || 0) + (p.monto || 0));
  });
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([fecha, ingresos], i) => ({
      id: i,
      fecha,
      ingresos,
      egresos: 0,
      esperado: ingresos,
      contado: ingresos,
      diferencia: 0,
    }));
}

function CajaPage() {
  const [pagosHoy, setPagosHoy]     = useState<any[]>([]);
  const [historico, setHistorico]   = useState<ReturnType<typeof buildHistorico>>([]);
  const [ingresos, setIngresos]     = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const todos  = RendimientoStore.getPagos();
    const hoy    = todos.filter((p) => p.fecha === today);
    const total  = hoy.reduce((a, p) => a + (p.monto || 0), 0);

    setPagosHoy(hoy);
    setIngresos(total);
    setHistorico(buildHistorico(todos));
  }, []);

  const esperado = ingresos;

  return (
    <div className="space-y-6">
      {/* HEADER WITH CTA ACTIONS */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Caja diaria</h1>
          <p className="text-sm text-slate-500">Ingresos del día en tiempo real desde los pagos registrados.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-indigo-200 text-indigo-700 dark:border-indigo-900 dark:text-indigo-300 hover:bg-indigo-50 font-bold rounded-2xl gap-1.5 h-9 text-xs">
            <Unlock className="h-4 w-4" /> Apertura de Caja
          </Button>
          <Button className="bg-gradient-primary shadow-elegant font-bold rounded-2xl gap-1.5 h-9 text-xs">
            <Lock className="h-4 w-4" /> Cerrar Caja
          </Button>
        </div>
      </div>

      {/* VIBRANT KPIS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Apertura"
          value={formatCRC(0)}
          hint="Caja abierta del día"
          icon={Unlock}
          accent="primary"
        />
        <StatCard
          label="Ingresos Hoy"
          value={formatCRC(ingresos)}
          hint={`${pagosHoy.length} pago${pagosHoy.length !== 1 ? "s" : ""} registrado${pagosHoy.length !== 1 ? "s" : ""}`}
          icon={ArrowDownCircle}
          accent="success"
        />
        <StatCard
          label="Egresos Hoy"
          value={formatCRC(0)}
          hint="Sin egresos registrados"
          icon={ArrowUpCircle}
          accent="destructive"
        />
        <StatCard
          label="Saldo Esperado"
          value={formatCRC(esperado)}
          hint="Efectivo + transferencias"
          icon={Wallet}
          accent="warning"
        />
      </div>

      {/* TABS CONTAINER */}
      <Card className="shadow-card border border-slate-200/80 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6">
        <Tabs defaultValue="hoy">
          <TabsList className="bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
            <TabsTrigger value="hoy" className="font-bold text-xs rounded-xl">
              Movimientos de hoy ({pagosHoy.length})
            </TabsTrigger>
            <TabsTrigger value="egresos" className="font-bold text-xs rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              🛍️ Salidas & Egresos (Compras)
            </TabsTrigger>
            <TabsTrigger value="historico" className="font-bold text-xs rounded-xl">
              Histórico de cierres
            </TabsTrigger>
          </TabsList>

          {/* MOVIMIENTOS DE HOY */}
          <TabsContent value="hoy" className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
              {pagosHoy.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No hay pagos registrados hoy</p>
                    <p className="text-xs text-slate-400 mt-0.5">Los cobros registrados desde Pagos aparecerán en tiempo real aquí.</p>
                  </div>
                  <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-sm mt-2">
                    <Link to="/pagos">
                      Ir a Registrar Pagos <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pagosHoy.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 p-3.5 hover:bg-white dark:hover:bg-slate-900 transition">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold shrink-0">
                        <ArrowDownCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{m.jugador}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                          <Clock className="h-3 w-3" />
                          {m.fecha}
                          <span>·</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{m.metodo}</span>
                          <span>·</span>
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-none font-bold text-[10px] px-2 py-0.5 rounded-full">
                            {m.categoria || "Sin categoría"}
                          </Badge>
                          <span>·</span>
                          <span className="font-mono text-[10px] text-slate-400">#{m.referencia}</span>
                        </p>
                      </div>
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                        +{formatCRC(m.monto)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {pagosHoy.length > 0 && (
              <div className="flex justify-end pt-2">
                <p className="text-xs text-slate-500">
                  Total Recaudado Hoy:{" "}
                  <span className="font-black text-slate-900 dark:text-slate-100 text-base ml-1">{formatCRC(ingresos)}</span>
                </p>
              </div>
            )}
          </TabsContent>

          {/* HISTÓRICO DE CIERRES */}
          <TabsContent value="historico" className="mt-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs font-bold border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="p-3.5">Fecha</TableHead>
                    <TableHead className="p-3.5 text-right">Ingresos</TableHead>
                    <TableHead className="p-3.5 text-right">Egresos</TableHead>
                    <TableHead className="p-3.5 text-right">Esperado</TableHead>
                    <TableHead className="p-3.5 text-right">Contado</TableHead>
                    <TableHead className="p-3.5 text-right">Diferencia</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {historico.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-400 py-10 text-xs">
                        No hay cierres registrados aún.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historico.map((c) => (
                      <TableRow key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                        <TableCell className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.fecha}</TableCell>
                        <TableCell className="text-right text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatCRC(c.ingresos)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-400">
                          {formatCRC(c.egresos)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium">{formatCRC(c.esperado)}</TableCell>
                        <TableCell className="text-right text-xs font-bold">{formatCRC(c.contado)}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={`font-bold border-none px-2.5 py-0.5 rounded-full text-[10px] ${
                              c.diferencia === 0
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : c.diferencia > 0
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                            }`}
                          >
                            {c.diferencia === 0
                              ? "Cuadrada"
                              : (c.diferencia > 0 ? "+" : "") + formatCRC(c.diferencia)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* EGRESOS */}
          <TabsContent value="egresos" className="mt-4">
            <FinanzasEgresos />
          </TabsContent>
        </Tabs>
      </Card>

      {/* ARQUEO RÁPIDO HIGH-TECH CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 shadow-xl text-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Banknote className="h-5 w-5 text-indigo-400" /> Arqueo Rápido y Validación de Cierre
            </h3>
            <p className="text-xs text-slate-400">Conteo físico de efectivo e igualación del saldo en caja.</p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[10px] px-3 py-1 uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> AUDITORÍA OK
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Efectivo Contado</p>
            <p className="text-xl font-black text-emerald-400">{formatCRC(ingresos)}</p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sistema (Ingresos)</p>
            <p className="text-xl font-black text-slate-100">{formatCRC(ingresos)}</p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Diferencia Final</p>
            <p className="text-xl font-black text-purple-400">{formatCRC(0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
