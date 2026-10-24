# Los datos del kit

## mundo.json

Lo que dibuja `kit/mapa.js` (el globo, el mapa plano, las luces de las ciudades y `lugar("Madrid")`).

- **De dónde sale:** [Natural Earth](https://www.naturalearthdata.com), descargado de su copia en GitHub
  (`github.com/nvkelso/natural-earth-vector`, carpeta `geojson/`) el 22 de octubre de 2026:
  - `ne_50m_land`: las costas.
  - `ne_50m_lakes`: los lagos grandes.
  - `ne_50m_glaciated_areas` y `ne_50m_antarctic_ice_shelves_polys`: el hielo.
  - `ne_50m_geography_regions_polys`: los desiertos, las cordilleras y la tundra.
  - `ne_10m_populated_places_simple`: dónde están las ciudades y cuánta gente tienen (las luces de noche).
  - `ne_50m_populated_places`: los nombres de 1.251 ciudades, también en español y en inglés (para `lugar`).
- **Licencia:** dominio público. Natural Earth: «All versions of Natural Earth raster + vector map data found on this
  website are in the public domain. You may use the maps in any manner, including modifying the content and design,
  electronic dissemination, and offset printing.» No hace falta citarlo (se agradece: «Made with Natural Earth»).
- **Cómo se ha hecho:** cada costa simplificada (Douglas-Peucker, 0,035° las costas; algo más lo demás), sin las islas
  diminutas y redondeada a 0,01° (1 km). Los puntos del borde del mapa (longitud ±180°, latitud ±90°) no se quitan: si no,
  el borde de la Antártida se convierte en una diagonal.
- **Formato:** cada anillo es una polilínea de Google con precisión 0,01° (`[lon, lat]`); `luces` son trozos
  `dlon,lat,pob` separados por `;` (la longitud en centésimas y acumulada; `pob` = 12 · log10(habitantes));
  `ciudades` son `[nombre, en español, en inglés, lat, lon, habitantes]`, de la más poblada a la menos.

Si hiciera falta rehacerlo (otra resolución, más capas), se vuelve a descargar de Natural Earth y se simplifica igual:
lo que hay aquí no se toca a mano.
