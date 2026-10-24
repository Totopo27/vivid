// Lo que comparten los estilos de subtítulos (menos caja, que va por su cuenta): partir la voz en bloques, colocar un bloque en líneas, dónde va
// cada posición, los colores y los movimientos. No es un estilo (no se registra en ../subtitulos.mjs).
import { createCanvas } from "@napi-rs/canvas";

export const ANTICIPO = 0.08; // la palabra aparece un poco antes de oírse, para que se lea a tiempo (como caja)

export const salir = (u) => 1 - Math.pow(1 - u, 2);                                        // power2.out
export const suave = (u) => u * u * (3 - 2 * u);
export const rebote = (u, s = 2.5) => { u -= 1; return u * u * ((s + 1) * u + s) + 1; };    // back.out(s)
export const tramo = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
export const sale = (w) => w.inicio - ANTICIPO; // cuándo aparece una palabra

// Los colores del estilo con los que cambie el vídeo (conf.colores) y su tamaño (conf.escala, 1 lo normal).
export const coloresDe = (conf, base) => ({ ...base, ...(conf.colores || {}) });
export const escalaDe = (conf) => (Number(conf.escala) > 0 ? Math.min(1.6, Math.max(0.6, Number(conf.escala))) : 1);

// Lo que se escribe de una palabra: en mayúsculas si el estilo lo pide, y sin la coma o el punto del final si va limpio.
export function escrito(texto, { mayusculas = false, limpio = false } = {}) {
  const s = limpio ? texto.replace(/[.,;:…]+(["»”)]*)$/u, "$1") || texto : texto;
  return mayusculas ? s.toUpperCase() : s;
}

// Lo ancho que sale un texto con una letra (se mide una vez y se guarda: es igual en cada fotograma).
const medidor = createCanvas(8, 8).getContext("2d"), medidos = new Map();
export function mide(texto, letra) {
  const k = letra + "|" + texto;
  let w = medidos.get(k);
  if (w === undefined) { medidor.font = letra; w = medidor.measureText(texto).width; medidos.set(k, w); }
  return w;
}

// Palabras cortas que no se quedan colgando al final de un bloque: se van con la siguiente.
const ATADAS = new Set(("el la los las un una unos unas lo al del de a en y e o u ni que con por para sin su sus se le " +
  "les me te mi mis tu tus nos the an of to and or in on at for with by from my your his her its our their").split(" "));
const pelada = (s) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9']/g, "");
export const cierra = (w) => /[.,;:!?…]["»”)]*$/u.test(w.texto); // acaba en un signo: buen sitio para cortar
export const atada = (w) => !cierra(w) && ATADAS.has(pelada(w.texto));

// Parte las palabras de la voz en bloques. Nunca mezcla dos frases; corta cuando ya no cabe (cabe(palabras) lo dice),
// tras un signo (si el bloque ya tiene `signo` palabras), tras una pausa larga o cuando corta(palabras, w) lo pide (la
// clave sola...). No deja un artículo colgando al final; si un bloque se cortó por lleno, reparte las palabras con el
// siguiente para que no quede uno largo y otro de una palabra (parejos); y un bloque que se vería menos de `minimo`
// segundos se junta con el siguiente si caben.
export function trocear(palabras, { cabe, max = 8, pausa = 0.6, signo = 3, corta = null, parejos = true, minimo = 0.3 } = {}) {
  const bs = [];
  let b = null;
  for (const w of palabras) {
    const ult = b && b.palabras[b.palabras.length - 1];
    if (b && b.frase === w.frase) {
      const lleno = b.palabras.length >= max || !cabe([...b.palabras, w]);
      const corte = (cierra(ult) && b.palabras.length >= signo) || w.inicio - ult.fin > pausa || (corta && corta(b.palabras, w));
      if (!lleno && !corte) { b.palabras.push(w); continue; }
      if (!corte) {
        // el artículo o la preposición del final, al bloque nuevo
        const ps = b.palabras, lleva = [];
        while (ps.length - lleva.length > 1 && atada(ps[ps.length - 1 - lleva.length])) lleva.unshift(ps[ps.length - 1 - lleva.length]);
        // sin dejar detrás un «de» solo ni un bloque que se vería menos de `minimo`
        const queda = ps.length - lleva.length, mal = (queda === 1 && atada(ps[0])) || (lleva.length && sale(ps[queda]) - sale(ps[0]) < minimo);
        if (lleva.length && !mal && lleva.length < max && cabe([...lleva, w])) ps.length = queda;
        else lleva.length = 0;
        bs.push((b = { frase: w.frase, palabras: [...lleva, w], lleno: true }));
        continue;
      }
    }
    bs.push((b = { frase: w.frase, palabras: [w] }));
  }
  const letras = (ps) => ps.reduce((s, w) => s + w.texto.length + 1, 0);
  if (parejos) for (let vuelta = 0; vuelta < 2; vuelta++) for (let i = bs.length - 1; i > 0; i--) {
    if (!bs[i].lleno) continue;
    const a = bs[i - 1].palabras, c = bs[i].palabras;
    for (;;) {
      // la última palabra del bloque de antes, con sus artículos delante, pasa al siguiente si así quedan más parejos
      let n = 1;
      while (n < a.length - 1 && atada(a[a.length - 1 - n])) n++;
      const va = a.slice(a.length - n);
      if (a.length - n < 2 || c.length + n > max || cierra(va[n - 1]) || letras(a) - letras(c) <= letras(va) || !cabe([...va, ...c])) break;
      a.length -= n; c.unshift(...va);
    }
  }
  // lo que se vería demasiado poco, con el bloque de después o, si no cabe, con el de antes
  const dura = (i) => (bs[i + 1] ? sale(bs[i + 1].palabras[0]) : Infinity) - sale(bs[i].palabras[0]);
  const junta = (i) => {
    const a = bs[i], c = bs[i + 1], junto = c && [...a.palabras, ...c.palabras];
    if (!c || a.frase !== c.frase || junto.length > max || !cabe(junto)) return false;
    a.palabras = junto; bs.splice(i + 1, 1);
    return true;
  };
  for (let i = 0; i < bs.length; i++) if (dura(i) < minimo && (junta(i) || (i > 0 && junta(i - 1)))) i = Math.max(-1, i - 2);
  return bs;
}

// Cuándo se ve cada bloque: desde que aparece su primera palabra hasta que aparece el siguiente (o `queda` segundos
// después de su última palabra, si hay un silencio; el último, hasta el final). suelto: detrás hay un hueco y se apaga.
export function tiempos(bs, duracion, queda = 0.6) {
  bs.forEach((b, i) => {
    const sig = bs[i + 1], ult = b.palabras[b.palabras.length - 1];
    b.inicio = Math.max(0, sale(b.palabras[0]));
    b.fin = sig ? Math.min(sale(sig.palabras[0]), ult.fin + queda) : duracion;
    b.suelto = !sig || sale(sig.palabras[0]) > b.fin + 0.01;
  });
  return bs;
}

// Reparte los anchos en líneas de `ancho` como mucho y lo más parejas posible: [[0, 1, 2], [3, 4]].
export function enLineas(anchos, ancho, hueco) {
  const reparte = (lim) => {
    const ls = [[]];
    let usado = 0;
    anchos.forEach((a, i) => {
      const l = ls[ls.length - 1];
      if (l.length && usado + hueco + a > lim) { ls.push([i]); usado = a; }
      else { usado += (l.length ? hueco : 0) + a; l.push(i); }
    });
    return ls;
  };
  const ls = reparte(ancho);
  if (ls.length === 1) return ls;
  let lo = Math.max(...anchos), hi = ancho;
  for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (reparte(m).length <= ls.length) hi = m; else lo = m; }
  return reparte(hi);
}

// Coloca un bloque: cada palabra en su sitio, centrado en x = 540 y con la primera línea arriba en y = 0.
// op: { letra(tam) → "700 74px Figtree", tam, ancho, hueco y linea (en veces el tamaño), lineas (cuántas como mucho),
// texto(w), apiladas (una palabra en cada línea) y, para dejar sitio a lo que crece al dibujarse, crece(w) (en veces
// su ancho) y holgura(w) (en veces el tamaño de la letra) }. Si una palabra no cabe en el ancho, o salen más líneas
// de la cuenta, la letra se reduce.
export function disponer(palabras, op) {
  const textos = palabras.map(op.texto);
  let tam = op.tam;
  for (let k = 0; ; k++) {
    const letra = op.letra(tam), hueco = op.hueco * tam;
    const anchos = textos.map((s, i) => mide(s, letra) * (op.crece ? op.crece(palabras[i]) : 1) + (op.holgura ? op.holgura(palabras[i]) * tam : 0));
    const mas = Math.max(...anchos);
    if (mas > op.ancho) { tam *= (op.ancho / mas) * 0.995; continue; }
    const ls = op.apiladas ? anchos.map((_, i) => [i]) : enLineas(anchos, op.ancho, hueco);
    if (ls.length > op.lineas && k < 20) { tam *= 0.94; continue; }
    const linea = op.linea * tam, sitios = [];
    ls.forEach((l, j) => {
      let x = 540 - (l.reduce((s, i) => s + anchos[i], 0) + hueco * (l.length - 1)) / 2;
      for (const i of l) { sitios[i] = { texto: textos[i], x, w: anchos[i], cx: x + anchos[i] / 2, cy: (j + 0.5) * linea, fila: j }; x += anchos[i] + hueco; }
    });
    return { tam, letra, sitios, filas: ls.length, linea, alto: ls.length * linea };
  }
}

// Si unas palabras caben juntas en un bloque: en `lineas` líneas como mucho y sin que la letra quede más pequeña de lo
// que ya la reduce la más larga de ellas sola (una palabra muy larga se reduce, pero no obliga a ir sola).
export function cabeEn(op, lineas) {
  return (ws) => {
    const d = disponer(ws, op);
    return d.filas <= lineas && d.tam >= Math.min(...ws.map((w) => disponer([w], op).tam)) - 0.01;
  };
}

// Dónde queda la parte de arriba de un bloque de alto h: arriba, desde y 318 (como caja); centro, centrado en y 860;
// abajo, acabando en y 1380 (lo de Instagram empieza en 1440).
export const Y = { arriba: 318, centro: 860, abajo: 1380 };
export function arribaDe(posicion, h) {
  if (posicion === "abajo") return Y.abajo - h;
  if (posicion === "centro") return Y.centro - h / 2;
  return Y.arriba;
}

// Lo que un estilo se separa de la altura de siempre en una posición (E.corre, en veces la letra: { arriba: 0.16 }).
export const corrido = (E, posicion, tam) => ((E.corre && E.corre[posicion]) || 0) * tam;

// El tamaño de la letra, el alto de todas las líneas y su ancho para un estilo en su posición. Si el bloque puede bajar
// de y 1050, las líneas se estrechan para que nada (con lo que sobresale: E.margen, en veces la letra) pase de x 950.
export function medidas(conf, E, posicion = conf.posicion) {
  const tam = E.tam * escalaDe(conf), alto = E.lineas * E.linea * tam, margen = E.margen * tam;
  const baja = arribaDe(posicion, alto) + corrido(E, posicion, tam) + alto + margen > 1050;
  return { tam, alto, ancho: baja ? Math.min(E.ancho, 2 * (950 - margen - 540)) : E.ancho };
}

// La zona de un estilo: el ancho de su línea y el alto de sus líneas, en su posición.
export function zonaDe(posicion, ancho, alto) {
  return { x: Math.round(540 - ancho / 2), y: Math.round(arribaDe(posicion, alto)), w: Math.round(ancho), h: Math.round(alto) };
}

// Un rectángulo de esquinas redondas (el camino; se rellena o se pinta fuera).
export function redondo(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// Una sombra suave (o un brillo) barata: la silueta repetida con bordes cada vez más anchos y casi transparentes, que
// se suman en una sombra que se apaga hacia fuera (un desenfoque de verdad costaría diez veces más). traza(grosor)
// traza las siluetas con ese grosor de borde (strokeText, o el camino de una pastilla) y g.globalAlpha ya puesto (alfa,
// por si hay que multiplicarlo); ancho: hasta dónde llega desde el borde de la letra; al: lo oscura que es pegada a ella.
export function halo(g, traza, { ancho = 20, capas = 0, color = "#000000", al = 0.5, dy = 0 } = {}) {
  if (al <= 0.003) return;
  capas ||= Math.max(6, Math.min(12, Math.round(ancho / 3))); // una capa cada pocos píxeles: sin escalones a la vista
  const A = g.globalAlpha;
  g.save();
  g.translate(0, dy);
  g.strokeStyle = color; g.fillStyle = color; g.lineJoin = "round";
  const a = A * (1 - Math.pow(1 - Math.min(0.99, al), 1 / capas));
  for (let k = capas; k >= 1; k--) { g.globalAlpha = a; traza((2 * ancho * k) / capas, a); }
  g.restore();
}

// Empieza a dibujar subtítulos con g limpio (como lo deja el motor) y devuelve con qué dejarlo como estaba. (Con esta
// versión del lienzo, restore() vuelve a los colores de antes pero fillStyle y strokeStyle siguen diciendo los nuevos:
// se ponen a mano.)
export function empieza(g) {
  const relleno = g.fillStyle, trazo = g.strokeStyle;
  g.save();
  limpio(g);
  return () => { g.restore(); g.fillStyle = relleno; g.strokeStyle = trazo; };
}

// El estado de g como lo dejó el motor, para empezar a dibujar subtítulos (dentro de un save/restore).
export function limpio(g) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.filter = "none";
  g.shadowBlur = 0; g.shadowColor = "rgba(0,0,0,0)"; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
  g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round"; g.miterLimit = 2; g.setLineDash([]);
}

// El bloque que se ve en t (o null), y lo que se ha apagado si detrás viene un silencio (1 entero, 0 ya no está).
export function bloqueEn(bs, t) {
  const b = bs.find((x) => t >= x.inicio && t < x.fin);
  if (!b) return null;
  return { b, al: b.suelto ? 1 - tramo(t, b.fin - 0.12, b.fin) : 1 };
}
