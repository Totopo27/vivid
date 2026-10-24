// «...al día siguiente no te acuerdas de nada?»
// Otro tiempo: la mañana. Se entra con un corte en «al».
// - «al día siguiente»: un fogonazo de sol blanco; detrás, un cuarto a oscuras con la luz dura de la mañana entrando
//   por la persiana, y flotando delante, el recuerdo de anoche (la discoteca, que aún se mueve).
// - «no te acuerdas»: el recuerdo se agrieta desde el centro, como un cristal.
// - «de nada»: revienta en mil trozos que salen hacia la cámara y caen; queda el cuarto vacío, quieto, antes del corte.
import * as k from "#kit";
import { v } from "#voz";
import { fiesta } from "../fiesta.js";

export const desde = "al";

const { suave: su, tramo: tr, mez, azar } = k;
const f1 = v.frase(1);
const Tal = f1.t("al"), Tsig = f1.t("siguiente"), Tno = f1.t("no"), Tacu = f1.t("acuerdas"), Tnada = f1.t("nada");
export const rompe = Tnada + 0.04;

// ---------------------------------------------------------------- el recuerdo: un cristal con la fiesta dentro
const PW = 840, PH = 980, PX = 540, PY = 1060;
const imagen = k.lienzo(1080, 1920);
const azS = azar(404);
// los trozos: una rejilla torcida partida en triángulos
const NX = 7, NY = 9, puntos = [];
for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
  const borde = i === 0 || j === 0 || i === NX || j === NY;
  puntos.push([-PW / 2 + (i / NX) * PW + (borde ? 0 : (azS() - 0.5) * PW / NX * 0.7), -PH / 2 + (j / NY) * PH + (borde ? 0 : (azS() - 0.5) * PH / NY * 0.7)]);
}
const P = (i, j) => puntos[j * (NX + 1) + i];
const IMPACTO = [40, -60];
const trozos = [];
for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
  const tris = (i + j) % 2 ? [[P(i, j), P(i + 1, j), P(i + 1, j + 1)], [P(i, j), P(i + 1, j + 1), P(i, j + 1)]] : [[P(i, j), P(i + 1, j), P(i, j + 1)], [P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)]];
  for (const tri of tris) {
    const c = [(tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3];
    const dx = c[0] - IMPACTO[0], dy = c[1] - IMPACTO[1], d = Math.hypot(dx, dy) || 1;
    trozos.push({ tri: tri.map((p) => [p[0] - c[0], p[1] - c[1]]), c, dir: [dx / d, dy / d], vel: 500 + azS() * 900 + 400 * (1 - d / 800), gira: (azS() - 0.5) * 9, hacia: 0.6 + azS() * 2.2, retraso: (d / 900) * 0.08 });
  }
}
// las grietas: líneas quebradas desde el impacto
const grietas = Array.from({ length: 14 }, (_, q) => {
  let x = IMPACTO[0], y = IMPACTO[1], a = (q / 14) * 6.2832 + azS() * 0.4;
  const l = [[x, y]];
  for (let s = 0; s < 9; s++) { a += (azS() - 0.5) * 0.7; const L = 50 + azS() * 70; x += Math.cos(a) * L; y += Math.sin(a) * L; l.push([x, y]); }
  return { l, t0: azS() < 0.5 ? Tno : Tacu };
});

// ---------------------------------------------------------------- el cuarto por la mañana
const azM = azar(505);
const MOTAS = Array.from({ length: 160 }, () => ({ x: azM() * 1080, y: azM() * 1920, s: 1.5 + azM() * 3, f: azM() * 6, v: 10 + azM() * 30 }));
function cuarto(g, t) {
  const bg = g.createLinearGradient(0, 0, 1080, 1920);
  bg.addColorStop(0, "#2a2018"); bg.addColorStop(1, "#0d0906");
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920);
  g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.5; g.drawImage(k.manchas, 0, 0, 1080, 1920); g.restore();
  // la luz de la persiana: bandas inclinadas, duras
  g.save(); g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 9; i++) {
    const y0 = -300 + i * 190 + Math.sin(t * 0.5) * 6;
    const gr = g.createLinearGradient(0, y0, 1080, y0 + 600);
    gr.addColorStop(0, "rgba(255,214,150,0.32)"); gr.addColorStop(1, "rgba(255,190,120,0.04)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(-100, y0); g.lineTo(1180, y0 + 560); g.lineTo(1180, y0 + 650); g.lineTo(-100, y0 + 90); g.closePath(); g.fill();
  }
  g.restore();
  for (const m of MOTAS) { const y = (m.y - t * m.v + 1920) % 1920; g.fillStyle = `rgba(255,236,200,${0.25 + 0.25 * Math.sin(t * 2 + m.f)})`; g.fillRect(m.x + Math.sin(t + m.f) * 10, y, m.s, m.s); }
  k.brillo(g, 980, 120, 1300, "255,220,160", 0.5);
}

export function dibuja(g, t) {
  cuarto(g, t);
  const u = t - rompe;
  // la fiesta, viva dentro del cristal (se dibuja aparte y se recorta)
  if (u < 0.75) {
    const c = imagen.getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
    fiesta(c, Math.min(t, rompe));
  }
  const flota = Math.sin(t * 1.1) * 0.02, esc = 1 + 0.05 * su(tr(t, Tal, rompe));
  if (u < 0) {
    g.save(); g.translate(PX, PY); g.rotate(flota); g.scale(esc, esc);
    // un poco apagada: es un recuerdo
    g.shadowColor = "rgba(0,0,0,0.7)"; g.shadowBlur = 60; g.shadowOffsetY = 30;
    g.fillStyle = "#000"; g.fillRect(-PW / 2, -PH / 2, PW, PH);
    g.shadowColor = "rgba(0,0,0,0)";
    g.drawImage(imagen, 120, 380, PW, PH, -PW / 2, -PH / 2, PW, PH);
    g.fillStyle = "rgba(255,230,200,0.08)"; g.fillRect(-PW / 2, -PH / 2, PW, PH);
    g.strokeStyle = "rgba(255,255,255,0.75)"; g.lineWidth = 6; g.strokeRect(-PW / 2, -PH / 2, PW, PH);
    // el reflejo del cristal
    g.save(); g.globalCompositeOperation = "screen";
    const rg = g.createLinearGradient(-PW / 2, -PH / 2, PW / 2, PH / 2); rg.addColorStop(0.3, "rgba(255,255,255,0)"); rg.addColorStop(0.42, "rgba(255,255,255,0.18)"); rg.addColorStop(0.5, "rgba(255,255,255,0)");
    g.fillStyle = rg; g.fillRect(-PW / 2, -PH / 2, PW, PH); g.restore();
    // las grietas, que crecen (dentro del cristal)
    g.save(); g.beginPath(); g.rect(-PW / 2, -PH / 2, PW, PH); g.clip(); g.lineCap = "round"; g.lineJoin = "round";
    for (const gr of grietas) {
      const cr = su(tr(t, gr.t0 - 0.05, gr.t0 + 0.35)) * (1 + 0.6 * su(tr(t, Tacu, Tnada)));
      if (cr <= 0) continue;
      const n = Math.max(1, Math.round(Math.min(1, cr) * (gr.l.length - 1)));
      g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 4;
      g.beginPath(); g.moveTo(gr.l[0][0], gr.l[0][1]); for (let q = 1; q <= n; q++) g.lineTo(gr.l[q][0], gr.l[q][1]); g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.25)"; g.lineWidth = 14; g.stroke();
    }
    g.restore();
    const golpe = Math.max(k.pulso(t, Tno + 0.05, 0.1), k.pulso(t, Tacu + 0.05, 0.1));
    k.brillo(g, IMPACTO[0], IMPACTO[1], 500, "255,255,255", golpe);
    g.restore();
  } else if (u < 0.75) {
    // revienta: cada trozo sale hacia fuera y hacia la cámara, gira y cae
    k.brillo(g, PX + IMPACTO[0], PY + IMPACTO[1], 2400, "255,250,240", 1.2 * Math.exp(-u * 7));
    for (const tz of trozos) {
      const w = Math.max(0, u - tz.retraso);
      const s = esc * (1 + tz.hacia * w * 1.6), x = PX + (tz.c[0] * s) + tz.dir[0] * tz.vel * w, y = PY + (tz.c[1] * s) + tz.dir[1] * tz.vel * w + 2400 * w * w;
      const al = Math.max(0, 1 - w * 1.7);
      if (al <= 0) continue;
      g.save(); g.translate(x, y); g.rotate(flota + tz.gira * w); g.scale(s, s); g.globalAlpha = al;
      g.beginPath(); g.moveTo(tz.tri[0][0], tz.tri[0][1]); g.lineTo(tz.tri[1][0], tz.tri[1][1]); g.lineTo(tz.tri[2][0], tz.tri[2][1]); g.closePath();
      g.save(); g.clip();
      g.drawImage(imagen, 120 + PW / 2 + tz.c[0] - 200, 380 + PH / 2 + tz.c[1] - 200, 400, 400, -200, -200, 400, 400);
      g.fillStyle = "rgba(255,255,255,0.12)"; g.fill();
      g.restore();
      g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 3 / s; g.stroke();
      g.restore();
    }
  }
  // el fogonazo de la mañana al entrar
  const f = 1 - su(tr(t, Tal, Tal + 0.45));
  if (f > 0) { g.fillStyle = `rgba(255,248,235,${0.95 * f})`; g.fillRect(0, 0, 1080, 1920); }
  const vg = g.createLinearGradient(0, 180, 0, 640); vg.addColorStop(0, "rgba(10,6,4,0.5)"); vg.addColorStop(1, "rgba(10,6,4,0)");
  g.fillStyle = vg; g.fillRect(0, 0, 1080, 640);
}

export const momentos = { sol: Tal, grietas: [Tno, Tacu], rompe };
