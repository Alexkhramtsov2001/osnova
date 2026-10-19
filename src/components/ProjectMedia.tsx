import { useRef, useState } from "react";
import type { Project } from "../features/projects/catalog";
import { getProjectFloorPlans } from "../features/projects/floorPlans";
import ImageViewer, { type ViewerImage } from "./ImageViewer";
import "./ProjectMedia.css";

export function ProjectPhoto({ project }: { project: Project }) {
  const [image, setImage] = useState<ViewerImage | null>(null);
  const alt = `Иллюстративное фото экстерьера для проекта «${project.name}»`;
  return (
    <>
      <button
        className="project-photo-open"
        type="button"
        aria-label={`Увеличить фото проекта ${project.name}`}
        onClick={() => setImage({ src: project.image, alt, title: project.name })}
      >
        <img className="project-detail-image" src={project.image} alt={alt} />
        <span className="project-photo-hint" aria-hidden="true">
          ↗ Увеличить фото
        </span>
      </button>
      {image && <ImageViewer image={image} onClose={() => setImage(null)} />}
    </>
  );
}

export function ProjectFloorPlans({ project }: { project: Project }) {
  const plans = getProjectFloorPlans(project);
  const [floor, setFloor] = useState(0);
  const [image, setImage] = useState<ViewerImage | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const plan = plans[floor];
  if (!plan) return null;
  const changeFloor = (next: number) => setFloor(Math.max(0, Math.min(plans.length - 1, next)));
  return (
    <section
      className="project-detail-section project-floor-plans"
      aria-labelledby="floor-plans-title"
    >
      <p className="eyebrow">ДЕМОНСТРАЦИОННЫЕ ПЛАНИРОВКИ</p>
      <h2 id="floor-plans-title">Планировки этажей</h2>
      <p className="floor-plans-notice">
        Условная компоновка для знакомства с домом, без масштаба. Положение стен, окон и лестницы не
        подтверждено проектированием и может отличаться от иллюстрации фасада. Это не рабочая
        документация; необходима проверка архитектором.
      </p>
      <div className="floor-plan-controls">
        {plans.length > 1 && (
          <button
            className="button button-secondary"
            type="button"
            aria-label="Предыдущий этаж"
            disabled={floor === 0}
            onClick={() => changeFloor(floor - 1)}
          >
            ←
          </button>
        )}
        <span role="status" aria-live="polite">
          {plans.length > 1 ? `Этаж ${floor + 1} из ${plans.length}` : "1 этаж"}
        </span>
        {plans.length > 1 && (
          <button
            className="button button-secondary"
            type="button"
            aria-label="Следующий этаж"
            disabled={floor === plans.length - 1}
            onClick={() => changeFloor(floor + 1)}
          >
            →
          </button>
        )}
      </div>
      <div
        className="floor-plan-stage"
        onTouchStart={(event) => {
          const point = event.touches.length === 1 ? event.touches[0] : null;
          touch.current = point ? { x: point.clientX, y: point.clientY } : null;
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          const end = event.changedTouches[0];
          if (!start || !end) return;
          const dx = end.clientX - start.x;
          const dy = end.clientY - start.y;
          if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.6)
            changeFloor(floor + (dx < 0 ? 1 : -1));
        }}
      >
        <img key={plan.src} src={plan.src} alt={plan.alt} draggable={false} />
      </div>
      <div className="floor-plan-caption">
        <p>Помещения на этаже</p>
        <button
          type="button"
          className="button button-secondary"
          onClick={() =>
            setImage({
              src: plan.src,
              alt: plan.alt,
              title: `${project.name} · ${plan.floor} этаж · демонстрационная схема`,
            })
          }
        >
          Увеличить план
        </button>
      </div>
      <ul className="floor-plan-rooms">
        {plan.rooms.map((room) => (
          <li key={room}>{room}</li>
        ))}
      </ul>
      {image && <ImageViewer image={image} onClose={() => setImage(null)} />}
    </section>
  );
}
