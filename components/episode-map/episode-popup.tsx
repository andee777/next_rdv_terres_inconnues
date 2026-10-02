"use client";

import type { Popup as LeafletPopup } from "leaflet";
import Image from "next/image";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Star,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Popup, useMap } from "react-leaflet";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Episode } from "@/lib/episode";
import { episodeTitle } from "@/lib/episode-utils";
import { popupLayout, useViewportSize } from "@/lib/viewport";
import { cn } from "@/lib/utils";

export function EpisodePopup({ episode }: { episode: Episode }) {
  const map = useMap();
  const viewport = useViewportSize();
  const { width, horizontal } = popupLayout(viewport.width, viewport.height);
  const popupRef = useRef<LeafletPopup | null>(null);

  // Leaflet takes the popup width from these options when it lays the popup
  // out. They are only read from props at creation, so when the viewport
  // changes (rotation, resize) update them and re-layout the open popup.
  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;
    popup.options.minWidth = width;
    popup.options.maxWidth = width;
    popup.update();
  }, [width]);

  const title = episodeTitle(episode);
  const details = [
    {
      label: "Location",
      // The destination is already the title when there is no people to name.
      value: [episode.peuple ? episode.destination : "", episode.country]
        .filter(Boolean)
        .join(", "),
      Icon: MapPin,
    },
    { label: "Celebrity", value: episode.celebrite, Icon: Star },
    {
      label: "First broadcast",
      value: episode.diffusion_date,
      Icon: CalendarDays,
    },
  ].filter((detail) => detail.value);

  // `contain` letterboxes instead of cropping: in the side-by-side layout the
  // thumbnail's column is nearly square, and cropping would cut off its caption.
  const thumbnail = (fit: "cover" | "contain") =>
    episode.thumbnail ? (
      <>
        {/* The skeleton sits behind the image and shows until it has loaded. A
            letterboxed image leaves bare areas, so there the black backdrop is the placeholder. */}
        {fit === "cover" && (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}
        <Image
          src={episode.thumbnail}
          alt={`Thumbnail of episode ${episode.episode}: ${title}`}
          fill
          sizes={`${width}px`}
          className={fit === "cover" ? "object-cover" : "object-contain"}
        />
      </>
    ) : null;

  const closeButton = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Close"
      className="pointer-coarse:size-10"
      onClick={() => map.closePopup()}
    >
      <X />
    </Button>
  );

  const badges = (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="secondary">Episode {episode.episode}</Badge>
      {episode.duration && (
        <Badge variant="outline">
          <Clock data-icon="inline-start" />
          {episode.duration}
        </Badge>
      )}
    </div>
  );

  const detailList = (
    <ul className="flex flex-col gap-1.5">
      {details.map((detail) => (
        <li key={detail.label} className="flex items-center gap-2">
          <detail.Icon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="sr-only">{detail.label}: </span>
          {detail.value}
        </li>
      ))}
    </ul>
  );

  // Some episodes have no playable full video, and then there is nothing to offer.
  const watchButton = episode.link ? (
    <Button
      className="w-full pointer-coarse:h-10"
      nativeButton={false}
      render={
        <a href={episode.link} target="_blank" rel="noopener noreferrer" />
      }
    >
      Watch video
      <ExternalLink data-icon="inline-end" />
    </Button>
  ) : null;

  return (
    <Popup
      ref={popupRef}
      className="episode-popup"
      closeButton={false}
      // Panning is handled by the map bridge, which knows about the sidebar.
      autoPan={false}
      minWidth={width}
      maxWidth={width}
    >
      {horizontal ? (
        // Short, wide viewports (a phone held sideways): thumbnail beside the text.
        <Card
          size="sm"
          className="max-h-[calc(100dvh-5rem)] flex-row gap-0! overflow-y-auto py-0! shadow-lg"
          style={{ width }}
        >
          {episode.thumbnail && (
            <div className="relative w-2/5 shrink-0 self-stretch bg-black">
              {thumbnail("contain")}
            </div>
          )}
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-2.5 pt-3",
              // The footer normally closes the card; without one, pad the bottom.
              !watchButton && "pb-3",
            )}
          >
            <CardHeader>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardAction>{closeButton}</CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {badges}
              {detailList}
            </CardContent>
            {watchButton && (
              <CardFooter className="mt-auto">{watchButton}</CardFooter>
            )}
          </div>
        </Card>
      ) : (
        <Card
          size="sm"
          // Capped so the popup can never be taller than the screen.
          className={cn(
            "max-h-[calc(100dvh-7rem)] overflow-y-auto shadow-lg",
            episode.thumbnail && "pt-0",
          )}
          style={{ width }}
        >
          {episode.thumbnail && (
            <AspectRatio ratio={16 / 9} className="bg-muted">
              {thumbnail("cover")}
            </AspectRatio>
          )}
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardAction>{closeButton}</CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {badges}
            {detailList}
          </CardContent>
          {watchButton && <CardFooter>{watchButton}</CardFooter>}
        </Card>
      )}
    </Popup>
  );
}
