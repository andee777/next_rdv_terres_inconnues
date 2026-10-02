import type { Episode } from "@/lib/episode";

export type SortOrder = "newest" | "oldest";

export type EpisodeFilters = {
  /** Free-text search across celebrity, people, place, country, host and number. */
  query: string;
};

export const DEFAULT_FILTERS: EpisodeFilters = {
  query: "",
};

export type YearGroup = {
  /** `null` groups episodes whose broadcast year is unknown. */
  year: number | null;
  episodes: Episode[];
};

/** Title used wherever an episode is named: "Les Wauja", or the place when no people is known. */
export function episodeTitle(episode: Episode): string {
  return episode.peuple ? `Les ${episode.peuple}` : episode.destination;
}

/** Broadcast year parsed from the free-form French `diffusion_date`. */
export function episodeYear(episode: Episode): number | null {
  const match = episode.diffusion_date.match(/\b(\d{4})\b/);
  return match ? Number(match[1]) : null;
}

/** Lowercases, strips diacritics and collapses whitespace, so "Éthiopie" matches "ethiopie". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(query: string): string[] {
  const normalized = normalize(query);
  return normalized ? normalized.split(" ") : [];
}

const haystacks = new WeakMap<Episode, string>();

function haystack(episode: Episode): string {
  let value = haystacks.get(episode);
  if (value === undefined) {
    value = normalize(
      [
        episode.celebrite,
        episode.peuple,
        episode.destination,
        episode.country,
        episode.animateur,
        `episode ${episode.episode}`,
        episodeYear(episode) ?? "",
      ].join(" "),
    );
    haystacks.set(episode, value);
  }
  return value;
}

/** Every whitespace-separated word of the query must appear somewhere in the episode. */
export function matchesQuery(episode: Episode, query: string): boolean {
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  const text = haystack(episode);
  return tokens.every((token) => text.includes(token));
}

export function hasActiveFilters(filters: EpisodeFilters): boolean {
  return tokenize(filters.query).length > 0;
}

export function filterEpisodes(
  episodes: readonly Episode[],
  filters: EpisodeFilters,
): Episode[] {
  return episodes.filter((episode) => matchesQuery(episode, filters.query));
}

/** Episode numbers follow broadcast order, so they are the sort key. */
export function sortEpisodes(
  episodes: readonly Episode[],
  order: SortOrder,
): Episode[] {
  const direction = order === "newest" ? -1 : 1;
  return [...episodes].sort((a, b) => (a.episode - b.episode) * direction);
}

/** Groups consecutive episodes by year, keeping the input order. */
export function groupByYear(episodes: readonly Episode[]): YearGroup[] {
  const groups: YearGroup[] = [];
  for (const episode of episodes) {
    const year = episodeYear(episode);
    const last = groups.at(-1);
    if (last && last.year === year) last.episodes.push(episode);
    else groups.push({ year, episodes: [episode] });
  }
  return groups;
}

export function countCountries(episodes: readonly Episode[]): number {
  return new Set(episodes.map((episode) => episode.country)).size;
}

/**
 * Character ranges of `text` matched by the query, for highlighting. Returns an
 * empty list when normalisation changes the string length, because offsets
 * would no longer line up with the original text.
 */
export function highlightRanges(
  text: string,
  query: string,
): [start: number, end: number][] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const normalized = text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (normalized.length !== text.length) return [];

  const ranges: [number, number][] = [];
  for (const token of tokens) {
    let from = 0;
    for (;;) {
      const at = normalized.indexOf(token, from);
      if (at === -1) break;
      ranges.push([at, at + token.length]);
      from = at + token.length;
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);

  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  return merged;
}
