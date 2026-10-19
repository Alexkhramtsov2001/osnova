import { useEffect, useRef, useState } from "react";
import type { Project } from "../projects/catalog";

import { projectReplies as replies, type DemoReply } from "../demoChat/projectReplies";

type Message = { id: number; kind: "question" | "answer"; text: string };

export default function DemoProjectChat({ projects }: { projects: Project[] }) {
  const [selectedProject, setSelectedProject] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const project = projects.find((item) => item.number === selectedProject);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [messages]);

  const ask = (reply: DemoReply) => {
    setMessages((current) => [
      ...current,
      { id: nextId.current++, kind: "question", text: reply.question },
      { id: nextId.current++, kind: "answer", text: reply.answer(project) },
    ]);
  };

  return (
    <section
      className="account-data-section account-chat-section"
      aria-labelledby="account-chat-title"
    >
      <div className="account-section-heading">
        <div>
          <p className="eyebrow">ВОПРОСЫ ПО ПРОЕКТАМ</p>
          <h2 id="account-chat-title">Демо-чат с менеджером</h2>
        </div>
        <span className="account-chat-status">
          <span aria-hidden="true" /> Демонстрация
        </span>
      </div>
      <div className="account-chat-panel">
        <p className="account-chat-disclaimer">
          Это сценарий для портфолио: отвечает виртуальный консультант по заранее заданным темам.
          Сообщения не отправляются человеку, не сохраняются и не передаются в Supabase.
        </p>
        {projects.length > 0 && (
          <label className="account-chat-project">
            О каком проекте спросить?
            <select
              value={selectedProject}
              onChange={(event) => setSelectedProject(event.target.value)}
            >
              <option value="">Пока без привязки к дому</option>
              {projects.map((item) => (
                <option value={item.number} key={item.number}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <div
          className="account-chat-transcript"
          ref={transcriptRef}
          aria-live="polite"
          aria-label="История демо-чата"
        >
          {messages.length === 0 ? (
            <p className="account-chat-welcome">
              Выберите вопрос — консультант ответит про выбранный проект и ограничения демо-расчёта.
            </p>
          ) : (
            messages.map((message) => (
              <p
                className={`account-chat-message account-chat-message-${message.kind}`}
                key={message.id}
              >
                <span>{message.kind === "question" ? "Вы" : "Демо-консультант"}</span>
                {message.text}
              </p>
            ))
          )}
        </div>
        <div className="account-chat-prompts" aria-label="Готовые вопросы">
          {replies.map((reply) => (
            <button
              className="account-chat-prompt"
              key={reply.id}
              type="button"
              onClick={() => ask(reply)}
            >
              {reply.question}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
