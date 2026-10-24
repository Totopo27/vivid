// «Pero si bebes mucho y deprisa, el alcohol te inunda la sangre de golpe...»
// Otro sitio: dentro de una vena, viajando con la sangre. Se entra con un corte en «Pero».
// - «Pero si bebes»: un túnel rojo, con sus glóbulos rojos que vienen hacia la cámara girando.
// - «mucho y deprisa»: la corriente se acelera.
// - «el alcohol»: aparecen las primeras moléculas de alcohol (bolas y palitos: dos carbonos, un oxígeno y sus
//   hidrógenos), con su brillo ámbar.
// - «te inunda la sangre de golpe»: llegan a cientos; en «golpe», un fogonazo ámbar y todo el túnel se vuelve ámbar.
//   Reposa un momento antes del corte.
import * as k from "#kit";
import { v } from "#voz";

export const desde = (vz) => vz.frase(5).inicio;

const { suave: su, tramo: tr, mez, azar, proyecta, F } = k;
const f5 = v.frase(5);
const T0 = f5.inicio, Tdep = f5.t("deprisa"), Talc = f5.t("alcohol"), Tinu = f5.t("inunda"), Tgol = f5.t("golpe"), Ty = f5.t("y", 2);
export const golpe = Tgol + 0.05;

// lo que se ha avanzado por el túnel: deprisa en «deprisa», más en «golpe», y frena antes del corte
const vel = (t) => (2.2 + 4.5 * su(tr(t, Tdep - 0.2, Tdep + 0.4)) + 5 * k.pulso(t, Tgol + 0.1, 0.3)) * (1 - 0.97 * su(tr(t, Tgol + 0.15, Ty - 0.12)));
const PASOS = [];
for (let tt = T0 - 0.1, d = 0; tt < 30; tt += 1 / 120) { PASOS.push(d); d += vel(tt) / 120; }
const avance = (t) => PASOS[Math.max(0, Math.min(PASOS.length - 1, Math.round((t - (T0 - 0.1)) * 120)))];

const R = 1.5, LARGO = 34;
const eje = (z) => [0.35 * Math.sin(z * 0.13), 0.25 * Math.cos(z * 0.11), 0];
const cam = k.mira([0, 0, 0], [0, 0, -1]);

// los glóbulos rojos
const az = azar(909);
const GLOBULOS = Array.from({ length: 80 }, () => { const a = az() * 6.2832, r = Math.sqrt(az()) * 1.15; return { x: Math.cos(a) * r, y: Math.sin(a) * r, z0: az() * LARGO, gira: az() * 6.28, vg: (az() - 0.5) * 2.5, inc: az() * 1.2, s: 0.16 + az() * 0.05 }; });
// las moléculas de alcohol: cada una aparece en su momento, cada vez más
const MOLES = Array.from({ length: 170 }, (_, i) => { const a = az() * 6.2832, r = Math.sqrt(az()) * 1.25; const u = Math.pow(i / 170, 0.7); return { x: Math.cos(a) * r, y: Math.sin(a) * r, z0: 2 + az() * (LARGO - 4), nace: mez(Talc - 0.1, Tgol, u), gira: az() * 6.28, vg: (az() - 0.5) * 3, s: 0.11 + az() * 0.05 }; });

// un glóbulo rojo: un disco con el centro hundido, inclinado
function globulo(g, x, y, r, ang, inc, al) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(inc))); g.globalAlpha = al;
  const gr = g.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.1, 0, 0, r);
  gr.addColorStop(0, "#8d0f1c"); gr.addColorStop(0.45, "#a3141f"); gr.addColorStop(0.75, "#e2394a"); gr.addColorStop(0.92, "#ff6a74"); gr.addColorStop(1, "#7a0a14");
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.fill();
  g.fillStyle = "rgba(255,200,200,0.25)"; g.beginPath(); g.ellipse(-r * 0.35, -r * 0.45, r * 0.35, r * 0.15, -0.5, 0, 6.2832); g.fill();
  g.restore();
}
// una molécula de alcohol (etanol): C-C-O con sus hidrógenos, de bolas y palitos, brillando en ámbar
const ATOMOS = [[-0.55, 0, 0, "c"], [0.15, 0.25, 0, "c"], [0.75, -0.2, 0, "o"], [1.2, 0.05, 0, "h"], [-0.8, 0.5, 0, "h"], [-0.95, -0.35, 0, "h"], [-0.45, -0.3, 0.6, "h"], [0.2, 0.75, 0.2, "h"], [0.25, 0.3, -0.6, "h"]];
const ENLACES = [[0, 1], [1, 2], [2, 3], [0, 4], [0, 5], [0, 6], [1, 7], [1, 8]];
const COLA = { c: ["#5a5a62", "#c9c9d2"], o: ["#c3202c", "#ff8a8a"], h: ["#d8d8de", "#ffffff"] }, TAM = { c: 0.32, o: 0.3, h: 0.2 };
function molecula(g, x, y, s, ang, al) {
  g.save(); g.globalAlpha = al;
  k.brillo(g, x, y, s * 7, "255,170,50", 0.35);       // muchas juntas: la luz se suma
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const P = ATOMOS.map(([ax, ay, az2, t]) => ({ x: x + (ax * ca - az2 * sa) * s * 1.6, y: y + ay * s * 1.6, z: ax * sa + az2 * ca, t }));
  g.strokeStyle = "rgba(230,220,210,0.9)"; g.lineWidth = s * 0.18; g.lineCap = "round";
  for (const [a, b] of ENLACES) { g.beginPath(); g.moveTo(P[a].x, P[a].y); g.lineTo(P[b].x, P[b].y); g.stroke(); }
  for (const p of P.slice().sort((a, b) => a.z - b.z)) {
    const r = TAM[p.t] * s * 1.5, gr = g.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, r * 0.1, p.x, p.y, r);
    gr.addColorStop(0, COLA[p.t][1]); gr.addColorStop(1, COLA[p.t][0]);
    g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, r, 0, 6.2832); g.fill();
  }
  g.restore();
}

export function dibuja(g, t) {
  const d = avance(t), ambar = su(tr(t, Tinu - 0.1, Tgol + 0.2));
  // el fondo del túnel: oscuro en el fondo, rojo alrededor
  g.fillStyle = "#1a0306"; g.fillRect(0, 0, 1080, 1920);
  // los anillos de la pared, de lejos a cerca (con la textura que pasa)
  for (let i = 44; i >= 0; i--) {
    const zz = i * 0.8 - (d % 0.8) + 0.4, z = -zz, c = eje(zz + d);
    const P = proyecta(cam, [c[0], c[1], z]);
    if (!P) continue;
    const r = (F * R) / P.z, luz = Math.min(1, 2.5 / P.z);
    const col = k.mezRgb(k.mezRgb("120,10,25", "230,60,70", luz), k.mezRgb("120,60,10", "255,170,60", luz), ambar * 0.85);
    g.strokeStyle = `rgba(${col},${0.55 + 0.45 * luz})`; g.lineWidth = Math.max(2, (F * 0.42) / P.z);
    g.beginPath(); g.arc(P.x, P.y, r, 0, 6.2832); g.stroke();
  }
  g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.45; g.drawImage(k.manchas, -200 + Math.sin(d) * 30, -300, 1480, 2520); g.restore();
  // lo que viaja por dentro, de lejos a cerca
  const cosas = [];
  for (const q of GLOBULOS) {
    const zz = ((q.z0 - d) % LARGO + LARGO) % LARGO + 0.3, c = eje(zz + d);
    const P = proyecta(cam, [c[0] + q.x, c[1] + q.y, -zz]);
    if (!P) continue;
    const r = (F * q.s) / P.z, al = Math.min(1, (LARGO - zz) / 6) * Math.min(1, zz / 0.6) * (1 - 0.35 * ambar);
    cosas.push({ z: P.z, dibuja: () => globulo(g, P.x, P.y, r, q.gira + q.vg * Math.min(t, Ty - 0.15), q.inc + Math.min(t, Ty - 0.15) * 0.8, al) });
  }
  for (const q of MOLES) {
    if (t < q.nace) continue;
    const zz = ((q.z0 - d) % LARGO + LARGO) % LARGO + 0.3, c = eje(zz + d);
    const P = proyecta(cam, [c[0] + q.x, c[1] + q.y, -zz]);
    if (!P) continue;
    const s = (F * q.s) / P.z, al = Math.min(1, (t - q.nace) / 0.15) * Math.min(1, zz / 0.6) * Math.min(1, (LARGO - zz) / 6);
    cosas.push({ z: P.z, dibuja: () => molecula(g, P.x, P.y, s, q.gira + q.vg * Math.min(t, Ty - 0.15), al) });
  }
  k.deLejosACerca(cosas);
  // todo se tiñe de ámbar; el fogonazo en «golpe»
  if (ambar > 0) { g.save(); g.globalCompositeOperation = "lighter"; const ag = g.createRadialGradient(540, 960, 100, 540, 960, 1200); ag.addColorStop(0, `rgba(255,150,40,${0.18 * ambar})`); ag.addColorStop(1, `rgba(255,120,20,${0.12 * ambar})`); g.fillStyle = ag; g.fillRect(0, 0, 1080, 1920); g.restore(); }
  k.brillo(g, 540, 960, 2600, "255,190,90", 0.5 * k.pulso(t, golpe, 0.12));
  // la luz del fondo del túnel
  const fondo = proyecta(cam, [eje(LARGO + d)[0], eje(LARGO + d)[1], -LARGO]);
  if (fondo) k.brillo(g, fondo.x, fondo.y, 500, ambar > 0.5 ? "255,170,60" : "255,90,90", 0.3);
  const vg = g.createLinearGradient(0, 180, 0, 640); vg.addColorStop(0, "rgba(20,3,5,0.55)"); vg.addColorStop(1, "rgba(20,3,5,0)");
  g.fillStyle = vg; g.fillRect(0, 0, 1080, 640);
}

export const momentos = { acelera: Tdep, alcohol: Talc, golpe };
