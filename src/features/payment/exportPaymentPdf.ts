import { jsPDF } from "jspdf";
import { formatAppointmentDate, type PaymentAppointment } from "./paymentAppointment";

export type PaymentConfirmationMethod = "cashFull" | "cashStages" | "credit" | "mortgage";

export type PaymentConfirmationPdfData = {
  reference: string;
  createdAt: Date;
  projectName: string;
  projectType: string;
  area: number;
  region: string;
  scope: string;
  method: PaymentConfirmationMethod;
  office?: { city: string; address: string } | null;
  appointment?: PaymentAppointment | null;
  specifications?: { label: string; value: string }[];
  dataVersion?: string;
  minTotal?: number;
  maxTotal?: number;
  stages: { name: string; amount: number }[];
  deliveryCost: number;
  estimateTotal: number;
  discount: number;
  total: number;
  scenarioDetails: string[];
};

const methodTitles: Record<PaymentConfirmationMethod, string> = {
  cashFull: "Собственные средства — полностью",
  cashStages: "Собственные средства — по этапам",
  credit: "Кредит",
  mortgage: "Ипотека на строительство",
};

const nextSteps: Record<PaymentConfirmationMethod, string[]> = {
  cashFull: [
    "На встрече сверить состав работ, параметры участка и предварительную стоимость.",
    "После проектирования согласовать окончательную смету, договор и порядок полной оплаты.",
    "В реальном процессе передавать деньги только после оформления документов и проверки реквизитов.",
  ],
  cashStages: [
    "На встрече сверить состав и последовательность выбранных строительных этапов.",
    "Согласовать реальные сроки, акты, договор и сумму платежа по каждому этапу.",
    "Оплачивать этапы в настоящем проекте по условиям договора; этот документ оплату не подтверждает.",
  ],
  credit: [
    "Сверить смету и подготовить документы, которые запрашивает выбранный банк.",
    "Самостоятельно обратиться в банк; ставку, срок, платёж и одобрение определяет он.",
    "После решения банка согласовать окончательные условия строительства и расчётов.",
  ],
  mortgage: [
    "Подготовить сведения об участке, проекте, подрядчике и заёмщике.",
    "Самостоятельно обратиться в банк и дождаться проверки документов и условий программы.",
    "После решения банка согласовать договор строительства и порядок расчётов, в том числе эскроу, если применимо.",
  ],
};

let fontPromise: Promise<string> | undefined;

function loadFont() {
  fontPromise ??= fetch(`${import.meta.env.BASE_URL}fonts/NotoSans-Regular.ttf`)
    .then(async (response) => {
      if (!response.ok) throw new Error("Не удалось загрузить шрифт PDF");
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary);
    })
    .catch((error) => {
      fontPromise = undefined;
      throw error;
    });
  return fontPromise;
}

const money = (value: number) => `${value.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`;

const normalize = (value: string) =>
  value.replace(/[\u2011\u2013\u2014]/g, "-").replace(/[\u00a0\u202f]/g, " ");

/** One local PDF combines the choice, estimate, demo appointment, and non-fiscal receipt. */
export async function downloadPaymentConfirmationPdf(
  data: PaymentConfirmationPdfData,
): Promise<void> {
  const font = await loadFont();
  const doc = new jsPDF({ format: "a4", compress: true });
  doc.addFileToVFS("NotoSans-Regular.ttf", font);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.setFont("NotoSans");
  doc.setProperties({
    title: "ОСНОВА — демонстрационное подтверждение выбора проекта",
    author: "ОСНОВА / портфолио",
    subject: "Выбор проекта, маршрут оплаты и демо-чек; платёж не проведён",
  });

  const margin = 18;
  const width = 174;
  const bottom = 270;
  const ink: [number, number, number] = [37, 38, 33];
  const muted: [number, number, number] = [103, 104, 96];
  const accent: [number, number, number] = [184, 88, 61];
  let y = 23;

  function pageBreak(height: number) {
    if (y + height <= bottom) return;
    doc.addPage();
    y = 23;
  }

  function newPage() {
    doc.addPage();
    y = 23;
  }

  function line(text: string, size = 10, color = ink, spaceAfter = 3) {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(normalize(text), width) as string[];
    const lineHeight = size * 0.48;
    for (const row of lines) {
      pageBreak(lineHeight);
      doc.text(row, margin, y);
      y += lineHeight;
    }
    y += spaceAfter;
  }

  function sectionHeading(text: string) {
    pageBreak(14);
    y += 4;
    line(text, 13, accent, 3);
    doc.setDrawColor(222, 218, 208);
    doc.line(margin, y - 1, margin + width, y - 1);
    y += 3;
  }

  function keyValue(key: string, value: string) {
    line(`${key}: ${value}`, 10, ink, 2);
  }

  function numberedStep(index: number, description: string) {
    pageBreak(13);
    doc.setFontSize(9);
    doc.setTextColor(...accent);
    doc.text(String(index + 1).padStart(2, "0"), margin, y);
    doc.setTextColor(...ink);
    const rows = doc.splitTextToSize(normalize(description), width - 18) as string[];
    for (const row of rows) {
      pageBreak(4.8);
      doc.text(row, margin + 17, y);
      y += 4.8;
    }
    y += 2.5;
  }

  function amountRow(label: string, amount: number) {
    pageBreak(8);
    doc.setFontSize(9);
    doc.setTextColor(...ink);
    doc.text(normalize(label), margin, y);
    doc.text(money(amount), margin + width, y, { align: "right" });
    y += 7;
  }

  const timestamp = data.createdAt.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  line("ОСНОВА / ПОРТФОЛИО", 10, accent, 7);
  line("Спасибо, что выбрали ОСНОВУ!", 17, ink, 4);
  line(
    `Поздравляем с выбором проекта «${data.projectName}». Вы прошли демонстрационный сценарий оплаты.`,
    10,
    ink,
    6,
  );
  pageBreak(24);
  doc.setFillColor(242, 235, 229);
  doc.rect(margin, y - 3, width, 20, "F");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.text("ВЫБОР СЦЕНАРИЯ ПОДТВЕРЖДЁН", margin + 5, y + 4);
  doc.setFontSize(9);
  doc.setTextColor(...ink);
  doc.text("Фактически оплачено: 0 ₽. Заявка и запись никуда не отправлены.", margin + 5, y + 12);
  y += 24;
  line(`Демо-номер: ${data.reference}    Сформировано: ${timestamp}`, 9, muted, 3);

  sectionHeading("Выбранный проект");
  keyValue("Проект", data.projectName);
  keyValue("Тип", data.projectType);
  keyValue("Площадь", `${data.area.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} м²`);
  keyValue("Регион", data.region);
  keyValue("Формат расчёта", data.scope);
  if (data.specifications?.length) {
    line(
      `Параметры: ${data.specifications.map(({ label, value }) => `${label.toLowerCase()} - ${value}`).join("; ")}.`,
      9,
      muted,
      2,
    );
  }

  sectionHeading("Выбранный вариант оплаты");
  line(methodTitles[data.method], 11, ink, 3);
  if (data.method === "cashFull" || data.method === "cashStages") {
    keyValue("Выбранный демо-офис", data.office?.address ?? "не выбран");
    if (data.appointment) {
      keyValue(
        "Демо-встреча",
        `${formatAppointmentDate(data.appointment.date)}, ${data.appointment.time} (${data.appointment.zoneLabel})`,
      );
      keyValue("Длительность", `${data.appointment.durationMinutes} минут`);
      keyValue("Тема", data.appointment.purpose);
    }
    line(
      "Адрес вымышленный; посещать его не нужно. Встреча показана только в браузере и не забронирована.",
      9,
      muted,
      2,
    );
  }
  if (data.method === "credit" || data.method === "mortgage") {
    line(
      "Банки приведены только как примеры программ. Партнёрство не заявлено; заявка в банк не отправлена.",
      9,
      muted,
      3,
    );
  }

  sectionHeading("Что произошло бы дальше в реальном проекте");
  nextSteps[data.method].forEach((step, index) => numberedStep(index, step));

  // Keep the estimate and its demo receipt together on a clean page.
  newPage();
  line("ОСНОВА / ПРЕДВАРИТЕЛЬНЫЙ РАСЧЁТ", 10, accent, 4);
  line("Стоимость проекта", 16, ink, 3);
  line(
    "Суммы показывают возможности калькулятора и не являются сметой, офертой или договором.",
    9,
    muted,
    4,
  );
  if (data.minTotal !== undefined && data.maxTotal !== undefined) {
    keyValue("Ориентировочный диапазон", `${money(data.minTotal)} - ${money(data.maxTotal)}`);
  }
  if (data.dataVersion) keyValue("Версия демо-данных", data.dataVersion);
  sectionHeading("Состав расчёта");
  for (const stage of data.stages) amountRow(stage.name, stage.amount);
  amountRow("Доставка", data.deliveryCost);
  doc.setDrawColor(222, 218, 208);
  doc.line(margin, y - 2, margin + width, y - 2);
  y += 4;
  amountRow("Ориентир калькулятора", data.estimateTotal);
  if (data.discount > 0) amountRow("Условная скидка 3% за полную оплату", -data.discount);
  pageBreak(14);
  doc.setFontSize(12);
  doc.setTextColor(...accent);
  doc.text("Итог демонстрационного сценария", margin, y);
  doc.text(money(data.total), margin + width, y, { align: "right" });
  y += 12;
  line("НДС в демонстрационной модели отдельно не определён.", 9, muted, 2);

  sectionHeading("Демонстрационный чек");
  line("НЕ ЯВЛЯЕТСЯ КАССОВЫМ ЧЕКОМ", 11, accent, 3);
  keyValue("Демо-номер операции", data.reference);
  keyValue("Дата", timestamp);
  keyValue("Проект", data.projectName);
  keyValue("Способ", methodTitles[data.method]);
  keyValue("Расчётная сумма проекта", money(data.total));
  keyValue("Фактически оплачено", money(0));
  line(
    "Документ создан локально для портфолио. Он не подтверждает платёж, бронь встречи, " +
      "договор, одобрение кредита или ипотеку. Итоговая стоимость и условия уточняются отдельно.",
    9,
    muted,
    2,
  );

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(222, 218, 208);
    doc.line(margin, 280, margin + width, 280);
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text("ОСНОВА / Портфолио. Платёж не проведён.", margin, 287);
    doc.text(`${page} / ${pages}`, margin + width, 287, { align: "right" });
  }

  const safeReference = data.reference.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40) || "demo";
  doc.save(`osnova-payment-${safeReference}.pdf`);
}
