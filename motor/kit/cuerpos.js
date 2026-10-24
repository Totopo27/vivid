// Cuerpos redondos y rocas, con luz y volumen: una esfera brillante (una estrella, una bombilla, un sol), un planeta
// de roca con su lado de noche, la Tierra, y rocas irregulares iluminadas que pueden ponerse al rojo.
import { azar, girado, lienzo, mez, mezColor, mezRgb } from "./base.js";
import { brillo } from "./luz.js";
import { manchas, red, red2, ruido } from "./texturas.js";

// Paletas de una esfera que brilla: [centro, medio, borde, limbo, corona ("r,g,b")].
export const PALETAS = {
  verde: ["#e2ffb2", "#98e646", "#51b424", "#1c5a0e", "122,255,72"],
  roja: ["#ffd3b6", "#ff7244", "#d63f1a", "#7a1b0b", "255,96,60"],
  gigante: ["#ffc9a0", "#ff6a36", "#c8341a", "#5e1408", "255,90,50"],
  amarilla: ["#fff7d6", "#ffd96a", "#f0a535", "#a35e18", "255,206,96"],
  blanca: ["#ffffff", "#eef3ff", "#c9d5f1", "#8796c2", "222,232,255"],
  enana: ["#ffffff", "#f1f5ff", "#d7e2fb", "#9fb0dc", "214,228,255"],
  azul: ["#eef5ff", "#a2c6ff", "#5587e4", "#284ca4", "128,172,255"],
};

// Una paleta a medio camino entre dos (para que algo cambie de color poco a poco). u de 0 a 1.
export function paleta(a, b, u = 0) {
  const A = typeof a === "string" ? PALETAS[a] : a, B = typeof b === "string" ? PALETAS[b] : b || A;
  if (!b || u <= 0) return A;
  if (u >= 1) return B;
  return [mezColor(A[0], B[0], u), mezColor(A[1], B[1], u), mezColor(A[2], B[2], u), mezColor(A[3], B[3], u), mezRgb(A[4], B[4], u)];
}

// Una esfera que brilla (una estrella), de radio rad en (x, y), con su corona alrededor y su superficie que hierve.
// P: una paleta (nombre o lista). gira: el giro de la superficie (radianes; súmale el tiempo para que gire).
// b: cuánto brilla de más (0 normal; 1, un destello).
export function estrella(g, P, x, y, rad, gira = 0, b = 0) {
  if (typeof P === "string") P = PALETAS[P];
  if (rad < 0.5) return;
  const A = g.globalAlpha;
  g.save();
  const cor = rad * (2.3 + 0.6 * b), gr = g.createRadialGradient(x, y, rad * 0.9, x, y, cor);
  gr.addColorStop(0, `rgba(${P[4]},${Math.min(1, 0.55 + 0.35 * b)})`); gr.addColorStop(0.28, `rgba(${P[4]},0.18)`); gr.addColorStop(1, `rgba(${P[4]},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, cor, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.clip();
  const dg = g.createRadialGradient(x - rad * 0.12, y - rad * 0.16, 0, x, y, rad);
  dg.addColorStop(0, P[0]); dg.addColorStop(0.45, P[1]); dg.addColorStop(0.84, P[2]); dg.addColorStop(1, P[3]);
  g.fillStyle = dg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  g.globalCompositeOperation = "multiply";
  g.globalAlpha = A * 0.42; girado(g, red, x, y, rad * 2.7, gira);
  g.globalAlpha = A * 0.25; girado(g, red2, x, y, rad * 2.5, -gira * 0.8 + 0.7);
  g.globalCompositeOperation = "screen";
  g.globalAlpha = A * 0.3; girado(g, manchas, x, y, rad * 2.2, gira * 0.5 + 2.1);
  g.globalCompositeOperation = "source-over"; g.globalAlpha = A;
  const lg = g.createRadialGradient(x, y, rad * 0.45, x, y, rad);
  lg.addColorStop(0, "rgba(0,0,0,0)"); lg.addColorStop(1, "rgba(0,0,0,0.5)");
  g.fillStyle = lg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  g.restore();
}

// Lo mismo, pero dibujada aparte y puesta con transparencia al (0 a 1): para que aparezca o se vaya entera.
// (Dibujarla directamente con globalAlpha no vale: sus capas se pintan cada una con su propia transparencia.)
let aparte = null;
export function estrellaTransparente(g, P, x, y, rad, gira, b, al) {
  if (al >= 0.999) return estrella(g, P, x, y, rad, gira, b);
  if (al <= 0.001) return;
  aparte = aparte || lienzo(1080, 1920);
  const ga = aparte.getContext("2d");
  ga.setTransform(1, 0, 0, 1, 0, 0); ga.globalAlpha = 1; ga.globalCompositeOperation = "source-over";
  ga.clearRect(0, 0, 1080, 1920);
  estrella(ga, P, x, y, rad, gira, b);
  g.save(); g.globalAlpha *= al; g.drawImage(aparte, 0, 0); g.restore();
}

// La forma de una roca: un polígono irregular de radio 1, siempre el mismo para la misma semilla.
const formas = new Map();
export function forma(semilla) {
  if (formas.has(semilla)) return formas.get(semilla);
  const az = azar(1000 + semilla), n = 9 + Math.floor(az() * 5), pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + (az() - 0.5) * 0.5, r = 0.62 + az() * 0.38; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  formas.set(semilla, pts);
  return pts;
}

// Una roca de radio rad, girada ang, iluminada desde la dirección (lx, ly) de la pantalla. calor de 0 a 1: se pone al
// rojo y brilla (como algo que cae a mucha velocidad o se quema).
export function roca(g, x, y, rad, ang, semilla, lx = 0, ly = -1, calor = 0) {
  if (rad < 0.6) return;
  const pts = forma(semilla), c = calor, l = Math.sqrt(lx * lx + ly * ly) || 1, A = g.globalAlpha;
  lx /= l; ly /= l;
  if (c > 0.02) brillo(g, x, y, rad * (3 + 3 * c), "sodio", 0.55 * c);
  g.save(); g.translate(x, y); g.rotate(ang);
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0] * rad, p[1] * rad) : g.moveTo(p[0] * rad, p[1] * rad))); g.closePath();
  g.clip();
  const ca = Math.cos(-ang), sa = Math.sin(-ang), llx = lx * ca - ly * sa, lly = lx * sa + ly * ca;
  const gr = g.createLinearGradient(llx * rad, lly * rad, -llx * rad, -lly * rad);
  gr.addColorStop(0, mezColor("#a99482", "#ffd27a", c)); gr.addColorStop(0.5, mezColor("#5e5045", "#ff8a2a", c)); gr.addColorStop(1, mezColor("#17120f", "#5a1a06", c));
  g.fillStyle = gr; g.fillRect(-rad, -rad, rad * 2, rad * 2);
  g.globalCompositeOperation = "multiply"; g.globalAlpha = A * 0.7; g.drawImage(manchas, -rad * 1.2, -rad * 1.2, rad * 2.4, rad * 2.4);
  g.globalAlpha = A * 0.35; g.drawImage(red, -rad, -rad, rad * 2, rad * 2);
  g.restore();
}

// Un planeta de roca con su lado de noche (la luz llega desde la dirección (lx, ly) de la pantalla).
// tono: [luz, medio, sombra] en "#rrggbb".
export function planeta(g, x, y, rad, gira, lx, ly, tono = ["#c9a27a", "#8a6346", "#3a2416"]) {
  if (rad < 0.6) return;
  const l = Math.sqrt(lx * lx + ly * ly) || 1, A = g.globalAlpha;
  lx /= l; ly /= l;
  g.save(); g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.clip();
  const gr = g.createRadialGradient(x + lx * rad * 0.45, y + ly * rad * 0.45, rad * 0.05, x, y, rad * 1.05);
  gr.addColorStop(0, tono[0]); gr.addColorStop(0.55, tono[1]); gr.addColorStop(1, tono[2]);
  g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  g.globalCompositeOperation = "multiply"; g.globalAlpha = A * 0.75; girado(g, manchas, x, y, rad * 2.8, gira);
  g.globalAlpha = A * 0.5; girado(g, red, x, y, rad * 2.6, gira * 1.3 + 1);
  g.globalCompositeOperation = "source-over"; g.globalAlpha = A;
  const sombra = g.createLinearGradient(x + lx * rad, y + ly * rad, x - lx * rad, y - ly * rad);
  sombra.addColorStop(0, "rgba(0,0,0,0)"); sombra.addColorStop(0.55, "rgba(0,0,0,0.15)"); sombra.addColorStop(1, "rgba(0,0,0,0.88)");
  g.fillStyle = sombra; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  g.restore();
}

// el mapa da la vuelta entera sin costura: la segunda mitad es la primera en espejo
const mapaTierra = (() => {
  const t = ruido(256, 41, 3, 5, "crudo"), nb = ruido(256, 43, 5, 4, "crudo"), n = 256;
  const l = lienzo(n * 2, n), cx = l.getContext("2d"), img = cx.createImageData(n * 2, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n * 2; x++) {
    const i = y * n + (x < n ? x : 2 * n - 1 - x), h = t.crudo[i], nube = nb.crudo[i], k = (y * n * 2 + x) * 4, lat = Math.abs(y / n - 0.5) * 2;
    const col = h > 0.56 ? (lat > 0.82 ? [236, 240, 246] : h > 0.66 ? [124, 104, 72] : [62, 120, 58]) : [18 + 30 * h, 62 + 60 * h, 140 + 80 * h];
    const cl = Math.max(0, Math.min(1, (nube - 0.55) * 4));
    img.data[k] = mez(col[0], 245, cl); img.data[k + 1] = mez(col[1], 248, cl); img.data[k + 2] = mez(col[2], 252, cl); img.data[k + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  return l;
})();

// La Tierra: sus mares, continentes y nubes que giran (gira de 0 a 1 es una vuelta), su lado de noche y el borde azul
// de su aire.
export function tierra(g, x, y, rad, gira, lx = -1, ly = -0.15) {
  if (rad < 0.6) return;
  const l = Math.sqrt(lx * lx + ly * ly) || 1;
  lx /= l; ly /= l;
  g.save();
  const halo = g.createRadialGradient(x, y, rad * 0.95, x, y, rad * 1.18);
  halo.addColorStop(0, "rgba(120,180,255,0.55)"); halo.addColorStop(1, "rgba(120,180,255,0)");
  g.fillStyle = halo; g.beginPath(); g.arc(x, y, rad * 1.18, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.clip();
  const w = rad * 4, h = rad * 2, off = ((((gira % 1) + 1) % 1)) * w;
  g.drawImage(mapaTierra, x - rad - off, y - rad, w, h); g.drawImage(mapaTierra, x - rad - off + w, y - rad, w, h);
  const esf = g.createRadialGradient(x - rad * 0.3, y - rad * 0.35, rad * 0.1, x, y, rad);
  esf.addColorStop(0, "rgba(255,255,255,0.18)"); esf.addColorStop(0.7, "rgba(0,0,0,0)"); esf.addColorStop(1, "rgba(0,10,30,0.55)");
  g.fillStyle = esf; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  const sombra = g.createLinearGradient(x + lx * rad, y + ly * rad, x - lx * rad, y - ly * rad);
  sombra.addColorStop(0, "rgba(0,0,0,0)"); sombra.addColorStop(0.5, "rgba(0,0,0,0.1)"); sombra.addColorStop(1, "rgba(0,0,10,0.85)");
  g.fillStyle = sombra; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  g.restore();
}
