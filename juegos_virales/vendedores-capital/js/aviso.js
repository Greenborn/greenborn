// Aviso de parodia (#pantallaAviso): se muestra solo la primera vez. Que ya se vio queda en localStorage con la clave
// "2d_aviso". Sin DOM. Si el almacenamiento no está o falla, no rompe: el aviso vuelve a mostrarse en la próxima carga.

export const CLAVE_AVISO = '2d_aviso';

function storageDefecto() {
  try { return globalThis.localStorage ?? null; } catch (e) { return null; }
}

// ¿Ya se aceptó el aviso?
export function avisoVisto(storage = storageDefecto()) {
  try { return storage?.getItem(CLAVE_AVISO) === '1'; } catch (e) { return false; }
}

// Marca el aviso como visto. Devuelve true si se pudo guardar.
export function marcarAviso(storage = storageDefecto()) {
  try { storage.setItem(CLAVE_AVISO, '1'); return true; } catch (e) { return false; }
}
