#!/usr/bin/env node
// Pipeline steps 5 + 6: full render with the style's framework, mix with the voice and the music, review.
//   usage: node core/render.ts videos/<topic> [--no-music] [--music -16]
//   -> videos/<topic>/final.mp4 and videos/<topic>/report.md
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './style.ts';

const argv = process.argv.slice(2);
const noMusic = argv.includes('--no-music');
const noSfx = argv.includes('--no-sfx'), noAmbience = argv.includes('--no-ambience');
const gain = (flag: string, fallback: string) => {
  const i = argv.indexOf(flag), value = i >= 0 ? argv[i + 1] : fallback;
  if (!Number.isFinite(Number(value)) || Number(value) < -60 || Number(value) > 12) throw new Error(`${flag} must be -60 to 12 dB`);
  return value;
};
const musicDb = gain('--music', '-16'), sfxDb = gain('--sfx', '-8'), ambienceDb = gain('--ambience', '-24');
if (!argv[0] || argv[0].startsWith('--')) { console.error('usage: node core/render.ts videos/<topic>'); process.exit(2); }
const { v, E, A } = await load(argv[0]);
const t0 = Date.now();
const node = (script: string, ...a: string[]) => { const r = spawnSync(process.execPath, [path.join(ROOT, 'core', script), ...a], { stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status || 1); };
console.log(`== ${path.basename(v)}: style ${E.style} (${A.engine})`);
node('scenes.ts', v);
node('music.ts', v);
A.build(v);
const silent = await A.video(v);
node('mix.ts', v, silent, '--music', musicDb, '--sfx', sfxDb, '--ambience', ambienceDb, ...(noMusic ? ['--no-music'] : []), ...(noSfx ? ['--no-sfx'] : []), ...(noAmbience ? ['--no-ambience'] : []));
console.log(`render: ${((Date.now() - t0) / 1000).toFixed(0)} s`);
node('review.ts', v);
