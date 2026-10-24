// «No es que lo hayas olvidado: es que tu cerebro nunca llegó a grabarlo.»
// Otro sitio: tu memoria como una película enorme, una tira de fotogramas iluminados por detrás que baja ondulando
// por la oscuridad. Se entra con un corte en «No».
// - «No es que lo hayas olvidado»: delante, un fotograma de un recuerdo de hace años (una tarta de cumpleaños); en
//   «olvidado» se destiñe despacio hasta quedar pálido: eso es olvidar, y aun así sigue ahí.
// - «es que tu cerebro»: la cámara baja siguiendo la película, pasando más recuerdos encendidos...
// - «nunca llegó a grabarlo»: ...hasta el tramo de anoche: fotogramas negros, sin nada, uno detrás de otro. En
//   «grabarlo», la luz del proyector los atraviesa y no sale nada.
import * as k from "#kit";
import { v } from "#voz";
import { escenaTarta, escenaPlaya, escenaMonte, escenaCopas, escenaBola, escenaManana } from "../mundo.js";

export const desde = (vz) => vz.frase(2).t("no");

const { suave: su, tramo: tr, mez, azar, proyecta, F } = k;
const f2 = v.frase(2);
const T0 = f2.inicio, Tolv = f2.t("olvidado"), Tes = f2.t("es", 2), Tnun = f2.t("nunca"), Tgra = f2.t("grabarlo"), Fin = f2.fin;

// ---------------------------------------------------------------- la película
export const FH = 0.92, W = 1.5, IW = 1.12, IH = 0.8;                 // alto de cada fotograma, ancho de la tira y de la imagen
export const C = (s) => [0.35 * Math.sin(s * 0.42), -s, 0.9 * Math.sin(s * 0.3 + 0.6)];
// lo que hay en cada fotograma: recuerdos, y en medio el tramo negro de anoche
export const S = 600; const cache = new Map();
export const imagenDe = (esc, id) => { if (!cache.has(id)) { const l = k.lienzo(S), c = l.getContext("2d"); esc(c, 1.1); cache.set(id, l); } return cache.get(id); };
const RECUERDOS = [["playa", escenaPlaya], ["monte", escenaMonte], ["tarta", escenaTarta], ["playa", escenaPlaya], ["monte", escenaMonte], ["copas", (g, t) => escenaCopas(g, t, 0.5)], ["bola", escenaBola]];
export const TARTA = 2, NEGRO0 = 7, NEGRO1 = 15, MANANA = 16;
export const FOTOS = [];
for (let i = -16; i < 32; i++) {
  if (i >= NEGRO0 && i <= NEGRO1) { FOTOS.push({ i, negro: true }); continue; }
  if (i === MANANA) { FOTOS.push({ i, id: "manana", esc: escenaManana }); continue; }
  const r = RECUERDOS[((i % RECUERDOS.length) + RECUERDOS.length) % RECUERDOS.length];
  FOTOS.push({ i, id: r[0], esc: r[1] });
}

// ---------------------------------------------------------------- la cámara: delante de la tira, bajando con ella
const sCam = k.claves([[T0, (TARTA + 0.5) * FH - 0.05], [Tes, (TARTA + 0.5) * FH + 0.05], [Tnun + 0.2, (NEGRO0 + 1.2) * FH], [Fin + 0.3, (NEGRO0 + 3.2) * FH]]);
const distCam = k.claves([[T0, 2.15], [Tolv + 0.3, 1.75], [Tes, 1.7], [Tnun + 0.2, 2.5], [Fin + 0.3, 2.7]]);
const camara = (t) => { const s = sCam(t), c = C(s), d = distCam(t); return k.mira([c[0] + 0.25, c[1] + 0.35, c[2] + d], [c[0], c[1] - 0.12, c[2]]); };

// Un cuadrilátero de la tira (de s0 a s1, de x0 a x1 a lo ancho), proyectado.
export const esquina = (cam, s, x) => { const c = C(s); return proyecta(cam, [c[0] + x, c[1], c[2]]); };
// Dibuja una imagen en el cuadrilátero A B C D (arriba izq, arriba der, abajo der, abajo izq) con dos triángulos afines.
export function imagenEn(g, img, A, B, Cc, D, sw, sh) {
  const tri = (p0, p1, p2, u0, u1, u2) => {
    g.save(); g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.closePath(); g.clip();
    const den = u0[0] * (u1[1] - u2[1]) + u1[0] * (u2[1] - u0[1]) + u2[0] * (u0[1] - u1[1]);
    const a = (p0.x * (u1[1] - u2[1]) + p1.x * (u2[1] - u0[1]) + p2.x * (u0[1] - u1[1])) / den;
    const b = (p0.y * (u1[1] - u2[1]) + p1.y * (u2[1] - u0[1]) + p2.y * (u0[1] - u1[1])) / den;
    const c = (p0.x * (u2[0] - u1[0]) + p1.x * (u0[0] - u2[0]) + p2.x * (u1[0] - u0[0])) / den;
    const d = (p0.y * (u2[0] - u1[0]) + p1.y * (u0[0] - u2[0]) + p2.y * (u1[0] - u0[0])) / den;
    const e = p0.x - a * u0[0] - c * u0[1], f = p0.y - b * u0[0] - d * u0[1];
    g.transform(a, b, c, d, e, f); g.drawImage(img, 0, 0, sw, sh); g.restore();
  };
  tri(A, B, Cc, [0, 0], [sw, 0], [sw, sh]);
  tri(A, Cc, D, [0, 0], [sw, sh], [0, sh]);
}

const azF = azar(606);
const POLVO = Array.from({ length: 500 }, () => ({ p: [(azF() - 0.5) * 12, -azF() * 45 + 15, -3 - azF() * 8], s: azF() }));

// Dibuja la tira vista desde cam, alrededor de s0 (hasta «alcance» de lejos). luzNegro(f): la luz que pasa por un
// fotograma negro; viejo(f): lo descolorido de un recuerdo; brillo(f): lo que brilla de más un recuerdo.
export function tira(g, cam, s0, { alcance = 7, luzNegro = () => 0, viejo = () => 0, brillo = () => 0 } = {}) {
  const lista = FOTOS.filter((f) => Math.abs((f.i + 0.5) * FH - s0) < alcance).sort((a, b) => Math.abs((b.i + 0.5) * FH - s0) - Math.abs((a.i + 0.5) * FH - s0));
  for (const f of lista) {
    const a = f.i * FH, b = a + FH;
    const A = esquina(cam, a, -W / 2), B = esquina(cam, a, W / 2), Cc = esquina(cam, b, W / 2), D = esquina(cam, b, -W / 2);
    if (!A || !B || !Cc || !D) continue;
    // la base de la película: negra, translúcida
    g.save();
    g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.lineTo(Cc.x, Cc.y); g.lineTo(D.x, D.y); g.closePath();
    g.fillStyle = "rgba(22,14,10,0.94)"; g.fill();
    g.restore();
    // las perforaciones de los lados, con la luz que pasa
    const grande = Math.hypot(B.x - A.x, B.y - A.y) > 120;
    for (let q = 0; q < 4; q++) for (const lado of [-1, 1]) {
      const ss = a + (q + 0.25) * (FH / 4), x0 = lado * (W / 2 - 0.13), x1 = lado * (W / 2 - 0.05);
      const p = [esquina(cam, ss, x0), esquina(cam, ss, x1), esquina(cam, ss + FH * 0.12, x1), esquina(cam, ss + FH * 0.12, x0)];
      if (p.some((z) => !z)) continue;
      g.save(); g.globalCompositeOperation = "lighter";
      g.beginPath(); g.moveTo(p[0].x, p[0].y); p.slice(1).forEach((z) => g.lineTo(z.x, z.y)); g.closePath();
      g.fillStyle = `rgba(255,215,160,${grande ? 0.75 : 0.5})`; g.fill(); g.restore();
    }
    // la imagen (iluminada por detrás) o el negro de anoche
    const m = (FH - IH) / 2, ia = esquina(cam, a + m, -IW / 2), ib = esquina(cam, a + m, IW / 2), ic = esquina(cam, b - m, IW / 2), id = esquina(cam, b - m, -IW / 2);
    if (!ia || !ib || !ic || !id) continue;
    const cx = (ia.x + ic.x) / 2, cy = (ia.y + ic.y) / 2, tam = Math.hypot(ib.x - ia.x, ib.y - ia.y);
    if (f.negro) {
      g.save(); g.beginPath(); g.moveTo(ia.x, ia.y); g.lineTo(ib.x, ib.y); g.lineTo(ic.x, ic.y); g.lineTo(id.x, id.y); g.closePath();
      g.fillStyle = "#020102"; g.fill();
      const luz = luzNegro(f);
      g.strokeStyle = `rgba(255,220,180,${0.15 + 0.8 * luz})`; g.lineWidth = 2 + 4 * luz; g.stroke();
      g.restore();
      if (luz > 0.02) { k.brillo(g, cx, cy - tam * 0.45, tam * 0.9, "255,225,190", 0.5 * luz); k.brillo(g, cx, cy + tam * 0.45, tam * 0.9, "255,225,190", 0.5 * luz); }
    } else {
      const img = imagenDe(f.esc, f.id), vj = viejo(f);
      g.save();
      imagenEn(g, img, ia, ib, ic, id, S, S * (IH / IW));
      if (vj > 0) {
        g.beginPath(); g.moveTo(ia.x, ia.y); g.lineTo(ib.x, ib.y); g.lineTo(ic.x, ic.y); g.lineTo(id.x, id.y); g.closePath();
        g.globalCompositeOperation = "saturation"; g.fillStyle = `rgba(128,128,128,${0.9 * vj})`; g.fill();
        g.globalCompositeOperation = "source-over"; g.fillStyle = `rgba(235,220,195,${0.62 * vj})`; g.fill();
      }
      g.restore();
      // la luz que atraviesa la imagen
      k.brillo(g, cx, cy, tam * 1.6, "255,210,150", 0.22 * (1 - 0.6 * vj) + brillo(f));
    }
  }
}
// el fondo: oscuro, con la luz cálida del proyector detrás de la película y polvo flotando
export function fondoPelicula(g, cam, s0) {
  g.fillStyle = "#050306"; g.fillRect(0, 0, 1080, 1920);
  const sc = C(s0), L = proyecta(cam, [sc[0], sc[1], sc[2] - 3]);
  if (L) { const lg = g.createRadialGradient(L.x, L.y, 50, L.x, L.y, 1300); lg.addColorStop(0, "rgba(255,190,120,0.35)"); lg.addColorStop(1, "rgba(255,190,120,0)"); g.fillStyle = lg; g.fillRect(0, 0, 1080, 1920); }
  for (const q of POLVO) { const P = proyecta(cam, q.p); if (P) k.brillo(g, P.x, P.y, (F * 0.05) / P.z, "255,210,160", 0.5 * q.s); }
}

export function dibuja(g, t) {
  const cam = camara(t), s0 = sCam(t);
  fondoPelicula(g, cam, s0);
  tira(g, cam, s0, {
    luzNegro: (f) => k.pulso(t, Tgra - 0.1 + (f.i - NEGRO0) * 0.07, 0.16),
    viejo: (f) => (f.i === TARTA ? su(tr(t, Tolv - 0.1, Tes)) : 0),
  });
  const vg = g.createLinearGradient(0, 180, 0, 640); vg.addColorStop(0, "rgba(5,3,6,0.6)"); vg.addColorStop(1, "rgba(5,3,6,0)");
  g.fillStyle = vg; g.fillRect(0, 0, 1080, 640);
}
