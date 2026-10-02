"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { EpisodeMap } from "@/components/episode-map/episode-map";
import type { EpisodeMapApi, MapInsets } from "@/components/episode-map/types";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import type { Episode } from "@/lib/episode";
import { countCountries, uniqueHosts } from "@/lib/episode-utils";
import { useWatched } from "@/lib/use-watched";

import { EpisodeSidebar } from "./episode-sidebar";
import { MapControls } from "./map-controls";
import { SidebarOpenButton } from "./sidebar-open-button";
import { useEpisodeFilters } from "./use-episode-filters";

const EPISODE_PARAM = "episode";
/** Height the floating "Episodes" pill takes at the top of the map (px). */
const PILL_CLEARANCE = 56;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type EpisodeExplorerProps = { episodes: readonly Episode[] };

/** The whole page: a floating episode sidebar over a full-screen map. */
export function EpisodeExplorer({ episodes }: EpisodeExplorerProps) {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "24rem" } as CSSProperties}
      className="h-dvh min-h-0 overflow-hidden"
    >
      <Explorer episodes={episodes} />
    </SidebarProvider>
  );
}

function Explorer({ episodes }: EpisodeExplorerProps) {
  const { open, setOpen, isMobile, setOpenMobile } = useSidebar();
  const { watched, toggle: toggleWatched, clear: clearWatched } = useWatched();
  const {
    filters,
    patch,
    reset,
    sort,
    setSort,
    results,
    groups,
    filtersKey,
    isFiltered,
  } = useEpisodeFilters(episodes, watched);

  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [api, setApi] = useState<EpisodeMapApi | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const deepLinkHandled = useRef(false);

  const hosts = useMemo(() => uniqueHosts(episodes), [episodes]);
  const countryCount = useMemo(() => countCountries(episodes), [episodes]);
  const knownEpisodes = useMemo(
    () => new Set(episodes.map((episode) => episode.episode)),
    [episodes],
  );

  // Which part of the map the floating UI currently covers, in px: the open
  // sidebar on the left, or the "Episodes" pill at the top when the sidebar is
  // collapsed (or on mobile). Kept in a ref so the callback stays stable.
  const sidebarState = useRef({ open, isMobile });
  useEffect(() => {
    sidebarState.current = { open, isMobile };
  }, [open, isMobile]);
  const getInsets = useCallback((): MapInsets => {
    const { open: isOpen, isMobile: mobile } = sidebarState.current;
    if (mobile || !isOpen) return { left: 0, top: PILL_CLEARANCE };
    const panel = document.querySelector("[data-slot=sidebar-inner]");
    return {
      left: panel ? Math.max(0, panel.getBoundingClientRect().right) : 0,
      top: 0,
    };
  }, []);

  // --- Selection -----------------------------------------------------------

  const selectFromList = useCallback(
    (episode: number) => {
      setSelected(episode);
      api?.focusEpisode(episode);
      if (isMobile) setOpenMobile(false);
    },
    [api, isMobile, setOpenMobile],
  );

  const handlePopupClose = useCallback(
    (episode: number) =>
      setSelected((current) => (current === episode ? null : current)),
    [],
  );

  const handleMapReady = useCallback(
    (mapApi: EpisodeMapApi) => {
      setApi(mapApi);
      if (deepLinkHandled.current) return;
      deepLinkHandled.current = true;

      // Deep link: /?episode=38 opens that episode's popup.
      const requested = Number(
        new URLSearchParams(window.location.search).get(EPISODE_PARAM),
      );
      if (Number.isInteger(requested) && knownEpisodes.has(requested)) {
        setSelected(requested);
        mapApi.focusEpisode(requested);
      }
    },
    [knownEpisodes],
  );

  // Reflect the open episode in the URL so any view can be shared.
  useEffect(() => {
    if (!deepLinkHandled.current) return;
    const url = new URL(window.location.href);
    if (selected === null) url.searchParams.delete(EPISODE_PARAM);
    else url.searchParams.set(EPISODE_PARAM, String(selected));
    window.history.replaceState(window.history.state, "", url);
  }, [selected]);

  // Keep the selected episode visible in the list when it is picked on the map.
  useEffect(() => {
    if (selected === null) return;
    document.getElementById(`episode-row-${selected}`)?.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [selected]);

  // --- Map framing ---------------------------------------------------------

  const resultsRef = useRef(results);
  useEffect(() => {
    resultsRef.current = results;
  });

  // Re-frame the map when the user changes a filter (not on every keystroke).
  const framedFor = useRef(filtersKey);
  useEffect(() => {
    if (!api || framedFor.current === filtersKey) return;
    framedFor.current = filtersKey;
    const timer = window.setTimeout(() => {
      const list = resultsRef.current;
      if (list.length > 0) api.fitEpisodes(list);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [api, filtersKey]);

  const fitToResults = useCallback(
    () => api?.fitEpisodes(results.length > 0 ? results : episodes),
    [api, results, episodes],
  );

  // --- Actions -------------------------------------------------------------

  // Prefer something not watched yet, within the current results.
  const surprise = useCallback(() => {
    const candidates = results.filter(
      (episode) => episode.episode !== selected,
    );
    const unwatched = candidates.filter(
      (episode) => !watched.has(episode.episode),
    );
    const pool = unwatched.length > 0 ? unwatched : candidates;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) selectFromList(pick.episode);
  }, [results, selected, watched, selectFromList]);

  // "/" focuses the search field, opening the sidebar first if needed.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      ) {
        return;
      }
      event.preventDefault();
      if (isMobile) setOpenMobile(true);
      else setOpen(true);
      window.setTimeout(() => searchRef.current?.focus(), 80);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile, setOpen, setOpenMobile]);

  return (
    <>
      <EpisodeSidebar
        totalCount={episodes.length}
        countryCount={countryCount}
        resultCount={results.length}
        groups={groups}
        filters={filters}
        onFiltersChange={patch}
        onFiltersReset={reset}
        isFiltered={isFiltered}
        hosts={hosts}
        sort={sort}
        onSortChange={setSort}
        watched={watched}
        onToggleWatched={toggleWatched}
        onResetWatched={clearWatched}
        selectedEpisode={selected}
        onSelectEpisode={selectFromList}
        onHoverEpisode={setHovered}
        onSurprise={surprise}
        searchRef={searchRef}
      />

      <main className="fixed inset-0" aria-label="Episode map">
        <EpisodeMap
          episodes={results}
          selectedEpisode={selected}
          hoveredEpisode={hovered}
          onSelectEpisode={setSelected}
          onPopupClose={handlePopupClose}
          onReady={handleMapReady}
          getInsets={getInsets}
        />
      </main>

      <MapControls api={api} onFit={fitToResults} />
      <SidebarOpenButton count={results.length} />
    </>
  );
}
