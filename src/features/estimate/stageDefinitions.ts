import type { EstimateItem, EstimateStage, HouseParameters } from "./types";

const item = (id: string, name: string, unit: string, unitPrice: number): EstimateItem => ({
  id,
  name,
  unit,
  unitPrice,
  quantity: 1,
});

export function getStageDefinition(
  stage: EstimateStage,
  parameters: HouseParameters,
): EstimateStage {
  const definition = { ...stage, items: [...stage.items] };
  if (stage.id === "foundation") {
    const assumptions = {
      strip:
        "Демо-лента: ширина 0,5 м, бетонная часть 0,6 м; длина условно равна внешнему периметру. Внутренние несущие линии, грунт и нагрузки не исследованы.",
      slab: "Демо-плита: бетон 0,3 м, подготовка 0,2 м; объёмы зависят от пятна застройки. Грунт, усиления и нагрузки не исследованы.",
      piles:
        "Демо-сваи с ростверком: число опор условно зависит от площади и периметра. Тип свай, шаг, ростверк и совместимость со стенами требуют проектной проверки.",
    };
    definition.assumption = assumptions[parameters.foundation];
    if (parameters.foundation === "piles") {
      definition.description = "Разметка, свайные опоры и ростверк";
      definition.items = [
        item("foundation-layout", "Разметка свайного поля", "компл.", 15000),
        item("foundation-piles", "Свайные опоры — демо-комплект", "шт.", 6500),
        item("foundation-pile-installation", "Монтаж свайных опор", "шт.", 4500),
        item("foundation-grillage", "Устройство ростверка", "пог. м", 5000),
      ];
    }
  }
  if (stage.id === "walls") {
    if (parameters.wallMaterial === "frame") {
      definition.description = "Силовой каркас, обшивка, утепление и перегородки";
      definition.items = [
        item("walls-frame", "Сборка силового каркаса стен", "м²", 2300),
        item("walls-sheathing", "Конструкционная обшивка стен", "м²", 850),
        item("walls-insulation", "Утепление каркасных стен", "м²", 1100),
        item("walls-barrier", "Пароизоляция и герметизация стен", "м²", 350),
        item("walls-partitions", "Каркасные внутренние перегородки", "м²", 1000),
        item("walls-openings", "Усиление оконных и дверных проёмов", "шт.", 3000),
      ];
      definition.assumption =
        "Сечения каркаса, узлы, толщина утепления и проёмы заданы условно. Это не рабочая спецификация.";
    }
    if (parameters.floors === 2) {
      definition.items.push(
        item(
          "walls-intermediate-floor",
          "Межэтажное перекрытие",
          "м²",
          parameters.wallMaterial === "frame" ? 2200 : 3500,
        ),
        item("walls-staircase", "Межэтажная лестница — демо-комплект", "компл.", 180000),
      );
      definition.description += ", межэтажное перекрытие и лестница";
      definition.assumption +=
        " Перекрытие и лестница включены отдельными условными позициями без выбора конструкции.";
    }
  }
  if (parameters.wallMaterial === "frame" && stage.id === "facade") {
    definition.description = "Ветрозащита и вентилируемая наружная отделка";
    definition.items = [
      item("facade-windproofing", "Наружная ветрозащита стен", "м²", 350),
      item("facade-batten", "Подсистема вентилируемого фасада", "м²", 750),
      item("facade-finish", "Монтаж наружной облицовки", "м²", 1300),
    ];
    definition.assumption =
      "Утепление учтено в каркасных стенах. Материал облицовки, узлы и климатическая пригодность отдельно не подобраны.";
  }
  if (parameters.wallMaterial === "frame" && stage.id === "interior") {
    definition.items = definition.items.map((position) =>
      position.id === "interior-plaster"
        ? item("interior-lining", "Внутренняя листовая обшивка стен", "м²", 750)
        : position,
    );
  }
  return definition;
}
