# Los subtítulos

Cada vídeo lleva un estilo de subtítulos. Se elige en su `guion.json` (o, para todos los vídeos, en `marca.json`); si no
dice nada, es `caja`, el de siempre. Mira `guia/muestras/subtitulos.jpg` antes de elegir: es cada estilo sobre los
ejemplos.

```json
"subtitulos": { "estilo": "karaoke", "posicion": "arriba" }
"subtitulos": { "estilo": "gigante", "posicion": "centro" }
"subtitulos": { "estilo": "contorno", "posicion": "abajo", "escala": 1.2, "colores": { "marca": "#3cf0ff" } }
"subtitulos": "no"
```

## Lo que hacen todos

- Cada palabra sale al decirse (un poco antes, para que se lea a tiempo). La excepción es `karaoke`, que enseña el
  bloque entero y va encendiendo la que suena.
- Nunca juntan dos frases en la misma pantalla, y cortan donde corta la voz: tras un punto, una coma o una pausa.
- La palabra `clave` de cada frase del guion es la que se marca: leídas seguidas, las claves cuentan el vídeo.
- Una palabra larga nunca se sale: salta de línea o se hace más pequeña. Vale para español y para inglés.
- Todo cae dentro de lo que no tapa Instagram (entre y 270 e y 1440, y nada a la derecha de x 950 desde y 1050).
- Se leen sobre fondos claros y oscuros: cada estilo trae su borde, su sombra o su fondo.

## Las opciones

| Opción | Qué hace |
|---|---|
| `estilo` | `caja`, `karaoke`, `gigante`, `minimal`, `contorno` o `fondo` |
| `posicion` | `arriba` (lo normal, desde y 318), `centro` (alrededor de y 860), `abajo` (acaba en y 1380) o `no` (sin subtítulos). `caja` solo va arriba o abajo |
| `escala` | el tamaño: 1 lo normal, de 0,6 a 1,6. Más grande, menos palabras en pantalla |
| `colores` | `{ "tinta", "dicha", "marca" }` y los propios de cada estilo (abajo): cualquier color de CSS (`"#ffd23f"`) |
| `mayusculas` | `true` o `false`. Por defecto, en mayúsculas `gigante` y `contorno`; los demás, como se escriben |

`caja` no entiende `escala`, `colores` ni `mayusculas`: es siempre igual.

## Los estilos

### caja (el de siempre)
Pocas palabras, arriba. La que suena en blanco, las dichas en gris; la clave dentro de su recuadro azul con dos
tiradores, como una selección de texto. **Cuándo:** casi siempre; si no sabes cuál, este.

### karaoke
El bloque entero (hasta tres líneas) desde su primera palabra; lo que falta por decir, en gris. La palabra que suena se
enciende de color y crece un poco; la clave, al sonar, entra en su pastilla de color con un rebote y se queda en ella.
**Cuándo:** voz rápida o con mucho texto, listas, explicaciones que se leen por delante, gente que lo ve sin sonido.
**Colores:** `tinta` la letra (`#ffffff`), `dicha` la que suena (`#ffd23f`), `marca` la pastilla de la clave
(`#2f7cf6`).

### gigante
Una o dos palabras cada vez, enormes, en mayúsculas y una encima de otra. Cada una entra de golpe (crece pasándose un
poco y vuelve) con un relieve oscuro debajo; la clave va sola, en su color y con un destello al entrar.
**Cuándo:** hooks y vídeos con ritmo, frases cortas y con fuerza. Mejor en el `centro` (pídelo: si no, va arriba) o
arriba. Tapa mucho: el plano tiene que dejarle sitio (lo importante, por encima o por debajo de su zona).
**Colores:** `tinta` (`#ffffff`), `marca` la clave (`#ffd21f`), `relieve` el relieve y el borde (`#0b0d12`).

### minimal
Limpio y más pequeño, en dos líneas como mucho y sin cajas: cada palabra aparece con un fundido que sube un poco, con
una sombra suave; la clave, en su color, con una raya fina que se dibuja debajo. **Cuándo:** vídeos elegantes o de
datos, cuando la imagen manda y el texto no debe taparla.
**Colores:** `tinta` (`#ffffff`), `dicha` las ya dichas (igual que la tinta), `marca` la clave y su raya (`#ffd27a`).

### contorno
El de TikTok y CapCut: mayúsculas muy gruesas con un borde negro grueso y una sombra dura; dos a cuatro palabras, que
saltan al decirse. La clave, en amarillo, algo más grande e inclinada. **Cuándo:** ritmo, listas, humor, vídeos de
gente; cualquier fondo, por cambiante que sea.
**Colores:** `tinta` (`#ffffff`), `marca` la clave (`#ffe234`), `borde` (`#000000`).

### fondo
El texto de TikTok: letra oscura sobre una banda blanca de esquinas redondas por línea, que se alarga con cada palabra
dicha; la clave, en su color. **Cuándo:** imágenes muy claras o muy cargadas (es el que mejor se lee, porque trae su
fondo), vídeos de explicar o de noticias.
**Colores:** `tinta` (`#121317`), `dicha` las ya dichas (igual), `marca` la clave (`#e8304f`), `fondo` la banda
(`#ffffff`).

## Dónde caen

Ahí no va nada importante del plano. Con `escala` 1 (con más escala, más alto):

| Estilo | arriba | centro | abajo |
|---|---|---|---|
| caja | y 318–482 | — | y 1200–1364 |
| karaoke | y 318–574 | y 732–988 | y 1124–1380 |
| gigante | y 348–711 | y 638–1001 | y 1017–1380 |
| minimal | y 318–461 | y 789–932 | y 1237–1380 |
| contorno | y 318–533 | y 752–967 | y 1165–1380 |
| fondo | y 318–479 | y 779–940 | y 1219–1380 |

Son las líneas que puede llegar a ocupar; un bloque corto ocupa menos (arriba, desde la parte de arriba; abajo, desde
la de abajo; en el centro, centrado). `zonaSubtitulos(conf)` de `motor/lib/subtitulos.mjs` da la del vídeo.

## La firma

Un texto pequeño encima de cada fotograma, como los subtítulos: el @ del creador, su web o su nombre. Va a la
izquierda, dentro de lo que no tapa Instagram y sin pisar a ningún estilo de subtítulos: `abajo` (lo normal, y 1400–1432,
justo encima del texto del post) o `arriba` (y 280–312, justo debajo del título del reel). Blanca, con una sombra
suave, al 80 %.

```json
"firma": "@micanal"
"firma": { "texto": "micanal.com", "posicion": "arriba", "opacidad": 0.6, "escala": 1.1, "color": "#ffd23f" }
"firma": false
```

Para todos los vídeos, en la marca (`node motor/marca.mjs poner firma @micanal`, `poner firma.posicion arriba`). En
`guion.json`, `false` la quita en ese vídeo, un texto pone otra y un objeto sin `texto` solo cambia cómo va la de la
marca. `escala` va de 0,6 a 1,2; `opacidad`, de 0,2 a 1. Con los subtítulos arriba, mejor la firma abajo (y al revés):
juntas se ven apretadas. `ver.mjs` la enseña; `--sin-subtitulos`, tampoco la dibuja.

## Un estilo nuevo

Un archivo en `motor/lib/subtitulos/` que exporta `bloques`, `dibuja` y `zona` (el contrato, en `motor/LEEME.md`),
registrado en `ESTILOS` de `motor/lib/subtitulos.mjs`, con su cuadrado en `motor/muestras/subtitulos.js` y su sección
aquí. `subtitulos/comun.mjs` ya tiene lo difícil: partir la voz en bloques (`trocear`), colocar las palabras en líneas
sin salirse (`disponer`, `cabeEn`), las alturas y anchos de cada posición (`medidas`, `arribaDe`) y una sombra suave
barata (`halo`: un `shadowBlur` grande cuesta diez veces más). Antes de darlo por bueno: míralo palabra a palabra sobre
fondos claros y oscuros de los dos ejemplos, en español y en inglés, mide lo que tarda (pocos ms por fotograma) y
`node motor/pruebas.mjs`.
