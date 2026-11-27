// Pistas de tutorial de la 2D (G25): cada pista se muestra una sola vez. Lo visto queda en localStorage con la clave "2d_pistas"
// (objeto { id: true }). Sin DOM: main.js muestra el texto en #pista. Si el almacenamiento no está o falla, la pista se
// muestra una vez por sesión (el conjunto en memoria evita repetirla).
// Origen de la idea: 3D (`../index.html`, pista() y ajustes.pistas), pero con clave y guardado propios de la 2D.

export const CLAVE_PISTAS = '2d_pistas';
const vistasSesion = new Set();

function storageDefecto() {
  try { return globalThis.localStorage ?? null; } catch (e) { return null; }
}

// Lee las pistas ya vistas. Devuelve un objeto; si no hay nada válido, vacío.
export function cargarPistas(storage = storageDefecto()) {
  try {
    const o = JSON.parse(storage?.getItem(CLAVE_PISTAS) ?? 'null');
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  } catch (e) {
    return {};
  }
}

// ¿Ya se mostró la pista `id`? (guardada o vista en esta sesión)
export function pistaVista(id, storage = storageDefecto()) {
  return vistasSesion.has(id) || cargarPistas(storage)[id] === true;
}

// Marca la pista como vista. Devuelve true si se pudo guardar en el almacenamiento.
export function marcarPista(id, storage = storageDefecto()) {
  vistasSesion.add(id);
  try {
    const o = cargarPistas(storage);
    o[id] = true;
    storage.setItem(CLAVE_PISTAS, JSON.stringify(o));
    return true;
  } catch (e) {
    return false;
  }
}

// Decide si la pista `id` se muestra ahora. Si sí, la marca como vista y devuelve true (el texto lo pone la vista).
export function pistaUnaVez(id, texto, storage = storageDefecto()) {
  if (!texto || pistaVista(id, storage)) return false;
  marcarPista(id, storage);
  return true;
}
