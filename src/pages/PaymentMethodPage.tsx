import { Link, useParams } from "react-router";
import ArrowIcon from "../components/ArrowIcon";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { paymentMethodGuides } from "../features/payment/paymentMethods";
import "./PaymentMethodPage.css";

export default function PaymentMethodPage() {
  const { methodSlug } = useParams();
  const guide = paymentMethodGuides.find((item) => item.slug === methodSlug);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="payment-guide">
        {!guide ? (
          <section className="section-wrap payment-guide-intro">
            <h1>Способ оплаты не найден</h1>
            <Link className="button button-primary" to="/payment">
              Все способы оплаты <ArrowIcon />
            </Link>
          </section>
        ) : (
          <>
            <section className="section-wrap payment-guide-intro">
              <Link className="payment-guide-back" to="/payment">
                <ArrowIcon direction="left" /> Все способы оплаты
              </Link>
              <p className="eyebrow">ОПЛАТА / УСЛОВИЯ И ПОРЯДОК ДЕЙСТВИЙ</p>
              <h1>{guide.title}</h1>
              <p className="payment-guide-lead">{guide.description}</p>
              <div className="payment-guide-summary">
                <div>
                  <span>Кому подходит</span>
                  <p>{guide.audience}</p>
                </div>
                <div>
                  <span>Когда и в какие сроки</span>
                  <p>{guide.timing}</p>
                </div>
                <div>
                  <span>Что учесть в бюджете</span>
                  <p>{guide.cost}</p>
                </div>
              </div>
            </section>

            <section
              className="section-wrap payment-guide-details"
              aria-labelledby="payment-guide-conditions"
            >
              <div className="payment-guide-heading">
                <p className="eyebrow">01 / ПЕРЕД ОФОРМЛЕНИЕМ</p>
                <h2 id="payment-guide-conditions">Условия и документы</h2>
              </div>
              <div className="payment-guide-detail-grid">
                <article className="payment-guide-card">
                  <h3>Что согласовать заранее</h3>
                  <ul>
                    {guide.conditions.map((condition) => (
                      <li key={condition}>{condition}</li>
                    ))}
                  </ul>
                </article>
                <article className="payment-guide-card payment-guide-documents">
                  <h3>Что подготовить</h3>
                  <ul>
                    {guide.documents.map((document) => (
                      <li key={document}>{document}</li>
                    ))}
                  </ul>
                  <p>
                    Это ориентир для подготовки. Окончательный список определяется выбранным
                    договором и, при финансировании, требованиями банка.
                  </p>
                </article>
              </div>
            </section>

            <section
              className="section-wrap payment-guide-process"
              aria-labelledby="payment-guide-steps"
            >
              <div className="payment-guide-heading">
                <p className="eyebrow">02 / ОТ ВЫБОРА К ДОГОВОРУ</p>
                <h2 id="payment-guide-steps">Как проходит оформление</h2>
              </div>
              <ol className="payment-guide-steps">
                {guide.steps.map((step, index) => (
                  <li key={step.title}>
                    <span className="payment-guide-step-number">0{index + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {guide.sources && (
                <div className="payment-guide-sources">
                  <h3>Проверить условия у банка</h3>
                  <p>
                    Официальные программы для знакомства. Банки не являются партнёрами
                    демонстрационной ОСНОВЫ.
                  </p>
                  <div>
                    {guide.sources.map((source) => (
                      <a
                        key={source.href}
                        href={source.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.title} <ArrowIcon />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section
              className="section-wrap payment-guide-next"
              aria-labelledby="payment-guide-next-title"
            >
              <p className="eyebrow">03 / ПОПРОБУЙТЕ СЦЕНАРИЙ</p>
              <h2 id="payment-guide-next-title">
                От понятных условий <span>к вашему расчёту.</span>
              </h2>
              <p>{guide.demo}</p>
              <div className="payment-guide-actions">
                <Link
                  className="button button-primary"
                  to={`/payment?method=${guide.id}#payment-checkout`}
                >
                  Выбрать этот способ <ArrowIcon />
                </Link>
                <Link className="button button-secondary" to="/calculator">
                  Рассчитать стоимость <ArrowIcon />
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
