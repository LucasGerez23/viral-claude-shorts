#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
let failures = 0;
function check(name: string, ok: boolean, fix: string) { console.log(`${ok ? 'OK' : 'MISSING'} ${name}${ok ? '' : `: ${fix}`}`); if (!ok) failures++; }
const [major, minor] = process.versions.node.split('.').map(Number);
check('Node 22.18+', major > 22 || major === 22 && minor >= 18, 'install Node.js LTS');
for (const command of ['ffmpeg', 'ffprobe']) check(command, spawnSync(command, ['-version']).status === 0, 'install FFmpeg and add its bin directory to PATH');
for (const folder of ['', 'styles/flat2d', 'styles/3d']) {
  const dir = path.join(root, folder), pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  for (const [name, version] of Object.entries({...pkg.dependencies, ...pkg.devDependencies})) {
    let installed = ''; try { installed = JSON.parse(fs.readFileSync(path.join(dir, 'node_modules', name, 'package.json'), 'utf8')).version; } catch {}
    check(`${folder || 'core'} / ${name}`, installed === version, `run npm ci${folder ? ` --prefix ${folder}` : ''}`);
  }
}
const python = path.join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const transcription = spawnSync(python, ['-c', 'import faster_whisper']);
console.log(`${transcription.status === 0 ? 'OK' : 'OPTIONAL'} transcription: ${transcription.status === 0 ? 'ready' : 'install requirements.txt in .venv only if using narration'}`);
console.log('Narration generation is excluded. SFX and music generation require only Node; mixing needs FFmpeg.');
process.exitCode = failures ? 1 : 0;
