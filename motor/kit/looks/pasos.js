// Lo que comparten los looks: los lienzos de paso de los acabados, el resplandor de lo que brilla, el grano, las capas
// hechas una vez (viñetas, papel) y los colores. Lo pesado se hace la primera vez que se usa y se guarda: cada hilo del
// render tiene sus propias copias, y nada pasa de un fotograma al siguiente.
import { azar, lienzo, mez } from "../base.js";
import { COLORES } from "../luz.js";
import { ruido, tenir } from "../texturas.js";

export const W = 1080, H = 1920;

// Algo que se hace una vez, cuando hace falta por primera vez.
export const una = (hacer) => { let x = null; return () => x || (x = hacer()); };

// ---------------------------------------------------------------- colores
// Un color como [r, g, b], dicho de cualquier manera: "r,g,b", "#rrggbb" o un nombre de COLORES ("cian").
export function rgb(c) {
  if (Array.isArray(c)) return c;
  if (COLORES[c]) c = COLORES[c];
  if (c[0] === "#") return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  return c.split(",").map(Number);
}
// Dos colores mezclados (u de 0 a 1), como [r, g, b].
export const mezcla = (a, b, u) => { const x = rgb(a), y = rgb(b); return [0, 1, 2].map((i) => Math.round(mez(x[i], y[i], u))); };
// Un color [r, g, b] con transparencia, listo para fillStyle.
export const rgba = (c, al = 1) => { const x = rgb(c); return `rgba(${x[0]},${x[1]},${x[2]},${al})`; };
// Más claro (u > 0, hacia el blanco) o más oscuro (u < 0, hacia el negro).
export const aclara = (c, u) => mezcla(c, u > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(u));

// ---------------------------------------------------------------- lienzos de paso
// Un lienzo listo para usarse: sin transformación, opaco y con la mezcla pedida.
export function listo(cx, modo = "source-over", al = 1) {
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.globalAlpha = al; cx.globalCompositeOperation = modo; cx.filter = "none";
  cx.shadowBlur = 0; cx.shadowColor = "rgba(0,0,0,0)"; cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "low";
  return cx;
}
// La pirámide del resplandor: el fotograma cada vez a la mitad.
const piramide = una(() => [lienzo(270, 480), lienzo(135, 240), lienzo(68, 120), lienzo(34, 60), lienzo(360, 640)]);

// Lo que brilla se desborda (o, con umbral 0, todo suelta una bruma suave): una copia pequeña del fotograma, que se
// queda con lo más claro, desenfocada en tres anchos y sumada encima.
//   umbral   cuántas veces se multiplica la copia por sí misma: 0, todo; 1, lo claro; 2 o 3, solo lo que brilla mucho
//   al       cuánto se suma · modo "lighter" (lo fuerte se quema a blanco) o "screen" (más suave, nunca se pasa)
//   pesos    [fino, medio, ancho]: cuánto de cada anchura (fino, unos 8 px; ancho, unos 60 px)
//   tinte    "r,g,b" o null: el color que se le da a la luz que se desborda (se multiplica)
//   bruma    "r,g,b" o null: una luz pareja que se suma a todo con el resplandor (lo negro deja de ser negro: niebla)
// Usa sus propios lienzos de paso. Unos 4 ms.
export function resplandor(g, { umbral = 2, al = 0.6, modo = "lighter", pesos = [0.5, 0.6, 0.8], tinte = null, bruma = null } = {}) {
  const [a, b, c, d, m] = piramide(), ga = listo(a.getContext("2d"), "copy"), gb = listo(b.getContext("2d"), "copy");
  const gc = listo(c.getContext("2d"), "copy"), gd = listo(d.getContext("2d"), "copy");
  ga.drawImage(g.canvas, 0, 0, 270, 480);
  ga.globalCompositeOperation = "multiply";
  for (let i = 0; i < umbral; i++) ga.drawImage(a, 0, 0);
  gb.drawImage(a, 0, 0, 135, 240); gc.drawImage(b, 0, 0, 68, 120); gd.drawImage(c, 0, 0, 34, 60);
  // de lo ancho a lo fino: cada anchura, al subir, se desenfoca y se suma a la siguiente
  const gris = (cx, u, w, h) => { cx.globalCompositeOperation = "multiply"; cx.globalAlpha = 1; const v = Math.round(255 * u); cx.fillStyle = `rgb(${v},${v},${v})`; cx.fillRect(0, 0, w, h); };
  gc.globalCompositeOperation = "lighter"; gc.drawImage(d, 0, 0, 68, 120);
  gris(gb, pesos[1], 135, 240); gb.globalCompositeOperation = "lighter"; gb.globalAlpha = pesos[2] / 2; gb.drawImage(c, 0, 0, 135, 240);
  gris(ga, pesos[0], 270, 480); ga.globalCompositeOperation = "lighter"; ga.globalAlpha = 1; ga.drawImage(b, 0, 0, 270, 480);
  if (tinte) { ga.globalCompositeOperation = "multiply"; ga.fillStyle = rgba(tinte); ga.fillRect(0, 0, 270, 480); }
  // la capa de luz, a un tercio del tamaño: así se suma rápido y sin escalones
  const gx = listo(m.getContext("2d"), "copy");
  gx.drawImage(a, 0, 0, 360, 640);
  if (bruma) { gx.globalCompositeOperation = "lighter"; gx.fillStyle = rgba(bruma); gx.fillRect(0, 0, 360, 640); }
  g.save();
  listo(g, modo, al); g.imageSmoothingEnabled = false;
  g.drawImage(m, 0, 0, W, H);
  g.restore();
}

// ---------------------------------------------------------------- grano
// El ruido del grano, más grande que la pantalla, para moverlo cada fotograma. Gris medio (128) con su ruido: con
// "overlay" no cambia nada donde no hay ruido.
const ruidoGrano = una(() => {
  const w = W + 48, h = H + 48, l = lienzo(w, h), cx = l.getContext("2d"), img = cx.createImageData(w, h), az = azar(9091);
  for (let i = 0; i < w * h; i++) {
    const n = (az() + az() + az() - 1.5) * 118, v = Math.max(0, Math.min(255, 128 + n)), q = i * 4;
    img.data[q] = img.data[q + 1] = img.data[q + 2] = v; img.data[q + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  return l;
});
// El grano de una película sobre todo el fotograma: otro en cada fotograma (cada: cuántas veces cambia por segundo),
// siempre el mismo para el mismo t. al: lo fuerte (0,1 apenas se ve; 0,3 se nota). Unos 2 ms.
export function grano(g, t, al = 0.15, cada = 60, modo = "overlay") {
  const az = azar(Math.floor(t * cada) * 7919 + 17), dx = Math.floor(az() * 48), dy = Math.floor(az() * 48);
  g.save();
  listo(g, modo, al);
  g.drawImage(ruidoGrano(), -dx, -dy);
  g.restore();
}

// ---------------------------------------------------------------- capas hechas una vez
const capas = new Map();
// Una capa de 1080 × 1920 que se dibuja una vez (dibuja(cx)) y se guarda con su nombre.
export function capaHecha(nombre, dibuja) {
  if (!capas.has(nombre)) { const l = lienzo(W, H); dibuja(l.getContext("2d")); capas.set(nombre, l); }
  return capas.get(nombre);
}
// Una capa hecha puesta encima de todo el fotograma con su mezcla ("multiply" para oscurecer o teñir). Unos 1,3 ms.
export function ponCapa(g, capa, modo = "multiply", al = 1) {
  g.save(); listo(g, modo, al); g.drawImage(capa, 0, 0); g.restore();
}

// La viñeta como capa para "multiply": blanco (o el color centro) en medio, que se va hacia el color borde.
//   fuerza: lo que oscurece en las esquinas (0 a 1) · subs: "arriba" | "centro" | "abajo" | "no": oscurece un poco más esa franja
//   (donde va el subtítulo, para que se lea) con fuerzaSubs.
export function vineta(nombre, { centro = "255,255,255", borde = "0,0,0", fuerza = 0.5, subs = "no", fuerzaSubs = 0, ancho = 1 } = {}) {
  return capaHecha(`vineta-${nombre}-${subs}`, (cx) => {
    cx.fillStyle = rgba(centro); cx.fillRect(0, 0, W, H);
    cx.save(); cx.translate(W / 2, H * 0.52); cx.scale(1, H / W);
    const r = W * 0.78 * ancho, vg = cx.createRadialGradient(0, 0, r * 0.35, 0, 0, r * 1.05);
    const c = mezcla(centro, borde, fuerza);
    vg.addColorStop(0, rgba(centro, 0)); vg.addColorStop(0.55, rgba(mezcla(centro, borde, fuerza * 0.35), 0.6)); vg.addColorStop(1, rgba(c, 1));
    cx.fillStyle = vg; cx.fillRect(-W, -W, 2 * W, 2 * W);
    cx.restore();
    if (subs !== "no" && fuerzaSubs > 0) {
      const [y0, y1] = subs === "abajo" ? [1150, 1420] : subs === "centro" ? [640, 1080] : [230, 560], m = (y0 + y1) / 2;
      const sg = cx.createLinearGradient(0, y0 - 140, 0, y1 + 220), s = mezcla(centro, borde, fuerzaSubs);
      sg.addColorStop(0, rgba(s, 0)); sg.addColorStop((m - y0 + 140) / (y1 - y0 + 360), rgba(s, 1)); sg.addColorStop(1, rgba(s, 0));
      cx.globalCompositeOperation = "multiply"; cx.fillStyle = sg; cx.fillRect(0, y0 - 140, W, y1 - y0 + 360);
    }
  });
}

// ---------------------------------------------------------------- un telón
// Un fondo grande (1400 × 2400) dibujado una vez, que se pone moviéndose un poco con hacia dónde mira la cámara, como
// lo que está lejos (igual que el del espacio). Devuelve el desplazamiento usado, para lo que se dibuje encima.
export function camaraLejana(cam, k = 1) {
  if (!cam || !cam.e) return [0, 0];
  return [Math.max(-150, Math.min(150, cam.e.f[0] * -600 * k)), Math.max(-230, Math.min(230, cam.e.f[1] * 900 * k))];
}
export function ponTelon(g, telon, mx, my) {
  g.save(); g.globalCompositeOperation = "source-over";
  g.drawImage(telon, -160 + mx, -240 + my);
  g.restore();
}

// Una neblina de manchas del color c, de w × h, que solo se ve donde la deja la máscara (mascara(cx) pinta, en blanco
// y transparente, dónde está más espesa): así no tiene bordes. Para sumarla ("lighter") a un telón.
export function neblina(w, h, semilla, c, escala, mascara) {
  const l = lienzo(w, h), cx = l.getContext("2d");
  cx.drawImage(tenir(ruido(256, semilla, escala, 4, "manchas"), `rgb(${rgb(c).join(",")})`), 0, 0, w, h);
  cx.globalCompositeOperation = "destination-in";
  mascara(cx);
  return l;
}

// Una línea de luz sobre el camino actual, que se suma ("lighter"): un núcleo de ancho px del color tono (con su
// centro casi blanco si blanco > 0) y un halo que se apaga sin escalones hasta k veces más ancho. al: de 0 a 1.
export function lineaDeLuz(g, ancho, tono, al = 1, k = 6, halo = 0.35, blanco = 0.7) {
  const A = g.globalAlpha * al, n = 10;
  g.save();
  g.globalCompositeOperation = "lighter"; g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = rgba(tono);
  for (let i = n; i >= 1; i--) { const u = i / n; g.globalAlpha = A * halo / n * 1.6 * (1 - 0.5 * u); g.lineWidth = ancho * (1.2 + (k - 1.2) * u * u); g.stroke(); }
  g.globalAlpha = A * 0.9; g.lineWidth = ancho; g.stroke();
  if (blanco > 0) { g.strokeStyle = rgba(aclara(tono, blanco)); g.lineWidth = ancho * 0.42; g.stroke(); }
  g.restore();
}
