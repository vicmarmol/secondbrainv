import { describe, expect, it } from 'vitest';
import { Route as privacy } from '@/routes/privacidad';
import { Route as terms } from '@/routes/condiciones';

describe('Public legal pages do not require a session', () => {
 it('/privacidad has no authentication guard or protected loader', () => {
  expect(privacy.options.beforeLoad).toBeUndefined();
  expect(privacy.options.loader).toBeUndefined();
  expect(privacy.options.ssr).not.toBe(false);
 });
 it('/condiciones has no authentication guard or protected loader', () => {
  expect(terms.options.beforeLoad).toBeUndefined();
  expect(terms.options.loader).toBeUndefined();
  expect(terms.options.ssr).not.toBe(false);
 });
});