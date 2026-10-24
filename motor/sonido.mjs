#!/usr/bin/env node
// sonido.mjs: hace la pista de efectos del vídeo con lo que dice sonidos.js del proyecto.
import { argumentos, ayuda, carpetaProyecto, corta, fallo, leerVoz } from "./lib/comun.mjs";
import { SR, cargarSonidos, firmaEfectos, guardarEfectos, hayEfectos, huecos, mezclar } from "./lib/mezcla.mjs";
import { abrir } from "./lib/proyecto.mjs";

ayuda(`
node motor/sonido.mjs <proyecto>

Lee <proyecto>/sonidos.js (cada efecto: en qué segundo, qué sonido, cómo de fuerte) y escribe
<proyecto>/sonidos/efectos.wav, que render.mjs mezcla con la voz (si luego cambian sonidos.js o los planos, render.mjs
la rehace sola). Dice:
  - cada momento con sonido (los que llevan «que»),
  - los tramos de más de 2 s sin ningún efecto (si en la imagen pasa algo ahí, le falta su sonido),
  - los efectos que caen en un corte (un corte no suena: el sonido va con lo que se mueve).
Los sonidos que hay están en sonidos/ (qué es cada uno, en sonidos/LEEME.md).
`);

const { sueltos } = argumentos();
const dir = carpetaProyecto(sueltos[0]);
if (!hayEfectos(dir)) fallo(`Este proyecto no tiene sonidos.js. Si el vídeo lleva efectos, créalo (mira guia/sonido.md).`);
const proy = await abrir(dir);
const { eventos, avisos } = await cargarSonidos(dir, proy.v, proy.duracion);
for (const a of avisos) console.log(`  aviso: ${a}`);
if (!eventos.length) fallo(`sonidos.js aún no tiene ningún efecto: ponlos con pon("aire", t, { ... }) (mira guia/sonido.md).`);
const voz = leerVoz(dir, SR);
const { pista, usados } = mezclar(eventos, voz);
const salida = guardarEfectos(dir, pista, firmaEfectos(eventos, voz));

let pico = 0;
for (const x of pista) pico = Math.max(pico, Math.abs(x));
for (const e of usados) if (e.que) console.log(`${e.t.toFixed(2).padStart(6)} s  ${e.sonido.padEnd(12)} ${e.que}`);
console.log(`${usados.length} sonidos; pico de los efectos ${(20 * Math.log10(pico + 1e-9)).toFixed(1)} dB → ${corta(salida)}`);
const hs = huecos(pista, 2);
if (hs.length) console.log("Sin ningún efecto más de 2 s: " + hs.map(([a, b]) => `${a.toFixed(1)}–${b.toFixed(1)} s`).join(", ") + ". Si ahí se mueve algo, le falta su sonido.");
const cortes = proy.planos.slice(1).filter((p) => p.entrada !== "sigue").map((p) => p.desde);
for (const e of usados) for (const c of cortes) if (Math.abs(e.t - c) < 0.08) console.log(`  aviso: «${e.sonido}» en ${e.t.toFixed(2)} s cae en el corte de ${c.toFixed(2)} s: el corte no suena.`);
