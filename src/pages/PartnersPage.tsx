import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { partners } from "../features/company/partners";
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
            Материалы для стен, кровля, остекление, инженерные системы и архитектура — у каждого
            направления своя команда. Шесть организаций и их названия вымышлены для портфолио.
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
                <h3 className="partner-logo">{partner.name}</h3>
                <p className="demo-label partner-category">{partner.category}</p>
                <p className="partner-description">{partner.description}</p>
                <p className="partner-scope">{partner.scope}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
