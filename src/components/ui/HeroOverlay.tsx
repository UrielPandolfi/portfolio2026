import Link from "next/link";
import { profile } from "@/data/profile";
import { objectConfig, sections, type Section } from "@/data/sceneConfig";
import { Icon } from "./Icon";

const icons = {
  projects: "book",
  contact: "letter",
  about: "bust",
  philosophy: "hourglass",
} as const;

export function HeroOverlay({
  onOpen,
  active,
  calm,
  onToggleCalm,
}: {
  onOpen: (section: Section) => void;
  active: boolean;
  calm: boolean;
  onToggleCalm: () => void;
}) {
  return (
    <div className={`hero-ui ${active ? "" : "is-away"}`} inert={!active}>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="The Stoic Desk, home">
          <span className="brand-symbol">
            UP<span>✧</span>
          </span>
          <span>
            THE STOIC DESK<span className="wordmark-sub">A DIGITAL STUDY</span>
          </span>
        </Link>
        <div className="header-note">
          <span className="tiny-star">✦</span> THOUGHTFULLY BUILT. ENDLESSLY
          CURIOUS.
        </div>
        <button
          className={`atmosphere-button ${calm ? "is-calm" : ""}`}
          aria-label={calm ? "Enable ambient motion" : "Reduce ambient motion"}
          aria-pressed={calm}
          onClick={onToggleCalm}
        >
          <Icon name="sun" size={17} />
          <span>{calm ? "Stillness" : "Atmosphere"}</span>
        </button>
      </header>
      <section className="hero-title" aria-label="Introduction">
        <div className="eyebrow">
          <span /> DEVELOPER · CREATOR · EXPLORER <span />
        </div>
        <h1>{profile.name}</h1>
        <p>{profile.tagline}</p>
        <div className="title-ornament">
          <span />✧<span />
        </div>
      </section>
      <div className="study-note">
        <span>EST. IN CURIOSITY</span>
        <div />
        <span>MADE WITH INTENTION</span>
      </div>
      <footer className="site-footer">
        <p className="explore-hint">
          <span className="hint-dot" /> Every object holds a story.
          <span className="hint-desktop"> Choose one to begin.</span>
        </p>
        <nav className="object-navigation" aria-label="Explore the study">
          {sections.map((section) => (
            <button
              key={section}
              data-section={section}
              onClick={() => onOpen(section)}
              aria-haspopup="dialog"
            >
              <Icon name={icons[section]} size={19} />
              <span>{objectConfig[section].label}</span>
              <small>{objectConfig[section].numeral}</small>
            </button>
          ))}
        </nav>
        <div className="footer-baseline">
          <span>CODE WITH PURPOSE. CREATE WITH PATIENCE.</span>
          <span>
            THE STOIC DESK <i>©</i> {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
