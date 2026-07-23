/**
 * excel-utils.ts
 * Utility functions for downloading Excel templates and importing bulk data.
 * Uses SheetJS (xlsx) for client-side workbook generation and parsing.
 */
import * as XLSX from "xlsx";

// ─── COACHES TEMPLATE ────────────────────────────────────────────────────────

export const COACH_TEMPLATE_HEADERS = [
  "nombre",
  "identificacion",
  "correo",
  "telefono",
  "especialidad",
  "disciplinas",       // comma-separated: "Fútbol,Baloncesto"
  "horario",
];

export const COACH_EXAMPLE_ROWS = [
  ["Carlos Torres", "1-0123-4567", "carlos@academia.com", "+50688881111", "Fútbol técnico", "Fútbol", "L–V 14:00–20:00"],
  ["Ana Rojas", "1-9876-5432", "ana@academia.com", "+50688882222", "Natación competitiva", "Natación", "M–S 06:00–12:00"],
];

export function downloadCoachTemplate() {
  const wb = XLSX.utils.book_new();

  // Instructions sheet
  const instrucciones = [
    ["PLANTILLA DE IMPORTACIÓN — ENTRENADORES / COACHES"],
    [""],
    ["INSTRUCCIONES:"],
    ["1. Completa los datos en la hoja 'Datos'."],
    ["2. No modifiques los nombres de las columnas (fila 1)."],
    ["3. El campo 'disciplinas' puede tener varias separadas por coma. Ej: Fútbol,Baloncesto"],
    ["4. Guarda el archivo en formato .xlsx y súbelo en la sección de Entrenadores."],
    ["5. Los campos obligatorios son: nombre, identificacion, correo, telefono."],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrucciones);
  wsInstr["!cols"] = [{ wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones");

  // Data sheet
  const data = [COACH_TEMPLATE_HEADERS, ...COACH_EXAMPLE_ROWS];
  const wsData = XLSX.utils.aoa_to_sheet(data);
  wsData["!cols"] = COACH_TEMPLATE_HEADERS.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, wsData, "Datos");

  XLSX.writeFile(wb, "Plantilla_Entrenadores_DeportivOS.xlsx");
}

export interface ParsedCoach {
  nombre: string;
  identificacion: string;
  correo: string;
  telefono: string;
  especialidad: string;
  disciplinas: string[];
  horario: string;
}

export function parseCoachesFromFile(file: File): Promise<{ valid: ParsedCoach[]; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        // Find the "Datos" sheet, or fall back to first sheet
        const sheetName = wb.SheetNames.includes("Datos") ? "Datos" : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (rows.length < 2) {
          resolve({ valid: [], errors: ["El archivo no contiene datos (mínimo 1 fila de encabezado + 1 de datos)."] });
          return;
        }

        const normalizeHeader = (h: string) =>
          String(h)
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const headers = (rows[0] as string[]).map(normalizeHeader);
        const idx = (field: string) => headers.indexOf(normalizeHeader(field));

        const valid: ParsedCoach[] = [];
        const errors: string[] = [];

        rows.slice(1).forEach((row, i) => {
          if (row.every(c => !c)) return; // skip empty rows
          const lineNum = i + 2;
          const nombre = String(row[idx("nombre")] ?? "").trim();
          const identificacion = String(row[idx("identificacion")] ?? "").trim();
          const correo = String(row[idx("correo")] ?? "").trim();
          const telefono = String(row[idx("telefono")] ?? "").trim();

          if (!nombre) { errors.push(`Fila ${lineNum}: falta el nombre.`); return; }
          if (!identificacion) { errors.push(`Fila ${lineNum}: falta la identificación.`); return; }
          if (!correo) { errors.push(`Fila ${lineNum}: falta el correo.`); return; }
          if (!telefono) { errors.push(`Fila ${lineNum}: falta el teléfono.`); return; }

          const disciplinasRaw = String(row[idx("disciplinas")] ?? "Fútbol").trim();
          const disciplinas = disciplinasRaw.split(",").map(d => d.trim()).filter(Boolean);

          valid.push({
            nombre,
            identificacion,
            correo,
            telefono,
            especialidad: String(row[idx("especialidad")] ?? "Multideporte").trim() || "Multideporte",
            disciplinas: disciplinas.length ? disciplinas : ["Fútbol"],
            horario: String(row[idx("horario")] ?? "L–V 08:00–17:00").trim() || "L–V 08:00–17:00",
          });
        });

        resolve({ valid, errors });
      } catch (err) {
        resolve({ valid: [], errors: ["Error al leer el archivo. Asegúrate de que sea un .xlsx válido."] });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// ─── ATHLETES TEMPLATE ───────────────────────────────────────────────────────

export const ATHLETE_TEMPLATE_HEADERS = [
  "nombre",
  "identificacion",
  "fechaNacimiento",   // YYYY-MM-DD
  "genero",            // Masculino / Femenino / Otro
  "disciplina",
  "categoria",
  "correo",
  "telefono",
  "encargado",
  "parentesco",        // Padre / Madre / Tutor
  "telefonoEncargado",
  "correoEncargado",
  "posicion",
];

export const ATHLETE_EXAMPLE_ROWS = [
  ["Mateo Rojas", "7-0001-0001", "2015-03-12", "Masculino", "Fútbol", "U10 Fútbol", "mateo@mail.com", "+50688881234", "Sofía Rojas", "Madre", "+50688884321", "sofia@mail.com", "DEL"],
  ["Valeria Soto", "7-0002-0002", "2013-07-20", "Femenino", "Natación", "U14 Natación", "valeria@mail.com", "+50688885678", "Diego Soto", "Padre", "+50688878765", "diego@mail.com", "N/A"],
];

export function downloadAthleteTemplate() {
  const wb = XLSX.utils.book_new();

  const instrucciones = [
    ["PLANTILLA DE IMPORTACIÓN — ATLETAS / JUGADORES"],
    [""],
    ["INSTRUCCIONES:"],
    ["1. Completa los datos en la hoja 'Datos'."],
    ["2. No modifiques los nombres de las columnas (fila 1)."],
    ["3. Fecha de Nacimiento en formato YYYY-MM-DD. Ej: 2015-03-12"],
    ["4. Género: Masculino / Femenino / Otro"],
    ["5. Parentesco del encargado: Padre / Madre / Tutor"],
    ["6. Guarda el archivo en formato .xlsx y súbelo en la sección de Jugadores."],
    ["7. Campos obligatorios: nombre, identificacion, fechaNacimiento, correo, telefono."],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrucciones);
  wsInstr["!cols"] = [{ wch: 75 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones");

  const data = [ATHLETE_TEMPLATE_HEADERS, ...ATHLETE_EXAMPLE_ROWS];
  const wsData = XLSX.utils.aoa_to_sheet(data);
  wsData["!cols"] = ATHLETE_TEMPLATE_HEADERS.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, wsData, "Datos");

  XLSX.writeFile(wb, "Plantilla_Atletas_DeportivOS.xlsx");
}

export interface ParsedAthlete {
  nombre: string;
  identificacion: string;
  fechaNacimiento: string;
  genero: string;
  disciplina: string;
  categoria: string;
  correo: string;
  telefono: string;
  encargado: string;
  parentesco: string;
  telefonoEncargado: string;
  correoEncargado: string;
  posicion: string;
}

export function normalizeCategoryName(name: string): string {
  const clean = String(name || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[-_]/g, ""); // remove hyphens/underscores
  
  // Try matching format: U9, U11, U13, etc.
  const uMatch = clean.match(/^U\s*(\d+)/i);
  if (uMatch) return `U${uMatch[1]}`;
  
  const subMatch = clean.match(/^SUB\s*(\d+)/i);
  if (subMatch) return `U${subMatch[1]}`;

  return name.trim();
}

export function findBestCategory(excelCatName: string, birthDate: string, categories: any[]): string {
  if (!categories || categories.length === 0) return "General";
  
  const normalizedExcel = normalizeCategoryName(excelCatName);
  
  // 1. Try exact match on normalized name
  const exactMatch = categories.find(c => normalizeCategoryName(c.nombre) === normalizedExcel);
  if (exactMatch) return exactMatch.nombre;

  // 2. Try substring match (e.g. if category name is U13, and excelCatName is "U13 fútbol")
  const substringMatch = categories.find(c => {
    const normName = normalizeCategoryName(c.nombre);
    return normalizedExcel.includes(normName) || normName.includes(normalizedExcel);
  });
  if (substringMatch) return substringMatch.nombre;

  // 3. Try matching by age
  if (birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    const birthYear = new Date(birthDate).getFullYear();
    const age = new Date().getFullYear() - birthYear;
    const ageMatch = categories.find(c => {
      const min = c.edadMin ?? 0;
      const max = c.edadMax ?? 99;
      return age >= min && age <= max;
    });
    if (ageMatch) return ageMatch.nombre;
  }

  // 4. Fallback to first category or General
  return categories[0]?.nombre || "General";
}

export function parseAthletesFromFile(file: File, categories: any[] = []): Promise<{ valid: ParsedAthlete[]; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const sheetName = wb.SheetNames.includes("Datos") ? "Datos" : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

        if (rows.length < 2) {
          resolve({ valid: [], errors: ["El archivo no contiene datos (mínimo 1 fila de encabezado + 1 de datos)."] });
          return;
        }

        const normalizeHeader = (h: string) =>
          String(h)
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const headers = (rows[0] as string[]).map(normalizeHeader);
        const idx = (field: string) => headers.indexOf(normalizeHeader(field));

        const valid: ParsedAthlete[] = [];
        const errors: string[] = [];

        rows.slice(1).forEach((row, i) => {
          if (row.every(c => !c)) return;
          const lineNum = i + 2;
          const nombre = String(row[idx("nombre")] ?? "").trim();
          const identificacion = String(row[idx("identificacion")] ?? "").trim();
          const fechaNacimiento = String(row[idx("fechaNacimiento")] ?? "").trim();
          const correo = String(row[idx("correo")] ?? "").trim();
          const telefono = String(row[idx("telefono")] ?? "").trim();

          if (!nombre) { errors.push(`Fila ${lineNum}: falta el nombre.`); return; }
          if (!identificacion) { errors.push(`Fila ${lineNum}: falta la identificación.`); return; }
          if (!correo) { errors.push(`Fila ${lineNum}: falta el correo.`); return; }
          if (!telefono) { errors.push(`Fila ${lineNum}: falta el teléfono.`); return; }
          if (!fechaNacimiento || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
            errors.push(`Fila ${lineNum}: fecha de nacimiento inválida (use YYYY-MM-DD).`);
            return;
          }

          const rawCat = String(row[idx("categoria")] ?? "General").trim() || "General";
          const matchedCat = findBestCategory(rawCat, fechaNacimiento, categories);

          valid.push({
            nombre,
            identificacion,
            fechaNacimiento,
            genero: String(row[idx("genero")] ?? "Masculino").trim() || "Masculino",
            disciplina: String(row[idx("disciplina")] ?? "Fútbol").trim() || "Fútbol",
            categoria: matchedCat,
            correo,
            telefono,
            encargado: String(row[idx("encargado")] ?? "").trim(),
            parentesco: String(row[idx("parentesco")] ?? "Padre").trim() || "Padre",
            telefonoEncargado: String(row[idx("telefonoEncargado")] ?? "").trim(),
            correoEncargado: String(row[idx("correoEncargado")] ?? "").trim(),
            posicion: String(row[idx("posicion")] ?? "N/A").trim() || "N/A",
          });
        });

        resolve({ valid, errors });
      } catch {
        resolve({ valid: [], errors: ["Error al leer el archivo. Asegúrate de que sea un .xlsx válido."] });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
