import { useRef, useState } from "react";
import type { Project } from "../features/projects/catalog";
import { getProjectFloorPlans } from "../features/projects/floorPlans";
import ImageViewer, { type ViewerImage } from "./ImageViewer";
import ArrowIcon from "./ArrowIcon";
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
      </button>
      {image && <ImageViewer image={image} onClose={() => setImage(null)} />}
    </>
  );
}

export function ProjectFloorPlans({ project }: { project: Project }) {
  const plans = getProjectFloorPlans(project);
  const [floor, setFloor] = useState(0);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [image, setImage] = useState<ViewerImage | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
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
            <ArrowIcon direction="left" />
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
            <ArrowIcon direction="left" className="floor-plan-next-arrow" />
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label={`Увеличить планировку проекта ${project.name}, ${plan.floor} этаж`}
        onClick={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault();
            return;
          }
          setImage({
            src: plan.src,
            alt: plan.alt,
            title: `${project.name} · ${plan.floor} этаж · демонстрационная схема`,
          });
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") suppressClick.current = false;
        }}
        className="floor-plan-stage"
        onTouchStart={(event) => {
          const point = event.touches.length === 1 ? event.touches[0] : null;
          suppressClick.current = false;
          touch.current = point ? { x: point.clientX, y: point.clientY } : null;
        }}
        onTouchCancel={() => {
          touch.current = null;
          suppressClick.current = true;
        }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          const end = event.changedTouches[0];
          if (!start || !end) return;
          const dx = end.clientX - start.x;
          const dy = end.clientY - start.y;
          suppressClick.current = Math.abs(dx) > 10 || Math.abs(dy) > 10;
          if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.6)
            changeFloor(floor + (dx < 0 ? 1 : -1));
        }}
      >
        <img key={plan.src} src={plan.src} alt={plan.alt} draggable={false} />
      </button>
      <div className="floor-plan-disclosure" data-open={roomsOpen}>
        <button
          className="floor-plan-rooms-toggle"
          type="button"
          aria-expanded={roomsOpen}
          aria-controls="floor-plan-rooms-panel"
          onClick={() => setRoomsOpen((open) => !open)}
        >
          <span>Помещения на этаже</span>
          <ArrowIcon direction="chevron-down" />
        </button>
        <div
          id="floor-plan-rooms-panel"
          className="floor-plan-rooms-panel"
          aria-hidden={!roomsOpen}
          inert={!roomsOpen}
        >
          <div className="floor-plan-rooms-inner">
            <ul className="floor-plan-rooms">
              {plan.rooms.map((room) => (
                <li key={room}>{room}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {image && <ImageViewer image={image} onClose={() => setImage(null)} />}
    </section>
  );
}
