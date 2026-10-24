#!/usr/bin/env node
// nuevo.mjs: crea la carpeta de un vídeo nuevo, con lo mínimo para empezar.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ, argumentos, ayuda, corta, escribirJson, fallo, leerJsonDe } from "./lib/comun.mjs";
import { cargarMarca } from "./lib/marca.mjs";
import { juntar, validarFormato, validarIdioma } from "./lib/validar.mjs";

const FORMATOS = join(RAIZ, "motor", "formatos");
const formatos = () => (existsSync(FORMATOS) ? readdirSync(FORMATOS).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort() : []);

ayuda(`
node motor/nuevo.mjs "<la idea>" [--slug nombre-corto] [--idioma en] [--formato nombre]

Crea proyectos/<fecha>-<nombre>/ y dice su ruta:
  idea.md             la idea, lo que cuenta en una frase y los datos con su fuente (lo escribes tú)
  guion.json          las frases (las escribes tú; mira METODO.md, paso 2)
  plan.md             frase a frase, lo que se ve (lo escribes tú; paso 4)
  video/mundo.js      lo que comparten los planos (el mismo objeto, el mismo cielo, la misma cámara)
  video/planos/       un archivo por plano; empieza por 01-hook.js
  sonidos.js          los efectos (si la marca no dice "efectos": false)
  notas.md            lo que se hizo y por qué
--idioma: el del vídeo, si no es el de la marca (node motor/marca.mjs).
--formato mito: empieza guion.json y plan.md con las frases de ese formato (cada una con su «papel»: lo que hace).
  Los que hay: ${formatos().join(", ") || "ninguno todavía"} (motor/formatos/).
`);

const { sueltos, op } = argumentos();
const idea = sueltos.join(" ").trim();
if (!idea) fallo('Falta la idea: node motor/nuevo.mjs "por qué el cielo es azul"');
const marca = cargarMarca(), idioma = op.idioma && op.idioma !== true ? String(op.idioma) : marca.idioma, ei = [];
validarIdioma(idioma, "--idioma", ei);
if (ei.length) fallo(ei[0]);

// el formato, si se pide
let formato = null;
if (op.formato !== undefined) {
  if (op.formato === true || !formatos().includes(String(op.formato))) fallo(`No hay ningún formato «${op.formato === true ? "" : op.formato}». Hay: ${formatos().join(", ") || "ninguno (motor/formatos/ está vacía)"}.`);
  const f = join(FORMATOS, `${op.formato}.json`);
  formato = leerJsonDe(f, "el formato");
  const { errores } = validarFormato(formato, corta(f));
  if (errores.length) fallo(juntar(`El formato «${op.formato}» está mal:`, errores));
}

const slug = String(op.slug && op.slug !== true ? op.slug : idea).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).replace(/-$/, "");
const d = new Date(), hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; // la fecha de aquí, no la de Londres
// una idea sin letras latinas («日本語») no da nombre: video, video-2, video-3...
let dir = join(RAIZ, "proyectos", `${hoy}-${slug || "video"}`);
for (let n = 2; !slug && existsSync(dir); n++) dir = join(RAIZ, "proyectos", `${hoy}-video-${n}`);
if (existsSync(dir)) fallo(`Ya existe ${corta(dir)}. Si es otro vídeo, dale otro --slug.`);
mkdirSync(join(dir, "video", "planos"), { recursive: true });

writeFileSync(join(dir, "idea.md"), `# ${idea}

Pedido el ${hoy}.${formato ? ` Formato: ${formato.titulo} (${formato.nombre}).` : ""}

## Lo que cuenta, en una frase

## Los datos, cada uno con su fuente

`);
const frases = formato
  ? formato.frases.map((f) => ({ papel: f.papel, texto: "", clave: "", ...(f.hook ? { hook: true } : {}) }))
  : [{ texto: "", clave: "", hook: true }, { texto: "", clave: "" }];
escribirJson(join(dir, "guion.json"), { titulo: idea, idioma, ...(formato ? { formato: formato.nombre } : {}), frases });
const filas = formato
  ? formato.frases.map((f, i) => `| ${i + 1} | (${f.papel}${f.ejemplo ? `; por ejemplo: «${f.ejemplo}»` : ""}) | ${formato.plan?.[i] || ""} | | | |`).join("\n") + "\n"
  : "";
writeFileSync(join(dir, "plan.md"), `# Plan: ${idea}
${formato ? `\nFormato: ${formato.titulo}. ${formato.para}\n` : ""}
## Los sitios

## Frase a frase

| # | Frase (y su palabra clave) | Lo que se ve, de su primera palabra a la última | En qué palabra pasa lo fuerte | Cámara | Cómo se pasa a la siguiente |
|---|---|---|---|---|---|
${filas}`);
writeFileSync(join(dir, "video", "mundo.js"), `// Lo que comparten los planos de este vídeo: el mismo objeto, el mismo cielo, la misma cámara. Si algo sale en más
// de un plano, se hace aquí una vez, para que sea siempre la misma cosa, del mismo tamaño.
import * as k from "#kit";
import { v } from "#voz";
`);
writeFileSync(join(dir, "video", "planos", "01-hook.js"), `// «(la primera frase)»
// Lo que se ve, frase a frase, de la primera palabra a la última (lo mismo que dice plan.md).
import * as k from "#kit";
import { v } from "#voz";

export const desde = 0; // el primer plano empieza en 0; los demás, en la palabra que trae lo nuevo ("palabra" o "palabra#2")

export function dibuja(g, t) {
  // t: el segundo del vídeo. Todo se calcula desde t (nada se guarda de un fotograma al siguiente).
  // v.t("palabra"): cuándo se dice esa palabra.
  g.fillStyle = "#03050a"; g.fillRect(0, 0, 1080, 1920);
}
`);
if (marca.efectos !== false) writeFileSync(join(dir, "sonidos.js"), `// Los efectos: cada uno en lo que se mueve, en el fotograma en que se mueve (mira guia/sonido.md).
import { v } from "#voz";

const e = [];
const pon = (sonido, t, o = {}) => e.push({ sonido, t, ...o });

export default e;
`);
writeFileSync(join(dir, "notas.md"), `# ${idea}\n\nPedido el ${hoy}.\n`);
console.log(dir);
