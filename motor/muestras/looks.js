// La lámina de los looks (guia/muestras/looks.jpg): cada look en dos cuadros. El primero, dos fotogramas enteros del
// reel a la mitad de tamaño (a la izquierda, piezas del kit pintadas con sus colores; a la derecha, sus materiales,
// trazos y sombras), con su fondo, su acabado y un subtítulo encima. El segundo, un trozo del de la derecha a tamaño
// real, para ver la textura y el acabado de cerca. Cada muestra pinta un cuadrado de 1080 × 1080.
import * as k from "#kit";
import { bloques, dibujarSubtitulos } from "../lib/subtitulos.mjs";

const W = 1080, H = 1920, T = 2;
const lienzo = k.lienzo(W, H), aux = k.lienzo(W, H), hechos = new Map();
const rgb = (c) => `rgb(${c})`;
const mezcla = (a, b, u) => k.mezRgb(a, b, u);

// Una paleta de k.estrella hecha con un color del look.
const paletaDe = (c, L) => [rgb(mezcla(c, "255,255,255", 0.75)), rgb(mezcla(c, "255,255,255", 0.2)), rgb(c), rgb(mezcla(c, L.colores.sombra, 0.6)), c];

// El subtítulo de siempre encima, como en el vídeo: «Así se ve el look <nombre>».
function subtitulo(g, nombre) {
  const pal = ["Así", "se", "ve", nombre].map((texto, i) => ({ texto, inicio: i * 0.2, fin: i * 0.2 + 0.18, frase: 1, clave: i === 3 }));
  const conf = { estilo: "caja", posicion: "arriba" };
  dibujarSubtitulos(g, 0.75, bloques(pal, 5, conf), conf);
}

// El fotograma de un look con lo que dibuja escena(g, L, A), su acabado y su subtítulo.
function fotograma(nombre, cual, escena) {
  const clave = nombre + cual;
  if (hechos.has(clave)) return hechos.get(clave);
  const g = lienzo.getContext("2d"), L = k.LOOKS[nombre];
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.filter = "none";
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  g.save(); L.fondo(g, T, k.mira([0, 0, 30], [0, 0, 0])); escena(g, L, L.colores.acentos); g.restore();
  if (L.acabado) { g.save(); L.acabado(g, T, aux); g.restore(); }
  subtitulo(g, nombre);
  const copia = k.lienzo(W, H);
  copia.getContext("2d").drawImage(lienzo, 0, 0);
  hechos.set(clave, copia);
  return copia;
}

// Piezas del kit con los colores del look: una estrella, dos rocas, un frasco de cristal con su tapa de metal y brillos.
function conKit(g, L, A) {
  k.estrella(g, paletaDe(A[0], L), 330, 850, 200, 0.6, 0.1);
  k.roca(g, 800, 760, 120, 0.4, 3, -1, -0.6);
  k.roca(g, 850, 1010, 80, 1.6, 5, -1, -0.6, 0.7);
  k.redondo(g, 600, 1180, 300, 380, 40); g.fillStyle = rgb(mezcla(A[1], "255,255,255", 0.3)); g.fill();
  k.redondo(g, 580, 1150, 340, 440, 46); k.vidrio(g, 580, 920); k.reflejo(g, 850, 1180, 16, 360);
  g.beginPath(); g.moveTo(570, 1150); g.lineTo(570, 1090); g.quadraticCurveTo(750, 1010, 930, 1090); g.lineTo(930, 1150); g.closePath(); k.metal(g, 570, 930);
  k.brillo(g, 200, 1300, 260, A[2], 0.9); k.brillo(g, 330, 1430, 160, A[3], 0.8); k.brillo(g, 160, 620, 140, A[4] || A[1], 0.8);
}

// Lo propio del look: sus materiales (una bola, una caja, un huevo), sus sombras en el suelo y su trazo.
function conLook(g, L, A) {
  L.sombra(g, 560, 1330, 560, 1);
  g.beginPath(); g.arc(560, 1040, 270, 0, Math.PI * 2); L.material(g, 290, 770, 830, 1310, A[0]);
  L.sombra(g, 230, 1440, 300, 1);
  k.redondo(g, 90, 1180, 280, 250, 40); L.material(g, 90, 1180, 370, 1430, A[1]);
  L.sombra(g, 880, 1420, 220, 1);
  g.beginPath(); g.ellipse(880, 1330, 110, 80, 0.3, 0, Math.PI * 2); L.material(g, 770, 1250, 990, 1410, A[3]);
  g.beginPath(); g.moveTo(90, 640); for (let x = 90; x <= 990; x += 10) g.lineTo(x, 640 + 60 * Math.sin(x / 90 + T)); L.trazo(g, 12, A[1], 1);
}

const muestras = [];
for (const nombre of Object.keys(k.LOOKS)) {
  muestras.push([`${nombre} · el kit y sus materiales`, (g) => {
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, W);
    g.drawImage(fotograma(nombre, "kit", conKit), 0, 60, W / 2, H / 2);
    g.drawImage(fotograma(nombre, "look", conLook), W / 2, 60, W / 2, H / 2);
  }]);
  muestras.push([`${nombre} · de cerca`, (g) => { g.drawImage(fotograma(nombre, "look", conLook), 0, 560, W, W, 0, 0, W, W); }]);
}
export default muestras;
