import type { CalculatorDraft } from "../estimate/calculatorDraft";
import type { EstimateResult } from "../estimate/types";
import { vacancyRegions } from "../company/vacancies";
import { APPOINTMENT_TIMES, type PaymentAppointment } from "./paymentAppointment";
import type { PaymentMethod } from "./paymentPreview";

export const CHECKOUT_STORAGE_KEY = "osnova.payment-checkout.v1";
export type PaymentConfirmation = {
  reference: string;
  createdAt: string;
  officeId: string;
  method: PaymentMethod;
  appointment: PaymentAppointment | null;
};
export type CheckoutDraft = {
  signature: string;
  method: PaymentMethod | null;
  officeId: string;
  date: string;
  time: string;
  acknowledged: boolean;
  confirmation: PaymentConfirmation | null;
};

export function checkoutSignature(draft: CalculatorDraft, estimate: EstimateResult): string {
  return JSON.stringify({
    parameters: Object.entries(draft.parameters).sort(([a], [b]) => a.localeCompare(b)),
    projectName: draft.projectName,
    mode: draft.mode,
    stages: estimate.stages.filter((stage) => stage.included).map((stage) => stage.id),
    dataVersion: estimate.dataVersion,
    total: estimate.total,
  });
}

export function readCheckoutDraft(
  storage: Pick<Storage, "getItem">,
  signature: string,
  method: PaymentMethod | null,
): CheckoutDraft | null {
  try {
    const value = JSON.parse(
      storage.getItem(CHECKOUT_STORAGE_KEY) ?? "null",
    ) as CheckoutDraft | null;
    if (
      !value ||
      value.signature !== signature ||
      value.method !== method ||
      typeof value.officeId !== "string" ||
      (value.officeId !== "" && !vacancyRegions.some((office) => office.name === value.officeId)) ||
      typeof value.date !== "string" ||
      !/^(?:\d{4}-\d{2}-\d{2})?$/.test(value.date) ||
      typeof value.time !== "string" ||
      (value.time !== "" && !APPOINTMENT_TIMES.some((time) => time === value.time)) ||
      typeof value.acknowledged !== "boolean"
    )
      return null;
    const confirmation = value.confirmation;
    if (confirmation) {
      if (
        !method ||
        !value.acknowledged ||
        confirmation.method !== method ||
        confirmation.officeId !== value.officeId ||
        typeof confirmation.reference !== "string" ||
        !/^OSNOVA-DEMO-[A-F0-9]{8}$/.test(confirmation.reference) ||
        typeof confirmation.createdAt !== "string" ||
        !Number.isFinite(Date.parse(confirmation.createdAt))
      )
        return null;
      if (method === "cashFull" || method === "cashStages") {
        const appointment = confirmation.appointment;
        if (
          !appointment ||
          !value.officeId ||
          appointment.date !== value.date ||
          appointment.time !== value.time ||
          typeof appointment.timeZone !== "string" ||
          typeof appointment.zoneLabel !== "string" ||
          appointment.durationMinutes !== 45 ||
          typeof appointment.purpose !== "string"
        )
          return null;
      } else if (confirmation.appointment !== null) return null;
    }
    return { ...value, confirmation: confirmation ?? null };
  } catch {
    return null;
  }
}

export function writeCheckoutDraft(
  storage: Pick<Storage, "setItem">,
  draft: CheckoutDraft,
): boolean {
  try {
    storage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}
