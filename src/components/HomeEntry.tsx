import { Navigate, useLocation } from "react-router";
import HomePage from "../pages/HomePage";
export default function HomeEntry() {
  const location = useLocation();
  const hash = location.hash;
  const project = new URLSearchParams(location.search).get("project");
  if (project || hash === "#calculator")
    return <Navigate replace to={`/calculator${location.search}`} />;
  if (hash === "#projects" || hash.startsWith("#project-"))
    return <Navigate replace to={`/projects${location.search}${hash}`} />;
  if (hash === "#contacts" || hash === "#demo-chat")
    return <Navigate replace to={`/contacts${hash}`} />;
  return <HomePage />;
}
