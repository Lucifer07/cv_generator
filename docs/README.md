# CV Generator — Technical Specification

A web application for building professional, ATS-friendly resumes with
AI-assisted content generation. Built with SvelteKit, Tailwind CSS, and
Font Awesome. Minimalist, modern UI with zero emoticons in the interface.

## Core Concept

- Each user account brings its own AI credentials (BYOK — Bring Your Own Key).
- The AI endpoint URL and API token are **mandatory** per-account settings.
  The application gates all AI features until both are configured.
- AI credentials are stored encrypted at rest and never returned to the
  browser after submission.
- Resume data is persisted per account; PDF export is available for every
  saved resume.

## Document Index

| Document                                 | Contents                                                     |
| ---------------------------------------- | ------------------------------------------------------------ |
| [01-architecture.md](01-architecture.md) | Tech stack, system design, patterns, project structure       |
| [02-data-and-ai.md](02-data-and-ai.md)   | Data model, authentication, BYOK AI integration, security    |
| [03-ui-design.md](03-ui-design.md)       | Design system, pages and routing, component inventory        |
| [04-roadmap.md](04-roadmap.md)           | Milestones, PDF export strategy, testing, definition of done |

## Quick Summary

| Aspect          | Decision                                                       |
| --------------- | -------------------------------------------------------------- |
| Runtime         | Bun (latest, >= 1.4) — runtime, package manager, script runner |
| Framework       | SvelteKit (Svelte 5, runes-based state)                        |
| Styling         | Tailwind CSS v4, design tokens in `@theme`                     |
| Icons           | Font Awesome 6 Free (SVG via `@fortawesome/fontawesome-free`)  |
| Language        | TypeScript (strict)                                            |
| Persistence     | PostgreSQL + Supabase (Auth, DB, RLS)                          |
| AI access       | Server-proxied, OpenAI-compatible endpoint adapter (per-user)  |
| PDF export      | Client-side print stylesheet (MVP); optional server-side later |
| Design language | Minimalist, modern, neutral palette, no emoticons              |

## Non-Goals (v1)

- Multi-page visual resume builders with drag-and-drop canvases.
- Team/organization accounts or resume sharing links.
- Template marketplace.
- Bundled, platform-managed AI keys — every user supplies their own.
