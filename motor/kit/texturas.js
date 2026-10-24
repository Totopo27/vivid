// Texturas hechas de ruido, una vez y con semilla: la granulación de una superficie, un moteado, la red de luz del
// fondo de una piscina, una nebulosa. Se pintan encima de una forma (con "multiply" oscurecen, con "screen" o
// "lighter" iluminan) para que nada sea un color plano.
import { azar, lienzo } from "./base.js";

const guardadas = new Map();

// ruido(n, semilla, escala, octavas, modo): una imagen de n × n en grises.
//   modo "crudo": el ruido tal cual · "manchas": moteado con contraste · "lineas": una red de líneas oscuras finas
//   (granulación, roca, piel) · "luz": líneas brillantes sobre negro (la luz del agua, venas de luz).
// La imagen trae .crudo: los valores de 0 a 1, para hacer mapas propios (como el de la Tierra).
export function ruido(n, semilla, escala, octavas, modo = "crudo") {
  const k = [n, semilla, escala, octavas, modo].join("-");
  if (guardadas.has(k)) return guardadas.get(k);
  const r = azar(semilla), G = 256, rej = new Float32Array(G * G);
  for (let i = 0; i < G * G; i++) rej[i] = r();
  const val = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, x0 = xi & 255, y0 = yi & 255, x1 = (xi + 1) & 255, y1 = (yi + 1) & 255;
    const a = rej[y0 * G + x0], b = rej[y0 * G + x1], c = rej[y1 * G + x0], e = rej[y1 * G + x1], u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * w + (a - b - c + e) * u * w;
  };
  const l = lienzo(n), cx = l.getContext("2d"), img = cx.createImageData(n, n), crudo = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let s = 0, amp = 1, fr = escala, tot = 0;
    for (let o = 0; o < octavas; o++) { s += val((x * fr) / n, (y * fr) / n) * amp; tot += amp; amp *= 0.55; fr *= 2; }
    s /= tot; crudo[y * n + x] = s;
    const v = modo === "lineas" ? 1 - 0.5 * Math.pow(1 - Math.min(1, Math.abs(2 * s - 1) * 4.5), 2)
      : modo === "manchas" ? Math.max(0, Math.min(1, (s - 0.5) * 2.2 + 0.5))
      : modo === "luz" ? Math.pow(Math.max(0, 1 - Math.abs(2 * s - 1) * 5), 2.2) : s;
    const q = (y * n + x) * 4;
    img.data[q] = img.data[q + 1] = img.data[q + 2] = Math.round(255 * v); img.data[q + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  l.crudo = crudo;
  guardadas.set(k, l);
  return l;
}

// Teñir una textura gris de un color ("multiply"): sirve para dar color a la luz o a las manchas.
export function tenir(src, color) {
  const t = lienzo(src.width, src.height), c = t.getContext("2d");
  c.drawImage(src, 0, 0); c.globalCompositeOperation = "multiply"; c.fillStyle = color; c.fillRect(0, 0, src.width, src.height);
  return t;
}

// Las de siempre, ya hechas.
export const red = ruido(768, 11, 15, 3, "lineas");      // granulación fina
export const red2 = ruido(512, 17, 24, 2, "lineas");     // más fina aún, para mezclarla con la otra
export const manchas = ruido(384, 23, 6, 4, "manchas");  // moteado
// La red de luz que se mueve en el fondo de una piscina (o dentro de un aire espeso), azul blanca sobre negro.
export const causticas = tenir(ruido(640, 51, 7, 3, "luz"), "rgb(170,225,255)");
