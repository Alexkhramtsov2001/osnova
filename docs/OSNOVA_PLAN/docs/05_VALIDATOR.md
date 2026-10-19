# v2.5 — Валидатор

> **Архив от 15.10.2026, не действующее ТЗ или инструкция.** Для v1 применяются [V1_SPECIFICATION.md](../V1_SPECIFICATION.md), для порядка работы — [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md). При расхождении они имеют приоритет над текстом ниже. Старые допуски, статусы поиска, объём редактора, маршруты и проверки не переносить в реализацию без сверки; приёмка v1 — раздел 11 спецификации. Исходный текст сохранён для истории.

Чистая функция `validateProject(project) -> {valid,issues[]}`; issues: code, severity (`critical|warning|recommendation`), objectId?, floorId?, message, suggestedAction?. Critical блокирует подтверждение/импорт/PDF; warning допускает продолжение с пояснением; recommendation — совет.

GEO: ортогональность, соединения, wall union, самопересечения, площадь, баланс, габариты. TOPO: соседства и достижимость от входа через реальные двери. STRUCT: locked несущие стены, шаблоны материалов и проёмов. OPENINGS: offset, ширина, пересечения, дуга двери. STAIR: этажи, доступ, площадки и slabOpening. FURNITURE: footprint и clearance, даже для скрытой мебели. DATA: ID, ссылки, версии, типы. ESTIMATE: ревизии и provenance.

Коды: AREA_TARGET_MISMATCH, WALL_LOCKED, ROOM_OVERLAP, WALL_DISCONNECTED, ROOM_UNREACHABLE, OPENING_OUT_OF_WALL, STAIR_FLOOR_MISMATCH, FURNITURE_CLEARANCE_FAILED, AREA_LEDGER_MISMATCH, INVALID_REFERENCE, ESTIMATE_OUTDATED.

Полная проверка при генерации, импорте, снимке, принятии редакторской правки и PDF. Быстрая инкрементальная проверка во время drag. Валидатор не исправляет и не мутирует модель, не доверяет сохранённым кэшам площадей.
