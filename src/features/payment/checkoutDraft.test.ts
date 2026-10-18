import { describe, expect, it } from "vitest";
import { DEFAULT_HOUSE_PARAMETERS } from "../estimate/catalog";
import { calculateHouseEstimate } from "../estimate/calculations";
import type { CalculatorDraft } from "../estimate/calculatorDraft";
import {
  checkoutSignature,
  readCheckoutDraft,
  writeCheckoutDraft,
  type CheckoutDraft,
} from "./checkoutDraft";

const calculator: CalculatorDraft = {
  parameters: DEFAULT_HOUSE_PARAMETERS,
  projectName: null,
  mode: "turnkey",
  stageIds: [],
};
const estimate = calculateHouseEstimate(calculator.parameters);
const signature = checkoutSignature(calculator, estimate);
const draft: CheckoutDraft = {
  signature,
  method: "cashFull",
  officeId: "Екатеринбург",
  date: "2026-10-19",
  time: "10:00",
  acknowledged: true,
  confirmation: null,
};
const read = (
  value: unknown,
  expectedSignature = signature,
  method: CheckoutDraft["method"] = "cashFull",
) => readCheckoutDraft({ getItem: () => JSON.stringify(value) }, expectedSignature, method);

describe("черновик демонстрационного оформления", () => {
  it("восстанавливает поля только для той же сметы и способа", () => {
    expect(read(draft)).toEqual(draft);
    expect(read(draft, signature, "cashStages")).toBeNull();
    const changed = {
      ...calculator,
      parameters: { ...calculator.parameters, area: 145, perimeter: 49 },
    };
    expect(
      read(draft, checkoutSignature(changed, calculateHouseEstimate(changed.parameters))),
    ).toBeNull();
    expect(
      read(draft, checkoutSignature(calculator, { ...estimate, dataVersion: "new" })),
    ).toBeNull();
  });
  it("не зависит от порядка полей параметров и идентификатора исходного URL", () => {
    const reordered = Object.fromEntries(
      Object.entries(calculator.parameters).reverse(),
    ) as typeof calculator.parameters;
    expect(
      checkoutSignature(
        { ...calculator, parameters: reordered, sourceProjectNumber: "02" },
        estimate,
      ),
    ).toBe(signature);
  });
  it.each([
    { ...draft, officeId: "unknown" },
    { ...draft, time: "23:00" },
    { ...draft, acknowledged: "yes" },
    { ...draft, date: "invalid" },
  ])("отклоняет повреждённые поля", (value) => {
    expect(read(value)).toBeNull();
  });
  it("сохраняет существующий номер и дату подтверждения после сериализации", () => {
    const confirmed: CheckoutDraft = {
      ...draft,
      confirmation: {
        reference: "OSNOVA-DEMO-1234ABCD",
        createdAt: "2026-10-18T10:00:00.000Z",
        officeId: "Екатеринбург",
        method: "cashFull",
        appointment: {
          date: draft.date,
          time: draft.time,
          timeZone: "Asia/Yekaterinburg",
          zoneLabel: "UTC+5",
          durationMinutes: 45,
          purpose: "Согласование договора",
        },
      },
    };
    let value = "";
    expect(
      writeCheckoutDraft(
        {
          setItem: (_key, text) => {
            value = text;
          },
        },
        confirmed,
      ),
    ).toBe(true);
    expect(readCheckoutDraft({ getItem: () => value }, signature, "cashFull")).toEqual(confirmed);
    expect(
      read({ ...confirmed, confirmation: { ...confirmed.confirmation, method: "credit" } }),
    ).toBeNull();
  });
  it("обрабатывает недоступное хранилище и повреждённый JSON", () => {
    expect(
      writeCheckoutDraft(
        {
          setItem: () => {
            throw new Error("quota");
          },
        },
        draft,
      ),
    ).toBe(false);
    expect(readCheckoutDraft({ getItem: () => "{" }, signature, "cashFull")).toBeNull();
  });
});
