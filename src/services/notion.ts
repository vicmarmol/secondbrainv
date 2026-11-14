import { beginNotionSync, getNotionState, stepNotionSync } from '@/lib/notion.functions';
export { startNotionConnect, completeNotionConnect, disconnectNotion } from '@/lib/notion-oauth.functions';

export type NotionState = Awaited<ReturnType<typeof getNotionState>>;
export type NotionProgress = Awaited<ReturnType<typeof stepNotionSync>>;
// The view supplies router-aware calls; components never access storage or secrets.
export async function syncNotion(
 begin: () => Promise<string>,
 step: (input: { data: { runId: string } }) => Promise<NotionProgress>,
 onProgress: (progress: NotionProgress) => void,
) {
 const runId = await begin();
 for (;;) {
  const progress = await step({ data: { runId } });
  onProgress(progress);
  if (progress.error) throw new Error(progress.error);
  if (progress.done) return progress;
 }
}
export { beginNotionSync, getNotionState, stepNotionSync };