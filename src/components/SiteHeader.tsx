import { useRef, useState } from "react";
import { Link } from "react-router";

type SiteHeaderProps = { home?: boolean };

export default function SiteHeader({ home = false }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const accountDialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const accountOpenedFromMenu = useRef(false);
  const openAccount = (fromMenu = false) => {
    accountOpenedFromMenu.current = fromMenu;
    setMenuOpen(false);
    accountDialogRef.current?.showModal();
  };

  return (
    <>
      <header
        className="site-header"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButtonRef.current?.focus();
          }
        }}
      >
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            О
          </span>
          <span className="brand-copy">
            <strong>ОСНОВА</strong>
            <small>СТРОИМ ДЛЯ ЖИЗНИ</small>
          </span>
        </div>
        <nav className="desktop-nav" aria-label="Основная навигация">
          {home ? <a href="#projects">Проекты</a> : <Link to="/#projects">Проекты</Link>}
          {home ? (
            <a href="#advantages">Преимущества</a>
          ) : (
            <Link to="/#advantages">Преимущества</Link>
          )}
          {home ? (
            <a href="#calculator">Расчёт стоимости</a>
          ) : (
            <Link to="/#calculator">Расчёт стоимости</Link>
          )}
          {home ? <a href="#contacts">Контакты</a> : <Link to="/#contacts">Контакты</Link>}
        </nav>
        <button
          className="header-contact header-account"
          type="button"
          onClick={() => openAccount()}
        >
          Личный кабинет <small>Скоро</small>
        </button>
        <button
          ref={menuButtonRef}
          className="mobile-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
        {menuOpen && (
          <nav className="mobile-nav" id="mobile-nav" aria-label="Мобильная навигация">
            {home ? (
              <a href="#projects" onClick={() => setMenuOpen(false)}>
                Проекты
              </a>
            ) : (
              <Link to="/#projects" onClick={() => setMenuOpen(false)}>
                Проекты
              </Link>
            )}
            {home ? (
              <a href="#advantages" onClick={() => setMenuOpen(false)}>
                Преимущества
              </a>
            ) : (
              <Link to="/#advantages" onClick={() => setMenuOpen(false)}>
                Преимущества
              </Link>
            )}
            {home ? (
              <a href="#calculator" onClick={() => setMenuOpen(false)}>
                Расчёт стоимости
              </a>
            ) : (
              <Link to="/#calculator" onClick={() => setMenuOpen(false)}>
                Расчёт стоимости
              </Link>
            )}
            {home ? (
              <a href="#contacts" onClick={() => setMenuOpen(false)}>
                Контакты
              </a>
            ) : (
              <Link to="/#contacts" onClick={() => setMenuOpen(false)}>
                Контакты
              </Link>
            )}
            <button type="button" onClick={() => openAccount(true)}>
              Личный кабинет <small>Скоро</small>
            </button>
          </nav>
        )}
      </header>
      <dialog
        className="account-dialog"
        ref={accountDialogRef}
        onClose={() => {
          if (accountOpenedFromMenu.current) menuButtonRef.current?.focus();
        }}
        aria-labelledby="account-title"
        aria-describedby="account-description"
      >
        <p className="eyebrow">В РАЗРАБОТКЕ</p>
        <h2 id="account-title">Ваши проекты в одном месте</h2>
        <p id="account-description">
          В личном кабинете планируем сохранять избранные дома и расчёты, возвращаться к ним с
          другого устройства и отправлять заявки менеджеру. Вход и синхронизация между устройствами
          пока не подключены.
        </p>
        <p>
          Сейчас можно сравнивать дома и рассчитывать бюджет без регистрации. Избранное сохраняется
          в этом браузере.
        </p>
        <form method="dialog">
          <button className="button button-primary" autoFocus>
            Понятно
          </button>
        </form>
      </dialog>
    </>
  );
}
