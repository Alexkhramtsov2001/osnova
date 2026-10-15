import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { history, statistics, team, principles } from "../features/company/content";
export default function AboutPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="section-wrap company-hero">
          <div>
            <p className="eyebrow">О КОМПАНИИ / ДЕМОНСТРАЦИОННАЯ ИСТОРИЯ</p>
            <h1>
              Строим историю <span>вокруг человека.</span>
            </h1>
            <p className="section-lead">
              ОСНОВА объединяет архитектуру, понятные этапы и внимание к повседневной жизни. Это
              образ вымышленной компании для портфолио.
            </p>
          </div>
          <img
            src={`${import.meta.env.BASE_URL}images/projects/lesnoy.jpg`}
            alt="Архитектурная концепция загородного дома"
          />
        </section>
        <section className="section-wrap content-section">
          <h2>
            От идеи <span>к платформе.</span>
          </h2>
          <ol className="company-timeline">
            {history.map((item) => (
              <li key={item.year}>
                <strong>{item.year}</strong>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="approach-section">
          <div className="section-wrap content-section">
            <p className="demo-label">Вымышленные показатели для иллюстрации интерфейса</p>
            <div className="stat-grid">
              {statistics.map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <p>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="section-wrap content-section">
          <h2>
            За каждым решением — <span>команда.</span>
          </h2>
          <p className="section-lead">
            Все персонажи вымышлены. Нейтральные иллюстрации не изображают реальных сотрудников.
          </p>
          <div className="team-grid">
            {team.map((person, i) => (
              <article className="team-card" key={person.name}>
                <div
                  className="team-portrait"
                  role="img"
                  aria-label={`Нейтральная иллюстрация персонажа ${person.name}`}
                >
                  <svg viewBox="0 0 240 240" aria-hidden="true">
                    <rect width="240" height="240" fill={i % 2 ? "#e8e3d9" : "#eeece5"} />
                    <path d="M0 185 240 60V240H0Z" fill="#d8d4c9" />
                    <circle cx="120" cy="88" r="32" fill="#a39d8e" />
                    <path d="M48 240v-32a72 72 0 0 1 144 0v32" fill="#77796c" />
                    <path d="M120 169v71" stroke="#eeece5" strokeWidth="2" />
                  </svg>
                </div>
                <h3>{person.name}</h3>
                <p className="team-role">{person.role}</p>
                <small>Опыт: {person.experience}</small>
                <p>{person.bio}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section-wrap content-section">
          <h2>
            Принципы <span>работы.</span>
          </h2>
          <div className="principle-grid">
            {principles.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
