import { describe, expect, it } from "vitest";
import {
  appointmentDateBounds,
  appointmentDateError,
  isValidAppointment,
} from "./paymentAppointment";

describe("демонстрационная запись в офис", () => {
  const friday = new Date("2026-10-16T09:00:00Z");

  it("предлагает следующий рабочий день и не принимает прошедшие даты, выходные и неверные часы", () => {
    expect(appointmentDateBounds("Екатеринбург", friday).min).toBe("2026-10-19");
    expect(isValidAppointment("Екатеринбург", "2026-10-19", "10:00", friday)).toBe(true);
    expect(isValidAppointment("Екатеринбург", "2026-10-16", "10:00", friday)).toBe(false);
    expect(isValidAppointment("Екатеринбург", "2026-10-24", "10:00", friday)).toBe(false);
    expect(isValidAppointment("Екатеринбург", "2026-10-19", "23:00", friday)).toBe(false);
    expect(isValidAppointment("Несуществующий офис", "2026-10-19", "10:00", friday)).toBe(false);
  });

  it("проверяет календарную дату и горизонт записи", () => {
    expect(appointmentDateError("Москва и МО", "2026-02-30", friday)).toBe(
      "Укажите корректную дату.",
    );
    expect(appointmentDateError("Москва и МО", "2027-01-01", friday)).toContain("60 дней");
  });

  it("вычисляет ближайшую дату по часовому поясу выбранного офиса", () => {
    const thursday = new Date("2026-10-15T16:00:00Z");
    expect(appointmentDateBounds("Москва и МО", thursday).min).toBe("2026-10-16");
    expect(appointmentDateBounds("Владивосток", thursday).min).toBe("2026-10-19");
  });
});
