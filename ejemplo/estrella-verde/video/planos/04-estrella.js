// «Su aire es tan espeso como el agua, y ahí ese sodio no deja salir el naranja de su luz. Y una estrella sin
// naranja... se ve verde. Así que no es verde de nacimiento: es verde por lo que se comió, lo que quedaba de sus
// planetas. Envíaselo a ese amigo que cree que en el espacio ya está todo descubierto.»
// Se vuelve de la cocina a la estrella con un corte en «aire», y desde ahí todo es un solo plano: la misma estrella y
// la misma cámara hasta el final.
// - «Su aire»: rozando la bolita: su superficie blanca, que hierve, abajo; encima, su aire, una capa que brilla.
// - «es tan espeso como el agua»: la cámara baja y se mete en ese aire: azul, con la red de luz del fondo de una
//   piscina y rayos de luz que bajan, como bajo el agua.
// - «y ahí ese sodio»: se encienden los átomos de sodio, naranjas.
// - «no deja salir el naranja de su luz»: de la superficie suben rayos de cada color; el naranja y el amarillo se
//   quedan en el sodio, que brilla al cogerlos (en «naranja», el naranja), y el resto sigue hacia arriba.
// - «Y una estrella sin naranja... se ve verde»: la cámara sale hasta ver la bolita entera, que pasa de blanca a
//   verde y late en «verde».
// - «Así que no es verde de nacimiento»: desde «no» vuelve atrás girando al revés, hasta la estrella amarilla que fue.
// - «es verde»: se encoge hasta la bolita, girando cada vez más deprisa. «por lo que se comió»: le caen los trozos de
//   sus planetas; con el más grande, en «comió», se pone verde.
// - «Envíaselo...»: la cámara se aleja entre estelas hasta ver la galaxia entera en «espacio»; la verde queda marcada,
//   «a 280 años luz», y late en «descubierto».
import * as k from "#kit";
import { v } from "#voz";

export const desde = "aire";

const { suave: su, tramo: tr, mez: mz, pulso } = k;
const f8 = v.frase(8), f9 = v.frase(9), f10 = v.frase(10), f11 = v.frase(11);
const cielo = k.cielo(99, 2600, [0, 0, 0], 520, 30);
// las tres partes, por las pausas entre frases
const T0 = (f9.fin + f10.inicio) / 2, T1 = (f10.fin + f11.inicio) / 2;

// ---------------------------------------------------------------- 1. dentro de su aire
const Tes = f8.t("es"), Tagua = f8.t("agua"), Tsodio = f8.t("sodio"), Tno = f8.t("no"), Tnar = f8.t("naranja");
const Tfuera = f9.t("y"), Tsin = f9.t("sin"), Tverde = f9.t("verde");
const az = k.azar(21), atomos = [];
for (let i = 0; i < 70; i++) atomos.push({ x: 50 + az() * 980, y: 760 + az() * 420, f: az() * 6.28, s: 44 + az() * 40 });
// los rayos: su color, dónde salen y cuánto se queda el sodio (el naranja y el amarillo, todo; el rojo, algo)
const rayos = [["255,80,70", 165, 0.4], ["255,150,40", 315, 1], ["255,220,70", 460, 1], ["130,255,100", 615, 0], ["100,235,255", 765, 0], ["130,150,255", 910, 0]];
const ATRAPA = 1000;                                          // la altura de la capa de sodio
function medio(g, t, prof, yh) {
  if (prof <= 0.01) return;
  const mg = g.createLinearGradient(0, 0, 0, yh);
  mg.addColorStop(0, `rgba(16,34,96,${prof})`); mg.addColorStop(0.55, `rgba(40,110,200,${prof})`); mg.addColorStop(1, `rgba(150,210,255,${prof})`);
  g.fillStyle = mg; g.fillRect(0, 0, 1080, yh + 40);
  g.save(); g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 2; i++) { g.globalAlpha = (0.32 - 0.1 * i) * prof; k.girado(g, k.causticas, 540 + 140 * Math.sin(t * 0.55 + i * 2), 900 + 90 * Math.cos(t * 0.45 + i), 2400 + 600 * i, 0.4 * i + 0.1 * Math.sin(t * 0.35)); }
  g.restore();
  k.rayos(g, t, yh, prof);
}
function aire(g, t, capa) {
  const dentro = su(tr(t, Tes, Tagua)), yh = mz(1340, 1640, dentro);
  // su aire, la capa que brilla encima de la superficie
  k.superficie(g, yh, t, capa);
  const ag = g.createLinearGradient(0, yh - 380, 0, yh + 20);
  ag.addColorStop(0, "rgba(150,210,255,0)"); ag.addColorStop(0.6, `rgba(160,215,255,${0.35 * capa})`); ag.addColorStop(1, `rgba(220,240,255,${0.75 * capa})`);
  g.fillStyle = ag; g.fillRect(0, yh - 380, 1080, 400);
  medio(g, t, dentro * capa, yh);
  // los rayos: suben desde la superficie; el sodio se queda el naranja y el amarillo
  const na = su(tr(t, Tsodio - 0.12, Tsodio + 0.25)) * capa, coge = [];
  rayos.forEach((ry, j) => {
    const t0 = Tno + j * 0.06 + (ry[2] === 1 ? 0.22 : 0), sube = tr(t, t0, t0 + 1.0);
    if (sube <= 0) return;
    const punta = yh - sube * (yh + 400), tope = ry[2] === 1 ? ATRAPA + 30 * (j - 1.5) : 560, alto = Math.max(punta, tope);
    const al = capa * (ry[2] === 0.4 ? 0.9 : 1), pasa = ry[2] !== 1 && alto <= 560;     // los que pasan se apagan antes del subtítulo
    k.haz(g, ry[1], yh, alto, ry[0], al, 52, pasa);
    if (!pasa) k.brillo(g, ry[1], alto, 190, ry[2] === 1 ? "sodio" : "blanca", 0.7 * al);
    if (ry[2] === 0.4 && punta < ATRAPA) { g.fillStyle = `rgba(3,5,30,${0.35 * al})`; g.fillRect(ry[1] - 62, Math.max(punta, -400), 124, ATRAPA - Math.max(punta, -400)); }
    if (ry[2] === 1 && punta <= tope) coge.push([ry[1], tope, t - (t0 + ((yh - tope) / (yh + 400)) * 1.0)]);
  });
  // el sodio, que se enciende en «sodio» y brilla más donde coge un rayo
  for (const a of atomos) {
    const x = a.x + 16 * Math.sin(t * 0.9 + a.f), y = a.y + 12 * Math.cos(t * 0.7 + a.f);
    let extra = 0;
    for (const p of coge) { const d = Math.abs(x - p[0]) + Math.abs(y - p[1]) * 0.6; if (d < 230) extra += (1 - d / 230) * (0.5 + 0.5 * Math.exp(-p[2] * 2)); }
    k.brillo(g, x, y, a.s * (1 + 0.7 * extra), "sodio", na * (0.6 + 0.15 * Math.sin(t * 3 + a.f) + 0.9 * extra));
  }
  const fn = pulso(t, Tnar + 0.12, 0.2) * capa;
  if (fn > 0.02) k.brillo(g, 315, ATRAPA, 640, "sodio", fn);
  return yh;
}

// ---------------------------------------------------------------- 2. su vida, hacia atrás y hacia delante
const TnoF = f10.t("no"), Tnac = f10.t("nacimiento"), TesF = f10.t("es", 2), Tc = f10.t("comio"), Tp = f10.t("planetas");
const caen = [];
{
  const b = k.azar(31), por = f10.t("por"), lo2 = f10.t("lo", 2);
  for (let i = 0; i < 16; i++) {
    const cuando = i < 6 ? mz(por, Tc - 0.1, i / 6) : i === 6 ? Tc : mz(lo2, Tp + 0.05, (i - 7) / 9);
    caen.push({ t: cuando, a: b() * 6.2832, d: 700 + b() * 420, s: i === 6 ? 105 : 26 + b() * 38, sem: 600 + i, gira: (b() - 0.5) * 7, dur: 0.6 + b() * 0.3 });
  }
}
export const choquesFinal = caen.map((q) => ({ t: q.t, s: q.s, grande: q.s > 100 }));

// ---------------------------------------------------------------- 3. el espacio
const Tesp = f11.t("espacio"), Tdes = f11.t("descubierto"), Z0 = 23, R0 = 240, VER = [430, -40];

// ---------------------------------------------------------------- la cámara del fondo y la estrella, de principio a fin
const fueraDe = (t) => su(tr(t, Tfuera, Tfuera + 1.5));
const camZ = (t) => (t < T0 ? 30 - 4 * fueraDe(t) : t < T1 ? 26 - 3 * tr(t, T0, T1) : Math.exp(mz(Math.log(Z0), Math.log(400), su(tr(t, T1, Tesp)))));
const camEn = (t) => k.mira([0, 0, camZ(t)], [0, 0, 0]);
const joven = (t) => su(tr(t, TnoF, Tnac + 0.4)), muere = (t) => su(tr(t, TesF - 0.05, TesF + 0.3)), come = (t) => su(tr(t, Tc, Tc + 0.55));
// el giro de su superficie: continuo de punta a punta (al revés en la vuelta atrás; deprisa al encogerse)
const giro = (t) => (t < T0 ? 0.04 * (t - T0) : t < T1 ? 0.07 * (t - T0) - 2.2 * joven(t) + (2.2 - 0.07 * (T1 - T0)) * muere(t) : 0.08 * (t - T1));

export function dibuja(g, t) {
  const cam = camEn(t), antes = camEn(t - 1 / 60);
  // el cielo; en la galaxia se apaga
  const vg = t < T1 ? 0 : su(tr(t, Tesp - 1.1, Tesp + 0.3));
  k.fondo(g, cam, 1 - 0.6 * vg);
  const fuera = fueraDe(t);
  k.estrellas(g, cam, t < T1 ? null : antes, cielo, t < T0 ? 0.4 + 0.6 * fuera : 1 - vg);
  // 1. su aire, hasta que la cámara sale
  const capa = 1 - su(tr(t, Tfuera, Tfuera + 0.7));
  let yh = 1640;
  if (capa > 0.01) yh = aire(g, t, capa);
  if (t < T0) {
    // la bolita entera, que aparece por encima del aire que se apaga: su borde sube sin bajar nunca
    if (fuera > 0.001) {
      const R = Math.exp(mz(Math.log(2900), Math.log(380), fuera)), cy = mz(yh, 960 - 380, fuera) + R;
      const verde = su(tr(t, Tsin, Tverde + 0.1)), late = pulso(t, Tverde + 0.04, 0.11);
      k.estrellaTransparente(g, k.paleta("enana", "verde", verde), 540, cy, R, giro(t), 0.3 + 1.1 * late, Math.min(1, fuera * 3));
    }
    return;
  }
  if (t < T1) {
    // 2. verde → amarilla (desde «no», hasta pasado «nacimiento») → bolita blanca (en «es verde») → verde (en «comió»)
    const jo = joven(t), mu = muere(t), co = come(t);
    const R = mz(mz(380, 490, jo), 110, mu) + 130 * su(tr(t, TesF + 0.3, Tc + 0.3));
    const pal = mu < 1e-3 ? k.paleta("verde", "amarilla", jo) : co < 1e-3 ? k.paleta("amarilla", "enana", mu) : k.paleta("enana", "verde", co);
    let golpes = 0;
    for (const q of caen) { const u = t - q.t; if (u > 0 && u < 0.5) golpes += Math.exp(-u * 7) * (q.s > 50 ? 3 : 1); }
    k.estrella(g, pal, 540, 960, R, giro(t), 0.3 + 0.45 * golpes + 0.6 * pulso(t, TesF + 0.25, 0.15));
    // los trozos, en espiral hacia ella; al llegar, un destello en su borde (verde en los grandes)
    for (const q of caen) {
      const u = (t - (q.t - q.dur)) / q.dur;
      if (u < 0) continue;
      if (u < 1) {
        const e = u * u, d = mz(q.d, R * 0.95, e), a = q.a + 1.2 * e, x = 540 + d * Math.cos(a), y = 960 + d * Math.sin(a) * 0.9;
        k.roca(g, x, y, q.s * (1 - 0.3 * e), q.gira * u, q.sem, 540 - x, 960 - y, e * 0.8);
      } else if (u < 1 + 0.5 / q.dur) {
        const a2 = q.a + 1.2, x2 = 540 + R * Math.cos(a2), y2 = 960 + R * Math.sin(a2) * 0.9, w = (u - 1) * q.dur;
        k.brillo(g, x2, y2, (q.s > 50 ? 700 : 260) * (0.5 + w), q.s > 50 ? "verde" : "blanca", Math.exp(-w * 6));
      }
    }
    return;
  }
  // 3. la galaxia: de muy cerca (alrededor de la verde) a entera y centrada, inclinada, girando despacio
  const dist = camZ(t), s = Math.exp(mz(Math.log(7), Math.log(0.86), su(tr(t, Tesp - 1.2, Tesp + 0.5)))), gi = -0.35 + 0.06 * (t - T1);
  const gx = VER[0] * Math.cos(gi) - VER[1] * Math.sin(gi), gy = VER[0] * Math.sin(gi) + VER[1] * Math.cos(gi);
  const centra = su(tr(t, Tesp - 0.6, Tesp + 0.6)), cx = mz(540 - s * gx, 520, centra), cy = mz(960 - 0.62 * s * gy, 940, centra);
  if (vg > 0.01) {
    g.save(); g.globalAlpha = vg; g.translate(cx, cy); g.scale(1, 0.62); g.rotate(gi);
    g.globalCompositeOperation = "lighter"; g.drawImage(k.galaxia(), -800 * s, -800 * s, 1600 * s, 1600 * s); g.restore();
  }
  // la verde: grande al principio, luego un punto; marcada en su brazo, y late en «descubierto»
  const vx = cx + s * gx, vy = cy + 0.62 * s * gy, rad = (R0 * Z0) / dist, late = pulso(t, Tdes + 0.15, 0.22);
  if (rad > 8) k.estrella(g, "verde", vx, vy, rad, giro(t), 0.3);
  k.brillo(g, vx, vy, 60 + 70 * late, "verde", Math.max(su(tr(rad, 200, 60)), late));
  const marca = su(tr(t, Tesp, Tesp + 0.35));
  if (marca > 0) {
    g.save(); g.strokeStyle = `rgba(170,255,120,${0.9 * marca})`; g.lineWidth = 5;
    g.beginPath(); g.arc(vx, vy, 34 + 10 * late + 18 * (1 - marca), 0, Math.PI * 2); g.stroke(); g.restore();
    k.etiqueta(g, vx - 160, vy + 56 + 20 * (1 - marca), "a 280 años luz", "184,255,122", marca);
  }
}

// Para el sonido (sonidos.js)
export const momentos = { Tes, Tagua, Tsodio, Tno, Tnar, Tfuera, Tverde, TnoF, Tnac, TesF, Tc, T1, Tesp, Tdes };
