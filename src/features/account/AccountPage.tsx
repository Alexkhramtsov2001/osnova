import SiteFooter from "../../components/SiteFooter";
import { useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import SiteHeader from "../../components/SiteHeader";
import type { SavedEstimate } from "../estimate/savedEstimates";
import { useSavedEstimates } from "../estimate/useSavedEstimates";
import { resolveCalculatorDraft, writeCalculatorDraft } from "../estimate/calculatorDraft";
import { projects } from "../projects/catalog";
import { writeFavoriteIds } from "../projects/favorites";
import "./AccountPage.css";
import DemoProjectChat from "./DemoProjectChat";
import DemoAuthPanel from "./DemoAuthPanel";
import {
  clearDemoSession,
  DEMO_AUTH_CHANGED_EVENT,
  readDemoProfile,
  readDemoSession,
  readDemoSessionSource,
  readDemoReturnPath,
  type DemoSessionSource,
} from "./demoSession";

type AccountPageProps = {
  favoriteIds: string[];
  onFavoritesChange: (ids: string[]) => void;
};

function formatSavedDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(value));
}

export default function AccountPage({ favoriteIds, onFavoritesChange }: AccountPageProps) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const returnPath = readDemoReturnPath(search);
  const [authenticated, setAuthenticated] = useState(() => readDemoSession(window.sessionStorage));
  const [sessionSource, setSessionSource] = useState(() =>
    readDemoSessionSource(window.sessionStorage),
  );
  const [notice, setNotice] = useState("");
  const { savedEstimates, mutate: mutateSavedEstimates, refresh } = useSavedEstimates();

  const signIn = (source: DemoSessionSource) => {
    setAuthenticated(true);
    setSessionSource(source);
    window.dispatchEvent(new Event(DEMO_AUTH_CHANGED_EVENT));
    if (!returnPath) return;
    const target = new URL(returnPath, "https://osnova.demo");
    const pendingId = target.pathname === "/projects" ? target.searchParams.get("favorite") : null;
    const pendingProject = projects.find((project) => project.number === pendingId);
    if (pendingProject) {
      const next = favoriteIds.includes(pendingProject.number)
        ? favoriteIds
        : [...favoriteIds, pendingProject.number];
      onFavoritesChange(next);
      writeFavoriteIds(window.localStorage, next);
      navigate("/projects", { replace: true, state: { favoriteAdded: pendingProject.name } });
      return;
    }
    navigate(returnPath, { replace: true });
  };

  const signOut = () => {
    clearDemoSession(window.sessionStorage);
    setAuthenticated(false);
    setSessionSource("guest");
    setNotice("");
    window.dispatchEvent(new Event(DEMO_AUTH_CHANGED_EVENT));
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

  const continueEstimate = (estimate: SavedEstimate) => {
    if (!estimate.configuration) return;
    if (
      !writeCalculatorDraft(window.sessionStorage, {
        ...estimate.configuration,
        mode: estimate.mode,
        sourceProjectNumber: null,
      })
    ) {
      setNotice("Не удалось открыть расчёт: браузер не разрешил сохранить параметры вкладки.");
      return;
    }
    navigate("/calculator");
  };

  const startNewEstimate = (event: MouseEvent<HTMLAnchorElement>) => {
    let saved = false;
    try {
      saved = writeCalculatorDraft(
        window.sessionStorage,
        resolveCalculatorDraft(null, undefined, false),
      );
    } catch {
      // Access to the tab storage may be denied.
    }
    if (!saved) {
      event.preventDefault();
      setNotice(
        "Не удалось начать новый расчёт: браузер не разрешил сохранить параметры вкладки. Сохранённые сметы не изменены.",
      );
    }
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
          <DemoAuthPanel
            key={search}
            initialView={new URLSearchParams(search).get("mode") === "login" ? "login" : undefined}
            onAuthenticated={signIn}
          />
        ) : (
          <>
            <div className="account-demo-banner" role="status">
              {sessionSource === "email"
                ? `Здравствуйте, ${readDemoProfile(window.localStorage)?.name ?? "гость"}. `
                : sessionSource === "google" || sessionSource === "apple"
                  ? `Это имитация входа через ${sessionSource === "google" ? "Google" : "Apple"}; внешний аккаунт не подключён. `
                  : "Вы вошли в гостевой демо-кабинет. "}
              Избранное и расчёты читаются только из этого браузера и не синхронизируются между
              устройствами.
            </div>
            {notice && (
              <p className="account-message" role="status">
                {notice}
              </p>
            )}

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
                  <Link
                    className="button button-secondary"
                    to="/calculator"
                    onClick={startNewEstimate}
                  >
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
                      </div>
                      <details>
                        <summary>Показать сводку</summary>
                        <pre>{estimate.summary}</pre>
                      </details>
                      <div className="account-card-actions account-estimate-actions">
                        {estimate.configuration && (
                          <button
                            className="button button-primary"
                            type="button"
                            onClick={() => continueEstimate(estimate)}
                          >
                            Продолжить расчёт
                          </button>
                        )}
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
                    </article>
                  ))}
                </div>
              ) : (
                <div className="account-empty-state">
                  <p>Сохранённых расчётов пока нет.</p>
                  <Link className="button button-primary" to="/calculator">
                    Рассчитать стоимость
                  </Link>
                </div>
              )}
            </section>

            <section className="account-data-section" aria-labelledby="account-favorites-title">
              <div className="account-section-heading">
                <div>
                  <p className="eyebrow">КОРОТКИЙ СПИСОК</p>
                  <h2 id="account-favorites-title">Избранные дома</h2>
                </div>
                <Link className="button button-secondary" to="/projects">
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
                  <Link className="button button-primary" to="/projects">
                    Посмотреть каталог
                  </Link>
                </div>
              )}
            </section>

            <DemoProjectChat
              projects={favoriteIds
                .map((id) => projects.find((candidate) => candidate.number === id))
                .filter((project) => project !== undefined)}
            />
          </>
        )}
        <p className="account-storage-note">
          Данные демо-кабинета хранятся только в этом браузере.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
