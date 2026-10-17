import { number } from "./formatters";
import { Link } from "react-router";
import { SAVED_ESTIMATES_LIMIT, type SavedEstimate } from "./savedEstimates";

type Props = {
  savedEstimates: SavedEstimate[];
  savedStatus: string;
  deleteSavedEstimate: (id: string) => void;
  restoreSavedEstimate: (entry: SavedEstimate) => void;
  copySavedEstimate: (entry: SavedEstimate) => Promise<void>;
};

export default function SavedEstimates({
  savedEstimates,
  savedStatus,
  deleteSavedEstimate,
  restoreSavedEstimate,
  copySavedEstimate,
}: Props) {
  return (
    <section className="estimate-saved" aria-labelledby="estimate-saved-title">
      <div className="estimate-saved-heading">
        <div>
          <span className="estimate-overline">НА ЭТОМ УСТРОЙСТВЕ</span>
          <h3 id="estimate-saved-title">Сохранённые расчёты</h3>
        </div>
        <span>
          {savedEstimates.length} из {SAVED_ESTIMATES_LIMIT}
        </span>
      </div>
      <p>
        Сохраняется снимок сводки с версией демо-данных. Он не меняется при последующих правках
        калькулятора. Новые записи можно загрузить в поля для повторного расчёта по текущей
        демо-базе. Данные доступны только в этом браузере; записи сверх лимита заменяют самые
        старые. <Link to="/account">Открыть все сохранённые расчёты в демо-кабинете</Link>.
      </p>
      {savedStatus && (
        <p className="estimate-saved-status" role="status">
          {savedStatus}
        </p>
      )}
      {savedEstimates.length === 0 ? (
        <p className="estimate-saved-empty">
          Пока ничего не сохранено. Настройте расчёт и нажмите «Сохранить расчёт».
        </p>
      ) : (
        <div className="estimate-saved-list">
          {savedEstimates.map((entry) => (
            <article className="estimate-saved-item" key={entry.id}>
              <div className="estimate-saved-item-head">
                <div>
                  <strong>{entry.title}</strong>
                  <span>
                    {new Intl.DateTimeFormat("ru-RU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(entry.savedAt))}{" "}
                    · {entry.mode === "turnkey" ? "Под ключ" : "Отдельные этапы"} ·{" "}
                    {number.format(entry.area)} м²
                  </span>
                  <small>Версия данных: {entry.dataVersion}</small>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSavedEstimate(entry.id)}
                  aria-label={`Удалить сохранённый расчёт ${entry.title}`}
                >
                  Удалить
                </button>
              </div>
              {entry.configuration && (
                <button
                  type="button"
                  onClick={() => restoreSavedEstimate(entry)}
                  aria-label={`Загрузить параметры расчёта ${entry.title}`}
                >
                  Загрузить параметры
                </button>
              )}
              <details>
                <summary>Посмотреть сохранённую сводку</summary>
                <textarea
                  aria-label={`Сводка расчёта ${entry.title}`}
                  readOnly
                  value={entry.summary}
                  rows={10}
                />
                <button type="button" onClick={() => copySavedEstimate(entry)}>
                  Копировать сводку
                </button>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
