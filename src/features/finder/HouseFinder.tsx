import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import SiteHeader from "../../components/SiteHeader";
import ArrowIcon from "../../components/ArrowIcon";
import { formatPriceRange, getProjectEstimate } from "../projects/estimates";
import {
  QUESTION_COUNT,
  nextQuestion,
  recommendProject,
  questionBank,
  updateAnswer,
  type Answers,
  type BankQuestion,
} from "./recommendation";
import "./HouseFinder.css";

export default function HouseFinder() {
  const [step, setStep] = useState(0);
  const [questionIds, setQuestionIds] = useState<string[]>(["purpose"]);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const questionHeading = useRef<HTMLLegendElement>(null);
  const previousStep = useRef(0);
  const completed = step === QUESTION_COUNT;
  const question = questionBank.find(
    (item) => item.id === questionIds[Math.min(step, QUESTION_COUNT - 1)],
  ) as BankQuestion;
  const recommendation = completed ? recommendProject(answers) : null;
  const options = question.options;
  const canContinue = options.some((option) => option.value === answers[question.id]);
  const project = recommendation?.project;
  const estimate = project ? getProjectEstimate(project) : null;

  useEffect(() => {
    const target = completed ? heading.current : questionHeading.current;
    if (previousStep.current !== step) {
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ behavior: "instant", block: "start" });
    }
    previousStep.current = step;
  }, [step, completed]);

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="house-finder section-wrap">
        <Link className="finder-back" to="/#projects">
          <ArrowIcon direction="left" /> К подборке домов
        </Link>
        <p className="eyebrow">ВАШ ДОМ / ПЕРСОНАЛЬНЫЙ ПОДБОР</p>
        <h1 ref={heading} tabIndex={-1}>
          {completed
            ? project
              ? "Дом, с которого стоит начать"
              : "Создайте свой вариант дома"
            : "Найдём дом под ваш ритм жизни"}
        </h1>
        <p className="finder-lead">
          {completed
            ? project
              ? "Этот проект соответствует выбранным условиям. Вот почему он подходит."
              : "В каталоге нет типового проекта под ваши пожелания. Перейдите в калькулятор-конфигуратор, чтобы задать параметры своего дома."
            : `Ровно ${QUESTION_COUNT} коротких вопросов из расширенной подборки. Следующие вопросы учитывают ваши ответы. Без регистрации и контактов.`}
        </p>
        {!completed ? (
          <form
            className="finder-card"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canContinue) return;
              if (step === QUESTION_COUNT - 1) {
                setStep(QUESTION_COUNT);
                return;
              }
              const next = nextQuestion(answers, questionIds);
              if (!next) return;
              setQuestionIds((current) => [...current.slice(0, step + 1), next.id]);
              setStep(step + 1);
            }}
          >
            <div className="finder-progress-label">
              <span>
                Вопрос {step + 1} из {QUESTION_COUNT}
              </span>
              <span>Около 2 минут</span>
            </div>
            <progress aria-label="Прогресс подбора" value={step} max={QUESTION_COUNT} />
            <fieldset key={question.id}>
              <legend ref={questionHeading} tabIndex={-1}>
                {question.title}
              </legend>
              {"hint" in question && <p className="finder-hint">{question.hint}</p>}
              <div className="finder-options">
                {options.map((option) => (
                  <label
                    key={option.value}
                    className={answers[question.id] === option.value ? "is-selected" : ""}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={answers[question.id] === option.value}
                      onChange={() => {
                        setAnswers((current) => {
                          const retained = Object.fromEntries(
                            questionIds.slice(0, step).map((id) => [id, current[id]]),
                          ) as Partial<Answers>;
                          return updateAnswer(retained, question.id, option.value);
                        });
                        setQuestionIds((current) => current.slice(0, step + 1));
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="finder-actions">
              <button
                className="button button-secondary"
                type="button"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                Назад
              </button>
              <button className="button button-primary" type="submit" disabled={!canContinue}>
                {step === QUESTION_COUNT - 1 ? "Показать мой дом" : "Продолжить"}
                <ArrowIcon />
              </button>
            </div>
          </form>
        ) : !project ? (
          <div className="finder-next finder-no-match">
            <Link className="button button-primary" to="/#calculator">
              Перейти в калькулятор-конфигуратор
              <ArrowIcon />
            </Link>
          </div>
        ) : (
          recommendation &&
          project &&
          estimate && (
            <div className="finder-result">
              <img src={project.image} alt={`Концепция дома «${project.name}»`} />
              <div className="finder-result-copy">
                <p className="eyebrow">СООТВЕТСТВУЕТ ВЫБРАННЫМ ПАРАМЕТРАМ</p>
                <h2>{project.name}</h2>
                <p>
                  {project.area} м² · {project.floors === 1 ? "Один этаж" : "Два этажа"} · Спален:{" "}
                  {project.bedrooms}
                </p>
                <h3>Почему этот дом</h3>
                <ul>
                  {recommendation.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <p>{project.tradeoff}</p>
                <p className="finder-price">
                  <small>Ориентир под ключ · демо</small>
                  <strong>{formatPriceRange(estimate.minTotal, estimate.maxTotal)}</strong>
                </p>
                <Link className="button button-primary" to={`/projects/${project.number}`}>
                  Посмотреть проект
                  <ArrowIcon />
                </Link>
              </div>
              <div className="finder-next">
                <h3>Хотите изменить параметры?</h3>
                <p>
                  Откройте этот дом в калькуляторе-конфигураторе: измените площадь, материалы и
                  состав работ под свои задачи.
                </p>
                <Link
                  className="button button-primary"
                  to={`/?project=${project.number}#calculator`}
                >
                  Настроить дом в конфигураторе
                  <ArrowIcon />
                </Link>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setStep(QUESTION_COUNT - 1)}
                >
                  Изменить ответы
                </button>
                <button
                  className="finder-restart"
                  type="button"
                  onClick={() => {
                    setAnswers({});
                    setQuestionIds(["purpose"]);
                    setStep(0);
                  }}
                >
                  Пройти заново
                </button>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
