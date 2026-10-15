import { Link, useLocation, useNavigate } from "react-router";
import ArrowIcon from "../components/ArrowIcon";

export default function BackToCatalog() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <Link
      className="project-detail-back"
      to="/projects"
      onClick={(event) => {
        if (
          location.state?.fromCatalog &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          navigate(-1);
        }
      }}
    >
      <ArrowIcon direction="left" /> К подборке проектов
    </Link>
  );
}
