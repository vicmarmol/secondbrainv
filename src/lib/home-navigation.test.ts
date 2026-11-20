import { describe, expect, it } from 'vitest';
import { homeDestination } from './home-navigation';

describe('Public home navigation', () => {
 it('keeps users without a session on the public home', () => {
  expect(homeDestination(false)).toBeNull();
 });
 it('takes users with a session to the protected chat', () => {
  expect(homeDestination(true)).toBe('/chat');
 });
});