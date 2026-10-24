# Los looks

Un look es el aire de un vídeo entero: sus colores, su fondo, cómo son las cosas (su material, sus líneas, sus sombras)
y un acabado que el motor pone encima de cada fotograma ya dibujado, antes de los subtítulos. Mira
`guia/muestras/looks.jpg`: cada look con piezas del kit, con sus propios materiales y de cerca, con su acabado y un
subtítulo encima.

## Cuál

| Look | Cómo se ve | Para |
|---|---|---|
| `espacio` | Negro azulado profundo con nebulosa y estrellas; las luces se suman. Sin acabado. | El espacio, la ciencia, la noche. |
| `neon` | Noche violeta, tubos de neón magenta y cian, suelo de rejilla que se pierde en la niebla; lo que brilla se desborda. | La fiesta, la ciudad de noche, la tecnología, los juegos, el futuro. |
| `papel` | Ilustración moderna impresa: colores planos y cálidos, contorno de tinta, sombras planas, grano de impresión y el relieve del papel. | La historia, la cultura, la salud, el dinero, cómo funciona algo. |
| `arcilla` | Plastilina en un estudio pequeño: pastel vivo, luz grande y difusa, bordes redondos, sombras de contacto. | La comida, el cuerpo por dentro, los animales, la vida diaria. |
| `cine` | Fotograma de película: mucho negro, sombras verde azuladas, luz de ámbar, rayos con polvo, grano y viñeta. | El misterio, la historia de verdad, el crimen, la tensión, lo épico. |
| `dia` | Día de sol: cielo azul intenso, bruma cálida en el horizonte, nubes que pasan, sombras azules. | La naturaleza, los viajes, el deporte, lo que pasa fuera de casa. |

- **Uno por vídeo,** en `guion.json` (`"look": "neon"`); si no lo dice, el de la marca, y si no, `espacio`. El hook
  también va en el look del vídeo: puede ser otro sitio, no otro aire.
- **Se elige por el tema y por lo que se siente,** no por lo que se sabe dibujar: un crimen va en `cine` aunque pase de
  día; una receta, en `arcilla` o en `papel`.
- **Con los claros (`papel`, `arcilla`, `dia`), subtítulos que se leen sobre lo claro:** `karaoke`, `contorno` o
  `fondo`. Nunca `caja` ni `minimal`: dejan las palabras ya dichas en gris, y el gris no se ve sobre un cielo o un papel
  (`comprobar.mjs` lo avisa).
- **Para probar uno sin tocar el guion:** `node motor/ver.mjs <proyecto> 12.4 --look neon` (también `revisar.mjs` y
  `render.mjs`).

## Cómo se dibuja en un look

Los planos se hacen igual en todos (`guia/dibujar.md`). Lo que cambia se pide al look del vídeo, y así el mismo plano
sirve en cualquiera:

```js
const C = k.look().colores;                       // fondo, tinta, acentos (lo que importa, en orden), luz, sombra: "r,g,b"
k.fondoDelLook(g, t, cam);                        // su fondo, con profundidad; se mueve un poco con la cámara
k.sombraDelLook(g, 540, 1380, 520);               // la sombra en el suelo de lo que va encima (x, y, ancho)
g.beginPath(); g.arc(540, 1100, 260, 0, Math.PI * 2);
k.materialDelLook(g, 280, 840, 800, 1360, C.acentos[0]);           // el camino, con la luz, la sombra y la textura del look
g.beginPath(); g.moveTo(120, 620); g.quadraticCurveTo(540, 480, 960, 620);
k.trazoDelLook(g, 12, C.acentos[1]);              // una línea como las del look (tubo de neón, tinta, churro de arcilla...)
```

- `k.materialDelLook(g, x0, y0, x1, y1, tono, lx, ly)`: rellena el camino actual. `x0..y1`, la caja que ocupa;
  `tono`, su color; `lx, ly`, de dónde viene la luz en la pantalla (si no se dice, de arriba a la izquierda). El camino
  sigue ahí para un trazo encima.
- `k.trazoDelLook(g, ancho, tono, al)`: pinta el camino actual con la línea del look.
- `k.sombraDelLook(g, x, y, ancho, al)`: la sombra de algo apoyado en el suelo, centrada en `(x, y)`.
- `k.lineaDeLuz(g, ancho, tono, al, k)`: en cualquier look, el camino actual como una línea encendida que se suma, con
  su halo hasta `k` veces más ancho (una órbita, un rayo, el borde de algo que brilla). Sobre lo claro, poca `al`.
- `k.fondoDelLook(g, t, cam)` es un punto de partida: para un sitio concreto (una cocina, una vena) dibuja el tuyo con
  los colores del look, con la misma luz.
- **El acabado lo pone el motor:** no añadas grano, viñeta ni resplandor propios, y mira siempre los fotogramas con
  `ver.mjs`, que ya lo lleva puesto.
- Los consejos de cada look, abajo, están también en `k.look().consejos`.

## Cada look

### espacio
El de siempre, el de los dos ejemplos. Sin acabado: lo que dibuja el plano es lo que se ve.
- El fondo, siempre `k.fondo` + `k.estrellas`: negro azulado con nebulosa, nunca un negro plano.
- La luz se suma (`"lighter"`): `k.brillo`, `k.haz`, `k.fogonazo`, `k.estallido`; los colores de `k.COLORES`, vivos sobre lo
  oscuro.
- Las cosas, con el kit de siempre (`k.estrella`, `k.planeta`, `k.tierra`, `k.roca`) o con `k.materialDelLook`: un lado
  iluminado y el otro casi negro.
- Las órbitas y trayectorias, líneas de luz finas (`k.trazoDelLook`).

### neon
**El acabado:** lo que brilla se desborda (un halo fino y otro ancho), lo negro se llena de una bruma violeta y los
bordes se apagan hacia el violeta.
- Todo pasa de noche: lo que no es luz es casi negro (violeta o azul muy oscuro); la luz viene de los tubos, las
  pantallas y los bordes.
- Los objetos, oscuros y brillantes: `k.materialDelLook` les da el cuerpo oscuro, el reflejo del otro color y el borde
  encendido. Nunca un relleno claro y plano.
- Las líneas, los contornos y las flechas son tubos de neón (`k.trazoDelLook`).
- Dos colores mandan, magenta y cian; el amarillo o el verde ácido, para una sola cosa que importa.
- `k.brillo`, `k.haz` y `k.fogonazo` van muy bien, pero no todos al máximo: el resplandor quema la pantalla a blanco.
- Nada grande y blanco (una superficie, un papel): se vuelve una mancha que deslumbra.

### papel
**El acabado:** todo queda impreso en papel crema: su moteado, su fibra, los bordes un poco tostados y el relieve de
la hoja, que también se ve en la tinta oscura. El papel no se mueve.
- Cada cosa, de un color plano de `colores.acentos` con su sombra plana (`k.materialDelLook`: una media luna de un tono
  más oscuro, un brillo plano y el contorno de tinta). Nunca un degradado fotográfico.
- Todo lleva contorno de tinta; las líneas sueltas, de tinta también (`k.trazoDelLook`), del mismo grosor para lo del
  mismo tamaño.
- Las sombras en el suelo, manchas planas de tinta sin desenfoque (`k.sombraDelLook`).
- La luz se dibuja como forma (un círculo claro, rayos de papel recortado), no como brillo: `k.brillo` y `"lighter"`
  grandes dejan un agujero blanco.
- Las piezas fotográficas del kit (`k.roca`, `k.estrella`, `k.planeta`, `k.superficie`) no pegan: dibuja la forma con un
  camino y rellénala con `k.materialDelLook`.
- Detrás del subtítulo, un color medio u oscuro (el cielo del fondo ya lo es): sobre el crema no se lee.

### arcilla
**El acabado:** lo claro suelta una bruma suave y cálida, como un filtro de difusión, y los bordes se oscurecen un poco
(más por donde va el subtítulo).
- Cada cosa es un objeto de plastilina: formas redondas y gordas, sin aristas ni líneas finas (`k.redondo`, arcos,
  curvas), rellenas con `k.materialDelLook` (luz blanda, el borde que se redondea, las huellas de los dedos).
- Las líneas, los cables y las flechas son churros de arcilla (`k.trazoDelLook`), de 14 px o más.
- Todo lo que toca el suelo lleva su sombra de contacto (`k.sombraDelLook`); lo que flota, una más ancha y clara.
- Pastel pero vivo, cada cosa de un color. La pared es azul lavanda y el suelo cálido: lo que importa, en coral,
  mantequilla o menta (el azul y el lila se pierden en la pared).
- Nada de brillos duros, rayos ni destellos: la luz es grande y blanda.
- Lo que se mueve a mano puede ir a saltitos, como la animación fotograma a fotograma: `Math.floor(t * 12) / 12`.

### cine
**El acabado:** sube el contraste, las sombras se van al verde azulado y las luces al ámbar, la viñeta apaga los
bordes y encima va un grano fino, distinto en cada fotograma.
- Una luz principal cálida de un lado y el otro en sombra: nunca todo iluminado por igual. Con el fondo del look, la luz
  entra por arriba a la derecha: `k.materialDelLook(..., 0.6, -0.8)`.
- Mucho negro: lo importante sale de la sombra con su luz. Un objeto a contraluz, con su borde de luz, se ve de película.
- Los rayos en un aire con polvo (el fondo del look, `k.rayos`) y los brillos cálidos (`k.brillo` con `"255,190,120"`).
- Los materiales de verdad del kit (`k.roca`, `k.metal`, `k.vidrio`, `k.planeta`) encajan: el acabado ya los pasa al color
  de la película.
- Ámbar y verde azulado; el rojo, solo para lo que importa (sangre, peligro, la cifra).
- Nada pastel, plano ni claro de fondo: la viñeta y el contraste lo ensucian.

### dia
**El acabado:** lo claro suelta una bruma de sol cálida y ancha, y los bordes se tiñen apenas del azul del cielo (un
poco más donde va el subtítulo).
- La luz es la del sol: cálida por un lado y la sombra azul del cielo al otro. Con el fondo del look, el sol está arriba a
  la derecha: `k.materialDelLook(..., 0.6, -0.8)`.
- Colores limpios y muy saturados: un objeto rojo, una toalla turquesa, una fruta amarilla. Si algo es gris, lo de
  alrededor lleva el color.
- Las sombras en el suelo, azules y bastante nítidas (`k.sombraDelLook`).
- Lo lejano se pierde en la bruma: más claro y más azul cuanto más lejos (mezcla su color con `colores.fondo`).
- Detrás del subtítulo, el cielo azul intenso: nada de nubes blancas ni cosas claras ahí.
- Los brillos, suaves: con tanto claro, `"lighter"` lo quema a blanco; mejor `"screen"` y poca transparencia.

## Un look nuevo

Para quien amplía la carpeta. Un archivo en `motor/kit/looks/<nombre>.js` (contrato en `motor/LEEME.md`, «Un look»)
con `nombre`, `descripcion`, `colores`, `fondo`, `acabado`, `material`, `trazo`, `sombra` y `consejos`, registrado en
`LOOKS` de `looks/index.js`, con su fila arriba y su sitio en la lámina (`node motor/muestras.mjs looks`).
- `looks/pasos.js` tiene lo que comparten: `resplandor` (lo que brilla se desborda), `grano`, `vineta` y `ponCapa` (capas
  de 1080 × 1920 hechas una vez), `neblina`, `lineaDeLuz` y los colores (`rgb`, `rgba`, `mezcla`, `aclara`).
- El acabado, como mucho unos 8 ms por fotograma: cada pasada de pantalla entera cuesta 1-2 ms, y escalar una imagen
  a pantalla entera, unos 6 (por eso el resplandor sube con vecino más cercano desde un tercio del tamaño). Nada de
  `g.filter` en pantalla entera (8-15 ms) ni de `createPattern` (40 ms).
- Lo pesado (telones, texturas, capas), con `una(...)`: se hace la primera vez que se usa, no al cargar el kit.
- Todo sale de `t` y del azar con semilla (el grano, con `Math.floor(t * 60)`), y lo que deja en `g` como estaba.
