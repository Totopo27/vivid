// Abre un proyecto para dibujarlo: su guion, su voz (cuándo se dice cada palabra) y sus planos.
//
// Un plano es un archivo de video/planos/ que exporta:
//   desde     cuándo empieza: una palabra ("sodio", "sol#2"), un número de segundos o una función que lo calcula.
//             El primero empieza en 0. Cada plano dura hasta que empieza el siguiente.
//   entrada   cómo se entra en él desde el anterior: "corte" (lo normal: otro sitio), "sigue" (el mismo sitio y la
//             misma cámara: no se ve ningún cambio) o "fundido" (un fundido de 0,3 s).
//   dibuja(g, t)   dibuja el fotograma del segundo t del vídeo (no del plano) en el lienzo g, de 1080 × 1920.
// Los planos se ordenan por cuándo empiezan, no por su nombre.
//
// Una apertura es otra versión de un plano del hook, en video/aperturas/, con el mismo número que el plano al que
// sustituye (aperturas/01-tunel.js en lugar de planos/01-fiesta.js). abrir(dir, { apertura: "01-tunel" }) la usa.
// abrir(dir, { estilo: { look: "neon", subtitulos: { estilo: "karaoke" } } }) lo dibuja con otro estilo, sin tocar el
// guion (lo que piden --look y --subtitulos).
import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { arg, corta, fallo, leerJsonDe } from "./comun.mjs";
import { dichosDe, firmaDe } from "./alinear.mjs";
import { llenarEstilo } from "./estilo-actual.js";
import { cargarMarca, estiloDe, leerMarca, vozDe } from "./marca.mjs";
import { juntar, validarGuion, validarMarca, validarPedido, validarSubtitulos } from "./validar.mjs";
import { llenar, v } from "./voz-actual.js";

export const ADELANTO = 0.04; // la imagen nueva llega dos fotogramas antes que su palabra: así se ve cuando se oye

export async function abrir(dir, { apertura = null, estilo: sobre = null } = {}) {
  const guion = leerJsonDe(join(dir, "guion.json"), "el guion");
  const marca = cargarMarca(), lm = leerMarca();
  const vg = validarGuion(guion), errores = [...vg.errores, ...validarPedido(sobre)];
  if (lm.existe) errores.push(...validarMarca(lm.datos, corta(lm.ruta)).errores);
  if (errores.length) fallo(juntar(`No se puede abrir ${corta(dir)}:`, errores));
  const avisos = [...vg.avisos];

  const ft = join(dir, "voz", "tiempos.json");
  if (!existsSync(ft)) fallo(`Este proyecto aún no tiene voz: node motor/voz.mjs ${arg(dir)}`);
  const tiempos = leerJsonDe(ft, "los tiempos de la voz");
  if (!(tiempos.duracion > 0) || !Array.isArray(tiempos.palabras) || !Array.isArray(tiempos.frases) || !tiempos.palabras.length)
    fallo(`${corta(ft)} está roto: rehazlo con node motor/voz.mjs ${arg(dir)} (si las frases no han cambiado, no se vuelve a pagar).`);
  llenar(tiempos);
  const vieja = vozVieja(guion, tiempos, marca);
  const avisoVoz = vieja ? vieja.aviso + ` node motor/voz.mjs ${arg(dir)}` : null;
  if (avisoVoz) avisos.push(avisoVoz);
  const estilo = estiloDe(guion, marca, sobre), mal = [];
  validarSubtitulos(estilo.subtitulos, "los subtítulos de este vídeo (marca + guion.json)", mal);
  if (mal.length) fallo(juntar(`No se puede abrir ${corta(dir)}:`, mal));
  llenarEstilo(estilo);

  const carpeta = join(dir, "video", "planos");
  if (!existsSync(carpeta)) fallo(`Este proyecto aún no tiene planos: crea ${corta(carpeta)} con un archivo por plano.`);
  let archivos = readdirSync(carpeta).filter((f) => /\.m?js$/.test(f)).sort().map((f) => join(carpeta, f));
  if (apertura) {
    const otra = [".js", ".mjs"].map((x) => join(dir, "video", "aperturas", apertura + x)).find((r) => existsSync(r));
    if (!otra) fallo(`No hay ninguna apertura «${apertura}» en ${corta(join(dir, "video", "aperturas"))}.`);
    const num = apertura.match(/^(\d+)-/)?.[1];
    if (!num) fallo(`La apertura «${apertura}» tiene que empezar por el número del plano al que sustituye (01-...).`);
    if (!archivos.some((a) => basename(a).startsWith(num + "-"))) fallo(`La apertura «${apertura}» sustituye al plano ${num}, pero en ${corta(carpeta)} no hay ninguno que empiece por «${num}-».`);
    archivos = archivos.filter((a) => !basename(a).startsWith(num + "-")).concat(otra);
  }
  const planos = [];
  for (const ruta of archivos) {
    const f = basename(ruta);
    let m;
    try { m = await import(pathToFileURL(ruta).href); }
    catch (e) { fallo(`El plano ${f} no se puede cargar:\n${e.stack || e}` + (vieja?.texto ? `\n\nOjo: ${avisoVoz}` : "")); }
    if (typeof m.dibuja !== "function") fallo(`El plano ${f} no exporta dibuja(g, t): export function dibuja(g, t) { ... }`);
    let desde;
    try { desde = cuando(m.desde ?? 0); }
    catch (e) { fallo(`El plano ${f}: ${e.message}` + (vieja?.texto ? `\n\nOjo: ${avisoVoz}` : "")); }
    if (desde >= v.duracion) fallo(`El plano ${f} empieza en el segundo ${desde.toFixed(2)}, pero la voz dura ${v.duracion.toFixed(2)} s: no se vería nunca. Mira su «desde».`);
    const entrada = m.entrada || "corte";
    if (!["corte", "sigue", "fundido"].includes(entrada)) fallo(`El plano ${f}: entrada «${entrada}» no existe (corte, sigue o fundido).`);
    planos.push({ id: f.replace(/\.m?js$/, ""), desde, entrada, dibuja: m.dibuja, desdeDicho: m.desde });
  }
  if (!planos.length) fallo(`No hay ningún plano en ${corta(carpeta)}.`);
  const sinDesde = planos.filter((p) => p.desdeDicho === undefined);
  if (sinDesde.length > 1) fallo(`Los planos ${sinDesde.map((p) => p.id).join(", ")} no dicen cuándo empiezan. Solo el primero puede no decirlo; los demás, export const desde = "palabra".`);
  planos.sort((a, b) => a.desde - b.desde);
  planos[0].desde = 0;
  for (let i = 1; i < planos.length; i++) if (planos[i].desde - planos[i - 1].desde < 0.2)
    fallo(`Los planos ${planos[i - 1].id} y ${planos[i].id} empiezan casi a la vez (${planos[i - 1].desde.toFixed(2)} y ${planos[i].desde.toFixed(2)} s).`);
  planos.forEach((p, i) => (p.hasta = i + 1 < planos.length ? planos[i + 1].desde : v.duracion));
  return { dir, guion, marca, estilo, v, planos, duracion: v.duracion, avisos, avisoVoz, vozVieja: !!vieja?.texto };
}

// Una palabra, un número o una función → segundos del vídeo.
export function cuando(d) {
  let t;
  if (typeof d === "number") t = d;
  else if (typeof d === "function") t = d(v);
  else if (typeof d === "string") t = Math.max(0, v.t(d) - ADELANTO);
  else throw new Error(`desde tiene que ser una palabra, un número o una función (es ${typeof d}).`);
  if (typeof t !== "number" || !Number.isFinite(t) || t < 0) throw new Error(`«desde» da ${t}: tiene que salir un segundo del vídeo (0 o más).`);
  return t;
}

// Si la voz que hay (voz/tiempos.json) es de otro guion: { aviso, texto } (texto: cambió lo que se dice), o null.
export function vozVieja(guion, tiempos, marca) {
  const fs = guion.frases, ts = tiempos.frases;
  const distinta = fs.length !== ts.length ? Math.min(fs.length, ts.length) + 1 : fs.findIndex((f, i) => String(f.texto || "").trim() !== String(ts[i].texto || "").trim()) + 1;
  if (distinta) return { texto: true, aviso: `guion.json ha cambiado desde que se hizo la voz (desde la frase ${distinta}): lo que se oye y los subtítulos son los de antes. Rehaz la voz:` };
  const cambia = fs.findIndex((f, i) => (f.clave || null) !== (ts[i].clave || null)) + 1;
  if (cambia) return { texto: false, aviso: `La clave de la frase ${cambia} ha cambiado desde la voz: el subtítulo marca la de antes. Rehaz los tiempos (no se paga: la toma sigue valiendo):` };
  if (tiempos.firma && tiempos.firma !== firmaDe(vozDe(guion, marca), dichosDe(guion)))
    return { texto: false, aviso: `La voz es de antes de cambiar «dicho» o los ajustes de la voz (en guion.json o en la marca). Si quieres el cambio, pide otra toma:` };
  return null;
}
