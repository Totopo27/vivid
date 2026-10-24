// La voz del vídeo que se está haciendo: cuándo se dice cada palabra. El motor la llena antes de cargar el vídeo, así
// que cualquier archivo del proyecto puede hacer `import { v } from "#voz"` y usar v.t("palabra") desde arriba.
//
//   v.t("sol")          cuándo empieza la primera «sol» de toda la voz (en segundos del vídeo)
//   v.t("sol", 2)       la segunda; también v.t("sol#2")
//   v.fin("sol")        cuándo acaba
//   v.frase(5)          la quinta frase: { n, texto, inicio, fin, clave, palabras }
//   v.frase(5).t("es")  la primera «es» de esa frase (más seguro que contar en toda la voz)
//   v.duracion          lo que dura el vídeo
// Las palabras se comparan sin tildes, sin mayúsculas y sin signos: «¿Qué» es "que" y «Tierra,» es "tierra".

// (Las letras de cualquier idioma cuentan: «straße», «złoto» o «мир» no se quedan en nada.)
export const clave = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]/gu, "");

export const v = {
  duracion: 0,
  palabras: [],
  frases: [],
  t(palabra, n) { return buscar(this.palabras, palabra, n, "la voz").inicio; },
  fin(palabra, n) { return buscar(this.palabras, palabra, n, "la voz").fin; },
  palabra(palabra, n) { return buscar(this.palabras, palabra, n, "la voz"); },
  frase(n) {
    const f = this.frases[n - 1];
    if (!f) throw new Error(`No hay frase ${n}: la voz tiene ${this.frases.length}.`);
    return f;
  },
};

function buscar(lista, palabra, n, donde) {
  let p = String(palabra), k = n ?? 1;
  const m = p.match(/^(.*)#(\d+)$/);
  if (m) { p = m[1]; k = Number(m[2]); }
  const c = clave(p);
  let vistas = 0;
  for (const w of lista) if (clave(w.texto) === c && ++vistas === k) return w;
  const parecidas = [...new Set(lista.map((w) => clave(w.texto)).filter((x) => x.startsWith(c.slice(0, 3))))].slice(0, 8);
  throw new Error(`No encuentro «${palabra}»${k > 1 ? ` número ${k}` : ""} en ${donde} (sale ${vistas} veces).` + (parecidas.length ? ` Parecidas: ${parecidas.join(", ")}.` : ""));
}

// El motor la llena con voz/tiempos.json.
export function llenar(datos) {
  v.duracion = datos.duracion;
  v.palabras = datos.palabras;
  v.frases = datos.frases.map((f) => {
    const palabras = datos.palabras.filter((w) => w.frase === f.n);
    return {
      ...f,
      palabras,
      t: (p, n) => buscar(palabras, p, n, `la frase ${f.n}`).inicio,
      finDe: (p, n) => buscar(palabras, p, n, `la frase ${f.n}`).fin,
    };
  });
}
