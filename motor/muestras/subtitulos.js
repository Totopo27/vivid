// La lámina de los estilos de subtítulos (guia/muestras/subtitulos.jpg): cada estilo sobre un fotograma de verdad de
// los ejemplos, con su voz, en un momento en que se ven varias palabras y la clave. Cada cuadrado es un trozo de
// 1080 × 1080 del fotograma, el que rodea a los subtítulos. Su nombre dice el estilo y lo que se le ha pedido.
import { createCanvas } from "@napi-rs/canvas";
import { join } from "node:path";
import { RAIZ } from "../lib/comun.mjs";
import { dibujar, preparar } from "../lib/cuadro.mjs";
import { abrir } from "../lib/proyecto.mjs";
import { bloques } from "../lib/subtitulos.mjs";

// [nombre, ejemplo, segundo, subtítulos, desde qué y del fotograma]
const MUESTRAS = [
  ["caja · arriba (la de siempre)", "estrella-verde", 0.75, { estilo: "caja", posicion: "arriba" }, 120],
  ["karaoke · arriba", "alcohol", 16.45, { estilo: "karaoke", posicion: "arriba" }, 120],
  ["karaoke · abajo · colores", "estrella-verde", 15.62, { estilo: "karaoke", posicion: "abajo", colores: { dicha: "#7dffa1", marca: "#e8304f" } }, 600],
  ["gigante · centro", "estrella-verde", 0.75, { estilo: "gigante", posicion: "centro" }, 420],
  ["gigante · arriba", "alcohol", 47.62, { estilo: "gigante", posicion: "arriba" }, 120],
  ["minimal · arriba", "alcohol", 38.62, { estilo: "minimal", posicion: "arriba" }, 120],
  ["contorno · arriba", "estrella-verde", 0.95, { estilo: "contorno", posicion: "arriba" }, 120],
  ["contorno · abajo · escala 1,2", "alcohol", 22.4, { estilo: "contorno", posicion: "abajo", escala: 1.2 }, 600],
  ["fondo · arriba", "estrella-verde", 9.2, { estilo: "fondo", posicion: "arriba" }, 120],
];

// Los fotogramas, de ejemplo en ejemplo (cada uno con su voz: abrir otro la cambia).
const hechos = [];
for (const ej of [...new Set(MUESTRAS.map((m) => m[1]))]) {
  const proy = await abrir(join(RAIZ, "ejemplo", ej)), est = preparar(proy);
  MUESTRAS.forEach(([, e, t, conf, y], i) => {
    if (e !== ej) return;
    est.conf = conf;
    est.subs = bloques(proy.v.palabras, proy.duracion, conf);
    const c = createCanvas(1080, 1080);
    c.getContext("2d").drawImage(dibujar(proy, est, t), 0, y, 1080, 1080, 0, 0, 1080, 1080);
    hechos[i] = c;
  });
}

export default MUESTRAS.map(([nombre], i) => [nombre, (g) => g.drawImage(hechos[i], 0, 0)]);
