// Corre todas las pruebas headless de 2d/tools/test_*.mjs, una por una y en orden alfabético.
// Uso: node 2d/tools/correr_todo.mjs   (desde la raíz del proyecto o desde 2d/)
// Sale con código 0 si todas pasan; con 1 si alguna falla (o no se puede ejecutar).
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const carpeta = dirname(fileURLToPath(import.meta.url));
const archivos = readdirSync(carpeta).filter(f => /^test_.*\.mjs$/.test(f)).sort();

const fallidas = [];
for (const archivo of archivos) {
  console.log(`\n=== ${archivo} ===`);
  const r = spawnSync(process.execPath, [join(carpeta, archivo)], { stdio: 'inherit' });
  if (r.error || r.status !== 0) fallidas.push(archivo + (r.error ? ` (${r.error.message})` : ` (código ${r.status})`));
}

console.log('\n=== Resumen ===');
console.log(`Archivos: ${archivos.length}. Con fallas: ${fallidas.length}.`);
for (const f of fallidas) console.log(`  FALLÓ: ${f}`);
if (archivos.length === 0) { console.log('No se encontraron test_*.mjs.'); process.exit(1); }
process.exit(fallidas.length === 0 ? 0 : 1);
