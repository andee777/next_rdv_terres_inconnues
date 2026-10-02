"use client";

import Image from "next/image";
import {
  CalendarDays,
  Circle,
  CircleCheck,
  Clock,
  ExternalLink,
  MapPin,
  Star,
  X,
} from "lucide-react";
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
import { useWatched } from "@/lib/use-watched";
import { cn } from "@/lib/utils";

const POPUP_WIDTH = 288;

export function EpisodePopup({ episode }: { episode: Episode }) {
  const map = useMap();
  const { watched, toggle } = useWatched();
  const isWatched = watched.has(episode.episode);

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

  return (
    <Popup
      className="episode-popup"
      closeButton={false}
      // Panning is handled by the map bridge, which knows about the sidebar.
      autoPan={false}
      minWidth={POPUP_WIDTH}
      maxWidth={POPUP_WIDTH}
    >
      <Card
        size="sm"
        className={cn("shadow-lg", episode.thumbnail && "pt-0")}
        style={{ width: POPUP_WIDTH }}
      >
        {episode.thumbnail && (
          <AspectRatio ratio={16 / 9} className="bg-muted">
            {/* The skeleton sits behind the image and shows until it has loaded. */}
            <Skeleton className="absolute inset-0 rounded-none" />
            <Image
              src={episode.thumbnail}
              alt={`Thumbnail of episode ${episode.episode}: ${title}`}
              fill
              sizes={`${POPUP_WIDTH}px`}
              className="object-cover"
            />
          </AspectRatio>
        )}
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close"
              onClick={() => map.closePopup()}
            >
              <X />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">Episode {episode.episode}</Badge>
            {episode.duration && (
              <Badge variant="outline">
                <Clock data-icon="inline-start" />
                {episode.duration}
              </Badge>
            )}
          </div>
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
        </CardContent>
        <CardFooter className="gap-2">
          {episode.link && (
            <Button
              className="flex-1"
              nativeButton={false}
              render={
                <a
                  href={episode.link}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Watch video
              <ExternalLink data-icon="inline-end" />
            </Button>
          )}
          <Button
            variant={episode.link ? "outline" : "secondary"}
            size={episode.link ? "icon" : "default"}
            className={episode.link ? undefined : "w-full"}
            aria-pressed={isWatched}
            aria-label={isWatched ? "Mark as not watched" : "Mark as watched"}
            title={isWatched ? "Mark as not watched" : "Mark as watched"}
            onClick={() => toggle(episode.episode)}
          >
            {isWatched ? <CircleCheck className="text-primary" /> : <Circle />}
            {!episode.link && (isWatched ? "Watched" : "Mark as watched")}
          </Button>
        </CardFooter>
      </Card>
    </Popup>
  );
}
