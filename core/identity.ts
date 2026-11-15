import fs from 'node:fs';
import path from 'node:path';
import type { Plan } from './types.ts';
const root = path.resolve(import.meta.dirname, '..');
export function identityFor(mode: Plan['theme'] = 'light') {
  if (mode !== 'light' && mode !== 'dark') throw new Error('theme must be light or dark');
  const cream = '#FCE4D8', navy = '#1C3144', pink = '#F75590';
  return { mode, cream, navy, pink, background: mode === 'dark' ? navy : cream, text: mode === 'dark' ? cream : navy };
}
export function prepareIdentity(project: string, mode: Plan['theme']) {
  const brand = identityFor(mode);
  for (const [name, face] of [['manrope', '800-normal'], ['fraunces', '600-italic']]) {
    const file = path.join(root, 'node_modules', '@fontsource', name, 'files', `${name}-latin-${face}.woff2`);
    if (!fs.existsSync(file)) throw new Error('Run npm ci at the repository root to install the identity fonts.');
    fs.copyFileSync(file, path.join(project, name + '.woff2'));
  }
  const css = fs.readFileSync(path.join(root, 'styles', 'identity.css'), 'utf8');
  const { cream, navy, pink, background, text } = brand;
  fs.writeFileSync(path.join(project, 'identity.css'),
    `:root { --cream: ${cream}; --navy: ${navy}; --pink: ${pink}; --brand-bg: ${background}; --brand-text: ${text}; }\n${css}`);
  return brand;
}
