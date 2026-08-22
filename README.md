# Daftar

A standalone Solid 2 note-taking app backed by SQLite, with Markdown, syntax highlighting, Mermaid, Excalidraw, Vim keybindings, search, autosave, split preview, and themes.

## Requirements

- Bun 1.2.23+ or Docker

## Setup

```sh
cp .env.example .env
bun install
bun run setup
bun run dev
```

Open <http://localhost:3000>. Fresh databases include a showcase note that tours Daftar's features.

## Production

```sh
bun run setup
bun run build
bun run start
```

Set `DATABASE_URL` to a persistent SQLite file. This app has no authentication, so do not expose it to an untrusted network.

### Docker

```sh
docker compose up --build
```

Open <http://localhost:8080>. The SQLite database is persisted in `./data/notes.db`, and pending Prisma migrations are applied whenever the container starts.

## Tests

```sh
bun run test
bun run typecheck
```

## License

MIT. See [LICENSE.md](./LICENSE.md).
