import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router";

import { navigation } from "../features/company/navigation";

export default function SiteHeader() {
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
    const desktop = window.matchMedia("(min-width: 1151px)");
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
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
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
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <Link className="mobile-account-link" to="/account" onClick={() => setMenuOpen(false)}>
              Личный кабинет
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
