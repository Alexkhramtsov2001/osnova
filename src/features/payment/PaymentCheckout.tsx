import { useState } from "react";
import ArrowIcon from "../../components/ArrowIcon";
import { vacancyRegions } from "../company/vacancies";
import type { CalculatorDraft } from "../estimate/calculatorDraft";
import { DEMO_REGIONS, PROJECT_TYPES } from "../estimate/catalog";
import { money, number } from "../estimate/formatters";
import type { EstimateResult, HouseParameters } from "../estimate/types";
import { downloadPaymentConfirmationPdf } from "./exportPaymentPdf";
import { buildStagePaymentSchedule, type PaymentMethod } from "./paymentPreview";
import "./PaymentCheckout.css";

const methods: { id: PaymentMethod; title: string; brief: string }[] = [
  { id: "cashFull", title: "Наличными полностью", brief: "Один условный платёж со скидкой 3%" },
  { id: "cashStages", title: "Наличными по этапам", brief: "Отдельный платёж за каждый этап" },
  { id: "credit", title: "Кредит", brief: "Решение и условия определяет банк" },
  { id: "mortgage", title: "Ипотека", brief: "Проверка банком и договор строительства" },
];

const bankLinks = {
  credit: [
    {
      label: "Пример кредитной программы Альфа-Банка",
      href: "https://alfabank.ru/get-money/credit/na-stroitelstvo-doma/",
    },
  ],
  mortgage: [
    {
      label: "Пример ипотечной программы Банка ДОМ.РФ",
      href: "https://domrfbank.ru/mortgage/programs/stroitelstvo-zhilogo-doma-escrow/",
    },
    {
      label: "Пример ипотечной программы ВТБ",
      href: "https://www.vtb.ru/personal/ipoteka/stroitelstvo-doma/",
    },
  ],
};

const officesByRegion: Record<HouseParameters["region"], readonly string[]> = {
  central: ["Москва и МО"],
  northwest: ["Санкт-Петербург и область"],
  south: ["Краснодар", "Сочи"],
  ural: ["Екатеринбург", "Челябинск"],
  siberia: ["Новосибирск", "Красноярск", "Иркутск"],
  farEast: ["Владивосток"],
};

type PaymentCheckoutProps = {
  method: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  estimate: EstimateResult;
  draft: CalculatorDraft;
  projectName: string;
  total: number;
  discount: number;
};

type Confirmation = {
  reference: string;
  createdAt: Date;
  officeId: string;
  method: PaymentMethod;
};

export default function PaymentCheckout({
  method,
  onMethodChange,
  estimate,
  draft,
  projectName,
  total,
  discount,
}: PaymentCheckoutProps) {
  const [officeId, setOfficeId] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "working" | "error">("idle");
  const schedule = buildStagePaymentSchedule(estimate);
  const isCash = method === "cashFull" || method === "cashStages";
  const office = vacancyRegions.find((item) => item.name === officeId);
  const suggestedOfficeNames = officesByRegion[draft.parameters.region];
  const suggestedOffices = vacancyRegions.filter((item) =>
    suggestedOfficeNames.includes(item.name),
  );
  const otherOffices = vacancyRegions.filter((item) => !suggestedOfficeNames.includes(item.name));
  const canConfirm = Boolean(method && acknowledged && (!isCash || office));

  const changeMethod = (next: PaymentMethod) => {
    onMethodChange(next);
    setAcknowledged(false);
    setConfirmation(null);
    setPdfStatus("idle");
  };

  const createPdf = async (nextConfirmation: Confirmation) => {
    const chosenOffice = vacancyRegions.find((item) => item.name === nextConfirmation.officeId);
    const methodDetails: Record<PaymentMethod, string[]> = {
      cashFull: [
        "Смоделирована полная оплата собственными средствами в выбранном демо-офисе.",
        "Условная скидка 3% применена к ориентиру строительства.",
      ],
      cashStages: [
        "Выбран демонстрационный график оплаты по этапам.",
        "Суммы этапов и доставка показаны отдельно; сроки, акты и порядок оплаты определит договор.",
      ],
      credit: [
        "Выбран кредитный маршрут. Заявка в банк с этого сайта не отправлялась.",
        "Одобрение, ставка, платёж и перевод средств банком не моделируются.",
      ],
      mortgage: [
        "Выбран ипотечный маршрут. Банк проверяет заёмщика, участок, подрядчика и документы.",
        "Одобрение, ставка, взнос и перечисление средств банком не моделируются.",
      ],
    };

    await downloadPaymentConfirmationPdf({
      reference: nextConfirmation.reference,
      createdAt: nextConfirmation.createdAt,
      projectName,
      projectType: PROJECT_TYPES[draft.parameters.projectType].label,
      area: draft.parameters.area,
      region: DEMO_REGIONS[draft.parameters.region].label,
      scope: draft.mode === "turnkey" ? "Под ключ" : "Отдельные этапы",
      method: nextConfirmation.method,
      office: chosenOffice ? { city: chosenOffice.name, address: chosenOffice.office } : null,
      stages: schedule.stages.map((stage) => ({ name: stage.name, amount: stage.amount })),
      deliveryCost: schedule.deliveryCost,
      estimateTotal: Math.round(estimate.total),
      discount: nextConfirmation.method === "cashFull" ? discount : 0,
      total: nextConfirmation.method === "cashFull" ? total : Math.round(estimate.total),
      scenarioDetails: methodDetails[nextConfirmation.method],
    });
  };

  const completeDemo = async () => {
    if (!method || !canConfirm || pdfStatus === "working") return;
    const nextConfirmation: Confirmation = {
      reference: `OSNOVA-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      createdAt: new Date(),
      method,
      officeId,
    };
    setPdfStatus("working");
    try {
      await createPdf(nextConfirmation);
      setConfirmation(nextConfirmation);
      setPdfStatus("idle");
    } catch {
      setPdfStatus("error");
    }
  };

  const downloadAgain = async () => {
    if (!confirmation || pdfStatus === "working") return;
    setPdfStatus("working");
    try {
      await createPdf(confirmation);
      setPdfStatus("idle");
    } catch {
      setPdfStatus("error");
    }
  };

  return (
    <section
      className="section-wrap payment-checkout"
      id="payment-checkout"
      aria-labelledby="payment-checkout-title"
    >
      <div className="payment-section-heading">
        <p className="eyebrow">03 / ДЕМО-ОФОРМЛЕНИЕ</p>
        <h2 id="payment-checkout-title">Выберите способ оплаты</h2>
        <p>
          Пройдите сценарий, похожий на оформление заказа. Он работает только в браузере: заявки и
          деньги никуда не отправляются.
        </p>
      </div>

      <ol className="payment-progress" aria-label="Шаги оформления">
        <li>
          <span>01</span> Способ
        </li>
        <li>
          <span>02</span> Условия
        </li>
        <li>
          <span>03</span> Подтверждение
        </li>
      </ol>

      <div className="payment-checkout-layout">
        <div className="payment-checkout-main">
          <fieldset className="payment-route-choice">
            <legend>Как вы хотите оплатить проект?</legend>
            <div className="payment-route-grid">
              {methods.map((item) => (
                <label className={method === item.id ? "is-selected" : ""} key={item.id}>
                  <input
                    type="radio"
                    name="payment-method"
                    value={item.id}
                    checked={method === item.id}
                    disabled={pdfStatus === "working"}
                    onChange={() => changeMethod(item.id)}
                  />
                  <span className="payment-route-title">{item.title}</span>
                  <span className="payment-route-brief">{item.brief}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="payment-route-details" aria-live="polite">
            {!method && (
              <p className="payment-route-placeholder">
                Выберите способ оплаты, чтобы увидеть последовательность действий.
              </p>
            )}
            {isCash && (
              <>
                <h3>{method === "cashFull" ? "Полная оплата в офисе" : "Оплата каждого этапа"}</h3>
                <p>
                  Выберите удобный офис из демонстрационного списка. Адреса придуманы для портфолио;
                  приезжать по ним не нужно. Список сгруппирован по региону расчёта; точное
                  расстояние и геолокация не используются.
                </p>
                <label className="payment-office-label" htmlFor="payment-office">
                  Удобный демо-офис
                </label>
                <select
                  id="payment-office"
                  value={officeId}
                  disabled={pdfStatus === "working"}
                  onChange={(event) => {
                    setOfficeId(event.target.value);
                    setConfirmation(null);
                  }}
                >
                  <option value="">Выберите город и офис</option>
                  <optgroup label="По региону расчёта">
                    {suggestedOffices.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.office}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Другие демо-офисы">
                    {otherOffices.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.office}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {office && (
                  <p className="payment-office-note">
                    Выбран: {office.office}. Это вымышленный адрес.
                  </p>
                )}
                {method === "cashFull" ? (
                  <ol className="payment-instructions">
                    <li>Сверить состав работ и предварительный ориентир.</li>
                    <li>Согласовать договор и окончательную стоимость в реальном проекте.</li>
                    <li>В демо смоделировать один платёж с условной скидкой 3%.</li>
                  </ol>
                ) : (
                  <>
                    <p className="payment-schedule-lead">
                      Условный график строится по выбранным этапам. Реальные сроки, акты и порядок
                      оплаты определяются договором.
                    </p>
                    <ol className="payment-stage-schedule">
                      {schedule.stages.map((stage, index) => (
                        <li key={stage.id}>
                          <span>
                            <small>{String(index + 1).padStart(2, "0")}</small>
                            {stage.name}
                          </span>
                          <strong>{money.format(stage.amount)}</strong>
                        </li>
                      ))}
                    </ol>
                    <div className="payment-schedule-delivery">
                      <span>Доставка, один раз</span>
                      <strong>{money.format(schedule.deliveryCost)}</strong>
                    </div>
                    <p className="payment-schedule-total">
                      Всего по графику: <strong>{money.format(schedule.total)}</strong>
                    </p>
                  </>
                )}
              </>
            )}
            {method === "credit" && (
              <>
                <h3>Кредитный маршрут</h3>
                <ol className="payment-instructions">
                  <li>Сверить стоимость и подготовить документы по будущему договору.</li>
                  <li>Самостоятельно обратиться в банк и дождаться его решения.</li>
                  <li>
                    Согласовать окончательные условия строительства и оплаты после решения банка.
                  </li>
                </ol>
                <p>Ставка, срок, ежемесячный платёж и одобрение здесь не рассчитываются.</p>
              </>
            )}
            {method === "mortgage" && (
              <>
                <h3>Ипотечный маршрут</h3>
                <ol className="payment-instructions">
                  <li>Подготовить сведения об участке, проекте, подрядчике и заёмщике.</li>
                  <li>Самостоятельно подать заявку и дождаться проверки банка.</li>
                  <li>
                    Согласовать договор и порядок расчётов; при эскроу действуют условия банка.
                  </li>
                </ol>
                <p>Ставка, взнос, одобрение и перечисление средств здесь не моделируются.</p>
              </>
            )}
            {(method === "credit" || method === "mortgage") && (
              <div className="payment-external-banks">
                <span>Примеры официальных программ, без партнёрства</span>
                {bankLinks[method].map((bank) => (
                  <a key={bank.href} href={bank.href} target="_blank" rel="noopener noreferrer">
                    {bank.label} <ArrowIcon />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="payment-confirm-panel" aria-label="Подтверждение сценария">
          <span className="payment-overline">ПРОВЕРЬТЕ ВЫБОР</span>
          <h3>{projectName}</h3>
          <p>
            {PROJECT_TYPES[draft.parameters.projectType].label} ·{" "}
            {number.format(draft.parameters.area)} м²
          </p>
          <dl>
            <div>
              <dt>Регион строительства</dt>
              <dd>{DEMO_REGIONS[draft.parameters.region].label}</dd>
            </div>
            <div>
              <dt>Способ</dt>
              <dd>{methods.find((item) => item.id === method)?.title ?? "Не выбран"}</dd>
            </div>
            {isCash && (
              <div>
                <dt>Демо-офис</dt>
                <dd>{office?.office ?? "Не выбран"}</dd>
              </div>
            )}
            {discount > 0 && (
              <div>
                <dt>Условная скидка</dt>
                <dd>−{money.format(discount)}</dd>
              </div>
            )}
          </dl>
          <div className="payment-confirm-total">
            <span>Ориентир проекта</span>
            <strong>{money.format(total)}</strong>
          </div>
          <p className="payment-confirm-note">
            Сумма предварительная. Проектирование, условия участка и итоговый договор уточняются
            отдельно. НДС в демо-модели не выделен.
          </p>
          <label className="payment-acknowledge">
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={pdfStatus === "working"}
              onChange={(event) => {
                setAcknowledged(event.target.checked);
                setConfirmation(null);
              }}
            />
            <span>
              Понимаю, что это демонстрация: платёж не проводится, банк не получает заявку, а PDF не
              является кассовым чеком.
            </span>
          </label>
          <button
            className="button button-primary payment-confirm-button"
            type="button"
            disabled={!canConfirm || pdfStatus === "working"}
            onClick={completeDemo}
          >
            {pdfStatus === "working" ? "Готовим PDF…" : "Завершить демо и скачать PDF"}{" "}
            <ArrowIcon />
          </button>
          {!method && <p className="payment-hint">Сначала выберите способ оплаты.</p>}
          {isCash && !office && (
            <p className="payment-hint">Для оплаты наличными выберите демо-офис.</p>
          )}
          {pdfStatus === "error" && (
            <p role="alert" className="payment-error">
              PDF не удалось сохранить. Попробуйте ещё раз.
            </p>
          )}
          {confirmation && (
            <div className="payment-success" role="status">
              <span>ДЕМО-СЦЕНАРИЙ ЗАВЕРШЁН</span>
              <h4>Спасибо за выбор ОСНОВЫ!</h4>
              <p>
                Поздравляем: выбор проекта и способа оплаты подтверждён в демонстрации. Деньги не
                списаны.
              </p>
              <small>Номер: {confirmation.reference}</small>
              <button type="button" onClick={downloadAgain} disabled={pdfStatus === "working"}>
                Скачать PDF снова <ArrowIcon />
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
