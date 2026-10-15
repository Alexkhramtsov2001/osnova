import { Link } from "react-router";
import ArrowIcon from "../components/ArrowIcon";

import { type Project } from "../features/projects/catalog";
import { formatPriceRange, getProjectEstimate } from "../features/projects/estimates";

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

export default function HouseCard({
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
          <Link
            className="project-calculate-link"
            to={`/calculator?project=${project.number}`}
            onClick={(event) => {
              if (
                event.button === 0 &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                onCalculate();
              }
            }}
            aria-label={`Рассчитать стоимость проекта ${project.name}`}
          >
            Рассчитать <ArrowIcon />
          </Link>
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
