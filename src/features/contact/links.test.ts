import { describe, expect, it } from "vitest";
import { CONTACTS, comparisonMessage, contactLinks } from "./links";

describe("ссылки для обращения", () => {
  it("кодирует тему и текст для письма и Telegram", () => {
    const links = contactLinks("ОСНОВА — расчёт", "Дом 118 м²\nЦена — демо");
    expect(links.email).toMatch(new RegExp(`^mailto:${CONTACTS.email.replace(".", "\\.")}\\?`));
    const query = new URLSearchParams(links.email.split("?")[1]);
    expect(query.get("subject")).toBe("ОСНОВА — расчёт");
    expect(query.get("body")).toContain("Дом 118 м²\nЦена — демо");
    expect(decodeURIComponent(links.telegram.split("text=")[1])).toContain("Дом 118 м²");
    expect(links.vk).toBe("https://vk.ru/khramtsov2001");
  });

  it("перечисляет только выбранные концепции", () => {
    const message = comparisonMessage([{ number: "02", name: "Север", area: 164 }]);
    expect(message).toContain("02 — «Север», 164 м²");
    expect(message).toContain("демонстрационные концепции");
  });
});
