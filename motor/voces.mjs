#!/usr/bin/env node
// voces.mjs: la voz de los vídeos. Sin nada, abre una página de este ordenador para escuchar las voces (las de la cuenta
// del creador y las de la biblioteca de ElevenLabs, en su idioma) y elegir una con un clic. Para la IA, lo mismo por
// órdenes: lista, escuchar, usar. La voz elegida va a la marca: es la de los vídeos en ese idioma. Nada gasta.
import { join } from "node:path";
import { RAIZ, abrirEnSistema, argumentos, ayuda, fallo } from "./lib/comun.mjs";
import { anadirDeLaBiblioteca, clave, ponerVozEnLaMarca, vocesDeLaBiblioteca, vocesDeLaCuenta, vozDeLaCuenta } from "./lib/elevenlabs.mjs";
import { cargarMarca, vozDe } from "./lib/marca.mjs";
import { paginaLocal } from "./lib/pagina-local.mjs";
import { validarIdioma } from "./lib/validar.mjs";

ayuda(`
node motor/voces.mjs [--idioma en] [--sin-abrir]          abre la página para escuchar las voces y elegir una
node motor/voces.mjs lista [--buscar texto] [--genero mujer|hombre|neutra] [--biblioteca] [--idioma en]
node motor/voces.mjs escuchar <id o nombre> [--biblioteca]  abre su muestra (sin gastar nada)
node motor/voces.mjs usar <id o nombre> [--idioma en]       la pone en la marca

La voz elegida es la de los vídeos en ese idioma (el de la marca si no se dice), en marca.json "voces": { "<idioma>": {
"id" } }. Si el idioma no es el español, también le dice a ElevenLabs que lea en él (codigoIdioma). Una voz de la
biblioteca se elige con <dueño>/<id>, como la escribe lista --biblioteca, y se añade antes a la cuenta del creador (la
clave necesita Voices en «Write»; si no, dice cómo añadirla a mano). La página espera hasta 15 minutos: lánzala en
segundo plano. Nada de esto gasta caracteres.
`);

const { sueltos, op } = argumentos();
const [orden, ...resto] = sueltos, cual = resto.join(" ").trim();
const marca = cargarMarca(), idioma = op.idioma && op.idioma !== true ? String(op.idioma) : marca.idioma, ei = [];
validarIdioma(idioma, "--idioma", ei);
if (ei.length) fallo(ei[0]);
if (!clave()) fallo("Aún no hay clave de ElevenLabs: node motor/clave.mjs abre la página para pegarla.");
const actual = vozDe({ idioma }, marca).id;
const nombreIdioma = (() => { try { return new Intl.DisplayNames(["es"], { type: "language" }).of(idioma) || idioma; } catch { return idioma; } })();
const genero = op.genero && op.genero !== true ? String(op.genero).toLowerCase() : "";
if (genero && !["mujer", "hombre", "neutra"].includes(genero)) fallo("--genero es mujer, hombre o neutra.");

// Una voz en una línea: su nombre, cómo es, su id (el de la biblioteca, con su dueño) y si es la de ahora.
const linea = (v) => `${v.id === actual ? "* " : "  "}${v.nombre} — ${[v.genero, v.edad, v.acento && `acento ${v.acento}`, v.uso, v.idiomas.slice(0, 4).join("/") + (v.idiomas.length > 4 ? "…" : "")].filter(Boolean).join(", ")}` +
  `\n    ${v.biblioteca ? `${v.dueno}/${v.id}` : v.id}${v.descripcion ? ` · ${v.descripcion.slice(0, 110)}` : ""}`;

// Elige una (de la cuenta o de la biblioteca) y la pone en la marca: { nombre, id }.
async function elegir({ id, dueno = null, nombre = "", biblioteca = false }) {
  let v = await vozDeLaCuenta(id);
  if (!v && biblioteca && dueno) v = { id: await anadirDeLaBiblioteca(dueno, id, nombre || id), nombre: nombre || id };
  if (!v) throw new Error(`«${id}» no está entre tus voces de ElevenLabs. Si es de la biblioteca, elígela como <dueño>/<id> (node motor/voces.mjs lista --biblioteca).`);
  await ponerVozEnLaMarca(v.id, idioma);
  return v;
}

if (orden === "lista") {
  const r = op.biblioteca ? await vocesDeLaBiblioteca({ buscar: op.buscar === true ? "" : op.buscar || "", idioma, genero }) : await vocesDeLaCuenta({ buscar: op.buscar === true ? "" : op.buscar || "", idioma, genero });
  if (r.error) fallo(r.error);
  console.log(`${op.biblioteca ? `Biblioteca de ElevenLabs, en ${nombreIdioma} (las más usadas)` : "Tus voces de ElevenLabs"}; * la de los vídeos en ${nombreIdioma}:`);
  console.log(r.voces.length ? r.voces.map(linea).join("\n") : "  ninguna con eso");
  if (!op.biblioteca && !r.voces.some((v) => v.id === actual)) console.log(`\nLa voz de ahora (${actual}) no está entre tus voces: elige una (si no, la voz fallará).`);
} else if (orden === "escuchar") {
  if (!cual) fallo("Falta qué voz: node motor/voces.mjs escuchar <id o nombre>");
  let v;
  if (op.biblioteca) v = (await vocesDeLaBiblioteca({ buscar: cual.split("/").pop(), idioma })).voces.find((x) => x.id === cual.split("/").pop() || x.nombre.toLowerCase() === cual.toLowerCase());
  else v = await vozDeLaCuenta(cual).catch((e) => fallo(e.message));
  if (!v) fallo(`No encuentro «${cual}»${op.biblioteca ? " en la biblioteca" : " entre tus voces (si es de la biblioteca, añade --biblioteca)"}.`);
  if (!v.muestra) fallo(`«${v.nombre}» no tiene muestra para escuchar.`);
  console.log((await abrirEnSistema(v.muestra)) ? `sonando: ${v.nombre}` : `ábrela a mano: ${v.muestra}`);
} else if (orden === "usar") {
  if (!cual) fallo("Falta qué voz: node motor/voces.mjs usar <id o nombre> (o <dueño>/<id> de la biblioteca)");
  const [a, b] = cual.includes("/") ? cual.split("/") : [null, cual];
  try {
    const v = await elegir({ id: b, dueno: a, biblioteca: !!a, nombre: a ? (await vocesDeLaBiblioteca({ buscar: "", idioma })).voces.find((x) => x.id === b)?.nombre || b : "" });
    console.log(`voz de los vídeos en ${nombreIdioma}: ${v.nombre} (${v.id})`);
  } catch (e) { fallo(e.message); }
} else if (orden) fallo(`No sé «${orden}»: node motor/voces.mjs, lista, escuchar o usar (mira --ayuda).`);
else {
  // --- la página
  const web = paginaLocal({
    nombre: "de las voces", plantilla: join(RAIZ, "motor", "voces.html"), abrir: !op["sin-abrir"], espera: 15 * 60 * 1000, media: "https:",
    rutas: {
      "GET /": (req, res) => web.pagina(res, { IDIOMA: nombreIdioma, CODIGO: idioma, ACTUAL: actual }),
      "GET /voces": async (req, res, url) => {
        const p = Object.fromEntries(url.searchParams), g = ["mujer", "hombre", "neutra"].includes(p.genero) ? p.genero : "";
        const r = p.de === "biblioteca"
          ? await vocesDeLaBiblioteca({ buscar: (p.buscar || "").slice(0, 80), idioma, genero: g, pagina: Math.max(0, Math.min(50, Number(p.pagina) || 0)) })
          : await vocesDeLaCuenta({ buscar: (p.buscar || "").slice(0, 80), idioma, genero: g });
        web.json(res, r);
      },
      "POST /usar": async (req, res) => {
        let d;
        try { d = JSON.parse((await web.cuerpo(req)) || "null"); } catch { d = null; }
        if (!d || d.t !== web.token || typeof d.id !== "string" || !/^[A-Za-z0-9_-]{6,64}$/.test(d.id)) return web.json(res, { error: "Esta página ha caducado: vuelve a abrirla desde el chat." }, 403);
        try {
          const v = await elegir({ id: d.id, dueno: typeof d.dueno === "string" ? d.dueno : null, nombre: String(d.nombre || "").slice(0, 100), biblioteca: !!d.biblioteca });
          web.json(res, { ok: true, nombre: v.nombre });
          web.acabar(`voz de los vídeos en ${nombreIdioma}: ${v.nombre} (${v.id})`);
        } catch (e) { web.json(res, { error: e.message }, 400); }
      },
    },
  });
}
