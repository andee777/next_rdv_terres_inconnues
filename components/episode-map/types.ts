import type { Episode } from "@/lib/episode";

/** Imperative handle the explorer uses to drive the Leaflet map. */
export type EpisodeMapApi = {
  /** Flies to the episode (un-clustering it if needed) and opens its popup. */
  focusEpisode: (episode: number) => void;
  /** Frames every given episode in the free space not covered by the UI. */
  fitEpisodes: (episodes: readonly Episode[]) => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

/** Pixels at the left and top of the map currently covered by floating UI. */
export type MapInsets = { left: number; top: number };

export type EpisodeMapProps = {
  episodes: readonly Episode[];
  /** Episode whose popup is open. */
  selectedEpisode: number | null;
  /** Episode hovered in the list; its marker (or cluster) is highlighted. */
  hoveredEpisode: number | null;
  onSelectEpisode: (episode: number) => void;
  onPopupClose: (episode: number) => void;
  /** Called once the map is mounted and ready to be driven. */
  onReady: (api: EpisodeMapApi) => void;
  /** The area the map should treat as covered, e.g. by the sidebar. */
  getInsets: () => MapInsets;
};
