import { profile } from "@/data/profile";
export function AboutPanel() {
  return (
    <article className="about-panel paper">
      <aside className="about-aside">
        <span className="paper-eyebrow">THE PERSON BEHIND THE WORK</span>
        <div className="large-monogram">
          U<span>P</span>
          <i>✧</i>
        </div>
        <span className="aside-caption">
          A practice in
          <br />
          <em>thoughtful creation.</em>
        </span>
        <div className="aside-rule" />
        <span className="paper-eyebrow">SYSTEMS. WORLDS. IDEAS.</span>
      </aside>
      <div className="about-content">
        <span className="paper-eyebrow">III — ABOUT ME</span>
        <h2>
          A curious mind.
          <br />A builder’s hands.
        </h2>
        <p className="lead">{profile.introduction}</p>
        <p>{profile.biography}</p>
        <div className="specialties">
          {profile.specialties.map((item) => (
            <div key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
        <h3 className="stack-heading">Tools of the craft</h3>
        <ul className="stack-list">
          {profile.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="about-closing">{profile.approach}</p>
      </div>
    </article>
  );
}
