# v2.13-D — Формальные контракты

`.osnova` envelope:
```json
{"fileType":"osnova-plan","formatVersion":"1.0.0","exportedAt":"2026-10-15T12:00:00.000Z","project":{},"snapshots":[]}
```
Это только форма контейнера, пустой project **не валиден**. Semver плюс явный список миграций; не отбрасывать неизвестные критические поля.

WorkerRequest: `{requestId,operation:"generate"|"validate"|"solveEdit"|"quantityTakeoff",projectId,projectRevision,geometryRevision?,pricingRevision?,engineVersion,payload}`. Ответы discriminated union: `progress{requestId,stage,completedSteps}`, `result{requestId,projectRevision,result}`, `error{requestId,code,message}`. Payload каждого operation строго типизирован и runtime-валидируется. Generator дополнительно seed, stepBudget, stopReason, optimalityProven. Отмена по requestId; при долгом синхронном вычислении Worker не обработает cancel до yield — дробить работу на чанки либо terminate/restart. Никогда не применять частичный или устаревший результат.

ProjectCommand `{commandId,projectId,baseRevision,type,payload}`. Controller сверяет baseRevision, строит candidate, валидирует, показывает preview, после подтверждения делает atomic IndexedDB CAS по revision. Вариант durable-first: не объявлять committed/saved до завершения записи; при optimistic UI явно показывать pending и откат/резервную копию при ошибке. BroadcastChannel не заменяет CAS.

ValidationIssue `{code,severity,objectId?,floorId?,message,suggestedAction?}`; critical блокирует. GenerationResult success(candidate,score,checkedCandidates,optimalityProven,stopReason?) либо infeasible (только доказано), timeout, stepLimit, cancelled, invalidInput, internalError.

Ошибки: AREA_TARGET_MISMATCH, WALL_LOCKED, ROOM_UNREACHABLE, STAIR_FLOOR_MISMATCH, SOLVER_NO_SOLUTION, STORAGE_WRITE_FAILED, REVISION_CONFLICT, IMPORT_INVALID_JSON, IMPORT_UNSUPPORTED_VERSION, IMPORT_INVALID_GEOMETRY, ESTIMATE_OUTDATED, PDF_EXPORT_FAILED, WORKER_TIMEOUT, WORKER_CANCELLED.

PDF использует одну immutable подтверждённую ревизию, актуальную смету и полную валидацию. Быстрый калькулятор и PLAN используют общий каталог, но разные источники количеств.
