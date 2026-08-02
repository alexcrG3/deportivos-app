import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, FileText, Printer, CheckCircle2, UserCheck } from "lucide-react";

export const Route = createFileRoute("/privacidad")({
  component: PrivacidadPage,
});

function PrivacidadPage() {
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
          <Link to="/login" search={{}}>
            <Button variant="outline" size="sm" className="gap-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200">
              <ArrowLeft className="h-4 w-4" /> Regresar al Login
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200">
              <Printer className="h-4 w-4" /> Imprimir Política
            </Button>
          </div>
        </div>

        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 md:p-8 border border-emerald-800/40 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Shield className="h-3.5 w-3.5" /> Cumplimiento Normativo PRODHAB
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Políticas de Privacidad y Protección de Datos
              </h1>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl">
                Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley N° 8968 - PRODHAB) aplicada a Academias de Fútbol y Atletas.
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 border-l md:border-l-0 border-slate-800 pl-4 md:pl-0">
              <p className="font-semibold text-slate-200">Marco Legal:</p>
              <p className="text-emerald-400 font-semibold">Ley 8968 PRODHAB</p>
              <p className="text-[11px] text-slate-400 mt-1">Vigente 2026</p>
            </div>
          </div>
        </div>

        {/* Main Document Body */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl text-slate-200">
          <CardContent className="p-6 md:p-10 space-y-8 text-sm md:text-base leading-relaxed">
            
            {/* Intro Alert */}
            <div className="bg-emerald-950/60 border border-emerald-800/50 p-4 rounded-xl flex items-start gap-3 text-emerald-200">
              <UserCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm space-y-1">
                <p className="font-bold text-white">Compromiso de Confidencialidad y Privacidad en el Deporte</p>
                <p className="text-emerald-200/90">
                  NexusSport OS y la Academia Deportiva en la que se encuentra inscrito garantizan la máxima seguridad, confidencialidad y tratamiento estrictamente pedagógico-deportivo de los datos personales y médicos de sus atletas.
                </p>
              </div>
            </div>

            {/* Section 1 */}
            <section className="space-y-3 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">1</span>
                <h2>Responsable del Tratamiento de los Datos</h2>
              </div>
              <p className="text-slate-300">
                Conforme a lo dispuesto por la <strong className="text-white">Ley N° 8968 (Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales)</strong> y la Agencia de Protección de Datos de los Habitantes (<strong className="text-emerald-400">PRODHAB</strong>), los datos recopilados son administrados conjuntamente por:
              </p>
              <ul className="space-y-2 text-slate-300 pl-4 list-disc">
                <li><strong className="text-white">NexusSport OS:</strong> En calidad de proveedor de infraestructura tecnológica en la nube (Encargado del Tratamiento).</li>
                <li><strong className="text-white">La Academia Deportiva Afiliada:</strong> En calidad de Responsable de la Base de Datos donde se encuentra matriculado el atleta.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-3 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">2</span>
                <h2>Datos Personales y Sensibles Recabados</h2>
              </div>
              <p className="text-slate-300">
                Para el adecuado funcionamiento del club deportivo y el cuidado integral de los deportistas, se recopilan las siguientes categorías de datos:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> Datos de Identificación
                  </h3>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                    <li>Nombre completo del atleta y tutor legal.</li>
                    <li>Número de Cédula o Identificación.</li>
                    <li>Correo electrónico y número telefónico.</li>
                    <li>Categoría, dorsal y sede deportiva asignada.</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Lock className="h-4 w-4" /> Datos Sensibles y Médicos
                  </h3>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                    <li>Ficha médica de emergencia y alergias.</li>
                    <li>Tipo de sangre e información de seguro médico.</li>
                    <li>Registro de lesiones y evolución de rehabilitación.</li>
                    <li>Métricas de rendimiento físico y datos GPS.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">3</span>
                <h2>Finalidades del Tratamiento de Datos</h2>
              </div>
              <p className="text-slate-300">
                Los datos personales y deportivos serán utilizados exclusivamente para:
              </p>
              <ul className="space-y-2 text-slate-300 pl-4 list-disc">
                <li>Gestión de inscripciones, convocatorias a partidos y control de asistencia a entrenamientos.</li>
                <li>Monitoreo de cargas de trabajo físico para la prevención activa de sobrecargas musculares y lesiones.</li>
                <li>Emisión de carnets oficiales digitalizados de identificación de jugador.</li>
                <li>Notificaciones a los encargados legales sobre estados de cuenta, mensualidades y comunicados institucionales de la academia.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">4</span>
                <h2>Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h2>
              </div>
              <p className="text-slate-300">
                De acuerdo con la Ley N° 8968, los titulares de los datos o sus representantes legales pueden ejercer en cualquier momento sus derechos de:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                {[
                  { title: "Acceso", desc: "Conocer los datos registrados en el club" },
                  { title: "Rectificación", desc: "Corregir datos inexactos o desactualizados" },
                  { title: "Cancelación", desc: "Solicitar la eliminación al retirarse de la academia" },
                  { title: "Oposición", desc: "Oponerse al tratamiento para fines no esenciales" }
                ].map((item) => (
                  <div key={item.title} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                    <p className="font-bold text-emerald-400 text-xs">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 pt-2">
                Para solicitar cualquier gestión ARCO, puede ponerse en contacto con la administración de su academia o dirigir una solicitud escrita a <a href="mailto:privacidad@nexussport.app" className="text-emerald-400 underline">privacidad@nexussport.app</a>.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3 border-b border-slate-800/80 pb-6">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">5</span>
                <h2>Seguridad de la Información y Encriptación</h2>
              </div>
              <p className="text-slate-300">
                NexusSport OS utiliza protocolos de encriptación de nivel bancario (TLS 1.3 en tránsito y AES-256 en reposo), respaldos automatizados e infraestructura en la nube protegida. El acceso está restringido mediante roles y permisos de usuario (Row Level Security).
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">6</span>
                <h2>Uso de Imagen Deportiva e Institucional</h2>
              </div>
              <p className="text-slate-300">
                Las fotografías y videos capturados durante torneos, partidos y entrenamientos oficiales se utilizarán únicamente con fines informativos, pedagógicos o de difusión deportiva interna en las plataformas autorizadas de la academia.
              </p>
            </section>

          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 pt-4 pb-8 space-y-2">
          <p>© 2026 NexusSport OS. Cumplimiento Normativo PRODHAB Ley 8968.</p>
          <div className="flex items-center justify-center gap-4 text-slate-400">
            <Link to="/terminos" className="hover:text-emerald-400 underline">Términos y Condiciones</Link>
            <span>•</span>
            <Link to="/login" search={{}} className="hover:text-emerald-400 underline">Iniciar Sesión</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
