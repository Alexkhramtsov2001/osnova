import { describe, expect, it } from "vitest";
import {
  clearDemoSession,
  DEMO_ACCOUNT_EMAIL,
  DEMO_ACCOUNT_PASSWORD,
  DEMO_SESSION_KEY,
  hasDemoCredentials,
  readDemoSession,
  writeDemoSession,
} from "./demoSession";

describe("демонстрационный вход без регистрации", () => {
  it("принимает только предустановленную тестовую пару", () => {
    expect(hasDemoCredentials(DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD)).toBe(true);
    expect(hasDemoCredentials("visitor@example.com", DEMO_ACCOUNT_PASSWORD)).toBe(false);
    expect(hasDemoCredentials(DEMO_ACCOUNT_EMAIL, "wrong-password")).toBe(false);
    expect(hasDemoCredentials(` ${DEMO_ACCOUNT_EMAIL.toUpperCase()} `, DEMO_ACCOUNT_PASSWORD)).toBe(
      true,
    );
  });

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
    expect([...data.keys()]).toEqual([DEMO_SESSION_KEY]);
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
});
