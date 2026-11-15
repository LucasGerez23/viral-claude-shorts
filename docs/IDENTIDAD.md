# Identidad visual institucional

| Color | Claro (predeterminado) | Oscuro |
|---|---|---|
| Crema `#FCE4D8` | Fondo y superficies | Títulos y placas |
| Azul petróleo `#1C3144` | Títulos y contornos | Fondo y texto de placas |
| Rosa `#F75590` | Subrayados, bordes y detalles | Los mismos acentos |

Manrope 800 para titulares y cifras. Fraunces 600 cursiva para la palabra destacada. Ubicá el gancho arriba, el protagonista en el centro y los subtítulos abajo, dentro de la zona segura. En la portada, repetí la composición y señalá una cifra o palabra clave con rosa.

Elegí un modo para todo el video con `"theme": "light"` o `"theme": "dark"` en `scenes.json`. Las escenas y el arte tienen acceso a `BRAND.background`, `BRAND.text`, `BRAND.cream`, `BRAND.navy` y `BRAND.pink`. Usalos en superficies, flechas, accesorios y gráficos. Dejá el fondo visible y reservá los colores propios de un objeto para detalles que ayuden a reconocerlo.

El motor controla el fondo base, los títulos, las etiquetas y las cifras. Las imágenes, modelos, materiales y SVG personalizados deben respetar la guía. Evitá fondos opacos a pantalla completa y efectos 3D que alteren la paleta. Revisá apertura, escenas intermedias y cierre en el storyboard.

Las fuentes se instalan con `npm ci` y se cargan desde el proyecto local.
