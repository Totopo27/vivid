# El motor por dentro

Para quien mantiene o amplía la carpeta, no para hacer un vídeo (eso es `METODO.md`). Aquí está cómo encaja todo, qué
contrato cumple cada pieza y cómo se comprueba que nada se ha roto.

## El camino de un vídeo

```
idea → guion.json → voz.mjs → voz/tiempos.json ─┐
                                                ├→ proyecto.mjs (abre el vídeo) → cuadro.mjs (dibuja el fotograma t)
marca.json + guion.json → estilo ───────────────┘      │                              │
video/planos/*.js (dibuja(g, t)) ──────────────────────┘                              ├→ ver.mjs / revisar.mjs (hojas)
sonidos.js → sonido.mjs → sonidos/efectos.wav ───────────────────────────────────────→ render.mjs (mp4 en salida/)
```

Un fotograma (`motor/lib/cuadro.mjs`): se limpia el lienzo → el plano que toca dibuja el segundo `t` → si entra con
fundido, se mezcla con el anterior → el **acabado del look** → los **subtítulos** de su estilo → la **firma**, si la hay
(`lib/firma.mjs`).

## Las herramientas

| Herramienta | Qué hace |
|---|---|
| `doctor.mjs` | mira la máquina (Node, ffmpeg y sus códecs, el lienzo, la letra, abrir páginas, la clave, la marca, el disco); `--red` comprueba la clave sin gastar |
| `clave.mjs` | abre una página local (`clave.html`) con los pasos y los permisos para sacar la clave de ElevenLabs, y la guarda en `.env.local` (permiso 600); `--sin-abrir` solo dice la dirección |
| `voces.mjs` | abre una página local (`voces.html`) para escuchar las voces de la cuenta y de la biblioteca de ElevenLabs y elegir una; `lista`, `escuchar` y `usar` hacen lo mismo por órdenes. La guarda en la marca, como la voz de un idioma |
| `abrir.mjs` | abre una imagen, un vídeo o una dirección con el programa del sistema (Mac, Windows, Linux o WSL) |
| `marca.mjs` | enseña la marca y lo que hay (looks, subtítulos, formatos); `poner` y `quitar` la cambian validando |
| `nuevo.mjs` | crea un vídeo en `proyectos/`, con el idioma de la marca y, con `--formato`, las frases de un formato |
| `voz.mjs` | valida el guion y hace la voz de una sola toma, con el segundo de cada palabra (no la repite si no cambió) |
| `ver.mjs` | hojas de fotogramas de cualquier momento, sin renderizar |
| `comprobar.mjs` | dibuja el vídeo entero a 4 fps y avisa de lo que fallaría o se vería mal (umbrales en `lib/comprobar.mjs`) |
| `revisar.mjs` | las hojas de frases y cortes, los avisos de cortes, quietud, subtítulo, sonido, y todo `comprobar` |
| `sonido.mjs` | la pista de efectos (`sonidos/efectos.wav`) y su firma (`sonidos/efectos.json`) |
| `render.mjs` | el mp4, en hilos; rehace la pista de efectos si cambió algo; se niega si el guion cambió tras la voz |
| `muestras.mjs` | las láminas de `guia/muestras/` |
| `pruebas.mjs` | las pruebas rápidas (`pruebas-rapidas.mjs`) y que los ejemplos se dibujan igual que cuando se aprobaron |
| `empaqueta.mjs` | el zip para dar la carpeta a otra persona, sin nada de quien la usa |

`ver`, `comprobar`, `revisar` y `render` aceptan `--look` y `--subtitulos` para probar otro estilo sin tocar el guion,
y `--apertura` para la otra apertura del hook. Las opciones sin valor (`--borrador`...) están en `BANDERAS`
(`lib/comun.mjs`): una opción sin valor nueva se añade ahí.

## Los tres contextos

Los llena el motor antes de cargar los planos, así que cualquier archivo puede usarlos desde arriba:

| Import | Qué es | Archivo |
|---|---|---|
| `import * as k from "#kit"` | todo el kit de dibujo | `motor/kit/index.js` |
| `import { v } from "#voz"` | cuándo se dice cada palabra: `v.t("sol")`, `v.frase(5).t("es")` | `motor/lib/voz-actual.js` |
| `import { estilo } from "#estilo"` | el idioma, el look y los subtítulos del vídeo | `motor/lib/estilo-actual.js` |

## La marca y el estilo

- `marca.json` (raíz, de cada creador, fuera de git): lo que vale para todos sus vídeos. Solo dice lo que cambia; lo
  demás sale de `BASE` en `motor/lib/marca.mjs`.
- `guion.json` de cada vídeo manda sobre la marca: `idioma`, `look`, `subtitulos`, `voz`.
- `estiloDe(guion)` da `{ idioma, look, subtitulos, firma }` (`firma` solo si la hay); `vozDe(guion)` da la voz (la de
  la marca, la de su idioma en `voces`, y la del guion encima). `marca.duracion` es lo que suelen durar sus vídeos:
  `comprobar` y `voz.mjs` avisan de lo que se sale (5 s por debajo, 10 por encima).
- La voz se elige por idioma: `voces.mjs` la guarda en `voces.<idioma>.id` (y, fuera del español, `codigoIdioma`), que
  manda sobre `voz`. Una voz de la biblioteca de ElevenLabs hay que añadirla antes a la cuenta (`lib/elevenlabs.mjs`,
  `anadirDeLaBiblioteca`): sin eso, la voz falla. `doctor --red` mira que la de cada idioma esté en la cuenta.
- Un ajuste nuevo de la marca: su valor de siempre en `BASE`, su nombre en `CAMPOS_MARCA` y su comprobación en
  `validarMarca` (`lib/validar.mjs`), cómo se escribe en la orden en `valorDe` y cómo se enseña en `ensenar`
  (`marca.mjs`), una prueba en `pruebas-rapidas.mjs` y una línea en la sección «Personalizar» de `AGENTS.md`.
- `VIDEOS_MARCA=ninguna` ignora la marca (las pruebas lo usan: los ejemplos no dependen de la marca de nadie, y además
  fijan su look, sus subtítulos y su voz en su guion).

## Los contratos

### Un plano (`proyectos/<vídeo>/video/planos/NN-nombre.js`)
- `desde`: una palabra (`"sodio"`, `"sol#2"`), segundos o `(v) => segundos`. El primero empieza en 0.
- `entrada`: `"corte"` (lo normal), `"sigue"` o `"fundido"`.
- `dibuja(g, t)`: el fotograma del segundo `t` **del vídeo**, en un lienzo de 1080 × 1920.
- Lo que necesite el sonido, exportado (`export const choques = [...]`).

### Un look (`motor/kit/looks/<nombre>.js`, registrado en `looks/index.js`)
`export default { nombre, descripcion, colores: { fondo, tinta, acentos, luz, sombra }, fondo(g, t, cam), acabado,
material, trazo, sombra, consejos }`. `acabado(g, t, aux)` (o `null`) se aplica sobre el fotograma ya dibujado, antes
de los subtítulos; tiene que ser rápido (≤ 8 ms) y salir igual siempre para el mismo `t` (el grano, con semilla
`Math.floor(t * 60)`). Lo que comparten los acabados (resplandor, grano, viñeta, capas) está en `looks/pasos.js`.
El de siempre es `espacio` (sin acabado). Cómo se hace uno nuevo: `guia/looks.md`.

### Un estilo de subtítulos (`motor/lib/subtitulos/<nombre>.mjs`, registrado en `lib/subtitulos.mjs`)
`bloques(palabras, duracion, conf)`, `dibuja(g, t, bloques, conf)`, `zona(conf) → { x, y, w, h }`. El de siempre es
`caja`. Lo que comparten está en `subtitulos/comun.mjs`. Las posiciones que valen están en `POSICIONES`
(`lib/marca.mjs`): si un estilo nuevo trae otra, se añade ahí.

### Una pieza del kit (`motor/kit/<tema>.js`, exportada en `kit/index.js`)
Funciones que dibujan algo con luz y volumen en coordenadas de pantalla (o con la cámara de `camara.js`), que respetan
`g.globalAlpha` y dejan `g` como estaba (`save`/`restore`). Lo pesado (texturas, formas), una vez, arriba del archivo y
con semilla. Su lámina en `motor/muestras/<tema>.js`.

### Una lámina de muestras (`motor/muestras/<nombre>.js`)
`export default [[nombre, (g) => { ... }], ...]`: cada función pinta un cuadrado de 1080 × 1080. `node motor/muestras.mjs`
las dibuja en `guia/muestras/<nombre>.jpg`.

### Un formato de guion (`motor/formatos/<nombre>.json`)
```json
{
  "nombre": "mito",
  "titulo": "Mito contra realidad",
  "para": "cuándo se usa, en una frase",
  "frases": [{ "papel": "el mito, como lo dice la gente", "ejemplo": "…", "hook": true }],
  "plan": ["lo que se suele ver en cada frase, una línea por frase"]
}
```
`node motor/nuevo.mjs "<idea>" --formato mito` empieza el vídeo con esas frases (con su `papel`, sin texto). Cómo se
elige y se usa cada uno: `guia/formatos.md`.

### Los datos del kit (`motor/kit/datos/`)
Lo que no se puede dibujar inventado (las costas, las ciudades del mundo), de fuentes de dominio público, con su
procedencia y su licencia en `motor/kit/datos/LEEME.md`.

## Las páginas locales y ElevenLabs

- `lib/pagina-local.mjs` sirve las páginas de `clave.mjs` y `voces.mjs` en 127.0.0.1: solo contesta a sí misma (el Host
  y un token por página), con una política de seguridad que no deja cargar nada de fuera (salvo, en la de voces, el
  sonido de las muestras) y se cierra sola. Una página nueva para el creador, igual: un `.html` con `__NONCE__` y
  `__TOKEN__`, y sus rutas.
- Lo que llega de ElevenLabs (los nombres y las descripciones de la biblioteca los escribe cualquiera) se pinta con
  `textContent`, nunca como HTML.
- `lib/elevenlabs.mjs` es todo lo que se le pide a ElevenLabs sin gastar (las voces, añadir una, la cuenta); lo que
  cuesta, la voz de un vídeo, es `voz.mjs`. `ELEVENLABS_API=<dirección>` usa otro de sus servidores (el de la UE, por
  ejemplo), también en `voz.mjs`.

## Reglas que no se rompen

- **Todo sale de `t`.** Nada se guarda de un fotograma al siguiente: el render dibuja trozos del vídeo a la vez, en
  hilos distintos. Los lienzos de paso se limpian enteros antes de usarse.
- **El azar, con semilla:** `k.azar(semilla)`. Nunca `Math.random`, `Date` ni `performance` dentro de lo que dibuja.
- **Rápido:** cada fotograma en menos de 0,1 s (los de los ejemplos, casi todos entre 5 y 40 ms; alguno suelto, hasta 90). El acabado de un look, pocos ms.
- **Una sola dependencia:** `@napi-rs/canvas` (más ffmpeg y ffprobe del sistema). Nada que haya que compilar.
- **Mac, Windows y Linux:** rutas con `join`, imports con `pathToFileURL`, nada de comandos que solo existan en uno.
  - ffmpeg y ffprobe, siempre con `programa("ffmpeg")` de `lib/comun.mjs`, nunca a secas: lo encuentra también donde
    lo dejan winget, brew, apt, choco o scoop aunque no esté en el PATH (y `FFMPEG=<ruta>` manda).
  - Abrir algo para el creador, con `abrirEnSistema` (`lib/comun.mjs`) o `abrir.mjs`; nunca `open` ni `start` a mano.
  - Las letras se cargan desde sus bytes (`GlobalFonts.register`), no por su ruta: en Windows una ruta con tildes
    fallaba.
  - Una ruta que se compara con otra, sin distinguir mayúsculas en Mac y Windows (`carpetaRevisar`).
  - El texto va con saltos LF en todos los sistemas (`.gitattributes`).
- **Nombres únicos en el kit:** `kit/index.js` lo exporta todo junto; dos piezas con el mismo nombre se anulan sin
  avisar. Antes de exportar un nombre, búscalo en `motor/kit/`.
- **Un lienzo hecho con trazos se redibuja entero cada vez que se copia.** Si se pinta una vez y se copia mucho (un
  sprite, una textura), `lienzo.encodeSync("jpeg")` una vez lo deja en píxeles y copiarlo pasa a ser solo copiar.
  Pero después **no se vuelve a pintar nunca**: tras `encodeSync` o `toBuffer`, lo que se pinte en él cambia también
  las copias que ya se pegaron de él.
- **Nunca se pinta en un lienzo algo sacado de él mismo** (A → B → A: la figura, su borde de luz hecho de la figura y
  el borde otra vez sobre la figura). En `@napi-rs/canvas` eso deja a medias la copia de A ya pegada en el fotograma:
  si A se reutiliza en el mismo fotograma, lo pegado antes sale con lo de después. El resultado se monta en un
  tercer lienzo (A y B → C). `pruebas.mjs` y `comprobar.mjs` lo cazan como «no sale igual dos veces».
- **Rarezas del lienzo:** tras `restore()`, leer `fillStyle`/`strokeStyle` da un valor viejo (lo que se pinta es lo
  bueno): nunca se leen para reutilizarlos. `createConicGradient` no hace caso del ángulo de inicio (empieza arriba).
- **El código, como el de alrededor:** en español, con nombres cortos de lo que se ve y comentarios que dicen qué se
  ve, no cómo se programa.

## Cómo se comprueba

```
node motor/pruebas.mjs              los ejemplos se siguen dibujando igual que cuando se aprobaron (y siempre igual)
node motor/pruebas.mjs --guardar    rehace las referencias: solo si el cambio es a propósito y ya lo has mirado
node motor/muestras.mjs             rehace las láminas de guia/muestras/
```

Después de cualquier cambio en el motor, `pruebas.mjs` tiene que decir «Todo igual que las referencias». Para un
cambio que sí debe verse en los ejemplos (un fallo de dibujo arreglado), se mira `pruebas/diferencias/<caso>.jpg`, se
comprueba que lo que cambia es solo eso, y entonces `--guardar`.

## Marca blanca

La carpeta no lleva el nombre de nadie: ni avisos de propiedad, ni personas, ni vídeos de nadie. Si se le pone un nombre
o unos colores propios, estos son todos los sitios:
- El nombre del producto: `productName` en `package.json` (el nombre del zip y de su carpeta), el título de
  `AGENTS.md` y el de `EMPIEZA-AQUI.html` (su `<title>` y la cabecera).
- Los colores de las páginas: las variables de arriba de `EMPIEZA-AQUI.html`, `motor/clave.html` y `motor/voces.html`
  (`--acento`, `--boton`...), con su versión clara en `prefers-color-scheme: light`.
- Las páginas de la clave y de las voces no llevan el nombre del producto. Se pueden retocar enteras: `clave.mjs` y
  `voces.mjs` solo cambian los `__NOMBRE__` en mayúsculas (`__NONCE__`, `__TOKEN__`, `__ESTADO__`, `__IDIOMA__`...). Tiene que seguir sin cargar nada de fuera (la política
  de seguridad que le pone `clave.mjs` lo bloquea): letras, iconos e imágenes, dentro del archivo.
- Lo que se oye y se ve en los vídeos de cada creador (su voz, su firma, su cierre) no es de la carpeta: es su marca
  (`marca.json`) y sus preferencias (`preferencias.md`).

## Una versión nueva

- Sube `version` en `package.json` y cuenta lo que cambia en `CAMBIOS.md`.
- `node motor/pruebas.mjs`, `node motor/muestras.mjs` (las láminas, al día) y `node motor/doctor.mjs`.
- Lo de cada creador no viaja: `.env.local`, `preferencias.md`, `marca.json`, `maquina.md`, `proyectos/` y `salida/`
  están en `.gitignore`. Para dársela a alguien, `node motor/empaqueta.mjs` (el zip, desde git); nunca comprimas la
  carpeta tal cual: se llevaría la clave de la voz.
