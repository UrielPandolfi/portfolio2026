import { profile } from "@/data/profile";
import { Icon } from "./Icon";
export function PhilosophyPanel() {
  return (
    <article className="philosophy-panel paper">
      <span className="paper-eyebrow">IV — NOTES ON MAKING</span>
      <div className="philosophy-symbol">
        <Icon name="hourglass" size={37} />
      </div>
      <h2>
        Time is the material.
        <br />
        <em>Intention is the craft.</em>
      </h2>
      <p className="philosophy-intro">
        A few principles I return to, in code and beyond.
      </p>
      <div className="principles">
        {profile.philosophy.map((item, index) => (
          <section key={item.title}>
            <span>0{index + 1}</span>
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
