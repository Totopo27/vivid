// Look «espacio», el de siempre (el de los dos ejemplos): negro azulado profundo, luces que se suman, colores vivos
// encima. No toca el fotograma al acabar: lo que dibuja el plano es lo que se ve.
import { fondo as fondoEspacio } from "../cielo.js";
import { COLORES } from "../luz.js";
import { manchas, red } from "../texturas.js";
import { lineaDeLuz, mezcla, rgba } from "./pasos.js";

const C = {
  fondo: "3,5,10",
  tinta: "255,255,255",
  acentos: [COLORES.verde, COLORES.sodio, COLORES.cian, COLORES.violeta, COLORES.roja],
  luz: COLORES.blanca,
  sombra: "0,0,0",
};

// Un material de cosa de verdad, iluminada por una estrella, sobre el camino actual (de x0, y0 a x1, y1): el color
// tono con su luz desde (lx, ly), su textura, su lado de noche casi negro y un borde de luz fría.
function material(g, x0, y0, x1, y1, tono = C.acentos[2], lx = -0.6, ly = -0.8) {
  const w = x1 - x0, h = y1 - y0, s = Math.max(w, h), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, l = Math.hypot(lx, ly) || 1, A = g.globalAlpha;
  lx /= l; ly /= l;
  g.save();
  g.clip();
  const cg = g.createLinearGradient(cx + lx * s * 0.5, cy + ly * s * 0.5, cx - lx * s * 0.5, cy - ly * s * 0.5);
  cg.addColorStop(0, rgba(mezcla(tono, C.luz, 0.4))); cg.addColorStop(0.4, rgba(tono)); cg.addColorStop(0.75, rgba(mezcla(tono, C.sombra, 0.7)));
  cg.addColorStop(1, rgba(mezcla(tono, C.sombra, 0.92)));
  g.fillStyle = cg; g.fillRect(x0 - 2, y0 - 2, w + 4, h + 4);
  g.globalCompositeOperation = "multiply";
  g.globalAlpha = A * 0.55; g.drawImage(manchas, x0, y0, s, s);
  g.globalAlpha = A * 0.3; g.drawImage(red, x0, y0, s * 1.2, s * 1.2);
  g.globalCompositeOperation = "lighter"; g.globalAlpha = A;
  const rg = g.createLinearGradient(cx + lx * s * 0.5, cy + ly * s * 0.5, cx + lx * s * 0.3, cy + ly * s * 0.3);
  rg.addColorStop(0, "rgba(220,235,255,0.4)"); rg.addColorStop(1, "rgba(220,235,255,0)");
  g.fillStyle = rg; g.fillRect(x0, y0, w, h);
  g.restore();
}

// Una línea de luz sobre el camino actual, que se suma: una órbita, una trayectoria, un rayo fino.
function trazo(g, ancho = 4, tono = C.acentos[2], al = 1) {
  lineaDeLuz(g, ancho, tono, al, 4, 0.3, 0.5);
}

// La sombra de algo apoyado en el suelo (en una superficie, un planeta): negra y suave.
function sombra(g, x, y, ancho, al = 1) {
  g.save();
  g.translate(x, y); g.scale(1, 0.2);
  const r = ancho * 0.6, sg = g.createRadialGradient(0, 0, 0, 0, 0, r);
  sg.addColorStop(0, rgba(C.sombra, 0.75 * al)); sg.addColorStop(1, rgba(C.sombra, 0));
  g.fillStyle = sg; g.fillRect(-r, -r, 2 * r, 2 * r);
  g.restore();
}

export default {
  nombre: "espacio",
  descripcion: "Oscuro y profundo, con estrellas; las luces brillan y se suman. Para el espacio, la ciencia, la noche.",
  // Los colores del look, como "r,g,b". fondo: el de más atrás; los acentos, para lo que importa.
  colores: C,
  // El fondo del look (cam: la cámara del plano, si la hay; el espacio se mueve un poco con hacia dónde mira).
  fondo(g, t, cam) {
    fondoEspacio(g, cam || { e: { f: [0, 0, -1] } });
  },
  // Sin acabado: nada después del plano.
  acabado: null,
  material,
  trazo,
  sombra,
  consejos: [
    "El fondo, siempre k.fondo + k.estrellas: negro azulado con nebulosa, nunca un negro plano.",
    "La luz se suma (\"lighter\"): k.brillo, k.haz, k.fogonazo, k.estallido; los colores de k.COLORES, vivos sobre lo oscuro.",
    "Las cosas, con el kit de siempre (k.estrella, k.planeta, k.tierra, k.roca) o con k.materialDelLook: un lado iluminado y el otro casi negro, como lo que alumbra una estrella.",
    "Las órbitas, rutas y trayectorias, líneas de luz finas (k.trazoDelLook).",
  ],
};
