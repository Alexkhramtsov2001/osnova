import { jsPDF } from "jspdf";

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

/** A single local document: confirmation, scenario summary, and a clearly non-fiscal demo receipt. */
export async function downloadPaymentConfirmationPdf(
  data: PaymentConfirmationPdfData,
): Promise<void> {
  const font = await loadFont();
  const doc = new jsPDF({ format: "a4", compress: true });
  doc.addFileToVFS("NotoSans-Regular.ttf", font);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.setFont("NotoSans");
  doc.setProperties({
    title: "ОСНОВА — демонстрационное подтверждение выбора оплаты",
    author: "ОСНОВА",
    subject: "Демонстрационный документ портфолио, платёж не проведён",
  });

  const margin = 18;
  const width = 174;
  const bottom = 272;
  const ink: [number, number, number] = [37, 38, 33];
  const muted: [number, number, number] = [103, 104, 96];
  const accent: [number, number, number] = [184, 88, 61];
  let y = 23;

  function pageBreak(height: number) {
    if (y + height <= bottom) return;
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

  const timestamp = data.createdAt.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  line("ОСНОВА / ДЕМОНСТРАЦИОННЫЙ ДОКУМЕНТ", 17, accent, 7);
  line("Выбор сценария завершён", 16, ink, 3);
  line("Платёж не проведён. Денежные средства не списывались.", 11, accent, 5);
  line(
    "Поздравляем с выбором проекта! Спасибо, что познакомились с ОСНОВОЙ. " +
      "Этот документ показывает, как могло бы выглядеть подтверждение в настоящем сервисе.",
    10,
    ink,
    6,
  );
  line(`Демо-номер: ${data.reference}    Сформировано: ${timestamp}`, 9, muted, 3);

  sectionHeading("Выбранный проект");
  keyValue("Проект", data.projectName);
  keyValue("Тип", data.projectType);
  keyValue("Площадь", `${data.area.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} м²`);
  keyValue("Регион", data.region);
  keyValue("Формат расчёта", data.scope);

  sectionHeading("Выбранный вариант оплаты");
  line(methodTitles[data.method], 11, ink, 3);
  if (data.method === "cashFull" || data.method === "cashStages") {
    keyValue("Выбранный демо-офис", data.office ? data.office.address : "не выбран");
    line("Адрес условный и не предназначен для посещения.", 9, muted, 2);
  }
  for (const detail of data.scenarioDetails) line(`- ${detail}`, 9, ink, 2);
  if (data.method === "cashStages") {
    line(
      "Этапы выбираются последовательно; данный документ не подтверждает оплату каждого этапа.",
      9,
      muted,
      3,
    );
  }
  if (data.method === "credit" || data.method === "mortgage") {
    line("Банк не получал заявку, не принимал решение и не перечислял средства.", 9, muted, 3);
  }

  sectionHeading("Состав расчёта");
  for (const stage of data.stages) keyValue(stage.name, money(stage.amount));
  keyValue("Доставка", money(data.deliveryCost));
  if (y + 82 > bottom) {
    doc.addPage();
    y = 23;
    line("Итог расчёта и демо-чек", 16, accent, 7);
  }
  keyValue("Ориентир калькулятора", money(data.estimateTotal));
  if (data.discount > 0) keyValue("Условная демонстрационная скидка", `-${money(data.discount)}`);
  keyValue("Расчётный итог", money(data.total));
  line("НДС в демонстрационной модели отдельно не определён.", 9, muted, 2);

  sectionHeading("Демонстрационный чек");
  line("НЕ ЯВЛЯЕТСЯ КАССОВЫМ ЧЕКОМ", 11, accent, 3);
  keyValue("Демо-номер операции", data.reference);
  keyValue("Способ", methodTitles[data.method]);
  keyValue("Расчётная сумма проекта", money(data.total));
  keyValue("Фактически оплачено", money(0));
  line(
    "Этот чек и подтверждение созданы локально для портфолио. Они не подтверждают " +
      "платёж, заключение договора, бронирование проекта или одобрение кредита.",
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
