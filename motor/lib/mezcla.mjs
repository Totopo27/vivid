// La pista de efectos: cada sonido en su segundo, a su velocidad, con su nivel puesto frente a la voz que suena a su
// alrededor (como en los reels que funcionaron: lo más fuerte del efecto, 10 ms, queda `db` por debajo de lo más
// fuerte de la voz cerca, 50 ms en ±0,4 s; si ahí no habla nadie, por debajo de su voz típica).
import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { RAIZ, escribirJson, escribirWav, fallo, leerAudio, leerJson } from "./comun.mjs";
import { juntar, validarSonidos } from "./validar.mjs";

export const SR = 48000;
export const CARPETA = join(RAIZ, "sonidos");

// Los sonidos que hay: nombre → archivo.
export function catalogo() {
  const c = {};
  for (const f of readdirSync(CARPETA)) { const m = f.match(/^(.+)\.(mp3|wav)$/); if (m) c[m[1]] = join(CARPETA, f); }
  return c;
}

// lo más fuerte (RMS en ventanas de `ven` muestras) entre dos segundos: su nivel en dB y dónde empieza
function fuerte(a, t0, t1, ven) {
  let mejor = 0, donde = Math.max(0, t0);
  for (let i = Math.max(0, Math.floor(t0 * SR)); i + ven <= Math.min(a.length, Math.floor(t1 * SR)); i += ven / 2) {
    let s = 0;
    for (let j = i; j < i + ven; j++) s += a[j] * a[j];
    const r = Math.sqrt(s / ven);
    if (r > mejor) { mejor = r; donde = i / SR; }
  }
  return { db: 20 * Math.log10(mejor + 1e-9), t: donde };
}

// paso bajo de dos polos: quita los agudos ásperos
function pasoBajo(x, fc) {
  const w = (2 * Math.PI * fc) / SR, cw = Math.cos(w), al = Math.sin(w) / (2 * Math.SQRT1_2);
  const b0 = (1 - cw) / 2, b1 = 1 - cw, b2 = (1 - cw) / 2, a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y;
  }
}

// eventos: [{ t, sonido, db = -10, vel = 1, lp, ancla = "golpe" | "empieza", reves, corta, que }]
//   t       el segundo en que cae lo más fuerte del sonido (su golpe); con ancla "empieza", en el que empieza
//   vel     más de 1, más agudo y corto; menos de 1, más grave y largo
//   lp      quita los agudos por encima de esos Hz (más sordo, más lejos)
//   reves   al revés: crece y se corta (para algo que vuelve atrás o que se absorbe)
//   corta   el segundo en que se apaga del todo (con su plano: si el plano se corta, el sonido también)
export function mezclar(eventos, voz) {
  const sonidos = catalogo(), cache = {}, pista = new Float32Array(voz.length);
  const tipica = fuerte(voz, 0, voz.length / SR, 2400).db - 3;
  const usados = [];
  for (const e0 of [...eventos].sort((a, b) => a.t - b.t)) {
    const e = { db: -10, vel: 1, ancla: "golpe", ...e0 };
    const ruta = sonidos[e.sonido];
    if (!ruta) fallo(`No hay ningún sonido «${e.sonido}» en sonidos/. Hay: ${Object.keys(sonidos).join(", ")}.`);
    const src = cache[ruta] || (cache[ruta] = leerAudio(ruta, SR));
    let n = Math.floor(src.length / e.vel);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) { const p = i * e.vel, k = Math.floor(p), f = p - k; x[i] = (src[k] || 0) * (1 - f) + (src[k + 1] || 0) * f; }
    if (e.reves) x.reverse();
    if (e.lp) pasoBajo(x, e.lp);
    if (n < 2) continue; // tan rápido que no dura nada
    const golpe = fuerte(x, 0, n / SR, Math.min(480, n - (n % 2))), ancla = e.ancla === "empieza" ? 0 : golpe.t;
    const cerca = fuerte(voz, e.t - 0.4, e.t + 0.4, 2400).db, ref = cerca < -45 ? tipica : cerca;
    const gan = 10 ** ((ref + e.db - golpe.db) / 20), ini = Math.round((e.t - ancla) * SR);
    if (e.corta !== undefined) n = Math.max(0, Math.min(n, Math.round(e.corta * SR) - ini));
    const fundido = e.corta !== undefined ? 0.08 : Math.min(0.04, n / SR / 3);
    for (let i = 0; i < n; i++) {
      const j = ini + i;
      if (j < 0 || j >= pista.length) continue;
      const ti = i / SR, queda = n / SR - ti;
      pista[j] += x[i] * gan * Math.min(1, ti / 0.004) * Math.min(1, queda / fundido);
    }
    usados.push({ ...e, desde: ini / SR, hasta: (ini + n) / SR });
  }
  return { pista, usados };
}

// Los tramos sin ningún efecto que suene (más de `largo` segundos).
export function huecos(pista, largo = 2) {
  const W = 2400, h = [];
  let desde = null;
  for (let i = 0; i + W <= pista.length; i += W) {
    let s = 0;
    for (let j = i; j < i + W; j++) s += pista[j] * pista[j];
    const suena = 10 * Math.log10(s / W + 1e-12) > -48, t = i / SR;
    if (!suena && desde === null) desde = t;
    if (suena && desde !== null) { if (t - desde > largo) h.push([desde, t]); desde = null; }
  }
  // el que llega hasta el final del vídeo también cuenta
  if (desde !== null && pista.length / SR - desde > largo) h.push([desde, pista.length / SR]);
  return h;
}

export const hayEfectos = (dir) => existsSync(join(dir, "sonidos.js"));

// La lista de sonidos.js, cargada y comprobada (v: la voz, para los que la calculan con una función).
export async function cargarSonidos(dir, v, duracion = Infinity) {
  let m;
  try { m = await import(pathToFileURL(join(dir, "sonidos.js")).href); }
  catch (e) { fallo(`sonidos.js no se puede cargar:\n${e.stack || e}`); }
  let eventos = m.default;
  if (typeof eventos === "function") {
    try { eventos = eventos(v); } catch (e) { fallo(`sonidos.js falla al hacer la lista: ${e.message}`); }
  }
  const { errores, avisos } = validarSonidos(eventos, { duracion, catalogo: catalogo() });
  if (errores.length) fallo(juntar("sonidos.js tiene que arreglarse:", errores));
  return { eventos, avisos };
}

// La firma de una pista: lo que dice sonidos.js (con los momentos que salen de los planos) y la voz que suena.
export const firmaEfectos = (eventos, voz) => createHash("sha1").update(JSON.stringify(eventos)).update(new Uint8Array(voz.buffer, voz.byteOffset, voz.byteLength)).digest("hex").slice(0, 12);

// sonidos/efectos.wav, con su firma al lado (sonidos/efectos.json) para saber luego si sigue al día.
export function guardarEfectos(dir, pista, firma) {
  const f = join(dir, "sonidos", "efectos.wav");
  escribirWav(f, pista, SR);
  escribirJson(join(dir, "sonidos", "efectos.json"), { firma });
  return f;
}

// La pista de efectos que va en el render. Si sonidos.js, los planos o la voz han cambiado desde que se hizo (su
// firma ya no es la de ahora), se rehace aquí. Sin firma guardada (los ejemplos, los vídeos de antes), se usa tal cual.
// Devuelve { pista, rehecha } (pista null si el vídeo no lleva efectos: sin sonidos.js, o con él vacío).
export async function efectosAlDia(dir, v, duracion, voz) {
  const fx = join(dir, "sonidos", "efectos.wav"), fj = join(dir, "sonidos", "efectos.json");
  if (hayEfectos(dir)) {
    const { eventos } = await cargarSonidos(dir, v, duracion);
    if (!eventos.length) return { pista: null, rehecha: false };
    let antes = null;
    try { antes = existsSync(fj) ? leerJson(fj).firma : null; } catch { /* sin firma */ }
    const firma = firmaEfectos(eventos, voz);
    if (!existsSync(fx) || (antes && antes !== firma)) {
      const { pista } = mezclar(eventos, voz);
      guardarEfectos(dir, pista, firma);
      return { pista: leerAudio(fx, SR), rehecha: true };
    }
    return { pista: existsSync(fx) ? leerAudio(fx, SR) : null, rehecha: false };
  }
  // sin sonidos.js el vídeo no lleva efectos, aunque quede la pista de antes
  return { pista: null, rehecha: false };
}
