import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';

// Keeps work alive after responding (the scheduler hangs up after a few seconds).
async function background(task: Promise<unknown>) {
 try {
  const name = 'cloudflare:workers';
  const mod = await import(/* @vite-ignore */ name) as { waitUntil?: (p: Promise<unknown>) => void };
  if (mod.waitUntil) { mod.waitUntil(task); return; }
 } catch { /* dev server: the promise keeps running on its own */ }
 task.catch(() => undefined);
}

async function drive(origin: string, authorization: string) {
 const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
 const { advanceScheduledRuns } = await import('@/lib/sync/scheduler.server');
 const remaining = await advanceScheduledRuns(supabaseAdmin);
 // Each slice is its own short invocation; chain the next one while runs remain.
 if (remaining) await fetch(`${origin}/api/public/jobs/sync-connections`, { method: 'PUT', headers: { authorization }, redirect: 'manual' }).catch(() => undefined);
}

export const Route = createFileRoute('/api/public/jobs/sync-connections')({
 server: { handlers: {
  // Hourly tick from the managed schedule.
  POST: async ({ request }) => {
   const authFailure = await authenticateCronRequest(request);
   if (authFailure) return authFailure;
   const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
   const { startScheduledRuns } = await import('@/lib/sync/scheduler.server');
   const summary = await startScheduledRuns(supabaseAdmin);
   await background(drive(new URL(request.url).origin, request.headers.get('authorization') ?? ''));
   return Response.json(summary);
  },
  // Continuation: takes no input and only advances automatic runs that already exist.
  PUT: async ({ request }) => {
   const authFailure = await authenticateCronRequest(request);
   if (authFailure) return authFailure;
   await background(drive(new URL(request.url).origin, request.headers.get('authorization') ?? ''));
   return new Response(null, { status: 202 });
  },
 } },
});
