// «¿Por qué cuando sales y bebes mucho...»
// Una discoteca, con una sola cámara (el sitio, en ../fiesta.js).
// - Fotograma 0: un viaje a toda velocidad entre rayos de luz de colores; la bola de espejos viene de lejos y llega
//   enorme en «sales», con un fogonazo.
// - «bebes»: la cámara baja de golpe (pasando por la gente que baila, a contraluz) hasta la barra: un vaso ancho con
//   hielo, y un chorro de whisky que cae dentro.
// - «mucho»: el vaso se llena hasta arriba y el líquido revienta en una corona de gotas que salta hacia la cámara; las
//   gotas acaban de caer antes del corte.
// Hubo otra apertura (aperturas/01-bola.js: la bola de espejos desde el fotograma 0, sin el viaje), y el creador
// eligió esta.
import * as k from "#kit";
import { COLS, conBajada, destello, f1, momentosFiesta, velo } from "../fiesta.js";

export const desde = 0;

const { suave: su, tramo: tr, mez, azar, F } = k;
const Tsal = f1.t("sales"), Tque = f1.t("que");

// El túnel: el primer fotograma es un viaje a toda velocidad entre rayos de luz de colores; la bola de espejos viene
// de lejos y llega enorme en «sales», con un fogonazo; luego, la discoteca.
const azT = azar(2121);
const RAYOS = Array.from({ length: 420 }, () => { const a = azT() * 6.2832, r = 1.2 + Math.pow(azT(), 0.6) * 9; return { x: Math.cos(a) * r, y: Math.sin(a) * r, z0: azT() * 60, c: COLS[Math.floor(azT() * 6)], w: 1 + azT() * 2 }; });
const viaje = (t) => 70 * t - 30 * t * t;
function tunel(g, t) {
  const llega = Tsal + 0.12, u = tr(t, 0, llega);
  conBajada(g, t, { bolaEsc: t < llega ? Math.exp(mez(Math.log(0.04), 0, Math.pow(u, 2.2))) : 1 });
  const al = 1 - su(tr(t, llega - 0.05, llega + 0.3));
  if (al > 0) {
    g.fillStyle = `rgba(4,2,10,${0.55 * al})`; g.fillRect(0, 0, 1080, 1920);
    g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
    const d = viaje(Math.min(t, 1.1)), d0 = viaje(Math.max(0, Math.min(t, 1.1) - 1 / 30));
    for (const r of RAYOS) {
      const z = (((r.z0 - d) % 60) + 60) % 60 + 0.4, z0 = z + (d - d0) * 2.2;
      const x1 = 540 + (F * r.x) / z / 3, y1 = 960 + (F * r.y) / z / 3, x0 = 540 + (F * r.x) / z0 / 3, y0 = 960 + (F * r.y) / z0 / 3;
      if (x1 < -200 || x1 > 1280 || y1 < -200 || y1 > 2120) continue;
      const a = al * Math.min(1, 9 / z);
      g.strokeStyle = `rgba(${r.c},${a})`; g.lineWidth = r.w * Math.min(9, 14 / z) + 1;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    g.restore();
  }
  destello(g, 0.5 * k.pulso(t, Tque + 0.05, 0.05) + 0.85 * k.pulso(t, llega, 0.07));
}

export function dibuja(g, t) {
  tunel(g, t);
  velo(g);
}

export const momentos = { ...momentosFiesta, llegaBola: Tsal + 0.12, flash: Tque + 0.05 };
