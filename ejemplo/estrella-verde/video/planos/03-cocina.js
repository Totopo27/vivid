// «...lo mismo que tienes en el salero.»
// Otro sitio: una cocina. Se entra con un corte en «mismo», cuando el vapor naranja ya se ha apagado, y se sale con
// otro en «aire», cuando aquí ya ha pasado todo. Desde el primer fotograma se ve lo que es: el fuego azul encendido y el
// salero entrando.
// - «mismo»: el salero llega desde arriba, frenando, y empieza a sacudirse; la sal cae sobre la llama azul.
// - «que tienes en el salero»: donde cae la sal, la llama se vuelve naranja, del mismo color que el vapor de antes.
//   En «salero» deja de sacudirse; los últimos granos caen y la llama se queda naranja hasta el corte.
import * as k from "#kit";
import { v } from "#voz";
import { salero } from "../mundo.js";

export const desde = "mismo";

const { suave: su, tramo: tr, mez: mz } = k;
const f7 = v.frase(7), Ttienes = f7.t("tienes"), Tsalero = f7.t("salero");
export const corte = f7.t("mismo") - 0.04;               // cuándo se entra (lo usa el plano de antes y el sonido)
const D0 = corte, Tmismo = corte + 0.15;                  // se sacude en cuanto ha llegado
const az = k.azar(12);
// la sal: granos que salen de los agujeros mientras se sacude (hasta 0,25 s antes de «salero», para que acaben de caer)
const granos = [];
for (let i = 0; i < 260; i++) granos.push({ t0: az(), dx: (az() - 0.5) * 70, vx: (az() - 0.5) * 120, s: 3 + az() * 4 });
const nace = (q) => mz(Tmismo, Tsalero - 0.25, q.t0);
const CX = 540, CY = 1250, RX = 290, RY = 92;           // el quemador

// cuándo cae cada grano en la llama, para el sonido
export const sacudidas = (() => { const s = []; for (let t = Tmismo + 0.0413; t < Tsalero; t += (2 * Math.PI) / 38 * 2) s.push(t); return s; })();

export function dibuja(g, t) {
  // la encimera, oscura, con el brillo de la llama (azul, y naranja cuando cae la sal)
  const naranja = su(tr(t, Tmismo + 0.35, Ttienes + 0.15));
  g.fillStyle = "#0d0b0a"; g.fillRect(0, 0, 1080, 1920);
  const bg = g.createRadialGradient(CX, CY, 50, CX, CY, 900);
  bg.addColorStop(0, `rgba(${k.mezRgb("70,110,200", "255,150,60", naranja)},${0.22 + 0.25 * naranja})`); bg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920);
  // las llamas de detrás, el quemador de metal y las de delante
  k.anilloDeLlamas(g, CX, CY, RX, RY, t, naranja, false);
  const qg = g.createLinearGradient(0, CY - RY, 0, CY + RY);
  qg.addColorStop(0, "#3a3633"); qg.addColorStop(0.5, "#1c1a18"); qg.addColorStop(1, "#4a4541");
  g.fillStyle = qg; g.beginPath(); g.ellipse(CX, CY, RX - 16, RY - 8, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#0b0a09"; g.beginPath(); g.ellipse(CX, CY - 6, RX * 0.62, RY * 0.55, 0, 0, Math.PI * 2); g.fill();
  k.anilloDeLlamas(g, CX, CY, RX, RY, t, naranja, true);
  // el salero: llega en «lo» (ya asomando en el primer fotograma), se sacude desde «mismo» y para en «salero»
  const llega = k.entra(tr(t, D0 - 0.12, Tmismo + 0.1));
  const sac = tr(t, Tmismo, Tmismo + 0.12) * (1 - tr(t, Tsalero - 0.15, Tsalero + 0.1));
  const sx = mz(1250, 700, llega), sy = mz(260, 600, llega), ang = 2.55 + 0.16 * Math.sin((t - Tmismo) * 38) * sac;
  const tapa = [sx + Math.sin(ang) * 215, sy - Math.cos(ang) * 215];
  // los granos que caen de la tapa y, donde caen, chispas naranjas
  for (const q of granos) {
    const u = t - nace(q);
    if (u < 0 || u > 0.9) continue;
    const gx = tapa[0] + q.dx * 0.4 + q.vx * u, gy = tapa[1] + 320 * u + 1800 * u * u;
    if (gy > CY - 40) continue;
    g.fillStyle = "rgba(255,255,255,0.92)"; g.fillRect(gx, gy, q.s, q.s);
  }
  granos.forEach((q, i) => {
    if (i % 3) return;
    const u = t - nace(q), cae = (-320 + Math.sqrt(320 * 320 + 4 * 1800 * Math.max(0, CY - 40 - tapa[1]))) / 3600;
    if (u < cae || u > cae + 0.25) return;
    k.brillo(g, tapa[0] + q.dx * 0.4 + q.vx * cae, CY - 40 + q.dx * 0.3, 90, "sodio", 0.9 * (1 - (u - cae) / 0.25));
  });
  salero(g, sx, sy, ang);
}
