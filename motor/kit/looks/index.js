// Los looks: el aire de un vídeo entero. Cada vídeo dice el suyo en guion.json ("look": "neon") o lo hereda de la marca.
// Qué looks hay, cuándo usar cada uno y cómo se dibuja en cada uno: guia/looks.md (y guia/muestras/looks.jpg).
//
// Un look (looks/<nombre>.js) exporta por defecto:
//   nombre, descripcion
//   colores     { fondo, tinta, acentos: [...], luz, sombra }, como "r,g,b" (para "rgba(" + c + ",0.5)")
//   fondo(g, t, cam)     pinta el fondo del look (lo llama el plano con k.fondoDelLook(g, t, cam), si lo quiere)
//   acabado(g, t, aux)   o null: lo que se hace sobre el fotograma ya dibujado, antes de los subtítulos (el grano, el
//                        color, la viñeta...). aux: un lienzo de 1080 × 1920 para usar de paso. Tiene que ser rápido
//                        (unos pocos ms) y salir igual siempre para el mismo t.
//   material(g, x0, y0, x1, y1, tono, lx, ly)   rellena el camino actual con el sombreado del look
//   trazo(g, ancho, tono, al)                    pinta el camino actual con la línea del look
//   sombra(g, x, y, ancho, al)                   la sombra de algo apoyado en el suelo
//   consejos    frases cortas para quien dibuja: qué materiales, qué luz, qué trazo y qué evitar en ese look
//   claro       true si sus fondos son claros (los subtítulos con palabras en gris se leen mal encima)
// Lo que comparten los acabados (el resplandor, el grano, la viñeta, los colores) está en looks/pasos.js.
import { estilo } from "#estilo";
import arcilla from "./arcilla.js";
import cine from "./cine.js";
import dia from "./dia.js";
import espacio from "./espacio.js";
import neon from "./neon.js";
import papel from "./papel.js";

export const LOOKS = { espacio, neon, papel, arcilla, cine, dia };

// El look del vídeo que se está haciendo (o el que se pida por su nombre).
export function look(nombre = estilo.look) {
  const l = LOOKS[nombre];
  if (!l) throw new Error(`No hay ningún look «${nombre}». Hay: ${Object.keys(LOOKS).join(", ")}.`);
  return l;
}

// El fondo del look del vídeo.
export function fondoDelLook(g, t, cam, nombre) {
  look(nombre).fondo(g, t, cam);
}

// El camino actual (beginPath... closePath) relleno con el material del look del vídeo: su luz, su sombra y su
// textura. x0, y0, x1, y1: la caja que ocupa; tono: su color ("r,g,b", "#rrggbb" o un nombre de k.COLORES); lx, ly:
// de dónde viene la luz en la pantalla (si no se dice, de arriba a la izquierda). El camino sigue ahí para un trazo.
export function materialDelLook(g, x0, y0, x1, y1, tono, lx, ly, nombre) {
  look(nombre).material(g, x0, y0, x1, y1, tono, lx, ly);
}

// El camino actual pintado con la línea del look del vídeo: un tubo de neón, un trazo de tinta, un churro de
// arcilla... ancho: su grosor en px; tono: su color (si no se dice, el del look); al: de 0 a 1.
export function trazoDelLook(g, ancho, tono, al, nombre) {
  look(nombre).trazo(g, ancho, tono, al);
}

// La sombra de algo apoyado en el suelo, centrada en (x, y), de ancho px, como la hace el look del vídeo.
export function sombraDelLook(g, x, y, ancho, al, nombre) {
  look(nombre).sombra(g, x, y, ancho, al);
}

// Una línea de luz sobre el camino actual, en cualquier look: lineaDeLuz(g, ancho, tono, al, k, halo, blanco) pinta un
// núcleo de ancho px del color tono, con el centro casi blanco, y un halo que se apaga sin escalones hasta k veces más
// ancho. Se suma ("lighter"): una órbita, un rayo, el contorno de algo encendido. Sobre lo claro, poca transparencia.
export { lineaDeLuz } from "./pasos.js";

// El acabado del look sobre el fotograma (lo llama el motor; los planos no).
export function aplicarLook(g, t, aux, nombre) {
  const l = look(nombre);
  if (!l.acabado) return;
  g.save();
  l.acabado(g, t, aux);
  g.restore();
}
