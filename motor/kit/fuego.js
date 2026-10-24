// Fuego, vapor y estallidos: lenguas de llama que tiemblan, una nube que revienta y sus trozos que salen volando.
import { azar, mezRgb } from "./base.js";
import { roca } from "./cuerpos.js";
import { brillo } from "./luz.js";

// Una lengua de llama que sale de (x, y) hacia arriba, de alto h y ancho w, temblando con el tiempo t.
// pie y punta: colores "r,g,b" de su base y de su cuerpo. fase: para que cada lengua tiemble distinta.
export function lengua(g, x, y, h, w, t, fase, pie = "60,110,255", punta = "120,170,255") {
  const tiembla = 0.85 + 0.25 * Math.sin(t * 17 + fase) + 0.12 * Math.sin(t * 29 + fase * 2), alto = h * tiembla;
  g.save();
  g.globalCompositeOperation = "lighter";
  const lg = g.createLinearGradient(x, y, x, y - alto);
  lg.addColorStop(0, `rgba(${pie},0.95)`); lg.addColorStop(0.35, `rgba(${punta},0.8)`); lg.addColorStop(1, `rgba(${punta},0)`);
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x - w * 0.7, y - alto * 0.5, x + 4 * Math.sin(t * 9 + fase), y - alto); g.quadraticCurveTo(x + w * 0.7, y - alto * 0.5, x + w / 2, y); g.closePath(); g.fill();
  g.restore();
}

// Un anillo de llamas (un fuego de cocina) de centro (cx, cy) y radios rx, ry, visto un poco desde arriba.
// naranja de 0 a 1: de la llama azul del gas a la naranja (sal, sodio, madera). delante: true dibuja las lenguas de
// delante y false las de detrás (dibuja las de detrás, luego el quemador y luego las de delante).
export function anilloDeLlamas(g, cx, cy, rx, ry, t, naranja = 0, delante = true, n = 30, alto = 105) {
  const az = azar(73);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, f = az() * 10, k = 0.8 + az() * 0.4;
    if ((Math.sin(a) > 0) !== delante) continue;
    const pie = mezRgb("60,110,255", "255,140,40", naranja), punta = mezRgb("120,170,255", "255,196,90", naranja);
    lengua(g, cx + rx * Math.cos(a), cy + ry * Math.sin(a), (alto + 70 * naranja) * k, 30 + 14 * naranja, t, f, pie, punta);
  }
}

// Algo que revienta en (x, y), u segundos después: un fogonazo, una nube de n bocanadas que se abre y cae un poco, y
// trozos que salen volando. color: el de la nube (un nombre de COLORES). escala: lo grande que es (1 = media pantalla).
// trozos: cuántos fragmentos de roca salen (0, ninguno).
export function estallido(g, x, y, u, color = "sodio", escala = 1, semilla = 12, n = 150, trozos = 9) {
  if (u < 0) return;
  const az = azar(semilla);
  brillo(g, x, y, 2400 * escala * (0.4 + u), color, 1.3 * Math.exp(-u * 2.2));
  for (let i = 0; i < n; i++) {
    const a = az() * Math.PI * 2, v = (120 + az() * 620) * escala, s = (20 + az() * 70) * escala, k = az();
    const e = (1 - Math.exp(-u * 2.2)) / 2.2;
    const px = x + Math.cos(a) * v * 1.4 * e, py = y + (Math.sin(a) * v * 0.8 + 120 * escala) * 1.4 * e + 140 * escala * u * u;
    brillo(g, px, py, s * 1.5 * (1 + u), color, (0.95 - 0.45 * k) * Math.exp(-u * 0.8));
  }
  for (let i = 0; i < trozos; i++) {
    const b = az() * Math.PI * 2, w = (260 + az() * 380) * escala, s = (40 + az() * 60) * escala, gira = (az() - 0.5) * 8;
    const e = 1 - Math.exp(-u * 3), rr = s * Math.exp(-u * 1.8);
    if (rr > 2) roca(g, x + (Math.cos(b) * w * e) / 3, y + (Math.sin(b) * w * e) / 3, rr, gira * u, 400 + i, 0, 1, Math.exp(-u * 1.2));
  }
}
