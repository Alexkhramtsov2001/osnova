import { DEMO_ESTIMATE_DATA } from "../features/estimate/catalog";
import "./HomePage.css";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { demoAccountPath, readDemoProfile, readDemoSession } from "../features/account/demoSession";
import ArrowIcon from "../components/ArrowIcon";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

import OsnovaSelect from "../components/OsnovaSelect";

import { projects, type Project } from "../features/projects/catalog";
import { getProjectEstimate } from "../features/projects/estimates";

import HouseCard from "../components/HouseCard";
import {
  comparisonUrl,
  defaultCatalogFilters,
  type SelectionProps,
} from "../features/projects/catalogFilters";

export default function ProjectsPage({
  favoriteProjects,
  setFavoriteProjects,
  showFavorites,
  setShowFavorites,
  comparisonIds,
  setComparisonIds,
  catalogFilters,
  setCatalogFilters,
}: SelectionProps) {
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = Object.values(catalogFilters).filter((value) => value !== "all").length;
  const priceExplanation = (
    <>
      Цены под ключ для типового проекта в общей демо-комплектации: газобетон, ленточный фундамент,
      металлочерепица, стандартная отделка, 2 санузла и все 8 этапов работ. Фильтр бюджета
      использует средний ориентир этой вилки. В ценах каталога выбран базовый регион без доставки;
      эти параметры можно изменить в калькуляторе. Проекты и фотографии — концепты для портфолио,
      рабочие планировки не разработаны. Версия данных: {DEMO_ESTIMATE_DATA.version} от{" "}
      {DEMO_ESTIMATE_DATA.updatedAt.split("-").reverse().join(".")}.
    </>
  );
  const { state } = useLocation();
  const selectProject = (project: Project) => {
    const target = `/calculator?project=${project.number}`;
    if (!readDemoSession(window.sessionStorage)) {
      navigate(
        demoAccountPath(target, readDemoProfile(window.localStorage) ? "login" : "register"),
      );
      return;
    }
    navigate(target, { state: { fromCatalog: true } });
  };
  const {
    area: areaFilter,
    floors: floorsFilter,
    bedrooms: bedroomsFilter,
    price: priceFilter,
  } = catalogFilters;
  const catalogResultsRef = useRef<HTMLDivElement>(null);
  const [favoriteNotice, setFavoriteNotice] = useState<{ name: string; added: boolean } | null>(
    () =>
      typeof state?.favoriteAdded === "string" ? { name: state.favoriteAdded, added: true } : null,
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
    if (!readDemoSession(window.sessionStorage)) {
      navigate(
        demoAccountPath(
          `/projects?favorite=${project.number}`,
          readDemoProfile(window.localStorage) ? "login" : "register",
        ),
      );
      return;
    }
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
      <SiteHeader />{" "}
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
        {" "}
        <section className="projects-section section-wrap" id="projects">
          <div className="section-heading">
            <div>
              <h1>
                Пространство
                <br />
                <span>для вашей жизни.</span>
              </h1>
            </div>
          </div>

          {!showFavorites && (
            <div className="catalog-filter-panel" data-open={filtersOpen}>
              <div className="catalog-filter-toolbar">
                <button
                  className="button button-secondary"
                  type="button"
                  aria-expanded={filtersOpen}
                  aria-controls="catalog-filters"
                  onClick={() => setFiltersOpen((current) => !current)}
                >
                  Фильтры{activeFilterCount > 0 && ` (${activeFilterCount})`}
                  <ArrowIcon direction={filtersOpen ? "up" : "down"} />
                </button>
                {activeFilterCount > 0 && !filtersOpen && (
                  <button className="filter-reset" type="button" onClick={resetFilters}>
                    Сбросить
                  </button>
                )}
              </div>
              <div className="project-filters" id="catalog-filters" aria-label="Фильтры проектов">
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
            <Link className="catalog-account-link" to="/account">
              Открыть подборку в демо-кабинете <ArrowIcon />
            </Link>
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
          <p className="catalog-price-note catalog-price-desktop">{priceExplanation}</p>
          <div className="catalog-price-mobile catalog-price-note">
            <p>
              Приблизительные цены под ключ для демо-комплектации. Не оферта. Проекты — концепции.
            </p>
            <details>
              <summary>Комплектация и допущения</summary>
              <p>{priceExplanation}</p>
            </details>
          </div>

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
      </main>
      <SiteFooter />
    </div>
  );
}
