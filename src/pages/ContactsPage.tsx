import { useState } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ContactSection from "../components/ContactSection";
import { contactLinks } from "../features/contact/links";
export default function ContactsPage() {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <div className="section-wrap page-intro contacts-page-intro">
          <h1>
            Начнём <span>с разговора.</span>
          </h1>
          <p className="interior-intro-copy">
            Здесь находятся контакты автора портфолио. Ниже можно открыть демонстрационный чат и
            попробовать форму: она проверяет поля локально и не отправляет данные.
          </p>
        </div>
        <ContactSection title="Контакты автора портфолио" subject="ОСНОВА — вопрос о проекте" />
        <section className="section-wrap content-section">
          <div className="contact-form-layout">
            <div>
              <h2>
                Ваша идея <span>будущего дома.</span>
              </h2>
              <p className="section-lead">
                Проверьте поля и откройте подготовленное письмо автору портфолио. Отправку вы
                подтвердите в почтовом приложении; сайт ничего не сохраняет.
              </p>
            </div>
            <form
              className="demo-contact-form"
              onInput={(event) => {
                setDraft(null);
                const target = event.target;
                if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
                  target.setCustomValidity("");
              }}
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const name = form.elements.namedItem("name") as HTMLInputElement;
                const email = form.elements.namedItem("email") as HTMLInputElement;
                const message = form.elements.namedItem("message") as HTMLTextAreaElement;
                name.setCustomValidity(
                  name.value.trim().length < 2 ? "Введите имя из двух или более символов" : "",
                );
                message.setCustomValidity(
                  message.value.trim().length < 10
                    ? "Опишите идею: минимум 10 символов без пробелов по краям"
                    : "",
                );
                if (form.reportValidity())
                  setDraft(
                    `Имя: ${name.value.trim()}\nEmail для ответа: ${email.value.trim()}\n\nИдея проекта:\n${message.value.trim()}`,
                  );
              }}
            >
              <label>
                Имя
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  pattern=".*\S.*"
                />
              </label>
              <label>
                Email
                <input name="email" type="email" required maxLength={120} autoComplete="email" />
              </label>
              <label>
                Идея проекта
                <textarea name="message" required minLength={10} maxLength={2000} rows={5} />
              </label>
              <button className="button button-primary" type="submit">
                Проверить заполнение
              </button>
              {draft && (
                <div className="contact-draft-ready" role="status">
                  <p>
                    Форма заполнена корректно: данные никуда не отправлены. Проверьте письмо в
                    почтовом приложении перед отправкой.
                  </p>
                  <a
                    className="button button-secondary"
                    href={contactLinks("ОСНОВА — идея проекта", draft).email}
                  >
                    Открыть подготовленное письмо
                  </a>
                </div>
              )}
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
