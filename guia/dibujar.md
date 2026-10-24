# Cómo se dibuja

Todo se dibuja en código, en un lienzo de 1080 × 1920, fotograma a fotograma. Nada de metraje ni de plantillas: el
mundo de cada vídeo se construye para él. Mira primero las láminas de `guia/muestras/` (lo que el kit ya dibuja: abajo,
«Las piezas que ya están hechas») y los planos de los ejemplos (`ejemplo/estrella-verde/video/` y
`ejemplo/alcohol/video/`). Cómo se dibuja en cada look, en `guia/looks.md`.

## Cómo está hecho un vídeo

```
video/mundo.js            lo que comparten los planos: el mismo objeto, el mismo cielo, dibujos propios (un salero)
video/planos/01-cielo.js  un archivo por plano; se ordenan por cuándo empiezan
video/planos/02-...js
video/aperturas/01-...js  la otra apertura del hook, con el número del plano al que sustituye (METODO, paso 5)
sonidos.js                los efectos (guia/sonido.md)
```

Un plano exporta:
- `desde`: cuándo empieza.
  - Una palabra: `"mismo"`, `"sol#2"` (la segunda «sol» de la voz).
  - Un número de segundos.
  - Una función `(v) => segundos`.

  La imagen llega dos fotogramas antes que la palabra. El primero empieza en 0. Cada plano dura hasta que empieza el
  siguiente.
- `entrada`: cómo se entra desde el anterior.
  - `"corte"`, lo normal: otro sitio.
  - `"sigue"`: el mismo sitio con la misma cámara, partido en dos archivos solo por orden; no se nota nada.
  - `"fundido"`: rara vez.
- `dibuja(g, t)`: dibuja el fotograma del segundo `t` del vídeo (no del plano) en el lienzo `g`. El motor lo limpia antes
  (negro, sin transparencias ni sombras) y pone los subtítulos encima: no los dibujes tú.
- Lo que necesite el sonido, exportado: `export const choques = [...]` con el segundo de cada choque. `sonidos.js` lo
  importa, y así el sonido sigue a la imagen aunque cambie.

```js
import * as k from "#kit";
import { v } from "#voz";
import { cielo } from "../mundo.js";

export const desde = "aire";
const Tsodio = v.frase(8).t("sodio");        // una palabra dentro de su frase: más seguro que contar en toda la voz

export function dibuja(g, t) {
  const cam = k.mira([0, 0, 30], [0, 0, 0]);
  k.fondo(g, cam);
  k.estrellas(g, cam, null, cielo);
  const enciende = k.suave(k.tramo(t, Tsodio - 0.12, Tsodio + 0.25));
  k.brillo(g, 540, 1000, 300, "sodio", enciende);
}
```

**Reglas que no se rompen:**
- **Todo sale de `t`:** nada se guarda de un fotograma al siguiente. Cualquier fotograma se puede dibujar solo, porque
  el render dibuja trozos del vídeo a la vez.
- **El azar, siempre con semilla:** `k.azar(semilla)`. Nunca `Math.random`.
- **Lo pesado, una vez,** arriba del archivo: texturas, listas de estrellas, de rocas o de granos. Cada fotograma debe
  dibujarse en menos de 0,1 s (los de los ejemplos, casi todos entre 5 y 40 ms).
- **El tiempo de la voz:** `v.t("palabra")`, `v.t("palabra", 2)`, `v.fin("palabra")` y `v.frase(n)` (con su `inicio`,
  `fin`, `palabras` y `t()`).
  Las palabras se buscan sin tildes ni signos: «¿Qué» es `"que"`.

## La pantalla

- **El subtítulo** va donde diga su estilo (`guia/subtitulos.md`; el de siempre, `caja` arriba, entre y 318 y 482). Ahí
  no va nada importante. Si detrás hay algo muy claro, se pone un velo oscuro suave (como en el hook del ejemplo,
  cuando la superficie llena la pantalla).
- **Lo que tapa Instagram:** por encima de y 270, por debajo de y 1440 y la columna de botones (x > 950 desde y 1050).
  Lo importante, dentro.
- **Grande:** la cosa principal llena media pantalla o más. Nunca algo pequeño en medio de un fondo vacío.

## La cámara y el mundo

El mundo es 3D aunque se dibuje en 2D: cada cosa tiene un sitio `[x, y, z]` y la cámara la proyecta.

- `k.mira(posicion, objetivo)`: una cámara en `posicion` que mira a `objetivo`.
- `k.proyecta(cam, X)` → `{ x, y, z }` en pantalla (o `null` si queda detrás). Algo de radio `s` sale de `k.F * s / z`
  píxeles.
- `k.ruta([[t, { pos, mira }], ...])`: una cámara que pasa por esas claves (en las palabras) sin tirones.
- `k.orbita(ángulo, distancia, altura)`: un punto alrededor del centro, para girar alrededor de algo.
- **Para pasar de una cámara a otra sin corte,** se mezclan:
  `pos = k.mezV(A.pos, B.pos, k.suave(k.tramo(t, t0, t1)))`, igual con `mira` (así va el plano `02-sistema.js` del
  ejemplo: de frente → girando alrededor → bajando detrás de una roca).
- **Las estelas:** pasa la cámara del fotograma anterior (`cam(t - 1/60)`) a `k.estrellas`.
- **De lejos a cerca:** junta lo que se dibuja en `[{ z, dibuja() }]` y `k.deLejosACerca(cosas)`.
- **Algo pegado a una cosa del mundo pero dibujado en pantalla** (un contorno, una cifra, medio Sol que se aprieta):
  usa su posición proyectada.

**La cámara solo se mueve cuando la voz lo pide:**
- entra a ver lo que se nombra;
- se aleja para ver el conjunto;
- gira para enseñar lo de detrás;
- baja con lo que cae.

Nunca deriva sola, nunca tiembla y nunca hace zoom porque sí.

## El tiempo del movimiento

- `k.tramo(t, a, b)`: de 0 a 1 entre a y b. `k.suave(u)`: arranca y frena sin tirones. `k.entra(u)`: llega rápido y
  frena largo (lo que entra). `k.sale(u)`: arranca despacio y se va rápido (lo que se va). `k.pulso(t, t0, ancho)`: un
  latido. `k.claves([[t, valor], ...])`: pasa por varios valores sin pararse en medio.
- **Cada movimiento empieza y acaba en una palabra, y dura lo que su frase.** Un golpe o una cifra, rápido y en su
  palabra; lo que se construye mientras se explica, toda la explicación.
- **La cosa grande hace algo durante toda la frase,** no solo en su palabra: gira, hierve, cae, crece o se apaga. Una
  imagen que aparece y se queda quieta es una diapositiva.
- **Lo que la voz nombra llega y se queda:** al menos medio segundo entero y casi quieto. En una lista rápida, cada cosa
  llega y se suma a las anteriores.
- **Antes de un corte, todo ha acabado:** ningún brillo, latido ni caída cruza el corte, y la imagen reposa un momento.

## La luz y el volumen: lo que hace que no parezca un esquema

- **Un fondo con profundidad,** nunca un color plano.
  - En el espacio: `k.fondo` + `k.estrellas`.
  - En otro sitio: un degradado, una textura suave y el brillo de la luz que lo ilumina (la cocina oscura con el
    reflejo de la llama).
- **Cada objeto lleva:**
  - un degradado según de dónde viene la luz;
  - una textura encima (`k.red` o `k.manchas`, con `"multiply"` para oscurecer y `"screen"` para iluminar);
  - su lado de sombra;
  - su brillo o su borde de luz.
- **La luz se suma:** `g.globalCompositeOperation = "lighter"` para brillos, llamas, rayos y destellos (`k.brillo`,
  `k.fogonazo`, `k.haz`).
- **Materiales del kit:**
  - `k.vidrio`, `k.reflejo` y `k.metal` para objetos;
  - `k.roca`, con `calor` para ponerla al rojo;
  - `k.superficie` para un suelo enorme;
  - `k.causticas` y `k.rayos` para el agua o un aire espeso;
  - `k.estallido` y `k.anilloDeLlamas` para el fuego.
- **Lo invisible, en un color** que no se usa para nada más (el sodio, naranja; lo que está mal, rojo).
- **Transparencias:** las piezas del kit respetan `g.globalAlpha`. Para que algo complejo aparezca o se vaya entero,
  dibújalo en un lienzo aparte y ponlo con transparencia (`k.estrellaTransparente`, o `k.lienzo(1080, 1920)` y
  `g.drawImage`). Si no, cada capa se transparenta por su cuenta y sale un fantasma con otra textura.
- **Texto en la imagen,** solo lo que el subtítulo no dice (una cifra que corre, una distancia): `k.pastilla` o
  `k.etiqueta`, grande y quieto al menos medio segundo.

## Las piezas que ya están hechas

Antes de dibujar algo, mira si ya está. Cada función explica sus opciones en el comentario de encima, en
`motor/kit/<archivo>.js`: léelo antes de usarla. Todas respetan `g.globalAlpha` y dejan `g` como estaba.

| Lámina (`guia/muestras/`) | Qué hay | Funciones |
|---|---|---|
| `kit.jpg` | estrellas, planetas, la Tierra, rocas, brillos, fogonazos, haces, estallidos, fuego, una superficie, el cielo y la galaxia, cifras y etiquetas, cristal y metal, bajo el agua | `estrella`, `planeta`, `tierra`, `roca`, `brillo`, `fogonazo`, `haz`, `estallido`, `anilloDeLlamas`, `superficie`, `fondo`, `cielo`, `estrellas`, `galaxia`, `pastilla`, `etiqueta`, `vidrio`, `reflejo`, `metal`, `causticas`, `rayos` |
| `personas.jpg` | personas con poses (de pie, andando, señalando, celebrando, sentadas), siluetas a contraluz, multitudes en plaza, filas o gradas que aplauden, botan o hacen la ola | `persona`, `personaEn`, `gente` + `multitud`, `graderio` |
| `ciudad.jpg` | edificios 3D con sus ventanas, una ciudad entera de día, al anochecer o de noche (con farolas y coches), su cielo y un perfil para el fondo | `unEdificio` + `edificio`, `ciudad` + `dibujaCiudad`, `cieloCiudad`, `perfilCiudad` |
| `agua.jpg` | el mar, un lago o una piscina hasta el horizonte, gotas, ondas, salpicaduras, burbujas, un chorro, el agua que sube | `mar`, `gota`, `ondas`, `salpicadura`, `burbujas`, `chorro`, `nivelDeAgua` |
| `maquinas.jpg` | engranajes que encajan, un móvil o un monitor con lo que quieras en la pantalla, botones, interruptores, pilotos, un cuentakilómetros de rodillos | `engranaje`, `engranajes`, `pantalla`, `boton`, `interruptor`, `piloto`, `cuentakilometros` |
| `escala.jpg` | una cifra gigante que corre, «1 de cada N» alejándose, torres 3D que crecen, una pila que sube, cosas de tamaños muy distintos en fila | `cifraGigante`, `unoDeCada`, `torres`, `pila`, `filaDeTamanos` |
| `mapa.jpg` | el globo con los continentes de verdad (de día y de noche), chinchetas, rutas, el mapa del mundo en relieve, ciudades por su nombre | `globo` + `sobreGlobo`, `chincheta`, `rutaEnGlobo`, `mapaPlano` + `enMapa`, `rutaEnMapa`, `lugar("Madrid")` |
| `looks.jpg` | cada look con sus materiales | `look()`, `fondoDelLook`, `materialDelLook`, `trazoDelLook`, `sombraDelLook`, `lineaDeLuz` |

Son un punto de partida, no el vídeo: se combinan, se les da el color del look y se mueven con la voz. Si una pieza
no está al nivel que pide el plano (de muy cerca, por ejemplo), se dibuja encima lo que falte o se hace una propia.

## Cuando el kit no tiene lo que necesitas

Casi siempre pasará: cada tema tiene sus cosas. Se dibujan como el salero del ejemplo (`video/mundo.js`) o el fuego de
la cocina (`03-cocina.js`):
1. **La forma,** con caminos (`beginPath`, `quadraticCurveTo`, `k.redondo`) y sus proporciones de verdad. Busca una foto
   para saber cómo es.
2. **La luz:** un degradado por el lado de la luz, la sombra al otro, un reflejo fuerte.
3. **La textura,** para que no sea plano.
4. **Mírala a tamaño completo** (`node motor/ver.mjs <proyecto> <segundo>`) antes de moverla. Si parece un icono, un
   emoji o un juguete, redibújala.

Si algo sale en más de un plano, va en `mundo.js` una vez: así es siempre la misma cosa y del mismo tamaño. Si sirve
para otros vídeos, puede ir al kit (`motor/kit/`, con su lámina en `motor/muestras/`), pero eso es cambiar la carpeta,
no hacer un vídeo: `motor/LEEME.md`.

**Tres rarezas del lienzo** (`@napi-rs/canvas`), para no perder tiempo con ellas:
- Un lienzo de paso que se pinta a partir de sí mismo (la figura → su borde → el borde sobre la figura) deja mal las
  copias ya pegadas si se reutiliza en el mismo fotograma: monta el resultado en un tercer lienzo.
- Después de `g.restore()`, leer `g.fillStyle` o `g.strokeStyle` devuelve un valor viejo (lo que se pinta sí es lo
  bueno). Nunca leas esos valores para reutilizarlos: pon el color antes de cada uso.
- `createConicGradient(inicio, x, y)` no hace caso del ángulo de inicio: empieza siempre arriba. Gira el lienzo.

Cuando el tema es una persona, una marca o un sitio real, una foto real (con su licencia, apuntada en `notas.md`)
puesta en el mundo es mejor que un muñeco dibujado: `import { loadImage } from "@napi-rs/canvas"` una vez arriba del
archivo y `g.drawImage`.

## Mirar lo que se dibuja

Lo que no has mirado no está revisado. Cada vez que cambies algo:

```
node motor/ver.mjs <proyecto> 12.4            un fotograma grande
node motor/ver.mjs <proyecto> 9-11.5 --fps 10  un tramo
node motor/ver.mjs <proyecto> frase 5          una frase, de su primera palabra a la última
node motor/ver.mjs <proyecto> palabra sodio    alrededor de una palabra, a 30 fps
node motor/ver.mjs <proyecto> corte 2          un cambio de plano, a 30 fps
node motor/ver.mjs <proyecto> planos           el principio, el medio y el final de cada plano
```

Cada una tarda segundos y deja un `.jpg` en `revisar/`: ábrelo siempre. Lo que hay que buscar está en `METODO.md`,
paso 7.
