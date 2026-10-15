import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { vacancies, vacancyRegions, vacancyRoles } from "../features/company/vacancies";
import "./VacanciesPage.css";

const money = (value: number) => new Intl.NumberFormat("ru-RU").format(value);

export default function VacanciesPage() {
  const [region, setRegion] = useState("");
  const [role, setRole] = useState("");
  const [minimum, setMinimum] = useState(0);
  const [visible, setVisible] = useState(10);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatStep, setChatStep] = useState<"start" | "apply" | "done">("start");
  const [chatRole, setChatRole] = useState("");
  const [chatRegion, setChatRegion] = useState("");

  useEffect(() => {
    if (!chatOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChatOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [chatOpen]);

  const filtered = useMemo(
    () =>
      vacancies.filter(
        (item) =>
          (!region || item.region === region) &&
          (!role || item.title === role) &&
          item.salaryFrom >= minimum,
      ),
    [region, role, minimum],
  );
  const updateFilters = (nextRegion: string, nextRole: string, nextMinimum: number) => {
    setRegion(nextRegion);
    setRole(nextRole);
    setMinimum(nextMinimum);
    setVisible(10);
  };

  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section className="section-wrap page-intro vacancies-intro">
          <p className="eyebrow">КАРЬЕРА / ДЕМОНСТРАЦИОННЫЕ ВАКАНСИИ</p>
          <h1>
            Работа, в которой <span>есть смысл.</span>
          </h1>
          <p className="interior-intro-copy">
            Изучите пример того, как мог бы выглядеть раздел карьеры строительной компании: пять
            разных ролей в каждом из одиннадцати регионов. Позиции, адреса офисов и зарплаты
            вымышлены и не являются предложением работы.
          </p>
        </section>
        <section
          className="section-wrap content-section vacancies-section"
          aria-labelledby="vacancies-title"
        >
          <p className="eyebrow">ПОИСК ПОЗИЦИЙ</p>
          <h2 id="vacancies-title">
            Найдите свою <span>роль.</span>
          </h2>
          <div className="vacancy-filters">
            <label>
              Регион
              <select
                aria-label="Регион"
                value={region}
                onChange={(event) => updateFilters(event.target.value, role, minimum)}
              >
                <option value="">Все регионы</option>
                {vacancyRegions.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Вакансия
              <select
                aria-label="Вакансия"
                value={role}
                onChange={(event) => updateFilters(region, event.target.value, minimum)}
              >
                <option value="">Все вакансии</option>
                {vacancyRoles.map((item) => (
                  <option key={item.title} value={item.title}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Зарплата от
              <select
                aria-label="Зарплата от"
                value={minimum}
                onChange={(event) => updateFilters(region, role, Number(event.target.value))}
              >
                <option value={0}>Любая</option>
                {[90000, 110000, 130000, 150000, 180000, 200000].map((value) => (
                  <option key={value} value={value}>
                    {money(value)} ₽
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => updateFilters("", "", 0)}>
              Сбросить фильтры
            </button>
          </div>
          <p className="vacancy-count" role="status">
            Найдено: {filtered.length} из {vacancies.length}
          </p>
          {filtered.length ? (
            <div className="vacancy-grid">
              {filtered.slice(0, visible).map((item) => (
                <article className="vacancy-card" key={item.id}>
                  <div className="vacancy-card-top">
                    <span>{item.region}</span>
                    <span>ДЕМО</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.duties}</p>
                  <dl>
                    <dt>Демо-адрес офиса</dt>
                    <dd>{item.office}</dd>
                    <dt>Пример зарплаты</dt>
                    <dd>
                      {money(item.salaryFrom)}–{money(item.salaryTo)} ₽ / мес.
                    </dd>
                  </dl>
                  <button
                    type="button"
                    onClick={() => {
                      setChatRole(item.title);
                      setChatRegion(item.region);
                      setChatStep("apply");
                      setChatOpen(true);
                    }}
                  >
                    Откликнуться в демо-чате →
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="vacancy-empty">
              По выбранным параметрам примеров нет. Измените зарплату, роль или регион.
            </div>
          )}
          {visible < filtered.length && (
            <button
              className="vacancy-more"
              type="button"
              onClick={() => setVisible((current) => current + 10)}
            >
              Показать ещё
            </button>
          )}
        </section>
        <section className="section-wrap vacancy-follow">
          <div>
            <p className="eyebrow">ОСТАВАЙТЕСЬ НА СВЯЗИ</p>
            <h2>
              Не нашли <span>свою вакансию?</span>
            </h2>
            <p>
              За реальными предложениями следите на hh.ru. Или попробуйте оставить учебный отклик в
              имитации диалога с менеджером.
            </p>
          </div>
          <div className="vacancy-follow-actions">
            <a
              className="button button-secondary"
              href="https://hh.ru/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Открыть hh.ru ↗
            </a>
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                setChatStep("start");
                setChatOpen(true);
              }}
            >
              Открыть демо-чат
            </button>
          </div>
        </section>
        {chatOpen && (
          <div className="vacancy-chat-backdrop" onClick={() => setChatOpen(false)}>
            <section
              className="vacancy-chat"
              role="dialog"
              aria-modal="true"
              aria-labelledby="vacancy-chat-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <div>
                  <small>ДЕМО / МЕНЕДЖЕР</small>
                  <h2 id="vacancy-chat-title">Отклик на вакансию</h2>
                </div>
                <button type="button" aria-label="Закрыть чат" onClick={() => setChatOpen(false)}>
                  ×
                </button>
              </header>
              <div className="vacancy-chat-body">
                <p className="chat-bubble">
                  Здравствуйте! Это имитация диалога. Мы покажем, как выглядел бы отклик, но никому
                  его не отправим.
                </p>
                {chatStep === "start" && (
                  <button type="button" onClick={() => setChatStep("apply")}>
                    Хочу оставить учебный отклик →
                  </button>
                )}
                {chatStep === "apply" && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      setChatStep("done");
                    }}
                  >
                    <label>
                      Вакансия
                      <select
                        required
                        value={chatRole}
                        onChange={(event) => setChatRole(event.target.value)}
                      >
                        <option value="">Выберите вакансию</option>
                        {vacancyRoles.map((item) => (
                          <option key={item.title}>{item.title}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Регион
                      <select
                        required
                        value={chatRegion}
                        onChange={(event) => setChatRegion(event.target.value)}
                      >
                        <option value="">Выберите регион</option>
                        {vacancyRegions.map((item) => (
                          <option key={item.name}>{item.name}</option>
                        ))}
                      </select>
                    </label>
                    <p>Личные данные не нужны. Выбор останется только на этой странице.</p>
                    <button className="button button-primary" type="submit">
                      Показать учебный отклик
                    </button>
                  </form>
                )}
                {chatStep === "done" && (
                  <>
                    <p className="chat-bubble chat-bubble-own">
                      {chatRole} · {chatRegion}
                    </p>
                    <p className="chat-bubble">
                      Учебный отклик готов. Он не отправлен и не сохранён. Для связи по настоящему
                      проекту воспользуйтесь{" "}
                      <Link to="/contacts" onClick={() => setChatOpen(false)}>
                        контактами автора
                      </Link>
                      .
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setChatRole("");
                        setChatRegion("");
                        setChatStep("apply");
                      }}
                    >
                      Выбрать другую роль
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
