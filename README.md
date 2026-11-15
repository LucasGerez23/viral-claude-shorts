# Viral Codex Shorts

Creá y editá shorts verticales 9:16 con **Codex**, animaciones 2D/3D, títulos sincronizados, música, ambientes y efectos de animación. La narración la aportás vos: configurar o generar voces queda fuera del flujo principal.

El motor es **HyperFrames + GSAP**, con **Three.js** para 3D. No es un proyecto Remotion. Los renders se procesan localmente; Codex usa su servicio de IA y la instalación inicial necesita Internet. No se garantiza viralidad ni ventas.

## Empezar con Codex

Abrí esta carpeta en Codex. [AGENTS.md](AGENTS.md) contiene las instrucciones del proyecto. Si usás la terminal, instalá Codex según la [guía oficial](https://developers.openai.com/codex/cli/) y ejecutá `codex` dentro de la carpeta.

```sh
git clone https://github.com/LucasGerez23/viral-claude-shorts.git viral-codex-shorts
cd viral-codex-shorts
```

La URL conserva el nombre remoto existente para que siga funcionando; el proyecto y sus instrucciones ahora son para Codex.

Pedile: «Prepará este proyecto siguiendo prompts/setup-flat2d.md» o «Preparalo en 3D siguiendo prompts/setup-3d.md». Después: «Animá este audio y explicá por qué el cielo es azul»; para editar: «En el panel 3, acercá la cámara y poné un whoosh cuando aparece el objeto». También podés crear animaciones sin narración con tiempos explícitos.

## Instalación manual

Necesitás Node.js **22.18+**, npm, FFmpeg y ffprobe en PATH. Python 3.12 y faster-whisper son opcionales, para transcribir narraciones existentes. Para renderizar se necesita Chromium, que el motor puede descargar en el primer uso. No hace falta instalar Voicebox ni usar una API de voces.

Desde la raíz, en Windows, macOS o Linux:

```sh
npm ci
npm run setup:styles
npm run doctor
npm test
npm run typecheck
```

Para instalar solo un estilo: `npm ci --prefix styles/flat2d` o `npm ci --prefix styles/3d`. El diagnóstico completo revisa ambos; el chequeo de tipos revisa los estilos instalados.

Transcripción opcional en Windows (PowerShell):

```powershell
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe core/transcribe.py videos/mi-video
```

En macOS/Linux:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python core/transcribe.py videos/mi-video
```

La transcripción descarga un modelo en el primer uso; luego puede trabajar localmente. Asume español; agregá `--language en` para inglés. Guardá la narración como `audio.wav`, `audio.mp3` o `audio.m4a` dentro de la carpeta del video. La utilidad heredada `core/voice.ts` es opcional y no se invoca en la instalación ni en producción.

## Qué incluye el audio

| Capa | Recurso incluido | Cómo editarla |
|---|---|---|
| Música | Síntesis local por emoción, tempo y tonalidad | `music`, `mood` en scenes.json; o `own-music.wav/mp3/m4a` |
| Efectos | whoosh, hit, impact, pop, tick, riser, shimmer, fail, scratch, zip, thump | `sfx` en cada key |
| Ambientes | wind, forest, crowd, room, steps | `ambience` en cada escena |
| Sonidos externos | Archivos propios sincronizados y recortables | `audio.json` |
| Narración | Archivo que vos proporcionás | `audio.wav/mp3/m4a` |

Los sonidos incluidos se sintetizan desde código: no requieren descargar paquetes ni contratar servicios. Son sonidos estilizados, no una biblioteca de grabaciones realistas. Para sonidos específicos, agregá archivos con derechos de uso documentados. Ver [guía de audio](docs/AUDIO.md).

## Flujo de edición

Codex lee [prompts/production.md](prompts/production.md): analiza la narración, diseña personajes/escenarios, prueba el mundo, prepara escenas, anima y revisa el storyboard. Cada video vive en `videos/<tema>/`.

Una vez escritos los archivos visuales y las escenas:

```sh
node core/scenes.ts videos/mi-video
node core/music.ts videos/mi-video
node core/mix.ts videos/mi-video --audio-only
node core/preview.ts videos/mi-video
```

Después de editar sonidos o escenas, repetí esos comandos para actualizar el audio de la vista previa. Para exportar:

```sh
node core/render.ts videos/mi-video
```

Genera `final.mp4`, `mix.wav` y `report.md`. El render valida los tiempos y regenera las tres capas de sonido. Opciones: `--no-music`, `--no-sfx`, `--no-ambience`, `--music -20`. La revisión mide formato, cortes, duración y volumen; no reemplaza escuchar y mirar el video. La normalización apunta a -14 LUFS y -1.5 dBTP; son objetivos de mezcla, no requisitos universales de las plataformas.

Probá el motor sin voz con el ejemplo 3D `videos/detail-demo/`: validá sus escenas, generá las capas y la mezcla, y abrí su preview con los mismos comandos. Los otros ejemplos conservan tiempos/transcripciones, pero sus narraciones no están incluidas.

## Estructura

- `AGENTS.md`: instrucciones para Codex.
- `core/`: validación, transcripción, audio, preview, render y revisión.
- `styles/flat2d/`: SVG/HTML + GSAP; [uso](styles/flat2d/USAGE.md).
- `styles/3d/`: Three.js + GSAP; [uso](styles/3d/USAGE.md).
- `prompts/`: instalación y producción guiada.
- `tests/`: pruebas de capas, sincronización, entradas inválidas y mezcla con FFmpeg.
- `.github/workflows/ci.yml`: instalación y pruebas en Linux y Windows.

Dependencias principales: [HyperFrames](https://github.com/heygen-com/hyperframes), [GSAP](https://gsap.com), [Three.js](https://threejs.org), [faster-whisper](https://github.com/SYSTRAN/faster-whisper), [FFmpeg](https://ffmpeg.org). Se conservan las versiones fijadas y sus lockfiles. Revisá las condiciones de cada dependencia y de los archivos externos antes de redistribuirlos.
