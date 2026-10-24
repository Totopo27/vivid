// La otra apertura del hook (el creador eligió el túnel, planos/01-fiesta.js).
// «¿Por qué cuando sales y bebes mucho...»: desde el fotograma 0, la bola de espejos enorme girando, con haces de
// colores que barren el humo; en «bebes», la cámara baja de golpe hasta la barra y el whisky cae en el vaso; en «mucho»
// rebosa.
import { conBajada, momentosFiesta, velo } from "../fiesta.js";

export const desde = 0;

export function dibuja(g, t) {
  conBajada(g, t);
  velo(g);
}

export const momentos = momentosFiesta;
