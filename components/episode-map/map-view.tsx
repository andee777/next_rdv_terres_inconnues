"use client";

import { useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import type { Episode } from "@/lib/episode";

import { EpisodePopup } from "./episode-popup";
import { defaultIcon, selectedIcon } from "./marker-icons";

type EpisodeMarkerProps = {
  episode: Episode;
  selected: boolean;
  onSelect: (episodeNumber: number) => void;
};

function EpisodeMarker({ episode, selected, onSelect }: EpisodeMarkerProps) {
  // Stable reference: react-leaflet re-binds handlers whenever this changes.
  const eventHandlers = useMemo(
    () => ({ click: () => onSelect(episode.episode) }),
    [episode.episode, onSelect],
  );

  return (
    <Marker
      position={episode.coordinates}
      icon={selected ? selectedIcon : defaultIcon}
      title={episode.destination}
      alt={`Episode ${episode.episode}: ${episode.destination}`}
      eventHandlers={eventHandlers}
    >
      <EpisodePopup episode={episode} />
    </Marker>
  );
}

export default function MapView({
  episodes,
}: {
  episodes: readonly Episode[];
}) {
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);

  return (
    <MapContainer
      center={[6, 15]}
      zoom={3.5}
      worldCopyJump
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
        {episodes.map((episode) => (
          <EpisodeMarker
            key={episode.episode}
            episode={episode}
            selected={episode.episode === selectedEpisode}
            onSelect={setSelectedEpisode}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
