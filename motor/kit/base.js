// Lo básico: vectores, curvas de tiempo, azar con semilla, lienzos auxiliares y colores.
import { createCanvas } from "@napi-rs/canvas";
import { estilo } from "#estilo";

export const ANCHO = 1080, ALTO = 1920;

// ---------------------------------------------------------------- vectores [x, y, z]
export const sum = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const res = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const por = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const pto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const largo = (a) => Math.sqrt(pto(a, a));
export const uni = (a) => por(a, 1 / (largo(a) || 1));
export const mezV = (a, b, u) => sum(a, por(res(b, a), u));

// ---------------------------------------------------------------- el tiempo
// tramo(t, a, b): 0 antes de a, 1 después de b, y en medio la recta. Con a > b también vale (va de 1 a 0).
export const tramo = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
// suave(u): arranca y frena sin tirones (primera y segunda derivada a cero en los extremos).
export const suave = (u) => u * u * u * (u * (u * 6 - 15) + 10);
export const mez = (a, b, u) => a + (b - a) * u;
// Curvas para lo que llega o se va: entra(u) llega rápido y frena largo; sale(u) arranca despacio y se va rápido.
export const entra = (u) => 1 - Math.pow(1 - u, 3);
export const sale = (u) => u * u * u;
// Un pulso que sube y baja alrededor de t0 (ancho: lo que dura, más o menos).
export const pulso = (t, t0, ancho = 0.2) => Math.exp(-Math.pow((t - t0) / ancho, 2));
// Lo que se mueve de a a b entre dos segundos, suave: de(t, t0, t1, a, b).
export const de = (t, t0, t1, a, b) => mez(a, b, suave(tramo(t, t0, t1)));

// curva(claves): pasa por cada [t, valor] sin pasarse ni pararse en medio (cúbica monótona). Para que algo vaya por
// varios sitios seguidos con la velocidad continua: el tamaño de una cosa, la distancia de la cámara...
// p0 y p1: la pendiente al principio y al final (0 para que arranque y acabe quieta).
export function curva(claves, p0, p1) {
  const n = claves.length, m = [], d = [];
  if (n === 1) return () => claves[0][1];
  for (let i = 0; i < n - 1; i++) d.push((claves[i + 1][1] - claves[i][1]) / (claves[i + 1][0] - claves[i][0]));
  m[0] = p0 === undefined ? d[0] : p0; m[n - 1] = p1 === undefined ? d[n - 2] : p1;
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (t) => {
    if (t <= claves[0][0]) return claves[0][1] + m[0] * (t - claves[0][0]);
    if (t >= claves[n - 1][0]) return claves[n - 1][1] + m[n - 1] * (t - claves[n - 1][0]);
    let j = 0;
    while (j < n - 1 && t > claves[j + 1][0]) j++;
    const h = claves[j + 1][0] - claves[j][0], u = (t - claves[j][0]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * claves[j][1] + (u3 - 2 * u2 + u) * h * m[j] + (-2 * u3 + 3 * u2) * claves[j + 1][1] + (u3 - u2) * h * m[j + 1];
  };
}

// claves([[t, v], ...]) sin pendientes en los extremos: arranca y acaba quieto. Lo normal para algo que se mueve
// entre posiciones y se para.
export const claves = (lista) => curva(lista, 0, 0);

// ---------------------------------------------------------------- azar con semilla
// Nada usa Math.random: con la misma semilla sale siempre lo mismo, en cada fotograma y en cada render.
export function azar(semilla) {
  let a = (semilla >>> 0) || 1;
  return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------------------------------------------------------------- lienzos y dibujo
export const lienzo = (w, h) => createCanvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h ?? w)));
// Una imagen girada alrededor de su centro.
export function girado(g, img, x, y, tam, ang) { g.save(); g.translate(x, y); g.rotate(ang); g.drawImage(img, -tam / 2, -tam / 2, tam, tam); g.restore(); }
// Un rectángulo de esquinas redondas (solo el camino: luego fill o stroke).
export function redondo(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}

// ---------------------------------------------------------------- colores
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// mezColor("#ff0000", "#0000ff", 0.5) → "rgb(128,0,128)"
export const mezColor = (a, b, u) => { const x = hex(a), y = hex(b); return `rgb(${Math.round(mez(x[0], y[0], u))},${Math.round(mez(x[1], y[1], u))},${Math.round(mez(x[2], y[2], u))})`; };
// mezRgb("255,0,0", "0,0,255", 0.5) → "128,0,128" (para meterlo en "rgba(" + ... + ",0.5)")
export const mezRgb = (a, b, u) => { const x = a.split(","), y = b.split(","); return `${Math.round(mez(+x[0], +y[0], u))},${Math.round(mez(+x[1], +y[1], u))},${Math.round(mez(+x[2], +y[2], u))}`; };

// Un número como se escribe en el idioma del vídeo (estilo.idioma, o el que se pida):
//   es: 30000 → "30.000", 1,9 · en: "30,000", "1.9" · fr: "30 000", "1,9"...
export function fmt(v, dec = 0, idioma = estilo.idioma) {
  if (idioma === "es") { const s = Math.abs(v).toFixed(dec).split("."); return (v < 0 ? "-" : "") + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (s[1] ? "," + s[1] : ""); }
  return formato(idioma, dec).format(v);
}
const formatos = new Map();
function formato(idioma, dec) {
  const k = idioma + dec;
  if (!formatos.has(k)) formatos.set(k, new Intl.NumberFormat(idioma, { useGrouping: "always", minimumFractionDigits: dec, maximumFractionDigits: dec }));
  return formatos.get(k);
}
