// De la toma de la voz (cada palabra que se oye, con su segundo) a las palabras de cada frase del guion. Lo puro de
// voz.mjs: aquí no se pide nada ni se escribe nada, así que se puede probar (motor/pruebas-rapidas.mjs).
import { createHash } from "node:crypto";
import { r3 } from "./comun.mjs";
import { clave } from "./voz-actual.js";

// Las palabras de un texto: lo que va entre espacios y tiene alguna letra o cifra («—» o «...» sueltos no cuentan).
export const palabrasDe = (s) => String(s).split(/\s+/).filter((w) => w.replace(/[^\p{L}\p{N}]/gu, "").length);

// Lo que se le pide a la voz, frase a frase: «dicho» si lo hay, si no el texto.
export const dichosDe = (guion) => guion.frases.map((f) => String(f.dicho || f.texto || "").trim());

// La firma de una toma: si no cambian ni la voz ni lo que se dice, la toma que hay vale y no se vuelve a pagar. Solo
// entra lo que cambia el sonido, siempre en el mismo orden (así no cambia por cómo esté escrito el guion).
export function firmaDe(voz, dichos) {
  const { id, modelo, estabilidad, similitud, estilo, velocidad, codigoIdioma } = voz;
  const v = { id, modelo, estabilidad, similitud, estilo, velocidad, ...(codigoIdioma ? { codigoIdioma } : {}) };
  return createHash("sha1").update(JSON.stringify([v, dichos])).digest("hex").slice(0, 12);
}

// Las letras con su segundo (lo que devuelve ElevenLabs) → palabras { texto, inicio, fin }.
export function palabrasDeLetras(a) {
  const ws = [];
  let cur = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) ws.push(cur); cur = null; return; }
    if (!cur) cur = { texto: "", inicio: a.character_start_times_seconds[i] };
    cur.texto += ch; cur.fin = a.character_end_times_seconds[i];
  });
  if (cur) ws.push(cur);
  return ws.filter((w) => w.texto.replace(/[^\p{L}\p{N}]/gu, "").length);
}

// Lo que se lee y lo que se dice, palabra a palabra. Las que coinciden se quedan con su segundo de verdad; solo lo que
// se lee distinto de como se dice («IA» dicho «i a», «4.000» dicho «cuatro mil») toma el tramo de lo que se dijo en su
// lugar, repartido por letras. (Repartir la frase entera por letras movía todas sus palabras hasta 0,3 s.)
// escritas: textos; oidas: [{ texto, inicio, fin }] → [[inicio, fin]] de cada escrita.
export function alinear(escritas, oidas) {
  const E = escritas.map(clave), O = oidas.map((w) => clave(w.texto)), n = E.length, m = O.length;
  if (!n) return [];
  if (!m) throw new Error("no hay nada dicho con que alinear lo escrito");
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = E[i] === O[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const pares = [];
  for (let i = 0, j = 0; i < n && j < m;) {
    if (E[i] === O[j]) { pares.push([i, j]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
  }
  pares.push([n, m]);
  const out = new Array(n);
  let i0 = 0, j0 = 0;
  for (const [i1, j1] of pares) {
    if (i1 > i0) {
      // lo que se lee entre dos palabras que coinciden, en el tramo de lo que se dijo entre ellas
      const a = j1 > j0 ? oidas[j0].inicio : j0 > 0 ? oidas[j0 - 1].fin : oidas[0].inicio, b = j1 > j0 ? oidas[j1 - 1].fin : a;
      const pesos = escritas.slice(i0, i1).map((w) => Math.max(2, w.length + 1)), tot = pesos.reduce((x, y) => x + y, 0);
      let t = a;
      pesos.forEach((p, q) => { const d = ((b - a) * p) / tot; out[i0 + q] = [t, t + d]; t += d; });
    }
    if (i1 < n) out[i1] = [oidas[j1].inicio, oidas[j1].fin];
    i0 = i1 + 1; j0 = j1 + 1;
  }
  return out;
}

// Las frases y las palabras de voz/tiempos.json. ws: las palabras de la toma; quitar: el silencio que se quitó delante.
// Las palabras de cada frase salen de contar las palabras de lo que se dice. Devuelve { frases, palabras, avisos }.
export function tiemposDe(frasesGuion, dichos, ws, quitar = 0) {
  const palabras = [], frases = [], avisos = [];
  let k = 0;
  frasesGuion.forEach((f, i) => {
    const dichas = palabrasDe(dichos[i]), escritas = palabrasDe(f.texto), oidas = ws.slice(k, k + dichas.length);
    k += dichas.length;
    if (!oidas.length) throw new Error(`La frase ${i + 1} no aparece en la voz: rehaz la voz con --rehacer.`);
    const a = oidas[0].inicio - quitar, b = oidas[oidas.length - 1].fin - quitar;
    const ts = alinear(escritas, oidas).map(([x, y]) => [x - quitar, y - quitar]);
    escritas.forEach((w, j) => palabras.push({ texto: w, inicio: r3(ts[j][0]), fin: r3(ts[j][1]), frase: i + 1, clave: !!f.clave && clave(w) === clave(f.clave) }));
    frases.push({ n: i + 1, texto: f.texto, clave: f.clave || null, inicio: r3(a), fin: r3(b) });
  });
  if (k !== ws.length) avisos.push(`la voz tiene ${ws.length} palabras y las frases ${k}; si algo no cuadra, revisa «dicho» en guion.json.`);
  for (const f of frases) if (f.clave && !palabras.some((w) => w.frase === f.n && w.clave)) avisos.push(`la clave «${f.clave}» no está en la frase ${f.n}.`);
  return { frases, palabras, avisos };
}
