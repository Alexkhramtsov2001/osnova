import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import SiteHeader from "../../components/SiteHeader";
import type { SavedEstimate } from "../estimate/savedEstimates";
import { useSavedEstimates } from "../estimate/useSavedEstimates";
import { projects } from "../projects/catalog";
import { writeFavoriteIds } from "../projects/favorites";
import "./AccountPage.css";
import DemoProjectChat from "./DemoProjectChat";
import {
  clearDemoSession,
  DEMO_ACCOUNT_EMAIL,
  DEMO_ACCOUNT_PASSWORD,
  hasDemoCredentials,
  readDemoSession,
  writeDemoSession,
} from "./demoSession";

type AccountPageProps = {
  favoriteIds: string[];
  onFavoritesChange: (ids: string[]) => void;
};

function formatSavedDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(value));
}

export default function AccountPage({ favoriteIds, onFavoritesChange }: AccountPageProps) {
  const [authenticated, setAuthenticated] = useState(() => readDemoSession(window.sessionStorage));
  const [email, setEmail] = useState(DEMO_ACCOUNT_EMAIL);
  const [password, setPassword] = useState(DEMO_ACCOUNT_PASSWORD);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { savedEstimates, mutate: mutateSavedEstimates, refresh } = useSavedEstimates();

  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!hasDemoCredentials(email, password)) {
      setError("Проверьте тестовый email и пароль. Настоящая регистрация здесь отключена.");
      return;
    }
    if (!writeDemoSession(window.sessionStorage)) {
      setError("Браузер не разрешил сохранить демо-вход. Разрешите хранилище для этой вкладки.");
      return;
    }
    setAuthenticated(true);
  };

  const signOut = () => {
    clearDemoSession(window.sessionStorage);
    setAuthenticated(false);
    setNotice("");
    setPassword(DEMO_ACCOUNT_PASSWORD);
  };

  const removeFavorite = (id: string) => {
    const next = favoriteIds.filter((favoriteId) => favoriteId !== id);
    onFavoritesChange(next);
    writeFavoriteIds(window.localStorage, next);
    setNotice("Дом удалён из избранного.");
  };

  const removeEstimate = async (id: string) => {
    if (
      !(await mutateSavedEstimates((current) => current.filter((estimate) => estimate.id !== id)))
    ) {
      setNotice("Не удалось удалить расчёт. Проверьте настройки хранилища браузера.");
      return;
    }
    setNotice("Сохранённый расчёт удалён.");
  };

  const copyEstimate = async (estimate: SavedEstimate) => {
    try {
      await navigator.clipboard.writeText(estimate.summary);
      setNotice("Сводка расчёта скопирована.");
    } catch {
      setNotice("Не удалось скопировать сводку. Откройте её и скопируйте текст вручную.");
    }
  };

  const refreshSavedEstimates = () => {
    refresh();
    setNotice("Список сохранённых расчётов обновлён.");
  };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="account-page section-wrap">
        <Link className="project-detail-back" to="/">
          ← На главную
        </Link>
        <div className="account-page-heading">
          <div>
            <p className="eyebrow">ЛИЧНЫЙ КАБИНЕТ / ДЕМО</p>
            <h1>Ваши проекты</h1>
            <p className="account-page-lead">
              Демонстрационный вход показывает, как можно собрать избранные дома и расчёты в одном
              месте.
            </p>
          </div>
          {authenticated && (
            <button className="button button-secondary" type="button" onClick={signOut}>
              Выйти из демо
            </button>
          )}
        </div>

        {!authenticated ? (
          <section className="account-login-card" aria-labelledby="account-login-title">
            <div className="account-demo-note">
              <strong>Это тестовый вход, не регистрация</strong>
              <p>
                Данные не отправляются на сервер. Используйте эти демонстрационные реквизиты; не
                вводите настоящий email или пароль.
              </p>
              <p className="account-demo-credentials">
                Email: <code>{DEMO_ACCOUNT_EMAIL}</code>
                <br />
                Пароль: <code>{DEMO_ACCOUNT_PASSWORD}</code>
              </p>
            </div>
            <form className="account-login-form" onSubmit={signIn}>
              <h2 id="account-login-title">Войти в демо-кабинет</h2>
              <label>
                Email для демонстрации
                <input
                  autoComplete="off"
                  readOnly
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label>
                Тестовый пароль
                <input
                  autoComplete="off"
                  readOnly
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error && (
                <p className="account-message account-error" role="alert">
                  {error}
                </p>
              )}
              <button className="button button-primary" type="submit">
                Открыть демо-кабинет
              </button>
            </form>
          </section>
        ) : (
          <>
            <div className="account-demo-banner" role="status">
              Вы вошли в демонстрационный кабинет. Избранное и расчёты читаются только из этого
              браузера и не синхронизируются между устройствами.
            </div>
            {notice && (
              <p className="account-message" role="status">
                {notice}
              </p>
            )}

            <DemoProjectChat
              projects={favoriteIds
                .map((id) => projects.find((candidate) => candidate.number === id))
                .filter((project) => project !== undefined)}
            />

            <section className="account-data-section" aria-labelledby="account-favorites-title">
              <div className="account-section-heading">
                <div>
                  <p className="eyebrow">КОРОТКИЙ СПИСОК</p>
                  <h2 id="account-favorites-title">Избранные дома</h2>
                </div>
                <Link className="button button-secondary" to="/#projects">
                  Выбрать дом
                </Link>
              </div>
              {favoriteIds.length ? (
                <div className="account-project-list">
                  {favoriteIds.map((id) => {
                    const project = projects.find((candidate) => candidate.number === id);
                    if (!project) return null;
                    return (
                      <article className="account-project-card" key={project.number}>
                        <img src={project.image} alt="" loading="lazy" />
                        <div>
                          <p className="eyebrow">
                            {project.area} М² / {project.floors} ЭТАЖА
                          </p>
                          <h3>{project.name}</h3>
                          <p>{project.description}</p>
                          <div className="account-card-actions">
                            <Link
                              className="button button-primary"
                              to={`/projects/${project.number}`}
                            >
                              Открыть проект
                            </Link>
                            <button
                              className="account-text-button"
                              type="button"
                              onClick={() => removeFavorite(project.number)}
                            >
                              Убрать из избранного
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="account-empty-state">
                  <p>Пока нет избранных домов.</p>
                  <Link className="button button-primary" to="/#projects">
                    Посмотреть каталог
                  </Link>
                </div>
              )}
            </section>

            <section className="account-data-section" aria-labelledby="account-estimates-title">
              <div className="account-section-heading">
                <div>
                  <p className="eyebrow">ВАШИ РАСЧЁТЫ</p>
                  <h2 id="account-estimates-title">Сохранённые сметы</h2>
                </div>
                <div className="account-section-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={refreshSavedEstimates}
                  >
                    Обновить
                  </button>
                  <Link className="button button-secondary" to="/#calculator">
                    Новый расчёт
                  </Link>
                </div>
              </div>
              {savedEstimates.length ? (
                <div className="account-estimate-list">
                  {savedEstimates.map((estimate) => (
                    <article className="account-estimate-card" key={estimate.id}>
                      <div className="account-estimate-summary">
                        <div>
                          <p className="eyebrow">
                            {formatSavedDate(estimate.savedAt)} / {estimate.area} М²
                          </p>
                          <h3>{estimate.title}</h3>
                          <p>
                            {estimate.mode === "turnkey" ? "Под ключ" : "Отдельные этапы"} · версия{" "}
                            {estimate.dataVersion}
                          </p>
                        </div>
                        <div className="account-card-actions">
                          <button
                            className="account-text-button"
                            type="button"
                            onClick={() => void copyEstimate(estimate)}
                          >
                            Копировать сводку
                          </button>
                          <button
                            className="account-text-button account-danger-button"
                            type="button"
                            onClick={() => removeEstimate(estimate.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                      <details>
                        <summary>Показать сводку</summary>
                        <pre>{estimate.summary}</pre>
                      </details>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="account-empty-state">
                  <p>Сохранённых расчётов пока нет.</p>
                  <Link className="button button-primary" to="/#calculator">
                    Рассчитать стоимость
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <footer className="site-footer">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            О
          </span>
          <span className="brand-copy">
            <strong>ОСНОВА</strong>
            <small>СТРОИМ ДЛЯ ЖИЗНИ</small>
          </span>
        </div>
        <p>
          Демонстрационный проект строительной компании. Данные аккаунта хранятся только в этом
          браузере.
        </p>
      </footer>
    </div>
  );
}
