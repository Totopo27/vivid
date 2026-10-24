// Las muestras de las personas (guia/muestras/personas.jpg): una persona en sus poses, girando, con otra piel y otra
// ropa, a contraluz; y la multitud: un estadio, un concierto, «1 de cada 4» y una persona sola frente a algo enorme.
// Cada una pinta un cuadrado de 1080 × 1080 (lo de arriba del lienzo de 1080 × 1920).
import * as k from "#kit";

const L = 1080;
const suelo = (g, arriba = "#1d2536", abajo = "#3c4558", y = 860) => {
  const cg = g.createLinearGradient(0, 0, 0, y); cg.addColorStop(0, arriba); cg.addColorStop(1, abajo); g.fillStyle = cg; g.fillRect(0, 0, L, y);
  const sg = g.createLinearGradient(0, y, 0, L); sg.addColorStop(0, "#2a2f3a"); sg.addColorStop(1, "#14161c"); g.fillStyle = sg; g.fillRect(0, y, L, L - y);
  g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.25; g.drawImage(k.manchas, 0, y, L, L - y); g.restore();
};
// los focos de un escenario: haces de colores que bajan abiertos desde arriba
const focos = (g, x, y, al) => {
  g.save(); g.globalCompositeOperation = "lighter";
  ["190,120,255", "255,90,200", "120,200,255", "255,90,200", "190,120,255"].forEach((c, i) => {
    const a = Math.PI / 2 + (i - 2) * 0.32, Lh = 1100, x2 = x + Math.cos(a) * Lh, y2 = y + Math.sin(a) * Lh, px = -Math.sin(a) * 150, py = Math.cos(a) * 150;
    const gr = g.createLinearGradient(x, y, x2, y2); gr.addColorStop(0, `rgba(${c},${0.55 * al})`); gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x2 - px, y2 - py); g.lineTo(x2 + px, y2 + py); g.lineTo(x + 6, y); g.closePath(); g.fill();
  });
  g.restore();
};
const banco = (g, x, y, w, h) => { const bg = g.createLinearGradient(0, y - h, 0, y); bg.addColorStop(0, "#6b5040"); bg.addColorStop(1, "#3a2a20"); g.fillStyle = bg; k.redondo(g, x - w / 2, y - h, w, h * 0.22, 6); g.fill(); g.fillStyle = "#2a2a2e"; g.fillRect(x - w / 2 + 12, y - h * 0.78, 10, h * 0.78); g.fillRect(x + w / 2 - 22, y - h * 0.78, 10, h * 0.78); };

export default [
  ["persona(g, x, y, alto, { pose }): de pie, andando…", (g) => {
    suelo(g);
    k.persona(g, 200, 960, 760, { semilla: 5, pose: "de pie", gira: 0.25 });
    k.persona(g, 540, 960, 740, { semilla: 8, pose: "andando", gira: 1.2, t: 0.15 });
    k.persona(g, 880, 960, 740, { semilla: 12, pose: "corre", gira: -1.25, t: 0.3 });
  }],
  ["señala · celebra · aplaude · sentada", (g) => {
    suelo(g);
    k.persona(g, 150, 980, 620, { semilla: 21, pose: "señala", gira: 0.5, lado: 1, hacia: 1.2, alza: 0.4 });
    k.persona(g, 420, 980, 620, { semilla: 3, pose: "celebra", t: 0.1 });
    k.persona(g, 680, 980, 620, { semilla: 14, pose: "aplaude", gira: -0.3, t: 0.2 });
    banco(g, 925, 985, 260, 160);
    k.persona(g, 925, 985, 620, { semilla: 30, pose: "sentada", gira: -0.55 });
  }],
  ["gira: de frente, de lado, de espaldas", (g) => {
    suelo(g, "#20283a", "#465068");
    [0, 0.8, 1.57, 2.4, 3.14].forEach((gira, i) => k.persona(g, 120 + i * 210, 930, 640, { semilla: 41, gira, largo: true, cuerpo: 0.1, pelo: "#5e3b1f" }));
  }],
  ["piel, ropa, pelo, cuerpo (aspecto(semilla))", (g) => {
    suelo(g, "#2a2230", "#54485a");
    for (let i = 0; i < 6; i++) k.persona(g, 110 + i * 172, 930, 560 + (i % 3) * 30, { semilla: 60 + i * 7, gira: (i - 2.5) * 0.12, t: i * 0.4 });
  }],
  ["silueta a contraluz (silueta, luz)", (g) => {
    g.fillStyle = "#05060a"; g.fillRect(0, 0, L, L);
    const r = g.createRadialGradient(540, 420, 30, 540, 420, 900); r.addColorStop(0, "#fff6e2"); r.addColorStop(0.12, "#ffc070"); r.addColorStop(0.4, "#8a3a48"); r.addColorStop(1, "#08070c");
    g.fillStyle = r; g.fillRect(0, 0, L, L);
    g.fillStyle = "#0a090e"; g.fillRect(0, 900, L, 180);
    k.persona(g, 330, 960, 760, { semilla: 4, gira: Math.PI, pose: "mira", silueta: "255,206,150", luz: [0.25, -0.8, -0.5] });
    k.persona(g, 720, 975, 800, { semilla: 9, gira: Math.PI - 0.45, pose: "señala", lado: 1, silueta: "255,206,150", luz: [-0.2, -0.8, -0.6] });
  }],
  ["una persona sola frente a algo enorme", (g) => {
    k.fondo(g, k.mira([0, 0, 30], [0, 0, 0]));
    k.estrella(g, "roja", 540, 380, 470, 0.4, 0.15);
    g.fillStyle = "#07080c"; g.beginPath(); g.moveTo(0, 860); g.quadraticCurveTo(540, 820, L, 860); g.lineTo(L, L); g.lineTo(0, L); g.closePath(); g.fill();
    k.persona(g, 540, 862, 190, { semilla: 7, gira: Math.PI, pose: "mira", silueta: "255,150,110", luz: [0, -0.7, -0.7] });
  }],
  ["gente(gradas) · graderio · multitud(celebra)", (g) => {
    g.translate(0, -360);
    const cg = g.createLinearGradient(0, 360, 0, 1440); cg.addColorStop(0, "#0b1222"); cg.addColorStop(1, "#28344c"); g.fillStyle = cg; g.fillRect(0, 360, L, L);
    const op = { forma: "gradas", filas: 22, ancho: 48, radio: 30, escalon: [0.5, 0.9], asientos: ["40,90,170", "40,90,170", "200,50,50"] };
    const cam = k.mira([0, 2.6, 26], [0, 7.5, -8]);
    k.graderio(g, cam, op); k.multitud(g, cam, gente.estadio || (gente.estadio = k.gente(3, op)), 0.42, { anima: "celebra" });
    for (const x of [150, 540, 930]) k.brillo(g, x, 380, 420, "255,244,220", 0.7);
  }],
  ["multitud(bota, silueta): un concierto", (g) => {
    g.translate(0, -420);
    g.fillStyle = "#06050c"; g.fillRect(0, 420, L, L);
    const r = g.createRadialGradient(540, 760, 40, 540, 760, 800); r.addColorStop(0, "#f2e6ff"); r.addColorStop(0.15, "#b070ff"); r.addColorStop(0.5, "#3a1a66"); r.addColorStop(1, "#06050c");
    g.fillStyle = r; g.fillRect(0, 420, L, L);
    focos(g, 540, 640, 1);
    const cam = k.mira([0, 2.2, 6], [0, 2.6, -20]);
    k.multitud(g, cam, gente.concierto || (gente.concierto = k.gente(8, { forma: "plaza", n: 900, ancho: 34, fondo: 26, mira: Math.PI })), 0.3, { anima: "bota", silueta: "210,170,255", luz: [0, -0.6, -0.8] });
  }],
  ["multitud(gris, color): «1 de cada 4»", (g) => {
    g.translate(0, -420);
    const cg = g.createLinearGradient(0, 420, 0, 1500); cg.addColorStop(0, "#151a26"); cg.addColorStop(1, "#3a4356"); g.fillStyle = cg; g.fillRect(0, 420, L, L);
    const lista = gente.rejilla || (gente.rejilla = k.gente(5, { forma: "filas", filas: 6, columnas: 8, ancho: 7.2, fondo: 6.6, desorden: 0.3 }));
    const cam = k.mira([0, 4.6, 7.2], [0, 0.4, -3.1]);
    k.multitud(g, cam, lista, 0.2, { gris: true, color: (p, i) => ([3, 9, 12, 22, 25, 30, 36, 45, 17, 40, 6, 28].includes(i) ? "255,84,64" : null) });
  }],
  ["multitud(ola): se levantan al pasar", (g) => {
    g.translate(0, -420);
    const cg = g.createLinearGradient(0, 420, 0, 1500); cg.addColorStop(0, "#0e1426"); cg.addColorStop(1, "#283650"); g.fillStyle = cg; g.fillRect(0, 420, L, L);
    const op = { forma: "gradas", filas: 16, ancho: 40, escalon: [0.5, 0.9], asientos: ["40,90,170", "200,200,205"] };
    const cam = k.mira([0, 4, 22], [0, 5.2, -6]);
    k.graderio(g, cam, op); k.multitud(g, cam, gente.ola || (gente.ola = k.gente(5, op)), 2.2, { anima: "ola", ola: { vel: 10, ancho: 4, desde: -25 } });
  }],
  ["personaEn(g, cam, P, { pose, gira }) en la calle", (g) => {
    g.translate(0, -420);
    const cam = k.mira([2, 1.6, 34], [0, 3.4, 0]), c = gente.calle || (gente.calle = k.ciudad(2, { manzanas: 4 }));
    k.cieloCiudad(g, cam, { noche: 0 }); k.dibujaCiudad(g, cam, c, 0, { noche: 0, coches: false });
    const ps = [[-3.2, 25, 0.5, "andando"], [2.6, 21, -2.6, "andando"], [-0.8, 15, 0.2, "de pie"], [4.4, 10, Math.PI, "andando"], [-5, 4, 0.4, "señala"], [1.2, -2, 1.6, "corre"]].map(([x, z, gira, pose], i) => ({ z, f: () => k.personaEn(g, cam, [x, 0, z], { semilla: 70 + i, gira, pose, t: 0.2 + i * 0.37, hacia: 1.4, lado: -1 }) }));
    ps.sort((a, b) => a.z - b.z).forEach((p) => p.f());
  }],
  ["multitud(aplaude) en una plaza", (g) => {
    g.translate(0, -420);
    const sg = g.createLinearGradient(0, 420, 0, 1500); sg.addColorStop(0, "#8a8c90"); sg.addColorStop(1, "#5c5e64"); g.fillStyle = sg; g.fillRect(0, 420, L, L);
    g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.3; g.drawImage(k.manchas, 0, 420, L, L); g.restore();
    const cam = k.mira([0, 9, 16], [0, 0, -2]);
    k.multitud(g, cam, gente.plaza || (gente.plaza = k.gente(12, { forma: "plaza", n: 420, ancho: 26, fondo: 22, centro: [0, 0, 9], mira: [0, 0, 60] })), 0.35, { anima: "aplaude" });
  }],
];
const gente = {};
