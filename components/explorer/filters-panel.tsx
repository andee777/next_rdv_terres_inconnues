"use client";

import { ArrowDownUp, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  hostFirstName,
  type EpisodeFilters,
  type SortOrder,
} from "@/lib/episode-utils";

type FiltersPanelProps = {
  filters: EpisodeFilters;
  onChange: (changes: Partial<EpisodeFilters>) => void;
  onReset: () => void;
  isFiltered: boolean;
  hosts: readonly string[];
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  resultCount: number;
  totalCount: number;
  searchRef: React.Ref<HTMLInputElement>;
  /** Called when the user presses ArrowDown in the search field. */
  onArrowDown: () => void;
};

const SORT_LABELS: Record<SortOrder, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
};

export function FiltersPanel({
  filters,
  onChange,
  onReset,
  isFiltered,
  hosts,
  sort,
  onSortChange,
  resultCount,
  totalCount,
  searchRef,
  onArrowDown,
}: FiltersPanelProps) {
  return (
    <div className="flex flex-col gap-2.5" role="search">
      <InputGroup className="h-9 bg-background">
        <InputGroupAddon>
          <Search aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          ref={searchRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="Celebrity, people, place, country…"
          aria-label="Search episodes"
          value={filters.query}
          onChange={(event) => onChange({ query: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              if (filters.query) onChange({ query: "" });
              else event.currentTarget.blur();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              onArrowDown();
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          {filters.query ? (
            <InputGroupButton
              size="icon-xs"
              aria-label="Clear search"
              onClick={() => onChange({ query: "" })}
            >
              <X />
            </InputGroupButton>
          ) : (
            <Kbd aria-hidden>/</Kbd>
          )}
        </InputGroupAddon>
      </InputGroup>

      <ToggleGroup
        multiple
        value={filters.hosts}
        onValueChange={(hostsValue) => onChange({ hosts: hostsValue })}
        variant="outline"
        size="sm"
        spacing={1}
        className="w-full"
        aria-label="Filter by host"
      >
        {hosts.map((host) => (
          <ToggleGroupItem
            key={host}
            value={host}
            aria-label={`Host: ${host}`}
            title={host}
            // A clearly "on" state; the default pressed style is a faint grey.
            className="flex-1 data-pressed:border-primary! data-pressed:bg-primary! data-pressed:text-primary-foreground!"
          >
            {hostFirstName(host)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="flex items-center gap-2.5 text-xs whitespace-nowrap">
        <label className="flex cursor-pointer items-center gap-1.5">
          <Switch
            size="sm"
            checked={filters.onlyWithVideo}
            onCheckedChange={(checked) => onChange({ onlyWithVideo: checked })}
          />
          With video
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <Switch
            size="sm"
            checked={filters.hideWatched}
            onCheckedChange={(checked) => onChange({ hideWatched: checked })}
          />
          Unwatched
        </label>
      </div>

      <div className="flex h-6 items-center justify-between gap-2 text-xs whitespace-nowrap text-muted-foreground">
        <p aria-live="polite" aria-atomic="true">
          {isFiltered
            ? `${resultCount} of ${totalCount} episodes`
            : `${totalCount} episodes`}
        </p>
        <div className="flex items-center gap-1">
          {isFiltered && (
            <Button
              variant="link"
              size="xs"
              className="h-6 px-1"
              onClick={onReset}
            >
              Clear
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground"
                  aria-label={`Sort: ${SORT_LABELS[sort]}`}
                />
              }
            >
              <ArrowDownUp />
              {sort === "newest" ? "Newest" : "Oldest"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(value) => onSortChange(value as SortOrder)}
              >
                <DropdownMenuRadioItem value="newest">
                  {SORT_LABELS.newest}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">
                  {SORT_LABELS.oldest}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
