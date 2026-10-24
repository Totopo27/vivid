// Los subtítulos, dibujados encima de cada fotograma. Hay varios estilos (subtitulos/<estilo>.mjs); cada vídeo dice cuál
// en su guion.json ("subtitulos": { "estilo": "caja", "posicion": "arriba" }) o lo hereda de la marca. Qué hace cada
// uno y cuándo se usa: guia/subtitulos.md; cómo se ven: guia/muestras/subtitulos.jpg.
//   caja       los de siempre: pocas palabras, la clave en su recuadro azul de selección
//   karaoke    el bloque entero a la vista; la palabra que suena se enciende, la clave en su pastilla
//   gigante    una o dos palabras enormes que entran de golpe; para hooks con ritmo
//   minimal    limpios y pequeños, sin cajas, con sombra suave; para vídeos elegantes o de datos
//   contorno   mayúsculas gruesas con borde negro (TikTok, CapCut); la clave en amarillo
//   fondo      letra oscura sobre bandas blancas (el texto de TikTok); el que mejor se lee sobre lo claro
//
// Un estilo es un módulo que exporta:
//   bloques(palabras, duracion, conf)   parte las palabras de la voz en los grupos que se ven juntos; cada bloque,
//                                       { frase, palabras, inicio, fin } (se calcula una vez por vídeo)
//   dibuja(g, t, bloques, conf)          dibuja el fotograma t encima de lo que ya hay (sin dejar nada cambiado en g)
//   zona(conf)                           { x, y, w, h }: dónde caen, para medir si se leen y que nada importante vaya ahí
// conf: { estilo, posicion: "arriba" | "abajo" | "no", ... } (lo demás, lo que entienda cada estilo; los nuevos
// entienden también "centro", colores: { tinta, dicha, marca } y escala).
// Cada palabra trae { texto, inicio, fin, frase, clave }: clave es la palabra marcada de su frase.
import { GlobalFonts } from "@napi-rs/canvas";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./comun.mjs";
import * as caja from "./subtitulos/caja.mjs";
import * as contorno from "./subtitulos/contorno.mjs";
import * as fondo from "./subtitulos/fondo.mjs";
import * as gigante from "./subtitulos/gigante.mjs";
import * as karaoke from "./subtitulos/karaoke.mjs";
import * as minimal from "./subtitulos/minimal.mjs";

// La letra se carga leyendo sus bytes, no por su ruta: en Windows, una carpeta con tildes o símbolos raros dejaba los
// subtítulos sin letra.
for (const p of ["Medium", "Bold", "ExtraBold"]) GlobalFonts.register(readFileSync(join(RAIZ, "letra", `Figtree-${p}.ttf`)), "Figtree");

export const ESTILOS = { caja, karaoke, gigante, minimal, contorno, fondo };
export const ESTILO = caja.ESTILO; // las medidas del estilo de siempre (las usa quien no sabe de estilos)

const POR_DEFECTO = { estilo: "caja", posicion: "arriba" };

export function estiloDeSubtitulos(conf = POR_DEFECTO) {
  const e = ESTILOS[conf.estilo || "caja"];
  if (!e) throw new Error(`No hay ningún estilo de subtítulos «${conf.estilo}». Hay: ${Object.keys(ESTILOS).join(", ")}.`);
  return e;
}

export function bloques(palabras, duracion, conf = POR_DEFECTO) {
  return estiloDeSubtitulos(conf).bloques(palabras, duracion, conf);
}

export function dibujarSubtitulos(g, t, bs, conf = POR_DEFECTO) {
  if (typeof conf === "string") conf = { ...POR_DEFECTO, posicion: conf }; // como se llamaba antes: dibujarSubtitulos(g, t, bs, "arriba")
  if (conf.posicion === "no") return;
  estiloDeSubtitulos(conf).dibuja(g, t, bs, conf);
}

// Dónde caen los subtítulos de este vídeo (null si no lleva).
export function zonaSubtitulos(conf = POR_DEFECTO) {
  if (conf.posicion === "no") return null;
  return estiloDeSubtitulos(conf).zona(conf);
}
