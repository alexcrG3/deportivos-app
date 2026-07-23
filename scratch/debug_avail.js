import RendimientoStore from "./src/lib/rendimiento-store.ts";

async function run() {
  // Sync first
  console.log("Syncing database...");
  await RendimientoStore.syncFromSupabase();
  const loads = RendimientoStore.getPlayerLoadData();
  const emilianoLoad = loads.find(l => l.jugadorId === 'j-1784264204615-i1jz');
  console.log("Emiliano load data:", emilianoLoad);
  
  const lesiones = RendimientoStore.getLesiones();
  const emilianoLesiones = lesiones.filter(l => l.jugadorId === 'j-1784264204615-i1jz');
  console.log("Emiliano stored lesions:", emilianoLesiones);
}

run().catch(console.error);
