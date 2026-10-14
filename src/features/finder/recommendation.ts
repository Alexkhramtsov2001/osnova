import { projects, type Project } from "../projects/catalog";
import { getProjectEstimate } from "../projects/estimates";

export const questions = [
  {
    id: "purpose",
    title: "Как вы планируете жить в доме?",
    options: [
      { value: "permanent", label: "Постоянно, круглый год" },
      { value: "weekends", label: "Приезжать на выходные" },
      { value: "summer", label: "Проводить лето за городом" },
    ],
  },
  {
    id: "bedrooms",
    title: "Сколько отдельных спален нужно?",
    hint: "Учтите детей, гостей и комнату, которую хотите использовать как кабинет.",
    options: [
      { value: "2", label: "Две" },
      { value: "3", label: "Три" },
      { value: "4", label: "Четыре" },
      { value: "5", label: "Пять" },
    ],
  },
  {
    id: "floors",
    title: "Какой вариант этажности удобнее?",
    options: [
      { value: "1", label: "Один этаж, без лестницы" },
      { value: "2", label: "Два этажа" },
      { value: "any", label: "Любая доступная этажность" },
    ],
  },
  {
    id: "area",
    title: "Какая площадь вам ближе?",
    options: [
      { value: "compact", label: "Компактный дом — до 120 м²" },
      { value: "medium", label: "Средний — от 121 до 160 м²" },
      { value: "large", label: "Просторный — больше 160 м²" },
      { value: "any", label: "Пока не определился" },
    ],
  },
  {
    id: "plot",
    title: "Насколько важно оставить место на участке?",
    hint: "Это предварительный выбор. Размеры, отступы и размещение дома нужно проверять по плану участка.",
    options: [
      { value: "compact", label: "Важно небольшое пятно застройки" },
      { value: "spacious", label: "Места достаточно" },
      { value: "any", label: "Участок ещё выбираю" },
    ],
  },
  {
    id: "budget",
    title: "На какой бюджет ориентироваться?",
    hint: "Сравниваем условные ориентиры каталога под ключ. Это демонстрационные цены, без участка и проектирования.",
    options: [
      { value: "9", label: "До 9 млн ₽" },
      { value: "12", label: "До 12 млн ₽" },
      { value: "any", label: "Без ограничения на этом этапе" },
    ],
  },
  {
    id: "priority",
    title: "Что для вас важнее всего?",
    options: [
      { value: "economy", label: "Умеренная стоимость и компактность" },
      { value: "space", label: "Простор для семьи и гостей" },
      { value: "garden", label: "Отдых рядом с садом и террасой" },
    ],
  },
] as const;

export type Answers = Record<(typeof questions)[number]["id"], string>;
export type Recommendation = {
  project: Project;
  reasons: string[];
};

// All explicit requirements are filters. Preference ranking never relaxes them.
export function matchingProjects(answers: Partial<Answers>): readonly Project[] {
  return projects.filter((project) => {
    if (answers.purpose === "permanent" && project.number === "06") return false;
    if (answers.bedrooms && project.bedrooms !== Number(answers.bedrooms)) return false;
    if (answers.floors && answers.floors !== "any" && project.floors !== Number(answers.floors))
      return false;
    if (answers.area === "compact" && project.area > 120) return false;
    if (answers.area === "medium" && (project.area <= 120 || project.area > 160)) return false;
    if (answers.area === "large" && project.area <= 160) return false;
    if (answers.plot === "compact" && project.area / project.floors > 100) return false;
    if (
      answers.budget &&
      answers.budget !== "any" &&
      getProjectEstimate(project).maxTotal > Number(answers.budget) * 1_000_000
    )
      return false;
    if (answers.priority === "garden" && !["03", "06"].includes(project.number)) return false;
    return true;
  });
}

export function answersBefore(
  answers: Partial<Answers>,
  questionId: keyof Answers,
): Partial<Answers> {
  const prefix: Partial<Answers> = {};
  for (const question of questions) {
    if (question.id === questionId) break;
    if (answers[question.id]) prefix[question.id] = answers[question.id];
  }
  return prefix;
}

export function availableOptions(questionId: keyof Answers, answers: Partial<Answers>) {
  const question = questions.find((entry) => entry.id === questionId)!;
  const prefix = answersBefore(answers, questionId);
  return question.options.filter(
    (option) => matchingProjects({ ...prefix, [questionId]: option.value }).length > 0,
  );
}

export function updateAnswer(
  answers: Partial<Answers>,
  questionId: keyof Answers,
  value: string,
): Partial<Answers> {
  if (!availableOptions(questionId, answers).some((option) => option.value === value))
    return answers;
  if (answers[questionId] === value) return answers;
  return { ...answersBefore(answers, questionId), [questionId]: value };
}

export function recommendProject(answers: Answers): Recommendation | null {
  if (
    questions.some(
      (question) => !question.options.some((option) => option.value === answers[question.id]),
    )
  )
    return null;
  const ranked = [...matchingProjects(answers)].sort((a, b) => {
    if (answers.priority === "space") return b.area - a.area;
    return (
      getProjectEstimate(a).maxTotal - getProjectEstimate(b).maxTotal ||
      a.number.localeCompare(b.number)
    );
  });
  const project = ranked[0];
  if (!project) return null;
  const reasons = [
    `Спален: ${project.bedrooms} — соответствует вашему выбору.`,
    `${project.floors === 1 ? "Один этаж" : "Два этажа"} — подходит по выбранной этажности.`,
    `${project.area} м² — ${answers.area === "any" ? "площадь выбранного дома" : "в выбранном диапазоне площади"}.`,
  ];
  if (answers.plot === "compact")
    reasons.push("Расчётное пятно застройки до 100 м²: площадь дома, делённая на этажность.");
  if (answers.budget !== "any")
    reasons.push("Верхняя граница демо-оценки укладывается в выбранный бюджет.");
  if (answers.priority === "garden")
    reasons.push("Концепция с акцентом на отдых рядом с садом и террасой.");
  if (answers.priority === "economy")
    reasons.push("Наименьший ориентир стоимости среди подходящих вариантов.");
  if (answers.priority === "space") reasons.push("Наибольшая площадь среди подходящих вариантов.");
  return { project, reasons };
}
