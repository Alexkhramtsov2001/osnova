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
      { value: "any", label: "Готов рассмотреть оба" },
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
  compromises: string[];
  score: number;
};

export function recommendProject(answers: Answers): Recommendation {
  const ranked = projects.map((project): Recommendation => {
    const reasons: string[] = [];
    const compromises: string[] = [];
    let score = 0;
    const wantedBedrooms = Number(answers.bedrooms);
    if (project.bedrooms === wantedBedrooms)
      reasons.push(`Спален: ${wantedBedrooms} — соответствует вашему выбору.`);
    else if (project.bedrooms < wantedBedrooms) {
      score += (wantedBedrooms - project.bedrooms) * 35;
      compromises.push(`Нужно ${wantedBedrooms} спален, здесь — ${project.bedrooms}.`);
    } else {
      score += (project.bedrooms - wantedBedrooms) * 8;
      compromises.push(
        `Спален больше, чем вы выбрали: ${project.bedrooms} вместо ${wantedBedrooms}.`,
      );
    }
    if (answers.floors !== "any") {
      if (project.floors === Number(answers.floors))
        reasons.push(
          project.floors === 1
            ? "Один этаж — повседневные маршруты без лестницы."
            : "Два этажа, как вы предпочли.",
        );
      else {
        score += 45;
        compromises.push(
          `Выбранная этажность: ${answers.floors}; у этого дома — ${project.floors}.`,
        );
      }
    }
    const areaMatch =
      answers.area === "any" ||
      (answers.area === "compact"
        ? project.area <= 120
        : answers.area === "medium"
          ? project.area > 120 && project.area <= 160
          : project.area > 160);
    if (answers.area !== "any") {
      if (areaMatch) reasons.push(`${project.area} м² — в выбранном диапазоне площади.`);
      else {
        score += 18;
        compromises.push(`${project.area} м² — вне выбранного диапазона площади.`);
      }
    }
    if (answers.plot === "compact") {
      if (project.area / project.floors <= 100)
        reasons.push(
          "Небольшое расчётное пятно застройки: площадь, делённая на этажность, до 100 м².",
        );
      else {
        score += 20;
        compromises.push(
          "Для этого дома потребуется больше места на участке; проверьте размеры по плану.",
        );
      }
    }
    const estimate = getProjectEstimate(project);
    if (answers.budget !== "any") {
      const limit = Number(answers.budget) * 1_000_000;
      if (estimate.maxTotal <= limit)
        reasons.push("Верхняя граница демо-оценки укладывается в выбранный бюджет.");
      else {
        score += 30 + Math.min(40, (estimate.maxTotal / limit - 1) * 50);
        compromises.push("Верхняя граница демо-оценки превышает выбранный бюджет.");
      }
    }
    if (answers.purpose === "summer" || answers.purpose === "weekends") {
      if (["03", "06"].includes(project.number)) {
        score -= 7;
        reasons.push(
          "Концепция с акцентом на загородный отдых подходит вашему сценарию посещений.",
        );
      }
    } else if (project.number === "06") {
      score += 8;
      compromises.push(
        "Концепция рассчитана на сезонный отдых: для постоянного проживания нужно уточнить утепление и отопление.",
      );
    }
    if (answers.priority === "economy") score += project.area / 12;
    if (answers.priority === "space") score -= project.area / 12;
    if (answers.priority === "garden" && ["03", "06"].includes(project.number)) {
      score -= 12;
      reasons.push("Образ дома связан с садом и отдыхом на террасе.");
    }
    return { project, reasons, compromises, score };
  });
  return ranked.sort(
    (a, b) => a.score - b.score || a.project.number.localeCompare(b.project.number),
  )[0];
}
