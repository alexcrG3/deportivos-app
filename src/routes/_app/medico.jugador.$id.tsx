import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RendimientoStore from "@/lib/rendimiento-store";
import {
  Stethoscope, HeartPulse, ShieldCheck, Activity, Calendar, FileText,
  UserCheck, AlertTriangle, XCircle, ArrowLeft, Save, Plus, ActivitySquare, Scale, Dumbbell,
  Thermometer, Bug, ClipboardList, Send, CheckCircle2, RefreshCw, Edit, Trash2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/medico/jugador/$id")({
  component: MedicoJugadorDetailPage,
});

function MedicoJugadorDetailPage() {
  const { id } = Route.useParams();
  const jugador = useMemo(() => {
    const list = RendimientoStore.getJugadores();
    const found = list.find((j) => j.id === id);
    if (found) return found;

    return {
      id: id || "j1",
      nombre: "Deportista Registrado",
      categoria: "U15",
      edad: 15,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      identificacion: "DOC-20004",
      posicion: "Deportista",
      dorsal: 10,
    };
  }, [id]);

  const [historial, setHistorial] = useState(() => {
    const exist = RendimientoStore.getHistorialMedico(jugador.id);
    if (exist) return exist;
    return {
      id: "h_fallback",
      jugadorId: jugador.id,
      estadoMedico: "alta",
      diagnosticoActual: "Sin patologías activas",
      antecedentesPatologicos: "",
      tratamientosFarmacologicos: "",
      alergias: "",
      historialLesiones: "",
      problemasOrtopedicos: "",
      antecedentesFamiliares: "",
      incidenciasAuscultacion: "",
      otrosControles: "",
      observacionesGenerales: "",
      fechaUltimaValoracion: new Date().toISOString().split("T")[0],
    };
  });

  const [antropometrias, setAntropometrias] = useState(() => {
    const list = RendimientoStore.getValoracionesAntropometricas(jugador.id);
    return list && list.length > 0 ? list : RendimientoStore.getValoracionesAntropometricas();
  });
  const [citas, setCitas] = useState(() => {
    const list = RendimientoStore.getCitasFisioterapia(jugador.id);
    return list && list.length > 0 ? list : RendimientoStore.getCitasFisioterapia();
  });
  const [partesLesiones, setPartesLesiones] = useState(() => {
    const list = RendimientoStore.getPartesLesiones(jugador.id);
    return list && list.length > 0 ? list : RendimientoStore.getPartesLesiones();
  });
  const [infecciones, setInfecciones] = useState(() => {
    const list = RendimientoStore.getControlInfecciones(jugador.id);
    return list && list.length > 0 ? list : RendimientoStore.getControlInfecciones();
  });
  const [temperaturas, setTemperaturas] = useState(() => {
    const list = RendimientoStore.getControlTemperatura(jugador.id);
    return list && list.length > 0 ? list : RendimientoStore.getControlTemperatura();
  });
  const [partesDiarios, setPartesDiarios] = useState(() => {
    const list = RendimientoStore.getParteMedicoDiario(jugador.id);
    return list && list.length > 0 ? list : RendimientoStore.getParteMedicoDiario();
  });

  // Form states for clinical updates
  const [estadoMedico, setEstadoMedico] = useState<any>(historial.estadoMedico || "alta");
  const [diagnosticoActual, setDiagnosticoActual] = useState(historial.diagnosticoActual || "");
  const [antecedentesPatologicos, setAntecedentesPatologicos] = useState(historial.antecedentesPatologicos || "");
  const [tratamientosFarmacologicos, setTratamientosFarmacologicos] = useState(historial.tratamientosFarmacologicos || "");
  const [alergias, setAlergias] = useState(historial.alergias || "");
  const [historialLesiones, setHistorialLesiones] = useState(historial.historialLesiones || "");
  const [problemasOrtopedicos, setProblemasOrtopedicos] = useState(historial.problemasOrtopedicos || "");
  const [antecedentesFamiliares, setAntecedentesFamiliares] = useState(historial.antecedentesFamiliares || "");
  const [incidenciasAuscultacion, setIncidenciasAuscultacion] = useState(historial.incidenciasAuscultacion || "");
  const [otrosControles, setOtrosControles] = useState(historial.otrosControles || "");
  const [observacionesGenerales, setObservacionesGenerales] = useState(historial.observacionesGenerales || "");
  const [pesoEstablecido, setPesoEstablecido] = useState<number>(65.0);

  // Modal 1: Registrar Parte de Lesión
  const [openNewParteLesion, setOpenNewParteLesion] = useState(false);
  const [fechaBaja, setFechaBaja] = useState(new Date().toISOString().split("T")[0]);
  const [fechaAltaEst, setFechaAltaEst] = useState("");
  const [tipoLesionInput, setTipoLesionInput] = useState("");

  // Modal 2: Registrar Control Temperatura
  const [openNewTemp, setOpenNewTemp] = useState(false);
  const [tempCelsius, setTempCelsius] = useState<number>(36.5);
  const [presionInput, setPresionInput] = useState("120/80");
  const [obsTempInput, setObsTempInput] = useState("");

  // Modal 3: Registrar Infección
  const [openNewInfeccion, setOpenNewInfeccion] = useState(false);
  const [filterInfeccion, setFilterInfeccion] = useState<"todos" | "activas" | "resueltas">("todos");
  const [tipoInfeccionInput, setTipoInfeccionInput] = useState("");
  const [fechaInicioInf, setFechaInicioInf] = useState(new Date().toISOString().split("T")[0]);
  const [fechaRecuperacionInf, setFechaRecuperacionInf] = useState("");
  const [tratamientoInf, setTratamientoInf] = useState("");
  const [medicamentosInf, setMedicamentosInf] = useState("");
  const [obsInfeccionInput, setObsInfeccionInput] = useState("");

  // Modal 4: Registrar / Editar Parte Médico Diario
  const [openNewParteDiario, setOpenNewParteDiario] = useState(false);
  const [diagParteDiario, setDiagParteDiario] = useState("");
  const [exploracionParteDiario, setExploracionParteDiario] = useState("");
  const [tratamientoParteDiario, setTratamientoParteDiario] = useState("");
  const [observacionesParteDiario, setObservacionesParteDiario] = useState("");
  const [marcarBajaMedica, setMarcarBajaMedica] = useState(false);
  const [editingParteDiarioId, setEditingParteDiarioId] = useState<string | null>(null);
  const [recomendacionEntrenadorInput, setRecomendacionEntrenadorInput] = useState("");

  // Modal 5: Registrar Antropometría Completa ISAK
  const [openNewAntro, setOpenNewAntro] = useState(false);
  const [pesoInput, setPesoInput] = useState<number>(65);
  const [alturaInput, setAlturaInput] = useState<number>(172);
  // Perímetros (cm)
  const [brazoDer, setBrazoDer] = useState("37.5");
  const [brazoIzq, setBrazoIzq] = useState("37.0");
  const [pechoTorax, setPechoTorax] = useState("95.0");
  const [abdomenCintura, setAbdomenCintura] = useState("80.0");
  const [caderaGlut, setCaderaGlut] = useState("90.0");
  const [musloDer, setMusloDer] = useState("55.0");
  const [musloIzq, setMusloIzq] = useState("54.0");
  const [gemeloDer, setGemeloDer] = useState("35.5");
  const [gemeloIzq, setGemeloIzq] = useState("35.0");
  // Longitudes (cm)
  const [humero, setHumero] = useState("37.0");
  const [femurDer, setFemurDer] = useState("40.5");
  const [femurIzq, setFemurIzq] = useState("40.0");
  const [muneca, setMuneca] = useState("11.0");
  // Pliegues (mm)
  const [bicipital, setBicipital] = useState("3.5");
  const [tricipital, setTricipital] = useState("6.0");
  const [subescapular, setSubescapular] = useState("10.0");
  const [suprailiaco, setSuprailiaco] = useState("8.5");
  const [abdominal, setAbdominal] = useState("12.0");
  const [sugerenciaInput, setSugerenciaInput] = useState("");

  const handleSaveHistorial = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      jugadorId: jugador.id,
      estadoMedico,
      diagnosticoActual,
      fechaUltimaValoracion: new Date().toISOString().split("T")[0],
      antecedentesPatologicos,
      tratamientosFarmacologicos,
      alergias,
      historialLesiones,
      problemasOrtopedicos,
      antecedentesFamiliares,
      incidenciasAuscultacion,
    };
    RendimientoStore.saveHistorialMedico(updated);
    setHistorial(updated);
    toast.success("Expediente clínico guardado con éxito.");
  };

  // Edit IDs for full CRUD state management
  const [editingParteLesionId, setEditingParteLesionId] = useState<string | null>(null);
  const [editingCitaId, setEditingCitaId] = useState<string | null>(null);
  const [editingAntropometriaId, setEditingAntropometriaId] = useState<string | null>(null);
  const [editingInfeccionId, setEditingInfeccionId] = useState<string | null>(null);
  const [editingTemperaturaId, setEditingTemperaturaId] = useState<string | null>(null);

  const handleAddParteLesionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingParteLesionId) {
      RendimientoStore.updateParteLesion(editingParteLesionId, {
        fechaBaja,
        fechaAltaEstimada: fechaAltaEst || "Pendiente de evolución",
        tipoLesion: tipoLesionInput || "Lesión Muscular / Reposo",
      });
      toast.success("Parte de lesión actualizado correctamente.");
    } else {
      RendimientoStore.addParteLesion({
        jugadorId: jugador.id,
        fechaBaja,
        fechaAltaEstimada: fechaAltaEst || "Pendiente de evolución",
        tipoLesion: tipoLesionInput || "Lesión Muscular / Reposo",
        equipoCategoria: jugador.categoria,
        medicoTratante: "Dr. Roberto Solano",
        estado: "en_recuperacion",
      });
      toast.success("Nuevo parte de lesión registrado.");
    }
    setEditingParteLesionId(null);
    setPartesLesiones(RendimientoStore.getPartesLesiones(jugador.id));
    setOpenNewParteLesion(false);
  };

  const handleAddTemperaturaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const alertaFiebre = Number(tempCelsius) >= 37.5;
    if (editingTemperaturaId) {
      RendimientoStore.updateControlTemperatura(editingTemperaturaId, {
        temperaturaCelsius: Number(tempCelsius),
        presionArterial: presionInput || "120/80",
        observaciones: obsTempInput || "Control térmico preventivo.",
        alertaFiebre,
      });
      toast.success("Registro de temperatura actualizado correctamente.");
    } else {
      RendimientoStore.addControlTemperatura({
        jugadorId: jugador.id,
        fecha: new Date().toISOString().split("T")[0],
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        temperaturaCelsius: Number(tempCelsius),
        presionArterial: presionInput || "120/80",
        observaciones: obsTempInput || "Control térmico preventivo.",
        alertaFiebre,
        evaluador: "Licda. Mariela Castro",
      });
      toast.success("Registro de temperatura guardado con éxito.");
    }
    setEditingTemperaturaId(null);
    setTemperaturas(RendimientoStore.getControlTemperatura(jugador.id));
    setOpenNewTemp(false);
    setObsTempInput("");
    if (alertaFiebre) {
      toast.warning("Alerta de fiebre registrada (≥ 37.5 °C).");
    }
  };

  const handleAddInfeccionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInfeccionId) {
      RendimientoStore.updateControlInfeccion(editingInfeccionId, {
        tipoInfeccion: tipoInfeccionInput || "Infección Respiratoria / Gripal",
        fechaInicio: fechaInicioInf || new Date().toISOString().split("T")[0],
        fechaRecuperacion: fechaRecuperacionInf || "Pendiente de alta",
        tratamiento: tratamientoInf || "Aislamiento preventivo e hidratación",
        medicamentos: medicamentosInf || "Antipiréticos / Paracetamol",
        observaciones: obsInfeccionInput || "Reposo deportivo en casa.",
        altaEmitida: !!fechaRecuperacionInf,
      });
      toast.success("Infección actualizada correctamente.");
    } else {
      RendimientoStore.addControlInfeccion({
        jugadorId: jugador.id,
        tipoInfeccion: tipoInfeccionInput || "Infección Respiratoria / Gripal",
        fechaInicio: fechaInicioInf || new Date().toISOString().split("T")[0],
        fechaRecuperacion: fechaRecuperacionInf || "Pendiente de alta",
        tratamiento: tratamientoInf || "Aislamiento preventivo e hidratación",
        medicamentos: medicamentosInf || "Antipiréticos / Paracetamol",
        observaciones: obsInfeccionInput || "Reposo deportivo en casa.",
        fechaRegistro: new Date().toISOString().split("T")[0],
        altaEmitida: !!fechaRecuperacionInf,
        medico: "Dr. Roberto Solano",
      });
      toast.success("Infección registrada correctamente en la bitácora.");
    }
    setEditingInfeccionId(null);
    setInfecciones(RendimientoStore.getControlInfecciones(jugador.id));
    setOpenNewInfeccion(false);
    setTipoInfeccionInput("");
    setTratamientoInf("");
    setMedicamentosInf("");
    setObsInfeccionInput("");
  };

  const handleAddParteDiarioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isBaja = marcarBajaMedica;
    
    if (editingParteDiarioId) {
      RendimientoStore.updateParteMedicoDiario(editingParteDiarioId, {
        diagnostico: diagParteDiario || "Valoración Diaria de Rutina",
        exploracion: exploracionParteDiario || "Exploración física sin hallazgos agudos.",
        tratamiento: tratamientoParteDiario || "Reposo adaptado / Crio-terapia local",
        observaciones: observacionesParteDiario || "Sin restricciones adicionales.",
        esBajaMedica: isBaja,
      });
      toast.success("Parte médico diario actualizado correctamente.");
    } else {
      RendimientoStore.addParteMedicoDiario({
        jugadorId: jugador.id,
        fecha: new Date().toISOString().split("T")[0],
        diagnostico: diagParteDiario || "Valoración Diaria de Rutina",
        exploracion: exploracionParteDiario || "Exploración física sin hallazgos agudos.",
        tratamiento: tratamientoParteDiario || "Reposo adaptado / Crio-terapia local",
        observaciones: observacionesParteDiario || "Sin restricciones adicionales.",
        esBajaMedica: isBaja,
        medico: "Dr. Roberto Solano",
      });
      toast.success("Parte médico diario guardado con éxito.");
    }

    if (isBaja) {
      const updated = { ...historial, estadoMedico: "baja", diagnosticoActual: diagParteDiario || "Baja Médica por Dictamen Diario" };
      RendimientoStore.saveHistorialMedico(updated);
      setHistorial(updated);
      setEstadoMedico("baja");

      RendimientoStore.addParteLesion({
        jugadorId: jugador.id,
        fechaBaja: new Date().toISOString().split("T")[0],
        fechaAltaEstimada: "Pendiente de evolución",
        tipoLesion: diagParteDiario || "Baja Médica / Inhabilitado",
        equipoCategoria: jugador.categoria,
        medicoTratante: "Dr. Roberto Solano",
        estado: "en_recuperacion",
      });
      setPartesLesiones(RendimientoStore.getPartesLesiones(jugador.id));
      toast.warning("Parte registrado: Se ha marcado BAJA MÉDICA para el atleta.");
    } else {
      toast.success("Parte médico diario guardado con éxito.");
    }

    setPartesDiarios(RendimientoStore.getParteMedicoDiario(jugador.id));
    setOpenNewParteDiario(false);
    setDiagParteDiario("");
    setExploracionParteDiario("");
    setTratamientoParteDiario("");
    setObservacionesParteDiario("");
    setMarcarBajaMedica(false);
  };

  const handleDeleteParteLesion = (id: string) => {
    RendimientoStore.deleteParteLesion(id);
    setPartesLesiones(RendimientoStore.getPartesLesiones(jugador.id));
    toast.success("Parte de lesión eliminado.");
  };

  const handleDeleteCita = (id: string) => {
    RendimientoStore.deleteCitaFisioterapia(id);
    setCitas(RendimientoStore.getCitasFisioterapia(jugador.id));
    toast.success("Cita de fisioterapia eliminada.");
  };

  const handleDeleteParteDiario = (id: string) => {
    RendimientoStore.deleteParteMedicoDiario(id);
    setPartesDiarios(RendimientoStore.getParteMedicoDiario(jugador.id));
    toast.success("Parte médico diario eliminado.");
  };

  const handleDeleteAntropometria = (id: string) => {
    RendimientoStore.deleteValoracionAntropometrica(id);
    setAntropometrias(RendimientoStore.getValoracionesAntropometricas(jugador.id));
    toast.success("Valoración antropométrica eliminada.");
  };

  const handleDeleteInfeccion = (id: string) => {
    RendimientoStore.deleteControlInfeccion(id);
    setInfecciones(RendimientoStore.getControlInfecciones(jugador.id));
    toast.success("Registro de infección eliminado.");
  };

  const handleDeleteTemperatura = (id: string) => {
    RendimientoStore.deleteControlTemperatura(id);
    setTemperaturas(RendimientoStore.getControlTemperatura(jugador.id));
    toast.success("Registro de temperatura eliminado.");
  };

  const handleAddAntropometriaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    RendimientoStore.addValoracionAntropometrica({
      jugadorId: jugador.id,
      fecha: new Date().toISOString().split("T")[0],
      pesoKg: Number(pesoInput),
      alturaCm: Number(alturaInput),
      porcentajeGrasa: Number(grasaInput),
      porcentajeMasaMuscular: Number(mascularInput),
      sugerenciaNutricional: sugerenciaInput || "Mantener hidratación e ingesta proteica.",
      evaluador: "Dra. Sofía Mora (Nutricionista)",
    });
    setAntropometrias(RendimientoStore.getValoracionesAntropometricas(jugador.id));
    setOpenNewAntro(false);
    toast.success("Nueva valoración antropométrica registrada.");
  };

  if (!jugador) return null;

  return (
    <div className="space-y-6">
      {/* TOP BACK BAR */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-slate-500 font-bold">
          <Link to="/medico">
            <ArrowLeft className="h-4 w-4" /> Volver al Directorio Médico
          </Link>
        </Button>

        <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/20 text-xs px-3 py-1">
          SISTEMA MÉDICO DE DEPORTISTAS · EXPEDIENTE INTEGRAL
        </Badge>
      </div>

      {/* ATHLETE HERO HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-5 sm:p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-indigo-500/30 border-2 border-white shadow-lg shrink-0">
            <AvatarImage src={jugador.avatar} />
            <AvatarFallback className="bg-indigo-600 text-white font-black text-2xl">{jugador.nombre[0]}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white flex flex-wrap justify-center sm:justify-start items-center gap-2">
              {jugador.nombre}
            </h1>
            <p className="text-xs text-slate-300 flex flex-wrap justify-center sm:justify-start items-center gap-2">
              <span>ID: <strong className="text-white font-mono">{jugador.identificacion || "DOC-20004"}</strong></span>
              <span>·</span>
              <span>Categoría: <strong className="text-white">{jugador.categoria}</strong></span>
              <span>·</span>
              <span>Edad: <strong className="text-white">{jugador.edad} años</strong></span>
            </p>
            <p className="text-xs text-slate-400">
              Médico Tratante: <span className="text-indigo-300 font-bold">{historial.medicoAsignado || "Dr. Roberto Solano"}</span> · Fisioterapeuta: <span className="text-indigo-300 font-bold">{historial.fisioterapeutaAsignado || "Licda. Mariela Castro"}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-800 text-center space-y-1 w-full sm:w-auto min-w-[180px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado Médico Deportivo</p>
          <Badge
            className={`font-black text-xs sm:text-sm px-4 py-1 rounded-full uppercase tracking-wider ${
              estadoMedico === "alta"
                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                : estadoMedico === "rehabilitacion"
                ? "bg-amber-500 text-white shadow-amber-500/20"
                : estadoMedico === "precaucion"
                ? "bg-purple-500 text-white shadow-purple-500/20"
                : "bg-rose-600 text-white shadow-rose-600/20"
            }`}
          >
            {estadoMedico === "alta" ? "✓ ALTA DEPORTIVA" : estadoMedico.toUpperCase()}
          </Badge>
          <p className="text-[10px] text-slate-400 pt-0.5">Última valoración: {historial.fechaUltimaValoracion}</p>
        </div>
      </div>

      {/* ALL 8 MEDICAL SECTIONS IN SCROLLABLE TABS */}
      <Tabs defaultValue="historial" className="space-y-4 w-full">
        <div className="w-full overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 inline-flex flex-nowrap gap-1.5 min-w-full w-max">
            <TabsTrigger value="historial" className="font-bold text-xs rounded-xl shrink-0 whitespace-nowrap px-3.5 py-2">📋 Historial Clínico</TabsTrigger>
            <TabsTrigger value="lesiones" className="font-bold text-xs rounded-xl shrink-0 whitespace-nowrap px-3.5 py-2">🚑 Partes de Lesiones ({partesLesiones.length})</TabsTrigger>
            <TabsTrigger value="fisioterapia" className="font-bold text-xs rounded-xl shrink-0 whitespace-nowrap px-3.5 py-2">🏥 Fisioterapia ({citas.length})</TabsTrigger>
            <TabsTrigger value="partediario" className="font-bold text-xs rounded-xl shrink-0 whitespace-nowrap px-3.5 py-2">📝 Parte Médico Diario ({partesDiarios.length})</TabsTrigger>
            <TabsTrigger value="antropometria" className="font-bold text-xs rounded-xl shrink-0 whitespace-nowrap px-3.5 py-2">⚖️ Antropometría ({antropometrias.length})</TabsTrigger>
            <TabsTrigger value="peso" className="font-bold text-xs rounded-xl shrink-0 whitespace-nowrap px-3.5 py-2">🏋️ Control de Peso</TabsTrigger>
            <TabsTrigger value="infecciones" className="font-bold text-xs rounded-xl shrink-0 whitespace-nowrap px-3.5 py-2">🦠 Infecciones ({infecciones.length})</TabsTrigger>
            <TabsTrigger value="temperatura" className="font-bold text-xs rounded-xl shrink-0 whitespace-nowrap px-3.5 py-2">🌡️ Temperatura ({temperaturas.length})</TabsTrigger>
          </TabsList>
        </div>

        {/* 1. HISTORIAL CLÍNICO COMPLETO */}
        <TabsContent value="historial" className="space-y-6">
          <form onSubmit={handleSaveHistorial} className="space-y-6">
            <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Historial Clínico Completo
                  </h3>
                  <p className="text-xs text-slate-400">Ficha médica para <strong>{jugador.nombre}</strong> (ID: {jugador.id})</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase">Estado Médico:</span>
                    <Badge className="bg-emerald-500 text-white font-black text-sm px-3 py-0.5 rounded-full border-none">
                      ALTA
                    </Badge>
                  </div>
                </div>
              </div>

              {/* ANTECEDENTES PATOLÓGICOS */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ANTECEDENTES PATOLÓGICOS</label>
                <Textarea
                  value={antecedentesPatologicos}
                  onChange={(e) => setAntecedentesPatologicos(e.target.value)}
                  placeholder="Enfermedades de la infancia, accidentes, cirugías, etc."
                  rows={3}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* GRID DE 4 COLUMNAS */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TRATAMIENTOS FARMACOLÓGICOS</label>
                  <Textarea value={tratamientosFarmacologicos} onChange={(e) => setTratamientosFarmacologicos(e.target.value)} rows={3} className="text-xs rounded-xl" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ALERGIAS</label>
                  <Textarea value={alergias} onChange={(e) => setAlergias(e.target.value)} rows={3} className="text-xs rounded-xl" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">HISTORIAL DE LESIONES</label>
                  <Textarea value={historialLesiones} onChange={(e) => setHistorialLesiones(e.target.value)} rows={3} className="text-xs rounded-xl" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PROBLEMAS ORTOPÉDICOS</label>
                  <Textarea value={problemasOrtopedicos} onChange={(e) => setProblemasOrtopedicos(e.target.value)} rows={3} className="text-xs rounded-xl" />
                </div>
              </div>

              {/* ANTECEDENTES FAMILIARES */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ANTECEDENTES FAMILIARES</label>
                <Textarea
                  value={antecedentesFamiliares}
                  onChange={(e) => setAntecedentesFamiliares(e.target.value)}
                  placeholder="Antecedentes cardíacos o patologías en la familia..."
                  rows={2}
                  className="text-xs rounded-xl"
                />
              </div>

              {/* GRID DE 2 COLUMNAS */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">INCIDENCIAS AUSCULTACIÓN</label>
                  <Textarea value={incidenciasAuscultacion} onChange={(e) => setIncidenciasAuscultacion(e.target.value)} rows={2} className="text-xs rounded-xl" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OTROS CONTROLES</label>
                  <Textarea value={otrosControles} onChange={(e) => setOtrosControles(e.target.value)} rows={2} className="text-xs rounded-xl" />
                </div>
              </div>

              {/* OBSERVACIONES GENERALES */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">OBSERVACIONES GENERALES</label>
                <Textarea
                  value={observacionesGenerales}
                  onChange={(e) => setObservacionesGenerales(e.target.value)}
                  placeholder="Observaciones generales sobre el estado físico del atleta..."
                  rows={3}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5 h-9 px-5 shadow-xs">
                  <Save className="h-4 w-4" /> Guardar Historial Clínico
                </Button>
              </div>
            </Card>

            {/* RESUMEN DE VALORACIÓN ANTROPOMÉTRICA (RESUMEN) */}
            <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-3">
              <h4 className="text-base font-bold text-indigo-900 dark:text-indigo-200 border-b border-indigo-100 dark:border-indigo-950 pb-2">
                Registro de Valoración Antropométrica (Resumen)
              </h4>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-indigo-950 text-white font-bold uppercase text-[10px]">
                      <th className="p-3">FECHA</th>
                      <th className="p-3">PESO (KG)</th>
                      <th className="p-3">ALTURA (CM)</th>
                      <th className="p-3">IMC</th>
                      <th className="p-3">SUGERENCIA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {antropometrias.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{a.fecha}</td>
                        <td className="p-3 font-mono font-bold text-indigo-600">{a.pesoKg}</td>
                        <td className="p-3 font-mono">{(a.alturaCm / 100).toFixed(2)}</td>
                        <td className="p-3 font-bold text-indigo-600">**{a.imc}**</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{a.sugerenciaNutricional || "Comer bien para ganar volumen"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </form>
        </TabsContent>

        {/* 2. PARTES DE LESIONES */}
        <TabsContent value="lesiones" className="space-y-4">
          <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Partes de Lesiones Registrados</CardTitle>
                <CardDescription className="text-xs">Registro de bajas médicas y partes de lesión oficial.</CardDescription>
              </div>

              <Button onClick={() => setOpenNewParteLesion(!openNewParteLesion)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1 h-8">
                <Plus className="h-4 w-4" /> Registrar Nuevo Parte de Lesión
              </Button>
            </div>

            {openNewParteLesion && (
              <form onSubmit={handleAddParteLesionSubmit} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase">Registrar Nuevo Parte de Lesión para {jugador.nombre}</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[11px] font-bold">Fecha de Baja (Obligatorio)</label>
                    <Input type="date" value={fechaBaja} onChange={e => setFechaBaja(e.target.value)} required className="h-8 text-xs" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold">Fecha de Alta Estimada</label>
                    <Input type="date" value={fechaAltaEst} onChange={e => setFechaAltaEst(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold">Tipo de Lesión / Diagnóstico</label>
                    <Input value={tipoLesionInput} onChange={e => setTipoLesionInput(e.target.value)} placeholder="Ej. Rotura Fibrilar Grado II" required className="h-8 text-xs" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpenNewParteLesion(false)} className="h-7 text-xs">Cancelar</Button>
                  <Button type="submit" size="sm" className="h-7 text-xs bg-emerald-600 text-white font-bold">Guardar Parte</Button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Fecha Baja</th>
                    <th className="p-3">Alta Estimada</th>
                    <th className="p-3">Tipo de Lesión</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Médico Tratante</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {partesLesiones.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{p.fechaBaja}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{p.fechaAltaEstimada}</td>
                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{p.tipoLesion}</td>
                      <td className="p-3"><Badge variant="outline" className="text-[10px] font-bold">{p.equipoCategoria}</Badge></td>
                      <td className="p-3 text-slate-500">{p.medicoTratante}</td>
                      <td className="p-3 text-center">
                        <Badge className="bg-amber-100 text-amber-700 font-bold text-[10px] uppercase">
                          {p.estado}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="xs" variant="ghost" onClick={() => {
                            setEditingParteLesionId(p.id);
                            setFechaBaja(p.fechaBaja);
                            setFechaAltaEst(p.fechaAltaEstimada === "Pendiente de evolución" ? "" : p.fechaAltaEstimada);
                            setTipoLesionInput(p.tipoLesion);
                            setOpenNewParteLesion(true);
                          }} className="h-7 px-2 text-xs text-indigo-600 font-bold">
                            <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => handleDeleteParteLesion(p.id)} className="h-7 px-2 text-xs text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50">
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 3. FISIOTERAPIA */}
        <TabsContent value="fisioterapia" className="space-y-4">
          <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Citas de Fisioterapia & Terapia Manual</CardTitle>
                <CardDescription className="text-xs">Turnos de rehabilitación programados para este atleta.</CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.success("Recordatorio WhatsApp enviado al encargado.")} className="h-8 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1">
                  <Send className="h-3.5 w-3.5" /> Enviar Recordatorio
                </Button>
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 h-8">
                  <Link to="/medico/citas">
                    <Plus className="h-4 w-4" /> Programar Cita
                  </Link>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3">Fisioterapeuta</th>
                    <th className="p-3">Motivo & Tratamiento</th>
                    <th className="p-3 text-center">Dolor (EVA 1-10)</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {citas.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{c.fecha} - {c.hora}</td>
                      <td className="p-3 text-indigo-600 font-semibold">{c.fisioterapeutaNombre}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{c.motivo} ({c.tratamientoAplicado})</td>
                      <td className="p-3 text-center">
                        <Badge className={`font-mono text-[10px] ${c.nivelDolorEva > 4 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                          EVA {c.nivelDolorEva}/10
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className="bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase">
                          {c.estado}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="xs" variant="ghost" onClick={() => toast.info("Editando cita de fisioterapia...")} className="h-7 px-2 text-xs text-indigo-600 font-bold">
                            <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => handleDeleteCita(c.id)} className="h-7 px-2 text-xs text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50">
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

          {/* 4. PARTE MÉDICO DIARIO - NUEVO DISEÑO PROFESIONAL */}
        <TabsContent value="partediario" className="space-y-6">
          {/* HEADER BANNER */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Parte Médico Diario — {jugador.nombre}
                </h2>
              </div>
              <p className="text-xs text-slate-400 pt-1">
                Bitácora de exploración clínica, diagnósticos diarios y dictamen de aptitud deportiva.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => toast.success("Exportando partes médicos a Excel...")}
                variant="outline"
                size="sm"
                className="bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700 font-bold rounded-xl text-xs gap-1.5 h-9"
              >
                <FileText className="h-4 w-4 text-emerald-400" /> Exportar Excel / Imprimir
              </Button>
              <Button
                onClick={() => {
                  setEditingParteDiarioId(null);
                  setDiagParteDiario("");
                  setExploracionParteDiario("");
                  setTratamientoParteDiario("");
                  setObservacionesParteDiario("");
                  setMarcarBajaMedica(false);
                  setOpenNewParteDiario(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs gap-1.5 h-9 px-4 shadow-elegant"
              >
                <Plus className="h-4 w-4" /> Emitir Nuevo Parte Diario
              </Button>
            </div>
          </div>

          {/* FORMULARIO DE EMISIÓN / EDICIÓN */}
          {openNewParteDiario && (
            <Card className="shadow-2xl border border-indigo-200 dark:border-indigo-900/60 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-5 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {editingParteDiarioId ? "Modificar Parte Médico Existente" : "Emitir Nuevo Parte Médico Diario"}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setOpenNewParteDiario(false)}
                  className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-slate-700"
                >
                  ✕
                </Button>
              </div>

              <form onSubmit={handleAddParteDiarioSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Diagnóstico Clínico (*)</label>
                    <Textarea
                      value={diagParteDiario}
                      onChange={(e) => setDiagParteDiario(e.target.value)}
                      placeholder="Ej. Contractura leve en gemelo derecho..."
                      rows={2}
                      required
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Exploración Física</label>
                    <Textarea
                      value={exploracionParteDiario}
                      onChange={(e) => setExploracionParteDiario(e.target.value)}
                      placeholder="Ej. Sensibilidad a la palpación sin edema..."
                      rows={2}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tratamiento Indicado</label>
                    <Textarea
                      value={tratamientoParteDiario}
                      onChange={(e) => setTratamientoParteDiario(e.target.value)}
                      placeholder="Ej. Masaje descontracturante + Crioterapia 15 min..."
                      rows={2}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Observaciones Técnicas</label>
                    <Textarea
                      value={observacionesParteDiario}
                      onChange={(e) => setObservacionesParteDiario(e.target.value)}
                      placeholder="Ej. Precaución en sprints de alta velocidad..."
                      rows={2}
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bajaMedicaCheck"
                      checked={marcarBajaMedica}
                      onChange={(e) => setMarcarBajaMedica(e.target.checked)}
                      className="h-4 w-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="bajaMedicaCheck" className="text-xs font-bold text-rose-700 dark:text-rose-300 cursor-pointer">
                      Declarar Baja Médica Deportiva (Inhabilita al deportista e inscribe parte de baja)
                    </label>
                  </div>
                  <Badge className={`text-[10px] font-bold uppercase ${marcarBajaMedica ? "bg-rose-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600"}`}>
                    {marcarBajaMedica ? "🚨 REQUIERE BAJA" : "✓ APTO PARA ENTRENAR"}
                  </Badge>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenNewParteDiario(false)}
                    className="h-9 text-xs font-bold rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-5 shadow-xs gap-1.5"
                  >
                    <Save className="h-4 w-4" /> {editingParteDiarioId ? "Guardar Cambios" : "Emitir Parte Diario"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* HISTORIAL DE PARTES MÉDICOS DIARIOS */}
          <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Historial de Partes Médicos Registrados
                </h3>
                <p className="text-xs text-slate-400">Consultar y editar informes de valoraciones diarias previas.</p>
              </div>
              <Badge variant="outline" className="font-mono font-bold text-xs">
                Total: {partesDiarios.length} registro(s)
              </Badge>
            </div>

            {partesDiarios.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <ClipboardList className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-500">No hay partes médicos diarios registrados para este atleta.</p>
                <Button
                  onClick={() => setOpenNewParteDiario(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold rounded-xl text-indigo-600 border-indigo-200"
                >
                  Emitir Primer Parte Diario
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {partesDiarios.map((parte) => (
                  <div
                    key={parte.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-900 text-white font-bold text-[11px]">
                          {parte.fecha}
                        </Badge>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Dr. Solano / Equipo Médico
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          className={`font-bold text-[10px] uppercase ${
                            parte.esBajaMedica
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                          }`}
                        >
                          {parte.esBajaMedica ? "🚨 BAJA MÉDICA" : "✓ APTO"}
                        </Badge>

                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setEditingParteDiarioId(parte.id);
                            setDiagParteDiario(parte.diagnostico);
                            setExploracionParteDiario(parte.exploracion);
                            setTratamientoParteDiario(parte.tratamiento);
                            setObservacionesParteDiario(parte.observaciones);
                            setMarcarBajaMedica(parte.esBajaMedica);
                            setOpenNewParteDiario(true);
                          }}
                          className="h-7 px-2.5 text-xs text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDeleteParteDiario(parte.id)}
                          className="h-7 px-2.5 text-xs text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diagnóstico</span>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{parte.diagnostico}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exploración</span>
                        <p className="text-slate-700 dark:text-slate-300">{parte.exploracion || "N/A"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tratamiento</span>
                        <p className="text-slate-700 dark:text-slate-300">{parte.tratamiento || "N/A"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observaciones</span>
                        <p className="text-slate-700 dark:text-slate-300">{parte.observaciones || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* 5. VALORACIÓN ANTROPOMÉTRICA */}
        <TabsContent value="antropometria" className="space-y-6">
          <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-indigo-600" /> Nueva Valoración Antropométrica (Protocolo ISAK)
                </h3>
                <p className="text-xs text-slate-400">Ficha médica para <strong>{jugador.nombre}</strong> (ID: {jugador.id} | Edad: {jugador.edad} años)</p>
              </div>

              <Button onClick={() => setOpenNewAntro(!openNewAntro)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs gap-1.5 h-8">
                {openNewAntro ? "Plegar Formulario" : "+ Nueva Medición COMPLETA"}
              </Button>
            </div>

            <form onSubmit={handleAddAntropometriaSubmit} className="space-y-6">
              {/* DATOS BASE (OBLIGATORIOS) */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4" /> Datos Base (Obligatorios)
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">PESO (KG)</label>
                    <div className="flex items-center gap-2">
                      <Input type="number" step="0.1" value={pesoInput} onChange={e => setPesoInput(Number(e.target.value))} required className="h-9 text-xs rounded-xl" />
                      <span className="text-xs font-bold text-slate-400">kg</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ALTURA (CM)</label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={alturaInput} onChange={e => setAlturaInput(Number(e.target.value))} required className="h-9 text-xs rounded-xl" />
                      <span className="text-xs font-bold text-slate-400">cm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* REGISTRO DE PERÍMETROS Y LONGITUDES (CM) */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1.5">
                  <Dumbbell className="h-4 w-4" /> Registro de Perímetros y Longitudes (cm)
                </h4>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-indigo-900 text-white font-bold">
                        <th className="p-3 w-1/2">Perímetros (cm)</th>
                        <th className="p-3 w-1/2">Longitudes (cm)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      <tr>
                        <td className="p-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Brazo (Der)</span>
                          <Input value={brazoDer} onChange={e => setBrazoDer(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                        </td>
                        <td className="p-2.5 border-l border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Húmero</span>
                            <Input value={humero} onChange={e => setHumero(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="p-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Brazo (Izq)</span>
                          <Input value={brazoIzq} onChange={e => setBrazoIzq(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                        </td>
                        <td className="p-2.5 border-l border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Fémur (Der)</span>
                            <Input value={femurDer} onChange={e => setFemurDer(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="p-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Pecho / Tórax</span>
                          <Input value={pechoTorax} onChange={e => setPechoTorax(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                        </td>
                        <td className="p-2.5 border-l border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Fémur (Izq)</span>
                            <Input value={femurIzq} onChange={e => setFemurIzq(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="p-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Abdomen / Cintura</span>
                          <Input value={abdomenCintura} onChange={e => setAbdomenCintura(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                        </td>
                        <td className="p-2.5 border-l border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Muñeca</span>
                            <Input value={muneca} onChange={e => setMuneca(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td className="p-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Cadera / Glúteo</span>
                          <Input value={caderaGlut} onChange={e => setCaderaGlut(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                        </td>
                        <td className="p-2.5 border-l border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20"></td>
                      </tr>

                      <tr>
                        <td className="p-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Muslo (Der)</span>
                          <Input value={musloDer} onChange={e => setMusloDer(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                        </td>
                        <td className="p-2.5 border-l border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20"></td>
                      </tr>

                      <tr>
                        <td className="p-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Muslo (Izq)</span>
                          <Input value={musloIzq} onChange={e => setMusloIzq(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                        </td>
                        <td className="p-2.5 border-l border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20"></td>
                      </tr>

                      <tr>
                        <td className="p-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Gemelo (Der)</span>
                          <Input value={gemeloDer} onChange={e => setGemeloDer(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                        </td>
                        <td className="p-2.5 border-l border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20"></td>
                      </tr>

                      <tr>
                        <td className="p-2.5 flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Gemelo (Izq)</span>
                          <Input value={gemeloIzq} onChange={e => setGemeloIzq(e.target.value)} className="w-24 h-7 text-xs text-right font-mono rounded-lg" />
                        </td>
                        <td className="p-2.5 border-l border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PLIEGUES CUTÁNEOS (MM) - OPCIONAL */}
              <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1.5">
                  <Activity className="h-4 w-4" /> Pliegues Cutáneos (mm) - Opcional
                </h4>
                <div className="grid gap-3 sm:grid-cols-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">BICIPITAL</label>
                    <Input value={bicipital} onChange={e => setBicipital(e.target.value)} className="h-8 text-xs font-mono rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">TRICIPITAL</label>
                    <Input value={tricipital} onChange={e => setTricipital(e.target.value)} className="h-8 text-xs font-mono rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">SUBESCAPULAR</label>
                    <Input value={subescapular} onChange={e => setSubescapular(e.target.value)} className="h-8 text-xs font-mono rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">SUPRAILIACO</label>
                    <Input value={suprailiaco} onChange={e => setSuprailiaco(e.target.value)} className="h-8 text-xs font-mono rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">ABDOMINAL</label>
                    <Input value={abdominal} onChange={e => setAbdominal(e.target.value)} className="h-8 text-xs font-mono rounded-xl" />
                  </div>
                </div>
              </div>

              {/* SUGERENCIA MÉDICA (OPCIONAL) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sugerencia Médica / Nutricional (Opcional)</label>
                <Textarea
                  value={sugerenciaInput}
                  onChange={e => setSugerenciaInput(e.target.value)}
                  placeholder="Escriba la sugerencia médica aquí..."
                  rows={2}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5 h-9 px-5 shadow-xs">
                  <Save className="h-4 w-4" /> Registrar Valoración
                </Button>
              </div>
            </form>

            {/* HISTORIAL COMPLETO DE VALORACIONES ANTROPOMÉTRICAS TABLE */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Historial Completo de Valoraciones Antropométricas
                </h3>

                <div className="flex items-center gap-2">
                  <Button onClick={() => toast.success("Enviando reporte de valoración por WhatsApp...")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5 h-8">
                    <Send className="h-3.5 w-3.5" /> Enviar por WhatsApp
                  </Button>
                  <Button onClick={() => toast.success("Exportando tabla a Excel...")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5 h-8">
                    <FileText className="h-3.5 w-3.5" /> Imprimir / Excel
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold uppercase text-[11px] border-b border-slate-800">
                      <th className="p-3">FECHA</th>
                      <th className="p-3">PESO (KG)</th>
                      <th className="p-3">ALTURA (CM)</th>
                      <th className="p-3">IMC</th>
                      <th className="p-3">BRAZO/MUSLO (CM)</th>
                      <th className="p-3">PLIEGUES (MM)</th>
                      <th className="p-3">SUGERENCIA MÉDICA</th>
                      <th className="p-3 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {antropometrias.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{a.fecha}</td>
                        <td className="p-3 font-mono font-bold text-indigo-600">{a.pesoKg}</td>
                        <td className="p-3 font-mono">{(a.alturaCm / 100).toFixed(2)} m</td>
                        <td className="p-3 font-bold text-indigo-600">**{a.imc}**</td>
                        <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          B/D: {brazoDer} / M/D: {musloDer}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          T/S/A: {tricipital}/{subescapular}/{abdominal}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{a.sugerenciaNutricional || "Comer bien para ganar volumen"}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="xs" variant="ghost" onClick={() => toast.info("Editando valoración...")} className="h-7 w-7 p-0 text-emerald-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 6. CONTROL DE PESO EXPLICITO DE IMAGEN 2 */}
        <TabsContent value="peso" className="space-y-6">
          {/* BANNER HEADER */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-white shadow-xl text-center">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Control de Peso para {jugador.nombre}
            </h2>
          </div>

          <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Button asChild variant="outline" size="sm" className="h-8 text-xs font-bold rounded-xl border-slate-300">
                <Link to="/medico">← Volver al Historial Médico</Link>
              </Button>
            </div>

            {/* SECCIÓN REGISTRAR / EDITAR PESO */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                Registrar / Editar Peso
              </h3>

              <form onSubmit={handleAddAntropometriaSubmit} className="flex flex-wrap items-end gap-4">
                <div className="space-y-1 min-w-[200px]">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Peso Actual (kg):</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pesoInput}
                    onChange={e => setPesoInput(Number(e.target.value))}
                    placeholder="Ej: 75.50"
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1 flex-1 min-w-[240px]">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Peso Establecido (kg):</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pesoEstablecido}
                    onChange={e => setPesoEstablecido(Number(e.target.value))}
                    className="h-9 text-xs font-bold text-indigo-600 rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400">Puedes modificar el peso establecido para este registro.</p>
                </div>

                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 px-5 shadow-xs">
                  Registrar Peso
                </Button>
              </form>
            </div>

            {/* SECCIÓN HISTORIAL DE PESOS */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Historial de Pesos
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-indigo-600 text-white font-bold uppercase text-[10px]">
                      <th className="p-3">FECHA Y HORA</th>
                      <th className="p-3">PESO (KG)</th>
                      <th className="p-3">ESTABLECIDO (KG)</th>
                      <th className="p-3">DESVIACIÓN (KG)</th>
                      <th className="p-3 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {antropometrias.map((a) => {
                      const desviacion = (a.pesoKg - pesoEstablecido).toFixed(2);
                      const isDesvPos = Number(desviacion) > 0;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{a.fecha} - 08:30 AM</td>
                          <td className="p-3 font-mono font-bold text-indigo-600">{a.pesoKg.toFixed(2)} kg</td>
                          <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">{pesoEstablecido.toFixed(2)} kg</td>
                          <td className="p-3 font-mono font-bold">
                            <Badge className={`text-[10px] ${isDesvPos ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {isDesvPos ? `+${desviacion}` : desviacion} kg
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="xs" variant="ghost" onClick={() => {
                                setEditingAntropometriaId(a.id);
                                setPesoEstablecido(a.pesoKg);
                                toast.info("Editando peso seleccionado (" + a.pesoKg + " kg). Ingrese el nuevo peso arriba.");
                              }} className="h-7 text-xs text-emerald-600 font-bold">
                                <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                              </Button>
                              <Button size="xs" variant="ghost" onClick={() => handleDeleteAntropometria(a.id)} className="h-7 text-xs text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50">
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 7. CONTROL DE INFECCIONES EXPLICITO DE IMAGEN 1 */}
        <TabsContent value="infecciones" className="space-y-6">
          {/* BANNER HEADER */}
          <div className="bg-slate-700 border border-slate-600 p-5 rounded-3xl text-white shadow-xl text-center">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Control de Infecciones para {jugador.nombre}
            </h2>
          </div>

          <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button asChild variant="outline" size="sm" className="h-8 text-xs font-bold rounded-xl border-slate-300">
                <Link to="/medico">← Salir</Link>
              </Button>

              <Button onClick={() => setOpenNewInfeccion(!openNewInfeccion)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs h-9 px-5 shadow-xs gap-1.5">
                <Plus className="h-4 w-4" /> Añadir Infección
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                Historial de Infecciones
              </h3>

              {/* FILTRAR POR ESTADO PILLS */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Filtrar por Estado:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={filterInfeccion === "todos" ? "default" : "outline"}
                    onClick={() => setFilterInfeccion("todos")}
                    className={`h-8 text-xs font-bold rounded-xl ${filterInfeccion === "todos" ? "bg-indigo-600 text-white" : ""}`}
                  >
                    Todos Registrados
                  </Button>
                  <Button
                    size="sm"
                    variant={filterInfeccion === "activas" ? "default" : "outline"}
                    onClick={() => setFilterInfeccion("activas")}
                    className={`h-8 text-xs font-bold rounded-xl border-rose-300 text-rose-700 ${filterInfeccion === "activas" ? "bg-rose-600 text-white" : ""}`}
                  >
                    Baja sin Alta (Activas)
                  </Button>
                  <Button
                    size="sm"
                    variant={filterInfeccion === "resueltas" ? "default" : "outline"}
                    onClick={() => setFilterInfeccion("resueltas")}
                    className={`h-8 text-xs font-bold rounded-xl border-emerald-300 text-emerald-700 ${filterInfeccion === "resueltas" ? "bg-emerald-600 text-white" : ""}`}
                  >
                    Con Alta (Resueltas)
                  </Button>
                </div>
              </div>

              {/* FORMULARIO AÑADIR INFECCIÓN */}
              {openNewInfeccion && (
                <form onSubmit={handleAddInfeccionSubmit} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-900 dark:text-slate-100">
                    {editingInfeccionId ? "Editar Registro de Infección" : "Registrar Cuadro Infectocontagioso"}
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-[11px] font-bold">Tipo de Infección (*)</label>
                      <Input value={tipoInfeccionInput} onChange={e => setTipoInfeccionInput(e.target.value)} placeholder="Ej. Gastroenteritis aguda" required className="h-8 text-xs rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold">Fecha Inicio</label>
                      <Input type="date" value={fechaInicioInf} onChange={e => setFechaInicioInf(e.target.value)} className="h-8 text-xs rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold">Fecha Recuperación / Alta</label>
                      <Input type="date" value={fechaRecuperacionInf} onChange={e => setFechaRecuperacionInf(e.target.value)} className="h-8 text-xs rounded-lg" />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-[11px] font-bold">Tratamiento Indicado</label>
                      <Input value={tratamientoInf} onChange={e => setTratamientoInf(e.target.value)} placeholder="Ej. Aislamiento 72h + Rehidratación" className="h-8 text-xs rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold">Medicamentos Administrados</label>
                      <Input value={medicamentosInf} onChange={e => setMedicamentosInf(e.target.value)} placeholder="Ej. Probíoticos + Electrolitos" className="h-8 text-xs rounded-lg" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold">Observaciones</label>
                      <Input value={obsInfeccionInput} onChange={e => setObsInfeccionInput(e.target.value)} placeholder="Síntomas adicionales..." className="h-8 text-xs rounded-lg" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setOpenNewInfeccion(false); setEditingInfeccionId(null); }} className="h-7 text-xs">Cancelar</Button>
                    <Button type="submit" size="sm" className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold">
                      {editingInfeccionId ? "Guardar Cambios" : "Guardar Infección"}
                    </Button>
                  </div>
                </form>
              )}

              {/* TABLA DE INFECCIONES */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-500 text-white font-bold uppercase text-[10px]">
                      <th className="p-3">TIPO DE INFECCIÓN</th>
                      <th className="p-3">F. INICIO</th>
                      <th className="p-3">F. RECUPERACIÓN</th>
                      <th className="p-3">TRATAMIENTO</th>
                      <th className="p-3">MEDICAMENTOS</th>
                      <th className="p-3">OBSERVACIONES</th>
                      <th className="p-3">F. REGISTRO</th>
                      <th className="p-3 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {infecciones.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400 font-medium">
                          No hay registros de infecciones para este atleta que coincidan con el filtro seleccionado.
                        </td>
                      </tr>
                    ) : (
                      infecciones
                        .filter(inf => {
                          if (filterInfeccion === "activas") return !inf.altaEmitida;
                          if (filterInfeccion === "resueltas") return inf.altaEmitida;
                          return true;
                        })
                        .map((inf) => (
                          <tr key={inf.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                            <td className="p-3 font-bold text-rose-600 dark:text-rose-400">{inf.tipoInfeccion || inf.diagnostico}</td>
                            <td className="p-3 font-mono">{inf.fechaInicio || inf.fecha}</td>
                            <td className="p-3 font-mono">{inf.fechaRecuperacion || "Pendiente"}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{inf.tratamiento || "Aislamiento preventivo"}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">{inf.medicamentos || "Paracetamol"}</td>
                            <td className="p-3 text-slate-500">{inf.observaciones || "En seguimiento"}</td>
                            <td className="p-3 font-mono text-slate-400">{inf.fechaRegistro || inf.fecha}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button size="xs" variant="ghost" onClick={() => {
                                  setEditingInfeccionId(inf.id);
                                  setTipoInfeccionInput(inf.tipoInfeccion || inf.diagnostico || "");
                                  setFechaInicioInf(inf.fechaInicio || inf.fecha || "");
                                  setFechaRecuperacionInf(inf.fechaRecuperacion === "Pendiente" ? "" : inf.fechaRecuperacion || "");
                                  setTratamientoInf(inf.tratamiento || "");
                                  setMedicamentosInf(inf.medicamentos || "");
                                  setObsInfeccionInput(inf.observaciones || "");
                                  setOpenNewInfeccion(true);
                                }} className="h-7 text-xs text-rose-600 font-bold">
                                  <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                                </Button>
                                <Button size="xs" variant="ghost" onClick={() => handleDeleteInfeccion(inf.id)} className="h-7 text-xs text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50">
                                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 8. CONTROL DE TEMPERATURA EXPLICITO DE IMAGEN 2 */}
        <TabsContent value="temperatura" className="space-y-6">
          {/* BANNER HEADER */}
          <div className="bg-indigo-500/80 border border-indigo-400 p-5 rounded-3xl text-white shadow-xl text-center">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Registro de Temperatura Corporal - {jugador.nombre}
            </h2>
          </div>

          <Card className="shadow-card border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Button asChild variant="outline" size="sm" className="h-8 text-xs font-bold rounded-xl border-slate-300">
                <Link to="/medico">← Salir</Link>
              </Button>
            </div>

            {/* SECCIÓN REGISTRAR / EDITAR TEMPERATURA */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
                {editingTemperaturaId ? "Editar Temperatura Seleccionada" : "Registrar / Editar Temperatura"}
              </h3>

              <form onSubmit={handleAddTemperaturaSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Temperatura Corporal (°C) (*):</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={tempCelsius}
                    onChange={e => setTempCelsius(Number(e.target.value))}
                    placeholder="Ej: 36.5"
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Observaciones (Opcional):</label>
                  <Textarea
                    value={obsTempInput}
                    onChange={e => setObsTempInput(e.target.value)}
                    placeholder="Síntomas, medicación administrada, etc."
                    rows={3}
                    className="text-xs rounded-xl"
                  />
                </div>

                <div className="flex justify-end pt-1 gap-2">
                  {editingTemperaturaId && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingTemperaturaId(null)} className="h-9 text-xs">
                      Cancelar Edición
                    </Button>
                  )}
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 px-5 shadow-xs">
                    {editingTemperaturaId ? "Guardar Cambios de Temperatura" : "Guardar Registro de Temperatura"}
                  </Button>
                </div>
              </form>
            </div>

            {/* SECCIÓN HISTORIAL DE REGISTROS */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Historial de Registros
              </h3>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-indigo-500 text-white font-bold uppercase text-[10px]">
                      <th className="p-3">F. REGISTRO (LOCAL)</th>
                      <th className="p-3">TEMPERATURA (°C)</th>
                      <th className="p-3">OBSERVACIONES</th>
                      <th className="p-3 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {temperaturas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 font-medium">
                          No hay registros de temperatura para este atleta.
                        </td>
                      </tr>
                    ) : (
                      temperaturas.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{t.fecha} - {t.hora || "08:30 AM"}</td>
                          <td className="p-3 font-mono font-bold text-indigo-600">{t.temperaturaCelsius.toFixed(1)} °C</td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">{t.observaciones || "Auscultación normal"}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="xs" variant="ghost" onClick={() => {
                                setEditingTemperaturaId(t.id);
                                setTempCelsius(t.temperaturaCelsius);
                                setObsTempInput(t.observaciones || "");
                                toast.info("Formulario cargado con la temperatura de " + t.temperaturaCelsius + " °C");
                              }} className="h-7 text-xs text-emerald-600 font-bold">
                                <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                              </Button>
                              <Button size="xs" variant="ghost" onClick={() => handleDeleteTemperatura(t.id)} className="h-7 text-xs text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50">
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
