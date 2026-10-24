// «...y apaga sus neuronas. Tú sigues hablando y riendo, porque esos segundos funcionan, pero nada se copia.»
// Otro sitio: dentro del hipocampo, entre sus neuronas, con la niebla ámbar del alcohol. Se entra con un corte en «y».
// - «y apaga sus neuronas»: las neuronas, encendidas en oro y pasándose señales, se van apagando una a una, con un
//   parpadeo, hasta quedar grises; el piloto rojo de grabación se apaga con la última.
// - «Tú sigues hablando y riendo»: siguen llegando burbujas con momentos de la fiesta, entre las neuronas apagadas.
// - «esos segundos funcionan»: se quedan flotando con su cuenta atrás, como antes.
// - «pero nada se copia»: un haz intenta salir hacia arriba y se deshace en chispas a medio camino; las burbujas se
//   apagan y no queda nada.
import * as k from "#kit";
import { v } from "#voz";
import { tejido, neurona } from "../neuronas.js";
import { burbuja, imgs } from "./04-cerebro.js";

export const desde = (vz) => vz.frase(5).t("y", 2) - 0.02;

const { suave: su, tramo: tr, mez, mezV, azar, proyecta, F } = k;
const f5 = v.frase(5), f6 = v.frase(6);
const T0 = f5.t("y", 2) - 0.02, Tapa = f5.t("apaga"), Tneu = f5.t("neuronas"), Fin5 = f5.fin;
const Thab = f6.t("hablando"), Trie = f6.t("riendo"), Tseg = f6.t("segundos"), Tfun = f6.t("funcionan"), Tpero = f6.t("pero"), Tnada = f6.t("nada"), Tcop = f6.t("copia"), Fin = f6.fin;

// ---------------------------------------------------------------- las neuronas
const az = azar(4242);
const NEU = Array.from({ length: 34 }, (_, i) => {
  const cerca = i < 9;
  const p = cerca ? [(az() - 0.5) * 2.4, (az() - 0.5) * 3.6, -0.5 - az() * 1.5] : [(az() - 0.5) * 7, (az() - 0.5) * 10, -2.5 - az() * 6];
  return { p, forma: Math.floor(az() * 7), ang: az() * 6.28, apaga: Tapa + 0.05 + az() * (Tneu + 0.45 - Tapa), f: az() * 6 };
});
const ultima = Math.max(...NEU.map((n) => n.apaga));
const ENL = [];
NEU.forEach((a, i) => { NEU.forEach((b, j) => { if (j > i && k.largo(k.res(a.p, b.p)) < 1.9) ENL.push([i, j, az()]); }); });
// lo que brilla cada una: oro encendida; al apagarse, un parpadeo y gris
const luzDe = (n, t) => { if (t < n.apaga) return 1; const w = t - n.apaga; return w < 0.25 ? 0.5 + 0.5 * Math.sin(w * 60) * (1 - w / 0.25) : 0; };

// ---------------------------------------------------------------- los momentos que llegan
const NIEBLA = k.tenir(k.manchas, "#ff9a40");
const COLM = ["255,190,90", "120,200,255", "255,120,190"];
const LLEGAN = [0, 1, 2].map((i) => ({ i, t: Thab - 0.2 + i * 0.3, de: [-2.5 + i * 2.5, -3.2 + i * 0.4, 0.4], a: [-0.65 + i * 0.65, 0.25 - (i % 2) * 0.55, -0.9] }));
const queda = (m, t) => 1 - tr(t, m.t + 0.6, Tcop + 0.2);
const Tintenta = Tpero + 0.05;

const cam = k.ruta([[T0, { pos: [0.1, 0, 2.6], mira: [0, 0, -1] }], [Fin5, { pos: [0, 0.05, 2.3], mira: [0, 0, -1] }], [Tpero, { pos: [0, 0.2, 2.5], mira: [0, 0.3, -1] }], [Fin - 0.35, { pos: [0, 0.6, 2.7], mira: [0, 1.2, -1] }]]);

export function dibuja(g, t) {
  const c = cam(t);
  tejido(g, c, 0.8);
  // la niebla ámbar del alcohol
  g.save(); g.globalCompositeOperation = "lighter";
  const ag = g.createRadialGradient(540, 1000, 100, 540, 1000, 1300); ag.addColorStop(0, "rgba(255,140,40,0.12)"); ag.addColorStop(1, "rgba(255,110,20,0.03)");
  g.fillStyle = ag; g.fillRect(0, 0, 1080, 1920);
  g.globalAlpha = 0.1; g.drawImage(NIEBLA, -200 + Math.sin(Math.min(t, Fin - 0.35) * 0.5) * 80, -200, 1500, 2400);
  g.restore();
  // los filamentos entre neuronas y sus señales (mientras están encendidas)
  const Ps = NEU.map((n) => proyecta(c, n.p));
  g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
  for (const [i, j, f] of ENL) {
    const A = Ps[i], B = Ps[j]; if (!A || !B) continue;
    const l = Math.min(luzDe(NEU[i], t), luzDe(NEU[j], t)), w = Math.max(1.5, (F * 0.012) / ((A.z + B.z) / 2));
    g.strokeStyle = `rgba(${l > 0.05 ? "255,200,110" : "130,140,180"},${0.12 + 0.45 * l})`; g.lineWidth = w;
    g.beginPath(); g.moveTo(A.x, A.y); g.quadraticCurveTo((A.x + B.x) / 2 + (B.y - A.y) * 0.15, (A.y + B.y) / 2 - (B.x - A.x) * 0.15, B.x, B.y); g.stroke();
    if (l > 0.3) { const u = (t * 1.3 + f * 5) % 1, x = mez(A.x, B.x, u), y = mez(A.y, B.y, u); g.restore(); k.brillo(g, x, y, w * 12, "255,220,150", l); g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round"; }
  }
  g.restore();
  // las neuronas, de lejos a cerca
  const cosas = NEU.map((n, i) => ({ z: Ps[i] ? Ps[i].z : 0, dibuja: () => { if (Ps[i]) neurona(g, Ps[i], n.forma, n.ang, "255,196,100", luzDe(n, t), 1, 1.6); } }));
  k.deLejosACerca(cosas);
  // el piloto rojo: encendido hasta que se apaga la última
  const on = 1 - su(tr(t, ultima, ultima + 0.15)), pv = 1 - su(tr(t, Thab - 0.3, Thab));
  if (pv > 0) {
    const px = 790, py = 640, r = 26;
    g.save(); g.globalAlpha = pv;
    if (on > 0.01) k.brillo(g, px, py, r * 8, "255,40,50", 0.8 * on * (0.8 + 0.2 * Math.sin(t * 8)));
    g.fillStyle = `rgb(${k.mezRgb("70,55,60", "255,45,55", on)})`; g.beginPath(); g.arc(px, py, r, 0, 6.2832); g.fill();
    g.font = "800 44px Figtree"; g.textBaseline = "middle"; g.fillStyle = `rgb(${k.mezRgb("150,140,145", "255,232,232", on)})`; g.fillText("REC", px + 40, py + 2);
    g.restore();
  }
  // los momentos que siguen llegando
  for (const m of LLEGAN) {
    if (t < m.t) continue;
    const u = k.entra(tr(t, m.t, m.t + 0.6)), X = mezV(m.de, m.a, u), P = proyecta(c, [X[0] + 0.03 * Math.sin(t * 2 + m.i), X[1] + 0.04 * Math.sin(t * 2.5 + m.i), X[2]]);
    if (!P) continue;
    const resto = queda(m, t), al = Math.min(1, (t - m.t) / 0.2) * Math.max(0, resto * 1.4 - 0.05);
    burbuja(g, imgs[m.i], P.x, P.y, (F * 0.28) / P.z, COLM[m.i], Math.min(1, al), resto);
  }
  // «pero nada se copia»: un haz sale hacia arriba y se deshace a medio camino
  const w = t - Tintenta;
  if (w > 0 && w < 1.3) {
    const A = proyecta(c, [0, -0.1, -0.9]), sube = k.entra(Math.min(1, w / 0.35)), y1 = mez(A.y, A.y - 700, sube), al = 1 - su(tr(w, 0.35, 0.8));
    g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
    g.strokeStyle = `rgba(255,220,150,${0.35 * al})`; g.lineWidth = 50; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(A.x, y1); g.stroke();
    g.strokeStyle = `rgba(255,255,255,${0.9 * al})`; g.lineWidth = 8; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(A.x, y1); g.stroke();
    g.restore();
    // las chispas en que se deshace
    const ch = tr(w, 0.3, 1.2), azc = azar(77);
    if (ch > 0) for (let i = 0; i < 30; i++) { const a = azc() * 6.2832, vv = 80 + azc() * 260, x = A.x + Math.cos(a) * vv * ch, y = A.y - 700 + Math.sin(a) * vv * ch + 300 * ch * ch; k.brillo(g, x, y, 30, "255,210,140", 1 - ch); }
  }
  const vg = g.createLinearGradient(0, 180, 0, 640); vg.addColorStop(0, "rgba(6,5,20,0.6)"); vg.addColorStop(1, "rgba(6,5,20,0)");
  g.fillStyle = vg; g.fillRect(0, 0, 1080, 640);
}

export const momentos = { apagan: NEU.slice(0, 9).map((n) => n.apaga), llegadas: LLEGAN.map((m) => m.t), intenta: Tintenta };
