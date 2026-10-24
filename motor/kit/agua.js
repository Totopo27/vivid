// El agua: un mar (o un lago, o una piscina) en perspectiva hasta el horizonte, con sus olas que corren y el camino de
// brillos del sol o de la luna; gotas que hacen de lente; una salpicadura con su corona; ondas en la superficie;
// burbujas que suben; un chorro que cae; y agua que sube dentro de un recipiente (o de toda la pantalla).
import { azar, lienzo, mez, mezRgb } from "./base.js";
import { F } from "./camara.js";
import { brillo } from "./luz.js";
import { causticas, ruido } from "./texturas.js";

// ---------------------------------------------------------------- las olas (una vez, al primer mar)
// Un mapa de olas de n × n que se repite sin costura: la pendiente de la superficie en x y en z (gx, gz), hecha con
// ondas de frecuencias enteras. abre: cuánto se abren las direcciones alrededor de +z (radianes). cae: lo que
// bajan las olas pequeñas. Viene con sus versiones reducidas en cada eje (para lo lejano, sin que parpadee).
function mapaDeOlas(n, semilla, nOndas, fmin, fmax, abre, cae) {
  const az = azar(semilla), gx = new Float32Array(n * n), gz = new Float32Array(n * n);
  const cos = new Float32Array(n), sin = new Float32Array(n);
  for (let i = 0; i < n; i++) { cos[i] = Math.cos((i / n) * Math.PI * 2); sin[i] = Math.sin((i / n) * Math.PI * 2); }
  for (let o = 0; o < nOndas; o++) {
    const f = fmin * Math.pow(fmax / fmin, az()), th = (az() + az() - 1) * abre, kx = Math.round(f * Math.sin(th)), kz = Math.round(f * Math.cos(th));
    if (!kx && !kz) continue;
    const a = Math.pow(Math.hypot(kx, kz), -cae), ph = az() * Math.PI * 2, cp = Math.cos(ph), sp = Math.sin(ph);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const i = (kx * x + kz * y) & (n - 1), c = cos[i] * cp - sin[i] * sp, q = y * n + x;
      gx[q] += a * kx * c; gz[q] += a * kz * c;
    }
  }
  let s = 0;
  for (let q = 0; q < n * n; q++) s += gx[q] * gx[q] + gz[q] * gz[q];
  s = 1 / Math.sqrt(s / (n * n));
  for (let q = 0; q < n * n; q++) { gx[q] *= s; gz[q] *= s; }
  // las reducciones: niv[lx][lz], la mitad de ancho en x por cada lx y en z por cada lz
  const L = Math.log2(n), niv = [];
  for (let lx = 0; lx <= L; lx++) {
    niv[lx] = [];
    for (let lz = 0; lz <= L; lz++) {
      if (!lx && !lz) { niv[0][0] = { w: n, h: n, gx, gz }; continue; }
      const p = lz ? niv[lx][lz - 1] : niv[lx - 1][0], w = lz ? p.w : p.w / 2, h = lz ? p.h / 2 : p.h;
      const ax = new Float32Array(w * h), az2 = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const a = lz ? 2 * y * p.w + x : y * p.w + 2 * x, b = lz ? a + p.w : a + 1;
        ax[y * w + x] = (p.gx[a] + p.gx[b]) / 2; az2[y * w + x] = (p.gz[a] + p.gz[b]) / 2;
      }
      niv[lx][lz] = { w, h, gx: ax, gz: az2 };
    }
  }
  // lo que se pierde de pendiente en cada nivel (para que lo lejano brille más ancho, como de verdad)
  for (const fila of niv) for (const m of fila) {
    let v = 0;
    for (let q = 0; q < m.w * m.h; q++) v += m.gx[q] * m.gx[q] + m.gz[q] * m.gz[q];
    m.pierde = Math.max(0, 1 - v / (m.w * m.h));
  }
  return { n, L, niv };
}
let OLAS = null;
const olas = () => OLAS || (OLAS = {
  a: mapaDeOlas(256, 7, 70, 1, 42, 0.75, 1.15),   // las olas: crestas de lado, que vienen hacia la cámara
  b: mapaDeOlas(128, 19, 60, 2, 40, 1.6, 0.9),    // las ondas pequeñas que van encima, de todas partes
  p: mapaDeOlas(64, 31, 14, 1, 5, 3.1, 1.6),      // las manchas de viento (zonas más lisas y más rizadas)
  s: mapaDeOlas(64, 43, 9, 1, 5, 0.45, 1),        // el mar de fondo: olas largas y suaves
});

// Los tonos del agua y de lo que refleja: cielo [horizonte, arriba], hondo (el color de dentro), luz "r,g,b".
export const AGUAS = {
  dia: { cielo: ["#d6e6f2", "#3f82c8"], hondo: "#041f33", dentro: "#0f5468", luz: "255,250,235", olas: 1 },
  atardecer: { cielo: ["#ffb877", "#3c3f78"], hondo: "#0b1c30", dentro: "#3a3550", luz: "255,196,120", olas: 1 },
  noche: { cielo: ["#1d2c4c", "#03060e"], hondo: "#01040b", dentro: "#071a2a", luz: "214,226,255", olas: 0.9 },
  lago: { cielo: ["#c9d8dc", "#5d8fb4"], hondo: "#0b2620", dentro: "#2d5a3c", luz: "255,248,225", olas: 0.35 },
  piscina: { cielo: ["#e6f2fa", "#6fb2e6"], hondo: "#0f7fa8", dentro: "#7ee8f2", luz: "255,255,245", olas: 0.35, alto: 1.7, suelo: "azulejos" },
};
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];


const EXP = Float32Array.from({ length: 9 * 64 + 2 }, (_, i) => Math.exp(-i / 64)); // e^-x, de 1/64 en 1/64

// El suelo de una piscina (una vez, a la primera): azulejos de 512 × 512 (8 × 8, con su junta) y la red de luz que
// se mueve encima (las cáusticas), en valores de 0 a 1.
let SUELO = null;
function suelo() {
  if (SUELO) return SUELO;
  const n = 512, az = azar(61), tono = Array.from({ length: 64 }, () => 0.9 + az() * 0.1), azu = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const tx = x & 63, ty = y & 63, junta = Math.min(tx, 63 - tx, ty, 63 - ty);
    azu[y * n + x] = (junta < 2 ? 0.55 + 0.12 * junta : tono[(y >> 6) * 8 + (x >> 6)]) * (0.97 + 0.03 * Math.sin(x * 0.7 + y * 1.3));
  }
  const c = ruido(256, 51, 7, 3, "crudo").crudo, cau = new Float32Array(256 * 256);
  for (let q = 0; q < 256 * 256; q++) cau[q] = Math.pow(Math.max(0, 1 - Math.abs(2 * c[q] - 1) * 5), 2.2);
  return (SUELO = { azu, cau });
}

// Un valor de un mapa de 256 × 256, suavizado entre sus cuatro vecinos (u, v positivos).
function bilineal(m, u, v) {
  const i = u | 0, j = v | 0, fu = u - i, fv = v - j, i0 = i & 255, i1 = (i + 1) & 255, j0 = (j & 255) << 8, j1 = ((j + 1) & 255) << 8;
  return (m[j0 + i0] * (1 - fu) + m[j0 + i1] * fu) * (1 - fv) + (m[j1 + i0] * (1 - fu) + m[j1 + i1] * fu) * fv;
}

// Pinta las filas [y0, y1) del mar (contadas desde el horizonte) en D, con sh × s píxeles de pantalla por píxel de D
// (de lejos, 2 × 1: lo que se ve rozando se estira de lado; de cerca, 2 × 2, donde las olas ya son grandes).
// funde: cuántas filas del final se van haciendo transparentes.
function pintaMar(D, y0, y1, sh, s, funde, M, salta = 0) {
  const { t, yh, alto, A, lut, ho, de, cieloImg, cieloAlto, L, capas, avanza, deriva, piso } = M, W = 1080 / sh, cx = 540, D32 = new Uint32Array(D.buffer);
  const azu = piso && piso.azu, cau = piso && piso.cau, prof = M.prof;
  let q = 0;
  for (let y = y0; y < y1; y++) {
    if (y * s < salta - s) { q += W; continue; } // (por encima de la pantalla: no se ve)
    const dy = (y + 0.5) * s, inv = alto / dy, Z = F * inv + avanza, dZ = (F * alto) / (dy * dy);
    // cada capa: qué reducción usa y dónde cae esta fila en ella
    const f = capas.map((c) => {
      const tx = c.tam / c.m.n, fx = (inv * sh) / tx, fz = (dZ * s) / tx;
      const lx = Math.min(c.m.L, Math.max(0, Math.floor(Math.log2(Math.max(1, fx * 1.1))))), lz = Math.min(c.m.L, Math.max(0, Math.floor(Math.log2(Math.max(1, fz * 4)))));
      const m = c.m.niv[lx][lz], sx = 1 / (tx * (1 << lx)), sz = 1 / (tx * (1 << lz));
      let v = (Z - c.vz * t) * sz; v = ((v % m.h) + m.h) % m.h;
      const j0 = Math.floor(v), u0 = ((0.5 * sh - cx) * inv + deriva - c.vx * t) * sx;
      return { m, du: inv * sh * sx, u0: ((u0 % m.w) + m.w) % m.w + m.w * 8, j0: j0 * m.w, j1: ((j0 + 1) % m.h) * m.w, fv: v - j0 };
    });
    const [a, b, p, u, o] = f;
    const agx = a.m.gx, agz = a.m.gz, bgx = b.m.gx, bgz = b.m.gz, pgx = p.m.gx, ugx = u.m.gx, ugz = u.m.gz, ogx = o.m.gx, ogz = o.m.gz;
    const am = a.m.w - 1, bm = b.m.w - 1, pm = p.m.w - 1, um = u.m.w - 1, om = o.m.w - 1;
    // lo lejano se ve rozando: se ven sobre todo las caras que miran a la cámara y el agua parece más lisa
    const cerca = Math.exp(-dy / 90), lejos = A * (1 - 0.72 * cerca), mira = 0.07 * cerca * (0.4 + A * 3), micro = u.m.w > 4 ? 0.3 : 0;
    // lo que se pierde a lo lejos se vuelve brillo más ancho y más flojo
    const rugo = A * A * (a.m.pierde + 0.3 * b.m.pierde) * 1.2, S = 1600 / (1 + 1600 * rugo), pico = L ? L.fuerza * 2.4 * Math.sqrt(S / 1600) : 0;
    const S2 = 70 / (1 + 70 * rugo), halo = L ? L.fuerza * 0.42 * Math.sqrt(S2 / 70) * (0.3 + 0.7 * Math.exp(-dy / 260)) : 0, umbral = 1 - 6 / S2, umbral1 = 1 - 8 / S;
    const d2 = dy * dy + F * F, al = y >= y1 - funde ? Math.round((255 * (y1 - y - 0.5)) / funde) : 255, alfa = al << 24;
    const fA = a.fv, gA = 1 - fA, fB = b.fv, gB = 1 - fB, fP = p.fv, gP = 1 - fP, fU = u.fv, gU = 1 - fU, fO = o.fv, gO = 1 - fO;
    const aj0 = a.j0, aj1 = a.j1, bj0 = b.j0, bj1 = b.j1, pj0 = p.j0, pj1 = p.j1, uj0 = u.j0, uj1 = u.j1, oj0 = o.j0, oj1 = o.j1;
    // el suelo de la piscina: se ve cerca y se pierde a lo lejos
    const ve = azu ? Math.exp(-(Z - avanza) / 9) : 0, vc = Math.exp(-(Z - avanza) / 5), vg = Math.exp(-(Z - avanza) / 5), sv = 128 / 0.5, zs = (Z + 40) * sv, zc0 = (Z * 0.9 + t * 0.21 + 40) * 170, zc1 = (Z * 0.9 - t * 0.17 + 40) * 150;
    let uA = a.u0, uB = b.u0, uP = p.u0, uU = u.u0, uO = o.u0;
    for (let x = 0; x < W; x++, uA += a.du, uB += b.du, uP += p.du, uU += u.du, uO += o.du, q++) {
      // la pendiente aquí: el mar de fondo + las olas (suavizadas) + las ondas, por la mancha de viento
      let ia = uA | 0; const fa = uA - ia, ga = 1 - fa; ia &= am; const ia1 = (ia + 1) & am;
      let nx = (agx[aj0 + ia] * ga + agx[aj0 + ia1] * fa) * gA + (agx[aj1 + ia] * ga + agx[aj1 + ia1] * fa) * fA;
      let nz = (agz[aj0 + ia] * ga + agz[aj0 + ia1] * fa) * gA + (agz[aj1 + ia] * ga + agz[aj1 + ia1] * fa) * fA;
      const nxA = nx, nzA = nz;
      let ib = uB | 0; const fb = uB - ib, gb = 1 - fb; ib &= bm; const ib1 = (ib + 1) & bm;
      nx += 0.5 * ((bgx[bj0 + ib] * gb + bgx[bj0 + ib1] * fb) * gB + (bgx[bj1 + ib] * gb + bgx[bj1 + ib1] * fb) * fB);
      nz += 0.5 * ((bgz[bj0 + ib] * gb + bgz[bj0 + ib1] * fb) * gB + (bgz[bj1 + ib] * gb + bgz[bj1 + ib1] * fb) * fB);
      if (micro) { const iu = (uU | 0) & um; nx += micro * (ugz[uj0 + iu] * gU + ugz[uj1 + iu] * fU); nz += micro * (ugx[uj0 + iu] * gU + ugx[uj1 + iu] * fU); }
      const io = (uO | 0) & om, ip = (uP | 0) & pm;
      const ox = ogx[oj0 + io] * gO + ogx[oj1 + io] * fO, oz = ogz[oj0 + io] * gO + ogz[oj1 + io] * fO;
      const w = pgx[pj0 + ip] * gP + pgx[pj1 + ip] * fP, k = -lejos * (0.5 + 0.7 * (w < 0 ? -w : w));
      const lx = (nxA + 0.5 * ox) * k, lz = (nzA + 0.5 * oz) * k; // solo las olas grandes: lo que tuerce lo de dentro
      nx = (nx + 0.5 * ox) * k; nz = (nz + 0.5 * oz) * k - mira;
      // el rayo de la cámara, la normal y el reflejo
      const px = (x + 0.5) * sh - cx, id = 1 / Math.sqrt(px * px + d2), dx = px * id, dyy = -dy * id, dz = F * id;
      const ey = 1 / Math.sqrt(nx * nx + nz * nz + 1), ex = nx * ey, ez = nz * ey;
      const dn = dx * ex + dyy * ey + dz * ez, rx = dx - 2 * dn * ex, ry = dyy - 2 * dn * ey, rz = dz - 2 * dn * ez;
      const m1 = dn < -1 ? 0 : 1 + dn, m2 = m1 * m1, fr = 0.02 + 0.98 * m2 * m2 * m1;
      // lo que refleja: el cielo dibujado o el de los colores (y, si el rayo baja, otra ola)
      let sr, sg, sb;
      if (ry <= 0) { const u = ry < -0.05 ? 1 : -ry * 20; sr = lut[0] + (ho[0] * 1.3 - lut[0]) * u; sg = lut[1] + (ho[1] * 1.3 - lut[1]) * u; sb = lut[2] + (ho[2] * 1.3 - lut[2]) * u; }
      else {
        let o = -1;
        if (cieloImg && rz > 0.05) { const X = (cx + (F * rx) / rz) | 0, Y = (yh - (F * ry) / rz) | 0; if (Y >= 0 && Y < cieloAlto && X >= 0 && X < 1080) o = (Y * 1080 + X) * 4; }
        if (o >= 0) { sr = cieloImg[o]; sg = cieloImg[o + 1]; sb = cieloImg[o + 2]; }
        else { const l = (ry > 1 ? 255 : (ry * 255) | 0) * 3; sr = lut[l]; sg = lut[l + 1]; sb = lut[l + 2]; }
      }
      // el color de dentro: más claro en la cara de la ola que mira a la cámara (la luz que la atraviesa)
      let cara = -nz * 3.2; cara = cara < 0 ? 0 : cara > 1 ? 1 : cara;
      let wr = ho[0] + (de[0] - ho[0]) * cara, wg = ho[1] + (de[1] - ho[1]) * cara, wb = ho[2] + (de[2] - ho[2]) * cara;
      if (ve > 0.01) {
        // el fondo de la piscina, torcido por las olas, con la red de luz que se mueve
        const X = px * inv + deriva + 40, bx = ((X + lx * prof) * sv) & 511, bz = ((zs + lz * prof * sv) | 0) & 511;
        const k0 = bilineal(cau, X * 170 + lx * 30 + 4096, zc0 + lz * 30), k1 = bilineal(cau, X * 150 + 4173 - lx * 30, zc1 - lz * 30);
        const luzF = 0.72 + vc * (0.5 * (k0 + k1) + 2.6 * k0 * k1), alb = (0.86 + (azu[bz * 512 + bx] - 0.86) * vg) * luzF * ve;
        wr = wr * (1 - ve) + de[0] * alb; wg = wg * (1 - ve) + de[1] * alb; wb = wb * (1 - ve) + de[2] * alb;
      }
      let r = wr + (sr - wr) * fr, gg = wg + (sg - wg) * fr, bb = wb + (sb - wb) * fr;
      // el brillo de la luz en las olas: el camino ancho y las chispas
      if (L) {
        const rl = rx * L.x + ry * L.y + rz * L.z;
        if (rl > umbral) {
          let e = halo * EXP[((1 - rl) * S2 * 64) | 0];
          if (rl > umbral1) e += pico * EXP[((1 - rl) * S * 64) | 0];
          r += e * L.r; gg += e * L.g; bb += e * L.b;
        }
      }
      D32[q] = alfa | ((bb > 255 ? 255 : bb) << 16) | ((gg > 255 ? 255 : gg) << 8) | (r > 255 ? 255 : r);
    }
  }
}

let marL = null, marCerca = null, imgLejos = null, imgCerca = null;
// El mar visto desde cerca de la superficie, del horizonte yh hacia abajo (toda la anchura). Cada punto refleja el
// cielo según la ola que tiene (más cuanto más lejos, como el agua de verdad), deja ver su color de dentro cerca de la
// cámara, y la luz hace su camino de brillos que tiembla. Las olas vienen hacia la cámara con t.
//   op.tono: "dia", "atardecer", "noche", "lago" o "piscina" (AGUAS), y encima lo que quieras cambiar:
//   op.cielo [horizonte, arriba] y op.hondo, op.dentro ("#rrggbb"); op.olas: lo rizada (0 un espejo, 1 el mar,
//   2 mar de fondo); op.luz: { x, y, color, fuerza } dónde está el sol o la luna en la pantalla (y por encima de yh;
//   null, sin luz); op.alto: a cuántos metros del agua está la cámara; op.avanza / op.deriva: metros que la cámara
//   ha ido hacia delante / a la derecha (para que el agua pase por debajo); op.refleja: un lienzo de 1080 de ancho
//   con el cielo dibujado (en las mismas coordenadas, hasta yh): el agua refleja ese cielo de verdad, con sus nubes
//   y su sol (dibújalo aparte, ponlo en g y pásalo; g no se lee nunca).
export function mar(g, t, op = {}) {
  const base = AGUAS[op.tono || "dia"], P = { ...base, ...op }, O = olas(), yh = Math.round(op.yh ?? 760), H = 1920 - yh;
  if (H <= 0) return;
  const alto = P.alto ?? 3;
  // el cielo que refleja, del horizonte hacia arriba: 256 colores
  const c0 = rgb(P.cielo[0]), c1 = rgb(P.cielo[1]), lut = new Float32Array(256 * 3);
  for (let i = 0; i < 256; i++) { const u = Math.pow(i / 255, 0.55); for (let c = 0; c < 3; c++) lut[i * 3 + c] = mez(c0[c], c1[c], u); }
  // la luz: su dirección desde la cámara y su color
  let L = null;
  if (op.luz !== null) {
    const l = { x: 540, y: yh - 90, fuerza: 1, color: base.luz, ...(op.luz || {}) }, lx = l.x - 540, ly = yh - l.y, d = Math.hypot(lx, ly, F), c = l.color.split(",").map(Number);
    L = { x: lx / d, y: ly / d, z: F / d, r: c[0], g: c[1], b: c[2], fuerza: l.fuerza };
  }
  const M = {
    t, yh, alto, A: 0.2 * (P.olas ?? 1), lut, ho: rgb(P.hondo), de: rgb(P.dentro), L, avanza: P.avanza || 0, deriva: P.deriva || 0,
    cieloImg: P.refleja && yh > 0 ? P.refleja.getContext("2d").getImageData(0, 0, 1080, Math.min(yh, P.refleja.height)).data : null, cieloAlto: P.refleja ? Math.min(yh, P.refleja.height) : 0,
    // las capas de olas: cada una con lo que mide su mapa (metros) y su velocidad (m/s)
    capas: [{ m: O.a, tam: 9, vx: 0, vz: -1.6 }, { m: O.b, tam: 1.3, vx: 0.35, vz: -0.55 }, { m: O.p, tam: 260, vx: 0.8, vz: -0.4 }, { m: O.b, tam: 0.37, vx: -0.2, vz: -0.3 }, { m: O.s, tam: 90, vx: 0.3, vz: -5 }],
    piso: P.suelo === "azulejos" ? suelo() : null, prof: P.prof ?? 1.2,
  };
  // de lejos, píxel a píxel; de cerca (donde las ondas pequeñas ya miden más de 2 píxeles), a media resolución
  const corte = Math.min(H, 560, Math.round((alto * 1.5) / (1.3 / 128))), funde = 16;
  marL = marL || lienzo(540, 560); marCerca = marCerca || lienzo(540, 960);
  if (!imgLejos || imgLejos.height !== corte) imgLejos = marL.getContext("2d").createImageData(540, Math.max(1, corte));
  pintaMar(imgLejos.data, 0, corte, 2, 1, corte < H ? funde : 0, M, Math.max(0, -yh));
  const cl = marL.getContext("2d");
  cl.putImageData(imgLejos, 0, 0); cl.clearRect(0, corte, 540, 4); // (lo de debajo, limpio: al suavizar se mira un poco más allá)
  g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "medium";
  if (corte < H) {
    const c0 = Math.floor((corte - funde) / 2), n = Math.ceil(H / 2) - c0;
    // (una fila de más, para que al ampliar con suavizado el borde de abajo no mire fuera)
    if (!imgCerca || imgCerca.height !== n + 1) imgCerca = marCerca.getContext("2d").createImageData(540, n + 1);
    pintaMar(imgCerca.data, c0, c0 + n + 1, 2, 2, 0, M);
    marCerca.getContext("2d").putImageData(imgCerca, 0, 0);
    marCerca.getContext("2d").clearRect(0, n + 1, 540, 4);
    g.drawImage(marCerca, 0, 0, 540, n, 0, yh + c0 * 2, 1080, n * 2);
  }
  g.drawImage(marL, 0, 0, 540, corte, 0, yh, 1080, corte);
  g.restore();
}

// ---------------------------------------------------------------- gotas
// El camino de una gota de radio r centrada en (0, 0): redonda, o con punta arriba (punta de 0 a 1, una gota que
// cuelga o que cae de un grifo).
function caminoGota(g, r, punta) {
  g.beginPath();
  if (punta <= 0.01) { g.arc(0, 0, r, 0, Math.PI * 2); return; }
  const top = r * (1 + 1.5 * punta);
  g.moveTo(0, -top); g.bezierCurveTo(r * 0.12, -top * 0.7, r, -r * 0.75, r, 0);
  g.arc(0, 0, r, 0, Math.PI); g.bezierCurveTo(-r, -r * 0.75, -r * 0.12, -top * 0.7, 0, -top); g.closePath();
}

// Una gota de agua de radio r en (x, y): hace de lente (lo que hay detrás se ve dentro, del revés y encogido), con
// el borde más oscuro, la luz que concentra al otro lado y su brillo fuerte del lado de la luz.
//   op.estira: lo larga que es por la velocidad (1 redonda); op.punta: de 0 a 1, con punta arriba; op.ang: su giro;
//   op.color: "r,g,b" de lo que es (agua, whisky...); op.luz: [lx, ly], hacia dónde está la luz en la pantalla;
//   op.detras: un lienzo con lo que hay detrás de la gota, en coordenadas de pantalla (el fondo dibujado aparte):
//   se ve dentro del revés; sin él, la gota enseña un mundo del revés de su color. (No se lee g: si un lienzo se
//   lee y luego se sigue dibujando, @napi-rs/canvas puede dar luego una copia equivocada de él.)
export function gota(g, x, y, r, op = {}) {
  if (r < 0.6) return;
  const { estira = 1, punta = 0, ang = 0, color = "175,215,240", luz = [-0.55, -0.85], detras = null } = op;
  const l = Math.hypot(luz[0], luz[1]) || 1, ca = Math.cos(-ang), sa = Math.sin(-ang);
  const lx = (luz[0] * ca - luz[1] * sa) / l, ly = (luz[0] * sa + luz[1] * ca) / l / estira; // la luz, en la gota
  g.save();
  g.translate(x, y); g.rotate(ang); g.scale(1, estira);
  caminoGota(g, r, punta);
  g.save(); g.clip();
  // lo de detrás, dado la vuelta: lo que hay en op.detras alrededor de la gota (el doble de ancho), o, si no, un
  // mundo del revés (la luz de arriba se ve abajo)
  const top = punta > 0.01 ? r * (1 + 1.5 * punta) : r, mc = (r - top) / 2, mh = ((top + r) / 2) * 1.08, m = Math.max(r, mh) * 1.08;
  if (detras) {
    const T = g.getTransform(), s = Math.hypot(T.a, T.b), R = Math.max(r, mh) * s * 2;
    g.save(); g.translate(0, mc); g.rotate(Math.PI); g.drawImage(detras, T.e + T.c * mc - R, T.f + T.d * mc - R, 2 * R, 2 * R, -m, -m, m * 2, m * 2); g.restore();
  } else {
    const vg = g.createLinearGradient(0, -top, 0, r);
    vg.addColorStop(0, `rgba(${mezRgb(color, "0,0,0", 0.8)},0.9)`); vg.addColorStop(0.45, `rgba(${mezRgb(color, "0,0,0", 0.55)},0.6)`); vg.addColorStop(1, `rgba(${mezRgb(color, "255,255,255", 0.2)},0.75)`);
    g.fillStyle = vg; g.fillRect(-r, -top, r * 2, top + r);
  }
  // su color, el borde que se oscurece y la luz que se concentra al otro lado
  g.fillStyle = `rgba(${color},0.22)`; g.fillRect(-r, -top, r * 2, top + r);
  const bg = g.createRadialGradient(-lx * r * 0.15, -ly * r * 0.15, r * 0.3, 0, 0, r * 1.02);
  bg.addColorStop(0, "rgba(0,8,16,0)"); bg.addColorStop(0.62, `rgba(${mezRgb(color, "0,0,0", 0.75)},0.12)`); bg.addColorStop(0.86, `rgba(${mezRgb(color, "0,0,0", 0.85)},0.5)`); bg.addColorStop(0.97, "rgba(0,0,0,0.85)"); bg.addColorStop(1, "rgba(0,0,0,0.6)");
  g.fillStyle = bg; g.fillRect(-r * 1.1, -top - r * 0.1, r * 2.2, top + r * 1.2);
  if (punta > 0.01) {
    // la punta: sus bordes también se oscurecen
    caminoGota(g, r, punta);
    for (const [w, a] of [[0.34, 0.12], [0.2, 0.18], [0.09, 0.3]]) { g.lineWidth = r * w; g.strokeStyle = `rgba(0,0,0,${a})`; g.stroke(); }
  }
  g.globalCompositeOperation = "lighter";
  const fx = -lx * r * 0.52, fy = -ly * r * 0.52, fg = g.createRadialGradient(fx, fy, 0, fx, fy, r * 0.55);
  fg.addColorStop(0, `rgba(${mezRgb(color, "255,255,255", 0.6)},0.75)`); fg.addColorStop(0.5, `rgba(${color},0.25)`); fg.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = fg; g.beginPath(); g.arc(fx, fy, r * 0.55, 0, Math.PI * 2); g.fill();
  // la media luna de luz al otro lado (un anillo corrido hacia la luz, que la gota recorta)
  const cg = g.createRadialGradient(lx * r * 0.3, ly * r * 0.3, 0, lx * r * 0.3, ly * r * 0.3, r * 1.3);
  cg.addColorStop(0.62, `rgba(${color},0)`); cg.addColorStop(0.83, `rgba(${mezRgb(color, "255,255,255", 0.55)},0.55)`); cg.addColorStop(0.95, `rgba(${color},0)`);
  g.fillStyle = cg; g.fillRect(-r * 1.2, -top - r * 0.2, r * 2.4, top + r * 1.4);
  g.restore();
  // el brillo: una ventana de luz fuerte y otra pequeña
  g.globalCompositeOperation = "source-over";
  const hx = lx * r * 0.45, hy = ly * r * 0.45, ha = Math.atan2(ly, lx) + Math.PI / 2;
  g.save(); g.translate(hx, hy); g.rotate(ha);
  const hg = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.26);
  hg.addColorStop(0, "rgba(255,255,255,0.98)"); hg.addColorStop(0.55, "rgba(255,255,255,0.85)"); hg.addColorStop(1, "rgba(255,255,255,0)");
  g.scale(1, 0.55); g.fillStyle = hg; g.beginPath(); g.arc(0, 0, r * 0.26, 0, Math.PI * 2); g.fill();
  g.restore();
  g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.arc(hx * 0.62 + ly * r * 0.2, hy * 0.62 - lx * r * 0.2, r * 0.035, 0, Math.PI * 2); g.fill();
  g.restore();
}

// Una gota pequeña y rápida (para las de una salpicadura): sin lente, con su volumen, su brillo y estirada por la
// velocidad (vx, vy en px/s). al: transparencia.
function gotita(g, x, y, r, vx, vy, color, al) {
  if (r < 0.5 || al <= 0.01) return;
  const v = Math.hypot(vx, vy), e = Math.min(3, 1 + v / 1400);
  g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(Math.atan2(vy, vx) - Math.PI / 2); g.scale(1, e);
  const dg = g.createRadialGradient(r * 0.25, r * 0.3, r * 0.05, 0, 0, r);
  dg.addColorStop(0, `rgba(${mezRgb(color, "255,255,255", 0.5)},0.7)`); dg.addColorStop(0.45, `rgba(${color},0.45)`); dg.addColorStop(0.82, `rgba(${mezRgb(color, "0,0,0", 0.45)},0.6)`); dg.addColorStop(1, `rgba(${mezRgb(color, "255,255,255", 0.3)},0.7)`);
  g.fillStyle = dg; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(255,255,255,0.95)"; g.beginPath(); g.ellipse(-r * 0.35, -r * 0.35, r * 0.26, r * 0.18, -0.7, 0, Math.PI * 2); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- ondas y salpicaduras
// Ondas que se abren en una superficie de agua desde (x, y), u segundos después de que caiga algo: anillos con su
// lado de luz y su lado de sombra que se alejan y se apagan.
//   op.tam: hasta dónde llegan (px); op.n: cuántos anillos; op.inclina: lo aplastadas que se ven (1 desde arriba,
//   0,3 desde un lado); op.color: "r,g,b" de la luz que reflejan; op.dura: segundos que duran.
export function ondas(g, x, y, u, op = {}) {
  const { tam = 420, n = 4, inclina = 0.3, color = "225,242,255", dura = 2 } = op;
  if (u <= 0 || u > dura) return;
  g.save();
  for (let i = 0; i < n; i++) {
    const ui = u - i * 0.14;
    if (ui <= 0) continue;
    const r = tam * (1 - Math.exp(-ui * 1.5)) * (1 - i * 0.12), apaga = (1 - u / dura) * (1 - r / (tam * 1.05)) * (1 - i * 0.18);
    if (r < 2 || apaga <= 0.01) continue;
    const lw = 2 + r * 0.025;
    g.globalCompositeOperation = "source-over"; g.strokeStyle = `rgba(0,10,25,${0.3 * apaga})`; g.lineWidth = lw * 1.3;
    g.beginPath(); g.ellipse(x, y + lw * 0.6, r, r * inclina, 0, 0, Math.PI * 2); g.stroke();
    g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(${color},${0.6 * apaga})`; g.lineWidth = lw;
    g.beginPath(); g.ellipse(x, y - lw * 0.4, r, r * inclina, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.strokeStyle = `rgba(${color},${0.3 * apaga})`;
    g.beginPath(); g.ellipse(x, y - lw * 0.4, r, r * inclina, 0, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
  }
  g.restore();
}

const coronas = new Map();
// Lo que tiene una corona (siempre igual para la misma semilla): sus puntas, sus gotas y su chorro del centro.
function corona(semilla) {
  if (coronas.has(semilla)) return coronas.get(semilla);
  const az = azar(semilla), n = 22, puntas = [], gotas = [];
  for (let i = 0; i < n; i++) puntas.push({ a: ((i + (az() - 0.5) * 0.5) / n) * Math.PI * 2, h: 0.25 + az() * 0.45, w: 0.045 + az() * 0.03 });
  for (const p of puntas) gotas.push({ a: p.a, r: 0.026 + az() * 0.026, suelta: 0.09 + az() * 0.14, sale: 0.5 + az() * 0.5, sube: 0.5 + az() * 0.6, h: p.h });
  for (let i = 0; i < 26; i++) gotas.push({ a: az() * Math.PI * 2, r: 0.01 + az() * 0.016, suelta: 0.02 + az() * 0.05, sale: 0.9 + az() * 1.1, sube: 0.6 + az() * 1.0, h: 0.1 });
  const c = { puntas, gotas };
  coronas.set(semilla, c);
  return c;
}

// Una salpicadura en (x, y) (donde cae algo en un líquido), u segundos después: el golpe de luz, la corona que se
// levanta con sus puntas y sus gotas que salen volando y caen, las ondas, y el chorro que sube del centro al final.
//   op.tam: el radio de la corona (px); op.color: "r,g,b" del líquido; op.inclina: lo aplastada que se ve (0,3, de
//   lado y un poco desde arriba); op.semilla: otra forma; op.ondas: false para no dibujarlas.
export function salpicadura(g, x, y, u, op = {}) {
  const { tam = 300, color = "190,225,250", inclina = 0.3, semilla = 3 } = op;
  if (u < 0 || u > 2.2) return;
  const C = corona(semilla), caida = 2400 * (tam / 300);
  g.save();
  if (op.ondas !== false && u > 0.18) ondas(g, x, y, u - 0.18, { tam: tam * 2.6, inclina, color: mezRgb(color, "255,255,255", 0.5) });
  brillo(g, x, y - tam * 0.1, tam * 3, color, 0.55 * Math.exp(-u * 9));
  // la corona: radio, alto y cómo se abre arriba
  const R = tam * (0.3 + 0.7 * (1 - Math.exp(-u * 9))), f = (u / 0.13) * Math.exp(1 - u / 0.13), Hc = tam * 0.5 * f, Rt = R * (1 + 0.3 * f);
  const puntas = Math.min(1, u / 0.07);
  const borde = (a) => { let h = 1; for (const p of C.puntas) { let d = Math.abs(a - p.a) % (Math.PI * 2); d = Math.min(d, Math.PI * 2 - d); h += puntas * p.h * Math.exp(-((d / p.w) ** 2)); } return Hc * h; };
  const pared = (a0, a1, delante) => {
    if (Hc < 2) return;
    const K = 150;
    g.beginPath();
    for (let i = 0; i <= K; i++) { const a = a0 + ((a1 - a0) * i) / K; g.lineTo(x + R * Math.cos(a), y + R * inclina * Math.sin(a)); }
    for (let i = K; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / K; g.lineTo(x + Rt * Math.cos(a), y + Rt * inclina * Math.sin(a) - borde(a)); }
    g.closePath();
    // la lámina de líquido: transparente en el centro y clara en los lados (se ve de canto), más densa abajo
    const hg = g.createLinearGradient(x - Rt, 0, x + Rt, 0), fuerza = delante ? 1 : 0.7;
    hg.addColorStop(0, `rgba(${mezRgb(color, "255,255,255", 0.6)},${0.8 * fuerza})`); hg.addColorStop(0.1, `rgba(${color},${0.34 * fuerza})`);
    hg.addColorStop(0.24, `rgba(${color},${0.16 * fuerza})`); hg.addColorStop(0.3, `rgba(255,255,255,${0.42 * fuerza})`); hg.addColorStop(0.36, `rgba(${color},${0.14 * fuerza})`);
    hg.addColorStop(0.7, `rgba(${color},${0.1 * fuerza})`); hg.addColorStop(0.76, `rgba(255,255,255,${0.2 * fuerza})`); hg.addColorStop(0.8, `rgba(${color},${0.12 * fuerza})`);
    hg.addColorStop(0.9, `rgba(${color},${0.34 * fuerza})`); hg.addColorStop(1, `rgba(${mezRgb(color, "255,255,255", 0.6)},${0.8 * fuerza})`);
    g.fillStyle = hg; g.fill();
    const vg = g.createLinearGradient(0, y - Hc * 1.5, 0, y + R * inclina);
    vg.addColorStop(0, `rgba(${mezRgb(color, "255,255,255", 0.5)},0.22)`); vg.addColorStop(0.55, `rgba(${color},0)`); vg.addColorStop(1, `rgba(${color},0.22)`);
    g.fillStyle = vg; g.fill();
    // el filo de arriba, que brilla, y las vetas de la lámina
    g.save(); g.globalCompositeOperation = "lighter"; g.lineJoin = "round";
    g.strokeStyle = `rgba(255,255,255,${0.6 * fuerza})`; g.lineWidth = Math.max(1.5, tam * 0.011);
    g.beginPath();
    for (let i = 0; i <= K; i++) { const a = a0 + ((a1 - a0) * i) / K; g.lineTo(x + Rt * Math.cos(a), y + Rt * inclina * Math.sin(a) - borde(a)); }
    g.stroke();
    // las vetas: bajan de cada punta (por donde corre el líquido hacia ella)
    for (const p of C.puntas) {
      const a = p.a + (delante ? 0 : Math.PI) * 0, sn = Math.sin(a);
      if ((sn > 0) !== delante || Math.abs(Math.cos(a)) > 0.93) continue;
      const ab = Math.cos(a) * R, at = Math.cos(a) * Rt, gv = g.createLinearGradient(0, y + R * inclina * sn, 0, y + Rt * inclina * sn - borde(a));
      gv.addColorStop(0, "rgba(255,255,255,0)"); gv.addColorStop(1, `rgba(255,255,255,${0.22 * fuerza})`);
      g.strokeStyle = gv; g.lineWidth = Math.max(1, tam * p.w * 0.4);
      g.beginPath(); g.moveTo(x + ab, y + R * inclina * sn); g.lineTo(x + at, y + Rt * inclina * sn - borde(a) * 0.92); g.stroke();
    }
    g.restore();
  };
  // el hoyo del centro, la pared de detrás, el chorro, la pared de delante y las gotas
  if (Hc > 2) {
    g.save(); g.translate(x, y); g.scale(1, inclina);
    const hg = g.createRadialGradient(0, 0, 0, 0, 0, R);
    hg.addColorStop(0, `rgba(${mezRgb(color, "0,0,0", 0.75)},${0.4 * Math.min(1, f * 2)})`); hg.addColorStop(0.8, `rgba(${mezRgb(color, "0,0,0", 0.75)},${0.25 * Math.min(1, f * 2)})`); hg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = hg; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill(); g.restore();
  }
  pared(Math.PI, Math.PI * 2, false);
  const uj = u - 0.24;
  if (uj > 0 && uj < 0.62) {
    const hj = tam * 1.15 * Math.sin((Math.PI * uj) / 0.62), wj = tam * 0.07 * (1 - uj);
    if (hj > 2) {
      const jg = g.createLinearGradient(x - wj, 0, x + wj, 0);
      jg.addColorStop(0, `rgba(${mezRgb(color, "255,255,255", 0.5)},0.8)`); jg.addColorStop(0.5, `rgba(${color},0.45)`); jg.addColorStop(1, `rgba(${mezRgb(color, "0,0,0", 0.3)},0.8)`);
      g.fillStyle = jg; g.beginPath(); g.moveTo(x - wj * 1.6, y); g.quadraticCurveTo(x - wj * 0.7, y - hj * 0.5, x - wj * 0.5, y - hj); g.arc(x, y - hj, wj * 0.5, Math.PI, 0); g.quadraticCurveTo(x + wj * 0.7, y - hj * 0.5, x + wj * 1.6, y); g.closePath(); g.fill();
      gotita(g, x, y - hj - wj * 1.4, wj * 1.1, 0, -400, color, 1);
    }
  }
  pared(0, Math.PI, true);
  // el cuello de líquido que se levanta alrededor, al pie de la corona
  if (Hc > 2) {
    g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = `rgba(${mezRgb(color, "255,255,255", 0.5)},${0.35 * Math.min(1, f * 1.5)})`;
    for (const [w, a] of [[0.07, 0.25], [0.035, 0.45]]) {
      g.lineWidth = Math.max(2, tam * w); g.globalAlpha = a; g.beginPath(); g.ellipse(x, y, R * 1.03, R * inclina * 1.03, 0, Math.PI * 0.08, Math.PI * 0.92); g.stroke();
    }
    g.restore();
  }
  for (const d of C.gotas) {
    const us = u - d.suelta;
    let gx, gy, vx = 0, vy = 0;
    if (us < 0) {
      if (Hc < 3 || d.h < 0.15) continue;
      gx = x + Rt * Math.cos(d.a); gy = y + Rt * inclina * Math.sin(d.a) - borde(d.a) - d.r * tam;
    } else {
      const v0 = tam * 2.2 * d.sale, w0 = tam * 3.2 * d.sube, r0 = tam * (0.3 + 0.7 * (1 - Math.exp(-d.suelta * 9))) * 1.3;
      vx = Math.cos(d.a) * v0; vy = -w0 + caida * us;
      gx = x + Math.cos(d.a) * (r0 + v0 * us); gy = y + inclina * Math.sin(d.a) * (r0 + v0 * us * 0.6) - tam * 0.5 * (1 + d.h) - w0 * us + 0.5 * caida * us * us;
      if (gy > y + tam * 0.5 && us > 0.3) continue;
    }
    gotita(g, gx, gy, d.r * tam, vx, vy, color, Math.min(1, 2.4 - u));
  }
  g.restore();
}

// ---------------------------------------------------------------- burbujas
// Una burbuja de 128 × 128 (una vez): casi transparente, con su borde de luz, el anillo oscuro de dentro, el brillo
// de arriba y la luz que junta abajo.
let laBurbuja = null;
function burbuja() {
  if (laBurbuja) return laBurbuja;
  const l = lienzo(128), c = l.getContext("2d"), gr = c.createRadialGradient(64, 64, 0, 64, 64, 62);
  gr.addColorStop(0, "rgba(255,255,255,0.06)"); gr.addColorStop(0.6, "rgba(255,255,255,0.03)"); gr.addColorStop(0.8, "rgba(10,30,50,0.22)");
  gr.addColorStop(0.91, "rgba(225,242,255,0.8)"); gr.addColorStop(0.97, "rgba(225,242,255,0.45)"); gr.addColorStop(1, "rgba(225,242,255,0)");
  c.fillStyle = gr; c.beginPath(); c.arc(64, 64, 62, 0, Math.PI * 2); c.fill();
  c.globalCompositeOperation = "lighter";
  const ab = c.createRadialGradient(76, 96, 0, 76, 96, 30); ab.addColorStop(0, "rgba(220,240,255,0.4)"); ab.addColorStop(1, "rgba(220,240,255,0)");
  c.fillStyle = ab; c.fillRect(0, 0, 128, 128);
  c.globalCompositeOperation = "source-over";
  c.save(); c.translate(44, 38); c.rotate(-0.7); c.scale(1, 0.6);
  const br = c.createRadialGradient(0, 0, 0, 0, 0, 17); br.addColorStop(0, "rgba(255,255,255,1)"); br.addColorStop(0.6, "rgba(255,255,255,0.8)"); br.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = br; c.beginPath(); c.arc(0, 0, 17, 0, Math.PI * 2); c.fill(); c.restore();
  return (laBurbuja = l);
}
const listas = new Map();
// Burbujas que suben dentro del rectángulo (x, y, w, h) con el tiempo t: nacen abajo, suben cada vez más deprisa
// bamboleándose, crecen un poco y se apagan arriba. Dibuja antes el líquido; si el recipiente no es un rectángulo,
// recórtalo (clip) antes de llamarla.
//   op.n: cuántas; op.tam: el radio de las más grandes (px); op.vel: lo que suben por segundo (px);
//   op.semilla: otras burbujas; op.al: transparencia.
export function burbujas(g, x, y, w, h, t, op = {}) {
  const { n = 40, tam = 22, vel = 260, semilla = 9, al = 1 } = op;
  const k = `${semilla}-${n}`;
  if (!listas.has(k)) { const az = azar(semilla); listas.set(k, Array.from({ length: n }, () => ({ x: az(), f: az(), r: 0.25 + Math.pow(az(), 2.2) * 0.75, v: 0.7 + az() * 0.6, b: az() * 6.28, s: 2 + az() * 3 }))); }
  const B = burbuja(), A = g.globalAlpha;
  g.save();
  for (const b of listas.get(k)) {
    const sube = vel * b.v * (0.6 + 0.6 * b.r), u = (((t * sube) / h + b.f) % 1 + 1) % 1, r = tam * b.r * (0.75 + 0.35 * u);
    const by = y + h - u * (h + 2 * r) + r, bx = x + b.x * w + Math.sin(t * b.s + b.b) * r * 0.8 * (0.4 + u);
    const vis = Math.min(1, u * 8, (1 - u) * 6);
    if (vis <= 0.01) continue;
    // las grandes se aplastan y tiemblan al subir
    const ap = b.r > 0.6 ? 1 + 0.12 * Math.sin(t * 9 + b.b) : 1;
    g.globalAlpha = A * al * vis;
    g.drawImage(B, bx - r * ap, by - r / ap, r * 2 * ap, (r * 2) / ap);
  }
  g.restore();
}

// ---------------------------------------------------------------- un chorro que cae
// Un chorro de líquido que sale de (x0, y0) y cae en (x1, y1): sale de lado y se curva al caer (como de una botella
// o de un grifo, si x1 = x0), se adelgaza al ganar velocidad, corre por dentro con sus vetas de luz y salpica abajo.
//   op.ancho: el grosor al salir (px); op.color: "r,g,b"; op.llega: de 0 a 1, hasta dónde ha bajado la punta (para
//   cuando empieza a caer); op.corta: de 0 a 1, cuánto ha bajado el final (para cuando se cierra); op.salpica:
//   false para que no salpique abajo.
export function chorro(g, x0, y0, x1, y1, t, op = {}) {
  const { ancho = 46, color = "170,215,245", llega = 1, corta = 0 } = op;
  if (llega <= corta + 0.002) return;
  const N = 40, s0 = corta, s1 = llega, P = [];
  // el camino: una parábola (sale con velocidad de lado y cae); s de 0 a 1 por el tiempo de caída
  for (let i = 0; i <= N; i++) {
    const s = s0 + ((s1 - s0) * i) / N, onda = Math.sin(s * 14 - t * 22) * ancho * 0.04 * s;
    const px = x0 + (x1 - x0) * s, py = y0 + (y1 - y0) * s * s, dx = x1 - x0, dy = 2 * (y1 - y0) * s, l = Math.hypot(dx, dy) || 1;
    const w = (ancho / 2) * (1 / Math.sqrt(1 + 3 * s)) * (1 + (0.04 + 0.08 * s) * Math.sin(s * 31 - t * 40) + 0.03 * Math.sin(s * 57 - t * 61));
    P.push({ x: px + (-dy / l) * onda, y: py + (dx / l) * onda, nx: -dy / l, ny: dx / l, w, s });
  }
  g.save();
  // una franja a lo largo del chorro, de a0 a a1 de su anchura (de -1 a 1): sigue su grosor
  const franja = (a0, a1) => {
    g.beginPath();
    P.forEach((p, i) => (i ? g.lineTo(p.x + p.nx * p.w * a0, p.y + p.ny * p.w * a0) : g.moveTo(p.x + p.nx * p.w * a0, p.y + p.ny * p.w * a0)));
    for (let i = N; i >= 0; i--) { const p = P[i]; g.lineTo(p.x + p.nx * p.w * a1, p.y + p.ny * p.w * a1); }
    g.closePath();
  };
  const a = P[0], b = P[N];
  // el cuerpo: casi transparente, de su color
  franja(-1, 1); g.fillStyle = `rgba(${color},0.3)`; g.fill();
  // la punta que cae y el final que se va: redondos, un poco más gordos (el líquido se junta en una gota)
  if (llega < 0.999) { g.beginPath(); g.arc(b.x, b.y, b.w * 1.25, 0, Math.PI * 2); g.fill(); }
  if (corta > 0.001) { g.beginPath(); g.arc(a.x, a.y, a.w * 1.1, 0, Math.PI * 2); g.fill(); }
  // la luz que lo atraviesa: el centro encendido, los dos filos claros y la franja de brillo del lado de la luz
  g.globalCompositeOperation = "lighter";
  franja(-0.5, 0.5); g.fillStyle = `rgba(${color},0.32)`; g.fill();
  franja(-0.2, 0.2); g.fillStyle = `rgba(${mezRgb(color, "255,255,255", 0.4)},0.22)`; g.fill();
  franja(0.8, 0.97); g.fillStyle = `rgba(${mezRgb(color, "255,255,255", 0.5)},0.4)`; g.fill();
  franja(-0.97, -0.84); g.fillStyle = `rgba(${mezRgb(color, "255,255,255", 0.5)},0.3)`; g.fill();
  franja(-0.66, -0.4); g.fillStyle = "rgba(255,255,255,0.5)"; g.fill();
  // las vetas que corren hacia abajo
  const linea = (lado, lw, estilo, raya) => {
    g.strokeStyle = estilo; g.lineWidth = lw; g.setLineDash(raya); g.lineDashOffset = -t * 900;
    g.beginPath(); P.forEach((p, i) => { const X = p.x + p.nx * p.w * lado, Y = p.y + p.ny * p.w * lado; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke();
  };
  g.lineCap = "round";
  linea(-0.15, ancho * 0.05, "rgba(255,255,255,0.3)", [ancho * 1.6, ancho * 2.4]);
  linea(0.35, ancho * 0.035, "rgba(255,255,255,0.25)", [ancho * 0.9, ancho * 3.1]);
  linea(0.6, ancho * 0.03, `rgba(${color},0.4)`, [ancho * 2.2, ancho * 1.7]);
  g.setLineDash([]);
  g.restore();
  if (llega < 0.999) gotita(g, b.x, b.y, b.w * 1.2, 0, 900, color, 0.8);
  // abajo: la espuma, las gotas que saltan y el brillo
  if (op.salpica !== false && llega >= 0.999) {
    const az = azar(Math.floor(t * 30) + 7), wb = b.w * 2;
    brillo(g, x1, y1, wb * 5, color, 0.5);
    g.save(); g.globalCompositeOperation = "lighter";
    for (let i = 0; i < 9; i++) { const r = wb * (0.25 + az() * 0.35); g.fillStyle = `rgba(${mezRgb(color, "255,255,255", 0.6)},${0.25 + az() * 0.25})`; g.beginPath(); g.ellipse(x1 + (az() - 0.5) * wb * 2.2, y1 - az() * wb * 0.3, r, r * 0.5, 0, 0, Math.PI * 2); g.fill(); }
    g.restore();
    for (let i = 0; i < 12; i++) {
      const an = -Math.PI / 2 + (az() - 0.5) * 2.4, d = (0.3 + az()) * wb * 2.6, r = wb * (0.06 + az() * 0.12);
      gotita(g, x1 + Math.cos(an) * d, y1 + Math.sin(an) * d * 0.7, r, Math.cos(an) * 600, Math.sin(an) * 600, color, 0.9);
    }
  }
}

// ---------------------------------------------------------------- agua que sube
// Agua dentro de un recipiente (o de toda la pantalla, para «se inunda») hasta la altura nivel (0 vacío, 1 lleno).
// El recipiente es el rectángulo de dentro (x, y, w, h); el agua tiene su color más hondo abajo, la red de luz que se
// mueve, los rayos que bajan, burbujas, y arriba su superficie que se mueve con t: vista un poco desde arriba si
// op.ry > 0 (lo que se ve de la superficie, en px) o de lado, con el espejo de plata por debajo, si op.ry = 0.
//   op.color: "r,g,b" del agua; op.forma: (g) => traza el camino del recipiente (si no es un rectángulo); op.agita:
//   lo que se mueve la superficie (0 quieta, 1 revuelta); op.burbujas: cuántas; op.luz: de 0 a 1, cuánta luz entra.
export function nivelDeAgua(g, x, y, w, h, nivel, t, op = {}) {
  const { ry = 0, color = "30,130,190", agita = 0.4, luz = 1, semilla = 4 } = op, nb = op.burbujas ?? 0;
  if (nivel <= 0.001) return;
  const yS = y + h * (1 - nivel), A = g.globalAlpha, amp = (6 + w * 0.012) * agita;
  const ola = (xx, k) => amp * (Math.sin(xx * 0.011 - t * 3.1 + k) * 0.6 + Math.sin(xx * 0.027 + t * 2.3 + k * 2) * 0.3 + Math.sin(xx * 0.05 - t * 4.7) * 0.15);
  const borde = (k, dy) => { const pts = []; for (let xx = x - 10; xx <= x + w + 10; xx += 10) pts.push([xx, yS + dy + ola(xx, k)]); return pts; };
  const delante = borde(0, ry), detras = borde(1.7, -ry);
  g.save();
  if (op.forma) { op.forma(g); g.clip(); } else { g.beginPath(); g.rect(x, y - ry, w, h + ry); g.clip(); }
  // el agua: más clara arriba, honda abajo, más oscura en los lados
  g.beginPath(); delante.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.lineTo(x + w + 10, y + h + ry + 10); g.lineTo(x - 10, y + h + ry + 10); g.closePath();
  g.save(); g.clip();
  const cuerpo = g.createLinearGradient(0, yS, 0, Math.max(yS + 60, y + h));
  cuerpo.addColorStop(0, `rgba(${mezRgb(color, "255,255,255", 0.25)},0.62)`); cuerpo.addColorStop(0.35, `rgba(${color},0.74)`); cuerpo.addColorStop(1, `rgba(${mezRgb(color, "0,0,0", 0.6)},0.93)`);
  g.fillStyle = cuerpo; g.fillRect(x - 10, yS - amp - 10, w + 20, y + h - yS + ry + amp + 30);
  const lados = g.createLinearGradient(x, 0, x + w, 0);
  lados.addColorStop(0, "rgba(0,0,0,0.28)"); lados.addColorStop(0.3, "rgba(0,0,0,0)"); lados.addColorStop(0.7, "rgba(0,0,0,0)"); lados.addColorStop(1, "rgba(0,0,0,0.32)");
  g.fillStyle = lados; g.fillRect(x - 10, yS - amp - 10, w + 20, y + h - yS + ry + amp + 30);
  // la luz de dentro: la red de luz (más fuerte cerca de arriba) y los rayos que bajan
  g.globalCompositeOperation = "lighter";
  const prof = Math.max(80, y + h - yS), cl = g.createLinearGradient(0, yS, 0, yS + prof);
  // (la red, en baldosas de tamaño fijo, en espejo para que no se vea la costura: igual de fina en un vaso que en
  // una habitación)
  g.globalAlpha = A * 0.24 * luz;
  for (let i = 0; i < 2; i++) {
    const T = 620 + 140 * i, ox = Math.sin(t * 0.5 + i * 2) * 60 + i * 230, oy = Math.cos(t * 0.4 + i) * 30 - t * 12 * (i ? -1 : 1);
    const fx = Math.floor(ox / T), fy = Math.floor(oy / T), x0 = x + ox - (fx + 1) * T, y0 = yS - amp + oy - (fy + 1) * T;
    for (let a = 0, bx = x0; bx < x + w; a++, bx += T) for (let b = 0, by = y0; by < y + h + ry; b++, by += T) {
      if (by + T <= yS - amp) continue;
      const mx = (a + fx) & 1, my = (b + fy) & 1;
      g.save(); g.translate(bx + (mx ? T : 0), by + (my ? T : 0)); g.scale(mx ? -1 : 1, my ? -1 : 1); g.drawImage(causticas, -0.5, -0.5, T + 1, T + 1); g.restore();
    }
  }
  g.globalAlpha = A;
  for (let i = 0; i < 6; i++) {
    const x0 = x + ((i + 0.5) / 6) * w + Math.sin(t * 0.7 + i * 1.9) * w * 0.05, ab = w * (0.03 + 0.03 * ((i * 7) % 3)), L = prof * 0.9;
    const rg = g.createLinearGradient(0, yS, 0, yS + L); rg.addColorStop(0, `rgba(210,240,255,${0.16 * luz})`); rg.addColorStop(1, "rgba(210,240,255,0)");
    g.fillStyle = rg; g.beginPath(); g.moveTo(x0 - ab, yS); g.lineTo(x0 + ab, yS); g.lineTo(x0 + ab * 2.5 + L * 0.25, yS + L); g.lineTo(x0 + L * 0.25, yS + L); g.closePath(); g.fill();
  }
  // lo de arriba del agua: más claro (y oscurece al bajar)
  cl.addColorStop(0, `rgba(${mezRgb(color, "255,255,255", 0.5)},0.25)`); cl.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = cl; g.fillRect(x - 10, yS - amp - 10, w + 20, prof + amp + 10);
  g.globalCompositeOperation = "source-over";
  if (nb > 0) burbujas(g, x, yS, w, y + h - yS, t, { n: nb, tam: Math.max(6, w * 0.022), semilla, al: 0.9 });
  // si se ve de lado: el espejo de plata de la superficie vista desde abajo
  if (ry < 2) {
    g.beginPath(); delante.forEach(([px, py], i) => (i ? g.lineTo(px, py + 2) : g.moveTo(px, py + 2))); for (let i = delante.length - 1; i >= 0; i--) g.lineTo(delante[i][0], delante[i][1] + 26 + ola(delante[i][0], 3) * 0.5); g.closePath();
    const eg = g.createLinearGradient(0, yS, 0, yS + 30); eg.addColorStop(0, `rgba(${mezRgb(color, "255,255,255", 0.75)},0.75)`); eg.addColorStop(1, `rgba(${mezRgb(color, "255,255,255", 0.4)},0)`);
    g.fillStyle = eg; g.fill();
  }
  g.restore();
  // la superficie vista desde arriba: refleja el cielo (más claro al fondo) y brilla en las crestas
  if (ry >= 2) {
    g.beginPath(); detras.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); for (let i = delante.length - 1; i >= 0; i--) g.lineTo(delante[i][0], delante[i][1]); g.closePath();
    const sg = g.createLinearGradient(0, yS - ry, 0, yS + ry);
    sg.addColorStop(0, `rgba(${mezRgb(color, "255,255,255", 0.7)},0.92)`); sg.addColorStop(0.5, `rgba(${mezRgb(color, "255,255,255", 0.35)},0.85)`); sg.addColorStop(1, `rgba(${mezRgb(color, "255,255,255", 0.15)},0.88)`);
    g.fillStyle = sg; g.fill();
    g.save(); g.clip(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
    for (let j = 1; j < 6; j++) {
      const f = j / 6, dy = -ry + 2 * ry * f;
      g.strokeStyle = `rgba(255,255,255,${0.22 * (1 - f) + 0.06})`; g.lineWidth = 1.5 + 3 * f;
      g.setLineDash([w * (0.05 + 0.03 * j), w * (0.04 + 0.02 * j)]); g.lineDashOffset = -t * 40 * (j % 2 ? 1 : -1) + j * 37;
      g.beginPath(); for (let xx = x - 10; xx <= x + w + 10; xx += 12) { const yy = yS + dy + ola(xx, 1.7 * (1 - f)) * 0.9 + Math.sin(xx * 0.06 + j * 2 + t * 3) * 2; xx === x - 10 ? g.moveTo(xx, yy) : g.lineTo(xx, yy); } g.stroke();
    }
    g.restore();
  }
  // la línea del agua contra el cristal: un filo de luz
  g.save(); g.globalCompositeOperation = "lighter"; g.lineJoin = "round";
  g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 3;
  g.beginPath(); delante.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke();
  g.restore();
  g.restore();
}
