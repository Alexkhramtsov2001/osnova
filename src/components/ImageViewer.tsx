import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { lockOverlayScroll } from "./overlayScroll";
import "./ImageViewer.css";

export type ViewerImage = { src: string; alt: string; title: string };
const limit = (value: number) => Math.max(1, Math.min(4, value));

export default function ImageViewer({
  image,
  onClose,
}: {
  image: ViewerImage;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ distance: number; scale: number } | null>(null);
  const dragged = useRef(false);
  useEffect(() => {
    const dialog = dialogRef.current!;
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlock = lockOverlayScroll();
    dialog.showModal();
    return () => {
      dialog.close();
      unlock();
      if (invoker?.isConnected) invoker.focus({ preventScroll: true });
    };
  }, []);
  const zoom = (next: number) => setView({ scale: limit(next), x: 0, y: 0 });
  const endPointer = (id: number) => {
    pointers.current.delete(id);
    gesture.current = null;
  };
  return createPortal(
    <dialog
      className="image-viewer"
      ref={dialogRef}
      aria-label={image.title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        className="image-viewer-close"
        type="button"
        onClick={onClose}
        aria-label="Закрыть просмотр изображения"
      >
        <span aria-hidden="true">×</span> Закрыть
      </button>
      <div className="image-viewer-tools" aria-label="Масштаб изображения">
        <button
          type="button"
          aria-label="Уменьшить изображение"
          disabled={view.scale === 1}
          onClick={() => zoom(view.scale - 0.5)}
        >
          −
        </button>
        <button
          type="button"
          aria-label="Увеличить изображение"
          disabled={view.scale === 4}
          onClick={() => zoom(view.scale + 0.5)}
        >
          +
        </button>
        <button type="button" onClick={() => zoom(1)} aria-label="Сбросить масштаб">
          {Math.round(view.scale * 100)}%
        </button>
      </div>
      <div
        ref={stageRef}
        className="image-viewer-stage"
        style={{ cursor: view.scale > 1 ? "grab" : "zoom-in" }}
        onDoubleClick={() => zoom(view.scale === 1 ? 2 : 1)}
        onPointerDown={(event) => {
          if (pointers.current.size === 0) dragged.current = false;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          event.currentTarget.setPointerCapture(event.pointerId);
          if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            gesture.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
          }
        }}
        onPointerMove={(event) => {
          const previous = pointers.current.get(event.pointerId);
          if (!previous) return;
          const dx = event.clientX - previous.x,
            dy = event.clientY - previous.y;
          if (Math.abs(dx) + Math.abs(dy) > 2) dragged.current = true;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 2 && gesture.current) {
            const [a, b] = [...pointers.current.values()];
            const scale = limit(
              (gesture.current.scale * Math.hypot(a.x - b.x, a.y - b.y)) /
                Math.max(1, gesture.current.distance),
            );
            setView({ scale, x: 0, y: 0 });
          } else if (view.scale > 1) {
            const box = event.currentTarget.getBoundingClientRect();
            setView((current) => ({
              ...current,
              x: Math.max(
                (-box.width * (current.scale - 1)) / 2,
                Math.min((box.width * (current.scale - 1)) / 2, current.x + dx),
              ),
              y: Math.max(
                (-box.height * (current.scale - 1)) / 2,
                Math.min((box.height * (current.scale - 1)) / 2, current.y + dy),
              ),
            }));
          }
        }}
        onPointerUp={(event) => endPointer(event.pointerId)}
        onPointerCancel={(event) => {
          dragged.current = true;
          endPointer(event.pointerId);
        }}
        onClick={(event) => {
          if (dragged.current || view.scale > 1) return;
          const img = event.currentTarget.querySelector("img")!;
          const box = event.currentTarget.getBoundingClientRect();
          const ratio = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight);
          const w = img.naturalWidth * ratio,
            h = img.naturalHeight * ratio;
          if (
            event.clientX < box.left + (box.width - w) / 2 ||
            event.clientX > box.right - (box.width - w) / 2 ||
            event.clientY < box.top + (box.height - h) / 2 ||
            event.clientY > box.bottom - (box.height - h) / 2
          )
            onClose();
        }}
      >
        <img
          src={image.src}
          alt={image.alt}
          draggable={false}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        />
      </div>
      <p>
        {image.title}
        <span>Масштаб: кнопки +/− или жест двумя пальцами. Перемещение — перетаскиванием.</span>
      </p>
    </dialog>,
    document.body,
  );
}
