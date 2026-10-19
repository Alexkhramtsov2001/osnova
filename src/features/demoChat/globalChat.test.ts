import { describe, expect, it } from "vitest";
import {
  chatContext,
  globalChatGroups,
  GLOBAL_CHAT_KEY,
  readGlobalChat,
  turnContent,
  type ChatTurn,
} from "./globalChat";

describe("локальная справка по разделам", () => {
  it.each([
    ["/", "home"],
    ["/projects", "projects"],
    ["/projects/02", "projects"],
    ["/compare", "projects"],
    ["/calculator", "estimate"],
    ["/find-home", "estimate"],
    ["/payment", "payment"],
    ["/payment/methods/mortgage", "payment"],
    ["/account", "account"],
    ["/vacancies", "vacancies"],
    ["/contacts", "contacts"],
    ["/about", "info"],
    ["/partners", "info"],
  ])("выбирает вопросы для %s", (route, group) => expect(chatContext(route).group).toBe(group));
  it("сохраняет контекст проекта в ответе истории, независимо от текущего маршрута", () => {
    const turn: ChatTurn = { id: "one", group: "projects", topicId: "price", projectId: "02" };
    expect(turnContent(turn)?.answer).toContain("Север");
    expect(chatContext("/projects/01").project?.name).toBe("Скандинавия");
    expect(turnContent(turn)?.answer).toContain("Север");
  });
  it("содержит восемь групп с уникальными вопросами и локальными действиями", () => {
    expect(Object.keys(globalChatGroups)).toHaveLength(8);
    for (const [group, value] of Object.entries(globalChatGroups)) {
      expect(new Set(value.topics.map((topic) => topic.id)).size).toBe(value.topics.length);
      for (const item of value.topics) {
        const result = turnContent({
          id: "one",
          group: group as ChatTurn["group"],
          topicId: item.id,
        });
        expect(result?.answer.length).toBeGreaterThan(80);
        if (result?.action)
          expect(result.action.to).toMatch(
            /^\/(projects|calculator|payment|account|contacts|about)(\/|$)/,
          );
      }
    }
  });
  it("отбрасывает испорченную историю и неизвестные группы, темы и проекты", () => {
    const read = (raw: string) => readGlobalChat({ getItem: () => raw });
    expect(read("bad JSON")).toEqual([]);
    expect(read("{}")).toEqual([]);
    expect(
      read(
        JSON.stringify([
          { id: "x", group: "__proto__", topicId: "start" },
          { id: "y", group: "home", topicId: "unknown" },
          { id: "z", group: "home", topicId: "start", projectId: "999" },
        ]),
      ),
    ).toEqual([]);
    expect(
      readGlobalChat({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toEqual([]);
  });
  it("восстанавливает только последние 30 обращений из своей записи", () => {
    const turns = Array.from({ length: 35 }, (_, index) => ({
      id: String(index),
      group: "home",
      topicId: "start",
    }));
    const history = readGlobalChat({
      getItem: (key) => (key === GLOBAL_CHAT_KEY ? JSON.stringify(turns) : null),
    });
    expect(history).toHaveLength(30);
    expect(history[0].id).toBe("5");
  });
});
