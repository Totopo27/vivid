// Los efectos: cada uno en lo que se mueve, en el fotograma en que se mueve (mira guia/sonido.md).
import { v } from "#voz";
import { momentos as m1 } from "./video/planos/01-fiesta.js";
import { momentos as m2 } from "./video/planos/02-manana.js";
import { momentos as m4 } from "./video/planos/04-cerebro.js";
import { momentos as m5 } from "./video/planos/05-sangre.js";
import { momentos as m6 } from "./video/planos/06-neuronas.js";
import { momentos as m7 } from "./video/planos/07-movil.js";
import { momentos as m8 } from "./video/planos/08-final.js";

const e = [];
const pon = (sonido, t, o = {}) => e.push({ sonido, t, ...o });
const f2 = v.frase(2), f3 = v.frase(3), f5 = v.frase(5), f7 = v.frase(7), f10 = v.frase(10);

// la discoteca: la bola gira, la cámara baja de golpe, el hielo, el chorro y la salpicadura
pon("aire", 0.0, { ancla: "empieza", db: -9, vel: 1.1, que: "el viaje entre rayos de luz" });
pon("aire", m1.flash, { ancla: "empieza", db: -13, vel: 1.4, que: "fogonazo en el viaje" });
pon("empujon", m1.llegaBola, { db: -7, que: "llega la bola de espejos" });
pon("empujon", m1.baja + 0.38, { db: -9, que: "la cámara baja de golpe a la barra" });
pon("cristal", m1.chorro + 0.05, { db: -13, que: "el hielo al caer el chorro" });
pon("golpe", m1.salpica, { db: -11, vel: 1.2, que: "la salpicadura" });
// la mañana: el sol, las grietas y el recuerdo que revienta
pon("aire", m2.sol + 0.1, { ancla: "empieza", db: -13, vel: 0.6, que: "el fogonazo de sol" });
pon("cruje", m2.grietas[0] + 0.05, { db: -12, que: "primera grieta" });
pon("cruje", m2.grietas[1] + 0.05, { db: -11, vel: 1.1, que: "más grietas" });
pon("cristal", m2.rompe, { db: -7, vel: 0.8, que: "el recuerdo revienta" });
pon("estallido", m2.rompe + 0.02, { db: -11, lp: 3000, que: "los trozos salen volando" });
// la película: la tarta que se destiñe, la cámara que baja, la luz que pasa por lo negro
pon("desliza", f2.t("es", 2), { db: -14, que: "la cámara baja por la película" });
pon("hueco", f2.t("grabarlo"), { db: -13, que: "la luz pasa por los fotogramas negros" });
pon("aire", f2.t("olvidado") - 0.05, { ancla: "empieza", db: -17, vel: 0.5, que: "la tarta se destiñe" });
// el cerebro de luz
pon("aire", f3.inicio + 0.05, { ancla: "empieza", db: -14, vel: 0.7, que: "la cabeza y el cerebro" });
pon("aire", f3.t("tienes"), { ancla: "empieza", db: -14, vel: 0.8, que: "la cámara entra" });
pon("clic", m4.rec, { db: -11, que: "se enciende el piloto REC" });
pon("clic", f3.t("hipocampo"), { db: -13, vel: 0.9, que: "aparece su nombre" });
pon("aire", f3.t("hipocampo") + 0.6, { ancla: "empieza", db: -17, vel: 0.5, que: "el hipocampo late" });
m4.llegadas.forEach((t, i) => pon("aire", t, { ancla: "empieza", db: -16 + i, vel: 1.2, que: "llega un momento" }));
pon("tic", m4.llegadas[2] + 1.2, { db: -17, que: "cuenta atrás" });
pon("tic", m4.llegadas[2] + 1.9, { db: -17, vel: 1.1, que: "cuenta atrás" });
pon("sube", m4.dispara + 0.05, { db: -9, que: "el hipocampo dispara la copia" });
pon("late", m4.guarda + 0.05, { db: -10, que: "la memoria se guarda" });
// la sangre
pon("aire", f5.inicio + 0.3, { ancla: "empieza", db: -13, vel: 0.6, que: "viajando por la vena" });
pon("empujon", m5.acelera + 0.35, { db: -11, que: "la corriente se acelera" });
pon("sube", m5.alcohol, { db: -12, vel: 0.8, que: "llega el alcohol" });
pon("golpe-hondo", m5.golpe, { db: -7, que: "el alcohol inunda de golpe" });
// las neuronas que se apagan, y lo que ya no se copia
m6.apagan.slice().sort((a, b) => a - b).filter((t, i, l) => i === 0 || t - l[i - 1] > 0.12).slice(0, 6).forEach((t, i) => pon("clic", t, { db: -14 - (i % 2) * 2, vel: 0.85 + (i % 3) * 0.08, que: "se apaga una neurona" }));
m6.llegadas.forEach((t, i) => pon("aire", t, { ancla: "empieza", db: -16 + i, vel: 1.2, que: "llega un momento" }));
pon("tic", m6.llegadas[2] + 1.3, { db: -17, que: "cuenta atrás" });
pon("sube", m6.intenta, { db: -11, que: "el haz intenta salir" });
pon("cristal", m6.intenta + 0.4, { db: -15, vel: 1.3, que: "se deshace en chispas" });
// el móvil
pon("aire", f7.inicio + 0.3, { ancla: "empieza", db: -16, vel: 0.7, que: "el móvil se acerca" });
pon("toque", f7.inicio + 0.2, { db: -14, que: "empieza a grabar" });
pon("aviso", m7.aviso + 0.02, { db: -8, que: "salta «Almacenamiento lleno»" });
pon("aire", f7.t("pantalla"), { ancla: "empieza", db: -17, vel: 0.6, que: "la fiesta sigue en la pantalla" });
pon("desliza", m7.galeria + 0.05, { db: -13, que: "se abre la galería vacía" });
// la película otra vez
pon("desliza", v.frase(8).inicio + 0.3, { db: -15, que: "bajando por lo negro" });
pon("clic", m8.mitad, { db: -12, que: "1 de cada 2" });
pon("desliza", v.frase(8).t("pasa"), { db: -16, vel: 0.9, que: "sigue bajando por lo negro" });
pon("aire", v.frase(8).t("manana") + 0.3, { ancla: "empieza", db: -13, vel: 0.6, que: "la cámara vuelve a subir a lo negro" });
pon("sube", m8.despierta - 0.1, { db: -11, vel: 0.9, que: "se enciende la mañana" });
pon("late", m8.despierta + 0.1, { db: -11, que: "el golpe de luz de la mañana" });
pon("clic", m8.linterna - 0.1, { db: -11, vel: 0.8, que: "se enciende la linterna" });
pon("aire", m8.linterna + 0.6, { ancla: "empieza", db: -16, vel: 0.6, que: "la linterna busca" });
pon("aire", v.frase(9).t("nunca"), { ancla: "empieza", db: -16, vel: 0.7, que: "la linterna se para" });
pon("aire", f10.inicio + 0.1, { ancla: "empieza", db: -13, vel: 0.5, que: "la cámara se aleja" });
pon("desliza", f10.t("siempre"), { db: -16, que: "la película entera" });
pon("late", m8.todo + 0.15, { db: -9, que: "todos los recuerdos se encienden" });

export default e;
