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
export interface Destination { id: string; label: string }
/** What a source created; the shared writer stores it in the Library exactly like a sync would. */
export interface CreatedDocument { externalId: string; url: string; title: string; content: string; modifiedAt: string }
export interface SourceConnector {
 source: ConnectionRow['source'];
 /** Every connector reads; `create` is optional and declared explicitly. */
 capabilities: { read: true; create: boolean };
 /** Only when capabilities.create: reasonable places to create a document. */
 listDestinations?(ctx: { db: Db; userId: string }): Promise<Destination[]>;
 /** Only when capabilities.create: write the user's verbatim text; content must equal what `step` would read back. */
 createDocument?(ctx: { userId: string; destinationId: string; title: string; content: string }): Promise<CreatedDocument>;
 /** Undo a creation when it could not be stored locally, so nothing is left half-saved. */
 removeDocument?(ctx: { userId: string; externalId: string }): Promise<void>;
 /** True when the user has authorised this source (credentials available). */
 isReady(userId: string): Promise<boolean>;
 /** Initial persisted progress for a new run. */
 initialProgress(connection: ConnectionRow): unknown;
 /** Advance the run a little; must persist progress or finish the run itself. Never use AI; skip unchanged hashes. */
 step(ctx: { db: Db; userId: string; run: SyncRunRow; connection: ConnectionRow }): Promise<StepOutcome>;
 /** Translate an error to a user message; `disconnect` when re-authorisation is required. */
 describeError(error: unknown): { message: string; disconnect: boolean };
}
