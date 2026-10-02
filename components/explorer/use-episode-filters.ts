import { useCallback, useMemo, useState } from "react";

import type { Episode } from "@/lib/episode";
import {
  DEFAULT_FILTERS,
  filterEpisodes,
  groupByYear,
  hasActiveFilters,
  normalize,
  sortEpisodes,
  type EpisodeFilters,
  type SortOrder,
} from "@/lib/episode-utils";

/** Search, filter and sort state, plus the derived results the UI renders. */
export function useEpisodeFilters(
  episodes: readonly Episode[],
  watched: ReadonlySet<number>,
) {
  const [filters, setFilters] = useState<EpisodeFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOrder>("newest");

  const patch = useCallback(
    (changes: Partial<EpisodeFilters>) =>
      setFilters((current) => ({ ...current, ...changes })),
    [],
  );
  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const results = useMemo(
    () => sortEpisodes(filterEpisodes(episodes, filters, watched), sort),
    [episodes, filters, watched, sort],
  );
  const groups = useMemo(() => groupByYear(results), [results]);

  // Changes only when the user edits a filter, not when the watched set
  // changes, so the map is only re-framed on deliberate filtering.
  const filtersKey = useMemo(
    () =>
      JSON.stringify([
        normalize(filters.query),
        filters.hosts,
        filters.onlyWithVideo,
        filters.hideWatched,
      ]),
    [filters],
  );

  return {
    filters,
    patch,
    reset,
    sort,
    setSort,
    results,
    groups,
    filtersKey,
    isFiltered: hasActiveFilters(filters),
  };
}
