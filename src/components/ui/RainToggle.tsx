"use client";

import { useEffect, useState } from "react";
import { usePageVisible } from "@/hooks/usePreferences";
import { getRain } from "@/lib/rainAudio";
import { Icon } from "./Icon";

export function RainToggle({
  suspended,
  enabled,
  onToggle,
  gestureUnlock,
}: {
  suspended: boolean;
  enabled: boolean;
  onToggle: (on: boolean) => void;
  gestureUnlock: boolean;
}) {
  const visible = usePageVisible();
  const [playing, setPlaying] = useState(false);
  const audible = enabled && !suspended && visible;

  useEffect(() => {
    return getRain().subscribe(setPlaying);
  }, []);
  useEffect(() => {
    getRain().setDesired(audible);
  }, [audible]);
  useEffect(() => {
    if (!gestureUnlock) return;
    const unlock = () => getRain().unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [gestureUnlock]);

  return (
    <button
      className={`atmosphere-button ${enabled ? "is-dreamy" : ""}`}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute the rain" : "Play the rain"}
      data-playing={playing ? "true" : "false"}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") event.stopPropagation();
      }}
      onClick={() => {
        const next = !enabled;
        onToggle(next);
        getRain().setDesired(next && !suspended && visible);
        getRain().unlock();
      }}
    >
      <Icon name={enabled ? "volume" : "mute"} size={17} />
      <span>{enabled ? "Rain" : "Quiet"}</span>
    </button>
  );
}
