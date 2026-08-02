import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { asistenciaMensual, crecimientoJugadores, disciplinas } from "@/lib/mock-data";
import { Download, FileSpreadsheet, FileText, BarChart3, Users, CalendarCheck, MapPinned, Activity, Swords, BookOpen, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import RendimientoStore from "@/lib/rendimiento-store";

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

  // ── Utility: trigger a real browser download from a Blob ──
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    // Clean up after short delay so browser has time to start download
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 300);
  };

  const generateExcelBlob = async (sheets: { name: string; rows: any[] }[]): Promise<Blob> => {
    // Dynamic import so it only loads when needed
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    sheets.forEach(({ name, rows }) => {
      const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ "Sin datos": "—" }]);
      XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
    });
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  const generatePdfBlob = (title: string, rows: Record<string, any>[]): Blob => {
    const cols = rows.length > 0 ? Object.keys(rows[0]) : ["Sin datos"];
    const tableRows = rows.slice(0, 100).map(r =>
      `<tr>${cols.map(c => `<td style="border:1px solid #ddd;padding:6px 10px;font-size:12px">${r[c] ?? "—"}</td>`).join("")}</tr>`
    ).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:32px;color:#1a1a1a}
      h1{font-size:20px;margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:24px}
      table{border-collapse:collapse;width:100%}
      th{background:#5b21b6;color:#fff;padding:8px 10px;font-size:12px;text-align:left}
      tr:nth-child(even) td{background:#f5f3ff}
      @media print{body{padding:0}}
    </style></head><body>
    <h1>${title}</h1>
    <p>Generado por DeportivOS · ${new Date().toLocaleDateString("es-CR", { day:"2-digit", month:"long", year:"numeric" })}</p>
    <table><thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${tableRows}</tbody></table>
    </body></html>`;

    return new Blob([html], { type: "text/html;charset=utf-8" });
  };

  // ── Data builders per report type ──
  const getReportData = (label: string): { name: string; rows: any[] }[] => {
    const jugadores = RendimientoStore.getJugadores().map(j => ({
      Nombre: j.nombre,
      Categoría: j.categoria,
      Posición: j.posicion,
      Estado: (j as any).estado || j.estadoPago || "activo",
      "Fecha Nac.": j.fechaNacimiento ?? "—",
    }));
    const entrenadores = RendimientoStore.getEntrenadores().map(e => ({
      Nombre: e.nombre,
      Especialidad: e.especialidad,
      Estado: (e as any).estado ?? "—",
    }));
    const sedes = RendimientoStore.getSedes ? RendimientoStore.getSedes().map((s: any) => ({
      Nombre: s.nombre,
      Dirección: s.direccion ?? "—",
      Capacidad: s.capacidad ?? "—",
    })) : [];

    switch (label) {
      case "Jugadores activos":
        return [{ name: "Jugadores", rows: jugadores }];
      case "Entrenadores":
        return [{ name: "Entrenadores", rows: entrenadores }];
      case "Uso de instalaciones":
        return [{ name: "Instalaciones", rows: sedes }];
      case "Asistencia general":
        return [{ name: "Asistencia", rows: asistenciaMensual.map(a => ({ Mes: a.mes, Porcentaje: `${a.porcentaje ?? a.valor ?? "—"}%` })) }];
      case "Ocupación de categorías":
        return [{ name: "Categorías", rows: disciplinas.map(d => ({ Disciplina: d.nombre, Activos: d.activos, Capacidad: (d as any).capacidad ?? "—" })) }];
      default:
        return [{ name: label.substring(0, 31), rows: jugadores }];
    }
  };

  const handleExportExcelAll = async () => {
    setExportingExcel(true);
    toast.loading("Compilando base de datos consolidada...", { id: "export-excel" });
    try {
      const jugadores = RendimientoStore.getJugadores().map(j => ({
        Nombre: j.nombre, Categoría: j.categoria, Posición: j.posicion, Estado: (j as any).estado || j.estadoPago || "activo",
      }));
      const entrenadores = RendimientoStore.getEntrenadores().map(e => ({
        Nombre: e.nombre, Especialidad: e.especialidad,
      }));
      const sedes = RendimientoStore.getSedes ? RendimientoStore.getSedes().map((s: any) => ({
        Nombre: s.nombre, Dirección: s.direccion ?? "—",
      })) : [];

      const blob = await generateExcelBlob([
        { name: "Jugadores", rows: jugadores },
        { name: "Entrenadores", rows: entrenadores },
        { name: "Instalaciones", rows: sedes },
        { name: "Asistencia", rows: asistenciaMensual.map(a => ({ Mes: a.mes, Asistencia: `${a.porcentaje ?? a.valor ?? "—"}%` })) },
      ]);

      triggerDownload(blob, "Consolidado_Deportivo_DeportivOS.xlsx");
      toast.success("¡Archivo descargado! Revisa tu carpeta de Descargas.", { id: "export-excel" });
    } catch (err) {
      toast.error("Error generando el archivo Excel.", { id: "export-excel" });
      console.error(err);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPdfAll = async () => {
    setExportingPdf(true);
    toast.loading("Generando informe consolidado...", { id: "export-pdf" });
    try {
      const jugadores = RendimientoStore.getJugadores().map(j => ({
        Nombre: j.nombre, Categoría: j.categoria, Posición: j.posicion, Estado: (j as any).estado || j.estadoPago || "activo",
      }));
      const blob = generatePdfBlob("Reporte Global DeportivOS", jugadores);
      triggerDownload(blob, "Reporte_Global_DeportivOS.html");
      toast.success("¡Reporte descargado! Ábrelo en el navegador e imprime como PDF.", { id: "export-pdf" });
    } catch (err) {
      toast.error("Error generando el reporte PDF.", { id: "export-pdf" });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadSingleReport = async (reportLabel: string) => {
    setActiveReportDownload(reportLabel);
    toast.loading(`Generando reporte de ${reportLabel}...`, { id: "single-report" });
    try {
      const sheets = getReportData(reportLabel);
      const blob = await generateExcelBlob(sheets);
      const filename = reportLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
      triggerDownload(blob, `${filename}_deportivos.xlsx`);
      toast.success(`¡Reporte descargado! Revisa tu carpeta de Descargas.`, { id: "single-report" });
    } catch (err) {
      toast.error("Error generando el reporte.", { id: "single-report" });
      console.error(err);
    } finally {
      setActiveReportDownload(null);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-header-title">Reportes deportivos</h1>
          <p className="page-header-subtitle">Genera reportes operativos y exporta en PDF o Excel.</p>
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
            className="btn-primary"
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
              className="premium-card hover:shadow-elegant transition cursor-pointer group bg-card border-border relative overflow-hidden"
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
        <Card className="premium-card lg:col-span-2 bg-card border-border">
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

        <Card className="premium-card bg-card border-border">
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
