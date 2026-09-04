# 02 — Data Model, Authentication, and AI Integration

## Database (MySQL 8.0+)

This project uses a local MySQL 8.0+ instance managed via `mysql2` + Kysely.
Schema lives in `db/migrations/0001_init.sql`; apply with:

```sh
mysql -u Jayz -pJayz cv_generator < db/migrations/0001_init.sql
```

### Tables

```sql
users                          -- local auth (scrypt-hashed passwords)
  id            varchar(36) PK
  email         varchar(255) unique
  password_hash varchar(255)  -- scrypt$N$salt$hash
  created_at    varchar(40)   -- ISO-8601 UTC

ai_credentials
  user_id            varchar(36) PK FK -> users(id) ON DELETE CASCADE
  endpoint_url       varchar(2048) NOT NULL
  api_token_cipher   mediumtext   NOT NULL  -- AES-256-GCM ciphertext+tag (base64)
  api_token_nonce    varchar(64)  NOT NULL  -- 12-byte GCM nonce (base64)
  model              varchar(255) NULL
  last_verified_at   varchar(40)  NULL
  updated_at         varchar(40)  NOT NULL

resumes
  id         varchar(36) PK
  user_id    varchar(36) NOT NULL FK -> users(id) ON DELETE CASCADE
  title      varchar(255) NOT NULL
  content    json NOT NULL                -- ResumeData, Zod-validated on every write
  created_at varchar(40) NOT NULL
  updated_at varchar(40) NOT NULL
  UNIQUE (user_id, title)
```

Per-user isolation is enforced **at the application layer** by routing every
query through a `Repository` that filters on `user_id = session.userId`.
(The RLS rules from the original Supabase design are preserved in concept;
in MySQL they are expressed as repository-side guard clauses plus a unique
key on `(user_id, title)`.)

## Authentication

- Custom session: scrypt password hash + HMAC-SHA256 signed token
  (`<payload>.<signature>`, base64url, httpOnly cookie `cv_session`).
- `hooks.server.ts` verifies the cookie on every request and exposes
  `locals.session = { userId, email } | null`.
- Route groups enforce access:
  - `(app)/**` — server-side guard redirects unauthenticated users to `/login`.
  - `(auth)/**` — redirects authenticated users to `/dashboard`.

## AI Credentials — the Mandatory BYOK Gate

Business rule: **AI features do not exist until the user configures an
endpoint and token.** Enforced in one place:

1. `+layout.server.ts` under `(app)/` reads `ai_credentials` for the user.
2. If no row exists and the current route is not `/settings`, the layout
   sets `settingsRequired: true`; a persistent banner is rendered until
   the user visits `/settings`.
3. `/settings` form posts endpoint URL + token over HTTPS, the server
   verifies by calling `GET {endpoint}/models`, then encrypts and stores
   the token. Verification failure is surfaced to the user — no silent
   acceptance.
4. Editor / dashboard AI panels render a locked state when unconfigured.

Nothing else needs to know about this rule — adding a new AI-powered page
automatically inherits the gate.

### Credential Lifecycle

| Step       | Behavior                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry      | Settings form posts endpoint URL + token over HTTPS                                                                                                                              |
| Validation | Server calls `GET {endpoint}/models` with a short-lived Authorization header; on failure, form rejects with the upstream status — fail loudly, no silent acceptance              |
| Storage    | Token encrypted with AES-256-GCM using `AI_TOKEN_ENC_KEY` (env); endpoint URL stored in plaintext (not secret), model optional                                                   |
| Read-back  | The UI shows only `endpoint_url`, model, and `last_verified_at`. The token field is always empty with a masked placeholder — the plaintext token is never returned to the client |
| Rotation   | Re-entering the form overwrites the ciphertext; `updated_at` bumps                                                                                                               |
| Deletion   | A "Remove" form action deletes the row and re-triggers the mandatory gate on next navigation                                                                                     |

## AI Adapter (Adapter Pattern, M2/M4)

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

## AI Feature Strategies (Strategy Pattern, M4)

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

- Secrets in env only: `DATABASE_URL`, `SESSION_SECRET`,
  `AI_TOKEN_ENC_KEY`. Never in client bundles.
- Plaintext AI tokens exist only in server memory for the duration of a
  proxied request.
- CSP: `default-src 'self'`; no third-party scripts.
- Rate limiting on `/api/ai/*` per user (token bucket, e.g. 30 req/min)
  to protect both the server and the user's own AI quota.
- Audit log (append-only) records credential changes: `user_id`, action
  (`set`, `rotate`, `delete`), timestamp — never the token itself.
