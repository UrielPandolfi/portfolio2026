import { Icon } from "./Icon";

const contact = {
  name: "Uriel Pandolfi",
  email: "urielpandolfi@gmail.com",
  github: "https://github.com/UrielPandolfi",
  linkedin: "https://www.linkedin.com/in/urielpandolfi/",
};

export function ContactLetter() {
  const links = [
    {
      label: "Email",
      value: contact.email,
      href: `mailto:${contact.email}`,
      external: false,
      accessibleLabel: `Email Uriel at ${contact.email}`,
    },
    {
      label: "GitHub",
      value: "@UrielPandolfi",
      href: contact.github,
      external: true,
      accessibleLabel: "Visit Uriel's GitHub profile (opens in a new tab)",
    },
    {
      label: "LinkedIn",
      value: "@urielpandolfi",
      href: contact.linkedin,
      external: true,
      accessibleLabel: "Visit Uriel's LinkedIn profile (opens in a new tab)",
    },
  ];

  return (
    <article className="contact-letter paper" aria-labelledby="contact-letter-title">
      <div className="letter-topline">
        <span>PERSONAL CORRESPONDENCE</span>
        <Icon name="letter" />
      </div>

      <div className="wax-seal" aria-hidden="true">
        UP
      </div>

      <span className="paper-eyebrow">A NOTE TO THE CURIOUS</span>

      <h2 id="contact-letter-title">
        Good things begin
        <br />
        with a conversation.
      </h2>

      <p className="salutation">Dear fellow builder,</p>

      <p>
        I build thoughtful web experiences with WordPress, React, and custom
        integrations. Have a project in mind or a place on your team?
        I’m open to freelance projects and remote opportunities.
        Let’s create something worth making.
      </p>

      <div className="contact-links">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            aria-label={link.accessibleLabel}
          >
            <span>{link.label}</span>
            <em>{link.value}</em>
            <Icon name="arrow" size={18} />
          </a>
        ))}
      </div>

      <div className="letter-signoff">
        <span>With curiosity,</span>
        <strong>{contact.name}</strong>
        <small>SOFTWARE DEVELOPER &amp; CURIOUS MIND</small>
      </div>
    </article>
  );
}
