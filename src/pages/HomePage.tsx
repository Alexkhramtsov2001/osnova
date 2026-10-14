import "./HomePage.css";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigationType } from "react-router";
import { normalizeForArea } from "../features/estimate/constraints";
import { readCalculatorDraft, type CalculatorDraft } from "../features/estimate/calculatorDraft";
import { DEMO_ESTIMATE_CATALOG } from "../features/estimate/catalog";
import ArrowIcon from "../components/ArrowIcon";
import ContactSection from "../components/ContactSection";
import SiteHeader from "../components/SiteHeader";

import OsnovaSelect from "../components/OsnovaSelect";
import { DEFAULT_HOUSE_PARAMETERS, DEMO_ESTIMATE_DATA } from "../features/estimate/catalog";
import EstimateCalculator from "../features/estimate/EstimateCalculator";
import type { HouseParameters } from "../features/estimate/types";
import { projects, type Project } from "../features/projects/catalog";
import { getProjectEstimate, getProjectParameters } from "../features/projects/estimates";

import HouseCard from "../components/HouseCard";
import {
  comparisonUrl,
  defaultCatalogFilters,
  type SelectionProps,
} from "../features/projects/catalogFilters";
export default function HomePage({
  favoriteProjects,
  setFavoriteProjects,
  showFavorites,
  setShowFavorites,
  comparisonIds,
  setComparisonIds,
  catalogFilters,
  setCatalogFilters,
}: SelectionProps) {
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroHovered, setHeroHovered] = useState(false);
  const [heroFocused, setHeroFocused] = useState(false);
  const heroTouchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressHeroLinkClick = useRef(false);
  const featuredProject = projects[heroSlide];

  useEffect(() => {
    if (heroHovered || heroFocused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setHeroSlide((current) => (current + 1) % projects.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroSlide, heroHovered, heroFocused]);

  const showHeroSlide = (index: number) => {
    setHeroSlide((index + projects.length) % projects.length);
  };

  const {
    area: areaFilter,
    floors: floorsFilter,
    bedrooms: bedroomsFilter,
    price: priceFilter,
  } = catalogFilters;
  const startingProject = projects.find(
    (project) => project.number === new URLSearchParams(window.location.search).get("project"),
  );
  const navigationType = useNavigationType();
  const [initialDraft] = useState<CalculatorDraft>(() => {
    let draft: CalculatorDraft | null = null;
    try {
      draft = readCalculatorDraft(window.sessionStorage);
    } catch {
      /* Хранилище может быть недоступно. */
    }
    if (
      draft &&
      (!startingProject ||
        (navigationType === "POP" && draft.sourceProjectNumber === startingProject.number))
    )
      return draft;
    return {
      parameters: startingProject
        ? getProjectParameters(startingProject)
        : { ...DEFAULT_HOUSE_PARAMETERS },
      projectName: startingProject?.name ?? null,
      sourceProjectNumber: startingProject?.number ?? null,
      mode: "turnkey",
      stageIds: DEMO_ESTIMATE_CATALOG.map((stage) => stage.id),
    };
  });
  const [houseParameters, setHouseParameters] = useState<HouseParameters>(initialDraft.parameters);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(
    initialDraft.projectName,
  );
  const calculatorRef = useRef<HTMLElement>(null);

  const selectProject = (project: Project) => {
    setHouseParameters((current) =>
      normalizeForArea({
        ...current,
        projectType: "standard",
        area: project.area,
        floors: project.floors,
        bedrooms: project.bedrooms,
        // В каталоге нет планов: оцениваем периметр квадратной застройки.
        perimeter: Math.ceil(4 * Math.sqrt(project.area / project.floors)),
      }),
    );
    setSelectedProjectName(project.name);
    calculatorRef.current?.focus({ preventScroll: true });
  };

  const resetHouseParameters = () => {
    setHouseParameters({ ...DEFAULT_HOUSE_PARAMETERS });
    setSelectedProjectName(null);
  };
  const updateHouseParameters = (next: HouseParameters) => {
    setHouseParameters(next);
    if (next.projectType !== "standard") setSelectedProjectName(null);
  };
  const restoreHouseParameters = (next: HouseParameters, projectName: string | null) => {
    setHouseParameters(next);
    setSelectedProjectName(projectName);
    calculatorRef.current?.focus({ preventScroll: true });
  };
  const catalogResultsRef = useRef<HTMLDivElement>(null);
  const [favoriteNotice, setFavoriteNotice] = useState<{ name: string; added: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (!favoriteNotice) return;
    const timer = window.setTimeout(() => setFavoriteNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [favoriteNotice]);

  const toggleComparison = (projectNumber: string) => {
    setComparisonIds((current) =>
      current.includes(projectNumber)
        ? current.filter((id) => id !== projectNumber)
        : current.length < 3
          ? [...current, projectNumber]
          : current,
    );
  };

  const filteredProjects = projects.filter((project) => {
    const matchesArea =
      areaFilter === "all" ||
      (areaFilter === "under100" && project.area < 100) ||
      (areaFilter === "100-150" && project.area >= 100 && project.area <= 150) ||
      (areaFilter === "150-200" && project.area > 150 && project.area <= 200) ||
      (areaFilter === "over200" && project.area > 200);

    const matchesFloors = floorsFilter === "all" || project.floors === Number(floorsFilter);

    const matchesBedrooms = bedroomsFilter === "all" || project.bedrooms === Number(bedroomsFilter);

    const price = getProjectEstimate(project).total;
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "under9" && price <= 9_000_000) ||
      (priceFilter === "9-12" && price > 9_000_000 && price <= 12_000_000) ||
      (priceFilter === "over12" && price > 12_000_000);

    const matchesFavorites = !showFavorites || favoriteProjects.includes(project.number);

    return showFavorites
      ? matchesFavorites
      : matchesArea && matchesFloors && matchesBedrooms && matchesPrice;
  });

  const toggleFavorite = (project: Project) => {
    const added = !favoriteProjects.includes(project.number);
    setFavoriteProjects((current) =>
      added ? [...current, project.number] : current.filter((number) => number !== project.number),
    );
    if (!added) setComparisonIds((current) => current.filter((id) => id !== project.number));
    setFavoriteNotice({ name: project.name, added });
  };

  const resetFilters = () => {
    setCatalogFilters(defaultCatalogFilters);
  };

  return (
    <div className="site-shell">
      <SiteHeader home />
      {favoriteNotice && (
        <div className="favorite-toast" role="status">
          <span>
            «{favoriteNotice.name}»{" "}
            {favoriteNotice.added ? "добавлен в избранное" : "убран из избранного"}.
          </span>
          {favoriteNotice.added && (
            <a href="#projects" onClick={() => setShowFavorites(true)}>
              Показать избранное <ArrowIcon />
            </a>
          )}
        </div>
      )}

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              СТРОИТЕЛЬСТВО ЗАГОРОДНЫХ ДОМОВ
            </p>

            <h1>
              Дом начинается
              <br />
              <span>с основы.</span>
            </h1>

            <p className="hero-description">
              Проектируем и строим современные дома, в которых продумана каждая деталь — от
              фундамента до последнего штриха.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="#calculator">
                Рассчитать стоимость <ArrowIcon />
              </a>
              <a className="button button-secondary" href="#projects">
                Смотреть проекты <ArrowIcon direction="down" />
              </a>
            </div>

            <div className="hero-note">
              <span className="hero-note-line" />
              <p>Понятная смета. Продуманный результат.</p>
            </div>
          </div>

          <div
            className="hero-visual"
            aria-label="Готовые варианты домов"
            onMouseEnter={() => setHeroHovered(true)}
            onMouseLeave={() => setHeroHovered(false)}
            onFocusCapture={() => setHeroFocused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setHeroFocused(false);
            }}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              heroTouchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
              suppressHeroLinkClick.current = false;
            }}
            onTouchEnd={(event) => {
              const start = heroTouchStart.current;
              const touch = event.changedTouches[0];
              heroTouchStart.current = null;
              if (!start || !touch) return;
              const deltaX = touch.clientX - start.x;
              const deltaY = touch.clientY - start.y;
              if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
              suppressHeroLinkClick.current = true;
              showHeroSlide(heroSlide + (deltaX < 0 ? 1 : -1));
            }}
          >
            <a
              className="hero-image-link"
              href={`#project-${featuredProject.number}`}
              aria-label={`Смотреть проект ${featuredProject.name} в каталоге`}
              onClick={(event) => {
                if (suppressHeroLinkClick.current) event.preventDefault();
                suppressHeroLinkClick.current = false;
              }}
            >
              <img
                key={featuredProject.number}
                className="hero-image"
                src={featuredProject.image}
                alt={`Иллюстративное фото экстерьера для проекта «${featuredProject.name}»`}
                fetchPriority={heroSlide === 0 ? "high" : "auto"}
              />
            </a>
            <button
              className="hero-side-arrow hero-side-arrow-prev"
              type="button"
              aria-label="Предыдущий проект"
              onClick={() => showHeroSlide(heroSlide - 1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 4-8 8 8 8" />
              </svg>
            </button>
            <button
              className="hero-side-arrow hero-side-arrow-next"
              type="button"
              aria-label="Следующий проект"
              onClick={() => showHeroSlide(heroSlide + 1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 4 8 8-8 8" />
              </svg>
            </button>
            <div className="image-label">
              <div className="hero-slide-caption" aria-live={heroFocused ? "polite" : "off"}>
                <a href={`#project-${featuredProject.number}`}>
                  Проект «{featuredProject.name}» <ArrowIcon />
                </a>
              </div>
            </div>
          </div>

          <div className="hero-bottom">
            <span>01 — ПРОЕКТИРУЕМ</span>
            <span>02 — РАССЧИТЫВАЕМ</span>
            <span>03 — СТРОИМ</span>
          </div>
        </section>

        <section className="projects-section section-wrap" id="projects">
          <div className="section-heading">
            <div>
              <p className="eyebrow">НАША ПОДБОРКА</p>
              <h2>
                Пространство
                <br />
                <span>для вашей жизни.</span>
              </h2>
            </div>
          </div>

          {!showFavorites && (
            <div className="project-filters" aria-label="Фильтры проектов">
              <div className="filter-field">
                <span>Площадь дома</span>
                <OsnovaSelect
                  ariaLabel="Площадь дома"
                  value={areaFilter}
                  onValueChange={(value) =>
                    setCatalogFilters((current) => ({ ...current, area: value }))
                  }
                  options={[
                    { value: "all", label: "Любая площадь" },
                    { value: "under100", label: "До 100 м²" },
                    { value: "100-150", label: "100–150 м²" },
                    { value: "150-200", label: "151–200 м²" },
                    { value: "over200", label: "Более 200 м²" },
                  ]}
                />
              </div>
              <div className="filter-field">
                <span>Этажность</span>
                <OsnovaSelect
                  ariaLabel="Этажность"
                  value={floorsFilter}
                  onValueChange={(value) =>
                    setCatalogFilters((current) => ({ ...current, floors: value }))
                  }
                  options={[
                    { value: "all", label: "Любая этажность" },
                    { value: "1", label: "1 этаж" },
                    { value: "2", label: "2 этажа" },
                  ]}
                />
              </div>
              <div className="filter-field">
                <span>Количество спален</span>
                <OsnovaSelect
                  ariaLabel="Количество спален"
                  value={bedroomsFilter}
                  onValueChange={(value) =>
                    setCatalogFilters((current) => ({ ...current, bedrooms: value }))
                  }
                  options={[
                    { value: "all", label: "Любое количество" },
                    { value: "2", label: "2 спальни" },
                    { value: "3", label: "3 спальни" },
                    { value: "4", label: "4 спальни" },
                    { value: "5", label: "5 спален" },
                  ]}
                />
              </div>
              <div className="filter-field">
                <span>Бюджет под ключ</span>
                <OsnovaSelect
                  ariaLabel="Бюджет под ключ"
                  value={priceFilter}
                  onValueChange={(value) =>
                    setCatalogFilters((current) => ({ ...current, price: value }))
                  }
                  options={[
                    { value: "all", label: "Любой бюджет" },
                    { value: "under9", label: "До 9 млн ₽" },
                    { value: "9-12", label: "9–12 млн ₽" },
                    { value: "over12", label: "Более 12 млн ₽" },
                  ]}
                />
              </div>

              <button className="filter-reset" type="button" onClick={resetFilters}>
                Сбросить
              </button>
            </div>
          )}

          <div className="projects-view-options">
            <button
              className="favorites-filter"
              type="button"
              aria-pressed={showFavorites}
              onClick={() => setShowFavorites((current) => !current)}
            >
              <span aria-hidden="true">♡</span>
              Избранное ({favoriteProjects.length})
            </button>
            <span>Список сохраняется в этом браузере</span>
          </div>

          {showFavorites && (
            <div className="favorites-workspace">
              <div>
                <h3>Ваши избранные дома</h3>
                <p>
                  {favoriteProjects.length === 0
                    ? "Добавьте понравившиеся дома сердцем на карточке."
                    : favoriteProjects.length === 1
                      ? "Добавьте ещё один дом, чтобы сравнить варианты."
                      : favoriteProjects.length <= 3
                        ? "Откройте сравнение выбранных домов."
                        : "Отметьте для сравнения два или три дома из списка ниже."}
                </p>
              </div>
              {favoriteProjects.length >= 2 && favoriteProjects.length <= 3 && (
                <Link
                  className="button button-primary"
                  to={comparisonUrl(favoriteProjects)}
                  state={{ fromCatalog: true }}
                  onClick={() => setComparisonIds([...favoriteProjects])}
                >
                  Сравнить {favoriteProjects.length} дома <ArrowIcon />
                </Link>
              )}
              {favoriteProjects.length > 3 && comparisonIds.length >= 2 && (
                <Link
                  className="button button-primary"
                  to={comparisonUrl(comparisonIds)}
                  state={{ fromCatalog: true }}
                >
                  Сравнить выбранные ({comparisonIds.length}/3) <ArrowIcon />
                </Link>
              )}
            </div>
          )}

          <div className="projects-count" aria-live="polite" tabIndex={-1} ref={catalogResultsRef}>
            {showFavorites ? "В избранном домов" : "Найдено проектов"}: {filteredProjects.length}
          </div>
          {showFavorites && favoriteProjects.length > 3 && (
            <p className="comparison-hint" aria-live="polite">
              Выбрано для сравнения: {comparisonIds.length} из 3.
            </p>
          )}
          <p className="catalog-price-note">
            Цены под ключ для типового проекта в общей демо-комплектации: газобетон, ленточный
            фундамент, металлочерепица, стандартная отделка, 2 санузла и все 8 этапов работ. Фильтр
            бюджета использует средний ориентир этой вилки. В ценах каталога выбран базовый регион
            без доставки; эти параметры можно изменить в калькуляторе. Проекты и фотографии —
            концепты для портфолио, рабочие планировки не разработаны. Версия данных:{" "}
            {DEMO_ESTIMATE_DATA.version} от{" "}
            {DEMO_ESTIMATE_DATA.updatedAt.split("-").reverse().join(".")}.
          </p>

          {filteredProjects.length > 0 ? (
            <div className="project-grid">
              {filteredProjects.map((project) => (
                <HouseCard
                  key={project.number}
                  project={project}
                  favorite={favoriteProjects.includes(project.number)}
                  compared={comparisonIds.includes(project.number)}
                  showCompareControl={showFavorites && favoriteProjects.length > 3}
                  compareDisabled={
                    comparisonIds.length === 3 && !comparisonIds.includes(project.number)
                  }
                  onFavorite={() => toggleFavorite(project)}
                  onCompare={() => toggleComparison(project.number)}
                  onCalculate={() => selectProject(project)}
                />
              ))}
            </div>
          ) : (
            <p className="projects-empty">
              {showFavorites && favoriteProjects.length === 0
                ? "В избранном пока пусто. Добавьте проект кнопкой с сердцем на карточке."
                : "По выбранным параметрам проектов пока нет. Попробуйте изменить фильтры или показать весь каталог."}
            </p>
          )}

          <div className="projects-footer">
            <p>Это лишь несколько идей. Подберём решение под ваши задачи.</p>
            <Link className="button button-primary house-finder-link" to="/find-home">
              Подобрать свой дом <ArrowIcon />
            </Link>
          </div>
        </section>

        <section className="approach-section" id="advantages">
          <div className="section-wrap approach-inner">
            <div>
              <p className="eyebrow">НАШ ПОДХОД</p>
              <h2>
                Меньше
                <br />
                неопределённости.
                <br />
                <span>Больше ясности.</span>
              </h2>
            </div>
            <div className="approach-points">
              <article>
                <span>01</span>
                <div>
                  <h3>Понятная смета</h3>
                  <p>
                    Разбираемся, из чего складывается стоимость строительства и какие решения влияют
                    на бюджет.
                  </p>
                </div>
              </article>
              <article>
                <span>02</span>
                <div>
                  <h3>Продуманные этапы</h3>
                  <p>Показываем последовательность работ и состав затрат по каждому этапу.</p>
                </div>
              </article>
              <article>
                <span>03</span>
                <div>
                  <h3>Выбор за вами</h3>
                  <p>
                    Сравнивайте материалы и комплектации, чтобы найти подходящий баланс стоимости и
                    характеристик.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          id="calculator"
          className="calculator-teaser"
          ref={calculatorRef}
          tabIndex={-1}
          aria-label="Расчёт стоимости"
        >
          <EstimateCalculator
            parameters={houseParameters}
            onParametersChange={updateHouseParameters}
            onRestore={restoreHouseParameters}
            projectName={selectedProjectName}
            onReset={resetHouseParameters}
            initialStageIds={initialDraft.stageIds}
            sourceProjectNumber={startingProject?.number ?? null}
            initialScope={
              initialDraft.mode === "turnkey"
                ? { mode: "turnkey" }
                : { mode: "stages", stageIds: initialDraft.stageIds }
            }
          />
        </section>
        <ContactSection
          id="contacts"
          title="Есть вопрос о проекте?"
          subject="ОСНОВА — вопрос о проекте"
        />
      </main>

      <footer className="site-footer">
        <div className="brand footer-brand">
          <span className="brand-mark" aria-hidden="true">
            О
          </span>
          <span className="brand-copy">
            <strong>ОСНОВА</strong>
            <small>СТРОИМ ДЛЯ ЖИЗНИ</small>
          </span>
        </div>
        <p>Демонстрационный проект строительной компании.</p>
        <a href="#home">
          Вернуться наверх <ArrowIcon direction="up" />
        </a>
      </footer>
    </div>
  );
}
