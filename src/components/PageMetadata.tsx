import { useEffect } from "react";
import { useLocation } from "react-router";
import { pageMetadata } from "../features/company/pageMetadata";
import { projects } from "../features/projects/catalog";
export default function PageMetadata() {
  const { pathname: rawPathname } = useLocation();
  const pathname = rawPathname.replace(/\/$/, "") || "/";
  useEffect(() => {
    const project = projects.find((p) => pathname === `/projects/${p.number}`);
    const data =
      pageMetadata[pathname] ??
      (project
        ? { title: `Дом «${project.name}» — ОСНОВА`, description: project.description }
        : {
            title: "Страница не найдена — ОСНОВА",
            description:
              "Запрошенная страница не найдена. Откройте главную или каталог проектов ОСНОВА.",
          });
    document.title = data.title;
    const set = (selector: string, content: string) => {
      document.querySelector(selector)?.setAttribute("content", content);
    };
    set('meta[name="description"]', data.description);
    set('meta[property="og:title"]', data.title);
    set('meta[property="og:description"]', data.description);
    set('meta[name="twitter:title"]', data.title);
    set('meta[name="twitter:description"]', data.description);
    const url = `https://alexkhramtsov2001.github.io/osnova${pathname === "/" ? "/" : pathname + "/"}`;
    set('meta[property="og:url"]', url);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", url);
  }, [pathname]);
  return null;
}
