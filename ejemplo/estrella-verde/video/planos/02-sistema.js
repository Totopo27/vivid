// «Que se murió. Esto es el cadáver de una estrella como el Sol: una bola del tamaño de la Tierra que pesa como medio
// Sol. Sus planetas no salieron enteros: sus trozos se quedaron girando a su alrededor, y fueron cayendo sobre ella.
// Y esos trozos iban cargados de sodio...»
// El pasado de la verde, en un solo sitio y con una sola cámara: la bolita blanca en el centro del mundo, y todo lo
// demás a su alrededor. Nada salta de un momento al siguiente: la cámara va de una cosa a otra.
// - «Que se»: sin corte, desde la misma superficie verde con que acaba el hook: la cámara se aleja mientras la estrella
//   gira hacia atrás y vuelve a ser lo que fue, una estrella amarilla como el Sol (es su pasado: la misma estrella).
// - «murió»: se hincha roja, se desploma en una bolita blanca, con un fogonazo y una onda; sus capas de fuera se van en
//   un anillo de gas.
// - «Esto es el cadáver»: la cámara entra hacia la bolita. «como el Sol»: alrededor, el contorno del tamaño que tenía.
// - «una bola del tamaño de la Tierra»: la Tierra llega desde la derecha y se para a su lado en «Tierra»: iguales.
// - «que pesa como medio Sol»: medio Sol sube desde abajo y en «medio» se aprieta hasta caber en la bolita.
// - «Sus planetas»: la Tierra se va; la cámara se aleja y sube hasta ver sus dos planetas. «salieron»: se parte el
//   pequeño; «enteros», el grande, delante.
// - «sus trozos se quedaron girando a su alrededor»: el anillo de trozos gira; uno grande pasa por delante.
// - «y fueron cayendo sobre ella»: caen en espiral y chocan, cada uno con su destello; el más grande, en «sobre».
// - «Y esos trozos iban cargados de sodio»: la cámara se va detrás de un trozo que cae hacia la bolita; se pone al
//   rojo y en «sodio» revienta en un vapor naranja (el color del sodio), que se apaga antes de pasar a la cocina (y
//   ahí la imagen reposa un momento: el corte no llega a medias).
import * as k from "#kit";
import { v } from "#voz";
import { corte as Tcocina } from "./03-cocina.js";
import { veloArriba } from "../mundo.js";

export const desde = "que#2"; // «Que se murió» (la primera «qué» es la de la pregunta)
export const entrada = "sigue"; // la misma estrella: no hay corte

const { suave: su, tramo: tr, mez: mz, sum, res, por, mezV, uni, proyecta, F } = k;
const RE = 0.55;                                            // el radio de la bolita
const f5 = v.frase(5), f6 = v.frase(6), f7 = v.frase(7);
const Tm = v.t("murio"), hinchar = Tm - 0.08, caer = Tm + 0.3, fin = Tm + 0.46;
const Tcad = v.t("cadaver"), Tsol = f5.t("sol"), Tuna = f5.t("una", 2), Tbola = v.t("bola"), Ttierra = v.t("tierra");
const Tpesa = v.t("pesa"), Tmedio = v.t("medio"), Tsol2 = f5.t("sol", 2);
const Tsus = f6.t("sus"), Tsal = v.t("salieron"), Tent = v.t("enteros"), Tgir = v.t("girando"), Tfue = v.t("fueron"), Tella = v.t("ella");
const Tiban = v.t("iban"), Tsodio = f7.t("sodio");

const cielo = k.cielo(55, 3000, [0, 0, 0], 520, 30);

// ---------------------------------------------------------------- la cámara, de principio a fin
// 1. mira la bolita de frente; se acerca tanto como dice su tamaño en pantalla (13 px muerta, 156 px junto a la Tierra)
const radBola = k.curva([[fin, 13], [Tcad + 0.2, 124], [Tuna, 132], [Ttierra, 150], [Tsol2 + 0.3, 156]], 0, 0);
// 0. la vuelta atrás: de pegada a la superficie verde (como acaba el hook: la estrella llena la pantalla, 1.186 px) a
//    la estrella amarilla entera, que la cámara mira mientras se acerca despacio hasta su muerte
const T0 = desdeT(), TR = T0 + 0.7, R_ESTRELLA = 18.2;
const dPegada = R_ESTRELLA * 1.18;                            // el hook acaba a 1,18 radios de su centro
const dViva = (t) => mz(62, (F * RE) / 13, tr(t, T0, fin));
const vuelve = (t) => su(tr(t, T0, TR));
const distFrente = (t) => (t < TR ? Math.exp(mz(Math.log(dPegada), Math.log(dViva(TR)), vuelve(t))) : t < fin ? dViva(t) : (F * RE) / radBola(t));
function desdeT() { return v.t("que", 2) - 0.04; }
const ox = (t) => 0.61 * su(tr(t, Tuna, Ttierra));            // se corre a la derecha para que quepa la Tierra
const camFrente = (t) => ({ pos: [ox(t), 0, distFrente(t)], mira: [ox(t), 0, 0] });
// 2. desde «Sus planetas», gira alrededor un poco por encima del plano de los trozos; en «fueron cayendo» se acerca
const T0orbita = Tsus + 0.95;
const angulo = (t) => 0.25 + 0.136 * (t - T0orbita);
const distOrbita = (t) => 7.6 - 2.2 * su(tr(t, Tfue - 0.2, Tella + 0.2));
const camOrbita = (t) => { const d = distOrbita(t); return { pos: k.orbita(angulo(t), d, (2.3 * d) / 7.6), mira: [0, -0.15, 0] }; };
// 3. en «Y esos trozos», baja hasta rozar la bolita por arriba: su borde queda abajo y uno de los trozos cae hacia él
const Tsigue = f7.palabras[0].inicio - 0.1, thE = angulo(Tsigue);
const camCerca = { pos: [1.25 * Math.sin(thE), 0.95, 1.25 * Math.cos(thE)], mira: [0, 0.95, 0] };
const caida = (t) => Math.pow(tr(t, Tsigue - 0.4, Tsodio + 0.3), 1.6);
const trozo = (t) => [0, mz(1.75, 0.62, caida(t)), 0];                               // revienta antes de tocarla
// de una a otra, sin tirones (cada mezcla empieza y acaba con la velocidad de la cámara a la que va)
const mezcla = (A, B, u) => ({ pos: mezV(A.pos, B.pos, u), mira: mezV(A.mira, B.mira, u) });
const camara = (t) => {
  let c = camFrente(t);
  const a = su(tr(t, Tsus - 0.05, T0orbita));
  if (a > 0) c = mezcla(c, camOrbita(t), a);
  const b = su(tr(t, Tsigue, Tsigue + 1.5));
  if (b > 0) c = mezcla(c, camCerca, b);
  return k.mira(c.pos, c.mira);
};

// ---------------------------------------------------------------- los trozos y los planetas
const az = k.azar(9), rocas = [];
for (let i = 0; i < 90; i++) {
  const r0 = 1.5 + Math.pow(az(), 0.8) * 2.4;
  const cae = az() < 0.38 ? Tfue + az() * (Tella - Tfue - 0.35) : null;            // los últimos, 0,35 s antes de «ella»
  rocas.push({ r0, a0: az() * 6.2832, h: (az() - 0.5) * 0.28, s: (0.035 + Math.pow(az(), 2) * 0.12) * (cae === null ? 1 : 1.6), sem: i, gira: (az() - 0.5) * 3, cae });
}
rocas.push({ r0: 2.2, a0: 1.2, h: 0.05, s: 0.2, sem: 99, gira: 1.4, cae: v.t("sobre"), grande: true });   // la grande
// el trozo grande que pasa por delante en «girando»: una roca del anillo, cerca de por donde va la cámara
rocas.push({ r0: 5.6, a0: Math.PI / 2 - angulo(Tgir + 0.1), t0: Tgir + 0.1, h: 1.35, s: 0.16, sem: 77, gira: 0.6, cae: null, lento: true });
const planetas = [
  { p: [-2.7, 0.35, -1.0], R: 0.42, rompe: Tsal + 0.05, tono: ["#b8a48e", "#76624f", "#2c2018"], sem: 300 },
  { p: [2.05, 0.5, 3.6], R: 0.78, rompe: Tent + 0.08, tono: ["#d0a27c", "#8c5f40", "#33200f"], sem: 200 },
];
for (const P of planetas) {
  const b = k.azar(P.sem); P.trozos = [];
  for (let i = 0; i < 18; i++) P.trozos.push({ d: uni([b() - 0.5, (b() - 0.5) * 0.8, b() - 0.5]), v: 0.5 + b() * 1.1, s: P.R * (0.18 + b() * 0.32), sem: P.sem + i, gira: (b() - 0.5) * 6 });
}
const donde = (q, t) => {
  let r = q.r0, a = q.lento ? q.a0 + 0.12 * (t - q.t0) : q.a0 + (t * 0.55) / Math.pow(r, 1.5), h = q.h;
  if (q.cae !== null && t > q.cae - 0.55) { const e = Math.pow(tr(t, q.cae - 0.55, q.cae), 2); r = mz(q.r0, RE, e); a += 1.6 * e; h = mz(q.h, 0, e); }
  return [r * Math.cos(a), h, r * Math.sin(a)];
};
// los choques, para el sonido (sonidos.js): cuándo y lo grande que es cada uno
export const choques = rocas.filter((q) => q.cae !== null).map((q) => ({ t: q.cae, s: q.s, grande: !!q.grande })).sort((a, b) => a.t - b.t);
export const roturas = planetas.map((P) => ({ t: P.rompe, R: P.R }));
export const revienta = Tsodio - 0.12;

// ---------------------------------------------------------------- cada fotograma
export function dibuja(g, t) {
  const cam = camara(t), antes = camara(t - 1 / 60);
  k.fondo(g, cam);
  k.estrellas(g, cam, antes, cielo);
  const B = proyecta(cam, [0, 0, 0]), radB = B ? (F * RE) / B.z : 0, y0 = B ? B.y : 960, xB = B ? B.x : 540;
  // --- la estrella como el Sol, viva, que se hincha y se desploma
  if (t < fin) {
    const hin = su(tr(t, hinchar, caer)), des = tr(t, caer, fin), vu = vuelve(t);
    let r = (F * R_ESTRELLA) / distFrente(t) * (1 + 0.023 * Math.sin(t * 1.3) * vu) * (1 + 0.75 * hin);
    if (t >= caer) r = mz(r, 13, 1 - Math.pow(1 - des, 2.2));
    // verde (como acaba el hook) → amarilla (lo que fue) → roja al hincharse
    const pal = hin > 0 ? k.paleta("amarilla", "gigante", hin) : k.paleta("verde", "amarilla", vu);
    // gira como giraba en el hook y, al volver atrás, al revés
    k.estrella(g, pal, xB, y0, r, 0.09 * T0 + 0.1 * (t - T0) - 1.6 * vu, 0.4 * hin);
    veloArriba(g, r);
    return;
  }
  const u = t - fin;
  // --- el fogonazo y la onda de la muerte; el anillo de gas de sus capas de fuera, que se aleja
  k.fogonazo(g, xB, y0, u);
  const anillo = 150 + 520 * (1 - Math.exp(-u * 0.9)), alA = 0.55 * Math.exp(-u * 0.55) * (1 - tr(t, Tuna, Ttierra));
  if (alA > 0.01) {
    g.save(); g.globalCompositeOperation = "lighter";
    const ag = g.createRadialGradient(xB, y0, anillo * 0.6, xB, y0, anillo * 1.25);
    ag.addColorStop(0, "rgba(255,120,90,0)"); ag.addColorStop(0.45, `rgba(255,120,90,${alA})`); ag.addColorStop(0.7, `rgba(90,210,220,${alA * 0.6})`); ag.addColorStop(1, "rgba(90,210,220,0)");
    g.fillStyle = ag; g.beginPath(); g.arc(xB, y0, anillo * 1.25, 0, Math.PI * 2); g.fill(); g.restore();
  }
  // --- el tamaño que tenía: su contorno, en «Sol»
  const fan = su(tr(t, Tsol - 0.15, Tsol + 0.2)) * (1 - su(tr(t, Tbola, Ttierra - 0.3)));
  if (fan > 0.01) {
    g.save(); g.globalCompositeOperation = "lighter";
    const fz = g.createRadialGradient(xB, y0, 380, xB, y0, 440);
    fz.addColorStop(0, "rgba(255,210,100,0)"); fz.addColorStop(0.8, `rgba(255,210,100,${0.22 * fan})`); fz.addColorStop(1, "rgba(255,210,100,0)");
    g.fillStyle = fz; g.beginPath(); g.arc(xB, y0, 440, 0, Math.PI * 2); g.fill();
    g.fillStyle = `rgba(255,210,100,${0.06 * fan})`; g.beginPath(); g.arc(xB, y0, 430, 0, Math.PI * 2); g.fill();
    g.setLineDash([18, 14]); g.strokeStyle = `rgba(255,226,150,${0.75 * fan})`; g.lineWidth = 5;
    g.beginPath(); g.arc(xB, y0, 430, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); g.restore();
  }
  // --- todo lo que está en el mundo, de lejos a cerca
  const cosas = [], luz = (x, y) => [xB - x, y0 - y];
  let golpes = 0;
  // la Tierra: llega desde la derecha y frena hasta pararse en «Tierra»; en «Sus planetas» se va por donde vino
  const llega = 1 - Math.pow(1 - tr(t, Tuna - 0.1, Ttierra), 3), vase = Math.pow(tr(t, Tsus - 0.1, Tsus + 0.55), 2);
  if (t > Tuna - 0.1 && vase < 1) {
    const T = proyecta(cam, [mz(4.1, 1.22, llega) + 7 * vase, 0, 0]);
    if (T) cosas.push({ z: T.z, dibuja: () => k.tierra(g, T.x, T.y, (F * RE) / T.z, t * 0.03, -1, -0.15) });
  }
  // los planetas: aparecen en «Sus planetas» y se parten en «salieron» y en «enteros»
  const ven = su(tr(t, Tsus, Tsus + 0.6));
  if (ven > 0) for (const P of planetas) {
    if (t < P.rompe) {
      const a = proyecta(cam, P.p);
      if (a) cosas.push({ z: a.z, dibuja: () => { g.save(); g.globalAlpha = ven; const l = luz(a.x, a.y); k.planeta(g, a.x, a.y, (F * P.R) / a.z, t * 0.06, l[0], l[1], P.tono); g.restore(); } });
    } else {
      const w = t - P.rompe;
      if (w < 0.35) { const ab = proyecta(cam, P.p); if (ab) cosas.push({ z: ab.z - 0.01, dibuja: () => k.brillo(g, ab.x, ab.y, (F * P.R * 6) / ab.z, "naranja", 1.2 * Math.exp(-w * 8)) }); }
      for (const q of P.trozos) {
        const a = proyecta(cam, sum(P.p, por(q.d, P.R * 0.5 + q.v * (1 - Math.exp(-w * 1.6)) * 0.9)));
        if (a) cosas.push({ z: a.z, dibuja: () => { const l = luz(a.x, a.y); k.roca(g, a.x, a.y, (F * q.s) / a.z, q.gira * w, q.sem, l[0], l[1], 0.5 * Math.exp(-w * 3)); } });
      }
    }
  }
  // el anillo de trozos, girando; los que caen, en espiral hasta chocar
  const anilloVe = su(tr(t, Tsus + 0.3, Tsus + 1.2));
  if (anilloVe > 0) rocas.forEach((q, i) => {
    if (q.cae !== null && t > q.cae) { const w = t - q.cae; if (w < 0.5) golpes += Math.exp(-w * 7) * (q.s > 0.15 ? 2.5 : 1); return; }
    const a = proyecta(cam, donde(q, t));
    if (a) cosas.push({ z: a.z, dibuja: () => { g.save(); g.globalAlpha = anilloVe; const l = luz(a.x, a.y); k.roca(g, a.x, a.y, (F * q.s) / a.z, q.gira * t + i, q.sem, l[0], l[1], 0); g.restore(); } });
  });
  // el trozo que seguimos: cae, se pone al rojo y revienta en «sodio»
  if (t > Tsigue - 0.3 && t < revienta) {
    const a = proyecta(cam, trozo(t)), calor = su(tr(t, Tiban - 0.1, revienta));
    if (a) cosas.push({ z: a.z, dibuja: () => { const l = luz(a.x, a.y); k.roca(g, a.x, a.y, (F * 0.22) / a.z, t * 0.9, 77, l[0], l[1], calor); } });
  }
  // la bolita
  if (B) cosas.push({ z: B.z, dibuja: () => {
    const flash = k.pulso(t, Tsol2 + 0.05, 0.12);
    k.estrella(g, "enana", xB, y0, radB, t * 0.05, Math.min(2.2, 0.25 + 1.2 * flash + 0.6 * Math.exp(-(t - fin) * 3) + 0.55 * golpes));
  } });
  k.deLejosACerca(cosas);
  // --- el medio Sol: sube desde abajo en «pesa» y en «medio» se aprieta hasta caber en la bolita
  const sube = su(tr(t, Tpesa - 0.1, Tmedio - 0.02)), ap = Math.pow(tr(t, Tmedio, Tsol2 + 0.02), 2.2);
  if (sube > 0 && ap < 1) {
    const R = mz(520, radB, ap), cx = mz(540, xB, ap), cy = mz(mz(2500, 1170, sube), y0, ap);
    g.save(); g.beginPath(); g.rect(cx - R * 2.6, cy, R * 5.2, R * 2.6); g.clip();
    k.estrella(g, "amarilla", cx, cy, R, t * 0.1, 0.2);
    g.restore();
    g.save(); g.strokeStyle = `rgba(255,240,200,${0.85 * (1 - ap)})`; g.lineWidth = Math.max(2, 7 * (1 - ap)); g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.stroke(); g.restore();
  }
  // --- el destello de cada choque, encima
  rocas.forEach((q) => {
    if (q.cae === null || t < q.cae || t > q.cae + 0.5) return;
    const a = proyecta(cam, donde(q, q.cae - 0.02)), w = t - q.cae;
    if (a) k.brillo(g, a.x, a.y, (q.s > 0.15 ? 520 : 200) * (0.5 + w), "blanca", (q.s > 0.15 ? 1 : 0.8) * Math.exp(-w * 6));
  });
  // --- el trozo revienta en vapor naranja; rápido, y la nube se apaga del todo antes del corte a la cocina
  if (t >= revienta) {
    const a = proyecta(cam, trozo(revienta)), queda = 1 - su(tr(t, revienta + 0.18, Tcocina - 0.18));
    if (a && queda > 0.003) { g.save(); g.globalAlpha = queda; k.estallido(g, a.x, a.y, (t - revienta) * 2.2, "sodio", Math.min(1.1, (F * 0.22) / a.z / 250), 12); g.restore(); }
  }
}
