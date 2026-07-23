const fs = require('fs');

// Replicate the names and arrays to find the exact player
const nombresFemeninos = [
  "Sofía", "Valentina", "Isabella", "Camila", "Valeria", "Mariana", "Gabriela", "Daniela", "Sara", "Victoria",
  "Lucía", "Catalina", "Andrea", "Elena", "Natalia", "Mónica", "Carolina", "Beatriz", "Clara", "Patricia",
  "Alejandra", "Regina", "Jimena", "Paulina", "Marisol", "Fernanda", "Lorena", "Verónica", "Gabriela", "Renata"
];

const nombresMasculinos = [
  "Santiago", "Sebastián", "Matías", "Mateo", "Nicolás", "Alejandro", "Diego", "Samuel", "Benjamin", "Daniel",
  "Joaquín", "Tomás", "Lucas", "Martín", "felipe", "Andrés", "Gabriel", "Leonardo", "Hugo", "Álvaro",
  "Carlos", "javier", "Francisco", "José", "Luis", "Manuel", "Fernando", "Jorge", "Roberto", "David"
];

const apellidos = [
  "Rodríguez", "Gómez", "González", "Martínez", "Sánchez", "Pérez", "Díaz", "Ramírez", "Muñoz", "Rojas",
  "Valenzuela", "Contreras", "Silva", "Espinoza", "Flores", "Torres", "Rivera", "Guzmán", "Medina", "Castro",
  "Ortiz", "Ruiz", "Álvarez", "Herrera", "Medina", "Vargas", "Ríos", "Castillo", "Miranda", "Fuentes"
];

const categoryDistribution = [
  { name: "Sub-7 Fútbol", disciplina: "Fútbol", age: 6, count: 18, gender: "Mixto" },
  { name: "Sub-9 Fútbol", disciplina: "Fútbol", age: 8, count: 22, gender: "Mixto" },
];

const jugadores = [];
let globalIdx = 0;

categoryDistribution.forEach((dist, distIdx) => {
  for (let itemIdx = 0; itemIdx < dist.count; itemIdx++) {
    const currentGlobalIdx = distIdx * 100 + itemIdx;
    let calculatedAge = dist.age;
    if (dist.name === "Sub-7 Fútbol") {
      calculatedAge = 5 + (itemIdx % 3);
    }
    let gender = dist.gender;
    if (gender === "Mixto") {
      gender = itemIdx % 2 === 0 ? "Femenino" : "Masculino";
    }
    const namePool = gender === "Femenino" ? nombresFemeninos : nombresMasculinos;
    const nombre = `${namePool[currentGlobalIdx % namePool.length]} ${apellidos[currentGlobalIdx % apellidos.length]}`;
    const id = `j${currentGlobalIdx + 1}`;
    
    if (nombre.includes("Sofía") || nombre.includes("Sofia")) {
      console.log(`Found: id=${id}, name=${nombre}, age=${calculatedAge}, gender=${gender}, itemIdx=${itemIdx}`);
    }
  }
});
