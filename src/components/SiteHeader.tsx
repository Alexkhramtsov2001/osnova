import { useRef, useState } from "react";
import { Link } from "react-router";

type SiteHeaderProps = { home?: boolean };

export default function SiteHeader({ home = false }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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
          {home ? <a href="#demo-chat">Чат</a> : <Link to="/#demo-chat">Чат</Link>}
        </nav>
        <Link className="header-contact header-account" to="/account">
          Личный кабинет <small>Демо</small>
        </Link>
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
            {home ? (
              <a href="#demo-chat" onClick={() => setMenuOpen(false)}>
                Чат
              </a>
            ) : (
              <Link to="/#demo-chat" onClick={() => setMenuOpen(false)}>
                Чат
              </Link>
            )}
            <Link to="/account" onClick={() => setMenuOpen(false)}>
              Личный кабинет <small>Демо</small>
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
