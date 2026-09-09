# AGENTS.md — Daftar

## What this repo is

Daftar is a standalone Solid 2 note-taking app (SQLite + Prisma + CodeMirror + Excalidraw + Mermaid) extracted
from the notes section of the personal site repo at `~/Personal/amirahmadzadeh.com`.

The editor lives here. The blog repo is upstream for notes UX/features; Daftar is the extracted, self-contained
product (no auth, no blog/calendar/projects, single-user local SQLite).

## Source of truth for notes features

- Upstream repo: `~/Personal/amirahmadzadeh.com` (git remote `git@github.com:4m1z/my-personal-blog.git`).
- Notes code there lives under `src/routes/notes/`, plus:
  - `src/components/editor/`, `src/components/layout/` (`notebook-sidebar`, `notes-list-sidebar`,
    `mobile-notes-navigation`, `notebook-filter-tabs`), `src/components/feedback/notes-*`,
    `src/components/dialogs/*`, `src/components/ui/icons.tsx` (notes icons only)
  - `src/lib/actions/notes.ts`, `src/lib/hooks/use-notes-*.ts`, `src/lib/context/notes-workspace.tsx`,
    `src/lib/utils/notes.ts`, `src/lib/types/notes.ts`, `src/lib/constants/notes.ts`
  - `src/models/notes-workspace.server.ts`, `prisma/schema.prisma` (`Notebook`/`Note` models only),
    `src/tailwind.css` (`.notes-*` / `.db-page` styles only)
- This repo (Daftar, remote `git@github.com:4m1z/My-notes-app.git`) mirrors those paths, except routes are
  flattened: upstream `src/routes/notes/<x>.tsx` → here `src/routes/<x>.tsx`
  (`layout`, `notebook-layout`, `notebook-index`, `note-layout`, `note-mode`, `index`).

## Daftar simplifications (preserve on every sync)

- No auth/session: drop `getAdminUser()` / `userId` params. Model functions take plain ids
  (e.g. `renameNotebook(id, name)`), queries are unscoped.
- No `User`/`Post`/`Project`/`Task`/`AIUsage` models, no daily-note `date` field, no calendar/blog/manage code.
- No `SidebarLayout`, no `/p` prefix, no `getDeviceLayout`/`getNotesData` preload dance beyond `src/lib/actions/notes.ts`.
- Router (`src/router.ts`) uses static imports, not `lazy()` — the upstream Firefox hydration fix
  (`c9cfaf0`, async `LazyRouteChildren` → `lazy()`) does not apply here; do not reintroduce it.
- Keep `Title: Daftar`, keep `data/` + `*.db` gitignored, keep single-user seed (`prisma/seed.ts`, `showcase-note.md`).

## "check amirahmadzadeh.com" workflow

When the user says "check amirahmadzadeh.com" (or "sync notes from the blog", etc.):

1. In the upstream repo, list commits newer than the last sync point:
   `git -C ~/Personal/amirahmadzadeh.com log --oneline --since="<last-sync-date>"`
   Last sync point: upstream `0d4860c` ("refactor: switch to config based routing", 2026-08-24)
   ≡ Daftar `cd76c39` ("refactor: switch to config base routing", 2026-08-23).
2. Filter to notes commits: touched paths under the notes list above, or messages mentioning
   note/notebook/editor/autosave/sidebar/workspace. Use `git show --stat <sha>` to confirm.
3. Skip non-notes commits (blog/about/projects/public UI/post management). Known examples:
   `51431a4` (public UI), `f57c7df` (post focus mode) — do not sync.
4. Apply each notes commit here, adapted per "Daftar simplifications":
   - New files: copy then strip upstream-only concerns (auth, `/p/notes` links → `/notes/...` or `/`).
   - Prisma: add fields to Daftar's `Notebook`/`Note`, create a new migration
     (`prisma/migrations/<timestamp>_<name>/migration.sql`), run `bun run setup`.
   - Keep/extend tests: `src/lib/hooks/*.test.ts`, `src/lib/utils/*.test.ts`.
5. Verify: `bun run test` and `bun run typecheck` must pass. Then commit per change.

## Commands

- `bun install`, `bun run setup` (generate + migrate + seed), `bun run dev` (localhost:3000)
- `bun run build`, `bun run start` (prod), `docker compose up --build` (localhost:8080)
- `bun run test`, `bun run typecheck`
- Never expose this app to an untrusted network (no auth).

## Already synced (do not re-apply)

Upstream notes work up to `0d4860c` is already in Daftar, including: config-based routing, selection
preservation on create, tailwind tidy, nested notes UI, autosave preservation, deferred editor deps,
compressed/cached assets, dead-code removal, theme icons/context, server-side notes layout, shared
components/lib organization, prisma note model renames, persisted note search in URL, responsive notes
CSS, loading skeleton, editor mode toggle.

## Pending upstream notes commits (synced 2026-09-09)

- `c9cfaf0` fix: prevent Firefox notes hydration truncation — NOT APPLICABLE (static imports here).
- `e86bb53` feat: add ability to archive notebook — synced (isArchived + filter tabs + archive/restore).
- `5e66efe` fix: two-argument createEffect for notebook filter reveal — synced.
- `0ef91c6` feat: improve UX of notes & styles — synced (pane layout, editor pane, skeleton, tailwind).
- `51431a4`, `f57c7df` — non-notes, intentionally skipped.
- `c860cc8` fix: preview blinking on editor update — synced (diagram markup cache + no-clear re-render).
