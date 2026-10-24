// «Esta estrella es verde, y no debería existir. Las estrellas son rojas, amarillas, blancas o azules, pero nunca
// verdes. ¿Qué le ha pasado a esta?»
// Un solo mundo: el cielo, con la estrella verde en el centro, y una cámara que viaja por él con la voz, mirándola
// siempre a ella.
// - Fotograma 0: pegados a su superficie verde, que hierve; la cámara ya se aleja. En «verde», el disco entero.
// - «no debería existir»: se aleja hasta que es un punto verde entre miles de estrellas que no lo son.
// - «Las estrellas son...»: la cámara gira despacio alrededor de la verde y, en cada color que se dice, una estrella
//   grande de ese color llega desde fuera, frena y se queda a su lado con su temperatura debajo (3.000, 5.500, 10.000 y
//   30.000 °C: es lo que les da el color). Se van sumando: en «azules» están las cuatro, bien a la vista.
// - «pero nunca verdes»: las cuatro se apagan un poco y la verde, sola en el centro, late en «verdes».
// - «¿Qué le ha pasado a esta?»: se lanza hacia ella entre las otras cuatro, llega a su superficie en «esta» y se queda
//   ahí, quieta. El plano siguiente sale de esta misma superficie, sin corte.
import * as k from "#kit";
import { v } from "#voz";
import { pastillaTemperatura, veloArriba } from "../mundo.js";

export const desde = 0;

const { suave, tramo, curva, sum, por, uni, mezV, res, pto, proyecta, F } = k;
const Tlas = v.t("las"), Tpero = v.t("pero"), Tverdes = v.t("verdes"), Tque = v.t("que"), Testa = v.t("esta", 2);

// ---------------------------------------------------------------- la cámara
const dirLejos = uni([-0.25, 0.18, 1]);
const ejes = (f) => { const r = uni(k.cruz(f, [0, 1, 0])); return { f, r, u: k.cruz(r, f) }; };
const E1 = ejes(por(dirLejos, -1));
// la distancia (en log): pegada a la superficie, ya alejándose en el fotograma 0; el disco entero en «verde»; perdida
// entre las demás al acabar «existir», y aún un poco más mientras empieza a girar
const lejos = curva([[0, Math.log(1.18)], [v.t("verde") + 0.3, Math.log(3.0)], [v.t("no"), Math.log(3.6)], [Tlas, Math.log(54)], [v.t("estrellas") + 0.3, Math.log(62)]], undefined, 0);
// el giro alrededor de la verde: arranca en «Las», va constante y frena antes de «verdes»
const VEL = 5, pasos = [], DT = 1 / 240;
const vel = (t) => VEL * suave(tramo(t, Tlas, Tlas + 0.55)) * (1 - suave(tramo(t, Tpero, Tverdes + 0.35)));
for (let tt = Tlas, xx = 0; tt <= Tque + 0.02; tt += DT) { pasos.push(xx); xx += vel(tt) * DT; }
const arco = (t) => (t <= Tlas ? 0 : pasos[Math.min(pasos.length - 1, Math.round((t - Tlas) / DT))]);
const donde = (t) => {
  const base = uni(mezV([0, 0, 1], dirLejos, suave(tramo(t, 0, Tlas)))), th = arco(t) / 62;
  return uni(sum(por(base, Math.cos(th)), por(E1.r, Math.sin(th))));
};
const dist = (t) => Math.exp(lejos(Math.min(t, v.t("estrellas") + 0.3)));
const P2dir = donde(Tque), d2 = dist(Tque);
// lanzarse: de donde esté hasta pegada a la superficie en «esta»; allí se para (lo que queda hasta el corte, quieta)
const dLanza = (t) => { const u = suave(tramo(t, Tque, Testa)); return Math.exp(Math.log(d2) + (Math.log(1.18) - Math.log(d2)) * u); };
const camara = (t) => {
  if (t < Tque) { const dir = donde(t); return { p: por(dir, dist(t)), e: ejes(por(dir, -1)) }; }
  return { p: por(P2dir, dLanza(t)), e: ejes(por(P2dir, -1)) };
};

// ---------------------------------------------------------------- las cuatro de colores
// Cada una llega desde fuera en su palabra, frena y se queda en su sitio alrededor de la verde (un sitio en pantalla
// tal y como lo ve la cámara a mitad de la lista; luego el giro las mueve un poco, como al resto del cielo).
const Tmedio = (v.t("rojas") + v.t("azules")) / 2, cm = camara(Tmedio), zV = pto(res([0, 0, 0], cm.p), cm.e.f);
const enMundo = (x, y, zExtra = 0) => sum(sum(por(cm.e.r, ((x - 540) * zV) / F), por(cm.e.u, ((960 - y) * zV) / F)), por(cm.e.f, zExtra));
const COLORES = [
  { color: "roja", palabra: "rojas", grados: 3000, rgb: "255,132,100", x: 300, y: 700, de: [-520, -260] },
  { color: "amarilla", palabra: "amarillas", grados: 5500, rgb: "255,224,130", x: 790, y: 760, de: [560, -300] },
  { color: "blanca", palabra: "blancas", grados: 10000, rgb: "246,248,255", x: 290, y: 1150, de: [-560, 280] },
  { color: "azul", palabra: "azules", grados: 30000, rgb: "165,200,255", x: 790, y: 1190, de: [560, 300] },
].map((h) => ({ ...h, t0: v.t(h.palabra) - 0.12, R: (112 * zV) / F, fin: enMundo(h.x, h.y), ini: enMundo(h.x + h.de[0], h.y + h.de[1], -18) }));
// dónde está cada una en t: llega en 0,5 s (rápido y frenando largo) y luego se queda
const posDe = (h, t) => k.mezV(h.ini, h.fin, k.entra(tramo(t, h.t0, h.t0 + 0.5)));

// ---------------------------------------------------------------- el cielo
const az = k.azar(5), cielo = [];
const clases = ["roja", "roja", "roja", "naranja", "naranja", "amarilla", "amarilla", "blanca", "blanca", "azul"];
const cerca = (X, Y, r) => { const d = res(X, Y); return pto(d, d) < r * r; };
const libre = (X) => {
  if (cerca(X, [0, 0, 0], 5)) return false;
  for (const h of COLORES) if (cerca(X, h.fin, 8)) return false;
  for (let s = 0; s <= 1; s += 0.1) if (cerca(X, por(donde(Tlas + (Tque - Tlas) * s), 62), 6)) return false;
  return true;
};
while (cielo.length < 3800) {
  const X = [(az() - 0.5) * 560, (az() - 0.5) * 560, -650 + az() * 720];
  if (libre(X)) cielo.push({ p: X, c: clases[Math.floor(az() * clases.length)], b: 0.35 + Math.pow(az(), 3) * 2.4, r: 0.05 + az() * 0.08 });
}
// algunas a media distancia, alrededor de por donde pasa la cámara, para que se vea que se mueve
for (let m = 0; m < 700; m++) {
  const base = por(donde(Tlas + (Tque - Tlas) * az()), 30 + az() * 60), Y = sum(base, [(az() - 0.5) * 70, (az() - 0.5) * 90, (az() - 0.5) * 70]);
  if (libre(Y)) cielo.push({ p: Y, c: clases[Math.floor(az() * clases.length)], b: 0.4 + Math.pow(az(), 2) * 1.6, r: 0.03 + az() * 0.05 });
}
// en «Las estrellas», cinco que pasan muy cerca, por encima y por debajo de la verde: así se nota el viaje
[[0.2, 1.1, 0.9, "azul"], [0.44, 1.4, -1.2, "amarilla"], [0.64, 0.9, 1.5, "roja"], [0.86, 1.5, -0.8, "blanca"], [1.08, 1.2, 1.1, "naranja"]].forEach((q) => {
  const c = camara(Tlas + q[0]);
  cielo.push({ p: sum(sum(sum(c.p, por(c.e.f, 4.2)), por(c.e.r, q[1])), por(c.e.u, q[2])), c: q[3], b: 1.6, r: 0.11, grande: true });
});
// y unas pocas muy cerca del camino, que cruzan cuando la cámara gira
for (let m = 0; m < 260; m++) {
  const b3 = donde(Tlas - 0.3 + (Tque - Tlas + 0.3) * az()), Z = sum(por(b3, 52 + az() * 14), [(az() - 0.5) * 30, (az() - 0.5) * 34, (az() - 0.5) * 30]);
  if (libre(Z)) cielo.push({ p: Z, c: clases[Math.floor(az() * clases.length)], b: 0.35 + az() * 0.9, r: 0.02 + az() * 0.03 });
}

// ---------------------------------------------------------------- cada fotograma
export function dibuja(g, t) {
  const cam = camara(t), antes = camara(t - 1 / 60);
  k.fondo(g, cam);
  k.estrellas(g, cam, antes, cielo);
  // lo que se dibuja, de lejos a cerca: la verde y las cuatro de colores
  const cosas = [];
  const V = proyecta(cam, [0, 0, 0]), radV = V ? F / V.z : 0;
  if (V) {
    const late = k.pulso(t, Tverdes + 0.15, 0.2) + 0.6 * k.pulso(t, v.t("verde") + 0.12, 0.2);
    cosas.push({ z: V.z, dibuja: () => k.estrella(g, "verde", V.x, V.y, radV, t * 0.09, late) });
  }
  // en «pero nunca verdes», las de colores se apagan un poco: la verde se queda sola
  const apaga = 1 - 0.55 * suave(tramo(t, Tpero, Tverdes));
  COLORES.forEach((h, i) => {
    if (t < h.t0) return;
    const P = proyecta(cam, posDe(h, t));
    if (!P) return;
    const r = (F * h.R) / P.z;
    if (P.x + r * 2.4 < 0 || P.x - r * 2.4 > 1080 || P.y + r * 2.4 < 0 || P.y - r * 2.4 > 1920) return;
    cosas.push({ z: P.z, dibuja: () => {
      k.estrellaTransparente(g, h.color, P.x, P.y, r, t * 0.12 + i, 0.15 * k.pulso(t, h.t0 + 0.5, 0.15), apaga);
      // su temperatura, debajo, contando hasta su número (mientras no se lance la cámara)
      const cuenta = k.entra(tramo(t, h.t0 + 0.2, h.t0 + 0.55)), al = tramo(t, h.t0 + 0.15, h.t0 + 0.35) * (1 - tramo(t, Tque, Tque + 0.2));
      if (al > 0) pastillaTemperatura(g, P.x, P.y + r + 70, h.grados * cuenta, h.rgb, al * (0.45 + 0.55 * apaga), 56);
    } });
  });
  k.deLejosACerca(cosas);
  // un velo suave arriba cuando la superficie llena la pantalla, para que se lea el subtítulo
  veloArriba(g, radV);
}

// Para el sonido: cuándo llega cada una (sonidos.js).
export const llegadas = COLORES.map((h) => ({ t: h.t0, color: h.color }));
