// ElevenLabs, sin gastar: la clave, las voces de la cuenta del creador, las de la biblioteca de ElevenLabs y cómo se
// elige una. (Lo que cuesta, la voz de un vídeo, lo pide voz.mjs.) ELEVENLABS_API=<dirección> usa otro de sus
// servidores (el de la UE, por ejemplo); si no, el de siempre.
import { cargarClaves, escribirJson } from "./comun.mjs";
import { cargarMarca, esObjeto, leerMarca } from "./marca.mjs";

export const api = () => { cargarClaves(); return (process.env.ELEVENLABS_API || "https://api.elevenlabs.io").replace(/\/+$/, ""); };

export function clave() {
  cargarClaves();
  return process.env.ELEVENLABS_API_KEY || null;
}

// Una petición: { status, j } (status 0 y error si no se llega: sin internet).
export async function pedir(ruta, { metodo = "GET", cuerpo = null, espera = 15000 } = {}) {
  const k = clave();
  if (!k) return { status: 0, j: {}, error: "sin clave (node motor/clave.mjs)" };
  try {
    const r = await fetch(api() + ruta, {
      method: metodo, signal: AbortSignal.timeout(espera),
      headers: { "xi-api-key": k, ...(cuerpo ? { "content-type": "application/json" } : {}) }, ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
    });
    return { status: r.status, j: await r.json().catch(() => ({})) };
  } catch (e) { return { status: 0, j: {}, error: e.cause?.code || e.name || e.message }; }
}

// Lo que dice ElevenLabs cuando dice que no.
export const detalle = (j) => { const d = j?.detail; return String(typeof d === "string" ? d : d?.message || d?.status || ""); };
// La clave no tiene ese permiso (lo que se marca al crearla).
export const sinPermiso = (r) => r.status === 401 && /permission|missing/i.test(detalle(r.j));

// Una voz como la enseña la carpeta, venga de la cuenta o de la biblioteca. idioma: para elegir su muestra.
const GENERO = { female: "mujer", male: "hombre", neutral: "neutra" };
const EDAD = { young: "joven", middle_aged: "mediana edad", middle: "mediana edad", old: "mayor" };
function resumir(v, idioma, deLaBiblioteca) {
  const l = v.labels || {}, base = (idioma || "").split("-")[0];
  const muestra = (v.verified_languages || []).find((x) => x.language === base && x.preview_url)?.preview_url || v.preview_url || null;
  const genero = v.gender || l.gender, edad = v.age || l.age;
  return {
    id: v.voice_id, nombre: String(v.name || v.voice_id).trim(),
    genero: GENERO[genero] || genero || "", edad: EDAD[edad] || edad || "",
    acento: v.accent || l.accent || "", uso: String(v.use_case || l.use_case || "").replace(/_/g, " "),
    idiomas: [...new Set([v.language || l.language, ...(v.verified_languages || []).map((x) => x.language)].filter(Boolean))],
    descripcion: String(v.description || l.description || v.descriptive || l.descriptive || "").replace(/\s+/g, " ").trim().slice(0, 220),
    muestra: muestra && /^https:\/\//.test(muestra) ? muestra : null,
    biblioteca: deLaBiblioteca && !v.is_added_by_user, dueno: v.public_owner_id || null, tipo: v.category || "",
  };
}

// Las voces de la cuenta del creador (las de ElevenLabs por defecto y las que haya añadido o creado).
export async function vocesDeLaCuenta({ buscar = "", idioma = "", genero = "" } = {}) {
  const out = [];
  let tok = null;
  for (let i = 0; i < 5; i++) {
    const q = new URLSearchParams({ page_size: "100", include_total_count: "false", sort: "name", sort_direction: "asc" });
    if (buscar) q.set("search", buscar);
    if (tok) q.set("next_page_token", tok);
    const r = await pedir(`/v2/voices?${q}`);
    if (r.status !== 200) return { voces: out, error: errorDe(r, "ver tus voces") };
    out.push(...(r.j.voices || []).map((v) => resumir(v, idioma, false)));
    if (!r.j.has_more || !r.j.next_page_token) break;
    tok = r.j.next_page_token;
  }
  // primero las que hablan el idioma de los vídeos (las demás también lo leen, pero con su acento)
  const base = idioma.split("-")[0], habla = (v) => (v.idiomas.includes(base) ? 0 : 1);
  const voces = (genero ? out.filter((v) => v.genero === genero) : out).sort((a, b) => habla(a) - habla(b));
  return { voces };
}

// Las de la biblioteca de ElevenLabs, en un idioma (las más usadas primero).
export async function vocesDeLaBiblioteca({ buscar = "", idioma = "", genero = "", pagina = 0 } = {}) {
  const q = new URLSearchParams({ page_size: "30", page: String(pagina), sort: "usage_character_count_1y" });
  if (idioma) q.set("language", idioma.split("-")[0]);
  if (buscar) q.set("search", buscar);
  const g = Object.entries(GENERO).find(([, x]) => x === genero)?.[0];
  if (g) q.set("gender", g);
  const r = await pedir(`/v1/shared-voices?${q}`);
  if (r.status !== 200) return { voces: [], mas: false, error: errorDe(r, "ver la biblioteca") };
  return { voces: (r.j.voices || []).map((v) => resumir(v, idioma, true)), mas: !!r.j.has_more };
}

// Una voz de la cuenta, por su id o por su nombre (si solo hay una que se llame así). null si no está.
export async function vozDeLaCuenta(cual) {
  const r = await pedir(`/v2/voices?${new URLSearchParams({ voice_ids: cual, page_size: "5" })}`);
  if (r.status === 200 && r.j.voices?.length) return resumir(r.j.voices[0], "", false);
  const { voces, error } = await vocesDeLaCuenta({ buscar: cual });
  if (error) throw new Error(error);
  const n = cual.toLowerCase(), iguales = voces.filter((v) => v.nombre.toLowerCase() === n), empiezan = voces.filter((v) => v.nombre.toLowerCase().startsWith(n));
  const x = iguales.length === 1 ? iguales : empiezan;
  if (x.length > 1) throw new Error(`«${cual}» puede ser ${x.slice(0, 6).map((v) => `${v.nombre} (${v.id})`).join(", ")}: di cuál, por su id.`);
  return x[0] || null;
}

// Añade a la cuenta una voz de la biblioteca (hace falta para usarla) y da su id.
export async function anadirDeLaBiblioteca(dueno, id, nombre) {
  const r = await pedir(`/v1/voices/add/${encodeURIComponent(dueno)}/${encodeURIComponent(id)}`, { metodo: "POST", cuerpo: { new_name: String(nombre).slice(0, 100) } });
  if (r.status === 200 && r.j.voice_id) return r.j.voice_id;
  if (sinPermiso(r)) throw new Error(`La clave no puede añadir voces a tu cuenta. Añádela tú: en elevenlabs.io, Voices → Explore, busca «${nombre}» y pulsa «Add to my voices»; luego elígela en «Tus voces». (O crea una clave con Voices en «Write».)`);
  throw new Error(errorDe(r, "añadir esa voz a tu cuenta"));
}

// La voz elegida, en la marca: la de los vídeos en ese idioma (voces.<idioma>), que manda sobre la de siempre. Si el
// idioma no es el español, además le dice a ElevenLabs que lea en ese idioma (codigoIdioma). Devuelve lo que cambió.
export async function ponerVozEnLaMarca(id, idioma = null) {
  const { juntar, validarMarca } = await import("./validar.mjs"); // aquí, no arriba: doctor usa este archivo aunque no cargue lo de dibujar
  const lm = leerMarca();
  if (lm.error) throw new Error(`${lm.ruta} ${lm.error}`);
  if (!lm.ruta) throw new Error("Con VIDEOS_MARCA=ninguna no hay marca que cambiar.");
  const i = idioma || cargarMarca().idioma, base = i.split("-")[0].toLowerCase(), datos = structuredClone(lm.datos);
  if (!esObjeto(datos.voces)) datos.voces = {};
  datos.voces[i] = { ...(esObjeto(datos.voces[i]) ? datos.voces[i] : {}), id };
  if (base !== "es" && !datos.voces[i].codigoIdioma) datos.voces[i].codigoIdioma = base;
  const { errores } = validarMarca(datos, "la marca");
  if (errores.length) throw new Error(juntar("No lo cambio (marca.json se queda como estaba):", errores));
  escribirJson(lm.ruta, datos);
  return { idioma: i, voz: datos.voces[i] };
}

// Lo que ha pasado, en una frase que dice qué hacer.
export function errorDe(r, para) {
  if (r.status === 0) return `No llego a ElevenLabs (${r.error}): ¿hay internet?`;
  if (sinPermiso(r)) return `La clave no tiene permiso para ${para}: crea otra con Voices en «Read» o «Write» (node motor/clave.mjs lo explica).`;
  if (r.status === 401) return "La clave no vale: pon otra con node motor/clave.mjs.";
  if (r.status === 402) return "Tu plan de ElevenLabs no lo permite (con el plan gratuito no se pueden usar las voces de la biblioteca fuera de su web).";
  if (r.status === 429) return "Ahora mismo hay demasiadas peticiones: espera un minuto.";
  return `ElevenLabs dijo ${r.status}${detalle(r.j) ? `: ${detalle(r.j).slice(0, 160)}` : ""}.`;
}
