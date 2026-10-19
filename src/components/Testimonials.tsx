import { demoReviews } from "../features/company/content";
import "./Testimonials.css";

export default function Testimonials() {
  return (
    <section className="testimonials" aria-labelledby="testimonials-title">
      <div className="testimonials-heading">
        <div>
          <p className="eyebrow">ОТЗЫВЫ / ДЕМОНСТРАЦИЯ</p>
          <h3 id="testimonials-title">О доме и работе команды</h3>
        </div>
      </div>
      <p className="testimonials-notice" id="testimonials-notice">
        Все отзывы демонстрационные и вымышленные. Имена, города и истории приведены для портфолио и
        не подтверждают реальные заказы.
      </p>
      <div
        className="testimonials-viewport"
        role="region"
        aria-label="Лента демонстрационных отзывов"
        aria-describedby="testimonials-notice"
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
                <li className="testimonial-card" key={review.name}>
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
    </section>
  );
}
