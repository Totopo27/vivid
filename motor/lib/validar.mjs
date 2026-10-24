// Lo que se comprueba de los archivos de un vídeo antes de usarlos (guion.json, marca.json, sonidos.js, un formato):
// cada problema, en una frase que dice dónde está y cómo se arregla. Devuelven { errores, avisos }; quien llama decide
// si para (voz.mjs para con cualquier cosa del guion antes de pagar la voz) o solo avisa.
import { createCanvas } from "@napi-rs/canvas";
import { LOOKS } from "../kit/looks/index.js";
import { palabrasDe } from "./alinear.mjs";
import { POSICIONES_FIRMA } from "./firma.mjs";
import { POSICIONES, esObjeto } from "./marca.mjs";
import { ESTILOS } from "./subtitulos.mjs";
import { clave } from "./voz-actual.js";

const lista = (o) => (Array.isArray(o) ? o : Object.keys(o)).join(", ");
const es = (x) => (x === undefined ? "nada" : Number.isNaN(x) ? "NaN" : JSON.stringify(x));

// Los ajustes de una voz: "texto", "idioma" o [mínimo, máximo].
export const AJUSTES_VOZ = { id: "texto", modelo: "texto", estabilidad: [0, 1], similitud: [0, 1], estilo: [0, 1], velocidad: [0.7, 1.2], codigoIdioma: "idioma" };

export function validarVoz(voz, donde, errores) {
  if (!esObjeto(voz)) return errores.push(`${donde} tiene que ser un objeto, por ejemplo { "id": "...", "velocidad": 1 } (es ${es(voz)}).`);
  for (const [k, x] of Object.entries(voz)) {
    const tipo = AJUSTES_VOZ[k];
    if (!tipo) errores.push(`${donde}: «${k}» no es un ajuste de la voz. Los que hay: ${lista(AJUSTES_VOZ)}.`);
    else if (tipo === "texto") { if (typeof x !== "string" || !x.trim()) errores.push(`${donde}.${k} tiene que ser un texto (es ${es(x)}).`); }
    else if (tipo === "idioma") { if (typeof x !== "string" || !/^[a-z]{2,3}$/.test(x)) errores.push(`${donde}.${k} es el código del idioma, en dos letras: "es", "en", "pt"... (es ${es(x)}).`); }
    else if (typeof x !== "number" || !Number.isFinite(x) || x < tipo[0] || x > tipo[1]) errores.push(`${donde}.${k} tiene que ser un número entre ${tipo[0]} y ${tipo[1]} (es ${es(x)}).`);
  }
}

export function validarIdioma(x, donde, errores) {
  if (typeof x !== "string" || !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(x)) return errores.push(`${donde} es el código del idioma: "es", "en", "pt-BR"... (no un nombre: es ${es(x)}).`);
  try { Intl.getCanonicalLocales(x); } catch { errores.push(`${donde}: «${x}» no es un idioma ("es", "en", "pt-BR"...).`); }
}

export function validarLook(x, donde, errores) {
  if (typeof x !== "string" || !LOOKS[x]) errores.push(`${donde}: no hay ningún look «${x}». Hay: ${lista(LOOKS)}.`);
}

// estiloBase: el estilo que tendrán si no dicen otro (el de la marca, o caja).
export function validarSubtitulos(s, donde, errores, estiloBase = "caja") {
  if (typeof s === "string") {
    if (!POSICIONES.includes(s)) errores.push(`${donde}: «${s}» no es una posición (${lista(POSICIONES)}).` + (ESTILOS[s] ? ` Para el estilo «${s}»: { "estilo": "${s}" }.` : ""));
    return;
  }
  if (!esObjeto(s)) return errores.push(`${donde} tiene que ser una posición (${lista(POSICIONES)}) o { "estilo": "...", "posicion": "..." } (es ${es(s)}).`);
  if (s.estilo !== undefined && (typeof s.estilo !== "string" || !ESTILOS[s.estilo])) errores.push(`${donde}.estilo: no hay ningún estilo de subtítulos «${s.estilo}». Hay: ${lista(ESTILOS)}.`);
  if (s.posicion !== undefined && !POSICIONES.includes(s.posicion)) errores.push(`${donde}.posicion: «${s.posicion}» no es una posición (${lista(POSICIONES)}).`);
  const est = s.estilo ?? estiloBase, suyas = ESTILOS[est]?.POSICIONES;
  if (suyas && s.posicion !== undefined && POSICIONES.includes(s.posicion) && !suyas.includes(s.posicion)) errores.push(`${donde}: los subtítulos «${est}» no van en «${s.posicion}» (van ${lista(suyas)}; los demás estilos, también en el centro).`);
  if (s.escala !== undefined && (typeof s.escala !== "number" || !(s.escala >= 0.6 && s.escala <= 1.6))) errores.push(`${donde}.escala es un número de 0,6 a 1,6 (es ${es(s.escala)}).`);
  if (s.mayusculas !== undefined && typeof s.mayusculas !== "boolean") errores.push(`${donde}.mayusculas es true o false (es ${es(s.mayusculas)}).`);
  if (s.colores !== undefined) {
    if (!esObjeto(s.colores)) errores.push(`${donde}.colores es { "tinta": "#ffffff", "marca": "#2f7cf6", ... } (es ${es(s.colores)}).`);
    else for (const [k, c] of Object.entries(s.colores)) if (!esColor(c)) errores.push(`${donde}.colores.${k}: «${c}» no es un color ("#ffd23f", "rgb(255,210,63)", "white"...).`);
  }
}

// La firma: "@micanal", false (sin firma) o { texto, posicion, opacidad, escala, color }.
export const CAMPOS_FIRMA = ["texto", "posicion", "opacidad", "escala", "color"];
export function validarFirma(f, donde, errores) {
  if (f === false || f === null) return;
  const o = typeof f === "string" ? { texto: f } : f;
  if (!esObjeto(o)) return errores.push(`${donde} es el texto de la firma ("@micanal"), false o { "texto": "@micanal", "posicion": "abajo" } (es ${es(f)}).`);
  for (const k of Object.keys(o)) if (!CAMPOS_FIRMA.includes(k)) errores.push(`${donde}: «${k}» no es un ajuste de la firma. Los que hay: ${lista(CAMPOS_FIRMA)}.`);
  if (o.texto !== undefined) {
    if (typeof o.texto !== "string" || !o.texto.trim() || o.texto.trim().length > 40) errores.push(`${donde}: el texto de la firma es un texto corto, de 1 a 40 letras (es ${es(o.texto)}).`);
    else { const faltan = sinLetra(o.texto); if (faltan.length) errores.push(`${donde}: la letra (Figtree) no tiene ${faltan.map((c) => `«${c}»`).join(" ")}: saldrían como cuadraditos.`); }
  }
  if (o.posicion !== undefined && !POSICIONES_FIRMA.includes(o.posicion)) errores.push(`${donde}.posicion es ${lista(POSICIONES_FIRMA)} (es ${es(o.posicion)}).`);
  if (o.opacidad !== undefined && (typeof o.opacidad !== "number" || !(o.opacidad >= 0.2 && o.opacidad <= 1))) errores.push(`${donde}.opacidad es un número de 0,2 a 1 (es ${es(o.opacidad)}).`);
  if (o.escala !== undefined && (typeof o.escala !== "number" || !(o.escala >= 0.6 && o.escala <= 1.2))) errores.push(`${donde}.escala es un número de 0,6 a 1,2 (es ${es(o.escala)}).`);
  if (o.color !== undefined && !esColor(o.color)) errores.push(`${donde}.color: «${o.color}» no es un color ("#ffffff", "white"...).`);
}

// Si el lienzo entiende ese color.
const prueba = createCanvas(1, 1).getContext("2d");
function esColor(c) {
  if (typeof c !== "string" || !c.trim()) return false;
  prueba.fillStyle = "#010203"; prueba.fillStyle = c;
  return prueba.fillStyle !== "#010203" || /^#010203$/i.test(c.trim());
}

// marca.json (lo que dice el archivo, sin mezclar con lo de siempre).
export const CAMPOS_MARCA = ["idioma", "look", "subtitulos", "voz", "voces", "efectos", "firma", "duracion"];
export function validarMarca(m, donde = "marca.json") {
  const errores = [];
  if (!esObjeto(m)) return { errores: [`${donde} tiene que ser un objeto: { "idioma": "en", ... }.`], avisos: [] };
  for (const k of Object.keys(m)) if (!CAMPOS_MARCA.includes(k)) errores.push(`${donde}: «${k}» no es un campo de la marca. Los que hay: ${lista(CAMPOS_MARCA)}.`);
  if (m.idioma !== undefined) validarIdioma(m.idioma, `${donde} idioma`, errores);
  if (m.look !== undefined) validarLook(m.look, `${donde} look`, errores);
  if (m.subtitulos !== undefined) validarSubtitulos(typeof m.subtitulos === "string" ? { posicion: m.subtitulos } : m.subtitulos, `${donde} subtitulos`, errores);
  if (m.voz !== undefined) validarVoz(m.voz, `${donde} voz`, errores);
  if (m.voces !== undefined) {
    if (!esObjeto(m.voces)) errores.push(`${donde} voces es una voz por idioma: { "en": { "id": "..." } }.`);
    else for (const [idioma, voz] of Object.entries(m.voces)) { validarIdioma(idioma, `${donde} voces`, errores); validarVoz(voz, `${donde} voces.${idioma}`, errores); }
  }
  if (m.efectos !== undefined && typeof m.efectos !== "boolean") errores.push(`${donde} efectos es true o false (es ${es(m.efectos)}).`);
  if (m.firma !== undefined) {
    validarFirma(m.firma, `${donde} firma`, errores);
    if (esObjeto(m.firma) && m.firma.texto === undefined) errores.push(`${donde} firma necesita su "texto" ("@micanal"): node motor/marca.mjs poner firma @micanal.`);
  }
  const d = m.duracion;
  if (d !== undefined && !(Array.isArray(d) && d.length === 2 && d.every((n) => typeof n === "number" && Number.isFinite(n)) && d[0] >= 5 && d[0] < d[1] && d[1] <= 600))
    errores.push(`${donde} duracion son los segundos que suelen durar los vídeos, [mínimo, máximo] entre 5 y 600, por ejemplo [30, 60] (es ${es(d)}).`);
  return { errores, avisos: [] };
}

// Lo que se pide al abrir (--look, --subtitulos).
export function validarPedido(sobre) {
  const errores = [];
  if (sobre?.look !== undefined) validarLook(sobre.look, "--look", errores);
  const s = sobre?.subtitulos;
  if (s?.estilo !== undefined && !ESTILOS[s.estilo]) errores.push(`--subtitulos: no hay ningún estilo de subtítulos «${s.estilo}». Hay: ${lista(ESTILOS)} (o una posición: ${lista(POSICIONES)}).`);
  return errores;
}

// guion.json. paraVoz: lo que haría mal la voz (una frase sin texto, una clave que no está...) es un error, no un aviso.
export const CAMPOS_GUION = ["titulo", "idioma", "look", "subtitulos", "voz", "firma", "frases", "formato"];
export const CAMPOS_FRASE = ["texto", "clave", "hook", "dicho", "papel"];
export function validarGuion(g, { paraVoz = false } = {}) {
  const errores = [], avisos = [], contenido = paraVoz ? errores : avisos;
  if (!esObjeto(g)) return { errores: [`guion.json tiene que ser un objeto: { "frases": [...] }.`], avisos };
  for (const k of Object.keys(g)) if (!CAMPOS_GUION.includes(k)) avisos.push(`guion.json: «${k}» no lo usa nadie (los campos son ${lista(CAMPOS_GUION)}).`);
  if (g.idioma !== undefined) validarIdioma(g.idioma, "guion.json idioma", errores);
  if (g.look !== undefined) validarLook(g.look, "guion.json look", errores);
  if (g.subtitulos !== undefined) validarSubtitulos(g.subtitulos, "guion.json subtitulos", errores);
  if (g.voz !== undefined) validarVoz(g.voz, "guion.json voz", errores);
  if (g.firma !== undefined) validarFirma(g.firma, "guion.json firma", errores);
  if (!Array.isArray(g.frases) || !g.frases.length) {
    errores.push(`guion.json tiene que tener "frases": [{ "texto": "...", "clave": "...", "hook": true }, ...].`);
    return { errores, avisos };
  }
  const hooks = [];
  g.frases.forEach((f, i) => {
    if (!esObjeto(f)) return errores.push(`La frase ${i + 1} tiene que ser { "texto": "...", "clave": "..." } (es ${es(f)}).`);
    const quien = `La frase ${i + 1}` + (f.papel ? ` (${f.papel})` : "");
    for (const k of Object.keys(f)) if (!CAMPOS_FRASE.includes(k)) avisos.push(`${quien}: «${k}» no lo usa nadie (son ${lista(CAMPOS_FRASE)}).`);
    if (f.texto !== undefined && typeof f.texto !== "string") return errores.push(`${quien}: "texto" tiene que ser un texto (es ${es(f.texto)}).`);
    if (f.hook !== undefined && typeof f.hook !== "boolean") errores.push(`${quien}: "hook" es true o false (es ${es(f.hook)}).`);
    if (f.hook === true) hooks.push(i);
    const ws = palabrasDe(f.texto || "");
    if (!ws.length) return contenido.push(`${quien} no tiene texto: escribe en "texto" lo que dice.`);
    const faltan = sinLetra(f.texto);
    if (faltan.length) errores.push(`${quien}: la letra de los subtítulos (Figtree) no tiene ${faltan.map((c) => `«${c}»`).join(" ")}: saldrían como cuadraditos. Cámbialo por letras del alfabeto latino (sin emojis); los vídeos en otros alfabetos necesitan antes otra letra en letra/ (motor/LEEME.md).`);
    if (f.clave === undefined || f.clave === null || f.clave === "") avisos.push(`${quien} no tiene "clave": la palabra que se marca en el subtítulo.`);
    else if (typeof f.clave !== "string" || palabrasDe(f.clave).length !== 1) contenido.push(`${quien}: "clave" es una sola palabra de la frase (es ${es(f.clave)}).`);
    else if (!ws.some((w) => clave(w) === clave(f.clave))) contenido.push(`${quien}: la clave «${f.clave}» no está en su texto. Tiene que ser una de sus palabras (las tildes y las mayúsculas dan igual).`);
    if (f.dicho !== undefined) {
      const ds = typeof f.dicho === "string" ? palabrasDe(f.dicho) : [];
      if (!ds.length) return contenido.push(`${quien}: "dicho" está vacío. Quítalo, o escribe cómo suena la frase.`);
      const cs = new Set(ds.map(clave)), comunes = ws.filter((w) => cs.has(clave(w))).length;
      if (ds.map(clave).join(" ") === ws.map(clave).join(" ")) avisos.push(`${quien}: "dicho" se dice igual que el texto: sobra.`);
      else if (ds.length > 3 * ws.length + 4 || (ws.length >= 5 && comunes / ws.length < 0.3))
        contenido.push(`${quien}: "dicho" no parece la misma frase (${comunes} de sus ${ws.length} palabras en común). "dicho" es el mismo texto escrito como suena («IA» → «i a», «4.000» → «cuatro mil»), no otra frase.`);
    }
  });
  if (!hooks.length) avisos.push(`Ninguna frase lleva "hook": true. Las del hook (las dos o tres primeras) lo llevan.`);
  else {
    const k = hooks.findIndex((i, j) => i !== j);
    if (k >= 0) contenido.push(`Las frases del hook van seguidas y al principio: la ${hooks[k] + 1} lleva "hook": true, pero la ${k + 1} no.`);
    else if (hooks.length > 4) avisos.push(`El hook son ${hooks.length} frases: suelen ser dos o tres, unos 8-10 s.`);
  }
  return { errores, avisos };
}

// La lista de sonidos.js (ya cargada). catalogo: nombre → archivo (mezcla.mjs).
export const CAMPOS_EFECTO = ["sonido", "t", "db", "vel", "lp", "ancla", "reves", "corta", "que"];
export function validarSonidos(eventos, { duracion = Infinity, catalogo = {} } = {}) {
  const errores = [], avisos = [];
  if (!Array.isArray(eventos)) return { errores: [`sonidos.js tiene que exportar por defecto la lista de efectos (export default e), o una función que la devuelva (es ${es(eventos)}).`], avisos };
  const num = (e, k, quien, a, b) => {
    if (e[k] !== undefined && (typeof e[k] !== "number" || !Number.isFinite(e[k]) || e[k] < a || e[k] > b)) errores.push(`${quien}: "${k}" tiene que ser un número entre ${a} y ${b} (es ${es(e[k])}).`);
  };
  eventos.forEach((e, i) => {
    if (!esObjeto(e)) return errores.push(`El efecto ${i + 1} tiene que ser { sonido, t, ... } (es ${es(e)}): ponlo con pon("aire", t, { ... }).`);
    const quien = `El efecto ${i + 1}` + (typeof e.sonido === "string" ? ` («${e.sonido}»${Number.isFinite(e.t) ? ` en ${e.t.toFixed(2)} s` : ""}${e.que ? `, ${e.que}` : ""})` : "");
    if (typeof e.sonido !== "string" || !catalogo[e.sonido]) errores.push(`${quien}: no hay ningún sonido «${e.sonido}» en sonidos/. Hay: ${lista(catalogo)}.`);
    if (typeof e.t !== "number" || !Number.isFinite(e.t)) errores.push(`${quien}: "t" tiene que ser un número de segundos (es ${es(e.t)}). Si sale de un plano o de v.t(), mira que ese momento exista.`);
    num(e, "db", quien, -60, 6); num(e, "vel", quien, 0.25, 4); num(e, "lp", quien, 100, 24000); num(e, "corta", quien, -1, 1e4);
    if (e.ancla !== undefined && !["golpe", "empieza"].includes(e.ancla)) errores.push(`${quien}: "ancla" es "golpe" o "empieza" (es ${es(e.ancla)}).`);
    for (const k of Object.keys(e)) if (!CAMPOS_EFECTO.includes(k)) avisos.push(`${quien}: «${k}» no lo usa nadie (son ${lista(CAMPOS_EFECTO)}).`);
    if (Number.isFinite(e.t) && (e.t < 0 || e.t > duracion)) avisos.push(`${quien} cae fuera del vídeo (dura ${duracion.toFixed(2)} s): no se oirá.`);
    if (Number.isFinite(e.t) && Number.isFinite(e.corta) && e.corta < e.t) avisos.push(`${quien}: "corta" (${e.corta.toFixed(2)} s) llega antes que el sonido: no se oirá entero.`);
  });
  return { errores, avisos };
}

// Un formato de guion (motor/formatos/<nombre>.json).
export function validarFormato(f, donde) {
  const errores = [], avisos = [];
  if (!esObjeto(f)) return { errores: [`${donde} tiene que ser un objeto { "nombre", "titulo", "para", "frases", "plan" }.`], avisos };
  for (const k of ["nombre", "titulo", "para"]) if (typeof f[k] !== "string" || !f[k].trim()) errores.push(`${donde}: falta "${k}" (un texto).`);
  if (!Array.isArray(f.frases) || !f.frases.length) errores.push(`${donde}: "frases" es la lista de frases, cada una { "papel": "...", "ejemplo": "..." }.`);
  else f.frases.forEach((x, i) => {
    if (!esObjeto(x) || typeof x.papel !== "string" || !x.papel.trim()) errores.push(`${donde}: la frase ${i + 1} necesita su "papel" (qué hace esa frase).`);
    else if (x.hook !== undefined && typeof x.hook !== "boolean") errores.push(`${donde}: la frase ${i + 1}, "hook" es true o false.`);
  });
  if (f.plan !== undefined && (!Array.isArray(f.plan) || f.plan.some((x) => typeof x !== "string"))) errores.push(`${donde}: "plan" es una lista de textos, uno por frase.`);
  else if (Array.isArray(f.plan) && Array.isArray(f.frases) && f.plan.length !== f.frases.length) avisos.push(`${donde}: "plan" tiene ${f.plan.length} líneas y hay ${f.frases.length} frases.`);
  return { errores, avisos };
}

// Varias frases de error, en un solo mensaje.
export const juntar = (titulo, errores) => `${titulo}\n` + errores.map((e) => `  - ${e}`).join("\n");

// Los caracteres de un texto que Figtree no tiene (saldrían como un cuadradito: el lienzo no busca otra letra). Se
// mira dibujándolos: el que sale igual que un carácter que seguro que no tiene, no lo tiene.
const muestra = createCanvas(48, 48).getContext("2d"), vistos = new Map();
const pinta = (c) => { muestra.clearRect(0, 0, 48, 48); muestra.font = "700 32px Figtree"; muestra.fillStyle = "#000"; muestra.textBaseline = "middle"; muestra.fillText(c, 6, 24); return Buffer.from(muestra.getImageData(0, 0, 48, 48).data).toString("base64"); };
let hueco = null;
export function sinLetra(texto) {
  hueco ||= pinta("\u{E000}");
  const out = [];
  for (const c of new Set([...String(texto)])) {
    if (/\s/.test(c)) continue;
    if (!vistos.has(c)) vistos.set(c, pinta(c) === hueco);
    if (vistos.get(c)) out.push(c);
  }
  return out;
}
