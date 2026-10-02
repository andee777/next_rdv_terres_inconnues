# RDV Terres Inconnues — Map

An interactive world map of the episodes of _Rendez-vous en terre inconnue_, the French TV series in which a celebrity travels to live with a remote community. Every episode is a marker: click it to see the people visited, the destination, the guest, the broadcast date, and a link to watch the episode on YouTube.

**Live demo:** https://next-rdv-terres-inconnues.vercel.app/

## Features

- Full-screen Leaflet map with OpenStreetMap tiles (attribution included)
- Clustered markers that expand as you zoom in
- Per-episode popup built with [shadcn/ui](https://ui.shadcn.com) components: YouTube thumbnail (skeleton while it loads), people, destination, celebrity, broadcast date, duration, and a "Watch video" button
- The last-clicked marker is highlighted in red
- Light and dark themes that follow your system setting
- Episodes without a known video still appear on the map, just without a thumbnail or link

## Tech stack

| Area            | Choice                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | [Next.js](https://nextjs.org) 16 (App Router, Turbopack) with React 19                                                              |
| Language        | TypeScript 6 (strict)                                                                                                               |
| UI components   | [shadcn/ui](https://ui.shadcn.com) (`base-nova` style, built on [Base UI](https://base-ui.com)), [Lucide](https://lucide.dev) icons |
| Styling         | [Tailwind CSS](https://tailwindcss.com) 4, light/dark via `next-themes`                                                             |
| Map             | [Leaflet](https://leafletjs.com) with [react-leaflet](https://react-leaflet.js.org) 5 and `react-leaflet-cluster`                   |
| Package manager | [pnpm](https://pnpm.io) 11                                                                                                          |
| Quality         | ESLint 9, Prettier, Vitest, GitHub Actions CI                                                                                       |
| Hosting         | [Vercel](https://vercel.com)                                                                                                        |

## Getting started

**Prerequisites:** Node.js 22 or later and [pnpm](https://pnpm.io/installation). The pnpm version is pinned in `package.json` (`packageManager`).

```bash
git clone <repository-url>
cd next_rdv_terres_inconnues
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The page hot-reloads as you edit.

### Scripts

| Command          | What it does                                                         |
| ---------------- | -------------------------------------------------------------------- |
| `pnpm dev`       | Start the development server                                         |
| `pnpm build`     | Create a production build                                            |
| `pnpm start`     | Serve the production build                                           |
| `pnpm lint`      | Run ESLint (`pnpm lint:fix` to auto-fix)                             |
| `pnpm typecheck` | Generate Next.js types, then type-check with `tsc`                   |
| `pnpm format`    | Format everything with Prettier (`pnpm format:check` to only verify) |
| `pnpm test`      | Run the Vitest suite once (`pnpm test:watch` to watch)               |

> **Note:** `pnpm build` downloads the Geist font from Google Fonts, so it needs internet access.

CI (`.github/workflows/ci.yml`) runs lint, format check, typecheck, tests and build on every push to `main` and on pull requests.

## Project structure

```
├── app/
│   ├── layout.tsx              # Root layout, Geist font, theme provider, metadata
│   ├── page.tsx                # Home page (Server Component)
│   └── globals.css             # Tailwind, shadcn theme tokens, Leaflet CSS, popup styles
├── components/
│   ├── episode-map/
│   │   ├── episode-map.tsx     # Client wrapper: loads the map in the browser only
│   │   ├── map-view.tsx        # Leaflet map, clustered markers
│   │   ├── episode-popup.tsx   # Popup content (shadcn Card, Badge, Button, ...)
│   │   ├── marker-icons.ts     # Default and selected marker icons
│   │   └── marker-icon-red.png
│   ├── ui/                     # shadcn components (managed by the shadcn CLI)
│   └── theme-provider.tsx      # next-themes provider
├── data/
│   ├── episodes.ts             # The episode dataset
│   └── episodes.test.ts        # Data integrity tests
├── lib/
│   ├── episode.ts              # The Episode type
│   └── utils.ts                # cn() helper
├── components.json             # shadcn configuration
└── next.config.ts              # Allows remote thumbnails from i.ytimg.com
```

## The data

All content lives in [`data/episodes.ts`](data/episodes.ts), a typed array of episodes (see [`lib/episode.ts`](lib/episode.ts)). Each entry becomes one marker.

| Field            | Type         | Description                                                                         |
| ---------------- | ------------ | ----------------------------------------------------------------------------------- |
| `episode`        | number       | Episode number (unique)                                                             |
| `animateur`      | string       | Host of the episode                                                                 |
| `celebrite`      | string       | Celebrity guest (may be empty)                                                      |
| `peuple`         | string       | People or community visited (may be empty)                                          |
| `destination`    | string       | Place name                                                                          |
| `diffusion_date` | string       | Broadcast date as free text in French, e.g. `"26 décembre 2004"` (empty if unknown) |
| `channel`        | string       | Broadcaster (often empty)                                                           |
| `coordinates`    | `[lat, lng]` | Latitude first, then longitude                                                      |
| `link`           | string       | YouTube URL (empty if none)                                                         |
| `thumbnail`      | string       | Thumbnail image URL (empty if none)                                                 |
| `duration`       | string       | Video duration, e.g. `"1:29:47"`                                                    |
| `views`          | string       | View count captured when the entry was written (not displayed)                      |

### Adding an episode

Append an object to the array in `data/episodes.ts`:

```ts
{
  episode: 0, // next episode number
  animateur: "Host name",
  celebrite: "Celebrity name",
  peuple: "People visited",
  destination: "Place name",
  diffusion_date: "1er janvier 2026",
  channel: "",
  coordinates: [0, 0], // [latitude, longitude]
  link: "https://www.youtube.com/watch?v=VIDEO_ID",
  thumbnail: "https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg",
  duration: "1:30:00",
  views: "",
},
```

Use empty strings for unknown values and keep every field present (TypeScript enforces this). Then run `pnpm test`: it checks episode numbers are unique, coordinates are in range and ordered `[lat, lng]`, links are YouTube watch URLs, and thumbnail hosts are allowed by `next.config.ts`.

To show thumbnails from a host other than `i.ytimg.com`, add it to `images.remotePatterns` in [`next.config.ts`](next.config.ts).

### Adding a UI component

shadcn components are copied into `components/ui/` by the CLI:

```bash
pnpm dlx shadcn@latest add dialog
```

## Deployment

The app deploys to Vercel with no extra configuration: import the repository and keep the default Next.js settings. Vercel detects pnpm from `pnpm-lock.yaml` and `packageManager`. No environment variables are required.

## Credits

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Unofficial fan project. The series, its videos and thumbnails belong to their respective owners.

## License

No license has been chosen yet.
