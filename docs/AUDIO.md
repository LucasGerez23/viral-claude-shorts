# Sonido para animaciones

No hace falta generar ni clonar una voz. La narración es opcional y se aporta como archivo. Música, efectos y ambientes se generan localmente con Node y se mezclan con FFmpeg.

## Capas independientes

`node core/music.ts videos/<tema>` lee escenas ya validadas y escribe tres WAV estéreo a 48 kHz:

- `music.wav`: armonía, ritmo e instrumentos por emoción.
- `sfx.wav`: efectos de keys, transiciones e impactos de estadísticas.
- `ambience.wav`: sonidos de fondo de cada escena.

Se conservan los once efectos y cinco ambientes de `core/score.ts`; allí también se documentan los moods disponibles. El resultado es determinista para el mismo plan. No se incluyen grabaciones de terceros ni música comercial. Los efectos sintéticos no son grabaciones realistas de animales, motores o acciones específicas.

Ejemplo de escena sin narración dentro de scenes.json:

```json
{
  "style": "flat2d", "fps": 30, "format": "9:16", "duration": 4,
  "music": {"bpm": 96, "key": "D"},
  "scenes": [{
    "id": "entrada", "type": "object", "t0": 0,
    "title": "Una idea aparece", "mood": "calm", "ambience": ["room"],
    "keys": [{"id": "aparece", "t": 0.8, "sfx": "pop"}]
  }]
}
```

Con narración, usá `from` y `at` como índices de words.json; el validador calcula t0/t1/t. Sin words.json, usá duration/t0/t explícitos. Duración admitida por el generador y mezclador: hasta 600 segundos. Tempo: 20 a 300 BPM.

## Música propia y sonidos externos

Copiá `own-music.wav`, `own-music.mp3` o `own-music.m4a` dentro del video. Reemplaza solamente la música; conserva los efectos y ambientes. Una pista corta se repite hasta terminar el video.

Para sonidos específicos, creá `audio.json`:

```json
{
  "effects": [
    {"file": "assets/audio/puerta.wav", "t": 1.2, "gainDb": -3, "trimStart": 0.1, "duration": 0.7},
    {"file": "assets/audio/click.mp3", "t": 2.8}
  ]
}
```

`t` es el segundo absoluto en el video; `trimStart` es el comienzo dentro del archivo; `duration` limita el fragmento; `gainDb` ajusta su volumen adicionalmente al nivel global de efectos. Todos los archivos deben existir dentro de la carpeta del video. Usá una entrada por cada repetición. Conservá autor, URL de origen, licencia y atribución exigida en `assets/audio/SOURCES.md`; no descargues música popular ni asumas que «gratis» permite cualquier uso.

## Escuchar antes de exportar

```sh
node core/scenes.ts videos/<tema>
node core/music.ts videos/<tema>
node core/mix.ts videos/<tema> --audio-only
node core/preview.ts videos/<tema>
```

El preview reproduce `mix.wav` cuando existe; de lo contrario reproduce la narración disponible. Volvé a mezclar después de cada cambio de audio. Los archivos se regeneran: no edites manualmente los WAV sintéticos.

```sh
node core/mix.ts videos/<tema> --audio-only --music -20 --sfx -6 --ambience -26
node core/render.ts videos/<tema> --no-music
```

Los niveles son ganancias previas a la normalización final, no diferencias de sonoridad garantizadas entre grabaciones. `--no-music` silencia también la música propia; `--no-sfx` silencia efectos sintéticos y externos; `--no-ambience` silencia ambientes. Render acepta los tres interruptores y los niveles `--music`, `--sfx`, `--ambience`.

La música baja durante la voz mediante sidechain. Efectos y ambientes tienen controles separados. Una mezcla completamente silenciosa se exporta sin intentar normalizar -inf; la revisión de sonoridad la marcará fuera del objetivo, algo esperable si elegiste silenciar todo.

## Comprobación

`npm test` prueba que la música propia no elimine efectos, que los silenciamientos se apliquen, que los cues se recorten/sincronicen, que las rutas inválidas se rechacen y que los WAV sean reproducibles. Con FFmpeg disponible prueba además la mezcla real. Si no lo encuentra, esa prueba aparece como omitida, no aprobada. `npm run doctor` lista herramientas faltantes. La validación visual y auditiva sigue siendo necesaria antes de publicar.
