// «Dentro de tu cabeza tienes una grabadora: el hipocampo. Lo que vives aguanta solo unos segundos, hasta que él lo
// copia a la memoria que dura años.»
// Otro sitio: tu cerebro por dentro, hecho de luz (miles de puntos que dibujan sus pliegues, con chispas que corren).
// Se entra con un corte en «Dentro». Una sola cámara.
// - «Dentro de tu cabeza»: la silueta de una cabeza de perfil, y dentro el cerebro brillando; la cámara se acerca y
//   la cabeza se desvanece.
// - «tienes una grabadora»: gira y entra; en el fondo se enciende en oro una pieza curvada, y a su lado un piloto
//   rojo de grabación. «el hipocampo»: su nombre.
// - «Lo que vives»: llegan burbujas con momentos dentro (unas copas, la bola de la discoteca, la playa) y se quedan
//   flotando a su alrededor, cada una con su cuenta atrás: «aguanta solo unos segundos», y se van apagando.
// - «hasta que él lo copia»: el hipocampo late y dispara un haz hacia arriba con la burbuja dentro; la cámara sube
//   con él y en «memoria que dura años» llega a la corteza, donde se enciende una mancha de su color, que se queda.
import * as k from "#kit";
import { v } from "#voz";
import { escenaCopas, escenaBola, escenaPlaya } from "../mundo.js";

export const desde = "dentro";

const { suave: su, tramo: tr, mez, mezV, azar, proyecta, F } = k;
const f3 = v.frase(3), f4 = v.frase(4);
const T0 = f3.inicio, Tcab = f3.t("cabeza"), Ttie = f3.t("tienes"), Tgra = f3.t("grabadora"), Thip = f3.t("hipocampo");
const Tviv = f4.t("vives"), Tagu = f4.t("aguanta"), Tseg = f4.t("segundos"), Tcop = f4.t("copia"), Tmem = f4.t("memoria"), Tano = f4.t("anos"), Fin = f4.fin;

// ---------------------------------------------------------------- el cerebro de luz
// x: de delante (-) a atrás (+); y: arriba; z: de un lado a otro.
const az = azar(808), PUNTOS = [];
const pliegue = (x, y, z) => Math.sin(9 * x + 3 * Math.sin(5 * z + 1)) * Math.sin(8 * y + 2 * Math.sin(6 * x)) + 0.5 * Math.sin(13 * z + 4 * y);
const dentroCerebro = (x, y, z) => {
  const e = (x / 1.0) ** 2 + (y / 0.72) ** 2 + (z / 0.82) ** 2;
  if (e > 1 || Math.abs(z) < 0.035) return -1;
  const suelo = x < 0.35 && x > -0.75 ? -0.58 : -0.32;           // los lóbulos temporales bajan más
  if (y < suelo) return -1;
  return e;
};
while (PUNTOS.length < 13000) {
  const x = (az() - 0.5) * 2.1, y = (az() - 0.5) * 1.5, z = (az() - 0.5) * 1.7, e = dentroCerebro(x, y, z);
  if (e < 0) continue;
  const sup = e > 0.78 || y < -0.28;
  if (!sup && az() > 0.04) continue;
  if (sup && Math.abs(pliegue(x, y, z)) > 0.5) continue;      // así salen los pliegues, como surcos
  PUNTOS.push({ p: [x, y, z], b: 0.5 + az() * 0.5, c: az() < 0.75 ? "255,140,200" : "170,140,255" });
}
// el cerebelo (rayado) y el tronco
for (let i = 0; i < 900; i++) {
  const u = az() * 6.2832, w = (az() - 0.5) * Math.PI, x = 0.62 + 0.3 * Math.cos(w) * Math.cos(u), y = -0.5 + 0.19 * Math.sin(w), z = 0.52 * Math.cos(w) * Math.sin(u);
  if (Math.abs(Math.sin(y * 70)) > 0.5) continue;
  PUNTOS.push({ p: [x, y, z], b: 0.6, c: "255,170,190" });
}
for (let i = 0; i < 350; i++) { const u = az(), a = az() * 6.2832; PUNTOS.push({ p: [0.28 + 0.12 * u + 0.1 * Math.cos(a), -0.4 - 0.75 * u, 0.1 * Math.sin(a)], b: 0.5, c: "255,170,190" }); }
// el hipocampo: una pieza curvada en cada lado, por dentro y abajo
const curvaHipo = (u, lado) => [-0.38 + 0.78 * u, -0.42 + 0.42 * u * u + 0.08 * Math.sin(u * 3), lado * (0.3 - 0.05 * u)];
const HIPO = [];
for (const lado of [-1, 1]) for (let i = 0; i < 520; i++) {
  const u = az(), c = curvaHipo(u, lado), r = 0.075 * (1 - 0.5 * u) * Math.sqrt(az()), a = az() * 6.2832;
  HIPO.push({ p: [c[0], c[1] + r * Math.cos(a), c[2] + r * Math.sin(a)], u, lado });
}
const HC = curvaHipo(0.45, 1);                                    // el que se ve (el de este lado)
// las chispas: pulsos que corren entre puntos cercanos de la corteza
const CHISPAS = [];
for (let i = 0; i < 70; i++) { const a = PUNTOS[Math.floor(az() * 12000)], b = PUNTOS[Math.floor(az() * 12000)]; if (k.largo(k.res(a.p, b.p)) < 0.5) CHISPAS.push({ a: a.p, b: b.p, f: az(), v: 0.6 + az() }); }

// ---------------------------------------------------------------- los momentos que se viven y el que se copia
const S = 600;
export const imgs = [["copas", (g) => escenaCopas(g, 1, 0.3)], ["bola", (g) => escenaBola(g, 1.2)], ["playa", (g) => escenaPlaya(g, 1)]].map(([id, f]) => { const l = k.lienzo(S), c = l.getContext("2d"); f(c); return l; });
const COLM = ["255,190,90", "120,200,255", "255,120,190"];
const MOMENTOS = [0, 1, 2].map((i) => ({ i, llega: Tviv - 0.15 + i * 0.32, desde: [-1.6 + i * 1.4, 0.9 - i * 0.5, 1.6], orb: [HC[0] - 0.42 + i * 0.27, HC[1] + 0.22 + (i === 1 ? 0.12 : 0), HC[2] + 0.28], img: imgs[i], c: COLM[i] }));
const COPIADO = 1;                                                 // el de la bola es el que se copia
const ARRIBA = [-0.15, 0.62, 0.42];                                // dónde se guarda en la corteza
const Tdispara = Tcop - 0.05, Tllega = Tmem + 0.25;
const posMomento = (m, t) => {
  if (m.i === COPIADO && t > Tdispara) return mezV(m.orb, ARRIBA, su(tr(t, Tdispara, Tllega)));
  const u = k.entra(tr(t, m.llega, m.llega + 0.6));
  const p = mezV(m.desde, m.orb, u);
  return [p[0] + 0.02 * Math.sin(t * 2 + m.i), p[1] + 0.025 * Math.sin(t * 2.6 + m.i * 2), p[2]];
};
// cuánto le queda a cada uno (su cuenta atrás): de 1 a 0 en unos segundos
const queda = (m, t) => 1 - tr(t, m.llega + 0.6, Tano - 0.2);

// ---------------------------------------------------------------- la cámara
const BC = [0, 0, 0];
const cam = k.ruta([
  [T0, { pos: [0.1, 0.05, 3.6], mira: [0, -0.05, 0] }],
  [Tcab + 0.3, { pos: [0.05, 0.0, 3.0], mira: [0, -0.08, 0] }],
  [Tgra + 0.2, { pos: [-0.9, 0.1, 1.95], mira: [HC[0] - 0.05, HC[1] + 0.05, HC[2]] }],
  [Thip + 0.4, { pos: [-0.85, 0.05, 1.8], mira: [HC[0], HC[1] + 0.08, HC[2]] }],
  [Tseg, { pos: [-0.8, 0.05, 1.75], mira: [HC[0], HC[1] + 0.12, HC[2]] }],
  [Tdispara + 0.1, { pos: [-0.8, 0.0, 1.75], mira: [HC[0], HC[1] + 0.12, HC[2]] }],
  [Tllega, { pos: [-0.5, 0.55, 1.75], mira: ARRIBA }],
  [Fin - 0.3, { pos: [-0.45, 0.62, 1.6], mira: ARRIBA }],
]);

// la cabeza de perfil (mirando a la izquierda), en pantalla, alrededor de donde sale el cerebro
function cabeza(g, cx, cy, s, al) {
  if (al <= 0.01) return;
  g.save(); g.translate(cx, cy); g.scale(s, s); g.globalAlpha = al;
  g.beginPath();
  g.moveTo(120, 430); g.bezierCurveTo(130, 330, 200, 260, 230, 150); g.bezierCurveTo(270, 20, 250, -200, 120, -300);
  g.bezierCurveTo(0, -380, -220, -370, -320, -250); g.bezierCurveTo(-390, -160, -400, -60, -380, 20);
  g.lineTo(-430, 100); g.lineTo(-385, 120); g.lineTo(-395, 175); g.lineTo(-375, 190); g.lineTo(-385, 230);
  g.bezierCurveTo(-370, 280, -300, 290, -250, 285); g.bezierCurveTo(-230, 340, -220, 390, -230, 430);
  g.lineWidth = 7; g.strokeStyle = "rgba(170,200,255,0.75)"; g.stroke();
  g.lineWidth = 26; g.strokeStyle = "rgba(120,160,255,0.12)"; g.stroke();
  g.restore();
}

// una burbuja con un momento dentro, en (x, y) de radio r
export function burbuja(g, img, x, y, r, c, al, resto) {
  if (al <= 0.01 || r < 2) return;
  g.save(); g.globalAlpha = al;
  k.brillo(g, x, y, r * 4, c, 0.6);
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.clip(); g.drawImage(img, x - r, y - r, r * 2, r * 2);
  const sh = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); sh.addColorStop(0, "rgba(255,255,255,0.35)"); sh.addColorStop(0.6, "rgba(255,255,255,0)"); sh.addColorStop(1, `rgba(${c},0.6)`);
  g.fillStyle = sh; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
  g.strokeStyle = `rgba(${c},0.95)`; g.lineWidth = Math.max(2, r * 0.05); g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.stroke();
  // la cuenta atrás: un anillo que se acaba
  if (resto < 1) {
    g.strokeStyle = "rgba(255,255,255,0.95)"; g.lineWidth = Math.max(3, r * 0.08); g.lineCap = "round";
    g.beginPath(); g.arc(x, y, r * 1.18, -Math.PI / 2, -Math.PI / 2 + 6.2832 * resto); g.stroke();
  }
  g.restore();
}

export function dibuja(g, t) {
  const c = cam(t);
  // el fondo: azul muy oscuro, con niebla
  g.fillStyle = "#03030a"; g.fillRect(0, 0, 1080, 1920);
  const C0 = proyecta(c, BC);
  if (C0) { const bg = g.createRadialGradient(C0.x, C0.y, 50, C0.x, C0.y, 1100); bg.addColorStop(0, "rgba(90,40,120,0.45)"); bg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920); }
  // el brillo del cerebro, por dentro
  if (C0) { const r = (F * 1.1) / C0.z, hg = g.createRadialGradient(C0.x, C0.y, r * 0.2, C0.x, C0.y, r); hg.addColorStop(0, "rgba(255,110,190,0.22)"); hg.addColorStop(1, "rgba(255,110,190,0)"); g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = hg; g.fillRect(C0.x - r, C0.y - r, r * 2, r * 2); g.restore(); }
  // la cabeza, al principio
  const ca = 1 - su(tr(t, Tcab + 0.1, Ttie + 0.2));
  if (C0) cabeza(g, C0.x + 30, C0.y - 30, (F * 1.25) / C0.z / 400, ca);
  // el cerebro: se apaga un poco cuando se enciende el hipocampo
  const hipoOn = su(tr(t, Ttie, Tgra + 0.1)), dim = 1 - 0.45 * hipoOn;
  const memOn = su(tr(t, Tllega - 0.1, Tllega + 0.3));
  g.save(); g.globalCompositeOperation = "lighter";
  for (const q of PUNTOS) {
    const P = proyecta(c, q.p);
    if (!P || P.x < -5 || P.x > 1085 || P.y < -5 || P.y > 1925) continue;
    const s = Math.max(2, Math.min(10, (F * 0.008) / P.z)), al = Math.min(1, 2.6 / P.z) * q.b * dim;
    let col = q.c, extra = 0;
    // la mancha de la memoria que se enciende y se queda
    if (memOn > 0) { const d = k.largo(k.res(q.p, ARRIBA)); if (d < 0.32) { col = COLM[COPIADO]; extra = memOn * (1 - d / 0.32) * 1.6; } }
    g.fillStyle = `rgba(${col},${Math.min(1, al * 0.9 + extra)})`; g.fillRect(P.x - s / 2, P.y - s / 2, s * (1 + extra * 0.6), s * (1 + extra * 0.6));
  }
  g.restore();
  // las chispas
  for (const ch of CHISPAS) {
    const u = (t * ch.v + ch.f) % 1, X = mezV(ch.a, ch.b, u), P = proyecta(c, X), calma = 1 - su(tr(t, Fin - 0.6, Fin - 0.2));
    if (P) k.brillo(g, P.x, P.y, Math.min(70, (F * 0.06) / P.z), "220,180,255", 0.8 * Math.sin(u * Math.PI) * dim * calma);
  }
  // el hipocampo, en oro
  const late = k.pulso(t, Tgra + 0.05, 0.15) + k.pulso(t, Tdispara, 0.12) * 1.5;
  g.save(); g.globalCompositeOperation = "lighter";
  for (const q of HIPO) {
    const P = proyecta(c, q.p); if (!P) continue;
    const s = Math.max(1.5, Math.min(12, (F * 0.009) / P.z)), al = (0.25 + 0.75 * hipoOn) * (q.lado === 1 ? 1 : 0.5) * (0.7 + 0.5 * late);
    g.fillStyle = `rgba(255,${Math.round(200 - 40 * hipoOn)},${Math.round(200 - 130 * hipoOn)},${Math.min(1, al)})`; g.fillRect(P.x - s / 2, P.y - s / 2, s, s);
  }
  g.restore();
  const H = proyecta(c, HC);
  if (H) {
    k.brillo(g, H.x, H.y, (F * 0.9) / H.z, "255,190,90", (0.35 + 0.4 * late) * hipoOn);
    // el piloto rojo de grabación
    const pv = su(tr(t, Tgra - 0.15, Tgra + 0.15));
    if (pv > 0) {
      const px = H.x + (F * 0.3) / H.z, py = H.y - (F * 0.02) / H.z, r = 22, on = 0.75 + 0.25 * Math.sin(t * 8);
      g.save(); g.globalAlpha = pv;
      k.brillo(g, px, py, r * 8, "255,40,50", 0.8 * on);
      g.fillStyle = "rgb(255,45,55)"; g.beginPath(); g.arc(px, py, r, 0, 6.2832); g.fill();
      g.font = "800 40px Figtree"; g.textBaseline = "middle"; g.fillStyle = "#ffe8e8"; g.fillText("REC", px + 34, py + 2);
      g.restore();
    }
    // su nombre
    const na = su(tr(t, Thip - 0.1, Thip + 0.2)) * (1 - su(tr(t, Tviv - 0.2, Tviv + 0.2)));
    if (na > 0) k.etiqueta(g, H.x - 230, H.y + (F * 0.2) / H.z, "hipocampo", "255,205,120", na, 64);
  }
  // los momentos: llegan, flotan con su cuenta atrás, y el que se copia sube con el haz
  for (const m of MOMENTOS) {
    if (t < m.llega) continue;
    const X = posMomento(m, t), P = proyecta(c, X);
    if (!P) continue;
    const sube = m.i === COPIADO && t > Tdispara, resto = sube ? 1 : queda(m, t);
    const al = sube ? 1 - su(tr(t, Tllega, Tllega + 0.25)) : Math.min(1, tr(t, m.llega, m.llega + 0.2)) * (0.35 + 0.65 * resto) * Math.min(1, resto * 4);
    // su estela al llegar
    if (t < m.llega + 0.6) { const Q = proyecta(c, m.desde), u = k.entra(tr(t, m.llega, m.llega + 0.6)); if (Q) { g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(${m.c},${0.5 * (1 - u)})`; g.lineWidth = 10; g.beginPath(); g.moveTo(mez(Q.x, P.x, 0.5), mez(Q.y, P.y, 0.5)); g.lineTo(P.x, P.y); g.stroke(); g.restore(); } }
    burbuja(g, m.img, P.x, P.y, (F * 0.11) / P.z, m.c, al, sube ? 1 : resto);
  }
  // el haz de la copia, del hipocampo a la corteza
  const hz = su(tr(t, Tdispara - 0.05, Tdispara + 0.15)) * (1 - su(tr(t, Tllega + 0.1, Tllega + 0.6)));
  if (hz > 0 && H) {
    const A = proyecta(c, MOMENTOS[COPIADO].orb), B = proyecta(c, ARRIBA);
    if (A && B) {
      g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
      g.strokeStyle = `rgba(${COLM[COPIADO]},${0.35 * hz})`; g.lineWidth = 60; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke();
      g.strokeStyle = `rgba(255,255,255,${0.9 * hz})`; g.lineWidth = 10; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke();
      g.restore();
    }
  }
  // la memoria guardada: un destello al llegar
  const B = proyecta(c, ARRIBA);
  if (B) k.brillo(g, B.x, B.y, 700, COLM[COPIADO], 1.1 * k.pulso(t, Tllega + 0.05, 0.2) + 0.25 * memOn);
  const vg = g.createLinearGradient(0, 180, 0, 640); vg.addColorStop(0, "rgba(3,3,10,0.6)"); vg.addColorStop(1, "rgba(3,3,10,0)");
  g.fillStyle = vg; g.fillRect(0, 0, 1080, 640);
}

export const momentos = { rec: Tgra, llegadas: MOMENTOS.map((m) => m.llega), dispara: Tdispara, guarda: Tllega };
