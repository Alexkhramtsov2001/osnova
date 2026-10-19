# v2.10 + v2.12 — Архитектура

> **Архив от 15.10.2026, не действующее ТЗ или инструкция.** Для v1 применяются [V1_SPECIFICATION.md](../V1_SPECIFICATION.md), для порядка работы — [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md). При расхождении они имеют приоритет над текстом ниже. Старые допуски, статусы поиска, объём редактора, маршруты и проверки не переносить в реализацию без сверки; приёмка v1 — раздел 11 спецификации. Исходный текст сохранён для истории.

Project Controller — единственный владелец commit канонического проекта. Generator, solver, validator, QuantityTakeoff, estimate, PDF — независимые функции над immutable входом. UI state (selection, camera, drag preview) отдельно. Кэш вычислений derived, маркирован geometryRevision/pricingRevision/catalogVersion/engineVersion.

Предлагаемая структура `src/features/plan/{app,domain,engine/geometry,engine/generator,engine/solver,engine/validator,adapters,editor,estimate,persistence,export,workers,pages,components,tests}`; уточнить после аудита репозитория.

Ревизии: `projectRevision` любое изменение канонического состояния; `geometryRevision` геометрия; `pricingRevision` ценовые настройки; `calculationVersion` версия алгоритмов. Stale Worker-result не применяется. `command → candidate → solve → validate → preview → confirm → commit/save → invalidate/recompute`. Статусы сохранения clean/pendingCommit/saving/saveFailed/conflict/recoveryRequired. Durable save failure показывается пользователю; резервный экспорт.

API: generatePlan, validateProject, solveEdit, calculateGeometry, buildQuantityTakeoff, calculateEstimate, serializeProject, importProject, exportPlanPdf, exportEstimatePdf. Workers не зависят от React/DOM/IndexedDB.
