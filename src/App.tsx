import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router";
import RouteScrollManager from "./components/RouteScrollManager";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import AccountPage from "./features/account/AccountPage";
import HouseFinder from "./features/finder/HouseFinder";

import {
  FAVORITES_STORAGE_KEY,
  readFavoriteIds,
  writeFavoriteIds,
} from "./features/projects/favorites";

import { defaultCatalogFilters, type CatalogFilters } from "./features/projects/catalogFilters";

import "./App.css";
import ComparisonPage from "./pages/ComparisonPage";
import HomeEntry from "./components/HomeEntry";
import ProjectsPage from "./pages/ProjectsPage";
import CalculatorPage from "./pages/CalculatorPage";
import AboutPage from "./pages/AboutPage";
import PartnersPage from "./pages/PartnersPage";
import ContactsPage from "./pages/ContactsPage";
import VacanciesPage from "./pages/VacanciesPage";
import PaymentPage from "./pages/PaymentPage";
import PageMetadata from "./components/PageMetadata";
import "./pages/ContentPages.css";
import ProjectPage from "./pages/ProjectPage";
function App() {
  const [favoriteProjects, setFavoriteProjects] = useState<string[]>(() =>
    readFavoriteIds(window.localStorage),
  );
  const [showFavorites, setShowFavorites] = useState(false);
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(defaultCatalogFilters);

  useEffect(() => {
    writeFavoriteIds(window.localStorage, favoriteProjects);
  }, [favoriteProjects]);

  useEffect(() => {
    const syncFavorites = (event: StorageEvent) => {
      if (event.key === FAVORITES_STORAGE_KEY)
        setFavoriteProjects(readFavoriteIds(window.localStorage));
    };
    window.addEventListener("storage", syncFavorites);
    return () => window.removeEventListener("storage", syncFavorites);
  }, []);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  return (
    <>
      <RouteScrollManager />
      <PageMetadata />
      <Routes>
        <Route path="/" element={<HomeEntry />} />
        <Route path="/calculator" element={<CalculatorPage key={window.location.search} />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/vacancies" element={<VacanciesPage />} />
        <Route
          path="/projects"
          element={
            <ProjectsPage
              favoriteProjects={favoriteProjects}
              setFavoriteProjects={setFavoriteProjects}
              showFavorites={showFavorites}
              setShowFavorites={setShowFavorites}
              comparisonIds={comparisonIds}
              setComparisonIds={setComparisonIds}
              catalogFilters={catalogFilters}
              setCatalogFilters={setCatalogFilters}
            />
          }
        />
        <Route
          path="/compare"
          element={
            <ComparisonPage
              favoriteProjects={favoriteProjects}
              setComparisonIds={setComparisonIds}
            />
          }
        />
        <Route path="/find-home" element={<HouseFinder />} />
        <Route
          path="/account"
          element={
            <AccountPage favoriteIds={favoriteProjects} onFavoritesChange={setFavoriteProjects} />
          }
        />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route
          path="*"
          element={
            <div className="site-shell">
              <SiteHeader />
              <main className="project-not-found">
                <h1>Страница не найдена.</h1>
                <Link to="/">На главную</Link>
              </main>
              <SiteFooter />
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;
