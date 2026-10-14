export const DEMO_ACCOUNT_EMAIL = "demo@osnova.test";
export const DEMO_ACCOUNT_PASSWORD = "osnova-demo";
export const DEMO_SESSION_KEY = "osnova.demo-session.v1";

export function hasDemoCredentials(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_ACCOUNT_EMAIL && password === DEMO_ACCOUNT_PASSWORD;
}

export function readDemoSession(storage: Pick<Storage, "getItem">): boolean {
  try {
    return storage.getItem(DEMO_SESSION_KEY) === "active";
  } catch {
    return false;
  }
}

export function writeDemoSession(storage: Pick<Storage, "setItem">): boolean {
  try {
    storage.setItem(DEMO_SESSION_KEY, "active");
    return true;
  } catch {
    return false;
  }
}

export function clearDemoSession(storage: Pick<Storage, "removeItem">): void {
  try {
    storage.removeItem(DEMO_SESSION_KEY);
  } catch {
    // The in-memory view can still be closed when browser storage is unavailable.
  }
}
