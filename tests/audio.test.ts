import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {mixInputs, readCues} from '../core/audio.ts';

const root = path.resolve(import.meta.dirname, '..');
const defaults = {music: -16, sfx: -8, ambience: -24, noMusic: false, noSfx: false, noAmbience: false};
function fixture(t: {after: (fn: () => void) => void}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'viral-codex-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true})); return dir;
}
test('custom music keeps SFX and ambience; mute music also mutes custom tracks', t => {
  const dir = fixture(t);
  for (const n of ['audio.wav', 'own-music.mp3', 'music.wav', 'sfx.wav', 'ambience.wav']) fs.writeFileSync(path.join(dir,n), 'test');
  const a = mixInputs(dir, 4, defaults);
  assert.ok(a.inputs.includes(path.join(dir,'own-music.mp3')));
  assert.ok(!a.inputs.includes(path.join(dir,'music.wav')));
  assert.ok(a.inputs.includes(path.join(dir,'sfx.wav')));
  assert.match(a.graph, /sidechaincompress/);
  const b = mixInputs(dir, 4, {...defaults, noMusic: true});
  assert.ok(!b.inputs.some(n => n.includes('music.')));
  assert.ok(b.inputs.includes(path.join(dir,'sfx.wav')));
  assert.doesNotMatch(b.graph, /sidechaincompress/);
});
test('external cues are trimmed, delayed and validated', t => {
  const dir = fixture(t); fs.mkdirSync(path.join(dir,'assets'));
  fs.writeFileSync(path.join(dir,'assets','effect.wav'),'test');
  const save = (effects: unknown) => fs.writeFileSync(path.join(dir,'audio.json'), JSON.stringify({effects}));
  save([{file:'assets/effect.wav',t:1.25,gainDb:-3,trimStart:0.2,duration:0.3}]);
  const a = mixInputs(dir, 4, defaults);
  assert.match(a.graph,/atrim=start=0.2:duration=0.3/); assert.match(a.graph,/adelay=1250:all=1/);
  assert.match(a.graph,/volume=-11dB/);
  assert.equal(mixInputs(dir, 4, {...defaults,noSfx:true}).inputs.length,0);
  save([{file:'assets/effect.wav',t:4}]); assert.throws(()=>readCues(dir,4),/inside the video/);
  save([{file:'../escape.wav',t:1}]); assert.throws(()=>readCues(dir,4));
});
test('generated stems contain valid deterministic PCM and no voice is needed', t => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir,'scenes.json'),JSON.stringify({style:'flat2d',fps:30,format:'9:16',duration:2,scenes:[{id:'test',type:'object',mood:'calm',t0:0,t1:2,ambience:['wind'],keys:[{id:'hit',t:0.5,sfx:'pop'}]}]}));
  const generate = () => { const r=spawnSync(process.execPath,[path.join(root,'core/music.ts'),dir],{encoding:'utf8'}); assert.equal(r.status,0,r.stderr); };
  generate();
  const before = ['music','sfx','ambience'].map(n=>fs.readFileSync(path.join(dir,`${n}.wav`)));
  for(const b of before) { assert.equal(b.subarray(0,4).toString(),'RIFF'); assert.equal(b.readUInt32LE(24),48000); assert.equal(b.length,44+2*48000*4); assert.ok(b.subarray(44).some(v=>v!==0)); }
  generate(); for(const [i,n] of ['music','sfx','ambience'].entries()) assert.deepEqual(fs.readFileSync(path.join(dir,`${n}.wav`)),before[i]);
  assert.doesNotMatch(mixInputs(dir,2,defaults).graph,/sidechaincompress/);
});
test('invalid BPM fails promptly instead of hanging', t => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir,'scenes.json'),JSON.stringify({duration:1,scenes:[],music:{bpm:-10}}));
  const r=spawnSync(process.execPath,[path.join(root,'core/music.ts'),dir],{encoding:'utf8',timeout:5000});
  assert.notEqual(r.status,0); assert.match(r.stderr,/bpm must/);
});
const haveFFmpeg = spawnSync('ffmpeg',['-version']).status === 0;
test('FFmpeg mixes effects without narration and exports valid audio', {skip: !haveFFmpeg}, t => {
  const dir=fixture(t);
  fs.writeFileSync(path.join(dir,'scenes.json'),JSON.stringify({duration:2,scenes:[{id:'x',type:'object',t0:0,t1:2,keys:[{id:'x',t:0.3,sfx:'pop'}]}]}));
  for(const [script,args] of [['music.ts',[]],['mix.ts',['--audio-only','--no-music']]] as const) {
    const r=spawnSync(process.execPath,[path.join(root,'core',script),dir,...args],{encoding:'utf8'}); assert.equal(r.status,0,r.stderr);
  }
  assert.ok(fs.statSync(path.join(dir,'mix.wav')).size>1000);
  // With all stems disabled a finite silence file is still valid.
  const r=spawnSync(process.execPath,[path.join(root,'core/mix.ts'),dir,'--audio-only','--no-music','--no-sfx','--no-ambience'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr); assert.match(r.stdout,/silent mix/);
});
