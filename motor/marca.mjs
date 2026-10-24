#!/usr/bin/env node
// marca.mjs: la marca del creador (marca.json): lo que vale para todos sus vídeos. La enseña con lo que hay para
// elegir (looks, subtítulos, formatos) y la cambia campo a campo, comprobando antes que lo que se pone existe.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, argumentos, ayuda, corta, escribirJson, fallo, leerJson } from "./lib/comun.mjs";
import { LOOKS } from "./kit/looks/index.js";
import { BASE, POSICIONES, cargarMarca, esObjeto, leerMarca, vozDe } from "./lib/marca.mjs";
import { ESTILOS } from "./lib/subtitulos.mjs";
import { AJUSTES_VOZ, CAMPOS_MARCA, juntar, validarMarca } from "./lib/validar.mjs";

ayuda(`
node motor/marca.mjs                          la marca de ahora y lo que hay para elegir
node motor/marca.mjs poner <campo> <valor>    cambia un campo de marca.json (comprueba antes que existe)
node motor/marca.mjs quitar <campo>           ese campo vuelve a lo de siempre

Campos:
  idioma                          es, en, pt-BR...
  look                            uno de los looks (sin nada: los que hay)
  subtitulos                      un estilo (karaoke) o una posición (arriba, centro, abajo, no)
  subtitulos.estilo, subtitulos.posicion, subtitulos.<otro>   lo que entienda su estilo (escala, mayusculas...)
  voz.id, voz.modelo, voz.estabilidad, voz.similitud, voz.estilo, voz.velocidad, voz.codigoIdioma
  voces.<idioma>.<lo mismo>       la voz de ese idioma (voces.en.id XXXX); voces.en XXXX pone su id
                                  (la voz se elige mejor escuchándolas: node motor/voces.mjs)
  efectos                         si o no: si los vídeos llevan efectos de sonido
  firma                           un texto pequeño en todos los vídeos (su @, su web): poner firma @micanal
  firma.posicion, firma.opacidad, firma.escala, firma.color   abajo o arriba · 0,2-1 · 0,6-1,2 · un color
  duracion                        los segundos que suelen durar sus vídeos: poner duracion 20-40
Por ejemplo: poner look neon · poner subtitulos.estilo karaoke · poner idioma en · poner voces.en.id XXXX
Cada vídeo puede cambiar cualquiera de estas cosas en su guion.json; lo del guion manda.
`);

const { sueltos } = argumentos();
const [orden, campo, ...resto] = sueltos;
const lm = leerMarca();
if (lm.error && orden) fallo(`${corta(lm.ruta)} ${lm.error}. Arréglalo a mano o bórralo (vuelve todo a lo de siempre).`);

if (!orden) ensenar();
else if (orden === "poner") poner(campo, resto.join(" "));
else if (orden === "quitar") quitar(campo);
else fallo(`No sé «${orden}»: node motor/marca.mjs, poner <campo> <valor> o quitar <campo> (mira --ayuda).`);

// --- lo que hay
function primeraFrase(s, max = 110) {
  const f = String(s || "").replace(/\s+/g, " ").trim().split(/(?<=[.;])\s/)[0].replace(/[.;]$/, "");
  return f.length > max ? f.slice(0, max - 1) + "…" : f;
}
function deSubtitulo(nombre) {
  const m = ESTILOS[nombre];
  if (m.descripcion || m.DESCRIPCION) return primeraFrase(m.descripcion || m.DESCRIPCION);
  const f = join(RAIZ, "motor", "lib", "subtitulos", `${nombre}.mjs`);
  if (!existsSync(f)) return "";
  const cabeza = [];
  for (const l of readFileSync(f, "utf8").split("\n")) { if (!l.startsWith("//")) break; cabeza.push(l.slice(2).trim()); }
  return primeraFrase(cabeza.join(" ").replace(/^Subtítulos «[^»]+»[,:]?\s*/, ""));
}
function formatos() {
  const d = join(RAIZ, "motor", "formatos");
  if (!existsSync(d)) return [];
  return readdirSync(d).filter((f) => f.endsWith(".json")).sort().map((f) => {
    try { const j = leerJson(join(d, f)); return `${f.slice(0, -5)} — ${j.titulo || ""}: ${primeraFrase(j.para, 90)}`; }
    catch (e) { return `${f.slice(0, -5)} — (no se lee: ${e.message})`; }
  });
}

function ensenar() {
  const m = lm.error ? structuredClone(BASE) : cargarMarca(), d = lm.datos, de = (k) => (d[k] !== undefined ? "  *" : "");
  const voz = (x) => [x.id, x.modelo, x.estabilidad !== undefined && `estabilidad ${x.estabilidad}`, x.similitud !== undefined && `similitud ${x.similitud}`,
    x.estilo !== undefined && `estilo ${x.estilo}`, x.velocidad !== undefined && `velocidad ${x.velocidad}`, x.codigoIdioma && `idioma ${x.codigoIdioma}`].filter(Boolean).join(" · ");
  const s = m.subtitulos, extra = Object.entries(s).filter(([k]) => !["estilo", "posicion"].includes(k)).map(([k, x]) => `${k} ${JSON.stringify(x)}`);
  console.log(lm.ruta === null ? "La marca (VIDEOS_MARCA=ninguna: la de siempre)" : lm.existe ? `La marca (${corta(lm.ruta)}; * lo dice ese archivo, lo demás es lo de siempre):` : `La marca (aún no hay ${corta(lm.ruta)}: todo es lo de siempre):`);
  if (lm.error) console.log(`  ✗ ${corta(lm.ruta)} ${lm.error}`);
  console.log(`  idioma       ${m.idioma}${de("idioma")}`);
  console.log(`  look         ${m.look}${de("look")}`);
  console.log(`  subtitulos   ${[s.estilo, s.posicion, ...extra].join(", ")}${de("subtitulos")}`);
  console.log(`  voz          ${voz(vozDe({}, m))}${de("voz") || (d.voces?.[m.idioma] ? "  * (la de su idioma)" : "")}`);
  for (const [i, x] of Object.entries(m.voces || {})) console.log(`  voces.${i.padEnd(6)} ${voz(x)}  *`);
  console.log(`  efectos      ${m.efectos === false ? "no" : "sí"}${de("efectos")}`);
  const f = typeof m.firma === "string" ? { texto: m.firma } : m.firma;
  console.log(`  firma        ${f ? [`«${f.texto ?? ""}»`, f.posicion, f.opacidad !== undefined && `opacidad ${f.opacidad}`, f.escala !== undefined && `escala ${f.escala}`, f.color].filter(Boolean).join(", ") : "ninguna"}${de("firma")}`);
  console.log(`  duracion     ${Array.isArray(m.duracion) ? `${m.duracion[0]}–${m.duracion[1]} s` : JSON.stringify(m.duracion)}${de("duracion")}`);
  if (lm.existe && !lm.error) { const { errores } = validarMarca(d, corta(lm.ruta)); if (errores.length) console.log(juntar("  ✗ Para arreglar:", errores)); }
  console.log(`\nLooks:\n${Object.entries(LOOKS).map(([n, l]) => `  ${n} — ${primeraFrase(l.descripcion)}`).join("\n")}`);
  console.log(`Subtítulos (posiciones: ${POSICIONES.join(", ")}):\n${Object.keys(ESTILOS).map((n) => `  ${n} — ${deSubtitulo(n)}`).join("\n")}`);
  const fs = formatos();
  console.log(`Formatos de guion (node motor/nuevo.mjs "<idea>" --formato <nombre>):\n${fs.length ? fs.map((x) => `  ${x}`).join("\n") : "  ninguno todavía"}`);
  console.log(`\nPara cambiarla: node motor/marca.mjs poner look ${Object.keys(LOOKS).find((n) => n !== m.look) || m.look} (mira --ayuda)`);
}

// --- cambiarla
function rutaDe(campo) {
  if (!campo) fallo("Falta el campo: node motor/marca.mjs poner look neon (los campos, en --ayuda).");
  const p = campo.split(".").filter(Boolean);
  if (!CAMPOS_MARCA.includes(p[0])) fallo(`«${p[0]}» no es un campo de la marca. Los que hay: ${CAMPOS_MARCA.join(", ")}.`);
  return p;
}

// El texto que se escribe en la orden, como va en marca.json.
function valorDe(p, x) {
  const hoja = p[p.length - 1];
  if (p[0] === "efectos") {
    if (/^(s[ií]|true|1)$/i.test(x)) return true;
    if (/^(no|false|0)$/i.test(x)) return false;
    fallo(`efectos es si o no (no «${x}»).`);
  }
  if (p[0] === "duracion") {
    const m = x.match(/^\s*(\d+(?:[.,]\d+)?)\s*(?:-|–|a|,)\s*(\d+(?:[.,]\d+)?)\s*s?$/i);
    if (!m) fallo(`duracion es un tramo de segundos: poner duracion 30-60 (no «${x}»).`);
    return [Number(m[1].replace(",", ".")), Number(m[2].replace(",", "."))];
  }
  if (p[0] === "firma" && ["opacidad", "escala"].includes(hoja)) {
    const n = Number(x.replace(",", "."));
    if (!Number.isFinite(n)) fallo(`${p.join(".")} es un número (no «${x}»).`);
    return n;
  }
  if ((p[0] === "voz" || p[0] === "voces") && Array.isArray(AJUSTES_VOZ[hoja])) {
    const n = Number(x.replace(",", "."));
    if (!Number.isFinite(n)) fallo(`${p.join(".")} es un número (no «${x}»).`);
    return n;
  }
  if (p[0] === "subtitulos" && p.length > 1 && !["estilo", "posicion"].includes(hoja)) {
    if (/^(s[ií]|true)$/i.test(x)) return true;
    if (/^(no|false)$/i.test(x)) return false;
    if (/^-?\d+([.,]\d+)?$/.test(x)) return Number(x.replace(",", "."));
    try { return JSON.parse(x); } catch { return x; }
  }
  return x;
}

function poner(campo, valor) {
  let p = rutaDe(campo);
  if (valor === "") fallo(`Falta el valor: node motor/marca.mjs poner ${campo} <valor>.`);
  // atajos: subtitulos karaoke / subtitulos abajo, voz XXXX, voces.en XXXX, firma @micanal
  if (p.length === 1 && p[0] === "subtitulos") p = ["subtitulos", POSICIONES.includes(valor) ? "posicion" : "estilo"];
  if (p.length === 1 && p[0] === "firma") p = ["firma", "texto"];
  if (p.length === 1 && p[0] === "voz") p = ["voz", "id"];
  if (p.length === 2 && p[0] === "voces") p = [...p, "id"];
  if (p.length === 1 && ["voces"].includes(p[0])) fallo("voces es una voz por idioma: poner voces.en.id XXXX.");
  const datos = structuredClone(lm.datos);
  if (typeof datos.subtitulos === "string" && p[0] === "subtitulos" && p.length > 1) datos.subtitulos = { posicion: datos.subtitulos };
  if (typeof datos.firma === "string" && p[0] === "firma" && p.length > 1) datos.firma = { texto: datos.firma };
  let o = datos;
  for (const k of p.slice(0, -1)) {
    if (o[k] === undefined) o[k] = {};
    else if (!esObjeto(o[k])) fallo(`${p.join(".")}: «${k}» ya tiene un valor que no es un grupo (${JSON.stringify(o[k])}). Quítalo antes: node motor/marca.mjs quitar ${k}.`);
    o = o[k];
  }
  o[p[p.length - 1]] = valorDe(p, valor);
  guardar(datos, `${p.join(".")} = ${JSON.stringify(o[p[p.length - 1]])}`);
}

function quitar(campo) {
  const p = rutaDe(campo), datos = structuredClone(lm.datos), padres = [];
  let o = datos;
  for (const k of p.slice(0, -1)) { if (!esObjeto(o[k])) return console.log(`${p.join(".")} no está en la marca: ya es lo de siempre.`); padres.push([o, k]); o = o[k]; }
  if (!(p[p.length - 1] in o)) return console.log(`${p.join(".")} no está en la marca: ya es lo de siempre.`);
  delete o[p[p.length - 1]];
  for (const [padre, k] of padres.reverse()) if (esObjeto(padre[k]) && !Object.keys(padre[k]).length) delete padre[k];
  guardar(datos, `${p.join(".")}: vuelve a lo de siempre`);
}

function guardar(datos, que) {
  if (!lm.ruta) fallo("Con VIDEOS_MARCA=ninguna no hay marca que cambiar.");
  const { errores } = validarMarca(datos, "la marca");
  if (errores.length) fallo(juntar("No lo cambio (marca.json se queda como estaba):", errores));
  escribirJson(lm.ruta, datos);
  console.log(`${corta(lm.ruta)}: ${que}`);
}
