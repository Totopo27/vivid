# El sonido

Un efecto solo existe porque algo de la imagen hace eso, en ese fotograma, y dura lo que dura eso. Si se pone bien,
el vídeo se siente vivo; si se pone mal o hay huecos largos, se siente raro. Ni tú ni ninguna IA puede oír: por eso se
usan solo los sonidos de `sonidos/`, que ya se han oído en vídeos aprobados, y se colocan por lo que se ve, con estas
reglas.

## Qué sonido para qué

| Lo que se ve | El sonido | Ejemplo |
|---|---|---|
| La cámara se mueve deprisa, algo pasa cerca o entra | `aire`, suave (más lento, `vel` 0,5-0,8, si el movimiento es largo) | la cámara se aleja; entra la Tierra |
| Algo se lanza, se desploma o se aprieta, y acaba de golpe | `empujon` (lo más fuerte, al final del movimiento) | la cámara se lanza; la estrella se encoge |
| Algo revienta o muere con un fogonazo | `estallido` (grave con `lp` 1400; si su plano se corta, `corta`) | la muerte de la estrella; el trozo que revienta |
| Algo de piedra se parte | `roca` (más grave y fuerte si es más grande) | los planetas que se rompen |
| Algo choca | `golpe`; el más grande, `golpe-hondo` | cada roca que cae sobre la bolita |
| Algo aparece, se marca o se para en su sitio | `clic` | el contorno del Sol; la Tierra se para; la marca «a 280 años luz» |
| Un número que corre | `tic`, uno cada cuarto de su camino | la temperatura de cada estrella |
| Algo que traquetea (sal, piezas sueltas) | `tic` en cada sacudida, sordo (`lp` 6000) | el salero |
| Algo que sube o se va hacia arriba | `sube` | los rayos de colores |
| La cosa principal late | siempre el mismo (`late`): es su sello | la verde, cada vez que late |
| Algo vuelve atrás en el tiempo o se absorbe | el sonido al revés (`reves: true`); un estallido al revés es una subida grave | la vuelta atrás a cuando nació |
| Material concreto | `metal`, `madera`, `cristal`, `muro`, `papel`, `pelota`, `lingote`, `cuadro`, `hueco`... (`sonidos/LEEME.md`) | |

## Las reglas

- **En todo el vídeo, sin huecos:** nunca más de unos 2 s sin ningún efecto. Un vídeo con muchos efectos en una parte y
  ninguno durante 15 s se siente raro. Si hay un hueco, mira qué se mueve ahí y ponle su sonido.
- **Nada en un corte,** ni en el número de un paso ni en un título: el corte no suena. El sonido va con lo que se mueve
  (si algo entra justo al cortar, en su movimiento, un poco después).
- **Cada uno, lo que dura lo suyo:** un golpe es corto; un movimiento largo lleva un aire más lento. Si el plano se
  corta, su sonido se apaga con él (`corta`).
- **Por debajo de la voz,** siempre. El nivel (`db`) es frente a la voz que suena alrededor: -7 lo fuerte (un estallido,
  el empujón del hook), -10/-12 lo normal, -14/-17 lo pequeño (tics, golpes pequeños, un aire de fondo).
- **Muchos choques seguidos:** no uno por cada cosa. Los que más se ven, sin dos en menos de 0,1 s, alternando un poco
  el tono (`vel`) y el nivel.
- **Los momentos salen de los planos,** que los exportan (`choques`, `revienta`, `sacudidas`...), y de `v.t()`. Nunca
  se copian segundos a mano: si la imagen cambia, el sonido la sigue.

## sonidos.js

```js
import { v } from "#voz";
import { choques } from "./video/planos/02-sistema.js";

const e = [];
const pon = (sonido, t, o = {}) => e.push({ sonido, t, ...o });

pon("aire", 0, { ancla: "empieza", db: -11, vel: 0.8, que: "la cámara se aleja" });
pon("clic", v.t("tierra") - 0.02, { db: -14, que: "la Tierra se para" });
for (const c of choques) pon(c.grande ? "golpe-hondo" : "golpe", c.t, { db: c.grande ? -8 : -15 });

export default e;
```

Cada efecto:
- `t`: el segundo en que suena lo más fuerte del sonido.
- `ancla: "empieza"`: `t` es cuando empieza.
- `db`: el nivel frente a la voz.
- `vel`: más de 1, más agudo y corto; menos de 1, más grave y largo.
- `lp`: quita los agudos por encima de esos Hz.
- `reves`: al revés.
- `corta`: el segundo en que se apaga del todo.
- `que`: lo que hace (sale en el informe).

`node motor/sonido.mjs <proyecto>` hace la pista y dice los huecos y lo que cae en un corte. `render.mjs` la mezcla con
la voz, al mismo volumen que los vídeos aprobados; si después cambian `sonidos.js`, los planos o la voz, la rehace él
solo antes de mezclar.

Si el creador no quiere efectos (`"efectos": false` en la marca), el vídeo no lleva `sonidos.js` y nada de esto se hace.
