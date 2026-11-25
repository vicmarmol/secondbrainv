// @vitest-environment-options {"url":"https://test.lovable.app"}
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { INVITATION_KEY } from '@/lib/invitation-handoff';
import { AuthForm } from './auth-form';

const mocks = vi.hoisted(() => ({ signUp: vi.fn(), oauth: vi.fn(), navigate: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { signUp: mocks.signUp } } }));
vi.mock('@/integrations/lovable/index', () => ({ lovable: { auth: { signInWithOAuth: mocks.oauth } } }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => mocks.navigate, Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a> }));

describe('Registration invitation is saved immediately before authentication', () => {
 beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
 afterEach(cleanup);
 it('stores the invitation before Google redirects to the public home', async () => {
  let savedAtCall: { code?: string; expiresAt?: number } = {};
  const startedAt = Date.now();
  mocks.oauth.mockImplementation(async () => {
   savedAtCall = JSON.parse(localStorage.getItem(INVITATION_KEY) ?? '{}');
   return { redirected: true };
  });
  render(<AuthForm mode="signup"/>);
  fireEvent.change(screen.getByLabelText('Código de invitación'), { target: { value: 'abcd-2345' } });
  expect(localStorage.getItem(INVITATION_KEY)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar con Google' }));
  await waitFor(() => expect(mocks.oauth).toHaveBeenCalledWith('google', { redirect_uri: window.location.origin }));
  expect(savedAtCall.code).toBe('ABCD-2345');
  expect(savedAtCall.expiresAt).toBeGreaterThanOrEqual(startedAt + 3600000);
  expect(savedAtCall.expiresAt).toBeLessThanOrEqual(Date.now() + 3600000);
  expect(mocks.navigate).not.toHaveBeenCalled();
 });
 it('stores the invitation before email signup and does not enter the app without a confirmed session', async () => {
  let savedAtCall: { code?: string } = {};
  mocks.signUp.mockImplementation(async () => {
   savedAtCall = JSON.parse(localStorage.getItem(INVITATION_KEY) ?? '{}');
   return { data: { session: null }, error: null };
  });
  render(<AuthForm mode="signup"/>);
  fireEvent.change(screen.getByLabelText('Código de invitación'), { target: { value: 'abcd-2345' } });
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Temporary-Test-Password!' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Crear cuenta' }).closest('form') ?? screen.getByRole('button', { name: 'Crear cuenta' }));
  await waitFor(() => expect(mocks.signUp).toHaveBeenCalledWith({ email: 'test@example.com', password: 'Temporary-Test-Password!', options: { emailRedirectTo: window.location.origin } }));
  expect(savedAtCall.code).toBe('ABCD-2345');
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(localStorage.getItem(INVITATION_KEY)).not.toBeNull();
 });
});