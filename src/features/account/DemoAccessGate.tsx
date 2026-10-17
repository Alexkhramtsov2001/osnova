import { Link } from "react-router";
import ArrowIcon from "../../components/ArrowIcon";
import { demoAccountPath } from "./demoSession";
import "./DemoAccessGate.css";

type Props = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  next: string;
};

export default function DemoAccessGate({ id, eyebrow, title, description, next }: Props) {
  return (
    <section className="section-wrap demo-access-gate" id={id} aria-labelledby="demo-access-title">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id="demo-access-title">{title}</h2>
      <p>{description}</p>
      <div className="demo-access-actions">
        <Link className="button button-primary" to={demoAccountPath(next)}>
          Зарегистрироваться <ArrowIcon />
        </Link>
        <Link className="button button-secondary" to={demoAccountPath(next, "login")}>
          Войти в кабинет <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}
