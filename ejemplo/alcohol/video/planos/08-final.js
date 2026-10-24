// «Por eso, a la mitad de los que les pasa, lo siguiente que recuerdan es despertarse por la mañana. Así que no
// busques esa noche: no se perdió, es que nunca entró. Envíaselo a ese amigo que siempre dice que él se acuerda de
// todo.»
// La película de tu memoria otra vez, con una sola cámara. Se vuelve con un corte en «Por».
// - «Por eso»: bajando por los fotogramas negros de anoche. «a la mitad»: «1 de cada 2».
// - «lo siguiente que recuerdan»: se acaban los negros... y en «despertarse» se enciende el siguiente: la ventana con
//   el sol y la cama deshecha, con un golpe de luz de mañana.
// - «Así que no busques esa noche»: la cámara vuelve a subir a lo negro y una linterna lo recorre buscando; «no se
//   perdió»: nada; «es que nunca entró»: la linterna se para en un fotograma vacío.
// - «Envíaselo...»: la cámara se aleja hasta ver la película entera, larga, con sus recuerdos de colores y el tramo
//   negro en medio; en «todo», todos los recuerdos se encienden a la vez, menos ese.
import * as k from "#kit";
import { v } from "#voz";
import { C, FH, NEGRO0, NEGRO1, MANANA, tira, fondoPelicula } from "./03-pelicula.js";

export const desde = (vz) => vz.frase(8).inicio;

const { suave: su, tramo: tr, mez, proyecta, F } = k;
const f8 = v.frase(8), f9 = v.frase(9), f10 = v.frase(10);
const T0 = f8.inicio, Tmit = f8.t("mitad"), Tsig = f8.t("siguiente"), Tdes = f8.t("despertarse"), Tman = f8.t("manana");
const Tbus = f9.t("busques"), Tnoc = f9.t("noche"), Tper = f9.t("perdio"), Tnun = f9.t("nunca"), Tent = f9.t("entro");
const Tenv = f10.inicio, Ttodo = f10.t("todo"), Fin = v.duracion;

const sMan = (MANANA + 0.5) * FH, sNoche = ((NEGRO0 + NEGRO1) / 2 + 0.5) * FH;
const sCam = k.claves([[T0, (NEGRO0 + 3.4) * FH], [Tsig, (NEGRO1 - 0.6) * FH], [Tdes + 0.1, sMan], [Tman + 0.5, sMan + 0.05], [Tbus + 0.2, sNoche + 0.6], [Tent + 0.3, sNoche - 0.3], [Tenv + 0.2, sNoche], [Fin, sNoche - 0.5]]);
const dist = k.claves([[T0, 2.7], [Tsig, 2.5], [Tdes + 0.1, 1.75], [Tman + 0.5, 1.7], [Tbus + 0.2, 2.6], [Tent + 0.3, 2.3], [Tenv + 0.2, 3.2], [Ttodo - 0.2, 10.5], [Fin, 11.2]]);
const camara = (t) => { const s = sCam(t), c = C(s), d = dist(t), ab = tr(d, 3, 10.5); return k.mira([c[0] + 0.25 + 1.5 * ab, c[1] + 0.35 + 1.2 * ab, c[2] + d], [c[0], c[1] - 0.12, c[2]]); };

// la linterna: un círculo de luz que recorre lo negro
const linterna = (t) => {
  const al = su(tr(t, Tbus - 0.1, Tbus + 0.2)) * (1 - su(tr(t, Tent + 0.5, Tenv + 0.1)));
  const s = k.claves([[Tbus, sNoche + 2.2], [Tper, sNoche - 1.2], [Tnun, sNoche + 0.9], [Tent + 0.2, sNoche - 0.3]])(t);
  const x = 0.35 * Math.sin(t * 3.1);
  return { al, s, x };
};

export function dibuja(g, t) {
  const cam = camara(t), s0 = sCam(t), lejos = tr(dist(t), 3, 10.5);
  fondoPelicula(g, cam, s0);
  const sol = su(tr(t, Tdes - 0.05, Tdes + 0.25));
  const todo = 1.6 * k.pulso(t, Ttodo + 0.15, 0.3) + 0.35 * su(tr(t, Tenv, Ttodo));
  const L = linterna(t);
  tira(g, cam, s0, {
    alcance: mez(7, 26, lejos),
    luzNegro: (f) => (L.al > 0 ? L.al * Math.max(0, 1 - Math.abs((f.i + 0.5) * FH - L.s) / 0.9) * 0.6 : 0),
    viejo: () => 0,
    brillo: (f) => (f.i === MANANA ? 0.15 * sol + 0.3 * k.pulso(t, Tdes + 0.1, 0.25) : 0) + 0.45 * todo,
  });
  // la mañana: un golpe de luz cálida al encenderse
  const Pm = proyecta(cam, C(sMan));
  if (Pm) k.brillo(g, Pm.x, Pm.y, 2200, "255,225,160", 0.5 * k.pulso(t, Tdes + 0.08, 0.2));
  // la linterna, encima
  if (L.al > 0.01) {
    const c = C(L.s), P = proyecta(cam, [c[0] + L.x, c[1], c[2]]);
    if (P) {
      const r = (F * 0.42) / P.z;
      g.save(); g.globalCompositeOperation = "lighter";
      const cg = g.createLinearGradient(1180, 2100, P.x, P.y); cg.addColorStop(0, `rgba(255,245,220,${0.25 * L.al})`); cg.addColorStop(1, `rgba(255,245,220,${0.08 * L.al})`);
      g.fillStyle = cg; g.beginPath(); g.moveTo(1180, 2050); g.lineTo(1080, 2150); g.lineTo(P.x - r, P.y + r * 0.3); g.lineTo(P.x + r, P.y - r * 0.3); g.closePath(); g.fill();
      const lg = g.createRadialGradient(P.x, P.y, 0, P.x, P.y, r); lg.addColorStop(0, `rgba(255,248,230,${0.35 * L.al})`); lg.addColorStop(0.7, `rgba(255,240,210,${0.18 * L.al})`); lg.addColorStop(1, "rgba(255,240,210,0)");
      g.fillStyle = lg; g.beginPath(); g.arc(P.x, P.y, r, 0, 6.2832); g.fill();
      g.restore();
    }
  }
  // «1 de cada 2»
  const mit = su(tr(t, Tmit - 0.1, Tmit + 0.2)) * (1 - su(tr(t, Tsig + 0.4, Tdes - 0.1)));
  if (mit > 0) k.pastilla(g, 540, 1180, "1 de cada 2", "", "255,226,170", mit, 120);
  const vg = g.createLinearGradient(0, 180, 0, 640); vg.addColorStop(0, "rgba(5,3,6,0.6)"); vg.addColorStop(1, "rgba(5,3,6,0)");
  g.fillStyle = vg; g.fillRect(0, 0, 1080, 640);
}

export const momentos = { mitad: Tmit, despierta: Tdes, linterna: Tbus, todo: Ttodo };
