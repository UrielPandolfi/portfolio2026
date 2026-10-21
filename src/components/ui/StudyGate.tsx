"use client";

import { useProgress } from "@react-three/drei";
import { getRain } from "@/lib/rainAudio";
import { Icon } from "./Icon";

export function StudyGate({
  ready,
  onListen,
  onQuiet,
}: {
  ready: boolean;
  onListen: () => void;
  onQuiet: () => void;
}) {
  const { progress } = useProgress();

  return (
    <div
      className="sound-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sound-gate-title"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="sound-gate-card">
        <Icon name="headphones" size={46} />
        <h2 id="sound-gate-title">Put on your headphones</h2>
        {ready ? (
          <>
            <p>Rain at the window, and a piano in another room.</p>
            <div className="sound-gate-actions">
              <button
                className="atmosphere-button is-dreamy"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => {
                  getRain().setDesired(true);
                  getRain().unlock();
                  onListen();
                }}
              >
                Listen
              </button>
              <button className="atmosphere-button" onClick={onQuiet}>
                Enter quietly
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Opening the study…</p>
            <div className="loading-rule" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
            <span className="sound-gate-progress">
              GATHERING THE DETAILS · {Math.round(progress)}%
            </span>
          </>
        )}
      </div>
    </div>
  );
}
