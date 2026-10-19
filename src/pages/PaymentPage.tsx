import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import ArrowIcon from "../components/ArrowIcon";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import DemoAccessGate from "../features/account/DemoAccessGate";
import { readDemoSession } from "../features/account/demoSession";
import { calculateHouseEstimate } from "../features/estimate/calculations";
import {
  hasUnsavedCalculatorDraft,
  readCalculatorDraft,
} from "../features/estimate/calculatorDraft";
import { buildDisplayedEstimate } from "../features/estimate/displayAmounts";
import { checkoutSignature } from "../features/payment/checkoutDraft";
import { DEMO_REGIONS, PROJECT_TYPES } from "../features/estimate/catalog";
import { money, number } from "../features/estimate/formatters";
import PaymentCheckout from "../features/payment/PaymentCheckout";
import { bankExamples, paymentMethodGuides } from "../features/payment/paymentMethods";
import {
  calculatePaymentPreview,
  DEMO_FULL_PAYMENT_DISCOUNT_RATE,
  type PaymentMethod,
} from "../features/payment/paymentPreview";
import "./PaymentPage.css";

const paymentMethodStorageKey = "osnova-payment-method";
const validMethod = (value: string | null) =>
  paymentMethodGuides.find((guide) => guide.id === value)?.id ?? null;

function readMethod(search: string): PaymentMethod | null {
  const requested = validMethod(new URLSearchParams(search).get("method"));
  if (requested) return requested;
  try {
    return validMethod(window.sessionStorage.getItem(paymentMethodStorageKey));
  } catch {
    return null;
  }
}

export default function PaymentPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [selection, setSelection] = useState(() => ({ search, method: readMethod(search) }));
  // Update the radio immediately; reconcile a separately navigated URL before rendering children.
  if (selection.search !== search) setSelection({ search, method: readMethod(search) });
  const method = selection.search === search ? selection.method : readMethod(search);
  const changeMethod = (next: PaymentMethod) => {
    setSelection({ search, method: next });
  };
  const unsavedDraft = hasUnsavedCalculatorDraft();
  const [draft] = useState(() => {
    if (unsavedDraft) return null;
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
  const preview =
    estimate && hasEstimate ? calculatePaymentPreview(estimate, method ?? "cashStages") : null;
  const display = estimate ? buildDisplayedEstimate(estimate) : null;
  const projectLabel = draft
    ? (draft.projectName ?? PROJECT_TYPES[draft.parameters.projectType].label)
    : null;
  const authenticated = readDemoSession(window.sessionStorage);
  const checkoutReturnPath = `/payment${search}#payment-checkout`;

  useEffect(() => {
    if (!method) return;
    try {
      window.sessionStorage.setItem(paymentMethodStorageKey, method);
    } catch {
      // The payment route remains usable when storage is unavailable.
    }
    if (validMethod(new URLSearchParams(search).get("method")) !== method) {
      const params = new URLSearchParams(search);
      params.set("method", method);
      navigate(
        { pathname: "/payment", search: `?${params}`, hash: window.location.hash },
        { replace: true },
      );
    }
  }, [method, search, navigate]);

  useEffect(() => {
    if (window.location.hash !== "#payment-checkout" || !hasEstimate) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("payment-checkout")?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hasEstimate]);

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
            Выберите способ оплаты, изучите порядок действий и получите демонстрационное
            подтверждение с PDF. Это интерфейс портфолио: деньги не списываются, а заявки в банк не
            отправляются.
          </p>
        </section>

        <section
          className="section-wrap payment-methods payment-reference"
          aria-labelledby="payment-methods-title"
        >
          <div className="payment-section-heading">
            <p className="eyebrow">01 / ДО РАСЧЁТА</p>
            <h2 id="payment-methods-title">Какие есть варианты</h2>
            <p>
              Можно выбрать полную оплату, платежи по этапам, кредит или ипотеку. Фактические
              условия определяются договором и банком.
            </p>
          </div>
          <div className="payment-method-grid">
            {paymentMethodGuides.map((item, index) => (
              <Link
                className="payment-method-card"
                key={item.id}
                to={`/payment/methods/${item.slug}`}
              >
                <span className="payment-card-number">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="payment-method-more">
                  Условия и этапы <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
          <p className="payment-maternity-note">
            Материнский капитал может участвовать в реальном финансировании при соблюдении правил
            СФР. В этом демо он не вычитается из сметы и не оформляется.{" "}
            <a
              href="https://sfr.gov.ru/grazhdanam/semyam_s_detmi/materinskij_kapital/rasporyazhenije_sredstvami"
              target="_blank"
              rel="noopener noreferrer"
            >
              Правила СФР <ArrowIcon />
            </a>
          </p>
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
                  <img
                    src={`${import.meta.env.BASE_URL}images/banks/${bank.logo}.svg`}
                    width="44"
                    height="44"
                    alt=""
                    loading="lazy"
                  />
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
                {unsavedDraft && (
                  <p role="alert">
                    Актуальная смета не сохранена. Оформление старого расчёта недоступно; вернитесь
                    в калькулятор и повторите сохранение.
                  </p>
                )}
                <h3>Пока нет выбранного объёма работ</h3>
                <p>
                  Рассчитайте типовой или индивидуальный дом. После этого здесь появятся состав
                  работ, стоимость и доступные сценарии оплаты.
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
                <details className="payment-stage-details">
                  <summary>Состав работ ({display!.stages.length} этапов)</summary>
                  <h4>Что входит в строительный ориентир</h4>
                  <ul className="payment-stage-list">
                    {display!.stages.map((stage) => (
                      <li key={stage.id}>
                        <span>{stage.name}</span>
                        <strong>{money.format(stage.amount)}</strong>
                      </li>
                    ))}
                  </ul>
                </details>
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
                    <dt>
                      Условная скидка за полную оплату наличными (
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
                <details className="payment-tax-details">
                  <summary>НДС и допущения расчёта</summary>
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
                </details>
                <div className="payment-final">
                  <span>
                    {method ? "Ориентир по выбранному сценарию" : "Ориентир до выбора способа"}
                  </span>
                  <strong>{money.format(preview.afterDiscount)}</strong>
                </div>
                {method && (
                  <Link
                    className="payment-method-terms"
                    to={`/payment/methods/${paymentMethodGuides.find((item) => item.id === method)!.slug}`}
                  >
                    Условия выбранного способа <ArrowIcon />
                  </Link>
                )}
                {(method === "mortgage" || method === "credit") && (
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
        {preview &&
          draft &&
          estimate &&
          projectLabel &&
          (authenticated ? (
            <PaymentCheckout
              key={checkoutSignature(draft, estimate)}
              method={method}
              onMethodChange={changeMethod}
              estimate={estimate}
              draft={draft}
              projectName={projectLabel}
              total={preview.afterDiscount}
              discount={preview.discount}
            />
          ) : (
            <DemoAccessGate
              id="payment-checkout"
              eyebrow="03 / ДЕМО-ОФОРМЛЕНИЕ"
              title="Войдите, чтобы оформить выбор"
              description="Ваш расчёт сохранён в этой вкладке. После учебной регистрации или повторного входа можно выбрать способ оплаты и скачать демонстрационный PDF."
              next={checkoutReturnPath}
            />
          ))}
      </main>
      <SiteFooter />
    </div>
  );
}
