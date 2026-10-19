# v2.8 — IndexedDB, PWA, `.osnova`, PDF

> **Архив от 15.10.2026, не действующее ТЗ или инструкция.** Для v1 применяются [V1_SPECIFICATION.md](../V1_SPECIFICATION.md), для порядка работы — [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md). При расхождении они имеют приоритет над текстом ниже. Старые допуски, статусы поиска, объём редактора, маршруты и проверки не переносить в реализацию без сверки; приёмка v1 — раздел 11 спецификации. Исходный текст сохранён для истории.

База `osnova-plan-db`, stores `projects`, `snapshots`, `preferences`, `priceOverrides`, `metadata`. Транзакционное сохранение, явные ошибки, без тихого fallback в localStorage. Не менять существующий ключ `osnova.saved-estimates.v1`. Снимки отдельно, без циклов. Две вкладки: проверка ожидаемой projectRevision внутри IndexedDB readwrite transaction; BroadcastChannel только уведомляет. При конфликте не применять last-write-wins; предложить обновление/экспорт локального состояния/копию.

`.osnova` — UTF-8 JSON envelope `fileType:"osnova-plan", formatVersion:"1.0.0", exportedAt, project, snapshots`. Формат контейнера и внутренняя schema version отдельно. Импорт: размер, UTF-8, JSON, версия, runtime schema, поддерживаемые миграции, ссылочная/геометрическая валидация, предпросмотр, подтверждение, атомарная запись. Недоверенные файлы: ограничения размера, количества объектов и вложенности; запрет исполнения кода и внешних загрузок; не доверять derived cache. Нет UI-transients и Undo history.

PWA офлайн после первого успешного кэширования: HTML/CSS/JS, Workers, шрифты, базовые цены, PDF. Учесть GitHub Pages base `/osnova/`, Safari, обновление service worker. Supabase не используется для планов.

PDF: A3 векторный размерный план по этажам, A4 отчёт со сметой, предупреждениями и версиями; jsPDF и локальный Unicode-шрифт. Полная валидация и immutable snapshot перед экспортом. План ревизии N нельзя смешивать со сметой N-1. Дисклеймер «Концептуальная планировка — не для строительства».
