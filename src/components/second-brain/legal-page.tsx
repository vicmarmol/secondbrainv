import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { Brain } from 'lucide-react';

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
 return <div className="min-h-screen bg-background text-foreground">
  <header className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-6">
   <Link to="/" className="flex items-center gap-2 font-semibold"><span className="brand-mark"><Brain size={21}/></span>Second Brain</Link>
   <Link to="/login" className="text-sm text-primary underline-offset-4 hover:underline">Iniciar sesión</Link>
  </header>
  <main className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
   <h1 className="text-3xl font-semibold leading-tight">{title}</h1>
   <p className="mt-3 text-sm text-muted-foreground">Información del titular de Second Brain</p>
   <article className="mt-9 space-y-8 text-sm leading-7">{children}</article>
  </main>
  <footer className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-3 border-t border-border px-6 py-6 text-sm text-muted-foreground">
   <Link to="/privacidad" className="underline-offset-4 hover:text-primary hover:underline">Política de Privacidad</Link>
   <Link to="/condiciones" className="underline-offset-4 hover:text-primary hover:underline">Condiciones del Servicio</Link>
  </footer>
 </div>;
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
 return <section><h2 className="mb-2 text-lg font-semibold">{title}</h2><div className="space-y-3 text-muted-foreground">{children}</div></section>;
}

export function LegalContact() {
 return <a href="mailto:vicmarmol@gmail.com" className="break-words text-primary underline underline-offset-4">vicmarmol@gmail.com</a>;
}