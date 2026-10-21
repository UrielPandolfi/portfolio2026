import { profile } from "@/data/profile";
import { Icon } from "./Icon";

export function ContactLetter() {
  const links = [
    {
      label: "Email",
      value: profile.contact.email,
      href: profile.contact.email ? `mailto:${profile.contact.email}` : null,
    },
    {
      label: "GitHub",
      value: profile.contact.github,
      href: profile.contact.github,
    },
    {
      label: "LinkedIn",
      value: profile.contact.linkedin,
      href: profile.contact.linkedin,
    },
  ];
  return (
    <article className="contact-letter paper">
      <div className="letter-topline">
        <span>PERSONAL CORRESPONDENCE</span>
        <Icon name="letter" />
      </div>
      <div className="wax-seal" aria-hidden="true">
        UP
      </div>
      <span className="paper-eyebrow">A NOTE TO THE CURIOUS</span>
      <h2>
        Good things begin
        <br />
        with a conversation.
      </h2>
      <p className="salutation">Dear fellow builder,</p>
      <p>
        Have an idea to bring to life, an interesting problem, or simply
        something worth sharing? I’d love to hear about it.
      </p>
      <div className="contact-links">
        {links.map((link) =>
          link.href ? (
            <a
              key={link.label}
              href={link.href}
              target={link.label === "Email" ? undefined : "_blank"}
              rel="noreferrer"
            >
              <span>{link.label}</span>
              <Icon name="arrow" size={18} />
            </a>
          ) : (
            <div className="contact-placeholder" key={link.label}>
              <span>{link.label}</span>
              <small>Address coming soon</small>
            </div>
          ),
        )}
      </div>
      <div className="letter-signoff">
        <span>With curiosity,</span>
        <strong>{profile.name}</strong>
        <small>SOFTWARE DEVELOPER & CURIOUS MIND</small>
      </div>
    </article>
  );
}
