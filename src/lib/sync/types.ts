import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export type Db = SupabaseClient<Database>;
export type ConnectionRow = Database['public']['Tables']['connections']['Row'];
export type SyncRunRow = Database['public']['Tables']['sync_runs']['Row'];
export type SyncTrigger = 'manual' | 'automatica';

/** Same result shape for every source, manual or automatic. */
export interface SyncProgress {
 done: boolean; processed: number; newDocuments: number; updatedDocuments: number;
 inaccessibleDocuments: number; hasMore: boolean; error: string | null;
}
export type StepOutcome = Omit<SyncProgress, 'error'>;

/** A source connector: implements one short, resumable step of "sincronizar conexión". */
export interface SourceConnector {
 source: ConnectionRow['source'];
 /** True when the user has authorised this source (credentials available). */
 isReady(userId: string): Promise<boolean>;
 /** Initial persisted progress for a new run. */
 initialProgress(connection: ConnectionRow): unknown;
 /** Advance the run a little; must persist progress or finish the run itself. Never use AI; skip unchanged hashes. */
 step(ctx: { db: Db; userId: string; run: SyncRunRow; connection: ConnectionRow }): Promise<StepOutcome>;
 /** Translate an error to a user message; `disconnect` when re-authorisation is required. */
 describeError(error: unknown): { message: string; disconnect: boolean };
}
