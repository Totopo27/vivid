// Los efectos de la estrella verde. Cada uno va en lo que la imagen hace, en el fotograma en que lo hace y lo que dura:
// la cámara que se aleja o se lanza (un aire, o un empujón), cada estrella que llega (un aire) y su temperatura que
// sube (sus tics), lo que aparece o se para (un clic), la verde cuando late (siempre el mismo sonido: es su sello),
// lo que se desploma o revienta (un empujón que acaba en un estallido), el planeta que se parte (un crujido de piedra),
// cada choque (un golpe sordo; el grande, más hondo) y la sal en el salero (su traqueteo). Sin huecos largos y nada
// en un corte. Los momentos salen de los propios planos: si cambian, el sonido los sigue.
import { v } from "#voz";
import { llegadas } from "./video/planos/01-cielo.js";
import { choques, revienta, roturas } from "./video/planos/02-sistema.js";
import { corte as Tcocina, sacudidas } from "./video/planos/03-cocina.js";
import { choquesFinal, momentos as M } from "./video/planos/04-estrella.js";

const e = [];
const pon = (sonido, t, o = {}) => e.push({ sonido, t, ...o });
const f2 = v.frase(2), f3 = v.frase(3), f5 = v.frase(5), f6 = v.frase(6), f7 = v.frase(7), f11 = v.frase(11);

// ---------------------------------------------------------------- el cielo
pon("aire", 0, { ancla: "empieza", db: -11, vel: 0.8, que: "la cámara se aleja de su superficie" });
pon("aire", (v.t("no") + f2.t("las")) / 2, { db: -10, vel: 0.62, que: "se aleja hasta perderla entre las demás" });
pon("aire", f2.t("las") + 0.44, { db: -15, vel: 1.05, que: "pasan estrellas cerca" });
pon("aire", f2.t("las") + 0.86, { db: -16, vel: 0.95 });
// cada estrella de color llega y frena (un aire), y su temperatura sube hasta su número (un tic cada cuarto)
llegadas.forEach((l, i) => {
  pon("aire", l.t + 0.12, { db: -11, vel: [0.95, 1.02, 1.08, 0.98][i], que: i ? "" : "llega cada estrella de color" });
  [0.232, 0.272, 0.33, 0.55].forEach((d, j) => pon("tic", l.t + d, { db: j === 3 ? -14 : -17, vel: [1.12, 1.04, 1.18, 0.96][j], que: i || j ? "" : "su temperatura sube" }));
});
pon("late", f2.t("verdes") + 0.15, { db: -13, vel: 0.92, que: "la verde late" });
pon("empujon", f3.t("que") + 0.45, { db: -7, que: "se lanza hacia ella" });
pon("aire", f3.t("que") + 0.4, { db: -12, vel: 0.85 });

// ---------------------------------------------------------------- su pasado
pon("aire", v.t("que", 2) + 0.25, { db: -11, vel: 0.7, que: "se aleja de su superficie y vuelve a ser la que fue" });
const Tm = v.t("murio");
pon("empujon", Tm + 0.22, { db: -9, que: "se hincha y se desploma" });
pon("estallido", Tm + 0.46, { db: -7, vel: 0.85, lp: 1400, que: "el fogonazo y la onda" });
pon("clic", f5.t("sol") - 0.04, { db: -13, que: "aparece el tamaño que tenía" });
pon("aire", f5.t("una", 2) + 0.06, { db: -11, vel: 0.65, que: "entra la Tierra" });
pon("clic", v.t("tierra") - 0.02, { db: -14, vel: 0.92, que: "se para a su lado: igual de grandes" });
pon("aire", (v.t("pesa") - 0.1 + v.t("medio") - 0.02) / 2, { db: -10, vel: 0.75, que: "sube el medio Sol" });
pon("empujon", f5.t("sol", 2) - 0.18, { db: -9, que: "se aprieta dentro de la bolita" });
pon("golpe", f5.t("sol", 2) + 0.03, { db: -10, vel: 0.9, que: "y destella" });
pon("aire", f6.t("sus") + 0.45, { db: -12, vel: 0.55, que: "la cámara se aleja y sube hasta ver sus planetas" });
pon("roca", roturas[0].t, { db: -10, vel: 0.95, que: "se parte el planeta pequeño" });
pon("roca", roturas[1].t, { db: -7, vel: 0.78, que: "se parte el grande" });
pon("aire", roturas[1].t + 0.16, { db: -13, vel: 0.8 });
pon("aire", v.t("girando") + 0.2, { db: -15, vel: 0.5, que: "un trozo pasa por delante" });
// los choques: los grandes, que se ven más, sin dos en menos de 0,11 s; el más grande, más hondo
{
  let antes = -1, n = 0;
  for (const c of choques) {
    if (c.grande) { pon("golpe-hondo", c.t, { db: -8, vel: 0.9, que: "la roca grande" }); continue; }
    if (c.s <= 0.15 || c.t - antes < 0.11) continue;
    pon("golpe", c.t, { db: -15 - 2 * (n % 2), vel: [1.1, 0.95, 1.2, 1.0, 1.15, 0.9][n % 6], que: n ? "" : "las rocas chocan con ella" });
    antes = c.t; n++;
  }
}
pon("aire", f7.palabras[0].inicio + 0.65, { db: -12, vel: 0.5, que: "la cámara baja hasta rozarla" });
pon("empujon", revienta - 0.2, { db: -10, que: "el trozo se pone al rojo" });
pon("estallido", revienta, { db: -7, vel: 1.05, lp: 3200, corta: Tcocina, que: "revienta en vapor naranja" });

// ---------------------------------------------------------------- la cocina
pon("aire", Tcocina + 0.1, { db: -13, que: "entra el salero" });   // en su movimiento, no en el corte
sacudidas.forEach((t, k) => pon("tic", t, { db: k ? -16 - (k % 2) : -18, vel: k % 2 ? 1.15 : 1.0, lp: 6000, que: k ? "" : "la sal en el salero" }));
pon("aire", (Tcocina + 0.5 + f7.t("tienes") + 0.15) / 2, { db: -16, vel: 0.55, que: "la llama se aviva" });

// ---------------------------------------------------------------- la estrella, otra vez
pon("aire", v.t("aire") + 0.3, { db: -10, vel: 0.55, que: "vuela rozando su superficie" });
pon("aire", (M.Tes + M.Tagua) / 2, { db: -12, vel: 0.5, que: "se mete en su aire" });
pon("clic", M.Tsodio - 0.04, { db: -13, que: "se enciende el sodio" });
pon("sube", M.Tno + 0.02, { db: -12, vel: 0.8, que: "suben los rayos" });
pon("clic", M.Tno + 0.6, { db: -16, vel: 1.1, que: "el sodio coge el naranja" });
pon("clic", M.Tnar + 0.1, { db: -12, vel: 0.85 });
pon("aire", M.Tfuera + 0.75, { db: -11, vel: 0.5, que: "sale hasta verla entera" });
pon("late", M.Tverde + 0.04, { db: -12, vel: 0.92, que: "la verde late" });
// la vuelta atrás: un estallido al revés, grave, que crece mientras gira hacia atrás y acaba cuando ya es amarilla
pon("estallido", M.Tnac + 0.4, { reves: true, db: -13, vel: 0.9, lp: 1500, que: "vuelve atrás, a cuando nació" });
pon("empujon", M.TesF + 0.05, { db: -10, que: "se encoge hasta la bolita" });
{
  let n = 0;
  for (const c of choquesFinal) {
    if (c.grande) pon("golpe-hondo", c.t, { db: -7, vel: 0.85, que: "el trozo más grande, y se pone verde" });
    else if (c.s > 50) { pon("golpe", c.t, { db: -16 - (n % 2), vel: [1.05, 1.2, 0.95, 1.1][n % 4], que: n ? "" : "le caen los trozos" }); n++; }
  }
}
pon("aire", f11.t("enviaselo") + 0.75, { db: -9, vel: 0.45, que: "se aleja hasta ver la galaxia" });
pon("aire", M.Tesp - 0.32, { db: -13, vel: 0.55 });
pon("clic", M.Tesp + 0.04, { db: -12, que: "se marca: a 280 años luz" });
pon("late", M.Tdes + 0.15, { db: -12, vel: 0.92, que: "la verde late" });

export default e;
