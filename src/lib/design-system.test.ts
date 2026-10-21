import { test, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

test('src/styles está em dia com design-system/', () => {
  expect(() =>
    execFileSync('node', ['scripts/sync-design-system.mjs', '--check'], { stdio: 'pipe' }),
  ).not.toThrow();
});
