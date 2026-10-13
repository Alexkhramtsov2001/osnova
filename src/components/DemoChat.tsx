import { Fragment, useState } from "react";
import { chatTopics, submitDemoChatTurn, type ChatTopic } from "../features/demoChat/chat";

type Turn = { id: string; topic: ChatTopic };

export default function DemoChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<Turn | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(turn: Turn) {
    setPending(turn);
    setBusy(true);
    try {
      await submitDemoChatTurn(turn.id, turn.topic.code);
      setTurns((current) => [...current, turn]);
      setPending(null);
    } catch {
      // Keep the same UUID for a retry after an uncertain network result.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="demo-chat" role="group" aria-labelledby="demo-chat-title">
      <div className="demo-chat-intro">
        <div>
          <p className="eyebrow">ИНТЕРАКТИВНОЕ ДЕМО</p>
          <h3 id="demo-chat-title">Чат о проекте</h3>
        </div>
        <p>
          Выберите готовый вопрос. Ответит автоматический сценарий, а в Supabase сохранится только
          код темы. Это не чат с менеджером.
        </p>
      </div>
      <div className="demo-chat-log" role="log" aria-live="polite" aria-label="История демо-чата">
        <p className="demo-chat-message demo-chat-answer">
          Привет! Я покажу, как может работать чат ОСНОВЫ. О чём рассказать?
        </p>
        {turns.map((turn) => (
          <Fragment key={turn.id}>
            <p className="demo-chat-message demo-chat-question">{turn.topic.question}</p>
            <p className="demo-chat-message demo-chat-answer">{turn.topic.answer}</p>
          </Fragment>
        ))}
      </div>
      <div className="demo-chat-topics" aria-label="Готовые вопросы">
        {chatTopics.map((topic) => (
          <button
            type="button"
            key={topic.code}
            disabled={busy || pending !== null}
            onClick={() => void send({ id: crypto.randomUUID(), topic })}
          >
            {topic.question}
          </button>
        ))}
      </div>
      {pending && (
        <div className="demo-chat-status" role={busy ? "status" : "alert"}>
          {busy ? (
            <p>Сохраняем выбранную тему…</p>
          ) : (
            <>
              <p>Не удалось сохранить тему. Ответ пока не получен.</p>
              <button type="button" onClick={() => void send(pending)}>
                Повторить отправку
              </button>
              <button type="button" onClick={() => setPending(null)}>
                Выбрать другой вопрос
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
