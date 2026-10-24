// Las muestras del kit de siempre: cada pieza con su nombre, en una lámina (guia/muestras/kit.jpg).
// Cada archivo de motor/muestras/ es una lámina: exporta por defecto una lista de [nombre, dibuja(g)], y cada dibuja
// pinta un cuadrado de 1080 × 1080 (lo de arriba del lienzo de 1080 × 1920).
import * as k from "#kit";

const L = 1080;
export default [
  ["estrella(g, paleta, x, y, rad, gira, brillo)", (g) => { k.fondo(g, k.mira([0, 0, 30], [0, 0, 0])); [["verde", 260, 380], ["amarilla", 640, 300], ["roja", 860, 640], ["azul", 300, 780], ["enana", 700, 800]].forEach(([p, x, y], i) => k.estrella(g, p, x, y, 120 + 20 * (i % 2), i, 0.2)); }],
  ["planeta(...) · tierra(...)", (g) => { k.fondo(g, k.mira([0, 0, 30], [0, 0, 0])); k.planeta(g, 330, 540, 230, 0.4, 1, -0.4); k.tierra(g, 790, 560, 200, 0.2, -1, -0.15); }],
  ["roca(g, x, y, rad, ang, semilla, lx, ly, calor)", (g) => { k.fondo(g, k.mira([0, 0, 30], [0, 0, 0])); for (let i = 0; i < 6; i++) k.roca(g, 200 + (i % 3) * 340, 330 + Math.floor(i / 3) * 420, 130, i, i + 3, 1, -1, i === 5 ? 0.9 : i === 4 ? 0.4 : 0); }],
  ["brillo(g, x, y, tam, color, al)", (g) => { g.fillStyle = "#03050a"; g.fillRect(0, 0, L, L); Object.keys(k.COLORES).forEach((c, i) => k.brillo(g, 160 + (i % 4) * 250, 260 + Math.floor(i / 4) * 330 + 80, 300, c, 1)); }],
  ["fogonazo(g, x, y, u) · u = 0,15 / 0,5", (g) => { g.fillStyle = "#03050a"; g.fillRect(0, 0, L, L); k.fogonazo(g, 300, 540, 0.15, 700); k.fogonazo(g, 780, 540, 0.5, 600); }],
  ["haz(g, x, abajo, arriba, color, al)", (g) => { g.fillStyle = "#06102a"; g.fillRect(0, 0, L, L); ["255,80,70", "255,150,40", "255,220,70", "130,255,100", "100,235,255", "130,150,255"].forEach((c, i) => k.haz(g, 160 + i * 150, 980, 200 + (i % 2) * 260, c, 1, 52, i % 2 === 0)); }],
  ["estallido(g, x, y, u, color, escala)", (g) => { k.fondo(g, k.mira([0, 0, 30], [0, 0, 0])); k.estallido(g, 300, 540, 0.12, "sodio", 0.45); k.estallido(g, 780, 540, 0.7, "fuego", 0.45, 3); }],
  ["anilloDeLlamas(g, cx, cy, rx, ry, t, naranja)", (g) => { g.fillStyle = "#0d0b0a"; g.fillRect(0, 0, L, L); for (const [cx, n] of [[300, 0], [790, 1]]) { k.anilloDeLlamas(g, cx, 640, 200, 64, 1.3, n, false); g.fillStyle = "#1c1a18"; g.beginPath(); g.ellipse(cx, 640, 186, 56, 0, 0, 6.28); g.fill(); k.anilloDeLlamas(g, cx, 640, 200, 64, 1.3, n, true); } }],
  ["superficie(g, horizonte, t)", (g) => { k.fondo(g, k.mira([0, 0, 30], [0, 0, 0])); k.superficie(g, 520, 2.0); }],
  ["fondo · cielo · estrellas (con estela)", (g) => { const c = k.cielo(5, 2600, [0, 0, 0], 520, 30), cam = k.mira([0, 0, 60], [0, 0, 0]), antes = k.mira([1.2, 0, 60], [0, 0, 0]); k.fondo(g, cam); k.estrellas(g, cam, antes, c); }],
  ["galaxia()", (g) => { g.fillStyle = "#03050a"; g.fillRect(0, 0, L, L); g.save(); g.translate(540, 540); g.scale(1, 0.62); g.rotate(-0.35); g.globalCompositeOperation = "lighter"; g.drawImage(k.galaxia(), -560, -560, 1120, 1120); g.restore(); }],
  ["pastilla(...) · etiqueta(...)", (g) => { g.fillStyle = "#101826"; g.fillRect(0, 0, L, L); k.pastilla(g, 540, 380, "5.500", "°C", "255,224,130", 1, 112); k.etiqueta(g, 330, 640, "a 280 años luz"); }],
  ["vidrio · reflejo · metal (en un camino)", (g) => { g.fillStyle = "#0d0b0a"; g.fillRect(0, 0, L, L); k.redondo(g, 380, 330, 320, 560, 46); g.fillStyle = "#d9dde4"; g.fill(); k.redondo(g, 360, 300, 360, 620, 50); k.vidrio(g, 360, 720); k.reflejo(g, 640, 340, 18, 500); g.beginPath(); g.moveTo(350, 300); g.lineTo(350, 240); g.quadraticCurveTo(540, 140, 730, 240); g.lineTo(730, 300); g.closePath(); k.metal(g, 350, 730); }],
  ["causticas · rayos (bajo el agua)", (g) => { const mg = g.createLinearGradient(0, 0, 0, L); mg.addColorStop(0, "#102260"); mg.addColorStop(1, "#5aa6e6"); g.fillStyle = mg; g.fillRect(0, 0, L, L); g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.35; k.girado(g, k.causticas, 540, 540, 1700, 0.2); g.restore(); k.rayos(g, 1, L, 1); }],
  ["estrellaTransparente(..., al) · al = 0,4", (g) => { k.fondo(g, k.mira([0, 0, 30], [0, 0, 0])); k.estrella(g, "azul", 400, 540, 230, 0, 0); k.estrellaTransparente(g, "verde", 680, 540, 230, 1, 0, 0.4); }],
];
