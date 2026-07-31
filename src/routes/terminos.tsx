import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ShieldCheck, FileText, Printer, Building2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/terminos")({
  component: TerminosPage,
});

function TerminosPage() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link to="/login">
            <Button variant="outline" size="sm" className="gap-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200">
              <ArrowLeft className="h-4 w-4" /> Regresar al Login
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200">
              <Printer className="h-4 w-4" /> Imprimir Documento
            </Button>
          </div>
        </div>

        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 md:p-8 border border-blue-800/40 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5" /> Marco Legal Oficial
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Términos y Condiciones del Servicio
              </h1>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl">
                NexusSport OS — Sistema Operativo de Gestión Deportiva, Administrativa y Financiera para Academias de Fútbol y Organizaciones Deportivas.
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 border-l md:border-l-0 border-slate-800 pl-4 md:pl-0">
              <p className="font-semibold text-slate-200">Última Actualización:</p>
              <p>31 de Julio de 2026</p>
              <p className="text-[11px] text-blue-400 font-mono mt-1">Versión 2.6 Legal-SaaS</p>
            </div>
          </div>
        </div>

        {/* Main Terms Document Body */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl text-slate-200">
          <CardContent className="p-6 md:p-10 space-y-8 text-sm md:text-base leading-relaxed">
            
            {/* Section 1 */}
            <section className="space-y-3 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">1</span>
                <h2>Definiciones y Ámbito de Aplicación</h2>
              </div>
              <p className="text-slate-300">
                El presente contrato regula el acceso y uso del software en la nube <strong className="text-white">NexusSport OS</strong>. Al ingresar, crear una cuenta, inscribir un atleta o utilizar los módulos de gestión, usted acepta en su totalidad los presentes Términos y Condiciones.
              </p>
              <ul className="space-y-2 text-slate-300 pl-4 list-disc">
                <li><strong className="text-white">Plataforma / Sistema:</strong> Se refiere a la aplicación web NexusSport OS, incluyendo sus módulos de control de jugadores, mensualidades, entrenamientos, cuerpo médico y táctica.</li>
                <li><strong className="text-white">Academia Inscrita / Organización:</strong> Entidad deportiva privada, club de fútbol o escuela de alto rendimiento que opera bajo la plataforma.</li>
                <li><strong className="text-white">Usuario Encargado / Padre de Familia:</strong> Persona física con patria potestad o tutela legal que registra a un menor de edad.</li>
                <li><strong className="text-white">Cuerpo Técnico / Staff:</strong> Directores técnicos, entrenadores y preparadores físicos autorizados por la academia.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">2</span>
                <h2>Inscripción y Tutela Legal de Menores de Edad</h2>
              </div>
              <p className="text-slate-300">
                Dado que las academias de fútbol atienden ataletas infantiles y juveniles, la inscripción de cualquier jugador menor de 18 años debe ser formalizada directamente por su padre, madre o tutor legal.
              </p>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" /> Declaración Jurada de Autorización
                </div>
                <p className="text-xs text-slate-300">
                  Al completar el formulario de pre-inscripción o matrícula, el encargado declara bajo fe de juramento ser el representante legal del atleta, autorizando su participación en entrenamientos, convocatorias a partidos oficiales y seguimiento morfofuncional deportivo.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">3</span>
                <h2>Ficha Médica, Cargas Físicas y Descargo de Responsabilidad</h2>
              </div>
              <p className="text-slate-300">
                NexusSport OS incluye herramientas de seguimiento de rendimiento GPS, fichas médicas de emergencia, registro de alergias y diarios de bienestar (Wellness).
              </p>
              <ul className="space-y-2 text-slate-300 pl-4 list-disc">
                <li>Los datos físicos y médicos almacenados son con fines <strong className="text-white">preventivos y de optimización deportiva interna</strong> del cuerpo técnico del club.</li>
                <li>La plataforma <strong className="text-white">no presta servicios médicos ni sustituye</strong> el diagnóstico, tratamiento o valoración de un profesional de la salud colegiado.</li>
                <li>Es obligación de los padres y del cuerpo técnico mantener actualizada la información sobre lesiones previo a cada competencia o entrenamiento de alta intensidad.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">4</span>
                <h2>Gestión de Pagos, Mensualidades y Comprobantes</h2>
              </div>
              <p className="text-slate-300">
                La plataforma ofrece un módulo de registro de comprobantes de transferencia (SINPE Móvil, transferencia bancaria, pasarela de pago).
              </p>
              <p className="text-slate-300">
                NexusSport OS actúa únicamente como el soporte tecnológico de registro administrativo. Cada academia deportiva es legal y fiscalmente responsable de la emisión de las facturas electrónicas y el cobro de mensualidades o matrículas correspondientes a sus afiliados.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">5</span>
                <h2>Propiedad Intelectual e Identidad de las Academias</h2>
              </div>
              <p className="text-slate-300">
                Todos los escudos, logos corporativos, nombres comerciales, uniformes institucionales y contenidos multimedia subidos por cada academia son propiedad exclusiva de sus respectivos titulares. NexusSport OS respeta plenamente la identidad de marca de cada club afiliado.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">6</span>
                <h2>Jurisdicción y Contacto Legal</h2>
              </div>
              <p className="text-slate-300">
                Estos Términos y Condiciones se rigen por la legislación comercial y digital vigente. Para cualquier consulta formal relacionada con el uso institucional de la plataforma, puede comunicarse a través del correo oficial <a href="mailto:soporte@nexussport.app" className="text-blue-400 underline">soporte@nexussport.app</a>.
              </p>
            </section>

          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-4 pb-8 space-y-2">
          <p>© 2026 NexusSport OS. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-slate-400">
            <Link to="/privacidad" className="hover:text-blue-400 underline">Políticas de Privacidad (PRODHAB)</Link>
            <span>•</span>
            <Link to="/login" className="hover:text-blue-400 underline">Iniciar Sesión</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
