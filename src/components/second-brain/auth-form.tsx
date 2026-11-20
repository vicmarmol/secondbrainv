import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Brain } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

const GoogleLogo = () => <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>;

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
 const navigate = useNavigate();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [busy, setBusy] = useState(false);
 const [sent, setSent] = useState(false);
 const signup = mode === 'signup';
 async function submit(e: FormEvent) {
  e.preventDefault(); setBusy(true);
  try {
   if (signup) {
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    if (error) throw error;
    setSent(true);
   } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message.includes('confirm') ? 'Confirma tu correo antes de entrar.' : 'Correo o contraseña incorrectos.');
    navigate({ to: '/' });
   }
  } catch (err) { toast.error((err as Error).message); }
  finally { setBusy(false); }
 }
 async function google() {
  const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
  if (result.error) { toast.error('No se ha podido entrar con Google.'); return; }
  if (result.redirected) return;
  navigate({ to: '/' });
 }
 return <main className="flex min-h-screen items-center justify-center bg-background p-6">
  <div className="w-full max-w-sm">
   <div className="mb-8 flex items-center justify-center gap-2 font-semibold"><span className="brand-mark"><Brain size={21}/></span>Second Brain</div>
   <h1 className="text-center text-2xl font-semibold">{signup ? 'Crea tu cuenta' : 'Inicia sesión'}</h1>
   <p className="mt-1 text-center text-sm text-muted-foreground">{signup ? 'Tu conocimiento, conectado y privado.' : 'Vuelve a tu espacio personal.'}</p>
   {sent ? <div className="mt-8 rounded-lg border border-border bg-card p-4 text-sm">Te hemos enviado un correo a <strong>{email}</strong>. Pulsa el enlace para confirmar tu cuenta y después inicia sesión.</div> : <>
   <Button type="button" variant="outline" className="mt-8 w-full gap-[10px] border-[#747775] bg-[#FFFFFF] px-3 text-[14px] font-medium text-[#1F1F1F] hover:bg-[#FFFFFF]" onClick={google}><GoogleLogo/>{signup ? 'Registrarse con Google' : 'Iniciar sesión con Google'}</Button>
   <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>o con tu correo<span className="h-px flex-1 bg-border"/></div>
   <form className="grid gap-3" onSubmit={submit}>
    <label className="grid gap-1.5 text-sm">Correo electrónico<Input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}/></label>
    <label className="grid gap-1.5 text-sm">Contraseña<Input type="password" required minLength={8} autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)}/></label>
    <Button type="submit" className="mt-2" disabled={busy}>{busy ? 'Un momento…' : signup ? 'Crear cuenta' : 'Entrar'}</Button>
   </form></>}
   <p className="mt-6 text-center text-sm text-muted-foreground">{signup ? <>¿Ya tienes cuenta? <Link to="/login" className="text-primary">Inicia sesión</Link></> : <>¿No tienes cuenta? <Link to="/registro" className="text-primary">Regístrate</Link></>}</p>
  </div>
 </main>;
}
