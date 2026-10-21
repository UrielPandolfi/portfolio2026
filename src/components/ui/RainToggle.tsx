"use client";

import { useEffect, useState } from "react";
import { usePageVisible, useReducedMotion } from "@/hooks/usePreferences";
import { getRain } from "@/lib/rainAudio";
import { Icon } from "./Icon";

export function RainToggle({ suspended }: { suspended: boolean }) {
  const reduced = useReducedMotion();
  const visible = usePageVisible();
  const [override, setOverride] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const chosen = override ?? !reduced;
  const audible = chosen && !suspended && visible;

  useEffect(() => {
    return getRain().subscribe(setPlaying);
  }, []);
  useEffect(() => {
    getRain().setDesired(audible);
  }, [audible]);
  useEffect(() => {
    const unlock = () => getRain().unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <button
      className={`atmosphere-button ${chosen ? "is-dreamy" : ""}`}
      aria-pressed={chosen}
      aria-label={chosen ? "Mute the rain" : "Play the rain"}
      data-playing={playing ? "true" : "false"}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") event.stopPropagation();
      }}
      onClick={() => {
        const next = !chosen;
        setOverride(next);
        getRain().setDesired(next && !suspended && visible);
        getRain().unlock();
      }}
    >
      <Icon name={chosen ? "volume" : "mute"} size={17} />
      <span>{chosen ? "Rain" : "Quiet"}</span>
    </button>
  );
}
