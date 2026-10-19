// Fix the body rather than changing the scroll container of sticky headers on iOS.
export function lockOverlayScroll(position = { x: window.scrollX, y: window.scrollY }) {
  const body = document.body;
  const root = document.documentElement;
  const { x, y } = position;
  const previous = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    width: body.style.width,
    overflow: body.style.overflow,
    rootOverflow: root.style.overflow,
  };
  Object.assign(body.style, {
    position: "fixed",
    top: `${-y}px`,
    left: `${-x}px`,
    width: "100%",
    overflow: "hidden",
  });
  root.style.overflow = "hidden";
  return () => {
    const { rootOverflow, ...bodyStyles } = previous;
    Object.assign(body.style, bodyStyles);
    root.style.overflow = rootOverflow;
    window.scrollTo({ left: x, top: y, behavior: "instant" });
  };
}
