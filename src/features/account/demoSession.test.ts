import { describe, expect, it } from "vitest";
import {
  clearDemoSession,
  DEMO_SESSION_KEY,
  DEMO_PROFILE_KEY,
  createDemoCode,
  normalizeDemoEmail,
  readDemoProfile,
  readDemoSession,
  readDemoSessionSource,
  writeDemoProfile,
  writeDemoSession,
} from "./demoSession";

describe("демонстрационная регистрация и вход", () => {
  it("сохраняет и удаляет только флаг демо-сессии", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    };

    expect(readDemoSession(storage)).toBe(false);
    expect(writeDemoSession(storage)).toBe(true);
    expect(readDemoSession(storage)).toBe(true);
    expect(readDemoSessionSource(storage)).toBe("guest");
    expect([...data.keys()]).toEqual([DEMO_SESSION_KEY]);
    expect(writeDemoSession(storage, "google")).toBe(true);
    expect(readDemoSessionSource(storage)).toBe("google");
    data.set(DEMO_SESSION_KEY, "active");
    expect(readDemoSession(storage)).toBe(true);
    clearDemoSession(storage);
    expect(readDemoSession(storage)).toBe(false);
  });

  it("не падает, если хранилище браузера недоступно", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readDemoSession(storage)).toBe(false);
    expect(writeDemoSession(storage)).toBe(false);
    expect(() => clearDemoSession(storage)).not.toThrow();
  });

  it("хранит только учебное имя и адрес, отвергает настоящую почту", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    };
    expect(normalizeDemoEmail(" PERSON@OSNOVA.TEST ")).toBe("person@osnova.test");
    expect(normalizeDemoEmail("person@gmail.com")).toBeNull();
    expect(writeDemoProfile(storage, { name: "Анна", email: "anna@gmail.com" })).toBe(false);
    expect(writeDemoProfile(storage, { name: " Анна ", email: "ANNA@OSNOVA.TEST" })).toBe(true);
    expect(readDemoProfile(storage)).toEqual({ name: "Анна", email: "anna@osnova.test" });
    expect([...data.keys()]).toEqual([DEMO_PROFILE_KEY]);
  });

  it("создаёт шестизначный учебный код для одного экрана подтверждения", () => {
    expect(createDemoCode()).toMatch(/^\d{6}$/);
  });
});
