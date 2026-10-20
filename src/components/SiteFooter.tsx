import { Link } from "react-router";
import { navigation } from "../features/company/navigation";
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand brand">
        <span className="brand-mark" aria-hidden="true">
          О
        </span>
        <span className="brand-copy">
          <strong>ОСНОВА</strong>
          <small>СТРОИМ ДЛЯ ЖИЗНИ</small>
        </span>
      </div>
      <nav aria-label="Навигация в подвале">
        {navigation.map((item) => (
          <Link key={item.to} to={item.to}>
            {item.label}
          </Link>
        ))}
      </nav>
      <p>
        ОСНОВА — демонстрационный учебный проект. Компания, сотрудники, партнёры, отзывы и
        показатели представлены в целях иллюстрации интерфейса.
      </p>
    </footer>
  );
}
