export type SelectionProps = {
  favoriteProjects: string[];
  setFavoriteProjects: React.Dispatch<React.SetStateAction<string[]>>;
  showFavorites: boolean;
  setShowFavorites: React.Dispatch<React.SetStateAction<boolean>>;
  comparisonIds: string[];
  setComparisonIds: React.Dispatch<React.SetStateAction<string[]>>;
  catalogFilters: CatalogFilters;
  setCatalogFilters: React.Dispatch<React.SetStateAction<CatalogFilters>>;
};

export type CatalogFilters = { area: string; floors: string; bedrooms: string; price: string };
export const defaultCatalogFilters: CatalogFilters = {
  area: "all",
  floors: "all",
  bedrooms: "all",
  price: "all",
};

export const comparisonUrl = (ids: readonly string[]) => `/compare?projects=${ids.join(",")}`;
