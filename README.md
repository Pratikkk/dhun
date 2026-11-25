# dhun

> Every song on JioSaavn, one command away.

`dhun` is a tiny terminal tool that searches, previews and downloads music from
JioSaavn — full songs up to 320 kbps, with cover art and metadata baked into
every file.

This repository hosts the **dhun website** — the official landing page and live
demo, built with Next.js.

## What's on the site

- **Landing page** — hero, feature tour, command cheatsheet, install guide, FAQ
- **Live demo** — the search box on the site talks to the same JioSaavn query
  engine the CLI uses: search for a song, preview it, and download the real
  MP3 right in the browser

### Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (New York style)
- Framer Motion animations, Lucide icons

## Run the website locally

```console
git clone https://github.com/Pratikkk/dhun.git
cd dhun
bun install     # or: npm install
bun run dev     # → http://localhost:3000
```

The site needs no database — the live demo calls JioSaavn's public API
server-side through `/api/search` and `/api/download`.

Optional — only if you plan to build on the bundled Prisma/SQLite setup:

```console
cp .env.example .env
bun run db:push
```

### Project structure

```
src/
  app/                  # App Router pages + API routes
    api/search/         #   search the JioSaavn catalog
    api/download/       #   fetch a track and stream it back
  components/site/      # landing sections (hero, install, demo, FAQ, …)
  components/ui/        # shadcn/ui primitives
  lib/saavn.ts          # JioSaavn query engine (search, streams, artwork)
  hooks/                # use-toast, use-mobile
```

## The CLI

dhun is pure Python and installs from this repository with a single command:

```console
pip install git+https://github.com/Pratikkk/dhun.git
```

Verify the install, then take it for a spin:

```console
dhun --version
dhun search "kesariya"
dhun download kesariya --quality 320
```

## License

MIT — see [LICENSE](./LICENSE).
