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
import type { EpisodeFilters, SortOrder } from "@/lib/episode-utils";

type FiltersPanelProps = {
  filters: EpisodeFilters;
  onChange: (changes: Partial<EpisodeFilters>) => void;
  onReset: () => void;
  isFiltered: boolean;
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
  sort,
  onSortChange,
  resultCount,
  totalCount,
  searchRef,
  onArrowDown,
}: FiltersPanelProps) {
  return (
    <div className="flex flex-col gap-2.5" role="search">
      <InputGroup className="h-9 bg-background pointer-coarse:h-11">
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
