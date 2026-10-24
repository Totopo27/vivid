// Texto dentro de la imagen: una cifra en su pastilla oscura (una temperatura, un precio, una distancia) y una
// etiqueta pequeña. Solo para lo que el subtítulo no dice ya: un número que corre, el nombre de lo que se señala.
// Grande para que se lea en un móvil, y quieto al menos medio segundo.
import { redondo } from "./base.js";

// Una cifra en su pastilla oscura, centrada en (x, y). principal: el número ya escrito ("30.000"); unidad: "°C".
// color: "r,g,b" del número (con su brillo alrededor). al: transparencia. tam: el alto del número.
export function pastilla(g, x, y, principal, unidad = "", color = "255,255,255", al = 1, tam = 112) {
  if (al <= 0.003) return;
  const A = g.globalAlpha;
  g.save();
  g.globalAlpha = A * al;
  g.font = `800 ${tam}px Figtree`;
  const w1 = g.measureText(principal).width;
  g.font = `700 ${tam / 2}px Figtree`;
  const w2 = unidad ? g.measureText(unidad).width + 12 : 0;
  const w = w1 + w2 + 88, h = tam + 34, x0 = x - w / 2, y0 = y - h / 2;
  g.shadowColor = "rgba(0,0,0,0.55)"; g.shadowBlur = 44; g.shadowOffsetY = 16;
  redondo(g, x0, y0, w, h, 40); g.fillStyle = "rgba(4,7,12,0.66)"; g.fill();
  g.shadowColor = "rgba(0,0,0,0)"; g.shadowBlur = 0; g.shadowOffsetY = 0;
  redondo(g, x0 + 1.5, y0 + 1.5, w - 3, h - 3, 38.5); g.strokeStyle = "rgba(255,255,255,0.16)"; g.lineWidth = 3; g.stroke();
  g.textBaseline = "alphabetic";
  const base = y + tam * 0.36;
  g.shadowColor = `rgba(${color},0.9)`; g.shadowBlur = 26;
  g.fillStyle = `rgb(${color})`;
  g.font = `800 ${tam}px Figtree`; g.fillText(principal, x0 + 44, base);
  if (unidad) { g.font = `700 ${tam / 2}px Figtree`; g.fillText(unidad, x0 + 44 + w1 + 12, base); }
  g.restore();
}

// Una etiqueta pequeña con borde de color, con su esquina de arriba a la izquierda en (x, y).
export function etiqueta(g, x, y, texto, color = "184,255,122", al = 1, tam = 46) {
  if (al <= 0.003) return;
  const A = g.globalAlpha;
  g.save();
  g.globalAlpha = A * al;
  g.font = `800 ${tam}px Figtree`;
  const w = g.measureText(texto).width + 52, h = tam + 24;
  redondo(g, x, y, w, h, 26); g.fillStyle = "rgba(4,7,12,0.66)"; g.fill();
  redondo(g, x + 1.5, y + 1.5, w - 3, h - 3, 24.5); g.strokeStyle = `rgba(${color},0.5)`; g.lineWidth = 3; g.stroke();
  g.textBaseline = "alphabetic"; g.fillStyle = `rgb(${color})`;
  g.fillText(texto, x + 26, y + 10 + tam * 0.86);
  g.restore();
  return w;
}
