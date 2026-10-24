import { profile } from "@/data/profile";
import { Icon } from "./Icon";

export function PhilosophyPanel() {
  return (
    <article className="philosophy-panel paper">
      <span className="paper-eyebrow">IV — NOTES ON LIVING</span>

      <div className="philosophy-symbol">
        <Icon name="hourglass" size={37} />
      </div>

      <h2>
        Live with intention.
        <br />
        <em>Stay open to life.</em>
      </h2>

      <p className="philosophy-intro">
      For me, philosophy is an antidote I drink a little of each day. Slowly, it soothes the unease of being human: the fear of loss, the need for certainty, and the urge to control what lies beyond us.
      </p>

      <div className="principles">
        {profile.philosophy.map((item, index) => (
          <section key={item.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </section>
        ))}
      </div>

      <div className="paper-bottom-ornament">✧</div>
      <small className="original-note">
        Personal reflections · Uriel Pandolfi
      </small>
    </article>
  );
}