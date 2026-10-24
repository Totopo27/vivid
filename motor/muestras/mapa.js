// La lámina de los mapas (guia/muestras/mapa.jpg): el globo de día, de noche y de cerca, la chincheta, la ruta y el
// mapa plano. Cada muestra pinta un cuadrado de 1080 × 1080.
import * as k from "#kit";

const espacio = (g) => k.fondo(g, k.mira([0, 0, 30], [0, 0, 0]));
const noche = (g) => { g.fillStyle = "#04070e"; g.fillRect(0, 0, 1080, 1080); };
const madrid = () => k.lugar("Madrid"), ny = () => k.lugar("Nueva York"), tokio = () => k.lugar("Tokio");

export default [
  ["globo(g, x, y, rad, lon, lat)", (g) => { espacio(g); k.globo(g, 540, 540, 420, -25, 22); }],
  ["globo(..., { luz }) · la noche, con sus ciudades", (g) => { espacio(g); k.globo(g, 540, 540, 420, 25, 38, { luz: [1, -0.25, -0.15] }); }],
  ["globo(...) · de cerca (rad 1500)", (g) => { espacio(g); k.globo(g, 540, 1500, 1500, 5, 30, { luz: [-0.5, -0.6, 0.6] }); }],
  ["chincheta(g, sobreGlobo(V, lat, lon), texto)", (g) => { espacio(g); const V = k.globo(g, 540, 600, 400, -12, 34); k.chincheta(g, k.sobreGlobo(V, ...madrid()), "Madrid"); }],
  ["rutaEnGlobo(g, V, a, b, u) · u = 0,6", (g) => { espacio(g); const V = k.globo(g, 540, 560, 420, -38, 30); k.rutaEnGlobo(g, V, madrid(), ny(), 0.6); }],
  ["rutaEnGlobo · u = 1 · chincheta en las dos puntas", (g) => { espacio(g); const V = k.globo(g, 540, 600, 400, -38, 30); k.rutaEnGlobo(g, V, madrid(), ny(), 1); k.chincheta(g, k.sobreGlobo(V, ...ny()), "Nueva York", 1, { color: "90,200,255", tam: 0.8, letra: 42 }); k.chincheta(g, k.sobreGlobo(V, ...madrid()), "Madrid", 1, { tam: 0.8, letra: 42 }); }],
  ["mapaPlano(g, x, y, ancho) · rutaEnMapa · chincheta", (g) => { noche(g); const M = k.mapaPlano(g, 540, 560, 1040); k.rutaEnMapa(g, M, madrid(), tokio(), 0.75); k.chincheta(g, k.enMapa(M, ...madrid()), "Madrid", 1, { tam: 0.7, letra: 40 }); }],
  ["mapaPlano(..., { noche: 1 })", (g) => { noche(g); k.mapaPlano(g, 540, 540, 1040, { noche: 1 }); }],
  ["mapaPlano(..., { centro, mar: \"todo\" }) · de cerca", (g) => { const M = k.mapaPlano(g, 540, 600, 9000, { centro: madrid(), mar: "todo" }); k.chincheta(g, k.enMapa(M, ...madrid()), "Madrid"); }],
  ["chincheta(..., u) · u = 0,3 / 0,6 / 1", (g) => { const M = k.mapaPlano(g, 540, 640, 5200, { centro: [42, 5], mar: "todo" }); [["Lisboa", 0.3], ["París", 0.6], ["Roma", 1]].forEach(([c, u]) => k.chincheta(g, k.enMapa(M, ...k.lugar(c)), c, u, { tam: 0.8, letra: 40 })); }],
];
