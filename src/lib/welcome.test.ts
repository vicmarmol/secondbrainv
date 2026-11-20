import { describe, expect, it } from 'vitest';
import { needsWelcome } from './welcome';

describe('Welcome entry rule (after the existing approval/access gate)', () => {
 it('welcomes a user with zero active connections AND zero documents', () => {
  expect(needsWelcome({ activeConnections: 0, documents: 0 })).toBe(true);
 });
 it('sends a user with one active connection to chat before documents are indexed', () => {
  expect(needsWelcome({ activeConnections: 1, documents: 0 })).toBe(false);
 });
 it('sends a user with one document to chat even without connections', () => {
  expect(needsWelcome({ activeConnections: 0, documents: 1 })).toBe(false);
 });
 it('counts sample documents in the exact same total', () => {
  expect(needsWelcome({ activeConnections: 0, documents: 20 })).toBe(false);
 });
 it('does not exempt an empty admin/user preview or force a populated admin into welcome', () => {
  expect(needsWelcome({ activeConnections: 0, documents: 0 })).toBe(true);
  expect(needsWelcome({ activeConnections: 1, documents: 45 })).toBe(false);
 });
});