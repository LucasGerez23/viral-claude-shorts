import fs from 'node:fs';
import path from 'node:path';

export interface Cue { file: string; t: number; gainDb?: number; trimStart?: number; duration?: number }
export function readCues(dir: string, duration: number): Cue[] {
  const file = path.join(dir, 'audio.json');
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(data.effects)) throw new Error('audio.json needs an effects array');
  const base = fs.realpathSync(dir);
  return data.effects.map((cue: Cue, i: number) => {
    if (!cue || typeof cue.file !== 'string' || path.isAbsolute(cue.file)) throw new Error(`effect ${i}: use a relative file path`);
    const full = fs.realpathSync(path.resolve(base, cue.file));
    const rel = path.relative(base, full);
    if (rel.startsWith('..') || path.isAbsolute(rel) || !fs.statSync(full).isFile()) throw new Error(`effect ${i}: file must be inside the video folder`);
    if (!Number.isFinite(cue.t) || cue.t < 0 || cue.t >= duration) throw new Error(`effect ${i}: t must fall inside the video`);
    if (cue.gainDb !== undefined && (!Number.isFinite(cue.gainDb) || cue.gainDb < -60 || cue.gainDb > 12)) throw new Error(`effect ${i}: gainDb must be -60 to 12`);
    if (cue.trimStart !== undefined && (!Number.isFinite(cue.trimStart) || cue.trimStart < 0)) throw new Error(`effect ${i}: invalid trimStart`);
    if (cue.duration !== undefined && (!Number.isFinite(cue.duration) || cue.duration <= 0)) throw new Error(`effect ${i}: duration must be positive`);
    return {...cue, file: full};
  });
}

export interface MixOptions { music: number; sfx: number; ambience: number; noMusic: boolean; noSfx: boolean; noAmbience: boolean }
export function mixInputs(dir: string, duration: number, options: MixOptions) {
  const first = (names: string[]) => names.map(n => path.join(dir, n)).find(n => fs.existsSync(n));
  const voice = first(['audio.wav', 'audio.mp3', 'audio.m4a']);
  const inputs: string[] = [], filters: string[] = [], labels: string[] = [];
  const add = (file: string, gain: number, extra = '', loop = false) => {
    const i = labels.length, label = `a${i}`;
    inputs.push(...(loop ? ['-stream_loop', '-1'] : []), '-i', file);
    filters.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS,volume=${gain}dB${extra}[${label}]`);
    labels.push(label); return label;
  };
  if (voice) add(voice, 0, ',apad');
  const music = first(['own-music.wav', 'own-music.mp3', 'own-music.m4a', 'music.wav']);
  if (music && !options.noMusic) {
    const label = add(music, options.music, '', true);
    if (voice) {
      filters.push('[a0]asplit=2[voice][key]', `[${label}][key]sidechaincompress=threshold=0.03:ratio=3:attack=40:release=450[ducked]`);
      labels[0] = 'voice'; labels[labels.length - 1] = 'ducked';
    }
  }
  for (const [name, gain, disabled] of [['sfx.wav', options.sfx, options.noSfx], ['ambience.wav', options.ambience, options.noAmbience]] as const) {
    const file = first([name]); if (file && !disabled) add(file, gain);
  }
  if (!options.noSfx) for (const cue of readCues(dir, duration)) {
    add(cue.file, options.sfx + (cue.gainDb ?? 0), `,atrim=start=${cue.trimStart ?? 0}${cue.duration ? `:duration=${cue.duration}` : ''},asetpts=PTS-STARTPTS,afade=t=in:d=0.005,adelay=${Math.round(cue.t * 1000)}:all=1`);
  }
  if (labels.length) filters.push(`${labels.map(l => `[${l}]`).join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,apad,atrim=duration=${duration}[out]`);
  else filters.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${duration}[out]`);
  return {inputs, graph: filters.join(';'), voice};
}
