import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jugadores, sedes, formatCRC, type EstadoPago } from "@/lib/mock-data";
import { 
  Search, Plus, Filter, Download, ChevronRight, Upload, FileSpreadsheet, 
  CheckCircle2, AlertTriangle, Trash2, Edit, MoreVertical, CreditCard, 
  FileText, UserCheck, Power, Printer, DollarSign, FolderOpen, Users, ShieldAlert, BadgePercent, PowerOff, Star, Zap, Stethoscope
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RendimientoStore, { StoreJugador } from "@/lib/rendimiento-store";
import { useRole } from "@/hooks/use-role";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { downloadAthleteTemplate, parseAthletesFromFile, type ParsedAthlete, normalizeCategoryName } from "@/lib/excel-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export const Route = createFileRoute("/_app/jugadores/")({
  validateSearch: () => ({}),
  component: JugadoresPage,
});

const estadoPagoLabel: Record<EstadoPago, { label: string; cls: string }> = {
  al_dia: { label: "Al día", cls: "bg-success/15 text-success hover:bg-success/15" },
  pendiente: { label: "Pendiente", cls: "bg-warning/20 text-warning hover:bg-warning/20" },
  moroso: { label: "Moroso", cls: "bg-destructive/15 text-destructive hover:bg-destructive/15" },
};

function JugadoresPage() {
  const { role, coachName } = useRole();
  const activeOrgId = RendimientoStore.getActiveOrganizacionId();
  const [mounted, setMounted] = useState(false);
  const [jugadoresList, setJugadoresList] = useState<StoreJugador[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [q, setQ] = useState("");
  const [sede, setSede] = useState("todas");
  const [categoriaFilter, setCategoriaFilter] = useState("todas");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [openImportResult, setOpenImportResult] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importCount, setImportCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const loadData = () => {
      setJugadoresList(RendimientoStore.getJugadores());
      const cats = RendimientoStore.getCategorias();
      setCategories(cats);
      setCategoria(cats[0]?.nombre || "");
    };
    loadData();
    window.addEventListener("organizacionChanged", loadData);
    return () => window.removeEventListener("organizacionChanged", loadData);
  }, []);

  // Form states
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [identificacion, setIdentificacion] = useState("");
  const [dv, setDv] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("2015-06-15");
  const [edad, setEdad] = useState("11");
  const [genero, setGenero] = useState("Masculino");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [talla, setTalla] = useState("M");
  const [participoOtroClub, setParticipoOtroClub] = useState("No");
  const [clubAnterior, setClubAnterior] = useState("");

  // Datos Internos
  const [fechaInscripcion, setFechaInscripcion] = useState(new Date().toISOString().split("T")[0]);
  const [categoria, setCategoria] = useState(() => categories[0]?.nombre || "");
  const [modalidad, setModalidad] = useState("Competitivo");
  const [deportePrincipal, setDeportePrincipal] = useState("Fútbol");
  const [segundoDeporte, setSegundoDeporte] = useState("Ninguno");
  const [sedeId, setSedeId] = useState("s1");
  const [precioMensualidad, setPrecioMensualidad] = useState("35000");
  const [grupoClases, setGrupoClases] = useState("Grupo A - Lunes y Miércoles");
  const [numeroCamiseta, setNumeroCamiseta] = useState("10");

  // Apoderado
  const [apoderadoMismosDatos, setApoderadoMismosDatos] = useState(false);
  const [encargado, setEncargado] = useState("");
  const [apoderadoApellido, setApoderadoApellido] = useState("");
  const [parentesco, setParentesco] = useState("Padre");
  const [telefonoEncargado, setTelefonoEncargado] = useState("+506 ");
  const [whatsappEncargado, setWhatsappEncargado] = useState("+506 ");
  const [correoEncargado, setCorreoEncargado] = useState("");
  const [encargadoIdentificacion, setEncargadoIdentificacion] = useState("");
  const [apoderadoDV, setApoderadoDV] = useState("");
  const [apoderadoDireccion, setApoderadoDireccion] = useState("");
  const [apoderadoCiudad, setApoderadoCiudad] = useState("San José");
  const [apoderadoPais, setApoderadoPais] = useState("Costa Rica");

  // Datos Específicos Madre y Padre
  const [madreCedulaInput, setMadreCedulaInput] = useState("");
  const [madreNombreInput, setMadreNombreInput] = useState("");
  const [madreApellidoInput, setMadreApellidoInput] = useState("");
  const [madreTelefonoInput, setMadreTelefonoInput] = useState("");
  const [madreWhatsappInput, setMadreWhatsappInput] = useState("");
  const [madreCorreoInput, setMadreCorreoInput] = useState("");
  const [madreOcupacionInput, setMadreOcupacionInput] = useState("");
  const [madreEmpresaInput, setMadreEmpresaInput] = useState("");

  const [padreCedulaInput, setPadreCedulaInput] = useState("");
  const [padreNombreInput, setPadreNombreInput] = useState("");
  const [padreApellidoInput, setPadreApellidoInput] = useState("");
  const [padreTelefonoInput, setPadreTelefonoInput] = useState("");
  const [padreWhatsappInput, setPadreWhatsappInput] = useState("");
  const [padreCorreoInput, setPadreCorreoInput] = useState("");
  const [padreOcupacionInput, setPadreOcupacionInput] = useState("");
  const [padreEmpresaInput, setPadreEmpresaInput] = useState("");

  // Datos Médicos
  const [seguroMedico, setSeguroMedico] = useState("INS Cobertura Estudiantil");
  const [enfermedadGrave, setEnfermedadGrave] = useState("No");
  const [enfermedadRespiratoria, setEnfermedadRespiratoria] = useState("No");
  const [aptoCompetencia, setAptoCompetencia] = useState("Sí");
  const [ultimoControlMedico, setUltimoControlMedico] = useState("");
  const [descripcionEmergencia, setDescripcionEmergencia] = useState("");

  // Notificación de Bienvenida
  const [metodoNotificacion, setMetodoNotificacion] = useState<"correo" | "whatsapp">("whatsapp");
  const [mensajeBienvenida, setMensajeBienvenida] = useState(
`🏆 *DeportivOS — Confirmación de Registro*

¡Bienvenido(a) a la Academia! Se ha registrado satisfactoriamente el deportista:
• N° Registro: [N_REGISTRO]
• Nombre: [NOMBRE] [APELLIDO]
• Categoría: [CATEGORIA]
• Sede: [SEDE]

¡Nos vemos en el campo!`
  );

  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [posicion, setPosicion] = useState("DEL");
  const [consentLiberacion, setConsentLiberacion] = useState(false);
  const [consentDatos, setConsentDatos] = useState(false);
  const [consentFotos, setConsentFotos] = useState(false);
  const [firmaBase64, setFirmaBase64] = useState("");
  const [parentescoFirmante, setParentescoFirmante] = useState<"Madre" | "Padre" | "Tutor">("Madre");
  const [nombreFirmante, setNombreFirmante] = useState("");
  const [identificacionFirmante, setIdentificacionFirmante] = useState("");

  useEffect(() => {
    if (parentescoFirmante === "Madre" || parentescoFirmante === "Padre") {
      setNombreFirmante(encargado);
      setIdentificacionFirmante(encargadoIdentificacion);
    }
  }, [parentescoFirmante, encargado, encargadoIdentificacion]);

  // Edit player states
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editNombre, setEditNombre] = useState("");
  const [editIdentificacion, setEditIdentificacion] = useState("");
  const [editFechaNacimiento, setEditFechaNacimiento] = useState("2015-06-15");
  const [editGenero, setEditGenero] = useState("Mixto");
  const [editDisciplina, setEditDisciplina] = useState("Fútbol");
  const [editCategoria, setEditCategoria] = useState("");
  const [editSedeId, setEditSedeId] = useState("s1");
  const [editCorreo, setEditCorreo] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editEncargado, setEditEncargado] = useState("");
  const [editParentesco, setEditParentesco] = useState("Padre");
  const [editTelefonoEncargado, setEditTelefonoEncargado] = useState("");
  const [editCorreoEncargado, setEditCorreoEncargado] = useState("");
  const [editPosicion, setEditPosicion] = useState("DEL");
  const [editEncargadoIdentificacion, setEditEncargadoIdentificacion] = useState("");
  const [editConsentLiberacion, setEditConsentLiberacion] = useState(false);
  const [editConsentDatos, setEditConsentDatos] = useState(false);
  const [editConsentFotos, setEditConsentFotos] = useState(false);
  const [editParentescoFirmante, setEditParentescoFirmante] = useState<"Madre" | "Padre" | "Tutor">("Madre");
  const [editNombreFirmante, setEditNombreFirmante] = useState("");
  const [editIdentificacionFirmante, setEditIdentificacionFirmante] = useState("");

  useEffect(() => {
    if (editParentescoFirmante === "Madre" || editParentescoFirmante === "Padre") {
      setEditNombreFirmante(editEncargado);
      setEditIdentificacionFirmante(editEncargadoIdentificacion);
    }
  }, [editParentescoFirmante, editEncargado, editEncargadoIdentificacion]);

  const handleOpenEdit = (j: StoreJugador) => {
    setEditId(j.id);
    setEditNombre(j.nombre);
    setEditIdentificacion(j.identificacion);
    setEditFechaNacimiento(j.fechaNacimiento || "2015-06-15");
    setEditGenero(j.genero || "Mixto");
    setEditDisciplina(j.disciplina || "Fútbol");
    setEditCategoria(j.categoria || "");
    setEditSedeId(j.sedeId || "s1");
    setEditCorreo(j.correo || "");
    setEditTelefono(j.telefono || "");
    setEditEncargado(j.encargado || "");
    setEditParentesco(j.parentesco || "Padre");
    setEditTelefonoEncargado(j.telefonoEncargado || "");
    setEditCorreoEncargado(j.correoEncargado || "");
    setEditPosicion(j.posicion || "DEL");
    setEditEncargadoIdentificacion(j.encargadoIdentificacion || "");
    setEditConsentLiberacion(j.consentLiberacion || false);
    setEditConsentDatos(j.consentDatos || false);
    setEditConsentFotos(j.consentFotos || false);
    setEditParentescoFirmante(j.parentescoFirmante || "Madre");
    setEditNombreFirmante(j.nombreFirmante || "");
    setEditIdentificacionFirmante(j.identificacionFirmante || "");
    setOpenEdit(true);
  };

  const handleUpdatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombre || !editIdentificacion || !editEncargado || !editTelefonoEncargado) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const assignedSede = sedes.find(s => s.id === editSedeId)?.nombre ?? "Sede Central";

    RendimientoStore.updateJugador(editId, {
      nombre: editNombre,
      identificacion: editIdentificacion,
      fechaNacimiento: editFechaNacimiento,
      genero: editGenero,
      disciplina: editDisciplina,
      categoria: editCategoria,
      sede: assignedSede,
      sedeId: editSedeId,
      correo: editCorreo,
      telefono: editTelefono,
      encargado: editEncargado,
      parentesco: editParentesco,
      telefonoEncargado: editTelefonoEncargado,
      correoEncargado: editCorreoEncargado,
      posicion: editPosicion,
      encargadoIdentificacion: editEncargadoIdentificacion,
      consentLiberacion: editConsentLiberacion,
      consentDatos: editConsentDatos,
      consentFotos: editConsentFotos,
      parentescoFirmante: editParentescoFirmante,
      nombreFirmante: editNombreFirmante,
      identificacionFirmante: editIdentificacionFirmante,
    });

    setOpenEdit(false);
    toast.success("Perfil del jugador actualizado con éxito");
    setJugadoresList(RendimientoStore.getJugadores());
  };

  const handleDeletePlayer = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${name}? Esta acción no se puede deshacer y borrará al jugador del sistema.`)) {
      RendimientoStore.deleteJugador(id);
      toast.success("Jugador eliminado con éxito");
      setJugadoresList(RendimientoStore.getJugadores());
    }
  };

  // Derive coach's assigned category for filtering
  const coachCategoryFilter = useMemo(() => {
    if (role !== "coach" || !coachName) return null;
    const coaches = RendimientoStore.get<any[]>("entrenadores_dynamics", []);
    const myCoach = coaches.find(c => c.nombre === coachName && (!activeOrgId || c.organizacion_id === activeOrgId));
    return myCoach?.categoria || null;
  }, [role, coachName, activeOrgId]);

  const filtered = useMemo(() => {
    const cleanString = (str: string) =>
      String(str || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const searchStr = cleanString(q);
    const tokens = searchStr.split(/\s+/).filter(Boolean);
    
    const list = jugadoresList.filter((j) => {
      // Filter by active organization
      if (activeOrgId && j.organizacion_id && j.organizacion_id !== activeOrgId) return false;

      // If coach role, only show players from their assigned team category
      if (coachCategoryFilter) {
        if (normalizeCategoryName(j.categoria || "") !== normalizeCategoryName(coachCategoryFilter)) return false;
      }

      const matchS = sede === "todas" || j.sedeId === sede;
      if (!matchS) return false;
      
      const matchC = categoriaFilter === "todas" || normalizeCategoryName(j.categoria) === normalizeCategoryName(categoriaFilter);
      if (!matchC) return false;
      
      if (tokens.length === 0) return true;
      
      const name = cleanString(j.nombre);
      const id = cleanString(j.identificacion);
      const email = cleanString(j.correo);
      
      return tokens.every(token => 
        name.includes(token) || 
        id.includes(token) || 
        email.includes(token)
      );
    });

    const getRelevanceScore = (j: StoreJugador) => {
      if (tokens.length === 0) return 0;
      const name = cleanString(j.nombre);
      
      if (name.startsWith(searchStr)) return 3;
      
      const nameMatchesAllTokens = tokens.every(token => name.includes(token));
      if (nameMatchesAllTokens) return 2;
      
      const nameMatchesAnyToken = tokens.some(token => name.includes(token));
      if (nameMatchesAnyToken) return 1;
      
      return 0;
    };

    // Sort by relevance score (descending), then alphabetically by last name (apellidos)
    return list.sort((a, b) => {
      const scoreA = getRelevanceScore(a);
      const scoreB = getRelevanceScore(b);
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      const nameA = cleanString(a.nombre || "");
      const nameB = cleanString(b.nombre || "");
      
      return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
    });
  }, [jugadoresList, q, sede, categoriaFilter]);

  const playerLoadsMap = useMemo(() => {
    const data = RendimientoStore.getPlayerLoadData();
    return new Map(data.map(d => [d.jugadorId, d.semaforo]));
  }, [jugadoresList]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    jugadoresList.forEach((j) => {
      const cat = j.categoria || "Sin categoría";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [jugadoresList]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const view = filtered.slice((page - 1) * perPage, page * perPage);

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const fullNombre = apellido ? `${nombre} ${apellido}`.trim() : nombre;
    if (!fullNombre || !identificacion || !encargado || !telefonoEncargado) {
      toast.error("Por favor completa los campos obligatorios (*)");
      return;
    }

    const assignedSede = sedes.find(s => s.id === sedeId)?.nombre ?? "Sede Central";
    const fullIdentificacion = dv ? `${identificacion}-${dv}` : identificacion;
    const fullEncargadoIdentificacion = apoderadoDV ? `${encargadoIdentificacion}-${apoderadoDV}` : encargadoIdentificacion;
    const fullEncargadoNombre = apoderadoApellido ? `${encargado} ${apoderadoApellido}`.trim() : encargado;

    RendimientoStore.addJugador({
      nombre: fullNombre,
      identificacion: fullIdentificacion,
      fechaNacimiento,
      genero,
      disciplina: deportePrincipal,
      categoria,
      sede: assignedSede,
      decaySedeId: sedeId,
      sedeId,
      correo: correo || `${fullNombre.toLowerCase().replace(/\s+/g, "")}@correo.com`,
      telefono: telefono || "+506 8888 9999",
      encargado: fullEncargadoNombre,
      parentesco,
      telefonoEncargado,
      correoEncargado: correoEncargado || "encargado@correo.com",
      posicion,
      avatar: fotoPerfil || undefined,
      peso: parseFloat(peso) || 40,
      altura: parseFloat(altura) * 100 || 140,
      montoFinal: parseFloat(precioMensualidad) || 35000,
      mensualidadBase: parseFloat(precioMensualidad) || 35000,
      numero: parseInt(numeroCamiseta) || 10,

      // Campos unificados
      barrio: "San Pedro",
      direccion: apoderadoDireccion || `${apoderadoCiudad}, ${apoderadoPais}`,
      telefonoResidencia: telefonoEncargado || "+506 2222 3333",
      tipoSangre: "O+",
      seguroEps: seguroMedico || "INS — Instituto Nacional de Seguros",
      enfermedades: descripcionEmergencia || "",
      cirugias: "",
      alergiasInput: descripcionEmergencia || "",
      lesionesInput: "",
      institucionEducativa: clubAnterior || "N/A",
      gradoActual: modalidad || "N/A",
      peso: parseFloat(peso) || 40,
      altura: parseFloat(altura) * 100 || 140,

      // Mapear datos completos de los padres
      madreNombre: (madreNombreInput || madreApellidoInput) ? `${madreNombreInput} ${madreApellidoInput}`.trim() : (parentesco === "Madre" ? fullEncargadoNombre : "—"),
      madreTelefono: madreTelefonoInput || (parentesco === "Madre" ? telefonoEncargado : "—"),
      madreCorreo: madreCorreoInput || (parentesco === "Madre" ? correoEncargado : "—"),
      madreOcupacion: madreOcupacionInput || "Independiente",
      madreEmpresa: madreEmpresaInput || "Empresa Privada",
      madreIdentificacion: madreCedulaInput || (parentesco === "Madre" ? fullEncargadoIdentificacion : "—"),

      padreNombre: (padreNombreInput || padreApellidoInput) ? `${padreNombreInput} ${padreApellidoInput}`.trim() : (parentesco === "Padre" ? fullEncargadoNombre : "—"),
      padreTelefono: padreTelefonoInput || (parentesco === "Padre" ? telefonoEncargado : "—"),
      padreCorreo: padreCorreoInput || (parentesco === "Padre" ? correoEncargado : "—"),
      padreOcupacion: padreOcupacionInput || "Profesional",
      padreEmpresa: padreEmpresaInput || "Empresa Privada",
      padreIdentificacion: padreCedulaInput || (parentesco === "Padre" ? fullEncargadoIdentificacion : "—"),

      // Campos de aspecto legal e identificación de encargado
      encargadoIdentificacion,
      consentLiberacion,
      consentDatos,
      consentFotos,
      firmaBase64,
      parentescoFirmante,
      nombreFirmante,
      identificacionFirmante,
    } as any);

    // Refresh list
    setJugadoresList(RendimientoStore.getJugadores());
    setOpenCreate(false);

    // Reset fields
    setNombre("");
    setIdentificacion("");
    setFechaNacimiento("2015-06-15");
    setGenero("Mixto");
    setDisciplina("Fútbol");
    setCategoria(categories[0]?.nombre || "");
    setSedeId("s1");
    setCorreo("");
    setTelefono("");
    setEncargado("");
    setParentesco("Padre");
    setTelefonoEncargado("");
    setCorreoEncargado("");
    setPosicion("DEL");
    setEncargadoIdentificacion("");
    setConsentLiberacion(false);
    setConsentDatos(false);
    setConsentFotos(false);
    setFirmaBase64("");
    setParentescoFirmante("Madre");
    setNombreFirmante("");
    setIdentificacionFirmante("");

    toast.success("Jugador registrado con éxito");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const cats = RendimientoStore.getCategorias();
      const { valid, errors } = await parseAthletesFromFile(file, cats);
      const playersToBatch = valid.map(athlete => ({
        nombre: athlete.nombre,
        identificacion: athlete.identificacion,
        fechaNacimiento: athlete.fechaNacimiento,
        genero: athlete.genero,
        disciplina: athlete.disciplina,
        categoria: athlete.categoria,
        sede: "Sede Central",
        decaySedeId: "s1",
        sedeId: "s1",
        correo: athlete.correo,
        telefono: athlete.telefono,
        encargado: athlete.encargado || "Sin asignar",
        parentesco: athlete.parentesco,
        telefonoEncargado: athlete.telefonoEncargado || athlete.telefono,
        correoEncargado: athlete.correoEncargado || athlete.correo,
        posicion: athlete.posicion,
        barrio: "San Pedro",
        direccion: "San José, Costa Rica",
        telefonoResidencia: "+506 2222 3333",
        peso: 60,
        altura: 170,
        lateralidad: "Derecha",
        coberturaMedica: "INS",
        tipoSangre: "O+",
        alergias: "Ninguna",
        medicamentos: "Ninguno",
        clubProcedencia: "Ninguno",
        esBecado: false,
        porcentajeBeca: 0,
        mensualidadBase: 25000,
        montoFinal: 25000,
        diaPago: 5,
        facturacionNombre: athlete.encargado || athlete.nombre,
        facturacionIdentificacion: athlete.identificacion,
        facturacionCorreo: athlete.correo,
        cuentaBancaria: "CR0301511234567890",
        restablecerPermisos: false,
      }));

      RendimientoStore.addJugadoresBatch(playersToBatch);
      const added = playersToBatch.length;
      setJugadoresList(RendimientoStore.getJugadores());
      setImportCount(added);
      setImportErrors(errors);
      setOpenImportResult(true);
    } catch (err) {
      toast.error("Error al importar el archivo Excel");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearAllPlayers = () => {
    if (confirm("¿Estás seguro de que deseas eliminar todos los jugadores registrados? Esto limpiará la lista para que puedas volver a subir tus plantillas de forma limpia.")) {
      RendimientoStore.clearJugadores();
      setJugadoresList([]);
      setPage(1);
      toast.success("Se han eliminado todos los jugadores registrados.");
    }
  };

  // Quick Payment Modal State
  const [openQuickPayment, setOpenQuickPayment] = useState(false);
  const [paymentPlayer, setPaymentPlayer] = useState<StoreJugador | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("25000");
  const [paymentConcept, setPaymentConcept] = useState("Mensualidad");

  // Modals for suspensions
  const [openSuspendModal, setOpenSuspendModal] = useState(false);
  const [targetSuspendPlayer, setTargetSuspendPlayer] = useState<StoreJugador | null>(null);
  const [suspendRazon, setSuspendRazon] = useState("Lesión física");
  const [suspendDetalle, setSuspendDetalle] = useState("");
  
  // Modal for listing all suspended athletes
  const [openSuspendedListModal, setOpenSuspendedListModal] = useState(false);

  const handleOpenSuspendModal = (player: StoreJugador) => {
    if (player.esSuspendido) {
      // Reactivar jugador
      RendimientoStore.updateJugador(player.id, {
        esSuspendido: false,
        fechaSuspension: "",
        razonSuspension: "",
        detalleSuspension: "",
      });
      setJugadoresList(RendimientoStore.getJugadores());
      toast.success(`Jugador ${player.nombre} reactivado correctamente.`);
    } else {
      // Abrir modal para especificar el motivo
      setTargetSuspendPlayer(player);
      setSuspendRazon("Lesión física");
      setSuspendDetalle("");
      setOpenSuspendModal(true);
    }
  };

  const handleConfirmSuspension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSuspendPlayer) return;

    const fecha = new Date().toISOString().split("T")[0];
    RendimientoStore.updateJugador(targetSuspendPlayer.id, {
      esSuspendido: true,
      fechaSuspension: fecha,
      razonSuspension: suspendRazon,
      detalleSuspension: suspendDetalle || suspendRazon,
    });

    if (suspendRazon.toLowerCase().includes("lesión") || suspendRazon.toLowerCase().includes("lesion") || suspendRazon.toLowerCase().includes("física") || suspendRazon.toLowerCase().includes("fisica") || suspendRazon.toLowerCase().includes("médica") || suspendRazon.toLowerCase().includes("medica")) {
      RendimientoStore.addLesion({
        jugadorId: targetSuspendPlayer.id,
        jugador: targetSuspendPlayer.nombre,
        fecha: fecha,
        tipo: suspendDetalle || suspendRazon || "Lesión física",
        zonaCorporal: "General / Reposo Deportivo",
        gravedad: "Moderada",
        diagnostico: suspendDetalle || "Reporte de suspensión médica por lesión física",
        tratamiento: ["Reposo deportivo", "Monitoreo médico"],
        dolor: 6,
        movilidad: 60,
        progresoRtp: 10,
        retornoChecklist: { altaMedica: false, altaDeportiva: false, sinDolor: false, movilidadCompleta: false },
        completada: false,
        cargaPermitida: 0,
      });
    }

    setJugadoresList(RendimientoStore.getJugadores());
    toast.warning(`Jugador ${targetSuspendPlayer.nombre} suspendido. Motivo: ${suspendRazon}`);
    setOpenSuspendModal(false);
    setTargetSuspendPlayer(null);
  };

  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentPlayer) return;
    toast.success(`Pago de ₡${parseInt(paymentAmount).toLocaleString("es-CR")} registrado exitosamente para ${paymentPlayer.nombre}`);
    setOpenQuickPayment(false);
  };

  const kpis = useMemo(() => {
    const total = jugadoresList.length;
    const alDia = jugadoresList.filter(j => j.estadoPago === "al_dia").length;
    const morosos = jugadoresList.filter(j => j.estadoPago === "moroso" || j.estadoPago === "pendiente").length;
    const suspendidos = jugadoresList.filter(j => j.esSuspendido).length;
    const activos = total - suspendidos;

    return { total, activos, alDia, morosos, suspendidos };
  }, [jugadoresList]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Jugadores</h1>
            <p className="text-sm text-muted-foreground">Cargando jugadores...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Jugadores</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} atletas en la nómina activa</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadAthleteTemplate()} className="gap-1.5 text-xs h-9 border-primary/30 text-primary hover:bg-primary/5 font-semibold">
            <Download className="h-4 w-4" /> Plantilla Excel
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} className="gap-1.5 text-xs h-9 font-semibold">
            <Upload className="h-4 w-4" /> {importing ? "Importando..." : "Importar Excel"}
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
          {jugadoresList.length > 0 && (
            <Button variant="destructive" onClick={handleClearAllPlayers} className="gap-1.5 text-xs h-9 font-semibold bg-red-600 hover:bg-red-700 text-white">
              <Trash2 className="h-4 w-4" /> Vaciar
            </Button>
          )}
          <Button asChild className="bg-gradient-to-r from-rose-600 via-indigo-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-black text-xs h-9 rounded-2xl gap-1.5 shadow-md animate-pulse ring-2 ring-rose-500/40">
            <Link to="/medico">
              <Stethoscope className="h-4 w-4" /> Área Médica
            </Link>
          </Button>
          <Button onClick={() => setOpenCreate(true)} className="bg-gradient-primary shadow-elegant gap-1.5 text-xs h-9 font-semibold">
            <Plus className="h-4 w-4" /> Nuevo jugador
          </Button>
        </div>
      </div>

      {/* Modern KPI Summary Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-3.5 border-l-4 border-l-primary bg-card/60 backdrop-blur-sm shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>TOTAL ATLETAS</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{kpis.total}</p>
        </Card>
        <Card className="p-3.5 border-l-4 border-l-blue-500 bg-card/60 backdrop-blur-sm shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>ACTIVOS</span>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{kpis.activos}</p>
        </Card>
        <Card className="p-3.5 border-l-4 border-l-emerald-500 bg-card/60 backdrop-blur-sm shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>AL DÍA</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{kpis.alDia}</p>
        </Card>
        <Card className="p-3.5 border-l-4 border-l-amber-500 bg-card/60 backdrop-blur-sm shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>PENDIENTES/MOROSOS</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{kpis.morosos}</p>
        </Card>
        <Card 
          onClick={() => setOpenSuspendedListModal(true)} 
          className="p-3.5 border-l-4 border-l-rose-500 bg-card/60 backdrop-blur-sm shadow-sm space-y-1 col-span-2 sm:col-span-1 cursor-pointer hover:shadow-md hover:border-l-rose-600 transition-all group"
        >
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold group-hover:text-rose-600 transition-colors">
            <span>SUSPENDIDOS</span>
            <PowerOff className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{kpis.suspendidos}</p>
            <span className="text-[10px] text-rose-500 font-bold hover:underline">Ver Lista →</span>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-card border-border/60">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, apellido, cédula o club..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9 h-9 text-xs" />
            </div>
            <Select value={categoriaFilter} onValueChange={(v) => { setCategoriaFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sede} onValueChange={(v) => { setSede(v); setPage(1); }}>
              <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sedes</SelectItem>
                {sedes.map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5"><Filter className="h-3.5 w-3.5" /> Filtros</Button>
          </div>

          <div className="rounded-xl border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100/70 dark:bg-slate-900/70 hover:bg-slate-100/70 dark:hover:bg-slate-900/70">
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Jugador</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Deporte / Camiseta</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Categoría</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300">Sede</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">Estado / Mensualidad</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">Estatus</TableHead>
                  <TableHead className="text-right pr-6 w-24 text-xs font-bold text-slate-700 dark:text-slate-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.map((j) => {
                  const isSuspended = !!j.esSuspendido;
                  return (
                    <TableRow key={j.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${isSuspended ? "bg-rose-500/5 dark:bg-rose-950/20" : ""}`}>
                      <TableCell>
                        <Link to="/jugadores/$id" params={{ id: j.id }} className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                            <AvatarImage src={j.avatar} />
                            <AvatarFallback>{(j.nombre || "J")[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-bold group-hover:text-primary transition-colors flex items-center gap-1.5">
                              {j.nombre}
                              {isSuspended && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-rose-500/10 text-rose-500 border-rose-500/30 font-bold uppercase">
                                  SUSPENDIDO ({j.razonSuspension || "En revisión"})
                                </Badge>
                              )}
                              {(() => {
                                const sem = playerLoadsMap.get(j.id);
                                if (sem === "rojo") return <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Riesgo Alto" />;
                                if (sem === "amarillo") return <span className="inline-block h-2 w-2 rounded-full bg-amber-500" title="Sobrecarga" />;
                                if (sem === "verde") return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Óptimo" />;
                                return null;
                              })()}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{j.identificacion} · {j.edad} años</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className="font-semibold">{j.disciplina || "Fútbol"}</span>
                          <span className="text-muted-foreground block text-[10px]">Camiseta: #{j.numero || 10}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] font-bold">{j.categoria}</Badge></TableCell>
                      <TableCell className="text-xs font-medium">{j.sede}</TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <Badge className={estadoPagoLabel[j.estadoPago].cls} variant="secondary">
                            {estadoPagoLabel[j.estadoPago].label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            ₡{(j.montoFinal || 25000).toLocaleString("es-CR")} / mes
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSuspendModal(j)}
                          className={`h-7 px-2 text-[10px] font-bold rounded-full gap-1 ${
                            isSuspended 
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 hover:bg-rose-200" 
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-200"
                          }`}
                          title={isSuspended ? "Reactivar deportista" : "Suspender deportista con motivo"}
                        >
                          <Power className="h-3 w-3" />
                          {isSuspended ? "Suspendido" : "Activo"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase">
                              {j.nombre}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => {
                              setPaymentPlayer(j);
                              setPaymentAmount(String(j.montoFinal || 25000));
                              setOpenQuickPayment(true);
                            }} className="gap-2 text-xs font-medium cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-emerald-600">
                              <DollarSign className="h-4 w-4" /> Registrar Pago
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild className="gap-2 text-xs font-medium cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-600">
                              <Link to="/jugadores/$id" params={{ id: j.id }}>
                                <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> Ficha Técnica Pro
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild className="gap-2 text-xs font-medium cursor-pointer">
                              <Link to="/jugadores/$id" params={{ id: j.id }}>
                                <FileText className="h-4 w-4" /> Ver Ficha Legal
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild className="gap-2 text-xs font-medium cursor-pointer text-indigo-600 dark:text-indigo-400 focus:text-indigo-600">
                              <Link to="/medico/jugador/$id" params={{ id: j.id }}>
                                <Stethoscope className="h-4 w-4 text-indigo-500" /> Expediente Médico & Fisioterapia
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleOpenEdit(j)} className="gap-2 text-xs font-medium cursor-pointer">
                              <Edit className="h-4 w-4" /> Editar Datos
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => handleDeletePlayer(j.id, j.nombre)} className="gap-2 text-xs font-medium cursor-pointer text-red-600 focus:text-red-600">
                              <Trash2 className="h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/40 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">Distribución:</span>
              <span className="bg-zinc-150 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-full font-semibold">
                Total: {jugadoresList.length}
              </span>
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <span key={cat} className="bg-primary/5 text-primary border border-primary/15 px-2.5 py-0.5 rounded-full font-medium">
                  {cat}: {count}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span>Mostrar:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 w-16 px-1.5 rounded border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <p className="text-muted-foreground">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Payment Modal */}
      <Dialog open={openQuickPayment} onOpenChange={setOpenQuickPayment}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl p-5 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <DollarSign className="h-5 w-5 text-emerald-500" /> Registrar Pago de Mensualidad
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {paymentPlayer && `Deportista: ${paymentPlayer.nombre} (${paymentPlayer.categoria})`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterPaymentSubmit} className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Monto a Cobrar (₡):</Label>
              <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required className="text-sm font-bold text-emerald-600" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Concepto:</Label>
              <Select value={paymentConcept} onValueChange={setPaymentConcept}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensualidad">Mensualidad Ordinaria</SelectItem>
                  <SelectItem value="Matrícula">Matrícula de Inscripción</SelectItem>
                  <SelectItem value="Uniforme">Kit de Uniforme</SelectItem>
                  <SelectItem value="Torneo">Cuota de Torneo / Liga</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenQuickPayment(false)}>Cancelar</Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Confirmar Pago
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> Editar Ficha de Jugador
            </DialogTitle>
            <DialogDescription>
              Modifica los datos personales del deportista y la información de su encargado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePlayer} className="space-y-4 pt-2">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider border-b pb-1">1. Datos Personales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="editPlayerName">Nombre completo *</Label>
                <Input id="editPlayerName" placeholder="Nombre completo" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editPlayerId">Identificación *</Label>
                <Input id="editPlayerId" placeholder="Identificación" value={editIdentificacion} onChange={(e) => setEditIdentificacion(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editPlayerBirth">Fecha de Nacimiento *</Label>
                <Input id="editPlayerBirth" type="date" value={editFechaNacimiento} onChange={(e) => setEditFechaNacimiento(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Género</Label>
                <Select value={editGenero} onValueChange={setEditGenero}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Mixto">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sede</Label>
                <Select value={editSedeId} onValueChange={setEditSedeId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sedes.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Disciplina</Label>
                <Select value={editDisciplina} onValueChange={setEditDisciplina}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fútbol">Fútbol</SelectItem>
                    <SelectItem value="Baloncesto">Baloncesto</SelectItem>
                    <SelectItem value="Voleibol">Voleibol</SelectItem>
                    <SelectItem value="Natación">Natación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                {categories.length === 0 ? (
                  <Input
                    placeholder="Ej. U9, Sub-12 Fútbol"
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                  />
                ) : (
                  <select
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-card text-sm text-foreground"
                  >
                    <option value="">-- Sin categoría --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.nombre}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider border-b pb-1 pt-2">2. Datos de Contacto y Encargado</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="editPlayerEmail">Correo del Jugador (Opcional)</Label>
                <Input id="editPlayerEmail" type="email" placeholder="correo@ejemplo.com" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editPlayerPhone">Teléfono del Jugador (Opcional)</Label>
                <Input id="editPlayerPhone" placeholder="+506 8888 8888" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editParentName">Nombre del Encargado *</Label>
                <Input id="editParentName" placeholder="Nombre completo" value={editEncargado} onChange={(e) => setEditEncargado(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Parentesco</Label>
                <Select value={editParentesco} onValueChange={setEditParentesco}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Madre">Madre</SelectItem>
                    <SelectItem value="Padre">Padre</SelectItem>
                    <SelectItem value="Tutor">Tutor / Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editParentPhone">Teléfono del Encargado *</Label>
                <Input id="editParentPhone" placeholder="+506 8888 8888" value={editTelefonoEncargado} onChange={(e) => setEditTelefonoEncargado(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editParentEmail">Correo del Encargado</Label>
                <Input id="editParentEmail" type="email" placeholder="encargado@ejemplo.com" value={editCorreoEncargado} onChange={(e) => setEditCorreoEncargado(e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="editParentIdentificacion">Identificación del Encargado *</Label>
                <Input id="editParentIdentificacion" placeholder="Ej. 1-1234-5678" value={editEncargadoIdentificacion} onChange={(e) => setEditEncargadoIdentificacion(e.target.value)} required />
              </div>
            </div>

            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider border-b pb-1 pt-4">3. Aspecto Legal y Conformidad</h3>
            <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-white/10 pb-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider">Parentesco del Firmante</Label>
                  <select
                    className="w-full h-8 px-2 rounded border bg-card text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-zinc-800 dark:text-zinc-200"
                    value={editParentescoFirmante}
                    onChange={(e) => {
                      const val = e.target.value as "Madre" | "Padre" | "Tutor";
                      setEditParentescoFirmante(val);
                      if (val === "Madre" || val === "Padre") {
                        setEditNombreFirmante(editEncargado);
                        setEditIdentificacionFirmante(editEncargadoIdentificacion);
                      } else {
                        setEditNombreFirmante("");
                        setEditIdentificacionFirmante("");
                      }
                    }}
                  >
                    <option value="Madre">Madre</option>
                    <option value="Padre">Padre</option>
                    <option value="Tutor">Tutor / Legal</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider">Nombre del Firmante</Label>
                  <Input
                    className="h-8 text-xs bg-card border"
                    value={editNombreFirmante}
                    onChange={(e) => setEditNombreFirmante(e.target.value)}
                    disabled={editParentescoFirmante !== "Tutor"}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider">Identificación del Firmante</Label>
                  <Input
                    className="h-8 text-xs bg-card border"
                    value={editIdentificacionFirmante}
                    onChange={(e) => setEditIdentificacionFirmante(e.target.value)}
                    disabled={editParentescoFirmante !== "Tutor"}
                    placeholder="Ej. 1-1234-5678"
                    required
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  checked={editConsentLiberacion}
                  onChange={e => setEditConsentLiberacion(e.target.checked)}
                />
                <span>Acepto la Liberación de Responsabilidad Social.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  checked={editConsentDatos}
                  onChange={e => setEditConsentDatos(e.target.checked)}
                />
                <span>Acepto la Política de Tratamiento de Datos.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  checked={editConsentFotos}
                  onChange={e => setEditConsentFotos(e.target.checked)}
                />
                <span>Acepto el Permiso de Toma de Fotografías.</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gradient-primary text-white font-semibold">Guardar Cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Player Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[950px] max-h-[90vh] overflow-y-auto p-0 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          {/* Header Banner */}
          <div className="bg-gradient-primary px-6 py-4 text-white font-extrabold text-base tracking-wide flex items-center justify-between rounded-t-2xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>REGISTRO DE DEPORTISTA</span>
            </div>
            <span className="text-xs font-normal opacity-80">DeportivOS — Ficha de Ingreso</span>
          </div>

          <form onSubmit={handleCreatePlayer} className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 1. DATOS DEL DEPORTISTA */}
              <div className="space-y-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" /> DATOS DEL DEPORTISTA
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Nombre <span className="text-red-500">*</span></Label>
                      <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Apellido <span className="text-red-500">*</span></Label>
                      <Input placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Sexo <span className="text-red-500">*</span></Label>
                      <Select value={genero} onValueChange={setGenero}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Femenino">Femenino</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Foto Perfil</Label>
                      <Input type="file" accept="image/*" className="h-9 text-[11px] cursor-pointer bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setFotoPerfil(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <div className="space-y-1 col-span-3">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Documento Identidad</Label>
                      <div className="flex gap-1.5">
                        <Input placeholder="Cédula / RUT" value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} required className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 flex-1" />
                        <Input placeholder="DV" value={dv} onChange={(e) => setDv(e.target.value)} className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 w-12 text-center" />
                      </div>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Fecha Nacimiento</Label>
                      <Input type="date" value={fechaNacimiento} onChange={(e) => {
                        setFechaNacimiento(e.target.value);
                        if (e.target.value) {
                          const age = new Date().getFullYear() - new Date(e.target.value).getFullYear();
                          setEdad(String(age));
                        }
                      }} required className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 px-2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100" />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Edad</Label>
                      <Input value={edad} readOnly className="h-8 text-xs text-center bg-slate-200/60 dark:bg-slate-800 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Peso (Kg)</Label>
                      <Input placeholder="60" value={peso} onChange={(e) => setPeso(e.target.value)} className="h-8 text-xs text-center bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Altura (Mts)</Label>
                      <Input placeholder="1.70" value={altura} onChange={(e) => setAltura(e.target.value)} className="h-8 text-xs text-center bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Talla</Label>
                      <Select value={talla} onValueChange={setTalla}>
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="XS">XS</SelectItem>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">¿Ha participado en otro club?</Label>
                    <div className="flex gap-2">
                      <Select value={participoOtroClub} onValueChange={setParticipoOtroClub}>
                        <SelectTrigger className="h-9 text-xs w-28 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Sí">Sí</SelectItem>
                        </SelectContent>
                      </Select>
                      {participoOtroClub === "Sí" && (
                        <Input placeholder="Nombre del club anterior" value={clubAnterior} onChange={(e) => setClubAnterior(e.target.value)} className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 flex-1" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DATOS INTERNOS */}
              <div className="space-y-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500" /> DATOS INTERNOS (A Completar)
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Fecha Inscripción</Label>
                      <Input type="date" value={fechaInscripcion} onChange={(e) => setFechaInscripcion(e.target.value)} className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 px-2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Categoría <span className="text-red-500">*</span></Label>
                      <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs">
                        {categories.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Modalidad <span className="text-red-500">*</span></Label>
                      <Select value={modalidad} onValueChange={setModalidad}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Recreativo">Recreativo</SelectItem>
                          <SelectItem value="Competitivo">Competitivo</SelectItem>
                          <SelectItem value="Alto Rendimiento">Alto Rendimiento</SelectItem>
                          <SelectItem value="Selección">Selección</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Sede <span className="text-red-500">*</span></Label>
                      <Select value={sedeId} onValueChange={setSedeId}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sedes.map(s => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Deporte Principal <span className="text-red-500">*</span></Label>
                      <Select value={deportePrincipal} onValueChange={setDeportePrincipal}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fútbol">Fútbol</SelectItem>
                          <SelectItem value="Baloncesto">Baloncesto</SelectItem>
                          <SelectItem value="Voleibol">Voleibol</SelectItem>
                          <SelectItem value="Natación">Natación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Segundo Deporte (Opcional)</Label>
                      <Select value={segundoDeporte} onValueChange={setSegundoDeporte}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ninguno">-- Ninguno --</SelectItem>
                          <SelectItem value="Fútbol">Fútbol</SelectItem>
                          <SelectItem value="Baloncesto">Baloncesto</SelectItem>
                          <SelectItem value="Atletismo">Atletismo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Grupo de Clases</Label>
                      <Input placeholder="Ej. Lunes y Miércoles 4:00 PM" value={grupoClases} onChange={(e) => setGrupoClases(e.target.value)} className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">N° Camiseta</Label>
                      <Input placeholder="10" value={numeroCamiseta} onChange={(e) => setNumeroCamiseta(e.target.value)} className="h-9 text-xs text-center font-bold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Precio Mensualidad <span className="text-red-500">*</span></Label>
                    <Input placeholder="35000" value={precioMensualidad} onChange={(e) => setPrecioMensualidad(e.target.value)} required className="h-9 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                  </div>
                </div>
              </div>

              {/* 3. DATOS DEL APODERADO */}
              <div className="space-y-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> DATOS DEL APODERADO
                  </h3>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-600 dark:text-slate-400 select-none">
                    <span>¿Mismos datos deportista?</span>
                    <input type="checkbox" checked={apoderadoMismosDatos} onChange={(e) => {
                      setApoderadoMismosDatos(e.target.checked);
                      if (e.target.checked) {
                        setEncargado(nombre);
                        setApoderadoApellido(apellido);
                        setEncargadoIdentificacion(identificacion);
                        setApoderadoDV(dv);
                      }
                    }} className="h-3.5 w-3.5 rounded accent-primary cursor-pointer" />
                  </label>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Nombre <span className="text-red-500">*</span></Label>
                      <Input placeholder="Nombre" value={encargado} onChange={(e) => setEncargado(e.target.value)} required className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Apellido <span className="text-red-500">*</span></Label>
                      <Input placeholder="Apellido" value={apoderadoApellido} onChange={(e) => setApoderadoApellido(e.target.value)} required className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Teléfono <span className="text-red-500">*</span></Label>
                      <Input placeholder="+506 8888 8888" value={telefonoEncargado} onChange={(e) => setTelefonoEncargado(e.target.value)} required className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">WhatsApp (Notificaciones) <span className="text-red-500">*</span></Label>
                        <button
                          type="button"
                          onClick={() => {
                            setWhatsappEncargado(telefonoEncargado);
                            toast.info("WhatsApp copiado de Teléfono del encargado");
                          }}
                          className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                        >
                          ⚡ Copiar Teléfono
                        </button>
                      </div>
                      <Input placeholder="+506 8888 8888" value={whatsappEncargado} onChange={(e) => setWhatsappEncargado(e.target.value)} required className="h-9 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Correo <span className="text-red-500">*</span></Label>
                      <Input type="email" placeholder="correo@ejemplo.com" value={correoEncargado} onChange={(e) => setCorreoEncargado(e.target.value)} required className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Identificación (Cédula/RUT) <span className="text-red-500">*</span></Label>
                      <div className="flex gap-2">
                        <Input placeholder="Número" value={encargadoIdentificacion} onChange={(e) => setEncargadoIdentificacion(e.target.value)} required className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 flex-1" />
                        <Input placeholder="DV" value={apoderadoDV} onChange={(e) => setApoderadoDV(e.target.value)} className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 w-14 text-center" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Parentesco</Label>
                      <Select value={parentesco} onValueChange={setParentesco}>
                        <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Padre">Padre</SelectItem>
                          <SelectItem value="Madre">Madre</SelectItem>
                          <SelectItem value="Tutor">Tutor / Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Dirección</Label>
                      <Input placeholder="Barrio / Calle" value={apoderadoDireccion} onChange={(e) => setApoderadoDireccion(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Ciudad</Label>
                      <Input value={apoderadoCiudad} onChange={(e) => setApoderadoCiudad(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">País</Label>
                      <Input value={apoderadoPais} onChange={(e) => setApoderadoPais(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                    </div>
                  </div>

                  {/* DATOS DE MADRE Y PADRE CON AUTO-LLENADO */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
                    
                    {/* DATOS DE LA MADRE */}
                    <div className="p-3 rounded-xl bg-pink-500/5 border border-pink-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-pink-600 dark:text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> DATOS DE LA MADRE
                        </span>
                        <Button 
                          type="button"
                          size="xs" 
                          onClick={() => {
                            setMadreNombreInput(encargado);
                            setMadreApellidoInput(apoderadoApellido);
                            setMadreCedulaInput(encargadoIdentificacion);
                            setMadreTelefonoInput(telefonoEncargado);
                            setMadreWhatsappInput(whatsappEncargado || telefonoEncargado);
                            setMadreCorreoInput(correoEncargado);
                            toast.success("Datos de la madre auto-completados con el encargado legal");
                          }}
                          className="bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-bold h-6 px-2 rounded-lg gap-1 shadow-sm"
                        >
                          <Zap className="h-3 w-3 fill-current" /> ¿ES EL MISMO ENCARGADO? (AUTO-LLENAR)
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">CÉDULA</Label>
                          <Input placeholder="Cédula / Identificación" value={madreCedulaInput} onChange={(e) => setMadreCedulaInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">NOMBRE</Label>
                          <Input placeholder="Nombre Madre" value={madreNombreInput} onChange={(e) => setMadreNombreInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">APELLIDOS</Label>
                          <Input placeholder="Apellidos Madre" value={madreApellidoInput} onChange={(e) => setMadreApellidoInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">OCUPACIÓN</Label>
                          <Input placeholder="Ej. Profesora" value={madreOcupacionInput} onChange={(e) => setMadreOcupacionInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">CELULAR</Label>
                          <Input placeholder="Teléfono / Celular" value={madreTelefonoInput} onChange={(e) => setMadreTelefonoInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">WHATSAPP</Label>
                            <button
                              type="button"
                              onClick={() => {
                                setMadreWhatsappInput(madreTelefonoInput);
                                toast.info("WhatsApp copiado de Celular Madre");
                              }}
                              className="text-[9px] text-pink-600 hover:underline font-bold cursor-pointer"
                            >
                              ⚡ Copiar
                            </button>
                          </div>
                          <Input placeholder="WhatsApp Madre" value={madreWhatsappInput} onChange={(e) => setMadreWhatsappInput(e.target.value)} className="h-8 text-xs font-mono text-emerald-600 bg-white dark:bg-slate-950" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">CORREO PRINCIPAL</Label>
                          <Input type="email" placeholder="correo@ejemplo.com" value={madreCorreoInput} onChange={(e) => setMadreCorreoInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                      </div>
                    </div>

                    {/* DATOS DEL PADRE */}
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> DATOS DEL PADRE
                        </span>
                        <Button 
                          type="button"
                          size="xs" 
                          onClick={() => {
                            setPadreNombreInput(encargado);
                            setPadreApellidoInput(apoderadoApellido);
                            setPadreCedulaInput(encargadoIdentificacion);
                            setPadreTelefonoInput(telefonoEncargado);
                            setPadreWhatsappInput(whatsappEncargado || telefonoEncargado);
                            setPadreCorreoInput(correoEncargado);
                            toast.success("Datos del padre auto-completados con el encargado legal");
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold h-6 px-2 rounded-lg gap-1 shadow-sm"
                        >
                          <Zap className="h-3 w-3 fill-current" /> ¿ES EL MISMO ENCARGADO? (AUTO-LLENAR)
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">CÉDULA</Label>
                          <Input placeholder="Cédula / Identificación" value={padreCedulaInput} onChange={(e) => setPadreCedulaInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">NOMBRE</Label>
                          <Input placeholder="Nombre Padre" value={padreNombreInput} onChange={(e) => setPadreNombreInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">APELLIDOS</Label>
                          <Input placeholder="Apellidos Padre" value={padreApellidoInput} onChange={(e) => setPadreApellidoInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">OCUPACIÓN</Label>
                          <Input placeholder="Ej. Ingeniero" value={padreOcupacionInput} onChange={(e) => setPadreOcupacionInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">CELULAR</Label>
                          <Input placeholder="Teléfono / Celular" value={padreTelefonoInput} onChange={(e) => setPadreTelefonoInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">WHATSAPP</Label>
                            <button
                              type="button"
                              onClick={() => {
                                setPadreWhatsappInput(padreTelefonoInput);
                                toast.info("WhatsApp copiado de Celular Padre");
                              }}
                              className="text-[9px] text-blue-600 hover:underline font-bold cursor-pointer"
                            >
                              ⚡ Copiar
                            </button>
                          </div>
                          <Input placeholder="WhatsApp Padre" value={padreWhatsappInput} onChange={(e) => setPadreWhatsappInput(e.target.value)} className="h-8 text-xs font-mono text-emerald-600 bg-white dark:bg-slate-950" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">CORREO PRINCIPAL</Label>
                          <Input type="email" placeholder="correo@ejemplo.com" value={padreCorreoInput} onChange={(e) => setPadreCorreoInput(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* 4. DATOS MÉDICOS */}
              <div className="space-y-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800">
                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> DATOS MÉDICOS
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Seguro Médico? <span className="text-red-500">*</span></Label>
                    <Select value={seguroMedico} onValueChange={setSeguroMedico}>
                      <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INS Cobertura Estudiantil">INS Cobertura Estudiantil</SelectItem>
                        <SelectItem value="CCSS">CCSS / Seguro Social</SelectItem>
                        <SelectItem value="Privado">Póliza Privada</SelectItem>
                        <SelectItem value="Ninguno">Ninguno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">¿Enfermedad grave (últimos 2 años)?</Label>
                      <Select value={enfermedadGrave} onValueChange={setEnfermedadGrave}>
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Sí">Sí</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">¿Enfermedad respiratoria?</Label>
                      <Select value={enfermedadRespiratoria} onValueChange={setEnfermedadRespiratoria}>
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="Sí">Sí</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">¿Apto para competir?</Label>
                      <Select value={aptoCompetencia} onValueChange={setAptoCompetencia}>
                        <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sí">Sí</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Último control médico</Label>
                      <Input type="date" value={ultimoControlMedico} onChange={(e) => setUltimoControlMedico(e.target.value)} className="h-8 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 px-2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Descripción Médica en caso de EMERGENCIA:</Label>
                    <textarea
                      rows={2}
                      placeholder="Escriba descripción médica (Alergias, grupo sanguíneo, contactos extra...)"
                      value={descripcionEmergencia}
                      onChange={(e) => setDescripcionEmergencia(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. NOTIFICACIÓN DE BIENVENIDA */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <span>NOTIFICACIÓN AL USUARIO (BIENVENIDA)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Selecciona cómo deseas notificar al apoderado sobre la aprobación de este registro:
              </p>
              
              <div className="flex gap-6 text-xs font-semibold pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input type="radio" name="notif" checked={metodoNotificacion === "correo"} onChange={() => setMetodoNotificacion("correo")} className="accent-primary" />
                  <span>Por Correo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400">
                  <input type="radio" name="notif" checked={metodoNotificacion === "whatsapp"} onChange={() => setMetodoNotificacion("whatsapp")} className="accent-emerald-500" />
                  <span>Por WhatsApp</span>
                </label>
              </div>

              <div className="space-y-1 pt-1">
                <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Mensaje de Bienvenida:</Label>
                <textarea
                  rows={3}
                  value={mensajeBienvenida}
                  onChange={(e) => setMensajeBienvenida(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-slate-500 italic">
                  Las palabras entre corchetes (como [NOMBRE]) serán reemplazadas automáticamente por los datos reales del deportista.
                </p>
              </div>
            </div>

            {/* Acciones principales */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)} className="rounded-xl px-5 h-9 text-xs">
                Cancelar
              </Button>
              <Button type="submit" className="bg-gradient-primary text-white font-bold px-7 h-9 text-xs rounded-xl shadow-elegant hover:brightness-105 transition">
                Guardar y Salir
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Resultados de Importación */}
      <Dialog open={openImportResult} onOpenChange={setOpenImportResult}>
        <DialogContent className="sm:max-w-[460px] bg-background border shadow-elegant">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FileSpreadsheet className="h-5 w-5 text-primary" /> Resultado de la Importación
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Resumen del procesamiento del archivo Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-success/5 border-success/20 text-success">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">{importCount}</span> atletas cargados exitosamente a la academia.
              </div>
            </div>

            {importErrors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                  <AlertTriangle className="h-4 w-4" /> Filas omitidas con advertencias ({importErrors.length}):
                </div>
                <div className="max-h-[160px] overflow-y-auto border rounded-lg bg-muted/30 p-2 space-y-1 text-[11px] font-mono text-muted-foreground">
                  {importErrors.map((err, idx) => (
                    <div key={idx} className="border-b border-border/40 pb-1 last:border-0 last:pb-0">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setOpenImportResult(false)} className="bg-gradient-primary">Aceptar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: REGISTRAR MOTIVO DE SUSPENSIÓN */}
      <Dialog open={openSuspendModal} onOpenChange={setOpenSuspendModal}>
        <DialogContent className="sm:max-w-[480px] bg-card border border-border shadow-2xl rounded-3xl p-6">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600 dark:text-rose-400">
              <PowerOff className="h-5 w-5 text-rose-500" /> Suspender Deportista — {targetSuspendPlayer?.nombre}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ingresa el motivo exacto de la suspensión (médico, disciplinario o administrativo).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmSuspension} className="space-y-4 pt-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Motivo de Suspensión *</Label>
              <Select value={suspendRazon} onValueChange={setSuspendRazon}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lesión física">Lesión física (Médico)</SelectItem>
                  <SelectItem value="Infracción disciplinaria">Infracción disciplinaria</SelectItem>
                  <SelectItem value="Falta de pago / Morosidad">Falta de pago / Morosidad</SelectItem>
                  <SelectItem value="Permiso personal / Viaje">Permiso personal / Viaje</SelectItem>
                  <SelectItem value="Sanción de liga">Sanción de liga / Federación</SelectItem>
                  <SelectItem value="Otro motivo">Otro motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Detalles / Diagnóstico Adicional</Label>
              <textarea
                rows={3}
                placeholder="Ejemplo: Lesión de tobillo grado 2 durante el partido del sábado. Reposo 3 semanas."
                value={suspendDetalle}
                onChange={(e) => setSuspendDetalle(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-input bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setOpenSuspendModal(false)} className="h-9 text-xs rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-9 text-xs rounded-xl shadow-md">
                Confirmar Suspensión
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: LISTA COMPLETA DE ATLETAS SUSPENDIDOS Y MOTIVOS */}
      <Dialog open={openSuspendedListModal} onOpenChange={setOpenSuspendedListModal}>
        <DialogContent className="sm:max-w-[850px] max-h-[85vh] overflow-y-auto bg-card border border-border shadow-2xl rounded-3xl p-6 space-y-4">
          <DialogHeader className="border-b pb-3 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-black flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-5 w-5 text-rose-500" /> Nómina de Deportistas Suspendidos
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Total: <span className="font-bold text-foreground">{jugadoresList.filter(j => j.esSuspendido).length} atletas suspendidos</span> actualmente en la academia
              </DialogDescription>
            </div>
          </DialogHeader>

          {jugadoresList.filter(j => j.esSuspendido).length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <p className="font-bold text-sm text-foreground">No hay atletas suspendidos</p>
              <p className="text-xs text-muted-foreground">Toda la nómina se encuentra actualmente en estado activo y habilitada.</p>
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden bg-background shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900 text-white hover:bg-slate-900">
                    <TableHead className="text-xs font-bold text-slate-200">Nombre</TableHead>
                    <TableHead className="text-xs font-bold text-slate-200">Deporte / Camiseta</TableHead>
                    <TableHead className="text-xs font-bold text-slate-200">Categoría</TableHead>
                    <TableHead className="text-xs font-bold text-slate-200">Sede</TableHead>
                    <TableHead className="text-xs font-bold text-slate-200 text-center">Estado Financiero</TableHead>
                    <TableHead className="text-xs font-bold text-slate-200 text-center">Fecha Suspensión</TableHead>
                    <TableHead className="text-xs font-bold text-slate-200">Motivo / Razón</TableHead>
                    <TableHead className="text-right pr-4 text-xs font-bold text-slate-200">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jugadoresList.filter(j => j.esSuspendido).map((player) => {
                    return (
                      <TableRow key={player.id} className="hover:bg-muted/30">
                        <TableCell className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {player.nombre}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-semibold">{player.disciplina || "Fútbol"}</span>
                          <span className="text-[10px] text-muted-foreground block">#{player.numero || 10}</span>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{player.categoria}</Badge></TableCell>
                        <TableCell className="text-xs">{player.sede}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] uppercase font-bold">
                            {player.estadoPago === "al_dia" ? "Al día" : "Pendiente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {player.fechaSuspension || "2026-07-21"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-[10px] font-bold">
                            {player.razonSuspension || "Lesión física"}
                          </Badge>
                          {player.detalleSuspension && player.detalleSuspension !== player.razonSuspension && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[180px]">{player.detalleSuspension}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Button
                            size="xs"
                            onClick={() => {
                              handleOpenSuspendModal(player);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] h-7 px-2.5 rounded-lg gap-1"
                          >
                            Reactivar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-[11px] text-muted-foreground font-semibold">DEPORTIVOS — CONTROL DE SANCIONES Y SALUD</span>
            <Button variant="outline" onClick={() => setOpenSuspendedListModal(false)} size="sm" className="h-8 text-xs font-bold rounded-xl">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

