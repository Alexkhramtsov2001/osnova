import OsnovaSelect from "../../components/OsnovaSelect";
import { vacancyRegions } from "../company/vacancies";
import type { HouseParameters } from "../estimate/types";
import {
  APPOINTMENT_DURATION_MINUTES,
  APPOINTMENT_TIMES,
  appointmentDateBounds,
  appointmentDateError,
  officeTimeZone,
} from "./paymentAppointment";

const officesByRegion: Record<HouseParameters["region"], readonly string[]> = {
  central: ["Москва и МО"],
  northwest: ["Санкт-Петербург и область"],
  south: ["Краснодар", "Сочи"],
  ural: ["Екатеринбург", "Челябинск"],
  siberia: ["Новосибирск", "Красноярск", "Иркутск"],
  farEast: ["Владивосток"],
};

type Props = {
  region: HouseParameters["region"];
  officeId: string;
  date: string;
  time: string;
  disabled: boolean;
  onOfficeChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
};

export default function PaymentOfficeBooking({
  region,
  officeId,
  date,
  time,
  disabled,
  onOfficeChange,
  onDateChange,
  onTimeChange,
}: Props) {
  const suggested = officesByRegion[region];
  const office = vacancyRegions.find((item) => item.name === officeId);
  const options = [...vacancyRegions].sort(
    (a, b) => Number(suggested.includes(b.name)) - Number(suggested.includes(a.name)),
  );
  const bounds = appointmentDateBounds(officeId);
  const error = date ? appointmentDateError(officeId, date) : null;
  return (
    <div className="payment-office-booking">
      <span className="payment-office-label">Удобный демо-офис</span>
      <OsnovaSelect
        ariaLabel="Удобный демо-офис"
        value={officeId}
        onValueChange={onOfficeChange}
        placeholder="Выберите город и офис"
        disabled={disabled}
        options={options.map((item) => ({
          value: item.name,
          label: `${item.office}${suggested.includes(item.name) ? " · По вашему региону" : ""}`,
        }))}
      />
      {office && (
        <div className="payment-appointment-fields">
          <div className="payment-office-summary">
            <strong>{office.office}</strong>
            <span>
              Демо-график: пн–пт, 10:00–18:00 · встреча {APPOINTMENT_DURATION_MINUTES} минут
            </span>
          </div>
          <label className="payment-office-label" htmlFor="payment-appointment-date">
            Дата встречи
          </label>
          <input
            id="payment-appointment-date"
            type="date"
            min={bounds.min}
            max={bounds.max}
            value={date}
            disabled={disabled}
            onChange={(event) => onDateChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby="payment-date-help"
          />
          <p
            id="payment-date-help"
            className={error ? "payment-date-error" : "payment-booking-help"}
          >
            {error ??
              "Выберите рабочий день в ближайшие 60 дней. Запись доступна со следующего рабочего дня."}
          </p>
          <fieldset className="payment-time-slots" disabled={disabled || !date || Boolean(error)}>
            <legend>
              Время встречи <span>По времени офиса · {officeTimeZone(officeId).label}</span>
            </legend>
            <div>
              {APPOINTMENT_TIMES.map((slot) => (
                <label key={slot} className={time === slot ? "is-selected" : ""}>
                  <input
                    type="radio"
                    name="appointment-time"
                    value={slot}
                    checked={time === slot}
                    onChange={() => onTimeChange(slot)}
                  />
                  <span>{slot}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}
      <p className="payment-booking-help">
        Демо-запись: адреса и свободные часы условные, офис не получает заявку.
      </p>
    </div>
  );
}
