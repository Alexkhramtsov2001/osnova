import { jsPDF } from "jspdf";
import { formatRequestSummary } from "./requestSummary";
import type { EstimateResult, HouseParameters } from "./types";

let fontPromise: Promise<string> | undefined;
function loadFont() {
  fontPromise ??= fetch(`${import.meta.env.BASE_URL}fonts/NotoSans-Regular.ttf`)
    .then(async (response) => {
      if (!response.ok) throw new Error("font");
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

export async function downloadEstimatePdf(
  parameters: HouseParameters,
  estimate: EstimateResult,
  projectName: string | null,
  mode: "turnkey" | "stages",
) {
  const font = await loadFont();
  const doc = new jsPDF({ format: "a4", compress: true });
  doc.addFileToVFS("NotoSans-Regular.ttf", font);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.setFont("NotoSans");
  doc.setProperties({ title: "ОСНОВА — расчёт дома", author: "ОСНОВА" });
  const margin = 18;
  const width = 174;
  let y = 24;
  const money = (value: number) => `${Math.round(value).toLocaleString("ru-RU")} руб.`;
  const normalize = (text: string) =>
    text.replace(/[\u2011\u2013\u2014]/g, "-").replace(/\u00a0/g, " ");
  function pageBreak(height: number) {
    if (y + height <= 275) return;
    doc.addPage();
    y = 24;
  }
  function paragraph(text: string, size = 10, accent = false) {
    doc.setFontSize(size);
    doc.setTextColor(...((accent ? [152, 70, 47] : [37, 38, 33]) as [number, number, number]));
    const lines: string[] = doc.splitTextToSize(normalize(text), width);
    const lineHeight = size * 0.48;
    for (const line of lines) {
      pageBreak(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += 3;
  }
  paragraph("ОСНОВА / РАСЧЁТ ДОМА", 20, true);
  paragraph(`Сформировано: ${new Date().toLocaleDateString("ru-RU")}`, 9);
  for (const line of formatRequestSummary(parameters, estimate, projectName, mode)
    .split("\n")
    .slice(1))
    paragraph(line);
  y += 4;
  pageBreak(22);
  paragraph("Детализация по этапам", 16, true);
  for (const stage of estimate.stages) {
    pageBreak(30);
    paragraph(`${stage.name} - ${stage.included ? money(stage.total) : "не включён"}`, 13, true);
    if (!stage.included) continue;
    paragraph(stage.description);
    paragraph(`Ориентир: ${stage.durationWeeks.min}-${stage.durationWeeks.max} нед.`);
    for (const item of stage.items) {
      const quantity = item.quantity.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
      paragraph(
        `${item.name}: ${quantity} ${item.unit} × ${money(item.unitPrice)} = ${money(item.quantity * item.unitPrice)}`,
      );
    }
    paragraph(`Что меняет цену: ${stage.priceFactors}`, 9);
    paragraph(`Допущение: ${stage.assumption}`, 9);
    y += 3;
  }
  pageBreak(30);
  paragraph(`Доставка: ${money(estimate.deliveryCost)}`, 11);
  paragraph(`Итого: ${money(estimate.total)}`, 16, true);
  paragraph(`Диапазон: ${money(estimate.minTotal)} - ${money(estimate.maxTotal)}`, 11);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(228, 225, 217);
    doc.line(margin, 282, 192, 282);
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 100);
    doc.text("ОСНОВА / Портфолио. Демонстрационный расчёт, не смета.", margin, 289);
    doc.text(`${page} / ${pages}`, 192, 289, { align: "right" });
  }
  doc.save("osnova-house-estimate.pdf");
}
