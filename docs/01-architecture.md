# 01 — Architecture

## Tech Stack

| Layer      | Technology                     | Rationale                                                                                  |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| Runtime    | Bun (latest, >= 1.4)           | Runtime, package manager, test runner, and script runner in one binary                     |
| Framework  | SvelteKit 2 + Svelte 5         | SSR-capable, file-based routing, runes for fine-grained reactivity                         |
| Language   | TypeScript (strict mode)       | Type safety across API boundaries                                                          |
| Styling    | Tailwind CSS v4                | Utility-first, design tokens via `@theme`, small output                                    |
| Icons      | Font Awesome 6 Free            | Consistent SVG icon set, tree-shakable per-icon imports                                    |
| Database   | PostgreSQL (Supabase)          | Managed auth, RLS for per-user isolation, JSONB for CV data                                |
| AI access  | OpenAI-compatible HTTP adapter | Most providers (OpenAI, OpenRouter, Groq, Ollama, LM Studio) expose `/v1/chat/completions` |
| Validation | Zod                            | Single source of truth for CV schema and settings forms                                    |
| Testing    | Vitest + Playwright            | Unit and E2E coverage                                                                      |

## System Overview

```
Browser (SvelteKit client)
  |
  |  HTTPS, session cookie
  v
SvelteKit server (Bun) -------------------> Supabase Postgres
  |  - /api/ai proxy                          - users
  |  - decrypts user AI token in memory       - ai_credentials (ciphertext)
  |  - never persists prompts/responses       - resumes (jsonb)
  |
  v
User-configured AI endpoint (OpenAI-compatible)
```

Key architectural decision: **AI calls are proxied server-side.** The user
enters the endpoint and token once over HTTPS; the token is encrypted and
stored. All subsequent AI requests originate from the server. The plaintext
token never reaches the browser again.

## Design Patterns and Justification

| Pattern    | Applied to                                 | Why it fits                                                                                                                                                               |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adapter    | `AiProviderAdapter` interface              | Providers drift in details (model listing, error shapes). One interface, swappable implementations (OpenAI-compatible now, Anthropic later) without touching feature code |
| Repository | `ResumeRepository`, `CredentialRepository` | Isolates Supabase queries behind interfaces; swappable for tests and future storage changes                                                                               |
| Gate/Guard | `requireAiCredentials` route guard         | The mandatory endpoint+token rule is enforced in exactly one place, not scattered across pages                                                                            |
| Strategy   | AI prompt builders                         | Each AI action (summary, rewrite, tailor) is a self-contained strategy; adding actions does not modify existing ones                                                      |

## Complexity Notes

- Autosave: debounced at 800 ms — O(1) timer reset per keystroke, one
  network write per idle period, not per change.
- Resume list rendering: O(n) over user resumes; n is small (tens), so no
  virtualization is warranted (YAGNI).
- AI streaming: pass-through `ReadableStream` from upstream — O(1) memory
  beyond the buffer window.
- Credential decryption: O(1) per request, AES-256-GCM.

## Project Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── ai/                  # Adapter pattern implementation
│   │   │   ├── adapter.ts       # AiProviderAdapter interface
│   │   │   ├── openai-compat.ts # OpenAI-compatible implementation
│   │   │   └── crypto.ts        # AES-256-GCM encrypt/decrypt for tokens
│   │   ├── repositories/        # Repository pattern
│   │   │   ├── resumes.ts
│   │   │   └── credentials.ts
│   │   └── auth/                # Session helpers, route guards
│   ├── ai/
│   │   ├── strategies/          # Prompt builders per action
│   │   └── schemas.ts           # Zod: AI request/response contracts
│   ├── components/
│   │   ├── ui/                  # Button, Input, Card, Modal, Toast...
│   │   └── resume/              # Editor panels, preview renderer
│   ├── stores/                  # Client state (runes-based)
│   ├── types/                   # Shared domain types
│   └── validation/              # Zod schemas shared client/server
├── routes/
│   ├── (marketing)/             # Landing page
│   ├── (auth)/                  # /login, /register
│   ├── (app)/                   # Authenticated shell + guard
│   │   ├── dashboard/
│   │   ├── editor/[id]/
│   │   └── settings/            # Mandatory AI credentials form
│   └── api/
│       ├── ai/chat/             # Streaming proxy endpoint
│       └── ai/verify/           # Endpoint+token validation
└── app.css                      # Tailwind entry, @theme tokens
```

## Module Rules

- Files stay under 300 lines; split by responsibility, not by size alone.
- `lib/server/**` is never imported from client code — enforced by path
  convention and reviewed in CI.
- All external data crossing the network boundary passes Zod validation.
- No hardcoded configuration: endpoint defaults, token TTLs, and the
  encryption key come from environment variables (validated at startup).
