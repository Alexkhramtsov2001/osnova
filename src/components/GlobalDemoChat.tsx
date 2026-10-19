import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  chatContext,
  globalChatGroups,
  GLOBAL_CHAT_KEY,
  readGlobalChat,
  turnContent,
  type ChatTurn,
  type GlobalTopic,
} from "../features/demoChat/globalChat";
import "./GlobalDemoChat.css";

export default function GlobalDemoChat() {
  const { pathname } = useLocation();
  const context = chatContext(pathname);
  const group = globalChatGroups[context.group];
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ChatTurn[]>(() => {
    try {
      return readGlobalChat(window.sessionStorage);
    } catch {
      return [];
    }
  });
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [bottom, setBottom] = useState(16);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        setOpen(false);
        buttonRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);
  useEffect(() => {
    const log = transcriptRef.current;
    if (open && log) log.scrollTop = log.scrollHeight;
  }, [history, open]);

  // Keep the closed launcher away from nearby form controls without changing page grids.
  useEffect(() => {
    if (open) return;
    let frame = 0;
    const place = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const button = buttonRef.current;
        if (!button || button.getClientRects().length === 0) return;
        const box = button.getBoundingClientRect();
        const safeBottom = parseFloat(getComputedStyle(rootRef.current!).paddingBottom) || 0;
        const controls = [
          ...document.querySelectorAll<HTMLElement>(
            "#site-content main :is(a,button,input,select,textarea,label,summary), #site-content .site-footer :is(a,p), .favorite-toast, .estimate-disclaimer, .payment-confirm-note, .payment-final",
          ),
        ]
          .filter((node) => node.getClientRects().length && !node.closest("[inert]"))
          .map((node) => node.getBoundingClientRect())
          .filter((rect) => rect.bottom > 0 && rect.top < innerHeight);
        let selected = 16;
        let leastOverlap = Infinity;
        for (let offset = 16; offset <= innerHeight - 160; offset += 8) {
          const top = innerHeight - safeBottom - offset - box.height;
          const overlap = controls.reduce(
            (area, rect) =>
              area +
              Math.max(0, Math.min(box.right, rect.right + 4) - Math.max(box.left, rect.left - 4)) *
                Math.max(
                  0,
                  Math.min(top + box.height, rect.bottom + 4) - Math.max(top, rect.top - 4),
                ),
            0,
          );
          if (overlap < leastOverlap) {
            selected = offset;
            leastOverlap = overlap;
          }
          if (overlap === 0) break;
        }
        setBottom((current) => (current === selected ? current : selected));
      });
    };
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    const observer = new ResizeObserver(place);
    const content = document.getElementById("site-content");
    if (content) observer.observe(content);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [pathname, open]);

  function ask(topic: GlobalTopic) {
    const next = [
      ...history,
      {
        id: crypto.randomUUID(),
        group: context.group,
        topicId: topic.id,
        projectId: context.project?.number,
      },
    ].slice(-30);
    setHistory(next);
    try {
      sessionStorage.setItem(GLOBAL_CHAT_KEY, JSON.stringify(next));
    } catch {
      setStorageUnavailable(true);
    }
  }
  return (
    <div className="global-demo-chat" ref={rootRef}>
      <button
        className="global-chat-launcher"
        style={{ bottom: `calc(${open ? 16 : bottom}px + env(safe-area-inset-bottom))` }}
        ref={buttonRef}
        type="button"
        aria-label={open ? "Закрыть демонстрационный чат" : "Открыть демонстрационный чат"}
        aria-expanded={open}
        aria-controls={open ? "global-chat-panel" : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" />
          <path d="M7 9h8M7 13h5" />
        </svg>
      </button>
      {open && (
        <section
          id="global-chat-panel"
          className="global-chat-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="global-chat-title"
        >
          <header>
            <div>
              <h2 id="global-chat-title">Менеджер ОСНОВА</h2>
              <p>Демонстрационный чат</p>
            </div>
            <button type="button" ref={closeRef} onClick={close} aria-label="Закрыть панель чата">
              ×
            </button>
          </header>
          <p className="global-chat-notice">
            Готовые ответы, без ИИ и реального оператора. Ничего не отправляется компании. История —
            только в этой вкладке.
          </p>
          {storageUnavailable && (
            <p className="global-chat-notice" role="status">
              Хранилище недоступно: история сохранится только до обновления страницы.
            </p>
          )}
          <div
            ref={transcriptRef}
            className="global-chat-transcript"
            role="log"
            aria-live="polite"
            aria-label="Переписка справочного чата"
            tabIndex={0}
          >
            {history.length === 0 && (
              <p className="global-chat-welcome">
                Выберите вопрос ниже — покажу возможности и ограничения демо.
              </p>
            )}
            {history.map((turn) => {
              const content = turnContent(turn);
              return (
                content && (
                  <div key={turn.id} className="global-chat-turn">
                    <p className="global-chat-question">
                      <strong>Вы</strong>
                      {content.question}
                    </p>
                    <div className="global-chat-answer">
                      <strong>Демо-менеджер</strong>
                      <p>{content.answer}</p>
                      {content.action && (
                        <Link to={content.action.to} onClick={close}>
                          {content.action.label} <span aria-hidden="true">↗</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              );
            })}
          </div>
          <div className="global-chat-suggestions" aria-label={`Готовые вопросы: ${group.label}`}>
            <p>
              {group.label}
              {context.project ? ` · ${context.project.name}` : ""}
            </p>
            {group.topics.map((topic) => (
              <button type="button" key={topic.id} onClick={() => ask(topic)}>
                {topic.question}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
