import { useEffect, useRef, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import HouseFinder from "./features/finder/HouseFinder";
import SiteHeader from "./components/SiteHeader";
import ArrowIcon from "./components/ArrowIcon";
import ContactSection from "./components/ContactSection";
import RouteScrollManager from "./components/RouteScrollManager";
import "./App.css";
import EstimateCalculator from "./features/estimate/EstimateCalculator";
import OsnovaSelect from "./components/OsnovaSelect";
import {
  DEFAULT_HOUSE_PARAMETERS,
  DEMO_ESTIMATE_DATA,
  WALL_MATERIALS,
} from "./features/estimate/catalog";
import type { HouseParameters } from "./features/estimate/types";
import { projects, type Project } from "./features/projects/catalog";
import {
  FAVORITES_STORAGE_KEY,
  readFavoriteIds,
  writeFavoriteIds,
} from "./features/projects/favorites";
import { comparisonMessage } from "./features/contact/links";
import {
  formatPriceRange,
  getProjectAdvantages,
  getProjectEstimate,
  getProjectParameters,
  getProjectValueContext,
} from "./features/projects/estimates";

function ProjectPitch({ project, selection }: { project: Project; selection: readonly Project[] }) {
  const valueContext = getProjectValueContext(project, selection);
  return (
    <div className="project-pitch">
      <span className="comparison-concept-label">ХАРАКТЕР ПРОЕКТА</span>
      <h4>{project.positioning.headline}</h4>
      <p>{project.positioning.story}</p>
      <ul className="comparison-benefits">
        {project.positioning.benefits.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>
      {selection.length > 1 && (
        <div className="comparison-selection-note">
          <strong>На фоне выбранных домов</strong>
          <ul className="comparison-benefits">
            {getProjectAdvantages(project, selection).map((advantage) => (
              <li key={advantage}>{advantage}</li>
            ))}
          </ul>
        </div>
      )}
      {valueContext && <p className="comparison-value-context">{valueContext}</p>}
    </div>
  );
}

type HouseCardProps = {
  project: Project;
  favorite: boolean;
  compared: boolean;
  showCompareControl: boolean;
  compareDisabled: boolean;
  onFavorite: () => void;
  onCompare: () => void;
  onCalculate: () => void;
};

function HouseCard({
  project,
  favorite,
  compared,
  showCompareControl,
  compareDisabled,
  onFavorite,
  onCompare,
  onCalculate,
}: HouseCardProps) {
  const estimate = getProjectEstimate(project);
  return (
    <article className="project-card" id={`project-${project.number}`}>
      <div className="project-image-wrap">
        <Link
          className="project-image-link"
          to={`/projects/${project.number}`}
          state={{ fromCatalog: true }}
          aria-label={`Открыть проект ${project.name}`}
        >
          <img
            className="project-image"
            src={project.image}
            alt={`Иллюстративное фото экстерьера для проекта «${project.name}»`}
            loading="lazy"
          />
          <span className="project-arrow" aria-hidden="true">
            <ArrowIcon />
          </span>
        </Link>
        <button
          className={`project-favorite ${favorite ? "is-favorite" : ""}`}
          type="button"
          aria-label={`${favorite ? "Убрать из избранного" : "Добавить в избранное"}: ${project.name}`}
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          <svg
            className="project-favorite-icon"
            viewBox="0 0 24 24"
            fill={favorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </button>
      </div>
      <div className="project-info">
        <div>
          <h3>
            <Link
              className="project-detail-link"
              to={`/projects/${project.number}`}
              state={{ fromCatalog: true }}
            >
              {project.name}
            </Link>
          </h3>
          <p>{project.description}</p>
        </div>
        <div className="project-price">
          <small>Ориентир под ключ</small>
          <strong>{formatPriceRange(estimate.minTotal, estimate.maxTotal)}</strong>
        </div>
        <p className="project-audience">{project.audience}</p>
        <div className="project-meta">
          <span>{project.area} м²</span>
          <span>
            {project.floors} {project.floors === 1 ? "этаж" : "этажа"}
          </span>
          <span>
            {project.bedrooms}{" "}
            {project.bedrooms === 1 ? "спальня" : project.bedrooms < 5 ? "спальни" : "спален"}
          </span>
        </div>
        <div className="project-card-actions">
          <a
            className="project-calculate-link"
            href="#calculator"
            onClick={onCalculate}
            aria-label={`Рассчитать стоимость проекта ${project.name}`}
          >
            Рассчитать <ArrowIcon />
          </a>
          {showCompareControl && (
            <button
              className="project-compare-toggle"
              type="button"
              aria-pressed={compared}
              aria-label={`Сравнить проект ${project.name}`}
              disabled={compareDisabled}
              onClick={onCompare}
            >
              {compared ? "Выбран ✓" : "Выбрать для сравнения"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

type SelectionProps = {
  favoriteProjects: string[];
  setFavoriteProjects: React.Dispatch<React.SetStateAction<string[]>>;
  showFavorites: boolean;
  setShowFavorites: React.Dispatch<React.SetStateAction<boolean>>;
  comparisonIds: string[];
  setComparisonIds: React.Dispatch<React.SetStateAction<string[]>>;
  catalogFilters: CatalogFilters;
  setCatalogFilters: React.Dispatch<React.SetStateAction<CatalogFilters>>;
};

type CatalogFilters = { area: string; floors: string; bedrooms: string; price: string };
const defaultCatalogFilters: CatalogFilters = {
  area: "all",
  floors: "all",
  bedrooms: "all",
  price: "all",
};

const comparisonUrl = (ids: readonly string[]) => `/compare?projects=${ids.join(",")}`;

function HomePage({
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
  const [houseParameters, setHouseParameters] = useState<HouseParameters>(() =>
    startingProject ? getProjectParameters(startingProject) : { ...DEFAULT_HOUSE_PARAMETERS },
  );
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(
    () => startingProject?.name ?? null,
  );
  const calculatorRef = useRef<HTMLElement>(null);

  const selectProject = (project: Project) => {
    setHouseParameters((current) => ({
      ...current,
      projectType: "standard",
      area: project.area,
      floors: project.floors,
      bedrooms: project.bedrooms,
      // В каталоге нет планов: оцениваем периметр квадратной застройки.
      perimeter: Math.round(4 * Math.sqrt(project.area / project.floors)),
    }));
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
            <p className="section-intro">
              Выберите отправную точку. Каждый проект можно адаптировать под ваши задачи, участок и
              бюджет.
            </p>
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
          />
        </section>
        <ContactSection
          id="contacts"
          title="Есть вопрос о проекте?"
          description="Напишите автору портфолио. Можно обсудить выбор концепции или демонстрационный расчёт."
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

function BackToCatalog() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <Link
      className="project-detail-back"
      to="/#projects"
      onClick={(event) => {
        if (
          location.state?.fromCatalog &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          navigate(-1);
        }
      }}
    >
      <ArrowIcon direction="left" /> К подборке проектов
    </Link>
  );
}

function ComparisonPage({
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
            <div
              className="comparison-table-scroll"
              role="region"
              aria-label="Таблица сравнения проектов"
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
                        <strong className="comparison-project-name">{project.name}</strong>
                        <Link
                          className="comparison-calculate"
                          to={`/?project=${project.number}#calculator`}
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
                        <ProjectPitch project={project} selection={comparedProjects} />
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
                      <h4>{project.name}</h4>
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
                    <ProjectPitch project={project} selection={comparedProjects} />
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
                        <dt>Пятно застройки, примерно</dt>
                        <dd>≈ {Math.round(project.area / project.floors)} м²</dd>
                      </div>
                    </dl>
                    <p className="comparison-mobile-tradeoff">
                      <strong>Что учесть</strong>
                      {project.tradeoff}
                    </p>
                    <Link
                      className="comparison-calculate"
                      to={`/?project=${project.number}#calculator`}
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
            <Link className="button button-primary" to="/#projects">
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
    </div>
  );
}

function ProjectPage() {
  const { id } = useParams();
  const project = projects.find((item) => item.number === id);

  if (!project) {
    return (
      <div className="site-shell">
        <SiteHeader />
        <main className="project-not-found">
          <p className="eyebrow">ПРОЕКТ НЕ НАЙДЕН</p>
          <h1>Такого дома в подборке нет.</h1>
          <Link className="button button-primary" to="/#projects">
            Вернуться к проектам <ArrowIcon />
          </Link>
        </main>
      </div>
    );
  }

  const parameters = getProjectParameters(project);
  const estimate = getProjectEstimate(project);
  const includedStages = estimate.stages.filter((stage) => stage.included);
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="project-detail">
        <BackToCatalog />
        <header className="project-detail-head">
          <p className="eyebrow">ТИПОВОЙ ПРОЕКТ / {project.number}</p>
          <h1>{project.name}</h1>
          <p className="project-detail-lead">{project.description}</p>
          <div className="project-detail-facts">
            <span>{project.area} м²</span>
            <span>
              {project.floors} {project.floors === 1 ? "этаж" : "этажа"}
            </span>
            <span>
              {project.bedrooms}{" "}
              {project.bedrooms === 1 ? "спальня" : project.bedrooms < 5 ? "спальни" : "спален"}
            </span>
          </div>
        </header>
        <img
          className="project-detail-image"
          src={project.image}
          alt={`Иллюстративное фото экстерьера для проекта «${project.name}»`}
        />
        <div className="project-detail-content">
          <section>
            <p className="eyebrow">ИДЕЯ ДОМА</p>
            <h2>{project.positioning.headline}</h2>
            <p>{project.positioning.story}</p>
            <ul>
              {project.positioning.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>
          <aside>
            <h2>Кому подойдёт</h2>
            <p>{project.audience}</p>
            <h2>Что учесть</h2>
            <p>{project.tradeoff}</p>
            <p className="project-detail-note">
              Это концепция для портфолио. Иллюстрация не показывает построенный объект, а рабочие
              планы ещё не разработаны.
            </p>
          </aside>
        </div>
        <section className="project-detail-section" aria-labelledby="project-scenarios-title">
          <p className="eyebrow">СЦЕНАРИИ ЖИЗНИ</p>
          <h2 id="project-scenarios-title">Как можно использовать этот дом</h2>
          <div className="project-detail-scenarios">
            {project.scenarios.map((scenario, index) => (
              <div className="project-detail-scenario" key={scenario}>
                <span>0{index + 1}</span>
                <p>{scenario}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="project-detail-section" aria-labelledby="project-materials-title">
          <p className="eyebrow">МАТЕРИАЛЫ И КОМПЛЕКТАЦИЯ</p>
          <h2 id="project-materials-title">База для примерного расчёта</h2>
          <p className="project-detail-intro">
            Для всех домов каталога используется одна демонстрационная комплектация. Так проще
            сравнивать их по площади и бюджету; окончательные решения принимаются после изучения
            участка и разработки проекта.
          </p>
          <div className="project-detail-specs">
            <div>
              <small>Стены</small>
              <strong>{WALL_MATERIALS[parameters.wallMaterial].label}</strong>
              <p>Конструкция и толщина уточняются проектировщиком.</p>
            </div>
            <div>
              <small>Фундамент</small>
              <strong>Ленточный</strong>
              <p>Тип основания нужно проверить по грунту и нагрузкам.</p>
            </div>
            <div>
              <small>Кровля</small>
              <strong>Металлочерепица</strong>
              <p>Форма, узлы и производитель пока не определены.</p>
            </div>
            <div>
              <small>Отделка</small>
              <strong>Стандартная</strong>
              <p>Это уровень демо-модели, без перечня марок и изделий.</p>
            </div>
          </div>
          <p className="project-detail-caveat">
            В расчёте также приняты два санузла, высота стен {parameters.wallHeight} м и условный
            периметр {parameters.perimeter} м. Эти параметры можно изменить в калькуляторе. Террасы,
            индивидуальная документация и особенности участка в общей цене каталога не учтены.
          </p>
        </section>
        <section className="project-detail-section" aria-labelledby="project-steps-title">
          <p className="eyebrow">ЭТАПЫ И СРОКИ</p>
          <h2 id="project-steps-title">Что входит в демонстрационный сценарий</h2>
          <p className="project-detail-intro">
            Ориентиры по этапам взяты из той же модели, что и калькулятор. Они не являются графиком
            строительства конкретного дома.
          </p>
          <ol className="project-detail-stages">
            {includedStages.map((stage) => (
              <li key={stage.id}>
                <span>{stage.name}</span>
                <small>
                  {stage.durationWeeks.min}–{stage.durationWeeks.max} нед.
                </small>
              </li>
            ))}
          </ol>
          <p className="project-detail-caveat">
            Общий диапазон модели: {estimate.durationWeeks.min}–{estimate.durationWeeks.max}{" "}
            календарных недель. Подготовка рабочей документации, обследование участка,
            разрешительные процедуры и возможные паузы в него не входят.
          </p>
        </section>
        <section
          className="project-detail-section project-detail-warranty"
          aria-labelledby="project-warranty-title"
        >
          <p className="eyebrow">ГАРАНТИИ И ДОКУМЕНТЫ</p>
          <h2 id="project-warranty-title">Условия определяются для реального строительства</h2>
          <p>
            У демонстрационного проекта нет утверждённого гарантийного срока или договора. Перед
            заключением реального договора нужно согласовать состав работ, материалы, сроки, порядок
            приёмки и гарантийные обязательства по видам работ. Пока эти условия не определены, сайт
            не обещает конкретную гарантию.
          </p>
        </section>
        <section
          className="project-detail-section project-detail-final"
          aria-labelledby="project-price-title"
        >
          <div>
            <p className="eyebrow">СТОИМОСТЬ И СЛЕДУЮЩИЙ ШАГ</p>
            <h2 id="project-price-title">Оцените проект под свой участок и задачи</h2>
            <p>
              Ниже — демонстрационный ориентир для общей комплектации каталога. В калькуляторе можно
              поменять материалы, регион, доставку и состав этапов.
            </p>
          </div>
          <div className="project-detail-price">
            <small>Ориентир под ключ · демо</small>
            <strong>{formatPriceRange(estimate.minTotal, estimate.maxTotal)}</strong>
            <p>
              Средний ориентир: {Math.round(estimate.total).toLocaleString("ru-RU")} ₽. Срок модели:{" "}
              {estimate.durationWeeks.min}–{estimate.durationWeeks.max} календарных недель.
            </p>
            <p>
              Версия расчёта {estimate.dataVersion} от {estimate.dataUpdatedAt}. Это не смета и не
              коммерческое предложение.
            </p>
            <Link className="button button-primary" to={`/?project=${project.number}#calculator`}>
              Рассчитать этот дом <ArrowIcon />
            </Link>
          </div>
        </section>
        <ContactSection
          title={`Обсудить «${project.name}»`}
          description="Можно уточнить идею дома и возможности дальнейшей проработки. Это портфолио-концепция, а не готовый договор строительства."
          subject={`ОСНОВА — проект «${project.name}»`}
          message={`Хочу обсудить концепцию дома «${project.name}» (${project.area} м², проект ${project.number}).`}
        />
      </main>
    </div>
  );
}

function App() {
  const [favoriteProjects, setFavoriteProjects] = useState<string[]>(() =>
    readFavoriteIds(window.localStorage),
  );
  const [showFavorites, setShowFavorites] = useState(false);
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(defaultCatalogFilters);

  useEffect(() => {
    writeFavoriteIds(window.localStorage, favoriteProjects);
  }, [favoriteProjects]);

  useEffect(() => {
    const syncFavorites = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY)
        setFavoriteProjects(readFavoriteIds(window.localStorage));
    };
    window.addEventListener("storage", syncFavorites);
    return () => window.removeEventListener("storage", syncFavorites);
  }, []);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  return (
    <>
      <RouteScrollManager />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              favoriteProjects={favoriteProjects}
              setFavoriteProjects={setFavoriteProjects}
              showFavorites={showFavorites}
              setShowFavorites={setShowFavorites}
              comparisonIds={comparisonIds}
              setComparisonIds={setComparisonIds}
              catalogFilters={catalogFilters}
              setCatalogFilters={setCatalogFilters}
            />
          }
        />
        <Route
          path="/compare"
          element={
            <ComparisonPage
              favoriteProjects={favoriteProjects}
              setComparisonIds={setComparisonIds}
            />
          }
        />
        <Route path="/find-home" element={<HouseFinder />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route
          path="*"
          element={
            <div className="site-shell">
              <SiteHeader />
              <main className="project-not-found">
                <h1>Страница не найдена.</h1>
                <Link to="/">На главную</Link>
              </main>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;
