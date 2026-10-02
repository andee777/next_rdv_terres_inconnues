# AGENTS.md

Guidance for AI coding agents working in this repository. For a human-oriented overview, see [README.md](README.md).

## What this project is

A single-page Next.js app that plots the episodes of the French TV series _Rendez-vous en terre inconnue_ on a Leaflet map, with a floating sidebar to search, filter and browse them. All content comes from one static typed array in `data/episodes.ts`. There is no backend, database, API route, auth, or environment variable. The only thing remembered about a visitor is their theme choice (`next-themes`, in `localStorage`). Per-user tracking such as "watched" marks was removed on purpose; don't add it back unless asked.

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

Next.js 16.3 (App Router, Turbopack for dev **and** build) · React 19.3 · TypeScript 6.0 (maximum strictness, no app JS) · Tailwind CSS 4 (`@tailwindcss/postcss`, no `tailwind.config`) · shadcn/ui `base-nova` style on **Base UI** (not Radix) · lucide-react · next-themes · Leaflet 1.9 + react-leaflet 5 + react-leaflet-cluster 4 · ESLint 9 (flat config) · Prettier 3 + `prettier-plugin-tailwindcss` · Vitest 5.

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

## Architecture

```
page.tsx (Server)  ──►  EpisodeExplorer (client)
                          ├─ SidebarProvider ─► EpisodeSidebar   search · filters · list · footer
                          ├─ <main> ───────────► EpisodeMap ─► MapView (Leaflet, browser only)
                          ├─ MapControls          zoom / fit buttons
                          └─ SidebarOpenButton    pill shown when the sidebar is closed
```

`Explorer` (in `episode-explorer.tsx`) owns the state: `selected` (the episode whose popup is open), `hovered` (list row under the pointer), the filters (`useEpisodeFilters`), and the map's imperative `api`. The sidebar and the map never talk to each other directly.

- **List → map:** the sidebar calls `selectFromList(id)`, which sets `selected` and calls `api.focusEpisode(id)` (fly, un-cluster, open popup). On mobile it also closes the sheet.
- **Map → list:** marker `click` sets `selected`; an effect scrolls the matching row into view. `popupclose` clears `selected`, so **`selected` means "this popup is open"**. Use a functional `setSelected(cur => cur === id ? null : cur)` when clearing, so a late `popupclose` from the previous marker cannot wipe a newer selection.
- **Hover:** hovering a row sets `hovered`; `MapView` adds the `episode-marker-hover` class to that marker, or to the cluster currently hiding it (`getVisibleParent`).
- **Filtering:** `results` feed both the list and the map's markers. When a filter changes (not the sort order), the map re-frames to the results after a 350 ms debounce.

### Responsive modes

The layout has three regimes, defined once in `lib/viewport.ts` (`COMPACT_QUERY`, `SHORT_MAX_HEIGHT`, `MOBILE_MAX_WIDTH`) and mirrored by the `compact` and `short` Tailwind variants in `app/globals.css`. **Keep those numbers in sync.**

| Regime                          | Trigger                            | Sidebar                                          | Notes                                                                                    |
| ------------------------------- | ---------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Regular                         | width ≥ 768 and height > 560       | Floating panel, `clamp(18rem, 30vw, 24rem)` wide | All filters visible.                                                                     |
| `compact`                       | width ≤ 767 **or** height ≤ 560    | Slide-over sheet (`min(88vw, 22rem)`)            | Keyboard hints hidden; map controls fade out while a popup is open.                      |
| `short` (a subset of `compact`) | height ≤ 560 (phone held sideways) | Sheet, header + list + footer scroll together    | Subtitle hidden, footer pinned, popup switches to a side-by-side layout (`popupLayout`). |

- `hooks/use-mobile.ts` (what shadcn's `Sidebar` uses to choose sheet vs. floating) is **customized** to use `COMPACT_QUERY`, so short landscape phones get the sheet, not a 360 px panel that leaves the list 26 px tall.
- Touch: bump targets with `pointer-coarse:` variants (≥ 40 px). Don't hide anything behind hover; touch devices can't reveal it.
- Safe areas: floating UI offsets itself with `env(safe-area-inset-*)`, enabled by `viewportFit: "cover"` in `app/layout.tsx`.
- The map opens **framed on every episode** (not a fixed center/zoom), and re-frames on resize or rotation until the user moves the map.

## Repository map

| Path                                          | Role                                                                                                                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/page.tsx`                                | Home page, a **Server Component**. Renders `<EpisodeExplorer episodes={episodes} />`.                                                                          |
| `app/layout.tsx`                              | Root layout: Geist font (`--font-sans`), `ThemeProvider`, `TooltipProvider`, `metadata`.                                                                       |
| `app/globals.css`                             | Tailwind + shadcn theme tokens, layered Leaflet CSS, `.episode-popup` and `.episode-marker-hover` rules.                                                       |
| `components/explorer/episode-explorer.tsx`    | Top-level client component: state, selection, deep links, hotkeys, map framing, `getInsets`.                                                                   |
| `components/explorer/episode-sidebar.tsx`     | The shadcn `Sidebar` (floating, offcanvas): header, filters, year-grouped list, footer, arrow-key navigation.                                                  |
| `components/explorer/episode-list-item.tsx`   | One list row: thumbnail, search-match highlighting, hover/focus → `hovered`.                                                                                   |
| `components/explorer/filters-panel.tsx`       | Search field, result count, sort menu.                                                                                                                         |
| `components/explorer/map-controls.tsx`        | Zoom and fit buttons (replace Leaflet's default control).                                                                                                      |
| `components/explorer/sidebar-open-button.tsx` | Floating "Episodes" pill, visible when the sidebar is collapsed or on mobile.                                                                                  |
| `components/explorer/theme-toggle.tsx`        | Light / dark / system menu.                                                                                                                                    |
| `components/explorer/use-episode-filters.ts`  | Filter and sort state; derives `results`, year `groups`, and `filtersKey`.                                                                                     |
| `components/episode-map/episode-map.tsx`      | Client wrapper: `dynamic(() => import("./map-view"), { ssr: false })` with a Skeleton fallback.                                                                |
| `components/episode-map/map-view.tsx`         | `MapContainer`, OSM `TileLayer`, `MarkerClusterGroup`, `EpisodeMarker`, and `MapBridge` (the imperative API).                                                  |
| `components/episode-map/episode-popup.tsx`    | Popup content built from shadcn `Card`, `Badge`, `Button`, `AspectRatio`, `Skeleton`, "Watch video" link.                                                      |
| `components/episode-map/types.ts`             | `EpisodeMapApi`, `EpisodeMapProps`, `MapInsets`.                                                                                                               |
| `components/episode-map/marker-icons.ts`      | `defaultIcon` / `selectedIcon`.                                                                                                                                |
| `components/ui/*`                             | shadcn components. **Owned by the shadcn CLI**; see below.                                                                                                     |
| `components/theme-provider.tsx`               | `next-themes` wrapper (`attribute="class"`, system default).                                                                                                   |
| `data/episodes.ts`                            | `export const episodes: readonly Episode[]`, the only data source.                                                                                             |
| `data/episodes.test.ts`, `lib/*.test.ts`      | Data integrity tests; unit tests for search/filter/sort/group/highlight.                                                                                       |
| `lib/episode.ts`                              | `Episode`, `Coordinates`, `YouTubeLink` and `ThumbnailUrl` types.                                                                                              |
| `lib/episode.test-d.ts`                       | Compile-time type tests (`expectTypeOf`, `@ts-expect-error`), checked by `pnpm typecheck`; never executed.                                                     |
| `types/react-css.d.ts`                        | Lets `style` props take CSS custom properties (`"--sidebar-width"`) without a cast.                                                                            |
| `lib/episode-utils.ts`                        | Pure functions: `episodeTitle`, `episodeYear`, `normalize`, `matchesQuery`, `filterEpisodes`, `sortEpisodes`, `isSortOrder`, `groupByYear`, `highlightRanges`. |
| `lib/viewport.ts`, `lib/viewport.test.ts`     | Responsive thresholds shared with CSS, `popupLayout()` (popup width and orientation), `useViewportSize()`.                                                     |
| `hooks/use-mobile.ts`                         | `useIsMobile()`: **customized** from shadcn's to use `COMPACT_QUERY` (see Responsive modes).                                                                   |
| `lib/utils.ts`                                | `export { cn } from "cn"` (shadcn's class-name helper package).                                                                                                |
| `components.json`                             | shadcn config (`base-nova`, `lucide`, aliases).                                                                                                                |
| `next.config.ts`                              | `images.remotePatterns` for `i.ytimg.com`.                                                                                                                     |

### Where to make common changes

| Task                                         | Where                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Add or edit an episode                       | `data/episodes.ts` (then `pnpm test`)                                                            |
| Change what search matches                   | `haystack()` in `lib/episode-utils.ts` (and its tests)                                           |
| Add a filter                                 | `EpisodeFilters` + `filterEpisodes` in `lib/episode-utils.ts`, then `filters-panel.tsx`          |
| Change sidebar layout or width               | `episode-sidebar.tsx`; width is `--sidebar-width` on `SidebarProvider` in `episode-explorer.tsx` |
| Change a list row                            | `components/explorer/episode-list-item.tsx`                                                      |
| Change popup content or layout               | `components/episode-map/episode-popup.tsx`                                                       |
| Change initial center, zoom, or tile source  | `MapContainer` / `TileLayer` in `components/episode-map/map-view.tsx`                            |
| Change camera behavior (fly, fit, popup pan) | `MapBridge` in `components/episode-map/map-view.tsx`                                             |
| Change marker icons                          | `components/episode-map/marker-icons.ts`                                                         |
| Change popup frame (tip, shadow, wrapper)    | `.episode-popup` rules at the bottom of `app/globals.css`                                        |
| Allow a new thumbnail host                   | `images.remotePatterns` in `next.config.ts`                                                      |
| Change title, description, `lang`            | `metadata` and `<html>` in `app/layout.tsx`                                                      |
| Add a UI primitive                           | `pnpm dlx shadcn@latest add <name>`                                                              |

## Data model

`Episode` (`lib/episode.ts`) is the contract; TypeScript enforces it:

```
episode: number
animateur, celebrite, peuple, destination, country, diffusion_date,
channel, duration, views: string
coordinates: readonly [lat: number, lng: number]
link: YouTubeLink           "" | `https://www.youtube.com/watch?v=${string}`
thumbnail: ThumbnailUrl     "" | `https://i.ytimg.com/vi/${string}`
```

Every field is `readonly` (`Episode` is `Readonly<{…}>`), and the dataset is a `readonly Episode[]`. Nothing may mutate episode data.

Rules when editing data:

- `coordinates` is **`[lat, lng]`**, latitude first.
- Use `""` for unknown values; don't omit keys or use `null`.
- `country` is the country where the episode was filmed, in French (`"Mongolie"`, `"Éthiopie"`). It feeds search and the header's country count; keep spellings consistent so the count stays right.
- `diffusion_date` is free-form French text (`"1er septembre 2009"`), not an ISO date. Don't "normalize" it without being asked. The sidebar parses the year from it (`episodeYear`); a missing year puts the episode in an "Undated" group.
- `link` must be `https://www.youtube.com/watch?v=<11 chars>`; `thumbnail` must be on a host allowed in `next.config.ts`. `https://i.ytimg.com/vi/<VIDEO_ID>/hqdefault.jpg` works; older entries carry long `?sqp=...&rs=...` URLs. The compiler rejects a link or thumbnail with the wrong prefix; `pnpm test` also checks the 11-character id and that the thumbnail host is allowed.
- Prefer links to the **full episode** on the official channel "Rendez-vous en terre inconnue - France Télévisions". Old uploads there have been made private before, so a link can silently die; verify a new link actually plays.
- Field names are French and are a public contract. Renaming or removing them is a breaking change; ask first.
- Data is French; keep names, places and dates in their original French spelling.
- `animateur` is only matched by search. `channel` and `views` are stored but not displayed; `duration` is shown as a badge.
- Some episodes share coordinates. That is expected; the cluster group spiderfies them at max zoom.

## Conventions

- Everything is TypeScript. Don't add `.js` files. The only JavaScript left is `eslint.config.mjs` and `postcss.config.mjs`: Next doesn't read a TypeScript PostCSS config, and on Node 22.14 a TypeScript `eslint.config.ts` needs the extra `jiti` dependency.
- `tsconfig.json` goes well beyond `strict`: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `noImplicitReturns`, `noUnused*`, `verbatimModuleSyntax` and `erasableSyntaxOnly`. Fix the code, not the config, when one of them complains. `erasableSyntaxOnly` means no `enum`, `namespace` or constructor parameter properties: use union types and `as const` objects.
- Prefer narrowing to casting. Use `instanceof` and type guards (such as `isSortOrder`), `satisfies`, annotated variables (`const options: FitBoundsOptions = …`) and `Record<Union, …>` so adding a union member is a compile error until it's handled. Only `as const` is welcome in app code; `components/ui` keeps shadcn's own casts. Banned by lint: `any`, `!` non-null assertions, floating promises, unnecessary conditions and assertions.
- Derive string unions from a constant (`SORT_ORDERS = [...] as const; type SortOrder = (typeof SORT_ORDERS)[number]`) so the list and the type can't drift.
- Import types with `import type` or an inline `type` modifier (`verbatimModuleSyntax`; lint enforces it).
- Domain types are immutable (`Readonly<…>`, `readonly T[]`). Leaflet's own types want mutable tuples, so convert (`latLng(lat, lng)`) instead of casting a read-only tuple.
- CSS custom properties in `style` props type-check through the augmentation in `types/react-css.d.ts`; no `as CSSProperties`.
- Lint is **type-aware** for everything except `components/ui` (see `eslint.config.mjs`). It reuses the `@typescript-eslint` plugin that `eslint-config-next` already registers, so it needed no new dependency.
- Type-level behavior is tested in `lib/episode.test-d.ts` with `expectTypeOf` and `@ts-expect-error`. It never runs; `pnpm typecheck` checks it. Add a case there when you add a type whose point is to reject something.
- Format with Prettier (`pnpm format`); it sorts Tailwind classes via `prettier-plugin-tailwindcss`. `components/ui` is excluded in `.prettierignore` so shadcn files stay byte-identical to upstream.
- Use shadcn components for UI wherever one fits instead of hand-rolled markup. Icons come from `lucide-react`.
- Style with Tailwind utilities and the shadcn theme tokens (`bg-card`, `text-muted-foreground`, ...). Don't hard-code colors; the theme supports dark mode.
- `@/` resolves to the repo root. Use `@/…` imports for anything outside the current folder.
- Components are named function components. Mark a file `"use client"` only when it needs state, effects, or browser APIs.
- Keep search/filter/sort logic as pure functions in `lib/episode-utils.ts` with unit tests, not inside components.
- Every interactive control needs an accessible name (`aria-label`) and must work from the keyboard.
- UI strings are English (e.g. "Watch video"), the data is French, and `<html lang="en">`.
- Commit history has no enforced message convention.

### shadcn / Base UI notes

- This project uses the **Base UI** flavor. Where Radix uses `asChild`, Base UI uses a `render` prop. A link styled as a button is:
  `<Button nativeButton={false} render={<a href={url} target="_blank" rel="noopener noreferrer" />}>Label</Button>`
- Don't hand-edit `components/ui/*` for app-specific tweaks; wrap them or pass `className`. If you must change one, expect `shadcn add --overwrite` to clobber it.
- `lib/utils.ts` re-exports `cn` from the shadcn-maintained `cn` package (replacement for `clsx` + `tailwind-merge`), as generated by the CLI. That is intentional, not a typo. **It does not dedupe conflicting utilities that share a variant**: overriding a shadcn variant's `dark:bg-input/30` with your own `dark:bg-background` does nothing, because both are emitted. Add the important modifier (`dark:bg-background!`) when you must override a variant's utility.
- The shadcn mobile sheet is hard-capped at 75% of the viewport (`w-3/4`) plus a constant `18rem`, which is only 240 px on a 320 px phone. `app/globals.css` overrides it with an **unlayered** rule (`[data-slot="sidebar"][data-mobile="true"]`, `min(88vw, 22rem)`); unlayered CSS is the only thing that beats variant utilities. Sidebar content must stay usable at ~280 px.

## Gotchas

These are easy to break and not obvious from reading one file.

1. **Leaflet needs `window`.** `page.tsx` is a Server Component; the browser-only boundary is `components/episode-map/episode-map.tsx` (`"use client"` + `dynamic(..., { ssr: false })`). In Next 16, `ssr: false` is only allowed in Client Components. Don't import `map-view.tsx` statically from a Server Component.
2. **Never pass `episode.coordinates` straight to `<Marker position>`.** react-leaflet compares `position` by identity and calls `marker.setLatLng()` when it changes. `setLatLng` makes the cluster group remove and re-add the marker, which **closes its open popup**. Episode objects get re-created on re-render (for example after `history.replaceState` changes the URL), so a real click on a popup button used to land on the map instead: the popup vanished between `mousedown` and `mouseup`. `EpisodeMarker` therefore memoizes `position` on the lat/lng _values_. Keep it that way.
3. **Vendor CSS is loaded in the `base` layer.** `app/globals.css` imports Leaflet's and the cluster plugin's CSS with `layer(base)`. Unlayered vendor CSS beats every Tailwind utility regardless of specificity (for example `.leaflet-container a { color }` would override a `Button`'s text color). Keep new vendor CSS in a layer too. The cluster CSS comes from `react-leaflet-cluster/dist/assets/`, so it always matches the installed plugin version.
4. **Stacking:** Leaflet panes use z-indexes up to 700 and would paint over the sidebar. The `MapContainer` has `isolate z-0` so those z-indexes stay inside the map; the sidebar and floating controls use `z-10`. Don't remove `isolate`.
5. **Turbopack resolves image imports inconsistently.** A PNG imported from `node_modules` (Leaflet's `marker-icon.png`) is a plain URL **string**; a PNG inside the project (`marker-icon-red.png`) is a `StaticImageData` **object**. `marker-icons.ts` handles both through `assetUrl()`. Reading `.src` directly from a `node_modules` image yields `undefined` and crashes Leaflet with "iconUrl not set". Keep the helper for any new icon.
6. **The popup frame is overridden on purpose.** `Popup` is rendered with `className="episode-popup"` and `closeButton={false}`; the `.episode-popup` rules in `globals.css` strip Leaflet's white wrapper so the shadcn `Card` is the visible surface, and the card has its own close `Button` calling `useMap().closePopup()`. The popup width is fixed (`POPUP_WIDTH` = 288) in both `minWidth`/`maxWidth` and the Card's inline `width`; change them together, because Leaflet sizes the popup from its content width.
7. **Popups don't use Leaflet's auto-pan** (`autoPan={false}`) because it ignores overlays. `MapBridge` pans a new popup into the area not covered by the UI (`getInsets`). It re-checks on every popup size change for 1.5 s (`ResizeObserver`), because the card mounts into the popup after `popupopen` and grows upward, so a fixed-delay measurement sees a tiny popup and under-pans.
8. **`getInsets` describes what covers the map:** the open sidebar's right edge on desktop, or a 56 px strip at the top (the "Episodes" pill) when the sidebar is collapsed or on mobile. `focusEpisode`, `fitEpisodes` and the popup pan all use it. Add any new floating UI to it.
9. **The map API is only handed out once the map is measurable.** `MapBridge` waits (via `ResizeObserver`) until the container has a non-zero size before calling `onReady`, and `focusEpisode` re-measures with `invalidateSize()` and bails out on a 0 px map. Leaflet's `flyTo` divides by the pixel size, so framing a deep-linked episode on first load used to throw "Invalid LatLng object: (NaN, NaN)" and blank the map.
10. **Deep links and URL sync.** `/?episode=38` is consumed once in `handleMapReady` (guarded by `deepLinkHandled`); after that an effect mirrors `selected` into the URL with `window.history.replaceState`. That call goes through Next's patched router and re-renders the tree (see gotcha 2). Don't write the URL before the deep link has been handled or you'll erase it.
11. **The thumbnail skeleton is a CSS trick, not state.** A `Skeleton` is absolutely positioned _behind_ the `next/image` (`fill`) inside an `AspectRatio`; the opaque image paints over it once loaded. The fixed 16:9 box also keeps popups from resizing when the image arrives. Don't add loading state for it.
12. **Remote images must be allow-listed.** `next/image` rejects hosts not in `images.remotePatterns` (`next.config.ts`). `data/episodes.test.ts` fails if an episode uses a host that isn't allowed.
13. **TypeScript 6 no longer includes every `@types/*` package automatically.** `map-view.tsx` has `import type {} from "leaflet.markercluster"` purely to load the typings that add `MarkerClusterGroup` to Leaflet. It is erased at build time.
14. **React's compiler-based lint rules are on** (`react-hooks/set-state-in-effect`, `refs`, `purity`). Don't call `setState` synchronously in an effect or write refs during render; derive state, or do it in an event handler / callback.
15. **Builds need internet** for `next/font/google` (Geist). An offline or sandboxed `pnpm build` will retry and may fail.
16. **Port 3000 may be taken.** `.claude/launch.json` sets `autoPort: true` so preview servers pick a free port.
17. **`tsc` needs generated types.** Use `pnpm typecheck`, not bare `tsc`.
18. **Custom variants with a comma-separated media query need the block form.** `@custom-variant compact (@media (a), (b));` splits on the comma and breaks the CSS build ("Invalid dangling combinator"). Use `@custom-variant compact { @media (a), (b) { @slot; } }`, as `app/globals.css` does.
19. **Popup width follows the viewport, live.** `popupLayout(vw, vh)` gives the width (288 px, never wider than the viewport minus 32) and whether to use the side-by-side layout (height ≤ 560 and width ≥ 520). Leaflet only reads `minWidth`/`maxWidth` at creation, so `EpisodePopup` mutates `popup.options` and calls `popup.update()` when the width changes; that is what lets a popup survive rotation instead of closing. The Card is also capped at `max-h-[calc(100dvh-…)]` and scrolls, so it can never exceed the screen.
20. **In the side-by-side popup the thumbnail is letterboxed (`object-contain` on black), not cropped, and has no `Skeleton`.** The thumbnail column is nearly square; cropping cuts the image's own caption, and a skeleton behind a letterboxed image shows as grey bands.
21. **Popup placement must not depend on frames.** `MapBridge` re-checks a new popup with plain `setTimeout`s (0/120/350/800 ms) _and_ a `ResizeObserver`, then stops after 1.5 s. Animation frames and observer callbacks only run when the browser paints, so a throttled or background tab never adjusted before. `getBoundingClientRect` measures correctly without a paint. Don't switch this back to `requestAnimationFrame` only.
22. **`fitEpisodes` remembers what it framed** (`lastFit`) and re-frames when the map resizes (rotation, window resize), until the user touches the map (`pointerdown`, `wheel`, `keydown` on the container) or `focusEpisode` runs. Without it, rotating a phone leaves the episodes off-screen. The first framing (`animate: false`) happens in `handleMapReady`, unless a deep link is present.
23. **The map controls hide on compact screens while a popup is open** (`popupOpen` prop). There is no room for both on a 320 px phone, and the controls cover the popup's "Watch video" button.
24. **Leaflet's container background is OSM's sea color** (`#aad3df`). Framing every episode on a tall, narrow phone leaves bands above and below the world, which should read as ocean, not grey.

## Known limitations

Existing behavior, listed so it isn't mistaken for a regression. Mention these if relevant; don't fix them as a side effect of an unrelated task.

- Tests cover the data and the pure logic in `lib/`. There are no component or end-to-end tests; map and sidebar behavior is verified in a browser.
- The shadcn `SidebarProvider` writes a `sidebar_state` cookie but nothing reads it, so the sidebar always starts open on desktop.
- Framing every episode on a wide, short screen (a phone held sideways) is limited by height, so the world repeats horizontally and the markers sit on one copy.
- The desktop sidebar and popup have fixed maximum sizes (24rem and 288 px); they are not scaled up on very large screens.
- The popup title prefix "Les" is French and assumes `peuple` is a plural noun.
- Some episodes have no full video on the official channel (only clips, or an unplayable upload), so they have an empty `link`.
- Older `thumbnail` URLs carry long `?sqp=…&rs=…` query strings; the plain `…/hqdefault.jpg` form works too.
- `views` is a scraped snapshot and goes stale.
- The React Compiler is not enabled.
- No license file.

## Boundaries

**Always**

- Run `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` and `pnpm build` after changing code (a data-only edit still warrants `pnpm test`).
- Check UI changes in a browser: markers render, clusters expand, a popup opens with its thumbnail and stays open when you click inside it, selecting a list row flies there and highlights it, the search/filters work, a deep link (`/?episode=38`) opens on a cold load, the mobile sheet closes on selection, and dark mode looks right. For layout changes, check at least: 320×568 and 390×844 (portrait phones), 844×390 (landscape phone), 768×1024 (tablet), 1280×720 and 2560×1080 (desktop, ultrawide), and rotate with a popup open. Nothing may overflow horizontally, and a popup must stay fully on screen and clear of the sidebar, the pill and the controls.
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
- Pass unmemoized coordinates to `<Marker position>`, or otherwise trigger `setLatLng` on every render.
- Hard-code colors or hand-edit `components/ui/*` for app-specific styling.
- Run `pnpm approve-builds --all` or otherwise blanket-allow dependency install scripts.
