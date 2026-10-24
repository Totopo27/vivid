#!/usr/bin/env node
// ver.mjs: enseña cualquier momento del vídeo en segundos, sin renderizarlo.
import { join } from "node:path";
import { argumentos, ayuda, carpetaProyecto, carpetaRevisar, fallo, lugarDelError, numero } from "./lib/comun.mjs";
import { preparar } from "./lib/cuadro.mjs";
import { guardar, hoja, reparto } from "./lib/hojas.mjs";
import { estiloPedido, nombreDe } from "./lib/marca.mjs";
import { abrir } from "./lib/proyecto.mjs";

ayuda(`
node motor/ver.mjs <proyecto> <qué> [--fps N] [--ancho px] [--sin-subtitulos] [--apertura nombre] [--look nombre]
                                    [--subtitulos estilo]

Hace una hoja de fotogramas (un .jpg en <proyecto>/revisar/) y dice dónde está. Míralo siempre: es como se ve.
  <segundo>            un fotograma grande, por ejemplo 12.4
  <a>-<b>              de a a b segundos, a --fps (10 si no dices nada), por ejemplo 9-11.5
  palabra <p>[#n]      de 0,5 s antes a 0,8 s después de esa palabra, a 30 fps (sodio, sol#2)
  frase <n>            la frase n, de su primera palabra a la última, en 8 fotogramas
  frases               todas las frases, una fila cada una (de su primera palabra a la última)
  corte <n>            el cambio de plano n: 0,6 s antes y 0,4 s después, a 30 fps
  planos               el principio, el medio y el final de cada plano
--apertura 01-tunel: lo mismo, con esa otra apertura del hook (video/aperturas/01-tunel.js en lugar del plano 01).
--look neon, --subtitulos karaoke: con otro look u otros subtítulos, sin tocar el guion (node motor/marca.mjs dice
  cuáles hay). La hoja lleva su nombre delante (neon-frase-5.jpg).
`);

const { sueltos, op } = argumentos();
const dir = carpetaProyecto(sueltos[0]);
const que = sueltos.slice(1).map((x) => x.replace(/^(\d+),(\d+)$/, "$1.$2").replace(/^(\d+(?:,\d+)?)-(\d+(?:,\d+)?)$/, (_, a, b) => `${a.replace(",", ".")}-${b.replace(",", ".")}`));
if (!que.length) fallo("Falta qué ver: un segundo, un tramo (9-11.5), palabra <p>, frase <n>, frases, corte <n> o planos.");
if (op.apertura === true) fallo("--apertura necesita el nombre de la apertura, por ejemplo --apertura 01-tunel.");
const apertura = op.apertura ? String(op.apertura) : null, sobre = estiloPedido(op);
const proy = await abrir(dir, { apertura, estilo: sobre }), est = preparar(proy), v = proy.v;
if (proy.avisoVoz) console.log(`  aviso: ${proy.avisoVoz}`);
const subtitulos = !op["sin-subtitulos"], ancho = numero(op, "ancho", 0);
const delante = [apertura, nombreDe(sobre)].filter(Boolean).join("-");
const sale = (c, nombre) => console.log(guardar(c, join(carpetaRevisar(dir), delante ? `${delante}-${nombre}` : nombre)));
// si un plano no se puede dibujar, en qué segundo, en qué parte y en qué línea (no la pila de Node)
const dibuja = (...a) => {
  try { return hoja(...a); } catch (e) {
    const donde = lugarDelError(e, dir), msg = String(e.message).replace(/^.*?, segundo [\d.]+: /, "");
    fallo(`No se puede dibujar${e.parte ? ` el segundo ${e.segundo.toFixed(2)}, en ${e.parte}` : ""}: ${msg}` + (donde ? `\n  (${donde})` : ""));
  }
};
// lo que no está en la voz (una palabra, una frase), con su porqué
const busca = (f) => { try { return f(); } catch (e) { fallo(e.message); } };
const fpsDe = (def) => { const f = numero(op, "fps", def); if (!(f > 0 && f <= 120)) fallo("--fps va de 1 a 120."); return f; };

if (que[0] === "palabra") {
  if (!que[1]) fallo("Falta la palabra: node motor/ver.mjs <proyecto> palabra sodio (o sol#2, la segunda).");
  const w = busca(() => v.palabra(que[1])), fps = fpsDe(30);
  const ts = []; for (let t = w.inicio - 0.5; t <= w.inicio + 0.8 + 1e-6; t += 1 / fps) ts.push(t);
  if (ts.length > 150) fallo(`Son ${ts.length} fotogramas: pide menos fps (como mucho 110).`);
  sale(dibuja(proy, est, ts, { ancho: ancho || 150, columnas: 10, subtitulos, titulo: `«${w.texto}» en ${w.inicio.toFixed(2)} s, a ${fps} fps` }), `palabra-${que[1].replace(/[^\p{L}\p{N}#]/gu, "")}.jpg`);
} else if (que[0] === "frase") {
  const f = busca(() => v.frase(Number(que[1]))), a = f.palabras[0].inicio, b = f.palabras[f.palabras.length - 1].fin;
  sale(dibuja(proy, est, reparto(a, b, Math.max(2, Math.min(64, Math.round(numero(op, "n", 8))))), { ancho: ancho || 200, columnas: 8, subtitulos, titulo: `Frase ${f.n}: «${f.texto}»` }), `frase-${f.n}.jpg`);
} else if (que[0] === "frases") {
  const ts = [];
  for (const f of v.frases) reparto(f.palabras[0].inicio, f.palabras[f.palabras.length - 1].fin, 6).forEach((t, i) => ts.push(i ? t : { t, marca: `${f.n}: ${t.toFixed(2)}` }));
  sale(dibuja(proy, est, ts, { ancho: ancho || 150, columnas: 6, subtitulos, titulo: "Cada frase, de su primera palabra a la última" }), "frases.jpg");
} else if (que[0] === "corte") {
  const n = Number(que[1]), p = proy.planos[n];
  if (!p || n < 1) fallo(proy.planos.length > 1 ? `No hay corte ${que[1] ?? ""}: hay ${proy.planos.length - 1} (del 1 al ${proy.planos.length - 1}).` : "Este vídeo tiene un solo plano: no hay cortes.");
  const fps = fpsDe(30), ts = [];
  for (let t = p.desde - 0.6; t < p.desde + 0.4; t += 1 / fps) ts.push(Math.abs(t - p.desde) < 0.5 / fps ? { t, marca: `${t.toFixed(2)} ${p.entrada}` } : t);
  sale(dibuja(proy, est, ts, { ancho: ancho || 150, columnas: 10, subtitulos, titulo: `Corte ${n}: de ${proy.planos[n - 1].id} a ${p.id} (${p.entrada}) en ${p.desde.toFixed(2)} s` }), `corte-${n}.jpg`);
} else if (que[0] === "planos") {
  const ts = [];
  for (const p of proy.planos) reparto(p.desde + 0.02, p.hasta - 0.02, 4).forEach((t, i) => ts.push(i ? t : { t, marca: p.id.slice(0, 14) }));
  sale(dibuja(proy, est, ts, { ancho: ancho || 150, columnas: 8, subtitulos, titulo: "Cada plano: principio, medio y final" }), "planos.jpg");
} else if (/^\d+(\.\d+)?-\d+(\.\d+)?$/.test(que[0])) {
  const [a, b] = que[0].split("-").map(Number), fps = fpsDe(10), ts = [];
  if (b <= a) fallo(`El tramo va de menos a más: ${b}-${a}, no ${a}-${b}.`);
  if (a >= proy.duracion) fallo(`El vídeo dura ${proy.duracion.toFixed(2)} s: el tramo ${a}-${b} queda fuera.`);
  for (let t = a; t <= b + 1e-6; t += 1 / fps) ts.push(t);
  if (ts.length > 120) fallo(`Son ${ts.length} fotogramas: pide menos tiempo o menos fps (como mucho 120).`);
  sale(dibuja(proy, est, ts, { ancho: ancho || 150, columnas: 10, subtitulos, titulo: `De ${a} a ${b} s, a ${fps} fps` }), `tramo-${a}-${b}.jpg`);
} else if (/^\d+(\.\d+)?$/.test(que[0])) {
  const t = Number(que[0]);
  if (t > proy.duracion) fallo(`El vídeo dura ${proy.duracion.toFixed(2)} s: no hay segundo ${t}.`);
  sale(dibuja(proy, est, [t], { ancho: ancho || 540, columnas: 1, subtitulos }), `en-${t}.jpg`);
} else fallo(`No sé ver «${que.join(" ")}». Mira node motor/ver.mjs --ayuda`);
