# 03 — UI Design System, Pages, and Components

## Design Principles

- Minimalist: one accent color, neutral surfaces, generous whitespace,
  maximum two type weights per view.
- Modern: flat surfaces with subtle borders instead of heavy shadows;
  8 pt spacing grid; system-feel micro-interactions (150–200 ms ease-out).
- **No emoticons or emoji anywhere** — not in UI copy, empty states,
  buttons, toasts, or documentation strings. Icons come exclusively from
  Font Awesome. Enforced by lint: a CI grep fails the build on emoji
  codepoints in `src/`.

## Design Tokens (Tailwind v4 `@theme`)

```css
@import 'tailwindcss';

@theme {
	/* Neutral-first palette; single accent */
	--color-surface: #ffffff;
	--color-surface-alt: #fafafa;
	--color-border: #e4e4e7; /* zinc-200 */
	--color-ink: #18181b; /* zinc-900 */
	--color-ink-muted: #71717a; /* zinc-500 */
	--color-accent: #18181b; /* monochrome accent (v1) */
	--color-accent-soft: #f4f4f5;

	--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

	--radius-card: 0.75rem;
	--radius-control: 0.5rem;
}
```

- Typography scale: `text-sm` body, `text-base` editor, `text-lg/xl` section
  headings only. No decorative display fonts. Inter is self-hosted via
  `@fontsource-variable/inter` (no CDN).
- Focus states: 2 px `ring` in `--color-ink`, offset 2 px — keyboard
  visibility is part of the design, not an afterthought.
- Dark mode: v1 ships light-only; tokens are centralized so a `.dark`
  variant is a later token swap, not a rewrite.

## Iconography — Font Awesome 6

- Packages: `svelte-fa` (Svelte 5 `<Fa>` component) +
  `@fortawesome/fontawesome-svg-core` + `@fortawesome/free-solid-svg-icons`
  (per-icon named imports, tree-shaken; no webfont CSS is shipped).
- The canonical icon map lives in `src/lib/icons.ts` — components import
  from this map only; direct per-icon imports elsewhere are a lint
  violation.
- Sizes: `w-4 h-4` inline with text, `w-5 h-5` standalone controls.
- Every icon-only control requires `aria-label` and `title`.
- Canonical icon map (fixed — no one-off choices per screen):

| Concept           | Icon                               |
| ----------------- | ---------------------------------- |
| Dashboard         | `fa-solid fa-table-cells-large`    |
| New resume        | `fa-solid fa-plus`                 |
| Edit              | `fa-solid fa-pen`                  |
| Settings          | `fa-solid fa-sliders`              |
| AI actions        | `fa-solid fa-wand-magic-sparkles`  |
| Download / PDF    | `fa-solid fa-file-arrow-down`      |
| Key / credentials | `fa-solid fa-key`                  |
| Warning           | `fa-solid fa-triangle-exclamation` |
| Check / success   | `fa-solid fa-check`                |
| Close / dismiss   | `fa-solid fa-xmark`                |

## Pages and Routing

| Route                 | Purpose                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `/`                   | Landing: value proposition, two CTAs (Sign up, Log in)                                                           |
| `/register`, `/login` | Supabase email/password forms; inline field validation                                                           |
| `/settings`           | **Mandatory AI configuration**: endpoint URL, API token, optional model; verify button; shows masked saved state |
| `/dashboard`          | Resume list (title, updated time), create/delete/duplicate                                                       |
| `/editor/[id]`        | Split view: left = section editor forms, right = live preview                                                    |
| `/editor/[id]/print`  | Print-optimized preview route used as the PDF export source                                                      |

### Editor Layout (single screen, no page switches)

```
┌──────────────────────────────────────────────────────────┐
│ Header: title (inline-edit) | Save state | PDF | Settings│
├───────────────────────────┬──────────────────────────────┤
│ Section nav (vertical)    │  Live preview (A4 ratio)     │
│ Basics > Experience >     │  renders ResumeData via      │
│ Education > Skills >      │  <ResumePreview>             |
│ Projects                  │                              |
├───────────────────────────┴──────────────────────────────┤
│ AI panel (contextual): opens next to the focused field    │
└──────────────────────────────────────────────────────────┘
```

## Component Inventory (`lib/components/ui`)

| Component    | Contract (props → behavior)                                    |
| ------------ | -------------------------------------------------------------- |
| `Button`     | `variant: primary                                              | ghost | danger`, `icon?`, loading state |
| `Input`      | Label + error slot, `type`, masks token fields with `password` |
| `Card`       | Surface + border token wrapper, no shadow by default           |
| `Modal`      | Focus-trapped, closes on Escape, used for destructive confirms |
| `Toast`      | Store-driven, 3 s auto-dismiss, icon per severity              |
| `EmptyState` | Icon + one-line message + action button (text only, no emoji)  |
| `Badge`      | Save-state and verification-status chips                       |

## Client State

- Svelte 5 runes: local editor state lives in a `$state` class per resume
  document (`ResumeDocument`), mutated through named actions only —
  components never patch ad hoc. Undo/redo is a command stack over those
  actions (added in M3, seam prepared now).
- Server state is never duplicated: lists load via load functions;
  autosave writes `content` as a whole document (JSONB) — conflict
  strategy for v1 is last-write-wins with a stale-session warning.

## Accessibility and Quality Gates

- All interactive elements keyboard-reachable; visible focus rings.
- Color contrast: `--color-ink-muted` on `--color-surface` meets WCAG AA
  for body text; never use muted text below `text-sm`.
- Lighthouse CI budget: a11y >= 95 on all routes.
- Emoji lint (see above) and ESLint rule restricting icon imports to the
  canonical map keep the visual language consistent.
