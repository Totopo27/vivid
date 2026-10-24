// La cámara: un punto en el mundo que mira hacia otro, con perspectiva. Lo lejano sale pequeño, lo cercano grande, y
// al moverse la cámara todo se mueve como en una película. Las unidades del mundo son las que quieras; lo que importa
// es la proporción entre lo lejos que está la cámara y lo grande que es cada cosa.
import { claves, cruz, pto, res, uni } from "./base.js";

export const CX = 540, CY = 960; // el centro de la imagen
export const F = 1400;           // la focal: a distancia d, algo de tamaño s sale de F·s/d píxeles

const ejes = (f) => { const r = uni(cruz(f, [0, 1, 0])); return { f, r, u: cruz(r, f) }; };

// La cámara en P mirando a objetivo (y = arriba).
export const mira = (P, objetivo) => ({ p: P, e: ejes(uni(res(objetivo, P))) });

// Dónde sale en la imagen un punto X del mundo: { x, y, z } (z, la distancia de frente), o null si queda detrás.
export function proyecta(cam, X) {
  const d = res(X, cam.p), z = pto(d, cam.e.f);
  if (z < 0.05) return null;
  return { x: CX + (F * pto(d, cam.e.r)) / z, y: CY - (F * pto(d, cam.e.u)) / z, z };
}

// El tamaño en píxeles de algo de radio s a distancia z.
export const tamano = (s, z) => (F * s) / z;

// Un punto alrededor de un centro: ángulo (radianes, 0 = delante, hacia +z), distancia y altura.
export const orbita = (angulo, dist, alto = 0, centro = [0, 0, 0]) => [centro[0] + dist * Math.sin(angulo), centro[1] + alto, centro[2] + dist * Math.cos(angulo)];

// Una ruta de cámara: claves de [segundo, { pos, mira }]. Entre clave y clave la cámara va sin tirones y sin pararse
// (cada coordenada por una curva continua); en la primera arranca quieta y en la última se para.
// Devuelve cam(t). Para las estelas, el fotograma anterior es cam(t - 1/60).
//   const cam = ruta([[v.t("verde"), { pos: [0, 0, 40], mira: [0, 0, 0] }], [v.t("existir"), { pos: [0, 0, 400], mira: [0, 0, 0] }]]);
export function ruta(lista) {
  const ks = lista.slice().sort((a, b) => a[0] - b[0]);
  const c = (sel, i) => claves(ks.map(([t, k]) => [t, sel(k)[i]]));
  const P = [0, 1, 2].map((i) => c((k) => k.pos, i)), O = [0, 1, 2].map((i) => c((k) => k.mira, i));
  return (t) => mira([P[0](t), P[1](t), P[2](t)], [O[0](t), O[1](t), O[2](t)]);
}

// Ordena lo que se dibuja de lejos a cerca: cosas = [{ z, dibuja() }].
export function deLejosACerca(cosas) {
  cosas.sort((a, b) => b.z - a.z);
  for (const c of cosas) c.dibuja();
}
