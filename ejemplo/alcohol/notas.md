# La noche que nunca se grabó: cómo se hizo

Un vídeo de una pregunta («¿por qué no te acuerdas?»), sin una cosa famosa que enseñar: cada idea tiene su propia
escena, con cosas de casa (la discoteca, el whisky, el móvil lleno), y el primer segundo ya se mueve.

Tres hooks hasta dar con el bueno:

| Lo que dijo el creador | Por qué pasaba | Lo que se cambió |
|---|---|---|
| Las imágenes no iban con lo que decía la voz, «todo el rato el mismo visual»; el caballito de mar no venía a cuento. | Un solo mundo de neuronas para todo el hook, mientras la voz hablaba de bailar y volver a casa; el hipocampo, dibujado como un caballito de mar por su nombre. | Se ve lo que dice cada frase; cada idea, su escena; el caballito, fuera. |
| «No vale con un fondo de cerebro con imágenes encima»; el hook tiene que decir el tema y llamar la atención en un segundo. | Fotos planas sobre un cerebro, y la primera frase era una escena («Anoche bebiste, bailaste...») que no decía de qué iba. | La primera frase es la pregunta, tal cual la haría la gente, y cada idea tiene una escena distinta y grande. |

Después pidió más variaciones del hook para que fuera «lo más wow posible», y de cuatro eligió el túnel de luces (el
viaje a toda velocidad que acaba en la bola de espejos). La otra apertura, la bola desde el fotograma 0, está en
`video/aperturas/01-bola.js`: `node motor/render.mjs ejemplo/alcohol --borrador --hasta 5 --apertura 01-bola`.

Al revisarlo:
- Antes de cada corte se calma lo que se mueve (la vena, el cerebro, las neuronas).
- Los dos saltos que marca el render están buscados: 1,52 s es la cámara que llega de golpe a la barra, y 3,97 s el
  recuerdo que revienta como un cristal.
- Con el lienzo nuevo, la luz se suma de verdad: los brillos de muchas moléculas juntas, la niebla ámbar y la luz de
  la mañana se bajaron para que se vea como el vídeo que se aprobó.
