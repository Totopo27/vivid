// Materiales de objetos de verdad, para que nada sea un color plano: cristal, metal, y una superficie que brilla
// con su granulación. Cada uno se aplica a un camino ya trazado (beginPath... closePath) o a un rectángulo.
import { redondo } from "./base.js";
import { manchas, red } from "./texturas.js";

// Cristal sobre el camino actual, que va de x0 a x1: casi transparente, con un reflejo fuerte a un lado y el borde
// claro. Lo de dentro (la sal, el agua) se dibuja antes, para que se vea a través.
export function vidrio(g, x0, x1, borde = 0.45) {
  g.save();
  const cg = g.createLinearGradient(x0, 0, x1, 0);
  cg.addColorStop(0, "rgba(255,255,255,0.22)"); cg.addColorStop(0.18, "rgba(255,255,255,0.05)"); cg.addColorStop(0.62, "rgba(255,255,255,0.12)");
  cg.addColorStop(0.82, "rgba(255,255,255,0.32)"); cg.addColorStop(1, "rgba(255,255,255,0.08)");
  g.fillStyle = cg; g.fill();
  g.strokeStyle = `rgba(255,255,255,${borde})`; g.lineWidth = 4; g.stroke();
  g.restore();
}

// Un reflejo de cristal: una franja de luz vertical.
export function reflejo(g, x, y, w, h, al = 0.35) {
  g.save(); g.fillStyle = `rgba(255,255,255,${al})`; redondo(g, x, y, w, h, w / 2); g.fill(); g.restore();
}

// Metal pulido sobre el camino actual, de x0 a x1: bandas de luz y sombra, como un tapón o una tubería.
export function metal(g, x0, x1, tono = ["#6d737c", "#e8ecf1", "#9aa2ad", "#f4f6f9", "#5c626a"]) {
  g.save();
  const mg = g.createLinearGradient(x0, 0, x1, 0);
  tono.forEach((c, i) => mg.addColorStop(i / (tono.length - 1), c));
  g.fillStyle = mg; g.fill();
  g.restore();
}

// Una superficie enorme vista rozándola (el suelo de un planeta, la piel de una estrella, la arena), de la línea del
// horizonte yh hacia abajo: blanca, con su granulación pasando por debajo a velocidad vel (px/s). al: transparencia.
export function superficie(g, yh, t, al = 1, vel = 260, colores = ["#ffffff", "#eef4ff", "#c4d3f5"]) {
  if (al <= 0.003) return;
  const A = g.globalAlpha * al;
  g.save(); g.globalAlpha = A;
  g.beginPath(); g.moveTo(-40, yh + 50); g.quadraticCurveTo(540, yh - 50, 1120, yh + 50); g.lineTo(1120, 1960); g.lineTo(-40, 1960); g.closePath(); g.clip();
  const sg = g.createLinearGradient(0, yh - 50, 0, 1920);
  sg.addColorStop(0, colores[0]); sg.addColorStop(0.25, colores[1]); sg.addColorStop(1, colores[2]);
  g.fillStyle = sg; g.fillRect(0, yh - 60, 1080, 1980 - yh);
  const off = (t * vel) % 1500;
  g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.38 * A;
  g.drawImage(red, -off, yh - 50, 1500, 1100); g.drawImage(red, 1500 - off, yh - 50, 1500, 1100);
  g.globalCompositeOperation = "screen"; g.globalAlpha = 0.3 * A;
  g.drawImage(manchas, -off * 0.8, yh - 50, 1700, 1100); g.drawImage(manchas, 1700 - off * 0.8, yh - 50, 1700, 1100);
  g.restore();
}
