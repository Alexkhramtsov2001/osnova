# Интеграция OSNOVA

По ранее проверенной версии: React 19, TS, Vite, React Router, jsPDF, Vitest, Playwright, ESLint/Prettier; GitHub Pages base `/osnova/`. Проверить актуальные версии в репозитории. Быстрый калькулятор `src/features/estimate/` с `HouseParameters`: этажи, технология, регион, доставка, площадь, фундамент, крыша, отделка и приблизительные формулы. Этапы foundation, walls, roof, windows-doors, facade, engineering, interior, completion. Старое сохранение `osnova.saved-estimates.v1` (макс. 8) не трогать. PDF шрифт из `${import.meta.env.BASE_URL}fonts/NotoSans-Regular.ttf`. Supabase применяется для других функций, геометрию планировщика туда не отправлять.

Перед кодом проверить `git status`, package.json, vite.config, tsconfig, src/App.tsx, маршруты, tests, PDF assets, build/deploy. Новые модули в `src/features/plan/`, совместимые адаптеры цен, без подмены старого калькулятора.
