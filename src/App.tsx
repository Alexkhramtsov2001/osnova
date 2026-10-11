import "./App.css";

const projects = [
  {
    number: "01",
    name: "Скандинавия",
    description: "Одноэтажный дом для спокойной загородной жизни",
    area: "118 м²",
    floors: "1 этаж",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85",
  },
  {
    number: "02",
    name: "Север",
    description: "Просторный дом с лаконичной архитектурой",
    area: "164 м²",
    floors: "2 этажа",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85",
  },
  {
    number: "03",
    name: "Лесной",
    description: "Современный дом с большими окнами и террасой",
    area: "142 м²",
    floors: "1 этаж",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85",
  },
];

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="ОСНОВА — на главную">
          <span className="brand-mark" aria-hidden="true">
            О
          </span>
          <span className="brand-copy">
            <strong>ОСНОВА</strong>
            <small>СТРОИМ ДЛЯ ЖИЗНИ</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Основная навигация">
          <a href="#projects">Проекты</a>
          <a href="#advantages">Преимущества</a>
          <a href="#calculator">Расчёт стоимости</a>
        </nav>

        <a className="header-contact" href="#contacts">
          Обсудить проект <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main>
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
              <a className="button button-primary" href="#calculator">
                Рассчитать стоимость <span aria-hidden="true">↗</span>
              </a>
              <a className="button button-secondary" href="#projects">
                Смотреть проекты <span aria-hidden="true">↓</span>
              </a>
            </div>

            <div className="hero-note">
              <span className="hero-note-line" />
              <p>Понятная смета. Прозрачные сроки. Продуманный результат.</p>
            </div>
          </div>

          <div className="hero-visual">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=90"
              alt="Современный загородный дом с панорамными окнами"
            />
            <div className="image-label">
              <span className="image-label-number">01 / 03</span>
              <span>Архитектура для жизни</span>
            </div>
            <div className="hero-stamp" aria-label="От проекта до строительства">
              <span>ОТ ПРОЕКТА</span>
              <span className="stamp-arrow">↓</span>
              <span>ДО ДОМA</span>
            </div>
          </div>

          <div className="hero-bottom">
            <span>01 — ПРОЕКТИРУЕМ</span>
            <span>02 — РАССЧИТЫВАЕМ</span>
            <span>03 — СТРОИМ</span>
            <a href="#projects" aria-label="Перейти к проектам">
              Листайте вниз ↓
            </a>
          </div>
        </section>

        <section className="projects-section section-wrap" id="projects">
          <div className="section-heading">
            <div>
              <p className="eyebrow">НАША ПОДБОРКА</p>
              <h2>
                Пространство
                <br />
                <span>для вашей жизни.</span>
              </h2>
            </div>
            <p className="section-intro">
              Выберите отправную точку. Каждый проект можно адаптировать под ваши задачи, участок и
              бюджет.
            </p>
          </div>

          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.number}>
                <a
                  className="project-image-link"
                  href="#calculator"
                  aria-label={`Рассчитать стоимость проекта ${project.name}`}
                >
                  <img
                    className="project-image"
                    src={project.image}
                    alt={`Современный загородный дом — проект ${project.name}`}
                    loading="lazy"
                  />
                  <span className="project-number">{project.number}</span>
                  <span className="project-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
                <div className="project-info">
                  <div>
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                  </div>
                  <div className="project-meta">
                    <span>{project.area}</span>
                    <span>{project.floors}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="projects-footer">
            <p>Это лишь несколько идей. Подберём решение под ваши задачи.</p>
            <a href="#calculator">
              Подобрать свой дом <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <section className="approach-section" id="advantages">
          <div className="section-wrap approach-inner">
            <div>
              <p className="eyebrow">НАШ ПОДХОД</p>
              <h2>
                Меньше
                <br />
                неопределённости.
                <br />
                <span>Больше ясности.</span>
              </h2>
            </div>
            <div className="approach-points">
              <article>
                <span>01</span>
                <div>
                  <h3>Понятная смета</h3>
                  <p>
                    Разбираемся, из чего складывается стоимость строительства и какие решения влияют
                    на бюджет.
                  </p>
                </div>
              </article>
              <article>
                <span>02</span>
                <div>
                  <h3>Продуманные этапы</h3>
                  <p>Показываем последовательность работ и ориентировочные сроки каждого этапа.</p>
                </div>
              </article>
              <article>
                <span>03</span>
                <div>
                  <h3>Выбор за вами</h3>
                  <p>
                    Сравнивайте материалы и комплектации, чтобы найти подходящий баланс стоимости и
                    характеристик.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="calculator-teaser section-wrap" id="calculator">
          <div>
            <p className="eyebrow">СЛЕДУЮЩИЙ ШАГ</p>
            <h2>
              Начните с
              <br />
              <span>расчёта.</span>
            </h2>
            <p className="calculator-description">
              В следующем этапе здесь появится интерактивный калькулятор: выберете материалы,
              комплектацию и параметры дома, а система рассчитает предварительную стоимость и сроки.
            </p>
          </div>
          <div className="calculator-panel">
            <span className="calculator-icon" aria-hidden="true">
              ↗
            </span>
            <p>ВАШ БУДУЩИЙ ДОМ</p>
            <strong>От идеи к цифрам</strong>
            <span className="calculator-status">КАЛЬКУЛЯТОР — СЛЕДУЮЩИЙ ЭТАП</span>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contacts">
        <a className="brand footer-brand" href="#home">
          <span className="brand-mark" aria-hidden="true">
            О
          </span>
          <span className="brand-copy">
            <strong>ОСНОВА</strong>
            <small>СТРОИМ ДЛЯ ЖИЗНИ</small>
          </span>
        </a>
        <p>Демонстрационный проект строительной компании.</p>
        <a href="#home">Вернуться наверх ↑</a>
      </footer>
    </div>
  );
}

export default App;
