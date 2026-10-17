export const DEMO_SESSION_KEY = "osnova.demo-session.v1";
export const DEMO_PROFILE_KEY = "osnova.demo-profile.v1";
export const DEMO_AUTH_CHANGED_EVENT = "osnova:demo-auth-changed";
export type DemoSessionSource = "guest" | "email" | "google" | "apple";

export type DemoProfile = { name: string; email: string };

export function normalizeDemoEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9._-]{0,40}@osnova\.test$/.test(normalized) ? normalized : null;
}

export function readDemoProfile(storage: Pick<Storage, "getItem">): DemoProfile | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(DEMO_PROFILE_KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<DemoProfile>;
    const email = typeof candidate.email === "string" ? normalizeDemoEmail(candidate.email) : null;
    const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
    return email && name.length >= 2 && name.length <= 80 ? { name, email } : null;
  } catch {
    return null;
  }
}

export function writeDemoProfile(storage: Pick<Storage, "setItem">, profile: DemoProfile): boolean {
  const email = normalizeDemoEmail(profile.email);
  const name = profile.name.trim();
  if (!email || name.length < 2 || name.length > 80) return false;
  try {
    storage.setItem(DEMO_PROFILE_KEY, JSON.stringify({ name, email }));
    return true;
  } catch {
    return false;
  }
}

export function createDemoCode(): string {
  const numbers = new Uint32Array(6);
  crypto.getRandomValues(numbers);
  return [...numbers].map((value) => value % 10).join("");
}

export function readDemoSession(storage: Pick<Storage, "getItem">): boolean {
  try {
    const value = storage.getItem(DEMO_SESSION_KEY);
    return (
      value === "active" ||
      value === "active:guest" ||
      value === "active:email" ||
      value === "active:google" ||
      value === "active:apple"
    );
  } catch {
    return false;
  }
}

export function readDemoSessionSource(storage: Pick<Storage, "getItem">): DemoSessionSource {
  try {
    const value = storage.getItem(DEMO_SESSION_KEY);
    if (value === "active:email") return "email";
    if (value === "active:google") return "google";
    if (value === "active:apple") return "apple";
  } catch {
    // Legacy and unavailable sessions use the guest label.
  }
  return "guest";
}

export function writeDemoSession(
  storage: Pick<Storage, "setItem">,
  source: DemoSessionSource = "guest",
): boolean {
  try {
    storage.setItem(DEMO_SESSION_KEY, `active:${source}`);
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
