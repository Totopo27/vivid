// El estilo del vídeo que se está haciendo: su idioma, su look y sus subtítulos. El motor lo llena antes de cargar los
// planos (como la voz), así que cualquier archivo del proyecto puede hacer `import { estilo } from "#estilo"` y leerlo
// desde arriba.
//
//   estilo.idioma       "es", "en"... (el del guion.json, o el de la marca)
//   estilo.look         el nombre del look ("espacio", "neon"...): k.look() da sus colores, su fondo y su acabado
//   estilo.subtitulos   { estilo, posicion, ... }: cómo son los subtítulos y dónde van
//
// Fuera de un proyecto (las muestras del kit) vale lo de abajo.

export const estilo = {
  idioma: "es",
  look: "espacio",
  subtitulos: { estilo: "caja", posicion: "arriba" },
};

// El motor lo llena con lo que sale de la marca y del guion (motor/lib/marca.mjs).
export function llenarEstilo(datos) {
  Object.assign(estilo, datos);
}
