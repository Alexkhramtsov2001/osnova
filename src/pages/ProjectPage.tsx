import "./ProjectPage.css";
import { Link, useParams } from "react-router";
import ArrowIcon from "../components/ArrowIcon";
import ContactSection from "../components/ContactSection";
import SiteHeader from "../components/SiteHeader";

import { WALL_MATERIALS } from "../features/estimate/catalog";
import { projects } from "../features/projects/catalog";
import {
  formatPriceRange,
  getProjectEstimate,
  getProjectParameters,
} from "../features/projects/estimates";

import BackToCatalog from "../components/BackToCatalog";
export default function ProjectPage() {
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
