import { formatDuration } from "./formatters";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import ArrowIcon from "../../components/ArrowIcon";
import ContactIcon from "../../components/ContactIcon";
import OsnovaSelect from "../../components/OsnovaSelect";
import { contactLinks } from "../contact/links";
import { calculateHouseEstimate } from "./calculations";
import {
  DEMO_DELIVERY,
  DEMO_ESTIMATE_CATALOG,
  DEMO_ESTIMATE_DATA,
  DEMO_PRICES_NOTICE,
  DEMO_REGIONS,
  HOUSE_NUMBER_LIMITS,
  PROJECT_TYPES,
} from "./catalog";
import {
  clampHouseNumber,
  maximumBathrooms,
  maximumBedrooms,
  maximumPerimeter,
  minimumArea,
  minimumBathrooms,
  minimumBedrooms,
  minimumPerimeter,
  normalizeForArea,
  isHouseNumberStepValid,
} from "./constraints";
import { createDemoRequestPayload, submitDemoRequest } from "./demoRequest";
import EstimateBreakdown from "./EstimateBreakdown";
import "./EstimateCalculator.css";
import EstimatePdfButton from "./EstimatePdfButton";
import { formatRequestSummary } from "./requestSummary";
import SavedEstimates from "./SavedEstimateList";
import { SAVED_ESTIMATES_LIMIT, type SavedEstimate } from "./savedEstimates";
import { useSavedEstimates } from "./useSavedEstimates";
import { writeCalculatorDraft } from "./calculatorDraft";
import type { EstimateScope, EstimateStageId, HouseParameters } from "./types";

import { money, number } from "./formatters";
const allStageIds = DEMO_ESTIMATE_CATALOG.map((stage) => stage.id);

import Field from "./EstimateField";
import { options } from "./options";
type EstimateCalculatorProps = {
  parameters: HouseParameters;
  onParametersChange: (parameters: HouseParameters) => void;
  onRestore: (parameters: HouseParameters, projectName: string | null) => void;
  projectName: string | null;
  onReset: () => void;
  initialScope?: EstimateScope;
  initialStageIds?: EstimateStageId[];
  sourceProjectNumber?: string | null;
};

export default function EstimateCalculator({
  parameters,
  onParametersChange,
  onRestore,
  projectName,
  onReset,
  initialScope = { mode: "turnkey" },
  initialStageIds,
  sourceProjectNumber = null,
}: EstimateCalculatorProps) {
  const [expandedStages, setExpandedStages] = useState<string[]>(["foundation"]);
  const [constructionMode, setConstructionMode] = useState<"turnkey" | "stages">(initialScope.mode);
  const [selectedStageIds, setSelectedStageIds] = useState<EstimateStageId[]>(
    initialStageIds ?? (initialScope.mode === "stages" ? initialScope.stageIds : allStageIds),
  );
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<{
    text: string;
    message: string;
    error: boolean;
  } | null>(null);
  const { savedEstimates, mutate: mutateSavedEstimates } = useSavedEstimates();
  const [savedStatus, setSavedStatus] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [demoSubmissions, setDemoSubmissions] = useState<
    Record<
      string,
      {
        phase: "sending" | "sent" | "error";
        message: string;
      }
    >
  >({});
  const demoRequestIds = useRef(new Map<string, string>());

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
    projectName,
    constructionMode,
    selectedStageIds: [...(constructionMode === "turnkey" ? allStageIds : selectedStageIds)].sort(),
    total: estimate?.total,
  });
  const currentSubmission = demoSubmissions[requestSignature];
  useEffect(() => {
    if (!estimate) return;
    try {
      writeCalculatorDraft(window.sessionStorage, {
        parameters,
        projectName,
        mode: constructionMode,
        stageIds: selectedStageIds,
        sourceProjectNumber,
      });
    } catch {
      /* Черновик необязателен. */
    }
  }, [parameters, projectName, constructionMode, selectedStageIds, estimate, sourceProjectNumber]);

  const sendDemoRequest = async () => {
    if (
      !estimate ||
      includedStageCount === 0 ||
      currentSubmission?.phase === "sending" ||
      currentSubmission?.phase === "sent"
    )
      return;
    const id = demoRequestIds.current.get(requestSignature) ?? crypto.randomUUID();
    demoRequestIds.current.set(requestSignature, id);
    setDemoSubmissions((current) => ({
      ...current,
      [requestSignature]: {
        phase: "sending",
        message: "Отправляем тестовую заявку…",
      },
    }));
    try {
      const payload = createDemoRequestPayload(
        parameters,
        estimate,
        projectName,
        constructionMode,
        id,
      );
      const savedId = await submitDemoRequest(payload);
      setDemoSubmissions((current) => ({
        ...current,
        [requestSignature]: {
          phase: "sent",
          message: `Тестовая заявка сохранена в Supabase. Номер: ${savedId.slice(0, 8)}.`,
        },
      }));
    } catch {
      setDemoSubmissions((current) => ({
        ...current,
        [requestSignature]: {
          phase: "error",
          message: "Не удалось сохранить тестовую заявку. Попробуйте ещё раз позже.",
        },
      }));
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

  const saveEstimate = async () => {
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
    if (
      !(await mutateSavedEstimates((current) =>
        [entry, ...current].slice(0, SAVED_ESTIMATES_LIMIT),
      ))
    ) {
      setSavedStatus("Не удалось сохранить расчёт в этом браузере. Скопируйте сводку вручную.");
      return;
    }
    setSavedStatus("Расчёт сохранён на этом устройстве. Он останется снимком текущих данных.");
  };

  const deleteSavedEstimate = async (id: string) => {
    if (!(await mutateSavedEstimates((current) => current.filter((entry) => entry.id !== id)))) {
      setSavedStatus("Не удалось удалить расчёт из хранилища браузера.");
      return;
    }
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

  const numberBounds = (key: keyof typeof HOUSE_NUMBER_LIMITS) => {
    const { min, max } = HOUSE_NUMBER_LIMITS[key];
    const lower =
      key === "area"
        ? minimumArea(parameters.floors)
        : key === "perimeter" && Number.isFinite(parameters.area)
          ? minimumPerimeter(parameters.area, parameters.floors)
          : min;
    const upper =
      key === "perimeter" && Number.isFinite(parameters.area)
        ? maximumPerimeter(parameters.area, parameters.floors)
        : max;
    return { lower, upper };
  };
  const isInvalidNumber = (key: keyof typeof HOUSE_NUMBER_LIMITS) => {
    const { lower, upper } = numberBounds(key);
    return (
      !isHouseNumberStepValid(key, parameters[key]) ||
      parameters[key] < lower ||
      parameters[key] > upper
    );
  };
  const numberError = (key: keyof typeof HOUSE_NUMBER_LIMITS) => {
    if (key === "perimeter" && isInvalidNumber("area")) return null;
    if (!isInvalidNumber(key)) return null;
    const { lower, upper } = numberBounds(key);
    return (
      <span className="estimate-field-error" id={`estimate-${key}-error`} role="alert">
        {Number.isFinite(parameters[key]) ? "Допустимо" : "Введите число"}: от{" "}
        {number.format(lower)} до {number.format(upper)}. Шаг{" "}
        {number.format(HOUSE_NUMBER_LIMITS[key].step)}.
      </span>
    );
  };
  const hasNumberError = (
    Object.keys(HOUSE_NUMBER_LIMITS) as (keyof typeof HOUSE_NUMBER_LIMITS)[]
  ).some(isInvalidNumber);

  const update = <K extends keyof HouseParameters>(key: K, value: HouseParameters[K]) => {
    if (key === "bedrooms") {
      onParametersChange(normalizeForArea({ ...parameters, bedrooms: value as number }));
      return;
    }
    if (key in HOUSE_NUMBER_LIMITS && typeof value === "number" && Number.isFinite(value)) {
      const numericKey = key as keyof typeof HOUSE_NUMBER_LIMITS;
      const limits = HOUSE_NUMBER_LIMITS[numericKey];
      if (value >= limits.min && value <= limits.max) {
        onParametersChange({
          ...parameters,
          [key]: Number((Math.round(value / limits.step) * limits.step).toFixed(1)),
        });
        return;
      }
    }
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
        <h1>
          Дом начинается <span>с расчёта</span>
        </h1>
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
              <h2>Ваш будущий дом</h2>
            </div>
            <button className="estimate-reset" type="button" onClick={reset}>
              Сбросить
            </button>
          </div>

          {estimate && includedStageCount > 0 && (
            <div
              className="estimate-compact-summary"
              aria-label="Краткая сводка расчёта"
              role="status"
            >
              <span>
                Ориентир · {constructionMode === "turnkey" ? "Под ключ" : "Отдельные этапы"}
              </span>
              <strong>
                {money.format(estimate.minTotal)} — {money.format(estimate.maxTotal)}
              </strong>
              <span>
                {number.format(parameters.area)} м² ·{" "}
                {options.wallMaterial.find((item) => item.value === parameters.wallMaterial)?.label}
              </span>
            </div>
          )}

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
                  aria-describedby={isInvalidNumber("area") ? "estimate-area-error" : undefined}
                  value={Number.isFinite(parameters.area) ? parameters.area : ""}
                  onChange={(event) => {
                    const area = event.target.valueAsNumber;
                    const next = { ...parameters, area };
                    onParametersChange(
                      Number.isFinite(area) &&
                        area >= minimumArea(parameters.floors) &&
                        area <= HOUSE_NUMBER_LIMITS.area.max
                        ? normalizeForArea(next)
                        : next,
                    );
                  }}
                  onBlur={() => finishNumberEdit("area")}
                />
                <span>м²</span>
              </div>
              {numberError("area")}
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
                      Number.isFinite(parameters.area) &&
                      (value < minimumBedrooms(parameters.area) ||
                        value > maximumBedrooms(parameters.area, parameters.floors)),
                  }))}
                />
                {!isInvalidNumber("area") && (
                  <span className="estimate-field-hint">
                    Для {number.format(parameters.area)} м²: от {minimumBedrooms(parameters.area)}
                    до {maximumBedrooms(parameters.area, parameters.floors)} спален с запасом на
                    общие помещения.
                  </span>
                )}
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
                      Number.isFinite(parameters.area) &&
                      (value < minimumBathrooms(parameters.area, parameters.bedrooms) ||
                        value >
                          maximumBathrooms(
                            parameters.area,
                            parameters.floors,
                            parameters.bedrooms,
                          )),
                  }))}
                />
                {!isInvalidNumber("area") && (
                  <span className="estimate-field-hint">
                    Для {parameters.bedrooms} спален: от{" "}
                    {minimumBathrooms(parameters.area, parameters.bedrooms)}
                    до {maximumBathrooms(
                      parameters.area,
                      parameters.floors,
                      parameters.bedrooms,
                    )}{" "}
                    санузлов.
                  </span>
                )}
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
                Технология меняет состав коробки, фасада и отделки стен в демо-модели.
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
                      isInvalidNumber("wallHeight") ? "estimate-wallHeight-error" : undefined
                    }
                    value={Number.isFinite(parameters.wallHeight) ? parameters.wallHeight : ""}
                    onChange={(event) => update("wallHeight", event.target.valueAsNumber)}
                    onBlur={() => finishNumberEdit("wallHeight")}
                  />
                  <span>м</span>
                </div>
                {numberError("wallHeight")}
              </Field>

              <Field label="Периметр" hint="Внешние стены">
                <div className="estimate-number-wrap">
                  <input
                    type="number"
                    min={minimumPerimeter(parameters.area, parameters.floors)}
                    max={maximumPerimeter(parameters.area, parameters.floors)}
                    step={HOUSE_NUMBER_LIMITS.perimeter.step}
                    aria-invalid={!isInvalidNumber("area") && isInvalidNumber("perimeter")}
                    aria-describedby={
                      !isInvalidNumber("area") && isInvalidNumber("perimeter")
                        ? "estimate-perimeter-error"
                        : undefined
                    }
                    value={Number.isFinite(parameters.perimeter) ? parameters.perimeter : ""}
                    onChange={(event) => update("perimeter", event.target.valueAsNumber)}
                    onBlur={() => finishNumberEdit("perimeter")}
                  />
                  <span>м</span>
                </div>
                {numberError("perimeter")}
                <span className="estimate-field-hint">
                  {!isInvalidNumber("area") ? (
                    <>
                      Для выбранной площади: {minimumPerimeter(parameters.area, parameters.floors)}–
                      {maximumPerimeter(parameters.area, parameters.floors)} м по условной модели
                      контура.
                    </>
                  ) : (
                    "Сначала укажите допустимую площадь для определения диапазона периметра."
                  )}
                </span>
              </Field>
            </div>
          </div>

          <p className="estimate-settings-note">
            Изменяйте параметры — расчёт обновляется автоматически.
          </p>
        </div>

        <div className="estimate-side">
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
                    Ориентировочный диапазон
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
                      {formatDuration(estimate.durationWeeks.min)}–
                      {formatDuration(estimate.durationWeeks.max)} нед.
                    </strong>
                    <p>
                      Календарные недели. Этапы сложены последовательно; параллельные работы, сезон
                      и условия участка не учтены.
                    </p>
                    {estimate.deliveryLeadWeeks > 0 && (
                      <p>Включён условный запас на доставку: {estimate.deliveryLeadWeeks} нед.</p>
                    )}
                  </div>
                )}

                {requestSummary && (
                  <div className="estimate-request-card">
                    <span className="estimate-overline">СЛЕДУЮЩИЙ ШАГ</span>
                    <h2>Проверить отправку заявки</h2>
                    <p>
                      Тестовая заявка сохранит в Supabase только параметры дома и расчёта. Имя,
                      телефон, email и сообщения посетителей не запрашиваются.
                    </p>
                    <button
                      type="button"
                      className="estimate-demo-submit"
                      onClick={sendDemoRequest}
                      disabled={
                        currentSubmission?.phase === "sending" ||
                        currentSubmission?.phase === "sent"
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
                    <div className="estimate-request-actions">
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
                    </div>
                    {summaryOpen && (
                      <div id="estimate-request-summary" className="estimate-request-preview">
                        <label htmlFor="estimate-request-text">Текст сводки</label>
                        <textarea
                          id="estimate-request-text"
                          readOnly
                          value={requestSummary}
                          rows={14}
                        />
                        <button
                          type="button"
                          className="estimate-request-copy"
                          onClick={copySummary}
                        >
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
                            href={
                              contactLinks("ОСНОВА — вопрос по расчёту", requestSummary).telegram
                            }
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
                          Сайт подготовит текст, но не отправит его. Проверьте и отправьте сообщение
                          в почтовом приложении или Telegram.
                        </p>
                        {copyFeedback?.text === requestSummary && (
                          <p role={copyFeedback.error ? "alert" : "status"}>
                            {copyFeedback.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <EstimateBreakdown
                  estimate={estimate}
                  parameters={parameters}
                  includedStageCount={includedStageCount}
                  constructionMode={constructionMode}
                  breakdownOpen={breakdownOpen}
                  onToggle={() => setBreakdownOpen((open) => !open)}
                  expandedStages={expandedStages}
                  toggleStage={toggleStage}
                />
                {includedStageCount > 0 && (
                  <div className="estimate-next-actions">
                    <Link
                      className="button button-primary button-center-label estimate-payment-link"
                      to="/payment#payment-checkout"
                      onClick={(event) => {
                        let saved = false;
                        try {
                          saved = writeCalculatorDraft(window.sessionStorage, {
                            parameters,
                            projectName,
                            mode: constructionMode,
                            stageIds: selectedStageIds,
                            sourceProjectNumber,
                          });
                        } catch {
                          // Access to sessionStorage itself can also be denied.
                        }
                        if (!saved) {
                          event.preventDefault();
                          setCheckoutError(
                            "Не удалось сохранить актуальный расчёт. Оформление остановлено, чтобы не открыть старую смету. Проверьте хранилище вкладки и попробуйте снова.",
                          );
                        } else setCheckoutError("");
                      }}
                    >
                      <span>Оплатить (демо)</span> <ArrowIcon />
                    </Link>
                    <EstimatePdfButton
                      parameters={parameters}
                      estimate={estimate}
                      projectName={projectName}
                      constructionMode={constructionMode}
                    />
                  </div>
                )}

                {checkoutError && <p role="alert">{checkoutError}</p>}

                <p className="estimate-disclaimer">
                  {DEMO_PRICES_NOTICE} Вилка условная и построена вокруг среднего ориентира.
                  Региональные коэффициенты и суммы доставки — условные сценарии для портфолио, не
                  проверенные тарифы; доставка добавляется один раз сверх этапов. Участок и
                  индивидуальное проектирование отдельно не оцениваются. Источники базовых
                  ориентиров — в документации.
                  {
                    " Проектирование и проверка чертежей в стоимость строительных этапов не включены."
                  }
                  {constructionMode === "stages" &&
                    " Расчёт отдельных этапов предполагает, что необходимые предыдущие работы уже выполнены."}
                </p>
              </>
            ) : !hasNumberError ? (
              <p className="estimate-disclaimer" id="estimate-input-error" role="alert">
                {inputError}. Исправьте параметры — расчёт появится автоматически.
              </p>
            ) : null}
          </div>
          <SavedEstimates
            savedEstimates={savedEstimates}
            savedStatus={savedStatus}
            deleteSavedEstimate={deleteSavedEstimate}
            restoreSavedEstimate={restoreSavedEstimate}
            copySavedEstimate={copySavedEstimate}
          />
        </div>
      </div>
    </section>
  );
}
