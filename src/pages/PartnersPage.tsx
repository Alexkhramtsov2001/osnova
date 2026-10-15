import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { partners, partnerCases } from "../features/company/partners";
export default function PartnersPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="section-wrap page-intro partners-intro">
          <p className="eyebrow">ПАРТНЁРЫ / ДЕМОНСТРАЦИОННАЯ ЭКОСИСТЕМА</p>
          <h1>
            Хорошие решения <span>рождаются вместе.</span>
          </h1>
          <p className="interior-intro-copy">
            Шесть вымышленных организаций иллюстрируют сотрудничество архитекторов, производителей и
            инженерных команд. Ниже показаны их специализации, затем — примеры совместных задач.
            Названия, логотипы и истории созданы для портфолио.
          </p>
        </section>
        <section className="section-wrap content-section partners-directory">
          <h2>
            От материала <span>до архитектуры.</span>
          </h2>
          <div className="partner-grid">
            {partners.map((partner, index) => (
              <article className="partner-card" key={partner.name}>
                <div className="partner-card-top" aria-hidden="true">
                  <span>
                    {String(index + 1).padStart(2, "0")} /{" "}
                    {String(partners.length).padStart(2, "0")}
                  </span>
                  <span className="partner-card-line" />
                </div>
                <div
                  className="partner-logo"
                  aria-label={`Демонстрационный логотип ${partner.name}`}
                >
                  {partner.name}
                </div>
                <p className="demo-label partner-category">{partner.category}</p>
                <h3>{partner.description}</h3>
                <p>{partner.history}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="approach-section">
          <div className="section-wrap content-section">
            <p className="eyebrow">ВЫМЫШЛЕННЫЕ КЕЙСЫ</p>
            <h2>
              Общая задача.
              <br />
              <span>Согласованное решение.</span>
            </h2>
            <div className="partner-cases">
              {partnerCases.map((item, i) => (
                <article key={item.title}>
                  <small>
                    0{i + 1} / {item.partner}
                  </small>
                  <h3>{item.title}</h3>
                  <dl>
                    <dt>Задача</dt>
                    <dd>{item.task}</dd>
                    <dt>Совместное решение</dt>
                    <dd>{item.solution}</dd>
                    <dt>Демонстрационный результат</dt>
                    <dd>{item.result}</dd>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
