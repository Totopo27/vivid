# Cambios

## 2.1.0

Marca blanca, igual en Mac, Windows y Linux, más fácil de ajustar a cada creador y con una página nueva para la clave
de la voz. Los dos ejemplos se siguen dibujando exactamente igual (`node motor/pruebas.mjs`).

### Marca blanca
- Sin avisos de propiedad ni nombres de personas: ni en la configuración, ni en las páginas, ni en las guías. Las fuentes
  de los datos de los ejemplos siguen ahí, sin nombres.
- El nombre del producto, en un solo sitio para el zip (`productName` en `package.json`). Dónde está todo lo que se
  cambia al ponerle nombre o colores propios: `motor/LEEME.md`, «Marca blanca».

### La página de la clave
- Nueva (`motor/clave.html`): los pasos para sacar la clave en ElevenLabs con dibujos de dónde pulsar, los permisos que
  hay que marcar (Text to Speech, Voices y User; lo demás, sin acceso) y lo que pasa con la clave: no se envía a ningún
  servidor, se guarda solo en el ordenador y nunca pasa por el chat. Clara u oscura según el sistema, y en el móvil.
- Más segura: no carga nada de fuera (lo impide su política de seguridad), solo acepta lo que llega de esa misma página
  abierta en el ordenador, la clave se esconde mientras se escribe y nunca se devuelve ni se imprime.
- Arreglado: una clave vieja escrita como `export ELEVENLABS_API_KEY=...` seguía mandando sobre la nueva, y
  `.env.local` no quedaba con permiso 600 si ya existía. Limpia lo que se pega de más (comillas, espacios,
  `ELEVENLABS_API_KEY=` delante).

### El idioma y la voz
- Al escribir «configuración» (o «configurar», «ajustes»...) se pregunta siempre el idioma de los vídeos, aunque ya esté
  configurado, y después se elige la voz.
- **`node motor/voces.mjs`:** una página para escuchar las voces de la cuenta y las de la biblioteca de ElevenLabs en
  el idioma de los vídeos (buscar, filtrar por mujer, hombre o neutra) y elegir una con un clic. Escuchar no gasta. Una
  de la biblioteca se añade sola a la cuenta (o dice cómo hacerlo a mano si la clave no puede). Para la IA, lo mismo
  por órdenes: `lista`, `escuchar`, `usar`.
- La voz elegida es la de los vídeos en ese idioma (`voces.<idioma>` en la marca) y, si no es el español, lee en él.
- `doctor --red` mira que la voz de cada idioma esté en la cuenta: una voz de la biblioteca que no se ha añadido (como
  la de siempre en una cuenta nueva) fallaría al hacer el vídeo. `voz.mjs`, si falla por eso o por el plan, lo dice.
- El permiso de Voices de la clave pasa a «Write» (para añadir voces de la biblioteca).
- `ELEVENLABS_API` para usar otro servidor de ElevenLabs (el de la UE, por ejemplo).

### Mac, Windows y Linux
- ffmpeg se encuentra aunque no esté en el PATH (recién instalado con winget o brew, o con apt, choco o scoop):
  ya no hace falta abrir otra terminal. `doctor` dice dónde está.
- La letra se carga desde sus bytes: en Windows, una carpeta con tildes o símbolos dejaba los subtítulos sin letra.
- `empaqueta.mjs` ya no necesita `unzip` (no lo hay en Windows).
- `node motor/abrir.mjs` abre imágenes, vídeos y páginas en cualquier sistema (también WSL); la página de la clave lo
  usa, y en Windows una ruta con `&` ya no se parte.
- En Mac y Windows, `Ejemplo/alcohol` (con otra mayúscula) escribía hojas dentro de los ejemplos aprobados.
- `.gitattributes`: el texto con saltos LF en todos los sistemas. El render reparte los hilos con
  `availableParallelism` (en algunos Linux `cpus()` llega vacío). `doctor` avisa si en Linux no hay `xdg-open`.

### Cada creador, a su manera
- **`firma`:** su @, su web o su nombre en todos los vídeos, pequeño, donde no lo tapa Instagram ni pisa los subtítulos
  (`poner firma @micanal`, `firma.posicion arriba`). En un vídeo, `"firma": false` la quita. Guía: `guia/subtitulos.md`.
- **`duracion`:** cuánto suelen durar sus vídeos (`poner duracion 20-40`); `comprobar` y la voz avisan con eso, no con
  30-60 fijo.
- `AGENTS.md`: una sección «Personalizar» con todo lo que se puede cambiar, y la firma en las preguntas del principio.
- Cinco pruebas rápidas más (49).

### Otros fallos arreglados
- `revisar.mjs --hasta` (la revisión del hook) avisaba de que cada efecto de después del tramo «cae fuera del vídeo»:
  decenas de líneas que tapaban los avisos de verdad.

## 2.0.0

La misma carpeta, el mismo método y el mismo nivel, con más estilos, más piezas hechas, más fácil de ajustar a cada
creador y con más controles para que el vídeo salga bien a la primera. Los dos ejemplos se dibujan exactamente igual
que en la 1.1.0 (`node motor/pruebas.mjs` lo comprueba fotograma a fotograma).

### Estilos
- **Looks:** el aire de un vídeo entero (colores, fondo, materiales y un acabado sobre cada fotograma): `espacio` (el de
  siempre), `neon`, `papel`, `arcilla`, `cine` y `dia`. Guía: `guia/looks.md`.
- **Subtítulos:** `caja` (los de siempre), `karaoke`, `gigante`, `minimal`, `contorno` y `fondo`, con posición
  (arriba, centro, abajo), escala y colores. Guía: `guia/subtitulos.md`.
- **Formatos de guion:** la pregunta, lo imposible, el mito, la escala, la historia con giro, la comparación, las tres
  rarezas y por dentro, cada uno con sus frases, su plan y un guion de ejemplo. `nuevo.mjs --formato`. Guía:
  `guia/formatos.md`.
- Para probar otro estilo sin tocar nada: `--look` y `--subtitulos` en `ver`, `comprobar`, `revisar` y `render`.

### Piezas nuevas del kit (con sus láminas en `guia/muestras/`)
- **Personas:** poses, siluetas a contraluz, multitudes en plaza, filas o gradas.
- **Ciudad:** edificios 3D, una ciudad entera de día, al anochecer y de noche, su perfil.
- **Agua:** el mar, un lago o una piscina hasta el horizonte, gotas, ondas, salpicaduras, burbujas, chorros, el agua
  que sube.
- **Máquinas:** engranajes, un móvil o un monitor con lo que quieras dentro, botones, interruptores, pilotos, un
  cuentakilómetros de rodillos.
- **Escala:** una cifra gigante, «1 de cada N» alejándose, torres 3D, pilas, cosas de tamaños muy distintos en fila.
- **Mapas:** el globo con los continentes de verdad (Natural Earth, dominio público), chinchetas, rutas, el mapa del
  mundo en relieve y 1.251 ciudades por su nombre.

### Cada creador, a su manera
- **`marca.json`:** idioma, look, subtítulos, voz (una por idioma) y efectos para todos sus vídeos.
  `node motor/marca.mjs` la enseña y la cambia con validación. Cada vídeo puede cambiar cualquier cosa en su guion.
- Los números se escriben como en el idioma del vídeo (`292.201.338` en español, `292,201,338` en inglés).
- La voz puede leer en otro idioma (`codigoIdioma`).

### Para que salga bien
- **`comprobar.mjs`** (y dentro de `revisar.mjs`): lo que no se puede dibujar, lo que no sale igual dos veces, lo
  prohibido en los planos, lo que tarda cada fotograma, el primer segundo quieto, lo gris o apagado, la duración, las
  frases atropelladas y el texto donde lo tapa Instagram.
- **Un fotograma que saldría distinto en otro hilo del render** (algo guardado la primera vez, con el t de ese
  momento) se avisa antes de renderizar.
- **La voz se valida antes de pagarla**, también que la letra de los subtítulos tiene todos los caracteres del guion
  (otros alfabetos o emojis saldrían como cuadraditos). El render final se niega si el guion cambió después de la voz, y rehace solo
  la pista de efectos si cambió.
- **`pruebas.mjs`:** los ejemplos, cada look, cada estilo de subtítulos y cada muestra de las láminas, fotograma a
  fotograma y en dos órdenes; más 44 pruebas rápidas.
- **29 fallos arreglados** en el motor (render que se interrumpe, rutas con espacios o tildes, Windows y Linux,
  argumentos, mensajes de error que dicen qué hacer, la voz, los efectos...). Más:
  - dos siluetas en el mismo fotograma salían mezcladas desde el segundo fotograma de cada hilo;
  - el detector de saltos del render ya no confunde un bloque de subtítulos nuevo con un salto de la imagen.

### Para quien mantiene la carpeta
- `motor/LEEME.md`: cómo está hecho todo, sus contratos y cómo se comprueba.
- `node motor/empaqueta.mjs`: el zip para dar la carpeta a otra persona, sin la clave ni nada de quien la usa.
- Las herramientas ya no escriben dentro de `ejemplo/`: sus hojas van a la carpeta temporal del sistema.
- `GEMINI.md`, para que Gemini lea las instrucciones como Claude (`CLAUDE.md`) y Codex (`AGENTS.md`).
- La lámina del kit (`guia/muestras/kit.jpg`) estaba hecha con una versión antigua del lienzo: ahora es la de verdad.
