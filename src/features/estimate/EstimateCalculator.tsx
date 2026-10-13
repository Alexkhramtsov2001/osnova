import { useMemo, useRef, useState } from "react";
import OsnovaSelect from "../../components/OsnovaSelect";
import ContactIcon from "../../components/ContactIcon";
import ArrowIcon from "../../components/ArrowIcon";
import {
  DEMO_PRICES_NOTICE,
  WALL_MATERIALS,
  HOUSE_NUMBER_LIMITS,
  DEMO_ESTIMATE_CATALOG,
  DEMO_ESTIMATE_DATA,
  PROJECT_TYPES,
  DEMO_REGIONS,
  DEMO_DELIVERY,
} from "./catalog";
import { calculateHouseEstimate } from "./calculations";
import {
  clampHouseNumber,
  maximumBathrooms,
  maximumBedrooms,
  minimumArea,
  minimumPerimeter,
  normalizeForArea,
} from "./constraints";
import { formatRequestSummary } from "./requestSummary";
import { createDemoRequestPayload, submitDemoRequest } from "./demoRequest";
import { contactLinks } from "../contact/links";
import {
  readSavedEstimates,
  SAVED_ESTIMATES_LIMIT,
  writeSavedEstimates,
  type SavedEstimate,
} from "./savedEstimates";
import type { EstimateStageId, HouseParameters } from "./types";
import "./EstimateCalculator.css";

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

const allStageIds = DEMO_ESTIMATE_CATALOG.map((stage) => stage.id);

const options = {
  wallMaterial: Object.entries(WALL_MATERIALS).map(([value, material]) => ({
    value,
    label: material.label,
  })),
  foundation: [
    { value: "strip", label: "Ленточный" },
    { value: "slab", label: "Плитный" },
    { value: "piles", label: "Свайный" },
  ],
  roof: [
    { value: "metal", label: "Металлочерепица" },
    { value: "soft", label: "Мягкая кровля" },
  ],
  finish: [
    { value: "standard", label: "Стандарт" },
    { value: "comfort", label: "Комфорт" },
  ],
} as const;

function Field({
  label,
  hint,
  children,
  group = false,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  group?: boolean;
}) {
  if (group) {
    return (
      <div className="estimate-field" role="group" aria-label={label}>
        <span className="estimate-field-label" aria-hidden="true">
          {label}
        </span>
        {children}
      </div>
    );
  }

  return (
    <label className="estimate-field">
      <span className="estimate-field-label">{label}</span>
      {children}
      {hint && <span className="estimate-field-hint">{hint}</span>}
    </label>
  );
}

type EstimateCalculatorProps = {
  parameters: HouseParameters;
  onParametersChange: (parameters: HouseParameters) => void;
  onRestore: (parameters: HouseParameters, projectName: string | null) => void;
  projectName: string | null;
  onReset: () => void;
};

export default function EstimateCalculator({
  parameters,
  onParametersChange,
  onRestore,
  projectName,
  onReset,
}: EstimateCalculatorProps) {
  const [expandedStages, setExpandedStages] = useState<string[]>(["foundation"]);
  const [constructionMode, setConstructionMode] = useState<"turnkey" | "stages">("turnkey");
  const [selectedStageIds, setSelectedStageIds] = useState<EstimateStageId[]>(allStageIds);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<{
    text: string;
    message: string;
    error: boolean;
  } | null>(null);
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>(() =>
    readSavedEstimates(window.localStorage),
  );
  const [savedStatus, setSavedStatus] = useState("");
  const [demoSubmission, setDemoSubmission] = useState<{
    signature: string;
    phase: "sending" | "sent" | "error";
    message: string;
  } | null>(null);
  const demoRequestId = useRef<{ signature: string; id: string } | null>(null);

  const { estimate, inputError } = useMemo(() => {
    try {
      const scope =
        constructionMode === "turnkey"
          ? { mode: "turnkey" as const }
          : { mode: "stages" as const, stageIds: selectedStageIds };
      return { estimate: calculateHouseEstimate(parameters, scope), inputError: null };
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      return { estimate: null, inputError: error.message };
    }
  }, [parameters, constructionMode, selectedStageIds]);

  const includedStageCount = estimate?.stages.filter((stage) => stage.included).length ?? 0;
  const requestSummary =
    estimate && includedStageCount > 0
      ? formatRequestSummary(parameters, estimate, projectName, constructionMode)
      : null;
  const requestSignature = JSON.stringify({
    parameters,
    constructionMode,
    selectedStageIds,
    total: estimate?.total,
  });
  const currentSubmission = demoSubmission?.signature === requestSignature ? demoSubmission : null;

  const sendDemoRequest = async () => {
    if (
      !estimate ||
      includedStageCount === 0 ||
      currentSubmission?.phase === "sending" ||
      currentSubmission?.phase === "sent"
    )
      return;
    const id =
      demoRequestId.current?.signature === requestSignature
        ? demoRequestId.current.id
        : crypto.randomUUID();
    demoRequestId.current = { signature: requestSignature, id };
    setDemoSubmission({
      signature: requestSignature,
      phase: "sending",
      message: "Отправляем тестовую заявку…",
    });
    try {
      const payload = createDemoRequestPayload(
        parameters,
        estimate,
        projectName,
        constructionMode,
        id,
      );
      const savedId = await submitDemoRequest(payload);
      setDemoSubmission({
        signature: requestSignature,
        phase: "sent",
        message: `Тестовая заявка сохранена в Supabase. Номер: ${savedId.slice(0, 8)}.`,
      });
    } catch {
      setDemoSubmission({
        signature: requestSignature,
        phase: "error",
        message: "Не удалось сохранить тестовую заявку. Попробуйте ещё раз позже.",
      });
    }
  };

  const copySummary = async () => {
    if (!requestSummary) return;
    try {
      await navigator.clipboard.writeText(requestSummary);
      setCopyFeedback({
        text: requestSummary,
        message: "Сводка скопирована. Она никому не отправлена.",
        error: false,
      });
    } catch {
      setCopyFeedback({
        text: requestSummary,
        message:
          "Не удалось скопировать автоматически. Выделите текст сводки и скопируйте его вручную.",
        error: true,
      });
    }
  };

  const saveEstimate = () => {
    if (!requestSummary || !estimate) return;
    const entry: SavedEstimate = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      savedAt: new Date().toISOString(),
      title: projectName ? `«${projectName}»` : `Дом ${number.format(parameters.area)} м²`,
      area: parameters.area,
      mode: constructionMode,
      dataVersion: estimate.dataVersion,
      summary: requestSummary,
      configuration: {
        parameters: { ...parameters },
        stageIds: [...selectedStageIds],
        projectName,
      },
    };
    const next = [entry, ...savedEstimates].slice(0, SAVED_ESTIMATES_LIMIT);
    if (!writeSavedEstimates(window.localStorage, next)) {
      setSavedStatus("Не удалось сохранить расчёт в этом браузере. Скопируйте сводку вручную.");
      return;
    }
    setSavedEstimates(next);
    setSavedStatus("Расчёт сохранён на этом устройстве. Он останется снимком текущих данных.");
  };

  const deleteSavedEstimate = (id: string) => {
    const next = savedEstimates.filter((entry) => entry.id !== id);
    if (!writeSavedEstimates(window.localStorage, next)) {
      setSavedStatus("Не удалось удалить расчёт из хранилища браузера.");
      return;
    }
    setSavedEstimates(next);
    setSavedStatus("Сохранённый расчёт удалён.");
  };

  const copySavedEstimate = async (entry: SavedEstimate) => {
    try {
      await navigator.clipboard.writeText(entry.summary);
      setSavedStatus("Сохранённая сводка скопирована. Она никому не отправлена.");
    } catch {
      setSavedStatus(
        "Не удалось скопировать автоматически. Выделите текст сохранённой сводки вручную.",
      );
    }
  };

  const restoreSavedEstimate = (entry: SavedEstimate) => {
    if (!entry.configuration) return;
    onRestore({ ...entry.configuration.parameters }, entry.configuration.projectName);
    setConstructionMode(entry.mode);
    setSelectedStageIds([...entry.configuration.stageIds]);
    setSavedStatus(
      entry.dataVersion === DEMO_ESTIMATE_DATA.version
        ? "Параметры восстановлены. Сводка ниже осталась снимком сохранённого расчёта."
        : "Параметры восстановлены и пересчитаны по текущей демо-базе. Сохранённая сводка не изменилась.",
    );
    document.getElementById("calculator")?.scrollIntoView();
  };

  const toggleIncludedStage = (id: EstimateStageId) => {
    setSelectedStageIds((current) =>
      current.includes(id) ? current.filter((stageId) => stageId !== id) : [...current, id],
    );
  };

  const isInvalidNumber = (key: keyof typeof HOUSE_NUMBER_LIMITS) => {
    const { min, max } = HOUSE_NUMBER_LIMITS[key];
    const lower =
      key === "area"
        ? minimumArea(parameters.floors)
        : key === "perimeter" && Number.isFinite(parameters.area)
          ? minimumPerimeter(parameters.area, parameters.floors)
          : min;
    return !Number.isFinite(parameters[key]) || parameters[key] < lower || parameters[key] > max;
  };

  const update = <K extends keyof HouseParameters>(key: K, value: HouseParameters[K]) => {
    onParametersChange({ ...parameters, [key]: value });
  };

  const finishNumberEdit = (key: keyof typeof HOUSE_NUMBER_LIMITS) => {
    if (!Number.isFinite(parameters[key])) return;
    if (key === "area") {
      onParametersChange(normalizeForArea(parameters));
      return;
    }
    onParametersChange({
      ...parameters,
      [key]: clampHouseNumber(key, parameters[key], parameters),
    });
  };

  const toggleStage = (stageId: string) => {
    setExpandedStages((current) =>
      current.includes(stageId) ? current.filter((id) => id !== stageId) : [...current, stageId],
    );
  };

  const reset = () => {
    onReset();
    setExpandedStages(["foundation"]);
    setConstructionMode("turnkey");
    setSelectedStageIds(allStageIds);
  };

  return (
    <section className="estimate-calculator" aria-label="Калькулятор сметы">
      <div className="estimate-intro">
        <p className="estimate-eyebrow">
          <span className="estimate-status-dot" />
          ПРЕДВАРИТЕЛЬНЫЙ РАСЧЁТ
        </p>
        <h2>
          Дом начинается <span>с расчёта</span>
        </h2>
        <p className="estimate-lead">
          Настройте параметры будущего дома и посмотрите, как меняется ориентировочная стоимость
          строительства под ключ или отдельных этапов.
        </p>
      </div>

      <div className="estimate-layout">
        <div className="estimate-settings">
          <div className="estimate-panel-heading">
            <div>
              <span className="estimate-overline">01 / ПАРАМЕТРЫ</span>
              <h3>Ваш будущий дом</h3>
            </div>
            <button className="estimate-reset" type="button" onClick={reset}>
              Сбросить
            </button>
          </div>

          {projectName && (
            <p className="estimate-project-note" role="status">
              <strong>На основе проекта «{projectName}»</strong>
              Площадь, этажность и спальни взяты из каталога. Периметр примерно рассчитан для
              квадратной застройки. Материалы, отделка, регион, доставка и состав работ указаны
              ниже. Все параметры можно изменить.
            </p>
          )}

          <div className="estimate-fields">
            <Field label="Тип проекта" group>
              <OsnovaSelect
                ariaLabel="Тип проекта"
                value={parameters.projectType}
                onValueChange={(value) =>
                  update("projectType", value as HouseParameters["projectType"])
                }
                options={Object.entries(PROJECT_TYPES).map(([value, item]) => ({
                  value,
                  label: item.label,
                }))}
              />
              <span className="estimate-field-hint">
                {PROJECT_TYPES[parameters.projectType].explanation}
              </span>
            </Field>

            <Field label="Формат расчёта" group>
              <div className="estimate-choice-row">
                <button
                  type="button"
                  className={`estimate-choice ${constructionMode === "turnkey" ? "is-active" : ""}`}
                  aria-pressed={constructionMode === "turnkey"}
                  onClick={() => setConstructionMode("turnkey")}
                >
                  Под ключ
                </button>
                <button
                  type="button"
                  className={`estimate-choice ${constructionMode === "stages" ? "is-active" : ""}`}
                  aria-pressed={constructionMode === "stages"}
                  onClick={() => setConstructionMode("stages")}
                >
                  Отдельные этапы
                </button>
              </div>
            </Field>

            {constructionMode === "stages" && (
              <fieldset className="estimate-stage-selection">
                <legend>Состав работ</legend>
                <p>Отметьте нужные этапы. В итог войдут только выбранные работы.</p>
                {DEMO_ESTIMATE_CATALOG.map((stage) => (
                  <label key={stage.id} className="estimate-stage-option">
                    <input
                      type="checkbox"
                      checked={selectedStageIds.includes(stage.id)}
                      onChange={() => toggleIncludedStage(stage.id)}
                    />
                    <span>{stage.name}</span>
                  </label>
                ))}
              </fieldset>
            )}

            <Field label="Регион строительства" group>
              <OsnovaSelect
                ariaLabel="Регион строительства"
                value={parameters.region}
                onValueChange={(value) => update("region", value as HouseParameters["region"])}
                options={Object.entries(DEMO_REGIONS).map(([value, region]) => ({
                  value,
                  label: `${region.label} · ×${number.format(region.multiplier)}`,
                }))}
              />
              <span className="estimate-field-hint">
                Условная поправка для демо, не тариф по региону.
              </span>
            </Field>

            <Field label="Доставка материалов" group>
              <OsnovaSelect
                ariaLabel="Доставка материалов"
                value={parameters.delivery}
                onValueChange={(value) => update("delivery", value as HouseParameters["delivery"])}
                options={Object.entries(DEMO_DELIVERY).map(([value, delivery]) => ({
                  value,
                  label: `${delivery.label}${delivery.cost > 0 ? ` · ${money.format(delivery.cost)}` : ""}`,
                }))}
              />
              <span className="estimate-field-hint">
                Фиксированная демо-сумма за одну доставку; маршрут и объём груза не рассчитываются.
              </span>
            </Field>

            <Field label="Площадь дома" hint="Общая площадь всех этажей">
              <div className="estimate-number-wrap">
                <input
                  type="number"
                  min={minimumArea(parameters.floors)}
                  max={HOUSE_NUMBER_LIMITS.area.max}
                  step={HOUSE_NUMBER_LIMITS.area.step}
                  aria-invalid={isInvalidNumber("area")}
                  aria-describedby={isInvalidNumber("area") ? "estimate-input-error" : undefined}
                  value={Number.isFinite(parameters.area) ? parameters.area : ""}
                  onChange={(event) => update("area", event.target.valueAsNumber)}
                  onBlur={() => finishNumberEdit("area")}
                />
                <span>м²</span>
              </div>
            </Field>

            <Field label="Количество этажей" group>
              <div className="estimate-choice-row">
                {([1, 2] as const).map((floors) => (
                  <button
                    key={floors}
                    type="button"
                    className={`estimate-choice ${parameters.floors === floors ? "is-active" : ""}`}
                    aria-pressed={parameters.floors === floors}
                    onClick={() => onParametersChange(normalizeForArea({ ...parameters, floors }))}
                  >
                    {floors} {floors === 1 ? "этаж" : "этажа"}
                  </button>
                ))}
              </div>
            </Field>

            <div className="estimate-fields-two">
              <Field label="Спальни" group>
                <OsnovaSelect
                  ariaLabel="Спальни"
                  value={String(parameters.bedrooms)}
                  onValueChange={(value) => update("bedrooms", Number(value))}
                  options={[1, 2, 3, 4, 5, 6].map((value) => ({
                    value: String(value),
                    label: String(value),
                    disabled:
                      Number.isFinite(parameters.area) && value > maximumBedrooms(parameters.area),
                  }))}
                />
              </Field>

              <Field label="Санузлы" group>
                <OsnovaSelect
                  ariaLabel="Санузлы"
                  value={String(parameters.bathrooms)}
                  onValueChange={(value) => update("bathrooms", Number(value))}
                  options={[1, 2, 3, 4].map((value) => ({
                    value: String(value),
                    label: String(value),
                    disabled:
                      Number.isFinite(parameters.area) && value > maximumBathrooms(parameters.area),
                  }))}
                />
              </Field>
            </div>

            <Field label="Материал стен" group>
              <OsnovaSelect
                ariaLabel="Материал стен"
                value={parameters.wallMaterial}
                onValueChange={(value) =>
                  update("wallMaterial", value as HouseParameters["wallMaterial"])
                }
                options={options.wallMaterial}
              />
              <span className="estimate-field-hint">
                В демо технология влияет на стоимость этапа «Коробка дома».
              </span>
            </Field>

            <Field label="Тип фундамента" group>
              <OsnovaSelect
                ariaLabel="Тип фундамента"
                value={parameters.foundation}
                onValueChange={(value) =>
                  update("foundation", value as HouseParameters["foundation"])
                }
                options={options.foundation}
              />
            </Field>

            <Field label="Кровельное покрытие" group>
              <OsnovaSelect
                ariaLabel="Кровельное покрытие"
                value={parameters.roof}
                onValueChange={(value) => update("roof", value as HouseParameters["roof"])}
                options={options.roof}
              />
            </Field>

            <Field label="Уровень отделки" group>
              <div className="estimate-choice-row">
                {options.finish.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`estimate-choice ${
                      parameters.finish === option.value ? "is-active" : ""
                    }`}
                    aria-pressed={parameters.finish === option.value}
                    onClick={() => update("finish", option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="estimate-fields-two">
              <Field label="Высота стен" hint="На одном этаже">
                <div className="estimate-number-wrap">
                  <input
                    type="number"
                    min={HOUSE_NUMBER_LIMITS.wallHeight.min}
                    max={HOUSE_NUMBER_LIMITS.wallHeight.max}
                    step={HOUSE_NUMBER_LIMITS.wallHeight.step}
                    aria-invalid={isInvalidNumber("wallHeight")}
                    aria-describedby={
                      isInvalidNumber("wallHeight") ? "estimate-input-error" : undefined
                    }
                    value={Number.isFinite(parameters.wallHeight) ? parameters.wallHeight : ""}
                    onChange={(event) => update("wallHeight", event.target.valueAsNumber)}
                    onBlur={() => finishNumberEdit("wallHeight")}
                  />
                  <span>м</span>
                </div>
              </Field>

              <Field label="Периметр" hint="Внешние стены">
                <div className="estimate-number-wrap">
                  <input
                    type="number"
                    min={HOUSE_NUMBER_LIMITS.perimeter.min}
                    max={HOUSE_NUMBER_LIMITS.perimeter.max}
                    step={HOUSE_NUMBER_LIMITS.perimeter.step}
                    aria-invalid={isInvalidNumber("perimeter")}
                    aria-describedby={
                      isInvalidNumber("perimeter") ? "estimate-input-error" : undefined
                    }
                    value={Number.isFinite(parameters.perimeter) ? parameters.perimeter : ""}
                    onChange={(event) => update("perimeter", event.target.valueAsNumber)}
                    onBlur={() => finishNumberEdit("perimeter")}
                  />
                  <span>м</span>
                </div>
              </Field>
            </div>
          </div>

          <p className="estimate-settings-note">
            Изменяйте параметры — расчёт обновляется автоматически.
          </p>
        </div>

        <div className="estimate-results">
          {estimate ? (
            <>
              <div className="estimate-total-card">
                <div className="estimate-total-top">
                  <span className="estimate-overline">02 / СТОИМОСТЬ ПРОЕКТА</span>
                  <span className="estimate-live">
                    <span className="estimate-status-dot" />
                    Расчёт обновлён
                  </span>
                </div>

                <p className="estimate-total-label">
                  {constructionMode === "turnkey" ? "Под ключ" : "Отдельные этапы"} ·
                  ориентировочный диапазон
                </p>
                {includedStageCount > 0 ? (
                  <>
                    <p className="estimate-total-value">
                      {money.format(estimate.minTotal)} — {money.format(estimate.maxTotal)}
                    </p>
                    <p className="estimate-estimate-midpoint">
                      Средний ориентир: {money.format(estimate.total)}
                    </p>
                  </>
                ) : (
                  <p className="estimate-empty-scope" role="status">
                    Выберите хотя бы один этап, чтобы увидеть стоимость.
                  </p>
                )}

                <div className="estimate-total-meta">
                  <span>{PROJECT_TYPES[parameters.projectType].label}</span>
                  <span>
                    {DEMO_REGIONS[parameters.region].label} · ×
                    {number.format(DEMO_REGIONS[parameters.region].multiplier)}
                  </span>
                  <span>Площадь: {number.format(parameters.area)} м²</span>
                  <span>
                    {parameters.floors} {parameters.floors === 1 ? "этаж" : "этажа"}
                  </span>
                </div>
                <p className="estimate-data-meta">
                  Версия данных: {estimate.dataVersion} · от{" "}
                  {estimate.dataUpdatedAt.split("-").reverse().join(".")}
                </p>
              </div>

              {includedStageCount > 0 && (
                <div className="estimate-duration-card">
                  <span className="estimate-overline">ОРИЕНТИР ПО СРОКАМ</span>
                  <strong>
                    {estimate.durationWeeks.min}–{estimate.durationWeeks.max} нед.
                  </strong>
                  <p>
                    Календарные недели. Этапы сложены последовательно; параллельные работы, сезон и
                    условия участка не учтены.
                  </p>
                  {estimate.deliveryLeadWeeks > 0 && (
                    <p>Включён условный запас на доставку: {estimate.deliveryLeadWeeks} нед.</p>
                  )}
                </div>
              )}

              {requestSummary && (
                <div className="estimate-request-card">
                  <span className="estimate-overline">СЛЕДУЮЩИЙ ШАГ</span>
                  <h3>Проверить отправку заявки</h3>
                  <p>
                    Тестовая заявка сохранит в Supabase только параметры дома и расчёта. Имя,
                    телефон, email и сообщения посетителей не запрашиваются.
                  </p>
                  <button
                    type="button"
                    className="estimate-demo-submit"
                    onClick={sendDemoRequest}
                    disabled={
                      currentSubmission?.phase === "sending" || currentSubmission?.phase === "sent"
                    }
                  >
                    {currentSubmission?.phase === "sending"
                      ? "Отправляем…"
                      : currentSubmission?.phase === "sent"
                        ? "Тестовая заявка отправлена"
                        : "Отправить тестовую заявку"}
                  </button>
                  {currentSubmission && (
                    <p role={currentSubmission.phase === "error" ? "alert" : "status"}>
                      {currentSubmission.message}
                    </p>
                  )}
                  <p className="estimate-contact-note">
                    Это проверка работы сайта, а не запрос на строительство. Для связи с автором
                    используйте контакты ниже.
                  </p>
                  <button
                    type="button"
                    className="estimate-request-toggle"
                    aria-expanded={summaryOpen}
                    aria-controls="estimate-request-summary"
                    onClick={() => setSummaryOpen((current) => !current)}
                  >
                    {summaryOpen ? "Скрыть сводку" : "Подготовить сводку"}
                  </button>
                  <button type="button" className="estimate-save-button" onClick={saveEstimate}>
                    Сохранить расчёт
                  </button>
                  {summaryOpen && (
                    <div id="estimate-request-summary" className="estimate-request-preview">
                      <label htmlFor="estimate-request-text">Текст сводки</label>
                      <textarea
                        id="estimate-request-text"
                        readOnly
                        value={requestSummary}
                        rows={14}
                      />
                      <button type="button" className="estimate-request-copy" onClick={copySummary}>
                        Копировать текст
                      </button>
                      <div className="estimate-contact-actions">
                        <a
                          className="contact-channel-email"
                          href={contactLinks("ОСНОВА — вопрос по расчёту", requestSummary).email}
                        >
                          <span className="estimate-contact-icon">
                            <ContactIcon kind="email" />
                          </span>
                          Открыть письмо с расчётом <ArrowIcon />
                        </a>
                        <a
                          className="contact-channel-telegram"
                          href={contactLinks("ОСНОВА — вопрос по расчёту", requestSummary).telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="estimate-contact-icon">
                            <ContactIcon kind="telegram" />
                          </span>
                          Открыть Telegram с расчётом <ArrowIcon />
                        </a>
                      </div>
                      <p className="estimate-contact-note">
                        Сайт подготовит текст, но не отправит его. Проверьте и отправьте сообщение в
                        почтовом приложении или Telegram.
                      </p>
                      {copyFeedback?.text === requestSummary && (
                        <p role={copyFeedback.error ? "alert" : "status"}>{copyFeedback.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="estimate-breakdown-heading">
                <div>
                  <span className="estimate-overline">03 / ДЕТАЛИЗАЦИЯ</span>
                  <h3>Из чего складывается цена</h3>
                </div>
                <span className="estimate-stage-count" aria-live="polite">
                  Включено: {includedStageCount} из {estimate.stages.length}
                </span>
              </div>
              <p className="estimate-breakdown-note">
                Региональная поправка уже включена в цены этапов. Доставка показана отдельно после
                списка.
              </p>

              <div className="estimate-stages">
                {estimate.stages.map((stage, index) => {
                  const isExpanded = expandedStages.includes(stage.id);

                  return (
                    <div
                      className={`estimate-stage ${stage.included ? "" : "is-excluded"}`}
                      key={stage.id}
                    >
                      <button
                        type="button"
                        className="estimate-stage-toggle"
                        aria-expanded={stage.included && isExpanded}
                        disabled={!stage.included}
                        onClick={() => toggleStage(stage.id)}
                      >
                        <span className="estimate-stage-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="estimate-stage-copy">
                          <strong>{stage.name}</strong>
                          <small>{stage.description}</small>
                          {stage.included && (
                            <small className="estimate-stage-duration">
                              Ориентир: {stage.durationWeeks.min}–{stage.durationWeeks.max} нед.
                            </small>
                          )}
                        </span>
                        <span className="estimate-stage-price">
                          {stage.included ? money.format(stage.total) : "Не включён"}
                        </span>
                        <span
                          className={`estimate-chevron ${isExpanded ? "is-open" : ""}`}
                          aria-hidden="true"
                        >
                          <ArrowIcon direction="chevron-down" />
                        </span>
                      </button>

                      {stage.included && isExpanded && (
                        <div className="estimate-stage-details">
                          <p className="estimate-stage-detail-label">В расчёт этапа входят</p>
                          {stage.items.map((item) => (
                            <div className="estimate-line-item" key={item.id}>
                              <span className="estimate-line-name">{item.name}</span>
                              <span className="estimate-line-quantity">
                                {number.format(item.quantity)} {item.unit}
                              </span>
                              <span className="estimate-line-total">
                                {money.format(item.quantity * item.unitPrice)}
                              </span>
                            </div>
                          ))}
                          <div className="estimate-stage-explanation">
                            <p>
                              <strong>Что меняет цену:</strong> {stage.priceFactors}
                            </p>
                            <p>
                              <strong>Допущение:</strong> {stage.assumption}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {includedStageCount > 0 && parameters.delivery !== "none" && (
                <div className="estimate-delivery-row">
                  <span>Доставка материалов · {DEMO_DELIVERY[parameters.delivery].label}</span>
                  <strong>{money.format(estimate.deliveryCost)}</strong>
                </div>
              )}

              {includedStageCount > 0 && (
                <div className="estimate-grand-total">
                  <span>
                    {estimate.deliveryCost > 0
                      ? "Итого с доставкой"
                      : constructionMode === "turnkey"
                        ? "Итого по всем этапам"
                        : "Итого по выбранным этапам"}
                  </span>
                  <strong>{money.format(estimate.total)}</strong>
                </div>
              )}

              <p className="estimate-disclaimer">
                {DEMO_PRICES_NOTICE} Вилка условная и построена вокруг среднего ориентира.
                Региональные коэффициенты и суммы доставки — условные сценарии для портфолио, не
                проверенные тарифы; доставка добавляется один раз сверх этапов. Участок и
                индивидуальное проектирование отдельно не оцениваются. Источники базовых ориентиров
                — в документации.
                {" Проектирование и проверка чертежей в стоимость строительных этапов не включены."}
                {constructionMode === "stages" &&
                  " Расчёт отдельных этапов предполагает, что необходимые предыдущие работы уже выполнены."}
              </p>
            </>
          ) : (
            <p className="estimate-disclaimer" id="estimate-input-error" role="alert">
              {inputError}. Исправьте параметры — расчёт появится автоматически.
            </p>
          )}
        </div>
      </div>
      <section className="estimate-saved" aria-labelledby="estimate-saved-title">
        <div className="estimate-saved-heading">
          <div>
            <span className="estimate-overline">НА ЭТОМ УСТРОЙСТВЕ</span>
            <h3 id="estimate-saved-title">Сохранённые расчёты</h3>
          </div>
          <span>
            {savedEstimates.length} из {SAVED_ESTIMATES_LIMIT}
          </span>
        </div>
        <p>
          Сохраняется снимок сводки с версией демо-данных. Он не меняется при последующих правках
          калькулятора. Новые записи можно загрузить в поля для повторного расчёта по текущей
          демо-базе. Данные доступны только в этом браузере; записи сверх лимита заменяют самые
          старые.
        </p>
        {savedStatus && (
          <p className="estimate-saved-status" role="status">
            {savedStatus}
          </p>
        )}
        {savedEstimates.length === 0 ? (
          <p className="estimate-saved-empty">
            Пока ничего не сохранено. Настройте расчёт и нажмите «Сохранить расчёт».
          </p>
        ) : (
          <div className="estimate-saved-list">
            {savedEstimates.map((entry) => (
              <article className="estimate-saved-item" key={entry.id}>
                <div className="estimate-saved-item-head">
                  <div>
                    <strong>{entry.title}</strong>
                    <span>
                      {new Intl.DateTimeFormat("ru-RU", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(entry.savedAt))}{" "}
                      · {entry.mode === "turnkey" ? "Под ключ" : "Отдельные этапы"} ·{" "}
                      {number.format(entry.area)} м²
                    </span>
                    <small>Версия данных: {entry.dataVersion}</small>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSavedEstimate(entry.id)}
                    aria-label={`Удалить сохранённый расчёт ${entry.title}`}
                  >
                    Удалить
                  </button>
                </div>
                {entry.configuration && (
                  <button
                    type="button"
                    onClick={() => restoreSavedEstimate(entry)}
                    aria-label={`Загрузить параметры расчёта ${entry.title}`}
                  >
                    Загрузить параметры
                  </button>
                )}
                <details>
                  <summary>Посмотреть сохранённую сводку</summary>
                  <textarea
                    aria-label={`Сводка расчёта ${entry.title}`}
                    readOnly
                    value={entry.summary}
                    rows={10}
                  />
                  <button type="button" onClick={() => copySavedEstimate(entry)}>
                    Копировать сводку
                  </button>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
