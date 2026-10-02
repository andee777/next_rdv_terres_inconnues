"use client";

import Image from "next/image";
import { Circle, CircleCheck, MapPin } from "lucide-react";

import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Episode } from "@/lib/episode";
import { episodeTitle, highlightRanges } from "@/lib/episode-utils";

/** Renders `text` with the parts matching the search query marked. */
function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = highlightRanges(text, query);
  if (ranges.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end]) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark
        key={start}
        className="rounded-[3px] bg-primary/15 px-px text-foreground"
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

type EpisodeListItemProps = {
  episode: Episode;
  query: string;
  selected: boolean;
  watched: boolean;
  onSelect: (episode: number) => void;
  onToggleWatched: (episode: number) => void;
  onHover: (episode: number | null) => void;
};

export function EpisodeListItem({
  episode,
  query,
  selected,
  watched,
  onSelect,
  onToggleWatched,
  onHover,
}: EpisodeListItemProps) {
  const title = episodeTitle(episode);

  return (
    <SidebarMenuItem
      id={`episode-row-${episode.episode}`}
      onMouseEnter={() => onHover(episode.episode)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(episode.episode)}
      onBlur={() => onHover(null)}
    >
      <SidebarMenuButton
        size="lg"
        isActive={selected}
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(episode.episode)}
        className="h-auto items-start gap-3 rounded-lg py-2 pr-9 data-active:shadow-[inset_2px_0_0_var(--primary)]"
      >
        <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-muted">
          {episode.thumbnail ? (
            <>
              <Skeleton className="absolute inset-0 rounded-none" />
              <Image
                src={episode.thumbnail}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </>
          ) : (
            <span className="absolute inset-0 grid place-items-center text-muted-foreground">
              <MapPin aria-hidden />
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm leading-snug font-medium">
            <Highlight text={title} query={query} />
          </span>
          <span className="truncate text-xs text-sidebar-foreground/80">
            <Highlight text={episode.celebrite} query={query} />
          </span>
          {/* Wraps to a second line rather than cutting the date off. */}
          <span className="line-clamp-2 text-xs leading-snug whitespace-normal text-muted-foreground">
            Ep. {episode.episode} ·{" "}
            <Highlight text={episode.country} query={query} />
            {episode.diffusion_date && ` · ${episode.diffusion_date}`}
          </span>
        </span>
      </SidebarMenuButton>
      <SidebarMenuAction
        showOnHover={!watched}
        aria-pressed={watched}
        aria-label={watched ? "Mark as not watched" : "Mark as watched"}
        title={watched ? "Mark as not watched" : "Mark as watched"}
        onClick={() => onToggleWatched(episode.episode)}
      >
        {watched ? <CircleCheck className="text-primary" /> : <Circle />}
      </SidebarMenuAction>
    </SidebarMenuItem>
  );
}
