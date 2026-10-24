// Mapas: la Tierra de verdad. Un globo con sus costas, sus desiertos, sus montañas y su hielo, el océano que brilla
// con el sol, el lado de noche con las luces de las ciudades y el borde azul de su aire; una chincheta clavada en una
// latitud y longitud, con su nombre; un arco de ruta que vuela de un sitio a otro por encima del globo; y un mapa
// plano del mundo en relieve, con sus continentes levantados como losas.
// Los datos salen de Natural Earth (dominio público): datos/mundo.json, contado en datos/LEEME.md.
// Lo pesado (la piel del globo, los caminos del mapa) se hace una vez, la primera vez que se dibuja.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Path2D } from "@napi-rs/canvas";
import { azar, lienzo } from "./base.js";
import { brillo, halo } from "./luz.js";
import { etiqueta } from "./texto.js";

const RAD = Math.PI / 180;

// Deja g como estaba también en sus colores: el restore() de @napi-rs/canvas no devuelve fillStyle ni strokeStyle.
const intacto = (fn) => function (g, ...a) { const f = g.fillStyle, s = g.strokeStyle; try { return fn(g, ...a); } finally { g.fillStyle = f; g.strokeStyle = s; } };

// ---------------------------------------------------------------- los datos
let losDatos = null;
// Un anillo de costa: de texto (polilínea de Google, 0,01°) a [lon, lat, lon, lat, ...].
function anillo(s) {
  const out = []; let i = 0, x = 0, y = 0;
  const num = () => { let r = 0, sh = 0, b; do { b = s.charCodeAt(i++) - 63; r |= (b & 0x1f) << sh; sh += 5; } while (b >= 0x20); return r & 1 ? ~(r >> 1) : r >> 1; };
  while (i < s.length) { x += num(); y += num(); out.push(x / 100, y / 100); }
  return Float32Array.from(out);
}
// Los datos, leídos una vez (la primera vez que hacen falta): cada capa, una lista de anillos.
function datos() {
  if (losDatos) return losDatos;
  const j = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "datos", "mundo.json"), "utf8"));
  const d = { ciudades: j.ciudades, luces: [] };
  for (const c of ["tierra", "hielo", "lagos", "desiertos", "montes", "tundra"]) d[c] = j[c].map(anillo);
  let lon = 0;
  for (const t of j.luces.split(";")) { const [dx, la, p] = t.split(",").map(Number); lon += dx; d.luces.push([lon / 100, la / 100, p]); }
  return (losDatos = d);
}

// El nombre sin tildes ni mayúsculas, para buscarlo.
const sinTildes = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
// Dónde está una ciudad, por su nombre (en su idioma, en español o en inglés; da igual tildes y mayúsculas):
// lugar("Nueva York") → [40.75, -73.98]. Si hay varias con ese nombre, la más poblada. null si no la conoce.
export function lugar(nombre) {
  const n = sinTildes(nombre);
  for (const c of datos().ciudades) if (sinTildes(c[0]) === n || (c[1] && sinTildes(c[1]) === n) || (c[2] && sinTildes(c[2]) === n)) return [c[3], c[4]];
  return null;
}

// ---------------------------------------------------------------- ruido que da la vuelta al mundo sin costura
function ruidoVuelta(w, h, celdas, octavas, semilla) {
  const az = azar(semilla), out = new Float32Array(w * h);
  let amp = 1, tot = 0, cx = celdas;
  for (let o = 0; o < octavas; o++) {
    const cy = Math.max(2, cx >> 1), rej = new Float32Array(cx * (cy + 1));
    for (let i = 0; i < rej.length; i++) rej[i] = az();
    for (let y = 0; y < h; y++) {
      const fy = (y / h) * cy, y0 = Math.floor(fy), a = fy - y0, ty = a * a * (3 - 2 * a), f0 = y0 * cx, f1 = Math.min(cy, y0 + 1) * cx;
      for (let x = 0; x < w; x++) {
        const fx = (x / w) * cx, x0 = Math.floor(fx), b = fx - x0, tx = b * b * (3 - 2 * b), x1 = (x0 + 1) % cx;
        const p = rej[f0 + x0] + (rej[f0 + x1] - rej[f0 + x0]) * tx, q = rej[f1 + x0] + (rej[f1 + x1] - rej[f1 + x0]) * tx;
        out[y * w + x] += amp * (p + (q - p) * ty);
      }
    }
    tot += amp; amp *= 0.5; cx *= 2;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

// ---------------------------------------------------------------- la piel del globo
// Se pinta una vez en un mapa de 4096 × 2048 (las costas, los lagos y las ciudades, nítidos) y en dos de 1024 × 512 (lo
// suave: desiertos, montañas, hielo, tundra, zonas secas, plataforma del mar), y de ahí se pasa a las seis caras de un cubo de 1024 (cada fotograma solo
// tiene que mirar en el cubo, sin trigonometría). El canal alfa de cada punto dice si es agua (0) o tierra (1-255,
// con la luz de sus ciudades).
const NC = 1024;
// Zonas secas que no vienen como desierto en los datos: [lon, lat, radio lon, radio lat, fuerza] (a ojo, de mapas
// de clima).
const SECAS = [
  [134, -25, 15, 8, 0.85], [124, -22, 7, 6, 0.8], [57, 31, 8, 4, 0.75], [47, 23, 10, 8, 0.9], [64, 41, 11, 5, 0.7],
  [103, 42, 14, 5, 0.8], [87, 34, 10, 4, 0.55], [70, 27, 4, 3, 0.6], [-114, 37, 5, 5, 0.6], [-106, 29, 5, 4, 0.55],
  [-68, -43, 3, 6, 0.55], [-70, -23, 2, 8, 0.7], [45, 7, 6, 4, 0.6], [20, -23, 7, 5, 0.6], [15, -25, 3, 6, 0.6],
  [5, 22, 25, 8, 0.6], [-40, -8, 4, 3, 0.35], [80, 46, 9, 3, 0.5],
];
let laPiel = null;
function piel() {
  if (laPiel) return laPiel;
  const D = datos(), W = 4096, H = 2048, w = 1024, h = 512;
  const camino = (anillos) => { const p = new Path2D(); for (const r of anillos) { p.moveTo(r[0], -r[1]); for (let i = 2; i < r.length; i += 2) p.lineTo(r[i], -r[i + 1]); p.closePath(); } return p; };
  const pinta = (l, fn) => { const c = l.getContext("2d"); c.fillStyle = "#000"; c.fillRect(0, 0, l.width, l.height); c.save(); c.translate(l.width / 2, l.height / 2); c.scale(l.width / 360, l.height / 180); fn(c); c.restore(); return c.getImageData(0, 0, l.width, l.height).data; };
  const tierraP = camino(D.tierra);
  // nítido: R tierra, G lagos, B luces de las ciudades (un punto por ciudad, más grande y con más barrios cuanta más
  // gente tiene)
  const azul = lienzo(32), ca = azul.getContext("2d"), dg = ca.createRadialGradient(16, 16, 0, 16, 16, 16);
  dg.addColorStop(0, "rgba(0,0,255,1)"); dg.addColorStop(0.35, "rgba(0,0,255,0.45)"); dg.addColorStop(1, "rgba(0,0,255,0)");
  ca.fillStyle = dg; ca.fillRect(0, 0, 32, 32);
  const nitido = pinta(lienzo(W, H), (c) => {
    c.fillStyle = "#ff0000"; c.fill(tierraP); c.globalCompositeOperation = "lighter"; c.fillStyle = "#00ff00"; c.fill(camino(D.lagos));
    const az = azar(907);
    for (const [lon, lat, p] of D.luces) {
      const b = Math.max(0, Math.min(1, (p / 12 - 4) / 3)), sx = 1 / Math.max(0.2, Math.cos(lat * RAD)), r = 0.05 + 0.16 * b;
      c.globalAlpha = 0.3 + 0.7 * b; c.drawImage(azul, lon - r * sx, -lat - r, 2 * r * sx, 2 * r);
      if (b > 0.3) { const R = r * (3 + 3 * b); c.globalAlpha = 0.22 * b; c.drawImage(azul, lon - R * sx, -lat - R, 2 * R * sx, 2 * R); }
      const n = b > 0.25 ? Math.round(40 * (b - 0.25) * (b - 0.25)) : 0, rr = 0.2 + 1.0 * b;
      for (let k = 0; k < n; k++) {
        const a = az() * 6.2832, d = rr * Math.sqrt(-2 * Math.log(1 - az() * 0.98)) * 0.45, t = 0.05 + az() * 0.06;
        c.globalAlpha = 0.3 + 0.6 * az(); c.drawImage(azul, lon + Math.cos(a) * d * sx - t * sx, -lat + Math.sin(a) * d - t, 2 * t * sx, 2 * t);
      }
    }
  });
  // suave 1: R desierto, G montañas, B hielo · suave 2: R plataforma (mar poco hondo), G tundra, B zonas secas
  const suave1 = pinta(lienzo(w, h), (c) => {
    c.globalCompositeOperation = "lighter";
    c.filter = "blur(3px)"; c.fillStyle = "#ff0000"; c.fill(camino(D.desiertos));
    c.filter = "blur(1px)"; c.fillStyle = "#00ff00"; c.fill(camino(D.montes)); c.fillStyle = "#0000ff"; c.fill(camino(D.hielo));
  });
  const suave2 = pinta(lienzo(w, h), (c) => {
    c.globalCompositeOperation = "lighter";
    c.filter = "blur(3px)"; c.fillStyle = "#ff0000"; c.fill(tierraP);
    c.filter = "blur(2px)"; c.fillStyle = "#00ff00"; c.fill(camino(D.tundra));
    c.filter = "blur(5px)";
    for (const [lo, la, rx, ry, f] of SECAS) { c.fillStyle = `rgba(0,0,255,${f})`; c.beginPath(); c.ellipse(lo, -la, rx, ry, 0, 0, 6.2832); c.fill(); }
  });
  const grano = ruidoVuelta(1024, 512, 6, 5, 61), fino = ruidoVuelta(2048, 1024, 48, 3, 67), seco = ruidoVuelta(512, 256, 5, 3, 71);
  // el color de la tierra según la latitud, cada cuarto de grado
  const BANDAS = [[0, [30, 82, 32]], [9, [40, 90, 36]], [16, [100, 110, 52]], [24, [92, 108, 52]], [34, [72, 108, 46]], [48, [46, 86, 42]], [60, [64, 80, 52]], [68, [106, 102, 78]], [76, [150, 148, 138]], [90, [160, 160, 152]]];
  const LUT = new Float32Array(3 * 481);
  for (let q = 0; q <= 480; q++) {
    const t = q / 4; let i = 0; while (i < BANDAS.length - 2 && t > BANDAS[i + 1][0]) i++;
    const [a, A] = BANDAS[i], [b, B] = BANDAS[i + 1], u = Math.max(0, Math.min(1, (t - a) / (b - a))), s = u * u * (3 - 2 * u);
    for (let c = 0; c < 3; c++) LUT[q * 3 + c] = A[c] + (B[c] - A[c]) * s;
  }
  // latitud y longitud de cada punto de una cara del ecuador (+Z) y de la del polo norte (+Y): las otras cuatro son
  // estas mismas, giradas
  const tabla = (polo) => {
    const la = new Float32Array(NC * NC), lo = new Float32Array(NC * NC);
    for (let j = 0; j < NC; j++) for (let i = 0; i < NC; i++) {
      const u = ((i + 0.5) / NC) * 2 - 1, v = ((j + 0.5) / NC) * 2 - 1, l = Math.sqrt(1 + u * u + v * v), q = j * NC + i;
      if (polo) { la[q] = Math.asin(1 / l) / RAD; lo[q] = Math.atan2(u, v) / RAD; } else { la[q] = Math.asin(-v / l) / RAD; lo[q] = Math.atan2(u, 1) / RAD; }
    }
    return [la, lo];
  };
  const [laE, loE] = tabla(false), [laP, loP] = tabla(true);
  const caras = new Uint32Array(6 * NC * NC), col = [0, 0, 0];
  const mezc = (c, r, g, b, u) => { c[0] += (r - c[0]) * u; c[1] += (g - c[1]) * u; c[2] += (b - c[2]) * u; };
  for (let f = 0; f < 6; f++) {
    const polo = f === 2 || f === 3, TL = polo ? laP : laE, TO = polo ? loP : loE, dl = [90, -90, 0, 180, 0, 180][f], sg = f === 3 ? -1 : 1;
    for (let j = 0; j < NC; j++) for (let i = 0; i < NC; i++) {
      const q0 = j * NC + i, lat = TL[q0] * sg;
      let lon = (f === 3 ? -TO[q0] : TO[q0]) + dl; if (lon > 180) lon -= 360; else if (lon < -180) lon += 360;
      const ex = ((lon / 360 + 0.5) * W) | 0, ey = ((0.5 - lat / 180) * H) | 0, k = ((ey < H ? ey : H - 1) * W + (ex < W ? ex : W - 1)) * 4;
      const sx = ((lon / 360 + 0.5) * w) | 0, sy = ((0.5 - lat / 180) * h) | 0, q = ((sy < h ? sy : h - 1) * w + (sx < w ? sx : w - 1)) * 4;
      // el ruido: el del mapa, y cerca de los polos el de la propia cara (para que no se junte en estrella)
      let gr = grano[(((0.5 - lat / 180) * 511) | 0) * 1024 + (((lon / 360 + 0.5) * 1023) | 0)], fi = fino[(((0.5 - lat / 180) * 1023) | 0) * 2048 + (((lon / 360 + 0.5) * 2047) | 0)];
      const al = lat < 0 ? -lat : lat;
      if (polo && al > 55) { const m = Math.min(1, (al - 55) / 15); gr += (grano[(j >> 1) * 1024 + (i >> 1)] - gr) * m; fi += (fino[j * 2048 + i] - fi) * m; }
      const tie = (nitido[k] / 255) * (1 - nitido[k + 1] / 255);
      // el mar: hondo y oscuro, verdoso en los polos, turquesa donde hay poca hondura; hielo en el Ártico
      const pl = al > 45 ? Math.min(1, (al - 45) / 30) : 0;
      let mr = 12 + 8 * pl, mg = 40 + 6 * pl, mb = 92 - 22 * pl;
      const sh = suave2[q] / 255, pf = sh * sh * 0.55, vm = 0.9 + 0.2 * gr;
      mr = (mr + (34 - mr) * pf) * vm; mg = (mg + (118 - mg) * pf) * vm; mb = (mb + (150 - mb) * pf) * vm;
      const hm = lat > 72 ? Math.max(0, Math.min(1, (lat - 81 + 12 * (gr - 0.5) + 10 * (fi - 0.5)) / 1.5)) * 0.85 : 0;
      if (hm > 0) { const b = 0.7 + 0.35 * fi; mr += (214 * b - mr) * hm; mg += (224 * b - mg) * hm; mb += (232 * b - mb) * hm; }
      let R = mr, G = mg, B = mb, luz = 0;
      if (tie > 0.002) {
        // la tierra: la franja de su latitud, manchas más secas, desiertos, tundra, montañas y hielo
        const lq = Math.max(0, Math.min(480, ((al + 14 * (gr - 0.5)) * 4) | 0)) * 3;
        col[0] = LUT[lq]; col[1] = LUT[lq + 1]; col[2] = LUT[lq + 2];
        const s2 = seco[(((0.5 - lat / 180) * 255) | 0) * 512 + (((lon / 360 + 0.5) * 511) | 0)];
        if (s2 > 0.55 && al < 60) mezc(col, 128, 118, 72, Math.min(1, (s2 - 0.55) * 2.2) * 0.6);
        const ds = Math.max(suave1[q] / 255, (suave2[q + 2] / 255) * (0.55 + 0.6 * gr));
        if (ds > 0.01) { const roja = lon > 110 && lat < -10, cl = 0.88 + 0.24 * fi; mezc(col, (roja ? 190 : 218) * cl, (roja ? 112 : 178) * cl, (roja ? 64 : 116) * cl, Math.min(1, ds * 1.15)); }
        const tu = suave2[q + 1] / 255; if (tu > 0.01) mezc(col, 108, 102, 80, tu * 0.7);
        const mo = suave1[q + 1] / 255; if (mo > 0.01) { const cr = 0.6 + 1.6 * Math.abs(fi - 0.5); mezc(col, 104 * cr, 88 * cr, 70 * cr, mo * 0.7); }
        const hi = suave1[q + 2] / 255; if (hi > 0.01) { const b = 0.86 + 0.18 * fi; mezc(col, 232 * b, 238 * b, 246 * b, Math.min(1, hi * 1.2)); }
        const vt = 0.82 + 0.36 * fi;
        R += (col[0] * vt - R) * tie; G += (col[1] * vt - G) * tie; B += (col[2] * vt - B) * tie;
        if (tie > 0.5) luz = 1 + Math.round(254 * (nitido[k + 2] / 255) * (1 - hi));
      }
      caras[f * NC * NC + q0] = ((luz << 24) | (Math.min(255, B) << 16) | (Math.min(255, G) << 8) | Math.min(255, R)) >>> 0;
    }
  }
  // los niveles más pequeños (para el globo pequeño, sin que las costas y las luces parpadeen)
  const niveles = [caras];
  for (let n = NC / 2; n >= 128; n >>= 1) {
    const a = niveles[niveles.length - 1], m = n * 2, b = new Uint32Array(6 * n * n);
    for (let f = 0; f < 6; f++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      let r = 0, gg = 0, bb = 0, lz = 0, agua = 0;
      for (let q = 0; q < 4; q++) { const c = a[f * m * m + (2 * j + (q >> 1)) * m + 2 * i + (q & 1)]; r += c & 255; gg += (c >>> 8) & 255; bb += (c >>> 16) & 255; const z = c >>> 24; if (z) lz += z; else agua++; }
      const z = agua > 2 ? 0 : Math.max(1, Math.round(lz / 4));
      b[f * n * n + j * n + i] = ((z << 24) | ((bb >> 2) << 16) | ((gg >> 2) << 8) | (r >> 2)) >>> 0;
    }
    niveles.push(b);
  }
  return (laPiel = niveles);
}

// ---------------------------------------------------------------- la vista del globo
const geo = (lat, lon) => { const a = lat * RAD, b = lon * RAD; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; };
// La vista de un globo: centrado en (x, y) de la pantalla, de radio rad, con el punto (lat, lon) mirando de frente.
// inclina: gira la imagen del globo (radianes; el eje de la Tierra inclinado). Sirve para colocar cosas encima antes
// de dibujarlo (globo() devuelve la misma).
export function vistaGlobo(x, y, rad, lon = 0, lat = 0, inclina = 0) {
  const a = -lat * RAD, b = lon * RAD, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cr = Math.cos(inclina), sr = Math.sin(inclina);
  // de la vista (x derecha, y arriba, z hacia quien mira) al mundo: primero el giro de la imagen, luego la latitud y
  // luego la longitud
  const Rx = [[1, 0, 0], [0, ca, -sa], [0, sa, ca]], Ry = [[cb, 0, sb], [0, 1, 0], [-sb, 0, cb]], Rz = [[cr, sr, 0], [-sr, cr, 0], [0, 0, 1]];
  const mul = (A, B) => A.map((f) => [0, 1, 2].map((j) => f[0] * B[0][j] + f[1] * B[1][j] + f[2] * B[2][j]));
  return { x, y, rad, lon, lat, M: mul(mul(Ry, Rx), Rz) };
}
// Del mundo a la vista: [x derecha, y arriba, z hacia quien mira], en radios del globo.
const aVista = (V, P) => { const M = V.M; return [M[0][0] * P[0] + M[1][0] * P[1] + M[2][0] * P[2], M[0][1] * P[0] + M[1][1] * P[1] + M[2][1] * P[2], M[0][2] * P[0] + M[1][2] * P[1] + M[2][2] * P[2]]; };

// Dónde cae en la pantalla un punto del globo (lat, lon), a una altura alto (en radios: 0, en el suelo).
// → { x, y, z, visible, frente }: z de -1 (detrás) a 1 (de frente); visible, si no lo tapa el globo; frente, de 0 a 1,
// cuánto se ve de cara (para que lo que se va por el borde se apague solo).
export function sobreGlobo(V, lat, lon, alto = 0) {
  const p = geo(lat, lon), v = aVista(V, [p[0] * (1 + alto), p[1] * (1 + alto), p[2] * (1 + alto)]);
  const fuera = v[0] * v[0] + v[1] * v[1] > 1;
  return { x: V.x + v[0] * V.rad, y: V.y - v[1] * V.rad, z: v[2], visible: v[2] > 0 || fuera, frente: Math.max(0, Math.min(1, (v[2] / (1 + alto) + 0.02) / 0.22)) };
}

let pasoGlobo = null;
// Pone el globo calculado en su sitio: tal cual si es a su tamaño (suavizar una copia 1:1 es lento y no hace nada), y
// suavizado si hay que agrandarlo.
function ponGlobo(g, x0, y0, bw, bh, s) {
  if (s >= 1) { g.imageSmoothingEnabled = false; g.drawImage(pasoGlobo.l, x0, y0); }
  else { g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "medium"; g.drawImage(pasoGlobo.l, 0, 0, bw, bh, x0, y0, bw / s, bh / s); }
}
// El globo terráqueo en (x, y), de radio rad (px), mirando de frente al punto (lat, lon): costas de verdad, mar con el
// brillo del sol, noche con las luces de las ciudades y el aire alrededor. Para que gire, mueve lon con el tiempo.
//   luz: de dónde viene el sol, en la pantalla [x derecha, y abajo, z hacia quien mira] (por defecto arriba a la
//        izquierda y un poco de frente: se ve la noche a la derecha). sol: [lat, lon] del punto que tiene el sol
//        encima, en vez de luz (el día y la noche de verdad, pegados al mapa).
//   noche: cuánto brillan las ciudades de noche (0 a 1,5) · aire: el halo azul (0 a 1) · mar: el brillo del sol en el
//   agua (0 a 1) · inclina: gira la imagen (radianes).
// Devuelve su vista, para poner encima chinchetas y rutas (sobreGlobo, chincheta, rutaEnGlobo).
// La primera vez tarda (pinta la piel, ~0,5 s); después, unos 10 ms por fotograma con rad 460 (3 con rad 150; si no
// ha cambiado nada desde el fotograma anterior, 1).
export const globo = intacto(function globo(g, x, y, rad, lon = 0, lat = 0, op = {}) {
  const V = vistaGlobo(x, y, rad, lon, lat, op.inclina || 0);
  if (rad < 1) return V;
  const aire = op.aire ?? 1, noche = op.noche ?? 1, brilloMar = op.mar ?? 1;
  let L;
  if (op.sol) L = aVista(V, geo(op.sol[0], op.sol[1]));
  else { const l = op.luz || [-0.75, -0.45, 0.55]; L = [l[0], -l[1], l[2]]; }
  const ll = Math.hypot(L[0], L[1], L[2]) || 1; L = [L[0] / ll, L[1] / ll, L[2] / ll];
  const Hm = [L[0], L[1], L[2] + 1], hl = Math.hypot(Hm[0], Hm[1], Hm[2]) || 1; Hm[0] /= hl; Hm[1] /= hl; Hm[2] /= hl;
  g.save();
  // el aire por fuera: un halo azul, más fuerte del lado del sol
  if (aire > 0) {
    const dia = Math.hypot(L[0], L[1]), ox = (L[0] / (dia || 1)) * rad * 0.05 * dia, oy = (-L[1] / (dia || 1)) * rad * 0.05 * dia;
    const ha = g.createRadialGradient(x + ox, y + oy, rad * 0.96, x + ox, y + oy, rad * 1.13);
    const f = 0.25 + 0.5 * Math.max(0, L[2] + 0.4 * dia);
    ha.addColorStop(0, `rgba(110,175,255,${0.75 * aire * f})`); ha.addColorStop(0.35, `rgba(80,140,255,${0.25 * aire * f})`); ha.addColorStop(1, "rgba(60,110,255,0)");
    g.fillStyle = ha; g.beginPath(); g.arc(x + ox, y + oy, rad * 1.13, 0, Math.PI * 2); g.moveTo(x + rad * 0.985, y); g.arc(x, y, rad * 0.985, 0, Math.PI * 2, true); g.fill();
  }
  // la ventana de pantalla que ocupa el globo, y a qué resolución se calcula (nunca más fina que la piel)
  const x0 = Math.max(0, Math.floor(x - rad - 1)), x1 = Math.min(1080, Math.ceil(x + rad + 1)), y0 = Math.max(0, Math.floor(y - rad - 1)), y1 = Math.min(1920, Math.ceil(y + rad + 1));
  if (x1 <= x0 || y1 <= y0) { g.restore(); return V; }
  const niveles = piel(), vuelta = 2 * Math.PI * rad;
  let nivel = 0;
  while (nivel < niveles.length - 1 && 4 * (NC >> (nivel + 1)) >= vuelta * 1.05) nivel++;
  const n = NC >> nivel, tex = niveles[nivel], s = Math.min(1, (4 * NC * 1.25) / vuelta);
  const bw = Math.ceil((x1 - x0) * s), bh = Math.ceil((y1 - y0) * s);
  const AW = bw, M = V.M, n2 = n * n, hn = n / 2, bil = vuelta > 4 * NC * 0.85;
  // el lienzo de paso, justo del tamaño de la ventana (si no, copiarlo cuesta más que pintarlo)
  if (!pasoGlobo || pasoGlobo.w !== bw || pasoGlobo.h !== bh) { const l = lienzo(bw, bh), img = l.getContext("2d").createImageData(bw, bh); pasoGlobo = { l, img, w: bw, h: bh, px: new Uint32Array(img.data.buffer) }; }
  const px = pasoGlobo.px, clave = [x, y, rad, lon, lat, op.inclina || 0, L.join(","), noche, brilloMar, aire, nivel].join("|");
  // si es el mismo globo que en el fotograma anterior (quieto), se pone el de antes
  if (pasoGlobo.clave === clave) { ponGlobo(g, x0, y0, bw, bh, s); g.restore(); return V; }
  pasoGlobo.clave = clave;
  const m00 = M[0][0], m01 = M[0][1], m02 = M[0][2], m10 = M[1][0], m11 = M[1][1], m12 = M[1][2], m20 = M[2][0], m21 = M[2][1], m22 = M[2][2];
  const Lx = L[0], Ly = L[1], Lz = L[2], Hx = Hm[0], Hy = Hm[1], Hz = Hm[2], pu = 1 / (rad * s), dentro = (1 - 2 * pu) * (1 - 2 * pu), kn = (noche * 2.6) / 255, km = brilloMar, ka = aire;
  for (let j = 0; j < bh; j++) {
    const vy = -((y0 + (j + 0.5) / s) - y) / rad, fila = j * AW, an = 1 - vy * vy;
    if (an <= -2 * pu) { px.fill(0, fila, fila + bw); continue; }
    const sp = Math.sqrt(Math.max(0, an)) + 2 * pu, ia = Math.max(0, Math.floor(((x - sp * rad) - x0) * s)), ib = Math.max(ia, Math.min(bw, Math.ceil(((x + sp * rad) - x0) * s)));
    if (ia > 0) px.fill(0, fila, fila + ia);
    if (ib < bw) px.fill(0, fila + ib, fila + bw);
    for (let i = ia; i < ib; i++) {
      const vx = ((x0 + (i + 0.5) / s) - x) / rad, d2 = vx * vx + vy * vy, cub = d2 < dentro ? 255 : (Math.min(1, Math.max(0, (1 - Math.sqrt(d2)) / pu + 0.5)) * 255) | 0;
      if (cub === 0) { px[fila + i] = 0; continue; }
      const vz = d2 < 1 ? Math.sqrt(1 - d2) : 0;
      const X = m00 * vx + m01 * vy + m02 * vz, Y = m10 * vx + m11 * vy + m12 * vz, Z = m20 * vx + m21 * vy + m22 * vz;
      const ax = X < 0 ? -X : X, ay = Y < 0 ? -Y : Y, az = Z < 0 ? -Z : Z;
      let f, u, w;
      if (ax >= ay && ax >= az) { f = X > 0 ? 0 : 1; const k = 1 / ax; u = (X > 0 ? -Z : Z) * k; w = -Y * k; }
      else if (ay >= az) { f = Y > 0 ? 2 : 3; const k = 1 / ay; u = X * k; w = (Y > 0 ? Z : -Z) * k; }
      else { f = Z > 0 ? 4 : 5; const k = 1 / az; u = (Z > 0 ? X : -X) * k; w = -Y * k; }
      let R, G, B, A;
      if (bil) {
        // de cerca, mezclando los cuatro puntos de la piel más cercanos (si no, las costas salen en escalera)
        const fu = (u + 1) * hn - 0.5, fw = (w + 1) * hn - 0.5;
        let i0 = fu | 0, j0 = fw | 0; if (i0 > n - 2) i0 = n - 2; if (j0 > n - 2) j0 = n - 2; if (i0 < 0) i0 = 0; if (j0 < 0) j0 = 0;
        let tx = fu - i0, ty = fw - j0; tx = tx < 0 ? 0 : tx > 1 ? 1 : tx; ty = ty < 0 ? 0 : ty > 1 ? 1 : ty;
        const b0 = f * n2 + j0 * n + i0, c0 = tex[b0], c1 = tex[b0 + 1], c2 = tex[b0 + n], c3 = tex[b0 + n + 1];
        const w0 = (1 - tx) * (1 - ty), w1 = tx * (1 - ty), w2 = (1 - tx) * ty, w3 = tx * ty, a0 = c0 >>> 24, a1 = c1 >>> 24, a2 = c2 >>> 24, a3 = c3 >>> 24;
        R = (c0 & 255) * w0 + (c1 & 255) * w1 + (c2 & 255) * w2 + (c3 & 255) * w3;
        G = ((c0 >>> 8) & 255) * w0 + ((c1 >>> 8) & 255) * w1 + ((c2 >>> 8) & 255) * w2 + ((c3 >>> 8) & 255) * w3;
        B = ((c0 >>> 16) & 255) * w0 + ((c1 >>> 16) & 255) * w1 + ((c2 >>> 16) & 255) * w2 + ((c3 >>> 16) & 255) * w3;
        const tierra = (a0 ? w0 : 0) + (a1 ? w1 : 0) + (a2 ? w2 : 0) + (a3 ? w3 : 0);
        A = tierra < 0.5 ? 0 : Math.max(1, a0 * w0 + a1 * w1 + a2 * w2 + a3 * w3);
      } else {
        let ti = ((u + 1) * hn) | 0, tj = ((w + 1) * hn) | 0; if (ti >= n) ti = n - 1; if (tj >= n) tj = n - 1;
        const c = tex[f * n2 + tj * n + ti];
        A = c >>> 24; R = c & 255; G = (c >>> 8) & 255; B = (c >>> 16) & 255;
      }
      // el sol: de lleno, de lado, la raya del atardecer y la noche (un poco azulada)
      const d = vx * Lx + vy * Ly + vz * Lz, t0 = d < -0.1 ? 0 : d > 0.22 ? 1 : (d + 0.1) / 0.32, dia = t0 * t0 * (3 - 2 * t0);
      const lum = 0.03 + 1.15 * (d > 0 ? Math.sqrt(d) * 0.7 + d * 0.3 : 0) * (0.35 + 0.65 * dia), k = (1 - dia) * 0.05;
      R *= lum + 0.6 * k; G *= lum + 0.8 * k; B *= lum + 1.4 * k;
      if (d > -0.02 && d < 0.14) { const o = Math.exp(-((d - 0.05) * (d - 0.05)) / 0.0008); R += 12 * o; G += 3 * o; }
      // el mar refleja el sol; las ciudades se encienden de noche
      if (A === 0) { if (km > 0 && dia > 0) { const hh = vx * Hx + vy * Hy + vz * Hz; if (hh > 0.88) { const h4 = hh * hh * hh * hh, h16 = h4 * h4 * h4 * h4, h64 = h16 * h16 * h16 * h16, e = (h64 * h64 * 0.55 + h16 * 0.04) * km * dia; R += 255 * e; G += 245 * e; B += 225 * e; } } }
      else if (A > 1 && kn > 0 && dia < 0.98) { const nl = A * (1 - dia) * (1 - dia) * kn; R += 255 * nl; G += 186 * nl; B += 96 * nl; if (nl > 0.5) { const b = (nl - 0.5) * 120; R += b; G += b; B += b * 0.7; } }
      // el aire por dentro: el borde se vuelve azul
      if (ka > 0) { const b = 1 - vz, rim = b * b * b * ka * (0.15 + 0.85 * dia); R += (90 - R * 0.5) * rim; G += (150 - G * 0.4) * rim; B += (255 - B * 0.2) * rim; }
      px[fila + i] = (cub << 24 | (B > 255 ? 255 : B < 0 ? 0 : B) << 16 | (G > 255 ? 255 : G < 0 ? 0 : G) << 8 | (R > 255 ? 255 : R < 0 ? 0 : R)) >>> 0;
    }
  }
  pasoGlobo.l.getContext("2d").putImageData(pasoGlobo.img, 0, 0);
  ponGlobo(g, x0, y0, bw, bh, s);
  g.restore();
  return V;
});

// ---------------------------------------------------------------- la chincheta
// Una chincheta clavada en p = { x, y } de la pantalla (lo que da sobreGlobo o enMapa), con su nombre encima.
// u de 0 a 1: cae desde arriba, se clava (rebota un poco y suelta una onda en el suelo) y sale su nombre.
//   color "r,g,b" · tam: su tamaño (1 = 40 px de cabeza) · letra: el alto del nombre · al: transparencia. Si p trae
//   frente (sobreGlobo), se apaga sola al irse por el borde del globo.
export const chincheta = intacto(function chincheta(g, p, texto = "", u = 1, op = {}) {
  const al = (op.al ?? 1) * (p.frente ?? 1) * (p.visible === false ? 0 : 1);
  if (al <= 0.003 || u <= 0) return;
  const col = op.color || "255,84,72", e = op.tam ?? 1, r = 40 * e, h = 118 * e, A = g.globalAlpha;
  const cae = Math.min(1, u / 0.45), dy = -420 * e * (1 - cae * cae), clava = u > 0.45 ? (u - 0.45) / 0.55 : 0;
  const bote = clava > 0 ? Math.sin(Math.min(1, clava * 3.2) * Math.PI) * Math.exp(-clava * 3) : 0, ap = 1 - 0.1 * bote;
  const x = p.x, y = p.y;
  g.save();
  g.globalAlpha = A * al;
  // la onda en el suelo y la sombra
  if (clava > 0) {
    const o = Math.min(1, clava * 1.4), ro = r * (0.6 + 2.4 * o);
    g.strokeStyle = `rgba(${col},${0.85 * (1 - o)})`; g.lineWidth = 6 * e * (1 - o) + 1;
    g.beginPath(); g.ellipse(x, y, ro, ro * 0.36, 0, 0, Math.PI * 2); g.stroke();
  }
  const ac = Math.min(1, cae * cae);
  g.save(); g.globalAlpha = A * al * 0.55 * ac; g.filter = `blur(${Math.round(5 * e)}px)`;
  g.fillStyle = "#000"; g.beginPath(); g.ellipse(x + r * 0.35, y + r * 0.08, r * 0.9 * (1.4 - 0.4 * ac), r * 0.28, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  brillo(g, x, y, r * 3.2, col, 0.5 * ac);
  // la forma: una gota con la punta en el suelo
  g.translate(x, y + dy); g.scale(1 / Math.sqrt(ap), ap);
  const fi = Math.asin(r / h), cy = -h;
  g.beginPath(); g.moveTo(0, 0); g.arc(0, cy, r, Math.PI - fi, 2 * Math.PI + fi); g.closePath();
  const cuerpo = g.createLinearGradient(-r, 0, r, 0);
  cuerpo.addColorStop(0, `rgb(${col})`); cuerpo.addColorStop(0.55, `rgba(${col},1)`); cuerpo.addColorStop(1, "rgb(70,14,14)");
  g.fillStyle = cuerpo; g.fill();
  g.save(); g.clip();
  const bola = g.createRadialGradient(-r * 0.35, cy - r * 0.4, r * 0.05, 0, cy, r * 1.5);
  bola.addColorStop(0, "rgba(255,255,255,0.75)"); bola.addColorStop(0.25, "rgba(255,255,255,0.12)"); bola.addColorStop(0.7, "rgba(0,0,0,0)"); bola.addColorStop(1, "rgba(0,0,0,0.5)");
  g.fillStyle = bola; g.fillRect(-r * 1.2, cy - r * 1.2, r * 2.4, h + r * 1.3);
  const pie = g.createLinearGradient(0, cy + r * 0.3, 0, 0);
  pie.addColorStop(0, "rgba(0,0,0,0)"); pie.addColorStop(1, "rgba(0,0,0,0.45)");
  g.fillStyle = pie; g.fillRect(-r, cy, r * 2, h - cy);
  g.restore();
  // el agujero de dentro, claro, y el brillo de arriba
  const hu = g.createRadialGradient(-r * 0.1, cy - r * 0.12, 0, 0, cy, r * 0.42);
  hu.addColorStop(0, "#ffffff"); hu.addColorStop(0.7, "#f1e7e2"); hu.addColorStop(1, "#c9b3ab");
  g.fillStyle = hu; g.beginPath(); g.arc(0, cy, r * 0.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.ellipse(-r * 0.42, cy - r * 0.55, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2); g.fill();
  g.restore();
  // el nombre, encima
  if (texto && u > 0.5) {
    const ae = Math.min(1, (u - 0.5) / 0.3), tam = Math.round((op.letra ?? 50) * Math.max(0.7, e));
    g.save(); g.font = `800 ${tam}px Figtree`;
    const w = g.measureText(texto).width + 52, hh = tam + 24;
    g.restore();
    const lx = Math.max(24, Math.min(1080 - 24 - w, x - w / 2)), ly = y + dy - h - r - 22 - hh + 16 * (1 - ae);
    g.save(); g.globalAlpha = A * al;
    etiqueta(g, lx, ly, texto, op.colorTexto || "255,255,255", ae * ae, tam);
    g.restore();
  }
});

// ---------------------------------------------------------------- la ruta sobre el globo
// Un arco de a a b ([lat, lon]) que vuela por encima del globo de la vista V (lo que devuelve globo), dibujado hasta u
// (0 a 1): una línea de luz con su cabeza brillante, su sombra en el suelo y un punto en cada extremo. Lo que pasa por
// detrás del globo no se ve. alto: lo que sube en medio (en radios; por defecto según lo lejos que estén).
// color "r,g,b" · ancho: el grueso de la línea (px). Devuelve dónde está la cabeza { x, y, visible }.
export const rutaEnGlobo = intacto(function rutaEnGlobo(g, V, a, b, u = 1, op = {}) {
  const col = op.color || "255,214,110", an = op.ancho ?? 7, A = geo(a[0], a[1]), B = geo(b[0], b[1]);
  const om = Math.acos(Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2]))), alto = op.alto ?? 0.08 + 0.4 * (om / Math.PI);
  const N = Math.max(8, Math.ceil(om * 60)), so = Math.sin(om) || 1;
  const punto = (s, h) => {
    const p = om < 1e-4 ? A : [0, 1, 2].map((i) => (Math.sin((1 - s) * om) * A[i] + Math.sin(s * om) * B[i]) / so);
    const k = 1 + h * Math.sin(Math.PI * s), v = aVista(V, [p[0] * k, p[1] * k, p[2] * k]);
    return { x: V.x + v[0] * V.rad, y: V.y - v[1] * V.rad, ve: v[2] > 0 || v[0] * v[0] + v[1] * v[1] > 1, z: v[2] };
  };
  const ue = Math.max(0, Math.min(1, u)), Aa = g.globalAlpha;
  const tramos = (h) => { const out = []; let cur = null; for (let i = 0; i <= N; i++) { const s = Math.min(ue, i / N), p = punto(s, h); if (p.ve) { if (!cur) out.push((cur = [])); cur.push(p); } else cur = null; if (i / N >= ue) break; } return out; };
  const traza = (lista) => { for (const t of lista) { if (t.length < 2) continue; g.beginPath(); g.moveTo(t[0].x, t[0].y); for (let i = 1; i < t.length; i++) g.lineTo(t[i].x, t[i].y); g.stroke(); } };
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  // la sombra en el suelo
  if (ue > 0) {
    g.globalAlpha = Aa * 0.5; g.strokeStyle = "rgba(0,8,20,0.8)"; g.lineWidth = an * 0.9; g.setLineDash([an * 1.6, an * 1.6]);
    traza(tramos(0).map((t) => t.filter((p) => p.z > 0)));
    g.setLineDash([]);
  }
  // los extremos
  for (const [P, on] of [[a, 1], [b, ue >= 0.999 ? 1 : 0]]) {
    if (!on) continue;
    const q = sobreGlobo(V, P[0], P[1]);
    if (!q.visible || q.z <= 0) continue;
    g.globalAlpha = Aa * q.frente; brillo(g, q.x, q.y, an * 9, col, 0.9);
    g.fillStyle = `rgb(${col})`; g.beginPath(); g.arc(q.x, q.y, an * 0.9, 0, Math.PI * 2); g.fill();
  }
  // la línea: un halo ancho que se suma y un núcleo claro
  const lt = tramos(alto);
  g.globalAlpha = Aa; g.globalCompositeOperation = "lighter";
  g.strokeStyle = `rgba(${col},0.22)`; g.lineWidth = an * 3.2; traza(lt);
  g.strokeStyle = `rgba(${col},0.95)`; g.lineWidth = an; traza(lt);
  g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = an * 0.35; traza(lt);
  g.globalCompositeOperation = "source-over";
  const cab = punto(ue, alto);
  if (cab.ve && ue > 0 && ue < 0.999) { brillo(g, cab.x, cab.y, an * 14, col, 1); brillo(g, cab.x, cab.y, an * 5, "blanca", 0.9); }
  g.restore();
  return { x: cab.x, y: cab.y, visible: cab.ve };
});

// ---------------------------------------------------------------- el mapa plano
// La proyección Natural Earth (Šavrič, Patterson, Jenny): el mundo entero, con los polos redondeados. → [x, y] con y
// hacia arriba; el mundo mide 5,47 de ancho y 2,84 de alto.
function proyNE(lat, lon) {
  const f = lat * RAD, l = lon * RAD, f2 = f * f, f4 = f2 * f2;
  return [l * (0.8707 - 0.131979 * f2 + f4 * (-0.013791 + f4 * f2 * (0.003971 - 0.001529 * f2))), f * (1.007226 + f2 * (0.015085 + f4 * (-0.044475 + 0.028874 * f2 - 0.005916 * f4)))];
}
const ANCHO_NE = 2 * 0.8707 * Math.PI;
// Una tesela de ruido que se repite sin costura por los cuatro lados (n × n, en grises): "manchas" o "lineas".
function tesela(n, celdas, octavas, semilla, modo) {
  const az = azar(semilla), v = new Float32Array(n * n);
  let amp = 1, tot = 0, c = celdas;
  for (let o = 0; o < octavas; o++) {
    const rej = new Float32Array(c * c);
    for (let i = 0; i < rej.length; i++) rej[i] = az();
    for (let y = 0; y < n; y++) {
      const fy = (y / n) * c, y0 = Math.floor(fy), a = fy - y0, ty = a * a * (3 - 2 * a), f0 = y0 * c, f1 = ((y0 + 1) % c) * c;
      for (let x = 0; x < n; x++) {
        const fx = (x / n) * c, x0 = Math.floor(fx), b = fx - x0, tx = b * b * (3 - 2 * b), x1 = (x0 + 1) % c;
        const p = rej[f0 + x0] + (rej[f0 + x1] - rej[f0 + x0]) * tx, q = rej[f1 + x0] + (rej[f1 + x1] - rej[f1 + x0]) * tx;
        v[y * n + x] += amp * (p + (q - p) * ty);
      }
    }
    tot += amp; amp *= 0.55; c *= 2;
  }
  const l = lienzo(n), cx = l.getContext("2d"), img = cx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const s = v[i] / tot, g = modo === "lineas" ? 1 - 0.5 * Math.pow(1 - Math.min(1, Math.abs(2 * s - 1) * 4.5), 2) : Math.max(0, Math.min(1, (s - 0.5) * 2.2 + 0.5));
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = Math.round(255 * g); img.data[i * 4 + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  return l;
}
// Una textura gris hecha sombra: negra (o del color dado) donde es oscura, transparente donde es blanca. Se pone
// encima sin "multiply", que es más lento.
function sombraDe(src, fuerza, rgb) {
  const n = src.width, c = src.getContext("2d"), d = c.getImageData(0, 0, n, n), l = lienzo(n), cl = l.getContext("2d"), o = cl.createImageData(n, n), [r, g, b] = rgb.split(",").map(Number);
  for (let i = 0; i < n * n; i++) { o.data[i * 4] = r; o.data[i * 4 + 1] = g; o.data[i * 4 + 2] = b; o.data[i * 4 + 3] = Math.round(255 * fuerza * (1 - d.data[i * 4] / 255)); }
  cl.putImageData(o, 0, 0);
  return l;
}
let losCaminos = null;
function caminosMapa() {
  if (losCaminos) return losCaminos;
  const D = datos();
  // cada tramo largo se parte en trozos de un grado, para que siga la curva de la proyección
  const camino = (anillos) => {
    const p = new Path2D();
    for (const r of anillos) {
      const n = r.length / 2;
      for (let i = 0; i <= n; i++) {
        const lo = r[(i % n) * 2], la = r[(i % n) * 2 + 1];
        if (i === 0) { const q = proyNE(la, lo); p.moveTo(q[0], -q[1]); continue; }
        const lo0 = r[(i - 1) * 2], la0 = r[(i - 1) * 2 + 1], m = Math.ceil(Math.max(Math.abs(lo - lo0), Math.abs(la - la0)));
        for (let k = 1; k <= m; k++) { const q = proyNE(la0 + ((la - la0) * k) / m, lo0 + ((lo - lo0) * k) / m); p.lineTo(q[0], -q[1]); }
      }
      p.closePath();
    }
    return p;
  };
  const borde = new Path2D();
  for (let i = 0; i <= 180; i++) { const q = proyNE(90 - i, 180); i ? borde.lineTo(q[0], -q[1]) : borde.moveTo(q[0], -q[1]); }
  for (let i = 0; i <= 180; i++) { const q = proyNE(-90 + i, -180); borde.lineTo(q[0], -q[1]); }
  borde.closePath();
  const rejilla = new Path2D();
  for (let lo = -150; lo <= 150; lo += 30) for (let la = -90; la <= 90; la += 2) { const q = proyNE(la, lo); la === -90 ? rejilla.moveTo(q[0], -q[1]) : rejilla.lineTo(q[0], -q[1]); }
  for (let la = -60; la <= 60; la += 30) for (let lo = -180; lo <= 180; lo += 3) { const q = proyNE(la, lo); lo === -180 ? rejilla.moveTo(q[0], -q[1]) : rejilla.lineTo(q[0], -q[1]); }
  // las texturas: el mar, un moteado; la tierra, vetas finas por encima del moteado
  const suelo = tesela(512, 12, 3, 83, "lineas"), cs = suelo.getContext("2d");
  cs.globalCompositeOperation = "multiply"; cs.drawImage(tesela(512, 5, 4, 85, "manchas"), 0, 0);
  const grano = sombraDe(tesela(512, 6, 4, 81, "manchas"), 0.3, "0,8,24"), tierraT = sombraDe(suelo, 0.6, "8,16,4");
  return (losCaminos = { tierra: camino(D.tierra), lagos: camino(D.lagos), hielo: camino(D.hielo), desiertos: camino(D.desiertos), montes: camino(D.montes), borde, rejilla, grano, suelo: tierraT });
}
// Las luces de las ciudades del mapa plano, pintadas una vez.
let lucesMapa = null;
function lucesDelMapa() {
  if (lucesMapa) return lucesMapa;
  const W = 3000, k = W / ANCHO_NE, H = Math.ceil(k * 2.85), l = lienzo(W, H), c = l.getContext("2d"), s = halo("255,196,110");
  c.globalCompositeOperation = "lighter";
  for (const [lon, lat, p] of datos().luces) {
    const b = Math.max(0, Math.min(1, (p / 12 - 4) / 3)), q = proyNE(lat, lon), r = 2.5 + 14 * b * b;
    c.globalAlpha = 0.15 + 0.85 * b * b; c.drawImage(s, W / 2 + q[0] * k - r, H / 2 - q[1] * k - r, 2 * r, 2 * r);
  }
  return (lucesMapa = { l, k });
}
// Una textura pegada al mapa que no se emborrona al acercarse: dos teselas, una el doble de fina que la otra, que se
// van relevando según el zoom (una sola si dos = false). Solo dentro de la caja [x0, y0, x1, y1].
function texturaPegada(g, img, M, base, al, caja, dos = true) {
  const z = Math.log2((base * M.k) / 420), L = Math.floor(z), f = dos ? z - L : 0, per = (base * M.k) / Math.pow(2, L);
  g.imageSmoothingQuality = "low";
  for (const [p, w] of [[per, 1 - f], [per / 2, f]]) {
    if (w * al < 0.02) continue;
    g.globalAlpha = al * w;
    const i0 = Math.floor((caja[0] - M.x0) / p), j0 = Math.floor((caja[1] - M.y0) / p);
    for (let j = j0; M.y0 + j * p < caja[3]; j++) for (let i = i0; M.x0 + i * p < caja[2]; i++) {
      const x = Math.round(M.x0 + i * p), y = Math.round(M.y0 + j * p);
      g.drawImage(img, x, y, Math.round(M.x0 + (i + 1) * p) - x, Math.round(M.y0 + (j + 1) * p) - y);
    }
  }
}

// Dónde cae (lat, lon) en el mapa plano M (lo que devuelve mapaPlano) → { x, y }.
export function enMapa(M, lat, lon) { const q = proyNE(lat, lon); return { x: M.x0 + q[0] * M.k, y: M.y0 - q[1] * M.k }; }

// La tierra del mapa plano (sin el mar) en el lienzo c, vista M: su sombra, el canto de las losas, el borde de luz y la
// cara de arriba (pintada en el lienzo de paso cara y recortada a la forma de la tierra de una vez: recortar cada
// cosa por la costa es muy lento, y "destination-in" con la costa entera falla de muy cerca).
function pintaTierra(c, cara, M, grueso, op, caja) {
  const C = caminosMapa(), k = M.k, noche = op.noche || 0, tono = op.tono || "#5f9a4c";
  const [x0, y0, w, h] = [caja[0], caja[1], caja[2] - caja[0], caja[3] - caja[1]];
  const enUnidades = (g, dx = 0, dy = 0) => g.setTransform(k, 0, 0, k, M.x0 + dx, M.y0 + dy), recto = (g) => g.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = "#020a14";
  for (let i = 2; i >= 1; i--) { c.globalAlpha = 0.28; enUnidades(c, grueso * 0.35 * i, grueso * (0.6 + 0.8 * i)); c.fill(C.tierra); }
  c.globalAlpha = 1;
  enUnidades(c, 0, grueso); c.fillStyle = "#143220"; c.fill(C.tierra);
  enUnidades(c, 0, grueso * 0.5); c.fillStyle = "#21492c"; c.fill(C.tierra);
  const b = Math.max(1, grueso * 0.14); enUnidades(c, -b, -b); c.fillStyle = `rgba(214,255,190,${0.7 - 0.35 * noche})`; c.fill(C.tierra);
  recto(c);
  const g = cara.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, cara.width, cara.height);
  const tg = g.createLinearGradient(M.x0 - 2 * k, M.y0 - 1.4 * k, M.x0 + 2 * k, M.y0 + 1.4 * k);
  tg.addColorStop(0, "#9fd07a"); tg.addColorStop(0.45, tono); tg.addColorStop(1, "#2f5e34");
  g.fillStyle = tg; g.fillRect(x0, y0, w, h);
  enUnidades(g);
  g.fillStyle = "rgba(222,186,118,0.92)"; g.fill(C.desiertos);
  g.fillStyle = "rgba(112,92,68,0.5)"; g.fill(C.montes);
  g.fillStyle = "rgba(238,244,250,0.96)"; g.fill(C.hielo);
  recto(g);
  texturaPegada(g, C.suelo, M, 0.9, 1, caja);
  g.globalAlpha = 1;
  if (noche > 0) {
    const Lm = lucesDelMapa(), s = k / Lm.k;
    g.fillStyle = `rgba(0,4,16,${0.62 * noche})`; g.fillRect(x0, y0, w, h);
    g.globalCompositeOperation = "lighter"; g.globalAlpha = noche;
    g.drawImage(Lm.l, M.x0 - (Lm.l.width / 2) * s, M.y0 - (Lm.l.height / 2) * s, Lm.l.width * s, Lm.l.height * s);
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  }
  c.save(); enUnidades(c); c.clip(C.tierra); recto(c); c.drawImage(cara, 0, 0); c.restore();
  enUnidades(c); c.fillStyle = "#123d70"; c.fill(C.lagos); recto(c);
}

// El mar del mapa plano en c, dentro de la caja: un degradado, una luz suave arriba a la izquierda, su moteado y la
// rejilla; si forma, recortado a la forma del mundo y con su sombra debajo.
function pintaMar(c, M, op, caja, forma) {
  const C = caminosMapa(), k = M.k, [x0, y0, w, h] = [caja[0], caja[1], caja[2] - caja[0], caja[3] - caja[1]];
  c.save();
  if (forma) {
    c.fillStyle = "#000";
    for (let i = 4; i >= 1; i--) { c.globalAlpha = 0.14; c.setTransform(k, 0, 0, k, M.x0, M.y0 + (k / 190) * (6 * i + 6)); c.fill(C.borde); }
    c.globalAlpha = 1; c.setTransform(k, 0, 0, k, M.x0, M.y0); c.clip(C.borde); c.setTransform(1, 0, 0, 1, 0, 0);
  }
  const mg = c.createLinearGradient(0, M.y0 - 1.42 * k, 0, M.y0 + 1.42 * k);
  mg.addColorStop(0, "#0c2a52"); mg.addColorStop(0.5, "#123d70"); mg.addColorStop(1, "#0a2246");
  c.fillStyle = mg; c.fillRect(x0, y0, w, h);
  const fo = c.createRadialGradient(M.x0 - 0.8 * k, M.y0 - 0.9 * k, 0, M.x0, M.y0, 3 * k);
  fo.addColorStop(0, "rgba(90,170,255,0.22)"); fo.addColorStop(1, "rgba(90,170,255,0)");
  c.fillStyle = fo; c.fillRect(x0, y0, w, h);
  texturaPegada(c, C.grano, M, 1.1, 1, caja, false);
  c.globalAlpha = 1;
  if ((op.rejilla ?? 1) > 0) { c.setTransform(k, 0, 0, k, M.x0, M.y0); c.strokeStyle = `rgba(170,210,255,${0.13 * (op.rejilla ?? 1)})`; c.lineWidth = 1.6 / k; c.stroke(C.rejilla); }
  c.restore();
}

// El mundo entero pintado una vez a 2160 px de ancho (uno por estilo), con dos copias más pequeñas: mientras el mapa
// no sea mucho más grande que eso, cada fotograma solo lo pone en su sitio. forma: con su mar y su sombra; si no,
// solo la tierra (el mar se pinta aparte, llenando la pantalla).
const REF = 2160, hornos = new Map();
function mundoHecho(op, forma) {
  const clave = [forma, op.noche || 0, op.tono, op.relieve ?? 1, forma ? op.rejilla ?? 1 : ""].join("|");
  if (hornos.has(clave)) return hornos.get(clave);
  const l = lienzo(2240, 1240), M = { x0: 1120, y0: 600, k: REF / ANCHO_NE }, c = l.getContext("2d"), caja = [0, 0, 2240, 1240];
  if (forma) pintaMar(c, M, op, caja, true);
  pintaTierra(c, lienzo(2240, 1240), M, 0.006 * REF * (op.relieve ?? 1), op, caja);
  const niveles = [l];
  for (let i = 1; i <= 2; i++) {
    const a = niveles[i - 1], b = lienzo(a.width / 2, a.height / 2), cb = b.getContext("2d");
    cb.imageSmoothingEnabled = true; cb.imageSmoothingQuality = "high"; cb.drawImage(a, 0, 0, b.width, b.height);
    niveles.push(b);
  }
  hornos.set(clave, niveles);
  return niveles;
}

let pasoMapa = null;
// Un mapa plano del mundo, en relieve: el mar oscuro con su rejilla, y los continentes como losas levantadas con su
// canto, su sombra, su luz de arriba a la izquierda, sus desiertos, montañas y hielo. El punto centro ([lat, lon]) cae
// en (x, y) de la pantalla, y el mundo entero mide ancho px (para acercarse a un sitio, súbelo con el centro en él:
// las costas siguen nítidas).
//   relieve: lo alto de las losas (1 normal, 0 planas) · noche: 0 a 1, las luces de las ciudades · rejilla: los
//   meridianos (0 a 1) · mar: "forma" (solo dentro del mundo, lo normal) o "todo" (llena la pantalla) · tono: el
//   verde de la tierra ("#rrggbb") · al: transparencia (el mapa entero, de una pieza).
// Devuelve su vista M, para enMapa, chincheta y rutaEnMapa. El mundo entero tarda unos 5 ms (la primera vez, ~0,5 s);
// muy de cerca, 30-50 ms (y 2 si no cambia de un fotograma al siguiente).
export const mapaPlano = intacto(function mapaPlano(g, x, y, ancho, op = {}) {
  const k = ancho / ANCHO_NE, c0 = proyNE(...(op.centro || [0, 0])), M = { x0: x - c0[0] * k, y0: y + c0[1] * k, k };
  const al = op.al ?? 1, todo = op.mar === "todo";
  if (al <= 0.003) return M;
  g.save(); g.globalAlpha *= al;
  if (ancho <= REF * 1.05 && !todo) dibujaHecho(g, M, ancho, op, true);
  else {
    const clave = [x, y, ancho, op.centro, op.relieve, op.noche, op.rejilla, op.mar, op.tono].join("|");
    if (!pasoMapa) pasoMapa = { l: lienzo(1080, 1920), cara: null, clave: null };
    if (pasoMapa.clave !== clave) {
      const c = pasoMapa.l.getContext("2d"), caja = todo ? [0, 0, 1080, 1920] : [Math.max(0, Math.floor(M.x0 - 2.74 * k)), Math.max(0, Math.floor(M.y0 - 1.43 * k)), Math.min(1080, Math.ceil(M.x0 + 2.74 * k)), Math.min(1920, Math.ceil(M.y0 + 1.43 * k))];
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.clearRect(0, 0, 1080, 1920);
      if (caja[2] > caja[0] && caja[3] > caja[1]) {
        pintaMar(c, M, op, caja, !todo);
        if (ancho <= REF * 1.05) dibujaHecho(c, M, ancho, op, false);
        else { if (!pasoMapa.cara) pasoMapa.cara = lienzo(1080, 1920); pintaTierra(c, pasoMapa.cara, M, Math.min(30, 0.006 * ancho) * (op.relieve ?? 1), op, caja); }
      }
      pasoMapa.clave = clave;
    }
    g.drawImage(pasoMapa.l, 0, 0);
  }
  g.restore();
  return M;
});
// Pone el mundo ya pintado en su sitio, con la copia del tamaño más parecido.
function dibujaHecho(g, M, ancho, op, forma) {
  const niveles = mundoHecho(op, forma), s = ancho / REF, i = s <= 0.3 ? 2 : s <= 0.6 ? 1 : 0, l = niveles[i], e = s * (1 << i);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "medium";
  g.drawImage(l, M.x0 - (1120 / (1 << i)) * e, M.y0 - (600 / (1 << i)) * e, l.width * e, l.height * e);
}

// Una ruta en el mapa plano M, de a a b ([lat, lon]), que sube en arco y se dibuja hasta u (0 a 1), como en el globo.
// alto: lo que sube el arco (en partes de su largo) · color "r,g,b" · ancho (px). Devuelve dónde está la cabeza.
export const rutaEnMapa = intacto(function rutaEnMapa(g, M, a, b, u = 1, op = {}) {
  const col = op.color || "255,214,110", an = op.ancho ?? 7, P = enMapa(M, a[0], a[1]), Q = enMapa(M, b[0], b[1]);
  const dx = Q.x - P.x, dy = Q.y - P.y, d = Math.hypot(dx, dy) || 1, cx = (P.x + Q.x) / 2, cy = (P.y + Q.y) / 2 - (op.alto ?? 0.3) * d;
  const ue = Math.max(0, Math.min(1, u)), pt = (s) => ({ x: (1 - s) * (1 - s) * P.x + 2 * s * (1 - s) * cx + s * s * Q.x, y: (1 - s) * (1 - s) * P.y + 2 * s * (1 - s) * cy + s * s * Q.y });
  const lista = []; for (let i = 0; i <= 48; i++) lista.push(pt((i / 48) * ue));
  const traza = () => { g.beginPath(); g.moveTo(lista[0].x, lista[0].y); for (const p of lista) g.lineTo(p.x, p.y); g.stroke(); };
  g.save(); g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = "rgba(0,8,20,0.45)"; g.lineWidth = an; g.setLineDash([an * 1.6, an * 1.6]);
  g.beginPath(); g.moveTo(P.x, P.y); g.lineTo(P.x + dx * ue, P.y + dy * ue); g.stroke(); g.setLineDash([]);
  for (const [p, on] of [[P, true], [Q, ue >= 0.999]]) if (on) { brillo(g, p.x, p.y, an * 9, col, 0.9); g.fillStyle = `rgb(${col})`; g.beginPath(); g.arc(p.x, p.y, an * 0.9, 0, Math.PI * 2); g.fill(); }
  if (ue > 0) {
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = `rgba(${col},0.22)`; g.lineWidth = an * 3.2; traza();
    g.strokeStyle = `rgba(${col},0.95)`; g.lineWidth = an; traza();
    g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = an * 0.35; traza();
    g.globalCompositeOperation = "source-over";
  }
  const cab = lista[lista.length - 1];
  if (ue > 0 && ue < 0.999) { brillo(g, cab.x, cab.y, an * 14, col, 1); brillo(g, cab.x, cab.y, an * 5, "blanca", 0.9); }
  g.restore();
  return cab;
});
