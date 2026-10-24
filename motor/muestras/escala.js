// La lámina de la escala (guia/muestras/escala.jpg): cifras que corren, uno de cada N, torres, pilas y la fila de
// tamaños. Cada muestra pinta un cuadrado de 1080 × 1080.
import * as k from "#kit";

// un fondo oscuro con una luz suave en medio, como un estudio (las torres se suben: su cámara centra en el fotograma de
// 1920 y la muestra es el cuadrado de arriba)
const estudio = (g, c = "#1c2540") => { const gr = g.createRadialGradient(540, 470, 0, 540, 540, 900); gr.addColorStop(0, c); gr.addColorStop(1, "#04060c"); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1080); };
const espacio = (g) => k.fondo(g, k.mira([0, 0, 30], [0, 0, 0]));
const PLANETAS = [
  { tam: 3474, nombre: "La Luna", cifra: "3.474 km", tipo: "luna" },
  { tam: 12742, nombre: "La Tierra", cifra: "12.742 km", tipo: "tierra" },
  { tam: 139820, nombre: "Júpiter", cifra: "139.820 km", tipo: "gaseoso" },
  { tam: 1392700, nombre: "El Sol", cifra: "1.392.700 km", tipo: "estrella:amarilla" },
];

export default [
  ["cifraGigante(g, x, y, valor, u, op) · u = 0,6", (g) => { estudio(g); k.cifraGigante(g, 540, 520, 8000000000, 0.6, { unidad: "personas" }); }],
  ["cifraGigante(...) · u = 1, brilla: 1", (g) => { estudio(g, "#10283a"); k.cifraGigante(g, 540, 520, 384400, 1, { unidad: "km hasta la Luna", color: "120,220,255", brilla: 1 }); }],
  ["unoDeCada(g, 10000, cerca = 1)", (g) => { estudio(g); k.unoDeCada(g, 10000, 1, { y: 540, ancho: 960, alto: 960 }); }],
  ["unoDeCada(g, 10000, 0,45)", (g) => { estudio(g); k.unoDeCada(g, 10000, 0.45, { y: 540, ancho: 960, alto: 960 }); }],
  ["unoDeCada(g, 10000, 0) · todas", (g) => { estudio(g); k.unoDeCada(g, 10000, 0, { y: 540, ancho: 960, alto: 960 }); }],
  ["unoDeCada(g, 1000000, 0, { ficha: \"bola\" })", (g) => { estudio(g); k.unoDeCada(g, 1000000, 0, { y: 540, ancho: 960, alto: 960, ficha: "bola", color: "120,190,255", destaca: "255,110,90" }); }],
  ["torres(g, cam, lista, u)", (g) => { estudio(g); g.translate(0, -430); k.torres(g, k.mira([5, 9, 21], [0, 4.2, 0]), [{ valor: 120, nombre: "España" }, { valor: 340, nombre: "EE. UU." }, { valor: 60, nombre: "India" }, { valor: 210, nombre: "China" }], 1); }],
  ["torres(...) · u = 0,5 (crecen una tras otra)", (g) => { estudio(g); g.translate(0, -430); k.torres(g, k.mira([0, 9, 19], [0, 3.8, 0]), [{ valor: 9, nombre: "A mano" }, { valor: 3, nombre: "Lavavajillas" }], 0.5, { unidad: " l", ancho: 2.6, hueco: 1.6 }); }],
  ["pila(g, x, y, n, u) · monedas", (g) => { estudio(g, "#2a2416"); k.pila(g, 470, 900, 30, 0.72, { tope: 300 }); }],
  ["pila(..., { objeto: \"libro\" })", (g) => { estudio(g, "#26201c"); k.pila(g, 430, 920, 18, 1, { objeto: "libro", ancho: 330, grueso: 46 }); }],
  ["filaDeTamanos(g, lista, foco) · foco = 1,4", (g) => { espacio(g); k.filaDeTamanos(g, PLANETAS, 1.4, { y: 500 }); }],
  ["filaDeTamanos(...) · foco = 2,6", (g) => { espacio(g); k.filaDeTamanos(g, PLANETAS, 2.6, { y: 500 }); }],
];
