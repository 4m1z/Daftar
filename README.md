# Notes

- A standalone, SSR-rendered note-taking application built with Solid 2.
- Notes are stored in a local SQLite database
- features:
   - Markdown, syntax highlighting, Mermaid diagrams
   - Excalidraw drawings, Vim keybindings
   - search, autosave, split preview, and light/dark themes

## Requirements

- Node.js 22 or newer

## Setup

```sh
cp .env.example .env
npm install
npm run setup
npm run dev
```

Open <http://localhost:3000>. The app starts empty; select **New notebook** to create your first note.

## Production

```sh
npm run build
npm start
```

Set `DATABASE_URL` to a persistent SQLite file before running `npm run setup`. This standalone version intentionally has no accounts or authentication, so do not expose it directly to an untrusted network without adding access control.

## Tests

```sh
npm test
npm run typecheck
```

## License

MIT. See [LICENSE.md](./LICENSE.md).
