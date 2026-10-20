import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ArrowIcon from "../components/ArrowIcon";
import { Link } from "react-router";
import { history, team, principles } from "../features/company/content";
import { vacancyRegions } from "../features/company/vacancies";
export default function AboutPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="section-wrap company-hero">
          <div>
            <h1>
              Строим историю <span>вокруг человека.</span>
            </h1>
            <p className="interior-intro-copy">
              ОСНОВА объединяет архитектуру, понятные этапы и внимание к повседневной жизни. Это
              образ вымышленной компании для портфолио: здесь можно пройти путь от выбора концепции
              до демонстрационной сметы.
            </p>
          </div>
          <img
            src={`${import.meta.env.BASE_URL}images/projects/lesnoy.jpg`}
            alt="Архитектурная концепция загородного дома"
          />
        </section>
        <section className="section-wrap content-section about-timeline-section">
          <h2>
            От идеи <span>к платформе.</span>
          </h2>
          <ol className="company-timeline">
            {history.map((item) => (
              <li key={item.year}>
                <span className="timeline-year">{item.year}</span>
                <h3>{item.title}</h3>
                <dl>
                  <dt>Цель</dt>
                  <dd>{item.goal}</dd>
                  <dt>Что сделали</dt>
                  <dd>{item.work}</dd>
                  <dt>Результат</dt>
                  <dd>{item.result}</dd>
                </dl>
              </li>
            ))}
          </ol>
        </section>
        <section className="section-wrap content-section">
          <h2>
            За каждым решением — <span>команда.</span>
          </h2>
          <p className="section-lead">
            Персонажи и офисы в карточках вымышлены. Портреты сгенерированы для этого
            демонстрационного проекта и не изображают реальных сотрудников.
          </p>
          <div className="team-grid">
            {team.map((person) => (
              <article className="team-card" key={person.name}>
                <img
                  className="team-portrait"
                  src={`${import.meta.env.BASE_URL}images/team/${person.photo}`}
                  alt={`Сгенерированный портрет для иллюстрации роли «${person.role}»`}
                  loading="lazy"
                />
                <div className="team-card-body">
                  <header className="team-card-heading">
                    <h3>{person.name}</h3>
                    <p className="team-role">{person.role}</p>
                  </header>
                  <dl className="team-meta">
                    <div>
                      <dt>Демо-офис</dt>
                      <dd>{person.office}</dd>
                    </div>
                    <div>
                      <dt>Опыт</dt>
                      <dd>{person.experience}</dd>
                    </div>
                  </dl>
                  <address className="team-office-address">
                    {vacancyRegions.find((region) => region.name === person.office)?.office}
                  </address>
                  <p className="team-bio">{person.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section
          className="section-wrap content-section demo-offices"
          aria-labelledby="demo-offices-title"
        >
          <h2 id="demo-offices-title">
            Офисы в <span>демо-истории.</span>
          </h2>
          <p className="section-lead">
            Одиннадцать условных офисов связывают команду, вакансии и выбор места встречи при
            демо-оформлении. Адреса вымышлены и не предназначены для посещения или корреспонденции.
          </p>
          <ul className="demo-office-grid">
            {vacancyRegions.map((region) => (
              <li key={region.name}>
                <h3>{region.name}</h3>
                <address>{region.office}</address>
              </li>
            ))}
          </ul>
        </section>
        <section className="section-wrap content-section company-principles">
          <h2>
            Принципы <span>работы.</span>
          </h2>
          <div className="principle-grid">
            {principles.map((item, index) => (
              <article key={item.title}>
                <small className="principle-number">{String(index + 1).padStart(2, "0")}</small>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section-wrap journey-next-step" aria-labelledby="about-next-title">
          <div>
            <h2 id="about-next-title">
              Проверьте подход <span>на своём сценарии.</span>
            </h2>
            <p>
              Выберите планировку из каталога или задайте параметры дома сами. Расчёт покажет состав
              этапов и ориентир стоимости.
            </p>
          </div>
          <div className="journey-next-actions">
            <Link className="button button-secondary" to="/projects">
              Смотреть проекты <ArrowIcon />
            </Link>
            <Link className="button button-primary" to="/calculator">
              Перейти к расчёту <ArrowIcon />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
