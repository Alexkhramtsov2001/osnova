import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { lockOverlayScroll } from "./overlayScroll";
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
import ArrowIcon from "./ArrowIcon";
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDialogElement>(null);
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current!;
    const launcher = buttonRef.current;
    const mobile = window.matchMedia("(max-width: 600px)");
    let unlock: (() => void) | undefined;
    const show = () => {
      panel.close();
      unlock?.();
      unlock = undefined;
      if (mobile.matches) {
        unlock = lockOverlayScroll();
        panel.showModal();
      } else panel.show();
      closeRef.current?.focus({ preventScroll: true });
    };
    show();
    mobile.addEventListener("change", show);
    return () => {
      mobile.removeEventListener("change", show);
      panel.close();
      unlock?.();
      launcher?.focus({ preventScroll: true });
    };
  }, [open]);
  useEffect(() => {
    const log = transcriptRef.current;
    if (open && log) log.scrollTop = log.scrollHeight;
  }, [history, open]);

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
  return createPortal(
    <div className={`global-demo-chat${open ? " chat-open" : ""}`}>
      <button
        className="global-chat-launcher"
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
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
          aria-hidden="true"
        >
          <path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" />
          <path d="M7 9h8M7 13h5" />
        </svg>
      </button>
      {open && (
        <dialog
          ref={panelRef}
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
          }}
          id="global-chat-panel"
          className="global-chat-panel"
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
                          {content.action.label} <ArrowIcon />
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
        </dialog>
      )}
    </div>,
    document.body,
  );
}
