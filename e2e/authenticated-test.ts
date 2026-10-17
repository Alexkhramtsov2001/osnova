import { test as baseTest, expect } from "@playwright/test";

export { expect };

export const test = baseTest.extend({
  page: async ({ page }, continueWithPage) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem("osnova.demo-session.v1", "active:google");
    });
    await continueWithPage(page);
  },
});
