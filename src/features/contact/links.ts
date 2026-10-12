export const CONTACTS = {
  email: "vanya_silorov@mail.ru",
  telegramUsername: "AvitoTrader",
  vkUrl: "https://vk.ru/khramtsov2001",
} as const;

export function contactLinks(subject: string, message?: string) {
  const body = message
    ? `Здравствуйте!\n\n${message}\n\nЭто сообщение подготовлено на демонстрационном сайте ОСНОВА.`
    : undefined;
  const emailQuery = `subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;
  return {
    email: `mailto:${CONTACTS.email}?${emailQuery}`,
    telegram: `https://t.me/${CONTACTS.telegramUsername}${body ? `?text=${encodeURIComponent(body)}` : ""}`,
    vk: CONTACTS.vkUrl,
  };
}

export function comparisonMessage(
  projects: readonly { number: string; name: string; area: number }[],
) {
  return `Хочу обсудить выбор между домами из каталога:\n${projects.map((project) => `• ${project.number} — «${project.name}», ${project.area} м²`).join("\n")}\n\nЭто демонстрационные концепции, не готовые строительные предложения.`;
}
