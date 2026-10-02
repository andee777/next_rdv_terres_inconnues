// Compile-time tests. `pnpm typecheck` fails if any of these stop holding.
// They never run: Vitest only executes `*.test.ts` files.
import { expectTypeOf } from "vitest";

import type {
  Coordinates,
  Episode,
  ThumbnailUrl,
  YouTubeLink,
} from "./episode";
import { isSortOrder, type SortOrder } from "./episode-utils";

declare const episode: Episode;

// @ts-expect-error -- episodes are immutable
episode.country = "Mongolie";

// @ts-expect-error -- so are their coordinates
episode.coordinates[0] = 0;

// @ts-expect-error -- only YouTube watch URLs are accepted as links
export const notYouTube: YouTubeLink = "https://example.com/video";

// @ts-expect-error -- thumbnails must come from the allowed YouTube image host
export const notAThumbnail: ThumbnailUrl = "https://example.com/thumb.jpg";

// An empty string is how "no video" and "no thumbnail" are written.
export const noVideo: YouTubeLink = "";
export const noThumbnail: ThumbnailUrl = "";

expectTypeOf<Coordinates>().toEqualTypeOf<
  readonly [lat: number, lng: number]
>();

declare const raw: string;
if (isSortOrder(raw)) expectTypeOf(raw).toEqualTypeOf<SortOrder>();
