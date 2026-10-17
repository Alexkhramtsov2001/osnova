export const APPOINTMENT_TIMES = [
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
] as const;
export const APPOINTMENT_DURATION_MINUTES = 45;

const officeZones: Record<string, { timeZone: string; label: string }> = {
  "Москва и МО": { timeZone: "Europe/Moscow", label: "UTC+3" },
  "Санкт-Петербург и область": { timeZone: "Europe/Moscow", label: "UTC+3" },
  Краснодар: { timeZone: "Europe/Moscow", label: "UTC+3" },
  Сочи: { timeZone: "Europe/Moscow", label: "UTC+3" },
  Казань: { timeZone: "Europe/Moscow", label: "UTC+3" },
  Екатеринбург: { timeZone: "Asia/Yekaterinburg", label: "UTC+5" },
  Челябинск: { timeZone: "Asia/Yekaterinburg", label: "UTC+5" },
  Новосибирск: { timeZone: "Asia/Novosibirsk", label: "UTC+7" },
  Красноярск: { timeZone: "Asia/Krasnoyarsk", label: "UTC+7" },
  Иркутск: { timeZone: "Asia/Irkutsk", label: "UTC+8" },
  Владивосток: { timeZone: "Asia/Vladivostok", label: "UTC+10" },
};

export type PaymentAppointment = {
  date: string;
  time: string;
  timeZone: string;
  zoneLabel: string;
  durationMinutes: number;
  purpose: string;
};

export function officeTimeZone(office: string) {
  return officeZones[office] ?? officeZones["Москва и МО"];
}

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function isWeekday(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6;
}

export function appointmentDateBounds(office: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: officeTimeZone(office).timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  let min = shiftDate(today, 1);
  while (!isWeekday(min)) min = shiftDate(min, 1);
  return { min, max: shiftDate(today, 60) };
}

export function appointmentDateError(office: string, date: string, now = new Date()) {
  if (!date) return "Выберите дату встречи.";
  const parsed = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    return "Укажите корректную дату.";
  }
  const { min, max } = appointmentDateBounds(office, now);
  if (date < min || date > max)
    return "Выберите рабочий день в ближайшие 60 дней, начиная со следующего рабочего дня.";
  if (!isWeekday(date)) return "Демо-встречи доступны с понедельника по пятницу.";
  return null;
}

export function isValidAppointment(office: string, date: string, time: string, now = new Date()) {
  return (
    Boolean(officeZones[office]) &&
    !appointmentDateError(office, date, now) &&
    APPOINTMENT_TIMES.some((slot) => slot === time)
  );
}

export function formatAppointmentDate(date: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
