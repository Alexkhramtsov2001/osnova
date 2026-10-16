import { useState } from "react";
import { Link } from "react-router";
import ArrowIcon from "../components/ArrowIcon";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { calculateHouseEstimate } from "../features/estimate/calculations";
import { readCalculatorDraft } from "../features/estimate/calculatorDraft";
import { DEMO_REGIONS, PROJECT_TYPES } from "../features/estimate/catalog";
import { money, number } from "../features/estimate/formatters";
import {
  calculatePaymentPreview,
  DEMO_FULL_PAYMENT_DISCOUNT_RATE,
  type PaymentMethod,
} from "../features/payment/paymentPreview";
import "./PaymentPage.css";

const paymentMethods: { id: PaymentMethod; title: string; description: string }[] = [
  {
    id: "ownFunds",
    title: "Собственные средства",
    description:
      "При полной оплате одним платежом покажем условную скидку в предварительной сводке.",
  },
  {
    id: "mortgage",
    title: "Ипотека на строительство",
    description:
      "Банк проверяет заёмщика, участок, подрядчика и документы. Ставка и график зависят от его решения.",
  },
  {
    id: "loan",
    title: "Кредит",
    description:
      "Потребительский кредит может покрыть часть расходов. Платёж и переплату рассчитывает банк.",
  },
  {
    id: "maternityCapital",
    title: "Материнский капитал",
    description:
      "Средства можно направить на строительство при соблюдении правил СФР. Условия зависят от возраста ребёнка; перечисление только безналичное.",
  },
];

const bankExamples = [
  {
    name: "Банк ДОМ.РФ",
    product: "Ипотека на строительство дома с эскроу",
    href: "https://domrfbank.ru/mortgage/programs/stroitelstvo-zhilogo-doma-escrow/",
  },
  {
    name: "ВТБ",
    product: "Ипотека на строительство дома",
    href: "https://www.vtb.ru/personal/ipoteka/stroitelstvo-doma/",
  },
  {
    name: "Альфа-Банк",
    product: "Кредит на строительство дома",
    href: "https://alfabank.ru/get-money/credit/na-stroitelstvo-doma/",
  },
];

export default function PaymentPage() {
  const [method, setMethod] = useState<PaymentMethod>("ownFunds");
  const [draft] = useState(() => {
    try {
      return readCalculatorDraft(window.sessionStorage);
    } catch {
      return null;
    }
  });
  const estimate = draft
    ? calculateHouseEstimate(
        draft.parameters,
        draft.mode === "turnkey"
          ? { mode: "turnkey" }
          : { mode: "stages", stageIds: draft.stageIds },
      )
    : null;
  const hasEstimate = estimate?.stages.some((stage) => stage.included) ?? false;
  const preview = estimate && hasEstimate ? calculatePaymentPreview(estimate, method) : null;
  const projectLabel = draft
    ? (draft.projectName ?? PROJECT_TYPES[draft.parameters.projectType].label)
    : null;

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="payment-page">
        <section className="section-wrap payment-intro">
          <p className="eyebrow">ОПЛАТА / ДЕМОНСТРАЦИОННЫЙ СЦЕНАРИЙ</p>
          <h1>
            Дом начинается с плана. <span>Оплата — с ясных условий.</span>
          </h1>
          <p>
            Здесь можно сравнить варианты финансирования и посмотреть, как выбранный расчёт
            превращается в предварительную сводку. Это интерфейс портфолио: оплатить дом, оформить
            кредит или отправить заявку банку на сайте нельзя.
          </p>
        </section>

        <section className="section-wrap payment-methods" aria-labelledby="payment-methods-title">
          <div className="payment-section-heading">
            <p className="eyebrow">01 / ДО РАСЧЁТА</p>
            <h2 id="payment-methods-title">Какие есть варианты</h2>
            <p>
              Выберите ориентир для обсуждения. Фактические условия определяются договором и банком.
            </p>
          </div>
          <div className="payment-method-grid">
            {paymentMethods.map((item, index) => (
              <article className="payment-method-card" key={item.id}>
                <span className="payment-card-number">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.id === "maternityCapital" && (
                  <a
                    href="https://sfr.gov.ru/grazhdanam/semyam_s_detmi/materinskij_kapital/rasporyazhenije_sredstvami"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Правила СФР <ArrowIcon />
                  </a>
                )}
              </article>
            ))}
          </div>
          <div className="payment-bank-strip">
            <div>
              <h3>Примеры банковских программ</h3>
              <p>
                Реальные банки, но не партнёры демонстрационной ОСНОВЫ. Откройте официальные
                страницы, чтобы проверить действующие условия.
              </p>
            </div>
            <div className="payment-bank-list">
              {bankExamples.map((bank) => (
                <a key={bank.name} href={bank.href} target="_blank" rel="noopener noreferrer">
                  <strong>{bank.name}</strong>
                  <span>{bank.product}</span>
                  <ArrowIcon />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section-wrap payment-preview" aria-labelledby="payment-preview-title">
          <div className="payment-section-heading">
            <p className="eyebrow">02 / ПОСЛЕ РАСЧЁТА</p>
            <h2 id="payment-preview-title">Сводка перед оформлением</h2>
            <p>Сумма появится после выбора параметров дома в калькуляторе.</p>
          </div>
          {!preview || !draft || !estimate ? (
            <div className="payment-empty">
              <div>
                <h3>Пока нет выбранного объёма работ</h3>
                <p>
                  Рассчитайте типовой или индивидуальный дом. После этого здесь появятся состав
                  работ, стоимость и сценарий полной оплаты.
                </p>
              </div>
              <Link className="button button-primary" to="/calculator">
                Рассчитать стоимость <ArrowIcon />
              </Link>
            </div>
          ) : (
            <div className="payment-preview-layout">
              <div className="payment-configuration">
                <span className="payment-overline">ВЫБРАННЫЙ ПРОЕКТ</span>
                <h3>{projectLabel}</h3>
                <dl className="payment-project-facts">
                  <div>
                    <dt>Формат</dt>
                    <dd>{PROJECT_TYPES[draft.parameters.projectType].label}</dd>
                  </div>
                  <div>
                    <dt>Площадь</dt>
                    <dd>{number.format(draft.parameters.area)} м²</dd>
                  </div>
                  <div>
                    <dt>Регион</dt>
                    <dd>{DEMO_REGIONS[draft.parameters.region].label}</dd>
                  </div>
                  <div>
                    <dt>Состав</dt>
                    <dd>{draft.mode === "turnkey" ? "Под ключ" : "Отдельные этапы"}</dd>
                  </div>
                </dl>
                <h4>Что входит в строительный ориентир</h4>
                <ul className="payment-stage-list">
                  {estimate.stages
                    .filter((stage) => stage.included)
                    .map((stage) => (
                      <li key={stage.id}>
                        <span>{stage.name}</span>
                        <strong>{money.format(stage.total)}</strong>
                      </li>
                    ))}
                </ul>
                <p className="payment-exclusion">
                  Проектная и рабочая документация, проверка конструкций и условия участка в эту
                  сумму не включены. Для индивидуального проекта их стоимость определяется отдельно
                  после задания.
                </p>
                <Link className="payment-edit-link" to="/calculator">
                  Изменить расчёт <ArrowIcon />
                </Link>
              </div>

              <div className="payment-totals">
                <span className="payment-overline">ПРЕДВАРИТЕЛЬНЫЙ РАСЧЁТ</span>
                <p className="payment-range">
                  Диапазон модели: {money.format(estimate.minTotal)} —{" "}
                  {money.format(estimate.maxTotal)}
                </p>
                <fieldset className="payment-choice">
                  <legend>Вариант оплаты для просмотра</legend>
                  {paymentMethods.map((item) => (
                    <label className={method === item.id ? "is-selected" : ""} key={item.id}>
                      <input
                        type="radio"
                        name="payment-method"
                        value={item.id}
                        checked={method === item.id}
                        onChange={() => setMethod(item.id)}
                      />
                      <span>{item.title}</span>
                    </label>
                  ))}
                </fieldset>
                <dl className="payment-cost-lines">
                  <div>
                    <dt>Выбранные строительные этапы</dt>
                    <dd>{money.format(preview.stagesTotal)}</dd>
                  </div>
                  <div>
                    <dt>Доставка</dt>
                    <dd>{money.format(preview.deliveryCost)}</dd>
                  </div>
                  <div>
                    <dt>Ориентир калькулятора</dt>
                    <dd>{money.format(preview.constructionTotal)}</dd>
                  </div>
                  <div>
                    <dt>
                      Условная скидка за оплату полностью своими средствами (
                      {DEMO_FULL_PAYMENT_DISCOUNT_RATE * 100}%)
                    </dt>
                    <dd>
                      {preview.discount ? `−${money.format(preview.discount)}` : "Не применяется"}
                    </dd>
                  </div>
                  <div className="payment-vat-line">
                    <dt>НДС</dt>
                    <dd>Не выделен в демо-модели</dd>
                  </div>
                </dl>
                <p className="payment-tax-note">
                  НДС определяется по условиям договора и налоговому режиму подрядчика. Добавлять
                  ставку к этой условной смете автоматически было бы неверно. Стоимость
                  проектирования также требует отдельного расчёта. Подробнее:{" "}
                  <a
                    href="https://www.nalog.gov.ru/rn77/taxation/taxes/nds/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ставки ФНС
                  </a>{" "}
                  и{" "}
                  <a
                    href="https://www.nalog.gov.ru/rn39/news/activities_fts/16195090/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    разъяснение по эскроу
                  </a>
                  .
                </p>
                <div className="payment-final">
                  <span>Ориентир по выбранному сценарию</span>
                  <strong>{money.format(preview.afterDiscount)}</strong>
                </div>
                {method === "maternityCapital" && (
                  <p className="payment-method-note">
                    Сумма сертификата неизвестна, поэтому она не вычтена из ориентира. СФР
                    перечисляет средства безналично после проверки права и документов.
                  </p>
                )}
                {(method === "mortgage" || method === "loan") && (
                  <p className="payment-method-note">
                    Первоначальный взнос, ставку, ежемесячный платёж и одобрение определяет банк; в
                    этом демонстрационном расчёте они не моделируются.
                  </p>
                )}
                <p className="payment-disclaimer">
                  Это не счёт, договор, предложение банка или возможность оплатить заказ. Скидка
                  показана только как пример интерфейса.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
