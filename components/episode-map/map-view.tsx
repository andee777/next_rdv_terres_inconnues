"use client";

import { latLngBounds } from "leaflet";
import type {
  LatLngTuple,
  Marker as LeafletMarker,
  MarkerClusterGroup as LeafletClusterGroup,
  PopupEvent,
} from "leaflet";
// Type-only: loads the typings that add MarkerClusterGroup to Leaflet. TypeScript 6
// no longer includes every @types package automatically. Erased at build time.
import type {} from "leaflet.markercluster";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import type { Episode } from "@/lib/episode";

import { EpisodePopup } from "./episode-popup";
import { defaultIcon, selectedIcon } from "./marker-icons";
import type { EpisodeMapApi, EpisodeMapProps, MapInsets } from "./types";

type MarkerRegistry = Map<number, LeafletMarker>;

/** Zoom level that frames a single episode without leaving it clustered. */
const FOCUS_ZOOM = 6;
const VIEW_MARGIN = 16;
/** How long a new popup is watched for size changes while it settles (ms). */
const POPUP_SETTLE_MS = 1500;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type EpisodeMarkerProps = {
  episode: Episode;
  selected: boolean;
  registry: MarkerRegistry;
  onSelect: (episode: number) => void;
  onPopupClose: (episode: number) => void;
};

function EpisodeMarker({
  episode,
  selected,
  registry,
  onSelect,
  onPopupClose,
}: EpisodeMarkerProps) {
  // react-leaflet compares `position` by identity and calls `setLatLng` when it
  // changes. That makes the cluster group remove and re-add the marker, which
  // closes its open popup. Episode objects can be re-created on a re-render (for
  // example after the URL changes), so key the position on the values instead.
  const [lat, lng] = episode.coordinates;
  const position = useMemo<LatLngTuple>(() => [lat, lng], [lat, lng]);

  // Stable reference: react-leaflet re-binds handlers whenever this changes.
  const eventHandlers = useMemo(
    () => ({
      click: () => onSelect(episode.episode),
      popupclose: () => onPopupClose(episode.episode),
    }),
    [episode.episode, onSelect, onPopupClose],
  );

  const register = useCallback(
    (marker: LeafletMarker | null) => {
      if (marker) registry.set(episode.episode, marker);
      else registry.delete(episode.episode);
    },
    [registry, episode.episode],
  );

  return (
    <Marker
      ref={register}
      position={position}
      icon={selected ? selectedIcon : defaultIcon}
      zIndexOffset={selected ? 1000 : 0}
      title={episode.destination}
      alt={`Episode ${episode.episode}: ${episode.destination}`}
      eventHandlers={eventHandlers}
    >
      <EpisodePopup episode={episode} />
    </Marker>
  );
}

type MapBridgeProps = {
  registry: MarkerRegistry;
  clusterRef: RefObject<LeafletClusterGroup | null>;
  onReady: (api: EpisodeMapApi) => void;
  getInsets: () => MapInsets;
};

/** Lives inside `MapContainer` to expose an imperative API to the explorer. */
function MapBridge({
  registry,
  clusterRef,
  onReady,
  getInsets,
}: MapBridgeProps) {
  const map = useMap();

  useEffect(() => {
    const api: EpisodeMapApi = {
      focusEpisode(episodeNumber) {
        const marker = registry.get(episodeNumber);
        if (!marker) return;

        // Leaflet caches the container size, so re-measure before computing.
        map.invalidateSize({ animate: false });
        const size = map.getSize();
        const insets = getInsets();

        const zoom = Math.max(map.getZoom(), FOCUS_ZOOM);
        // Aim at the middle of the free space, not of the whole viewport.
        const aim = map.unproject(
          map
            .project(marker.getLatLng(), zoom)
            .subtract([insets.left / 2, insets.top / 2]),
          zoom,
        );

        let opened = false;
        const open = () => {
          if (opened) return;
          opened = true;
          const group = clusterRef.current;
          if (group) group.zoomToShowLayer(marker, () => marker.openPopup());
          else marker.openPopup();
        };

        // Never crash the page over a camera move: without a measurable map,
        // just open the popup where the marker already is.
        if (
          size.x === 0 ||
          size.y === 0 ||
          !Number.isFinite(aim.lat) ||
          !Number.isFinite(aim.lng)
        ) {
          open();
          return;
        }
        if (prefersReducedMotion()) {
          map.setView(aim, zoom, { animate: false });
          open();
          return;
        }
        map.once("moveend", open);
        map.flyTo(aim, zoom, { duration: 1.1 });
        window.setTimeout(open, 2500); // safety net if no move event fires
      },

      fitEpisodes(list) {
        if (list.length === 0) return;
        map.invalidateSize({ animate: false });
        const insets = getInsets();
        const bounds = latLngBounds(list.map((episode) => episode.coordinates));
        const options = {
          paddingTopLeft: [insets.left + 32, insets.top + 32] as [
            number,
            number,
          ],
          paddingBottomRight: [32, 32] as [number, number],
          maxZoom: FOCUS_ZOOM,
        };
        if (prefersReducedMotion())
          map.fitBounds(bounds, { ...options, animate: false });
        else map.flyToBounds(bounds, { ...options, duration: 1 });
      },

      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
    };

    // Pan so a freshly opened popup is fully visible and clear of the sidebar.
    // Leaflet's own auto-pan is disabled on popups because it ignores overlays.
    const keepPopupInView = (event: PopupEvent) => {
      const element = event.popup.getElement();
      if (!element) return;

      const adjust = () => {
        const insets = getInsets();
        const popup = element.getBoundingClientRect();
        const view = map.getContainer().getBoundingClientRect();
        const safe = {
          left: view.left + insets.left + VIEW_MARGIN,
          top: view.top + insets.top + VIEW_MARGIN,
          right: view.right - VIEW_MARGIN,
          bottom: view.bottom - VIEW_MARGIN,
        };

        let dx = 0;
        let dy = 0;
        if (popup.left < safe.left) dx = popup.left - safe.left;
        else if (popup.right > safe.right) dx = popup.right - safe.right;
        if (popup.top < safe.top) dy = popup.top - safe.top;
        else if (popup.bottom > safe.bottom) dy = popup.bottom - safe.bottom;

        if (dx !== 0 || dy !== 0) {
          map.panBy([dx, dy], {
            animate: !prefersReducedMotion(),
            duration: 0.35,
          });
        }
      };

      // The card mounts into the popup just after the event, so the popup grows
      // (upward, above its marker) after the first measurement. Re-check on every
      // size change for a short settling window, then stop so the user's own
      // panning is never fought.
      let frame = 0;
      const schedule = () => {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(adjust);
      };
      const observer = new ResizeObserver(schedule);
      observer.observe(element);

      const stop = () => {
        observer.disconnect();
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timer);
        map.off("popupclose", onClose);
      };
      const onClose = (closed: PopupEvent) => {
        if (closed.popup === event.popup) stop();
      };
      const timer = window.setTimeout(stop, POPUP_SETTLE_MS);
      map.on("popupclose", onClose);
      schedule();
    };

    map.on("popupopen", keepPopupInView);

    // Hand the API out only once the map can be measured. Leaflet's flyTo divides
    // by the map's pixel size, so framing an episode deep-linked on first load
    // (when the container may still be 0px) would otherwise produce NaN.
    const container = map.getContainer();
    const isMeasurable = () =>
      container.clientWidth > 0 && container.clientHeight > 0;
    const announce = () => {
      map.invalidateSize({ animate: false });
      onReady(api);
    };

    let observer: ResizeObserver | undefined;
    if (isMeasurable()) {
      announce();
    } else {
      observer = new ResizeObserver(() => {
        if (!isMeasurable()) return;
        observer?.disconnect();
        announce();
      });
      observer.observe(container);
    }

    return () => {
      observer?.disconnect();
      map.off("popupopen", keepPopupInView);
    };
  }, [map, registry, clusterRef, onReady, getInsets]);

  return null;
}

export default function MapView({
  episodes,
  selectedEpisode,
  hoveredEpisode,
  onSelectEpisode,
  onPopupClose,
  onReady,
  getInsets,
}: EpisodeMapProps) {
  const [registry] = useState<MarkerRegistry>(() => new Map());
  const clusterRef = useRef<LeafletClusterGroup | null>(null);

  // Glow the hovered episode's marker, or the cluster currently hiding it.
  useEffect(() => {
    if (hoveredEpisode === null) return;
    const marker = registry.get(hoveredEpisode);
    if (!marker) return;
    const target = clusterRef.current?.getVisibleParent(marker) ?? marker;
    const element = target.getElement();
    if (!element) return;

    element.classList.add("episode-marker-hover");
    target.setZIndexOffset(1000);
    return () => {
      element.classList.remove("episode-marker-hover");
      target.setZIndexOffset(0);
    };
  }, [hoveredEpisode, registry]);

  return (
    <MapContainer
      center={[6, 15]}
      zoom={3.5}
      zoomControl={false}
      worldCopyJump
      // `isolate` keeps Leaflet's high z-indexes below the floating UI.
      className="isolate z-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapBridge
        registry={registry}
        clusterRef={clusterRef}
        onReady={onReady}
        getInsets={getInsets}
      />
      <MarkerClusterGroup
        ref={clusterRef}
        chunkedLoading
        showCoverageOnHover={false}
      >
        {episodes.map((episode) => (
          <EpisodeMarker
            key={episode.episode}
            episode={episode}
            selected={episode.episode === selectedEpisode}
            registry={registry}
            onSelect={onSelectEpisode}
            onPopupClose={onPopupClose}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
