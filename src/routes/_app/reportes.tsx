import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { asistenciaMensual, crecimientoJugadores, disciplinas } from "@/lib/mock-data";
import { Download, FileSpreadsheet, FileText, BarChart3, Users, CalendarCheck, MapPinned, Activity, Swords, BookOpen, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reportes")({ component: ReportesPage });

const reportes = [
  { icon: CalendarCheck, label: "Asistencia general", desc: "Detalle de asistencia por categoría y sede", color: "success" },
  { icon: Users, label: "Jugadores activos", desc: "Listado completo con filtros avanzados", color: "primary" },
  { icon: BarChart3, label: "Ocupación de categorías", desc: "Análisis de cupos y capacidad", color: "warning" },
  { icon: Activity, label: "Rendimiento operativo", desc: "Métricas globales del mes", color: "primary" },
  { icon: MapPinned, label: "Uso de instalaciones", desc: "Reservas y ocupación por espacio", color: "success" },
  { icon: Users, label: "Entrenadores", desc: "Carga horaria y categorías asignadas", color: "warning" },
  { icon: CalendarCheck, label: "Planificación semanal", desc: "Cronograma de entrenamientos y microciclos", color: "primary" },
  { icon: Swords, label: "Preparación del rival", desc: "Reportes scouter de rivales e inteligencia", color: "warning" },
  { icon: FileText, label: "Informe postpartido", desc: "Estadísticas, participación y consejos de IA", color: "success" },
  { icon: BookOpen, label: "Biblioteca táctica", desc: "Listado de ejercicios, jugadas y plantillas", color: "primary" },
];

const COLORS = ["var(--color-primary)", "var(--color-success)", "var(--color-warning)", "var(--color-chart-5)", "var(--color-destructive)"];

function ReportesPage() {
  const pieData = disciplinas.slice(0, 5).map((d) => ({ name: d.nombre, value: d.activos }));

  // Exporting loading states
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [activeReportDownload, setActiveReportDownload] = useState<string | null>(null);

  const handleExportExcelAll = () => {
    setExportingExcel(true);
    toast.loading("Compilando base de datos consolidada...", { id: "export-excel" });
    
    setTimeout(() => {
      setExportingExcel(false);
      toast.success("¡Base de datos exportada! Descargando 'Consolidado_Deportivo_DeportivOS.xlsx'...", { id: "export-excel" });
    }, 1500);
  };

  const handleExportPdfAll = () => {
    setExportingPdf(true);
    toast.loading("Generando informe consolidado en PDF...", { id: "export-pdf" });
    
    setTimeout(() => {
      setExportingPdf(false);
      toast.success("¡Documento PDF listo! Descargando 'Reporte_Global_DeportivOS.pdf'...", { id: "export-pdf" });
    }, 1500);
  };

  const handleDownloadSingleReport = (reportLabel: string) => {
    setActiveReportDownload(reportLabel);
    toast.loading(`Generando reporte de ${reportLabel}...`, { id: "single-report" });
    
    setTimeout(() => {
      setActiveReportDownload(null);
      const sanitizedFilename = reportLabel.toLowerCase().replace(/ /g, "_");
      toast.success(`¡Reporte generado! Descargando '${sanitizedFilename}_deportivos.xlsx'...`, { id: "single-report" });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reportes deportivos</h1>
          <p className="text-sm text-muted-foreground">Genera reportes operativos y exporta en PDF o Excel.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportExcelAll} 
            disabled={exportingExcel || exportingPdf}
            className="border-border"
          >
            {exportingExcel ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-1 text-emerald-600" />
            )}
            {exportingExcel ? "Exportando..." : "Exportar Excel"}
          </Button>
          <Button 
            onClick={handleExportPdfAll} 
            disabled={exportingExcel || exportingPdf}
            className="bg-gradient-primary text-white shadow-elegant"
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-1" />
            )}
            {exportingPdf ? "Generando..." : "Exportar PDF"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportes.map((r) => {
          const isDownloadingThis = activeReportDownload === r.label;
          return (
            <Card 
              key={r.label} 
              onClick={() => !activeReportDownload && handleDownloadSingleReport(r.label)}
              className="shadow-card hover:shadow-elegant transition cursor-pointer group bg-card border-border relative overflow-hidden"
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div 
                  className={`flex h-11 w-11 items-center justify-center rounded-lg bg-${r.color}/15 text-${r.color} shrink-0`} 
                  style={{ 
                    background: `color-mix(in oklab, var(--color-${r.color}) 15%, transparent)`, 
                    color: `var(--color-${r.color})` 
                  }}
                >
                  <r.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
                <div className="shrink-0 pt-0.5">
                  {isDownloadingThis ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition duration-150" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground font-bold">Crecimiento de jugadores</CardTitle>
            <CardDescription className="text-muted-foreground">Tendencia de los últimos 7 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crecimientoJugadores} margin={{ left: -10, right: 5, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Bar dataKey="jugadores" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground font-bold">Distribución por disciplina</CardTitle>
            <CardDescription className="text-muted-foreground">Top 5 disciplinas</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {pieData.map((d, i) => (
                <Badge key={d.name} variant="outline" className="text-[10px] border-border text-foreground font-semibold">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: COLORS[i] }} />
                  {d.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ReportesPage;
