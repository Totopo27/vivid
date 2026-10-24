# Cómo se hace un vídeo

Lo que sale de esta carpeta: un reel vertical de 30 a 60 s (o lo que diga la marca: `duracion`) en el que una voz cuenta algo sorprendente, y en la
pantalla se ve, dibujado y moviéndose con cada palabra, lo que dice. Nada de esquemas quietos con etiquetas: la cosa de
verdad, grande, con luz y volumen, haciendo lo que dice la voz. Llamativo, rápido, fácil de entender y entretenido
para alguien que está pasando vídeos en Instagram.

El nivel es el de los dos ejemplos, hechos con estos pasos:
- `ejemplo/estrella-verde/`: una cosa imposible (una estrella verde) y su historia, en un mundo por el que viaja la
  cámara.
- `ejemplo/alcohol/`: una pregunta («¿por qué no te acuerdas?»), sin una cosa famosa que enseñar: cada idea tiene su
  propia escena, con cosas de casa.

**Antes del primer vídeo de una conversación,** lee este método entero y también `guia/guion.md`, `guia/formatos.md`,
`guia/dibujar.md`, `guia/looks.md`, `guia/subtitulos.md` y `guia/sonido.md`. Mira las láminas de `guia/muestras/` (lo que
ya está dibujado: el kit, sus piezas, los looks y los subtítulos) y los ejemplos:
- el `plan.md` y las `notas.md` de los dos;
- los planos (`video/planos/*.js`) del que más se parezca a tu vídeo;
- sus hojas, ya hechas: `ejemplo/*/revisar/frases.jpg`, `planos.jpg` y `corte-2.jpg`. Míralas.

Los ejemplos son para ver el nivel y cómo se construye. Sus imágenes son de su tema y no se copian a otro: ni la
estrella, ni el túnel de luces, ni la película de la memoria.

Tómate el tiempo que haga falta. Cada ejemplo llevó unas dos horas y muchas rondas de mirar y arreglar. Lo que los hace
buenos es la revisión en movimiento, no el primer intento.

## 1. La idea y los datos

1. Elige el formato con lo que ya sabes de la idea (`guia/formatos.md`, «Cuál»): la pregunta, lo imposible, el mito, la
   escala, la historia, la comparación, las tres rarezas o por dentro.
2. `node motor/nuevo.mjs "<la idea>" --formato <nombre>` crea la carpeta del vídeo en `proyectos/`, con las frases del
   formato (cada una con su `papel`: lo que hace en la historia) y su plan. El idioma sale de la marca.
3. Busca el tema en la web y lee la fuente de verdad (el estudio, la nota de prensa, la página oficial). No te quedes
   en un resumen.
4. En `idea.md`, apunta cada dato con su fuente. Busca cinco cosas:
   - **Lo sorprendente:** lo que parece imposible o contradice lo que todo el mundo cree (la estrella que es verde).
   - **La regla que rompe:** por qué no debería pasar (las estrellas son rojas, amarillas, blancas o azules).
   - **El mecanismo paso a paso:** cada causa con su efecto, en orden (se murió → sus planetas se rompieron → cayeron
     sobre ella → llevaban sodio → su aire tan espeso hace que el sodio se coma el naranja → sin naranja, verde).
   - **Las cifras** con algo que se sienta (4.000 °C, a 280 años luz).
   - **Dos o tres comparaciones con cosas de casa:** del tamaño de la Tierra, pesa como medio Sol, lo mismo que tienes
     en el salero, espeso como el agua. Son las imágenes que mejor se entienden.
5. Lo que cuenta el vídeo, en una frase. Todo lo que no sirva a esa frase sobra. Si con los datos encaja mejor otro
   formato, cámbialo ahora: las frases del formato son una guía, no una jaula.

## 2. El guion, escrito para el ojo

Lee `guia/guion.md` y, en `guia/formatos.md`, el formato que elegiste. Escribe en el idioma de los vídeos del creador
(`preferencias.md`). Lo esencial:
- **El hook:** dos o tres frases cortas, unos 8-10 s.
  - La primera dice de qué va el vídeo, como lo diría la gente: la pregunta que el vídeo contesta («¿Por qué...?») o
    lo sorprendente sin rodeos («¿Sabías que...?», «Esta estrella es verde, y no debería existir»), con el nombre de
    la cosa. Nunca una escena que solo lo insinúa ni una cifra suelta delante. Si el creador pidió el vídeo con una
    pregunta, esa pregunta, dicha como la diría quien mira, suele ser el hook.
  - Se ve en su momento más espectacular desde el fotograma 0.
  - Luego, si hace falta, la regla que rompe, demostrada, y la pregunta que deja abierta («¿Qué le ha pasado a
    esta?»).
- **El cuerpo:** cada frase es algo que pasa o una comparación con algo de casa. Si una frase no se puede enseñar
  pasando, se reescribe.
- **La imagen se piensa a la vez que la frase,** no después: al escribir «una bola del tamaño de la Tierra» ya sabes que
  la Tierra va a llegar a su lado.
- **El remate** da la vuelta al hook («no es verde de nacimiento: es verde por lo que se comió»).
- **El cierre** es el del creador (`preferencias.md`), tal cual. Si no quiere cierre, se quita esa frase: el remate es la
  última y su imagen enlaza con el primer fotograma.
- **Una palabra clave por frase** (la que se marca en el subtítulo).
- **Lo que se ve necesita su tiempo:**
  - una lista, de tres o cuatro cosas como mucho;
  - una comparación que pasa en otro sitio (la cocina), con su frase entera (2 s o más);
  - nada que la voz diga más rápido de lo que se puede enseñar.
- `guion.json`: `frases`, cada una con `texto`, `clave` y `hook: true` las del hook. `dicho` solo si se lee distinto de
  como se dice («IA» → «i a»; las cifras, con letras: «292 million» → «two hundred ninety two million»). El `papel` que
  trae el formato se puede dejar: la voz no lo lee.

### El estilo: el look y los subtítulos

- **El look** es el aire del vídeo entero (`guia/looks.md`): `espacio`, `neon`, `papel`, `arcilla`, `cine` o `dia`. Si la
  marca fija uno (`node motor/marca.mjs`), ese; si no, elígelo por el tema y por lo que tiene que sentir quien mira, y
  ponlo en `guion.json` (`"look": "cine"`).
- **Los subtítulos** (`guia/subtitulos.md`): `caja`, `karaoke`, `gigante`, `minimal`, `contorno` o `fondo`. Lo mismo: los
  de la marca, o los que pida el vídeo (`"subtitulos": { "estilo": "gigante" }`). Con un look claro (`papel`, `arcilla`,
  `dia`), nunca `caja` ni `minimal`: sus palabras ya dichas, en gris, no se leen sobre fondos claros.
- Se deciden antes de dibujar: los planos usan los colores, el fondo y los materiales del look, y dejan libre el sitio de
  los subtítulos. Para comparar sin tocar el guion: `node motor/ver.mjs <proyecto> 4.5 --look neon --subtitulos
  karaoke`.

## 3. La voz

`node motor/voz.mjs <proyecto>`. Antes de pedir la voz comprueba el guion; si algo está mal, lo dice y no gasta nada.
- Sale de una sola toma, como habla una persona, y nunca se corta ni se le quitan pausas: recortar la voz por los
  tiempos que da el proveedor se come trozos de palabras.
- Imprime cada frase con el segundo de cada palabra: con eso se planea.
- Si una frase suena rara, va lenta o se atropella, se cambia la frase (otras palabras, otra puntuación) y se rehace la
  voz. Nunca se corta ni se acelera el audio.

## 4. El plan: los sitios, los planos y cómo se pasa de uno a otro

Escribe `plan.md` antes de dibujar nada (los de los ejemplos son el modelo).

- **Los sitios.** Uno por cada cosa de la que habla la voz. Mientras la voz sigue con esa cosa, la cámara viaja por su
  sitio (el cielo con la estrella; el sistema de la estrella muerta); cuando pasa a otra, otro sitio (la cocina del
  salero). Un tema con muchas cosas (la fiesta, la sangre, las neuronas, el móvil lleno) lleva muchos sitios.
- **Un plano es un sitio con una cámara.** Dentro de un plano no hay cortes: la cámara va de una cosa a la siguiente con
  la voz. La muerte de la estrella, la Tierra al lado, el medio Sol, los planetas que se rompen y la roca que estalla
  son un solo plano de 17 s.
- **Frase a frase, una fila:**
  - lo que se ve de su primera palabra a la última (qué hace la cosa grande todo el rato, no solo en su palabra);
  - la palabra en la que pasa lo más fuerte;
  - adónde va la cámara;
  - cómo pasa a la siguiente: sigue, o corte en «tal palabra».
- Leyendo solo «lo que se ve», alguien tendría que poder contar el vídeo.

**Lo que se ve.** Estas reglas salen de lo que se vio mal en las pruebas de esta carpeta:
1. **Se ve lo que dice la frase:** las cosas y las acciones que nombra. Dice «bailaste»: se baila; dice «bebes»: el
   vaso. El sitio del mecanismo (el cerebro, las neuronas) llega cuando la voz habla de él, no antes.
2. **Una idea nueva, una imagen nueva.** Cuando la voz pasa a otra idea, cambia lo que se ve: llega algo nuevo, la cosa
   se transforma o se corta a su sitio. La misma imagen durante varias ideas, no.
3. **Cada idea es una escena entera y grande.** Nunca un fondo con dibujitos encima (un cerebro con fotos, iconos o
   emojis).
4. **Cada imagen se entiende sin saber nada.** Si para entenderla hace falta algo que el vídeo no dice (que el
   hipocampo tiene forma de caballito de mar), es la imagen equivocada: se enseña lo que hace, no a qué se parece su
   nombre.
5. **Con color:** colores vivos y luz. Nada gris ni apagado; si la cosa es gris (un tablero), lo de alrededor lleva el
   color.

**Los cambios de plano.** Estas reglas salen de lo que se vio mal en las pruebas de esta carpeta:
1. **Si la voz sigue con la misma cosa o en el mismo sitio, no se corta: se mueve la cámara.** Se aleja, se acerca, gira
   o baja con algo que cae. Un corte entre dos encuadres del mismo sitio se ve como un salto raro, «sin transición».
   Si algo de una comparación (la Tierra al lado de la bolita) ya no hace falta, se va de la imagen mientras la cámara
   se mueve.
2. **Se corta solo para ir a otro sitio, en la palabra que lo trae.** Puede ser dentro de una frase (la cocina entra
   en «mismo»: «lo mismo que tienes en el salero»).
   **Otro tiempo de la misma cosa (su pasado, cómo era al nacer) no es otro sitio: no se corta.** La cosa cambia delante
   de la cámara: vuelve atrás girando al revés, cambia de color y de tamaño. Un corte de la estrella verde a la amarilla
   que fue se ve como si apareciera otra de repente («roto», «en mitad de la frase»). Y si la voz no deja pausa (una
   pregunta y su respuesta seguidas), la imagen tampoco corta.
3. **Antes de un corte, lo que pasaba ha terminado y la imagen reposa un momento** (unos 0,15-0,3 s). Nada se corta a
   medio caer, a medio estallar, a medio echar sal ni con la cámara en marcha: eso se ve como un corte con fallos.
   Si la acción no cabe, se empieza antes, se hace más corta o se corta en una palabra más tarde.
4. **Un plano nuevo dura al menos 1,5 s, y su acción empieza y acaba dentro de él.** Si la voz no da ese tiempo, esa
   imagen va dentro del plano de antes o se le da su frase.
5. **Lo que la voz nombra se ve entero, y casi quieto, al menos medio segundo.** En una lista rápida («rojas,
   amarillas, blancas o azules»), cada cosa llega, frena y se queda; se van sumando y no pasan de largo.
6. **El primer fotograma de cada plano ya enseña lo que es** (en la cocina, el fuego encendido y el salero entrando).
7. **Lo que brilla, late o cae no cruza un corte:** acaba antes.

## 5. El hook primero, y enséñalo

Tenemos un segundo para que alguien no pase de largo. Por eso el hook se piensa antes de dibujarlo, y se hacen dos.

1. **Dos ideas de primer segundo, cada una en una línea:** lo que se ve del fotograma 0 al segundo 1. En ese segundo
   pasa algo grande que llena la pantalla: la cámara viaja deprisa entre cosas enormes, algo se inunda, choca, estalla
   o se revela. Si una línea dice «una imagen quieta», «un número que corre» o «la cámara se acerca despacio», cambia
   la idea antes de dibujarla: no la pules.
   - **Si el tema es una pregunta, se ve la pregunta pasando, exagerada.** Así fueron los que se aprobaron en las
     pruebas: salir del sistema solar → sales disparado de la Tierra, pasas Júpiter y Saturno y chocas contra un muro
     invisible; fregar a mano gasta más agua → la pantalla se inunda bajo un grifo enorme; beber y no acordarse → un
     túnel de luces de discoteca y un vaso que rebosa.
   - **Si lo sorprendente se puede comprobar, se comprueba ya, como una acción:** se quitan las rayas y las tres bolas
     son del mismo color; la casilla se levanta, vuela junto a la otra y son iguales.
   - **El hook puede ser de otro estilo que el resto:** otro sitio, más exagerado, si luego enlaza con el vídeo.
   - **Nada que parpadee o cambie de color a saltos:** parece un fallo.
2. Haz `video/mundo.js` (lo que comparten los planos) y los planos del hook (`video/planos/01-...js`), con la primera
   idea. La segunda va en `video/aperturas/`, con el número del plano al que sustituye (`video/aperturas/01-tunel.js`
   en lugar de `video/planos/01-fiesta.js`). Mira cómo en `guia/dibujar.md`.
3. Revísalas (paso 7) hasta que estén al nivel del hook de los ejemplos: grande, moviéndose desde el fotograma 0, la
   cosa en su mejor momento. Con `--apertura 01-tunel`, `ver.mjs` enseña la segunda.
4. `node motor/render.mjs <proyecto> --borrador --hasta <final del hook + 1 s>` hace `revisar/borrador.mp4` (los renders
   tardan minutos: lánzalos en segundo plano o con un tiempo de espera largo, para que no se corten), y con
   `--apertura 01-tunel`, `revisar/borrador-01-tunel.mp4`.
5. Enséñale al creador los dos vídeos (`node motor/abrir.mjs <vídeo>` se los abre) y el guion entero en texto, en un
   solo mensaje corto, y pregúntale cuál. La que
   elija se queda en `video/planos/` (la otra, fuera). Si no le convence ninguna, se rehacen juntas las palabras y la
   imagen de lo que diga.

## 6. Dibujar el resto

Un plano detrás de otro. Cada uno se hace, se revisa y se arregla antes de empezar el siguiente. Cómo se dibuja (el
kit, la cámara, la luz, los materiales), en `guia/dibujar.md`; cómo se dibuja en el look del vídeo, en `guia/looks.md`.
Antes de dibujar algo a mano, mira si ya está en las láminas de `guia/muestras/` (personas, ciudades, agua, máquinas,
cifras y comparaciones de escala, el globo...). Lo que no puede faltar:
- **grande:** la cosa llena media pantalla o más;
- **con luz y volumen:** brillos, sombras, textura, profundidad;
- **en movimiento todo el tiempo,** siempre por lo que dice la voz.

## 7. Revisar en movimiento (lo que más cuenta)

- **Cada vez que cambies algo, míralo:**
  - `node motor/ver.mjs <proyecto> frase 5`
  - `... palabra sodio`
  - `... corte 2`
  - `... 24-27 --fps 10`
  Tarda segundos. Abre siempre la imagen que te da. Lo que no has mirado, no está revisado.
- **Al acabar cada plano y al final,** `node motor/revisar.mjs <proyecto>`. Mira enteras `revisar/frases.jpg` y
  `revisar/cortes.jpg`, y lee sus avisos (`node motor/comprobar.mjs <proyecto>` hace solo las comprobaciones, más
  deprisa):
  - un corte que llega con lo de antes en movimiento;
  - dos planos que se parecen;
  - un plano demasiado corto;
  - segundos casi quietos;
  - el subtítulo sobre un fondo blanco;
  - huecos sin sonido;
  - un fotograma que no se puede dibujar o que no sale igual dos veces (el render fallaría o saldría con saltos);
  - el primer segundo casi quieto;
  - más de 2 s grises o a oscuras;
  - una frase dicha demasiado deprisa;
  - texto donde lo tapa Instagram.
  Son dónde mirar, no una nota: arregla lo que veas mal, no el número.
- **Lo que hay que buscar,** porque ya ha fallado otras veces:
  - un material que no parece lo que es (una estrella con la textura oscura parece una roca);
  - algo que salta de un fotograma al siguiente (al empezar o acabar un movimiento, al cambiar de plano);
  - algo importante cortado por el borde de la pantalla en su momento;
  - más de un segundo seguido en que no cambia nada, salvo el respiro de lo que remata;
  - estelas o rayos tan largos que parecen láseres;
  - algo grande tapando el subtítulo (dónde va cada estilo, en `guia/subtitulos.md`);
  - una escena gris o plana, como una pared;
  - algo que aparece de golpe con una textura distinta (dibújalo aparte y hazlo aparecer entero);
  - un brillo o un latido que sigue encendido cuando cambia el plano;
  - texto que dura menos de medio segundo o que no se lee en un móvil.
- **Una pasada como alguien que pasa de largo:** ¿en qué segundo me iría? Ahí falta algo que pase con la voz.
- **Antes de enseñarlo entero, piensa qué cambiarías para que entretenga más o sea más visual, y hazlo.** Estas cuatro
  preguntas mejoraron un vídeo de las pruebas:
  - ¿El final enlaza con el principio? Que el último fotograma lleve al primero, y se vea dos veces sin notarlo.
  - ¿Hay un segundo «¡hala!» a mitad, justo cuando la gente empieza a irse?
  - ¿Alguna parte parece una clase (una cosa partida en dos con rótulos, un esquema)? Que pasen cosas en su lugar.
  - ¿Lo que se dice se comprueba en la imagen? Dice «aleja el móvil»: se ve lo pequeño al lado de lo grande.

## 8. El sonido

Si el creador quiere efectos (pregúntalo una vez y apúntalo en `preferencias.md`): lee `guia/sonido.md`, escribe
`sonidos.js` y lanza `node motor/sonido.mjs <proyecto>`.
- Cada sonido va en lo que se mueve, en su fotograma.
- No hay huecos de más de 2 s ni ningún sonido en un corte.
- Los momentos se sacan de los propios planos (cuándo choca cada roca), no se copian a mano.

## 9. El render y la entrega

1. `node motor/render.mjs <proyecto>` (en segundo plano o con un tiempo de espera largo: tarda unos minutos) deja el
   vídeo en `salida/<proyecto>/`, con `portada.jpg` y `caption.txt`
   (de `pie.txt`: dos líneas para el post, la primera engancha). Si el guion cambió después de hacer la voz, no
   renderiza: rehaz la voz. Si cambiaron los efectos o los planos, rehace sola la pista de efectos.
2. Mira los saltos que diga, con `ver.mjs`: o son un fogonazo o un choque buscado, o se arreglan.
3. Mira la portada.
4. Al creador: el vídeo (ábreselo con `node motor/abrir.mjs salida/<proyecto>/<proyecto>.mp4`) y una o dos líneas.
   Nada de cómo se hace por dentro.

En `notas.md` del proyecto, en pocas líneas: lo que se hizo, lo que se arregló y por qué.
