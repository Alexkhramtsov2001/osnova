import { CONTACTS, contactLinks } from "../features/contact/links";
import ArrowIcon from "./ArrowIcon";
import ContactIcon from "./ContactIcon";
import DemoChat from "./DemoChat";

type ContactSectionProps = {
  id?: string;
  title: string;
  description?: string;
  subject: string;
  message?: string;
};

export default function ContactSection({
  id,
  title,
  description,
  subject,
  message,
}: ContactSectionProps) {
  const links = contactLinks(subject, message);
  return (
    <section
      className="contact-section section-wrap"
      id={id}
      aria-labelledby="contact-section-title"
    >
      <div className="contact-section-head">
        <div>
          <h2 id="contact-section-title">{title}</h2>
        </div>
        {description && <p>{description}</p>}
      </div>
      <div className="contact-options">
        <a className="contact-option contact-channel-email" href={links.email}>
          <span className="contact-option-heading">
            <span className="contact-option-icon">
              <ContactIcon kind="email" />
            </span>
            <span>Email</span>
            <span className="contact-option-arrow" aria-hidden="true">
              <ArrowIcon />
            </span>
          </span>
          <strong>{CONTACTS.email}</strong>
          <small>
            {message ? "Открыть письмо с подготовленным текстом" : "Открыть почтовое приложение"}
          </small>
        </a>
        <a
          className="contact-option contact-channel-telegram"
          href={links.telegram}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="contact-option-heading">
            <span className="contact-option-icon">
              <ContactIcon kind="telegram" />
            </span>
            <span>Telegram</span>
            <span className="contact-option-arrow" aria-hidden="true">
              <ArrowIcon />
            </span>
          </span>
          <strong>@{CONTACTS.telegramUsername}</strong>
          <small>{message ? "Открыть чат с подготовленным текстом" : "Открыть чат"}</small>
        </a>
        <a
          className="contact-option contact-channel-vk"
          href={links.vk}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="contact-option-heading">
            <span className="contact-option-icon">
              <ContactIcon kind="vk" />
            </span>
            <span>ВКонтакте</span>
            <span className="contact-option-arrow" aria-hidden="true">
              <ArrowIcon />
            </span>
          </span>
          <strong>khramtsov2001</strong>
          <small>Открыть страницу</small>
        </a>
      </div>
      <p className="contact-section-note">
        Это контакты автора портфолио. Сайт сам не отправляет сообщение и не сохраняет переписку;
        отправку вы подтверждаете в выбранном приложении.
      </p>
      <DemoChat />
    </section>
  );
}
