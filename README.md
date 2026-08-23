# Daftar

📝 Solid 2 note-taking app powered by SQLite, built for writing & taking notes.

Enjoy rich Markdown, syntax highlighting, Mermaid diagrams, Excalidraw sketches, Vim keybindings,  search, autosave, split preview, and dark & light themes, all in one focused workspace.

<img width="1672" height="941" alt="daftar-dual-theme-poster" src="https://github.com/user-attachments/assets/2d9c21bb-4033-4f4c-98e8-4ff381804ec8" />

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
