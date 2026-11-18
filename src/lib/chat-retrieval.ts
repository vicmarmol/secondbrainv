import { questionWords } from './chat-answer';

/** Retry only an empty successful lookup; never broaden after an error or outside date bounds. */
export async function retrieveWithFallback<T>(question: string, primaryQuery: string, search: (query: string) => Promise<{ data: T[] | null; error: unknown }>, allowFallback = true) {
 const attempts: { query: string; count: number }[] = [];
 let query = primaryQuery;
 let result = await search(query);
 attempts.push({ query, count: result.data?.length ?? 0 });
 if (!result.error && !result.data?.length && allowFallback) {
  const fallback = questionWords(question).join(' OR ');
  if (fallback && fallback !== query) {
   query = fallback;
   result = await search(query);
   attempts.push({ query, count: result.data?.length ?? 0 });
  }
 }
 return { ...result, query, attempts };
}