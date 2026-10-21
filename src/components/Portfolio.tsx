"use client";
import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { HeroOverlay } from "./ui/HeroOverlay";
import { ModalFrame } from "./ui/ModalFrame";
import { ContactLetter } from "./ui/ContactLetter";
import { AboutPanel } from "./ui/AboutPanel";
import { PhilosophyPanel } from "./ui/PhilosophyPanel";
import { useSceneNavigation } from "@/hooks/useSceneNavigation";
import {
  useMobile,
  usePageVisible,
  useReducedMotion,
} from "@/hooks/usePreferences";
import { objectConfig } from "@/data/sceneConfig";

const Experience = dynamic(() => import("./scene/Experience"), { ssr: false });
const LoadingStatus = dynamic(
  () => import("./scene/Experience").then((module) => module.LoadingStatus),
  { ssr: false },
);
const ProjectsBook = dynamic(
  () => import("./ui/ProjectsBook").then((module) => module.ProjectsBook),
  { ssr: false },
);

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError();
    console.error("The study could not load", error, info.componentStack);
  }
  render() {
    return this.state.error ? (
      <div className="scene-error">
        <p>
          The 3D study couldn’t load.
          <br />
          The portfolio is still available below.
        </p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Portfolio() {
  const reduced = useReducedMotion();
  const mobile = useMobile();
  const visible = usePageVisible();
  const [calm, setCalm] = useState(false);
  const [dreamy, setDreamy] = useState(true);
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const navigation = useSceneNavigation(reduced || calm);
  return (
    <main
      className={`portfolio ${calm || reduced ? "is-still" : ""}`}
      data-scene-state={navigation.state}
    >
      <div className="room-background" aria-hidden="true" />
      <div
        className={`scene-layer ${navigation.isPanelOpen ? "is-focused" : ""}`}
        aria-hidden={navigation.state !== "idle"}
      >
        <SceneBoundary onError={markReady}>
          <Experience
            state={navigation.state}
            selected={navigation.selected}
            onOpen={navigation.open}
            reducedMotion={reduced || calm}
            mobile={mobile}
            visible={visible && !navigation.isPanelOpen}
            dreamy={dreamy}
            onReady={markReady}
          />
        </SceneBoundary>
      </div>
      <div className="room-vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      {!ready && navigation.state === "idle" && <LoadingStatus />}
      <HeroOverlay
        onOpen={navigation.open}
        active={navigation.state === "idle"}
        calm={calm || reduced}
        onToggleCalm={() => setCalm((value) => !value)}
        dreamy={dreamy}
        onToggleDreamy={() => setDreamy((value) => !value)}
      />
      {navigation.isPanelOpen && navigation.selected && (
        <ModalFrame
          onClose={navigation.close}
          title={objectConfig[navigation.selected].label}
          kind={navigation.selected}
        >
          {navigation.selected === "projects" && (
            <ProjectsBook reducedMotion={reduced || calm} />
          )}
          {navigation.selected === "contact" && <ContactLetter />}
          {navigation.selected === "about" && <AboutPanel />}
          {navigation.selected === "philosophy" && <PhilosophyPanel />}
        </ModalFrame>
      )}
    </main>
  );
}
