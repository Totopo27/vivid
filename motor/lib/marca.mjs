// La marca del creador: lo que vale para todos sus vídeos (el idioma, el look, los subtítulos, la voz). Vive en
// marca.json, en la raíz de la carpeta, y solo dice lo que cambia: lo demás sale de BASE. Cada vídeo puede cambiar
// cualquiera de esas cosas en su guion.json ("idioma", "look", "subtitulos", "voz"). node motor/marca.mjs la enseña y
// la cambia.
//
// marca.json, por ejemplo:
//   { "idioma": "en", "look": "neon", "subtitulos": { "estilo": "karaoke" }, "voces": { "en": { "id": "...", "codigoIdioma": "en" } },
//     "firma": "@micanal", "duracion": [20, 40] }
import { existsSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, fallo, leerJson } from "./comun.mjs";
import { normalizaFirma } from "./firma.mjs";

export const BASE = {
  idioma: "es",
  look: "espacio",
  subtitulos: { estilo: "caja", posicion: "arriba" },
  // la voz de siempre; "voces" pone otra para cada idioma ({ "en": { "id": "..." } }), y guion.json "voz" manda sobre todo
  voz: { id: "851ejYcv2BoNPjrkw93G", modelo: "eleven_v4", estabilidad: 0.35, similitud: 0.7, estilo: 0, velocidad: 1 },
  voces: {},
  efectos: true,
  firma: null,          // el texto que va en todos los vídeos ("@micanal"): lib/firma.mjs
  duracion: [30, 60],   // los segundos que suelen durar sus vídeos (lo que se sale de ahí, se avisa)
};

// Dónde pueden ir los subtítulos (cada estilo los coloca a su manera; "no", sin subtítulos).
export const POSICIONES = ["arriba", "centro", "abajo", "no"];

export const esObjeto = (x) => !!x && typeof x === "object" && !Array.isArray(x);
export function mezclar(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) out[k] = esObjeto(v) && esObjeto(a[k]) ? mezclar(a[k], v) : v;
  return out;
}

// Dónde está la marca. VIDEOS_MARCA=ninguna la ignora (las pruebas del motor la usan: los ejemplos no dependen de la
// marca de nadie); VIDEOS_MARCA=<ruta> usa otra.
export function rutaMarca() {
  const env = process.env.VIDEOS_MARCA;
  return env === "ninguna" ? null : env || join(RAIZ, "marca.json");
}

// marca.json tal cual, sin mezclar ni salir: { ruta, existe, datos, error }.
export function leerMarca() {
  const ruta = rutaMarca();
  if (!ruta || !existsSync(ruta)) return { ruta, existe: false, datos: {}, error: null };
  try {
    const datos = leerJson(ruta);
    if (!esObjeto(datos)) return { ruta, existe: true, datos: {}, error: `tiene que ser un objeto: { "idioma": "en", ... }` };
    return { ruta, existe: true, datos, error: null };
  } catch (e) { return { ruta, existe: true, datos: {}, error: `no se puede leer (¿falta una coma o sobra una?): ${e.message}` }; }
}

// La marca de esta carpeta, mezclada con BASE.
export function cargarMarca() {
  const m = leerMarca();
  if (m.error) fallo(`${m.ruta} ${m.error}`);
  return mezclar(structuredClone(BASE), m.datos);
}

// subtitulos: "arriba" | "abajo" | "no" | { estilo, posicion, ... } → siempre { estilo, posicion, ... }.
export function normalizaSubtitulos(s, base = BASE.subtitulos) {
  if (s === undefined || s === null) return { ...base };
  if (typeof s === "string") return { ...base, posicion: s };
  // con otro estilo que el de la marca, de la marca solo se hereda dónde va (sus colores o su escala son de su estilo)
  if (esObjeto(s)) return { ...(s.estilo && s.estilo !== base.estilo ? { estilo: base.estilo, posicion: base.posicion } : base), ...s };
  fallo(`«subtitulos» tiene que ser "arriba", "abajo", "no" o un objeto { "estilo", "posicion" } (es ${JSON.stringify(s)}).`);
}

// Lo que se pide al abrir para probar otro estilo sin tocar el guion (--look neon, --subtitulos karaoke; en
// --subtitulos vale también una posición: arriba, centro, abajo, no). null si no se pide nada.
export function estiloPedido(op) {
  const s = {};
  if (op.look !== undefined && op.look !== true) s.look = String(op.look);
  if (op.subtitulos !== undefined && op.subtitulos !== true) {
    const x = String(op.subtitulos);
    s.subtitulos = POSICIONES.includes(x) ? { posicion: x } : { estilo: x };
  }
  if (op.look === true || op.subtitulos === true) fallo("--look y --subtitulos necesitan un nombre: node motor/marca.mjs dice cuáles hay.");
  return Object.keys(s).length ? s : null;
}

// Cómo se llama lo que se ha pedido, para ponerlo en el nombre de lo que sale (borrador-neon.mp4).
export const nombreDe = (sobre) => [sobre?.look, sobre?.subtitulos?.estilo, sobre?.subtitulos?.posicion].filter(Boolean).join("-");

// El estilo de un vídeo: lo de su guion.json encima de lo de la marca (y encima de todo, lo que se pida al abrir).
export function estiloDe(guion, marca = cargarMarca(), sobre = null) {
  const firma = firmaDelVideo(guion, marca);
  return {
    idioma: String(guion.idioma || marca.idioma),
    look: String(sobre?.look || guion.look || marca.look),
    subtitulos: { ...normalizaSubtitulos(guion.subtitulos, marca.subtitulos), ...(sobre?.subtitulos || {}) },
    ...(firma ? { firma } : {}),
  };
}

// La firma de un vídeo: la de la marca; en guion.json, false la quita, un texto pone otra y un objeto sin texto solo
// cambia cómo va la de la marca ({ "posicion": "arriba" }).
function firmaDelVideo(guion, marca) {
  const g = guion.firma, m = normalizaFirma(marca.firma);
  if (g === undefined) return m;
  if (esObjeto(g) && g.texto === undefined) return m && { ...m, ...g };
  return normalizaFirma(g);
}

// La voz de un vídeo: la de la marca, la de su idioma si la hay, y la del guion encima de todo.
export function vozDe(guion, marca = cargarMarca()) {
  const idioma = String(guion.idioma || marca.idioma);
  return { ...marca.voz, ...(marca.voces?.[idioma] || {}), ...(guion.voz || {}) };
}
