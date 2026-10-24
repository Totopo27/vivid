// La firma del creador: un texto pequeño (su @, su web, su nombre) encima de cada fotograma, como los subtítulos.
// Va a la izquierda, dentro de lo que no tapa Instagram y sin pisar a los subtítulos: "abajo" (lo normal) justo encima
// del texto del post, "arriba" justo debajo del título. La pone la marca ("firma": "@micanal") o el guion; "firma":
// false la quita en un vídeo.
//   { texto, posicion: "abajo" | "arriba", opacidad: 0,2-1, escala: 0,6-1,2, color }
export const POSICIONES_FIRMA = ["abajo", "arriba"];
const X = 64, ARRIBA = 280, ABAJO = 1432; // y 270-1440: lo que no tapa Instagram; los subtítulos, de y 318 a y 1380

// "@micanal" | { texto, ... } → { texto, posicion, opacidad, escala, color }, o null si no hay firma.
export function normalizaFirma(f) {
  if (f === undefined || f === null || f === false || f === "") return null;
  const o = typeof f === "string" ? { texto: f } : f;
  return { posicion: "abajo", opacidad: 0.8, escala: 1, color: "#ffffff", ...o, texto: String(o.texto || "").trim() };
}

const tamDe = (f) => Math.round(32 * Math.min(1.2, Math.max(0.6, Number(f.escala) || 1)));

// Dónde cae: { x, y, w, h } (el ancho, el de la línea entera que puede ocupar).
export function zonaFirma(f) {
  if (!f) return null;
  const h = tamDe(f);
  return { x: X, y: f.posicion === "arriba" ? ARRIBA : ABAJO - h, w: 950 - X, h };
}

// La dibuja encima de lo que hay, sin dejar nada cambiado en g.
export function dibujarFirma(g, f) {
  if (!f || !f.texto) return;
  const tam = tamDe(f), z = zonaFirma(f);
  g.save();
  g.globalAlpha = Math.min(1, Math.max(0.2, Number(f.opacidad) || 0.8));
  g.font = `700 ${tam}px Figtree`;
  g.textBaseline = "top";
  g.shadowColor = "rgba(0,0,0,0.6)"; g.shadowBlur = 10; g.shadowOffsetY = 2;
  g.fillStyle = f.color || "#ffffff";
  g.fillText(f.texto, z.x, z.y, z.w);
  g.restore();
}
