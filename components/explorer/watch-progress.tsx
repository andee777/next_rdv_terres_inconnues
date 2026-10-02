"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";

type WatchProgressProps = {
  watched: number;
  total: number;
  onReset: () => void;
};

export function WatchProgress({ watched, total, onReset }: WatchProgressProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Progress value={watched} max={total} className="flex-1 gap-1.5">
        <ProgressLabel className="text-xs font-normal text-muted-foreground">
          Your progress
        </ProgressLabel>
        <ProgressValue className="text-xs">
          {(_, value) => `${value ?? 0} / ${total} watched`}
        </ProgressValue>
      </Progress>
      {watched > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Progress options"
                title="Progress options"
              />
            }
          >
            <RotateCcw />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive" onClick={onReset}>
              Reset {watched} watched {watched === 1 ? "episode" : "episodes"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
