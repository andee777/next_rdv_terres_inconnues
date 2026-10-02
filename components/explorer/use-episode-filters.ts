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
export function useEpisodeFilters(episodes: readonly Episode[]) {
  const [filters, setFilters] = useState<EpisodeFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOrder>("newest");

  const patch = useCallback(
    (changes: Partial<EpisodeFilters>) =>
      setFilters((current) => ({ ...current, ...changes })),
    [],
  );
  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const results = useMemo(
    () => sortEpisodes(filterEpisodes(episodes, filters), sort),
    [episodes, filters, sort],
  );
  const groups = useMemo(() => groupByYear(results), [results]);

  // Changes only when the user edits a filter (not the sort order), so the
  // map is only re-framed on deliberate filtering.
  const filtersKey = useMemo(() => normalize(filters.query), [filters]);

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
