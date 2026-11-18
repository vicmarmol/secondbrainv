<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Prototype architecture
- Render assistant text (including streaming) with the shared react-markdown renderer and skipHtml; keep user messages plain text to avoid executing raw HTML.
- UI components consume `src/services` only; services are migrated feature by feature from fixtures in `src/data` to Lovable Cloud tables (Library, Connections and Chat use real data), mapping lowercase DB enums to display labels in `src/types`, so the UI stays independent of storage.
- Every app table carries `user_id` (default `auth.uid()`) and RLS limits authenticated users to their own rows; anon has no access. App pages live under `src/routes/_authenticated/` so they require a session.
- New users get one connections row per source from an `auth.users` trigger; example data is only inserted per user by the `load_sample_data()` RPC (Ajustes), and never influence production chat responses unless they are explicitly loaded.
- Use the shared SecondBrainApp shell for all content routes; the chat is the implemented first stage and the other destinations explicitly represent future stages.
- Keep all visual tokens and reusable layouts in `src/styles.css`; the light/dark selector switches the document class without external persistence.
- Notion uses App User Connector OAuth through authenticated server functions, a one-time user-bound nonce, and encrypted server-only connection keys keyed by user/connector; never fall back to project provider credentials. Sync uses short persisted steps and per-user cursors to avoid long invocations.
- Persist the complete Notion discovery inventory across 50-page batches; reconcile inaccessible documents atomically with successful full-scan completion, never on partial/error runs. Keep owner-readable rows, hide them by default in Library, and filter both chat retrieval RPCs and full-content reads.

- Chat answers use the authenticated `/api/chat-answer` TanStack server route, model-extracted bilingual topic phrases joined with OR for Spanish invoker full-text retrieval (title-weighted ts_rank_cd, up to eight documents), and streamed structured Lovable AI Responses; preserve and persist retrieved excerpts so users can audit the exact context without exposing other users’ documents.
- Temporal chat queries use a separate invoker RPC sorted by source_modified_at, optional topic OR filter and Europe/Madrid calendar periods (Monday weeks); leave ordinary document retrieval unchanged and include each cited document's source modification date.
- After document retrieval, read full content with the authenticated RLS client; send short documents whole and select question-relevant approximately 800-character passages for long documents, capped at 6000 characters per document and 15000 total, preserving titles, dates and exact sent text in answer metadata.
- Resolve follow-ups server-side from the last four persisted messages in the same authenticated conversation before topic/date retrieval; preserve the original user message and pass recent history to answering so references stay coherent without trusting browser-supplied history.

- Billing uses immutable per-user trials and server-owned Stripe subscription rows; restrictive RLS and server checks enforce access independently of the UI. Only live subscriptions grant paid access; test purchases never unlock production data.
- Payments use the shared gateway Stripe client, signed public webhooks and authenticated embedded checkout; user identity and price are derived server-side to prevent tampering.
