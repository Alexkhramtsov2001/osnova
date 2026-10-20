import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ArrowIcon from "../components/ArrowIcon";
import { Link } from "react-router";
import { partners } from "../features/company/partners";
export default function PartnersPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="section-wrap page-intro partners-intro">
          <h1>
            Хорошие решения <span>рождаются вместе.</span>
          </h1>
          <p className="interior-intro-copy">
            Материалы для стен, кровля, остекление, инженерные системы и архитектура — у каждого
            направления своя команда. Шесть организаций и их названия вымышлены для портфолио.
          </p>
        </section>
        <section className="section-wrap content-section partners-directory">
          <h2>
            От материала <span>до архитектуры.</span>
          </h2>
          <div className="partner-grid">
            {partners.map((partner) => (
              <article className="partner-card" key={partner.name}>
                <h3 className="partner-logo">{partner.name}</h3>
                <p className="demo-label partner-category">{partner.category}</p>
                <p className="partner-description">{partner.description}</p>
                <p className="partner-scope">{partner.scope}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section-wrap journey-next-step" aria-labelledby="partners-next-title">
          <div>
            <h2 id="partners-next-title">
              Сравните решения <span>в расчёте.</span>
            </h2>
            <p>
              В калькуляторе можно изменить материал стен, кровлю и комплектацию и увидеть, как это
              влияет на демонстрационную смету. Названия партнёров выше вымышлены и не означают
              поставку материалов.
            </p>
          </div>
          <div className="journey-next-actions">
            <Link className="button button-secondary" to="/projects">
              Выбрать дом <ArrowIcon />
            </Link>
            <Link className="button button-primary" to="/calculator">
              Сравнить стоимость <ArrowIcon />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
