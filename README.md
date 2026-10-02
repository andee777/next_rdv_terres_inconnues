# RDV Terres Inconnues — Map

An interactive world map of the episodes of _Rendez-vous en terre inconnue_, the French TV series in which a celebrity travels to live with a remote community. Every episode is a marker: open it to see the people visited, the destination, the guest, the broadcast date, and a link to watch the episode on YouTube.

**Live demo:** https://next-rdv-terres-inconnues.vercel.app/

## Features

**Map**

- Full-screen Leaflet map with OpenStreetMap tiles (attribution included)
- Clustered markers that expand as you zoom in; hovering an episode in the list highlights its marker (or the cluster hiding it)
- Episode popups built with [shadcn/ui](https://ui.shadcn.com): YouTube thumbnail (skeleton while it loads), people, location, celebrity, broadcast date, duration and a "Watch video" button
- shadcn-styled zoom and "fit all" controls
- Light and dark themes that follow your system setting, with a manual toggle

**Floating sidebar**

- Accent-insensitive search across celebrity, people, place, country, host and episode number, with matches highlighted
- Sort newest or oldest first
- Episodes grouped by year with sticky headers and thumbnails
- Selecting an episode flies the map to it (un-clustering if needed) and opens its popup; picking a marker on the map highlights and scrolls to its row. The camera accounts for the sidebar so nothing hides behind it
- "Surprise me" picks a random episode from the current results
- Shareable deep links: opening an episode puts `?episode=38` in the URL
- Collapses to a floating pill; becomes a slide-over sheet on phones and whenever the screen is short
- Keyboard friendly: see below

**Responsive**

Built to work on everything from a 320 px phone to an ultrawide monitor:

- **Phones (portrait):** the sidebar is a sheet sized to the screen and the map opens framed on every episode
- **Phones (landscape):** the sheet scrolls as a single page, and episode popups switch to a side-by-side layout (thumbnail beside the details) so they fit the short screen
- **Tablets:** a narrower floating sidebar that leaves the map room
- **Large screens:** the sidebar and popups keep a comfortable maximum size
- **Rotation and resizing:** the map re-frames itself and an open popup stays on screen
- **Touch:** larger tap targets on touch devices, and zoom buttons get out of the way of an open popup
- **Notches and home indicators:** the floating UI stays inside the safe area

### Keyboard shortcuts

| Key            | Action                                               |
| -------------- | ---------------------------------------------------- |
| `/`            | Focus the search field (opens the sidebar if needed) |
| `↓` / `↑`      | Move from search into the list, and between episodes |
| `Esc`          | Clear the search (a second press leaves the field)   |
| `Ctrl/⌘` + `B` | Show or hide the sidebar                             |

## Tech stack

| Area            | Choice                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | [Next.js](https://nextjs.org) 16 (App Router, Turbopack) with React 19                                                              |
| Language        | TypeScript 6 (maximum strictness, type-aware lint)                                                                                  |
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
│   ├── layout.tsx                  # Root layout, Geist font, theme + tooltip providers, metadata
│   ├── page.tsx                    # Home page (Server Component)
│   └── globals.css                 # Tailwind, shadcn theme tokens, Leaflet CSS, popup styles
├── components/
│   ├── explorer/                   # The floating sidebar and everything that drives the map
│   │   ├── episode-explorer.tsx    # State, selection, deep links, hotkeys, map framing
│   │   ├── episode-sidebar.tsx     # Sidebar layout (header, search, list, footer)
│   │   ├── episode-list-item.tsx   # One row: thumbnail, highlighted text
│   │   ├── filters-panel.tsx       # Search field, result count, sort menu
│   │   ├── map-controls.tsx        # Zoom / fit buttons
│   │   ├── sidebar-open-button.tsx # Floating pill shown when the sidebar is closed
│   │   ├── theme-toggle.tsx
│   │   └── use-episode-filters.ts  # Search / filter / sort state and derived results
│   ├── episode-map/
│   │   ├── episode-map.tsx         # Client wrapper: loads the map in the browser only
│   │   ├── map-view.tsx            # Leaflet map, clusters, imperative API for the explorer
│   │   ├── episode-popup.tsx       # Popup content (shadcn Card, Badge, Button, ...)
│   │   ├── marker-icons.ts         # Default and selected marker icons
│   │   ├── marker-icon-red.png
│   │   └── types.ts                # Map API and prop types
│   ├── ui/                         # shadcn components (managed by the shadcn CLI)
│   └── theme-provider.tsx          # next-themes provider
├── data/
│   ├── episodes.ts                 # The episode dataset
│   └── episodes.test.ts            # Data integrity tests
├── hooks/
│   └── use-mobile.ts               # Sheet-vs-floating sidebar switch (customized from shadcn)
├── lib/
│   ├── episode.ts                  # The Episode type (immutable, typed YouTube URLs)
│   ├── episode.test-d.ts           # Compile-time type tests, checked by `pnpm typecheck`
│   ├── episode-utils.ts            # Search, filter, sort, group, highlight (pure functions)
│   ├── episode-utils.test.ts
│   ├── viewport.ts                 # Responsive thresholds, popup sizing, viewport hook
│   ├── viewport.test.ts
│   └── utils.ts                    # cn() helper
├── types/
│   └── react-css.d.ts              # Typed CSS custom properties in `style` props
├── components.json                 # shadcn configuration
└── next.config.ts                  # Allows remote thumbnails from i.ytimg.com
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
| `country`        | string       | Country where it was filmed, in French (e.g. `"Mongolie"`)                          |
| `diffusion_date` | string       | Broadcast date as free text in French, e.g. `"26 décembre 2004"` (empty if unknown) |
| `channel`        | string       | Broadcaster (often empty)                                                           |
| `coordinates`    | `[lat, lng]` | Latitude first, then longitude                                                      |
| `link`           | string       | YouTube watch URL (empty if none); other hosts don't compile                        |
| `thumbnail`      | string       | `https://i.ytimg.com/vi/…` image URL (empty if none)                                |
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
  country: "Pays",
  diffusion_date: "1er janvier 2026",
  channel: "",
  coordinates: [0, 0], // [latitude, longitude]
  link: "https://www.youtube.com/watch?v=VIDEO_ID",
  thumbnail: "https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg",
  duration: "1:30:00",
  views: "",
},
```

Use empty strings for unknown values and keep every field present (TypeScript enforces this, and rejects a link that isn't a YouTube watch URL). Then run `pnpm test`: it checks episode numbers are unique, coordinates are in range and ordered `[lat, lng]`, a country and host are set, links are YouTube watch URLs, and thumbnail hosts are allowed by `next.config.ts`. Search and the year groups pick the new episode up automatically.

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
