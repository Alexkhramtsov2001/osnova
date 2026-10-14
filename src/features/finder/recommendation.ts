import { projects, type Project } from "../projects/catalog";
import { getProjectEstimate } from "../projects/estimates";

export type Answers = Record<string, string>;
export type Option = { value: string; label: string; factor?: string };
export type BankQuestion = {
  id: string;
  title: string;
  hint?: string;
  kind: "purpose" | "bedrooms" | "floors" | "area" | "plot" | "budget" | "preference";
  options: readonly [Option, Option, Option, Option];
};

// The bank is larger than one questionnaire. The selector chooses seven prompts
// for each run and replaces unavailable catalogue filters with neutral preferences.
export const questionBank: readonly BankQuestion[] = [
  {
    id: "purpose",
    title: "Как вы планируете проводить время за городом?",
    kind: "purpose",
    options: [
      { value: "permanent", label: "Жить постоянно, круглый год" },
      { value: "weekends", label: "Приезжать на выходные" },
      { value: "summer", label: "Проводить лето и отпуск" },
      { value: "undecided", label: "Пока не решил" },
    ],
  },
  {
    id: "bedrooms",
    title: "Сколько отдельных спален вам нужно?",
    hint: "Учтите детей, гостей и возможный кабинет.",
    kind: "bedrooms",
    options: [
      { value: "2", label: "Две спальни" },
      { value: "3", label: "Три спальни" },
      { value: "4", label: "Четыре спальни" },
      { value: "5", label: "Пять спален" },
    ],
  },
  {
    id: "floors",
    title: "Какую этажность дома вы рассматриваете?",
    kind: "floors",
    options: [
      { value: "1", label: "Один этаж" },
      { value: "2", label: "Два этажа" },
      { value: "any", label: "Готов рассмотреть оба варианта" },
      { value: "recommend", label: "Выберите из доступных проектов" },
    ],
  },
  {
    id: "area",
    title: "Какой размер дома вам подходит?",
    kind: "area",
    options: [
      { value: "compact", label: "Компактный — до 120 м²" },
      { value: "medium", label: "Средний — 121–160 м²" },
      { value: "large", label: "Просторный — больше 160 м²" },
      { value: "any", label: "Выберите из доступных проектов" },
    ],
  },
  {
    id: "plot",
    title: "Сколько места хотите оставить на участке?",
    hint: "Размеры участка и отступы нужно проверить отдельно по его плану.",
    kind: "plot",
    options: [
      { value: "compact", label: "Важно компактное пятно дома" },
      { value: "spacious", label: "На участке достаточно места" },
      { value: "any", label: "Учитывать оба варианта" },
      { value: "recommend", label: "Выберите из доступных проектов" },
    ],
  },
  {
    id: "budget",
    title: "Какой бюджет под ключ взять за ориентир?",
    hint: "Цены каталога демонстрационные, без стоимости участка и проектирования.",
    kind: "budget",
    options: [
      { value: "9", label: "До 9 млн ₽" },
      { value: "12", label: "До 12 млн ₽" },
      { value: "15", label: "До 15 млн ₽" },
      { value: "any", label: "Пока без ограничения" },
    ],
  },
  {
    id: "priority",
    title: "Что важнее при выборе дома?",
    kind: "preference",
    options: [
      { value: "economy", label: "Умеренный бюджет", factor: "economy" },
      { value: "space", label: "Больше пространства", factor: "space" },
      { value: "garden", label: "Связь с садом и террасой", factor: "garden" },
      { value: "family", label: "Удобство для семьи", factor: "family" },
    ],
  },
  {
    id: "roomUse",
    title: "Какую роль дополнительные комнаты будут играть в вашей жизни?",
    kind: "preference",
    options: [
      { value: "guests", label: "Комнаты для гостей", factor: "guests" },
      { value: "work", label: "Кабинет или удалённая работа", factor: "work" },
      { value: "hobbies", label: "Хобби и личное пространство", factor: "space" },
      { value: "family", label: "Комнаты для членов семьи", factor: "family" },
    ],
  },
  {
    id: "weekend",
    title: "Как вы обычно представляете выходной за городом?",
    kind: "preference",
    options: [
      { value: "garden", label: "Проводить время в саду", factor: "garden" },
      { value: "company", label: "Собираться всей семьёй", factor: "family" },
      { value: "quiet", label: "Отдыхать в тишине", factor: "compact" },
      { value: "guests", label: "Принимать друзей", factor: "guests" },
    ],
  },
  {
    id: "future",
    title: "Какой запас на будущее хочется предусмотреть?",
    kind: "preference",
    options: [
      { value: "family", label: "Для растущей семьи", factor: "family" },
      { value: "guests", label: "Для гостей и родных", factor: "guests" },
      { value: "work", label: "Для работы из дома", factor: "work" },
      { value: "minimal", label: "Без лишней площади", factor: "economy" },
    ],
  },
  {
    id: "comfort",
    title: "Что для вас делает повседневную жизнь дома удобнее?",
    kind: "preference",
    options: [
      { value: "onefloor", label: "Обходиться без лестницы", factor: "onefloor" },
      { value: "zones", label: "Разделить общую и тихую зоны", factor: "zones" },
      { value: "together", label: "Простор для общения", factor: "space" },
      { value: "private", label: "Личное пространство у каждого", factor: "family" },
    ],
  },
  {
    id: "setting",
    title: "Что хочется видеть рядом с домом?",
    kind: "preference",
    options: [
      { value: "garden", label: "Сад и зелёный участок", factor: "garden" },
      { value: "terrace", label: "Террасу для отдыха", factor: "garden" },
      { value: "privacy", label: "Уединённое пространство", factor: "compact" },
      { value: "flexible", label: "Пока не определился", factor: "neutral" },
    ],
  },
  {
    id: "hosting",
    title: "Как часто вы планируете принимать гостей?",
    kind: "preference",
    options: [
      { value: "often", label: "Часто, нужны отдельные комнаты", factor: "guests" },
      { value: "sometimes", label: "Иногда, достаточно общей зоны", factor: "space" },
      { value: "rarely", label: "Редко, гости не влияют на выбор", factor: "neutral" },
      { value: "holidays", label: "На праздники и каникулы", factor: "guests" },
    ],
  },
  {
    id: "layout",
    title: "Какое ощущение от планировки вам ближе?",
    kind: "preference",
    options: [
      { value: "open", label: "Больше открытого общего пространства", factor: "space" },
      { value: "separate", label: "Отдельные комнаты для разных дел", factor: "family" },
      { value: "simple", label: "Компактно и без лишних помещений", factor: "economy" },
      { value: "adaptable", label: "Возможность менять назначение комнат", factor: "work" },
    ],
  },
  {
    id: "costs",
    title: "Какой принцип бюджета вам ближе?",
    kind: "preference",
    options: [
      { value: "lower", label: "Уменьшить начальные затраты", factor: "economy" },
      { value: "balance", label: "Сбалансировать площадь и стоимость", factor: "balanced" },
      { value: "space", label: "Вложиться в дополнительное пространство", factor: "space" },
      { value: "flexible", label: "Сначала выбрать подходящий дом", factor: "neutral" },
    ],
  },
] as const;

export const questions = questionBank;
export const QUESTION_COUNT = 7;
export type Recommendation = { project: Project; reasons: string[] };
const byId = (id: string) => questionBank.find((question) => question.id === id)!;

export function matchingProjects(answers: Partial<Answers>): readonly Project[] {
  return projects.filter((project) => {
    if (answers.purpose === "permanent" && project.number === "06") return false;
    if (answers.bedrooms && project.bedrooms !== Number(answers.bedrooms)) return false;
    if (
      answers.floors &&
      !["any", "recommend"].includes(answers.floors) &&
      project.floors !== Number(answers.floors)
    )
      return false;
    if (answers.area && answers.area !== "any") {
      if (answers.area === "compact" && project.area > 120) return false;
      if (answers.area === "medium" && (project.area <= 120 || project.area > 160)) return false;
      if (answers.area === "large" && project.area <= 160) return false;
    }
    if (answers.plot === "compact" && project.area / project.floors > 100) return false;
    if (answers.plot === "spacious" && project.area / project.floors <= 100) return false;
    if (
      answers.budget &&
      answers.budget !== "any" &&
      getProjectEstimate(project).maxTotal > Number(answers.budget) * 1_000_000
    )
      return false;
    return true;
  });
}

function diversity(projectsToCheck: readonly Project[], key: "floors" | "area" | "plot") {
  return new Set(
    projectsToCheck.map((project) =>
      key === "floors"
        ? project.floors
        : key === "area"
          ? project.area <= 120
            ? "compact"
            : project.area <= 160
              ? "medium"
              : "large"
          : project.area / project.floors <= 100
            ? "compact"
            : "spacious",
    ),
  ).size;
}

function hash(value: string) {
  let result = 0;
  for (const char of value) result = (result * 31 + char.charCodeAt(0)) >>> 0;
  return result;
}

export function nextQuestion(
  answers: Partial<Answers>,
  askedIds: readonly string[],
): BankQuestion | null {
  if (askedIds.length >= QUESTION_COUNT) return null;
  if (!askedIds.includes("purpose")) return byId("purpose");
  if (!askedIds.includes("bedrooms")) return byId("bedrooms");
  const candidates = matchingProjects(answers);
  const eligible = [
    diversity(candidates, "floors") > 1 ? "floors" : "",
    diversity(candidates, "area") > 1 ? "area" : "",
    diversity(candidates, "plot") > 1 ? "plot" : "",
    "budget",
  ].filter((id) => id && !askedIds.includes(id));
  if (eligible.length) return byId(eligible[hash(JSON.stringify(answers)) % eligible.length]);
  const softQuestions = questionBank.filter(
    (question) => question.kind === "preference" && !askedIds.includes(question.id),
  );
  if (softQuestions.length === 0) return null;
  const signature = `${JSON.stringify(answers)}:${askedIds.join(",")}`;
  return softQuestions[hash(signature) % softQuestions.length];
}

export function updateAnswer(
  answers: Partial<Answers>,
  questionId: string,
  value: string,
): Partial<Answers> {
  const question = byId(questionId);
  if (!question.options.some((option) => option.value === value)) return answers;
  return { ...answers, [questionId]: value };
}

export function recommendProject(answers: Partial<Answers>): Recommendation | null {
  const candidates = matchingProjects(answers);
  if (!candidates.length) return null;
  const factors = Object.entries(answers)
    .map(
      ([questionId, value]) =>
        byId(questionId).options.find((option) => option.value === value)?.factor,
    )
    .filter((factor): factor is string => Boolean(factor));
  const scored = candidates.map((project) => {
    const estimate = getProjectEstimate(project);
    const score = factors.reduce((sum, factor) => {
      if (factor === "economy") return sum - estimate.maxTotal / 1_000_000;
      if (factor === "space") return sum + project.area / 10;
      if (factor === "garden") return sum + (["03", "06"].includes(project.number) ? 8 : 0);
      if (factor === "onefloor") return sum + (project.floors === 1 ? 8 : -8);
      if (factor === "zones") return sum + (project.floors === 2 ? 4 : 0);
      if (factor === "guests" || factor === "family") return sum + project.bedrooms * 2;
      if (factor === "work") return sum + (project.bedrooms >= 3 ? 2 : 0);
      if (factor === "compact") return sum - project.area / 20;
      if (factor === "balanced") return sum - estimate.maxTotal / 2_000_000 + project.area / 20;
      return sum;
    }, 0);
    return { project, score };
  });
  scored.sort((a, b) => b.score - a.score || a.project.number.localeCompare(b.project.number));
  const project = scored[0].project;
  const reasons = [
    `${project.bedrooms} спальни соответствуют выбранному количеству.`,
    `${project.area} м² и ${project.floors === 1 ? "один этаж" : "два этажа"} подходят под ваши ответы.`,
  ];
  const priority = factors.find((factor) => factor !== "neutral");
  if (priority === "economy")
    reasons.push(
      "Среди подходящих проектов выбран вариант с более низким демо-ориентиром стоимости.",
    );
  if (priority === "space")
    reasons.push("Среди подходящих проектов выбран вариант с большей площадью.");
  if (priority === "garden")
    reasons.push("В рекомендацию включено ваше пожелание об отдыхе рядом с садом.");
  return { project, reasons };
}
