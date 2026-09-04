# 04 — Roadmap, PDF Export, and Testing

## Milestones

| Phase | Scope                                                                                  | Exit Criteria                                                                                   |
| ----- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| M0    | Scaffold SvelteKit + Tailwind v4 + Font Awesome; CI (lint, typecheck)                  | `bun run dev` serves landing page; CI green                                                     |
| M1    | Auth (register/login/logout); `(app)` route guard; Supabase schema + RLS               | Unauthenticated access to `(app)` redirects to `/login`                                         |
| M2    | Settings page: AI endpoint + token entry, AES-GCM storage, verify flow, mandatory gate | Unconfigured users are routed to `/settings?required=1`; verify fails loudly on bad credentials |
| M3    | Resume CRUD + editor (all sections) + live preview + debounced autosave                | Create/edit/delete resume; autosave persists across reloads                                     |
| M4    | AI features: streaming proxy, summary/rewrite/tailor/review strategies                 | Suggestions stream into editor; apply/discard works; rate limit active                          |
| M5    | PDF export via print route; QA pass; a11y audit                                        | Exported PDF matches preview; Lighthouse a11y >= 95                                             |

## PDF Export Strategy

MVP (client-side, zero new dependencies):

1. `/editor/[id]/print` renders `<ResumePreview>` in an A4-sized page
   context (210 mm width, `print-color-adjust: exact`).
2. A dedicated `@media print` stylesheet hides the app shell; the route
   triggers `window.print()` on load via a single user click ("Download
   PDF" → print dialog with "Save as PDF").
3. Rationale: browser print engines produce selectable-text, ATS-parsable
   PDFs with perfect font fidelity, and avoid shipping a heavyweight
   client renderer. Trade-off: exact pagination control is limited.

Deferred (only if users need pixel-perfect pagination): server-side
rendering of the same preview HTML with headless Chromium (Playwright)
behind a job queue. The print route is already the single source of
truth, so this upgrade does not touch feature code.

## Testing Strategy

| Layer       | Tool       | What is covered                                                                                    |
| ----------- | ---------- | -------------------------------------------------------------------------------------------------- |
| Unit        | Vitest     | Zod schemas, AES-GCM round-trip, prompt strategies, resume reducer                                 |
| Integration | Vitest     | Repositories against a disposable Postgres; RLS policies                                           |
| E2E         | Playwright | Auth flow, mandatory-gate redirect, settings verify (mocked AI), editor autosave, PDF route render |
| Contract    | Vitest     | `AiProviderAdapter` against recorded OpenAI-compatible fixtures                                    |

Non-negotiable test cases:

- Encryption: ciphertext in DB never equals plaintext; decryption requires
  `AI_TOKEN_ENC_KEY`; wrong key fails loudly.
- Gate: every `(app)` route is unreachable without saved credentials when
  the rule demands it (regression test per new route).
- AI proxy: plaintext token never appears in responses, logs, or client
  network payloads.
- Emoji lint: build fails if emoji codepoints enter `src/`.

## CI Pipeline (GitHub Actions)

1. `bun run lint` (Prettier + ESLint; Bun v1.4+ as runtime and package manager)
2. `bun run check` (svelte-check — typecheck across .svelte/.ts)
3. `bun run build` with strict env validation (missing env fails the build)
4. Emoji lint (grep on `src/`) + icon-map conformance check

## Definition of Done (per feature)

- TypeScript strict, zero `any`; files under 300 lines.
- Zod validation on every network boundary.
- Unit + E2E coverage for the acceptance path.
- Keyboard reachable, focus-visible, no emoji in copy.
- No hardcoded config or secrets; env validated at startup.
- Documentation updated in `docs/` when architecture changes.

## Environment Variables

| Variable                    | Scope  | Purpose                                      |
| --------------------------- | ------ | -------------------------------------------- |
| `PUBLIC_SUPABASE_URL`       | client | Supabase project URL                         |
| `PUBLIC_SUPABASE_ANON_KEY`  | client | Supabase anon key (RLS still applies)        |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Server-side DB access                        |
| `AI_TOKEN_ENC_KEY`          | server | 32-byte key for AES-256-GCM token encryption |
| `AI_PROXY_RATE_LIMIT_RPM`   | server | Per-user AI proxy rate limit (default 30)    |
