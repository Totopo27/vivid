// La luz: brillos, destellos, ondas y haces. Casi todo se suma ("lighter"): donde se juntan dos luces, más luz.
import { lienzo } from "./base.js";

// Los colores de las luces, como "r,g,b" (para "rgba(" + COLORES.verde + ",0.5)").
export const COLORES = {
  roja: "255,128,96", naranja: "255,178,107", amarilla: "255,231,163", blanca: "243,246,255", azul: "169,200,255",
  verde: "150,255,100", sodio: "255,170,60", fuego: "255,140,40", cian: "120,230,255", violeta: "190,140,255",
};

const halos = new Map();
// La textura de un brillo: centro blanco, su color alrededor, y se apaga hacia fuera. color: un nombre de COLORES o "r,g,b".
export function halo(color) {
  if (halos.has(color)) return halos.get(color);
  const rgb = COLORES[color] || color, l = lienzo(64), cx = l.getContext("2d"), gr = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.1, `rgba(${rgb},1)`); gr.addColorStop(0.3, `rgba(${rgb},0.35)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  cx.fillStyle = gr; cx.fillRect(0, 0, 64, 64);
  halos.set(color, l);
  return l;
}

// Un brillo en (x, y) de tam píxeles (de borde a borde), de un color y con una intensidad al (0 a 1).
export function brillo(g, x, y, tam, color = "blanca", al = 1) {
  if (al <= 0.003 || tam < 1) return;
  const A = g.globalAlpha;
  g.save();
  g.globalCompositeOperation = "lighter"; g.globalAlpha = A * Math.max(0, Math.min(1, al));
  g.drawImage(halo(color), x - tam / 2, y - tam / 2, tam, tam);
  g.restore();
}

// Un fogonazo con su onda, u segundos después de que pase: un círculo de luz que se abre y se apaga, y un anillo que
// sale hacia fuera. tam: hasta dónde llega la onda (px).
export function fogonazo(g, x, y, u, tam = 1300, color = "255,236,210") {
  if (u < 0 || u > 1.6) return;
  const onda = 1 - Math.exp(-u * 2.6);
  g.save();
  g.globalCompositeOperation = "lighter";
  const R = tam * 0.7 * (0.25 + onda), fg = g.createRadialGradient(x, y, 0, x, y, R);
  fg.addColorStop(0, `rgba(255,255,255,${0.95 * Math.exp(-u * 4)})`); fg.addColorStop(0.4, `rgba(${color},${0.35 * Math.exp(-u * 3)})`); fg.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = fg; g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
  g.strokeStyle = `rgba(${color},${0.7 * Math.exp(-u * 2.2)})`; g.lineWidth = 10 * Math.exp(-u * 1.5) + 2;
  g.beginPath(); g.arc(x, y, 60 + tam * onda, 0, Math.PI * 2); g.stroke();
  g.restore();
}

// Un haz de luz vertical (de abajo arriba): un núcleo brillante y su halo, de y0 (abajo) a y1 (arriba).
// apaga: si la punta se desvanece (para que no llegue dura a ningún sitio).
export function haz(g, x, y0, y1, color, al = 1, ancho = 52, apaga = false) {
  if (al <= 0 || y1 >= y0) return;
  g.save();
  g.globalCompositeOperation = "lighter";
  const hg = g.createLinearGradient(0, y0, 0, y1);
  hg.addColorStop(0, `rgba(${color},${0.35 * al})`); hg.addColorStop(1, `rgba(${color},${apaga ? 0 : 0.2 * al})`);
  g.fillStyle = hg; g.fillRect(x - ancho * 1.2, y1, ancho * 2.4, y0 - y1);
  const ng = g.createLinearGradient(0, y0, 0, y1);
  ng.addColorStop(0, `rgba(${color},${al})`); ng.addColorStop(apaga ? 0.6 : 1, `rgba(${color},${0.75 * al})`); if (apaga) ng.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = ng; g.fillRect(x - ancho / 2, y1, ancho, y0 - y1);
  g.restore();
}

// Rayos de luz que bajan desde arriba en diagonal (como el sol entrando en el agua), que se mueven despacio.
export function rayos(g, t, alto, al = 1, n = 7, color = "210,240,255") {
  if (al <= 0.01) return;
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let r = 0; r < n; r++) {
    const x0 = -120 + r * (1320 / n) + 50 * Math.sin(t * 0.6 + r * 1.7), ra = g.createLinearGradient(0, 0, 0, alto);
    ra.addColorStop(0, `rgba(${color},${0.16 * al})`); ra.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = ra; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 70, 0); g.lineTo(x0 + 290, alto); g.lineTo(x0 + 160, alto); g.closePath(); g.fill();
  }
  g.restore();
}
