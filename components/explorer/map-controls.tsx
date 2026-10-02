"use client";

import { Maximize2, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EpisodeMapApi } from "@/components/episode-map/types";

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            // Solid in both themes: the outline variant is translucent in dark mode,
            // and `!` is needed to win over its `dark:bg-input/30`.
            className="bg-background shadow-md hover:bg-muted dark:bg-background! dark:hover:bg-muted!"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}

type MapControlsProps = {
  api: EpisodeMapApi | null;
  onFit: () => void;
};

/** Zoom and re-frame controls, replacing Leaflet's default zoom buttons. */
export function MapControls({ api, onFit }: MapControlsProps) {
  const disabled = api === null;

  return (
    <div className="fixed right-3 bottom-9 z-10 flex flex-col gap-2 md:right-4">
      <ButtonGroup orientation="vertical" aria-label="Zoom">
        <ControlButton
          label="Zoom in"
          disabled={disabled}
          onClick={() => api?.zoomIn()}
        >
          <Plus />
        </ControlButton>
        <ControlButton
          label="Zoom out"
          disabled={disabled}
          onClick={() => api?.zoomOut()}
        >
          <Minus />
        </ControlButton>
      </ButtonGroup>
      <ControlButton
        label="Fit all episodes"
        disabled={disabled}
        onClick={onFit}
      >
        <Maximize2 />
      </ControlButton>
    </div>
  );
}
