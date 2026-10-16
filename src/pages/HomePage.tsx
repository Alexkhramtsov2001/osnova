import "./HomePage.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ArrowIcon from "../components/ArrowIcon";
import { projects } from "../features/projects/catalog";
import { formatPriceRange, getProjectEstimate } from "../features/projects/estimates";
import { advantages, reviews } from "../features/company/content";
export default function HomePage() {
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroHovered, setHeroHovered] = useState(false);
  const [heroFocused, setHeroFocused] = useState(false);
  const heroTouchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressHeroLinkClick = useRef(false);
  const featuredProject = projects[heroSlide];

  useEffect(() => {
    if (heroHovered || heroFocused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setHeroSlide((current) => (current + 1) % projects.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroSlide, heroHovered, heroFocused]);

  const showHeroSlide = (index: number) => {
    setHeroSlide((index + projects.length) % projects.length);
  };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        {" "}
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              СТРОИТЕЛЬСТВО ЗАГОРОДНЫХ ДОМОВ
            </p>

            <h1>
              Дом начинается
              <br />
              <span>с основы.</span>
            </h1>

            <p className="hero-description">
              Проектируем и строим современные дома, в которых продумана каждая деталь — от
              фундамента до последнего штриха.
            </p>

            <div className="hero-actions">
              <Link className="button button-primary button-center-label" to="/calculator">
                <span>Рассчитать стоимость</span> <ArrowIcon />
              </Link>
              <Link className="button button-secondary button-center-label" to="/projects">
                <span>Смотреть проекты</span> <ArrowIcon direction="down" />
              </Link>
            </div>

            <div className="hero-note">
              <span className="hero-note-line" />
              <p>Понятная смета. Продуманный результат.</p>
            </div>
          </div>

          <div
            className="hero-visual"
            aria-label="Готовые варианты домов"
            onMouseEnter={() => setHeroHovered(true)}
            onMouseLeave={() => setHeroHovered(false)}
            onFocusCapture={() => setHeroFocused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setHeroFocused(false);
            }}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              heroTouchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
              suppressHeroLinkClick.current = false;
            }}
            onTouchEnd={(event) => {
              const start = heroTouchStart.current;
              const touch = event.changedTouches[0];
              heroTouchStart.current = null;
              if (!start || !touch) return;
              const deltaX = touch.clientX - start.x;
              const deltaY = touch.clientY - start.y;
              if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
              suppressHeroLinkClick.current = true;
              showHeroSlide(heroSlide + (deltaX < 0 ? 1 : -1));
            }}
          >
            <Link
              className="hero-image-link"
              to={`/projects/${featuredProject.number}`}
              aria-label={`Смотреть проект ${featuredProject.name} в каталоге`}
              onClick={(event) => {
                if (suppressHeroLinkClick.current) event.preventDefault();
                suppressHeroLinkClick.current = false;
              }}
            >
              <img
                key={featuredProject.number}
                className="hero-image"
                src={featuredProject.image}
                alt={`Иллюстративное фото экстерьера для проекта «${featuredProject.name}»`}
                fetchPriority={heroSlide === 0 ? "high" : "auto"}
              />
            </Link>
            <button
              className="hero-side-arrow hero-side-arrow-prev"
              type="button"
              aria-label="Предыдущий проект"
              onClick={() => showHeroSlide(heroSlide - 1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 4-8 8 8 8" />
              </svg>
            </button>
            <button
              className="hero-side-arrow hero-side-arrow-next"
              type="button"
              aria-label="Следующий проект"
              onClick={() => showHeroSlide(heroSlide + 1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 4 8 8-8 8" />
              </svg>
            </button>
            <div className="image-label">
              <div className="hero-slide-caption" aria-live={heroFocused ? "polite" : "off"}>
                <Link to={`/projects/${featuredProject.number}`}>
                  Проект «{featuredProject.name}» <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-bottom">
            <span>01 — ПРОЕКТИРУЕМ</span>
            <span>02 — РАССЧИТЫВАЕМ</span>
            <span>03 — СТРОИМ</span>
          </div>
        </section>
        <section className="section-wrap home-popular">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ИЗБРАННЫЕ КОНЦЕПЦИИ</p>
              <h2>
                С чего начинается <span>ваш дом.</span>
              </h2>
            </div>
          </div>
          <div className="project-grid">
            {projects.slice(0, 3).map((project) => {
              const estimate = getProjectEstimate(project);
              return (
                <article className="project-card" key={project.number}>
                  <Link className="project-image-link" to={`/projects/${project.number}`}>
                    <img
                      className="project-image"
                      src={project.image}
                      alt={`Концепция дома «${project.name}»`}
                      loading="lazy"
                    />
                  </Link>
                  <div className="project-info">
                    <h3>
                      <Link to={`/projects/${project.number}`}>{project.name}</Link>
                    </h3>
                    <p>
                      {project.area} м² · {project.floors} эт. · {project.bedrooms} спальни
                    </p>
                    <div className="project-price">
                      <small>Демонстрационный ориентир под ключ</small>
                      <strong>{formatPriceRange(estimate.minTotal, estimate.maxTotal)}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="home-popular-action">
            <Link className="button button-primary" to="/projects">
              Все проекты <ArrowIcon />
            </Link>
          </div>
        </section>
        <section className="approach-section" id="advantages">
          <div className="section-wrap content-section">
            <p className="eyebrow">НАШ ПОДХОД</p>
            <h2>
              Меньше неопределённости.
              <br />
              <span>Больше ясности.</span>
            </h2>
            <div className="principle-grid">
              {advantages.map((item, i) => (
                <article key={item.title}>
                  <small>0{i + 1}</small>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section-wrap calculator-promo">
          <div>
            <p className="eyebrow">ПРЕДВАРИТЕЛЬНЫЙ РАСЧЁТ</p>
            <h2>
              Рассчитайте стоимость <span>будущего дома.</span>
            </h2>
            <p>
              Задайте площадь, регион и тип дома. Сравните материалы, комплектации и форматы
              строительства: калькулятор покажет ориентир стоимости, состав этапов и сроки. Расчёт
              можно сохранить или скачать как демонстрационную смету.
            </p>
          </div>
          <Link className="button button-primary button-center-label" to="/calculator">
            <span>Рассчитать стоимость</span> <ArrowIcon />
          </Link>
        </section>
        <section className="section-wrap content-section">
          <p className="eyebrow">ДЕМОНСТРАЦИОННЫЕ ИСТОРИИ</p>
          <h2>
            Дом — это <span>личное.</span>
          </h2>
          <p className="section-lead">
            Вымышленные отзывы показывают оформление клиентских историй.
          </p>
          <div className="review-grid">
            {reviews.map((review, index) => (
              <article className="review-card" key={review.name}>
                <div className="review-card-top">
                  <span>ИСТОРИЯ / 0{index + 1}</span>
                  <span aria-hidden="true">“</span>
                </div>
                <blockquote>«{review.text}»</blockquote>
                <div className="review-card-footer">
                  <h3>{review.name}</h3>
                  <p>
                    {review.project} · {review.year}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="section-wrap home-discover" aria-label="Узнать больше об ОСНОВЕ">
          <article className="home-discover-card">
            <p className="eyebrow">О КОМПАНИИ</p>
            <h2>
              Люди и принципы <span>за проектом.</span>
            </h2>
            <p>
              Показываем, как устроена вымышленная команда ОСНОВЫ: путь от первой идеи до цифровых
              инструментов, роли специалистов и подход к работе.
            </p>
            <Link className="button button-secondary" to="/about">
              О компании <ArrowIcon />
            </Link>
          </article>
          <article className="home-discover-card">
            <p className="eyebrow">ПАРТНЁРЫ</p>
            <h2>
              Один дом — <span>много решений.</span>
            </h2>
            <p>
              Материалы, инженерия и архитектура требуют согласованной работы. На примерах
              показываем, как могли бы соединяться задачи разных партнёров.
            </p>
            <Link className="button button-secondary" to="/partners">
              Партнёры и кейсы <ArrowIcon />
            </Link>
          </article>
        </section>
        <section className="section-wrap final-cta">
          <h2>
            Обсудим <span>вашу идею?</span>
          </h2>
          <Link className="button button-primary" to="/contacts">
            Перейти к контактам <ArrowIcon />
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
