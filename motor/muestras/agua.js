// La lámina del agua (guia/muestras/agua.jpg): el mar con sus tonos, gotas, salpicaduras, ondas, burbujas, un
// chorro que llena un vaso y una inundación. Cada muestra pinta un cuadrado de 1080 × 1080.
import * as k from "#kit";

const L = 1080;
const cielo = (g, yh, abajo, arriba) => { const cg = g.createLinearGradient(0, 0, 0, yh); cg.addColorStop(0, arriba); cg.addColorStop(1, abajo); g.fillStyle = cg; g.fillRect(0, 0, L, yh); };
const oscuro = (g, a = "#0a1a2c", b = "#02060c") => { const bg = g.createLinearGradient(0, 0, 0, L); bg.addColorStop(0, a); bg.addColorStop(1, b); g.fillStyle = bg; g.fillRect(0, 0, L, L); };
const bokeh = (g, n = 22) => { const az = k.azar(5); for (let i = 0; i < n; i++) k.brillo(g, az() * L, az() * L, 140 + az() * 260, ["255,180,90", "120,200,255", "255,120,160"][i % 3], 0.55); };
// un sol (o una luna) en el cielo, con su halo
const astro = (g, x, y, r, c) => { k.brillo(g, x, y, r * 14, c, 0.55); k.brillo(g, x, y, r * 4, c, 0.9); g.fillStyle = `rgb(${k.mezRgb(c, "255,255,255", 0.6)})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
// unas nubes, para que el agua las refleje
const nubes = (g, yh) => { g.save(); g.globalCompositeOperation = "screen"; g.globalAlpha = 0.45; g.drawImage(k.tenir(k.manchas, "#ffd9b0"), -200, 0, 1500, yh); g.restore(); };

// el fondo de las gotas, aparte (para que se vea dentro de ellas)
let elFondo = null;
const fondoGotas = () => { if (!elFondo) { elFondo = k.lienzo(L, L); const g = elFondo.getContext("2d"); oscuro(g); bokeh(g); g.fillStyle = "#e9d6a8"; g.fillRect(90, 140, 220, 44); g.fillStyle = "#3a9a6e"; g.fillRect(560, 60, 90, 300); } return elFondo; };

const vaso = (g) => { g.beginPath(); g.moveTo(330, 330); g.lineTo(365, 960); g.quadraticCurveTo(540, 1000, 715, 960); g.lineTo(750, 330); g.closePath(); };

export default [
  ["mar(g, t, { tono: \"dia\", luz })", (g) => { cielo(g, 430, "#d6e6f2", "#3f82c8"); k.mar(g, 1.3, { yh: 430, luz: { x: 640, y: 120 } }); }],
  ["mar · tono \"atardecer\" · refleja: el cielo", (g) => { const c = k.lienzo(L, 520), gc = c.getContext("2d"); cielo(gc, 520, "#ffb877", "#3c3f78"); nubes(gc, 520); astro(gc, 520, 470, 34, "255,190,110"); g.drawImage(c, 0, 0); k.mar(g, 1.3, { tono: "atardecer", yh: 520, luz: { x: 520, y: 470 }, refleja: c }); }],
  ["mar · tono \"noche\" (la luna)", (g) => { cielo(g, 470, "#1d2c4c", "#03060e"); astro(g, 400, 160, 30, "214,226,255"); k.mar(g, 2, { tono: "noche", yh: 470, luz: { x: 400, y: 160 } }); }],
  ["mar · tono \"piscina\"", (g) => { cielo(g, 300, "#e6f2fa", "#6fb2e6"); k.mar(g, 1.3, { tono: "piscina", yh: 300, luz: { x: 720, y: 60 } }); }],
  ["mar · tono \"lago\" · olas: 0,25", (g) => { cielo(g, 470, "#c9d8dc", "#5d8fb4"); k.mar(g, 1.3, { tono: "lago", yh: 470, olas: 0.25, luz: { x: 300, y: 250 } }); }],
  ["gota(g, x, y, r, { detras, punta, estira, color })", (g) => { const d = fondoGotas(); g.drawImage(d, 0, 0); k.gota(g, 400, 420, 230, { detras: d }); k.gota(g, 820, 330, 110, { punta: 0.8, detras: d }); k.gota(g, 800, 760, 120, { color: "255,170,70", estira: 1.3, detras: d }); k.gota(g, 250, 850, 60); }],
  ["salpicadura(g, x, y, u) · u = 0,14 / 0,45", (g) => { oscuro(g); bokeh(g, 14); const sg = g.createLinearGradient(0, 640, 0, L); sg.addColorStop(0, "#0b2a44"); sg.addColorStop(1, "#04101c"); g.fillStyle = sg; g.fillRect(0, 640, L, L); k.salpicadura(g, 300, 760, 0.14, { tam: 210 }); k.salpicadura(g, 790, 800, 0.45, { tam: 170, semilla: 8 }); }],
  ["ondas(g, x, y, u, { tam, inclina })", (g) => { cielo(g, 300, "#c9d8dc", "#5d8fb4"); k.mar(g, 1, { tono: "lago", yh: 300, olas: 0.08, luz: null }); k.ondas(g, 380, 560, 0.9, { tam: 420, inclina: 0.32 }); k.ondas(g, 760, 800, 0.5, { tam: 300, inclina: 0.38 }); }],
  ["burbujas(g, x, y, w, h, t, { n, tam })", (g) => { const mg = g.createLinearGradient(0, 0, 0, L); mg.addColorStop(0, "#1a6fa8"); mg.addColorStop(1, "#04182c"); g.fillStyle = mg; g.fillRect(0, 0, L, L); g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.25; k.girado(g, k.causticas, 540, 300, 1600, 0.2); g.restore(); k.rayos(g, 1, L, 0.8); k.burbujas(g, 100, 0, 880, L, 2.3, { n: 70, tam: 30 }); }],
  ["chorro(...) · nivelDeAgua(..., { forma, ry })", (g) => { oscuro(g, "#1b1712", "#0b0907"); k.nivelDeAgua(g, 320, 330, 440, 650, 0.55, 1, { forma: vaso, ry: 30, burbujas: 26 }); vaso(g); g.lineWidth = 6; k.vidrio(g, 330, 750, 0.6); k.reflejo(g, 360, 370, 20, 520, 0.3); k.chorro(g, 470, 0, 520, 330 + 650 * 0.45 + 10, 1, { ancho: 38 }); }],
  ["nivelDeAgua(g, 0, 0, 1080, 1080, nivel, t) · se inunda", (g) => { oscuro(g, "#2a241c", "#0d0b08"); g.fillStyle = "#6a5a48"; g.fillRect(140, 260, 300, 700); g.fillStyle = "#c9b89b"; g.fillRect(620, 560, 320, 480); k.nivelDeAgua(g, 0, 0, L, L, 0.55, 2, { agita: 0.8, burbujas: 40, color: "40,110,150" }); }],
  ["chorro(g, x0, y0, x1, y1, t, { llega }) · whisky", (g) => { oscuro(g, "#1a0f08", "#060302"); k.chorro(g, 140, 120, 620, 900, 1, { ancho: 60, color: "255,160,60" }); k.chorro(g, 900, 80, 900, 700, 1, { ancho: 30, llega: 0.6 }); }],
];
