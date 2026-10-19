import { afterEach, expect, it, vi } from "vitest";
import { lockOverlayScroll } from "./overlayScroll";

afterEach(() => vi.unstubAllGlobals());

it("фиксирует фон по текущей прокрутке и возвращает исходные стили и позицию", () => {
  const style = { position: "relative", top: "", left: "", width: "", overflow: "auto" };
  const rootStyle = { overflow: "clip" };
  const scrollTo = vi.fn();
  vi.stubGlobal("document", { body: { style }, documentElement: { style: rootStyle } });
  vi.stubGlobal("window", { scrollX: 12, scrollY: 1500, scrollTo });
  const unlock = lockOverlayScroll();
  expect(style).toMatchObject({
    position: "fixed",
    top: "-1500px",
    left: "-12px",
    overflow: "hidden",
  });
  expect(rootStyle.overflow).toBe("hidden");
  unlock();
  expect(style).toEqual({ position: "relative", top: "", left: "", width: "", overflow: "auto" });
  expect(rootStyle.overflow).toBe("clip");
  expect(scrollTo).toHaveBeenCalledWith({ left: 12, top: 1500, behavior: "instant" });
});

it("использует позицию до изменения класса шапки, даже если браузер уже сдвинул якорь", () => {
  const style = { position: "", top: "", left: "", width: "", overflow: "" };
  const scrollTo = vi.fn();
  vi.stubGlobal("document", { body: { style }, documentElement: { style: { overflow: "" } } });
  vi.stubGlobal("window", { scrollX: 0, scrollY: 965, scrollTo });
  const unlock = lockOverlayScroll({ x: 0, y: 970 });
  expect(style.top).toBe("-970px");
  unlock();
  expect(scrollTo).toHaveBeenCalledWith({ left: 0, top: 970, behavior: "instant" });
});
