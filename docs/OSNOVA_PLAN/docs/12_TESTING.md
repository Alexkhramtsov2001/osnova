# v2.11 — Тестирование

Vitest unit/integration/contract; Playwright E2E, visual, performance, accessibility, PWA. 30 фиксированных генераторных сценариев: 10 простых одноэтажных, 10 сложных одноэтажных, 10 двухэтажных. Для известных feasible сценариев — witness layout, чтобы различать ошибку поиска и математическую невозможность. Отдельно negative/timeout/unknown. Seed и stepBudget фиксированы.

Геометрия: ортогональность, half-mm faces, exact target ±0,005, union L/T/X, нулевые стены, пересечения, balance, door access, stair slab void, stable IDs. Генерация: этажи, соседства, двери, мебель, cancellation, timeout, deterministic, best candidate. Редактор: locked, compensation, preview, undo/redo. Смета: геометрические аналитические примеры, отсутствие double count, provenance, revision invalidation. Storage: IndexedDB error, two-tab conflict, `.osnova` roundtrip, unsupported version, malicious import. PDF: кириллица, размеры, одна ревизия. PWA: offline после кэширования. Регрессия: каталог, быстрый калькулятор, существующий PDF, маршруты, GitHub Pages, Supabase демо-функции.

OSS PoC 10 проверок: лицензия, сборка, TS, integer mm, shared walls, thickness, L/T/X, openings, serialization, performance. Не принимать библиотеку до проверки.
