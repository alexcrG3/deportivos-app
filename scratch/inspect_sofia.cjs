const { jugadores } = require('d:/AntigravitDev/Athletix OS/src/lib/mock-data.ts');
// since it is typescript, we can just read the file and search for the name inside the array or read it from the generated js
// wait, we can just run a node script that imports mock-data, but since it's ESM and TypeScript, it's easier to read mock-data.ts as a string and parse it, or we can just print the players from the store!
const fs = require('fs');
const content = fs.readFileSync('d:/AntigravitDev/Athletix OS/src/lib/mock-data.ts', 'utf8');
const lines = content.split('\n');

// Let's find "Sofía" and find the player ID
// We can write a script that runs in ts-node or we can just search for "Sofía" in jugadores.index.tsx's data or in mock-data.ts
// Wait, let's search the built file in dist/ or we can just write a quick script that executes the TS using bun or tsx if available, or just read the code of mock-data.ts.
// Actually, let's just inspect the jugadores generation in mock-data.ts.
console.log("Sofía in mock-data:");
