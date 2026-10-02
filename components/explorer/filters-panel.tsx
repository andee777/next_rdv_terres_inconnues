"use client";

import { ArrowDownUp, Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

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
import { cn } from "@/lib/utils";

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
  // On compact screens the host chips and switches sit behind a toggle so the
  // episode list gets the space; on larger screens they are always visible.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount =
    (filters.hosts.length > 0 ? 1 : 0) + (filters.onlyWithVideo ? 1 : 0);

  return (
    <div className="flex flex-col gap-2.5" role="search">
      <div className="flex items-center gap-2">
        <InputGroup className="h-9 flex-1 bg-background pointer-coarse:h-11">
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
            placeholder="Search episodes…"
            aria-label="Search episodes"
            className="pointer-coarse:h-11"
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
                className="pointer-coarse:size-8"
                onClick={() => onChange({ query: "" })}
              >
                <X />
              </InputGroupButton>
            ) : (
              <Kbd aria-hidden className="pointer-coarse:hidden">
                /
              </Kbd>
            )}
          </InputGroupAddon>
        </InputGroup>

        <Button
          variant="outline"
          size="icon"
          className="relative hidden size-9 shrink-0 bg-background pointer-coarse:size-11 compact:inline-flex"
          aria-expanded={filtersOpen}
          aria-controls="episode-filters"
          aria-label={
            activeFilterCount > 0
              ? `Filters, ${activeFilterCount} active`
              : "Filters"
          }
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal />
          {activeFilterCount > 0 && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] leading-none font-semibold text-primary-foreground tabular-nums"
            >
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      <div
        id="episode-filters"
        className={cn(
          "flex flex-col gap-2.5",
          !filtersOpen && "compact:hidden",
        )}
      >
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
              className="flex-1 data-pressed:border-primary! data-pressed:bg-primary! data-pressed:text-primary-foreground! pointer-coarse:h-10"
            >
              {hostFirstName(host)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <label className="flex min-h-6 w-fit cursor-pointer items-center gap-1.5 text-xs whitespace-nowrap pointer-coarse:min-h-10">
          <Switch
            size="sm"
            checked={filters.onlyWithVideo}
            onCheckedChange={(checked) => onChange({ onlyWithVideo: checked })}
          />
          With video
        </label>
      </div>

      <div className="flex min-h-6 items-center justify-between gap-2 text-xs whitespace-nowrap text-muted-foreground">
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
              className="h-6 px-1 pointer-coarse:h-9 pointer-coarse:px-2"
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
                  className="text-muted-foreground pointer-coarse:h-10 pointer-coarse:px-2.5"
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
