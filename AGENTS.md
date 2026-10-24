# Videos-virales-3d

Esta carpeta hace vídeos virales 3D, en el ordenador de quien la abre, con la IA que la está leyendo. Le
das una idea («hazme un vídeo de por qué el cielo es azul») y sale el vídeo, listo para publicar. Nada se publica solo.

El nivel es el de los ejemplos: `ejemplo/estrella-verde/estrella-verde.mp4` y `ejemplo/alcohol/alcohol.mp4`.

## Al abrir la carpeta

- **«Configuración», «configurar», «configúrame», «ajustes», «set me up», «settings» o es la primera vez:**
  1. `node motor/doctor.mjs`, e instala tú lo que falte (`npm install` en esta carpeta, ffmpeg, Node).
  2. Si no hay clave de voz, `node motor/clave.mjs` en segundo plano (espera hasta 10 minutos a que el creador la pegue
     en la página que abre, que le explica cómo sacarla y qué permisos marcar). Si no se abre sola, dale la dirección
     que imprime. Después, `node motor/doctor.mjs --red`: comprueba gratis que la clave vale.
  3. Pregunta en un solo mensaje. **Siempre, el idioma de sus vídeos**, lo primero (aunque ya esté configurado: dile
     cuál hay ahora, `node motor/marca.mjs`, y si lo quiere cambiar). Si no existe `preferencias.md`, en el mismo
     mensaje:
     - para quién son sus vídeos;
     - cómo quiere cerrarlos (por ejemplo «Envíaselo a ese amigo que...», o sin cierre);
     - si quiere efectos de sonido;
     - si quiere su @ o su web en todos los vídeos (la firma), o nada;
     - si quiere un estilo fijo para todos sus vídeos o que lo elijas tú según el tema. Ábrele las láminas para que vea
       qué hay: `node motor/abrir.mjs guia/muestras/looks.jpg guia/muestras/subtitulos.jpg`.

     El idioma, a la marca con su código (`node motor/marca.mjs poner idioma en`: es, en, pt-BR, fr...). Lo demás, a
     `preferencias.md` con sus palabras, y lo que sea un ajuste también a la marca: los efectos (`poner efectos no`),
     la firma (`poner firma @micanal`) y, si quiere uno fijo, el look y los subtítulos (`poner look neon`, `poner
     subtitulos karaoke`). Los subtítulos son de alfabeto latino (español, inglés, portugués, francés, alemán,
     italiano...): para otros alfabetos hace falta antes otra letra en `letra/`, y eso es cambiar la carpeta.
  4. **La voz**, siempre después del idioma: `node motor/voces.mjs` en segundo plano le abre una página para escuchar
     las voces de su cuenta y las de la biblioteca de ElevenLabs en su idioma, y elegir una con un clic (espera hasta 15
     minutos). Si prefiere decírtelo en el chat («una voz de mujer joven y cercana»), búscalas con `node motor/voces.mjs
     lista --genero mujer --buscar cercana` (y `--biblioteca` para las de ElevenLabs), ábrele las muestras de dos o tres
     con `escuchar` y pon la que elija con `usar`. La voz elegida es la de sus vídeos en ese idioma, y ya lee en él.
     Luego, `node motor/doctor.mjs --red`: la voz tiene que estar en su cuenta.
  5. Dile en una línea que ya puede pedir un vídeo.
- **Cualquier petición de vídeo, reel, guion o ideas para vídeos:** lee `METODO.md` entero y síguelo paso a paso. Lee
  las guías que dice (`guia/`) antes de empezar.
- **Otra voz («cámbiame la voz», «quiero una voz de mujer»):** como en el paso 4 de la configuración
  (`node motor/voces.mjs`). Para otro idioma, `--idioma en`.
- **Personalizar («cámbiame el estilo», «a partir de ahora en neón», «pon mi @», «los quiero de 20 segundos»):**
  `node motor/marca.mjs` enseña la marca y lo que hay para elegir, y `poner` / `quitar` la cambian para todos los vídeos
  (comprueba antes que vale). Para uno solo, el mismo campo en su `guion.json`, que manda sobre la marca. Se puede
  cambiar:
  - el idioma (`idioma`) y la voz: cuál, con `node motor/voces.mjs`; cómo habla, con `voz.velocidad`, `voz.estabilidad`...
    (una voz por idioma en `voces.<idioma>`);
  - el look (`look`) y los subtítulos (`subtitulos`: estilo, posición, `escala`, `colores`, `mayusculas`);
  - la firma, su @ o su web en todos los vídeos (`firma`, con `firma.posicion` abajo o arriba);
  - cuánto duran los vídeos (`duracion 20-40`) y si llevan efectos (`efectos`).

  El cierre y lo demás que no es un ajuste (el tono, el público, lo que nunca quiere) va a `preferencias.md`.
- **«Doctor» o algo se rompe:** `node motor/doctor.mjs` y arregla lo que diga.
- **Cambiar la carpeta en sí** (un look nuevo, una pieza para el kit, un arreglo del motor), no un vídeo: lee
  `motor/LEEME.md` entero. Después de cada cambio, `node motor/pruebas.mjs` tiene que decir «Todo igual que las
  referencias».

## La carpeta

```
METODO.md        cómo se hace un vídeo, paso a paso (léelo entero antes de cada vídeo)
guia/            el guion, los formatos, el dibujo, los looks, los subtítulos y el sonido
guia/muestras/   láminas con lo que ya está hecho: el kit, sus piezas, los looks y los subtítulos
motor/           las herramientas (cada una dice cómo se usa con --ayuda), el kit de dibujo (motor/kit/) y
                 cómo está hecho todo (motor/LEEME.md)
sonidos/         los efectos aprobados (sonidos/LEEME.md)
ejemplo/         dos vídeos hechos con este método, enteros: para ver el nivel y cómo se construyen
pruebas/         las imágenes con que se comprueba que el motor sigue dibujando los ejemplos igual
proyectos/       un vídeo por carpeta
salida/          los vídeos terminados, con su portada y el texto del post
preferencias.md  lo que vale para todos sus vídeos, con sus palabras
marca.json       los ajustes de todos sus vídeos (idioma, look, subtítulos, voz, firma, duración, efectos):
                 node motor/marca.mjs
.env.local       la clave de la voz; nunca se enseña ni se comparte
```

## Reglas

- Nunca pidas una clave en el chat: `node motor/clave.mjs`.
- **Nunca le pidas al creador que ejecute un comando:** tienes una terminal en su ordenador.
  - Instalar Node, ffmpeg o lo de `npm install` es trabajo tuyo.
  - Lo único suyo es escribir una contraseña o dar un permiso que el sistema no deja dar a nadie más.
  - Si algo falla por la máquina, arréglalo sin bajar la calidad y apúntalo en `maquina.md`.
  - Lo recién instalado (con winget en Windows, con brew en Mac) no está en el PATH de la terminal que ya estaba
    abierta. ffmpeg, el motor lo encuentra igual (doctor dice dónde); si es Node lo que no se ve, pídele que cierre y
    vuelva a abrir la app (es lo único que no puedes hacer tú).
  - Lo que tarda minutos (el render, la página de la clave), en segundo plano o con un tiempo de espera largo.
- Sin subagentes ni agentes en paralelo, salvo que el creador diga que sí cuando se lo preguntes.
- Nunca publiques ni envíes nada en su nombre.
- Para enseñarle una imagen, una lámina o el vídeo, ábreselo: `node motor/abrir.mjs <archivo>` (vale en Mac, Windows y
  Linux).
- Cada vídeo sale de esta carpeta. Para ver el nivel y cómo se construye, usa `ejemplo/`. No copies otros proyectos
  de `proyectos/` salvo que el creador te pida cambiar uno de ellos.
- Tus scripts de prueba van en tu carpeta temporal, no aquí: `motor/`, `guia/`, `ejemplo/` y `pruebas/` no se tocan al
  hacer un vídeo.
- Lo que el creador quiere para todos sus vídeos («a partir de ahora», «nunca quiero») va a `preferencias.md`, con sus
  palabras, y si es un ajuste, también a la marca (`node motor/marca.mjs poner ...`). Tus conclusiones no son
  preferencias suyas. No guardes en tu memoria cómo se hacen los vídeos: está aquí.
- Corto y claro en todo lo que le escribas. Una frase donde iban dos.
- Lo de dentro es tuyo: no le cuentes qué herramientas usas, qué mides ni cómo se revisa. Enséñale el guion y el vídeo,
  y pregunta solo lo que solo el creador puede decidir.
- Un vídeo por conversación: el siguiente, en una conversación nueva.

## Skills del Proyecto (Carga Contextual Modular)

Al detectar cualquiera de estos contextos o tareas, carga inmediatamente la skill correspondiente en `skills/`:

| Contexto o Tarea | Skill a cargar |
|---|---|
| Configuración inicial, clave ElevenLabs, voces, doctor, diagnóstico | `skills/video-setup/SKILL.md` |
| Estructuración de ideas, investigación de datos, redacción de guion y hook | `skills/video-scripting/SKILL.md` |
| Planificación y dibujo de planos, Canvas 2D/3D, cámaras y looks | `skills/video-animator-canvas/SKILL.md` |
| Efectos de sonido, sfx, sincronización de colisiones con audio | `skills/video-audio-sfx/SKILL.md` |
| Auditoría de fotogramas, comprobación de cortes, QA y renderizado MP4 | `skills/video-qa-render/SKILL.md` |

