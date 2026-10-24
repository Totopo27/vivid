// Medidas del vídeo sin renderizarlo: cuánto cambia la imagen, cómo llega cada corte y si el subtítulo se lee. Son
// datos para saber dónde mirar, nunca una nota ni una razón para mover algo que la voz no pide.
import { createCanvas } from "@napi-rs/canvas";
import { ALTO, ANCHO } from "./comun.mjs";
import { dibujar } from "./cuadro.mjs";
import { zonaSubtitulos } from "./subtitulos.mjs";

const W = 90, H = 160;
const pequeno = createCanvas(W, H), gp = pequeno.getContext("2d");

// El fotograma t en pequeño y en grises (sin subtítulos: lo que se mide es la imagen).
export function gris(proy, est, t) {
  dibujar(proy, est, Math.max(0, Math.min(proy.duracion - 1 / 120, t)), { subtitulos: false });
  gp.drawImage(est.lienzo, 0, 0, W, H);
  const d = gp.getImageData(0, 0, W, H).data, out = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  return out;
}

// Qué parte de la pantalla cambia de a a b (de 0 a 1) y cuánto cambia de media (0 a 255).
export function diferencia(a, b) {
  let n = 0, s = 0;
  for (let i = 0; i < a.length; i++) { const x = Math.abs(a[i] - b[i]); s += x; if (x > 12) n++; }
  return { parte: n / a.length, media: s / a.length };
}

// Segundo a segundo, lo que se mueve: . casi nada (menos del 3 % de la pantalla), - poco, = algo, # grande, | corte.
export function lineaDeMovimiento(proy, est, paso = 0.1) {
  const cortes = proy.planos.slice(1).filter((p) => p.entrada !== "sigue").map((p) => p.desde);
  const seg = Math.ceil(proy.duracion), maxPorSeg = new Array(seg).fill(0);
  let antes = gris(proy, est, 0);
  for (let t = paso; t < proy.duracion; t += paso) {
    const ahora = gris(proy, est, t), s = Math.floor(t);
    const hayCorte = cortes.some((c) => c > t - paso && c <= t);
    if (!hayCorte) maxPorSeg[s] = Math.max(maxPorSeg[s], diferencia(antes, ahora).parte);
    antes = ahora;
  }
  const linea = maxPorSeg.map((p, s) => (cortes.some((c) => c >= s && c < s + 1) ? "|" : p < 0.03 ? "." : p < 0.1 ? "-" : p < 0.25 ? "=" : "#")).join("");
  return { linea, maxPorSeg };
}

// Cómo llega cada corte:
//   alFinal: lo que cambia en la última décima antes del corte (parte de la pantalla y cuánto). Medido en los cortes
//            que se veían cortados a medias (el salero a medio caer, el vapor a medio abrirse): más del 5 % de la
//            pantalla y más de 3 de media. Los que llegan bien, por debajo.
//   salto:   lo que cambia del último fotograma de antes al primero de después. Un corte a otro sitio, más de 25; uno
//            al mismo sitio desde otro encuadre (el salto raro), alrededor de 17; una continuación sin corte, menos de 2.
export function cortes(proy, est) {
  const out = [];
  proy.planos.forEach((p, i) => {
    if (i === 0) return;
    const c = p.desde, previo = proy.planos[i - 1];
    const alFinal = diferencia(gris(proy, est, c - 0.12), gris(proy, est, c - 0.02));
    const salto = diferencia(gris(proy, est, c - 0.02), gris(proy, est, c + 0.02));
    out.push({ n: i, t: c, de: previo.id, a: p.id, entrada: p.entrada, dura: p.hasta - p.desde, durabaAntes: c - previo.desde, alFinal, salto });
  });
  return out;
}

// Si el subtítulo se lee: lo claro que está el fondo detrás de él (en la zona de su estilo y su posición; con el de
// siempre, x 170–910, y 318–482), mientras se ve. Devuelve los tramos en los que ese fondo es demasiado claro: casi
// blanco para el texto blanco, y algo menos para los estilos que dejan palabras en gris (caja, minimal, karaoke). Sin
// subtítulos, ninguno.
const CON_GRIS = ["caja", "minimal", "karaoke"];
export function subtituloSobreClaro(proy, est, paso = 0.25) {
  const z = zonaSubtitulos(proy.estilo.subtitulos);
  if (!z) return [];
  const x = Math.max(0, Math.round(z.x)), y = Math.max(0, Math.round(z.y));
  const w = Math.min(ANCHO - x, Math.round(z.w)), h = Math.min(ALTO - y, Math.round(z.h));
  if (w < 4 || h < 4) return [];
  const seVe = (t) => est.subs.some((b) => t >= b.inicio && t < b.fin), umbral = CON_GRIS.includes(proy.estilo.subtitulos.estilo) ? 160 : 185;
  const tramos = [];
  let desde = null;
  for (let t = 0; t < proy.duracion; t += paso) {
    let claro = false;
    if (seVe(t)) {
      dibujar(proy, est, t, { subtitulos: false });
      const d = est.g.getImageData(x, y, w, h).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 16) s += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      claro = s / (d.length / 16) > umbral;
    }
    if (claro && desde === null) desde = t;
    if (!claro && desde !== null) { tramos.push([desde, t]); desde = null; }
  }
  if (desde !== null) tramos.push([desde, proy.duracion]);
  return tramos.filter(([a, b]) => b - a >= 0.5);
}
