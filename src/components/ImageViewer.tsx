import { useEffect, useRef } from "react";
import "./ImageViewer.css";

export type ViewerImage = { src: string; alt: string; title: string };

export default function ImageViewer({
  image,
  onClose,
}: {
  image: ViewerImage;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current!;
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      if (invoker?.isConnected) invoker.focus({ preventScroll: true });
    };
  }, []);
  return (
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
      <img src={image.src} alt={image.alt} />
      <p>{image.title}</p>
    </dialog>
  );
}
