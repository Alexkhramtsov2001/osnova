import { Link } from "react-router";
import { navigation } from "../features/company/navigation";
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="footer-logo" to="/">
        ОСНОВА
      </Link>
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
