// La lámina de las máquinas (guia/muestras/maquinas.jpg): engranajes, pantallas, botones, interruptores, pilotos y el
// cuentakilómetros. Cada muestra pinta un cuadrado de 1080 × 1080.
import * as k from "#kit";

const L = 1080;
const taller = (g) => { const bg = g.createRadialGradient(540, 460, 80, 540, 540, 900); bg.addColorStop(0, "#2e3137"); bg.addColorStop(1, "#08090b"); g.fillStyle = bg; g.fillRect(0, 0, L, L); };
// lo de dentro de una pantalla: una foto de fondo con la hora y un aviso
const inicio = (gc, w, h) => {
  const bg = gc.createLinearGradient(0, 0, w, h); bg.addColorStop(0, "#2b5cff"); bg.addColorStop(0.6, "#9b3dff"); bg.addColorStop(1, "#ff3d8b"); gc.fillStyle = bg; gc.fillRect(0, 0, w, h);
  k.brillo(gc, w * 0.7, h * 0.75, w * 1.4, "255,140,200", 0.5);
  gc.fillStyle = "#fff"; gc.font = `800 ${Math.round(w * 0.24)}px Figtree`; gc.textAlign = "center"; gc.fillText("9:41", w / 2, h * 0.27);
  k.redondo(gc, w * 0.06, h * 0.4, w * 0.88, h * 0.11, w * 0.06); gc.fillStyle = "rgba(255,255,255,0.82)"; gc.fill();
  gc.fillStyle = "#222"; gc.font = `700 ${Math.round(w * 0.055)}px Figtree`; gc.textAlign = "left"; gc.fillText("Almacenamiento lleno", w * 0.12, h * 0.465);
};
// un panel con su gráfica
const panel = (gc, w, h) => {
  gc.fillStyle = "#0d1117"; gc.fillRect(0, 0, w, h);
  const az = k.azar(3);
  for (let i = 0; i < 12; i++) { const bh = h * (0.15 + az() * 0.6); const gr = gc.createLinearGradient(0, h - bh, 0, h); gr.addColorStop(0, "#5ee7a0"); gr.addColorStop(1, "#13804f"); gc.fillStyle = gr; gc.fillRect(w * 0.06 + i * w * 0.075, h * 0.92 - bh, w * 0.05, bh); }
  gc.fillStyle = "rgba(255,255,255,0.85)"; gc.font = `800 ${Math.round(h * 0.11)}px Figtree`; gc.fillText("+38%", w * 0.06, h * 0.16);
};

export default [
  ["engranaje(g, x, y, r, giro, { tono })", (g) => { taller(g); k.engranaje(g, 400, 420, 300, 0.2); k.engranaje(g, 820, 820, 190, 0.5, { tono: "laton" }); k.engranaje(g, 260, 900, 120, 0.1, { tono: "cobre" }); k.engranaje(g, 900, 300, 90, 0, { tono: "oscuro" }); }],
  ["engranajes(g, x, y, r1, r2, giro, { dir })", (g) => { taller(g); const o = k.engranajes(g, 380, 620, 280, 160, 0.4, { dir: -0.6 }); k.engranajes(g, o.x, o.y, o.r, 90, o.giro, { dir: 0.9, dientes: o.dientes, tono2: "laton" }); }],
  ["pantalla(g, x, y, w, h, contenido, { tipo: \"movil\" })", (g) => { taller(g); k.pantalla(g, 540, 540, 470, 960, inicio, { ang: -0.08 }); }],
  ["pantalla(..., { tipo: \"monitor\" }) · brillo 0", (g) => { taller(g); k.pantalla(g, 540, 330, 860, 520, panel, { tipo: "monitor" }); k.pantalla(g, 540, 850, 300, 190, panel, { tipo: "monitor", brillo: 0 }); }],
  ["boton(g, x, y, r, aprieta, { luz, texto })", (g) => { taller(g); k.boton(g, 330, 470, 210, 0, { texto: "GO" }); k.boton(g, 800, 470, 150, 1, { color: "40,170,90", luz: 1 }); k.boton(g, 560, 860, 110, 0.5, { color: "240,180,40" }); }],
  ["interruptor(g, x, y, tam, enc) · 0 / 0,5 / 1", (g) => { taller(g); [0, 0.5, 1].forEach((e, i) => k.interruptor(g, 210 + i * 330, 400, 420, e)); for (let i = 0; i < 8; i++) k.interruptor(g, 95 + i * 127, 900, 190, [1, 0, 1, 1, 0, 0, 1, 0][i], { textos: null }); }],
  ["piloto(g, x, y, r, enc, color)", (g) => { taller(g); ["255,60,50", "255,190,40", "90,255,120", "90,170,255"].forEach((c, i) => { k.piloto(g, 200 + i * 230, 380, 60, 1, c); k.piloto(g, 200 + i * 230, 760, 60, 0, c); }); }],
  ["cuentakilometros(g, x, y, valor, { decimales, unidad })", (g) => { taller(g); k.cuentakilometros(g, 540, 330, 48213.7, { unidad: "km", alto: 150 }); k.cuentakilometros(g, 540, 720, 999999.95, { alto: 120, decimales: 0, cifras: 7 }); }],
];
