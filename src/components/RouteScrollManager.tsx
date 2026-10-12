import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router";

const STORAGE_PREFIX = "osnova.scroll-position.v1:";

function positionKey(key: string, path: string) {
  return `${STORAGE_PREFIX}${key}:${path}`;
}

function jumpTo(top: number) {
  window.scrollTo({ top, left: 0, behavior: "instant" });
}

function jumpToHash(hash: string) {
  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    /* Keep the original fragment. */
  }
  document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
}

export default function RouteScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const previousPath = useRef<string | null>(null);
  const path = `${location.pathname}${location.search}${location.hash}`;
  const key = positionKey(location.key, path);

  useLayoutEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    const routeChanged = previousPath.current !== location.pathname;
    let saved = positions.current.get(key);
    if (saved === undefined) {
      try {
        const raw = window.sessionStorage.getItem(key);
        if (raw !== null && Number.isFinite(Number(raw))) saved = Number(raw);
      } catch {
        /* Storage may be unavailable; in-memory navigation still works. */
      }
    }

    if (navigationType === "POP" && saved !== undefined) jumpTo(saved);
    else if (routeChanged && location.hash) jumpToHash(location.hash);
    else if (routeChanged) jumpTo(0);
    previousPath.current = location.pathname;

    const remember = () => {
      positions.current.set(key, window.scrollY);
    };
    const persist = () => {
      remember();
      try {
        window.sessionStorage.setItem(key, String(window.scrollY));
      } catch {
        /* Ignore restricted storage. */
      }
    };
    window.addEventListener("scroll", remember, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      window.removeEventListener("scroll", remember);
      window.removeEventListener("pagehide", persist);
    };
  }, [key, location.hash, location.pathname, navigationType]);

  return null;
}
