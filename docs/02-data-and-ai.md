# 02 — Data Model, Authentication, and AI Integration

## Data Model

```sql
users                          -- managed by Supabase Auth
  id            uuid PK
  email         text unique
  created_at    timestamptz

ai_credentials
  user_id            uuid PK REFERENCES users(id) ON DELETE CASCADE
  endpoint_url       text NOT NULL          -- e.g. https://api.openai.com/v1
  api_token_cipher   bytea NOT NULL         -- AES-256-GCM ciphertext
  api_token_nonce    bytea NOT NULL         -- 12-byte GCM nonce
  model              text                   -- optional default model id
  last_verified_at   timestamptz
  updated_at         timestamptz

resumes
  id            uuid PK DEFAULT gen_random_uuid()
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
  title         text NOT NULL
  content       jsonb NOT NULL              -- ResumeData, Zod-validated
  created_at    timestamptz
  updated_at    timestamptz
  UNIQUE (user_id, title)
```

`resumes.content` (JSONB) shape, enforced by Zod on every write:

```ts
interface ResumeData {
  basics:   { fullName, headline, email, phone, location, website, summary }
  experience: Array<{ company, role, start, end, current, bullets[] }>
  education:  Array<{ institution, degree, start, end }>
  skills:     string[]
  projects:   Array<{ name, description, link? }>
}
```

Row Level Security: every table enables RLS with `user_id = auth.uid()`.
No policy exposes another user's rows — this is the tenant isolation layer.

## Authentication

- Supabase Auth (email + password). Session flows through `@supabase/ssr`
  with httpOnly cookies.
- Route groups enforce access:
  - `(app)/**` — server-side guard redirects unauthenticated users to `/login`.
  - `(auth)/**` — redirects authenticated users to `/dashboard`.
- No OAuth providers in v1; the adapter seam in `lib/server/auth` keeps the
  door open without building it now (YAGNI).

## AI Credentials — the Mandatory BYOK Gate

Business rule: **AI features do not exist until the user configures an
endpoint and token.** Enforced in one place:

1. `requireAiCredentials(event)` runs in the `(app)` layout `+layout.server.ts`.
2. If `ai_credentials` has no row for the user, redirect to `/settings?required=1`.
3. `/settings` shows a persistent banner until verification succeeds.
4. Dashboard and editor AI panels render a locked state when unconfigured.

Nothing else needs to know about this rule — adding a new AI-powered page
automatically inherits the gate.

### Credential Lifecycle

| Step       | Behavior                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry      | Settings form posts endpoint URL + token over HTTPS                                                                                                                              |
| Validation | Server calls `GET {endpoint}/models` (or a 1-token chat ping); on failure, form rejects with the upstream status — fail loudly, no silent acceptance                             |
| Storage    | Token encrypted with AES-256-GCM using `AI_TOKEN_ENC_KEY` (env/KMS); endpoint URL stored in plaintext (not secret), model optional                                               |
| Read-back  | The UI shows only `endpoint_url`, model, and `last_verified_at`. The token field is always empty with a masked placeholder — the plaintext token is never returned to the client |
| Rotation   | Re-entering the form overwrites the ciphertext; `updated_at` bumps                                                                                                               |
| Deletion   | Deleting the row re-triggers the mandatory gate on next navigation                                                                                                               |

## AI Adapter (Adapter Pattern)

```ts
interface AiProviderAdapter {
	verifyCredentials(cfg: CredentialConfig): Promise<VerifyResult>;
	chat(cfg: CredentialConfig, req: ChatRequest): Promise<ReadableStream<ChatChunk>>;
}
```

- v1 ships one implementation: `openai-compat.ts`, targeting
  `POST {endpoint}/chat/completions` with `stream: true`.
- Because the endpoint is user-supplied, the server enforces:
  - HTTPS-only endpoint URLs (reject `http://` except `localhost` for local models).
  - 30 s connect timeout, 120 s total timeout.
  - Response size cap (e.g. 2 MB) to bound memory.
  - SSRF guard: resolve the host and reject private/link-local ranges
    (except explicitly allowlisted localhost for Ollama/LM Studio users).

## AI Feature Strategies (Strategy Pattern)

Each feature is a prompt-building strategy that produces a system prompt
plus the user's resume context, then streams the result into the editor.

| Strategy  | Input                         | Output placed into         |
| --------- | ----------------------------- | -------------------------- |
| `summary` | Raw notes / bullet fragments  | `basics.summary`           |
| `rewrite` | Selected experience bullet(s) | Replaced bullet text       |
| `tailor`  | Pasted job description        | Suggested edits diff panel |
| `review`  | Full `ResumeData`             | Inline findings list       |

Rules:

- Strategies never see or handle credentials — the adapter layer does.
- Model default comes from saved settings; the editor exposes a per-request
  model override (text input, since endpoints differ in catalog).
- All AI output is inserted as **editable suggestion**, never auto-saved;
  the user applies or discards (human-in-the-loop, avoids silent mutations).

## Security Checklist

- Secrets in env only: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  (server-only), `AI_TOKEN_ENC_KEY`. Never in client bundles.
- Plaintext AI tokens exist only in server memory for the duration of a
  proxied request.
- CSP: `default-src 'self'`; no third-party scripts.
- Rate limiting on `/api/ai/*` per user (token bucket, e.g. 30 req/min)
  to protect both the server and the user's own AI quota.
- Audit log (append-only) records credential changes: `user_id`, action
  (`set`, `rotate`, `delete`), timestamp — never the token itself.
