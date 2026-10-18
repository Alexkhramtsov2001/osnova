import SiteFooter from "../components/SiteFooter";
import "./ComparisonPage.css";
import { useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import ArrowIcon from "../components/ArrowIcon";
import ContactSection from "../components/ContactSection";
import SiteHeader from "../components/SiteHeader";

import { comparisonMessage } from "../features/contact/links";
import { projects } from "../features/projects/catalog";
import {
  formatPriceRange,
  getProjectEstimate,
  getProjectParameters,
} from "../features/projects/estimates";
import { WALL_MATERIALS } from "../features/estimate/catalog";
import { formatDuration } from "../features/estimate/formatters";

import BackToCatalog from "../components/BackToCatalog";
import ProjectPitch from "../components/ProjectPitch";
import { type SelectionProps } from "../features/projects/catalogFilters";
export default function ComparisonPage({
  favoriteProjects,
  setComparisonIds,
}: Pick<SelectionProps, "favoriteProjects" | "setComparisonIds">) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const idsParam = searchParams.get("projects") ?? "";
  const ids = [...new Set(idsParam.split(","))]
    .filter((id) => projects.some((project) => project.number === id))
    .slice(0, 3);
  const comparedProjects = ids.map((id) => projects.find((project) => project.number === id)!);
  const comparisonHeadingRef = useRef<HTMLHeadingElement>(null);
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setComparisonIds(
      [...new Set(idsParam.split(","))].filter((id) => favoriteProjects.includes(id)).slice(0, 3),
    );
  }, [idsParam, favoriteProjects, setComparisonIds]);

  const updateSelection = (next: string[]) => {
    setComparisonIds(next.filter((id) => favoriteProjects.includes(id)));
    setSearchParams(next.length ? { projects: next.join(",") } : {}, {
      replace: true,
      state: location.state,
    });
    if (next.length) comparisonHeadingRef.current?.focus();
    else pageHeadingRef.current?.focus();
  };
  const removeComparison = (id: string) => updateSelection(ids.filter((current) => current !== id));

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="comparison-page section-wrap">
        <BackToCatalog />
        <p className="eyebrow">НАША ПОДБОРКА / СРАВНЕНИЕ</p>
        <h1 ref={pageHeadingRef} tabIndex={-1}>
          Сравнение домов
        </h1>
        <p className="comparison-page-lead">
          Сопоставьте стоимость, пространство и компромиссы выбранных концепций. Можно сравнить до
          трёх домов.
        </p>
        {comparedProjects.length > 0 ? (
          <section
            className="project-comparison"
            id="project-comparison"
            aria-labelledby="comparison-title"
          >
            <div className="comparison-heading">
              <h3 id="comparison-title" tabIndex={-1} ref={comparisonHeadingRef}>
                Сравнение проектов
              </h3>
              <button className="filter-reset" type="button" onClick={() => updateSelection([])}>
                Очистить сравнение
              </button>
            </div>
            {comparedProjects.length === 3 && (
              <div className="comparison-scroll-hint" id="comparison-scroll-hint">
                <span>Три проекта: прокрутите таблицу вправо, чтобы увидеть все колонки.</span>
                <div>
                  <button
                    type="button"
                    aria-label="Прокрутить таблицу влево"
                    onClick={() => tableRef.current?.scrollBy({ left: -260 })}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Прокрутить таблицу вправо"
                    onClick={() => tableRef.current?.scrollBy({ left: 260 })}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
            <div
              className="comparison-table-scroll"
              ref={tableRef}
              role="region"
              aria-label="Таблица сравнения проектов"
              aria-describedby={
                comparedProjects.length === 3 ? "comparison-scroll-hint" : undefined
              }
              tabIndex={0}
            >
              <table className="comparison-table">
                <caption>
                  {comparedProjects.length === 1
                    ? "Добавьте ещё один проект, чтобы сравнить параметры."
                    : "Сравните бюджет, удобство и компромиссы. Лучший дом зависит от задач вашей семьи."}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Параметр</th>
                    {comparedProjects.map((project) => (
                      <th scope="col" key={project.number}>
                        <Link
                          className="comparison-project-name"
                          to={`/projects/${project.number}`}
                        >
                          {project.name}
                        </Link>
                        <Link
                          className="comparison-calculate"
                          to={`/calculator?project=${project.number}`}
                          aria-label={`Рассчитать стоимость проекта ${project.name}`}
                        >
                          Рассчитать этот дом <ArrowIcon />
                        </Link>
                        <button
                          className="comparison-remove"
                          type="button"
                          aria-label={`Убрать из сравнения: ${project.name}`}
                          onClick={() => removeComparison(project.number)}
                        >
                          Убрать ×
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="comparison-character-row">
                    <th scope="row">Почему выбирают этот дом</th>
                    {comparedProjects.map((project) => (
                      <td key={project.number}>
                        <details className="comparison-character-details">
                          <summary>{project.positioning.headline}</summary>
                          <ProjectPitch project={project} selection={comparedProjects} />
                        </details>
                      </td>
                    ))}
                  </tr>
                  <tr className="comparison-price-row">
                    <th scope="row">Ориентир под ключ</th>
                    {comparedProjects.map((project) => {
                      const estimate = getProjectEstimate(project);
                      const cheapest = Math.min(
                        ...comparedProjects.map((item) => getProjectEstimate(item).total),
                      );
                      return (
                        <td key={project.number}>
                          <strong>{formatPriceRange(estimate.minTotal, estimate.maxTotal)}</strong>
                          <small>
                            {comparedProjects.length < 2
                              ? "Добавьте ещё дом для сравнения бюджета"
                              : estimate.total === cheapest
                                ? "Минимальный бюджет среди выбранных"
                                : `Средний ориентир на ${Math.round((estimate.total / cheapest - 1) * 100)}% выше самого доступного из выбранных`}
                          </small>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <th scope="row">Цена за м²</th>
                    {comparedProjects.map((project) => {
                      const estimate = getProjectEstimate(project);
                      const money = (value: number) =>
                        Math.round(value / project.area).toLocaleString("ru-RU");
                      return (
                        <td key={project.number}>
                          {money(estimate.minTotal)}–{money(estimate.maxTotal)} ₽/м²
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <th scope="row">Площадь</th>
                    {comparedProjects.map((project) => (
                      <td key={project.number}>{project.area} м²</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Этажей</th>
                    {comparedProjects.map((project) => (
                      <td key={project.number}>{project.floors}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Спален</th>
                    {comparedProjects.map((project) => (
                      <td key={project.number}>{project.bedrooms}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Технология демо-расчёта</th>
                    {comparedProjects.map((project) => (
                      <td key={project.number}>
                        {WALL_MATERIALS[getProjectParameters(project).wallMaterial].label}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Ориентир по срокам</th>
                    {comparedProjects.map((project) => {
                      const { durationWeeks } = getProjectEstimate(project);
                      return (
                        <td key={project.number}>
                          {formatDuration(durationWeeks.min)}–{formatDuration(durationWeeks.max)}{" "}
                          нед.
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <th scope="row">Пятно застройки, примерно</th>
                    {comparedProjects.map((project) => (
                      <td key={project.number}>
                        ≈ {Math.round(project.area / project.floors)} м²
                        <small>
                          Площадь ÷ этажи, без террасы; не размеры фундамента по чертежу.
                        </small>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Кому подойдёт</th>
                    {comparedProjects.map((project) => (
                      <td key={project.number}>{project.audience}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Что учесть</th>
                    {comparedProjects.map((project) => (
                      <td key={project.number}>{project.tradeoff}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="comparison-mobile-list">
              {comparedProjects.map((project) => {
                const estimate = getProjectEstimate(project);
                return (
                  <article className="comparison-mobile-card" key={project.number}>
                    <div className="comparison-mobile-heading">
                      <h4>
                        <Link to={`/projects/${project.number}`}>{project.name}</Link>
                      </h4>
                      <button
                        className="comparison-remove"
                        type="button"
                        aria-label={`Убрать из сравнения: ${project.name}`}
                        onClick={() => removeComparison(project.number)}
                      >
                        Убрать ×
                      </button>
                    </div>
                    <p className="comparison-mobile-price">
                      <small>Ориентир под ключ</small>
                      <strong>{formatPriceRange(estimate.minTotal, estimate.maxTotal)}</strong>
                    </p>
                    <dl className="comparison-mobile-facts">
                      <div>
                        <dt>Площадь</dt>
                        <dd>{project.area} м²</dd>
                      </div>
                      <div>
                        <dt>Этажей</dt>
                        <dd>{project.floors}</dd>
                      </div>
                      <div>
                        <dt>Спален</dt>
                        <dd>{project.bedrooms}</dd>
                      </div>
                      <div>
                        <dt>Технология демо-расчёта</dt>
                        <dd>{WALL_MATERIALS[getProjectParameters(project).wallMaterial].label}</dd>
                      </div>
                      <div>
                        <dt>Ориентир по срокам</dt>
                        <dd>
                          {formatDuration(estimate.durationWeeks.min)}–
                          {formatDuration(estimate.durationWeeks.max)} нед.
                        </dd>
                      </div>
                    </dl>
                    <details className="comparison-project-details">
                      <summary>Характер проекта и подробности</summary>
                      <ProjectPitch project={project} selection={comparedProjects} />
                      <p>
                        Пятно застройки, примерно: ≈ {Math.round(project.area / project.floors)} м².
                        Площадь ÷ этажи, без террасы; не размеры фундамента по чертежу.
                      </p>
                      <p className="comparison-mobile-tradeoff">
                        <strong>Что учесть</strong>
                        {project.tradeoff}
                      </p>
                    </details>
                    <Link
                      className="comparison-calculate"
                      to={`/calculator?project=${project.number}`}
                      aria-label={`Рассчитать стоимость проекта ${project.name}`}
                    >
                      Рассчитать этот дом <ArrowIcon />
                    </Link>
                  </article>
                );
              })}
            </div>
            <p className="catalog-price-note">
              Вилки рассчитаны той же демонстрационной моделью, что и калькулятор: типовой проект,
              базовый регион без доставки, общая комплектация и все восемь этапов. Переход к расчёту
              открывает выбранный дом с этими параметрами. Это предварительные ориентиры, не
              коммерческие предложения.
            </p>
          </section>
        ) : (
          <div className="comparison-page-empty">
            <h2>Пока нет домов для сравнения</h2>
            <p>
              Вернитесь в избранное: сохраните 2–3 дома или выберите до трёх из более длинного
              списка.
            </p>
            <Link className="button button-primary" to="/projects">
              Выбрать проекты <ArrowIcon />
            </Link>
          </div>
        )}
        {comparedProjects.length > 0 && (
          <ContactSection
            title="Нужна помощь с выбором?"
            description="В письмо и Telegram попадут названия выбранных концепций. Отправку вы подтвердите самостоятельно."
            subject="ОСНОВА — помощь с выбором дома"
            message={comparisonMessage(comparedProjects)}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
