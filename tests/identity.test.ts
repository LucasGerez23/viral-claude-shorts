import assert from 'node:assert/strict';
import { test } from 'node:test';
import { identityFor } from '../core/identity.ts';

test('light and dark share the same institutional colors', () => {
  const light = identityFor();
  assert.deepEqual(light, { mode: 'light', cream: '#FCE4D8', navy: '#1C3144', pink: '#F75590', background: '#FCE4D8', text: '#1C3144' });
  assert.deepEqual(identityFor('dark'), { ...light, mode: 'dark', background: light.navy, text: light.cream });
});
