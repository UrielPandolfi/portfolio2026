"use client";
import { useEffect, useRef } from "react";
import { CloseButton } from "./CloseButton";

export function ModalFrame({
  children,
  onClose,
  title,
  kind,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  kind: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const initial = dialog.querySelector<HTMLElement>("button");
    initial?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex="0"]',
        ),
      ).filter((el) => el.getClientRects().length > 0);
      const first = elements[0],
        last = elements[elements.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", trap);
    return () => dialog.removeEventListener("keydown", trap);
  }, []);
  return (
    <div
      ref={ref}
      className={`modal-stage ${kind}-stage`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <CloseButton onClose={onClose} />
      {children}
    </div>
  );
}
