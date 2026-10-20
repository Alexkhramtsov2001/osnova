import { useEffect, useRef, useState } from "react";
import ArrowIcon from "../../components/ArrowIcon";
import { vacancyRegions } from "../company/vacancies";
import type { CalculatorDraft } from "../estimate/calculatorDraft";
import { DEMO_REGIONS, PROJECT_TYPES, WALL_MATERIALS } from "../estimate/catalog";
import { money, number } from "../estimate/formatters";
import type { EstimateResult } from "../estimate/types";
import PaymentOfficeBooking from "./PaymentOfficeBooking";
import {
  APPOINTMENT_DURATION_MINUTES,
  formatAppointmentDate,
  isValidAppointment,
  officeTimeZone,
} from "./paymentAppointment";
import { buildStagePaymentSchedule, type PaymentMethod } from "./paymentPreview";
import "./PaymentCheckout.css";
import {
  checkoutSignature,
  readCheckoutDraft,
  writeCheckoutDraft,
  type PaymentConfirmation,
} from "./checkoutDraft";

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

type PaymentCheckoutProps = {
  method: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  estimate: EstimateResult;
  draft: CalculatorDraft;
  projectName: string;
  total: number;
  discount: number;
};

type Confirmation = PaymentConfirmation;

export default function PaymentCheckout({
  method,
  onMethodChange,
  estimate,
  draft,
  projectName,
  total,
  discount,
}: PaymentCheckoutProps) {
  const signature = checkoutSignature(draft, estimate);
  const [restored] = useState(() => {
    try {
      return readCheckoutDraft(window.sessionStorage, signature, method);
    } catch {
      return null;
    }
  });
  const [officeId, setOfficeId] = useState(restored?.officeId ?? "");
  const [appointmentDate, setAppointmentDate] = useState(restored?.date ?? "");
  const [appointmentTime, setAppointmentTime] = useState(restored?.time ?? "");
  const [acknowledged, setAcknowledged] = useState(restored?.acknowledged ?? false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(
    restored?.confirmation ?? null,
  );
  const pendingConfirmation = useRef<Confirmation | null>(null);
  const busy = useRef(false);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "working" | "error">("idle");
  const schedule = buildStagePaymentSchedule(estimate);
  const isCash = method === "cashFull" || method === "cashStages";
  const office = vacancyRegions.find((item) => item.name === officeId);
  const appointmentValid = isValidAppointment(officeId, appointmentDate, appointmentTime);
  const canConfirm = Boolean(method && acknowledged && (!isCash || (office && appointmentValid)));
  const progressStep = confirmation ? 4 : !method ? 1 : canConfirm ? 3 : 2;

  useEffect(() => {
    try {
      writeCheckoutDraft(window.sessionStorage, {
        signature,
        method,
        officeId,
        date: appointmentDate,
        time: appointmentTime,
        acknowledged,
        confirmation,
      });
    } catch {
      // Restricted storage leaves the current in-memory demo usable.
    }
  }, [signature, method, officeId, appointmentDate, appointmentTime, acknowledged, confirmation]);

  const clearConfirmation = () => {
    setAcknowledged(false);
    setConfirmation(null);
    pendingConfirmation.current = null;
    setPdfStatus("idle");
  };

  const changeMethod = (next: PaymentMethod) => {
    onMethodChange(next);
    setOfficeId("");
    setAppointmentDate("");
    setAppointmentTime("");
    clearConfirmation();
  };

  const createPdf = async (nextConfirmation: Confirmation) => {
    const chosenOffice = vacancyRegions.find((item) => item.name === nextConfirmation.officeId);
    const methodDetails: Record<PaymentMethod, string[]> = {
      cashFull: [
        "Выбрана полная оплата наличными. Сформирована демо-запись на согласование договора и порядка оплаты.",
        "Условная скидка 3% отражена в расчёте. Передача денег в этом сценарии не выполняется.",
      ],
      cashStages: [
        "Выбрана оплата наличными по этапам. Сформирована демо-запись на согласование договора и графика.",
        "Каждый этап и доставка показаны отдельно. Последующие встречи согласуются по готовности этапов; оплаченных этапов пока нет.",
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

    const { downloadPaymentConfirmationPdf } = await import("./exportPaymentPdf");
    await downloadPaymentConfirmationPdf({
      reference: nextConfirmation.reference,
      createdAt: new Date(nextConfirmation.createdAt),
      projectName,
      projectType: PROJECT_TYPES[draft.parameters.projectType].label,
      area: draft.parameters.area,
      region: DEMO_REGIONS[draft.parameters.region].label,
      scope: draft.mode === "turnkey" ? "Под ключ" : "Отдельные этапы",
      method: nextConfirmation.method,
      office:
        nextConfirmation.appointment && chosenOffice
          ? { city: chosenOffice.name, address: chosenOffice.office }
          : null,
      appointment: nextConfirmation.appointment,
      specifications: [
        { label: "Этажность", value: String(draft.parameters.floors) },
        {
          label: "Спальни / санузлы",
          value: `${draft.parameters.bedrooms} / ${draft.parameters.bathrooms}`,
        },
        { label: "Материал стен", value: WALL_MATERIALS[draft.parameters.wallMaterial].label },
        {
          label: "Комплектация",
          value: draft.parameters.finish === "comfort" ? "Комфорт" : "Стандарт",
        },
      ],
      dataVersion: estimate.dataVersion,
      minTotal: estimate.minTotal,
      maxTotal: estimate.maxTotal,
      stages: schedule.stages.map((stage) => ({ name: stage.name, amount: stage.amount })),
      deliveryCost: schedule.deliveryCost,
      estimateTotal: Math.round(estimate.total),
      discount: nextConfirmation.method === "cashFull" ? discount : 0,
      total: nextConfirmation.method === "cashFull" ? total : Math.round(estimate.total),
      scenarioDetails: methodDetails[nextConfirmation.method],
    });
  };

  const completeDemo = async () => {
    if (!method || (!confirmation && !canConfirm) || busy.current) return;
    busy.current = true;
    const zone = officeTimeZone(officeId);
    const nextConfirmation: Confirmation = confirmation ??
      pendingConfirmation.current ?? {
        reference: `OSNOVA-DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        method,
        officeId,
        appointment: isCash
          ? {
              date: appointmentDate,
              time: appointmentTime,
              timeZone: zone.timeZone,
              zoneLabel: zone.label,
              durationMinutes: APPOINTMENT_DURATION_MINUTES,
              purpose:
                method === "cashFull"
                  ? "Согласование договора и полной оплаты"
                  : "Согласование договора и графика платежей по этапам",
            }
          : null,
      };
    pendingConfirmation.current = nextConfirmation;
    setPdfStatus("working");
    try {
      await createPdf(nextConfirmation);
      setConfirmation(nextConfirmation);
      setPdfStatus("idle");
    } catch {
      setPdfStatus("error");
    } finally {
      busy.current = false;
    }
  };

  const downloadAgain = async () => {
    if (confirmation) await completeDemo();
  };

  return (
    <section
      className="section-wrap payment-checkout"
      id="payment-checkout"
      aria-labelledby="payment-checkout-title"
    >
      <div className="payment-section-heading">
        <h2 id="payment-checkout-title">Выберите способ оплаты</h2>
        <p>
          Пройдите сценарий, похожий на оформление заказа. Он работает только в браузере: заявки и
          деньги никуда не отправляются.
        </p>
      </div>

      <ol className="payment-progress" aria-label="Шаги оформления">
        {["Способ", "Условия", "Подтверждение"].map((label, index) => {
          const step = index + 1;
          const complete = step < progressStep;
          const current = step === progressStep;
          return (
            <li
              key={label}
              className={complete ? "is-complete" : current ? "is-current" : ""}
              aria-current={current ? "step" : undefined}
              aria-label={`${label}: ${complete ? "выполнено" : current ? "текущий шаг" : "ожидает"}`}
            >
              <span aria-hidden="true">{complete ? "✓" : String(step).padStart(2, "0")}</span>
              {label}
            </li>
          );
        })}
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
                  Выберите демо-офис, дату и время встречи для обсуждения договора и порядка оплаты.
                  Адреса и часы придуманы для портфолио; настоящая запись не создаётся.
                </p>
                <PaymentOfficeBooking
                  region={draft.parameters.region}
                  officeId={officeId}
                  date={appointmentDate}
                  time={appointmentTime}
                  disabled={pdfStatus === "working"}
                  onOfficeChange={(value) => {
                    setOfficeId(value);
                    setAppointmentDate("");
                    setAppointmentTime("");
                    clearConfirmation();
                  }}
                  onDateChange={(value) => {
                    setAppointmentDate(value);
                    setAppointmentTime("");
                    clearConfirmation();
                  }}
                  onTimeChange={(value) => {
                    setAppointmentTime(value);
                    clearConfirmation();
                  }}
                />
                {method === "cashFull" ? (
                  <ol className="payment-instructions">
                    <li>На встрече сверить состав работ, участок и предварительную цену.</li>
                    <li>В реальном проекте согласовать окончательную стоимость и договор.</li>
                    <li>
                      После договора внести один платёж; здесь он не проводится. Скидка 3% условная.
                    </li>
                  </ol>
                ) : (
                  <>
                    <p className="payment-schedule-lead">
                      Условный график строится по выбранным этапам. Реальные сроки, акты и порядок
                      оплаты определяются договором. На демо-встрече можно обсудить эту разбивку.
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
            {isCash && (
              <div>
                <dt>Демо-встреча</dt>
                <dd>
                  {appointmentValid
                    ? `${formatAppointmentDate(appointmentDate)}, ${appointmentTime} ${officeTimeZone(officeId).label}`
                    : "Дата и время не выбраны"}
                </dd>
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
                pendingConfirmation.current = null;
              }}
            />
            <span>
              Понимаю, что запись и оплата демонстрационные: заявка не отправляется, деньги не
              списываются, а PDF не является кассовым чеком.
            </span>
          </label>
          <button
            className="button button-primary payment-confirm-button"
            type="button"
            disabled={(!confirmation && !canConfirm) || pdfStatus === "working"}
            onClick={completeDemo}
          >
            {pdfStatus === "working"
              ? "Готовим PDF…"
              : confirmation
                ? "Скачать существующее подтверждение"
                : isCash
                  ? "Подтвердить демо-запись и скачать PDF"
                  : "Подтвердить маршрут и скачать PDF"}{" "}
            <ArrowIcon />
          </button>
          {!method && <p className="payment-hint">Сначала выберите способ оплаты.</p>}
          {isCash && !office && (
            <p className="payment-hint">Для оплаты наличными выберите демо-офис.</p>
          )}
          {isCash && office && !appointmentValid && (
            <p className="payment-hint">Для демо-записи выберите рабочий день и время.</p>
          )}
          {pdfStatus === "error" && (
            <p role="alert" className="payment-error">
              PDF не удалось сохранить. Попробуйте ещё раз.
            </p>
          )}
          {confirmation && (
            <div className="payment-success" role="status">
              <span>{confirmation.appointment ? "ДЕМО-ЗАПИСЬ СОЗДАНА" : "МАРШРУТ ВЫБРАН"}</span>
              <h4>Спасибо за выбор ОСНОВЫ!</h4>
              <p>
                Поздравляем с выбором проекта.{" "}
                {confirmation.appointment
                  ? `В демонстрации выбрана встреча ${formatAppointmentDate(confirmation.appointment.date)} в ${confirmation.appointment.time} ${confirmation.appointment.zoneLabel} по адресу: ${office?.office}.`
                  : "Выбранный способ финансирования отражён в PDF на вашем устройстве."}{" "}
                Настоящая заявка не отправлена, деньги не списаны.
              </p>
              <small>Номер: {confirmation.reference}</small>
              <button type="button" onClick={downloadAgain} disabled={pdfStatus === "working"}>
                Скачать подтверждение ещё раз <ArrowIcon />
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
