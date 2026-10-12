import type { EstimateStage, HouseParameters } from "./types";

export const DEMO_PRICES_NOTICE =
  "Ориентировочные демонстрационные цены для портфолио. Не являются сметой или коммерческим предложением.";

// Повышать версию и дату при изменении ставок, коэффициентов, сроков или формул.
// Это дата текущего демо-набора, а не дата актуальности цен подрядчиков.
export const DEMO_ESTIMATE_DATA = {
  version: "demo-2026.10.12-1",
  updatedAt: "2026-10-12",
} as const;

// Калибровка нужна только для правдоподобного демонстрационного порядка цены.
// Основана на опубликованных пакетных ценах «от» и не является тарифом ОСНОВЫ.
export const DEMO_PRICE_CALIBRATION = 1.8;
export const DEMO_PRICE_RANGE = { min: 0.85, max: 1.15 } as const;

// Условные сценарии для портфолио, не статистика цен по федеральным округам.
export const DEMO_REGIONS = {
  central: { label: "Центральная Россия", multiplier: 1 },
  northwest: { label: "Северо-Запад", multiplier: 1.05 },
  south: { label: "Юг России", multiplier: 0.97 },
  ural: { label: "Урал", multiplier: 1.07 },
  siberia: { label: "Сибирь", multiplier: 1.1 },
  farEast: { label: "Дальний Восток", multiplier: 1.18 },
} satisfies Record<HouseParameters["region"], { label: string; multiplier: number }>;

// Доставка добавляется один раз к выбранному составу, отдельным демо-платежом.
export const DEMO_DELIVERY = {
  none: { label: "Не учитывать", cost: 0, leadWeeks: 0 },
  near: { label: "До 50 км", cost: 45_000, leadWeeks: 0 },
  regional: { label: "50–300 км", cost: 110_000, leadWeeks: 1 },
  longDistance: { label: "Более 300 км", cost: 220_000, leadWeeks: 2 },
} satisfies Record<HouseParameters["delivery"], { label: string; cost: number; leadWeeks: number }>;

export const PROJECT_TYPES = {
  standard: {
    label: "Типовой проект",
    explanation:
      "Готовая концепция из каталога. В смете показаны только этапы строительства; рабочая документация отдельно не оценена.",
  },
  custom: {
    label: "Индивидуальный проект",
    explanation:
      "Дом разрабатывается под ваши задачи. Стоимость проектирования и уточнения конструкций будет рассчитываться отдельно после задания.",
  },
  clientDrawings: {
    label: "По чертежам заказчика",
    explanation:
      "Можно начать с ваших чертежей. Перед строительством специалист должен проверить их состав и пригодность; такая проверка отдельно не оценена.",
  },
} as const;

export const HOUSE_NUMBER_LIMITS = {
  area: { min: 30, max: 1000, step: 1, label: "Площадь дома" },
  wallHeight: { min: 2.4, max: 5, step: 0.1, label: "Высота стен" },
  perimeter: { min: 10, max: 200, step: 1, label: "Периметр" },
} as const;

// Условные поправки только для этапа стен, а не подтверждённые рыночные тарифы.
export const WALL_MATERIALS = {
  aeratedConcrete: { label: "Газобетон", wallPriceMultiplier: 1 },
  ceramicBlock: { label: "Керамический блок", wallPriceMultiplier: 1.1 },
  brick: { label: "Кирпич", wallPriceMultiplier: 1.3 },
  frame: { label: "Каркас", wallPriceMultiplier: 0.85 },
} satisfies Record<HouseParameters["wallMaterial"], { label: string; wallPriceMultiplier: number }>;

export const DEMO_ESTIMATE_CATALOG: EstimateStage[] = [
  {
    id: "foundation",
    name: "Фундамент",
    description: "Подготовка участка, основание и устройство фундамента",
    priceFactors: "Площадь дома, периметр и выбранный тип фундамента.",
    assumption:
      "Объёмы условные: грунт, перепад высот и несущая способность участка не исследованы.",
    durationWeeks: { min: 2, max: 4 },
    items: [
      {
        id: "foundation-earthworks",
        name: "Разработка грунта",
        unit: "м³",
        quantity: 1,
        unitPrice: 1200,
      },
      {
        id: "foundation-cushion",
        name: "Песчано-щебёночная подушка",
        unit: "м³",
        quantity: 1,
        unitPrice: 3500,
      },
      {
        id: "foundation-formwork",
        name: "Монтаж опалубки",
        unit: "м²",
        quantity: 1,
        unitPrice: 1800,
      },
      {
        id: "foundation-reinforcement",
        name: "Армирование",
        unit: "т",
        quantity: 1,
        unitPrice: 65000,
      },
      {
        id: "foundation-concrete",
        name: "Бетонирование фундамента",
        unit: "м³",
        quantity: 1,
        unitPrice: 8500,
      },
      {
        id: "foundation-waterproofing",
        name: "Гидроизоляция фундамента",
        unit: "м²",
        quantity: 1,
        unitPrice: 650,
      },
    ],
  },
  {
    id: "walls",
    name: "Коробка дома",
    description: "Несущие стены, перегородки и перемычки",
    priceFactors: "Площадь, периметр и высота стен, этажность, число комнат и материал стен.",
    assumption:
      "Площадь проёмов и количество перегородок оценены по упрощённой модели, без планировки.",
    durationWeeks: { min: 4, max: 7 },
    items: [
      {
        id: "walls-blocks",
        name: "Кладка наружных стен",
        unit: "м²",
        quantity: 1,
        unitPrice: 4200,
      },
      {
        id: "walls-partitions",
        name: "Устройство внутренних перегородок",
        unit: "м²",
        quantity: 1,
        unitPrice: 1800,
      },
      {
        id: "walls-lintel",
        name: "Монтаж перемычек над проёмами",
        unit: "шт.",
        quantity: 1,
        unitPrice: 4500,
      },
      {
        id: "walls-armored-belt",
        name: "Устройство армированного пояса",
        unit: "пог. м",
        quantity: 1,
        unitPrice: 2200,
      },
      {
        id: "walls-mortar",
        name: "Кладочный раствор и клей",
        unit: "м²",
        quantity: 1,
        unitPrice: 550,
      },
    ],
  },
  {
    id: "roof",
    name: "Кровля",
    description: "Стропильная система, утепление и покрытие",
    priceFactors: "Площадь дома, этажность, периметр и выбранное покрытие.",
    assumption:
      "Форма и уклон крыши заданы условно; сложные узлы и точная геометрия не рассчитаны.",
    durationWeeks: { min: 2, max: 4 },
    items: [
      {
        id: "roof-structure",
        name: "Монтаж стропильной системы",
        unit: "м²",
        quantity: 1,
        unitPrice: 2200,
      },
      {
        id: "roof-membrane",
        name: "Монтаж подкровельной мембраны",
        unit: "м²",
        quantity: 1,
        unitPrice: 350,
      },
      {
        id: "roof-batten",
        name: "Обрешётка и контробрешётка",
        unit: "м²",
        quantity: 1,
        unitPrice: 650,
      },
      {
        id: "roof-covering",
        name: "Монтаж кровельного покрытия",
        unit: "м²",
        quantity: 1,
        unitPrice: 1800,
      },
      {
        id: "roof-insulation",
        name: "Утепление кровли",
        unit: "м²",
        quantity: 1,
        unitPrice: 1100,
      },
      {
        id: "roof-drainage",
        name: "Монтаж водосточной системы",
        unit: "пог. м",
        quantity: 1,
        unitPrice: 900,
      },
    ],
  },
  {
    id: "windows-doors",
    name: "Окна и двери",
    description: "Изготовление и монтаж оконных и дверных блоков",
    priceFactors: "Площадь и высота наружных стен, этажность, число спален и санузлов.",
    assumption:
      "Остекление условно равно 15% площади стен; размеры, профиль и комплектация блоков не выбраны.",
    durationWeeks: { min: 1, max: 2 },
    items: [
      {
        id: "windows-units",
        name: "Оконные блоки с монтажом",
        unit: "м²",
        quantity: 1,
        unitPrice: 18000,
      },
      {
        id: "doors-exterior",
        name: "Входная дверь с монтажом",
        unit: "шт.",
        quantity: 1,
        unitPrice: 45000,
      },
      {
        id: "doors-interior",
        name: "Межкомнатные двери с монтажом",
        unit: "шт.",
        quantity: 1,
        unitPrice: 14000,
      },
      {
        id: "windows-sills",
        name: "Подоконники и отливы",
        unit: "пог. м",
        quantity: 1,
        unitPrice: 1200,
      },
    ],
  },
  {
    id: "facade",
    name: "Фасад",
    description: "Подготовка стен, утепление и наружная отделка",
    priceFactors: "Площадь наружных стен через периметр, высоту и этажность.",
    assumption: "Тип фасадной системы и толщина утепления не подбираются под климат и проект.",
    durationWeeks: { min: 2, max: 4 },
    items: [
      {
        id: "facade-preparation",
        name: "Подготовка поверхности стен",
        unit: "м²",
        quantity: 1,
        unitPrice: 350,
      },
      {
        id: "facade-insulation",
        name: "Утепление фасада",
        unit: "м²",
        quantity: 1,
        unitPrice: 1800,
      },
      {
        id: "facade-mesh",
        name: "Армирующий слой со стеклосеткой",
        unit: "м²",
        quantity: 1,
        unitPrice: 750,
      },
      {
        id: "facade-finish",
        name: "Декоративная фасадная отделка",
        unit: "м²",
        quantity: 1,
        unitPrice: 1300,
      },
    ],
  },
  {
    id: "engineering",
    name: "Инженерные системы",
    description: "Электрика, отопление, водоснабжение и канализация",
    priceFactors: "Площадь дома и число санузлов для условного количества точек.",
    assumption: "Подключение к внешним сетям, источник тепла и состав оборудования не рассчитаны.",
    durationWeeks: { min: 3, max: 5 },
    items: [
      {
        id: "engineering-electricity",
        name: "Электромонтажные работы",
        unit: "м² дома",
        quantity: 1,
        unitPrice: 1800,
      },
      {
        id: "engineering-heating",
        name: "Монтаж системы отопления",
        unit: "м² дома",
        quantity: 1,
        unitPrice: 2400,
      },
      {
        id: "engineering-water",
        name: "Разводка водоснабжения",
        unit: "точка",
        quantity: 1,
        unitPrice: 6500,
      },
      {
        id: "engineering-sewerage",
        name: "Разводка канализации",
        unit: "точка",
        quantity: 1,
        unitPrice: 5500,
      },
      {
        id: "engineering-ventilation",
        name: "Вентиляционные каналы",
        unit: "шт.",
        quantity: 1,
        unitPrice: 9000,
      },
    ],
  },
  {
    id: "interior",
    name: "Внутренняя отделка",
    description: "Черновая подготовка и чистовая отделка помещений",
    priceFactors: "Площадь дома, площадь стен, число санузлов и уровень отделки.",
    assumption:
      "Материалы и объём отделки каждой комнаты не выбраны; плитка и покрытия оценены условно.",
    durationWeeks: { min: 5, max: 8 },
    items: [
      {
        id: "interior-plaster",
        name: "Штукатурка стен",
        unit: "м²",
        quantity: 1,
        unitPrice: 750,
      },
      {
        id: "interior-screed",
        name: "Стяжка пола",
        unit: "м²",
        quantity: 1,
        unitPrice: 900,
      },
      {
        id: "interior-ceiling",
        name: "Отделка потолков",
        unit: "м²",
        quantity: 1,
        unitPrice: 1100,
      },
      {
        id: "interior-walls-finish",
        name: "Шпаклёвка и окраска стен",
        unit: "м²",
        quantity: 1,
        unitPrice: 950,
      },
      {
        id: "interior-floor-finish",
        name: "Укладка напольного покрытия",
        unit: "м²",
        quantity: 1,
        unitPrice: 1200,
      },
      {
        id: "interior-tiles",
        name: "Укладка плитки",
        unit: "м²",
        quantity: 1,
        unitPrice: 1800,
      },
    ],
  },
  {
    id: "completion",
    name: "Завершение работ",
    description: "Установка оборудования и окончательная подготовка дома",
    priceFactors: "Площадь, число спален и санузлов для условного числа приборов, дверей и точек.",
    assumption: "Конкретные модели сантехники, света и оборудования не выбраны.",
    durationWeeks: { min: 1, max: 2 },
    items: [
      {
        id: "completion-plumbing",
        name: "Установка сантехнических приборов",
        unit: "шт.",
        quantity: 1,
        unitPrice: 7500,
      },
      {
        id: "completion-lighting",
        name: "Установка светильников и розеток",
        unit: "точка",
        quantity: 1,
        unitPrice: 1200,
      },
      {
        id: "completion-interior-doors",
        name: "Регулировка дверей и фурнитуры",
        unit: "шт.",
        quantity: 1,
        unitPrice: 1500,
      },
      {
        id: "completion-cleaning",
        name: "Финальная уборка",
        unit: "м² дома",
        quantity: 1,
        unitPrice: 180,
      },
    ],
  },
];

export const DEFAULT_HOUSE_PARAMETERS: HouseParameters = {
  projectType: "standard",
  region: "central",
  delivery: "none",
  area: 120,
  floors: 1,
  bedrooms: 3,
  wallMaterial: "aeratedConcrete",
  foundation: "strip",
  roof: "metal",
  finish: "standard",
  wallHeight: 3,
  perimeter: 44,
  bathrooms: 2,
};
