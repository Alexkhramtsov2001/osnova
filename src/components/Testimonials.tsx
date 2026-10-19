import { useState } from "react";
import { demoReviews } from "../features/company/content";
import "./Testimonials.css";

export default function Testimonials() {
  const [paused, setPaused] = useState(false);
  return (
    <section className="testimonials" aria-labelledby="testimonials-title">
      <div className="testimonials-heading">
        <div>
          <p className="eyebrow">ОТЗЫВЫ / ДЕМОНСТРАЦИЯ</p>
          <h3 id="testimonials-title">О доме и работе команды</h3>
        </div>
        <button
          className="button button-secondary"
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused((current) => !current)}
        >
          {paused ? "Продолжить движение" : "Пауза отзывов"}
        </button>
      </div>
      <p className="testimonials-notice" id="testimonials-notice">
        Все отзывы демонстрационные и вымышленные. Имена, города и истории приведены для портфолио и
        не подтверждают реальные заказы.
      </p>
      <div
        className="testimonials-viewport"
        role="region"
        aria-label="Лента демонстрационных отзывов"
        aria-describedby="testimonials-notice testimonials-help"
        tabIndex={0}
        data-paused={paused}
        onFocusCapture={(event) => {
          const card = (event.target as HTMLElement).closest<HTMLElement>(".testimonial-card");
          if (card) {
            requestAnimationFrame(() =>
              card.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" }),
            );
          }
        }}
      >
        <div className="testimonials-track">
          {[false, true].map((duplicate) => (
            <ul
              className="testimonials-group"
              key={String(duplicate)}
              aria-hidden={duplicate || undefined}
              inert={duplicate || undefined}
            >
              {demoReviews.map((review) => (
                <li className="testimonial-card" key={review.name} tabIndex={duplicate ? -1 : 0}>
                  <span className="testimonial-stars" role="img" aria-label="Пять из пяти звёзд">
                    ★★★★★
                  </span>
                  <blockquote>«{review.quote}»</blockquote>
                  <div className="testimonial-author">
                    <strong>{review.name}</strong>
                    <span>{review.city}</span>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <p className="testimonials-help" id="testimonials-help">
        Наведите указатель для паузы. При фокусе лента становится неподвижной: используйте Tab для
        перехода между отзывами или прокручивайте её вручную.
      </p>
    </section>
  );
}
