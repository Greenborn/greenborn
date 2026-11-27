// Energía del jugador al correr. Sin DOM. pl: { energia, agotado, corre, sinCorrer } (se modifica).
// Correr gasta `consumo` por segundo y cada arranque cuesta CONS_ARRANQUE. Se recupera quieto o caminando recién tras
// REC_DEMORA s sin correr. Agotado (energía 0) no se puede correr hasta llegar a UMBRAL_REINICIO.
import { ENERGIA_MAX, REC_QUIETO, REC_CAMINA, REC_DEMORA, CONS_ARRANQUE, UMBRAL_REINICIO } from './config.js';

// quiere: intenta correr; mueve: se está desplazando. Devuelve si corre en este paso (también queda en pl.corre).
export function stepEnergia(pl, dt, { quiere, mueve, consumo }) {
  if (pl.energia <= 0) { pl.energia = 0; pl.agotado = true; }
  if (pl.agotado && pl.energia >= UMBRAL_REINICIO) pl.agotado = false;
  const antes = !!pl.corre;
  pl.corre = !!quiere && !!mueve && !pl.agotado;
  if (pl.corre) { pl.energia -= consumo * dt + (antes ? 0 : CONS_ARRANQUE); pl.sinCorrer = 0; }
  else {
    pl.sinCorrer = (pl.sinCorrer ?? REC_DEMORA) + dt;
    if (pl.sinCorrer >= REC_DEMORA) pl.energia += (mueve ? REC_CAMINA : REC_QUIETO) * dt;
  }
  pl.energia = Math.max(0, Math.min(ENERGIA_MAX, pl.energia));
  return pl.corre;
}
