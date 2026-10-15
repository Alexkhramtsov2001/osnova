# v2.3 + v2.13-B — Модель данных

`Project`: id, name, createdAt, updatedAt, projectRevision, geometryRevision, pricingRevision, requirements, building, constructionSettings, pricingSettings, calculationMetadata, geometryStatus (`notGenerated|valid|requiresRegeneration`). Версия файлового контейнера `.osnova` отличается от версии внутренней модели.

`RoomRequirement`: UUID, type, name, targetAreaQ4, floorPreference, adjacencyPreferences, orientationPreference, required. Ввод м² преобразуется точно, без скрытого округления. Требования не исчезают после объединения комнат.

`Building`: наружный footprint widthMm/depthMm, floorCount, floors, walls, rooms, openings, stairs, functionalZones, furniture, roof.

`Floor`: id, level, elevationMm, clearHeightMm, ссылки на объекты.

`Wall`: id, floorId, start/end integer mm, thicknessMm, heightMm, classification exterior/loadBearing/partition, materialId, structuralTemplateId, openingIds, locked.

`Room`: id, floorId, name/type, requirementIds, zoneIds и семантические атрибуты. Полигон и actualArea вычисляются из стен; кэш допустим только с версиями и перепроверкой.

`FunctionalZone`: id, roomId, name/type, виртуальная геометрия, requirementIds. Обязательные зоны не перекрываются и лежат внутри комнаты.

`Opening`: id, wallId, kind door/window/openPassage, offsetMm, widthMm, heightMm, sillHeightMm, doorType, swingDirection, locked.

`Stair`: единый id, fromFloorId/toFloorId, type, position, rotation, widthMm, flights, landings, stepCount, slabOpening.

`Furniture`: id, roomId, type, position/rotation, footprint, clearanceZones, required; скрытая мебель продолжает участвовать в проверках.

`ConstructionSettings`: technology, templateId/version, materials, wall thicknesses, foundation, slabs, roof. `PricingSettings`: region, catalogVersion, overrides, delivery, stages, contingency.

Snapshots отдельно, без рекурсивного включения в Project. UI selection/camera, Undo history, Worker state и derived quantities не являются каноническими полями. UUID стабильны; ссылки валидируются, удаление связанных объектов атомарно. Требуются строгие runtime schemas, одного TypeScript недостаточно.
