import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

type SiteHeaderProps = { home?: boolean };

export default function SiteHeader({ home = false }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    const menuButton = menuButtonRef.current;
    const content = Array.from(headerRef.current?.parentElement?.children ?? []).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== headerRef.current,
    );
    const previousInert = content.map((element) => element.inert);
    window.scrollTo({ top: window.scrollY, behavior: "instant" });
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    content.forEach((element) => {
      element.inert = true;
    });
    headerRef.current?.querySelector<HTMLElement>(".mobile-nav a")?.focus({ preventScroll: true });
    const desktop = window.matchMedia("(min-width: 761px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      content.forEach((element, index) => {
        element.inert = previousInert[index];
      });
      desktop.removeEventListener("change", closeOnDesktop);
      menuButton?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  return (
    <>
      <header
        ref={headerRef}
        className={`site-header${menuOpen ? " menu-open" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButtonRef.current?.focus({ preventScroll: true });
          }
          if (event.key === "Tab" && menuOpen) {
            const links = headerRef.current?.querySelectorAll<HTMLElement>(".mobile-nav a");
            const last = links?.[links.length - 1];
            if (event.shiftKey && document.activeElement === menuButtonRef.current) {
              event.preventDefault();
              last?.focus({ preventScroll: true });
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              menuButtonRef.current?.focus({ preventScroll: true });
            }
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
        <Link className="header-contact header-account button button-primary" to="/account">
          Личный кабинет
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
            <Link className="mobile-account-link" to="/account" onClick={() => setMenuOpen(false)}>
              Личный кабинет
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
