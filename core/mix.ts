#!/usr/bin/env node
// Independent voice, music, SFX and ambience; --audio-only prepares preview audio.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { mixInputs } from './audio.ts';

const argv = process.argv.slice(2);
const number = (flag: string, fallback: number) => {
  const i = argv.indexOf(flag); if (i < 0) return fallback;
  const value = Number(argv.splice(i, 2)[1]);
  if (!Number.isFinite(value) || value < -60 || value > 12) throw new Error(`${flag} must be -60 to 12 dB`);
  return value;
};
const options = {music: number('--music', -16), sfx: number('--sfx', -8), ambience: number('--ambience', -24), noMusic: argv.includes('--no-music'), noSfx: argv.includes('--no-sfx'), noAmbience: argv.includes('--no-ambience')};
const audioOnly = argv.includes('--audio-only');
const flags = new Set(['--no-music', '--no-sfx', '--no-ambience', '--audio-only']);
for (const arg of argv) if (arg.startsWith('--') && !flags.has(arg)) throw new Error(`unknown option: ${arg}`);
const [dir, video] = argv.filter(a => !flags.has(a));
if (!dir || (!video && !audioOnly)) throw new Error('usage: node core/mix.ts videos/<topic> <video.mp4> OR videos/<topic> --audio-only');
const root = path.resolve(dir), mix = path.join(root, 'mix.wav'), raw = path.join(root, 'mix.raw.wav');
function run(command: string, args: string[]) {
  const r = spawnSync(command, args, {encoding: 'utf8', maxBuffer: 1 << 26});
  if (r.error || r.status !== 0) throw new Error(`${command}: ${r.error?.message ?? r.stderr}`);
  return r;
}
const duration = audioOnly ? JSON.parse(fs.readFileSync(path.join(root, 'scenes.json'), 'utf8')).duration : Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video!]).stdout.trim());
if (!Number.isFinite(duration) || duration <= 0 || duration > 600) throw new Error('invalid video duration (maximum 600 seconds)');
const {inputs, graph} = mixInputs(root, duration, options);
const ff = (args: string[]) => run('ffmpeg', ['-y', '-hide_banner', ...args]);
try {
  ff([...inputs, '-filter_complex', graph, '-map', '[out]', '-ar', '48000', '-t', String(duration), raw]);
  const ln = 'loudnorm=I=-14:TP=-1.5:LRA=11';
  const measured = ff(['-i', raw, '-af', `${ln}:print_format=json`, '-f', 'null', '-']).stderr;
  const m = JSON.parse(measured.slice(measured.lastIndexOf('{'), measured.lastIndexOf('}') + 1));
  // Silence has -inf loudness: never pass non-finite measurements to FFmpeg.
  const finite = ['input_i', 'input_tp', 'input_lra', 'input_thresh', 'target_offset'].every(k => Number.isFinite(Number(m[k])));
  if (finite) ff(['-i', raw, '-af', `${ln}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`, '-ar', '48000', mix]);
  else fs.copyFileSync(raw, mix);
  if (!audioOnly) ff(['-i', video!, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-t', String(duration), '-movflags', '+faststart', path.join(root, 'final.mp4')]);
  console.log(`${audioOnly ? 'mix.wav' : 'final.mp4'}: ${duration.toFixed(2)} s; ${finite ? 'normalized to target -14 LUFS' : 'silent mix (no loudness target)'}`);
} finally { fs.rmSync(raw, {force: true}); }
