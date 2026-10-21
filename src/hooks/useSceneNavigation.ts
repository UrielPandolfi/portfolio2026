"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SceneState, Section } from "@/data/sceneConfig";

export function useSceneNavigation(reducedMotion: boolean) {
  const [state, setState] = useState<SceneState>("idle");
  const [selected, setSelected] = useState<Section | null>(null);
  const stateRef = useRef<SceneState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const shouldRestoreFocus = useRef(false);
  const moveTo = useCallback((next: SceneState) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const open = useCallback(
    (section: Section) => {
      if (stateRef.current !== "idle") return;
      const active = document.activeElement;
      opener.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : document.querySelector<HTMLElement>(`[data-section="${section}"]`);
      setSelected(section);
      moveTo("focusing");
      timer.current = setTimeout(
        () => moveTo(section),
        reducedMotion ? 0 : 850,
      );
    },
    [moveTo, reducedMotion],
  );
  const close = useCallback(() => {
    if (stateRef.current === "idle" || stateRef.current === "returning") return;
    if (timer.current) clearTimeout(timer.current);
    moveTo("returning");
    timer.current = setTimeout(
      () => {
        shouldRestoreFocus.current = true;
        setSelected(null);
        moveTo("idle");
      },
      reducedMotion ? 0 : 750,
    );
  }, [moveTo, reducedMotion]);
  // Wait for React to remove `inert` from the navigation before restoring focus.
  useEffect(() => {
    if (state === "idle" && shouldRestoreFocus.current) {
      opener.current?.focus();
      shouldRestoreFocus.current = false;
    }
  }, [state]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return {
    state,
    selected,
    open,
    close,
    isPanelOpen: !!selected && state === selected,
  };
}
