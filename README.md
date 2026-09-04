# cv_generator

Web application for building professional, ATS-friendly resumes with
AI-assisted content generation. Each account connects its own AI endpoint
and token (BYOK); credentials are encrypted at rest and proxied
server-side.

## Stack

- SvelteKit 2 (Svelte 5, runes) + TypeScript strict
- Tailwind CSS v4 + Font Awesome (tree-shaken via svelte-fa)
- Bun as runtime and package manager
- Supabase (Postgres, Auth, RLS)

## Documentation

The full technical specification lives in [docs/README.md](docs/README.md).

## Development

```sh
bun install
cp .env.example .env
bun run dev
```

## Scripts

| Command            | Purpose                          |
| ------------------ | -------------------------------- |
| `bun run dev`      | Start the dev server             |
| `bun run build`    | Production build                 |
| `bun run preview`  | Preview the production build     |
| `bun run lint`     | Prettier + ESLint                |
| `bun run check`    | svelte-check (typecheck)         |
| `bun run format`   | Format the codebase              |
