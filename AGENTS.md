# AGENTS.md

Guidance for AI coding agents working in this repository. For a human-oriented overview, see [README.md](README.md).

## What this project is

A single-page Next.js app that plots the episodes of the French TV series _Rendez-vous en terre inconnue_ on a Leaflet map. All content comes from one static typed array in `data/episodes.ts`. There is no backend, database, API route, auth, or environment variable.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml`, version pinned in `package.json` → `packageManager`). Never use npm or yarn here and never create a `package-lock.json`/`yarn.lock`. Node 22+ is required (`.nvmrc`).

```bash
pnpm install --frozen-lockfile   # clean, lockfile-exact install (what CI does)
pnpm dev                         # dev server (Turbopack) at http://localhost:3000
pnpm build                       # production build. Needs internet (fetches Geist from Google Fonts)
pnpm start                       # serve the production build
pnpm lint                        # eslint .
pnpm format:check                # prettier --check .   (pnpm format to write)
pnpm typecheck                   # next typegen && tsc --noEmit
pnpm test                        # vitest run
```

Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` and `pnpm build` before calling work done. CI (`.github/workflows/ci.yml`) runs exactly these.

`pnpm typecheck` runs `next typegen` first because `tsc` needs the generated `next-env.d.ts` (it provides the `*.png` module types). Don't call bare `tsc` on a fresh checkout.

## Stack

Next.js 16.3 (App Router, Turbopack for dev **and** build) · React 19.3 · TypeScript 6.0 (strict, no JS) · Tailwind CSS 4 (`@tailwindcss/postcss`, no `tailwind.config`) · shadcn/ui `base-nova` style on **Base UI** (not Radix) · lucide-react · next-themes · Leaflet 1.9 + react-leaflet 5 + react-leaflet-cluster 4 · ESLint 9 (flat config) · Prettier 3 + `prettier-plugin-tailwindcss` · Vitest 5.

Look up the docs for these exact versions before using an API from memory. Next 16, React 19, Tailwind 4, Base UI and react-leaflet 5 differ from their predecessors in ways that matter (for example, `next lint` no longer exists; ESLint is run directly).

### Version pins (don't bump casually)

| Pin                        | Why                                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typescript ~6.0`          | `typescript-eslint` requires `typescript <6.1`. TypeScript 7 breaks `pnpm lint`.                                                                           |
| `eslint ^9`                | `eslint-plugin-react` (pulled in by `eslint-config-next`) crashes on ESLint 10 (`contextOrFilename.getFilename is not a function`). Verified, not guessed. |
| `@types/node ^22`          | Matches the supported Node major.                                                                                                                          |
| `pnpm` in `packageManager` | Keeps local, CI and Vercel on the same pnpm.                                                                                                               |

Re-test before lifting a pin: install the new version in a scratch copy and run `pnpm lint`.

### pnpm specifics

- pnpm blocks dependency install scripts by default. Allowed/denied packages live in `allowBuilds` in `pnpm-workspace.yaml`. `unrs-resolver` is set to `false` on purpose (its native binding ships as a prebuilt optional dependency). If `pnpm install` reports `ERR_PNPM_IGNORED_BUILDS` for a new package, decide explicitly in that file; don't blanket-approve.
- Dependencies are strict (no hoisting): import only packages declared in `package.json`.

## Repository map

| Path                                       | Role                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `app/page.tsx`                             | Home page, a **Server Component**. Renders `<EpisodeMap episodes={episodes} />`.                |
| `app/layout.tsx`                           | Root layout: Geist font (`--font-sans`), `ThemeProvider`, `metadata`.                           |
| `app/globals.css`                          | Tailwind + shadcn theme tokens, layered Leaflet CSS, `.episode-popup` overrides.                |
| `components/episode-map/episode-map.tsx`   | Client wrapper: `dynamic(() => import("./map-view"), { ssr: false })` with a Skeleton fallback. |
| `components/episode-map/map-view.tsx`      | `MapContainer`, OSM `TileLayer`, `MarkerClusterGroup`, `EpisodeMarker`, selected-marker state.  |
| `components/episode-map/episode-popup.tsx` | Popup content built from shadcn `Card`, `Badge`, `Button`, `AspectRatio`, `Skeleton`.           |
| `components/episode-map/marker-icons.ts`   | `defaultIcon` / `selectedIcon`.                                                                 |
| `components/ui/*`                          | shadcn components. **Owned by the shadcn CLI**; see below.                                      |
| `components/theme-provider.tsx`            | `next-themes` wrapper (`attribute="class"`, system default).                                    |
| `data/episodes.ts`                         | `export const episodes: Episode[]`, the only data source.                                       |
| `data/episodes.test.ts`                    | Data integrity tests.                                                                           |
| `lib/episode.ts`                           | `Episode` and `Coordinates` types.                                                              |
| `lib/utils.ts`                             | `export { cn } from "cn"` (shadcn's class-name helper package).                                 |
| `components.json`                          | shadcn config (`base-nova`, `lucide`, aliases).                                                 |
| `next.config.ts`                           | `images.remotePatterns` for `i.ytimg.com`.                                                      |

### Where to make common changes

| Task                                        | Where                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------- |
| Add or edit an episode                      | `data/episodes.ts` (then `pnpm test`)                                 |
| Change popup content or layout              | `components/episode-map/episode-popup.tsx`                            |
| Change initial center, zoom, or tile source | `MapContainer` / `TileLayer` in `components/episode-map/map-view.tsx` |
| Change marker icons                         | `components/episode-map/marker-icons.ts`                              |
| Change popup frame (tip, shadow, wrapper)   | `.episode-popup` rules at the bottom of `app/globals.css`             |
| Allow a new thumbnail host                  | `images.remotePatterns` in `next.config.ts`                           |
| Change title, description, `lang`           | `metadata` and `<html>` in `app/layout.tsx`                           |
| Add a UI primitive                          | `pnpm dlx shadcn@latest add <name>`                                   |

## Data model

`Episode` (`lib/episode.ts`) is the contract; TypeScript enforces it:

```
episode: number
animateur, celebrite, peuple, destination, diffusion_date,
channel, link, thumbnail, duration, views: string
coordinates: [lat: number, lng: number]
```

Rules when editing data:

- `coordinates` is **`[lat, lng]`**, latitude first.
- Use `""` for unknown values; don't omit keys or use `null`.
- `diffusion_date` is free-form French text (`"1er septembre 2009"`), not an ISO date. Don't "normalize" it without being asked.
- `link` must be `https://www.youtube.com/watch?v=<11 chars>`; `thumbnail` must be on a host allowed in `next.config.ts`. `https://i.ytimg.com/vi/<VIDEO_ID>/hqdefault.jpg` works; older entries carry long `?sqp=...&rs=...` URLs. `pnpm test` checks both.
- Field names are French and are a public contract. Renaming them is a breaking change; ask first.
- Data is French; keep names, places and dates in their original French spelling.
- `animateur`, `channel` and `views` are stored but not displayed. `duration` is shown as a badge.
- Some episodes share coordinates. That is expected; the cluster group spiderfies them at max zoom.

## Conventions

- Everything is TypeScript with strict mode. Don't add `.js` files.
- Format with Prettier (`pnpm format`); it sorts Tailwind classes via `prettier-plugin-tailwindcss`. `components/ui` is excluded in `.prettierignore` so shadcn files stay byte-identical to upstream.
- Use shadcn components for UI wherever one fits (`Card`, `Badge`, `Button`, `Skeleton`, `AspectRatio`, ...) instead of hand-rolled markup. Icons come from `lucide-react`.
- Style with Tailwind utilities and the shadcn theme tokens (`bg-card`, `text-muted-foreground`, ...). Don't hard-code colors; the theme supports dark mode.
- `@/` resolves to the repo root. Use `@/…` imports for anything outside the current folder.
- Components are named function components. Mark a file `"use client"` only when it needs state, effects, or browser APIs.
- UI strings are English (e.g. "Watch video"), the data is French, and `<html lang="en">`.
- Commit history has no enforced message convention.

### shadcn / Base UI notes

- This project uses the **Base UI** flavor. Where Radix uses `asChild`, Base UI uses a `render` prop. A link styled as a button is:
  `<Button nativeButton={false} render={<a href={url} target="_blank" rel="noopener noreferrer" />}>Label</Button>`
- Don't hand-edit `components/ui/*` for app-specific tweaks; wrap them or pass `className`. If you must change one, expect `shadcn add --overwrite` to clobber it.
- `lib/utils.ts` re-exports `cn` from the shadcn-maintained `cn` package (replacement for `clsx` + `tailwind-merge`), as generated by the CLI. That is intentional, not a typo.

## Gotchas

These are easy to break and not obvious from reading one file.

1. **Leaflet needs `window`.** `page.tsx` is a Server Component; the browser-only boundary is `components/episode-map/episode-map.tsx` (`"use client"` + `dynamic(..., { ssr: false })`). In Next 16, `ssr: false` is only allowed in Client Components. Don't import `map-view.tsx` statically from a Server Component.
2. **Vendor CSS is loaded in the `base` layer.** `app/globals.css` imports Leaflet's and the cluster plugin's CSS with `layer(base)`. Unlayered vendor CSS beats every Tailwind utility regardless of specificity (for example `.leaflet-container a { color }` would override a `Button`'s text color). Keep new vendor CSS in a layer too. The cluster CSS comes from `react-leaflet-cluster/dist/assets/`, so it always matches the installed plugin version.
3. **Turbopack resolves image imports inconsistently.** A PNG imported from `node_modules` (Leaflet's `marker-icon.png`) is a plain URL **string**; a PNG inside the project (`marker-icon-red.png`) is a `StaticImageData` **object**. `marker-icons.ts` handles both through `assetUrl()`. Reading `.src` directly from a `node_modules` image yields `undefined` and crashes Leaflet with "iconUrl not set". Keep the helper for any new icon.
4. **The popup frame is overridden on purpose.** `Popup` is rendered with `className="episode-popup"` and `closeButton={false}`; the `.episode-popup` rules in `globals.css` strip Leaflet's white wrapper so the shadcn `Card` is the visible surface, and the card has its own close `Button` calling `useMap().closePopup()`. The popup width is fixed (`POPUP_WIDTH` = 288) in both `minWidth`/`maxWidth` and the Card's inline `width`; change them together, because Leaflet sizes the popup from its content width.
5. **The thumbnail skeleton is a CSS trick, not state.** A `Skeleton` is absolutely positioned _behind_ the `next/image` (`fill`) inside an `AspectRatio`; the opaque image paints over it once loaded. The fixed 16:9 box also prevents popup resizing (and Leaflet auto-pan glitches) when the image arrives. Don't add loading state for it.
6. **Remote images must be allow-listed.** `next/image` rejects hosts not in `images.remotePatterns` (`next.config.ts`). `data/episodes.test.ts` fails if an episode uses a host that isn't allowed.
7. **Map sizing:** `main` is `h-dvh w-full`, and `MapContainer`/the loading `Skeleton` are `h-full w-full`. Leaflet renders nothing visible if its container has no height.
8. **Builds need internet** for `next/font/google` (Geist). An offline or sandboxed `pnpm build` will retry and may fail.
9. **Port 3000 may be taken.** `.claude/launch.json` sets `autoPort: true` so preview servers pick a free port.
10. **`tsc` needs generated types.** Use `pnpm typecheck`, not bare `tsc`.

## Known limitations

Existing behavior, listed so it isn't mistaken for a regression. Mention these if relevant; don't fix them as a side effect of an unrelated task.

- Tests only cover the data (`data/episodes.test.ts`). There are no component or end-to-end tests; map behavior is verified in a browser.
- The selected (red) marker stays selected after its popup closes, until another marker is clicked. This matches the original app.
- The popup title prefix "Les" is French and assumes `peuple` is a plural noun.
- Older `thumbnail` URLs carry long `?sqp=…&rs=…` query strings; the plain `…/hqdefault.jpg` form works too.
- `views` is a scraped snapshot and goes stale.
- The React Compiler is not enabled.
- No license file.

## Boundaries

**Always**

- Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` and `pnpm build` after changing code (a data-only edit still warrants `pnpm test`).
- Check map changes in a browser: markers render, clusters expand, a popup opens with its thumbnail, the close button works, the clicked marker turns red, dark mode looks right.
- Keep `coordinates` as `[lat, lng]` and keep every `Episode` field present.

**Ask first**

- Adding, removing, or upgrading dependencies, and especially lifting a version pin.
- Renaming or removing `Episode` fields.
- Switching the map library, tile provider, or shadcn style/base.
- Changing hosting, CI, or deployment settings.

**Never**

- Commit secrets or `.env*` files (they are git-ignored).
- Edit `pnpm-lock.yaml` by hand, or introduce another package manager's lockfile.
- Remove `"use client"` or `ssr: false` from the map loading path.
- Hard-code colors or hand-edit `components/ui/*` for app-specific styling.
- Run `pnpm approve-builds --all` or otherwise blanket-allow dependency install scripts.
